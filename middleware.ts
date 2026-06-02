import { NextRequest, NextResponse } from 'next/server'
import { addSecurityHeaders } from '@/lib/security'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  return addSecurityHeaders(res)
}

export const config = {
  matcher: [
    /*
     * Apply to all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}