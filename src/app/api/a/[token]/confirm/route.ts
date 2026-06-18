import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/supabase/tokens';
import { sendConfirmationReceivedEmail, sendReadyToSignEmail } from '@/lib/email';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // 1. Verify token signature and expiration
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'invalid_or_expired' }, { status: 400 });
  }

  const { partyId, agreementId } = payload;

  try {
    // 2. Fetch the active party details
    const { data: party, error: partyError } = await supabaseServiceRole
      .from('agreement_parties')
      .select('*')
      .eq('id', partyId)
      .single();

    if (partyError || !party) {
      return NextResponse.json({ error: 'party_not_found' }, { status: 404 });
    }

    if (party.token !== token) {
      return NextResponse.json({ error: 'token_mismatch' }, { status: 400 });
    }

    // 3. Fetch the agreement details and verify it is in the correct status
    const { data: agreement, error: agreementError } = await supabaseServiceRole
      .from('agreements')
      .select('*')
      .eq('id', agreementId)
      .single();

    if (agreementError || !agreement) {
      return NextResponse.json({ error: 'agreement_not_found' }, { status: 404 });
    }

    if (agreement.status !== 'pending_confirmation') {
      return NextResponse.json({ error: 'agreement_not_pending_confirmation' }, { status: 400 });
    }

    // 4. Update the active party's confirmation timestamp in the DB
    const confirmedAtStr = new Date().toISOString();
    const { error: updatePartyError } = await supabaseServiceRole
      .from('agreement_parties')
      .update({ confirmed_at: confirmedAtStr })
      .eq('id', partyId);

    if (updatePartyError) throw updatePartyError;

    // 5. Record confirmation in the Audit Log
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await supabaseServiceRole.from('audit_log').insert({
      agreement_id: agreementId,
      party_id: partyId,
      action: 'confirmed',
      ip,
      user_agent: userAgent,
      metadata_json: {
        role: party.role,
        email: party.email,
      },
    });

    // 6. Email confirmation receipt to the confirming party
    await sendConfirmationReceivedEmail(party.email, party.name, party.role);

    // 7. Check if the OTHER party has also confirmed
    const { data: otherParty, error: otherPartyError } = await supabaseServiceRole
      .from('agreement_parties')
      .select('*')
      .eq('agreement_id', agreementId)
      .neq('id', partyId)
      .single();

    if (otherPartyError) {
      console.warn(`[POST /api/a/[token]/confirm] Failed to fetch other party:`, otherPartyError);
    }

    // Check if both parties have confirmed
    if (otherParty && otherParty.confirmed_at) {
      // Transition agreement status to ready_for_signature
      const { error: updateAgreementError } = await supabaseServiceRole
        .from('agreements')
        .update({
          status: 'ready_for_signature',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agreementId);

      if (updateAgreementError) throw updateAgreementError;

      // Log the agreement status transition in the Audit Log
      await supabaseServiceRole.from('audit_log').insert({
        agreement_id: agreementId,
        action: 'status_ready_for_signature',
        ip,
        user_agent: userAgent,
        metadata_json: {
          message: 'Both parties confirmed terms. Status transitioned to ready_for_signature.',
        },
      });

      // Construct links utilizing existing tokens
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const originUrl = `${protocol}://${host}`;

      const landlordParty = party.role === 'landlord' ? party : otherParty;
      const tenantParty = party.role === 'tenant' ? party : otherParty;

      const landlordSignUrl = `${originUrl}/a/${landlordParty.token}`;
      const tenantSignUrl = `${originUrl}/a/${tenantParty.token}`;

      // Dispatch "Ready to Sign" emails to both parties
      await sendReadyToSignEmail(landlordParty.email, landlordParty.name, landlordSignUrl);
      await sendReadyToSignEmail(tenantParty.email, tenantParty.name, tenantSignUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'Confirmation recorded successfully.',
      confirmed_at: confirmedAtStr,
    });
  } catch (err: any) {
    console.error(`[POST /api/a/[token]/confirm] Internal error:`, err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
