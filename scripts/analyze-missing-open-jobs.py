#!/usr/bin/env python3
"""
Analyze which open jobs from Vincere are missing from the database.
Compares the Python script output with the database to find discrepancies.
"""

import json
import csv
import os
from datetime import datetime
from typing import Dict, List, Set
from supabase import create_client, Client

# Load environment variables
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'apps', 'web', '.env.local'))

def get_supabase_client() -> Client:
    """Create Supabase client"""
    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("Missing Supabase credentials")
    
    return create_client(url, key)

def determine_if_open(job_data: Dict) -> bool:
    """
    Determine if a job should be open based on Vincere data.
    Matches the logic in mapVincereToJob:
    - hasOpenDate && !isClosedJob && !isPastCloseDate
    """
    job = job_data.get('job', {})
    custom_fields = job_data.get('custom_fields', {})
    
    # Check open_date
    open_date = job.get('open_date')
    has_open_date = bool(open_date)
    
    # Check closed_job flag
    closed_job = job.get('closed_job', False)
    is_closed = closed_job is True
    
    # Check close_date
    close_date_str = job.get('close_date')
    is_past_close_date = False
    if close_date_str:
        try:
            close_date = datetime.fromisoformat(close_date_str.replace('Z', '+00:00'))
            is_past_close_date = close_date < datetime.now(close_date.tzinfo)
        except:
            pass
    
    # Job is open if: has open_date AND not closed AND not past close date
    is_open = has_open_date and not is_closed and not is_past_close_date
    
    return is_open

def load_vincere_jobs() -> Dict[str, Dict]:
    """Load jobs from the Python script output"""
    output_file = os.path.join(os.path.dirname(__file__), 'output', 'vincere-jobs-raw.json')
    
    if not os.path.exists(output_file):
        print(f"❌ Output file not found: {output_file}")
        print("   Run pull-vincere-jobs.py first!")
        return {}
    
    with open(output_file, 'r') as f:
        jobs = json.load(f)
    
    print(f"✓ Loaded {len(jobs)} jobs from Python script output")
    return {str(job['job']['id']): job for job in jobs}

def get_db_jobs(supabase: Client) -> Dict[str, Dict]:
    """Get all Vincere jobs from database"""
    response = supabase.table('jobs').select('external_id, status, is_public, title, published_at').eq('external_source', 'vincere').is_('deleted_at', 'null').execute()
    
    jobs = {}
    for job in response.data:
        jobs[job['external_id']] = job
    
    print(f"✓ Loaded {len(jobs)} Vincere jobs from database")
    return jobs

def analyze_missing_open_jobs():
    """Find open jobs in Vincere that aren't open in the database"""
    print("=" * 60)
    print("ANALYZING MISSING OPEN JOBS")
    print("=" * 60)
    print()
    
    # Load data
    vincere_jobs = load_vincere_jobs()
    if not vincere_jobs:
        return
    
    supabase = get_supabase_client()
    db_jobs = get_db_jobs(supabase)
    
    print()
    print("Analyzing open jobs...")
    print()
    
    # Find jobs that should be open
    should_be_open = []
    for vincere_id, job_data in vincere_jobs.items():
        if determine_if_open(job_data):
            should_be_open.append({
                'vincere_id': vincere_id,
                'title': job_data['job'].get('job_title', 'N/A'),
                'open_date': job_data['job'].get('open_date'),
                'close_date': job_data['job'].get('close_date'),
                'closed_job': job_data['job'].get('closed_job', False),
                'status': job_data['job'].get('job_status') or job_data['job'].get('status', 'N/A'),
            })
    
    print(f"✓ Found {len(should_be_open)} jobs that SHOULD be open in Vincere")
    print()
    
    # Check which ones are in the database and their status
    missing_open = []
    incorrectly_closed = []
    correctly_open = []
    not_in_db = []
    
    for job in should_be_open:
        vincere_id = job['vincere_id']
        db_job = db_jobs.get(vincere_id)
        
        if not db_job:
            not_in_db.append(job)
        elif db_job['status'] == 'open' and db_job['is_public']:
            correctly_open.append(job)
        else:
            incorrectly_closed.append({
                **job,
                'db_status': db_job['status'],
                'db_is_public': db_job['is_public'],
            })
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total jobs that should be open: {len(should_be_open)}")
    print(f"  ✓ Correctly open in DB: {len(correctly_open)}")
    print(f"  ❌ Incorrectly closed/private in DB: {len(incorrectly_closed)}")
    print(f"  ⚠️  Not in database: {len(not_in_db)}")
    print()
    
    if incorrectly_closed:
        print("=" * 60)
        print(f"❌ {len(incorrectly_closed)} JOBS INCORRECTLY MARKED AS CLOSED/PRIVATE")
        print("=" * 60)
        print()
        for job in incorrectly_closed[:20]:  # Show first 20
            print(f"  ID: {job['vincere_id']} - {job['title']}")
            print(f"    Vincere: OPEN (open_date={job['open_date']}, closed_job={job['closed_job']})")
            print(f"    Database: status={job['db_status']}, is_public={job['db_is_public']}")
            print()
        
        if len(incorrectly_closed) > 20:
            print(f"  ... and {len(incorrectly_closed) - 20} more")
            print()
    
    if not_in_db:
        print("=" * 60)
        print(f"⚠️  {len(not_in_db)} OPEN JOBS NOT IN DATABASE")
        print("=" * 60)
        print()
        for job in not_in_db[:20]:  # Show first 20
            print(f"  ID: {job['vincere_id']} - {job['title']}")
            print(f"    Open date: {job['open_date']}")
            print()
        
        if len(not_in_db) > 20:
            print(f"  ... and {len(not_in_db) - 20} more")
            print()
    
    # Save detailed report
    report_file = os.path.join(os.path.dirname(__file__), 'output', 'missing-open-jobs-report.json')
    with open(report_file, 'w') as f:
        json.dump({
            'summary': {
                'total_should_be_open': len(should_be_open),
                'correctly_open': len(correctly_open),
                'incorrectly_closed': len(incorrectly_closed),
                'not_in_db': len(not_in_db),
            },
            'incorrectly_closed': incorrectly_closed,
            'not_in_db': not_in_db,
        }, f, indent=2)
    
    print(f"✓ Detailed report saved to: {report_file}")
    print()

if __name__ == '__main__':
    analyze_missing_open_jobs()
