import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../authContext';
import { Button, Field, Input, MUTED, Notice, Spinner } from '../components/ui';
import { friendlyError } from '../lib/api';

// Opened from the password-reset email link
export default function ResetPassword() {
  const { status, setPassword } = useAdminAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = 'Choose a new password · Indus Heaters admin'; }, []);

  if (status === 'loading') return <Spinner label="Opening your reset link…" />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (pw.length < 10) return setError('Your new password needs at least 10 characters.');
    if (pw !== pw2) return setError('The two passwords are different. Type the same password in both boxes.');
    setBusy(true);
    try {
      const { error: e } = await setPassword(pw);
      if (e) throw e;
      navigate('/admin', { replace: true });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#f6f6f6] text-primary">
      <form onSubmit={submit} noValidate className="w-full max-w-md bg-white border border-black/10 p-6 sm:p-8 space-y-5">
        <h1 className="text-[24px]">Choose a new password</h1>
        {status === 'signedOut' ? (
          <>
            <Notice type="error" title="This link no longer works">Reset links expire after a while and can only be used once. Ask for a new one from the sign-in page.</Notice>
            <Link to="/admin/login" className="inline-flex min-h-11 items-center text-[15px] underline underline-offset-4 hover:text-accent">← Back to sign in</Link>
          </>
        ) : (
          <>
            {error && <Notice type="error">{error}</Notice>}
            <Field label="New password" hint="At least 10 characters. A longer phrase is easier to remember and harder to guess.">
              <Input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </Field>
            <Field label="Type it again">
              <Input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </Field>
            <Button type="submit" loading={busy} className="w-full min-h-12 text-[16px]">Save new password</Button>
            <p className={`text-[14px] ${MUTED}`}>After saving you’ll go straight to the admin panel.</p>
          </>
        )}
      </form>
    </main>
  );
}
