import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Folder, FolderPlus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { validateFolderName, exceedsMaxDepth } from "~/lib/documentUtils";
import type { DocumentFolder } from "~/types/documents";

interface FolderManagerProps {
  folders: DocumentFolder[];
  currentPath: string;
  onCreateFolder: (name: string, parentPath: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

export default function FolderManager({
  folders,
  currentPath,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder
}: FolderManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null);
  const [error, setError] = useState<string>("");

  const handleCreateFolder = () => {
    setError("");

    // Validate folder name
    const validation = validateFolderName(newFolderName);
    if (!validation.valid) {
      setError(validation.error || "Invalid folder name");
      return;
    }

    // Check if already at max depth
    if (exceedsMaxDepth(currentPath)) {
      setError("Maximum folder depth (5 levels) reached");
      return;
    }

    // Check for duplicate name in current folder
    const existingFolder = folders.find(
      f => f.parent === currentPath && f.name.toLowerCase() === newFolderName.toLowerCase()
    );
    if (existingFolder) {
      setError("A folder with this name already exists");
      return;
    }

    onCreateFolder(newFolderName, currentPath);
    setNewFolderName("");
    setCreateDialogOpen(false);
  };

  const handleRenameFolder = () => {
    if (!selectedFolder) return;

    setError("");

    // Validate folder name
    const validation = validateFolderName(newFolderName);
    if (!validation.valid) {
      setError(validation.error || "Invalid folder name");
      return;
    }

    // Check for duplicate name
    const existingFolder = folders.find(
      f => f.parent === selectedFolder.parent &&
           f.name.toLowerCase() === newFolderName.toLowerCase() &&
           f.id !== selectedFolder.id
    );
    if (existingFolder) {
      setError("A folder with this name already exists");
      return;
    }

    onRenameFolder(selectedFolder.id, newFolderName);
    setNewFolderName("");
    setSelectedFolder(null);
    setRenameDialogOpen(false);
  };

  const handleDeleteFolder = () => {
    if (!selectedFolder) return;

    onDeleteFolder(selectedFolder.id);
    setSelectedFolder(null);
    setDeleteDialogOpen(false);
  };

  const openRenameDialog = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setNewFolderName(folder.name);
    setError("");
    setRenameDialogOpen(true);
  };

  const openDeleteDialog = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setError("");
    setDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    setNewFolderName("");
    setError("");
    setCreateDialogOpen(true);
  };

  return (
    <>
      {/* Create Folder Button */}
      <Button
        onClick={openCreateDialog}
        size="sm"
        variant="outline"
        type="button"
        disabled={exceedsMaxDepth(currentPath)}
      >
        <FolderPlus className="h-4 w-4 mr-2" />
        New Folder
      </Button>

      {/* Create Folder Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-folder">New Folder Name</Label>
              <Input
                id="rename-folder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter new folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameFolder();
                  }
                }}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to delete "{selectedFolder?.name}"?
                <br />
                <strong>This will also delete all documents and subfolders inside it.</strong>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFolder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Folder Tree Component for navigation
interface FolderTreeItemProps {
  folder: DocumentFolder;
  currentPath: string;
  onNavigate: (path: string) => void;
  onRename: (folder: DocumentFolder) => void;
  onDelete: (folder: DocumentFolder) => void;
  children?: React.ReactNode;
}

export function FolderTreeItem({
  folder,
  currentPath,
  onNavigate,
  onRename,
  onDelete,
  children
}: FolderTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isActive = currentPath === folder.path;

  return (
    <div className="ml-4">
      <div
        className={`flex items-center justify-between py-1 px-2 rounded hover:bg-muted cursor-pointer group ${
          isActive ? 'bg-muted' : ''
        }`}
      >
        <div className="flex items-center gap-2 flex-1" onClick={() => onNavigate(folder.path)}>
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{folder.name}</span>
        </div>
        <div className="hidden group-hover:flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onRename(folder);
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {children && <div className="ml-2">{children}</div>}
    </div>
  );
}
