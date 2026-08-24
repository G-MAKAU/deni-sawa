import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  return NextResponse.json({
    hasSecret: !!secret,
    secretLength: secret?.length ?? 0,
    secretPrefix: secret?.slice(0, 4) ?? 'none',
    authHeader: authHeader ?? 'none',
    authHeaderPrefix: authHeader?.slice(0, 10) ?? 'none',
    match: secret ? authHeader === `Bearer ${secret}` : false,
  });
}
