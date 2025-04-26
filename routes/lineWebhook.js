const express = require('express');
const router = express.Router();
const { handleLineWebhook } = require('../controllers/lineController');

// ここを正確に設定（パスを明示）
router.post('/', handleLineWebhook);

module.exports = router;
