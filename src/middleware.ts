import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_API_ROUTES = [
  '/api/graph-data',
  '/api/swarmmind/resilience',
  '/api/document-content/',
  '/api/events',
  '/api/governance',
  '/api/health',
  '/api/search',
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublicRoute = PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  const hostname = request.nextUrl.host.split(':')[0];
  const clientIp = (request as any).ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '';
  const isLocalhost =
    hostname === 'localhost' ||
    clientIp === '127.0.0.1' ||
    clientIp === '::1';

  if (isLocalhost) {
    return NextResponse.next();
  }

  const laneIdentity = request.headers.get('X-Lane-Identity');
  const allowedLanes = ['archivist', 'library', 'swarmmind', 'kernel'];
  if (laneIdentity && allowedLanes.includes(laneIdentity.toLowerCase())) {
    return NextResponse.next();
  }

  const laneSignature = request.headers.get('X-Lane-Signature');
  if (laneSignature) {
    return NextResponse.next();
  }

  return NextResponse.json(
    { error: 'Unauthorized', message: 'API access requires lane identity or localhost origin' },
    { status: 401 }
  );
}

export const config = {
  matcher: '/api/:path*',
};
