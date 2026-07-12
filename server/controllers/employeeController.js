const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const mockStorage = require('../config/mockStorage');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all employees/users with search & filter
// @route   GET /api/employees
// @access  Private (Admin, Asset Manager, Department Head)
exports.getEmployees = async (req, res) => {
  const { search, department, role, isActive } = req.query;

  try {
    if (isDbConnected()) {
      let query = {};

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (department) {
        query.department = department;
      }

      if (role) {
        query.role = role;
      }

      if (isActive !== undefined && isActive !== '') {
        query.isActive = isActive === 'true';
      }

      const users = await User.find(query)
        .populate('department', 'name code')
        .select('-password')
        .sort({ fullName: 1 });

      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } else {
      // Offline mock fallback
      let data = [...mockStorage.mockUsers];

      // Search by name/email
      if (search) {
        const term = search.toLowerCase();
        data = data.filter(
          (u) =>
            u.fullName.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term)
        );
      }

      // Filter by department
      if (department) {
        data = data.filter((u) => u.department === department);
      }

      // Filter by role
      if (role) {
        data = data.filter((u) => u.role === role);
      }

      // Filter by status
      if (isActive !== undefined && isActive !== '') {
        const activeBool = isActive === 'true';
        data = data.filter((u) => u.isActive === activeBool);
      }

      // Populate department object
      const processedUsers = data.map((u) => {
        let deptObj = null;
        if (u.department) {
          const matchedDept = mockStorage.mockDepartments.find(
            (d) => d._id === u.department
          );
          if (matchedDept) {
            deptObj = {
              _id: matchedDept._id,
              name: matchedDept.name,
              code: matchedDept.code
            };
          }
        }

        return {
          ...u,
          department: deptObj
        };
      });

      res.status(200).json({
        success: true,
        count: processedUsers.length,
        data: processedUsers
      });
    }
  } catch (err) {
    console.error(`[Error in employeeController.js]:`, err.stack);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private (Admin, Asset Manager, Department Head)
exports.getEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const employee = await User.findById(id)
        .populate('department', 'name code')
        .select('-password');

      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      res.status(200).json({
        success: true,
        data: employee
      });
    } else {
      // Offline mock fallback
      const u = mockStorage.mockUsers.find((u) => u._id === id);
      if (!u) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      let deptObj = null;
      if (u.department) {
        const matchedDept = mockStorage.mockDepartments.find(
          (d) => d._id === u.department
        );
        if (matchedDept) {
          deptObj = {
            _id: matchedDept._id,
            name: matchedDept.name,
            code: matchedDept.code
          };
        }
      }

      res.status(200).json({
        success: true,
        data: {
          ...u,
          department: deptObj
        }
      });
    }
  } catch (err) {
    console.error(`[Error in employeeController.js]:`, err.stack);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private (Admin only)
exports.createEmployee = async (req, res) => {
  const { fullName, email, password, role, department, isActive } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide full name, email, and password'
    });
  }

  try {
    if (isDbConnected()) {
      // Check duplicate email
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'An employee with this email already exists'
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Create new user (Mongoose model pre-save hook handles hashing)
      const user = await User.create({
        fullName,
        email: email.toLowerCase().trim(),
        password,
        role: role || 'Employee',
        department: department || null,
        isActive: isActive !== undefined ? isActive : true
      });

      // Exclude password in response
      const responseUser = user.toObject();
      delete responseUser.password;

      res.status(201).json({
        success: true,
        data: responseUser
      });
    } else {
      // Offline mock fallback
      const dup = mockStorage.mockUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (dup) {
        return res.status(400).json({
          success: false,
          message: 'An employee with this email already exists'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const newEmp = {
        _id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
        fullName,
        email: email.toLowerCase().trim(),
        role: role || 'Employee',
        department: department || null,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockStorage.mockUsers.push(newEmp);

      res.status(201).json({
        success: true,
        data: newEmp
      });
    }
  } catch (err) {
    console.error(`[Error in employeeController.js]:`, err.stack);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin only)
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { fullName, email, role, department, isActive, password } = req.body;

  try {
    if (isDbConnected()) {
      // Check duplicate email excluding current user
      if (email) {
        const emailExists = await User.findOne({
          _id: { $ne: id },
          email: email.toLowerCase().trim()
        });

        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Another employee with this email already exists'
          });
        }
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Update fields
      if (fullName) user.fullName = fullName;
      if (email) user.email = email.toLowerCase().trim();
      if (role) user.role = role;
      if (department !== undefined) user.department = department || null;
      if (isActive !== undefined) user.isActive = isActive;

      // Handle password update if provided
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long'
          });
        }
        user.password = password; // Trigger save pre-hook hashing
      }

      await user.save();

      // Return populated user excluding password
      const updatedUser = await User.findById(id)
        .populate('department', 'name code')
        .select('-password');

      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } else {
      // Offline mock fallback
      const userIdx = mockStorage.mockUsers.findIndex((u) => u._id === id);
      if (userIdx === -1) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const currentUser = mockStorage.mockUsers[userIdx];

      if (email) {
        const dup = mockStorage.mockUsers.find(
          (u) => u._id !== id && u.email.toLowerCase() === email.toLowerCase().trim()
        );

        if (dup) {
          return res.status(400).json({
            success: false,
            message: 'Another employee with this email already exists'
          });
        }
      }

      if (fullName) currentUser.fullName = fullName;
      if (email) currentUser.email = email.toLowerCase().trim();
      if (role) currentUser.role = role;
      if (department !== undefined) currentUser.department = department || null;
      if (isActive !== undefined) currentUser.isActive = isActive;
      currentUser.updatedAt = new Date().toISOString();

      res.status(200).json({
        success: true,
        data: currentUser
      });
    }
  } catch (err) {
    console.error(`[Error in employeeController.js]:`, err.stack);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Check if user is managing any department
      const Department = require('../models/Department');
      await Department.updateMany({ manager: id }, { manager: null });

      await User.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Employee deleted successfully and department manager links cleaned.'
      });
    } else {
      // Offline mock fallback
      const userIdx = mockStorage.mockUsers.findIndex((u) => u._id === id);
      if (userIdx === -1) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      // Clean departments managed by this user
      mockStorage.mockDepartments.forEach((d) => {
        if (d.manager === id) {
          d.manager = null;
        }
      });

      mockStorage.mockUsers.splice(userIdx, 1);

      res.status(200).json({
        success: true,
        message: 'Employee deleted successfully and department manager links cleaned.'
      });
    }
  } catch (err) {
    console.error(`[Error in employeeController.js]:`, err.stack);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
