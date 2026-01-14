import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  enquiriesQuerySchema,
  type UnifiedEnquiry,
  type EnquiryType,
  type EnquiryTable,
} from '@/lib/validations/enquiries'

// ============================================================================
// TRANSFORMATION FUNCTIONS (duplicated for self-contained export)
// ============================================================================

interface SeoInquiry {
  id: string
  name: string | null
  email: string
  phone: string | null
  message: string | null
  position_needed: string | null
  location: string | null
  landing_page_id: string | null
  source_url: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string | null
}

interface SalaryGuideLead {
  id: string
  email: string
  requested_at: string
  source: string | null
  sent_at: string | null
  email_id: string | null
  created_at: string
  updated_at: string | null
}

interface EmployerEnquiry {
  id: string
  referrer_id: string | null
  company_name: string
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  status: string
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  client_id: string | null
  created_at: string
  updated_at: string | null
  referrer?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}

function determineEnquiryType(inquiry: SeoInquiry): EnquiryType {
  if (inquiry.message?.includes('Match Funnel Lead')) {
    return 'match_funnel'
  }
  if (inquiry.utm_source === 'brief_matcher') {
    return 'brief_match'
  }
  return 'contact'
}

function transformSeoInquiry(inquiry: SeoInquiry): UnifiedEnquiry {
  const type = determineEnquiryType(inquiry)

  return {
    id: inquiry.id,
    type,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    company: null,
    message: inquiry.message,
    status: inquiry.status,
    notes: inquiry.notes,
    created_at: inquiry.created_at,
    updated_at: inquiry.updated_at,
    source_url: inquiry.source_url,
    utm_source: inquiry.utm_source,
    utm_medium: inquiry.utm_medium,
    utm_campaign: inquiry.utm_campaign,
    metadata: {
      position_needed: inquiry.position_needed,
      location: inquiry.location,
      landing_page_id: inquiry.landing_page_id,
    },
    _table: 'seo_inquiries' as EnquiryTable,
  }
}

function transformSalaryGuideLead(lead: SalaryGuideLead): UnifiedEnquiry {
  return {
    id: lead.id,
    type: 'salary_guide' as EnquiryType,
    name: null,
    email: lead.email,
    phone: null,
    company: null,
    message: null,
    status: lead.sent_at ? 'sent' : 'pending',
    notes: null,
    created_at: lead.requested_at || lead.created_at,
    updated_at: lead.updated_at,
    source_url: null,
    utm_source: lead.source,
    utm_medium: null,
    utm_campaign: null,
    metadata: {
      sent_at: lead.sent_at,
      email_id: lead.email_id,
    },
    _table: 'salary_guide_leads' as EnquiryTable,
  }
}

function transformEmployerEnquiry(enquiry: EmployerEnquiry): UnifiedEnquiry {
  const referrerName = enquiry.referrer
    ? `${enquiry.referrer.first_name || ''} ${enquiry.referrer.last_name || ''}`.trim()
    : null

  return {
    id: enquiry.id,
    type: 'employer_referral' as EnquiryType,
    name: enquiry.contact_name,
    email: enquiry.contact_email || '',
    phone: enquiry.contact_phone,
    company: enquiry.company_name,
    message: enquiry.notes,
    status: enquiry.status,
    notes: enquiry.review_notes,
    created_at: enquiry.submitted_at || enquiry.created_at,
    updated_at: enquiry.updated_at,
    source_url: null,
    utm_source: 'employer_referral',
    utm_medium: null,
    utm_campaign: null,
    metadata: {
      company_name: enquiry.company_name,
      contact_name: enquiry.contact_name,
      referrer_id: enquiry.referrer_id,
      referrer_name: referrerName || null,
      reviewed_at: enquiry.reviewed_at,
      reviewed_by: enquiry.reviewed_by,
      review_notes: enquiry.review_notes,
      client_id: enquiry.client_id,
    },
    _table: 'employer_enquiries' as EnquiryTable,
  }
}

