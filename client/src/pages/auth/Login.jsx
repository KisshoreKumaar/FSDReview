import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiMessage } from '../../api/client.js';
import { ROLES } from '../../constants/roles.js';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO = [
  { label: 'Administrator', email: 'admin@college.test', password: 'Admin@12345' },
  { label: 'Verification officer', email: 'officer@college.test', password: 'Officer@12345' },
  { label: 'Applicant', email: 'aarav.verma0@example.com', password: 'Applicant@123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      const fallback = user.role === ROLES.APPLICANT ? '/app' : '/admin';
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      const needsVerify = err?.response?.data?.errors?.[0]?.message === 'VERIFY_REQUIRED';
      if (needsVerify) {
        toast.error('Verify your email first');
        navigate('/verify-otp', { state: { email: values.email } });
        return;
      }
      toast.error(apiMessage(err, 'Could not sign you in'));
    }
  };

  const fill = (demo) => {
    setValue('email', demo.email);
    setValue('password', demo.password);
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your registered email to continue."
      footer={
        <p>
          New applicant?{' '}
          <Link className="font-medium text-brand-700 hover:underline" to="/register">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Email" type="email" autoComplete="email" required {...register('email')} error={errors.email?.message} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          {...register('password')}
          error={errors.password?.message}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-3">
        <p className="text-xs font-medium text-slate-500">Demo accounts — click to fill</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <Button key={d.email} size="sm" variant="secondary" onClick={() => fill(d)}>
              {d.label}
            </Button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
