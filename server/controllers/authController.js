const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Register a new admin user
const register = async (req, res) => {
  try {
    const { name, email, password, role, adminCode } = req.body;

    // Check if the admin security code is valid
    if (adminCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(400).json({ message: 'Invalid admin security code' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create the new user
    const newUser = new User({
      id: `USER-${Date.now()}`, // Ensure ID is generated
      name,
      email,
      password: password.toString().trim(), // Remove manual hashing
      role,
    });

    // Save the user
    await newUser.save();

    res.status(201).json({
      message: 'Admin registered successfully',
      user: {
        id: newUser.id,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ message: 'Error registering admin' });
  }
};

// Enhanced login handler
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password.toString().trim());
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id,
        id: user.id,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login time if not first login
    if (!user.isFirstLogin) {
      user.lastLogin = new Date();
      await user.save();
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      isFirstLogin: user.isFirstLogin,
      user: {
        id: user.id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Change from decoded.id to decoded.userId to match the token structure
    req.user = await User.findById(decoded.userId).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Not authorized' });
  }
};

// Middleware to restrict by role
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, email, role, adminCode } = req.body;

    // Verify admin is creating the user
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create users' });
    }

    // Verify admin security code for admin creation
    if (role === 'admin') {
      if (!adminCode || adminCode !== process.env.ADMIN_SECRET_CODE) {
        return res.status(403).json({ message: 'Invalid admin security code' });
      }

      // Verify email domain for admin
      const allowedDomains = process.env.ADMIN_EMAIL_DOMAINS?.split(',') || [];
      const emailDomain = email.split('@')[1];
      if (allowedDomains.length && !allowedDomains.includes(emailDomain)) {
        return res.status(400).json({
          message: 'Admin accounts must use an approved email domain'
        });
      }
    }

    // Generate secure temporary password and ensure it's a string
    const tempPassword = (crypto.randomBytes(12).toString('hex') + 
                        'A1!' + 
                        crypto.randomBytes(4).toString('hex')).toString();

    const user = new User({
      id: `USER-${Date.now()}`, // Ensure ID is generated
      name,
      email,
      password: tempPassword, // Remove manual hashing
      role,
      createdBy: req.user._id,
      isFirstLogin: true  // Explicitly set isFirstLogin to true
    });

    await user.save();

    // Send welcome email with temporary password
    try {
      if (role !== 'other') {
        await emailService.sendWelcomeEmail(user, tempPassword);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword.toString().trim(); // Remove manual hashing
    user.isFirstLogin = false;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({ 
      message: error.message || 'Error changing password'
    });
  }
};

module.exports = {
  register,
  login,
  protect,
  restrictTo,
  createUser,
  changePassword
};