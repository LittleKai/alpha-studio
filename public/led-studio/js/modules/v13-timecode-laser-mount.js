/* V13.4 — Show timecode console. No changes to WebGL shaders, mapping, fixture code, or renderer. */
(function(){
 'use strict';
 const S=window.STUDIO;
 if(!S || typeof state==='undefined' || typeof seq==='undefined' || typeof seekTimeline!=='function')return;
 try {
 const by=id=>document.getElementById(id), body=document.body;
 const TC={version:1,open:false,zoom:38,fps:[24,25,30,50,60].includes(lighting9?.frameRate)?lighting9.frameRate:30,offsetFrames:0,snap:'frame',follow:true,preRoll:0,source:'internal',showBeats:true,showScene:true,record:false,selected:null,tab:'tracks',activeDrag:null,lastT:-999,lastSignature:'',lastRefresh:0};
 const CL={visual:'#238ab1',light:'#c49a50',audio:'#7ba1cb',act:'#45a991',scene:'#9a75c7',vj:'#b65f9a',camera:'#cf8f58',lift:'#74a58b',marker:'#d1c375',other:'#5d89a0'};
 const esc134=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cap=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a));
 const fmt=s=>{const x=Math.max(0,Math.floor((s||0)*1000));return String(Math.floor(x/60000)).padStart(2,'0')+':'+String(Math.floor(x%60000/1000)).padStart(2,'0')+'.'+String(x%1000).padStart(3,'0');};
 const snap=t=>TC.snap==='frame'?Math.round(t*TC.fps)/TC.fps:TC.snap==='beat'?Math.round((t-seq.offset)*seq.bpm/60)*60/seq.bpm+seq.offset:TC.snap==='second'?Math.round(t):t;
 const offsetSeconds=()=>TC.offsetFrames/TC.fps;
 function smpte(t){const fps=TC.fps,fr=Math.max(0,Math.round((t||0)*fps)+TC.offsetFrames);return [Math.floor(fr/(fps*3600)),Math.floor(fr/(fps*60))%60,Math.floor(fr/fps)%60,fr%fps].map(n=>String(n).padStart(2,'0')).join(':');}
 function parseSmpte(v){const a=String(v||'').trim().split(':').map(Number);if(a.length!==4||a.some(x=>!Number.isInteger(x)||x<0)||a[1]>=60||a[2]>=60||a[3]>=TC.fps)return null;return ((a[0]*3600+a[1]*60+a[2])*TC.fps+a[3]);}
 function colorFor(t){return CL[t]||CL.other;}
 function tagFor(tr){const x=tr.type||'other';return ({visual:'LED',light:'LX',audio:'AUD',act:'ACT',camera:'CAM',vj:'VJ',lift:'LIFT'})[x]||x.toUpperCase();}
 function cueData(){
  const lanes=[];
  if(TC.showScene && stage10?.scenes?.length)lanes.push({id:'tcScene',name:'SCENES / RUN OF SHOW',type:'scene',clips:stage10.scenes.map(s=>({id:s.id,sourceId:s.id,name:s.name||'Scene',start:+s.start||0,duration:+s.duration||1,color:s.color||CL.scene,virtual:true}))});
  for(const tr of seq.tracks){const clips=seq.clips.filter(c=>c.track===tr.id).map(c=>({id:c.id,sourceId:c.id,name:c.name||String(c.source||tr.type),start:c.start||0,duration:c.duration||.25,color:c.color||colorFor(tr.type),virtual:false,c}));if(clips.length||['visual','light','audio'].includes(tr.type))lanes.push({id:tr.id,name:tr.name||tr.type.toUpperCase(),type:tr.type||'other',muted:!!tr.muted,clips});}
  if(seq.markers?.length)lanes.push({id:'tcMarkers',name:'MARKER / GO',type:'marker',clips:seq.markers.map(m=>({id:m.id,sourceId:m.id,name:m.name||'Marker',start:m.time,duration:.14,virtual:true,color:CL.marker}))});
  return lanes;
 }
 function events(){const arr=[];for(const lane of cueData()){if(lane.muted)continue;for(const c of lane.clips){arr.push({t:cap(c.start,0,1e6),name:c.name,kind:lane.type,id:c.id,source:lane.name});}}arr.sort((a,b)=>a.t-b.t||a.name.localeCompare(b.name));return arr;}
 function upcoming(now=state.time){return events().filter(e=>e.t>now+.025).slice(0,8);}
 function sourceStatus(){return TC.source==='media'?'MEDIA / APP PLAYBACK':'INTERNAL / APP CLOCK';}
 function setTime(t){seekTimeline(cap(t,0,state.duration));renderClock();}
 function setTracksOn(v){enableSequence(!!v);updateButtons();}
 function mark(name){const stamp=cap(state.time,0,state.duration),item={id:'tc134_'+Math.random().toString(36).slice(2,10),time:snap(stamp),name:name||'MARK '+String(seq.markers.length+1)};seq.markers.push(item);renderSequence();renderTracks();return item;}
 function go(){const next=upcoming(state.time)[0];if(TC.record){mark('REC GO '+(next?.name||''));flashStatus('REC / ĐÃ GHI MỐC GO');return;}if(!next){flashStatus('Đã đến cuối danh sách cue');return;}const lead=cap(TC.preRoll,0,10);setTime(Math.max(0,next.t-lead));if(!seq.enabled)setTracksOn(true);setPlaying(true);flashStatus('GO: '+next.name+(lead?' / pre-roll '+lead+'s':''));}
 function goPrev(){const a=events().filter(e=>e.t<state.time-.08);if(!a.length){setTime(0);return;}setTime(a[a.length-1].t);}
 function flashStatus(v){const e=by('tc134Notice');if(e)e.textContent=v;}
 const root=document.createElement('section');root.id='tc134Panel';root.hidden=true;
 root.setAttribute('aria-label','Timecode show console');
 root.innerHTML=`<div class="tc134-head"><div class="tc134-brand">ALPHA / TC<small>SHOW PLAYBACK</small></div><div class="tc134-clock" id="tc134Clock">00:00:00:00</div><div class="tc134-status"><b id="tc134ClockStatus">INTERNAL</b><span id="tc134SourceStatus">30 FPS · TRACKS OFF</span></div><div class="tc134-tools"><button id="tc134Play" title="Phát / Tạm dừng">▶ PLAY</button><button id="tc134Stop" title="Dừng tại đầu show">■ STOP</button><button id="tc134Prev" title="Cue trước">◀ PREV</button><button id="tc134Go" title="Gọi cue kế tiếp">GO ▶</button><button id="tc134Record" title="REC: ghi các cú bấm GO thành marker">● REC</button><button id="tc134Mark" title="Marker tại playhead">◆ MARK</button><button id="tc134Step" title="Tiến 1 frame">+ 1F</button><button id="tc134Enabled">SHOW ON</button><button id="tc134Gear">⚙ CÀI ĐẶT</button><button id="tc134Exit">×</button></div></div>
 <div class="tc134-main"><div class="tc134-track-wrap"><div class="tc134-track-toolbar"><label>SNAP <select id="tc134SnapInline"><option value="frame">FRAME</option><option value="beat">BEAT</option><option value="second">SECOND</option><option value="off">OFF</option></select></label><label>ZOOM <input id="tc134Zoom" type="range" min="15" max="100" value="38"></label><button id="tc134AddCue">+ CUE</button><button id="tc134AddMark">+ MARKER</button><small id="tc134Notice">SHOW TIME / theo timeline đang có</small></div><div class="tc134-scroll" id="tc134Scroll"><div class="tc134-time-content" id="tc134Content"></div></div></div><aside class="tc134-next"><div class="tc134-next-head">NEXT / STANDBY CUE</div><div class="tc134-next-main"><small>TIẾT MỤC / CUE TIẾP THEO</small><strong id="tc134NextName">—</strong><div class="tc134-next-count" id="tc134NextCount">--:--</div></div><div class="tc134-cue-list" id="tc134CueList"></div></aside></div>
 <div class="tc134-bottom"><span id="tc134Frame">FPS 30 · SNAP FRAME</span><span id="tc134Selected">Chọn clip để kéo / cắt</span><span class="tc134-spacer"></span><span>● <strong>INTERNAL TIMECODE</strong> · preview (chưa xuất LTC/MTC/DMX)</span></div>`;
 document.body.appendChild(root);
 const setDialog=document.createElement('div');setDialog.id='tc134Settings';setDialog.hidden=true;document.body.appendChild(setDialog);
 function settingsMarkup(){return `<div class="tc134-settings-card"><div class="tc134-settings-head"><div><h3>⚙ Cài đặt Timecode Show</h3><p>Điều khiển chung Visual LED · Đèn · Audio · Biên đạo · Camera · VJ</p></div><button id="tc134SettingsClose" aria-label="Đóng cài đặt">×</button></div><div class="tc134-settings-grid">
 <label>Frame rate SMPTE<select id="tc134SFps">${[24,25,30,50,60].map(n=>`<option value="${n}" ${TC.fps===n?'selected':''}>${n} FPS (non-drop)</option>`).join('')}</select></label>
 <label>Timecode bắt đầu (HH:MM:SS:FF)<input type="text" id="tc134SOffset" inputmode="numeric" value="${smpte(0)}" placeholder="00:00:00:00"></label>
 <label>Nguồn đồng hồ<select id="tc134SSource"><option value="internal" ${TC.source==='internal'?'selected':''}>Internal / Timeline app</option><option value="media" ${TC.source==='media'?'selected':''}>Media / Đồng hồ playback hiện có</option></select></label>
 <label>Snap clip và mốc<select id="tc134SSnap"><option value="frame">Theo frame</option><option value="beat">Theo nhịp BPM</option><option value="second">Theo giây</option><option value="off">Không bắt dính</option></select></label>
 <label>Lead-in trước GO<select id="tc134SPreroll">${[0,1,2,3,5,10].map(n=>`<option value="${n}" ${TC.preRoll===n?'selected':''}>${n} giây</option>`).join('')}</select></label>
 <label>Độ phóng đại timeline<input type="range" min="15" max="100" id="tc134SZoom" value="${TC.zoom}"></label>
 <label><input type="checkbox" id="tc134SFollow" ${TC.follow?'checked':''}> Auto-follow playhead khi diễn</label>
 <label><input type="checkbox" id="tc134SBeats" ${TC.showBeats?'checked':''}> Hiển thị lưới beat / BPM</label>
 <label><input type="checkbox" id="tc134SScenes" ${TC.showScene?'checked':''}> Hiển thị hàng Scene / Run of show</label>
 <label><input type="checkbox" id="tc134SLoop" ${state.loop?'checked':''}> Lặp show tại cuối timeline</label></div>
 <div class="tc134-settings-info"><b>Đồng bộ hiện có:</b> mọi cue dùng cùng <b>state.time</b> của ứng dụng và SHOW Timeline hiện tại. Nguồn “Media” sử dụng cơ chế đồng hồ playback đã tích hợp, không đọc tín hiệu ngoài. <b>LTC, MTC, Art-Net Timecode và thiết bị DMX chưa được kết nối trong bản HTML offline.</b></div>
 <div class="tc134-settings-actions"><button id="tc134Defaults">Khôi phục mặc định</button><button id="tc134Save" class="primary">Áp dụng & lưu cài đặt</button></div></div>`;}
 function openSettings(){setDialog.innerHTML=settingsMarkup();setDialog.hidden=false;by('tc134SSnap').value=TC.snap;
   by('tc134SettingsClose').onclick=()=>setDialog.hidden=true;
   by('tc134Defaults').onclick=()=>{TC.fps=30;TC.offsetFrames=0;TC.snap='frame';TC.follow=true;TC.preRoll=0;TC.source='internal';TC.showBeats=true;TC.showScene=true;TC.zoom=38;openSettings();};
   by('tc134SFps').onchange=()=>{const oldF=TC.fps;TC.fps=+by('tc134SFps').value;TC.offsetFrames=Math.round(TC.offsetFrames/oldF*TC.fps);by('tc134SOffset').value=smpte(0);};
   by('tc134Save').onclick=()=>{
     const f=+by('tc134SFps').value;TC.fps=f;
     const off=parseSmpte(by('tc134SOffset').value);
     if(off===null){by('tc134SOffset').style.borderColor='#df6d79';flashStatus('Timecode offset không hợp lệ');return;}
     TC.offsetFrames=off;TC.snap=by('tc134SSnap').value;TC.source=by('tc134SSource').value;TC.preRoll=+by('tc134SPreroll').value;TC.zoom=+by('tc134SZoom').value;TC.follow=by('tc134SFollow').checked;TC.showBeats=by('tc134SBeats').checked;TC.showScene=by('tc134SScenes').checked;state.loop=by('tc134SLoop').checked;
     if(typeof lighting9!=='undefined'){lighting9.frameRate=TC.fps;lighting9.timecodeOffset=offsetSeconds();}
     by('tc134SnapInline').value=TC.snap;by('tc134Zoom').value=TC.zoom;setDialog.hidden=true;renderTracks();renderClock();flashStatus('Đã áp dụng cài đặt Timecode');
     try{renderUI();}catch(_){}
   };
 }
 setDialog.addEventListener('pointerdown',e=>{if(e.target===setDialog)setDialog.hidden=true;});
 function insertButtons(){const pc=by('presentControls')?.querySelector('.show-row');if(pc&&!by('tc134ShowBtn')){const b=document.createElement('button');b.id='tc134ShowBtn';b.className='btn small';b.textContent='⏱ TIME CODE';b.onclick=()=>toggle();const a=by('showAudio');if(a?.parentNode===pc)pc.insertBefore(b,a);else pc.prepend(b);const st=document.createElement('button');st.id='tc134ShowSettings';st.className='btn small';st.textContent='⚙ TC';st.onclick=openSettings;pc.insertBefore(st,b.nextSibling);}
  const nav=document.querySelector('.navigation-strip');if(nav&&!by('tc134EditBtn')){const b=document.createElement('button');b.className='btn small';b.id='tc134EditBtn';b.textContent='⏱ Timecode';b.title='Mở Timecode ở chế độ Trình diễn';b.onclick=()=>{if(!state.presenting)togglePresentation();toggle(true);};const s=document.createElement('button');s.className='btn small';s.id='tc134EditSettings';s.textContent='⚙ TC';s.title='Cài đặt Timecode';s.onclick=openSettings;const anchor=by('focusBtn');nav.insertBefore(b,anchor||null);nav.insertBefore(s,anchor||null);}
 }
 function toggle(value=!TC.open){if(value && !state.presenting)togglePresentation();TC.open=!!value&&!!state.presenting;
  if(TC.open){try{S.vj130?.open(null);}catch(_){};try{S.manual131?.close();}catch(_){};}
  body.classList.toggle('tc134-show-open',TC.open);root.hidden=!TC.open;by('tc134ShowBtn')?.classList.toggle('active',TC.open);
  if(TC.open){renderTracks();renderClock();}else{TC.activeDrag=null;}
 }
 function updateButtons(){by('tc134Play').textContent=state.playing?'❚❚ PAUSE':'▶ PLAY';by('tc134Record').classList.toggle('active',TC.record);by('tc134Enabled').textContent=seq.enabled?'TRACKS ON':'TRACKS OFF';by('tc134Enabled').classList.toggle('active',seq.enabled);}
 const scroll=by('tc134Scroll'),content=by('tc134Content');
 function renderTracks(){if(!TC.open)return;
  const lanes=cueData(),duration=cap(state.duration,.1,3600),W=Math.max(400,Math.ceil(duration*TC.zoom)),total=138+W;
  content.style.width=total+'px';content.style.minHeight=(29+Math.max(1,lanes.length)*37)+'px';
  const every=Math.max(1,Math.ceil(48/TC.zoom)),bars=[];for(let t=0;t<=duration;t+=every){bars.push(`<span class="tc134-ruler-mark" style="left:${138+t*TC.zoom}px">${fmt(t).slice(0,5)}</span>`);}
  const beat=60/Math.max(1,seq.bpm||120);let beatBg='';if(TC.showBeats&&beat*TC.zoom>=14){beatBg=`background-image:repeating-linear-gradient(to right,transparent 0px, transparent ${Math.max(1,beat*TC.zoom-1)}px,#2851666a ${beat*TC.zoom}px);`}
  let html=`<div class="tc134-ruler" id="tc134Ruler" style="width:${total}px">${bars.join('')}</div>`;
  for(const lane of lanes){html+=`<div class="tc134-row" data-tc-lane="${esc134(lane.id)}" style="width:${total}px"><div class="tc134-lane-label" title="${esc134(lane.name)}"><i style="background:${colorFor(lane.type)}"></i><b>${esc134(lane.name)}</b></div><div class="tc134-lane-content" style="${beatBg}">`;
   for(const c of lane.clips){const left=cap(c.start,0,1e6)*TC.zoom,width=Math.max(5,cap(c.duration,.02,1e6)*TC.zoom),col=c.virtual?colorFor(lane.type):c.color;
    html+=`<div class="tc134-clip ${TC.selected===c.id?'selected':''}" data-tc-clip="${esc134(c.id)}" data-tc-virtual="${c.virtual?'1':'0'}" data-tc-lane="${esc134(lane.type)}" style="left:${left}px;width:${width}px;background:${esc134(col)}70;border-color:${esc134(col)}" title="${esc134(c.name)} • ${smpte(c.start)} • ${c.duration.toFixed(2)}s"><span>${esc134(c.name)}</span>${!c.virtual?'<div class="tc134-resize" title="Kéo mép để chỉnh thời lượng"></div>':''}</div>`;
   }html+='</div></div>';
  }
  html+='<div id="tc134Playhead" class="tc134-playhead" style="left:138px"></div>';content.innerHTML=html;
  by('tc134Ruler').onpointerdown=e=>{const r=by('tc134Ruler').getBoundingClientRect();setTime(cap((e.clientX-r.left-138)/TC.zoom,0,state.duration));};
  content.querySelectorAll('[data-tc-clip]').forEach(el=>{el.onpointerdown=e=>startDrag(e,el);el.ondblclick=e=>{e.stopPropagation();selectCue(el.dataset.tcClip,true);};el.onclick=()=>selectCue(el.dataset.tcClip);});
  updateButtons();renderClock();
 }
 function selectCue(id,edit=false){TC.selected=id;content.querySelectorAll('.tc134-clip').forEach(el=>el.classList.toggle('selected',el.dataset.tcClip===id));const ev=events().find(e=>e.id===id);by('tc134Selected').textContent=ev?ev.source+' / '+ev.name:'Chọn cue';if(edit&&ev)openCueEditor(id);}
 function findCue(id){const c=seq.clips.find(x=>x.id===id);if(c)return {c,virtual:false};const s=stage10.scenes.find(x=>x.id===id);if(s)return {c:s,virtual:true};const m=seq.markers.find(x=>x.id===id);if(m)return {c:m,virtual:true,marker:true};return null;}
 function startDrag(e,el){if(e.button!==0||!TC.open)return;
  const d=findCue(el.dataset.tcClip);if(!d)return;selectCue(d.c.id);if(d.virtual){if(d.marker){setTime(d.c.time);}else setTime(d.c.start);return;}
  e.preventDefault();const c=d.c,mode=e.target.classList.contains('tc134-resize')?'resize':'move',ox=e.clientX,original={start:c.start,duration:c.duration};
  const target=el;target.setPointerCapture?.(e.pointerId);TC.activeDrag=true;checkpoint();
  const onMove=ev=>{const dx=(ev.clientX-ox)/TC.zoom;if(mode==='move'){const start=cap(snap(original.start+dx),0,Math.max(0,state.duration-c.duration));c.start=start;target.style.left=start*TC.zoom+'px';}else{const duration=cap(snap(original.duration+dx),.05,Math.max(.05,state.duration-c.start));c.duration=duration;target.style.width=Math.max(5,duration*TC.zoom)+'px';}by('tc134Selected').textContent='Kéo: '+smpte(c.start)+' / '+c.duration.toFixed(2)+'s';};
  const onEnd=()=>{target.removeEventListener('pointermove',onMove);target.removeEventListener('pointerup',onEnd);target.removeEventListener('pointercancel',onEnd);TC.activeDrag=false;invalidateSeq();renderSequence();renderTracks();};
  target.addEventListener('pointermove',onMove);target.addEventListener('pointerup',onEnd,{once:true});target.addEventListener('pointercancel',onEnd,{once:true});
 }
 function openCueEditor(id){const x=findCue(id);if(!x||x.marker)return;const c=x.c;
  setDialog.innerHTML=`<div class="tc134-settings-card"><div class="tc134-settings-head"><div><h3>Chỉnh Cue / Timecode</h3><p>${esc134(c.name)} · ${esc134(id)}</p></div><button id="tc134CueClose">×</button></div><div class="tc134-settings-grid"><label>Tên<input id="tc134CName" value="${esc134(c.name)}"></label><label>Bắt đầu (giây)<input id="tc134CStart" type="number" min="0" max="${state.duration}" step=".01" value="${c.start.toFixed(2)}"></label><label>Thời lượng (giây)<input id="tc134CDur" type="number" min=".05" max="${state.duration}" step=".01" value="${c.duration.toFixed(2)}"></label></div><div class="tc134-settings-actions"><button id="tc134CueDelete">Xóa cue</button><button id="tc134CueSave" class="primary">Lưu cue</button></div></div>`;setDialog.hidden=false;
  by('tc134CueClose').onclick=()=>setDialog.hidden=true;
  by('tc134CueDelete').onclick=()=>{if(x.virtual)return;checkpoint();seq.clips=seq.clips.filter(v=>v.id!==id);setDialog.hidden=true;invalidateSeq();renderSequence();renderTracks();};
  by('tc134CueSave').onclick=()=>{checkpoint();c.name=by('tc134CName').value.trim()||c.name;c.start=cap(+by('tc134CStart').value,0,state.duration-.05);c.duration=cap(+by('tc134CDur').value,.05,state.duration-c.start);setDialog.hidden=true;invalidateSeq();renderSequence();renderTracks();};
 }
 function addQuickCue(){const kinds=[['visual','Visual LED'],['light','Light FX'],['audio','Audio'],['marker','Marker']];setDialog.innerHTML=`<div class="tc134-settings-card"><div class="tc134-settings-head"><div><h3>Thêm Cue vào SHOW Timeline</h3><p>Chọn bộ phận, thời điểm và độ dài</p></div><button id="tc134QuickClose">×</button></div><div class="tc134-settings-grid"><label>Track<select id="tc134QuickType">${kinds.map(([a,b])=>`<option value="${a}">${b}</option>`).join('')}</select></label><label>Tên cue<input id="tc134QuickName" value="Cue ${seq.clips.length+1}"></label><label>Giây bắt đầu<input id="tc134QuickStart" type="number" min="0" max="${state.duration}" step=".01" value="${state.time.toFixed(2)}"></label><label>Thời lượng<input id="tc134QuickDur" type="number" min=".1" step=".1" value="2"></label></div><div class="tc134-settings-actions"><button id="tc134QuickSave" class="primary">+ Đặt Cue</button></div></div>`;setDialog.hidden=false;
  by('tc134QuickClose').onclick=()=>setDialog.hidden=true;
  by('tc134QuickSave').onclick=()=>{try{const type=by('tc134QuickType').value,start=cap(snap(+by('tc134QuickStart').value),0,Math.max(0,state.duration-.1)),duration=cap(+by('tc134QuickDur').value,.1,Math.max(.1,state.duration-start)),name=by('tc134QuickName').value.trim();if(type==='marker'){seq.markers.push({id:'tc134_'+Math.random().toString(36).slice(2),time:start,name:name||'MARK'});}else{const tr=seq.tracks.find(t=>t.type===type&&!t.muted)||track10(type,'all',type.toUpperCase()+' / TIMECODE');const source=type==='visual'?'motion:0':type==='light'?'sweep':'music';addClip(tr.id,{name:name||'Cue',start,duration,source,fade:.1,loop:true});}setDialog.hidden=true;invalidateSeq();renderSequence();renderTracks();flashStatus('Đã thêm cue vào SHOW Timeline');}catch(err){flashStatus('Lỗi tạo cue: '+err.message);}};
 }
 function renderClock(){if(!TC.open)return;
  by('tc134Clock').textContent=smpte(state.time);
  by('tc134ClockStatus').textContent=state.playing?'● PLAYING':'■ PAUSED';
  by('tc134SourceStatus').textContent=TC.fps+' FPS · '+(seq.enabled?'TRACKS ON':'TRACKS OFF')+' · '+sourceStatus();
  by('tc134Frame').textContent='FPS '+TC.fps+' · SNAP '+TC.snap.toUpperCase()+' · BPM '+(seq.bpm||120);
  const ph=by('tc134Playhead');if(ph)ph.style.left=(138+state.time*TC.zoom)+'px';
  const next=upcoming(state.time),first=next[0];by('tc134NextName').textContent=first?.name||'KẾT THÚC SHOW';by('tc134NextCount').textContent=first?'-'+fmt(first.t-state.time).slice(0,8):'END';
  const cueList=by('tc134CueList'),key=next.map(x=>x.id+':'+x.t).join('|');
  if(key!==TC.lastSignature){TC.lastSignature=key;cueList.innerHTML=next.map(x=>`<div class="tc134-cue-item" data-tc-next="${esc134(x.id)}"><time>${smpte(x.t)}</time><span title="${esc134(x.name)}">${esc134(x.name)}</span><b>${tagFor({type:x.kind})}</b></div>`).join('')||'<div style="padding:10px;font-size:11px;color:#8ea7b7">Không còn cue tiếp theo</div>';cueList.querySelectorAll('[data-tc-next]').forEach(el=>el.onclick=()=>{const v=events().find(x=>x.id===el.dataset.tcNext);if(v)setTime(v.t);});}
  if(TC.follow&&state.playing&&scroll&&!TC.activeDrag){const left=138+state.time*TC.zoom-scroll.scrollLeft,max=scroll.clientWidth;
   if(left>max*.78||left<max*.18){scroll.scrollLeft=Math.max(0,138+state.time*TC.zoom-max*.35);}}
  updateButtons();
 }
 // Presentation-only controls. Do not alter the existing renderer's loop.
 let lastFrame=0;function animation(now){if(TC.open && now-lastFrame>90){lastFrame=now;renderClock();}requestAnimationFrame(animation);}requestAnimationFrame(animation);
 by('tc134Play').onclick=()=>setPlaying(!state.playing);
 by('tc134Stop').onclick=()=>{setPlaying(false);setTime(0);};
 by('tc134Go').onclick=go;by('tc134Prev').onclick=goPrev;
 by('tc134Record').onclick=()=>{TC.record=!TC.record;updateButtons();flashStatus(TC.record?'REC ARMED · GO để ghi marker':'REC OFF');};
 by('tc134Mark').onclick=()=>{mark();flashStatus('Đã đánh dấu tại '+smpte(state.time));};
 by('tc134Step').onclick=()=>{setPlaying(false);setTime(state.time+1/TC.fps);};
 by('tc134Enabled').onclick=()=>setTracksOn(!seq.enabled);
 by('tc134Gear').onclick=openSettings;by('tc134Exit').onclick=()=>toggle(false);
 by('tc134AddCue').onclick=addQuickCue;by('tc134AddMark').onclick=()=>mark();
 by('tc134SnapInline').onchange=e=>{TC.snap=e.target.value;renderClock();};
 by('tc134Zoom').oninput=e=>{TC.zoom=+e.target.value;renderTracks();};
 document.addEventListener('keydown',e=>{if(!TC.open||!state.presenting||setDialog.hidden===false)return;if(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key==='Enter'){e.preventDefault();go();}if(e.code==='Space'){e.preventDefault();setPlaying(!state.playing);}},true);
 document.addEventListener('click',e=>{const target=e.target instanceof Element?e.target:null;if(!target)return;if(target.closest('[data-v130-open],#showVJ,#vjToggle')){if(TC.open)toggle(false);}if(target.closest('#showExit,#exitPresent')&&TC.open)toggle(false);},true);
 const ob=new MutationObserver(()=>{if(!state.presenting&&TC.open)toggle(false);});ob.observe(body,{attributes:true,attributeFilter:['class']});
 // Persist only settings. All show clips and markers are stored by the existing .ledstudio system.
 const serialized=()=>({version:TC.version,zoom:TC.zoom,fps:TC.fps,offsetFrames:TC.offsetFrames,snap:TC.snap,follow:TC.follow,preRoll:TC.preRoll,source:TC.source,showBeats:TC.showBeats,showScene:TC.showScene});
 function restoreSettings(o){if(!o)return;TC.zoom=cap(o.zoom,15,100);TC.fps=[24,25,30,50,60].includes(o.fps)?o.fps:30;TC.offsetFrames=cap(o.offsetFrames,0,TC.fps*86400);TC.snap=['frame','beat','second','off'].includes(o.snap)?o.snap:'frame';TC.follow=o.follow!==false;TC.preRoll=cap(o.preRoll,0,10);TC.source=o.source==='media'?'media':'internal';TC.showBeats=o.showBeats!==false;TC.showScene=o.showScene!==false;lighting9.frameRate=TC.fps;lighting9.timecodeOffset=offsetSeconds();by('tc134SnapInline').value=TC.snap;by('tc134Zoom').value=TC.zoom;if(TC.open)renderTracks();}
 const prevPack=packLiveExtras,prevRestore=restoreLiveExtras,prevSnap=snapshot,prevRestoreSnap=restore;
 packLiveExtras=async function(){const d=await prevPack();d.tc134=serialized();return d;};
 restoreLiveExtras=async function(d){await prevRestore(d);restoreSettings(d?.tc134);};
 snapshot=function(){const d=prevSnap();d.tc134=serialized();return d;};
 restore=function(d){prevRestoreSnap(d);restoreSettings(d?.tc134);};
 // This module does not rebind existing UI handlers, modify the primary sequence renderer,
 // intercept GL draws, or mutate stage dimensions / surfaces.
 const origRenderSequence=renderSequence;
 renderSequence=function(...args){const res=origRenderSequence(...args);if(TC.open && !TC.activeDrag){queueMicrotask(()=>{if(TC.open&&!TC.activeDrag)renderTracks();});}return res;};
 insertButtons();
 new MutationObserver(insertButtons).observe(document.body,{childList:true,subtree:false});
 S.tc134={open:toggle,settings:openSettings,render:renderTracks,go,mark,get current(){return smpte(state.time)},get config(){return serialized()},restoreSettings};
 S.version='13.4.0';document.title='ALPHA | Creative LED Studio V13.4 - SHOW TIMECODE';
 const brand=document.querySelector('.brand small');if(brand)brand.textContent='V13.4 SHOW TIMECODE · V13.3 STABLE CORE';
 }catch(err){console.error('V13.4 Timecode init failed',err);}
})();

