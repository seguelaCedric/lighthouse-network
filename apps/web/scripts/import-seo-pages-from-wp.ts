/**
 * WordPress SEO Pages Import Script (v2)
 *
 * Imports SEO landing pages from WordPress CSV export into Supabase.
 * URLs are simple: /hire-a-butler/miami/ (no country in URL)
 * Country is stored in DB for AI content generation only.
 *
 * Run: cd apps/web && npx tsx scripts/import-seo-pages-from-wp.ts --file=scripts/data/wordpress-redirects.csv
 *
 * Options:
 *   --file=<path>     Path to CSV file (required)
 *   --dry-run         Analyze without inserting into database
 *   --verbose         Show detailed logging
 *   --limit=N         Process only first N rows
 *   --ai-generate     Enable AI content generation for imported pages
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// ENV LOADING
// ============================================================================

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

const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "../../.env.local"),
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../../../.env.local"),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

// ============================================================================
// CLI ARGUMENTS
// ============================================================================

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : undefined;
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const csvFilePath = getArg("file");
const dryRun = hasFlag("dry-run");
const verbose = hasFlag("verbose");
const limit = getArg("limit") ? parseInt(getArg("limit")!, 10) : undefined;
const aiGenerate = hasFlag("ai-generate");

if (!csvFilePath) {
  console.error("Error: --file=<path> is required");
  console.error("Usage: npx tsx scripts/import-seo-pages-from-wp.ts --file=scripts/data/wordpress-redirects.csv");
  process.exit(1);
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// POSITION MAPPINGS
// ============================================================================

const POSITION_PATTERNS: { pattern: RegExp; position: string; positionSlug: string; priority: number }[] = [
  { pattern: /private chef/i, position: "Private Chef", positionSlug: "private-chef", priority: 2 },
  { pattern: /\bPA\b|personal assistant/i, position: "Personal Assistant", positionSlug: "pa", priority: 3 },
  { pattern: /house manager/i, position: "House Manager", positionSlug: "house-manager", priority: 4 },
  { pattern: /butler/i, position: "Butler", positionSlug: "butler", priority: 1 },
  { pattern: /nanny/i, position: "Nanny", positionSlug: "nanny", priority: 5 },
  { pattern: /housekeeper/i, position: "Housekeeper", positionSlug: "housekeeper", priority: 6 },
  { pattern: /estate manager/i, position: "Estate Manager", positionSlug: "estate-manager", priority: 7 },
  { pattern: /chef/i, position: "Chef", positionSlug: "chef", priority: 8 },
];

// ============================================================================
// COUNTRY MAPPINGS - For country-level pages like "Hire a Butler in USA"
// ============================================================================

const COUNTRY_MAPPINGS: Record<string, { name: string; slug: string }> = {
  usa: { name: "USA", slug: "usa" },
  uk: { name: "UK", slug: "uk" },
  uae: { name: "UAE", slug: "uae" },
  australia: { name: "Australia", slug: "australia" },
  france: { name: "France", slug: "france" },
  spain: { name: "Spain", slug: "spain" },
  italy: { name: "Italy", slug: "italy" },
  switzerland: { name: "Switzerland", slug: "switzerland" },
  monaco: { name: "Monaco", slug: "monaco" },
  greece: { name: "Greece", slug: "greece" },
  ireland: { name: "Ireland", slug: "ireland" },
  canada: { name: "Canada", slug: "canada" },
  mexico: { name: "Mexico", slug: "mexico" },
  singapore: { name: "Singapore", slug: "singapore" },
  russia: { name: "Russia", slug: "russia" },
  china: { name: "China", slug: "china" },
  austria: { name: "Austria", slug: "austria" },
  "new-zealand": { name: "New Zealand", slug: "new-zealand" },
  portugal: { name: "Portugal", slug: "portugal" },
};

// ============================================================================
// COMPREHENSIVE CITY -> COUNTRY MAP
// One country per city - NO duplication!
// ============================================================================

const CITY_COUNTRY_MAP: Record<string, string> = {
  // ==================== UK ====================
  // Major cities
  "london": "UK",
  "manchester": "UK",
  "birmingham": "UK",
  "edinburgh": "UK",
  "glasgow": "UK",
  "liverpool": "UK",
  "bristol": "UK",
  "leeds": "UK",
  "sheffield": "UK",
  "oxford": "UK",
  "bath": "UK",
  "cardiff": "UK",
  "belfast": "UK",
  "nottingham": "UK",
  "newcastle": "UK",
  "brighton": "UK",
  "cambridge": "UK",

  // UK Counties/Regions
  "cambridgeshire": "UK",
  "greater-manchester": "UK",
  "surrey": "UK",
  "hampshire": "UK",
  "kent": "UK",
  "essex": "UK",
  "hertfordshire": "UK",
  "berkshire": "UK",
  "buckinghamshire": "UK",
  "west-sussex": "UK",
  "east-sussex": "UK",
  "oxfordshire": "UK",
  "suffolk": "UK",
  "norfolk": "UK",
  "devon": "UK",
  "cornwall": "UK",
  "somerset": "UK",
  "dorset": "UK",
  "wiltshire": "UK",
  "gloucestershire": "UK",
  "warwickshire": "UK",
  "worcestershire": "UK",
  "staffordshire": "UK",
  "derbyshire": "UK",
  "nottinghamshire": "UK",
  "leicestershire": "UK",
  "northamptonshire": "UK",
  "cheshire": "UK",
  "lancashire": "UK",
  "yorkshire": "UK",
  "north-yorkshire": "UK",
  "south-yorkshire": "UK",
  "west-yorkshire": "UK",
  "merseyside": "UK",
  "tyne-and-wear": "UK",
  "west-midlands": "UK",
  "scotland": "UK",
  "england": "UK",
  "wales": "UK",

  // London neighborhoods
  "chelsea": "UK",
  "kensington": "UK",
  "mayfair": "UK",
  "knightsbridge": "UK",
  "notting-hill": "UK",
  "belgravia": "UK",
  "hampstead": "UK",
  "richmond": "UK",
  "wimbledon": "UK",
  "fulham": "UK",
  "putney": "UK",
  "battersea": "UK",
  "clapham": "UK",
  "islington": "UK",
  "hackney": "UK",
  "camden": "UK",
  "westminster": "UK",
  "lambeth": "UK",
  "wandsworth": "UK",
  "west-brompton": "UK",
  "hampstead-heath": "UK",
  "richmond-upon-thames": "UK",
  "hammersmith-and-fulham": "UK",
  "st-johns-wood": "UK",
  "primrose-hill": "UK",
  "holland-park": "UK",

  // UK Towns
  "brighton-and-hove": "UK",
  "canterbury": "UK",
  "chelmsford": "UK",
  "chichester": "UK",
  "exeter": "UK",
  "gloucester": "UK",
  "leicester": "UK",
  "norwich": "UK",
  "salisbury": "UK",
  "southampton": "UK",
  "st-albans": "UK",
  "truro": "UK",
  "winchester": "UK",
  "worcester": "UK",
  "york": "UK",
  "windsor": "UK",
  "ascot": "UK",
  "henley": "UK",
  "cobham": "UK",
  "esher": "UK",
  "weybridge": "UK",
  "virginia-water": "UK",
  "sunningdale": "UK",
  "beaconsfield": "UK",
  "gerrards-cross": "UK",
  "marlow": "UK",

  // ==================== USA ====================
  // Major cities
  "miami": "USA",
  "los-angeles": "USA",
  "new-york": "USA",
  "chicago": "USA",
  "san-francisco": "USA",
  "houston": "USA",
  "dallas": "USA",
  "seattle": "USA",
  "boston": "USA",
  "atlanta": "USA",
  "denver": "USA",
  "phoenix": "USA",
  "las-vegas": "USA",
  "san-diego": "USA",
  "nashville": "USA",
  "orlando": "USA",
  "austin": "USA",
  "washington": "USA",
  "philadelphia": "USA",
  "san-antonio": "USA",
  "charlotte": "USA",
  "minneapolis": "USA",
  "portland": "USA",
  "detroit": "USA",
  "baltimore": "USA",
  "tampa": "USA",
  "tamba": "USA", // Typo for Tampa

  // US States
  "california": "USA",
  "florida": "USA",
  "texas": "USA",
  "new-york-state": "USA",
  "colorado": "USA",
  "arizona": "USA",
  "nevada": "USA",
  "washington-state": "USA",
  "massachusetts": "USA",
  "illinois": "USA",
  "georgia": "USA",
  "tennessee": "USA",
  "north-carolina": "USA",
  "virginia": "USA",
  "utah": "USA",
  "wyoming": "USA",
  "connecticut": "USA",
  "new-jersey": "USA",

  // LA Area
  "beverly-hills": "USA",
  "bel-air": "USA",
  "malibu": "USA",
  "brentwood": "USA",
  "brentwood-park": "USA",
  "pacific-palisades": "USA",
  "santa-monica": "USA",
  "hollywood-hills": "USA",
  "calabasas": "USA",
  "hidden-hills": "USA",
  "westwood": "USA",
  "manhattan-beach": "USA",
  "palos-verdes": "USA",
  "bel-air-estates": "USA",
  "holmby-hills": "USA",
  "upper-laurel-canyon": "USA",
  "carmel-canyon": "USA",
  "beverly-crest": "USA",
  "beverly-park": "USA",
  "los-angeles-county": "USA",
  "la": "USA",

  // NYC Area
  "new-york-county": "USA",
  "manhattan": "USA",
  "brooklyn": "USA",
  "queens": "USA",
  "hamptons": "USA",
  "the-hamptons": "USA",
  "long-island": "USA",
  "greenwich": "USA",
  "westchester": "USA",
  "newark-jersey-city": "USA",

  // Florida
  "palm-beach": "USA",
  "key-west": "USA",
  "fort-lauderdale": "USA",
  "naples": "USA",
  "sarasota": "USA",
  "jupiter": "USA",
  "boca-raton": "USA",
  "coral-gables": "USA",
  "fisher-island": "USA",
  "star-island": "USA",
  "harbor-island": "USA",

  // California
  "napa": "USA",
  "san-jose": "USA",
  "palo-alto": "USA",
  "atherton": "USA",
  "woodside": "USA",
  "hillsborough": "USA",
  "tiburon": "USA",
  "sausalito": "USA",
  "ross": "USA",
  "larkspur": "USA",
  "mill-valley": "USA",
  "st-helena": "USA",
  "yountville": "USA",
  "carmel-by-the-sea": "USA",
  "pebble-beach": "USA",
  "lake-tahoe": "USA",
  "palm-springs": "USA",
  "rancho-santa-fe": "USA",
  "montecito": "USA",
  "santa-barbara": "USA",
  "newport-beach": "USA",
  "corona-del-mar-beach": "USA",
  "laguna-beach": "USA",
  "la-jolla": "USA",
  "la-jolla-farms": "USA",
  "torrey-pines": "USA",
  "rancho-cucamonga": "USA",
  "cameo-highlands": "USA",
  "cameo-shores": "USA",
  "pelican-crest": "USA",
  "pelican-hill": "USA",

  // Colorado
  "aspen": "USA",
  "vail": "USA",
  "beaver-creek": "USA",
  "beaver-creek-resort": "USA",
  "telluride": "USA",
  "breckenridge": "USA",

  // Other US
  "scottsdale": "USA",
  "paradise-valley": "USA",
  "sedona": "USA",
  "park-city": "USA",
  "jackson-hole": "USA",
  "jackson-hole-mountain-resort": "USA",
  "sun-valley": "USA",
  "martha-s-vineyard": "USA",
  "nantucket": "USA",
  "cape-cod": "USA",
  "ashville": "USA", // Asheville
  "asheville": "USA",
  "charleston": "USA",
  "savannah": "USA",
  "arlington": "USA",
  "falls-church-city": "USA",
  "ashley-falls": "USA",
  "austin-round-rock": "USA",
  "midland": "USA",
  "rolling-hills": "USA",
  "the-hill-section": "USA",
  "haven-view-estates": "USA",
  "deer-creek": "USA",
  "linda-island": "USA",
  "san-padre-island": "USA",
  "newton": "USA",

  // ==================== FRANCE ====================
  "paris": "France",
  "nice": "France",
  "cannes": "France",
  "saint-tropez": "France",
  "monaco": "Monaco", // Actually Monaco but often grouped with French Riviera
  "antibes": "France",
  "cap-dantibes": "France",
  "cap-ferrat": "France",
  "saint-cap-ferrat": "France",
  "eze": "France",
  "villefranche": "France",
  "menton": "France",
  "mougins": "France",
  "valbonne": "France",
  "biot": "France",
  "grasse": "France",
  "saint-paul-de-vence": "France",
  "vence": "France",
  "mandelieu": "France",
  "sainte-maxime": "France",
  "gassin": "France",
  "ramatuelle": "France",
  "la-croix-valmer": "France",
  "saint-raphal": "France",
  "thoules-sur-mer": "France",

  // Paris area
  "paris-16me": "France",
  "paris-7e": "France",
  "paris-8me": "France",
  "neuilly-sur-seine": "France",
  "hauts-de-seine": "France",
  "ile-de-france": "France",
  "yvelines": "France",
  "feucherolles": "France",
  "fourqueux": "France",
  "letang-la-ville": "France",
  "le-vsinet": "France",
  "mareil-marly": "France",
  "st-nom-la-breteche": "France",
  "vaucresson": "France",
  "versailles": "France",
  "saint-cloud": "France",

  // French regions
  "french-riviera": "France",
  "cote-dazur": "France",
  "provence": "France",
  "french-alps": "France",
  "courchevel": "France",
  "megve": "France",
  "megeve": "France",
  "mribel": "France",
  "meribel": "France",
  "chamonix": "France",
  "val-dlsere": "France",
  "val-disere": "France",
  "french-antilles": "France",
  "saint-barthelemy": "France",
  "st-barts": "France",

  // ==================== SWITZERLAND ====================
  "zurich": "Switzerland",
  "geneva": "Switzerland",
  "gstaad": "Switzerland",
  "st-moritz": "Switzerland",
  "verbier": "Switzerland",
  "zermatt": "Switzerland",
  "davos": "Switzerland",
  "klosters": "Switzerland",
  "basel": "Switzerland",
  "basel-city": "Switzerland",
  "bern": "Switzerland",
  "lugano": "Switzerland",
  "lausanne": "Switzerland",
  "montreux": "Switzerland",
  "swiss-alps": "Switzerland",

  // ==================== ITALY ====================
  "rome": "Italy",
  "milan": "Italy",
  "florence": "Italy",
  "venice": "Italy",
  "naples": "Italy",
  "lake-como": "Italy",
  "como": "Italy",
  "sardinia": "Italy",
  "porto-cervo": "Italy",
  "amalfi": "Italy",
  "amalfi-coast": "Italy",
  "positano": "Italy",
  "ravello": "Italy",
  "sorrento": "Italy",
  "capri": "Italy",
  "ischia": "Italy",
  "portofino": "Italy",
  "santa-margherita": "Italy",
  "italian-riviera": "Italy",
  "cinque-terre": "Italy",
  "tuscany": "Italy",
  "umbria": "Italy",
  "sicily": "Italy",
  "taormina": "Italy",
  "cortina-dampezzo": "Italy",
  "dolomites": "Italy",
  "campanian-archipelago": "Italy",

  // ==================== SPAIN ====================
  "madrid": "Spain",
  "barcelona": "Spain",
  "marbella": "Spain",
  "ibiza": "Spain",
  "mallorca": "Spain",
  "palma-de-mallorca": "Spain",
  "menorca": "Spain",
  "formentera": "Spain",
  "balearic-islands": "Spain",
  "costa-del-sol": "Spain",
  "seville": "Spain",
  "valencia": "Spain",
  "malaga": "Spain",
  "catalunya": "Spain",

  // ==================== GREECE ====================
  "athens": "Greece",
  "mykonos": "Greece",
  "mikonos": "Greece",
  "santorini": "Greece",
  "crete": "Greece",
  "rhodes": "Greece",
  "corfu": "Greece",
  "paros": "Greece",
  "hydra": "Greece",
  "spetses": "Greece",
  "southern-aegean": "Greece",

  // ==================== UAE ====================
  "dubai": "UAE",
  "abu-dhabi": "UAE",

  // ==================== MONACO ====================
  "monte-carlo": "Monaco",

  // ==================== AUSTRALIA ====================
  "sydney": "Australia",
  "melbourne": "Australia",
  "brisbane": "Australia",
  "perth": "Australia",
  "gold-coast": "Australia",
  "adelaide": "Australia",
  "cairns": "Australia",
  "new-south-wale": "Australia",
  "new-south-wales": "Australia",
  "victoria": "Australia",
  "queensland": "Australia",

  // ==================== NEW ZEALAND ====================
  "auckland": "New Zealand",
  "wellington": "New Zealand",
  "queenstown": "New Zealand",

  // ==================== CANADA ====================
  "toronto": "Canada",
  "vancouver": "Canada",
  "montreal": "Canada",
  "calgary": "Canada",
  "whistler": "Canada",
  "british-columbia": "Canada",
  "ontario": "Canada",
  "alberta": "Canada",

  // ==================== MEXICO ====================
  "cancun": "Mexico",
  "cabo-san-lucas": "Mexico",
  "los-cabos": "Mexico",
  "puerto-vallarta": "Mexico",
  "mexico-city": "Mexico",
  "yucatn-peninsula": "Mexico",
  "yucatan-peninsula": "Mexico",

  // ==================== CARIBBEAN ====================
  // (Various territories)
  "bahamas": "Bahamas",
  "barbados": "Barbados",
  "cayman-islands": "Cayman Islands",
  "turks-and-caicos": "Turks and Caicos",
  "antigua": "Antigua",
  "anguilla": "Anguilla",
  "mustique": "St Vincent",
  "st-kitts": "St Kitts",
  "nevis": "St Kitts",
  "bermuda": "Bermuda",
  "virgin-islands": "Virgin Islands",

  // ==================== RUSSIA ====================
  "moscow": "Russia",
  "saint-petersburg": "Russia",
  "sochi": "Russia",

  // ==================== CHINA ====================
  "beijing": "China",
  "shanghai": "China",
  "hong-kong": "China",
  "dongguan": "China",
  "guangdong-province": "China",

  // ==================== SINGAPORE ====================
  "singapore": "Singapore",

  // ==================== IRELAND ====================
  "dublin": "Ireland",

  // ==================== AUSTRIA ====================
  "vienna": "Austria",
  "salzburg": "Austria",
  "innsbruck": "Austria",
  "lech": "Austria",
  "vorarlberg": "Austria",
  "kitzbuhel": "Austria",

  // ==================== PORTUGAL ====================
  "lisbon": "Portugal",
  "porto": "Portugal",
  "algarve": "Portugal",
  "cascais": "Portugal",
};

// ============================================================================
// TITLE PARSING
// ============================================================================

interface ParsedPage {
  position: string;
  positionSlug: string;
  location: string;
  locationSlug: string;
  isCountryLevel: boolean;
  countryFromSlug: string | null;
}

function extractPosition(title: string): { position: string; positionSlug: string; priority: number } | null {
  for (const { pattern, position, positionSlug, priority } of POSITION_PATTERNS) {
    if (pattern.test(title)) {
      return { position, positionSlug, priority };
    }
  }
  return null;
}

function extractLocation(title: string): string | null {
  const match = title.match(/(?:in|for)\s+(.+?)\s*$/i) || title.match(/(?:butler|chef|PA|manager|nanny|housekeeper)\s+(.+?)\s*$/i);
  if (match) {
    return match[1].trim();
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function parseTitle(title: string, postName: string): ParsedPage | null {
  const positionInfo = extractPosition(title);
  if (!positionInfo) {
    return null;
  }

  const location = extractLocation(title);
  if (!location) {
    return null;
  }

  // Check if this is a country-level page (from the slug pattern like "hire-a-butler-usa")
  const countryMatch = postName.match(/^hire-a-[\w-]+-(\w+)$/);
  const isCountryLevel = !!countryMatch && !!COUNTRY_MAPPINGS[countryMatch[1]?.toLowerCase()];

  let countryFromSlug: string | null = null;
  if (isCountryLevel && countryMatch) {
    const countryKey = countryMatch[1].toLowerCase();
    if (COUNTRY_MAPPINGS[countryKey]) {
      countryFromSlug = COUNTRY_MAPPINGS[countryKey].name;
    }
  }

  return {
    position: positionInfo.position,
    positionSlug: positionInfo.positionSlug,
    location: location,
    locationSlug: slugify(location),
    isCountryLevel,
    countryFromSlug,
  };
}

// ============================================================================
// CSV ROW INTERFACE
// ============================================================================

interface CSVRow {
  id: string;
  post_type: string;
  post_title: string;
  post_name: string;
  post_date: string;
  url: string;
  seo_title: string;
  meta_description: string;
}

interface ProcessedPage {
  wpId: string;
  originalUrl: string;
  originalSlug: string;
  postTitle: string;
  seoTitle: string;
  metaDescription: string;
  position: string;
  positionSlug: string;
  priority: number;
  location: string;
  locationSlug: string;
  country: string | null;
  isCountryLevel: boolean;
  newUrlPath: string;
}

// ============================================================================
// URL GENERATION - Simple format without country in URL
// ============================================================================

function generateNewUrl(page: ProcessedPage): string {
  if (page.isCountryLevel && page.country) {
    // Country-level: /hire-a-butler-usa/
    const countrySlug = slugify(page.country);
    return `hire-a-${page.positionSlug}-${countrySlug}`;
  } else {
    // City-level: /hire-a-butler/miami/ (NO country in URL)
    return `hire-a-${page.positionSlug}/${page.locationSlug}`;
  }
}

// Get country for a location - returns null if unknown
function getCountryForLocation(locationSlug: string): string | null {
  return CITY_COUNTRY_MAP[locationSlug] || null;
}

// ============================================================================
// CSV PARSING
// ============================================================================

async function parseCSV(filePath: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CSVRow[] = [];
    const fullPath = filePath.startsWith("/") ? filePath : `${process.cwd()}/${filePath}`;

    if (!existsSync(fullPath)) {
      reject(new Error(`File not found: ${fullPath}`));
      return;
    }

    createReadStream(fullPath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
        })
      )
      .on("data", (row: Record<string, string>) => {
        rows.push({
          id: row.ID || "",
          post_type: row.post_type || "",
          post_title: row.post_title || "",
          post_name: row.post_name || "",
          post_date: row.post_date || "",
          url: row.url || "",
          seo_title: row.seo_title || "",
          meta_description: row.meta_description || "",
        });
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("=".repeat(70));
  console.log("WordPress SEO Pages Import v2");
  console.log("=".repeat(70));
  console.log(`File: ${csvFilePath}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`AI Generation: ${aiGenerate}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log("");

  // Parse CSV
  console.log("Parsing CSV file...");
  let rows = await parseCSV(csvFilePath);
  console.log(`Found ${rows.length} rows\n`);

  if (limit) {
    rows = rows.slice(0, limit);
    console.log(`Limited to ${rows.length} rows\n`);
  }

  // Process each row
  console.log("Processing pages...\n");

  const processedPages: ProcessedPage[] = [];
  const parseErrors: { row: CSVRow; reason: string }[] = [];
  const unknownLocations: Set<string> = new Set();
  const urlMap = new Map<string, ProcessedPage[]>();

  for (const row of rows) {
    const parsed = parseTitle(row.post_title, row.post_name);

    if (!parsed) {
      parseErrors.push({ row, reason: "Could not parse title" });
      continue;
    }

    const oldSlug = row.post_name.replace(/^"|"$/g, "");
    const oldUrl = row.url
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/^\//, "")
      .replace(/\/$/, "");

    const positionInfo = extractPosition(row.post_title);

    // Determine country
    let country: string | null = null;
    if (parsed.isCountryLevel) {
      country = parsed.countryFromSlug;
    } else {
      country = getCountryForLocation(parsed.locationSlug);
      if (!country) {
        unknownLocations.add(parsed.locationSlug);
      }
    }

    const page: ProcessedPage = {
      wpId: row.id,
      originalUrl: oldUrl || oldSlug,
      originalSlug: oldSlug,
      postTitle: row.post_title,
      seoTitle: row.seo_title,
      metaDescription: row.meta_description,
      position: parsed.position,
      positionSlug: parsed.positionSlug,
      priority: positionInfo?.priority ?? 99,
      location: parsed.location,
      locationSlug: parsed.locationSlug,
      country: country,
      isCountryLevel: parsed.isCountryLevel,
      newUrlPath: "",
    };
    page.newUrlPath = generateNewUrl(page);
    processedPages.push(page);

    // Track for conflict detection
    if (!urlMap.has(page.newUrlPath)) {
      urlMap.set(page.newUrlPath, []);
    }
    urlMap.get(page.newUrlPath)!.push(page);
  }

  // Summary
  console.log("=".repeat(70));
  console.log("PARSING SUMMARY");
  console.log("=".repeat(70));
  console.log(`Successfully parsed: ${processedPages.length}`);
  console.log(`Parse errors: ${parseErrors.length}`);
  console.log(`Unknown locations (no country): ${unknownLocations.size}`);
  console.log("");

  // Position breakdown
  const positionCounts = new Map<string, number>();
  for (const page of processedPages) {
    positionCounts.set(page.position, (positionCounts.get(page.position) || 0) + 1);
  }
  console.log("By position:");
  for (const [position, count] of positionCounts) {
    console.log(`  ${position}: ${count}`);
  }
  console.log("");

  // Country breakdown
  const countryCounts = new Map<string, number>();
  for (const page of processedPages) {
    const c = page.country || "UNKNOWN";
    countryCounts.set(c, (countryCounts.get(c) || 0) + 1);
  }
  console.log("By country:");
  const sortedCountries = Array.from(countryCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [country, count] of sortedCountries.slice(0, 15)) {
    console.log(`  ${country}: ${count}`);
  }
  if (sortedCountries.length > 15) {
    console.log(`  ... and ${sortedCountries.length - 15} more`);
  }
  console.log("");

  // Show unknown locations
  if (unknownLocations.size > 0) {
    console.log("Unknown locations (need manual country assignment):");
    const unknownArray = Array.from(unknownLocations).sort();
    unknownArray.slice(0, 20).forEach((loc) => {
      console.log(`  - ${loc}`);
    });
    if (unknownArray.length > 20) {
      console.log(`  ... and ${unknownArray.length - 20} more`);
    }
    console.log("");
  }

  // URL conflict analysis
  const conflicts = Array.from(urlMap.entries()).filter(([_, pages]) => pages.length > 1);
  console.log("URL Analysis:");
  console.log(`  Unique URLs: ${urlMap.size - conflicts.length}`);
  console.log(`  Conflicting URLs: ${conflicts.length}`);
  console.log("");

  // Show sample pages
  console.log("Sample processed pages:");
  processedPages.slice(0, 10).forEach((page) => {
    console.log(`  "${page.postTitle}"`);
    console.log(`    Old: /${page.originalSlug}/`);
    console.log(`    New: /${page.newUrlPath}/`);
    console.log(`    Country: ${page.country || "UNKNOWN"}`);
    console.log("");
  });

  // Show parse errors
  if (parseErrors.length > 0) {
    console.log("Parse errors (first 10):");
    parseErrors.slice(0, 10).forEach(({ row, reason }) => {
      console.log(`  "${row.post_title}" - ${reason}`);
    });
    console.log("");
  }

  if (dryRun) {
    console.log("[DRY RUN] No database changes made.");
    console.log("Run without --dry-run to import pages and create redirects.");

    // Write analysis to file
    const analysisFile = "scripts/data/wp-import-analysis.json";
    writeFileSync(
      analysisFile,
      JSON.stringify(
        {
          summary: {
            total: rows.length,
            parsed: processedPages.length,
            errors: parseErrors.length,
            unknownLocations: unknownLocations.size,
          },
          positionCounts: Object.fromEntries(positionCounts),
          countryCounts: Object.fromEntries(countryCounts),
          unknownLocations: Array.from(unknownLocations).sort(),
          pages: processedPages.map((p) => ({
            originalSlug: p.originalSlug,
            newUrlPath: p.newUrlPath,
            position: p.position,
            location: p.location,
            country: p.country,
          })),
        },
        null,
        2
      )
    );
    console.log(`\nAnalysis written to ${analysisFile}`);
    return;
  }

  // ========================================================================
  // DATABASE IMPORT
  // ========================================================================

  console.log("=".repeat(70));
  console.log("IMPORTING TO DATABASE");
  console.log("=".repeat(70));

  // 1. Insert SEO landing pages
  console.log("\n1. Creating SEO landing pages...");

  const landingPages = processedPages.map((page) => ({
    position: page.position,
    position_slug: page.positionSlug,
    country: page.country,
    country_slug: page.country ? slugify(page.country) : null,
    state: null,
    state_slug: null,
    city: page.isCountryLevel ? null : page.location,
    city_slug: page.isCountryLevel ? null : page.locationSlug,
    original_url_path: page.newUrlPath,
    meta_title: page.seoTitle || page.postTitle,
    meta_description: page.metaDescription || `Looking to hire a ${page.position.toLowerCase()} in ${page.location}? Lighthouse careers can help you find top candidates.`,
    hero_headline: page.postTitle,
    hero_subheadline: `Find qualified ${page.position.toLowerCase()} candidates in ${page.location}`,
    is_active: true,
    ai_generation_status: aiGenerate ? (page.country ? "pending" : "needs_review") : "none",
  }));

  // Insert in batches
  const batchSize = 50;
  let insertedPages = 0;

  for (let i = 0; i < landingPages.length; i += batchSize) {
    const batch = landingPages.slice(i, i + batchSize);
    const { error } = await supabase.from("seo_landing_pages").upsert(batch, {
      onConflict: "original_url_path",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`  Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      insertedPages += batch.length;
      if (verbose) {
        console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} pages`);
      }
    }
  }
  console.log(`  Total pages inserted/updated: ${insertedPages}`);

  // 2. Create redirects
  console.log("\n2. Creating redirects...");

  // Sort by priority for conflict resolution
  const sortedByPriority = [...processedPages].sort((a, b) => a.priority - b.priority);

  const redirects: { old_url_path: string; new_url_path: string; content_type: string; source: string }[] = [];

  for (const page of sortedByPriority) {
    if (page.originalSlug !== page.newUrlPath) {
      redirects.push({
        old_url_path: page.originalSlug,
        new_url_path: `/${page.newUrlPath}/`,
        content_type: "landing_page",
        source: "wordpress_migration",
      });
    }
  }

  // Deduplicate redirects
  const uniqueRedirects = new Map<string, (typeof redirects)[0]>();
  for (const redirect of redirects) {
    if (!uniqueRedirects.has(redirect.old_url_path)) {
      uniqueRedirects.set(redirect.old_url_path, redirect);
    }
  }

  const redirectsToInsert = Array.from(uniqueRedirects.values());
  let insertedRedirects = 0;

  for (let i = 0; i < redirectsToInsert.length; i += batchSize) {
    const batch = redirectsToInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("url_redirects").upsert(batch, {
      onConflict: "old_url_path",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`  Error inserting redirect batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else {
      insertedRedirects += batch.length;
      if (verbose) {
        console.log(`  Inserted redirect batch ${Math.floor(i / batchSize) + 1}: ${batch.length} redirects`);
      }
    }
  }
  console.log(`  Total redirects inserted/updated: ${insertedRedirects}`);

  console.log("\n" + "=".repeat(70));
  console.log("IMPORT COMPLETE");
  console.log("=".repeat(70));
  console.log(`SEO Landing Pages: ${insertedPages}`);
  console.log(`Redirects: ${insertedRedirects}`);
  console.log(`Pages without country (needs_review): ${unknownLocations.size * positionCounts.size}`);

  if (aiGenerate) {
    console.log(`\nAI Generation: ENABLED`);
    console.log(`  - Pages with known country: ai_generation_status='pending'`);
    console.log(`  - Pages without country: ai_generation_status='needs_review'`);
    console.log(`\nTo generate content: The cron job will process 'pending' pages.`);
    console.log(`For 'needs_review' pages, assign country first, then set status to 'pending'.`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
