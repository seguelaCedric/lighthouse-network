// Stripe Integration
// ===================
// This module provides Stripe integration for subscriptions, checkout, invoices, and placement fees.

export { stripe } from './client'

export {
  getOrCreateStripeCustomer,
  updateStripeCustomer,
  createCustomerPortalSession,
} from './customers'

export {
  createSubscription,
  cancelSubscription,
  resumeSubscription,
  updateSubscription,
  getSubscription,
  syncSubscriptionFromStripe,
} from './subscriptions'

export {
  createCheckoutSession,
  createInvoiceCheckoutSession,
  handleCheckoutComplete,
} from './checkout'

export {
  syncInvoiceFromStripe,
  getInvoices,
  getInvoice,
  sendInvoice,
  voidInvoice,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
} from './invoices'

export {
  createPlacementFee,
  getPendingFees,
  getPlacementFees,
  invoicePendingFees,
  waivePlacementFee,
  getFeeSummary,
} from './placement-fees'
