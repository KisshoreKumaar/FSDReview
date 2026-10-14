import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApplication, assignOfficer } from '../../api/application.api.js';
import { listOfficers } from '../../api/admin.api.js';
import { apiMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../constants/roles.js';
import SectionCard from '../../components/common/SectionCard.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Button from '../../components/common/Button.jsx';
import Select from '../../components/common/Select.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import StatusTimeline from '../../components/common/StatusTimeline.jsx';
import DocumentReviewList from '../../components/admin/DocumentReviewList.jsx';
import StatusActionPanel from '../../components/admin/StatusActionPanel.jsx';
import { formatDate, percent, titleCase } from '../../utils/format.js';

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value || '—'}</dd>
    </div>
  );
}

export default function Review() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () => getApplication(id).then(setData),
    [id],
  );

  useEffect(() => {
    load()
      .catch((err) => toast.error(apiMessage(err, 'Could not load the application')))
      .finally(() => setLoading(false));
    if (user?.role === ROLES.ADMIN) listOfficers().then(setOfficers).catch(() => {});
  }, [load, user]);

  if (loading) return <Spinner label="Loading application…" />;
  if (!data?.application) return <p className="text-sm text-slate-600">Application not found.</p>;

  const app = data.application;
  const subjects = app.academics?.subjects || [];

  const assign = async (officerId) => {
    try {
      await assignOfficer(app._id, officerId);
      toast.success('Officer assigned');
      load();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not assign the officer'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/admin/applications')}>
            ← Back to queue
          </Button>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {app.applicationNo} · {app.applicant?.name}
          </h1>
          <p className="text-sm text-slate-500">
            {app.applicant?.email} · {app.applicant?.phone} · submitted {formatDate(app.submittedAt)}
          </p>
        </div>
        <StatusBadge status={app.status} className="mt-2" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="Applicant details">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Field label="Father's name" value={app.personal?.fatherName} />
              <Field label="Mother's name" value={app.personal?.motherName} />
              <Field label="Date of birth" value={formatDate(app.personal?.dob)} />
              <Field label="Gender" value={titleCase(app.personal?.gender || '')} />
              <Field label="Category" value={app.personal?.category} />
              <Field label="Nationality" value={app.personal?.nationality} />
              <Field
                label="Address"
                value={[app.address?.line1, app.address?.city, app.address?.state, app.address?.pincode]
                  .filter(Boolean)
                  .join(', ')}
              />
            </dl>
          </SectionCard>

          <SectionCard title="Academics" description={`${app.academics?.board} · ${app.academics?.schoolName}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2">Subject</th>
                    <th className="py-2">Max</th>
                    <th className="py-2">Obtained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((s, i) => (
                    <tr key={i}>
                      <td className="py-2 text-slate-700">{s.name}</td>
                      <td className="py-2 text-slate-500">{s.maxMarks}</td>
                      <td className="py-2 font-medium text-slate-800">{s.obtained}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm">
              Aggregate: <b className="text-brand-700">{percent(app.academics?.percentage)}</b>
            </p>
          </SectionCard>

          <SectionCard title="Documents" description="Approve or reject each document individually.">
            <DocumentReviewList documents={app.documents || []} onChanged={load} />
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Actions">
            <StatusActionPanel application={app} onChanged={load} />
            {data.completeness && !data.completeness.complete && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {data.completeness.missing.length} item(s) still incomplete on this application.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Assignment">
            <p className="text-sm text-slate-600">
              Current officer: <b>{app.assignedOfficer?.name || 'Unassigned'}</b>
            </p>
            {user?.role === ROLES.ADMIN && (
              <Select
                className="mt-3"
                label="Reassign to"
                placeholder="Select an officer"
                value={app.assignedOfficer?._id || ''}
                onChange={(e) => e.target.value && assign(e.target.value)}
                options={officers.map((o) => ({
                  value: o._id,
                  label: `${o.name} (${o.assignedCount} assigned)`,
                }))}
              />
            )}
          </SectionCard>

          <SectionCard title="Course preferences">
            <ol className="space-y-2 text-sm">
              {(app.coursePreferences || []).map((pref, i) => (
                <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                  <b>{i + 1}.</b> {pref.course?.code} — {pref.course?.name}
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard title="Audit trail">
            <StatusTimeline history={app.statusHistory} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
