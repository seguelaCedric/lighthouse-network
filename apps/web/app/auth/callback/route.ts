import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { triggerHydrationIfNeeded } from "@/lib/vincere/on-login-hydration";

// Default Lighthouse org ID for candidates
const DEFAULT_LIGHTHOUSE_ORG_ID = "c4e1e6ff-b71a-4fbd-bb31-dd282d981436";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user record exists
        const { data: userData } = await supabase
          .from("users")
          .select("id, user_type, organization_id")
          .eq("auth_id", user.id)
          .maybeSingle();

        // If no user record exists, check if there's a candidate with matching email
        // and create the user record + link them (for Vincere-imported candidates using magic link)
        if (!userData && user.email) {
          const { data: candidate } = await supabase
            .from("candidates")
            .select("id, first_name, last_name, phone")
            .eq("email", user.email.toLowerCase())
            .maybeSingle();

          if (candidate) {
            // Create user record for this candidate
            const { data: newUser, error: userError } = await supabase
              .from("users")
              .insert({
                auth_id: user.id,
                email: user.email.toLowerCase(),
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

              console.log(`[auth/callback] Linked existing candidate ${candidate.id} to new user ${newUser.id}`);

              // Trigger Vincere hydration if needed (fire-and-forget)
              triggerHydrationIfNeeded(
                candidate.id,
                user.email.toLowerCase(),
                DEFAULT_LIGHTHOUSE_ORG_ID,
                supabase
              ).catch((err) => {
                console.error(`[auth/callback] Vincere hydration failed for ${candidate.id}:`, err);
              });
            }

            // Set redirect for candidate
            if (!next) {
              next = "/crew/dashboard";
            }
          }
        } else if (userData) {
          // User record exists - determine redirect based on user type
          if (!next) {
            if (userData.user_type === "candidate") {
              next = "/crew/dashboard";
            } else {
              next = "/dashboard";
            }
          }
        }
      }

      // Default redirect if nothing else matched
      if (!next) {
        next = "/dashboard";
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`);
}
