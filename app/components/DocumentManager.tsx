import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import {
  Folder,
  File,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  Search,
  Home,
  FolderOpen,
  ArrowUpDown,
  AlertTriangle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { validateFolderName } from "~/lib/documentUtils";
import DocumentUpload from "./DocumentUpload";
import FolderManager, { FolderTreeItem } from "./FolderManager";
import {
  formatFileSize,
  formatDocumentDate,
  parseFolderPath,
  getFileIcon,
  createFolderStructure
} from "~/lib/documentUtils";
import type { Document, DocumentFolder } from "~/types/documents";
import type { PendingDocumentUpload } from "./DocumentUpload";
import { Form } from "react-router";

interface DocumentManagerProps {
  documents: Document[];
  folders: DocumentFolder[];
  entityType: "base" | "org";
  entityId: string;
  baseId: string;
  userId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  onDocumentSubmit?: (data: PendingDocumentUpload) => void;
}

type SortField = "name" | "date" | "size" | "type";
type SortDirection = "asc" | "desc";

export default function DocumentManager({
  documents,
  folders,
  entityType,
  entityId,
  baseId,
  userId,
  canUpload = true,
  canDelete = true,
  onDocumentSubmit
}: DocumentManagerProps) {
  const [currentPath, setCurrentPath] = useState("/");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]));

  // Form refs for folder operations
  const createFolderFormRef = useRef<HTMLFormElement>(null);
  const renameFolderFormRef = useRef<HTMLFormElement>(null);
  const deleteFolderFormRef = useRef<HTMLFormElement>(null);

  // State for folder operation data
  const [folderOperationData, setFolderOperationData] = useState<{
    action: string;
    folderId?: string;
    folderName?: string;
    parentPath?: string;
    newName?: string;
  }>({ action: "" });

  // Dialog state for rename/delete operations
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState("");

  // Filter documents by current folder
  const currentFolderDocuments = documents.filter(
    doc => doc.folder_path === currentPath && !doc.is_deleted
  );

  // Filter by search query
  const filteredDocuments = searchQuery
    ? currentFolderDocuments.filter(doc =>
        doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentFolderDocuments;

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "name":
        comparison = a.file_name.localeCompare(b.file_name);
        break;
      case "date":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "size":
        comparison = a.file_size - b.file_size;
        break;
      case "type":
        comparison = a.file_type.localeCompare(b.file_type);
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Get folders in current path
  const currentFolderSubfolders = folders.filter(
    f => f.parent === (currentPath === "/" ? null : folders.find(folder => folder.path === currentPath)?.id)
  );

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Navigate to folder
  const navigateToFolder = (path: string) => {
    setCurrentPath(path);
    setSearchQuery("");
  };

  // Breadcrumb navigation
  const breadcrumbs = parseFolderPath(currentPath);

  // Get path for breadcrumb
  const getBreadcrumbPath = (index: number): string => {
    if (index === 0) return "/"; // Home
    const pathParts = currentPath.split("/").filter(Boolean);
    return "/" + pathParts.slice(0, index).join("/");
  };

  // Handle folder operations
  const handleCreateFolder = (name: string, parentPath: string) => {
    setFolderOperationData({
      action: "create-folder",
      folderName: name,
      parentPath: parentPath
    });
    // Use setTimeout to ensure state is updated before form submission
    setTimeout(() => {
      createFolderFormRef.current?.requestSubmit();
    }, 0);
  };

  const handleRenameFolder = (name: string, parentPath: string) => {

  }

  const handleDeleteFolder = (name: string, parentPath: string) => {
    
  }

  // Open rename dialog
  const openRenameDialog = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setNewFolderName(folder.name);
    setFolderError("");
    setRenameDialogOpen(true);
  };

  // Submit rename operation
  const submitRenameFolder = () => {
    if (!selectedFolder) return;

    setFolderError("");

    // Validate folder name
    const validation = validateFolderName(newFolderName);
    if (!validation.valid) {
      setFolderError(validation.error || "Invalid folder name");
      return;
    }

    // Check for duplicate name
    const existingFolder = folders.find(
      f => f.parent === selectedFolder.parent &&
           f.name.toLowerCase() === newFolderName.toLowerCase() &&
           f.id !== selectedFolder.id
    );
    if (existingFolder) {
      setFolderError("A folder with this name already exists");
      return;
    }

    setFolderOperationData({
      action: "rename-folder",
      folderId: selectedFolder.id,
      newName: newFolderName
    });
    setTimeout(() => {
      renameFolderFormRef.current?.requestSubmit();
      setRenameDialogOpen(false);
      setSelectedFolder(null);
      setNewFolderName("");
    }, 0);
  };

  // Open delete dialog
  const openDeleteDialog = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setFolderError("");
    setDeleteDialogOpen(true);
  };

  // Submit delete operation
  const submitDeleteFolder = () => {
    if (!selectedFolder) return;

    setFolderOperationData({
      action: "delete-folder",
      folderId: selectedFolder.id
    });
    setTimeout(() => {
      deleteFolderFormRef.current?.requestSubmit();
      setDeleteDialogOpen(false);
      setSelectedFolder(null);
      // Navigate to root if we're in the deleted folder
      if (currentPath === selectedFolder.path || currentPath.startsWith(selectedFolder.path + "/")) {
        setCurrentPath("/");
      }
    }, 0);
  };

  // Download document
  const handleDownload = (documentId: string) => {
    window.open(`/api/download?id=${documentId}`, '_blank');
  };

  // Render folder tree (recursive)
  const renderFolderTree = () => {
    const folderTree = createFolderStructure(folders);

    const renderTree = (tree: any[], depth: number = 0) => {
      return tree.map(node => (
        <FolderTreeItem
          key={node.folder.id}
          folder={node.folder}
          currentPath={currentPath}
          onNavigate={navigateToFolder}
          onRename={openRenameDialog}
          onDelete={openDeleteDialog}
        >
          {node.children.length > 0 && renderTree(node.children, depth + 1)}
        </FolderTreeItem>
      ));
    };

    return renderTree(folderTree);
  };

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Documents</h2>
        <div className="flex items-center gap-2">
          {canUpload && (
            <>
              <FolderManager
                folders={folders}
                currentPath={currentPath}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
              />
              <Button type="button" onClick={() => setUploadModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Sidebar - Folder Tree */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div
              className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-muted ${
                currentPath === "/" ? "bg-muted" : ""
              }`}
              onClick={() => navigateToFolder("/")}
            >
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">All Documents</span>
            </div>
            {renderFolderTree()}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="space-y-4">
              {/* Breadcrumb */}
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{crumb}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            className="cursor-pointer"
                            onClick={() => navigateToFolder(getBreadcrumbPath(index))}
                          >
                            {crumb}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Subfolders */}
            {currentFolderSubfolders.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Folders</p>
                <div className="grid grid-cols-3 gap-2">
                  {currentFolderSubfolders.map(folder => (
                    <div
                      key={folder.id}
                      className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted"
                      onClick={() => navigateToFolder(folder.path)}
                    >
                      <Folder className="h-5 w-5 text-primary" />
                      <span className="text-sm truncate">{folder.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Table */}
            {sortedDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No documents match your search"
                    : "No documents in this folder"}
                </p>
                {canUpload && !searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    type="button"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    Upload Documents
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => toggleSort("type")}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => toggleSort("size")}
                    >
                      <div className="flex items-center gap-1">
                        Size
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDocuments.map(doc => {
                    const Icon = getFileIcon(doc.file_type);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">{doc.file_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.file_type.split('/')[1]?.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                        <TableCell>{formatDocumentDate(doc.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownload(doc.id)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              {canDelete && (
                                <Form method="post">
                                  <input type="hidden" name="actionType" value="delete-document" />
                                  <input type="hidden" name="documentId" value={doc.id} />
                                  <button type="submit" className="w-full">
                                    <DropdownMenuItem className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </button>
                                </Form>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <DocumentUpload
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={onDocumentSubmit || (() => {})}
        folders={folders}
        currentPath={currentPath}
        entityType={entityType}
        entityId={entityId}
        baseId={baseId}
        userId={userId}
      />

      {/* Hidden forms for folder operations */}
      <Form method="post" ref={createFolderFormRef} className="hidden">
        <input type="hidden" name="actionType" value="create-folder" />
        <input type="hidden" name="folderName" value={folderOperationData.folderName || ""} />
        <input type="hidden" name="parentPath" value={folderOperationData.parentPath || ""} />
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="folders" value={JSON.stringify(folders)} />
      </Form>

      <Form method="post" ref={renameFolderFormRef} className="hidden">
        <input type="hidden" name="actionType" value="rename-folder" />
        <input type="hidden" name="folderId" value={folderOperationData.folderId || ""} />
        <input type="hidden" name="newName" value={folderOperationData.newName || ""} />
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="folders" value={JSON.stringify(folders)} />
      </Form>

      <Form method="post" ref={deleteFolderFormRef} className="hidden">
        <input type="hidden" name="actionType" value="delete-folder" />
        <input type="hidden" name="folderId" value={folderOperationData.folderId || ""} />
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="folders" value={JSON.stringify(folders)} />
      </Form>

      {/* Rename Folder Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-folder-name">New Folder Name</Label>
              <Input
                id="rename-folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter new folder name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitRenameFolder();
                  }
                }}
              />
            </div>
            {folderError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{folderError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRenameFolder}>Rename</Button>
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
            <Button variant="destructive" onClick={submitDeleteFolder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
