'use client';

import { useState, useSyncExternalStore } from 'react';
import Header from '@/components/Header';
import { CandidateId, ELECTION_ID, submitBallot, VotingApiError, VotingTicket } from '@/lib/voting-api';

const parties: { id: CandidateId; name: string; desc: string }[] = [
  { id: 'candidate-a', name: 'Liste A (PDA)', desc: 'Premier choix de cette élection de démonstration.' },
  { id: 'candidate-b', name: 'Liste B (PDB)', desc: 'Deuxième choix de cette élection de démonstration.' },
];

const subscribe = () => () => {};
const getStoredTicket = () => sessionStorage.getItem('voting-ticket');
const getServerTicket = () => null;

function parseTicket(raw: string | null): VotingTicket | null {
  try {
    const saved = JSON.parse(raw || 'null') as VotingTicket | null;
    if (saved && typeof saved.token === 'string' && saved.token && saved.election_id === ELECTION_ID &&
        typeof saved.expires_at === 'string' && Number.isFinite(Date.parse(saved.expires_at)) &&
        Date.parse(saved.expires_at) > Date.now()) return saved;
  } catch { /* invalid browser state is not a ticket */ }
  return null;
}

export default function VotePage() {
  const [selectedParty, setSelectedParty] = useState<CandidateId | ''>('');
  const ticket = parseTicket(useSyncExternalStore(subscribe, getStoredTicket, getServerTicket));
  const ticketError = ticket ? '' : 'Ticket absent ou expiré. Retournez à la vérification d’identité.';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState('');

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || !ticket || loading) return;
    if (Date.parse(ticket.expires_at) <= Date.now()) {
      sessionStorage.removeItem('voting-ticket');
      setError('Ticket absent ou expiré. Retournez à la vérification d’identité.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await submitBallot(ticket.token, selectedParty);
      sessionStorage.removeItem('voting-ticket');
      setReceipt(result.receipt);
    } catch (err) {
      if (err instanceof VotingApiError) {
        setError(err.status === 401 ? 'Ticket invalide ou expiré.' :
          err.status === 409 ? 'Ticket déjà utilisé ou élection fermée.' :
          'Vote non confirmé. Veuillez réessayer.');
      } else {
        setError('Service de vote inaccessible. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto py-10 px-4 sm:px-6 w-full">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Étape 2 / 2 - Bureau de vote</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Urne Électronique</h2>
            <p className="text-sm text-slate-600 mt-1">Sélectionnez une des deux listes enregistrées pour cette élection.</p>
          </div>
          {receipt ? (
            <div role="status" className="bg-emerald-50 border-l-4 border-emerald-600 p-6 text-emerald-900 rounded-r-lg">
              <p className="font-bold text-lg">Bulletin scellé et enregistré !</p>
              <p className="text-sm mt-1">Référence de réception : <code>{receipt}</code></p>
            </div>
          ) : (
            <form onSubmit={handleVoteSubmit} className="space-y-6">
              {ticketError && <p role="alert" className="text-red-700">{ticketError}</p>}
              {error && <p role="alert" className="text-red-700">{error}</p>}
              <div className="grid grid-cols-1 gap-4">
                {parties.map((parti) => (
                  <label key={parti.id} className={`block border p-4 rounded-lg cursor-pointer transition ${
                    selectedParty === parti.id ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <div className="flex items-start">
                      <input type="radio" name="party" value={parti.id} checked={selectedParty === parti.id}
                        onChange={() => setSelectedParty(parti.id)}
                        className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                      <div className="ml-4">
                        <span className="block text-base font-bold text-slate-900">{parti.name}</span>
                        <span className="block text-sm text-slate-600 mt-0.5">{parti.desc}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <button type="submit" disabled={!selectedParty || !ticket || loading}
                className="w-full py-3 px-4 border border-transparent rounded-md shadow text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition disabled:opacity-50">
                {loading ? 'Enregistrement en cours...' : 'Confirmer mon choix et voter'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
