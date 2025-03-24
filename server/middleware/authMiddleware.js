const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure the User model exists

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }

      // Fetch user from database using decoded ID
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { authenticateToken };
