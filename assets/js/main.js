(function(){
  var stack=document.querySelector('[data-debuginn-site]'); if(!stack)return;
  var sections=Array.prototype.slice.call(stack.querySelectorAll('[data-section]'));
  var dots=Array.prototype.slice.call(stack.querySelectorAll('[data-section-dot]'));
  var pageDots=stack.querySelector('[data-page-dots]');
  var down=stack.querySelector('[data-page-down]');
  var header=stack.querySelector('[data-site-header]');
  var footer=stack.querySelector('[data-site-footer]');
  var footerPhoto=stack.querySelector('[data-footer-photo]');
  var footerCopyright=stack.querySelector('[data-footer-copyright]');
  var firstId=stack.getAttribute('data-first-section');
  var lastId=stack.getAttribute('data-last-section');
  var hasClosing=sections.some(function(section){return section.hasAttribute('data-closing-section')});
  var socialEnding=stack.querySelector('[data-social-ending]');
  var hasSocialEnding=!!(socialEnding&&socialEnding.id===lastId);
  function resolveClosingLink(){
    if(hasClosing||!hasSocialEnding||location.hash!=='#closing')return;
    history.replaceState(history.state,'','#'+socialEnding.id);
    var behavior=stack.style.scrollBehavior;
    stack.style.scrollBehavior='auto';
    socialEnding.scrollIntoView({block:'start',behavior:'auto'});
    stack.style.scrollBehavior=behavior;
  }
  resolveClosingLink();
  window.addEventListener('hashchange',resolveClosingLink);
  var currentTone='light';
  var toneGeneration=0;
  var activeId='';
  var toneCache=Object.create(null);
  function darkAppearance(){return document.documentElement.getAttribute('data-theme')==='dark'}
  function applyTone(tone){
    var activeSection=sections.find(function(section){return section.id===activeId});
    var photoPage=activeId===firstId||!!(activeSection&&activeSection.hasAttribute('data-social-section'));
    currentTone=photoPage&&darkAppearance()?'light':tone==='dark'?'dark':'light';
    if(activeSection&&activeSection.classList.contains('page-screen-home'))activeSection.dataset.photoTone=currentTone;
    var useLight=currentTone==='dark';
    if(header){header.classList.toggle('global-header--light',!useLight);header.classList.toggle('global-header--dark',useLight)}
    var mastfoot=footer?footer.querySelector('.mastfoot'):null;
    if(mastfoot){mastfoot.classList.toggle('mastfoot--light',!useLight);mastfoot.classList.toggle('mastfoot--dark',useLight)}
    var social=stack.querySelector('[data-social-section]');
    if(social){social.querySelectorAll('.social-btn').forEach(function(el){el.classList.toggle('social-btn--light',useLight)});social.querySelectorAll('.social-btn-badge').forEach(function(el){el.classList.toggle('social-btn-badge--light',useLight)});var total=social.querySelector('.social-total'); if(total)total.classList.toggle('social-total--light',useLight)}
    if(down)down.classList.toggle('global-page-down--light',useLight);
    if(pageDots)pageDots.classList.toggle('page-dots--light',useLight);
  }
  function setToneFromImage(src){
    var generation=++toneGeneration;
    if(!src){applyTone('light');return}
    if(toneCache[src]){applyTone(toneCache[src]);return}
    var img=new Image();
    img.onload=function(){
      if(generation!==toneGeneration)return;
      try{
        var canvas=document.createElement('canvas'); var ctx=canvas.getContext('2d',{willReadFrequently:true}); if(!ctx)return;
        canvas.width=img.naturalWidth; canvas.height=img.naturalHeight; ctx.drawImage(img,0,0);
        var data=ctx.getImageData(0,0,canvas.width,canvas.height).data; var lum=0; var px=data.length/4;
        for(var i=0;i<data.length;i+=4){lum+=0.2126*(data[i]||0)+0.7152*(data[i+1]||0)+0.0722*(data[i+2]||0)}
        toneCache[src]=px>0&&lum/px>150?'dark':'light';
        applyTone(toneCache[src]);
      }catch(e){applyTone('light')}
    };
    img.onerror=function(){if(generation===toneGeneration)applyTone('light')};
    img.src=src;
  }
  function setActive(id){
    activeId=id;
    toneGeneration++;
    dots.forEach(function(dot){var active=dot.getAttribute('data-section-dot')===id;dot.classList.toggle('is-active',active);active?dot.setAttribute('aria-current','page'):dot.removeAttribute('aria-current')});
    var idx=sections.findIndex(function(s){return s.id===id}); var next=sections[idx+1];
    if(down){down.style.display=next?'':'none'; if(next)down.setAttribute('href','#'+next.id)}
    var activeSection=sections[idx];
    var isSocial=!!(activeSection&&activeSection.hasAttribute('data-social-section'));
    var photoSection=id===firstId||(hasClosing?isSocial:id===lastId);
    var finalFooter=!hasClosing&&!hasSocialEnding&&id===lastId;
    var footerSection=id===firstId||finalFooter;
    if(header) header.hidden=!photoSection;
    if(footer) footer.hidden=!footerSection;
    if(footerPhoto) footerPhoto.hidden=!footerSection;
    if(footerCopyright) footerCopyright.hidden=!finalFooter;
    if(id===firstId){setToneFromImage(stack.getAttribute('data-home-thumb')||'')}
    if(hasClosing?isSocial:id===lastId){setToneFromImage(stack.getAttribute('data-social-thumb')||'')}
    if(!photoSection&&activeSection){
      var permanentDark=activeSection.getAttribute('data-section-appearance')==='dark'||activeSection.classList.contains('page-screen-iassets');
      applyTone(permanentDark||darkAppearance()?'light':'dark');
    }
  }
  document.addEventListener('debuginn:themechange',function(){if(activeId)setActive(activeId)});
  if('IntersectionObserver'in window){var observer=new IntersectionObserver(function(entries){var visible=entries.filter(function(e){return e.isIntersecting}).sort(function(a,b){return b.intersectionRatio-a.intersectionRatio})[0]; if(visible)setActive(visible.target.id)}, {root:stack,threshold:[.45,.6,.8]}); sections.forEach(function(s){observer.observe(s)})}
  var home=document.getElementById('home'); var homeBg=''; var homeThumb=''; var homeIdx=0; if(home){try{var backgrounds=JSON.parse(home.getAttribute('data-backgrounds')||'[]'); var thumbs=JSON.parse(home.getAttribute('data-thumbs')||'[]'); if(backgrounds.length){var img=home.querySelector('[data-home-bg]'); homeIdx=Math.floor(Math.random()*backgrounds.length); homeBg=backgrounds[homeIdx]||''; homeThumb=thumbs[homeIdx]||''; stack.setAttribute('data-home-thumb',homeThumb); if(img)img.src=homeBg}}catch(e){}}
  var socialBgSection=stack.querySelector('[data-social-section]'); if(socialBgSection){try{var socialBackgrounds=JSON.parse(socialBgSection.getAttribute('data-backgrounds')||'[]'); var socialThumbs=JSON.parse(socialBgSection.getAttribute('data-thumbs')||'[]'); if(socialBackgrounds.length){var socialImg=socialBgSection.querySelector('[data-social-bg]'); var socialIdx=Math.floor(Math.random()*socialBackgrounds.length); var socialBg=socialBackgrounds[socialIdx]||''; if(socialBackgrounds.length>1){var guard=0; while(socialBg===homeBg&&guard<8){socialIdx=Math.floor(Math.random()*socialBackgrounds.length); socialBg=socialBackgrounds[socialIdx]||''; guard++}} stack.setAttribute('data-social-thumb',socialThumbs[socialIdx]||''); if(socialImg)socialImg.src=socialBg}}catch(e){}}
  var quote=document.getElementById('hitokoto'); if(quote&&quote.dataset.quoteEndpoint){fetch(quote.dataset.quoteEndpoint).then(function(r){return r.json()}).then(function(data){quote.textContent=data.hitokoto||''}).catch(function(){quote.textContent=''})}
  var social=stack.querySelector('[data-social-section]'); if(social&&'IntersectionObserver'in window){var socialObserver=new IntersectionObserver(function(entries){if(!entries[0]||!entries[0].isIntersecting)return; social.querySelectorAll('[data-count-to]').forEach(function(el){var target=Number(el.getAttribute('data-count-to')||0);var start=performance.now();function tick(now){var p=Math.min((now-start)/800,1);var eased=1-Math.pow(1-p,3);el.textContent=String(Math.round(eased*target));if(p<1)requestAnimationFrame(tick)}requestAnimationFrame(tick)}); socialObserver.disconnect()}, {root:stack,threshold:.3}); socialObserver.observe(social)}
  setActive((location.hash||'#home').slice(1));
})();
