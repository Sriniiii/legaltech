'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  CheckCircle2, 
  FileDown, 
  ShieldCheck, 
  Clock, 
  User, 
  UserCheck, 
  ExternalLink,
  ArrowLeft
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
  signature_meta_json?: {
    ip?: string;
    user_agent?: string;
    aadhaar_last_four?: string;
    signed_via?: string;
    timestamp?: string;
  };
}

interface Agreement {
  id: string;
  status: 'draft' | 'pending_confirmation' | 'ready_for_signature' | 'completed' | 'expired' | 'voided';
  version: number;
  rent_amount: number;
  deposit_amount: number;
  maintenance_amount: number;
  term_months: number;
  property_json: {
    address: string;
    type: string;
    furnishing: string;
  };
  created_at: string;
}

export default function CompletePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [otherParty, setOtherParty] = useState<Party | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [role, setRole] = useState<'landlord' | 'tenant' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompleteDetails = async () => {
      try {
        const res = await fetch(`/api/a/${token}`);
        const data = await res.json();

        if (!res.ok) {
          router.push(`/a/${token}/not-found`);
          return;
        }

        // Verify it is completed
        if (data.status !== 'completed') {
          router.push(`/a/${token}`);
          return;
        }

        setAgreement(data.agreement);
        setParty(data.party);
        setOtherParty(data.otherParty);
        setDownloadUrl(data.downloadUrl);
        setRole(data.role);
      } catch (err) {
        console.error('Error loading completed details:', err);
        setErrorMsg('Failed to sync completed agreement details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompleteDetails();
  }, [token, router]);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const formatISTDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    }) + ' (IST)';
  };

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-indigo-650 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Retrieving executed agreement...</p>
        </div>
      </div>
    );
  }

  if (!agreement || !party || !otherParty) return null;

  const landlordParty = role === 'landlord' ? party : otherParty;
  const tenantParty = role === 'tenant' ? party : otherParty;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Success Header */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-full w-fit mx-auto border border-emerald-100 dark:border-emerald-900/40">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Leave & License Executed
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            The agreement has been digitally signed by both parties. The certified PDF copy has been locked and archived.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20 rounded-lg text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Signatures & details (Left) */}
          <div className="md:col-span-7 space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Digital Execution Certificates
              </h3>
              
              {/* Landlord Signature Badge */}
              <Card className="border-emerald-200 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/5 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Licensor (Landlord)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                      ✓ Aadhaar Signed
                    </span>
                  </div>
                  <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {landlordParty.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p><strong>Aadhaar Last 4:</strong> XXXX XXXX {landlordParty.signature_meta_json?.aadhaar_last_four || 'XXXX'}</p>
                  <p><strong>Executed at:</strong> {formatISTDate(landlordParty.signed_at)}</p>
                  <p><strong>Signed IP:</strong> {landlordParty.signature_meta_json?.ip || '127.0.0.1'}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    <strong>User-Agent:</strong> {landlordParty.signature_meta_json?.user_agent || 'Mozilla'}
                  </p>
                </CardContent>
              </Card>

              {/* Tenant Signature Badge */}
              <Card className="border-emerald-200 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/5 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Licensee (Tenant)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                      ✓ Aadhaar Signed
                    </span>
                  </div>
                  <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {tenantParty.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p><strong>Aadhaar Last 4:</strong> XXXX XXXX {tenantParty.signature_meta_json?.aadhaar_last_four || 'XXXX'}</p>
                  <p><strong>Executed at:</strong> {formatISTDate(tenantParty.signed_at)}</p>
                  <p><strong>Signed IP:</strong> {tenantParty.signature_meta_json?.ip || '127.0.0.1'}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    <strong>User-Agent:</strong> {tenantParty.signature_meta_json?.user_agent || 'Mozilla'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Legal validity trust note */}
            <div className="bg-slate-100 dark:bg-slate-900 p-4 border rounded-xl flex gap-3 items-start text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">IT Act, 2000 Compliance</p>
                <p>
                  Electronic signatures on Leave and License contracts (for terms ≤ 11 months) are fully recognized as valid and legally binding evidence under Section 10A of the Indian Information Technology Act, 2000.
                </p>
              </div>
            </div>

          </div>

          {/* Action & download (Right) */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Download Card */}
            <Card className="border-indigo-150 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
              <div className="bg-indigo-600 px-6 py-4 text-white">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5"><FileDown className="h-4.5 w-4.5" /> Certified Document</h3>
                <p className="text-[10px] text-indigo-200">Generate copy for printing or records</p>
              </div>
              <CardContent className="p-6 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Download the final generated Leave and License document in PDF format. The document includes the full contract text and digital signature badges at the end.
                </p>
                
                {downloadUrl ? (
                  <Button 
                    onClick={handleDownload}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Download Executed PDF <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="p-3 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg text-xs text-center font-medium">
                    Download link unavailable or expired. Please contact support.
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-slate-50 dark:bg-slate-950/40 px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 leading-normal flex gap-1.5 items-start">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>For security, the download link resolves dynamically and expires every 24 hours.</span>
              </CardFooter>
            </Card>

            {/* Next Action / Back CTA */}
            <div className="text-center">
              <Link href="/">
                <Button variant="outline" className="w-full text-xs font-bold py-2">
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Return to Homepage
                </Button>
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
