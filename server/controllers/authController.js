const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: Generate Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'assetflow_super_secret_jwt_key_1234567890',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide name, email, and password' 
    });
  }

  try {
    // Check if database is connected (readyState: 1 = connected)
    if (User.db.readyState === 1) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'User already exists' 
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || 'Employee'
      });

      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      // Fallback offline mock mode
      console.warn('Registering user in offline/mock mode (database offline).');
      const mockUser = {
        id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        role: role || 'Employee',
        isMock: true
      };
      const token = generateToken(mockUser);
      return res.status(201).json({
        success: true,
        token,
        user: mockUser
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide email and password' 
    });
  }

  try {
    // Check if database is connected (readyState: 1 = connected)
    if (User.db.readyState === 1) {
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      // Database offline mock authentication
      console.warn('Authenticating user in offline/mock mode (database offline).');
      
      // Deduce role from email prefix for quick role simulation:
      // admin@assetflow.com -> Admin
      // manager@assetflow.com -> Asset Manager
      // head@assetflow.com -> Department Head
      // employee@assetflow.com -> Employee (default)
      let role = 'Employee';
      let name = 'Demo Employee';
      const lowerEmail = email.toLowerCase();
      
      if (lowerEmail.startsWith('admin')) {
        role = 'Admin';
        name = 'System Administrator';
      } else if (lowerEmail.startsWith('manager')) {
        role = 'Asset Manager';
        name = 'Asset Manager';
      } else if (lowerEmail.startsWith('head')) {
        role = 'Department Head';
        name = 'Department Head';
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters' 
        });
      }

      const mockUser = {
        id: 'mock_user_9999',
        name,
        email,
        role,
        isMock: true
      };
      
      const token = generateToken(mockUser);
      return res.status(200).json({
        success: true,
        token,
        user: mockUser
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};
