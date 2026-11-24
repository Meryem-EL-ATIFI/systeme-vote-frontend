import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyIdentity, submitBallot, VotingApiError } from './voting-api.ts';

test('browser identity verification uses its same-origin frontend route', async () => {
  await verifyIdentity(voter, {
    fetcher: async (url) => {
      assert.equal(url, '/api/verify');
      return new Response(JSON.stringify({ token: 'signed-demo-ticket', election_id: 'demo-2026', expires_at: '2099-01-01T00:00:00Z' }), { status: 201 });
    },
  });
});

const voter = {
  cin: 'AB123456', first_name: 'Amina', last_name: 'El Idrissi',
  birth_date: '1995-04-12', election_id: 'demo-2026',
};

test('identity verification sends the exact AWS contract and returns its ticket', async () => {
  let requests = 0;
  const ticket = await verifyIdentity(voter, {
    baseUrl: 'https://identity.example',
    fetcher: async (url, init) => {
      requests++;
      assert.equal(url, 'https://identity.example/verify');
      assert.equal(init.method, 'POST');
      assert.equal(init.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(init.body), voter);
      return new Response(JSON.stringify({
        token: 'signed-demo-ticket', election_id: 'demo-2026',
        expires_at: '2026-11-25T23:00:00Z',
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    },
  });
  assert.equal(requests, 1);
  assert.equal(ticket.token, 'signed-demo-ticket');
  assert.equal(ticket.election_id, 'demo-2026');
});

test('failed identity check never creates a ticket', async () => {
  await assert.rejects(
    verifyIdentity(voter, {
      baseUrl: 'https://identity.example',
      fetcher: async () => new Response(JSON.stringify({ detail: { error: 'verification_failed' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }),
    }),
    error => error instanceof VotingApiError && error.status === 403 && error.code === 'verification_failed',
  );
});

test('ballot sends only the Go contract and requires a confirmed 201 receipt', async () => {
  const result = await submitBallot('signed-demo-ticket', 'candidate-a', {
    baseUrl: 'https://ballot.example',
    fetcher: async (url, init) => {
      assert.equal(url, 'https://ballot.example/vote');
      assert.equal(init.method, 'POST');
      assert.deepEqual(JSON.parse(init.body), {
        token: 'signed-demo-ticket', election_id: 'demo-2026', candidate_id: 'candidate-a',
      });
      return new Response(JSON.stringify({ status: 'recorded', receipt: 'random-receipt' }),
        { status: 201, headers: { 'Content-Type': 'application/json' } });
    },
  });
  assert.equal(result.receipt, 'random-receipt');
});

test('a spent ticket is not reported as a successful ballot', async () => {
  await assert.rejects(
    submitBallot('signed-demo-ticket', 'candidate-b', {
      baseUrl: 'https://ballot.example',
      fetcher: async () => new Response('token already used', { status: 409 }),
    }),
    error => error instanceof VotingApiError && error.status === 409,
  );
});

test('a malformed successful response is not reported as a verified identity', async () => {
  await assert.rejects(
    verifyIdentity(voter, {
      baseUrl: 'https://identity.example',
      fetcher: async () => new Response(JSON.stringify({ token: '' }), { status: 201 }),
    }),
    error => error instanceof VotingApiError && error.code === 'invalid_response',
  );
});
