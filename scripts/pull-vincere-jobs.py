#!/usr/bin/env python3
"""
Pull ALL jobs from Vincere with ALL custom fields

This script fetches every job from Vincere with NO filters:
- All statuses (OPEN, CLOSED, FILLED, DRAFT, etc.)
- All visibility levels (public, private, network)
- All industries
- All time periods

Outputs:
- vincere-jobs-raw.json - Complete job data with all custom fields
- vincere-jobs-summary.csv - Summary with key fields
- custom-fields-analysis.json - Analysis of all custom fields found
"""

import os
import json
import csv
import argparse
import urllib.parse
from typing import Dict, List, Optional, Any
from datetime import datetime
import requests
from dotenv import load_dotenv

# Load environment variables from multiple possible locations
# Try current directory, parent directory, and apps/web directory
env_paths = [
    '.env.local',
    '../.env.local',
    '../../.env.local',
    '../apps/web/.env.local',
]
for env_path in env_paths:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        break
else:
    # Fallback to default dotenv behavior
    load_dotenv()

# Vincere API URLs
AUTH_URL = 'https://id.vincere.io/oauth2/token'
API_BASE_URL = 'https://lighthouse-careers.vincere.io/api/v2'

# Known custom field keys (from apps/web/lib/vincere/constants.ts)
KNOWN_JOB_FIELD_KEYS = {
    'f8b2c1ddc995fb699973598e449193c3': 'Yacht',
    '3c580f529de2e205114090aa08e10f7a': 'Requirements',
    '9a214be2a25d61d1add26dca93aef45a': 'Start Date',
    'b8a75c8b68fb5c85fb083aac4bbbed94': 'Itinerary',
    '035ca080627c6bac4e59e6fc6750a5b6': 'Salary',
    '24a44070b5d77ce92fb018745ddbe374': 'Program',
    'ecac1d20eb2b26a248837610935d9b92': 'Holiday Package',
    'c980a4f92992081ead936fb8a358fb79': 'Contract Type',
}


class VincereClient:
    """Vincere API client with authentication"""
    
    def __init__(self, client_id: Optional[str] = None, api_key: Optional[str] = None, refresh_token: Optional[str] = None):
        self.client_id = client_id or os.getenv('VINCERE_CLIENT_ID')
        self.api_key = api_key or os.getenv('VINCERE_API_KEY')
        self.refresh_token = refresh_token or os.getenv('VINCERE_REFRESH_TOKEN')
        
        if not self.client_id or not self.api_key or not self.refresh_token:
            raise ValueError(
                'Missing required Vincere configuration. '
                'Ensure VINCERE_CLIENT_ID, VINCERE_API_KEY, and VINCERE_REFRESH_TOKEN are set.'
            )
        
        self.id_token: Optional[str] = None
        self.token_expires_at: int = 0
    
    def authenticate(self) -> str:
        """Authenticate with Vincere using OAuth2 refresh token flow"""
        data = {
            'client_id': self.client_id,
            'grant_type': 'refresh_token',
            'refresh_token': self.refresh_token,
        }
        
        response = requests.post(AUTH_URL, data=data)
        
        if not response.ok:
            raise Exception(f'Vincere authentication failed: {response.status_code} {response.text}')
        
        result = response.json()
        
        if 'id_token' not in result:
            raise Exception('No id_token returned from Vincere authentication')
        
        self.id_token = result['id_token']
        # Token expires in 1 hour, but refresh 5 minutes early
        expires_in = result.get('expires_in', 3600)
        self.token_expires_at = int(datetime.now().timestamp() * 1000) + ((expires_in - 300) * 1000)
        
        return self.id_token
    
    def _get_token(self) -> str:
        """Get a valid token, refreshing if necessary"""
        current_time = int(datetime.now().timestamp() * 1000)
        if not self.id_token or current_time >= self.token_expires_at:
            self.authenticate()
        return self.id_token
    
    def request(self, method: str, endpoint: str, data: Optional[Dict] = None, retry_on_auth_error: bool = True) -> Any:
        """Make an authenticated request to the Vincere API"""
        token = self._get_token()
        
        url = endpoint if endpoint.startswith('http') else f'{API_BASE_URL}{endpoint}'
        
        headers = {
            'accept': 'application/json',
            'id-token': token,
            'x-api-key': self.api_key,
        }
        
        if data and method in ('POST', 'PUT', 'PATCH'):
            headers['Content-Type'] = 'application/json'
            response = requests.request(method, url, headers=headers, json=data)
        else:
            response = requests.request(method, url, headers=headers)
        
        # Handle token expiration - retry once with fresh token
        if response.status_code == 401 and retry_on_auth_error:
            self.id_token = None
            self.token_expires_at = 0
            return self.request(method, endpoint, data, retry_on_auth_error=False)
        
        if not response.ok:
            raise Exception(f'Vincere API error: {response.status_code} {response.reason} - {response.text}')
        
        # Handle empty responses
        text = response.text
        if not text:
            return {}
        
        return response.json()
    
    def get(self, endpoint: str) -> Any:
        """GET request helper"""
        return self.request('GET', endpoint)
    
    def post(self, endpoint: str, data: Optional[Dict] = None) -> Any:
        """POST request helper"""
        return self.request('POST', endpoint, data)


