import { baseTemplate, generatePlainText } from "./base";

// Email template types
export type EmailTemplate =
  | "brief_received"
  | "brief_converted"
  | "candidate_shortlisted"
  | "candidate_submitted"
  | "interview_scheduled"
  | "interview_scheduled_client"
  | "interview_reminder"
  | "placement_confirmed"
  | "reference_request"
  | "welcome_client"
  | "welcome_candidate"
  | "client_portal_invite"
  | "client_magic_link"
  | "employer_welcome"
  | "employer_magic_link"
  | "employer_brief_received"
  | "employer_enquiry_submitted"
  | "employer_enquiry_admin_notification"
  | "job_alert";

// Template data types
export interface BriefReceivedData {
  clientName: string;
  position: string;
  briefId: string;
}

export interface BriefConvertedData {
  clientName: string;
  position: string;
  vesselName: string;
  jobId: string;
  candidateCount: number;
}

export interface CandidateShortlistedData {
  clientName: string;
  position: string;
  vesselName: string;
  candidateCount: number;
  shortlistLink: string;
}

export interface CandidateSubmittedData {
  candidateName: string;
  position: string;
  vesselName: string;
  clientName: string;
}

export interface InterviewScheduledData {
  candidateName: string;
  position: string;
  vesselName: string;
  date: string;
  time: string;
  location?: string;
  interviewerName?: string;
  notes?: string;
}

export interface PlacementConfirmedData {
  candidateName: string;
  position: string;
  vesselName: string;
  startDate: string;
  salary: string;
  contractType: string;
}

export interface ReferenceRequestData {
  refereeName: string;
  candidateName: string;
  position: string;
  referenceLink: string;
}

export interface WelcomeClientData {
  clientName: string;
  companyName?: string;
}

export interface WelcomeCandidateData {
  candidateName: string;
  position?: string;
  candidateType?: "yacht_crew" | "private_staff";
  dashboardLink?: string;
}

export interface ClientPortalInviteData {
  clientName: string;
  contactName?: string;
  magicLink: string;
  expiresIn?: string;
}

export interface ClientMagicLinkData {
  clientName: string;
  magicLink: string;
  expiresIn?: string;
}

export interface InterviewScheduledClientData {
  clientContactName: string;
  candidateName: string;
  position: string;
  vesselName: string;
  date: string;
  time: string;
  location?: string;
  meetingLink?: string;
  interviewType?: string;
}

// Employer email template data types
export interface EmployerWelcomeData {
  contactName: string;
  email: string;
  magicLink: string;
  hiringFor?: "yacht" | "household" | "both";
  companyName?: string;
}

export interface EmployerMagicLinkData {
  contactName: string;
  magicLink: string;
  expiresIn?: string;
}

export interface EmployerBriefReceivedData {
  contactName: string;
  briefTitle: string;
  positions: string[];
  hiringFor: "yacht" | "household" | "both";
  vesselName?: string;
  propertyLocation?: string;
  timeline?: string;
}

// Employer Enquiry (Referral) email data types
export interface EmployerEnquirySubmittedData {
  referrerName: string;
  companyName: string;
  contactName: string;
}

export interface EmployerEnquiryAdminNotificationData {
  referrerName: string;
  referrerEmail: string;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  submittedAt: string;
}

