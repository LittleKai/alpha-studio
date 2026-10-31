/* ALPHA Creative LED Studio V14.2 — Multi Fixture / Reliable Timecode.
   Independent simulator: keeps the 16-light WebGL shader intact, preserves UV maps.
   Designed for local preview, not for controlling real DMX / ILDA hardware. */
(function(){
 'use strict';
 const S=window.STUDIO;
 if(!S || !S.engine || !S.mount136) return;
 const engine=S.engine, state=S.state, $=id=>document.getElementById(id);
 const clamp141=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(+v)?+v:a));
 const esc141=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const colors=['#ffd64b','#34e5ff','#e866ff','#31ff87','#ff4c78','#fafcff','#5e8cff'];
 const ITEMS={
   par:{name:'PAR LED RGBW',label:'PAR LED',pixels:7,color:'#ffd84c',power:1.0},
   line:{name:'LED LINE BAR',label:'LED LINE',pixels:12,color:'#30e7ff',power:.85},
   laser:{name:'LASER BAR RGB',label:'LASER BAR',pixels:8,color:'#5fe7ff',power:.85}
 };
 const PRESETS={
   chaseLR:['CHASE L → R','#f5c84d'],chaseRL:['CHASE R → L','#f5c84d'],chasePing:['CHASE PING PONG','#f6a245'],
   groupFlash:['FLASH THEO CỤM','#f26565'],groupAlternate:['CỤM LẺ / CHẴN','#f47c71'],
   pulse:['PULSE THEO BEAT','#72d8ff'],musicColor:['MUSIC RGB COLOR','#53e7d0'],musicChase:['MUSIC COLOR CHASE','#4fd7b7'],
   rainbow:['RAINBOW PIXEL','#aa77ff'],colorWipe:['COLOR WIPE','#fa81cb'],pixelSpark:['PIXEL SPARKLE','#a8d2fc'],
   verticalChase:['VERTICAL LINE SCAN','#44ffcd'],barBounce:['LINE BOUNCE','#37d7ff'],
   laserFan:['LASER FAN RGB','#7c60ed'],laserSweep:['LASER SWEEP','#c251f4'],laserBurst:['LASER CLIMAX','#d865ee'],
   blackout:['BLACKOUT HIT','#606570'],strobe:['FAST STROBE / ARM','#fff9cc'],finale:['FINAL BUILD-UP','#f4bd50']
 };
 const F={fixtures:[],selected:null,kind:'par',isOpen:false,tab:'fixtures',place:false,dragMode:false,drag:null,
   live:null,allowStrobe:false,defaultDuration:6,speed:1,groupSize:4,target:'all',lastPaint:0,lastRaf:0,attachLayer:'',
   models:new Map(),modelKey:'',showPanel:false,freeze:false,lastSceneKey:''};
 S.fx141=F;
 // One undo entry per user action, including array creation and pointer drags.
 let historyDepth=0;
 function transaction(fn){if(historyDepth)return fn();checkpoint();const savedCheckpoint=checkpoint;historyDepth++;checkpoint=()=>{};try{return fn();}finally{checkpoint=savedCheckpoint;historyDepth--;}}
 function fieldCheckpoint(el){if(!el._fx142History){checkpoint();el._fx142History=true;}}
 const isFX=c=>!!c&&/^fx141:/.test(String(c.source));
 function cueSpec(c){const m=String(c?.source||'').match(/^fx141:([^@]+)(?:@([\s\S]*))?$/),v=c?.fx141||{};return {preset:PRESETS[v.preset]?v.preset:m?.[1]||'pulse',target:String(v.target??m?.[2]??'all'),speed:clamp141(v.speed??1,.2,6),groupSize:Math.round(clamp141(v.groupSize??4,1,16)),phaseDuration:v.phaseDuration!=null&&Number.isFinite(+v.phaseDuration)?clamp141(v.phaseDuration,.01,36000):null};}
 function targetMatches(target,f){return target==='all'||target===f.kind||target===f.group||target===f.id;}
 const scene=()=>engine.stageBounds||{min:[-9,0,-4],max:[9,7,4],center:[0,3.5,0]};
 const trusses=()=>{try{return S.mount136.detectTrussLayers()||[];}catch(e){return [];}};
 const current=()=>F.fixtures.find(f=>f.id===F.selected)||F.fixtures[0]||null;
 function defaults(kind='par',pos=null){const o=ITEMS[kind]||ITEMS.par,b=scene(),id='FX141_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
   const p=pos||S.mount136.defaultPoint('light',F.fixtures.length,Math.max(1,F.fixtures.length+1));
   return {id,kind,name:o.name+' '+(F.fixtures.filter(f=>f.kind===kind).length+1),pos:S.mount136.constrain([...p]),
    enabled:true,orientation:kind==='line'?'vertical':'horizontal',color:o.color,power:o.power,pixels:o.pixels,
    group:kind==='par'?'PAR':kind==='line'?'LINE':'LASER',pan:0,tilt:kind==='laser'?-50:-24,spread:kind==='laser'?50:66,range:kind==='laser'?Math.max(5,Math.min(10,engine.size.depth+2)):14,length:kind==='line'?1.6:kind==='laser'?1.25:.4,mount141:null};
 }
 function add(kind='par',pos=null){if(!ITEMS[kind]||F.fixtures.length>=64){toast('Giới hạn 64 đèn PAR/LINE/LASER Bar.');return null;}
   return transaction(()=>{const f=defaults(kind,pos);F.fixtures.push(f);F.selected=f.id;F.kind=kind;engine.view='stage';resetModel(f.id);paint();toast('Đã thêm '+f.name+' vào sân khấu. Dùng Truss Layer hoặc click điểm lắp để gắn đèn.');return f;});}
 function addGroup(kind,n=6){if(!ITEMS[kind])return 0;return transaction(()=>{n=Math.max(1,Math.min(24,Math.round(n)));const b=scene(),layers=trusses();
   const horizontal=layers.filter(l=>l.axis===0||l.axis===2).sort((a,z)=>z.center[1]-a.center[1]);
   const vertical=layers.filter(l=>l.axis===1||l.orientation==='vertical').sort((a,z)=>a.center[0]-z.center[0]);
   let created=0;for(let i=0;i<Math.min(24,n)&&F.fixtures.length<64;i++){
    const frac=(i+.5)/n,x=b.min[0]+(b.max[0]-b.min[0])*(.14+.72*frac);
    let lay=horizontal[0]||null,pos=[x,b.max[1]-.22,(b.min[2]+b.max[2])*.5];
    if(kind==='line'&&vertical.length){lay=i===0?vertical[0]:i===n-1?vertical[vertical.length-1]:vertical[Math.floor(i/Math.max(1,n-1)*(vertical.length-1))];pos=[...lay.center];}
    else if(lay){const axis=lay.axis;pos=[...lay.center];pos[axis]=lay.bounds.min[axis]+(lay.bounds.max[axis]-lay.bounds.min[axis])*frac;
      if(lay.orientation!=='vertical')pos[1]=lay.bounds.min[1]-.10;
    }
    const f=add(kind,S.mount136.constrain(pos));if(f){if(lay)attach(f,lay,pos,false);created++;}
   }paint();toast('Đã tạo '+created+' '+ITEMS[kind].label+' trên truss '+(kind==='line'?'đứng hai bên.':'ngang.'));return created;});
 }
 function attach(f,layer,point=null,notify=true,record=true){if(!f||!layer)return false;if(record)return transaction(()=>attach(f,layer,point,notify,false));
   const b=layer.bounds||{min:layer.center,max:layer.center},axis=layer.axis??0;
   const p=point?[...point]:[...layer.center];p[axis]=clamp141(p[axis],b.min[axis],b.max[axis]);
   if(layer.orientation!=='vertical')p[1]=b.min[1]-.10;
   const next=S.mount136.constrain(p);f.pos=[...next];f.mount141={layerId:layer.id||null,layerName:layer.name||'TRUSS',point:[...next],offset:[0,0,0],meshRef:layer.mesh?.name||null};
   F.attachLayer=layer.id||'';resetModel(f.id);paint();if(notify)toast('Đã bám '+f.name+' vào '+(layer.name||'TRUSS')+'.');return true;
 }
 function place(f,pos,layer=null,record=true){if(!f||!Array.isArray(pos)||pos.length!==3||!pos.every(Number.isFinite))return false;if(record)return transaction(()=>place(f,pos,layer,false));f.pos=S.mount136.constrain(pos);
   if(layer)attach(f,layer,pos,false,false);
   else if(f.mount141){f.mount141.offset=f.pos.map((x,i)=>x-f.mount141.point[i]);}
   resetModel(f.id);return true;
 }
 function project(p){const a=engine.project(p);return a&&Number.isFinite(a.x+a.y+a.z)&&a.z>=-1.8&&a.z<=1.15?a:null;}
 function distLine(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=Math.max(.001,dx*dx+dy*dy),t=clamp141(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1);return Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t));}
 function nearestLayer(x,y){const layers=trusses();let best=null,score=19;for(const l of layers){const p1=[...l.center],p2=[...l.center];p1[l.axis]=l.bounds.min[l.axis];p2[l.axis]=l.bounds.max[l.axis];
   const a=project(p1),b=project(p2);if(!a||!b)continue;const d=distLine({x,y},a,b);if(d<score){score=d;best=l;}}
   return best;
 }
 function pickOnStage(e){const f=current();if(!f)return;const hit=engine.pick(e.clientX,e.clientY,false),layers=trusses();
   let layer=hit?.mesh?layers.find(x=>x.meshes?.includes(hit.mesh)||x.mesh===hit.mesh):null;
   const r=engine.canvas.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
   if(!layer)layer=nearestLayer(px,py);
   if(layer){let p=hit?.point&&layer.meshes?.includes(hit.mesh)?[...hit.point]:[...layer.center];
     if(!hit?.point||!layer.meshes?.includes(hit.mesh)){const axis=layer.axis??0;const pa=[...layer.center],pb=[...layer.center];pa[axis]=layer.bounds.min[axis];pb[axis]=layer.bounds.max[axis];
       const a=project(pa),b=project(pb);if(a&&b){const dx=b.x-a.x,dy=b.y-a.y,d=(dx*dx+dy*dy)||1,u=clamp141(((px-a.x)*dx+(py-a.y)*dy)/d,0,1);p=pa.map((v,i)=>v+(pb[i]-v)*u);}}
     attach(f,layer,p);return;
   }
   if(hit?.point){place(f,hit.point);toast('Đã đặt tại vị trí click trên 3D. Không nhận diện truss tại điểm này.');return;}
   toast('Không chọn được điểm trên model. Chọn một Truss Layer hoặc thay đổi góc camera.');
 }
 function moveAxis(f,axis,delta){const p=[...f.pos];p[axis]+=delta;place(f,p);paint();}
 function setMode(m){F.place=m==='place';F.dragMode=m==='drag';F.drag=null;overlay.style.pointerEvents=F.place||F.dragMode?'auto':'none';overlay.style.cursor=F.place?'crosshair':F.dragMode?'move':'auto';panel?.classList.toggle('fx141-placing',F.place||F.dragMode);paint();}
 function stopModes(){F.place=false;F.dragMode=false;F.drag=null;overlay.style.pointerEvents='none';overlay.style.cursor='auto';}
 // 3D physical housings. Pixel illumination animation is drawn in a GPU-independent overlay.
 function resetModel(id){if(id){const objs=F.models.get(id)||[];for(const m of objs){const i=engine.fixtureMeshes.indexOf(m);if(i>=0)engine.fixtureMeshes.splice(i,1);engine.releaseMesh(m);}F.models.delete(id);}else{for(const id of [...F.models.keys()])resetModel(id);}}
 function createModel(f){const col=[.12,.17,.23,1],rim=[.24,.30,.36,1],body=[];
   if(f.kind==='par'){
     body.push(ellipsoid('PAR LED housing', [0,0,0],[.19,.19,.13],col,14,9));
     body.push(ellipsoid('PAR lens', [0,0,.145],[.13,.13,.02],rim,14,9));
     body.push(boxMesh('PAR yoke',[0,.22,0],[.08,.14,.10],rim));
   }else if(f.kind==='line'){
     const vertical=f.orientation!=='horizontal';
     body.push(boxMesh('LINE BAR / housing',[0,0,0],vertical?[.14,f.length,.17]:[f.length,.14,.17],col));
     body.push(boxMesh('LINE BAR / front',[0,0,.092],vertical?[.115,f.length*.91,.012]:[f.length*.91,.115,.012],[.03,.07,.10,1]));
   }else{
     body.push(boxMesh('LASER BAR / housing',[0,0,0],[f.length,.16,.25],col));
     body.push(boxMesh('LASER BAR / optic strip',[0,0,.145],[f.length*.9,.055,.035],rim));
     body.push(boxMesh('LASER BAR / clamp',[0,.15,0],[.14,.15,.15],rim));
   }
   for(const m of body){m.fx141Body=f.id;engine.fixtureMeshes.push(m);}F.models.set(f.id,body);
 }
 function ensureModels(){const valid=new Set(F.fixtures.map(f=>f.id));for(const id of F.models.keys())if(!valid.has(id))resetModel(id);
   for(const f of F.fixtures){let list=F.models.get(f.id);if(!list||list.some(m=>!engine.fixtureMeshes.includes(m))){F.models.delete(f.id);createModel(f);list=F.models.get(f.id);}
      let yaw=(f.pan||0)*Math.PI/180,tilt=(f.tilt||0)*Math.PI/180;
      const rotation=M.mm(M.rotate([0,1,0],yaw),M.rotate([1,0,0],-tilt*.12));
      const mat=M.mm(M.translate(f.pos),rotation);for(const mesh of list)mesh.actorMatrix=mat;
   }
 }
 const priorRender=engine.render.bind(engine);
 engine.render=function(...args){if(engine.view==='stage')ensureModels();return priorRender(...args);};
 // Additive Canvas2D world-projected pixel visuals; no shader edits to LED mapping.
 const overlay=document.createElement('canvas');overlay.id='fx141Overlay';overlay.setAttribute('aria-label','PAR LED, LINE BAR and LASER BAR visual preview');
 $('viewport').appendChild(overlay);const g=overlay.getContext('2d',{alpha:true,desynchronized:true});
 function rgb(c){const s=String(c||'#ffffff').replace('#','');return /^[\da-f]{6}$/i.test(s)?[0,2,4].map(i=>parseInt(s.slice(i,i+2),16)):[255,255,255];}
 function rgba(c,a){const v=rgb(c);return 'rgba('+v.join(',')+','+clamp141(a,0,1).toFixed(3)+')';}
 function colorMix(a,b,u){const aa=rgb(a),bb=rgb(b);return '#'+aa.map((v,i)=>Math.round(v+(bb[i]-v)*clamp141(u,0,1)).toString(16).padStart(2,'0')).join('');}
 function hue(h){const f=n=>{const k=(n+h*6)%6;return 1-.95*Math.max(0,Math.min(k,4-k,1));};return '#'+[f(5),f(3),f(1)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');}
 function audioValue(time){let e=0;try{if(live.audioEnabled){e=clamp141(Math.max(live.audioRMS||0,sq.energy||0,sq.bass||0),0,1);}else if(lighting9.analysis?.energy){const a=lighting9.analysis,idx=Math.floor((time-(live.audioOffset||0))*a.hz);e=clamp141(a.energy[Math.max(0,Math.min(a.energy.length-1,idx))]||0,0,1);}}catch(err){}
   return e;
 }
 function cueListAt(t){
   if(!seq.enabled)return [];
   const tracks=seq.tracks.filter(tr=>tr.type==='light'),hasSolo=tracks.some(tr=>tr.solo===true&&!tr.muted);
   const order=new Map(seq.tracks.map((tr,i)=>[tr.id,i]));
   const ids=new Set(tracks.filter(tr=>!tr.muted&&(!hasSolo||tr.solo===true)).map(tr=>tr.id));
   return seq.clips.filter(c=>ids.has(c.track)&&c.muted!==true&&isFX(c)&&Number.isFinite(c.start)&&Number.isFinite(c.duration)&&c.start<=t&&t<c.start+c.duration)
     .sort((a,b)=>order.get(a.track)-order.get(b.track)||a.start-b.start);
 }
 function effectFor(f,t){
   let cue=null;for(const c of cueListAt(t)){if(targetMatches(cueSpec(c).target,f))cue=c;}
   const elapsed=F.live?(performance.now()-F.live.started)/1000:0;
   if(F.live&&elapsed>=0&&elapsed<F.live.duration&&targetMatches(F.live.target,f))return {...F.live,local:elapsed,gain:1,envelope:1,preview:true};
   if(!cue)return null;
   const spec=cueSpec(cue),clipLocal=Math.max(0,t-cue.start),rate=clamp141(cue.rate??1,.125,8),sourceIn=clamp141(cue.in??0,0,36000);
   const fade=Math.min(clamp141(cue.fade??0,0,10),cue.duration/2);
   return {...spec,local:sourceIn+clipLocal*rate,duration:spec.phaseDuration??(sourceIn+cue.duration*rate),clipDuration:cue.duration,
     gain:clamp141(cue.gain??1,0,3),envelope:fade>0?clamp141(Math.min(clipLocal/fade,(cue.duration-clipLocal)/fade),0,1):1,cueId:cue.id};
 }
 function evaluate(f,time){const n=Math.max(1,Math.min(24,f.pixels||8)),out=Array.from({length:n},()=>({color:f.color,level:f.enabled?f.power:0}));
   const effect=effectFor(f,time);if(!effect||!f.enabled)return out;
   const preset=effect.preset||'pulse',dur=Math.max(.01,effect.duration||6),local=effect.local||0,spd=clamp141(effect.speed||1,.2,6);
   const beats=local*(seq.bpm||120)/60*spd,phase=Math.floor(beats*2),wave=0.5+0.5*Math.sin(beats*Math.PI*2);
   // Chase/group FX operate across distinct fixtures first. Pixel/bar effects operate within fixtures.
   const target=effect.target||'all';
   const members=F.fixtures.filter(q=>q.enabled&&(target==='all'||target===q.kind||target===q.group||target===q.id)).sort((a,b)=>a.pos[0]-b.pos[0]);
   const fixtureIndex=Math.max(0,members.findIndex(q=>q.id===f.id)),fixtureCount=Math.max(1,members.length);
   const fixtureStep=Math.floor(local*Math.min(3,Math.max(.4,(seq.bpm||120)/60*spd*1.15)));
   const groupSize=Math.max(1,Math.round(effect.groupSize??4));
   const audio=audioValue(time),hasMusic=live.audioEnabled||!!lighting9.analysis?.energy;
   for(let i=0;i<n;i++){
     const p=out[i];p.level*=effect.gain*effect.envelope;const cell=(i/(Math.max(1,n-1))),chase=(phase%n),point=(phase%(Math.max(1,n*2-2))),ping=point<n?point:(n*2-2-point);
     switch(preset){
      case 'chaseLR':p.level*=fixtureCount>1?(fixtureIndex===fixtureStep%fixtureCount?1:.05):(Math.abs(i-chase)<=1?1:.05);break;
      case 'chaseRL':p.level*=fixtureCount>1?(fixtureIndex===fixtureCount-1-fixtureStep%fixtureCount?1:.05):(Math.abs(i-(n-1-chase))<=1?1:.05);break;
      case 'chasePing':{const k=fixtureStep%Math.max(1,fixtureCount*2-2),b=k<fixtureCount?k:(fixtureCount*2-2-k);p.level*=fixtureCount>1?(fixtureIndex===b?1:.06):(Math.abs(i-ping)<=1?1:.05);break;}
      case 'groupFlash':{const groups=Math.max(1,Math.ceil(fixtureCount/groupSize)),k=Math.floor(fixtureIndex/groupSize);p.level*=fixtureCount>1?(fixtureStep%groups===k?1:.05):((Math.floor(i/groupSize)+fixtureStep)%Math.max(1,Math.ceil(n/groupSize))===0?1:.05);break;}
      case 'groupAlternate':p.level*=(Math.floor(fixtureIndex/groupSize)+fixtureStep)%2===0?1:.08;break;
      case 'pulse':p.level*=.18+.82*wave;break;
      case 'musicColor':p.color=hue((i/n*.25+time*.15+audio*.75)%1);p.level*=hasMusic?.25+audio*.95:.55+.45*wave;break;
      case 'musicChase':p.color=hue((time*.2+i/n*.6+audio*.25)%1);p.level*=Math.abs(i-chase)<2?.9:.06;break;
      case 'rainbow':p.color=hue((cell+local*.12*spd)%1);break;
      case 'colorWipe':p.color=cell<((local*spd/3)%1)?colors[1]:colors[4];break;
      case 'pixelSpark':p.level*=(((i*17+phase*13)%19)<4)?1:.04;p.color=colors[(i+phase)%colors.length];break;
      case 'verticalChase':p.level*=Math.abs(i-chase)<2?1:.05;break;
      case 'barBounce':p.level*=Math.abs(i-ping)<=1?1:.05;break;
      case 'laserFan':p.color=colors[(i+Math.floor(beats))%colors.length];p.level*=.65+.35*wave;break;
      case 'laserSweep':p.color=colors[(i+2)%colors.length];p.level*=.45+.55*wave;break;
      case 'laserBurst':p.color=colors[(i+Math.floor(local*4))%colors.length];p.level*=.35+.65*Math.abs(Math.sin(beats*Math.PI*2));break;
      case 'blackout':p.level=0;break;
      case 'strobe':p.level*=F.allowStrobe?(Math.sin(local*Math.PI*2*3)>0?1:.04):(.4+.6*wave);break;
      case 'finale':p.color=colors[(i+phase)%colors.length];p.level*=.15+.85*clamp141(local/Math.max(.1,dur*.8),0,1);break;
     }
   }
   return out;
 }
 function position(f,i,n){const k=n<=1?0:(i/(n-1)-.5);let local=[0,0,.10];
   if(f.kind==='par'){const a=2*Math.PI*i/n;local=[Math.cos(a)*.11,Math.sin(a)*.11,.14];}
   else if(f.kind==='line'){local=f.orientation==='horizontal'?[k*f.length*.86,0,.12]:[0,k*f.length*.86,.12];}
   else local=[k*f.length*.84,0,.18];
   const yaw=(f.pan||0)*Math.PI/180,xx=local[0]*Math.cos(yaw)+local[2]*Math.sin(yaw),zz=-local[0]*Math.sin(yaw)+local[2]*Math.cos(yaw);
   return [f.pos[0]+xx,f.pos[1]+local[1],f.pos[2]+zz];
 }
 function paintGlow(pos,col,level,radius){const pr=project(pos);if(!pr||level<=.002)return;
   const r=radius;let grad=g.createRadialGradient(pr.x,pr.y,1,pr.x,pr.y,r);grad.addColorStop(0,rgba('#ffffff',Math.min(.87,level*.8)));grad.addColorStop(.16,rgba(col,Math.min(.75,level*.7)));grad.addColorStop(1,rgba(col,0));
   g.globalAlpha=.95;g.fillStyle=grad;g.beginPath();g.arc(pr.x,pr.y,r,0,Math.PI*2);g.fill();
 }
 function drawWash(f,col,level){if(level<.035)return;const o=project(f.pos);if(!o)return;
   const b=scene(),p=[f.pos[0],b.min[1]+.15,Math.max(b.min[2],Math.min(b.max[2],f.pos[2]+2.0))],tar=project(p);if(!tar)return;
   const span=Math.max(18,Math.min(145,Math.hypot(tar.x-o.x,tar.y-o.y)*.43));
   const grd=g.createLinearGradient(o.x,o.y,tar.x,tar.y);grd.addColorStop(0,rgba(col,.27*level));grd.addColorStop(.56,rgba(col,.12*level));grd.addColorStop(1,rgba(col,0));
   g.fillStyle=grd;g.beginPath();g.moveTo(o.x,o.y);g.lineTo(tar.x-span,tar.y);g.lineTo(tar.x+span,tar.y);g.closePath();g.fill();
   const halo=g.createRadialGradient(tar.x,tar.y,0,tar.x,tar.y,span*.75);halo.addColorStop(0,rgba(col,.18*level));halo.addColorStop(1,rgba(col,0));g.fillStyle=halo;g.beginPath();g.arc(tar.x,tar.y,span*.75,0,Math.PI*2);g.fill();
 }
 function drawLaser(f,values,t){if(!f.enabled)return;const op=f.pos,opts=effectFor(f,t),now=(opts?.local??t)*(opts?.speed??1);
   for(let i=0;i<values.length;i++){const v=values[i];if(v.level<=.03)continue;const p=position(f,i,values.length),a=project(p);if(!a)continue;
     const ofs=(i/(Math.max(1,values.length-1))-.5)*f.spread*Math.PI/180;
     const sweep=(opts?.preset==='laserSweep'?Math.sin(now*2):opts?.preset==='laserBurst'?Math.sin(now*3):0)*.24;
     const yaw=(f.pan||0)*Math.PI/180+ofs+sweep,tilt=(f.tilt??-24)*Math.PI/180;
     const end=[p[0]+Math.sin(yaw)*Math.cos(tilt)*f.range,p[1]+Math.sin(tilt)*f.range,p[2]+Math.cos(yaw)*Math.cos(tilt)*f.range];
     const clipped=S.mount136.clipBeam?.(p,end)||end,b=project(clipped);if(!b)continue;
     g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=rgba(v.color,clamp141(v.level*.17,0,.34));g.lineWidth=7;g.stroke();
     g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=rgba(v.color,clamp141(v.level*.85,0,1));g.lineWidth=1.6;g.stroke();
   }
 }
 function drawGizmo(){if(!F.isOpen||!F.dragMode||state.presenting)return;const f=current();if(!f)return;const p=project(f.pos);if(!p)return;g.lineWidth=2.5;g.font='bold 11px Segoe UI';
   for(const [axis,vec,col] of [[0,[.75,0,0],'#ff7777'],[1,[0,.75,0],'#65e49a'],[2,[0,0,.75],'#75b9ff']]){const end=project(f.pos.map((v,i)=>v+vec[i]));if(!end)continue;g.strokeStyle=col;g.fillStyle=col;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(end.x,end.y);g.stroke();g.beginPath();g.arc(end.x,end.y,6,0,Math.PI*2);g.fill();g.fillText('XYZ'[axis],end.x+8,end.y+3);}
 }
 function renderFrame(now=performance.now(),{clean=false}={}){
   if(!g)return;const w=overlay.clientWidth,h=overlay.clientHeight;if(w<2||h<2)return;
   const scale=Math.min(1.5,window.devicePixelRatio||1),cw=Math.ceil(w*scale),ch=Math.ceil(h*scale);
   if(overlay.width!==cw||overlay.height!==ch){overlay.width=cw;overlay.height=ch;}
   g.setTransform(scale,0,0,scale,0,0);g.clearRect(0,0,w,h);
   if(!engine.vp||engine.view!=='stage')return;
   g.save();g.globalCompositeOperation='screen';
   const time=state.time;
   for(const f of F.fixtures){if(!f.enabled)continue;const vals=evaluate(f,time),avg=vals.reduce((s,v)=>s+v.level,0)/vals.length;
     if(f.kind==='par'&&avg>.02)drawWash(f,vals[Math.floor(vals.length/2)].color,Math.min(1.4,avg));
     if(f.kind==='laser')drawLaser(f,vals,time);
     for(let i=0;i<vals.length;i++){const v=vals[i];paintGlow(position(f,i,vals.length),v.color,Math.min(1.8,v.level),f.kind==='par'?19:f.kind==='line'?12:11);}
   }
   if(!clean)drawGizmo();g.restore();return overlay;
 }
 function draw(now){requestAnimationFrame(draw);if(now-F.lastRaf<(document.hidden?110:21))return;F.lastRaf=now;renderFrame(now);}
 function pickAxis(e){const f=current(),p=project(f?.pos||[0,0,0]);if(!f||!p)return null;const r=overlay.getBoundingClientRect(),xy={x:e.clientX-r.left,y:e.clientY-r.top};
   for(let axis=0;axis<3;axis++){const to=[...f.pos];to[axis]+=.75;const end=project(to);if(!end)continue;if(Math.hypot(xy.x-end.x,xy.y-end.y)<22)return axis;}return null;
 }
 overlay.addEventListener('pointerdown',e=>{if(!F.isOpen||!F.dragMode||state.presenting)return;const axis=pickAxis(e);if(axis===null)return;const f=current(),p=project(f.pos),endPos=[...f.pos];endPos[axis]+=.75;const b=project(endPos);if(!p||!b)return;
   F.drag={axis,id:f.id,px:e.clientX,py:e.clientY,origin:[...f.pos],vx:b.x-p.x,vy:b.y-p.y};overlay.setPointerCapture(e.pointerId);e.stopPropagation();e.preventDefault();});
 overlay.addEventListener('pointermove',e=>{if(!F.drag)return;const d=F.drag,f=F.fixtures.find(x=>x.id===d.id);if(!f)return;const axisDist=Math.max(.0001,d.vx*d.vx+d.vy*d.vy);const meters=.75*((e.clientX-d.px)*d.vx+(e.clientY-d.py)*d.vy)/axisDist;
   if(!d.recorded&&Math.abs(meters)>.00001){checkpoint();d.recorded=true;}const p=[...d.origin];p[d.axis]+=clamp141(meters,-15,15);place(f,p,null,false);updateFields();e.stopPropagation();e.preventDefault();});
 overlay.addEventListener('pointerup',()=>{F.drag=null;});overlay.addEventListener('pointercancel',()=>{F.drag=null;});
 const glcanvas=$('glcanvas');
 glcanvas.addEventListener('pointerdown',e=>{if(!F.isOpen||!F.place||state.presenting)return;e.stopImmediatePropagation();e.preventDefault();},true);
 glcanvas.addEventListener('pointerup',e=>{if(!F.isOpen||!F.place||state.presenting||e.button!==0)return;e.stopImmediatePropagation();e.preventDefault();pickOnStage(e);stopModes();paint();},true);
 overlay.addEventListener('pointerup',e=>{if(!F.place||state.presenting)return;e.preventDefault();pickOnStage(e);stopModes();paint();});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&(F.place||F.dragMode)){stopModes();paint();e.stopPropagation();}},true);
 const panel=document.createElement('section');panel.id='fx141Panel';panel.hidden=true;
 document.querySelector('.right-panel')?.appendChild(panel);
 const kindsOption=()=>Object.entries(ITEMS).map(([key,o])=>`<option value="${key}" ${F.kind===key?'selected':''}>${esc141(o.name)}</option>`).join('');
 function targetEntries(selected=F.target){
   const entries=[['all','Tất cả PAR/LINE/LASER'],['par','PAR LED'],['line','LINE BAR'],['laser','LASER BAR']];
   const used=new Set(entries.map(([id])=>id));
   for(const group of new Set(F.fixtures.map(f=>f.group).filter(Boolean))){if(!used.has(group)){entries.push([group,'Nhóm '+group]);used.add(group);}}
   for(const f of F.fixtures){if(!used.has(f.id)){entries.push([f.id,f.name]);used.add(f.id);}}
   if(selected&&!used.has(selected))entries.push([selected,'Đích đã lưu: '+selected]);return entries;
 }
 function commonTarget(selected=F.target){return targetEntries(selected).map(([a,b])=>`<option value="${esc141(a)}" ${selected===a?'selected':''}>${esc141(b)}</option>`).join('');}
 function timelineRows(){const ids=new Set(seq.tracks.filter(t=>t.type==='light').map(t=>t.id));return seq.clips.filter(c=>ids.has(c.track)&&isFX(c)).sort((a,b)=>a.start-b.start);}
 const input=(label,key,val,min,max,step=.1)=>`<label>${label}<input data-fx141="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${Number(val).toFixed(step<.1?2:step<1?1:0)}"></label>`;
 function paint(){if(!F.isOpen)return;const f=current(),layers=trusses();const scroll=panel.querySelector('.fx141-content')?.scrollTop||0;
   panel.innerHTML=`<div class="fx141-head"><div><strong>◉ PAR LED · LINE BAR · LASER BAR</strong><small>Đặt đèn trên truss / điều khiển pixel & timecode</small></div><button data-a141="close" title="Đóng">✕</button></div>
   <div class="fx141-tabs"><button data-tab141="fixtures" class="${F.tab==='fixtures'?'active':''}">+ THÊM ĐÈN</button><button data-tab141="effects" class="${F.tab==='effects'?'active':''}">TIMECODE FX</button><button data-tab141="cues" class="${F.tab==='cues'?'active':''}">CUE LIST</button></div>
   <div class="fx141-content">${F.tab==='fixtures'?`<section><h4>THƯ VIỆN ĐÈN CHẠY FX</h4><div class="fx141-kindgrid">${Object.entries(ITEMS).map(([id,o])=>`<button data-add141="${id}" class="fx141-type"><span class="fx141-symbol ${id}">${id==='par'?'◉':id==='line'?'▥':'✺'}</span><b>${esc141(o.label)}</b><small>${id==='par'?'Wash / RGBW / Strobe':id==='line'?'Pixel / Chase / Line': 'RGB Fan / Laser Sweep'}</small><span class="fx141-plus">+ Thêm</span></button>`).join('')}</div><div class="fx141-grid"><button data-group141="par">+ 8 PAR TRÊN TRUSS</button><button data-group141="line">+ 2 LINE BAR</button><button data-group141="laser">+ 1 LASER BAR</button></div></section>
    <section><h4>ĐÈN ĐÃ THÊM · ${F.fixtures.length} / 64</h4><div class="fx141-fixtures">${F.fixtures.map(x=>`<button data-select141="${x.id}" class="${x.id===F.selected?'sel':''}"><span style="background:${x.color}" class="fx141-dot"></span>${esc141(x.name)} <small>${x.enabled?'ON':'OFF'}</small></button>`).join('')||'<p>Thêm PAR LED / LINE BAR / LASER BAR ở phía trên.</p>'}</div></section>
    ${f?`<section><h4>ĐẶT VỊ TRÍ & GẮN TRUSS</h4><div class="fx141-note">${esc141(f.name)}${f.mount141?` · <b>ĐÃ BÁM: ${esc141(f.mount141.layerName)}</b>`:''}</div><div class="fx141-grid thirds">${['X','Y','Z'].map((a,i)=>input(a+' / m','pos'+i,f.pos[i],-500,500,.05)).join('')}</div><div class="fx141-grid"><button data-a141="place" class="${F.place?'sel':''}">⌖ Click vị trí 3D</button><button data-a141="drag" class="${F.dragMode?'sel':''}">✥ Kéo X/Y/Z</button></div><label>Chọn Truss Layer<select id="fx141Truss"><option value="">— Chọn giàn treo —</option>${layers.map(l=>`<option value="${esc141(l.id)}" ${F.attachLayer===l.id?'selected':''}>${esc141(l.name)} · ${l.axis===1?'Y / Đứng':l.axis===0?'X / Ngang':'Z / Ngang'}</option>`).join('')}</select></label><div class="fx141-grid"><button data-a141="attach">Gắn lên layer</button><button data-a141="detach">Tháo điểm bám</button></div><div class="fx141-grid thirds">${[0,1,2].map(i=>`<div class="fx141-jog"><b>${'XYZ'[i]}</b><button data-jog141="${i}:-0.1">− 10cm</button><button data-jog141="${i}:0.1">+ 10cm</button></div>`).join('')}</div></section>
     <section><h4>THÔNG SỐ & CHẾ ĐỘ PIXEL</h4><label>Tên đèn<input data-fx141="name" value="${esc141(f.name)}" maxlength="64"></label><div class="fx141-grid">${input('Số điểm phát','pixels',f.pixels,1,24,1)}${input('Độ sáng','power',f.power,0,2,.05)}${f.kind!=='par'?input('Chiều dài thanh / m','length',f.length,.4,5,.1):''}</div><div class="fx141-grid"><label>Màu mặc định<input data-fx141="color" type="color" value="${f.color}"></label><label>Nhóm<input data-fx141="group" value="${esc141(f.group)}" maxlength="28"></label></div><div class="fx141-grid"><label>Hướng lắp<select data-fx141="orientation"><option value="vertical" ${f.orientation==='vertical'?'selected':''}>Đứng</option><option value="horizontal" ${f.orientation==='horizontal'?'selected':''}>Nằm ngang</option></select></label><label><input data-fx141="enabled" type="checkbox" ${f.enabled?'checked':''}> Bật đèn</label></div><div class="fx141-grid">${input('PAN °','pan',f.pan,-180,180,1)}${input('TILT °','tilt',f.tilt,-85,80,1)}</div>${f.kind==='laser'?`<div class="fx141-grid">${input('Góc fan °','spread',f.spread,3,120,1)}${input('Range / m','range',f.range,2,60,.5)}</div>`:''}<button class="fx141-danger" data-a141="delete">Xóa đèn đang chọn</button></section>`:''}`:
    F.tab==='effects'?`<section><h4>PRESET TIMECODE · PAR / LINE / LASER BAR</h4><div class="fx141-grid"><label>Nhóm nhận FX<select id="fx141Target">${commonTarget()}</select></label>${input('Thời lượng / s','duration',F.defaultDuration,.2,120,.1)}</div><div class="fx141-grid">${input('Tốc độ ×','speed',F.speed,.2,6,.1)}${input('Độ lớn cụm','groupSize',F.groupSize,1,16,1)}</div><label class="fx141-flash"><input id="fx141Arm" type="checkbox" ${F.allowStrobe?'checked':''}> Cho phép nháy tần số cao trong preview (mặc định tắt; tối đa 3Hz)</label><div class="fx141-presetgrid">${Object.entries(PRESETS).map(([key,v])=>`<button data-preset141="${key}" title="Bấm để xem live · có thể ghi ngay vào timeline"><i style="background:${v[1]}"></i><span>${v[0]}</span></button>`).join('')}</div><div class="fx141-note">Nhấn preset để xem ngay trên sân khấu. Bấm “Ghi cue đang xem” để đưa vào SHOW Timeline; đồng hồ chạy cùng LED / Audio / Light.</div><div class="fx141-grid"><button data-a141="savePreview" class="primary">+ GHI CUE ĐANG XEM</button><button data-a141="autoShow">+ SHOW FX 32 GIÂY</button><button data-a141="stopPreview">■ DỪNG THỬ</button><button data-a141="timeline">⊞ SHOW TIMELINE</button></div></section>`:
    `<section><h4>CUE PAR · LINE · LASER BAR</h4><div class="fx141-current">${timelineRows().length} cue đã lưu · ${seq.enabled?'Timecode ON':'Timecode OFF'}</div>${timelineRows().map(c=>`<div class="fx141-cue"><div><strong>${esc141(c.name)}</strong><small>${c.start.toFixed(2)}s — ${(c.start+c.duration).toFixed(2)}s</small></div><button data-jump141="${esc141(c.id)}" title="Phát cue">▶</button><button data-editcue141="${esc141(c.id)}">Sửa</button><button data-copycue141="${esc141(c.id)}" title="Nhân bản cue">⧉</button><button data-deletecue141="${esc141(c.id)}" title="Xóa cue">×</button></div>`).join('')||'<p>Chưa có cue. Chọn preset ở tab Timecode FX để tạo.</p>'}<div class="fx141-grid"><button data-a141="timeline">Mở SHOW Timeline</button><button data-a141="autoShow">Tạo show 32s</button></div></section>`}</div>
   <div class="fx141-footer"><button data-a141="close">Xong / Về chỉnh sửa</button><button data-a141="effects">⚡ Timecode FX</button></div>`;
   const root=panel.querySelector('.fx141-content');if(root)root.scrollTop=scroll;
 }
 function updateFields(){if(!F.isOpen||F.tab!=='fixtures')return;const f=current();if(!f)return;for(let i=0;i<3;i++){const el=panel.querySelector('[data-fx141="pos'+i+'"]');if(el)el.value=f.pos[i].toFixed(2);}}
 function open(tab='fixtures'){if(state.presenting){toast('Thoát Trình diễn để đặt vị trí đèn; Timecode vẫn chạy trong Trình diễn.');return;}F.tab=tab;F.isOpen=true;
   $('pro127close')?.click();S.mount136.close?.();S.laserShow?.close?.();
   document.body.classList.add('fx141-open');const right=document.querySelector('.right-panel');if(window.innerWidth<980&&!document.body.classList.contains('drawer-right')){document.body.classList.add('drawer-right');F._openedDrawer=true;}
   panel.hidden=false;paint();ensureButtons();}
 function close(){F.isOpen=false;stopModes();panel.hidden=true;document.body.classList.remove('fx141-open');if(F._openedDrawer){document.body.classList.remove('drawer-right');F._openedDrawer=false;}}
 function setFixture(k,val,record=true){const f=current();if(!f)return;if(record)return transaction(()=>setFixture(k,val,false));const p=f.pos.slice();if(k.startsWith('pos')){const i=Number(k.slice(3));p[i]=clamp141(+val,-500,500);place(f,p,null,false);return;}
   if(k==='color'&&/^#[0-9a-f]{6}$/i.test(val))f.color=val;
   else if(k==='name')f.name=String(val).trim().slice(0,64)||ITEMS[f.kind].name;
   else if(k==='group')f.group=String(val).trim().slice(0,28)||f.kind.toUpperCase();
   else if(k==='enabled')f.enabled=!!val;
   else if(k==='orientation')f.orientation=val==='horizontal'?'horizontal':'vertical';
   else if(['pan','tilt','pixels','power','spread','range','length'].includes(k))f[k]=clamp141(+val,k==='tilt'?-85:k==='pan'?-180:k==='length'?.4:0,k==='power'?2:k==='pixels'?24:k==='range'?60:k==='length'?5:k==='tilt'?80:k==='pan'?180:k==='spread'?120:999);
   if(k==='pixels')f.pixels=Math.max(1,Math.round(f.pixels));if(k==='orientation'||k==='length')resetModel(f.id);
 }
 function saveCue(preset,target=F.target,start=state.time,duration=F.defaultDuration,speed=F.speed,options={}){
   const fx=PRESETS[preset];if(!fx)return null;
   if(seq.clips.length>=500){toast('Đã đạt giới hạn 500 cue. Xóa cue không dùng trước khi thêm.');return null;}
   const time=clamp141(start,0,599.95),dur=clamp141(duration,.05,600-time);
   return transaction(()=>{const tr=options.track?seq.tracks.find(t=>t.id===options.track&&t.type==='light'):track10('light','fx141:all','PAR / LINE / LASER FX');if(!tr)return null;
     const c=addClip(tr.id,{name:String(options.name||fx[0]+' · '+(target==='all'?'ALL':target)).slice(0,60),source:'fx141:'+preset+'@'+target,start:time,duration:dur,
       in:clamp141(options.in??0,0,36000),rate:clamp141(options.rate??1,.125,8),fade:clamp141(options.fade??.08,0,dur/2),color:fx[1],gain:clamp141(options.gain??1,0,3),
       fx141:{preset,target:String(target),speed:clamp141(speed,.2,6),groupSize:Math.round(clamp141(options.groupSize??F.groupSize,1,16)),phaseDuration:clamp141(options.phaseDuration??(options.in??0)+dur*(options.rate??1),.01,36000)}});
     F.live=null;enableSequence(true);renderSequence();paint();return c;});
 }
 function preview(preset){if(!PRESETS[preset])return;F.lastPreset=preset;F.lastPreview={preset,target:F.target,speed:F.speed,groupSize:F.groupSize,duration:F.defaultDuration};F.live={...F.lastPreview,started:performance.now()};toast('Xem thử '+PRESETS[preset][0]+' · '+F.defaultDuration+'s. Cue timeline tiếp tục sau khi hết xem thử.');}
 function autoShow(){if(!F.fixtures.length){toast('Hãy thêm PAR LED / LINE BAR / LASER BAR trước.');return;}
   const arr=[['chaseLR','par',4],['groupAlternate','par',4],['verticalChase','line',4],['musicColor','all',4],['laserFan','laser',4],['groupFlash','all',4],['rainbow','all',4],['finale','all',4]];
   let cursor=clamp141(state.time,0,600),count=0;
   try{transaction(()=>{for(const [preset,target,d]of arr){if(cursor>599.8||seq.clips.length>=500)break;const cue=saveCue(preset,target,cursor,Math.min(d,600-cursor),F.speed);if(cue){cursor=cue.start+cue.duration;count++;}}});
     if(count){setPlaying(true);F.tab='cues';paint();toast('Đã tạo '+count+' cue FX trên SHOW Timecode.');}else toast('Không còn thời lượng trống trước giới hạn 600s.');
   }catch(err){toast(err.message);}
 }
 function deleteCue(id){const c=seq.clips.find(c=>c.id===id&&isFX(c));if(!c)return false;return transaction(()=>{seq.clips=seq.clips.filter(q=>q!==c);if(seq.selected===id)seq.selected=null;invalidateSeq();renderSequence();paint();return true;});}
 function duplicateCue(id){const c=seq.clips.find(c=>c.id===id&&isFX(c));if(!c)return null;const start=c.start+c.duration;if(start>=599.95){toast('Không còn chỗ nhân cue sau mốc này (giới hạn 600s).');return null;}const spec=cueSpec(c);return saveCue(spec.preset,spec.target,start,Math.min(c.duration,600-start),spec.speed,{...c,...spec,name:c.name+' +',track:c.track,phaseDuration:spec.phaseDuration??(c.in??0)+c.duration*(c.rate??1)});}
 function removeFixture(id){const f=F.fixtures.find(q=>q.id===id);if(!f)return false;return transaction(()=>{resetModel(id);F.fixtures=F.fixtures.filter(q=>q!==f);F.selected=F.fixtures[0]?.id||null;paint();return true;});}
 function configure(values={},record=true){if(record)return transaction(()=>configure(values,false));if(values.target!=null)F.target=String(values.target);for(const [key,min,max]of [['speed',.2,6],['groupSize',1,16],['defaultDuration',.2,120]])if(values[key]!=null)F[key]=clamp141(values[key],min,max);F.groupSize=Math.round(F.groupSize);if(values.allowStrobe!=null)F.allowStrobe=values.allowStrobe===true;return {...F};}
 function editCue(id=null,track=null){
   const existing=seq.clips.find(c=>c.id===id&&isFX(c));if(id&&!existing)return;
   const spec=existing?cueSpec(existing):{preset:F.lastPreset||'pulse',target:F.target,speed:F.speed,groupSize:F.groupSize};
   const c=existing||{name:'',start:clamp141(state.time,0,599.95),duration:Math.min(F.defaultDuration,600-clamp141(state.time,0,599.95)),gain:1,fade:.08,in:0,rate:1};
   const number=(id,label,val,min,max,step=.1)=>`<label>${label}<input id="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${Number(val)}"></label>`;
   const html=`<div class="fx142-cue-form"><label class="wide">Tên cue<input id="fx142Name" maxlength="60" value="${esc141(c.name)}"></label><label>Hiệu ứng<select id="fx142Preset">${Object.entries(PRESETS).map(([key,v])=>`<option value="${key}" ${spec.preset===key?'selected':''}>${esc141(v[0])}</option>`).join('')}</select></label><label>Nhóm / đèn nhận FX<select id="fx142Target">${commonTarget(spec.target)}</select></label>${number('fx142Start','Bắt đầu / s',c.start,0,599.95,.01)}${number('fx142Duration','Thời lượng / s',c.duration,.05,600,.01)}${number('fx142Speed','Tốc độ hiệu ứng ×',spec.speed,.2,6)}${number('fx142Group','Số đèn mỗi cụm',spec.groupSize,1,16,1)}${number('fx142Gain','Dimmer gain',c.gain??1,0,3,.05)}${number('fx142Fade','Fade vào / ra · s',c.fade??0,0,10,.05)}${number('fx142In','Source IN / s',c.in??0,0,36000,.01)}${number('fx142Rate','Tốc độ clip ×',c.rate??1,.125,8,.125)}</div><p class="hint-text">Cue chồng nhau: track ở dưới ưu tiên; trong cùng track, cue bắt đầu sau ưu tiên. Nhóm đích được lưu riêng cho mỗi cue. Kéo mép trái hoặc tách clip giữ vị trí hiệu ứng theo Source IN.</p><p id="fx142CueError" class="fx142-error" role="alert"></p>`;
   const commit=()=>{const fields=['fx142Start','fx142Duration','fx142Speed','fx142Group','fx142Gain','fx142Fade','fx142In','fx142Rate'];if(fields.some(id=>!$(id).value.trim()||!Number.isFinite(+$(id).value))){$('fx142CueError').textContent='Nhập đầy đủ các giá trị số hợp lệ.';return;}
     const start=+$('fx142Start').value,duration=+$('fx142Duration').value;if(start<0||duration<.05||duration>600||start+duration>600){$('fx142CueError').textContent='Cue cần dài ít nhất 0.05s và kết thúc không quá 600s.';return;}
     const preset=$('fx142Preset').value,target=$('fx142Target').value,options={name:$('fx142Name').value.trim()||PRESETS[preset][0],groupSize:Math.round(clamp141($('fx142Group').value,1,16)),gain:clamp141($('fx142Gain').value,0,3),fade:clamp141($('fx142Fade').value,0,Math.min(10,duration/2)),in:clamp141($('fx142In').value,0,36000),rate:clamp141($('fx142Rate').value,.125,8)},speed=clamp141($('fx142Speed').value,.2,6);
     try{if(existing){transaction(()=>{const changedDuration=existing.duration!==duration||existing.rate!==options.rate;Object.assign(existing,options,{start,duration,source:'fx141:'+preset+'@'+target,color:PRESETS[preset][1],fx141:{preset,target,speed,groupSize:options.groupSize,phaseDuration:changedDuration?options.in+duration*options.rate:spec.phaseDuration??options.in+duration*options.rate}});ensureDuration10(start+duration);F.live=null;seq.selected=existing.id;enableSequence(true);invalidateSeq();renderSequence();paint();});}else if(!saveCue(preset,target,start,duration,speed,{...options,track}))return;$('modal').close();}catch(err){$('fx142CueError').textContent=err.message;}
   };
   dialog(existing?'Chỉnh cue PAR / LINE / LASER':'Thêm cue PAR / LINE / LASER',html,[{label:'Hủy'},...(existing?[{label:'Nhân bản',action:()=>duplicateCue(existing.id)},{label:'Xóa cue',action:()=>deleteCue(existing.id)}]:[]),{label:'Lưu cue',primary:true,close:false,action:commit}]);
 }
 const beforeEdit=editClip,beforeLightEditor=openCueEditor9;
 editClip=function(id=null,type='visual'){const c=seq.clips.find(c=>c.id===id);if(isFX(c))return editCue(id);const tr=seq.tracks.find(t=>t.id===sq.addTrack);if(!id&&tr?.type==='light'&&tr.target==='fx141:all'){sq.addTrack=null;return editCue(null,tr.id);}return beforeEdit(id,type);};
 openCueEditor9=function(id=null,...args){if(isFX(seq.clips.find(c=>c.id===id)))return editCue(id);return beforeLightEditor(id,...args);};
 S.editClip=(...args)=>editClip(...args);S.openCueEditor9=(...args)=>openCueEditor9(...args);
 function ensureButtons(){let bar=$('pro127bar')||document.querySelector('.navigation-strip');if(bar&&!$('fx141OpenBtn')){
     const b=document.createElement('button');b.id='fx141OpenBtn';b.className='btn small';b.textContent='+ PAR · LINE · LASER BAR';b.onclick=()=>open('fixtures');bar.insertBefore(b,bar.children[1]||null);
   }
   const content=$('pro127dock')?.querySelector('.pro127-content');if(content&&!content.querySelector('#fx141QuickAdd')){
     const sec=document.createElement('section');sec.className='pro127-section';sec.id='fx141QuickAdd';sec.innerHTML='<h4>ĐÈN HIỆU ỨNG MỞ RỘNG / PIXEL</h4><div class="pro127-actions"><button data-quick141="par">+ PAR LED</button><button data-quick141="line">+ LED LINE</button><button data-quick141="laser">+ LASER BAR</button></div><p>Thêm đèn phát sáng từng pixel, đặt trên Truss Layer, thêm Chase, nháy cụm, đổi màu theo nhạc trong SHOW Timecode.</p>';
     content.prepend(sec);sec.querySelectorAll('[data-quick141]').forEach(btn=>btn.onclick=()=>{const k=btn.dataset.quick141;open('fixtures');add(k);});
   }
   const show=document.querySelector('#presentControls .show-row');if(show&&!show.querySelector('#fx141ShowBtn')){
     const b=document.createElement('button');b.id='fx141ShowBtn';b.textContent='PAR / LINE FX';b.onclick=()=>{F.live={preset:'chaseLR',target:'all',speed:F.speed,groupSize:F.groupSize,started:performance.now(),duration:5};toast('Preview PAR/LINE FX đang chạy trong Trình diễn.');};show.appendChild(b);
   }
 }
 panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.tab141){F.tab=b.dataset.tab141;paint();return;}
   if(b.dataset.add141){add(b.dataset.add141);return;}
   if(b.dataset.group141){addGroup(b.dataset.group141,b.dataset.group141==='par'?8:b.dataset.group141==='line'?2:1);return;}
   if(b.dataset.select141){F.selected=b.dataset.select141;F.kind=current()?.kind||'par';paint();return;}
   if(b.dataset.preset141){preview(b.dataset.preset141);return;}
   if(b.dataset.jog141){const [a,d]=b.dataset.jog141.split(':');const f=current();if(f)moveAxis(f,+a,+d);return;}
   if(b.dataset.jump141){const c=seq.clips.find(q=>q.id===b.dataset.jump141);if(c){F.live=null;seekTimeline(c.start);setPlaying(true);F.tab='cues';paint();}return;}
   if(b.dataset.deletecue141){deleteCue(b.dataset.deletecue141);return;}
   if(b.dataset.editcue141){editCue(b.dataset.editcue141);return;}
   if(b.dataset.copycue141){duplicateCue(b.dataset.copycue141);return;}
   switch(b.dataset.a141){
    case 'close':close();break;case 'place':setMode('place');break;case 'drag':setMode('drag');break;
    case 'attach':{const f=current(),id=$('fx141Truss')?.value||F.attachLayer,l=trusses().find(x=>x.id===id);if(!l||!f)toast('Chọn Truss Layer trong danh sách trước.');else attach(f,l);break;}
    case 'detach':{const f=current();if(f)transaction(()=>{f.mount141=null;});paint();break;}
    case 'delete':removeFixture(current()?.id);break;
    case 'effects':F.tab='effects';paint();break;
    case 'savePreview':if(F.lastPreset){const p=F.lastPreview||{preset:F.lastPreset,target:F.target,duration:F.defaultDuration,speed:F.speed,groupSize:F.groupSize};try{if(saveCue(p.preset,p.target,state.time,p.duration,p.speed,{groupSize:p.groupSize})){F.tab='cues';paint();toast('Đã ghi cue FX đang xem vào SHOW Timeline.');}}catch(err){toast(err.message);}}else toast('Hãy chọn và xem một preset trước.');break;
    case 'autoShow':autoShow();break;
    case 'stopPreview':F.live=null;toast('Đã dừng xem thử hiệu ứng.');break;
    case 'timeline':toggleSequence(true);renderSequence();break;
   }
 });
 panel.addEventListener('focusout',e=>{delete e.target._fx142History;});
 panel.addEventListener('input',e=>{const el=e.target,key=el.dataset.fx141;if(!key)return;
   if(['pos0','pos1','pos2','power','pan','tilt','spread','range','length'].includes(key)){if(!el.value.trim()||!Number.isFinite(+el.value))return;fieldCheckpoint(el);setFixture(key,el.value,false);}
 });
 panel.addEventListener('change',e=>{const el=e.target,key=el.dataset.fx141;
   if(el.id==='fx141Truss'){F.attachLayer=el.value;return;}
   if(el.id==='fx141Target'){fieldCheckpoint(el);F.target=el.value;return;}
   if(el.id==='fx141Arm'){fieldCheckpoint(el);F.allowStrobe=el.checked;return;}
   if(key==='duration'||key==='speed'||key==='groupSize'){fieldCheckpoint(el);configure({[key==='duration'?'defaultDuration':key]:el.value},false);return;}
   if(key){fieldCheckpoint(el);setFixture(key,key==='enabled'?el.checked:el.value,false);paint();}
 });
 function bankData(){return {v:2,fixtures:structuredClone(F.fixtures),selected:F.selected,allowStrobe:F.allowStrobe,speed:F.speed,groupSize:F.groupSize,target:F.target,defaultDuration:F.defaultDuration,cues:timelineRows().map(c=>({id:c.id,fx141:{...cueSpec(c)}}))};}
 function restoreBank(saved){
   const ids=new Set(),list=[];
   for(const q of (Array.isArray(saved?.fixtures)?saved.fixtures:[]).slice(0,64)){
     if(!q||!ITEMS[q.kind]||!Array.isArray(q.pos)||q.pos.length!==3||!q.pos.every(Number.isFinite))continue;
     const base=defaults(q.kind,q.pos),candidate=String(q.id||base.id);if(ids.has(candidate))continue;
     const id=/^[A-Za-z0-9_-]{1,100}$/.test(candidate)?candidate:base.id;ids.add(id);
     const f={...base,id,name:String(q.name||base.name).slice(0,64),pos:S.mount136.constrain(q.pos),enabled:q.enabled!==false,
       orientation:q.orientation==='horizontal'?'horizontal':'vertical',color:/^#[0-9a-f]{6}$/i.test(q.color)?q.color:base.color,
       group:String(q.group||base.group).trim().slice(0,28),pixels:Math.round(clamp141(q.pixels??base.pixels,1,24)),power:clamp141(q.power??base.power,0,2),
       pan:clamp141(q.pan??0,-180,180),tilt:clamp141(q.tilt??base.tilt,-85,80),spread:clamp141(q.spread??base.spread,0,120),range:clamp141(q.range??base.range,0,60),length:clamp141(q.length??base.length,.4,5)};
     const m=q.mount141;if(m&&Array.isArray(m.point)&&m.point.length===3&&m.point.every(Number.isFinite))f.mount141={layerId:m.layerId?String(m.layerId):null,layerName:String(m.layerName||'TRUSS').slice(0,120),point:m.point.map(v=>clamp141(v,-500,500)),offset:Array.isArray(m.offset)&&m.offset.length===3&&m.offset.every(Number.isFinite)?m.offset.map(v=>clamp141(v,-500,500)):[0,0,0],meshRef:m.meshRef?String(m.meshRef):null};
     list.push(f);
   }
   resetModel();F.fixtures=list;F.selected=list.some(f=>f.id===saved?.selected)?saved.selected:list[0]?.id||null;F.live=null;F.lastPreview=null;F.lastPreset=null;
   F.allowStrobe=saved?.allowStrobe===true;configure({speed:saved?.speed??1,groupSize:saved?.groupSize??4,target:saved?.target??'all',defaultDuration:saved?.defaultDuration??6},false);
   for(const item of Array.isArray(saved?.cues)?saved.cues:[]){const real=seq.clips.find(c=>c.id===item.id&&isFX(c));if(real&&item.fx141)real.fx141=cueSpec({...real,fx141:item.fx141});}
   if(F.isOpen)paint();
 }
 const oldPack=packLiveExtras,oldRestore=restoreLiveExtras,oldSnapshot=snapshot,oldRestoreSnapshot=restore;
 packLiveExtras=async function(){const out=await oldPack();out.fx141=bankData();return out;};
 restoreLiveExtras=async function(data){await oldRestore(data);restoreBank(data?.fx141);};
 snapshot=function(){const out=oldSnapshot();out.fx141=bankData();return out;};
 restore=function(data){oldRestoreSnapshot(data);restoreBank(data?.fx141);};
 const oldImport=importModel;
 importModel=async function(...args){const previousModel=state.model,result=await oldImport(...args);if(state.model!==previousModel){resetModel();F.fixtures=[];F.selected=null;F.live=null;paint();}return result;};S.importModel=importModel;
 const oldDemo=demo;
 demo=function(...args){const previousModel=state.model,result=oldDemo(...args);if(state.model!==previousModel){resetModel();F.fixtures=[];F.selected=null;F.live=null;paint();}return result;};S.demo=demo;
 // Stable extension API; values always refer to the live bank after import/undo.
 Object.assign(F,{add,addGroup,open,close,preview,saveCue,autoShow,evaluate,effectFor,editCue,deleteCue,duplicateCue,removeFixture,configure,renderFrame,canvas:overlay,
   stopPreview(){F.live=null;},
   targetEntries,serialize:bankData,restoreBank,
   updateFixture(id,changes){const f=F.fixtures.find(q=>q.id===id);if(!f)return false;return transaction(()=>{const selected=F.selected;F.selected=id;try{for(const [key,value]of Object.entries(changes||{}))setFixture(key,value,false);}finally{F.selected=selected;}paint();return true;});},
   setPosition(id,pos){return place(F.fixtures.find(f=>f.id===id),pos);},
   attach:(id,layerId)=>attach(F.fixtures.find(f=>f.id===id),trusses().find(l=>l.id===layerId))});
 Object.defineProperty(F,'data',{enumerable:true,get:()=>({fixtures:structuredClone(F.fixtures),cues:timelineRows().map(c=>structuredClone(c))})});
 S.fx141=F;S.snapshot=(...args)=>snapshot(...args);S.restore=(...args)=>restore(...args);
 requestAnimationFrame(draw);
 const originalToggle=togglePresentation;
 togglePresentation=function(...args){if(F.isOpen)close();const out=originalToggle(...args);ensureButtons();requestAnimationFrame(ensureButtons);return out;};
 const previousUI=renderUI;
 renderUI=function(...args){const out=previousUI(...args);requestAnimationFrame(ensureButtons);return out;};
 const studioBrand=document.querySelector('.brand small');if(studioBrand)studioBrand.textContent='V14.2 / SHOW RELIABILITY';
 setInterval(ensureButtons,1200);ensureButtons();
 S.version='14.2.0';console.info('V14.2 Multi-fixture reliable timecode loaded');
})();
