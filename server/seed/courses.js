import { Course } from '../src/models/Course.js';
import { env } from '../src/config/env.js';

const COURSES = [
  {
    code: 'BTCSE',
    name: 'B.Tech Computer Science and Engineering',
    department: 'Computer Science',
    degreeLevel: 'UG',
    durationYears: 4,
    totalSeats: 120,
    eligibility: { minPercentage: 60, requiredSubjects: ['Mathematics', 'Physics', 'Chemistry'] },
    cutOff: { general: 78, obc: 73, sc: 66, st: 62 },
  },
  {
    code: 'BTECE',
    name: 'B.Tech Electronics and Communication Engineering',
    department: 'Electronics',
    degreeLevel: 'UG',
    durationYears: 4,
    totalSeats: 90,
    eligibility: { minPercentage: 55, requiredSubjects: ['Mathematics', 'Physics'] },
    cutOff: { general: 74, obc: 69, sc: 62, st: 58 },
  },
  {
    code: 'BTMECH',
    name: 'B.Tech Mechanical Engineering',
    department: 'Mechanical',
    degreeLevel: 'UG',
    durationYears: 4,
    totalSeats: 60,
    eligibility: { minPercentage: 50, requiredSubjects: ['Mathematics', 'Physics'] },
    cutOff: { general: 75, obc: 70, sc: 62, st: 58 },
  },
  {
    code: 'BSCCS',
    name: 'B.Sc Computer Science',
    department: 'Computer Science',
    degreeLevel: 'UG',
    durationYears: 3,
    totalSeats: 80,
    eligibility: { minPercentage: 50, requiredSubjects: ['Mathematics', 'Computer Science'] },
    cutOff: { general: 71, obc: 66, sc: 59, st: 55 },
  },
  {
    code: 'BCOMH',
    name: 'B.Com (Honours)',
    department: 'Commerce',
    degreeLevel: 'UG',
    durationYears: 3,
    totalSeats: 100,
    eligibility: { minPercentage: 50, requiredSubjects: ['Accountancy', 'Economics'] },
    cutOff: { general: 73, obc: 68, sc: 61, st: 57 },
  },
  {
    code: 'BBA',
    name: 'Bachelor of Business Administration',
    department: 'Management',
    degreeLevel: 'UG',
    durationYears: 3,
    totalSeats: 70,
    eligibility: { minPercentage: 50, requiredSubjects: ['English', 'Economics'] },
    cutOff: { general: 72, obc: 67, sc: 60, st: 56 },
  },
  {
    code: 'BAECO',
    name: 'B.A Economics',
    department: 'Humanities',
    degreeLevel: 'UG',
    durationYears: 3,
    totalSeats: 60,
    eligibility: { minPercentage: 45, requiredSubjects: ['Economics', 'English'] },
    cutOff: { general: 70, obc: 65, sc: 58, st: 54 },
  },
  {
    code: 'MCA',
    name: 'Master of Computer Applications',
    department: 'Computer Science',
    degreeLevel: 'PG',
    durationYears: 2,
    totalSeats: 60,
    eligibility: { minPercentage: 55, requiredSubjects: ['Mathematics', 'Computer Science'] },
    cutOff: { general: 76, obc: 70, sc: 63, st: 59 },
  },
  {
    code: 'MBA',
    name: 'Master of Business Administration',
    department: 'Management',
    degreeLevel: 'PG',
    durationYears: 2,
    totalSeats: 120,
    eligibility: { minPercentage: 50, requiredSubjects: ['English', 'Economics'] },
    cutOff: { general: 74, obc: 68, sc: 61, st: 57 },
  },
  {
    code: 'MSCPHY',
    name: 'M.Sc Physics',
    department: 'Physical Sciences',
    degreeLevel: 'PG',
    durationYears: 2,
    totalSeats: 40,
    eligibility: { minPercentage: 55, requiredSubjects: ['Physics', 'Mathematics'] },
    cutOff: { general: 73, obc: 68, sc: 60, st: 56 },
  },
];

export const seedCourses = async () => {
  const docs = [];
  for (const entry of COURSES) {
    const course = await Course.findOneAndUpdate(
      { code: entry.code },
      { ...entry, admissionCycle: env.admissionCycle, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    docs.push(course);
  }
  return docs;
};

export { COURSES };
export default seedCourses;
