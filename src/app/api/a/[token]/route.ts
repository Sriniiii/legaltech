import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/supabase/tokens';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // 1. Verify token signature and expiration
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'invalid_or_expired' }, { status: 400 });
  }

  const { partyId, agreementId, role } = payload;

  try {
    // 2. Fetch the active party details and double-verify token matches the DB
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

    // 3. Fetch the agreement details
    const { data: agreement, error: agreementError } = await supabaseServiceRole
      .from('agreements')
      .select('*')
      .eq('id', agreementId)
      .single();

    if (agreementError || !agreement) {
      return NextResponse.json({ error: 'agreement_not_found' }, { status: 404 });
    }

    // 4. Fetch the other party details
    const { data: otherParty, error: otherPartyError } = await supabaseServiceRole
      .from('agreement_parties')
      .select('id, role, name, email, phone, confirmed_at, signed_at, signature_meta_json')
      .eq('agreement_id', agreementId)
      .neq('id', partyId)
      .single();

    if (otherPartyError) {
      console.warn(`[GET /api/a/[token]] Failed to fetch other party:`, otherPartyError);
    }

    let downloadUrl: string | null = null;
    if (agreement.status === 'completed') {
      const { data: document } = await supabaseServiceRole
        .from('documents')
        .select('*')
        .eq('agreement_id', agreementId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (document) {
        const { data: signedUrlObj } = await supabaseServiceRole.storage
          .from('agreements')
          .createSignedUrl(document.storage_path, 60 * 60 * 24); // 24 hours
        if (signedUrlObj) {
          downloadUrl = signedUrlObj.signedUrl;
        }
      }
    }

    return NextResponse.json({
      success: true,
      agreement,
      party: {
        id: party.id,
        role: party.role,
        name: party.name,
        email: party.email,
        phone: party.phone,
        confirmed_at: party.confirmed_at,
        signed_at: party.signed_at,
        signature_meta_json: party.signature_meta_json,
      },
      otherParty: otherParty ? {
        id: otherParty.id,
        role: otherParty.role,
        name: otherParty.name,
        email: otherParty.email,
        phone: otherParty.phone,
        confirmed_at: otherParty.confirmed_at,
        signed_at: otherParty.signed_at,
        signature_meta_json: otherParty.signature_meta_json,
      } : null,
      role,
      status: agreement.status,
      downloadUrl,
    });
  } catch (err: any) {
    console.error(`[GET /api/a/[token]] Internal error:`, err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
