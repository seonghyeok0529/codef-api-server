// 📄 services/codefService.js
require('dotenv').config();
const axios = require('axios');
const qs = require('qs');               // npm i qs

/* 1) OAuth 토큰 발급 ---------------------------------------------------- */
exports.getAccessToken = async () => {
  // Basic {base64(client_id:client_secret)}
  const basicAuth =
    'Basic ' +
    Buffer.from(
      `${process.env.CODEF_CLIENT_ID}:${process.env.CODEF_CLIENT_SECRET}`
    ).toString('base64');

  const body = qs.stringify({ grant_type: 'client_credentials' });

  try {
    const res = await axios.post(
      'https://oauth.codef.io/oauth/token',
      body,
      {
        headers: {
          Authorization: basicAuth,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000
      }
    );
    console.log('✅ access_token 발급 성공');
    return res.data.access_token;       // ← realEstateController에서 사용
  } catch (err) {
    console.error('❌ access_token 발급 실패:', err.response?.data || err.message);
    throw err;
  }
};

/* 2) 등기부등본 열람 API 호출 ------------------------------------------ */
exports.requestRegisterAPI = async (token, payload) => {
  return await axios.post(
    'https://api.codef.io/v1/kr/public/ck/real-estate-register/status',
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
};
