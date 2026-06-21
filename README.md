# RentSign 📄✍️

RentSign is a secure digital Leave & License agreement builder and e-signing portal. It guides landlords and tenants through a drafting wizard, term confirmations, mock Aadhaar e-sign OTP authentication, and dynamically compiles deeds into custom-branded PDFs containing cryptographic signature certificates.

This guide details how to configure, run, and test the project locally.

---

## 🔌 Prerequisites

Before running the project, ensure you have:
* **Node.js** (v18 or higher recommended)
* A **Supabase** account/project
* A **Resend** account for email dispatch (can run in Sandbox mode locally)

---

## ⚙️ Quick Start Setup

### 1. Install Dependencies
Clone the repository and install the npm packages:
```bash
git clone https://github.com/Sriniiii/legaltech.git
cd legaltech
npm install
```

### 2. Configure Environment Variables
Create a file named `.env.local` in the root directory and populate it with your credentials:
```env
# Supabase Configurations
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Resend API Key (for email notifications)
RESEND_API_KEY=re_your-resend-api-key
# Optional custom sender once domain is verified (defaults to RentSign <noreply@yourdomain.com>)
RESEND_FROM_EMAIL=RentSign <noreply@yourdomain.com>
```

### 3. Initialize the Supabase Database & Schema
1. Log in to your **Supabase Dashboard** and open the **SQL Editor**.
2. Copy and execute the contents of the schema migration file:
   `./supabase/migrations/20260617000000_schema.sql`
   This will initialize:
   * `agreements`: Core agreements metadata.
   * `agreement_parties`: Participant roles (landlord and tenant), emails, and signatures.
   * `documents`: File storage paths.
   * `audit_log`: Audit logs for e-sign verification.
   * Row-Level Security (RLS) policies guarding all tables.

### 4. Create Private Storage Bucket
1. In your **Supabase Dashboard**, go to **Storage**.
2. Click **New Bucket**.
3. Name it exactly: **`agreements`**.
4. Toggle **Public Bucket** to **OFF** (this bucket must remain private for security).

### 5. Run the Local Development Server
Start the Next.js development server on port `3001`:
```bash
npx next dev -p 3001
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser to run the website.

---

## 🧪 E2E Local Testing & Verification Workflow

Use these steps to test the entire agreement creation, confirmation, Aadhaar signing, and PDF generation lifecycle locally.

### Step 1: Log In
1. Navigate to **[http://localhost:3001/login](http://localhost:3001/login)**.
2. Log in using the preconfigured landlord test credentials:
   * **Email**: `sriniwasp36@gmail.com`
   * **Password**: `Password123!`

### Step 2: Create a Draft Agreement
1. On the Landlord Dashboard, click **New Agreement**.
2. Complete the 5-step drafting wizard:
   * **Parties**: Enter Landlord and Tenant names, emails, and phone numbers.
   * **Property**: Input the property type, address, rent collection due dates, and furnishing status.
   * **Financials**: Specify Rent amount, Security Deposit, and Maintenance responsibilities.
   * **Timeline**: Choose the lease term (up to 11 months), lock-in period, and notice period.
   * **Clauses**: Add custom clauses or toggle standard parameters (e.g., pets allowed).
3. Save the draft. It will appear on your dashboard as `Draft`.

### Step 3: Landlord and Tenant Confirmation
1. Click **Submit for Confirmation** on the agreement detail page. The status will transition to `Pending Confirmation`.
2. Retrieve the custom token link for both the landlord and tenant. These can be fetched from the database, or you can check local logs. The links are structured as:
   `http://localhost:3001/a/[JWT_TOKEN]`
3. Open the landlord's link, review the agreement details, and click **Confirm Terms**.
4. Open the tenant's link, review the agreement details, and click **Confirm Terms**.
5. Once both parties have confirmed, the status updates to `Ready for Signature`.

### Step 4: Perform Aadhaar E-Sign (Mock)
1. Navigate back to each party's token link.
2. Click **Proceed to Aadhaar Sign**.
3. Enter any dummy 12-digit Aadhaar number and click **Request OTP**.
4. Input the mock verification code: **`123456`** and click **Verify**.
5. Do this for both the Landlord and Tenant.

### Step 5: Generate & Download custom PDF
1. Once both signatures are recorded, the agreement status changes to `Signing Complete`.
2. As the Landlord, click **Generate PDF & Complete**.
3. The server will dynamically:
   * Render the custom PDF with `@react-pdf/renderer`.
   * Add a custom brand layout, Indigo headers, Slate text, and page numbering (`Page X of Y`).
   * Append a secure **Signature Certificate** for both parties containing name, Aadhaar last-4, timestamp, IP, User-Agent, and verification token.
   * Upload the PDF to the private Supabase `agreements` storage bucket.
   * Dispatch completion emails containing the executed PDF link via Resend.
4. Click **Download Executed PDF**. This will request `/api/agreements/[id]/pdf-url`, which authenticates your session and securely redirects to a short-lived (15-minute) signed URL.

---

## 📂 Core Architecture & File Structure

Here are the key parts of the project code:
* `src/lib/pdf/generator.tsx`: Compiles document structures, styles, and signature certificates into PDF buffers.
* `src/app/api/agreements/[id]/pdf-url/route.ts`: Authenticates user cookies on the server, bypasses standard Storage RLS using the Supabase Service Role key, and returns a secure, short-lived redirect to the PDF.
* `src/lib/email.ts`: Composes and dispatches agreement notifications and completion links using Resend.
* `src/app/a/[token]/page.tsx`: Recipient interface handles term review, confirmation status, and e-signing workflows.
