import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiSettings, FiUser, FiBell, FiShield, FiSave } from 'react-icons/fi';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [emailNotif, setEmailNotif] = useState(true);
  const [allocationAlerts, setAllocationAlerts] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 700));
    toast.success('Settings saved successfully.');
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FiSettings className="text-violet-500" /> System Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">Manage your account and notification preferences</p>
      </div>

      {/* Profile Section */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/40 flex items-center gap-2">
          <FiUser size={14} className="text-violet-400" />
          <h3 className="text-sm font-bold text-slate-200">Account Profile</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Full Name</label>
              <input
                defaultValue={user?.fullName || user?.name || ''}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Email Address</label>
              <input
                defaultValue={user?.email || ''}
                disabled
                className="w-full bg-slate-800/30 border border-slate-700/30 rounded-xl px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Role</label>
            <div className="flex items-center gap-2">
              <FiShield size={13} className="text-violet-400" />
              <span className="text-sm font-semibold text-violet-300">{user?.role || 'Unknown'}</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">Role is managed by administrators and cannot be changed here.</p>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/40 flex items-center gap-2">
          <FiBell size={14} className="text-violet-400" />
          <h3 className="text-sm font-bold text-slate-200">Notifications</h3>
        </div>
        <div className="p-6 space-y-5">
          {[
            { label: 'Email Notifications', sub: 'Receive updates via email', value: emailNotif, setter: setEmailNotif, id: 'settings-email-notif' },
            { label: 'Allocation Alerts', sub: 'Get notified on new asset allocations', value: allocationAlerts, setter: setAllocationAlerts, id: 'settings-alloc-alerts' },
            { label: 'Maintenance Reminders', sub: 'Receive maintenance schedule reminders', value: maintenanceAlerts, setter: setMaintenanceAlerts, id: 'settings-maint-alerts' },
          ].map((toggle) => (
            <div key={toggle.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">{toggle.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{toggle.sub}</p>
              </div>
              <button
                id={toggle.id}
                role="switch"
                aria-checked={toggle.value}
                onClick={() => toggle.setter(!toggle.value)}
                className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 shrink-0 ${toggle.value ? 'bg-violet-600' : 'bg-slate-700'}`}
                style={{ height: '22px' }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4.5 h-4 bg-white rounded-full shadow transition-transform duration-200 ${toggle.value ? 'translate-x-4.5' : 'translate-x-0'}`}
                  style={{ width: '18px', height: '18px', transform: toggle.value ? 'translateX(18px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          id="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all disabled:opacity-60"
        >
          <FiSave size={13} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
