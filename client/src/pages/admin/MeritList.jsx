import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as meritApi from '../../api/merit.api.js';
import { listCourses } from '../../api/course.api.js';
import { apiMessage } from '../../api/client.js';
import SectionCard from '../../components/common/SectionCard.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Select from '../../components/common/Select.jsx';
import Modal from '../../components/common/Modal.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function MeritListPage() {
  const [courses, setCourses] = useState([]);
  const [lists, setLists] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = () =>
    meritApi
      .listMeritLists()
      .then(setLists)
      .catch((err) => toast.error(apiMessage(err, 'Could not load merit lists')));

  useEffect(() => {
    Promise.all([listCourses().then((d) => setCourses(d.courses)), load()]).finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    if (!courseId) return toast.error('Pick a course first');
    setBusy(true);
    try {
      const { meritList } = await meritApi.generateMeritList(courseId);
      toast.success(`Draft ready — ${meritList.entries.length} ranked`);
      await load();
      setPreview(meritList);
    } catch (err) {
      toast.error(apiMessage(err, 'Generation failed'));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const openPreview = async (list) => {
    try {
      setPreview(await meritApi.previewMeritList(list._id));
    } catch (err) {
      toast.error(apiMessage(err, 'Could not load the preview'));
    }
  };

  const publish = async (list) => {
    setBusy(true);
    try {
      await meritApi.publishMeritList(list._id);
      toast.success('Published — every ranked applicant has been notified');
      setPreview(null);
      await load();
    } catch (err) {
      toast.error(apiMessage(err, 'Publish failed'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading merit lists…" />;

  const columns = [
    { key: 'course', header: 'Course', render: (l) => `${l.course?.code} — ${l.course?.name}` },
    { key: 'seats', header: 'Allotted', hideOnMobile: true, render: (l) => `${l.seatsAllotted ?? 0} / ${l.totalSeats ?? 0}` },
    { key: 'excluded', header: 'Below cut-off', hideOnMobile: true, render: (l) => l.excludedCount ?? 0 },
    {
      key: 'state',
      header: 'State',
      render: (l) =>
        l.isPublished ? (
          <span className="text-xs font-medium text-emerald-600">Published {formatDateTime(l.publishedAt)}</span>
        ) : (
          <span className="text-xs font-medium text-amber-600">Draft</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (l) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => openPreview(l)}>Preview</Button>
          {!l.isPublished && (
            <Button size="sm" loading={busy} onClick={() => publish(l)}>Publish</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Merit lists</h1>
        <p className="text-sm text-slate-500">
          Score = academic % × 0.80 + required-subject average × 0.20. Only verified applicants above their category
          cut-off are ranked.
        </p>
      </div>

      <SectionCard title="Generate a draft" description="Regenerating replaces an unpublished draft; published lists are frozen.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select
            className="flex-1"
            label="Course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name} (${c.totalSeats} seats)` }))}
          />
          <Button loading={busy} onClick={generate}>Generate</Button>
        </div>
      </SectionCard>

      <div className="card overflow-hidden">
        <Table
          columns={columns}
          rows={lists}
          rowKey={(l) => l._id}
          empty={<EmptyState title="No merit lists yet" body="Generate one for a course above." icon="🏅" />}
        />
      </div>

      <Modal
        open={Boolean(preview)}
        size="lg"
        title={`Merit preview — ${preview?.course?.code || ''}`}
        onClose={() => setPreview(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>Close</Button>
            {preview && !preview.isPublished && (
              <Button loading={busy} onClick={() => publish(preview)}>Publish list</Button>
            )}
          </>
        }
      >
        {preview?.entries?.length ? (
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">Rank</th>
                  <th className="py-2">Application</th>
                  <th className="py-2">Applicant</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Seat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.entries.map((e) => (
                  <tr key={e.applicationNo} className={e.allotted ? 'bg-emerald-50/50' : ''}>
                    <td className="py-2 font-semibold text-slate-800">#{e.rank}</td>
                    <td className="py-2 font-mono text-xs text-slate-600">{e.applicationNo}</td>
                    <td className="py-2 text-slate-700">{e.applicantName}</td>
                    <td className="py-2 text-slate-500">{e.category}</td>
                    <td className="py-2 font-medium text-brand-700">{e.meritScore}</td>
                    <td className="py-2">{e.allotted ? '✅ Allotted' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No eligible applicants" body="Nobody cleared the cut-off for this course yet." />
        )}
      </Modal>
    </div>
  );
}
