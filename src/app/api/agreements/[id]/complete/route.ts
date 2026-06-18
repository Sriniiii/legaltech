import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseServiceRole } from '@/lib/supabase/server';
import { generateAndDeliverPDF } from '@/lib/pdf/generator';

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

  // 1. Authenticate user session
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
          // Ignore cookie write errors
        }
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    // 2. Fetch agreement and check ownership
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

    if (agreement.status !== 'signing_complete') {
      return NextResponse.json({ error: `Agreement must be in signing_complete status (currently ${agreement.status}).` }, { status: 400 });
    }

    // 3. Update status to completed
    const { error: updateError } = await supabaseServiceRole
      .from('agreements')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agreementId);

    if (updateError) throw updateError;

    // 4. Generate and deliver PDF
    console.log(`[POST /api/agreements/[id]/complete] Triggering PDF generation and delivery...`);
    await generateAndDeliverPDF(agreementId);

    // 5. Record completed state in audit log
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await supabaseServiceRole.from('audit_log').insert({
      agreement_id: agreementId,
      action: 'status_completed',
      ip,
      user_agent: userAgent,
      metadata_json: {
        message: 'Agreement completed and PDF generated via landlord dashboard action.',
        user_id: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Agreement completed and PDF generated successfully.',
    });
  } catch (err: any) {
    console.error(`[POST /api/agreements/[id]/complete] Internal error:`, err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
