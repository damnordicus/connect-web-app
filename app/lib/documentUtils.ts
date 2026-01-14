import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Calendar,
  Archive,
  File,
  Image as ImageIcon
} from "lucide-react";
import type { DocumentFolder, FolderTree } from "~/types/documents";

// File type validation map with icons and labels
export const ALLOWED_DOCUMENT_TYPES: Record<string, { ext: string; label: string; icon: any }> = {
  // Documents
  'application/pdf': { ext: 'pdf', label: 'PDF Document', icon: FileText },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', label: 'Word Document', icon: FileText },
  'application/msword': { ext: 'doc', label: 'Word Document', icon: FileText },
  'text/plain': { ext: 'txt', label: 'Text File', icon: FileText },
  'application/rtf': { ext: 'rtf', label: 'Rich Text', icon: FileText },

  // Spreadsheets
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', label: 'Excel Spreadsheet', icon: FileSpreadsheet },
  'application/vnd.ms-excel': { ext: 'xls', label: 'Excel Spreadsheet', icon: FileSpreadsheet },
  'text/csv': { ext: 'csv', label: 'CSV File', icon: FileSpreadsheet },

  // Presentations
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', label: 'PowerPoint', icon: Presentation },
  'application/vnd.ms-powerpoint': { ext: 'ppt', label: 'PowerPoint', icon: Presentation },

  // Calendar
  'text/calendar': { ext: 'ics', label: 'Calendar', icon: Calendar },

  // Archives
  'application/zip': { ext: 'zip', label: 'ZIP Archive', icon: Archive },
  'application/x-zip-compressed': { ext: 'zip', label: 'ZIP Archive', icon: Archive },

  // Images
  'image/jpeg': { ext: 'jpg', label: 'JPEG Image', icon: ImageIcon },
  'image/png': { ext: 'png', label: 'PNG Image', icon: ImageIcon },
  'image/gif': { ext: 'gif', label: 'GIF Image', icon: ImageIcon },
  'image/webp': { ext: 'webp', label: 'WebP Image', icon: ImageIcon },
};

/**
 * Validate if a file type is allowed for document uploads
 */
export function validateDocumentType(file: File): boolean {
  return file.type in ALLOWED_DOCUMENT_TYPES;
}

/**
 * Get file type info (label, icon, extension)
 */
export function getDocumentTypeInfo(mimeType: string) {
  return ALLOWED_DOCUMENT_TYPES[mimeType] || { ext: 'file', label: 'Unknown File', icon: File };
}

/**
 * Get icon component for a file type
 */
export function getFileIcon(fileType: string) {
  const info = getDocumentTypeInfo(fileType);
  return info.icon;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate storage path for a document
 */
export function generateDocumentPath(
  baseId: string,
  entityType: 'base' | 'org',
  entityId: string,
  fileName: string
): string {
  const fileExt = fileName.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);

  return `bases/${baseId}/${entityType}/${entityId}/documents/${timestamp}-${random}.${fileExt}`;
}

/**
 * Create a hierarchical folder tree from flat folder list
 */
export function createFolderStructure(folders: DocumentFolder[]): FolderTree[] {
  const folderMap = new Map<string, FolderTree>();
  const rootFolders: FolderTree[] = [];

  // Create tree nodes for all folders
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      folder,
      children: []
    });
  });

  // Build hierarchy
  folders.forEach(folder => {
    const node = folderMap.get(folder.id);
    if (!node) return;

    if (folder.parent === null) {
      // Root folder
      rootFolders.push(node);
    } else {
      // Child folder - add to parent's children
      const parentNode = folderMap.get(folder.parent);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // Parent not found, treat as root
        rootFolders.push(node);
      }
    }
  });

  return rootFolders;
}

/**
 * Get breadcrumb path from folder path string
 */
export function parseFolderPath(path: string): string[] {
  if (path === '/') return ['Home'];
  return ['Home', ...path.split('/').filter(Boolean)];
}

/**
 * Get folder depth (for enforcing max depth limit)
 */
export function getFolderDepth(path: string): number {
  if (path === '/') return 0;
  return path.split('/').filter(Boolean).length;
}

/**
 * Check if folder depth exceeds maximum allowed
 */
export function exceedsMaxDepth(path: string, maxDepth: number = 5): boolean {
  return getFolderDepth(path) >= maxDepth;
}

/**
 * Validate folder name (no special characters, reasonable length)
 */
export function validateFolderName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Folder name cannot be empty' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Folder name too long (max 50 characters)' };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\/\\]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: 'Folder name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Format date for display
 */
export function formatDocumentDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Find folder by path in folder list
 */
export function findFolderByPath(folders: DocumentFolder[], path: string): DocumentFolder | undefined {
  return folders.find(f => f.path === path);
}

/**
 * Get all child folders of a parent (recursive)
 */
export function getChildFolders(folders: DocumentFolder[], parentId: string): DocumentFolder[] {
  const children: DocumentFolder[] = [];

  const findChildren = (id: string) => {
    const directChildren = folders.filter(f => f.parent === id);
    directChildren.forEach(child => {
      children.push(child);
      findChildren(child.id); // Recursive
    });
  };

  findChildren(parentId);
  return children;
}
