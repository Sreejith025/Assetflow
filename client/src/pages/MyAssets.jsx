import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { FiPackage, FiBox, FiCalendar, FiTag } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const MyAssets = () => {
  const { user } = useContext(AuthContext);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAssets = async () => {
    setLoading(true);
    try {
      // Employee scope: backend automatically filters to req.user._id
      const res = await axios.get(`${API_URL}/allocations`, {
        params: { status: 'Allocated', limit: 50 },
      });
      setAllocations(res.data.data || []);
    } catch {
      toast.error('Failed to load your assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyAssets(); }, []);

  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FiPackage className="text-violet-500" /> My Assets
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Assets currently allocated to you, <span className="text-violet-300 font-semibold">{user?.fullName || user?.name}</span>
        </p>
      </div>

      {/* Count chip */}
      {!loading && (
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold">
          <FiBox size={13} />
          {allocations.length} Active Asset{allocations.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading…</div>
      ) : allocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-700 border border-slate-800">
            <FiBox size={22} />
          </div>
          <p>No assets currently allocated to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allocations.map((alloc) => (
            <div key={alloc._id} className="rounded-2xl border border-slate-800/60 bg-slate-900/30 hover:bg-slate-800/30 transition-colors p-5 space-y-3">
              {/* Tag */}
              <div className="flex items-start justify-between">
                <span className="font-mono font-black text-violet-400 text-sm">{alloc.asset?.assetTag || '—'}</span>
                <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  Active
                </span>
              </div>

              {/* Model */}
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <FiBox size={13} className="text-slate-500 shrink-0" />
                <span className="font-semibold">{alloc.asset?.model?.name || 'Unknown Model'}</span>
              </div>

              {/* Category */}
              {alloc.asset?.model?.category && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FiTag size={12} className="text-slate-500 shrink-0" />
                  <span>{alloc.asset.model.category.name || alloc.asset.model.category}</span>
                </div>
              )}

              {/* Return date */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FiCalendar size={12} className="text-slate-500 shrink-0" />
                <span>Return by <span className="text-slate-300 font-semibold">{fmt(alloc.expectedReturnDate)}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAssets;
