import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FiLogOut, FiMenu, FiBell } from 'react-icons/fi';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useContext(AuthContext);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Asset Manager':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'Department Head':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 md:hidden transition-colors"
        >
          <FiMenu size={20} />
        </button>
        <div>
          <h1 className="text-md font-semibold text-slate-100 tracking-tight">Console</h1>
          <p className="text-[10px] text-slate-500 hidden sm:block">AssetFlow Enterprise Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Decorative Notification Icon */}
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors relative">
          <FiBell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full"></span>
        </button>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-800/80"></div>

        {/* User profile and logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-200">{user?.fullName || user?.name}</p>
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 mt-0.5 rounded-full border ${getRoleBadgeClass(user?.role)}`}>
              {user?.role}
            </span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-900/20">
            {user?.fullName || user?.name ? (user.fullName || user.name).split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() : 'U'}
          </div>

          <button 
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
            title="Log Out"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
