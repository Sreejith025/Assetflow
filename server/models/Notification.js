const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null represents a global/admin notification
  },
  type: {
    type: String,
    enum: [
      'Asset Allocated',
      'Asset Returned',
      'Asset Transfer',
      'Maintenance Approved',
      'Warranty Expiring',
      'New Employee Added'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
