const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createAllocation,
  approveAllocation,
  rejectAllocation,
  returnAsset,
  transferAsset,
  getAllocations
} = require('../controllers/allocationController');

const router = express.Router();

// Apply auth protection globally to all allocation routes
router.use(protect);

router.route('/')
  .post(createAllocation)
  .get(getAllocations);

// Manager specific allocation actions
router.put('/:id/approve', authorize('Admin', 'Asset Manager'), approveAllocation);
router.put('/:id/reject', authorize('Admin', 'Asset Manager'), rejectAllocation);
router.put('/:id/return', authorize('Admin', 'Asset Manager'), returnAsset);
router.put('/:id/transfer', authorize('Admin', 'Asset Manager'), transferAsset);

module.exports = router;
