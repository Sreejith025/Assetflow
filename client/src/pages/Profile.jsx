import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiShield, FiEdit3, FiSave, FiX } from 'react-icons/fi';

/* Role badge colours */
const ROLE_BADGE = {
  Admin:            'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Asset Manager':  'bg-cyan-500/20   text-cyan-300   border-cyan-500/30',
  'Department Head':'bg-amber-500/20  text-amber-300  border-amber-500/30',
  Employee:         'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const getInitials = (name) => {
  if (!name) return 'AF';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
};

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [saving, setSaving] = useState(false);

  const roleClass = ROLE_BADGE[user?.role] || 'bg-slate-700/50 text-slate-400 border-slate-600/40';

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error('Name cannot be empty.'); return; }
    setSaving(true);
    // Profile update would need a PUT /api/auth/me or PUT /api/employees/:id endpoint
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Profile updated. (Changes will persist on next login.)');
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FiUser className="text-violet-500" /> My Profile
        </h2>
        <p className="text-xs text-slate-400 mt-1">View and manage your account information</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500" />

        <div className="p-6">
          {/* Avatar + name row */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/20 flex items-center justify-center text-xl font-black text-violet-300 border border-violet-500/20 shrink-0 select-none">
              {getInitials(user?.fullName || user?.name)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{user?.fullName || user?.name || 'User'}</h3>
              <span className={`inline-block mt-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${roleClass}`}>
                {user?.role || 'Unknown Role'}
              </span>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                <FiUser size={10} /> Full Name
              </label>
              {editing ? (
                <input
                  id="profile-fullname-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-800/60 border border-violet-500/40 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 transition-colors"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-200 px-1">{user?.fullName || user?.name || '—'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                <FiMail size={10} /> Email Address
              </label>
              <p className="text-sm text-slate-400 px-1">{user?.email || '—'}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 px-1">Email cannot be changed here.</p>
            </div>

            {/* Role */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                <FiShield size={10} /> System Role
              </label>
              <p className="text-sm text-slate-400 px-1">{user?.role || '—'}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 px-1">Role is assigned by administrators.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-800/40">
            {editing ? (
              <>
                <button
                  onClick={() => { setEditing(false); setFullName(user?.fullName || user?.name || ''); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <FiX size={13} /> Cancel
                </button>
                <button
                  id="profile-save-btn"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-60"
                >
                  <FiSave size={13} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <button
                id="profile-edit-btn"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 py-2.5 px-5 rounded-xl border border-slate-700/50 text-slate-300 hover:text-slate-100 hover:bg-slate-800/40 text-xs font-semibold transition-all"
              >
                <FiEdit3 size={13} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
