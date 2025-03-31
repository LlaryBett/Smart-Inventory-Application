const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware triggered. Token:', token);

    if (!token) {
      console.error('No auth token found');
      return res.status(401).json({ message: 'No auth token found' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication failed:', error.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth;
