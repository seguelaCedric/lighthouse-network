-- ============================================================================
-- LIGHTHOUSE CREW NETWORK - Billing Infrastructure
-- ============================================================================
-- Subscription plans, agency subscriptions, invoices, payments, placement fees
-- ============================================================================
-- IDEMPOTENT: This migration can be run multiple times safely
-- ============================================================================

-- ============================================================================
-- SUBSCRIPTION PLANS (configured by admin)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Plan details
  name text NOT NULL, -- 'Free', 'Pro', 'Enterprise'
  slug text UNIQUE NOT NULL, -- 'free', 'pro', 'enterprise'
  description text,

  -- Pricing
  price_monthly integer DEFAULT 0, -- in cents
  price_yearly integer DEFAULT 0, -- in cents (with discount)
  currency text DEFAULT 'EUR',

  -- Stripe
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  stripe_product_id text,

  -- Limits
  max_candidates integer, -- null = unlimited
  max_active_jobs integer,
  max_team_members integer,
  max_placements_per_month integer,

  -- Features (jsonb for flexibility)
  features jsonb DEFAULT '[]', -- ['ai_matching', 'client_portal', 'api_access', ...]

  -- Platform fees
  placement_fee_percent numeric(5,2) DEFAULT 10.00, -- % of placement fee

  -- Status
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT true, -- show on pricing page
  sort_order integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_candidates, max_active_jobs, max_team_members, features, placement_fee_percent, sort_order) VALUES
  ('Free', 'free', 'Get started with basic features', 0, 0, 50, 5, 1, '["basic_search", "manual_matching"]', 15.00, 1),
  ('Pro', 'pro', 'Full features for growing agencies', 9900, 99900, null, null, 5, '["basic_search", "ai_matching", "client_portal", "whatsapp_integration", "priority_support"]', 10.00, 2),
  ('Enterprise', 'enterprise', 'Custom solution for large agencies', null, null, null, null, null, '["basic_search", "ai_matching", "client_portal", "whatsapp_integration", "api_access", "white_label", "dedicated_support"]', 5.00, 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- AGENCY SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS agency_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  plan_id uuid REFERENCES subscription_plans(id),

  -- Billing cycle
  billing_cycle text DEFAULT 'monthly', -- monthly, yearly

  -- Status
  status text DEFAULT 'active', -- active, past_due, canceled, trialing

  -- Dates
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  canceled_at timestamptz,
  cancel_at_period_end boolean DEFAULT false,

  -- Stripe
  stripe_customer_id text,
  stripe_subscription_id text,

  -- Usage this period
  candidates_count integer DEFAULT 0,
  active_jobs_count integer DEFAULT 0,
  placements_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES organizations(id) ON DELETE CASCADE,

  -- Invoice details
  invoice_number text UNIQUE NOT NULL,
  status text DEFAULT 'draft', -- draft, pending, paid, void, uncollectible

  -- Amounts (in cents)
  subtotal integer NOT NULL DEFAULT 0,
  tax_amount integer DEFAULT 0,
  tax_percent numeric(5,2) DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  amount_paid integer DEFAULT 0,
  amount_due integer NOT NULL DEFAULT 0,
  currency text DEFAULT 'EUR',

  -- Period
  period_start timestamptz,
  period_end timestamptz,

  -- Dates
  issued_at timestamptz DEFAULT now(),
  due_at timestamptz,
  paid_at timestamptz,

  -- Stripe
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  hosted_invoice_url text,
  invoice_pdf_url text,

  -- Billing details
  billing_name text,
  billing_email text,
  billing_address jsonb,

  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INVOICE LINE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,

  -- Item details
  description text NOT NULL,
  item_type text NOT NULL, -- subscription, placement_fee, addon, credit

  -- Amounts
  quantity integer DEFAULT 1,
  unit_amount integer NOT NULL, -- in cents
  amount integer NOT NULL, -- quantity * unit_amount
  currency text DEFAULT 'EUR',

  -- Related entity
  placement_id uuid REFERENCES placements(id),
  subscription_id uuid REFERENCES agency_subscriptions(id),

  -- Period (for subscriptions)
  period_start timestamptz,
  period_end timestamptz,

  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id),

  -- Payment details
  amount integer NOT NULL, -- in cents
  currency text DEFAULT 'EUR',
  status text DEFAULT 'pending', -- pending, succeeded, failed, refunded

  -- Method
  payment_method text, -- card, sepa_debit, bank_transfer
  payment_method_details jsonb, -- last4, brand, etc.

  -- Stripe
  stripe_payment_intent_id text,
  stripe_charge_id text,

  -- Dates
  created_at timestamptz DEFAULT now(),
  succeeded_at timestamptz,
  failed_at timestamptz,
  failure_reason text
);

