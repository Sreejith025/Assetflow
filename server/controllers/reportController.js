const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const AssetAllocation = require('../models/AssetAllocation');
const User = require('../models/User');
const Department = require('../models/Department');
const AssetCategory = require('../models/AssetCategory');

// @desc    Get report statistics and filtered records
// @route   GET /api/reports
// @access  Private
exports.getReportData = async (req, res) => {
  try {
    const dbConnected = Asset.db.readyState === 1;

    if (!dbConnected) {
      // Offline simulated sandbox report metrics
      return res.status(200).json({
        success: true,
        data: {
          assetsByDepartment: [
            { departmentName: 'Engineering', count: 8, value: 12400 },
            { departmentName: 'Product Management', count: 4, value: 5800 },
            { departmentName: 'Operations', count: 3, value: 3900 }
          ],
          assetsByCategory: [
            { categoryName: 'Workstations', count: 12, value: 24000 },
            { categoryName: 'Mobile Devices', count: 6, value: 5400 },
            { categoryName: 'Monitors', count: 3, value: 1800 }
          ],
          allocations: [
            { 
              _id: 'mock_a1', 
              asset: { assetTag: 'AST-0001', cost: 1200 }, 
              allocatedTo: { fullName: 'Alice Johnson', email: 'alice@company.com' }, 
              allocationDate: '2026-07-01T10:00:00Z', 
              status: 'Allocated' 
            },
            { 
              _id: 'mock_a2', 
              asset: { assetTag: 'AST-0002', cost: 1800 }, 
              allocatedTo: { fullName: 'Bob Carter', email: 'bob@company.com' }, 
              allocationDate: '2026-07-05T12:00:00Z', 
              status: 'Allocated' 
            }
          ],
          returns: [
            { 
              _id: 'mock_r1', 
              asset: { assetTag: 'AST-0003', cost: 900 }, 
              allocatedTo: { fullName: 'Jane Doe', email: 'jane@company.com' }, 
              allocationDate: '2026-06-01T10:00:00Z',
              actualReturnDate: '2026-07-08T15:00:00Z', 
              status: 'Returned' 
            }
          ],
          maintenance: [
            { 
              _id: 'mock_m1', 
              assetTag: 'AST-0004', 
              category: { name: 'Workstations' },
              model: { manufacturer: 'Apple', name: 'MacBook Pro' },
              vendor: 'Apple Care', 
              cost: 1500, 
              status: 'Maintenance' 
            }
          ],
          valuationSummary: {
            totalValue: 31200,
            averageCost: 1560,
            totalAssetsCount: 20
          }
        }
      });
    }

    const { startDate, endDate, department, category, employee } = req.query;

    // 1. Build Query Parameters
    const assetQuery = {};
    const allocationQuery = {};

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      assetQuery.category = category;
      const targetAssets = await Asset.find({ category }).select('_id');
      allocationQuery.asset = { $in: targetAssets.map(a => a._id) };
    }

    if (employee && mongoose.Types.ObjectId.isValid(employee)) {
      allocationQuery.allocatedTo = employee;
    }

    if (department && mongoose.Types.ObjectId.isValid(department)) {
      const deptEmployees = await User.find({ department }).select('_id');
      const deptEmployeeIds = deptEmployees.map(e => e._id);
      allocationQuery.allocatedTo = { $in: deptEmployeeIds };
    }

    if (startDate || endDate) {
      allocationQuery.allocationDate = {};
      if (startDate) {
        allocationQuery.allocationDate.$gte = new Date(startDate);
      }
      if (endDate) {
        allocationQuery.allocationDate.$lte = new Date(endDate);
      }
    }

    // 2. Fetch Allocations Report list
    const allocations = await AssetAllocation.find(allocationQuery)
      .populate({
        path: 'asset',
        select: 'assetTag cost model',
        populate: { path: 'model', select: 'name manufacturer' }
      })
      .populate('allocatedTo', 'fullName email department')
      .sort({ allocationDate: -1 });

    // 3. Fetch Returns Report list
    const returnQuery = { ...allocationQuery, status: 'Returned' };
    const returns = await AssetAllocation.find(returnQuery)
      .populate({
        path: 'asset',
        select: 'assetTag cost model',
        populate: { path: 'model', select: 'name manufacturer' }
      })
      .populate('allocatedTo', 'fullName email department')
      .sort({ actualReturnDate: -1 });

    // 4. Fetch Maintenance Report list
    const maintenanceQuery = { status: 'Maintenance' };
    if (category) {
      maintenanceQuery.category = category;
    }
    const maintenance = await Asset.find(maintenanceQuery)
      .populate('category', 'name')
      .populate('model', 'name manufacturer')
      .sort({ createdAt: -1 });

    // 5. Assets by Category Split (Aggregated)
    const matchStage = {};
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      matchStage.category = new mongoose.Types.ObjectId(category);
    }

    const categoryAggregate = await Asset.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          value: { $sum: '$cost' }
        }
      }
    ]);

    const assetsByCategory = [];
    for (let c of categoryAggregate) {
      if (c._id) {
        const catObj = await AssetCategory.findById(c._id);
        assetsByCategory.push({
          categoryName: catObj ? catObj.name : 'Unknown',
          count: c.count,
          value: c.value
        });
      }
    }

    // 6. Assets by Department Valuation (Aggregated via active allocations)
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

    const assetsByDepartment = [];
    for (let d of deptAllocations) {
      if (d._id) {
        const deptObj = await Department.findById(d._id);
        const deptUsers = await User.find({ department: d._id }).select('_id');
        const deptUserIds = deptUsers.map(u => u._id);
        
        const activeAllocations = await AssetAllocation.find({
          status: 'Allocated',
          allocatedTo: { $in: deptUserIds }
        }).populate('asset');
        
        const totalValue = activeAllocations.reduce((sum, alloc) => sum + (alloc.asset?.cost || 0), 0);

        assetsByDepartment.push({
          departmentName: deptObj ? deptObj.name : 'Unknown',
          count: d.count,
          value: totalValue
        });
      }
    }

    // 7. Value Valuation Summary metrics
    const valuationAggregate = await Asset.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$cost' },
          averageCost: { $avg: '$cost' },
          count: { $sum: 1 }
        }
      }
    ]);

    const valuationSummary = {
      totalValue: valuationAggregate.length > 0 ? valuationAggregate[0].totalValue : 0,
      averageCost: valuationAggregate.length > 0 ? Math.round(valuationAggregate[0].averageCost) : 0,
      totalAssetsCount: valuationAggregate.length > 0 ? valuationAggregate[0].count : 0
    };

    return res.status(200).json({
      success: true,
      data: {
        assetsByDepartment,
        assetsByCategory,
        allocations,
        returns,
        maintenance,
        valuationSummary
      }
    });

  } catch (err) {
    console.error(`[Error in reportController.js]:`, err.stack);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
