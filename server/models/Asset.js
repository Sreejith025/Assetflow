const mongoose = require('mongoose');
const QRCode = require('qrcode');

const AssetSchema = new mongoose.Schema({
  assetTag: {
    type: String,
    unique: true
  },
  serialNumber: {
    type: String,
    required: [true, 'Please add a unique serial number'],
    unique: true,
    trim: true
  },
  model: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssetModel',
    required: [true, 'Please associate this asset with a model']
  },
  status: {
    type: String,
    enum: ['Available', 'Allocated', 'Maintenance', 'Retired'],
    default: 'Available'
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Please specify the purchase date']
  },
  warrantyDate: {
    type: Date,
    required: [true, 'Please specify the warranty date']
  },
  vendor: {
    type: String,
    required: [true, 'Please specify the vendor'],
    trim: true
  },
  cost: {
    type: Number,
    required: [true, 'Please specify the purchase cost']
  },
  image: {
    type: String,
    default: ''
  },
  qrCode: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-generate Asset Tag and QR Code on Save
AssetSchema.pre('save', async function(next) {
  // Capture maintenance status change
  if (this.isModified('status') && this.status === 'Maintenance') {
    this._statusChangedToMaintenance = true;
  }

  // Generate Asset Tag
  if (this.isNew || !this.assetTag) {
    try {
      const lastAsset = await this.constructor.findOne({}, {}, { sort: { 'createdAt' : -1 } });
      let counter = 1;
      if (lastAsset && lastAsset.assetTag) {
        const parts = lastAsset.assetTag.split('-');
        if (parts.length === 2) {
          const prevNum = parseInt(parts[1], 10);
          if (!isNaN(prevNum)) {
            counter = prevNum + 1;
          }
        }
      }
      this.assetTag = `AST-${String(counter).padStart(4, '0')}`;
    } catch (err) {
      return next(err);
    }
  }

  // Generate QR Code base64 string
  try {
    const qrData = JSON.stringify({
      assetTag: this.assetTag,
      serialNumber: this.serialNumber,
      vendor: this.vendor,
      cost: this.cost
    });
    this.qrCode = await QRCode.toDataURL(qrData);
  } catch (err) {
    console.error('Failed to generate QR Code in pre-save hook:', err);
  }

  next();
});

// Post-save hook to generate notifications for maintenance
AssetSchema.post('save', async function(doc) {
  try {
    if (doc._statusChangedToMaintenance) {
      const Notification = mongoose.model('Notification');
      await Notification.create({
        recipient: null, // Admin/Managers
        type: 'Maintenance Approved',
        title: 'Asset Sent to Maintenance',
        message: `Asset ${doc.assetTag} status has been updated to Maintenance.`,
        referenceId: doc._id
      });
    }
  } catch (err) {
    console.error('Error creating maintenance notification:', err.message);
  }
});

module.exports = mongoose.model('Asset', AssetSchema);
