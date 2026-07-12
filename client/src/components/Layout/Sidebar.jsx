import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  FiGrid, FiUsers, FiSliders, FiFileText, 
  FiBox, FiTrendingUp, FiActivity,
  FiCheckSquare, FiDollarSign, FiPlusCircle, 
  FiInbox, FiLock, FiX, FiLayers
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);

  // Render navigation lists tailored to each role
  const location = useLocation();
  const currentPath = location.pathname;

  // Render navigation lists tailored to each role
  const getRoleMenuItems = (role) => {
    switch (role) {
      case 'Admin':
        return [
          { name: 'Dashboard', icon: FiGrid, path: '/dashboard' },
          { name: 'Employee Management', icon: FiUsers, path: '/employees' },
          { name: 'Department Management', icon: FiLayers, path: '/departments' },
          { name: 'Asset Catalog', icon: FiBox, path: '/assets' },
          { name: 'System Policies', icon: FiSliders, path: '#', locked: true },
          { name: 'Audit Logs', icon: FiFileText, path: '#', locked: true }
        ];
      case 'Asset Manager':
        return [
          { name: 'Dashboard', icon: FiGrid, path: '/dashboard' },
          { name: 'Asset Catalog', icon: FiBox, path: '/assets' },
          { name: 'Procurement Flow', icon: FiTrendingUp, path: '#', locked: true },
          { name: 'Maintenance Log', icon: FiActivity, path: '#', locked: true }
        ];
      case 'Department Head':
        return [
          { name: 'Dashboard', icon: FiGrid, path: '/dashboard' },
          { name: 'Approval Requests', icon: FiCheckSquare, path: '#', locked: true },
          { name: 'Budget Allocations', icon: FiDollarSign, path: '#', locked: true },
          { name: 'Department Feed', icon: FiInbox, path: '#', locked: true }
        ];
      default: // Employee
        return [
          { name: 'Dashboard', icon: FiGrid, path: '/dashboard' },
          { name: 'My Assets', icon: FiBox, path: '#', locked: true },
          { name: 'Request Asset', icon: FiPlusCircle, path: '#', locked: true },
          { name: 'Helpdesk Tickets', icon: FiFileText, path: '#', locked: true }
        ];
    }
  };

  const menuItems = getRoleMenuItems(user?.role);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 md:hidden"
        ></div>
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 w-64 bg-slate-900 border-r border-slate-800/80 z-40
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static
        flex flex-col h-screen shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand bar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60 bg-slate-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <span className="text-white font-extrabold text-md tracking-wider">A</span>
            </div>
            <span className="font-bold text-slate-100 tracking-wider text-sm">Asset<span className="text-violet-400">Flow</span></span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 md:hidden transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Quick Identity Box */}
        <div className="p-4 mx-4 mt-6 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700/50 text-xs">
            {user?.role ? user.role.split(' ').map(w => w[0]).join('') : 'EM'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-slate-300 truncate">{user?.fullName || user?.name}</h4>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Navigation</span>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            if (item.locked) {
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border text-slate-500 cursor-not-allowed opacity-50 border-transparent"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-slate-500" />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1 scale-90">
                    <FiLock size={10} className="text-slate-500" />
                    <span className="text-[8px] bg-slate-800 text-slate-400 border border-slate-700 px-1 py-0.2 rounded font-semibold">LOCKED</span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={idx}
                to={item.path}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group border
                  ${isActive 
                    ? 'bg-violet-600/10 text-violet-400 border-violet-500/20 font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/60 text-center bg-slate-950/15">
          <p className="text-[9px] text-slate-600 font-semibold tracking-wider">ASSETFLOW v1.0.0 FOUNDATION</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
