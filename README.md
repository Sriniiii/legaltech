# RentSign 📄✍️

RentSign is a modern, secure Leave & License agreement builder and digital e-signing portal. It guides landlords and tenants through a structured 5-step drafting wizard, double-party terms confirmation, mock Aadhaar e-sign authentication, and dynamically compiles executed deeds into custom-branded PDFs with cryptographic signature certificates.

---

## 🚀 Key Features

*   **Interactive Drafting Wizard**: A smooth 5-step wizard store for building rental agreement properties, financial details, locking periods, society maintenance allocations, and custom clauses.
*   **Double Confirmation & E-Signing**: Landlords and tenants independently confirm terms before proceeding to Aadhaar e-Sign validation (via a mock OTP verification system).
*   **Modern PDF Compilation Engine**: Built with `@react-pdf/renderer` to generate custom-branded PDF documents containing:
    *   Clean modern typography (Helvetica/Helvetica-Bold).
    *   Dynamic SVG logos and brand color accents (Indigo, Slate, Emerald).
    *   Automated page numbering (`Page X of Y`) in the page footers.
    *   Dual cryptographic **Signature Certificates** containing Signee name, Aadhaar last-4, IST timestamp, IP, User-Agent, and secure token IDs.
*   **Dashboard Integration**: Landlords have a unified dashboard to review draft/pending/completed agreements, with direct download buttons triggering dynamic short-lived storage signed URLs (15 mins) on demand.
*   **Automated Email Delivery**: Triggers real-time email notifications through Resend when actions occur or once the agreement is fully completed (attaching the secure download link).
*   **Secure Supabase Architecture**: Guarded by strict Row Level Security (RLS) policies allowing landlords to query only their own drafts, logs, and files.

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 16 (App Router, Turbopack)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS & Vanilla CSS (modern glassmorphism UI)
*   **Database & Storage**: Supabase (PostgreSQL + RLS + private Storage buckets)
*   **PDF Generation**: `@react-pdf/renderer`
*   **Notifications**: Resend API

---

## ⚙️ Setup & Installation

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/Sriniiii/legaltech.git
cd legaltech

# Install packages
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root of the project:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
```

### 3. Database Schema setup
Run the migration script located in `./supabase/migrations/20260617000000_schema.sql` against your Supabase project's SQL editor to initialize tables (`agreements`, `agreement_parties`, `documents`, and `audit_log`) and activate RLS policies.

### 4. Run Development Server
```bash
npm run dev
# or specify the dev port
npx next dev -p 3001
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser to run the website.

---

## 📂 Project Structure

```
├── supabase/
│   └── migrations/           # Database tables, indexes, and RLS policies
├── src/
│   ├── app/
│   │   ├── a/[token]/        # Recipient hub UI, e-sign workflow, and completion views
│   │   ├── api/              # API endpoints (sign, complete, void, pdf-url, renew)
│   │   ├── dashboard/        # Landlord dashboard and agreement tracking panels
│   │   ├── login/            # Password & Magic Link authentication screens
│   │   └── page.tsx          # Homepage / Landing page
│   ├── components/           # Reusable layout and UI elements
│   ├── lib/
│   │   ├── esign/            # E-sign providers (Mock Aadhaar interface)
│   │   ├── pdf/              # @react-pdf/renderer document compiler
│   │   ├── supabase/         # SSR cookie-based Supabase clients & middleware
│   │   └── email.ts          # Resend notification dispatch
│   └── proxy.ts              # System proxies
```

---

## 🔒 Security & Compliance

*   **Section 10A IT Act, 2000**: Digital execution of agreements is authenticated and logged with cryptographic signatures.
*   **Private Buckets**: Agreement PDFs are uploaded to private storage. Access is dynamically authorized by checking landlord ownership on the server side before granting a short-lived (15-min) signed URL.
