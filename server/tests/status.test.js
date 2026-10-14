import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Course } from '../src/models/Course.js';
import { Application } from '../src/models/Application.js';
import { Document } from '../src/models/Document.js';
import { ROLES } from '../src/constants/roles.js';
import { STATUS, canTransition, STATUS_TRANSITIONS } from '../src/constants/status.js';
import { VERIFICATION_STATUS } from '../src/constants/documents.js';
import { env } from '../src/config/env.js';
import { clearDatabase } from './setup.js';

const app = createApp();

const makeUser = async (role, email) => {
  const user = new User({ name: `${role} user`, email, phone: '9845012345', role, isEmailVerified: true });
  await user.setPassword('Secret@12345');
  await user.save();
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'Secret@12345' });
  return { user, token: res.body.data.accessToken };
};

const makeApplication = async (applicant, status = STATUS.SUBMITTED) => {
  const course = await Course.create({
    code: `C${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: 'B.Tech Computer Science and Engineering',
    department: 'Computer Science',
    degreeLevel: 'UG',
    durationYears: 4,
    totalSeats: 60,
    admissionCycle: env.admissionCycle,
  });

  return Application.create({
    applicationNo: `ADM2026${Math.floor(Math.random() * 900000 + 100000)}`,
    applicant: applicant._id,
    admissionCycle: env.admissionCycle,
    coursePreferences: [{ course: course._id, priority: 1 }],
    academics: { percentage: 88, subjects: [{ name: 'Mathematics', maxMarks: 100, obtained: 88 }] },
    personal: { category: 'GENERAL', dob: new Date('2007-01-01') },
    status,
    submittedAt: new Date(),
    statusHistory: [{ from: 'NEW', to: status, at: new Date() }],
  });
};

describe('transition map', () => {
  it('allows only the documented moves out of each state', () => {
    expect(canTransition(STATUS.DRAFT, STATUS.SUBMITTED)).toBe(true);
    expect(canTransition(STATUS.SUBMITTED, STATUS.UNDER_REVIEW)).toBe(true);
    expect(canTransition(STATUS.UNDER_REVIEW, STATUS.ACTION_REQUIRED)).toBe(true);
    expect(canTransition(STATUS.ACTION_REQUIRED, STATUS.UNDER_REVIEW)).toBe(true);
    expect(canTransition(STATUS.VERIFIED, STATUS.SHORTLISTED)).toBe(true);
    expect(canTransition(STATUS.SHORTLISTED, STATUS.ADMITTED)).toBe(true);
  });

  it('refuses skips and moves out of terminal states', () => {
    expect(canTransition(STATUS.SUBMITTED, STATUS.ADMITTED)).toBe(false);
    expect(canTransition(STATUS.DRAFT, STATUS.VERIFIED)).toBe(false);
    expect(canTransition(STATUS.ADMITTED, STATUS.DRAFT)).toBe(false);
    expect(STATUS_TRANSITIONS[STATUS.REJECTED]).toEqual([]);
    expect(STATUS_TRANSITIONS[STATUS.WITHDRAWN]).toEqual([]);
  });
});

describe('PATCH /applications/:id/status', () => {
  let officer;
  let applicant;
  let application;

  beforeEach(async () => {
    await clearDatabase();
    officer = await makeUser(ROLES.OFFICER, 'officer@college.test');
    applicant = await makeUser(ROLES.APPLICANT, 'applicant@example.com');
    application = await makeApplication(applicant.user);
  });

  it('rejects an illegal transition with 400 and leaves the status untouched', async () => {
    const res = await request(app)
      .patch(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({ to: STATUS.ADMITTED });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Illegal transition');
    const fresh = await Application.findById(application._id);
    expect(fresh.status).toBe(STATUS.SUBMITTED);
    expect(fresh.statusHistory).toHaveLength(1);
  });

  it('applies a legal transition and appends to statusHistory', async () => {
    const res = await request(app)
      .patch(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({ to: STATUS.UNDER_REVIEW, remarks: 'Picked up for verification' });

    expect(res.status).toBe(200);
    const fresh = await Application.findById(application._id);
    expect(fresh.status).toBe(STATUS.UNDER_REVIEW);
    expect(fresh.statusHistory.at(-1)).toMatchObject({
      from: STATUS.SUBMITTED,
      to: STATUS.UNDER_REVIEW,
      remarks: 'Picked up for verification',
    });
    expect(String(fresh.assignedOfficer)).toBe(String(officer.user._id));
  });

  it('requires remarks when asking for corrections', async () => {
    await request(app)
      .patch(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({ to: STATUS.UNDER_REVIEW });

    const res = await request(app)
      .patch(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({ to: STATUS.ACTION_REQUIRED });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/remarks/i);
  });

  it('refuses VERIFIED while a document is still unapproved', async () => {
    await Document.create({
      application: application._id,
      type: 'TENTH_MARKSHEET',
      url: '/uploads/x.pdf',
      verificationStatus: VERIFICATION_STATUS.PENDING,
    });
    await request(app)
      .patch(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({ to: STATUS.UNDER_REVIEW });

    const res = await request(app)
      .patch(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({ to: STATUS.VERIFIED });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not approved/i);
  });

  it('is closed to applicants', async () => {
    const res = await request(app)
      .patch(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${applicant.token}`)
      .send({ to: STATUS.UNDER_REVIEW });
    expect(res.status).toBe(403);
  });

  it('rejects an unknown status value', async () => {
    const res = await request(app)
      .patch(`/api/v1/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${officer.token}`)
      .send({ to: 'TELEPORTED' });
    expect(res.status).toBe(400);
  });
});

describe('applicant submit guard', () => {
  it('refuses to submit an incomplete draft and lists what is missing', async () => {
    await clearDatabase();
    const applicant = await makeUser(ROLES.APPLICANT, 'draft@example.com');
    const draft = await makeApplication(applicant.user, STATUS.DRAFT);

    const res = await request(app)
      .post(`/api/v1/applications/${draft._id}/submit`)
      .set('Authorization', `Bearer ${applicant.token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/incomplete/i);
    expect(res.body.errors.length).toBeGreaterThan(0);
    const fresh = await Application.findById(draft._id);
    expect(fresh.status).toBe(STATUS.DRAFT);
  });
});
