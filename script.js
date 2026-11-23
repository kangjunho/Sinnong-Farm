
/* 신농산삼약초농원 | 통합 script.js */
(() => {
  'use strict';
  const cfg = window.FARM_CONFIG || {};
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  menu?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open') || false;
    menu.setAttribute('aria-expanded', String(open));
  });

  // GA4: 동의 후에만 로드
  const banner = document.querySelector('#cookie-banner');
  const consentKey = 'sinnong_analytics_consent';
  let consent = null;

  try {
    consent = localStorage.getItem(consentKey);
  } catch (_) {}

  if (
    banner &&
    /^G-[A-Z0-9]+$/.test(cfg.ga4MeasurementId || '') &&
    consent === null
  ) {
    banner.hidden = false;
  }

  let gaLoaded = false;

  function loadGA() {
    if (
      gaLoaded ||
      !/^G-[A-Z0-9]+$/.test(cfg.ga4MeasurementId || '')
    ) return;

    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', cfg.ga4MeasurementId, {
      anonymize_ip: true
    });

    const s = document.createElement('script');
    s.async = true;
    s.src =
      'https://www.googletagmanager.com/gtag/js?id=' +
      encodeURIComponent(cfg.ga4MeasurementId);

    document.head.appendChild(s);
  }

  if (consent === 'yes') loadGA();

  document.querySelector('#cookie-accept')
    ?.addEventListener('click', () => {
      try {
        localStorage.setItem(consentKey, 'yes');
      } catch (_) {}

      if (banner) banner.hidden = true;
      loadGA();
    });

  document.querySelector('#cookie-reject')
    ?.addEventListener('click', () => {
      try {
        localStorage.setItem(consentKey, 'no');
      } catch (_) {}

      if (banner) banner.hidden = true;
    });

  function track(name, params = {}) {
    try {
      if (
        localStorage.getItem(consentKey) === 'yes' &&
        typeof window.gtag === 'function'
      ) {
        window.gtag('event', name, params);
      }
    } catch (_) {}
  }

  document.querySelectorAll('[data-product]').forEach(a => {
    a.addEventListener('click', () => {
      track('select_item', {
        item_name: a.dataset.product
      });
    });
  });

  document.querySelectorAll('[data-track]').forEach(a => {
    a.addEventListener('click', () => {
      track('outbound_click', {
        destination: a.dataset.track
      });
    });
  });

  // 상품 페이지에서 선택한 연근 자동 반영
  const choice = document.querySelector('#product-choice');

  if (choice) {
    const index =
      new URLSearchParams(location.search).get('product');

    if (/^[1-5]$/.test(index || '')) {
      choice.selectedIndex = Number(index);
    }
  }

  // 농원 갤러리 라이트박스
  const tiles = [
    ...document.querySelectorAll('.gallery-item')
  ];
  const dlg = document.querySelector('#lightbox');

  if (dlg && tiles.length) {
    let current = 0;

    const image =
      document.querySelector('#lightbox-image');
    const caption =
      document.querySelector('#lightbox-caption');

    function render() {
      const im = tiles[current]?.querySelector('img');
      if (!im || !image) return;

      image.src = im.currentSrc || im.src;
      image.alt = im.alt;

      if (caption) caption.textContent = im.alt;
    }

    tiles.forEach((tile, i) => {
      tile.addEventListener('click', () => {
        current = i;
        render();
        if (!dlg.open) dlg.showModal();
      });
    });

    document.querySelector('#lightbox-close')
      ?.addEventListener('click', () => dlg.close());

    document.querySelector('#lightbox-prev')
      ?.addEventListener('click', () => {
        current =
          (current - 1 + tiles.length) % tiles.length;
        render();
      });

    document.querySelector('#lightbox-next')
      ?.addEventListener('click', () => {
        current = (current + 1) % tiles.length;
        render();
      });

    dlg.addEventListener('click', event => {
      if (event.target === dlg) dlg.close();
    });

    dlg.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        current =
          (current - 1 + tiles.length) % tiles.length;
        render();
      } else if (event.key === 'ArrowRight') {
        current = (current + 1) % tiles.length;
        render();
      }
    });
  }

  // 구매 문의: iframe POST + Apps Script postMessage
  const form = document.getElementById('inquiry-form');
  if (!form) return;

  const status =
    document.getElementById('inquiry-status');
  const btn =
    document.getElementById('inquiry-submit');
  const frame =
    document.getElementById('inquiry-response-frame');
  const originInput =
    document.getElementById('inquiry-origin');
  const requestInput =
    document.getElementById('inquiry-request-id');

  const url = cfg.inquiryWebAppUrl || '';

  let pending = false;
  let requestId = '';
  let timeoutId = null;

  if (originInput) {
    originInput.value = location.origin;
  }

  if (btn) {
    btn.textContent = '구매 문의 보내기 ↗';
  }

  function show(message, kind = '') {
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function finish() {
    pending = false;

    if (btn) btn.disabled = false;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = null;
  }

  function makeRequestId() {
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

  form.addEventListener('submit', event => {
    event.preventDefault();

    if (pending) return;

    if (
      !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)
    ) {
      show(
        '온라인 접수 준비 중입니다. 전화 또는 문자로 문의해 주세요.',
        'error'
      );
      return;
    }

    if (!frame || !originInput || !requestInput) {
      show(
        '문의 양식 구성이 완전하지 않습니다. 관리자에게 알려주세요.',
        'error'
      );

      console.error(
        '[Sinnong] Required iframe/hidden fields missing'
      );
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const phoneField =
      form.elements.namedItem('customerPhone');

    const phone =
      String(phoneField?.value || '').replace(/\D/g, '');

    if (!/^0\d{8,10}$/.test(phone)) {
      show('연락처를 확인해 주세요.', 'error');
      return;
    }

    requestId = makeRequestId();

    requestInput.value = requestId;
    originInput.value = location.origin;

    form.action = url;
    form.method = 'POST';
    form.target = frame.name;

    pending = true;

    if (btn) btn.disabled = true;

    show(
      '문의 내용을 전송하고 있습니다. 잠시 기다려 주세요.'
    );

    console.info('[Sinnong] Inquiry submitted', {
      requestId,
      frameName: frame.name
    });

    timeoutId = setTimeout(() => {
      if (!pending) return;

      console.warn('[Sinnong] Response timeout', {
        requestId
      });

      finish();

      show(
        '접수 결과를 확인하지 못했습니다. 중복 전송하지 마시고 전화로 접수 여부를 확인해 주세요.',
        'warning'
      );
    }, 20000);

    form.submit();
  });

  // Google Apps Script 응답 수신
  window.addEventListener('message', event => {
    const data = event.data;

    if (
      !data ||
      typeof data !== 'object' ||
      data.type !== 'sinnong-inquiry-result'
    ) return;

    const originOK = trustedOrigin(event.origin);

    const sourceOK =
      !!frame &&
      event.source === frame.contentWindow;

    const requestOK =
      pending &&
      String(data.requestId || '') === requestId;

    console.info('[Sinnong] Apps Script response', {
      origin: event.origin,
      originOK,
      sourceOK,
      requestOK,
      code: data.code,
      ok: data.ok
    });

    // 출처, iframe, 요청 ID 모두 검증
    if (
      !pending ||
      !originOK ||
      !sourceOK ||
      !requestOK
    ) {
      console.warn('[Sinnong] Response ignored');
      return;
    }

    finish();

    if (data.code === 'duplicate') {
      show(
        '최근 동일한 문의가 접수되었습니다. 중복 접수를 방지했습니다.',
        'warning'
      );

    } else if (data.ok === true) {
      show(
        '구매 문의가 정상 접수되었습니다. 확인 후 연락드리겠습니다.',
        'success'
      );

      form.reset();
      originInput.value = location.origin;

      track('generate_lead', {
        method: 'online_inquiry'
      });

    } else {
      show(
        '접수에 실패했습니다. 입력 내용을 확인하거나 전화로 문의해 주세요.',
        'error'
      );
    }
  });
})();
