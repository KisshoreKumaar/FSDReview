// Shared copy of server/src/constants/status.js — keep the two in sync.
export const STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ACTION_REQUIRED: 'ACTION_REQUIRED',
  VERIFIED: 'VERIFIED',
  SHORTLISTED: 'SHORTLISTED',
  ADMITTED: 'ADMITTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
};

export const STATUS_VALUES = Object.values(STATUS);

export const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  ACTION_REQUIRED: 'Action required',
  VERIFIED: 'Verified',
  SHORTLISTED: 'Shortlisted',
  ADMITTED: 'Admitted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export const STATUS_STYLES = {
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-200',
  SUBMITTED: 'bg-sky-50 text-sky-700 ring-sky-200',
  UNDER_REVIEW: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  ACTION_REQUIRED: 'bg-amber-50 text-amber-800 ring-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  SHORTLISTED: 'bg-violet-50 text-violet-700 ring-violet-200',
  ADMITTED: 'bg-green-100 text-green-800 ring-green-300',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  WITHDRAWN: 'bg-slate-100 text-slate-500 ring-slate-200',
};

export const STATUS_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['UNDER_REVIEW', 'WITHDRAWN', 'REJECTED'],
  UNDER_REVIEW: ['ACTION_REQUIRED', 'VERIFIED', 'REJECTED', 'WITHDRAWN'],
  ACTION_REQUIRED: ['UNDER_REVIEW', 'WITHDRAWN', 'REJECTED'],
  VERIFIED: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['ADMITTED', 'REJECTED', 'WITHDRAWN'],
  ADMITTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

/** Order used by the applicant timeline stepper. */
export const TIMELINE_STEPS = [
  STATUS.DRAFT,
  STATUS.SUBMITTED,
  STATUS.UNDER_REVIEW,
  STATUS.VERIFIED,
  STATUS.SHORTLISTED,
  STATUS.ADMITTED,
];

export const EDITABLE_STATUSES = [STATUS.DRAFT, STATUS.ACTION_REQUIRED];
