import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { DOCUMENT_LABELS } from '../../constants/documents.js';
import { formatBytes, formatDateTime } from '../../utils/format.js';
import { verifyDocument } from '../../api/document.api.js';
import { apiMessage } from '../../api/client.js';

export default function DocumentReviewList({ documents = [], onChanged }) {
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const approve = async (doc) => {
    setBusyId(doc._id);
    try {
      await verifyDocument(doc._id, { verificationStatus: 'APPROVED' });
      toast.success(`${DOCUMENT_LABELS[doc.type]} approved`);
      onChanged();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not approve the document'));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (reason.trim().length < 5) {
      toast.error('Give the applicant a usable reason');
      return;
    }
    setBusyId(rejecting._id);
    try {
      await verifyDocument(rejecting._id, { verificationStatus: 'REJECTED', rejectionReason: reason.trim() });
      toast.success('Document rejected — the applicant has been notified');
      setRejecting(null);
      setReason('');
      onChanged();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not reject the document'));
    } finally {
      setBusyId(null);
    }
  };

  if (!documents.length) return <EmptyState title="No documents uploaded yet" icon="📎" />;

  return (
    <>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc._id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-medium text-slate-800">{DOCUMENT_LABELS[doc.type] || doc.type}</h4>
                <StatusBadge kind="document" status={doc.verificationStatus} />
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {doc.originalName} · {formatBytes(doc.sizeBytes)} · {formatDateTime(doc.createdAt)}
              </p>
              {doc.rejectionReason && (
                <p className="mt-1 text-xs text-rose-600">Reason: {doc.rejectionReason}</p>
              )}
              {doc.verifiedBy?.name && (
                <p className="mt-1 text-xs text-slate-400">Verified by {doc.verifiedBy.name}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <a href={doc.url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">Open</Button>
              </a>
              <Button
                size="sm"
                variant="success"
                loading={busyId === doc._id}
                disabled={doc.verificationStatus === 'APPROVED'}
                onClick={() => approve(doc)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={doc.verificationStatus === 'REJECTED'}
                onClick={() => { setRejecting(doc); setReason(''); }}
              >
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={Boolean(rejecting)}
        title={`Reject ${DOCUMENT_LABELS[rejecting?.type] || 'document'}`}
        onClose={() => setRejecting(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="danger" loading={busyId === rejecting?._id} onClick={reject}>
              Reject and notify
            </Button>
          </>
        }
      >
        <Input
          label="Reason shown to the applicant"
          placeholder="e.g. Scanned copy is blurred — upload a clearer version"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </>
  );
}
