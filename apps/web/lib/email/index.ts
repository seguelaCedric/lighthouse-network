export { getResendClient, isResendConfigured, sendEmail, type SendEmailResult } from "./client";

export {
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
  inquiryNotificationEmail,
  newCandidateRegistrationAdminEmail,
  newApplicationAdminEmail,
  contactConfirmationEmail,
  salaryGuideLeadAdminEmail,
  type EmailTemplate,
  type BriefReceivedData,
  type BriefConvertedData,
  type CandidateShortlistedData,
  type CandidateSubmittedData,
  type InterviewScheduledData,
  type InterviewScheduledClientData,
  type PlacementConfirmedData,
  type ReferenceRequestData,
  type WelcomeClientData,
  type WelcomeCandidateData,
  type ClientPortalInviteData,
  type ClientMagicLinkData,
  type InquiryNotificationData,
  type NewCandidateRegistrationAdminData,
  type NewApplicationAdminData,
  type ContactConfirmationData,
  type SalaryGuideLeadAdminData,
} from "./templates";

import { sendEmail } from "./client";
import * as templates from "./templates";

// Convenience function to send templated emails
export async function sendTemplatedEmail<T extends templates.EmailTemplate>(
  template: T,
  to: string | string[],
  data: T extends "brief_received"
    ? templates.BriefReceivedData
    : T extends "brief_converted"
    ? templates.BriefConvertedData
    : T extends "candidate_shortlisted"
    ? templates.CandidateShortlistedData
    : T extends "candidate_submitted"
    ? templates.CandidateSubmittedData
    : T extends "interview_scheduled"
    ? templates.InterviewScheduledData
    : T extends "placement_confirmed"
    ? templates.PlacementConfirmedData
    : T extends "reference_request"
    ? templates.ReferenceRequestData
    : T extends "welcome_client"
    ? templates.WelcomeClientData
    : T extends "welcome_candidate"
    ? templates.WelcomeCandidateData
    : never
) {
  const templateFunctions: Record<string, (data: unknown) => { subject: string; html: string; text: string }> = {
    brief_received: templates.briefReceivedEmail as (data: unknown) => { subject: string; html: string; text: string },
    brief_converted: templates.briefConvertedEmail as (data: unknown) => { subject: string; html: string; text: string },
    candidate_shortlisted: templates.candidateShortlistedEmail as (data: unknown) => { subject: string; html: string; text: string },
    candidate_submitted: templates.candidateSubmittedEmail as (data: unknown) => { subject: string; html: string; text: string },
    interview_scheduled: templates.interviewScheduledEmail as (data: unknown) => { subject: string; html: string; text: string },
    placement_confirmed: templates.placementConfirmedEmail as (data: unknown) => { subject: string; html: string; text: string },
    reference_request: templates.referenceRequestEmail as (data: unknown) => { subject: string; html: string; text: string },
    welcome_client: templates.welcomeClientEmail as (data: unknown) => { subject: string; html: string; text: string },
    welcome_candidate: templates.welcomeCandidateEmail as (data: unknown) => { subject: string; html: string; text: string },
  };

  const templateFn = templateFunctions[template];
  if (!templateFn) {
    throw new Error(`Unknown email template: ${template}`);
  }

  const { subject, html, text } = templateFn(data);

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}
