const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics-optimizer', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/traffic', require('./routes/traffic'));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-route', (routeId) => {
    socket.join(`route-${routeId}`);
  });
  
  socket.on('incident-report', (data) => {
    io.to(`route-${data.routeId}`).emit('route-incident', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});