/* ALPHA Creative LED Studio V13.5 LASER SHOW. Additive Canvas2D stage overlay: no edits to core WebGL/UV/LED shader. */
(function(){
'use strict';
try{
const S=window.STUDIO;
if(!S || typeof engine==='undefined' || typeof seq==='undefined' || typeof state==='undefined')return;
const id=x=>document.getElementById(x), html=s=>String(s??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const clamp135=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+x)?+x:a)), radians=x=>x*Math.PI/180, lerp=(a,b,t)=>a+(b-a)*t;
const COLORS=['#00f3ff','#1d5dff','#ff266e','#fa255a','#ac59ff','#7cffc9','#bfefff'];
const PRESETS={
 blueFan:{name:'01 / CYAN BLUE FAN',colors:['#00f3ff','#1961ff'],count:7,angle:66},
 magentaCross:{name:'02 / RED CROSS GRID',colors:['#ff1977','#00d8ff'],count:11,angle:82},
 cyanGrid:{name:'03 / 45° CYAN GRID',colors:['#00ecff','#94e3ff'],count:9,angle:72},
 dualSweep:{name:'04 / DUAL COLOR SWEEP',colors:['#0044ff','#ff0033'],count:7,angle:58},
 blueTunnel:{name:'05 / BLUE GEOMETRIC TUNNEL',colors:['#29a5ff','#a14cff'],count:8,angle:44},
 waveFan:{name:'06 / WAVE FAN',colors:['#00d9ff','#9e3bff'],count:9,angle:75},
 diamond:{name:'07 / DIAMOND MATRIX',colors:['#9e27ff','#ff61b5'],count:8,angle:70},
 laserCurtain:{name:'08 / LASER CURTAIN',colors:['#09e3ff','#d3e9ff'],count:12,angle:84},
 spiral:{name:'09 / SPIRAL FLOW',colors:['#00f3ff','#ff2ba4'],count:8,angle:72},
 limePulse:{name:'10 / LIME STROBE HIT',colors:['#39ff14','#d9fffc'],count:7,angle:75},
 xFan:{name:'11 / CROSS FAN X',colors:['#3f72ff','#ff2b77'],count:9,angle:82},
 pinkStorm:{name:'12 / MAGENTA STORM',colors:['#ff1686','#8b50ff'],count:12,angle:90},
 heroBurst:{name:'13 / HERO SHOCKWAVE',colors:['#27dfff','#ff88ce'],count:11,angle:86},
 epic:{name:'14 / EPIC LASER SEQUENCE · 95s',colors:['#00f3ff','#ff0033'],count:9,angle:85}
};
const EXTRA_PRESETS={
 axisScan:{name:'15 / AXIS SCANNER',colors:['#00f4ff','#397bff'],count:3,angle:28},
 horizonSweep:{name:'16 / HORIZONTAL SWEEP',colors:['#00dfff','#b7fcff'],count:7,angle:75},
 verticalDrop:{name:'17 / VERTICAL DROP',colors:['#2dd9ff','#8a63ff'],count:9,angle:16},
 fanChase:{name:'18 / FAN CHASE',colors:['#f13d92','#43edff'],count:11,angle:90},
 mirroredFan:{name:'19 / MIRRORED FANS',colors:['#377dff','#f2388d'],count:9,angle:90},
 tunnelPulse:{name:'20 / TUNNEL PULSE',colors:['#00eaff','#7239ff'],count:10,angle:54},
 gridSweep:{name:'21 / GRID SWEEP 45°',colors:['#00ffff','#bcf3ff'],count:9,angle:80},
 colorRipple:{name:'22 / COLOR RIPPLE',colors:['#ff2e7f','#00efff'],count:12,angle:77},
 beatFan:{name:'23 / BEAT FAN HIT',colors:['#b2faff','#8c56ff'],count:9,angle:70},
 limeHit:{name:'24 / LIME GREEN PULSE',colors:['#39ff14','#ddffae'],count:7,angle:77},
 diagonalX:{name:'25 / DIAGONAL CROSS X',colors:['#ff146c','#2bdcff'],count:11,angle:80},
 sideCurtain:{name:'26 / SIDE DROP CURTAIN',colors:['#3b9bff','#a854ff'],count:13,angle:60},
 rainbowSweep:{name:'27 / RGB SPECTRUM SWEEP',colors:['#00eaff','#ff3a8a'],count:11,angle:76},
 colorChase:{name:'28 / COLOR CHASE',colors:['#0044ff','#ff0033'],count:11,angle:85},
 waterfall:{name:'29 / LASER WATERFALL',colors:['#76f8ff','#327aff'],count:12,angle:46},
 spiralTunnel:{name:'30 / SPIRAL TUNNEL',colors:['#9d00ff','#00edff'],count:12,angle:70},
 scanMatrix:{name:'31 / SCAN MATRIX',colors:['#48d8ff','#ff39b7'],count:12,angle:92},
 converge:{name:'32 / FOCAL CONVERGENCE',colors:['#22e6ff','#ffffff'],count:9,angle:82},
 strobePulse:{name:'33 / BEAT STROBE (ARM)',colors:['#fafffc','#39ff14'],count:11,angle:88},
 finaleRing:{name:'34 / FINALE RING',colors:['#a15bff','#66dfff'],count:10,angle:82},
 zigzag:{name:'35 / ZIGZAG PHASER',colors:['#ff2875','#26f0ff'],count:10,angle:80},
 shockGrid:{name:'36 / SHOCK GRID',colors:['#ff30bd','#2cf7ff'],count:12,angle:92},
 laserHalo:{name:'37 / HALO SWIRL',colors:['#7a6cff','#00fdde'],count:10,angle:77},
 epicDrop:{name:'38 / DROP & OUTRO',colors:['#ff1464','#00eeff'],count:12,angle:91},
 geoCircle:{name:'39 / ORBIT CIRCLE',colors:['#5ce8ff','#7568ff'],count:12,angle:82},
 geoTriangle:{name:'40 / TRIANGLE SCAN',colors:['#6ff8ff','#ff5aa8'],count:12,angle:84},
 geoShapes:{name:'41 / GEO MORPH',colors:['#8efbff','#bb69ff'],count:14,angle:88},
 flashSweep:{name:'42 / FLASH SWEEP',colors:['#effdff','#35f7ff'],count:12,angle:90},
 climaxBurst:{name:'43 / CLIMAX BURST',colors:['#ff4f8f','#67f7ff'],count:16,angle:96},
 geoSquare:{name:'44 / SQUARE PORTAL',colors:['#35e6ff','#845dff'],count:12,angle:82},
 geoHex:{name:'45 / HEXAGON FRAME',colors:['#a087ff','#45e7ff'],count:12,angle:80},
 geoStar:{name:'46 / FIVE-POINT STAR',colors:['#ff66c9','#e9f7ff'],count:12,angle:86},
 geoDiamond:{name:'47 / DIAMOND ROLL',colors:['#66ddff','#ff519b'],count:12,angle:79},
 ringCascade:{name:'48 / TRIPLE RING CASCADE',colors:['#00eaff','#b561ff'],count:12,angle:90},
 triangleEcho:{name:'49 / TRIANGLE ECHO',colors:['#ee4fc8','#65faff'],count:12,angle:89},
 squareRoll:{name:'50 / ROTATING SQUARE',colors:['#39ddff','#ff6fc9'],count:12,angle:85},
 geoTunnel:{name:'51 / GEOMETRIC TUNNEL',colors:['#3cddff','#735dff'],count:12,angle:88},
 beatGate:{name:'52 / BEAT GATE CHASE',colors:['#30e9ff','#e05bff'],count:11,angle:85},
 blackoutHit:{name:'53 / DROP / BLACKOUT HIT',colors:['#95e9ff','#f0d9ff'],count:12,angle:84},
 ildaShow:{name:'54 / ILDA BINARY SHOW (.ILD)',colors:['#61e8ff','#8b7dff'],count:8,angle:78}
};
const MAX_ILDA_FILE_BYTES=32*1024*1024,MAX_ILDA_POINTS=2000000,MAX_STEPS_PER_TICK=2500,TRAIL_POINTS=2048;
const ILDA_FORMAT_SIZE={0:8,1:6,2:3,4:10,5:8},ILDA_HEADER_BYTES=32;
function buildDefaultIldaPalette(){
 const p=[];for(let i=0;i<16;i++)p.push([255,i*16,0]);
 p.push([255,255,0]);for(let i=7;i>0;i--)p.push([i*32,255,0]);
 p.push([0,255,0]);for(const v of [36,73,109,146,182,219,255])p.push([0,255,v]);
 for(const v of [227,198,170,142,113,85,56,28,0])p.push([0,v,255]);
 for(const v of [32,64,96,128,160,192,224,255])p.push([v,0,255]);
 for(const v of [32,64,96,128,160,192,224,255])p.push([255,v,255]);
 for(const v of [224,192,160,128,96,64,32])p.push([255,v,v]);
 return p;
}
const ILDA_DEFAULT_PALETTE=Object.freeze(buildDefaultIldaPalette().map(rgb=>Object.freeze(rgb)));
const SCANNER_DEFAULTS=Object.freeze({rate:8000,gain:0.51,dampening:0.39,blankingOffset:-3,lightDecay:0.95});
function parseILDA(buffer,fallbackPalette=ILDA_DEFAULT_PALETTE){
 const rawBuffer=buffer instanceof Uint8Array?buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength):buffer;
 if(!(rawBuffer instanceof ArrayBuffer))throw new Error('Expected a binary ILDA file.');
 if(rawBuffer.byteLength>MAX_ILDA_FILE_BYTES)throw new Error('ILDALoader supports files up to 32 MiB.');
 const v=new DataView(rawBuffer),text=new TextDecoder('ascii'),palettes=new Map(),tracks=new Map(),frames=[],sections=[];
 let offset=0,totalPoints=0,blanked=0,paletteFallbacks=0,eof=false;
 while(offset<v.byteLength){
  if(offset+ILDA_HEADER_BYTES>v.byteLength)throw new Error('Incomplete ILDA header at byte '+offset+'.');
  if(v.getUint32(offset,false)!==0x494c4441)throw new Error('Invalid ILDA signature at byte '+offset+'.');
  const format=v.getUint8(offset+7),size=ILDA_FORMAT_SIZE[format];
  if(!size)throw new Error('Unsupported ILDA format '+format+'. Supported formats: 0, 1, 2, 4 and 5.');
  const name=text.decode(new Uint8Array(rawBuffer,offset+8,8)).replace(/\0/g,'').trim();
  const company=text.decode(new Uint8Array(rawBuffer,offset+16,8)).replace(/\0/g,'').trim();
  const count=v.getUint16(offset+24,false),number=v.getUint16(offset+26,false),totalFrames=v.getUint16(offset+28,false),projector=v.getUint8(offset+30);
  offset+=ILDA_HEADER_BYTES;
  if(format!==2&&count===0){eof=true;break;}
  if(offset+count*size>v.byteLength)throw new Error('The ILDA file ends in the middle of a frame.');
  if(format===2){
   if(count>256||count===0)throw new Error('Invalid ILDA palette size.');
   const palette=[];for(let i=0;i<count;i++,offset+=3)palette.push([v.getUint8(offset),v.getUint8(offset+1),v.getUint8(offset+2)]);
   palettes.set(projector,palette);sections.push({format,name,company,frameNumber:number,totalFrames,projector,colors:palette});continue;
  }
  totalPoints+=count;if(totalPoints>MAX_ILDA_POINTS)throw new Error('ILDALoader supports up to 2,000,000 points.');
  const position=new Float32Array(count*3),color=new Float32Array(count*3),blank=new Uint8Array(count);
  const palette=palettes.get(projector)||fallbackPalette||ILDA_DEFAULT_PALETTE,is3D=format===0||format===4,indexed=format===0||format===1;
  for(let i=0;i<count;i++,offset+=size){
   const j=i*3,statusAt=offset+(is3D?6:4);
   position[j]=v.getInt16(offset,false)/32768;position[j+1]=v.getInt16(offset+2,false)/32768;position[j+2]=is3D?v.getInt16(offset+4,false)/32768:0;
   blank[i]=(v.getUint8(statusAt)&0x40)!==0?1:0;blanked+=blank[i];
   if(indexed){const rgb=palette[v.getUint8(statusAt+1)];if(!rgb)paletteFallbacks++;color[j]=(rgb?.[0]??255)/255;color[j+1]=(rgb?.[1]??255)/255;color[j+2]=(rgb?.[2]??255)/255;}
   else{color[j]=v.getUint8(statusAt+3)/255;color[j+1]=v.getUint8(statusAt+2)/255;color[j+2]=v.getUint8(statusAt+1)/255;}
  }
  const frame={number,name,company,projector,count,pointCount:count,position,positions:position,color,colors:color,blank,blanked:blank};
  frames.push(frame);sections.push({format,name,company,frameNumber:number,totalFrames,projector,pointCount:count});
  if(!tracks.has(projector))tracks.set(projector,[]);tracks.get(projector).push(frame);
 }
 if(!frames.length)throw new Error('The file contains no point frames.');
 return {sections,frames,tracks,totalPoints,blanked,paletteFallbacks,eof,bytes:rawBuffer.byteLength};
}
class LaserScanner{
 constructor(framesOrOpts=null,capacity=TRAIL_POINTS,extraOpts={}){
  let frames=null,params={...SCANNER_DEFAULTS,...(extraOpts||{})};
  if(Array.isArray(framesOrOpts))frames=framesOrOpts;
  else if(framesOrOpts&&typeof framesOrOpts==='object'){params={...params,...framesOrOpts};if(Array.isArray(framesOrOpts.frames))frames=framesOrOpts.frames;if(Number.isInteger(framesOrOpts.capacity)&&framesOrOpts.capacity>0)capacity=framesOrOpts.capacity;}
  const defPos=new Float32Array([-0.5,-0.5,0,0.5,-0.5,0,0.5,0.5,0,-0.5,0.5,0]),defCol=new Float32Array([0,0.95,1,0,0.95,1,0.55,0.49,1,0.55,0.49,1]),defBlk=new Uint8Array([0,0,0,1]);
  const norm=(frames!==null?frames:[{number:0,name:'DEFAULT',projector:0,count:4,pointCount:4,position:defPos,positions:defPos,color:defCol,colors:defCol,blank:defBlk,blanked:defBlk}]).map(f=>{
   const position=f.position||f.positions||defPos,color=f.color||f.colors||defCol,blank=f.blank||f.blanked||defBlk,count=f.count??f.pointCount??Math.floor(position.length/3);
   return {...f,count,pointCount:count,position,positions:position,color,colors:color,blank,blanked:blank};
  });
  if(!norm.length||norm.some(f=>!f.count))throw new Error('No points to scan.');
  this.frames=norm;this.capacity=capacity;this.params=params;this.starts=[];this.total=0;
  for(const f of this.frames){this.starts.push(this.total);this.total+=f.count;}
  this.position=new Float32Array(capacity*3);this.color=new Float32Array(capacity*3);this.blank=new Uint8Array(capacity);this.born=new Float64Array(capacity);
  this.output={position:new Float32Array(capacity*3),color:new Float32Array(capacity*3),blank:new Uint8Array(capacity),count:0};
  this.output.positions=this.output.position;this.output.colors=this.output.color;this.output.blanked=this.output.blank;
  this.reset();
 }
 reset(frame=0){this.frame=frame;this.index=0;this.lastFrame=frame;this.x=0;this.y=0;this.vx=0;this.vy=0;this.time=0;this.fraction=0;this.write=0;this.count=0;this.samples=0;this.output.count=0;}
 blankAtOffset(offset){let frame=this.frame,index=this.index+offset;while(index<0){frame=(frame+this.frames.length-1)%this.frames.length;index+=this.frames[frame].count;}while(index>=this.frames[frame].count){index-=this.frames[frame].count;frame=(frame+1)%this.frames.length;}return this.frames[frame].blank[index];}
 sample(params=this.params,born=this.time){
  const p={...this.params,...(params||{})},f=this.frames[this.frame],idx3=this.index*3;
  this.vx=(this.vx+(f.position[idx3]-this.x)*p.gain)*p.dampening;this.vy=(this.vy+(f.position[idx3+1]-this.y)*p.gain)*p.dampening;
  this.x+=this.vx;this.y+=this.vy;
  if(!Number.isFinite(this.x+this.y)||Math.abs(this.x)+Math.abs(this.y)>1e6){this.x=f.position[idx3];this.y=f.position[idx3+1];this.vx=0;this.vy=0;}
  const i=this.write,q=i*3,blank=this.blankAtOffset(Math.round(p.blankingOffset));
  this.position[q]=this.x;this.position[q+1]=this.y;this.position[q+2]=f.position[idx3+2]||0;
  this.color[q]=f.color[idx3];this.color[q+1]=f.color[idx3+1];this.color[q+2]=f.color[idx3+2];
  this.blank[i]=blank;this.born[i]=born;this.lastFrame=this.frame;
  this.write=(i+1)%this.capacity;this.count=Math.min(this.count+1,this.capacity);this.samples++;
  if(++this.index>=f.count){this.index=0;this.frame=(this.frame+1)%this.frames.length;}
 }
 advance(dt,params=this.params){
  const safeDt=Math.min(Math.max(Number(dt)||0,0),0.05);
  if(!(safeDt>0))return 0;
  const p={...this.params,...(params||{})},rate=Math.max(1,Number(p.rate)||8000);
  this.time+=safeDt;
  const requested=this.fraction+safeDt*rate,rawSteps=Math.floor(requested+1e-9),steps=Math.min(rawSteps,MAX_STEPS_PER_TICK);
  this.fraction=Math.max(0,requested-rawSteps);
  const first=this.time-(steps-1+this.fraction)/rate;
  for(let i=0;i<steps;i++)this.sample(p,first+i/rate);
  return steps;
 }
 snapshot(lightDecay=this.params.lightDecay){
  const out=this.output,start=(this.write-this.count+this.capacity)%this.capacity;
  for(let j=0;j<this.count;j++){
   const i=(start+j)%this.capacity,p=i*3,q=j*3,age=Math.max(0,this.time-this.born[i]);
   const decay=lightDecay===0?(age<1/60?1:0):Math.pow(lightDecay,age*60),fade=this.blank[i]?0:decay;
   out.position[q]=this.position[p];out.position[q+1]=this.position[p+1];out.position[q+2]=this.position[p+2];
   out.color[q]=this.color[p]*fade;out.color[q+1]=this.color[p+1]*fade;out.color[q+2]=this.color[p+2]*fade;
   out.blank[j]=this.blank[i];
  }
  out.count=this.count;return out;
 }
}

Object.assign(PRESETS,EXTRA_PRESETS);

