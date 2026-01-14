import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { baseTemplate } from "@/lib/email/templates/base";
import { salaryGuideLeadAdminEmail } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store lead in database
    try {
      const { error: dbError } = await supabase.from("salary_guide_leads").insert({
        email: email.toLowerCase().trim(),
        requested_at: new Date().toISOString(),
        source: "salary_guide_page",
      });
      
      if (dbError) {
        // Table might not exist yet, log but don't fail
        console.log("Could not store lead in database (table may not exist):", dbError.message);
      }
    } catch (dbError) {
      // Table might not exist yet, log but don't fail
      console.log("Could not store lead in database:", dbError);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3004";
    
    // Get PDF URL from storage (this will generate it if it doesn't exist)
    let pdfUrl: string;
    try {
      const pdfResponse = await fetch(`${baseUrl}/api/salary-guide/pdf`, {
        headers: {
          "User-Agent": "Lighthouse-Email-Service/1.0",
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      if (pdfResponse.ok) {
        const pdfData = await pdfResponse.json();
        if (pdfData.url) {
          pdfUrl = pdfData.url;
          console.log(`PDF URL retrieved: ${pdfUrl}`);
        } else {
          // Fallback to direct endpoint
          pdfUrl = `${baseUrl}/api/salary-guide/pdf`;
        }
      } else {
        // Fallback to direct endpoint
        pdfUrl = `${baseUrl}/api/salary-guide/pdf`;
      }
    } catch (pdfError) {
      console.error("Failed to get PDF URL:", pdfError);
      // Fallback to direct endpoint
      pdfUrl = `${baseUrl}/api/salary-guide/pdf`;
    }

    // Create email content
    const emailContent = `
      <h1>Your 2026 Salary Guide is Ready!</h1>
      <p>Thank you for requesting our comprehensive 2026 Salary Guide for yacht crew and private household positions.</p>
      
      <p style="text-align:center; margin: 30px 0;">
        <a href="${pdfUrl}" class="button" style="display: inline-block; padding: 14px 28px; background-color: #c9a962; color: #1a2b4a; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Download Your Free Guide
        </a>
      </p>
      

      <div class="info-box" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin:0 0 15px; font-weight:600; color:#1a2b4a;">What's included:</p>
        <ul style="margin:0;">
          <li><strong>Yacht Crew Salaries</strong> - Complete salary ranges by yacht size (24m-100m+)</li>
          <li><strong>Private Household Salaries</strong> - Salary ranges by property type and service level</li>
          <li><strong>Market Insights</strong> - Factors affecting compensation and negotiation tips</li>
          <li><strong>2026 Market Data</strong> - Based on 300+ real placements</li>
        </ul>
      </div>

      <p><strong>Ready to find your next role?</strong></p>
      <p>Browse our <a href="${baseUrl}/job-board" style="color: #c9a962; text-decoration: underline;">open positions</a> or <a href="${baseUrl}/auth/register" style="color: #c9a962; text-decoration: underline;">create your profile</a> to get matched with opportunities that fit your experience and salary expectations.</p>

      <p>If you have any questions about salary ranges or career opportunities, feel free to reply to this email.</p>

      <p>Best regards,<br>The Lighthouse Careers Team</p>
    `;

    // Send email with PDF attachment
    const emailResult = await sendEmail({
      to: email.toLowerCase().trim(),
      subject: "Your Free 2026 Salary Guide - Yacht Crew & Private Household",
      html: baseTemplate(emailContent),
      text: `Your 2026 Salary Guide is Ready!

Thank you for requesting our comprehensive 2026 Salary Guide for yacht crew and private household positions.

Download your guide: ${pdfUrl}

What's included:
- Yacht Crew Salaries - Complete salary ranges by yacht size (24m-100m+)
- Private Household Salaries - Salary ranges by property type and service level
- Market Insights - Factors affecting compensation and negotiation tips
- 2026 Market Data - Based on 300+ real placements

Ready to find your next role?
Browse our open positions: ${baseUrl}/job-board
Create your profile: ${baseUrl}/auth/register

If you have any questions, feel free to reply to this email.

Best regards,
The Lighthouse Careers Team`,
    });

    if (!emailResult.success) {
      console.error("Failed to send salary guide email:", {
        error: emailResult.error,
        recipient: email.toLowerCase().trim(),
      });
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error || "Unknown error"}. Please try again later.` },
        { status: 500 }
      );
    }

    // Update lead record with email sent status
    if (emailResult.success && emailResult.id) {
      try {
        await supabase
          .from("salary_guide_leads")
          .update({
            sent_at: new Date().toISOString(),
            email_id: emailResult.id,
          })
          .eq("email", email.toLowerCase().trim())
          .is("sent_at", null); // Only update if not already sent
      } catch (updateError) {
        console.log("Could not update lead record:", updateError);
      }
    }

    // Send admin notification (fire-and-forget)
    const adminEmail = salaryGuideLeadAdminEmail({
      email: email.toLowerCase().trim(),
      requestedAt: new Date().toISOString(),
    });
    sendEmail({
      to: "admin@lighthouse-careers.com",
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
    }).catch((err) => console.error("Failed to send salary guide admin notification:", err));

    return NextResponse.json({
      success: true,
      message: "Salary guide sent successfully",
    });
  } catch (error) {
    console.error("Error processing salary guide request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

