export const prerender = false;

import type { APIRoute } from 'astro';

const SUPABASE_URL = 'https://wlehkvsxftyxmxelcaps.supabase.co';
const SERVICE_ROLE_KEY =
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZWhrdnN4ZnR5eG14ZWxjYXBzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ4MjY2OSwiZXhwIjoyMDk1MDU4NjY5fQ.70L4MTVMbPYj8u1SzVrCZ7426MONlzkEbcFUsv2pWI4';

const FILENAME_MAP: Record<string, string> = {
  android_apk: 'taskora-latest.apk',
  windows_zip: 'taskora-latest.zip',
};

export const POST: APIRoute = async ({ request }) => {
  // 1. Validate admin JWT from Authorization header
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify token against Supabase auth
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });

  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Parse JSON body: { platform: string }
  let platform: string;
  try {
    const body = await request.json();
    platform = body?.platform;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!platform) {
    return new Response(JSON.stringify({ error: 'Missing platform' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const filename = FILENAME_MAP[platform];
  if (!filename) {
    return new Response(JSON.stringify({ error: `Unknown platform: ${platform}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Create signed upload URL via Supabase Storage (tiny request, no file data)
  const signRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/upload/sign/downloads/${filename}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  if (!signRes.ok) {
    const errText = await signRes.text();
    return new Response(
      JSON.stringify({ error: `Failed to create signed URL (${signRes.status}): ${errText}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { signedURL } = await signRes.json();
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/downloads/${filename}`;

  return new Response(
    JSON.stringify({
      signedURL: `${SUPABASE_URL}${signedURL}`,
      filename,
      publicUrl,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
