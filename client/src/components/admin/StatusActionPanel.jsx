import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import Select from '../common/Select.jsx';
import { STATUS_LABELS, STATUS_TRANSITIONS } from '../../constants/status.js';
import { changeStatus } from '../../api/application.api.js';
import { apiMessage } from '../../api/client.js';

export default function StatusActionPanel({ application, onChanged }) {
  const [target, setTarget] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const allowed = STATUS_TRANSITIONS[application.status] || [];

  const apply = async () => {
    setSaving(true);
    try {
      await changeStatus(application._id, { to: target, remarks: remarks.trim() || undefined });
      toast.success(`Moved to ${STATUS_LABELS[target]}`);
      setTarget(null);
      setRemarks('');
      onChanged();
    } catch (err) {
      toast.error(apiMessage(err, 'Transition rejected'));
    } finally {
      setSaving(false);
    }
  };

  if (!allowed.length) {
    return <p className="text-sm text-slate-500">This application is in a terminal state — no further transitions.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowed.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={status === 'REJECTED' ? 'danger' : status === 'VERIFIED' ? 'success' : 'secondary'}
            onClick={() => { setTarget(status); setRemarks(''); }}
          >
            Move to {STATUS_LABELS[status]}
          </Button>
        ))}
      </div>

      <Modal
        open={Boolean(target)}
        title={`Move to ${STATUS_LABELS[target] || ''}`}
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)}>Cancel</Button>
            <Button loading={saving} onClick={apply}>Confirm</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {application.applicationNo} moves from <b>{STATUS_LABELS[application.status]}</b> to{' '}
          <b>{STATUS_LABELS[target]}</b>. The applicant is notified immediately.
        </p>
        <label className="label mt-4" htmlFor="remarks">
          Remarks {target === 'ACTION_REQUIRED' && <span className="text-rose-500">*</span>}
        </label>
        <textarea
          id="remarks"
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Recorded in the audit trail and shown to the applicant"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        />
      </Modal>
    </>
  );
}
