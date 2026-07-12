import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, 
  FiLayers, FiInfo, FiUser, FiActivity, 
  FiX, FiAlertTriangle, FiUsers, FiTag 
} from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [deptHeads, setDeptHeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [manager, setManager] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch departments and potential heads
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.isActive = statusFilter;

      const deptRes = await axios.get(`${API_URL}/departments`, { params });
      if (deptRes.data && deptRes.data.success) {
        setDepartments(deptRes.data.data);
      }

      // Fetch all employees to find users with role 'Department Head' for assignment dropdown
      const empRes = await axios.get(`${API_URL}/employees`, { params: { role: 'Department Head' } });
      if (empRes.data && empRes.data.success) {
        setDeptHeads(empRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load department registries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, statusFilter]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setManager('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setManager(dept.manager?._id || dept.manager || '');
    setIsActive(dept.isActive);
    setIsModalOpen(true);
  };

  // Submit form (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Please enter department name and code.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        code,
        description,
        manager: manager || null,
        isActive
      };

      if (editingDept) {
        // Update
        const res = await axios.put(`${API_URL}/departments/${editingDept._id}`, payload);
        if (res.data && res.data.success) {
          toast.success('Department details updated.');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        // Create
        const res = await axios.post(`${API_URL}/departments`, payload);
        if (res.data && res.data.success) {
          toast.success('Department created successfully.');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed. Verify parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete department
  const handleDelete = async (deptId) => {
    if (!window.confirm('Are you sure you want to permanently delete this department? Any employees assigned to it will be updated to "unassigned".')) {
      return;
    }

    try {
      const res = await axios.delete(`${API_URL}/departments/${deptId}`);
      if (res.data && res.data.success) {
        toast.success('Department deleted successfully.');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete department.');
    }
  };

  // Calculate stats
  const stats = {
    total: departments.length,
    managed: departments.filter(d => d.manager).length,
    active: departments.filter(d => d.isActive).length,
    employees: departments.reduce((acc, d) => acc + (d.employeeCount || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-indigo-600/5 border border-violet-500/15 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Platform Registry</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">Department Divisions</h2>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Configure administrative department nodes, code indicators, assign leadership (Department Heads), and inspect personnel allocation metrics.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Divisions', value: stats.total, color: 'text-slate-200', bg: 'bg-slate-900/30' },
          { label: 'Managed Divisions', value: stats.managed, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
          { label: 'Active Divisions', value: stats.active, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/10' },
          { label: 'Assigned Employees', value: stats.employees, color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/10' }
        ].map((item, idx) => (
          <div key={idx} className={`p-4 rounded-xl border border-slate-800/80 ${item.bg} flex flex-col justify-center space-y-1`}>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{item.label}</span>
            <span className={`text-xl sm:text-2xl font-bold ${item.color}`}>{loading ? '...' : item.value}</span>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="glass-card rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <FiSearch size={14} />
          </div>
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-800 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 transition-all"
          />
        </div>

        {/* Filters & Add */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/40 border border-slate-800 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-300 transition-all select-dark cursor-pointer grow sm:grow-0"
          >
            <option value="">All Divisions</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          <button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-violet-950/20 cursor-pointer h-[34px] grow sm:grow-0 justify-center"
          >
            <FiPlus size={14} />
            <span>Create Department</span>
          </button>
        </div>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
          <p className="text-slate-500 text-xs">Querying database registries...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="glass-card rounded-2xl border border-slate-800 py-16 text-center space-y-2">
          <FiAlertTriangle size={28} className="text-slate-600 mx-auto" />
          <h4 className="text-slate-300 font-semibold text-sm">No Departments Registered</h4>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">No corporate divisions matched your query criteria. Add a department block above to initialize.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
          {departments.map((dept) => {
            const hasManager = !!dept.manager;
            const managerInitials = hasManager ? dept.manager.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';

            return (
              <div 
                key={dept._id}
                className={`glass-card rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:scale-[1.01] hover:border-violet-500/30
                  ${dept.isActive ? 'border-slate-800' : 'border-rose-500/20 opacity-70'}
                `}
              >
                {/* Slim top accent strip */}
                <div className={`h-1.5 w-full bg-gradient-to-r 
                  ${dept.isActive 
                    ? 'from-violet-600 via-indigo-600 to-sky-600' 
                    : 'from-slate-800 via-rose-500/30 to-slate-800'
                  }
                `}></div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
                  {/* Card Header */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      {/* Code Badge */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-violet-600/10 text-violet-400 border border-violet-500/20 text-[10px] font-bold font-mono uppercase tracking-wider">
                        <FiTag size={10} />
                        <span>{dept.code}</span>
                      </span>

                      {/* Status */}
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider
                        ${dept.isActive ? 'text-emerald-400' : 'text-rose-400'}
                      `}>
                        <span className={`w-1 h-1 rounded-full ${dept.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        {dept.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 truncate group-hover:text-violet-300 transition-colors">
                      {dept.name}
                    </h3>
                    
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                      {dept.description || 'No division description provided.'}
                    </p>
                  </div>

                  {/* Manager and Employees Count Section */}
                  <div className="space-y-3.5 border-t border-slate-800/60 pt-4">
                    {/* Manager info */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Division Head</span>
                      {hasManager ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                            {managerInitials}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-200 truncate">{dept.manager.fullName}</h4>
                            <p className="text-[9px] text-slate-500 truncate font-mono">{dept.manager.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-400 text-[10px] font-medium">
                          <FiAlertTriangle size={12} className="shrink-0" />
                          <span>No Head Assigned (Vacant Role)</span>
                        </div>
                      )}
                    </div>

                    {/* Employee count badge */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 bg-slate-950/30 px-3 py-2 rounded-lg border border-slate-850">
                      <span className="flex items-center gap-1.5 font-medium">
                        <FiUsers size={12} className="text-slate-500" />
                        <span>Personnel Allocated:</span>
                      </span>
                      <span className="font-bold text-slate-200 bg-slate-800 border border-slate-700 px-1.5 py-0.2 rounded font-mono">
                        {dept.employeeCount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 border-t border-slate-800/60 bg-slate-950/20 flex justify-end gap-2.5">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-violet-400 transition-colors cursor-pointer bg-slate-900/40 hover:bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-850 hover:border-slate-700"
                  >
                    <FiEdit2 size={10} />
                    <span>Configure</span>
                  </button>
                  <button
                    onClick={() => handleDelete(dept._id)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-rose-450 transition-colors cursor-pointer bg-slate-900/40 hover:bg-rose-500/5 px-2.5 py-1.5 rounded-lg border border-slate-850 hover:border-rose-500/10"
                  >
                    <FiTrash2 size={10} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Glass Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-2xl border border-slate-800/80 p-6 sm:p-8 relative overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            {/* Background design glow */}
            <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-24 h-24 rounded-full bg-violet-600/15 blur-2xl"></div>

            {/* Title */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                  <FiLayers size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  {editingDept ? 'Configure Division Details' : 'Initialize Department Division'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Row: Name and Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Division Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Information Technology"
                    className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-250 placeholder-slate-600 transition-all"
                  />
                </div>

                {/* Code */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Division Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. IT"
                    maxLength={6}
                    className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-250 placeholder-slate-600 transition-all uppercase font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core mandates, targets, and operations of this division..."
                  rows={3}
                  className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-250 placeholder-slate-600 transition-all resize-none"
                />
              </div>

              {/* Manager assignment dropdown */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Department Head (Manager)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <FiUser size={13} />
                  </div>
                  <select
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 transition-all select-dark cursor-pointer"
                  >
                    <option value="">Unassigned (None)</option>
                    {deptHeads.map((head) => (
                      <option key={head._id} value={head._id}>{head.fullName} ({head.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-850">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Division Status</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Control whether this department is active and visible in filters.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`
                    w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer outline-none border border-slate-800
                    ${isActive ? 'bg-violet-600' : 'bg-slate-850'}
                  `}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-800 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-violet-950/20 cursor-pointer"
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                  ) : (
                    <span>{editingDept ? 'Apply Changes' : 'Initialize Division'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
