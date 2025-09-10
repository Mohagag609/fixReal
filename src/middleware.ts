import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // السماح لصفحة الإعداد و API الإعداد بالمرور دائماً
  if (request.nextUrl.pathname.startsWith('/setup') || 
      request.nextUrl.pathname.startsWith('/api/setup')) {
    return NextResponse.next()
  }

  // السماح للملفات الثابتة والـ API routes بالمرور
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api') ||
      request.nextUrl.pathname.startsWith('/favicon.ico') ||
      request.nextUrl.pathname.startsWith('/manifest.json')) {
    return NextResponse.next()
  }

  // للصفحات الأخرى، سنتحقق من وجود الإعدادات في الصفحة نفسها
  // بدلاً من التحقق هنا لتجنب مشاكل الاستيراد
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}