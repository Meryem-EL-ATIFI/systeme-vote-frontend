'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type Stats = {
  election_id: string;
  total_ballots: number;
  used_tickets: number;
  open: boolean;
  opens_at: string;
  closes_at: string;
};

function isStats(value: unknown): value is Stats {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<Stats>;
  return typeof data.election_id === 'string' && data.election_id.length > 0 &&
    Number.isSafeInteger(data.total_ballots) && (data.total_ballots ?? -1) >= 0 &&
    Number.isSafeInteger(data.used_tickets) && (data.used_tickets ?? -1) >= 0 &&
    typeof data.open === 'boolean' &&
    typeof data.opens_at === 'string' && Number.isFinite(Date.parse(data.opens_at)) &&
    typeof data.closes_at === 'string' && Number.isFinite(Date.parse(data.closes_at));
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stats', { cache: 'no-store' });
      if (!response.ok) throw new Error('Oracle unavailable');
      const payload: unknown = await response.json();
      if (!isStats(payload)) throw new Error('Invalid Oracle response');
      setStats(payload);
      setRefreshedAt(new Date());
      setError('');
    } catch {
      setError('Statistiques indisponibles. Réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const startup = setTimeout(() => { void refresh(); }, 0);
    const interval = setInterval(() => { void refresh(); }, 15000);
    return () => { clearTimeout(startup); clearInterval(interval); };
  }, [refresh]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <Header active="participation" />
      <main className="mx-auto w-full max-w-6xl flex-grow space-y-6 px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Participation</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" /></span>
              En direct{refreshedAt ? ` · mis à jour à ${refreshedAt.toLocaleTimeString('fr-FR')}` : ''}
            </p>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">
            {loading ? 'Chargement…' : 'Actualiser'}
          </button>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {stats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-slate-500">Bulletins enregistrés</h2>
              <p className="mt-3 text-5xl font-semibold tracking-tight text-emerald-900 tabular-nums">{stats.total_ballots}</p>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-slate-500">Tickets utilisés</h2>
              <p className="mt-3 text-5xl font-semibold tracking-tight text-slate-900 tabular-nums">{stats.used_tickets}</p>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium text-slate-500">État du scrutin</h2>
              <p className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${stats.open ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                {stats.open ? 'Ouvert' : 'Fermé'}
              </p>
              <p className="mt-3 text-sm text-slate-500">Clôture : {new Date(stats.closes_at).toLocaleString('fr-FR', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC</p>
            </section>
          </div>
        ) : !error && <p role="status" className="text-sm text-slate-500">Chargement…</p>}
      </main>
      <Footer />
    </div>
  );
}
