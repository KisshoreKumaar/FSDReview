import { Course } from '../models/Course.js';
import { Application } from '../models/Application.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';

export const listCourses = asyncHandler(async (req, res) => {
  const { department, degreeLevel, q, includeInactive } = req.query;
  const filter = { admissionCycle: req.query.admissionCycle || env.admissionCycle };
  if (department) filter.department = department;
  if (degreeLevel) filter.degreeLevel = degreeLevel;
  if (!includeInactive) filter.isActive = true;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { code: new RegExp(q, 'i') }];

  const courses = await Course.find(filter).sort({ department: 1, name: 1 });
  const departments = await Course.distinct('department', { admissionCycle: filter.admissionCycle });
  return ok(res, { courses, departments }, 'Courses fetched');
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  return ok(res, { course }, 'Course fetched');
});

export const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create({
    ...req.body,
    admissionCycle: req.body.admissionCycle || env.admissionCycle,
  });
  return created(res, { course }, 'Course created');
});

export const updateCourse = asyncHandler(async (req, res) => {
  // seatsFilled is derived from merit publication — never accepted from a client.
  const updates = { ...req.body };
  delete updates.seatsFilled;
  const course = await Course.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!course) throw ApiError.notFound('Course not found');
  return ok(res, { course }, 'Course updated');
});

export const updateCutOff = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');

  course.cutOff = { ...course.cutOff.toObject(), ...req.body };
  await course.save();
  return ok(res, { course }, 'Cut-off updated');
});

export const deactivateCourse = asyncHandler(async (req, res) => {
  const inUse = await Application.countDocuments({ 'coursePreferences.course': req.params.id });
  const course = await Course.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!course) throw ApiError.notFound('Course not found');
  return ok(res, { course, applicationsAffected: inUse }, 'Course deactivated');
});
