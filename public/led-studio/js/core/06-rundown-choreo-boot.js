/* V10: bounded preview playback, LED effects, cast detail and audio headroom.
   User geometry / pixel coordinates are never modified by this module. */
const stage10={version:1,scenes:[],selectedScene:null,range:null,detail:'high',castFill:.30,
 ledVisible:true,lightVisible:true,clearFloor:false,audio:{master:.85,video:1,music:1,room:0},
 fx:{rollX:0,rollY:0,rotate:0,mirror:0,invert:0,rgb:0,pulse:0},fxOpen:false,mixerOpen:false,
 flashUntil:0,loopCount:0,playbackStatus:'ready',previewTime:0};
const rt10={evaluated:0,lastSources:'',prewarmAt:0,building:false,lite:false,graph:null,hiddenWasPlaying:false,lastTelemetry:0,notes:[]};
const BASE10={draw:StageEngine.prototype.draw,render:StageEngine.prototype.render,texture:StageEngine.prototype.texture,
 lightUniforms:StageEngine.prototype.lightUniforms,sequenceSurface,applyLiveUniforms,ensureAudioContext,routeAudio,
 packLiveExtras,restoreLiveExtras,snapshot,restore,importModel,demo,loadProject,seekTimeline,setPlaying,enableSequence,
 castMatrix,buildHuman,ellipsoid,actState8,addActClip8,renderUI,renderSequence,updateStableControls,togglePresentation,
 openAudioPanel,resetSeq,clearRuntime,syncSeqVideo};
function stageData10(){return structuredClone({version:1,scenes:stage10.scenes,selectedScene:stage10.selectedScene,
 detail:stage10.detail,castFill:stage10.castFill,audio:stage10.audio});}
