const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: Generate Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id || user.id, 
      fullName: user.fullName || user.name, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'assetflow_super_secret_jwt_key_1234567890',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Helper: Set cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user);

  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        fullName: user.fullName || user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive !== undefined ? user.isActive : true
      }
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide full name, email, and password' 
    });
  }

  // Simple email regex check
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
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
        fullName,
        email,
        password,
        role: role || 'Employee',
        isActive: true
      });

      return sendTokenResponse(user, 201, res);
    } else {
      // Fallback offline mock mode
      console.warn('Registering user in offline/mock mode (database offline).');
      const mockUser = {
        id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
        fullName,
        email,
        role: role || 'Employee',
        isActive: true,
        isMock: true
      };
      return sendTokenResponse(mockUser, 201, res);
    }
  } catch (error) {
    console.error(`[Error in authController.js]:`, error.stack);
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
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

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      return sendTokenResponse(user, 200, res);
    } else {
      // Database offline mock authentication
      console.warn('Authenticating user in offline/mock mode (database offline).');
      
      let role = 'Employee';
      let fullName = 'Demo Employee';
      const lowerEmail = email.toLowerCase();
      
      if (lowerEmail.startsWith('admin')) {
        role = 'Admin';
        fullName = 'System Administrator';
      } else if (lowerEmail.startsWith('manager')) {
        role = 'Asset Manager';
        fullName = 'Asset Manager';
      } else if (lowerEmail.startsWith('head')) {
        role = 'Department Head';
        fullName = 'Department Head';
      } else if (lowerEmail.startsWith('maintenance')) {
        role = 'Maintenance Team';
        fullName = 'Maintenance Engineer';
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters' 
        });
      }

      const mockUser = {
        id: 'mock_user_9999',
        fullName,
        email,
        role,
        isActive: true,
        isMock: true
      };
      
      return sendTokenResponse(mockUser, 200, res);
    }
  } catch (error) {
    console.error(`[Error in authController.js]:`, error.stack);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Public/Private
exports.logoutUser = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    let user = req.user;
    if (User.db.readyState === 1 && !req.user.isMock) {
      const dbUser = await User.findById(req.user.id || req.user._id).populate('department', 'name code').select('-password');
      if (dbUser) user = dbUser;
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        fullName: user.fullName || user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive !== undefined ? user.isActive : true,
        department: user.department,
        phone: user.phone || '+1 (555) 019-2834',
        avatar: user.avatar || ''
      }
    });
  } catch (error) {
    console.error(`[Error in authController.js]:`, error.stack);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
