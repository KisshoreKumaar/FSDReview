import { User } from '../src/models/User.js';
import { ROLES } from '../src/constants/roles.js';
import { env } from '../src/config/env.js';

const staff = [
  {
    name: 'Dr. Ramesh Iyer',
    email: env.seed.adminEmail,
    phone: '9845012345',
    role: ROLES.ADMIN,
    password: env.seed.adminPassword,
  },
  {
    name: 'Sunita Deshmukh',
    email: env.seed.officerEmail,
    phone: '9823011223',
    role: ROLES.OFFICER,
    password: env.seed.officerPassword,
  },
  {
    name: 'Arvind Krishnan',
    email: 'officer2@college.test',
    phone: '9812345678',
    role: ROLES.OFFICER,
    password: env.seed.officerPassword,
  },
];

export const seedStaff = async () => {
  const docs = [];
  for (const entry of staff) {
    const user =
      (await User.findOne({ email: entry.email })) ||
      new User({ name: entry.name, email: entry.email, phone: entry.phone, role: entry.role });
    user.name = entry.name;
    user.phone = entry.phone;
    user.role = entry.role;
    user.isEmailVerified = true;
    await user.setPassword(entry.password);
    await user.save();
    docs.push(user);
  }
  return { admin: docs[0], officers: docs.slice(1) };
};

export default seedStaff;
