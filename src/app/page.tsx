'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  FileText, 
  Fingerprint, 
  Calculator,
  ShieldCheck, 
  Users,
  AlertTriangle
} from 'lucide-react';

export default function Home() {
  const steps = [
    {
      icon: <FileText className="h-6 w-6 text-indigo-500" />,
      title: "1. Fill Details",
      desc: "Landlord enters property details, rent, deposits, custom clauses, and tenant contact info in a 5-step wizard."
    },
    {
      icon: <Users className="h-6 w-6 text-indigo-500" />,
      title: "2. Dual Confirmation",
      desc: "Both landlord and tenant receive secure links to review and confirm the agreement terms. Terms are locked upon confirmation."
    },
    {
      icon: <Fingerprint className="h-6 w-6 text-indigo-500" />,
      title: "3. Mock Aadhaar Sign",
      desc: "Both parties e-sign securely via an Aadhaar OTP simulation in just 2 minutes. No biometric hardware required."
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-indigo-500" />,
      title: "4. Done & Delivered",
      desc: "The final agreement PDF is compiled, signed, timestamped, stored, and instantly emailed to both parties."
    }
  ];

  const faqs = [
    {
      q: "Is a digitally signed rental agreement legally valid in India?",
      a: "Yes. Under Section 10A of the Information Technology Act, 2000, electronic contracts and digital signatures are legally recognized and valid. Aadhaar eSign qualifies as a secure electronic signature under the Second Schedule of the IT Act."
    },
    {
      q: "Why is the contract duration capped at 11 months?",
      a: "Under Section 17 of the Registration Act, 1908, leases of immovable property for any term exceeding one year must be registered at the sub-registrar's office. By capping the term at 11 months, we stay within the leave-and-license legal scope, which does not mandate sub-registrar registration, enabling a 100% digital flow."
    },
    {
      q: "How does the tenant access the agreement without an account?",
      a: "Tenants receive a secure, cryptographically signed token link via email. The token maps to their specific role and expires. The tenant can review, confirm, and e-sign the entire contract directly through this link without needing a password or registration."
    },
    {
      q: "What is the stamp duty, and how is it paid?",
      a: "Stamp duty is a transaction tax levied by state governments. Currently, RentSign provides an indicative stamp duty calculator. For the demo, stamp duty is simulated. In a live environment, stamp duty payment will go through state-integrated e-stamping portals."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="h-3 w-3" /> Fully Digital 11-Month License
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              Rental Agreements. <br />
              <span className="text-indigo-400">Signed in Minutes.</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Replicating NoBroker's rental platform with a better flow. Create, review, and e-sign legally-valid agreements. No physical stamping, no broker coordination, entirely online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-600/30">
                  Create Free Agreement <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700 hover:bg-slate-900 text-slate-200">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner / Legal Validity Section */}
      <section className="py-12 bg-indigo-50 dark:bg-slate-900/40 border-y border-indigo-100/30 dark:border-slate-800/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                <ShieldCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">100% Legally Valid under IT Act, 2000</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Compliant with Section 10A of the Information Technology Act. Digital signatures hold the same legal weight as wet ink.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Aadhaar OTP Signed</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Tamper-Proof Cryptography</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Full Audit Trail Logs</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              How RentSign Works
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              We've digitized the entire leave-and-license pipeline so you never have to print a page or visit a government office.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <Card key={idx} className="border-slate-200/60 dark:border-slate-800/60 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="mb-2 p-2 bg-indigo-50 dark:bg-slate-900/60 w-fit rounded-lg">
                    {step.icon}
                  </div>
                  <CardTitle className="text-lg font-bold">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/how-it-works">
              <Button variant="link" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold">
                Read Detailed Flow Description <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stamp Duty Teaser Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/20 border-y border-slate-100 dark:border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Description */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Calculator className="h-3 w-3" /> State Taxes
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                Estimate Stamp Duty & Registration Fees Instantly
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Before renting, know how much the stamp duty and registration costs will be. Government charges vary dramatically depending on the state, city, rent amount, and security deposit. Use our free estimator to get an approximate break-down.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Supports MH, KA, Delhi, TN, and TS calculators.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Detailed formula transparency.</span>
                </div>
              </div>
              <div className="pt-2">
                <Link href="/stamp-duty-calculator">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md shadow-emerald-600/10">
                    Try Stamp Duty Calculator
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Calculator Teaser */}
            <div className="lg:col-span-5">
              <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-indigo-600 px-6 py-4 text-white">
                  <h3 className="font-bold text-lg">Quick Calculator Teaser</h3>
                  <p className="text-xs text-indigo-200">Approximate estimation</p>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">State</label>
                    <div className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200">
                      Maharashtra
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Rent</label>
                      <div className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 font-mono">
                        ₹25,000 /mo
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Deposit</label>
                      <div className="p-2 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 font-mono">
                        ₹1,000,00
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase">Estimated Total</div>
                      <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">₹1,963</div>
                    </div>
                    <Link href="/stamp-duty-calculator">
                      <span className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                        Calculate yours <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Everything you need to know about RentSign digital agreements.
            </p>
          </div>

          <Accordion className="w-full space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border border-slate-200/60 dark:border-slate-800/60 rounded-lg px-4 bg-slate-50/50 dark:bg-slate-900/20">
                <AccordionTrigger className="text-left font-bold text-slate-950 dark:text-white py-4 hover:no-underline text-base md:text-lg">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Demo Project Callout Section */}
      <section className="py-12 bg-amber-500/10 dark:bg-amber-500/5 border-t border-amber-500/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-3 max-w-3xl">
            <AlertTriangle className="h-6 w-6 text-amber-500 mt-1 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-400 text-base">Replication & Simulation Demo Notice</h4>
              <p className="text-xs text-amber-700 dark:text-amber-500/95 leading-normal mt-0.5">
                This project replicates the workflow structure of digital rental agreements found on platforms like NoBroker. The signature provider, Resend mailer, and PDF output are mocked and sandbox-configured. Do not insert sensitive personal identity credentials (like actual Aadhaar numbers) on this website.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
