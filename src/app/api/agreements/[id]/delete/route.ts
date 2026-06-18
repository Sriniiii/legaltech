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
          // Ignore
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

    // 3. Delete agreement (will cascade delete parties, documents, and audit logs)
    const { error: deleteError } = await supabaseServiceRole
      .from('agreements')
      .delete()
      .eq('id', agreementId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Agreement deleted successfully.',
    });
  } catch (err: any) {
    console.error(`[POST /api/agreements/[id]/delete] Internal error:`, err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
