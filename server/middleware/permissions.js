const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    console.log('Token:', token); // Debugging log

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded); // Debugging log

    const user = await User.findOne({ email: decoded.email }).select('-password'); // Use email to find the user
    if (!user) {
      console.log('User not found in database for email:', decoded.email);
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    console.log('Authenticated User:', user); // Debugging log
    req.user = { id: user.id, role: user.role }; // Attach user ID and role to req.user
    next();
  } catch (err) {
    console.error('Error in authenticateToken:', err);
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// Middleware to restrict access based on roles
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      console.log('Access denied for role:', req.user?.role);
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, restrictTo };
