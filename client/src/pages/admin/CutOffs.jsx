import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listCourses, updateCutOff } from '../../api/course.api.js';
import { apiMessage } from '../../api/client.js';
import SectionCard from '../../components/common/SectionCard.jsx';
import Button from '../../components/common/Button.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const KEYS = [
  { key: 'general', label: 'General' },
  { key: 'obc', label: 'OBC' },
  { key: 'sc', label: 'SC' },
  { key: 'st', label: 'ST' },
];

export default function CutOffs() {
  const [courses, setCourses] = useState([]);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    listCourses()
      .then((d) => {
        setCourses(d.courses);
        setDraft(Object.fromEntries(d.courses.map((c) => [c.id, { ...c.cutOff }])));
      })
      .catch((err) => toast.error(apiMessage(err, 'Could not load courses')))
      .finally(() => setLoading(false));
  }, []);

  const save = async (course) => {
    setSavingId(course.id);
    try {
      const updated = await updateCutOff(course.id, draft[course.id]);
      setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
      toast.success(`${course.code} cut-offs updated`);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save the cut-off'));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Spinner label="Loading cut-offs…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Category cut-offs</h1>
        <p className="text-sm text-slate-500">
          Applicants scoring below their category cut-off are excluded before ranking.
        </p>
      </div>

      <SectionCard>
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {course.code} — {course.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {course.department} · minimum eligibility {course.eligibility?.minPercentage}%
                  </p>
                </div>
                <Button size="sm" loading={savingId === course.id} onClick={() => save(course)}>
                  Save
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {KEYS.map(({ key, label }) => (
                  <label key={key} className="block">
                    <span className="text-xs font-medium text-slate-500">{label}</span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        value={draft[course.id]?.[key] ?? 0}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [course.id]: { ...prev[course.id], [key]: Number(e.target.value) },
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
