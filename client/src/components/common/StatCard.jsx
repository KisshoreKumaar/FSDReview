export default function StatCard({ label, value, hint, tone = 'default' }) {
  const tones = {
    default: 'text-slate-900',
    brand: 'text-brand-700',
    success: 'text-emerald-600',
    warn: 'text-amber-600',
    danger: 'text-rose-600',
  };
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
