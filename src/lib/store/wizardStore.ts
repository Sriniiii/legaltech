import { create } from 'zustand';

export interface PropertyData {
  address: string;
  type: 'apartment' | 'independent_house' | 'villa' | 'pg_hostel';
  furnishing: 'fully_furnished' | 'semi_furnished' | 'unfurnished';
}

export interface FinancialsData {
  rent_amount: number;
  deposit_amount: number;
  maintenance_amount: number;
  due_date: number;
  escalation_percentage?: number;
}

export interface PartyContact {
  name: string;
  email: string;
  phone: string;
}

export interface PartiesData {
  tenant: PartyContact;
  landlord: PartyContact;
}

export interface ClausesData {
  lock_in_months: number;
  notice_period_days: number;
  subletting_allowed: boolean;
  pets_allowed: boolean;
  brokerage_paid_by: 'landlord' | 'tenant' | 'shared' | 'none';
  maintenance_paid_by: 'landlord' | 'tenant';
  custom_clauses: string[];
}

interface WizardState {
  agreementId: string | null;
  step: number;
  property: PropertyData | null;
  financials: FinancialsData | null;
  parties: PartiesData | null;
  clauses: ClausesData | null;
  isSaving: boolean;
  
  // Actions
  setAgreementId: (id: string | null) => void;
  setStep: (step: number) => void;
  setProperty: (data: PropertyData) => void;
  setFinancials: (data: FinancialsData) => void;
  setParties: (data: PartiesData) => void;
  setClauses: (data: ClausesData) => void;
  setSaving: (saving: boolean) => void;
  loadAgreement: (agreement: any) => void;
  resetStore: () => void;
}

const initialWizardState = {
  agreementId: null,
  step: 1,
  property: null,
  financials: null,
  parties: null,
  clauses: null,
  isSaving: false,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialWizardState,

  setAgreementId: (agreementId) => set({ agreementId }),
  setStep: (step) => set({ step }),
  setProperty: (property) => set({ property }),
  setFinancials: (financials) => set({ financials }),
  setParties: (parties) => set({ parties }),
  setClauses: (clauses) => set({ clauses }),
  setSaving: (isSaving) => set({ isSaving }),
  
  loadAgreement: (agreement) => {
    // Helper to map DB row into Zustand store structure
    const tenantParty = agreement.agreement_parties?.find((p: any) => p.role === 'tenant');
    const landlordParty = agreement.agreement_parties?.find((p: any) => p.role === 'landlord');

    const parties: PartiesData | null = tenantParty && landlordParty ? {
      tenant: {
        name: tenantParty.name,
        email: tenantParty.email,
        phone: tenantParty.phone,
      },
      landlord: {
        name: landlordParty.name,
        email: landlordParty.email,
        phone: landlordParty.phone,
      }
    } : null;

    set({
      agreementId: agreement.id,
      // Load stored details or defaults
      property: agreement.property_json?.address ? agreement.property_json as PropertyData : null,
      financials: agreement.rent_amount !== undefined ? {
        rent_amount: agreement.rent_amount,
        deposit_amount: agreement.deposit_amount,
        maintenance_amount: agreement.maintenance_amount,
        due_date: agreement.property_json?.due_date || 1, // Store due_date inside property_json or separate
        escalation_percentage: agreement.property_json?.escalation_percentage || 0,
      } as FinancialsData : null,
      parties,
      clauses: agreement.clauses_json?.maintenance_paid_by ? agreement.clauses_json as ClausesData : null,
    });
  },

  resetStore: () => set(initialWizardState),
}));
