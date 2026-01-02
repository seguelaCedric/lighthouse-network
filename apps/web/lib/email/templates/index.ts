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
  | "employer_brief_received";

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
  const content = `
    <h1>Welcome to Lighthouse Crew!</h1>
    <p>Hi ${data.candidateName},</p>
    <p>Welcome to the Lighthouse Crew network! We're excited to have you on board.</p>

    <p>Here's how to make the most of your profile:</p>

    <ul>
      <li><strong>Complete your profile:</strong> The more complete your profile, the better we can match you</li>
      <li><strong>Upload documents:</strong> Add your CV, certifications, and references</li>
      <li><strong>Keep your availability updated:</strong> Let us know when you're looking for work</li>
      <li><strong>Respond quickly:</strong> When opportunities arise, fast responses make a difference</li>
    </ul>

    <p>Our team will be in touch when we have opportunities that match your skills${data.position ? ` as a ${data.position}` : ""}.</p>

    <p>Best of luck with your career,<br>The Lighthouse Crew Team</p>
  `;

  return {
    subject: "Welcome to Lighthouse Crew!",
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
