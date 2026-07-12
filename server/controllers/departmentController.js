const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const mockStorage = require('../config/mockStorage');

// Helper to check DB status
const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
  const { search, isActive } = req.query;

  try {
    if (isDbConnected()) {
      let query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ];
      }

      if (isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true';
      }

      const departments = await Department.find(query)
        .populate('manager', 'fullName email role')
        .sort({ name: 1 });

      // Add dynamic employee counts
      const departmentsWithCounts = await Promise.all(
        departments.map(async (dept) => {
          const employeeCount = await User.countDocuments({ department: dept._id });
          return {
            ...dept.toObject(),
            employeeCount
          };
        })
      );

      res.status(200).json({
        success: true,
        count: departmentsWithCounts.length,
        data: departmentsWithCounts
      });
    } else {
      // Offline mock fallback
      let data = [...mockStorage.mockDepartments];

      // Filter by search
      if (search) {
        const term = search.toLowerCase();
        data = data.filter(
          (d) =>
            d.name.toLowerCase().includes(term) ||
            d.code.toLowerCase().includes(term)
        );
      }

      // Filter by isActive
      if (isActive !== undefined && isActive !== '') {
        const activeBool = isActive === 'true';
        data = data.filter((d) => d.isActive === activeBool);
      }

      // Populate manager and count employees
      const processedDepts = data.map((dept) => {
        let managerUser = null;
        if (dept.manager) {
          const userObj = mockStorage.mockUsers.find((u) => u._id === dept.manager);
          if (userObj) {
            managerUser = {
              _id: userObj._id,
              fullName: userObj.fullName,
              email: userObj.email,
              role: userObj.role
            };
          }
        }

        const employeeCount = mockStorage.mockUsers.filter(
          (u) => u.department === dept._id
        ).length;

        return {
          ...dept,
          manager: managerUser,
          employeeCount
        };
      });

      res.status(200).json({
        success: true,
        count: processedDepts.length,
        data: processedDepts
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const dept = await Department.findById(id).populate('manager', 'fullName email role');
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      const employeeCount = await User.countDocuments({ department: dept._id });
      res.status(200).json({
        success: true,
        data: {
          ...dept.toObject(),
          employeeCount
        }
      });
    } else {
      // Offline mock fallback
      const dept = mockStorage.mockDepartments.find((d) => d._id === id);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      let managerUser = null;
      if (dept.manager) {
        const userObj = mockStorage.mockUsers.find((u) => u._id === dept.manager);
        if (userObj) {
          managerUser = {
            _id: userObj._id,
            fullName: userObj.fullName,
            email: userObj.email,
            role: userObj.role
          };
        }
      }

      const employeeCount = mockStorage.mockUsers.filter(
        (u) => u.department === dept._id
      ).length;

      res.status(200).json({
        success: true,
        data: {
          ...dept,
          manager: managerUser,
          employeeCount
        }
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin only)
exports.createDepartment = async (req, res) => {
  const { name, code, description, manager, isActive } = req.body;

  if (!name || !code) {
    return res.status(400).json({
      success: false,
      message: 'Please provide department name and code'
    });
  }

  try {
    if (isDbConnected()) {
      // Check duplicate name or code
      const duplicate = await Department.findOne({
        $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }]
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name or code already exists'
        });
      }

      const dept = await Department.create({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description || '',
        manager: manager || null,
        isActive: isActive !== undefined ? isActive : true
      });

      res.status(201).json({
        success: true,
        data: dept
      });
    } else {
      // Offline mock fallback
      const dup = mockStorage.mockDepartments.find(
        (d) =>
          d.name.toLowerCase() === name.trim().toLowerCase() ||
          d.code.toUpperCase() === code.trim().toUpperCase()
      );

      if (dup) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name or code already exists'
        });
      }

      const newDept = {
        _id: 'mock_dept_' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description || '',
        manager: manager || null,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockStorage.mockDepartments.push(newDept);

      res.status(201).json({
        success: true,
        data: newDept
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin only)
exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, code, description, manager, isActive } = req.body;

  try {
    if (isDbConnected()) {
      // Validate duplicates excluding current department
      if (name || code) {
        const orConditions = [];
        if (name) orConditions.push({ name: name.trim() });
        if (code) orConditions.push({ code: code.trim().toUpperCase() });

        const duplicate = await Department.findOne({
          _id: { $ne: id },
          $or: orConditions
        });

        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: 'Another department with this name or code already exists'
          });
        }
      }

      const updateFields = {};
      if (name) updateFields.name = name.trim();
      if (code) updateFields.code = code.trim().toUpperCase();
      if (description !== undefined) updateFields.description = description;
      if (manager !== undefined) updateFields.manager = manager || null;
      if (isActive !== undefined) updateFields.isActive = isActive;

      const dept = await Department.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true
      }).populate('manager', 'fullName email role');

      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      res.status(200).json({
        success: true,
        data: dept
      });
    } else {
      // Offline mock fallback
      const deptIdx = mockStorage.mockDepartments.findIndex((d) => d._id === id);
      if (deptIdx === -1) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      const currentDept = mockStorage.mockDepartments[deptIdx];

      // Validate duplicate name/code in mock
      const dup = mockStorage.mockDepartments.find(
        (d) =>
          d._id !== id &&
          ((name && d.name.toLowerCase() === name.trim().toLowerCase()) ||
            (code && d.code.toUpperCase() === code.trim().toUpperCase()))
      );

      if (dup) {
        return res.status(400).json({
          success: false,
          message: 'Another department with this name or code already exists'
        });
      }

      if (name) currentDept.name = name.trim();
      if (code) currentDept.code = code.trim().toUpperCase();
      if (description !== undefined) currentDept.description = description;
      if (manager !== undefined) currentDept.manager = manager || null;
      if (isActive !== undefined) currentDept.isActive = isActive;
      currentDept.updatedAt = new Date().toISOString();

      res.status(200).json({
        success: true,
        data: currentDept
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const dept = await Department.findById(id);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      // Integrity update: set department reference of users assigned to this department to null
      await User.updateMany({ department: id }, { department: null });

      await Department.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully and employee links cleaned.'
      });
    } else {
      // Offline mock fallback
      const deptIdx = mockStorage.mockDepartments.findIndex((d) => d._id === id);
      if (deptIdx === -1) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      // Clean users
      mockStorage.mockUsers.forEach((u) => {
        if (u.department === id) {
          u.department = null;
        }
      });

      mockStorage.mockDepartments.splice(deptIdx, 1);

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully and employee links cleaned.'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
