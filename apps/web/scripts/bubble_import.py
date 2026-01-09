#!/usr/bin/env python3
"""
Bubble CSV Import Script

Imports candidates from Bubble CSV export into Supabase database,
linking to existing Vincere records via email matching.

Run: cd apps/web && python3 scripts/bubble_import.py

Features:
- Checkpoint-based resumability (saves progress every 100 candidates)
- Loads Vincere email→ID mapping from CSV + API
- Batch upserts to Supabase
- Detailed progress logging

Requirements:
    pip install supabase python-dotenv requests
"""

import os
import sys
import csv
import json
import time
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

# Try to import supabase
try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase package not installed. Run: pip install supabase")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: requests package not installed. Run: pip install requests")
    sys.exit(1)

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
CHECKPOINT_FILE = SCRIPT_DIR / ".bubble-import-checkpoint.json"
VINCERE_MAP_FILE = SCRIPT_DIR / ".bubble-import-vincere-map.json"
ERROR_LOG_FILE = SCRIPT_DIR / ".bubble-import-errors.json"

BATCH_SIZE = 100
CHECKPOINT_INTERVAL = 100  # Save checkpoint every N candidates

# Default paths
DEFAULT_CANDIDATES_CSV = DATA_DIR / "bubble-candidates.csv"
DEFAULT_VINCERE_CSV = DATA_DIR / "vincere-candidates.csv"

# ============================================================================
# ENV LOADING
# ============================================================================

def load_env():
    """Load environment variables from .env.local files"""
    possible_paths = [
        SCRIPT_DIR.parent / ".env.local",
        SCRIPT_DIR.parent.parent.parent / ".env.local",
    ]

    for env_path in possible_paths:
        if env_path.exists():
            load_dotenv(env_path)
            print(f"Loaded env from: {env_path}")
            break

load_env()

# ============================================================================
# SUPABASE CLIENT
# ============================================================================

def get_supabase_client() -> Client:
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        print("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    return create_client(url, key)

# ============================================================================
# VINCERE API CLIENT
# ============================================================================

class VincereClient:
    def __init__(self):
        self.client_id = os.getenv("VINCERE_CLIENT_ID")
        self.api_key = os.getenv("VINCERE_API_KEY")
        self.domain_id = os.getenv("VINCERE_DOMAIN_ID", "lighthousecrew")
        self.base_url = f"https://{self.domain_id}.vincere.io/api/v2"
        self.access_token = None
        self.token_expires = 0

        if not self.client_id or not self.api_key:
            print("WARNING: Vincere credentials not set, API fetch will be skipped")

    def _refresh_token(self):
        """Get a new access token using the refresh token"""
        refresh_token = os.getenv("VINCERE_REFRESH_TOKEN")
        if not refresh_token:
            raise Exception("VINCERE_REFRESH_TOKEN not set")

        url = f"https://id.vincere.io/oauth2/token"
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": self.client_id,
        }

        resp = requests.post(url, data=data)
        resp.raise_for_status()

        result = resp.json()
        self.access_token = result["access_token"]
        self.token_expires = time.time() + result.get("expires_in", 3600) - 60

    def _ensure_token(self):
        if not self.access_token or time.time() >= self.token_expires:
            self._refresh_token()

    def get(self, endpoint: str) -> dict:
        self._ensure_token()

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "x-api-key": self.api_key,
            "id-token": self.access_token,
            "Content-Type": "application/json",
        }

        url = f"{self.base_url}{endpoint}"
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        return resp.json()

# ============================================================================
# CHECKPOINT MANAGEMENT
# ============================================================================

def load_checkpoint() -> dict:
    """Load checkpoint from file"""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r") as f:
            return json.load(f)
    return {
        "last_processed_row": 0,
        "imported_count": 0,
        "updated_count": 0,
        "skipped_count": 0,
        "error_count": 0,
        "started_at": datetime.now().isoformat(),
    }

