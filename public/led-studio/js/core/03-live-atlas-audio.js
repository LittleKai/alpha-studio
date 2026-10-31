/* V0.5 renderer maintenance: no geometry/UV changes to user models. */
const perfState={fps:0,p95:0,frameTimes:[],lastReport:0,lastAdjust:0,lowWindows:0,highWindows:0,
  uploadedFrames:0,draws:0,cpuMs:0,qualityChanges:0,target:55,lastOverlay:0,lastLabels:0,lastNow:0};
const PERF_BASE={draw:StageEngine.prototype.draw,render:StageEngine.prototype.render,
 uniform:StageEngine.prototype.uniform,releaseMesh:StageEngine.prototype.releaseMesh};
const sharedUniformNames=new Set(['uVP','uEye','uTime','uAmbient','uExposure','uHaze','uAccent','uMaster','uLightCount','uLightPos[0]','uLightDir[0]','uLightColor[0]','uLightCone[0]','uBeamMatrix']);
StageEngine.prototype.loc=function(name){this._programLocations ||= new Map();if(!this._programLocations.has(this.program))this._programLocations.set(this.program,{});const locations=this._programLocations.get(this.program);return name in locations?locations[name]:(locations[name]=this.gl.getUniformLocation(this.program,name));};
StageEngine.prototype.selectPass=function(mode){
 const program=this.programs?.[mode];if(!program||this.program===program)return;
 this.program=program;this.gl.useProgram(program);
 const uniforms=[...(this._sharedUniforms||[])];for(const [name,args]of uniforms)this.uniform(name,args.value,args.type);
};
StageEngine.prototype.uniform=function(name,value,type){
 this._sharedUniforms ||= new Map();if(sharedUniformNames.has(name))this._sharedUniforms.set(name,{value,type});
 this._programUniforms ||= new Map();if(!this._programUniforms.has(this.program))this._programUniforms.set(this.program,new Map());this._uniformCache=this._programUniforms.get(this.program);
 if(typeof value==='number'){
  const key=name+':'+(type||'f');if(this._uniformCache.get(key)===value)return;
  this._uniformCache.set(key,value);
 }else if(value&&value.length<=4&&type!=='3a'&&type!=='1a'){
  const key=name+':'+(type||'v'),old=this._uniformCache.get(key);
  if(old&&old.length===value.length&&old.every((v,i)=>v===value[i]))return;
  this._uniformCache.set(key,Array.from(value));
 }
 return PERF_BASE.uniform.call(this,name,value,type);
};
StageEngine.prototype.texture=function(source){
 const gl=this.gl;if(!source)return this.white;
 let t=this.texCache.get(source);
 const video=source instanceof HTMLVideoElement;
 if(!t){
  t={tex:gl.createTexture(),uploaded:false,lastTime:-1,version:0,uploadedVersion:-1,width:0,height:0};
  this.texCache.set(source,t);gl.bindTexture(gl.TEXTURE_2D,t.tex);
  for(const [p,v]of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,p,v);
  if(video&&source.requestVideoFrameCallback){
   const tick=()=>{if(this.texCache.get(source)!==t)return;t.version++;t.callback=source.requestVideoFrameCallback(tick);};
   t.callback=source.requestVideoFrameCallback(tick);t.useCallback=true;
   source.addEventListener('seeked',()=>{t.version++;});
  }
 }
 if(video&&source.readyState<2)return t.uploaded?t.tex:this.white;
 const changed=!t.uploaded||(video&&(t.useCallback?t.version!==t.uploadedVersion:Math.abs(source.currentTime-t.lastTime)>.0001));
 if(changed){
  try{
   const w=video?source.videoWidth:source.naturalWidth||source.width,h=video?source.videoHeight:source.naturalHeight||source.height;
   gl.bindTexture(gl.TEXTURE_2D,t.tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
   if(t.uploaded&&t.width===w&&t.height===h)gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,source);
   else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
   t.uploaded=true;t.width=w;t.height=h;t.lastTime=video?source.currentTime:0;t.uploadedVersion=t.version;
   if(video)perfState.uploadedFrames++;
  }catch(e){return this.white;}
 }
 return t.tex;
};
StageEngine.prototype.releaseMesh=function(mesh){
 if(!mesh)return;
 if(this._batchSourceIds?.has(mesh.id))this._stageBatchDirty=true;
 return PERF_BASE.releaseMesh.call(this,mesh);
};
StageEngine.prototype.stageDrawMeshes=function(){
 // Original meshes remain untouched for picking, calibration and persistence.
 const visibility=this.stage.map(m=>m.id+(m.hidden?':h':'')).join('|');
 if(this._stageBatchRef===this.stage&&!this._stageBatchDirty&&this._batchVisibility===visibility)return this._stageBatches;
 if(this._ownedBatches)for(const m of this._ownedBatches)PERF_BASE.releaseMesh.call(this,m);
 this._ownedBatches=[];this._stageBatches=[];this._batchSourceIds=new Set(this.stage.map(m=>m.id));
 const groups=new Map(),imageIds=new Map();let imageNumber=0;
 for(const m of this.stage){
  if(m.hidden)continue;const mat=m.material||{};
  if(mat.image&&!imageIds.has(mat.image))imageIds.set(mat.image,++imageNumber);
  const key=JSON.stringify([mat.color||null,mat.emissive||null,mat.alphaCutoff||0,imageIds.get(mat.image)||0]);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);
 }
 for(const group of groups.values()){
  const count=group.reduce((n,m)=>n+m.p.length,0);
  if(group.length===1||count>6000000){this._stageBatches.push(...group);continue;}
  const p=new Float32Array(count),n=new Float32Array(count),uv=new Float32Array(count/3*2);let a=0,b=0;
  for(const m of group){p.set(m.p,a);n.set(m.n,a);uv.set(m.uv,b);a+=m.p.length;b+=m.uv.length;}
  const batched=makeMesh('Opaque stage batch',p,uv,n,group[0].material);
  this._ownedBatches.push(batched);this._stageBatches.push(batched);
 }
 this._batchVisibility=visibility;this._stageBatchDirty=false;this._stageBatchRef=this.stage;
 return this._stageBatches;
};
StageEngine.prototype.makeBeam=function(light){
 this.selectPass(2);
 if(!this._unitBeam){
  const p=[],uv=[],norm=[];const N=16;
  for(let i=0;i<N;i++){
   const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2;
   const points=[[Math.cos(a)*.012,0,Math.sin(a)*.012],[Math.cos(a),1,Math.sin(a)],[Math.cos(b),1,Math.sin(b)]];
   p.push(...points.flat());uv.push(0,0,0,1,1,1);
   for(const theta of [a,a,b])norm.push(Math.cos(theta),-1,Math.sin(theta));
  }
  this._unitBeam=makeMesh('Reusable light cone',p,uv,norm,{color:[1,1,1,1]});
 }
 const d=light._direction||[0,-1,0],origin=light.pos;
 const len=Math.max(.1,Math.min(this.size.width*1.1,Math.hypot(...M.sub(light._target||light.target,origin))+3));
 const radius=Math.tan(light.angle*Math.PI/180)*len*.55;
 const right=M.norm(M.cross(d,Math.abs(d[1])>.95?[1,0,0]:[0,1,0])),up=M.cross(right,d);
 this.uniform('uBeamMatrix',new Float32Array([right[0]*radius,right[1]*radius,right[2]*radius,0,d[0]*len,d[1]*len,d[2]*len,0,up[0]*radius,up[1]*radius,up[2]*radius,0,...origin,1]),'m');
 this.gl.uniformMatrix3fv(this.loc('uBeamNormal'),false,new Float32Array([right[0]/radius,right[1]/radius,right[2]/radius,d[0]/len,d[1]/len,d[2]/len,up[0]/radius,up[1]/radius,up[2]/radius]));
 this._unitBeam.material.color=[...hexrgb(light.color),1];return this._unitBeam;
};
StageEngine.prototype.draw=function(mesh,mode=0,surface=null,opacity=1){
 perfState.draws++;this.selectPass(mode);
 if(mode===1)applyLiveUniforms.call(this,surface);
 return PERF_BASE.draw.call(this,mesh,mode,surface,opacity);
};
StageEngine.prototype.render=function(time=0,options={}){
 const t=performance.now();perfState.draws=0;
 // Upload new decoded frames BEFORE beginning scene draw calls.
 this.gl.activeTexture(this.gl.TEXTURE0);
 for(const a of activeVideos())if(a.element.readyState>=2)this.texture(a.element);
 this.gl.useProgram(this.program);
 this.uniform('uLightCount',Math.min(16,this.lights.length),'i');
 const canvas=PERF_BASE.render.call(this,time,options);perfState.cpuMs=performance.now()-t;return canvas;
};
function reportPerformance(now,dt){
 if(dt>0&&dt<15){perfState.frameTimes.push(dt*1000);if(perfState.frameTimes.length>180)perfState.frameTimes.shift();}
 if(now-perfState.lastReport<1000)return;
 const times=[];let sum=0;for(let i=perfState.frameTimes.length-1;i>=0;i--){times.unshift(perfState.frameTimes[i]);sum+=perfState.frameTimes[i];if(sum>=1500)break;}const sorted=[...times].sort((a,b)=>a-b);
 perfState.fps=sum?times.length*1000/sum:0;perfState.p95=sorted[Math.floor(sorted.length*.95)]||0;perfState.lastReport=now;
 if(engine.autoQuality&&now-perfState.lastAdjust>3000&&times.length>=5&&!state.recording){
  const fps=perfState.fps;let scale=engine.previewScale||1;
  if(fps<50){perfState.lowWindows++;perfState.highWindows=0;}else if(fps>58){perfState.highWindows++;perfState.lowWindows=0;}else{perfState.lowWindows=0;perfState.highWindows=0;}
  if(perfState.lowWindows>=1&&scale>.45){scale=Math.max(.45,Math.round((scale-.1)*100)/100);perfState.lowWindows=0;}
  else if(perfState.highWindows>=6&&scale<1){scale=Math.min(1,Math.round((scale+.05)*100)/100);perfState.highWindows=0;}
  if(scale!==engine.previewScale){engine.previewScale=scale;perfState.qualityChanges++;perfState.lastAdjust=now;}
 }
 setText('fps',Math.round(perfState.fps)+' FPS / '+Math.round((engine.previewScale||1)*100)+'%');
 setText('liveFPS',Math.round(perfState.fps));
 setText('livePerfHint',perfState.fps>=50?'PREVIEW M\u01af\u1ee2T':engine.previewScale<=.46?'GPU / MODEL GI\u1edaI H\u1ea0N':'\u0110ANG T\u1ed0I \u01afU');
 $('liveFPS')?.classList.toggle('low',perfState.fps<50);
 const panel=$('perfDetails');if(panel)panel.textContent=JSON.stringify(performanceDiagnostics(),null,2);
}
function performanceDiagnostics(){
 const info={version:'1.0.0',measuredRAFfps:+perfState.fps.toFixed(2),frameP95ms:+perfState.p95.toFixed(2),lastCPUms:+perfState.cpuMs.toFixed(2),
  targetFPS:perfState.target,adaptive:!!engine.autoQuality,renderScale:engine.previewScale,canvas:[engine.canvas.width,engine.canvas.height],drawCallsLastFrame:perfState.draws,
  originalMeshes:engine.stage.length,stageDrawBatches:engine._stageBatches?.length||0,activeDecoders:activeVideos().length,videoTextureUploads:perfState.uploadedFrames,
  gpuBuffers:engine.buffers.size,textureCount:engine.texCache.size,qualityAdjustments:perfState.qualityChanges,errors:[...stableUI.loopErrors],
  note:'FPS is measured from actual rendered animation frames. Target is not a hardware guarantee; source video FPS is independent.'};
 return info;
}

