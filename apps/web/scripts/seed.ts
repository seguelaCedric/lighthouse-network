/**
 * Seed Script for Lighthouse Crew Network
 *
 * Creates test data for development:
 * - 1 Agency (Lighthouse Careers)
 * - 1 Admin User
 * - 20 Sample Candidates (variety of positions/experience)
 * - 3 Sample Jobs
 * - 2 Sample Briefs
 *
 * Run: cd apps/web && npx tsx scripts/seed.ts
 *
 * Environment variables (from .env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (required for admin operations)
 * - SEED_USER_EMAIL (optional, defaults to admin@lighthouse.careers)
 * - SEED_USER_PASSWORD (optional, defaults to TestPassword123!)
 */

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
  console.error("Missing environment variables:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "set" : "MISSING");
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "set" : "MISSING");
  console.error("\nNote: Seed script requires service role key for admin operations.");
  console.error("Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.");
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test user email - override with SEED_USER_EMAIL env var
const TEST_USER_EMAIL = process.env.SEED_USER_EMAIL || "admin@lighthouse.careers";
const TEST_USER_PASSWORD = process.env.SEED_USER_PASSWORD || "TestPassword123!";

// Check for --force flag to delete existing data
const FORCE_RESEED = process.argv.includes("--force");

// ============================================================================
// SEED DATA
// ============================================================================

const AGENCY = {
  type: "agency" as const,
  name: "Lighthouse Careers",
  slug: "lighthouse-careers",
  email: "contact@lighthouse.careers",
  phone: "+44 7700 900000",
  website: "https://lighthouse.careers",
  city: "London",
  country: "United Kingdom",
  commission_rate: 15,
  subscription_tier: "professional",
  subscription_status: "active",
  settings: {},
};

const POSITIONS = [
  { title: "Captain", category: "deck" as const },
  { title: "Chief Officer", category: "deck" as const },
  { title: "Chief Stewardess", category: "interior" as const },
  { title: "2nd Stewardess", category: "interior" as const },
  { title: "Chief Engineer", category: "engineering" as const },
  { title: "2nd Engineer", category: "engineering" as const },
  { title: "Head Chef", category: "galley" as const },
  { title: "Sous Chef", category: "galley" as const },
  { title: "Deckhand", category: "deck" as const },
  { title: "Bosun", category: "deck" as const },
];

const FIRST_NAMES = [
  "James", "Sarah", "Michael", "Emma", "David", "Sophie", "Thomas", "Olivia",
  "Daniel", "Charlotte", "William", "Emily", "Alexander", "Grace", "Benjamin",
  "Lucy", "Samuel", "Hannah", "Joseph", "Amelia",
];

const LAST_NAMES = [
  "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia",
  "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Moore",
  "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
];

const NATIONALITIES = [
  "British", "Australian", "South_African", "American", "French",
  "Dutch", "Italian", "Spanish", "New_Zealander", "Canadian",
];

const AVAILABILITY_STATUSES = [
  "available", "available", "available", // Weight toward available
  "looking", "looking",
  "employed",
  "unavailable",
] as const;

const VERIFICATION_TIERS = [
  "basic",
  "identity", "identity",
  "verified", "verified", "verified",
  "premium", "premium",
] as const; // Weight toward higher

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCandidates(count: number, agencyId: string) {
  const candidates = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const position = randomElement(POSITIONS);
    const yearsExperience = randomBetween(2, 15);
    const yachtSizeMin = randomBetween(30, 50);
    const yachtSizeMax = randomBetween(yachtSizeMin + 10, 100);
    const availability = randomElement(AVAILABILITY_STATUSES);
    const verification = randomElement(VERIFICATION_TIERS);

    // Higher experience = more likely to have certs
    const hasStcw = yearsExperience >= 3 || Math.random() > 0.3;
    const hasEng1 = yearsExperience >= 2 || Math.random() > 0.4;
    const hasSchengen = Math.random() > 0.3;
    const hasB1B2 = Math.random() > 0.5;
    const hasC1D = hasB1B2 && Math.random() > 0.6;

    candidates.push({
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      phone: `+44 7${randomBetween(100, 999)} ${randomBetween(100000, 999999)}`,
      nationality: randomElement(NATIONALITIES),
      primary_position: position.title,
      position_category: position.category,
      years_experience: yearsExperience,
      yacht_size_min: yachtSizeMin,
      yacht_size_max: yachtSizeMax,
      preferred_yacht_size_min: yachtSizeMin,
      preferred_yacht_size_max: yachtSizeMax + 20,
      availability_status: availability,
      available_from: availability === "available"
        ? new Date().toISOString()
        : availability === "employed"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Available in 30 days
        : availability === "looking"
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Available in 7 days
        : null,
      verification_tier: verification,
      has_stcw: hasStcw,
      stcw_expiry: hasStcw ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
      has_eng1: hasEng1,
      eng1_expiry: hasEng1 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
      has_schengen: hasSchengen,
      has_b1b2: hasB1B2,
      has_c1d: hasC1D,
      is_smoker: Math.random() > 0.7,
      has_visible_tattoos: Math.random() > 0.6,
      is_couple: false,
      desired_salary_min: randomBetween(3000, 6000),
      desired_salary_max: randomBetween(6000, 12000),
      salary_currency: "EUR",
      preferred_regions: ["Mediterranean", "Caribbean"].slice(0, randomBetween(1, 2)),
      profile_summary: `Experienced ${position.title} with ${yearsExperience} years in the yachting industry. ` +
        `Worked on vessels from ${yachtSizeMin}m to ${yachtSizeMax}m. ` +
        `${hasStcw ? "STCW certified. " : ""}${hasEng1 ? "Valid ENG1. " : ""}` +
        `${hasSchengen ? "Schengen visa holder. " : ""}`,
    });
  }

  return candidates;
}

