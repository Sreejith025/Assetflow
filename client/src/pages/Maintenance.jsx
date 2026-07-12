import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { FiTool, FiBox, FiAlertTriangle } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const Maintenance = () => {
  const { user } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/assets`, { params: { status: 'Maintenance', limit: 50 } });
      setAssets(res.data.data || []);
    } catch {
      toast.error('Failed to load maintenance assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaintenance(); }, []);

  const markAvailable = async (assetId) => {
    setProcessing(assetId);
    try {
      await axios.put(`${API_URL}/assets/${assetId}`, { status: 'Available' });
      toast.success('Asset marked as Available.');
      fetchMaintenance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FiTool className="text-amber-400" /> Maintenance Queue
          </h2>
          <p className="text-xs text-slate-400 mt-1">Assets currently undergoing maintenance or repair</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <FiAlertTriangle size={13} />
          {loading ? '…' : assets.length} Asset{assets.length !== 1 ? 's' : ''} in Maintenance
        </div>
      </div>

      {/* Asset grid */}
      <div className="rounded-2xl border border-slate-800/60 overflow-hidden bg-slate-900/30">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading…</div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm gap-2">
            <FiTool size={28} className="text-slate-700" />
            <span>No assets currently in maintenance.</span>
          </div>
        ) : (
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/20 text-[10px] text-slate-500 uppercase tracking-widest">
                <th className="py-3.5 px-6 text-left">Asset Tag</th>
                <th className="py-3.5 px-6 text-left">Model</th>
                <th className="py-3.5 px-6 text-left">Serial Number</th>
                <th className="py-3.5 px-6 text-left">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, i) => (
                <tr key={asset._id} className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${i % 2 === 0 ? 'bg-slate-900/10' : ''}`}>
                  <td className="py-3.5 px-6 font-mono font-bold text-amber-400">{asset.assetTag}</td>
                  <td className="py-3.5 px-6 text-slate-200">{asset.model?.name || '—'}</td>
                  <td className="py-3.5 px-6 font-mono text-slate-400">{asset.serialNumber}</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                      Maintenance
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex justify-end">
                      <button
                        onClick={() => markAvailable(asset._id)}
                        disabled={processing === asset._id}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {processing === asset._id ? 'Updating…' : 'Mark Available'}
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

export default Maintenance;