/* Pixel planning is deliberately separate from 3D geometry and existing video crops. */
const pixelDefaults={cabW:500,cabH:500,pxW:192,pxH:192,gap:8,maxWidth:4096,maxHeight:4096,fps:50,grouping:'all'};
function nativeEstimate(s,o=pixelDefaults){
 const w=Math.max(.001,s.physical?.[0]||1)*1000,h=Math.max(.001,s.physical?.[1]||1)*1000;
 const cols=Math.max(1,Math.round(w/o.cabW)),rows=Math.max(1,Math.round(h/o.cabH));
 return {width:cols*o.pxW,height:rows*o.pxH,columns:cols,rows,modelMM:[w,h],assembledMM:[cols*o.cabW,rows*o.cabH],
  mismatch:Math.abs(cols*o.cabW-w)>Math.max(5,w*.01)||Math.abs(rows*o.cabH-h)>Math.max(5,h*.01)};
}
const alignPx=(v,n=8)=>Math.ceil(v/n)*n;
function rectContains(a,b){return b.x>=a.x&&b.y>=a.y&&b.x+b.w<=a.x+a.w&&b.y+b.h<=a.y+a.h;}
function rectanglesOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function maxRectsPack(items,width,height,gap=8){
 let free=[{x:0,y:0,w:width,h:height}],placed=[],unplaced=[];
 const sorted=[...items].sort((a,b)=>Math.max(b.w,b.h)-Math.max(a.w,a.h)||b.w*b.h-a.w*a.h||String(a.surfaceId).localeCompare(String(b.surfaceId)));
 for(const item of sorted){
  const rw=item.w+gap*2,rh=item.h+gap*2;let best=null;
  for(const f of free){if(rw>f.w||rh>f.h)continue;const score=Math.min(f.w-rw,f.h-rh)*1e7+Math.max(f.w-rw,f.h-rh);if(!best||score<best.score)best={x:f.x,y:f.y,w:rw,h:rh,score};}
  if(!best){unplaced.push(item);continue;}
  const next=[];
  for(const f of free){
   if(!rectanglesOverlap(f,best)){next.push(f);continue;}
   if(best.x>f.x)next.push({...f,w:best.x-f.x});
   if(best.x+best.w<f.x+f.w)next.push({...f,x:best.x+best.w,w:f.x+f.w-best.x-best.w});
   if(best.y>f.y)next.push({...f,h:best.y-f.y});
   if(best.y+best.h<f.y+f.h)next.push({...f,y:best.y+best.h,h:f.y+f.h-best.y-best.h});
  }
  free=next.filter((a,i)=>a.w>0&&a.h>0&&!next.some((b,j)=>j!==i&&rectContains(b,a)&&(b.w*b.h>a.w*a.h||j<i)));
  placed.push({...item,x:best.x+gap,y:best.y+gap});
 }
 return {items:placed,unplaced,width:alignPx(Math.max(1,...placed.map(r=>r.x+r.w+gap))),height:alignPx(Math.max(1,...placed.map(r=>r.y+r.h+gap)))};
}
function planAtlas(items,options={}){
 const o={...pixelDefaults,...options};o.gap=Math.max(0,Math.min(64,Math.round(+o.gap||0)));
 const gpuMax=typeof engine!=='undefined'&&engine?.maxSize?engine.maxSize:8192;
 o.maxWidth=Math.min(gpuMax,Math.max(64,Math.floor(+o.maxWidth||4096)));o.maxHeight=Math.min(gpuMax,Math.max(64,Math.floor(+o.maxHeight||4096)));
 o.maxWidth=Math.floor(o.maxWidth/8)*8;o.maxHeight=Math.floor(o.maxHeight/8)*8;
 const valid=items.map(item=>{
  const w=+item.w,h=+item.h;if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1)throw Error('Pixel ph\u1ea3i l\u00e0 s\u1ed1 nguy\u00ean d\u01b0\u01a1ng: '+item.name);
  if(w+2*o.gap>o.maxWidth||h+2*o.gap>o.maxHeight)throw Error(item.name+' ('+w+' x '+h+') l\u1edbn h\u01a1n canvas. T\u0103ng gi\u1edbi h\u1ea1n, kh\u00f4ng t\u1ef1 gi\u1ea3m pixel.');
  return {...item,w,h};
 });
 if(!valid.length)throw Error('Ch\u01b0a c\u00f3 v\u00f9ng LED \u0111\u1ec3 gom.');
 if(valid.length>300)throw Error('T\u1ed1i \u0111a 300 v\u00f9ng trong b\u1ea3n preview.');
 const groups=new Map();for(const v of valid){const k=o.grouping==='cluster'?(v.cluster||'Main'):'Master';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(v);}
 const pages=[];
 for(const [name,group]of groups){
  let remaining=group,part=1;
  while(remaining.length){
   const minW=Math.max(...remaining.map(r=>r.w+o.gap*2));const area=remaining.reduce((n,r)=>n+(r.w+o.gap*2)*(r.h+o.gap*2),0);
   const candidates=new Set([alignPx(minW),o.maxWidth,alignPx(Math.sqrt(area)),1920,2048,2560,3072,3840,4096,7680,8192]);
   for(let i=0;i<=12;i++)candidates.add(alignPx(minW+(o.maxWidth-minW)*i/12));
   let best=null;
   for(const width of candidates){
    if(width<minW||width>o.maxWidth)continue;const r=maxRectsPack(remaining,width,o.maxHeight,o.gap);
    if(!r.items.length)continue;
    const used=r.items.reduce((n,v)=>n+v.w*v.h,0),score=used*1e10-r.width*r.height;
    if(!best||score>best.score)best={...r,score};
   }
   if(!best)throw Error('Kh\u00f4ng \u0111\u1ee7 canvas cho c\u1ee5m '+name);
   const pixels=best.items.reduce((n,r)=>n+r.w*r.h,0),areaPx=best.width*best.height;
   pages.push({id:'atlas_'+(pages.length+1),name:name+(part>1?' / '+part:''),width:best.width,height:best.height,items:best.items,
    activePixels:pixels,canvasPixels:areaPx,fillPercent:+(pixels/areaPx*100).toFixed(2),gap:o.gap,rotate:false});
   remaining=best.unplaced;part++;
  }
 }
 const activePixels=pages.reduce((n,p)=>n+p.activePixels,0),canvasPixels=pages.reduce((n,p)=>n+p.canvasPixels,0);
 return {format:'ALPHA_OPTIMIZED_ATLAS/1',createdAt:new Date().toISOString(),options:o,pages,activePixels,canvasPixels,
  fillPercent:+(activePixels/canvasPixels*100).toFixed(2),rawRGBGBperSecond:+(canvasPixels*3*o.fps/1e9).toFixed(3),
  note:'Content packing only. Native pixel dimensions must be verified. No rotation, no resampling, no change to stage geometry. Not a LED receiving-card map; not a mathematically guaranteed optimum.'};
}
function validateAtlas(plan){
 const errors=[];for(const p of plan.pages){
  if(p.width%8||p.height%8)errors.push(p.id+': alignment');
  for(let i=0;i<p.items.length;i++){const r=p.items[i];if(r.x<0||r.y<0||r.x+r.w>p.width||r.y+r.h>p.height)errors.push(r.name+': bounds');for(let j=i+1;j<p.items.length;j++)if(rectanglesOverlap(r,p.items[j]))errors.push(r.name+': overlap');}
 }return errors;
}
function paintAtlas(canvas,page,{labels=true,fullSize=false}={}){
 const limit=fullSize?1:Math.min(1,1280/page.width,660/page.height);
 canvas.width=Math.max(1,Math.round(page.width*limit));canvas.height=Math.max(1,Math.round(page.height*limit));const g=canvas.getContext('2d');g.fillStyle='#080b12';g.fillRect(0,0,canvas.width,canvas.height);g.scale(limit,limit);
 const colors=['#5bd7c6','#a795fa','#f2b66d','#7eaaf4','#e5a5d0','#9bdba0'];
 page.items.forEach((r,i)=>{g.fillStyle=labels?colors[i%colors.length]:'#ffffff';g.fillRect(r.x,r.y,r.w,r.h);if(labels){g.fillStyle='#102028';g.font='bold '+Math.max(12,Math.min(42,r.w/12,r.h/5))+'px Segoe UI,Arial';g.save();g.beginPath();g.rect(r.x+3,r.y+3,r.w-6,r.h-6);g.clip();g.fillText(r.name,r.x+12,r.y+Math.max(22,Math.min(50,r.h/3)));g.font=Math.max(10,Math.min(28,r.w/15))+'px Segoe UI,Arial';g.fillText(r.w+' x '+r.h+' px',r.x+12,r.y+Math.min(88,r.h*.6));g.restore();}});
}
async function exportAtlasPNG(page,labels=true){
 if(page.width*page.height>48000000)throw Error('PNG tr\u00ean 48 MP; h\u00e3y xu\u1ea5t JSON ho\u1eb7c chia nh\u1ecf c\u1ee5m.');
 const c=document.createElement('canvas');paintAtlas(c,page,{labels,fullSize:true});
 const blob=await new Promise(r=>c.toBlob(r,'image/png'));download('ALPHA_'+page.id+'_'+page.width+'x'+page.height+(labels?'_GUIDE':'_MASK')+'.png',blob);
}
function exportAtlasJSON(plan=live.atlasPlan){if(!plan)return;downloadText('ALPHA_Optimized_LED_Atlas.json',JSON.stringify(plan,null,2));}
function exportAtlasCSV(plan=live.atlasPlan){
 if(!plan)return;const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';const rows=[['atlas','width','height','LED','x','y','w','h','cluster']];
 for(const p of plan.pages)for(const r of p.items)rows.push([p.id,p.width,p.height,/^[=+@-]/.test(r.name)?"'"+r.name:r.name,r.x,r.y,r.w,r.h,r.cluster||'']);
 downloadText('ALPHA_Atlas_Zones.csv','\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');
}
StageEngine.prototype.mapSurfaces=function(){return this.activeAtlasId?this.surfaces.filter(s=>s.atlasId===this.activeAtlasId):this.surfaces;};
async function assignAtlasClip(page,file){
 const targets=page.items.map(r=>({r,s:engine.surfaces.find(s=>s.id===r.surfaceId)})).filter(x=>x.s);
 if(!targets.length)throw Error('C\u1ee5m n\u00e0y kh\u00f4ng c\u00f2n LED. H\u00e3y t\u00ednh l\u1ea1i.');
 // The same asset/decoder is shared by all surfaces in this atlas.
 const a=await addMediaFile(file,{silent:true}),ratioError=Math.abs(a.width/a.height-page.width/page.height)/(page.width/page.height);
 if(ratioError>.005){a.element.pause?.();engine.media.delete(a.id);state.media=state.media.filter(x=>x.id!==a.id);URL.revokeObjectURL(a.url);throw Error('Clip sai t\u1ef7 l\u1ec7. C\u1ee5m c\u1ea7n '+page.width+' x '+page.height+' px; clip l\u00e0 '+a.width+' x '+a.height+'. Mapping c\u0169 ch\u01b0a \u0111\u1ed5i.');}
 checkpoint();live.transition=null;live.queue=null;
 for(const {s,r}of targets){
  s.nativeResolution={width:r.w,height:r.h,confirmed:!!r.confirmed};s.atlasId=page.id;s.cluster=r.cluster||'Main';s.mappingSpace='local';s.source=a.id;
  s.x=r.x;s.y=r.y;s.w=r.w;s.h=r.h;s.crop=[r.x*a.width/page.width,r.y*a.height/page.height,r.w*a.width/page.width,r.h*a.height/page.height];
  s.rotation=0;s.flipX=false;s.flipY=false;s.fit=0;engine.releaseMesh(s.mesh);updateTest(s);
 }
 engine.layout={...engine.layout,mode:'atlas'};engine.activeAtlasId=page.id;engine.master={width:page.width,height:page.height};engine.globalTest=false;engine.view='stage';state.step='mapping';
 engine.outputAtlases=live.atlasPlan?.pages||[page];resetFlatCache();engine.selected=targets[0].s.id;
 if(a.duration){state.duration=Math.min(600,a.duration);state.time=0;}syncVideos(true);renderUI();
 toast('\u0110\u00e3 g\u00e1n 1 clip cho '+targets.length+' LED. Gi\u1eef nguy\u00ean m\u1eb7t 3D.');return a;
}
function openPixelStudio(){
 const items=engine.surfaces;if(!items.length){toast('T\u1ea1o m\u1eb7t LED tr\u01b0\u1edbc.');return;}
 const o={...pixelDefaults,...live.pixelOptions};
 const body=`<div class="pro-banner"><div><span class="eyebrow">PIXEL PLANNING / NON-DESTRUCTIVE</span><h3>T\u00ednh pixel. Gom c\u1ee5m. Xu\u1ea5t visual.</h3><p>Thay \u0111\u1ed5i b\u1ea3ng n\u00e0y kh\u00f4ng di chuy\u1ec3n model hay s\u1eeda crop video hi\u1ec7n t\u1ea1i.</p></div><b>1:1<br><small>PIXEL</small></b></div>
 <div class="pro-settings"><label>Cabinet<select id="cabPreset"><option value="192">500 mm / 192 px (~P2.604)</option><option value="200">500 mm / 200 px (P2.5)</option><option value="128">500 mm / 128 px (~P3.906)</option><option value="custom">T\u1ef1 nh\u1eadp</option></select></label>
 ${[['cabW','Ngang mm',o.cabW],['cabH','Cao mm',o.cabH],['pxW','Pixel ngang',o.pxW],['pxH','Pixel cao',o.pxH]].map(([id,n,v])=>`<label>${n}<input id="${id}" type="number" min="1" max="8192" value="${v}"></label>`).join('')}
 <button class="btn" id="calculateNative">T\u00ednh t\u1eeb model</button></div>
 <p class="hint-text">S\u1ed1 cabinet l\u00e0 \u01b0\u1edbc t\u00ednh l\u00e0m tr\u00f2n theo k\u00edch th\u01b0\u1edbc model. D\u00f2ng m\u00e0u cam kh\u00f4ng kh\u1edbp cabinet: s\u1eeda pixel theo b\u1ea3n k\u1ef9 thu\u1eadt, kh\u00f4ng t\u1ef1 scale s\u00e2n kh\u1ea5u.</p>
 <div class="pro-table-wrap"><table class="pro-table"><thead><tr><th>LED / m\u00e9t</th><th>Ngang px</th><th>Cao px</th><th>C\u1ee5m</th><th>Tr\u1ea1ng th\u00e1i</th></tr></thead><tbody>${items.map(s=>{const e=nativeEstimate(s,o),n=s.nativeResolution?.confirmed?s.nativeResolution:e;return `<tr data-pixel-row="${esc(s.id)}"><td><strong>${esc(s.name)}</strong><small>${fmt(s.physical?.[0]||0)} x ${fmt(s.physical?.[1]||0)} m</small></td><td><input aria-label="Pixel width ${esc(s.name)}" data-pw="${s.id}" type="number" min="1" max="16384" value="${n.width}"></td><td><input aria-label="Pixel height ${esc(s.name)}" data-ph="${s.id}" type="number" min="1" max="16384" value="${n.height}"></td><td><input data-cluster="${s.id}" maxlength="40" value="${esc(s.cluster||'Main')}"></td><td data-note="${s.id}" class="${s.nativeResolution?.confirmed?'':'warning'}">${s.nativeResolution?.confirmed?'\u0110\u00e3 x\u00e1c nh\u1eadn':e.mismatch?'L\u1ec7ch cabinet / xem l\u1ea1i':'\u01af\u1edbc t\u00ednh'}</td></tr>`;}).join('')}</tbody></table></div>
 <div class="pro-settings"><label>Gom<select id="atlasGrouping"><option value="all">Chung 1 master</option><option value="cluster">T\u00e1ch theo t\u00ean c\u1ee5m</option></select></label><label>R\u1ed9ng t\u1ed1i \u0111a<input id="atlasMaxW" type="number" min="64" max="8192" value="${o.maxWidth}"></label><label>Cao t\u1ed1i \u0111a<input id="atlasMaxH" type="number" min="64" max="8192" value="${o.maxHeight}"></label><label>Gutter px<input id="atlasGap" type="number" min="0" max="64" value="${o.gap}"></label><label>FPS n\u1ed9i dung<input id="atlasFPS" type="number" min="1" max="120" value="${o.fps}"></label><button class="btn primary" id="packAtlas">T\u1ed1i \u01b0u c\u1ee5m</button><button class="btn" id="confirmPixels">X\u00e1c nh\u1eadn pixel</button></div>
 <div id="atlasResults"><div class="info-box">B\u1ea5m T\u1ed1i \u01b0u c\u1ee5m \u0111\u1ec3 xem ph\u01b0\u01a1ng \u00e1n. Kh\u00f4ng xoay \u00f4, kh\u00f4ng gi\u1ea3m pixel, t\u1ef1 chia nhi\u1ec1u canvas khi kh\u00f4ng \u0111\u1ee7 ch\u1ed7.</div></div>`;
 dialog('Pixel Studio',body,[{label:'\u0110\u00f3ng'}]);$('modal').classList.add('pro-wide');$('atlasGrouping').value=o.grouping;
 const readOpts=()=>({...o,cabW:+$('cabW').value||500,cabH:+$('cabH').value||500,pxW:+$('pxW').value||192,pxH:+$('pxH').value||192,gap:+$('atlasGap').value,maxWidth:+$('atlasMaxW').value,maxHeight:+$('atlasMaxH').value,fps:clamp(+$('atlasFPS').value||50,1,120),grouping:$('atlasGrouping').value});
 const readItems=()=>items.map(s=>({surfaceId:s.id,name:s.name,w:+document.querySelector(`[data-pw="${s.id}"]`).value,h:+document.querySelector(`[data-ph="${s.id}"]`).value,cluster:document.querySelector(`[data-cluster="${s.id}"]`).value.trim()||'Main',confirmed:!!s.nativeResolution?.confirmed&&s.nativeResolution.width===+document.querySelector(`[data-pw="${s.id}"]`).value&&s.nativeResolution.height===+document.querySelector(`[data-ph="${s.id}"]`).value}));
 $('cabPreset').onchange=e=>{if(e.target.value==='custom')return;for(const id of ['cabW','cabH'])$(id).value=500;for(const id of ['pxW','pxH'])$(id).value=e.target.value;};
 $('calculateNative').onclick=()=>{const op=readOpts();if([op.cabW,op.cabH,op.pxW,op.pxH].some(x=>!Number.isFinite(x)||x<=0)){toast('Cabinet kh\u00f4ng h\u1ee3p l\u1ec7.');return;}for(const s of items){const e=nativeEstimate(s,op);document.querySelector(`[data-pw="${s.id}"]`).value=e.width;document.querySelector(`[data-ph="${s.id}"]`).value=e.height;const note=document.querySelector(`[data-note="${s.id}"]`);note.textContent=e.columns+' x '+e.rows+' cabinet'+(e.mismatch?' / L\u1ec7ch k\u00edch th\u01b0\u1edbc':' / \u01af\u1edbc t\u00ednh');note.className='warning';}};
 $('confirmPixels').onclick=()=>{const rows=readItems();if(rows.some(r=>!Number.isInteger(r.w)||!Number.isInteger(r.h)||r.w<1||r.h<1||r.w>16384||r.h>16384)){toast('Pixel kh\u00f4ng h\u1ee3p l\u1ec7.');return;}checkpoint();rows.forEach(r=>{const s=items.find(s=>s.id===r.surfaceId);s.nativeResolution={width:r.w,height:r.h,confirmed:true};s.cluster=r.cluster;const e=document.querySelector(`[data-note="${s.id}"]`);e.textContent='\u0110\u00e3 x\u00e1c nh\u1eadn';e.className='';});live.pixelOptions=readOpts();toast('\u0110\u00e3 l\u01b0u pixel; gi\u1eef nguy\u00ean h\u00ecnh h\u1ecdc v\u00e0 crop.');renderUI();};
 $('packAtlas').onclick=()=>{try{live.pixelOptions=readOpts();live.atlasPlan=planAtlas(readItems(),live.pixelOptions);showAtlasResults(live.atlasPlan);$('atlasResults').scrollIntoView({block:'start'});}catch(e){$('atlasResults').innerHTML='<div class="info-box warning">'+esc(e.message)+'</div>';}};
 if(live.atlasPlan)showAtlasResults(live.atlasPlan);
}
function showAtlasResults(plan){
 const box=$('atlasResults');if(!box)return;
 box.innerHTML=`<div class="atlas-summary"><div><b>${plan.pages.length}</b><small>CANVAS / CLIP</small></div><div><b>${plan.fillPercent}%</b><small>PIXEL H\u1eeeU D\u1ee4NG</small></div><div><b>${(plan.activePixels/1e6).toFixed(2)} MP</b><small>LED TH\u1ef0C</small></div><div><b>${plan.rawRGBGBperSecond} GB/s</b><small>RGB CH\u01afA N\u00c9N / ${plan.options.fps} FPS</small></div></div>
 <div class="atlas-pages">${plan.pages.map((p,i)=>`<button class="btn ${i===0?'active':''}" data-page="${i}">${esc(p.name)} / ${p.width} x ${p.height}</button>`).join('')}</div><canvas id="atlasCanvas"></canvas><div class="atlas-actions"><button class="btn" id="exportAtlasGuide">PNG h\u01b0\u1edbng d\u1eabn</button><button class="btn" id="exportAtlasMask">PNG mask</button><button class="btn" id="atlasVisualPNG">PNG visual</button><button class="btn" id="atlasRecord">WebM visual</button><button class="btn" id="atlasJSON">JSON</button><button class="btn" id="atlasCSV">CSV</button><button class="btn primary" id="loadAtlasClip">N\u1ea1p clip \u0111\u00fang c\u1ee5m n\u00e0y</button></div><p class="hint-text">Xu\u1ea5t PNG/JSON \u2192 l\u00e0m motion tr\u00ean canvas n\u00e0y \u2192 n\u1ea1p clip. Ch\u1ec9 b\u01b0\u1edbc n\u1ea1p clip m\u1edbi thay crop c\u1ee7a c\u1ee5m \u0111\u01b0\u1ee3c ch\u1ecdn; m\u1eb7t LED 3D gi\u1eef nguy\u00ean. \u0110\u00e2y l\u00e0 \u0111\u1ec1 xu\u1ea5t packing, kh\u00f4ng ph\u1ea3i s\u01a1 \u0111\u1ed3 \u0111\u1ea5u n\u1ed1i.</p>`;
 let index=0;const display=i=>{index=i;paintAtlas($('atlasCanvas'),plan.pages[i]);box.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',+b.dataset.page===i));};display(0);
 box.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>display(+b.dataset.page));
 $('exportAtlasGuide').onclick=()=>exportAtlasPNG(plan.pages[index],true).catch(e=>toast(e.message));$('exportAtlasMask').onclick=()=>exportAtlasPNG(plan.pages[index],false).catch(e=>toast(e.message));
 $('atlasJSON').onclick=()=>exportAtlasJSON(plan);$('atlasCSV').onclick=()=>exportAtlasCSV(plan);
 $('atlasVisualPNG').onclick=()=>exportAtlasVisualPNG(plan.pages[index]).catch(e=>toast(e.message,8000));$('atlasRecord').onclick=()=>openAtlasRecording(plan.pages[index]);
 $('loadAtlasClip').onclick=()=>{live.pendingAtlas=plan.pages[index];$('atlasMediaInput').click();};
}

