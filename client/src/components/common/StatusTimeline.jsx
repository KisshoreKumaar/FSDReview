import StatusBadge from './StatusBadge.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function StatusTimeline({ history = [] }) {
  if (!history.length) return <p className="text-sm text-slate-500">No activity recorded yet.</p>;

  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {[...history].reverse().map((entry, i) => (
        <li key={`${entry.at}-${i}`} className="relative">
          <span
            className={`absolute -left-[1.45rem] top-1 h-3 w-3 rounded-full ring-4 ring-white
              ${i === 0 ? 'bg-brand-600' : 'bg-slate-300'}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={entry.to} />
            {entry.from && entry.from !== 'NEW' && (
              <span className="text-xs text-slate-400">from {entry.from}</span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(entry.at)}
            {entry.changedBy?.name ? ` · by ${entry.changedBy.name}` : ''}
          </p>
          {entry.remarks && <p className="mt-1 text-sm text-slate-700">{entry.remarks}</p>}
        </li>
      ))}
    </ol>
  );
}
