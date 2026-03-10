const mongoose = require('mongoose');
require('dotenv').config();

const Rider = require('./models/Rider');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      const rider = await Rider.findOne({ email: 'raaju@123.com' }).select('_id email isApprovedByAdmin statusCode isActive');
      if (rider) {
        console.log('✅ Rider found:', JSON.stringify(rider, null, 2));
      } else {
        console.log('❌ Rider not found with email: raaju@123.com');
      }
      
      // List all riders to see what we have
      const allRiders = await Rider.find().select('email isApprovedByAdmin statusCode isActive');
      console.log('\n📋 All riders in database:');
      console.log(JSON.stringify(allRiders, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch(err => console.error('DB connection error:', err));
