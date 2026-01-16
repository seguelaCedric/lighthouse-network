/**
 * Test Single Email Script
 */

import { Resend } from "resend";
import { hiringRequestConfirmationEmail } from "../lib/email/templates";

const RESEND_API_KEY = "re_5NDwqUAz_MtsUHC9Zr2UZ9awyvysneKkK";
const TEST_EMAIL = "seguelac@gmail.com";
const FROM_ADDRESS = "Lighthouse Careers <admin@notifications.lighthouse-careers.com>";

const resend = new Resend(RESEND_API_KEY);

async function testSingleEmail() {
  const emailData = hiringRequestConfirmationEmail({
    name: "Victoria Chen",
    position: "Chief Stewardess",
    matchedCount: 12,
  });

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [TEST_EMAIL],
    subject: `[TEST] ${emailData.subject}`,
    html: emailData.html,
    text: emailData.text,
  });

  if (error) {
    console.log(`❌ Failed: ${error.message}`);
  } else {
    console.log(`✅ Sent! ID: ${data?.id}`);
    console.log(`📬 Check inbox: ${TEST_EMAIL}`);
  }
}

testSingleEmail().catch(console.error);
