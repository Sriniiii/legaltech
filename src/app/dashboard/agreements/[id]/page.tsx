'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  ArrowLeft, 
  Users, 
  FileText, 
  Mail, 
  Trash2, 
  XCircle,
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Party {
  id: string;
  role: 'landlord' | 'tenant';
  name: string;
  email: string;
  phone: string;
  token?: string;
  token_expires_at?: string;
  confirmed_at: string | null;
  signed_at: string | null;
  signature_meta_json?: any;
}

interface AuditLog {
  id: string;
  action: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  metadata_json: any;
  party_id: string | null;
}

interface Agreement {
  id: string;
  status: 'draft' | 'pending_confirmation' | 'ready_for_signature' | 'signing_complete' | 'completed' | 'expired' | 'voided';
  version: number;
  rent_amount: number;
  deposit_amount: number;
  maintenance_amount: number;
  term_months: number;
  lock_in_months: number;
  notice_period_days: number;
  property_json: {
    address: string;
    type: string;
    furnishing: string;
    due_date?: number;
  };
  clauses_json: {
    lock_in_months?: number;
    notice_period_days?: number;
    subletting_allowed?: boolean;
    pets_allowed?: boolean;
    brokerage_paid_by?: string;
    maintenance_paid_by?: string;
    custom_clauses?: string[];
  };
  created_at: string;
}

