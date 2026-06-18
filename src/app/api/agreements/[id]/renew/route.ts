import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseServiceRole } from '@/lib/supabase/server';

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
    // 2. Fetch original agreement and check ownership
    const { data: original, error: originalError } = await supabaseServiceRole
      .from('agreements')
      .select('*')
      .eq('id', agreementId)
      .single();

    if (originalError || !original) {
      return NextResponse.json({ error: 'Original agreement not found.' }, { status: 404 });
    }

    if (original.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this agreement.' }, { status: 403 });
    }

    // 3. Fetch original parties
    const { data: originalParties, error: partiesError } = await supabaseServiceRole
      .from('agreement_parties')
      .select('*')
      .eq('agreement_id', agreementId);

    if (partiesError || !originalParties || originalParties.length === 0) {
      return NextResponse.json({ error: 'Original parties not found.' }, { status: 404 });
    }

    // 4. Create cloned new agreement (starts as draft, increments version)
    const { data: newAgreement, error: createError } = await supabaseServiceRole
      .from('agreements')
      .insert({
        owner_id: user.id,
        rent_amount: original.rent_amount,
        deposit_amount: original.deposit_amount,
        maintenance_amount: original.maintenance_amount,
        term_months: original.term_months,
        lock_in_months: original.lock_in_months,
        notice_period_days: original.notice_period_days,
        property_json: original.property_json,
        clauses_json: original.clauses_json,
        status: 'draft',
        version: original.version + 1,
      })
      .select()
      .single();

    if (createError || !newAgreement) throw createError || new Error('Failed to create new cloned agreement.');

    // 5. Create new parties linked to new agreement
    const newPartiesPayload = originalParties.map(p => ({
      agreement_id: newAgreement.id,
      role: p.role,
      name: p.name,
      email: p.email,
      phone: p.phone,
      token: null,
      token_expires_at: null,
      confirmed_at: null,
      signed_at: null,
      signature_meta_json: null,
    }));

    const { error: createPartiesError } = await supabaseServiceRole
      .from('agreement_parties')
      .insert(newPartiesPayload);

    if (createPartiesError) throw createPartiesError;

    // 6. Write to audit logs
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Original agreement audit log
    await supabaseServiceRole.from('audit_log').insert({
      agreement_id: agreementId,
      action: 'renewed',
      ip,
      user_agent: userAgent,
      metadata_json: {
        message: `Agreement renewed. Cloned into new draft version ${newAgreement.version}.`,
        new_agreement_id: newAgreement.id,
        user_id: user.id,
      },
    });

    // Cloned agreement audit log
    await supabaseServiceRole.from('audit_log').insert({
      agreement_id: newAgreement.id,
      action: 'created',
      ip,
      user_agent: userAgent,
      metadata_json: {
        message: `Agreement draft cloned from original version ${original.version} for renewal.`,
        original_agreement_id: agreementId,
        user_id: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      newAgreementId: newAgreement.id,
      message: 'Agreement cloned for renewal successfully.',
    });
  } catch (err: any) {
    console.error(`[POST /api/agreements/[id]/renew] Internal error:`, err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
