const mongoose = require('mongoose');
const AssetModel = require('../models/AssetModel');
const Asset = require('../models/Asset');
const mockStorage = require('../config/mockStorage');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all models
// @route   GET /api/models
// @access  Private (All authenticated users)
exports.getModels = async (req, res) => {
  try {
    if (isDbConnected()) {
      const models = await AssetModel.find()
        .populate('category', 'name')
        .sort({ name: 1 });
      res.status(200).json({
        success: true,
        count: models.length,
        data: models
      });
    } else {
      // Process mock models with populated categories
      const processedModels = mockStorage.mockModels.map(m => {
        const catObj = mockStorage.mockCategories.find(c => c._id === m.category);
        return {
          ...m,
          category: catObj ? { _id: catObj._id, name: catObj.name } : null
        };
      });

      res.status(200).json({
        success: true,
        count: processedModels.length,
        data: processedModels
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single model
// @route   GET /api/models/:id
// @access  Private (All authenticated users)
exports.getModel = async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      const model = await AssetModel.findById(id).populate('category', 'name');
      if (!model) {
        return res.status(404).json({ success: false, message: 'Asset model not found' });
      }
      res.status(200).json({ success: true, data: model });
    } else {
      const m = mockStorage.mockModels.find(item => item._id === id);
      if (!m) {
        return res.status(404).json({ success: false, message: 'Asset model not found' });
      }
      const catObj = mockStorage.mockCategories.find(c => c._id === m.category);
      res.status(200).json({
        success: true,
        data: {
          ...m,
          category: catObj ? { _id: catObj._id, name: catObj.name } : null
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create model
// @route   POST /api/models
// @access  Private (Admin, Asset Manager)
exports.createModel = async (req, res) => {
  const { name, category, manufacturer, description } = req.body;
  if (!name || !category || !manufacturer) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide model name, category, and manufacturer' 
    });
  }

  try {
    if (isDbConnected()) {
      const duplicate = await AssetModel.findOne({ name: name.trim() });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Model name already exists' });
      }
      const model = await AssetModel.create({
        name: name.trim(),
        category,
        manufacturer: manufacturer.trim(),
        description
      });
      const populatedModel = await AssetModel.findById(model._id).populate('category', 'name');
      res.status(201).json({ success: true, data: populatedModel });
    } else {
      const dup = mockStorage.mockModels.find(m => m.name.toLowerCase() === name.trim().toLowerCase());
      if (dup) {
        return res.status(400).json({ success: false, message: 'Model name already exists' });
      }
      const newModel = {
        _id: 'mock_model_' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        category: category,
        manufacturer: manufacturer.trim(),
        description,
        createdAt: new Date().toISOString()
      };
      mockStorage.mockModels.push(newModel);
      
      const catObj = mockStorage.mockCategories.find(c => c._id === category);
      res.status(201).json({
        success: true,
        data: {
          ...newModel,
          category: catObj ? { _id: catObj._id, name: catObj.name } : null
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update model
// @route   PUT /api/models/:id
// @access  Private (Admin, Asset Manager)
exports.updateModel = async (req, res) => {
  const { id } = req.params;
  const { name, category, manufacturer, description } = req.body;

  try {
    if (isDbConnected()) {
      const model = await AssetModel.findById(id);
      if (!model) {
        return res.status(404).json({ success: false, message: 'Asset model not found' });
      }
      if (name) {
        const duplicate = await AssetModel.findOne({ _id: { $ne: id }, name: name.trim() });
        if (duplicate) {
          return res.status(400).json({ success: false, message: 'Model name already exists' });
        }
        model.name = name.trim();
      }
      if (category) model.category = category;
      if (manufacturer) model.manufacturer = manufacturer.trim();
      if (description !== undefined) model.description = description;

      await model.save();
      const populatedModel = await AssetModel.findById(id).populate('category', 'name');
      res.status(200).json({ success: true, data: populatedModel });
    } else {
      const modelIdx = mockStorage.mockModels.findIndex(m => m._id === id);
      if (modelIdx === -1) {
        return res.status(404).json({ success: false, message: 'Asset model not found' });
      }
      const currentModel = mockStorage.mockModels[modelIdx];
      if (name) {
        const dup = mockStorage.mockModels.find(m => m._id !== id && m.name.toLowerCase() === name.trim().toLowerCase());
        if (dup) {
          return res.status(400).json({ success: false, message: 'Model name already exists' });
        }
        currentModel.name = name.trim();
      }
      if (category) currentModel.category = category;
      if (manufacturer) currentModel.manufacturer = manufacturer.trim();
      if (description !== undefined) currentModel.description = description;

      const catObj = mockStorage.mockCategories.find(c => c._id === currentModel.category);
      res.status(200).json({
        success: true,
        data: {
          ...currentModel,
          category: catObj ? { _id: catObj._id, name: catObj.name } : null
        }
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete model
// @route   DELETE /api/models/:id
// @access  Private (Admin, Asset Manager)
exports.deleteModel = async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const model = await AssetModel.findById(id);
      if (!model) {
        return res.status(404).json({ success: false, message: 'Asset model not found' });
      }

      // Check if assets are associated with this model
      const assetsCount = await Asset.countDocuments({ model: id });
      if (assetsCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete model which has registered assets associated with it.' 
        });
      }

      await AssetModel.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Asset model deleted successfully' });
    } else {
      const modelIdx = mockStorage.mockModels.findIndex(m => m._id === id);
      if (modelIdx === -1) {
        return res.status(404).json({ success: false, message: 'Asset model not found' });
      }

      // Check mock assets
      const assetsCount = mockStorage.mockAssets.filter(a => a.model === id).length;
      if (assetsCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete model which has registered assets associated with it.' 
        });
      }

      mockStorage.mockModels.splice(modelIdx, 1);
      res.status(200).json({ success: true, message: 'Asset model deleted successfully' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
