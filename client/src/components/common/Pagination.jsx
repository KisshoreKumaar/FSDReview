import Button from './Button.jsx';

export default function Pagination({ pagination, onChange }) {
  if (!pagination) return null;
  const { page, pages, total, limit } = pagination;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-500">
        Showing <b>{from}</b>–<b>{to}</b> of <b>{total}</b>
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <span className="text-xs text-slate-500">
          Page {page} / {pages}
        </span>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
