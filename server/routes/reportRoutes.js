const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getReportData } = require('../controllers/reportController');

const router = express.Router();

router.get('/', protect, getReportData);

module.exports = router;