const DEFAULT_SETTINGS={quality:'high',lineWidth:1.05,glow:1.05,haze:.70,maxBeams:88,fpsCap:60,audioReactive:true,strobeEnabled:false};
const L={fixtures:[],selected:null,preset:'blueFan',active:true,previewPlaying:false,previewStart:0,previewAt:0,tab:'fixture',open:false,placing:false,moveMode:false,drag:null,settings:{...DEFAULT_SETTINGS},liveTime:0,flashAt:0,buttonState:'idle',buttonStart:0,buttonHover:false,recording:null,lastFrame:0,lastUI:0,lastTiny:0,seqLast:null,showTime:0,forceLive:false};
L.ILDA_DEFAULT_PALETTE=ILDA_DEFAULT_PALETTE;L.parseILDA=parseILDA;L.LaserScanner=LaserScanner;L.ildaShows=[];L.activeIldaId=null;L.scanner=null;L.lastScannerTick=0;
S.laser135=L;
const ildaInput=document.createElement('input');ildaInput.type='file';ildaInput.id='laser135IldaInput';ildaInput.accept='.ild,.ilda';ildaInput.hidden=true;document.body.appendChild(ildaInput);
async function importIldaFile(file){
 if(!file)return null;
 const buf=await file.arrayBuffer();
 const asset=parseILDA(buf,ILDA_DEFAULT_PALETTE);
 if(asset.frames.length>MAX_ILDA_FRAMES)throw new Error('ILDA show vượt quá '+MAX_ILDA_FRAMES+' frames.');
 const showId='ilda_'+Math.random().toString(36).slice(2,9);
 const entry={id:showId,name:String(file.name||'show.ild').slice(0,120),frameCount:asset.frames.length,totalPoints:asset.totalPoints,frames:asset.frames};
 const nextShows=L.ildaShows.length>=MAX_ILDA_SHOWS?[...L.ildaShows.slice(-(MAX_ILDA_SHOWS-1)),entry]:[...L.ildaShows,entry];
 serializeIldaShows(nextShows);
 L.ildaShows=nextShows;L.activeIldaId=showId;L.scanner=new LaserScanner(asset.frames,TRAIL_POINTS,{rate:16000});L.lastScannerTick=performance.now();
 if(!L.fixtures.length)addArray(4);
 L.preset='ildaShow';L.active=true;L.forceLive=true;L.previewPlaying=true;refreshUI();
 toast('Đã nạp ILDA '+entry.name+' ('+entry.frameCount+' frames · '+entry.totalPoints+' điểm).');
 return entry;
}
L.importIldaFile=importIldaFile;
ildaInput.addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{await importIldaFile(f);}catch(err){toast('Lỗi đọc tệp .ild: '+(err?.message||err));}});
const drawCan=document.createElement('canvas');drawCan.id='laser135Overlay';drawCan.setAttribute('aria-label','Laser preview trên sân khấu 3D');
id('viewport')?.appendChild(drawCan);
const ctx=drawCan.getContext('2d',{alpha:true});
const panel=document.createElement('aside');panel.id='laser135Panel';panel.hidden=true;panel.setAttribute('aria-label','LASER SHOW / Điều khiển và timecode');document.body.appendChild(panel);
const selected=()=>L.fixtures.find(x=>x.id===L.selected)||L.fixtures[0]||null;
const uid135=()=>`LASER_${Math.random().toString(36).slice(2,8)}`;
const localCam=()=>{const c=engine.camera||{},p=engine.eye||[];return p?.length===3?p:[(c.target?.[0]||0)+Math.sin(c.yaw||0)*Math.cos(c.pitch||0)*(c.distance||12),(c.target?.[1]||0)+Math.sin(c.pitch||0)*(c.distance||12),(c.target?.[2]||0)+Math.cos(c.yaw||0)*Math.cos(c.pitch||0)*(c.distance||12)];};
function stageCenter(){const b=engine.stageBounds;return b?.center||[0,2,0];}
function defaultOrigin(i=0,n=1){if(S.mount136?.defaultPoint)return S.mount136.defaultPoint('laser',i,n);const b=engine.stageBounds,center=stageCenter(),width=clamp135(engine.size?.width||10,3,60),sx=(i-(n-1)/2)*Math.min(2.3,width/Math.max(3,n));return [center[0]+sx,b?.min?.[1]===undefined?0.3:b.min[1]+.18,center[2]+clamp135(engine.size?.depth||5,1,20)*.13];}
function defaultPan(pos){const eye=localCam();const dx=eye[0]-pos[0],dz=eye[2]-pos[2];return Math.atan2(dx,dz)*180/Math.PI;}
function addFixture(kind='fan',position){if(L.fixtures.length>=24){toast('Tối đa 24 laser preview để đảm bảo hiệu năng.');return null;}
 const raw=position||defaultOrigin(L.fixtures.length,Math.max(4,L.fixtures.length+1));const pos=S.mount136?.constrain?S.mount136.constrain(raw):raw;const i=L.fixtures.length;
 const f={id:uid135(),name:(kind==='scanner'?'LASER SCANNER':kind==='cluster'?'LASER CLUSTER':'LASER FAN')+' '+String(i+1).padStart(2,'0'),kind,pos:[...pos],pan:defaultPan(pos),tilt:28,roll:0,beamCount:kind==='cluster'?11:kind==='scanner'?3:7,fanAngle:kind==='cluster'?92:65,range:clamp135((engine.size?.width||12)*1.2,8,32),intensity:0.92,speed:1,colorA:kind==='cluster'?'#ff277f':'#00f3ff',colorB:kind==='cluster'?'#00b8ff':'#2371ff',haze:.65,enabled:true};
 L.fixtures.push(f);L.selected=f.id;L.active=true;L.forceLive=true;L.previewPlaying=true;L.previewStart=performance.now()-L.previewAt*1000;refreshUI();toast('Đã thêm '+f.name+'. Chọn Kéo đèn hoặc Click đặt trên sân khấu.');return f;
}
function addArray(count=5){const actual=Math.min(count,24-L.fixtures.length);for(let i=0;i<actual;i++){const f=addFixture(i%2?'cluster':'fan',defaultOrigin(i,actual));if(f){if(S.mount136?.aimLaser)S.mount136.aimLaser(f);else f.pan=defaultPan(f.pos)+(i%2?3:-3);}}refreshUI();toast('Đã bố trí '+actual+' nguồn laser preview trên sân khấu.');}
function removeSelected(){const i=L.fixtures.findIndex(x=>x.id===L.selected);if(i<0)return;L.fixtures.splice(i,1);L.selected=L.fixtures[0]?.id||null;refreshUI();}
const MAX_ILDA_SHOWS=32,MAX_ILDA_FRAMES=512,MAX_PERSISTED_ILDA_POINTS=MAX_ILDA_POINTS;
function encodeIldaBytes(bytes){
 const u8=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes||[]);
 if(typeof Buffer!=='undefined')return Buffer.from(u8.buffer,u8.byteOffset,u8.byteLength).toString('base64');
 let s='';const chunk=0x8000;
 for(let i=0;i<u8.length;i+=chunk)s+=String.fromCharCode.apply(null,u8.subarray(i,i+chunk));
 return btoa(s);
}
function decodeIldaBytes(data){
 if(data instanceof Uint8Array)return new Uint8Array(data);
 if(Array.isArray(data))return Uint8Array.from(data,v=>v?1:0);
 if(typeof data!=='string')throw new Error('ILDA byte buffer must be base64 string or array.');
 if(typeof Buffer!=='undefined'){const b=Buffer.from(data,'base64');return new Uint8Array(b.buffer,b.byteOffset,b.byteLength);}
 const bin=atob(data),out=new Uint8Array(bin.length);
 for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
 return out;
}
function encodeIldaFloats(arr,count3){
 const f32=new Float32Array(count3);
 for(let i=0;i<count3;i++)f32[i]=Number(arr?.[i])||0;
 return encodeIldaBytes(new Uint8Array(f32.buffer,f32.byteOffset,f32.byteLength));
}
function decodeIldaFloats(data){
 if(data instanceof Float32Array)return new Float32Array(data);
 if(Array.isArray(data))return Float32Array.from(data,v=>Number(v)||0);
 const u8=decodeIldaBytes(data);
 if(u8.byteLength%4!==0)throw new Error('Invalid Float32 base64 buffer length.');
 const aligned=u8.byteOffset%4===0?u8:u8.slice();
 return new Float32Array(aligned.buffer,aligned.byteOffset,aligned.byteLength/4);
}
function serializeIldaShows(shows){
 if(shows==null)return[];
 if(!Array.isArray(shows))throw new Error('Danh sách ILDA show không hợp lệ.');
 if(shows.length>MAX_ILDA_SHOWS)throw new Error('Vượt quá giới hạn '+MAX_ILDA_SHOWS+' ILDA show trong một dự án.');
 const out=[];let totalPts=0;
 for(const s of shows){
  if(!s||typeof s!=='object')throw new Error('Mục ILDA show không hợp lệ.');
  const rawFrames=Array.isArray(s.frames)?s.frames:[];
  if(rawFrames.length>MAX_ILDA_FRAMES)throw new Error('ILDA show vượt quá '+MAX_ILDA_FRAMES+' frames.');
  const frames=[];let showPts=0;
  for(const f of rawFrames){
   if(!f||typeof f!=='object')throw new Error('Khung ILDA không hợp lệ.');
   const posSrc=typeof f.positions==='string'||typeof f.position==='string'?decodeIldaFloats(f.positions||f.position):(f.position||f.positions||[]);
   const colSrc=typeof f.colors==='string'||typeof f.color==='string'?decodeIldaFloats(f.colors||f.color):(f.color||f.colors||[]);
   const blkSrc=typeof f.blanked==='string'||typeof f.blank==='string'?decodeIldaBytes(f.blanked||f.blank):(f.blank||f.blanked||[]);
   const count=Number(f.count??f.pointCount)||Math.floor(posSrc.length/3);
   if(!(count>0))throw new Error('Khung ILDA rỗng.');
   if(posSrc.length<count*3||colSrc.length<count*3||blkSrc.length<count)throw new Error('Khung ILDA thiếu dữ liệu tọa độ/màu/blanking.');
   totalPts+=count;showPts+=count;
   if(totalPts>MAX_PERSISTED_ILDA_POINTS)throw new Error('Tổng số điểm ILDA vượt quá giới hạn '+MAX_PERSISTED_ILDA_POINTS+' điểm.');
   const blkBytes=new Uint8Array(count);
   for(let i=0;i<count;i++)blkBytes[i]=blkSrc[i]?1:0;
   frames.push({
    number:Number(f.number)||0,name:String(f.name||'').slice(0,32),company:String(f.company||'').slice(0,32),projector:Number(f.projector)||0,
    count,pointCount:count,
    positions:encodeIldaFloats(posSrc,count*3),
    colors:encodeIldaFloats(colSrc,count*3),
    blanked:encodeIldaBytes(blkBytes)
   });
  }
  if(frames.length)out.push({id:String(s.id||'ilda_'+out.length),name:String(s.name||'show.ild').slice(0,120),frameCount:frames.length,totalPoints:showPts,frames});
 }
 return out;
}
function deserializeIldaShows(rawShows){
 if(rawShows==null)return[];
 if(!Array.isArray(rawShows))throw new Error('Danh sách ILDA show không hợp lệ.');
 if(rawShows.length>MAX_ILDA_SHOWS)throw new Error('Vượt quá giới hạn '+MAX_ILDA_SHOWS+' ILDA show.');
 const out=[];let totalPts=0;
 for(const s of rawShows){
  if(!s||typeof s!=='object'||!Array.isArray(s.frames))throw new Error('Dữ liệu ILDA show không hợp lệ.');
  if(s.frames.length>MAX_ILDA_FRAMES)throw new Error('ILDA show vượt quá '+MAX_ILDA_FRAMES+' frames.');
  const frames=[];let showPts=0;
  for(const f of s.frames){
   if(!f||typeof f!=='object')throw new Error('Khung ILDA không hợp lệ.');
   const rawPos=decodeIldaFloats(f.positions??f.position??[]);
   const rawCol=decodeIldaFloats(f.colors??f.color??[]);
   const rawBlk=decodeIldaBytes(f.blanked??f.blank??[]);
   const count=Number(f.count??f.pointCount)||Math.floor(rawPos.length/3);
   if(!(count>0)||rawPos.length!==count*3||rawCol.length!==count*3||rawBlk.length!==count){
    throw new Error('Khung ILDA không khớp số lượng tọa độ/màu/blanking.');
   }
   totalPts+=count;showPts+=count;
   if(totalPts>MAX_PERSISTED_ILDA_POINTS)throw new Error('Tổng số điểm ILDA vượt quá giới hạn '+MAX_PERSISTED_ILDA_POINTS+' điểm.');
   const position=new Float32Array(count*3),color=new Float32Array(count*3),blank=new Uint8Array(count);
   for(let i=0;i<count*3;i++){position[i]=clamp135(Number(rawPos[i])||0,-1,1);color[i]=clamp135(Number(rawCol[i])||0,0,1);}
   for(let i=0;i<count;i++)blank[i]=rawBlk[i]?1:0;
   frames.push({number:Number(f.number)||0,name:String(f.name||'').slice(0,32),company:String(f.company||'').slice(0,32),projector:Number(f.projector)||0,count,pointCount:count,position,positions:position,color,colors:color,blank,blanked:blank});
  }
  if(frames.length)out.push({id:String(s.id||'ilda_'+out.length),name:String(s.name||'show.ild').slice(0,120),frameCount:frames.length,totalPoints:showPts,frames});
 }
 return out;
}
const settingsSave=()=>({fixtures:L.fixtures.map(f=>({...f,pos:[...f.pos]})),preset:L.preset,active:L.active,settings:{...L.settings},activeIldaId:L.activeIldaId||null,ildaMeta:(L.ildaShows||[]).slice(0,32).map(s=>({id:String(s.id||''),name:String(s.name||'show.ild').slice(0,120),frameCount:Number(s.frameCount)||1,totalPoints:Number(s.totalPoints)||0})),ildaShows:serializeIldaShows(L.ildaShows),cueMeta:laserClips().map(c=>({id:c.id,preset:c.preset||String(c.source||'').replace(/^laser:/,''),fixtureIds:c.fixtureIds||[],manualFrames:c.manualFrames||null}))});
function restoreLaser(saved){L.fixtures=(Array.isArray(saved?.fixtures)?saved.fixtures:[]).slice(0,24).filter(f=>f&&Array.isArray(f.pos)&&f.pos.length===3&&f.pos.every(Number.isFinite)).map(f=>({id:String(f.id||uid135()),name:String(f.name||'LASER'),kind:f.kind||'fan',pos:f.pos.map(n=>clamp135(n,-5000,5000)),pan:clamp135(f.pan,-360,360),tilt:clamp135(f.tilt,-89,89),roll:clamp135(f.roll,-180,180),beamCount:clamp135(f.beamCount||7,1,24),fanAngle:clamp135(f.fanAngle||70,5,150),range:clamp135(f.range||17,1,80),intensity:clamp135(f.intensity??.9,0,1.7),speed:clamp135(f.speed||1,.05,4),colorA:typeof f.colorA==='string'?f.colorA:'#00eaff',colorB:typeof f.colorB==='string'?f.colorB:'#ff216e',haze:clamp135(f.haze??.65,0,1),enabled:f.enabled!==false}));L.selected=L.fixtures[0]?.id||null;L.preset=PRESETS[saved?.preset]?saved.preset:'blueFan';L.active=saved?.active!==false;L.settings={...DEFAULT_SETTINGS,...(saved?.settings||{})};L.ildaShows=deserializeIldaShows(saved?.ildaShows);L.activeIldaId=typeof saved?.activeIldaId==='string'&&L.ildaShows.some(s=>s.id===saved.activeIldaId)?saved.activeIldaId:(L.ildaShows[0]?.id||null);const activeShow=L.ildaShows.find(s=>s.id===L.activeIldaId)||L.ildaShows[0]||null;L.scanner=activeShow?new LaserScanner(activeShow.frames,TRAIL_POINTS,{rate:16000}):null;L.lastScannerTick=performance.now();L.previewPlaying=false;L.forceLive=false;L.previewAt=0;const meta=new Map((saved?.cueMeta||[]).map(x=>[x.id,x]));for(const c of laserClips()){const m=meta.get(c.id);c.preset=m?.preset||String(c.source||'').replace(/^laser:/,'');c.fixtureIds=m?.fixtureIds||L.fixtures.map(f=>f.id);if(m?.manualFrames)c.manualFrames=m.manualFrames;}refreshUI();}
L.serializeIldaShows=serializeIldaShows;L.deserializeIldaShows=deserializeIldaShows;L.settingsSave=settingsSave;L.restoreLaser=restoreLaser;
function saveCue(preset=L.preset,at=state.time,dur=null,extras={}){const p=PRESETS[preset]||PRESETS.blueFan;const duration=clamp135(dur??(preset==='epic'?95:12),.1,300),start=clamp135(at,0,599.8);if(start+duration>state.duration){if(typeof ensureDuration10==='function')ensureDuration10(Math.min(600,start+duration+.1));else state.duration=Math.max(state.duration,Math.min(600,start+duration+.1));}
 const tr=track10('vj','laser:all','LASER SHOW / RGB & TIME CODE');const c=addClip(tr.id,{name:extras.name||p.name,start,duration:Math.min(duration,state.duration-start),source:'laser:'+preset,preset,fixtureIds:L.fixtures.map(f=>f.id),fade:.12,color:p.colors[0],params:{beamCount:7,fanAngle:72,intensity:1,speed:1},...extras});
 if(c){L.forceLive=false;seq.enabled=true;invalidateSeq();renderSequence();refreshUI();toast('Đã thêm LASER cue '+p.name+' vào SHOW Timeline.');}return c;
}
function buildTimecode136(){
 if(!L.fixtures.length)addArray(6);
 const cues=[['axisScan',4],['geoCircle',5],['geoTriangle',5],['fanChase',4],['geoShapes',6],['flashSweep',4],['gridSweep',4],['shockGrid',5],['strobePulse',3],['waterfall',4],['climaxBurst',10],['finaleRing',6]];
 const start=clamp135(state.time,0,Math.max(0,600-60));let offset=0;
 for(const [name,duration] of cues){saveCue(name,start+offset,duration,{name:'LASER AUTO / '+PRESETS[name].name});offset+=duration;}
 L.preset='finaleRing';L.tab='timeline';refreshUI();toast('Đã tạo '+cues.length+' cue LASER Show trên Timecode. Strobe chỉ chạy sau khi bạn bật cho phép.');
}
function buildGeometryShow138(){
 if(!L.fixtures.length)addArray(6);
 const parts=[['blueFan',5],['geoCircle',7],['geoTriangle',7],['geoSquare',6],['geoHex',6],['geoStar',6],['geoShapes',9],['ringCascade',7],['triangleEcho',7],['geoTunnel',8],['flashSweep',6],['climaxBurst',9],['finaleRing',7]];
 const start=clamp135(state.time,0,510);let offset=0;
 for(const [name,dur] of parts){saveCue(name,start+offset,dur,{name:'LASER GEOMETRY / '+PRESETS[name].name});offset+=dur;}
 L.preset='finaleRing';L.tab='timeline';refreshUI();toast('Đã thêm '+parts.length+' cue hình học lên SHOW Timecode.');
}
function laserClips(){const tracks=new Set(seq.tracks.filter(x=>(x.type==='laser'||x.type==='vj'&&x.target==='laser:all')&&!x.muted).map(x=>x.id));return seq.clips.filter(c=>tracks.has(c.track)).sort((a,b)=>a.start-b.start);}
function activeCue(t){if(!seq.enabled)return null;let best=null;for(const c of laserClips())if(t>=c.start&&t<c.start+c.duration&&(best===null||c.start>=best.start))best=c;return best;}
function showStatus(t){const cue=L.forceLive?null:activeCue(t);if(cue)return {cue,preset:PRESETS[cue.preset]?cue.preset:(String(cue.source||'').replace(/^laser:/,'')||L.preset),local:t-cue.start,duration:cue.duration,fade:cue.fade??0.1};
 if(seq.enabled&&laserClips().length&&!L.forceLive)return null;
 return {cue:null,preset:L.preset,local:L.previewPlaying?Math.max(0,(performance.now()-L.previewStart)/1000):L.previewAt,duration:L.preset==='epic'?95:12,fade:0};}
function patternFor(preset,local,duration){if(preset!=='epic')return {name:preset,t:local,progress:((local%Math.max(1,duration))+duration)%Math.max(1,duration)/Math.max(1,duration),intensity:1,shock:0};
 const t=((local%95)+95)%95;
 if(t<15)return{name:'cyanGrid',t,progress:t/15,intensity:.6+.38*Math.sin(t*.6)**2,shock:0};
 if(t<45)return{name:'magentaCross',t:t-15,progress:(t-15)/30,intensity:.92,shock:0};
 if(t<80)return{name:'pinkStorm',t:t-45,progress:(t-45)/35,intensity:1.1,shock:0};
 const p=(t-80)/15;return{name:'heroBurst',t:t-80,progress:p,intensity:(1-p)**1.1,shock:p};}
