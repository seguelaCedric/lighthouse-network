#!/usr/bin/env python3
"""
Bubble Documents Import Script

Imports documents from Bubble CSV export into Supabase Storage,
linking them to existing candidates by email.

Run: cd apps/web && python3 scripts/bubble_import_documents.py

Features:
- Checkpoint-based resumability
- Downloads from Bubble CDN
- Uploads to Supabase Storage
- Links documents to candidates

Requirements:
    pip install supabase python-dotenv requests
"""

import os
import sys
import csv
import json
import time
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
CHECKPOINT_FILE = SCRIPT_DIR / ".bubble-docs-checkpoint.json"
ERROR_LOG_FILE = SCRIPT_DIR / ".bubble-docs-errors.json"

CHECKPOINT_INTERVAL = 50  # Save checkpoint every N documents
REQUEST_TIMEOUT = 30  # Timeout for downloading files

DEFAULT_DOCUMENTS_CSV = DATA_DIR / "bubble-documents.csv"

# Document type mapping - maps Bubble types to normalized categories
DOCUMENT_TYPE_MAP = {
    # CV/Resume
    "cv/resume": "cv",
    "cv": "cv",
    "resume": "cv",
    "cover letter": "cv",

    # ID/Passport
    "passport/id": "id",
    "passport": "id",
    "id": "id",
    "seaman's discharge book": "id",

    # Medical
    "medical certificate": "medical",
    "eng1": "medical",
    "eng 1": "medical",
    "covid19 vaccine": "medical",

    # STCW certificates
    "stcw": "stcw",
    "stcw first aid": "stcw",
    "stcw fire prevention and fire fighting": "stcw",
    "stcw pdsd": "stcw",
    "stcw security awareness": "stcw",
    "stcw pssr": "stcw",
    "stcw pst": "stcw",
    "stcw refresher": "stcw",
    "stcw refresher 2": "stcw",
    "stcw advanced fire fighting": "stcw",
    "stcw pscrb": "stcw",
    "stcw proficiency in fast rescue boats": "stcw",

    # Licenses
    "licence": "license",
    "license": "license",
    "power boat ii": "license",
    "power boat ii ce": "license",
    "pwc": "license",
    "short range": "license",
    "yachtmaster offshore": "license",
    "yacht rating": "license",
    "helm": "license",
    "driving license": "license",

    # Food/Galley
    "food safety certificate": "food_safety",
    "ships cook certificate": "food_safety",
    "sample menu": "food_safety",
    "food photos": "photo",

    # Diving
    "padi": "diving",
    "divemaster": "diving",
    "open water scuba instructor": "diving",

    # Visas
    "b1/b2": "visa",
    "b1 visa": "visa",
    "schengen visa": "visa",
    "visa": "visa",

    # References
    "written reference": "reference",

    # Photos
    "photo": "photo",
    "full length photo": "photo",
    "tattoo photo": "photo",

    # Security/Radio
    "sso": "security",
    "aec": "certificate",

    # Checks
    "coc check": "certificate",
    "cec check": "certificate",

    # Other
    "additional documents": "other",
    "other docs": "other",
    "other": "other",
    "": "other",
}

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

def sanitize_filename(filename: str) -> str:
    """Remove or replace characters that cause storage key issues"""
    import re
    import unicodedata

    # Normalize unicode (convert accented chars to ASCII equivalents where possible)
    filename = unicodedata.normalize('NFKD', filename)
    filename = filename.encode('ascii', 'ignore').decode('ascii')

    # Remove emojis and other problematic unicode
    filename = re.sub(r'[^\x00-\x7F]+', '', filename)

    # Replace apostrophes and quotes with nothing
    filename = filename.replace("'", "").replace('"', "").replace("'", "").replace("'", "")

    # Replace spaces and other problematic chars with underscores
    filename = re.sub(r'[\s]+', '_', filename)

    # Remove any remaining problematic characters (keep alphanumeric, dots, underscores, hyphens)
    filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)

    # Remove multiple consecutive underscores or dots
    filename = re.sub(r'_+', '_', filename)
    filename = re.sub(r'\.+', '.', filename)

    # Ensure it has content
    if not filename or filename in ['.', '_', '-']:
        filename = f"document_{uuid.uuid4().hex[:8]}"

    return filename

