import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  FiUser, FiUsers, FiShield, FiTrendingUp, FiLayers, 
  FiCheckCircle, FiAlertCircle, FiPlus, FiClock, FiMail
} from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const getRoleTheme = (role) => {
    switch (role) {
      case 'Admin':
        return {
          bg: 'from-rose-500/20 to-red-600/5',
          border: 'border-rose-500/20',
          text: 'text-rose-400',
          pill: 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        };
      case 'Asset Manager':
        return {
          bg: 'from-violet-500/20 to-indigo-600/5',
          border: 'border-violet-500/20',
          text: 'text-violet-400',
          pill: 'bg-violet-500/10 text-violet-300 border-violet-500/20'
        };
      case 'Department Head':
        return {
          bg: 'from-emerald-500/20 to-teal-600/5',
          border: 'border-emerald-500/20',
          text: 'text-emerald-400',
          pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        };
      default: // Employee
        return {
          bg: 'from-sky-500/20 to-blue-600/5',
          border: 'border-sky-500/20',
          text: 'text-sky-400',
          pill: 'bg-sky-500/10 text-sky-300 border-sky-500/20'
        };
    }
  };

  const theme = getRoleTheme(user?.role);

  return (
    <div className="space-y-6">
      {/* Welcome header banner */}
      <div className={`p-6 rounded-2xl bg-gradient-to-r ${theme.bg} border ${theme.border} relative overflow-hidden`}>
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-44 h-44 rounded-full bg-white/5 blur-3xl"></div>
        <div className="relative z-10 space-y-2">
          <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-widest ${theme.pill}`}>
            {user?.role} Workspace
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            Welcome back, {user?.fullName || user?.name}!
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            This console is configured for managing and allocating enterprise assets. Browse your custom dashboard panels below based on your role privileges.
          </p>
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-6 lg:col-span-1">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Session Credentials</h3>
            <p className="text-[10px] text-slate-500 mt-1">Verified via JWT Token Header Auth</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-850 text-slate-400">
                <FiUser size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Name</p>
                <p className="text-xs text-slate-200 truncate">{user?.fullName || user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-850 text-slate-400">
                <FiMail size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Email</p>
                <p className="text-xs text-slate-200 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-850 text-slate-400">
                <FiShield size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Assigned Role</p>
                <p className="text-xs text-slate-200">{user?.role}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 uppercase tracking-wider font-semibold">Connection Mode</span>
              <span className={`flex items-center gap-1.5 font-bold ${user?.isSimulated ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user?.isSimulated ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`}></span>
                {user?.isSimulated ? 'Simulated Sandbox' : 'Live Express API'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-card rounded-2xl border border-slate-800 p-6 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-850 pb-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{user?.role} Operations</h3>
              <p className="text-[10px] text-slate-500 mt-1">Platform panels loaded via access control lists (ACL)</p>
            </div>
          </div>

          {/* Admin view console */}
          {user?.role === 'Admin' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <FiShield size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">System Logs</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Monitor and inspect HTTP headers, server rejections, and DB connection configurations.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <FiUsers size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Access Control Manager</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Assign role variables, activate lock systems, and manage corporate registry access policies.</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-850 bg-slate-900/15 p-4 flex gap-3">
                <FiAlertCircle className="text-rose-400 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">Registry Note</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Database credentials are set to MONGODB_URI placeholder. Real-time collections will initialize once Mongoose establishes a secure socket link.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Asset Manager view console */}
          {user?.role === 'Asset Manager' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                    <FiLayers size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Asset Catalog</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Track global hardware lists, warranty terms, software license packages, and serial keys.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                    <FiTrendingUp size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Procurement Logs</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Audit department equipment purchase metrics, vendor details, and warehouse storage logs.</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-850 bg-slate-900/15 p-4 flex gap-3">
                <FiCheckCircle className="text-violet-400 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">Inventory Status</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Catalog sub-pages are locked. To populate catalogs, create asset models and connect mongoose controllers inside backend router links.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Department Head view console */}
          {user?.role === 'Department Head' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FiCheckCircle size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Approval Queue</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Review asset request forms submitted by your department personnel and click to authorize.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <FiLayers size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Allocated Budget</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Verify and audit cost parameters, division allotments, and review resource values.</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-850 bg-slate-900/15 p-4 flex gap-3">
                <FiClock className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">Requisition Stream</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Team request boards are locked. Requests will flow here once request endpoints are registered in Express.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Employee view console */}
          {user?.role === 'Employee' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <FiLayers size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">My Handed Assets</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Check hardware configurations, serial labels, and software licenses registered to you.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <FiPlus size={16} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Request Asset</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">Apply for laptops, docking stations, monitors, or developer licenses from the inventory list.</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-850 bg-slate-900/15 p-4 flex gap-3">
                <FiCheckCircle className="text-sky-400 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">Personal Inventory Status</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    No active assets registered. Submit a Request form to alert your Department Head and Asset Managers for item assignment.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
