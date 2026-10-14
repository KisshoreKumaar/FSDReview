import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { DOCUMENT_LABELS, REQUIRED_DOCUMENT_TYPES } from '../../constants/documents.js';
import { formatBytes, formatDateTime } from '../../utils/format.js';
import { apiMessage } from '../../api/client.js';
import * as documentApi from '../../api/document.api.js';

const MAX_BYTES = 5 * 1024 * 1024;

export default function DocumentCard({ type, document: doc, applicationId, onChanged, readOnly }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const required = REQUIRED_DOCUMENT_TYPES.includes(type);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('File is larger than 5 MB');
      return;
    }

    setProgress(0);
    try {
      await documentApi.uploadDocument(applicationId, { type, file, onProgress: setProgress });
      toast.success(`${DOCUMENT_LABELS[type]} uploaded`);
      onChanged();
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed'));
    } finally {
      setProgress(null);
    }
  };

  const remove = async () => {
    try {
      await documentApi.deleteDocument(doc._id);
      toast.success('Document removed');
      onChanged();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not remove the document'));
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium text-slate-800">{DOCUMENT_LABELS[type]}</h3>
          {required && <span className="text-[11px] font-medium text-rose-600">Required</span>}
          {doc && <StatusBadge kind="document" status={doc.verificationStatus} />}
        </div>

        {doc ? (
          <p className="mt-1 truncate text-xs text-slate-500">
            {doc.originalName} · {formatBytes(doc.sizeBytes)} · uploaded {formatDateTime(doc.createdAt)}
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">PDF, JPEG or PNG · up to 5 MB</p>
        )}

        {doc?.verificationStatus === 'REJECTED' && (
          <p className="mt-2 rounded bg-rose-50 px-3 py-2 text-xs text-rose-700">
            Rejected: {doc.rejectionReason} — upload a corrected copy.
          </p>
        )}

        {progress !== null && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
            <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        {doc && (
          <a href={doc.url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="secondary">View</Button>
          </a>
        )}
        {!readOnly && doc?.verificationStatus === 'PENDING' && (
          <Button size="sm" variant="ghost" onClick={remove}>Remove</Button>
        )}
        {!readOnly && doc?.verificationStatus !== 'APPROVED' && (
          <>
            <input ref={inputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={pick} />
            <Button size="sm" loading={progress !== null} onClick={() => inputRef.current?.click()}>
              {doc ? 'Replace' : 'Upload'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
