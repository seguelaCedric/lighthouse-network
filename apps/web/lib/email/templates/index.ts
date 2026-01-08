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
        <li><strong>Complete your profile</strong> — Add your experience, certifications, and a professional photo</li>
        <li><strong>Upload your documents</strong> — CV, certificates, and references help you stand out</li>
        <li><strong>Set your preferences</strong> — Tell us what you're looking for so we can match you perfectly</li>
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
    <p>Our team is already reviewing your profile. When opportunities match your skills and preferences, we'll be in touch. In the meantime, make sure your profile is complete — candidates with complete profiles are <strong>3x more likely</strong> to be shortlisted.</p>

    <p>Questions? Simply reply to this email — we're here to help you succeed.</p>

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
        <li><strong>Submit a brief</strong> — Tell us exactly what you're looking for</li>
        <li><strong>We match candidates</strong> — Our AI and expert team find the best fits</li>
        <li><strong>Review your shortlist</strong> — See verified candidates matched to your needs</li>
        <li><strong>Interview & hire</strong> — We coordinate everything seamlessly</li>
      </ul>
    </div>

    <p><strong>What sets us apart:</strong></p>
    <ul>
      <li><span class="highlight">AI-powered matching</span> for faster, more accurate results</li>
      <li>All candidates are <span class="highlight">reference-checked and verified</span></li>
      <li>Dedicated support from experienced industry professionals</li>
      <li>Transparent process with real-time updates</li>
    </ul>

    <p>Questions? Simply reply to this email — we're here to help.</p>

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

    <p>We'll keep you updated on the status of this lead. In the meantime, keep the referrals coming — there's no limit!</p>

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