def save_checkpoint(checkpoint: dict):
    """Save checkpoint to file"""
    checkpoint["updated_at"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump(checkpoint, f, indent=2)

def load_vincere_map() -> dict:
    """Load Vincere email→ID mapping from cache file"""
    if VINCERE_MAP_FILE.exists():
        with open(VINCERE_MAP_FILE, "r") as f:
            return json.load(f)
    return {}

def save_vincere_map(email_map: dict):
    """Save Vincere email→ID mapping to cache file"""
    with open(VINCERE_MAP_FILE, "w") as f:
        json.dump(email_map, f)

def load_errors() -> list:
    """Load error log"""
    if ERROR_LOG_FILE.exists():
        with open(ERROR_LOG_FILE, "r") as f:
            return json.load(f)
    return []

def save_errors(errors: list):
    """Save error log"""
    with open(ERROR_LOG_FILE, "w") as f:
        json.dump(errors, f, indent=2)

# ============================================================================
# VINCERE EMAIL MAPPING
# ============================================================================

def load_vincere_map_from_csv(csv_path: Path) -> dict:
    """Load email→ID mapping from Vincere CSV export"""
    email_map = {}

    print(f"Loading Vincere mapping from CSV: {csv_path}")

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get("primary_email", "").lower().strip()
            candidate_id = row.get("candidate_id", "").strip()
            if email and candidate_id:
                email_map[email] = candidate_id

    print(f"Loaded {len(email_map)} email→ID mappings from CSV")
    return email_map

def fetch_recent_vincere_candidates(client: VincereClient, existing_map: dict) -> int:
    """Fetch recent candidates from Vincere API to supplement CSV"""
    PAGE_SIZE = 100
    MAX_OFFSET = 9900
    added = 0
    offset = 0

    print("Fetching recent Vincere candidates from API...")

    while offset <= MAX_OFFSET:
        try:
            url = f"/candidate/search/fl=id,primary_email;sort=created_date desc?start={offset}&limit={PAGE_SIZE}"
            result = client.get(url)
            items = result.get("result", {}).get("items", [])

            if not items:
                break

            new_this_batch = 0
            for item in items:
                email = (item.get("primary_email") or "").lower().strip()
                if email and email not in existing_map:
                    existing_map[email] = str(item["id"])
                    added += 1
                    new_this_batch += 1

            offset += PAGE_SIZE
            time.sleep(1)  # Rate limit

            if offset % 1000 == 0:
                print(f"  API progress: offset={offset}, added {added} new emails")

            # Stop if we're not finding new emails
            if new_this_batch == 0 and offset > 1000:
                print("  No new emails in last batch, stopping API fetch")
                break

            if len(items) < PAGE_SIZE:
                break

        except Exception as e:
            print(f"  API error at offset {offset}: {e}")
            time.sleep(5)

    print(f"Added {added} new email mappings from API")
    return added

def build_vincere_email_map(vincere_csv_path: Optional[Path], skip_api: bool = False) -> dict:
    """Build complete email→ID mapping from CSV and API"""

    # Check for cached map first
    cached_map = load_vincere_map()
    if cached_map:
        print(f"Using cached Vincere map with {len(cached_map)} entries")
        return cached_map

    email_map = {}

    # Load from CSV
    if vincere_csv_path and vincere_csv_path.exists():
        email_map = load_vincere_map_from_csv(vincere_csv_path)

        # Supplement with API if credentials available
        if not skip_api:
            try:
                client = VincereClient()
                if client.client_id and client.api_key:
                    fetch_recent_vincere_candidates(client, email_map)
            except Exception as e:
                print(f"Warning: Could not fetch from Vincere API: {e}")

    # Save to cache
    save_vincere_map(email_map)
    print(f"Vincere mapping complete: {len(email_map)} unique emails")

    return email_map

# ============================================================================
# FIELD MAPPING
# ============================================================================

def parse_date(value: str) -> Optional[str]:
    """Parse various date formats to ISO format"""
    if not value:
        return None

    value = value.strip()

    # Bubble format: "Sep 2, 1994 8:30 PM"
    months = {
        "jan": "01", "feb": "02", "mar": "03", "apr": "04",
        "may": "05", "jun": "06", "jul": "07", "aug": "08",
        "sep": "09", "oct": "10", "nov": "11", "dec": "12"
    }

    import re

    # Bubble format
    match = re.match(r"^(\w+)\s+(\d{1,2}),?\s+(\d{4})", value)
    if match:
        month_str = match.group(1).lower()[:3]
        if month_str in months:
            day = match.group(2).zfill(2)
            year = match.group(3)
            return f"{year}-{months[month_str]}-{day}"

    # ISO format
    match = re.match(r"^(\d{4})-(\d{2})-(\d{2})", value)
    if match:
        return f"{match.group(1)}-{match.group(2)}-{match.group(3)}"

    # US format MM/DD/YYYY
    match = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})", value)
    if match:
        month = match.group(1).zfill(2)
        day = match.group(2).zfill(2)
        year = match.group(3)
        return f"{year}-{month}-{day}"

    return None

