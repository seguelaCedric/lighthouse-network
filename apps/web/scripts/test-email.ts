/**
 * Test Email Script
 *
 * Run with: npx tsx apps/web/scripts/test-email.ts
 *
 * This script tests the Resend email configuration and sends a test email.
 */

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_5NDwqUAz_MtsUHC9Zr2UZ9awyvysneKkK";
const TEST_EMAIL = "seguelac@gmail.com";

// The verified domain is notifications.lighthouse-careers.com
const FROM_ADDRESS = "Lighthouse Careers <admin@notifications.lighthouse-careers.com>";

async function testEmailConfiguration() {
  console.log("=".repeat(60));
  console.log("RESEND EMAIL CONFIGURATION TEST");
  console.log("=".repeat(60));
  console.log("");

  const resend = new Resend(RESEND_API_KEY);

  // Send test email
  console.log("Sending test email...");
  console.log("-".repeat(40));
  console.log(`From: ${FROM_ADDRESS}`);
  console.log(`To: ${TEST_EMAIL}`);
  console.log("");

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [TEST_EMAIL],
      subject: "🧪 Test Email - Lighthouse Careers Email Configuration",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a2b4a; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a2b4a 0%, #2d4a7c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #c9a962; margin: 0; font-size: 28px;">🎉 Email Configuration Test</h1>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a2b4a; margin-top: 0;">Success!</h2>

            <p>This test email confirms that your Resend email configuration is working correctly with the new domain.</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1a2b4a;">Configuration Details:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Domain:</strong> notifications.lighthouse-careers.com</li>
                <li><strong>From Address:</strong> ${FROM_ADDRESS}</li>
                <li><strong>Test Time:</strong> ${new Date().toISOString()}</li>
              </ul>
            </div>

            <p>If you received this email, your DNS settings and Resend configuration are correct!</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              This is a test email from Lighthouse Careers.<br>
              <a href="https://lighthouse-careers.com" style="color: #c9a962;">lighthouse-careers.com</a>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Email Configuration Test - Success!

This test email confirms that your Resend email configuration is working correctly with the new domain.

Configuration Details:
- Domain: notifications.lighthouse-careers.com
- From Address: ${FROM_ADDRESS}
- Test Time: ${new Date().toISOString()}

If you received this email, your DNS settings and Resend configuration are correct!

--
Lighthouse Careers
https://lighthouse-careers.com
      `.trim(),
    });

    if (error) {
      console.error("❌ Failed to send email!");
      console.error("Error:", error.message);
      console.error("Full error:", JSON.stringify(error, null, 2));

      if (error.message.includes("domain") || error.message.includes("verify")) {
        console.log("");
        console.log("💡 This error typically means:");
        console.log("   - The domain is not verified in Resend");
        console.log("   - DNS records are not propagated yet");
        console.log("   - The from address domain doesn't match a verified domain");
        console.log("");
        console.log("📋 To fix this:");
        console.log("   1. Go to https://resend.com/domains");
        console.log("   2. Check if 'notifications.lighthouse-careers.com' is listed and verified");
        console.log("   3. If not, add the domain and configure DNS records");
        console.log("   4. Wait for DNS propagation (can take up to 48 hours)");
      }
    } else {
      console.log("✅ Email sent successfully!");
      console.log(`Email ID: ${data?.id}`);
      console.log("");
      console.log("📬 Check your inbox at:", TEST_EMAIL);
    }
  } catch (error) {
    console.error("❌ Exception while sending email:", error);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("TEST COMPLETE");
  console.log("=".repeat(60));
}

// Run the test
testEmailConfiguration().catch(console.error);
