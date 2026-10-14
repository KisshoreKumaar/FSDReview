import { Application } from '../src/models/Application.js';
import { Document } from '../src/models/Document.js';
import { Payment } from '../src/models/Payment.js';
import { User } from '../src/models/User.js';
import { ROLES } from '../src/constants/roles.js';
import { STATUS } from '../src/constants/status.js';
import { REQUIRED_DOCUMENT_TYPES, VERIFICATION_STATUS } from '../src/constants/documents.js';
import { env } from '../src/config/env.js';
import { computePercentage } from '../src/services/application.js';
import { nextApplicationNo } from '../src/services/applicationNumber.js';
import { FIRST_NAMES, LAST_NAMES, CITIES, BOARDS, SCHOOLS } from './names.js';

const CATEGORY_MIX = ['GENERAL', 'GENERAL', 'GENERAL', 'OBC', 'OBC', 'SC', 'ST'];
const PASSWORD = 'Applicant@123';

/* Status spread for ~40 applications — enough of each to demo every screen. */
const STATUS_PLAN = [
  [STATUS.VERIFIED, 14],
  [STATUS.UNDER_REVIEW, 8],
  [STATUS.SUBMITTED, 6],
  [STATUS.ACTION_REQUIRED, 4],
  [STATUS.DRAFT, 4],
  [STATUS.REJECTED, 2],
  [STATUS.WITHDRAWN, 2],
];

const pick = (arr, i) => arr[i % arr.length];
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const subjectsFor = (course, seed) => {
  const base = course.eligibility?.requiredSubjects?.length
    ? [...course.eligibility.requiredSubjects]
    : ['English', 'Mathematics'];
  const names = [...new Set([...base, 'English', 'Computer Science'])].slice(0, 5);
  return names.map((name, i) => ({
    name,
    maxMarks: 100,
    // Deterministic spread, 58–98
    obtained: 58 + ((seed * 7 + i * 13) % 41),
  }));
};

const buildStatusHistory = (status, userId, officerId, submittedAt) => {
  const history = [{ from: 'NEW', to: STATUS.DRAFT, changedBy: userId, at: daysAgo(40), remarks: 'Application started' }];
  if (status === STATUS.DRAFT) return history;

  history.push({ from: STATUS.DRAFT, to: STATUS.SUBMITTED, changedBy: userId, at: submittedAt, remarks: 'Submitted by applicant' });
  if (status === STATUS.SUBMITTED) return history;

  if (status === STATUS.WITHDRAWN) {
    history.push({ from: STATUS.SUBMITTED, to: STATUS.WITHDRAWN, changedBy: userId, at: daysAgo(5), remarks: 'Joined another college' });
    return history;
  }

  history.push({ from: STATUS.SUBMITTED, to: STATUS.UNDER_REVIEW, changedBy: officerId, at: daysAgo(12), remarks: 'Picked up for verification' });
  if (status === STATUS.UNDER_REVIEW) return history;

  if (status === STATUS.ACTION_REQUIRED) {
    history.push({
      from: STATUS.UNDER_REVIEW,
      to: STATUS.ACTION_REQUIRED,
      changedBy: officerId,
      at: daysAgo(8),
      remarks: 'Community certificate is illegible — please re-upload a clear scan.',
    });
    return history;
  }
  if (status === STATUS.REJECTED) {
    history.push({
      from: STATUS.UNDER_REVIEW,
      to: STATUS.REJECTED,
      changedBy: officerId,
      at: daysAgo(6),
      remarks: 'Does not meet the minimum eligibility percentage.',
    });
    return history;
  }

  history.push({ from: STATUS.UNDER_REVIEW, to: STATUS.VERIFIED, changedBy: officerId, at: daysAgo(4), remarks: 'All documents verified' });
  return history;
};

