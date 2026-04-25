const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');
const reportController = require('../controllers/reportController');

router.post('/analyze', geminiController.analyze);
router.post('/chat', geminiController.chat);
router.post('/report', reportController.generateReport);

module.exports = router;
