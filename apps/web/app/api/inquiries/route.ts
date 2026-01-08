import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Use service role for inserting inquiries (anon can't insert via API without RLS bypass)
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validate phone number format (international format)
function validatePhoneNumber(phone: string): boolean {
  // Remove spaces and common formatting characters for validation
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  // Should start with + and have at least 8 digits after
  return /^\+[1-9]\d{7,19}$/.test(cleaned);
}

// Format phone number for storage (remove formatting, keep + and digits)
function formatPhoneForStorage(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

// GET - List inquiries with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const landingPageId = searchParams.get('landing_page_id');
    const sourceUrl = searchParams.get('source_url');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('seo_inquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (landingPageId) {
      query = query.eq('landing_page_id', landingPageId);
    }

    if (sourceUrl) {
      query = query.eq('source_url', sourceUrl);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Inquiries fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
    }

    return NextResponse.json({
      inquiries: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Inquiries GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      type, // 'brief_match' | 'contact' | 'inquiry'
      name,
      email,
      phone,
      company,
      message,
      landing_page_id,
      position_needed,
      location,
      source_url,
      utm_source,
      utm_medium,
      utm_campaign,
      // Brief match specific fields
      brief,
      matched_count,
    } = body;

    // Validate required fields based on type
    if (type === 'brief_match') {
      // For brief_match, require name, email, and phone
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }
      if (!email || !email.trim()) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }
      if (!phone || !phone.trim()) {
        return NextResponse.json(
          { error: "Phone number is required" },
          { status: 400 }
        );
      }
    } else {
      if (!name || !email) {
        return NextResponse.json(
          { error: "Name and email are required" },
          { status: 400 }
        );
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Phone validation for brief_match type
    if (type === 'brief_match' && phone) {
      if (!validatePhoneNumber(phone)) {
        return NextResponse.json(
          { error: "Please enter a valid phone number with country code (e.g., +33 6 12 34 56 78)" },
          { status: 400 }
        );
      }
    }

    // Build comprehensive message for brief_match type
    let finalMessage = message || null;
    if (type === 'brief_match' && brief) {
      const messageParts: string[] = [];
      messageParts.push("AI Brief Match Request");
      messageParts.push("");
      
      // Include company if provided
      if (company && company.trim()) {
        messageParts.push(`Company/Organization: ${company.trim()}`);
        messageParts.push("");
      }
      
      if (brief.query) {
        messageParts.push(`Search Query: ${brief.query}`);
        messageParts.push("");
      }
      
      if (brief.position) {
        messageParts.push(`Position: ${brief.position}`);
      }
      
      if (brief.location) {
        messageParts.push(`Location: ${brief.location}`);
      }
      
      if (brief.timeline) {
        messageParts.push(`Timeline: ${brief.timeline}`);
      }
      
      if (brief.budget) {
        messageParts.push(`Budget: ${brief.budget}`);
      }
      
      if (brief.additional_notes) {
        messageParts.push("");
        messageParts.push(`Additional Notes: ${brief.additional_notes}`);
      }
      
      messageParts.push("");
      messageParts.push(`Matched Candidates: ${matched_count || 0}`);
      
      finalMessage = messageParts.join("\n");
    } else if (company && company.trim()) {
      // For non-brief_match types, include company in message if provided
      finalMessage = finalMessage 
        ? `${finalMessage}\n\nCompany: ${company.trim()}`
        : `Company: ${company.trim()}`;
    }

    // Extract position and location from structured brief if available
    const extractedPosition = position_needed || brief?.position || null;
    const extractedLocation = location || brief?.location || null;

    // Format phone for storage
    const formattedPhone = phone ? formatPhoneForStorage(phone) : null;

    // Insert inquiry
    const { data, error } = await supabaseService
      .from("seo_inquiries")
      .insert({
        name: name?.trim() || (type === 'brief_match' ? 'Brief Match Lead' : null),
        email: email.trim(),
        phone: formattedPhone,
        message: finalMessage,
        landing_page_id: landing_page_id || null,
        position_needed: extractedPosition,
        location: extractedLocation,
        source_url: source_url || (type === 'brief_match' ? '/match' : null),
        utm_source: utm_source || (type === 'brief_match' ? 'brief_matcher' : null),
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting inquiry:", error);
      return NextResponse.json(
        { error: "Failed to submit inquiry" },
        { status: 500 }
      );
    }

    // TODO: Send notification email using Resend
    // Include company name in notification if provided
    // await sendInquiryNotification({
    //   to: "admin@lighthouse-careers.com",
    //   inquiry: data,
    //   company: company,
    // });

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error("Inquiry submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
