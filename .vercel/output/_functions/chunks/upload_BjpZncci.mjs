const prerender = false;
const SUPABASE_URL = "https://wlehkvsxftyxmxelcaps.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZWhrdnN4ZnR5eG14ZWxjYXBzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ4MjY2OSwiZXhwIjoyMDk1MDU4NjY5fQ.70L4MTVMbPYj8u1SzVrCZ7426MONlzkEbcFUsv2pWI4";
const FILENAME_MAP = {
  android_apk: "taskora-latest.apk",
  windows_zip: "taskora-latest.zip"
};
const POST = async ({ request }) => {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing authorization token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "apikey": SERVICE_ROLE_KEY
    }
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const file = formData.get("file");
  const platform = formData.get("platform");
  if (!file || !platform) {
    return new Response(JSON.stringify({ error: "Missing file or platform" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const filename = FILENAME_MAP[platform];
  if (!filename) {
    return new Response(JSON.stringify({ error: `Unknown platform: ${platform}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const fileBuffer = await file.arrayBuffer();
  const storageRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/downloads/${filename}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "apikey": SERVICE_ROLE_KEY,
        "Content-Type": "application/octet-stream",
        "x-upsert": "true"
      },
      body: fileBuffer
    }
  );
  if (!storageRes.ok) {
    const errText = await storageRes.text();
    return new Response(
      JSON.stringify({ error: `Storage upload failed (${storageRes.status}): ${errText}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/downloads/${filename}`;
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/download_links?platform=eq.${platform}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ url: publicUrl })
    }
  );
  if (!patchRes.ok) {
    const errText = await patchRes.text();
    return new Response(
      JSON.stringify({ error: `DB update failed (${patchRes.status}): ${errText}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify({ url: publicUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
