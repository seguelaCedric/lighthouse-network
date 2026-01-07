/**
 * Vincere Webhook Utilities
 * 
 * Helper functions for managing Vincere webhooks.
 */

import { getVincereClient, createWebhook, listWebhooks, deleteWebhook } from './client';
import type { VincereWebhook } from './client';

/**
 * Default webhook events for job updates
 * Vincere uses entity_type and action_types format
 */
export const DEFAULT_JOB_WEBHOOK_EVENTS = [
  'job.created',
  'job.updated',
  'job.deleted',
];

/**
 * Vincere job webhook event configuration
 * Valid entity types: CONTACT, CANDIDATE, PLACEMENT, JOB, APPLICATION, COMPANY
 * Note: DELETE action is not supported for JOB entity type
 */
export const JOB_WEBHOOK_EVENT = {
  entity_type: 'JOB', // Vincere uses JOB for jobs (not POSITION)
  action_types: ['CREATE', 'UPDATE'], // DELETE is not supported for JOB
};

/**
 * Vincere candidate webhook event configuration
 */
export const CANDIDATE_WEBHOOK_EVENT = {
  entity_type: 'CANDIDATE',
  action_types: ['CREATE', 'UPDATE', 'ARCHIVE', 'DELETE'],
};

/**
 * Register a webhook for Vincere job updates
 * 
 * @param webhookUrl - The full URL where Vincere should send webhooks
 * @param events - Array of event types to subscribe to (defaults to job events)
 * @param secret - Optional webhook secret for signature verification
 * @returns The created webhook configuration
 * 
 * @example
 * ```ts
 * const webhook = await registerJobWebhook(
 *   'https://your-domain.com/api/webhooks/vincere',
 *   ['job.created', 'job.updated', 'job.deleted']
 * );
 * ```
 */
export async function registerJobWebhook(
  webhookUrl: string,
  events: string[] = DEFAULT_JOB_WEBHOOK_EVENTS,
  secret?: string
): Promise<VincereWebhook> {
  const vincere = getVincereClient();
  
  // Vincere API expects events with entity_type and action_types
  // For jobs, entity_type is 'JOB' and action_types are ['CREATE', 'UPDATE']
  // Note: DELETE is not supported for JOB entity type
  const eventObject = {
    entity_type: 'JOB',
    action_types: ['CREATE', 'UPDATE'],
  };
  
  return createWebhook(
    {
      webhook_url: webhookUrl, // Vincere API expects webhook_url
      events: [eventObject],
      active: true,
      secret,
    },
    vincere
  );
}

/**
 * Register a webhook for Vincere candidate updates
 * 
 * @param webhookUrl - The full URL where Vincere should send webhooks
 * @param actionTypes - Array of action types (defaults to CREATE, UPDATE, ARCHIVE, DELETE)
 * @param secret - Optional webhook secret for signature verification
 * @returns The created webhook configuration
 * 
 * @example
 * ```ts
 * const webhook = await registerCandidateWebhook(
 *   'https://your-domain.com/api/webhooks/vincere/candidates'
 * );
 * ```
 */
export async function registerCandidateWebhook(
  webhookUrl: string,
  actionTypes: string[] = ['CREATE', 'UPDATE', 'ARCHIVE', 'DELETE'],
  secret?: string
): Promise<VincereWebhook> {
  const vincere = getVincereClient();
  
  const eventObject = {
    entity_type: 'CANDIDATE',
    action_types: actionTypes,
  };
  
  return createWebhook(
    {
      webhook_url: webhookUrl,
      events: [eventObject],
      active: true,
      secret,
    },
    vincere
  );
}

/**
 * Find existing webhook by URL
 * 
 * @param webhookUrl - The webhook URL to search for
 * @returns The webhook if found, null otherwise
 */
export async function findWebhookByUrl(
  webhookUrl: string
): Promise<VincereWebhook | null> {
  const vincere = getVincereClient();
  const webhooks = await listWebhooks(vincere);
  
  return webhooks.find(w => (w.webhook_url || w.url) === webhookUrl) || null;
}

/**
 * Register or update webhook for job updates
 * 
 * If a webhook with the same URL exists, it will be deleted and recreated.
 * 
 * @param webhookUrl - The full URL where Vincere should send webhooks
 * @param events - Array of event types to subscribe to
 * @param secret - Optional webhook secret for signature verification
 * @returns The created webhook configuration
 */
export async function ensureJobWebhook(
  webhookUrl: string,
  events: string[] = DEFAULT_JOB_WEBHOOK_EVENTS,
  secret?: string
): Promise<VincereWebhook> {
  const existing = await findWebhookByUrl(webhookUrl);
  
  if (existing && existing.id) {
    // Delete existing webhook
    const vincere = getVincereClient();
    await deleteWebhook(existing.id, vincere);
  }
  
  // Create new webhook
  return registerJobWebhook(webhookUrl, events, secret);
}

