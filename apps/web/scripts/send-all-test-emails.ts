/**
 * Send All Test Emails Script
 *
 * Run with: npx tsx apps/web/scripts/send-all-test-emails.ts
 *
 * This script sends one of each email template type to verify they look correct.
 */

import { Resend } from "resend";
import {
  briefReceivedEmail,
  briefConvertedEmail,
  candidateShortlistedEmail,
  candidateSubmittedEmail,
  interviewScheduledEmail,
  interviewScheduledClientEmail,
  placementConfirmedEmail,
  referenceRequestEmail,
  welcomeClientEmail,
  welcomeCandidateEmail,
  clientPortalInviteEmail,
  clientMagicLinkEmail,
  employerWelcomeEmail,
  employerMagicLinkEmail,
  employerBriefReceivedEmail,
  employerEnquirySubmittedEmail,
  employerEnquiryAdminNotificationEmail,
  jobAlertEmail,
  inquiryNotificationEmail,
  documentRejectionEmail,
  subscriptionCancelledEmail,
  paymentFailedEmail,
  clientBriefNotificationEmail,
  interviewRequestNotificationEmail,
  placementNotificationEmail,
  newCandidateRegistrationAdminEmail,
  newApplicationAdminEmail,
  contactConfirmationEmail,
  salaryGuideLeadAdminEmail,
  yotspotImportNotificationEmail,
  initialJobMatchEmail,
} from "../lib/email/templates";

const RESEND_API_KEY = "re_5NDwqUAz_MtsUHC9Zr2UZ9awyvysneKkK";
const TEST_EMAIL = "seguelac@gmail.com";
const FROM_ADDRESS = "Lighthouse Careers <admin@notifications.lighthouse-careers.com>";

const resend = new Resend(RESEND_API_KEY);

// Helper to add delay between emails to avoid rate limiting
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

