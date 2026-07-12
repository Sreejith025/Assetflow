const User = require('../models/User');
const Department = require('../models/Department');
const Asset = require('../models/Asset');
const AssetAllocation = require('../models/AssetAllocation');
const AssetCategory = require('../models/AssetCategory');
const Notification = require('../models/Notification');

// Helper to format month names
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// @desc    Get Role-based Dashboard stats and chart data
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const dbConnected = User.db.readyState === 1;
    const role = req.user.role;

    // ==========================================
    // 1. EMPLOYEE ROLE STATS
    // ==========================================
    if (role === 'Employee') {
      let allocatedCount = 0;
      let pendingCount = 0;
      let returnedCount = 0;
      let recentAllocations = [];
      let categoryDistribution = [];
      let timelineData = [];

      if (dbConnected) {
        allocatedCount = await AssetAllocation.countDocuments({ allocatedTo: req.user._id, status: 'Allocated' });
        pendingCount = await AssetAllocation.countDocuments({ allocatedTo: req.user._id, status: 'Pending Approval' });
        returnedCount = await AssetAllocation.countDocuments({ allocatedTo: req.user._id, status: 'Returned' });

        recentAllocations = await AssetAllocation.find({ allocatedTo: req.user._id })
          .populate({
            path: 'asset',
            select: 'assetTag serialNumber status cost purchaseDate warrantyDate vendor qrCode',
            populate: [
              { path: 'category', select: 'name' },
              { path: 'model', select: 'name manufacturer description' }
            ]
          })
          .sort({ createdAt: -1 })
          .limit(15);

        // Category distribution
        const userAllocated = await AssetAllocation.find({ allocatedTo: req.user._id, status: 'Allocated' }).select('asset');
        const userAssetIds = userAllocated.map(ua => ua.asset);
        const catAgg = await Asset.aggregate([
          { $match: { _id: { $in: userAssetIds } } },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        for (let item of catAgg) {
          if (item._id) {
            const cat = await AssetCategory.findById(item._id);
            categoryDistribution.push({
              categoryName: cat ? cat.name : 'Other',
              count: item.count
            });
          }
        }

        // Timeline Data: monthly count of allocations received
        const timelineAgg = await AssetAllocation.aggregate([
          { $match: { allocatedTo: req.user._id } },
          {
            $group: {
              _id: { month: { $month: '$allocationDate' }, year: { $year: '$allocationDate' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        timelineData = timelineAgg.map(t => ({
          date: `${monthNames[t._id.month - 1]} ${t._id.year}`,
          allocations: t.count
        }));
      } else {
        // Fallback Employee stats
        allocatedCount = 2;
        pendingCount = 1;
        returnedCount = 3;
        recentAllocations = [
          {
            _id: 'mock_alloc_emp_1',
            asset: {
              _id: 'mock_asset_001',
              assetTag: 'AST-0001',
              serialNumber: 'SN-APL-MBP9988',
              status: 'Allocated',
              cost: 2499.00,
              category: { name: 'Workstations' },
              model: { name: 'MacBook Pro 16"', manufacturer: 'Apple', description: 'M3 Pro, 32GB RAM, 1TB SSD' }
            },
            allocatedTo: { fullName: req.user.fullName, email: req.user.email },
            allocationDate: '2026-07-01T09:00:00Z',
            status: 'Allocated'
          }
        ];
        categoryDistribution = [{ categoryName: 'Workstations', count: 1 }, { categoryName: 'Accessories', count: 1 }];
        timelineData = [{ date: 'May 2026', allocations: 1 }, { date: 'Jun 2026', allocations: 2 }, { date: 'Jul 2026', allocations: 1 }];
      }

      return res.status(200).json({
        success: true,
        data: {
          statusCounts: {
            allocatedCount,
            pendingCount,
            returnedCount,
            totalAssets: allocatedCount + pendingCount
          },
          recentAllocations,
          categoryDistribution,
          timelineData
        }
      });
    }

    // ==========================================
    // 2. DEPARTMENT HEAD ROLE STATS
    // ==========================================
    if (role === 'Department Head') {
      const deptId = req.user.department;

      let deptEmployeesCount = 0;
      let allocatedDeptAssetsCount = 0;
      let pendingDeptRequestsCount = 0;
      let globalAvailableCount = 0;
      let deptMaintenanceCount = 0;

      let categoryDistribution = [];
      let statusDistribution = [];
      let deptAssetsList = [];
      let deptEmployeesList = [];
      let pendingRequestsList = [];

      if (dbConnected && deptId) {
        // Employees in department
        deptEmployeesList = await User.find({ department: deptId }).select('fullName email role isActive');
        deptEmployeesCount = deptEmployeesList.length;
        const deptUserIds = deptEmployeesList.map(u => u._id);

        // Assets allocated in department
        allocatedDeptAssetsCount = await AssetAllocation.countDocuments({
          allocatedTo: { $in: deptUserIds },
          status: 'Allocated'
        });

        // Pending department requests
        pendingRequestsList = await AssetAllocation.find({
          allocatedTo: { $in: deptUserIds },
          status: 'Pending Approval'
        }).populate('asset').populate('allocatedTo', 'fullName email');
        pendingDeptRequestsCount = pendingRequestsList.length;

        // Global available assets
        globalAvailableCount = await Asset.countDocuments({ status: 'Available' });

        // Department assets in maintenance
        const deptAllocations = await AssetAllocation.find({ allocatedTo: { $in: deptUserIds } }).select('asset');
        const deptAssetIds = deptAllocations.map(da => da.asset);
        deptMaintenanceCount = await Asset.countDocuments({ _id: { $in: deptAssetIds }, status: 'Maintenance' });

        // Category distribution for department
        const catAgg = await Asset.aggregate([
          { $match: { _id: { $in: deptAssetIds } } },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        for (let item of catAgg) {
          if (item._id) {
            const cat = await AssetCategory.findById(item._id);
            categoryDistribution.push({
              categoryName: cat ? cat.name : 'Other',
              count: item.count
            });
          }
        }

        // Status distribution for department
        const statusAgg = await Asset.aggregate([
          { $match: { _id: { $in: deptAssetIds } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        statusDistribution = statusAgg.map(s => ({
          name: s._id,
          value: s.count
        }));

        // Department Assets log
        deptAssetsList = await AssetAllocation.find({ allocatedTo: { $in: deptUserIds }, status: 'Allocated' })
          .populate('asset')
          .populate('allocatedTo', 'fullName email');

      } else {
        // Fallback Department Head stats
        deptEmployeesCount = 8;
        allocatedDeptAssetsCount = 5;
        pendingDeptRequestsCount = 2;
        globalAvailableCount = 14;
        deptMaintenanceCount = 1;

        categoryDistribution = [{ categoryName: 'Workstations', count: 4 }, { categoryName: 'Monitors', count: 2 }];
        statusDistribution = [{ name: 'Allocated', value: 5 }, { name: 'Maintenance', value: 1 }];
        deptAssetsList = [
          {
            _id: 'mock_dept_a1',
            asset: { assetTag: 'AST-0001', model: { manufacturer: 'Apple', name: 'MacBook Pro' }, status: 'Allocated' },
            allocatedTo: { fullName: 'Alice Johnson', email: 'alice@company.com' },
            allocationDate: '2026-07-01'
          }
        ];
        deptEmployeesList = [
          { _id: 'e1', fullName: 'Alice Johnson', email: 'alice@company.com', role: 'Employee', isActive: true }
        ];
        pendingRequestsList = [
          {
            _id: 'mock_dept_req1',
            asset: { assetTag: 'AST-0002', model: { manufacturer: 'Dell', name: 'UltraSharp 27"' } },
            allocatedTo: { fullName: 'Bob Smith', email: 'bob@company.com' },
            createdAt: new Date().toISOString()
          }
        ];
      }

      return res.status(200).json({
        success: true,
        data: {
          statusCounts: {
            deptAssets: allocatedDeptAssetsCount + pendingDeptRequestsCount,
            deptEmployees: deptEmployeesCount,
            availableAssets: globalAvailableCount,
            pendingRequests: pendingDeptRequestsCount,
            maintenanceAssets: deptMaintenanceCount
          },
          categoryDistribution,
          statusDistribution,
          deptAssetsList,
          deptEmployeesList,
          pendingRequestsList
        }
      });
    }

    // ==========================================
    // 3. ASSET MANAGER ROLE STATS
    // ==========================================
    if (role === 'Asset Manager') {
      let availableCount = 0;
      let allocatedTodayCount = 0;
      let returnedCount = 0;
      let transfersCount = 0;
      let maintenanceCount = 0;

      let categoryDistribution = [];
      let statusDistribution = [];
      let allocationTrends = [];
      let allocationQueue = [];
      let returnQueue = [];
      let transferQueue = [];

      if (dbConnected) {
        availableCount = await Asset.countDocuments({ status: 'Available' });
        maintenanceCount = await Asset.countDocuments({ status: 'Maintenance' });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        allocatedTodayCount = await AssetAllocation.countDocuments({
          status: 'Allocated',
          allocationDate: { $gte: todayStart }
        });

        returnedCount = await AssetAllocation.countDocuments({ status: 'Returned' });
        transfersCount = await AssetAllocation.countDocuments({ status: 'Pending Approval', remarks: /transfer/i });

        // Allocation Queue (Pending allocations)
        allocationQueue = await AssetAllocation.find({ status: 'Pending Approval' })
          .populate('asset')
          .populate('allocatedTo', 'fullName email');

        // Return queue (recently returned or pending return)
        returnQueue = await AssetAllocation.find({ status: 'Returned' })
          .populate('asset')
          .populate('allocatedTo', 'fullName email')
          .sort({ updatedAt: -1 })
          .limit(10);

        // Transfer Queue
        transferQueue = await AssetAllocation.find({ status: 'Pending Approval', remarks: /transfer/i })
          .populate('asset')
          .populate('allocatedTo', 'fullName email')
          .limit(10);

        // Status Distribution
        const statsGroup = await Asset.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        statusDistribution = statsGroup.map(s => ({ name: s._id, value: s.count }));

        // Category Distribution
        const catGroup = await Asset.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
        for (let item of catGroup) {
          if (item._id) {
            const cat = await AssetCategory.findById(item._id);
            categoryDistribution.push({ categoryName: cat ? cat.name : 'Other', count: item.count });
          }
        }

        // Monthly Allocations Trend
        const trendGroup = await AssetAllocation.aggregate([
          { $group: { _id: { month: { $month: '$allocationDate' }, year: { $year: '$allocationDate' } }, count: { $sum: 1 } } },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
          { $limit: 6 }
        ]);
        allocationTrends = trendGroup.map(t => ({
          date: `${monthNames[t._id.month - 1]} ${t._id.year}`,
          allocations: t.count
        }));

      } else {
        // Fallback Asset Manager stats
        availableCount = 15;
        allocatedTodayCount = 2;
        returnedCount = 12;
        transfersCount = 1;
        maintenanceCount = 3;

        statusDistribution = [{ name: 'Available', value: 15 }, { name: 'Allocated', value: 20 }, { name: 'Maintenance', value: 3 }];
        categoryDistribution = [{ categoryName: 'Workstations', count: 18 }, { categoryName: 'Monitors', count: 10 }];
        allocationTrends = [{ date: 'May 2026', allocations: 8 }, { date: 'Jun 2026', allocations: 15 }, { date: 'Jul 2026', allocations: 12 }];

        allocationQueue = [
          {
            _id: 'mock_aq1',
            asset: { assetTag: 'AST-0005', model: { manufacturer: 'Lenovo', name: 'ThinkPad T14' } },
            allocatedTo: { fullName: 'David Lee', email: 'david@company.com' },
            createdAt: new Date().toISOString()
          }
        ];
        returnQueue = [
          {
            _id: 'mock_rq1',
            asset: { assetTag: 'AST-0001', model: { manufacturer: 'Apple', name: 'MacBook Pro' } },
            allocatedTo: { fullName: 'Sarah Connor', email: 'sarah@company.com' },
            actualReturnDate: new Date().toISOString()
          }
        ];
        transferQueue = [
          {
            _id: 'mock_tq1',
            asset: { assetTag: 'AST-0003', model: { manufacturer: 'Apple', name: 'iPhone 15' } },
            allocatedTo: { fullName: 'James Bond', email: 'james@company.com' },
            remarks: 'Transfer requested to department developer'
          }
        ];
      }

      return res.status(200).json({
        success: true,
        data: {
          statusCounts: {
            availableAssets: availableCount,
            allocatedToday: allocatedTodayCount,
            returnedAssets: returnedCount,
            transfers: transfersCount,
            maintenanceQueue: maintenanceCount
          },
          statusDistribution,
          categoryDistribution,
          allocationTrends,
          allocationQueue,
          returnQueue,
          transferQueue
        }
      });
    }

    // ==========================================
    // 4. MAINTENANCE TEAM ROLE STATS
    // ==========================================
    if (role === 'Maintenance Team') {
      let underMaintenanceCount = 0;
      let completedRepairsCount = 0;
      let pendingRepairsCount = 0;
      let retiredAssetsCount = 0;

      let maintenanceTrend = [];
      let failureCategories = [];
      let repairSchedule = [];
      let repairHistory = [];

      if (dbConnected) {
        underMaintenanceCount = await Asset.countDocuments({ status: 'Maintenance' });
        pendingRepairsCount = underMaintenanceCount; // active maintenance is pending
        retiredAssetsCount = await Asset.countDocuments({ status: 'Retired' });
        completedRepairsCount = await Asset.countDocuments({ status: 'Available' }); // simplified proxy

        // Repair Schedule: active assets in maintenance
        repairSchedule = await Asset.find({ status: 'Maintenance' })
          .populate('category')
          .populate('model')
          .limit(10);

        // Repair History: available or retired assets previously repaired (simulated limit)
        repairHistory = await Asset.find({ status: { $in: ['Available', 'Retired'] } })
          .populate('category')
          .populate('model')
          .sort({ updatedAt: -1 })
          .limit(10);

        // Failure Categories
        const catGroup = await Asset.aggregate([
          { $match: { status: 'Maintenance' } },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        for (let item of catGroup) {
          if (item._id) {
            const cat = await AssetCategory.findById(item._id);
            failureCategories.push({ name: cat ? cat.name : 'Other', value: item.count });
          }
        }

        // Maintenance trend
        const trendGroup = await Asset.aggregate([
          { $match: { status: 'Maintenance' } },
          { $group: { _id: { month: { $month: '$updatedAt' }, year: { $year: '$updatedAt' } }, count: { $sum: 1 } } },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        maintenanceTrend = trendGroup.map(t => ({
          date: `${monthNames[t._id.month - 1]} ${t._id.year}`,
          repairs: t.count
        }));

      } else {
        // Fallback Maintenance stats
        underMaintenanceCount = 4;
        completedRepairsCount = 16;
        pendingRepairsCount = 4;
        retiredAssetsCount = 2;

        maintenanceTrend = [{ date: 'May 2026', repairs: 2 }, { date: 'Jun 2026', repairs: 5 }, { date: 'Jul 2026', repairs: 4 }];
        failureCategories = [{ name: 'Workstations', value: 3 }, { name: 'Mobile Devices', value: 1 }];

        repairSchedule = [
          {
            _id: 'mock_ms1',
            assetTag: 'AST-0004',
            serialNumber: 'SN-APL-IPH1122',
            model: { manufacturer: 'Apple', name: 'iPhone 15 Pro' },
            category: { name: 'Mobile Devices' },
            status: 'Maintenance'
          }
        ];
        repairHistory = [
          {
            _id: 'mock_mh1',
            assetTag: 'AST-0008',
            serialNumber: 'SN-DELL-MON4433',
            model: { manufacturer: 'Dell', name: 'P2422H' },
            category: { name: 'Monitors' },
            status: 'Available'
          }
        ];
      }

      return res.status(200).json({
        success: true,
        data: {
          statusCounts: {
            underMaintenance: underMaintenanceCount,
            completedRepairs: completedRepairsCount,
            pendingRepairs: pendingRepairsCount,
            retiredAssets: retiredAssetsCount
          },
          maintenanceTrend,
          failureCategories,
          repairSchedule,
          repairHistory
        }
      });
    }

    // ==========================================
    // 5. ADMIN ROLE STATS (DEFAULT)
    // ==========================================
    let totalEmployees = 0;
    let totalDepartments = 0;
    let totalAssets = 0;
    let availableAssets = 0;
    let allocatedAssets = 0;
    let maintenanceAssets = 0;
    let retiredAssets = 0;
    let pendingAllocations = 0;
    let pendingReturns = 0;
    let warrantyExpiringSoon = 0;
    let totalAssetValue = 0;

    let recentAllocations = [];
    let recentEmployees = [];
    let recentAssets = [];
    let pendingRequests = [];
    let notifications = [];

    let categoryDistribution = [];
    let statusDistribution = [];
    let departmentDistribution = [];
    let monthlyAllocations = [];
    let monthlyPurchases = [];

    if (dbConnected) {
      totalEmployees = await User.countDocuments();
      totalDepartments = await Department.countDocuments();
      totalAssets = await Asset.countDocuments();

      availableAssets = await Asset.countDocuments({ status: 'Available' });
      allocatedAssets = await Asset.countDocuments({ status: 'Allocated' });
      maintenanceAssets = await Asset.countDocuments({ status: 'Maintenance' });
      retiredAssets = await Asset.countDocuments({ status: 'Retired' });

      pendingAllocations = await AssetAllocation.countDocuments({ status: 'Pending Approval' });
      pendingReturns = await AssetAllocation.countDocuments({ status: 'Returned' });

      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(now.getDate() + 30);
      warrantyExpiringSoon = await Asset.countDocuments({
        status: { $ne: 'Retired' },
        warrantyDate: { $gte: now, $lte: thirtyDays }
      });

      const valGroup = await Asset.aggregate([{ $group: { _id: null, total: { $sum: '$cost' } } }]);
      totalAssetValue = valGroup.length > 0 ? valGroup[0].total : 0;

      recentAllocations = await AssetAllocation.find()
        .populate('asset', 'assetTag')
        .populate('allocatedTo', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(5);

      recentEmployees = await User.find()
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      recentAssets = await Asset.find()
        .populate('category', 'name')
        .populate('model', 'name manufacturer')
        .sort({ createdAt: -1 })
        .limit(5);

      // Pending Request rows
      pendingRequests = await AssetAllocation.find({ status: 'Pending Approval' })
        .populate('asset')
        .populate('allocatedTo', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(5);

      // System wide notification alerts
      notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(10);

      // Assets by Category
      const catGroup = await Asset.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
      for (let item of catGroup) {
        if (item._id) {
          const cat = await AssetCategory.findById(item._id);
          categoryDistribution.push({ categoryName: cat ? cat.name : 'Other', count: item.count });
        }
      }

      // Status
      statusDistribution = [
        { name: 'Available', value: availableAssets },
        { name: 'Allocated', value: allocatedAssets },
        { name: 'Maintenance', value: maintenanceAssets },
        { name: 'Retired', value: retiredAssets }
      ];

      // Assets by Department
      const deptAgg = await AssetAllocation.aggregate([
        { $match: { status: 'Allocated' } },
        { $lookup: { from: 'users', localField: 'allocatedTo', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $group: { _id: '$user.department', count: { $sum: 1 } } }
      ]);
      for (let item of deptAgg) {
        if (item._id) {
          const dept = await Department.findById(item._id);
          departmentDistribution.push({ departmentName: dept ? dept.name : 'Other', count: item.count });
        }
      }

      // Monthly Allocations
      const allocAgg = await AssetAllocation.aggregate([
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 }
      ]);
      monthlyAllocations = allocAgg.map(t => ({
        date: `${monthNames[t._id.month - 1]} ${t._id.year}`,
        allocations: t.count
      }));

      // Monthly Purchases
      const purchaseAgg = await Asset.aggregate([
        { $match: { purchaseDate: { $ne: null } } },
        {
          $group: {
            _id: { month: { $month: '$purchaseDate' }, year: { $year: '$purchaseDate' } },
            count: { $sum: 1 },
            value: { $sum: '$cost' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 }
      ]);
      monthlyPurchases = purchaseAgg.map(p => ({
        date: `${monthNames[p._id.month - 1]} ${p._id.year}`,
        purchases: p.count,
        value: p.value
      }));

    } else {
      // Fallback Admin stats
      totalEmployees = 18;
      totalDepartments = 4;
      totalAssets = 35;
      availableAssets = 15;
      allocatedAssets = 15;
      maintenanceAssets = 3;
      retiredAssets = 2;
      pendingAllocations = 2;
      pendingReturns = 1;
      warrantyExpiringSoon = 4;
      totalAssetValue = 48500;

      categoryDistribution = [{ categoryName: 'Workstations', count: 18 }, { categoryName: 'Monitors', count: 10 }];
      statusDistribution = [{ name: 'Available', value: 15 }, { name: 'Allocated', value: 15 }, { name: 'Maintenance', value: 3 }];
      departmentDistribution = [{ departmentName: 'Engineering', count: 8 }, { departmentName: 'Operations', count: 4 }];

      monthlyAllocations = [{ date: 'May 2026', allocations: 8 }, { date: 'Jun 2026', allocations: 12 }, { date: 'Jul 2026', allocations: 15 }];
      monthlyPurchases = [
        { date: 'May 2026', purchases: 2, value: 3400 },
        { date: 'Jun 2026', purchases: 4, value: 6800 },
        { date: 'Jul 2026', purchases: 3, value: 5100 }
      ];

      recentAllocations = [
        {
          _id: 'mock_ad_al1',
          asset: { assetTag: 'AST-0001' },
          allocatedTo: { fullName: 'Alice Johnson', email: 'alice@company.com' },
          allocationDate: '2026-07-10'
        }
      ];
      recentEmployees = [{ _id: 'e1', fullName: 'Alice Johnson', department: { name: 'Engineering' }, role: 'Employee' }];
      recentAssets = [{ _id: 'a1', assetTag: 'AST-0001', category: { name: 'Workstations' }, model: { manufacturer: 'Apple', name: 'MacBook Pro' }, status: 'Allocated' }];
      pendingRequests = [
        {
          _id: 'mock_ad_pr1',
          asset: { assetTag: 'AST-0005', model: { manufacturer: 'Lenovo', name: 'ThinkPad' } },
          allocatedTo: { fullName: 'David Lee', email: 'david@company.com' },
          createdAt: new Date().toISOString()
        }
      ];
      notifications = [
        { _id: 'notif_1', title: 'New Employee Registered', message: 'David Lee has joined the Engineering team.', createdAt: new Date().toISOString() }
      ];
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
          pendingRequests: pendingAllocations,
          pendingApprovals: pendingAllocations,
          pendingAllocations: pendingAllocations,
          pendingReturns: pendingReturns,
          warrantyExpiringSoon
        },
        totalValue: totalAssetValue,
        recentAllocations,
        recentEmployees,
        recentAssets,
        pendingRequests,
        notifications,
        categoryDistribution,
        statusDistribution,
        departmentDistribution,
        monthlyAllocations,
        monthlyPurchases
      }
    });

  } catch (err) {
    console.error(`[Error in dashboardController.js]:`, err.stack);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