def parse_boolean(value: str) -> bool:
    """Parse yes/no/true/false to boolean"""
    if not value:
        return False
    lower = value.lower().strip()
    return lower in ("yes", "true", "1")

def normalize_license(value: str) -> Optional[str]:
    """Normalize license names"""
    if not value:
        return None

    value = value.strip().lower()

    license_map = {
        "master 3000gt": "Master 3000GT",
        "master 3000": "Master 3000GT",
        "master (yacht) 3000gt": "Master 3000GT",
        "master 500gt": "Master 500GT",
        "master (yacht) 500gt": "Master 500GT",
        "oow 3000gt": "OOW 3000GT",
        "oow 500gt": "OOW 500GT",
        "yacht rating": "Yacht Rating",
        "yachtmaster offshore": "Yachtmaster Offshore",
        "yachtmaster ocean": "Yachtmaster Ocean",
        "yachtmaster coastal": "Yachtmaster Coastal",
        "day skipper": "Day Skipper",
        "no licence": None,
        "none": None,
        "n/a": None,
    }

    return license_map.get(value, value.title() if value else None)

def normalize_position(value: str) -> tuple:
    """Normalize position to (position, category)"""
    if not value:
        return (None, None)

    value = value.strip()

    # Position to category mapping
    deck_positions = ["captain", "first officer", "second officer", "third officer",
                      "bosun", "deckhand", "deck/stew"]
    interior_positions = ["chief stewardess", "chief stew", "stewardess", "stew",
                          "purser", "housekeeper", "laundry"]
    engineer_positions = ["chief engineer", "second engineer", "third engineer",
                          "eto", "electrician"]
    galley_positions = ["head chef", "chef", "sous chef", "cook", "galley"]

    lower = value.lower()

    if any(p in lower for p in deck_positions):
        return (value, "deck")
    elif any(p in lower for p in interior_positions):
        return (value, "interior")
    elif any(p in lower for p in engineer_positions):
        return (value, "engineering")
    elif any(p in lower for p in galley_positions):
        return (value, "galley")

    return (value, None)

def parse_salary_range(value: str) -> tuple:
    """Parse salary range string to (min, max)"""
    if not value:
        return (None, None)

    import re

    # Remove currency symbols
    cleaned = re.sub(r"[€$£]|euro|eur|usd", "", value, flags=re.IGNORECASE).strip()

    # Handle "k" notation
    cleaned = re.sub(r"(\d+)k", lambda m: str(int(m.group(1)) * 1000), cleaned, flags=re.IGNORECASE)

    # Find numbers
    numbers = re.findall(r"\d+", cleaned)

    if not numbers:
        return (None, None)

    if len(numbers) == 1:
        val = int(numbers[0])
        return (val, val)

    return (int(numbers[0]), int(numbers[1]))

def parse_yacht_size_range(value: str) -> tuple:
    """Parse yacht size range to (min, max)"""
    if not value:
        return (None, None)

    import re

    cleaned = re.sub(r"m|meters?|ft|feet", "", value, flags=re.IGNORECASE).strip()
    numbers = re.findall(r"\d+", cleaned)

    if not numbers:
        return (None, None)

    if len(numbers) == 1:
        val = int(numbers[0])
        return (val, val)

    return (int(numbers[0]), int(numbers[1]))

