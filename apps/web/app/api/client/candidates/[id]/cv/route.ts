import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientSessionFromCookie } from "@/lib/auth/client-session";

/**
 * GET /api/client/candidates/[id]/cv
 * Download the CV for a candidate that has been shortlisted for this client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getClientSessionFromCookie();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: candidateId } = await params;
    const supabase = await createClient();

    // Verify the client has access to this candidate through a submission
    // Client can only access CV if candidate has been shortlisted for one of their jobs
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(`
        id,
        job_id,
        jobs!inner (
          id,
          client_id
        )
      `)
      .eq("candidate_id", candidateId)
      .eq("jobs.client_id", session.clientId)
      .in("status", ["shortlisted", "interviewing", "offer", "placed"])
      .limit(1)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "You don't have access to this candidate's CV" },
        { status: 403 }
      );
    }

    // Get the candidate's CV document
    const { data: cvDocument, error: docError } = await supabase
      .from("documents")
      .select("id, file_name, file_path, file_url, mime_type")
      .eq("entity_type", "candidate")
      .eq("entity_id", candidateId)
      .eq("document_type", "cv")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (docError || !cvDocument) {
      return NextResponse.json(
        { error: "CV not found for this candidate" },
        { status: 404 }
      );
    }

    // Create a signed URL for the CV (expires in 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("documents")
      .createSignedUrl(cvDocument.file_path, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error("Failed to create signed URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      );
    }

    // Log the download
    await supabase.from("activity_logs").insert({
      activity_type: "cv_downloaded",
      entity_type: "candidate",
      entity_id: candidateId,
      metadata: {
        downloaded_by_client: session.clientId,
        submission_id: submission.id,
        document_id: cvDocument.id,
      },
    });

    return NextResponse.json({
      data: {
        downloadUrl: signedUrlData.signedUrl,
        fileName: cvDocument.file_name,
        mimeType: cvDocument.mime_type,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
