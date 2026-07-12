const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getOrgSettings,
  updateOrgSettings,
  updateProfile
} = require('../controllers/settingController');

const router = express.Router();

// Apply auth protection globally
router.use(protect);

router.route('/org')
  .get(getOrgSettings)
  .put(authorize('Admin'), updateOrgSettings);

router.route('/profile')
  .put(updateProfile);

module.exports = router;
