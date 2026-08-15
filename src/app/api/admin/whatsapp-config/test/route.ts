import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { getWhatsAppConfig, decryptCredentials, testProviderConnection } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin(request, 'create');

    const config = await getWhatsAppConfig(supabase);

    if (!config) {
      return NextResponse.json({ error: 'WhatsApp configuration has not been saved yet.' }, { status: 422 });
    }

    let result;
    try {
      const creds = decryptCredentials(config);
      result = await testProviderConnection(creds);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not verify credentials.' }, { status: 502 });
    }

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Connection test failed.' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonAdminError(error, 'Failed to test WhatsApp connection');
  }
}
