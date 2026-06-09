export const prerender = false;

import type { APIRoute } from 'astro';

const SUPABASE_URL = 'https://wlehkvsxftyxmxelcaps.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZWhrdnN4ZnR5eG14ZWxjYXBzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ4MjY2OSwiZXhwIjoyMDk1MDU4NjY5fQ.70L4MTVMbPYj8u1SzVrCZ7426MONlzkEbcFUsv2pWI4';

async function verifyAdmin(request: Request): Promise<{ email: string } | null> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return null;

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });

  if (!userRes.ok) return null;

  const userData = await userRes.json();
  const role = userData.user_metadata?.role;

  if (role !== 'admin') return null;

  return { email: userData.email ?? '' };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/admin/recharge-tiers
export const GET: APIRoute = async ({ request }) => {
  const admin = await verifyAdmin(request);
  if (!admin) return errorResponse('Unauthorized', 401);

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/member_recharge_tiers?select=*&order=sort_order.asc,amount.asc`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) return errorResponse(`Failed to fetch recharge tiers (${res.status})`, 502);

    const data = await res.json();
    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : String(err), 500);
  }
};

// POST /api/admin/recharge-tiers
export const POST: APIRoute = async ({ request }) => {
  const admin = await verifyAdmin(request);
  if (!admin) return errorResponse('Unauthorized', 401);

  try {
    const body = await request.json();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/member_recharge_tiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return errorResponse(`Failed to create recharge tier (${res.status})`, 502);

    const data = await res.json();
    return jsonResponse(data[0] ?? data);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : String(err), 500);
  }
};

// PUT /api/admin/recharge-tiers
export const PUT: APIRoute = async ({ request }) => {
  const admin = await verifyAdmin(request);
  if (!admin) return errorResponse('Unauthorized', 401);

  try {
    const body = await request.json();
    const id = body.id as string;

    if (!id) return errorResponse('Missing id', 400);

    const { id: _, ...payload } = body;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/member_recharge_tiers?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return errorResponse(`Failed to update recharge tier (${res.status})`, 502);

    const data = await res.json();
    return jsonResponse(data[0] ?? data);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : String(err), 500);
  }
};

// DELETE /api/admin/recharge-tiers
export const DELETE: APIRoute = async ({ request }) => {
  const admin = await verifyAdmin(request);
  if (!admin) return errorResponse('Unauthorized', 401);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return errorResponse('Missing id', 400);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/member_recharge_tiers?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (!res.ok) return errorResponse(`Failed to delete recharge tier (${res.status})`, 502);

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : String(err), 500);
  }
};
