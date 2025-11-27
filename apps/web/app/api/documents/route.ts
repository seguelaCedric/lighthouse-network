import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Storage bucket name
const BUCKET_NAME = "documents";

// Allowed file types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const uploadSchema = z.object({
  entity_type: z.enum(["candidate", "client", "job"]),
  entity_id: z.string().uuid(),
  document_type: z.enum([
    "cv",
    "certification",
    "passport",
    "visa",
    "medical",
    "reference",
    "contract",
    "photo",
    "other",
  ]),
  expiry_date: z.string().datetime().optional(),
  description: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("id, organization_id")
      .eq("auth_id", user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadata = formData.get("metadata") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Parse and validate metadata
    let parsedMetadata: z.infer<typeof uploadSchema>;
    try {
      const metadataObj = metadata ? JSON.parse(metadata) : {};
      const parseResult = uploadSchema.safeParse(metadataObj);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Invalid metadata", details: parseResult.error.flatten() },
          { status: 400 }
        );
      }
      parsedMetadata = parseResult.data;
    } catch {
      return NextResponse.json(
        { error: "Invalid metadata JSON" },
        { status: 400 }
      );
    }

    // Generate file path
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "file";
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
    const filePath = `${parsedMetadata.entity_type}/${parsedMetadata.entity_id}/${timestamp}-${sanitizedName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    // Save document record
    const { data: documentRecord, error: dbError } = await supabase
      .from("documents")
      .insert({
        entity_type: parsedMetadata.entity_type,
        entity_id: parsedMetadata.entity_id,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        document_type: parsedMetadata.document_type,
        expiry_date: parsedMetadata.expiry_date || null,
        description: parsedMetadata.description || null,
        uploaded_by: userData.id,
        organization_id: userData.organization_id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to delete the uploaded file
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      return NextResponse.json(
        { error: "Failed to save document record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: documentRecord }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const entityType = request.nextUrl.searchParams.get("entity_type");
    const entityId = request.nextUrl.searchParams.get("entity_id");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entity_type and entity_id are required" },
        { status: 400 }
      );
    }

    // Fetch documents
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
