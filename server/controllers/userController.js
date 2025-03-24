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
                        'A1!' + // Ensure password requirements are met
                        crypto.randomBytes(4).toString('hex');

    const user = new User({
      id: `USER-${Date.now()}`, // Ensure ID is generated
      name,
      email,
      password: tempPassword,
      role,
      createdBy: req.user._id
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
    res.status(400).json({ 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date() };
    
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findOneAndUpdate(
      { id },
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

    const tempPassword = Math.random().toString(36).slice(-8);
    user.password = tempPassword;
    user.isFirstLogin = true;
    await user.save();

    await emailService.sendPasswordResetEmail(user, tempPassword);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
