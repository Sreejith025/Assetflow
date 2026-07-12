import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiSearch, FiFilter, FiPlus, FiEdit2, FiTrash2, 
  FiUpload, FiDownload, FiInfo, FiTag, 
  FiCalendar, FiDollarSign, FiTool, FiX, FiCheckCircle
} from 'react-icons/fi';

const QrIcon = ({ size = 16, className = '', ...props }) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={size} width={size} className={className} {...props}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const API_URL = 'http://localhost:5000/api';

const Assets = () => {
  const { user } = useContext(AuthContext);
  const isWriter = user?.role === 'Admin' || user?.role === 'Asset Manager';

  // Navigation Tabs: 'assets', 'categories', 'models'
  const [activeTab, setActiveTab] = useState('assets');

  // Search, Filters & Pagination States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Core Data Lists
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Control States
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrAsset, setQrAsset] = useState(null);

  // Form Fields
  // Asset Form
  const [serialNumber, setSerialNumber] = useState('');
  const [modelId, setModelId] = useState('');
  const [status, setStatus] = useState('Available');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyDate, setWarrantyDate] = useState('');
  const [vendor, setVendor] = useState('');
  const [cost, setCost] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Category Form
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');

  // Model Form
  const [modelName, setModelName] = useState('');
  const [modelCatId, setModelCatId] = useState('');
  const [modelManufacturer, setModelManufacturer] = useState('');
  const [modelDescription, setModelDescription] = useState('');

  // Local Storage Fallback Mock Database (in case server is offline)
  const getLocalMockDb = (key, defaultVal) => {
    const val = localStorage.getItem(`mock_${key}`);
    return val ? JSON.parse(val) : defaultVal;
  };

  const saveLocalMockDb = (key, data) => {
    localStorage.setItem(`mock_${key}`, JSON.stringify(data));
  };

  const seedMockStorageIfEmpty = () => {
    if (!localStorage.getItem('mock_categories')) {
      const mockCats = [
        { _id: 'mock_cat_workstations', name: 'Workstations', description: 'Workstations and developer laptops.' },
        { _id: 'mock_cat_mobile', name: 'Mobile Devices', description: 'Smartphones and testing tablets.' },
        { _id: 'mock_cat_monitors', name: 'Monitors', description: 'External display panels.' }
      ];
      saveLocalMockDb('categories', mockCats);
    }
    if (!localStorage.getItem('mock_models')) {
      const mockMods = [
        { _id: 'mock_model_mbp16', name: 'MacBook Pro 16"', category: 'mock_cat_workstations', manufacturer: 'Apple', description: 'M3 Pro, 32GB RAM' },
        { _id: 'mock_model_t14', name: 'ThinkPad T14', category: 'mock_cat_workstations', manufacturer: 'Lenovo', description: 'AMD Ryzen 7, 16GB RAM' },
        { _id: 'mock_model_iphone15', name: 'iPhone 15 Pro', category: 'mock_cat_mobile', manufacturer: 'Apple', description: 'A17 Pro SoC' }
      ];
      saveLocalMockDb('models', mockMods);
    }
    if (!localStorage.getItem('mock_assets')) {
      const mockAs = [
        { _id: 'mock_asset_001', assetTag: 'AST-0001', serialNumber: 'SN-APL-MBP9988', model: 'mock_model_mbp16', status: 'Allocated', purchaseDate: '2025-01-10', warrantyDate: '2028-01-10', vendor: 'Apple Store', cost: 2499, image: '', qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="30" height="30" fill="black"/><rect x="60" y="10" width="30" height="30" fill="black"/><rect x="10" y="60" width="30" height="30" fill="black"/><rect x="70" y="70" width="20" height="20" fill="black"/><rect x="50" y="50" width="10" height="10" fill="black"/></svg>' },
        { _id: 'mock_asset_002', assetTag: 'AST-0002', serialNumber: 'SN-LEN-T148877', model: 'mock_model_t14', status: 'Available', purchaseDate: '2025-02-15', warrantyDate: '2027-02-15', vendor: 'CDW Express', cost: 1299, image: '', qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="30" height="30" fill="black"/><rect x="60" y="10" width="30" height="30" fill="black"/><rect x="10" y="60" width="30" height="30" fill="black"/><rect x="70" y="70" width="20" height="20" fill="black"/><rect x="50" y="50" width="10" height="10" fill="black"/></svg>' },
        { _id: 'mock_asset_003', assetTag: 'AST-0003', serialNumber: 'SN-APL-IPH7766', model: 'mock_model_iphone15', status: 'Maintenance', purchaseDate: '2025-03-01', warrantyDate: '2026-03-01', vendor: 'Verizon', cost: 999, image: '', qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="30" height="30" fill="black"/><rect x="60" y="10" width="30" height="30" fill="black"/><rect x="10" y="60" width="30" height="30" fill="black"/><rect x="70" y="70" width="20" height="20" fill="black"/><rect x="50" y="50" width="10" height="10" fill="black"/></svg>' }
      ];
      saveLocalMockDb('assets', mockAs);
    }
  };

  useEffect(() => {
    seedMockStorageIfEmpty();
    fetchInitialData();
  }, [activeTab, search, statusFilter, categoryFilter, modelFilter, page]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'assets') {
        const res = await axios.get(`${API_URL}/assets`, {
          params: { search, status: statusFilter, category: categoryFilter, model: modelFilter, page, limit }
        });
        setAssets(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || res.data.count);
      }
      
      // Load supporting lists
      const catsRes = await axios.get(`${API_URL}/categories`);
      setCategories(catsRes.data.data);

      const modsRes = await axios.get(`${API_URL}/models`);
      setModels(modsRes.data.data);

    } catch (err) {
      console.warn('Network error or server offline. Using localStorage sandbox.');
      // Local Storage Sandbox fallback
      const localCats = getLocalMockDb('categories', []);
      setCategories(localCats);

      const localModels = getLocalMockDb('models', []);
      const processedModels = localModels.map(m => {
        const cat = localCats.find(c => c._id === m.category);
        return { ...m, category: cat ? { _id: cat._id, name: cat.name } : null };
      });
      setModels(processedModels);

      if (activeTab === 'assets') {
        let localAssets = getLocalMockDb('assets', []);
        
        // Search & Filters locally
        if (search) {
          const term = search.toLowerCase();
          localAssets = localAssets.filter(a => {
            const m = processedModels.find(item => item._id === a.model);
            return (
              a.assetTag.toLowerCase().includes(term) ||
              a.serialNumber.toLowerCase().includes(term) ||
              a.vendor.toLowerCase().includes(term) ||
              (m && (m.name.toLowerCase().includes(term) || m.manufacturer.toLowerCase().includes(term)))
            );
          });
        }

        if (statusFilter) {
          localAssets = localAssets.filter(a => a.status === statusFilter);
        }

        if (categoryFilter) {
          localAssets = localAssets.filter(a => {
            const m = processedModels.find(item => item._id === a.model);
            return m && m.category && m.category._id === categoryFilter;
          });
        }

        if (modelFilter) {
          localAssets = localAssets.filter(a => a.model === modelFilter);
        }

        const skip = (page - 1) * limit;
        const pageCount = Math.ceil(localAssets.length / limit) || 1;
        setTotalCount(localAssets.length);
        setTotalPages(pageCount);

        const paginated = localAssets.slice(skip, skip + limit).map(a => {
          const m = processedModels.find(item => item._id === a.model);
          return { ...a, model: m || null };
        });

        setAssets(paginated);
      }
    } finally {
      setLoading(false);
    }
  };

  // Form Resetters
  const resetAssetForm = () => {
    setSerialNumber('');
    setModelId('');
    setStatus('Available');
    setPurchaseDate('');
    setWarrantyDate('');
    setVendor('');
    setCost('');
    setImageFile(null);
    setImagePreview('');
    setSelectedAsset(null);
  };

  const resetCategoryForm = () => {
    setCatName('');
    setCatDescription('');
    setSelectedCategory(null);
  };

  const resetModelForm = () => {
    setModelName('');
    setModelCatId('');
    setModelManufacturer('');
    setModelDescription('');
    setSelectedModel(null);
  };

  // Asset CRUD Handlers
  const handleOpenAssetModal = (asset = null) => {
    if (asset) {
      setSelectedAsset(asset);
      setSerialNumber(asset.serialNumber);
      setModelId(asset.model?._id || asset.model || '');
      setStatus(asset.status);
      setPurchaseDate(asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '');
      setWarrantyDate(asset.warrantyDate ? asset.warrantyDate.split('T')[0] : '');
      setVendor(asset.vendor);
      setCost(asset.cost);
      setImagePreview(asset.image ? `http://localhost:5000${asset.image}` : '');
    } else {
      resetAssetForm();
      if (models.length > 0) setModelId(models[0]._id);
    }
    setAssetModalOpen(true);
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!serialNumber || !modelId || !purchaseDate || !warrantyDate || !vendor || !cost) {
      toast.error('Please enter all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('serialNumber', serialNumber);
    formData.append('model', modelId);
    formData.append('status', status);
    formData.append('purchaseDate', purchaseDate);
    formData.append('warrantyDate', warrantyDate);
    formData.append('vendor', vendor);
    formData.append('cost', cost);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (selectedAsset) {
        // Edit Asset
        await axios.put(`${API_URL}/assets/${selectedAsset._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Asset updated successfully!');
      } else {
        // Create Asset
        await axios.post(`${API_URL}/assets`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Asset added successfully!');
      }
      setAssetModalOpen(false);
      resetAssetForm();
      fetchInitialData();
    } catch (err) {
      // Local Storage Fallback
      if (err.response) {
        toast.error(err.response.data?.message || 'Error occurred');
      } else {
        const localAssets = getLocalMockDb('assets', []);
        
        if (selectedAsset) {
          // Edit local
          const index = localAssets.findIndex(a => a._id === selectedAsset._id);
          if (index !== -1) {
            localAssets[index] = {
              ...localAssets[index],
              serialNumber,
              model: modelId,
              status,
              purchaseDate,
              warrantyDate,
              vendor,
              cost: parseFloat(cost)
            };
            saveLocalMockDb('assets', localAssets);
            toast.success('Asset updated in local sandbox!');
          }
        } else {
          // Create local
          const duplicate = localAssets.find(a => a.serialNumber.toLowerCase() === serialNumber.toLowerCase().trim());
          if (duplicate) {
            toast.error('Serial number already exists in local sandbox.');
            return;
          }
          const nextTag = `AST-${String(localAssets.length + 1).padStart(4, '0')}`;
          const newAsset = {
            _id: 'mock_asset_' + Math.random().toString(36).substr(2, 9),
            assetTag: nextTag,
            serialNumber,
            model: modelId,
            status,
            purchaseDate,
            warrantyDate,
            vendor,
            cost: parseFloat(cost),
            image: '',
            qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="30" height="30" fill="black"/><rect x="60" y="10" width="30" height="30" fill="black"/><rect x="10" y="60" width="30" height="30" fill="black"/><rect x="70" y="70" width="20" height="20" fill="black"/><rect x="50" y="50" width="10" height="10" fill="black"/></svg>'
          };
          localAssets.push(newAsset);
          saveLocalMockDb('assets', localAssets);
          toast.success('Asset created in local sandbox!');
        }
        setAssetModalOpen(false);
        resetAssetForm();
        fetchInitialData();
      }
    }
  };

  const handleAssetDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await axios.delete(`${API_URL}/assets/${id}`);
      toast.success('Asset deleted successfully!');
      fetchInitialData();
    } catch (err) {
      // Local Storage Fallback
      const localAssets = getLocalMockDb('assets', []);
      const filtered = localAssets.filter(a => a._id !== id);
      saveLocalMockDb('assets', filtered);
      toast.success('Asset deleted from local sandbox.');
      fetchInitialData();
    }
  };

  // Image Upload Previews
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Category CRUD Handlers
  const handleOpenCatModal = (cat = null) => {
    if (cat) {
      setSelectedCategory(cat);
      setCatName(cat.name);
      setCatDescription(cat.description || '');
    } else {
      resetCategoryForm();
    }
    setCatModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!catName) {
      toast.error('Category name is required.');
      return;
    }

    const payload = { name: catName, description: catDescription };
    try {
      if (selectedCategory) {
        await axios.put(`${API_URL}/categories/${selectedCategory._id}`, payload);
        toast.success('Category updated successfully!');
      } else {
        await axios.post(`${API_URL}/categories`, payload);
        toast.success('Category created successfully!');
      }
      setCatModalOpen(false);
      resetCategoryForm();
      fetchInitialData();
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.message || 'Error occurred');
      } else {
        const localCats = getLocalMockDb('categories', []);
        if (selectedCategory) {
          const idx = localCats.findIndex(c => c._id === selectedCategory._id);
          if (idx !== -1) {
            localCats[idx] = { ...localCats[idx], name: catName, description: catDescription };
            saveLocalMockDb('categories', localCats);
            toast.success('Category updated locally!');
          }
        } else {
          const dup = localCats.find(c => c.name.toLowerCase() === catName.toLowerCase().trim());
          if (dup) {
            toast.error('Category name already exists.');
            return;
          }
          localCats.push({
            _id: 'mock_cat_' + Math.random().toString(36).substr(2, 9),
            name: catName,
            description: catDescription
          });
          saveLocalMockDb('categories', localCats);
          toast.success('Category created locally!');
        }
        setCatModalOpen(false);
        resetCategoryForm();
        fetchInitialData();
      }
    }
  };

  const handleCategoryDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      toast.success('Category deleted successfully!');
      fetchInitialData();
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.message || 'Delete failed.');
      } else {
        const localMods = getLocalMockDb('models', []);
        const references = localMods.filter(m => m.category === id);
        if (references.length > 0) {
          toast.error('Cannot delete category containing registered asset models.');
          return;
        }
        const localCats = getLocalMockDb('categories', []);
        const filtered = localCats.filter(c => c._id !== id);
        saveLocalMockDb('categories', filtered);
        toast.success('Category deleted locally.');
        fetchInitialData();
      }
    }
  };

  // Model CRUD Handlers
  const handleOpenModelModal = (model = null) => {
    if (model) {
      setSelectedModel(model);
      setModelName(model.name);
      setModelCatId(model.category?._id || model.category || '');
      setModelManufacturer(model.manufacturer);
      setModelDescription(model.description || '');
    } else {
      resetModelForm();
      if (categories.length > 0) setModelCatId(categories[0]._id);
    }
    setModelModalOpen(true);
  };

  const handleModelSubmit = async (e) => {
    e.preventDefault();
    if (!modelName || !modelCatId || !modelManufacturer) {
      toast.error('Model name, category, and manufacturer are required.');
      return;
    }

    const payload = {
      name: modelName,
      category: modelCatId,
      manufacturer: modelManufacturer,
      description: modelDescription
    };

    try {
      if (selectedModel) {
        await axios.put(`${API_URL}/models/${selectedModel._id}`, payload);
        toast.success('Model updated successfully!');
      } else {
        await axios.post(`${API_URL}/models`, payload);
        toast.success('Model created successfully!');
      }
      setModelModalOpen(false);
      resetModelForm();
      fetchInitialData();
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.message || 'Error occurred');
      } else {
        const localModels = getLocalMockDb('models', []);
        if (selectedModel) {
          const idx = localModels.findIndex(m => m._id === selectedModel._id);
          if (idx !== -1) {
            localModels[idx] = {
              ...localModels[idx],
              name: modelName,
              category: modelCatId,
              manufacturer: modelManufacturer,
              description: modelDescription
            };
            saveLocalMockDb('models', localModels);
            toast.success('Model updated locally!');
          }
        } else {
          const dup = localModels.find(m => m.name.toLowerCase() === modelName.toLowerCase().trim());
          if (dup) {
            toast.error('Model name already exists.');
            return;
          }
          localModels.push({
            _id: 'mock_model_' + Math.random().toString(36).substr(2, 9),
            name: modelName,
            category: modelCatId,
            manufacturer: modelManufacturer,
            description: modelDescription
          });
          saveLocalMockDb('models', localModels);
          toast.success('Model created locally!');
        }
        setModelModalOpen(false);
        resetModelForm();
        fetchInitialData();
      }
    }
  };

  const handleModelDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset model?')) return;
    try {
      await axios.delete(`${API_URL}/models/${id}`);
      toast.success('Model deleted successfully!');
      fetchInitialData();
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.message || 'Delete failed.');
      } else {
        const localAssets = getLocalMockDb('assets', []);
        const references = localAssets.filter(a => a.model === id);
        if (references.length > 0) {
          toast.error('Cannot delete model which has registered assets associated.');
          return;
        }
        const localModels = getLocalMockDb('models', []);
        const filtered = localModels.filter(m => m._id !== id);
        saveLocalMockDb('models', filtered);
        toast.success('Model deleted locally.');
        fetchInitialData();
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Allocated':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Maintenance':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: // Retired
        return 'bg-slate-500/15 text-slate-400 border-slate-700/50';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FiTag className="text-violet-500" /> Asset Management Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">Audit, assign, and organize hardware and software categories</p>
        </div>

        {isWriter && (
          <div>
            {activeTab === 'assets' && (
              <button 
                onClick={() => handleOpenAssetModal()}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <FiPlus size={14} /> Add Asset
              </button>
            )}
            {activeTab === 'categories' && (
              <button 
                onClick={() => handleOpenCatModal()}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <FiPlus size={14} /> Add Category
              </button>
            )}
            {activeTab === 'models' && (
              <button 
                onClick={() => handleOpenModelModal()}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <FiPlus size={14} /> Add Asset Model
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800/80 flex gap-4">
        {['assets', 'categories', 'models'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`
              pb-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 px-1
              ${activeTab === tab 
                ? 'border-violet-500 text-violet-400 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-350'
              }
            `}
          >
            {tab === 'assets' ? 'Assets List' : tab === 'categories' ? 'Categories' : 'Asset Models'}
          </button>
        ))}
      </div>

      {/* TAB 1: ASSETS LIST */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          
          {/* Search, filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900/20 border border-slate-850 p-4 rounded-2xl">
            <div className="relative col-span-1 sm:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <FiSearch size={14} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search Tag, Serial, Model, Vendor..."
                className="w-full bg-slate-950/40 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full bg-slate-950/40 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-400"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Allocated">Allocated</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-full bg-slate-950/40 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 focus:outline-none rounded-xl px-3 py-2 text-xs text-slate-400"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List/Grid display */}
          {loading ? (
            <div className="h-60 flex items-center justify-center">
              <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
            </div>
          ) : assets.length === 0 ? (
            <div className="glass-card rounded-2xl border border-slate-850 p-12 text-center text-slate-500">
              <FiInfo className="mx-auto mb-3 text-slate-600" size={32} />
              <p className="text-xs">No assets matching your search/filters were found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div key={asset._id} className="glass-card border border-slate-850 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between space-y-4">
                  {/* Photo & Tag Header */}
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {asset.image ? (
                        <img 
                          src={asset.image.startsWith('http') ? asset.image : `http://localhost:5000${asset.image}`}
                          alt={asset.assetTag}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = ''; }} // Fail gracefully
                        />
                      ) : (
                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">No Pic</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(asset.status)}`}>
                        {asset.status}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 mt-1 truncate">{asset.model?.name || 'Unknown Model'}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{asset.model?.manufacturer || 'Unknown Manufacturer'}</p>
                    </div>
                  </div>

                  {/* Metadata block */}
                  <div className="grid grid-cols-2 gap-y-2 border-t border-b border-slate-850/60 py-3 text-[10px]">
                    <div>
                      <span className="text-slate-500 block uppercase tracking-wider font-semibold">Asset Tag</span>
                      <span className="text-slate-200 font-mono font-semibold">{asset.assetTag}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase tracking-wider font-semibold">Serial Number</span>
                      <span className="text-slate-200 font-mono font-semibold truncate block" title={asset.serialNumber}>{asset.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase tracking-wider font-semibold">Cost Value</span>
                      <span className="text-slate-200 font-semibold">${asset.cost?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase tracking-wider font-semibold">Warranty Exp</span>
                      <span className="text-slate-200">{asset.warrantyDate ? asset.warrantyDate.split('T')[0] : 'N/A'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setQrAsset(asset); setQrModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-850/40 rounded-lg transition-colors cursor-pointer"
                        title="View QR Code"
                      >
                        <QrIcon size={13} />
                      </button>
                    </div>

                    {isWriter && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenAssetModal(asset)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 rounded transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <FiEdit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleAssetDelete(asset._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center border-t border-slate-850 pt-4 text-xs">
              <span className="text-slate-500">Total: <span className="text-slate-300 font-semibold">{totalCount}</span> Assets</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(prev => prev - 1)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 hover:bg-slate-850 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Prev
                </button>
                <span className="text-slate-400">Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(prev => prev + 1)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 hover:bg-slate-850 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4 max-w-4xl">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
            </div>
          ) : categories.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500 border border-slate-850">
              <p className="text-xs">No asset categories exist.</p>
            </div>
          ) : (
            <div className="glass-card border border-slate-850 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Name</th>
                      <th className="p-4">Description</th>
                      {isWriter && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {categories.map(c => (
                      <tr key={c._id} className="hover:bg-slate-900/10 text-slate-200">
                        <td className="p-4 font-bold text-slate-100">{c.name}</td>
                        <td className="p-4 text-slate-400">{c.description || '—'}</td>
                        {isWriter && (
                          <td className="p-4 text-right flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenCatModal(c)}
                              className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                            >
                              <FiEdit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleCategoryDelete(c._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSET MODELS */}
      {activeTab === 'models' && (
        <div className="space-y-4 max-w-4xl">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
            </div>
          ) : models.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500 border border-slate-850">
              <p className="text-xs">No asset models exist.</p>
            </div>
          ) : (
            <div className="glass-card border border-slate-850 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Model Name</th>
                      <th className="p-4">Manufacturer</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Details</th>
                      {isWriter && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {models.map(m => (
                      <tr key={m._id} className="hover:bg-slate-900/10 text-slate-200">
                        <td className="p-4 font-bold text-slate-100">{m.name}</td>
                        <td className="p-4 text-slate-350">{m.manufacturer}</td>
                        <td className="p-4">
                          <span className="bg-violet-600/10 text-violet-400 border border-violet-500/10 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {m.category?.name || m.category || '—'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 truncate max-w-xs">{m.description || '—'}</td>
                        {isWriter && (
                          <td className="p-4 text-right flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenModelModal(m)}
                              className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                            >
                              <FiEdit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleModelDelete(m._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT ASSET */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setAssetModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div className="p-6 border-b border-slate-850">
              <h3 className="text-base font-bold text-slate-100">{selectedAsset ? 'Edit Platform Asset' : 'Add New Platform Asset'}</h3>
              <p className="text-xs text-slate-500 mt-1">Populate unique serial, manufacturer, status, dates, and value</p>
            </div>

            <form onSubmit={handleAssetSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Serial Number *</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-AAPL-MBP9922"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Model Selection *</label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-400"
                    required
                  >
                    {models.length === 0 ? (
                      <option value="">No models created yet</option>
                    ) : (
                      models.map(m => (
                        <option key={m._id} value={m._id}>{m.manufacturer} - {m.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Operational Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-450"
                  >
                    <option value="Available">Available</option>
                    <option value="Allocated">Allocated</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cost Value (USD) *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <FiDollarSign size={13} />
                    </span>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="e.g. 1999"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Purchase Date *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <FiCalendar size={13} />
                    </span>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-350"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Warranty Expiration *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                      <FiCalendar size={13} />
                    </span>
                    <input
                      type="date"
                      value={warrantyDate}
                      onChange={(e) => setWarrantyDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-350"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vendor *</label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Apple Business Operations / CDW Logistics"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                  required
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2 border-t border-slate-850 pt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Upload Asset Image</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FiUpload size={20} className="text-slate-700" />
                    )}
                  </div>
                  <div className="flex-1 w-full text-left">
                    <input
                      type="file"
                      accept="image/*"
                      id="asset-image-file"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label 
                      htmlFor="asset-image-file"
                      className="inline-flex items-center gap-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer transition-colors"
                    >
                      <FiUpload size={13} /> Select Image
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1.5">Support images under 5MB only.</p>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="border-t border-slate-850 pt-5 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setAssetModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {selectedAsset ? 'Save Changes' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT CATEGORY */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setCatModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div className="p-6 border-b border-slate-850">
              <h3 className="text-base font-bold text-slate-100">{selectedCategory ? 'Edit Asset Category' : 'Add Asset Category'}</h3>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Category Name *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Workstations, Mobile, Printers..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Description</label>
                <textarea
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Summarize the resource categories..."
                  className="w-full h-24 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 resize-none"
                />
              </div>

              <div className="border-t border-slate-850 pt-5 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT MODEL */}
      {modelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setModelModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div className="p-6 border-b border-slate-850">
              <h3 className="text-base font-bold text-slate-100">{selectedModel ? 'Edit Asset Model' : 'Add Asset Model'}</h3>
            </div>

            <form onSubmit={handleModelSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Model Name *</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. MacBook Pro 16, ThinkPad T14"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Manufacturer *</label>
                <input
                  type="text"
                  value={modelManufacturer}
                  onChange={(e) => setModelManufacturer(e.target.value)}
                  placeholder="e.g. Apple, Lenovo, Dell"
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Category Assignment *</label>
                <select
                  value={modelCatId}
                  onChange={(e) => setModelCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-400"
                  required
                >
                  {categories.length === 0 ? (
                    <option value="">No categories created yet</option>
                  ) : (
                    categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Specifications / Description</label>
                <textarea
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  placeholder="Input detailed CPU/GPU specifications..."
                  className="w-full h-24 bg-slate-950 border border-slate-850 focus:border-violet-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-200 resize-none"
                />
              </div>

              <div className="border-t border-slate-850 pt-5 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setModelModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: QR CODE VIEWER */}
      {qrModalOpen && qrAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative flex flex-col items-center text-center space-y-6">
            <button 
              onClick={() => { setQrModalOpen(false); setQrAsset(null); }}
              className="absolute top-4 right-4 p-1.5 text-slate-450 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center justify-center gap-1.5">
                <QrIcon className="text-violet-500" size={16} /> Asset Tag QR Code
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Unique audit passport for physical tracking</p>
            </div>

            {/* QR display box */}
            <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200 w-48 h-48 flex items-center justify-center">
              {qrAsset.qrCode ? (
                <img 
                  src={qrAsset.qrCode} 
                  alt={qrAsset.assetTag}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-slate-400">Loading code...</span>
              )}
            </div>

            {/* details panel */}
            <div className="w-full bg-slate-950/50 border border-slate-850 p-4 rounded-xl text-left space-y-1.5 text-[11px]">
              <div>
                <span className="text-slate-500">Asset Identifier Tag:</span>
                <span className="text-slate-200 font-mono font-bold ml-1.5">{qrAsset.assetTag}</span>
              </div>
              <div>
                <span className="text-slate-500">Manufacturer Model:</span>
                <span className="text-slate-200 font-bold ml-1.5">{qrAsset.model?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500">Serial Register:</span>
                <span className="text-slate-200 font-mono text-slate-300 ml-1.5 truncate max-w-[150px] inline-block">{qrAsset.serialNumber}</span>
              </div>
            </div>

            {/* download button */}
            {qrAsset.qrCode && (
              <a
                href={qrAsset.qrCode}
                download={`QR_${qrAsset.assetTag}.png`}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-750 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <FiDownload size={14} /> Download QR Code Image
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Assets;
