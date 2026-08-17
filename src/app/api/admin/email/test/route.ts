import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { verifySmtpConnection } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');
    const status = await verifySmtpConnection();
    return NextResponse.json(status);
  } catch (error) {
    return jsonAdminError(error, 'Failed to test SMTP connection');
  }
}
