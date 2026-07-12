import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FiLogOut, FiMenu, FiBell, FiCheck, FiTrash2, FiX, FiInfo } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Navbar = ({ onMenuClick }) => {
  const { user, logout, updateRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const getRoleBadgeClass = (role) => {
    switch (role) {
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

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load notifications from server. Initializing local sandbox alerts.');
      setNotifications([
        {
          _id: 'mock_notif_1',
          type: 'Asset Allocated',
          title: 'New Asset Assigned',
          message: 'A workstation MacBook Pro 16 has been allocated to you.',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          _id: 'mock_notif_2',
          type: 'Warranty Expiring',
          title: 'Asset Warranty Expiring',
          message: 'Monitor Dell U2723QE (AST-0002) warranty expires in 15 days.',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds for live updates
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle outside clicks to close the notification dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      toast.success('Alert marked as read.');
    } catch (err) {
      // Offline fallback update
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Alert deleted.');
    } catch (err) {
      // Offline fallback update
      setNotifications(prev => prev.filter(n => n._id !== id));
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 md:hidden transition-colors"
        >
          <FiMenu size={20} />
        </button>
        <div>
          <h1 className="text-md font-semibold text-slate-100 tracking-tight">Console</h1>
          <p className="text-[10px] text-slate-500 hidden sm:block">AssetFlow Enterprise Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Icon & Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors relative cursor-pointer"
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-violet-600 border border-slate-900 text-white rounded-full flex items-center justify-center text-[8px] font-black font-sans leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating drop list panel */}
          {showDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-200">
              <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex justify-between items-center">
                <span className="text-xs font-bold tracking-wide">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} Unread
                  </span>
                )}
              </div>

              {/* List body */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-850/60 scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                    <FiInfo size={18} />
                    <p className="text-[10px]">No notifications recorded</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      className={`p-3 transition-colors hover:bg-slate-850/30 flex gap-2.5 items-start relative ${
                        !n.isRead ? 'bg-slate-950/20' : ''
                      }`}
                    >
                      {/* Unread circle badge */}
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 shrink-0"></span>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-[10px] font-bold text-slate-200 block truncate leading-tight">
                          {n.title}
                        </span>
                        <p className="text-[9px] text-slate-450 leading-relaxed break-words">
                          {n.message}
                        </p>
                        <span className="text-[8px] text-slate-600 block">
                          {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Floating actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-center">
                        {!n.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(n._id, e)}
                            title="Mark as read"
                            className="p-1 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-all cursor-pointer"
                          >
                            <FiCheck size={11} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(n._id, e)}
                          title="Delete notification"
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2.5 bg-slate-950/40 border-t border-slate-800/80 text-center">
                <button
                  onClick={() => { setShowDropdown(false); navigate('/notifications'); }}
                  className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors w-full cursor-pointer"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-800/80"></div>

        {/* User profile and logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-300">{user?.fullName || user?.name}</p>
            <select
              value={user?.role || ''}
              onChange={(e) => {
                updateRole(e.target.value);
                toast.success(`Role switched to ${e.target.value}!`);
              }}
              className="bg-slate-900 border border-slate-800 text-[9px] text-slate-300 font-bold px-2 py-0.5 mt-0.5 rounded-full focus:outline-none cursor-pointer hover:border-slate-700 transition-colors"
            >
              <option value="Admin" className="bg-slate-900 text-slate-100">Admin</option>
              <option value="Asset Manager" className="bg-slate-900 text-slate-100">Asset Manager</option>
              <option value="Department Head" className="bg-slate-900 text-slate-100">Department Head</option>
              <option value="Employee" className="bg-slate-900 text-slate-100">Employee</option>
              <option value="Maintenance Team" className="bg-slate-900 text-slate-100">Maintenance Team</option>
            </select>
          </div>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-900/20">
            {user?.fullName || user?.name ? (user.fullName || user.name).split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() : 'U'}
          </div>

          <button 
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer"
            title="Log Out"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
