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

async function writeLog(adminEmail: string, action: string, detail: string) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/member_config_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        admin_email: adminEmail,
        action,
        detail,
      }),
    });
  } catch (_) {
    // 日志写入失败不影响主流程
  }
}

// GET /api/admin/whitelist
export const GET: APIRoute = async ({ request }) => {
  const admin = await verifyAdmin(request);
  if (!admin) return errorResponse('Unauthorized', 401);

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vip_whitelist?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) return errorResponse(`Failed to fetch whitelist (${res.status})`, 502);

    const data = await res.json();
    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : String(err), 500);
  }
};

// POST /api/admin/whitelist
export const POST: APIRoute = async ({ request }) => {
  const admin = await verifyAdmin(request);
  if (!admin) return errorResponse('Unauthorized', 401);

  try {
    const body = await request.json();
    const email = (body.email as string)?.trim();
    const note = (body.note as string | undefined)?.trim() ?? '';

    if (!email) return errorResponse('email 不能为空', 400);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/vip_whitelist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ email, note }),
    });

    if (!res.ok) {
      const errText = await res.text();
      // 检查唯一约束冲突
      if (res.status === 409 || errText.includes('duplicate')) {
        return errorResponse('该邮箱已在白名单中', 409);
      }
      return errorResponse(`添加失败 (${res.status})`, 502);
    }

    const data = await res.json();

    await writeLog(admin.email, 'whitelist_add', `添加白名单: ${email}${note ? `，备注: ${note}` : ''}`);

    return jsonResponse(data[0] ?? data);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : String(err), 500);
  }
};

// DELETE /api/admin/whitelist
export const DELETE: APIRoute = async ({ request }) => {
  const admin = await verifyAdmin(request);
  if (!admin) return errorResponse('Unauthorized', 401);

  try {
    const body = await request.json();
    const email = (body.email as string)?.trim();

    if (!email) return errorResponse('email 不能为空', 400);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vip_whitelist?email=eq.${encodeURIComponent(email)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) return errorResponse(`删除失败 (${res.status})`, 502);

    await writeLog(admin.email, 'whitelist_remove', `移除白名单: ${email}`);

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : String(err), 500);
  }
};
