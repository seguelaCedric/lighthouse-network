import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If no explicit redirect, determine based on user type
      if (!next) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Check if user is a candidate
          const { data: userData } = await supabase
            .from("users")
            .select("user_type")
            .eq("auth_id", user.id)
            .maybeSingle();

          if (userData?.user_type === "candidate") {
            next = "/crew/dashboard";
          } else {
            next = "/dashboard";
          }
        } else {
          next = "/dashboard";
        }
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