export default function AgreementDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: agreementId } = use(params);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // 1. Fetch details on mount
  const fetchDetails = async () => {
    try {
      setErrorMsg(null);

      // Verify Auth Session first
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch agreement (scoped to owner_id = auth.uid() automatically via RLS)
      const { data: agData, error: agErr } = await supabaseClient
        .from('agreements')
        .select('*')
        .eq('id', agreementId)
        .single();

      if (agErr || !agData) {
        throw new Error(agErr?.message || 'Agreement not found or access denied.');
      }

      setAgreement(agData);

      // Fetch parties (scoped via RLS owner policy)
      const { data: pData, error: pErr } = await supabaseClient
        .from('agreement_parties')
        .select('*')
        .eq('agreement_id', agreementId);

      if (pErr) throw pErr;
      setParties(pData || []);

      // Fetch audit logs (scoped via RLS owner policy)
      const { data: logData, error: logErr } = await supabaseClient
        .from('audit_log')
        .select('*')
        .eq('agreement_id', agreementId)
        .order('created_at', { ascending: false });

      if (logErr) throw logErr;
      setAuditLogs(logData || []);

      // Fetch signed PDF URL if completed
      if (agData.status === 'completed') {
        const { data: docData } = await supabaseClient
          .from('documents')
          .select('*')
          .eq('agreement_id', agreementId)
          .order('version', { ascending: false })
          .limit(1)
          .single();

        if (docData) {
          setDownloadUrl(`/api/agreements/${agreementId}/pdf-url`);
        }
      }
    } catch (err: any) {
      console.error('Error fetching details:', err);
      setErrorMsg(err.message || 'Failed to load agreement details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [agreementId, router]);

  // Actions handlers
  const handleResendInvites = async () => {
    setActionLoading('invite');
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/agreements/${agreementId}/invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend invitations.');
      }
      setSuccessMsg('Agreement invitations resent successfully.');
      await fetchDetails();
    } catch (err: any) {
      console.error('Invite error:', err);
      setErrorMsg(err.message || 'Failed to dispatch email invites.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVoidAgreement = async () => {
    if (!confirm('Are you sure you want to void/cancel this agreement? This action is permanent and invalidates all token links.')) {
      return;
    }

    setActionLoading('void');
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/agreements/${agreementId}/void`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to void agreement.');
      }
      setSuccessMsg('Agreement has been cancelled and voided.');
      await fetchDetails();
    } catch (err: any) {
      console.error('Void error:', err);
      setErrorMsg(err.message || 'Failed to void the agreement.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAgreement = async () => {
    if (!confirm('Are you sure you want to permanently delete this agreement? This action cannot be undone and will remove all associated logs and sign links.')) {
      return;
    }

    setActionLoading('delete');
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/agreements/${agreementId}/delete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete agreement.');
      }
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorMsg(err.message || 'Failed to delete the agreement.');
      setActionLoading(null);
    }
  };

  const handleRenewAgreement = async () => {
    setActionLoading('renew');
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/agreements/${agreementId}/renew`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clone agreement.');
      }
      
      // Redirect to wizard editor with the new agreement ID
      router.push(`/dashboard/new?id=${data.newAgreementId}`);
    } catch (err: any) {
      console.error('Renew error:', err);
      setErrorMsg(err.message || 'Failed to initiate agreement renewal.');
      setActionLoading(null);
    }
  };

  const handleCompleteAgreement = async () => {
    setActionLoading('complete');
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/agreements/${agreementId}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete agreement and compile PDF.');
      }
      setSuccessMsg('Agreement completed and PDF compiled successfully.');
      await fetchDetails();
    } catch (err: any) {
      console.error('Complete error:', err);
      setErrorMsg(err.message || 'Failed to complete agreement.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeColor = (statusVal: string) => {
    switch (statusVal) {
      case 'draft':
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
      case 'pending_confirmation':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40';
      case 'ready_for_signature':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40';
      case 'signing_complete':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40';
      case 'expired':
      case 'voided':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const formatStatus = (statusVal: string) => {
    return statusVal.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getActionName = (action: string) => {
    switch (action) {
      case 'created': return 'Agreement Draft Created';
      case 'invited': return 'Invitations Dispatched';
      case 'confirmed': return 'Terms Confirmed';
      case 'signed': return 'E-Signed Verified';
      case 'status_ready_for_signature': return 'Agreement Ready to Sign';
      case 'status_signing_complete': return 'Agreement Signing Complete';
      case 'status_completed': return 'Agreement Execution Completed';
      case 'status_expired': return 'Agreement Expired';
      case 'voided': return 'Agreement Cancelled/Voided';
      case 'renewed': return 'Agreement Cloned for Renewal';
      case 'reminder_sent': return 'Activity Reminder Email Dispatched';
      default: return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const getTimelineEventColor = (action: string) => {
    if (['signed', 'status_completed', 'status_signing_complete'].includes(action)) return 'bg-emerald-500 border-emerald-200 dark:border-emerald-900';
    if (['status_expired', 'voided'].includes(action)) return 'bg-red-500 border-red-200 dark:border-red-900';
    if (action === 'reminder_sent') return 'bg-amber-500 border-amber-200 dark:border-amber-900';
    return 'bg-indigo-600 border-indigo-200 dark:border-indigo-900';
  };

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-indigo-650 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading agreement dashboard...</p>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-12 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Agreement Missing</h2>
          <p className="text-sm text-slate-500">{errorMsg || 'Unable to locate this agreement or access is denied.'}</p>
          <Link href="/dashboard">
            <Button className="mt-2">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const landlordParty = parties.find(p => p.role === 'landlord');
  const tenantParty = parties.find(p => p.role === 'tenant');

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back and Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <span className="text-xs text-slate-400">
            Version {agreement.version}
          </span>
        </div>

        {/* Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Agreement Tracker
              </h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusBadgeColor(agreement.status)}`}>
                {formatStatus(agreement.status)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Agreement ID: <span className="font-mono">{agreement.id}</span>
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20 rounded-lg flex gap-2.5 text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg flex gap-2.5 text-sm font-medium">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Tracking detail block (Left) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Agreement Actions Card */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="bg-slate-950/40 px-6 py-4 border-b flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Workflow Operations</h3>
              </div>
              <CardContent className="p-6">
                
                <div className="flex flex-wrap gap-4">
                  {/* Draft stage actions */}
                  {agreement.status === 'draft' && (
                    <>
                      <Link href={`/dashboard/new?id=${agreement.id}`}>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 text-xs">
                          Complete Wizard Draft
                        </Button>
                      </Link>
                      <Button 
                        onClick={handleVoidAgreement}
                        disabled={actionLoading === 'void'}
                        variant="destructive"
                        className="font-bold py-2 text-xs flex items-center gap-1.5"
                      >
                        {actionLoading === 'void' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Void Agreement
                      </Button>
                    </>
                  )}

                  {/* Pending actions */}
                  {['pending_confirmation', 'ready_for_signature'].includes(agreement.status) && (
                    <>
                      <Button 
                        onClick={handleResendInvites}
                        disabled={actionLoading === 'invite'}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 text-xs flex items-center gap-1.5"
                      >
                        {actionLoading === 'invite' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        Resend Invitation Email
                      </Button>
                      
                      <Button 
                        onClick={handleVoidAgreement}
                        disabled={actionLoading === 'void'}
                        variant="destructive"
                        className="font-bold py-2 text-xs flex items-center gap-1.5"
                      >
                        {actionLoading === 'void' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Void Agreement
                      </Button>
                    </>
                  )}

                  {/* Completed agreement actions */}
                  {agreement.status === 'completed' && (
                    <>
                      {downloadUrl ? (
                        <Button 
                          onClick={() => window.open(downloadUrl, '_blank')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-xs flex items-center gap-1.5"
                        >
                          <Download className="h-4 w-4" /> Download Executed PDF
                        </Button>
                      ) : (
                        <div className="text-xs text-amber-500 font-medium">Preparing download link...</div>
                      )}

                      <Button 
                        onClick={handleRenewAgreement}
                        disabled={actionLoading === 'renew'}
                        variant="outline"
                        className="font-bold py-2 text-xs flex items-center gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                      >
                        {actionLoading === 'renew' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Clone for Renewal
                      </Button>
                    </>
                  )}

                  {/* Expired / Voided / Signing Complete actions */}
                  {agreement.status === 'signing_complete' && (
                    <Button 
                      onClick={handleCompleteAgreement}
                      disabled={actionLoading === 'complete'}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-xs flex items-center gap-1.5"
                    >
                      {actionLoading === 'complete' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Generate PDF & Complete
                    </Button>
                  )}

                  {['expired', 'voided', 'signing_complete'].includes(agreement.status) && (
                    <Button 
                      onClick={handleRenewAgreement}
                      disabled={actionLoading === 'renew'}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 text-xs flex items-center gap-1.5"
                    >
                      {actionLoading === 'renew' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Clone to New Draft
                    </Button>
                  )}

                  {/* Always allow deleting the agreement */}
                  <Button 
                    onClick={handleDeleteAgreement}
                    disabled={actionLoading === 'delete'}
                    variant="outline"
                    className="border-red-200 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold py-2 text-xs flex items-center gap-1.5"
                  >
                    {actionLoading === 'delete' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete Agreement
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Parties Summary Card */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Users className="h-4.5 w-4.5 text-slate-400" /> Contract Parties</CardTitle>
                <CardDescription className="text-xs">Current verification and signing status</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                
                {/* Landlord Row */}
                {landlordParty && (
                  <div className="flex flex-col p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs border gap-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-500 uppercase block">Landlord (You)</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{landlordParty.name}</span>
                        <span className="text-slate-400 block">{landlordParty.email} | {landlordParty.phone}</span>
                      </div>
                      <div className="text-right space-y-1 font-bold">
                        <span className={`block ${landlordParty.confirmed_at ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {landlordParty.confirmed_at ? '✓ Confirmed' : 'Pending Confirmation'}
                        </span>
                        <span className={`block ${landlordParty.signed_at ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {landlordParty.signed_at ? '✓ Signed' : 'Pending Signature'}
                        </span>
                      </div>
                    </div>
                    {landlordParty.token && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Your Signature Hub Link:</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/a/${landlordParty.token}`}
                            className="bg-white dark:bg-slate-900 border rounded px-2 py-1 text-[10px] flex-1 font-mono text-slate-500 truncate"
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="py-1 px-2.5 text-[10px] h-auto font-bold"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/a/${landlordParty.token}`);
                              alert('Landlord signing link copied to clipboard!');
                            }}
                          >
                            Copy
                          </Button>
                          <a 
                            href={`/a/${landlordParty.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" className="bg-indigo-650 hover:bg-indigo-700 text-white py-1 px-2.5 text-[10px] h-auto font-bold">
                              Open Link
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tenant Row */}
                {tenantParty && (
                  <div className="flex flex-col p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs border gap-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-500 uppercase block">Tenant</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{tenantParty.name}</span>
                        <span className="text-slate-400 block">{tenantParty.email} | {tenantParty.phone}</span>
                      </div>
                      <div className="text-right space-y-1 font-bold">
                        <span className={`block ${tenantParty.confirmed_at ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {tenantParty.confirmed_at ? '✓ Confirmed' : 'Pending Confirmation'}
                        </span>
                        <span className={`block ${tenantParty.signed_at ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {tenantParty.signed_at ? '✓ Signed' : 'Pending Signature'}
                        </span>
                      </div>
                    </div>
                    {tenantParty.token && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">Tenant's Signature Hub Link:</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/a/${tenantParty.token}`}
                            className="bg-white dark:bg-slate-900 border rounded px-2 py-1 text-[10px] flex-1 font-mono text-slate-500 truncate"
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="py-1 px-2.5 text-[10px] h-auto font-bold"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/a/${tenantParty.token}`);
                              alert('Tenant signing link copied to clipboard!');
                            }}
                          >
                            Copy
                          </Button>
                          <a 
                            href={`/a/${tenantParty.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" className="bg-indigo-650 hover:bg-indigo-700 text-white py-1 px-2.5 text-[10px] h-auto font-bold">
                              Open Link
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Contract terms review */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5"><FileText className="h-4.5 w-4.5 text-slate-400" /> Contract Details Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Rent Fee:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Rs. {agreement.rent_amount.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Security Deposit:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Rs. {agreement.deposit_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Society Maintenance:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Rs. {agreement.maintenance_amount.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Contract Term:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{agreement.term_months} Months</span>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <span className="text-slate-400 block mb-1">Property Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-normal">{agreement.property_json?.address}</span>
                </div>

                {agreement.clauses_json?.custom_clauses && agreement.clauses_json.custom_clauses.length > 0 && (
                  <div>
                    <span className="text-slate-400 block mb-2 font-bold">Custom Clauses:</span>
                    <ul className="space-y-1.5 pl-4 list-decimal text-slate-600 dark:text-slate-400">
                      {agreement.clauses_json.custom_clauses.map((c, i) => (
                        <li key={i} className="leading-relaxed">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Dotted Audit timeline (Right) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm min-h-[450px]">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Calendar className="h-4.5 w-4.5 text-slate-400" /> Cryptographic Audit Trail</CardTitle>
                  <CardDescription className="text-[10px] mt-0.5">Immutable event history for compliance</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                
                {auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 italic text-xs">
                    No activities recorded yet.
                  </div>
                ) : (
                  <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative">
                        {/* Bullet point node */}
                        <span className={`absolute -left-[30px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${getTimelineEventColor(log.action)}`} />
                        
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                            {getActionName(log.action)}
                          </h4>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(log.created_at).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Kolkata'
                            })} (IST)
                          </span>
                          
                          {log.metadata_json?.message && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-1">
                              {log.metadata_json.message}
                            </p>
                          )}

                          {log.ip && (
                            <div className="text-[9px] text-slate-400 font-mono flex flex-wrap gap-x-2 mt-1">
                              <span>IP: {log.ip}</span>
                              {log.user_agent && <span className="truncate max-w-[200px]" title={log.user_agent}>UA: {log.user_agent}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
