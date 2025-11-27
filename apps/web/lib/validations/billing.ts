import { z } from 'zod'

// ============================================================================
// BILLING CYCLE
// ============================================================================

export const billingCycleSchema = z.enum(['monthly', 'yearly'])
export type BillingCycle = z.infer<typeof billingCycleSchema>

// ============================================================================
// PLAN SLUG
// ============================================================================

export const planSlugSchema = z
  .string()
  .min(1, 'Plan is required')
  .regex(/^[a-z0-9-]+$/, 'Invalid plan slug')

// ============================================================================
// SUBSCRIBE (CREATE CHECKOUT SESSION)
// ============================================================================

export const subscribeSchema = z.object({
  plan_slug: planSlugSchema,
  billing_cycle: billingCycleSchema,
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>

// ============================================================================
// CHANGE PLAN
// ============================================================================

export const changePlanSchema = z.object({
  plan_slug: planSlugSchema,
  billing_cycle: billingCycleSchema,
})

export type ChangePlanInput = z.infer<typeof changePlanSchema>

// ============================================================================
// CANCEL SUBSCRIPTION
// ============================================================================

export const cancelSubscriptionSchema = z.object({
  immediately: z.boolean().optional().default(false),
  reason: z.string().max(500).optional(),
})

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>

// ============================================================================
// INVOICES QUERY
// ============================================================================

export const invoicesQuerySchema = z.object({
  status: z
    .enum(['draft', 'pending', 'paid', 'void', 'uncollectible'])
    .optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
})

export type InvoicesQueryInput = z.infer<typeof invoicesQuerySchema>

// ============================================================================
// PORTAL SESSION
// ============================================================================

export const portalSessionSchema = z.object({
  return_url: z.string().url().optional(),
})

export type PortalSessionInput = z.infer<typeof portalSessionSchema>

// ============================================================================
// PAYMENT METHOD SETUP
// ============================================================================

export const setupPaymentMethodSchema = z.object({
  return_url: z.string().url().optional(),
})

export type SetupPaymentMethodInput = z.infer<typeof setupPaymentMethodSchema>

// ============================================================================
// ADMIN: CREATE INVOICE FOR PLACEMENT FEES
// ============================================================================

export const createPlacementFeeInvoiceSchema = z.object({
  agency_id: z.string().uuid('Invalid agency ID'),
  fee_ids: z.array(z.string().uuid()).min(1, 'At least one fee is required'),
  due_days: z.number().int().positive().default(30),
  notes: z.string().max(1000).optional(),
})

export type CreatePlacementFeeInvoiceInput = z.infer<
  typeof createPlacementFeeInvoiceSchema
>

// ============================================================================
// ADMIN: PLACEMENT FEES QUERY
// ============================================================================

export const placementFeesQuerySchema = z.object({
  agency_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'invoiced', 'paid', 'waived']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
})

export type PlacementFeesQueryInput = z.infer<typeof placementFeesQuerySchema>

// ============================================================================
// ADMIN: WAIVE PLACEMENT FEE
// ============================================================================

export const waivePlacementFeeSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
})

export type WaivePlacementFeeInput = z.infer<typeof waivePlacementFeeSchema>

// ============================================================================
// BILLING STATS DATE RANGE
// ============================================================================

export const billingStatsQuerySchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

export type BillingStatsQueryInput = z.infer<typeof billingStatsQuerySchema>
