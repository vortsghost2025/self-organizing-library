import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check localhost origin (127.0.0.1, ::1, localhost)
  const hostname = request.nextUrl.host.split(':')[0];
  const clientIp = (request as any).ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '';
  const isLocalhost =
    hostname === 'localhost' ||
    clientIp === '127.0.0.1' ||
    clientIp === '::1';

  if (isLocalhost) {
    return NextResponse.next();
  }

  // Check valid X-Lane-Identity header
  const laneIdentity = request.headers.get('X-Lane-Identity');
  const allowedLanes = ['archivist', 'library', 'swarmmind', 'kernel'];
  if (laneIdentity && allowedLanes.includes(laneIdentity.toLowerCase())) {
    return NextResponse.next();
  }

  // Check X-Lane-Signature header presence
  const laneSignature = request.headers.get('X-Lane-Signature');
  if (laneSignature) {
    return NextResponse.next();
  }

  // Unauthorized
  return NextResponse.json(
    { error: 'Unauthorized', message: 'API access requires lane identity or localhost origin' },
    { status: 401 }
  );
}

export const config = {
  matcher: '/api/:path*',
};
