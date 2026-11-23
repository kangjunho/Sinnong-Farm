
/*
 * 신농산삼약초농원 - 통합 script.js
 * 모바일 메뉴 / GA4 / 갤러리 / 구매문의 / 접수상태 조회
 */
(() => {
  'use strict';

  const cfg = window.FARM_CONFIG || {};
  const webAppUrl = cfg.inquiryWebAppUrl || '';

  // =========================================
  // 1. 모바일 메뉴
  // =========================================
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  menu?.addEventListener('click', () => {
    if (!nav) return;
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });

  // =========================================
  // 2. Google Analytics / 쿠키 동의
  // =========================================
  const consentKey = 'sinnong_analytics_consent';
  const banner = document.querySelector('#cookie-banner');

  function getConsent() {
    try {
      return localStorage.getItem(consentKey);
    } catch (_) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(consentKey, value);
    } catch (_) {}
  }

  let gaLoaded = false;

  function loadGA() {
    const id = cfg.ga4MeasurementId || '';
    if (gaLoaded || !/^G-[A-Z0-9]+$/.test(id)) return;

    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });

    const script = document.createElement('script');
    script.async = true;
    script.src =
      'https://www.googletagmanager.com/gtag/js?id=' +
      encodeURIComponent(id);
    document.head.appendChild(script);
  }

  if (getConsent() === 'yes') loadGA();

  if (
    banner &&
    /^G-[A-Z0-9]+$/.test(cfg.ga4MeasurementId || '') &&
    getConsent() === null
  ) {
    banner.hidden = false;
  }

  document.querySelector('#cookie-accept')
    ?.addEventListener('click', () => {
      setConsent('yes');
      if (banner) banner.hidden = true;
      loadGA();
    });

  document.querySelector('#cookie-reject')
    ?.addEventListener('click', () => {
      setConsent('no');
      if (banner) banner.hidden = true;
    });

  function track(name, params = {}) {
    if (
      getConsent() === 'yes' &&
      typeof window.gtag === 'function'
    ) {
      window.gtag('event', name, params);
    }
  }

  document.querySelectorAll('[data-product]')
    .forEach(link => {
      link.addEventListener('click', () => {
        track('select_item', {
          item_name: link.dataset.product
        });
      });
    });

  document.querySelectorAll('[data-track]')
    .forEach(link => {
      link.addEventListener('click', () => {
        track('outbound_click', {
          destination: link.dataset.track
        });
      });
    });

  // =========================================
  // 3. 상품 선택 자동 반영
  // =========================================
  const choice = document.querySelector('#product-choice');

  if (choice) {
    const index =
      new URLSearchParams(location.search).get('product');

    if (/^[1-5]$/.test(index || '')) {
      choice.selectedIndex = Number(index);
    }
  }

  // =========================================
  // 4. 갤러리 라이트박스
  // =========================================
  const tiles = [
    ...document.querySelectorAll('.gallery-item')
  ];
  const dlg = document.querySelector('#lightbox');

  if (dlg && tiles.length) {
    let current = 0;
    const lightboxImage =
      document.querySelector('#lightbox-image');
    const lightboxCaption =
      document.querySelector('#lightbox-caption');

    function renderGallery() {
      const img = tiles[current]?.querySelector('img');
      if (!img || !lightboxImage) return;

      lightboxImage.src = img.currentSrc || img.src;
      lightboxImage.alt = img.alt;

      if (lightboxCaption) {
        lightboxCaption.textContent = img.alt;
      }
    }

    tiles.forEach((tile, index) => {
      tile.addEventListener('click', () => {
        current = index;
        renderGallery();
        if (!dlg.open) dlg.showModal();
      });
    });

    document.querySelector('#lightbox-close')
      ?.addEventListener('click', () => dlg.close());

    document.querySelector('#lightbox-prev')
      ?.addEventListener('click', () => {
        current =
          (current - 1 + tiles.length) % tiles.length;
        renderGallery();
      });

    document.querySelector('#lightbox-next')
      ?.addEventListener('click', () => {
        current = (current + 1) % tiles.length;
        renderGallery();
      });

    dlg.addEventListener('click', event => {
      if (event.target === dlg) dlg.close();
    });

    dlg.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        current =
          (current - 1 + tiles.length) % tiles.length;
        renderGallery();
      }
      if (event.key === 'ArrowRight') {
        current = (current + 1) % tiles.length;
        renderGallery();
      }
    });
  }

  // =========================================
  // 5. Google Apps Script JSONP 조회
  // =========================================
  function validWebAppUrl() {
    return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/
      .test(webAppUrl);
  }

  let jsonpCounter = 0;

  function jsonp(params, timeout = 12000) {
    return new Promise((resolve, reject) => {
      if (!validWebAppUrl()) {
        reject(new Error('웹 앱 주소가 올바르지 않습니다.'));
        return;
      }

      const callback =
        'sinnongCallback' + Date.now() + (++jsonpCounter);

      const url = new URL(webAppUrl);

      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });

      url.searchParams.set('callback', callback);

      const script = document.createElement('script');
      let finished = false;
      let timer;

      function cleanup() {
        clearTimeout(timer);
        script.remove();
        delete window[callback];
      }

      function finish(error, data) {
        if (finished) return;
        finished = true;
        cleanup();

        if (error) reject(error);
        else resolve(data);
      }

      window[callback] = data => finish(null, data);

      script.onerror = () => {
        finish(new Error('서버 연결에 실패했습니다.'));
      };

      timer = setTimeout(() => {
        finish(new Error('조회 시간이 초과되었습니다.'));
      }, timeout);

      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function normalizePhone(value) {
    return String(value || '').replace(/\D/g, '');
  }

  // =========================================
  // 6. 구매문의 접수
  // =========================================
  const form = document.getElementById('inquiry-form');
  const status = document.getElementById('inquiry-status');
  const submitBtn = document.getElementById('inquiry-submit');
  const frame =
    document.getElementById('inquiry-response-frame');
  const originInput =
    document.getElementById('inquiry-origin');
  const requestInput =
    document.getElementById('inquiry-request-id');

  const receiptBox =
    document.getElementById('inquiry-receipt');
  const receiptNumber =
    document.getElementById('receipt-number');
  const copyReceiptBtn =
    document.getElementById('copy-receipt');

  let submitting = false;
  let activeRequestId = '';
  let activeFingerprint = '';
  const defaultButtonText =
    submitBtn?.textContent || '구매 문의 보내기';

  if (originInput) {
    originInput.value = location.origin;
  }

  function setStatus(message, kind = '') {
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function setSubmitting(value) {
    submitting = value;

    if (submitBtn) {
      submitBtn.disabled = value;
      submitBtn.textContent = value
        ? '접수 확인 중...'
        : defaultButtonText;
    }
  }

  function createRequestId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);

    return [...bytes]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function fingerprintForm() {
    if (!form) return '';

    return [
      'product',
      'quantity',
      'customerName',
      'customerPhone',
      'deliveryAddress',
      'message'
    ].map(name => {
      return String(
        form.elements.namedItem(name)?.value || ''
      ).trim();
    }).join('\u001f');
  }

  async function verifyReceipt(requestId) {
    // 서버 저장에 시간이 걸릴 수 있으므로 반복 확인
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const result = await jsonp({
          action: 'receipt',
          requestId
        });

        if (
          result?.ok === true &&
          result?.found === true &&
          /^SN-[A-F0-9]{16}$/.test(result.ticket || '')
        ) {
          return result;
        }
      } catch (error) {
        console.warn(
          '[Sinnong] 접수 확인 재시도:',
          error.message
        );
      }

      if (attempt < 7) await wait(2000);
    }

    return null;
  }

  function showReceipt(result) {
    if (receiptNumber) {
      receiptNumber.textContent = result.ticket;
    }

    if (receiptBox) {
      receiptBox.hidden = false;
    }

    // 조회 폼에 문의번호 자동 입력
    const lookupTicket =
      document.getElementById('lookup-ticket');

    if (lookupTicket) {
      lookupTicket.value = result.ticket;
    }

    setStatus(
      '구매 문의가 정상적으로 접수되었습니다. ' +
      '문의번호를 보관해 주세요.',
      'success'
    );

    try {
      localStorage.setItem(
        'sinnong_last_ticket',
        result.ticket
      );
    } catch (_) {}

    track('generate_lead', {
      method: 'online_inquiry'
    });
  }

  copyReceiptBtn?.addEventListener('click', async () => {
    const number = receiptNumber?.textContent || '';
    if (!number) return;

    try {
      await navigator.clipboard.writeText(number);
      copyReceiptBtn.textContent = '복사 완료';
    } catch (_) {
      copyReceiptBtn.textContent =
        '번호를 선택해 복사해 주세요';
    }
  });

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;

    if (!validWebAppUrl()) {
      setStatus(
        '온라인 문의 연결이 준비되지 않았습니다.',
        'error'
      );
      return;
    }

    if (
      !frame?.name ||
      !originInput ||
      !requestInput
    ) {
      setStatus('문의 양식 구성 오류입니다.', 'error');
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const phone = normalizePhone(
      form.elements.namedItem('customerPhone')?.value
    );

    if (!/^0\d{8,10}$/.test(phone)) {
      setStatus('연락처를 확인해 주세요.', 'error');
      return;
    }

    // 같은 내용 재시도 시 동일 ID 사용
    // 서버에서 중복 저장을 방지할 수 있음
    const currentFingerprint = fingerprintForm();

    if (
      !activeRequestId ||
      currentFingerprint !== activeFingerprint
    ) {
      activeRequestId = createRequestId();
      activeFingerprint = currentFingerprint;
    }

    requestInput.value = activeRequestId;
    originInput.value = location.origin;

    form.action = webAppUrl;
    form.method = 'POST';
    form.target = frame.name;

    if (receiptBox) receiptBox.hidden = true;

    setSubmitting(true);
    setStatus(
      '문의 내용을 전송하고 접수 여부를 확인하고 있습니다.',
      'info'
    );

    try {
      // 실제 POST 전송
      HTMLFormElement.prototype.submit.call(form);

      // iframe 응답에 의존하지 않고
      // Google Sheets 저장 여부를 별도로 확인
      const result = await verifyReceipt(activeRequestId);

      if (result) {
        showReceipt(result);

        form.reset();
        originInput.value = location.origin;

        activeRequestId = '';
        activeFingerprint = '';
      } else {
        setStatus(
          '접수 여부를 아직 확인하지 못했습니다. ' +
          '동일한 내용을 다시 전송하면 중복 접수를 방지합니다. ' +
          '문의번호가 표시되지 않으면 전화로 확인해 주세요.',
          'warning'
        );
      }
    } catch (error) {
      console.error('[Sinnong] 문의 오류:', error);

      setStatus(
        '접수 여부를 확인하지 못했습니다. ' +
        '잠시 후 다시 확인하거나 전화로 문의해 주세요.',
        'warning'
      );
    } finally {
      setSubmitting(false);
    }
  });

  // =========================================
  // 7. 고객 문의 상태 조회
  // =========================================
  const lookupForm =
    document.getElementById('lookup-form');
  const lookupButton =
    document.getElementById('lookup-submit');
  const lookupMessage =
    document.getElementById('lookup-message');
  const lookupResult =
    document.getElementById('lookup-result');
  const lookupStatus =
    document.getElementById('lookup-status');
  const lookupDate =
    document.getElementById('lookup-date');
  const lookupNumber =
    document.getElementById('lookup-number');

  try {
    const lastTicket =
      localStorage.getItem('sinnong_last_ticket');

    const ticketInput =
      document.getElementById('lookup-ticket');

    if (lastTicket && ticketInput && !ticketInput.value) {
      ticketInput.value = lastTicket;
    }
  } catch (_) {}

  lookupForm?.addEventListener('submit', async event => {
    event.preventDefault();

    const ticket = String(
      document.getElementById('lookup-ticket')?.value || ''
    ).trim().toUpperCase();

    const phone = normalizePhone(
      document.getElementById('lookup-phone')?.value
    );

    if (!/^SN-[A-F0-9]{16}$/.test(ticket)) {
      if (lookupMessage) {
        lookupMessage.textContent =
          '문의번호 형식을 확인해 주세요.';
      }
      if (lookupResult) lookupResult.hidden = true;
      return;
    }

    if (!/^0\d{8,10}$/.test(phone)) {
      if (lookupMessage) {
        lookupMessage.textContent =
          '연락처를 확인해 주세요.';
      }
      if (lookupResult) lookupResult.hidden = true;
      return;
    }

    if (lookupButton) {
      lookupButton.disabled = true;
      lookupButton.textContent = '조회 중...';
    }

    if (lookupMessage) {
      lookupMessage.textContent = '';
    }

    if (lookupResult) lookupResult.hidden = true;

    try {
      const result = await jsonp({
        action: 'lookup',
        ticket,
        phone
      });

      if (result?.ok === true && result?.found === true) {
        if (lookupNumber) {
          lookupNumber.textContent = result.ticket;
        }

        if (lookupStatus) {
          lookupStatus.textContent = result.status;
        }

        if (lookupDate) {
          lookupDate.textContent =
            result.receivedAt || '-';
        }

        if (lookupResult) lookupResult.hidden = false;
      } else {
        if (lookupMessage) {
          lookupMessage.textContent =
            '일치하는 문의 내역이 없습니다. ' +
            '문의번호와 연락처를 확인해 주세요.';
        }
      }
    } catch (error) {
      console.error('[Sinnong] 상태 조회 오류:', error);

      if (lookupMessage) {
        lookupMessage.textContent =
          '조회 서버에 연결하지 못했습니다. ' +
          '잠시 후 다시 시도해 주세요.';
      }
    } finally {
      if (lookupButton) {
        lookupButton.disabled = false;
        lookupButton.textContent = '문의 상태 조회';
      }
    }
  });
})();
