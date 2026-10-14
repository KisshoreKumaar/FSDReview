import { Application } from '../models/Application.js';
import { Document } from '../models/Document.js';
import { User } from '../models/User.js';
import { STATUS, canTransition, STATUS_TRANSITIONS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { VERIFICATION_STATUS } from '../constants/documents.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/apiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import { notify } from '../services/notify.js';
import { emitStatusChange } from '../sockets/emitStatusChange.js';

const STATUS_MESSAGES = {
  [STATUS.UNDER_REVIEW]: 'Your application is now being reviewed by a verification officer.',
  [STATUS.ACTION_REQUIRED]: 'We need corrections before we can verify your application.',
  [STATUS.VERIFIED]: 'Your documents are verified. You are now eligible for the merit list.',
  [STATUS.SHORTLISTED]: 'Congratulations — you have been shortlisted.',
  [STATUS.ADMITTED]: 'Congratulations — your admission is confirmed.',
  [STATUS.REJECTED]: 'Your application was not accepted.',
  [STATUS.WITHDRAWN]: 'Your application has been withdrawn.',
};

export const listApplications = asyncHandler(async (req, res) => {
  const { status, course, q, officer, mine } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { admissionCycle: req.query.admissionCycle || env.admissionCycle };
  if (status) filter.status = { $in: String(status).split(',') };
  if (course) filter['coursePreferences.course'] = course;
  if (officer) filter.assignedOfficer = officer;
  if (mine === 'true') filter.assignedOfficer = req.user._id;

  if (q) {
    const rx = new RegExp(String(q).trim(), 'i');
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id');
    filter.$or = [{ applicationNo: rx }, { applicant: { $in: users.map((u) => u._id) } }];
  }

  const [items, total] = await Promise.all([
    Application.find(filter)
      .populate('applicant', 'name email phone')
      .populate('coursePreferences.course', 'code name')
      .populate('assignedOfficer', 'name')
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  return paginated(res, { items, total, page, limit }, 'Applications fetched');
});

export const changeStatus = asyncHandler(async (req, res) => {
  const { to, remarks } = req.body;
  const application = await Application.findById(req.params.id).populate('applicant', 'name email');
  if (!application) throw ApiError.notFound('Application not found');

  const from = application.status;
  if (!canTransition(from, to)) {
    throw ApiError.badRequest(
      `Illegal transition ${from} → ${to}. Allowed from ${from}: ${
        STATUS_TRANSITIONS[from]?.join(', ') || 'none'
      }`,
    );
  }
  if (to === STATUS.ACTION_REQUIRED && !remarks?.trim()) {
    throw ApiError.badRequest('Remarks are required when asking for corrections');
  }

  if (to === STATUS.VERIFIED) {
    const pending = await Document.countDocuments({
      application: application._id,
      verificationStatus: { $ne: VERIFICATION_STATUS.APPROVED },
    });
    if (pending > 0) {
      throw ApiError.badRequest(`${pending} document(s) are not approved yet — verify them first`);
    }
  }

  application.status = to;
  if (to === STATUS.UNDER_REVIEW && !application.assignedOfficer) {
    application.assignedOfficer = req.user._id;
  }
  application.pushHistory({ from, to, changedBy: req.user._id, remarks: remarks?.trim() });
  await application.save();

  const applicantId = application.applicant?._id || application.applicant;
  emitStatusChange(applicantId, {
    applicationId: application._id,
    applicationNo: application.applicationNo,
    from,
    to,
    remarks,
  });
  await notify(applicantId, {
    title: `Application ${application.applicationNo} — ${to.replace('_', ' ').toLowerCase()}`,
    body: `${STATUS_MESSAGES[to] || 'Your application status changed.'}${remarks ? ` Officer remarks: ${remarks}` : ''}`,
    link: '/app/status',
  });

  return ok(res, { application }, `Status changed to ${to}`);
});

export const assignOfficer = asyncHandler(async (req, res) => {
  const officer = await User.findById(req.body.officerId);
  if (!officer || ![ROLES.OFFICER, ROLES.ADMIN].includes(officer.role)) {
    throw ApiError.badRequest('Pick a valid verification officer');
  }

  const application = await Application.findByIdAndUpdate(
    req.params.id,
    { assignedOfficer: officer._id },
    { new: true },
  ).populate('assignedOfficer', 'name email');
  if (!application) throw ApiError.notFound('Application not found');

  return ok(res, { application }, `Assigned to ${officer.name}`);
});

export const listOfficers = asyncHandler(async (req, res) => {
  const officers = await User.find({ role: { $in: [ROLES.OFFICER, ROLES.ADMIN] }, isActive: true })
    .select('name email role')
    .sort({ name: 1 });

  const counts = await Application.aggregate([
    { $match: { assignedOfficer: { $ne: null } } },
    { $group: { _id: '$assignedOfficer', total: { $sum: 1 } } },
  ]);
  const byOfficer = Object.fromEntries(counts.map((c) => [String(c._id), c.total]));

  return ok(
    res,
    { officers: officers.map((o) => ({ ...o.toObject(), assignedCount: byOfficer[String(o._id)] || 0 })) },
    'Officers fetched',
  );
});
