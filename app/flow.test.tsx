import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';
import VotePage from './vote/page';

const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); sessionStorage.clear(); });
beforeEach(() => { sessionStorage.clear(); });

test('the identity form checks AWS and carries its real token to the vote page', async () => {
  const fetcher = vi.fn(async () => new Response(JSON.stringify({
    token: 'aws-signed-ticket', election_id: 'demo-2026', expires_at: '2099-01-01T00:00:00Z',
  }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
  vi.stubGlobal('fetch', fetcher);
  render(<Home />);
  await userEvent.type(screen.getByLabelText('Nom'), 'El Idrissi');
  await userEvent.type(screen.getByLabelText('Prénom'), 'Amina');
  await userEvent.type(screen.getByLabelText('Numéro de CIN'), 'AB123456');
  fireEvent.change(screen.getByLabelText('Date de naissance'), { target: { value: '1995-04-12' } });
  await userEvent.click(screen.getByRole('button', { name: /Vérifier l'identité/i }));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/vote'));
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(JSON.parse((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({
    cin: 'AB123456', first_name: 'Amina', last_name: 'El Idrissi',
    birth_date: '1995-04-12', election_id: 'demo-2026',
  });
  expect(JSON.parse(sessionStorage.getItem('voting-ticket') || '{}').token).toBe('aws-signed-ticket');
});

test('a rejected identity stays on the form without a ticket', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ detail: { error: 'verification_failed' } }), { status: 403 })));
  render(<Home />);
  await userEvent.type(screen.getByLabelText('Nom'), 'Unknown');
  await userEvent.type(screen.getByLabelText('Prénom'), 'Nobody');
  await userEvent.type(screen.getByLabelText('Numéro de CIN'), 'ZZ999999');
  fireEvent.change(screen.getByLabelText('Date de naissance'), { target: { value: '1990-01-01' } });
  await userEvent.click(screen.getByRole('button', { name: /Vérifier l'identité/i }));
  await screen.findByText(/identité.*non vérifiée/i);
  expect(push).not.toHaveBeenCalled();
  expect(sessionStorage.getItem('voting-ticket')).toBeNull();
});

test('the ballot page refuses submission without a current ticket', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  render(<VotePage />);
  expect(await screen.findByText(/ticket.*absent ou expiré/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: /Confirmer mon choix/i }).hasAttribute('disabled')).toBe(true);
  expect(fetcher).not.toHaveBeenCalled();
});

test('the ballot page confirms only after Go records the ballot', async () => {
  sessionStorage.setItem('voting-ticket', JSON.stringify({ token: 'aws-signed-ticket', election_id: 'demo-2026', expires_at: '2099-01-01T00:00:00Z' }));
  const fetcher = vi.fn(async () => new Response(JSON.stringify({ status: 'recorded', receipt: 'random-receipt' }), { status: 201 }));
  vi.stubGlobal('fetch', fetcher);
  render(<VotePage />);
  await userEvent.click(await screen.findByRole('radio', { name: /Liste A/i }));
  await userEvent.click(screen.getByRole('button', { name: /Confirmer mon choix/i }));
  expect(await screen.findByText(/Bulletin.*enregistré/i)).toBeTruthy();
  expect(screen.getByText(/random-receipt/)).toBeTruthy();
  expect(JSON.parse((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({ token: 'aws-signed-ticket', election_id: 'demo-2026', candidate_id: 'candidate-a' });
  expect(sessionStorage.getItem('voting-ticket')).toBeNull();
});
