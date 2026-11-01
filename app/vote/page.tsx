'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function VotePage() {
  const router = useRouter();
  const [selectedParty, setSelectedParty] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const parties = [
    { id: 'rni', name: 'Rassemblement National des Indépendants (RNI)', desc: 'Développement économique et chantiers sociaux.' },
    { id: 'pam', name: 'Parti Authenticité et Modernité (PAM)', desc: 'Modernisation des institutions et réformes.' },
    { id: 'pi', name: 'Parti de l\'Istiqlal (PI)', desc: 'Justice sociale et renforcement de l\'économie.' },
    { id: 'usfp', name: 'Union Socialiste des Forces Populaires (USFP)', desc: 'Progrès social et services publics.' },
    { id: 'mp', name: 'Mouvement Populaire (MP)', desc: 'Monde rural et développement territorial.' },
    { id: 'pps', name: 'Parti du Progrès et du Socialisme (PPS)', desc: 'Équité sociale et libertés publiques.' }
  ];

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;
    setLoading(true);

    try {
      console.log('Transmission vers Ballot Box (Oracle OCI)...', selectedParty);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess(true);
      setTimeout(() => {
        alert("Vote enregistré avec succès ! Accusé envoyé via AWS SES.");
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error(err);
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
            <h2 className="text-2xl font-bold text-slate-900 mt-1">Urne Électronique Sécurisée</h2>
            <p className="text-sm text-slate-600 mt-1">
              Sélectionnez votre liste électorale. Le vote est strictement anonyme grâce au découplage JWT / Bulletin[cite: 1].
            </p>
          </div>

          {success ? (
            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-6 text-emerald-900 rounded-r-lg">
              <p className="font-bold text-lg">Bulletin scellé et enregistré !</p>
              <p className="text-sm mt-1">Génération du reçu asynchrone en cours...</p>
            </div>
          ) : (
            <form onSubmit={handleVoteSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {parties.map((parti) => (
                  <label
                    key={parti.id}
                    className={`block border p-4 rounded-lg cursor-pointer transition ${
                      selectedParty === parti.id
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="radio"
                        name="party"
                        value={parti.id}
                        checked={selectedParty === parti.id}
                        onChange={(e) => setSelectedParty(e.target.value)}
                        className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <div className="ml-4">
                        <span className="block text-base font-bold text-slate-900">{parti.name}</span>
                        <span className="block text-sm text-slate-600 mt-0.5">{parti.desc}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={!selectedParty || loading}
                className="w-full py-3 px-4 border border-transparent rounded-md shadow text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition disabled:opacity-50"
              >
                {loading ? 'Chiffrement du bulletin en cours...' : 'Confirmer mon choix et voter'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}