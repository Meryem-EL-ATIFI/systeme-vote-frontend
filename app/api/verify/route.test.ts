// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { POST } from './route';

const input = {
  cin: 'ZZ999999', first_name: 'Nobody', last_name: 'Test',
  birth_date: '1990-01-01', election_id: 'demo-2026',
};
const request = (body: string) => new Request('https://frontend.example/api/verify', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

test('frontend route forwards the identity request to AWS and returns verification errors', async () => {
  vi.stubEnv('IDENTITY_UPSTREAM_URL', 'http://13.60.56.116:3000');
  const fetcher = vi.fn(async (url: string, options: RequestInit) => {
    expect(url).toBe('http://13.60.56.116:3000/verify');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual(input);
    return new Response(JSON.stringify({ detail: { error: 'verification_failed' } }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetcher);
  const result = await POST(request(JSON.stringify(input)));
  expect(result.status).toBe(403);
  expect(result.headers.get('Cache-Control')).toBe('no-store');
  expect(await result.json()).toEqual({ detail: { error: 'verification_failed' } });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test('frontend route returns the AWS ticket unchanged on 201', async () => {
  vi.stubEnv('IDENTITY_UPSTREAM_URL', 'http://13.60.56.116:3000');
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    token: 'signed-ticket', election_id: 'demo-2026', expires_at: '2099-01-01T00:00:00Z',
  }), { status: 201, headers: { 'Content-Type': 'application/json' } })));
  const result = await POST(request(JSON.stringify(input)));
  expect(result.status).toBe(201);
  expect((await result.json()).token).toBe('signed-ticket');
});

test('frontend route fails closed when AWS is unreachable', async () => {
  vi.stubEnv('IDENTITY_UPSTREAM_URL', 'http://13.60.56.116:3000');
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('connection failed'); }));
  const result = await POST(request(JSON.stringify(input)));
  expect(result.status).toBe(502);
  expect((await result.json()).detail.error).toBe('identity_unavailable');
});

test('malformed JSON is rejected locally without contacting AWS', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  const result = await POST(request('not-json'));
  expect(result.status).toBe(400);
  expect(fetcher).not.toHaveBeenCalled();
});
