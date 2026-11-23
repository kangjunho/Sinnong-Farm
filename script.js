(()=>{'use strict';
const cfg=window.FARM_CONFIG||{};
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav');
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
const banner=document.querySelector('#cookie-banner');
const consent=localStorage.getItem('sinnong_analytics_consent');
if(banner&&cfg.ga4MeasurementId&&consent===null)banner.hidden=false;
let gaLoaded=false;
function loadGA(){if(gaLoaded||!/^G-[A-Z0-9]+$/.test(cfg.ga4MeasurementId||''))return;gaLoaded=true;const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(cfg.ga4MeasurementId);document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',cfg.ga4MeasurementId,{anonymize_ip:true});}
if(consent==='yes')loadGA();
document.querySelector('#cookie-accept')?.addEventListener('click',()=>{localStorage.setItem('sinnong_analytics_consent','yes');if(banner)banner.hidden=true;loadGA();});
document.querySelector('#cookie-reject')?.addEventListener('click',()=>{localStorage.setItem('sinnong_analytics_consent','no');if(banner)banner.hidden=true;});
function track(name,params){if(localStorage.getItem('sinnong_analytics_consent')==='yes'&&typeof window.gtag==='function')window.gtag('event',name,params||{});}
document.querySelectorAll('[data-product]').forEach(a=>a.addEventListener('click',()=>track('select_item',{item_name:a.dataset.product})));
document.querySelectorAll('[data-track]').forEach(a=>a.addEventListener('click',()=>track('outbound_click',{destination:a.dataset.track})));
const choice=document.querySelector('#product-choice');if(choice){const index=new URLSearchParams(location.search).get('product');if(index&&/^[1-5]$/.test(index))choice.selectedIndex=Number(index);}
const tiles=[...document.querySelectorAll('.gallery-item')],dlg=document.querySelector('#lightbox');
if(dlg&&tiles.length){let current=0;const render=()=>{const im=tiles[current].querySelector('img');document.querySelector('#lightbox-image').src=im.src;document.querySelector('#lightbox-image').alt=im.alt;document.querySelector('#lightbox-caption').textContent=im.alt;};tiles.forEach((t,i)=>t.addEventListener('click',()=>{current=i;render();dlg.showModal();}));document.querySelector('#lightbox-close')?.addEventListener('click',()=>dlg.close());document.querySelector('#lightbox-prev')?.addEventListener('click',()=>{current=(current-1+tiles.length)%tiles.length;render();});document.querySelector('#lightbox-next')?.addEventListener('click',()=>{current=(current+1)%tiles.length;render();});dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});dlg.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){current=(current-1+tiles.length)%tiles.length;render();}if(e.key==='ArrowRight'){current=(current+1)%tiles.length;render();}});}
})();

// 구매 문의: 숨겨진 iframe으로 전송하고 Apps Script postMessage 응답 수신
(()=>{'use strict';
const form=document.getElementById('inquiry-form');if(!form)return;
const cfg=window.FARM_CONFIG||{},status=document.getElementById('inquiry-status'),btn=document.getElementById('inquiry-submit');
const url=cfg.inquiryWebAppUrl||'';let pending=false,requestId='',timeoutId=null;
const originInput=document.getElementById('inquiry-origin');originInput.value=location.origin;
function show(text,kind){status.textContent=text;status.dataset.kind=kind||'';}
function finish(){pending=false;btn.disabled=false;clearTimeout(timeoutId);timeoutId=null;}
form.addEventListener('submit',event=>{
 event.preventDefault();if(pending)return;
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)){show('온라인 접수 준비 중입니다. 전화 또는 문자로 문의해 주세요.','error');return;}
 if(!form.checkValidity()){form.reportValidity();return;}
 const phone=form.elements.customerPhone.value.replace(/\D/g,'');
 if(!/^0\d{8,10}$/.test(phone)){show('연락처를 확인해 주세요.','error');return;}
 requestId=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
 document.getElementById('inquiry-request-id').value=requestId;
 originInput.value=location.origin;
 form.action=url;pending=true;btn.disabled=true;
 show('문의 내용을 전송하고 있습니다. 잠시 기다려 주세요.');
 // 응답이 차단될 수도 있으므로 실패라고 단정하지 않는다.
 timeoutId=setTimeout(()=>{if(!pending)return;finish();show('접수 결과를 확인하지 못했습니다. 중복 전송하지 마시고 이메일 수신 여부를 확인하거나 전화로 문의해 주세요.','warning');},20000);
 form.submit();
});
window.addEventListener('message',event=>{
 if(!pending)return;
 if(event.source!==document.getElementById('inquiry-response-frame').contentWindow)return;
 if(event.origin!=='https://script.google.com'&&event.origin!=='https://script.googleusercontent.com'&&!/^https:\/\/[a-z0-9.-]+\.googleusercontent\.com$/.test(event.origin))return;
 const d=event.data;if(!d||d.type!=='sinnong-inquiry-result'||d.requestId!==requestId)return;
 finish();
 if(d.code==='duplicate')show('최근 동일한 문의가 접수되었습니다. 중복 접수를 방지했습니다.','warning');
 else if(d.ok){show('구매 문의가 정상 접수되었습니다. 확인 후 연락드리겠습니다.','success');form.reset();trackLead();}
 else show('접수에 실패했습니다. 입력 내용을 확인하거나 전화로 문의해 주세요.','error');
});
function trackLead(){if(localStorage.getItem('sinnong_analytics_consent')==='yes'&&typeof window.gtag==='function')window.gtag('event','generate_lead',{method:'online_inquiry'});}
})();
