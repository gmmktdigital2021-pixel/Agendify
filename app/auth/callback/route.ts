import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Se houver um parâmetro next customizado, use-o (padrão /dashboard)
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
    
    // Troca o código mágico temporário pelo Access Token válido
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redireciona via servidor com os auth cookies gravados
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  // Falha na recuperação da sessão
  const siteUrlFallback = process.env.NEXT_PUBLIC_SITE_URL || origin;
  return NextResponse.redirect(`${siteUrlFallback}/login?error=invalid_link`);
}
