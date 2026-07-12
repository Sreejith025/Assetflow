import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Assets from './pages/Assets';
import AllocateAsset from './pages/AllocateAsset';
import ReturnAsset from './pages/ReturnAsset';
import AllocationHistory from './pages/AllocationHistory';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public login portal */}
          <Route path="/login" element={<Login />} />

          {/* Guarded Console Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Guarded Employee Management */}
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <DashboardLayout>
                  <Employees />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Guarded Department Management */}
          <Route 
            path="/departments" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <DashboardLayout>
                  <Departments />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Guarded Asset Catalog Management */}
          <Route 
            path="/assets" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Assets />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Guarded Asset Allocation Form */}
          <Route 
            path="/allocations/new" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Asset Manager']}>
                <DashboardLayout>
                  <AllocateAsset />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Guarded Active Allocations Actions */}
          <Route 
            path="/allocations/active" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Asset Manager', 'Department Head']}>
                <DashboardLayout>
                  <ReturnAsset />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Guarded Allocations Log History */}
          <Route 
            path="/allocations/history" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AllocationHistory />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* Fallback redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      
      {/* Toast notifications handler with dark theme integration */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(30, 41, 59, 0.9)',
            color: '#f1f5f9',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            fontSize: '12px',
            borderRadius: '12px',
            fontWeight: '500'
          }
        }}
      />
    </AuthProvider>
  );
}

export default App;
