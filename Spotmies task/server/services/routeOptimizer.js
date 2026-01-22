const axios = require('axios');

class RouteOptimizer {
  constructor() {
    this.mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  }

  async optimizeRoute({ deliveries, vehicle, startLocation, avoidAreas = [] }) {
    try {
      const waypoints = [
        startLocation,
        ...deliveries.map(d => d.coordinates.coordinates)
      ];

      const distanceMatrix = await this.calculateDistanceMatrix(waypoints);
      const optimizedSequence = this.solveTSP(distanceMatrix, deliveries, vehicle);
      const routeGeometry = await this.getRouteGeometry(
        startLocation,
        optimizedSequence.map(d => d.coordinates.coordinates)
      );
      
      const metrics = this.calculateMetrics(optimizedSequence, vehicle, distanceMatrix);
      
      return {
        sequence: optimizedSequence,
        waypoints: [startLocation, ...optimizedSequence.map(d => d.coordinates.coordinates)],
        geometry: routeGeometry,
        totalDistance: metrics.totalDistance,
        estimatedDuration: metrics.estimatedDuration,
        estimatedArrivals: this.calculateEstimatedArrivals(optimizedSequence, startLocation, metrics),
        metrics: {
          totalCost: metrics.totalCost,
          fuelConsumption: metrics.fuelConsumption,
          co2Emissions: metrics.co2Emissions
        }
      };
    } catch (error) {
      console.error('Route optimization error:', error);
      throw error;
    }
  }

  async calculateDistanceMatrix(waypoints) {
    const matrix = [];
    for (let i = 0; i < waypoints.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < waypoints.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          const distance = this.haversineDistance(waypoints[i], waypoints[j]);
          matrix[i][j] = distance;
        }
      }
    }
    return matrix;
  }

  haversineDistance([lon1, lat1], [lon2, lat2]) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  solveTSP(distanceMatrix, deliveries, vehicle) {
    const unvisited = [...deliveries];
    const optimized = [];
    let currentWeight = 0;
    let currentIndex = 0;

    while (unvisited.length > 0) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;
      
      for (let i = 0; i < unvisited.length; i++) {
        const delivery = unvisited[i];
        const deliveryIndex = deliveries.indexOf(delivery) + 1;
        
        if (currentWeight + delivery.packageWeight <= vehicle.capacity.weight) {
          const distance = distanceMatrix[currentIndex][deliveryIndex];
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }
      }
      
      if (nearestIndex === -1) {
        break;
      }
      
      const selectedDelivery = unvisited[nearestIndex];
      optimized.push(selectedDelivery);
      currentWeight += selectedDelivery.packageWeight;
      currentIndex = deliveries.indexOf(selectedDelivery) + 1;
      unvisited.splice(nearestIndex, 1);
    }

    return optimized;
  }

  async getRouteGeometry(startLocation, deliveryLocations) {
    try {
      if (!this.mapboxToken) {
        return {
          type: 'LineString',
          coordinates: [startLocation, ...deliveryLocations]
        };
      }

      const coordinates = [startLocation, ...deliveryLocations].join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${this.mapboxToken}`;
      
      const response = await axios.get(url);
      return response.data.routes[0].geometry;
    } catch (error) {
      console.error('Error getting route geometry:', error);
      return {
        type: 'LineString',
        coordinates: [startLocation, ...deliveryLocations]
      };
    }
  }

  calculateMetrics(deliveries, vehicle, distanceMatrix) {
    let totalDistance = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < deliveries.length; i++) {
      totalWeight += deliveries[i].packageWeight;
      if (i === 0) {
        totalDistance += distanceMatrix[0][1];
      } else {
        totalDistance += distanceMatrix[i][i + 1];
      }
    }
    
    if (deliveries.length > 0) {
      totalDistance += distanceMatrix[deliveries.length][0];
    }
    
    const estimatedDuration = (totalDistance / vehicle.averageSpeed) * 60;
    const fuelConsumption = totalDistance / (vehicle.fuelEfficiency || 10);
    const co2Emissions = fuelConsumption * 2.31;
    const totalCost = fuelConsumption * 1.5 + estimatedDuration * 0.5;
    
    return {
      totalDistance,
      estimatedDuration,
      fuelConsumption,
      co2Emissions,
      totalCost
    };
  }

  calculateEstimatedArrivals(deliveries, startLocation, metrics) {
    const arrivals = [];
    const startTime = new Date();
    let cumulativeTime = 0;
    
    for (let i = 0; i < deliveries.length; i++) {
      cumulativeTime += metrics.estimatedDuration / deliveries.length;
      cumulativeTime += 5;
      
      const arrivalTime = new Date(startTime.getTime() + cumulativeTime * 60000);
      arrivals.push(arrivalTime);
    }
    
    return arrivals;
  }
}

const routeOptimizer = new RouteOptimizer();

module.exports = {
  optimizeRoute: (params) => routeOptimizer.optimizeRoute(params)
};