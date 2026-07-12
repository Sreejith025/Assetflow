const Notification = require('../models/Notification');
const Asset = require('../models/Asset');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const dbConnected = Notification.db.readyState === 1;

    if (!dbConnected) {
      // Fallback local mock notifications
      return res.status(200).json({
        success: true,
        data: [
          {
            _id: 'mock_notif_1',
            type: 'Asset Allocated',
            title: 'New Asset Assigned',
            message: 'A workstation MacBook Pro 16 has been allocated to you.',
            isRead: false,
            createdAt: new Date().toISOString()
          },
          {
            _id: 'mock_notif_2',
            type: 'Warranty Expiring',
            title: 'Asset Warranty Expiring',
            message: 'Monitor Dell U2723QE (AST-0002) warranty expires in 15 days.',
            isRead: true,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      });
    }

    const isAdminOrManager = req.user.role === 'Admin' || req.user.role === 'Asset Manager';

    // Scoped dynamic check for expiring warranties (for Admin/Asset Manager)
    if (isAdminOrManager) {
      try {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const expiringAssets = await Asset.find({
          status: { $ne: 'Retired' },
          warrantyDate: { $gte: now, $lte: thirtyDaysFromNow }
        }).populate('model');

        for (let asset of expiringAssets) {
          const exists = await Notification.findOne({
            type: 'Warranty Expiring',
            referenceId: asset._id
          });
          if (!exists) {
            await Notification.create({
              recipient: null, // global alerts to admin/manager
              type: 'Warranty Expiring',
              title: 'Warranty Expiring Soon',
              message: `Asset warranty for ${asset.model?.manufacturer || ''} ${asset.model?.name || ''} (Tag: ${asset.assetTag}) expires on ${asset.warrantyDate.toISOString().split('T')[0]}.`,
              referenceId: asset._id
            });
          }
        }
      } catch (err) {
        console.error('Error generating warranty notifications:', err.message);
      }
    }

    // Query filters: recipient matching user ID OR recipient null for Admins/Managers
    const query = {
      $or: [
        { recipient: req.user._id }
      ]
    };

    if (isAdminOrManager) {
      query.$or.push({ recipient: null });
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: notifications
    });

  } catch (err) {
    console.error(`[Error in notificationController.js]:`, err.stack);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const dbConnected = Notification.db.readyState === 1;

    if (!dbConnected) {
      return res.status(200).json({ success: true });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Verify ownership
    const isAdminOrManager = req.user.role === 'Admin' || req.user.role === 'Asset Manager';
    if (notification.recipient && notification.recipient.toString() !== req.user._id.toString() && !isAdminOrManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to read this notification'
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      data: notification
    });

  } catch (err) {
    console.error(`[Error in notificationController.js]:`, err.stack);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const dbConnected = Notification.db.readyState === 1;

    if (!dbConnected) {
      return res.status(200).json({ success: true });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Verify ownership
    const isAdminOrManager = req.user.role === 'Admin' || req.user.role === 'Asset Manager';
    if (notification.recipient && notification.recipient.toString() !== req.user._id.toString() && !isAdminOrManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await notification.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (err) {
    console.error(`[Error in notificationController.js]:`, err.stack);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Mark all user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res) => {
  try {
    const dbConnected = Notification.db.readyState === 1;

    if (!dbConnected) {
      return res.status(200).json({ success: true });
    }

    const isAdminOrManager = req.user.role === 'Admin' || req.user.role === 'Asset Manager';
    const query = {
      $or: [
        { recipient: req.user._id }
      ]
    };

    if (isAdminOrManager) {
      query.$or.push({ recipient: null });
    }

    await Notification.updateMany(query, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error(`[Error in notificationController.js markAllRead]:`, err.stack);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
