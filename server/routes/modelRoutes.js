const express = require('express');
const {
  getModels,
  getModel,
  createModel,
  updateModel,
  deleteModel
} = require('../controllers/modelController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getModels)
  .post(protect, authorize('Admin', 'Asset Manager'), createModel);

router.route('/:id')
  .get(protect, getModel)
  .put(protect, authorize('Admin', 'Asset Manager'), updateModel)
  .delete(protect, authorize('Admin', 'Asset Manager'), deleteModel);

module.exports = router;
