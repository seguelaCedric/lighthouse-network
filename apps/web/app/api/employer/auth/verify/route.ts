import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/employer/login?error=missing_token", request.url));
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user agent and IP for session tracking
    const userAgent = request.headers.get("user-agent") || null;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

    // Verify token and create session using the database function
    const { data: sessionData, error: verifyError } = await supabase
      .rpc("verify_employer_magic_token", {
        p_token: token,
        p_user_agent: userAgent,
        p_ip_address: ipAddress,
      });

    if (verifyError) {
      console.error("Token verification error:", verifyError);
      return NextResponse.redirect(new URL("/employer/login?error=verification_failed", request.url));
    }

    if (!sessionData || sessionData.length === 0) {
      // Token invalid or expired
      return NextResponse.redirect(new URL("/employer/login?error=invalid_token", request.url));
    }

    const session = sessionData[0];

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("employer_session", session.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    // Redirect to employer portal
    return NextResponse.redirect(new URL("/employer/portal", request.url));
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.redirect(new URL("/employer/login?error=unknown", request.url));
  }
}
