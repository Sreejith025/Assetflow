import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  FiBarChart2, FiCalendar, FiFilter, FiDownload, FiPrinter, 
  FiLayers, FiTag, FiUser, FiBox, FiCheckCircle, FiRefreshCw, FiTool
} from 'react-icons/fi';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { toast } from 'react-hot-toast';

const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

const Reports = () => {
  const { user } = useContext(AuthContext);
  
  // Scoped lists for filters
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Active filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('');

  // Report statistics and logs data
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('allocations'); // allocations | returns | maintenance | category | department

  useEffect(() => {
    // 1. Fetch filter dropdown datasets
    const fetchDropdowns = async () => {
      try {
        const [deptRes, catRes, empRes] = await Promise.all([
          axios.get('http://localhost:5000/api/departments'),
          axios.get('http://localhost:5000/api/categories'),
          axios.get('http://localhost:5000/api/employees')
        ]);
        setDepartments(deptRes.data.data || []);
        setCategories(catRes.data.data || []);
        setEmployees(empRes.data.data || []);
      } catch (err) {
        console.warn('Backend server dropdowns offline. Setting mock filter list.');
        setDepartments([{ _id: 'd1', name: 'Engineering' }, { _id: 'd2', name: 'Product Management' }]);
        setCategories([{ _id: 'c1', name: 'Workstations' }, { _id: 'c2', name: 'Monitors' }]);
        setEmployees([{ _id: 'e1', fullName: 'Alice Johnson' }, { _id: 'e2', fullName: 'Bob Carter' }]);
      }
    };
    fetchDropdowns();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedDept) params.department = selectedDept;
      if (selectedCat) params.category = selectedCat;
      if (selectedEmp) params.employee = selectedEmp;

      const res = await axios.get('http://localhost:5000/api/reports', { params });
      setReportData(res.data.data);
    } catch (err) {
      console.warn('Backend reports offline. Resolving mock sandbox stats.');
      setReportData({
        assetsByDepartment: [
          { departmentName: 'Engineering', count: 8, value: 12400 },
          { departmentName: 'Product Management', count: 4, value: 5800 },
          { departmentName: 'Operations', count: 3, value: 3900 }
        ],
        assetsByCategory: [
          { categoryName: 'Workstations', count: 12, value: 24000 },
          { categoryName: 'Mobile Devices', count: 6, value: 5400 },
          { categoryName: 'Monitors', count: 3, value: 1800 }
        ],
        allocations: [
          { 
            _id: 'mock_a1', 
            asset: { assetTag: 'AST-0001', cost: 1200, model: { manufacturer: 'Apple', name: 'MacBook Pro' } }, 
            allocatedTo: { fullName: 'Alice Johnson', email: 'alice@company.com' }, 
            allocationDate: '2026-07-01T10:00:00Z', 
            status: 'Allocated' 
          },
          { 
            _id: 'mock_a2', 
            asset: { assetTag: 'AST-0002', cost: 1800, model: { manufacturer: 'Apple', name: 'MacBook Pro' } }, 
            allocatedTo: { fullName: 'Bob Carter', email: 'bob@company.com' }, 
            allocationDate: '2026-07-05T12:00:00Z', 
            status: 'Allocated' 
          }
        ],
        returns: [
          { 
            _id: 'mock_r1', 
            asset: { assetTag: 'AST-0003', cost: 900, model: { manufacturer: 'Dell', name: 'Monitor 27' } }, 
            allocatedTo: { fullName: 'Jane Doe', email: 'jane@company.com' }, 
            allocationDate: '2026-06-01T10:00:00Z',
            actualReturnDate: '2026-07-08T15:00:00Z', 
            status: 'Returned' 
          }
        ],
        maintenance: [
          { 
            _id: 'mock_m1', 
            assetTag: 'AST-0004', 
            category: { name: 'Workstations' },
            model: { manufacturer: 'Apple', name: 'MacBook Pro' },
            vendor: 'Apple Care', 
            cost: 1500, 
            status: 'Maintenance' 
          }
        ],
        valuationSummary: {
          totalValue: 31200,
          averageCost: 1560,
          totalAssetsCount: 20
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedDept, selectedCat, selectedEmp]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedDept('');
    setSelectedCat('');
    setSelectedEmp('');
    toast.success('Filters reset successfully.');
  };

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'allocations') {
      csvContent += "Asset Tag,Asset Model,Allocated To,Email,Allocation Date,Status\n";
      (reportData?.allocations || []).forEach(row => {
        csvContent += `"${row.asset?.assetTag}","${row.asset?.model?.manufacturer || ''} ${row.asset?.model?.name || ''}","${row.allocatedTo?.fullName}","${row.allocatedTo?.email}","${row.allocationDate?.split('T')[0]}","${row.status}"\n`;
      });
    } else if (activeTab === 'returns') {
      csvContent += "Asset Tag,Asset Model,Allocated To,Return Date,Status\n";
      (reportData?.returns || []).forEach(row => {
        csvContent += `"${row.asset?.assetTag}","${row.asset?.model?.manufacturer || ''} ${row.asset?.model?.name || ''}","${row.allocatedTo?.fullName}","${row.actualReturnDate?.split('T')[0]}","${row.status}"\n`;
      });
    } else if (activeTab === 'maintenance') {
      csvContent += "Asset Tag,Category,Model,Vendor,Cost,Status\n";
      (reportData?.maintenance || []).forEach(row => {
        csvContent += `"${row.assetTag}","${row.category?.name}","${row.model?.manufacturer} ${row.model?.name}","${row.vendor}","${row.cost}","${row.status}"\n`;
      });
    } else if (activeTab === 'category') {
      csvContent += "Category Name,Total Count,Total Cost Value\n";
      (reportData?.assetsByCategory || []).forEach(row => {
        csvContent += `"${row.categoryName}","${row.count}","${row.value}"\n`;
      });
    } else {
      csvContent += "Department Name,Allocated Assets Count,Valuation Cost Value\n";
      (reportData?.assetsByDepartment || []).forEach(row => {
        csvContent += `"${row.departmentName}","${row.count}","${row.value}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AssetFlow_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel CSV generated successfully.');
  };

  // PDF Exporter
  const handleExportPDF = () => {
    window.print();
  };

  // Process Allocations date-trend timeline for line chart
  const getAllocationTimelineData = () => {
    const allocationsList = reportData?.allocations || [];
    const dateCounts = {};
    
    // Sort and limit allocations to show recent allocations timeline trend
    allocationsList.forEach(a => {
      if (a.allocationDate) {
        const dateStr = a.allocationDate.split('T')[0];
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
      }
    });

    return Object.keys(dateCounts)
      .sort()
      .map(date => ({
        date,
        allocations: dateCounts[date]
      }));
  };

  const timelineData = getAllocationTimelineData();
  const valSummary = reportData?.valuationSummary;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header and Actions (No Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FiBarChart2 className="text-violet-500" /> Reports &amp; Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Analyze physical inventory density, return distributions, and employee allocation metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-2 px-3.5 rounded-xl cursor-pointer transition-colors"
          >
            <FiPrinter size={14} /> Print PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-2 px-3.5 rounded-xl cursor-pointer transition-colors"
          >
            <FiDownload size={14} /> Export Excel
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow-md cursor-pointer transition-all"
          >
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Dynamic Scoped Filters Panel (No Print) */}
      <div className="glass-card border border-slate-850 p-5 rounded-2xl space-y-4 no-print">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <FiFilter /> Filter Controls
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
            <div className="relative">
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Date</label>
            <div className="relative">
              <input 
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3 py-2 text-xs text-slate-255 focus:outline-none transition-colors"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <select
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3 py-2 text-xs text-slate-255 focus:outline-none transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Employee */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee</label>
            <select
              value={selectedEmp}
              onChange={e => setSelectedEmp(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3 py-2 text-xs text-slate-255 focus:outline-none transition-colors"
            >
              <option value="">All Employees</option>
              {employees.map(e => (
                <option key={e._id} value={e._id}>{e.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        {(startDate || endDate || selectedDept || selectedCat || selectedEmp) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleResetFilters}
              className="text-[10px] text-violet-400 hover:text-violet-300 font-bold uppercase tracking-wider bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Print Header (Only visible when printing) */}
      <div className="hidden print-only text-slate-900 border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">AssetFlow Reporting Center</h1>
        <p className="text-sm mt-1">Generated by: {user?.fullName || user?.name} ({user?.role})</p>
        <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Valuation Metrics Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Cost Valuation */}
        <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Valuation Cost</span>
            <span className="text-xl font-extrabold text-indigo-400">
              {loading ? '...' : `$${valSummary?.totalValue?.toLocaleString()}`}
            </span>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <FiDollarSign size={16} />
          </div>
        </div>

        {/* Avg Unit Cost */}
        <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Average Asset Cost</span>
            <span className="text-xl font-extrabold text-slate-100">
              {loading ? '...' : `$${valSummary?.averageCost?.toLocaleString()}`}
            </span>
          </div>
          <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg">
            <FiBox size={16} />
          </div>
        </div>

        {/* Total Assets matching filters */}
        <div className="glass-card border border-slate-850 p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Scoped Count</span>
            <span className="text-xl font-extrabold text-cyan-400">
              {loading ? '...' : valSummary?.totalAssetsCount}
            </span>
          </div>
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <FiLayers size={16} />
          </div>
        </div>
      </div>

      {/* Recharts Analytics Row (No Print) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        
        {/* Pie: Assets by Category counts */}
        <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assets by Category</h3>
            <p className="text-[10px] text-slate-505 mt-1">Resource allocation by inventory category</p>
          </div>
          <div className="h-44 w-full relative flex items-center justify-center">
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData?.assetsByCategory || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="categoryName"
                  >
                    {(reportData?.assetsByCategory || []).map((entry, index) => (
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
        </div>

        {/* Bar: Assets by Department values */}
        <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department Valuations</h3>
            <p className="text-[10px] text-slate-505 mt-1">Valuation value of assets assigned per division</p>
          </div>
          <div className="h-44 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <span className="w-5 h-5 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData?.assetsByDepartment || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Line: Timeline allocations trend */}
        <div className="glass-card rounded-2xl border border-slate-850 p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Allocation Timeline</h3>
            <p className="text-[10px] text-slate-505 mt-1">Total active device assignments over time</p>
          </div>
          <div className="h-44 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <span className="w-5 h-5 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
              </div>
            ) : timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-500">
                No history to construct trend
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} />
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
                  <Line type="monotone" dataKey="allocations" stroke="#06b6d4" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Reports tab navigation switcher */}
      <div className="glass-card border border-slate-850 rounded-2xl overflow-hidden">
        {/* Navigation Tabs (No Print) */}
        <div className="flex border-b border-slate-850/80 bg-slate-950/40 p-2 overflow-x-auto select-none no-print">
          <button
            onClick={() => setActiveTab('allocations')}
            className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'allocations' 
                ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <FiBox size={14} /> Allocations Report
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'returns' 
                ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <FiRefreshCw size={14} /> Returns Report
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'maintenance' 
                ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <FiTool size={14} /> Maintenance Report
          </button>

          <button
            onClick={() => setActiveTab('category')}
            className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'category' 
                ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <FiTag size={14} /> Assets by Category
          </button>

          <button
            onClick={() => setActiveTab('department')}
            className={`flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'department' 
                ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <FiLayers size={14} /> Assets by Department
          </button>
        </div>

        {/* Tab content log table */}
        <div className="p-5">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <span className="w-6 h-6 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              
              {/* Tab 1: Allocations Table */}
              {activeTab === 'allocations' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850/80 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="pb-3">Asset Tag</th>
                      <th className="pb-3">Model</th>
                      <th className="pb-3">Employee Name</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">Allocation Date</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-350">
                    {(reportData?.allocations || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500">No allocation records found matching query</td>
                      </tr>
                    ) : (
                      reportData.allocations.map(row => (
                        <tr key={row._id}>
                          <td className="py-3 font-mono font-bold text-violet-400">{row.asset?.assetTag}</td>
                          <td className="py-3 text-slate-200">
                            {row.asset?.model?.manufacturer || ''} {row.asset?.model?.name || ''}
                          </td>
                          <td className="py-3 text-slate-200">{row.allocatedTo?.fullName}</td>
                          <td className="py-3 text-slate-400">{row.allocatedTo?.email}</td>
                          <td className="py-3 text-slate-500 font-mono">
                            {row.allocationDate ? row.allocationDate.split('T')[0] : '—'}
                          </td>
                          <td className="py-3 text-right">
                            <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded border border-cyan-500/10 bg-cyan-500/5 text-cyan-400 uppercase">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 2: Returns Table */}
              {activeTab === 'returns' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850/80 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="pb-3">Asset Tag</th>
                      <th className="pb-3">Model</th>
                      <th className="pb-3">Allocated To</th>
                      <th className="pb-3">Return Date</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-350">
                    {(reportData?.returns || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-500">No return records logged</td>
                      </tr>
                    ) : (
                      reportData.returns.map(row => (
                        <tr key={row._id}>
                          <td className="py-3 font-mono font-bold text-violet-400">{row.asset?.assetTag}</td>
                          <td className="py-3 text-slate-200">
                            {row.asset?.model?.manufacturer || ''} {row.asset?.model?.name || ''}
                          </td>
                          <td className="py-3 text-slate-200">{row.allocatedTo?.fullName}</td>
                          <td className="py-3 text-slate-500 font-mono">
                            {row.actualReturnDate ? row.actualReturnDate.split('T')[0] : '—'}
                          </td>
                          <td className="py-3 text-right">
                            <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-500/10 bg-emerald-500/5 text-emerald-400 uppercase">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 3: Maintenance Table */}
              {activeTab === 'maintenance' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850/80 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="pb-3">Asset Tag</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Model</th>
                      <th className="pb-3">Service Vendor</th>
                      <th className="pb-3">Cost Value</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-350">
                    {(reportData?.maintenance || []).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500">No assets currently under maintenance</td>
                      </tr>
                    ) : (
                      reportData.maintenance.map(row => (
                        <tr key={row._id}>
                          <td className="py-3 font-mono font-bold text-violet-400">{row.assetTag}</td>
                          <td className="py-3 text-slate-200">{row.category?.name}</td>
                          <td className="py-3 text-slate-200">{row.model?.manufacturer} {row.model?.name}</td>
                          <td className="py-3 text-slate-400">{row.vendor || '—'}</td>
                          <td className="py-3 text-slate-300 font-bold">${row.cost?.toLocaleString()}</td>
                          <td className="py-3 text-right">
                            <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/10 bg-amber-500/5 text-amber-400 uppercase">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 4: Assets by Category Table */}
              {activeTab === 'category' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850/80 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="pb-3">Category Name</th>
                      <th className="pb-3">Total Equipment Count</th>
                      <th className="pb-3 text-right">Valuation Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-350">
                    {(reportData?.assetsByCategory || []).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-6 text-center text-slate-500">No category summary log</td>
                      </tr>
                    ) : (
                      reportData.assetsByCategory.map((row, idx) => (
                        <tr key={idx}>
                          <td className="py-3 text-slate-200 font-semibold">{row.categoryName}</td>
                          <td className="py-3 text-slate-300">{row.count} unit(s)</td>
                          <td className="py-3 text-right text-indigo-400 font-bold">${row.value?.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Tab 5: Assets by Department Table */}
              {activeTab === 'department' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850/80 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="pb-3">Department Name</th>
                      <th className="pb-3">Allocated Equipment Count</th>
                      <th className="pb-3 text-right">Valuation Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-350">
                    {(reportData?.assetsByDepartment || []).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-6 text-center text-slate-500">No division allocation log</td>
                      </tr>
                    ) : (
                      reportData.assetsByDepartment.map((row, idx) => (
                        <tr key={idx}>
                          <td className="py-3 text-slate-200 font-semibold">{row.departmentName}</td>
                          <td className="py-3 text-slate-300">{row.count} unit(s)</td>
                          <td className="py-3 text-right text-indigo-400 font-bold">${row.value?.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Reports;
