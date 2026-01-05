/**
 * Pull data from Vincere
 *
 * Fetches jobs, candidates, and clients/companies from Vincere API.
 * Includes full custom field mapping for candidates and jobs.
 * Optionally processes CVs and photos for AI-powered search.
 *
 * Run: cd apps/web && npx tsx scripts/vincere-pull.ts
 *
 * Options:
 *   --jobs       Fetch jobs only
 *   --candidates Fetch candidates only
 *   --clients    Fetch clients/companies only
 *   --limit=N    Limit results (default 10)
 *   --sync       Sync fetched data to Supabase database
 *   --documents  Also fetch and process CVs/photos (requires --sync --candidates)
 *
 * Environment variables (from .env.local):
 * - VINCERE_CLIENT_ID
 * - VINCERE_API_KEY
 * - VINCERE_REFRESH_TOKEN
 * - NEXT_PUBLIC_SUPABASE_URL (for --sync)
 * - SUPABASE_SERVICE_ROLE_KEY (for --sync)
 * - OPENAI_API_KEY (for --documents, used for embeddings)
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  VincereClient,
  VincereCandidate,
  VincereJob,
  getCustomFields,
  getJobCustomFields,
  mapVincereToCandidate,
  mapVincereToJob,
  VINCERE_INDUSTRY_IDS,
  // Additional candidate endpoints
  getFunctionalExpertises,
  getCurrentLocation,
  getCandidateStatus,
} from "../lib/vincere";
import { syncCandidateDocuments, printSyncSummary } from "../lib/services/document-sync";
import { generateEmbedding, buildCandidateEmbeddingText } from "@lighthouse/ai";

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
  resolve(process.cwd(), "../../.env.local"),
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../../../.env.local"),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

// Use industry IDs from the vincere library
const INDUSTRY_IDS = VINCERE_INDUSTRY_IDS;

// Parse command line arguments
const args = process.argv.slice(2);
const fetchJobs = args.includes("--jobs") || (!args.includes("--candidates") && !args.includes("--clients"));
const fetchCandidates = args.includes("--candidates") || (!args.includes("--jobs") && !args.includes("--clients"));
const fetchClients = args.includes("--clients") || (!args.includes("--jobs") && !args.includes("--candidates"));
const shouldSync = args.includes("--sync");
const processDocuments = args.includes("--documents");

const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 10;

// Validate --documents requires --sync and --candidates
if (processDocuments && !shouldSync) {
  console.error("Error: --documents requires --sync flag");
  process.exit(1);
}
if (processDocuments && !fetchCandidates) {
  console.error("Error: --documents only works with --candidates");
  process.exit(1);
}

// Default organization ID for Vincere sync (Lighthouse Careers)
// This is used for document storage, candidate/job records, and agency relationships
// IMPORTANT: This must match the organization_id of the user logged into the app
// to ensure RLS policies allow access to synced candidates
const DEFAULT_ORG_ID = process.env.VINCERE_ORG_ID || "c4e1e6ff-b71a-4fbd-bb31-dd282d981436";

// Supabase client (only created if --sync)
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for sync");
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return supabase;
}

// Types (VincereClient, VincereCandidate, etc. are imported from ../lib/vincere)
interface VincereSearchResult {
  result: {
    items: Array<{
      id: number;
      name?: string;
      job_title?: string;
      company_name?: string;
      primary_email?: string;
      last_update?: string;
      job_status?: string;
      created_date?: string;
    }>;
    total: number;
  };
}

// VincereJob is imported from ../lib/vincere

interface VincereCompany {
  id: number;
  name: string;
  company_type?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  created_date?: string;
  updated_date?: string;
}

// Main function
async function main() {
  console.log("=".repeat(60));
  console.log("Vincere Data Pull");
  console.log("=".repeat(60));

  // Validate environment variables
  const clientId = process.env.VINCERE_CLIENT_ID;
  const apiKey = process.env.VINCERE_API_KEY;
  const refreshToken = process.env.VINCERE_REFRESH_TOKEN;

  if (!clientId || !apiKey || !refreshToken) {
    console.error("\nMissing environment variables:");
    console.error("  VINCERE_CLIENT_ID:", clientId ? "set" : "MISSING");
    console.error("  VINCERE_API_KEY:", apiKey ? "set" : "MISSING");
    console.error("  VINCERE_REFRESH_TOKEN:", refreshToken ? "set" : "MISSING");
    console.error("\nAdd these to your .env.local file.");
    process.exit(1);
  }

  // Create Vincere client using imported library class
  const client = new VincereClient({
    clientId,
    apiKey,
    refreshToken,
  });

  console.log("\nAuthenticating with Vincere...");
  await client.authenticate();
  console.log("Authenticated successfully!\n");

  // Fetch Jobs
  if (fetchJobs) {
    console.log("=".repeat(60));
    console.log(`JOBS (limit: ${limit})${shouldSync ? " [SYNCING TO PUBLIC JOB BOARD]" : ""}`);
    console.log("=".repeat(60));

    try {
      // Search for jobs in yacht/villa industries
      // Note: Vincere doesn't support job_status in search query, so we filter after fetching
      const query = `(industry_id:${INDUSTRY_IDS.yacht}# OR industry_id:${INDUSTRY_IDS.villa}#)`;
      const encodedQuery = encodeURIComponent(query);

      // Vincere API paginates results - fetch all pages up to our limit
      const PAGE_SIZE = 25; // Vincere's default/max page size
      let allItems: Array<{
        id: number;
        name?: string;
        job_title?: string;
        company_name?: string;
        primary_email?: string;
        last_update?: string;
        job_status?: string;
        created_date?: string;
      }> = [];
      let start = 0;
      let total = 0;

      console.log(`\nFetching jobs from Vincere (limit: ${limit})...`);

      // Paginate through results until we hit our limit or run out of results
      while (allItems.length < limit) {
        const searchResult = await client.get<VincereSearchResult>(
          `/position/search/fl=id,job_title,company_name,created_date,last_update?q=${encodedQuery}&start=${start}&limit=${PAGE_SIZE}`
        );

        const pageItems = searchResult?.result?.items ?? [];
        total = searchResult?.result?.total ?? 0;

        if (pageItems.length === 0) break; // No more results

        allItems = allItems.concat(pageItems);
        console.log(`  Fetched page ${Math.floor(start / PAGE_SIZE) + 1}: ${pageItems.length} jobs (total so far: ${allItems.length})`);

        start += PAGE_SIZE;

        // Stop if we've fetched all available or hit our limit
        if (allItems.length >= total || allItems.length >= limit) break;
      }

      // Trim to exactly our limit if we fetched more
      const items = allItems.slice(0, limit);
      console.log(`\nFound ${total} total jobs in Vincere, fetched ${items.length}`);
      console.log(`Syncing ALL jobs (open = public, closed = private)...\n`);

      let syncedCount = 0;
      let skippedCount = 0;
      for (const item of items) {
        // Fetch full job details
        const job = await client.get<VincereJob>(`/position/${item.id}`);
        const jobAny = job as unknown as Record<string, unknown>;

        // Log available status fields for debugging (first job only)
        if (items.indexOf(item) === 0) {
          console.log("DEBUG: Job status fields:", {
            open_date: jobAny.open_date,
            close_date: jobAny.close_date,
            closed_job: jobAny.closed_job,
            status_id: jobAny.status_id
          });
        }

        // Vincere determines open status by:
        // 1. closed_job field being false/null
        // 2. open_date exists
        // 3. close_date is either null OR in the future
        const closedJob = jobAny.closed_job;
        const hasOpenDate = !!jobAny.open_date;
        const closeDate = jobAny.close_date ? new Date(jobAny.close_date as string) : null;
        const isPastCloseDate = closeDate && closeDate < new Date();
        const isOpen = hasOpenDate && !closedJob && !isPastCloseDate;

        // Determine the job status for display
        const jobStatusLabel = isOpen ? 'OPEN → PUBLIC' :
                              closedJob ? 'CLOSED' :
                              !hasOpenDate ? 'NEVER OPENED' :
                              isPastCloseDate ? 'EXPIRED' : 'CLOSED';

        console.log(`Job ID: ${job.id}`);
        console.log(`  Title: ${job.job_title}`);
        console.log(`  Company: ${job.company_name || "N/A"}`);
        console.log(`  Status: ${jobStatusLabel}`);
        console.log(`  Salary: ${job.salary_from || "N/A"} - ${job.salary_to || "N/A"}`);
        console.log(`  Location: ${job.location || "N/A"}`);
        console.log(`  Start Date: ${job.start_date || "N/A"}`);
        console.log(`  Created: ${job.created_date || "N/A"}`);
        if (job.internal_description) {
          console.log(`  Description: ${job.internal_description.substring(0, 200)}...`);
        }

        // Fetch custom fields (yacht name, requirements, salary, itinerary, etc.)
        console.log(`  Fetching custom fields...`);
        const customFields = await getJobCustomFields(job.id, client);
        const customFieldCount = Object.keys(customFields).length;
        console.log(`  Custom fields found: ${customFieldCount}`);

        // Sync to database if --sync flag
        if (shouldSync) {
          try {
            const db = getSupabaseClient();

            // Use mapVincereToJob for full custom field mapping
            const jobData = mapVincereToJob(job, customFields);

            // Log all mapped custom fields for visibility
            console.log(`  → Public: ${jobData.is_public ? "YES" : "NO"} | Status: ${jobData.status}`);
            if (jobData.vessel_name || jobData.vessel_type || jobData.vessel_size_meters) {
              const vesselParts = [
                jobData.vessel_name,
                jobData.vessel_size_meters ? `${jobData.vessel_size_meters}m` : null,
                jobData.vessel_type,
              ].filter(Boolean);
              console.log(`  → Vessel: ${vesselParts.join(" | ")}`);
            }
            if (jobData.salary_min || jobData.salary_max) {
              console.log(`  → Salary: ${jobData.salary_currency} ${jobData.salary_min || "?"}-${jobData.salary_max || "?"}/month`);
            }
            if (jobData.rotation_schedule) {
              console.log(`  → Rotation: ${jobData.rotation_schedule}`);
            }
            if (jobData.holiday_package && !jobData.rotation_schedule) {
              console.log(`  → Holiday Package: ${jobData.holiday_package}${jobData.holiday_days ? ` (${jobData.holiday_days} days)` : ""}`);
            }
            if (jobData.itinerary) {
              console.log(`  → Itinerary: ${jobData.itinerary}`);
            }
            if (jobData.primary_region) {
              console.log(`  → Region: ${jobData.primary_region}`);
            }
            if (jobData.contract_type) {
              console.log(`  → Contract: ${jobData.contract_type}`);
            }
            if (jobData.program) {
              console.log(`  → Program: ${jobData.program}`);
            }
            if (jobData.public_description) {
              console.log(`  → Has public description: YES (${jobData.public_description.length} chars)`);
            }

            // Prepare data for upsert
            const upsertData = {
              ...jobData,
              submissions_count: 0,
              views_count: 0,
              applications_count: 0,
            };

            // First, check if job exists by external_id
            const { data: existing } = await db
              .from("jobs")
              .select("id")
              .eq("external_id", jobData.external_id)
              .eq("external_source", "vincere")
              .single();

            if (existing) {
              // Update existing job
              const { error } = await db
                .from("jobs")
                .update({
                  ...jobData,
                  // Don't reset counts on update
                })
                .eq("id", existing.id);

              if (error) {
                console.log(`  ❌ Update failed: ${error.message}`);
              } else {
                console.log(`  ✅ Updated existing job in database`);
                syncedCount++;
              }
            } else {
              // Insert new job
              const { error } = await db.from("jobs").insert(upsertData);

              if (error) {
                console.log(`  ❌ Insert failed: ${error.message}`);
              } else {
                console.log(`  ✅ Inserted new job to database (PUBLIC)`);
                syncedCount++;
              }
            }
          } catch (syncError) {
            console.log(`  ❌ Sync error: ${syncError}`);
          }
        }
        console.log("");
      }

      if (shouldSync) {
        console.log(`\n📊 Job Sync Summary:`);
        console.log(`   Synced: ${syncedCount}/${items.length} jobs`);
        console.log(`   Open jobs → PUBLIC on job board`);
        console.log(`   Closed/Draft jobs → PRIVATE (not visible on job board)`);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  }

  // Fetch Candidates
  if (fetchCandidates) {
    console.log("=".repeat(60));
    console.log(`CANDIDATES (limit: ${limit})${shouldSync ? " [SYNCING]" : ""}`);
    console.log("=".repeat(60));

    try {
      // Search for candidates in yacht/villa industries
      const query = `(industry_id:${INDUSTRY_IDS.yacht}# OR industry_id:${INDUSTRY_IDS.villa}#)`;
      const encodedQuery = encodeURIComponent(query);

      const searchResult = await client.get<VincereSearchResult>(
        `/candidate/search/fl=id,name,first_name,last_name,primary_email,job_title,last_update?q=${encodedQuery}&start=0&limit=${limit}`
      );

      const items = searchResult?.result?.items ?? [];
      console.log(`\nFound ${searchResult?.result?.total ?? 0} total candidates (showing ${items.length})\n`);

      let syncedCount = 0;
      for (const item of items) {
        // Fetch full candidate details
        const candidate = await client.get<VincereCandidate>(`/candidate/${item.id}`);

        // Fetch custom fields for full metadata mapping
        console.log(`Candidate ID: ${candidate.id}`);
        console.log(`  Name: ${candidate.first_name} ${candidate.last_name}`);
        console.log(`  Email: ${candidate.primary_email || candidate.email || "N/A"}`);
        console.log(`  Phone: ${candidate.phone || candidate.mobile || "N/A"}`);
        console.log(`  Position: ${candidate.job_title || "N/A"}`);
        console.log(`  Nationality: ${candidate.nationality || "N/A"}`);
        console.log(`  Location: ${candidate.current_location || "N/A"}`);
        console.log(`  Created: ${candidate.created_date || "N/A"}`);
        console.log(`  Updated: ${candidate.updated_date || "N/A"}`);

        // Fetch all additional data in parallel for efficiency
        console.log(`  Fetching additional data...`);
        const [customFields, functionalExpertises, currentLocation, candidateStatus] = await Promise.all([
          getCustomFields(candidate.id, client),
          getFunctionalExpertises(candidate.id, client),
          getCurrentLocation(candidate.id, client),
          getCandidateStatus(candidate.id, client),
        ]);

        const customFieldCount = Object.keys(customFields).length;
        console.log(`  Custom fields found: ${customFieldCount}`);

        // Log functional expertises (skills/positions)
        if (functionalExpertises.length > 0) {
          console.log(`  Functional Expertises: ${functionalExpertises.map(e => e.name).join(", ")}`);
        }

        // Log current location details
        if (currentLocation) {
          const locationParts = [currentLocation.city, currentLocation.country].filter(Boolean);
          console.log(`  Current Location: ${locationParts.join(", ") || currentLocation.name}`);
        }

        // Log candidate status
        if (candidateStatus) {
          console.log(`  Status: ${candidateStatus.name}`);
        }

        if (candidate.summary) {
          console.log(`  Summary: ${candidate.summary.substring(0, 200)}...`);
        }

        // Sync to database if --sync flag
        if (shouldSync) {
          try {
            const db = getSupabaseClient();

            // Use mapVincereToCandidate for full custom field mapping
            // This maps all 25+ fields: visas, certs, salary, yacht prefs, couple info, etc.
            // Also includes extended data: functional expertises, current location, candidate status
            const candidateData = mapVincereToCandidate(candidate, customFields, {
              functionalExpertises,
              currentLocation,
              candidateStatus,
            });

            // Log some of the mapped custom fields for visibility
            if (candidateData.has_schengen !== null) {
              console.log(`  → Schengen Visa: ${candidateData.has_schengen ? "Yes" : "No"}`);
            }
            if (candidateData.has_b1b2 !== null) {
              console.log(`  → B1/B2 Visa: ${candidateData.has_b1b2 ? "Yes" : "No"}`);
            }
            if (candidateData.has_stcw) {
              console.log(`  → STCW: Yes`);
            }
            if (candidateData.has_eng1) {
              console.log(`  → ENG1: Yes`);
            }
            if (candidateData.desired_salary_min || candidateData.desired_salary_max) {
              console.log(`  → Desired Salary: ${candidateData.salary_currency} ${candidateData.desired_salary_min || "?"}-${candidateData.desired_salary_max || "?"}`);
            }
            if (candidateData.preferred_yacht_size_min || candidateData.preferred_yacht_size_max) {
              console.log(`  → Yacht Size Pref: ${candidateData.preferred_yacht_size_min || "?"}m-${candidateData.preferred_yacht_size_max || "?"}m`);
            }
            if (candidateData.preferred_yacht_types && candidateData.preferred_yacht_types.length > 0) {
              console.log(`  → Yacht Type Pref: ${candidateData.preferred_yacht_types.join(", ")}`);
            }
            if (candidateData.is_couple) {
              console.log(`  → Couple: Yes (Partner: ${candidateData.partner_name || "N/A"}, ${candidateData.partner_position || "N/A"})`);
            }
            if (candidateData.available_from) {
              console.log(`  → Available From: ${candidateData.available_from}`);
            }

            // Check for existing candidate by vincere_id or email to prevent duplicates
            let existingCandidate: { id: string } | null = null;
            let isUpdate = false;

            // First, check by vincere_id (most reliable for Vincere imports)
            if (candidateData.vincere_id) {
              const { data: byVincereId } = await db
                .from("candidates")
                .select("id")
                .eq("vincere_id", candidateData.vincere_id)
                .is("deleted_at", null)
                .single();

              if (byVincereId) {
                existingCandidate = byVincereId;
                isUpdate = true;
                console.log(`  🔄 Found existing candidate by vincere_id`);
              }
            }

            // If not found by vincere_id, check by email
            if (!existingCandidate && candidateData.email) {
              const { data: byEmail } = await db
                .from("candidates")
                .select("id")
                .ilike("email", candidateData.email)
                .is("deleted_at", null)
                .single();

              if (byEmail) {
                existingCandidate = byEmail;
                isUpdate = true;
                console.log(`  🔄 Found existing candidate by email`);
              }
            }

            // Insert or update candidate
            let insertedCandidate: { id: string } | null = null;
            let error: { message: string } | null = null;

            if (existingCandidate) {
              // Update existing candidate
              const { data, error: updateError } = await db
                .from("candidates")
                .update({
                  ...candidateData,
                  updated_at: new Date().toISOString(),
                  last_synced_at: new Date().toISOString(),
                })
                .eq("id", existingCandidate.id)
                .select("id")
                .single();

              insertedCandidate = data;
              error = updateError;
            } else {
              // Insert new candidate
              const { data, error: insertError } = await db
                .from("candidates")
                .insert(candidateData)
                .select("id")
                .single();

              insertedCandidate = data;
              error = insertError;
            }

            if (error) {
              console.log(`  ❌ Sync failed: ${error.message}`);
            } else {
              console.log(`  ✅ ${isUpdate ? "Updated" : "Inserted"} in database`);
              syncedCount++;

              // Generate and store candidate profile embedding for AI search
              if (insertedCandidate?.id) {
                try {
                  console.log(`  🧠 Generating profile embedding...`);
                  let embeddingText = buildCandidateEmbeddingText(candidateData);

                  // Add name as fallback text if embedding text is too short
                  if (!embeddingText || embeddingText.trim().length < 10) {
                    const nameParts = [`Name: ${candidateData.first_name} ${candidateData.last_name}`];
                    if (candidateData.email) nameParts.push(`Email: ${candidateData.email}`);
                    embeddingText = nameParts.join('\n') + (embeddingText ? '\n' + embeddingText : '');
                  }

                  // Skip if still no meaningful text
                  if (!embeddingText || embeddingText.trim().length < 5) {
                    console.log(`  ⚠️ No embedding text available, skipping`);
                  } else {
                    const embedding = await generateEmbedding(embeddingText);

                    const { error: embeddingError } = await db
                      .from("candidates")
                      .update({ embedding })
                      .eq("id", insertedCandidate.id);

                    if (embeddingError) {
                      console.log(`  ⚠️ Failed to store embedding: ${embeddingError.message}`);
                    } else {
                      console.log(`  ✅ Profile embedding stored (${embedding.length} dimensions)`);
                    }
                  }
                } catch (embeddingError) {
                  console.log(`  ⚠️ Embedding generation failed: ${embeddingError}`);
                }
              }

              // Create agency relationship so RLS allows access
              if (insertedCandidate?.id) {
                const { error: relError } = await db
                  .from("candidate_agency_relationships")
                  .insert({
                    candidate_id: insertedCandidate.id,
                    agency_id: DEFAULT_ORG_ID,
                    relationship_type: "vincere_sync",
                    is_exclusive: false,
                    agency_candidate_id: item.id.toString(), // Vincere ID
                  });

                if (relError) {
                  console.log(`  ⚠️ Failed to create agency relationship: ${relError.message}`);
                }
              }

              // Process documents if --documents flag is set
              if (processDocuments && insertedCandidate?.id) {
                console.log(`  📄 Processing documents with classification...`);

                // Use the new document sync service with proper classification
                const docResult = await syncCandidateDocuments(
                  item.id,
                  insertedCandidate.id,
                  DEFAULT_ORG_ID,
                  client,
                  db
                );

                // Print summary
                printSyncSummary(docResult);

                // Log any errors
                const errors = docResult.files.filter(f => !f.success);
                for (const err of errors) {
                  console.log(`    ❌ ${err.file.file_name || 'Unknown file'}: ${err.error}`);
                }
              }
            }
          } catch (syncError) {
            console.log(`  ❌ Sync error: ${syncError}`);
          }
        }
        console.log("");
      }

      if (shouldSync) {
        console.log(`\n📊 Synced ${syncedCount}/${items.length} candidates to database${processDocuments ? " (with documents)" : ""}`);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  }

  // Fetch Clients/Companies
  if (fetchClients) {
    console.log("=".repeat(60));
    console.log(`CLIENTS/COMPANIES (limit: ${limit})${shouldSync ? " [SYNCING]" : ""}`);
    console.log("=".repeat(60));

    try {
      // Try searching for companies with yacht/villa industry filter
      const query = `(industry_id:${INDUSTRY_IDS.yacht}# OR industry_id:${INDUSTRY_IDS.villa}#)`;
      const encodedQuery = encodeURIComponent(query);

      const searchResult = await client.get<VincereSearchResult>(
        `/company/search/fl=id,name,company_type,created_date?q=${encodedQuery}&start=0&limit=${limit}`
      );

      const items = searchResult?.result?.items ?? [];
      console.log(`\nFound ${searchResult?.result?.total ?? 0} total companies (showing ${items.length})\n`);

      let syncedCount = 0;
      for (const item of items) {
        // Fetch full company details
        const company = await client.get<VincereCompany>(`/company/${item.id}`);

        // The company name comes from the search result item, not the company details
        const name = item.name || company.name || (company as any).company_name || "Unknown";
        const note = (company as any).note || "";
        const notePreview = note.length > 100 ? note.substring(0, 100) + "..." : note;

        console.log(`Company ID: ${item.id}`);
        console.log(`  Name: ${name}`);
        console.log(`  Type: ${company.company_type || "N/A"}`);
        console.log(`  Website: ${company.website || "N/A"}`);
        console.log(`  Email: ${company.email || "N/A"}`);
        console.log(`  Phone: ${company.phone || (company as any).main_phone || "N/A"}`);
        console.log(`  City: ${company.city || "N/A"}`);
        console.log(`  Country: ${company.country || "N/A"}`);
        if (notePreview) {
          console.log(`  Notes: ${notePreview}`);
        }

        // Sync to database if --sync flag
        if (shouldSync) {
          try {
            const db = getSupabaseClient();

            // Create a slug from the name
            const slug = name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
              .substring(0, 50) + `-${item.id}`;

            const orgData = {
              type: "private_owner" as const, // Default to private owner for yacht clients
              name: name,
              slug: slug,
              email: company.email || null,
              phone: company.phone || (company as any).main_phone || null,
              website: company.website || null,
              city: company.city || null,
              country: company.country || null,
              vessel_name: name, // Company name is usually the yacht name
              commission_rate: 15, // Default
              subscription_tier: "free",
              subscription_status: "active",
              settings: { vincere_id: item.id, vincere_notes: note },
            };

            // Simple insert for testing (slug must be unique but we include vincere id)
            const { error } = await db.from("organizations").insert(orgData)

            if (error) {
              console.log(`  ❌ Sync failed: ${error.message}`);
            } else {
              console.log(`  ✅ Synced to database`);
              syncedCount++;
            }
          } catch (syncError) {
            console.log(`  ❌ Sync error: ${syncError}`);
          }
        }
        console.log("");
      }

      if (shouldSync) {
        console.log(`\n📊 Synced ${syncedCount}/${items.length} clients to database`);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }

  console.log("=".repeat(60));
  console.log("Done!");
  console.log("=".repeat(60));
}

main().catch(console.error);