// ============================================================================
// CSV GENERATION
// ============================================================================

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function generateCSV(enquiries: UnifiedEnquiry[]): string {
  const headers = [
    'ID',
    'Type',
    'Name',
    'Email',
    'Phone',
    'Company',
    'Status',
    'Message',
    'Notes',
    'Source URL',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
    'Created At',
    'Updated At',
    'Position Needed',
    'Location',
    'Referrer Name',
  ]

  const rows = enquiries.map((e) => [
    escapeCSV(e.id),
    escapeCSV(e.type),
    escapeCSV(e.name),
    escapeCSV(e.email),
    escapeCSV(e.phone),
    escapeCSV(e.company),
    escapeCSV(e.status),
    escapeCSV(e.message),
    escapeCSV(e.notes),
    escapeCSV(e.source_url),
    escapeCSV(e.utm_source),
    escapeCSV(e.utm_medium),
    escapeCSV(e.utm_campaign),
    escapeCSV(e.created_at),
    escapeCSV(e.updated_at),
    escapeCSV(e.metadata.position_needed as string),
    escapeCSV(e.metadata.location as string),
    escapeCSV(e.metadata.referrer_name as string),
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

// ============================================================================
// GET /api/admin/enquiries/export
// ============================================================================

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const validationResult = enquiriesQuerySchema.safeParse({
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      sort_by: searchParams.get('sort_by') || undefined,
      sort_order: searchParams.get('sort_order') || undefined,
      // Override limit for export - get all records
      limit: 10000,
      offset: 0,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      )
    }

    const params = validationResult.data
    const { type, status, search, date_from, date_to, sort_order } = params

    // Determine which tables to query based on type filter
    const querySeo =
      !type || ['contact', 'brief_match', 'match_funnel'].includes(type)
    const querySalary = !type || type === 'salary_guide'
    const queryEmployer = !type || type === 'employer_referral'

    // Build queries
    const queries: Promise<{ data: unknown[]; count: number }>[] = []

    if (querySeo) {
      let query = supabase
        .from('seo_inquiries')
        .select('*')
        .order('created_at', { ascending: false })

      if (status) query = query.eq('status', status)
      if (search)
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`
        )
      if (date_from) query = query.gte('created_at', date_from)
      if (date_to) query = query.lte('created_at', date_to)

      queries.push(
        Promise.resolve(query).then(({ data, error }) => ({
          data: error ? [] : (data || []),
          count: data?.length || 0,
        }))
      )
    } else {
      queries.push(Promise.resolve({ data: [], count: 0 }))
    }

    if (querySalary) {
      let query = supabase
        .from('salary_guide_leads')
        .select('*')
        .order('requested_at', { ascending: false })

      if (status === 'pending') query = query.is('sent_at', null)
      else if (status === 'sent') query = query.not('sent_at', 'is', null)
      if (search) query = query.ilike('email', `%${search}%`)
      if (date_from) query = query.gte('requested_at', date_from)
      if (date_to) query = query.lte('requested_at', date_to)

      queries.push(
        Promise.resolve(query).then(({ data, error }) => ({
          data: error ? [] : (data || []),
          count: data?.length || 0,
        }))
      )
    } else {
      queries.push(Promise.resolve({ data: [], count: 0 }))
    }

    if (queryEmployer) {
      let query = supabase
        .from('employer_enquiries')
        .select(
          `
          *,
          referrer:candidates!employer_enquiries_referrer_id_fkey(
            id, first_name, last_name, email
          )
        `
        )
        .order('submitted_at', { ascending: false })

      if (status) query = query.eq('status', status)
      if (search)
        query = query.or(
          `company_name.ilike.%${search}%,contact_name.ilike.%${search}%,contact_email.ilike.%${search}%`
        )
      if (date_from) query = query.gte('submitted_at', date_from)
      if (date_to) query = query.lte('submitted_at', date_to)

      queries.push(
        Promise.resolve(query).then(({ data, error }) => ({
          data: error ? [] : (data || []),
          count: data?.length || 0,
        }))
      )
    } else {
      queries.push(Promise.resolve({ data: [], count: 0 }))
    }

    const [seoResults, salaryResults, employerResults] = await Promise.all(queries)

    // Transform all results
    let allEnquiries: UnifiedEnquiry[] = [
      ...(seoResults.data as SeoInquiry[]).map(transformSeoInquiry),
      ...(salaryResults.data as SalaryGuideLead[]).map(transformSalaryGuideLead),
      ...(employerResults.data as EmployerEnquiry[]).map(transformEmployerEnquiry),
    ]

    // Filter by specific type if needed
    if (type === 'contact') {
      allEnquiries = allEnquiries.filter((e) => e.type === 'contact')
    } else if (type === 'brief_match') {
      allEnquiries = allEnquiries.filter((e) => e.type === 'brief_match')
    } else if (type === 'match_funnel') {
      allEnquiries = allEnquiries.filter((e) => e.type === 'match_funnel')
    }

    // Sort by created_at
    allEnquiries.sort((a, b) => {
      const aDate = new Date(a.created_at).getTime()
      const bDate = new Date(b.created_at).getTime()
      return sort_order === 'desc' ? bDate - aDate : aDate - bDate
    })

    // Generate CSV
    const csv = generateCSV(allEnquiries)

    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `enquiries-export-${dateStr}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export enquiries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
