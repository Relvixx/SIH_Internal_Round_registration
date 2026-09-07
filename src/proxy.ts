import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error('Proxy Error:', error);
    // Return a basic response instead of crashing
    return new Response(String(error), { status: 500 });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
