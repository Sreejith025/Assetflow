import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { FiCpu, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const AssetModels = () => {
  const { user } = useContext(AuthContext);
  const canWrite = user?.role === 'Admin' || user?.role === 'Asset Manager';

  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/models`),
        axios.get(`${API_URL}/categories`),
      ]);
      setModels(modRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch {
      toast.error('Failed to load asset models.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName(''); setManufacturer(''); setCategory('');
    setIsModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setName(m.name);
    setManufacturer(m.manufacturer || '');
    setCategory(m.category?._id || m.category || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required.'); return; }
    setSubmitting(true);
    try {
      const payload = { name, manufacturer, category };
      if (editing) {
        await axios.put(`${API_URL}/models/${editing._id}`, payload);
        toast.success('Model updated.');
      } else {
        await axios.post(`${API_URL}/models`, payload);
        toast.success('Model created.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this model?')) return;
    try {
      await axios.delete(`${API_URL}/models/${id}`);
      toast.success('Model deleted.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FiCpu className="text-violet-500" /> Asset Models
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage hardware and software model definitions</p>
        </div>
        {canWrite && (
          <button
            id="asset-models-create-btn"
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <FiPlus size={14} /> New Model
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/60 overflow-hidden bg-slate-900/30">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading…</div>
        ) : models.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm gap-2">
            <FiCpu size={28} className="text-slate-700" />
            <span>No models found.</span>
          </div>
        ) : (
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/20 text-[10px] text-slate-500 uppercase tracking-widest">
                <th className="py-3.5 px-6 text-left">Model Name</th>
                <th className="py-3.5 px-6 text-left">Manufacturer</th>
                <th className="py-3.5 px-6 text-left">Category</th>
                {canWrite && <th className="py-3.5 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => (
                <tr key={m._id} className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${i % 2 === 0 ? 'bg-slate-900/10' : ''}`}>
                  <td className="py-3.5 px-6 font-semibold text-slate-200">{m.name}</td>
                  <td className="py-3.5 px-6 text-slate-400">{m.manufacturer || '—'}</td>
                  <td className="py-3.5 px-6">
                    {m.category ? (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {m.category?.name || m.category}
                      </span>
                    ) : '—'}
                  </td>
                  {canWrite && (
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all" title="Edit"><FiEdit2 size={13} /></button>
                        <button onClick={() => handleDelete(m._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all" title="Delete"><FiTrash2 size={13} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
              <h3 className="font-bold text-slate-100 text-sm">{editing ? 'Edit Model' : 'New Model'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors"><FiX size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Model Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition-colors" placeholder="e.g. ThinkPad X1 Carbon" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Manufacturer</label>
                <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition-colors" placeholder="e.g. Lenovo" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition-colors">
                  <option value="">— Select Category —</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-700/50 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? 'Saving…' : (<><FiCheck size={13} /> {editing ? 'Update' : 'Create'}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetModels;