function hexToRgb(hex){const s=String(hex||'#00ffff').replace('#','');if(!/^[0-9a-f]{6}$/i.test(s))return [0,243,255];return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)];}
function rgba(hex,alpha=1){const rgb=hexToRgb(hex);return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${clamp135(alpha,0,1).toFixed(3)})`;}
function beat(){const rms=clamp135(live.audioRMS??sq.energy??0,0,1);return L.settings.audioReactive?1+Math.min(.38,rms*.62):1;}
function cueManualFrame(f,frames,t){if(!frames?.length)return f;let a=frames[0],b=frames[frames.length-1];for(let i=0;i<frames.length-1;i++)if(t>=frames[i].t&&t<=frames[i+1].t){a=frames[i];b=frames[i+1];break;}if(t<=a.t)b=a;else if(t>=b.t)a=b;const q=clamp135((t-a.t)/Math.max(.001,b.t-a.t),0,1),numeric=['pan','tilt','roll','intensity','fanAngle','beamCount','range'];const result={...f};for(const key of numeric)if(Number.isFinite(a[key]))result[key]=lerp(a[key],Number.isFinite(b[key])?b[key]:a[key],q);result.colorA=q<.5?a.colorA:b.colorA;result.colorB=q<.5?a.colorB:b.colorB;if(Array.isArray(a.pos))result.pos=a.pos.map((v,i)=>lerp(v,Array.isArray(b.pos)?b.pos[i]:v,q));return result;}
function laserShapePoint(shape,u,phase=0){u=((u%1)+1)%1;const circle=[Math.cos(u*Math.PI*2+phase)*.34,Math.sin(u*Math.PI*2+phase)*.26];const poly=(sides,rotation=-Math.PI/2)=>{const t=u*sides,seg=Math.floor(t)%sides,q=t-Math.floor(t);const a0=rotation+seg*Math.PI*2/sides,a1=rotation+((seg+1)%sides)*Math.PI*2/sides;const A=[Math.cos(a0)*.36,Math.sin(a0)*.28],B=[Math.cos(a1)*.36,Math.sin(a1)*.28];return [lerp(A[0],B[0],q),lerp(A[1],B[1],q)];};
 if(shape==='circle')return circle;
 if(shape==='triangle')return poly(3,-Math.PI/2);
 if(shape==='square')return poly(4,Math.PI/4);
 if(shape==='diamond')return poly(4,-Math.PI/2);
 if(shape==='hex')return poly(6,-Math.PI/2);
 if(shape==='star'){
   const t=u*10,seg=Math.floor(t)%10,q=t-Math.floor(t),rad=j=>(j%2===0?1:.44);
   const phi0=-Math.PI/2+seg*Math.PI/5,phi1=-Math.PI/2+(seg+1)*Math.PI/5;
   const a=[Math.cos(phi0)*.36*rad(seg),Math.sin(phi0)*.28*rad(seg)],b=[Math.cos(phi1)*.36*rad(seg+1),Math.sin(phi1)*.28*rad(seg+1)];
   return [lerp(a[0],b[0],q),lerp(a[1],b[1],q)];
 }
 if(shape==='morph'){
   const step=((phase%(Math.PI*2))/(Math.PI*2))*4;const idx=Math.floor(step),q=step-idx;const names=['circle','triangle','square','diamond','hex'];const a=laserShapePoint(names[idx],u,0),b=laserShapePoint(names[(idx+1)%names.length],u,0);return [lerp(a[0],b[0],q),lerp(a[1],b[1],q)];
 }
 return circle;
}
function beamsFor(f,pattern,local,i,n,globalPower){const out=[],r=Math.sin,cos=Math.cos;
 const options=PRESETS[pattern.name]||PRESETS.blueFan;
 const color1=(pattern.name==='magentaCross'||pattern.name==='pinkStorm')?options.colors[0]:f.colorA||options.colors[0], color2=(pattern.name==='magentaCross'||pattern.name==='pinkStorm')?options.colors[1]:f.colorB||options.colors[1];
 const count=Math.max(1,Math.min(24,Math.round(pattern.name==='pinkStorm'?f.beamCount*1.35:pattern.name==='laserCurtain'?Math.max(10,f.beamCount):f.beamCount)));const fa=radians(f.fanAngle),tempo=local*f.speed;let index=0;
 for(let k=0;k<count;k++){
  const x=count<=1?0:(k/(count-1)-.5),phase=i*.62+k*.12,sign=i%2?1:-1;
  let angle=x*fa,vertical=0;
  if(pattern.name==='blueFan')angle+=r(tempo*.58+phase)*.12;
  if(pattern.name==='magentaCross'||pattern.name==='xFan'){angle=sign*(x*fa)+r(tempo*.8+phase)*.2; vertical=cos(tempo*.42+phase)*.05;}
  if(pattern.name==='cyanGrid'){angle=x*fa*1.1+r(tempo*.9+phase)*.26;vertical=r(tempo*.75+phase)*.10;}
  if(pattern.name==='dualSweep'){angle+=r(tempo+phase)*.39;vertical=.05*cos(tempo*.9+phase);}
  if(pattern.name==='blueTunnel'){angle=x*fa*.6+Math.sin(tempo*.65)*.16;vertical=Math.cos(tempo*.45+phase)*.11;}
  if(pattern.name==='waveFan'){angle+=Math.sin(tempo*1.2+x*5.5)*.18;vertical=r(tempo*1.7+phase)*.14;}
  if(pattern.name==='diamond'){angle=(k%2?-1:1)*(Math.abs(x)*fa)+r(tempo*.75+phase)*.2;vertical=Math.abs(x)*.24;}
  if(pattern.name==='laserCurtain'){angle=x*fa*.22+r(tempo*.3)*.07;vertical=.13*cos(tempo+phase);}
  if(pattern.name==='spiral'){angle=x*fa+Math.sin(tempo*.7+k*.5)*.3;vertical=.21*Math.cos(tempo*.8+k*.4);}
  if(pattern.name==='limePulse'){angle=x*fa*.75+r(tempo*.9+phase)*.2;}
  if(pattern.name==='pinkStorm'){angle=x*fa+r(tempo*2.1+k*.6)*.22;vertical=.11*cos(tempo*1.4+phase);}
  if(pattern.name==='heroBurst')angle=x*fa*(.12+.88*(1-pattern.shock));

  switch(pattern.name){
   case 'axisScan':angle=.1*r(tempo*1.3+phase)+x*fa*.14;vertical=.06*cos(tempo*1.4+phase);break;
   case 'horizonSweep':angle=x*fa+0.4*r(tempo*1.65);vertical=0.025*cos(phase);break;
   case 'verticalDrop':angle=x*fa*.15;vertical=.6*r(tempo*1.4+phase);break;
   case 'fanChase':angle=x*fa;vertical=.1*r(tempo*.8);break;
   case 'mirroredFan':angle=(i%2?-1:1)*x*fa+.16*r(tempo+phase);vertical=.03;break;
   case 'tunnelPulse':angle=x*fa*(.3+.28*(1+Math.sin(tempo*.9)));vertical=.19*cos(tempo*.7+k*.25);break;
   case 'gridSweep':angle=x*fa+0.28*r(tempo*.8+i*.6);vertical=.25*r(tempo*1.1+phase);break;
   case 'colorRipple':angle=x*fa+.1*r(tempo*.7+k*.44);vertical=.1*r(tempo+k*.36);break;
   case 'beatFan':angle=x*fa*(.55+.45*Math.abs(r(tempo*2)));vertical=.04*r(tempo*2);break;
   case 'limeHit':angle=x*fa*.72;vertical=.05*r(tempo*1.7+phase);break;
   case 'diagonalX':angle=sign*x*fa+.13*Math.sin(tempo+phase);vertical=(k%2?-1:1)*.25;break;
   case 'sideCurtain':angle=x*fa*.3+sign*.26;vertical=.4*r(tempo*.66+k*.1);break;
   case 'rainbowSweep':angle=x*fa+0.2*r(tempo+.3*i);vertical=.07*r(tempo+phase);break;
   case 'colorChase':angle=x*fa+.22*r(tempo*.75);vertical=.06*r(tempo*1.4+k*.15);break;
   case 'waterfall':angle=x*fa*.35;vertical=-.15+.4*r(tempo*.9+k*.45);break;
   case 'spiralTunnel':angle=x*fa+.25*r(tempo*.7+k*.35);vertical=.24*cos(tempo*.8+k*.4);break;
   case 'scanMatrix':angle=x*fa*.96+.3*r(tempo*1.35+phase);vertical=.35*cos(tempo*.8+k*.5);break;
   case 'converge':angle=x*fa*(1-.95*Math.abs(r(tempo*.65)));vertical=.2*cos(tempo*.65);break;
   case 'strobePulse':angle=x*fa*.88;vertical=.18*Math.sin(tempo*.9+k*.3);break;
   case 'finaleRing':angle=x*fa*(.12+.7*(.5+.5*r(tempo*.4)));vertical=.32*cos(tempo*.4+k*.42);break;
   case 'zigzag':angle=x*fa+(k%2?-.2:.2)+.14*r(tempo+phase);vertical=(k%3-1)*.16;break;
   case 'shockGrid':angle=x*fa+.27*r(tempo*1.4+phase);vertical=.21*cos(tempo*1.4+phase);break;
   case 'laserHalo':angle=x*fa+.21*r(tempo*.48+k*.3);vertical=.25*cos(tempo*.48+k*.33);break;
   case 'epicDrop':angle=x*fa*.84+.24*Math.sin(tempo*1.8+phase);vertical=.20*Math.cos(tempo*1.1+k*.42);break;
   case 'geoCircle':{const pt=laserShapePoint('circle',k/Math.max(1,count)+tempo*.055,tempo*.12);angle=pt[0]*fa*1.35;vertical=pt[1]*1.2;break;}
   case 'geoTriangle':{const pt=laserShapePoint('triangle',k/Math.max(1,count)+tempo*.04,tempo*.08);angle=pt[0]*fa*1.55;vertical=pt[1]*1.35;break;}
   case 'geoShapes':{const pt=laserShapePoint('morph',k/Math.max(1,count)+tempo*.03,tempo*.14);angle=pt[0]*fa*1.6;vertical=pt[1]*1.42;break;}
   case 'flashSweep':angle=x*fa+.58*r(tempo*2.4+phase);vertical=.20*cos(tempo*2.1+phase);break;
   case 'climaxBurst':angle=x*fa*(.28+.72*Math.abs(r(tempo*1.4)))+.33*r(tempo*2.7+phase);vertical=.36*cos(tempo*1.9+phase);break;
   case 'geoSquare':case 'geoHex':case 'geoStar':case 'geoDiamond':case 'ringCascade':case 'triangleEcho':case 'squareRoll':case 'geoTunnel':{
     const shape=({geoSquare:'square',geoHex:'hex',geoStar:'star',geoDiamond:'diamond',ringCascade:'circle',triangleEcho:'triangle',squareRoll:'square',geoTunnel:'hex'})[pattern.name];
     const p=laserShapePoint(shape,k/Math.max(1,count)+tempo*.018,tempo*.13);
     angle=p[0]*fa*1.5;vertical=p[1]*1.48;break;
   }
   case 'beatGate':angle=x*fa+.25*Math.sin(tempo*1.2+i*.42);vertical=.2*Math.cos(tempo*1.6+phase);break;
   case 'blackoutHit':angle=x*fa*(.5+.5*Math.abs(Math.sin(tempo*1.6)));vertical=.18*Math.cos(tempo*1.1+phase);break;
  }

  const rotated=angle*Math.cos(radians(f.roll||0));vertical+=x*fa*Math.sin(radians(f.roll||0));angle=rotated;
  const yaw=radians(f.pan)+angle,tilt=radians(f.tilt)+vertical,rng=f.range*(pattern.name==='blueTunnel'?1.1:1);
  const start=f.pos;let end=[start[0]+Math.sin(yaw)*Math.cos(tilt)*rng,start[1]+Math.sin(tilt)*rng,start[2]+Math.cos(yaw)*Math.cos(tilt)*rng];if(S.mount136?.clipBeam)end=S.mount136.clipBeam(start,end);
  const fade=pattern.name==='heroBurst'?1-pattern.shock:1;
  const pulse=(.65+.35*(.5+.5*r(tempo*.9+k*.14)));
  let gate=1;
  if(pattern.name==='fanChase'||pattern.name==='colorChase')gate=(Math.abs((k+Math.floor(tempo*3))%count)<Math.ceil(count*.4))?1:.06;
  if(pattern.name==='beatFan'||pattern.name==='limeHit')gate=.35+.65*Math.abs(r(tempo*1.7));
  if(pattern.name==='strobePulse')gate=L.settings.strobeEnabled?(Math.sin(local*2*Math.PI*2.4)>.15?1:.045):(.42+.45*Math.abs(r(tempo*.65)));
  if(pattern.name==='converge')gate=.55+.45*Math.abs(Math.sin(tempo*.65));
  if(pattern.name==='epicDrop')gate=.45+.55*Math.abs(Math.sin(tempo*1.1));
  if(pattern.name==='flashSweep')gate=L.settings.strobeEnabled?(Math.sin(local*2*Math.PI*2.65)>.02?1:.02):(.45+.55*Math.abs(Math.sin(tempo*2.1)));
  if(pattern.name==='climaxBurst')gate=L.settings.strobeEnabled?(Math.sin(local*2*Math.PI*2.95)>.18?1:.03):(.65+.35*Math.abs(Math.sin(tempo*2.8)));
  if(pattern.name==='geoShapes')gate=.58+.42*Math.abs(Math.sin(tempo*.75));
  if(pattern.name==='beatGate')gate=.12+.88*(Math.sin(tempo*2.8-k*.5)>.2?1:0);
  if(pattern.name==='blackoutHit')gate=(Math.sin(tempo*1.5)>0.18?.85:.025);
  const power=f.intensity*globalPower*beat()*fade*pulse*gate;
  let col=k%2?color2:color1;
  if(pattern.name==='rainbowSweep'||pattern.name==='colorRipple')col=COLORS[Math.abs(Math.floor(k+tempo*1.8))%COLORS.length];
  if(pattern.name==='limeHit'||pattern.name==='strobePulse')col=options.colors[k%2];
  out.push({a:start,b:end,color:col,alpha:clamp135(power,0,1.6),cluster:i,line:index++});
  if(['cyanGrid','magentaCross','pinkStorm','gridSweep','scanMatrix','diagonalX','shockGrid','geoTriangle','geoShapes','climaxBurst'].includes(pattern.name)){
   if(k%3===0){const ang2=yaw+(.32*sign),end2=[start[0]+Math.sin(ang2)*Math.cos(tilt+.13)*rng*.85,start[1]+Math.sin(tilt+.13)*rng*.85,start[2]+Math.cos(ang2)*Math.cos(tilt+.13)*rng*.85];out.push({a:start,b:end2,color:k%2?color1:color2,alpha:clamp135(power*.68,0,1),cluster:i,line:index++});}
  }
  if(['geoCircle','geoShapes','flashSweep'].includes(pattern.name) && k%4===0){const ang3=yaw-.24*sign,end3=[start[0]+Math.sin(ang3)*Math.cos(tilt-.11)*rng*.78,start[1]+Math.sin(tilt-.11)*rng*.78,start[2]+Math.cos(ang3)*Math.cos(tilt-.11)*rng*.78];out.push({a:start,b:end3,color:k%2?color2:color1,alpha:clamp135(power*.55,0,.92),cluster:i,line:index++});}
 }
 return out;
}
function drawGeometricPath138(pattern, sources, status, power){
 const type=({geoCircle:'circle',geoTriangle:'triangle',geoShapes:'morph',geoSquare:'square',geoHex:'hex',geoStar:'star',geoDiamond:'diamond',ringCascade:'circle',triangleEcho:'triangle',squareRoll:'square',geoTunnel:'hex'})[pattern.name];
 if(!type||!sources?.length)return;
 const high=L.settings.quality==='high'||L.settings.quality==='ultra',segments=high?40:24;
 const t=status.local||0, maxFixtures=L.settings.quality==='low'?3:6;
 const layers=pattern.name==='ringCascade'||pattern.name==='triangleEcho'||pattern.name==='geoTunnel'?3:1;
 const repeats=Math.min(maxFixtures,sources.length);
 for(let i=0;i<repeats;i++){
  const fixture=sources[i];if(!fixture||fixture.enabled===false)continue;
  const f=status.cue?.manualFrames?.[fixture.id]?cueManualFrame(fixture,status.cue.manualFrames[fixture.id],t):fixture;
  const yaw=radians(f.pan||0),tilt=radians(f.tilt||0);
  const forward=[Math.sin(yaw)*Math.cos(tilt),Math.sin(tilt),Math.cos(yaw)*Math.cos(tilt)];
  const right=[Math.cos(yaw),0,-Math.sin(yaw)];
  const up=[-Math.sin(yaw)*Math.sin(tilt),Math.cos(tilt),-Math.cos(yaw)*Math.sin(tilt)];
  const rotation=t*(pattern.name==='squareRoll'?.55:.12)+i*.14;
  const cs=Math.cos(rotation),sn=Math.sin(rotation), reach=Math.max(3.6,Math.min(14,(f.range||18)*.57));
  const baseSize=Math.max(.75,Math.min(3.4,reach*.23));
  for(let layer=0;layer<layers;layer++){
   const deep=reach*(1+layer*.15), scale=baseSize*(1+layer*(pattern.name==='geoTunnel'?.55:.30));
   const center=f.pos.map((x,j)=>x+forward[j]*deep); const pts=[];
   for(let k=0;k<=segments;k++){
    const u=k/segments;
    const p=laserShapePoint(type,u+t*(pattern.name==='geoShapes'?.025:.009),pattern.name==='geoShapes'?t*.32:0);
    const a=p[0]*cs-p[1]*sn,b=p[0]*sn+p[1]*cs;
    const point=center.map((v,j)=>v+right[j]*a*scale*3+up[j]*b*scale*3);
    const v=engine.project(point);if(v&&Number.isFinite(v.x+v.y)&&v.z<1.1&&v.z>-.98)pts.push(v);else pts.length=0;
   }
   if(pts.length<segments+1)continue;
   const fade=Math.max(.2,1-layer*.27),pwr=Math.min(1.25,Math.max(0,f.intensity*power*fade)),color=layer%2?f.colorB:f.colorA;
   ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let k=1;k<pts.length;k++)ctx.lineTo(pts[k].x,pts[k].y);
   ctx.closePath();ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=Math.max(1,L.settings.lineWidth*5.4);
   ctx.strokeStyle=rgba(color,.15*pwr);ctx.shadowColor=color;ctx.shadowBlur=high?11*L.settings.glow:5*L.settings.glow;ctx.stroke();
   ctx.shadowBlur=0;ctx.lineWidth=Math.max(.8,L.settings.lineWidth*1.45);ctx.strokeStyle=rgba(color,.9*pwr);ctx.stroke();
   ctx.lineWidth=.55;ctx.strokeStyle=rgba('#f5ffff',.64*pwr);ctx.stroke();
   // Subtle visible projection: sparse rays from the projector to polygon vertices.
   const origin=engine.project(f.pos);if(origin&&origin.z<1.1){const step=Math.max(3,Math.floor(segments/5));for(let k=0;k<segments;k+=step){ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(pts[k].x,pts[k].y);ctx.strokeStyle=rgba(color,.14*pwr);ctx.lineWidth=.8;ctx.stroke();}}
  }
 }
}
let cachedRect=null,ratio=1;
function sizeOverlay(){const w=drawCan.clientWidth,h=drawCan.clientHeight;if(w<=0||h<=0)return false;const cap=L.settings.quality==='ultra'?1.7:L.settings.quality==='high'?1.35:1;ratio=Math.min(window.devicePixelRatio||1,cap);const cw=Math.round(w*ratio),ch=Math.round(h*ratio);if(drawCan.width!==cw||drawCan.height!==ch){drawCan.width=cw;drawCan.height=ch;}ctx.setTransform(ratio,0,0,ratio,0,0);return true;}
function drawLaserFrame(now,{clean=false}={}){if(!ctx)return;
 if(!L.active||!L.fixtures.length||engine.view!=='stage'||!engine.vp){if(L._overlayDirty&&drawCan.width>0){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,drawCan.width,drawCan.height);L._overlayDirty=false;}return;}
 if(!sizeOverlay())return;L._overlayDirty=true;const w=drawCan.clientWidth,h=drawCan.clientHeight;ctx.clearRect(0,0,w,h);
 const status=showStatus(state.time);if(!status)return;
 const pat=patternFor(status.preset,status.local,status.duration),cue=status.cue;
 const fade=cue?Math.min(1,(status.local+.001)/Math.max(.03,status.fade),(cue.duration-status.local)/Math.max(.03,status.fade)):1;
 const pwr=clamp135(fade,0,1)*pat.intensity;
 const sources=cue?.fixtureIds?.length?L.fixtures.filter(x=>cue.fixtureIds.includes(x.id)):L.fixtures;
 const all=[];if(pat.name!=='ildaShow'||!L.scanner)for(let i=0;i<sources.length;i++){const source=sources[i];if(!source.enabled)continue;const f=cue?.manualFrames?.[source.id]?cueManualFrame(source,cue.manualFrames[source.id],status.local):source;all.push(...beamsFor(f,pat,status.local,i,sources.length,pwr));}
 const limit=Math.min(L.settings.maxBeams,L.settings.quality==='low'?36:L.settings.quality==='medium'?56:88);if(all.length>limit)all.length=limit;
 ctx.save();ctx.globalCompositeOperation='screen';
 if(L.settings.haze>0){const groups=new Map();for(const beam of all){const key=beam.cluster;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(beam);}for(const group of groups.values()){
  const p0=engine.project(group[0].a),a=engine.project(group[0].b),b=engine.project(group[group.length-1].b);if(!p0||!a||!b||p0.z>1)continue;
  ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.closePath();const haze=ctx.createRadialGradient(p0.x,p0.y,1,p0.x,p0.y,Math.max(40,Math.hypot(a.x-p0.x,a.y-p0.y)*.8));haze.addColorStop(0,rgba(group[0].color,.17*L.settings.haze));haze.addColorStop(1,rgba(group[0].color,0));ctx.fillStyle=haze;ctx.globalAlpha=1;ctx.fill();
 }}
 for(const ray of all){const p0=engine.project(ray.a),p1=engine.project(ray.b);if(!p0||!p1||p0.z>1.1)continue;if(!Number.isFinite(p0.x+p0.y+p1.x+p1.y))continue;
 const vis=clamp135(ray.alpha,0,1),width=clamp135(L.settings.lineWidth,.45,2.2);
 ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.strokeStyle=rgba(ray.color,.09*vis*L.settings.glow);ctx.lineWidth=width*9;ctx.shadowBlur=L.settings.quality==='low'?0:width*8*L.settings.glow;ctx.shadowColor=ray.color;ctx.stroke();
 ctx.shadowBlur=0;ctx.strokeStyle=rgba(ray.color,.6*vis);ctx.lineWidth=width*2.5;ctx.stroke();ctx.strokeStyle=rgba('#d5ffff',.85*vis);ctx.lineWidth=Math.max(.35,width*.65);ctx.stroke();
 }
 drawGeometricPath138(pat,sources,status,pwr);
 if(pat.name==='ildaShow'&&L.scanner&&sources.length){
  const dtSec=L.lastScannerTick>0?(now-L.lastScannerTick)/1000:1/60;L.lastScannerTick=now;
  L.scanner.advance(dtSec);const snap=L.scanner.snapshot(0.95);
  for(let si=0;si<Math.min(4,sources.length);si++){
   const f=sources[si];if(!f||f.enabled===false)continue;
   const yaw=radians(f.pan||0),tilt=radians(f.tilt||0);
   const forward=[Math.sin(yaw)*Math.cos(tilt),Math.sin(tilt),Math.cos(yaw)*Math.cos(tilt)],right=[Math.cos(yaw),0,-Math.sin(yaw)],up=[-Math.sin(yaw)*Math.sin(tilt),Math.cos(tilt),-Math.cos(yaw)*Math.sin(tilt)];
   const reach=Math.max(4,Math.min(14,(f.range||16)*0.55)),scale=reach*0.42,center=f.pos.map((v,j)=>v+forward[j]*reach);
   ctx.lineWidth=Math.max(1.1,L.settings.lineWidth*1.8);
   const fallbackStroke=rgba(f.colorA||'#61e8ff',0.88*pwr);
   ctx.beginPath();let penDown=false,activeStroke=fallbackStroke,lastX=0,lastY=0;
   for(let j=0;j<snap.count;j++){
    const q=j*3;
    if(snap.blank[j]===1){penDown=false;continue;}
    const wx=center[0]+right[0]*snap.position[q]*scale+up[0]*snap.position[q+1]*scale;
    const wy=center[1]+right[1]*snap.position[q]*scale+up[1]*snap.position[q+1]*scale;
    const wz=center[2]+right[2]*snap.position[q]*scale+up[2]*snap.position[q+1]*scale;
    const pt=engine.project([wx,wy,wz]);
    if(!pt||!Number.isFinite(pt.x+pt.y)||pt.z>1.1||pt.z<-0.98){penDown=false;continue;}
    const cr=Math.round(clamp135(snap.color[q],0,1)*255),cg=Math.round(clamp135(snap.color[q+1],0,1)*255),cb=Math.round(clamp135(snap.color[q+2],0,1)*255);
    const segStroke=(cr||cg||cb)?`rgba(${cr},${cg},${cb},${clamp135(0.88*pwr,0,1).toFixed(3)})`:fallbackStroke;
    if(!penDown){ctx.moveTo(pt.x,pt.y);penDown=true;activeStroke=segStroke;}
    else{
     if(segStroke!==activeStroke){ctx.strokeStyle=activeStroke;ctx.stroke();ctx.beginPath();ctx.moveTo(lastX,lastY);activeStroke=segStroke;}
     ctx.lineTo(pt.x,pt.y);
    }
    lastX=pt.x;lastY=pt.y;
   }
   ctx.strokeStyle=activeStroke;ctx.stroke();
  }
 }
 for(const f of sources){if(!f.enabled)continue;const p=engine.project(f.pos);if(!p||p.z>1.1||p.x<-100||p.x>w+100||p.y<-100||p.y>h+100)continue;
 const rad=9+14*L.settings.glow,gr=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rad);gr.addColorStop(0,'rgba(255,255,255,.85)');gr.addColorStop(.16,rgba(f.colorA,.7));gr.addColorStop(1,rgba(f.colorA,0));ctx.globalAlpha=Math.min(1,f.intensity*pwr);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,rad,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 }
 if(pat.shock>0&&pat.shock<.96){const center=stageCenter(),c=engine.project(center);if(c){ctx.strokeStyle=rgba('#bfefff',Math.sin(pat.shock*Math.PI)*.7);ctx.lineWidth=1.5+2*pat.shock;ctx.beginPath();ctx.ellipse(c.x,c.y,22+Math.min(w,h)*.48*pat.shock,(13+Math.min(w,h)*.32*pat.shock),0,0,Math.PI*2);ctx.stroke();}}
 if((pat.name==='limePulse'||pat.name==='pinkStorm')&&L.settings.strobeEnabled && Math.sin(status.local*Math.PI*6)>0.87){ctx.fillStyle='rgba(222,255,255,.07)';ctx.fillRect(0,0,w,h);}
 if((pat.name==='flashSweep'||pat.name==='climaxBurst')&&L.settings.strobeEnabled && Math.sin(status.local*Math.PI*(pat.name==='climaxBurst'?5.9:5.3))>0.74){ctx.fillStyle=pat.name==='climaxBurst'?'rgba(255,245,252,.10)':'rgba(217,251,255,.06)';ctx.fillRect(0,0,w,h);}
 ctx.restore();
 if(!clean&&!state.presenting&&L.open)drawSourceMarkers();
}
function drawSourceMarkers(){ctx.save();ctx.textBaseline='middle';ctx.font='600 11px Segoe UI';for(const [i,f] of L.fixtures.entries()){const p=engine.project(f.pos);if(!p||p.z>1.05)continue;ctx.beginPath();ctx.arc(p.x,p.y,f.id===L.selected?10:7,0,Math.PI*2);ctx.fillStyle=f.id===L.selected?'rgba(255,207,110,.9)':'rgba(111,229,241,.8)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#061724';ctx.stroke();ctx.fillStyle='#ebfbff';ctx.fillText('LASER '+(i+1),p.x+13,p.y-2);}ctx.restore();}
function planePoint(clientX,clientY,planeY){if(!engine.vp||!engine.canvas)return null;const r=engine.canvas.getBoundingClientRect(),nx=(clientX-r.left)/r.width*2-1,ny=1-(clientY-r.top)/r.height*2;try{const inverse=M.inverse(engine.vp),o=M.point(inverse,[nx,ny,-1]),end=M.point(inverse,[nx,ny,1]),d=M.sub(end,o);if(Math.abs(d[1])<.0001)return null;const t=(planeY-o[1])/d[1];if(t<0)return null;return [o[0]+d[0]*t,planeY,o[2]+d[2]*t];}catch(e){return null;}}
function moveAt(x,y,vertical=false){const f=selected();if(!f)return;const hit=engine.pick(x,y,false);const point=(hit?.point)||planePoint(x,y,f.pos[1]);if(!point)return;const next=S.mount136?.constrain?S.mount136.constrain(point):point;f.pos[0]=next[0];f.pos[2]=next[2];if(vertical&&hit?.point)f.pos[1]=next[1];else if(S.mount136?.getArea)f.pos[1]=S.mount136.constrain(f.pos)[1];recordSnapshot();}
function recordSnapshot(force=false){if(!L.recording)return;const rec=L.recording,t=clamp135(state.time-rec.start,0,600);const f=L.fixtures.find(x=>x.id===L.selected);if(!f)return;const frames=rec.frames[f.id]||(rec.frames[f.id]=[]);if(!force&&frames.length&&t-frames.at(-1).t<.045)return;frames.push({t,pan:f.pan,tilt:f.tilt,roll:f.roll,intensity:f.intensity,fanAngle:f.fanAngle,beamCount:f.beamCount,range:f.range,pos:[...f.pos],colorA:f.colorA,colorB:f.colorB});}
function startRecord(){if(!L.fixtures.length){toast('Thêm LASER trước khi ghi thao tác.');return;}if(L.recording)return;L.recording={start:state.time,frames:{}};L.forceLive=true;L.active=true;recordSnapshot(true);setPlaying(true);refreshUI();toast('Đang ghi Pan/Tilt và hiệu ứng LASER theo timecode.');}
function stopRecord(){if(!L.recording)return;recordSnapshot(true);const r=L.recording;L.recording=null;L.forceLive=false;const dur=clamp135(state.time-r.start,.2,300);const clip=saveCue(L.preset,r.start,dur,{name:'GHI LASER BẰNG TAY',manualFrames:r.frames,fixtureIds:Object.keys(r.frames)});refreshUI();if(clip)toast('Đã ghi '+Math.round(dur*10)/10+' giây laser lên SHOW Timeline.');}
function renderMini(now){let canvas=id('laser135MiniCanvas');if(!canvas||now-L.lastTiny<45)return;L.lastTiny=now;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(window.devicePixelRatio||1,1.5),w=Math.floor(r.width*dpr),h=Math.floor(r.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,r.width,r.height);const ww=r.width,hh=r.height,t=now/1000;g.strokeStyle='#fa204c';g.lineWidth=1.7;const phase=(t*.18)%1;g.beginPath();const s=phase*2*(ww+hh);const border=[[0,0],[ww,0],[ww,hh],[0,hh],[0,0]];let left=s,i=0;for(;i<4;i++){let len=Math.abs(border[i+1][0]-border[i][0])+Math.abs(border[i+1][1]-border[i][1]);if(left<=len)break;left-=len;}if(i<4){const a=border[i],b=border[i+1],n=Math.hypot(b[0]-a[0],b[1]-a[1]);const x=lerp(a[0],b[0],left/n),y=lerp(a[1],b[1],left/n);g.beginPath();g.arc(x,y,2,0,Math.PI*2);g.shadowBlur=9;g.shadowColor='#ff0033';g.fillStyle='#ff385a';g.fill();g.shadowBlur=0;}
 if(L.buttonHover||L.buttonState==='active'){const elapsed=L.buttonState==='active'?(now-L.buttonStart)/1000:1.2;let colors=elapsed<15?['#00f3ff','#1a5dff']:elapsed<45?['#ff0033','#0044ff']:elapsed<80?['#ff2da1','#37ffbd']:['#d4fbff','#fe4c9d'];let intensity=elapsed<15?3:elapsed<45?6:elapsed<80?10:4;for(let j=0;j<intensity;j++){const ox=(j%2?ww:0),oy=(j%2?0:hh),ex=ww*(.15+(j/intensity)*.75)+Math.sin(t*3+j)*10,ey=hh*(.2+Math.cos(j+t)*.3);g.beginPath();g.moveTo(ox,oy);g.lineTo(ex,ey);g.strokeStyle=colors[j%2];g.globalAlpha=.24;g.lineWidth=1.2;g.stroke();}g.globalAlpha=1;
 if(L.buttonState==='active'&&elapsed>=95){L.buttonState='idle';}}
}
function desiredFrameMs(){const target=document.hidden?10:(state.presenting?L.settings.fpsCap:Math.min(30,L.settings.fpsCap));return 1000/clamp135(target,10,60);}
function tick(now){try{if(now-L.lastFrame>desiredFrameMs()-1){L.lastFrame=now;drawLaserFrame(now);}renderMini(now);if(now-L.lastUI>250){L.lastUI=now;ensureButtons();updateHUD();if(L.open&&state.presenting)positionPanel();}}
 catch(err){if(!L._drawError){console.warn('Laser preview stopped due to error:',err);L._drawError=true;}}
 requestAnimationFrame(tick);}
function openLaser(tab='fixture'){if(tab)L.tab=tab;L.open=true;document.body.classList.add('laser135-open');if(!state.presenting){id('pro127close')?.click();const closeVJ=id('v130close');if(closeVJ)closeVJ.click();}panel.hidden=false;positionPanel();paintPanel();ensureButtons();}
function closeLaser(){L.open=false;L.placing=false;L.moveMode=false;L.drag=null;drawCan.classList.remove('laser135-pick','laser135-dragging');panel.hidden=true;document.body.classList.remove('laser135-open');ensureButtons();}
function positionPanel(){if(!L.open)return;if(state.presenting){panel.style.removeProperty('top');panel.style.removeProperty('right');panel.style.removeProperty('bottom');panel.style.removeProperty('width');panel.style.removeProperty('height');return;}const side=document.querySelector('.right-panel'),rect=side?.getBoundingClientRect();let w=rect?.width||330,top=rect?.top||150;const narrow=!rect||rect.width<130||getComputedStyle(side).display==='none';if(narrow){panel.style.right='8px';panel.style.width=`min(360px, calc(100vw - 16px))`;panel.style.top='90px';panel.style.bottom='70px';}else{panel.style.right='0px';panel.style.width=Math.round(w)+'px';panel.style.top=Math.max(8,Math.round(top))+'px';panel.style.bottom='0px';}}
function field(label,name,val,min,max,step=1){const n=Number(val);return `<label>${html(label)}<input data-laser-prop="${name}" type="number" step="${step}" min="${min}" max="${max}" value="${Number.isFinite(n)?n.toFixed(step<1?2:0):0}"></label>`;}
function slider(label,name,val,min,max,step=1,unit=''){return `<label><div style="display:flex;justify-content:space-between"><span>${html(label)}</span><output data-laser-out="${name}">${Number(val).toFixed(step<1?2:0)}${unit}</output></div><input data-laser-prop="${name}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;}
function fixtureMarkup(){const f=selected();return `<section><h4>ĐẶT ĐÈN LASER VÀO SÂN KHẤU 3D</h4><div class="laser135-actions"><button class="primary" data-laser-action="add">+ LASER FAN</button><button data-laser-action="array">+ CỤM 6</button><button data-laser-action="scanner">+ SCANNER</button></div><div class="laser135-actions"><button class="${L.placing?'selected':''}" data-laser-action="place">⌖ Click đặt trên model</button><button class="${L.moveMode?'selected':''}" data-laser-action="move">✥ Kéo trực tiếp</button><button class="primary" data-laser-action="mount">▣ TRUSS / 6 MẶT</button></div><p>Đầu laser là fixture 3D preview, độc lập với model gốc. Có thể click trực tiếp vào mặt sân khấu, truss hoặc vật thể 3D để đặt; khi bật ✥ Kéo trực tiếp có thể kéo nhanh lại vị trí.</p><div class="laser135-lights">${L.fixtures.map((x,i)=>`<div class="laser135-lightrow"><button data-laser-select="${html(x.id)}" class="${x.id===L.selected?'selected':''}">◉ ${i+1}. ${html(x.name)}</button><button data-laser-toggle="${html(x.id)}">${x.enabled?'ON':'OFF'}</button></div>`).join('')||'<p>Chưa có laser. Bấm + LASER FAN hoặc + CỤM 6.</p>'}</div></section>
 <section><h4>CHỈNH ĐẦU LASER · VỊ TRÍ VÀ HƯỚNG CHIẾU</h4>${f?`<div class="laser135-current">Đang chỉnh: <b>${html(f.name)}</b> · ${html(f.kind.toUpperCase())}</div><div class="laser135-grid">${field('X / m','x',f.pos[0],-500,500,.01)}${field('Y / m','y',f.pos[1],-500,500,.01)}${field('Z / m','z',f.pos[2],-500,500,.01)}${field('Roll °','roll',f.roll,-180,180,1)}</div>${slider('PAN — QUAY NGANG','pan',f.pan,-180,180,1,'°')}${slider('TILT — NGẨNG / CÚI','tilt',f.tilt,-75,88,1,'°')}${slider('Số tia laser','beamCount',f.beamCount,1,24,1)}${slider('Góc xòe FAN','fanAngle',f.fanAngle,5,150,1,'°')}${slider('Cường độ mô phỏng','intensity',f.intensity,0,1.7,.05)}${slider('Tốc độ quét','speed',f.speed,.05,4,.05)}${slider('Tầm chiếu','range',f.range,2,75,.5,'m')}<div class="laser135-grid"><label>Màu A<input type="color" data-laser-prop="colorA" value="${html(f.colorA)}"></label><label>Màu B<input type="color" data-laser-prop="colorB" value="${html(f.colorB)}"></label></div><div class="laser135-actions"><button data-laser-action="aimLeft">◀ Quét trái</button><button data-laser-action="aimFront">⌖ Giữa</button><button data-laser-action="aimRight">Quét phải ▶</button><button class="danger" data-laser-action="delete">Xóa laser</button></div>`:'<p>Thêm laser để bắt đầu chỉnh vị trí và Pan/Tilt.</p>'}</section>`;}
