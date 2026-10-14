import { Application } from '../models/Application.js';
import { Course } from '../models/Course.js';
import { STATUS, EDITABLE_STATUSES } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { nextApplicationNo } from '../services/applicationNumber.js';
import { checkCompleteness, pickEditableFields } from '../services/application.js';
import { notify } from '../services/notify.js';

const POPULATE = [
  { path: 'coursePreferences.course', select: 'code name department degreeLevel totalSeats seatsFilled cutOff' },
  { path: 'applicant', select: 'name email phone' },
  { path: 'assignedOfficer', select: 'name email' },
  { path: 'documents' },
  { path: 'payment' },
];

export const createApplication = asyncHandler(async (req, res) => {
  const existing = await Application.findOne({
    applicant: req.user._id,
    admissionCycle: env.admissionCycle,
    status: { $nin: [STATUS.WITHDRAWN, STATUS.REJECTED] },
  });
  if (existing) return ok(res, { application: existing }, 'Existing application returned');

  const application = new Application({
    applicant: req.user._id,
    admissionCycle: env.admissionCycle,
    applicationNo: await nextApplicationNo(env.admissionCycle),
    status: STATUS.DRAFT,
    ...pickEditableFields(req.body),
  });
  application.pushHistory({ to: STATUS.DRAFT, changedBy: req.user._id, remarks: 'Application started' });
  await application.save();

  return created(res, { application }, 'Draft application created');
});

export const getMyApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    applicant: req.user._id,
    admissionCycle: env.admissionCycle,
  })
    .sort({ createdAt: -1 })
    .populate(POPULATE);

  if (!application) return ok(res, { application: null }, 'No application yet');

  const completeness = checkCompleteness(application, {
    documents: application.documents || [],
    payment: application.payment,
  });
  return ok(res, { application, completeness }, 'Application fetched');
});

export const updateApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found');
  if (String(application.applicant) !== String(req.user._id)) throw ApiError.forbidden();
  if (!EDITABLE_STATUSES.includes(application.status)) {
    throw ApiError.badRequest(`An application in ${application.status} can no longer be edited`);
  }

  Object.assign(application, pickEditableFields(req.body));
  await application.save();
  await application.populate(POPULATE);

  const completeness = checkCompleteness(application, {
    documents: application.documents || [],
    payment: application.payment,
  });
  return ok(res, { application, completeness }, 'Draft saved');
});

export const submitApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate('documents payment');
  if (!application) throw ApiError.notFound('Application not found');
  if (String(application.applicant) !== String(req.user._id)) throw ApiError.forbidden();
  if (!EDITABLE_STATUSES.includes(application.status)) {
    throw ApiError.badRequest(`Cannot submit an application in ${application.status}`);
  }

  const completeness = checkCompleteness(application, {
    documents: application.documents || [],
    payment: application.payment,
  });
  if (!completeness.complete) {
    throw ApiError.badRequest('Application is incomplete', completeness.missing);
  }

  const from = application.status;
  application.status = STATUS.SUBMITTED;
  application.submittedAt = new Date();
  application.pushHistory({
    from,
    to: STATUS.SUBMITTED,
    changedBy: req.user._id,
    remarks: from === STATUS.ACTION_REQUIRED ? 'Resubmitted after corrections' : 'Submitted by applicant',
  });
  await application.save();

  await notify(application.applicant, {
    title: `Application ${application.applicationNo} submitted`,
    body: 'We have received your application. You can track verification from your dashboard.',
    link: '/app/status',
  });

  return ok(res, { application }, 'Application submitted');
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) throw ApiError.notFound('Application not found');
  if (String(application.applicant) !== String(req.user._id)) throw ApiError.forbidden();
  if ([STATUS.ADMITTED, STATUS.WITHDRAWN, STATUS.REJECTED].includes(application.status)) {
    throw ApiError.badRequest(`Cannot withdraw an application in ${application.status}`);
  }

  const from = application.status;
  application.status = STATUS.WITHDRAWN;
  application.pushHistory({ from, to: STATUS.WITHDRAWN, changedBy: req.user._id, remarks: req.body.remarks });
  await application.save();
  return ok(res, { application }, 'Application withdrawn');
});

export const getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate(POPULATE);
  if (!application) throw ApiError.notFound('Application not found');

  const isOwner = String(application.applicant?._id || application.applicant) === String(req.user._id);
  const isStaff = [ROLES.OFFICER, ROLES.ADMIN].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden();

  const completeness = checkCompleteness(application, {
    documents: application.documents || [],
    payment: application.payment,
  });
  return ok(res, { application, completeness }, 'Application fetched');
});

export const getCourseOptions = asyncHandler(async (req, res) => {
  const courses = await Course.find({ isActive: true, admissionCycle: env.admissionCycle })
    .select('code name department degreeLevel totalSeats seatsFilled eligibility cutOff')
    .sort({ department: 1, name: 1 });
  return ok(res, { courses }, 'Course options fetched');
});
