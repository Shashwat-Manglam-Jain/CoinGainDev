const express = require('express');
const router = express.Router();
const {
  getUser,
  updateUser,
  postRedemptionData,
  getRedemptionsData,
  getNotifications,
  deleteNotification,
  markAllNotificationsRead,
  deleteRedemption,
  fetchAdminDetails,
  markNotificationRead,
  fetchexpiryofToken,
  editUser,
  checkExpiration,
} = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');

router.get('/user/:id', verifyToken, getUser);
router.put('/user/:id', verifyToken, updateUser);
router.put('/edituser/:id', verifyToken,editUser);
router.get('/admin/:adminId', verifyToken, fetchAdminDetails);
router.post('/redeem', verifyToken, postRedemptionData);
router.get('/redeem/:id', verifyToken, getRedemptionsData);
router.delete('/redeem/:id', verifyToken, deleteRedemption);
router.get('/notifications/:id', verifyToken, getNotifications);
router.delete('/notifications/:id', verifyToken, deleteNotification);
router.put('/notifications/mark-all-read', verifyToken, markAllNotificationsRead);
router.put('/notifications/mark-read', verifyToken, markNotificationRead);

router.get('/fetchexpiryofToken/:adminId/:userID', verifyToken,   fetchexpiryofToken);

router.get('/check-expiration/:adminId/:userID',    checkExpiration);
module.exports = router;