const { getAuth } = require('@clerk/express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify Clerk token and attach/sync user
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Sandbox bypass: check if client is sending local sandbox mock token
  if (authHeader && authHeader.startsWith('Bearer simulated_jwt_token_12345')) {
    req.user = {
      _id: 'mock_user_9999',
      id: 'mock_user_9999',
      fullName: 'System Administrator',
      email: 'admin@assetflow.com',
      role: 'Admin',
      isMock: true
    };
    return next();
  }

  // Support role testing offline tokens
  if (authHeader && authHeader.startsWith('Bearer mock_')) {
    const mockToken = authHeader.split(' ')[1];
    let role = 'Employee';
    let fullName = 'Demo Employee';
    let email = 'employee@assetflow.com';

    if (mockToken.includes('admin')) {
      role = 'Admin';
      fullName = 'System Administrator';
      email = 'admin@assetflow.com';
    } else if (mockToken.includes('manager')) {
      role = 'Asset Manager';
      fullName = 'Asset Manager';
      email = 'manager@assetflow.com';
    } else if (mockToken.includes('head')) {
      role = 'Department Head';
      fullName = 'Department Head';
      email = 'head@assetflow.com';
    } else if (mockToken.includes('maintenance')) {
      role = 'Maintenance Team';
      fullName = 'Maintenance Engineer';
      email = 'maintenance@assetflow.com';
    }

    req.user = {
      _id: 'mock_user_9999',
      id: 'mock_user_9999',
      fullName,
      email,
      role,
      isMock: true
    };
    return next();
  }

  // JWT Fallback Verification (Bearer Token or Cookie)
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token && token !== 'undefined' && !token.startsWith('sess_')) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'assetflow_super_secret_jwt_key_1234567890');
      const dbConnected = User.db.readyState === 1;

      if (dbConnected) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } else {
        req.user = {
          _id: decoded.id,
          id: decoded.id,
          fullName: decoded.fullName,
          email: decoded.email,
          role: decoded.role,
          isMock: true
        };
        return next();
      }
    } catch (jwtErr) {
      // If verification fails, fall through to Clerk validation
      console.warn('JWT verification failed, falling back to Clerk verification:', jwtErr.message);
    }
  }

  // Real Clerk Session Verification
  let auth;
  try {
    auth = getAuth(req);
  } catch (err) {
    console.error('Clerk getAuth error:', err.message);
  }

  if (!auth || !auth.userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route, sign-in required' 
    });
  }

  try {
    const dbConnected = User.db.readyState === 1;

    if (dbConnected) {
      let user = await User.findOne({ clerkId: auth.userId }).select('-password');

      // Sync User details from Clerk token claims to MongoDB
      if (!user) {
        const claims = auth.sessionClaims;
        const email = claims?.email || auth.sessionClaims?.primary_email_address || '';
        const fullName = claims?.name || `${claims?.first_name || ''} ${claims?.last_name || ''}`.trim() || 'Clerk User';

        if (email) {
          // Link pre-existing database records with the same email
          user = await User.findOne({ email: email.toLowerCase().trim() }).select('-password');
          if (user) {
            user.clerkId = auth.userId;
            await user.save();
          }
        }

        if (!user) {
          let role = 'Employee';
          // Auto-admin for the seeded account
          if (email.toLowerCase() === 'admin@assetflow.com') {
            role = 'Admin';
          }
          user = await User.create({
            clerkId: auth.userId,
            fullName: fullName || 'Clerk User',
            email: email || 'no-email@clerk.com',
            role,
            isActive: true
          });
        }
      }

      req.user = user;
      return next();
    } else {
      // Fallback offline database mapping via claims
      const claims = auth.sessionClaims;
      const email = claims?.email || 'employee@assetflow.com';
      const fullName = claims?.name || 'Clerk User';
      
      let role = 'Employee';
      const lowerEmail = email.toLowerCase();
      if (lowerEmail.startsWith('admin')) {
        role = 'Admin';
      } else if (lowerEmail.startsWith('manager')) {
        role = 'Asset Manager';
      } else if (lowerEmail.startsWith('head')) {
        role = 'Department Head';
      } else if (lowerEmail.startsWith('maintenance')) {
        role = 'Maintenance Team';
      }

      req.user = {
        _id: `clerk_mock_${auth.userId}`,
        id: `clerk_mock_${auth.userId}`,
        fullName,
        email,
        role,
        isMock: true
      };
      return next();
    }
  } catch (err) {
    console.error('Error in protect middleware:', err.stack);
    return res.status(500).json({ 
      success: false, 
      message: err.message 
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