def fetch_all_jobs(client: VincereClient) -> List[Dict]:
    """Fetch ALL jobs from Vincere with NO filters"""
    print("Fetching all jobs from Vincere (no filters)...")
    
    all_jobs = []
    start = 0
    page_size = 25  # Vincere's default/max page size
    total = None
    
    # Vincere search requires a query - try different approaches
    # Based on TypeScript code, we can use industry_id filters, but we want ALL jobs
    # Let's try a query that matches all jobs by using a very broad range
    query_attempts = [
        ("id:[1 TO *]", "Broad ID range query"),
        ("*:*", "Match all query"),
        ("job_title:*", "Any job title"),
    ]
    
    query = None
    query_description = None
    
    for query_str, desc in query_attempts:
        try:
            print(f"  Trying query: {desc} ({query_str})...")
            encoded_query = urllib.parse.quote(query_str)
            search_url = (
                f'/position/search'
                f'/fl=id,job_title,company_name,created_date,last_update,job_status'
                f'?q={encoded_query}'
                f'&start=0'
                f'&limit={page_size}'
            )
            
            print(f"  URL: {search_url}")
            result = client.get(search_url)
            
            if result and 'result' in result:
                items = result['result'].get('items', [])
                total = result['result'].get('total', 0)
                print(f"  ✓ Success! Found {total} total jobs, got {len(items)} in first page")
                query = query_str
                query_description = desc
                break
            else:
                print(f"  ✗ Unexpected response format")
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            continue
    
    if not query:
        print("  ERROR: Could not find a working query. Trying without query parameter...")
        try:
            search_url = (
                f'/position/search'
                f'/fl=id,job_title,company_name,created_date,last_update,job_status'
                f'?start=0&limit={page_size}'
            )
            result = client.get(search_url)
            if result and 'result' in result:
                query = ""  # Empty string to indicate no query needed
                print("  ✓ Success without query parameter!")
        except Exception as e:
            print(f"  ✗ Also failed: {e}")
            print("  ERROR: Cannot fetch jobs - all query attempts failed")
            return []
    
    # Now paginate through all results
    print(f"\n  Using query: {query_description or 'no query'}")
    print(f"  Paginating through all results...\n")
    
    while True:
        try:
            if query:
                encoded_query = urllib.parse.quote(query)
                search_url = (
                    f'/position/search'
                    f'/fl=id,job_title,company_name,created_date,last_update,job_status'
                    f'?q={encoded_query}'
                    f'&start={start}'
                    f'&limit={page_size}'
                )
            else:
                search_url = (
                    f'/position/search'
                    f'/fl=id,job_title,company_name,created_date,last_update,job_status'
                    f'?start={start}&limit={page_size}'
                )
            
            result = client.get(search_url)
            
            if not result or 'result' not in result:
                print(f"  Unexpected response format at start={start}: {result}")
                break
            
            items = result['result'].get('items', [])
            current_total = result['result'].get('total', 0)
            if total is None:
                total = current_total
            
            if not items:
                print(f"  No more items at start={start}")
                break
            
            all_jobs.extend(items)
            print(f"  Page {start // page_size + 1}: {len(items)} jobs (total: {len(all_jobs)}/{total})")
            
            start += page_size
            
            # Stop if we've fetched all available
            if len(all_jobs) >= total or len(items) < page_size:
                break
                
        except Exception as e:
            print(f"  Error fetching jobs at start={start}: {e}")
            import traceback
            traceback.print_exc()
            break
    
    print(f"\n✓ Total jobs found: {len(all_jobs)}")
    return all_jobs


