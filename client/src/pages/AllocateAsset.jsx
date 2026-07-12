import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiCalendar, FiUser, FiBox, FiMessageSquare } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const AllocateAsset = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [assetId, setAssetId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    setLoading(true);
    try {
      // 1. Fetch available assets
      const assetsRes = await axios.get(`${API_URL}/assets`, {
        params: { status: 'Available', limit: 100 }
      });
      setAssets(assetsRes.data.data || []);
      if (assetsRes.data.data && assetsRes.data.data.length > 0) {
        setAssetId(assetsRes.data.data[0]._id);
      }

      // 2. Fetch employees
      const employeesRes = await axios.get(`${API_URL}/employees`);
      setEmployees(employeesRes.data.data || []);
      if (employeesRes.data.data && employeesRes.data.data.length > 0) {
        setEmployeeId(employeesRes.data.data[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load assets or employees list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetId || !employeeId || !expectedReturnDate) {
      toast.error('Please select an asset, employee, and expected return date.');
      return;
    }

    // Expected return date validation (must be in the future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(expectedReturnDate);
    if (selectedDate <= today) {
      toast.error('Expected return date must be a future date.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        asset: assetId,
        allocatedTo: employeeId,
        expectedReturnDate,
        remarks
      };

      await axios.post(`${API_URL}/allocations`, payload);
      toast.success('Asset allocated successfully!');
      navigate('/allocations/active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate asset');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-60 flex items-center justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FiPlus className="text-violet-500" /> Allocate Corporate Asset
        </h2>
        <p className="text-xs text-slate-400 mt-1">Assign hardware resources directly to corporate profiles</p>
      </div>

      <div className="glass-card border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Asset Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiBox className="text-violet-400" size={12} /> Select Hardware Asset *
            </label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-300"
              required
            >
              {assets.length === 0 ? (
                <option value="">No available assets to allocate</option>
              ) : (
                assets.map((asset) => (
                  <option key={asset._id} value={asset._id}>
                    {asset.assetTag} - {asset.model?.manufacturer} {asset.model?.name} (SN: {asset.serialNumber})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Employee Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiUser className="text-violet-400" size={12} /> Select Recipient Employee *
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-350"
              required
            >
              {employees.length === 0 ? (
                <option value="">No employees found</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.email} - {emp.role})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Expected Return Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiCalendar className="text-violet-400" size={12} /> Expected Return Date *
            </label>
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-300"
              required
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiMessageSquare className="text-violet-400" size={12} /> Allocation Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Assigned to engineering project, laptop bundle included..."
              className="w-full h-28 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="border-t border-slate-850 pt-5 flex justify-end gap-3 text-xs">
            <button
              type="button"
              onClick={() => navigate('/allocations/history')}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || assets.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Allocating...' : 'Allocate Asset'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AllocateAsset;
