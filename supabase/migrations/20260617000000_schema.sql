-- Enable Row Level Security (RLS) and define tables for RentSign

-- 1. AGREEMENTS TABLE
CREATE TABLE IF NOT EXISTS agreements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_confirmation', 'ready_for_signature', 'completed', 'expired', 'voided')),
    version int NOT NULL DEFAULT 1,
    property_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    rent_amount numeric NOT NULL CHECK (rent_amount >= 0),
    deposit_amount numeric NOT NULL CHECK (deposit_amount >= 0),
    maintenance_amount numeric NOT NULL DEFAULT 0 CHECK (maintenance_amount >= 0),
    term_months int NOT NULL CHECK (term_months <= 11 AND term_months > 0),
    lock_in_months int NOT NULL DEFAULT 0 CHECK (lock_in_months >= 0),
    notice_period_days int NOT NULL DEFAULT 30 CHECK (notice_period_days >= 0),
    clauses_json jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. AGREEMENT PARTIES TABLE
CREATE TABLE IF NOT EXISTS agreement_parties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id uuid NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('landlord', 'tenant')),
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    token text UNIQUE,
    token_expires_at timestamptz,
    confirmed_at timestamptz,
    signed_at timestamptz,
    signature_meta_json jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id uuid NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    version int NOT NULL DEFAULT 1,
    storage_path text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id uuid NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    party_id uuid REFERENCES agreement_parties(id) ON DELETE SET NULL,
    action text NOT NULL,
    ip text,
    user_agent text,
    metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- INDEXES FOR PERFORMANCE AND FK LOOKUPS
CREATE INDEX IF NOT EXISTS idx_agreements_owner_id ON agreements(owner_id);
CREATE INDEX IF NOT EXISTS idx_agreement_parties_agreement_id ON agreement_parties(agreement_id);
CREATE INDEX IF NOT EXISTS idx_agreement_parties_token ON agreement_parties(token);
CREATE INDEX IF NOT EXISTS idx_documents_agreement_id ON documents(agreement_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_agreement_id ON audit_log(agreement_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Agreements: Landlords have access only to their own agreements.
CREATE POLICY agreements_owner_policy ON agreements
    FOR ALL
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Agreement Parties: Landlords can view and edit parties for their own agreements.
CREATE POLICY agreement_parties_owner_policy ON agreement_parties
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM agreements
            WHERE agreements.id = agreement_parties.agreement_id
            AND agreements.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM agreements
            WHERE agreements.id = agreement_parties.agreement_id
            AND agreements.owner_id = auth.uid()
        )
    );

-- Documents: Landlords can access documents for their own agreements.
CREATE POLICY documents_owner_policy ON documents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM agreements
            WHERE agreements.id = documents.agreement_id
            AND agreements.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM agreements
            WHERE agreements.id = documents.agreement_id
            AND agreements.owner_id = auth.uid()
        )
    );

-- Audit Log: Landlords can access audit logs for their own agreements.
CREATE POLICY audit_log_owner_policy ON audit_log
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM agreements
            WHERE agreements.id = audit_log.agreement_id
            AND agreements.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM agreements
            WHERE agreements.id = audit_log.agreement_id
            AND agreements.owner_id = auth.uid()
        )
    );
