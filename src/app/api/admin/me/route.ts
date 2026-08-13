import { NextResponse } from 'next/server';
import { requireBlogAdmin, jsonAdminError } from '../_auth';

export async function GET(request: Request) {
  try {
    const { currentAdmin } = await requireBlogAdmin(request as Parameters<typeof requireBlogAdmin>[0], 'read');

    return NextResponse.json({
      admin: {
        email: currentAdmin.email,
        full_name: currentAdmin.full_name,
        role: currentAdmin.role,
      },
    });
  } catch (error) {
    return jsonAdminError(error, 'Failed to load admin session');
  }
}