// Script to seed dummy users, soil samples, and reports
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI;

const dummyUsers = [
  {
    name: 'Alice Farmer',
    email: 'alice@example.com',
    password: 'password123',
    role: 'user'
  },
  {
    name: 'Bob Grower',
    email: 'bob@example.com',
    password: 'password123',
    role: 'user'
  },
  {
    name: 'Charlie Admin',
    email: 'charlie@example.com',
    password: 'adminpass',
    role: 'admin'
  }
];

async function seed() {  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Remove old users
    await User.deleteMany({ email: { $in: dummyUsers.map(u => u.email) } });
    // Insert dummy users
    for (const user of dummyUsers) {
      const newUser = new User(user);
      await newUser.save();
      logger.info(`Created user: ${user.email}`);
    }

    // You can add more: SoilSample, Report, etc. if you have models for them
    // Example:
    // const SoilSample = require('../models/SoilSample');
    // await SoilSample.create({ ... });

    logger.info('Dummy data seeded!');
    process.exit(0);
  } catch (err) {
    logger.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