def normalize_contract_types(value: str) -> list:
    """Normalize contract types to list"""
    if not value:
        return []

    types = []
    lower = value.lower()

    if "perm" in lower:
        types.append("permanent")
    if "rotat" in lower:
        types.append("rotational")
    if "temp" in lower or "season" in lower:
        types.append("temporary")

    return types

def normalize_yacht_types(value: str) -> list:
    """Normalize yacht types to list"""
    if not value:
        return []

    types = []
    lower = value.lower()

    if "motor" in lower:
        types.append("motor")
    if "sail" in lower:
        types.append("sail")
    if "catamaran" in lower or "cat" in lower:
        types.append("catamaran")

    return types

def normalize_availability_status(value: str) -> Optional[str]:
    """Normalize availability status"""
    if not value:
        return None

    lower = value.lower().strip()

    status_map = {
        "available": "available",
        "active": "available",
        "looking": "available",
        "employed": "employed",
        "working": "employed",
        "not available": "unavailable",
        "unavailable": "unavailable",
    }

    for key, status in status_map.items():
        if key in lower:
            return status

    return None

def map_bubble_to_candidate(row: dict, vincere_id: Optional[str]) -> dict:
    """Map Bubble CSV row to Supabase candidate record"""

    position, category = normalize_position(row.get("Positions", ""))
    salary_min, salary_max = parse_salary_range(row.get("Desired Monthly Salary", ""))
    yacht_min, yacht_max = parse_yacht_size_range(row.get("Prefered Yacht Size", ""))

    partner_name = row.get("Partner name", "")
    partner_position = row.get("Partner Position", "")
    couple_position = row.get("Couple Position", "")
    has_partner = bool(partner_name or partner_position or couple_position)

    email = row.get("email", "").lower().strip()

    return {
        "vincere_id": vincere_id,

        # Basic info
        "first_name": row.get("Name First", "").strip() or None,
        "last_name": row.get("Name Last", "").strip() or None,
        "email": email if email else None,
        "phone": row.get("Phone Number", "").replace(" ", "") or None,
        "date_of_birth": parse_date(row.get("DOB", "")),
        "gender": row.get("Gender", "").lower() or None,
        "nationality": row.get("Nationality", "") or None,
        "second_nationality": row.get("Nationality 2", "") or None,
        "marital_status": row.get("Marital Status", "").lower() or None,

        # Professional
        "primary_position": position,
        "position_category": category,

        # Preferences
        "preferred_regions": [s.strip() for s in row.get("Desired Location", "").split(",") if s.strip()] or None,
        "preferred_contract_types": normalize_contract_types(row.get("Prefered Contract Type", "")) or None,
        "preferred_yacht_types": normalize_yacht_types(row.get("Prefered Yacht Type", "")) or None,
        "preferred_yacht_size_min": yacht_min,
        "preferred_yacht_size_max": yacht_max,

        # Salary
        "desired_salary_min": salary_min,
        "desired_salary_max": salary_max,
        "salary_currency": "EUR" if salary_min or salary_max else None,

        # Certifications
        "has_stcw": parse_boolean(row.get("STCW", "")),
        "has_eng1": parse_boolean(row.get("ENG 1", "")),
        "highest_license": normalize_license(row.get("Highest Licence", "")),
        "second_license": normalize_license(row.get("Second Licence", "")),

        # Visas
        "has_b1b2": parse_boolean(row.get("B1B2 Visa", "")),
        "has_schengen": parse_boolean(row.get("Schengen Visa", "")),

        # Personal
        "is_smoker": parse_boolean(row.get("Smoker", "")),
        "has_visible_tattoos": parse_boolean(row.get("Tattoos", "")),
        "tattoo_description": row.get("Tattoo Location", "") or None,

        # Couple
        "is_couple": has_partner,
        "partner_name": partner_name or None,
        "partner_position": partner_position or None,
        "couple_position": couple_position or None,

        # Availability
        "availability_status": normalize_availability_status(row.get("Candidate Status", "")),
        "available_from": parse_date(row.get("Start Date", "")),

        # Source tracking
        "source": "bubble_import",
    }

