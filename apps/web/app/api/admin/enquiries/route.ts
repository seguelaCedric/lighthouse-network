import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createErrorLogger, extractRequestContext } from '@/lib/error-logger'
import {
  enquiriesQuerySchema,
  type UnifiedEnquiry,
  type EnquiryStats,
  type EnquiryType,
  type EnquiryTable,
} from '@/lib/validations/enquiries'

// ============================================================================
// TRANSFORMATION FUNCTIONS
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
  // Check for match_funnel based on message content
  if (inquiry.message?.includes('Match Funnel Lead')) {
    return 'match_funnel'
  }
  // Check for brief_match based on utm_source
  if (inquiry.utm_source === 'brief_matcher') {
    return 'brief_match'
  }
  // Default to contact
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
// QUERY HELPERS
// ============================================================================

async function querySeoInquiries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    type?: string
    status?: string
    search?: string
    date_from?: string
    date_to?: string
  }
): Promise<{ data: SeoInquiry[]; count: number }> {
  let query = supabase
    .from('seo_inquiries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Apply status filter
  if (params.status) {
    query = query.eq('status', params.status)
  }

  // Apply search
  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,email.ilike.%${params.search}%,message.ilike.%${params.search}%`
    )
  }

  // Apply date range
  if (params.date_from) {
    query = query.gte('created_at', params.date_from)
  }
  if (params.date_to) {
    query = query.lte('created_at', params.date_to)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching seo_inquiries:', error)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

async function querySalaryGuideLeads(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    status?: string
    search?: string
    date_from?: string
    date_to?: string
  }
): Promise<{ data: SalaryGuideLead[]; count: number }> {
  let query = supabase
    .from('salary_guide_leads')
    .select('*', { count: 'exact' })
    .order('requested_at', { ascending: false })

  // Apply status filter (derived from sent_at)
  if (params.status === 'pending') {
    query = query.is('sent_at', null)
  } else if (params.status === 'sent') {
    query = query.not('sent_at', 'is', null)
  }

  // Apply search (email only)
  if (params.search) {
    query = query.ilike('email', `%${params.search}%`)
  }

  // Apply date range
  if (params.date_from) {
    query = query.gte('requested_at', params.date_from)
  }
  if (params.date_to) {
    query = query.lte('requested_at', params.date_to)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching salary_guide_leads:', error)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

async function queryEmployerEnquiries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    status?: string
    search?: string
    date_from?: string
    date_to?: string
  }
): Promise<{ data: EmployerEnquiry[]; count: number }> {
  let query = supabase
    .from('employer_enquiries')
    .select(
      `
      *,
      referrer:candidates!employer_enquiries_referrer_id_fkey(
        id, first_name, last_name, email
      )
    `,
      { count: 'exact' }
    )
    .order('submitted_at', { ascending: false })

  // Apply status filter
  if (params.status) {
    query = query.eq('status', params.status)
  }

  // Apply search
  if (params.search) {
    query = query.or(
      `company_name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%,contact_email.ilike.%${params.search}%`
    )
  }

  // Apply date range
  if (params.date_from) {
    query = query.gte('submitted_at', params.date_from)
  }
  if (params.date_to) {
    query = query.lte('submitted_at', params.date_to)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching employer_enquiries:', error)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

// ============================================================================
// STATS CALCULATION
// ============================================================================

async function calculateStats(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<EnquiryStats> {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const oneWeekAgoStr = oneWeekAgo.toISOString()

  // Get seo_inquiries counts
  const [
    seoTotalResult,
    seoNewResult,
    seoWeekResult,
    salaryTotalResult,
    salaryPendingResult,
    salaryWeekResult,
    employerTotalResult,
    employerSubmittedResult,
    employerWeekResult,
  ] = await Promise.all([
    // seo_inquiries total
    supabase
      .from('seo_inquiries')
      .select('id', { count: 'exact', head: true }),
    // seo_inquiries new status
    supabase
      .from('seo_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
    // seo_inquiries this week
    supabase
      .from('seo_inquiries')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgoStr),

    // salary_guide_leads total
    supabase
      .from('salary_guide_leads')
      .select('id', { count: 'exact', head: true }),
    // salary_guide_leads pending
    supabase
      .from('salary_guide_leads')
      .select('id', { count: 'exact', head: true })
      .is('sent_at', null),
    // salary_guide_leads this week
    supabase
      .from('salary_guide_leads')
      .select('id', { count: 'exact', head: true })
      .gte('requested_at', oneWeekAgoStr),

    // employer_enquiries total
    supabase
      .from('employer_enquiries')
      .select('id', { count: 'exact', head: true }),
    // employer_enquiries submitted
    supabase
      .from('employer_enquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    // employer_enquiries this week
    supabase
      .from('employer_enquiries')
      .select('id', { count: 'exact', head: true })
      .gte('submitted_at', oneWeekAgoStr),
  ])

  // Get type breakdown for seo_inquiries
  const { data: seoData } = await supabase
    .from('seo_inquiries')
    .select('utm_source, message')

  let contactCount = 0
  let briefMatchCount = 0
  let matchFunnelCount = 0

  if (seoData) {
    for (const item of seoData) {
      if (item.message?.includes('Match Funnel Lead')) {
        matchFunnelCount++
      } else if (item.utm_source === 'brief_matcher') {
        briefMatchCount++
      } else {
        contactCount++
      }
    }
  }

  const total =
    (seoTotalResult.count || 0) +
    (salaryTotalResult.count || 0) +
    (employerTotalResult.count || 0)

  const newCount =
    (seoNewResult.count || 0) +
    (salaryPendingResult.count || 0) +
    (employerSubmittedResult.count || 0)

  const thisWeek =
    (seoWeekResult.count || 0) +
    (salaryWeekResult.count || 0) +
    (employerWeekResult.count || 0)

  return {
    total,
    new_count: newCount,
    this_week: thisWeek,
    by_type: {
      contact: contactCount,
      brief_match: briefMatchCount,
      match_funnel: matchFunnelCount,
      salary_guide: salaryTotalResult.count || 0,
      employer_referral: employerTotalResult.count || 0,
    },
    by_status: {
      new: seoNewResult.count || 0,
      pending: salaryPendingResult.count || 0,
      submitted: employerSubmittedResult.count || 0,
    },
  }
}

// ============================================================================
// GET /api/admin/enquiries
// ============================================================================

export async function GET(request: Request) {
  const requestContext = extractRequestContext(request)
  const logger = createErrorLogger(requestContext)

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
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
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
    const { type, status, search, date_from, date_to, sort_order, limit, offset } =
      params

    // Determine which tables to query based on type filter
    const querySeo =
      !type || ['contact', 'brief_match', 'match_funnel'].includes(type)
    const querySalary = !type || type === 'salary_guide'
    const queryEmployer = !type || type === 'employer_referral'

    // Run queries in parallel
    const [seoResults, salaryResults, employerResults] = await Promise.all([
      querySeo
        ? querySeoInquiries(supabase, { status, search, date_from, date_to })
        : { data: [], count: 0 },
      querySalary
        ? querySalaryGuideLeads(supabase, { status, search, date_from, date_to })
        : { data: [], count: 0 },
      queryEmployer
        ? queryEmployerEnquiries(supabase, { status, search, date_from, date_to })
        : { data: [], count: 0 },
    ])

    // Transform all results
    let allEnquiries: UnifiedEnquiry[] = [
      ...seoResults.data.map(transformSeoInquiry),
      ...salaryResults.data.map(transformSalaryGuideLead),
      ...employerResults.data.map(transformEmployerEnquiry),
    ]

    // Filter by specific type if needed (for seo_inquiries subtypes)
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

    // Calculate total
    const total = allEnquiries.length

    // Apply pagination
    const paginated = allEnquiries.slice(offset, offset + limit)

    // Calculate stats
    const stats = await calculateStats(supabase)

    return NextResponse.json({
      enquiries: paginated,
      total,
      stats,
      limit,
      offset,
    })
  } catch (error) {
    // Log the error to the database
    await logger.error(error instanceof Error ? error : new Error(String(error)), {
      statusCode: 500,
      metadata: { route: 'admin/enquiries' }
    })
    console.error('Admin enquiries API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
