#!/usr/bin/env python3
"""
Pull ALL placements from Vincere with fee details

This script fetches every placement from Vincere by iterating through filled jobs.
For each filled job, it calls /position/{id}/placements, then fetches full details.

Outputs:
- vincere-placements-raw.json - Complete placement data
- vincere-placements-summary.csv - Summary with key fields
"""

import os
import json
import csv
import argparse
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
import requests
from dotenv import load_dotenv

# Load environment variables from multiple possible locations
script_dir = os.path.dirname(os.path.abspath(__file__))
env_paths = [
    os.path.join(script_dir, '..', 'apps', 'web', '.env.local'),
    os.path.join(script_dir, '.env.local'),
    os.path.join(script_dir, '..', '.env.local'),
]
for env_path in env_paths:
    if os.path.exists(env_path):
        print(f"Loading env from: {env_path}")
        load_dotenv(env_path)
        break
else:
    load_dotenv()

# Vincere API URLs
AUTH_URL = 'https://id.vincere.io/oauth2/token'
API_BASE_URL = 'https://lighthouse-careers.vincere.io/api/v2'


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

        response = requests.post(AUTH_URL, data=data, timeout=30)

        if not response.ok:
            raise Exception(f'Vincere authentication failed: {response.status_code} {response.text}')

        result = response.json()

        if 'id_token' not in result:
            raise Exception('No id_token returned from Vincere authentication')

        self.id_token = result['id_token']
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
            response = requests.request(method, url, headers=headers, json=data, timeout=30)
        else:
            response = requests.request(method, url, headers=headers, timeout=30)

        # Handle token expiration - retry once with fresh token
        if response.status_code == 401 and retry_on_auth_error:
            self.id_token = None
            self.token_expires_at = 0
            return self.request(method, endpoint, data, retry_on_auth_error=False)

        if not response.ok:
            raise Exception(f'Vincere API error: {response.status_code} {response.reason} - {response.text}')

        text = response.text
        if not text:
            return {}

        return response.json()

    def get(self, endpoint: str) -> Any:
        """GET request helper"""
        return self.request('GET', endpoint)


def fetch_all_placements(client: VincereClient, jobs_file: str, limit: Optional[int] = None, all_jobs: bool = False) -> List[Dict]:
    """Fetch all placements from jobs

    Args:
        all_jobs: If True, check ALL jobs for placements. If False, only check filled jobs (status_id=2).
    """
    print("Loading jobs from raw data...")

    if not os.path.exists(jobs_file):
        print(f"  Jobs file not found: {jobs_file}")
        return []

    with open(jobs_file, 'r') as f:
        jobs = json.load(f)

    if all_jobs:
        # Check ALL jobs for placements
        jobs_to_check = jobs
        print(f"  Checking ALL {len(jobs)} jobs for placements")
    else:
        # Filter to filled jobs (status_id=2) only
        jobs_to_check = [j for j in jobs if j.get('job', {}).get('status_id') == 2]
        print(f"  Found {len(jobs_to_check)} filled jobs out of {len(jobs)} total")

    if limit:
        jobs_to_check = jobs_to_check[:limit]
        print(f"  Limited to {len(jobs_to_check)} jobs")

    all_placements = []
    jobs_with_placements = 0
    errors = 0

    print(f"\nFetching placements for jobs...")
    for i, job_data in enumerate(jobs_to_check, 1):
        job = job_data.get('job', {})
        job_id = job.get('id')

        if not job_id:
            continue

        if i % 100 == 1 or i == len(jobs_to_check):
            print(f"  [{i}/{len(jobs_to_check)}] Processing job {job_id}... (found {len(all_placements)} placements)")

        try:
            # Get placements for this position
            placements_url = f'/position/{job_id}/placements'
            placements_list = client.get(placements_url)

            if isinstance(placements_list, list) and placements_list:
                jobs_with_placements += 1

                for placement_ref in placements_list:
                    placement_id = placement_ref.get('placement_id')
                    if not placement_id:
                        continue

                    try:
                        # Get full placement details
                        placement_details = client.get(f'/placement/{placement_id}')
                        if placement_details:
                            # Add job context
                            placement_details['_job_id'] = job_id
                            placement_details['_job_title'] = job.get('job_title')
                            placement_details['_company_id'] = job.get('company_id')
                            placement_details['_company_name'] = job.get('company_name')
                            placement_details['_contact_id'] = job.get('contact_id')
                            # IMPORTANT: Get candidate_id from placement reference, not full details
                            # The full details has application_source_id which is different
                            placement_details['_candidate_id'] = placement_ref.get('candidate_id')
                            all_placements.append(placement_details)
                    except Exception as e:
                        if '429' in str(e) or 'rate' in str(e).lower():
                            print(f"    Rate limited, waiting 2s...")
                            time.sleep(2)
                        errors += 1

        except Exception as e:
            if '429' in str(e) or 'rate' in str(e).lower():
                print(f"    Rate limited at job {job_id}, waiting 2s...")
                time.sleep(2)
            errors += 1
            continue

        # Small delay to avoid rate limiting
        if i % 10 == 0:
            time.sleep(0.1)

    print(f"\n{'='*60}")
    print(f"FETCH COMPLETE")
    print(f"{'='*60}")
    print(f"Jobs processed: {len(jobs_to_check)}")
    print(f"Jobs with placements: {jobs_with_placements}")
    print(f"Total placements found: {len(all_placements)}")
    print(f"Errors: {errors}")

    return all_placements