def fetch_job_with_custom_fields(client: VincereClient, job_id: int) -> Dict:
    """Fetch full job details + all custom fields"""
    try:
        # Fetch full job details
        job = client.get(f'/position/{job_id}')
        
        # Fetch all custom fields
        custom_fields = []
        try:
            custom_fields_response = client.get(f'/position/{job_id}/customfields')
            if isinstance(custom_fields_response, list):
                custom_fields = custom_fields_response
            elif isinstance(custom_fields_response, dict) and 'data' in custom_fields_response:
                custom_fields = custom_fields_response['data']
        except Exception as e:
            # Some jobs might not have custom fields
            print(f"  Warning: Could not fetch custom fields for job {job_id}: {e}")
        
        # Index custom fields by key for easy lookup
        custom_fields_dict = {}
        for field in custom_fields:
            if 'key' in field:
                custom_fields_dict[field['key']] = field
        
        return {
            'job': job,
            'custom_fields': custom_fields_dict,
            'custom_fields_list': custom_fields,
        }
    except Exception as e:
        print(f"Error fetching job {job_id}: {e}")
        return None


def compare_with_database(vincere_jobs: List[Dict], supabase_url: Optional[str] = None, supabase_key: Optional[str] = None) -> Dict:
    """Compare Vincere jobs with database"""
    if not supabase_url or not supabase_key:
        print("\nSkipping database comparison (Supabase credentials not provided)")
        return {
            'in_database': {},
            'missing_from_db': [],
            'extra_in_db': [],
        }
    
    try:
        from supabase import create_client, Client
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Fetch all jobs from database with external_source='vincere'
        response = supabase.table('jobs').select('external_id').eq('external_source', 'vincere').execute()
        
        db_job_ids = {job['external_id'] for job in response.data if job.get('external_id')}
        vincere_job_ids = {str(job['id']) for job in vincere_jobs}
        
        in_database = {job_id: job_id in db_job_ids for job_id in vincere_job_ids}
        missing_from_db = [job_id for job_id in vincere_job_ids if job_id not in db_job_ids]
        extra_in_db = [job_id for job_id in db_job_ids if job_id not in vincere_job_ids]
        
        return {
            'in_database': in_database,
            'missing_from_db': missing_from_db,
            'extra_in_db': extra_in_db,
        }
    except ImportError:
        print("\nSkipping database comparison (supabase package not installed)")
        return {
            'in_database': {},
            'missing_from_db': [],
            'extra_in_db': [],
        }
    except Exception as e:
        print(f"\nError comparing with database: {e}")
        return {
            'in_database': {},
            'missing_from_db': [],
            'extra_in_db': [],
        }


