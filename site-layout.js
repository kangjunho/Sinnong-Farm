
/*
 * 신농산삼약초농원
 * site-layout.js
 *
 * 공통 메뉴 / Footer / 구매문의 탭 관리
 */

(() => {
  'use strict';

  const ADDRESS = '경상남도 함양군 휴천면 송전리 611-1';

  // =========================================
  // 1. 공통 메뉴 수정
  // =========================================

  const currentPage =
    location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav a').forEach(link => {
    const label = link.textContent.trim();

    if (label === '오시는 길') {
      link.setAttribute('href', 'location.html');
    }

    if (label === '구매문의' || label === '구매 문의') {
      link.setAttribute('href', 'contact.html');
    }

    const href = link.getAttribute('href');

    if (href === currentPage) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  // =========================================
  // 2. 공통 Footer
  // =========================================

  const footer = document.querySelector('footer');

  if (footer) {
    footer.innerHTML = `
      <div class="wrap footer-inner">

        <div class="farm-footer-info">

          <strong>신농산삼약초농원</strong>

          <p>지리산 함양 마적대 · 생산자 강재두</p>

          <p class="farm-footer-address">
            ${ADDRESS}
          </p>

          <p>
            대표 연락처:
            <a href="tel:01067880022">
              010-6788-0022
            </a>
          </p>

          <small>
            상품의 가격·수량·배송 조건은
            구매 전 문의해 주세요.
          </small>

          <p class="farm-copyright">
            © ${new Date().getFullYear()}
            SINNONG WILD GINSENG FARM.
          </p>

        </div>

        <div class="farm-footer-links">

          <a href="location.html">오시는 길</a>
          <span>·</span>
          <a href="contact.html">구매 문의</a>

          <br>

          <a
            data-track="naver_map"
            href="https://map.naver.com/p/entry/place/1107217183"
            target="_blank"
            rel="noopener"
          >네이버 지도</a>

          <span>·</span>

          <a
            data-track="youtube"
            href="https://www.youtube.com/@고고마적대"
            target="_blank"
            rel="noopener"
          >고고마적대 유튜브</a>

        </div>

      </div>
    `;
  }

  // =========================================
  // 3. 공통 디자인 로드
  // =========================================

  if (!document.getElementById('site-layout-css')) {
    const css = document.createElement('link');

    css.id = 'site-layout-css';
    css.rel = 'stylesheet';
    css.href = 'site-layout.css?v=20261124';

    document.head.appendChild(css);
  }

  // =========================================
  // 4. 주소 복사
  // =========================================

  document.getElementById('copy-farm-address')
    ?.addEventListener('click', async event => {
      const button = event.currentTarget;

      try {
        await navigator.clipboard.writeText(ADDRESS);
        button.textContent = '주소 복사 완료';
      } catch (_) {
        window.prompt('아래 주소를 복사해 주세요.', ADDRESS);
      }
    });

  // =========================================
  // 5. 구매 문의 페이지 탭 구성
  // =========================================

  if (currentPage !== 'contact.html') return;

  const form = document.getElementById('inquiry-form');
  const lookup = document.getElementById('lookup-section');
  const finder = document.getElementById('ticket-finder');
  const phone = document.querySelector('.farm-contacts');

  if (!form || !lookup || !finder || !phone) return;

  const panel = form.closest('.contact-panel');
  if (!panel) return;

  const receipt = document.getElementById('inquiry-receipt');
  const frame = document.getElementById('inquiry-response-frame');

  // 기존 구매 문의 페이지의 위치 패널 제거

  const grid = panel.closest('.contact-grid');

  if (grid) {
    [...grid.children].forEach(child => {
      if (child !== panel) child.remove();
    });

    grid.classList.add('inquiry-single-grid');
  }

  panel.classList.add('inquiry-tab-container');

  // 페이지 제목 수정

  const pageHead = document.querySelector('.page-head');

  if (pageHead) {
    pageHead.classList.add('inquiry-page-head');

    const heading = pageHead.querySelector('h1');
    const description = pageHead.querySelector('p');
    const eyebrow = pageHead.querySelector('.eyebrow');

    if (heading) heading.textContent = '산양삼 구매 문의';

    if (eyebrow) {
      eyebrow.textContent = 'CONTACT & INQUIRY';
    }

    if (description) {
      description.textContent =
        '정성을 담아 재배한 산양삼, 편하게 문의해 주세요.';
    }
  }

  document.title = '구매문의 | 신농산삼약초농원';

  // =========================================
  // 6. 탭 및 패널 생성
  // =========================================

  const tabs = [
    {
      id: 'purchase',
      icon: '♧',
      label: '구매 문의'
    },
    {
      id: 'status',
      icon: '☷',
      label: '문의 확인'
    },
    {
      id: 'phone',
      icon: '☎',
      label: '전화·문자 문의'
    },
    {
      id: 'find',
      icon: '⌕',
      label: '문의번호 찾기'
    }
  ];

  const tabNav = document.createElement('div');

  tabNav.className = 'inquiry-tabs';
  tabNav.setAttribute('role', 'tablist');
  tabNav.setAttribute('aria-label', '구매 문의 메뉴');

  const panels = {};

  tabs.forEach(tab => {
    const button = document.createElement('button');

    button.type = 'button';
    button.id = 'tab-button-' + tab.id;
    button.className = 'inquiry-tab-button';
    button.dataset.tab = tab.id;

    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('aria-controls', 'tab-panel-' + tab.id);

    button.innerHTML = `
      <span class="tab-icon" aria-hidden="true">
        ${tab.icon}
      </span>
      <span>${tab.label}</span>
    `;

    tabNav.appendChild(button);

    const section = document.createElement('section');

    section.id = 'tab-panel-' + tab.id;
    section.className = 'inquiry-tab-panel';

    section.setAttribute('role', 'tabpanel');
    section.setAttribute('aria-labelledby', button.id);

    section.hidden = true;

    panels[tab.id] = section;
  });

  // =========================================
  // 7. 구매 문의 탭
  // =========================================

  const purchaseTitle = document.createElement('h2');

  purchaseTitle.textContent = '산양삼 원물 구매 문의';

  const purchaseDescription = document.createElement('p');

  purchaseDescription.textContent =
    '관심 상품과 희망 수량을 남겨주시면 확인 후 연락드리겠습니다.';

  panels.purchase.append(
    purchaseTitle,
    purchaseDescription,
    form
  );

  if (receipt) panels.purchase.appendChild(receipt);
  if (frame) panels.purchase.appendChild(frame);

  // =========================================
  // 8. 문의 확인 탭
  // =========================================

  panels.status.appendChild(lookup);

  // =========================================
  // 9. 전화·문자 문의 탭
  // =========================================

  const phoneTitle = document.createElement('h2');

  phoneTitle.textContent = '전화·문자 문의';

  const phoneDescription = document.createElement('p');

  phoneDescription.textContent =
    '농원으로 직접 연락하시면 구매 상담을 받으실 수 있습니다.';

  const phoneNotice = document.createElement('p');

  phoneNotice.className = 'phone-notice';

  phoneNotice.textContent =
    '가격·재고·배송 가능 여부는 구매 전 확인해 주세요.';

  panels.phone.append(
    phoneTitle,
    phoneDescription,
    phone,
    phoneNotice
  );

  // =========================================
  // 10. 문의번호 찾기 탭
  // =========================================

  panels.find.appendChild(finder);

  // 기존 노드의 이벤트를 유지하면서 재배치

  panel.replaceChildren(
    tabNav,
    panels.purchase,
    panels.status,
    panels.phone,
    panels.find
  );

  // =========================================
  // 11. 탭 전환
  // =========================================

  function openTab(id, updateHash = true) {
    if (!panels[id]) id = 'purchase';

    tabs.forEach(tab => {
      const active = tab.id === id;

      const button = document.getElementById(
        'tab-button-' + tab.id
      );

      button.classList.toggle('active', active);

      button.setAttribute(
        'aria-selected',
        String(active)
      );

      button.tabIndex = active ? 0 : -1;

      panels[tab.id].hidden = !active;
    });

    if (updateHash) {
      history.replaceState(
        null,
        '',
        location.pathname + location.search + '#' + id
      );
    }
  }

  tabNav.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      openTab(button.dataset.tab);
    });
  });

  // 키보드 접근성

  tabNav.addEventListener('keydown', event => {
    const buttons = [...tabNav.querySelectorAll('[role="tab"]')];
    const current = buttons.indexOf(document.activeElement);

    if (current < 0) return;

    let next = current;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (current + 1) % buttons.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (current - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = buttons.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    openTab(buttons[next].dataset.tab);
    buttons[next].focus();
  });

  // =========================================
  // 12. 기존 조회 버튼과 탭 연결
  // =========================================

  panel.addEventListener('click', event => {
    const link = event.target.closest('a');

    if (!link) return;

    const href = link.getAttribute('href');

    if (href === '#lookup-section') {
      event.preventDefault();
      openTab('status');
      panel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    if (href === '#ticket-finder') {
      event.preventDefault();
      openTab('find');
      panel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });

  // 문의번호 찾기 결과에서 '이 문의 조회하기' 클릭

  finder.addEventListener('click', event => {
    const button = event.target.closest(
      '.ticket-found-card button'
    );

    if (!button) return;

    openTab('status');

    panel.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }, true);

  // 문의번호 찾기 탭에서 돌아가기

  const backButton = document.createElement('button');

  backButton.type = 'button';
  backButton.className = 'tab-back-button';
  backButton.textContent = '← 문의 상태 조회로 돌아가기';

  backButton.addEventListener('click', () => {
    openTab('status');
  });

  panels.find.appendChild(backButton);

  // =========================================
  // 13. 최초 화면
  // =========================================

  function tabFromHash() {
    const hash = location.hash.slice(1);

    if (hash === 'lookup-section') return 'status';
    if (hash === 'ticket-finder') return 'find';

    return panels[hash] ? hash : 'purchase';
  }

  openTab(tabFromHash(), false);

  window.addEventListener('hashchange', () => {
    openTab(tabFromHash(), false);
  });

})();
