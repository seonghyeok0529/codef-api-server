// routes/encrypt.js
const express = require('express');
const router = express.Router();
const { encryptRSA } = require('../services/rsaEncryptor');

router.post('/', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text 값이 필요합니다.' });

  try {
    const encrypted = encryptRSA(text);
    res.json({ encrypted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
