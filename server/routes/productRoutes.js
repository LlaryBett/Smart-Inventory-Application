const express = require('express');
const router = express.Router();

// Define product-related routes
router.get('/', (req, res) => {
  res.send('Product route is working!');
});

module.exports = router;
