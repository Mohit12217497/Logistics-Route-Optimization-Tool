const express = require('express');
const router = express.Router();
const { getTrafficPrediction, analyzeHistoricalTraffic } = require('../services/trafficPredictor');

router.post('/predict', async (req, res) => {
  try {
    const { waypoints, timeOfDay, dayOfWeek } = req.body;
    
    const prediction = await getTrafficPrediction(waypoints, {
      timeOfDay,
      dayOfWeek
    });
    
    res.json(prediction);
  } catch (error) {
    console.error('Traffic prediction error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { startLocation, endLocation, timeRange } = req.body;
    
    const analysis = await analyzeHistoricalTraffic({
      startLocation,
      endLocation,
      timeRange
    });
    
    res.json(analysis);
  } catch (error) {
    console.error('Traffic analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/current/:lat/:lng/:radius?', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.params;
    
    const currentTraffic = {
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseInt(radius),
      conditions: [
        {
          severity: 'moderate',
          description: 'Heavy traffic on main roads',
          affectedArea: 'Downtown area',
          estimatedDelay: 15
        },
        {
          severity: 'light',
          description: 'Normal traffic flow',
          affectedArea: 'Suburban areas',
          estimatedDelay: 2
        }
      ],
      lastUpdated: new Date()
    };
    
    res.json(currentTraffic);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;