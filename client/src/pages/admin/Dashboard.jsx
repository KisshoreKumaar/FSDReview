import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { getStats } from '../../api/admin.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import SectionCard from '../../components/common/SectionCard.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import Button from '../../components/common/Button.jsx';
import { formatRupees } from '../../utils/format.js';
import { STATUS_VALUES } from '../../constants/status.js';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useApi(getStats);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton.Cards />
        <div className="card h-64" />
      </div>
    );
  }
  if (error) return <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>;

  const inReview = (data.byStatus.SUBMITTED || 0) + (data.byStatus.UNDER_REVIEW || 0);
  const maxStatus = Math.max(1, ...STATUS_VALUES.map((s) => data.byStatus[s] || 0));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Admission dashboard</h1>
        <p className="text-sm text-slate-500">
          Cycle {data.cycle} · signed in as {user?.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications" value={data.totalApplications} hint={`${data.byStatus.DRAFT} still in draft`} />
        <StatCard label="Awaiting review" value={inReview} tone="warn" hint="Submitted + under review" />
        <StatCard label="Documents pending" value={data.documentsPending} tone="brand" />
        <StatCard
          label="Fees collected"
          value={formatRupees(data.payments.collectedPaise)}
          tone="success"
          hint={`${data.payments.count} payments`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Applications by status"
          actions={
            <Link to="/admin/applications">
              <Button size="sm" variant="secondary">Open queue</Button>
            </Link>
          }
        >
          <ul className="space-y-2.5">
            {STATUS_VALUES.map((status) => {
              const count = data.byStatus[status] || 0;
              return (
                <li key={status} className="flex items-center gap-3">
                  <span className="w-32 shrink-0">
                    <StatusBadge status={status} />
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-medium text-slate-700">{count}</span>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <SectionCard title="Seat fill rate by course" description="Seats filled against demand this cycle.">
          <ul className="space-y-3">
            {data.courses.map((course) => (
              <li key={course.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{course.code}</span>
                  <span className="text-xs text-slate-500">
                    {course.seatsFilled}/{course.totalSeats} seats · {course.applications} applications
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${course.fillRate >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.min(100, course.fillRate)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
