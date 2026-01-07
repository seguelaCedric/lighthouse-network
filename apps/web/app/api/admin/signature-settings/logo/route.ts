import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "avatars";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("auth_id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { error: NextResponse.json({ error: "No organization found" }, { status: 404 }) };
  }

  if (!userData.role || !["owner", "admin"].includes(userData.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, organizationId: userData.organization_id };
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const result = await requireAdmin();
    if (result.error) return result.error;

    const { supabase, organizationId } = result;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const timestamp = Date.now();
    const fileName = sanitizeFilename(file.name);
    const filePath = `signature-logos/${organizationId}/${timestamp}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload logo:", uploadError);
      return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return NextResponse.json({ logoUrl: publicUrl });
  } catch (error) {
    console.error("Signature logo upload error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
