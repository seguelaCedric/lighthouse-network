import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  updateEnquirySchema,
  deleteEnquirySchema,
  type UnifiedEnquiry,
  type EnquiryType,
  type EnquiryTable,
} from '@/lib/validations/enquiries'

// ============================================================================
// AUTH HELPER
// ============================================================================

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id, organization_id, role')
    .eq('auth_id', user.id)
    .single()

  if (!userData || !['owner', 'admin'].includes(userData.role)) {
    return { error: 'Admin access required', status: 403 }
  }

  return { userData }
}

// ============================================================================
// TRANSFORMATION HELPERS
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
// GET /api/admin/enquiries/[id]
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const authResult = await requireAdmin(supabase)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Try to find in each table
    // First try seo_inquiries
    const { data: seoData } = await supabase
      .from('seo_inquiries')
      .select('*')
      .eq('id', id)
      .single()

    if (seoData) {
      return NextResponse.json({
        enquiry: transformSeoInquiry(seoData as SeoInquiry),
      })
    }

    // Try salary_guide_leads
    const { data: salaryData } = await supabase
      .from('salary_guide_leads')
      .select('*')
      .eq('id', id)
      .single()

    if (salaryData) {
      return NextResponse.json({
        enquiry: transformSalaryGuideLead(salaryData as SalaryGuideLead),
      })
    }

    // Try employer_enquiries
    const { data: employerData } = await supabase
      .from('employer_enquiries')
      .select(
        `
        *,
        referrer:candidates!employer_enquiries_referrer_id_fkey(
          id, first_name, last_name, email
        )
      `
      )
      .eq('id', id)
      .single()

    if (employerData) {
      return NextResponse.json({
        enquiry: transformEmployerEnquiry(employerData as EmployerEnquiry),
      })
    }

    return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
  } catch (error) {
    console.error('Get enquiry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/admin/enquiries/[id]
// ============================================================================

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const authResult = await requireAdmin(supabase)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await request.json()
    const validationResult = updateEnquirySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { _table, status, notes, review_notes } = validationResult.data

    switch (_table) {
      case 'seo_inquiries': {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        }
        if (status !== undefined) updateData.status = status
        if (notes !== undefined) updateData.notes = notes

        const { error } = await supabase
          .from('seo_inquiries')
          .update(updateData)
          .eq('id', id)

        if (error) {
          console.error('Error updating seo_inquiries:', error)
          return NextResponse.json(
            { error: 'Failed to update enquiry' },
            { status: 500 }
          )
        }
        break
      }

      case 'salary_guide_leads': {
        // Salary guide leads don't have status/notes fields to update
        // Could potentially add a notes field in future
        return NextResponse.json(
          { error: 'Salary guide leads cannot be updated' },
          { status: 400 }
        )
      }

      case 'employer_enquiries': {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        }
        if (status !== undefined) {
          updateData.status = status
          updateData.reviewed_at = new Date().toISOString()
          updateData.reviewed_by = authResult.userData.id
        }
        if (review_notes !== undefined) updateData.review_notes = review_notes

        const { error } = await supabase
          .from('employer_enquiries')
          .update(updateData)
          .eq('id', id)

        if (error) {
          console.error('Error updating employer_enquiries:', error)
          return NextResponse.json(
            { error: 'Failed to update enquiry' },
            { status: 500 }
          )
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update enquiry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/admin/enquiries/[id]
// ============================================================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const authResult = await requireAdmin(supabase)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Get _table from query params or body
    const { searchParams } = new URL(request.url)
    const tableParam = searchParams.get('_table')

    if (!tableParam) {
      return NextResponse.json(
        { error: '_table parameter is required' },
        { status: 400 }
      )
    }

    const validationResult = deleteEnquirySchema.safeParse({ _table: tableParam })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { _table } = validationResult.data

    switch (_table) {
      case 'seo_inquiries': {
        const { error } = await supabase
          .from('seo_inquiries')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting seo_inquiries:', error)
          return NextResponse.json(
            { error: 'Failed to delete enquiry' },
            { status: 500 }
          )
        }
        break
      }

      case 'salary_guide_leads': {
        const { error } = await supabase
          .from('salary_guide_leads')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting salary_guide_leads:', error)
          return NextResponse.json(
            { error: 'Failed to delete enquiry' },
            { status: 500 }
          )
        }
        break
      }

      case 'employer_enquiries': {
        const { error } = await supabase
          .from('employer_enquiries')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting employer_enquiries:', error)
          return NextResponse.json(
            { error: 'Failed to delete enquiry' },
            { status: 500 }
          )
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete enquiry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
