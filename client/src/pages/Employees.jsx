import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, 
  FiUser, FiMail, FiLock, FiShield, 
  FiLayers, FiActivity, FiX, FiCheck, FiAlertCircle 
} from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Employees = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load employees and departments
  const fetchData = async () => {
    setLoading(true);
    try {
      const deptRes = await axios.get(`${API_URL}/departments`);
      if (deptRes.data && deptRes.data.success) {
        setDepartments(deptRes.data.data);
      }

      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (deptFilter) params.department = deptFilter;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.isActive = statusFilter;

      const empRes = await axios.get(`${API_URL}/employees`, { params });
      if (empRes.data && empRes.data.success) {
        setEmployees(empRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load employee directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, deptFilter, roleFilter, statusFilter]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('Employee');
    setDepartment('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFullName(emp.fullName);
    setEmail(emp.email);
    setPassword(''); // Leave password blank on edit
    setRole(emp.role);
    setDepartment(emp.department?._id || emp.department || '');
    setIsActive(emp.isActive);
    setIsModalOpen(true);
  };

  // Submit form (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || (!editingEmployee && !password)) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!editingEmployee && password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName,
        email,
        role,
        department: department || null,
        isActive
      };
      if (password) payload.password = password;

      if (editingEmployee) {
        // Update
        const res = await axios.put(`${API_URL}/employees/${editingEmployee._id}`, payload);
        if (res.data && res.data.success) {
          toast.success('Employee records updated successfully.');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        // Create
        const res = await axios.post(`${API_URL}/employees`, payload);
        if (res.data && res.data.success) {
          toast.success('New employee added successfully.');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed. Verify input parameters.');
    } finally {
      setSubmitting(false);
    }
  };

  // Direct Toggle Status
  const handleToggleStatus = async (emp) => {
    try {
      const res = await axios.put(`${API_URL}/employees/${emp._id}`, {
        isActive: !emp.isActive
      });
      if (res.data && res.data.success) {
        toast.success(`User ${!emp.isActive ? 'activated' : 'deactivated'} successfully.`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to change user status.');
    }
  };

  // Delete employee
  const handleDelete = async (empId) => {
    if (!window.confirm('Are you sure you want to permanently delete this employee? This will release their asset responsibilities and clean department links.')) {
      return;
    }

    try {
      const res = await axios.delete(`${API_URL}/employees/${empId}`);
      if (res.data && res.data.success) {
        toast.success('Employee deleted successfully.');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete employee.');
    }
  };

  // Calculate Statistics
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.isActive).length,
    inactive: employees.filter(e => !e.isActive).length,
    heads: employees.filter(e => e.role === 'Department Head').length
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'Admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Asset Manager':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'Department Head':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-indigo-600/5 border border-violet-500/15 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Platform Registry</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">Employee Directory</h2>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Manage corporate employee credentials, assign system roles, configure division boundaries, and control active portal access tokens.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Personnel', value: stats.total, color: 'text-slate-200', bg: 'bg-slate-900/30' },
          { label: 'Active Sessions', value: stats.active, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
          { label: 'Deactivated Accounts', value: stats.inactive, color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/10' },
          { label: 'Department Heads', value: stats.heads, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/10' }
        ].map((item, idx) => (
          <div key={idx} className={`p-4 rounded-xl border border-slate-800/80 ${item.bg} flex flex-col justify-center space-y-1`}>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{item.label}</span>
            <span className={`text-xl sm:text-2xl font-bold ${item.color}`}>{loading ? '...' : item.value}</span>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="glass-card rounded-2xl border border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <FiSearch size={14} />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/40 border border-slate-800 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-900/40 border border-slate-800 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-300 transition-all select-dark cursor-pointer grow md:grow-0"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900/40 border border-slate-800 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-300 transition-all select-dark cursor-pointer grow md:grow-0"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Asset Manager">Asset Manager</option>
            <option value="Department Head">Department Head</option>
            <option value="Employee">Employee</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/40 border border-slate-800 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-300 transition-all select-dark cursor-pointer grow md:grow-0"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>

          <button
            onClick={handleOpenCreate}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-violet-950/20 cursor-pointer h-[34px] grow md:grow-0 justify-center"
          >
            <FiPlus size={14} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
            <p className="text-slate-500 text-xs">Querying database registries...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FiAlertCircle size={28} className="text-slate-600 mx-auto" />
            <h4 className="text-slate-300 font-semibold text-sm">No Employees Found</h4>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">No records matched your query terms. Adjust filters or register a new employee registry block.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/15 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Employee Info</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Role Privilege</th>
                  <th className="py-3.5 px-6">Access Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {employees.map((emp) => {
                  const initials = emp.fullName ? emp.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'EM';
                  return (
                    <tr key={emp._id} className="hover:bg-slate-900/10 transition-colors">
                      {/* Avatar & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700/50`}>
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-200">{emp.fullName}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-6">
                        {emp.department ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/50 border border-slate-800 text-slate-300 font-medium text-[10px]">
                            <FiLayers size={10} className="text-slate-500" />
                            <span>{emp.department.name || emp.department}</span>
                            <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-bold font-mono">
                              {emp.department.code || 'DEPT'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium">Unassigned</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadge(emp.role)}`}>
                          {emp.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          disabled={emp._id === currentUser?.id || emp._id === currentUser?._id}
                          className={`
                            inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer
                            ${emp.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20'
                            }
                            ${(emp._id === currentUser?.id || emp._id === currentUser?._id) ? 'cursor-not-allowed opacity-50 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20' : ''}
                          `}
                          title={(emp._id === currentUser?.id || emp._id === currentUser?._id) ? "Cannot deactivate yourself" : "Click to toggle access"}
                        >
                          <span className={`w-1 h-1 rounded-full ${emp.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          <span>{emp.isActive ? 'Active' : 'Locked'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 rounded bg-slate-900/50 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-violet-400 transition-all cursor-pointer"
                            title="Edit Record"
                          >
                            <FiEdit2 size={12} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(emp._id)}
                            disabled={emp._id === currentUser?.id || emp._id === currentUser?._id}
                            className={`
                              p-1.5 rounded bg-slate-900/50 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/20 text-slate-500 hover:text-rose-400 transition-all cursor-pointer
                              ${(emp._id === currentUser?.id || emp._id === currentUser?._id) ? 'opacity-40 cursor-not-allowed hover:bg-slate-900/50 hover:text-slate-500 hover:border-slate-850' : ''}
                            `}
                            title={(emp._id === currentUser?.id || emp._id === currentUser?._id) ? "Cannot delete yourself" : "Delete Record"}
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                  <FiUser size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  {editingEmployee ? 'Edit Employee Details' : 'Register New Employee'}
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
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <FiUser size={13} />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Nolan Stark"
                    className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-250 placeholder-slate-600 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <FiMail size={13} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nolan@assetflow.com"
                    className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-250 placeholder-slate-600 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  Password {editingEmployee && <span className="text-[8px] text-slate-500 lowercase">(Leave blank to keep unchanged)</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <FiLock size={13} />
                  </div>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingEmployee ? '••••••••' : 'Minimum 6 characters'}
                    className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-250 placeholder-slate-600 transition-all"
                  />
                </div>
              </div>

              {/* Role & Department Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* System Role */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">System Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <FiShield size={13} />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      disabled={editingEmployee?._id === currentUser?.id || editingEmployee?._id === currentUser?._id}
                      className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 transition-all select-dark cursor-pointer"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Department Head">Department Head</option>
                      <option value="Asset Manager">Asset Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Department</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <FiLayers size={13} />
                    </div>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/60 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 transition-all select-dark cursor-pointer"
                    >
                      <option value="">Unassigned / None</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-850">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Active Status</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Control employee log in credentials capability.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  disabled={editingEmployee?._id === currentUser?.id || editingEmployee?._id === currentUser?._id}
                  className={`
                    w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer outline-none border border-slate-800
                    ${isActive ? 'bg-violet-600' : 'bg-slate-850'}
                    ${(editingEmployee?._id === currentUser?.id || editingEmployee?._id === currentUser?._id) ? 'opacity-40 cursor-not-allowed' : ''}
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
                    <span>{editingEmployee ? 'Save Records' : 'Create Registry'}</span>
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

export default Employees;
