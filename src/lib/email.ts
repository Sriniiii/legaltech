import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

// Initialize Resend client if key is configured
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Sandbox restrictions apply to onboarding@resend.dev by default, but can be overridden by environment variables
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || 'RentSign <onboarding@resend.dev>';

/**
 * Standard email HTML template wrapper for a premium, consistent visual identity.
 */
function getEmailLayout(title: string, bodyHtml: string, ctaHtml = ''): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #0f172a;
            color: #ffffff;
            padding: 24px 32px;
            text-align: center;
          }
          .header-title {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.025em;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .content {
            padding: 32px;
            line-height: 1.6;
            font-size: 14px;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 20px 32px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            font-weight: 700;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin: 20px 0;
            font-size: 14px;
            text-align: center;
          }
          .btn:hover {
            background-color: #4338ca;
          }
          h2 {
            color: #0f172a;
            font-size: 18px;
            font-weight: 700;
            margin-top: 0;
          }
          hr {
            border: 0;
            border-top: 1px solid #f1f5f9;
            margin: 24px 0;
          }
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1 className="header-title">🛡️ RentSign</h1>
          </div>
          <div className="content">
            ${bodyHtml}
            ${ctaHtml}
          </div>
          <div className="footer">
            <p>This is a simulated transactional notification from the RentSign demo platform.</p>
            <p>&copy; ${new Date().getFullYear()} RentSign. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Sends a Resend email, handles client absence, and logs URLs to console for sandboxed testing.
 */
async function sendMail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[Resend Engine] Resend client not configured. Email to ${to} was skipped. Subject: ${subject}`);
    return { success: false, error: 'Client not configured' };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (data.error) {
      console.error(`[Resend Engine] Failed to send email to ${to}:`, data.error);
      return { success: false, error: data.error };
    }

    console.log(`[Resend Engine] Email successfully sent to ${to}. Subject: ${subject}`);
    return { success: true, id: data.data?.id };
  } catch (err: any) {
    console.error(`[Resend Engine] Resend SDK thrown exception for ${to}:`, err);
    return { success: false, error: err.message || err };
  }
}

// 1. INVITE EMAIL
export async function sendInviteEmail(to: string, name: string, role: 'landlord' | 'tenant', tokenUrl: string) {
  const subject = `Action Required: Review your rental agreement on RentSign`;
  const bodyHtml = `
    <h2>Hello ${name},</h2>
    <p>You have been invited to review a draft leave-and-license rental agreement as the <strong>${role.toUpperCase()}</strong>.</p>
    <p>Please click the button below to access the secure agreement hub. You can review the terms, verify rent details, and confirm the contract without registering an account.</p>
  `;
  const ctaHtml = `
    <div style="text-align: center;">
      <a href="${tokenUrl}" class="btn" target="_blank">Review Agreement</a>
    </div>
    <p style="font-size: 12px; color: #64748b; margin-top: 15px;">
      If the button above does not work, copy and paste this link in your browser:<br>
      <a href="${tokenUrl}" style="color: #4f46e5; word-break: break-all;">${tokenUrl}</a>
    </p>
  `;

  console.log(`[DEBUG LINK] Invite for ${role} (${name}): ${tokenUrl}`);
  return await sendMail(to, subject, getEmailLayout(subject, bodyHtml, ctaHtml));
}

// 2. CONFIRMATION RECEIVED
export async function sendConfirmationReceivedEmail(to: string, name: string, role: 'landlord' | 'tenant') {
  const subject = `Confirmation Recorded: Rental Agreement terms verified`;
  const bodyHtml = `
    <h2>Thank you, ${name}!</h2>
    <p>We have successfully recorded your confirmation for the rental agreement as the <strong>${role.toUpperCase()}</strong>.</p>
    <p>Terms have now been locked. Once the other party confirms, the agreement will advance to the e-signing stage, and you will receive another link to sign.</p>
    <p>No action is needed from your end right now. We will notify you shortly.</p>
  `;

  return await sendMail(to, subject, getEmailLayout(subject, bodyHtml));
}

// 3. READY TO SIGN
export async function sendReadyToSignEmail(to: string, name: string, tokenUrl: string) {
  const subject = `Ready to Sign: Execute your rental agreement online`;
  const bodyHtml = `
    <h2>Hello ${name},</h2>
    <p>Great news! Both the landlord and tenant have confirmed the terms of the rental agreement.</p>
    <p>The contract is now ready to be signed. Please click the button below to access the e-sign page and verify your identity using our simulated Aadhaar OTP process.</p>
  `;
  const ctaHtml = `
    <div style="text-align: center;">
      <a href="${tokenUrl}" class="btn" target="_blank">Sign Agreement Now</a>
    </div>
    <p style="font-size: 12px; color: #64748b; margin-top: 15px;">
      Direct link:<br>
      <a href="${tokenUrl}" style="color: #4f46e5; word-break: break-all;">${tokenUrl}</a>
    </p>
  `;

  console.log(`[DEBUG LINK] Sign URL for ${name}: ${tokenUrl}`);
  return await sendMail(to, subject, getEmailLayout(subject, bodyHtml, ctaHtml));
}

// 4. REMINDER
export async function sendReminderEmail(to: string, name: string, actionNeeded: string, tokenUrl: string) {
  const subject = `Reminder: Pending action on your rental agreement`;
  const bodyHtml = `
    <h2>Hello ${name},</h2>
    <p>This is a reminder that there is a pending action required from you on the rental agreement.</p>
    <p><strong>Action Needed:</strong> ${actionNeeded}</p>
    <p>Please click the button below to access the agreement hub and complete this step to prevent the draft from expiring.</p>
  `;
  const ctaHtml = `
    <div style="text-align: center;">
      <a href="${tokenUrl}" class="btn" target="_blank">Access Agreement Hub</a>
    </div>
    <p style="font-size: 12px; color: #64748b; margin-top: 15px;">
      Direct link:<br>
      <a href="${tokenUrl}" style="color: #4f46e5; word-break: break-all;">${tokenUrl}</a>
    </p>
  `;

  return await sendMail(to, subject, getEmailLayout(subject, bodyHtml, ctaHtml));
}

// 5. COMPLETED WITH PDF
export async function sendCompletedEmail(to: string, name: string, downloadUrl: string) {
  const subject = `Agreement Executed: Download your completed Rental PDF`;
  const bodyHtml = `
    <h2>Hello ${name},</h2>
    <p>Congratulations! Both parties have successfully signed the rental agreement.</p>
    <p>The legally-valid Leave and License agreement has been digitally executed, stamped, and archived.</p>
    <p>You can download the final PDF containing signed badges, transaction IDs, and audit logs by clicking the button below.</p>
  `;
  const ctaHtml = `
    <div style="text-align: center;">
      <a href="${downloadUrl}" class="btn" target="_blank">Download Completed PDF</a>
    </div>
    <p style="font-size: 12px; color: #64748b; margin-top: 15px;">
      Download Link:<br>
      <a href="${downloadUrl}" style="color: #4f46e5; word-break: break-all;">${downloadUrl}</a>
    </p>
  `;

  return await sendMail(to, subject, getEmailLayout(subject, bodyHtml, ctaHtml));
}

// 6. EXPIRY NOTICE
export async function sendExpiryEmail(to: string, name: string) {
  const subject = `Notice: Rental Agreement draft has expired`;
  const bodyHtml = `
    <h2>Hello ${name},</h2>
    <p>This is to inform you that the rental agreement draft has expired because it was not confirmed or executed within the allocated time window.</p>
    <p>All temporary tokens associated with this draft have been invalidated. If you still wish to proceed, the landlord will need to clone the draft and send a new invitation.</p>
  `;

  return await sendMail(to, subject, getEmailLayout(subject, bodyHtml));
}

// 7. VOIDED NOTICE
export async function sendVoidedEmail(to: string, name: string, role: 'landlord' | 'tenant') {
  const subject = `Cancelled: Rental Agreement has been withdrawn`;
  const bodyHtml = `
    <h2>Hello ${name},</h2>
    <p>This is to inform you that the rental agreement draft has been withdrawn and voided by the landlord as the <strong>${role.toUpperCase()}</strong>.</p>
    <p>This agreement is no longer active, and any existing access links have been invalidated.</p>
  `;

  return await sendMail(to, subject, getEmailLayout(subject, bodyHtml));
}
