'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Steps from '@/components/Steps';
import { CandidateId, ELECTION_ID, submitBallot, VotingApiError, VotingTicket } from '@/lib/voting-api';

const parties: { id: CandidateId; name: string; badge: string; color: string }[] = [
  { id: 'candidate-a', name: 'Liste A (PDA)', badge: 'A', color: 'bg-emerald-800' },
  { id: 'candidate-b', name: 'Liste B (PDB)', badge: 'B', color: 'bg-red-700' },
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

const missingTicket = 'Ticket absent ou expiré.';

export default function VotePage() {
  const [selectedParty, setSelectedParty] = useState<CandidateId | ''>('');
  const ticket = parseTicket(useSyncExternalStore(subscribe, getStoredTicket, getServerTicket));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState('');
  const [emailSentTo, setEmailSentTo] = useState('');
  const ticketError = ticket || receipt ? '' : missingTicket;

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || !ticket || loading) return;
    if (Date.parse(ticket.expires_at) <= Date.now()) {
      sessionStorage.removeItem('voting-ticket');
      setError(missingTicket);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await submitBallot(ticket.token, selectedParty, { email: ticket.email });
      setEmailSentTo(ticket.email ?? '');
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
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <Header active="vote" />
      <main className="flex-grow px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <Steps current={receipt ? 3 : 2} />
          {receipt ? (
            <div role="status" className="pb-4 pt-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-800 ring-8 ring-emerald-50/50">✓</span>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight">Bulletin enregistré</h1>
              <p className="mt-2 text-sm text-slate-600">Merci d’avoir voté.</p>
              <div className="mx-auto mt-6 max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <span className="block text-xs font-medium text-slate-500">Référence de réception</span>
                <code className="mt-1 block break-all font-mono text-sm text-slate-900">{receipt}</code>
              </div>
              {emailSentTo && <p className="mt-4 text-sm text-slate-600">Confirmation envoyée à <span className="font-medium text-slate-900">{emailSentTo}</span>.</p>}
              <Link href="/dashboard" className="mt-8 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Voir la participation</Link>
            </div>
          ) : (
            <>
              <h1 className="mt-6 text-xl font-semibold tracking-tight">Choisissez votre liste</h1>
              <form onSubmit={handleVoteSubmit} className="mt-6 space-y-4">
                {ticketError && (
                  <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
                    {ticketError} <Link href="/" className="font-medium underline">Retour à l’identification</Link>
                  </p>
                )}
                {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">{error}</p>}
                <fieldset className="grid gap-3 sm:grid-cols-2">
                  <legend className="sr-only">Listes</legend>
                  {parties.map(parti => {
                    const selected = selectedParty === parti.id;
                    return (
                      <label key={parti.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                        selected ? 'border-emerald-700 bg-emerald-50/60 ring-4 ring-emerald-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                        <span aria-hidden="true" className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-lg font-semibold text-white ${parti.color}`}>{parti.badge}</span>
                        <span className="flex-grow text-base font-semibold">{parti.name}</span>
                        <input type="radio" name="party" value={parti.id} checked={selected}
                          onChange={() => setSelectedParty(parti.id)} className="h-4 w-4 accent-emerald-800" />
                      </label>
                    );
                  })}
                </fieldset>
                <button type="submit" disabled={!selectedParty || !ticket || loading}
                  className="w-full rounded-lg bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">
                  {loading ? 'Enregistrement…' : 'Confirmer mon choix'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
