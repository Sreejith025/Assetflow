const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token and attach user
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route, token missing' 
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'assetflow_super_secret_jwt_key_1234567890';
    const decoded = jwt.verify(token, secret);

    // Try finding user in database
    try {
      if (User.db.readyState === 1) { // 1 = connected
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      }
    } catch (dbError) {
      console.warn('Database query failed in auth middleware. Using token payload fallback.');
    }

    // Offline / Fallback mode: Use decoded data if DB is unavailable
    if (decoded.email && decoded.role) {
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        fullName: decoded.fullName || decoded.name || 'Mock User',
        name: decoded.fullName || decoded.name || 'Mock User',
        email: decoded.email,
        role: decoded.role,
        isMock: true
      };
      return next();
    }

    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, user check failed' 
    });
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, token invalid or expired' 
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
