import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import { Toaster } from 'react-hot-toast';

// ── Pages ──────────────────────────────────────────────────────────────────
import Login            from './pages/Login';
import Dashboard        from './pages/Dashboard';
import Employees        from './pages/Employees';
import Departments      from './pages/Departments';
import Assets           from './pages/Assets';
import AllocateAsset    from './pages/AllocateAsset';
import ReturnAsset      from './pages/ReturnAsset';
import AllocationHistory from './pages/AllocationHistory';

// New role-specific pages
import Categories       from './pages/Categories';
import AssetModels      from './pages/AssetModels';
import Allocations      from './pages/Allocations';
import Reports          from './pages/Reports';
import Settings         from './pages/Settings';
import Maintenance      from './pages/Maintenance';
import Approvals        from './pages/Approvals';
import DepartmentAssets from './pages/DepartmentAssets';
import MyAssets         from './pages/MyAssets';
import RequestAsset     from './pages/RequestAsset';
import Profile          from './pages/Profile';

// ── Role constants ─────────────────────────────────────────────────────────
const ADMIN               = ['Admin'];
const ADMIN_MANAGER       = ['Admin', 'Asset Manager'];
const ADMIN_MANAGER_HEAD  = ['Admin', 'Asset Manager', 'Department Head'];
const ALL_ROLES           = ['Admin', 'Asset Manager', 'Department Head', 'Employee'];

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public ── */}
          <Route path="/login" element={<Login />} />

          {/* ── Dashboard (all roles) ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout><Dashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Admin only ── */}
          <Route path="/departments" element={
            <ProtectedRoute allowedRoles={ADMIN}>
              <DashboardLayout><Departments /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={ADMIN}>
              <DashboardLayout><Settings /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Admin + Asset Manager ── */}
          <Route path="/assets" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
              <DashboardLayout><Assets /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/categories" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
              <DashboardLayout><Categories /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/asset-models" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
              <DashboardLayout><AssetModels /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
              <DashboardLayout><Reports /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/maintenance" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
              <DashboardLayout><Maintenance /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Allocations hub (Admin + Asset Manager) ── */}
          <Route path="/allocations" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
              <DashboardLayout><Allocations /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/allocations/new" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER}>
              <DashboardLayout><AllocateAsset /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/allocations/active" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER_HEAD}>
              <DashboardLayout><ReturnAsset /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Allocation History (all authenticated roles) ── */}
          <Route path="/allocations/history" element={
            <ProtectedRoute>
              <DashboardLayout><AllocationHistory /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Admin + Asset Manager + Department Head ── */}
          <Route path="/employees" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER_HEAD}>
              <DashboardLayout><Employees /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Department Head only ── */}
          <Route path="/department-assets" element={
            <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
              <DashboardLayout><DepartmentAssets /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/approvals" element={
            <ProtectedRoute allowedRoles={ADMIN_MANAGER_HEAD}>
              <DashboardLayout><Approvals /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Employee only ── */}
          <Route path="/my-assets" element={
            <ProtectedRoute allowedRoles={ALL_ROLES}>
              <DashboardLayout><MyAssets /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/request-asset" element={
            <ProtectedRoute allowedRoles={ALL_ROLES}>
              <DashboardLayout><RequestAsset /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout><Profile /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* ── Fallback redirects ── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>

      {/* Toast notifications with dark theme */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(30, 41, 59, 0.95)',
            color: '#f1f5f9',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            fontSize: '12px',
            borderRadius: '12px',
            fontWeight: '500',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