# ============================================================================
# MAIN IMPORT LOGIC
# ============================================================================

def count_csv_rows(csv_path: Path) -> int:
    """Count rows in CSV file"""
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        return sum(1 for _ in reader)

def upsert_candidate(supabase: Client, candidate: dict) -> tuple:
    """
    Insert or update a candidate. Returns (action, error).
    action: 'inserted', 'updated', 'skipped', or 'error'
    """
    email = candidate.get("email")
    if not email:
        return ("skipped", "No email")

    try:
        # Check if candidate exists (case-insensitive)
        result = supabase.table("candidates").select("id, vincere_id").ilike("email", email).execute()

        if result.data and len(result.data) > 0:
            # Update existing candidate
            existing = result.data[0]
            candidate_id = existing["id"]

            # Don't overwrite vincere_id if already set
            if existing.get("vincere_id") and not candidate.get("vincere_id"):
                candidate["vincere_id"] = existing["vincere_id"]

            # Remove email from update (can't update unique key)
            update_data = {k: v for k, v in candidate.items() if k != "email"}

            supabase.table("candidates").update(update_data).eq("id", candidate_id).execute()
            return ("updated", None)
        else:
            # Insert new candidate
            supabase.table("candidates").insert(candidate).execute()
            return ("inserted", None)

    except Exception as e:
        return ("error", str(e))

