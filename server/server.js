const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orders');
const salesRoutes = require('./routes/sales');
const purchaseRoutes = require('./routes/purchases');
const serviceRoutes = require('./routes/services');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const dashboardRoutes = require('./routes/dashboard');
const eventRoutes = require('./routes/eventRoutes');

// Import middleware
const { authenticateToken } = require('./middleware/permissions');
const { authenticate } = require('./middleware/authMiddleware');

// Configure environment variables
dotenv.config();

const app = express();

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// CORS configuration to allow both urls
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://smart-inventory-application.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Updated middleware order
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with detailed error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // 5 second timeout
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((err) => {
  console.error('MongoDB connection error details:', {
    name: err.name,
    message: err.message,
    code: err.code
  });
  console.log('\nPossible solutions:');
  console.log('1. Whitelist your IP address in MongoDB Atlas');
  console.log('2. Check if your MongoDB Atlas username and password are correct');
  console.log('3. Verify your connection string format');
  console.log('\nTo whitelist your IP:');
  console.log('1. Go to MongoDB Atlas dashboard');
  console.log('2. Click Network Access');
  console.log('3. Click Add IP Address');
  console.log('4. Add your current IP or use 0.0.0.0/0 for all IPs (not recommended for production)');
  process.exit(1);
});

// Add error handling for MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Handle app termination gracefully
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
    process.exit(1);
  }
});

// Routes - remove authenticate from route definitions since it's in the route files
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/products', productRoutes); // Product routes
app.use('/api/orders', orderRoutes); // Order routes
app.use('/api/sales', salesRoutes); // Sales routes
app.use('/api/purchases', purchaseRoutes); // Purchase routes
app.use('/api/services', serviceRoutes); // Services routes (GET is public)
app.use('/api/reports', reportRoutes); // Reports routes
app.use('/api/users', userRoutes); // User routes
app.use('/api/settings', settingsRoutes); // Settings routes
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes
app.use('/api/events', eventRoutes); // Event routes

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  res.status(500).json({ message: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;