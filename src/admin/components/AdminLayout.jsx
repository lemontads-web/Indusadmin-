import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Package, FolderTree, Trash2, LogOut, ExternalLink, Eye } from 'lucide-react';
import { useAdminAuth, canEditContent } from '../authContext';
import { MUTED } from './ui';
import finalLogo from '../../assets/Final logo.png';

const ROLE_LABEL = { owner: 'Owner', editor: 'Editor', sales: 'Sales' };

export default function AdminLayout() {
  const { user, role, signOut, preview } = useAdminAuth();
  const { pathname } = useLocation();
  const editor = canEditContent(role);
  // The product form has its own save bar at the bottom of the phone screen
  const onEditPage = /^\/admin\/products\/(new|[^/]+)$/.test(pathname);

  const links = [
    { to: '/admin', label: 'Home', Icon: Home, end: true, show: true },
    { to: '/admin/products', label: 'Products', Icon: Package, show: editor },
    { to: '/admin/categories', label: 'Categories', Icon: FolderTree, show: editor },
    { to: '/admin/trash', label: 'Trash', Icon: Trash2, show: editor },
  ].filter((l) => l.show);

  return (
    <div className="admin-ui min-h-screen bg-[#f6f6f6]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] bg-white px-4 py-3 border border-accent">
        Skip to main content
      </a>

      {preview && (
        <div className="bg-primary text-white text-[14px] px-4 py-2 flex items-center gap-2 justify-center text-center">
          <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
          Design preview (this computer only) — you can look around, but nothing can be saved. Sign out to leave.
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white border-b border-black/10">
        <div className="h-[3px] bg-accent" />
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
          <Link to="/admin" className="flex items-center gap-3 min-h-11">
            <img src={finalLogo} alt="Indus Heaters — admin home" className="h-7 sm:h-9 w-auto max-w-[150px] sm:max-w-none object-contain" />
            <span className="hidden sm:inline text-[14px] font-heading text-accent border-l border-black/15 pl-3">Admin</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 min-h-11 px-3 text-[15px] hover:text-accent">
              View website <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <span className={`hidden lg:inline text-[14px] ${MUTED} px-2`}>{user?.email} · {ROLE_LABEL[role]}</span>
            <button type="button" onClick={signOut}
              className="inline-flex items-center gap-2 min-h-11 px-3 text-[15px] whitespace-nowrap border border-[#8a8a8a] hover:border-accent hover:text-accent">
              <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop / tablet: side menu */}
        <nav aria-label="Admin sections" className="hidden md:block w-60 shrink-0 bg-white border-r border-black/10 min-h-[calc(100vh-67px)] py-4">
          {links.map((link) => {
            const LinkIcon = link.Icon;
            return (
              <NavLink key={link.to} to={link.to} end={link.end}
                className={({ isActive }) => `flex items-center gap-3 px-5 min-h-12 text-[16px] border-l-4 transition-colors ${
                  isActive ? 'border-accent text-accent bg-accent/5 font-heading' : 'border-transparent text-primary hover:text-accent hover:bg-black/[0.03]'}`}>
                <LinkIcon className="w-5 h-5" aria-hidden="true" /> {link.label}
              </NavLink>
            );
          })}
          <p className={`mt-6 mx-5 pt-4 border-t border-black/10 text-[14px] ${MUTED}`}>
            Banners, photo library and enquiries are coming next.
          </p>
        </nav>

        <main id="admin-main" tabIndex={-1} className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-6xl focus:outline-none ${onEditPage ? 'pb-32' : 'pb-28 md:pb-8'}`}>
          <Outlet />
        </main>
      </div>

      {/* Phone: bottom tab bar with words, always in thumb reach */}
      {!onEditPage && (
        <nav aria-label="Admin sections" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-black/15 grid"
          style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
          {links.map((link) => {
            const LinkIcon = link.Icon;
            return (
              <NavLink key={link.to} to={link.to} end={link.end}
                className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-h-16 text-[13px] border-t-[3px] ${
                  isActive ? 'border-accent text-accent font-heading' : 'border-transparent text-primary'}`}>
                <LinkIcon className="w-5 h-5" aria-hidden="true" /> {link.label}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
