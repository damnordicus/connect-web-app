import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent } from "./ui/card";
import {
  Upload,
  X,
  File,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import {
  validateDocumentType,
  formatFileSize,
  getDocumentTypeInfo,
  ALLOWED_DOCUMENT_TYPES
} from "~/lib/documentUtils";
import type { DocumentFolder } from "~/types/documents";

export interface PendingDocumentUpload {
  files: File[];
  folderPath: string;
  description: string;
}

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PendingDocumentUpload) => void;
  folders: DocumentFolder[];
  currentPath: string;
  entityType: "base" | "org";
  entityId: string;
  baseId: string;
  userId: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function DocumentUpload({
  isOpen,
  onClose,
  onSubmit,
  folders,
  currentPath,
  entityType,
  entityId,
  baseId,
  userId
}: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folderPath, setFolderPath] = useState(currentPath);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList | File[]): { valid: File[]; invalid: string[] } => {
    const valid: File[] = [];
    const invalid: string[] = [];

    Array.from(files).forEach(file => {
      // Check file type
      if (!validateDocumentType(file)) {
        invalid.push(`${file.name}: Invalid file type`);
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        invalid.push(`${file.name}: File too large (max 50MB)`);
        return;
      }

      // Check for duplicates
      if (selectedFiles.some(f => f.name === file.name)) {
        invalid.push(`${file.name}: Already added`);
        return;
      }

      valid.push(file);
    });

    return { valid, invalid };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const { valid, invalid } = validateFiles(e.target.files);

    if (invalid.length > 0) {
      setErrors(invalid);
    } else {
      setErrors([]);
    }

    if (valid.length > 0) {
      setSelectedFiles(prev => [...prev, ...valid]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const { valid, invalid } = validateFiles(e.dataTransfer.files);

    if (invalid.length > 0) {
      setErrors(invalid);
    } else {
      setErrors([]);
    }

    if (valid.length > 0) {
      setSelectedFiles(prev => [...prev, ...valid]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setErrors([]);
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setDescription("");
    setErrors([]);
    setFolderPath(currentPath);
    onClose();
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) return;

    onSubmit({
      files: selectedFiles,
      folderPath,
      description
    });

    handleClose();
  };

  const allowedTypes = Object.keys(ALLOWED_DOCUMENT_TYPES).join(',');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* Folder Selection */}
          <div className="space-y-2">
            <Label>Upload to Folder</Label>
            <Select value={folderPath} onValueChange={setFolderPath}>
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="/">Root (All Documents)</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.path}>
                    {folder.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drag and Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-2">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Maximum file size: 50MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes}
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => {
                  const typeInfo = getDocumentTypeInfo(file.type);
                  const Icon = typeInfo.icon;

                  return (
                    <Card key={index}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {typeInfo.label} • {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for these documents..."
              rows={3}
            />
          </div>

          {/* Info Alert */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Document uploads require approval from an administrator before they become visible.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" disabled={selectedFiles.length === 0} onClick={handleSubmit}>
              Submit for Approval
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
