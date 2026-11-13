import { useEffect, useMemo, useState } from 'react';
import { getAdminClient } from '../lib/supabase';
import { AdminAuthContext } from './authContext';

async function loadRole(client, user) {
  const { data, error } = await client.from('admin_users')
    .select('role, full_name, active').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data && data.active ? data : null;
}

// DESIGN PREVIEW — development server only (removed from real builds).
// Open /admin/login?design-preview=1 to view the screens without signing in.
// It cannot change anything: without a real login Supabase blocks every save.
const designPreview = (() => {
  if (!import.meta.env.DEV) return false;
  try {
    const param = new URLSearchParams(window.location.search).get('design-preview');
    if (param === '1') localStorage.setItem('indus-admin-design-preview', '1');
    if (param === '0') localStorage.removeItem('indus-admin-design-preview');
    return localStorage.getItem('indus-admin-design-preview') === '1';
  } catch {
    return false;
  }
})();
const PREVIEW_STATE = {
  status: 'ready', role: 'owner', name: null, recovery: false, preview: true,
  session: { user: { id: null, email: 'design preview (read-only)' } },
};

export default function AdminAuthProvider({ children }) {
  const client = getAdminClient();
  const [state, setState] = useState(designPreview
    ? PREVIEW_STATE
    : { status: 'loading', session: null, role: null, name: null, recovery: false });

  useEffect(() => {
    if (designPreview) return undefined;
    let alive = true;

    const apply = async (session, recovery = false) => {
      if (!session) {
        if (alive) setState({ status: 'signedOut', session: null, role: null, name: null, recovery: false });
        return;
      }
      try {
        const staff = await loadRole(client, session.user);
        if (!alive) return;
        setState(staff
          ? { status: 'ready', session, role: staff.role, name: staff.full_name, recovery }
          : { status: 'noAccess', session, role: null, name: null, recovery });
      } catch {
        if (alive) setState({ status: 'noAccess', session, role: null, name: null, recovery });
      }
    };

    client.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return; // handled by getSession above
      // Don't call Supabase inside this callback directly (it can deadlock); defer it.
      setTimeout(() => apply(session, event === 'PASSWORD_RECOVERY'), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo(() => ({
    ...state,
    user: state.session?.user || null,
    signIn: (email, password) => client.auth.signInWithPassword({ email, password }),
    signOut: () => {
      if (designPreview) {
        try { localStorage.removeItem('indus-admin-design-preview'); } catch { /* ignore */ }
        window.location.assign('/admin/login');
        return Promise.resolve();
      }
      return client.auth.signOut();
    },
    sendReset: (email) => client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    }),
    setPassword: (password) => client.auth.updateUser({ password }),
  }), [state, client]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