function restoreStage10(data){
 stage10.scenes=(Array.isArray(data?.scenes)?data.scenes:[]).slice(0,80).filter(s=>Number.isFinite(+s.start)&&Number.isFinite(+s.duration)).map(s=>({id:String(s.id||uid('scene')),name:String(s.name||'Scene').slice(0,64),start:clamp(+s.start,0,599.95),duration:clamp(+s.duration,.05,600-clamp(+s.start,0,599.95)),actId:s.actId?String(s.actId):null,clipIds:(s.clipIds||[]).filter(id=>seq.clips.some(c=>c.id===id)),color:/^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#6f86dc'}));
 stage10.selectedScene=stage10.scenes.some(s=>s.id===data?.selectedScene)?data.selectedScene:null;
 stage10.range=null;stage10.ledVisible=true;stage10.lightVisible=true;stage10.detail=['standard','high'].includes(data?.detail)?data.detail:'high';stage10.castFill=clamp(Number(data?.castFill??.30),0,.6);
 const a=data?.audio||{};stage10.audio={master:clamp(Number(a.master??live.volume??.85),0,2),video:clamp(Number(a.video??live.videoVolume??1),0,2),music:clamp(Number(a.music??live.musicVolume??1),0,2),room:clamp(Number(a.room??0),0,.4)};
 live.volume=stage10.audio.master;live.videoVolume=stage10.audio.video;live.musicVolume=stage10.audio.music;
 resetFX10(false);rebuildCast();rebuildActCache();syncMixer10();
}
packLiveExtras=async function(){const data=await BASE10.packLiveExtras();data.stage10=stageData10();return data;};
restoreLiveExtras=async function(data){await BASE10.restoreLiveExtras(data);restoreStage10(data?.stage10);renderUI();};
snapshot=function(){const data=BASE10.snapshot();data.stage10=stageData10();return data;};
restore=function(data){BASE10.restore(data);restoreStage10(data.stage10);renderUI();};
resetSeq=function(){BASE10.resetSeq();stage10.scenes=[];stage10.selectedScene=null;stage10.range=null;};
clearRuntime=function(){rt10.lastSources='';BASE10.clearRuntime();};
sequenceSurface=function(base,c,t){const s=BASE10.sequenceSurface(base,c,t);s._contentTime=Math.max(0,(t-c.start)*(c.rate||1)+(c.in||0));return s;};
StageEngine.prototype.texture=function(source){
 if(source instanceof HTMLVideoElement&&source.readyState<2){const cache=this.texCache.get(source);if(cache?.uploaded)return cache.tex;
  if(!this._black10){const c=document.createElement('canvas');c.width=c.height=2;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,2,2);this._black10=c;}
  return BASE10.texture.call(this,this._black10);
 }return BASE10.texture.call(this,source);
};
// One decoder for each (clip, source), including looks with different videos on different LEDs.
const CLIP_VIDEO10=clipVideo,DISPOSE_VIDEO10=disposeDecoder;
clipVideo=function(c,a){let key=c.id;const existing=sq.decoders.get(key);if(existing&&existing.original!==a.id)key=c.id+'::'+a.id;const r=CLIP_VIDEO10({...c,id:key},a);r.clipId=c.id;r.runtimeKey10=key;return r;};
disposeDecoder=function(id){const keys=[...sq.decoders].filter(([key,a])=>key===id||a.clipId===id).map(([key])=>key);for(const key of keys)DISPOSE_VIDEO10(key);};
function warmVideos10(now){
 if(!seq.enabled||now-rt10.prewarmAt<500)return;rt10.prewarmAt=now;
 const playing=new Set([...sq.desired.values()].map(v=>v.a.runtimeKey10||v.c.id));let count=0;
 for(const c of seq.clips.filter(c=>c.start>=state.time&&c.start<state.time+2).sort((a,b)=>a.start-b.start)){
  const a=engine.media.get(c.source),tr=seq.tracks.find(t=>t.id===c.track);
  if(a?.type!=='video'||tr?.type!=='visual'||tr.muted||count>=2)continue;
  const d=clipVideo(c,a),v=d.element;playing.add(d.runtimeKey10||c.id);count++;
  if(v.readyState>=1&&!d.prepared10&&!v.seeking){try{v.currentTime=clamp(c.in||0,0,Math.max(0,a.duration-.03));d.prepared10=true;}catch(e){}}
 }
 if(sq.decoders.size>6)for(const id of [...sq.decoders.keys()])if(!playing.has(id)&&sq.decoders.size>6)disposeDecoder(id);
}
function updateRange10(){
 if(!stage10.range||!state.playing)return;
 const r=stage10.range;if(state.time>=r.end){
  if(r.loop){state.time=r.start+(state.time-r.start)%Math.max(.05,r.end-r.start);stage10.loopCount++;invalidateSeq();syncVideos(true);}
  else{state.time=Math.max(r.start,r.end-1/Math.max(30,lighting9.frameRate));setPlaying(false);syncVideos(true);}
 }
}
seekTimeline=function(value){BASE10.seekTimeline(value);rt10.lastSources='';if(stage10.range&&(state.time<stage10.range.start||state.time>=stage10.range.end)){stage10.range=null;updateStageUI10();}};
function seekWithin10(value){const range=stage10.range;BASE10.seekTimeline(value);stage10.range=range;rt10.lastSources='';}
StageEngine.prototype.lightUniforms=function(t){
 if(this===engine&&!stage10.lightVisible){const old=this.lights;this.lights=[];try{BASE10.lightUniforms.call(this,t);this.uniform('uLightCount',0,'i');}finally{this.lights=old;}return;}
 return BASE10.lightUniforms.call(this,t);
};
// Single reusable cone, same physical cone angle as the surface lighting pass.
StageEngine.prototype.makeBeam=function(light){
 this.selectPass(2);if(!this._cone10){const p=[],n=[],uv=[],N=24;
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2;
   for(const [theta,y]of [[a,0],[a,1],[b,1],[a,0],[b,1],[b,0]]){p.push(Math.cos(theta),y,Math.sin(theta));n.push(Math.cos(theta),-.2,Math.sin(theta));uv.push(theta/(2*Math.PI),y);}}
  this._cone10=makeMesh('Shared beam V10',p,uv,n,{color:[1,1,1,1]});
 }
 const d=light._direction||M.norm(M.sub(light.target,light.pos)),origin=light.pos,len=clamp(light.beamLength||Math.hypot(...M.sub(light._target||light.target,origin)),.05,1000),radius=Math.max(.004,Math.tan(clamp(light.angle||12,1,60)*Math.PI/180)*len),right=M.norm(M.cross(d,Math.abs(d[1])>.95?[1,0,0]:[0,1,0])),up=M.cross(right,d);
 // The shader narrows the origin to the physical aperture via uBeamAperture10.
 this.uniform('uBeamMatrix',new Float32Array([right[0]*radius,right[1]*radius,right[2]*radius,0,d[0]*len,d[1]*len,d[2]*len,0,up[0]*radius,up[1]*radius,up[2]*radius,0,...origin,1]),'m');
 this.uniform('uBeamAperture10',clamp((light.aperture||.025)/radius,.001,1));
 this.gl.uniformMatrix3fv(this.loc('uBeamNormal'),false,new Float32Array([...right.map(v=>v/radius),...d.map(v=>v/len),...up.map(v=>v/radius)]));
 this._cone10.material.color=[...hexrgb(light.color),1];return this._cone10;
};
StageEngine.prototype.draw=function(mesh,mode=0,s=null,opacity=1){
 if(this===engine){if(mode===1&&!stage10.ledVisible)return;if(mode===2&&!stage10.lightVisible)return;}
 if(mode===1){const effective=this===engine&&seq.enabled?(sq.effective.get(s?.id)||s):s;
  this.selectPass(1);this.uniform('uContentTime10',effective?._contentTime??stage10.previewTime);
 }
 const actor=mode===0&&mesh.actorMatrix;
 if(actor){this.selectPass(0);this.uniform('uCastFill10',stage10.castFill);}else if(mode===0){this.selectPass(0);this.uniform('uCastFill10',0);}
 return BASE10.draw.call(this,mesh,mode,s,opacity);
};
StageEngine.prototype.render=function(t=0,options={}){
 if(this!==engine)return BASE10.render.call(this,t,options);
 stage10.previewTime=t;
 if(seq.enabled){evaluateSequence(t);const key=[...sq.desired.values()].map(d=>d.a.id).join('|');
  if(key!==rt10.lastSources){rt10.lastSources=key;syncSeqVideo(true);syncMusic(true);routeAudio();}
  warmVideos10(performance.now());
 }
 const result=BASE10.render.call(this,t,options);rt10.evaluated++;
 return result;
};
function resetPreview10(){
 checkpoint();engine.globalTest=false;live.transition=null;live.queue=null;lighting9.preview=null;stage10.range=null;stage10.ledVisible=stage10.lightVisible=true;
 resetFX10(false);engine.settings.beam=Math.max(.45,engine.settings.beam||0);director.cameraFollow=false;state.orbit=false;director.mode='navigate';director.candidatePreview=null;engine.view='stage';engine.showGuides=false;
 clearRuntime();invalidateSeq();cameraPreset8('hero',engine.surfaces.length?'led':'stage');syncVideos(true);renderUI();toast('Da khoi phuc preview LED + den. Khong doi mapping / vi tri.');
}
function viewStage10(kind){
 if(kind==='stage'){engine.view='stage';stage10.ledVisible=stage10.lightVisible=true;}
 else if(kind==='led'){engine.view='solo';if(!engine.selected)engine.selected=engine.surfaces[0]?.id;}
 else if(kind==='map')engine.view='map';
 else if(kind==='lights'){engine.view='stage';stage10.ledVisible=false;stage10.lightVisible=true;}
 else if(kind==='hero'){engine.view='stage';stage10.ledVisible=stage10.lightVisible=true;director.cameraFollow=false;state.orbit=false;cameraPreset8('hero',engine.surfaces.length?'led':'stage');}
 renderUI();
}
// Procedural actors: smooth silhouettes, local animation clock, no imported scene edits.
ellipsoid=function(name,c,r,color,N=12,R=8){if(rt10.building&&!rt10.lite&&stage10.detail==='high'){N=Math.max(N,20);R=Math.max(R,12);}return BASE10.ellipsoid(name,c,r,color,N,R);};
buildHuman=function(desc,lite=false,pose=0){
 rt10.building=true;rt10.lite=lite;let nodes;try{nodes=BASE10.buildHuman(desc,lite,pose);}finally{rt10.building=false;rt10.lite=false;}
 if(!lite&&stage10.detail==='high'){
  const head=nodes.find(n=>n.name==='head');if(head){const skin=[...hexrgb(desc.skin||'#c49474'),1],hair=[.045,.035,.03,1];
   const parts=[];for(const s of [-1,1]){parts.push(ellipsoid('Ear contour',[s*.101,1.565,0],[.018,.032,.018],skin,12,8));parts.push(rod('Eyebrow',[s*.044-.02,1.623,.094],[s*.044+.02,1.625,.094],.004,.004,hair,6));}
   parts.push(ellipsoid('Nose bridge',[0,1.585,.10],[.012,.020,.014],skin,12,8));head.meshes.push(...mergeCast(parts,'Facial detail'));
  }
 }
 return nodes;
};
actState8=function(a,t){
 const st=BASE10.actState8(a,t);if(!st.visible||!st.clip)return st;
 const c=st.clip,cycle=clamp(+c.cycle10||8,.25,120),raw=Math.max(0,(t-c.start)*(c.rate||1)+(c.in||0));
 return {...st,t:c.loop?raw%cycle:Math.min(raw,cycle),progress:c.loop?(raw%cycle)/cycle:clamp(raw/cycle,0,1),elapsed:raw};
};
castMatrix=function(d,node,t){
 let mat=BASE10.castMatrix(d,node,t);if(!seq.animate||d.animate===false||d.type==='audience')return mat;
 const a=d.actId&&director.acts.find(x=>x.id===d.actId),local=a?actState8(a,t).t:t,phase=local*Math.PI*2*seq.bpm/60+(d.phase||0);
 if(['dancer','leddancer','laserdancer'].includes(d.type)){
  // Whole performer step stays on the deck; articulated arms keep existing pivots.
  mat=M.mm(M.translate([Math.sin(phase*.25)*.12,Math.max(0,Math.sin(phase*.5))*.045,Math.sin(phase*.125)*.07]),mat);
 }
 return mat;
};
// Web Audio: unity by default; optional up to +6 dB, compressor + soft peak bound.
ensureAudioContext=function(){const ctx=BASE10.ensureAudioContext();if(rt10.graph?.ctx===ctx)return ctx;
 live.masterGain.disconnect();live.analyser.disconnect();
 const comp=ctx.createDynamicsCompressor();comp.threshold.value=-6;comp.knee.value=6;comp.ratio.value=12;comp.attack.value=.003;comp.release.value=.15;
 const dry=ctx.createGain(),wet=ctx.createGain(),conv=ctx.createConvolver(),soft=ctx.createWaveShaper();dry.gain.value=1;wet.gain.value=0;
 const curve=new Float32Array(4097);for(let i=0;i<curve.length;i++){const x=i*2/(curve.length-1)-1;curve[i]=Math.abs(x)<.8?x:Math.sign(x)*(.8+.18*Math.tanh((Math.abs(x)-.8)/.18));}soft.curve=curve;soft.oversample='2x';
 const ir=ctx.createBuffer(2,Math.round(ctx.sampleRate*.65),ctx.sampleRate);let seed=7123;for(let ch=0;ch<2;ch++){const v=ir.getChannelData(ch);for(let i=0;i<v.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;v[i]=((seed>>>0)/4294967295*2-1)*Math.pow(1-i/v.length,3)*.4;}}conv.buffer=ir;
 live.masterGain.connect(dry);dry.connect(comp);live.masterGain.connect(conv);conv.connect(wet);wet.connect(comp);comp.connect(soft);soft.connect(live.analyser);live.analyser.connect(ctx.destination);live.analyser.connect(live.recordDest);
 rt10.graph={ctx,comp,dry,wet,conv,soft};syncMixer10();return ctx;
};
function syncMixer10(){
 live.volume=clamp(stage10.audio.master,0,2);live.videoVolume=clamp(stage10.audio.video,0,2);live.musicVolume=clamp(stage10.audio.music,0,2);
 if(rt10.graph){rt10.graph.wet.gain.setTargetAtTime(stage10.audio.room,rt10.graph.ctx.currentTime,.05);}
}
routeAudio=function(){
 syncMixer10();const c=seq.enabled?sq.audio:null,fade=c?.fade>0?clamp(Math.min(state.time-c.start,c.start+c.duration-state.time)/c.fade,0,1):1;
 const gain=c?.gain;if(c)c.gain=gain*fade;
 try{return BASE10.routeAudio();}finally{if(c)c.gain=gain;}
};
function changeFader10(key,value){stage10.audio[key]=clamp(+value||0,0,key==='room'?.4:2);syncMixer10();routeAudio();updateMixerUI10();}
function resetFX10(update=true){Object.assign(stage10.fx,{rollX:0,rollY:0,rotate:0,mirror:0,invert:0,rgb:0,pulse:0});stage10.flashUntil=0;live.blackout=false;live.flashHold=false;live.strobeHold=false;live.strobeArmed=false;seq.strobe=false;live.opacity=1;live.zoom=1;live.hue=0;if(update)updateFXUI10();}
const FX10=[['flash','FLASH','C / hold'],['blackout','BLACKOUT','X'],['strobe','STROBE','ARM'],['pulse','PUNCH','ZOOM PULSE'],['rollX','ROLL X','UV / H'],['rollY','ROLL Y','UV / V'],['rotate','ROTATE','UV / SPIN'],['mirror','MIRROR','SYMMETRY'],['rgb','RGB SPLIT','COLOR'],['invert','INVERT','NEGATIVE']];
function fireFX10(id,hold=false){
 if(id==='flash'){stage10.flashUntil=performance.now()+160;live.flashHold=hold;}
 else if(id==='blackout')live.blackout=!live.blackout;
 else if(id==='strobe'){if(!live.strobeArmed){toast('Bat cho phep strobe truoc. Hieu ung nhap nhay nhanh.');return;}live.strobeHold=hold;}
 else if(id in stage10.fx)stage10.fx[id]=stage10.fx[id]?0:id==='rotate'?.35:1;
 updateFXUI10();
}
applyLiveUniforms=function(s){BASE10.applyLiveUniforms.call(this,s);const test=this.globalTest||s.source==='test',fx={...stage10.fx};
 if(seq.enabled)for(const {c}of activeClips(stage10.previewTime,'vj'))if(c.source in fx)fx[c.source]=c.gain||1;
 for(const [k,u]of [['rollX','uRollX10'],['rollY','uRollY10'],['rotate','uRotate10'],['mirror','uMirror10'],['invert','uInvert10'],['rgb','uRGB10'],['pulse','uPulse10']])this.uniform(u,test?0:fx[k]||0);
 if(!test&&stage10.flashUntil>performance.now())this.uniform('uVJFlash',1);
 if(!test&&seq.enabled){for(const {c}of activeClips(stage10.previewTime,'vj')){
  if(c.source==='flash')this.uniform('uVJFlash',clamp(c.gain??1,0,1));
  if(c.source==='blackout')this.uniform('uVJDim',0);
  if(c.source==='strobe'&&seq.strobe)this.uniform('uVJDim',Math.sin(stage10.previewTime*Math.PI*16)>0?live.opacity:0);
 }}
};
function playSafe10(){enableAudio(true).then(()=>setPlaying(true));}

/* V10 show rundown: a scene links clips, not copies of stage geometry. */
const RUN10={addClip,editClip,clipDrag,renderSequence,sourceOptions,targetOptions,splitClip,duplicateClip,removeClip,updateSeqPlayhead};
function historyOnce10(fn){checkpoint();const old=checkpoint;checkpoint=()=>{};try{return fn();}finally{checkpoint=old;}}
function ensureDuration10(end){if(end>600)throw Error('Gioi han show 600 giay.');if(end>state.duration){state.duration=Math.min(600,Math.ceil(end));$('duration').value=state.duration;}}
addClip=function(track,options={}){const start=Math.max(0,options.start??snapTime(state.time)),duration=Math.max(.05,options.duration??4);ensureDuration10(start+duration);const c=RUN10.addClip(track,{...options,start,duration});return c;};
function getScene10(id=stage10.selectedScene){return stage10.scenes.find(s=>s.id===id);}
function sceneClips10(s){return seq.clips.filter(c=>c.scene10===s.id||s.clipIds.includes(c.id));}
function track10(type,target='all',name=null){let tr=seq.tracks.find(t=>t.type===type&&t.target===target&&!t.muted&&!t.generated9);if(!tr){if(seq.tracks.length>=24)throw Error('Toi da 24 track.');tr={id:uid('track'),type,target,name:name||type.toUpperCase(),muted:false};seq.tracks.push(tr);}return tr;}
function linkSceneClip10(s,c){if(!c)return;c.scene10=s.id;if(!s.clipIds.includes(c.id))s.clipIds.push(c.id);}
function createScene10(options={}){return historyOnce10(()=>{
 const start=clamp(+options.start||0,0,599.95),duration=clamp(+options.duration||16,.05,600-start);ensureDuration10(start+duration);
 const s={id:uid('scene'),name:String(options.name||'Tiet muc '+(stage10.scenes.length+1)).slice(0,64),start,duration,actId:options.actId||null,color:options.color||'#6f86dc',clipIds:[]};stage10.scenes.push(s);stage10.selectedScene=s.id;
 if(s.actId){const a=director.acts.find(a=>a.id===s.actId);if(a){const tr=track10('act','all','TIET MUC / CHOREOGRAPHY');linkSceneClip10(s,addClip(tr.id,{source:a.id,start,duration,name:a.name,fade:0,cycle10:8,loop:true}));}}
 if(options.visual!==false){const tr=track10('visual','all','VISUAL / MASTER');linkSceneClip10(s,addClip(tr.id,{source:options.source||'motion:0',name:s.name+' / Visual',start,duration,mapping:'keep',fade:.18,loop:true}));}
 if(options.light){const tr=track10('light','all','LIGHT / SCENE');linkSceneClip10(s,addClip(tr.id,{source:options.light,name:s.name+' / Light',start,duration,color:'#78dfff',gain:1,depth:.7,fade:.4}));}
 invalidateSeq();renderSequence();return s;
 });}
function importActs10(){return historyOnce10(()=>{
 let added=0;for(const a of director.acts){for(const c of seq.clips.filter(c=>c.source===a.id&&seq.tracks.some(t=>t.id===c.track&&t.type==='act'))){
  if(stage10.scenes.some(s=>s.clipIds.includes(c.id)))continue;
  const s={id:uid('scene'),name:a.name,start:c.start,duration:c.duration,actId:a.id,color:'#58b5aa',clipIds:[c.id]};c.scene10=s.id;stage10.scenes.push(s);added++;
  // Adopt only clips wholly inside this act and not linked to another scene.
  for(const other of seq.clips)if(!other.scene10&&other.start>=s.start-.01&&other.start+other.duration<=s.start+s.duration+.01)linkSceneClip10(s,other);
 }
 }
 stage10.selectedScene=stage10.scenes[0]?.id;renderSequence();toast('Da tao '+added+' doan tiet muc tu timeline hien co.');return added;
 });}
function resizeScene10(id,start,duration,{record=true}={}){
 const s=getScene10(id);if(!s)return false;start=clamp(+start||0,0,599.95);duration=clamp(+duration||.05,.05,600-start);if(record)checkpoint();
 const oldStart=s.start,oldDuration=s.duration,ratio=duration/Math.max(.05,oldDuration);
 for(const c of sceneClips10(s)){c.start=start+(c.start-oldStart)*ratio;c.duration=Math.max(.05,c.duration*ratio);}
 s.start=start;s.duration=duration;ensureDuration10(start+duration);stage10.range=null;invalidateSeq();return true;
}
function duplicateScene10(id){const original=getScene10(id);if(!original)return;return historyOnce10(()=>{
 const start=Math.max(original.start+original.duration,...stage10.scenes.map(s=>s.start+s.duration));if(start+original.duration>600)throw Error('Khong du thoi luong 600s.');ensureDuration10(start+original.duration);
 const copy={...structuredClone(original),id:uid('scene'),name:original.name+' / copy',start,clipIds:[]};stage10.scenes.push(copy);
 for(const c of sceneClips10(original)){const n={...structuredClone(c),id:uid('clip'),start:c.start-original.start+start,scene10:copy.id};seq.clips.push(n);copy.clipIds.push(n.id);}
 stage10.selectedScene=copy.id;invalidateSeq();renderSequence();return copy;
 });}
function deleteScene10(id){const s=getScene10(id);if(!s)return;dialog('Xoa doan tiet muc?',`<p>Chi xoa ${sceneClips10(s).length} clip lien ket va doan <b>${esc(s.name)}</b>. Model, nhan vat va media goc duoc giu. Ctrl+Z de hoan tac.</p>`,[{label:'Huy'},{label:'Xoa doan',primary:true,action:()=>{checkpoint();const ids=new Set(sceneClips10(s).map(c=>c.id));for(const id of ids)disposeDecoder(id);seq.clips=seq.clips.filter(c=>!ids.has(c.id));stage10.scenes=stage10.scenes.filter(x=>x.id!==s.id);stage10.range=null;stage10.selectedScene=null;invalidateSeq();renderSequence();}}]);}
function playScene10(id,loop=false){const s=getScene10(id);if(!s)return false;stage10.selectedScene=id;engine.view='stage';stage10.ledVisible=stage10.lightVisible=true;engine.globalTest=false;lighting9.preview=null;enableSequence(true);stage10.range={id,start:s.start,end:s.start+s.duration,loop:!!loop};seekWithin10(s.start);setPlaying(true);updateStageUI10();return true;}
function playClip10(id,loop=false){const c=seq.clips.find(c=>c.id===id);if(!c)return;engine.view='stage';enableSequence(true);stage10.range={id,start:c.start,end:c.start+c.duration,loop:!!loop};seekWithin10(c.start);setPlaying(true);updateStageUI10();}
function stopRange10(){stage10.range=null;updateStageUI10();}
function compactScenes10(){historyOnce10(()=>{let start=0;for(const s of [...stage10.scenes].sort((a,b)=>a.start-b.start)){resizeScene10(s.id,start,s.duration,{record:false});start+=s.duration;}renderSequence();});}
function moveTrack10(id,delta){const i=seq.tracks.findIndex(t=>t.id===id),j=i+delta;if(i<0||j<0||j>=seq.tracks.length)return;checkpoint();[seq.tracks[i],seq.tracks[j]]=[seq.tracks[j],seq.tracks[i]];invalidateSeq();renderSequence();}
function bindSceneDrag10(e,el){
 if(e.button!==0)return;e.preventDefault();e.stopPropagation();const s=getScene10(el.dataset.scene10);if(!s)return;
 checkpoint();stage10.selectedScene=s.id;const start=s.start,duration=s.duration,clips=sceneClips10(s).map(c=>({id:c.id,start:c.start,duration:c.duration})),x=e.clientX,side=e.target.dataset.sceneTrim,scroll=$('seqScroll'),scrollX=scroll.scrollLeft;
 el.setPointerCapture(e.pointerId);sq.drag=true;let moved=false;
 const move=ev=>{const dx=ev.clientX-x+scroll.scrollLeft-scrollX;if(Math.abs(dx)<3&&!moved)return;moved=true;
  const end=start+duration;let ns=start,nd=duration;
  if(side==='right')nd=clamp(snapTime(end+dx/seq.pps)-start,.05,600-start);
  else if(side==='left'){ns=clamp(snapTime(start+dx/seq.pps),0,end-.05);nd=end-ns;}
  else ns=clamp(snapTime(start+dx/seq.pps),0,600-duration);
  s.start=ns;s.duration=nd;for(const old of clips){const c=seq.clips.find(c=>c.id===old.id);if(c){c.start=ns+(old.start-start)*nd/duration;c.duration=Math.max(.05,old.duration*nd/duration);const node=document.querySelector('[data-clip="'+c.id+'"]');if(node){node.style.left=c.start*seq.pps+'px';node.style.width=c.duration*seq.pps+'px';}}}
  ensureDuration10(ns+nd);el.style.left=ns*seq.pps+'px';el.style.width=nd*seq.pps+'px';invalidateSeq();
  const r=scroll.getBoundingClientRect();if(ev.clientX>r.right-30)scroll.scrollLeft+=12;if(ev.clientX<r.left+170)scroll.scrollLeft-=12;
  setText('seqHint',s.name+' / '+ns.toFixed(2)+' - '+(ns+nd).toFixed(2)+' s');
 };
 const end=()=>{document.removeEventListener('pointermove',move,true);document.removeEventListener('pointerup',end,true);document.removeEventListener('pointercancel',end,true);sq.drag=false;stage10.range=null;renderSequence();updateStageUI10();};
 document.addEventListener('pointermove',move,true);document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
}
clipDrag=function(e,el){
 if(e.button!==0)return;e.preventDefault();e.stopPropagation();const c=seq.clips.find(c=>c.id===el.dataset.clip);if(!c)return;
 checkpoint();seq.selected=c.id;const o={...c},x=e.clientX,side=e.target.dataset.trim,scroll=$('seqScroll'),sx=scroll.scrollLeft;el.setPointerCapture(e.pointerId);sq.drag=true;let moved=false,lastY=e.clientY;
 const move=ev=>{const dx=ev.clientX-x+scroll.scrollLeft-sx;if(Math.abs(dx)<3&&!moved)return;moved=true;lastY=ev.clientY;
  if(side==='left'){const ns=clamp(snapTime(o.start+dx/seq.pps),0,o.start+o.duration-.05);c.start=ns;c.duration=o.start+o.duration-ns;c.in=Math.max(0,(o.in||0)+(ns-o.start)*(o.rate||1));}
  else if(side==='right')c.duration=clamp(snapTime(o.start+o.duration+dx/seq.pps)-o.start,.05,600-o.start);
  else c.start=clamp(snapTime(o.start+dx/seq.pps),0,600-o.duration);
  ensureDuration10(c.start+c.duration);el.style.left=c.start*seq.pps+'px';el.style.width=Math.max(7,c.duration*seq.pps)+'px';invalidateSeq();
  const r=scroll.getBoundingClientRect();if(ev.clientX>r.right-25)scroll.scrollLeft+=12;if(ev.clientX<r.left+165)scroll.scrollLeft-=12;
  setText('seqHint',showTC(c.start)+' - '+showTC(c.start+c.duration));
 };
 const end=()=>{document.removeEventListener('pointermove',move,true);document.removeEventListener('pointerup',end,true);document.removeEventListener('pointercancel',end,true);
  if(moved&&!side){const type=seq.tracks.find(t=>t.id===o.track)?.type;const lane=[...document.querySelectorAll('[data-lane]')].find(n=>{const r=n.getBoundingClientRect();return lastY>=r.top&&lastY<r.bottom&&seq.tracks.some(t=>t.id===n.dataset.lane&&t.type===type);});if(lane)c.track=lane.dataset.lane;}
  sq.drag=false;stage10.range=null;renderSequence();updateStageUI10();
 };document.addEventListener('pointermove',move,true);document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
};
const RENDER_SEQUENCE10=renderSequence;
renderSequence=function(){
 RENDER_SEQUENCE10();if(!$('sequenceDock'))return;
 if(!$('rundownTools10')){const tools=document.createElement('span');tools.id='rundownTools10';tools.innerHTML='<button class="btn" id="newScene10">+ Tiet muc</button><button class="btn" id="openRundown10">Danh sach canh</button><button class="btn" id="replayClip10">Phat doan</button><button class="btn" id="loopClip10">Lap doan</button><button class="btn" id="allRange10">Ca show</button>';document.querySelector('.seq-footer').prepend(tools);$('newScene10').onclick=()=>editScene10();$('openRundown10').onclick=openRundown10;$('replayClip10').onclick=()=>playClip10(seq.selected,false);$('loopClip10').onclick=()=>playClip10(seq.selected,true);$('allRange10').onclick=stopRange10;}
 if(!seq.open)return;
 const inner=$('seqInner'),width=Math.max(300,state.duration*seq.pps),row=document.createElement('div');row.className='seq-row scene-row10';row.innerHTML='<div class="seq-label"><b>TIET MUC / RUNDOWN</b></div><div class="scene-lane10" style="width:'+width+'px">'+stage10.scenes.map(s=>`<button data-scene10="${s.id}" class="scene-clip10 ${stage10.selectedScene===s.id?'selected':''}" style="left:${s.start*seq.pps}px;width:${Math.max(9,s.duration*seq.pps)}px;border-color:${s.color}"><i data-scene-trim="left"></i><b>${esc(s.name)}</b><small>${s.duration.toFixed(1)}s</small><i data-scene-trim="right"></i></button>`).join('')+'</div>';
 $('seqRuler').after(row);row.querySelectorAll('[data-scene10]').forEach(el=>{el.onpointerdown=e=>bindSceneDrag10(e,el);el.ondblclick=()=>editScene10(el.dataset.scene10);});
 inner.querySelectorAll('[data-track-edit]').forEach(b=>{const controls=document.createElement('span');controls.className='track-order10';controls.innerHTML='<button title="Track len">&#8593;</button><button title="Track xuong">&#8595;</button>';b.before(controls);controls.children[0].onclick=()=>moveTrack10(b.dataset.trackEdit,-1);controls.children[1].onclick=()=>moveTrack10(b.dataset.trackEdit,1);});
 updateStageUI10();
};
function editScene10(id=null){
 const s=getScene10(id),v=s||{name:'Tiet muc '+(stage10.scenes.length+1),start:Math.max(0,...stage10.scenes.map(x=>x.start+x.duration)),duration:16,actId:director.acts[0]?.id||''};
 dialog(s?'Chinh tiet muc':'Tao tiet muc / Scene',`<div class="sc-form10"><label>Ten tiet muc<input id="scName10" value="${esc(v.name)}"></label><label>Nguoi / tiet muc 3D<select id="scAct10"><option value="">Khong / chi visual</option>${director.acts.map(a=>`<option value="${a.id}" ${a.id===v.actId?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label><label>Bat dau (s)<input id="scStart10" type="number" min="0" max="600" step=".1" value="${v.start}"></label><label>Do dai (s)<input id="scDuration10" type="number" min=".1" max="600" step=".1" value="${v.duration}"></label>${!s?`<label>Visual<select id="scSource10">${sourceOptions('visual','motion:0')}</select></label><label>Den<select id="scLight10"><option value="">Giu den / khong them cue</option><option value="sweep">Sweep</option><option value="fan">Fan</option><option value="pulse">Pulse</option><option value="lx:move_circle">Circle</option></select></label>`:''}</div><p class="hint-text">Keo dai canh se gian thoi diem / thoi luong cac clip lien ket. Toc do video va nhac khong bi doi. Chuyen dong tiet muc lap chu ky rieng; model / crop giu nguyen.</p>`,[{label:'Dong'},...(s?[{label:'Phat lai',action:()=>playScene10(s.id,false)},{label:'Lap canh',action:()=>playScene10(s.id,true)},{label:'+ Visual',action:()=>visualForScene10(s.id)}]:[]),{label:'Luu',primary:true,action:()=>{const start=clamp(+$('scStart10').value||0,0,599.9),duration=clamp(+$('scDuration10').value||1,.1,600-start);if(s){checkpoint();s.name=$('scName10').value.slice(0,64);resizeScene10(s.id,start,duration,{record:false});}else createScene10({name:$('scName10').value,start,duration,actId:$('scAct10').value,source:$('scSource10').value,light:$('scLight10').value});invalidateSeq();toggleSequence(true);renderSequence();}}]);
 if(s)$('scAct10').disabled=true;
}
function visualForScene10(id){const s=getScene10(id);if(!s)return;dialog('Them visual vao '+s.name,`<div class="sc-form10"><label>Nguon<select id="svSource10">${sourceOptions('visual',state.media[0]?.id||'motion:0')}</select></label><label>LED / cum<select id="svTarget10">${targetOptions('all','visual')}</select></label><label>Source IN (s)<input id="svIn10" type="number" min="0" step=".1" value="0"></label><label>Mapping<select id="svMap10"><option value="keep">Giu UV / crop goc</option><option value="map">Pixel map master</option><option value="full">Toan video moi man</option></select></label></div>`,[{label:'Huy'},{label:'Them vao timeline',primary:true,action:()=>historyOnce10(()=>{const tr=track10('visual',$('svTarget10').value,'VISUAL / '+$('svTarget10').selectedOptions[0].textContent);const c=addClip(tr.id,{start:s.start,duration:s.duration,source:$('svSource10').value,in:Math.max(0,+$('svIn10').value||0),mapping:$('svMap10').value,name:s.name+' / Visual'});linkSceneClip10(s,c);invalidateSeq();renderSequence();})}]);}
function openRundown10(){dialog('Rundown / Thu tu tiet muc',`<div class="sc-banner10"><small>STAGE LIVE / SCENE ORGANIZER</small><h2>Moi tiet muc. Mot doan show.</h2><p>Keo hang TIET MUC tren timeline de di chuyen ca visual, den va nguoi da lien ket.</p></div><div class="sc-actions10"><button class="btn" id="scAdd10">+ Tao canh</button><button class="btn" id="scAdopt10">Gom tiet muc cu</button><button class="btn" id="scCompact10">Xep noi tiep</button></div><div class="sc-cards10">${stage10.scenes.map(s=>`<article><small>${s.start.toFixed(1)} - ${(s.start+s.duration).toFixed(1)} s / ${sceneClips10(s).length} clips</small><h3>${esc(s.name)}</h3><div><button class="btn" data-sc-play="${s.id}">Phat</button><button class="btn" data-sc-loop="${s.id}">Lap</button><button class="btn" data-sc-edit="${s.id}">Chinh</button><button class="btn" data-sc-copy="${s.id}">Nhan</button><button class="btn" data-sc-del="${s.id}">X</button></div></article>`).join('')||'<p>Chua co canh. Tao canh moi hoac gom cac tiet muc cu.</p>'}</div>`,[{label:'Dong'},{label:'Mo timeline',primary:true,action:()=>toggleSequence(true)}]);$('modal').classList.add('pro-wide');$('scAdd10').onclick=()=>editScene10();$('scAdopt10').onclick=()=>{importActs10();openRundown10();};$('scCompact10').onclick=()=>{compactScenes10();openRundown10();};for(const [key,fn]of [['play',id=>{$('modal').close();playScene10(id,false);}],['loop',id=>{$('modal').close();playScene10(id,true);}],['edit',editScene10],['copy',id=>{duplicateScene10(id);openRundown10();}],['del',deleteScene10]])document.querySelectorAll('[data-sc-'+key+']').forEach(b=>b.onclick=()=>fn(b.getAttribute('data-sc-'+key)));}
sourceOptions=function(type,value){if(type==='vj')return FX10.map(([id,name])=>`<option value="${id}" ${value===id?'selected':''}>${name}</option>`).join('');return RUN10.sourceOptions(type,value);};
editClip=function(id=null,type='visual'){
 const c=seq.clips.find(c=>c.id===id),tr=c?seq.tracks.find(t=>t.id===c.track):seq.tracks.find(t=>t.type===type);type=tr?.type||type;
 if(type==='act'){
  if(!c){return RUN10.editClip(id,type);}dialog('Tiet muc 3D / Chuyen dong',`<div class="sc-form10"><label>Bat dau (s)<input id="actStart10" type="number" value="${c.start}" step=".1"></label><label>Do dai (s)<input id="actDuration10" type="number" value="${c.duration}" step=".1"></label><label>Chu ky chuyen dong (s)<input id="actCycle10" type="number" value="${c.cycle10||8}" min=".25" max="120" step=".25"></label><label>Toc do<input id="actRate10" type="number" value="${c.rate||1}" min=".125" max="8" step=".125"></label><label>Source IN (s)<input id="actIn10" type="number" value="${c.in||0}" step=".1"></label><label class="check-row"><input type="checkbox" id="actLoop10" ${c.loop?'checked':''}>Lap chuyen dong trong suot doan</label></div><p class="hint-text">Keo mep phai cua clip de keo dai. Chu ky dieu khien viec lap, khong lam nho model hoac doi pixel.</p>`,[{label:'Dong'},{label:'Phat lai',action:()=>playClip10(c.id,false)},{label:'Lap doan',action:()=>playClip10(c.id,true)},{label:'Luu',primary:true,action:()=>{checkpoint();c.start=clamp(+$('actStart10').value||0,0,599.95);c.duration=clamp(+$('actDuration10').value||1,.05,600-c.start);c.cycle10=clamp(+$('actCycle10').value||8,.25,120);c.rate=clamp(+$('actRate10').value||1,.125,8);c.in=Math.max(0,+$('actIn10').value||0);c.loop=$('actLoop10').checked;ensureDuration10(c.start+c.duration);invalidateSeq();renderSequence();}}]);return;
 }
 if(type==='vj'){editVJClip10(c);return;}
 RUN10.editClip(id,type);
};
function editVJClip10(c=null){const seed=c; c=seq.clips.find(x=>x.id===c?.id)||null; const sc=getScene10();dialog('FX visual tren timeline',`<div class="sc-form10"><label>Hieu ung<select id="fxSource10">${sourceOptions('vj',c?.source||seed?.source||'pulse')}</select></label><label>Bat dau<input id="fxStart10" type="number" step=".1" value="${c?.start??sc?.start??state.time}"></label><label>Do dai<input id="fxDuration10" type="number" step=".1" value="${c?.duration??4}"></label><label>Cuong do<input id="fxGain10" type="number" step=".1" min="0" max="2" value="${c?.gain??1}"></label></div><p>FX chi tac dong noi dung LED, khong xoay model. Strobe can duoc cho phep, mac dinh tat.</p>`,[{label:'Dong'},{label:'Luu FX',primary:true,action:()=>historyOnce10(()=>{const start=clamp(+$('fxStart10').value||0,0,599.95),o={source:$('fxSource10').value,name:'VJ / '+$('fxSource10').value,start,duration:clamp(+$('fxDuration10').value||1,.05,600-start),gain:clamp(+$('fxGain10').value||1,0,2)};if(c){ensureDuration10(o.start+o.duration);Object.assign(c,o);}else{const n=addClip(track10('vj','all','VJ / VISUAL FX').id,o);if(sc)linkSceneClip10(sc,n);}invalidateSeq();renderSequence();})}]);}

/* V10 fixed inspector control surfaces. FX overlay does not take source ownership. */
const UI10={renderUI,renderInspector,updateStableControls,openAudioPanel,showHelp};
function openMixer10(){stage10.mixerOpen=true;stage10.fxOpen=false;document.body.classList.add('inspector-open');renderUI();}
function openFX10(){stage10.fxOpen=true;stage10.mixerOpen=false;document.body.classList.add('inspector-open');renderUI();}
function closeSide10(){stage10.fxOpen=stage10.mixerOpen=false;renderUI();}
openAudioPanel=function(){openMixer10();};
function renderSide10(){
 if(!stage10.mixerOpen&&!stage10.fxOpen)return;
 const host=$('inspectorContent');if(!host)return;
 $('inspectorKicker').textContent=stage10.mixerOpen?'AUDIO / STAGE MIXER':'VJ / LED EFFECTS';
 $('inspectorTitle').textContent=stage10.mixerOpen?'Stage sound':'Live visual FX';
 $('inspectorSubtitle').textContent=stage10.mixerOpen?'Fader + headroom + room. Audio stays local.':'Overlay FX: khong dung timeline dang chay.';
 if(stage10.mixerOpen){
  host.innerHTML=`<div class="side-top10"><button class="btn" id="audioOn10">${live.audioEnabled?'Audio ON':'B\u1eadt Audio'}</button><button class="btn" id="testAudio10">Th\u1eed loa</button><button class="icon-btn" id="closeSide10">&#215;</button></div>
  <div class="audio-read10"><span id="audioStatus10">CHECK AUDIO</span><div class="vu10"><i id="vuFill10"></i></div><small id="reduction10">COMP / 0 dB</small></div>
  <div class="faders10">${[['master','MASTER'],['video','VIDEO'],['music','MUSIC'],['room','ROOM']].map(([id,label])=>`<div class="fader10"><b>${label}</b><input data-fader10="${id}" aria-label="${label} fader" type="range" min="0" max="${id==='room'?.4:2}" step=".01" value="${stage10.audio[id]}"><output id="faderVal10_${id}">${Math.round(stage10.audio[id]*100)}%</output></div>`).join('')}</div>
  <div class="sc-actions10"><button class="btn" id="gainUnity10">100%</button><button class="btn" id="gainBoost10">+3 dB</button><button class="btn" id="gainMax10">+6 dB</button></div>
  <div class="field"><label>Ngu\u1ed3n</label><select id="audioSource10"><option value="video">Ti\u1ebfng video</option><option value="music">Nh\u1ea1c ri\u00eang</option><option value="mix">Tr\u1ed9n hai ngu\u1ed3n</option></select></div>
  <div class="sc-actions10"><button class="btn" id="loadMusic10">+ Nh\u1ea1c</button><button class="btn" id="roomDry10">Dry</button><button class="btn" id="roomHall10">Hall</button></div>
  <p class="hint-text">${esc(live.audioTrack?.name||'Chua co nhac rieng')}<br>ROOM la vang phong mo phong, khong phai am hoc venue that. Compressor + soft peak giup giam qua tai; bat dau am luong thap tren loa.</p><p class="info-box">Audio clip tr\u00ean timeline c\u00f3 quy\u1ec1n ch\u1ecdn ngu\u1ed3n. Fader MASTER lu\u00f4n \u0111i\u1ec1u khi\u1ec3n m\u1ee9c nghe cu\u1ed1i.</p>`;
  $('audioOn10').onclick=()=>enableAudio(!live.audioEnabled).then(updateMixerUI10);$('testAudio10').onclick=testSpeakers;$('closeSide10').onclick=closeSide10;
  host.querySelectorAll('[data-fader10]').forEach(el=>el.oninput=()=>changeFader10(el.dataset.fader10,+el.value));
  $('gainUnity10').onclick=()=>changeFader10('master',1);$('gainBoost10').onclick=()=>changeFader10('master',Math.SQRT2);$('gainMax10').onclick=()=>changeFader10('master',2);
  $('audioSource10').value=live.audioMode;$('audioSource10').onchange=e=>{live.audioMode=e.target.value;routeAudio();syncMusic(true);};$('loadMusic10').onclick=()=>$('musicInput').click();$('roomDry10').onclick=()=>changeFader10('room',0);$('roomHall10').onclick=()=>changeFader10('room',.18);updateMixerUI10();
 }else{
  host.innerHTML=`<div class="side-top10"><span class="owner10" id="fxOwner10">${seq.enabled?'SHOW TIMELINE':'LIVE LOOK'}</span><button class="btn" id="fxReset10">RESET FX</button><button class="icon-btn" id="closeSide10">&#215;</button></div>
  <div class="fx-grid10">${FX10.map(([id,label,hint])=>`<button data-fx10="${id}" class="fx-tile10 fx-${id}"><b>${label}</b><small>${hint}</small></button>`).join('')}</div>
  <label class="check-row"><input id="arm10" type="checkbox" ${live.strobeArmed?'checked':''}>Cho ph\u00e9p Strobe / nh\u00e1y nhanh</label>
  <div class="field"><label>LED DIM</label><input id="dim10" type="range" min="0" max="1" step=".01" value="${live.opacity}"></div><div class="field"><label>ZOOM</label><input id="zoom10" type="range" min="1" max="2" step=".01" value="${live.zoom}"></div>
  <div class="sc-actions10"><button class="btn primary" id="fxTimeline10">+ FX v\u00e0o timeline</button><button class="btn" id="fxBank10">Look bank</button></div><p class="hint-text">FLASH/STROBE: giu chuot de danh; tha de dung. Cac nut chuyen dong: bam bat/tat. Chi bien doi texture LED, giu nguyen model va crop luu. FX panel co the mo cung SHOW Timeline.</p>`;
  $('fxReset10').onclick=()=>resetFX10();$('closeSide10').onclick=closeSide10;
  host.querySelectorAll('[data-fx10]').forEach(b=>{const id=b.dataset.fx10;if(['flash','strobe'].includes(id)){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);fireFX10(id,true);};for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>{if(id==='flash')live.flashHold=false;if(id==='strobe')live.strobeHold=false;updateFXUI10();});}else b.onclick=()=>fireFX10(id);b.oncontextmenu=e=>{e.preventDefault();editVJClip10({source:id,start:state.time,duration:4,gain:1});};});
  $('arm10').onchange=e=>{live.strobeArmed=e.target.checked;seq.strobe=e.target.checked;live.strobeHold=false;if(e.target.checked)toast('Strobe nhay nhanh. Tranh nguoi nhay cam anh sang.',6000);updateFXUI10();};$('dim10').oninput=e=>live.opacity=+e.target.value;$('zoom10').oninput=e=>live.zoom=+e.target.value;$('fxTimeline10').onclick=()=>editVJClip10();$('fxBank10').onclick=()=>{dialog('Chuyen quyen dieu khien?', '<p>Look bank se chuyen nguon LED sang LIVE VJ va tat SHOW Timeline. FX panel hien tai khong tat timeline.</p>',[{label:'Giu timeline'},{label:'Chuyen sang LIVE',action:()=>{closeSide10();toggleLive(true);}}]);};updateFXUI10();
 }
}
function updateMixerUI10(){
 if($('audioStatus10')){const ctx=live.audioContext;setText('audioStatus10',!live.audioEnabled?'MUTED / BAM BAT AUDIO':ctx?.state==='running'?'AUDIO RUNNING':ctx?.state?.toUpperCase()||'CHUA BAT AUDIO');}
 if($('vuFill10'))$('vuFill10').style.width=Math.min(100,(live.audioRMS||0)*280)+'%';setText('reduction10','COMP / '+(rt10.graph?.comp.reduction||0).toFixed(1)+' dB');
 for(const key of ['master','video','music','room']){setText('faderVal10_'+key,Math.round(stage10.audio[key]*100)+'%');const el=document.querySelector('[data-fader10="'+key+'"]');if(el&&document.activeElement!==el)el.value=stage10.audio[key];}
 setText('audioOn10',live.audioEnabled?'Audio ON':'B\u1eadt Audio');if($('masterQuick10')&&document.activeElement!==$('masterQuick10'))$('masterQuick10').value=stage10.audio.master;
 setText('masterPercent10',Math.round(stage10.audio.master*100)+'%');
}
function updateFXUI10(){document.querySelectorAll('[data-fx10]').forEach(b=>{const id=b.dataset.fx10,on=id==='blackout'?live.blackout:id==='flash'?live.flashHold||stage10.flashUntil>performance.now():id==='strobe'?live.strobeHold:stage10.fx[id];b.classList.toggle('active',!!on);b.setAttribute('aria-pressed',String(!!on));if(id==='strobe')b.disabled=!live.strobeArmed;});setText('fxOwner10',seq.enabled?'SHOW TIMELINE + FX':'LIVE LOOK + FX');}
function updateStageUI10(){
 if($('rangeStatus10')){const r=stage10.range;setText('rangeStatus10',r?(r.loop?'LOOP ':'DOAN ')+r.start.toFixed(1)+' - '+r.end.toFixed(1)+'s':'CA SHOW');$('rangeStatus10').classList.toggle('active',!!r);}
 for(const [kind,id]of [['stage','stageView10'],['led','ledView10'],['lights','lightsView10']])$(id)?.classList.toggle('active',kind==='stage'?engine.view==='stage'&&stage10.ledVisible:kind==='led'?engine.view==='solo':engine.view==='stage'&&!stage10.ledVisible);
 $('fxToggle10')?.classList.toggle('active',stage10.fxOpen);$('mixerToggle10')?.classList.toggle('active',stage10.mixerOpen);updateFXUI10();updateMixerUI10();
}
renderUI=function(){UI10.renderUI();renderSide10();updateStageUI10();};
updateStableControls=function(){UI10.updateStableControls();updateStageUI10();};
function initStage10(){
 document.title='ALPHA Creative LED Studio V10 / STAGE LIVE';const brand=document.querySelector('.brand small');if(brand)brand.textContent='V10 / STAGE LIVE + RUNDOWN';setText('statusText','V10 / LED + LIGHT + ACTS - LOCAL');
 const ct=document.createElement('button');ct.id='compactTools10';ct.className='btn small';ct.textContent='Tools';ct.onclick=()=>document.body.classList.toggle('tools-expanded10');document.querySelector('.navigation-strip').appendChild(ct);
 const bar=$('dirToolbar');const controls=document.createElement('span');controls.className='new-tools10';controls.innerHTML='<button id="rundownToggle10">Ti\u1ebft m\u1ee5c / Scene</button><button id="fxToggle10">VJ FX+</button><button id="mixerToggle10">MIXER</button>';bar.appendChild(controls);$('rundownToggle10').onclick=openRundown10;$('fxToggle10').onclick=()=>{if(stage10.fxOpen)closeSide10();else openFX10();};$('mixerToggle10').onclick=()=>{if(stage10.mixerOpen)closeSide10();else openMixer10();};
 const views=document.querySelector('.view-tabs');views.innerHTML='<button id="stageView10">LED + \u0111\u00e8n</button><button id="ledView10">LED r\u00f5</button><button id="lightsView10">Ch\u1ec9 \u0111\u00e8n</button><button id="mapView10">Pixel Map</button>';
 $('stageView10').onclick=()=>viewStage10('stage');$('ledView10').onclick=()=>viewStage10('led');$('lightsView10').onclick=()=>viewStage10('lights');$('mapView10').onclick=()=>viewStage10('map');
 const reset=document.createElement('button');reset.id='fixPreview10';reset.className='btn small';reset.textContent='Reset xem';reset.title='Khoi phuc LED + den, khong doi mapping';document.querySelector('.view-actions').prepend(reset);reset.onclick=resetPreview10;
 const transport=document.querySelector('.transport-right');const quick=document.createElement('div');quick.className='master-quick10';quick.innerHTML='<button class="btn small" id="rangeStatus10">CA SHOW</button><label>MASTER<input id="masterQuick10" aria-label="Master volume" type="range" min="0" max="2" step=".01" value=".85"><span id="masterPercent10">85%</span></label>';transport.prepend(quick);$('rangeStatus10').onclick=stopRange10;$('masterQuick10').oninput=e=>changeFader10('master',e.target.value);
 $('vjToggle').onclick=openFX10;$('showVJ').onclick=openFX10;$('v07Audio').onclick=openMixer10;$('showAudio').onclick=openMixer10;
 const play=()=>{if(state.playing)setPlaying(false);else{enableAudio(true);setPlaying(true);}};$('playBtn').onclick=play;$('showPlay').onclick=play;
 // Space is explicit user activation too. Do not override form editing or gizmo keys.
 document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.matches('input,select,textarea')&&!$('modal').open&&!state.playing)enableAudio(true);},true);
 document.addEventListener('keydown',e=>{if(!stage10.fxOpen||e.target.matches('input,select,textarea')||$('modal').open||e.ctrlKey||e.metaKey)return;const k=e.key.toLowerCase();if(['c','x','v'].includes(k)){e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;fireFX10(k==='c'?'flash':k==='x'?'blackout':'strobe',k!=='x');}},true);
 window.addEventListener('blur',()=>{live.flashHold=false;live.strobeHold=false;stage10.flashUntil=0;updateFXUI10();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){live.flashHold=false;live.strobeHold=false;stage10.flashUntil=0;}});
 const side=document.querySelector('.right-panel');side.addEventListener('click',e=>{if(e.target.closest('[data-step]'))closeSide10();});
 const oldCast=openCastLibrary;openCastLibrary=function(){oldCast();const b=document.createElement('div');b.className='sc-actions10';b.innerHTML='<label>Chi tiet<select id="castDetail10"><option value="high">Net / smooth</option><option value="standard">Nhe / standard</option></select></label><label>Fill<input id="castFill10" type="range" min="0" max=".6" step=".02" value="'+stage10.castFill+'"></label>';document.querySelector('.cast-hero')?.after(b);$('castDetail10').value=stage10.detail;$('castDetail10').onchange=e=>{checkpoint();stage10.detail=e.target.value;rebuildCast();rebuildActCache();};$('castFill10').oninput=e=>stage10.castFill=+e.target.value;};$('v07Cast').onclick=()=>openCastLibrary();
 $('helpBtn').onclick=()=>dialog('V10 / Stage Live', '<h3>1. Xem LED + den</h3><p>LED + den: cung mot thoi gian show. LED ro: kiem tra rieng man dang chon. Reset xem: tat test pattern va FX treo, giu mapping.</p><h3>2. Tiet muc / Scene</h3><p>Gom tiet muc cu hoac tao canh. Hang TIET MUC tren timeline di chuyen/keo dai cac clip lien ket. Double-click de sua. Phat / Lap de duy?t rieng tung doan. Ca show bo gioi han.</p><h3>3. Visual va chuyen dong</h3><p>Keo video vao track; double-click chinh IN / speed / loop. Keo mep phai de tang do dai, toi da 600 giay. Mui ten canh ten track de doi thu tu. Clip cung loai co the keo sang track khac.</p><h3>4. MIXER</h3><p>Fader MASTER / VIDEO / MUSIC, boost toi da +6dB, ROOM vang phong. Bat Audio bang thao tac chuot. Bat dau nho tren loa; khong thay the mixer/am hoc that.</p><h3>5. VJ FX+</h3><p>FLASH, BLACKOUT, STROBE can cho phep; Punch, Roll X/Y, Rotate, Mirror, RGB, Invert. Panel van giu timeline chay. FX co the luu tren track VJ.</p>',[{label:'Dong'},{label:'Rundown',action:openRundown10},{label:'Mixer',action:openMixer10},{label:'VJ FX+',primary:true,action:openFX10}]);
 state.playing=false;setPlaying(false);stage10.ledVisible=stage10.lightVisible=true;engine.autoQuality=false;engine.previewScale=1;renderUI();
}
const stage10API={addClip,editClip,renderSequence,packLiveExtras,restoreLiveExtras,snapshot,restore,seekTimeline,stage10,rt10,stageData10,restoreStage10,createScene10,resizeScene10,duplicateScene10,importActs10,
 playScene10,playClip10,stopRange10,sceneClips10,compactScenes10,moveTrack10,openRundown10,editScene10,visualForScene10,
 openMixer10,openFX10,closeSide10,changeFader10,resetFX10,fireFX10,resetPreview10,viewStage10,editVJClip10,ensureDuration10};

/* V11: clip-relative choreography. Imported geometry/LED UVs are read-only.
   Y-up / metres matches this application's existing coordinate contract.
   u is normalized clip time: trimming a scene retimes every waypoint together.
   Offsets live in each performer's base frame, so group edits carry the route. */
const choreo11={version:1,routes:[],open:false,clip:null,person:null,key:null,showPaths:true,allPaths:true,place:false,drag:null,revision:0,quality:'studio',artFill:.36,style:'midnight',warning:''};
const CH11={renderUI,renderSequence,updateStableControls,renderOverlays,castMatrix,buildHuman,drawAct8,restoreSeq,packLiveExtras,restoreLiveExtras,snapshot,restore,importModel,demo,editClip,splitClip,duplicateClip,pickDirector8,applyCoordinateConfig,openFX10,openMixer10};
const routeCache11=new Map(),poseCache11=new Map();
const ACT11={walk:'Buoc di',dance:'Mua / mo tay',reach:'Vuon tay',turn:'Xoay nguoi',hold:'Dung / pose',drum:'Danh trong',glide:'Luot / cham',fan:'Mua quat / lua',wave:'Song tay / doi hinh',spin:'Xoay vong 360',kneel:'Quy / ha trong tam',finale:'Ket / Hero pose'};
function dirty11(){choreo11.revision++;routeCache11.clear();poseCache11.clear();}
function clip11(id=choreo11.clip){return id==='__show__'?{id,start:0,duration:state.duration,source:'__show__'}:seq.clips.find(c=>c.id===id);}
function people11(c=clip11()){const a=c&&director.acts.find(a=>a.id===c.source);return a?seq.people.filter(p=>a.people.includes(p.id)):seq.people.filter(p=>!p.actId&&p.type!=='audience');}
function route11(pid=choreo11.person,cid=choreo11.clip){return choreo11.routes.find(r=>r.person===pid&&r.clip===cid);}
function finite11(v,d=0){return Number.isFinite(+v)?+v:d;}
function key11(u=0,offset=[0,0,0],opts={}){return {id:uid('mark'),u:clamp(u,0,1),offset:[...offset],yaw:0,face:'front',action:'dance',ease:'smooth',energy:.65,...opts};}
function validateRoutes11(routes){const pids=new Set(seq.people.map(p=>p.id)),cids=new Set(seq.clips.map(c=>c.id));return (Array.isArray(routes)?routes:[]).slice(0,256).filter(r=>pids.has(r.person)&&(r.clip==='__show__'||cids.has(r.clip))).map(r=>({clip:r.clip,person:r.person,enabled:r.enabled!==false,baseHeight:clamp(finite11(r.baseHeight,1.75),.3,4),carryProp:!!r.carryProp,keys:(Array.isArray(r.keys)?r.keys:[]).slice(0,80).filter(k=>Array.isArray(k.offset)&&k.offset.length===3&&k.offset.every(Number.isFinite)).map(k=>key11(clamp(finite11(k.u),0,1),k.offset.map(x=>clamp(x,-1000,1000)),{id:String(k.id||uid('mark')),yaw:clamp(finite11(k.yaw),-1080,1080),face:['front','path','angle'].includes(k.face)?k.face:'front',action:ACT11[k.action]?k.action:'dance',ease:['smooth','linear','hold','curve'].includes(k.ease)?k.ease:'smooth',energy:clamp(finite11(k.energy,.65),0,1)})).sort((a,b)=>a.u-b.u).filter((k,i,arr)=>!i||k.u-arr[i-1].u>1e-5)}));}
function routeData11(){return structuredClone({version:1,routes:choreo11.routes,quality:choreo11.quality,artFill:choreo11.artFill,style:choreo11.style});}
function restoreChoreo11(data){choreo11.routes=validateRoutes11(data?.routes);choreo11.quality=data?.quality==='light'?'light':'studio';choreo11.artFill=clamp(finite11(data?.artFill,.36),0,.8);choreo11.style=['midnight','ivory','crimson'].includes(data?.style)?data.style:'midnight';choreo11.clip=null;choreo11.person=null;choreo11.key=null;choreo11.place=false;choreo11.drag=null;dirty11();rebuildCast();rebuildActCache();}
function ensureRoute11(p=seq.people.find(p=>p.id===choreo11.person),c=clip11()){if(!p||!c)return null;let r=route11(p.id,c.id);if(!r){r={clip:c.id,person:p.id,enabled:true,baseHeight:p.height||1.75,carryProp:false,keys:[key11(0,[0,0,0],{action:p.type.includes('drum')?'drum':'dance'}),key11(1,[0,0,0],{action:'hold'})]};choreo11.routes.push(r);dirty11();}return r;}
function baseFrame11(p,r){const scale=(p.height||1.75)/(r?.baseHeight||p.height||1.75);return M.mm(M.translate(p.pos),M.mm(M.rotate([0,1,0],(p.yaw||0)*Math.PI/180),M.trs([0,0,0],IDENTITY_Q,[scale,scale,scale])));}
function keyWorld11(p,r,k){return M.point(baseFrame11(p,r),k.offset);}
function worldOffset11(p,r,pos){return M.point(M.inverse(baseFrame11(p,r)),pos);}
function routeAt11(r,u){const ks=r?.keys||[];if(!ks.length)return [0,0,0];if(u<=ks[0].u)return [...ks[0].offset];if(u>=ks.at(-1).u)return [...ks.at(-1).offset];const j=ks.findIndex(k=>k.u>=u),a=ks[j-1],b=ks[j],f=clamp((u-a.u)/Math.max(1e-6,b.u-a.u),0,1);if(a.ease==='hold')return [...a.offset];
 if(a.ease==='curve'){const prev=ks[Math.max(0,j-2)].offset,next=ks[Math.min(ks.length-1,j+1)].offset,d=M.sub(b.offset,a.offset),L=Math.hypot(...d);let m0=M.mul(M.sub(b.offset,prev),.32),m1=M.mul(M.sub(next,a.offset),.32);const limit=v=>M.mul(v,Math.min(1,L*.7/(Math.hypot(...v)||1)));m0=limit(m0);m1=limit(m1);return a.offset.map((x,i)=>(2*f*f*f-3*f*f+1)*x+(f*f*f-2*f*f+f)*m0[i]+(-2*f*f*f+3*f*f)*b.offset[i]+(f*f*f-f*f)*m1[i]);}
 const e=a.ease==='linear'?f:f*f*(3-2*f);return a.offset.map((x,i)=>x+(b.offset[i]-x)*e);
}
function pathMetrics11(r){let cache=routeCache11.get(r);if(cache&&cache.rev===choreo11.revision)return cache;const steps=180,points=[],lengths=[0];for(let i=0;i<=steps;i++){const p=routeAt11(r,i/steps);points.push(p);if(i)lengths.push(lengths[i-1]+Math.hypot(...M.sub(p,points[i-1])));}cache={rev:choreo11.revision,points,lengths,steps,total:lengths.at(-1)};routeCache11.set(r,cache);return cache;}
function routeLength11(r,u){const c=pathMetrics11(r),x=clamp(u,0,1)*c.steps,i=Math.min(c.steps-1,Math.floor(x));return c.lengths[i]+(c.lengths[i+1]-c.lengths[i])*(x-i);}
function activeRoute11(p,t){if(!seq.enabled&&!choreo11.open)return null;let out=null;for(const r of choreo11.routes){if(r.person!==p.id||!r.enabled||!r.keys.length)continue;const c=clip11(r.clip);if(!c)continue;if(c.track&&seq.tracks.find(tr=>tr.id===c.track)?.muted)continue;if(t>=c.start-1e-5&&t<=c.start+c.duration+1e-5)out={r,c,u:clamp((t-c.start)/Math.max(.05,c.duration),0,1)};}return out;}
function routePose11(p,t){const ac=activeRoute11(p,t);if(!ac)return {pos:[...p.pos],yaw:p.yaw||0,energy:.65,action:p.type.includes('drum')?'drum':'dance',distance:0,speed:0,direction:[0,0,1],route:null,local:t};const {r,c,u}=ac,keys=r.keys;let j=0;for(let i=1;i<keys.length;i++)if(keys[i].u<=u+1e-7)j=i;const k=keys[j],next=keys[Math.min(j+1,keys.length-1)],f=clamp((u-k.u)/Math.max(.0001,next.u-k.u),0,1),ease=f*f*(3-2*f),frame=baseFrame11(p,r),pos=M.point(frame,routeAt11(r,u));const h=.0005,du=M.sub(routeAt11(r,Math.min(1,u+h)),routeAt11(r,Math.max(0,u-h))),delta=M.vector(frame,du),speed=Math.hypot(...delta)/Math.max(.000001,(Math.min(1,u+h)-Math.max(0,u-h))*c.duration),direction=Math.hypot(delta[0],delta[2])>.00001?M.norm([delta[0],0,delta[2]]):[0,0,1];
 let yaw=(p.yaw||0)+(k.yaw+(next.yaw-k.yaw)*ease);if(k.face==='path'){const ahead=M.sub(routeAt11(r,Math.min(1,u+.012)),routeAt11(r,Math.max(0,u-.012))),world=M.vector(frame,ahead);if(Math.hypot(world[0],world[2])>.0001)yaw=Math.atan2(world[0],world[2])*180/Math.PI;else yaw=p.yaw||0;}if(k.face==='front')yaw=p.yaw||0;
 return {pos,yaw,energy:k.energy+(next.energy-k.energy)*ease,action:k.action,nextAction:next.action||k.action,distance:routeLength11(r,u)*(p.height/r.baseHeight),speed,direction,route:r,local:t-c.start,u,clip:c,key:k,segmentU:f};}
function setWaypoint11(pid,cid,time,world,opts={}){const p=seq.people.find(p=>p.id===pid),c=clip11(cid);if(!p||!c||!world?.every(Number.isFinite))return null;const r=ensureRoute11(p,c),u=clamp((time-c.start)/c.duration,0,1),near=r.keys.find(k=>Math.abs(k.u-u)<.0005);if(near){near.offset=worldOffset11(p,r,world);Object.assign(near,opts);choreo11.key=near.id;}else{const k=key11(u,worldOffset11(p,r,world),opts);r.keys.push(k);r.keys.sort((a,b)=>a.u-b.u);choreo11.key=k.id;}dirty11();return r.keys.find(k=>k.id===choreo11.key);}
function choreoClipList11(){return seq.clips.filter(c=>seq.tracks.some(t=>t.id===c.track&&t.type==='act')&&director.acts.some(a=>a.id===c.source));}
function adoptSelection11(){let c=clip11();if(!c){c=choreoClipList11().find(c=>c.id===seq.selected)||choreoClipList11().find(c=>state.time>=c.start&&state.time<c.start+c.duration)||choreoClipList11()[0];choreo11.clip=c?.id||'__show__';}const pp=people11(c);if(!pp.some(p=>p.id===choreo11.person))choreo11.person=pp[0]?.id||null;const r=route11();if(!r?.keys.some(k=>k.id===choreo11.key))choreo11.key=r?.keys[0]?.id||null;}
function formation11(kind,{record=true,span=5,depth=2}={}){adoptSelection11();const c=clip11(),ps=people11(c).filter(p=>p.type!=='audience');if(!c||!ps.length)return;const a=director.acts.find(a=>a.id===c.source);if(record)checkpoint();const center=a?.pos||ps.reduce((s,p)=>M.add(s,M.mul(p.pos,1/ps.length)),[0,0,0]),yaw=(a?.yaw||0)*Math.PI/180,rot=M.rotate([0,1,0],yaw);const world=v=>M.add(center,M.vector(rot,v)),stamp=(p,u,x,z,action,ease='smooth',face='front')=>{const r=ensureRoute11(p,c),w=world([x,0,z]);w[1]=p.pos[1];return key11(u,worldOffset11(p,r,w),{action,ease,face,energy:.65});};
 ps.forEach((p,i)=>{const r=ensureRoute11(p,c),n=ps.length,x=(i-(n-1)/2)*Math.min(1.35,span/Math.max(1,n-1));if(kind==='hold'){r.keys=[stamp(p,0,x,0,p.type.includes('drum')?'drum':'hold'),stamp(p,1,x,0,'hold')];}
 else if(kind==='entrance'){const side=i<n/2?-1:1;r.keys=[stamp(p,0,side*(span*.65+1+Math.abs(x)*.10),-depth*.45-(i%Math.ceil(n/2))*.65,'walk','smooth','path'),stamp(p,.3,x,0,'dance'),stamp(p,.52,x,depth*.5,'reach'),stamp(p,.78,x,depth*.5,'dance'),stamp(p,1,side*(span*.7+1),-depth*.3,'hold','smooth','path')];}
 else if(kind==='circle'){r.keys=Array.from({length:9},(_,j)=>{const theta=i/n*Math.PI*2+j/8*Math.PI*2;return stamp(p,j/8,Math.cos(theta)*span*.4,Math.sin(theta)*depth*.6,'walk','curve','path');});}
 else if(kind==='vline'){r.keys=[stamp(p,0,x,-Math.abs(x)*.5,'walk'),stamp(p,.36,x*.75,depth*.4,'dance'),stamp(p,.67,x,-Math.abs(x)*.5,'reach'),stamp(p,1,x,0,'hold')];}
 else {r.keys=[stamp(p,0,x,-depth*.4,'walk'),stamp(p,.32,x,0,'reach'),stamp(p,.65,x,depth*.4,'dance'),stamp(p,1,x,0,'hold')];}r.enabled=true;});choreo11.key=route11()?.keys[0]?.id;dirty11();renderUI();toast('Da tao moc duong dien. Keo tung moc tren san khau de chinh.');}
function pathRisks11(){const c=clip11(),ps=people11(c);if(!c)return [];const warnings=[];for(let i=0;i<=40;i++){const t=c.start+c.duration*i/40,poses=ps.map(p=>routePose11(p,t));for(let a=0;a<ps.length;a++)for(let b=a+1;b<ps.length;b++){if(Math.hypot(...M.sub(poses[a].pos,poses[b].pos))<.45){warnings.push({time:+t.toFixed(2),a:ps[a].name,b:ps[b].name});if(warnings.length>=5)return warnings;}}}return warnings;}
// Data is separate from renderer caches. No absolute geometry is baked by path editing.
packLiveExtras=async function(){const d=await CH11.packLiveExtras();d.choreography11=routeData11();return d;};
restoreLiveExtras=async function(d){await CH11.restoreLiveExtras(d);restoreChoreo11(d?.choreography11);renderUI();};
snapshot=function(){const d=CH11.snapshot();d.choreography11=routeData11();return d;};
restore=function(d){CH11.restore(d);restoreChoreo11(d.choreography11);renderUI();};
const RESET_SEQ11=resetSeq;resetSeq=function(){RESET_SEQ11();choreo11.routes=[];choreo11.clip=choreo11.person=choreo11.key=null;dirty11();};
// Scene duplication keeps choreography normalized to each duplicated clip.
const DUPSC11=duplicateScene10;
duplicateScene10=function(id){const old=getScene10(id),clips=old?sceneClips10(old):[],paths=structuredClone(choreo11.routes);const result=DUPSC11(id);if(result){const after=sceneClips10(result);for(let i=0;i<clips.length;i++)for(const r of paths.filter(r=>r.clip===clips[i].id))if(after[i])choreo11.routes.push({...r,clip:after[i].id,keys:r.keys.map(k=>({...k,id:uid('mark')}))});dirty11();}return result;};
const DUPCL11=duplicateClip;duplicateClip=function(){const id=seq.selected,paths=structuredClone(choreo11.routes.filter(r=>r.clip===id));DUPCL11();if(seq.selected!==id)for(const r of paths)choreo11.routes.push({...r,clip:seq.selected,keys:r.keys.map(k=>({...k,id:uid('mark')}))});dirty11();renderSequence();};
function sampledKey11(r,u){const ks=r.keys;let a=ks[0];for(const k of ks)if(k.u<=u)a=k;return {...a,id:uid('mark'),u,offset:routeAt11(r,u)};}
const SPLIT11=splitClip;
splitClip=function(){const c=seq.clips.find(c=>c.id===seq.selected);if(!c||state.time<=c.start+.05||state.time>=c.start+c.duration-.05)return SPLIT11();const u=(state.time-c.start)/c.duration,source=structuredClone(choreo11.routes.filter(r=>r.clip===c.id)),oldId=c.id;SPLIT11();if(seq.selected===oldId)return;for(const old of source){const edge=sampledKey11(old,u),first=old.keys.filter(k=>k.u<u-1e-5).concat([{...edge}]).map(k=>({...k,u:k.u/u})),last=[{...edge,id:uid('mark')}].concat(old.keys.filter(k=>k.u>u+1e-5)).map(k=>({...k,u:(k.u-u)/(1-u)}));const r=route11(old.person,oldId);if(r)r.keys=first;choreo11.routes.push({...old,clip:seq.selected,keys:last});}dirty11();renderUI();};

/* Original articulated stage characters. Analytic two-bone limbs, deterministic
   poses and metre-scale body proportions; no external models or mocap assets. */
const CLOTH11={midnight:{coat:'#183d52',edge:'#dec68f',led:'#69f0e0'},ivory:{coat:'#e6dfd1',edge:'#82633c',led:'#59cfe0'},crimson:{coat:'#552337',edge:'#e2bd80',led:'#ff638a'}};
function rgba11(s){return [...hexrgb(s),1];}
function boneFrame11(a,b){const y=M.norm(M.sub(b,a)),ref=Math.abs(y[2])>.92?[0,1,0]:[0,0,1],x=M.norm(M.cross(y,ref)),z=M.cross(x,y);return [...x,0,...y,0,...z,0,...a,1];}
function limbMatrix11(a,b,ra,rb){const ratio=Math.hypot(...M.sub(b,a))/Math.max(.00001,Math.hypot(...M.sub(rb,ra)));return M.mm(boneFrame11(a,b),M.mm(M.trs([0,0,0],IDENTITY_Q,[1,ratio,1]),M.inverse(boneFrame11(ra,rb))));}
function ik11(a,b,l1,l2,pole){const diff=M.sub(b,a),distance=clamp(Math.hypot(...diff),.00001,l1+l2-.0001),dir=M.norm(diff),x=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-x*x));let bend=M.sub(pole,M.mul(dir,M.dot(pole,dir)));if(Math.hypot(...bend)<.00001)bend=[1,0,0];return M.add(a,M.add(M.mul(dir,x),M.mul(M.norm(bend),height)));}
function node11(name,parts,extra={}){const meshes=mergeCast(parts,'V11 / '+name);for(const m of meshes)m.cast11=true;return {name,pivot:[0,0,0],meshes,...extra};}
function buildArtHuman11(d){const N=choreo11.quality==='light'?10:18,R=choreo11.quality==='light'?7:12,skin=rgba11(d.skin||'#c49474'),palette=CLOTH11[choreo11.style],dancer=['dancer','leddancer','laserdancer','fandancer'].includes(d.type),led=['leddancer','laserdancer'].includes(d.type),col=rgba11(d.color||(d.type==='fandancer'?'#6e3455':palette.coat)),trim=rgba11(palette.edge),dark=[.025,.033,.045,1],pants=dancer?col:[.04,.055,.075,1],hair=[.035,.022,.017,1],white=[.9,.88,.82,1],metal=[.6,.65,.69,1];
 const body=[],head=[],pelvis=[],nodes=[],ell=(arr,name,c,r,co)=>arr.push(ellipsoid(name,c,r,co,N,R)),bar=(arr,name,a,b,r1,r2,co)=>arr.push(rod(name,a,b,r1,r2,co,N));
 const profile=dancer?[[.86,.147,.09],[.97,.165,.10],[1.08,.119,.082],[1.20,.138,.09],[1.30,.178,.106],[1.39,.165,.09]]:[[.87,.15,.096],[1.04,.151,.093],[1.23,.185,.106],[1.37,.20,.10],[1.40,.177,.084]];
 body.push(loft11(profile,col,N+4));ell(pelvis,'Tailored hip',[0,.895,0],[.15,.115,.105],pants);bar(body,'Neck',[0,1.39,0],[0,1.49,0],.048,.052,skin);
 // Raised lapels / costume piping and a structured collar make the silhouette readable.
 for(const s of [-1,1]){bar(body,'Gold seam',[s*.11,.94,.088],[s*.105,1.18,.10],.0036,.0036,trim);bar(body,'Lapel',[s*.145,1.375,.078],[s*.047,1.225,.105],.009,.005,trim);ell(body,'Shoulder pad',[s*.178,1.35,0],[.059,.053,.078],col);}
 bar(body,'Waist seam',[-.14,.975,.08],[.14,.975,.08],.005,.005,trim);if(!dancer)for(let i=0;i<4;i++)ell(body,'Button',[.016,1.04+i*.065,.104],[.006,.006,.004],trim);
 if(led){for(const s of [-1,1]){const m=rod('Light piping',[s*.13,.93,.092],[s*.12,1.32,.101],.004,.004,rgba11(palette.led),8);body.push(glow8(m,palette.led,.8));}}
 // Sculpted elliptical face profile, smaller eyes, shaped jaw and rear hair cap.
 const hp=[[1.465,.025,.029],[1.485,.051,.049],[1.53,.078,.067],[1.59,.089,.080],[1.65,.084,.074],[1.70,.067,.060],[1.725,.025,.030]],face=loft11(hp,skin,N+6);face.name='Sculpted face';head.push(face);
 ell(head,'Hair cap',[0,1.697,-.020],[.089,.040,.075],hair);ell(head,'Back hair',[0,1.615,-.061],[.083,.088,.029],hair);
 if(dancer){ell(head,'Hair bun',[0,1.685,-.09],[.048,.043,.037],hair);for(const s of [-1,1])ell(head,'Small gold earring',[s*.092,1.565,0],[.005,.015,.005],trim);}
 for(const s of [-1,1]){ell(head,'Ear',[s*.089,1.585,-.005],[.014,.029,.018],skin);ell(head,'Eye socket',[s*.034,1.618,.073],[.017,.008,.005],[skin[0]*.86,skin[1]*.86,skin[2]*.86,1]);ell(head,'Eye',[s*.034,1.619,.078],[.012,.004,.003],white);ell(head,'Iris',[s*.034,1.619,.081],[.0045,.004,.002],hair);bar(head,'Brow',[s*.034-.015,1.636,.074],[s*.034+.015,1.636,.074],.0025,.0025,hair);}
 ell(head,'Nose bridge',[0,1.601,.082],[.011,.022,.010],skin);ell(head,'Nose tip',[0,1.581,.09],[.013,.010,.011],skin);bar(head,'Lips',[-.018,1.549,.069],[.018,1.549,.069],.003,.003,[.37,.16,.13,1]);
 nodes.push(node11('body',body,{kind11:'body'}),node11('pelvis',pelvis,{kind11:'pelvis'}),node11('head',head,{kind11:'head'}));
 for(let j=0;j<2;j++){const s=j?1:-1,side=j?'R':'L',hip=[s*.083,.90,0],knee=[s*.095,.49,.012],ankle=[s*.095,.10,.015],shoulder=[s*.184,1.347,0],elbow=[s*.245,1.095,.03],wrist=[s*.245,.848,.05];
  const thigh=[],shin=[],foot=[],upper=[],lower=[],hand=[];
  bar(thigh,'Tailored thigh',hip,knee,.072,.051,pants);ell(thigh,'Hip contour',hip,[.073,.067,.085],pants);ell(shin,'Knee',knee,[.049,.055,.049],pants);bar(shin,'Lower leg',knee,ankle,.05,.033,pants);ell(foot,'Ankle boot',[s*.095,.11,.025],[.044,.072,.052],dark);ell(foot,'Shoe',[s*.095,.055,.071],[.052,.048,.116],dark);
  if(led){thigh.push(glow8(rod('Thigh piping',M.add(hip,[s*.05,-.01,.052]),M.add(knee,[s*.025,.02,.044]),.0035,.0035,rgba11(palette.led),7),palette.led,.8));shin.push(glow8(rod('Shin piping',M.add(knee,[s*.025,0,.043]),M.add(ankle,[s*.015,.08,.04]),.0035,.0035,rgba11(palette.led),7),palette.led,.8));}
  ell(upper,'Shoulder',shoulder,[.064,.063,.071],col);bar(upper,'Upper sleeve',shoulder,elbow,.058,.039,col);ell(lower,'Elbow',elbow,[.04,.039,.041],col);bar(lower,'Forearm',elbow,wrist,.038,.025,dancer?col:skin);bar(lower,'Cuff',M.add(wrist,[0,.038,0]),M.add(wrist,[0,.022,0]),.029,.029,trim);ell(hand,'Palm',M.add(wrist,[0,-.035,.006]),[.029,.041,.018],skin);
  for(let f=0;f<4;f++)bar(hand,'Finger',M.add(wrist,[(f-1.5)*.012,-.05,.011]),M.add(wrist,[(f-1.5)*.013,-.093+(f===3?.009:0),.016]),.0053,.0035,skin);bar(hand,'Thumb',M.add(wrist,[-s*.022,-.015,.01]),M.add(wrist,[-s*.041,-.047,.023]),.006,.0045,skin);
  const props=[];if(d.type==='singer'&&j===1){bar(props,'Microphone',M.add(wrist,[0,-.035,.005]),M.add(wrist,[0,.088,.005]),.011,.012,dark);ell(props,'Microphone grille',M.add(wrist,[0,.107,.005]),[.021,.027,.021],metal);}
  if(d.type==='waterdrummer'||d.type==='drummer')bar(props,'Wooden drumstick',M.add(wrist,[0,-.025,0]),M.add(wrist,[0,-.025,.38]),.007,.005,rgba11('#d6b581'));
  if(led){props.push(glow8(rod('Luminous baton',M.add(wrist,[0,-.30,.02]),M.add(wrist,[0,.18,.02]),.013,.013,rgba11(palette.led),10),palette.led,1.0));}
  if(d.type==='fandancer'){const warm=[.97,.55,.26,1],mag=[.92,.28,.55,1],gold=[.93,.75,.34,1],leafCol=j?mag:warm;props.push(glow8(rod('Fan handle',M.add(wrist,[0,-.05,.01]),M.add(wrist,[0,-.19,.04]),.010,.007,gold,8),'#ffd37a',1.1));for(let fi=0;fi<9;fi++){const ang=(-.92+fi*.23)*s,tip=M.add(wrist,[Math.sin(ang)*.34,-(.12+Math.cos(ang*.7)*.22),.06+Math.cos(ang)*.14]);props.push(rod('Fan rib',M.add(wrist,[0,-.08,.02]),tip,.0045,.003,[.96,.85,.48,1],6));}const leaf=boxMesh('Fan silk',M.add(wrist,[s*.14,-.21,.10]),[.30,.20,.016],leafCol);leaf.material.emissive=leafCol.slice(0,3).map(v=>v*.28);props.push(leaf);}
  nodes.push(node11('thigh'+side,thigh,{kind11:'bone',a11:hip,b11:knee,jointA11:'hip'+side,jointB11:'knee'+side}),node11('shin'+side,shin,{kind11:'bone',a11:knee,b11:ankle,jointA11:'knee'+side,jointB11:'ankle'+side}),node11('foot'+side,foot,{kind11:'foot',anchor11:ankle,side11:side}),node11('upper'+side,upper,{kind11:'bone',a11:shoulder,b11:elbow,jointA11:'shoulder'+side,jointB11:'elbow'+side}),node11('lower'+side,lower,{kind11:'bone',a11:elbow,b11:wrist,jointA11:'elbow'+side,jointB11:'wrist'+side}),node11(j?'right':'left',[...hand,...props],{kind11:'hand',anchor11:wrist,side11:side,pivot:shoulder}));
 }
 // Keep the existing authored instruments, but attach their stage roots separately.
 if(['waterdrummer','drummer','keyboardist','guitarist'].includes(d.type)){const old=CH11.buildHuman(d,false,0).find(n=>n.name==='instrument');if(old){old.kind11='instrument';for(const m of old.meshes)m.cast11=true;nodes.push(old);}}
 return nodes;
}
buildHuman=function(d,lite=false,pose=0){if(lite||d.type==='audience')return CH11.buildHuman(d,lite,pose);return buildArtHuman11(d);};
function pose11(p,t){const cached=poseCache11.get(p.id),sig=[t,choreo11.revision,seq.bpm,seq.animate,p.animate,p.pos.join(','),p.yaw,p.height,choreo11.open,seq.enabled].join('|');if(cached?.sig===sig)return cached;
 const path=routePose11(p,t),act=p.actId&&director.acts.find(a=>a.id===p.actId),st=act?actState8(act,t):{t},local=path.route?path.local:st.t,beat=local*seq.bpm/60,phase=beat*Math.PI*2+(p.phase||0),moving=path.speed>.025,energy=path.energy*(p.animate!==false&&seq.animate?1:0),style=energy?path.action:'hold',walk=moving&&!['hold','kneel'].includes(style),gait=path.distance/.72*Math.PI*2,spinTurn=(style==='turn'||style==='spin')?360*(path.segmentU??0)**2*(3-2*(path.segmentU??0)):0,rootYaw=path.yaw+spinTurn,scale=p.height/1.75;
 const root=M.mm(M.translate(path.pos),M.mm(M.rotate([0,1,0],rootYaw*Math.PI/180),M.trs([0,0,0],IDENTITY_Q,[scale,scale,scale]))),dancer=['dancer','leddancer','laserdancer','fandancer'].includes(p.type),seated=['drummer','keyboardist'].includes(p.type),kneelDrop=style==='kneel'?-.30*Math.min(1,energy*1.35):0,bob=walk?Math.sin(gait*2)*.015*energy:style==='kneel'?Math.sin(phase*.25)*.006*energy:['dance','fan','wave','spin','finale'].includes(style)?Math.sin(phase*.5)*.018*energy:0,hipY=(seated?.69:.90)+kneelDrop+bob,bodyShift=hipY-.90;
 const sway=['dance','reach','fan','wave','finale'].includes(style)?Math.sin(phase*.25)*.052*energy:walk?Math.sin(gait)*.024*energy:0,pitch=style==='kneel'?.16*energy:style==='reach'?.08*energy:style==='finale'?-.06*energy:style==='fan'?Math.cos(phase*.25)*.045*energy:0,twist=['fan','wave','spin','dance'].includes(style)?Math.sin(phase*.5)*.085*energy:walk?Math.cos(gait)*.04*energy:0,bodyRot=M.mm(M.rotate([0,1,0],twist),M.mm(M.rotate([1,0,0],pitch),M.rotate([0,0,1],sway))),body=M.mm(M.translate([0,bodyShift,0]),M.mm(M.translate([0,.90,0]),M.mm(bodyRot,M.translate([0,-.90,0])))),joints={};
 const dir=M.vector(M.rotate([0,1,0],-rootYaw*Math.PI/180),path.direction),stride=style==='glide'?.23:.36,walkWeight=clamp((path.speed-.02)/.22,0,1),arms=[];
 for(let i=0;i<2;i++){const s=i?1:-1,side=i?'R':'L',ph=gait+i*Math.PI,frac=((ph/(Math.PI*2))%1+1)%1,swing=frac<.5,travel=walk?(swing?(-.5+frac*2):(.5-(frac-.5)*2))*stride*walkWeight:0,lift=walk&&swing?Math.sin(frac*2*Math.PI)*.108*energy*walkWeight:0;const ankle=style==='kneel'&&!seated?(i?[s*.096,.11,-.28*Math.min(1,energy*1.35)]:[s*.10,.10,.22*Math.min(1,energy*1.35)]):[s*.096+dir[0]*travel,.10+lift,(seated?.28:.02)+dir[2]*travel],hip=[s*.083,hipY,0],knee=ik11(hip,ankle,.413,.402,[s*.04,style==='kneel'?-.15:0,1]);joints['hip'+side]=hip;joints['knee'+side]=knee;joints['ankle'+side]=ankle;
  const shoulder=M.point(body,[s*.184,1.347,0]);let hand=[s*.23,1.00+bodyShift,.12],pole=[s*.55,-.28,-1];
  if(style==='fan'){const arc=Math.sin(phase*.5+i*1.15),liftF=Math.cos(phase*.25+i*Math.PI);hand=[s*(.50+.12*arc),1.38+bodyShift+.22*liftF,.16+.16*Math.sin(phase*.5+i)];pole=[s*.65,-.18,-.85];}else if(style==='wave'){const wv=Math.sin(phase*.65+i*Math.PI*.75);hand=[s*(.44+.12*Math.cos(phase*.32+i)),1.42+bodyShift+.24*wv,.14+.14*Math.sin(phase*.32+i)];pole=[s*.62,-.15,-.9];}else if(style==='spin'){const sp=Math.sin(phase*.8+i*Math.PI);hand=[s*(.54+.06*sp),1.34+bodyShift+.14*Math.cos(phase*.4+i),.12+.18*sp];pole=[s*.7,-.2,-.8];}else if(style==='finale'){const fl=Math.sin(phase*.35+i*.4)*.05;hand=[s*(.48+fl),1.72+bodyShift+.06*Math.cos(phase*.35),.16];pole=[s*.65,-.1,-.85];}else if(style==='kneel'){hand=i?[s*.28,1.08+bodyShift,.26]:[s*.22,.92+bodyShift,.22];pole=[s*.5,-.35,-.9];}else if(style==='reach'){const wv=Math.sin(phase*.25+i*.65);hand=[s*(.44+.08*wv),1.68+bodyShift+.10*wv,.18+.10*Math.cos(phase*.25+i)];pole=[s*.6,-.12,-.85];}else if(walk&&['walk','glide'].includes(style)){hand=[s*.24,1.02+bodyShift,.06+Math.sin(ph+Math.PI)*.18*energy];}
  else if(dancer&&style!=='hold'){const wave=Math.sin(phase*.25+i*.65),reach=style==='reach'?1:0;hand=[s*(.48+.08*wave),1.37+bodyShift+(reach?.38:.16*wave),.10+.12*Math.cos(phase*.25+i)];}
  else if(style==='hold'&&dancer){hand=[s*.37,1.16+bodyShift,.075];}
  if(p.type==='singer'&&i===1&&!walk)hand=[.065,1.48+bodyShift,.18];
  if(['waterdrummer','drummer'].includes(p.type)&&!walk){const hit=.5+.5*Math.sin(phase+i*Math.PI),yy=p.type==='drummer'?1.04:1.19;hand=[s*.22,yy+bodyShift+hit*.22*energy,.38-.13*hit*energy];}
  if(p.type==='keyboardist')hand=[s*.21,.99,.47];
  if(p.type==='guitarist')hand=i?[.05,1.03+Math.sin(phase)*.025*energy,.27]:[-.31,1.31,.22];
  const elbow=ik11(shoulder,hand,.268,.261,pole);joints['shoulder'+side]=shoulder;joints['elbow'+side]=elbow;joints['wrist'+side]=hand;
 }
 const headYaw=Math.sin(phase*.25)*.14*energy,headPitch=style==='kneel'?-.12*energy:style==='finale'?.10*energy:Math.cos(phase*.5)*.05*energy,headRoll=Math.sin(phase*.25)*.05*energy,out={sig,path,root,joints,body,hipY,phase,energy,style,walk,moving,scale,headYaw,headPitch,headRoll};poseCache11.set(p.id,out);return out;
}
castMatrix=function(d,node,t){if(!node.kind11)return CH11.castMatrix(d,node,t);const ps=pose11(d,t),j=ps.joints;let local=M.identity();if(node.kind11==='body')local=ps.body;else if(node.kind11==='pelvis')local=M.translate([0,ps.hipY-.90,0]);else if(node.kind11==='head'){const hRot=M.mm(M.rotate([0,1,0],ps.headYaw||0),M.mm(M.rotate([1,0,0],ps.headPitch||0),M.rotate([0,0,1],ps.headRoll||0)));local=M.mm(ps.body,M.mm(M.translate([0,1.47,0]),M.mm(hRot,M.translate([0,-1.47,0]))));}
 else if(node.kind11==='bone')local=limbMatrix11(j[node.jointA11],j[node.jointB11],node.a11,node.b11);
 else if(node.kind11==='foot'){const a=j['ankle'+node.side11];local=M.translate(M.sub(a,node.anchor11));}
 else if(node.kind11==='hand'){const wrist=j['wrist'+node.side11],elbow=j['elbow'+node.side11],rest=M.add(node.anchor11,[0,-.1,0]),axis=M.norm(M.sub(wrist,elbow));local=limbMatrix11(wrist,M.add(wrist,M.mul(axis,.1)),node.anchor11,rest);}
 else if(node.kind11==='instrument'){if(['waterdrummer','drummer','keyboardist'].includes(d.type)&&!ps.path.route?.carryProp)return M.mm(M.translate(d.pos),M.mm(M.rotate([0,1,0],d.yaw*Math.PI/180),M.trs([0,0,0],IDENTITY_Q,[ps.scale,ps.scale,ps.scale])));}
 return M.mm(ps.root,local);
};
function handWorld11(p,side,t,tip=false){const n=castCache.get(p.id)?.find(n=>n.name===(side==='L'?'left':'right'));if(!n?.kind11)return M.add(p.pos,[0,1.4,0]);return M.point(castMatrix(p,n,t),M.add(n.anchor11,tip?[0,.15,.02]:[0,-.04,.02]));}
// Choreography-aware ribbons/laser: endpoints follow actual moving hands, not
// circles stuck at the original formation. Existing key moments remain intact.
drawAct8=function(a,t){const st=actState8(a,t);if(!st.visible)return;const cache=actCache.get(a.id);if(!cache)return;
 if(['dance','led_dance','laser','fan_dance','ribbon'].includes(a.type)&&cache.lines){const lines=[],ps=a.people.map(id=>seq.people.find(p=>p.id===id)).filter(Boolean);if(!ps.length)return;const count=cache.lines.p.length/18;
  for(let i=0;i<count;i++){const p=ps[i%ps.length],side=Math.floor(i/ps.length)%2?'R':'L',j=Math.floor(i/(ps.length*2));if(a.type==='laser'){const o=handWorld11(p,side,t,true),phase=st.t*.5,k=(j-1.5)*.16,dir=M.vector(M.rotate([0,1,0],(routePose11(p,t).yaw||0)*Math.PI/180),[Math.sin(k+phase*.15)*2,2.1+Math.cos(k)*.6,-1.8]);lines.push([o,M.add(o,dir)]);}else{const past=t-j*.045;lines.push([handWorld11(p,side,past,true),handWorld11(p,side,past-.043,true)]);}}
  lineGeometry8(cache.lines,lines,a.type==='laser'?.006:.015);cache.lines.actorMatrix=M.identity();engine.draw(cache.lines,0);return;
 }
 if(a.type==='water_drums'&&cache.drops){const C=cache.drops,p=C.mesh.p,unit=C.unit,ps=a.people.map(id=>seq.people.find(p=>p.id===id)).filter(Boolean);if(!ps.length)return;const beat=seq.bpm/60;
  for(let i=0;i<C.count;i++){const person=ps[i%ps.length],age=((st.t*beat*.5+i*.137)%1+1)%1,seconds=age*.66,theta=i*2.399963,r=age*(.18+(i%5)*.05),center=M.point(M.mm(M.translate(person.pos),M.rotate([0,1,0],person.yaw*Math.PI/180)),[0,.92,.70]),v=[center[0]+Math.cos(theta)*r,center[1]+(2.3+(i%4)*.18)*seconds-4.9*seconds*seconds,center[2]+Math.sin(theta)*r],size=Math.sin(age*Math.PI)*.75;
   for(let k=0;k<unit.length;k+=3){const o=i*unit.length+k;p[o]=v[0]+unit[k]*size;p[o+1]=v[1]+unit[k+1]*size;p[o+2]=v[2]+unit[k+2]*size;}}
  const b=engine.buffers.get(C.mesh.id);if(b){engine.gl.bindBuffer(engine.gl.ARRAY_BUFFER,b.buffers[0]);engine.gl.bufferSubData(engine.gl.ARRAY_BUFFER,0,p);}C.mesh.bounds=M.bbox(p);C.mesh.actorMatrix=M.identity();engine.draw(C.mesh,0);return;
 }
 return CH11.drawAct8(a,t);
};
// Art lighting for performers only; stage LEDs and imported surfaces untouched.
const DRAWCAST11=StageEngine.prototype.draw;
StageEngine.prototype.draw=function(mesh,mode=0,s=null,opacity=1){if(mode===0){this.selectPass(0);this.uniform('uActorArt11',mesh.cast11?choreo11.artFill:0);}return DRAWCAST11.call(this,mesh,mode,s,opacity);};
function loft11(profile,color,N=24){const p=[],n=[],uv=[],sample=(j,i)=>{const a=profile[j],prev=profile[Math.max(0,j-1)],next=profile[Math.min(profile.length-1,j+1)],t=i/N*Math.PI*2,ct=Math.cos(t),st=Math.sin(t),dy=Math.max(.0001,next[0]-prev[0]),drx=(next[1]-prev[1])/dy,drz=(next[2]-prev[2])/dy;return {p:[ct*a[1],a[0],st*a[2]],n:M.norm([ct/Math.max(a[1],.001),-(ct*ct*drx/Math.max(a[1],.001)+st*st*drz/Math.max(a[2],.001)),st/Math.max(a[2],.001)]),uv:[i/N,j/(profile.length-1)]};};for(let j=0;j<profile.length-1;j++)for(let i=0;i<N;i++){const a=sample(j,i),b=sample(j,i+1),c=sample(j+1,i+1),d=sample(j+1,i);for(const q of [a,b,c,a,c,d]){p.push(...q.p);n.push(...q.n);uv.push(...q.uv);}}return makeMesh('Sculpted loft',p,uv,n,{color});}
const CAST_DRAW11=StageEngine.prototype.drawCast;
StageEngine.prototype.drawCast=function(t){if(this!==engine)return;if(!this._contact11){const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d'),g=x.createRadialGradient(48,48,3,48,48,47);g.addColorStop(0,'rgba(0,0,0,0.25)');g.addColorStop(.35,'rgba(0,0,0,0.16)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,96,96);this._contact11=quadMesh('Preview contact shadow',[[-.42,.006,-.29],[.42,.006,-.29],[.42,.006,.29],[-.42,.006,.29]],{color:[.025,.025,.025,1],image:c});}
 const gl=this.gl,blend=gl.isEnabled(gl.BLEND),write=gl.getParameter(gl.DEPTH_WRITEMASK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);for(const p of seq.people){if(p.hidden||p.type==='audience'||!actPersonVisible8(p,t))continue;const path=routePose11(p,t);this._contact11.actorMatrix=M.mm(M.translate(path.pos),M.rotate([0,1,0],path.yaw*Math.PI/180));this.draw(this._contact11,0);}gl.depthMask(write);if(!blend)gl.disable(gl.BLEND);return CAST_DRAW11.call(this,t);};

/* Direct choreography editing: stage handles plus time-marker lane. */
const COLORS11=['#64ddd1','#d0a5ff','#f1c780','#90b8ff','#eb90aa','#90da98'];
function openChoreo11(cid=null){choreo11.open=true;stage10.mixerOpen=stage10.fxOpen=false;director.panel=null;director.mode='navigate';director.selection=null;director.cameraFollow=false;state.orbit=false;engine.view='stage';if(cid)choreo11.clip=cid;adoptSelection11();document.body.classList.add('inspector-open','choreo-open');toggleSequence(true);renderUI();}
function closeChoreo11(){choreo11.open=false;choreo11.place=false;document.body.classList.remove('choreo-open');renderUI();}
function selectKey11(id,{seek=true}={}){choreo11.key=id;const c=clip11(),k=route11()?.keys.find(k=>k.id===id);if(seek&&k&&c){setPlaying(false);seekTimeline(Math.min(c.start+c.duration-.001,c.start+k.u*c.duration));}renderPanel11();renderMarkerLane11();updatePaths11();}
function frameChoreo11(top=false){const c=clip11(),ps=people11(c),pts=[];for(const p of ps){const center=routePose11(p,state.time).pos;pts.push(M.add(center,[-.65,0,-.65]),M.add(center,[.65,p.height+.2,.65]));if(top){const r=route11(p.id,c?.id);for(const k of r?.keys||[])pts.push(keyWorld11(p,r,k),M.add(keyWorld11(p,r,k),[0,p.height,0]));}}if(!pts.length)return cameraPreset8('hero','stage');const b=M.bbox(pts.flat()),aspect=Math.max(.5,engine.canvas.clientWidth/Math.max(1,engine.canvas.clientHeight)),vfov=44*Math.PI/180;engine.camera.target=b.center;engine.camera.distance=Math.max(4.1,top?Math.max(b.size[0]/aspect,b.size[2])*1.65:Math.max(b.size[0]/aspect,b.size[1])*1.65);engine.camera.yaw=top?0:.12;engine.camera.pitch=top?Math.PI/2-.002:.16;engine.camera.fov=44;engine._fitOnResize=false;engine.cameraLocked=false;director.cameraFollow=false;state.orbit=false;}
function dedupeTimes11(r,k){r.keys=r.keys.filter(x=>x.id===k.id||Math.abs(x.u-k.u)>.001);r.keys.sort((a,b)=>a.u-b.u);}
function renderPanel11(){if(!choreo11.open)return;adoptSelection11();const host=$('inspectorContent'),c=clip11(),ps=people11(c),p=seq.people.find(p=>p.id===choreo11.person),r=route11(),k=r?.keys.find(k=>k.id===choreo11.key),wp=p&&r&&k?keyWorld11(p,r,k):null;
 $('inspectorKicker').textContent='CHOREOGRAPHY / POSITION + TIME';$('inspectorTitle').textContent='Bi\u00ean \u0111\u1ea1o s\u00e2n kh\u1ea5u';$('inspectorSubtitle').textContent='Ng\u01b0\u1eddi di chuy\u1ec3n theo m\u1ed1c. Gi\u1eef nguy\u00ean mapping.';
 host.innerHTML=`<div class="ch-top11"><span>POSITION KEYFRAMES</span><button class="icon-btn" id="chClose11" title="Dong">&#215;</button></div>
 <label class="ch-field11">Ti\u1ebft m\u1ee5c / clip<select id="chClip11">${choreoClipList11().map(x=>`<option value="${x.id}" ${x.id===c?.id?'selected':''}>${esc(x.name)} / ${x.start.toFixed(1)} - ${(x.start+x.duration).toFixed(1)}s</option>`).join('')}<option value="__show__" ${c?.id==='__show__'?'selected':''}>Ng\u01b0\u1eddi ri\xeang / c\u1ea3 show</option></select></label>
 <label class="ch-field11">Ng\u01b0\u1eddi c\u1ea7n ch\u1ec9nh<select id="chPerson11">${ps.map((x,i)=>`<option value="${x.id}" ${x.id===p?.id?'selected':''}>${String(i+1).padStart(2,'0')} / ${esc(x.name)}</option>`).join('')||'<option>Ch\u01b0a c\xf3 ng\u01b0\u1eddi trong ti\u1ebft m\u1ee5c</option>'}</select></label>
 <div class="ch-actions11"><button class="btn primary" id="chMark11" ${p?'':'disabled'}>+ M\u1ed1c t\u1ea1i time</button><button class="btn ${choreo11.place?'active':''}" id="chPlace11" ${p?'':'disabled'}>Click s\u00e0n</button></div>
 <p class="ch-note11">Ch\u1ecdn time, k\u00e9o ng\u01b0\u1eddi ho\u1eb7c click s\u00e0n \u0111\u1ec3 ghi v\u1ecb tr\u00ed. K\u00e9o ch\u1ea5m tr\u00ean s\u00e0n \u0111\u1ec3 s\u1eeda v\u1ecb tr\u00ed; k\u00e9o kim c\u01b0\u01a1ng tr\u00ean timeline \u0111\u1ec3 \u0111\u1ed5i time.</p>
 <div class="ch-stat11"><span><b id="chClock11">${(state.time-(c?.start||0)).toFixed(2)}s</b>TH\u1edcI GIAN CLIP</span><span><b>${r?.keys.length||0}</b>M\u1ed0C V\u1eca TR\xcd</span><span><b>${r?pathMetrics11(r).total.toFixed(1):'0.0'}m</b>\u0110\u01af\u1edcNG \u0110I</span></div>
 <div class="ch-keylist11">${(r?.keys||[]).map((x,i)=>`<button data-keyrow11="${x.id}" class="${x.id===k?.id?'active':''}"><i>${i+1}</i><b>${(x.u*c.duration).toFixed(2)}s</b><span>${ACT11[x.action]}</span><small>${x.offset[0].toFixed(1)}, ${x.offset[2].toFixed(1)}</small></button>`).join('')||'<p>B\u1ea5m + M\u1ed1c \u0111\u1ec3 b\u1eaft \u0111\u1ea7u bi\xean \u0111\u1ea1o.</p>'}</div>
 ${k?`<div class="ch-section11"><strong>MOC ${r.keys.indexOf(k)+1} / POSITION</strong><div class="ch-fields11"><label>Gi\u00e2y trong clip<input id="chTime11" type="number" min="0" max="${c.duration}" step=".1" value="${(k.u*c.duration).toFixed(2)}"></label><label>Huong<select id="chFace11"><option value="front">Nh\u00ecn kh\u00e1n gi\u1ea3</option><option value="path">Theo \u0111\u01b0\u1eddng \u0111i</option><option value="angle">G\u00f3c nh\u1eadp</option></select></label></div><div class="ch-fields11 three">${['X','Y','Z'].map((a,i)=>`<label>${a} / m<input id="chPos11_${i}" type="number" step=".1" value="${wp[i].toFixed(3)}"></label>`).join('')}</div><div class="ch-fields11"><label>\u0110\u1ed9ng t\u00e1c<select id="chAction11">${Object.entries(ACT11).map(([id,name])=>`<option value="${id}" ${k.action===id?'selected':''}>${name}</option>`).join('')}</select></label><label>Chuy\u1ec3n v\u1ecb tr\u00ed<select id="chEase11"><option value="smooth">T\u0103ng / gi\u1ea3m t\u1ed1c</option><option value="linear">\u0110\u1ec1u t\u1ed1c</option><option value="curve">\u0110\u01b0\u1eddng cong</option><option value="hold">Gi\u1eef r\u1ed3i chuy\u1ec3n</option></select></label></div><div class="ch-fields11"><label>G\xf3c / \u0111\u1ed9<input id="chYaw11" type="number" step="5" value="${k.yaw}"></label><label>Bi\xean \u0111\u1ed9<input id="chEnergy11" type="range" min="0" max="1" step=".05" value="${k.energy}"></label></div><button class="btn ch-danger11" id="chDelete11">X\u00f3a m\u1ed1c \u0111ang ch\u1ecdn</button></div>`:''}
 <div class="ch-section11"><strong>\u0110\u1ed8I H\xccNH / M\u1ed0C CHO C\u1ea2 NH\xd3M</strong><div class="ch-formation11">${[['entrance','Ra s\u00e0n / r\u00fat c\u00e1nh'],['vline','Ch\u1eef V > h\u00e0ng ngang'],['circle','V\u00f2ng tr\u00f2n'],['wave','Ti\u1ebfn / l\u00f9i'],['hold','T\u1ea1i ch\u1ed7 / d\u1eebng']].map(([id,label])=>`<button data-form11="${id}">${label}</button>`).join('')}</div></div>
 <div class="ch-section11"><strong>DUY\u1ec6T CHUY\u1ec2N \u0110\u1ed8NG</strong><div class="ch-actions11"><button class="btn" id="chPlay11">Ph\u00e1t \u0111o\u1ea1n</button><button class="btn" id="chLoop11">L\u1eb7p \u0111o\u1ea1n</button><button class="btn" id="chTop11">Top</button><button class="btn" id="chFrame11">C\u0103n ng\u01b0\u1eddi</button></div><label class="check-row"><input id="chPaths11" type="checkbox" ${choreo11.showPaths?'checked':''}>Hi\u1ec7n \u0111\u01b0\u1eddng + m\u1ed1c time</label><label class="check-row"><input id="chAll11" type="checkbox" ${choreo11.allPaths?'checked':''}>Hi\u1ec7n \u0111\u01b0\u1eddng c\u1ee7a c\u1ea3 nh\u00f3m</label>${r?`<label class="check-row"><input id="chCarry11" type="checkbox" ${r.carryProp?'checked':''}>\u0110\u1ea1o c\u1ee5 \u0111i c\u00f9ng ng\u01b0\u1eddi</label>`:''}<button class="btn full-btn" id="chCheck11">Ki\u1ec3m tra kho\u1ea3ng c\u00e1ch</button><p class="ch-warning11" id="chWarnings11"></p></div>
 <div class="ch-section11"><strong>M\u1ef8 THU\u1eacT / NH\xc2N V\u1eacT</strong><div class="ch-actions11">${Object.keys(CLOTH11).map(s=>`<button data-style11="${s}" class="btn ${choreo11.style===s?'active':''}">${s}</button>`).join('')}</div><label class="ch-field11">Ch\u1ea5t l\u01b0\u1ee3ng<select id="chQuality11"><option value="studio">Studio / chi ti\u1ebft</option><option value="light">Nh\u1eb9 / preview</option></select></label><label class="ch-field11">\xc1nh s\xe1ng b\xf9 nh\xe2n v\u1eadt<input id="chFill11" type="range" min="0" max=".8" step=".02" value="${choreo11.artFill}"></label><button class="btn full-btn" id="chExport11">Xu\u1ea5t b\u1ea3ng m\u1ed1c JSON</button><p class="ch-note11">Chuy\u1ec3n \u0111\u1ed9ng th\u1ee7 t\u1ee5c / previz. Ch\u01b0a ph\u1ea3i mocap; ch\u01b0a t\u1ef1 tr\xe1nh ng\u01b0\u1eddi ho\u1eb7c v\u1eadt c\u1ea3n.</p></div>`;
 const changeKey=fn=>()=>{checkpoint();fn();dirty11();renderPanel11();renderMarkerLane11();};
 $('chClose11').onclick=closeChoreo11;$('chClip11').onchange=e=>{choreo11.clip=e.target.value;choreo11.person=null;choreo11.key=null;adoptSelection11();renderUI();};$('chPerson11').onchange=e=>{choreo11.person=e.target.value;choreo11.key=null;adoptSelection11();renderPanel11();renderMarkerLane11();};
 $('chMark11').onclick=()=>{checkpoint();const world=routePose11(p,state.time).pos;setWaypoint11(p.id,c.id,state.time,world);renderPanel11();renderMarkerLane11();};$('chPlace11').onclick=()=>{setPlaying(false);choreo11.place=!choreo11.place;renderPanel11();toast(choreo11.place?'Click len san de ghi moc tai time hien tai.':'Da tat dat moc.');};
 host.querySelectorAll('[data-keyrow11]').forEach(b=>b.onclick=()=>selectKey11(b.dataset.keyrow11));
 if(k){$('chFace11').value=k.face;$('chEase11').value=k.ease;$('chTime11').onchange=changeKey(()=>{k.u=clamp(+$('chTime11').value/c.duration,0,1);dedupeTimes11(r,k);});for(let i=0;i<3;i++)$('chPos11_'+i).onchange=changeKey(()=>{k.offset=worldOffset11(p,r,[0,1,2].map(j=>finite11($('chPos11_'+j).value,wp[j])));});$('chFace11').onchange=changeKey(()=>k.face=$('chFace11').value);$('chAction11').onchange=changeKey(()=>k.action=$('chAction11').value);$('chEase11').onchange=changeKey(()=>k.ease=$('chEase11').value);$('chYaw11').onchange=changeKey(()=>k.yaw=finite11($('chYaw11').value));$('chEnergy11').onchange=changeKey(()=>k.energy=clamp(+$('chEnergy11').value,0,1));$('chDelete11').onclick=changeKey(()=>{r.keys=r.keys.filter(x=>x.id!==k.id);choreo11.key=r.keys[0]?.id;});}
 host.querySelectorAll('[data-form11]').forEach(b=>b.onclick=()=>{if(ps.some(p=>route11(p.id,c.id)?.keys.length))dialog('Thay cac moc cua nhom?','<p>Chi thay duong dien trong clip dang chon. Mapping, den va model duoc giu nguyen. Co Ctrl+Z.</p>',[{label:'Huy'},{label:'Tao doi hinh',primary:true,action:()=>formation11(b.dataset.form11)}]);else formation11(b.dataset.form11);});
 $('chPlay11').onclick=()=>{if(c.id!=='__show__')playClip10(c.id,false);else{seq.enabled=true;seekTimeline(0);setPlaying(true);}};$('chLoop11').onclick=()=>{if(c.id!=='__show__')playClip10(c.id,true);};$('chTop11').onclick=()=>frameChoreo11(true);$('chFrame11').onclick=()=>frameChoreo11(false);$('chPaths11').onchange=e=>choreo11.showPaths=e.target.checked;$('chAll11').onchange=e=>choreo11.allPaths=e.target.checked;if($('chCarry11'))$('chCarry11').onchange=changeKey(()=>r.carryProp=$('chCarry11').checked);
 $('chCheck11').onclick=()=>{const w=pathRisks11();$('chWarnings11').textContent=w.length?'Khoang cach < 0.45m: '+w.map(x=>x.time+'s / '+x.a+' - '+x.b).join('; '):'Khong thay cap nao < 0.45m trong 41 moc lay mau. Van can duyet vat can.';};
 $('chQuality11').value=choreo11.quality;$('chQuality11').onchange=()=>{checkpoint();choreo11.quality=$('chQuality11').value;rebuildCast();dirty11();};$('chFill11').oninput=e=>choreo11.artFill=+e.target.value;host.querySelectorAll('[data-style11]').forEach(b=>b.onclick=()=>{checkpoint();choreo11.style=b.dataset.style11;for(const pp of ps)pp.color=CLOTH11[choreo11.style].coat;rebuildCast();renderPanel11();});$('chExport11').onclick=()=>downloadText('ALPHA_Choreography_Marks.json',JSON.stringify({format:'ALPHA_CHOREOGRAPHY/1',coordinates:'Y-up metres, offsets in performer base frame',data:routeData11(),clips:seq.clips.filter(c=>choreo11.routes.some(r=>r.clip===c.id)).map(c=>({id:c.id,name:c.name,start:c.start,duration:c.duration})),performers:seq.people.map(p=>({id:p.id,name:p.name,pos:p.pos,yaw:p.yaw,height:p.height}))},null,2));
}
function renderMarkerLane11(){const old=$('chLaneRow11');if(old)old.remove();if(!seq.open||!choreo11.open||!$('seqInner'))return;adoptSelection11();const c=clip11(),p=seq.people.find(p=>p.id===choreo11.person),r=route11();if(!c||!p)return;const row=document.createElement('div');row.id='chLaneRow11';row.className='seq-row ch-timerow11';row.innerHTML=`<div class="seq-label"><b>\u0110\u01af\u1edcNG \u0110I / ${esc(p.name)}</b></div><div class="ch-timelane11" style="width:${Math.max(300,state.duration*seq.pps)}px"><div class="ch-timespan11" style="left:${c.start*seq.pps}px;width:${c.duration*seq.pps}px"></div>${(r?.keys||[]).map((k,i)=>`<button class="ch-timekey11 ${k.id===choreo11.key?'selected':''}" data-timekey11="${k.id}" style="left:${(c.start+k.u*c.duration)*seq.pps}px" title="Moc ${i+1}: ${(k.u*c.duration).toFixed(2)}s"><i></i><span>${(k.u*c.duration).toFixed(1)}s</span></button>`).join('')}</div>`;const after=$('seqInner').querySelector('.scene-row10')||$('seqRuler');after.after(row);
 row.querySelectorAll('[data-timekey11]').forEach(b=>b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();checkpoint();const k=r.keys.find(k=>k.id===b.dataset.timekey11),start=e.clientX,u0=k.u;choreo11.key=k.id;setPlaying(false);b.setPointerCapture(e.pointerId);sq.drag=true;
 const move=ev=>{const time=c.start+u0*c.duration+(ev.clientX-start)/seq.pps;k.u=clamp((snapTime(time)-c.start)/c.duration,0,1);dirty11();b.style.left=(c.start+k.u*c.duration)*seq.pps+'px';b.querySelector('span').textContent=(k.u*c.duration).toFixed(1)+'s';seekTimeline(Math.min(c.start+c.duration-.001,c.start+k.u*c.duration));};
 const end=ev=>{b.removeEventListener('pointermove',move);b.removeEventListener('pointerup',end);b.removeEventListener('pointercancel',cancel);sq.drag=false;dedupeTimes11(r,k);dirty11();selectKey11(k.id);};const cancel=ev=>{k.u=u0;end(ev);};b.addEventListener('pointermove',move);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',cancel);
 });row.querySelector('.ch-timelane11').ondblclick=e=>{if(e.target.closest('[data-timekey11]'))return;const time=snapTime((e.clientX-e.currentTarget.getBoundingClientRect().left)/seq.pps);setPlaying(false);seekTimeline(clamp(time,c.start,c.start+c.duration-.001));checkpoint();setWaypoint11(p.id,c.id,state.time,routePose11(p,state.time).pos);renderPanel11();renderMarkerLane11();};}
function ensurePaths11(){if($('chPathsOverlay11'))return;const el=document.createElement('div');el.id='chPathsOverlay11';el.innerHTML='<svg id="chSVG11"></svg><div id="chMarkers11"></div><div id="chHint11">POSITION + TIME / Keo moc tren san</div>';$('viewport').appendChild(el);}
function screen11(p){const q=engine.project(p);return q&&q.z>=-1&&q.z<=1?q:null;}
function updatePaths11(){ensurePaths11();const root=$('chPathsOverlay11'),show=choreo11.open&&choreo11.showPaths&&engine.view==='stage'&&!state.presenting;root.hidden=!show;if(!show)return;const c=clip11();if(!c)return;const ps=people11(c),W=engine.canvas.clientWidth,H=engine.canvas.clientHeight;$('chSVG11').setAttribute('viewBox',`0 0 ${W} ${H}`);const lines=[],selected=seq.people.find(p=>p.id===choreo11.person);
 for(let i=0;i<ps.length;i++){const p=ps[i],r=route11(p.id,c.id);if(!r||(!choreo11.allPaths&&p.id!==choreo11.person))continue;const points=pathMetrics11(r).points.map(v=>screen11(M.point(baseFrame11(p,r),v))).filter(Boolean);if(points.length>1)lines.push(`<path d="${points.map((v,j)=>(j?'L':'M')+v.x.toFixed(1)+','+v.y.toFixed(1)).join(' ')}" stroke="${COLORS11[i%COLORS11.length]}" stroke-width="${p.id===choreo11.person?2.5:1.3}" stroke-dasharray="${p.id===choreo11.person?'0':'5 5'}" opacity="${p.id===choreo11.person?1:.55}" fill="none"/>`);const now=screen11(routePose11(p,state.time).pos);if(now)lines.push(`<circle cx="${now.x}" cy="${now.y}" r="${p.id===choreo11.person?9:5}" fill="#081a24" stroke="${COLORS11[i%COLORS11.length]}" stroke-width="2"/>`);}
 $('chSVG11').innerHTML=lines.join('');const r=route11(),holder=$('chMarkers11'),signature=[choreo11.person,...(r?.keys||[]).map(k=>k.id)].join('|');if(holder.dataset.signature!==signature){holder.dataset.signature=signature;holder.innerHTML=(r?.keys||[]).map((k,i)=>`<button data-waypoint11="${k.id}" title="Keo vi tri moc ${i+1}"><b>${i+1}</b><span></span></button>`).join('');holder.querySelectorAll('[data-waypoint11]').forEach(b=>b.addEventListener('pointerdown',e=>startPathDrag11(e,b.dataset.waypoint11)));}
 if(selected&&r){const used=[];for(const k of r.keys){const b=holder.querySelector('[data-waypoint11="'+k.id+'"]'),q=screen11(keyWorld11(selected,r,k));if(!b)continue;b.style.display=q?'':'none';if(q){const overlap=used.filter(v=>Math.hypot(v.x-q.x,v.y-q.y)<24).length;used.push(q);const dx=overlap*32,dy=overlap%2?24:0;b.style.transform=`translate(${q.x+dx}px,${q.y+dy}px)`;b.style.zIndex=k.id===choreo11.key?'5':'3';b.classList.toggle('active',k.id===choreo11.key);b.querySelector('span').textContent=(k.u*c.duration).toFixed(2)+'s';if(overlap)lines.push(`<path d="M${q.x},${q.y} L${q.x+dx},${q.y+dy}" stroke="#749f99" stroke-width="1" fill="none"/>`);}}$('chSVG11').innerHTML=lines.join('');}
 setText('chClock11',Math.max(0,state.time-c.start).toFixed(2)+'s');setText('chHint11',choreo11.place?'CLICK SAN / GHI MOC TAI '+(state.time-c.start).toFixed(2)+'s':'\u0110\u01af\u1edcNG \u0110I / Moc tuong doi theo thoi luong clip');}
function startPathDrag11(e,id,actor=false){if(e.button!==0)return;const p=seq.people.find(p=>p.id===choreo11.person),c=clip11();if(!p||!c)return;e.preventDefault();e.stopImmediatePropagation();setPlaying(false);checkpoint();const prior=route11()?structuredClone(route11()):null;let r=ensureRoute11(p,c),k;
 if(actor)k=setWaypoint11(p.id,c.id,state.time,routePose11(p,state.time).pos);else k=r.keys.find(k=>k.id===id);if(!k)return;choreo11.key=k.id;const world=keyWorld11(p,r,k),hit=dirPlane(dirRay(e.clientX,e.clientY),world,[0,1,0]);choreo11.drag={p,c,r,k,world,hit,prior,x:e.clientX,y:e.clientY,offset:[...k.offset],element:e.currentTarget};try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){};}
function movePathDrag11(e){const d=choreo11.drag;if(!d)return;e.preventDefault();e.stopImmediatePropagation();const pt=dirPlane(dirRay(e.clientX,e.clientY),d.world,[0,1,0]);if(!pt||!d.hit)return;const pos=M.add(d.world,M.sub(pt,d.hit));if(e.shiftKey){pos[0]=Math.round(pos[0]*10)/10;pos[2]=Math.round(pos[2]*10)/10;}d.k.offset=worldOffset11(d.p,d.r,pos);dirty11();}
function finishPathDrag11(e,cancel=false){const d=choreo11.drag;if(!d)return;if(e){e.preventDefault();e.stopImmediatePropagation();}if(cancel){choreo11.routes=choreo11.routes.filter(r=>!(r.person===d.p.id&&r.clip===d.c.id));if(d.prior)choreo11.routes.push(d.prior);}choreo11.drag=null;dirty11();renderPanel11();renderMarkerLane11();}
function pickCast11(x,y){const ray=dirRay(x,y);let best=null;for(const p of people11()){if(p.hidden||!actPersonVisible8(p,state.time))continue;for(const node of castCache.get(p.id)||[])for(const m of node.meshes){const hit=rayMesh8(ray,m,castMatrix(p,node,state.time));if(hit&&(!best||hit.distance<best.distance))best={...hit,p};}}return best;}
function initChoreo11(){document.title='ALPHA V11 / CHOREOGRAPHY';document.querySelector('.bottom-status span:last-child').textContent='ALPHA / LOCAL BUILD 1.1';document.querySelector('.brand small').textContent='V11 / CHOREOGRAPHY + ART DIRECTION';const b=document.createElement('button');b.id='choreoToggle11';b.textContent='Bi\u00ean \u0111\u1ea1o';b.className='btn primary';b.onclick=()=>choreo11.open?closeChoreo11():openChoreo11();$('dirToolbar').prepend(b);ensurePaths11();
 document.addEventListener('pointerdown',e=>{if(!choreo11.open||e.button!==0||e.target!==engine.canvas||engine.view!=='stage'||state.presenting)return;const p=seq.people.find(p=>p.id===choreo11.person),c=clip11();if(!p||!c)return;if(choreo11.place){e.preventDefault();e.stopImmediatePropagation();setPlaying(false);const hit=engine.pick(e.clientX,e.clientY,false),ray=dirRay(e.clientX,e.clientY);let pos=hit&&Math.abs(hit.normal[1])>.65?hit.point:dirPlane(ray,[0,p.pos[1],0],[0,1,0]);if(pos){checkpoint();setWaypoint11(p.id,c.id,state.time,pos);choreo11.place=false;renderPanel11();renderMarkerLane11();}return;}const hit=pickCast11(e.clientX,e.clientY);if(hit){choreo11.person=hit.p.id;startPathDrag11(e,null,true);}},true);
 document.addEventListener('pointermove',e=>{if(choreo11.drag)movePathDrag11(e);},true);document.addEventListener('pointerup',e=>{if(choreo11.drag)finishPathDrag11(e);},true);document.addEventListener('pointercancel',e=>{if(choreo11.drag)finishPathDrag11(e,true);},true);window.addEventListener('blur',()=>{if(choreo11.drag)finishPathDrag11(null,true);});document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(choreo11.drag)finishPathDrag11(null,true);choreo11.place=false;}},true);rebuildCast();renderUI();}
renderUI=function(){CH11.renderUI();if(choreo11.open)renderPanel11();if(!choreo11.drag)renderMarkerLane11();$('choreoToggle11')?.classList.toggle('active',choreo11.open);};
renderSequence=function(){CH11.renderSequence();if(!choreo11.drag)renderMarkerLane11();};renderOverlays=function(){CH11.renderOverlays();updatePaths11();};
updateStableControls=function(){CH11.updateStableControls();if(choreo11.open){const c=clip11();if(c)setText('chClock11',(state.time-c.start).toFixed(2)+'s');}};
openFX10=function(){choreo11.open=false;document.body.classList.remove('choreo-open');return CH11.openFX10();};openMixer10=function(){choreo11.open=false;document.body.classList.remove('choreo-open');return CH11.openMixer10();};
editClip=function(id,type){CH11.editClip(id,type);const c=seq.clips.find(c=>c.id===id);if(c&&seq.tracks.find(t=>t.id===c.track)?.type==='act'){const b=document.createElement('button');b.className='btn primary';b.textContent='BIEN DAO / \u0110\u01af\u1edcNG \u0110I';b.onclick=()=>{$('modal').close();openChoreo11(c.id);};$('modalActions').prepend(b);}};
const choreo11API={choreo11,openChoreo11,closeChoreo11,routeData11,routeAt11,routePose11,pathMetrics11,setWaypoint11,formation11,frameChoreo11,pose11,handWorld11,clip11,route11,keyWorld11,restoreChoreo11,pathRisks11,validateRoutes11,people11};

async function createChoreoDemo11(){
 setPlaying(false);demo();seq.people=[];director.acts=[];seq.clips=[];seq.tracks=[];stage10.scenes=[];choreo11.routes=[];state.duration=36;
 const z=.35,y=deckY(0,z),acts=[];
 for(const [type,start,duration,name]of [['led_dance',0,16,'01 / Mua LED - Ra san, doi hinh'],['water_drums',16,8,'02 / Trong nuoc - Crescendo'],['laser',24,12,'03 / Laser - Doi canh']]){
  const a=addAct8(type,{name,pos:[0,y,z]}),c=addActClip8(a.id,{name,start,duration,cycle10:8,loop:true,fade:0});acts.push({a,c});
  const scene={id:uid('scene'),name,start,duration,actId:a.id,clipIds:[c.id],color:start===0?'#58b7b1':start===16?'#899acb':'#b595cb'};c.scene10=scene.id;stage10.scenes.push(scene);
  const visual=addClip(track10('visual','all','VISUAL / CHOREOGRAPHY').id,{name:'Visual / '+name,start,duration,source:'motion:'+(start===16?1:0),in:0,rate:.55,loop:true,gain:.62,fade:.5});linkSceneClip10(scene,visual);
  choreo11.clip=c.id;choreo11.person=a.people[0];formation11(type==='water_drums'?'hold':type==='laser'?'wave':'entrance',{record:false,span:4.8,depth:1.6});
 }
 for(const p of seq.people){p.color=CLOTH11.midnight.coat;p.skin=['#c49372','#b87b60','#d4ac87'][seq.people.indexOf(p)%3];}
 const {a,c}=acts[0];for(let i=0;i<a.people.length;i++){const r=route11(a.people[i],c.id),p=seq.people.find(x=>x.id===a.people[i]),x=(i-1.5)*1.22,side=i<2?-1:1;const plan=[[0,[side*(4.0+(i%2)*.15),y,z-.7-(i%2)*.75],'walk'],[.26,[x,y,z+.25],'dance'],[.50,[x*.78,y,z+1.05],'reach'],[.72,[x,y,z+.4],'turn'],[1,[x,y,z+.65],'hold']];r.keys=plan.map(([u,world,action])=>key11(u,worldOffset11(p,r,world),{action,face:action==='walk'?'path':'front',ease:'smooth',energy:.7}));}
 engine.settings.ambient=.36;engine.settings.exposure=.9;engine.settings.beam=.22;engine.settings.haze=12;engine.lights.forEach((l,i)=>{l.power=1.3;l.angle=18;l.color=i%2?'#efc79f':'#90d6ea';l.target=[(i/7-.5)*5,y+1.1,1];l.sweep=false;});engine.rebuildFixtures();engine.accent='#ffb680';stage10.castFill=.18;choreo11.artFill=.27;
 await addMusicFile(demoMusicFile(),{silent:true});live.audioMode='music';addClip(track10('audio','all','MUSIC / REHEARSAL').id,{name:'Rehearsal beat',source:'music',start:0,duration:36,loop:true,gain:.65,fade:.4});
 seq.enabled=true;seq.animate=true;seq.pps=31;seq.snap=false;state.model.name='ALPHA_V11_Choreography_36s';state.time=5.8;choreo11.clip=acts[0].c.id;choreo11.person=acts[0].a.people[0];choreo11.key=route11()?.keys[1]?.id;dirty11();rebuildCast();rebuildActCache();openChoreo11(acts[0].c.id);frameChoreo11(false);engine.camera.distance*=1.08;engine.camera.pitch=.28;engine.autoQuality=false;engine.previewScale=1;engine.showGuides=false;state.history=[];state.redo=[];renderUI();return acts;
}
const INIT_CHOREO11=initChoreo11;
initChoreo11=function(){INIT_CHOREO11();const b=document.createElement('button');b.className='btn small';b.id='chDemo11';b.textContent='Demo bien dao';b.onclick=()=>dialog('Mo demo bien dao?', '<p>Demo thay san khau, timeline va nhac hien tai. Hay luu .ledstudio truoc.</p>',[{label:'Huy'},{label:'Mo demo 36s',primary:true,action:()=>createChoreoDemo11().catch(e=>toast(e.message))}]);document.querySelector('.media-section').appendChild(b);};

try{engine=new StageEngine($('glcanvas'));initEvents();initSpatialEvents();initStableEvents();initLiveEvents();demo();initV07();initDirector8();initControl9();initStage10();initChoreo11();historyButtons();requestAnimationFrame(loop);window.STUDIO={...spatialAPI,...stableAPI,...liveAPI,...v07API,...v08API,...groups9API,...lighting9API,...music9API,...control9API,...stage10API,...choreo11API,createChoreoDemo11,version:"1.1.0",repairMapping3D,sourceForSurface,detectLEDCandidates,startRebindSurface,completeRebind,focusLED3D,autoDetect,get engine(){return engine},state,importModel,addMediaFile,assignMaster,createSurface,addFromSelection,frontHit,faceMesh,buildProjectData142,saveProject,loadProject,mappingData,renderUI,exportShot,exportMapPNG,recordPreview,demo,rigPreset,finishQuad,selectSurface,setStep,serialize:()=>mappingData(),stats:()=>({meshes:engine.stage.length,screens:engine.surfaces.length,lights:engine.lights.length,media:state.media.length,vertices:engine.stage.reduce((s,m)=>s+m.p.length/3,0),webgl:!!engine.gl})};}catch(err){$('engineState').textContent='Engine error';dialog('Khong khoi dong duoc 3D','<p>'+esc(err.message)+'</p><p>Mo bang Chrome / Edge va bat tang toc phan cung. Trinh xem file trong chat khong phai moi truong chay day du.</p>');console.error(err)}
