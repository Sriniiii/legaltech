'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  Fingerprint, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  Lock
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

type SignStep = 'aadhaar' | 'loading_otp' | 'otp' | 'submitting_sign' | 'success';

export default function SignAgreementPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [role, setRole] = useState<'landlord' | 'tenant' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form inputs
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<SignStep>('aadhaar');

  // 1. Fetch details from server API
  const fetchHubDetails = async () => {
    try {
      const res = await fetch(`/api/a/${token}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'invalid_or_expired') {
          router.push(`/a/${token}/expired`);
        } else {
          router.push(`/a/[token]/not-found`);
        }
        return;
      }

      // Check if already signed
      if (data.party?.signed_at) {
        router.push(`/a/${token}`);
        return;
      }

      // Verify status
      if (data.status === 'voided') {
        setErrorMsg('This agreement has been voided by the landlord and is no longer active.');
      } else if (data.status === 'signing_complete' || data.status === 'completed') {
        setErrorMsg('This agreement has already been signed by both parties.');
      } else if (data.status !== 'ready_for_signature') {
        setErrorMsg('This agreement is not ready for signature yet. Please confirm terms first.');
      }

      setAgreement(data.agreement);
      setParty(data.party);
      setRole(data.role);
    } catch (err) {
      console.error('Error loading sign details:', err);
      setErrorMsg('Failed to sync agreement details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubDetails();
  }, [token, router]);

  // Request OTP handler
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(aadhaar)) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setErrorMsg(null);
    setStep('loading_otp');

    // Simulate 2s delay to contact UIDAI services
    setTimeout(() => {
      setStep('otp');
    }, 2000);
  };

  // Submit Signature handler
  const handleSubmitSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg('Please enter a 6-digit OTP code.');
      return;
    }

    setErrorMsg(null);
    setStep('submitting_sign');

    try {
      const res = await fetch(`/api/a/${token}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadhaar,
          otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify e-sign OTP.');
      }

      setStep('success');

      // Redirect back to hub after 2 seconds
      setTimeout(() => {
        router.push(`/a/${token}`);
      }, 2000);
    } catch (err: any) {
      console.error('Signing error:', err);
      setErrorMsg(err.message || 'Signature execution failed. Please check OTP and try again.');
      setStep('otp');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading secure sign portal...</p>
        </div>
      </div>
    );
  }

  if (!agreement || !party) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-12 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Signing Unavailable</h2>
          <p className="text-sm text-slate-500">{errorMsg || 'Unable to access the signing portal.'}</p>
          <Link href={`/a/${token}`}>
            <Button variant="outline" className="mt-2">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Agreement Hub
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back navigation */}
        <div>
          <Link href={`/a/${token}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Back to Agreement Hub
          </Link>
        </div>

        {/* Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b">
          <div>
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40 px-2.5 py-0.5 text-xs font-semibold">
              Ready for Signature
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Secure Aadhaar e-Sign
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Executing as: <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">{role} ({party.name})</span>
            </p>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <Lock className="h-4.5 w-4.5 text-slate-400" />
            <span>256-bit Encrypted Session</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20 rounded-lg flex gap-2.5 text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Agreement summary info (Left) */}
          <div className="md:col-span-5 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Contract Summary</CardTitle>
                <CardDescription className="text-xs">Leave & License Agreement details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="border-b pb-2 flex justify-between">
                  <span className="text-slate-500">Rent Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{agreement.rent_amount.toLocaleString('en-IN')}/mo</span>
                </div>
                <div className="border-b pb-2 flex justify-between">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{agreement.deposit_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-b pb-2 flex justify-between">
                  <span className="text-slate-500">Duration / Term:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{agreement.term_months} Months</span>
                </div>
                <div className="border-b pb-2">
                  <span className="text-slate-500 block mb-1">Property Address:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-normal block">{agreement.property_json?.address}</span>
                </div>
                <div className="pt-2 text-[10px] text-slate-400 leading-normal flex gap-1.5 items-start">
                  <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span>This agreement has been verified and locked. No modifications can be made once signing begins.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive signing container (Right) */}
          <div className="md:col-span-7">
            <Card className="border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
              <div className="bg-slate-950 px-6 py-4 text-white flex items-center gap-2">
                <Fingerprint className="h-6 w-6 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-sm">UIDAI Aadhaar Verification</h3>
                  <p className="text-[10px] text-slate-400">Government-approved secure electronic signature</p>
                </div>
              </div>

              <CardContent className="p-6">
                
                {/* Aadhaar entry step */}
                {step === 'aadhaar' && (
                  <form onSubmit={handleRequestOtp} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="aadhaar" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        12-Digit Aadhaar Number
                      </label>
                      <input
                        id="aadhaar"
                        type="text"
                        maxLength={12}
                        required
                        placeholder="e.g. 123456789012"
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest text-center"
                      />
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 border rounded-lg space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5 text-indigo-500" /> Consent and Privacy Policy
                      </p>
                      <p>
                        I hereby authorize RentSign to request and submit my credentials to the Unique Identification Authority of India (UIDAI) for the sole purpose of executing the e-signature on the Leave and License contract.
                      </p>
                    </div>

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 shadow-sm">
                      Request OTP Code
                    </Button>
                  </form>
                )}

                {/* Loading UIDAI portal step */}
                {step === 'loading_otp' && (
                  <div className="text-center py-10 space-y-4">
                    <Loader2 className="h-10 w-10 text-indigo-650 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Contacting UIDAI...</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Verifying Aadhaar registry and sending OTP code</p>
                    </div>
                  </div>
                )}

                {/* OTP entry step */}
                {step === 'otp' && (
                  <form onSubmit={handleSubmitSignature} className="space-y-5">
                    <div className="space-y-2 text-center">
                      <Smartphone className="h-8 w-8 text-indigo-500 mx-auto animate-pulse" />
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">OTP Code Sent</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                        Enter the 6-digit confirmation code sent to your registered mobile number ending in *{party.phone.slice(-4)}.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="otp" className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-center">
                        Verification Code (OTP)
                      </label>
                      <input
                        id="otp"
                        type="text"
                        maxLength={6}
                        required
                        placeholder="e.g. 123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full max-w-[180px] mx-auto block px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center tracking-widest text-lg font-bold"
                      />
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block text-center mt-1.5 font-medium">
                        Info: Enter the mock code <span className="font-extrabold underline">123456</span> to complete.
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setStep('aadhaar')}
                        className="w-1/3 py-2 text-xs font-bold"
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 shadow-sm"
                      >
                        Verify & Sign Contract
                      </Button>
                    </div>
                  </form>
                )}

                {/* Submitting signature state */}
                {step === 'submitting_sign' && (
                  <div className="text-center py-10 space-y-4">
                    <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Executing Signature...</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Applying electronic signature to contract fields</p>
                    </div>
                  </div>
                )}

                {/* Success state */}
                {step === 'success' && (
                  <div className="text-center py-10 space-y-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-full w-fit mx-auto border border-emerald-100 dark:border-emerald-900/40">
                      <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">E-Sign Completed!</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Redirecting you back to the agreement hub...</p>
                    </div>
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
