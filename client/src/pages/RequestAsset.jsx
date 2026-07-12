import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { FiPlusCircle, FiBox, FiCalendar, FiCheck, FiMessageSquare } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const RequestAsset = () => {
  const { user } = useContext(AuthContext);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [assetId, setAssetId] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/assets`, { params: { status: 'Available', limit: 100 } });
        const list = res.data.data || [];
        setAvailableAssets(list);
        if (list.length > 0) setAssetId(list[0]._id);
      } catch {
        toast.error('Failed to load available assets.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetId || !returnDate) {
      toast.error('Please select an asset and expected return date.');
      return;
    }

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    if (new Date(returnDate) < minDate) {
      toast.error('Return date must be in the future.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/allocations`, {
        asset: assetId,
        allocatedTo: user?.id || user?._id,
        expectedReturnDate: returnDate,
        remarks,
      });
      toast.success('Asset request submitted! Awaiting approval.');
      setRemarks('');
      setReturnDate('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Minimum date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FiPlusCircle className="text-violet-500" /> Request Asset
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Submit a request to borrow an available asset — it will be reviewed by your manager.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/40">
          <h3 className="text-sm font-bold text-slate-200">New Asset Request</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">All requests are subject to manager approval.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm">Loading available assets…</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Asset selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                <FiBox size={10} className="inline mr-1" /> Select Asset *
              </label>
              {availableAssets.length === 0 ? (
                <p className="text-xs text-amber-400 font-semibold py-2">No assets currently available for allocation.</p>
              ) : (
                <select
                  id="request-asset-select"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition-colors"
                >
                  {availableAssets.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.assetTag} — {a.model?.name || 'Unknown Model'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Return date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                <FiCalendar size={10} className="inline mr-1" /> Expected Return Date *
              </label>
              <input
                id="request-asset-return-date"
                type="date"
                value={returnDate}
                min={minDateStr}
                onChange={(e) => setReturnDate(e.target.value)}
                required
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                <FiMessageSquare size={10} className="inline mr-1" /> Reason / Remarks
              </label>
              <textarea
                id="request-asset-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Briefly describe why you need this asset…"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              id="request-asset-submit"
              disabled={submitting || availableAssets.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {submitting ? (
                'Submitting…'
              ) : (
                <>
                  <FiCheck size={14} />
                  Submit Request
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-slate-800/40 bg-slate-900/20 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-400">How it works:</p>
        <ol className="list-decimal list-inside space-y-0.5 pl-1">
          <li>Select an available asset from the dropdown.</li>
          <li>Choose your expected return date.</li>
          <li>Submit — your request will go to the asset manager for approval.</li>
          <li>You'll see it in <span className="text-violet-400 font-semibold">My Allocations</span> once approved.</li>
        </ol>
      </div>
    </div>
  );
};

export default RequestAsset;