-- ============================================================================
-- PLACEMENT FEES (track platform cut per placement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS placement_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Related entities
  placement_id uuid REFERENCES placements(id) ON DELETE CASCADE UNIQUE,
  agency_id uuid REFERENCES organizations(id),
  invoice_id uuid REFERENCES invoices(id), -- null until invoiced

  -- Amounts
  placement_value integer NOT NULL, -- total placement fee in cents
  fee_percent numeric(5,2) NOT NULL, -- platform fee %
  platform_fee integer NOT NULL, -- calculated platform cut
  currency text DEFAULT 'EUR',

  -- Status
  status text DEFAULT 'pending', -- pending, invoiced, paid, waived

  -- Dates
  placement_date timestamptz DEFAULT now(),
  invoiced_at timestamptz,
  paid_at timestamptz,

  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_fees ENABLE ROW LEVEL SECURITY;

-- Plans are public (for pricing page)
DROP POLICY IF EXISTS "Plans are viewable by all" ON subscription_plans;
CREATE POLICY "Plans are viewable by all" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Agencies see own subscription
DROP POLICY IF EXISTS "Agencies view own subscription" ON agency_subscriptions;
CREATE POLICY "Agencies view own subscription" ON agency_subscriptions
  FOR SELECT USING (agency_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

-- Agencies see own invoices
DROP POLICY IF EXISTS "Agencies view own invoices" ON invoices;
CREATE POLICY "Agencies view own invoices" ON invoices
  FOR SELECT USING (agency_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Invoice items visible via invoice access
DROP POLICY IF EXISTS "Invoice items viewable by invoice owner" ON invoice_items;
CREATE POLICY "Invoice items viewable by invoice owner" ON invoice_items
  FOR SELECT USING (invoice_id IN (
    SELECT id FROM invoices WHERE agency_id IN (
      SELECT organization_id FROM users WHERE auth_id = auth.uid()
    )
  ));

-- Agencies see own payments
DROP POLICY IF EXISTS "Agencies view own payments" ON payments;
CREATE POLICY "Agencies view own payments" ON payments
  FOR SELECT USING (agency_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

-- Agencies see own placement fees
DROP POLICY IF EXISTS "Agencies view own placement fees" ON placement_fees;
CREATE POLICY "Agencies view own placement fees" ON placement_fees
  FOR SELECT USING (agency_id IN (
    SELECT organization_id FROM users WHERE auth_id = auth.uid()
  ));

-- Admin policies for full access
DROP POLICY IF EXISTS "Admins manage all subscription plans" ON subscription_plans;
CREATE POLICY "Admins manage all subscription plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Admins manage all subscriptions" ON agency_subscriptions;
CREATE POLICY "Admins manage all subscriptions" ON agency_subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Admins manage all invoices" ON invoices;
CREATE POLICY "Admins manage all invoices" ON invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Admins manage all payments" ON payments;
CREATE POLICY "Admins manage all payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Admins manage all placement fees" ON placement_fees;
CREATE POLICY "Admins manage all placement fees" ON placement_fees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_agency ON agency_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON agency_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON agency_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_agency ON invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_agency ON payments(agency_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_placement_fees_agency ON placement_fees(agency_id);
CREATE INDEX IF NOT EXISTS idx_placement_fees_placement ON placement_fees(placement_id);
CREATE INDEX IF NOT EXISTS idx_placement_fees_status ON placement_fees(status);
CREATE INDEX IF NOT EXISTS idx_placement_fees_invoice ON placement_fees(invoice_id);

-- ============================================================================
-- FUNCTION: Generate Invoice Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  year_month text;
  sequence_num integer;
  new_number text;
BEGIN
  year_month := to_char(now(), 'YYYYMM');

  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS integer)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_month || '-%';

  new_number := 'INV-' || year_month || '-' || LPAD(sequence_num::text, 4, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS trg_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_agency_subscriptions_updated_at ON agency_subscriptions;
CREATE TRIGGER trg_agency_subscriptions_updated_at
  BEFORE UPDATE ON agency_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ADD BILLING FIELDS TO ORGANIZATIONS
-- ============================================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS billing_email text,
ADD COLUMN IF NOT EXISTS billing_name text,
ADD COLUMN IF NOT EXISTS billing_address jsonb,
ADD COLUMN IF NOT EXISTS vat_number text;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE subscription_plans IS 'Available subscription plans (Free, Pro, Enterprise)';
COMMENT ON TABLE agency_subscriptions IS 'Agency subscription state and usage tracking';
COMMENT ON TABLE invoices IS 'Invoices for subscriptions and placement fees';
COMMENT ON TABLE invoice_items IS 'Line items on invoices';
COMMENT ON TABLE payments IS 'Payment attempts and history';
COMMENT ON TABLE placement_fees IS 'Platform fee tracking per placement';
COMMENT ON COLUMN subscription_plans.features IS 'JSON array of feature flags: ai_matching, client_portal, api_access, etc.';
COMMENT ON COLUMN invoices.invoice_number IS 'Human-readable invoice number: INV-YYYYMM-NNNN';

-- ============================================================================
-- FUNCTION: Get Placement Fee Stats (for admin dashboard)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_placement_fee_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'pending_count', COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0),
    'pending_amount', COALESCE(SUM(CASE WHEN status = 'pending' THEN platform_fee ELSE 0 END), 0),
    'invoiced_count', COALESCE(SUM(CASE WHEN status = 'invoiced' THEN 1 ELSE 0 END), 0),
    'invoiced_amount', COALESCE(SUM(CASE WHEN status = 'invoiced' THEN platform_fee ELSE 0 END), 0),
    'paid_count', COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0),
    'paid_amount', COALESCE(SUM(CASE WHEN status = 'paid' THEN platform_fee ELSE 0 END), 0),
    'waived_count', COALESCE(SUM(CASE WHEN status = 'waived' THEN 1 ELSE 0 END), 0),
    'waived_amount', COALESCE(SUM(CASE WHEN status = 'waived' THEN platform_fee ELSE 0 END), 0)
  ) INTO result
  FROM placement_fees;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
