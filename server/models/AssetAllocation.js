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

module.exports = mongoose.model('AssetAllocation', AssetAllocationSchema);
