import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listApplications } from '../../api/application.api.js';
import { listCourses } from '../../api/course.api.js';
import { apiMessage } from '../../api/client.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import SectionCard from '../../components/common/SectionCard.jsx';
import Table from '../../components/common/Table.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Button from '../../components/common/Button.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { STATUS_LABELS, STATUS_VALUES } from '../../constants/status.js';
import { formatDate, percent } from '../../utils/format.js';

export default function Applications() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('q') || '');
  const debounced = useDebouncedValue(search);

  const status = params.get('status') || '';
  const course = params.get('course') || '';
  const mine = params.get('mine') === 'true';
  const page = Number(params.get('page') || 1);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    listCourses().then((d) => setCourses(d.courses)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    listApplications({ status, course, q: debounced, mine: mine || undefined, page, limit: 10 })
      .then(setData)
      .catch((err) => toast.error(apiMessage(err, 'Could not load applications')))
      .finally(() => setLoading(false));
  }, [status, course, debounced, mine, page]);

  const columns = [
    {
      key: 'applicationNo',
      header: 'Application',
      render: (a) => (
        <div>
          <p className="font-medium text-slate-900">{a.applicationNo}</p>
          <p className="text-xs text-slate-500">{formatDate(a.submittedAt || a.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'applicant',
      header: 'Applicant',
      render: (a) => (
        <div>
          <p className="font-medium text-slate-800">{a.applicant?.name}</p>
          <p className="text-xs text-slate-500">{a.applicant?.email}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'First preference',
      hideOnMobile: true,
      render: (a) => a.coursePreferences?.[0]?.course?.code || '—',
    },
    {
      key: 'percentage',
      header: '%',
      hideOnMobile: true,
      render: (a) => (a.academics?.percentage ? percent(a.academics.percentage) : '—'),
    },
    {
      key: 'officer',
      header: 'Officer',
      hideOnMobile: true,
      render: (a) => a.assignedOfficer?.name || <span className="text-slate-400">Unassigned</span>,
    },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/applications/${a._id}`)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Applications</h1>
        <p className="text-sm text-slate-500">{data?.pagination?.total ?? '…'} applications in this cycle</p>
      </div>

      <SectionCard>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Search"
            placeholder="Name, email or application no."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setParam('q', e.target.value);
            }}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            value={status}
            onChange={(e) => setParam('status', e.target.value)}
            options={STATUS_VALUES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          />
          <Select
            label="Course"
            placeholder="All courses"
            value={course}
            onChange={(e) => setParam('course', e.target.value)}
            options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
          />
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={mine}
                onChange={(e) => setParam('mine', e.target.checked ? 'true' : '')}
                className="h-4 w-4 rounded border-slate-300"
              />
              Assigned to me
            </label>
          </div>
        </div>
      </SectionCard>

      <div className="card overflow-hidden">
        <Table
          columns={columns}
          rows={data?.items || []}
          loading={loading}
          rowKey={(a) => a._id}
          onRowClick={(a) => navigate(`/admin/applications/${a._id}`)}
          empty={<EmptyState title="No applications match these filters" icon="🔍" />}
        />
        <Pagination pagination={data?.pagination} onChange={(p) => setParam('page', String(p))} />
      </div>
    </div>
  );
}
