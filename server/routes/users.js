const express = require('express');
const router = express.Router();
const usersController = require('../controllers/userController'); // Changed from usersController to userController
const { authenticateToken, restrictTo } = require('../middleware/permissions');

// Protected routes (require authentication and admin role)
router.use(authenticateToken);
router.use(restrictTo('admin')); // Only admins can access these routes

router.get('/', usersController.getUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;
