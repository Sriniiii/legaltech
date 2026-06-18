export default function TermsOfService() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Terms of Service</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">Last updated: June 17, 2026</p>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Welcome to RentSign. By accessing or using our website, you agree to comply with and be bound by the following Terms of Service. Please read these terms carefully.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">1. Acceptance of Terms</h3>
          <p>
            By using the RentSign platform, you accept these terms in full. If you disagree with any part of these terms, you must not use our website or services.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">2. Description of Service</h3>
          <p>
            RentSign is a software-as-a-service application that allows landlords to scaffold draft rental agreements, invite tenants to review terms, and execute mock e-signatures. This is a demonstration replica of a commercial rental platform. All legal templates, e-stamps, signatures, and PDFs are provided for simulation purposes only.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">3. User Responsibilities</h3>
          <p>
            You agree to provide true, accurate, and current information when filling details in the agreement wizard. Because this is a test platform, you should not submit sensitive real-world personal documents or actual Aadhaar numbers.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">4. Intellectual Property</h3>
          <p>
            All content, branding, code, and graphics on this site are the property of RentSign or its creators. Unauthorized replication or extraction of source code is prohibited.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">5. Limitation of Liability</h3>
          <p>
            RentSign and its creators are not liable for any damages, legal disputes between landlords and tenants, or financial losses resulting from the use or misuse of this simulation platform. No document generated on this platform holds binding legal force in a court of law.
          </p>
        </div>
      </div>
    </div>
  );
}
