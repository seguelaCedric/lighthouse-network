"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  syncCandidateCreation,
  syncDocumentUpload,
  syncJobApplication,
} from "@/lib/vincere/sync-service";

export type CandidateAuthResult = {
  success: boolean;
  error?: string;
  candidateId?: string;
  applicationId?: string;
};

interface CandidateRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationality?: string;
  candidateType?: string;
  primaryPosition: string;
  yearsExperience?: string;
  jobId?: string;
}

export async function registerCandidate(
  data: CandidateRegistrationData,
  cvFile?: { path: string; url: string; name: string; size: number; type: string }
): Promise<CandidateAuthResult> {
  const supabase = await createClient();

  // Check if email already exists in candidates table
  const { data: existingCandidate } = await supabase
    .from("candidates")
    .select("id, user_id, email")
    .eq("email", data.email.toLowerCase())
    .single();

  if (existingCandidate?.user_id) {
    return {
      success: false,
      error: "An account with this email already exists. Please sign in instead.",
    };
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        full_name: `${data.firstName} ${data.lastName}`,
        user_type: "candidate",
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/crew/auth/callback`,
    },
  });

  if (authError) {
    return {
      success: false,
      error: authError.message,
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "Failed to create account",
    };
  }

  // Create or update user record with user_type = 'candidate'
  // All candidates belong to Lighthouse Careers organization by default
  const DEFAULT_LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";

  const { error: userError } = await supabase.from("users").upsert(
    {
      auth_id: authData.user.id,
      email: data.email.toLowerCase(),
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      user_type: "candidate",
      organization_id: DEFAULT_LIGHTHOUSE_ORG_ID,
      is_active: true,
    },
    {
      onConflict: "auth_id",
    }
  );

  if (userError) {
    console.error("Failed to create user record:", userError);
    // Continue anyway - the user record might already exist
  }

  // Get the user record to link to candidate
  const { data: userRecord } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authData.user.id)
    .single();

  // Create or update candidate record
  let candidateId: string;

  if (existingCandidate) {
    // Link existing candidate to user account
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        user_id: userRecord?.id,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        whatsapp: data.phone,
        nationality: data.nationality || null,
        candidate_type: data.candidateType || null,
        primary_position: data.primaryPosition,
        years_experience: data.yearsExperience ? parseInt(data.yearsExperience) : null,
        availability_status: "looking",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCandidate.id);

    if (updateError) {
      console.error("Failed to update candidate:", updateError);
    }

    candidateId = existingCandidate.id;
  } else {
    // Create new candidate
    const { data: newCandidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        user_id: userRecord?.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        whatsapp: data.phone,
        nationality: data.nationality || null,
        candidate_type: data.candidateType || null,
        primary_position: data.primaryPosition,
        years_experience: data.yearsExperience ? parseInt(data.yearsExperience) : null,
        source: "self_registration",
        availability_status: "looking",
      })
      .select("id")
      .single();

    if (candidateError || !newCandidate) {
      console.error("Failed to create candidate:", candidateError);
      return {
        success: false,
        error: "Failed to create candidate profile",
      };
    }

    candidateId = newCandidate.id;
  }

  // Save CV document if provided
  if (cvFile) {
    await supabase.from("documents").insert({
      entity_type: "candidate",
      entity_id: candidateId,
      file_name: cvFile.name,
      file_path: cvFile.path,
      file_url: cvFile.url,
      file_size: cvFile.size,
      mime_type: cvFile.type,
      document_type: "cv",
    });
  }

  // Sync candidate to Vincere (fire-and-forget)
  syncCandidateCreation(candidateId).catch((err) =>
    console.error("Vincere sync failed for candidate creation:", err)
  );

  // Sync CV to Vincere if provided (fire-and-forget)
  if (cvFile?.url) {
    syncDocumentUpload(candidateId, cvFile.url, cvFile.name, cvFile.type, "cv").catch((err) =>
      console.error("Vincere sync failed for CV upload:", err)
    );
  }

  // If applying for a job, create the application
  let applicationId: string | undefined;

  if (data.jobId) {
    // Verify job exists and is public
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, created_by_agency_id, is_public, status")
      .eq("id", data.jobId)
      .single();

    if (job && job.is_public && job.status === "open") {
      // Check for duplicate application
      const { data: existingApp } = await supabase
        .from("applications")
        .select("id")
        .eq("job_id", data.jobId)
        .eq("candidate_id", candidateId)
        .single();

      if (!existingApp) {
        const { data: application } = await supabase
          .from("applications")
          .insert({
            job_id: data.jobId,
            candidate_id: candidateId,
            agency_id: job.created_by_agency_id,
            source: "job_board",
            stage: "applied",
            applied_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (application) {
          applicationId = application.id;

          // Sync job application to Vincere (fire-and-forget)
          syncJobApplication(candidateId, data.jobId).catch((err) =>
            console.error("Vincere sync failed for job application:", err)
          );

          // Create activity log
          await supabase.from("activity_logs").insert({
            activity_type: "application_received",
            entity_type: "job",
            entity_id: data.jobId,
            organization_id: job.created_by_agency_id,
            metadata: {
              application_id: application.id,
              candidate_id: candidateId,
              candidate_name: `${data.firstName} ${data.lastName}`,
              source: "self_registration",
            },
          });

          // Create notification for agency
          const { data: agencyUsers } = await supabase
            .from("users")
            .select("id")
            .eq("organization_id", job.created_by_agency_id)
            .limit(5);

          if (agencyUsers) {
            const notifications = agencyUsers.map((user) => ({
              user_id: user.id,
              type: "new_application",
              title: "New Application Received",
              message: `${data.firstName} ${data.lastName} applied for ${job.title}`,
              action_url: `/jobs/${data.jobId}/submissions`,
              metadata: {
                application_id: application.id,
                candidate_id: candidateId,
                job_id: data.jobId,
              },
            }));

            await supabase.from("notifications").insert(notifications);
          }
        }
      }
    }
  }

  revalidatePath("/", "layout");

  return {
    success: true,
    candidateId,
    applicationId,
  };
}

export async function signInCandidate(
  email: string,
  password: string
): Promise<CandidateAuthResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Check if user record exists
  const { data: user } = await supabase
    .from("users")
    .select("id, user_type")
    .eq("auth_id", data.user.id)
    .single();

  // If user record exists and is not a candidate, reject
  if (user && user.user_type !== "candidate") {
    await supabase.auth.signOut();
    return {
      success: false,
      error: "This account is not a crew member account. Please use the recruiter login.",
    };
  }

  // If no user record exists, check if there's a candidate with matching email
  // and create the user record if needed (for Vincere-imported candidates)
  if (!user) {
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, first_name, last_name, phone")
      .eq("email", email.toLowerCase())
      .single();

    if (candidate) {
      // Create user record for this candidate
      const DEFAULT_LIGHTHOUSE_ORG_ID = "00000000-0000-0000-0000-000000000001";

      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          auth_id: data.user.id,
          email: email.toLowerCase(),
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          phone: candidate.phone,
          user_type: "candidate",
          organization_id: DEFAULT_LIGHTHOUSE_ORG_ID,
          is_active: true,
        })
        .select("id")
        .single();

      if (!userError && newUser) {
        // Link the candidate to the new user record
        await supabase
          .from("candidates")
          .update({ user_id: newUser.id })
          .eq("id", candidate.id);
      }
    } else {
      // No candidate record found - this user shouldn't be logging into crew portal
      await supabase.auth.signOut();
      return {
        success: false,
        error: "No crew member profile found for this account. Please register first.",
      };
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signOutCandidate(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/crew/auth/login");
}

export async function getCurrentCandidate() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  // Get the candidate linked to this user
  const { data: dbUser } = await supabase
    .from("users")
    .select("id, user_type")
    .eq("auth_id", user.id)
    .single();

  // If user record exists and is not a candidate type, return null
  if (dbUser && dbUser.user_type !== "candidate") return null;

  // Try to get candidate by user_id first
  if (dbUser) {
    const { data: candidate } = await supabase
      .from("candidates")
      .select("*")
      .eq("user_id", dbUser.id)
      .single();

    if (candidate) return candidate;
  }

  // Fallback to email-based lookup (for Vincere-imported candidates)
  const { data: candidate } = await supabase
    .from("candidates")
    .select("*")
    .eq("email", user.email)
    .single();

  return candidate;
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("candidates")
    .select("id, user_id")
    .eq("email", email.toLowerCase())
    .single();

  // Return true if candidate exists AND has a user_id (registered account)
  return !!(data?.user_id);
}
