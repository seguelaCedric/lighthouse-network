#!/usr/bin/env python3
"""
Bubble Avatars Import Script

Imports avatar images from Bubble CSV export into Supabase Storage,
updating candidate photo_url field.

Run: cd apps/web && python3 scripts/bubble_import_avatars.py

Features:
- Checkpoint-based resumability
- Downloads from Bubble CDN
- Uploads to Supabase Storage (avatars bucket)
- Updates candidate photo_url

Requirements:
    pip install supabase python-dotenv requests
"""

import os
import sys
import csv
import json
import uuid
import argparse
import mimetypes
from pathlib import Path
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse, unquote
from dotenv import load_dotenv

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
CHECKPOINT_FILE = SCRIPT_DIR / ".bubble-avatars-checkpoint.json"
ERROR_LOG_FILE = SCRIPT_DIR / ".bubble-avatars-errors.json"

CHECKPOINT_INTERVAL = 50  # Save checkpoint every N candidates
REQUEST_TIMEOUT = 30  # Timeout for downloading files

DEFAULT_CANDIDATES_CSV = DATA_DIR / "bubble-candidates.csv"

# ============================================================================
# ENV LOADING
# ============================================================================

def load_env():
    possible_paths = [
        SCRIPT_DIR.parent / ".env.local",
        SCRIPT_DIR.parent.parent.parent / ".env.local",
    ]
    for env_path in possible_paths:
        if env_path.exists():
            load_dotenv(env_path)
            print(f"Loaded env from: {env_path}", flush=True)
            break

load_env()

# ============================================================================
# SUPABASE CLIENT
# ============================================================================

_supabase_client = None

def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client:
        return _supabase_client

    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        print("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    _supabase_client = create_client(url, key)
    return _supabase_client

# ============================================================================
# CHECKPOINT MANAGEMENT
# ============================================================================

def load_checkpoint() -> dict:
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r") as f:
            return json.load(f)
    return {
        "last_processed_row": 0,
        "uploaded_count": 0,
        "skipped_count": 0,
        "error_count": 0,
        "started_at": datetime.now().isoformat(),
    }

def save_checkpoint(checkpoint: dict):
    checkpoint["updated_at"] = datetime.now().isoformat()
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump(checkpoint, f, indent=2)

def load_errors() -> list:
    if ERROR_LOG_FILE.exists():
        with open(ERROR_LOG_FILE, "r") as f:
            return json.load(f)
    return []

def save_errors(errors: list):
    with open(ERROR_LOG_FILE, "w") as f:
        json.dump(errors, f, indent=2)

# ============================================================================
# UTILITIES
# ============================================================================

def normalize_url(url: str) -> str:
    """Normalize Bubble CDN URL"""
    if not url:
        return ""
    url = url.strip()
    if url.startswith("//"):
        return f"https:{url}"
    return url

def get_filename_from_url(url: str) -> str:
    """Extract filename from URL"""
    parsed = urlparse(url)
    path = unquote(parsed.path)
    filename = path.split("/")[-1]
    # Remove query params from filename
    if "?" in filename:
        filename = filename.split("?")[0]
    return filename or f"avatar_{uuid.uuid4().hex[:8]}.jpg"

def get_content_type(filename: str) -> str:
    """Get MIME type from filename"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "image/jpeg"

def sanitize_filename(filename: str) -> str:
    """Make filename safe for storage"""
    # Keep only safe characters
    safe = "".join(c if c.isalnum() or c in ".-_" else "_" for c in filename)
    # Ensure it has an extension
    if "." not in safe:
        safe += ".jpg"
    return safe

# ============================================================================
# CANDIDATE LOOKUP CACHE
# ============================================================================

_candidate_cache = {}

def get_candidate_by_email(supabase: Client, email: str) -> Optional[dict]:
    """Get candidate ID by email (cached)"""
    email_lower = email.lower().strip()

    if email_lower in _candidate_cache:
        return _candidate_cache[email_lower]

    try:
        result = supabase.table("candidates").select("id,photo_url").ilike("email", email_lower).execute()
        if result.data and len(result.data) > 0:
            _candidate_cache[email_lower] = result.data[0]
            return result.data[0]
    except Exception as e:
        print(f"  Error looking up candidate {email}: {e}", flush=True)

    _candidate_cache[email_lower] = None
    return None

# ============================================================================
# AVATAR UPLOAD
# ============================================================================

def download_file(url: str) -> Optional[bytes]:
    """Download file from URL"""
    try:
        resp = requests.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp.content
    except Exception as e:
        print(f"  Download error: {e}", flush=True)
        return None

def upload_to_storage(supabase: Client, bucket: str, path: str, content: bytes, content_type: str) -> bool:
    """Upload file to Supabase Storage"""
    try:
        # Check if file already exists
        try:
            folder = path.rsplit("/", 1)[0] if "/" in path else ""
            filename = path.rsplit("/", 1)[-1] if "/" in path else path
            existing = supabase.storage.from_(bucket).list(folder)
            if any(f["name"] == filename for f in existing):
                return True  # Already exists
        except:
            pass

        supabase.storage.from_(bucket).upload(
            path,
            content,
            {"content-type": content_type}
        )
        return True
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
            return True
        print(f"  Upload error: {e}", flush=True)
        return False

def update_candidate_photo_url(supabase: Client, candidate_id: str, photo_url: str) -> bool:
    """Update candidate's photo_url field"""
    try:
        supabase.table("candidates").update({
            "photo_url": photo_url
        }).eq("id", candidate_id).execute()
        return True
    except Exception as e:
        print(f"  Update error: {e}", flush=True)
        return False

# ============================================================================
# MAIN IMPORT LOGIC
# ============================================================================

def count_csv_rows(csv_path: Path) -> int:
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)
        return sum(1 for _ in reader)

