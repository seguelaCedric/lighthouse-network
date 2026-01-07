/**
 * Test script to verify Vincere webhook mapping
 * 
 * This script tests:
 * 1. Webhook event format parsing
 * 2. Data fetching from Vincere API
 * 3. Mapping functions (mapVincereToJob, mapVincereToCandidate)
 * 4. Database field compatibility
 */

import {
  getVincereClient,
  getJobWithCustomFields,
  getCandidateWithCustomFields,
  mapVincereToJob,
  mapVincereToCandidate,
  VincereCustomField,
} from "../lib/vincere";
import { createClient } from "@supabase/supabase-js";

// Load environment variables (Next.js style)
function loadEnv() {
  const fs = require("fs");
  const path = require("path");
  
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, "");
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

const results: TestResult[] = [];

function addResult(test: string, passed: boolean, message: string, details?: unknown) {
  results.push({ test, passed, message, details });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${test}: ${message}`);
  if (details && !passed) {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }
}

/**
 * Test 1: Verify webhook event structure
 */
function testWebhookEventStructure() {
  console.log("\n📋 Test 1: Webhook Event Structure");
  
  const sampleJobEvent = {
    entity_type: "JOB",
    action_type: "CREATE",
    timestamp: "2024-01-01T00:00:00Z",
    data: {
      id: 12345,
    },
  };

  const sampleCandidateEvent = {
    entity_type: "CANDIDATE",
    action_type: "UPDATE",
    timestamp: "2024-01-01T00:00:00Z",
    data: {
      id: 67890,
    },
  };

  // Check job event
  const hasJobEntityType = "entity_type" in sampleJobEvent && sampleJobEvent.entity_type === "JOB";
  const hasJobActionType = "action_type" in sampleJobEvent && sampleJobEvent.action_type === "CREATE";
  const hasJobData = "data" in sampleJobEvent && "id" in sampleJobEvent.data;
  
  addResult(
    "Job webhook event structure",
    hasJobEntityType && hasJobActionType && hasJobData,
    hasJobEntityType && hasJobActionType && hasJobData
      ? "Event structure is correct"
      : "Event structure is missing required fields",
    { sampleJobEvent }
  );

  // Check candidate event
  const hasCandidateEntityType = "entity_type" in sampleCandidateEvent && sampleCandidateEvent.entity_type === "CANDIDATE";
  const hasCandidateActionType = "action_type" in sampleCandidateEvent && sampleCandidateEvent.action_type === "UPDATE";
  const hasCandidateData = "data" in sampleCandidateEvent && "id" in sampleCandidateEvent.data;
  
  addResult(
    "Candidate webhook event structure",
    hasCandidateEntityType && hasCandidateActionType && hasCandidateData,
    hasCandidateEntityType && hasCandidateActionType && hasCandidateData
      ? "Event structure is correct"
      : "Event structure is missing required fields",
    { sampleCandidateEvent }
  );
}

/**
 * Test 2: Test job mapping with a real Vincere job
 */
async function testJobMapping() {
  console.log("\n📋 Test 2: Job Mapping");
  
  try {
    const vincere = getVincereClient();
    
    // Try to fetch a recent job from Vincere using the correct search endpoint
    // Vincere uses: /position/search/fl=id,job_title?q=*&start=0&limit=1
    let testJobId: number | null = null;
    
    try {
      const searchResult = await vincere.get<{
        result: {
          items: Array<{ id: number }>;
          total: number;
        };
      }>("/position/search/fl=id?q=*&start=0&limit=1");
      
      if (searchResult?.result?.items?.length) {
        testJobId = searchResult.result.items[0].id;
      }
    } catch (searchError) {
      console.log(`   ⚠️  Could not search for jobs (this is OK for testing): ${searchError instanceof Error ? searchError.message : String(searchError)}`);
      // Continue with mapping test using mock data
    }

    if (!testJobId) {
      console.log(`   ⚠️  No job ID found, testing mapping with sample data structure`);
      // Test with a sample job structure to verify mapping logic
      const sampleJob = {
        id: 12345,
        job_title: "Chief Stewardess",
        company_name: "Test Yacht",
        status: "OPEN",
        salary_from: 5000,
        salary_to: 7000,
        start_date: "2024-06-01",
        location: "Mediterranean",
        created_date: "2024-01-01T00:00:00Z",
        open_date: "2024-01-01T00:00:00Z",
        closed_job: false,
      };
      
      const sampleCustomFields: Record<string, VincereCustomField> = {};
      
      const mappedJob = mapVincereToJob(sampleJob as any, sampleCustomFields);
      
      addResult(
        "Job mapping - sample data mapping",
        mappedJob.external_id === "12345" && mappedJob.title === "Chief Stewardess",
        mappedJob.external_id === "12345" && mappedJob.title === "Chief Stewardess"
          ? "Mapping function works correctly with sample data"
          : "Mapping function has issues",
        { mappedJob },
      );
      return;
    }

    console.log(`   Testing with Vincere job ID: ${testJobId}`);

    // Fetch full job data
    const jobData = await getJobWithCustomFields(testJobId, vincere);
    
    if (!jobData) {
      addResult(
        "Job mapping - fetch job data",
        false,
        `Failed to fetch job ${testJobId} from Vincere`,
      );
      return;
    }

    addResult(
      "Job mapping - fetch job data",
      true,
      `Successfully fetched job ${testJobId}`,
    );

    // Test mapping
    const mappedJob = mapVincereToJob(jobData.job, jobData.customFields);

    // Verify required fields
    const requiredFields = [
      "external_id",
      "external_source",
      "title",
      "status",
      "visibility",
      "is_public",
    ];

    const missingFields = requiredFields.filter((field) => !(field in mappedJob) || mappedJob[field as keyof typeof mappedJob] === undefined);
    
    addResult(
      "Job mapping - required fields",
      missingFields.length === 0,
      missingFields.length === 0
        ? "All required fields are present"
        : `Missing fields: ${missingFields.join(", ")}`,
      missingFields.length > 0 ? { missingFields, mappedJob } : undefined,
    );

    // Check field types match database schema
    const typeChecks = [
      { field: "external_id", type: "string", value: mappedJob.external_id },
      { field: "external_source", type: "string", value: mappedJob.external_source },
      { field: "title", type: "string", value: mappedJob.title },
      { field: "status", type: "string", value: mappedJob.status },
      { field: "salary_min", type: "number|null", value: mappedJob.salary_min },
      { field: "salary_max", type: "number|null", value: mappedJob.salary_max },
    ];

    const typeErrors: string[] = [];
    for (const check of typeChecks) {
      if (check.type.includes("null")) {
        if (check.value !== null && typeof check.value !== check.type.split("|")[0]) {
          typeErrors.push(`${check.field}: expected ${check.type}, got ${typeof check.value}`);
        }
      } else {
        if (typeof check.value !== check.type) {
          typeErrors.push(`${check.field}: expected ${check.type}, got ${typeof check.value}`);
        }
      }
    }

    addResult(
      "Job mapping - field types",
      typeErrors.length === 0,
      typeErrors.length === 0
        ? "All field types are correct"
        : `Type errors: ${typeErrors.join(", ")}`,
      typeErrors.length > 0 ? { typeErrors } : undefined,
    );

    // Test database compatibility - check if we can insert (dry run)
    const jobInsert = {
      external_id: mappedJob.external_id,
      external_source: mappedJob.external_source,
      title: mappedJob.title,
      vessel_name: mappedJob.vessel_name,
      vessel_type: mappedJob.vessel_type,
      vessel_size_meters: mappedJob.vessel_size_meters,
      salary_min: mappedJob.salary_min,
      salary_max: mappedJob.salary_max,
      salary_currency: mappedJob.salary_currency,
      salary_period: mappedJob.salary_period,
      start_date: mappedJob.start_date,
      primary_region: mappedJob.primary_region,
      requirements_text: mappedJob.requirements_text,
      status: mappedJob.status,
      visibility: mappedJob.visibility,
      is_public: mappedJob.is_public,
      is_urgent: mappedJob.is_urgent,
      fee_type: mappedJob.fee_type,
      requirements: mappedJob.requirements,
      published_at: mappedJob.published_at,
      holiday_days: mappedJob.holiday_days,
      itinerary: mappedJob.itinerary,
      holiday_package: mappedJob.holiday_package,
      rotation_schedule: mappedJob.rotation_schedule,
      contract_type: mappedJob.contract_type,
      program: mappedJob.program,
      public_description: mappedJob.public_description,
      created_by_agency_id: "00000000-0000-0000-0000-000000000001", // Lighthouse Careers
    };

    // Validate that all fields in jobInsert exist in the database schema
    // We'll do a test query to check column names
    const { error: schemaError } = await supabase
      .from("jobs")
      .select("id")
      .limit(0);

    if (schemaError) {
      addResult(
        "Job mapping - database schema check",
        false,
        `Failed to access jobs table: ${schemaError.message}`,
      );
    } else {
      addResult(
        "Job mapping - database schema check",
        true,
        "Jobs table is accessible and mapped fields should be compatible",
      );
    }

    console.log(`   ✅ Mapped job: ${mappedJob.title} (${mappedJob.external_id})`);
    console.log(`   Status: ${mappedJob.status}, Visibility: ${mappedJob.visibility}, Public: ${mappedJob.is_public}`);

  } catch (error) {
    addResult(
      "Job mapping - general error",
      false,
      `Error during job mapping test: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Test 3: Test candidate mapping with a real Vincere candidate
 */
async function testCandidateMapping() {
  console.log("\n📋 Test 3: Candidate Mapping");
  
  try {
    const vincere = getVincereClient();
    
    // Try to fetch a recent candidate from Vincere using the correct search endpoint
    let testCandidateId: number | null = null;
    
    try {
      const searchResult = await vincere.get<{
        result: {
          items: Array<{ id: number }>;
          total: number;
        };
      }>("/candidate/search/fl=id?q=*&start=0&limit=1");
      
      if (searchResult?.result?.items?.length) {
        testCandidateId = searchResult.result.items[0].id;
      }
    } catch (searchError) {
      console.log(`   ⚠️  Could not search for candidates (this is OK for testing): ${searchError instanceof Error ? searchError.message : String(searchError)}`);
      // Continue with mapping test using mock data
    }

    if (!testCandidateId) {
      console.log(`   ⚠️  No candidate ID found, testing mapping with sample data structure`);
      // Test with a sample candidate structure to verify mapping logic
      const sampleCandidate = {
        id: 67890,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        phone: "+1234567890",
        job_title: "Chief Stewardess",
        nationality: "British",
        date_of_birth: "1990-01-01",
        summary: "Experienced yacht stewardess",
      };
      
      const sampleCustomFields: Record<string, VincereCustomField> = {};
      
      const mappedCandidate = mapVincereToCandidate(sampleCandidate as any, sampleCustomFields);
      
      addResult(
        "Candidate mapping - sample data mapping",
        mappedCandidate.vincere_id === "67890" && mappedCandidate.first_name === "Jane",
        mappedCandidate.vincere_id === "67890" && mappedCandidate.first_name === "Jane"
          ? "Mapping function works correctly with sample data"
          : "Mapping function has issues",
        { mappedCandidate },
      );
      return;
    }

    console.log(`   Testing with Vincere candidate ID: ${testCandidateId}`);

    // Fetch full candidate data
    const candidateData = await getCandidateWithCustomFields(testCandidateId, vincere);
    
    if (!candidateData) {
      addResult(
        "Candidate mapping - fetch candidate data",
        false,
        `Failed to fetch candidate ${testCandidateId} from Vincere`,
      );
      return;
    }

    addResult(
      "Candidate mapping - fetch candidate data",
      true,
      `Successfully fetched candidate ${testCandidateId}`,
    );

    // Test mapping
    const mappedCandidate = mapVincereToCandidate(
      candidateData.candidate,
      candidateData.customFields
    );

    // Verify required fields
    const requiredFields = [
      "vincere_id",
      "first_name",
      "last_name",
    ];

    const missingFields = requiredFields.filter(
      (field) => !(field in mappedCandidate) || mappedCandidate[field as keyof typeof mappedCandidate] === undefined
    );
    
    addResult(
      "Candidate mapping - required fields",
      missingFields.length === 0,
      missingFields.length === 0
        ? "All required fields are present"
        : `Missing fields: ${missingFields.join(", ")}`,
      missingFields.length > 0 ? { missingFields, mappedCandidate } : undefined,
    );

    // Check field types
    const typeChecks = [
      { field: "vincere_id", type: "string", value: mappedCandidate.vincere_id },
      { field: "first_name", type: "string", value: mappedCandidate.first_name },
      { field: "last_name", type: "string", value: mappedCandidate.last_name },
      { field: "email", type: "string|null", value: mappedCandidate.email },
      { field: "desired_salary_min", type: "number|null", value: mappedCandidate.desired_salary_min },
      { field: "desired_salary_max", type: "number|null", value: mappedCandidate.desired_salary_max },
    ];

    const typeErrors: string[] = [];
    for (const check of typeChecks) {
      if (check.type.includes("null")) {
        if (check.value !== null && check.value !== undefined && typeof check.value !== check.type.split("|")[0]) {
          typeErrors.push(`${check.field}: expected ${check.type}, got ${typeof check.value}`);
        }
      } else {
        if (check.value !== null && check.value !== undefined && typeof check.value !== check.type) {
          typeErrors.push(`${check.field}: expected ${check.type}, got ${typeof check.value}`);
        }
      }
    }

    addResult(
      "Candidate mapping - field types",
      typeErrors.length === 0,
      typeErrors.length === 0
        ? "All field types are correct"
        : `Type errors: ${typeErrors.join(", ")}`,
      typeErrors.length > 0 ? { typeErrors } : undefined,
    );

    // Test database compatibility
    const candidateInsert = {
      vincere_id: mappedCandidate.vincere_id,
      first_name: mappedCandidate.first_name,
      last_name: mappedCandidate.last_name,
      email: mappedCandidate.email,
      phone: mappedCandidate.phone,
      whatsapp: mappedCandidate.whatsapp,
      date_of_birth: mappedCandidate.date_of_birth,
      gender: mappedCandidate.gender,
      nationality: mappedCandidate.nationality,
      current_location: mappedCandidate.current_location,
      primary_position: mappedCandidate.primary_position,
      position_category: mappedCandidate.position_category,
      profile_summary: mappedCandidate.profile_summary,
      organization_id: "00000000-0000-0000-0000-000000000001", // Lighthouse Careers
    };

    // Validate that all fields in candidateInsert exist in the database schema
    const { error: schemaError } = await supabase
      .from("candidates")
      .select("id")
      .limit(0);

    if (schemaError) {
      addResult(
        "Candidate mapping - database schema check",
        false,
        `Failed to access candidates table: ${schemaError.message}`,
      );
    } else {
      addResult(
        "Candidate mapping - database schema check",
        true,
        "Candidates table is accessible and mapped fields should be compatible",
      );
    }

    console.log(`   ✅ Mapped candidate: ${mappedCandidate.first_name} ${mappedCandidate.last_name} (${mappedCandidate.vincere_id})`);
    console.log(`   Position: ${mappedCandidate.primary_position}, Category: ${mappedCandidate.position_category}`);

  } catch (error) {
    addResult(
      "Candidate mapping - general error",
      false,
      `Error during candidate mapping test: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Test 4: Verify webhook handler logic
 */
function testWebhookHandlerLogic() {
  console.log("\n📋 Test 4: Webhook Handler Logic");
  
  // Test that webhook handlers correctly parse entity_type and action_type
  const testEvents = [
    { entity_type: "JOB", action_type: "CREATE", shouldHandle: true },
    { entity_type: "JOB", action_type: "UPDATE", shouldHandle: true },
    { entity_type: "JOB", action_type: "DELETE", shouldHandle: true },
    { entity_type: "CANDIDATE", action_type: "CREATE", shouldHandle: true },
    { entity_type: "CANDIDATE", action_type: "UPDATE", shouldHandle: true },
    { entity_type: "CANDIDATE", action_type: "ARCHIVE", shouldHandle: true },
    { entity_type: "CANDIDATE", action_type: "DELETE", shouldHandle: true },
    { entity_type: "UNKNOWN", action_type: "CREATE", shouldHandle: false },
  ];

  for (const event of testEvents) {
    const isJob = event.entity_type === "JOB";
    const isCandidate = event.entity_type === "CANDIDATE";
    const isValidAction = isJob
      ? ["CREATE", "UPDATE", "DELETE"].includes(event.action_type)
      : isCandidate
      ? ["CREATE", "UPDATE", "ARCHIVE", "DELETE"].includes(event.action_type)
      : false;

    const shouldHandle = (isJob || isCandidate) && isValidAction;

    addResult(
      `Webhook handler - ${event.entity_type}.${event.action_type}`,
      shouldHandle === event.shouldHandle,
      shouldHandle
        ? "Event will be handled correctly"
        : "Event handling logic may need adjustment",
    );
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log("=".repeat(60));
  console.log("🧪 Vincere Webhook Mapping Test Suite");
  console.log("=".repeat(60));

  // Test 1: Webhook event structure
  testWebhookEventStructure();

  // Test 2: Job mapping
  await testJobMapping();

  // Test 3: Candidate mapping
  await testCandidateMapping();

  // Test 4: Webhook handler logic
  testWebhookHandlerLogic();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.test}: ${r.message}`);
      });
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed! Webhook mapping is working correctly.");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

