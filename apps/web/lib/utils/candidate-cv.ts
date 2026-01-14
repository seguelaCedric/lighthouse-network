import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if a candidate has a CV document
 * @param supabase - Supabase client
 * @param candidateId - Candidate ID
 * @returns true if candidate has at least one CV document (not deleted)
 */
export async function candidateHasCV(
  supabase: SupabaseClient,
  candidateId: string
): Promise<boolean> {
  // Check for CV using 'type' column (newer schema)
  const { data: docsByType, error: docsByTypeError } = await supabase
    .from("documents")
    .select("id")
    .eq("entity_type", "candidate")
    .eq("entity_id", candidateId)
    .eq("type", "cv")
    .is("deleted_at", null)
    .limit(1);

  if (!docsByTypeError && docsByType && docsByType.length > 0) {
    return true;
  }

  // Fallback: Check for CV using 'document_type' column (older schema)
  const { data: docsByDocumentType, error: docsByDocumentTypeError } = await supabase
    .from("documents")
    .select("id")
    .eq("entity_type", "candidate")
    .eq("entity_id", candidateId)
    .eq("document_type", "cv")
    .is("deleted_at", null)
    .limit(1);

  if (!docsByDocumentTypeError && docsByDocumentType && docsByDocumentType.length > 0) {
    return true;
  }

  return false;
}

/**
 * Get the URL of a candidate's CV document
 * @param supabase - Supabase client
 * @param candidateId - Candidate ID
 * @returns CV URL if found, null otherwise
 */
export async function getCandidateCVUrl(
  supabase: SupabaseClient,
  candidateId: string
): Promise<string | null> {
  // Check for CV using 'type' column (newer schema)
  const { data: docsByType } = await supabase
    .from("documents")
    .select("file_url")
    .eq("entity_type", "candidate")
    .eq("entity_id", candidateId)
    .eq("type", "cv")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (docsByType?.file_url) {
    return docsByType.file_url;
  }

  // Fallback: Check for CV using 'document_type' column (older schema)
  const { data: docsByDocumentType } = await supabase
    .from("documents")
    .select("file_url")
    .eq("entity_type", "candidate")
    .eq("entity_id", candidateId)
    .eq("document_type", "cv")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (docsByDocumentType?.file_url) {
    return docsByDocumentType.file_url;
  }

  return null;
}
