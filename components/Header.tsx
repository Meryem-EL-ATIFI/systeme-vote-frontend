'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      {/* Barre supérieure (Langues & Liens secondaires) */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex justify-end items-center space-x-4">
        <span className="hover:text-white cursor-pointer">English</span>
        <span className="hover:text-white cursor-pointer font-semibold text-white">Français</span>
        <span className="hover:text-white cursor-pointer">العربية</span>
      </div>

      {/* Barre principale avec Logo et Titre */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Symbole ou blason simplifié */}
          <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner border-2 border-amber-600">
            🇲🇦
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Royaume du Maroc</h1>
            <p className="text-xs font-medium text-slate-600">Portail Officiel du Vote Électronique</p>
          </div>
        </div>

        <nav className="mt-4 md:mt-0 flex space-x-6 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:text-emerald-700 transition">Accueil</Link>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400 cursor-not-allowed">Élections 2026</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400 cursor-not-allowed">Sécurité & Zero-Trust</span>
        </nav>
      </div>
    </header>
  );
}