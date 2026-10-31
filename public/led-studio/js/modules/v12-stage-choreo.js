(function(){
 if(typeof window==='undefined' || !window.STUDIO) return;
 const stage12={overlayMode:'compact',defaultSceneVisual:true};
 window.STUDIO.stage12=stage12;
 window.STUDIO.setOverlayMode=function(mode){stage12.overlayMode=mode==='full'?'full':'compact';invalidateSeq();renderUI();};

 // V12.1: LED visual and performance are independent layers.
 // Never suppress visual tracks while a 3D performance is active.
 // Scene overlap is handled at the editor/presentation level only.
 const baseCreateScene10=createScene10;
 createScene10=function(options={}){
  if(options.visual===undefined && options.actId && stage12.defaultSceneVisual===false) options={...options,visual:true};
  return baseCreateScene10(options);
 };

 Object.assign(ACT_TYPES,{
  fan_dance:{name:'Múa quạt',kind:'fandancer',count:6,radius:3.4,tag:'FAN DANCE / FLOW'},
  keymoment:{name:'Key moment sân khấu',kind:null,count:0,radius:3.1,tag:'KEY MOMENT / LIFT'},
  ribbon:{name:'Múa lụa',kind:'fandancer',count:4,radius:3.2,tag:'RIBBON / SWIRL'}
 });
 Object.assign(castNames,{fandancer:'Vũ công quạt / lụa'});

 // V16.0: fandancer wrist-anchored 9-rib fans & full-body IK handled natively in buildArtHuman11 / pose11

 const baseRebuildActCache=rebuildActCache;
 rebuildActCache=function(){
  baseRebuildActCache();
  for(const a of director.acts){
   const c=actCache.get(a.id); if(!c) continue;
   if(a.type==='fan_dance' || a.type==='ribbon'){
    c.parts=c.parts||[];
    if(!c.lines){ c.lines=makeLines8(84,a.type==='ribbon'?[1,.5,.92,1]:[1,.72,.38,1]); c.meshes.push(c.lines); }
    if(!c.parts.some(p=>p.role==='liftMain')){
     const lift=boxMesh('Fan dance lift',[0,.18,.05],[2.2,.22,1.3],[.13,.17,.22,1]);
     lift.material.emissive=[.05,.08,.12];
     c.parts.push({role:'liftMain',mesh:lift});
     c.meshes.push(lift);
    }
   }
   if(a.type==='keymoment'){
    c.parts=c.parts||[];
    if(!c.parts.length){
     const liftBase=boxMesh('Keymoment lift base',[0,.18,.15],[2.6,.24,1.5],[.10,.14,.18,1]);
     const liftDeck=boxMesh('Keymoment deck',[0,.56,.15],[1.6,.12,1.0],[.21,.25,.32,1]);
     liftDeck.material.emissive=[.08,.16,.25];
     const ring=glow8(ring8('Hero ring',[0,1.6,.12],1.0,.022,[.22,.85,.95,1],'z',60),'#4fe7ff',1.6);
     const orb=glow8(ellipsoid('Hero core',[0,1.55,.12],[.26,.26,.26],[.92,.72,.30,1],22,14),'#ffc56b',1.5);
     c.parts.push({role:'liftBase',mesh:liftBase},{role:'liftDeck',mesh:liftDeck},{role:'heroRing',mesh:ring},{role:'heroOrb',mesh:orb});
     c.meshes.push(liftBase,liftDeck,ring,orb);
    }
    if(!c.lines){ c.lines=makeLines8(56,[.45,.88,1,1]); c.meshes.push(c.lines); }
   }
   if(['reveal','launch'].includes(a.type)){
    c.parts=c.parts||[];
    if(!c.parts.some(p=>p.role==='liftSideL')){
     const sideL=boxMesh('Side lift L',[-1.95,.16,.25],[.72,.18,.72],[.11,.15,.20,1]);
     const sideR=boxMesh('Side lift R',[ 1.95,.16,.25],[.72,.18,.72],[.11,.15,.20,1]);
     c.parts.push({role:'liftSideL',mesh:sideL},{role:'liftSideR',mesh:sideR});
     c.meshes.push(sideL,sideR);
    }
   }
  }
 };

 const baseDrawAct8=drawAct8;
 drawAct8=function(a,t){
  const c=actCache.get(a.id);
  if(a.type==='fan_dance' || a.type==='ribbon' || a.type==='keymoment'){
   const st=actState8(a,t); if(!st.visible || !c) return;
   const root=rootActMatrix8(a),time=st.t,phase=time*2*Math.PI*(seq.bpm||120)/60;
   if(c.lines){
    const lines=[];
    if(a.type==='keymoment'){
     for(let i=0;i<56;i++){
      const age=(time*.22+i*.02)%1,ang=i/56*Math.PI*2+phase*.15,r=.35+age*1.25;
      lines.push([[Math.cos(ang)*r,.9+age*1.1,.15+Math.sin(ang)*r],[Math.cos(ang+.12)*(r+.2),1.05+age*1.05,.15+Math.sin(ang+.12)*(r+.2)]]);
     }
     lineGeometry8(c.lines,lines,.016);
     c.lines.actorMatrix=root; engine.draw(c.lines,0);
    } else {
     baseDrawAct8(a,t);
    }
   }
   for(const part of c.parts||[]){
    let local=M.identity();
    if(part.role==='liftMain') local=M.translate([0,.08+.08*Math.max(0,Math.sin(phase*.35)),0]);
    if(part.role==='liftDeck') local=M.translate([0,.15+.36*Math.max(0,Math.sin(phase*.28)),0]);
    if(part.role==='heroRing') local=M.mm(M.translate([0,.25+.18*Math.max(0,Math.sin(phase*.25)),0]),M.rotate([0,1,0],time*.5));
    if(part.role==='heroOrb') local=M.translate([0,.18+.28*Math.max(0,Math.sin(phase*.25)),0]);
    part.mesh.actorMatrix=M.mm(root,local); engine.draw(part.mesh,0);
   }
   return;
  }
  baseDrawAct8(a,t);
 };

 async function createChoreoDemo12(){
  setPlaying(false); demo(); seq.people=[]; director.acts=[]; seq.clips=[]; seq.tracks=[]; stage10.scenes=[]; choreo11.routes=[]; state.duration=48;
  const z=.35,y=deckY(0,z),acts=[];
  const program=[['fan_dance',0,14,'01 / Mua quat - Mo man'],['led_dance',14,10,'02 / Mua LED - Chuyen canh'],['water_drums',24,8,'03 / Trong nuoc - Crescendo'],['keymoment',32,8,'04 / Key moment - Ban nang'],['laser',40,8,'05 / Laser finale']];
  for(const [type,start,duration,name] of program){
   const a=addAct8(type,{name,pos:[0,y,z]}),c=addActClip8(a.id,{name,start,duration,cycle10:8,loop:true,fade:0});
   acts.push({a,c});
   const scene={id:uid('scene'),name,start,duration,actId:a.id,clipIds:[c.id],color:start===0?'#d08b59':start<24?'#58b7b1':start<32?'#899acb':start<40?'#d0b86a':'#b595cb'};
   c.scene10=scene.id; stage10.scenes.push(scene);
  }
  for(const [i,p] of seq.people.entries()){ p.color=['#385c7b','#7b3956','#7a5d32','#2d5c56'][i%4]; p.skin=['#c49372','#b87b60','#d4ac87'][i%3]; }
  for(const {a,c} of acts){
   if(!a.people.length) continue; choreo11.clip=c.id;
   if(a.type==='fan_dance') formation11('circle',{record:false,span:6,depth:2.2});
   else if(a.type==='led_dance') formation11('entrance',{record:false,span:4.8,depth:1.7});
   else if(a.type==='water_drums') formation11('hold',{record:false,span:4.0,depth:1.4});
   else if(a.type==='laser') formation11('vline',{record:false,span:4.8,depth:1.4});
   else formation11('vline',{record:false,span:4.5,depth:1.8});
  }
  engine.settings.ambient=.38; engine.settings.exposure=.95; engine.settings.beam=.24; engine.settings.haze=13;
  engine.lights.forEach((l,i)=>{l.power=1.36;l.angle=18;l.color=i%2?'#efc79f':'#90d6ea';l.target=[(i/7-.5)*5,y+1.2,1];l.sweep=false;});
  engine.rebuildFixtures(); engine.accent='#ffb680'; stage10.castFill=.18; choreo11.artFill=.32;
  await addMusicFile(demoMusicFile(),{silent:true}); live.audioMode='music';
  addClip(track10('audio','all','MUSIC / REHEARSAL').id,{name:'Rehearsal beat',source:'music',start:0,duration:48,loop:true,gain:.8,fade:.4});
  seq.enabled=true; seq.animate=true; seq.pps=31; seq.snap=false; state.model.name='ALPHA_V12_Choreography_48s'; state.time=4.8;
  choreo11.clip=acts[0].c.id; choreo11.person=acts[0].a.people[0]; dirty11(); rebuildCast(); rebuildActCache(); openChoreo11(acts[0].c.id); frameChoreo11(false);
  engine.camera.distance*=1.06; engine.camera.pitch=.28; engine.autoQuality=false; engine.previewScale=1; engine.showGuides=false; state.history=[]; state.redo=[]; renderUI();
  return acts;
 }
 window.STUDIO.createChoreoDemo12=createChoreoDemo12;

 function inject12Toolbar(){
  const bar=document.querySelector('.dir-toolbar')||document.querySelector('.topbar')||document.querySelector('.toolbar');
  if(bar && !$('v12Overlay')){
   const b=document.createElement('button'); b.className='btn small'; b.id='v12Overlay'; b.textContent='Timeline: Gon';
   b.onclick=()=>{stage12.overlayMode=stage12.overlayMode==='compact'?'full':'compact'; document.body.classList.toggle('v121-compact',stage12.overlayMode==='compact'); b.textContent='Timeline: '+(stage12.overlayMode==='compact'?'Gon':'Day du'); renderSequence();};
   bar.appendChild(b);
  }
  const media=document.querySelector('.media-section');
  if(media && !$('v12Demo')){
   const b=document.createElement('button'); b.className='btn small'; b.id='v12Demo'; b.textContent='Demo V12';
   b.onclick=()=>dialog('Mo demo V12?','<p>Demo uu tien bien dao, them mua quat, key moment ban nang va tranh chong screen / 3D.</p>',[{label:'Huy'},{label:'Mo demo',primary:true,action:()=>createChoreoDemo12().catch(e=>toast(e.message))}]);
   media.appendChild(b);
  }
 }
 const oldRenderUI=renderUI;
 renderUI=function(){const r=oldRenderUI();setTimeout(inject12Toolbar,0);return r;};
 setTimeout(()=>{inject12Toolbar(); document.body.classList.add('v121-compact');},600);
 if(window.STUDIO) window.STUDIO.version='1.2.1';
})();

