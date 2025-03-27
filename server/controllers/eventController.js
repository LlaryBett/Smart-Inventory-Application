const Event = require('../models/Event');
const User = require('../models/User');
const { sendEventNotification } = require('../utils/emailService');

const createEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, date, time, type } = req.body;
    
    // Create and save the new event
    const event = new Event({
      title,
      description,
      date: new Date(date),
      time,
      type,
      createdBy: req.user._id
    });

    await event.save();
    console.log('New event created:', event); // Debug log

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    console.log('Today\'s date:', today); // Debug log

    // Get top 2 upcoming events including the newly created one
    const upcomingEvents = await Event.find({
      date: { $gte: today }
    })
    .sort({ date: 1 })
    .limit(2);

    console.log('Found upcoming events:', upcomingEvents); // Debug log

    if (upcomingEvents.length > 0) {
      // Get all users' emails
      const users = await User.find({}, 'email').lean();
      const emails = users.map(user => user.email);

      // Format events for email
      const formattedEvents = upcomingEvents.map(event => ({
        ...event,
        date: new Date(event.date),
        title: event.title || 'Untitled Event',
        description: event.description || 'No description provided',
        time: event.time || 'No time specified'
      }));

      // Send notification if we have events and recipients
      if (emails.length > 0 && formattedEvents.length > 0) {
        try {
          await sendEventNotification(emails, formattedEvents);
          console.log('Event notification sent successfully');
        } catch (emailError) {
          console.error('Error sending event notification:', emailError);
          // Continue execution even if email fails
        }
      }
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      message: 'Error creating event', 
      error: error.message 
    });
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 })
      .lean();
    
    console.log('Found events:', events); // Debug log
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents
};
