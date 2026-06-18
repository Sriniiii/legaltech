'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase/client';
import { useWizardStore, PropertyData, FinancialsData, PartiesData, ClausesData } from '@/lib/store/wizardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Save, 
  Home as HomeIcon, 
  DollarSign, 
  Users, 
  FileText, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { propertySchema, financialsSchema, clausesSchema, partiesWizardSchema } from '@/lib/schemas';

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');

  // Zustand Store
  const {
    agreementId,
    step,
    property,
    financials,
    parties,
    clauses,
    isSaving,
    setAgreementId,
    setStep,
    setProperty,
    setFinancials,
    setParties,
    setClauses,
    setSaving,
    loadAgreement,
    resetStore,
  } = useWizardStore();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states matching step inputs (prepopulated from store if exists)
  const [address, setAddress] = useState('');
  const [propType, setPropType] = useState<'apartment' | 'independent_house' | 'villa' | 'pg_hostel'>('apartment');
  const [furnishing, setFurnishing] = useState<'fully_furnished' | 'semi_furnished' | 'unfurnished'>('unfurnished');

  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [maintenance, setMaintenance] = useState('0');
  const [dueDate, setDueDate] = useState('1');
  const [term, setTerm] = useState('11');
  const [escalation, setEscalation] = useState('0');

  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');

  const [lockIn, setLockIn] = useState('0');
  const [notice, setNotice] = useState('30');
  const [sublet, setSublet] = useState(false);
  const [pets, setPets] = useState(false);
  const [brokerage, setBrokerage] = useState<'landlord' | 'tenant' | 'shared' | 'none'>('none');
  const [maintenanceBy, setMaintenanceBy] = useState<'landlord' | 'tenant'>('tenant');
  const [customClauseInput, setCustomClauseInput] = useState('');
  const [customClausesList, setCustomClausesList] = useState<string[]>([]);

  // Ref for debounced autosaving
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load & Auth check
  useEffect(() => {
    async function checkAuthAndLoadDraft() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setCurrentUser(user);

        // If a draft ID is supplied, load it from the database
        if (draftId) {
          const { data, error } = await supabaseClient
            .from('agreements')
            .select('*, agreement_parties(*)')
            .eq('id', draftId)
            .single();

          if (error) throw error;

          if (data) {
            // Load into Zustand store
            loadAgreement(data);

            // Set local component inputs from loaded data
            if (data.property_json) {
              setAddress(data.property_json.address || '');
              setPropType(data.property_json.type || 'apartment');
              setFurnishing(data.property_json.furnishing || 'unfurnished');
            }
            if (data.rent_amount !== undefined) {
              setRent(data.rent_amount.toString());
              setDeposit(data.deposit_amount.toString());
              setMaintenance(data.maintenance_amount.toString());
              setDueDate((data.property_json?.due_date || 1).toString());
              setTerm((data.term_months || 11).toString());
              setEscalation((data.property_json?.escalation_percentage || 0).toString());
            }
            const tenant = data.agreement_parties?.find((p: any) => p.role === 'tenant');
            const landlord = data.agreement_parties?.find((p: any) => p.role === 'landlord');
            if (tenant) {
              setTenantName(tenant.name || '');
              setTenantEmail(tenant.email || '');
              setTenantPhone(tenant.phone || '');
            }
            if (landlord) {
              setLandlordName(landlord.name || '');
              setLandlordPhone(landlord.phone || '');
            } else {
              setLandlordName(user.email?.split('@')[0] || 'Landlord');
            }
            if (data.clauses_json) {
              setLockIn((data.clauses_json.lock_in_months || 0).toString());
              setNotice((data.clauses_json.notice_period_days || 30).toString());
              setSublet(data.clauses_json.subletting_allowed || false);
              setPets(data.clauses_json.pets_allowed || false);
              setBrokerage(data.clauses_json.brokerage_paid_by || 'none');
              setMaintenanceBy(data.clauses_json.maintenance_paid_by || 'tenant');
              setCustomClausesList(data.clauses_json.custom_clauses || []);
            }
          }
        } else {
          // Reset store for a fresh new agreement
          resetStore();
          setLandlordName(user.email?.split('@')[0] || 'Landlord');
        }
      } catch (err) {
        console.error('Error loading draft details:', err);
        setErrorMsg('Failed to load draft agreement. Returning to dashboard.');
        setTimeout(() => router.push('/dashboard'), 3000);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndLoadDraft();
  }, [draftId, router, loadAgreement, resetStore]);

  // 2. Perform Save database operation
  const performSave = async (
    currentId: string | null,
    propObj: PropertyData | null,
    finObj: FinancialsData | null,
    partObj: PartiesData | null,
    clauseObj: ClausesData | null,
    termMonthsVal: number
  ) => {
    if (!currentUser) return;
    setSaving(true);

    try {
      const payload: any = {
        owner_id: currentUser.id,
        property_json: {
          address: propObj?.address || address,
          type: propObj?.type || propType,
          furnishing: propObj?.furnishing || furnishing,
          due_date: finObj?.due_date || parseInt(dueDate, 10),
          escalation_percentage: finObj?.escalation_percentage || parseFloat(escalation),
        },
        rent_amount: finObj?.rent_amount !== undefined ? finObj.rent_amount : (parseFloat(rent) || 0),
        deposit_amount: finObj?.deposit_amount !== undefined ? finObj.deposit_amount : (parseFloat(deposit) || 0),
        maintenance_amount: finObj?.maintenance_amount !== undefined ? finObj.maintenance_amount : (parseFloat(maintenance) || 0),
        term_months: termMonthsVal,
        lock_in_months: clauseObj?.lock_in_months !== undefined ? clauseObj.lock_in_months : (parseInt(lockIn, 10) || 0),
        notice_period_days: clauseObj?.notice_period_days !== undefined ? clauseObj.notice_period_days : (parseInt(notice, 10) || 30),
        clauses_json: {
          lock_in_months: clauseObj?.lock_in_months !== undefined ? clauseObj.lock_in_months : (parseInt(lockIn, 10) || 0),
          notice_period_days: clauseObj?.notice_period_days !== undefined ? clauseObj.notice_period_days : (parseInt(notice, 10) || 30),
          subletting_allowed: clauseObj?.subletting_allowed !== undefined ? clauseObj.subletting_allowed : sublet,
          pets_allowed: clauseObj?.pets_allowed !== undefined ? clauseObj.pets_allowed : pets,
          brokerage_paid_by: clauseObj?.brokerage_paid_by || brokerage,
          maintenance_paid_by: clauseObj?.maintenance_paid_by || maintenanceBy,
          custom_clauses: clauseObj?.custom_clauses || customClausesList,
        },
        updated_at: new Date().toISOString(),
      };

      let agreementUuid = currentId;

      if (!agreementUuid) {
        // Insert new agreement row
        payload.status = 'draft';
        const { data, error } = await supabaseClient
          .from('agreements')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw error;
        if (data) {
          agreementUuid = data.id;
          setAgreementId(data.id);
        }
      } else {
        // Update existing agreement row
        const { error } = await supabaseClient
          .from('agreements')
          .update(payload)
          .eq('id', agreementUuid);

        if (error) throw error;
      }

      if (agreementUuid) {
        // Upsert parties
        const lName = partObj?.landlord?.name || landlordName;
        const lPhone = partObj?.landlord?.phone || landlordPhone;
        const tName = partObj?.tenant?.name || tenantName;
        const tEmail = partObj?.tenant?.email || tenantEmail;
        const tPhone = partObj?.tenant?.phone || tenantPhone;

        const partiesUpsert = [
          {
            agreement_id: agreementUuid,
            role: 'landlord',
            name: lName,
            email: currentUser.email,
            phone: lPhone,
          },
        ];

        if (tEmail) {
          partiesUpsert.push({
            agreement_id: agreementUuid,
            role: 'tenant',
            name: tName,
            email: tEmail,
            phone: tPhone,
          });
        }

        // Fetch current parties to update or insert cleanly
        const { data: currentParties } = await supabaseClient
          .from('agreement_parties')
          .select('id, role')
          .eq('agreement_id', agreementUuid);

        for (const party of partiesUpsert) {
          const match = currentParties?.find((p) => p.role === party.role);
          if (match) {
            await supabaseClient
              .from('agreement_parties')
              .update(party)
              .eq('id', match.id);
          } else {
            await supabaseClient
              .from('agreement_parties')
              .insert(party);
          }
        }
      }
    } catch (err) {
      console.error('Error in autosave:', err);
    } finally {
      setSaving(false);
    }
  };

  // 3. Debounced trigger
  const triggerAutosave = (
    propObj: PropertyData | null,
    finObj: FinancialsData | null,
    partObj: PartiesData | null,
    clauseObj: ClausesData | null,
    termVal: number
  ) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      performSave(agreementId, propObj, finObj, partObj, clauseObj, termVal);
    }, 1200);
  };

  // 4. Form Action handles step navigation
  const handleNext = () => {
    setErrorMsg(null);
    const currentStep = step;

    if (currentStep === 1) {
      // Validate Step 1: Property
      const val = propertySchema.safeParse({ address, type: propType, furnishing });
      if (!val.success) {
        setErrorMsg(val.error.issues[0].message);
        return;
      }
      const propObj: PropertyData = { address, type: propType, furnishing };
      setProperty(propObj);
      triggerAutosave(propObj, financials, parties, clauses, parseInt(term, 10));
      setStep(2);
    } 
    else if (currentStep === 2) {
      // Validate Step 2: Financials
      const val = financialsSchema.safeParse({
        rent_amount: rent,
        deposit_amount: deposit,
        maintenance_amount: maintenance,
        due_date: dueDate,
        escalation_percentage: escalation,
      });
      if (!val.success) {
        setErrorMsg(val.error.issues[0].message);
        return;
      }
      const termMonths = parseInt(term, 10);
      if (termMonths > 11) {
        setErrorMsg('Term length must be 11 months or less (legal license scope limit).');
        return;
      }
      const finObj: FinancialsData = {
        rent_amount: parseFloat(rent),
        deposit_amount: parseFloat(deposit),
        maintenance_amount: parseFloat(maintenance),
        due_date: parseInt(dueDate, 10),
        escalation_percentage: parseFloat(escalation),
      };
      setFinancials(finObj);
      triggerAutosave(property, finObj, parties, clauses, termMonths);
      setStep(3);
    } 
    else if (currentStep === 3) {
      // Validate Step 3: Parties
      const val = partiesWizardSchema.safeParse({
        tenant: { name: tenantName, email: tenantEmail, phone: tenantPhone },
        landlord: { name: landlordName, email: currentUser.email, phone: landlordPhone },
      });
      if (!val.success) {
        setErrorMsg(val.error.issues[0].message);
        return;
      }
      const partObj: PartiesData = {
        tenant: { name: tenantName, email: tenantEmail, phone: tenantPhone },
        landlord: { name: landlordName, email: currentUser.email, phone: landlordPhone },
      };
      setParties(partObj);
      triggerAutosave(property, financials, partObj, clauses, parseInt(term, 10));
      setStep(4);
    } 
    else if (currentStep === 4) {
      // Validate Step 4: Clauses
      const val = clausesSchema.safeParse({
        lock_in_months: lockIn,
        notice_period_days: notice,
        subletting_allowed: sublet,
        pets_allowed: pets,
        brokerage_paid_by: brokerage,
        maintenance_paid_by: maintenanceBy,
        custom_clauses: customClausesList,
      });
      if (!val.success) {
        setErrorMsg(val.error.issues[0].message);
        return;
      }
      const clauseObj: ClausesData = {
        lock_in_months: parseInt(lockIn, 10),
        notice_period_days: parseInt(notice, 10),
        subletting_allowed: sublet,
        pets_allowed: pets,
        brokerage_paid_by: brokerage,
        maintenance_paid_by: maintenanceBy,
        custom_clauses: customClausesList,
      };
      setClauses(clauseObj);
      triggerAutosave(property, financials, parties, clauseObj, parseInt(term, 10));
      setStep(5);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // 5. Finalize Agreement and transition status to pending_confirmation
  const handleFinalize = async () => {
    if (!agreementId) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      // First force-save latest state to the database
      await performSave(agreementId, property, financials, parties, clauses, parseInt(term, 10));

      // Trigger the invite API route which generates tokens, flips status, and emails parties
      const res = await fetch(`/api/agreements/${agreementId}/invite`, {
        method: 'POST',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to send invitations.');
      }

      // Reset store state and redirect to dashboard
      resetStore();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error finalizing agreement:', err);
      setErrorMsg(err.message || 'Failed to lock and send the agreement.');
    } finally {
      setSaving(false);
    }
  };

  const addCustomClause = () => {
    if (!customClauseInput.trim()) return;
    const newList = [...customClausesList, customClauseInput.trim()];
    setCustomClausesList(newList);
    setCustomClauseInput('');
    // Trigger save
    if (clauses) {
      const clauseObj = { ...clauses, custom_clauses: newList };
      setClauses(clauseObj);
      triggerAutosave(property, financials, parties, clauseObj, parseInt(term, 10));
    }
  };

  const removeCustomClause = (idx: number) => {
    const newList = customClausesList.filter((_, i) => i !== idx);
    setCustomClausesList(newList);
    if (clauses) {
      const clauseObj = { ...clauses, custom_clauses: newList };
      setClauses(clauseObj);
      triggerAutosave(property, financials, parties, clauseObj, parseInt(term, 10));
    }
  };

  // 6. Generated Contract Text template
  const getContractText = () => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return `LEAVE AND LICENSE AGREEMENT

This Leave and License Agreement is entered into and executed on this ${today} at Mumbai.

BY AND BETWEEN:
${landlordName || '[Landlord Name]'}, residing at [Landlord Address] (hereinafter referred to as the 'LICENSOR', which expression shall mean and include his heirs, executors, administrators, and assigns) of the ONE PART.

AND:
${tenantName || '[Tenant Name]'}, residing at [Tenant Address] (hereinafter referred to as the 'LICENSEE', which expression shall mean and include his heirs, executors, administrators, and permitted assigns) of the OTHER PART.

WHEREAS:
The Licensor is the absolute owner of the premises situated at:
${address || '[Property Address]'}
(hereinafter referred to as the 'Licensed Premises').

NOW THIS DEED WITNESSETH AND IT IS MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:

1. DURATION:
The Licensor hereby grants to the Licensee the license to occupy the Licensed Premises for a period of ${term || '11'} months. Under no circumstances shall this term exceed 11 months without sub-registrar registration.

2. LICENSE FEE (RENT) & DEPOSIT:
The Licensee shall pay to the Licensor a monthly license fee of ₹${parseFloat(rent).toLocaleString('en-IN') || '0'} per month, payable on or before the ${dueDate || '1st'} day of each calendar month. The Licensee has deposited a sum of ₹${parseFloat(deposit).toLocaleString('en-IN') || '0'} as a security deposit, which shall be refunded interest-free upon vacating the premises.

3. MAINTENANCE CHARGES:
In addition to the rent, monthly society maintenance charges of ₹${parseFloat(maintenance).toLocaleString('en-IN') || '0'} shall be paid by the ${maintenanceBy === 'tenant' ? 'LICENSEE' : 'LICENSOR'}.

4. NOTICE & LOCK-IN PERIOD:
There shall be a notice period of ${notice || '30'} days by either party to terminate this license. The agreement contains a lock-in period of ${lockIn || '0'} months, during which neither party can terminate this agreement.

5. RESTRICTIONS:
- Subletting: The Licensee is ${sublet ? 'ALLOWED' : 'PROHIBITED'} from subletting or sharing the Licensed Premises.
- Pets: Pets are ${pets ? 'ALLOWED' : 'PROHIBITED'} in the Licensed Premises.
- Brokerage: Brokerage expenses are allocated to: ${brokerage.toUpperCase()}.

${customClausesList.length > 0 ? `6. ADDITIONAL CUSTOM CLAUSES:\n` + customClausesList.map((c, i) => `${i + 1}. ${c}`).join('\n') : ''}

IN WITNESS WHEREOF, the parties hereto have set their hands and seals on the day and year first above written.

LICENSOR: ___________________________
(${landlordName || 'Landlord'})

LICENSEE: ___________________________
(${tenantName || 'Tenant'})`;
  };

  const stepsList = [
    { num: 1, name: 'Property', icon: <HomeIcon className="h-4 w-4" /> },
    { num: 2, name: 'Financials', icon: <DollarSign className="h-4 w-4" /> },
    { num: 3, name: 'Parties', icon: <Users className="h-4 w-4" /> },
    { num: 4, name: 'Clauses', icon: <FileText className="h-4 w-4" /> },
    { num: 5, name: 'Review', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Link */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Wizard Steps Header */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex justify-between items-center overflow-x-auto gap-4">
          {stepsList.map((s) => (
            <div
              key={s.num}
              className={`flex items-center space-x-2 shrink-0 ${
                step === s.num
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : step > s.num
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-400 dark:text-slate-500 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-full border ${
                step === s.num
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20'
                  : step > s.num
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.icon}
              </div>
              <span className="text-xs md:text-sm">{s.num}. {s.name}</span>
            </div>
          ))}
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-4 bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20 rounded-lg flex gap-2.5 text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Form Cards */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-md">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Step {step} — {stepsList[step - 1].name}</CardTitle>
              <CardDescription>Fill out terms to build your license agreement.</CardDescription>
            </div>
            {isSaving && (
              <span className="inline-flex items-center gap-1 text-xs text-indigo-500 font-medium animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving draft...
              </span>
            )}
          </CardHeader>

          <CardContent className="space-y-6 min-h-[300px]">
            
            {/* STEP 1: PROPERTY FORM */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Full Property Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter the complete location address of the rented premises"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      triggerAutosave({ address: e.target.value, type: propType, furnishing }, financials, parties, clauses, parseInt(term, 10));
                    }}
                    required
                    className="bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propType">Property Type</Label>
                    <Select
                      value={propType}
                      onValueChange={(val: any) => {
                        const actualVal = val || 'apartment';
                        setPropType(actualVal);
                        triggerAutosave({ address, type: actualVal, furnishing }, financials, parties, clauses, parseInt(term, 10));
                      }}
                    >
                      <SelectTrigger id="propType" className="bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment / Flat</SelectItem>
                        <SelectItem value="independent_house">Independent House</SelectItem>
                        <SelectItem value="villa">Independent Villa</SelectItem>
                        <SelectItem value="pg_hostel">PG / Hostel Room</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="furnishing">Furnishing Status</Label>
                    <Select
                      value={furnishing}
                      onValueChange={(val: any) => {
                        const actualVal = val || 'unfurnished';
                        setFurnishing(actualVal);
                        triggerAutosave({ address, type: propType, furnishing: actualVal }, financials, parties, clauses, parseInt(term, 10));
                      }}
                    >
                      <SelectTrigger id="furnishing" className="bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
                        <SelectItem value="semi_furnished">Semi Furnished</SelectItem>
                        <SelectItem value="unfurnished">Unfurnished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: FINANCIALS FORM */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rent">Monthly Rent Amount (₹)</Label>
                    <Input
                      id="rent"
                      type="number"
                      placeholder="e.g. 25000"
                      value={rent}
                      onChange={(e) => {
                        setRent(e.target.value);
                        const fin = { rent_amount: parseFloat(e.target.value) || 0, deposit_amount: parseFloat(deposit) || 0, maintenance_amount: parseFloat(maintenance) || 0, due_date: parseInt(dueDate, 10) || 1, escalation_percentage: parseFloat(escalation) || 0 };
                        triggerAutosave(property, fin, parties, clauses, parseInt(term, 10));
                      }}
                      required
                      className="bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deposit">Security Deposit Amount (₹)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      placeholder="e.g. 100000"
                      value={deposit}
                      onChange={(e) => {
                        setDeposit(e.target.value);
                        const fin = { rent_amount: parseFloat(rent) || 0, deposit_amount: parseFloat(e.target.value) || 0, maintenance_amount: parseFloat(maintenance) || 0, due_date: parseInt(dueDate, 10) || 1, escalation_percentage: parseFloat(escalation) || 0 };
                        triggerAutosave(property, fin, parties, clauses, parseInt(term, 10));
                      }}
                      required
                      className="bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maintenance">Society Maintenance Fee (₹)</Label>
                    <Input
                      id="maintenance"
                      type="number"
                      placeholder="e.g. 2000"
                      value={maintenance}
                      onChange={(e) => {
                        setMaintenance(e.target.value);
                        const fin = { rent_amount: parseFloat(rent) || 0, deposit_amount: parseFloat(deposit) || 0, maintenance_amount: parseFloat(e.target.value) || 0, due_date: parseInt(dueDate, 10) || 1, escalation_percentage: parseFloat(escalation) || 0 };
                        triggerAutosave(property, fin, parties, clauses, parseInt(term, 10));
                      }}
                      className="bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Payment Due Date (Day of Month)</Label>
                    <Input
                      id="dueDate"
                      type="number"
                      placeholder="e.g. 5"
                      min="1"
                      max="31"
                      value={dueDate}
                      onChange={(e) => {
                        setDueDate(e.target.value);
                        const fin = { rent_amount: parseFloat(rent) || 0, deposit_amount: parseFloat(deposit) || 0, maintenance_amount: parseFloat(maintenance) || 0, due_date: parseInt(e.target.value, 10) || 1, escalation_percentage: parseFloat(escalation) || 0 };
                        triggerAutosave(property, fin, parties, clauses, parseInt(term, 10));
                      }}
                      className="bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="term">Agreement Duration (Months)</Label>
                    <Select
                      value={term}
                      onValueChange={(val) => {
                        const actualVal = val || '11';
                        setTerm(actualVal);
                        triggerAutosave(property, financials, parties, clauses, parseInt(actualVal, 10));
                      }}
                    >
                      <SelectTrigger id="term" className="bg-white dark:bg-slate-900 font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {m} Month{m > 1 ? 's' : ''} {m === 11 ? '(Capped Limit)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escalation">Optional Annual Escalation Percentage (%)</Label>
                  <Input
                    id="escalation"
                    type="number"
                    placeholder="e.g. 5"
                    min="0"
                    max="100"
                    value={escalation}
                    onChange={(e) => {
                      setEscalation(e.target.value);
                      const fin = { rent_amount: parseFloat(rent) || 0, deposit_amount: parseFloat(deposit) || 0, maintenance_amount: parseFloat(maintenance) || 0, due_date: parseInt(dueDate, 10) || 1, escalation_percentage: parseFloat(e.target.value) || 0 };
                      triggerAutosave(property, fin, parties, clauses, parseInt(term, 10));
                    }}
                    className="bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: PARTIES FORM */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Landlord details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-2">Landlord (You)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landlordName">Full Name</Label>
                      <Input
                        id="landlordName"
                        value={landlordName}
                        onChange={(e) => {
                          setLandlordName(e.target.value);
                          const partObj = { tenant: { name: tenantName, email: tenantEmail, phone: tenantPhone }, landlord: { name: e.target.value, email: currentUser.email, phone: landlordPhone } };
                          triggerAutosave(property, financials, partObj, clauses, parseInt(term, 10));
                        }}
                        className="bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landlordPhone">Phone Number</Label>
                      <Input
                        id="landlordPhone"
                        placeholder="e.g. 9876543210"
                        value={landlordPhone}
                        onChange={(e) => {
                          setLandlordPhone(e.target.value);
                          const partObj = { tenant: { name: tenantName, email: tenantEmail, phone: tenantPhone }, landlord: { name: landlordName, email: currentUser.email, phone: e.target.value } };
                          triggerAutosave(property, financials, partObj, clauses, parseInt(term, 10));
                        }}
                        className="bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Tenant details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-2">Tenant</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenantName">Full Name</Label>
                      <Input
                        id="tenantName"
                        placeholder="Enter tenant's legal name"
                        value={tenantName}
                        onChange={(e) => {
                          setTenantName(e.target.value);
                          const partObj = { tenant: { name: e.target.value, email: tenantEmail, phone: tenantPhone }, landlord: { name: landlordName, email: currentUser.email, phone: landlordPhone } };
                          triggerAutosave(property, financials, partObj, clauses, parseInt(term, 10));
                        }}
                        className="bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantEmail">Email Address</Label>
                      <Input
                        id="tenantEmail"
                        type="email"
                        placeholder="tenant@domain.com"
                        value={tenantEmail}
                        onChange={(e) => {
                          setTenantEmail(e.target.value);
                          const partObj = { tenant: { name: tenantName, email: e.target.value, phone: tenantPhone }, landlord: { name: landlordName, email: currentUser.email, phone: landlordPhone } };
                          triggerAutosave(property, financials, partObj, clauses, parseInt(term, 10));
                        }}
                        className="bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantPhone">Phone Number</Label>
                      <Input
                        id="tenantPhone"
                        placeholder="e.g. 9876543210"
                        value={tenantPhone}
                        onChange={(e) => {
                          setTenantPhone(e.target.value);
                          const partObj = { tenant: { name: tenantName, email: tenantEmail, phone: e.target.value }, landlord: { name: landlordName, email: currentUser.email, phone: landlordPhone } };
                          triggerAutosave(property, financials, partObj, clauses, parseInt(term, 10));
                        }}
                        className="bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CLAUSES FORM */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lockIn">Lock-In Period (Months)</Label>
                    <Input
                      id="lockIn"
                      type="number"
                      placeholder="e.g. 3"
                      value={lockIn}
                      onChange={(e) => {
                        setLockIn(e.target.value);
                        const cls = { lock_in_months: parseInt(e.target.value, 10) || 0, notice_period_days: parseInt(notice, 10) || 30, subletting_allowed: sublet, pets_allowed: pets, brokerage_paid_by: brokerage, maintenance_paid_by: maintenanceBy, custom_clauses: customClausesList };
                        triggerAutosave(property, financials, parties, cls, parseInt(term, 10));
                      }}
                      className="bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notice">Notice Period (Days)</Label>
                    <Input
                      id="notice"
                      type="number"
                      placeholder="e.g. 30"
                      value={notice}
                      onChange={(e) => {
                        setNotice(e.target.value);
                        const cls = { lock_in_months: parseInt(lockIn, 10) || 0, notice_period_days: parseInt(e.target.value, 10) || 30, subletting_allowed: sublet, pets_allowed: pets, brokerage_paid_by: brokerage, maintenance_paid_by: maintenanceBy, custom_clauses: customClausesList };
                        triggerAutosave(property, financials, parties, cls, parseInt(term, 10));
                      }}
                      className="bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brokerage">Brokerage Expenses Allocation</Label>
                    <Select
                      value={brokerage}
                      onValueChange={(val: any) => {
                        const actualVal = val || 'none';
                        setBrokerage(actualVal);
                        const cls = { lock_in_months: parseInt(lockIn, 10) || 0, notice_period_days: parseInt(notice, 10) || 30, subletting_allowed: sublet, pets_allowed: pets, brokerage_paid_by: actualVal, maintenance_paid_by: maintenanceBy, custom_clauses: customClausesList };
                        triggerAutosave(property, financials, parties, cls, parseInt(term, 10));
                      }}
                    >
                      <SelectTrigger id="brokerage" className="bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Brokerage</SelectItem>
                        <SelectItem value="landlord">Paid by Landlord</SelectItem>
                        <SelectItem value="tenant">Paid by Tenant</SelectItem>
                        <SelectItem value="shared">Shared Equally</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenanceBy">Society Maintenance Allocation</Label>
                    <Select
                      value={maintenanceBy}
                      onValueChange={(val: any) => {
                        const actualVal = val || 'tenant';
                        setMaintenanceBy(actualVal);
                        const cls = { lock_in_months: parseInt(lockIn, 10) || 0, notice_period_days: parseInt(notice, 10) || 30, subletting_allowed: sublet, pets_allowed: pets, brokerage_paid_by: brokerage, maintenance_paid_by: actualVal, custom_clauses: customClausesList };
                        triggerAutosave(property, financials, parties, cls, parseInt(term, 10));
                      }}
                    >
                      <SelectTrigger id="maintenanceBy" className="bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tenant">Paid by Tenant (Licensee)</SelectItem>
                        <SelectItem value="landlord">Paid by Landlord (Licensor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sublet}
                      onChange={(e) => {
                        setSublet(e.target.checked);
                        const cls = { lock_in_months: parseInt(lockIn, 10) || 0, notice_period_days: parseInt(notice, 10) || 30, subletting_allowed: e.target.checked, pets_allowed: pets, brokerage_paid_by: brokerage, maintenance_paid_by: maintenanceBy, custom_clauses: customClausesList };
                        triggerAutosave(property, financials, parties, cls, parseInt(term, 10));
                      }}
                      className="rounded border-slate-350 accent-indigo-650 h-4.5 w-4.5"
                    />
                    <span>Allow Subletting</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm font-semibold select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pets}
                      onChange={(e) => {
                        setPets(e.target.checked);
                        const cls = { lock_in_months: parseInt(lockIn, 10) || 0, notice_period_days: parseInt(notice, 10) || 30, subletting_allowed: sublet, pets_allowed: e.target.checked, brokerage_paid_by: brokerage, maintenance_paid_by: maintenanceBy, custom_clauses: customClausesList };
                        triggerAutosave(property, financials, parties, cls, parseInt(term, 10));
                      }}
                      className="rounded border-slate-350 accent-indigo-650 h-4.5 w-4.5"
                    />
                    <span>Allow Domestic Pets</span>
                  </label>
                </div>

                {/* Custom Clauses builder */}
                <div className="space-y-3 pt-4 border-t">
                  <Label>Custom Clauses (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type custom condition e.g. Tenant must paint the house upon exit"
                      value={customClauseInput}
                      onChange={(e) => setCustomClauseInput(e.target.value)}
                      className="bg-white dark:bg-slate-900"
                    />
                    <Button type="button" onClick={addCustomClause} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                      Add Clause
                    </Button>
                  </div>

                  {/* List of custom clauses */}
                  {customClausesList.length > 0 && (
                    <ul className="space-y-2 max-w-full">
                      {customClausesList.map((clauseText, i) => (
                        <li key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-950 border rounded-lg gap-4">
                          <span className="text-slate-600 dark:text-slate-300 leading-normal">{i + 1}. {clauseText}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomClause(i)}
                            className="text-red-500 hover:text-red-700 font-bold px-1"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW CONTRACT PREVIEW */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-950/50 rounded-lg text-xs md:text-sm">
                  <strong>Preview Mode:</strong> Review the automatically compiled Leave and License agreement text below before sending. Locking finalizes terms and invites the tenant to confirm.
                </div>

                {/* Simulated Stamp Paper Scroll */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-amber-50/5 dark:bg-slate-950 shadow-inner">
                  {/* Mock government stamp header */}
                  <div className="bg-amber-100/50 dark:bg-slate-900/50 py-4 px-6 border-b border-dashed border-amber-200/60 flex flex-col items-center select-none text-center">
                    <div className="text-xs uppercase font-extrabold tracking-widest text-amber-700/80">Government of India</div>
                    <div className="text-base font-extrabold text-amber-900/90 dark:text-amber-500">MOCK LEAVE & LICENSE CERTIFICATE</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Value: ₹100 | Transaction ID: RS-{agreementId?.slice(0,8).toUpperCase()}</div>
                  </div>
                  {/* Contract Scroll */}
                  <pre className="p-6 text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed select-text min-h-[400px]">
                    {getContractText()}
                  </pre>
                </div>
              </div>
            )}

          </CardContent>

          {/* Footer Controls */}
          <CardFooter className="flex justify-between border-t p-5 bg-slate-50/50 dark:bg-slate-900/30">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={step === 1 || isSaving}
              className="text-slate-700 dark:text-slate-300 font-bold border-slate-300"
            >
              Previous
            </Button>

            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Next Step <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinalize}
                disabled={isSaving || !agreementId}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Finalizing...
                  </>
                ) : (
                  <>
                    Lock & Send Agreement <Save className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}

export default function NewAgreement() {
  return (
    <Suspense fallback={
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    }>
      <WizardContent />
    </Suspense>
  );
}
