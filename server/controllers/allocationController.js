const mongoose = require('mongoose');
const AssetAllocation = require('../models/AssetAllocation');
const Asset = require('../models/Asset');
const User = require('../models/User');

// @desc    Create asset allocation or request
// @route   POST /api/allocations
// @access  Private
exports.createAllocation = async (req, res) => {
  const { asset: assetId, allocatedTo: employeeId, expectedReturnDate, remarks } = req.body;

  if (!assetId || !employeeId || !expectedReturnDate) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide asset ID, employee ID, and expected return date' 
    });
  }

  try {
    // 1. Verify Asset exists
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // 2. Prevent if Asset is Maintenance or Retired
    if (asset.status === 'Maintenance' || asset.status === 'Retired') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot allocate asset currently in '${asset.status}' state` 
      });
    }

    // 3. Prevent if already allocated
    if (asset.status === 'Allocated') {
      return res.status(400).json({ 
        success: false, 
        message: 'Asset is already allocated to another employee' 
      });
    }

    // 4. Verify Employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const requesterRole = req.user.role;
    const isDirectAllocator = requesterRole === 'Admin' || requesterRole === 'Asset Manager';

    let allocationStatus = 'Pending Approval';
    let approvedBy = null;
    let approvalDate = null;

    if (isDirectAllocator) {
      allocationStatus = 'Allocated';
      approvedBy = req.user._id;
      approvalDate = new Date();
    }

    // 5. Create Allocation
    const allocation = await AssetAllocation.create({
      asset: assetId,
      allocatedTo: employeeId,
      allocatedBy: req.user._id,
      expectedReturnDate,
      status: allocationStatus,
      remarks: remarks || '',
      approvedBy,
      approvalDate
    });

    // 6. Sync Asset Status if directly allocated
    if (isDirectAllocator) {
      asset.status = 'Allocated';
      await asset.save();
    }

    return res.status(201).json({
      success: true,
      data: allocation
    });
  } catch (err) {
    console.error(`[Error in allocationController.js]:`, err.stack);
    return res.status(550).json({ success: false, message: err.message });
  }
};

// @desc    Approve pending asset allocation
// @route   PUT /api/allocations/:id/approve
// @access  Private (Admin, Asset Manager)
exports.approveAllocation = async (req, res) => {
  const { approvalRemarks } = req.body;

  try {
    const allocation = await AssetAllocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation request not found' });
    }

    if (allocation.status !== 'Pending Approval') {
      return res.status(400).json({ 
        success: false, 
        message: `Request is not pending approval (Current state: '${allocation.status}')` 
      });
    }

    // Verify asset is still available
    const asset = await Asset.findById(allocation.asset);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Associated asset not found' });
    }

    if (asset.status === 'Allocated' || asset.status === 'Maintenance' || asset.status === 'Retired') {
      return res.status(400).json({ 
        success: false, 
        message: `Asset is no longer available (Current state: '${asset.status}')` 
      });
    }

    // Update state
    allocation.status = 'Allocated';
    allocation.approvedBy = req.user._id;
    allocation.approvalDate = new Date();
    allocation.approvalRemarks = approvalRemarks || '';
    await allocation.save();

    // Update asset
    asset.status = 'Allocated';
    await asset.save();

    return res.status(200).json({
      success: true,
      message: 'Allocation request approved successfully',
      data: allocation
    });
  } catch (err) {
    console.error(`[Error in allocationController.js]:`, err.stack);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reject pending asset allocation
// @route   PUT /api/allocations/:id/reject
// @access  Private (Admin, Asset Manager)
exports.rejectAllocation = async (req, res) => {
  const { approvalRemarks } = req.body;

  try {
    const allocation = await AssetAllocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation request not found' });
    }

    if (allocation.status !== 'Pending Approval') {
      return res.status(400).json({ 
        success: false, 
        message: 'Request is not pending approval' 
      });
    }

    allocation.status = 'Rejected';
    allocation.approvedBy = req.user._id;
    allocation.approvalDate = new Date();
    allocation.approvalRemarks = approvalRemarks || '';
    await allocation.save();

    return res.status(200).json({
      success: true,
      message: 'Allocation request rejected successfully',
      data: allocation
    });
  } catch (err) {
    console.error(`[Error in allocationController.js]:`, err.stack);
    return res.status(550).json({ success: false, message: err.message });
  }
};

// @desc    Return allocated asset
// @route   PUT /api/allocations/:id/return
// @access  Private (Admin, Asset Manager)
exports.returnAsset = async (req, res) => {
  const { actualReturnDate, remarks } = req.body;

  try {
    const allocation = await AssetAllocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation record not found' });
    }

    if (allocation.status !== 'Allocated') {
      return res.status(400).json({ 
        success: false, 
        message: 'Asset is not currently allocated' 
      });
    }

    // Update allocation
    allocation.status = 'Returned';
    allocation.actualReturnDate = actualReturnDate || new Date();
    if (remarks) {
      allocation.remarks = allocation.remarks 
        ? `${allocation.remarks} | Return Remarks: ${remarks}` 
        : `Return Remarks: ${remarks}`;
    }
    await allocation.save();

    // Revert Asset to Available
    const asset = await Asset.findById(allocation.asset);
    if (asset) {
      asset.status = 'Available';
      await asset.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Asset returned successfully',
      data: allocation
    });
  } catch (err) {
    console.error(`[Error in allocationController.js]:`, err.stack);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Transfer asset to another employee
// @route   PUT /api/allocations/:id/transfer
// @access  Private (Admin, Asset Manager)
exports.transferAsset = async (req, res) => {
  const { transferTo: targetEmployeeId, expectedReturnDate, remarks } = req.body;

  if (!targetEmployeeId || !expectedReturnDate) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide target employee ID and expected return date for transfer' 
    });
  }

  try {
    // 1. Fetch current allocation
    const currentAllocation = await AssetAllocation.findById(req.params.id);
    if (!currentAllocation) {
      return res.status(404).json({ success: false, message: 'Current allocation record not found' });
    }

    if (currentAllocation.status !== 'Allocated') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot transfer an asset that is not currently allocated' 
      });
    }

    // 2. Verify target employee exists
    const targetEmployee = await User.findById(targetEmployeeId);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Target employee not found' });
    }

    // 3. Close current allocation
    currentAllocation.status = 'Returned';
    currentAllocation.actualReturnDate = new Date();
    currentAllocation.remarks = currentAllocation.remarks 
      ? `${currentAllocation.remarks} | Transferred to user ${targetEmployee.fullName}`
      : `Transferred to user ${targetEmployee.fullName}`;
    await currentAllocation.save();

    // 4. Create new allocation
    const newAllocation = await AssetAllocation.create({
      asset: currentAllocation.asset,
      allocatedTo: targetEmployeeId,
      allocatedBy: req.user._id,
      expectedReturnDate,
      status: 'Allocated',
      approvedBy: req.user._id,
      approvalDate: new Date(),
      remarks: remarks ? `Transfer details: ${remarks}` : 'Transferred from previous allocation'
    });

    return res.status(200).json({
      success: true,
      message: 'Asset transferred successfully',
      data: {
        previousAllocation: currentAllocation,
        newAllocation
      }
    });
  } catch (err) {
    console.error(`[Error in allocationController.js]:`, err.stack);
    return res.status(550).json({ success: false, message: err.message });
  }
};

// @desc    Get allocations logs/history
// @route   GET /api/allocations
// @access  Private
exports.getAllocations = async (req, res) => {
  const { search, status, employee, asset } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    let query = {};

    // Filter by specific employee (Regular employees only see their own requests)
    if (req.user.role === 'Employee') {
      if (mongoose.Types.ObjectId.isValid(req.user._id)) {
        query.allocatedTo = req.user._id;
      } else {
        query.allocatedTo = new mongoose.Types.ObjectId();
      }
    } else if (employee) {
      if (mongoose.Types.ObjectId.isValid(employee)) {
        query.allocatedTo = employee;
      } else {
        query.allocatedTo = new mongoose.Types.ObjectId();
      }
    }

    // Filter by asset
    if (asset) {
      if (mongoose.Types.ObjectId.isValid(asset)) {
        query.asset = asset;
      } else {
        query.asset = new mongoose.Types.ObjectId();
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search query matches
    if (search) {
      const term = search.trim();
      
      // Resolve IDs by looking up user or asset tag matching term
      const matchedUsers = await User.find({ fullName: { $regex: term, $options: 'i' } }).select('_id');
      const userIds = matchedUsers.map(u => u._id);

      const matchedAssets = await Asset.find({ assetTag: { $regex: term, $options: 'i' } }).select('_id');
      const assetIds = matchedAssets.map(a => a._id);

      query.$or = [
        { allocatedTo: { $in: userIds } },
        { asset: { $in: assetIds } },
        { remarks: { $regex: term, $options: 'i' } }
      ];
    }

    // Execute queries
    const total = await AssetAllocation.countDocuments(query);
    const allocations = await AssetAllocation.find(query)
      .populate({
        path: 'asset',
        select: 'assetTag serialNumber status',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'model', select: 'name manufacturer' }
        ]
      })
      .populate('allocatedTo', 'fullName email role')
      .populate('allocatedBy', 'fullName role')
      .populate('approvedBy', 'fullName role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: allocations.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: allocations
    });
  } catch (err) {
    console.error(`[Error in allocationController.js]:`, err.stack);
    return res.status(500).json({ success: false, message: err.message });
  }
};
