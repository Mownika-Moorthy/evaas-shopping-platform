import mongoose from 'mongoose';

let isConnecting = false;

const connectDB = async () => {
  if (isConnecting || mongoose.connection.readyState === 1) return;
  isConnecting = true;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    isConnecting = false;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`👉 If using MongoDB Atlas, make sure your current IP address is whitelisted in Atlas:`);
    console.error(`   1. Open MongoDB Atlas (https://cloud.mongodb.com)`);
    console.error(`   2. Go to "Network Access" -> "Add IP Address"`);
    console.error(`   3. Click "Allow Access From Anywhere" (0.0.0.0/0) or add your current IP.`);
    console.log(`⏳ Server remains online. Retrying MongoDB connection in 8 seconds...`);
    setTimeout(connectDB, 8000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

export default connectDB;
