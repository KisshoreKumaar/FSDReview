import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { ROLES } from '../src/constants/roles.js';
import { clearDatabase } from './setup.js';

const app = createApp();

const APPLICANT = {
  name: 'Aarav Sharma',
  email: 'aarav.sharma@example.com',
  phone: '9876501234',
  password: 'Applicant@123',
};

const registerAndVerify = async (over = {}) => {
  const payload = { ...APPLICANT, ...over };
  const registered = await request(app).post('/api/v1/auth/register').send(payload);
  const { devOtp } = registered.body.data;
  const verified = await request(app)
    .post('/api/v1/auth/verify-otp')
    .send({ email: payload.email, code: devOtp });
  return { payload, accessToken: verified.body.data.accessToken, cookie: verified.headers['set-cookie'] };
};

const makeStaff = async (role) => {
  const user = new User({
    name: role === ROLES.ADMIN ? 'Dr. Ramesh Iyer' : 'Sunita Deshmukh',
    email: `${role.toLowerCase()}@college.test`,
    phone: '9845012345',
    role,
    isEmailVerified: true,
  });
  await user.setPassword('Staff@12345');
  await user.save();

  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: user.email, password: 'Staff@12345' });
  return res.body.data.accessToken;
};

beforeEach(async () => {
  await clearDatabase();
});

describe('POST /auth/register', () => {
  it('creates an unverified applicant and issues an OTP', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(APPLICANT);
    expect(res.status).toBe(201);
    expect(res.body.data.devOtp).toMatch(/^\d{6}$/);

    const user = await User.findOne({ email: APPLICANT.email });
    expect(user.isEmailVerified).toBe(false);
    expect(user.role).toBe(ROLES.APPLICANT);
  });

  it('never stores the password in clear text', async () => {
    await request(app).post('/api/v1/auth/register').send(APPLICANT);
    const user = await User.findOne({ email: APPLICANT.email }).select('+passwordHash');
    expect(user.passwordHash).not.toBe(APPLICANT.password);
    expect(await user.verifyPassword(APPLICANT.password)).toBe(true);
  });

  it('rejects a weak password and a malformed phone number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...APPLICANT, password: 'short', phone: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['phone', 'password']));
  });

  it('refuses a duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(APPLICANT);
    const res = await request(app).post('/api/v1/auth/register').send(APPLICANT);
    expect(res.status).toBe(409);
  });
});

describe('OTP verification and login', () => {
  it('rejects a wrong OTP', async () => {
    await request(app).post('/api/v1/auth/register').send(APPLICANT);
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ email: APPLICANT.email, code: '000000' });
    expect(res.status).toBe(400);
  });

  it('verifies with the right OTP and returns a session', async () => {
    const { accessToken, cookie } = await registerAndVerify();
    expect(accessToken).toBeTruthy();
    expect(String(cookie)).toContain('cams_refresh');
    expect(String(cookie)).toContain('HttpOnly');
  });

  it('blocks login until the email is verified', async () => {
    await request(app).post('/api/v1/auth/register').send(APPLICANT);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: APPLICANT.email, password: APPLICANT.password });
    expect(res.status).toBe(403);
    expect(res.body.errors[0].message).toBe('VERIFY_REQUIRED');
  });

  it('rejects a wrong password with 401', async () => {
    await registerAndVerify();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: APPLICANT.email, password: 'Wrong@12345' });
    expect(res.status).toBe(401);
  });
});

describe('protected routes fail closed', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a malformed token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns 403 when the role is wrong', async () => {
    const { accessToken } = await registerAndVerify();
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: 'X1', name: 'Test course', department: 'X', degreeLevel: 'UG', durationYears: 3, totalSeats: 10 });
    expect(res.status).toBe(403);
  });

  it('lets an admin through the same route', async () => {
    const token = await makeStaff(ROLES.ADMIN);
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'X1', name: 'Test course', department: 'X', degreeLevel: 'UG', durationYears: 3, totalSeats: 10 });
    expect(res.status).toBe(201);
  });

  it('ignores a role sent by the client', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...APPLICANT, role: ROLES.ADMIN });
    expect(res.status).toBe(201);
    const user = await User.findOne({ email: APPLICANT.email });
    expect(user.role).toBe(ROLES.APPLICANT);
  });
});

describe('refresh and logout', () => {
  it('issues a new access token from the refresh cookie', async () => {
    const { cookie } = await registerAndVerify();
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rejects a refresh with no cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('invalidates the refresh token on logout', async () => {
    const { cookie } = await registerAndVerify();
    await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(401);
  });

  it('accepts a just-rotated token inside the grace window', async () => {
    const { cookie } = await registerAndVerify();
    const [first, second] = await Promise.all([
      request(app).post('/api/v1/auth/refresh').set('Cookie', cookie),
      request(app).post('/api/v1/auth/refresh').set('Cookie', cookie),
    ]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });
});