def import_candidates(
    candidates_csv: Path,
    vincere_csv: Optional[Path],
    dry_run: bool = False,
    skip_vincere_api: bool = False,
    resume: bool = True,
    limit: Optional[int] = None,
):
    """Main import function"""

    print("=" * 60, flush=True)
    print("BUBBLE CSV IMPORT", flush=True)
    print("=" * 60, flush=True)
    print(f"Candidates CSV: {candidates_csv}", flush=True)
    print(f"Vincere CSV: {vincere_csv}", flush=True)
    print(f"Dry run: {dry_run}", flush=True)
    print(f"Resume: {resume}", flush=True)
    print(f"Limit: {limit}", flush=True)
    print("=" * 60, flush=True)

    # Load or build Vincere map
    vincere_map = build_vincere_email_map(vincere_csv, skip_api=skip_vincere_api)

    # Load checkpoint
    checkpoint = load_checkpoint() if resume else {
        "last_processed_row": 0,
        "imported_count": 0,
        "updated_count": 0,
        "skipped_count": 0,
        "error_count": 0,
        "started_at": datetime.now().isoformat(),
    }

    errors = load_errors() if resume else []

    start_row = checkpoint["last_processed_row"]

    # Count total rows
    total_rows = count_csv_rows(candidates_csv)
    print(f"Total rows in CSV: {total_rows}", flush=True)
    print(f"Starting from row: {start_row}", flush=True)

    if limit:
        total_rows = min(total_rows, start_row + limit)

    # Get Supabase client
    if not dry_run:
        supabase = get_supabase_client()
    else:
        supabase = None

    # Process CSV
    row_num = 0
    vincere_linked = 0
    vincere_not_linked = 0

    with open(candidates_csv, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        for row in reader:
            row_num += 1

            # Skip already processed rows
            if row_num <= start_row:
                continue

            # Check limit
            if limit and row_num > start_row + limit:
                break

            # Get email
            email = row.get("email", "").lower().strip()
            if not email:
                checkpoint["skipped_count"] += 1
                continue

            # Look up Vincere ID
            vincere_id = vincere_map.get(email)
            if vincere_id:
                vincere_linked += 1
            else:
                vincere_not_linked += 1

            # Map to candidate record
            try:
                candidate = map_bubble_to_candidate(row, vincere_id)
            except Exception as e:
                checkpoint["error_count"] += 1
                errors.append({
                    "row": row_num,
                    "email": email,
                    "error": str(e),
                })
                continue

            # Insert or update candidate
            if not dry_run:
                action, error = upsert_candidate(supabase, candidate)
                if action == "inserted":
                    checkpoint["imported_count"] += 1
                elif action == "updated":
                    checkpoint["updated_count"] += 1
                elif action == "skipped":
                    checkpoint["skipped_count"] += 1
                else:  # error
                    checkpoint["error_count"] += 1
                    errors.append({
                        "row": row_num,
                        "email": email,
                        "error": error,
                    })
            else:
                checkpoint["imported_count"] += 1

            checkpoint["last_processed_row"] = row_num

            # Save checkpoint and print progress
            if row_num % CHECKPOINT_INTERVAL == 0:
                save_checkpoint(checkpoint)
                save_errors(errors)

                progress = (row_num / total_rows) * 100
                print(f"[{datetime.now().isoformat()}] Progress: {row_num}/{total_rows} ({progress:.1f}%) - "
                      f"Inserted: {checkpoint['imported_count']}, Updated: {checkpoint['updated_count']}, "
                      f"Errors: {checkpoint['error_count']}, Vincere linked: {vincere_linked}", flush=True)

    # Final save
    checkpoint["completed_at"] = datetime.now().isoformat()
    save_checkpoint(checkpoint)
    save_errors(errors)

    # Summary
    print("\n" + "=" * 60, flush=True)
    print("IMPORT COMPLETE", flush=True)
    print("=" * 60, flush=True)
    print(f"Total processed: {row_num}", flush=True)
    print(f"Inserted: {checkpoint['imported_count']}", flush=True)
    print(f"Updated: {checkpoint['updated_count']}", flush=True)
    print(f"Skipped (no email): {checkpoint['skipped_count']}", flush=True)
    print(f"Errors: {checkpoint['error_count']}", flush=True)
    print(f"Vincere linked: {vincere_linked}", flush=True)
    print(f"Not linked to Vincere: {vincere_not_linked}", flush=True)
    print(f"Vincere map size: {len(vincere_map)}", flush=True)
    print("=" * 60, flush=True)

    if errors:
        print(f"\nErrors saved to: {ERROR_LOG_FILE}", flush=True)

    return checkpoint

# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Import candidates from Bubble CSV to Supabase")
    parser.add_argument("--candidates", type=str, default=str(DEFAULT_CANDIDATES_CSV),
                        help="Path to Bubble candidates CSV")
    parser.add_argument("--vincere-csv", type=str, default=str(DEFAULT_VINCERE_CSV),
                        help="Path to Vincere candidates CSV for email→ID mapping")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate without importing")
    parser.add_argument("--skip-vincere-api", action="store_true",
                        help="Skip fetching recent candidates from Vincere API")
    parser.add_argument("--no-resume", action="store_true",
                        help="Start fresh, ignore checkpoint")
    parser.add_argument("--limit", type=int,
                        help="Limit number of candidates to process")
    parser.add_argument("--reset", action="store_true",
                        help="Reset checkpoint and start fresh")

    args = parser.parse_args()

    # Reset if requested
    if args.reset:
        if CHECKPOINT_FILE.exists():
            CHECKPOINT_FILE.unlink()
            print("Checkpoint reset")
        if ERROR_LOG_FILE.exists():
            ERROR_LOG_FILE.unlink()
            print("Error log reset")

    candidates_csv = Path(args.candidates)
    vincere_csv = Path(args.vincere_csv) if args.vincere_csv else None

    if not candidates_csv.exists():
        print(f"ERROR: Candidates CSV not found: {candidates_csv}")
        sys.exit(1)

    import_candidates(
        candidates_csv=candidates_csv,
        vincere_csv=vincere_csv,
        dry_run=args.dry_run,
        skip_vincere_api=args.skip_vincere_api,
        resume=not args.no_resume,
        limit=args.limit,
    )

if __name__ == "__main__":
    main()
