const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      throw new Error('No Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log

    // Changed from findById to find with both _id and role
    const user = await User.findOne({ 
      _id: decoded.userId || decoded._id, // Handle both possible token formats
    });

    if (!user) {
      console.log('User not found for id:', decoded.userId || decoded._id); // Debug log
      throw new Error('User not found');
    }

    // Attach user to request object
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', {
      message: error.message,
      token: req.header('Authorization')?.substring(0, 20) + '...',
      decoded: error.decoded
    });
    
    res.status(401).json({ 
      message: 'Please authenticate', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  authenticate
};
