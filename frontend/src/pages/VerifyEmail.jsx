import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Mail, ShieldCheck, ShieldX } from 'lucide-react';
import { registerUserAccount } from '../services/authService';
import { verifyEmailToken } from '../services/emailService';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Validating verification link...');

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Verification token not found in this link.');
        return;
      }

      try {
        const verifiedUser = verifyEmailToken(token);
        try {
          await registerUserAccount(
            verifiedUser.fullName,
            verifiedUser.email,
            verifiedUser.password
          );
        } catch (backendError) {
          const backendMessage = String(backendError?.message || '').toLowerCase();
          const alreadyExists =
            backendMessage.includes('already') || backendMessage.includes('exist');
          if (!alreadyExists) {
            throw backendError;
          }
        }

        setStatus('success');
        setMessage('Your email is verified successfully. You can login now.');
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Verification failed. Please request a new link.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#F8FAFC_45%,_#EEF2FF_100%)] px-4">
      <div className="w-full max-w-lg rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-blue-700" />}
          {status === 'success' && <ShieldCheck className="h-6 w-6 text-emerald-600" />}
          {status === 'error' && <ShieldX className="h-6 w-6 text-red-600" />}
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          {status === 'loading' && 'Verifying Email'}
          {status === 'success' && 'Email Verified'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className="mt-3 text-sm text-slate-600">{message}</p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Go to Login
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
          >
            Back to Register
          </Link>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
          <Mail className="h-3.5 w-3.5" />
          Check spam folder if you cannot find the verification email.
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