const JOBS = [
  {
    title: "Chief Stewardess",
    position_category: "interior" as const,
    vessel_name: "M/Y Serenity",
    vessel_type: "Motor Yacht",
    vessel_size_meters: 55,
    contract_type: "permanent" as const,
    primary_region: "Mediterranean",
    salary_min: 5500,
    salary_max: 6500,
    salary_currency: "EUR",
    salary_period: "monthly",
    status: "open" as const,
    visibility: "network" as const,
    requirements: {
      experience_years_min: 5,
      certifications_required: ["STCW", "ENG1"],
      certifications_preferred: ["WSET Level 2"],
      languages_required: ["English"],
      languages_preferred: ["French"],
      non_smoker: true,
    },
    requirements_text: `Looking for an experienced Chief Stewardess for a 55m Motor Yacht based in the Med.

Requirements:
- Minimum 5 years experience as Chief Stew
- STCW and ENG1 required
- Wine knowledge preferred (WSET Level 2+)
- Fluent English, French a plus
- Non-smoker
- Available for Med summer season

The yacht does charter and private use. Great crew, excellent captain.`,
  },
  {
    title: "Captain",
    position_category: "deck" as const,
    vessel_name: "M/Y Azure Dream",
    vessel_type: "Motor Yacht",
    vessel_size_meters: 65,
    contract_type: "rotational" as const,
    primary_region: "Caribbean",
    salary_min: 11000,
    salary_max: 13000,
    salary_currency: "EUR",
    salary_period: "monthly",
    requirements: {
      experience_years_min: 10,
      certifications_required: ["Master 3000GT", "STCW", "ENG1"],
      certifications_preferred: ["GMDSS GOC"],
      visas_required: ["B1/B2", "C1/D"],
      languages_required: ["English"],
    },
    requirements_text: `Seeking an experienced Captain for a 65m Motor Yacht with Caribbean and Florida itinerary.

Requirements:
- Master 3000GT or equivalent
- 10+ years experience, 5+ as Captain
- B1/B2 and C1/D visas essential
- Charter experience required
- Strong leadership skills
- Rotational position (8 weeks on/off)`,
    status: "open" as const,
    visibility: "network" as const,
  },
  {
    title: "Chief Engineer",
    position_category: "engineering" as const,
    vessel_name: "S/Y Wind Spirit",
    vessel_type: "Sailing Yacht",
    vessel_size_meters: 50,
    contract_type: "permanent" as const,
    primary_region: "Worldwide",
    salary_min: 6500,
    salary_max: 7500,
    salary_currency: "EUR",
    salary_period: "monthly",
    requirements: {
      experience_years_min: 7,
      certifications_required: ["Y4 Engineer", "STCW", "ENG1"],
      certifications_preferred: ["AEC"],
      languages_required: ["English"],
    },
    requirements_text: `Chief Engineer needed for a beautiful 50m Sailing Yacht with worldwide itinerary.

Requirements:
- Y4 or equivalent engineering certificate
- 7+ years yacht engineering experience
- Sailing yacht experience preferred
- Strong electrical and mechanical skills
- Available for worldwide travel
- Permanent position`,
    status: "open" as const,
    visibility: "private" as const,
  },
];