def save_results(placements: List[Dict], output_dir: str = 'output'):
    """Save results to files"""
    os.makedirs(output_dir, exist_ok=True)

    # 1. Save raw JSON
    raw_file = os.path.join(output_dir, 'vincere-placements-raw.json')
    with open(raw_file, 'w', encoding='utf-8') as f:
        json.dump(placements, f, indent=2, ensure_ascii=False, default=str)
    print(f"\nSaved raw data to {raw_file}")

    if not placements:
        print("No placements to summarize")
        return

    # 2. Create summary CSV
    csv_file = os.path.join(output_dir, 'vincere-placements-summary.csv')

    summary_rows = []
    total_fees = 0
    total_salary = 0

    for p in placements:
        if not p:
            continue

        fee = p.get('profit') or 0
        salary = p.get('annual_salary') or 0

        if fee:
            total_fees += float(fee)
        if salary:
            total_salary += float(salary)

        row = {
            'placement_id': str(p.get('id', '')),
            'job_id': str(p.get('position_id') or p.get('_job_id', '')),
            'job_title': p.get('_job_title', ''),
            'company_id': str(p.get('_company_id', '')),
            'company_name': p.get('_company_name', ''),
            'candidate_id': str(p.get('application_source_id', '')),  # This is actually candidate_id
            'application_id': str(p.get('application_id', '')),
            'status': 'placed' if p.get('placement_status') == 1 else 'other',
            'start_date': p.get('start_date', ''),
            'end_date': p.get('end_date', ''),
            'currency': p.get('currency', 'eur'),
            'annual_salary': salary,
            'monthly_salary': p.get('salary_rate_per_month', ''),
            'fee_profit': fee,
            'job_type': p.get('job_type', ''),
            'employment_type': p.get('employment_type', ''),
            'placed_by': str(p.get('placed_by', '')),
            'created_at': p.get('insert_timestamp', ''),
        }
        summary_rows.append(row)

    # Write CSV
    if summary_rows:
        fieldnames = list(summary_rows[0].keys())
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(summary_rows)
        print(f"Saved summary CSV to {csv_file}")

    print(f"\nTotal annual salary across all placements: EUR {total_salary:,.2f}")
    print(f"Total fees/profit across all placements: EUR {total_fees:,.2f}")

    return summary_rows


def print_summary(placements: List[Dict]):
    """Print summary statistics"""
    print("\n" + "="*60)
    print("PLACEMENT SUMMARY")
    print("="*60)

    if not placements:
        print("No placements found")
        return

    total_fee = 0
    total_salary = 0
    fee_count = 0
    company_stats = {}
    year_stats = {}

    for p in placements:
        # Sum fees
        fee = p.get('profit') or 0
        salary = p.get('annual_salary') or 0

        if fee:
            total_fee += float(fee)
            fee_count += 1
        if salary:
            total_salary += float(salary)

        # By company
        company_id = p.get('_company_id', 'Unknown')
        company_name = p.get('_company_name', 'Unknown')
        key = f"{company_id}"
        if key not in company_stats:
            company_stats[key] = {'name': company_name, 'count': 0, 'total_salary': 0, 'total_fee': 0}
        company_stats[key]['count'] += 1
        company_stats[key]['total_salary'] += float(salary) if salary else 0
        company_stats[key]['total_fee'] += float(fee) if fee else 0

        # By year
        start_date = p.get('start_date') or p.get('insert_timestamp')
        if start_date:
            try:
                year = start_date[:4]
                if year not in year_stats:
                    year_stats[year] = {'count': 0, 'total_salary': 0, 'total_fee': 0}
                year_stats[year]['count'] += 1
                year_stats[year]['total_salary'] += float(salary) if salary else 0
                year_stats[year]['total_fee'] += float(fee) if fee else 0
            except:
                pass

    print(f"\nTotal placements: {len(placements)}")
    print(f"Placements with fees: {fee_count}")
    print(f"Total annual salaries: EUR {total_salary:,.2f}")
    print(f"Total fees/profit: EUR {total_fee:,.2f}")
    if len(placements) > 0:
        print(f"Average salary: EUR {total_salary / len(placements):,.2f}")

    print(f"\nTop 15 companies by placements:")
    top_companies = sorted(company_stats.items(), key=lambda x: x[1]['count'], reverse=True)[:15]
    for company_id, data in top_companies:
        print(f"  {data['name'] or company_id}: {data['count']} placements, EUR {data['total_salary']:,.0f} salary")

    print(f"\nPlacements by year:")
    for year in sorted(year_stats.keys(), reverse=True):
        data = year_stats[year]
        print(f"  {year}: {data['count']} placements, EUR {data['total_salary']:,.0f} total salary")

    print("\n" + "="*60)


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description='Pull all placements from Vincere with fee details')
    parser.add_argument('--output-dir', default='output', help='Output directory for results')
    parser.add_argument('--jobs-file', default='output/vincere-jobs-raw.json', help='Path to raw jobs JSON file')
    parser.add_argument('--limit', type=int, help='Limit number of jobs to process')
    parser.add_argument('--all-jobs', action='store_true', help='Check ALL jobs for placements, not just filled ones')
    args = parser.parse_args()

    print("="*60)
    print("Vincere Placement Pull Script")
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

    # Fetch all placements
    all_placements = fetch_all_placements(client, args.jobs_file, args.limit, all_jobs=args.all_jobs)

    if not all_placements:
        print("No placements found.")
        return

    # Save results
    save_results(all_placements, args.output_dir)

    # Print summary
    print_summary(all_placements)

    print("\nDone!")


if __name__ == '__main__':
    main()
