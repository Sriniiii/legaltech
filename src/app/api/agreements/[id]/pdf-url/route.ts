import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseServiceRole } from '@/lib/supabase/server';

export async function GET(
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
          // Ignore cookie write errors in API routes
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

    // 3. Fetch latest document record
    const { data: document, error: docError } = await supabaseServiceRole
      .from('documents')
      .select('*')
      .eq('agreement_id', agreementId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Signed PDF document not found for this agreement.' }, { status: 404 });
    }

    // 4. Generate short-lived signed storage URL (15 minutes)
    const { data: signedUrlObj, error: signUrlError } = await supabaseServiceRole.storage
      .from('agreements')
      .createSignedUrl(document.storage_path, 60 * 15); // 15 minutes validity

    if (signUrlError || !signedUrlObj) {
      throw signUrlError || new Error('Failed to generate signed URL from Storage');
    }

    // 5. Perform HTTP 307 Temporary Redirect to the signed URL
    return NextResponse.redirect(signedUrlObj.signedUrl);
  } catch (err: any) {
    console.error(`[GET /api/agreements/[id]/pdf-url] Internal error:`, err);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  }
}
