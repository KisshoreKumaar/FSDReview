import Skeleton from './Skeleton.jsx';
import EmptyState from './EmptyState.jsx';

/**
 * columns: [{ key, header, render?, className?, hideOnMobile? }]
 */
export default function Table({ columns, rows, loading, empty, rowKey = (r) => r.id, onRowClick }) {
  if (loading) return <Skeleton.Table columns={columns.length} />;
  if (!rows?.length) return empty || <EmptyState title="Nothing here yet" />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500
                  ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer hover:bg-brand-50/50' : ''}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 align-middle text-slate-700 ${col.className || ''} ${
                    col.hideOnMobile ? 'hidden md:table-cell' : ''
                  }`}
                >
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
