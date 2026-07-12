import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Responsive Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Layout Area */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Responsive Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Dynamic Inner Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-[fadeIn_0.3s_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
