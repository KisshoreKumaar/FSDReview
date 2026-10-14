import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as applicationApi from '../../api/application.api.js';
import { listDocuments } from '../../api/document.api.js';
import { apiMessage } from '../../api/client.js';
import SectionCard from '../../components/common/SectionCard.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Button from '../../components/common/Button.jsx';
import DocumentCard from '../../components/applicant/DocumentCard.jsx';
import { DOCUMENT_TYPES, REQUIRED_DOCUMENT_TYPES } from '../../constants/documents.js';
import { EDITABLE_STATUSES, STATUS } from '../../constants/status.js';

export default function Documents() {
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { application: app } = await applicationApi.getMyApplication();
    setApplication(app);
    if (app) setDocuments(await listDocuments(app._id));
  }, []);

  useEffect(() => {
    load()
      .catch((err) => toast.error(apiMessage(err, 'Could not load your documents')))
      .finally(() => setLoading(false));
  }, [load]);

  if (loading) return <Spinner label="Loading documents…" />;

  if (!application) {
    return (
      <SectionCard title="No application yet">
        <p className="text-sm text-slate-600">Start your application before uploading documents.</p>
        <Link to="/app/application" className="mt-4 inline-block">
          <Button>Start application</Button>
        </Link>
      </SectionCard>
    );
  }

  const byType = Object.fromEntries(documents.map((d) => [d.type, d]));
  const uploadedRequired = REQUIRED_DOCUMENT_TYPES.filter((t) => byType[t]).length;
  const readOnly = !EDITABLE_STATUSES.includes(application.status) && application.status !== STATUS.SUBMITTED;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500">
          {uploadedRequired}/{REQUIRED_DOCUMENT_TYPES.length} required documents uploaded · application{' '}
          {application.applicationNo}
        </p>
      </div>

      <SectionCard
        title="Upload your certificates"
        description="Each document is verified individually by an officer. A rejected document can be replaced."
      >
        <div className="space-y-3">
          {DOCUMENT_TYPES.map((type) => (
            <DocumentCard
              key={type}
              type={type}
              document={byType[type]}
              applicationId={application._id}
              readOnly={readOnly}
              onChanged={load}
            />
          ))}
        </div>
      </SectionCard>

      <div className="flex justify-end gap-2">
        <Link to="/app/application"><Button variant="secondary">Back to form</Button></Link>
        <Link to="/app/payment"><Button>Continue to fee payment</Button></Link>
      </div>
    </div>
  );
}
