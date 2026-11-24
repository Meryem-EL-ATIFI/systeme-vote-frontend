// Frontend-owned route: the browser stays on HTTPS, while AWS hosts /verify.
// The demo AWS endpoint currently listens publicly on port 3000.
const identityUpstream = process.env.IDENTITY_UPSTREAM_URL || 'http://13.60.56.116:3000';

export async function POST(request: Request): Promise<Response> {
  let body: string;
  try {
    body = await request.text();
    if (body.length > 4096) return Response.json({ detail: { error: 'invalid_request' } }, { status: 400 });
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return Response.json({ detail: { error: 'invalid_request' } }, { status: 400 });
    }
  } catch {
    return Response.json({ detail: { error: 'invalid_request' } }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${identityUpstream.replace(/\/+$/, '')}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return Response.json({ detail: { error: 'identity_unavailable' } }, {
      status: 502, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
