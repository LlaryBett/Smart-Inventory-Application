const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error('Invalid token:', err.message);
        return res.status(403).json({ message: 'Invalid token' });
      }

      console.log('Decoded token:', decoded); // Debug log

      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        console.error('User not found for userId:', decoded.userId); // Debug log
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = user; // Attach user to the request
      next();
    });
  } catch (error) {
    console.error('Authentication failed:', error.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { authenticateToken };
