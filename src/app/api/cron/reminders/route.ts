import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/server';
import { sendReminderEmail, sendExpiryEmail } from '@/lib/email';

export async function GET(request: Request) {
  // 1. Cron Secret Security Boundary
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized: CRON_SECRET mismatch.' }, { status: 401 });
  }

  console.log('[Cron Reminders] Starting reminder and expiry scanning execution...');

  // Resolve base URL for token links
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const originUrl = `${protocol}://${host}`;

  let expiredCount = 0;
  let remindersCount = 0;

  try {
    // 2. Fetch all active agreements in pending states
    const { data: agreements, error: agreementsError } = await supabaseServiceRole
      .from('agreements')
      .select('*')
      .in('status', ['pending_confirmation', 'ready_for_signature']);

    if (agreementsError) throw agreementsError;

    if (!agreements || agreements.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending or ready agreements found. Scan completed.',
        expiredCount,
        remindersCount,
      });
    }

    const now = new Date();

    for (const agreement of agreements) {
      // Fetch parties for this agreement
      const { data: parties, error: partiesError } = await supabaseServiceRole
        .from('agreement_parties')
        .select('*')
        .eq('agreement_id', agreement.id);

      if (partiesError || !parties || parties.length === 0) {
        console.warn(`[Cron Reminders] Missing parties for agreement ${agreement.id}. Skipping.`);
        continue;
      }

      let agreementHasExpired = false;

      // First pass: check if ANY party token has expired
      for (const party of parties) {
        if (party.token_expires_at) {
          const expiryDate = new Date(party.token_expires_at);
          if (now > expiryDate) {
            agreementHasExpired = true;
            break;
          }
        }
      }

      // If expired, transition agreement status and email notices
      if (agreementHasExpired) {
        console.log(`[Cron Reminders] Agreement ${agreement.id} has expired.`);
        
        // Update DB
        const { error: updateError } = await supabaseServiceRole
          .from('agreements')
          .update({
            status: 'expired',
            updated_at: now.toISOString(),
          })
          .eq('id', agreement.id);

        if (updateError) {
          console.error(`[Cron Reminders] Failed to update expired state for ${agreement.id}:`, updateError);
          continue;
        }

        // Insert audit log
        await supabaseServiceRole.from('audit_log').insert({
          agreement_id: agreement.id,
          action: 'status_expired',
          ip: '127.0.0.1',
          user_agent: 'Cron Service',
          metadata_json: {
            message: 'Agreement draft expired. Auto-cancelled by cron daemon.',
          },
        });

        // Email notices to all parties
        for (const party of parties) {
          await sendExpiryEmail(party.email, party.name);
        }

        expiredCount++;
        continue; // Proceed to next agreement since this one is now expired
      }

      // Second pass: send reminders if terms are not expired and actions are pending
      for (const party of parties) {
        let needsReminder = false;
        let actionMsg = '';

        if (agreement.status === 'pending_confirmation') {
          if (party.confirmed_at === null && party.token) {
            needsReminder = true;
            actionMsg = 'Please review and confirm the agreement terms.';
          }
        } else if (agreement.status === 'ready_for_signature') {
          if (party.signed_at === null && party.token) {
            needsReminder = true;
            actionMsg = 'Terms are locked. Please proceed to Aadhaar e-sign verification.';
          }
        }

        if (needsReminder && party.token) {
          const tokenUrl = `${originUrl}/a/${party.token}`;
          console.log(`[Cron Reminders] Dispatching reminder to ${party.role} (${party.email}) for agreement ${agreement.id}`);

          // Send reminder email
          await sendReminderEmail(party.email, party.name, actionMsg, tokenUrl);

          // Write to audit log
          await supabaseServiceRole.from('audit_log').insert({
            agreement_id: agreement.id,
            party_id: party.id,
            action: 'reminder_sent',
            ip: '127.0.0.1',
            user_agent: 'Cron Service',
            metadata_json: {
              role: party.role,
              email: party.email,
              action_needed: actionMsg,
            },
          });

          remindersCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder scan completed successfully.',
      expiredCount,
      remindersCount,
    });
  } catch (err: any) {
    console.error(`[GET /api/cron/reminders] Cron execution failed:`, err);
    return NextResponse.json({ error: 'internal_server_error', details: err.message }, { status: 500 });
  }
}
