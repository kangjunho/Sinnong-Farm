const products=["3~4년근","5~6년근","7~8년근","9~10년근","11년근 이상"];
document.getElementById('product-grid').innerHTML=products.map((name,i)=>`<article class="product"><div class="placeholder" aria-label="상품 사진 준비 중">🌿</div><div class="product-body"><h3>${name} 산양삼</h3><p>지리산 함양 재배 산양삼 원물</p><p>가격·수량 별도 문의</p><a href="#contact">구매 문의 →</a></div></article>`).join('');
document.getElementById('year').textContent=new Date().getFullYear();
const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));