const BRIEFS = [
  {
    status: "new" as const,
    source: "email" as const,
    source_identifier: "client@example.com",
    raw_content: `Hi,

We're looking for a Chief Stewardess for our 48m motor yacht based in Antibes.

Requirements:
- At least 4 years Chief Stew experience
- STCW and ENG1 current
- Silver service trained
- Wine knowledge (WSET preferred)
- Available from March 2025
- Mediterranean summer, Caribbean winter
- Non-smoker essential
- No visible tattoos

Salary around 5500-6000 EUR/month plus tips.

Please send CVs asap!

Best,
John`,
    received_at: new Date().toISOString(),
  },
  {
    status: "parsed" as const,
    source: "whatsapp" as const,
    source_identifier: "+33 6 12 34 56 78",
    raw_content: `Need a deckhand urgently for 42m MY
Starting next week
Med season
2 years experience min
STCW essential
3500 EUR/month`,
    received_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    parsed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    parsing_confidence: 0.85,
    parsed_requirements: {
      position: "Deckhand",
      positionCategory: "deck",
      vessel: {
        name: null,
        type: "motor",
        sizeMeters: 42,
      },
      contract: {
        type: "seasonal",
        rotation: null,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      compensation: {
        salaryMin: 3500,
        salaryMax: 3500,
        currency: "EUR",
      },
      requirements: {
        minExperience: 2,
        minYachtSize: null,
        certifications: ["STCW"],
        languages: [],
        other: [],
      },
      location: {
        cruisingAreas: ["Mediterranean"],
        base: null,
      },
      ambiguities: [
        {
          field: "vessel.name",
          issue: "Vessel name not provided",
          suggestedQuestion: "What is the name of the yacht?",
        },
      ],
      confidence: 0.85,
    },
    parsing_ambiguities: ["Vessel name not provided"],
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seed() {
  console.log("🌱 Starting seed...\n");

  // Check if agency already exists
  console.log("Checking for existing data...");
  const { data: existingAgency } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", AGENCY.slug)
    .single();

  if (existingAgency) {
    if (FORCE_RESEED) {
      console.log("🗑️  Force flag detected. Deleting existing data...");

      // Delete in order to respect foreign keys
      await supabase.from("applications").delete().eq("agency_id", existingAgency.id);
      await supabase.from("briefs").delete().eq("assigned_agency_id", existingAgency.id);
      await supabase.from("jobs").delete().eq("created_by_agency_id", existingAgency.id);
      await supabase.from("candidate_agency_relationships").delete().eq("agency_id", existingAgency.id);
      await supabase.from("candidates").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
      await supabase.from("users").delete().eq("organization_id", existingAgency.id);
      await supabase.from("organizations").delete().eq("id", existingAgency.id);

      console.log("   ✅ Existing data deleted\n");
    } else {
      console.log("⚠️  Agency 'lighthouse-careers' already exists. Skipping seed to avoid duplicates.");
      console.log("   To re-seed, run: npx tsx scripts/seed.ts --force\n");

      // Still output helpful info
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, email")
        .eq("organization_id", existingAgency.id)
        .limit(1)
        .single() as { data: { id: string; email: string } | null };

      const { count: candidateCount } = await supabase
        .from("candidates")
        .select("*", { count: "exact", head: true });

      const { count: jobCount } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true });

      const { data: briefs } = await supabase
        .from("briefs")
        .select("id, status")
        .limit(5);

      console.log("📊 Current data:");
      console.log(`   Agency ID: ${existingAgency.id}`);
      console.log(`   User: ${existingUser?.email || "None"}`);
      console.log(`   Candidates: ${candidateCount || 0}`);
      console.log(`   Jobs: ${jobCount || 0}`);
      console.log(`   Briefs: ${briefs?.length || 0}`);

      if (briefs?.length) {
        console.log("\n📋 Brief IDs for testing:");
        briefs.forEach((b) => console.log(`   - ${b.id} (${b.status})`));
      }

      return;
    }
  }

  try {
    // 1. Create agency
    console.log("1️⃣  Creating agency...");
    const { data: agency, error: agencyError } = await supabase
      .from("organizations")
      .insert(AGENCY)
      .select()
      .single();

    if (agencyError) {
      throw new Error(`Failed to create agency: ${agencyError.message}`);
    }
    console.log(`   ✅ Created: ${agency.name} (${agency.id})`);

    // 2. Create auth user and link to organization
    console.log("\n2️⃣  Creating test user...");

    // First create the auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      // User might already exist in auth
      if (authError.message.includes("already")) {
        console.log(`   ⚠️  Auth user ${TEST_USER_EMAIL} already exists`);
        // Try to get the existing user
        const { data: listData } = await supabase.auth.admin.listUsers();
        const users = listData?.users || [];
        const existingAuthUser = users.find((u: { email?: string }) => u.email === TEST_USER_EMAIL);
        if (existingAuthUser) {
          // Create the user record linked to existing auth user
          const { data: user, error: userError } = await supabase
            .from("users")
            .insert({
              auth_id: existingAuthUser.id,
              organization_id: agency.id,
              role: "admin",
              email: TEST_USER_EMAIL,
              first_name: "Admin",
              last_name: "User",
              is_active: true,
            })
            .select()
            .single();

          if (userError && !userError.message.includes("duplicate")) {
            throw new Error(`Failed to create user: ${userError.message}`);
          }
          console.log(`   ✅ Linked existing auth user to agency`);
        }
      } else {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }
    } else {
      // Create user record linked to new auth user
      const { data: user, error: userError } = await supabase
        .from("users")
        .insert({
          auth_id: authUser.user.id,
          organization_id: agency.id,
          role: "admin",
          email: TEST_USER_EMAIL,
          first_name: "Admin",
          last_name: "User",
          is_active: true,
        })
        .select()
        .single();

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`);
      }
      console.log(`   ✅ Created: ${TEST_USER_EMAIL}`);
      console.log(`   📧 Password: ${TEST_USER_PASSWORD}`);
    }

    // 3. Create candidates
    console.log("\n3️⃣  Creating candidates...");
    const candidatesData = generateCandidates(20, agency.id);

    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .insert(candidatesData)
      .select();

    if (candidatesError) {
      throw new Error(`Failed to create candidates: ${candidatesError.message}`);
    }
    console.log(`   ✅ Created ${candidates.length} candidates`);

    // Show position breakdown
    const positionCounts: Record<string, number> = {};
    candidates.forEach((c) => {
      positionCounts[c.primary_position] = (positionCounts[c.primary_position] || 0) + 1;
    });
    Object.entries(positionCounts).forEach(([pos, count]) => {
      console.log(`      - ${pos}: ${count}`);
    });

    // 4. Create candidate-agency relationships
    console.log("\n4️⃣  Creating candidate-agency relationships...");
    const relationships = candidates.map((c) => ({
      candidate_id: c.id,
      agency_id: agency.id,
      relationship_type: "registered",
      is_exclusive: false,
    }));

    const { error: relError } = await supabase
      .from("candidate_agency_relationships")
      .insert(relationships);

    if (relError) {
      console.log(`   ⚠️  Relationships error (may be ok): ${relError.message}`);
    } else {
      console.log(`   ✅ Linked all candidates to agency`);
    }

    // 5. Create jobs
    console.log("\n5️⃣  Creating jobs...");
    const jobsWithAgency = JOBS.map((job) => ({
      ...job,
      created_by_agency_id: agency.id,
    }));

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .insert(jobsWithAgency)
      .select();

    if (jobsError) {
      throw new Error(`Failed to create jobs: ${jobsError.message}`);
    }
    console.log(`   ✅ Created ${jobs.length} jobs`);
    jobs.forEach((j) => {
      console.log(`      - ${j.title} (${j.id})`);
    });

    // 6. Create briefs
    console.log("\n6️⃣  Creating briefs...");
    const briefsWithAgency = BRIEFS.map((brief) => ({
      ...brief,
      assigned_agency_id: agency.id,
    }));

    const { data: briefs, error: briefsError } = await supabase
      .from("briefs")
      .insert(briefsWithAgency)
      .select();

    if (briefsError) {
      throw new Error(`Failed to create briefs: ${briefsError.message}`);
    }
    console.log(`   ✅ Created ${briefs.length} briefs`);
    briefs.forEach((b) => {
      console.log(`      - ${b.id} (${b.status})`);
    });

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SEED COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log(`   Agency:     ${agency.name} (${agency.id})`);
    console.log(`   User:       ${TEST_USER_EMAIL}`);
    console.log(`   Password:   ${TEST_USER_PASSWORD}`);
    console.log(`   Candidates: ${candidates.length}`);
    console.log(`   Jobs:       ${jobs.length}`);
    console.log(`   Briefs:     ${briefs.length}`);

    console.log("\n🧪 Test the full flow:");
    console.log("   1. Login at /auth/login");
    console.log(`      Email: ${TEST_USER_EMAIL}`);
    console.log(`      Password: ${TEST_USER_PASSWORD}`);
    console.log("   2. See dashboard with real numbers");
    console.log(`   3. Go to /briefs/parse?id=${briefs[0].id}`);
    console.log("   4. Parse the brief");
    console.log("   5. Create job from brief");
    console.log(`   6. Go to /jobs/match?jobId=${jobs[0].id}`);
    console.log("   7. View AI match results");

    console.log("\n📋 Quick links:");
    console.log(`   Dashboard:    /dashboard`);
    console.log(`   Candidates:   /candidates`);
    console.log(`   Jobs:         /jobs`);
    console.log(`   Briefs:       /briefs`);
    briefs.forEach((b) => {
      console.log(`   Brief parse:  /briefs/parse?id=${b.id}`);
    });
    jobs.forEach((j) => {
      console.log(`   AI Match:     /jobs/match?jobId=${j.id}`);
    });

  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }
}

// Run
seed();
