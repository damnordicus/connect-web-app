// Document-related TypeScript interfaces and types

export interface DocumentFolder {
  id: string;
  name: string;
  path: string;
  parent: string | null;
}

export interface Document {
  id: string;
  entity_type: "base" | "org";
  entity_id: string;
  base_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  folder_path: string;
  created_at: string;
  updated_at: string;
  uploaded_by?: string;
  description?: string;
  tags?: string[];
  is_deleted: boolean;
}

export interface FolderTree {
  folder: DocumentFolder;
  children: FolderTree[];
  documents?: Document[];
}

export interface DocumentUploadRequest {
  files: FileMetadata[];
  folderPath: string;
  description?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  folder: string;
}
