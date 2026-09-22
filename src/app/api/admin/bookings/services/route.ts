import { NextRequest } from 'next/server';
import { requireAdmin, jsonAdminError } from '@/lib/admin-auth';
import { dbQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request, 'read');
    
    const services = await dbQuery(
      `SELECT * FROM services ORDER BY name ASC`
    );
    
    return Response.json({
      ok: true,
      services
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load services');
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request, 'create');
    
    const body = await request.json();
    const { name, slug, description, short_description, price, duration_minutes, is_active, allow_custom_amount } = body;
    
    if (!name || !slug || !price) {
      return Response.json(
        { ok: false, error: 'Name, slug, and price are required' },
        { status: 400 }
      );
    }
    
    // Check if slug already exists
    const existing = await dbQuery(
      `SELECT id FROM services WHERE slug = ?`,
      [slug]
    );
    
    if ((existing as any[]).length > 0) {
      return Response.json(
        { ok: false, error: 'A service with this slug already exists' },
        { status: 400 }
      );
    }
    
    const result = await dbQuery(
      `INSERT INTO services (name, slug, description, short_description, price, duration_minutes, is_active, allow_custom_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, short_description || null, price, duration_minutes || 60, is_active !== false ? 1 : 0, allow_custom_amount ? 1 : 0]
    );
    
    return Response.json({
      ok: true,
      message: 'Service created successfully',
      id: (result as any).insertId
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to create service');
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request, 'update');
    
    const body = await request.json();
    const { id, name, slug, description, short_description, price, duration_minutes, is_active, allow_custom_amount } = body;
    
    if (!id) {
      return Response.json(
        { ok: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    // Check if slug already exists for another service
    if (slug) {
      const existing = await dbQuery(
        `SELECT id FROM services WHERE slug = ? AND id != ?`,
        [slug, id]
      );
      
      if ((existing as any[]).length > 0) {
        return Response.json(
          { ok: false, error: 'A service with this slug already exists' },
          { status: 400 }
        );
      }
    }
    
    await dbQuery(
      `UPDATE services SET 
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        short_description = COALESCE(?, short_description),
        price = COALESCE(?, price),
        duration_minutes = COALESCE(?, duration_minutes),
        is_active = COALESCE(?, is_active),
        allow_custom_amount = COALESCE(?, allow_custom_amount)
       WHERE id = ?`,
      [name, slug, description, short_description, price, duration_minutes, is_active ? 1 : 0, allow_custom_amount ? 1 : 0, id]
    );
    
    return Response.json({
      ok: true,
      message: 'Service updated successfully'
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to update service');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request, 'delete');
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return Response.json(
        { ok: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    // Check if service has any bookings
    const bookings = await dbQuery(
      `SELECT COUNT(*) as count FROM bookings WHERE service_id = ?`,
      [parseInt(id)]
    );
    
    if ((bookings as any[])[0]?.count > 0) {
      return Response.json(
        { ok: false, error: 'Cannot delete service with existing bookings. Consider deactivating it instead.' },
        { status: 400 }
      );
    }
    
    await dbQuery(
      `DELETE FROM services WHERE id = ?`,
      [parseInt(id)]
    );
    
    return Response.json({
      ok: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to delete service');
  }
}