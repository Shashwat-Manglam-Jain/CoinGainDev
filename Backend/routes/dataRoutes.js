const express = require('express');
const router = express.Router();
const { getRewards, getNotifications, getRedemptions } = require('../controllers/dataController');
const verifyToken = require('../middleware/verifyToken');


router.get('/rewards/:adminId', verifyToken, getRewards);
router.get('/notifications/:adminId', verifyToken, getNotifications);
router.get('/redemptions/:adminId', verifyToken, getRedemptions);

module.exports = router;
