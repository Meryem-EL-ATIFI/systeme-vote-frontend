import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Tableau de bord du scrutin | Vote électronique',
  description: 'Suivi en direct des bulletins enregistrés par l’urne Oracle pour la démonstration.',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