(function(){
 if(typeof window==='undefined' || !window.STUDIO) return;
 const stage122={version:'V12.2 / CHOREO PLUS'};
 window.STUDIO.stage122=stage122;

 function actByPerson12(p){return p?.actId ? director.acts.find(a=>a.id===p.actId) : null;}
 function ensureLift12(a){
   if(!a) return null;
   if(!a.lift12) a.lift12={enabled:['keymoment','reveal','launch','fan_dance','ribbon'].includes(a.type),layout:(a.type==='keymoment'?'hero':'single'),height:(a.type==='keymoment'?.42:.12),width:(a.type==='keymoment'?1.9:2.4),depth:(a.type==='keymoment'?1.2:1.4),count:(a.type==='launch'?3:1),spacing:1.85,offsetZ:(a.type==='keymoment'?.12:0),glow:true};
   return a.lift12;
 }

 const baseDirData = typeof dirData==='function'?dirData:null;
 if(baseDirData){
   dirData=function(){ const d=baseDirData(); d.actLifts=director.acts.map(a=>({id:a.id,lift12:a.lift12?structuredClone(a.lift12):null})); return d; };
 }
 const baseRestoreDirector = typeof restoreDirector==='function'?restoreDirector:null;
 if(baseRestoreDirector){
   restoreDirector=function(data){ baseRestoreDirector(data); const map=new Map((data?.actLifts||[]).map(x=>[x.id,x.lift12])); for(const a of director.acts){ if(map.has(a.id)&&map.get(a.id)) a.lift12=structuredClone(map.get(a.id)); else ensureLift12(a);} };
 }

 const oldAddAct8 = addAct8;
 addAct8=function(type,opts={}){ const a=oldAddAct8(type,opts); if(a) ensureLift12(a); return a; };
 director.acts.forEach(ensureLift12);

 const oldBuildHuman=buildHuman;
 buildHuman=function(d,lite=false,pose=0){
   let nodes=oldBuildHuman(d,lite,pose);
   if(['dancer','leddancer','laserdancer','fandancer'].includes(d.type)){
     const body=nodes.find(n=>n.name==='body');
     if(body){
       const accent=d.type==='laserdancer'?[.95,.30,.58,1]:d.type==='leddancer'?[.25,.88,.98,1]:d.type==='fandancer'?[.96,.72,.34,1]:[.85,.58,.92,1];
       const sash=glow8(rod('Sash',[0,.96,.12],[0,1.34,.11],.012,.010,accent,7),'#ffffff',0.45);
       body.meshes.push(sash);
       if(d.type==='dancer' || d.type==='fandancer'){
         const skirt=torso([[.73,.12,.11],[.69,.20,.18],[.60,.28,.25],[.46,.34,.30]], [accent[0]*.55,accent[1]*.45,accent[2]*.55,1], lite?8:16);
         transformMesh(skirt,M.translate([0,0,0]));
         body.meshes.push(skirt);
       }
     }
   }
   return nodes;
 };

 // V16.0: V12.2 post-IK Euler overrides integrated into pose11 IK

 const oldFormation11=formation11;
 formation11=function(kind,{record=true,span=5,depth=2}={}){
   if(['fan_open','fan_wave','cross_flow','hero_arc','kneel_rise'].includes(kind)){
     adoptSelection11(); const c=clip11(),ps=people11(c).filter(p=>p.type!=='audience'); if(!c||!ps.length) return;
     const a=director.acts.find(a=>a.id===c.source); if(record) checkpoint();
     const center=a?.pos||ps.reduce((s,p)=>M.add(s,M.mul(p.pos,1/ps.length)),[0,0,0]), yaw=(a?.yaw||0)*Math.PI/180, rot=M.rotate([0,1,0],yaw);
     const world=v=>M.add(center,M.vector(rot,v)), stamp=(p,u,x,z,action,ease='smooth',face='front',energy=.75)=>{const r=ensureRoute11(p,c),w=world([x,0,z]);w[1]=p.pos[1];return key11(u,worldOffset11(p,r,w),{action,ease,face,energy});};
     ps.forEach((p,i)=>{
       const r=ensureRoute11(p,c), n=ps.length, x=(i-(n-1)/2)*Math.min(1.35,span/Math.max(1,n-1));
       if(kind==='fan_open') r.keys=[stamp(p,0,x*.2,-depth*.6,'walk','curve','path',.65),stamp(p,.20,x*.55,-depth*.18,'wave','smooth','path',.72),stamp(p,.42,x*.78,depth*.08,'fan','curve','front',.92),stamp(p,.67,x*.95,depth*.45,'spin','curve','path',.95),stamp(p,1,x*.38,depth*.10,'finale','smooth','front',1)];
       else if(kind==='fan_wave') r.keys=[stamp(p,0,x,-depth*.15,'fan','smooth','front',.82),stamp(p,.33,x*.82,depth*.10,'wave','curve','front',.88),stamp(p,.66,x*1.02,depth*.32,'fan','curve','front',.95),stamp(p,1,x*.55,0,'finale','smooth','front',1)];
       else if(kind==='cross_flow'){ const side=i<n/2?-1:1; r.keys=[stamp(p,0,side*(span*.65+1.2),-depth*.25,'walk','curve','path',.65),stamp(p,.28,-side*(Math.abs(x)*.45),-depth*.05,'walk','curve','path',.72),stamp(p,.54,x*.25,depth*.16,'spin','curve','path',.82),stamp(p,.78,x*.85,depth*.34,'dance','smooth','front',.9),stamp(p,1,x,0,'hold','smooth','front',.65)]; }
       else if(kind==='hero_arc'){ const a0=-Math.PI*.45 + (n===1?0:i/(n-1))*Math.PI*.9; r.keys=[stamp(p,0,Math.cos(a0)*span*.28,-depth*.42+Math.sin(a0)*.35,'walk','curve','path',.65),stamp(p,.35,Math.cos(a0)*span*.48,depth*.05+Math.sin(a0)*.42,'reach','curve','front',.82),stamp(p,.70,Math.cos(a0)*span*.62,depth*.30+Math.sin(a0)*.48,'wave','curve','front',.9),stamp(p,1,Math.cos(a0)*span*.52,depth*.18,'finale','smooth','front',1)]; }
       else if(kind==='kneel_rise') r.keys=[stamp(p,0,x,-depth*.25,'walk','smooth','path',.65),stamp(p,.35,x*.9,0,'kneel','hold','front',.45),stamp(p,.58,x*.9,0,'kneel','hold','front',.45),stamp(p,.82,x*.95,depth*.22,'reach','curve','front',.82),stamp(p,1,x,depth*.10,'finale','smooth','front',1)];
       r.enabled=true;
     });
     choreo11.key=route11()?.keys[0]?.id; dirty11(); renderUI(); toast('Da tao bien dao nang cao.'); return;
   }
   return oldFormation11(kind,{record,span,depth});
 };

 const oldRoutePose11=routePose11;
 routePose11=function(p,t){
   const rp=oldRoutePose11(p,t);
   if(!rp||!rp.route) return rp;
   const keys=rp.route.keys||[];
   let idx=Math.max(0,keys.findIndex(k=>k.id===rp.key?.id)); if(idx<0) idx=0;
   const next=keys[Math.min(idx+1,keys.length-1)]||rp.key;
   rp.nextAction=next.action; rp.blend=(rp.segmentU||0); 
   if(rp.key?.action==='hold' && rp.nextAction && rp.blend>.4) rp.action=rp.nextAction;
   return rp;
 };

 function inject122(){
   const bar=document.querySelector('.dir-toolbar')||document.querySelector('.toolbar');
   
   const actRows=[...document.querySelectorAll('[data-add-act]')];
   if(actRows.length && !document.getElementById('v122FormBtns')){
     const wrap=document.createElement('div'); wrap.id='v122FormBtns'; wrap.className='dir-act-row';
     wrap.innerHTML='<b>Biên đạo nâng cao</b><div><button data-v122-form="fan_open">Múa quạt mở</button><button data-v122-form="fan_wave">Fan wave</button><button data-v122-form="cross_flow">Cross flow</button><button data-v122-form="hero_arc">Hero arc</button><button data-v122-form="kneel_rise">Quỳ / đứng</button></div><p class="hint-text">Tạo nhanh biên đạo mượt hơn, rồi kéo mốc trên sân khấu để chỉnh tiếp.</p>';
     const host=document.querySelector('.dir-section .hint-text')?.parentElement || document.querySelector('.dir-section');
     if(host) host.appendChild(wrap);
     wrap.querySelectorAll('button[data-v122-form]').forEach(btn=>btn.onclick=()=>formation11(btn.dataset.v122Form,{record:true,span:5.2,depth:2.2}));
   }
 }
 const oldRenderUI=renderUI;
 renderUI=function(){ const r=oldRenderUI(); setTimeout(inject122,0); return r; };
 setTimeout(inject122,700);
 if(window.STUDIO) window.STUDIO.version='1.2.2';
})();

