export const ROLES = { APPLICANT: 'APPLICANT', OFFICER: 'OFFICER', ADMIN: 'ADMIN' };

export const ROLE_LABELS = {
  APPLICANT: 'Applicant',
  OFFICER: 'Verification Officer',
  ADMIN: 'Administrator',
};

export const isStaff = (role) => role === ROLES.OFFICER || role === ROLES.ADMIN;
