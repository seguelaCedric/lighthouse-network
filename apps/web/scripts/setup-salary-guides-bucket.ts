import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Manually load .env.local since tsx doesn't do it automatically
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Try multiple locations for .env.local
const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "../../.env.local"), // From apps/web to root
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../../../.env.local"),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  console.error("\nPlease ensure these are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const BUCKET_NAME = "salary-guides";

async function setupSalaryGuidesBucket() {
  // List existing buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error("Error listing buckets:", listError.message);
    process.exit(1);
  }

  console.log("Existing buckets:");
  buckets?.forEach(b => console.log(`  - ${b.name} | Public: ${b.public}`));

  // Check if salary-guides bucket exists
  const salaryGuidesBucket = buckets?.find(b => b.name === BUCKET_NAME);

  if (salaryGuidesBucket) {
    console.log(`\n✅ ${BUCKET_NAME} bucket already exists`);
    console.log(`   Public: ${salaryGuidesBucket.public}`);
    
    // Check if it's public
    if (!salaryGuidesBucket.public) {
      console.log(`\n⚠️  Warning: Bucket is not public. Making it public...`);
      const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
        public: true,
      });
      
      if (updateError) {
        console.error("Error making bucket public:", updateError.message);
        console.log("Please make the bucket public manually in the Supabase dashboard");
      } else {
        console.log("✅ Bucket is now public");
      }
    }
  } else {
    console.log(`\nCreating ${BUCKET_NAME} bucket...`);

    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true, // Must be public for direct download links
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        "application/pdf",
      ]
    });

    if (createError) {
      console.error("Error creating bucket:", createError.message);
      process.exit(1);
    }

    console.log(`✅ ${BUCKET_NAME} bucket created successfully!`);
    console.log("   Public: true");
    console.log("   File size limit: 10MB");
    console.log("   Allowed MIME types: application/pdf");
  }
}

setupSalaryGuidesBucket();

