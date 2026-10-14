export default function Stepper({ steps, current, onStepClick }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2 text-xs sm:text-sm">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = onStepClick && i <= current;
        return (
          <li key={step} className="flex items-center">
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onStepClick(i) : undefined}
              className={`flex items-center gap-2 rounded-full px-2.5 py-1 transition
                ${active ? 'bg-brand-600 text-white' : done ? 'text-brand-700 hover:bg-brand-50' : 'text-slate-400'}
                ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold
                  ${active ? 'bg-white text-brand-700' : done ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className="whitespace-nowrap">{step}</span>
            </button>
            {i < steps.length - 1 && <span className="mx-1 h-px w-4 bg-slate-300 sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}
