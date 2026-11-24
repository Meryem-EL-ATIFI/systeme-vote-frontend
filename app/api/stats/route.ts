// Browser-safe, same-origin proxy for read-only aggregate ballot statistics.

export async function GET(): Promise<Response> {
  const ballotUpstream = process.env.BALLOT_UPSTREAM_URL ||
    process.env.NEXT_PUBLIC_BALLOT_API_URL || 'https://oci-bb-vps.tail6034ec.ts.net';
  try {
    const upstream = await fetch(`${ballotUpstream.replace(/\/+$/, '')}/stats`, {
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) {
      return Response.json({ error: 'dashboard_unavailable' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
    return new Response(await upstream.text(), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'dashboard_unavailable' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
