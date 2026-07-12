import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiShield, FiEdit3, FiSave, FiX, FiPhone, FiLayers, FiCamera } from 'react-icons/fi';

const ROLE_BADGE = {
  Admin:            'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'Asset Manager':  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Department Head':'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Employee:         'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Maintenance Team': 'bg-orange-500/20 text-orange-300 border-orange-500/30'
};

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync details from context on load
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '+1 (555) 019-2834');
      setAvatar(user.avatar || localStorage.getItem(`avatar_${user.id || user._id}`) || '');
    }
  }, [user]);

  const roleClass = ROLE_BADGE[user?.role] || 'bg-slate-700/50 text-slate-400 border-slate-600/40';

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Image size must be less than 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        localStorage.setItem(`avatar_${user.id || user._id}`, reader.result);
        toast.success('Avatar uploaded successfully.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setSaving(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 600));
    // Persist mock locally
    localStorage.setItem(`fullName_${user.id || user._id}`, fullName);
    localStorage.setItem(`phone_${user.id || user._id}`, phone);
    toast.success('Profile settings updated successfully!');
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-6 max-w-xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FiUser className="text-violet-500" /> My Profile
        </h2>
        <p className="text-xs text-slate-400 mt-1">Manage corporate settings, contact details, and account preferences</p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 overflow-hidden shadow-2xl relative">
        <div className="h-1.5 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500" />

        <div className="p-6 space-y-6">
          {/* Avatar Area */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-850">
            <div className="relative group shrink-0">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Profile Avatar" 
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-violet-500/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-650/20 flex items-center justify-center text-2xl font-black text-violet-300 border border-violet-500/20 select-none">
                  {fullName ? fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'AF'}
                </div>
              )}
              
              {/* Uploader overlay */}
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 bg-slate-950/70 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-200 cursor-pointer transition-opacity"
              >
                <FiCamera size={18} />
              </label>
              <input 
                type="file" 
                id="avatar-upload" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </div>

            <div className="text-center sm:text-left space-y-2">
              <h3 className="text-base font-extrabold text-slate-100 tracking-tight">
                {fullName || user?.fullName || 'AssetFlow User'}
              </h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${roleClass}`}>
                  {user?.role || 'Staff'}
                </span>
                {user?.department && (
                  <span className="bg-slate-850 text-slate-400 border border-slate-800 text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <FiLayers size={10} /> {user.department.name || user.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 text-xs">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                <FiUser size={12} className="text-slate-500" /> Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500/80 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none transition-colors"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-200 py-1">{fullName || '—'}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                <FiMail size={12} className="text-slate-500" /> Email Address
              </label>
              <p className="text-sm text-slate-400 py-1 font-semibold">{user?.email || '—'}</p>
              <span className="text-[9px] text-slate-550 block text-slate-500">Corporate login email is non-modifiable</span>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                <FiPhone size={12} className="text-slate-500" /> Phone Contact
              </label>
              {editing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500/80 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none transition-colors"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-200 py-1">{phone || '—'}</p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                <FiLayers size={12} className="text-slate-500" /> Division / Department
              </label>
              <p className="text-sm text-slate-400 py-1 font-semibold">
                {user?.department?.name ? `${user.department.name} (${user.department.code || 'DEPT'})` : (user?.department || 'Unassigned Division')}
              </p>
              <span className="text-[9px] text-slate-550 block text-slate-500">Contact admin to modify department mapping</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-5 border-t border-slate-850/80">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setFullName(user?.fullName || ''); setPhone(user?.phone || '+1 (555) 019-2834'); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 text-xs font-semibold transition-all cursor-pointer"
                >
                  <FiX size={13} className="inline mr-1" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-60 cursor-pointer"
                >
                  <FiSave size={13} className="inline mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 py-2.5 px-5 rounded-xl border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-850 text-xs font-semibold transition-all cursor-pointer"
              >
                <FiEdit3 size={13} /> Edit Profile Info
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
