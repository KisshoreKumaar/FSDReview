import crypto from 'node:crypto';
import { Application } from '../models/Application.js';
import { Course } from '../models/Course.js';
import { Document } from '../models/Document.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { STATUS_VALUES } from '../constants/status.js';
import { VERIFICATION_STATUS } from '../constants/documents.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { sendMail } from '../services/mailer.js';
import { welcomeOfficerEmail } from '../services/emailTemplates.js';

export const getStats = asyncHandler(async (req, res) => {
  const cycle = env.admissionCycle;

  const [byStatusRaw, courses, docsPending, payments, totalApplications] = await Promise.all([
    Application.aggregate([
      { $match: { admissionCycle: cycle } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Course.find({ admissionCycle: cycle, isActive: true }).select('code name totalSeats seatsFilled'),
    Document.countDocuments({ verificationStatus: VERIFICATION_STATUS.PENDING }),
    Payment.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Application.countDocuments({ admissionCycle: cycle }),
  ]);

  const byStatus = Object.fromEntries(STATUS_VALUES.map((s) => [s, 0]));
  byStatusRaw.forEach((row) => {
    byStatus[row._id] = row.count;
  });

  const demand = await Application.aggregate([
    { $match: { admissionCycle: cycle } },
    { $unwind: '$coursePreferences' },
    { $group: { _id: '$coursePreferences.course', applications: { $sum: 1 } } },
  ]);
  const demandByCourse = Object.fromEntries(demand.map((d) => [String(d._id), d.applications]));

  return ok(
    res,
    {
      cycle,
      totalApplications,
      byStatus,
      documentsPending: docsPending,
      payments: {
        collectedPaise: payments[0]?.total || 0,
        count: payments[0]?.count || 0,
      },
      courses: courses.map((c) => ({
        id: c._id,
        code: c.code,
        name: c.name,
        totalSeats: c.totalSeats,
        seatsFilled: c.seatsFilled,
        fillRate: c.totalSeats ? Math.round((c.seatsFilled / c.totalSeats) * 100) : 0,
        applications: demandByCourse[String(c._id)] || 0,
      })),
    },
    'Stats fetched',
  );
});

export const createOfficer = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) throw ApiError.badRequest('Name, email and phone are required');
  if (await User.exists({ email: email.toLowerCase() })) throw ApiError.conflict('Email already in use');

  const password = `Ofc@${crypto.randomBytes(4).toString('hex')}`;
  const officer = new User({ name, email, phone, role: ROLES.OFFICER, isEmailVerified: true });
  await officer.setPassword(password);
  await officer.save();

  await sendMail({ to: officer.email, ...welcomeOfficerEmail({ name, email: officer.email, password }) });

  return created(
    res,
    { officer: officer.toPublic(), ...(env.isProd ? {} : { temporaryPassword: password }) },
    'Officer account created',
  );
});

export const updateOfficer = asyncHandler(async (req, res) => {
  const { isActive, name, phone } = req.body;
  const officer = await User.findById(req.params.id);
  if (!officer || officer.role !== ROLES.OFFICER) throw ApiError.notFound('Officer not found');

  if (name) officer.name = name;
  if (phone) officer.phone = phone;
  if (typeof isActive === 'boolean') officer.isActive = isActive;
  await officer.save();

  return ok(res, { officer: officer.toPublic() }, 'Officer updated');
});
