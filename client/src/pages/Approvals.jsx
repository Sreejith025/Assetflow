import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { FiCheckCircle, FiXCircle, FiClock, FiCheckSquare } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const Approvals = () => {
  const { user } = useContext(AuthContext);
  const [pendingAllocations, setPendingAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/allocations`, {
        params: { status: 'Pending Approval', limit: 50 },
      });
      setPendingAllocations(res.data.data || []);
    } catch {
      toast.error('Failed to load pending approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, action) => {
    setProcessing(id);
    try {
      await axios.put(`${API_URL}/allocations/${id}/${action}`, {
        approvalRemarks: `${action === 'approve' ? 'Approved' : 'Rejected'} by ${user?.fullName || 'Department Head'}`,
      });
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setProcessing(null);
    }
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FiCheckSquare className="text-violet-500" /> Pending Approvals
          </h2>
          <p className="text-xs text-slate-400 mt-1">Asset allocation requests awaiting your review</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <FiClock size={13} />
          {loading ? '…' : pendingAllocations.length} Pending
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/60 overflow-hidden bg-slate-900/30">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading…</div>
        ) : pendingAllocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm gap-2">
            <FiCheckCircle size={28} className="text-emerald-700" />
            <span>All caught up — no pending approvals.</span>
          </div>
        ) : (
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/20 text-[10px] text-slate-500 uppercase tracking-widest">
                <th className="py-3.5 px-6 text-left">Asset</th>
                <th className="py-3.5 px-6 text-left">Requested By</th>
                <th className="py-3.5 px-6 text-left">Return Date</th>
                <th className="py-3.5 px-6 text-left">Remarks</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingAllocations.map((alloc, i) => (
                <tr key={alloc._id} className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${i % 2 === 0 ? 'bg-slate-900/10' : ''}`}>
                  <td className="py-3.5 px-6">
                    <p className="font-mono font-bold text-violet-400">{alloc.asset?.assetTag || '—'}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{alloc.asset?.model?.name || ''}</p>
                  </td>
                  <td className="py-3.5 px-6">
                    <p className="font-semibold text-slate-200">{alloc.allocatedTo?.fullName || '—'}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{alloc.allocatedTo?.email || ''}</p>
                  </td>
                  <td className="py-3.5 px-6 text-slate-400">{fmt(alloc.expectedReturnDate)}</td>
                  <td className="py-3.5 px-6 text-slate-400 max-w-xs truncate">{alloc.remarks || '—'}</td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAction(alloc._id, 'approve')}
                        disabled={processing === alloc._id}
                        className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        <FiCheckCircle size={11} /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(alloc._id, 'reject')}
                        disabled={processing === alloc._id}
                        className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all disabled:opacity-50"
                      >
                        <FiXCircle size={11} /> Reject
                      </button>
                    </div>
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

export default Approvals;
