// Simple test script to verify authentication flow
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function testAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user exists
    let testUser = await User.findOne({ email: 'test@soillink.com' });
    
    if (!testUser) {
      // Create test user
      testUser = new User({
        name: 'Test User',
        email: 'test@soillink.com',
        password: 'testpass123'
      });
      await testUser.save();
      console.log('Test user created:');
      console.log('Email: test@soillink.com');
      console.log('Password: testpass123');
    } else {
      console.log('Test user already exists:');
      console.log('Email: test@soillink.com');
      console.log('Password: testpass123');
    }

    console.log('\nYou can now test login with these credentials at: http://localhost:3000/auth/login');
    
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAuth();
