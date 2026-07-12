import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FiBarChart2, FiBox, FiUsers, FiRepeat, FiActivity } from 'react-icons/fi';

const Reports = () => {
  const { user } = useContext(AuthContext);

  const reportCards = [
    {
      title: 'Asset Inventory',
      description: 'Full asset catalogue with status breakdown and valuation summary.',
      icon: FiBox,
      color: 'from-violet-600/20 to-indigo-600/10 border-violet-500/20',
      iconColor: 'text-violet-400',
      tag: 'Coming Soon',
    },
    {
      title: 'Allocation Summary',
      description: 'Historical and active allocation data with approval timelines.',
      icon: FiRepeat,
      color: 'from-cyan-600/20 to-sky-600/10 border-cyan-500/20',
      iconColor: 'text-cyan-400',
      tag: 'Coming Soon',
    },
    {
      title: 'Employee Asset Report',
      description: 'Per-employee asset holding report with utilisation metrics.',
      icon: FiUsers,
      color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/20',
      iconColor: 'text-emerald-400',
      tag: 'Coming Soon',
    },
    {
      title: 'Activity Audit Log',
      description: 'Comprehensive audit trail of all system events and state transitions.',
      icon: FiActivity,
      color: 'from-amber-600/20 to-orange-600/10 border-amber-500/20',
      iconColor: 'text-amber-400',
      tag: 'Coming Soon',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FiBarChart2 className="text-violet-500" /> Reports &amp; Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Operational insights for <span className="text-violet-400 font-semibold">{user?.role}</span> — advanced reporting module coming soon.
        </p>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`relative rounded-2xl border bg-gradient-to-br p-5 ${card.color} group cursor-not-allowed select-none overflow-hidden`}
            >
              {/* Glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-white transition-opacity rounded-2xl pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl bg-slate-900/60 flex items-center justify-center ${card.iconColor} shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-slate-100">{card.title}</h3>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700 tracking-widest">
                      {card.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder chart area */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/20 p-10 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
          <FiBarChart2 size={24} />
        </div>
        <div>
          <h3 className="text-slate-200 font-bold text-sm">Advanced Reporting — In Development</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm">
            Interactive dashboards, exportable CSV/PDF reports and trend analytics will be available in a future release.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
