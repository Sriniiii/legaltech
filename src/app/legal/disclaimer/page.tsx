export default function LegalDisclaimer() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Legal Disclaimer</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">Last updated: June 17, 2026</p>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p className="font-semibold text-amber-600 dark:text-amber-400">
            IMPORTANT NOTICE: THIS PLATFORM IS A SIMULATION.
          </p>
          <p>
            The website RentSign (accessible at this domain) is built entirely as a showcase portfolio piece replicating the digital agreement features of services like NoBroker. It is intended for demo and development evaluation purposes only.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">1. No Legal Force</h3>
          <p>
            Any rental agreement, leave-and-license document, or receipt generated, previewed, or compiled on this platform is completely null and void. They hold no legal binding power, cannot be used as proof of address, and cannot be filed in any municipal registry or court of law.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">2. Mock E-Signatures</h3>
          <p>
            The Aadhaar e-sign workflow is a local UI script simulation. No communication is dispatched to the Government of India, UIDAI, or any licensed Certifying Authority (CA) in India. No digital signature certificates are issued under the Information Technology Act, 2000.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">3. Accuracy of Calculations</h3>
          <p>
            The stamp duty rates, registration fee estimations, and mathematical formulas provided in our calculator tool are approximations. They should not be used as official financial advice. Always verify charges with official state stamp authorities.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">4. Identity Verification</h3>
          <p>
            Users are strictly cautioned against uploading real personal identification documents, private keys, or actual Aadhaar numbers. Please use fake identities and placeholder contacts when executing sandbox test cases.
          </p>
        </div>
      </div>
    </div>
  );
}
