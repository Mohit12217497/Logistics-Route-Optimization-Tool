const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  customerName: {
    type: String,
    required: true
  },
  phoneNumber: String,
  packageWeight: {
    type: Number,
    required: true
  },
  packageVolume: Number,
  deliveryWindow: {
    start: Date,
    end: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-transit', 'delivered', 'failed'],
    default: 'pending'
  },
  specialInstructions: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date
}, {
  timestamps: true
});

deliverySchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Delivery', deliverySchema);