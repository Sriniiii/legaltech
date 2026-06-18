import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Tagline */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 text-white font-extrabold text-xl">
              <Shield className="h-6 w-6 text-indigo-400 stroke-[2.5]" />
              <span>RentSign</span>
            </div>
            <p className="text-sm max-w-md text-slate-400 leading-relaxed">
              Create, confirm, and Aadhaar-sign legally-valid 11-month rental agreements instantly. No paperwork. No hassle. Fully digital leave-and-license platform.
            </p>
            <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-lg max-w-md text-xs text-amber-400/90 leading-normal">
              <strong>DEMO PLATFORM DISCLAIMER:</strong> This is a simulation showing the happy-path flow for rental agreements. No actual payments, legal binding, or Aadhaar e-stamping occur on this site.
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/stamp-duty-calculator" className="hover:text-white transition-colors">
                  Stamp Duty Calculator
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Landlord Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Pages */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/disclaimer" className="hover:text-white transition-colors">
                  Legal Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and metadata */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>&copy; {currentYear} RentSign. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built as a premium NoBroker replica project.</p>
        </div>
      </div>
    </footer>
  );
}