/* Live performance state. VJ cues never replace meshes or move fixtures. */
const live={open:false,cues:[],currentCue:null,storeMode:false,transition:null,queue:null,clock:0,
 transitionType:'fade',transitionSeconds:.65,quantize:false,bpm:120,opacity:1,zoom:1,hue:0,blackout:false,
 flashHold:false,flashLeft:0,strobeArmed:false,strobeHold:false,strobeHz:8,reactive:false,audioRMS:0,
 audioEnabled:false,audioMode:'video',volume:.65,videoVolume:1,musicVolume:.85,audioTrack:null,audioOffset:0,audioLoop:true,
 audioContext:null,audioNodes:new Map(),masterGain:null,analyser:null,recordDest:null,lastAudioSync:0,
 selection:new Set(),pixelOptions:{...pixelDefaults},atlasPlan:null,pendingAtlas:null,tapTimes:[]};
const LIVE_BASE={snapshot,restore,renderUI,loadProject,importModel,demo,activeVideos};
const cueKeys=['q','w','e','r','a','s','d','g'];
function initialCues(){return [
 {name:'Energy wave',preset:0},{name:'Liquid orbit',preset:1},{name:'Neon grid',preset:2},{name:'Particles',preset:3},
 {name:'Slot 05',empty:true},{name:'Slot 06',empty:true},{name:'Slot 07',empty:true},{name:'Slot 08',empty:true}
 ];}
