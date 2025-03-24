const Setting = require('../models/Setting');

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.find().sort('category');
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});
    
    res.json(groupedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const updatedSettings = [];

    for (const [key, value] of Object.entries(updates)) {
      const setting = await Setting.findOneAndUpdate(
        { key },
        { 
          value,
          lastUpdated: new Date(),
          updatedBy: req.user._id
        },
        { new: true, upsert: true }
      );
      updatedSettings.push(setting);
    }

    res.json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
  try {
    const defaultSettings = {
      'company.name': 'My Company',
      'company.email': 'contact@company.com',
      'theme.mode': 'light',
      'theme.color': '#4F46E5',
      'security.loginAttempts': 3,
      'security.passwordExpiry': 90,
      'notifications.email': true,
      'notifications.desktop': true,
      'email.smtp.host': 'smtp.company.com',
      'email.smtp.port': 587,
      'email.smtp.secure': true
    };

    const updatedSettings = [];
    
    for (const [key, value] of Object.entries(defaultSettings)) {
      const setting = await Setting.findOneAndUpdate(
        { key },
        { 
          value,
          lastUpdated: new Date(),
          updatedBy: req.user._id
        },
        { new: true, upsert: true }
      );
      updatedSettings.push(setting);
    }

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific setting
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete setting
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOneAndDelete({ key });
    
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Backup settings
exports.backupSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const backup = {
      date: new Date(),
      settings: settings,
      version: '1.0'
    };
    
    res.json(backup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Restore settings from backup
exports.restoreSettings = async (req, res) => {
  try {
    const backup = req.body;
    const restoredSettings = [];
    
    for (const setting of backup.settings) {
      const restored = await Setting.findOneAndUpdate(
        { key: setting.key },
        { 
          ...setting,
          lastUpdated: new Date(),
          updatedBy: req.user._id
        },
        { new: true, upsert: true }
      );
      restoredSettings.push(restored);
    }
    
    res.json(restoredSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
