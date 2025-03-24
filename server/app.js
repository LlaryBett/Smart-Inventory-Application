const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const salesRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/sales', salesRoutes);
app.use('/api', dashboardRoutes);

module.exports = app;