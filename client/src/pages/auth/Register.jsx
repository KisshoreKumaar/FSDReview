import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { registerUser } from '../../api/auth.api.js';
import { apiMessage } from '../../api/client.js';

const schema = z
  .object({
    name: z.string().min(3, 'Enter your full name').max(120),
    email: z.string().email('Enter a valid email'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Include a letter')
      .regex(/\d/, 'Include a digit'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export default function Register() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ confirmPassword, ...payload }) => {
    try {
      const data = await registerUser(payload);
      toast.success('Account created — verify your email');
      navigate('/verify-otp', { state: { email: payload.email, devOtp: data.devOtp } });
    } catch (err) {
      toast.error(apiMessage(err, 'Registration failed'));
    }
  };

  return (
    <AuthShell
      title="Create your applicant account"
      subtitle="You will receive a 6-digit code to verify your email."
      footer={
        <p>
          Already registered?{' '}
          <Link className="font-medium text-brand-700 hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Full name" required {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" required {...register('email')} error={errors.email?.message} />
        <Input
          label="Mobile number"
          inputMode="numeric"
          maxLength={10}
          required
          hint="10 digits, no country code"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Password" type="password" required {...register('password')} error={errors.password?.message} />
          <Input
            label="Confirm password"
            type="password"
            required
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
