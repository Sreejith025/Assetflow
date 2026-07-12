const mongoose = require('mongoose');

const AssetAllocationSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: [true, 'Please associate an asset']
  },
  allocatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please associate an employee']
  },
  allocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please associate the allocator user']
  },
  allocationDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Allocation date is required']
  },
  expectedReturnDate: {
    type: Date,
    required: [true, 'Expected return date is required']
  },
  actualReturnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending Approval', 'Allocated', 'Returned', 'Rejected'],
    default: 'Pending Approval'
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalDate: {
    type: Date,
    default: null
  },
  approvalRemarks: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

AssetAllocationSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    if (this.status === 'Allocated') {
      if (this.remarks && (this.remarks.toLowerCase().includes('transfer') || this.remarks.toLowerCase().includes('reassigned'))) {
        this._statusChangedToTransfer = true;
      } else {
        this._statusChangedToAllocated = true;
      }
    } else if (this.status === 'Returned') {
      this._statusChangedToReturned = true;
    }
  } else if (this.isNew && this.status === 'Allocated') {
    if (this.remarks && (this.remarks.toLowerCase().includes('transfer') || this.remarks.toLowerCase().includes('reassigned'))) {
      this._statusChangedToTransfer = true;
    } else {
      this._statusChangedToAllocated = true;
    }
  }
  next();
});

// Post-save hook to generate notifications for allocations
AssetAllocationSchema.post('save', async function(doc) {
  try {
    const Notification = doc.constructor.model('Notification');
    const Asset = doc.constructor.model('Asset');
    const assetObj = await Asset.findById(doc.asset).populate('model');
    const assetName = assetObj ? `${assetObj.model?.manufacturer || ''} ${assetObj.model?.name || ''}`.trim() : 'Asset';

    if (doc._statusChangedToTransfer) {
      await Notification.create({
        recipient: doc.allocatedTo,
        type: 'Asset Transfer',
        title: 'Asset Transferred to You',
        message: `Asset ${assetName} (Tag: ${assetObj?.assetTag || '—'}) has been transferred to you.`,
        referenceId: doc._id
      });
    } else if (doc._statusChangedToAllocated) {
      await Notification.create({
        recipient: doc.allocatedTo,
        type: 'Asset Allocated',
        title: 'New Asset Allocated',
        message: `Asset ${assetName} (Tag: ${assetObj?.assetTag || '—'}) has been allocated to you.`,
        referenceId: doc._id
      });
    } else if (doc._statusChangedToReturned) {
      await Notification.create({
        recipient: doc.allocatedTo,
        type: 'Asset Returned',
        title: 'Asset Returned Successfully',
        message: `Asset ${assetName} (Tag: ${assetObj?.assetTag || '—'}) has been successfully returned.`,
        referenceId: doc._id
      });
    }
  } catch (err) {
    console.error('Error creating allocation notification:', err.message);
  }
});

module.exports = mongoose.model('AssetAllocation', AssetAllocationSchema);
