const steps = ['Identification', 'Vote', 'Confirmation'];

/** Compact progress indicator for the three-step voting flow. */
export default function Steps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 text-xs font-medium" aria-label="Étapes du vote">
      {steps.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${
              done ? 'bg-emerald-800 text-white' : active ? 'bg-emerald-900 text-white ring-4 ring-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
              {done ? '✓' : number}
            </span>
            <span className={active ? 'text-slate-900' : 'hidden text-slate-400 sm:inline'}>{label}</span>
            {number < steps.length && <span aria-hidden="true" className="h-px w-5 bg-slate-200 sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}
