import { describe, expect, it } from 'vitest';
import { computeMeritScore, rankApplications, subjectAverage } from '../src/services/merit.js';

const course = {
  totalSeats: 2,
  eligibility: { requiredSubjects: ['Mathematics', 'Physics'] },
  cutOff: { general: 70, obc: 65, sc: 60, st: 55 },
};

const applicant = (over = {}) => ({
  _id: over.id || 'a1',
  applicationNo: over.applicationNo || 'ADM2026000001',
  applicant: { name: over.name || 'Aarav Sharma' },
  personal: { category: over.category || 'GENERAL', dob: over.dob || '2007-05-01' },
  academics: {
    percentage: over.percentage ?? 90,
    subjects: over.subjects || [
      { name: 'Mathematics', maxMarks: 100, obtained: 90 },
      { name: 'Physics', maxMarks: 100, obtained: 80 },
      { name: 'English', maxMarks: 100, obtained: 60 },
    ],
  },
  submittedAt: over.submittedAt || '2026-06-01T10:00:00.000Z',
});

describe('subjectAverage', () => {
  it('averages only the course-required subjects', () => {
    expect(subjectAverage(applicant().academics.subjects, ['Mathematics', 'Physics'])).toBe(85);
  });

  it('falls back to every subject when none of the required ones are present', () => {
    expect(subjectAverage(applicant().academics.subjects, ['Biology'])).toBeCloseTo(76.67, 1);
  });

  it('returns 0 for an empty mark sheet', () => {
    expect(subjectAverage([], ['Mathematics'])).toBe(0);
  });
});

describe('computeMeritScore', () => {
  it('weights academics 80% and the subject bonus 20%', () => {
    const score = computeMeritScore({
      percentage: 90,
      subjects: applicant().academics.subjects,
      requiredSubjects: ['Mathematics', 'Physics'],
    });
    expect(score).toBe(Number((90 * 0.8 + 85 * 0.2).toFixed(2)));
  });
});

describe('rankApplications', () => {
  it('excludes applicants below their category cut-off before ranking', () => {
    const result = rankApplications(
      [
        applicant({ id: 'a1', percentage: 92 }),
        applicant({ id: 'a2', percentage: 61, category: 'GENERAL' }),
        applicant({ id: 'a3', percentage: 61, category: 'SC' }),
      ],
      course,
    );
    expect(result.excludedCount).toBe(1);
    expect(result.entries.map((e) => String(e.application))).toEqual(['a1', 'a3']);
  });

  it('allots seats top-down and stops at totalSeats', () => {
    const result = rankApplications(
      [
        applicant({ id: 'a1', percentage: 95 }),
        applicant({ id: 'a2', percentage: 90 }),
        applicant({ id: 'a3', percentage: 85 }),
      ],
      course,
    );
    expect(result.entries.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(result.entries.map((e) => e.allotted)).toEqual([true, true, false]);
    expect(result.seatsAllotted).toBe(2);
  });

  it('breaks ties on required-subject average, then submission time, then date of birth', () => {
    const strongSubjects = [
      { name: 'Mathematics', maxMarks: 100, obtained: 95 },
      { name: 'Physics', maxMarks: 100, obtained: 95 },
      { name: 'English', maxMarks: 100, obtained: 50 },
    ];
    const weakSubjects = [
      { name: 'Mathematics', maxMarks: 100, obtained: 70 },
      { name: 'Physics', maxMarks: 100, obtained: 70 },
      { name: 'English', maxMarks: 100, obtained: 100 },
    ];

    const result = rankApplications(
      [
        applicant({ id: 'weak', percentage: 80, subjects: weakSubjects }),
        applicant({ id: 'strong', percentage: 80, subjects: strongSubjects }),
      ],
      course,
    );
    expect(String(result.entries[0].application)).toBe('strong');
  });

  it('prefers the earlier submission when scores and subject averages match', () => {
    const result = rankApplications(
      [
        applicant({ id: 'late', submittedAt: '2026-06-10T10:00:00.000Z' }),
        applicant({ id: 'early', submittedAt: '2026-06-02T10:00:00.000Z' }),
      ],
      course,
    );
    expect(String(result.entries[0].application)).toBe('early');
  });

  it('returns an empty ranking when nobody clears the cut-off', () => {
    const result = rankApplications([applicant({ percentage: 10 })], course);
    expect(result.entries).toHaveLength(0);
    expect(result.excludedCount).toBe(1);
  });
});
