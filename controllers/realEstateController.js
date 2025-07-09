// controllers/realEstateController.js
// ───────────────────────────────────────────────────────────
const { getAccessToken, requestRegisterAPI } = require('../services/codefService');
const { encryptRSA } = require('../services/rsaEncryptor');

exports.requestRegisterStatus = async (req, res) => {
  try {
    // 1) 필수 필드 체크 ────────────────────────────────────
    const { password, ePrepayPass, ePrepayNo } = req.body;
    if (!password || !ePrepayPass || !ePrepayNo) {
      return res.status(400).json({
        code: 'LOCAL-400',
        message: 'password, ePrepayPass, ePrepayNo는 필수입니다.'
      });
    }

    // 2) 암호화 (형식 오류 → 400) ─────────────────────────
    let encPassword, encPrepayPass;
    try {
      encPassword = encryptRSA(password);
      encPrepayPass = encryptRSA(ePrepayPass);
    } catch (err) {
      return res.status(400).json({ code: 'LOCAL-400', message: err.message });
    }

    // 3) payload 구성 ────────────────────────────────────
    const payload = {
      organization: '0002',
      phoneNo: req.body.phoneNo,
      password: encPassword,
      ePrepayNo: ePrepayNo,
      ePrepayPass: encPrepayPass,
      issueType: '0',         // ✅ PDF 열람용 설정 (발급은 '0')
      originDataYN: '1',

      // 주소·조회 옵션 그대로 전달
      inquiryType: req.body.inquiryType,
      realtyType: req.body.realtyType,
      addr_sido: req.body.addr_sido,
      addr_sigungu: req.body.addr_sigungu,
      addr_roadName: req.body.addr_roadName,
      addr_buildingNumber: req.body.addr_buildingNumber,
      dong: req.body.dong,
      ho: req.body.ho,
      uniqueNo: req.body.uniqueNo
    };

    // 4) CODEF 호출 ──────────────────────────────────────
    const token = await getAccessToken();
    const response = await requestRegisterAPI(token, payload);

    // 📌 CODEF 응답이 JSON 문자열일 수 있으므로 디코딩 처리
    let parsedData;
    try {
      const raw = typeof response.data === 'string' ? response.data.trim() : response.data;

      let decoded = raw;
      try {
        decoded = decodeURIComponent(raw);
      } catch (err) {
        console.warn('[DECODE WARNING] decodeURIComponent 실패, 원본 사용');
      }

      let cleaned = decoded;
      while (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }

      parsedData = JSON.parse(cleaned);
    } catch (err) {
      console.error('[PARSE ERROR]', err.message);
      return res.status(500).json({
        code: 'LOCAL-PARSE-500',
        message: '응답 파싱 실패: ' + err.message
      });
    }

    console.log('[CODEF SUCCESS]', {
      resultCode: parsedData?.result?.code || null,
      resIssueYN: parsedData?.data?.resIssueYN || null,
      hasPdf: !!parsedData?.data?.resOriGinalData
    });

    // ✅ PDF Base64 포함 응답 (조건: 발급 성공 + PDF 존재)
    const pdfBase64 = parsedData?.data?.resOriGinalData;
    const resIssueYN = parsedData?.data?.resIssueYN;

    if (resIssueYN === '1' && pdfBase64) {
      const fileName = `${Date.now()}_register.pdf`;
      return res.json({
        ...parsedData,
        pdfBase64,
        fileName,
        downloadUrl: `/download/base64?fileName=${encodeURIComponent(fileName)}&base64=${encodeURIComponent(pdfBase64)}`
      });
    } else {
      return res.json(parsedData);
    }

  } catch (err) {
    if (err.response?.data) {
      console.error('[CODEF ERROR]', JSON.stringify(err.response.data, null, 2));
      return res.status(502).json(err.response.data);
    }
    console.error('[LOCAL ERROR]', err.message);
    return res.status(500).json({ code: 'LOCAL-500', message: err.message });
  }
};

// ✅ base64 → PDF 다운로드 endpoint
exports.downloadPdfFromBase64 = async (req, res) => {
  try {
    const { base64, fileName } = req.query;
    if (!base64 || !fileName) {
      return res.status(400).json({ error: 'fileName과 base64가 필요합니다.' });
    }

    const buffer = Buffer.from(base64, 'base64');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ error: 'PDF 다운로드 실패: ' + err.message });
  }
};
