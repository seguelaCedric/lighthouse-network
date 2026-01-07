import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role client for inserting applications
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient();

    // Parse multipart form data
    const formData = await request.formData();

    const jobId = formData.get("jobId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const currentLocation = formData.get("currentLocation") as string;
    const primaryPosition = formData.get("primaryPosition") as string;
    const yearsExperience = formData.get("yearsExperience") as string;
    const availableFrom = formData.get("availableFrom") as string;
    const coverLetter = formData.get("coverLetter") as string;
    const cv = formData.get("cv") as File | null;

    // Validate required fields
    if (!jobId || !firstName || !lastName || !email || !phone || !primaryPosition) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate CV is provided
    if (!cv || cv.size === 0) {
      return NextResponse.json(
        { error: "CV is required to apply for jobs. Please upload your CV." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Verify job exists and is open for applications
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, created_by_agency_id, is_public, status, apply_deadline")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.is_public || job.status !== "open") {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 400 }
      );
    }

    if (job.apply_deadline && new Date(job.apply_deadline) < new Date()) {
      return NextResponse.json(
        { error: "The application deadline has passed" },
        { status: 400 }
      );
    }

    // Check if candidate already exists by email
    let candidateId: string;
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingCandidate) {
      candidateId = existingCandidate.id;

      // Update candidate info if needed
      await supabase
        .from("candidates")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          current_location: currentLocation || null,
          primary_position: primaryPosition,
          available_from: availableFrom || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidateId);
    } else {
      // Create new candidate
      const { data: newCandidate, error: candidateError } = await supabase
        .from("candidates")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          phone: phone,
          whatsapp: phone, // Assume phone is WhatsApp number
          current_location: currentLocation || null,
          primary_position: primaryPosition,
          available_from: availableFrom || null,
          source: "job_board",
          availability_status: availableFrom ? "available" : "looking",
        })
        .select("id")
        .single();

      if (candidateError || !newCandidate) {
        console.error("Failed to create candidate:", candidateError);
        return NextResponse.json(
          { error: "Failed to create candidate profile" },
          { status: 500 }
        );
      }

      candidateId = newCandidate.id;
    }

    // Check for duplicate application
    const { data: existingApplication } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("candidate_id", candidateId)
      .eq("source", "job_board")
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied for this position" },
        { status: 400 }
      );
    }

    // Upload CV (required, already validated above)
    let cvUrl: string | null = null;
    let cvPath: string | null = null;

    const timestamp = Date.now();
    const extension = cv.name.split(".").pop() || "pdf";
    const sanitizedName = cv.name.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
    cvPath = `candidates/${candidateId}/cv/${timestamp}-${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(cvPath, cv, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("CV upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload CV. Please try again." },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(cvPath);
    cvUrl = urlData.publicUrl;

    // Save document record
    const { error: docError } = await supabase.from("documents").insert({
      entity_type: "candidate",
      entity_id: candidateId,
      file_name: cv.name,
      file_path: cvPath,
      file_url: cvUrl,
      file_size: cv.size,
      mime_type: cv.type,
      document_type: "cv",
      organization_id: job.created_by_agency_id,
    });

    if (docError) {
      console.error("Failed to save CV document record:", docError);
      // Continue with application even if document record fails
    }

    // Create application
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        candidate_id: candidateId,
        agency_id: job.created_by_agency_id,
        source: "job_board",
        stage: "applied",
        internal_notes: coverLetter || null,
        applied_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (appError || !application) {
      console.error("Failed to create application:", appError);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    // Create activity log
    await supabase.from("activity_logs").insert({
      activity_type: "application_received",
      entity_type: "job",
      entity_id: jobId,
      organization_id: job.created_by_agency_id,
      metadata: {
        application_id: application.id,
        candidate_id: candidateId,
        candidate_name: `${firstName} ${lastName}`,
        source: "job_board",
      },
    });

    // Create notification for agency
    const { data: agencyUsers } = await supabase
      .from("users")
      .select("id")
      .eq("organization_id", job.created_by_agency_id)
      .limit(5); // Notify first 5 users in the agency

    if (agencyUsers) {
      const notifications = agencyUsers.map((user) => ({
        user_id: user.id,
        type: "new_application",
        title: "New Application Received",
        message: `${firstName} ${lastName} applied for ${job.title}`,
        action_url: `/jobs/${jobId}/submissions`,
        metadata: {
          application_id: application.id,
          candidate_id: candidateId,
          job_id: jobId,
        },
      }));

      await supabase.from("notifications").insert(notifications);
    }

    // Send confirmation email (fire and forget)
    sendConfirmationEmail({
      email,
      firstName,
      jobTitle: job.title,
      applicationId: application.id,
    }).catch((err) => {
      console.error("Failed to send confirmation email:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        applicationId: application.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendConfirmationEmail(params: {
  email: string;
  firstName: string;
  jobTitle: string;
  applicationId: string;
}) {
  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend not configured, skipping confirmation email");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "noreply@lighthouse.crew",
        to: params.email,
        subject: `Application Received - ${params.jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #111827; padding: 24px; text-align: center;">
              <h1 style="color: #B49A5E; margin: 0;">Lighthouse Crew Network</h1>
            </div>
            <div style="padding: 32px; background: #ffffff;">
              <h2 style="color: #111827; margin-top: 0;">Hi ${params.firstName},</h2>
              <p style="color: #4B5563; line-height: 1.6;">
                Thank you for applying for the <strong>${params.jobTitle}</strong> position through Lighthouse Crew Network.
              </p>
              <p style="color: #4B5563; line-height: 1.6;">
                We've received your application and it's now being reviewed by the recruiting team. You'll hear back from them if your profile matches their requirements.
              </p>
              <div style="background: #FDF5EB; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="color: #92400E; margin: 0; font-size: 14px;">
                  <strong>Application Reference:</strong> ${params.applicationId.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <p style="color: #4B5563; line-height: 1.6;">
                In the meantime, you can browse more opportunities on our job board.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://lighthouse.crew"}/jobs"
                 style="display: inline-block; background: #B49A5E; color: #111827; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                Browse More Jobs
              </a>
            </div>
            <div style="background: #F3F4F6; padding: 16px; text-align: center;">
              <p style="color: #6B7280; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Lighthouse Crew Network. All rights reserved.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }
}
