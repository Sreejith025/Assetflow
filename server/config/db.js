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
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
