import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from './page';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

const stats = { election_id: 'demo-2026', total_ballots: 4, used_tickets: 3, open: true,
  opens_at: '2026-11-23T00:00:00Z', closes_at: '2026-11-25T23:00:00Z' };

test('dashboard shows the live Oracle aggregates and can refresh them', async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(stats), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ...stats, total_ballots: 5, used_tickets: 4 }), { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  render(<DashboardPage />);
  expect(await screen.findByText('4', { exact: true })).toBeTruthy();
  expect(screen.getByText('3', { exact: true })).toBeTruthy();
  expect(screen.queryByText(/données de démonstration préexistantes/i)).toBeNull();
  expect(screen.queryByText(/résultats par liste/i)).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: /Actualiser/i }));
  await waitFor(() => expect(screen.getByText('5', { exact: true })).toBeTruthy());
  expect(fetcher).toHaveBeenCalledWith('/api/stats', expect.objectContaining({ cache: 'no-store' }));
});

test('dashboard reports upstream failure rather than inventing zero votes', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 502 })));
  render(<DashboardPage />);
  expect((await screen.findByRole('alert')).textContent).toMatch(/indisponible/i);
  expect(screen.queryByText('0', { exact: true })).toBeNull();
});
