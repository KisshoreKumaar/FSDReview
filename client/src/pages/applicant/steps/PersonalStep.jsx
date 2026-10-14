import { CATEGORIES } from '../../../constants/documents.js';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';

export default function PersonalStep({ register, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Father's name"
        required
        {...register('personal.fatherName')}
        error={errors?.personal?.fatherName?.message}
      />
      <Input label="Mother's name" {...register('personal.motherName')} error={errors?.personal?.motherName?.message} />
      <Input
        label="Date of birth"
        type="date"
        required
        {...register('personal.dob')}
        error={errors?.personal?.dob?.message}
      />
      <Select
        label="Gender"
        required
        options={[
          { value: 'MALE', label: 'Male' },
          { value: 'FEMALE', label: 'Female' },
          { value: 'OTHER', label: 'Other' },
        ]}
        {...register('personal.gender')}
        error={errors?.personal?.gender?.message}
      />
      <Select
        label="Category"
        required
        options={CATEGORIES}
        {...register('personal.category')}
        error={errors?.personal?.category?.message}
      />
      <Input label="Nationality" {...register('personal.nationality')} error={errors?.personal?.nationality?.message} />
    </div>
  );
}