def import_avatars(
    candidates_csv: Path,
    dry_run: bool = False,
    resume: bool = True,
    limit: Optional[int] = None,
):
    print("=" * 60, flush=True)
    print("BUBBLE AVATARS IMPORT", flush=True)
    print("=" * 60, flush=True)
    print(f"Candidates CSV: {candidates_csv}", flush=True)
    print(f"Dry run: {dry_run}", flush=True)
    print(f"Resume: {resume}", flush=True)
    print(f"Limit: {limit}", flush=True)
    print("=" * 60, flush=True)

    checkpoint = load_checkpoint() if resume else {
        "last_processed_row": 0,
        "uploaded_count": 0,
        "skipped_count": 0,
        "error_count": 0,
        "started_at": datetime.now().isoformat(),
    }

    errors = load_errors() if resume else []
    start_row = checkpoint["last_processed_row"]

    total_rows = count_csv_rows(candidates_csv)
    print(f"Total rows in CSV: {total_rows}", flush=True)
    print(f"Starting from row: {start_row}", flush=True)

    if limit:
        total_rows = min(total_rows, start_row + limit)

    supabase = get_supabase_client() if not dry_run else None
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")

    row_num = 0
    no_avatar = 0
    no_email = 0
    already_has_photo = 0

    with open(candidates_csv, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        for row in reader:
            row_num += 1

            if row_num <= start_row:
                continue

            if limit and row_num > start_row + limit:
                break

            # Get candidate email
            candidate_email = row.get("email", "").strip()
            if not candidate_email:
                no_email += 1
                checkpoint["skipped_count"] += 1
                checkpoint["last_processed_row"] = row_num
                continue

            # Get avatar URL
            avatar_url = normalize_url(row.get("Avatar", ""))
            if not avatar_url:
                no_avatar += 1
                checkpoint["skipped_count"] += 1
                checkpoint["last_processed_row"] = row_num
                continue

            if dry_run:
                print(f"[DRY RUN] Would upload avatar for {candidate_email}", flush=True)
                checkpoint["uploaded_count"] += 1
            else:
                # Look up candidate
                candidate = get_candidate_by_email(supabase, candidate_email)
                if not candidate:
                    checkpoint["skipped_count"] += 1
                    errors.append({
                        "row": row_num,
                        "email": candidate_email,
                        "error": "Candidate not found in database",
                    })
                    checkpoint["last_processed_row"] = row_num
                    continue

                candidate_id = candidate["id"]

                # Skip if candidate already has a photo_url
                if candidate.get("photo_url"):
                    already_has_photo += 1
                    checkpoint["skipped_count"] += 1
                    checkpoint["last_processed_row"] = row_num
                    continue

                # Download avatar
                content = download_file(avatar_url)
                if not content:
                    checkpoint["error_count"] += 1
                    errors.append({
                        "row": row_num,
                        "email": candidate_email,
                        "url": avatar_url,
                        "error": "Failed to download avatar",
                    })
                    checkpoint["last_processed_row"] = row_num
                    continue

                # Upload to storage
                original_filename = get_filename_from_url(avatar_url)
                safe_filename = sanitize_filename(original_filename)
                storage_path = f"{candidate_id}/{safe_filename}"
                content_type = get_content_type(original_filename)

                if not upload_to_storage(supabase, "avatars", storage_path, content, content_type):
                    checkpoint["error_count"] += 1
                    errors.append({
                        "row": row_num,
                        "email": candidate_email,
                        "error": "Failed to upload to storage",
                    })
                    checkpoint["last_processed_row"] = row_num
                    continue

                # Update candidate photo_url
                photo_url = f"{supabase_url}/storage/v1/object/public/avatars/{storage_path}"
                if not update_candidate_photo_url(supabase, candidate_id, photo_url):
                    checkpoint["error_count"] += 1
                    errors.append({
                        "row": row_num,
                        "email": candidate_email,
                        "error": "Failed to update candidate photo_url",
                    })
                    checkpoint["last_processed_row"] = row_num
                    continue

                checkpoint["uploaded_count"] += 1

            checkpoint["last_processed_row"] = row_num

            if row_num % CHECKPOINT_INTERVAL == 0:
                save_checkpoint(checkpoint)
                save_errors(errors)

                progress = (row_num / total_rows) * 100
                print(f"[{datetime.now().isoformat()}] Progress: {row_num}/{total_rows} ({progress:.1f}%) - "
                      f"Uploaded: {checkpoint['uploaded_count']}, Skipped: {checkpoint['skipped_count']}, "
                      f"Errors: {checkpoint['error_count']}", flush=True)

    checkpoint["completed_at"] = datetime.now().isoformat()
    save_checkpoint(checkpoint)
    save_errors(errors)

    print("\n" + "=" * 60, flush=True)
    print("AVATARS IMPORT COMPLETE", flush=True)
    print("=" * 60, flush=True)
    print(f"Total processed: {row_num}", flush=True)
    print(f"Uploaded: {checkpoint['uploaded_count']}", flush=True)
    print(f"Skipped: {checkpoint['skipped_count']}", flush=True)
    print(f"  - No email: {no_email}", flush=True)
    print(f"  - No avatar URL: {no_avatar}", flush=True)
    print(f"  - Already has photo: {already_has_photo}", flush=True)
    print(f"Errors: {checkpoint['error_count']}", flush=True)
    print("=" * 60, flush=True)

    if errors:
        print(f"\nErrors saved to: {ERROR_LOG_FILE}", flush=True)

    return checkpoint

# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Import avatars from Bubble CSV to Supabase Storage")
    parser.add_argument("--candidates", type=str, default=str(DEFAULT_CANDIDATES_CSV),
                        help="Path to Bubble candidates CSV")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate without importing")
    parser.add_argument("--no-resume", action="store_true",
                        help="Start fresh, ignore checkpoint")
    parser.add_argument("--limit", type=int,
                        help="Limit number of candidates to process")
    parser.add_argument("--reset", action="store_true",
                        help="Reset checkpoint and start fresh")

    args = parser.parse_args()

    if args.reset:
        if CHECKPOINT_FILE.exists():
            CHECKPOINT_FILE.unlink()
            print("Checkpoint reset", flush=True)
        if ERROR_LOG_FILE.exists():
            ERROR_LOG_FILE.unlink()
            print("Error log reset", flush=True)

    candidates_csv = Path(args.candidates)

    if not candidates_csv.exists():
        print(f"ERROR: Candidates CSV not found: {candidates_csv}")
        sys.exit(1)

    import_avatars(
        candidates_csv=candidates_csv,
        dry_run=args.dry_run,
        resume=not args.no_resume,
        limit=args.limit,
    )

if __name__ == "__main__":
    main()
