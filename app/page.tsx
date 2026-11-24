'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ELECTION_ID, verifyIdentity, VotingApiError } from '@/lib/voting-api';

function verificationMessage(error: unknown): string {
  if (error instanceof VotingApiError) {
    switch (error.code) {
      case 'verification_failed': return 'Identité non vérifiée. Vérifiez vos informations.';
      case 'already_issued': return 'Un ticket a déjà été délivré pour cette élection.';
      case 'card_invalid': return 'Carte d’identité invalide ou expirée.';
      case 'not_eligible': return 'Cette personne ne peut pas voter à cette élection.';
      case 'election_closed': return 'Cette élection est fermée.';
      case 'election_not_found': return 'Élection introuvable.';
      default: return 'Vérification impossible. Veuillez réessayer.';
    }
  }
  return 'Service de vérification AWS inaccessible. Veuillez réessayer.';
}

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({ nom: '', prenom: '', cin: '', birth_date: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(current => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    sessionStorage.removeItem('voting-ticket');
    try {
      const ticket = await verifyIdentity({
        cin: formData.cin,
        first_name: formData.prenom,
        last_name: formData.nom,
        birth_date: formData.birth_date,
        election_id: ELECTION_ID,
        ...(formData.email.trim() ? { email: formData.email.trim() } : {}),
      });
      sessionStorage.setItem('voting-ticket', JSON.stringify(ticket));
      router.push('/vote');
    } catch (err) {
      setError(verificationMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />
      <div className="w-full bg-emerald-900 text-white py-8 px-6 shadow-md relative overflow-hidden border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center relative z-10">
          <div>
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">Démonstration</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight">SCRUTIN ÉLECTRONIQUE 2026</h2>
          </div>
        </div>
      </div>
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Identification du Votant</h3>
            <p className="text-xs text-slate-500 mt-1">Veuillez renseigner vos informations d’état civil et votre CIN</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <div role="alert" className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-700">{error}</div>}
            <div>
              <label htmlFor="nom" className="block text-xs font-bold text-slate-700 uppercase">Nom</label>
              <input id="nom" type="text" name="nom" required value={formData.nom} onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-900" />
            </div>
            <div>
              <label htmlFor="prenom" className="block text-xs font-bold text-slate-700 uppercase">Prénom</label>
              <input id="prenom" type="text" name="prenom" required value={formData.prenom} onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-900" />
            </div>
            <div>
              <label htmlFor="cin" className="block text-xs font-bold text-slate-700 uppercase">Numéro de CIN</label>
              <input id="cin" type="text" name="cin" required value={formData.cin} onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm uppercase focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-900" />
            </div>
            <div>
              <label htmlFor="birth_date" className="block text-xs font-bold text-slate-700 uppercase">Date de naissance</label>
              <input id="birth_date" type="date" name="birth_date" required value={formData.birth_date} onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-900" />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase">Adresse e-mail (facultatif)</label>
              <input id="email" type="email" name="email" autoComplete="email" maxLength={254}
                value={formData.email} onChange={handleChange} aria-describedby="email-help"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-900" />
              <p id="email-help" className="mt-1 text-xs text-slate-600">Pour une notification si ce service est activé. Aucun code PIN n’est envoyé pour le moment.</p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full mt-2 py-3 px-4 border border-transparent rounded-md shadow text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-700 transition disabled:opacity-50">
              {loading ? 'Vérification en cours...' : "Vérifier l'identité & Accéder à l'urne"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