// Template generators
export function briefReceivedEmail(data: BriefReceivedData) {
  const content = `
    <h1>We've received your brief!</h1>
    <p>Hi ${data.clientName},</p>
    <p>Thank you for submitting your requirements for a <strong>${data.position}</strong> position. Our team is now reviewing your brief and will begin sourcing suitable candidates immediately.</p>

    <div class="info-box">
      <p style="margin:0; font-weight:600; color:#1a2b4a;">What happens next?</p>
      <ul style="margin-top:10px;">
        <li>Our AI will analyze your requirements</li>
        <li>We'll match candidates from our verified database</li>
        <li>You'll receive a shortlist within 24-48 hours</li>
      </ul>
    </div>

    <p>If you have any additional requirements or questions, simply reply to this email.</p>

    <p>Best regards,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Brief Received: ${data.position} Position`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function briefConvertedEmail(data: BriefConvertedData) {
  const content = `
    <h1>Your brief is now live!</h1>
    <p>Hi ${data.clientName},</p>
    <p>Great news! We've processed your brief and created a job listing for the <strong>${data.position}</strong> position on <strong>${data.vesselName}</strong>.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Position</span>
        <span class="info-value">${data.position}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Vessel</span>
        <span class="info-value">${data.vesselName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Potential Matches</span>
        <span class="info-value">${data.candidateCount} candidates</span>
      </div>
    </div>

    <p>Our team is now working on creating a shortlist of the best candidates for you.</p>

    <p>Best regards,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Job Created: ${data.position} on ${data.vesselName}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function candidateShortlistedEmail(data: CandidateShortlistedData) {
  const content = `
    <h1>Your candidate shortlist is ready!</h1>
    <p>Hi ${data.clientName},</p>
    <p>We've prepared a shortlist of <strong class="highlight">${data.candidateCount} candidates</strong> for the <strong>${data.position}</strong> position on <strong>${data.vesselName}</strong>.</p>

    <p style="text-align:center;">
      <a href="${data.shortlistLink}" class="button">View Shortlist</a>
    </p>

    <p>Each candidate profile includes:</p>
    <ul>
      <li>Professional summary and experience</li>
      <li>Certifications and qualifications</li>
      <li>Verified references</li>
      <li>AI-powered match assessment</li>
    </ul>

    <p>Review the profiles and let us know which candidates you'd like to interview.</p>

    <p>Best regards,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Shortlist Ready: ${data.candidateCount} Candidates for ${data.position}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function candidateSubmittedEmail(data: CandidateSubmittedData) {
  const content = `
    <h1>You've been submitted!</h1>
    <p>Hi ${data.candidateName},</p>
    <p>Great news! Your profile has been submitted for the <strong>${data.position}</strong> position on <strong>${data.vesselName}</strong>.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Position</span>
        <span class="info-value">${data.position}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Vessel</span>
        <span class="info-value">${data.vesselName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client</span>
        <span class="info-value">${data.clientName}</span>
      </div>
    </div>

    <p><strong>What happens next?</strong></p>
    <ul>
      <li>The client will review your profile</li>
      <li>If selected, we'll arrange an interview</li>
      <li>We'll keep you updated every step of the way</li>
    </ul>

    <p>Make sure your profile is up to date and your phone is on!</p>

    <p>Best of luck,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Submitted: ${data.position} on ${data.vesselName}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function interviewScheduledEmail(data: InterviewScheduledData) {
  const content = `
    <h1>Interview Scheduled!</h1>
    <p>Hi ${data.candidateName},</p>
    <p>Congratulations! You have an interview scheduled for the <strong>${data.position}</strong> position on <strong>${data.vesselName}</strong>.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${data.date}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${data.time}</span>
      </div>
      ${data.location ? `
      <div class="info-row">
        <span class="info-label">Location</span>
        <span class="info-value">${data.location}</span>
      </div>
      ` : ""}
      ${data.interviewerName ? `
      <div class="info-row">
        <span class="info-label">Interviewer</span>
        <span class="info-value">${data.interviewerName}</span>
      </div>
      ` : ""}
    </div>

    ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}

    <p><strong>Preparation tips:</strong></p>
    <ul>
      <li>Review the yacht's recent itinerary</li>
      <li>Prepare questions about the role and crew</li>
      <li>Have your certifications ready to discuss</li>
      <li>Test your video/audio if it's a video call</li>
    </ul>

    <p>Please confirm your attendance by replying to this email.</p>

    <p>Good luck!<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Interview: ${data.position} on ${data.vesselName} - ${data.date}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function placementConfirmedEmail(data: PlacementConfirmedData) {
  const content = `
    <h1>Congratulations on your placement!</h1>
    <p>Hi ${data.candidateName},</p>
    <p>We're thrilled to confirm that you've been selected for the <strong>${data.position}</strong> position on <strong>${data.vesselName}</strong>!</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Position</span>
        <span class="info-value">${data.position}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Vessel</span>
        <span class="info-value">${data.vesselName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Start Date</span>
        <span class="info-value">${data.startDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Salary</span>
        <span class="info-value">${data.salary}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contract</span>
        <span class="info-value">${data.contractType}</span>
      </div>
    </div>

    <p><strong>Next steps:</strong></p>
    <ul>
      <li>You'll receive your contract for review</li>
      <li>Complete any outstanding medical or visa requirements</li>
      <li>We'll provide joining instructions closer to your start date</li>
    </ul>

    <p>Congratulations again, and thank you for choosing Lighthouse Crew!</p>

    <p>Best regards,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Congratulations! Placement Confirmed: ${data.position} on ${data.vesselName}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function referenceRequestEmail(data: ReferenceRequestData) {
  const content = `
    <h1>Reference Request</h1>
    <p>Hi ${data.refereeName},</p>
    <p><strong>${data.candidateName}</strong> has listed you as a professional reference for a <strong>${data.position}</strong> position they're applying for.</p>

    <p>Could you please take a few minutes to provide a reference? Your feedback is invaluable in helping us match the right candidates with the right positions.</p>

    <p style="text-align:center;">
      <a href="${data.referenceLink}" class="button">Provide Reference</a>
    </p>

    <p>Alternatively, you can reply directly to this email with your feedback, or call us to provide a verbal reference.</p>

    <p>Your reference will be kept confidential and used solely for the purpose of this application.</p>

    <p>Thank you for your time,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Reference Request for ${data.candidateName}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function welcomeClientEmail(data: WelcomeClientData) {
  const content = `
    <h1>Welcome to Lighthouse Crew!</h1>
    <p>Hi ${data.clientName},</p>
    <p>Thank you for choosing Lighthouse Crew as your yacht crew recruitment partner${data.companyName ? ` for ${data.companyName}` : ""}.</p>

    <p>We're excited to help you find exceptional crew members for your vessel. Here's what you can expect:</p>

    <ul>
      <li><strong>AI-Powered Matching:</strong> Our technology analyzes your requirements to find the perfect candidates</li>
      <li><strong>Verified Candidates:</strong> All crew in our database are verified with checked references</li>
      <li><strong>Fast Turnaround:</strong> Receive shortlists within 24-48 hours</li>
      <li><strong>Industry Expertise:</strong> Our team has decades of combined superyacht experience</li>
    </ul>

    <p><strong>Ready to get started?</strong></p>
    <p>Simply send us your requirements via email, WhatsApp, or our platform, and we'll handle the rest.</p>

    <p>Welcome aboard,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: "Welcome to Lighthouse Crew!",
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function welcomeCandidateEmail(data: WelcomeCandidateData) {
  const dashboardLink = data.dashboardLink || "https://lighthouse-careers.com/crew/dashboard";
  const industryText = data.candidateType === "private_staff"
    ? "private household staff"
    : data.candidateType === "yacht_crew"
      ? "yacht crew"
      : "luxury industry";

  const content = `
    <h1>Welcome to Lighthouse Careers!</h1>
    <p>Hi ${data.candidateName},</p>
    <p>Congratulations on joining the Lighthouse Careers network! We're thrilled to have you as part of our community of exceptional ${industryText} professionals.</p>

    <p style="text-align:center;">
      <a href="${dashboardLink}" class="button">Go to Your Dashboard</a>
    </p>

    <div class="info-box">
      <p style="margin:0 0 15px; font-weight:600; color:#1a2b4a;">Get started in 3 simple steps:</p>
      <ul style="margin:0;">
        <li><strong>Complete your profile</strong>, add your experience, certifications, and a professional photo</li>
        <li><strong>Upload your documents</strong>, CV, certificates, and references help you stand out</li>
        <li><strong>Set your preferences</strong>, tell us what you're looking for so we can match you perfectly</li>
      </ul>
    </div>

    <h2>Why Lighthouse Careers?</h2>
    <ul>
      <li><span class="highlight">AI-powered matching</span> connects you with opportunities that fit your skills${data.position ? ` as a ${data.position}` : ""}</li>
      <li><strong>Exclusive positions</strong> from leading yachts and private households worldwide</li>
      <li><strong>Dedicated support</strong> from recruiters who understand the industry</li>
      <li><strong>Career resources</strong> including salary guides and professional development</li>
    </ul>

    <div class="divider"></div>

    <p><strong>What happens next?</strong></p>
    <p>Our team is already reviewing your profile. When opportunities match your skills and preferences, we'll be in touch. In the meantime, make sure your profile is complete, candidates with complete profiles are <strong>3x more likely</strong> to be shortlisted.</p>

    <p>Questions? Simply reply to this email, we're here to help you succeed.</p>

    <p>Welcome aboard,<br>The Lighthouse Careers Team</p>
  `;

  return {
    subject: "Welcome to Lighthouse Careers!",
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function clientPortalInviteEmail(data: ClientPortalInviteData) {
  const greeting = data.contactName ? `Hi ${data.contactName}` : `Hi there`;
  const expiresText = data.expiresIn || "24 hours";

  const content = `
    <h1>You're Invited to the Client Portal</h1>
    <p>${greeting},</p>
    <p>You've been invited to access the <strong>${data.clientName}</strong> client portal on Lighthouse Crew.</p>

    <p>The client portal gives you direct access to:</p>
    <ul>
      <li><strong>View candidate shortlists</strong> prepared by our team</li>
      <li><strong>Provide feedback</strong> on candidates</li>
      <li><strong>Request interviews</strong> with a single click</li>
      <li><strong>Track your active searches</strong> in real-time</li>
    </ul>

    <p style="text-align:center;">
      <a href="${data.magicLink}" class="button">Access Portal</a>
    </p>

    <p style="font-size: 13px; color: #6b7280;">This link expires in ${expiresText}. If you didn't request this access, you can safely ignore this email.</p>

    <p>Welcome aboard,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `You're Invited: ${data.clientName} Client Portal`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function clientMagicLinkEmail(data: ClientMagicLinkData) {
  const expiresText = data.expiresIn || "1 hour";

  const content = `
    <h1>Sign in to Lighthouse Crew</h1>
    <p>Hi there,</p>
    <p>Click the button below to sign in to the <strong>${data.clientName}</strong> client portal.</p>

    <p style="text-align:center;">
      <a href="${data.magicLink}" class="button">Sign In</a>
    </p>

    <p style="font-size: 13px; color: #6b7280;">This link expires in ${expiresText}. If you didn't request this link, you can safely ignore this email.</p>

    <div class="divider"></div>

    <p style="font-size: 13px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: #6b7280;">${data.magicLink}</p>

    <p>Best regards,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: "Sign in to Lighthouse Crew",
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function interviewScheduledClientEmail(data: InterviewScheduledClientData) {
  const interviewType = data.interviewType || "Interview";

  const content = `
    <h1>Interview Scheduled</h1>
    <p>Hi ${data.clientContactName},</p>
    <p>An interview has been scheduled for the <strong>${data.position}</strong> position on <strong>${data.vesselName}</strong>.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Candidate</span>
        <span class="info-value">${data.candidateName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Position</span>
        <span class="info-value">${data.position}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${data.date}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${data.time}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type</span>
        <span class="info-value">${interviewType}</span>
      </div>
      ${data.location ? `
      <div class="info-row">
        <span class="info-label">Location</span>
        <span class="info-value">${data.location}</span>
      </div>
      ` : ""}
    </div>

    ${data.meetingLink ? `
    <p style="text-align:center;">
      <a href="${data.meetingLink}" class="button">Join ${interviewType}</a>
    </p>
    ` : ""}

    <p>The candidate has been notified and will be prepared for the interview. If you need to reschedule, please let us know as soon as possible.</p>

    <p>Best regards,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Interview Scheduled: ${data.candidateName} for ${data.position}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Employer Portal Email Templates
// ============================================

export function employerWelcomeEmail(data: EmployerWelcomeData) {
  const hiringForText =
    data.hiringFor === "yacht"
      ? "yacht crew"
      : data.hiringFor === "household"
        ? "private staff"
        : "yacht crew and private staff";

  const content = `
    <h1>Welcome to Lighthouse!</h1>
    <p>Hi ${data.contactName},</p>
    <p>Thank you for registering with Lighthouse Crew${data.companyName ? ` on behalf of ${data.companyName}` : ""}. We're excited to help you find exceptional ${hiringForText}.</p>

    <p style="text-align:center;">
      <a href="${data.magicLink}" class="button">Access Your Portal</a>
    </p>

    <div class="info-box">
      <p style="margin:0 0 15px; font-weight:600; color:#1a2b4a;">Here's how it works:</p>
      <ul style="margin:0;">
        <li><strong>Submit a brief</strong>, tell us exactly what you're looking for</li>
        <li><strong>We match candidates</strong>, our AI and expert team find the best fits</li>
        <li><strong>Review your shortlist</strong>, see verified candidates matched to your needs</li>
        <li><strong>Interview & hire</strong>, we coordinate everything seamlessly</li>
      </ul>
    </div>

    <p><strong>What sets us apart:</strong></p>
    <ul>
      <li><span class="highlight">AI-powered matching</span> for faster, more accurate results</li>
      <li>All candidates are <span class="highlight">reference-checked and verified</span></li>
      <li>Dedicated support from experienced industry professionals</li>
      <li>Transparent process with real-time updates</li>
    </ul>

    <p>Questions? Simply reply to this email, we're here to help.</p>

    <p>Welcome aboard,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: "Welcome to Lighthouse Crew!",
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function employerMagicLinkEmail(data: EmployerMagicLinkData) {
  const expiresText = data.expiresIn || "1 hour";

  const content = `
    <h1>Sign in to Lighthouse</h1>
    <p>Hi ${data.contactName},</p>
    <p>Click the button below to sign in to your employer portal.</p>

    <p style="text-align:center;">
      <a href="${data.magicLink}" class="button">Sign In</a>
    </p>

    <p style="font-size: 13px; color: #6b7280;">This link expires in ${expiresText}. If you didn't request this link, you can safely ignore this email.</p>

    <div class="divider"></div>

    <p style="font-size: 13px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 12px; word-break: break-all; color: #6b7280;">${data.magicLink}</p>

    <p>Best regards,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: "Sign in to Lighthouse",
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function employerBriefReceivedEmail(data: EmployerBriefReceivedData) {
  const positionsList = data.positions.slice(0, 3).join(", ");
  const morePositions = data.positions.length > 3 ? ` +${data.positions.length - 3} more` : "";

  const timelineText = {
    immediate: "Immediately",
    "1_month": "Within 1 month",
    "3_months": "1-3 months",
    exploring: "Just exploring",
  }[data.timeline || ""] || data.timeline;

  const content = `
    <h1>Brief Received!</h1>
    <p>Hi ${data.contactName},</p>
    <p>Thank you for submitting your hiring brief. Our team is now reviewing your requirements and will begin matching candidates right away.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Brief</span>
        <span class="info-value">${data.briefTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Positions</span>
        <span class="info-value">${positionsList}${morePositions}</span>
      </div>
      ${data.vesselName ? `
      <div class="info-row">
        <span class="info-label">Vessel</span>
        <span class="info-value">${data.vesselName}</span>
      </div>
      ` : ""}
      ${data.propertyLocation ? `
      <div class="info-row">
        <span class="info-label">Location</span>
        <span class="info-value">${data.propertyLocation}</span>
      </div>
      ` : ""}
      ${timelineText ? `
      <div class="info-row">
        <span class="info-label">Timeline</span>
        <span class="info-value">${timelineText}</span>
      </div>
      ` : ""}
    </div>

    <p><strong>What happens next?</strong></p>
    <ul>
      <li>Our AI analyzes your requirements against our candidate database</li>
      <li>An experienced recruiter reviews the matches</li>
      <li>You'll receive a curated shortlist within <strong>24-48 hours</strong></li>
      <li>Review candidates and provide feedback directly in your portal</li>
    </ul>

    <p>We'll notify you as soon as your shortlist is ready. In the meantime, you can track progress in your portal.</p>

    <p>Best regards,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Brief Received: ${data.briefTitle}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Employer Enquiry (Referral) Email Templates
// ============================================

export function employerEnquirySubmittedEmail(data: EmployerEnquirySubmittedData) {
  const content = `
    <h1>Thank You for Your Referral!</h1>
    <p>Hi ${data.referrerName},</p>
    <p>We've received your employer lead for <strong>${data.companyName}</strong> (Contact: ${data.contactName}). Thank you for thinking of us!</p>

    <div class="info-box">
      <p style="margin:0 0 15px; font-weight:600; color:#1a2b4a;">What happens next?</p>
      <ul style="margin:0;">
        <li>Our team will review the lead within <strong>24-48 hours</strong></li>
        <li>We'll reach out to the contact you provided</li>
        <li>If they become a client and we make a placement, you'll earn <strong class="highlight">€200</strong></li>
        <li>Plus, they get <strong>15% off</strong> their first placement as a new client!</li>
      </ul>
    </div>

    <p>We'll keep you updated on the status of this lead. In the meantime, keep the referrals coming, there's no limit!</p>

    <p>Thank you for being part of the Lighthouse network,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `Lead Received: ${data.companyName}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export function employerEnquiryAdminNotificationEmail(data: EmployerEnquiryAdminNotificationData) {
  const contactInfo = [
    data.contactEmail ? `Email: ${data.contactEmail}` : null,
    data.contactPhone ? `Phone: ${data.contactPhone}` : null,
  ].filter(Boolean).join(" | ");

  const content = `
    <h1>New Employer Lead Submitted</h1>
    <p>A crew member has submitted a new employer referral that needs review.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Referred By</span>
        <span class="info-value">${data.referrerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Referrer Email</span>
        <span class="info-value">${data.referrerEmail}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Company/Yacht</span>
        <span class="info-value">${data.companyName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact Person</span>
        <span class="info-value">${data.contactName}</span>
      </div>
      ${contactInfo ? `
      <div class="info-row">
        <span class="info-label">Contact Info</span>
        <span class="info-value">${contactInfo}</span>
      </div>
      ` : ""}
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${data.submittedAt}</span>
      </div>
    </div>

    ${data.notes ? `
    <h2>Additional Notes</h2>
    <p style="background:#f8f9fa; padding:15px; border-radius:8px; font-style:italic;">${data.notes}</p>
    ` : ""}

    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Review the lead in the admin panel</li>
      <li>Reach out to the contact to assess their hiring needs</li>
      <li>Update the lead status once contact is made</li>
      <li>Remember: if this becomes a client placement, the referrer earns €200!</li>
    </ul>

    <p style="font-size:13px; color:#6b7280;">This is an automated notification from the Lighthouse Crew referral system.</p>
  `;

  return {
    subject: `New Employer Lead: ${data.companyName} (Referred by ${data.referrerName})`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Job Alert Email Templates
// ============================================

export interface JobAlertData {
  candidateName: string;
  jobTitle: string;
  jobId: string;
  vesselName?: string;
  vesselType?: string;
  vesselSize?: number;
  contractType?: string;
  primaryRegion?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  startDate?: string;
  benefits?: string;
  matchedPosition: string;
  dashboardLink: string;
}

export function jobAlertEmail(data: JobAlertData) {
  // Format salary display
  const formatSalary = () => {
    if (!data.salaryMin && !data.salaryMax) return null;
    const currency = data.salaryCurrency || "EUR";
    const period = data.salaryPeriod || "month";
    const currencySymbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "USD" ? "$" : currency;

    if (data.salaryMin && data.salaryMax) {
      return `${currencySymbol}${data.salaryMin.toLocaleString()} - ${currencySymbol}${data.salaryMax.toLocaleString()} per ${period}`;
    }
    if (data.salaryMin) {
      return `From ${currencySymbol}${data.salaryMin.toLocaleString()} per ${period}`;
    }
    return `Up to ${currencySymbol}${data.salaryMax?.toLocaleString()} per ${period}`;
  };

  const salary = formatSalary();

  // Format vessel info
  const vesselInfo = [
    data.vesselName,
    data.vesselType,
    data.vesselSize ? `${data.vesselSize}m` : null,
  ].filter(Boolean).join(" • ");

  // Format start date
  const formattedStartDate = data.startDate
    ? new Date(data.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const content = `
    <h1>New Job Matching Your Profile!</h1>
    <p>Hi ${data.candidateName},</p>
    <p>Great news! A new <strong>${data.jobTitle}</strong> position has been posted that matches your job preferences as a <strong class="highlight">${data.matchedPosition}</strong>.</p>

    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #c9a962;">
      <h2 style="margin: 0 0 20px; color: #1a2b4a; font-size: 20px;">${data.jobTitle}</h2>

      ${vesselInfo ? `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="color: #6b7280; min-width: 24px; margin-right: 10px;">⛵</span>
        <span style="color: #374151; font-weight: 500;">${vesselInfo}</span>
      </div>
      ` : ""}

      ${data.primaryRegion ? `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="color: #6b7280; min-width: 24px; margin-right: 10px;">📍</span>
        <span style="color: #374151;">${data.primaryRegion}</span>
      </div>
      ` : ""}

      ${data.contractType ? `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="color: #6b7280; min-width: 24px; margin-right: 10px;">📋</span>
        <span style="color: #374151;">${data.contractType.charAt(0).toUpperCase() + data.contractType.slice(1)} Contract</span>
      </div>
      ` : ""}

      ${formattedStartDate ? `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="color: #6b7280; min-width: 24px; margin-right: 10px;">📅</span>
        <span style="color: #374151;">Start: ${formattedStartDate}</span>
      </div>
      ` : ""}

      ${salary ? `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="color: #6b7280; min-width: 24px; margin-right: 10px;">💰</span>
        <span style="color: #374151; font-weight: 600;">${salary}</span>
      </div>
      ` : ""}

      ${data.benefits ? `
      <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
        <span style="color: #6b7280; min-width: 24px; margin-right: 10px;">✨</span>
        <span style="color: #374151; font-size: 14px;">${data.benefits}</span>
      </div>
      ` : ""}
    </div>

    <p style="text-align: center;">
      <a href="${data.dashboardLink}" class="button">View Job & Apply</a>
    </p>

    <div class="divider"></div>

    <p style="font-size: 14px; color: #6b7280;">
      <strong>Why did I receive this?</strong><br>
      This job matches your ${data.matchedPosition} position preference. You can update your job preferences or disable job alerts in your <a href="${data.dashboardLink.replace(/\/jobs\/.*$/, "/preferences")}" style="color: #c9a962;">candidate dashboard</a>.
    </p>

    <p>Good luck with your application!<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: `New ${data.jobTitle} Position${data.vesselName ? ` on ${data.vesselName}` : ""} - Matches Your Profile!`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Inquiry Notification Email Templates
// ============================================

export interface InquiryNotificationData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  sourceUrl?: string;
  position?: string;
  location?: string;
}

export function inquiryNotificationEmail(data: InquiryNotificationData) {
  const content = `
    <h1>New Inquiry Received</h1>
    <p>A new lead has been submitted through the website.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Name</span>
        <span class="info-value">${data.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value"><a href="mailto:${data.email}">${data.email}</a></span>
      </div>
      ${data.phone ? `
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value"><a href="tel:${data.phone}">${data.phone}</a></span>
      </div>
      ` : ""}
      ${data.company ? `
      <div class="info-row">
        <span class="info-label">Company</span>
        <span class="info-value">${data.company}</span>
      </div>
      ` : ""}
      ${data.position ? `
      <div class="info-row">
        <span class="info-label">Position Needed</span>
        <span class="info-value">${data.position}</span>
      </div>
      ` : ""}
      ${data.location ? `
      <div class="info-row">
        <span class="info-label">Location</span>
        <span class="info-value">${data.location}</span>
      </div>
      ` : ""}
      ${data.sourceUrl ? `
      <div class="info-row">
        <span class="info-label">Source</span>
        <span class="info-value">${data.sourceUrl}</span>
      </div>
      ` : ""}
    </div>

    ${data.message ? `
    <h2>Message</h2>
    <p style="background:#f8f9fa; padding:15px; border-radius:8px; white-space:pre-wrap;">${data.message}</p>
    ` : ""}

    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Review and qualify the lead</li>
      <li>Respond within 24 hours</li>
      <li>Log the interaction in the CRM</li>
    </ul>

    <p style="font-size:13px; color:#6b7280;">This is an automated notification from the Lighthouse website.</p>
  `;

  return {
    subject: `New Inquiry: ${data.name}${data.position ? ` - ${data.position}` : ""}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Document Rejection Email Templates
// ============================================

export interface DocumentRejectionData {
  candidateName: string;
  documentType: string;
  documentName: string;
  rejectionReason: string;
  dashboardLink: string;
}

export function documentRejectionEmail(data: DocumentRejectionData) {
  const documentTypeLabel = {
    cv: "CV/Resume",
    certification: "Certification",
    id: "ID Document",
    reference: "Reference",
    other: "Document",
  }[data.documentType] || data.documentType;

  const content = `
    <h1>Document Requires Attention</h1>
    <p>Hi ${data.candidateName},</p>
    <p>We've reviewed your uploaded <strong>${documentTypeLabel}</strong> and unfortunately it couldn't be approved at this time.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Document</span>
        <span class="info-value">${data.documentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type</span>
        <span class="info-value">${documentTypeLabel}</span>
      </div>
    </div>

    <h2>Reason for Rejection</h2>
    <p style="background:#fef2f2; padding:15px; border-radius:8px; border-left:4px solid #ef4444;">${data.rejectionReason}</p>

    <p><strong>What to do next:</strong></p>
    <ul>
      <li>Review the feedback above</li>
      <li>Prepare an updated version of the document</li>
      <li>Upload the new version through your dashboard</li>
    </ul>

    <p style="text-align:center;">
      <a href="${data.dashboardLink}" class="button">Go to Dashboard</a>
    </p>

    <p>If you have any questions about the requirements, please reply to this email.</p>

    <p>Best regards,<br>The Lighthouse Careers Team</p>
  `;

  return {
    subject: `Action Required: ${documentTypeLabel} Needs Attention`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Payment Notification Email Templates
// ============================================

export interface SubscriptionCancelledData {
  contactName: string;
  companyName?: string;
  planName: string;
  endDate: string;
}

export function subscriptionCancelledEmail(data: SubscriptionCancelledData) {
  const content = `
    <h1>Subscription Cancelled</h1>
    <p>Hi ${data.contactName},</p>
    <p>Your ${data.planName} subscription${data.companyName ? ` for ${data.companyName}` : ""} has been cancelled.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Plan</span>
        <span class="info-value">${data.planName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Access Until</span>
        <span class="info-value">${data.endDate}</span>
      </div>
    </div>

    <p>You'll continue to have access to all features until ${data.endDate}. After that, your account will be downgraded to the free tier.</p>

    <p><strong>What you'll lose access to:</strong></p>
    <ul>
      <li>Priority candidate matching</li>
      <li>Advanced search filters</li>
      <li>Dedicated support</li>
      <li>Premium features</li>
    </ul>

    <p>Changed your mind? You can reactivate your subscription at any time before ${data.endDate} to maintain uninterrupted access.</p>

    <p>We're sorry to see you go. If there's anything we could have done better, we'd love to hear your feedback.</p>

    <p>Best regards,<br>The Lighthouse Careers Team</p>
  `;

  return {
    subject: "Your Lighthouse Subscription Has Been Cancelled",
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

export interface PaymentFailedData {
  contactName: string;
  companyName?: string;
  amount: string;
  currency: string;
  failureReason?: string;
  retryDate?: string;
  updatePaymentLink: string;
}

export function paymentFailedEmail(data: PaymentFailedData) {
  const content = `
    <h1>Payment Failed</h1>
    <p>Hi ${data.contactName},</p>
    <p>We were unable to process your payment of <strong>${data.currency}${data.amount}</strong>${data.companyName ? ` for ${data.companyName}` : ""}.</p>

    ${data.failureReason ? `
    <div style="background:#fef2f2; padding:15px; border-radius:8px; border-left:4px solid #ef4444; margin: 20px 0;">
      <strong>Reason:</strong> ${data.failureReason}
    </div>
    ` : ""}

    <p><strong>What to do:</strong></p>
    <ul>
      <li>Check that your card details are correct and up to date</li>
      <li>Ensure sufficient funds are available</li>
      <li>Contact your bank if the issue persists</li>
    </ul>

    <p style="text-align:center;">
      <a href="${data.updatePaymentLink}" class="button">Update Payment Method</a>
    </p>

    ${data.retryDate ? `
    <p style="font-size:13px; color:#6b7280;">We'll automatically retry the payment on ${data.retryDate}. To avoid service interruption, please update your payment method before then.</p>
    ` : ""}

    <p>If you need assistance, reply to this email or contact our support team.</p>

    <p>Best regards,<br>The Lighthouse Careers Team</p>
  `;

  return {
    subject: "Action Required: Payment Failed",
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Client Brief Notification (for Recruiters)
// ============================================

export interface ClientBriefNotificationData {
  recruiterName: string;
  clientName: string;
  position: string;
  vesselName?: string;
  vesselType?: string;
  vesselSize?: number;
  contractType?: string;
  startDate?: string;
  briefId: string;
  dashboardLink: string;
}

export function clientBriefNotificationEmail(data: ClientBriefNotificationData) {
  const vesselInfo = [
    data.vesselName,
    data.vesselType,
    data.vesselSize ? `${data.vesselSize}m` : null,
  ].filter(Boolean).join(" • ");

  const formattedStartDate = data.startDate
    ? new Date(data.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const content = `
    <h1>New Brief from Client Portal</h1>
    <p>Hi ${data.recruiterName},</p>
    <p>A client has submitted a new brief through the portal that needs your attention.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Client</span>
        <span class="info-value">${data.clientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Position</span>
        <span class="info-value"><strong>${data.position}</strong></span>
      </div>
      ${vesselInfo ? `
      <div class="info-row">
        <span class="info-label">Vessel</span>
        <span class="info-value">${vesselInfo}</span>
      </div>
      ` : ""}
      ${data.contractType ? `
      <div class="info-row">
        <span class="info-label">Contract</span>
        <span class="info-value">${data.contractType.charAt(0).toUpperCase() + data.contractType.slice(1)}</span>
      </div>
      ` : ""}
      ${formattedStartDate ? `
      <div class="info-row">
        <span class="info-label">Start Date</span>
        <span class="info-value">${formattedStartDate}</span>
      </div>
      ` : ""}
    </div>

    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Review the brief details</li>
      <li>Identify suitable candidates</li>
      <li>Send shortlist to client within 24 hours</li>
    </ul>

    <p style="text-align:center;">
      <a href="${data.dashboardLink}" class="button">View Brief</a>
    </p>

    <p style="font-size:13px; color:#6b7280;">This brief was submitted via the client self-service portal.</p>
  `;

  return {
    subject: `New Brief: ${data.position} for ${data.clientName}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Interview Request Notification (for Recruiters)
// ============================================

export interface InterviewRequestNotificationData {
  recruiterName: string;
  clientName: string;
  candidateName: string;
  position: string;
  vesselName?: string;
  requestedType?: string;
  preferredDates?: Array<{ start: string; end: string }>;
  notes?: string;
  dashboardLink: string;
}

export function interviewRequestNotificationEmail(data: InterviewRequestNotificationData) {
  const interviewTypeLabel = data.requestedType
    ? { video: "Video Call", phone: "Phone Call", in_person: "In-Person" }[data.requestedType] || data.requestedType
    : "Not specified";

  const formatPreferredDates = () => {
    if (!data.preferredDates || data.preferredDates.length === 0) {
      return null;
    }
    return data.preferredDates.map(d => {
      const start = new Date(d.start);
      const end = new Date(d.end);
      return `${start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} ${start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
    }).join("<br>");
  };

  const preferredDatesHtml = formatPreferredDates();

  const content = `
    <h1>Interview Request from Client</h1>
    <p>Hi ${data.recruiterName},</p>
    <p>A client has requested an interview with a candidate. Please coordinate scheduling.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Client</span>
        <span class="info-value">${data.clientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Candidate</span>
        <span class="info-value"><strong>${data.candidateName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Position</span>
        <span class="info-value">${data.position}</span>
      </div>
      ${data.vesselName ? `
      <div class="info-row">
        <span class="info-label">Vessel</span>
        <span class="info-value">${data.vesselName}</span>
      </div>
      ` : ""}
      <div class="info-row">
        <span class="info-label">Interview Type</span>
        <span class="info-value">${interviewTypeLabel}</span>
      </div>
      ${preferredDatesHtml ? `
      <div class="info-row">
        <span class="info-label">Preferred Times</span>
        <span class="info-value">${preferredDatesHtml}</span>
      </div>
      ` : ""}
    </div>

    ${data.notes ? `
    <h2>Client Notes</h2>
    <p style="background:#f8f9fa; padding:15px; border-radius:8px;">${data.notes}</p>
    ` : ""}

    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Contact the candidate to confirm availability</li>
      <li>Schedule the interview in the system</li>
      <li>Send calendar invites to both parties</li>
    </ul>

    <p style="text-align:center;">
      <a href="${data.dashboardLink}" class="button">View Interview Request</a>
    </p>

    <p style="font-size:13px; color:#6b7280;">Please respond within 24 hours.</p>
  `;

  return {
    subject: `Interview Request: ${data.candidateName} for ${data.position}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Placement Notification (for Recruiters)
// ============================================

export interface PlacementNotificationData {
  recruiterName: string;
  clientName: string;
  candidateName: string;
  position: string;
  vesselName?: string;
  startDate?: string;
  salary?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  dashboardLink: string;
}

export function placementNotificationEmail(data: PlacementNotificationData) {
  const formatSalary = () => {
    if (!data.salary) return null;
    const currency = data.salaryCurrency || "EUR";
    const period = data.salaryPeriod || "month";
    const currencySymbol = { EUR: "€", GBP: "£", USD: "$" }[currency] || currency;
    return `${currencySymbol}${data.salary.toLocaleString()} per ${period}`;
  };

  const salary = formatSalary();
  const formattedStartDate = data.startDate
    ? new Date(data.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const content = `
    <h1 style="color:#16a34a;">Placement Confirmed!</h1>
    <p>Hi ${data.recruiterName},</p>
    <p>Great news! A client has confirmed a placement through the portal.</p>

    <div class="info-box" style="border-left-color:#16a34a;">
      <div class="info-row">
        <span class="info-label">Client</span>
        <span class="info-value">${data.clientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Candidate</span>
        <span class="info-value"><strong>${data.candidateName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Position</span>
        <span class="info-value">${data.position}</span>
      </div>
      ${data.vesselName ? `
      <div class="info-row">
        <span class="info-label">Vessel</span>
        <span class="info-value">${data.vesselName}</span>
      </div>
      ` : ""}
      ${formattedStartDate ? `
      <div class="info-row">
        <span class="info-label">Start Date</span>
        <span class="info-value">${formattedStartDate}</span>
      </div>
      ` : ""}
      ${salary ? `
      <div class="info-row">
        <span class="info-label">Salary</span>
        <span class="info-value">${salary}</span>
      </div>
      ` : ""}
    </div>

    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Review and process the placement fee</li>
      <li>Send placement confirmation to candidate</li>
      <li>Generate and send contract documents</li>
      <li>Update candidate availability status</li>
    </ul>

    <p style="text-align:center;">
      <a href="${data.dashboardLink}" class="button">View Placement</a>
    </p>

    <p style="font-size:13px; color:#6b7280;">Placement confirmed via client self-service portal.</p>
  `;

  return {
    subject: `Placement Confirmed: ${data.candidateName} for ${data.position}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// New Candidate Registration Admin Notification
// ============================================

export interface NewCandidateRegistrationAdminData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  primaryPosition?: string;
  nationality?: string;
  candidateType?: string;
  cvUrl?: string;
}

export function newCandidateRegistrationAdminEmail(data: NewCandidateRegistrationAdminData) {
  const industryText = data.candidateType === "private_staff"
    ? "Private Staff"
    : data.candidateType === "yacht_crew"
      ? "Yacht Crew"
      : data.candidateType === "both"
        ? "Yacht & Private Staff"
        : "Not specified";

  const content = `
    <h1>New Candidate Registration</h1>
    <p>A new candidate registered on the website:</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">First Name</span>
        <span class="info-value">${data.firstName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Last Name</span>
        <span class="info-value">${data.lastName}</span>
      </div>
      ${data.primaryPosition ? `
      <div class="info-row">
        <span class="info-label">Position</span>
        <span class="info-value">${data.primaryPosition}</span>
      </div>
      ` : ""}
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value"><a href="mailto:${data.email}">${data.email}</a></span>
      </div>
      ${data.phone ? `
      <div class="info-row">
        <span class="info-label">Phone Number</span>
        <span class="info-value"><a href="tel:${data.phone}">${data.phone}</a></span>
      </div>
      ` : ""}
      ${data.nationality ? `
      <div class="info-row">
        <span class="info-label">Nationality</span>
        <span class="info-value">${data.nationality}</span>
      </div>
      ` : ""}
      <div class="info-row">
        <span class="info-label">Industry</span>
        <span class="info-value">${industryText}</span>
      </div>
    </div>

    ${data.cvUrl ? `
    <p style="text-align:center;">
      <a href="${data.cvUrl}" class="button">View CV</a>
    </p>
    ` : ""}

    <p>Please take the necessary steps to process the candidate's registration and ensure they have a smooth onboarding experience.</p>

    <p>If you have any questions or need further information, feel free to reach out to the candidate at the provided email address: <a href="mailto:${data.email}">${data.email}</a></p>

    <p>Best regards,<br>Lighthouse Careers.</p>
  `;

  return {
    subject: `New Candidate Registration - ${data.firstName} ${data.lastName}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// New Job Application Admin Notification
// ============================================

export interface NewApplicationAdminData {
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  jobId: string;
  coverLetter?: string;
  cvUrl?: string;
  appliedAt: string;
}

export function newApplicationAdminEmail(data: NewApplicationAdminData) {
  const formattedDate = new Date(data.appliedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const content = `
    <h1>New Job Application</h1>
    <p>A candidate applied for a job on the website:</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Job</span>
        <span class="info-value"><strong>${data.jobTitle}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Candidate</span>
        <span class="info-value">${data.candidateFirstName} ${data.candidateLastName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value"><a href="mailto:${data.candidateEmail}">${data.candidateEmail}</a></span>
      </div>
      ${data.candidatePhone ? `
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value"><a href="tel:${data.candidatePhone}">${data.candidatePhone}</a></span>
      </div>
      ` : ""}
      <div class="info-row">
        <span class="info-label">Applied At</span>
        <span class="info-value">${formattedDate}</span>
      </div>
    </div>

    ${data.coverLetter ? `
    <h2>Cover Note</h2>
    <p style="background:#f8f9fa; padding:15px; border-radius:8px; white-space:pre-wrap;">${data.coverLetter}</p>
    ` : ""}

    ${data.cvUrl ? `
    <p style="text-align:center;">
      <a href="${data.cvUrl}" class="button">View CV</a>
    </p>
    ` : ""}

    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Review the candidate's application</li>
      <li>Check their profile and CV</li>
      <li>Contact them if suitable for the position</li>
    </ul>

    <p style="font-size:13px; color:#6b7280;">This is an automated notification from the Lighthouse website.</p>
  `;

  return {
    subject: `New Application: ${data.candidateFirstName} ${data.candidateLastName} for ${data.jobTitle}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Contact Form Confirmation Email
// ============================================

export interface ContactConfirmationData {
  name: string;
  subject?: string;
}

export function contactConfirmationEmail(data: ContactConfirmationData) {
  const content = `
    <h1>Thanks for Contacting Us!</h1>
    <p>Hi ${data.name},</p>
    <p>Thank you for reaching out to Lighthouse Careers. We've received your message${data.subject ? ` regarding "${data.subject}"` : ""} and will get back to you as soon as possible.</p>

    <div class="info-box">
      <p style="margin:0 0 15px; font-weight:600; color:#1a2b4a;">What to expect:</p>
      <ul style="margin:0;">
        <li>Our team reviews all inquiries within <strong>24 hours</strong></li>
        <li>You'll receive a personalized response from one of our specialists</li>
        <li>For urgent matters, feel free to call us directly</li>
      </ul>
    </div>

    <p><strong>Need immediate assistance?</strong></p>
    <p>Call us at <a href="tel:+33652928360" style="color: #c9a962; font-weight: 600;">+33 6 52 92 83 60</a> (Mon-Fri 9am-6pm CET)</p>

    <p>In the meantime, feel free to explore:</p>
    <ul>
      <li><a href="https://lighthouse-careers.com/job-board" style="color: #c9a962;">Browse Open Positions</a></li>
      <li><a href="https://lighthouse-careers.com/salary-guide" style="color: #c9a962;">Download Our Salary Guide</a></li>
      <li><a href="https://lighthouse-careers.com/about" style="color: #c9a962;">Learn More About Us</a></li>
    </ul>

    <p>We look forward to connecting with you!</p>

    <p>Best regards,<br>The Lighthouse Careers Team</p>
  `;

  return {
    subject: "We've Received Your Message - Lighthouse Careers",
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}

// ============================================
// Salary Guide Lead Admin Notification
// ============================================

export interface SalaryGuideLeadAdminData {
  email: string;
  requestedAt: string;
}

export function salaryGuideLeadAdminEmail(data: SalaryGuideLeadAdminData) {
  const formattedDate = new Date(data.requestedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const content = `
    <h1>New Salary Guide Download</h1>
    <p>Someone requested the salary guide from the website:</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value"><a href="mailto:${data.email}">${data.email}</a></span>
      </div>
      <div class="info-row">
        <span class="info-label">Requested At</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Source</span>
        <span class="info-value">Salary Guide Page</span>
      </div>
    </div>

    <p><strong>This is a potential lead.</strong> Consider:</p>
    <ul>
      <li>Following up to understand their hiring needs</li>
      <li>Adding them to your marketing list (if appropriate)</li>
      <li>Checking if they're an existing contact</li>
    </ul>

    <p style="font-size:13px; color:#6b7280;">This is an automated notification from the Lighthouse website.</p>
  `;

  return {
    subject: `Salary Guide Downloaded: ${data.email}`,
    html: baseTemplate(content),
    text: generatePlainText(content),
  };
}
