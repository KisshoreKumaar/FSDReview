import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as applicationApi from '../../api/application.api.js';
import { apiMessage, apiFieldErrors } from '../../api/client.js';
import SectionCard from '../../components/common/SectionCard.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Button from '../../components/common/Button.jsx';
import Stepper from '../../components/common/Stepper.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import StatusTimeline from '../../components/common/StatusTimeline.jsx';
import MeritResultCard from '../../components/applicant/MeritResultCard.jsx';
import { STATUS, STATUS_LABELS, TIMELINE_STEPS, EDITABLE_STATUSES } from '../../constants/status.js';
import { formatDateTime } from '../../utils/format.js';

export default function Status() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => applicationApi.getMyApplication().then(setData), []);

  useEffect(() => {
    load()
      .catch((err) => toast.error(apiMessage(err, 'Could not load your status')))
      .finally(() => setLoading(false));
  }, [load]);

  // Phase 5 wires live updates: the socket listener calls load() again.
  useEffect(() => {
    const handler = () => load().catch(() => {});
    window.addEventListener('application:status', handler);
    return () => window.removeEventListener('application:status', handler);
  }, [load]);

  if (loading) return <Spinner label="Loading your status…" />;

  const app = data?.application;
  if (!app) {
    return (
      <SectionCard title="No application yet">
        <p className="text-sm text-slate-600">Start an application to see your timeline here.</p>
        <Link to="/app/application" className="mt-4 inline-block"><Button>Start application</Button></Link>
      </SectionCard>
    );
  }

  const missing = data?.completeness?.missing || [];
  const canSubmit = EDITABLE_STATUSES.includes(app.status) && missing.length === 0;
  const stepIndex = Math.max(0, TIMELINE_STEPS.indexOf(app.status));

  const submit = async () => {
    setSubmitting(true);
    try {
      await applicationApi.submitApplication(app._id);
      toast.success('Application submitted');
      await load();
    } catch (err) {
      const errors = apiFieldErrors(err);
      toast.error(errors.length ? `Incomplete: ${errors.length} item(s) missing` : apiMessage(err, 'Submit failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Application status</h1>
          <p className="text-sm text-slate-500">
            {app.applicationNo} · last updated {formatDateTime(app.updatedAt)}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <SectionCard title="Where you are">
        <Stepper steps={TIMELINE_STEPS.map((s) => STATUS_LABELS[s])} current={stepIndex} />
        {[STATUS.REJECTED, STATUS.WITHDRAWN].includes(app.status) && (
          <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            This application is {STATUS_LABELS[app.status].toLowerCase()} and is no longer in the admission pipeline.
          </p>
        )}
      </SectionCard>

      {EDITABLE_STATUSES.includes(app.status) && (
        <SectionCard
          title={app.status === STATUS.ACTION_REQUIRED ? 'Corrections requested' : 'Submit your application'}
          description={
            canSubmit
              ? 'Everything is complete — submit to send it to the verification team.'
              : 'Finish the items below before submitting.'
          }
          actions={
            <Button onClick={submit} loading={submitting} disabled={!canSubmit}>
              {app.status === STATUS.ACTION_REQUIRED ? 'Resubmit' : 'Submit application'}
            </Button>
          }
        >
          {missing.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {missing.map((m, i) => (
                <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="capitalize text-slate-500">{m.step}:</span> {m.field.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-emerald-700">All checks passed. 🎉</p>
          )}
        </SectionCard>
      )}

      <MeritResultCard application={app} />

      <SectionCard title="Timeline" description="Every change to your application, newest first.">
        <StatusTimeline history={app.statusHistory} />
      </SectionCard>
    </div>
  );
}