def get_filename_from_url(url: str) -> str:
    """Extract and sanitize filename from URL"""
    parsed = urlparse(url)
    path = unquote(parsed.path)
    filename = path.split("/")[-1]
    # Remove query params from filename
    if "?" in filename:
        filename = filename.split("?")[0]

    # Sanitize the filename for storage
    filename = sanitize_filename(filename)

    return filename or f"document_{uuid.uuid4().hex[:8]}"

def get_content_type(filename: str) -> str:
    """Get MIME type from filename"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or "application/octet-stream"

def normalize_document_type(doc_type: str) -> str:
    """Normalize document type string"""
    if not doc_type:
        return "other"
    return DOCUMENT_TYPE_MAP.get(doc_type.lower().strip(), "other")

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
        result = supabase.table("candidates").select("id").ilike("email", email_lower).execute()
        if result.data and len(result.data) > 0:
            _candidate_cache[email_lower] = result.data[0]
            return result.data[0]
    except Exception as e:
        print(f"  Error looking up candidate {email}: {e}", flush=True)

    _candidate_cache[email_lower] = None
    return None

# ============================================================================
# DOCUMENT UPLOAD
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
            existing = supabase.storage.from_(bucket).list(path.rsplit("/", 1)[0] if "/" in path else "")
            filename = path.rsplit("/", 1)[-1] if "/" in path else path
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

def create_document_record(supabase: Client, candidate_id: str, doc_type: str, storage_path: str, original_filename: str, file_size: int, mime_type: str) -> bool:
    """Create document record in database using existing documents table"""
    try:
        # Check if document record already exists (by entity_id + file_path)
        existing = supabase.table("documents").select("id").eq("entity_id", candidate_id).eq("file_path", storage_path).execute()
        if existing.data and len(existing.data) > 0:
            print(f"  Skipped (already exists): {original_filename}", flush=True)
            return True  # Already exists

        # Get storage URL - use file_path for authenticated access (bucket is private)
        # The file_url points to the storage path, actual access requires signed URLs or auth
        supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        file_url = f"{supabase_url}/storage/v1/object/documents/{storage_path}"

        supabase.table("documents").insert({
            "entity_type": "candidate",
            "entity_id": candidate_id,
            "organization_id": "00000000-0000-0000-0000-000000000001",  # Lighthouse Careers
            "type": doc_type,
            "name": original_filename,
            "file_url": file_url,
            "file_path": storage_path,
            "file_size": file_size,
            "mime_type": mime_type,
            "status": "approved",  # Auto-approve imported docs
            "is_processed": False,
            "is_latest_version": True,
            "version": 1,
            "metadata": {"source": "bubble_import"},
        }).execute()
        return True
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
            return True
        print(f"  DB error: {e}", flush=True)
        return False

# ============================================================================
# MAIN IMPORT LOGIC
# ============================================================================

def count_csv_rows(csv_path: Path) -> int:
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)
        return sum(1 for _ in reader)

def import_documents(
    documents_csv: Path,
    dry_run: bool = False,
    resume: bool = True,
    limit: Optional[int] = None,
):
    print("=" * 60, flush=True)
    print("BUBBLE DOCUMENTS IMPORT", flush=True)
    print("=" * 60, flush=True)
    print(f"Documents CSV: {documents_csv}", flush=True)
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

    total_rows = count_csv_rows(documents_csv)
    print(f"Total rows in CSV: {total_rows}", flush=True)
    print(f"Starting from row: {start_row}", flush=True)

    if limit:
        total_rows = min(total_rows, start_row + limit)

    supabase = get_supabase_client() if not dry_run else None

    row_num = 0
    no_candidate = 0
    no_url = 0
    expired_s3_urls = 0

    with open(documents_csv, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        for row in reader:
            row_num += 1

            if row_num <= start_row:
                continue

            if limit and row_num > start_row + limit:
                break

            # Get candidate email
            candidate_email = row.get("Candidate", "").strip()
            if not candidate_email:
                no_candidate += 1
                checkpoint["skipped_count"] += 1
                checkpoint["last_processed_row"] = row_num
                continue

            # Get document URL
            doc_url = normalize_url(row.get("Document File", ""))
            if not doc_url:
                no_url += 1
                checkpoint["skipped_count"] += 1
                checkpoint["last_processed_row"] = row_num
                continue

            # Skip expired Vincere S3 signed URLs (they all return 403)
            # Only process Bubble CDN URLs which are still valid
            if "s3.eu-central-1.amazonaws.com" in doc_url:
                expired_s3_urls += 1
                checkpoint["skipped_count"] += 1
                checkpoint["last_processed_row"] = row_num
                continue

            doc_type = normalize_document_type(row.get("Document Type", ""))
            original_filename = get_filename_from_url(doc_url)

            if dry_run:
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
                    continue

                candidate_id = candidate["id"]

                # Download file
                content = download_file(doc_url)
                if not content:
                    checkpoint["error_count"] += 1
                    errors.append({
                        "row": row_num,
                        "email": candidate_email,
                        "url": doc_url,
                        "error": "Failed to download file",
                    })
                    continue

                # Upload to storage
                storage_path = f"{candidate_id}/{doc_type}/{original_filename}"
                content_type = get_content_type(original_filename)

                if not upload_to_storage(supabase, "documents", storage_path, content, content_type):
                    checkpoint["error_count"] += 1
                    errors.append({
                        "row": row_num,
                        "email": candidate_email,
                        "error": "Failed to upload to storage",
                    })
                    continue

                # Create document record
                file_size = len(content)
                if not create_document_record(supabase, candidate_id, doc_type, storage_path, original_filename, file_size, content_type):
                    checkpoint["error_count"] += 1
                    errors.append({
                        "row": row_num,
                        "email": candidate_email,
                        "error": "Failed to create document record",
                    })
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
    print("DOCUMENTS IMPORT COMPLETE", flush=True)
    print("=" * 60, flush=True)
    print(f"Total processed: {row_num}", flush=True)
    print(f"Uploaded: {checkpoint['uploaded_count']}", flush=True)
    print(f"Skipped: {checkpoint['skipped_count']}", flush=True)
    print(f"  - No candidate email: {no_candidate}", flush=True)
    print(f"  - No document URL: {no_url}", flush=True)
    print(f"  - Expired Vincere S3 URLs: {expired_s3_urls}", flush=True)
    print(f"Errors: {checkpoint['error_count']}", flush=True)
    print("=" * 60, flush=True)

    if errors:
        print(f"\nErrors saved to: {ERROR_LOG_FILE}", flush=True)

    return checkpoint

# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Import documents from Bubble CSV to Supabase Storage")
    parser.add_argument("--documents", type=str, default=str(DEFAULT_DOCUMENTS_CSV),
                        help="Path to Bubble documents CSV")
    parser.add_argument("--dry-run", action="store_true",
                        help="Validate without importing")
    parser.add_argument("--no-resume", action="store_true",
                        help="Start fresh, ignore checkpoint")
    parser.add_argument("--limit", type=int,
                        help="Limit number of documents to process")
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

    documents_csv = Path(args.documents)

    if not documents_csv.exists():
        print(f"ERROR: Documents CSV not found: {documents_csv}")
        sys.exit(1)

    import_documents(
        documents_csv=documents_csv,
        dry_run=args.dry_run,
        resume=not args.no_resume,
        limit=args.limit,
    )

if __name__ == "__main__":
    main()
