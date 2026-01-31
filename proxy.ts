import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginOrSignUp =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/sign-up');
  const isLanding = request.nextUrl.pathname === '/landing';

  // Redirect authenticated users from landing, login, or sign-up to app home (/)
  if (user && (isLanding || isLoginOrSignUp)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users from / (dashboard) to landing
  if (!user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/landing';
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to /login, except for public routes
  const isPublicRoute = isLanding || isLoginOrSignUp;
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Exclude static files and images from proxy
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
