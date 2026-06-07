const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')!;
const GITHUB_REPO = 'chenbaitao980-bot/TaskotaFront';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Require admin auth (Supabase JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const filename = formData.get('filename') as string | null;
    const platform = formData.get('platform') as string | null;

    if (!file || !filename || !platform) {
      return new Response(JSON.stringify({ error: 'Missing required fields: file, filename, platform' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ghHeaders: Record<string, string> = {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // Step 1: Get or create v-latest release
    let releaseId: number;
    const releaseRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/v-latest`,
      { headers: ghHeaders }
    );

    if (releaseRes.ok) {
      const data = await releaseRes.json();
      releaseId = data.id;
    } else if (releaseRes.status === 404) {
      const createRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases`,
        {
          method: 'POST',
          headers: { ...ghHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag_name: 'v-latest', name: 'Latest Release', draft: false, prerelease: false }),
        }
      );
      if (!createRes.ok) {
        const body = await createRes.text();
        throw new Error(`Create release failed (${createRes.status}): ${body}`);
      }
      const data = await createRes.json();
      releaseId = data.id;
    } else {
      const body = await releaseRes.text();
      throw new Error(`Get release failed (${releaseRes.status}): ${body}`);
    }

    // Step 2: Delete existing asset with same name (idempotent overwrite)
    const assetsRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/${releaseId}/assets`,
      { headers: ghHeaders }
    );
    if (assetsRes.ok) {
      const assets: { id: number; name: string }[] = await assetsRes.json();
      const existing = assets.find(a => a.name === filename);
      if (existing) {
        await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/assets/${existing.id}`,
          { method: 'DELETE', headers: ghHeaders }
        );
      }
    }

    // Step 3: Upload asset to GitHub
    const fileBuffer = await file.arrayBuffer();
    const uploadRes = await fetch(
      `https://uploads.github.com/repos/${GITHUB_REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(filename)}`,
      {
        method: 'POST',
        headers: {
          ...ghHeaders,
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer,
      }
    );

    if (!uploadRes.ok) {
      const body = await uploadRes.text();
      throw new Error(`GitHub upload failed (${uploadRes.status}): ${body}`);
    }

    const uploadData = await uploadRes.json();

    return new Response(
      JSON.stringify({ url: uploadData.browser_download_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
