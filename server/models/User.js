const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    unique: true,
    sparse: true
  },
  fullName: {
    type: String,
    required: [true, 'Please add a full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add a valid email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['Admin', 'Asset Manager', 'Department Head', 'Employee', 'Maintenance Team'],
    default: 'Employee'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

// Match entered password to database hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Post-save hook to generate notifications for new employees
UserSchema.post('save', async function(doc) {
  try {
    if (doc.createdAt && doc.updatedAt && doc.createdAt.getTime() === doc.updatedAt.getTime()) {
      const Notification = mongoose.model('Notification');
      await Notification.create({
        recipient: doc._id,
        type: 'New Employee Added',
        title: 'Welcome to AssetFlow!',
        message: `Hello ${doc.fullName}, your corporate account has been successfully registered.`,
        referenceId: doc._id
      });
    }
  } catch (err) {
    console.error('Error creating user notification:', err.message);
  }
});

module.exports = mongoose.model('User', UserSchema);
