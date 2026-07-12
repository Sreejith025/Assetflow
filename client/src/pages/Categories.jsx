import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { FiTag, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

const Categories = () => {
  const { user } = useContext(AuthContext);
  const canWrite = user?.role === 'Admin' || user?.role === 'Asset Manager';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data.data || []);
    } catch {
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required.'); return; }
    setSubmitting(true);
    try {
      if (editing) {
        await axios.put(`${API_URL}/categories/${editing._id}`, { name, description });
        toast.success('Category updated.');
      } else {
        await axios.post(`${API_URL}/categories`, { name, description });
        toast.success('Category created.');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      toast.success('Category deleted.');
      fetchCategories();
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
            <FiTag className="text-violet-500" /> Asset Categories
          </h2>
          <p className="text-xs text-slate-400 mt-1">Organise assets into logical groupings</p>
        </div>
        {canWrite && (
          <button
            id="categories-create-btn"
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <FiPlus size={14} /> New Category
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800/60 overflow-hidden bg-slate-900/30">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm gap-2">
            <FiTag size={28} className="text-slate-700" />
            <span>No categories found.</span>
          </div>
        ) : (
          <table className="w-full text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-950/20 text-[10px] text-slate-500 uppercase tracking-widest">
                <th className="py-3.5 px-6 text-left">Name</th>
                <th className="py-3.5 px-6 text-left">Description</th>
                {canWrite && <th className="py-3.5 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr key={cat._id} className={`border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors ${i % 2 === 0 ? 'bg-slate-900/10' : ''}`}>
                  <td className="py-3.5 px-6 font-semibold text-slate-200">{cat.name}</td>
                  <td className="py-3.5 px-6 text-slate-400">{cat.description || '—'}</td>
                  {canWrite && (
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all" title="Edit"><FiEdit2 size={13} /></button>
                        <button onClick={() => handleDelete(cat._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all" title="Delete"><FiTrash2 size={13} /></button>
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
              <h3 className="font-bold text-slate-100 text-sm">{editing ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors"><FiX size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition-colors" placeholder="e.g. Laptops" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500/60 transition-colors resize-none" placeholder="Optional description…" />
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

export default Categories;
