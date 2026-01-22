const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Delivery = require('../models/Delivery');
const Vehicle = require('../models/Vehicle');
const { optimizeRoute } = require('../services/routeOptimizer');
const { getTrafficPrediction } = require('../services/trafficPredictor');

router.post('/optimize', async (req, res) => {
  try {
    const { deliveryIds, vehicleId, startLocation } = req.body;
    
    const deliveries = await Delivery.find({ _id: { $in: deliveryIds } });
    const vehicle = await Vehicle.findById(vehicleId);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    const optimizedRoute = await optimizeRoute({
      deliveries,
      vehicle,
      startLocation: startLocation || vehicle.currentLocation.coordinates
    });
    
    const trafficPredictions = await getTrafficPrediction(optimizedRoute.waypoints);
    
    const route = new Route({
      vehicleId: vehicle._id,
      deliveries: optimizedRoute.sequence.map((delivery, index) => ({
        deliveryId: delivery._id,
        sequence: index + 1,
        estimatedArrival: optimizedRoute.estimatedArrivals[index]
      })),
      routeGeometry: optimizedRoute.geometry,
      totalDistance: optimizedRoute.totalDistance,
      estimatedDuration: optimizedRoute.estimatedDuration,
      trafficPredictions,
      optimizationMetrics: optimizedRoute.metrics
    });
    
    await route.save();
    await route.populate('vehicleId deliveries.deliveryId');
    
    res.json(route);
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('vehicleId')
      .populate('deliveries.deliveryId');
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/reoptimize', async (req, res) => {
  try {
    const { incident, currentLocation } = req.body;
    const route = await Route.findById(req.params.id)
      .populate('vehicleId')
      .populate('deliveries.deliveryId');
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    route.incidents.push({
      type: incident.type,
      location: incident.location,
      description: incident.description,
      severity: incident.severity,
      timestamp: new Date()
    });
    
    const remainingDeliveries = route.deliveries
      .filter(d => d.status === 'pending')
      .map(d => d.deliveryId);
    
    if (remainingDeliveries.length === 0) {
      return res.json({ message: 'No remaining deliveries to optimize' });
    }
    
    const reoptimizedRoute = await optimizeRoute({
      deliveries: remainingDeliveries,
      vehicle: route.vehicleId,
      startLocation: currentLocation,
      avoidAreas: [incident.location]
    });
    
    route.deliveries = route.deliveries.map(d => {
      if (d.status === 'pending') {
        const newIndex = reoptimizedRoute.sequence.findIndex(
          rd => rd._id.toString() === d.deliveryId._id.toString()
        );
        if (newIndex !== -1) {
          d.sequence = newIndex + 1;
          d.estimatedArrival = reoptimizedRoute.estimatedArrivals[newIndex];
        }
      }
      return d;
    });
    
    route.routeGeometry = reoptimizedRoute.geometry;
    route.totalDistance = reoptimizedRoute.totalDistance;
    route.estimatedDuration = reoptimizedRoute.estimatedDuration;
    
    await route.save();
    
    const io = req.app.get('io');
    io.to(`route-${route._id}`).emit('route-reoptimized', {
      routeId: route._id,
      newRoute: reoptimizedRoute,
      incident
    });
    
    res.json(route);
  } catch (error) {
    console.error('Route re-optimization error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:routeId/delivery/:deliveryId/status', async (req, res) => {
  try {
    const { routeId, deliveryId } = req.params;
    const { status, actualArrival } = req.body;
    
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    const deliveryIndex = route.deliveries.findIndex(
      d => d.deliveryId.toString() === deliveryId
    );
    
    if (deliveryIndex === -1) {
      return res.status(404).json({ error: 'Delivery not found in route' });
    }
    
    route.deliveries[deliveryIndex].status = status;
    if (actualArrival) {
      route.deliveries[deliveryIndex].actualArrival = new Date(actualArrival);
    }
    
    await route.save();
    
    await Delivery.findByIdAndUpdate(deliveryId, { 
      status: status === 'completed' ? 'delivered' : 'in-transit',
      actualDeliveryTime: actualArrival ? new Date(actualArrival) : undefined
    });
    
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const routes = await Route.find()
      .populate('vehicleId')
      .populate('deliveries.deliveryId')
      .sort({ createdAt: -1 });
    
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;