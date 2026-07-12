const express = require('express');
const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStats
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Mount stats route before the ID param routes
router.get('/stats', protect, getAssetStats);

router.route('/')
  .get(protect, getAssets)
  .post(protect, authorize('Admin', 'Asset Manager'), upload.single('image'), createAsset);

router.route('/:id')
  .get(protect, getAsset)
  .put(protect, authorize('Admin', 'Asset Manager'), upload.single('image'), updateAsset)
  .delete(protect, authorize('Admin', 'Asset Manager'), deleteAsset);

module.exports = router;
