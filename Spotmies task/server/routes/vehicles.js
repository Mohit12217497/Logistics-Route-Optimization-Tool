const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/location', async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    );
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    const io = req.app.get('io');
    io.emit('vehicle-location-update', {
      vehicleId: vehicle._id,
      location: vehicle.currentLocation
    });
    
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/status/available', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: 'available' });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;