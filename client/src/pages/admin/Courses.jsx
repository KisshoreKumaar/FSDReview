import { useState } from 'react';
import toast from 'react-hot-toast';
import { useApi } from '../../hooks/useApi.js';
import { listCourses, deactivateCourse, updateCourse } from '../../api/course.api.js';
import { apiMessage } from '../../api/client.js';
import SectionCard from '../../components/common/SectionCard.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import CourseFormModal from './CourseFormModal.jsx';

export default function Courses() {
  const { data, loading, reload } = useApi(() => listCourses({ includeInactive: true }));
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const courses = data?.courses || [];

  const toggleActive = async (course) => {
    try {
      if (course.isActive) await deactivateCourse(course.id);
      else await updateCourse(course.id, { isActive: true });
      toast.success(course.isActive ? `${course.code} deactivated` : `${course.code} reactivated`);
      reload();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update the course'));
    }
  };

  const columns = [
    { key: 'code', header: 'Code', render: (c) => <span className="font-medium text-slate-900">{c.code}</span> },
    {
      key: 'name',
      header: 'Course',
      render: (c) => (
        <div>
          <p className="font-medium text-slate-800">{c.name}</p>
          <p className="text-xs text-slate-500">
            {c.department} · {c.degreeLevel} · {c.durationYears} yrs
          </p>
        </div>
      ),
    },
    {
      key: 'seats',
      header: 'Seats',
      hideOnMobile: true,
      render: (c) => (
        <div className="min-w-[8rem]">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{c.seatsFilled}/{c.totalSeats}</span>
            <span>{c.fillRate}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min(100, c.fillRate)}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'eligibility',
      header: 'Eligibility',
      hideOnMobile: true,
      render: (c) => (
        <span className="text-xs text-slate-600">
          ≥ {c.eligibility?.minPercentage}% · {(c.eligibility?.requiredSubjects || []).join(', ') || 'any subjects'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <span className={`text-xs font-medium ${c.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
          {c.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => { setEditing(c); setOpen(true); }}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toggleActive(c)}>
            {c.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Courses</h1>
          <p className="text-sm text-slate-500">Seats, eligibility and availability for the 2026–27 cycle.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>+ New course</Button>
      </div>

      <SectionCard className="overflow-hidden" >
        <Table columns={columns} rows={courses} loading={loading} rowKey={(c) => c.id} />
      </SectionCard>

      {open && (
        <CourseFormModal
          open={open}
          course={editing}
          departments={data?.departments || []}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); reload(); }}
        />
      )}
    </div>
  );
}
