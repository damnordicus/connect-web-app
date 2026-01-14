import { createClient } from "@supabase/supabase-js";
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const documentId = searchParams.get("id");

  if (!documentId) {
    throw new Response("Document ID is required", { status: 400 });
  }

  // Fetch document metadata from database
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("is_deleted", false)
    .single();

  if (documentError || !document) {
    throw new Response("Document not found", { status: 404 });
  }

  // TODO: Add authentication/authorization check here
  // Verify that the requesting user has access to this entity
  // const userId = await getUserIdFromSession(request);
  // if (!hasAccess(userId, document.entity_type, document.entity_id)) {
  //   throw new Response("Unauthorized", { status: 403 });
  // }

  // Generate signed URL for download (60 second expiry)
  const { data: urlData, error: urlError } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.storage_path, 60);

  if (urlError || !urlData) {
    console.error("Error creating signed URL:", urlError);
    throw new Response("Failed to generate download link", { status: 500 });
  }

  // Redirect to the signed URL
  return redirect(urlData.signedUrl);
};
