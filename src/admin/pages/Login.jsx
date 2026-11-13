import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../authContext';
import { Button, Field, Input, MUTED, Notice } from '../components/ui';
import { friendlyError } from '../lib/api';
import finalLogo from '../../assets/Final logo.png';

export default function Login() {
  const { status, signIn, signOut, sendReset } = useAdminAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'

  useEffect(() => {
    document.title = `${mode === 'login' ? 'Sign in' : 'Reset password'} · Indus Heaters admin`;
  }, [mode]);

  // Home opens by itself once the account check finishes (see `status` below)
  if (status === 'ready') return <Navigate to={location.state?.from || '/admin'} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError(''); setInfo('');
    if (!email.trim()) return setError('Enter your email address.');
    if (mode === 'login' && !password) return setError('Enter your password.');
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error: e } = await sendReset(email.trim());
        if (e) throw e;
        setInfo('If this email belongs to an admin, we’ve sent a link to choose a new password. It can take a minute — check your spam folder too.');
      } else {
        const { error: e } = await signIn(email.trim(), password);
        if (e) throw new Error(/invalid login/i.test(e.message) ? 'That email and password don’t match. Check for typing mistakes, or use “Forgot your password?”.' : e.message);
        return; // stay "busy" until the account check finishes and Home opens
      }
      setBusy(false);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#f6f6f6] text-primary">
      <form onSubmit={submit} noValidate className="w-full max-w-md bg-white border border-black/10">
        <div className="h-[3px] bg-accent" />
        <div className="p-6 sm:p-8 space-y-5">
          <div className="text-center space-y-3 pb-1">
            <img src={finalLogo} alt="Indus Heaters" className="h-10 w-auto mx-auto" />
            <h1 className="text-[24px]">{mode === 'login' ? 'Sign in to manage your website' : 'Forgot your password?'}</h1>
            {mode === 'forgot' && <p className={`text-[15px] ${MUTED}`}>Enter your email and we’ll send you a link to choose a new one.</p>}
          </div>

          {status === 'error' && (
            <Notice type="error" title="We couldn’t check your account">This is usually a connection problem. Please try signing in again.</Notice>
          )}
          {(status === 'noAccess' || location.state?.noAccess) && (
            <Notice type="error" title="This account can’t open the admin panel">
              It isn’t set up as staff. <button type="button" className="underline underline-offset-2 min-h-11" onClick={signOut}>Sign out</button> and use an admin account, or ask the owner to add you.
            </Notice>
          )}
          {error && <Notice type="error">{error}</Notice>}
          {info && <Notice type="success">{info}</Notice>}

          <Field label="Email address">
            <Input type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>

          {mode === 'login' && (
            <Field label="Password" htmlFor="admin-password">
              <div className="flex">
                <Input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword((s) => !s)}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 border border-l-0 border-[#8a8a8a] text-[14px] hover:text-accent shrink-0"
                  aria-pressed={showPassword}>
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>
          )}

          {/* stops spinning if the account check ends in an error */}
          <Button type="submit" loading={busy && status !== 'noAccess' && status !== 'error'} className="w-full min-h-12 text-[16px]">
            {mode === 'login' ? 'Sign in' : 'Send me a reset link'}
          </Button>
          <button
            type="button"
            className="block w-full min-h-11 text-center text-[15px] underline underline-offset-4 hover:text-accent"
            onClick={() => { setMode(mode === 'login' ? 'forgot' : 'login'); setError(''); setInfo(''); }}
          >
            {mode === 'login' ? 'Forgot your password?' : '← Back to sign in'}
          </button>
        </div>
      </form>
    </main>
  );
}
