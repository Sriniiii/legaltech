export default function PrivacyPolicy() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">Last updated: June 17, 2026</p>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            At RentSign, we value your privacy. This Privacy Policy details how we handle information collected on our simulation website.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">1. Information Collection</h3>
          <p>
            We collect the basic name, email address, and phone numbers entered in the landlord creation wizard to demonstrate the notification and e-signing workflows. No biometric credentials or official governmental database records are collected or verified.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">2. How We Use Data</h3>
          <p>
            Any email or contact information is used strictly to dispatch automated demo invitations (via Resend) and process the signature workflow. We do not sell, share, or redistribute your contact details to third-party marketing services.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">3. Storage & Security</h3>
          <p>
            Data is stored inside a secure Supabase Postgres database. Access is restricted using Row Level Security (RLS) policies. However, since this is a demonstration sandbox project, users are requested to use mock contact details and fake names rather than real-world credentials.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">4. Cookies</h3>
          <p>
            We may use session cookies to preserve user authentication state (e.g., keeping landlords logged into their dashboard).
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white text-base pt-2">5. Updates to Policy</h3>
          <p>
            We reserve the right to modify this policy at any time to align with software changes or legal guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
