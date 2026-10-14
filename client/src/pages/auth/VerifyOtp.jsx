import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell.jsx';
import Input from '../../components/common/Input.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { resendOtp } from '../../api/auth.api.js';
import { apiMessage } from '../../api/client.js';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export default function VerifyOtp() {
  const { completeOtp } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [devOtp, setDevOtp] = useState(state?.devOtp || '');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: state?.email || '', code: state?.devOtp || '' },
  });

  const onSubmit = async (values) => {
    try {
      await completeOtp(values);
      toast.success('Email verified');
      navigate('/app', { replace: true });
    } catch (err) {
      toast.error(apiMessage(err, 'Verification failed'));
    }
  };

  const resend = async () => {
    try {
      const data = await resendOtp(getValues('email'));
      setDevOtp(data?.devOtp || '');
      toast.success('A new code has been sent');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not resend the code'));
    }
  };

  return (
    <AuthShell title="Verify your email" subtitle="Enter the 6-digit code we emailed you.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Email" type="email" required {...register('email')} error={errors.email?.message} />
        <Input
          label="Verification code"
          inputMode="numeric"
          maxLength={6}
          required
          className="tracking-[0.4em]"
          {...register('code')}
          error={errors.code?.message}
        />
        {devOtp && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Dev mode: your code is <b>{devOtp}</b> (emails are not delivered without SMTP keys).
          </p>
        )}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Verify and continue
        </Button>
        <Button variant="ghost" className="w-full" onClick={resend}>
          Resend code
        </Button>
      </form>
    </AuthShell>
  );
}
