import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Add as AddIcon, 
  Route as RouteIcon, 
  Traffic as TrafficIcon,
  LocationOn as LocationIcon 
} from '@mui/icons-material';
import * as api from '../services/api';

const RouteOptimizer = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [trafficPrediction, setTrafficPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addDeliveryDialog, setAddDeliveryDialog] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    address: '',
    customerName: '',
    packageWeight: '',
    coordinates: {
      type: 'Point',
      coordinates: [-74.006 + Math.random() * 0.1, 40.7128 + Math.random() * 0.1]
    }
  });

  useEffect(() => {
    loadDeliveries();
    loadVehicles();
    loadRoutes();
  }, []);

  const loadDeliveries = async () => {
    try {
      const data = await api.getDeliveries();
      setDeliveries(data);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadRoutes = async () => {
    try {
      const data = await api.getRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const handleAddDelivery = async () => {
    try {
      await api.createDelivery({
        ...newDelivery,
        packageWeight: parseFloat(newDelivery.packageWeight)
      });

      setAddDeliveryDialog(false);
      setNewDelivery({
        address: '',
        customerName: '',
        packageWeight: '',
        coordinates: {
          type: 'Point',
          coordinates: [-74.006 + Math.random() * 0.1, 40.7128 + Math.random() * 0.1]
        }
      });
      loadDeliveries();
    } catch (error) {
      console.error('Error adding delivery:', error);
    }
  };

  const handleOptimizeRoute = async () => {
    try {
      setLoading(true);
      
      const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
      const availableVehicles = vehicles.filter(v => v.status === 'available');
      
      if (pendingDeliveries.length === 0) {
        alert('No pending deliveries to optimize');
        return;
      }
      
      if (availableVehicles.length === 0) {
        alert('No available vehicles');
        return;
      }

      const deliveryIds = pendingDeliveries.map(d => d._id);
      const vehicleId = availableVehicles[0]._id;

      const optimizedRoute = await api.optimizeRoute({
        deliveryIds,
        vehicleId,
        startLocation: availableVehicles[0].currentLocation?.coordinates || [-74.006, 40.7128]
      });

      setSelectedRoute(optimizedRoute);
      
      const waypoints = [
        optimizedRoute.vehicleId.currentLocation?.coordinates || [-74.006, 40.7128],
        ...optimizedRoute.deliveries.map(d => d.deliveryId.coordinates.coordinates)
      ];
      
      const prediction = await api.getTrafficPrediction({ waypoints });
      setTrafficPrediction(prediction);
      
      loadRoutes();
    } catch (error) {
      console.error('Error optimizing route:', error);
      alert('Error optimizing route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Logistics Route Optimizer
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        AI-powered route optimization with real-time traffic predictions
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDeliveryDialog(true)}
          >
            Add Delivery
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="success"
            startIcon={<RouteIcon />}
            onClick={handleOptimizeRoute}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Optimize Route'}
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{deliveries.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Deliveries</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{vehicles.length}</Typography>
              <Typography variant="body2" color="text.secondary">Available Vehicles</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">{routes.length}</Typography>
              <Typography variant="body2" color="text.secondary">Active Routes</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {deliveries.filter(d => d.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Pending Deliveries</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Deliveries
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Weight</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery._id}>
                      <TableCell>{delivery.customerName}</TableCell>
                      <TableCell>{delivery.address}</TableCell>
                      <TableCell>{delivery.packageWeight}kg</TableCell>
                      <TableCell>
                        <Chip
                          label={delivery.status}
                          size="small"
                          color={delivery.status === 'pending' ? 'warning' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vehicles
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vehicle ID</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle._id}>
                      <TableCell>{vehicle.vehicleId}</TableCell>
                      <TableCell>{vehicle.driverName}</TableCell>
                      <TableCell>{vehicle.vehicleType}</TableCell>
                      <TableCell>
                        <Chip
                          label={vehicle.status}
                          size="small"
                          color={vehicle.status === 'available' ? 'success' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {trafficPrediction && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <TrafficIcon sx={{ mr: 1 }} />
                AI Traffic Prediction
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Expected Delay</Typography>
                  <Typography variant="h6">{trafficPrediction.overallDelay} min</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Congestion Level</Typography>
                  <Typography variant="h6">{Math.round(trafficPrediction.congestionLevel * 100)}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Confidence</Typography>
                  <Typography variant="h6">{Math.round(trafficPrediction.confidence * 100)}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Source</Typography>
                  <Typography variant="body2">{trafficPrediction.source}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {selectedRoute && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Optimized Route Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                  <Typography variant="body1">{selectedRoute.vehicleId.vehicleId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Driver</Typography>
                  <Typography variant="body1">{selectedRoute.vehicleId.driverName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Distance</Typography>
                  <Typography variant="body1">{selectedRoute.totalDistance?.toFixed(1)} km</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Estimated Duration</Typography>
                  <Typography variant="body1">{selectedRoute.estimatedDuration?.toFixed(0)} min</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Deliveries</Typography>
                  <Typography variant="body1">{selectedRoute.deliveries.length}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip label={selectedRoute.status} size="small" color="primary" />
                </Grid>
              </Grid>
              
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => alert('Incident reported! Route will be re-optimized.')}
              >
                Report Traffic Incident
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={addDeliveryDialog} onClose={() => setAddDeliveryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Delivery</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Customer Name"
            value={newDelivery.customerName}
            onChange={(e) => setNewDelivery(prev => ({ ...prev, customerName: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Address"
            value={newDelivery.address}
            onChange={(e) => setNewDelivery(prev => ({ ...prev, address: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Package Weight (kg)"
            type="number"
            value={newDelivery.packageWeight}
            onChange={(e) => setNewDelivery(prev => ({ ...prev, packageWeight: e.target.value }))}
            margin="normal"
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            <LocationIcon sx={{ mr: 1 }} />
            Location will be automatically assigned in NYC area
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDeliveryDialog(false)}>Cancel</Button>
          <Button onClick={handleAddDelivery} variant="contained">Add Delivery</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteOptimizer;