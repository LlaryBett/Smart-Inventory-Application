const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const auth = require('../middleware/auth');

// Define routes with proper middleware and controller functions
router.post('/events', auth, calendarController.addEvent);
router.get('/events', auth, calendarController.getEvents);

module.exports = router;
