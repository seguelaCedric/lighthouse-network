import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Use service role for inserting inquiries (anon can't insert via API without RLS bypass)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      type, // 'brief_match' | 'contact' | 'inquiry'
      name,
      email,
      phone,
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

    // Validate required fields
    // For brief_match type, only email is required
    if (type === 'brief_match') {
      if (!email) {
        return NextResponse.json(
          { error: "Email is required" },
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

    // Basic email validation
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Build message for brief_match type
    let finalMessage = message || null;
    if (type === 'brief_match' && brief) {
      finalMessage = `AI Brief Match Request
Role: ${brief.role || 'Not specified'}
Location: ${brief.location || 'Any'}
Timeline: ${brief.timeline || 'Flexible'}
Requirements: ${brief.requirements || 'None specified'}

Matched Candidates: ${matched_count || 0}`;
    }

    // Insert inquiry
    const { data, error } = await supabase
      .from("seo_inquiries")
      .insert({
        name: name || (type === 'brief_match' ? 'Brief Match Lead' : null),
        email,
        phone: phone || null,
        message: finalMessage,
        landing_page_id: landing_page_id || null,
        position_needed: position_needed || brief?.role || null,
        location: location || brief?.location || null,
        source_url: source_url || (type === 'brief_match' ? '/private-staff' : null),
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
    // await sendInquiryNotification({
    //   to: "admin@lighthouse-careers.com",
    //   inquiry: data,
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
