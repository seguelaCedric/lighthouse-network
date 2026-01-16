/**
 * Send Active Test Emails Script
 *
 * Run with: npx tsx apps/web/scripts/send-active-test-emails.ts
 *
 * This script sends only the actively used email templates.
 */

import { Resend } from "resend";
import {
  welcomeCandidateEmail,
  jobAlertEmail,
  initialJobMatchEmail,
  newCandidateRegistrationAdminEmail,
  newApplicationAdminEmail,
  inquiryNotificationEmail,
  contactConfirmationEmail,
  hiringRequestConfirmationEmail,
  salaryGuideLeadAdminEmail,
} from "../lib/email/templates";

const RESEND_API_KEY = "re_5NDwqUAz_MtsUHC9Zr2UZ9awyvysneKkK";
const TEST_EMAIL = "seguelac@gmail.com";
const FROM_ADDRESS = "Lighthouse Careers <admin@notifications.lighthouse-careers.com>";

const resend = new Resend(RESEND_API_KEY);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendEmail(name: string, emailData: { subject: string; html: string; text: string }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [TEST_EMAIL],
      subject: `[TEST] ${emailData.subject}`,
      html: emailData.html,
      text: emailData.text,
    });

    if (error) {
      console.log(`   ❌ ${name}: ${error.message}`);
      return false;
    }
    console.log(`   ✅ ${name}`);
    return true;
  } catch (err) {
    console.log(`   ❌ ${name}: ${err}`);
    return false;
  }
}

