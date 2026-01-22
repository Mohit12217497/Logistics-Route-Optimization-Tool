# Logistics Route Optimizer

A full-stack web application for optimizing delivery routes using AI-powered traffic predictions and real-time re-routing capabilities.

## Overview

This system helps logistics companies optimize their delivery operations by calculating the most efficient routes, predicting traffic delays using AI, and providing real-time route adjustments when incidents occur.

## Tech Stack

**Frontend:**
- React.js with Material-UI
- Axios for API communication
- Socket.io for real-time updates

**Backend:**
- Node.js with Express.js
- MongoDB with geospatial indexing
- Socket.io for WebSocket connections
- Google Gemini API for traffic predictions

**Key Features:**
- Route optimization using TSP algorithms
- AI-powered traffic prediction
- Real-time incident reporting and re-routing
- Geospatial queries for location-based operations
- Vehicle capacity and constraint management

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd logistics-route-optimizer
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Environment Setup:**
   
   Create `.env` file in the server directory:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/logistics-optimizer
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   MAPBOX_ACCESS_TOKEN=your_mapbox_token
   NODE_ENV=development
   ```

   Create `.env` file in the client directory:
   ```env
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token
   REACT_APP_API_URL=http://localhost:5001/api
   ```

3. **Database Setup:**
   ```bash
   # Start MongoDB (if running locally)
   mongod
   
   # Seed sample data
   cd server
   npm run seed
   ```

4. **Start the application:**
   ```bash
   # From root directory
   npm run dev
   
   # Or start separately:
   # Terminal 1 - Backend
   cd server && npm start
   
   # Terminal 2 - Frontend  
   cd client && npm start
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── services/       # API service layer
├── server/                 # Node.js backend
│   ├── models/            # MongoDB schemas
│   ├── routes/            # Express routes
│   ├── services/          # Business logic
│   └── scripts/           # Utility scripts
├── sample-data/           # Sample JSON data
└── docs/                  # Documentation
```

## API Endpoints

### Deliveries
- `GET /api/deliveries` - List all deliveries
- `POST /api/deliveries` - Create new delivery
- `PUT /api/deliveries/:id` - Update delivery
- `DELETE /api/deliveries/:id` - Delete delivery

### Vehicles
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Add new vehicle
- `PUT /api/vehicles/:id/location` - Update vehicle location
- `PUT /api/vehicles/:id/status` - Update vehicle status

### Routes
- `POST /api/routes/optimize` - Generate optimized route
- `GET /api/routes/:id` - Get route details
- `POST /api/routes/:id/reoptimize` - Re-optimize due to incidents

### Traffic
- `POST /api/traffic/predict` - Get AI traffic predictions
- `GET /api/traffic/current/:lat/:lng` - Current traffic conditions

## Key Features

### Route Optimization
The system uses a Traveling Salesman Problem (TSP) solver with capacity constraints to find optimal delivery sequences. It considers:
- Vehicle capacity limits
- Delivery time windows
- Distance minimization
- Fuel efficiency

### AI Traffic Prediction
Integration with Google Gemini API provides intelligent traffic analysis:
- Historical pattern analysis
- Real-time condition assessment
- Confidence scoring
- Time-based recommendations

### Real-time Updates
WebSocket connections enable:
- Live vehicle tracking
- Instant incident notifications
- Dynamic route re-optimization
- Status updates across all clients

### Geospatial Operations
MongoDB's geospatial features support:
- Location-based queries
- Proximity searches
- Route geometry storage
- Spatial indexing for performance

## Usage Examples

### Adding a Delivery
```javascript
const delivery = {
  address: "123 Main St, New York, NY",
  customerName: "John Doe",
  packageWeight: 2.5,
  coordinates: {
    type: "Point",
    coordinates: [-74.006, 40.7128]
  }
};
```

### Optimizing Routes
```javascript
const routeRequest = {
  deliveryIds: ["delivery1", "delivery2", "delivery3"],
  vehicleId: "vehicle1",
  startLocation: [-74.006, 40.7128]
};
```

### Traffic Prediction
```javascript
const prediction = {
  waypoints: [
    [-74.006, 40.7128],
    [-73.985, 40.748],
    [-73.973, 40.761]
  ],
  timeOfDay: 14,
  dayOfWeek: 2
};
```

## Development

### Running Tests
```bash
# Frontend tests
cd client && npm test

# Backend tests (if implemented)
cd server && npm test
```

### Building for Production
```bash
# Build frontend
cd client && npm run build

# The build files will be in client/build/
```

### Database Operations
```bash
# Seed fresh data
cd server && npm run seed

# Connect to MongoDB
mongo logistics-optimizer
```

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/logistics
GOOGLE_GEMINI_API_KEY=production_key
MAPBOX_ACCESS_TOKEN=production_token
```

### Docker Deployment (Optional)
```dockerfile
# Example Dockerfile structure
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## Performance Considerations

- **Database Indexing**: Geospatial indexes on coordinate fields
- **Caching**: Route calculations cached for similar requests
- **Connection Pooling**: MongoDB connection optimization
- **Real-time Limits**: WebSocket connection management

## Troubleshooting

### Common Issues

**MongoDB Connection Failed:**
- Ensure MongoDB is running
- Check connection string in .env
- Verify network connectivity

**API Key Errors:**
- Verify Gemini API key is valid
- Check Mapbox token permissions
- Ensure keys are in correct .env files

**Port Conflicts:**
- Backend runs on 5001 (configurable)
- Frontend runs on 3000
- Change ports in .env if needed

**Build Failures:**
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Check MongoDB and Node.js logs
- Verify environment configuration