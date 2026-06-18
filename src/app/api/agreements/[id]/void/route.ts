import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseServiceRole } from '@/lib/supabase/server';
import { sendVoidedEmail } from '@/lib/email';

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
      return NextResponse.json({ error: 'Forbidden: You do not own this agreement.' }, { status: 403 });
    }

    if (['completed', 'expired', 'voided'].includes(agreement.status)) {
      return NextResponse.json({ error: `Cannot void an agreement that is already ${agreement.status}.` }, { status: 400 });
    }

    // 3. Update status to voided
    const { error: updateError } = await supabaseServiceRole
      .from('agreements')
      .update({
        status: 'voided',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agreementId);

    if (updateError) throw updateError;

    // Fetch parties to notify them via email
    const { data: parties, error: partiesError } = await supabaseServiceRole
      .from('agreement_parties')
      .select('*')
      .eq('agreement_id', agreementId);

    if (!partiesError && parties && parties.length > 0) {
      const landlordParty = parties.find((p) => p.role === 'landlord');
      const tenantParty = parties.find((p) => p.role === 'tenant');

      if (landlordParty) {
        await sendVoidedEmail(landlordParty.email, landlordParty.name, 'landlord');
      }
      if (tenantParty) {
        await sendVoidedEmail(tenantParty.email, tenantParty.name, 'tenant');
      }
    }

    // 4. Record action in audit log
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await supabaseServiceRole.from('audit_log').insert({
      agreement_id: agreementId,
      action: 'voided',
      ip,
      user_agent: userAgent,
      metadata_json: {
        message: 'Agreement draft cancelled/voided by landlord owner.',
        user_id: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Agreement voided successfully.',
    });
  } catch (err: any) {
    console.error(`[POST /api/agreements/[id]/void] Internal error:`, err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
