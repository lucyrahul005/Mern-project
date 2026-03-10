const mongoose = require('mongoose');
require('dotenv').config();

const Rider = require('./models/Rider');

async function checkRiders() {
  try {
    console.log('Connecting to:', process.env.MONGO_URI ? 'MongoDB' : 'No URI found');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://admin:admin123@cluster0.dnaqzme.mongodb.net/foodapp');
    console.log('✅ Connected to MongoDB');
    
    // Check for the specific rider
    const rider = await Rider.findOne({ email: 'raaju@123.com' });
    if (rider) {
      console.log('\n🚴 Rider found:');
      console.log('  Email:', rider.email);
      console.log('  Name:', rider.name);
      console.log('  isApprovedByAdmin:', rider.isApprovedByAdmin);
      console.log('  isActive:', rider.isActive);
      console.log('  ID:', rider._id);
    } else {
      console.log('\n❌ Rider with email "raaju@123.com" NOT found');
    }
    
    // List all riders
    const allRiders = await Rider.find().select('email name isApprovedByAdmin isActive');
    console.log('\n📋 ALL RIDERS IN DATABASE:');
    allRiders.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.email} - Approved: ${r.isApprovedByAdmin}, Active: ${r.isActive}`);
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkRiders();
