const { sendEventNotifications } = require('../controllers/calendarController');

// Schedule event notifications to run daily at 9 AM
const scheduleEventNotifications = () => {
  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    9, // 9 AM
    0,
    0
  );

  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilFirstRun = scheduledTime - now;

  // Schedule first run
  setTimeout(() => {
    sendEventNotifications();
    // Schedule subsequent runs every 24 hours
    setInterval(sendEventNotifications, 24 * 60 * 60 * 1000);
  }, timeUntilFirstRun);
};

module.exports = { scheduleEventNotifications };
