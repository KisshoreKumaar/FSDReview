import { REQUIRED_DOCUMENT_TYPES, VERIFICATION_STATUS } from '../constants/documents.js';

/** Weighted percentage across all reported subjects. */
export const computePercentage = (subjects = []) => {
  const totals = subjects.reduce(
    (acc, s) => ({ max: acc.max + Number(s.maxMarks || 0), got: acc.got + Number(s.obtained || 0) }),
    { max: 0, got: 0 },
  );
  if (!totals.max) return 0;
  return Number(((totals.got / totals.max) * 100).toFixed(2));
};

const filled = (value) => value !== undefined && value !== null && String(value).trim() !== '';

/**
 * Pure completeness check — returns every missing piece so the UI can show a
 * checklist instead of a single unhelpful error.
 */
export const checkCompleteness = (application, { documents = [], payment = null } = {}) => {
  const missing = [];
  const { personal = {}, address = {}, academics = {}, coursePreferences = [] } = application;

  if (!filled(personal.fatherName)) missing.push({ step: 'personal', field: "Father's name" });
  if (!filled(personal.dob)) missing.push({ step: 'personal', field: 'Date of birth' });
  if (!filled(personal.gender)) missing.push({ step: 'personal', field: 'Gender' });
  if (!filled(personal.category)) missing.push({ step: 'personal', field: 'Category' });

  ['line1', 'city', 'state', 'pincode'].forEach((key) => {
    if (!filled(address[key])) missing.push({ step: 'address', field: `Address ${key}` });
  });

  if (!filled(academics.board)) missing.push({ step: 'academics', field: 'Board' });
  if (!filled(academics.schoolName)) missing.push({ step: 'academics', field: 'School name' });
  if (!filled(academics.yearOfPassing)) missing.push({ step: 'academics', field: 'Year of passing' });
  if (!academics.subjects?.length) missing.push({ step: 'academics', field: 'At least one subject' });

  if (!coursePreferences.length) missing.push({ step: 'preferences', field: 'At least one course preference' });

  const uploadedTypes = new Set(
    documents.filter((d) => d.verificationStatus !== VERIFICATION_STATUS.REJECTED).map((d) => d.type),
  );
  REQUIRED_DOCUMENT_TYPES.forEach((type) => {
    if (!uploadedTypes.has(type)) missing.push({ step: 'documents', field: type });
  });

  if (!payment || payment.status !== 'PAID') {
    missing.push({ step: 'payment', field: 'Application fee' });
  }

  return { complete: missing.length === 0, missing };
};

/** Fields an applicant is allowed to write. Everything else is ignored. */
export const pickEditableFields = (body = {}) => {
  const out = {};
  if (body.personal) out.personal = body.personal;
  if (body.address) out.address = body.address;
  if (body.academics) {
    out.academics = {
      ...body.academics,
      percentage: computePercentage(body.academics.subjects),
    };
  }
  if (body.coursePreferences) {
    out.coursePreferences = body.coursePreferences
      .filter((p) => p?.course)
      .slice(0, 5)
      .map((p, i) => ({ course: p.course, priority: p.priority || i + 1 }));
  }
  return out;
};
