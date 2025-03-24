const Setting = require('../models/Setting');

// Middleware to enforce admin-only access
const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Get all settings grouped by category
const getSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = setting.value;
      return acc;
    }, {});
    res.status(200).json(groupedSettings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Save or update grouped settings
const saveSettings = async (req, res) => {
  try {
    const groupedSettings = req.body;

    for (const [category, settings] of Object.entries(groupedSettings)) {
      for (const [key, value] of Object.entries(settings)) {
        await Setting.findOneAndUpdate(
          { category, key },
          { value, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      }
    }

    res.status(200).json({ message: 'Settings saved successfully' });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ message: 'Error saving settings' });
  }
};

// Delete a specific setting by category and key
const deleteSetting = async (req, res) => {
  try {
    const { category, key } = req.params;
    const deletedSetting = await Setting.findOneAndDelete({ category, key });
    if (!deletedSetting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.status(200).json({ message: 'Setting deleted successfully' });
  } catch (err) {
    console.error('Error deleting setting:', err);
    res.status(500).json({ message: 'Error deleting setting' });
  }
};

module.exports = {
  getSettings,
  saveSettings,
  deleteSetting
};
