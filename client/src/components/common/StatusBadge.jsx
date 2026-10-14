import { STATUS_LABELS, STATUS_STYLES } from '../../constants/status.js';
import { VERIFICATION_STYLES } from '../../constants/documents.js';
import { titleCase } from '../../utils/format.js';

export default function StatusBadge({ status, kind = 'application', className = '' }) {
  const styles =
    kind === 'document'
      ? VERIFICATION_STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
      : STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-200';
  const label = kind === 'document' ? titleCase(status || '') : STATUS_LABELS[status] || titleCase(status || '—');

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