live.cues=initialCues();
const cueFields=['source','crop','rotation','flipX','flipY','fit','brightness','global','effect','mappingSpace'];
function surfaceLook(s){const out={id:s.id};for(const k of cueFields)if(s[k]!==undefined)out[k]=Array.isArray(s[k])?[...s[k]]:s[k];return out;}
function captureCue(index,name){
 if(!Number.isInteger(index)||index<0||index>7||!engine.surfaces.length)return false;
 checkpoint();live.cues[index]={name:(name||'Look '+String(index+1).padStart(2,'0')).slice(0,48),screens:engine.surfaces.map(surfaceLook),accent:engine.accent,effect:engine.effect,
  lights:engine.lights.map(l=>({id:l.id,color:l.color,power:l.power,angle:l.angle,enabled:l.enabled,sweep:l.sweep,speed:l.speed,phase:l.phase,fx:l.fx,fxDepth:l.fxDepth,fxSpeed:l.fxSpeed,boost:l.boost}))};
 live.storeMode=false;updateCuePads();toast('\u0110\u00e3 ghi look v\u00e0o \u00f4 '+(index+1)+'. Kh\u00f4ng l\u01b0u l\u1ea1i h\u00ecnh h\u1ecdc.');return true;
}
function launchCue(index,{immediate=false}={}){
 const cue=live.cues[index];if(!cue||cue.empty){toast('B\u1eadt Ghi look r\u1ed3i ch\u1ecdn \u00f4 \u0111\u1ec3 l\u01b0u video/FX hi\u1ec7n t\u1ea1i.');return false;}
 if(!engine.surfaces.length){toast('Ch\u01b0a c\u00f3 map LED.');return false;}
 if(live.quantize&&state.playing&&!immediate){const beat=60/live.bpm,delay=beat-(live.clock%beat);live.queue={index,at:live.clock+delay};updateCuePads();return true;}
 const missing=(cue.screens||[]).filter(s=>s.source&&!['motion','test'].includes(s.source)&&!engine.media.has(s.source));
 if(missing.length){toast('Look thi\u1ebfu media. N\u1ea1p l\u1ea1i clip v\u00e0 ghi l\u1ea1i look.');return false;}
 const before=new Map(engine.surfaces.map(s=>[s.id,surfaceLook(s)])),prevAccent=engine.accent;live.queue=null;
 if(cue.preset!==undefined){for(const s of engine.surfaces){s.source='motion';s.effect=cue.preset;}engine.effect=cue.preset;}
 else{
  for(const s of engine.surfaces){const saved=cue.screens?.find(x=>x.id===s.id);if(!saved)continue;for(const k of cueFields)if(saved[k]!==undefined)s[k]=Array.isArray(saved[k])?[...saved[k]]:saved[k];}
  if(cue.accent)engine.accent=cue.accent;if(cue.effect!==undefined)engine.effect=cue.effect;
  for(const l of engine.lights){const look=cue.lights?.find(x=>x.id===l.id);if(look)Object.assign(l,look);}
 }
 engine.globalTest=false;const seconds=clamp(+live.transitionSeconds||0,0,4);
 live.transition=live.transitionType==='cut'||seconds===0?null:{old:before,prevAccent,type:live.transitionType,seconds,elapsed:0};
 live.currentCue=index;syncVideos(true);renderUI();return true;
}
function advanceLive(dt){
 if(state.playing){live.clock+=dt;if(live.queue&&live.clock>=live.queue.at)launchCue(live.queue.index,{immediate:true});
  if(live.transition){live.transition.elapsed=Math.min(live.transition.seconds,live.transition.elapsed+dt);if(live.transition.elapsed>=live.transition.seconds){live.transition=null;syncVideos();}}
 }
 live.flashLeft=Math.max(0,live.flashLeft-dt);
}
function resetMomentaryFX(){live.flashHold=false;live.strobeHold=false;live.flashLeft=0;updateLiveIndicators();}
function panicLive(){live.transition=null;live.queue=null;live.blackout=false;live.opacity=1;live.zoom=1;live.hue=0;live.reactive=false;live.strobeArmed=false;resetMomentaryFX();renderLiveDock();}
function tapBPM(){const now=performance.now();live.tapTimes=live.tapTimes.filter(x=>now-x<4000);live.tapTimes.push(now);if(live.tapTimes.length>7)live.tapTimes.shift();if(live.tapTimes.length>=2){const beats=live.tapTimes.length-1;live.bpm=clamp(Math.round(60000*beats/(now-live.tapTimes[0])),40,240);}if($('vjBPM'))$('vjBPM').value=live.bpm;}
activeVideos=function(){
 const ids=new Set(engine.surfaces.filter(s=>s.enabled!==false).map(s=>s.source));
 if(live.transition)for(const [id,s]of live.transition.old)if(engine.surfaces.some(x=>x.id===id&&x.enabled!==false))ids.add(s.source);
 return state.media.filter(a=>a.type==='video'&&ids.has(a.id));
};
function applyLiveUniforms(s){
 const gl=this.gl,test=this.globalTest||s.source==='test';
 const beatFactor=live.reactive?1+Math.min(.4,live.audioRMS*1.5):1;
 let dim=live.blackout?0:live.opacity*beatFactor;
 if(live.strobeArmed&&live.strobeHold)dim*=Math.sin(live.clock*live.strobeHz*Math.PI*2)>0?1:.04;
 this.uniform('uVJDim',test?1:dim);this.uniform('uVJFlash',test?0:live.flashHold?1:Math.min(1,live.flashLeft*8));this.uniform('uVJZoom',test?1:live.zoom);this.uniform('uVJHue',test?0:live.hue);
 const trans=!test?live.transition:null,old=trans?.old.get(s.id);this.uniform('uVJActive',old?1:0,'i');
 if(!old)return;
 const a=this.media.get(old.source),src=old.source==='test'?s.testCanvas:a?.element,cr=old.crop||[0,0,a?.width||1,a?.height||1],w=a?.width||1,h=a?.height||1;
 this.uniform('uVJMix',clamp(trans.elapsed/trans.seconds,0,1));this.uniform('uVJType',trans.type==='wipe'?1:trans.type==='dip'?2:0,'i');
 this.uniform('uPrevHasTex',src?1:0,'i');this.uniform('uPrevStage',old.mappingSpace==='stage'&&old.source!=='test'?1:0,'i');
 this.uniform('uPrevEffect',old.effect??engine.effect,'i');this.uniform('uPrevAccent',hexrgb(trans.prevAccent));this.uniform('uPrevGlobal',old.global!==false?1:0,'i');
 this.uniform('uPrevCrop',old.source==='test'?[0,0,1,1]:[cr[0]/w,cr[1]/h,cr[2]/w,cr[3]/h]);this.uniform('uPrevRect',[s.x,s.y,s.w,s.h]);
 this.uniform('uPrevBrightness',old.brightness??1);this.uniform('uPrevRotate',old.rotation||0,'i');this.uniform('uPrevFlipX',old.flipX?1:0,'i');this.uniform('uPrevFlipY',old.flipY?1:0,'i');this.uniform('uPrevFit',old.fit||0,'i');this.uniform('uPrevSourceAspect',cr[2]/cr[3]||1);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.texture(src));this.uniform('uPrevTexture',1,'i');gl.activeTexture(gl.TEXTURE0);
}
function deleteMapIds(ids,{record=true}={}){
 const set=new Set(ids),removed=engine.surfaces.filter(s=>set.has(s.id));if(!removed.length)return 0;
 if(record)checkpoint();live.transition=null;live.queue=null;
 for(const s of removed){engine.releaseMesh(s.mesh);const t=engine.texCache.get(s.testCanvas);if(t){engine.gl.deleteTexture(t.tex);engine.texCache.delete(s.testCanvas);}}
 engine.surfaces=engine.surfaces.filter(s=>!set.has(s.id));for(const id of set)live.selection.delete(id);
 if(set.has(engine.selected))engine.selected=engine.surfaces[0]?.id||null;
 if(engine.activeAtlasId&&!engine.surfaces.some(s=>s.atlasId===engine.activeAtlasId))engine.activeAtlasId=null;
 if(state.rebindId&&set.has(state.rebindId))state.rebindId=null;
 resetFlatCache();syncVideos();renderUI();toast('\u0110\u00e3 x\u00f3a '+removed.length+' map LED. Model g\u1ed1c gi\u1eef nguy\u00ean. Ctrl+Z \u0111\u1ec3 kh\u00f4i ph\u1ee5c.');return removed.length;
}
function confirmDeleteMaps(ids){
 const existing=engine.surfaces.filter(s=>ids.includes(s.id));if(!existing.length){toast('Ch\u1ecdn map LED c\u1ea7n x\u00f3a.');return;}
 dialog('X\u00f3a '+existing.length+' map LED?',`<p>Ch\u1ec9 x\u00f3a v\u00f9ng mapping; <b>kh\u00f4ng x\u00f3a model s\u00e2n kh\u1ea5u, \u0111\u00e8n hay file video</b>.</p><p>${existing.slice(0,8).map(s=>esc(s.name)).join(' / ')}${existing.length>8?' ...':''}</p><p>Ho\u00e0n t\u00e1c b\u1eb1ng Ctrl+Z.</p>`,[{label:'H\u1ee7y'},{label:'X\u00f3a map',primary:true,action:()=>deleteMapIds(ids)}]);
}
function openLEDManager(){
 for(const id of live.selection)if(!engine.surfaces.some(s=>s.id===id))live.selection.delete(id);
 dialog('Qu\u1ea3n l\u00fd map LED',`<div class="pro-banner"><div><span class="eyebrow">BULK EDIT / SAFE DELETE</span><h3>Ch\u1ecdn nhi\u1ec1u LED c\u00f9ng l\u00fac</h3><p>X\u00f3a map kh\u00f4ng x\u00f3a s\u00e2n kh\u1ea5u. Ctrl+Z kh\u00f4i ph\u1ee5c.</p></div><b>${engine.surfaces.length}<small>LED</small></b></div><div class="manager-actions"><button class="btn" id="selectAllMaps">Ch\u1ecdn t\u1ea5t c\u1ea3</button><button class="btn" id="selectNoneMaps">B\u1ecf ch\u1ecdn</button><input id="groupName" placeholder="T\u00ean c\u1ee5m: MAIN / WINGS..." maxlength="40"><button class="btn" id="groupSelected">Gom c\u1ee5m</button><button class="btn" id="toggleSelectedMaps">B\u1eadt / t\u1eaft</button></div><div class="pro-table-wrap"><table class="pro-table"><thead><tr><th></th><th>LED</th><th>Pixel / crop</th><th>C\u1ee5m</th><th>ON</th></tr></thead><tbody>${engine.surfaces.map(s=>`<tr><td><input type="checkbox" data-map-select="${s.id}" ${live.selection.has(s.id)?'checked':''} aria-label="Chon ${esc(s.name)}"></td><td>${esc(s.name)}</td><td>${s.nativeResolution?.width||s.w} x ${s.nativeResolution?.height||s.h}<small>${esc(engine.media.get(s.source)?.name||s.source)}</small></td><td>${esc(s.cluster||'Main')}</td><td>${s.enabled!==false?'ON':'OFF'}</td></tr>`).join('')}</tbody></table></div><p id="selectionCount"></p>`,[{label:'\u0110\u00f3ng'},{label:'X\u00f3a map \u0111\u00e3 ch\u1ecdn',primary:true,action:()=>confirmDeleteMaps([...live.selection])}]);
 $('modal').classList.add('pro-wide');
 const update=()=>setText('selectionCount',live.selection.size+' / '+engine.surfaces.length+' map \u0111\u00e3 ch\u1ecdn');
 document.querySelectorAll('[data-map-select]').forEach(e=>e.onchange=()=>{e.checked?live.selection.add(e.dataset.mapSelect):live.selection.delete(e.dataset.mapSelect);update();});
 $('selectAllMaps').onclick=()=>{for(const s of engine.surfaces)live.selection.add(s.id);document.querySelectorAll('[data-map-select]').forEach(e=>e.checked=true);update();};
 $('selectNoneMaps').onclick=()=>{live.selection.clear();document.querySelectorAll('[data-map-select]').forEach(e=>e.checked=false);update();};
 $('groupSelected').onclick=()=>{const name=$('groupName').value.trim();if(!name||!live.selection.size){toast('Nh\u1eadp t\u00ean v\u00e0 ch\u1ecdn LED.');return;}checkpoint();for(const s of engine.surfaces)if(live.selection.has(s.id))s.cluster=name;openLEDManager();renderUI();};
 $('toggleSelectedMaps').onclick=()=>{if(!live.selection.size)return;checkpoint();const selected=engine.surfaces.filter(s=>live.selection.has(s.id)),on=selected.every(s=>s.enabled===false);for(const s of selected)s.enabled=on;syncVideos();openLEDManager();renderUI();};update();
}
snapshot=function(){const s=LIVE_BASE.snapshot();s.liveState={cues:structuredClone(live.cues),activeAtlasId:engine.activeAtlasId,outputAtlases:engine.outputAtlases?structuredClone(engine.outputAtlases):[],pixelOptions:{...live.pixelOptions}};return s;};
restore=function(s){live.transition=null;live.queue=null;LIVE_BASE.restore(s);if(s.liveState){live.cues=structuredClone(s.liveState.cues);engine.activeAtlasId=s.liveState.activeAtlasId;engine.outputAtlases=structuredClone(s.liveState.outputAtlases);live.pixelOptions={...s.liveState.pixelOptions};}syncVideos();renderUI();};
async function packLiveExtras(){
 const audio=live.audioTrack?{name:live.audioTrack.file.name,data:await fileData(live.audioTrack.file)}:null;
 return {version:1,cues:live.cues,config:{transitionType:live.transitionType,transitionSeconds:live.transitionSeconds,bpm:live.bpm,quantize:live.quantize,opacity:live.opacity,zoom:live.zoom,hue:live.hue,audioMode:live.audioMode,volume:live.volume,videoVolume:live.videoVolume,musicVolume:live.musicVolume,audioOffset:live.audioOffset,audioLoop:live.audioLoop},audio,
  atlasPlan:live.atlasPlan,pixelOptions:live.pixelOptions,outputAtlases:engine.outputAtlases||[],activeAtlasId:engine.activeAtlasId||null};
}
async function restoreLiveExtras(data){
 live.transition=null;live.queue=null;live.currentCue=null;live.blackout=false;resetMomentaryFX();live.audioEnabled=false;
 removeMusic();live.cues=initialCues();live.atlasPlan=null;engine.activeAtlasId=null;engine.outputAtlases=[];
 if(data?.version===1||data?.version===2){
  if(Array.isArray(data.cues))live.cues=data.cues.slice(0,8).map((c,i)=>({...c,name:String(c.name||'Look '+(i+1)).slice(0,48)}));
  while(live.cues.length<8)live.cues.push({name:'Empty',empty:true});
  const c=data.config||{};
  live.transitionType=['cut','fade','wipe','dip'].includes(c.transitionType)?c.transitionType:'fade';live.transitionSeconds=clamp(+c.transitionSeconds||.65,0,4);
  live.bpm=clamp(+c.bpm||120,40,240);live.quantize=!!c.quantize;live.opacity=clamp(Number(c.opacity??1),0,1);live.zoom=clamp(+c.zoom||1,1,2);live.hue=clamp(+c.hue||0,0,1);
  live.audioMode=['video','music','mix'].includes(c.audioMode)?c.audioMode:'video';live.volume=clamp(Number(c.volume??.65),0,1);live.videoVolume=clamp(Number(c.videoVolume??1),0,1);live.musicVolume=clamp(Number(c.musicVolume??.85),0,1);
  live.audioOffset=clamp(+c.audioOffset||0,-600,600);live.audioLoop=c.audioLoop!==false;
  live.pixelOptions={...pixelDefaults,...data.pixelOptions};live.atlasPlan=data.atlasPlan?.format==='ALPHA_OPTIMIZED_ATLAS/1'?data.atlasPlan:null;
  engine.activeAtlasId=data.activeAtlasId||null;engine.outputAtlases=Array.isArray(data.outputAtlases)?data.outputAtlases:[];
  if(data.audio?.data)await addMusicFile(await fileFromData(data.audio),{silent:true});
 }
 routeAudio();renderLiveDock();
}
loadProject=async function(file){
 if(state.recording||state.loadingProject){toast('D\u1eebng ghi / ch\u1edd m\u1edf d\u1ef1 \u00e1n hi\u1ec7n t\u1ea1i.');return;}
 state.loadingProject=true;busy(true,'Opening project and audio assets...');
 try{
  const data=JSON.parse(await file.text());live.transition=null;live.queue=null;live.audioEnabled=false;routeAudio();
  await LIVE_BASE.loadProject(file);busy(true,'Restoring audio and live cues...');await restoreLiveExtras(data.live);purgeAudioNodes();renderUI();
 }finally{state.loadingProject=false;busy(false);}
};
importModel=async function(files,options){if(state.recording){toast('Stop recording before importing a new stage.');return;}live.transition=null;live.queue=null;engine.activeAtlasId=null;const result=await LIVE_BASE.importModel(files,options);live.atlasPlan=null;live.selection.clear();engine._stageBatchDirty=true;renderLiveDock();return result;};
demo=function(){if(state.recording){toast('Stop recording before replacing the stage.');return;}live.transition=null;live.queue=null;engine.activeAtlasId=null;live.selection.clear();return LIVE_BASE.demo();};

