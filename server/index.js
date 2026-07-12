require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connect to Database (fails gracefully if placeholder is used)
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 AssetFlow Server is running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections without crashing the server process
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Promise Rejection: ${err.message}`);
});
