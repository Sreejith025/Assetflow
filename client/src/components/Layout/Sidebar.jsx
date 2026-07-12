import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ROLE_MENU_CONFIG, getFallbackMenu } from '../../config/roleMenuConfig';
import { FiX, FiLogOut, FiChevronRight, FiShield } from 'react-icons/fi';

/* ─── Role badge colour map ─────────────────────────────────────────────── */
const ROLE_STYLES = {
  Admin:            { badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',  dot: 'bg-violet-400' },
  'Asset Manager':  { badge: 'bg-cyan-500/20   text-cyan-300   border-cyan-500/30',    dot: 'bg-cyan-400'   },
  'Department Head':{ badge: 'bg-amber-500/20  text-amber-300  border-amber-500/30',   dot: 'bg-amber-400'  },
  Employee:         { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400'},
  'Maintenance Team':{ badge: 'bg-orange-500/20  text-orange-300 border-orange-500/30',   dot: 'bg-orange-400' },
};

const DEFAULT_STYLE = { badge: 'bg-slate-700/50 text-slate-400 border-slate-600/40', dot: 'bg-slate-400' };

/* ─── Avatar initials helper ─────────────────────────────────────────────── */
const getInitials = (name) => {
  if (!name) return 'AF';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/* ─── Sidebar component ──────────────────────────────────────────────────── */
const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(null);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isOpen) onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* ── Derive menu from authenticated user's role ── */
  const role = user?.role;
  const menuItems = role
    ? (ROLE_MENU_CONFIG[role] ?? getFallbackMenu())
    : getFallbackMenu();

  const roleStyle = ROLE_STYLES[role] ?? DEFAULT_STYLE;

  /* ── Logout handler ── */
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setLoggingOut(false);
    }
  };

  /* ── Active path check (supports nested paths) ── */
  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* ── Mobile overlay backdrop ── */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-30 md:hidden transition-opacity"
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        id="app-sidebar"
        aria-label="Main navigation"
        className={[
          'fixed top-0 bottom-0 left-0 w-64 z-40',
          'flex flex-col h-screen shrink-0',
          'bg-slate-900 border-r border-slate-800/70',
          'transform transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:static',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* ── Brand bar ── */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/60 bg-gradient-to-r from-slate-950/40 to-slate-900/20 shrink-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group"
            aria-label="Go to dashboard"
          >
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
              <span className="text-white font-black text-sm tracking-tight">A</span>
            </div>
            <span className="font-bold text-slate-100 tracking-wide text-sm">
              Asset<span className="text-violet-400">Flow</span>
            </span>
          </Link>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 md:hidden transition-all"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* ── User identity card ── */}
        {user && (
          <div className="mx-4 mt-4 mb-1 px-3.5 py-3 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center gap-3 shrink-0">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-200 font-bold text-xs border border-slate-700/60 shrink-0 select-none">
              {getInitials(user.fullName || user.name)}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                {user.fullName || user.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}

        {/* ── Role badge ── */}
        {role && (
          <div className="px-4 pb-2 shrink-0">
            <span
              className={[
                'inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wider',
                roleStyle.badge,
              ].join(' ')}
            >
              <FiShield size={9} />
              {role.toUpperCase()}
            </span>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav
          aria-label="Sidebar navigation"
          className="flex-1 px-3 py-3 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-800"
        >
          <p className="px-3 mb-3 text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em]">
            Navigation
          </p>

          <ul className="space-y-0.5" role="list">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const hovered = hoveredPath === item.path;

              if (item.locked) {
                return (
                  <li key={item.path}>
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 cursor-not-allowed opacity-50 border border-transparent">
                      <div className="flex items-center gap-3">
                        <Icon size={15} />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[9px] bg-slate-800 text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded font-bold tracking-widest">
                        SOON
                      </span>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    id={`sidebar-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-current={active ? 'page' : undefined}
                    onMouseEnter={() => setHoveredPath(item.path)}
                    onMouseLeave={() => setHoveredPath(null)}
                    className={[
                      'group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium',
                      'transition-all duration-150 border',
                      active
                        ? 'bg-violet-600/15 text-violet-300 border-violet-500/25 font-semibold shadow-sm shadow-violet-900/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border-transparent',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon wrapper */}
                      <div
                        className={[
                          'w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150',
                          active
                            ? 'bg-violet-500/20 text-violet-400'
                            : 'text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-700/50',
                        ].join(' ')}
                      >
                        <Icon size={13} />
                      </div>
                      <span className="leading-none">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Badge */}
                      {item.badge && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/20 tracking-wider">
                          {item.badge}
                        </span>
                      )}

                      {/* Chevron */}
                      <FiChevronRight
                        size={11}
                        className={[
                          'transition-all duration-150',
                          active
                            ? 'text-violet-400 opacity-100'
                            : 'text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5',
                        ].join(' ')}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Sidebar footer: logout ── */}
        <div className="p-3 border-t border-slate-800/60 bg-slate-950/10 shrink-0">
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Log out of AssetFlow"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center transition-all group-hover:bg-red-500/10">
              <FiLogOut
                size={13}
                className={loggingOut ? 'animate-spin' : 'group-hover:text-red-400 transition-colors'}
              />
            </div>
            <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>

          <p className="text-[8.5px] text-slate-700 text-center mt-2 font-semibold tracking-widest uppercase select-none">
            AssetFlow v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
