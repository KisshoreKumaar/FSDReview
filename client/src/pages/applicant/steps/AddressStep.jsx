import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

export default function AddressStep({ register, errors }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="Address line 1"
        required
        className="sm:col-span-2"
        {...register('address.line1')}
        error={errors?.address?.line1?.message}
      />
      <Input
        label="Address line 2"
        className="sm:col-span-2"
        {...register('address.line2')}
        error={errors?.address?.line2?.message}
      />
      <Input label="City / Town" required {...register('address.city')} error={errors?.address?.city?.message} />
      <Select
        label="State"
        required
        options={STATES}
        {...register('address.state')}
        error={errors?.address?.state?.message}
      />
      <Input
        label="PIN code"
        required
        inputMode="numeric"
        maxLength={6}
        {...register('address.pincode')}
        error={errors?.address?.pincode?.message}
      />
    </div>
  );
}
