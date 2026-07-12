import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiBell, FiCheck, FiCheckSquare, FiTrash2, FiClock, 
  FiTool, FiCheckCircle, FiShield, FiInfo, FiLayers 
} from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread | allocation | maintenance | approval

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setNotifications(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load notifications list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      toast.success('Alert marked as read');
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All alerts marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Alert deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  // Helper to render type icons
  const getTypeIcon = (type) => {
    switch (type) {
      case 'Asset Allocated':
        return <FiCheckCircle className="text-sky-400" size={16} />;
      case 'Asset Returned':
        return <FiInfo className="text-emerald-450 text-emerald-400" size={16} />;
      case 'Asset Transfer':
        return <FiLayers className="text-violet-400" size={16} />;
      case 'Maintenance Approved':
        return <FiTool className="text-amber-400" size={16} />;
      case 'Warranty Expiring':
        return <FiClock className="text-rose-400" size={16} />;
      default:
        return <FiBell className="text-slate-400" size={16} />;
    }
  };

  // Filter logic
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'allocation') return n.type === 'Asset Allocated';
    if (filter === 'maintenance') return n.type === 'Maintenance Approved' || n.type === 'Warranty Expiring';
    if (filter === 'approval') return n.type === 'Asset Returned' || n.type === 'Asset Transfer';
    return true; // 'all'
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FiBell className="text-violet-500" /> Notifications Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage transactional updates, requests status, and warranty alerts</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold py-2 px-4 rounded-xl border border-slate-700/60 shadow-md transition-all cursor-pointer"
          >
            <FiCheckSquare size={14} /> Mark All Read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-850 pb-px">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'allocation', label: 'Allocations' },
          { id: 'maintenance', label: 'Maintenance' },
          { id: 'approval', label: 'Approvals & Returns' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              filter === tab.id
                ? 'border-violet-500 text-violet-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Body */}
      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="glass-card rounded-2xl border border-slate-850 p-12 text-center text-slate-500">
          <FiInfo className="mx-auto mb-3 text-slate-650" size={32} />
          <p className="text-xs">No notifications found matching your selection.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(n => (
            <div
              key={n._id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                !n.isRead
                  ? 'bg-slate-900/40 border-violet-500/20 shadow-md'
                  : 'bg-slate-900/10 border-slate-850 hover:bg-slate-900/20'
              }`}
            >
              <div className="p-2 bg-slate-950/40 rounded-xl shrink-0 mt-0.5">
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200 block truncate leading-tight">
                    {n.title}
                  </span>
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-3xl">
                  {n.message}
                </p>
                <span className="text-[9px] text-slate-550 text-slate-500 block font-mono">
                  {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-center">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    title="Mark as read"
                    className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all cursor-pointer"
                  >
                    <FiCheck size={12} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n._id)}
                  title="Delete alert"
                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
