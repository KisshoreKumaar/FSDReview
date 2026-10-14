import { Application } from '../models/Application.js';
import { Document } from '../models/Document.js';
import { VERIFICATION_STATUS } from '../constants/documents.js';
import { STATUS, EDITABLE_STATUSES } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { uploadFile, removeFile } from '../services/storage.js';
import { notify } from '../services/notify.js';
import { DOCUMENT_LABELS } from '../constants/documents.js';

const loadOwnedApplication = async (applicationId, user) => {
  const application = await Application.findById(applicationId);
  if (!application) throw ApiError.notFound('Application not found');
  if (String(application.applicant) !== String(user._id)) throw ApiError.forbidden();
  return application;
};

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Attach a file under the "file" field');
  const { type } = req.body;
  if (!type) throw ApiError.badRequest('Document type is required');

  const application = await loadOwnedApplication(req.params.id, req.user);
  if (!EDITABLE_STATUSES.includes(application.status) && application.status !== STATUS.SUBMITTED) {
    throw ApiError.badRequest(`Documents cannot be changed while the application is ${application.status}`);
  }

  // One live document per type — re-uploading replaces the previous file.
  const previous = await Document.findOne({ application: application._id, type });
  if (previous) {
    if (previous.verificationStatus === VERIFICATION_STATUS.APPROVED) {
      throw ApiError.badRequest(`${DOCUMENT_LABELS[type]} is already approved and cannot be replaced`);
    }
    await removeFile(previous.publicId).catch(() => {});
    await previous.deleteOne();
    application.documents.pull(previous._id);
  }

  const stored = await uploadFile(req.file, { folder: String(application._id) });
  const document = await Document.create({
    application: application._id,
    type,
    originalName: req.file.originalname,
    url: stored.url,
    publicId: stored.publicId,
    storageDriver: stored.driver,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
  });

  application.documents.push(document._id);
  await application.save();

  return created(res, { document }, `${DOCUMENT_LABELS[type] || 'Document'} uploaded`);
});

export const listDocuments = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).select('applicant');
  if (!application) throw ApiError.notFound('Application not found');

  const isOwner = String(application.applicant) === String(req.user._id);
  const isStaff = [ROLES.OFFICER, ROLES.ADMIN].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden();

  const documents = await Document.find({ application: application._id })
    .populate('verifiedBy', 'name')
    .sort({ createdAt: 1 });
  return ok(res, { documents }, 'Documents fetched');
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');

  const application = await loadOwnedApplication(document.application, req.user);
  if (document.verificationStatus !== VERIFICATION_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending documents can be deleted');
  }

  await removeFile(document.publicId).catch(() => {});
  await document.deleteOne();
  application.documents.pull(document._id);
  await application.save();

  return ok(res, null, 'Document deleted');
});

export const verifyDocument = asyncHandler(async (req, res) => {
  const { verificationStatus, rejectionReason } = req.body;
  if (![VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED].includes(verificationStatus)) {
    throw ApiError.badRequest('verificationStatus must be APPROVED or REJECTED');
  }
  if (verificationStatus === VERIFICATION_STATUS.REJECTED && !rejectionReason?.trim()) {
    throw ApiError.badRequest('A rejection reason is required');
  }

  const document = await Document.findById(req.params.id).populate('application', 'applicant applicationNo');
  if (!document) throw ApiError.notFound('Document not found');

  document.verificationStatus = verificationStatus;
  document.rejectionReason = verificationStatus === VERIFICATION_STATUS.REJECTED ? rejectionReason.trim() : undefined;
  document.verifiedBy = req.user._id;
  document.verifiedAt = new Date();
  await document.save();

  const label = DOCUMENT_LABELS[document.type] || 'Document';
  await notify(document.application.applicant, {
    title: `${label} ${verificationStatus.toLowerCase()}`,
    body:
      verificationStatus === VERIFICATION_STATUS.APPROVED
        ? `Your ${label} has been verified.`
        : `Your ${label} was rejected: ${document.rejectionReason}`,
    link: '/app/documents',
  });

  return ok(res, { document }, `Document ${verificationStatus.toLowerCase()}`);
});
