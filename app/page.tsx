'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Steps from '@/components/Steps';
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
  return 'Service de vérification inaccessible. Veuillez réessayer.';
}

const inputClass = 'mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100';
const labelClass = 'block text-sm font-medium text-slate-700';

const highlights = [
  { title: 'Identité vérifiée', text: 'Contrôle de votre carte nationale.' },
  { title: 'Vote anonyme', text: 'Votre choix n’est jamais lié à votre identité.' },
  { title: 'Confirmation', text: 'Reçu immédiat, confirmation par e-mail.' },
];

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
      const email = formData.email.trim();
      sessionStorage.setItem('voting-ticket', JSON.stringify(email ? { ...ticket, email } : ticket));
      router.push('/vote');
    } catch (err) {
      setError(verificationMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <Header active="vote" />
      <main className="relative flex-grow overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 lg:h-full" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <section className="text-white lg:pt-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Scrutin ouvert
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Votre voix compte.<br />Votez en ligne.
            </h1>
            <p className="mt-4 max-w-md text-base text-emerald-100/90">
              Identifiez-vous, choisissez votre liste et recevez votre confirmation en moins d’une minute.
            </p>
            <ul className="mt-10 hidden space-y-5 lg:block">
              {highlights.map(item => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-xs text-emerald-200 ring-1 ring-emerald-300/30">✓</span>
                  <span>
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="block text-sm text-emerald-100/80">{item.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-emerald-950/10 sm:p-8">
            <Steps current={1} />
            <h2 className="mt-6 text-xl font-semibold tracking-tight">Identification</h2>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">{error}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nom" className={labelClass}>Nom</label>
                  <input id="nom" type="text" name="nom" required autoComplete="family-name" value={formData.nom} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="prenom" className={labelClass}>Prénom</label>
                  <input id="prenom" type="text" name="prenom" required autoComplete="given-name" value={formData.prenom} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cin" className={labelClass}>Numéro de CIN</label>
                  <input id="cin" type="text" name="cin" required placeholder="AB123456" value={formData.cin} onChange={handleChange} className={`${inputClass} uppercase`} />
                </div>
                <div>
                  <label htmlFor="birth_date" className={labelClass}>Date de naissance</label>
                  <input id="birth_date" type="date" name="birth_date" required value={formData.birth_date} onChange={handleChange} className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>Adresse e-mail <span className="font-normal text-slate-400">(facultatif)</span></label>
                <input id="email" type="email" name="email" autoComplete="email" maxLength={254} placeholder="nom@exemple.com"
                  value={formData.email} onChange={handleChange} aria-describedby="email-help" className={inputClass} />
                <p id="email-help" className="mt-1.5 text-xs text-slate-500">Pour recevoir l’e-mail de confirmation.</p>
              </div>
              <button type="submit" disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Vérification…' : <>{"Vérifier l'identité"} <span aria-hidden="true">→</span></>}
              </button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
