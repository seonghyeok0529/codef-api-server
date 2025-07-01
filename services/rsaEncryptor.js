// services/rsaEncryptor.js
const { publicEncrypt, constants } = require('crypto');

// ─ 공통 암호화 로직 ─
function _encrypt(plain) {
  const key = process.env.CODEF_PUBLIC_KEY;
  return publicEncrypt(
    { key, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(plain, 'utf8')
  ).toString('base64');              // 344자
}

/* ① 전자민원캐시 비번 (영+숫 4~8) */
function encryptCashPass(plain) {
  const p = String(plain).trim();
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,8}$/.test(p)) {
    throw new Error('ePrepayPass(평문)는 영문+숫자 4~8자여야 합니다.');
  }
  return p;
}

/* ② 열람용 비번 (숫자 4자리) */
function encryptNumericPass(plain) {
  const p = String(plain).trim();
  if (!/^\d{4}$/.test(p)) {
    throw new Error('password(평문)는 숫자 4자리여야 합니다.');
  }
  return _encrypt(p);
}

module.exports = { encryptCashPass, encryptNumericPass };
