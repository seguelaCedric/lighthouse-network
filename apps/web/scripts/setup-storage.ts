import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupStorage() {
  // List existing buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error("Error listing buckets:", listError.message);
    process.exit(1);
  }

  console.log("Existing buckets:");
  buckets?.forEach(b => console.log(`  - ${b.name} | Public: ${b.public}`));

  // Check if documents bucket exists
  const documentsBucket = buckets?.find(b => b.name === "documents");

  if (documentsBucket) {
    console.log("\n✅ Documents bucket already exists");
  } else {
    console.log("\nCreating documents bucket...");

    const { error: createError } = await supabase.storage.createBucket("documents", {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "image/jpg"
      ]
    });

    if (createError) {
      console.error("Error creating bucket:", createError.message);
      process.exit(1);
    }

    console.log("✅ Documents bucket created successfully!");
  }
}

setupStorage();
