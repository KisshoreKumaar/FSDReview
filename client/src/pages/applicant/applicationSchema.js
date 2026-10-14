import { z } from 'zod';
import { CATEGORIES } from '../../constants/documents.js';

const subjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  maxMarks: z.coerce.number().min(1, 'Max marks must be > 0'),
  obtained: z.coerce.number().min(0, 'Marks cannot be negative'),
});

export const applicationSchema = z.object({
  personal: z.object({
    fatherName: z.string().min(3, "Father's name is required"),
    motherName: z.string().optional().or(z.literal('')),
    dob: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { errorMap: () => ({ message: 'Select a gender' }) }),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Select a category' }) }),
    nationality: z.string().optional().or(z.literal('')),
  }),
  address: z.object({
    line1: z.string().min(3, 'Address line 1 is required'),
    line2: z.string().optional().or(z.literal('')),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
  }),
  academics: z.object({
    board: z.string().min(2, 'Board is required'),
    schoolName: z.string().min(3, 'School name is required'),
    yearOfPassing: z.coerce
      .number()
      .min(1990, 'Year looks too old')
      .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
    subjects: z.array(subjectSchema).min(1, 'Add at least one subject'),
  }),
  coursePreferences: z
    .array(z.object({ course: z.string().min(1), priority: z.number() }))
    .min(1, 'Choose at least one course'),
});

export const STEP_FIELDS = [['personal'], ['address'], ['academics'], ['coursePreferences'], []];

const dateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/** Maps an API application document onto the form's shape. */
export const toFormValues = (application = {}) => ({
  personal: {
    fatherName: application.personal?.fatherName || '',
    motherName: application.personal?.motherName || '',
    dob: dateInput(application.personal?.dob),
    gender: application.personal?.gender || '',
    category: application.personal?.category || '',
    nationality: application.personal?.nationality || 'Indian',
  },
  address: {
    line1: application.address?.line1 || '',
    line2: application.address?.line2 || '',
    city: application.address?.city || '',
    state: application.address?.state || '',
    pincode: application.address?.pincode || '',
  },
  academics: {
    board: application.academics?.board || '',
    schoolName: application.academics?.schoolName || '',
    yearOfPassing: application.academics?.yearOfPassing || '',
    subjects: application.academics?.subjects?.length
      ? application.academics.subjects.map((s) => ({
          name: s.name,
          maxMarks: s.maxMarks,
          obtained: s.obtained,
        }))
      : [{ name: '', maxMarks: 100, obtained: 0 }],
  },
  coursePreferences: (application.coursePreferences || []).map((p) => ({
    course: p.course?._id || p.course?.id || p.course,
    priority: p.priority,
  })),
});
