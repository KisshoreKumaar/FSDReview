import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import * as adminApi from '../../api/admin.api.js';
import { apiMessage } from '../../api/client.js';
import SectionCard from '../../components/common/SectionCard.jsx';
import Table from '../../components/common/Table.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';

const schema = z.object({
  name: z.string().min(3, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, '10-digit mobile number'),
});

export default function Officers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const load = () =>
    adminApi
      .listOfficers()
      .then(setOfficers)
      .catch((err) => toast.error(apiMessage(err, 'Could not load officers')));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const onSubmit = async (values) => {
    try {
      const data = await adminApi.createOfficer(values);
      toast.success('Officer account created');
      setCreated(data);
      setOpen(false);
      reset();
      load();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not create the officer'));
    }
  };

  const toggle = async (officer) => {
    try {
      await adminApi.updateOfficer(officer._id, { isActive: !officer.isActive });
      toast.success(officer.isActive ? 'Officer disabled' : 'Officer enabled');
      load();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update the officer'));
    }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (o) => <span className="font-medium text-slate-800">{o.name}</span> },
    { key: 'email', header: 'Email', render: (o) => <span className="text-slate-600">{o.email}</span> },
    { key: 'role', header: 'Role', hideOnMobile: true },
    { key: 'assignedCount', header: 'Assigned', render: (o) => o.assignedCount ?? 0 },
    {
      key: 'actions',
      header: '',
      render: (o) =>
        o.role === 'OFFICER' ? (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => toggle(o)}>
              {o.isActive === false ? 'Enable' : 'Disable'}
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Verification officers</h1>
          <p className="text-sm text-slate-500">Accounts that can verify documents and move applications.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Add officer</Button>
      </div>

      {created && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <b>{created.officer.name}</b> created. Temporary password:{' '}
          <code className="rounded bg-white px-1.5 py-0.5">{created.temporaryPassword}</code> — it was also emailed to
          them.
        </div>
      )}

      <div className="card overflow-hidden">
        <Table columns={columns} rows={officers} loading={loading} rowKey={(o) => o._id} />
      </div>

      <Modal
        open={open}
        title="New verification officer"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>Create account</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Full name" required {...register('name')} error={errors.name?.message} />
          <Input label="Email" type="email" required {...register('email')} error={errors.email?.message} />
          <Input label="Mobile number" required maxLength={10} {...register('phone')} error={errors.phone?.message} />
          <p className="text-xs text-slate-500">
            A temporary password is generated and emailed — the officer changes it after signing in.
          </p>
        </form>
      </Modal>
    </div>
  );
}
