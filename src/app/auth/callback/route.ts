import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
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
              // Ignore if called from a place that cannot set cookies (e.g. Server Component)
            }
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const forwardedHost = request.headers.get('x-forwarded-host');
        const host = request.headers.get('host');
        const targetHost = forwardedHost || host;

        if (targetHost) {
          const isLocal = targetHost.includes('localhost') || targetHost.includes('127.0.0.1');
          const protocol = isLocal ? 'http' : (request.headers.get('x-forwarded-proto') || 'https');
          return NextResponse.redirect(`${protocol}://${targetHost}${next}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Redirect to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth-code-exchange-failed`);
}
