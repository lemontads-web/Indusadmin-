import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { isSupabaseConfigured } from '../lib/supabase';
import AdminAuthProvider from './AdminAuthProvider';
import { useAdminAuth, canEditContent } from './authContext';
import AdminLayout from './components/AdminLayout';
import { Button, Notice, Spinner } from './components/ui';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProductsList from './pages/ProductsList';
import ProductEdit from './pages/ProductEdit';
import Categories from './pages/Categories';
import Trash from './pages/Trash';

// Keep the admin panel out of Google
function useNoIndex() {
  useEffect(() => {
    const tag = document.createElement('meta');
    tag.name = 'robots';
    tag.content = 'noindex, nofollow';
    document.head.appendChild(tag);
    // (each admin page sets its own tab title; restore the website's title when leaving)
    const title = document.title;
    return () => { tag.remove(); document.title = title; };
  }, []);
}

function CheckFailed() {
  const { retry, signOut } = useAdminAuth();
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#f6f6f6]">
      <div className="w-full max-w-md bg-white border border-black/10 p-6 space-y-4">
        <Notice type="error" title="We couldn’t check your account">
          This is usually a connection problem. Check your internet and try again.
        </Notice>
        <div className="flex flex-wrap gap-2">
          <Button onClick={retry}>Try again</Button>
          <Button variant="secondary" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    </main>
  );
}

function RequireStaff({ children, editorsOnly = false }) {
  const { status, role } = useAdminAuth();
  const location = useLocation();
  if (status === 'loading') return <Spinner label="Checking your login…" />;
  if (status === 'error') return <CheckFailed />;
  if (status === 'signedOut') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (status === 'noAccess') return <Navigate to="/admin/login" replace state={{ noAccess: true }} />;
  if (editorsOnly && !canEditContent(role)) return <Navigate to="/admin" replace />;
  return children;
}

// A fresh product form for each product (and for "new"), so nothing from the
// previous product — like "fill the web address from the name" — carries over.
function ProductEditRoute() {
  const { id } = useParams();
  return <ProductEdit key={id || 'new'} />;
}

function NotConfigured() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white text-primary">
      <div className="max-w-md border border-muted/15 p-6 text-sm font-normal">
        The admin panel needs the Supabase connection. Add <code>VITE_SUPABASE_URL</code> and{' '}
        <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code> and rebuild — see docs/SUPABASE_SETUP.md.
      </div>
    </div>
  );
}

export default function AdminApp() {
  useNoIndex();
  if (!isSupabaseConfigured) return <NotConfigured />;

  return (
    <AdminAuthProvider>
      <div className="admin-ui">
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route element={<RequireStaff><AdminLayout /></RequireStaff>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<RequireStaff editorsOnly><ProductsList /></RequireStaff>} />
          <Route path="products/new" element={<RequireStaff editorsOnly><ProductEditRoute /></RequireStaff>} />
          <Route path="products/:id" element={<RequireStaff editorsOnly><ProductEditRoute /></RequireStaff>} />
          <Route path="categories" element={<RequireStaff editorsOnly><Categories /></RequireStaff>} />
          <Route path="trash" element={<RequireStaff editorsOnly><Trash /></RequireStaff>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
      </div>
    </AdminAuthProvider>
  );
}
