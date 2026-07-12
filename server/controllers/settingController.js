const Setting = require('../models/Setting');
const User = require('../models/User');

// @desc    Get all organization settings
// @route   GET /api/settings/org
// @access  Private
exports.getOrgSettings = async (req, res) => {
  try {
    const dbConnected = Setting.db.readyState === 1;

    if (!dbConnected) {
      return res.status(200).json({
        success: true,
        data: {
          orgName: 'AssetFlow Corp',
          orgAddress: '100 Silicon Valley Way, CA',
          orgContact: 'support@assetflow.com',
          orgCurrency: 'USD',
          orgTimezone: 'PST'
        }
      });
    }

    const keys = ['orgName', 'orgAddress', 'orgContact', 'orgCurrency', 'orgTimezone'];
    const settingsObj = {};

    for (let key of keys) {
      let doc = await Setting.findOne({ key });
      if (!doc) {
        // Seed initial default value
        let defaultVal = '';
        if (key === 'orgName') defaultVal = 'AssetFlow Corp';
        if (key === 'orgAddress') defaultVal = '100 Tech Park, CA';
        if (key === 'orgContact') defaultVal = 'support@assetflow.com';
        if (key === 'orgCurrency') defaultVal = 'USD';
        if (key === 'orgTimezone') defaultVal = 'UTC';

        doc = await Setting.create({ key, value: defaultVal });
      }
      settingsObj[key] = doc.value;
    }

    return res.status(200).json({
      success: true,
      data: settingsObj
    });

  } catch (err) {
    console.error(`[Error in settingController.js]:`, err.stack);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update organization settings
// @route   PUT /api/settings/org
// @access  Private/Admin
exports.updateOrgSettings = async (req, res) => {
  try {
    const dbConnected = Setting.db.readyState === 1;

    if (!dbConnected) {
      return res.status(200).json({ success: true });
    }

    const { orgName, orgAddress, orgContact, orgCurrency, orgTimezone } = req.body;
    const updates = { orgName, orgAddress, orgContact, orgCurrency, orgTimezone };

    for (let key in updates) {
      if (updates[key] !== undefined) {
        await Setting.findOneAndUpdate(
          { key },
          { value: updates[key] },
          { upsert: true, new: true }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Organization settings updated successfully'
    });

  } catch (err) {
    console.error(`[Error in settingController.js]:`, err.stack);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update user profile settings
// @route   PUT /api/settings/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const dbConnected = User.db.readyState === 1;

    if (!dbConnected) {
      return res.status(200).json({
        success: true,
        data: {
          fullName: req.body.fullName
        }
      });
    }

    const { fullName } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    user.fullName = fullName;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        fullName: user.fullName
      }
    });

  } catch (err) {
    console.error(`[Error in settingController.js]:`, err.stack);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
