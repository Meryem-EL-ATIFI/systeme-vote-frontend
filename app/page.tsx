'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    cin: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulation appel vérification identité (FastAPI / DGSN)
      console.log('Vérification DGSN...', formData);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push('/vote');
    } catch (err) {
      setError("Erreur lors de la vérification de la CIN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />

      {/* Bannière institutionnelle inspirée de cg.gov.ma */}
      <div className="w-full bg-emerald-900 text-white py-8 px-6 shadow-md relative overflow-hidden border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center relative z-10">
          <div>
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">Scrutin Officiel</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 tracking-tight">
              SCRUTIN ÉLECTRONIQUE 2026 - 2031
            </h2>
            <p className="text-emerald-200 text-sm mt-1">Plateforme Multi-Cloud sécurisée par architecture Zero-Trust</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/20 text-xs">
            🔒 Chiffrement de bout en bout & Anonymisation des bulletins
          </div>
        </div>
      </div>

      {/* Corps du formulaire d'accès au vote */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Identification du Votant</h3>
            <p className="text-xs text-slate-500 mt-1">Veuillez renseigner vos informations d'état civil et votre CIN</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Nom</label>
              <input
                type="text"
                name="nom"
                required
                value={formData.nom}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-900"
                placeholder="Votre nom de famille"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Prénom</label>
              <input
                type="text"
                name="prenom"
                required
                value={formData.prenom}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-900"
                placeholder="Votre prénom"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Numéro de CIN</label>
              <input
                type="text"
                name="cin"
                required
                value={formData.cin}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm uppercase focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-900"
                placeholder="Ex : AB123456"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Adresse E-mail</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-600 focus:border-emerald-600 text-sm text-slate-900"
                placeholder="exemple@domaine.ma"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 border border-transparent rounded-md shadow text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Connexion au service DGSN...' : "Vérifier l'identité & Accéder à l'urne"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}