(function(){
 if(typeof window==='undefined' || !window.STUDIO) return;
 const perf123={version:'V12.3 / Performer Fix'};
 window.STUDIO.perf123=perf123;

 function isStagePerformer123(t){return ['dancer','leddancer','laserdancer','fandancer','singer','guitarist','waterdrummer'].includes(t);}
 function typeToAction123(a){
   if(!a) return 'fan_wave';
   if(a.type==='fan_dance' || a.type==='ribbon') return 'fan_open';
   if(a.type==='water_drums') return 'kneel_rise';
   if(a.type==='laser') return 'cross_flow';
   if(a.type==='keymoment' || a.type==='reveal' || a.type==='launch') return 'hero_arc';
   return 'fan_wave';
 }

 const oldBuildHuman123=buildHuman;
 buildHuman=function(d,lite=false,pose=0){
   let nodes=oldBuildHuman123(d,lite,pose);
   if(isStagePerformer123(d.type)){
     const head=nodes.find(n=>n.name==='head');
     const body=nodes.find(n=>n.name==='body');
     if(head&&body){
       const skin=[...hexrgb(d.skin||'#c49674'),1], cloth=[...hexrgb(d.color||'#6b4c88'),1];
       const neckFill=rod('Neck filler',[0,1.42,0],[0,1.54,0],.068,.078,skin,10);
       const collar=torso([[1.34,.20,.15],[1.41,.23,.18],[1.48,.17,.14]], [cloth[0]*.8,cloth[1]*.8,cloth[2]*.8,1], 14);
       body.meshes.push(neckFill, collar);
     }
     const left=nodes.find(n=>n.name==='left'), right=nodes.find(n=>n.name==='right');
     if(body && left && right){
       const fillCol=[...hexrgb(d.color||'#6b4c88'),1];
       body.meshes.push(rod('Shoulder L',[-.10,1.33,.02],[-.18,1.26,.03],.052,.046,fillCol,9));
       body.meshes.push(rod('Shoulder R',[ .10,1.33,.02],[ .18,1.26,.03],.052,.046,fillCol,9));
       body.meshes.push(rod('Waist fill',[0,.98,.02],[0,1.12,.03],.12,.11,fillCol,10));
     }
   }
   return nodes.filter(n=>n.meshes?.length);
 };

 // V16.0: V12.3 post-IK Euler overrides integrated into pose11 IK

 function autoBlock123(actId){
   const a=director.acts.find(x=>x.id===actId); if(!a) return;
   const clip=seq.clips.find(c=>c.source===a.id); if(!clip) return;
   choreo11.clip=clip.id;
   const preset=typeToAction123(a);
   formation11(preset,{record:true,span:(a.people?.length||4)>4?5.6:4.8,depth:2.2});
 }
 window.STUDIO.autoBlock123=autoBlock123;

 function createShow123(){
   setPlaying(false); demo(); seq.people=[]; director.acts=[]; seq.clips=[]; seq.tracks=[]; stage10.scenes=[]; choreo11.routes=[]; state.duration=50;
   const z=.35,y=deckY(0,z); const plan=[['fan_dance',0,12],['led_dance',12,10],['water_drums',22,8],['keymoment',30,10],['laser',40,10]];
   for(const [type,start,duration] of plan){ const a=addAct8(type,{pos:[0,y,z]}); const c=addActClip8(a.id,{start,duration,cycle10:8,loop:true,fade:0,name:(a.name||type)}); stage10.scenes.push({id:uid('scene'),name:a.name,start,duration,actId:a.id,clipIds:[c.id],color:'#7ba3c8'}); autoBlock123(a.id); }
   rebuildCast(); rebuildActCache(); renderUI(); toast('Da tao show V12.3 voi bien dao va ban nang.');
 }
 window.STUDIO.createShow123=createShow123;

 function inject123(){
   const bar=document.querySelector('.dir-toolbar')||document.querySelector('.toolbar');
   
   if(bar && !$('v123Auto')){const b=document.createElement('button');b.id='v123Auto';b.className='btn small';b.textContent='Tạo biên đạo';b.onclick=()=>{const a=director.selection?.kind==='act'?director.selection.id:director.acts[0]?.id;if(a)autoBlock123(a);else toast('Chưa có act.');};bar.appendChild(b);}
   if(bar && !$('v123Demo')){const b=document.createElement('button');b.id='v123Demo';b.className='btn small';b.textContent='Show mẫu V12.3';b.onclick=createShow123;bar.appendChild(b);}
 }
 const oldRender123=renderUI;
 renderUI=function(){const r=oldRender123();setTimeout(inject123,0);return r;};
 setTimeout(inject123,600);
 if(window.STUDIO) window.STUDIO.version='1.2.3';
})();

