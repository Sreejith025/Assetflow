import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { FiPackage, FiUsers, FiBox } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const DepartmentAssets = () => {
  const { user } = useContext(AuthContext);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeptAssets = async () => {
    setLoading(true);
    try {
      // Get all allocations; backend filters by department head's scope via JWT
      const res = await axios.get(`${API_URL}/allocations`, {
        params: { status: 'Allocated', limit: 100 },
      });
      setAllocations(res.data.data || []);
    } catch {
      toast.error('Failed to load department assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeptAssets(); }, []);

  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FiPackage className="text-violet-500" /> Department Assets
          </h2>
          <p className="text-xs text-slate-400 mt-1">Assets currently allocated to your department members</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
          <FiBox size={13} />
          {loading ? '…' : allocations.length} Active Allocation{allocations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Allocations', value: loading ? '…' : allocations.length, icon: FiBox, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
          { label: 'Employees with Assets', value: loading ? '…' : new Set(allocations.map(a => a.allocatedTo?._id)).size, icon: FiUsers, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`flex items-center gap-3 p-4 rounded-2xl border ${s.color} bg-slate-900/30`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-lg font-black text-slate-100">{s.value}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/60 overflow-hidden bg-slate-900/30">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading…</div>
        ) : allocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm gap-2">
            <FiPackage size={28} className="text-slate-700" />
            <span>No assets allocated to your department.</span>
          </div>
        ) : (
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/20 text-[10px] text-slate-500 uppercase tracking-widest">
                <th className="py-3.5 px-6 text-left">Asset Tag</th>
                <th className="py-3.5 px-6 text-left">Model</th>
                <th className="py-3.5 px-6 text-left">Allocated To</th>
                <th className="py-3.5 px-6 text-left">Expected Return</th>
                <th className="py-3.5 px-6 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((alloc, i) => (
                <tr key={alloc._id} className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${i % 2 === 0 ? 'bg-slate-900/10' : ''}`}>
                  <td className="py-3.5 px-6 font-mono font-bold text-violet-400">{alloc.asset?.assetTag || '—'}</td>
                  <td className="py-3.5 px-6 text-slate-200">{alloc.asset?.model?.name || '—'}</td>
                  <td className="py-3.5 px-6">
                    <p className="font-semibold text-slate-200">{alloc.allocatedTo?.fullName || '—'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{alloc.allocatedTo?.email || ''}</p>
                  </td>
                  <td className="py-3.5 px-6 text-slate-400">{fmt(alloc.expectedReturnDate)}</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      Allocated
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DepartmentAssets;
