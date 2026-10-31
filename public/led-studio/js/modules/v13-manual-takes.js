/* V13.1: Direct hand-controlled choreography recorder, independent of mapping/renderer. */
(function(){
'use strict';
try {
  if(!window.STUDIO || !engine || !stage10 || !seq || !choreo11) return;
  const S=window.STUDIO, FPS_OPTIONS=[24,25,30,60];
  const R={open:false,mode:'idle',fps:30,sceneName:'Biên đạo ghi tay 01',actId:'',personId:'',start:0,end:0,elapsed:0,
    states:new Map(),samples:new Map(),marks:[],hold:null,drag:null,holdLast:0,wallLast:0,clockRAF:0,prevLoop:false,
    previewActor:null,seenMove:false,speed:1.1,review:false,history:[],lastMessage:'Sẵn sàng tạo cảnh mới.',maxSeconds:90};
  const n=(a,min,max)=>Math.max(min,Math.min(max,Number(a)||0));
  const ed=(id)=>document.getElementById(id);
  const txt=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function chosenAct(){return director.acts.find(a=>a.id===R.actId)||null;}
  function people(){const a=chosenAct();return a?seq.people.filter(p=>a.people.includes(p.id)&&p.type!=='audience'):[];}
  function chosenPerson(){return people().find(p=>p.id===R.personId)||null;}
  function tc(t){t=Math.max(0,t);const count=Math.floor(t*R.fps+1e-5),fr=count%R.fps,sec=Math.floor(count/R.fps),s=sec%60,m=Math.floor(sec/60)%60,h=Math.floor(sec/3600);return [h,m,s,fr].map(x=>String(x).padStart(2,'0')).join(':');}
  function updateLabel(msg){R.lastMessage=msg;const e=ed('m131Status');if(e)e.textContent=msg;}
  function refreshActSelect(){const select=ed('m131Act'),pers=ed('m131Person');if(!select)return;
    const old=R.actId;select.innerHTML=director.acts.map(a=>`<option value="${txt(a.id)}">${txt(a.name||a.type)} · ${a.people?.length||0} người</option>`).join('');
    if(!director.acts.some(a=>a.id===R.actId))R.actId=director.acts[0]?.id||'';
    select.value=R.actId;
    const ps=people();if(!ps.some(p=>p.id===R.personId))R.personId=ps[0]?.id||'';
    if(pers){pers.innerHTML=ps.map(p=>`<option value="${txt(p.id)}">${txt(p.name||p.type)}</option>`).join('');pers.value=R.personId;}
    if(old!==R.actId && R.mode==='idle')updateLabel('Đã chọn tiết mục '+(chosenAct()?.name||'—'));
  }
  function poseFor(p,time){const base=priorPose(p,time);return {pos:[...base.pos],yaw:base.yaw||0,action:base.action||'dance',energy:n(base.energy??.70,0,1),distance:base.distance||0,speed:0,direction:base.direction||[0,0,1]};}
  const priorPose=routePose11,priorVisible=actPersonVisible8;
  function interpolate(samples,t){if(!samples?.length)return null;
    if(t<=samples[0].t)return samples[0];if(t>=samples.at(-1).t)return samples.at(-1);
    let lo=0,hi=samples.length-1;while(hi-lo>1){let mid=(lo+hi)>>1;if(samples[mid].t<=t)lo=mid;else hi=mid;}
    const a=samples[lo],b=samples[hi],f=n((t-a.t)/(b.t-a.t||.001),0,1),ease=f*f*(3-2*f);
    const pos=a.pos.map((x,k)=>x+(b.pos[k]-x)*ease);
    const d=Math.hypot(b.pos[0]-a.pos[0],b.pos[2]-a.pos[2]);
    return {pos,yaw:a.yaw+(b.yaw-a.yaw)*ease,action:f<.5?a.action:b.action,energy:a.energy+(b.energy-a.energy)*ease,
      speed:d/Math.max(.03,b.t-a.t),distance:(a.distance||0)+d*ease,direction:d>.0001?[(b.pos[0]-a.pos[0])/d,0,(b.pos[2]-a.pos[2])/d]:[0,0,1]};
  }
  routePose11=function(p,t){const orig=priorPose(p,t);
    if((R.mode==='record'||R.mode==='review')&&R.states.has(p.id)){
      const sample=R.mode==='record'?R.states.get(p.id):interpolate(R.samples.get(p.id),t-R.start);
      if(sample)return {...orig,pos:[...sample.pos],yaw:sample.yaw,action:sample.action,energy:sample.energy,
        speed:sample.speed||0,distance:sample.distance||0,direction:sample.direction||[0,0,1],local:t-R.start,
        route:{carryProp:false},segmentU:n(R.elapsed/Math.max(.1,R.end-R.start),0,1)};
    }
    return orig;
  };
  actPersonVisible8=function(p,t){if((R.mode==='record'||R.mode==='review')&&R.states.has(p.id))return true;return priorVisible(p,t);};
  function currentElapsed(){return n(state.time-R.start,0,R.maxSeconds);}
  function recordSample(id,force=false){if(R.mode!=='record')return;const d=R.states.get(id),arr=R.samples.get(id);if(!d||!arr)return;
    const t=Math.max(0,currentElapsed()),last=arr.at(-1),dt=last?t-last.t:999;
    const moved=last?Math.hypot(...d.pos.map((v,k)=>v-last.pos[k])):.1;
    const changed=last&&(last.action!==d.action||Math.abs(last.yaw-d.yaw)>1.2||Math.abs(last.energy-d.energy)>.08);
    if(!force && ((dt<.09)||(!changed&&moved<.025&&dt<1.5)))return;
    if(last&&dt<.012){arr[arr.length-1]={...d,t};return;}
    if(arr.length>=420)return;
    arr.push({...d,pos:[...d.pos],t});
  }
  function allSamples(force=false){for(const id of R.states.keys())recordSample(id,force);}
  function mark(note='Mốc động tác'){if(R.mode!=='record')return;
    allSamples(true);R.marks.push({t:currentElapsed(),label:note});updateLabel('Đã đánh dấu '+note+' tại '+tc(state.time));renderMarkers();}
  function setAction(action){if(!chosenPerson()||R.mode!=='record')return;
    const d=R.states.get(R.personId);if(!d)return;d.action=action;d.energy=action==='hold'?.20:action==='drum'?.9:.75;
    recordSample(R.personId,true);mark('Động tác: '+({walk:'Bước',dance:'Múa',reach:'Vươn',turn:'Xoay',hold:'Giữ',drum:'Trống',glide:'Lướt'}[action]||action));renderActions();}
  function move(id,dir,amount){if(R.mode!=='record')return;const d=R.states.get(id);if(!d)return;
    const p=seq.people.find(x=>x.id===id);if(!p)return;
    const old=[...d.pos];const unit=amount;
    if(dir==='left')d.pos[0]-=unit; else if(dir==='right')d.pos[0]+=unit;
    else if(dir==='forward')d.pos[2]-=unit;else if(dir==='back')d.pos[2]+=unit;
    else if(dir==='turnLeft')d.yaw-=unit*35;else if(dir==='turnRight')d.yaw+=unit*35;
    d.pos[0]=n(d.pos[0],-100,100);d.pos[2]=n(d.pos[2],-100,100);
    const dx=d.pos[0]-old[0],dz=d.pos[2]-old[2],dist=Math.hypot(dx,dz);
    if(dist>.0001){d.distance+=dist;d.speed=Math.max(.12,R.speed);d.direction=[dx/dist,0,dz/dist];if(d.action==='hold')d.action='walk';}
    R.seenMove=true;recordSample(id);poseCache11?.clear?.();updatePoseInfo();
  }
  function start(){if(R.mode==='record')return;
    if(R.mode==='review'){R.mode='idle';R.states.clear();R.samples.clear();R.marks=[];}
    const a=chosenAct();if(!a||!people().length){updateLabel('Chọn tiết mục có người, hoặc tạo nhóm biên đạo mẫu.');return;}
    const from=ed('m131Start')?Number(ed('m131Start').value):state.time;
    if(!Number.isFinite(from)||from<0||from>=599){updateLabel('Timecode bắt đầu phải nhỏ hơn 09:59.');return;}
    R.sceneName=(ed('m131Name')?.value||('Biên đạo '+(R.history.length+1))).trim().slice(0,64);
    R.start=n(from,0,599);R.end=R.start;R.elapsed=0;R.states.clear();R.samples.clear();R.marks=[];
    R.maxSeconds=Math.min(90,600-R.start);R.prevLoop=state.loop;state.loop=false;
    // The recorder has its own clock location on the global timeline; no mesh/LED changes.
    if(state.duration-R.start<6)ensureDuration10(Math.min(600,R.start+Math.min(6,R.maxSeconds)));
    seekTimeline(R.start);
    for(const p of people()){const z=poseFor(p,R.start);R.states.set(p.id,z);R.samples.set(p.id,[{...z,pos:[...z.pos],t:0}]);}
    R.mode='record';R.seenMove=false;R.hold=null;R.drag=null;
    enableAudio(true).catch(()=>{});setPlaying(true);
    updateLabel('● Đang ghi. Kéo người trên 3D hoặc bấm nút di chuyển/động tác.');
    paintMode();updateTime();
  }
  function end(){if(R.mode!=='record')return;
    if(R.drag){R.drag=null;}R.hold=null;R.end=Math.max(R.start+.10,Math.min(state.time,R.start+R.maxSeconds));
    R.elapsed=R.end-R.start;allSamples(true);R.mode='review';setPlaying(false);state.loop=R.prevLoop;seekTimeline(R.start);
    for(const arr of R.samples.values())if(arr.length===1)arr.push({...arr[0],pos:[...arr[0].pos],t:R.elapsed});
    updateLabel('■ Đã kết thúc '+tc(R.end)+' · '+R.elapsed.toFixed(2)+'s. Bấm LƯU CẢNH vào SHOW TIME.');
    paintMode();updateTime();renderMarkers();
  }
  function cancel(){if(R.mode==='record'){R.hold=null;setPlaying(false);state.loop=R.prevLoop;}
    R.mode='idle';R.states.clear();R.samples.clear();R.marks=[];R.drag=null;updateLabel('Đã hủy lượt ghi. Không thay đổi show hoặc mapping.');paintMode();renderMarkers();}
  function normalizeForRoute(p,c,samples){const r={clip:c.id,person:p.id,enabled:true,baseHeight:p.height||1.75,carryProp:false,keys:[]};
    let source=samples.filter(x=>Number.isFinite(x.t)&&Array.isArray(x.pos)).sort((a,b)=>a.t-b.t);
    const dur=Math.max(.10,c.duration);if(!source.length) return null;
    // Thin near-duplicate samples; preserve action changes and start/end.
    let trimmed=[source[0]];
    for(let i=1;i<source.length-1;i++){
      const prev=trimmed.at(-1),cur=source[i],diff=Math.hypot(...cur.pos.map((v,k)=>v-prev.pos[k]));
      if((cur.t-prev.t)>.17 || diff>.035 || cur.action!==prev.action || Math.abs(cur.yaw-prev.yaw)>2)trimmed.push(cur);
    }
    if(source.length>1)trimmed.push(source.at(-1));
    for(const sample of trimmed){const u=n(sample.t/dur,0,1),offset=worldOffset11(p,r,sample.pos),action=ACT11[sample.action]?sample.action:'dance';
      const last=r.keys.at(-1);if(last&&u-last.u<1e-5){last.offset=offset;last.action=action;last.yaw=sample.yaw-p.yaw;continue;}
      r.keys.push(key11(u,offset,{yaw:sample.yaw-p.yaw,face:'angle',action,ease:'smooth',energy:n(sample.energy,.1,1)}));
    }
    if(r.keys.length===1)r.keys.push(key11(1,[...r.keys[0].offset],{yaw:r.keys[0].yaw,face:'angle',action:'hold',ease:'smooth',energy:.3}));
    if(r.keys[0].u>.00001)r.keys.unshift(key11(0,[...r.keys[0].offset],{yaw:r.keys[0].yaw,face:'angle',action:r.keys[0].action}));
    if(r.keys.at(-1).u<.999)r.keys.push(key11(1,[...r.keys.at(-1).offset],{yaw:r.keys.at(-1).yaw,face:'angle',action:'hold'}));
    return r;
  }
  function save(){if(R.mode!=='review'){updateLabel('Hãy Bắt đầu → Kết thúc trước khi lưu cảnh.');return;}
    const a=chosenAct();if(!a){updateLabel('Tiết mục gốc không còn. Chưa thể lưu.');return;}
    const duration=n(R.end-R.start,.1,600-R.start);
    let scene=null;
    try{
      scene=createScene10({name:R.sceneName||'Biên đạo ghi tay',start:R.start,duration,actId:a.id,visual:false,color:'#38b6a4'});
      const clip=sceneClips10(scene).find(x=>x.source===a.id);
      if(!clip)throw Error('Không tạo được clip biên đạo.');
      const selectedActors=people();let count=0;
      for(const p of selectedActors){const route=normalizeForRoute(p,clip,R.samples.get(p.id)||[]);if(!route)continue;
        choreo11.routes=choreo11.routes.filter(r=>!(r.person===p.id&&r.clip===clip.id));
        choreo11.routes.push(route);count++;
      }
      if(!count)throw Error('Lượt ghi chưa có người diễn.');
      // Manual marks become actual SHOW timeline markers, not only an unsaved counter.
      for(const m of R.marks){seq.markers.push({id:uid('marker'),name:String(m.label||'Manual mark').slice(0,48),time:n(R.start+m.t,R.start,R.end)});}
      dirty11();seq.enabled=true;invalidateSeq();
      R.history.push({sceneId:scene.id,actId:a.id,name:scene.name,start:scene.start,duration:scene.duration,marks:R.marks.length,people:count});
      R.history=R.history.slice(-40);R.mode='idle';R.states.clear();R.samples.clear();R.marks=[];R.drag=null;
      toggleSequence(true);renderSequence();seekTimeline(scene.start);renderUI();
      updateLabel('Đã lưu '+scene.name+' ('+count+' người, '+duration.toFixed(2)+'s) vào SHOW Timeline.');
      paintMode();renderSaved();return scene;
    }catch(err){if(scene){seq.clips=seq.clips.filter(c=>c.scene10!==scene.id);stage10.scenes=stage10.scenes.filter(s=>s.id!==scene.id);invalidateSeq();}
      updateLabel('Không lưu được: '+(err.message||err));return null;
    }
  }
  function replay(){if(R.mode==='record'){updateLabel('Kết thúc ghi trước khi phát thử.');return;}
    if(R.mode==='review'){seekTimeline(R.start);setPlaying(true);updateLabel('Đang duyệt lại thao tác vừa ghi.');return;}
    const last=R.history.at(-1);if(last&&stage10.scenes.some(s=>s.id===last.sceneId))playScene10(last.sceneId,false);
    else updateLabel('Chưa có cảnh đã lưu.');
  }
  function tick(now){if(!R.open && R.mode==='idle'){R.clockRAF=requestAnimationFrame(tick);return;}
    if(R.mode==='record'){
      // Keep all data in the native timeline timebase (no independent drift clock).
      R.elapsed=currentElapsed();
      if(R.hold){const dt=n((now-(R.holdLast||now))/1000,0,.08);R.holdLast=now;move(R.personId,R.hold,R.speed*dt);}
      if(state.duration-state.time<2 && state.duration<600)ensureDuration10(Math.min(600,state.duration+6));
      if(R.elapsed>=R.maxSeconds-.02 || state.time>=599.95){end();}
      else if(now-R.wallLast>135){allSamples(false);R.wallLast=now;}
    }
    if(R.mode==='review'&&state.playing&&state.time>=R.end){setPlaying(false);}
    if(now-R.uiLast>80){R.uiLast=now;updateTime();}
    R.clockRAF=requestAnimationFrame(tick);
  }
  function updateTime(){const t=R.mode==='review'?R.end:R.mode==='record'?state.time:n(Number(ed('m131Start')?.value)||state.time,0,600);
    const el=ed('m131TC');if(el)el.textContent=tc(t);
    const el2=ed('m131Elapsed');if(el2)el2.textContent=tc(R.mode==='record'?R.elapsed:R.mode==='review'?R.end-R.start:0);
    const el3=ed('m131ClockState');if(el3)el3.textContent=R.mode==='record'?'ĐANG GHI':R.mode==='review'?'CHỜ LƯU':'SẴN SÀNG';
    const progress=ed('m131Bar');if(progress)progress.style.width=(R.mode==='record'?n(R.elapsed/R.maxSeconds*100,0,100):R.mode==='review'?100:0)+'%';
    const startClock=ed('m131ClockStart');if(startClock)startClock.textContent=tc(R.start);
    const endClock=ed('m131ClockEnd');if(endClock)endClock.textContent=R.mode==='idle'?'--:--:--:--':tc(R.mode==='review'?R.end:state.time);
  }
  function renderMarkers(){const host=ed('m131Markers');if(!host)return;host.innerHTML=R.marks.length?R.marks.map((m,i)=>`<button type="button" data-m131-seek="${i}"><b>${tc(R.start+m.t)}</b><span>${txt(m.label)}</span></button>`).join(''):'<span class="m131-muted">Các mốc thao tác sẽ xuất hiện ở đây.</span>';
    host.querySelectorAll('[data-m131-seek]').forEach(b=>b.onclick=()=>{if(R.mode==='record')return;const m=R.marks[Number(b.dataset.m131Seek)];if(m)seekTimeline(R.start+m.t);});}
  function renderSaved(){const host=ed('m131Saved');if(!host)return;const list=R.history.filter(h=>stage10.scenes.some(s=>s.id===h.sceneId));
    host.innerHTML=list.length?list.slice().reverse().slice(0,8).map(h=>`<button data-m131-scene="${txt(h.sceneId)}"><strong>${txt(h.name)}</strong><small>${tc(h.start)} · ${h.duration.toFixed(2)}s · ${h.people} người</small></button>`).join(''):'<div class="m131-muted">Cảnh đã lưu sẽ xuất hiện ở đây.</div>';
    host.querySelectorAll('[data-m131-scene]').forEach(b=>b.onclick=()=>{close();playScene10(b.dataset.m131Scene,false);});}
  function updatePoseInfo(){const d=R.states.get(R.personId),el=ed('m131Pos');if(el)el.textContent=d?`X ${d.pos[0].toFixed(2)} · Z ${d.pos[2].toFixed(2)} · ${d.yaw.toFixed(0)}°`:'Chưa chọn người';}
  function renderActions(){document.querySelectorAll('[data-m131-action]').forEach(b=>b.classList.toggle('selected',R.states.get(R.personId)?.action===b.dataset.m131Action));}
  function paintMode(){const a=R.mode;
    for(const [id,on] of [['m131StartBtn',a==='idle'],['m131MarkBtn',a==='record'],['m131EndBtn',a==='record'],['m131SaveBtn',a==='review'],['m131ReplayBtn',a==='review'||a==='idle'],['m131CancelBtn',a!=='idle']])if(ed(id))ed(id).disabled=!on;
    for(const id of ['m131Act','m131Name','m131Start','m131Fps','m131CreateAct'])if(ed(id))ed(id).disabled=a!=='idle'&&id!=='m131Fps';
    const b=ed('m131StartBtn');if(b)b.classList.toggle('recording',a==='record');
    updatePoseInfo();renderActions();renderSaved();
  }
  function buildUI(){if(!ed('m131Panel'))return;const panel=ed('m131Panel');panel.innerHTML=`
    <header class="m131-header"><div><b>● MANUAL TAKE / GHI TAY</b><small>Điều khiển thật → chuyển thành cảnh biên đạo</small></div><button id="m131Close" title="Đóng">×</button></header>
    <div class="m131-scroll">
      <section class="m131-section"><h3>01 / TÊN CẢNH · TIẾT MỤC</h3>
        <label>Tên cảnh<input id="m131Name" value="${txt(R.sceneName)}" maxlength="64" placeholder="Ví dụ: Múa quạt mở màn"></label>
        <label>Tiết mục cần ghi<select id="m131Act"></select></label><button class="m131-minor" id="m131CreateAct">+ Tạo nhóm biên đạo 4 người</button>
        <label>Chọn người điều khiển<select id="m131Person"></select></label>
      </section>
      <section class="m131-section m131-clockbox"><h3>02 / GHI TIME TRỰC TIẾP</h3>
        <div class="m131-row"><label style="flex:1">Giây bắt đầu<input type="number" id="m131Start" min="0" max="599" step=".1" value="${n(state.time,0,599).toFixed(2)}"></label><label style="width:86px">FPS<select id="m131Fps">${FPS_OPTIONS.map(f=>`<option value="${f}" ${f===R.fps?'selected':''}>${f} fps</option>`).join('')}</select></label></div>
        <div class="m131-clock"><b id="m131TC">00:00:00:00</b><span id="m131ClockState">SẴN SÀNG</span></div>
        <div class="m131-clockmeta"><span>BẮT ĐẦU <b id="m131ClockStart">--:--</b></span><span>KẾT THÚC <b id="m131ClockEnd">--:--</b></span></div>
        <div class="m131-meter"><div id="m131Bar"></div></div>
        <div class="m131-elapsed">Thời lượng đã ghi: <strong id="m131Elapsed">00:00:00:00</strong></div>
        <div class="m131-row m131-actions"><button id="m131StartBtn" class="m131-green">● BẮT ĐẦU</button><button id="m131MarkBtn">◆ ĐÁNH DẤU</button><button id="m131EndBtn" class="m131-red">■ KẾT THÚC</button></div>
        <div class="m131-row m131-actions"><button id="m131ReplayBtn">▶ Phát lại</button><button id="m131CancelBtn">Hủy lượt ghi</button></div>
      </section>
      <section class="m131-section"><h3>03 / CHỈ TAY · DI CHUYỂN NGƯỜI</h3>
        <div class="m131-help">Giữ nút hướng để nhân vật di chuyển; hoặc <b>kéo người trực tiếp trong khung 3D</b> khi đang ghi. Mỗi chuyển động tự tạo mốc vị trí.</div>
        <div class="m131-dpad">
          <span></span><button data-m131-jog="forward" title="Tiến vào sân khấu">↑</button><span></span>
          <button data-m131-jog="left" title="Qua trái">←</button><button data-m131-jog="back" title="Lùi lại">↓</button><button data-m131-jog="right" title="Qua phải">→</button>
        </div>
        <div class="m131-row m131-actions"><button data-m131-jog="turnLeft">↶ Xoay trái</button><button data-m131-jog="turnRight">Xoay phải ↷</button></div>
        <label>Tốc độ di chuyển <input id="m131Speed" type="range" min=".2" max="3" step=".1" value="${R.speed}"><small id="m131SpeedOut">${R.speed.toFixed(1)} m/s</small></label>
        <div id="m131Pos" class="m131-coords">X 0.00 · Z 0.00</div>
        <h4>ĐỘNG TÁC BẤM LÀ GHI</h4>
        <div class="m131-posegrid">${[['walk','BƯỚC'],['dance','MÚA'],['reach','VƯƠN'],['turn','XOAY'],['hold','DỪNG'],['drum','TRỐNG'],['glide','LƯỚT']].map(([a,b])=>`<button data-m131-action="${a}">${b}</button>`).join('')}</div>
      </section>
      <section class="m131-section"><h3>04 / MỐC ĐÃ GHI</h3><div id="m131Markers" class="m131-markers"></div></section>
      <section class="m131-section m131-save"><button id="m131SaveBtn" class="m131-savebtn">+ LƯU CẢNH VÀO SHOW TIME</button><p>Ghi lại đường di chuyển và động tác của từng người trong clip biên đạo. Không thay đổi model, UV, LED hay đèn.</p></section>
      <section class="m131-section"><h3>CẢNH ĐÃ LƯU</h3><div id="m131Saved" class="m131-saved"></div></section>
    </div><footer id="m131Status">${txt(R.lastMessage)}</footer>`;
    ed('m131Close').onclick=close;
    ed('m131Act').onchange=e=>{R.actId=e.target.value;refreshActSelect();paintMode();};
    ed('m131Person').onchange=e=>{R.personId=e.target.value;renderActions();updatePoseInfo();};
    ed('m131Name').onchange=e=>R.sceneName=e.target.value;
    ed('m131Fps').onchange=e=>{R.fps=+e.target.value;updateTime();};
    ed('m131CreateAct').onclick=()=>{if(R.mode==='record')return;const a=addAct8('dance');if(a){R.actId=a.id;R.personId=a.people?.[0]||'';refreshActSelect();updateLabel('Đã tạo nhóm mới. Chọn Bắt đầu để ghi.');}};
    ed('m131StartBtn').onclick=start;ed('m131MarkBtn').onclick=()=>mark('Mốc '+(R.marks.length+1));ed('m131EndBtn').onclick=end;
    ed('m131SaveBtn').onclick=save;ed('m131CancelBtn').onclick=cancel;ed('m131ReplayBtn').onclick=replay;
    ed('m131Speed').oninput=e=>{R.speed=+e.target.value;ed('m131SpeedOut').textContent=R.speed.toFixed(1)+' m/s';};
    for(const b of panel.querySelectorAll('[data-m131-action]'))b.onclick=()=>setAction(b.dataset.m131Action);
    for(const b of panel.querySelectorAll('[data-m131-jog]')){
      b.addEventListener('pointerdown',e=>{if(R.mode!=='record')return;e.preventDefault();b.setPointerCapture?.(e.pointerId);R.hold=b.dataset.m131Jog;R.holdLast=performance.now();b.dataset.started=String(R.holdLast);b.classList.add('held');});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>{
        if(R.hold!==b.dataset.m131Jog)return;const d=performance.now()-Number(b.dataset.started||0);if(d<230)move(R.personId,R.hold,.23);recordSample(R.personId,true);R.hold=null;b.classList.remove('held');});
    }
    refreshActSelect();paintMode();updateTime();renderMarkers();renderSaved();
  }
  function syncHost(){const panel=ed('m131Panel');if(!panel)return;
    if(R.open){const present=!!state.presenting;const container=present?document.body:document.querySelector('.right-panel');
      if(container&&panel.parentElement!==container)container.appendChild(panel);
      document.body.classList.toggle('m131-present-open',present);document.body.classList.toggle('m131-edit-open',!present);
      panel.hidden=false;
    }else{document.body.classList.remove('m131-present-open','m131-edit-open');panel.hidden=true;}
    for(const b of document.querySelectorAll('[data-m131-toggle]'))b.classList.toggle('active',R.open);
  }
  function open(){if(R.open)return close();S.vj130?.open(null);$('pro127close')?.click();$('liftClose124')?.click();
    if(choreo11.open)closeChoreo11();R.open=true;syncHost();buildUI();updateTime();}
  function close(){if(R.mode==='record'){end();}R.hold=null;R.open=false;syncHost();}
  function startPointer(e){if(R.mode!=='record'||e.button!==0||e.target!==engine.canvas||engine.view!=='stage'||!R.open)return;
    const ray=dirRay(e.clientX,e.clientY);if(!ray)return;
    let nearest=null;
    for(const p of people())for(const node of castCache.get(p.id)||[])for(const mesh of node.meshes){
      const hit=rayMesh8(ray,mesh,castMatrix(p,node,state.time));if(hit&&(!nearest||hit.distance<nearest.hit.distance))nearest={p,hit};
    }
    if(!nearest)return;
    e.preventDefault();e.stopImmediatePropagation();
    R.personId=nearest.p.id;const d=R.states.get(R.personId);if(!d)return;
    const plane=dirPlane(ray,d.pos,[0,1,0]);R.drag={p:nearest.p,from:[...d.pos],origin:plane,started:performance.now()};
    ed('m131Person').value=R.personId;renderActions();updatePoseInfo();
    try{engine.canvas.setPointerCapture(e.pointerId);}catch(_){ }
  }
  function dragPointer(e){if(!R.drag)return;e.preventDefault();e.stopImmediatePropagation();
    const d=R.states.get(R.drag.p.id),pt=dirPlane(dirRay(e.clientX,e.clientY),d.pos,[0,1,0]);if(!pt||!R.drag.origin)return;
    const old=[...d.pos];d.pos=[R.drag.from[0]+pt[0]-R.drag.origin[0],d.pos[1],R.drag.from[2]+pt[2]-R.drag.origin[2]];
    const dx=d.pos[0]-old[0],dz=d.pos[2]-old[2],dist=Math.hypot(dx,dz);
    if(dist>.0001){d.distance+=dist;d.speed=n(dist/.06,.2,3.3);d.direction=[dx/dist,0,dz/dist];if(d.action==='hold')d.action='walk';R.seenMove=true;}
    recordSample(R.drag.p.id);poseCache11?.clear?.();updatePoseInfo();
  }
  function endPointer(e){if(!R.drag)return;e.preventDefault();e.stopImmediatePropagation();recordSample(R.drag.p.id,true);R.drag=null;}
  function install(){const panel=document.createElement('aside');panel.id='m131Panel';panel.hidden=true;document.querySelector('.right-panel')?.appendChild(panel);
    const tools=$('dirToolbar');if(tools){const b=document.createElement('button');b.className='btn small m131-launch';b.textContent='● GHI TAY / SCENE';b.dataset.m131Toggle='1';b.onclick=open;tools.appendChild(b);}
    const row=$('presentControls')?.querySelector('.show-row');if(row){const b=document.createElement('button');b.className='btn small m131-launch';b.textContent='● GHI BIÊN ĐẠO';b.dataset.m131Toggle='1';b.onclick=open;row.prepend(b);}
    document.addEventListener('pointerdown',startPointer,true);document.addEventListener('pointermove',dragPointer,true);document.addEventListener('pointerup',endPointer,true);document.addEventListener('pointercancel',endPointer,true);
    window.addEventListener('blur',()=>{R.hold=null;R.drag=null;});
    const o=new MutationObserver(()=>{if(R.open)syncHost();});o.observe(document.body,{attributes:true,attributeFilter:['class']});
    const oldPack=packLiveExtras,oldRestore=restoreLiveExtras,oldSnapshot=snapshot,oldUndo=restore;
    packLiveExtras=async function(){const d=await oldPack();d.manual131={version:1,fps:R.fps,history:R.history};return d;};
    restoreLiveExtras=async function(d){if(R.mode==='record')end();R.mode='idle';R.states.clear();R.samples.clear();R.marks=[];
      await oldRestore(d);R.history=(Array.isArray(d?.manual131?.history)?d.manual131.history:[]).slice(-40).filter(h=>stage10.scenes.some(s=>s.id===h.sceneId));
      R.fps=FPS_OPTIONS.includes(+d?.manual131?.fps)?+d.manual131.fps:30; if(R.open)buildUI();};
    snapshot=function(){const d=oldSnapshot();d.manual131={fps:R.fps,history:structuredClone(R.history)};return d;};
    restore=function(d){oldUndo(d);R.history=Array.isArray(d?.manual131?.history)?structuredClone(d.manual131.history):[];
      R.fps=FPS_OPTIONS.includes(d?.manual131?.fps)?d.manual131.fps:R.fps;if(R.open)buildUI();};
    R.clockRAF=requestAnimationFrame(tick);
    S.manual131={open,close,start,end,cancel,save,replay,get state(){return {mode:R.mode,start:R.start,end:R.end,elapsed:R.elapsed,samples:[...R.samples].map(([id,x])=>({id,count:x.length})),scenes:structuredClone(R.history)};},
      selectAct:id=>{R.actId=id;if(R.open)buildUI();}, jog:(dir,amount=.25)=>move(R.personId,dir,amount), mark};
    S.version='13.1.0';document.title='ALPHA Creative LED Studio V13.1 · MANUAL TAKE';
    document.querySelector('.brand small')?.insertAdjacentText('beforeend',' · V13.1 GHI TAY');
  }
  install();
}catch(err){console.error('Manual Take add-on failed; V13.0 remains usable',err);}
})();

