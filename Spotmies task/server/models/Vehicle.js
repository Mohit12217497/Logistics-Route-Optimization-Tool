const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleId: {
    type: String,
    required: true,
    unique: true
  },
  driverName: {
    type: String,
    required: true
  },
  driverPhone: String,
  capacity: {
    weight: {
      type: Number,
      required: true
    },
    volume: Number
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'maintenance', 'offline'],
    default: 'available'
  },
  vehicleType: {
    type: String,
    enum: ['van', 'truck', 'motorcycle', 'bicycle'],
    required: true
  },
  fuelEfficiency: Number,
  averageSpeed: {
    type: Number,
    default: 40
  },
  workingHours: {
    start: String,
    end: String
  }
}, {
  timestamps: true
});

vehicleSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Vehicle', vehicleSchema);