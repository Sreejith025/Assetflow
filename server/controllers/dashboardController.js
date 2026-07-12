const User = require('../models/User');
const Department = require('../models/Department');
const Asset = require('../models/Asset');
const AssetAllocation = require('../models/AssetAllocation');
const AssetCategory = require('../models/AssetCategory');

// @desc    Get Admin Dashboard metrics and charts aggregates
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
  const dbConnected = User.db.readyState === 1;

  // Handle Employee Dashboard Stats
  if (req.user.role === 'Employee') {
    let allocatedCount = 0;
    let pendingCount = 0;
    let returnedCount = 0;
    let rejectedCount = 0;
    let recentAllocations = [];
    let categoryDistribution = [];

    if (dbConnected) {
      allocatedCount = await AssetAllocation.countDocuments({ allocatedTo: req.user._id, status: 'Allocated' });
      pendingCount = await AssetAllocation.countDocuments({ allocatedTo: req.user._id, status: 'Pending Approval' });
      returnedCount = await AssetAllocation.countDocuments({ allocatedTo: req.user._id, status: 'Returned' });
      rejectedCount = await AssetAllocation.countDocuments({ allocatedTo: req.user._id, status: 'Rejected' });

      recentAllocations = await AssetAllocation.find({ allocatedTo: req.user._id })
        .populate({
          path: 'asset',
          select: 'assetTag serialNumber status image qrCode cost purchaseDate warrantyDate vendor',
          populate: [
            { path: 'category', select: 'name' },
            { path: 'model', select: 'name manufacturer description' }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(10);

      // Category distribution for this user
      const userAllocatedAssets = await AssetAllocation.find({
        allocatedTo: req.user._id,
        status: 'Allocated'
      }).select('asset');
      const userAssetIds = userAllocatedAssets.map(ua => ua.asset);

      const categoryAggregate = await Asset.aggregate([
        { $match: { _id: { $in: userAssetIds } } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      for (let item of categoryAggregate) {
        if (item._id) {
          const catObj = await AssetCategory.findById(item._id);
          categoryDistribution.push({
            categoryName: catObj ? catObj.name : 'Unknown',
            count: item.count
          });
        }
      }
    } else {
      // Offline / Sandbox fallback mock data
      allocatedCount = 2;
      pendingCount = 1;
      returnedCount = 3;
      rejectedCount = 1;

      recentAllocations = [
        {
          _id: 'mock_alloc_emp_1',
          asset: {
            _id: 'mock_asset_001',
            assetTag: 'AST-0001',
            serialNumber: 'SN-APL-MBP9988',
            status: 'Allocated',
            cost: 2499.00,
            purchaseDate: '2025-01-10T00:00:00.000Z',
            warrantyDate: '2028-01-10T00:00:00.000Z',
            vendor: 'Apple Business',
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            category: { name: 'Workstations' },
            model: { name: 'MacBook Pro 16"', manufacturer: 'Apple', description: 'M3 Pro, 32GB RAM, 1TB SSD corporate build.' }
          },
          allocatedTo: { _id: req.user._id, fullName: req.user.fullName, email: req.user.email },
          allocationDate: '2026-07-01T09:00:00Z',
          expectedReturnDate: '2027-07-01T09:00:00Z',
          status: 'Allocated',
          remarks: 'Primary developer workstation'
        },
        {
          _id: 'mock_alloc_emp_2',
          asset: {
            _id: 'mock_asset_002',
            assetTag: 'AST-0002',
            serialNumber: 'SN-LEN-T148877',
            status: 'Available',
            cost: 1299.00,
            purchaseDate: '2025-02-15T00:00:00.000Z',
            warrantyDate: '2027-02-15T00:00:00.000Z',
            vendor: 'CDW Logistics',
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            category: { name: 'Monitors' },
            model: { name: 'U2723QE', manufacturer: 'Dell', description: '27 inch 4K USB-C Hub Monitor' }
          },
          allocatedTo: { _id: req.user._id, fullName: req.user.fullName, email: req.user.email },
          allocationDate: '2026-07-02T10:00:00Z',
          expectedReturnDate: '2027-07-02T10:00:00Z',
          status: 'Pending Approval',
          remarks: 'External display request for office workspace'
        },
        {
          _id: 'mock_alloc_emp_3',
          asset: {
            _id: 'mock_asset_003',
            assetTag: 'AST-0003',
            serialNumber: 'SN-APL-IPH7766',
            status: 'Maintenance',
            cost: 999.00,
            purchaseDate: '2025-03-01T00:00:00.000Z',
            warrantyDate: '2026-03-01T00:00:00.000Z',
            vendor: 'Verizon Wireless',
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            category: { name: 'Mobile Devices' },
            model: { name: 'iPhone 15 Pro', manufacturer: 'Apple', description: 'A17 Pro, 256GB storage, test bed device.' }
          },
          allocatedTo: { _id: req.user._id, fullName: req.user.fullName, email: req.user.email },
          allocationDate: '2026-06-15T09:00:00Z',
          expectedReturnDate: '2026-06-30T09:00:00Z',
          actualReturnDate: '2026-06-30T15:00:00Z',
          status: 'Returned',
          remarks: 'Temporary test phone returned on-time'
        }
      ];

      categoryDistribution = [
        { categoryName: 'Workstations', count: 1 },
        { categoryName: 'Monitors', count: 1 }
      ];
    }

    return res.status(200).json({
      success: true,
      data: {
        statusCounts: {
          allocatedCount,
          pendingCount,
          returnedCount,
          rejectedCount,
          totalAssets: allocatedCount + pendingCount
        },
        recentAllocations,
        categoryDistribution
      }
    });
  }

  if (!dbConnected) {
    if (req.user.role === 'Department Head') {
      return res.status(200).json({
        success: true,
        data: {
          statusCounts: {
            deptEmployees: 6,
            deptAssets: 4,
            allocatedDeptAssets: 3,
            pendingRequests: 1
          },
          recentAllocations: [
            {
              _id: '1',
              asset: { assetTag: 'AST-0001' },
              allocatedTo: { fullName: 'Demo Employee', email: 'employee@assetflow.com' },
              allocationDate: '2026-07-10T10:00:00Z',
              status: 'Allocated'
            }
          ],
          categoryDistribution: [
            { categoryName: 'Workstations', count: 3 },
            { categoryName: 'Monitors', count: 1 }
          ],
          departmentDistribution: [
            { departmentName: 'Engineering', count: 3 }
          ]
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        statusCounts: {
          total: 24,
          available: 12,
          allocated: 8,
          maintenance: 3,
          retired: 1,
          employees: 18,
          departments: 4,
          pendingAllocations: 2,
          pendingReturns: 1,
          warrantyExpiringSoon: 4
        },
        totalValue: 32490,
        recentAllocations: [],
        recentEmployees: [],
        recentAssets: [],
        categoryDistribution: [
          { categoryName: 'Workstations', count: 14 },
          { categoryName: 'Mobile Devices', count: 7 },
          { categoryName: 'Monitors', count: 3 }
        ],
        statusDistribution: [
          { name: 'Available', value: 12 },
          { name: 'Allocated', value: 8 },
          { name: 'Maintenance', value: 3 },
          { name: 'Retired', value: 1 }
        ],
        departmentDistribution: [
          { departmentName: 'Engineering', count: 5 },
          { departmentName: 'Product Management', count: 2 },
          { departmentName: 'Operations', count: 1 }
        ]
      }
    });
  }

  // Department Head statistics database aggregations
  if (req.user.role === 'Department Head') {
    const deptId = req.user.department;

    if (!deptId) {
      return res.status(200).json({
        success: true,
        data: {
          statusCounts: {
            deptEmployees: 0,
            deptAssets: 0,
            allocatedDeptAssets: 0,
            pendingRequests: 0
          },
          recentAllocations: [],
          categoryDistribution: [],
          departmentDistribution: []
        }
      });
    }

    // 1. Department Employees Count
    const deptEmployeesCount = await User.countDocuments({ department: deptId });

    // Find department user IDs
    const deptUsers = await User.find({ department: deptId }).select('_id');
    const deptUserIds = deptUsers.map(u => u._id);

    // 2. Assets Allocated in Department
    const allocatedDeptAssetsCount = await AssetAllocation.countDocuments({
      allocatedTo: { $in: deptUserIds },
      status: 'Allocated'
    });

    // 3. Pending Requests belonging to Department
    const pendingDeptRequestsCount = await AssetAllocation.countDocuments({
      allocatedTo: { $in: deptUserIds },
      status: 'Pending Approval'
    });

    // 4. Department Assets (Total allocations + pending requests)
    const totalDeptAssetsCount = allocatedDeptAssetsCount + pendingDeptRequestsCount;

    // 5. Recent Department Allocation Activity (last 5)
    const recentAllocations = await AssetAllocation.find({
      allocatedTo: { $in: deptUserIds }
    })
      .populate({
        path: 'asset',
        select: 'assetTag',
        populate: { path: 'model', select: 'name manufacturer' }
      })
      .populate('allocatedTo', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Category distribution for Department Assets
    const deptAllocatedAssets = await AssetAllocation.find({
      allocatedTo: { $in: deptUserIds },
      status: 'Allocated'
    }).select('asset');
    const deptAssetIds = deptAllocatedAssets.map(da => da.asset);

    const categoryAggregate = await Asset.aggregate([
      { $match: { _id: { $in: deptAssetIds } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryDistribution = [];
    for (let item of categoryAggregate) {
      if (item._id) {
        const catObj = await AssetCategory.findById(item._id);
        categoryDistribution.push({
          categoryName: catObj ? catObj.name : 'Unknown',
          count: item.count
        });
      }
    }

    // Fetch department details to show name in charts
    const deptObj = await Department.findById(deptId);

    return res.status(200).json({
      success: true,
      data: {
        statusCounts: {
          deptEmployees: deptEmployeesCount,
          deptAssets: totalDeptAssetsCount,
          allocatedDeptAssets: allocatedDeptAssetsCount,
          pendingRequests: pendingDeptRequestsCount
        },
        recentAllocations,
        categoryDistribution,
        departmentDistribution: [
          { departmentName: deptObj ? deptObj.name : 'My Department', count: allocatedDeptAssetsCount }
        ]
      }
    });
  }

  // 1. Retrieve Core Card Counts
  const totalEmployees = await User.countDocuments();
  const totalDepartments = await Department.countDocuments();
  const totalAssets = await Asset.countDocuments();

  const availableAssets = await Asset.countDocuments({ status: 'Available' });
  const allocatedAssets = await Asset.countDocuments({ status: 'Allocated' });
  const maintenanceAssets = await Asset.countDocuments({ status: 'Maintenance' });
  const retiredAssets = await Asset.countDocuments({ status: 'Retired' });

  const pendingAllocations = await AssetAllocation.countDocuments({ status: 'Pending Approval' });
  // Returns are currently processed instantly, so pending return request count is 0 in direct schema.
  const pendingReturns = 0;

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  const warrantyExpiringSoon = await Asset.countDocuments({
    warrantyDate: {
      $gte: now,
      $lte: thirtyDaysFromNow
    }
  });

  // Aggregate Valuation sum
  const valuationAggregate = await Asset.aggregate([
    { $group: { _id: null, totalValue: { $sum: '$cost' } } }
  ]);
  const totalAssetValue = valuationAggregate.length > 0 ? valuationAggregate[0].totalValue : 0;

  // 2. Fetch Recent Log Rows (limit 5)
  const recentAllocations = await AssetAllocation.find()
    .populate('asset', 'assetTag')
    .populate('allocatedTo', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentEmployees = await User.find()
    .populate('department', 'name code')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentAssets = await Asset.find()
    .populate('category', 'name')
    .populate('model', 'name manufacturer')
    .sort({ createdAt: -1 })
    .limit(5);

  // 3. Category distribution (Assets by Category Chart)
  const categoryAggregate = await Asset.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  const categoryDistribution = [];
  for (let item of categoryAggregate) {
    if (item._id) {
      const catObj = await AssetCategory.findById(item._id);
      categoryDistribution.push({
        categoryName: catObj ? catObj.name : 'Unknown',
        count: item.count
      });
    }
  }

  // 4. Status distribution (Assets by Status Chart)
  const statusDistribution = [
    { name: 'Available', value: availableAssets },
    { name: 'Allocated', value: allocatedAssets },
    { name: 'Maintenance', value: maintenanceAssets },
    { name: 'Retired', value: retiredAssets }
  ];

  // 5. Department distribution (Department-wise Asset Distribution)
  const deptAllocations = await AssetAllocation.aggregate([
    { $match: { status: 'Allocated' } },
    {
      $lookup: {
        from: 'users',
        localField: 'allocatedTo',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: '$user.department',
        count: { $sum: 1 }
      }
    }
  ]);

  const departmentDistribution = [];
  for (let item of deptAllocations) {
    if (item._id) {
      const deptObj = await Department.findById(item._id);
      departmentDistribution.push({
        departmentName: deptObj ? deptObj.name : 'Unknown',
        count: item.count
      });
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      statusCounts: {
        total: totalAssets,
        available: availableAssets,
        allocated: allocatedAssets,
        maintenance: maintenanceAssets,
        retired: retiredAssets,
        employees: totalEmployees,
        departments: totalDepartments,
        pendingAllocations,
        pendingReturns,
        warrantyExpiringSoon
      },
      totalValue: totalAssetValue,
      recentAllocations,
      recentEmployees,
      recentAssets,
      categoryDistribution,
      statusDistribution,
      departmentDistribution
    }
  });

} catch (err) {
  return res.status(500).json({
    success: false,
    message: err.message
  });
}
};
