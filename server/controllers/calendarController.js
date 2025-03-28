const Event = require('../models/Event');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Add a new event
exports.addEvent = async (req, res) => {
  try {
    const { title, description, date, time, type } = req.body;
    console.log('Received event data:', { title, description, date, time, type });

    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }

    const event = new Event({
      title,
      description,
      date,
      time,
      type,
    });

    await event.save();
    console.log('Event saved successfully:', event);

    // Send notifications about the new event
    try {
      const users = await User.find();
      console.log('Found users to notify:', users.length);
      
      for (const user of users) {
        console.log('Attempting to send notification to:', {
          userId: user._id,
          email: user.email,
          name: user.name
        });
        
        await emailService.sendEventNotification(user, [event]);
      }
    } catch (notificationError) {
      console.error('Notification error details:', {
        error: notificationError.message,
        stack: notificationError.stack
      });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Failed to add event' });
  }
};

// Fetch all events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    console.log('Fetched events:', events);

    // Send notifications about fetched events
    try {
      const users = await User.find();
      console.log('Found users to notify:', users.length);

      for (const user of users) {
        console.log('Attempting to send notification to:', {
          userId: user._id,
          email: user.email,
          name: user.name
        });

        await emailService.sendEventNotification(user, events);
      }
    } catch (notificationError) {
      console.error('Notification error details:', {
        error: notificationError.message,
        stack: notificationError.stack
      });
    }

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};
