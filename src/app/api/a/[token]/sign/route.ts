import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/supabase/tokens';
import { esignProvider } from '@/lib/esign/provider';
import { generateAndDeliverPDF } from '@/lib/pdf/generator';

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

    if (party.signed_at) {
      return NextResponse.json({ error: 'already_signed' }, { status: 400 });
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

    if (agreement.status !== 'ready_for_signature') {
      return NextResponse.json({ error: 'agreement_not_ready_for_signature' }, { status: 400 });
    }

    // 4. Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    const { aadhaar, otp } = body;
    if (!aadhaar || !otp) {
      return NextResponse.json({ error: 'aadhaar_and_otp_required' }, { status: 400 });
    }

    // 5. Verify Mock Aadhaar e-sign
    const isValid = esignProvider.verifyMockOtp(aadhaar, otp);
    if (!isValid) {
      return NextResponse.json({ error: 'invalid_aadhaar_or_otp' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const signedAtStr = new Date().toISOString();

    // 6. Update party's signed status
    const signatureMeta = {
      aadhaar_last_four: aadhaar.slice(-4),
      ip,
      user_agent: userAgent,
      signed_via: 'mock_aadhaar',
      timestamp: signedAtStr,
    };

    const { error: updatePartyError } = await supabaseServiceRole
      .from('agreement_parties')
      .update({
        signed_at: signedAtStr,
        signature_meta_json: signatureMeta,
      })
      .eq('id', partyId);

    if (updatePartyError) throw updatePartyError;

    // 7. Write to Audit Log
    await supabaseServiceRole.from('audit_log').insert({
      agreement_id: agreementId,
      party_id: partyId,
      action: 'signed',
      ip,
      user_agent: userAgent,
      metadata_json: {
        role: party.role,
        email: party.email,
        aadhaar_last_four: signatureMeta.aadhaar_last_four,
      },
    });

    // 8. Check if the OTHER party has also signed
    const { data: otherParty, error: otherPartyError } = await supabaseServiceRole
      .from('agreement_parties')
      .select('*')
      .eq('agreement_id', agreementId)
      .neq('id', partyId)
      .single();

    if (otherPartyError) {
      console.warn(`[POST /api/a/[token]/sign] Failed to fetch other party:`, otherPartyError);
    }

    // If both have signed, transition status to completed and generate/deliver PDF
    if (otherParty && otherParty.signed_at) {
      const { error: updateAgreementError } = await supabaseServiceRole
        .from('agreements')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agreementId);

      if (updateAgreementError) throw updateAgreementError;

      // Trigger PDF generation, Supabase storage upload, document insertion, and Resend delivery
      console.log(`[POST /api/a/[token]/sign] Triggering PDF generation and delivery for agreement: ${agreementId}`);
      await generateAndDeliverPDF(agreementId);

      // Log status completed transition in audit log
      await supabaseServiceRole.from('audit_log').insert({
        agreement_id: agreementId,
        action: 'status_completed',
        ip,
        user_agent: userAgent,
        metadata_json: {
          message: 'Both parties signed agreement. PDF successfully generated and status transitioned to completed.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Signature recorded successfully.',
      signed_at: signedAtStr,
    });
  } catch (err: any) {
    console.error(`[POST /api/a/[token]/sign] Internal error:`, err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
