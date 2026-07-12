const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getCategories)
  .post(protect, authorize('Admin', 'Asset Manager'), createCategory);

router.route('/:id')
  .get(protect, getCategory)
  .put(protect, authorize('Admin', 'Asset Manager'), updateCategory)
  .delete(protect, authorize('Admin', 'Asset Manager'), deleteCategory);

module.exports = router;