function presetGlyph138(key){
 const kinds={geoCircle:'◯',geoTriangle:'△',geoShapes:'◌',geoSquare:'□',geoHex:'⬡',geoStar:'★',geoDiamond:'◇',ringCascade:'◎',triangleEcho:'◬',squareRoll:'▢',geoTunnel:'⬡',flashSweep:'↗',climaxBurst:'✹',beatGate:'▥',blackoutHit:'◐'};
 if(kinds[key])return kinds[key];
 if(/tunnel|halo|ring/i.test(key))return '◎';if(/fan|curtain/i.test(key))return '✺';if(/cross|grid|matrix/i.test(key))return '╳';if(/sweep|scan|chase|wave/i.test(key))return '⇆';if(/flash|strobe|hit|burst|pulse/i.test(key))return '✦';return '⌁';
}
function presetMarkup(){return `<section><h4>LASER SHOW / CHỌN VÀ CHẠY HIỆU ỨNG</h4><div class="laser135-presets">${Object.entries(PRESETS).map(([key,p])=>`<button data-laser-preset="${key}" class="${key===L.preset?'selected':''}"><span class="laser138-glyph" aria-hidden="true">${presetGlyph138(key)}</span><span class="laser138-preset-name">${p.name}</span></button>`).join('')}</div><p>Các mẫu phối màu và tia quạt, giao nhau, ma trận, tunnel, shockwave; có thêm FX hình học như vòng tròn, tam giác, geo morph, flash sweep và climax burst. Epic Sequence có bốn pha theo 95 giây.</p><div class="laser135-actions"><button class="primary" data-laser-action="play">▶ XEM LASER SHOW</button><button data-laser-action="stop">■ DỪNG</button><button data-laser-action="fullscreen">▣ TRÌNH DIỄN</button><button data-laser-action="importIlda">📂 Nhập .ILD (ILDA)</button></div><div class="laser135-current">PRESET: ${html(PRESETS[L.preset]?.name||'Laser')}<br><b>${L.previewPlaying?'Đang chạy realtime':'Preview tạm dừng'}</b> · ${L.fixtures.length} fixture · ${state.duration.toFixed(1)}s SHOW</div></section>
 <section><h4>ĐƯA VÀO SHOW TIMECODE</h4><div class="laser135-grid"><label>Bắt đầu / giây<input id="laser135CueStart" type="number" step=".01" min="0" max="600" value="${state.time.toFixed(2)}"></label><label>Thời lượng / giây<input id="laser135CueDuration" type="number" step=".1" min=".1" max="300" value="${L.preset==='epic'?95:12}"></label></div><div class="laser135-actions"><button class="primary" data-laser-action="addCue">+ ĐẶT CUE VÀO TIME CODE</button><button data-laser-action="epic">+ SHOW 95 GIÂY</button><button data-laser-action="buildTimecode">+ SHOW TIMECODE 60s</button><button data-laser-action="geometryShow">+ GEO SHOW 90s</button></div><p>Có thêm các mẫu FX hình học và strobe climax. Ghi cue hoặc tạo chuỗi 60s gồm circle → triangle → geo morph → flash sweep → matrix → climax → finale; đồng bộ với Visual LED, âm thanh, biên đạo và ánh sáng của show hiện tại.</p></section>`;}
function timelineMarkup(){const cues=laserClips();return `<section><h4>ĐIỀU KHIỂN TIMECODE / GHI LASER BẰNG TAY</h4><div class="laser135-time" id="laser135Clock">00:00:00:00</div><div class="laser135-actions"><button class="primary" data-laser-action="record">${L.recording?'● ĐANG GHI':'● BẮT ĐẦU GHI'}</button><button data-laser-action="mark">◆ KEYFRAME</button><button data-laser-action="endRecord">■ KẾT THÚC / LƯU</button></div><p>Khi ghi, thay đổi Pan/Tilt, màu, cường độ hoặc vị trí. Kết thúc sẽ lưu dữ liệu keyframe lên track LASER SHOW để phát lại theo timecode.</p></section><section><h4>DANH SÁCH LASER CUE / ${cues.length} ĐOẠN</h4>${cues.map(c=>`<div class="laser135-cue"><div><strong>${html(c.name||c.preset)}</strong><small>${c.start.toFixed(2)}s → ${(c.start+c.duration).toFixed(2)}s · ${html(c.preset||'')}</small></div><button data-laser-cue="${html(c.id)}">▶</button></div>`).join('')||'<p>Chưa có cue laser. Vào PRESET → + ĐẶT CUE.</p>'}</section>`;}
function settingsMarkup(){const s=L.settings;return `<section><h4>CÀI ĐẶT HIỂN THỊ LASER</h4><div class="laser135-grid"><label>Chất lượng<select data-laser-setting="quality">${['low','medium','high','ultra'].map(v=>`<option ${s.quality===v?'selected':''} value="${v}">${v.toUpperCase()}</option>`).join('')}</select></label><label>Render FPS mục tiêu<select data-laser-setting="fpsCap">${[30,45,60].map(n=>`<option value="${n}" ${s.fpsCap===n?'selected':''}>${n} FPS</option>`).join('')}</select></label></div>${slider('Độ dày tia (px)','cfgLineWidth',s.lineWidth,.45,2.2,.05)}${slider('Hiệu ứng glow','cfgGlow',s.glow,0,2,.05)}${slider('Sương / haze','cfgHaze',s.haze,0,1,.05)}${slider('Tối đa số tia/frame','cfgMaxBeams',s.maxBeams,12,120,4)}<label class="inline"><input type="checkbox" data-laser-setting="audioReactive" ${s.audioReactive?'checked':''}> Phản ứng mức âm thanh video/nhạc</label><label class="inline"><input type="checkbox" data-laser-setting="strobeEnabled" ${s.strobeEnabled?'checked':''}> Cho phép strobe trong preview (tối đa khoảng 3Hz)</label><div class="laser135-actions"><button data-laser-action="resetSettings">Khôi phục mặc định</button><button data-laser-action="save">Lưu cùng project</button></div><p>Preview hình ảnh laser bằng Canvas2D trên phối cảnh 3D. Không gửi lệnh laser thật, không dùng để lập trình vùng an toàn khán giả. FPS phụ thuộc GPU/CPU và video nguồn.</p></section>`;}
function paintPanel(){if(!L.open)return;panel.innerHTML=`<div class="laser135-header"><div class="laser135-brand"><strong>◈ LASER SHOW / 3D VISUAL</strong><small>FAN · RGB GRID · PAN/TILT · TIMECODE</small></div><button data-laser-action="close" title="Đóng bảng">✕</button></div><div class="laser135-tabs">${[['fixture','Đặt đèn'],['presets','Laser FX'],['timeline','Timecode'],['settings','Cài đặt']].map(([k,v])=>`<button class="${k===L.tab?'selected':''}" data-laser-tab="${k}">${v}</button>`).join('')}</div><div class="laser135-content">${L.tab==='fixture'?fixtureMarkup():L.tab==='presets'?presetMarkup():L.tab==='timeline'?timelineMarkup():settingsMarkup()}</div><div class="laser135-quickbar"><button class="primary" data-laser-action="play">▶ SHOW</button><button data-laser-action="stop">■ STOP</button><button data-laser-action="onoff">${L.active?'LASER ON':'LASER OFF'}</button></div>`;updateHUD();}
function refreshUI(){if(L.open){const sc=panel.querySelector('.laser135-content')?.scrollTop||0;paintPanel();const area=panel.querySelector('.laser135-content');if(area)area.scrollTop=sc;}ensureButtons();}
function handleAction(action){const f=selected();switch(action){case 'close':closeLaser();break;case 'add':addFixture('fan');break;case 'scanner':addFixture('scanner');break;case 'array':addArray(6);break;case 'delete':removeSelected();break;case 'mount':if(S.mount136) {closeLaser();S.mount136.open('laser');}else toast('Chưa khởi động bộ truss.');break;case 'place':L.placing=!L.placing;L.moveMode=false;drawCan.classList.toggle('laser135-pick',L.placing);refreshUI();break;case 'move':L.moveMode=!L.moveMode;L.placing=false;drawCan.classList.toggle('laser135-pick',L.moveMode);refreshUI();break;
 case 'aimLeft':if(f){f.pan-=20;recordSnapshot(true);refreshUI();}break;case 'aimRight':if(f){f.pan+=20;recordSnapshot(true);refreshUI();}break;case 'aimFront':if(f){f.pan=defaultPan(f.pos);recordSnapshot(true);refreshUI();}break;
 case 'play':if(!L.fixtures.length)addArray(6);L.active=true;L.forceLive=true;L.previewPlaying=true;L.previewStart=performance.now();L.previewAt=0;L.buttonState='active';L.buttonStart=performance.now();if(seq.enabled&&laserClips().length){const cue=laserClips().find(c=>c.preset===L.preset);if(cue){L.forceLive=false;seekTimeline(cue.start);setPlaying(true);}}refreshUI();break;
 case 'stop':L.previewPlaying=false;L.forceLive=false;L.previewAt=0;L.active=false;refreshUI();break;case 'onoff':L.active=!L.active;refreshUI();break;
 case 'fullscreen':if(!state.presenting){togglePresentation();positionPanel();}else{L.tab='presets';refreshUI();}break;
 case 'importIlda':ildaInput.click();break;
 case 'addCue':{if(!L.fixtures.length)addArray(6);const a=+id('laser135CueStart')?.value||0,d=+id('laser135CueDuration')?.value||12;saveCue(L.preset,a,d);L.tab='timeline';refreshUI();break;}
 case 'epic':{if(!L.fixtures.length)addArray(6);saveCue('epic',state.time,95);L.preset='epic';L.tab='timeline';refreshUI();break;}
 case 'buildTimecode':buildTimecode136();break;case 'geometryShow':buildGeometryShow138();break;
 case 'record':startRecord();break;case 'mark':recordSnapshot(true);toast('Đã đánh dấu keyframe laser.');break;case 'endRecord':stopRecord();break;
 case 'resetSettings':L.settings={...DEFAULT_SETTINGS};refreshUI();break;case 'save':toast('Cài đặt LASER được lưu khi bấm Lưu dự án .ledstudio.');break;
 }}
function changeValue(el){const prop=el.dataset.laserProp||'',f=selected(),v=el.type==='color'?el.value:parseFloat(el.value);if(prop.startsWith('cfg')){const map={cfgLineWidth:'lineWidth',cfgGlow:'glow',cfgHaze:'haze',cfgMaxBeams:'maxBeams'};L.settings[map[prop]]=v;const out=panel.querySelector(`[data-laser-out="${prop}"]`);if(out)out.textContent=v;return;}
 if(!f)return;
 if(['x','y','z'].includes(prop)){f.pos[{x:0,y:1,z:2}[prop]]=v;if(S.mount136?.constrain)f.pos=S.mount136.constrain(f.pos);}
 else if(['pan','tilt','roll','beamCount','fanAngle','range','intensity','speed'].includes(prop))f[prop]=v;
 else if(['colorA','colorB'].includes(prop))f[prop]=el.value;
 const out=panel.querySelector(`[data-laser-out="${prop}"]`);if(out)out.textContent=(+v).toFixed(el.step&&+el.step<1?2:0)+(prop==='pan'||prop==='tilt'?'°':'');
 recordSnapshot();}
function updateHUD(){if(!L.open)return;const o=id('laser135Clock');if(o){const fps=lighting9?.frameRate||30,frames=Math.max(0,Math.floor(state.time*fps));o.textContent=[Math.floor(frames/(fps*3600)),Math.floor(frames/(fps*60))%60,Math.floor(frames/fps)%60,frames%fps].map(v=>String(v).padStart(2,'0')).join(':');}}
function ensureButtons(){const bar=id('pro127bar');if(bar&&!id('laser135TopBtn')){const b=document.createElement('button');b.id='laser135TopBtn';b.textContent='✦ + LASER / SHOW';b.title='Thêm đầu laser hoặc mở Laser Show';b.onclick=()=>openLaser('fixture');bar.insertBefore(b,bar.querySelector('.bar-state')||null);}
 const present=id('presentControls');if(present&&!id('laser135Launcher')){const b=document.createElement('button');b.id='laser135Launcher';b.type='button';b.innerHTML='<canvas id="laser135MiniCanvas" aria-hidden="true"></canvas><span>✧ LASER SHOW</span>';b.onmouseenter=()=>L.buttonHover=true;b.onmouseleave=()=>L.buttonHover=false;b.onclick=()=>{L.buttonState='active';L.buttonStart=performance.now();openLaser('presets');};present.appendChild(b);}
 const fixtureAdd=id('pro127add');if(fixtureAdd&&!id('laser135FixtureAdd')){const b=document.createElement('button');b.id='laser135FixtureAdd';b.className='primary';b.textContent='✦ LASER RGB';b.onclick=()=>{openLaser('fixture');addFixture('fan');};fixtureAdd.parentElement?.appendChild(b);}
 const tcTools=id('tc134AddCue')?.parentElement;if(tcTools&&!id('laser135CueShortcut')){const b=document.createElement('button');b.id='laser135CueShortcut';b.textContent='+ LASER CUE';b.onclick=()=>openLaser('presets');tcTools.appendChild(b);}
}
panel.addEventListener('click',e=>{const target=e.target.closest('button');if(!target)return;
 if(target.dataset.laserAction)handleAction(target.dataset.laserAction);
 if(target.dataset.laserTab){L.tab=target.dataset.laserTab;paintPanel();}
 if(target.dataset.laserSelect){L.selected=target.dataset.laserSelect;paintPanel();}
 if(target.dataset.laserToggle){const f=L.fixtures.find(x=>x.id===target.dataset.laserToggle);if(f){f.enabled=!f.enabled;paintPanel();}}
 if(target.dataset.laserPreset){L.preset=target.dataset.laserPreset;L.previewPlaying=true;L.forceLive=true;L.previewStart=performance.now();L.previewAt=0;L.active=true;paintPanel();}
 if(target.dataset.laserCue){const cue=laserClips().find(c=>c.id===target.dataset.laserCue);if(cue){L.forceLive=false;seekTimeline(cue.start);setPlaying(true);if(!seq.enabled)enableSequence(true);}}
});
panel.addEventListener('input',e=>{const el=e.target;if(el.matches('[data-laser-prop]'))changeValue(el);if(el.matches('[data-laser-setting]')){const key=el.dataset.laserSetting;L.settings[key]=el.type==='checkbox'?el.checked:key==='fpsCap'?Number(el.value):el.value;}});
panel.addEventListener('change',e=>{if(e.target.matches('input[type=number][data-laser-prop]'))recordSnapshot(true);});
drawCan.addEventListener('pointerdown',e=>{if(!L.placing&&!L.moveMode)return;const rect=drawCan.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
 if(L.moveMode){let nearest=null,dMin=22;for(const f of L.fixtures){const p=engine.project(f.pos);if(!p)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<dMin){nearest=f;dMin=d;}}if(nearest){L.selected=nearest.id;L.drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,base:[...nearest.pos]};drawCan.setPointerCapture(e.pointerId);drawCan.classList.add('laser135-dragging');paintPanel();return;}}
 if(L.placing){const f=selected();if(f){moveAt(e.clientX,e.clientY);L.placing=false;drawCan.classList.remove('laser135-pick');refreshUI();toast('Đã đặt đầu laser lên mô hình.');}}
});
drawCan.addEventListener('pointermove',e=>{if(!L.drag)return;const f=selected();if(!f)return;if(e.shiftKey){f.pos[1]=L.drag.base[1]+(L.drag.y-e.clientY)*.02;}else{const p=planePoint(e.clientX,e.clientY,L.drag.base[1]);if(p){const cl=S.mount136?.constrain?S.mount136.constrain(p):p;f.pos[0]=cl[0];f.pos[2]=cl[2];}}if(S.mount136?.constrain)f.pos=S.mount136.constrain(f.pos);if(S.mount136?.constrain)f.pos=S.mount136.constrain(f.pos);recordSnapshot();const outputs=panel.querySelectorAll('[data-laser-prop="x"],[data-laser-prop="y"],[data-laser-prop="z"]');outputs.forEach(el=>{const axis={x:0,y:1,z:2}[el.dataset.laserProp];el.value=f.pos[axis].toFixed(2);});});
function releaseDrag(){if(!L.drag)return;L.drag=null;drawCan.classList.remove('laser135-dragging');recordSnapshot(true);}
drawCan.addEventListener('pointerup',releaseDrag);drawCan.addEventListener('pointercancel',releaseDrag);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&L.open){if(L.placing||L.moveMode){L.placing=false;L.moveMode=false;drawCan.classList.remove('laser135-pick');refreshUI();}else closeLaser();}},true);
window.addEventListener('resize',()=>{if(L.open)positionPanel();});
new MutationObserver(()=>{if(L.open)positionPanel();}).observe(document.body,{attributes:true,attributeFilter:['class']});
document.addEventListener('click',e=>{if(!L.open)return;const target=e.target instanceof Element?e.target:null;if(!target)return;if(target.closest('#showExit,#exitPresent,#v130Panel,[data-v130-open],#showVJ,#showAudio'))closeLaser();},true);
const livePack=packLiveExtras,liveRestore=restoreLiveExtras,oldSnap=snapshot,oldRestore=restore;
packLiveExtras=async function(){const out=await livePack();out.laser135=settingsSave();return out;};
restoreLiveExtras=async function(data){await liveRestore(data);restoreLaser(data?.laser135);};
snapshot=function(){const out=oldSnap();out.laser135=settingsSave();return out;};
restore=function(s){oldRestore(s);restoreLaser(s?.laser135);};
// Keep browser-driven rendering independent from existing viewport controls & LED mapping.
requestAnimationFrame(tick);ensureButtons();
S.laserShow={open:openLaser,close:closeLaser,addFixture,addArray,saveCue,startRecord,stopRecord,get data(){return settingsSave()},restore:restoreLaser,activeCue,patterns:PRESETS,renderFrame:drawLaserFrame,buildTimecode:buildTimecode136,select(id){const f=L.fixtures.find(x=>x.id===id);if(!f)return false;L.selected=id;refreshUI();return true;},setPosition(id,pos){const f=L.fixtures.find(x=>x.id===id);if(!f)return false;f.pos=S.mount136?.constrain?S.mount136.constrain(pos):pos;recordSnapshot(true);refreshUI();return true;}};
S.version='14.0.0';document.title='ALPHA | Creative LED Studio V14.0 – Truss Layers';
const small=document.querySelector('.brand small');if(small)small.textContent='V13.9 · PRO LASER / TRUSS / TIMECODE';
console.info('Laser Show V13.5 ready: additive 3D-projected Canvas2D preview and Laser Show timecode.');
}catch(error){console.error('Laser Show 13.5 init failed. Stable stage renderer remains active.',error);}
})();

