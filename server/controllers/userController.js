const User = require('../models/User');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');
const crypto = require('crypto');

exports.getUsers = async (req, res) => {
  try {
    const { searchTerm, role, status } = req.query;
    let query = {};
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // Calculate metrics
    const metrics = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      recentLogins: users.filter(u => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        return u.lastLogin && new Date(u.lastLogin) > lastWeek;
      }).length
    };

    res.json({ users, metrics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { fullName, email, role, department, adminCode } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'An account with this email already exists'
      });
    }

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

    // Generate a 6-character temporary password (4 random alphanumeric + A!)
    const randomPart = Math.random().toString(36).substring(2, 6);
    const tempPassword = `${randomPart}A!`;

    const user = new User({
      id: `USER-${Date.now()}`,
      name: fullName,  // Map fullName to name
      email,
      password: tempPassword,
      role,
      department: department || 'Other',
      createdBy: req.user._id
    });

    console.log('Creating user with data:', { 
      name: user.name,
      email: user.email,
      role: user.role 
    });

    await user.save();

    // Send welcome email with temporary password
    try {
      if (role !== 'other') {
        await emailService.sendWelcomeEmail(user, tempPassword);
      }
    } catch (emailError) {
      // Log email error but don't fail user creation
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
    // Check for duplicate key error explicitly
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'An account with this email already exists'
      });
    }
    console.error('User creation error:', error);
    res.status(400).json({ 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, department, status } = req.body;

    console.log('Updating user:', { id, updateData: req.body });

    // First find the user to update
    const user = await User.findOne({ id });
    if (!user) {
      console.log('User not found:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email !== user.email) {
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: user._id } 
      });
      
      if (emailExists) {
        return res.status(400).json({ 
          message: 'Email already in use by another user' 
        });
      }
    }

    // Update user fields
    user.name = fullName;
    user.email = email;
    user.role = role;
    user.department = department;
    user.status = status;

    // Save the updated user
    await user.save();
    
    // Return updated user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    console.log('User updated successfully:', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ 
      message: 'Failed to update user',
      error: error.message 
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndDelete({ id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ id });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a 6-character temporary password (4 random alphanumeric + A!)
    const randomPart = Math.random().toString(36).substring(2, 6);
    const tempPassword = `${randomPart}A!`;

    user.password = tempPassword;
    user.isFirstLogin = true;
    await user.save();

    await emailService.sendPasswordResetEmail(user, tempPassword);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};