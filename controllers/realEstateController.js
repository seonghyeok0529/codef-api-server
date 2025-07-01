// controllers/realEstateController.js
// ───────────────────────────────────────────────────────────
// POST  /real-estate/register-status
//   1) 필수 값 검증            → LOCAL-400
//   2) 비밀번호 2종 암호화     → encryptNumericPass / encryptCashPass
//   3) CODEF 요청              → CF-xxxx 응답 pass-through
//   4) 콘솔에 SUCCESS / ERROR  로그
// ───────────────────────────────────────────────────────────

const {
    getAccessToken,
    requestRegisterAPI
  } = require('../services/codefService');
  
  const {
    encryptCashPass,     // 전자민원캐시 비번 (영+숫 4~8)
    encryptNumericPass   // 열람 비번        (숫자 4)
  } = require('../services/rsaEncryptor');
  
  exports.requestRegisterStatus = async (req, res) => {
    try {
      /* 1) 필수 필드 존재 확인 ------------------------------------------ */
      const { password, ePrepayPass, ePrepayNo } = req.body;
      if (!password || !ePrepayPass || !ePrepayNo) {
        return res.status(400).json({
          code   : 'LOCAL-400',
          message: 'password, ePrepayPass, ePrepayNo는 필수입니다.'
        });
      }
  
      /* 2) 평문 비밀번호 형식 검증 + 암호화 ----------------------------- */
      let encPassword, encPrepayPass;
      try {
        encPassword   = encryptNumericPass(password);   // 숫자 4
        encPrepayPass = encryptCashPass(ePrepayPass);   // 영+숫 4~8
      } catch (err) {
        return res.status(400).json({ code: 'LOCAL-400', message: err.message });
      }
  
      /* 3) CODEF payload 구성 ------------------------------------------ */
      const payload = {
        organization        : '0002',
        phoneNo             : req.body.phoneNo,
        password            : encPassword,
        ePrepayNo           : ePrepayNo,
        ePrepayPass         : encPrepayPass,
        issueType           : '1',
  
        // 주소·옵션 그대로 전달
        inquiryType         : req.body.inquiryType,
        realtyType          : req.body.realtyType,
        addr_sido           : req.body.addr_sido,
        addr_sigungu        : req.body.addr_sigungu,
        addr_roadName       : req.body.addr_roadName,
        addr_buildingNumber : req.body.addr_buildingNumber,
        dong                : req.body.dong,
        ho                  : req.body.ho,
        uniqueNo            : req.body.uniqueNo
      };
  
      /* 4) CODEF 호출 --------------------------------------------------- */
      const token    = await getAccessToken();
      const response = await requestRegisterAPI(token, payload);
  
      console.log('[CODEF SUCCESS]', JSON.stringify(response.data, null, 2));
      return res.json(response.data);        // CF-00000 등 성공 응답
  
    } catch (err) {
      // CODEF 실패 or 네트워크 오류
      if (err.response?.data) {
        console.error('[CODEF ERROR]', JSON.stringify(err.response.data, null, 2));
        return res.status(502).json(err.response.data); // CF-xxxx 오류 pass-through
      }
      console.error('[LOCAL ERROR]', err.message);
      return res.status(500).json({ code: 'LOCAL-500', message: err.message });
    }
  };
  