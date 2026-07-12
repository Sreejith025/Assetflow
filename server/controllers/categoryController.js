const mongoose = require('mongoose');
const AssetCategory = require('../models/AssetCategory');
const AssetModel = require('../models/AssetModel');
const mockStorage = require('../config/mockStorage');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private (All authenticated users)
exports.getCategories = async (req, res) => {
  try {
    if (isDbConnected()) {
      const categories = await AssetCategory.find().sort({ name: 1 });
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
      });
    } else {
      res.status(200).json({
        success: true,
        count: mockStorage.mockCategories.length,
        data: mockStorage.mockCategories
      });
    }
  } catch (err) {
    console.error(`[Error in categoryController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private (All authenticated users)
exports.getCategory = async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      const category = await AssetCategory.findById(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.status(200).json({ success: true, data: category });
    } else {
      const cat = mockStorage.mockCategories.find(c => c._id === id);
      if (!cat) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.status(200).json({ success: true, data: cat });
    }
  } catch (err) {
    console.error(`[Error in categoryController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin, Asset Manager)
exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Please provide a category name' });
  }

  try {
    if (isDbConnected()) {
      const duplicate = await AssetCategory.findOne({ name: name.trim() });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
      const category = await AssetCategory.create({ name: name.trim(), description });
      res.status(201).json({ success: true, data: category });
    } else {
      const dup = mockStorage.mockCategories.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
      if (dup) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
      const newCat = {
        _id: 'mock_cat_' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        description,
        createdAt: new Date().toISOString()
      };
      mockStorage.mockCategories.push(newCat);
      res.status(201).json({ success: true, data: newCat });
    }
  } catch (err) {
    console.error(`[Error in categoryController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin, Asset Manager)
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    if (isDbConnected()) {
      const category = await AssetCategory.findById(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      if (name) {
        const duplicate = await AssetCategory.findOne({ _id: { $ne: id }, name: name.trim() });
        if (duplicate) {
          return res.status(400).json({ success: false, message: 'Category name already exists' });
        }
        category.name = name.trim();
      }
      if (description !== undefined) category.description = description;
      await category.save();
      res.status(200).json({ success: true, data: category });
    } else {
      const catIdx = mockStorage.mockCategories.findIndex(c => c._id === id);
      if (catIdx === -1) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      const currentCat = mockStorage.mockCategories[catIdx];
      if (name) {
        const dup = mockStorage.mockCategories.find(c => c._id !== id && c.name.toLowerCase() === name.trim().toLowerCase());
        if (dup) {
          return res.status(400).json({ success: false, message: 'Category name already exists' });
        }
        currentCat.name = name.trim();
      }
      if (description !== undefined) currentCat.description = description;
      res.status(200).json({ success: true, data: currentCat });
    }
  } catch (err) {
    console.error(`[Error in categoryController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin, Asset Manager)
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const category = await AssetCategory.findById(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Check if models exist under this category
      const modelsCount = await AssetModel.countDocuments({ category: id });
      if (modelsCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete category containing registered asset models.' 
        });
      }

      await AssetCategory.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } else {
      const catIdx = mockStorage.mockCategories.findIndex(c => c._id === id);
      if (catIdx === -1) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Check mock models
      const modelsCount = mockStorage.mockModels.filter(m => m.category === id).length;
      if (modelsCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete category containing registered asset models.' 
        });
      }

      mockStorage.mockCategories.splice(catIdx, 1);
      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    }
  } catch (err) {
    console.error(`[Error in categoryController.js]:`, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};
