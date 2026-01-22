const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Delivery = require('../models/Delivery');
const Vehicle = require('../models/Vehicle');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics-optimizer');
    console.log('Connected to MongoDB');

    await Delivery.deleteMany({});
    await Vehicle.deleteMany({});
    console.log('Cleared existing data');

    const deliveriesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../sample-data/deliveries.json'), 'utf8')
    );
    const vehiclesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../sample-data/vehicles.json'), 'utf8')
    );

    const deliveries = await Delivery.insertMany(deliveriesData);
    console.log(`Inserted ${deliveries.length} deliveries`);

    const vehicles = await Vehicle.insertMany(vehiclesData);
    console.log(`Inserted ${vehicles.length} vehicles`);

    console.log('Sample data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();