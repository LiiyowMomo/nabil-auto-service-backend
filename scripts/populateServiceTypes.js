const mongoose = require('mongoose');
const ServiceType = require('../models/ServiceType');
require('dotenv').config();

const serviceTypes = [
  { name: 'Oil Change', estimatedDuration: 30, description: 'Standard oil change service' },
  { name: 'Engine Repair', estimatedDuration: 1440, description: 'Engine repair (1-2 days)' }, // 1 day = 1440 min
  { name: 'Transmission', estimatedDuration: 1440, description: 'Transmission service (1-2 days)' },
  { name: 'Safety Inspection', estimatedDuration: 75, description: 'Safety inspection (60-90 min)' },
  { name: 'Tune Up', estimatedDuration: 60, description: 'Tune up service (60 min)' },
  { name: 'Exhaust & Brakes', estimatedDuration: 120, description: 'Exhaust & brakes service (120 min)' },
  { name: 'Shocks & Front End', estimatedDuration: 75, description: 'Shocks & front end service (60-90 min)' },
  { name: 'Air Conditioning', estimatedDuration: 120, description: 'Air conditioning service (1-3 hours)' },
  { name: 'Fuel Injection', estimatedDuration: 60, description: 'Fuel injection service (60 min)' },
  { name: 'Other', estimatedDuration: 60, description: 'Custom service (duration set by mechanic)' }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Delete existing service types
    await ServiceType.deleteMany({});
    console.log('Existing service types deleted');
    
    // Insert new service types
    await ServiceType.insertMany(serviceTypes);
    console.log('Service types populated successfully!');
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('Error populating service types:', err);
    mongoose.disconnect();
  });
