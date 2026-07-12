import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FiRefreshCw, FiCornerDownLeft, FiRepeat, FiUser, 
  FiCalendar, FiMessageSquare, FiX, FiCheck, FiSearch
} from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const ReturnAsset = () => {
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');

  // Modals
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState(null);

  // Form Fields
  // Return form
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');
  
  // Transfer form
  const [transferEmployeeId, setTransferEmployeeId] = useState('');
  const [transferReturnDate, setTransferReturnDate] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchActiveAllocations();
    fetchEmployees();
  }, []);

  const fetchActiveAllocations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/allocations`, {
        params: { status: 'Allocated', limit: 100 }
      });
      setAllocations(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load active allocations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/employees`);
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Return Form
  const handleOpenReturnModal = (alloc) => {
    setSelectedAlloc(alloc);
    setActualReturnDate(new Date().toISOString().split('T')[0]);
    setReturnRemarks('');
    setReturnModalOpen(true);
  };

  // Open Transfer Form
  const handleOpenTransferModal = (alloc) => {
    setSelectedAlloc(alloc);
    setTransferEmployeeId('');
    setTransferReturnDate('');
    setTransferRemarks('');
    if (employees.length > 0) {
      // Exclude current employee from transfer choices
      const others = employees.filter(e => e._id !== alloc.allocatedTo?._id);
      if (others.length > 0) {
        setTransferEmployeeId(others[0]._id);
      }
    }
    setTransferModalOpen(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlloc) return;

    setProcessing(true);
    try {
      const payload = {
        actualReturnDate,
        remarks: returnRemarks
      };
      await axios.put(`${API_URL}/allocations/${selectedAlloc._id}/return`, payload);
      toast.success('Asset returned successfully!');
      setReturnModalOpen(false);
      fetchActiveAllocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlloc || !transferEmployeeId || !transferReturnDate) {
      toast.error('Please provide target employee and expected return date.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(transferReturnDate) <= today) {
      toast.error('Expected return date must be a future date.');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        transferTo: transferEmployeeId,
        expectedReturnDate: transferReturnDate,
        remarks: transferRemarks
      };
      await axios.put(`${API_URL}/allocations/${selectedAlloc._id}/transfer`, payload);
      toast.success('Asset transferred successfully!');
      setTransferModalOpen(false);
      fetchActiveAllocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  // Search filter matching
  const filteredAllocations = allocations.filter(alloc => {
    const term = search.toLowerCase();
    const assetTag = alloc.asset?.assetTag?.toLowerCase() || '';
    const serial = alloc.asset?.serialNumber?.toLowerCase() || '';
    const empName = alloc.allocatedTo?.fullName?.toLowerCase() || '';
    const manufacturer = alloc.asset?.model?.manufacturer?.toLowerCase() || '';
    const modelName = alloc.asset?.model?.name?.toLowerCase() || '';

    return (
      assetTag.includes(term) ||
      serial.includes(term) ||
      empName.includes(term) ||
      manufacturer.includes(term) ||
      modelName.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FiRefreshCw className="text-violet-500" /> Active Asset Allocations
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage return logs and transfers for outstanding company hardware</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md bg-slate-900/20 border border-slate-850 p-1.5 rounded-xl">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 pointer-events-none">
          <FiSearch size={14} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by Tag, Serial, Model, Employee..."
          className="w-full bg-slate-950/40 border border-transparent focus:border-violet-500/80 focus:outline-none rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200"
        />
      </div>

      {/* allocations grid */}
      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
        </div>
      ) : filteredAllocations.length === 0 ? (
        <div className="glass-card rounded-2xl border border-slate-850 p-12 text-center text-slate-500">
          <p className="text-xs">No active asset allocations match the search terms.</p>
        </div>
      ) : (
        <div className="glass-card border border-slate-850 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Asset Tag</th>
                  <th className="p-4">Manufacturer Model</th>
                  <th className="p-4">Allocated To</th>
                  <th className="p-4">Allocation Date</th>
                  <th className="p-4">Expected Return</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-200">
                {filteredAllocations.map((alloc) => (
                  <tr key={alloc._id} className="hover:bg-slate-900/10">
                    <td className="p-4 font-mono font-bold text-violet-400">{alloc.asset?.assetTag || '—'}</td>
                    <td className="p-4">
                      <span className="block font-semibold text-slate-100">
                        {alloc.asset?.model?.manufacturer} {alloc.asset?.model?.name}
                      </span>
                      <span className="text-[10px] text-slate-450 block font-mono">SN: {alloc.asset?.serialNumber}</span>
                    </td>
                    <td className="p-4">
                      <span className="block font-semibold text-slate-200">{alloc.allocatedTo?.fullName}</span>
                      <span className="text-[10px] text-slate-450 block">{alloc.allocatedTo?.email}</span>
                    </td>
                    <td className="p-4">{alloc.allocationDate ? alloc.allocationDate.split('T')[0] : '—'}</td>
                    <td className="p-4 text-amber-400">{alloc.expectedReturnDate ? alloc.expectedReturnDate.split('T')[0] : '—'}</td>
                    <td className="p-4 text-right flex justify-end gap-1.5 pt-4">
                      <button
                        onClick={() => handleOpenReturnModal(alloc)}
                        className="flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                        title="Return Asset"
                      >
                        <FiCornerDownLeft size={12} /> Return
                      </button>
                      <button
                        onClick={() => handleOpenTransferModal(alloc)}
                        className="flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[10px] font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                        title="Transfer Asset"
                      >
                        <FiRepeat size={12} /> Transfer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RETURN ASSET */}
      {returnModalOpen && selectedAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setReturnModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div className="p-6 border-b border-slate-850">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FiCornerDownLeft className="text-emerald-400" /> Return Hardware Asset
              </h3>
              <p className="text-xs text-slate-450 mt-1">Revert asset tag {selectedAlloc.asset?.assetTag} to inventory database</p>
            </div>

            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              
              {/* Return Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiCalendar className="text-violet-400" size={12} /> Actual Return Date *
                </label>
                <input
                  type="date"
                  value={actualReturnDate}
                  onChange={(e) => setActualReturnDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-300"
                  required
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiMessageSquare className="text-violet-400" size={12} /> Return Remarks / Status Details
                </label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="e.g. Asset returned in pristine condition, keys included..."
                  className="w-full h-24 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 resize-none"
                />
              </div>

              <div className="border-t border-slate-850 pt-5 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {processing ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSFER ASSET */}
      {transferModalOpen && selectedAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setTransferModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div className="p-6 border-b border-slate-850">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FiRepeat className="text-sky-400" /> Transfer Hardware Asset
              </h3>
              <p className="text-xs text-slate-450 mt-1">Reassign asset {selectedAlloc.asset?.assetTag} directly to another employee</p>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              
              {/* Target Employee Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiUser className="text-violet-400" size={12} /> Target Recipient Employee *
                </label>
                <select
                  value={transferEmployeeId}
                  onChange={(e) => setTransferEmployeeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-350"
                  required
                >
                  {employees.filter(e => e._id !== selectedAlloc.allocatedTo?._id).length === 0 ? (
                    <option value="">No other employees to select</option>
                  ) : (
                    employees
                      .filter(e => e._id !== selectedAlloc.allocatedTo?._id)
                      .map((emp) => (
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
                  value={transferReturnDate}
                  onChange={(e) => setTransferReturnDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-300"
                  required
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiMessageSquare className="text-violet-400" size={12} /> Transfer Remarks / Handover Notes
                </label>
                <textarea
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="e.g. Handed over directly from department manager, expected project end..."
                  className="w-full h-24 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 resize-none"
                />
              </div>

              <div className="border-t border-slate-850 pt-5 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !transferEmployeeId}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {processing ? 'Processing...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReturnAsset;
