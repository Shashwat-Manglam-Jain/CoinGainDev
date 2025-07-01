const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  getAllUsers,
  updateUser,
  deleteUser,
  sendToken,
  addReward,
  deleteReward,
  deleteAllNotification,
  deleteNotification,
  approveRedemption,
  rejectRedemption,
  editReward
} = require('../controllers/adminController');

const verifyToken = require('../middleware/verifyToken');

// GET - Fetch all admins
router.get('/admins', getAllAdmins);

// GET - Fetch users created by a specific admin
router.get('/admin/:adminId', verifyToken, getAllUsers);

// PUT - Update a specific user
router.put('/user/:id', verifyToken, updateUser);

// DELETE - Delete a specific user
router.delete('/user/:id', verifyToken, deleteUser);

// POST - Send tokens to a user
router.post('/user/:id/addcoin', verifyToken, sendToken);

// POST - Add a new reward for admin
router.post('/admin/:adminId/reward', verifyToken, addReward);

router.put('/admin/reward/:rewardId', verifyToken, editReward);

// DELETE - Delete a reward
router.delete('/admin/reward/:rewardId', verifyToken, deleteReward);

// DELETE - Delete a specific notification
router.delete('/notification/:id', verifyToken, deleteNotification);

// DELETE - Delete all notifications for logged-in user
router.delete('/notifications', verifyToken, deleteAllNotification);

// PUT - Approve a redemption
router.put('/redemption/:id/approve', verifyToken, approveRedemption);

// PUT - Reject a redemption
router.put('/redemption/:id/reject', verifyToken, rejectRedemption);

module.exports = router;
