const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI;
    if (!connString) {
      console.error('❌ MONGODB_URI is not defined in the environment variables.');
      process.exit(1);
    }
    
    const conn = await mongoose.connect(connString);
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection error: ${error.message}. Running server in offline mock fallback mode.`);
  }
};

module.exports = connectDB;
