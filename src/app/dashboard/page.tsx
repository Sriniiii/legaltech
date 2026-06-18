'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, User, Calendar, ShieldAlert, Loader2, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Party {
  id: string;
  role: 'landlord' | 'tenant';
  name: string;
  email: string;
  phone: string;
  token?: string;
}

interface Agreement {
  id: string;
  status: 'draft' | 'pending_confirmation' | 'ready_for_signature' | 'signing_complete' | 'completed' | 'expired' | 'voided';
  version: number;
  rent_amount: number;
  deposit_amount: number;
  term_months: number;
  property_json: {
    address: string;
    type: string;
    furnishing: string;
  };
  created_at: string;
  agreement_parties: Party[];
  documents?: {
    id: string;
  }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);

  useEffect(() => {
    async function getProfileAndData() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUserEmail(user.email ?? 'Landlord');

        // Fetch agreements and their associated parties
        const { data, error } = await supabaseClient
          .from('agreements')
          .select(`
            *,
            agreement_parties (
              id,
              role,
              name,
              email,
              phone,
              token
            ),
            documents (
              id
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setAgreements((data as unknown as Agreement[]) ?? []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    getProfileAndData();
  }, [router]);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'pending_confirmation':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40';
      case 'ready_for_signature':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/40';
      case 'signing_complete':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/40';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const activeAgreements = agreements.filter(a => a.status === 'completed');
  const draftAgreements = agreements.filter(a => a.status === 'draft');
  const pendingAgreements = agreements.filter(a => ['pending_confirmation', 'ready_for_signature', 'signing_complete'].includes(a.status));

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your agreements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Landlord Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Logged in as: <span className="font-semibold text-slate-700 dark:text-slate-200">{userEmail}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 dark:text-slate-300 font-semibold shrink-0"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Log Out
            </Button>
            <Link href="/dashboard/new" className="w-full sm:w-auto">
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/15">
                <Plus className="h-4 w-4 mr-1" /> New Agreement
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <CardHeader className="py-4">
              <CardDescription className="text-xs uppercase font-bold tracking-wider">Active Contracts</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {activeAgreements.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <CardHeader className="py-4">
              <CardDescription className="text-xs uppercase font-bold tracking-wider">Pending Action</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {pendingAgreements.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <CardHeader className="py-4">
              <CardDescription className="text-xs uppercase font-bold tracking-wider">Drafts</CardDescription>
              <CardTitle className="text-3xl font-extrabold text-slate-600 dark:text-slate-400 font-mono">
                {draftAgreements.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Agreements Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Agreements</h2>

          {agreements.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
              <div className="p-3 bg-indigo-50 dark:bg-slate-950 rounded-full w-fit mx-auto mb-4 border border-indigo-150 dark:border-indigo-950">
                <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">No agreements yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                You haven't created any license contracts. Tap the button below to start our 5-step draft builder.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/new">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 shadow-md shadow-indigo-600/15">
                    Create New Agreement
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Grid layout */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agreements.map((agreement) => {
                const tenant = agreement.agreement_parties?.find((p) => p.role === 'tenant');
                const landlordParty = agreement.agreement_parties?.find((p) => p.role === 'landlord');

                return (
                  <Card key={agreement.id} className="border-slate-200/60 dark:border-slate-800/60 hover:shadow-md transition-shadow flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-5 flex justify-between items-start border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getStatusColor(agreement.status)}`}>
                          {formatStatus(agreement.status)}
                        </span>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug pt-1 hover:text-indigo-650 transition-colors">
                          <Link href={agreement.status === 'draft' ? `/dashboard/new?id=${agreement.id}` : `/dashboard/agreements/${agreement.id}`}>
                            {agreement.property_json?.address || 'Unnamed Draft Property'}
                          </Link>
                        </h3>
                      </div>
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap pt-1">
                        v{agreement.version}
                      </span>
                    </div>

                    {/* Details */}
                    <CardContent className="p-5 space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-slate-400 block font-semibold uppercase tracking-wider">Tenant</span>
                          <span className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {tenant?.name || 'Not specified'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 block font-semibold uppercase tracking-wider">Financials</span>
                          <span className="text-slate-700 dark:text-slate-200 font-bold font-mono">
                            ₹{agreement.rent_amount?.toLocaleString('en-IN') || 0} /mo
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-50 dark:border-slate-800/50 pt-3">
                        <div className="space-y-1">
                          <span className="text-slate-400 block font-semibold uppercase tracking-wider">Duration</span>
                          <span className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {agreement.term_months || 11} Months
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 block font-semibold uppercase tracking-wider">Created At</span>
                          <span className="text-slate-700 dark:text-slate-200 font-medium">
                            {new Date(agreement.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>

                    {/* Action button */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">
                        ID: {agreement.id.slice(0, 8)}...
                      </span>

                      {agreement.status === 'draft' ? (
                        <div className="flex gap-2">
                          <Link href={`/dashboard/agreements/${agreement.id}`}>
                            <Button size="sm" variant="outline" className="text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold border-red-200">
                              Delete
                            </Button>
                          </Link>
                          <Link href={`/dashboard/new?id=${agreement.id}`}>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/10">
                              Resume Draft <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Link href={`/dashboard/agreements/${agreement.id}`}>
                            <Button size="sm" variant="outline" className="text-slate-700 dark:text-slate-300 font-bold border-slate-300">
                              Manage / Delete
                            </Button>
                          </Link>
                          {agreement.status === 'completed' && agreement.documents && agreement.documents.length > 0 ? (
                            <a href={`/api/agreements/${agreement.id}/pdf-url`} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/10">
                                Download PDF
                              </Button>
                            </a>
                          ) : (
                            landlordParty?.token && (
                              <Link href={`/a/${landlordParty.token}`} target="_blank">
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/10">
                                  View Hub <ShieldCheck className="h-3.5 w-3.5 ml-1" />
                                </Button>
                              </Link>
                            )
                          )}
                        </div>
                      )}
                    </div>

                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
