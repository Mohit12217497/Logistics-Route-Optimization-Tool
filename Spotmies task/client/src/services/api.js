import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDeliveries = async () => {
  const response = await api.get('/deliveries');
  return response.data;
};

export const createDelivery = async (delivery) => {
  const response = await api.post('/deliveries', delivery);
  return response.data;
};

export const updateDelivery = async (id, delivery) => {
  const response = await api.put(`/deliveries/${id}`, delivery);
  return response.data;
};

export const deleteDelivery = async (id) => {
  const response = await api.delete(`/deliveries/${id}`);
  return response.data;
};

export const getVehicles = async () => {
  const response = await api.get('/vehicles');
  return response.data;
};

export const createVehicle = async (vehicle) => {
  const response = await api.post('/vehicles', vehicle);
  return response.data;
};

export const updateVehicleLocation = async (id, location) => {
  const response = await api.put(`/vehicles/${id}/location`, location);
  return response.data;
};

export const updateVehicleStatus = async (id, status) => {
  const response = await api.put(`/vehicles/${id}/status`, { status });
  return response.data;
};

export const getRoutes = async () => {
  const response = await api.get('/routes');
  return response.data;
};

export const getRoute = async (id) => {
  const response = await api.get(`/routes/${id}`);
  return response.data;
};

export const optimizeRoute = async (params) => {
  const response = await api.post('/routes/optimize', params);
  return response.data;
};

export const reoptimizeRoute = async (routeId, params) => {
  const response = await api.post(`/routes/${routeId}/reoptimize`, params);
  return response.data;
};

export const updateDeliveryStatus = async (routeId, deliveryId, status) => {
  const response = await api.put(`/routes/${routeId}/delivery/${deliveryId}/status`, status);
  return response.data;
};

export const getTrafficPrediction = async (params) => {
  const response = await api.post('/traffic/predict', params);
  return response.data;
};

export const analyzeHistoricalTraffic = async (params) => {
  const response = await api.post('/traffic/analyze', params);
  return response.data;
};

export const getCurrentTraffic = async (lat, lng, radius = 5) => {
  const response = await api.get(`/traffic/current/${lat}/${lng}/${radius}`);
  return response.data;
};

export default api;