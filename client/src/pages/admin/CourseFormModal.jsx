import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal.jsx';
import Input from '../../components/common/Input.jsx';
import Select from '../../components/common/Select.jsx';
import Button from '../../components/common/Button.jsx';
import { createCourse, updateCourse } from '../../api/course.api.js';
import { apiMessage } from '../../api/client.js';

const schema = z.object({
  code: z.string().min(2, 'Code is required').max(12),
  name: z.string().min(4, 'Name is required'),
  department: z.string().min(2, 'Department is required'),
  degreeLevel: z.enum(['UG', 'PG']),
  durationYears: z.coerce.number().min(1).max(6),
  totalSeats: z.coerce.number().min(1, 'At least one seat'),
  minPercentage: z.coerce.number().min(0).max(100),
  requiredSubjects: z.string().optional().or(z.literal('')),
});

const toForm = (course) => ({
  code: course?.code || '',
  name: course?.name || '',
  department: course?.department || '',
  degreeLevel: course?.degreeLevel || 'UG',
  durationYears: course?.durationYears || 3,
  totalSeats: course?.totalSeats || 60,
  minPercentage: course?.eligibility?.minPercentage ?? 50,
  requiredSubjects: (course?.eligibility?.requiredSubjects || []).join(', '),
});

export default function CourseFormModal({ open, course, departments = [], onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), values: toForm(course) });

  const onSubmit = async (values) => {
    const payload = {
      code: values.code.toUpperCase(),
      name: values.name,
      department: values.department,
      degreeLevel: values.degreeLevel,
      durationYears: values.durationYears,
      totalSeats: values.totalSeats,
      eligibility: {
        minPercentage: values.minPercentage,
        requiredSubjects: values.requiredSubjects
          ? values.requiredSubjects.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      },
    };
    try {
      const saved = course ? await updateCourse(course.id, payload) : await createCourse(payload);
      toast.success(course ? 'Course updated' : 'Course created');
      onSaved(saved);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save the course'));
    }
  };

  return (
    <Modal
      open={open}
      title={course ? `Edit ${course.code}` : 'New course'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            {course ? 'Save changes' : 'Create course'}
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Course code" required {...register('code')} error={errors.code?.message} />
        <Input label="Department" required list="departments" {...register('department')} error={errors.department?.message} />
        <datalist id="departments">
          {departments.map((d) => <option key={d} value={d} />)}
        </datalist>
        <Input label="Course name" required className="sm:col-span-2" {...register('name')} error={errors.name?.message} />
        <Select label="Degree level" required options={['UG', 'PG']} placeholder="" {...register('degreeLevel')} error={errors.degreeLevel?.message} />
        <Input label="Duration (years)" type="number" required {...register('durationYears')} error={errors.durationYears?.message} />
        <Input label="Total seats" type="number" required {...register('totalSeats')} error={errors.totalSeats?.message} />
        <Input label="Minimum %" type="number" step="0.01" required {...register('minPercentage')} error={errors.minPercentage?.message} />
        <Input
          label="Required subjects"
          className="sm:col-span-2"
          hint="Comma separated — used for the merit subject bonus"
          {...register('requiredSubjects')}
          error={errors.requiredSubjects?.message}
        />
      </form>
    </Modal>
  );
}
