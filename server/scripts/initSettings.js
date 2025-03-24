const mongoose = require('mongoose');
const Setting = require('../models/Setting');
require('dotenv').config();

const defaultSettings = {
  general: [
    {
      key: 'company.name',
      value: 'My Company',
      category: 'general',
      description: 'Company Name'
    },
    {
      key: 'company.email',
      value: 'contact@company.com',
      category: 'general',
      description: 'Company Email'
    }
  ],
  appearance: [
    {
      key: 'theme.mode',
      value: 'light',
      category: 'appearance',
      description: 'Theme Mode'
    },
    {
      key: 'theme.color',
      value: '#4F46E5',
      category: 'appearance',
      description: 'Primary Color'
    }
  ],
  security: [
    {
      key: 'security.loginAttempts',
      value: 3,
      category: 'security',
      description: 'Max Login Attempts'
    },
    {
      key: 'security.passwordExpiry',
      value: 90,
      category: 'security',
      description: 'Password Expiry (days)'
    }
  ],
  notifications: [
    {
      key: 'notifications.email',
      value: true,
      category: 'notifications',
      description: 'Email Notifications'
    },
    {
      key: 'notifications.desktop',
      value: true,
      category: 'notifications',
      description: 'Desktop Notifications'
    }
  ],
  email: [
    {
      key: 'email.smtp.host',
      value: 'smtp.company.com',
      category: 'email',
      description: 'SMTP Host'
    },
    {
      key: 'email.smtp.port',
      value: 587,
      category: 'email',
      description: 'SMTP Port'
    }
  ]
};

const initializeSettings = async () => {
  try {
    // Connect to MongoDB
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all existing settings
    await Setting.deleteMany({});
    console.log('Cleared existing settings');

    // Insert the new default settings by category
    for (const category in defaultSettings) {
      await Setting.insertMany(defaultSettings[category]);
    }

    console.log('Settings initialized successfully');
    
    // Keep connection alive and wait for user input
    console.log('\nPress Ctrl+C to exit...');
    
    // Handle cleanup on manual termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Error initializing settings:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the initialization
initializeSettings();
