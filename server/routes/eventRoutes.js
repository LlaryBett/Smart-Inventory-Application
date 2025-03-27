const express = require('express');
const { createEvent, getEvents } = require('../controllers/eventController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', authenticate, createEvent);
router.get('/', authenticate, getEvents);

module.exports = router;
