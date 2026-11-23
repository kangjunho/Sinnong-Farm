
/* =====================================================
   신농산삼약초농원 - 통합 script.js

   1. 모바일 메뉴
   2. Google Analytics GA4
   3. 쿠키 동의
   4. 상품 선택 및 클릭 추적
   5. 갤러리 라이트박스
   6. 구매 문의 Google Apps Script 연동
   7. 버튼 클릭 즉시 전송 안내
   8. 서버 응답 확인 및 중복 제출 방지
===================================================== */

(() => {
  'use strict';

  const cfg = window.FARM_CONFIG || {};

  /* ==============================
     1. 모바일 메뉴
  ============================== */

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  menu?.addEventListener('click', () => {
    if (!nav) return;

    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });


  /* ==============================
     2. Google Analytics GA4
  ============================== */

  const consentKey = 'sinnong_analytics_consent';
  const banner = document.querySelector('#cookie-banner');

  function getConsent() {
    try {
      return localStorage.getItem(consentKey);
    } catch (error) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(consentKey, value);
    } catch (error) {
      console.warn('[Sinnong] Consent storage unavailable');
    }
  }

  const consent = getConsent();

  if (
    banner &&
    /^G-[A-Z0-9]+$/.test(cfg.ga4MeasurementId || '') &&
    consent === null
  ) {
    banner.hidden = false;
  }

  let gaLoaded = false;

  function loadGA() {
    if (gaLoaded) return;

    const id = cfg.ga4MeasurementId || '';

    if (!/^G-[A-Z0-9]+$/.test(id)) return;

    gaLoaded = true;

    window.dataLayer = window.dataLayer || [];

    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());

    window.gtag('config', id, {
      anonymize_ip: true
    });

    const script = document.createElement('script');

    script.async = true;
    script.src =
      'https://www.googletagmanager.com/gtag/js?id=' +
      encodeURIComponent(id);

    document.head.appendChild(script);
  }

  if (consent === 'yes') {
    loadGA();
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


  /* ==============================
     3. 상품 클릭 추적
  ============================== */

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


  /* ==============================
     4. 상품 선택 자동 반영
  ============================== */

  const choice = document.querySelector('#product-choice');

  if (choice) {
    const index =
      new URLSearchParams(location.search).get('product');

    if (/^[1-5]$/.test(index || '')) {
      choice.selectedIndex = Number(index);
    }
  }


  /* ==============================
     5. 갤러리 라이트박스
  ============================== */

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
      ?.addEventListener('click', () => {
        dlg.close();
      });

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
      if (event.target === dlg) {
        dlg.close();
      }
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


  /* ==============================
     6. 구매 문의
  ============================== */

  const form = document.getElementById('inquiry-form');

  if (!form) return;

  const status =
    document.getElementById('inquiry-status');

  const submitBtn =
    document.getElementById('inquiry-submit');

  const frame =
    document.getElementById('inquiry-response-frame');

  const originInput =
    document.getElementById('inquiry-origin');

  const requestInput =
    document.getElementById('inquiry-request-id');

  const webAppUrl = cfg.inquiryWebAppUrl || '';

  const defaultButtonText = submitBtn
    ? submitBtn.textContent
    : '구매 문의 보내기 ↗';

  let pending = false;
  let requestId = '';
  let timeoutId = null;

  if (originInput) {
    originInput.value = location.origin;
  }

  function showStatus(message, kind = '') {
    if (!status) return;

    status.textContent = message;
    status.dataset.kind = kind;
  }

  function setSubmitting(value) {
    pending = value;

    if (submitBtn) {
      submitBtn.disabled = value;

      submitBtn.textContent = value
        ? '문의 전송 중...'
        : defaultButtonText;
    }
  }

  function clearResponseTimeout() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function finishSubmission() {
    clearResponseTimeout();
    setSubmitting(false);
  }

  function generateRequestId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === 'function'
    ) {
      return window.crypto.randomUUID();
    }

    return (
      Date.now() + '-' +
      Math.random().toString(36).slice(2)
    );
  }

  function trustedOrigin(origin) {
    return (
      origin === 'https://script.google.com' ||
      origin === 'https://script.googleusercontent.com' ||
      /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com$/.test(origin)
    );
  }


  /* ==============================
     7. 구매 문의 전송
  ============================== */

  form.addEventListener('submit', event => {
    event.preventDefault();

    // 중복 클릭 방지
    if (pending) return;

    // Apps Script URL 확인
    if (
      !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(
        webAppUrl
      )
    ) {
      showStatus(
        '온라인 접수 준비 중입니다. 전화 또는 문자로 문의해 주세요.',
        'error'
      );
      return;
    }

    // 필수 HTML 요소 확인
    if (
      !frame ||
      !frame.name ||
      !originInput ||
      !requestInput
    ) {
      showStatus(
        '문의 양식에 문제가 있습니다. 전화 또는 문자로 문의해 주세요.',
        'error'
      );
      return;
    }

    // 필수 입력값 확인
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // 연락처 확인
    const phoneField =
      form.elements.namedItem('customerPhone');

    const phone = String(
      phoneField?.value || ''
    ).replace(/\D/g, '');

    if (!/^0\d{8,10}$/.test(phone)) {
      showStatus(
        '연락처를 확인해 주세요.',
        'error'
      );
      return;
    }

    // 요청 ID 생성
    requestId = generateRequestId();

    requestInput.value = requestId;
    originInput.value = location.origin;

    // 전송 설정
    form.action = webAppUrl;
    form.method = 'POST';
    form.target = frame.name;

    setSubmitting(true);

    // 클릭 즉시 고객에게 안내
    showStatus(
      '구매 문의를 전송했습니다. 접수 확인 후 연락드리겠습니다.',
      'info'
    );

    console.info('[Sinnong] Inquiry submitted', {
      requestId,
      target: frame.name
    });

    // 서버 응답 대기
    timeoutId = setTimeout(() => {
      if (!pending) return;

      console.warn(
        '[Sinnong] Confirmation unavailable',
        { requestId }
      );

      finishSubmission();

      showStatus(
        '문의 내용을 전송했습니다. 접수 여부를 확인할 수 없는 경우 전화로 문의해 주세요. 중복 전송은 피해주세요.',
        'warning'
      );
    }, 20000);

    // 실제 제출
    try {
      form.submit();
    } catch (error) {
      finishSubmission();

      showStatus(
        '문의 전송을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        'error'
      );

      console.error(
        '[Sinnong] Submission error',
        error
      );
    }
  });


  /* ==============================
     8. Apps Script 응답 수신
  ============================== */

  window.addEventListener('message', event => {
    const data = event.data;

    if (
      !pending ||
      !data ||
      typeof data !== 'object' ||
      data.type !== 'sinnong-inquiry-result'
    ) {
      return;
    }

    const originOK =
      trustedOrigin(event.origin);

    const sourceOK =
      !!frame &&
      event.source === frame.contentWindow;

    const requestOK =
      String(data.requestId || '') === requestId;

    console.info(
      '[Sinnong] Apps Script response',
      {
        origin: event.origin,
        originOK,
        sourceOK,
        requestOK,
        code: data.code,
        ok: data.ok
      }
    );

    // 보안 및 요청 일치 확인
    if (
      !originOK ||
      !sourceOK ||
      !requestOK
    ) {
      console.warn(
        '[Sinnong] Response ignored'
      );
      return;
    }

    finishSubmission();

    // 중복 접수
    if (data.code === 'duplicate') {
      showStatus(
        '이미 접수된 문의입니다. 중복 전송을 방지했습니다.',
        'warning'
      );
      return;
    }

    // 접수 성공
    if (data.ok === true) {
      showStatus(
        '구매 문의가 정상 접수되었습니다. 확인 후 연락드리겠습니다.',
        'success'
      );

      form.reset();
      originInput.value = location.origin;

      track('generate_lead', {
        method: 'online_inquiry'
      });

      return;
    }

    // 접수 실패
    showStatus(
      '문의 접수에 실패했습니다. 전화 또는 문자로 문의해 주세요.',
      'error'
    );
  });

})();