/* V13.6 -- metric stage mount, bounded 6-face placement for normal lights and laser preview. */
(function(){
 'use strict';
 try{
  const S=window.STUDIO;if(!S||!window.document||typeof engine==='undefined'||typeof state==='undefined')return;
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,+v||0));
  const R={knownLights:new Set(engine.lights.map(x=>x.id)),open:false,openedDrawer:false,source:'light',fixtureType:'beam',face:'top',area:null,manual:false,modelKey:'',snapTruss:true,limitBeam:true,interactive:null,points:[],drag:null,lightId:null,laserId:null,guarded:new Set(),lastDraw:0,lastPoll:0,lastBuild:0,lastInfo:'',mountCandidate:0,showROI:true,supportTarget:null,lockSupport:false,moveStep:.10,lastAxisRebuild:0,lastHitName:'',selectionHint:'',trussLayers:[],trussLayerCache:null,trussRevision:0,manualTrussLayers:[],ignoredTrussRefs:[],selectedLayerId:null,overlayLayerOnly:false,meshFilter:'',trussFilter:'all'};
  const nameKey=()=>`${state.model?.name||'MODEL'}::${engine.coordinates?.sourceInfo?.name||''}::${engine.coordinates?.sourceInfo?.byteLength||0}`;
  const mid=(a,b)=>a.map((v,i)=>(v+b[i])*.5);
  const copyB=b=>({min:[...b.min],max:[...b.max]});
  const validB=b=>b&&b.min?.length===3&&b.max?.length===3&&b.min.every(Number.isFinite)&&b.max.every(Number.isFinite)&&b.min.every((v,i)=>b.max[i]-v>.05);
  function autoArea(){
   const all=engine.stageBounds||{min:[-8,0,-5],max:[8,8,5]},surfaces=engine.surfaces.filter(x=>x.enabled!==false&&x.mesh?.bounds);
   let bounds;
   if(surfaces.length){
    const lb={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
    for(const s of surfaces){for(let k=0;k<3;k++){lb.min[k]=Math.min(lb.min[k],s.mesh.bounds.min[k]);lb.max[k]=Math.max(lb.max[k],s.mesh.bounds.max[k]);}}
    const W=Math.max(3.6,lb.max[0]-lb.min[0]),padX=Math.min(4.5,Math.max(1.1,W*.18)), zPad=Math.min(5.2,Math.max(2.0,W*.32));
    const floor=Number.isFinite(all.min[1])?all.min[1]:0;
    bounds={min:[lb.min[0]-padX,floor,lb.min[2]-zPad*.75],max:[lb.max[0]+padX,Math.max(lb.max[1]+1.2,floor+3.2),lb.max[2]+zPad]};
   }else{
    let b=copyB(all),sizes=b.max.map((n,k)=>n-b.min[k]);
    for(let i of [0,2])if(sizes[i]>70){const cx=(b.max[i]+b.min[i])*.5;b.min[i]=cx-18;b.max[i]=cx+18;}
    bounds={min:b.min,max:b.max};
   }
   const candidates=trussCandidates(bounds);
   const upper=candidates.filter(c=>c.score>=3.5).slice(0,10);
   if(upper.length){bounds.max[1]=Math.max(bounds.max[1],...upper.map(c=>c.bounds.max[1]+.4));const xs=upper.flatMap(c=>[c.bounds.min[0],c.bounds.max[0]]);bounds.min[0]=Math.min(bounds.min[0],...xs)-.15;bounds.max[0]=Math.max(bounds.max[0],...xs)+.15;}
   // Never auto-extend the placement zone beyond the actual imported stage bounds.
   for(let i=0;i<3;i++){
     const low=all.min[i],high=all.max[i];
     if(Number.isFinite(low)&&Number.isFinite(high)&&high-low>.2){
       bounds.min[i]=Math.max(bounds.min[i],low+.02);
       bounds.max[i]=Math.min(bounds.max[i],high-.02);
       if(bounds.max[i]-bounds.min[i]<.12){bounds.min[i]=low+.02;bounds.max[i]=high-.02;}
     }
   }
   const w=bounds.max[0]-bounds.min[0]; if(w>75){const center=(bounds.max[0]+bounds.min[0])*.5;bounds.min[0]=center-37.5;bounds.max[0]=center+37.5;}
   return bounds;
  }
  function ensureArea(){const key=nameKey();if(R.modelKey!==key){R.modelKey=key;R.manual=false;R.manualTrussLayers=[];R.ignoredTrussRefs=[];R.selectedLayerId=null;R.trussLayerCache=null;R.trussRevision++;R.area=autoArea();R.guarded.clear();}if(!validB(R.area))R.area=autoArea();return R.area;}
  function getArea(){return copyB(ensureArea());}
  function constrain(p,pad=.09){const b=ensureArea();return p.map((v,i)=>{const a=b.min[i]+pad,z=b.max[i]-pad;return clamp(Number.isFinite(v)?v:(a+z)/2,Math.min(a,z),Math.max(a,z));});}
  function inside(p,margin=0){const b=ensureArea();return p.every((v,i)=>v>=b.min[i]-margin&&v<=b.max[i]+margin);}
  function updateArea(b,manual=true){if(!validB(b))return false;const whole=engine.stageBounds;if(whole&&validB(whole)){
    b=copyB(b);for(let i=0;i<3;i++){
      b.min[i]=Math.max(b.min[i],whole.min[i]+.02);
      b.max[i]=Math.min(b.max[i],whole.max[i]-.02);
    }
    if(!validB(b))return false;
   }R.area=copyB(b);R.manual=manual;render();return true;}
  // TRUSS LAYERS V14.0: aggregate named GLB hierarchies and short rods into spatial groups.
  // A short tube, brace, or node does not need to be a single long object to be recognized.
  const trussWord=/(?:truss|rigging|light(?:ing)?[ _.-]*(?:grid|rig|bar|truss)|batten|cross[ _.-]*beam|pipe[ _.-]*rig|tower|vertical[ _.-]*rig|upright|thanh[ _.-]*(?:ngang|doc)|dan[ _.-]*treo|gia[ _.-]*treo|treo[ _.-]*den|gi[aà]n[ _.-]*treo|thanh[ _.-]*d[oọ]c|c[oộ]t[ _.-]*truss)/i;
  const rejectTruss=/(?:^|[\/_ .-])(?:led|screen|display|video|artwork|logo|text|terrain|water|hill|mountain|backdrop|floor|ground|seat|chair|performer|person|human|figure|dancer|drummer|lens|gobo|speaker|scenic|scenery)(?:$|[\/_ .-])/i;
  function meshRef140(mesh,index){const i=Number.isInteger(index)?index:engine.stage.indexOf(mesh);const center=mesh.bounds?.center||mid(mesh.bounds.min,mesh.bounds.max);return [mesh.path||mesh.nodePath||'',mesh.name||'',Array.from(center,n=>Number(n).toFixed(2)).join('_'),i].join('|');}
  function findMesh140(ref){const all=engine.stage||[];let m=all.find(x=>meshRef140(x)===ref);if(m)return m;const parts=String(ref).split('|');m=all.find(x=>x.path===parts[0]&&x.name===parts[1]);if(m)return m;return all.find(x=>x.name===parts[1]);}
  const bboxUnion140=(all)=>{const b={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};for(const m of all){for(let i=0;i<3;i++){b.min[i]=Math.min(b.min[i],m.bounds.min[i]);b.max[i]=Math.max(b.max[i],m.bounds.max[i]);}}return b;};
  const stableCode140=t=>{let h=2166136261;for(let i=0;i<t.length;i++)h=Math.imul(h^t.charCodeAt(i),16777619);return (h>>>0).toString(36);};
  function namedAncestor140(m){const chain=Array.isArray(m.nodeChain)?m.nodeChain:[];
   for(let i=chain.length-1;i>=0;i--){const name=String(chain[i]?.name||'');if(trussWord.test(name)&&!rejectTruss.test(name))return chain.slice(0,i+1).map(n=>n.id||n.name).join('/');}
   const p=String(m.path||m.nodePath||'').split('/');for(let i=p.length-1;i>=0;i--)if(trussWord.test(p[i])&&!rejectTruss.test(p[i]))return p.slice(0,i+1).join('/');
   return trussWord.test(m.name||'')?String(m.name||''):'';
  }
  function layerZone140(c,b,axis){const d=b.max.map((v,i)=>Math.max(.25,v-b.min[i]));const norm=i=>(c[i]-b.min[i])/d[i];
   const x=norm(0)<.29?'L':norm(0)>.71?'R':'C', z=norm(2)<.28?'B':norm(2)>.72?'F':'M';
   const y=norm(1)>.74?'HIGH':norm(1)>.43?'MID':'LOW';
   if(axis===1)return `SIDE_${x}_${z}`;
   if(axis===0)return `OVER_${y}_${z}`;
   return `SIDE_${x}_${y}`;
  }
  function buildTrussLayers140(){const b=engine.stageBounds&&validB(engine.stageBounds)?engine.stageBounds:(R.area&&validB(R.area)?R.area:{min:[-8,0,-5],max:[8,7,5]});
   const dim=b.max.map((v,i)=>Math.max(.5,v-b.min[i]));const ignored=new Set(R.ignoredTrussRefs);const groups=new Map();
   let idx=0;
   for(const m of engine.stage||[]){idx++;if(!m?.bounds?.min?.every(Number.isFinite)||!m.bounds.max?.every(Number.isFinite))continue;
    const ref=meshRef140(m,idx-1);if(ignored.has(ref))continue;
    const sz=m.bounds.max.map((v,i)=>Math.max(0,v-m.bounds.min[i])),ordered=[...sz].sort((a,b)=>a-b),major=sz.indexOf(Math.max(...sz)),cen=mid(m.bounds.min,m.bounds.max);
    const ancestor=namedAncestor140(m);const named=!!ancestor;const bad=rejectTruss.test(String(m.name||'')+' '+String(m.path||''))&&!named;
    const slender=ordered[2]>.28&&ordered[2]>=Math.max(.07,ordered[1])*2.7&&ordered[0]<=Math.max(.36,ordered[2]*.15);
    const high=cen[1]>b.min[1]+Math.max(.8,dim[1]*.26),outer=(cen[0]<b.min[0]+dim[0]*.24||cen[0]>b.max[0]-dim[0]*.24);
    const candidate=!bad&&(named||(slender&&(high||outer)));
    if(!candidate)continue;
    const zone=layerZone140(cen,b,major);
    // Named hierarchy is a strong grouping signal; spatial zone prevents a single
    // 'Truss_All' parent from merging the entire venue into one unplaceable box.
    const yBand=Math.floor((cen[1]-b.min[1])/Math.max(.50,dim[1]/7));
    const zBand=Math.floor((cen[2]-b.min[2])/Math.max(.65,dim[2]/5));
    const path=ancestor?ancestor.split('/').slice(-2).join('/'):'GEOMETRY';
    const key=`${named?'NAMED':'AUTO'}:${path}:${zone}:${major===1?zBand:yBand}`;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push({mesh:m,named,major,sz,ref});
   }
   const layers=[];
   for(const [key,items] of groups){if(items.length===1&&!items[0].named&&items[0].sz[items[0].major]<.75)continue;
    const meshes=items.map(x=>x.mesh),bounds=bboxUnion140(meshes),cen=mid(bounds.min,bounds.max),ranges=bounds.max.map((v,i)=>v-bounds.min[i]);
    const votes=[0,0,0];for(const x of items)votes[x.major]+=Math.max(.1,x.sz[x.major]);
    const axis=votes.indexOf(Math.max(...votes)),orientation=axis===1?'vertical':'horizontal',named=items.some(x=>x.named);
    const zone=layerZone140(cen,b,axis),layerName=(orientation==='vertical'?'TRUSS ĐỨNG':'TRUSS NGANG')+' · '+(zone.includes('SIDE_L')?'TRÁI':zone.includes('SIDE_R')?'PHẢI':zone.includes('_B')?'SAU':zone.includes('_F')?'TRƯỚC':'TRUNG TÂM');
    const id='AUTO_'+stableCode140(key),mesh=items[0].mesh;
    layers.push({id,layerId:id,key,kind:'auto',name:layerName,bounds,center:cen,axis,orientation,score:(named?6:2)+Math.min(3,items.length*.2),named,mesh,meshes,meshRefs:items.map(x=>x.ref),count:items.length,zone});
   }
   for(const manual of R.manualTrussLayers){const meshes=(manual.refs||[]).map(findMesh140).filter(Boolean);if(!meshes.length)continue;
    const bounds=bboxUnion140(meshes),cen=mid(bounds.min,bounds.max),sizes=bounds.max.map((v,i)=>v-bounds.min[i]);const axis=sizes.indexOf(Math.max(...sizes));
    layers.push({id:manual.id,layerId:manual.id,key:manual.id,kind:'manual',name:manual.name||'TRUSS TỰ CHỌN',bounds,center:cen,axis,orientation:axis===1?'vertical':'horizontal',score:10,named:true,mesh:meshes[0],meshes,meshRefs:manual.refs,count:meshes.length,zone:'MANUAL'});
   }
   layers.sort((a,b)=>(a.kind==='manual'?-1:0)-(b.kind==='manual'?-1:0)||b.score-a.score||b.center[1]-a.center[1]);
   return layers.slice(0,110);
  }
  function trussCandidates(bounds){const key=nameKey()+'|'+engine.stage.length+'|'+R.trussRevision;
    if(!R.trussLayerCache||R.trussLayerCache.key!==key){R.trussLayerCache={key,items:buildTrussLayers140()};}
    R.trussLayers=R.trussLayerCache.items;
    return R.trussLayers;
  }
  function refreshTruss140(){R.trussRevision++;R.trussLayerCache=null;const out=trussCandidates(ensureArea());if(R.selectedLayerId&&!out.find(x=>x.id===R.selectedLayerId))R.selectedLayerId=null;render();return out;}
  function makeManualLayer140(mesh,createNew=false){if(!mesh)return false;const ref=meshRef140(mesh);let group=!createNew?R.manualTrussLayers.find(x=>x.id===R.selectedLayerId):null;
    if(!group){group={id:'MANUAL_'+stableCode140(ref+String(R.manualTrussLayers.length)),name:'TRUSS TỰ CHỌN '+(R.manualTrussLayers.length+1),refs:[]};R.manualTrussLayers.push(group);}
    if(!group.refs.includes(ref))group.refs.push(ref);
    R.ignoredTrussRefs=R.ignoredTrussRefs.filter(x=>x!==ref);R.selectedLayerId=group.id;refreshTruss140();toast('Đã đưa '+(mesh.name||'mesh')+' vào '+group.name);return true;
  }
  function getActiveLayer140(){return trussCandidates(ensureArea()).find(x=>x.id===R.selectedLayerId)||null;}
  function layerByMesh140(mesh){return trussCandidates(ensureArea()).find(l=>l.meshes.includes(mesh))||null;}
  function removeLayer140(id){const group=R.manualTrussLayers.find(x=>x.id===id);if(group){R.manualTrussLayers=R.manualTrussLayers.filter(x=>x.id!==id);}else{
    const layer=trussCandidates(ensureArea()).find(x=>x.id===id);if(layer)R.ignoredTrussRefs.push(...layer.meshRefs.filter(ref=>!R.ignoredTrussRefs.includes(ref)));
  }R.selectedLayerId=null;refreshTruss140();}
  function snapToTruss(p,force=false){const can=trussCandidates(ensureArea());if(!can.length)return [...p];let best=null,dist=Infinity;
   for(const c of can){const b=c.bounds,m=c.center,axis=c.axis,point=[...m];
    if(c.orientation==='vertical'){
      point[0]=clamp(p[0],b.min[0],b.max[0]);
      point[1]=clamp(p[1],b.min[1],b.max[1]);
      point[2]=clamp(p[2],b.min[2],b.max[2]);
    }else{
      point[axis]=clamp(p[axis],b.min[axis],b.max[axis]);
      point[1]=b.min[1]-Math.max(.05,Math.min(.22,(b.max[1]-b.min[1])*.5));
    }
    const d=Math.hypot((p[0]-point[0])*1,(p[1]-point[1])*.55,(p[2]-point[2])*1);
    if(d<dist){dist=d;best=point;}}
   const b=ensureArea(),threshold=Math.max(1.2,Math.min(3.8,(b.max[1]-b.min[1])*.28));return best&&(force||dist<=threshold)?constrain(best):constrain(p);
  }
  function defaultPoint(kind='laser',i=0,n=1){const b=ensureArea(),x=b.min[0]+(b.max[0]-b.min[0])*(.15+.7*((i+.5)/Math.max(1,n))),y=b.max[1]-.23,z=(b.min[2]+b.max[2])/2-(b.max[2]-b.min[2])*.14;
   return R.snapTruss?snapToTruss([x,y,z],true):constrain([x,y,z]);
  }
  function centerTarget(){const b=ensureArea();return [(b.min[0]+b.max[0])/2,b.min[1]+Math.min(1.5,(b.max[1]-b.min[1])*.35),(b.min[2]+b.max[2])/2+.8];}
  function aimLaser(f){const d=centerTarget().map((v,i)=>v-f.pos[i]);f.pan=Math.atan2(d[0],d[2])*180/Math.PI;f.tilt=Math.atan2(d[1],Math.hypot(d[0],d[2]))*180/Math.PI;return f;}
  function clipBeam(a,b){if(!R.limitBeam||!inside(a,.25))return b;const bounds=ensureArea(),pad=[Math.max(1,(bounds.max[0]-bounds.min[0])*.25),1.5,Math.max(2,(bounds.max[2]-bounds.min[2])*.8)],lo=bounds.min.map((v,i)=>v-pad[i]),hi=bounds.max.map((v,i)=>v+pad[i]);let maxT=1;for(let i=0;i<3;i++){let d=b[i]-a[i];if(Math.abs(d)<1e-7)continue;let t=((d>0?hi[i]:lo[i])-a[i])/d;if(t>0)maxT=Math.min(maxT,t);}return b.map((v,i)=>a[i]+(v-a[i])*maxT);}
  function selected(){if(R.source==='laser'){const list=S.laser135?.fixtures||[],f=list.find(x=>x.id===R.laserId)||list.find(x=>x.id===S.laser135.selected)||list.at(-1);if(f)R.laserId=f.id;return f;}let f=engine.lights.find(x=>x.id===R.lightId)||engine.lights.find(x=>x.id===S.pro127?.selected)||engine.lights.at(-1);if(f)R.lightId=f.id;return f;}
  function getPos(){return selected()?.pos||defaultPoint(R.source);}
  function ensureFixture(){let f=selected();if(f)return f;addNew();f=selected();if(!f)toast('Chọn nguồn đèn hoặc bấm + THÊM ĐÈN trước khi gắn.');return f;}
  function supportForMesh(mesh){if(!mesh?.bounds)return null;const list=trussCandidates(ensureArea()),known=list.find(c=>c.meshes.includes(mesh));if(known)return known;
    const b=mesh.bounds,size=b.max.map((v,i)=>v-b.min[i]),axis=size.indexOf(Math.max(...size));return{mesh,bounds:b,name:mesh.name||'Object',center:mid(b.min,b.max),axis,orientation:axis===1?'vertical':'horizontal',named:false,score:0};
  }
  function supportFromStored(data){if(!data)return null;const grouped=data.layerId?trussCandidates(ensureArea()).find(x=>x.id===data.layerId):null;if(grouped)return grouped;const meshes=engine.stage||[];let mesh=meshes.find(m=>m.id===data.meshId&&m.name===data.meshName);
    if(!mesh&&data.meshIndex>=0&&meshes[data.meshIndex]?.name===data.meshName)mesh=meshes[data.meshIndex];
    if(!mesh)mesh=meshes.find(m=>m.name===data.meshName&&(!data.meshPath||m.path===data.meshPath));
    return supportForMesh(mesh);
  }
  function nearestMember140(s,p){if(s.pointMesh)return s.pointMesh;const members=s.meshes?.length?s.meshes:[s.mesh];if(!members.length)return s.mesh;
    let best=members[0],dist=Infinity;
    for(const mesh of members){const b=mesh.bounds;if(!b)continue;const d=Math.hypot(...p.map((v,i)=>v-clamp(v,b.min[i],b.max[i])));
      if(d<dist){best=mesh;dist=d;}}
    return best;
  }
  function contactOnSupport140(s,p){const mesh=nearestMember140(s,p),b=mesh?.bounds||s.bounds;
    return {mesh,contact:p.map((v,i)=>clamp(v,b.min[i],b.max[i]))};
  }
  function nearestPointOnSupport(s,p){const {mesh,contact}=contactOnSupport140(s,p||s.center),b=mesh?.bounds||s.bounds,point=[...contact],axis=s.axis;
    if(axis===1){point[1]=clamp(p?.[1]??point[1],b.min[1],b.max[1]);point[0]=b.max[0]+.10;}
    else{point[axis]=clamp(p?.[axis]??point[axis],b.min[axis],b.max[axis]);point[1]=b.min[1]-.12;}
    return constrain(point,.018);
  }
  function bindFixtureToSupport(s,contact=null){if(!s||!s.mesh)return false;const f=ensureFixture();if(!f)return false;
    const hitpoint=Array.isArray(contact)&&contact.every(Number.isFinite)?contact:s.center;
    const snap=contactOnSupport140(s,hitpoint);
    const world=nearestPointOnSupport(s,hitpoint),oldPos=[...f.pos];
    setPos(world,true);
    const anchor=[...snap.contact]; const mesh=snap.mesh||s.mesh;
    f.mount139={meshId:mesh.id,meshIndex:engine.stage.indexOf(mesh),meshName:mesh.name||'Object',meshPath:mesh.path||'',contact:anchor,offset:f.pos.map((v,i)=>v-anchor[i]),axis:s.axis,orientation:s.orientation||'horizontal',locked:false,layerId:s.layerId||null,layerName:s.layerId?s.name:null};
    R.supportTarget=s;R.lockSupport=false;R.lastHitName=mesh.name||'Object';
    if(R.source==='laser'){S.laser135.selected=f.id;S.laser135.active=true;}
    R.selectionHint='Gắn '+f.name+' lên '+R.lastHitName+'; có thể kéo tiếp theo X, Y, Z.';
    render();return true;
  }
  function sourceAt(x,y,restrictLayer=null){const hit=engine.pick(x,y,false);const candidates=trussCandidates(ensureArea());const rect=overlay.getBoundingClientRect(),mx=x-rect.left,my=y-rect.top;
    const pool=restrictLayer?candidates.filter(c=>c.id===restrictLayer):candidates;
    const hitLayer=hit?.mesh?pool.find(l=>l.meshes.includes(hit.mesh)):null;
    if(hitLayer)return {support:{...hitLayer,pointMesh:hit.mesh},point:hit.point||hitLayer.center};
    let closest=null,best=restrictLayer?90:21;
    for(const c of pool){const p0=[...c.center],p1=[...c.center];p0[c.axis]=c.bounds.min[c.axis];p1[c.axis]=c.bounds.max[c.axis];
      const a=engine.project(p0),b=engine.project(p1);if(!a||!b||!Number.isFinite(a.x+a.y+b.x+b.y))continue;
      const vx=b.x-a.x,vy=b.y-a.y,div=Math.max(1,vx*vx+vy*vy),t=Math.max(0,Math.min(1,((mx-a.x)*vx+(my-a.y)*vy)/div));
      const d=Math.hypot(mx-(a.x+vx*t),my-(a.y+vy*t));if(d<best){closest={support:c,point:p0.map((v,i)=>v+(p1[i]-v)*t)};best=d;}
    }
    return closest;
  }
  function axisWorldSegments(){const f=selected();if(!f||!engine.vp)return[];const range=ensureArea(),span=Math.max(...range.max.map((v,i)=>v-range.min[i]));const len=Math.max(.6,Math.min(1.7,span*.085));
    const home=engine.project(f.pos);if(!home)return[];
    const colors=['#ff6965','#75ed9b','#61adff'];const names=['X','Y','Z'];const result=[];
    for(let i=0;i<3;i++){const v=[...f.pos];v[i]+=len;const end=engine.project(v);if(!end)continue;
      result.push({axis:i,name:names[i],color:colors[i],a:home,b:end,dir:[end.x-home.x,end.y-home.y],length:len});}
    return result;
  }
  function hitAxisAt(clientX,clientY){const r=overlay.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;let best=null,dmin=18;
    for(const seg of axisWorldSegments()){
      const dx=seg.dir[0],dy=seg.dir[1],n=dx*dx+dy*dy;if(n<100)continue;
      const t=Math.max(.28,Math.min(1.15,((x-seg.a.x)*dx+(y-seg.a.y)*dy)/n));
      const dist=Math.hypot(x-(seg.a.x+t*dx),y-(seg.a.y+t*dy));if(dist<dmin){dmin=dist;best=seg;}
    }
    return best;
  }
  function slideToAxis(p,axis,base){const f=selected(),s=supportFromStored(f?.mount139);if(!s||!f?.mount139?.locked)return p;
    // Locked fixture stays on its support: slide along the truss's longest axis.
    if(axis!==s.axis)return[...base];const b=s.bounds;const q=[...base];q[axis]=clamp(p[axis],b.min[axis],b.max[axis]);return q;
  }
  function setPos(p,update=true){const f=selected();if(!f)return false;const next=constrain(p,.025),prev=[...f.pos];f.pos=[...next];if(f.mount139?.contact)f.mount139.offset=next.map((v,i)=>v-f.mount139.contact[i]);
   if(R.source==='light'){
    const delta=next.map((v,i)=>v-prev[i]);f.target=(f.target||centerTarget()).map((v,i)=>v+delta[i]);f.sweep=false;f.origin='placed';f.mount136=true;R.guarded.add(f.id);
    if(update)engine.rebuildFixtures();
   }else{f.mount136=true;S.laser135.selected=f.id;}
   if(update)render();return true;
  }
  function setAim(pan,tilt){const f=selected();if(!f)return;
   if(R.source==='laser'){f.pan=clamp(pan,-180,180);f.tilt=clamp(tilt,-89,89);}
   else{const dir=[Math.sin(pan*Math.PI/180)*Math.cos(tilt*Math.PI/180),Math.sin(tilt*Math.PI/180),Math.cos(pan*Math.PI/180)*Math.cos(tilt*Math.PI/180)];const n=Math.max(1,Math.hypot(...f.target.map((v,i)=>v-f.pos[i])));f.target=dir.map((v,i)=>f.pos[i]+v*n);f.pan127=pan;f.tilt127=tilt;f.sweep=false;engine.rebuildFixtures();}
  }
  function addNew(){if(R.source==='laser'){
    const f=S.laserShow?.addFixture('fan',defaultPoint('laser',S.laser135.fixtures.length,S.laser135.fixtures.length+1));if(!f)return;R.laserId=f.id;aimLaser(f);f.mount136=true;}
   else{
    const f=S.fixture128?.add(R.fixtureType,defaultPoint('light',engine.lights.length,engine.lights.length+1));if(!f)return;R.lightId=f.id;f.mount136=true;R.guarded.add(f.id);f.target=centerTarget();engine.rebuildFixtures();}
   render();
  }
  function applyTruss(index){const c=trussCandidates(ensureArea())[index];if(!c)return false;R.selectedLayerId=c.id;const result=bindFixtureToSupport(c,c.center);if(result){if(R.source==='laser')aimLaser(selected());toast('Đã gắn đèn vào '+c.name+'. Chọn Kéo X/Y/Z để di chuyển.');}return result;}
  function facePlane(){const b=ensureArea(),f=R.face;return f==='top'?{axis:1,value:b.max[1]-.12}:f==='bottom'?{axis:1,value:b.min[1]+.12}:f==='front'?{axis:2,value:b.max[2]-.12}:f==='back'?{axis:2,value:b.min[2]+.12}:f==='left'?{axis:0,value:b.min[0]+.12}:{axis:0,value:b.max[0]-.12};}
  function rayAt(x,y,axis,value){const box=engine.canvas?.getBoundingClientRect();if(!box?.width||!box?.height||!engine.vp)return null;
   try{const nx=(x-box.left)/box.width*2-1,ny=1-(y-box.top)/box.height*2,iv=M.inverse(engine.vp),a=M.point(iv,[nx,ny,-1]),b=M.point(iv,[nx,ny,1]),d=b.map((v,i)=>v-a[i]);if(Math.abs(d[axis])<.000001)return null;const t=(value-a[axis])/d[axis];if(!Number.isFinite(t)||t<0)return null;return a.map((v,i)=>v+d[i]*t);}catch(e){return null;}
  }
  function pointAt(clientX,clientY){const hit=engine.pick(clientX,clientY,false),plane=facePlane();let point=null;R.lastHitName='';
   if(hit?.point){point=[...hit.point];if(Array.isArray(hit.normal)&&hit.normal.length===3)point=point.map((v,i)=>v+hit.normal[i]*.08);R.lastHitName=hit.mesh?.name||'';}
   if(!point)point=rayAt(clientX,clientY,plane.axis,plane.value);
   if(!point)return null;
   if(R.snapTruss){const c=trussCandidates(ensureArea()).find(c=>c.mesh===hit?.mesh);
     if(c)point=nearestPointOnSupport(c,point);
     else if(!hit?.point&&R.face==='top')point=snapToTruss(point,false);
   }
   return constrain(point,.025);
  }
  function setCamera(face){R.face=face;engine.view='stage';state.orbit=false;const b=ensureArea(),c=engine.camera||{},tar=mid(b.min,b.max),w=b.max[0]-b.min[0],h=b.max[1]-b.min[1],z=b.max[2]-b.min[2],span=Math.max(w,h,z,5);
   if(!Number.isFinite(R.baseYaw))R.baseYaw=c.yaw||0;
   const yaw=R.baseYaw;
   const views={front:[yaw,0.075],back:[yaw+Math.PI,0.075],left:[yaw-Math.PI/2,.10],right:[yaw+Math.PI/2,.10],top:[yaw,1.485],bottom:[yaw,-1.45]};
   c.yaw=views[face][0];c.pitch=views[face][1];c.target=tar;c.distance=span*(face==='top'||face==='bottom'?1.5:1.7);c.fov=c.fov||45;engine._fitOnResize=false;
   render();
  }
  const overlay=document.createElement('canvas');overlay.id='mount136Overlay';overlay.setAttribute('aria-label','Khoanh vùng và đặt đèn vào sân khấu');document.getElementById('viewport')?.appendChild(overlay);
  const ctx=overlay.getContext('2d',{alpha:true});
  function drawOverlay(now){requestAnimationFrame(drawOverlay);if(state.presenting||document.body.classList.contains("show137-editor-clean")||!R.open){ctx.clearRect(0,0,overlay.width,overlay.height);return;}if(now-R.lastDraw<30)return;R.lastDraw=now;const w=overlay.clientWidth,h=overlay.clientHeight;if(!w||!h||!engine.vp)return;const ratio=Math.min(1.6,window.devicePixelRatio||1),cw=Math.round(w*ratio),ch=Math.round(h*ratio);if(overlay.width!==cw||overlay.height!==ch){overlay.width=cw;overlay.height=ch;}ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
   const b=ensureArea(),corners=[];
   for(let y of [b.min[1],b.max[1]])for(let z of [b.min[2],b.max[2]])for(let x of [b.min[0],b.max[0]]){const p=engine.project([x,y,z]);corners.push(p);}
   if(corners.some(p=>!p||!Number.isFinite(p.x+p.y)))return;
   const drawLine=(a,b,col='#36d9c2',width=1.2)=>{ctx.beginPath();ctx.moveTo(corners[a].x,corners[a].y);ctx.lineTo(corners[b].x,corners[b].y);ctx.strokeStyle=col;ctx.lineWidth=width;ctx.stroke();};
   ctx.save();ctx.setLineDash([5,4]);ctx.globalAlpha=.78;
   if(R.showROI&&!R.overlayLayerOnly)for(let i=0;i<8;i++){if((i&1)===0)drawLine(i,i+1);if((i&2)===0)drawLine(i,i+2);if((i&4)===0)drawLine(i,i+4);}ctx.setLineDash([]);
   const trusses=trussCandidates(b).slice(0,60);
   ctx.lineWidth=2.2;if(R.showROI)for(const c of trusses){if(R.overlayLayerOnly&&c.id!==R.selectedLayerId)continue;const a=[...c.center],bb=[...c.center],axis=c.axis;a[axis]=c.bounds.min[axis];bb[axis]=c.bounds.max[axis];if(axis!==1)a[1]=bb[1]=c.bounds.min[1];const pa=engine.project(a),pb=engine.project(bb);if(!pa||!pb)continue;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.strokeStyle=c.id===R.selectedLayerId?'rgba(0,255,188,.98)':c.kind==='manual'?'rgba(249,195,81,.90)':c.named?'rgba(255,189,98,.57)':'rgba(141,195,255,.28)';ctx.lineWidth=c.id===R.selectedLayerId?5.0:1.7;ctx.stroke();}
   const f=selected();if(f){const p=engine.project(f.pos);if(p){ctx.fillStyle='#ffb95c';ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.font='bold 11px Segoe UI';ctx.fillText(R.source==='laser'?'LASER':'MOVING HEAD',p.x+12,p.y-9);}}
   if(R.points.length){for(let i=0;i<R.points.length;i++){const p=engine.project(R.points[i]);if(!p)continue;ctx.fillStyle='#5fffd1';ctx.fillRect(p.x-5,p.y-5,10,10);ctx.fillStyle='white';ctx.fillText(String(i+1),p.x+8,p.y-4);}}
   const mount=selected()?.mount139,contact=mount?.contact;
   if(contact&&contact.every(Number.isFinite)){
    const from=engine.project(selected().pos),to=engine.project(contact);
    if(from&&to){ctx.beginPath();ctx.setLineDash([3,3]);ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.strokeStyle='#ffe2a5';ctx.lineWidth=1.6;ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='#e7ad4a';ctx.beginPath();ctx.arc(to.x,to.y,5,0,Math.PI*2);ctx.fill();}
   }
   if(R.interactive==='axis'){
    ctx.font='bold 12px Segoe UI';ctx.lineWidth=3;ctx.setLineDash([]);
    for(const seg of axisWorldSegments()){
      const a=seg.a,b=seg.b,d=seg.dir,n=Math.hypot(...d);if(n<7)continue;
      ctx.strokeStyle=seg.color;ctx.fillStyle=seg.color;ctx.shadowColor=seg.color;ctx.shadowBlur=6;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.shadowBlur=0;
      const dx=d[0]/n,dy=d[1]/n;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-dx*12-dy*5,b.y-dy*12+dx*5);ctx.lineTo(b.x-dx*12+dy*5,b.y-dy*12-dx*5);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.arc(b.x,b.y,12,0,Math.PI*2);ctx.fillStyle='#111c2b';ctx.fill();ctx.strokeStyle=seg.color;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=seg.color;ctx.fillText(seg.name,b.x-4,b.y+4);
    }
   }
   ctx.restore();
  }
  function setInteractive(type){R.interactive=type;R.points=[];R.drag=null;overlay.classList.toggle('active',!!type);overlay.style.cursor=['roi','place','support','layerPoint','tagTruss'].includes(type)?'crosshair':type==='axis'?'move':'auto';render();}
  overlay.addEventListener('pointerdown',e=>{if(!R.interactive)return;e.preventDefault();e.stopPropagation();
   if(R.interactive==='axis'){
     const seg=hitAxisAt(e.clientX,e.clientY);const f=selected();if(!f){toast('Chọn 1 fixture rồi kéo trục X, Y hoặc Z.');return;}
     if(!seg){toast('Bấm trực tiếp vào mũi tên X đỏ / Y xanh lá / Z xanh dương để kéo.');return;}
     const start=[e.clientX,e.clientY],unit=[...f.pos],c0=engine.project(unit),pt=[...unit];pt[seg.axis]+=1;const c1=engine.project(pt),sx=c1.x-c0.x,sy=c1.y-c0.y;
     if(Math.hypot(sx,sy)<10){toast('Góc camera đang nhìn dọc trục '+seg.name+'. Chuyển 3/4 hoặc dùng nút ±'+seg.name+'.');return;}
     R.drag={axis:seg.axis,id:f.id,source:R.source,start,origin:unit,sx,sy};overlay.setPointerCapture(e.pointerId);return;
   }
   if(R.interactive==='tagTruss'){const hit=engine.pick(e.clientX,e.clientY,false);if(hit?.mesh){makeManualLayer140(hit.mesh);setInteractive(null);}else toast('Không tìm thấy mesh tại điểm click. Hãy dùng ô tìm object theo tên bên dưới.');return;}
   if(R.interactive==='layerPoint'){const c=getActiveLayer140();if(!c){toast('Chọn một Truss Layer trước.');return;}const hit=sourceAt(e.clientX,e.clientY,c.id);if(!hit){toast('Click lên đường truss được tô sáng để đặt đèn.');return;}if(bindFixtureToSupport(hit.support,hit.point)){setInteractive(null);toast('Đã gắn vào '+c.name+' tại vị trí vừa click.');}return;}
   if(R.interactive==='support'){
     const hit=sourceAt(e.clientX,e.clientY);if(!hit){toast('Chưa nhận diện được thanh tại vị trí click. Chọn Truss Layer hoặc đánh dấu object thủ công.');return;}
     const result=bindFixtureToSupport(hit.support,hit.point);if(result){toast('Đã gắn '+selected()?.name+' vào '+hit.support.name+' · Bây giờ kéo XYZ hoặc chỉnh toạ độ.');setInteractive(null);}return;
   }
   if(R.interactive==='roi'){
     const b=ensureArea(),p=rayAt(e.clientX,e.clientY,1,b.min[1]+.06)||engine.pick(e.clientX,e.clientY,false)?.point;if(!p)return;R.points.push(p);
     if(R.points.length>=2){const [a,z]=R.points,old=ensureArea();const mm={min:[Math.min(a[0],z[0]),old.min[1],Math.min(a[2],z[2])],max:[Math.max(a[0],z[0]),old.max[1],Math.max(a[2],z[2])]};
      if(mm.max[0]-mm.min[0]<1||mm.max[2]-mm.min[2]<1){R.points=[];toast('Vùng phải rộng và sâu ít nhất 1 m.');return;}
      updateArea(mm,true);R.points=[];setInteractive(null);toast('Đã khoanh vùng; thao tác XYZ sẽ không vượt giới hạn.');}return;
   }
   if(R.interactive==='place'){
     const hit=sourceAt(e.clientX,e.clientY);
     if(hit){bindFixtureToSupport(hit.support,hit.point);toast('Đã click và gắn đèn vào '+hit.support.name+'.');}
     else{const p=pointAt(e.clientX,e.clientY);if(p){ensureFixture();setPos(p);toast('Đã đặt đèn theo mặt '+R.face+'.');}else toast('Không tìm thấy điểm 3D phù hợp, hãy chọn mặt TRÊN hoặc Front.');}
     setInteractive(null);return;
   }
  });
  overlay.addEventListener('pointermove',e=>{if(!R.drag||R.interactive!=='axis')return;e.preventDefault();const d=R.drag;
    const dx=e.clientX-d.start[0],dy=e.clientY-d.start[1],value=(dx*d.sx+dy*d.sy)/Math.max(1,d.sx*d.sx+d.sy*d.sy);
    const p=[...d.origin];p[d.axis]+=value;setPos(slideToAxis(p,d.axis,d.origin),false);
    if(R.source==='light'&&performance.now()-R.lastAxisRebuild>60){R.lastAxisRebuild=performance.now();engine.rebuildFixtures();}
  });
  function releaseDrag(){if(!R.drag)return;R.drag=null;if(R.source==='light')engine.rebuildFixtures();render();}
  overlay.addEventListener('pointerup',releaseDrag);overlay.addEventListener('pointercancel',releaseDrag);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&R.interactive){setInteractive(null);e.preventDefault();}},true);
  const right=document.querySelector('.right-panel');
  const panel=document.createElement('section');panel.id='mount136Panel';panel.hidden=true;right?.appendChild(panel);
  const faceNames={top:'TRÊN',bottom:'DƯỚI',front:'TRƯỚC',back:'SAU',left:'TRÁI',right:'PHẢI'};
  function n(v){return Number(v).toFixed(2);}
  function panelHTML(){const b=ensureArea(),trusses=trussCandidates(b),f=selected(),l=R.source==='laser';const a=f?.pos||defaultPoint(R.source);const getAngles=()=>{if(!f)return {pan:0,tilt:-25};if(l)return{pan:f.pan,tilt:f.tilt};const d=f.target.map((v,i)=>v-f.pos[i]);return{pan:Math.atan2(d[0],d[2])*180/Math.PI,tilt:Math.atan2(d[1],Math.hypot(d[0],d[2]))*180/Math.PI};};const ang=getAngles();
   return `<div class="mount136-head"><div><strong>▣ GẮN ĐÈN VÀO TRUSS · KÉO XYZ / V13.9</strong><small>Chọn 6 mặt · Truss Snap · Giới hạn kích thước thật</small></div><button data-m136="close" aria-label="Đóng">✕</button></div><div class="mount136-content">
   <section><h4>1. NGUỒN SÁNG</h4><div class="mount136-grid"><button class="${!l?'sel':''}" data-m136="source" data-source="light">◉ Đèn sân khấu</button><button class="${l?'sel':''}" data-m136="source" data-source="laser">✦ Laser RGB</button></div>
   ${!l?`<label>Loại đèn<select id="mount136Type">${[['beam','Moving Head Beam'],['spot','Spot / Profile'],['wash','Wash'],['fresnel','Fresnel'],['par','LED PAR'],['blinder','Blinder'],['follow','Follow Spot'],['pixel','Pixel Bar'],['strobe','Strobe']].map(([k,t])=>`<option value="${k}" ${k===R.fixtureType?'selected':''}>${t}</option>`).join('')}</select></label>`:''}
   <div class="mount136-grid"><button class="primary" data-m136="add">+ ${l?'LASER':'ĐÈN'} TRÊN TRUSS</button><button data-m136="autoArea">↺ Dò vùng sân khấu</button></div>
   <label>Chọn ${l?'laser':'đèn'} đã có<select id="mount136Pick"><option value="">— Chọn fixture —</option>${(l?S.laser135?.fixtures:engine.lights).map(x=>`<option value="${esc(x.id)}" ${f?.id===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label></section>
   <section><h4>2. CHỌN MẶT VÀ GÓC CAMERA</h4><div class="mount136-face">${Object.entries(faceNames).map(([key,name])=>`<button class="${R.face===key?'sel':''}" data-m136="face" data-face="${key}">${name}</button>`).join('')}</div>
   <div class="mount136-grid"><button class="${R.interactive==='roi'?'sel':''}" data-m136="roi">▱ Khoanh vùng 2 góc</button><button class="${R.interactive==='support'?'sel':''}" data-m136="support">🎯 Click chọn TRUSS / VẬT THỂ</button><button class="${R.interactive==='place'?'sel':''}" data-m136="place">⌖ Click đặt đèn 1 lần</button><button class="${R.interactive==='axis'?'sel':''}" data-m136="axis">✥ KÉO X / Y / Z</button><button data-m136="stop">Thoát thao tác</button></div>
   <div class="mount136-muted">Chọn 🎯 rồi click thanh treo trên sân khấu: đèn sẽ tự bám vào thanh. Sau đó chọn ✥ để kéo từng trục (mũi tên màu). Không cần chuyển sang mặt phẳng khác.</div>
   <label class="mount136-check"><input id="mount136Snap" type="checkbox" ${R.snapTruss?'checked':''}> Bắt dính thanh treo truss khi đặt mặt TRÊN</label><label class="mount136-check"><input id="mount136Clip" type="checkbox" ${R.limitBeam?'checked':''}> Giới hạn tia laser trong vùng xem preview</label></section>
   <section><h4>3. TRUSS LAYER / TÌM CẢ GIẰNG NHỎ & CỤM GIÀN</h4><div class="mount136-muted">${trusses.length} layer · màu xanh lá: đang chọn · vàng: tự đánh dấu · xanh lam: dò hình học. Các mesh nhỏ trong cùng giàn được gom thành một layer.</div>
   <div class="mount136-grid"><button data-m136="rescan">↻ Dò lại Truss Layer</button><button data-m136="layerPoint" class="${R.interactive==='layerPoint'?'sel':''}">⌖ Click điểm gắn trên layer</button><button data-m136="tagTruss" class="${R.interactive==='tagTruss'?'sel':''}">+ Đánh dấu object là Truss</button><button data-m136="layerAttach">+ Gắn đèn tại tâm layer</button><button data-m136="toggleROILayers">${R.overlayLayerOnly?'Hiện cả truss / ROI':'Chỉ hiện layer chọn'}</button><button data-m136="toggleROI">${R.showROI?'Ẩn khung / Truss':'Hiện khung / Truss'}</button></div>
   <label>Lọc layer<select id="mount140Filter"><option value="all" ${R.trussFilter==='all'?'selected':''}>Tất cả</option><option value="horizontal" ${R.trussFilter==='horizontal'?'selected':''}>Chỉ truss ngang</option><option value="vertical" ${R.trussFilter==='vertical'?'selected':''}>Chỉ truss đứng</option><option value="manual" ${R.trussFilter==='manual'?'selected':''}>Layer thủ công</option></select></label>
   <div class="mount136-truss mount140-layerlist">${trusses.filter(t=>R.trussFilter==='all'||t.kind===R.trussFilter||t.orientation===R.trussFilter).slice(0,45).map(t=>`<div class="mount140-layer-row ${R.selectedLayerId===t.id?'selected':''}"><button data-m136="selectLayer" data-layer="${esc(t.id)}" title="${esc(t.mesh?.path||t.name)}"><b>${t.kind==='manual'?'★ ':'▣ '}${esc(t.name)}</b><small>${t.count} mesh · ${t.kind==='manual'?'MANUAL':t.named?'HIERARCHY':'GEOMETRY'} · ${t.axis===1?'Y đứng':t.axis===0?'X ngang':'Z ngang'}</small></button><button class="mount140-attach" data-m136="attachLayer" data-layer="${esc(t.id)}" title="Gắn đèn trên layer">+</button></div>`).join('')||'<p>Chưa tìm thấy. Click vào thanh rồi chọn + Đánh dấu object là Truss, hoặc tìm tên object bên dưới.</p>'}</div>
   <div class="mount136-grid"><button data-m136="ignoreLayer" ${R.selectedLayerId?'':'disabled'}>Ẩn layer sai</button><button data-m136="removeLayer" ${R.selectedLayerId?'':'disabled'}>Bỏ layer đang chọn</button></div>
   <label>Tìm mesh theo tên (dùng khi click trượt thanh rất mỏng)<input id="mount140MeshSearch" placeholder="Truss, Frame, Tube, Line..." value="${esc(R.meshFilter||'')}"></label><div id="mount140MeshResults" class="mount140-object-results"></div>
   <div class="mount136-muted">Có thể chọn một object trong danh sách Cấu trúc sân khấu bên trái, sau đó bấm "Đưa object đang chọn vào Truss Layer".</div><button data-m136="tagSelected">+ Đưa object đang chọn vào Truss Layer</button></section>
   <section><h4>4. GIỚI HẠN SÂN KHẤU / MÉT</h4><div class="mount136-coords">${[['minX',b.min[0]],['maxX',b.max[0]],['minY',b.min[1]],['maxY',b.max[1]],['minZ',b.min[2]],['maxZ',b.max[2]]].map(([k,v])=>`<label>${k}<input data-m136-area="${k}" type="number" step=".1" value="${n(v)}"></label>`).join('')}</div><button data-m136="applyArea">Áp dụng ranh giới</button>
   <div class="mount136-muted">Giữ nguyên hệ tọa độ mét của GLB. Không scale sân khấu, không đổi UV/Pixel Map.</div></section>
   <section><h4>5. CHỈNH ĐÈN ĐANG CHỌN</h4>${f?`<div class="mount136-current">${esc(f.name)} · XYZ ${f.pos.map(n).join(' / ')}${R.lastHitName?`<br><small>Vật thể chọn: ${esc(R.lastHitName)}</small>`:''}</div><div class="mount136-coords">${[['x',a[0]],['y',a[1]],['z',a[2]]].map(([k,v])=>`<label>${k.toUpperCase()} m<input data-m136-pos="${k}" type="number" step=".05" value="${n(v)}"></label>`).join('')}</div>
   <div class="mount139-sliders">${[['X',0],['Y',1],['Z',2]].map(([axis,i])=>`<label class="mount139-axis"><span style="color:${['#ff7970','#6feda0','#80b3ff'][i]}">${axis} / m</span><input type="range" data-m136-slider="${i}" min="${b.min[i].toFixed(2)}" max="${b.max[i].toFixed(2)}" step="0.01" value="${n(a[i])}"><output>${n(a[i])}</output></label>`).join('')}</div>
   <div class="mount139-nudges"><label>Chuyển chính xác <select id="mount139Step">${[['0.01','1 cm'],['0.05','5 cm'],['0.1','10 cm'],['0.25','25 cm'],['0.5','50 cm']].map(([v,l])=>`<option value="${v}" ${Math.abs(R.moveStep-Number(v))<1e-5?'selected':''}>${l}</option>`).join('')}</select></label><div class="mount139-nudge-grid">${[['X',0],['Y',1],['Z',2]].map(([axis,i])=>`<button data-m136="nudge" data-axis="${i}" data-sign="-1">− ${axis}</button><button data-m136="nudge" data-axis="${i}" data-sign="1">+ ${axis}</button>`).join('')}</div></div>
   <div class="mount139-anchor">${f.mount139?`<strong>ĐÃ BÁM:</strong> ${esc(f.mount139.layerName||f.mount139.meshName||'Vật thể')}<br><small>${f.mount139.locked?'Đang khóa dịch chuyển trên truss':'Đang cho phép dịch chuyển XYZ tự do'}</small>`:'Chưa gắn vào vật thể. Bấm 🎯 Click chọn TRUSS.'}</div>
   <div class="mount136-grid"><button data-m136="lockSupport" ${f.mount139?'':'disabled'}>${f.mount139?.locked?'MỞ KHÓA XYZ':'KHÓA THEO TRUSS'}</button><button data-m136="detach" ${f.mount139?'':'disabled'}>Tháo liên kết</button></div><div class="mount136-coords"><label>Pan °<input data-m136-aim="pan" type="number" step="2" value="${n(ang.pan)}"></label><label>Tilt °<input data-m136-aim="tilt" type="number" step="2" value="${n(ang.tilt)}"></label></div><div class="mount136-grid"><button data-m136="aimStage">↘ Chiếu vào sân khấu</button><button data-m136="fixPos">↺ Kéo về trong vùng</button></div>`:'<p>Thêm đèn mới hoặc chọn một đèn trong danh sách.</p>'}</section>
   <div class="mount136-note">Mô phỏng 3D: vị trí đèn và điểm bám được lưu trong dự án. Chưa điều khiển DMX hoặc laser thật. Vùng giới hạn không thay thế kiểm tra rigging, tải trọng hay vùng an toàn khán giả.</div>
   </div><div class="mount136-footer"><button class="primary" data-m136="place">⌖ Đặt trên ${faceNames[R.face]}</button><button data-m136="close">Xong / Về chỉnh sửa</button></div>`;
  }
  function render(){if(!R.open)return;const oldScroll=panel.querySelector('.mount136-content')?.scrollTop||0;panel.innerHTML=panelHTML();const body=panel.querySelector('.mount136-content');if(body)body.scrollTop=oldScroll;paintMeshSearch140();}
  function paintMeshSearch140(){const host=panel.querySelector('#mount140MeshResults');if(!host)return;const query=String(R.meshFilter||'').trim().toLowerCase();if(!query){host.innerHTML='<small>Nhập vài ký tự để tìm trong danh sách mesh của GLB.</small>';return;}const matches=engine.stage.map((m,i)=>({m,i})).filter(({m})=>String(m.name+' '+(m.path||'')).toLowerCase().includes(query)).slice(0,25);host.innerHTML=matches.map(({m,i})=>`<button data-m136="tagSearch" data-index="${i}" title="${esc(m.path||m.name)}">+ ${esc(m.name||'Mesh #'+i)}</button>`).join('')||'<small>Không tìm thấy object có tên này.</small>';}
  function close(){R.open=false;setInteractive(null);panel.hidden=true;document.body.classList.remove('mount136-open');if(R.openedDrawer){document.body.classList.remove('drawer-right');R.openedDrawer=false;}}
  function open(source='laser'){if(state.presenting){togglePresentation();}R.source=source==='light'?'light':'laser';ensureArea();
   if(S.laser135){S.laser135.placing=false;S.laser135.moveMode=false;document.getElementById('laser135Overlay')?.classList.remove('laser135-pick');}
   S.laserShow?.close?.();document.getElementById('pro127close')?.click();
   panel.hidden=false;R.open=true;document.body.classList.add('mount136-open');if((window.innerWidth<=980||document.body.classList.contains('focus-workspace'))&&!document.body.classList.contains('drawer-right')){document.body.classList.add('drawer-right');R.openedDrawer=true;}engine.view='stage';render();}
  panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.m136;if(!a)return;switch(a){
   case 'close':close();break;
   case 'source':R.source=b.dataset.source;render();break;
   case 'face':setCamera(b.dataset.face);break;
   case 'add':addNew();break;
   case 'roi':setCamera('top');setInteractive('roi');break;
   case 'support':R.lastHitName='';setInteractive('support');toast('Click vào thanh Truss hoặc vật thể 3D để gắn nguồn đèn.');break;
   case 'place':R.lastHitName='';setInteractive('place');break;
   case 'drag':case 'axis':if(!ensureFixture())break;setInteractive('axis');toast('Kéo mũi tên X đỏ, Y xanh lá hoặc Z xanh dương trên sân khấu.');break;
   case 'nudge':{const f=ensureFixture();if(!f)break;const axis=Number(b.dataset.axis),p=[...f.pos];p[axis]+=Number(b.dataset.sign)*R.moveStep;setPos(slideToAxis(p,axis,f.pos));break;}
   case 'lockSupport':{const f=selected();if(f?.mount139){f.mount139.locked=!f.mount139.locked;R.lockSupport=f.mount139.locked;render();}break;}
   case 'detach':{const f=selected();if(f){delete f.mount139;R.supportTarget=null;render();toast('Đã tháo liên kết truss, đèn vẫn giữ vị trí XYZ.');}break;}
   case 'stop':setInteractive(null);break;
   case 'autoArea':R.manual=false;R.area=autoArea();render();break;
   case 'truss':applyTruss(Number(b.dataset.index));break;
   case 'rescan':refreshTruss140();toast('Đã dò lại '+R.trussLayers.length+' Truss Layer.');break;
   case 'toggleROILayers':R.overlayLayerOnly=!R.overlayLayerOnly;render();break;
   case 'toggleROI':R.showROI=!R.showROI;render();break;
   case 'selectLayer':R.selectedLayerId=b.dataset.layer;render();break;
   case 'attachLayer':{R.selectedLayerId=b.dataset.layer;const layer=getActiveLayer140();if(layer){bindFixtureToSupport(layer,layer.center);toast('Đã gắn đèn lên '+layer.name);}break;}
   case 'layerAttach':{const layer=getActiveLayer140();if(layer)bindFixtureToSupport(layer,layer.center);else toast('Chọn một Truss Layer trước.');break;}
   case 'layerPoint':if(!getActiveLayer140()){toast('Chọn Truss Layer từ danh sách trước.');break;}setInteractive('layerPoint');toast('Click trực tiếp điểm trên thanh truss đã chọn.');break;
   case 'tagTruss':setInteractive('tagTruss');toast('Click vào một mesh để thêm vào Truss Layer thủ công.');break;
   case 'tagSelected':{const mesh=engine.stage.find(m=>m.id===state.selectedMesh)||engine.stage.find(m=>m.sourceKey===director?.selection?.id);if(mesh)makeManualLayer140(mesh);else toast('Chọn object trong danh sách Cấu trúc sân khấu hoặc tìm theo tên.');break;}
   case 'tagSearch':{const mesh=engine.stage[Number(b.dataset.index)];if(mesh)makeManualLayer140(mesh);break;}
   case 'ignoreLayer':case 'removeLayer':if(R.selectedLayerId)removeLayer140(R.selectedLayerId);break;
   case 'applyArea':{const mm=copyB(ensureArea());for(const inp of panel.querySelectorAll('[data-m136-area]')){const q=inp.dataset.m136Area,i='xyz'.indexOf(q.slice(-1).toLowerCase());if(i<0)continue;mm[q.startsWith('min')?'min':'max'][i]=Number(inp.value);}
     if(!updateArea(mm,true))toast('Giới hạn phải có Min < Max và kích thước mỗi trục trên 5cm.');break;}
   case 'aimStage':{const f=selected();if(!f)break;if(R.source==='laser')aimLaser(f);else{f.target=centerTarget();f.sweep=false;engine.rebuildFixtures();}render();break;}
   case 'fixPos':setPos(getPos());break;
  }});
  panel.addEventListener('change',e=>{const el=e.target;
   if(el.id==='mount140Filter'){R.trussFilter=el.value;render();return;}
   if(el.id==='mount136Type'){R.fixtureType=el.value;return;}
   if(el.id==='mount139Step'){R.moveStep=Math.max(.01,Math.min(.5,Number(el.value)||.1));return;}
   if(el.id==='mount136Pick'){if(R.source==='laser')R.laserId=el.value;else R.lightId=el.value;render();return;}
   if(el.id==='mount136Snap'){R.snapTruss=el.checked;return;}
   if(el.id==='mount136Clip'){R.limitBeam=el.checked;return;}
   if(el.dataset.m136Pos){const p=[...getPos()],i='xyz'.indexOf(el.dataset.m136Pos);p[i]=Number(el.value);setPos(slideToAxis(p,i,getPos()));return;}
   if(el.dataset.m136Slider!==undefined){const p=[...getPos()],i=Number(el.dataset.m136Slider);p[i]=Number(el.value);setPos(slideToAxis(p,i,getPos()));return;}
   if(el.dataset.m136Aim){const f=selected();if(!f)return;const get=R.source==='laser'?{pan:f.pan,tilt:f.tilt}:(()=>{const d=f.target.map((v,i)=>v-f.pos[i]);return{pan:Math.atan2(d[0],d[2])*180/Math.PI,tilt:Math.atan2(d[1],Math.hypot(d[0],d[2]))*180/Math.PI};})();get[el.dataset.m136Aim]=Number(el.value);setAim(get.pan,get.tilt);render();}
  });
  panel.addEventListener('input',e=>{const el=e.target;if(el.id==='mount140MeshSearch'){R.meshFilter=el.value;paintMeshSearch140();return;}if(el.dataset.m136Slider===undefined)return;
    const f=selected();if(!f)return;const axis=Number(el.dataset.m136Slider),p=[...f.pos];p[axis]=Number(el.value);
    setPos(slideToAxis(p,axis,f.pos),false);
    const output=el.closest('label')?.querySelector('output');if(output)output.textContent=Number(f.pos[axis]).toFixed(2);
    const number=panel.querySelector(`input[data-m136-pos="${'xyz'[axis]}"]`);if(number)number.value=f.pos[axis].toFixed(2);
    if(R.source==='light'&&performance.now()-R.lastAxisRebuild>70){R.lastAxisRebuild=performance.now();engine.rebuildFixtures();}
  });
  function ensureTopButton(){const host=$('pro127bar')||document.querySelector('.navigation-strip');if(host&&!$('mount136TopBtn')){const b=document.createElement('button');b.id='mount136TopBtn';b.textContent='▣ Truss / Vùng đèn';b.title='Khoanh vùng sân khấu, đặt đèn trên truss, chọn 6 mặt';b.onclick=()=>open('light');host.appendChild(b);}}
  function guardedTick(now){requestAnimationFrame(guardedTick);if(now-R.lastPoll<280)return;R.lastPoll=now;ensureTopButton();ensureArea();
   let changed=false;for(const f of engine.lights){
     // Include lights added through the original V12.8 '+ Thêm đèn' button.
     // Imported/previously saved fixtures are registered as known on project restore.
     if(!R.knownLights.has(f.id)){
       R.knownLights.add(f.id);
       if(f.origin==='manual'||String(f.id).startsWith('fixture127_')){f.mount136=true;R.guarded.add(f.id);}
     }
     if(!f.mount136&&!R.guarded.has(f.id))continue;
     const target=constrain(f.pos);if(Math.hypot(...target.map((v,i)=>v-f.pos[i]))>.005){const delta=target.map((v,i)=>v-f.pos[i]);f.pos=target;f.target=(f.target||centerTarget()).map((v,i)=>v+delta[i]);changed=true;}}
   if(changed)engine.rebuildFixtures();
  }
  // Save manual stage mounting ROI with the project; do not touch preexisting UV/Pixel map.
  const originalMove128=S.fixture128?.move; if(originalMove128){S.fixture128.move=(id,p)=>{const f=engine.lights.find(x=>x.id===id);if(!f)return false;f.mount136=true;R.guarded.add(id);return originalMove128(id,constrain(p));};}
  const livePack=packLiveExtras,liveRestore=restoreLiveExtras;
  packLiveExtras=async function(){const out=await livePack();out.mount136={area:copyB(ensureArea()),manual:R.manual,snapTruss:R.snapTruss,limitBeam:R.limitBeam,manualTrussLayers:JSON.parse(JSON.stringify(R.manualTrussLayers)),ignoredTrussRefs:[...R.ignoredTrussRefs],
    attachments:{lights:engine.lights.filter(f=>f.mount139).map(f=>({id:f.id,mount139:{...f.mount139}})),lasers:(S.laser135?.fixtures||[]).filter(f=>f.mount139).map(f=>({id:f.id,mount139:{...f.mount139}}))}};return out;};
  restoreLiveExtras=async function(data){await liveRestore(data);R.knownLights=new Set(engine.lights.map(x=>x.id));R.guarded=new Set(engine.lights.filter(x=>x.mount136).map(x=>x.id));const saved=data?.mount136;
    if(saved&&validB(saved.area)){R.modelKey=nameKey();R.area=copyB(saved.area);R.manual=saved.manual===true;R.snapTruss=saved.snapTruss!==false;R.limitBeam=saved.limitBeam!==false;}else{R.modelKey='';ensureArea();}
    R.manualTrussLayers=Array.isArray(saved?.manualTrussLayers)?saved.manualTrussLayers.filter(g=>g&&Array.isArray(g.refs)).slice(0,100):[];R.ignoredTrussRefs=Array.isArray(saved?.ignoredTrussRefs)?saved.ignoredTrussRefs.slice(0,3000):[];R.trussLayerCache=null;R.trussRevision++;
    for(const item of saved?.attachments?.lights||[]){const f=engine.lights.find(x=>x.id===item.id);if(f&&item.mount139)f.mount139=item.mount139;}
    for(const item of saved?.attachments?.lasers||[]){const f=S.laser135?.fixtures?.find(x=>x.id===item.id);if(f&&item.mount139)f.mount139=item.mount139;}
    R.supportTarget=null;R.interactive=null;if(R.open)render();};
  S.mount136={open,close,constrain,getArea,setArea:updateArea,defaultPoint,aimLaser,clipBeam,
    detectTruss:()=>trussCandidates(ensureArea()),detectTrussLayers:()=>trussCandidates(ensureArea()),rescanTrussLayers:refreshTruss140,markTrussMesh:meshId=>{const m=engine.stage.find(x=>x.id===meshId||x.name===meshId||meshRef140(x)===meshId);return makeManualLayer140(m);},selectTrussLayer:id=>{const l=trussCandidates(ensureArea()).find(x=>x.id===id);if(l){R.selectedLayerId=id;render();return true;}return false;},attachTrussLayer:(id,mode='laser')=>{R.source=mode==='light'?'light':'laser';const c=trussCandidates(ensureArea()).find(x=>x.id===id);if(!c)return false;R.selectedLayerId=c.id;return bindFixtureToSupport(c,c.center);},snapToTruss,
    attachByIndex(index,mode='laser'){R.source=mode==='light'?'light':'laser';return applyTruss(index);},
    attachToObject(meshId,mode='laser'){R.source=mode==='light'?'light':'laser';const mesh=engine.stage.find(m=>m.id===meshId||m.name===meshId);return mesh?bindFixtureToSupport(supportForMesh(mesh)):false;},
    moveAxis(axis,amount){const n=typeof axis==='string'?'xyz'.indexOf(axis.toLowerCase()):axis;const f=ensureFixture();if(!f||n<0||n>2)return false;const p=[...f.pos];p[n]+=amount;return setPos(slideToAxis(p,n,f.pos));},
    select(mode,id){R.source=mode==='light'?'light':'laser';if(R.source==='light')R.lightId=id;else{R.laserId=id;if(S.laser135)S.laser135.selected=id;}render();},
    move(mode,id,p){R.source=mode==='light'?'light':'laser';if(R.source==='light')R.lightId=id;else R.laserId=id;return setPos(p);},
    add(mode='laser'){R.source=mode==='light'?'light':'laser';addNew();return selected();},get state(){return R;}};
  // A tiny stage-scale 3D laser housing makes the mounting point visible in both
  // editor and clean presentation. It is a preview proxy: it does NOT alter the GLB.
  // Create lazily because engine.rebuildFixtures() may replace its proxy list.
  function syncLaserHousings139(){
    const lasers=(S.laser135?.fixtures||[]).filter(f=>f.enabled!==false),validIds=new Set(lasers.map(f=>f.id));
    const existing=new Map();
    for(const m of engine.fixtureMeshes){
      if(!m.laserProxy139)continue;
      if(!validIds.has(m.laserProxy139)){engine.releaseMesh(m);continue;}
      if(!existing.has(m.laserProxy139))existing.set(m.laserProxy139,[]);
      existing.get(m.laserProxy139).push(m);
    }
    if(engine.fixtureMeshes.some(m=>m.laserProxy139&&!validIds.has(m.laserProxy139)))
      engine.fixtureMeshes=engine.fixtureMeshes.filter(m=>!m.laserProxy139||validIds.has(m.laserProxy139));
    const scale=Math.max(.60,Math.min(1.45,(engine.size?.width||18)/18));
    for(const f of lasers){
      let group=existing.get(f.id);
      if(!group){
        const frame=boxMesh('LASER body / '+f.id,[0,0,0],[.24*scale,.15*scale,.30*scale],[.10,.14,.19,1]);
        const lens=boxMesh('LASER optic / '+f.id,[0,-.015*scale,.16*scale],[.12*scale,.07*scale,.025*scale],[.09,.68,.83,1]);lens.material.emissive=[.03,.20,.23];
        const clampTop=boxMesh('LASER hanger / '+f.id,[0,.12*scale,0],[.10*scale,.14*scale,.12*scale],[.24,.27,.29,1]);
        group=[frame,lens,clampTop];for(const m of group){m.laserProxy139=f.id;engine.fixtureMeshes.push(m);}
      }
      const yaw=(f.pan||0)*Math.PI/180,tilt=(f.tilt||0)*Math.PI/180;
      const root=M.mm(M.translate(f.pos),M.mm(M.rotate([0,1,0],yaw),M.rotate([1,0,0],-tilt*.22)));
      for(const m of group)m.actorMatrix=root;
    }
  }
  const renderStage139=engine.render.bind(engine);
  engine.render=function(...args){syncLaserHousings139();return renderStage139(...args);};
  S.mount136.syncLaserHousings=syncLaserHousings139;
  requestAnimationFrame(drawOverlay);requestAnimationFrame(guardedTick);ensureTopButton();
  S.version='14.0.0';console.info('V14.0 grouped truss layers, explicit mesh tagging and point mounting active.');
 }catch(err){console.error('Stage Mount V13.6 failed',err);}
})();

/* V13.7 CLEAN STAGE / show console guard. Does not alter LED UV, GL shaders, FX or recorded cues. */
(function(){
 'use strict';
 const S=window.STUDIO, body=document.body, el=id=>document.getElementById(id);
 if(!S||!body||!el('viewport')||!el('presentControls'))return;
 const runtime={active:false,controls:false,peekTimer:null,modeBefore:null,fromClass:false,cleanEditor:false};
 const handle=document.createElement('div');
 handle.id='show137Handle';handle.setAttribute('role','group');handle.setAttribute('aria-label','Điều khiển trình diễn');
 handle.innerHTML='<button type="button" id="show137Toggle" title="Mở hoặc ẩn bảng điều khiển (H)">⚙ Điều khiển · H</button><button type="button" id="show137ExitMini" title="Thoát trình diễn (Esc)">✕</button>';
 body.appendChild(handle);
 const showButton=el('show137Toggle'),exitButton=el('show137ExitMini');
 const anyConsoleOpen=()=>body.classList.contains('v130-present-open')||body.classList.contains('laser135-open')||body.classList.contains('tc134-show-open')||body.classList.contains('m131-present-open');
 function clearHelperCanvas(){
  const canvas=el('mount136Overlay');
  if(canvas?.getContext){const c=canvas.getContext('2d');c?.clearRect(0,0,canvas.width,canvas.height);}
 }
 function closeMountAndPicking(){
  try{S.mount136?.close?.();}catch(err){console.warn('Truss close',err)}
  try{S.laserShow?.close?.();}catch(err){console.warn('Laser panel close',err)}
  for(const id of ['fixture128pickHint','quadHint'])el(id)?.classList?.add('hidden');
  el('mount136Overlay')?.classList.remove('active');
  el('laser135Overlay')?.classList.remove('laser135-pick','laser135-dragging');
  clearHelperCanvas();
 }
 function setControls(value){
  if(!runtime.active)return;
  const yes=!!value;
  runtime.controls=yes;
  body.classList.toggle('show137-controls',yes);
  body.classList.toggle('show137-clean',!yes);
  showButton.textContent=yes?'▾ Ẩn điều khiển · H':'⚙ Điều khiển · H';
  showButton.setAttribute('aria-expanded',String(yes));
  showButton.setAttribute('aria-pressed',String(yes));
  body.classList.remove('show137-peek');
  // Resizing only the viewport; 3D/model geometry & LED map are unchanged.
  if(typeof engine!=='undefined')engine._fitOnResize=false;
 }
 function peek(){
  if(!runtime.active||runtime.controls)return;
  body.classList.add('show137-peek');
  clearTimeout(runtime.peekTimer);
  runtime.peekTimer=setTimeout(()=>body.classList.remove('show137-peek'),2600);
 }
 function enter(){
  if(runtime.active)return;
  runtime.modeBefore={grid:engine.settings.grid,guides:engine.showGuides,editClean:runtime.cleanEditor};
  runtime.active=true;
  closeMountAndPicking();
  engine.settings.grid=false;
  engine.showGuides=false;
  setControls(false);
  body.classList.remove('show137-peek');
 }
 function leave(){
  if(!runtime.active)return;
  clearTimeout(runtime.peekTimer);
  runtime.active=false;runtime.controls=false;
  body.classList.remove('show137-clean','show137-controls','show137-peek');
  if(runtime.modeBefore){
   engine.settings.grid=runtime.modeBefore.grid;
   engine.showGuides=runtime.modeBefore.guides;
  }
  runtime.modeBefore=null;
  showButton.textContent='⚙ Điều khiển · H';
 }
 function syncClass(){
  const presenting=body.classList.contains('present-mode')&&typeof state!=='undefined'&&state.presenting;
  if(presenting&&!runtime.active)enter();
  else if(!presenting&&runtime.active)leave();
  else if(presenting&&runtime.active){
   // If the user intentionally opens a VJ, laser or timecode console, make room.
   if(!runtime.controls&&anyConsoleOpen())setControls(true);
   // Do not let helper grid/selection reappear while presenting.
   engine.settings.grid=false;
   engine.showGuides=false;
  }
 }
 new MutationObserver(syncClass).observe(body,{attributes:true,attributeFilter:['class']});
 const oldToggle=typeof togglePresentation==='function'?togglePresentation:null;
 if(oldToggle){
  togglePresentation=function(...args){const r=oldToggle.apply(this,args);syncClass();return r;};
  for(const id of ['presentBtn','exitPresent','showExit']){
   const btn=el(id);if(btn)btn.onclick=()=>togglePresentation();
  }
 }
 showButton.addEventListener('click',()=>{syncClass();setControls(!runtime.controls);});
 exitButton.addEventListener('click',()=>{if(body.classList.contains('present-mode'))togglePresentation();});
 document.addEventListener('keydown',e=>{
  if(!runtime.active)return;
  if(e.key?.toLowerCase()==='h'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'')){
   e.preventDefault();e.stopImmediatePropagation();setControls(!runtime.controls);
  }
 },true);
 // Emergency: avoid stacking panels on a very narrow display when using show controls.
 window.addEventListener('resize',()=>{if(runtime.active&&!runtime.controls)engine._fitOnResize=false;},{passive:true});
 const editBtn=document.createElement('button');
 editBtn.id='show137EditorButton';editBtn.type='button';editBtn.className='btn small';editBtn.textContent='◌ Ẩn lưới';
 editBtn.title='Ẩn/hiện lưới sàn và đường hỗ trợ chỉnh sửa (không ảnh hưởng model)';
 const editorHost=document.querySelector('.navigation-strip');
 if(editorHost){editorHost.appendChild(editBtn);}
 let savedEditMode=null;
 editBtn.addEventListener('click',()=>{
  if(state.presenting)return;
  runtime.cleanEditor=!runtime.cleanEditor;
  body.classList.toggle('show137-editor-clean',runtime.cleanEditor);
  editBtn.classList.toggle('active',runtime.cleanEditor);
  editBtn.textContent=runtime.cleanEditor?'◉ Hiện lưới':'◌ Ẩn lưới';
  if(runtime.cleanEditor){savedEditMode={grid:engine.settings.grid,guides:engine.showGuides};engine.settings.grid=false;engine.showGuides=false;}
  else if(savedEditMode){engine.settings.grid=savedEditMode.grid;engine.showGuides=savedEditMode.guides;savedEditMode=null;}
 });
 // Repair the original V13.5 launcher placement: its previous direct parent
 // (#presentControls) made it a third implicit grid row and hid the scrollbar.
 const showRow=el('presentControls')?.querySelector('.show-row'),laserLauncher=el('laser135Launcher');
 if(showRow&&laserLauncher&&laserLauncher.parentElement!==showRow)showRow.appendChild(laserLauncher);
 // In pristine show mode, reveal the tiny control trigger only at the upper-right hot corner.
 window.addEventListener('pointermove',e=>{
  if(runtime.active&&!runtime.controls&&e.clientY<72&&e.clientX>innerWidth-185)peek();
 },{passive:true});
 S.show137={setControls,get clean(){return runtime.active&&!runtime.controls},get active(){return runtime.active},hideGuides(){engine.showGuides=false;engine.settings.grid=false;clearHelperCanvas();}};
 const ver=document.querySelector('.brand small');if(ver)ver.textContent='V14.0 · TRUSS LAYERS / XYZ / CLEAN SHOW';
 document.title='ALPHA | Creative LED Studio V14.0 - TRUSS LAYERS';
 syncClass();
 console.info('V13.7 Clean Presentation loaded. H: controls, Esc: editor.');
})();
