export const ELECTION_ID = 'demo-2026';

export type IdentityInput = {
  cin: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  election_id: typeof ELECTION_ID;
  email?: string;
};

export type VotingTicket = {
  token: string;
  election_id: string;
  expires_at: string;
  /** Optional address for the post-vote "thanks for voting" email. */
  email?: string;
};

export type CandidateId = 'candidate-a' | 'candidate-b';

type RequestOptions = { baseUrl?: string; fetcher?: typeof fetch };
type BallotOptions = RequestOptions & { email?: string };

export class VotingApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = 'VotingApiError';
    this.status = status;
    this.code = code;
  }
}

const identityUrl = '/api';
const ballotUrl = process.env.NEXT_PUBLIC_BALLOT_API_URL || 'https://oci-bb-vps.tail6034ec.ts.net';

async function postJson(baseUrl: string, path: string, body: object, fetcher: typeof fetch) {
  const response = await fetcher(`${baseUrl.replace(/\/+$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (response.status !== 201) {
    let code = 'http_error';
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = data.detail;
      if (detail && typeof detail === 'object' && 'error' in detail && typeof detail.error === 'string') {
        code = detail.error;
      }
    }
    throw new VotingApiError(response.status, code);
  }
  return data;
}

export async function verifyIdentity(input: IdentityInput, options: RequestOptions = {}): Promise<VotingTicket> {
  const data = await postJson(options.baseUrl ?? identityUrl, '/verify', input, options.fetcher ?? fetch);
  if (!data || typeof data !== 'object' || !('token' in data) || typeof data.token !== 'string' ||
      !data.token || !('election_id' in data) || data.election_id !== ELECTION_ID ||
      !('expires_at' in data) || typeof data.expires_at !== 'string') {
    throw new VotingApiError(201, 'invalid_response');
  }
  return { token: data.token, election_id: ELECTION_ID, expires_at: data.expires_at };
}

export async function submitBallot(token: string, candidateId: CandidateId, options: BallotOptions = {}): Promise<{ receipt: string }> {
  const email = options.email?.trim();
  const data = await postJson(options.baseUrl ?? ballotUrl, '/vote', {
    token, election_id: ELECTION_ID, candidate_id: candidateId,
    ...(email ? { email } : {}),
  }, options.fetcher ?? fetch);
  if (!data || typeof data !== 'object' || !('status' in data) || data.status !== 'recorded' ||
      !('receipt' in data) || typeof data.receipt !== 'string' || !data.receipt) {
    throw new VotingApiError(201, 'invalid_response');
  }
  return { receipt: data.receipt };
}
