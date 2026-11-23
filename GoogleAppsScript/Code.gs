/** 신농산삼약초농원: Google Apps Script 웹 앱 */
const RECIPIENT = 'rkdwnsgh2002@gmail.com';
const SHEET_NAME = '구매문의';
// 배포 전에 이 값을 GitHub Pages 사이트의 origin으로 설정하세요 (끝의 / 없이).
const ALLOWED_ORIGIN = 'https://kangjunho.github.io';
const PRODUCTS = ['3~4년근','5~6년근','7~8년근','9~10년근','11년근 이상'];

function doPost(e) {
  let ok = false;
  try {
    const p = (e && e.parameter) || {};
    if (String(p.company || '').trim()) throw new Error('spam');
    if (p.pageOrigin !== ALLOWED_ORIGIN) throw new Error('invalid origin');
    const name = clean(p.customerName, 50), phone = clean(p.customerPhone, 25);
    const product = clean(p.product, 30), quantity = clean(p.quantity, 50);
    const message = clean(p.message, 1000);
    if (!name || !/^0\d{8,10}$/.test(phone.replace(/\D/g,'')) || !PRODUCTS.includes(product) || !quantity) throw new Error('invalid input');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const now = new Date();
      const subject = '[신농산삼약초농원] 산양삼 구매 문의 - ' + product;
      const body = [
        '신규 산양삼 구매 문의가 접수되었습니다.', '',
        '접수일시: ' + Utilities.formatDate(now,'Asia/Seoul','yyyy-MM-dd HH:mm:ss'),
        '성함: ' + name, '연락처: ' + phone, '관심 상품: ' + product,
        '희망 수량: ' + quantity, '추가 문의: ' + (message || '없음'), '',
        '이 메일은 홈페이지 구매 문의 양식에서 자동 발송되었습니다.'
      ].join('\n');
      // 이메일 발송에 성공한 경우에만 접수 성공을 반환합니다.
      MailApp.sendEmail({to:RECIPIENT, subject:subject, body:body, name:'신농산삼약초농원'});
      // 시트 기록 실패가 이메일 발송 성공을 취소하지 않도록 별도 처리합니다.
      try {
        const ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
        if (ssId) {
          const ss = SpreadsheetApp.openById(ssId);
          let sheet = ss.getSheetByName(SHEET_NAME);
          if (!sheet) { sheet = ss.insertSheet(SHEET_NAME); sheet.appendRow(['접수일시','성함','연락처','관심 상품','수량','추가 문의']); }
          // 스프레드시트 수식 주입 방지
          sheet.appendRow([now, name, phone, product, quantity, message].map(sheetSafe));
        }
      } catch (sheetError) { console.error('시트 저장 실패: '+sheetError); }
      ok = true;
    } finally { lock.releaseLock(); }
  } catch (err) { console.error('문의 접수 실패: '+err); }
  // iframe으로 제출한 페이지에 결과를 알립니다.
  const payload = JSON.stringify({type:'sinnong-inquiry-result',ok:ok});
  const response = '<!doctype html><html><body><script>window.parent.postMessage(' + payload + ',' + JSON.stringify(ALLOWED_ORIGIN) + ');</script></body></html>';
  return HtmlService.createHtmlOutput(response).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function clean(v,max) { return String(v||'').trim().slice(0,max).replace(/[\u0000-\u001f\u007f]/g,' '); }
function sheetSafe(v) { return typeof v==='string' && /^[=+\-@]/.test(v) ? "'"+v : v; }
