import { dbQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface BookingService {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  duration_minutes: number;
  allow_custom_amount: boolean;
}

export async function GET() {
  try {
    const services = await dbQuery<BookingService[]>(
      'SELECT id, name, slug, description, short_description, price, duration_minutes, allow_custom_amount FROM services WHERE is_active = 1 ORDER BY price ASC'
    );
    return Response.json({ ok: true, services }, { status: 200 });
  } catch (err) {
    console.error('booking/services: error:', err);
    return Response.json({ ok: false, error: 'Failed to load services.', detail: String(err) }, { status: 500 });
  }
}
