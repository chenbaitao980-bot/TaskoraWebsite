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
  let platform;
  try {
    const body = await request.json();
    platform = body?.platform;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!platform) {
    return new Response(JSON.stringify({ error: "Missing platform" }), {
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
  const signRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/upload/sign/downloads/${filename}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "apikey": SERVICE_ROLE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }
  );
  if (!signRes.ok) {
    const errText = await signRes.text();
    return new Response(
      JSON.stringify({ error: `Failed to create signed URL (${signRes.status}): ${errText}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
  const { signedURL } = await signRes.json();
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/downloads/${filename}`;
  return new Response(
    JSON.stringify({
      signedURL: `${SUPABASE_URL}${signedURL}`,
      filename,
      publicUrl
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
