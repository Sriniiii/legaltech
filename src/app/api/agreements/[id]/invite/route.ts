import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseServiceRole } from '@/lib/supabase/server';
import { signToken } from '@/lib/supabase/tokens';
import { sendInviteEmail } from '@/lib/email';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: agreementId } = await params;
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase URL or Anon Key is missing.' }, { status: 500 });
  }

  // 1. Authenticate landlord user via session cookies
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore if cannot write cookies
        }
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    // 2. Fetch agreement and verify ownership
    const { data: agreement, error: agreementError } = await supabaseServiceRole
      .from('agreements')
      .select('*')
      .eq('id', agreementId)
      .single();

    if (agreementError || !agreement) {
      return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });
    }

    if (agreement.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this draft.' }, { status: 403 });
    }

    // 3. Fetch agreement parties
    const { data: parties, error: partiesError } = await supabaseServiceRole
      .from('agreement_parties')
      .select('*')
      .eq('agreement_id', agreementId);

    if (partiesError || !parties || parties.length === 0) {
      return NextResponse.json({ error: 'No parties associated with this agreement.' }, { status: 400 });
    }

    const landlordParty = parties.find((p) => p.role === 'landlord');
    const tenantParty = parties.find((p) => p.role === 'tenant');

    if (!landlordParty || !tenantParty) {
      return NextResponse.json({ error: 'Agreement requires both a landlord and tenant party.' }, { status: 400 });
    }

    // 4. Generate expiring tokens for both parties
    const landlordTokenObj = signToken({
      partyId: landlordParty.id,
      agreementId: agreement.id,
      role: 'landlord',
    });

    const tenantTokenObj = signToken({
      partyId: tenantParty.id,
      agreementId: agreement.id,
      role: 'tenant',
    });

    // 5. Update agreement status and tokens in the database using service-role client
    const { error: agreementUpdateError } = await supabaseServiceRole
      .from('agreements')
      .update({
        status: 'pending_confirmation',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agreementId);

    if (agreementUpdateError) throw agreementUpdateError;

    const { error: landlordUpdateError } = await supabaseServiceRole
      .from('agreement_parties')
      .update({
        token: landlordTokenObj.token,
        token_expires_at: landlordTokenObj.expiresAt.toISOString(),
      })
      .eq('id', landlordParty.id);

    if (landlordUpdateError) throw landlordUpdateError;

    const { error: tenantUpdateError } = await supabaseServiceRole
      .from('agreement_parties')
      .update({
        token: tenantTokenObj.token,
        token_expires_at: tenantTokenObj.expiresAt.toISOString(),
      })
      .eq('id', tenantParty.id);

    if (tenantUpdateError) throw tenantUpdateError;

    // 6. Record in Audit Log
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await supabaseServiceRole.from('audit_log').insert({
      agreement_id: agreement.id,
      party_id: landlordParty.id,
      action: 'invited',
      ip,
      user_agent: userAgent,
      metadata_json: {
        landlord_email: landlordParty.email,
        tenant_email: tenantParty.email,
      },
    });

    // 7. Dispatch emails containing the link
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const originUrl = `${protocol}://${host}`;

    const landlordHubUrl = `${originUrl}/a/${landlordTokenObj.token}`;
    const tenantHubUrl = `${originUrl}/a/${tenantTokenObj.token}`;

    // Dispatches (handles sandbox logging internally if client fails/skipped)
    await sendInviteEmail(landlordParty.email, landlordParty.name, 'landlord', landlordHubUrl);
    await sendInviteEmail(tenantParty.email, tenantParty.name, 'tenant', tenantHubUrl);

    return NextResponse.json({
      success: true,
      message: 'Invitations generated and emailed successfully.',
      landlordToken: landlordTokenObj.token,
      tenantToken: tenantTokenObj.token,
    });
  } catch (err: any) {
    console.error('Error executing invite transaction:', err);
    return NextResponse.json(
      { error: err.message || 'An internal error occurred during the invite process.' },
      { status: 500 }
    );
  }
}
