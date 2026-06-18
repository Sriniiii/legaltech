import { z } from 'zod';

// Property Details validation schema (Step 1 of Wizard)
export const propertySchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  type: z.enum(['apartment', 'independent_house', 'villa', 'pg_hostel']),
  furnishing: z.enum(['fully_furnished', 'semi_furnished', 'unfurnished']),
});

// Financial Details validation schema (Step 2 of Wizard)
export const financialsSchema = z.object({
  rent_amount: z.coerce.number().min(0, 'Rent must be a positive number'),
  deposit_amount: z.coerce.number().min(0, 'Deposit must be a positive number'),
  maintenance_amount: z.coerce.number().min(0, 'Maintenance must be a positive number'),
  due_date: z.coerce.number().min(1, 'Due date must be at least the 1st').max(31, 'Due date cannot exceed the 31st'),
  escalation_percentage: z.coerce.number().min(0, 'Escalation percentage must be non-negative').max(100, 'Escalation cannot exceed 100%').optional().default(0),
});

// Clauses Details validation schema (Step 4 of Wizard)
export const clausesSchema = z.object({
  lock_in_months: z.coerce.number().min(0, 'Lock-in period must be non-negative'),
  notice_period_days: z.coerce.number().min(0, 'Notice period must be non-negative'),
  subletting_allowed: z.boolean().default(false),
  pets_allowed: z.boolean().default(false),
  brokerage_paid_by: z.enum(['landlord', 'tenant', 'shared', 'none']).default('none'),
  maintenance_paid_by: z.enum(['landlord', 'tenant']).default('tenant'),
  custom_clauses: z.array(z.string()).default([]),
});

// Party Contact Details schema
export const partyContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number (must be in international E.164 format)'),
});

// Parties details (Step 3 of Wizard)
export const partiesWizardSchema = z.object({
  tenant: partyContactSchema,
  landlord: partyContactSchema,
});

// Agreements Table Schema (Zod)
export const agreementSchema = z.object({
  id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'pending_confirmation', 'ready_for_signature', 'signing_complete', 'completed', 'expired', 'voided']).default('draft'),
  version: z.number().int().positive().default(1),
  property_json: propertySchema,
  rent_amount: z.number().min(0, 'Rent must be non-negative'),
  deposit_amount: z.number().min(0, 'Deposit must be non-negative'),
  maintenance_amount: z.number().min(0, 'Maintenance must be non-negative').default(0),
  term_months: z.number().int().min(1, 'Term must be at least 1 month').max(11, 'Term must be 11 months or less (legal scope boundary for leave-and-license agreements)'),
  lock_in_months: z.number().int().min(0, 'Lock-in period must be non-negative'),
  notice_period_days: z.number().int().min(0, 'Notice period must be non-negative'),
  clauses_json: clausesSchema,
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

// Agreement Parties Table Schema (Zod)
export const agreementPartySchema = z.object({
  id: z.string().uuid().optional(),
  agreement_id: z.string().uuid(),
  role: z.enum(['landlord', 'tenant']),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  token: z.string().nullable().optional(),
  token_expires_at: z.string().or(z.date()).nullable().optional(),
  confirmed_at: z.string().or(z.date()).nullable().optional(),
  signed_at: z.string().or(z.date()).nullable().optional(),
  signature_meta_json: z.any().nullable().optional(),
  created_at: z.string().or(z.date()).optional(),
});

// Documents Table Schema (Zod)
export const documentSchema = z.object({
  id: z.string().uuid().optional(),
  agreement_id: z.string().uuid(),
  version: z.number().int().positive().default(1),
  storage_path: z.string(),
  created_at: z.string().or(z.date()).optional(),
});

// Audit Log Table Schema (Zod)
export const auditLogSchema = z.object({
  id: z.string().uuid().optional(),
  agreement_id: z.string().uuid(),
  party_id: z.string().uuid().nullable().optional(),
  action: z.string(),
  ip: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  metadata_json: z.record(z.string(), z.any()).default({}),
  created_at: z.string().or(z.date()).optional(),
});

// Combined Wizard State Schema (used for draft autosaves and state management)
export const wizardStateSchema = z.object({
  property: propertySchema.optional(),
  financials: financialsSchema.optional(),
  parties: partiesWizardSchema.optional(),
  clauses: clausesSchema.optional(),
  term_months: z.number().int().min(1).max(11).optional(),
});
