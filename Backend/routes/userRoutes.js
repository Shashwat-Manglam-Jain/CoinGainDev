const express = require('express');
const router = express.Router();

const {
  getUser,
  postRedemeData,
  getRedemptionsdata,
  getNotification,
  postNotification,
  fetchadmindetails
} = require('../controllers/userController'); // Make sure this path is correct

const verifyToken = require('../middleware/verifyToken'); // Adjust path if needed

// Get a user by ID
router.get('/user/:id', verifyToken, getUser);

router.get('/admin/:adminId', verifyToken,  fetchadmindetails);

// Post a redemption request
router.post('/redeem', verifyToken, postRedemeData);

// Get all redemptions for a user
router.get('/redeem/:id', verifyToken, getRedemptionsdata);

// Get all notifications for a user
router.get('/notifications/:id', verifyToken, getNotification);

// Post a notification
router.post('/notifications', verifyToken, postNotification);

module.exports = router;
