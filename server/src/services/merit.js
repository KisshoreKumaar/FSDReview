import { CATEGORY_CUTOFF_KEY } from '../constants/categories.js';

/** Average percentage across the course's required subjects (falls back to all). */
export const subjectAverage = (subjects = [], requiredSubjects = []) => {
  const wanted = requiredSubjects.map((s) => s.toLowerCase());
  const matched = wanted.length
    ? subjects.filter((s) => wanted.includes(String(s.name).toLowerCase()))
    : subjects;
  const pool = matched.length ? matched : subjects;
  if (!pool.length) return 0;

  const total = pool.reduce((acc, s) => acc + (Number(s.obtained) / Number(s.maxMarks || 1)) * 100, 0);
  return Number((total / pool.length).toFixed(2));
};

/** meritScore = (academic% × 0.80) + (subjectBonus × 0.20) */
export const computeMeritScore = ({ percentage, subjects = [], requiredSubjects = [] }) => {
  const bonus = subjectAverage(subjects, requiredSubjects);
  return Number((Number(percentage || 0) * 0.8 + bonus * 0.2).toFixed(2));
};

export const cutOffFor = (course, category) =>
  Number(course?.cutOff?.[CATEGORY_CUTOFF_KEY[category] || 'general'] || 0);

/**
 * Pure ranking function — no database access, so it is unit-testable.
 *
 * applications: [{ _id, applicationNo, applicant:{name}, personal:{category,dob},
 *                  academics:{percentage,subjects}, submittedAt }]
 * Rules: cut-off filter → score desc → subject average desc → earlier submittedAt
 *        → earlier dob; seats allotted top-down.
 */
export const rankApplications = (applications = [], course = {}) => {
  const required = course?.eligibility?.requiredSubjects || [];
  const totalSeats = Number(course?.totalSeats || 0);

  const scored = [];
  let excludedCount = 0;

  applications.forEach((app) => {
    const percentage = Number(app.academics?.percentage || 0);
    const category = app.personal?.category || 'GENERAL';
    const average = subjectAverage(app.academics?.subjects, required);
    const meritScore = computeMeritScore({ percentage, subjects: app.academics?.subjects, requiredSubjects: required });

    // Applicants below their category cut-off never enter the ranking.
    if (percentage < cutOffFor(course, category)) {
      excludedCount += 1;
      return;
    }

    scored.push({
      application: app._id,
      applicationNo: app.applicationNo,
      applicantName: app.applicant?.name || 'Unknown',
      category,
      percentage,
      subjectAverage: average,
      meritScore,
      submittedAt: app.submittedAt ? new Date(app.submittedAt).getTime() : Number.MAX_SAFE_INTEGER,
      dob: app.personal?.dob ? new Date(app.personal.dob).getTime() : Number.MAX_SAFE_INTEGER,
    });
  });

  scored.sort(
    (a, b) =>
      b.meritScore - a.meritScore ||
      b.subjectAverage - a.subjectAverage ||
      a.submittedAt - b.submittedAt ||
      a.dob - b.dob,
  );

  const entries = scored.map((entry, index) => ({
    application: entry.application,
    applicationNo: entry.applicationNo,
    applicantName: entry.applicantName,
    category: entry.category,
    percentage: entry.percentage,
    subjectAverage: entry.subjectAverage,
    meritScore: entry.meritScore,
    rank: index + 1,
    allotted: index < totalSeats,
  }));

  return {
    entries,
    excludedCount,
    seatsAllotted: Math.min(totalSeats, entries.length),
    totalSeats,
  };
};

export default rankApplications;
