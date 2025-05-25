const mongoose = require('mongoose');

const SoilSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phLevel: {
    type: Number,
    required: true
  },
  waterLevel: {
    type: Number,
    required: true
  },
  soilHealth: {
    type: Number,
    required: true
  },
  nitrogenLevel: {
    type: Number,
    required: true
  },
  phosphorusLevel: {
    type: Number,
    required: true
  },
  potassiumLevel: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  location: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed'
  }
});

// Virtual for formatted date
SoilSchema.virtual('formattedDate').get(function() {
  return this.submittedAt.toISOString().split('T')[0];
});

// Method to get soil health status text
SoilSchema.methods.getHealthStatus = function() {
  if (this.soilHealth >= 80) return 'Excellent';
  if (this.soilHealth >= 60) return 'Good';
  if (this.soilHealth >= 40) return 'Average';
  if (this.soilHealth >= 20) return 'Poor';
  return 'Critical';
};

const Soil = mongoose.model('Soil', SoilSchema);

module.exports = Soil;
