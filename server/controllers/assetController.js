const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Asset = require('../models/Asset');
const AssetModel = require('../models/AssetModel');
const AssetCategory = require('../models/AssetCategory');
const mockStorage = require('../config/mockStorage');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all assets with search, filter, pagination
// @route   GET /api/assets
// @access  Private (All authenticated users)
exports.getAssets = async (req, res) => {
  const { search, status, category, model, page = 1, limit = 10 } = req.query;

  try {
    if (isDbConnected()) {
      let query = {};

      // Search filters (tag, serial, vendor, model name, category name)
      if (search) {
        const regex = new RegExp(search.trim(), 'i');

        // Categories matching search
        const matchingCategories = await AssetCategory.find({ name: regex }).select('_id');
        const categoryIds = matchingCategories.map(c => c._id);

        // Models matching search OR categoryIds
        const matchingModels = await AssetModel.find({
          $or: [
            { name: regex },
            { manufacturer: regex },
            { category: { $in: categoryIds } }
          ]
        }).select('_id');
        const modelIds = matchingModels.map(m => m._id);

        query.$or = [
          { assetTag: regex },
          { serialNumber: regex },
          { vendor: regex },
          { model: { $in: modelIds } }
        ];
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Model or Category filter
      if (model) {
        if (mongoose.Types.ObjectId.isValid(model)) {
          query.model = model;
        } else {
          query.model = new mongoose.Types.ObjectId();
        }
      } else if (category) {
        if (mongoose.Types.ObjectId.isValid(category)) {
          const modelsInCategory = await AssetModel.find({ category }).select('_id');
          const modelIds = modelsInCategory.map(m => m._id);
          query.model = { $in: modelIds };
        } else {
          query.model = { $in: [] };
        }
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const total = await Asset.countDocuments(query);
      const assets = await Asset.find(query)
        .populate({
          path: 'model',
          populate: {
            path: 'category',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      res.status(200).json({
        success: true,
        count: assets.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        data: assets
      });
    } else {
      // Offline mock storage processing
      let processed = mockStorage.mockAssets.map(a => {
        const modelObj = mockStorage.mockModels.find(m => m._id === a.model);
        let categoryObj = null;
        if (modelObj) {
          categoryObj = mockStorage.mockCategories.find(c => c._id === modelObj.category);
        }
        return {
          ...a,
          model: modelObj ? {
            _id: modelObj._id,
            name: modelObj.name,
            manufacturer: modelObj.manufacturer,
            category: categoryObj ? { _id: categoryObj._id, name: categoryObj.name } : null
          } : null
        };
      });

      // Filter by search
      if (search) {
        const term = search.toLowerCase();
        processed = processed.filter(a => 
          a.assetTag.toLowerCase().includes(term) ||
          a.serialNumber.toLowerCase().includes(term) ||
          a.vendor.toLowerCase().includes(term) ||
          (a.model && (
            a.model.name.toLowerCase().includes(term) ||
            a.model.manufacturer.toLowerCase().includes(term) ||
            (a.model.category && a.model.category.name.toLowerCase().includes(term))
          ))
        );
      }

      // Filter by status
      if (status) {
        processed = processed.filter(a => a.status === status);
      }

      // Filter by category
      if (category) {
        processed = processed.filter(a => a.model && a.model.category && a.model.category._id === category);
      }

      // Filter by model
      if (model) {
        processed = processed.filter(a => a.model && a.model._id === model);
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      const total = processed.length;
      const paginatedData = processed.slice(skip, skip + limitNum);

      res.status(200).json({
        success: true,
        count: paginatedData.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        data: paginatedData
      });
    }
  } catch (err) {
    console.error(`[Error in assetController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private (All authenticated users)
exports.getAsset = async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const asset = await Asset.findById(id).populate({
        path: 'model',
        populate: {
          path: 'category',
          select: 'name'
        }
      });
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }
      res.status(200).json({ success: true, data: asset });
    } else {
      const asset = mockStorage.mockAssets.find(a => a._id === id);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      const modelObj = mockStorage.mockModels.find(m => m._id === asset.model);
      let categoryObj = null;
      if (modelObj) {
        categoryObj = mockStorage.mockCategories.find(c => c._id === modelObj.category);
      }

      res.status(200).json({
        success: true,
        data: {
          ...asset,
          model: modelObj ? {
            _id: modelObj._id,
            name: modelObj.name,
            manufacturer: modelObj.manufacturer,
            category: categoryObj ? { _id: categoryObj._id, name: categoryObj.name } : null
          } : null
        }
      });
    }
  } catch (err) {
    console.error(`[Error in assetController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create asset
// @route   POST /api/assets
// @access  Private (Admin, Asset Manager)
exports.createAsset = async (req, res) => {
  const { serialNumber, model, status, purchaseDate, warrantyDate, vendor, cost } = req.body;

  if (!serialNumber || !model || !purchaseDate || !warrantyDate || !vendor || !cost) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  try {
    // Set image path if uploaded
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    if (isDbConnected()) {
      const duplicate = await Asset.findOne({ serialNumber: serialNumber.trim() });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Serial number already exists' });
      }

      // Pre-save hook generates assetTag and qrCode
      const asset = await Asset.create({
        serialNumber: serialNumber.trim(),
        model,
        status: status || 'Available',
        purchaseDate,
        warrantyDate,
        vendor: vendor.trim(),
        cost,
        image: imagePath
      });

      const populatedAsset = await Asset.findById(asset._id).populate({
        path: 'model',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

      res.status(201).json({ success: true, data: populatedAsset });
    } else {
      const duplicate = mockStorage.mockAssets.find(a => a.serialNumber.toLowerCase() === serialNumber.trim().toLowerCase());
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Serial number already exists' });
      }

      // Mock auto-generate tag
      const counter = mockStorage.mockAssets.length + 1;
      const tempTag = `AST-${String(counter).padStart(4, '0')}`;

      // Mock QR code generation
      let qrCodeData = '';
      try {
        const qrContent = JSON.stringify({
          assetTag: tempTag,
          serialNumber: serialNumber.trim(),
          vendor: vendor.trim(),
          cost
        });
        qrCodeData = await QRCode.toDataURL(qrContent);
      } catch (qrErr) {
        console.error('Mock QR generation failed:', qrErr);
      }

      const newAsset = {
        _id: 'mock_asset_' + Math.random().toString(36).substr(2, 9),
        assetTag: tempTag,
        serialNumber: serialNumber.trim(),
        model,
        status: status || 'Available',
        purchaseDate: new Date(purchaseDate).toISOString(),
        warrantyDate: new Date(warrantyDate).toISOString(),
        vendor: vendor.trim(),
        cost: parseFloat(cost),
        image: imagePath,
        qrCode: qrCodeData,
        createdAt: new Date().toISOString()
      };

      mockStorage.mockAssets.push(newAsset);

      const modelObj = mockStorage.mockModels.find(m => m._id === model);
      let categoryObj = null;
      if (modelObj) {
        categoryObj = mockStorage.mockCategories.find(c => c._id === modelObj.category);
      }

      res.status(201).json({
        success: true,
        data: {
          ...newAsset,
          model: modelObj ? {
            _id: modelObj._id,
            name: modelObj.name,
            manufacturer: modelObj.manufacturer,
            category: categoryObj ? { _id: categoryObj._id, name: categoryObj.name } : null
          } : null
        }
      });
    }
  } catch (err) {
    console.error(`[Error in assetController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (Admin, Asset Manager)
exports.updateAsset = async (req, res) => {
  const { id } = req.params;
  const { serialNumber, model, status, purchaseDate, warrantyDate, vendor, cost } = req.body;

  try {
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    if (isDbConnected()) {
      const asset = await Asset.findById(id);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      if (serialNumber) {
        const duplicate = await Asset.findOne({ _id: { $ne: id }, serialNumber: serialNumber.trim() });
        if (duplicate) {
          return res.status(400).json({ success: false, message: 'Serial number already exists' });
        }
        asset.serialNumber = serialNumber.trim();
      }

      if (model) asset.model = model;
      if (status) asset.status = status;
      if (purchaseDate) asset.purchaseDate = purchaseDate;
      if (warrantyDate) asset.warrantyDate = warrantyDate;
      if (vendor) asset.vendor = vendor.trim();
      if (cost) asset.cost = cost;
      if (imagePath) asset.image = imagePath;

      // pre-save hook will automatically regenerate the QR code if details changed
      await asset.save();

      const populatedAsset = await Asset.findById(id).populate({
        path: 'model',
        populate: {
          path: 'category',
          select: 'name'
        }
      });

      res.status(200).json({ success: true, data: populatedAsset });
    } else {
      const assetIdx = mockStorage.mockAssets.findIndex(a => a._id === id);
      if (assetIdx === -1) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }

      const currentAsset = mockStorage.mockAssets[assetIdx];

      if (serialNumber) {
        const duplicate = mockStorage.mockAssets.find(a => a._id !== id && a.serialNumber.toLowerCase() === serialNumber.trim().toLowerCase());
        if (duplicate) {
          return res.status(400).json({ success: false, message: 'Serial number already exists' });
        }
        currentAsset.serialNumber = serialNumber.trim();
      }

      if (model) currentAsset.model = model;
      if (status) currentAsset.status = status;
      if (purchaseDate) currentAsset.purchaseDate = new Date(purchaseDate).toISOString();
      if (warrantyDate) currentAsset.warrantyDate = new Date(warrantyDate).toISOString();
      if (vendor) currentAsset.vendor = vendor.trim();
      if (cost) currentAsset.cost = parseFloat(cost);
      if (imagePath) currentAsset.image = imagePath;

      // Mock QR code updates
      try {
        const qrContent = JSON.stringify({
          assetTag: currentAsset.assetTag,
          serialNumber: currentAsset.serialNumber,
          vendor: currentAsset.vendor,
          cost: currentAsset.cost
        });
        currentAsset.qrCode = await QRCode.toDataURL(qrContent);
      } catch (qrErr) {
        console.error('Mock QR update failed:', qrErr);
      }

      const modelObj = mockStorage.mockModels.find(m => m._id === currentAsset.model);
      let categoryObj = null;
      if (modelObj) {
        categoryObj = mockStorage.mockCategories.find(c => c._id === modelObj.category);
      }

      res.status(200).json({
        success: true,
        data: {
          ...currentAsset,
          model: modelObj ? {
            _id: modelObj._id,
            name: modelObj.name,
            manufacturer: modelObj.manufacturer,
            category: categoryObj ? { _id: categoryObj._id, name: categoryObj.name } : null
          } : null
        }
      });
    }
  } catch (err) {
    console.error(`[Error in assetController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin, Asset Manager)
exports.deleteAsset = async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const asset = await Asset.findById(id);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }
      await Asset.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Asset deleted successfully' });
    } else {
      const assetIdx = mockStorage.mockAssets.findIndex(a => a._id === id);
      if (assetIdx === -1) {
        return res.status(404).json({ success: false, message: 'Asset not found' });
      }
      mockStorage.mockAssets.splice(assetIdx, 1);
      res.status(200).json({ success: true, message: 'Asset deleted successfully' });
    }
  } catch (err) {
    console.error(`[Error in assetController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get dashboard statistics for assets
// @route   GET /api/assets/stats
// @access  Private (All authenticated users)
exports.getAssetStats = async (req, res) => {
  try {
    if (isDbConnected()) {
      // 1. Core status counts
      const total = await Asset.countDocuments();
      const available = await Asset.countDocuments({ status: 'Available' });
      const allocated = await Asset.countDocuments({ status: 'Allocated' });
      const maintenance = await Asset.countDocuments({ status: 'Maintenance' });
      const retired = await Asset.countDocuments({ status: 'Retired' });

      // 2. Cost value sum
      const costAgg = await Asset.aggregate([
        { $group: { _id: null, totalCost: { $sum: '$cost' } } }
      ]);
      const totalVal = costAgg.length > 0 ? costAgg[0].totalCost : 0;

      // 3. Category distribution (group by category name)
      // Group assets by model, populate category, count.
      const categoryDistribution = await Asset.aggregate([
        {
          $lookup: {
            from: 'assetmodels',
            localField: 'model',
            foreignField: '_id',
            as: 'modelDetails'
          }
        },
        { $unwind: '$modelDetails' },
        {
          $lookup: {
            from: 'assetcategories',
            localField: 'modelDetails.category',
            foreignField: '_id',
            as: 'categoryDetails'
          }
        },
        { $unwind: '$categoryDetails' },
        {
          $group: {
            _id: '$categoryDetails.name',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            categoryName: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          statusCounts: { total, available, allocated, maintenance, retired },
          totalValue: totalVal,
          categoryDistribution
        }
      });
    } else {
      // Offline fallback statistics calculations
      const data = mockStorage.mockAssets;
      const total = data.length;
      const available = data.filter(a => a.status === 'Available').length;
      const allocated = data.filter(a => a.status === 'Allocated').length;
      const maintenance = data.filter(a => a.status === 'Maintenance').length;
      const retired = data.filter(a => a.status === 'Retired').length;

      const totalVal = data.reduce((sum, item) => sum + (item.cost || 0), 0);

      // Category distributions logic
      const catCountMap = {};
      data.forEach(a => {
        const modelObj = mockStorage.mockModels.find(m => m._id === a.model);
        if (modelObj) {
          const categoryObj = mockStorage.mockCategories.find(c => c._id === modelObj.category);
          if (categoryObj) {
            catCountMap[categoryObj.name] = (catCountMap[categoryObj.name] || 0) + 1;
          }
        }
      });

      const categoryDistribution = Object.keys(catCountMap).map(key => ({
        categoryName: key,
        count: catCountMap[key]
      }));

      res.status(200).json({
        success: true,
        data: {
          statusCounts: { total, available, allocated, maintenance, retired },
          totalValue: totalVal,
          categoryDistribution
        }
      });
    }
  } catch (err) {
    console.error(`[Error in assetController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};
