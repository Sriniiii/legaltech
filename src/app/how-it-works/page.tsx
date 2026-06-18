import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  ShieldAlert, 
  Send, 
  Mail, 
  Eye, 
  Check, 
  Fingerprint, 
  Download, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';

export default function HowItWorks() {
  const stepsLandlord = [
    {
      icon: <FileText className="h-6 w-6 text-indigo-600" />,
      title: "1. Fill the 5-Step Creation Wizard",
      desc: "Provide property specifics (address, type, furnishing), financials (rent, deposit, maintenance, payment due date), contact details for both landlord and tenant, and customize essential clauses (lock-in period, notice period, pet policy, etc.)."
    },
    {
      icon: <ShieldAlert className="h-6 w-6 text-indigo-600" />,
      title: "2. Verify 11-Month Term Limits",
      desc: "Our systems enforce the legal cap of 11 months on leave-and-license agreements. This ensures the contract stays within the non-mandatory registration scope, keeping your transaction fully online."
    },
    {
      icon: <Send className="h-6 w-6 text-indigo-600" />,
      title: "3. Lock & Send Invitations",
      desc: "Review the automatically generated agreement text in real-time. Click 'Send' to lock the terms from any further edits, generate secure token links, and trigger invitations to both parties."
    }
  ];

  const stepsTenant = [
    {
      icon: <Mail className="h-6 w-6 text-emerald-600" />,
      title: "1. Secure Tokenized Link Delivery",
      desc: "The tenant receives a secure link via email containing a signed cryptographic token. They don't need to sign up or create a password to review the agreement, keeping the user experience frictionless."
    },
    {
      icon: <Eye className="h-6 w-6 text-emerald-600" />,
      title: "2. Review & Confirm Terms",
      desc: "Both parties view the same locked agreement preview. Each party must click 'Confirm' to verify the clauses are correct. Changes are not allowed. If there is a mistake, the landlord must void the draft and create a new version."
    },
    {
      icon: <Check className="h-6 w-6 text-emerald-600" />,
      title: "3. Real-time Status Synchronization",
      desc: "Using Supabase Realtime, the agreement hub automatically updates the action panel when the other party confirms. You don't need to refresh your browser to see when the tenant or landlord has completed their step."
    }
  ];

  const stepsSigning = [
    {
      icon: <Fingerprint className="h-6 w-6 text-purple-600" />,
      title: "1. OTP-Based Identity Verification",
      desc: "Once both parties confirm the terms, the hub unlocks the 'Sign' page. Enter your Aadhaar identifier, receive a secure verification OTP, and confirm the signature."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-purple-600" />,
      title: "2. Cryptographic Stamp & Logs",
      desc: "Our e-sign provider stamps each signature with a certificate, registering the transaction time, IP address, and browser metadata directly into the system's tamper-proof audit trail table."
    },
    {
      icon: <Download className="h-6 w-6 text-purple-600" />,
      title: "3. PDF Assembly & Storage",
      desc: "Upon the second signature, the PDF generator merges the terms and appends digital signature badges in the footer. The document is uploaded to secure cloud storage, and signed links are sent via email for offline downloading."
    }
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-slate-900 dark:text-white">
            The Digital Agreement Lifecycle
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            RentSign coordinates all stages of agreement creation, dual confirmation, and cryptographic signing into a simple, cohesive flow.
          </p>
        </div>

        {/* Section 1: Landlord Creation */}
        <div className="space-y-8">
          <div className="border-l-4 border-indigo-600 pl-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Landlord Draft Initialization</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              How landlords create and launch agreements in under 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stepsLandlord.map((step, idx) => (
              <Card key={idx} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="p-2 bg-indigo-50 dark:bg-slate-900/60 w-fit rounded-lg">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 2: Shared Review & Confirmation */}
        <div className="space-y-8">
          <div className="border-l-4 border-emerald-600 pl-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. Dual Review & Confirmation</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              How terms are verified and locked to ensure total agreement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stepsTenant.map((step, idx) => (
              <Card key={idx} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="p-2 bg-emerald-50 dark:bg-slate-900/60 w-fit rounded-lg">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 3: Secure Signing & PDF Delivery */}
        <div className="space-y-8">
          <div className="border-l-4 border-purple-600 pl-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">3. E-Sign & Automated Assembly</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Securing the signature and locking down the contract.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stepsSigning.map((step, idx) => (
              <Card key={idx} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="p-2 bg-purple-50 dark:bg-slate-900/60 w-fit rounded-lg">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Callout */}
        <div className="bg-slate-950 text-white rounded-2xl p-8 md:p-12 relative overflow-hidden text-center max-w-4xl mx-auto border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />
          <div className="relative space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold">Ready to try it yourself?</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Try our step-by-step landlord agreement creation wizard. Get a feel for the workflow that simplifies license contracts.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-600/20">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/stamp-duty-calculator">
                <Button variant="outline" className="border-slate-700 hover:bg-slate-900 text-slate-200">
                  Calculate Stamp Duty
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
