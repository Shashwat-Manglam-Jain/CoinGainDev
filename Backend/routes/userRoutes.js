const express = require('express');
const router = express.Router();
const {
  getUser,
  updateUser,
  postRedemptionData,
  getRedemptionsData,
  getNotifications,
  postNotification,
  deleteNotification,
  markAllNotificationsRead,
  deleteRedemption,
  fetchAdminDetails,
} = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');

router.get('/user/:id', verifyToken, getUser);
router.put('/user/:id', verifyToken, updateUser);
router.get('/admin/:adminId', verifyToken, fetchAdminDetails);
router.post('/redeem', verifyToken, postRedemptionData);
router.get('/redeem/:id', verifyToken, getRedemptionsData);
router.delete('/redeem/:id', verifyToken, deleteRedemption);
router.get('/notifications/:id', verifyToken, getNotifications);
router.post('/notifications', verifyToken, postNotification);
router.delete('/notifications/:id', verifyToken, deleteNotification);
router.put('/notifications/mark-all-read', verifyToken, markAllNotificationsRead);

module.exports = router;