def save_results(jobs: List[Dict], output_dir: str = 'output'):
    """Save results to files"""
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Save raw JSON
    raw_file = os.path.join(output_dir, 'vincere-jobs-raw.json')
    with open(raw_file, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False, default=str)
    print(f"\nSaved raw data to {raw_file}")
    
    # 2. Create summary CSV
    csv_file = os.path.join(output_dir, 'vincere-jobs-summary.csv')
    
    if not jobs:
        print("No jobs to save")
        return
    
    # Extract summary fields
    summary_rows = []
    all_custom_field_keys = set()
    
    for job_data in jobs:
        if not job_data:
            continue
        
        job = job_data.get('job', {})
        custom_fields = job_data.get('custom_fields', {})
        
        # Collect all custom field keys
        all_custom_field_keys.update(custom_fields.keys())
        
        # Determine visibility status
        closed_job = job.get('closed_job', False)
        has_open_date = bool(job.get('open_date'))
        close_date = job.get('close_date')
        is_past_close_date = False
        if close_date:
            try:
                close_dt = datetime.fromisoformat(close_date.replace('Z', '+00:00'))
                is_past_close_date = close_dt < datetime.now(close_dt.tzinfo)
            except:
                pass
        
        is_open = has_open_date and not closed_job and not is_past_close_date
        visibility_status = 'public' if is_open else ('private' if closed_job else 'draft')
        
        # Count mapped fields
        mapped_fields_count = sum(1 for key in custom_fields.keys() if key in KNOWN_JOB_FIELD_KEYS)
        
        row = {
            'vincere_id': str(job.get('id', '')),
            'title': job.get('job_title', ''),
            'company_name': job.get('company_name', ''),
            'status': job.get('status', ''),
            'job_status': job.get('job_status', ''),
            'open_date': job.get('open_date', ''),
            'close_date': job.get('close_date', ''),
            'closed_job': 'Yes' if closed_job else 'No',
            'private_job': 'Yes' if job.get('private_job') else 'No',
            'industry_id': str(job.get('industry_id', '')),
            'custom_field_count': len(custom_fields),
            'mapped_fields_count': mapped_fields_count,
            'visibility_status': visibility_status,
            'created_date': job.get('created_date', ''),
            'last_update': job.get('last_update', ''),
        }
        
        # Add custom field values as columns (for known fields)
        for key, name in KNOWN_JOB_FIELD_KEYS.items():
            field = custom_fields.get(key, {})
            if field.get('field_value'):
                row[f'cf_{name}'] = field['field_value']
            elif field.get('date_value'):
                row[f'cf_{name}'] = field['date_value']
            elif field.get('field_values'):
                row[f'cf_{name}'] = ', '.join(str(v) for v in field['field_values'])
            else:
                row[f'cf_{name}'] = ''
        
        summary_rows.append(row)
    
    # Write CSV
    if summary_rows:
        fieldnames = list(summary_rows[0].keys())
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(summary_rows)
        print(f"Saved summary CSV to {csv_file}")
    
    # 3. Create custom fields analysis
    analysis_file = os.path.join(output_dir, 'custom-fields-analysis.json')
    
    # Count occurrences of each custom field
    field_occurrences = {}
    for job_data in jobs:
        if not job_data:
            continue
        custom_fields = job_data.get('custom_fields', {})
        for key, field in custom_fields.items():
            if key not in field_occurrences:
                field_occurrences[key] = {
                    'key': key,
                    'name': field.get('name', 'Unknown'),
                    'type': field.get('type', 'Unknown'),
                    'occurrences': 0,
                    'is_mapped': key in KNOWN_JOB_FIELD_KEYS,
                    'mapped_name': KNOWN_JOB_FIELD_KEYS.get(key, ''),
                }
            field_occurrences[key]['occurrences'] += 1
    
    analysis = {
        'total_jobs_analyzed': len([j for j in jobs if j]),
        'total_unique_custom_fields': len(field_occurrences),
        'mapped_fields': len([f for f in field_occurrences.values() if f['is_mapped']]),
        'unmapped_fields': len([f for f in field_occurrences.values() if not f['is_mapped']]),
        'fields': sorted(field_occurrences.values(), key=lambda x: x['occurrences'], reverse=True),
    }
    
    with open(analysis_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    print(f"Saved custom fields analysis to {analysis_file}")
    
    return analysis


def print_summary(jobs: List[Dict], db_comparison: Dict, analysis: Dict):
    """Print summary statistics"""
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    print(f"\nTotal jobs found in Vincere: {len([j for j in jobs if j])}")
    
    # Jobs by status
    status_counts = {}
    visibility_counts = {'public': 0, 'private': 0, 'draft': 0}
    closed_count = 0
    private_count = 0
    
    for job_data in jobs:
        if not job_data:
            continue
        job = job_data.get('job', {})
        status = job.get('job_status') or job.get('status', 'UNKNOWN')
        status_counts[status] = status_counts.get(status, 0) + 1
        
        closed_job = job.get('closed_job', False)
        if closed_job:
            closed_count += 1
        
        if job.get('private_job'):
            private_count += 1
        
        # Determine visibility
        has_open_date = bool(job.get('open_date'))
        if closed_job:
            visibility_counts['private'] += 1
        elif has_open_date:
            visibility_counts['public'] += 1
        else:
            visibility_counts['draft'] += 1
    
    print(f"\nJobs by status:")
    for status, count in sorted(status_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {status}: {count}")
    
    print(f"\nJobs by visibility:")
    for vis, count in visibility_counts.items():
        print(f"  {vis}: {count}")
    
    print(f"\nClosed jobs: {closed_count}")
    print(f"Private jobs: {private_count}")
    
    # Custom fields
    print(f"\nCustom fields:")
    print(f"  Total unique fields: {analysis.get('total_unique_custom_fields', 0)}")
    print(f"  Mapped fields: {analysis.get('mapped_fields', 0)}")
    print(f"  Unmapped fields: {analysis.get('unmapped_fields', 0)}")
    
    # Database comparison
    if db_comparison.get('in_database'):
        in_db = sum(1 for v in db_comparison['in_database'].values() if v)
        missing = len(db_comparison.get('missing_from_db', []))
        extra = len(db_comparison.get('extra_in_db', []))
        
        print(f"\nDatabase comparison:")
        print(f"  Jobs in database: {in_db}")
        print(f"  Jobs missing from database: {missing}")
        print(f"  Jobs in database but not in Vincere: {extra}")
    
    print("\n" + "="*60)


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='Pull all jobs from Vincere with all custom fields')
    parser.add_argument('--compare-db', action='store_true', help='Compare with Supabase database')
    parser.add_argument('--output-dir', default='output', help='Output directory for results')
    args = parser.parse_args()
    
    print("="*60)
    print("Vincere Job Pull Script")
    print("="*60)
    
    # Initialize client
    try:
        client = VincereClient()
        print("\nAuthenticating with Vincere...")
        client.authenticate()
        print("Authenticated successfully!\n")
    except Exception as e:
        print(f"Error initializing Vincere client: {e}")
        return
    
    # Fetch all jobs (search results)
    search_results = fetch_all_jobs(client)
    
    if not search_results:
        print("No jobs found")
        return
    
    # Fetch full details and custom fields for each job
    print(f"\nFetching full details and custom fields for {len(search_results)} jobs...")
    all_jobs_data = []
    
    for i, job_item in enumerate(search_results, 1):
        job_id = job_item.get('id')
        if not job_id:
            continue
        
        # Print progress every 10 jobs or on first/last
        if i % 10 == 1 or i == len(search_results):
            print(f"  [{i}/{len(search_results)}] Fetching job {job_id}...")
        
        job_data = fetch_job_with_custom_fields(client, job_id)
        if job_data:
            all_jobs_data.append(job_data)
        else:
            print(f"  ⚠ Failed to fetch job {job_id}")
    
    print(f"\n✓ Fetched {len(all_jobs_data)}/{len(search_results)} jobs with full details")
    
    # Compare with database if requested
    db_comparison = {}
    if args.compare_db:
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        db_comparison = compare_with_database(search_results, supabase_url, supabase_key)
        
        # Add in_database flag to job data
        for job_data in all_jobs_data:
            if job_data and 'job' in job_data:
                job_id = str(job_data['job'].get('id', ''))
                if job_id in db_comparison.get('in_database', {}):
                    job_data['in_database'] = db_comparison['in_database'][job_id]
    
    # Save results
    analysis = save_results(all_jobs_data, args.output_dir)
    
    # Print summary
    print_summary(all_jobs_data, db_comparison, analysis)
    
    print("\nDone!")


if __name__ == '__main__':
    main()

