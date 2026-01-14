import { createClient } from "@supabase/supabase-js";
import type { LoaderFunctionArgs } from "react-router";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const entityType = searchParams.get("entityType"); // 'base' or 'org'
  const entityId = searchParams.get("entityId");
  const baseId = searchParams.get("baseId");
  const folderPath = searchParams.get("folder") || "/";

  if (!entityType || !entityId) {
    return { error: "Missing required parameters", documents: [], folders: [] };
  }

  // Fetch documents from database
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("folder_path", folderPath)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (documentsError) {
    console.error("Error fetching documents:", documentsError);
    return { error: documentsError.message, documents: [], folders: [] };
  }

  // Fetch folder structure from entity metadata
  let folders = [];

  try {
    if (entityType === "org") {
      const { data: orgData, error: orgError } = await supabase
        .from("organization")
        .select("document_folders")
        .eq("id", entityId)
        .single();

      if (!orgError && orgData?.document_folders) {
        folders = orgData.document_folders.folders || [];
      }
    } else if (entityType === "base") {
      const { data: baseData, error: baseError } = await supabase
        .from("appFields")
        .select("document_folders")
        .eq("base_id", baseId)
        .single();

      if (!baseError && baseData?.document_folders) {
        folders = baseData.document_folders.folders || [];
      }
    }
  } catch (error) {
    console.error("Error fetching folders:", error);
  }

  return {
    documents: documents || [],
    folders: folders,
    currentPath: folderPath
  };
};
