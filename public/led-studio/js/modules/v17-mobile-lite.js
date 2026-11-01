/* V17 Mobile Lite — phone layout: view/present + basic editing, notice to use desktop for the rest.
   Turns on for narrow or touch-landscape screens (override with ?mobile=1 / ?mobile=0).
   Never adds new editing logic: every action reuses an existing STUDIO API or a hidden desktop button. */
(function(){
'use strict';
try{
 const S=window.STUDIO;if(!S||!S.engine)return;
 const E=S.engine,state=S.state,$=id=>document.getElementById(id);
 const NOTICE_KEY='ledstudio-mobile-notice-v1';
 const query=new URLSearchParams(location.search).get('mobile');
 const mq=matchMedia('(max-width: 820px), (pointer: coarse) and (max-height: 500px)');
 const isEn=()=>(S.cloud16?.state?.locale||document.documentElement.dataset.locale)==='en';
 const L=(vi,en)=>isEn()?en:vi;
 const safe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
 const review=()=>!!S.cloud16?.isClientReviewMode?.();
 const ML={active:false,tab:null,held:false,started:false,lastSel:undefined,lastKey:'',project:undefined,fitAt:0};
 S.mobile17=ML;

 const root=document.createElement('div');root.id='mobileLite17';root.className='ml17';root.hidden=true;
 root.innerHTML=`<div class="ml17-notice" id="ml17Notice" hidden><p id="ml17NoticeText"></p><div><button type="button" id="ml17Copy"></button><button type="button" class="primary" id="ml17NoticeOk"></button></div></div>
 <button type="button" class="ml17-exit" id="ml17Exit" hidden>&#10005;</button>
 <section class="ml17-sheet" id="ml17Sheet" hidden><header><b id="ml17SheetTitle"></b><button type="button" id="ml17SheetClose" aria-label="Close">&#10005;</button></header><div class="ml17-body" id="ml17Body"></div></section>
 <div class="ml17-transport"><button type="button" class="ml17-play" id="ml17Play" aria-label="Play / Pause">&#9654;</button><input type="range" id="ml17Seek" min="0" max="1000" step="1" value="0" aria-label="Timeline"><span id="ml17Time">00:00</span></div>
 <nav class="ml17-tabs" id="ml17Tabs"><button type="button" data-tab="view"></button><button type="button" data-tab="led"></button><button type="button" data-tab="lights"></button><button type="button" data-tab="project"></button></nav>`;
 document.body.appendChild(root);

 const TABS={view:['Xem','View'],led:['LED','LED'],lights:['Đèn','Lights'],project:['Dự án','Project']};
 const fmt=t=>{t=Math.max(0,t||0);const m=Math.floor(t/60),s=Math.floor(t%60);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');};
 const clickDesktop=id=>{const b=$(id);if(b&&!b.disabled){b.click();return true;}window.toast?.(L('Chức năng này chưa sẵn sàng.','This action is not available.'));return false;};
 const setBodyClass=(cls,on)=>{if(document.body.classList.contains(cls)!==on)document.body.classList.toggle(cls,on);};
 // One undo step per slider gesture, like the desktop `change()` helper.
 const beginEdit=()=>{if(!ML.started){window.checkpoint?.();ML.started=true;}};

 function staticTexts(){
  for(const b of root.querySelectorAll('[data-tab]')){const k=b.dataset.tab;b.textContent=L(...TABS[k]);b.classList.toggle('active',ML.tab===k);b.hidden=review()&&k!=='view';}
  $('ml17NoticeText').textContent=review()
   ?L('Bạn đang xem bản duyệt 3D trên điện thoại. Mở trên máy tính để xem đầy đủ.','You are viewing the 3D review on a phone. Open on a computer for the full view.')
   :L('Bạn đang dùng bản rút gọn cho điện thoại. Mở trên máy tính để dùng đầy đủ: tạo LED, đặt đèn, biên đạo, LED Matrix, xuất file kỹ thuật.','You are using the phone edition. Open on a computer for everything: create LEDs, place lights, choreography, LED Matrix, technical exports.');
  $('ml17Copy').textContent=L('Sao chép link','Copy link');$('ml17NoticeOk').textContent=L('Đã hiểu','Got it');
  $('ml17Exit').title=L('Hiện thanh điều khiển','Show controls');
 }
 function pageLink(){try{if(window.top!==window&&window.top.location.origin===location.origin)return window.top.location.href;}catch(e){}return location.href;}
 async function copyLink(){const url=pageLink();try{await navigator.clipboard.writeText(url);window.toast?.(L('Đã sao chép link. Mở link này trên máy tính.','Link copied. Open it on a computer.'));}catch(e){window.prompt?.(L('Sao chép link này:','Copy this link:'),url);}}

 const row=(label,control)=>`<label class="ml17-row"><span>${label}</span>${control}</label>`;
 const range=(id,min,max,step,val)=>`<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">`;
 function renderView(){
  return `<div class="ml17-grid">${[['front','Trước','Front'],['iso','3/4','3/4'],['side','Bên','Side'],['top','Trên','Top']].map(([k,vi,en])=>`<button type="button" data-cam="${k}">${L(vi,en)}</button>`).join('')}</div>
  <div class="ml17-grid two"><button type="button" id="ml17Fit">${L('Toàn cảnh','Overview')}</button><button type="button" id="ml17Immersive">${L('Toàn màn hình','Full screen')}</button></div>
  <p class="ml17-hint">${L('1 ngón: xoay · 2 ngón: zoom / di chuyển.','1 finger: orbit · 2 fingers: zoom / pan.')}</p>`;
 }
 function renderLED(){
  const list=E.surfaces,s=list.find(x=>x.id===E.selected);
  const master=S.pro127?.boosts;
  let html=master?row(L('Độ sáng tổng LED','LED master brightness')+` <output id="ml17MasterOut">${Math.round(master.led*100)}%</output>`,range('ml17Master',.25,3,.05,master.led)):'';
  if(!list.length)return html+`<p class="ml17-hint">${L('Dự án chưa có màn LED. Tạo LED trên máy tính.','No LED screens yet. Create them on a computer.')}</p>`;
  html+=`<div class="ml17-chips">${list.map(x=>`<button type="button" data-led="${safe(x.id)}" class="${x.id===E.selected?'active':''}${x.enabled===false?' off':''}">${safe(x.name)}</button>`).join('')}</div>`;
  if(!s)return html+`<p class="ml17-hint">${L('Chọn một màn LED ở trên hoặc chạm vào màn LED trên sân khấu.','Pick a screen above or tap one on the stage.')}</p>`;
  const opts=[['motion',L('Motion tạo sẵn','Built-in motion')],['test',L('Test pattern','Test pattern')],...state.media.map(a=>[a.id,a.name])];
  html+=row(L('Nội dung','Content'),`<select id="ml17Source">${opts.map(([v,n])=>`<option value="${safe(v)}" ${s.source===v?'selected':''}>${safe(n)}</option>`).join('')}</select>`);
  html+=`<button type="button" class="ml17-wide" id="ml17AddMedia">+ ${L('Thêm video / ảnh từ máy','Add video / image from device')}</button>`;
  html+=row(L('Bật màn LED','Screen on'),`<input type="checkbox" id="ml17LedOn" ${s.enabled!==false?'checked':''}>`);
  html+=row(L('Độ sáng','Brightness')+` <output id="ml17BrightOut">${Math.round((s.brightness??1)*100)}%</output>`,range('ml17Bright',.1,2,.05,s.brightness??1));
  return html;
 }
 function renderLights(){
  const presets=[['concert','Concert','Concert'],['warm','Ấm','Warm'],['cool','Lạnh','Cool'],['blackout','Tắt hết','Blackout']];
  let html=`<div class="ml17-grid">${presets.map(([k,vi,en])=>`<button type="button" data-rig="${k}">${L(vi,en)}</button>`).join('')}</div>`;
  if(!E.lights.length)return html+`<p class="ml17-hint">${L('Dự án chưa có đèn. Đặt đèn trên máy tính.','No lights yet. Place them on a computer.')}</p>`;
  html+=E.lights.map((l,i)=>`<div class="ml17-light${l.enabled?'':' off'}" data-light="${i}"><input type="checkbox" data-k="enabled" ${l.enabled?'checked':''} aria-label="${L('Bật đèn','Light on')}"><b>${safe(l.name||L('Đèn','Light')+' '+(i+1))}</b><input type="color" data-k="color" value="${safe(l.color||'#ffffff')}" aria-label="${L('Màu','Color')}">${range('ml17Power'+i,0,12,.1,l.power??0).replace('<input','<input data-k="power" aria-label="'+L('Cường độ','Intensity')+'"')}</div>`).join('');
  return html;
 }
 function renderProject(){
  const name=$('projectName')?.textContent||'';
  const btn=(id,vi,en,cls='')=>`<button type="button" data-click="${id}" class="${cls}">${L(vi,en)}</button>`;
  return `<p class="ml17-project">${safe(name)}</p>
  <div class="ml17-grid two">${btn('loadProject','Mở file dự án','Open project file')}${btn('saveProject','Lưu file dự án','Save project file')}${btn('cloud16OpenBtn','Mở Cloud','Open Cloud')}${btn('cloud16SaveBtn','Lưu Cloud','Save Cloud')}${btn('cloud16ShareBtn','Link duyệt 3D','3D review link')}${btn('demoBtn','Sân khấu mẫu','Demo stage')}${btn('undoBtn','Hoàn tác','Undo')}${btn('redoBtn','Làm lại','Redo')}${btn('themeToggleBtn','Sáng / Tối','Light / Dark')}${btn('langToggleBtn16','English','Tiếng Việt')}</div>
  <div class="ml17-desk"><p>${L('Cần tạo LED, đặt đèn, biên đạo, LED Matrix hoặc xuất file kỹ thuật? Mở dự án trên máy tính.','Need to create LEDs, place lights, choreograph, edit LED Matrix or export technical files? Open the project on a computer.')}</p><button type="button" id="ml17CopyLink">${L('Sao chép link để mở trên máy tính','Copy link to open on a computer')}</button></div>`;
 }
 const RENDER={view:renderView,led:renderLED,lights:renderLights,project:renderProject};

 function renderSheet(){
  const sheet=$('ml17Sheet');staticTexts();
  if(!ML.tab||!ML.active){sheet.hidden=true;layoutStage();return;}
  sheet.hidden=false;$('ml17SheetTitle').textContent=L(...TABS[ML.tab]);$('ml17Body').innerHTML=RENDER[ML.tab]();ML.lastSel=E.selected;ML.lastKey=sceneKey();layoutStage();
 }
 // Shrink the 3D view to the area our bars and sheet leave free, so the stage stays centred and visible.
 function layoutStage(){
  const st=document.body.style,immersed=document.body.classList.contains('ml17-immersive');
  if(!ML.active||immersed){st.removeProperty('--ml17-bottom');st.removeProperty('--ml17-right');return;}
  const sheet=$('ml17Sheet'),bar=root.querySelector('.ml17-transport'),landscape=innerWidth>innerHeight;
  let bottom=innerHeight-bar.getBoundingClientRect().top,right=0;
  if(!sheet.hidden){const r=sheet.getBoundingClientRect();if(landscape)right=innerWidth-r.left;else bottom=innerHeight-r.top;}
  st.setProperty('--ml17-bottom',Math.max(0,Math.round(bottom))+'px');st.setProperty('--ml17-right',Math.max(0,Math.round(right))+'px');
 }
 addEventListener('resize',()=>requestAnimationFrame(layoutStage));
 const sceneKey=()=>E.surfaces.length+'|'+E.lights.length+'|'+state.media.length+'|'+(state.history?.length||0)+'|'+($('projectName')?.textContent||'');
 function openTab(tab){ML.tab=ML.tab===tab?null:tab;renderSheet();}

 // Re-render after outside changes (tap-select on the stage, undo, project load) but never while a slider is held.
 function refresh(){if(!ML.active||!ML.tab||ML.held)return;if(E.selected!==ML.lastSel||sceneKey()!==ML.lastKey)renderSheet();}
 const prevUI=window.renderUI;
 if(typeof prevUI==='function'){window.renderUI=function(...a){const out=prevUI.apply(this,a);requestAnimationFrame(refresh);return out;};S.renderUI=(...a)=>window.renderUI(...a);}

 root.addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t||!root.contains(t))return;
  if(t.dataset.tab)return openTab(t.dataset.tab);
  if(t.id==='ml17SheetClose'){ML.tab=null;return renderSheet();}
  if(t.id==='ml17Play')return S.setPlaying?.(!state.playing);
  if(t.id==='ml17NoticeOk'){try{localStorage.setItem(NOTICE_KEY,'1');}catch(err){}$('ml17Notice').hidden=true;return;}
  if(t.id==='ml17Copy'||t.id==='ml17CopyLink')return copyLink();
  if(t.dataset.cam){const b=document.querySelector(`#cameraBar [data-camera="${t.dataset.cam}"]`);if(b)b.click();else E.cameraPreset?.(t.dataset.cam);return;}
  if(t.id==='ml17Fit')return clickDesktop('overviewBtn');
  if(t.id==='ml17Immersive')return immersive(true);
  if(t.id==='ml17Exit')return immersive(false);
  if(t.dataset.led!==undefined){S.selectSurface?.(t.dataset.led);return renderSheet();}
  if(t.id==='ml17AddMedia')return $('mediaInput')?.click();
  if(t.dataset.rig){S.rigPreset?.(t.dataset.rig);return renderSheet();}
  if(t.dataset.click){clickDesktop(t.dataset.click);if(['undoBtn','redoBtn','themeToggleBtn','langToggleBtn16'].includes(t.dataset.click))requestAnimationFrame(renderSheet);}
 });
 root.addEventListener('pointerdown',e=>{if(e.target.matches('input[type=range]')){ML.held=true;ML.started=false;}});
 window.addEventListener('pointerup',()=>{if(ML.held){ML.held=false;requestAnimationFrame(refresh);}});
 window.addEventListener('pointercancel',()=>{ML.held=false;});
 root.addEventListener('input',e=>{
  const el=e.target,s=E.surfaces.find(x=>x.id===E.selected);
  if(el.id==='ml17Seek'){S.seekTimeline?.(el.value/1000*(state.duration||1));return;}
  if(el.id==='ml17Master'&&S.pro127){beginEdit();S.pro127.boosts.led=+el.value;$('ml17MasterOut').textContent=Math.round(el.value*100)+'%';return;}
  if(el.id==='ml17Bright'&&s){beginEdit();s.brightness=+el.value;$('ml17BrightOut').textContent=Math.round(el.value*100)+'%';return;}
  const box=el.closest('[data-light]');
  if(box){const l=E.lights[+box.dataset.light];if(!l)return;if(el.dataset.k==='power'){beginEdit();l.power=+el.value;}else if(el.dataset.k==='color'){beginEdit();l.color=el.value;}}
 });
 root.addEventListener('change',e=>{
  const el=e.target,s=E.surfaces.find(x=>x.id===E.selected);ML.started=false;
  if(el.id==='ml17Source'&&s){window.checkpoint?.();if(typeof window.setSource==='function')window.setSource(s,el.value);else s.source=el.value;window.renderUI?.();return;}
  if(el.id==='ml17LedOn'&&s){window.checkpoint?.();s.enabled=el.checked;window.renderUI?.();return;}
  const box=el.closest('[data-light]');
  if(box&&el.dataset.k==='enabled'){const l=E.lights[+box.dataset.light];if(l){window.checkpoint?.();l.enabled=el.checked;box.classList.toggle('off',!el.checked);}}
 });

 function immersive(on){
  setBodyClass('ml17-immersive',on);$('ml17Exit').hidden=!on;layoutStage();
  const d=document,el=d.documentElement;
  try{if(on&&!d.fullscreenElement&&el.requestFullscreen)el.requestFullscreen().catch(()=>{});else if(!on&&d.fullscreenElement)d.exitFullscreen?.();}catch(e){}
  dispatchEvent(new Event('resize'));
 }
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('ml17-immersive'))immersive(false);});

 let lastTick=0;
 function tick(now){
  requestAnimationFrame(tick);if(!ML.active||now-lastTick<100)return;lastTick=now;
  const dur=state.duration||1,seek=$('ml17Seek');
  if(!ML.held||document.activeElement!==seek)seek.value=Math.round(state.time/dur*1000);
  $('ml17Time').textContent=fmt(state.time)+' / '+fmt(dur);
  const play=$('ml17Play');play.innerHTML=state.playing?'&#10074;&#10074;':'&#9654;';play.classList.toggle('active',!!state.playing);
  for(const b of root.querySelectorAll('[data-tab]'))b.hidden=review()&&b.dataset.tab!=='view';
  if(review()&&ML.tab&&ML.tab!=='view'){ML.tab=null;renderSheet();}
  // Saved cameras are framed for wide desktop screens: re-frame once a newly opened project settles.
  const name=$('projectName')?.textContent;
  if(name!==ML.project){if(ML.project!==undefined)ML.fitAt=now+800;ML.project=name;}
  if(ML.fitAt&&now>ML.fitAt&&$('busy')?.classList.contains('hidden')){ML.fitAt=0;$('overviewBtn')?.click();}
 }

 function apply(){
  const on=query==='1'?true:query==='0'?false:mq.matches;
  if(on===ML.active)return;ML.active=on;root.hidden=!on;setBodyClass('mobile-lite',on);
  if(on){
   if(S.director)S.director.mode='navigate';E.view='stage';
   let seen=false;try{seen=localStorage.getItem(NOTICE_KEY)==='1';}catch(e){}
   $('ml17Notice').hidden=seen;
  }else{ML.tab=null;immersive(false);layoutStage();}
  renderSheet();dispatchEvent(new Event('resize'));
 }
 mq.addEventListener?.('change',apply);
 // Language can change from the toolbar or the host page; only our own nodes are rewritten.
 new MutationObserver(()=>{if(ML.active&&!ML.held)renderSheet();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-locale']});
 apply();requestAnimationFrame(tick);
}catch(err){console.error('[mobile17]',err);}
})();
