import Link from 'next/link';

type Section = 'vote' | 'participation';

function StarMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path d="M12 3 L17.6 20 L3 9.5 H21 L6.4 20 Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

const links: { href: string; label: string; section: Section }[] = [
  { href: '/', label: 'Voter', section: 'vote' },
  { href: '/dashboard', label: 'Participation', section: 'participation' },
];

export default function Header({ active = 'vote' }: { active?: Section }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-600 to-emerald-800" />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-900 text-white shadow-sm">
            <StarMark />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-slate-900">Vote électronique</span>
            <span className="hidden text-xs text-slate-500 sm:block">Royaume du Maroc · Scrutin 2026</span>
          </span>
        </Link>
        <nav aria-label="Navigation principale" className="flex items-center gap-1 text-sm">
          {links.map(link => (
            <Link key={link.href} href={link.href} aria-current={active === link.section ? 'page' : undefined}
              className={`rounded-md px-3 py-2 font-medium transition ${active === link.section ? 'bg-emerald-50 text-emerald-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
