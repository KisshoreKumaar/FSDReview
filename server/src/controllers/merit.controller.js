import { Application } from '../models/Application.js';
import { Course } from '../models/Course.js';
import { MeritList } from '../models/MeritList.js';
import { STATUS } from '../constants/status.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { rankApplications } from '../services/merit.js';
import { notify } from '../services/notify.js';
import { emitStatusChange } from '../sockets/emitStatusChange.js';

/** Generating is idempotent: it replaces an unpublished draft, never a published list. */
export const generateMeritList = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const admissionCycle = req.body.admissionCycle || env.admissionCycle;

  const course = await Course.findById(courseId);
  if (!course) throw ApiError.notFound('Course not found');

  const existing = await MeritList.findOne({ course: course._id, admissionCycle });
  if (existing?.isPublished) {
    throw ApiError.conflict('This merit list is already published and cannot be regenerated');
  }

  const applications = await Application.find({
    admissionCycle,
    status: STATUS.VERIFIED,
    'coursePreferences.course': course._id,
  }).populate('applicant', 'name');

  const { entries, excludedCount, seatsAllotted, totalSeats } = rankApplications(applications, course);

  const meritList = existing || new MeritList({ course: course._id, admissionCycle });
  meritList.entries = entries;
  meritList.totalSeats = totalSeats;
  meritList.seatsAllotted = seatsAllotted;
  meritList.excludedCount = excludedCount;
  meritList.generatedBy = req.user._id;
  await meritList.save();

  return ok(
    res,
    { meritList, eligibleCount: applications.length },
    `Merit list generated: ${entries.length} ranked, ${seatsAllotted} allotted, ${excludedCount} below cut-off`,
  );
});

export const previewMeritList = asyncHandler(async (req, res) => {
  const meritList = await MeritList.findById(req.params.id).populate('course', 'code name totalSeats cutOff');
  if (!meritList) throw ApiError.notFound('Merit list not found');
  return ok(res, { meritList }, 'Merit list fetched');
});

export const listMeritLists = asyncHandler(async (req, res) => {
  const filter = { admissionCycle: req.query.admissionCycle || env.admissionCycle };
  if (req.query.published === 'true') filter.isPublished = true;

  const meritLists = await MeritList.find(filter)
    .populate('course', 'code name department totalSeats seatsFilled')
    .populate('publishedBy', 'name')
    .select('-entries')
    .sort({ updatedAt: -1 });
  return ok(res, { meritLists }, 'Merit lists fetched');
});

export const publishMeritList = asyncHandler(async (req, res) => {
  const meritList = await MeritList.findById(req.params.id).populate('course', 'code name totalSeats');
  if (!meritList) throw ApiError.notFound('Merit list not found');
  if (meritList.isPublished) throw ApiError.conflict('Merit list is already published');
  if (!meritList.entries.length) throw ApiError.badRequest('Nothing to publish — generate the list first');

  meritList.isPublished = true;
  meritList.publishedAt = new Date();
  meritList.publishedBy = req.user._id;
  await meritList.save();

  // Write rank/score back onto each application; allotted ones become SHORTLISTED.
  const applications = await Application.find({
    _id: { $in: meritList.entries.map((e) => e.application) },
  }).select('status applicant applicationNo statusHistory meritScore meritRank');
  const byId = Object.fromEntries(applications.map((a) => [String(a._id), a]));

  for (const entry of meritList.entries) {
    const application = byId[String(entry.application)];
    if (!application) continue;

    application.meritScore = entry.meritScore;
    application.meritRank = entry.rank;
    if (entry.allotted && application.status === STATUS.VERIFIED) {
      application.pushHistory({
        from: application.status,
        to: STATUS.SHORTLISTED,
        changedBy: req.user._id,
        remarks: `Rank ${entry.rank} in ${meritList.course.code} merit list`,
      });
      application.status = STATUS.SHORTLISTED;
      emitStatusChange(application.applicant, {
        applicationId: application._id,
        applicationNo: application.applicationNo,
        from: STATUS.VERIFIED,
        to: STATUS.SHORTLISTED,
        remarks: `Rank ${entry.rank}`,
      });
    }
    await application.save();

    await notify(application.applicant, {
      title: `Merit list published — ${meritList.course.code}`,
      body: entry.allotted
        ? `You are rank ${entry.rank} with a score of ${entry.meritScore} and a seat has been allotted to you.`
        : `You are rank ${entry.rank} with a score of ${entry.meritScore}. No seat is allotted in this round.`,
      link: '/app/status',
    });
  }

  await Course.findByIdAndUpdate(meritList.course._id, { seatsFilled: meritList.seatsAllotted });

  return ok(res, { meritList }, `Merit list published — ${meritList.entries.length} applicants notified`);
});

export const publicMeritLists = asyncHandler(async (req, res) => {
  const filter = { isPublished: true, admissionCycle: req.query.admissionCycle || env.admissionCycle };
  if (req.query.courseId) filter.course = req.query.courseId;

  const meritLists = await MeritList.find(filter)
    .populate('course', 'code name department degreeLevel totalSeats')
    .sort({ publishedAt: -1 });

  // Published lists are public — strip everything but rank, number and outcome.
  const sanitised = meritLists.map((list) => ({
    id: list._id,
    course: list.course,
    publishedAt: list.publishedAt,
    totalSeats: list.totalSeats,
    seatsAllotted: list.seatsAllotted,
    entries: list.entries.map((e) => ({
      rank: e.rank,
      applicationNo: e.applicationNo,
      applicantName: e.applicantName,
      category: e.category,
      meritScore: e.meritScore,
      allotted: e.allotted,
    })),
  }));

  return ok(res, { meritLists: sanitised }, 'Published merit lists');
});