/* Local audio mix. One video soundtrack per look, plus optional music track. */
const AUDIO_BASE={syncVideos,setPlaying};
function ensureAudioContext(){
 if(live.audioContext)return live.audioContext;
 const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)throw Error('Tr\u00ecnh duy\u1ec7t ch\u01b0a h\u1ed7 tr\u1ee3 Web Audio.');
 const ctx=new Ctx({latencyHint:'interactive'});live.audioContext=ctx;
 live.masterGain=ctx.createGain();live.masterGain.gain.value=0;live.analyser=ctx.createAnalyser();live.analyser.fftSize=512;live.audioSamples=new Uint8Array(live.analyser.fftSize);
 live.recordDest=ctx.createMediaStreamDestination();live.masterGain.connect(live.analyser);live.analyser.connect(ctx.destination);live.masterGain.connect(live.recordDest);return ctx;
}
function audioNode(element){
 if(live.audioNodes.has(element))return live.audioNodes.get(element);
 const ctx=ensureAudioContext(),source=ctx.createMediaElementSource(element),gain=ctx.createGain();gain.gain.value=0;source.connect(gain);gain.connect(live.masterGain);
 const node={element,source,gain,lastGain:0};live.audioNodes.set(element,node);element.muted=false;element.volume=1;return node;
}
function setAudioGain(node,value){if(Math.abs(node.lastGain-value)<.0005)return;node.gain.gain.setTargetAtTime(value,live.audioContext.currentTime,.018);node.lastGain=value;}
function currentVideoId(looks=null){
 const ids=looks?[...looks.values()].map(s=>s.source):engine.surfaces.filter(s=>s.enabled!==false).map(s=>s.source);
 return ids.find(id=>engine.media.get(id)?.type==='video')||null;
}
function routeAudio(){
 if(!live.audioContext){for(const a of state.media)if(a.type==='video')a.element.muted=true;return;}
 const ctx=live.audioContext,weights=new Map(),gain=live.audioEnabled?live.volume:0;
 live.masterGain.gain.setTargetAtTime(gain,ctx.currentTime,.02);
 if(live.audioMode==='video'||live.audioMode==='mix'){
  const current=currentVideoId(),old=live.transition?currentVideoId(live.transition.old):null,t=live.transition?clamp(live.transition.elapsed/live.transition.seconds,0,1):1;
  if(current)weights.set(engine.media.get(current).element,live.videoVolume*t);
  if(old)weights.set(engine.media.get(old).element,(weights.get(engine.media.get(old).element)||0)+live.videoVolume*(1-t));
 }
 if(live.audioTrack&&(live.audioMode==='music'||live.audioMode==='mix'))weights.set(live.audioTrack.element,live.musicVolume);
 for(const [element,value]of weights){try{setAudioGain(audioNode(element),Math.max(0,Math.min(2,value)));}catch(e){toast('Audio: '+e.message,6500);}}
 for(const [element,node]of live.audioNodes)if(!weights.has(element))setAudioGain(node,0);
}
async function enableAudio(value=true){
 if(value){try{const ctx=ensureAudioContext();await ctx.resume();if(ctx.state!=='running')throw Error('B\u1ea5m n\u00fat Audio tr\u1ef1c ti\u1ebfp \u0111\u1ec3 cho ph\u00e9p ph\u00e1t.');live.audioEnabled=true;}catch(e){live.audioEnabled=false;toast(e.message);return false;}}
 else live.audioEnabled=false;
 routeAudio();syncMusic(true);updateLiveIndicators();if($('audioEnabled'))$('audioEnabled').textContent=live.audioEnabled?'T\u1eaft \u00e2m thanh':'B\u1eadt \u00e2m thanh';return live.audioEnabled;
}
function removeMusic(){
 const a=live.audioTrack;if(a){a.element.pause();const node=live.audioNodes.get(a.element);if(node){node.source.disconnect();node.gain.disconnect();live.audioNodes.delete(a.element);}a.element.removeAttribute('src');a.element.load();URL.revokeObjectURL(a.url);}
 live.audioTrack=null;routeAudio();
}
async function addMusicFile(file,{silent=false}={}){
 if(file.size>150*1024*1024)throw Error('Nh\u1ea1c tr\u00ean 150 MB. D\u00f9ng MP3/WAV ng\u1eafn h\u01a1n.');
 if(!/^audio\//.test(file.type)&&!/\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name))throw Error('Ch\u1ecdn MP3, WAV, OGG, M4A ho\u1eb7c FLAC.');
 const url=URL.createObjectURL(file),element=new Audio();element.preload='auto';element.muted=true;
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{URL.revokeObjectURL(url);reject(Error('Kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c audio / codec.'));},18000);element.onloadeddata=()=>{clearTimeout(timer);resolve();};element.onerror=()=>{clearTimeout(timer);URL.revokeObjectURL(url);reject(Error('Kh\u00f4ng m\u1edf \u0111\u01b0\u1ee3c '+file.name));};element.src=url;});
 removeMusic();live.audioTrack={file,url,element,name:file.name,duration:Number.isFinite(element.duration)?element.duration:0};
 if(!silent){live.audioMode='music';toast('\u0110\u00e3 th\u00eam '+file.name+'. B\u1ea5m B\u1eadt \u00e2m thanh \u0111\u1ec3 nghe.');}
 routeAudio();syncMusic(true);updateLiveIndicators();return live.audioTrack;
}
function syncMusic(force=false){
 const a=live.audioTrack;if(!a)return;const v=a.element,now=performance.now(),t=state.time-live.audioOffset,enabled=live.audioEnabled&&(live.audioMode==='music'||live.audioMode==='mix');
 const inside=t>=0&&(live.audioLoop||t<a.duration);
 v.loop=live.audioLoop;
 let target=live.audioLoop&&a.duration>0?Math.max(0,t)%a.duration:clamp(t,0,Math.max(0,a.duration-.01));
 const drift=target-v.currentTime;
 if(v.readyState>=(force?1:2)&&(force||!v.seeking)&&(force||Math.abs(drift)>.3&&now-(a.lastCorrection||0)>1400)&&Math.abs(drift)>.025){v.currentTime=target;a.lastCorrection=now;}
 else if(!v.seeking&&Math.abs(drift)>.06&&Math.abs(drift)<.3)v.playbackRate=clamp(1+drift*.12,.98,1.02);else v.playbackRate=1;
 if(enabled&&inside&&state.playing&&!document.hidden){if(v.paused&&!a.pending){a.pending=true;Promise.resolve(v.play()).catch(e=>{if(e.name!=='AbortError')toast('B\u1ea5m Audio \u0111\u1ec3 cho ph\u00e9p ph\u00e1t nh\u1ea1c.');}).finally(()=>a.pending=false);}}
 else if(!v.paused)v.pause();
}
syncVideos=function(force=false){AUDIO_BASE.syncVideos(force);syncMusic(force);routeAudio();};
setPlaying=function(value){if(live.audioEnabled&&live.audioContext?.state==='suspended')live.audioContext.resume().catch(()=>{});AUDIO_BASE.setPlaying(value);syncMusic(true);};
function purgeAudioNodes(){
 const keep=new Set([...state.media.map(a=>a.element),live.audioTrack?.element]);
 for(const [e,n]of live.audioNodes)if(!keep.has(e)){n.source.disconnect();n.gain.disconnect();live.audioNodes.delete(e);}
}
function sampleAudioMeter(){
 if(!live.audioContext||!live.audioEnabled||live.audioContext.state!=='running'){live.audioRMS=0;return;}
 live.analyser.getByteTimeDomainData(live.audioSamples);let sum=0;for(const v of live.audioSamples)sum+=((v-128)/128)**2;live.audioRMS=Math.sqrt(sum/live.audioSamples.length);
 const meter=$('audioMeterFill');if(meter)meter.style.width=Math.min(100,live.audioRMS*350)+'%';
}
function openAudioPanel(){
 dialog('Audio / video & nh\u1ea1c ri\u00eang',`<div class="pro-banner"><div><span class="eyebrow">LOCAL AUDIO MIXER</span><h3>Nghe nh\u1ea1c. \u0110\u00e1nh visual.</h3><p>Ch\u1ec9 l\u1ea5y 1 soundtrack video m\u1ed7i look \u0111\u1ec3 tr\u00e1nh v\u1ecdng ti\u1ebfng; c\u00f3 crossfade khi chuy\u1ec3n look.</p></div><b>2<small>BUS</small></b></div>
 <div class="pro-settings"><button class="btn primary" id="audioEnabled">${live.audioEnabled?'T\u1eaft \u00e2m thanh':'B\u1eadt \u00e2m thanh'}</button><label>Ngu\u1ed3n<select id="audioMode"><option value="video">Ti\u1ebfng trong video</option><option value="music">Nh\u1ea1c ri\u00eang</option><option value="mix">Tr\u1ed9n video + nh\u1ea1c</option></select></label><button class="btn" id="addMusic">+ MP3 / WAV / M4A</button></div>
 <p class="audio-file">${esc(live.audioTrack?.name||'Ch\u01b0a c\u00f3 nh\u1ea1c ri\u00eang')} ${live.audioTrack?' / '+live.audioTrack.duration.toFixed(1)+' s':''}</p>
 ${range('audioMaster','Master volume',live.volume,0,1,.01)}${range('videoGain','Video volume',live.videoVolume,0,1,.01)}${range('musicGain','Music volume',live.musicVolume,0,1,.01)}
 <div class="pro-settings"><label>Nh\u1ea1c b\u1eaft \u0111\u1ea7u t\u1ea1i gi\u00e2y<input id="musicOffset" type="number" min="-600" max="600" step=".1" value="${live.audioOffset}"></label><label class="check-row"><input id="musicLoop" type="checkbox" ${live.audioLoop?'checked':''}>Loop nh\u1ea1c</label><label class="check-row"><input id="audioReactive" type="checkbox" ${live.reactive?'checked':''}>LED pulse theo m\u1ee9c \u00e2m</label></div>
 <div class="manager-actions"><button class="btn" id="durationFromMusic" ${!live.audioTrack?'disabled':''}>Timeline theo nh\u1ea1c</button><button class="btn" id="removeMusic" ${!live.audioTrack?'disabled':''}>B\u1ecf nh\u1ea1c ri\u00eang</button></div><p class="hint-text">C\u1ea7n b\u1ea5m cho ph\u00e9p \u00e2m thanh m\u1ed7i l\u1ea7n m\u1edf app. Pulse theo m\u1ee9c \u00e2m kh\u00f4ng ph\u1ea3i t\u1ef1 nh\u1eadn BPM. Nh\u1eadp BPM ho\u1eb7c d\u00f9ng TAP tr\u00ean b\u00e0n VJ.</p>`,[{label:'\u0110\u00f3ng'}]);
 $('audioMode').value=live.audioMode;$('audioEnabled').onclick=()=>enableAudio(!live.audioEnabled);$('addMusic').onclick=()=>$('musicInput').click();
 $('audioMode').onchange=e=>{live.audioMode=e.target.value;routeAudio();syncMusic(true);updateLiveIndicators();};
 for(const [id,k]of [['audioMaster','volume'],['videoGain','videoVolume'],['musicGain','musicVolume']])change(id,v=>{live[k]=+v;routeAudio();},{live:true,history:false});
 $('musicOffset').onchange=e=>{live.audioOffset=clamp(+e.target.value||0,-600,600);syncMusic(true);};$('musicLoop').onchange=e=>{live.audioLoop=e.target.checked;syncMusic(true);};$('audioReactive').onchange=e=>live.reactive=e.target.checked;
 $('durationFromMusic').onclick=()=>{if(live.audioTrack){state.duration=clamp(live.audioTrack.duration+live.audioOffset,1,600);state.time=Math.min(state.time,state.duration);renderUI();toast('Timeline: '+state.duration.toFixed(2)+' s');}};
 $('removeMusic').onclick=()=>{removeMusic();live.audioMode='video';openAudioPanel();};
}
function beginLiveRecording({duration=10,fps=50,withAudio=true}={}){
 if(state.recording)throw Error('Already recording. Stop the previous recording first.');
 if(!window.MediaRecorder||!engine.canvas.captureStream)throw Error('Tr\u00ecnh duy\u1ec7t kh\u00f4ng h\u1ed7 tr\u1ee3 ghi canvas.');
 const candidates=withAudio?['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm']:['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'];
 const mime=candidates.find(s=>MediaRecorder.isTypeSupported(s));if(!mime)throw Error('Kh\u00f4ng c\u00f3 encoder WebM.');
 const stream=engine.canvas.captureStream(fps),audioTracks=[];
 if(withAudio){ensureAudioContext();for(const track of live.recordDest.stream.getAudioTracks()){const clone=track.clone();stream.addTrack(clone);audioTracks.push(clone);}}
 const chunks=[],rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10000000,audioBitsPerSecond:160000});
 state.recorder=rec;state.recording=true;state.recordAudio=withAudio;engine.view='stage';const guides=engine.showGuides;engine.showGuides=false;
 rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onerror=e=>{toast('Ghi video: '+(e.error?.message||'encoder error'));if(rec.state!=='inactive')rec.stop();};
 rec.onstop=()=>{clearTimeout(state.recordTimer);for(const t of stream.getTracks())t.stop();state.recording=false;state.recordAudio=false;state.recorder=null;engine.showGuides=guides;
  if(chunks.length){const blob=new Blob(chunks,{type:mime});window.__lastRecording={bytes:blob.size,type:mime,requestedFPS:fps,audio:withAudio};download('ALPHA_Live_Preview'+(withAudio?'_Audio':'')+'.webm',blob);}renderUI();toast('\u0110\u00e3 ghi WebM realtime. Ch\u1ea5t l\u01b0\u1ee3ng theo FPS th\u1ef1c t\u1ebf, kh\u00f4ng ph\u1ea3i render frame-accurate.');};
 rec.start(250);state.recordTimer=setTimeout(()=>{if(rec.state!=='inactive')rec.stop();},clamp(duration,1,120)*1000);setPlaying(true);renderUI();return rec;
}
recordPreview=function(){
 if(state.recording){state.recorder?.stop();return;}
 dialog('Ghi ph\u1ed1i c\u1ea3nh + \u00e2m thanh','<p>Ghi canvas 3D trong th\u1eddi gian th\u1ef1c. Kh\u00f4ng ph\u1ea3i master LED render offline; c\u00f3 th\u1ec3 r\u01a1i frame khi GPU qu\u00e1 t\u1ea3i.</p><div class="pro-settings"><label>Gi\u00e2y<input id="recordSeconds" type="number" min="1" max="120" value="10"></label><label>FPS m\u1ee5c ti\u00eau<select id="recordFPS"><option>50</option><option>60</option><option>30</option></select></label><label class="check-row"><input type="checkbox" id="recordWithAudio" checked>Thu bus \u00e2m thanh</label></div><p class="hint-text">Gi\u1eef tab hi\u1ec3n th\u1ecb. C\u1ea3nh c\u00f3 strobe c\u1ea7n c\u1ea3nh b\u00e1o ng\u01b0\u1eddi xem.</p>',[{label:'H\u1ee7y'},{label:'B\u1eaft \u0111\u1ea7u',primary:true,action:async()=>{try{const audio=$('recordWithAudio').checked;if(audio&&!await enableAudio(true))return;beginLiveRecording({duration:+$('recordSeconds').value,fps:+$('recordFPS').value,withAudio:audio});}catch(e){toast(e.message,8000);}}}]);
};

