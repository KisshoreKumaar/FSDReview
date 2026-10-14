import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publishedMeritLists } from '../api/merit.api.js';
import { apiMessage } from '../api/client.js';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatDateTime } from '../utils/format.js';

export default function PublicMerit() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    publishedMeritLists()
      .then(setLists)
      .catch((err) => setError(apiMessage(err, 'Could not load the published lists')))
      .finally(() => setLoading(false));
  }, []);

  const list = lists[active];
  const entries = (list?.entries || []).filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return e.applicationNo.toLowerCase().includes(q) || e.applicantName.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">CA</span>
          College Admissions
        </Link>
        <Link to="/login"><Button size="sm" variant="secondary">Sign in</Button></Link>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
        <h1 className="text-2xl font-semibold text-slate-900">Published merit lists</h1>
        <p className="mt-1 text-sm text-slate-600">
          Results for the 2026–27 admission cycle. Find your application number to see your rank.
        </p>

        {loading && <Spinner label="Loading results…" />}
        {error && <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {!loading && !error && lists.length === 0 && (
          <EmptyState
            title="No merit list is published yet"
            body="Lists appear here as soon as the admission office publishes them."
            icon="🏅"
          />
        )}

        {list && (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {lists.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => setActive(i)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    i === active ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-300'
                  }`}
                >
                  {l.course?.code}
                </button>
              ))}
            </div>

            <div className="card mt-4 overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  {list.course?.code} — {list.course?.name}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {list.seatsAllotted} of {list.totalSeats} seats allotted · published {formatDateTime(list.publishedAt)}
                </p>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your application number or name"
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5">Rank</th>
                      <th className="px-5 py-2.5">Application no.</th>
                      <th className="px-5 py-2.5">Name</th>
                      <th className="px-5 py-2.5">Category</th>
                      <th className="px-5 py-2.5">Score</th>
                      <th className="px-5 py-2.5">Seat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((e) => (
                      <tr key={e.applicationNo} className={e.allotted ? 'bg-emerald-50/60' : ''}>
                        <td className="px-5 py-2.5 font-semibold text-slate-800">#{e.rank}</td>
                        <td className="px-5 py-2.5 font-mono text-xs text-slate-600">{e.applicationNo}</td>
                        <td className="px-5 py-2.5 text-slate-700">{e.applicantName}</td>
                        <td className="px-5 py-2.5 text-slate-500">{e.category}</td>
                        <td className="px-5 py-2.5 font-medium text-brand-700">{e.meritScore}</td>
                        <td className="px-5 py-2.5">{e.allotted ? '✅ Allotted' : '—'}</td>
                      </tr>
                    ))}
                    {entries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                          No entries match “{query}”.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
