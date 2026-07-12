import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiUsers, FiLayers, FiBox, FiCheckCircle, FiTool, 
  FiAlertTriangle, FiFileText, FiRefreshCw, FiDollarSign,
  FiUserPlus, FiPlusSquare, FiSend, FiClock, FiShield,
  FiCornerDownLeft, FiRepeat, FiBell, FiInfo, FiBookOpen,
  FiSearch, FiCalendar, FiMail, FiX, FiCheck, FiUser, FiMessageSquare
} from 'react-icons/fi';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, AreaChart, Area
} from 'recharts';

const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b'];
const STATUS_COLORS = {
  'Available': '#10b981',
  'Allocated': '#06b6d4',
  'Maintenance': '#f59e0b',
  'Retired': '#64748b'
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Asset Manager';
  const isDeptHead = user?.role === 'Department Head';
  const isEmployee = user?.role === 'Employee';
  const isMaintenanceTeam = user?.role === 'Maintenance Team';

  // Employee specific states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const [selectedAlloc, setSelectedAlloc] = useState(null);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  
  // Forms
  const [requestAssetId, setRequestAssetId] = useState('');
  const [requestReturnDate, setRequestReturnDate] = useState('');
  const [requestRemarks, setRequestRemarks] = useState('');
  
  const [returnRemarks, setReturnRemarks] = useState('');
  const [transferEmployeeId, setTransferEmployeeId] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');
  
  // Local simulations
  const [employees, setEmployees] = useState([]);
  const [localPendingReturns, setLocalPendingReturns] = useState([]); // list of allocation IDs
  const [localPendingTransfers, setLocalPendingTransfers] = useState([]); // list of allocation IDs
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'MacBook Pro 16" allocated to your profile.', date: '2026-07-01' },
    { id: 2, text: 'Allocation system updated.', date: '2026-07-02' }
  ]);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchAvailableAssets = async () => {
    setLoadingAssets(true);
    try {
      const res = await axios.get('http://localhost:5000/api/assets?status=Available');
      setAvailableAssets(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load available assets from server.');
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data.data || []);
    } catch (err) {
      console.warn('Failed to load employee list from server.');
    }
  };

  useEffect(() => {
    if (user?.role === 'Employee') {
      fetchAvailableAssets();
      fetchEmployees();
    }
  }, [user]);

  const handleRequestAssetSubmit = async (e) => {
    e.preventDefault();
    if (!requestAssetId || !requestReturnDate) {
      toast.error('Please select an asset and expected return date.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(requestReturnDate) <= today) {
      toast.error('Expected return date must be a future date.');
      return;
    }

    setSubmittingAction(true);
    try {
      const payload = {
        asset: requestAssetId,
        allocatedTo: user.id || user._id,
        expectedReturnDate: requestReturnDate,
        remarks: requestRemarks
      };
      const res = await axios.post('http://localhost:5000/api/allocations', payload);
      if (res.data && res.data.success) {
        toast.success('Asset request submitted successfully!');
        setShowRequestModal(false);
        // Reset form
        setRequestAssetId('');
        setRequestReturnDate('');
        setRequestRemarks('');
        
        // Add to notifications
        const selectedAssetObj = availableAssets.find(a => a._id === requestAssetId);
        const assetTag = selectedAssetObj ? selectedAssetObj.assetTag : 'New Asset';
        const modelLabel = selectedAssetObj ? `${selectedAssetObj.model?.manufacturer} ${selectedAssetObj.model?.name}` : '';
        
        const newNotif = {
          id: Date.now(),
          text: `Submitted request for asset ${assetTag} (${modelLabel}).`,
          date: new Date().toISOString().split('T')[0]
        };
        setNotifications(prev => [newNotif, ...prev]);
        
        // Refresh available assets & stats
        fetchAvailableAssets();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit asset request.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!selectedAlloc) return;
    
    // Simulate return request submission
    setLocalPendingReturns(prev => [...prev, selectedAlloc._id]);
    const newNotif = {
      id: Date.now(),
      text: `Requested return for asset tag ${selectedAlloc.asset?.assetTag || '—'}. Remarks: ${returnRemarks || 'none'}`,
      date: new Date().toISOString().split('T')[0]
    };
    setNotifications(prev => [newNotif, ...prev]);
    toast.success('Return request submitted to Department Head!');
    setShowReturnModal(false);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!selectedAlloc || !transferEmployeeId) {
      toast.error('Please select a recipient employee.');
      return;
    }
    const recipient = employees.find(emp => emp._id === transferEmployeeId);
    const recipientName = recipient ? recipient.fullName : 'another employee';
    
    // Simulate transfer request submission
    setLocalPendingTransfers(prev => [...prev, selectedAlloc._id]);
    const newNotif = {
      id: Date.now(),
      text: `Requested transfer of asset tag ${selectedAlloc.asset?.assetTag || '—'} to ${recipientName}. Remarks: ${transferRemarks || 'none'}`,
      date: new Date().toISOString().split('T')[0]
    };
    setNotifications(prev => [newNotif, ...prev]);
    toast.success(`Transfer request to ${recipientName} submitted for approval!`);
    setShowTransferModal(false);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard/stats');
      setStats(res.data.data);
    } catch (err) {
      console.warn('Backend server offline. Setting simulated sandbox stats.');
      // Offline fallback is handled inside the stats query useEffect, but let's make sure it doesn't break
    } finally {
      setLoading(false);
    }
  };

  const getRoleTheme = (role) => {
    switch (role) {
      case 'Admin':
        return {
          bg: 'from-rose-500/20 to-red-600/5',
          border: 'border-rose-500/20',
          text: 'text-rose-400',
          pill: 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        };
      case 'Asset Manager':
        return {
          bg: 'from-violet-500/20 to-indigo-600/5',
          border: 'border-violet-500/20',
          text: 'text-violet-400',
          pill: 'bg-violet-500/10 text-violet-300 border-violet-500/20'
        };
      case 'Department Head':
        return {
          bg: 'from-emerald-500/20 to-teal-600/5',
          border: 'border-emerald-500/20',
          text: 'text-emerald-400',
          pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        };
      default: // Employee
        return {
          bg: 'from-sky-500/20 to-blue-600/5',
          border: 'border-sky-500/20',
          text: 'text-sky-400',
          pill: 'bg-sky-500/10 text-sky-300 border-sky-500/20'
        };
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        console.warn('Backend server offline. Setting simulated sandbox stats.');
        if (user?.role === 'Employee') {
          setStats({
            statusCounts: {
              allocatedCount: 2,
              pendingCount: 1,
              returnedCount: 3,
              rejectedCount: 1,
              totalAssets: 3
            },
            recentAllocations: [
              {
                _id: 'mock_alloc_emp_1',
                asset: {
                  _id: 'mock_asset_001',
                  assetTag: 'AST-0001',
                  serialNumber: 'SN-APL-MBP9988',
                  status: 'Allocated',
                  cost: 2499.00,
                  purchaseDate: '2025-01-10T00:00:00.000Z',
                  warrantyDate: '2028-01-10T00:00:00.000Z',
                  vendor: 'Apple Business',
                  qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                  category: { name: 'Workstations' },
                  model: { name: 'MacBook Pro 16"', manufacturer: 'Apple', description: 'M3 Pro, 32GB RAM, 1TB SSD corporate build.' }
                },
                allocatedTo: { fullName: user.fullName || 'Demo Employee', email: user.email },
                allocationDate: '2026-07-01T09:00:00Z',
                expectedReturnDate: '2027-07-01T09:00:00Z',
                status: 'Allocated',
                remarks: 'Primary developer workstation'
              },
              {
                _id: 'mock_alloc_emp_2',
                asset: {
                  _id: 'mock_asset_002',
                  assetTag: 'AST-0002',
                  serialNumber: 'SN-LEN-T148877',
                  status: 'Available',
                  cost: 1299.00,
                  purchaseDate: '2025-02-15T00:00:00.000Z',
                  warrantyDate: '2027-02-15T00:00:00.000Z',
                  vendor: 'CDW Logistics',
                  qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                  category: { name: 'Monitors' },
                  model: { name: 'U2723QE', manufacturer: 'Dell', description: '27 inch 4K USB-C Hub Monitor' }
                },
                allocatedTo: { fullName: user.fullName || 'Demo Employee', email: user.email },
                allocationDate: '2026-07-02T10:00:00Z',
                expectedReturnDate: '2027-07-02T10:00:00Z',
                status: 'Pending Approval',
                remarks: 'External display request for office workspace'
              },
              {
                _id: 'mock_alloc_emp_3',
                asset: {
                  _id: 'mock_asset_003',
                  assetTag: 'AST-0003',
                  serialNumber: 'SN-APL-IPH7766',
                  status: 'Maintenance',
                  cost: 999.00,
                  purchaseDate: '2025-03-01T00:00:00.000Z',
                  warrantyDate: '2026-03-01T00:00:00.000Z',
                  vendor: 'Verizon Wireless',
                  qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                  category: { name: 'Mobile Devices' },
                  model: { name: 'iPhone 15 Pro', manufacturer: 'Apple', description: 'A17 Pro, 256GB storage, test bed device.' }
                },
                allocatedTo: { fullName: user.fullName || 'Demo Employee', email: user.email },
                allocationDate: '2026-06-15T09:00:00Z',
                expectedReturnDate: '2026-06-30T09:00:00Z',
                actualReturnDate: '2026-06-30T15:00:00Z',
                status: 'Returned',
                remarks: 'Temporary test phone returned on-time'
              }
            ],
            categoryDistribution: [
              { categoryName: 'Workstations', count: 1 },
              { categoryName: 'Monitors', count: 1 }
            ]
          });
        } else {
          setStats({
            statusCounts: {
              total: 24,
              available: 12,
              allocated: 8,
              maintenance: 3,
              retired: 1,
              employees: 18,
              departments: 4,
              pendingAllocations: 2,
              pendingReturns: 1,
              warrantyExpiringSoon: 4,
              deptEmployees: 6,
              deptAssets: 4,
              allocatedDeptAssets: 3,
              pendingRequests: 1
            },
            totalValue: 32490,
            recentAllocations: [
              {
                _id: '1',
                asset: { assetTag: 'AST-0001' },
                allocatedTo: { fullName: 'Jane Doe', email: 'jane@assetflow.com' },
                allocationDate: '2026-07-10T10:00:00Z',
                status: 'Allocated'
              },
              {
                _id: '2',
                asset: { assetTag: 'AST-0002' },
                allocatedTo: { fullName: 'John Smith', email: 'john@assetflow.com' },
                allocationDate: '2026-07-11T12:00:00Z',
                status: 'Allocated'
              }
            ],
            recentEmployees: [
              { _id: '1', fullName: 'Alice Johnson', email: 'alice@assetflow.com', department: { name: 'Engineering' } },
              { _id: '2', fullName: 'Bob Carter', email: 'bob@assetflow.com', department: { name: 'Operations' } }
            ],
            recentAssets: [
              { _id: '1', assetTag: 'AST-0001', category: { name: 'Workstations' }, model: { manufacturer: 'Apple', name: 'MacBook Pro 16' }, status: 'Allocated' },
              { _id: '2', assetTag: 'AST-0002', category: { name: 'Monitors' }, model: { manufacturer: 'Dell', name: 'U2723QE' }, status: 'Available' }
            ],
            categoryDistribution: [
              { categoryName: 'Workstations', count: 14 },
              { categoryName: 'Mobile Devices', count: 7 },
              { categoryName: 'Monitors', count: 3 }
            ],
            statusDistribution: [
              { name: 'Available', value: 12 },
              { name: 'Allocated', value: 8 },
              { name: 'Maintenance', value: 3 },
              { name: 'Retired', value: 1 }
            ],
            departmentDistribution: [
              { departmentName: 'Engineering', count: 5 },
              { departmentName: 'Product Management', count: 2 },
              { departmentName: 'Operations', count: 1 }
            ]
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const theme = getRoleTheme(user?.role);
  const counts = stats?.statusCounts;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome header banner */}
      <div className={`p-6 rounded-2xl bg-gradient-to-r ${theme.bg} border ${theme.border} relative overflow-hidden`}>
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-44 h-44 rounded-full bg-white/5 blur-3xl"></div>
        <div className="relative z-10 space-y-2">
          <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-widest ${theme.pill}`}>
            {user?.role} Workspace
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            Welcome back, {user?.fullName || user?.name}!
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Enterprise Asset Management Console. Browse operational stats, quick actions, distribution graphs, and transaction history.
          </p>
        </div>
      </div>

      {/* BRANCH 1: ASSET MANAGER DASHBOARD */}
      {isManager ? (
        <div className="space-y-6">
          {/* Quick Actions at Top for Asset Managers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/assets')}
              className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-4 rounded-xl shadow-md transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <FiPlusSquare size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold block">Add New Asset</span>
                  <span className="text-[10px] text-white/70 block mt-0.5">Register hardware tag</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/allocations/new')}
              className="flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg">
                  <FiSend size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold block">Allocate Asset</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Assign asset to employee</span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/allocations/active')}
              className="flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 text-slate-200">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <FiRefreshCw size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold block">Active Allocations</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Process returns or transfers</span>
                </div>
              </div>
            </button>
          </div>

          {/* Asset Manager Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Assets</span>
                <span className="text-xl font-extrabold text-slate-100">{loading ? '...' : counts?.total}</span>
              </div>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <FiBox size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Available</span>
                <span className="text-xl font-extrabold text-emerald-400">{loading ? '...' : counts?.available}</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <FiCheckCircle size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Allocated</span>
                <span className="text-xl font-extrabold text-cyan-400">{loading ? '...' : counts?.allocated}</span>
              </div>
              <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
                <FiBox size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Maintenance</span>
                <span className="text-xl font-extrabold text-amber-400">{loading ? '...' : counts?.maintenance}</span>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                <FiTool size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Retired Assets</span>
                <span className="text-xl font-extrabold text-slate-400">{loading ? '...' : counts?.retired}</span>
              </div>
              <div className="p-2.5 bg-slate-500/10 text-slate-405 rounded-lg">
                <FiAlertTriangle size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Pending Allocations</span>
                <span className="text-xl font-extrabold text-violet-400">{loading ? '...' : counts?.pendingAllocations}</span>
              </div>
              <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg">
                <FiClock size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Pending Returns</span>
                <span className="text-xl font-extrabold text-teal-400">{loading ? '...' : counts?.pendingReturns}</span>
              </div>
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-lg">
                <FiRefreshCw size={16} />
              </div>
            </div>

            <div className="glass-card border border-rose-500/20 bg-rose-500/5 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-rose-450 font-bold uppercase tracking-wider block">Warranty Expiring (30d)</span>
                <span className="text-xl font-extrabold text-rose-400">{loading ? '...' : counts?.warrantyExpiringSoon}</span>
              </div>
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/10">
                <FiAlertTriangle size={16} />
              </div>
            </div>
          </div>

          {/* Charts (Category Pie & Status Bar side-by-side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assets by Category</h3>
                <p className="text-[10px] text-slate-500 mt-1">Resource allocation by category</p>
              </div>
              <div className="h-48 w-full relative flex items-center justify-center">
                {loading ? (
                  <span className="w-6 h-6 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="categoryName"
                      >
                        {(stats?.categoryDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#f8fafc'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {!loading && stats?.categoryDistribution && (
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
                  {stats.categoryDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-slate-450">{entry.categoryName} ({entry.count})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assets by Status</h3>
                <p className="text-[10px] text-slate-500 mt-1">Allocation by physical status</p>
              </div>
              <div className="h-48 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="w-6 h-6 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.statusDistribution || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#f8fafc'
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {(stats?.statusDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8b5cf6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card border border-slate-850 p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <FiBox className="text-indigo-400" /> Recently Added Assets
              </h3>
              {loading ? (
                <p className="text-xs text-slate-500">Loading assets...</p>
              ) : (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-850/80 text-slate-500 uppercase tracking-wider font-bold">
                        <th className="pb-2">Asset Tag</th>
                        <th className="pb-2">Model</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40 text-slate-350">
                      {stats?.recentAssets?.map(a => (
                        <tr key={a._id} className="hover:bg-slate-900/10">
                          <td className="py-2.5 font-mono font-bold text-violet-400">{a.assetTag}</td>
                          <td className="py-2.5 text-slate-200">
                            {a.model?.manufacturer} {a.model?.name}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/10 bg-emerald-500/5 text-emerald-450">
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="glass-card border border-slate-850 p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <FiRefreshCw className="text-violet-400" /> Recent Allocation Activity
              </h3>
              {loading ? (
                <p className="text-xs text-slate-500">Loading activity...</p>
              ) : (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-850/80 text-slate-500 uppercase tracking-wider font-bold">
                        <th className="pb-2">Asset</th>
                        <th className="pb-2">Assigned To</th>
                        <th className="pb-2 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40 text-slate-350">
                      {stats?.recentAllocations?.map(a => (
                        <tr key={a._id} className="hover:bg-slate-900/10">
                          <td className="py-2.5 font-mono font-bold text-violet-400">{a.asset?.assetTag}</td>
                          <td className="py-2.5 text-slate-200">
                            {a.allocatedTo?.fullName}
                          </td>
                          <td className="py-2.5 text-right text-slate-500 font-mono">
                            {a.allocationDate ? a.allocationDate.split('T')[0] : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : isDeptHead ? (
        /* BRANCH 2: DEPARTMENT HEAD DASHBOARD */
        <div className="space-y-6">
          
          {/* Department Head Cards (4 cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Department Employees */}
            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Department Employees</span>
                <span className="text-xl font-extrabold text-slate-100">{loading ? '...' : counts?.deptEmployees}</span>
              </div>
              <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg">
                <FiUsers size={16} />
              </div>
            </div>

            {/* Card 2: Department Assets */}
            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Department Assets</span>
                <span className="text-xl font-extrabold text-indigo-400">{loading ? '...' : counts?.deptAssets}</span>
              </div>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <FiBox size={16} />
              </div>
            </div>

            {/* Card 3: Allocated in Department */}
            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Allocated Assets</span>
                <span className="text-xl font-extrabold text-emerald-400">{loading ? '...' : counts?.allocatedDeptAssets}</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <FiCheckCircle size={16} />
              </div>
            </div>

            {/* Card 4: Pending Requests */}
            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Pending Requests</span>
                <span className="text-xl font-extrabold text-amber-400">{loading ? '...' : counts?.pendingRequests}</span>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                <FiClock size={16} />
              </div>
            </div>

          </div>

          {/* Charts & Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Pie Chart Category split */}
            <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department Asset Split</h3>
                <p className="text-[10px] text-slate-500 mt-1">Resource allocation by inventory category</p>
              </div>

              <div className="h-48 w-full relative flex items-center justify-center">
                {loading ? (
                  <span className="w-6 h-6 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
                ) : stats?.categoryDistribution?.length === 0 ? (
                  <p className="text-xs text-slate-500">No assets allocated yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="categoryName"
                      >
                        {(stats?.categoryDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#f8fafc'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {!loading && stats?.categoryDistribution && (
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
                  {stats.categoryDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-slate-450">{entry.categoryName} ({entry.count})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Allocation History */}
            <div className="glass-card border border-slate-850 p-5 rounded-2xl lg:col-span-2 space-y-4 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <FiFileText className="text-violet-500" /> Department Allocation History
                  </h3>
                  <p className="text-[9px] text-slate-500 mt-1">Audit log matching allocations to division staff</p>
                </div>

                {/* Quick Actions Panel */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/allocations/history')}
                    className="flex items-center gap-1 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 text-[10px] font-semibold py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                  >
                    View History
                  </button>
                  <button
                    onClick={() => navigate('/allocations/active')}
                    className="flex items-center gap-1 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 text-[10px] font-semibold py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                  >
                    Active List
                  </button>
                </div>
              </div>

              {loading ? (
                <p className="text-xs text-slate-500">Loading history...</p>
              ) : stats?.recentAllocations?.length === 0 ? (
                <p className="text-xs text-slate-500">No department allocations logged</p>
              ) : (
                <div className="overflow-x-auto pt-2 flex-1">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-850/80 text-slate-500 uppercase tracking-wider font-bold">
                        <th className="pb-2">Asset</th>
                        <th className="pb-2">Employee</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40 text-slate-350">
                      {stats.recentAllocations.map(a => (
                        <tr key={a._id} className="hover:bg-slate-900/10">
                          <td className="py-2.5 font-mono font-bold text-violet-400">
                            {a.asset?.assetTag || '—'}
                          </td>
                          <td className="py-2.5">
                            <span className="block font-semibold text-slate-200">{a.allocatedTo?.fullName}</span>
                            <span className="text-[9px] text-slate-500 block">{a.allocatedTo?.email}</span>
                          </td>
                          <td className="py-2.5 text-right">
                            <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                              a.status === 'Allocated' 
                                ? 'border-sky-500/10 bg-sky-500/5 text-sky-400' 
                                : a.status === 'Returned'
                                ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400'
                                : 'border-amber-500/10 bg-amber-500/5 text-amber-400'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : isMaintenanceTeam ? (
        /* BRANCH 5: MAINTENANCE TEAM DASHBOARD */
        <div className="space-y-6">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Under Maintenance', value: loading ? '…' : (stats?.statusCounts?.underMaintenance ?? 0), icon: <FiTool size={15}/>, color: 'amber' },
              { label: 'Completed Repairs', value: loading ? '…' : (stats?.statusCounts?.completedRepairs ?? 0), icon: <FiCheckCircle size={15}/>, color: 'emerald' },
              { label: 'Pending Repairs', value: loading ? '…' : (stats?.statusCounts?.pendingRepairs ?? 0), icon: <FiClock size={15}/>, color: 'indigo' },
              { label: 'Retired Assets', value: loading ? '…' : (stats?.statusCounts?.retiredAssets ?? 0), icon: <FiAlertTriangle size={15}/>, color: 'slate' },
            ].map((card, i) => (
              <div key={i} className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{card.label}</span>
                  <span className={`text-2xl font-extrabold text-${card.color}-400`}>{card.value}</span>
                </div>
                <div className={`p-2.5 bg-${card.color}-500/10 text-${card.color}-400 rounded-lg`}>
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Maintenance Quick Actions */}
          <div className="glass-card border border-slate-850 p-4 rounded-2xl flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Quick Actions:</span>
            <button onClick={() => navigate('/maintenance')} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20 hover:bg-amber-500/25 transition-all duration-200 cursor-pointer">
              <FiTool size={13} /> Update Status
            </button>
            <button onClick={() => navigate('/maintenance')} className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg bg-slate-700/40 text-slate-300 border border-slate-600/30 hover:bg-slate-700/60 transition-all duration-200 cursor-pointer">
              <FiCheckCircle size={13} /> Resolve Repairs
            </button>
          </div>

          {/* Maintenance Trend Chart & Failure Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Maintenance Repair Trend</span>
              <div className="h-48 w-full">
                {stats?.maintenanceTrend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.maintenanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="repairs" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-500 text-xs text-center py-16">No monthly trend data recorded</div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Failures by Category</span>
              <div className="h-48 w-full relative flex items-center justify-center">
                {stats?.failureCategories?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats.failureCategories} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value" nameKey="name">
                        {stats.failureCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-550 text-xs text-center py-16">No categories in maintenance</div>
                )}
              </div>
            </div>
          </div>

          {/* Active Repair Schedule and History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card border border-slate-850 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase tracking-wide text-amber-400"><FiTool /> Active Repair Schedule</span>
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="pb-2">Asset Tag</th>
                      <th className="pb-2">Model</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-300">
                    {stats?.repairSchedule?.map(row => (
                      <tr key={row._id} className="hover:bg-slate-900/10">
                        <td className="py-2.5 font-mono font-bold text-amber-400">{row.assetTag}</td>
                        <td className="py-2.5">{row.model?.name || row.model}</td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => navigate('/maintenance')} className="px-2 py-1 bg-amber-600/10 text-amber-400 border border-amber-500/20 rounded font-bold text-[9px] cursor-pointer">Resolve</button>
                        </td>
                      </tr>
                    ))}
                    {(!stats?.repairSchedule || stats?.repairSchedule.length === 0) && (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-500 italic">No assets undergoing repair</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase tracking-wide text-emerald-400"><FiCheckCircle /> Repair History Log</span>
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="pb-2">Asset Tag</th>
                      <th className="pb-2">Model</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-300">
                    {stats?.repairHistory?.map(row => (
                      <tr key={row._id} className="hover:bg-slate-900/10">
                        <td className="py-2.5 font-mono font-bold text-slate-400">{row.assetTag}</td>
                        <td className="py-2.5">{row.model?.name || row.model}</td>
                        <td className="py-2.5 text-right">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            row.status === 'Available' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-slate-500/20 bg-slate-500/5 text-slate-400'
                          }`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                    {(!stats?.repairHistory || stats?.repairHistory.length === 0) && (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-500 italic">No historical repairs recorded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : isEmployee ? (
        /* BRANCH 3: EMPLOYEE SELF-SERVICE DASHBOARD */
        <div className="space-y-6">

          {/* ── Welcome Banner ─────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-blue-600/5 to-transparent p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 80% 50%, rgba(14,165,233,0.08) 0%, transparent 70%)'}} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-1">Welcome back</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">{user?.fullName || 'Employee'}</h2>
              <p className="text-[11px] text-slate-400 mt-1">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2 z-10">
              <button
                id="emp-request-asset-btn"
                onClick={() => { setShowRequestModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/20 hover:bg-sky-500/25 transition-all duration-200"
              >
                <FiPlusSquare size={13} /> Request Asset
              </button>
              <button
                id="emp-view-history-btn"
                onClick={() => document.getElementById('emp-history-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold rounded-lg bg-slate-700/40 text-slate-300 border border-slate-600/30 hover:bg-slate-700/60 transition-all duration-200"
              >
                <FiBookOpen size={13} /> History
              </button>
            </div>
          </div>

          {/* ── Stats Cards Row ─────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active Assets', value: loading ? '…' : (stats?.statusCounts?.allocatedCount ?? 0), icon: <FiBox size={15}/>, color: 'sky' },
              { label: 'Pending Requests', value: loading ? '…' : (stats?.statusCounts?.pendingCount ?? 0), icon: <FiClock size={15}/>, color: 'amber' },
              { label: 'Returned', value: loading ? '…' : (stats?.statusCounts?.returnedCount ?? 0), icon: <FiCornerDownLeft size={15}/>, color: 'emerald' },
              { label: 'Notifications', value: notifications.length, icon: <FiBell size={15}/>, color: 'violet' },
            ].map((card, i) => (
              <div key={i} className={`glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between`}>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{card.label}</span>
                  <span className={`text-2xl font-extrabold text-${card.color}-400`}>{card.value}</span>
                </div>
                <div className={`p-2.5 bg-${card.color}-500/10 text-${card.color}-400 rounded-lg`}>
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* ── Profile Card + Category Chart ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Profile Card */}
            <div className="glass-card border border-slate-850 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
                  {(user?.fullName || 'E')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-100 text-sm leading-tight">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-400">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2.5 text-[11px]">
                {[
                  { label: 'Role', value: user?.role || '—', icon: <FiShield size={11}/> },
                  { label: 'Active Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A', icon: <FiCalendar size={11}/> },
                  { label: 'Status', value: user?.isActive !== false ? 'Active' : 'Inactive', icon: <FiCheckCircle size={11}/> },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800/50">
                    <span className="flex items-center gap-1.5 text-slate-400">{row.icon} {row.label}</span>
                    <span className="font-semibold text-slate-200">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Chart */}
            <div className="lg:col-span-2 glass-card border border-slate-850 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">My Asset Categories</p>
              {stats?.categoryDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={stats.categoryDistribution.map(c => ({ name: c.categoryName, value: c.count }))}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={70}
                      paddingAngle={4} dataKey="value"
                    >
                      {stats.categoryDistribution.map((_, idx) => (
                        <Cell key={idx} fill={['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444'][idx % 5]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background:'rgba(15,23,42,0.95)', border:'1px solid rgba(148,163,184,0.1)', borderRadius:8, fontSize:11 }}
                      itemStyle={{ color:'#e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-500 text-sm">No category data available.</div>
              )}
              {stats?.categoryDistribution?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {stats.categoryDistribution.map((c, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444'][idx % 5] }} />
                      {c.categoryName} ({c.count})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── My Assets ────────────────────────────────────────── */}
          <div className="glass-card border border-slate-850 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">My Assets</p>
              <button
                id="emp-request-asset-btn-2"
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-1 text-[10px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                <FiPlusSquare size={12}/> Request New
              </button>
            </div>
            {loading ? (
              <div className="text-slate-500 text-sm text-center py-8">Loading assets…</div>
            ) : stats?.recentAllocations?.filter(a => a.status === 'Allocated').length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No active assets allocated to you.</div>
            ) : (
              <div className="space-y-3">
                {(stats?.recentAllocations || []).filter(a => a.status === 'Allocated').map(alloc => {
                  const isPendingReturn = localPendingReturns.includes(alloc._id);
                  const isPendingTransfer = localPendingTransfers.includes(alloc._id);
                  return (
                    <div key={alloc._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-sky-500/20 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                          <FiBox size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-200 text-sm truncate">
                            {alloc.asset?.model?.manufacturer} {alloc.asset?.model?.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{alloc.asset?.assetTag} · {alloc.asset?.serialNumber}</p>
                          <p className="text-[10px] text-slate-500">{alloc.asset?.category?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isPendingReturn && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/5 text-amber-400">Return Pending</span>
                        )}
                        {isPendingTransfer && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-violet-500/20 bg-violet-500/5 text-violet-400">Transfer Pending</span>
                        )}
                        <button
                          id={`emp-details-btn-${alloc._id}`}
                          title="View Details"
                          onClick={() => { setSelectedAlloc(alloc); setShowDetailsModal(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                        >
                          <FiInfo size={14}/>
                        </button>
                        {!isPendingReturn && !isPendingTransfer && (
                          <>
                            <button
                              id={`emp-return-btn-${alloc._id}`}
                              title="Request Return"
                              onClick={() => { setSelectedAlloc(alloc); setReturnRemarks(''); setShowReturnModal(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            >
                              <FiCornerDownLeft size={14}/>
                            </button>
                            <button
                              id={`emp-transfer-btn-${alloc._id}`}
                              title="Request Transfer"
                              onClick={() => { setSelectedAlloc(alloc); setTransferEmployeeId(''); setTransferRemarks(''); setShowTransferModal(true); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                            >
                              <FiRepeat size={14}/>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Allocation History + Notifications ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="emp-history-section">

            {/* History Table */}
            <div className="lg:col-span-2 glass-card border border-slate-850 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Allocation History</p>
              {loading ? (
                <div className="text-slate-500 text-sm text-center py-8">Loading…</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-left text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-800">
                        <th className="pb-2">Asset</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {(stats?.recentAllocations || []).map(alloc => (
                        <tr key={alloc._id} className="hover:bg-slate-900/20">
                          <td className="py-2.5">
                            <p className="font-semibold text-slate-200 font-mono">{alloc.asset?.assetTag || '—'}</p>
                            <p className="text-[9px] text-slate-500">{alloc.asset?.model?.manufacturer} {alloc.asset?.model?.name}</p>
                          </td>
                          <td className="py-2.5 text-slate-400">{alloc.asset?.category?.name || '—'}</td>
                          <td className="py-2.5 text-slate-400 font-mono">
                            {alloc.allocationDate ? alloc.allocationDate.split('T')[0] : '—'}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                              alloc.status === 'Allocated'
                                ? 'border-sky-500/20 bg-sky-500/5 text-sky-400'
                                : alloc.status === 'Returned'
                                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                                : alloc.status === 'Rejected'
                                ? 'border-red-500/20 bg-red-500/5 text-red-400'
                                : 'border-amber-500/20 bg-amber-500/5 text-amber-400'
                            }`}>
                              {alloc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(stats?.recentAllocations || []).length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-500">No allocation records.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Notifications Feed */}
            <div className="glass-card border border-slate-850 rounded-2xl p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <FiBell size={13} className="text-violet-400"/>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Notifications</p>
                {notifications.length > 0 && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-64 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-[11px] text-center py-6">No notifications yet.</p>
                ) : notifications.map(n => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/40 hover:border-violet-500/20 transition-all">
                    <p className="text-[10px] text-slate-300 leading-snug">{n.text}</p>
                    <p className="text-[9px] text-slate-600 mt-1">{n.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Asset Details Modal ──────────────────────────────── */}
          {showDetailsModal && selectedAlloc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg glass-card border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Asset Details</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedAlloc.asset?.model?.manufacturer} · {selectedAlloc.asset?.model?.name}</p>
                  </div>
                  <button id="emp-details-close" onClick={() => setShowDetailsModal(false)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                    <FiX size={16}/>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] mb-4">
                  {[
                    { label: 'Asset Tag', value: selectedAlloc.asset?.assetTag },
                    { label: 'Serial Number', value: selectedAlloc.asset?.serialNumber },
                    { label: 'Category', value: selectedAlloc.asset?.category?.name },
                    { label: 'Vendor', value: selectedAlloc.asset?.vendor },
                    { label: 'Purchase Date', value: selectedAlloc.asset?.purchaseDate ? selectedAlloc.asset.purchaseDate.split('T')[0] : '—' },
                    { label: 'Warranty Until', value: selectedAlloc.asset?.warrantyDate ? selectedAlloc.asset.warrantyDate.split('T')[0] : '—' },
                    { label: 'Cost', value: selectedAlloc.asset?.cost != null ? `$${Number(selectedAlloc.asset.cost).toLocaleString()}` : '—' },
                    { label: 'Status', value: selectedAlloc.status },
                  ].map((r, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-0.5">{r.label}</p>
                      <p className="font-semibold text-slate-200 break-all">{r.value || '—'}</p>
                    </div>
                  ))}
                </div>
                {selectedAlloc.asset?.qrCode && (
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">QR Code</p>
                    <img src={selectedAlloc.asset.qrCode} alt="Asset QR" className="w-24 h-24 rounded-lg bg-white p-1" />
                  </div>
                )}
                {selectedAlloc.remarks && (
                  <p className="mt-3 text-[10px] text-slate-400 bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
                    <span className="text-slate-500 font-semibold">Remarks: </span>{selectedAlloc.remarks}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Request Asset Modal ──────────────────────────────── */}
          {showRequestModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md glass-card border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Request Asset</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Submit a request for available equipment</p>
                  </div>
                  <button id="emp-req-modal-close" onClick={() => setShowRequestModal(false)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                    <FiX size={16}/>
                  </button>
                </div>
                <form onSubmit={handleRequestAssetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Asset *</label>
                    <select
                      id="emp-select-asset"
                      value={requestAssetId}
                      onChange={e => setRequestAssetId(e.target.value)}
                      required
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors"
                    >
                      <option value="">— Choose an asset —</option>
                      {loadingAssets ? (
                        <option disabled>Loading available assets…</option>
                      ) : availableAssets.length === 0 ? (
                        <option disabled>No available assets found</option>
                      ) : availableAssets.map(a => (
                        <option key={a._id} value={a._id}>
                          {a.assetTag} — {a.model?.manufacturer} {a.model?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Expected Return Date *</label>
                    <input
                      id="emp-return-date"
                      type="date"
                      value={requestReturnDate}
                      onChange={e => setRequestReturnDate(e.target.value)}
                      required
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Remarks</label>
                    <textarea
                      id="emp-req-remarks"
                      value={requestRemarks}
                      onChange={e => setRequestRemarks(e.target.value)}
                      placeholder="Reason for request (optional)"
                      rows={3}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">Cancel</button>
                    <button
                      id="emp-req-submit"
                      type="submit"
                      disabled={submittingAction}
                      className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                    >
                      {submittingAction ? 'Submitting…' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Request Return Modal ─────────────────────────────── */}
          {showReturnModal && selectedAlloc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md glass-card border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Request Return</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedAlloc.asset?.assetTag} — {selectedAlloc.asset?.model?.manufacturer} {selectedAlloc.asset?.model?.name}</p>
                  </div>
                  <button id="emp-return-modal-close" onClick={() => setShowReturnModal(false)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                    <FiX size={16}/>
                  </button>
                </div>
                <form onSubmit={handleReturnSubmit} className="space-y-4">
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-emerald-400">
                    This will notify your Department Head to process the return of this asset.
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Return Remarks</label>
                    <textarea
                      id="emp-return-remarks"
                      value={returnRemarks}
                      onChange={e => setReturnRemarks(e.target.value)}
                      placeholder="Reason for return, condition notes, etc. (optional)"
                      rows={3}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowReturnModal(false)} className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">Cancel</button>
                    <button
                      id="emp-return-submit"
                      type="submit"
                      className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg"
                    >
                      Request Return
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Request Transfer Modal ───────────────────────────── */}
          {showTransferModal && selectedAlloc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md glass-card border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Request Transfer</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedAlloc.asset?.assetTag} — {selectedAlloc.asset?.model?.manufacturer} {selectedAlloc.asset?.model?.name}</p>
                  </div>
                  <button id="emp-transfer-modal-close" onClick={() => setShowTransferModal(false)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
                    <FiX size={16}/>
                  </button>
                </div>
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 text-[11px] text-violet-400">
                    This will send a transfer request to your Department Head for approval.
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Transfer To *</label>
                    <select
                      id="emp-transfer-recipient"
                      value={transferEmployeeId}
                      onChange={e => setTransferEmployeeId(e.target.value)}
                      required
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-violet-500/50 transition-colors"
                    >
                      <option value="">— Select recipient employee —</option>
                      {employees.filter(e => e._id !== (user?.id || user?._id)).map(e => (
                        <option key={e._id} value={e._id}>{e.fullName} ({e.email})</option>
                      ))}
                      {employees.length === 0 && <option disabled>No employees loaded</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Transfer Remarks</label>
                    <textarea
                      id="emp-transfer-remarks"
                      value={transferRemarks}
                      onChange={e => setTransferRemarks(e.target.value)}
                      placeholder="Reason for transfer (optional)"
                      rows={3}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">Cancel</button>
                    <button
                      id="emp-transfer-submit"
                      type="submit"
                      className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 transition-all shadow-lg"
                    >
                      Submit Transfer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* BRANCH 4: DEFAULT ADMIN / OTHER DASHBOARD */
        <div className="space-y-6">
          
          {/* Admin Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Employees</span>
                <span className="text-xl font-extrabold text-slate-100">{loading ? '...' : counts?.employees}</span>
              </div>
              <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg">
                <FiUsers size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Departments</span>
                <span className="text-xl font-extrabold text-slate-100">{loading ? '...' : counts?.departments}</span>
              </div>
              <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-lg">
                <FiLayers size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Assets</span>
                <span className="text-xl font-extrabold text-slate-100">{loading ? '...' : counts?.total}</span>
              </div>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <FiBox size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Available</span>
                <span className="text-xl font-extrabold text-emerald-450 text-emerald-450 text-emerald-450 text-emerald-400">{loading ? '...' : counts?.available}</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-450 rounded-lg">
                <FiCheckCircle size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Allocated</span>
                <span className="text-xl font-extrabold text-cyan-400">{loading ? '...' : counts?.allocated}</span>
              </div>
              <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
                <FiBox size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Maintenance</span>
                <span className="text-xl font-extrabold text-amber-400">{loading ? '...' : counts?.maintenance}</span>
              </div>
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                <FiTool size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Retired</span>
                <span className="text-xl font-extrabold text-slate-400">{loading ? '...' : counts?.retired}</span>
              </div>
              <div className="p-2.5 bg-slate-500/10 text-slate-450 rounded-lg">
                <FiAlertTriangle size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Pending Allocations</span>
                <span className="text-xl font-extrabold text-violet-400">{loading ? '...' : counts?.pendingAllocations}</span>
              </div>
              <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg">
                <FiClock size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Pending Returns</span>
                <span className="text-xl font-extrabold text-teal-400">{loading ? '...' : counts?.pendingReturns}</span>
              </div>
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-lg">
                <FiRefreshCw size={16} />
              </div>
            </div>

            <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between col-span-2 sm:col-span-1">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-505 text-slate-500 font-bold uppercase tracking-wider block">Asset Valuation</span>
                <span className="text-md font-extrabold text-indigo-400">
                  {loading ? '...' : `$${stats?.totalValue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
              </div>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <FiDollarSign size={16} />
              </div>
            </div>
          </div>

          {/* Admin Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assets by Category</h3>
                <p className="text-[10px] text-slate-500 mt-1">Resource allocation by category</p>
              </div>
              <div className="h-48 w-full relative flex items-center justify-center">
                {loading ? (
                  <span className="w-6 h-6 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="categoryName"
                      >
                        {(stats?.categoryDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#f8fafc'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {!loading && stats?.categoryDistribution && (
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
                  {stats.categoryDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-slate-450">{entry.categoryName} ({entry.count})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assets by Status</h3>
                <p className="text-[10px] text-slate-500 mt-1">Allocation by physical status</p>
              </div>
              <div className="h-48 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="w-6 h-6 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.statusDistribution || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#f8fafc'
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {(stats?.statusDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8b5cf6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department Distribution</h3>
                <p className="text-[10px] text-slate-500 mt-1">Equipment count per company division</p>
              </div>
              <div className="h-48 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="w-6 h-6 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.departmentDistribution || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDeptAdminDH" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="departmentName" stroke="#64748b" fontSize={9} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#f8fafc'
                        }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorDeptAdminDH)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Lower Admin activity columns */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card border border-slate-850 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase tracking-wide">
                    <FiRefreshCw size={13} className="text-violet-500" /> Recent Allocations
                  </h4>
                  {loading ? (
                    <p className="text-[10px] text-slate-500">Loading...</p>
                  ) : (
                    <div className="divide-y divide-slate-850/60 text-[10px] space-y-2.5">
                      {stats?.recentAllocations?.map(a => (
                        <div key={a._id} className="pt-2 flex justify-between items-start gap-1">
                          <div>
                            <span className="text-slate-200 font-bold block">{a.allocatedTo?.fullName}</span>
                            <span className="text-slate-455 text-slate-450 block font-mono">Tag: {a.asset?.assetTag}</span>
                          </div>
                          <span className="text-slate-500 font-mono">{a.allocationDate ? a.allocationDate.split('T')[0] : '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-card border border-slate-850 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase tracking-wide">
                    <FiUsers size={13} className="text-sky-500" /> Recent Registrations
                  </h4>
                  {loading ? (
                    <p className="text-[10px] text-slate-500">Loading...</p>
                  ) : (
                    <div className="divide-y divide-slate-850/60 text-[10px] space-y-2.5">
                      {stats?.recentEmployees?.map(e => (
                        <div key={e._id} className="pt-2 flex justify-between items-start gap-1">
                          <div>
                            <span className="text-slate-200 font-bold block">{e.fullName}</span>
                            <span className="text-slate-455 text-slate-450 block">{e.department?.name || 'No Dept'}</span>
                          </div>
                          <span className="bg-slate-850 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold">
                            {e.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-card border border-slate-850 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-350 flex items-center gap-1.5 uppercase tracking-wide">
                    <FiBox size={13} className="text-indigo-500" /> Recent Assets Added
                  </h4>
                  {loading ? (
                    <p className="text-[10px] text-slate-500">Loading...</p>
                  ) : (
                    <div className="divide-y divide-slate-850/60 text-[10px] space-y-2.5">
                      {stats?.recentAssets?.map(a => (
                        <tr key={a._id} className="hover:bg-slate-900/10 flex justify-between items-start pt-2">
                          <td>
                            <span className="text-slate-200 font-bold block">{a.model?.manufacturer} {a.model?.name}</span>
                            <span className="text-slate-455 text-slate-455 text-slate-450 block font-mono">Tag: {a.assetTag}</span>
                          </td>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-1 rounded text-[8px] uppercase tracking-wider font-semibold">
                            {a.status}
                          </span>
                        </tr>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-card border border-slate-850 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Quick Actions</h3>
                <p className="text-[9px] text-slate-500 mt-1">Direct system configuration shortcuts</p>
              </div>
              <div className="space-y-3 flex-1 mt-4">
                <button
                  onClick={() => isAdmin ? navigate('/employees') : toast.error('Admin role required')}
                  className="w-full flex items-center justify-between bg-slate-950/40 hover:bg-slate-900 border border-slate-850 p-3 rounded-xl hover:border-slate-700 transition-all text-left text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                      <FiUserPlus size={14} />
                    </div>
                    <div>
                      <span className="text-slate-200 font-semibold block">Add Employee</span>
                      <span className="text-[9px] text-slate-500">Register new staff profile</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => isAdmin ? navigate('/departments') : toast.error('Admin role required')}
                  className="w-full flex items-center justify-between bg-slate-950/40 hover:bg-slate-900 border border-slate-850 p-3 rounded-xl hover:border-slate-700 transition-all text-left text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg">
                      <FiLayers size={14} />
                    </div>
                    <div>
                      <span className="text-slate-200 font-semibold block">Add Department</span>
                      <span className="text-[9px] text-slate-500">Form new company division</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => isAdmin ? navigate('/assets') : toast.error('Asset Manager role required')}
                  className="w-full flex items-center justify-between bg-slate-950/40 hover:bg-slate-900 border border-slate-850 p-3 rounded-xl hover:border-slate-700 transition-all text-left text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <FiPlusSquare size={14} />
                    </div>
                    <div>
                      <span className="text-slate-200 font-semibold block">Add Asset</span>
                      <span className="text-[9px] text-slate-500">Insert new physical hardware</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => isAdmin ? navigate('/allocations/new') : navigate('/allocations/history')}
                  className="w-full flex items-center justify-between bg-slate-950/40 hover:bg-slate-900 border border-slate-850 p-3 rounded-xl hover:border-slate-700 transition-all text-left text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <FiSend size={14} />
                    </div>
                    <div>
                      <span className="text-slate-200 font-semibold block">Allocate Asset</span>
                      <span className="text-[9px] text-slate-500">Assign devices to users</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Dashboard;
