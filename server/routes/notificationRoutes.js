const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  deleteNotification,
  markAllRead
} = require('../controllers/notificationController');

const router = express.Router();

// Apply auth protection globally
router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/read-all')
  .put(markAllRead);

router.route('/:id/read')
  .put(markAsRead);

router.route('/:id')
  .delete(deleteNotification);

module.exports = router;