async function sendAllTestEmails() {
  console.log("=".repeat(60));
  console.log("SENDING ALL TEST EMAILS");
  console.log("=".repeat(60));
  console.log(`To: ${TEST_EMAIL}`);
  console.log(`From: ${FROM_ADDRESS}`);
  console.log("");

  let sent = 0;
  let failed = 0;

  // 1. Brief Received
  console.log("1. Client Emails");
  console.log("-".repeat(40));

  if (await sendEmail("Brief Received", briefReceivedEmail({
    clientName: "Sarah Mitchell",
    position: "Chief Stewardess",
    briefId: "brief-123",
  }))) sent++; else failed++;
  await delay(500);

  // 2. Brief Converted
  if (await sendEmail("Brief Converted", briefConvertedEmail({
    clientName: "Sarah Mitchell",
    position: "Chief Stewardess",
    vesselName: "M/Y Serenity",
    jobId: "job-456",
    candidateCount: 12,
  }))) sent++; else failed++;
  await delay(500);

  // 3. Candidate Shortlisted
  if (await sendEmail("Candidate Shortlisted", candidateShortlistedEmail({
    clientName: "James Hamilton",
    position: "Captain",
    vesselName: "M/Y Azure Dream",
    candidateCount: 5,
    shortlistLink: "https://lighthouse-careers.com/client/shortlist/abc123",
  }))) sent++; else failed++;
  await delay(500);

  // 4. Welcome Client
  if (await sendEmail("Welcome Client", welcomeClientEmail({
    clientName: "Victoria Chen",
    companyName: "Mediterranean Yacht Management",
  }))) sent++; else failed++;
  await delay(500);

  // 5. Client Portal Invite
  if (await sendEmail("Client Portal Invite", clientPortalInviteEmail({
    clientName: "Côte d'Azur Yachts",
    contactName: "Philippe Moreau",
    magicLink: "https://lighthouse-careers.com/client/auth?token=example123",
    expiresIn: "24 hours",
  }))) sent++; else failed++;
  await delay(500);

  // 6. Client Magic Link
  if (await sendEmail("Client Magic Link", clientMagicLinkEmail({
    clientName: "Mediterranean Yacht Management",
    magicLink: "https://lighthouse-careers.com/client/auth?token=example456",
    expiresIn: "1 hour",
  }))) sent++; else failed++;
  await delay(500);

  // 7. Interview Scheduled (Client)
  if (await sendEmail("Interview Scheduled (Client)", interviewScheduledClientEmail({
    clientContactName: "Captain Roberts",
    candidateName: "Emma Thompson",
    position: "Chief Stewardess",
    vesselName: "M/Y Oceanic",
    date: "Monday, January 20th, 2025",
    time: "10:00 AM CET",
    interviewType: "Video Call",
    meetingLink: "https://zoom.us/j/123456789",
  }))) sent++; else failed++;
  await delay(500);

  console.log("");
  console.log("2. Candidate Emails");
  console.log("-".repeat(40));

  // 8. Welcome Candidate
  if (await sendEmail("Welcome Candidate (Yacht)", welcomeCandidateEmail({
    candidateName: "Marco Rossi",
    position: "Deckhand",
    candidateType: "yacht_crew",
    dashboardLink: "https://lighthouse-careers.com/crew/dashboard",
  }))) sent++; else failed++;
  await delay(500);

  // 9. Welcome Candidate (Private Staff)
  if (await sendEmail("Welcome Candidate (Private Staff)", welcomeCandidateEmail({
    candidateName: "Sophie Laurent",
    position: "Private Chef",
    candidateType: "private_staff",
    dashboardLink: "https://lighthouse-careers.com/crew/dashboard",
  }))) sent++; else failed++;
  await delay(500);

  // 10. Candidate Submitted
  if (await sendEmail("Candidate Submitted", candidateSubmittedEmail({
    candidateName: "Alex Johnson",
    position: "Second Engineer",
    vesselName: "M/Y Horizon",
    clientName: "Horizon Marine",
  }))) sent++; else failed++;
  await delay(500);

  // 11. Interview Scheduled (Candidate)
  if (await sendEmail("Interview Scheduled (Candidate)", interviewScheduledEmail({
    candidateName: "Jessica Williams",
    position: "Junior Stewardess",
    vesselName: "M/Y Celestial",
    date: "Wednesday, January 22nd, 2025",
    time: "2:00 PM CET",
    location: "Video Call - Zoom",
    interviewerName: "Captain Michael Anderson",
    notes: "Please have your certificates ready to discuss and prepare questions about the upcoming season itinerary.",
  }))) sent++; else failed++;
  await delay(500);

  // 12. Placement Confirmed
  if (await sendEmail("Placement Confirmed", placementConfirmedEmail({
    candidateName: "David Chen",
    position: "Head Chef",
    vesselName: "M/Y Sapphire",
    startDate: "February 1st, 2025",
    salary: "€6,500/month",
    contractType: "Permanent",
  }))) sent++; else failed++;
  await delay(500);

  // 13. Reference Request
  if (await sendEmail("Reference Request", referenceRequestEmail({
    refereeName: "Captain Thomas Wright",
    candidateName: "Lisa Martinez",
    position: "Chief Stewardess",
    referenceLink: "https://lighthouse-careers.com/reference/provide/ref123",
  }))) sent++; else failed++;
  await delay(500);

  // 14. Job Alert
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

  // 15. Initial Job Match
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

  // 16. Document Rejection
  if (await sendEmail("Document Rejection", documentRejectionEmail({
    candidateName: "Michael Brown",
    documentType: "certification",
    documentName: "STCW Certificate.pdf",
    rejectionReason: "The document appears to be expired. Please upload a current, valid STCW certificate dated within the last 5 years.",
    dashboardLink: "https://lighthouse-careers.com/crew/documents",
  }))) sent++; else failed++;
  await delay(500);

  console.log("");
  console.log("3. Employer Portal Emails");
  console.log("-".repeat(40));

  // 17. Employer Welcome
  if (await sendEmail("Employer Welcome", employerWelcomeEmail({
    contactName: "Richard Thompson",
    email: "richard@example.com",
    magicLink: "https://lighthouse-careers.com/employer/auth?token=example789",
    hiringFor: "yacht",
    companyName: "Superyacht Management Co.",
  }))) sent++; else failed++;
  await delay(500);

  // 18. Employer Magic Link
  if (await sendEmail("Employer Magic Link", employerMagicLinkEmail({
    contactName: "Emily Davis",
    magicLink: "https://lighthouse-careers.com/employer/auth?token=example012",
    expiresIn: "1 hour",
  }))) sent++; else failed++;
  await delay(500);

  // 19. Employer Brief Received
  if (await sendEmail("Employer Brief Received", employerBriefReceivedEmail({
    contactName: "Charles Windsor",
    briefTitle: "Full Crew for 70m New Build",
    positions: ["Captain", "Chief Officer", "Chief Engineer", "Chief Stewardess", "Head Chef"],
    hiringFor: "yacht",
    vesselName: "M/Y Phoenix (New Build)",
    timeline: "3_months",
  }))) sent++; else failed++;
  await delay(500);

  // 20. Employer Enquiry Submitted (Referral)
  if (await sendEmail("Employer Enquiry Submitted", employerEnquirySubmittedEmail({
    referrerName: "Captain John Smith",
    companyName: "Blue Horizon Yachts",
    contactName: "Amanda Sterling",
  }))) sent++; else failed++;
  await delay(500);

  // 21. Employer Enquiry Admin Notification
  if (await sendEmail("Employer Enquiry Admin", employerEnquiryAdminNotificationEmail({
    referrerName: "Captain John Smith",
    referrerEmail: "captain.smith@example.com",
    companyName: "Blue Horizon Yachts",
    contactName: "Amanda Sterling",
    contactEmail: "amanda@bluehorizon.com",
    contactPhone: "+1 555 123 4567",
    notes: "Met them at the Monaco Yacht Show. They're looking to hire a full interior team for their new 55m build.",
    submittedAt: "January 16, 2025 at 10:30 AM",
  }))) sent++; else failed++;
  await delay(500);

  console.log("");
  console.log("4. Admin/Recruiter Notifications");
  console.log("-".repeat(40));

  // 22. Inquiry Notification
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

  // 23. New Candidate Registration Admin
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

  // 24. New Application Admin
  if (await sendEmail("New Application Admin", newApplicationAdminEmail({
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

  // 25. Client Brief Notification (Recruiter)
  if (await sendEmail("Client Brief Notification", clientBriefNotificationEmail({
    recruiterName: "Sarah",
    clientName: "M/Y Atlantis Management",
    position: "Chief Officer",
    vesselName: "M/Y Atlantis",
    vesselType: "Motor Yacht",
    vesselSize: 75,
    contractType: "permanent",
    startDate: "2025-02-15",
    briefId: "brief-456",
    dashboardLink: "https://lighthouse-careers.com/admin/briefs/brief-456",
  }))) sent++; else failed++;
  await delay(500);

  // 26. Interview Request Notification (Recruiter)
  if (await sendEmail("Interview Request Notification", interviewRequestNotificationEmail({
    recruiterName: "Sarah",
    clientName: "Captain Morrison",
    candidateName: "Laura Anderson",
    position: "2nd Stewardess",
    vesselName: "M/Y Sovereign",
    requestedType: "video",
    preferredDates: [
      { start: "2025-01-20T10:00:00Z", end: "2025-01-20T11:00:00Z" },
      { start: "2025-01-21T14:00:00Z", end: "2025-01-21T15:00:00Z" },
    ],
    notes: "Would prefer morning slots if possible. Please have her prepare a brief introduction about her service experience.",
    dashboardLink: "https://lighthouse-careers.com/admin/interviews/int-123",
  }))) sent++; else failed++;
  await delay(500);

  // 27. Placement Notification (Recruiter)
  if (await sendEmail("Placement Notification", placementNotificationEmail({
    recruiterName: "Sarah",
    clientName: "Aegean Yacht Services",
    candidateName: "Marcus Webb",
    position: "Bosun",
    vesselName: "M/Y Odyssey",
    startDate: "2025-02-01",
    salary: 5500,
    salaryCurrency: "EUR",
    salaryPeriod: "month",
    dashboardLink: "https://lighthouse-careers.com/admin/placements/pl-789",
  }))) sent++; else failed++;
  await delay(500);

  // 28. Salary Guide Lead Admin
  if (await sendEmail("Salary Guide Lead", salaryGuideLeadAdminEmail({
    email: "hiring.manager@yachtco.com",
    requestedAt: "2025-01-16T14:25:00Z",
  }))) sent++; else failed++;
  await delay(500);

  // 29. Contact Confirmation
  if (await sendEmail("Contact Confirmation", contactConfirmationEmail({
    name: "Jennifer Blake",
    subject: "Recruitment services inquiry",
  }))) sent++; else failed++;
  await delay(500);

  console.log("");
  console.log("5. Payment & Subscription Emails");
  console.log("-".repeat(40));

  // 30. Subscription Cancelled
  if (await sendEmail("Subscription Cancelled", subscriptionCancelledEmail({
    contactName: "George Harrison",
    companyName: "Harrison Marine",
    planName: "Professional",
    endDate: "February 15, 2025",
  }))) sent++; else failed++;
  await delay(500);

  // 31. Payment Failed
  if (await sendEmail("Payment Failed", paymentFailedEmail({
    contactName: "Patricia Moore",
    companyName: "Moore Yachts Ltd",
    amount: "299",
    currency: "€",
    failureReason: "Card declined - insufficient funds",
    retryDate: "January 20, 2025",
    updatePaymentLink: "https://lighthouse-careers.com/account/billing",
  }))) sent++; else failed++;
  await delay(500);

  console.log("");
  console.log("6. Integration Emails");
  console.log("-".repeat(40));

  // 32. Yotspot Import Notification
  if (await sendEmail("Yotspot Import Notification", yotspotImportNotificationEmail({
    candidateName: "Oliver Martinez",
    candidatePosition: "Deckhand",
    candidateEmail: "oliver.martinez@example.com",
    candidatePhone: "+34 612 345 678",
    jobTitle: "Junior Deckhand",
    jobRef: "JD-2025-001",
    matchScore: 87,
    matchAssessment: "Strong candidate with relevant experience on similar-sized vessels. STCW and Powerboat Level 2 certificates are current. Previous experience in the Mediterranean aligns well with vessel's cruising grounds.",
    strengths: [
      "3 years experience on 50m+ motor yachts",
      "Current STCW, ENG1, and Powerboat Level 2",
      "Fluent in English and Spanish",
      "Available immediately",
    ],
    concerns: [
      "No sailing yacht experience (vessel is motor yacht, so not critical)",
      "Limited experience with tenders over 6m",
    ],
    candidateProfileUrl: "https://lighthouse-careers.com/admin/candidates/789",
    jobUrl: "https://lighthouse-careers.com/admin/jobs/job-xyz",
    yotspotUrl: "https://yotspot.com/candidates/oliver-martinez",
  }))) sent++; else failed++;
  await delay(500);

  console.log("");
  console.log("=".repeat(60));
  console.log(`COMPLETE: ${sent} sent, ${failed} failed`);
  console.log("=".repeat(60));
  console.log("");
  console.log(`📬 Check your inbox at: ${TEST_EMAIL}`);
}

sendAllTestEmails().catch(console.error);
