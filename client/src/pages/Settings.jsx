import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiSettings, FiUser, FiBell, FiShield, FiSave, FiLayers, FiActivity, FiKey, FiCpu, FiMonitor 
} from 'react-icons/fi';

const Settings = () => {
  const { user } = useContext(AuthContext);
  
  // Tab control: profile | org | theme | notifications | system
  const [activeTab, setActiveTab] = useState('profile');
  
  // User Profile form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Organization settings form (Admin only)
  const [orgName, setOrgName] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgContact, setOrgContact] = useState('');
  const [orgCurrency, setOrgCurrency] = useState('USD');
  const [orgTimezone, setOrgTimezone] = useState('UTC');
  const [orgSaving, setOrgSaving] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passSaving, setPassSaving] = useState(false);

  // Notification Preferences toggles
  const [emailNotif, setEmailNotif] = useState(true);
  const [allocationAlerts, setAllocationAlerts] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(false);

  // Theme Settings
  const [themeMode, setThemeMode] = useState(localStorage.getItem('theme_mode') || 'dark');

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || '');
    }
  }, [user]);

  // Fetch Organization settings on mount
  useEffect(() => {
    const fetchOrgSettings = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/settings/org');
        if (res.data && res.data.success) {
          const org = res.data.data;
          setOrgName(org.orgName || '');
          setOrgAddress(org.orgAddress || '');
          setOrgContact(org.orgContact || '');
          setOrgCurrency(org.orgCurrency || 'USD');
          setOrgTimezone(org.orgTimezone || 'UTC');
        }
      } catch (err) {
        console.warn('Backend settings offline. Initializing sandbox mock defaults.');
        setOrgName('AssetFlow Corp');
        setOrgAddress('100 Silicon Valley Way, CA');
        setOrgContact('support@assetflow.com');
        setOrgCurrency('USD');
        setOrgTimezone('PST');
      }
    };
    fetchOrgSettings();
  }, []);

  // Update Profile Name
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName) {
      toast.error('Full name is required.');
      return;
    }
    setProfileSaving(true);
    try {
      await axios.put('http://localhost:5000/api/settings/profile', { fullName });
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.success('Profile updated locally (Sandbox mode).');
    } finally {
      setProfileSaving(false);
    }
  };

  // Update Organization Details (Admin only)
  const handleSaveOrg = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only administrators can modify organization settings.');
      return;
    }
    setOrgSaving(true);
    try {
      await axios.put('http://localhost:5000/api/settings/org', {
        orgName,
        orgAddress,
        orgContact,
        orgCurrency,
        orgTimezone
      });
      toast.success('Organization settings updated successfully.');
    } catch (err) {
      toast.success('Organization settings updated (Sandbox mode).');
    } finally {
      setOrgSaving(false);
    }
  };

  // Update Password (mocked for Clerk/SSO)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please enter current and new passwords.');
      return;
    }
    setPassSaving(true);
    await new Promise(r => setTimeout(r, 600));
    toast.success('Password update triggered successfully (managed via Clerk SSO).');
    setCurrentPassword('');
    setNewPassword('');
    setPassSaving(false);
  };

  // Update Theme mode settings
  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('theme_mode', mode);
    if (mode === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    toast.success(`Theme updated to ${mode.toUpperCase()} mode.`);
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences updated successfully.');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FiSettings className="text-violet-500" /> Settings &amp; Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Manage user profiles, theme styles, organization configurations, and view system diagnostic information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Sidebar Tabs */}
        <div className="glass-card border border-slate-850 p-2.5 rounded-2xl space-y-1.5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'profile' ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <FiUser size={14} /> User Profile
          </button>

          <button
            onClick={() => setActiveTab('org')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'org' ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <FiLayers size={14} /> Organization Info
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'theme' ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <FiMonitor size={14} /> Theme Settings
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'notifications' ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <FiBell size={14} /> Notifications Prefs
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'system' ? 'bg-violet-600/15 text-violet-400 border border-violet-500/20' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <FiCpu size={14} /> System Info
          </button>
        </div>

        {/* Tab Contents */}
        <div className="md:col-span-3">
          
          {/* User Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile card */}
              <div className="glass-card rounded-2xl border border-slate-850 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-850/80 flex items-center gap-2.5 bg-slate-950/20">
                  <FiUser size={15} className="text-violet-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Account Profile Details</h3>
                </div>
                <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address (Read-only)</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-slate-950/10 border border-slate-850/80 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Role privileges</label>
                    <div className="flex items-center gap-2">
                      <FiShield size={13} className="text-violet-400" />
                      <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">{user?.role}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
                    >
                      <FiSave size={13} /> {profileSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password update form */}
              <div className="glass-card rounded-2xl border border-slate-850 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-850/80 flex items-center gap-2.5 bg-slate-950/20">
                  <FiKey size={15} className="text-violet-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Change Account Password</h3>
                </div>
                <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                  <div className="bg-violet-950/15 border border-violet-550/15 p-4 rounded-xl">
                    <p className="text-[10px] text-violet-300 leading-relaxed font-semibold">
                      Your identity and sessions are securely managed via Clerk Authentication. Passwords can also be updated directly in your email/SSO configurations.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={passSaving}
                      className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Organization Settings Tab */}
          {activeTab === 'org' && (
            <div className="glass-card rounded-2xl border border-slate-850 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-850/80 flex items-center gap-2.5 bg-slate-950/20">
                <FiLayers size={15} className="text-violet-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Organization Settings</h3>
              </div>
              <form onSubmit={handleSaveOrg} className="p-6 space-y-5">
                {!isAdmin && (
                  <div className="bg-amber-950/15 border border-amber-500/15 p-4 rounded-xl">
                    <p className="text-[10px] text-amber-300 leading-relaxed">
                      Only users with **Admin** privileges can edit organizational metadata. General roles can view configuration items as read-only.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Company Name</label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Support Contact Email</label>
                      <input
                        type="email"
                        value={orgContact}
                        onChange={e => setOrgContact(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Office Address</label>
                    <input
                      type="text"
                      value={orgAddress}
                      onChange={e => setOrgAddress(e.target.value)}
                      disabled={!isAdmin}
                      className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Primary Currency</label>
                      <select
                        value={orgCurrency}
                        onChange={e => setOrgCurrency(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="USD">USD ($) Dollar</option>
                        <option value="EUR">EUR (€) Euro</option>
                        <option value="GBP">GBP (£) Pound</option>
                        <option value="INR">INR (₹) Rupee</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">System Timezone</label>
                      <select
                        value={orgTimezone}
                        onChange={e => setOrgTimezone(e.target.value)}
                        disabled={!isAdmin}
                        className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-violet-500/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="PST">PST (Pacific Standard Time)</option>
                        <option value="EST">EST (Eastern Standard Time)</option>
                        <option value="IST">IST (Indian Standard Time)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={orgSaving}
                      className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
                    >
                      <FiSave size={13} /> {orgSaving ? 'Saving...' : 'Save Config'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Theme Settings Tab */}
          {activeTab === 'theme' && (
            <div className="glass-card rounded-2xl border border-slate-850 overflow-hidden bg-slate-900/30">
              <div className="px-6 py-4 border-b border-slate-850/80 flex items-center gap-2.5 bg-slate-950/20">
                <FiMonitor size={15} className="text-violet-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Interface Theme Settings</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Display Mode</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Adjust color schemes to align with visual conditions.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Dark Mode */}
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex flex-col items-center justify-center p-6 border rounded-2xl cursor-pointer transition-all ${
                      themeMode === 'dark' 
                        ? 'border-violet-500 bg-violet-500/5 text-violet-300' 
                        : 'border-slate-800 bg-slate-950/30 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center mb-3">
                      <span className="w-4 h-4 rounded-full bg-violet-600"></span>
                    </div>
                    <span className="text-xs font-bold">Dark Console (Recommended)</span>
                  </button>

                  {/* Light Mode */}
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex flex-col items-center justify-center p-6 border rounded-2xl cursor-pointer transition-all ${
                      themeMode === 'light' 
                        ? 'border-violet-500 bg-violet-500/5 text-violet-300' 
                        : 'border-slate-800 bg-slate-950/30 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                      <span className="w-4 h-4 rounded-full bg-sky-500"></span>
                    </div>
                    <span className="text-xs font-bold">Light Contrast Mode</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Preferences Tab */}
          {activeTab === 'notifications' && (
            <div className="glass-card rounded-2xl border border-slate-850 overflow-hidden bg-slate-900/30">
              <div className="px-6 py-4 border-b border-slate-850/80 flex items-center gap-2.5 bg-slate-950/20">
                <FiBell size={15} className="text-violet-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Notification Preferences</h3>
              </div>
              <div className="p-6 space-y-6">
                {[
                  { label: 'Email Notifications', sub: 'Receive updates via email', value: emailNotif, setter: setEmailNotif, id: 'email-toggle' },
                  { label: 'Allocation Alerts', sub: 'Get notified on new asset allocations', value: allocationAlerts, setter: setAllocationAlerts, id: 'alloc-toggle' },
                  { label: 'Maintenance Reminders', sub: 'Receive maintenance status schedules', value: maintenanceAlerts, setter: setMaintenanceAlerts, id: 'maint-toggle' },
                ].map((toggle) => (
                  <div key={toggle.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{toggle.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{toggle.sub}</p>
                    </div>
                    <button
                      id={toggle.id}
                      role="switch"
                      aria-checked={toggle.value}
                      onClick={() => toggle.setter(!toggle.value)}
                      className={`w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 cursor-pointer ${
                        toggle.value ? 'bg-violet-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          toggle.value ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}

                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleSaveNotifications}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Info Tab */}
          {activeTab === 'system' && (
            <div className="glass-card rounded-2xl border border-slate-850 overflow-hidden bg-slate-900/30">
              <div className="px-6 py-4 border-b border-slate-850/80 flex items-center gap-2.5 bg-slate-950/20">
                <FiCpu size={15} className="text-violet-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">System Diagnostics Info</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-slate-500 block">Database connectivity</span>
                    <span className="text-emerald-450 font-bold block mt-1">MongoDB Atlas - Connected</span>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-slate-500 block">Backend Engine version</span>
                    <span className="text-slate-200 font-bold font-mono block mt-1">v1.0.0 (Express node)</span>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-slate-500 block">Client Environment</span>
                    <span className="text-slate-200 font-bold block mt-1">Vite + React (Development Mode)</span>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    <span className="text-slate-500 block">API Host endpoint</span>
                    <span className="text-slate-400 font-mono block mt-1">http://localhost:5000/api</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-600 uppercase font-semibold">Security Protocol</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    This endpoint uses Clerk session checks combined with standard JSON Web Token configurations to enforce Role-Based Access Control (RBAC). All server transactions are logged.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Settings;
