const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const AdminCode = require('../models/AdminCode');

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
    const isValidAdminCode = await AdminCode.findOne({ code: adminCode });
    if (!isValidAdminCode) {
      return res.status(400).json({ message: 'Invalid admin security code' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Save the user
    await newUser.save();

    // Remove the admin code after successful registration
    await AdminCode.deleteOne({ code: adminCode });

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ message: 'Error registering admin' });
  }
};

// Enhanced login handler
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for:', email);
    console.log('Password received:', password);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('Found user:', user.email);
    console.log('Password comparison:');
    console.log('Raw password:', password);
    console.log('Stored hash:', user.password);

    // Use the raw password directly with bcrypt.compare
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Only allow first login for non-admin users
    const isFirstLogin = user.role !== 'admin' && user.isFirstLogin === true;

    console.log('Login check:', {
      userId: user.id,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      allowFirstLogin: isFirstLogin
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      isFirstLogin,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
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
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
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

    // Generate secure temporary password
    const tempPassword = crypto.randomBytes(12).toString('hex') + 
                        'A1!' + 
                        crypto.randomBytes(4).toString('hex');

    const user = new User({
      id: `USER-${Date.now()}`, // Ensure ID is generated
      name,
      email,
      password: tempPassword,
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

    console.log('Changing password for token:', token); // Debug log

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log

    // Find user by email instead of id
    const user = await User.findOne({ email: decoded.email });
    console.log('Found user:', user ? user.email : 'not found'); // Debug log

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
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