const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  deliveries: [{
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      required: true
    },
    sequence: Number,
    estimatedArrival: Date,
    actualArrival: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'skipped'],
      default: 'pending'
    }
  }],
  routeGeometry: {
    type: Object
  },
  totalDistance: Number,
  estimatedDuration: Number,
  actualDuration: Number,
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned'
  },
  trafficPredictions: [{
    timestamp: Date,
    segmentId: String,
    predictedDelay: Number,
    confidence: Number
  }],
  incidents: [{
    type: String,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    timestamp: Date
  }],
  optimizationMetrics: {
    totalCost: Number,
    fuelConsumption: Number,
    co2Emissions: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);