import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { getMyApplication } from '../../api/application.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import SectionCard from '../../components/common/SectionCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { formatDateTime, percent } from '../../utils/format.js';
import { STATUS } from '../../constants/status.js';

const STEP_LINKS = {
  personal: '/app/application',
  address: '/app/application',
  academics: '/app/application',
  preferences: '/app/application',
  documents: '/app/documents',
  payment: '/app/payment',
};

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const { data, loading, reload } = useApi(getMyApplication);

  // Socket pushes a status change -> pull fresh numbers without a page reload.
  useEffect(() => {
    const handler = () => reload().catch(() => {});
    window.addEventListener('application:status', handler);
    return () => window.removeEventListener('application:status', handler);
  }, [reload]);

  if (loading) return <Spinner label="Loading your dashboard…" />;

  const application = data?.application;
  const missing = data?.completeness?.missing || [];
  const grouped = missing.reduce((acc, m) => {
    acc[m.step] = (acc[m.step] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Hello, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">Here is where your admission stands today.</p>
      </div>

      {!application ? (
        <SectionCard title="Start your application">
          <p className="text-sm text-slate-600">You have not started an application for the 2026–27 cycle yet.</p>
          <Link to="/app/application" className="mt-4 inline-block">
            <Button>Start application</Button>
          </Link>
        </SectionCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Application no." value={application.applicationNo} />
            <StatCard label="Status" value={<StatusBadge status={application.status} />} />
            <StatCard
              label="Academic %"
              value={application.academics?.percentage ? percent(application.academics.percentage) : '—'}
              tone="brand"
            />
            <StatCard
              label="Merit rank"
              value={application.meritRank ? `#${application.meritRank}` : 'Not published'}
              hint={application.meritScore ? `Score ${application.meritScore.toFixed(2)}` : undefined}
              tone="success"
            />
          </div>

          <SectionCard
            title="Next steps"
            description={
              application.status === STATUS.DRAFT
                ? 'Finish these to submit your application.'
                : 'Your application has been submitted — we will keep you posted.'
            }
            actions={
              <Link to="/app/status">
                <Button size="sm" variant="secondary">View timeline</Button>
              </Link>
            }
          >
            {missing.length === 0 ? (
              <p className="text-sm text-emerald-700">Everything is complete. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(grouped).map(([step, count]) => (
                  <li key={step} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
                    <span className="text-sm capitalize text-slate-700">
                      {step} — <b>{count}</b> item{count > 1 ? 's' : ''} pending
                    </span>
                    <Link to={STEP_LINKS[step] || '/app/application'}>
                      <Button size="sm" variant="secondary">Complete</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Course preferences">
            {application.coursePreferences?.length ? (
              <ol className="space-y-2 text-sm">
                {application.coursePreferences.map((pref, i) => (
                  <li key={i} className="flex justify-between rounded-lg bg-slate-50 px-4 py-2">
                    <span>
                      <b>{i + 1}.</b> {pref.course?.code} — {pref.course?.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {pref.course ? `${pref.course.totalSeats - pref.course.seatsFilled} seats left` : ''}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">No preferences chosen yet.</p>
            )}
            <p className="mt-3 text-xs text-slate-400">Last updated {formatDateTime(application.updatedAt)}</p>
          </SectionCard>
        </>
      )}
    </div>
  );
}
