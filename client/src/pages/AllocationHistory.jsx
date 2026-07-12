import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiFileText, FiCheck, FiX, FiSearch, FiFilter, 
  FiCalendar, FiUser, FiInfo, FiTag
} from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const AllocationHistory = () => {
  const { user } = useContext(AuthContext);
  const isApprover = user?.role === 'Admin' || user?.role === 'Asset Manager';

  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Approval Modals
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const [isApproveAction, setIsApproveAction] = useState(true);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Employee Request Modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [reqAssetId, setReqAssetId] = useState('');
  const [reqReturnDate, setReqReturnDate] = useState('');
  const [reqRemarks, setReqRemarks] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);

  useEffect(() => {
    fetchAllocationsHistory();
  }, [search, statusFilter, page]);

  const fetchAllocationsHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/allocations`, {
        params: { search, status: statusFilter, page, limit }
      });
      setAllocations(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load allocation history logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApprovalModal = (alloc, approve = true) => {
    setSelectedAlloc(alloc);
    setIsApproveAction(approve);
    setApprovalRemarks('');
    setApprovalModalOpen(true);
  };

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlloc) return;

    setProcessingId(selectedAlloc._id);
    try {
      const path = isApproveAction ? 'approve' : 'reject';
      await axios.put(`${API_URL}/allocations/${selectedAlloc._id}/${path}`, {
        approvalRemarks
      });
      toast.success(isApproveAction ? 'Request approved successfully!' : 'Request rejected successfully!');
      setApprovalModalOpen(false);
      fetchAllocationsHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRequestModal = async () => {
    try {
      const res = await axios.get(`${API_URL}/assets`, { params: { status: 'Available', limit: 100 } });
      setAvailableAssets(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setReqAssetId(res.data.data[0]._id);
      }
      setReqReturnDate('');
      setReqRemarks('');
      setRequestModalOpen(true);
    } catch (err) {
      toast.error('Failed to retrieve available assets list.');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqAssetId || !reqReturnDate) {
      toast.error('Please select an asset and expected return date.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(reqReturnDate) <= today) {
      toast.error('Expected return date must be a future date.');
      return;
    }

    setReqSubmitting(true);
    try {
      const payload = {
        asset: reqAssetId,
        allocatedTo: user._id || user.id,
        expectedReturnDate: reqReturnDate,
        remarks: reqRemarks
      };
      await axios.post(`${API_URL}/allocations`, payload);
      toast.success('Allocation request submitted successfully!');
      setRequestModalOpen(false);
      fetchAllocationsHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit allocation request');
    } finally {
      setReqSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Allocated':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Returned':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-450 border-rose-500/20';
      default: // Pending Approval
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FiFileText className="text-violet-500" /> Allocation Transaction Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit log mapping historical and active device distributions</p>
        </div>

        {user?.role === 'Employee' && (
          <button
            onClick={handleOpenRequestModal}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer animate-fade-in"
          >
            Request Asset Allocation
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/20 border border-slate-850 p-4 rounded-2xl">
        <div className="relative col-span-1 sm:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
            <FiSearch size={14} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by Asset Tag, Employee, Remarks..."
            className="w-full bg-slate-950/40 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full bg-slate-950/40 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-400"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Statuses</option>
            <option value="Pending Approval" className="bg-slate-900 text-slate-200">Pending Approval</option>
            <option value="Allocated" className="bg-slate-900 text-slate-200">Allocated</option>
            <option value="Returned" className="bg-slate-900 text-slate-200">Returned</option>
            <option value="Rejected" className="bg-slate-900 text-slate-200">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
        </div>
      ) : allocations.length === 0 ? (
        <div className="glass-card rounded-2xl border border-slate-850 p-12 text-center text-slate-500">
          <FiInfo className="mx-auto mb-3 text-slate-600" size={32} />
          <p className="text-xs">No allocations recorded in history.</p>
        </div>
      ) : (
        <div className="glass-card border border-slate-850 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/40 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Asset Code</th>
                  <th className="p-4">Model Description</th>
                  <th className="p-4">Allocated To</th>
                  <th className="p-4">Expected Return</th>
                  <th className="p-4">Status</th>
                  {isApprover && <th className="p-4 text-right">Approval Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-200">
                {allocations.map((alloc) => (
                  <tr key={alloc._id} className="hover:bg-slate-900/10">
                    <td className="p-4 font-mono font-bold text-violet-400">{alloc.asset?.assetTag || '—'}</td>
                    <td className="p-4">
                      <span className="block font-semibold text-slate-100">
                        {alloc.asset?.model?.manufacturer} {alloc.asset?.model?.name}
                      </span>
                      <span className="text-[10px] text-slate-450 block font-mono">SN: {alloc.asset?.serialNumber || '—'}</span>
                    </td>
                    <td className="p-4">
                      <span className="block font-semibold text-slate-200">{alloc.allocatedTo?.fullName}</span>
                      <span className="text-[10px] text-slate-450 block">{alloc.allocatedTo?.email}</span>
                    </td>
                    <td className="p-4">
                      {alloc.status === 'Returned' ? (
                        <span className="text-slate-500 line-through">
                          {alloc.expectedReturnDate ? alloc.expectedReturnDate.split('T')[0] : '—'}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">
                          {alloc.expectedReturnDate ? alloc.expectedReturnDate.split('T')[0] : '—'}
                        </span>
                      )}
                      {alloc.actualReturnDate && (
                        <span className="block text-[10px] text-emerald-400 mt-0.5">
                          Returned: {alloc.actualReturnDate.split('T')[0]}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(alloc.status)}`}>
                        {alloc.status}
                      </span>
                    </td>
                    {isApprover && (
                      <td className="p-4 text-right flex justify-end gap-1.5 pt-4">
                        {alloc.status === 'Pending Approval' ? (
                          <>
                            <button
                              onClick={() => handleOpenApprovalModal(alloc, true)}
                              disabled={processingId === alloc._id}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded transition-all cursor-pointer"
                              title="Approve Request"
                            >
                              <FiCheck size={13} />
                            </button>
                            <button
                              onClick={() => handleOpenApprovalModal(alloc, false)}
                              disabled={processingId === alloc._id}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 rounded transition-all cursor-pointer"
                              title="Reject Request"
                            >
                              <FiX size={13} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic pr-2">Resolved</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center border-t border-slate-850 pt-4 text-xs">
          <span className="text-slate-505 text-slate-500">Total: <span className="text-slate-350 font-semibold">{totalCount}</span> logs</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => prev - 1)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 hover:bg-slate-850 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Prev
            </button>
            <span className="text-slate-400">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(prev => prev + 1)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 hover:bg-slate-850 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL: APPROVE / REJECT CONFIRMATION */}
      {approvalModalOpen && selectedAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setApprovalModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div className="p-6 border-b border-slate-850">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {isApproveAction ? (
                  <><FiCheck className="text-emerald-400" /> Approve Allocation Request</>
                ) : (
                  <><FiX className="text-rose-400" /> Reject Allocation Request</>
                )}
              </h3>
              <p className="text-xs text-slate-450 mt-1">
                Confirm your decision for asset tag {selectedAlloc.asset?.assetTag} requested by {selectedAlloc.allocatedTo?.fullName}
              </p>
            </div>

            <form onSubmit={handleApprovalSubmit} className="p-6 space-y-4">
              
              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Decision Remarks / Feedback Notes
                </label>
                <textarea
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder={isApproveAction ? "e.g. Approved for field audit research..." : "e.g. Rejected due to current inventory shortage..."}
                  className="w-full h-24 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 resize-none"
                  required={!isApproveAction} // Reject requires remarks
                />
              </div>

              <div className="border-t border-slate-850 pt-5 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setApprovalModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId !== null}
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer ${
                    isApproveAction 
                      ? 'bg-emerald-600 hover:bg-emerald-500' 
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {processingId ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EMPLOYEE REQUEST ALLOCATION */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setRequestModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div className="p-6 border-b border-slate-850">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FiTag className="text-violet-500" /> Request Asset Allocation
              </h3>
              <p className="text-xs text-slate-450 mt-1">Apply for available corporate hardware to complete your work allocations</p>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              
              {/* Asset Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Available Hardware Asset *</label>
                <select
                  value={reqAssetId}
                  onChange={(e) => setReqAssetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-300"
                  required
                >
                  {availableAssets.length === 0 ? (
                    <option value="" className="bg-slate-900 text-slate-200">No available assets found</option>
                  ) : (
                    availableAssets.map(a => (
                      <option key={a._id} value={a._id} className="bg-slate-900 text-slate-200">
                        {a.assetTag} - {a.model?.manufacturer} {a.model?.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Expected Return */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Expected Return Date *</label>
                <input
                  type="date"
                  value={reqReturnDate}
                  onChange={(e) => setReqReturnDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-300"
                  required
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Justification Remarks</label>
                <textarea
                  value={reqRemarks}
                  onChange={(e) => setReqRemarks(e.target.value)}
                  placeholder="e.g. Needed for React application testing..."
                  className="w-full h-24 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 resize-none"
                />
              </div>

              <div className="border-t border-slate-850 pt-5 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reqSubmitting || availableAssets.length === 0}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {reqSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AllocationHistory;
