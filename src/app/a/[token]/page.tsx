'use client';

import { useState, useEffect, use, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Fingerprint, 
  Check, 
  ArrowRight,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface Party {
  id: string;
  role: 'landlord' | 'tenant';
  name: string;
  email: string;
  phone: string;
  confirmed_at: string | null;
  signed_at: string | null;
}

interface Agreement {
  id: string;
  status: 'draft' | 'pending_confirmation' | 'ready_for_signature' | 'signing_complete' | 'completed' | 'expired' | 'voided';
  version: number;
  rent_amount: number;
  deposit_amount: number;
  maintenance_amount: number;
  term_months: number;
  property_json: {
    address: string;
    type: string;
    furnishing: string;
    due_date?: number;
  };
  clauses_json: {
    lock_in_months: number;
    notice_period_days: number;
    subletting_allowed: boolean;
    pets_allowed: boolean;
    brokerage_paid_by: string;
    maintenance_paid_by: string;
    custom_clauses?: string[];
  };
  created_at: string;
}

export default function AgreementHub({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [otherParty, setOtherParty] = useState<Party | null>(null);
  const [role, setRole] = useState<'landlord' | 'tenant' | null>(null);
  const [status, setStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch details from server API
  const fetchHubDetails = async () => {
    try {
      const res = await fetch(`/api/a/${token}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'invalid_or_expired') {
          router.push(`/a/${token}/expired`);
        } else {
          router.push(`/a/${token}/not-found`);
        }
        return;
      }

      if (data.status === 'completed') {
        router.push(`/a/${token}/complete`);
        return;
      }

      setAgreement(data.agreement);
      setParty(data.party);
      setOtherParty(data.otherParty);
      setRole(data.role);
      setStatus(data.status);
    } catch (err) {
      console.error('Error loading hub details:', err);
      setErrorMsg('Failed to sync agreement details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubDetails();
  }, [token, router]);

  // 2. Setup Realtime Sync Subscription
  useEffect(() => {
    if (!agreement?.id) return;

    // Listen for events on public tables for this specific agreement
    const channel = supabaseClient
      .channel(`realtime-hub-${agreement.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agreement_parties',
          filter: `agreement_id=eq.${agreement.id}`,
        },
        () => {
          // Re-fetch server details when parties status changes (confirmed, signed)
          fetchHubDetails();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agreements',
          filter: `id=eq.${agreement.id}`,
        },
        () => {
          // Re-fetch details when agreement state changes (status transitions)
          fetchHubDetails();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [agreement?.id]);

  // 3. Confirm terms handler
  const handleConfirmTerms = async () => {
    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/a/${token}/confirm`, {
        method: 'POST',
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to record your confirmation.');
      }

      // Re-fetch local state
      await fetchHubDetails();
    } catch (err: any) {
      console.error('Error confirming terms:', err);
      setErrorMsg(err.message || 'An error occurred during confirmation.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (statusVal: string) => {
    switch (statusVal) {
      case 'pending_confirmation':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40';
      case 'ready_for_signature':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40';
      case 'signing_complete':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const formatStatus = (statusVal: string) => {
    return statusVal.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getContractText = () => {
    if (!agreement) return '';

    const today = new Date(agreement.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const landlordName = role === 'landlord' ? party?.name : otherParty?.name;
    const tenantName = role === 'tenant' ? party?.name : otherParty?.name;

    return `LEAVE AND LICENSE AGREEMENT

This Leave and License Agreement is entered into and executed on this ${today} at Mumbai.

BY AND BETWEEN:
${landlordName || '[Landlord Name]'}, residing at [Landlord Address] (hereinafter referred to as the 'LICENSOR', which expression shall mean and include his heirs, executors, administrators, and assigns) of the ONE PART.

AND:
${tenantName || '[Tenant Name]'}, residing at [Tenant Address] (hereinafter referred to as the 'LICENSEE', which expression shall mean and include his heirs, executors, administrators, and permitted assigns) of the OTHER PART.

WHEREAS:
The Licensor is the absolute owner of the premises situated at:
${agreement.property_json?.address || '[Property Address]'}
(hereinafter referred to as the 'Licensed Premises').

NOW THIS DEED WITNESSETH AND IT IS MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:

1. DURATION:
The Licensor hereby grants to the Licensee the license to occupy the Licensed Premises for a period of ${agreement.term_months || '11'} months. Under no circumstances shall this term exceed 11 months without sub-registrar registration.

2. LICENSE FEE (RENT) & DEPOSIT:
The Licensee shall pay to the Licensor a monthly license fee of ₹${agreement.rent_amount?.toLocaleString('en-IN') || '0'} per month, payable on or before the ${agreement.property_json?.due_date || '1st'} day of each calendar month. The Licensee has deposited a sum of ₹${agreement.deposit_amount?.toLocaleString('en-IN') || '0'} as a security deposit, which shall be refunded interest-free upon vacating the premises.

3. MAINTENANCE CHARGES:
In addition to the rent, monthly society maintenance charges of ₹${agreement.maintenance_amount?.toLocaleString('en-IN') || '0'} shall be paid by the ${agreement.clauses_json?.maintenance_paid_by === 'tenant' ? 'LICENSEE' : 'LICENSOR'}.

4. NOTICE & LOCK-IN PERIOD:
There shall be a notice period of ${agreement.clauses_json?.notice_period_days || '30'} days by either party to terminate this license. The agreement contains a lock-in period of ${agreement.clauses_json?.lock_in_months || '0'} months, during which neither party can terminate this agreement.

5. RESTRICTIONS:
- Subletting: The Licensee is ${agreement.clauses_json?.subletting_allowed ? 'ALLOWED' : 'PROHIBITED'} from subletting or sharing the Licensed Premises.
- Pets: Pets are ${agreement.clauses_json?.pets_allowed ? 'ALLOWED' : 'PROHIBITED'} in the Licensed Premises.
- Brokerage: Brokerage expenses are allocated to: ${agreement.clauses_json?.brokerage_paid_by?.toUpperCase() || 'NONE'}.

${agreement.clauses_json?.custom_clauses && agreement.clauses_json.custom_clauses.length > 0 ? `6. ADDITIONAL CUSTOM CLAUSES:\n` + agreement.clauses_json.custom_clauses.map((c, i) => `${i + 1}. ${c}`).join('\n') : ''}

IN WITNESS WHEREOF, the parties hereto have set their hands and seals on the day and year first above written.

LICENSOR: ___________________________
(${landlordName || 'Landlord'})

LICENSEE: ___________________________
(${tenantName || 'Tenant'})`;
  };

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-indigo-650 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading agreement hub...</p>
        </div>
      </div>
    );
  }

  if (!agreement || !party) return null;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusBadgeColor(status)}`}>
                {formatStatus(status)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Agreement ID: {agreement.id.slice(0, 8)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Agreement Hub
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Viewing invitation as: <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">{role} ({party.name})</span>
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20 rounded-lg flex gap-2.5 text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contract preview (Left) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-950 py-3 px-5 border-b flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> LEAVE_LICENSE_DRAFT.txt</span>
                <span>v{agreement.version}</span>
              </div>
              <pre className="p-6 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed min-h-[400px] max-h-[600px] overflow-y-auto">
                {getContractText()}
              </pre>
            </div>
          </div>

          {/* Action and party tracker panel (Right) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Interactive Action Card */}
            <Card className="border-indigo-150 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
              <div className="bg-indigo-600 px-6 py-4 text-white">
                <h3 className="font-extrabold text-base">Your Action Panel</h3>
                <p className="text-xs text-indigo-200">State machine driven controls</p>
              </div>
              <CardContent className="p-6">
                
                {/* 1. PENDING CONFIRMATION STATE */}
                {status === 'pending_confirmation' && (
                  <div className="space-y-4">
                    {party.confirmed_at === null ? (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Please review the agreement text on the left carefully. If the financials, rent, deposit, and customized clauses are correct, confirm the terms.
                        </p>
                        <Button 
                          onClick={handleConfirmTerms}
                          disabled={actionLoading}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 shadow-sm"
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Recording confirmation...
                            </>
                          ) : (
                            <>
                              Confirm Agreement Terms <Check className="ml-1.5 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-3 bg-slate-50 dark:bg-slate-950 rounded-lg p-4 border border-dashed">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Terms Confirmed</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                          You verified the terms at {new Date(party.confirmed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Waiting for the other party to confirm.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. READY FOR SIGNATURE STATE */}
                {status === 'ready_for_signature' && (
                  <div className="space-y-4">
                    {party.signed_at === null ? (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Both parties have confirmed the agreement terms. The contract is now locked and ready to be digitally signed using e-sign verification.
                        </p>
                        <Link href={`/a/${token}/sign`}>
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 shadow-sm">
                            Proceed to E-Sign <Fingerprint className="ml-1.5 h-4.5 w-4.5" />
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-3 bg-slate-50 dark:bg-slate-950 rounded-lg p-4 border border-dashed">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-full w-fit mx-auto border border-emerald-100">
                          <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Agreement Signed</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                          You executed the signature at {new Date(party.signed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Waiting for the other party to sign.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2.5 SIGNING COMPLETE STATE */}
                {status === 'signing_complete' && (
                  <div className="text-center py-6 space-y-3 bg-emerald-500/5 dark:bg-emerald-950/10 rounded-lg p-4 border border-emerald-500/20">
                    <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <h4 className="font-bold text-sm text-emerald-850 dark:text-emerald-400">Signing Complete</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                      Both parties have successfully e-signed the agreement. The final certified document is being prepared.
                    </p>
                  </div>
                )}

                {/* 3. COMPLETED STATE */}
                {status === 'completed' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      The agreement has been signed by both parties and successfully compiled into a certified PDF.
                    </p>
                    <Link href={`/a/${token}/complete`}>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 shadow-sm">
                        View Executed Agreement <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}

                {/* 4. EXPIRED / VOIDED STATES */}
                {status === 'voided' && (
                  <div className="text-center py-6 space-y-3 bg-red-500/5 dark:bg-red-950/10 rounded-lg p-4 border border-red-500/20">
                    <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto" />
                    <h4 className="font-bold text-sm text-red-650 dark:text-red-400">Agreement Voided</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                      This rental agreement has been withdrawn and voided by the landlord. It is no longer active, and no further actions can be taken.
                    </p>
                  </div>
                )}
                {status === 'expired' && (
                  <div className="text-center py-6 space-y-3 bg-amber-500/5 dark:bg-amber-950/10 rounded-lg p-4 border border-amber-500/20">
                    <AlertCircle className="h-8 w-8 text-amber-500 dark:text-amber-450 mx-auto" />
                    <h4 className="font-bold text-sm text-amber-650 dark:text-amber-400">Agreement Expired</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                      This agreement draft has expired and is no longer active.
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Live Progress Tracker Card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Users className="h-4.5 w-4.5 text-slate-400" /> Party Progress Tracker</CardTitle>
                <CardDescription className="text-xs">Monitors confirmations and signatures live</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Active Party Row */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs border">
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase block">{role} (You)</span>
                    <span className="text-slate-500 block">{party.name}</span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`inline-flex items-center gap-1 font-bold ${party.confirmed_at ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {party.confirmed_at ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Confirmed
                        </>
                      ) : (
                        'Pending Confirmation'
                      )}
                    </span>
                    <span className={`block font-bold ${party.signed_at ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {party.signed_at ? '✓ Signed' : 'Pending Sign'}
                    </span>
                  </div>
                </div>

                {/* Other Party Row */}
                {otherParty ? (
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs border">
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase block">{otherParty.role}</span>
                      <span className="text-slate-500 block">{otherParty.name}</span>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`inline-flex items-center gap-1 font-bold ${otherParty.confirmed_at ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {otherParty.confirmed_at ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Confirmed
                          </>
                        ) : (
                          'Pending Confirmation'
                        )}
                      </span>
                      <span className={`block font-bold ${otherParty.signed_at ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {otherParty.signed_at ? '✓ Signed' : 'Pending Sign'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic text-center p-2">
                    Waiting for tenant info to be filled...
                  </div>
                )}

              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