/* Render packed content into an offscreen framebuffer. Never resize the stage viewport. */
function createAtlasRenderer(page){
 const e=engine,gl=e.gl,w=page.width,h=page.height;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>e.maxSize||h>e.maxSize||w*h>16777216)throw Error('Canvas xu\u1ea5t t\u1ed1i \u0111a 16 MP / gi\u1edbi h\u1ea1n GPU. Chia c\u1ee5m nh\u1ecf h\u01a1n.');
 const entries=page.items.map(r=>({r,s:e.surfaces.find(s=>s.id===r.surfaceId)}));
 if(entries.some(x=>!x.s))throw Error('M\u1ed9t LED \u0111\u00e3 b\u1ecb x\u00f3a. T\u00ednh l\u1ea1i c\u1ee5m tr\u01b0\u1edbc khi xu\u1ea5t.');
 const target=gl.createTexture(),framebuffer=gl.createFramebuffer();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,target);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,target,0);
 if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.deleteTexture(target);gl.deleteFramebuffer(framebuffer);throw Error('GPU kh\u00f4ng t\u1ea1o \u0111\u01b0\u1ee3c framebuffer c\u1ee5m.');}
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 for(const item of entries){
  const {s,r}=item,src=s.mesh,p=new Float32Array(src.p.length),n=new Float32Array(src.p.length);
  for(let i=0,j=0;i<p.length;i+=3,j+=2){p[i]=r.x+src.uv[j]*r.w;p[i+1]=r.y+src.uv[j+1]*r.h;p[i+2]=0;n[i+2]=1;}
  item.mesh=makeMesh('Atlas output '+s.name,p,src.uv,n,{color:[1,1,1,1]});if(src.mapUV)item.mesh.mapUV=src.mapUV;
 }
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false}),pixels=new Uint8Array(w*h*4),image=ctx.createImageData(w,h);let frames=0,disposed=false;
 function render(time=state.time,{restore=true}={}){
  if(disposed)throw Error('Atlas renderer disposed');const saved={view:e.view,guides:e.showGuides,test:e.globalTest};
  try{
   gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(0,0,w,h);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.POLYGON_OFFSET_FILL);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
   e.selectPass(1);gl.useProgram(e.program);e.view='stage';e.showGuides=false;e.globalTest=false;
   e.uniform('uVP',M.ortho(0,w,h,0,-10,10),'m');e.uniform('uEye',[0,0,10]);e.uniform('uTime',time);e.uniform('uAccent',hexrgb(e.accent));e.uniform('uMaster',[e.master.width,e.master.height]);
   for(const item of entries)if(item.s.enabled!==false)e.draw(item.mesh,1,{...item.s,liftMm:0});
   gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   for(let y=0;y<h;y++)image.data.set(pixels.subarray((h-y-1)*w*4,(h-y)*w*4),y*w*4);
   ctx.putImageData(image,0,0);frames++;
  }finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);e.view=saved.view;e.showGuides=saved.guides;e.globalTest=saved.test;if(restore)e.render(state.time);}
  return canvas;
 }
 function dispose(){if(disposed)return;disposed=true;for(const i of entries)e.releaseMesh(i.mesh);gl.deleteTexture(target);gl.deleteFramebuffer(framebuffer);}
 return {canvas,render,dispose,get frames(){return frames;},page};
}
async function exportAtlasVisualPNG(page){
 if(state.recording){toast('D\u1eebng ghi tr\u01b0\u1edbc khi xu\u1ea5t \u1ea3nh.');return;}
 const renderer=createAtlasRenderer(page);try{renderer.render();const blob=await new Promise(resolve=>renderer.canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Kh\u00f4ng t\u1ea1o \u0111\u01b0\u1ee3c PNG.');download('ALPHA_'+page.id+'_'+page.width+'x'+page.height+'_VISUAL.png',blob);}finally{renderer.dispose();}
}
function beginAtlasRecording(page,{duration=10,fps=30,withAudio=true}={}){
 if(state.recording)throw Error('\u0110ang ghi. H\u00e3y d\u1eebng b\u1ea3n ghi tr\u01b0\u1edbc.');
 if(page.width*page.height>8388608)throw Error('Ghi realtime t\u1ed1i \u0111a 8 MP. Chia c\u1ee5m; PNG v\u1eabn h\u1ed7 tr\u1ee3 16 MP.');
 const renderer=createAtlasRenderer(page);let stream,rec;
 try{
  renderer.render();stream=renderer.canvas.captureStream(fps);
  if(withAudio){ensureAudioContext();for(const t of live.recordDest.stream.getAudioTracks())stream.addTrack(t.clone());}
  const mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw Error('Kh\u00f4ng c\u00f3 encoder WebM.');
  rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:16000000,audioBitsPerSecond:160000});const chunks=[],start=performance.now();
  state.recording=true;state.recordAudio=withAudio;state.recorder=rec;state.atlasRecording={renderer,fps,lastFrame:-Infinity};
  rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onerror=e=>{toast(e.error?.message||'Atlas recording error');if(rec.state!=='inactive')rec.stop();};
  rec.onstop=()=>{
   clearTimeout(state.recordTimer);state.atlasRecording=null;state.recording=false;state.recordAudio=false;state.recorder=null;
   for(const t of stream.getTracks())t.stop();const seconds=(performance.now()-start)/1000,frames=renderer.frames;renderer.dispose();
   if(chunks.length){const blob=new Blob(chunks,{type:mime});window.__lastAtlasRecording={bytes:blob.size,width:page.width,height:page.height,renderedFrames:frames,elapsed:seconds,actualRenderFPS:frames/seconds,requestedFPS:fps,audio:withAudio};download('ALPHA_'+page.id+'_'+page.width+'x'+page.height+'_VISUAL.webm',blob);}renderUI();toast('\u0110\u00e3 xu\u1ea5t visual c\u1ee5m. WebM realtime, kh\u00f4ng cam k\u1ebft frame-accurate.');
  };
  rec.start(250);state.recordTimer=setTimeout(()=>{if(rec.state!=='inactive')rec.stop();},clamp(duration,1,120)*1000);setPlaying(true);renderUI();return rec;
 }catch(err){renderer.dispose();for(const t of stream?.getTracks()||[])t.stop();state.atlasRecording=null;state.recording=false;state.recorder=null;throw err;}
}
function openAtlasRecording(page){
 dialog('Xu\u1ea5t clip c\u1ee5m / '+page.width+' x '+page.height,`<p>Ghi n\u1ed9i dung \u0111ang ch\u1ea1y tr\u00ean t\u1eebng LED v\u00e0o canvas c\u1ee5m, gi\u1eef nguy\u00ean mapping s\u00e2n kh\u1ea5u. Kh\u00f4ng ch\u1ee9a ph\u1ed1i c\u1ea3nh hay v\u1ecf s\u00e2n kh\u1ea5u.</p><div class="pro-settings"><label>Gi\u00e2y<input id="atlasRecordDuration" type="number" min="1" max="120" value="10"></label><label>FPS m\u1ee5c ti\u00eau<select id="atlasRecordFPS"><option>30</option><option>50</option><option>60</option></select></label><label class="check-row"><input id="atlasRecordAudio" type="checkbox" checked>Thu bus audio</label></div><div class="info-box warning">Xu\u1ea5t realtime t\u1ed1n th\u00eam GPU v\u00e0 b\u0103ng th\u00f4ng. FPS th\u1ef1c t\u1ebf c\u00f3 th\u1ec3 th\u1ea5p h\u01a1n m\u1ee5c ti\u00eau; kh\u00f4ng thay th\u1ebf render offline ch\u00ednh x\u00e1c t\u1eebng frame. B\u1ea5m Xu\u1ea5t / D\u1eebng ghi \u0111\u1ec3 k\u1ebft th\u00fac s\u1edbm.</div>`,[{label:'H\u1ee7y'},{label:'Ghi visual c\u1ee5m',primary:true,action:async()=>{try{const duration=+$('atlasRecordDuration').value,fps=+$('atlasRecordFPS').value,withAudio=$('atlasRecordAudio').checked;if(withAudio&&!await enableAudio(true))return;beginAtlasRecording(page,{duration,fps,withAudio});}catch(e){toast(e.message,8000);}}}]);
}

