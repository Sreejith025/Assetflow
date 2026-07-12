const mongoose = require('mongoose');

const AssetModelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a model name'],
    unique: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssetCategory',
    required: [true, 'Please associate this model with a category']
  },
  manufacturer: {
    type: String,
    required: [true, 'Please specify the manufacturer'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AssetModel', AssetModelSchema);
