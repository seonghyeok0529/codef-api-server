// testEncrypt.js
require('dotenv').config();               // .env 로드
const { encryptRSA } = require('./services/rsaEncryptor');

const cipher = encryptRSA('A1b2');        // 평문 예시
console.log('cipher len =', cipher.length);
console.log(cipher);                      // 앞부분 확인