/* Fixed live control surface; lightweight labels refresh separately from rendering. */
function renderLiveDock(){
 const dock=$('liveDock');if(!dock)return;
 dock.innerHTML=`<div class="live-head"><div class="live-title"><i></i><strong>LIVE VJ</strong><span>LOOK BANK / ${engine.surfaces.length} LED</span></div><div class="live-actions"><button class="btn small ${live.storeMode?'active':''}" id="storeLook">${live.storeMode?'Ch\u1ecdn \u00f4 \u0111\u1ec3 ghi':'Ghi look'}</button><button class="btn small" id="audioPanelBtn">Audio / Nh\u1ea1c</button><button class="btn small" id="audioQuick">${live.audioEnabled?'Audio ON':'B\u1eadt Audio'}</button><div class="audio-meter"><i id="audioMeterFill"></i></div><button class="perf-pill" id="perfPanelBtn"><b id="liveFPS">--</b><span>FPS<small id="livePerfHint">AUTO / 55</small></span></button><button id="closeLive" class="icon-btn" title="Thu gon VJ">&#215;</button></div></div>
 <div class="live-deck"><div class="cue-bank">${live.cues.map((c,i)=>`<button class="cue-pad cue-${i%4}" data-cue="${i}" title="${cueKeys[i].toUpperCase()} / Shift + click de ghi"><span class="cue-key">${cueKeys[i].toUpperCase()}</span><span class="cue-name">${esc(c.name)}</span><span class="cue-tag">${c.empty?'EMPTY':c.preset!==undefined?'GENERATIVE':'SAVED LOOK'}</span></button>`).join('')}</div>
 <div class="vj-mixer"><div class="mixer-row"><label>Chuy\u1ec3n<select id="vjTransition"><option value="fade">Crossfade</option><option value="wipe">Wipe</option><option value="dip">Dip to black</option><option value="cut">Cut</option></select></label><label>Gi\u00e2y<input id="vjSeconds" type="number" min="0" max="4" step=".05" value="${live.transitionSeconds}"></label><button class="btn small" id="tapBPM">TAP</button></div><div class="mixer-row"><label>BPM<input id="vjBPM" type="number" min="40" max="240" value="${live.bpm}"></label><label class="check-row"><input type="checkbox" id="vjQuantize" ${live.quantize?'checked':''}>Chuy\u1ec3n theo beat</label></div><div class="vj-fader"><span>DIM</span><input id="vjDim" type="range" min="0" max="1" step=".01" value="${live.opacity}" aria-label="LED intensity"><span id="vjDimValue">${Math.round(live.opacity*100)}%</span></div></div>
 <div class="fx-panel"><div class="fx-grid"><button class="fx-pad blackout ${live.blackout?'active':''}" id="vjBlackout">BLACKOUT<small>X / toggle</small></button><button class="fx-pad" id="vjFlash">FLASH<small>C / gi\u1eef</small></button><button class="fx-pad" id="vjStrobe" ${live.strobeArmed?'':'disabled'}>STROBE<small>V / gi\u1eef</small></button><button class="fx-pad" id="vjReset">RESET FX<small>v\u1ec1 an to\u00e0n</small></button></div><label class="check-row strobe-permission"><input id="armStrobe" type="checkbox" ${live.strobeArmed?'checked':''}>Cho ph\u00e9p strobe / nh\u1ea1y s\u00e1ng</label><div class="fx-faders"><label>HUE<input type="range" id="vjHue" min="0" max="1" step=".01" value="${live.hue}"></label><label>ZOOM<input type="range" id="vjZoom" min="1" max="2" step=".01" value="${live.zoom}"></label></div></div></div>`;
 dock.classList.toggle('hidden',!live.open);$('vjTransition').value=live.transitionType;
 dock.querySelectorAll('[data-cue]').forEach(b=>{
  b.onclick=e=>{const i=+b.dataset.cue;if(live.storeMode||e.shiftKey){captureCue(i,live.cues[i]?.empty?'Video look '+(i+1):live.cues[i].name);renderLiveDock();}else launchCue(i);};
  b.oncontextmenu=e=>{e.preventDefault();editCue(+b.dataset.cue);};
 });
 $('storeLook').onclick=()=>{live.storeMode=!live.storeMode;renderLiveDock();};$('closeLive').onclick=()=>toggleLive(false);$('audioPanelBtn').onclick=openAudioPanel;$('audioQuick').onclick=()=>enableAudio(!live.audioEnabled);$('perfPanelBtn').onclick=openPerformance;
 $('vjTransition').onchange=e=>live.transitionType=e.target.value;$('vjSeconds').onchange=e=>live.transitionSeconds=clamp(+e.target.value||0,0,4);
 $('vjBPM').onchange=e=>live.bpm=clamp(+e.target.value||120,40,240);$('tapBPM').onclick=tapBPM;$('vjQuantize').onchange=e=>live.quantize=e.target.checked;
 $('vjDim').oninput=e=>{live.opacity=+e.target.value;setText('vjDimValue',Math.round(live.opacity*100)+'%');};$('vjHue').oninput=e=>live.hue=+e.target.value;$('vjZoom').oninput=e=>live.zoom=+e.target.value;
 $('vjBlackout').onclick=()=>{live.blackout=!live.blackout;updateLiveIndicators();};$('vjReset').onclick=panicLive;
 const momentary=(id,set)=>{const e=$(id);e.onpointerdown=ev=>{if(e.disabled)return;ev.preventDefault();e.setPointerCapture(ev.pointerId);set(true);updateLiveIndicators();};for(const type of ['pointerup','pointercancel','lostpointercapture'])e.addEventListener(type,()=>{set(false);updateLiveIndicators();});};
 momentary('vjFlash',v=>live.flashHold=v);momentary('vjStrobe',v=>live.strobeHold=live.strobeArmed&&v);
 $('armStrobe').onchange=e=>{live.strobeArmed=e.target.checked;live.strobeHold=false;$('vjStrobe').disabled=!live.strobeArmed;if(live.strobeArmed)toast('Strobe g\u00e2y nh\u1ea5p nh\u00e1y nhanh. Tr\u00e1nh d\u00f9ng v\u1edbi ng\u01b0\u1eddi nh\u1ea1y c\u1ea3m \u00e1nh s\u00e1ng.',7000);};
 updateCuePads();updateLiveIndicators();
}
function updateCuePads(){
 document.querySelectorAll('[data-cue]').forEach(b=>{const i=+b.dataset.cue,c=live.cues[i];b.classList.toggle('is-live',live.currentCue===i);b.classList.toggle('is-queued',live.queue?.index===i);b.classList.toggle('is-empty',!!c?.empty);b.classList.toggle('is-store',live.storeMode);const n=b.querySelector('.cue-name');if(n&&c)n.textContent=c.name;});
}
function updateLiveIndicators(){
 $('vjBlackout')?.classList.toggle('active',live.blackout);$('vjFlash')?.classList.toggle('active',live.flashHold||live.flashLeft>0);$('vjStrobe')?.classList.toggle('active',live.strobeHold);
 setText('audioQuick',live.audioEnabled?'Audio ON':'B\u1eadt Audio');$('audioQuick')?.classList.toggle('active',live.audioEnabled);setText('showAudio',live.audioEnabled?'Audio ON':'Audio OFF');
 setText('storeLook',live.storeMode?'Ch\u1ecdn \u00f4 \u0111\u1ec3 ghi':'Ghi look');
}
function toggleLive(value=!live.open){
 live.open=!!value;document.body.classList.toggle('live-open',live.open);$('liveDock').classList.toggle('hidden',!live.open);$('vjToggle').classList.toggle('active',live.open);$('showVJ').classList.toggle('active',live.open);
 if(!live.open)resetMomentaryFX();if(engine._fitOnResize)engine.fit();renderLiveDock();
}
function editCue(index){
 const c=live.cues[index];dialog('Look '+(index+1),`<label>T\u00ean look<input id="cueNameEdit" maxlength="48" value="${esc(c.name)}"></label><p class="hint-text">Ghi l\u1ea1i l\u01b0u ngu\u1ed3n video, crop, m\u00e0u, FX v\u00e0 look \u0111\u00e8n. Kh\u00f4ng di chuy\u1ec3n model.</p>`,[{label:'\u0110\u00f3ng'},{label:'X\u00f3a look',action:()=>{checkpoint();live.cues[index]={name:'Slot '+(index+1),empty:true};renderLiveDock();}},{label:'\u0110\u1ed5i t\u00ean',action:()=>{checkpoint();c.name=$('cueNameEdit').value.trim()||'Look '+(index+1);renderLiveDock();}},{label:'Ghi look hi\u1ec7n t\u1ea1i',primary:true,action:()=>{captureCue(index,$('cueNameEdit').value);renderLiveDock();}}]);
}
function openPerformance(){
 dialog('Performance / \u0111o FPS th\u1ef1c',`<div class="pro-banner"><div><span class="eyebrow">FRAME PACING / LIVE DIAGNOSTICS</span><h3>M\u1ee5c ti\u00eau 55\u201360 FPS</h3><p>Auto h\u1ea1 \u0111\u1ed9 ph\u00e2n gi\u1ea3i preview khi th\u1ea5p h\u01a1n 50 FPS. Kh\u00f4ng \u0111\u1ed5i pixel map, crop ho\u1eb7c h\u00ecnh h\u1ecdc.</p></div></div><div class="info-box">FPS hi\u1ec3n th\u1ecb l\u00e0 FPS khung xem \u0111o th\u1ef1c, kh\u00f4ng ph\u1ea3i FPS file. Clip 25/30 FPS v\u1eabn ch\u1ec9 c\u00f3 25/30 khung h\u00ecnh ngu\u1ed3n m\u1ed7i gi\u00e2y. B\u1ea3n n\u00e0y kh\u00f4ng n\u1ed9i suy frame.</div><pre id="perfDetails" class="code-panel">${esc(JSON.stringify(performanceDiagnostics(),null,2))}</pre><p class="hint-text">D\u00f9ng t\u0103ng t\u1ed1c GPU, video proxy 1080p/50\u201360fps, gi\u1ea3m s\u1ed1 decoder \u0111\u1ed9c l\u1eadp. Model n\u1eb7ng ho\u1eb7c GPU y\u1ebfu c\u00f3 th\u1ec3 kh\u00f4ng \u0111\u1ea1t 50 FPS k\u1ec3 c\u1ea3 \u1edf ch\u1ebf \u0111\u1ed9 Nh\u1eb9.</p>`,[{label:'\u0110\u00f3ng'},{label:'Xu\u1ea5t ch\u1ea9n \u0111o\u00e1n',action:()=>downloadText('ALPHA_Performance.json',JSON.stringify(performanceDiagnostics(),null,2))},{label:'B\u1eadt Auto 55 FPS',primary:true,action:()=>{engine.autoQuality=true;engine.previewScale=Math.min(1,engine.previewScale||1);perfState.lastAdjust=0;updateStableControls();}}]);
}
const PRO_UI_BASE={renderUI,togglePresentation,activateSpatialLayout,assignMaster};
renderUI=function(){
 PRO_UI_BASE.renderUI();
 if($('deleteLED'))$('deleteLED').onclick=()=>{const s=surface();if(s)confirmDeleteMaps([s.id]);};
 setText('ledManagerBtn','LED / '+engine.surfaces.length);if(!$('liveDock').children.length)renderLiveDock();else{updateCuePads();updateLiveIndicators();}
 if(engine.activeAtlasId&&engine.view==='map')setText('selectionStatus','Pixel Map: '+(engine.outputAtlases?.find(x=>x.id===engine.activeAtlasId)?.name||engine.activeAtlasId)+' / xem 3D \u0111\u1ec3 th\u1ea5y t\u1ea5t c\u1ea3 c\u1ee5m.');
};
togglePresentation=function(){
 PRO_UI_BASE.togglePresentation();const dock=$('liveDock');if(state.presenting)document.body.appendChild(dock);else document.querySelector('.timeline-panel').prepend(dock);resetMomentaryFX();
};
activateSpatialLayout=function(){engine.activeAtlasId=null;return PRO_UI_BASE.activateSpatialLayout();};
assignMaster=function(a,options){engine.activeAtlasId=null;live.transition=null;live.queue=null;return PRO_UI_BASE.assignMaster(a,options);};
const proMapData=mappingData;
mappingData=function(){const d=proMapData();d.liveVersion='0.5.0';d.outputAtlases=engine.outputAtlases||[];d.activeAtlasId=engine.activeAtlasId||null;d.screens.forEach((s,i)=>{s.cluster=engine.surfaces[i].cluster||'Main';s.atlasId=engine.surfaces[i].atlasId||null;});return d;};
loop=function(now){
 const realDt=Math.max(0,(now-state.lastFrame)/1000);state.lastFrame=now;const dt=Math.min(realDt,1);
 if(document.hidden){requestAnimationFrame(loop);return;}
 try{
  if(state.playing&&!stableUI.scrubbing){advancePlayback(dt);updateRange10();if(state.time>=state.duration){if(state.loop){state.time%=state.duration;syncVideos(true);}else{state.time=state.duration;setPlaying(false);}}}
  advanceLive(dt);
  if(state.orbit&&state.playing&&engine.view==='stage'&&!engine.cameraLocked)engine.camera.yaw+=Math.min(.1,dt)*.07;
  if(now-stableUI.lastSync>100)syncVideos();
  if(now-live.lastAudioSync>65){sampleAudioMeter();routeAudio();live.lastAudioSync=now;}
  if(state.atlasRecording&&now-state.atlasRecording.lastFrame>=1000/state.atlasRecording.fps){state.atlasRecording.renderer.render(state.time,{restore:false});state.atlasRecording.lastFrame=now;}
  engine.render(state.time);
  if(now-perfState.lastOverlay>33){renderOverlays();perfState.lastOverlay=now;}
  if(now-stableUI.lastTransport>70){updateStableControls();updateCuePads();stableUI.lastTransport=now;}
  reportPerformance(now,realDt);
  if(now-perfState.lastLabels>1000){setText('engineState',state.recording?'REC / WebM'+(state.recordAudio?' + AUDIO':''):engine.surfaces.length+' LED / '+engine.lights.filter(l=>l.enabled).length+' lights');perfState.lastLabels=now;}
 }catch(e){if(!stableUI.loopErrors.includes(e.message)){stableUI.loopErrors.push(e.message);console.error(e);toast('Preview: '+e.message,8000);}state.playing=false;syncMusic();updateStableControls();}
 requestAnimationFrame(loop);
};
function initLiveEvents(){
 engine.autoQuality=true;engine.previewScale=1;engine.activeAtlasId=null;engine.outputAtlases=[];
 $('ledManagerBtn').onclick=openLEDManager;$('atlasBtn').onclick=openPixelStudio;$('vjToggle').onclick=()=>toggleLive();$('showVJ').onclick=()=>toggleLive();$('showAudio').onclick=()=>enableAudio(!live.audioEnabled);
 $('previewQuality').onchange=e=>{if(state.recording){toast('D\u1eebng ghi tr\u01b0\u1edbc khi \u0111\u1ed5i \u0111\u1ed9 ph\u00e2n gi\u1ea3i.');updateStableControls();return;}engine.autoQuality=e.target.value==='auto';if(!engine.autoQuality)engine.previewScale=+e.target.value;else engine.previewScale=Math.min(1,engine.previewScale);perfState.lowWindows=0;perfState.highWindows=0;updateStableControls();};
 $('musicInput').onchange=async e=>{try{if(e.target.files[0]){await addMusicFile(e.target.files[0]);if($('modal').open&&$('audioMode'))openAudioPanel();}}catch(err){toast(err.message,8000);}e.target.value='';};
 $('atlasMediaInput').onchange=async e=>{if(!e.target.files[0]||!live.pendingAtlas)return;busy(true,'\u0110ang g\u00e1n clip theo c\u1ee5m...');try{await assignAtlasClip(live.pendingAtlas,e.target.files[0]);$('modal').close();}catch(err){toast(err.message,8500);}finally{busy(false);e.target.value='';}};
 const tools=document.querySelector('.left-tools');const b=document.createElement('button');b.className='btn small';b.id='batchMaps';b.textContent='Ch\u1ecdn / x\u00f3a nhi\u1ec1u';tools.after(b);b.onclick=openLEDManager;
 const mediaHead=document.querySelector('.media-section .section-heading');const music=document.createElement('button');music.className='text-btn';music.textContent='+ Nh\u1ea1c';music.onclick=()=>$('musicInput').click();mediaHead.appendChild(music);
 document.addEventListener('drop',e=>{const files=[...(e.dataTransfer?.files||[])],audio=files.filter(f=>/^audio\//.test(f.type)||/\.(mp3|wav|ogg|m4a|flac)$/i.test(f.name));if(audio.length){if(audio.length===files.length){e.preventDefault();e.stopImmediatePropagation();$('dropOverlay').classList.add('hidden');}addMusicFile(audio[0]).catch(err=>toast(err.message));}},true);
 document.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,select')||$('modal').open||e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.toLowerCase();if(k==='escape'){resetMomentaryFX();return;}
  if((k==='delete'||k==='backspace')&&state.step==='mapping'&&!state.presenting&&!seq.open){e.preventDefault();e.stopImmediatePropagation();confirmDeleteMaps(live.selection.size?[...live.selection]:engine.selected?[engine.selected]:[]);return;}
  if(!live.open)return;if(e.repeat&&['x','c','v','t',...cueKeys].includes(k)){e.preventDefault();return;}
  const i=cueKeys.indexOf(k);if(i>=0){e.preventDefault();e.stopImmediatePropagation();if(e.shiftKey||live.storeMode)captureCue(i);else launchCue(i);}
  else if(k==='x'){e.preventDefault();live.blackout=!live.blackout;updateLiveIndicators();}else if(k==='c'){e.preventDefault();live.flashHold=true;updateLiveIndicators();}else if(k==='v'){e.preventDefault();live.strobeHold=live.strobeArmed;updateLiveIndicators();}else if(k==='t'){e.preventDefault();tapBPM();}
 },true);
 document.addEventListener('keyup',e=>{if(e.key.toLowerCase()==='c')live.flashHold=false;if(e.key.toLowerCase()==='v')live.strobeHold=false;updateLiveIndicators();});
 window.addEventListener('blur',resetMomentaryFX);document.addEventListener('visibilitychange',()=>{resetMomentaryFX();if(document.hidden)live.audioTrack?.element.pause();else syncMusic(true);});
 $('modal').addEventListener('close',()=>{if(!$('modal').open)$('modal').classList.remove('pro-wide');});
 $('recordBtn').onclick=recordPreview;
 const help=$('helpBtn').onclick;$('helpBtn').onclick=()=>{help();$('modalBody').insertAdjacentHTML('afterbegin','<h3>0.5 / LIVE CREATIVE</h3><p><b>LED</b>: ch\u1ecdn nhi\u1ec1u, x\u00f3a an to\u00e0n, gom c\u1ee5m. <b>Pixel Studio</b>: t\u00ednh cabinet, xu\u1ea5t atlas PNG/JSON, n\u1ea1p clip \u0111\u00fang c\u1ee5m. <b>LIVE VJ</b>: 8 look pads, QWER/ASDG; Shift+click ghi look; click ph\u1ea3i \u0111\u1ed5i t\u00ean. Crossfade/Wipe/Dip/Cut, X blackout, C flash, V strobe c\u1ea7n b\u1eadt cho ph\u00e9p. Audio nghe ti\u1ebfng video ho\u1eb7c nh\u1ea1c ri\u00eang; WebM thu \u0111\u01b0\u1ee3c audio.</p><p>FPS th\u1ef1c ph\u1ee5 thu\u1ed9c GPU/model; Auto m\u1ee5c ti\u00eau 55 FPS, kh\u00f4ng n\u1ed9i suy clip 25/30fps.</p>');};
 renderLiveDock();
}
const liveAPI={live,toggleLive,launchCue,captureCue,advanceLive,panicLive,deleteMapIds,openLEDManager,openPixelStudio,planAtlas,validateAtlas,nativeEstimate,assignAtlasClip,exportAtlasPNG,exportAtlasJSON,
 openPerformance,performanceDiagnostics,enableAudio,openAudioPanel,addMusicFile,removeMusic,syncVideos,setPlaying,recordPreview,beginLiveRecording,
 renderUI,loadProject,importModel,demo,assignMaster,mappingData,togglePresentation,activateSpatialLayout,snapshot,restore,
 createAtlasRenderer,exportAtlasVisualPNG,beginAtlasRecording,getPerformance:performanceDiagnostics,activeVideos,packLiveExtras};

showHelp=function(){
 dialog('ALPHA 0.5 LIVE / H\u01b0\u1edbng d\u1eabn',`<h3>1. Gi\u1eef mapping c\u0169</h3><p>L\u01b0u .ledstudio trong b\u1ea3n c\u0169, m\u1edf l\u1ea1i \u1edf b\u1ea3n n\u00e0y. Model, UV, crop v\u00e0 v\u1ecb tr\u00ed \u0111\u00e8n \u0111\u01b0\u1ee3c gi\u1eef nguy\u00ean.</p><h3>2. X\u00f3a nhi\u1ec1u map</h3><p>B\u1ea5m <b>LED / s\u1ed1 l\u01b0\u1ee3ng</b>, tick c\u00e1c m\u00e0n r\u1ed3i x\u00f3a. Ch\u1ec9 x\u00f3a mapping, kh\u00f4ng x\u00f3a model. Ctrl+Z ho\u00e0n t\u00e1c.</p><h3>3. Pixel Studio</h3><p>Nh\u1eadp cabinet/pixel th\u1ef1c, t\u00ednh v\u00e0 duy\u1ec7t s\u1ed1 pixel, r\u1ed3i gom chung master ho\u1eb7c theo c\u1ee5m. Xu\u1ea5t PNG h\u01b0\u1edbng d\u1eabn/JSON/CSV, ho\u1eb7c <b>PNG visual / WebM visual</b> \u0111\u1ec3 l\u1ea5y n\u1ed9i dung \u0111ang ch\u1ea1y. Kh\u00f4ng t\u1ef1 \u0111\u1ed5i crop c\u0169 cho \u0111\u1ebfn khi b\u1ea1n n\u1ea1p clip cho c\u1ee5m.</p><h3>4. LIVE VJ</h3><p>Q W E R / A S D G g\u1ecdi 8 look. B\u1eadt <b>Ghi look</b> ho\u1eb7c Shift+click \u0111\u1ec3 l\u01b0u look hi\u1ec7n t\u1ea1i. Ch\u1ecdn Crossfade/Wipe/Dip/Cut. X: Blackout; gi\u1eef C: Flash; gi\u1eef V: Strobe sau khi cho ph\u00e9p. T: TAP BPM. Strobe nh\u00e1y nhanh, tr\u00e1nh ng\u01b0\u1eddi nh\u1ea1y s\u00e1ng.</p><h3>5. Audio</h3><p>B\u1ea5m <b>B\u1eadt Audio</b>. Ch\u1ecdn ti\u1ebfng video, MP3/WAV ri\u00eang ho\u1eb7c tr\u1ed9n c\u1ea3 hai. C\u00f3 volume ri\u00eang, offset, loop v\u00e0 thu audio trong WebM.</p><h3>6. \u0110\u1ed9 m\u01b0\u1ee3t</h3><p>Auto / 55 FPS t\u1ef1 gi\u1ea3m \u0111\u1ed9 ph\u00e2n gi\u1ea3i preview; c\u00f3 Nh\u1eb9 v\u00e0 Si\u00eau nh\u1eb9. S\u1ed1 FPS l\u00e0 s\u1ed1 \u0111o th\u1ef1c, kh\u00f4ng cam k\u1ebft tr\u00ean 50 FPS tr\u00ean m\u1ecdi GPU. Clip 30 FPS kh\u00f4ng t\u1ef1 th\u00e0nh 60 FPS.</p><div class="info-box">B\u1ea3n ph\u00e1t tri\u1ec3n local/offline. Ghi WebM realtime, ch\u01b0a render offline frame-accurate. Ch\u01b0a c\u00f3 MP4 output, NDI/Spout, DMX, genlock hay m\u1edf SKP tr\u1ef1c ti\u1ebfp. Ph\u00edm F: to\u00e0n c\u1ea3nh; L: kh\u00f3a g\u00f3c; Space: ph\u00e1t/t\u1ea1m d\u1eebng.</div>`,[{label:'\u0110\u00f3ng'},{label:'Pixel Studio',action:openPixelStudio},{label:'Audio / Nh\u1ea1c',action:openAudioPanel},{label:'M\u1edf LIVE VJ',primary:true,action:()=>toggleLive(true)}]);
};
