const express = require('express');
const router = express.Router();
const { requestRegisterStatus } = require('../controllers/realEstateController');

router.post('/register-status', requestRegisterStatus);

module.exports = router;
