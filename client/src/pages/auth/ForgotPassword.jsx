import { Link } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';

export default function ForgotPassword() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Password reset over email is not enabled in this demo environment."
      footer={
        <Link className="font-medium text-brand-700 hover:underline" to="/login">
          Back to sign in
        </Link>
      }
    >
      <div className="card p-5 text-sm text-slate-600">
        <p>
          Contact the admission office at <b>admissions@college.test</b> or call <b>080-4000-1234</b> and an
          administrator will reset your password after identity verification.
        </p>
      </div>
    </AuthShell>
  );
}
