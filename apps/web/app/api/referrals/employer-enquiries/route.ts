import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import {
  employerEnquirySubmittedEmail,
  employerEnquiryAdminNotificationEmail,
} from "@/lib/email/templates";

// GET - List candidate's employer enquiries
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the users table record first (links auth.users to our app users)
  const { data: dbUser, error: dbUserError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (dbUserError || !dbUser) {
    return NextResponse.json(
      { error: "User profile not found" },
      { status: 404 }
    );
  }

  // Get candidate ID using the users.id
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", dbUser.id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: "Candidate profile not found" },
      { status: 404 }
    );
  }

  // Get enquiries
  try {
    const { data: enquiries, error } = await supabase
      .from("employer_enquiries")
      .select(`
        id,
        company_name,
        contact_name,
        contact_email,
        contact_phone,
        notes,
        status,
        submitted_at,
        reviewed_at,
        review_notes,
        client_id
      `)
      .eq("referrer_id", candidate.id)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching enquiries:", error);
      // Table might not exist yet - return empty array
      return NextResponse.json({ enquiries: [] });
    }

    return NextResponse.json({ enquiries: enquiries || [] });
  } catch (e) {
    console.error("employer_enquiries table not available:", e);
    return NextResponse.json({ enquiries: [] });
  }
}

// POST - Submit new employer enquiry
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the users table record first (links auth.users to our app users)
  const { data: dbUser, error: dbUserError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (dbUserError || !dbUser) {
    return NextResponse.json(
      { error: "User profile not found" },
      { status: 404 }
    );
  }

  // Get candidate ID and details using the users.id
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, first_name, last_name, email")
    .eq("user_id", dbUser.id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: "Candidate profile not found" },
      { status: 404 }
    );
  }

  const referrerName = [candidate.first_name, candidate.last_name]
    .filter(Boolean)
    .join(" ") || "Crew Member";
  const referrerEmail = candidate.email;

  // Check if can submit (monthly limit) - if RPC fails, allow submit
  let canSubmit = { can_submit: true, reason: null, enquiries_this_month: 0, monthly_limit: 10 };
  try {
    const { data: eligibility, error: eligibilityError } = await supabase.rpc(
      "can_submit_employer_enquiry",
      { p_candidate_id: candidate.id }
    );

    if (!eligibilityError && eligibility?.[0]) {
      canSubmit = eligibility[0];
    } else if (eligibilityError) {
      console.error("Error checking eligibility:", eligibilityError);
      // Allow submission if RPC doesn't exist yet
    }
  } catch (e) {
    console.error("RPC can_submit_employer_enquiry not available:", e);
    // Allow submission if RPC doesn't exist yet
  }

  if (!canSubmit.can_submit) {
    return NextResponse.json(
      {
        error: canSubmit.reason || "Cannot submit enquiry at this time",
        enquiries_this_month: canSubmit.enquiries_this_month,
        monthly_limit: canSubmit.monthly_limit
      },
      { status: 400 }
    );
  }

  // Parse body
  const body = await request.json();
  const { company_name, contact_name, contact_email, contact_phone, notes } = body;

  // Validation
  if (!company_name?.trim()) {
    return NextResponse.json(
      { error: "Company or yacht name is required" },
      { status: 400 }
    );
  }

  if (!contact_name?.trim()) {
    return NextResponse.json(
      { error: "Contact name is required" },
      { status: 400 }
    );
  }

  if (!contact_email?.trim() && !contact_phone?.trim()) {
    return NextResponse.json(
      { error: "At least one contact method (email or phone) is required" },
      { status: 400 }
    );
  }

  // Insert enquiry
  try {
    const { data: enquiry, error: insertError } = await supabase
      .from("employer_enquiries")
      .insert({
        referrer_id: candidate.id,
        company_name: company_name.trim(),
        contact_name: contact_name.trim(),
        contact_email: contact_email?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        notes: notes?.trim() || null,
        status: "submitted",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting enquiry:", insertError);
      return NextResponse.json(
        { error: "Failed to submit enquiry. The employer referral system is being set up - please try again later." },
        { status: 500 }
      );
    }

    // Send confirmation email to referrer (async, don't block response)
    if (referrerEmail) {
      const confirmationEmail = employerEnquirySubmittedEmail({
        referrerName,
        companyName: company_name.trim(),
        contactName: contact_name.trim(),
      });

      sendEmail({
        to: referrerEmail,
        subject: confirmationEmail.subject,
        html: confirmationEmail.html,
        text: confirmationEmail.text,
      }).catch((err) => {
        console.error("Failed to send referrer confirmation email:", err);
      });
    }

    // Fetch admin emails (users with role 'owner' or 'admin')
    const { data: admins } = await supabase
      .from("users")
      .select("email")
      .in("role", ["owner", "admin"]);

    if (admins && admins.length > 0) {
      const adminEmails = admins
        .map((a) => a.email)
        .filter((email): email is string => Boolean(email));

      if (adminEmails.length > 0) {
        const adminNotification = employerEnquiryAdminNotificationEmail({
          referrerName,
          referrerEmail: referrerEmail || "Not provided",
          companyName: company_name.trim(),
          contactName: contact_name.trim(),
          contactEmail: contact_email?.trim() || undefined,
          contactPhone: contact_phone?.trim() || undefined,
          notes: notes?.trim() || undefined,
          submittedAt: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        });

        // Send to all admins (async, don't block response)
        sendEmail({
          to: adminEmails,
          subject: adminNotification.subject,
          html: adminNotification.html,
          text: adminNotification.text,
        }).catch((err) => {
          console.error("Failed to send admin notification email:", err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      enquiry,
      message: "Employer lead submitted successfully! We'll review it shortly."
    });
  } catch (e) {
    console.error("employer_enquiries table not available:", e);
    return NextResponse.json(
      { error: "The employer referral system is being set up. Please try again later." },
      { status: 503 }
    );
  }
}
