'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';

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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />
      <div className="w-full bg-emerald-900 text-white py-8 px-6 border-b-4 border-red-600">
        <div className="max-w-6xl mx-auto">
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">Démonstration</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3">Tableau de bord du scrutin</h2>
          <p className="text-emerald-100 mt-2">Participation enregistrée par l’urne Oracle OCI dans Neon PostgreSQL.</p>
        </div>
      </div>
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Élection de démonstration · demo-2026</p>
            <p className="text-xs text-slate-500">Actualisation automatique toutes les 15 secondes{refreshedAt ? ` · Dernière lecture : ${refreshedAt.toLocaleTimeString('fr-FR')}` : ''}</p>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading}
            className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-50">
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {stats ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-600">Bulletins enregistrés</h3>
                <p className="mt-3 text-5xl font-extrabold text-emerald-900 tabular-nums">{stats.total_ballots}</p>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-600">Jetons utilisés</h3>
                <p className="mt-3 text-5xl font-extrabold text-slate-900 tabular-nums">{stats.used_tickets}</p>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-600">État du scrutin</h3>
                <p className={`mt-4 text-2xl font-bold ${stats.open ? 'text-emerald-800' : 'text-red-700'}`}>
                  {stats.open ? 'Ouvert' : 'Fermé'}
                </p>
                <p className="mt-2 text-xs text-slate-500">Fin prévue : {new Date(stats.closes_at).toLocaleString('fr-FR', { timeZone: 'UTC' })} UTC</p>
              </section>
            </div>
            {stats.total_ballots !== stats.used_tickets &&
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Les totaux diffèrent : la base contient des données de démonstration préexistantes. Ne les présentez pas comme un taux de participation réel.
              </p>}
            <p className="text-sm text-slate-600">Les choix restent chiffrés dans Neon ; cette page montre les enregistrements, pas un dépouillement par liste.</p>
          </>
        ) : !error && <p role="status" className="text-sm text-slate-600">Chargement des statistiques depuis Oracle...</p>}
      </main>
    </div>
  );
}
