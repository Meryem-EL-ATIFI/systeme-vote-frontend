// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { GET } from './route';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test('dashboard proxy returns actual Oracle counts without caching', async () => {
  vi.stubEnv('BALLOT_UPSTREAM_URL', 'https://ballot.example/');
  const upstream = { election_id: 'demo-2026', total_ballots: 4, used_tickets: 3, open: true,
    opens_at: '2026-11-23T00:00:00Z', closes_at: '2026-11-25T23:00:00Z' };
  const fetcher = vi.fn(async () => new Response(JSON.stringify(upstream), { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  const response = await GET();
  expect(fetcher).toHaveBeenCalledWith('https://ballot.example/stats', expect.objectContaining({ cache: 'no-store' }));
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(await response.json()).toEqual(upstream);
});

test('dashboard proxy fails closed when Oracle is unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('connection failed'); }));
  const response = await GET();
  expect(response.status).toBe(502);
  expect((await response.json()).error).toBe('dashboard_unavailable');
});