export const seedApplications = async ({ courses, officers }) => {
  const plan = STATUS_PLAN.flatMap(([status, count]) => Array.from({ length: count }, () => status));
  const created = [];

  for (let i = 0; i < plan.length; i += 1) {
    const status = plan[i];
    const first = pick(FIRST_NAMES, i);
    const last = pick(LAST_NAMES, i * 3 + 1);
    const email = `${first}.${last}${i}@example.com`.toLowerCase();
    const officer = pick(officers, i);
    const place = pick(CITIES, i);

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: `${first} ${last}`,
        email,
        phone: `9${String(800000000 + i * 137711).slice(0, 9)}`,
        role: ROLES.APPLICANT,
        isEmailVerified: true,
      });
      await user.setPassword(PASSWORD);
      await user.save();
    }

    if (await Application.exists({ applicant: user._id, admissionCycle: env.admissionCycle })) continue;

    // Weighted demand: a few flagship courses attract most applicants, as in reality.
    const popular = courses.filter((c) => ['BTCSE', 'BTECE', 'BCOMH', 'MBA', 'BSCCS'].includes(c.code));
    const primary = pick(popular.length ? popular : courses, i);
    const secondary = pick(courses, i + 4);
    const subjects = subjectsFor(primary, i + 1);
    const submittedAt = daysAgo(20 - (i % 15));

    const application = new Application({
      applicationNo: await nextApplicationNo(env.admissionCycle),
      applicant: user._id,
      admissionCycle: env.admissionCycle,
      coursePreferences: [
        { course: primary._id, priority: 1 },
        { course: secondary._id, priority: 2 },
      ],
      personal: {
        fatherName: `${pick(FIRST_NAMES, i + 9)} ${last}`,
        motherName: `${pick(FIRST_NAMES, i + 14)} ${last}`,
        dob: new Date(2007, i % 12, (i % 27) + 1),
        gender: i % 2 ? 'FEMALE' : 'MALE',
        category: pick(CATEGORY_MIX, i),
        nationality: 'Indian',
      },
      address: {
        line1: `${12 + i} ${pick(['MG Road', 'Gandhi Nagar', 'Nehru Street', 'Jayanagar 4th Block'], i)}`,
        line2: pick(['Near City Library', 'Opposite Bus Depot', ''], i),
        city: place.city,
        state: place.state,
        pincode: place.pincode,
      },
      academics: {
        board: pick(BOARDS, i),
        schoolName: `${pick(SCHOOLS, i)}, ${place.city}`,
        yearOfPassing: 2025,
        subjects,
        percentage: computePercentage(subjects),
      },
      status,
      assignedOfficer: [STATUS.DRAFT, STATUS.SUBMITTED].includes(status) ? undefined : officer._id,
      submittedAt: status === STATUS.DRAFT ? undefined : submittedAt,
      statusHistory: buildStatusHistory(status, user._id, officer._id, submittedAt),
    });
    await application.save();

    if (status !== STATUS.DRAFT) {
      const docs = await Document.insertMany(
        REQUIRED_DOCUMENT_TYPES.map((type) => ({
          application: application._id,
          type,
          originalName: `${type.toLowerCase()}.pdf`,
          url: `/uploads/samples/${type.toLowerCase()}.pdf`,
          publicId: `samples/${type.toLowerCase()}.pdf`,
          storageDriver: 'local',
          mimeType: 'application/pdf',
          sizeBytes: 180000 + i * 1000,
          verificationStatus:
            status === STATUS.VERIFIED
              ? VERIFICATION_STATUS.APPROVED
              : status === STATUS.ACTION_REQUIRED && type === 'TWELFTH_MARKSHEET'
                ? VERIFICATION_STATUS.REJECTED
                : VERIFICATION_STATUS.PENDING,
          rejectionReason:
            status === STATUS.ACTION_REQUIRED && type === 'TWELFTH_MARKSHEET'
              ? 'Scan is blurred — upload a clearer copy'
              : undefined,
          verifiedBy: status === STATUS.VERIFIED ? officer._id : undefined,
          verifiedAt: status === STATUS.VERIFIED ? daysAgo(5) : undefined,
        })),
      );

      const payment = await Payment.create({
        application: application._id,
        applicant: user._id,
        razorpayOrderId: `order_seed_${application.applicationNo}`,
        razorpayPaymentId: `pay_seed_${application.applicationNo}`,
        amount: env.razorpay.feePaise,
        status: 'PAID',
        isMock: true,
        method: 'mock',
        paidAt: submittedAt,
      });

      application.documents = docs.map((d) => d._id);
      application.payment = payment._id;
      await application.save();
    }

    created.push(application);
  }

  return { applications: created, password: PASSWORD };
};

export default seedApplications;
