import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiRepeat, FiPlusCircle, FiRefreshCw, FiFileText } from 'react-icons/fi';

const Allocations = () => {
  const { user } = useContext(AuthContext);
  const canAllocate = user?.role === 'Admin' || user?.role === 'Asset Manager';

  const links = [
    ...(canAllocate ? [{
      to: '/allocations/new',
      icon: FiPlusCircle,
      label: 'New Allocation',
      desc: 'Assign an available asset to an employee.',
      color: 'from-violet-600/20 to-indigo-600/10 border-violet-500/20 text-violet-400',
    }] : []),
    {
      to: '/allocations/active',
      icon: FiRefreshCw,
      label: 'Active Allocations',
      desc: 'View and manage currently allocated assets.',
      color: 'from-cyan-600/20 to-sky-600/10 border-cyan-500/20 text-cyan-400',
    },
    {
      to: '/allocations/history',
      icon: FiFileText,
      label: 'Allocation History',
      desc: 'Full audit log of all past and present allocations.',
      color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/20 text-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FiRepeat className="text-violet-500" /> Allocations
        </h2>
        <p className="text-xs text-slate-400 mt-1">Manage the full lifecycle of asset allocations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`group flex flex-col gap-4 p-5 rounded-2xl border bg-gradient-to-br transition-all hover:scale-[1.02] hover:shadow-lg ${l.color}`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900/60 flex items-center justify-center">
                <Icon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">{l.label}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{l.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Allocations;