async function sendActiveTestEmails() {
  console.log("=".repeat(60));
  console.log("SENDING ACTIVE TEST EMAILS");
  console.log("=".repeat(60));
  console.log(`To: ${TEST_EMAIL}`);
  console.log(`From: ${FROM_ADDRESS}`);
  console.log("");

  let sent = 0;
  let failed = 0;

  // ========================================
  // CANDIDATE-FACING EMAILS
  // ========================================
  console.log("CANDIDATE EMAILS");
  console.log("-".repeat(40));

  // 1. Welcome Candidate (Yacht Crew)
  if (await sendEmail("Welcome Candidate (Yacht)", welcomeCandidateEmail({
    candidateName: "Marco Rossi",
    position: "Deckhand",
    candidateType: "yacht_crew",
    dashboardLink: "https://lighthouse-careers.com/crew/dashboard",
  }))) sent++; else failed++;
  await delay(500);

  // 2. Welcome Candidate (Private Staff)
  if (await sendEmail("Welcome Candidate (Private Staff)", welcomeCandidateEmail({
    candidateName: "Sophie Laurent",
    position: "Private Chef",
    candidateType: "private_staff",
    dashboardLink: "https://lighthouse-careers.com/crew/dashboard",
  }))) sent++; else failed++;
  await delay(500);

  // 3. Job Alert
  if (await sendEmail("Job Alert", jobAlertEmail({
    candidateName: "Tom Harris",
    jobTitle: "2nd Engineer",
    jobId: "job-789",
    vesselName: "M/Y Velocity",
    vesselType: "Motor Yacht",
    vesselSize: 65,
    contractType: "permanent",
    primaryRegion: "Mediterranean (Summer) / Caribbean (Winter)",
    salaryMin: 5500,
    salaryMax: 7000,
    salaryCurrency: "EUR",
    salaryPeriod: "month",
    startDate: "2025-03-01",
    benefits: "Full medical, flights, 60 days leave",
    matchedPosition: "2nd Engineer",
    dashboardLink: "https://lighthouse-careers.com/crew/jobs/job-789",
  }))) sent++; else failed++;
  await delay(500);

  // 4. Initial Job Match (when preferences set)
  if (await sendEmail("Initial Job Match", initialJobMatchEmail({
    candidateName: "Anna Schmidt",
    totalMatches: 8,
    matchedJobs: [
      { id: "job-1", title: "Chief Stewardess", vesselName: "M/Y Excellence", vesselType: "Motor Yacht", contractType: "permanent", primaryRegion: "Mediterranean", matchedPosition: "Chief Stewardess" },
      { id: "job-2", title: "Chief Stewardess", vesselName: "M/Y Prestige", vesselType: "Motor Yacht", contractType: "seasonal", primaryRegion: "Caribbean", matchedPosition: "Chief Stewardess" },
      { id: "job-3", title: "2nd Stewardess", vesselName: "M/Y Aurora", vesselType: "Motor Yacht", contractType: "permanent", primaryRegion: "Mediterranean", matchedPosition: "2nd Stewardess" },
      { id: "job-4", title: "Chief Stewardess", vesselName: "S/Y Wind Spirit", vesselType: "Sailing Yacht", contractType: "rotational", primaryRegion: "Global", matchedPosition: "Chief Stewardess" },
      { id: "job-5", title: "2nd Stewardess", vesselName: "M/Y Diamond", vesselType: "Motor Yacht", contractType: "seasonal", primaryRegion: "Mediterranean", matchedPosition: "2nd Stewardess" },
    ],
    dashboardLink: "https://lighthouse-careers.com/crew/jobs",
  }))) sent++; else failed++;
  await delay(500);

  // ========================================
  // ADMIN NOTIFICATION EMAILS
  // ========================================
  console.log("");
  console.log("ADMIN NOTIFICATIONS");
  console.log("-".repeat(40));

  // 5. New Candidate Registration
  if (await sendEmail("New Candidate Registration", newCandidateRegistrationAdminEmail({
    firstName: "Christina",
    lastName: "Papadopoulos",
    email: "christina.p@example.com",
    phone: "+30 697 123 4567",
    primaryPosition: "Chief Stewardess",
    nationality: "Greek",
    candidateType: "yacht_crew",
    cvUrl: "https://lighthouse-careers.com/admin/candidates/123/cv",
  }))) sent++; else failed++;
  await delay(500);

  // 6. New Application
  if (await sendEmail("New Application", newApplicationAdminEmail({
    candidateFirstName: "Pierre",
    candidateLastName: "Dubois",
    candidateEmail: "pierre.dubois@example.com",
    candidatePhone: "+33 6 12 34 56 78",
    jobTitle: "Head Chef",
    jobId: "job-321",
    coverLetter: "I am very interested in this Head Chef position. With 8 years of experience on superyachts ranging from 45m to 90m, I believe I would be an excellent fit for your client's vessel. I specialize in Mediterranean cuisine with a focus on fresh, local ingredients.",
    cvUrl: "https://lighthouse-careers.com/admin/candidates/456/cv",
    appliedAt: "2025-01-16T10:30:00Z",
  }))) sent++; else failed++;
  await delay(500);

  // 7. Inquiry Notification (contact form)
  if (await sendEmail("Inquiry Notification", inquiryNotificationEmail({
    name: "Robert Williams",
    email: "robert.williams@example.com",
    phone: "+44 7700 900123",
    company: "Mediterranean Charters Ltd",
    message: "We're looking to expand our fleet and will need crew for 3 new vessels. Can we discuss your recruitment services?",
    sourceUrl: "lighthouse-careers.com/hire-crew",
    position: "Multiple positions",
    location: "Monaco",
  }))) sent++; else failed++;
  await delay(500);

  // 8. Contact Confirmation (auto-reply)
  if (await sendEmail("Contact Confirmation", contactConfirmationEmail({
    name: "Jennifer Blake",
    subject: "Recruitment services inquiry",
  }))) sent++; else failed++;
  await delay(500);

  // 9. Hiring Request Confirmation (for leads/inquiries)
  if (await sendEmail("Hiring Request Confirmation", hiringRequestConfirmationEmail({
    name: "Victoria Chen",
    position: "Chief Stewardess",
    matchedCount: 12,
  }))) sent++; else failed++;
  await delay(500);

  // 10. Salary Guide Lead
  if (await sendEmail("Salary Guide Lead", salaryGuideLeadAdminEmail({
    email: "hiring.manager@yachtco.com",
    requestedAt: "2025-01-16T14:25:00Z",
  }))) sent++; else failed++;
  await delay(500);

  console.log("");
  console.log("=".repeat(60));
  console.log(`COMPLETE: ${sent} sent, ${failed} failed`);
  console.log("=".repeat(60));
  console.log("");
  console.log(`📬 Check your inbox at: ${TEST_EMAIL}`);
}

sendActiveTestEmails().catch(console.error);