/* Creative LED Studio V12.4 - Standalone stage-surface lift.
   Geometry is cut from an imported horizontal deck, without rescaling the model.
   No act-linked platform is created by this feature. */
(function(){
 'use strict';
 if(typeof window==='undefined'||!window.STUDIO||!engine)return;
 const L={items:[],selected:null,open:false,drawing:false,anchor:null,drag:null,mouse:null,manual:false,manualHeight:0,cache:new Map(),extras:new Map(),revision:0,playhead:0,rebuilding:false};
 const EPS=0.00001;
 const byId=id=>L.items.find(x=>x.id===id);
 const uidLift=()=> 'lift_'+Math.random().toString(36).slice(2,10);
 const fmtLift=(v,d=2)=>Number(v||0).toFixed(d);
 const lim=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
 const safeId=s=>String(s||'').replace(/[^a-zA-Z0-9_-]/g,'_');
 const isStageView=()=>engine.view==='stage';
 function destroyExtra(){
  for(const e of L.extras.values())for(const m of e.meshes)engine.releaseMesh(m);
  L.extras.clear();
 }
 function discardCache(restore=true){
  if(restore)for(const v of L.cache.values())if(engine.stage.includes(v.mesh)){
    engine.releaseMesh(v.mesh);v.mesh.p=new Float32Array(v.p);v.mesh.n=new Float32Array(v.n);v.mesh.uv=new Float32Array(v.uv);v.mesh.bounds=M.bbox(v.p);v.mesh.hidden=v.hidden;
  }
  L.cache.clear();destroyExtra();engine._stageBatchDirty=true;
 }
 function getSource(mesh){
  let v=L.cache.get(mesh.id);
  if(!v||v.mesh!==mesh){v={mesh,p:new Float32Array(mesh.p),n:new Float32Array(mesh.n),uv:new Float32Array(mesh.uv),hidden:!!mesh.hidden};L.cache.set(mesh.id,v)}
  return v;
 }
 function resetCutMesh(mesh,base){
  engine.releaseMesh(mesh);mesh.p=new Float32Array(base.p);mesh.n=new Float32Array(base.n);mesh.uv=new Float32Array(base.uv);mesh.hidden=base.hidden;mesh.bounds=M.bbox(base.p);
 }
 function vertex(p,n,uv,i){const j=i*3,k=i*2;return {p:[p[j],p[j+1],p[j+2]],n:[n[j]||0,n[j+1]||1,n[j+2]||0],uv:[uv[k]||0,uv[k+1]||0]};}
 function mixVertex(a,b,t){t=lim(t,0,1);return {p:a.p.map((x,i)=>x+(b.p[i]-x)*t),n:a.n.map((x,i)=>x+(b.n[i]-x)*t),uv:a.uv.map((x,i)=>x+(b.uv[i]-x)*t)};}
 function insidePlane(v,axis,bound,less){return less?v.p[axis]<=bound+EPS:v.p[axis]>=bound-EPS;}
 function clipPlane(poly,axis,bound,less){
  if(!poly.length)return [];
  const result=[];
  for(let i=0;i<poly.length;i++){
   const prev=poly[(i+poly.length-1)%poly.length],cur=poly[i],pIn=insidePlane(prev,axis,bound,less),cIn=insidePlane(cur,axis,bound,less);
   if(pIn!==cIn){const den=cur.p[axis]-prev.p[axis];result.push(mixVertex(prev,cur,Math.abs(den)>1e-12?(bound-prev.p[axis])/den:0));}
   if(cIn)result.push(cur);
  }
  return result;
 }
 function emitPoly(poly,out){if(poly.length<3)return;for(let k=1;k<poly.length-1;k++){
   const tri=[poly[0],poly[k],poly[k+1]];const a=tri[0].p,b=tri[1].p,c=tri[2].p;
   const ab=M.sub(b,a),ac=M.sub(c,a);
   if(Math.hypot(...M.cross(ab,ac))<1e-7)continue;
   for(const v of tri){out.p.push(...v.p);out.n.push(...v.n);out.uv.push(...v.uv)}
 }}
 function emptyBuffer(){return {p:[],n:[],uv:[]}}
 function splitTopTriangle(tri,rect,kept,cut){
  const planes=[[0,rect.x0,false],[0,rect.x1,true],[2,rect.z0,false],[2,rect.z1,true]];
  let rem=tri;
  for(const [axis,bound,less] of planes){
    emitPoly(clipPlane(rem,axis,bound,!less),kept);
    rem=clipPlane(rem,axis,bound,less);
    if(rem.length<3)return;
  }
  emitPoly(rem,cut);
 }
 function canCutTriangle(tri,area){
  const pts=tri.map(t=>t.p),yy=pts.map(p=>p[1]);
  if(Math.max(...yy)-Math.min(...yy)>.025)return false;
  if(Math.abs(yy[0]-area.y)>.035)return false;
  const norm=M.norm(M.cross(M.sub(pts[1],pts[0]),M.sub(pts[2],pts[0])));
  if(Math.abs(norm[1])<.92)return false;
  const xmin=Math.min(...pts.map(p=>p[0])),xmax=Math.max(...pts.map(p=>p[0])),zmin=Math.min(...pts.map(p=>p[2])),zmax=Math.max(...pts.map(p=>p[2]));
  return !(xmin>=area.x1||xmax<=area.x0||zmin>=area.z1||zmax<=area.z0);
 }
 function drawPolygonRegion(base,area){
  const kept=emptyBuffer(),cut=emptyBuffer();
  for(let i=0;i<base.p.length/3;i+=3){
   const tri=[vertex(base.p,base.n,base.uv,i),vertex(base.p,base.n,base.uv,i+1),vertex(base.p,base.n,base.uv,i+2)];
   if(canCutTriangle(tri,area))splitTopTriangle(tri,area,kept,cut);else emitPoly(tri,kept);
  }
  return {kept,cut};
 }
 function captureMesh(v,name,mat){if(v.p.length<9)return null;return makeMesh(name,new Float32Array(v.p),new Float32Array(v.uv),new Float32Array(v.n),mat);}
 function setupExtra(item,source,fragment){
  const w=item.x1-item.x0,d=item.z1-item.z0,cx=(item.x0+item.x1)/2,cz=(item.z0+item.z1)/2;
  let top=captureMesh(fragment,'Lift '+item.name+' / native deck',source.mesh.material);
  if(!top){top=boxMesh('Lift fallback top',[cx,item.y+.001,cz],[w,.002,d],source.mesh.material?.color||[.22,.25,.3,1]);item.fallback=true;}
  else item.fallback=false;
  const steel=[.64,.75,.82,1],joint=[.95,.72,.28,1],frameCol=[.14,.21,.28,1];
  const trim=[
   boxMesh('Flush rim / front',[cx,item.y+.007,item.z0],[w,.014,.028],frameCol),
   boxMesh('Flush rim / back',[cx,item.y+.007,item.z1],[w,.014,.028],frameCol),
   boxMesh('Flush rim / left',[item.x0,item.y+.007,cz],[.028,.014,d],frameCol),
   boxMesh('Flush rim / right',[item.x1,item.y+.007,cz],[.028,.014,d],frameCol)
  ];
  const cavity=boxMesh('Stage lift shadow',[cx,item.y-.025,cz],[w,.04,d],[.047,.059,.077,1]);
  // Permanently allocated rods & rails; only GPU model matrices change during playback.
  const braceWidth=lim(w*.04,.013,.048),scissor=[],rails=[],pins=[];
  const sideZ=[item.z0+Math.min(d*.16,.20),item.z1-Math.min(d*.16,.20)];
  for(let s=0;s<2;s++){
    for(let tier=0;tier<2;tier++)for(let rev=0;rev<2;rev++){
      const rodMesh=rod('Lift scissor X steel',[-.5,0,0],[.5,0,0],braceWidth,braceWidth,steel,10);
      scissor.push({mesh:rodMesh,side:s,tier,reverse:rev});
    }
    const base=boxMesh('Scissor bottom guide',[cx,item.y+.038,sideZ[s]],[w*.90,.055,.065],frameCol);
    const cap=boxMesh('Scissor moving guide',[cx,item.y+.038,sideZ[s]],[w*.90,.055,.065],frameCol);
    rails.push({mesh:base,moving:false},{mesh:cap,moving:true});
    for(let tier=0;tier<2;tier++){
      const pivot=ellipsoid('Scissor X pivot',[cx,item.y,sideZ[s]],[braceWidth*1.9,braceWidth*1.9,braceWidth*1.6],joint,12,8);
      pins.push({mesh:pivot,side:s,tier});
    }
  }
  const meshes=[top,...trim,cavity,...scissor.map(x=>x.mesh),...rails.map(x=>x.mesh),...pins.map(x=>x.mesh)];
  L.extras.set(item.id,{top,trim,cavity,scissor,rails,pins,meshes});
 }

 function reCut(){
  if(L.rebuilding)return;
  L.rebuilding=true;
  try{
   for(const v of L.cache.values())if(engine.stage.includes(v.mesh))resetCutMesh(v.mesh,v);
   destroyExtra();
   const grouped=new Map();
   for(const item of L.items){const mesh=engine.stage.find(m=>m.id===item.meshId||m.sourceKey&&m.sourceKey===item.sourceKey);
    if(!mesh){item.missing=true;continue;}item.missing=false;item.meshId=mesh.id;
    if(!grouped.has(mesh))grouped.set(mesh,[]);grouped.get(mesh).push(item);
   }
   for(const [mesh,items] of grouped){const src=getSource(mesh);let current=src,remaining;
    for(const item of items){const {kept,cut}=drawPolygonRegion(current,item);remaining=kept;
      setupExtra(item,src,cut);current={p:new Float32Array(remaining.p),n:new Float32Array(remaining.n),uv:new Float32Array(remaining.uv)};
    }
    if(remaining){engine.releaseMesh(mesh);mesh.p=new Float32Array(remaining.p);mesh.n=new Float32Array(remaining.n);mesh.uv=new Float32Array(remaining.uv);mesh.bounds=mesh.p.length?M.bbox(mesh.p):M.bbox(src.p);mesh.hidden=src.hidden;}
   }
   engine._stageBatchDirty=true;L.revision++;
  }finally{L.rebuilding=false;}
 }
 function liftLevel(item,time){
  if(!item.enabled)return 0;
  if(L.manual&&L.selected===item.id)return lim(L.manualHeight,0,item.rise);
  if(item.timeline===false)return 0;
  const t=time-item.start,up=Math.min(item.up,item.duration),hold=Math.min(item.hold,Math.max(0,item.duration-up)),down=Math.max(.05,item.duration-up-hold);
  if(t<0||t>=item.duration)return 0;
  if(t<up){const f=lim(t/Math.max(.05,up),0,1);return item.rise*f*f*(3-2*f);}
  if(t<up+hold)return item.rise;
  const f=lim((t-up-hold)/down,0,1);return item.rise*(1-f*f*(3-2*f));
 }
 function braceMatrix(a,b){
  const vx=b[0]-a[0],vy=b[1]-a[1],vz=b[2]-a[2],length=Math.max(.001,Math.hypot(vx,vy,vz));
  const mid=[(a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5];
  return M.mm(M.translate(mid),M.mm(M.rotate([0,0,1],Math.atan2(vy,vx)),M.trs([0,0,0],IDENTITY_Q,[length,1,1])));
 }
 function drawLifts(time){
  if(!isStageView())return;
  L.playhead=time;
  for(const item of L.items){
   if(!item.enabled||item.missing)continue;
   const geo=L.extras.get(item.id);if(!geo)continue;
   const h=liftLevel(item,time),w=item.x1-item.x0;
   geo.cavity.actorMatrix=null;engine.draw(geo.cavity,0);
   geo.top.actorMatrix=M.translate([0,h+.006,0]);engine.draw(geo.top,0);
   for(const m of geo.trim){m.actorMatrix=null;engine.draw(m,0)}
   if(h>.045){
     const cx=(item.x0+item.x1)*.5,margin=Math.min(w*.13,.22),xLeft=item.x0+margin,xRight=item.x1-margin;
     const tiers=item.rise>=1.6?2:1;
     for(const entry of geo.scissor){
       if(entry.tier>=tiers)continue;
       const z=entry.side===0?item.z0+Math.min((item.z1-item.z0)*.16,.20):item.z1-Math.min((item.z1-item.z0)*.16,.20);
       const y0=item.y+(entry.tier/tiers)*h+.06;
       const y1=item.y+((entry.tier+1)/tiers)*h-.065;
       if(y1<=y0+.02)continue;
       const a=[entry.reverse?xRight:xLeft,y0,z],b=[entry.reverse?xLeft:xRight,y1,z];
       entry.mesh.actorMatrix=braceMatrix(a,b);engine.draw(entry.mesh,0);
     }
     for(const r of geo.rails){r.mesh.actorMatrix=r.moving?M.translate([0,h,0]):null;engine.draw(r.mesh,0)}
     for(const p of geo.pins){if(p.tier>=tiers)continue;p.mesh.actorMatrix=M.translate([0,h*(p.tier+.5)/tiers,0]);engine.draw(p.mesh,0)}
   }
   if(L.selected===item.id){const el=$('liftNow124');if(el)el.textContent=fmtLift(h)+' m';}
  }
 }

 const priorDrawCast=StageEngine.prototype.drawCast;
 StageEngine.prototype.drawCast=function(t){priorDrawCast?.call(this,t);if(this===engine)drawLifts(t)};
 const priorCastMatrix=castMatrix;
 castMatrix=function(person,node,time){let mat=priorCastMatrix(person,node,time);if(!person||person.type==='audience')return mat;
  const pos=(typeof routePose11==='function'?routePose11(person,time)?.pos:null)||person.pos;
  for(const l of L.items){if(!l.enabled||l.missing)continue;
    if(pos[0]>l.x0+.05&&pos[0]<l.x1-.05&&pos[2]>l.z0+.05&&pos[2]<l.z1-.05&&Math.abs(pos[1]-l.y)<.65){
      const h=liftLevel(l,time);if(h>.001)mat=M.mm(M.translate([0,h,0]),mat);break;
    }
  }return mat;
 };
 function pointAtPlane(e,y){
  if(!engine.vp)return null;const rect=engine.canvas.getBoundingClientRect(),nx=(e.clientX-rect.left)/rect.width*2-1,ny=1-(e.clientY-rect.top)/rect.height*2;
  const inv=M.inverse(engine.vp),a=M.point(inv,[nx,ny,-1]),b=M.point(inv,[nx,ny,1]),delta=M.sub(b,a);
  if(Math.abs(delta[1])<1e-6)return null;const u=(y-a[1])/delta[1];if(u<0)return null;return M.add(a,M.mul(delta,u));
 }
 function pickDeck(e){const hit=engine.pick(e.clientX,e.clientY,false);
  if(!hit||!hit.mesh||Math.abs(hit.normal[1])<.78)return null;
  if(!engine.stage.includes(hit.mesh))return null;
  return {point:hit.point,mesh:hit.mesh,y:hit.point[1]};
 }
 function cancelDraw(){L.drawing=false;L.drag=null;L.anchor=null;const tip=$('liftMini124');if(tip)tip.hidden=true;drawUI();}
 function beginDraw(){if(engine.view!=='stage'){engine.view='stage';renderUI()}L.drawing=true;L.anchor=null;L.drag=null;L.mouse=null;openLiftPanel();drawUI();toast('Kéo chuột trên mặt sàn để khoanh vùng nâng. Hoặc click hai góc.');}
 function addLift(x0,z0,x1,z1,src){
  const rect={x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1)};
  if(rect.x1-rect.x0<.20||rect.z1-rect.z0<.20){toast('Vùng nâng phải rộng và sâu ít nhất 20 cm.');return null;}
  for(const it of L.items)if(Math.min(it.x1,rect.x1)-Math.max(it.x0,rect.x0)>.015&&Math.min(it.z1,rect.z1)-Math.max(it.z0,rect.z0)>.015&&Math.abs(it.y-src.y)<.10){toast('Vùng nâng bị chồng lên vùng khác. Hãy chọn khoảng không giao nhau.');return null;}
  const mesh=src.mesh;if(!mesh||!engine.stage.includes(mesh))return null;
  try{checkpoint()}catch(_){}
  const item={id:uidLift(),name:'BÀN NÂNG '+(L.items.length+1),meshId:mesh.id,sourceKey:mesh.sourceKey||'',y:src.y,...rect,rise:.85,start:1.0,duration:6,up:2,hold:2,timeline:false,enabled:true,fallback:false};
  L.items.push(item);L.selected=item.id;L.manual=false;getSource(mesh);reCut();cancelDraw();renderPanel();renderSequence();toast('Đã khoanh vùng bàn nâng chữ X. Bấm “+ Đặt vào Timeline” để lập cue nâng/hạ.');return item;
 }
 function endRect(e,src,finishPoint){if(!src||!finishPoint)return;
  const mesh=src.mesh,b=mesh.bounds;
  const x0=lim(src.point[0],b.min[0],b.max[0]),x1=lim(finishPoint[0],b.min[0],b.max[0]),z0=lim(src.point[2],b.min[2],b.max[2]),z1=lim(finishPoint[2],b.min[2],b.max[2]);
  addLift(x0,z0,x1,z1,src);
 }
 function handleDown(e){if(!L.drawing||!isStageView()||e.button!==0)return;
  const src=L.anchor||pickDeck(e);
  if(!src){toast('Hãy khoanh trên mặt phẳng sàn thật của sân khấu, không chọn vách LED.');e.stopImmediatePropagation();return;}
  if(!L.anchor)L.anchor=src;
  L.drag={source:src,down:[e.clientX,e.clientY],last:[e.clientX,e.clientY]};
  engine.canvas.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopImmediatePropagation();
 }
 function handleMove(e){if(!L.drawing||!L.drag)return;L.drag.last=[e.clientX,e.clientY];L.mouse=pointAtPlane(e,L.drag.source.y);e.preventDefault();e.stopImmediatePropagation();}
 function handleUp(e){if(!L.drawing||!L.drag)return;const cur=L.drag,pt=pointAtPlane(e,cur.source.y),pixels=Math.hypot(e.clientX-cur.down[0],e.clientY-cur.down[1]);
  if(pixels>=9){endRect(e,cur.source,pt);}else if(L.anchor&&cur.source!==L.anchor){endRect(e,L.anchor,pt);}else if(L.anchor&&cur.source===L.anchor){
    // Second click at different location completes the rectangle.
    if(Math.hypot(...M.sub(cur.source.point,pt))>.20)endRect(e,L.anchor,pt);
    else if(L.anchor._armed)endRect(e,L.anchor,pt);
    else L.anchor._armed=true;
  }
  L.drag=null;L.mouse=null;e.preventDefault();e.stopImmediatePropagation();
 }
 function handleClickFallback(e){if(!L.drawing||L.drag)return;const hit=L.anchor||pickDeck(e);if(!hit)return;
  const p=pointAtPlane(e,hit.y);if(!L.anchor){L.anchor=hit;return;}
  if(p&&Math.hypot(p[0]-hit.point[0],p[2]-hit.point[2])>.2)endRect(e,hit,p);
 }
 engine.canvas.addEventListener('pointerdown',handleDown,true);
 engine.canvas.addEventListener('pointermove',handleMove,true);
 engine.canvas.addEventListener('pointerup',handleUp,true);
 engine.canvas.addEventListener('pointercancel',()=>{L.drag=null;L.mouse=null;},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&L.drawing){e.stopPropagation();cancelDraw();} },true);
 const baseRenderOverlays=renderOverlays;
 renderOverlays=function(){baseRenderOverlays();if(!isStageView()||state.presenting)return;const canvas=$('mapOverlay'),g=canvas.getContext('2d'),factor=canvas.width/(engine.canvas.clientWidth||1);
  const outline=(rect,color,fill=false)=>{const pts=[[rect.x0,rect.y,rect.z0],[rect.x1,rect.y,rect.z0],[rect.x1,rect.y,rect.z1],[rect.x0,rect.y,rect.z1]];
   const ps=pts.map(p=>engine.project(p));if(ps.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))return;g.save();g.scale(factor,factor);g.lineWidth=2;g.strokeStyle=color;g.fillStyle='#27c6d329';g.setLineDash([8,4]);g.beginPath();ps.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();if(fill)g.fill();g.stroke();g.restore();};
  for(const lift of L.items)outline(lift,L.selected===lift.id?'#7afbff':'#42b0ce',L.selected===lift.id);
  if(L.drawing&&L.anchor&&(L.mouse||L.drag)){const p=L.mouse||(L.drag?pointAtPlane({clientX:L.drag.last[0],clientY:L.drag.last[1]},L.anchor.y):null);
   if(p)outline({x0:Math.min(L.anchor.point[0],p[0]),x1:Math.max(L.anchor.point[0],p[0]),z0:Math.min(L.anchor.point[2],p[2]),z1:Math.max(L.anchor.point[2],p[2]),y:L.anchor.y},'#ffe69a',true);
  }
 };
 const numberField=(id,label,value,min,max,step=.1)=>`<label>${label}<input id="${id}" type="number" value="${fmtLift(value,step<.1?2:1)}" min="${min}" max="${max}" step="${step}"></label>`;
 function panelMarkup(){const selected=byId(L.selected);let html=`<div class="lift-h"><div><b><span style="color:#6be7f1">╳</span> BÀN NÂNG CHỮ X</b><small>SCISSOR LIFT / STAGE SURFACE</small></div><button id="liftClose124">×</button></div><div class="lift-b"><div class="lift-actions"><button class="primary ${L.drawing?'on':''}" id="liftDraw124">${L.drawing?'Đang chọn sàn...':'+ Khoanh vùng sàn'}</button><button id="liftCancel124" ${!L.drawing?'disabled':''}>Hủy</button></div><div class="lift-info">Kéo chuột trên <b>mặt sàn của model 3D</b> để khoanh vùng nâng. Không cần thêm tiết mục hay tạo một bục đặt lên sàn.</div>`;
  html+=`<div class="lift-list">${L.items.map(item=>`<button data-select-lift="${safeId(item.id)}" class="${L.selected===item.id?'active':''}"><strong>${esc(item.name)}</strong> · ${fmtLift(item.x1-item.x0)} × ${fmtLift(item.z1-item.z0)}m${item.fallback?' · mặt sàn thay thế':''}${item.missing?' · thiếu model':''}</button>`).join('')||'<span style="font-size:10px;color:#7298a9">Chưa có vùng bàn nâng nào.</span>'}</div>`;
  if(selected){html+=`<div class="lift-divider"></div><label>Tên vùng sàn<input id="liftName124" maxlength="42" value="${esc(selected.name)}"></label><div class="lift-grid">${numberField('liftX124','Tọa độ X',selected.x0,-10000,10000,.01)}${numberField('liftZ124','Tọa độ Z',selected.z0,-10000,10000,.01)}${numberField('liftW124','Rộng (m)',selected.x1-selected.x0,.2,30,.05)}${numberField('liftD124','Sâu (m)',selected.z1-selected.z0,.2,30,.05)}${numberField('liftRise124','Cao nâng (m)',selected.rise,0,5,.05)}${numberField('liftStart124','Start time (s)',selected.start,0,600,.05)}${numberField('liftUp124','Thời gian nâng (s)',selected.up,.1,30,.1)}${numberField('liftHold124','Giữ ở trên (s)',selected.hold,0,60,.1)}${numberField('liftDown124','Thời gian hạ (s)',Math.max(.1,selected.duration-selected.up-selected.hold),.1,30,.1)}</div>`;
   html+=`<div class="lift-actions"><button class="primary" id="liftApply124">Áp dụng</button><button id="liftDelete124">Xóa vùng</button></div><div class="lift-actions lift-cue-actions125"><button id="liftToTimeline125" class="lift-cta">${selected.timeline===false?'+ Đặt vào Timeline':'↗ Đến Timeline'}</button><button id="liftRemoveTimeline125" ${selected.timeline===false?'disabled':''}>Bỏ cue</button></div><p class="lift-status">${selected.timeline===false?'Chưa đặt timecode. Dùng “Xem cao thủ công” để thử trước, rồi bấm “+ Đặt vào Timeline”.':`Đã đặt trên timeline tại ${fmtLift(selected.start)}s · dài ${fmtLift(selected.duration)}s. Kéo clip chữ X để thay đổi giờ chạy.`}</p><label class="lift-row-check"><input id="liftEnable124" type="checkbox" ${selected.enabled?'checked':''}> Bật vùng sàn nâng</label><label class="lift-row-check"><input id="liftManual124" type="checkbox" ${L.manual?'checked':''}> Xem cao thủ công (tắt để theo timecode)</label><label>Độ cao thử <b id="liftNow124">${fmtLift(liftLevel(selected,state.time))}m</b><input id="liftPreview124" type="range" min="0" max="${selected.rise}" step=".01" value="${L.manual?L.manualHeight:0}" ${!L.manual?'disabled':''}></label><div class="lift-track"><div class="lift-bar" style="left:0;width:100%"></div></div><div class="lift-info">Timecode: ${fmtLift(selected.start)}s → ${fmtLift(selected.start+selected.duration)}s. Khi phát show, sàn tự nâng → giữ → hạ. Mở SHOW Timeline để kéo đoạn nâng/hạ như một track riêng.</div>`;
  }
  html+='<div class="lift-foot">Mô phỏng 3D cho duyệt thiết kế. Phần cắt chỉ áp dụng cho mặt phẳng ngang của mesh; kết cấu nâng/hạ, tải trọng và an toàn thiết bị thật cần đơn vị kỹ thuật kiểm tra.</div></div>';return html;
 }
 function panel(){let host=$('stageLift124');if(!host){host=document.createElement('aside');host.id='stageLift124';document.querySelector('.right-panel').appendChild(host);}return host;}
 function drawUI(){const mini=$('liftMini124');if(mini){mini.hidden=!L.drawing;mini.textContent=L.drawing?'Kéo chuột trên mặt sàn → khoanh vùng nâng · ESC để hủy':'';}}
 function renderPanel(){const host=panel();document.body.classList.toggle('lift-dock-open',L.open&&!state.presenting);host.hidden=!L.open||state.presenting;if(!L.open||state.presenting)return;host.innerHTML=panelMarkup();
  $('liftClose124').onclick=()=>{L.open=false;cancelDraw();renderPanel()};
  $('liftDraw124').onclick=beginDraw;$('liftCancel124').onclick=cancelDraw;
  host.querySelectorAll('[data-select-lift]').forEach(b=>b.onclick=()=>{L.selected=b.dataset.selectLift;L.manual=false;renderPanel()});
  const item=byId(L.selected);if(!item)return;
  $('liftToTimeline125').onclick=()=>{
   try{checkpoint()}catch(_){}
   if(item.timeline===false){item.timeline=true;item.start=lim(state.time,0,600);const targetEnd=item.start+item.duration;if(targetEnd>600){item.start=Math.max(0,600-item.duration);}state.duration=Math.min(600,Math.max(state.duration,item.start+item.duration));}
   L.manual=false;toggleSequence(true);if(!seq.enabled)enableSequence(true);renderPanel();renderSequence();toast('Đã đặt cue bàn nâng chữ X vào timeline. Kéo clip để chỉnh thời điểm.');
  };
  $('liftRemoveTimeline125').onclick=()=>{try{checkpoint()}catch(_){}item.timeline=false;L.manual=false;renderPanel();renderSequence();toast('Đã bỏ cue khỏi timeline, không xóa vùng sàn.');};
  $('liftName124').onchange=e=>{item.name=e.target.value.trim().slice(0,42)||item.name;renderSequence()};
  $('liftEnable124').onchange=e=>{item.enabled=e.target.checked;renderSequence()};
  $('liftManual124').onchange=e=>{L.manual=e.target.checked;L.manualHeight=0;renderPanel()};
  $('liftPreview124').oninput=e=>{L.manualHeight=lim(e.target.value,0,item.rise);const label=$('liftNow124');if(label)label.textContent=fmtLift(L.manualHeight)+' m'};
  $('liftApply124').onclick=()=>{
   const x=Number($('liftX124').value),z=Number($('liftZ124').value),w=Number($('liftW124').value),d=Number($('liftD124').value),rise=Number($('liftRise124').value),start=Number($('liftStart124').value),up=Number($('liftUp124').value),hold=Number($('liftHold124').value),down=Number($('liftDown124').value);
   if(![x,z,w,d,rise,start,up,hold,down].every(Number.isFinite)||w<.20||d<.20||up<=0||down<=0){toast('Thông số vùng sàn hoặc timecode không hợp lệ.');return;}
   const others=L.items.filter(a=>a.id!==item.id);
   if(others.some(a=>a.y===item.y&&Math.min(a.x1,x+w)-Math.max(a.x0,x)>.03&&Math.min(a.z1,z+d)-Math.max(a.z0,z)>.03)){toast('Vùng mới chồng lên một bàn nâng khác.');return;}
   try{checkpoint()}catch(_){}
   Object.assign(item,{x0:x,x1:x+w,z0:z,z1:z+d,rise:lim(rise,0,5),start:lim(start,0,600),up:lim(up,.1,30),hold:lim(hold,0,60),duration:lim(up,.1,30)+lim(hold,0,60)+lim(down,.1,30)});
   L.manualHeight=lim(L.manualHeight,0,item.rise);reCut();renderPanel();renderSequence();toast('Đã cập nhật vùng sàn và cue nâng/hạ.');
  };
  $('liftDelete124').onclick=()=>{try{checkpoint()}catch(_){}L.items=L.items.filter(l=>l.id!==item.id);L.selected=L.items[0]?.id||null;L.manual=false;reCut();renderPanel();renderSequence();toast('Đã xóa vùng nâng và khôi phục sàn gốc.')};
 }
 function openLiftPanel(){if(state.presenting){toast('Hãy trở về chế độ chỉnh sửa trước khi đặt bàn nâng.');return;}L.open=true;renderPanel()}
 function injectToolbar(){const bar=document.querySelector('.dir-toolbar')||document.querySelector('.workflow-right')||document.querySelector('.navigation-strip');if(bar&&!$('v124LiftBtn')){
  const b=document.createElement('button');b.id='v124LiftBtn';b.type='button';b.className='btn small';b.innerHTML='╳ Bàn nâng chữ X';b.title='Khoanh một vùng trên sàn sân khấu hiện có';b.onclick=openLiftPanel;bar.appendChild(b);
 }
  const nav=document.querySelector('.view-actions');if(nav&&!$('v125LiftNav')){const b=document.createElement('button');b.className='btn small';b.id='v125LiftNav';b.textContent='╳ Bàn nâng';b.title='Mở bảng điều khiển bàn nâng chữ X';b.onclick=openLiftPanel;nav.appendChild(b);}
  const viewport=$('viewport');if(viewport&&!$('liftMini124')){const h=document.createElement('div');h.id='liftMini124';h.hidden=true;viewport.appendChild(h)};
 }
 const priorRenderUI=renderUI;
 renderUI=function(){const result=priorRenderUI();injectToolbar();if(L.open)renderPanel();return result};
 const priorRenderSequence=renderSequence;
 function attachLiftShortcut(){const foot=document.querySelector('.seq-footer');if(!foot||$('seqAddLift125'))return;const b=document.createElement('button');b.type='button';b.className='btn';b.id='seqAddLift125';b.textContent='+ Bàn nâng X';b.onclick=()=>{const current=byId(L.selected)||L.items.find(x=>x.timeline===false);L.selected=current?.id||null;openLiftPanel();if(!current)beginDraw();};foot.prepend(b)}
 renderSequence=function(){const result=priorRenderSequence();if(!seq.open)return result;const inner=$('seqInner');if(!inner)return result;
  attachLiftShortcut();const line=inner.querySelector('#seqLine');const barW=Math.max(400,state.duration*seq.pps);const extra=document.createElement('div');extra.id='liftTracks124';extra.innerHTML=L.items.filter(l=>l.timeline!==false).map(l=>`<div class="seq-row"><div class="seq-label"><button data-lift-mute="${l.id}">${l.enabled?'ON':'M'}</button><b>▰ ${esc(l.name)}</b><button data-lift-edit="${l.id}">⚙</button></div><div class="seq-lane" style="width:${barW}px;--beat-width:${60/seq.bpm*seq.pps}px"><button class="seq-clip v124-lift-clip v125-lift-clip" data-lift-clip="${l.id}" style="left:${l.start*seq.pps}px;width:${Math.max(10,l.duration*seq.pps)}px"><i class="trim left" data-trim="left"></i>${esc(l.name)} · Nâng → Giữ → Hạ<i class="trim right" data-trim="right"></i></button></div></div>`).join('');
  if(line)inner.insertBefore(extra,line);else inner.appendChild(extra);
  extra.querySelectorAll('[data-lift-edit]').forEach(b=>b.onclick=()=>{L.selected=b.dataset.liftEdit;openLiftPanel()});
  extra.querySelectorAll('[data-lift-mute]').forEach(b=>b.onclick=()=>{const it=byId(b.dataset.liftMute);if(it)it.enabled=!it.enabled;renderSequence()});
  extra.querySelectorAll('[data-lift-clip]').forEach(el=>{el.onpointerdown=e=>{
   if(e.button!==0)return;e.preventDefault();e.stopPropagation();const item=byId(el.dataset.liftClip);if(!item)return;const mode=e.target.dataset.trim||'move',sx=e.clientX,init={start:item.start,duration:item.duration,up:item.up,hold:item.hold,down:Math.max(.1,item.duration-item.up-item.hold)};
   el.setPointerCapture?.(e.pointerId);
   el.onpointermove=ev=>{const dt=(ev.clientX-sx)/seq.pps;
    if(mode==='move'){item.start=lim(seq.snap?snapTime(init.start+dt):init.start+dt,0,600);el.style.left=item.start*seq.pps+'px';}
    else if(mode==='right'){item.hold=Math.max(0,init.hold+dt);item.duration=item.up+item.hold+init.down;el.style.width=item.duration*seq.pps+'px';}
    else {const shift=lim(dt,-init.start,Math.max(0,init.hold));item.start=init.start+shift;item.hold=Math.max(0,init.hold-shift);item.duration=item.up+item.hold+init.down;el.style.left=item.start*seq.pps+'px';el.style.width=item.duration*seq.pps+'px';}
   };
   el.onpointerup=()=>{el.onpointermove=null;el.onpointerup=null;renderSequence();if(L.open)renderPanel()};
  };el.ondblclick=()=>{L.selected=el.dataset.liftClip;openLiftPanel()};});
  return result;
 };
 // Project persistence. The stage file itself remains untouched; cuts are regenerated from saved rectangles.
 const basePack=packLiveExtras;
 packLiveExtras=async function(){const data=await basePack();data.stageLift124={version:1,items:structuredClone(L.items)};return data};
 const baseRestore=restoreLiveExtras;
 restoreLiveExtras=async function(data){discardCache(true);L.items=[];L.selected=null;await baseRestore(data);
  const raw=data?.stageLift124?.items||[];L.items=Array.isArray(raw)?raw.slice(0,12).filter(it=>Number.isFinite(it.x0)&&Number.isFinite(it.x1)&&Number.isFinite(it.z0)&&Number.isFinite(it.z1)&&Number.isFinite(it.y)).map(it=>({...it,id:String(it.id||uidLift()),enabled:it.enabled!==false})):[];
  L.selected=L.items[0]?.id||null;reCut();renderPanel();renderSequence();
 };
 const baseSnapshot=snapshot;
 snapshot=function(){const d=baseSnapshot();d.stageLift124={version:1,items:structuredClone(L.items)};return d};
 const baseRestoreSnapshot=restore;
 restore=function(d){discardCache(true);L.items=[];baseRestoreSnapshot(d);const items=d?.stageLift124?.items||[];L.items=Array.isArray(items)?structuredClone(items):[];L.selected=L.items[0]?.id||null;reCut();renderPanel();renderSequence()};
 // Clear existing surface cuts before stage/project replacement.
 const baseImport=importModel;
 importModel=async function(...args){const previousModel=state.model;const out=await baseImport(...args);if(state.model!==previousModel){discardCache(false);L.items=[];L.selected=null;}renderPanel();return out};
 const baseDemo=demo;
 demo=function(...args){discardCache(true);L.items=[];L.selected=null;const out=baseDemo(...args);renderPanel();return out};
 // GLB coordinate calibration invalidates the previous cut vertex buffers, so rebuild with the same metric transform.
 const priorCoordinate=applyCoordinateConfig;
 applyCoordinateConfig=function(config,options){
  const previous=[...(engine.coordinates.matrix||M.identity())];discardCache(true);
  const out=priorCoordinate(config,options);
  if(L.items.length){const delta=M.mm(engine.coordinates.matrix,M.inverse(previous)),ratio=(engine.coordinates.config.scale/(config?.scale||engine.coordinates.config.scale))||1;
   for(const item of L.items){const a=M.point(delta,[item.x0,item.y,item.z0]),b=M.point(delta,[item.x1,item.y,item.z1]);
     item.x0=Math.min(a[0],b[0]);item.x1=Math.max(a[0],b[0]);item.z0=Math.min(a[2],b[2]);item.z1=Math.max(a[2],b[2]);item.y=a[1];
   }reCut();
  }return out;
 };
 injectToolbar();renderPanel();window.STUDIO.version='1.2.5'; const brand=document.querySelector('.brand small');if(brand)brand.textContent='V12.5 / SCISSOR LIFT';
 window.STUDIO.stageLift={
  get items(){return L.items},get selected(){return byId(L.selected)},get debug(){return {drawing:L.drawing,anchor:L.anchor&&{point:L.anchor.point,y:L.anchor.y,mesh:L.anchor.mesh?.name},drag:L.drag&&{down:L.drag.down,last:L.drag.last},mouse:L.mouse}},open:openLiftPanel,draw:beginDraw,add:addLift,
  height:liftLevel,pointAt:pointAtPlane,addCue(id,time=state.time){const item=byId(id);if(!item)return false;item.timeline=true;item.start=lim(time,0,600);state.duration=Math.min(600,Math.max(state.duration,item.start+item.duration));renderSequence();return true},removeCue(id){const item=byId(id);if(!item)return false;item.timeline=false;renderSequence();return true},delete(id){L.items=L.items.filter(x=>x.id!==id);reCut();renderPanel()},rebuild:reCut,statistics:()=>({lifts:L.items.length,cutMeshes:L.cache.size,geometryLifts:L.extras.size})
 };
})();