/* ALPHA Creative LED Studio V13.2 — Manual LIGHT Take recorder.
   Stores fixture states in deterministic time-coded cues; never modifies LED UVs,
   stage geometry, or choreography routes. Uses V12.8 fixture dock + V13.0 stable renderer. */
(function(){
'use strict';
try {
  if(!window.STUDIO || typeof seq==='undefined' || !engine || !lighting9) return;
  const S=window.STUDIO, EPS=1e-6, MAX_TAKES=48, MAX_FRAMES=2200;
  const E=id=>document.getElementById(id);
  const clamp132=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:a));
  const escape132=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uuid132=()=>`take_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const id132=()=>`lt_${Math.random().toString(36).slice(2,10)}`;
  const R={mode:'idle',name:'Lighting / Ghi tay 01',fps:30,scope:'all',start:0,end:0,duration:0,
    ids:[],samples:new Map(),base:new Map(),marks:[],takes:new Map(),saved:[],lastCount:0,
    priorLoop:false,priorSequence:false,startDraft:null,selectedTake:null,status:'Sẵn sàng ghi chuyển động đèn.',
    wallSample:0,wallUI:0,needUI:true,followTimeline:true};
  const prefix='manual132:';
  function timecode132(t){const n=Math.max(0,Math.floor(Math.max(0,t)*R.fps+1e-5)),f=n%R.fps,s=Math.floor(n/R.fps);return [Math.floor(s/3600),Math.floor(s/60)%60,s%60,f].map(x=>String(x).padStart(2,'0')).join(':');}
  function selected132(){return engine.lights.find(l=>l.id===S.pro127?.selected)||engine.lights.find(l=>l.id===state.selectedLight)||engine.lights[0]||null;}
  function snap132(l){return {
    id:l.id,pos:(l.pos||[0,0,0]).slice(0,3).map(v=>+v||0),target:(l.target||[0,0,0]).slice(0,3).map(v=>+v||0),
    color:/^#[0-9a-f]{6}$/i.test(l.color||'')?l.color:'#ffffff',power:clamp132(l.power,0,20),angle:clamp132(l.angle,1,89),boost:clamp132(l.boost??1,0,4),
    enabled:l.enabled!==false,sweep:!!l.sweep,motion128:String(l.motion128||'static'),motionAmp128:clamp132(l.motionAmp128||0,0,180),motionSpeed128:clamp132(l.motionSpeed128||0,0,12),fx:['steady','pulse','strobe','build'].includes(l.fx)?l.fx:'steady',fxDepth:clamp132(l.fxDepth??.5,0,1),fxSpeed:clamp132(l.fxSpeed??2,.1,18)
  };}
  function cloneState132(p){return {...p,pos:[...p.pos],target:[...p.target]};}
  function sdist132(a,b){let v=0;for(const k of ['pos','target'])for(let i=0;i<3;i++)v=Math.max(v,Math.abs(a[k][i]-b[k][i]));return v;}
  function changed132(a,b){return !a||sdist132(a,b)>.008||a.color!==b.color||a.enabled!==b.enabled||a.fx!==b.fx||Math.abs(a.power-b.power)>.03||Math.abs(a.angle-b.angle)>.09||Math.abs(a.boost-b.boost)>.02||Math.abs(a.fxDepth-b.fxDepth)>.02||Math.abs(a.fxSpeed-b.fxSpeed)>.08;}
  function toSample132(p,t){return {t:Math.max(0,Math.round(t*1000)/1000),...cloneState132(p)};}
  function count132(){return [...R.samples.values()].reduce((n,a)=>n+a.length,0);}
  function record132(force=false){if(R.mode!=='record')return;
    const elapsed=clamp132(state.time-R.start,0,120);for(const id of R.ids){const l=engine.lights.find(x=>x.id===id);if(!l)continue;
      const next=toSample132(snap132(l),elapsed),arr=R.samples.get(id),last=arr?.at(-1);if(!arr)continue;
      const dt=last?next.t-last.t:999;
      if(last && dt<.025){if(force&&changed132(last,next))arr[arr.length-1]=next;continue;}
      if(!force&&last&&!changed132(last,next)&&dt<.8)continue;
      if(!force&&dt<.065)continue;
      if(arr.length<MAX_FRAMES){arr.push(next);}else if(force){arr[arr.length-1]=next;}
    }R.lastCount=count132();R.needUI=true;
  }
  function fmtStatus132(msg){R.status=msg;R.needUI=true;const s=E('l132Status');if(s)s.textContent=msg;}
  function marker132(){if(R.mode!=='record')return;record132(true);const name=E('l132MarkName')?.value.trim()||`Điểm đèn ${R.marks.length+1}`;
    const t=clamp132(state.time-R.start,0,120);R.marks.push({time:t,name:name.slice(0,48)});fmtStatus132(`◆ Đánh dấu tại ${timecode132(state.time)} — ${name}`);}
  function prepare132(){const from=Number(E('l132StartTime')?.value);R.start=Number.isFinite(from)?clamp132(from,0,599.5):clamp132(state.time,0,599.5);
    R.name=(E('l132Name')?.value||`Ghi đèn ${R.saved.length+1}`).trim().slice(0,60)||'Ghi thao tác đèn';R.fps=[24,25,30,50,60].includes(+E('l132FPS')?.value)?+E('l132FPS').value:30;
    R.scope=E('l132Scope')?.value==='selected'?'selected':'all';
    R.ids=R.scope==='selected'?[selected132()?.id].filter(Boolean):engine.lights.map(l=>l.id);
    if(!R.ids.length){fmtStatus132('Chưa có đèn. Thêm đèn trong thư viện trước khi ghi.');return false;}
    R.base=new Map(engine.lights.map(l=>[l.id,snap132(l)]));R.samples=new Map();
    for(const id of R.ids){const l=engine.lights.find(x=>x.id===id);if(l)R.samples.set(id,[toSample132(snap132(l),0)]);}
    R.marks=[];R.end=R.start;R.duration=0;R.lastCount=R.ids.length;R.priorLoop=!!state.loop;R.priorSequence=!!seq.enabled;return true;
  }
  function start132(){if(R.mode==='record')return false;if(S.manual131?.state?.mode==='record'){fmtStatus132('Hãy kết thúc lượt ghi biên đạo người trước khi ghi đèn.');return false;}if(R.mode==='review')discard132(false);
    if(!prepare132())return false;
    if(typeof ensureDuration10==='function')ensureDuration10(Math.min(600,Math.max(state.duration,R.start+Math.min(8,600-R.start))));
    else state.duration=Math.max(state.duration,R.start+8);
    state.loop=false;lighting9.preview=null;
    enableSequence(true);seekTimeline(R.start);R.mode='record';setPlaying(true);
    fmtStatus132('● ĐANG GHI: kéo Pan/Tilt, điểm chiếu, vị trí, màu hoặc dimmer của đèn.');update132();return true;
  }
  function end132(){if(R.mode!=='record')return false;record132(true);
    R.end=clamp132(Math.max(state.time,R.start+.12),R.start+.12,Math.min(600,R.start+120));R.duration=R.end-R.start;
    for(const [id,arr] of R.samples){const last=arr.at(-1);if(last&&last.t<R.duration-.005)arr.push({...cloneState132(last),t:R.duration});}
    R.mode='review';setPlaying(false);state.loop=R.priorLoop;seekTimeline(R.start);
    fmtStatus132(`■ Kết thúc: ${R.duration.toFixed(2)}s, ${count132()} keyframe. Bấm LƯU CẢNH vào SHOW TIME.`);update132();return true;
  }
  function restoreBase132(){for(const [id,s] of R.base){const l=engine.lights.find(x=>x.id===id);if(!l)continue;
    Object.assign(l,cloneState132(s));
  }engine.rebuildFixtures();}
  function discard132(restore=true){if(R.mode==='record')setPlaying(false);
    if(restore && R.base.size)restoreBase132();state.loop=R.priorLoop;
    R.mode='idle';R.samples.clear();R.ids=[];R.base.clear();R.marks=[];R.end=R.start;R.duration=0;
    invalidateSeq();fmtStatus132('Đã hủy lượt ghi đèn, không tác động mapping/biên đạo.');update132();}
  function colorBlend132(a,b,u){let c='#';for(let i=1;i<7;i+=2){const x=parseInt(a.slice(i,i+2),16),y=parseInt(b.slice(i,i+2),16);c+=Math.round(x+(y-x)*u).toString(16).padStart(2,'0');}return c;}
  function lerpState132(samples,t,smooth=false){if(!samples?.length)return null;if(t<=samples[0].t)return cloneState132(samples[0]);if(t>=samples.at(-1).t)return cloneState132(samples.at(-1));
    let lo=0,hi=samples.length-1;while(hi-lo>1){const mid=(hi+lo)>>1;if(samples[mid].t<=t)lo=mid;else hi=mid;}
    const a=samples[lo],b=samples[hi],k=clamp132((t-a.t)/Math.max(EPS,b.t-a.t),0,1),u=smooth?k*k*(3-2*k):k;
    const v={id:a.id,pos:a.pos.map((x,i)=>x+(b.pos[i]-x)*u),target:a.target.map((x,i)=>x+(b.target[i]-x)*u),color:colorBlend132(a.color,b.color,u)};
    for(const f of ['power','angle','boost','fxDepth','fxSpeed'])v[f]=a[f]+(b[f]-a[f])*u;
    for(const f of ['enabled','fx','sweep','motion128','motionAmp128','motionSpeed128'])v[f]=k<.5?a[f]:b[f];return v;
  }
  function applyLamp132(out,id,s){if(!s)return;const i=out.findIndex(l=>l.id===id);if(i<0)return;
    out[i]={...out[i],...cloneState132(s),sweep:false,motion128:'static',_target:[...s.target],_mult:1};
  }
  function activeTakeClips132(time){return activeClips(time,'light').filter(({c})=>typeof c.source==='string'&&c.source.startsWith(prefix));}
  const beforeEvaluate132=evaluateLightSequence9;
  const nativeActiveClips132=activeClips;let omitManualInNative132=false;
  activeClips=function(t,type){const clips=nativeActiveClips132(t,type);return omitManualInNative132&&type==='light'?clips.filter(({c})=>!String(c.source||'').startsWith(prefix)):clips;};
  evaluateLightSequence9=function(t){
    const cues=activeTakeClips132(t);
    let out;omitManualInNative132=true;try{out=beforeEvaluate132(t);}finally{omitManualInNative132=false;}
    if(!out && !cues.length && !['record','review'].includes(R.mode))return null;
    out=(out||engine.lights).map(l=>({...l,pos:[...l.pos],target:[...l.target]}));
    for(const {c} of cues){const take=R.takes.get(c.source.slice(prefix.length));if(!take)continue;
      const src=clamp132((t-c.start)*(c.rate||1)+(c.in||0),0,take.duration);
      for(const lamp of take.lamps){const state=lerpState132(lamp.frames,src);applyLamp132(out,lamp.id,state);}
    }
    if(R.mode==='record')for(const id of R.ids){const live=engine.lights.find(x=>x.id===id);if(live)applyLamp132(out,id,snap132(live));}
    else if(R.mode==='review'){const secs=clamp132(t-R.start,0,R.duration);for(const [id,frames] of R.samples)applyLamp132(out,id,lerpState132(frames,secs));}
    return out;
  };
  // V12.8 direct-manual widgets have an internal setManualMode() helper.
  // The V13.2 HTML build adjusts that helper to keep the shared show clock active
  // when recording. The direct input widgets remain fully functional.
  function validTake132(d){if(!d||typeof d!=='object'||!String(d.id||'').startsWith('take_'))return null;
    const dur=clamp132(d.duration,.1,120);
    const lamps=(Array.isArray(d.lamps)?d.lamps:[]).slice(0,16).map(l=>{
      const arr=(Array.isArray(l.frames)?l.frames:[]).slice(0,MAX_FRAMES).filter(q=>q&&Array.isArray(q.pos)&&Array.isArray(q.target)&&q.pos.length===3&&q.target.length===3&&q.pos.every(Number.isFinite)&&q.target.every(Number.isFinite)&&Number.isFinite(q.t)).map(q=>({
        id:String(l.id||q.id),t:clamp132(q.t,0,dur),pos:q.pos.map(v=>clamp132(v,-1000,1000)),target:q.target.map(v=>clamp132(v,-1000,1000)),color:/^#[0-9a-f]{6}$/i.test(q.color)?q.color:'#ffffff',
        power:clamp132(q.power,0,20),angle:clamp132(q.angle,1,89),boost:clamp132(q.boost,0,4),enabled:q.enabled!==false,sweep:!!q.sweep,motion128:String(q.motion128||'static'),motionAmp128:clamp132(q.motionAmp128||0,0,180),motionSpeed128:clamp132(q.motionSpeed128||0,0,12),fx:['steady','pulse','strobe','build'].includes(q.fx)?q.fx:'steady',fxDepth:clamp132(q.fxDepth,0,1),fxSpeed:clamp132(q.fxSpeed,.1,18)
      })).sort((a,b)=>a.t-b.t);
      return {id:String(l.id||''),frames:arr};
    }).filter(l=>l.id&&l.frames.length);
    if(!lamps.length)return null;
    return {id:String(d.id).slice(0,80),name:String(d.name||'Ghi đèn').slice(0,60),duration:dur,fps:[24,25,30,50,60].includes(+d.fps)?+d.fps:30,lamps,marks:(Array.isArray(d.marks)?d.marks:[]).slice(0,100).map(m=>({time:clamp132(m.time,0,dur),name:String(m.name||'Mốc đèn').slice(0,48)}))};
  }
  function save132(){if(R.mode!=='review')return null;if(seq.clips.length>=495){fmtStatus132('Timeline đã quá 495 clip; xóa bớt trước khi ghi.');return null;}
    const data=validTake132({id:uuid132(),name:R.name,duration:R.duration,fps:R.fps,marks:R.marks,lamps:[...R.samples.entries()].map(([id,frames])=>({id,frames}))});
    if(!data){fmtStatus132('Không có dữ liệu đèn hợp lệ để lưu.');return null;}
    let track=seq.tracks.find(tr=>tr.type==='light'&&tr.name==='LIGHT TAKE / GHI ĐÈN');
    if(!track&&seq.tracks.length>=24){fmtStatus132('Đã đủ 24 track. Hãy xóa bớt một track để lưu cảnh.');return null;}
    checkpoint();R.takes.set(data.id,data);
    if(!track){track={id:id132(),name:'LIGHT TAKE / GHI ĐÈN',type:'light',target:'all',muted:false};seq.tracks.push(track);}
    if(typeof ensureDuration10==='function')ensureDuration10(R.end+.1);
    else state.duration=Math.max(state.duration,R.end+.1);
    const clip=addClip(track.id,{source:prefix+data.id,name:'● '+R.name,start:R.start,duration:R.duration,rate:1,in:0,loop:false,fade:0,gain:1,color:'#f2ae68'});
    if(!clip){R.takes.delete(data.id);fmtStatus132('Không thể tạo clip trên timeline.');return null;}
    const scene={id:id132(),name:R.name,start:R.start,duration:R.duration,actId:null,color:'#d39867',clipIds:[clip.id]};
    stage10.scenes.push(scene);stage10.selectedScene=scene.id;clip.scene10=scene.id;
    for(const m of data.marks)seq.markers.push({id:id132(),time:Math.min(600,R.start+m.time),name:'LIGHT / '+m.name});
    R.startDraft=null;R.saved.push({id:data.id,sceneId:scene.id,clipId:clip.id,name:R.name,start:R.start,duration:R.duration,count:count132()});R.saved=R.saved.slice(-48);
    restoreBase132();R.samples.clear();R.base.clear();R.marks=[];R.mode='idle';R.ids=[];R.selectedTake=data.id;
    enableSequence(true);seekTimeline(R.start);renderSequence();fmtStatus132('✓ Đã lưu cảnh đèn vào SHOW TIME. Kéo clip màu cam để dời lịch; phát lại để kiểm tra.');update132();return {clip,scene,take:data};
  }
  function replay132(){const item=R.saved.at(-1);if(!item){fmtStatus132('Chưa có cảnh đèn nào được lưu.');return false;}if(R.mode==='record')return false;
    R.mode='idle';enableSequence(true);seekTimeline(item.start);setPlaying(true);fmtStatus132(`▶ Đang phát lại ${item.name}.`);return true;
  }
  function update132(){const panel=E('l132Panel');if(!panel)return;
    const writing=R.mode==='record',review=R.mode==='review';
    const cur=writing?state.time:review?R.end:state.time;
    const e=E('l132TC');if(e)e.textContent=timecode132(cur);
    const q=E('l132Elapsed');if(q)q.textContent=timecode132(writing?state.time-R.start:review?R.duration:0);
    const st=E('l132State');if(st){st.textContent=writing?'● ĐANG GHI':review?'■ CHỜ LƯU':'SẴN SÀNG';st.dataset.mode=R.mode;}
    const bar=E('l132Bar');if(bar)bar.style.width=`${review?100:writing?clamp132((state.time-R.start)/Math.max(.1,Math.min(120,state.duration-R.start))*100,0,100):0}%`;
    const count=E('l132Count');if(count)count.textContent=String(count132());
    const start=E('l132StartRead');if(start)start.textContent=timecode132(R.start);
    const end=E('l132EndRead');if(end)end.textContent=review?timecode132(R.end):writing?timecode132(state.time):'--:--:--:--';
    const msg=E('l132Status');if(msg)msg.textContent=R.status;
    for(const [id,allowed] of [['l132Begin',R.mode==='idle'],['l132Mark',writing],['l132End',writing],['l132Save',review],['l132Cancel',writing||review],['l132Replay',R.saved.length>0]])if(E(id))E(id).disabled=!allowed;
    for(const id of ['l132Scope','l132StartTime','l132Name','l132FPS'])if(E(id))E(id).disabled=R.mode!=='idle';
    const btn=E('l132Launch');if(btn){btn.textContent=writing?'● ĐANG GHI ĐÈN':'● Ghi thao tác đèn';btn.classList.toggle('recording132',writing);}
    const markers=E('l132Markers');if(markers){const str=R.marks.map(m=>`${timecode132(R.start+m.time)} ${m.name}`).join('  ·  ');if(markers.textContent!==str)markers.textContent=str;}
    const saved=E('l132Saved');if(saved){const item=R.saved.at(-1);saved.textContent=item?`CẢNH GẦN NHẤT: ${item.name} · ${item.duration.toFixed(2)}s · ${item.count} mẫu`:'Chưa lưu cảnh đèn.';}
    if(R.needUI){R.needUI=false;drawChart132();}
  }
  function drawChart132(){const svg=E('l132Chart');if(!svg)return;
    const selected=selected132(),id=R.samples.has(selected?.id)?selected?.id:R.ids[0],arr=R.samples.get(id);
    if(!arr||arr.length<2){svg.innerHTML='<text x="10" y="38" fill="#7798b0" font-size="11">Di chuyển Pan/Tilt để hiển thị đường ghi.</text>';return;}
    const duration=Math.max(.1,R.mode==='review'?R.duration:state.time-R.start),pts=a=>arr.map(p=>{
      const d=p.target.map((v,i)=>v-p.pos[i]),pan=Math.atan2(d[0],d[2])*180/Math.PI,tilt=Math.atan2(d[1],Math.hypot(d[0],d[2]))*180/Math.PI;
      const val=a==='pan'?pan:tilt;return `${(8+p.t/duration*292).toFixed(1)},${(a==='pan'?38-pan/180*28:55-tilt/90*24).toFixed(1)}`;
    }).join(' ');
    svg.innerHTML=`<polyline points="${pts('pan')}" fill="none" stroke="#5ce3d5" stroke-width="1.7"/><polyline points="${pts('tilt')}" fill="none" stroke="#f7b76d" stroke-width="1.6"/><text x="8" y="12" fill="#87e3d4" font-size="9">PAN</text><text x="48" y="12" fill="#f7b76d" font-size="9">TILT</text>`;
  }
  const PANEL=`<section id="l132Panel" aria-label="Ghi thao tác đèn theo timecode">
      <div class="l132-top"><b>● LIGHT TAKE / GHI ĐÈN</b><span id="l132State">SẴN SÀNG</span></div>
      <p>Điều khiển Pan/Tilt, điểm chiếu, XYZ, màu và dimmer ở các thanh bên dưới; mỗi thao tác sẽ thành keyframe của một cảnh đèn.</p>
      <label class="l132-label">Tên cảnh<input id="l132Name" maxlength="60" value="Lighting / Ghi tay 01"></label>
      <div class="l132-grid">
        <label class="l132-label">Bắt đầu (giây)<input id="l132StartTime" type="number" min="0" max="599.5" step=".1" value="0"></label>
        <label class="l132-label">FPS<select id="l132FPS"><option>24</option><option>25</option><option selected>30</option><option>50</option><option>60</option></select></label>
      </div>
      <label class="l132-label">Ghi đèn<select id="l132Scope"><option value="all">Tất cả đèn — nhiều đèn cùng một cảnh</option><option value="selected">Chỉ đèn đang chọn</option></select></label>
      <div class="l132-clock"><strong id="l132TC">00:00:00:00</strong><small id="l132Elapsed">00:00:00:00</small></div>
      <div class="l132-ends"><span>BẮT ĐẦU <b id="l132StartRead">00:00:00:00</b></span><span>KẾT THÚC <b id="l132EndRead">--:--:--:--</b></span><span><b id="l132Count">0</b> KEY</span></div>
      <div class="l132-meter"><div id="l132Bar"></div></div>
      <div class="l132-buttons"><button id="l132Begin" class="l132-go">● BẮT ĐẦU</button><button id="l132Mark">◆ MỐC</button><button id="l132End" class="l132-stop">■ KẾT THÚC</button></div>
      <svg id="l132Chart" viewBox="0 0 308 68" preserveAspectRatio="none"></svg>
      <label class="l132-label l132-marker">Tên mốc<input id="l132MarkName" placeholder="Ví dụ: đèn quay về giữa" maxlength="48"></label>
      <div class="l132-buttons"><button id="l132Save" class="l132-save">+ LƯU CẢNH VÀO SHOW TIME</button></div>
      <div class="l132-buttons"><button id="l132Replay">▶ Phát lại</button><button id="l132Cancel">Hủy lượt ghi</button><button id="l132Timeline">▦ SHOW Timeline</button></div>
      <div id="l132Markers" class="l132-marks"></div><div id="l132Saved" class="l132-saved">Chưa lưu cảnh đèn.</div>
      <div id="l132Status" role="status">Sẵn sàng ghi chuyển động đèn.</div>
    </section>`;
  function bind132(){E('l132Begin')?.addEventListener('click',()=>start132());E('l132Mark')?.addEventListener('click',marker132);
    E('l132End')?.addEventListener('click',()=>end132());E('l132Save')?.addEventListener('click',()=>save132());
    E('l132Replay')?.addEventListener('click',replay132);E('l132Cancel')?.addEventListener('click',()=>discard132());
    E('l132Timeline')?.addEventListener('click',()=>{if(!seq.open)toggleSequence(true);enableSequence(true);});
    E('l132Name').value=R.name;E('l132FPS').value=String(R.fps);E('l132Scope').value=R.scope;
    E('l132Name').oninput=e=>R.name=e.target.value;E('l132StartTime').oninput=e=>R.startDraft=clamp132(e.target.value,0,599.5);E('l132FPS').onchange=e=>R.fps=+e.target.value;E('l132Scope').onchange=e=>R.scope=e.target.value;
    if(R.mode==='idle'&&document.activeElement!==E('l132StartTime'))E('l132StartTime').value=(R.startDraft===null?state.time:R.startDraft).toFixed(2);
    else E('l132StartTime').value=R.start.toFixed(2);update132();
  }
  function mount132(){const d=E('pro127dock');if(!d||d.hidden||!S.pro127?.open)return;
    if(E('l132Panel'))return;
    const header=d.querySelector(':scope > header'),content=d.querySelector(':scope > .pro127-content');
    if(!header||!content)return;header.insertAdjacentHTML('afterend',PANEL);bind132();
  }
  // Fixture dock re-renders its innerHTML on light selection; re-mount the recorder strip.
  const dock=E('pro127dock');if(dock){new MutationObserver(()=>mount132()).observe(dock,{childList:true});}
  function launch132(){const dock=E('pro127dock');if(!S.pro127?.open||S.pro127.tab!=='fixture'){
      const btn=document.querySelector('[data-pro127="fixture"]');if(btn)btn.click();
    }mount132();E('l132Panel')?.scrollIntoView({block:'nearest',behavior:'instant'});}
  function insertLaunch132(){const bar=E('pro127bar');if(!bar||E('l132Launch'))return;
    const btn=document.createElement('button');btn.id='l132Launch';btn.type='button';btn.textContent='● Ghi thao tác đèn';btn.onclick=launch132;
    const summary=E('pro127summary');if(summary)bar.insertBefore(btn,summary);else bar.appendChild(btn);update132();
  }
  // Shared controls only: the choreography recorder in V13.1 is unchanged.
  const beforeRenderUI132=renderUI;
  renderUI=function(){const result=beforeRenderUI132();insertLaunch132();mount132();return result;};
  const beforeSourceOptions132=sourceOptions;
  sourceOptions=function(type,value){if(type==='light'&&typeof value==='string'&&value.startsWith(prefix)){
      const t=R.takes.get(value.slice(prefix.length));return `<option selected value="${escape132(value)}">${escape132('● Ghi tay / '+(t?.name||'Lighting Take'))}</option>`+beforeSourceOptions132(type,value);
    }return beforeSourceOptions132(type,value);};
  // Keep source ID on editing; scene relationship remains intact if a take is dragged/trimmed.
  const beforeEditClip132=editClip;
  editClip=function(id,...rest){const clip=seq.clips.find(c=>c.id===id);
    if(!clip||!String(clip.source).startsWith(prefix))return beforeEditClip132(id,...rest);
    const data=R.takes.get(String(clip.source).slice(prefix.length));
    dialog('Chỉnh cảnh đèn đã ghi',`<div class="v07-form"><label class="wide">Tên cảnh<input id="l132ClipName" value="${escape132(clip.name)}"></label><label>Bắt đầu (giây)<input type="number" id="l132ClipStart" value="${clip.start.toFixed(2)}" min="0" step="0.05"></label><label>Thời lượng (giây)<input type="number" id="l132ClipDur" value="${clip.duration.toFixed(2)}" min=".1" max="120" step=".05"></label><label>Source IN (giây)<input type="number" id="l132ClipIn" value="${(clip.in||0).toFixed(2)}" min="0" max="${data?.duration||120}" step=".05"></label><label>Tốc độ<input type="number" id="l132ClipRate" value="${clip.rate||1}" min=".25" max="4" step=".05"></label></div><p class="hint-text">Kéo hoặc kéo mép clip trên SHOW Timeline để thay đổi vị trí/thời lượng. Không làm thay đổi tọa độ đèn trên model gốc.</p>`,[
      {label:'Hủy'},{label:'Lưu clip',primary:true,action:()=>{checkpoint();const start=clamp132(E('l132ClipStart').value,0,599.8),duration=clamp132(E('l132ClipDur').value,.1,Math.min(120,600-start));
        clip.name=E('l132ClipName').value.slice(0,60)||clip.name;clip.start=start;clip.duration=duration;clip.in=clamp132(E('l132ClipIn').value,0,data?.duration||120);clip.rate=clamp132(E('l132ClipRate').value,.25,4);
        const sc=stage10.scenes.find(s=>s.id===clip.scene10);if(sc){sc.name=clip.name;sc.start=start;sc.duration=duration;}
        if(typeof ensureDuration10==='function')ensureDuration10(start+duration);invalidateSeq();renderSequence();}}
    ]);
  };
  // Controls continue to update while recorded; sampled in project time, not wall time.
  function tick132(now){requestAnimationFrame(tick132);
    if(R.mode==='record'){
      if(state.time>=599.85 || state.time-R.start>=119.9){end132();}
      else if(now-R.wallSample>70){R.wallSample=now;record132(false);}
      if(state.duration-state.time<1.2&&state.duration<600&&typeof ensureDuration10==='function')ensureDuration10(Math.min(600,state.duration+4));
    }
    if(now-R.wallUI>120){R.wallUI=now;update132();}
  }
  document.addEventListener('input',ev=>{if(R.mode==='record'&&ev.target?.closest?.('#pro127dock'))record132(false);},false);
  document.addEventListener('change',ev=>{if(R.mode==='record'&&ev.target?.closest?.('#pro127dock'))record132(true);},false);
  // Versioned persistence: store keyframes outside seq.clips (clip decoder intentionally strips custom fields).
  const oldPack132=packLiveExtras;
  packLiveExtras=async function(){const data=await oldPack132();data.lightTake132={version:1,takes:[...R.takes.values()],saved:R.saved.slice(-48)};return data;};
  const oldRestoreLive132=restoreLiveExtras;
  restoreLiveExtras=async function(data){await oldRestoreLive132(data);R.mode='idle';R.takes.clear();R.saved=[];
    for(const d of (Array.isArray(data?.lightTake132?.takes)?data.lightTake132.takes:[]).slice(0,MAX_TAKES)){
      const v=validTake132(d);if(v)R.takes.set(v.id,v);
    }R.saved=(Array.isArray(data?.lightTake132?.saved)?data.lightTake132.saved:[]).slice(-48).filter(x=>R.takes.has(x.id));R.samples.clear();R.base.clear();R.ids=[];update132();};
  const oldSnapshot132=snapshot;
  snapshot=function(){const data=oldSnapshot132();data.lightTake132={version:1,takes:structuredClone([...R.takes.values()]),saved:structuredClone(R.saved)};return data;};
  const oldRestore132=restore;
  restore=function(data){oldRestore132(data);R.mode='idle';R.takes.clear();for(const d of (data?.lightTake132?.takes||[]).slice(0,MAX_TAKES)){
      const v=validTake132(d);if(v)R.takes.set(v.id,v);
    }R.saved=(data?.lightTake132?.saved||[]).filter(x=>R.takes.has(x.id));R.samples.clear();R.base.clear();R.ids=[];update132();};
  // Debug/test API and ability for other workflows to start a hand take programmatically.
  S.lightTake132={start:start132,end:end132,save:save132,cancel:discard132,replay:replay132,mark:marker132,launch:launch132,record:record132,
    get mode(){return R.mode;},get time(){return {start:R.start,end:R.end,duration:R.duration};},get counts(){return {lamps:R.ids.length,keys:count132(),takes:R.takes.size,scenes:R.saved.length};},
    get data(){return structuredClone([...R.takes.values()]);},get saved(){return structuredClone(R.saved);},get state(){return R;},get current(){return selected132();},get at(){return (id,t)=>lerpState132(R.takes.get(id)?.lamps?.[0]?.frames,t);}};
  S.version='1.3.2';document.title='ALPHA | Creative LED Studio V13.2 — Ghi thao tác đèn';const logo=document.querySelector('.brand small');if(logo && !logo.textContent.includes('V13.2'))logo.textContent+=' · V13.2 GHI ĐÈN';insertLaunch132();mount132();requestAnimationFrame(tick132);
}catch(err){console.error('LIGHT TAKE 13.2 bootstrap failed',err);}
})();

/* V13.3 UI recovery; intentionally does not touch video, 3D, UV, scene or light timecode. */
(function(){
 'use strict';
 const S=window.STUDIO;
 if(!S || typeof state==='undefined')return;
 try{
  const body=document.body,byId=id=>document.getElementById(id),right=()=>document.querySelector('.right-panel');
  const UX={version:'13.3.0',takeExpanded:false,recoveries:0,guard:false};
  function switchClass(name,on){if(body.classList.contains(name)!==!!on)body.classList.toggle(name,!!on);}
  function closeVJ(){try{S.vj130?.open(null);}catch(e){console.warn('UI13.3 VJ close',e);}}
  function closeChoreo(){try{S.manual131?.close();}catch(e){console.warn('UI13.3 choreography close',e);}}
  function closeFixture(){try{if(S.pro127?.open)byId('pro127close')?.click();}catch(e){console.warn('UI13.3 fixture close',e);}}
  function recoverEditor(){
   if(UX.guard || state.presenting)return false;
   UX.guard=true;
   try{
    closeVJ();closeChoreo();
    // The editor must be accessible even if Mở rộng was left enabled before the show.
    if(typeof stableUI!=='undefined' && stableUI.focus)stableUI.focus=false;
    body.classList.remove('present-mode','focus-workspace','drawer-left','drawer-right',
      'v130-present-open','m131-present-open','v130-edit-open','m131-edit-open');
    const rp=right();
    for(const id of ['v130Panel','m131Panel']){
     const el=byId(id);if(!el)continue;
     if(rp&&el.parentElement!==rp)rp.appendChild(el);
     el.hidden=true;
    }
    byId('presentControls')?.classList.add('hidden');
    byId('presentHUD')?.classList.add('hidden');
    byId('focusBtn')?.classList.remove('active');
    byId('focusBtn')?.setAttribute('aria-pressed','false');
    try{updateStableControls?.();}catch(_){ }
    UX.recoveries++;
    refreshTake();
    return true;
   }finally{UX.guard=false;}
  }
  function resetWorkspace(){
   if(state.presenting){try{togglePresentation();}catch(e){console.warn('UI13.3 exit',e);} }
   if(!state.presenting){recoverEditor();try{renderUI();}catch(e){console.warn('UI13.3 redraw',e);}}
  }
  function refreshTake(){
   const fixture=!!S.pro127?.open && S.pro127.tab==='fixture';
   const takeMode=S.lightTake132?.mode||'idle';
   const expanded=UX.takeExpanded||takeMode==='record'||takeMode==='review';
   switchClass('ui133-take-fixture',fixture);
   switchClass('ui133-take-expanded',fixture&&expanded);
   const top=byId('l132Panel')?.querySelector('.l132-top');
   if(top&&!byId('ui133TakeExpand')){
    const btn=document.createElement('button');btn.type='button';btn.id='ui133TakeExpand';
    btn.title='Thu gọn hoặc mở rộng phần ghi thao tác đèn';
    btn.onclick=()=>{UX.takeExpanded=!UX.takeExpanded;refreshTake();};
    top.appendChild(btn);
   }
   const btn=byId('ui133TakeExpand');if(btn){btn.textContent=expanded?'Thu gọn ▲':'Mở ghi đèn ▼';btn.setAttribute('aria-expanded',String(!!expanded));}
  }
  function installResetButton(){
   const strip=document.querySelector('.navigation-strip');if(strip&&!byId('ui133Reset')){
    const button=document.createElement('button');button.type='button';button.id='ui133Reset';
    button.className='btn small';button.title='Đóng bảng nổi và khôi phục giao diện có thể bấm';
    button.textContent='↺ Bố cục';button.onclick=resetWorkspace;
    const anchor=byId('assetDrawer');strip.insertBefore(button,anchor||null);
   }
  }
  // After leaving any presentation mode, clean old floating overlays synchronously
  // before user attempts to select Stage / LED / Lighting programs again.
  let hadPresentation=!!state.presenting;
  function watchPresentation(){
   const now=!!state.presenting&&body.classList.contains('present-mode');
   if(hadPresentation&&!now)recoverEditor();
   hadPresentation=now;
   refreshTake();
  }
  const presentationObserver=new MutationObserver(watchPresentation);
  presentationObserver.observe(body,{attributes:true,attributeFilter:['class']});
  for(const id of ['showExit','exitPresent','presentBtn']){
   byId(id)?.addEventListener('click',()=>queueMicrotask(watchPresentation));
  }
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape')queueMicrotask(watchPresentation);},false);
  // Event capture guarantees panel exclusivity even if a previous version added
  // independent listeners to these buttons. Never intercept actual button click.
  document.addEventListener('click',ev=>{
   const target=ev.target instanceof Element?ev.target:null;if(!target)return;
   // Program tabs must always own their inspector. Close an obsolete FX/light dock
   // before the existing [data-step] handler switches Stage / LED / Lighting.
   if(target.closest('[data-step], #choreoToggle11')&&!state.presenting){
    closeVJ();closeChoreo();closeFixture();
    if(body.classList.contains('lift-dock-open'))byId('liftClose124')?.click();
    if(typeof stableUI!=='undefined'&&stableUI.focus){
      stableUI.focus=false;body.classList.remove('focus-workspace','drawer-left','drawer-right');
    }
   }
   if(target.closest('#l132Launch')){UX.takeExpanded=true;refreshTake();}
   const fixture=target.closest('#pro127bar [data-pro127], #l132Launch');
   if(fixture&&!state.presenting){closeVJ();closeChoreo();}
   const vj=target.closest('[data-v130-open], #showVJ, #vjToggle');
   if(vj){closeChoreo();if(!state.presenting)closeFixture();}
   const manual=target.closest('[data-m131-toggle]');
   if(manual){closeVJ();if(!state.presenting)closeFixture();}
   if(target.closest('#pro127close'))UX.takeExpanded=false;
   queueMicrotask(()=>{refreshTake();installResetButton();});
  },true);
  const dock=byId('pro127dock');
  if(dock){new MutationObserver(()=>refreshTake()).observe(dock,{childList:true,subtree:false});}
  // Recover layout when the viewport changes; avoid forcing camera/geometry changes.
  window.addEventListener('resize',()=>{installResetButton();refreshTake();},{passive:true});
  body.classList.add('ui133-installed');
  installResetButton();refreshTake();
  S.ui133={reset:resetWorkspace,recover:recoverEditor,refresh:refreshTake,get state(){return {presenting:state.presenting,fixture:S.pro127?.tab,expanded:UX.takeExpanded,recoveries:UX.recoveries};}};
  S.version='13.3.0';document.title='ALPHA | Creative LED Studio V13.3 - UI STABLE';
  const b=document.querySelector('.brand small');if(b&&!b.textContent.includes('V13.3'))b.textContent+=' · V13.3 UI STABLE';
 }catch(err){console.error('UI V13.3 failed; original scene data preserved',err);}
})();
