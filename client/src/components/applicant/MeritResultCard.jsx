import SectionCard from '../common/SectionCard.jsx';
import { STATUS } from '../../constants/status.js';

const RESULT_STATUSES = [STATUS.SHORTLISTED, STATUS.ADMITTED, STATUS.VERIFIED];

export default function MeritResultCard({ application }) {
  if (!RESULT_STATUSES.includes(application.status)) return null;

  const published = Boolean(application.meritRank);

  return (
    <SectionCard title="Merit result">
      {published ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-brand-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-brand-700">Rank</p>
            <p className="text-3xl font-semibold text-brand-800">#{application.meritRank}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">Merit score</p>
            <p className="text-3xl font-semibold text-slate-800">{application.meritScore?.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Outcome</p>
            <p className="text-lg font-semibold text-emerald-800">
              {application.status === STATUS.ADMITTED
                ? 'Seat confirmed'
                : application.status === STATUS.SHORTLISTED
                  ? 'Seat allotted — confirm admission'
                  : 'Awaiting allotment'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          You are verified and eligible. Your rank appears here as soon as the merit list for your course is published.
        </p>
      )}
    </SectionCard>
  );
}
