/* Bundled skinned performers: local classic-script loading also supports file://. */
(function(){
 'use strict';
 const S=window.STUDIO;if(!S)return;
 try{
 const tr18=(vi,en)=>typeof tr==='function'?tr(vi,en):(window.tr?window.tr(vi,en):vi);
 const loc18=s=>typeof localizeObjectName==='function'?localizeObjectName(s):(window.localizeObjectName?window.localizeObjectName(s):String(s??''));
 const CLIP_VI18={
  'Dance 01 - Stage Mix (16s)':'Vũ đạo 01 - Tổ hợp sân khấu (16s)',
  'Dance 02 - Charleston':'Vũ đạo 02 - Bước nhảy Charleston',
  'Dance 03 - Body Roll':'Vũ đạo 03 - Lượn sóng cơ thể',
  'Dance 04 - Reach Hip':'Vũ đạo 04 - Vươn tay đánh hông',
  'Dance 05 - Duo Mix (8s)':'Vũ đạo 05 - Tổ hợp đôi (8s)',
  'Dance 02 - Contemporary Flow (8s)':'Vũ đạo 02 - Đương đại lượn sóng (8s)',
  'Dance 03 - Finale Pose (8s)':'Vũ đạo 03 - Tổ hợp kết màn (8s)',
  'Dance 06 - Contemporary Flow (8s)':'Vũ đạo 06 - Đương đại lượn sóng (8s)',
  'Dance 07 - Finale Pose (8s)':'Vũ đạo 07 - Tổ hợp kết màn (8s)',
  'Dance 08 - Grand Showpiece Suite (24s)':'Vũ đạo 08 - Đại cảnh phức hợp 6 chương (24s)',
  'Singer 01 - Vocal Performance (8s)':'Ca sĩ 01 - Hát chính cảm xúc (8s)',
  'Singer 02 - Audience Gesture (8s)':'Ca sĩ 02 - Giao lưu khán giả (8s)',
  'Singer 03 - Quiet Idle (6s)':'Ca sĩ 03 - Đứng nhịp chờ (6s)',
  'Singer 04 - Anthem Climax & Stage Walk (16s)':'Ca sĩ 04 - Cao trào điệp khúc & Giao lưu 2 cánh (16s)',
  'Singer 05 - Upbeat Groove & Crowd Singalong (20s)':'Ca sĩ 05 - Đại cảnh khuấy động khán giả (20s)',
  'Host 01 - Speaking (8s)':'MC 01 - Phát biểu & Giao lưu (8s)',
  'Host 02 - Presenting Gesture (8s)':'MC 02 - Giới thiệu & Mở tay chào (8s)',
  'Host 03 - Neutral Idle (6s)':'MC 03 - Đứng chờ & Lắng nghe (6s)',
  'Host 04 - Gala Opening & Dual-Wing Intro (16s)':'MC 04 - Khai mạc Gala & Giới thiệu 2 cánh sân khấu (16s)',
  'Host 05 - Award Ceremony & Applause Lead (20s)':'MC 05 - Công bố giải thưởng & Khuấy động pháo tay (20s)',
  'Guitarist 01 - Rhythm Strum (8s)':'Guitar điện 01 - Quạt chả nhịp (8s)',
  'Guitarist 02 - Lead Phrase (8s)':'Guitar điện 02 - Phiêu câu Lead (8s)',
  'Guitarist 03 - Ready Idle (6s)':'Guitar điện 03 - Đứng nhịp chờ (6s)',
  'Guitarist 04 - Stadium Showpiece Solo (16s)':'Guitar điện 04 - Solo đại cảnh liên hoàn (16s)',
  'Bassist 01 - Fingerstyle Groove (8s)':'Guitar Bass 01 - Đi ngón Groove (8s)',
  'Bassist 02 - Accent Phrase (8s)':'Guitar Bass 02 - Nhấn câu Bass (8s)',
  'Bassist 03 - Ready Idle (6s)':'Guitar Bass 03 - Đứng nhịp chờ (6s)',
  'Bassist 04 - Funk Slap & Stage Groove (16s)':'Guitar Bass 04 - Slap Funk & Phiêu nhịp dài (16s)',
  'Keyboardist 01 - Two-Hand Chords (8s)':'Keyboard 01 - Đệm hợp âm hai tay (8s)',
  'Keyboardist 02 - Right-Hand Lead (8s)':'Keyboard 02 - Solo giai điệu tay phải (8s)',
  'Keyboardist 03 - Ready Idle (6s)':'Keyboard 03 - Đứng nhịp chờ (6s)',
  'Keyboardist 04 - Prog Synth Virtuoso (16s)':'Keyboard 04 - Độc tấu Synth liên hoàn (16s)',
  'Drummer 01 - Basic Groove (8s)':'Trống Jazz 01 - Nhịp Groove chính (8s)',
  'Drummer 02 - Fill Phrase (8s)':'Trống Jazz 02 - Báo trống cao trào (8s)',
  'Drummer 03 - Ready Idle (6s)':'Trống Jazz 03 - Tư thế sẵn sàng (6s)',
  'Drummer 04 - Stadium Drum Solo (16s)':'Trống Jazz 04 - Solo trống liên hoàn (16s)',
  'Urban Dancer 01 - Groove (8s)':'Vũ công Urban 01 - Nhún nhịp Groove (8s)',
  'Urban Dancer 02 - Footwork (8s)':'Vũ công Urban 02 - Vũ đạo chân Footwork (8s)',
  'Urban Dancer 03 - Stage Mix (16s)':'Vũ công Urban 03 - Tổ hợp bùng nổ (16s)',
  'Urban Dancer 04 - Street Cypher Showdown (16s)':'Vũ công Urban 04 - Tổ hợp Cypher đối kháng (16s)',
  'Urban Dancer 05 - Grand Freestyle Suite (20s)':'Vũ công Urban 05 - Đại cảnh Freestyle 5 chương (20s)',
  'Violinist 01 - Lyrical Bowing (8s)':'Violin 01 - Kéo vĩ trữ tình (8s)',
  'Violinist 02 - Virtuoso Solo (8s)':'Violin 02 - Solo cao trào (8s)',
  'Violinist 03 - Ready Idle (6s)':'Violin 03 - Đứng nhịp chờ (6s)',
  'Violinist 04 - Concerto Cadence & Encore (16s)':'Violin 04 - Độc tấu Cadence & Chào kết (16s)',
  'Saxophonist 01 - Smooth Groove (8s)':'Saxophone 01 - Phiêu nhịp Jazz (8s)',
  'Saxophonist 02 - Horn Solo (8s)':'Saxophone 02 - Độc tấu vươn kèn (8s)',
  'Saxophonist 03 - Ready Idle (6s)':'Saxophone 03 - Đứng nhịp chờ (6s)',
  'Saxophonist 04 - Midnight Jazz Odyssey (16s)':'Saxophone 04 - Độc tấu Jazz cao trào (16s)',
  'Rapper 01 - Flow Verse (8s)':'Rapper 01 - Đi Flow nhấn nhịp (8s)',
  'Rapper 02 - Crowd Hype (8s)':'Rapper 02 - Khuấy động khán giả (8s)',
  'Rapper 03 - Bounce Idle (6s)':'Rapper 03 - Nhún nhịp chờ (6s)',
  'Rapper 04 - Headline Cypher & Wing Walk (16s)':'Rapper 04 - Đi Flow liên hoàn & Giao lưu 2 cánh (16s)',
  'Rapper 05 - Festival Drop & Crowd Jump (20s)':'Rapper 05 - Đại cảnh bùng nổ Hype 5 chương (20s)',
  'DJ 01 - Deck Mix (8s)':'DJ 01 - Mix nhạc trên bàn xoay (8s)',
  'DJ 02 - Hands Up Drop (8s)':'DJ 02 - Giơ tay cao trào Drop (8s)',
  'DJ 03 - Booth Groove (6s)':'DJ 03 - Nhún nhịp sau bàn DJ (6s)',
  'DJ 04 - Mainstage Festival Set (16s)':'DJ 04 - Set nhạc Festival bùng nổ (16s)',
  'LED Dancer 01 - Baton Wave (8s)':'Vũ công LED 01 - Lượn sóng gậy sáng (8s)',
  'LED Dancer 02 - Spin Routine (8s)':'Vũ công LED 02 - Xoay người phát sáng (8s)',
  'LED Dancer 03 - Ready Idle (6s)':'Vũ công LED 03 - Tư thế sẵn sàng (6s)',
  'LED Dancer 04 - Neon Infinity Matrix (16s)':'Vũ công LED 04 - Tổ hợp gậy sáng vô cực (16s)',
  'LED Dancer 05 - Cyber Lightshow Finale (20s)':'Vũ công LED 05 - Đại cảnh ánh sáng 5 chương (20s)',
  'Water Drummer 01 - Power Beat (8s)':'Trống nước 01 - Nhịp trống dồn lực (8s)',
  'Water Drummer 02 - Dual Roll (8s)':'Trống nước 02 - Đánh dùi luân phiên (8s)',
  'Water Drummer 03 - Ready Idle (6s)':'Trống nước 03 - Tư thế sẵn sàng (6s)',
  'Water Drummer 04 - Tsunami Festival Finale (16s)':'Trống nước 04 - Đại cảnh sóng nước cao trào (16s)',
  'Laser Dancer 01 - Beam Pose Flow (8s)':'Vũ công Laser 01 - Chiếu tia tạo dáng (8s)',
  'Laser Dancer 02 - Matrix Spin (8s)':'Vũ công Laser 02 - Xoay vòng quét tia (8s)',
  'Laser Dancer 03 - Ready Idle (6s)':'Vũ công Laser 03 - Tư thế sẵn sàng (6s)',
  'Laser Dancer 04 - Prism Geometric Tutting (16s)':'Vũ công Laser 04 - Vũ đạo tia khúc xạ đa tầng (16s)',
  'Laser Dancer 05 - Laser Overdrive Finale (20s)':'Vũ công Laser 05 - Đại cảnh quét tia 5 chương (20s)',
  'Fan Dancer 01 - Silk Bloom (8s)':'Múa quạt lụa 01 - Xòe quạt nở hoa (8s)',
  'Fan Dancer 02 - Graceful Swirl (8s)':'Múa quạt lụa 02 - Xoay lụa uyển chuyển (8s)',
  'Fan Dancer 03 - Poised Idle (6s)':'Múa quạt lụa 03 - Tạo dáng tĩnh (6s)',
  'Fan Dancer 04 - Imperial Lotus Suite (16s)':'Múa quạt lụa 04 - Tổ hợp Liên Hoa Vũ (16s)',
  'Fan Dancer 05 - Phoenix Silk Grand Finale (20s)':'Múa quạt lụa 05 - Đại cảnh Phượng Hoàng Lụa (20s)'
 };
 const GENDER_PAIRS18={
  'stage-dancer':{primary:'stage-dancer',female:'stage-dancer',male:'stage-dancer-male'},
  'stage-dancer-male':{primary:'stage-dancer',female:'stage-dancer',male:'stage-dancer-male'},
  'stage-singer':{primary:'stage-singer',female:'stage-singer',male:'stage-singer-male'},
  'stage-singer-male':{primary:'stage-singer',female:'stage-singer',male:'stage-singer-male'},
  'stage-host':{primary:'stage-host',female:'stage-host-female',male:'stage-host'},
  'stage-host-female':{primary:'stage-host',female:'stage-host-female',male:'stage-host'}
 };
 const SHARED_DANCE_CLIPS18=['Dance 01 - Stage Mix (16s)','Dance 02 - Charleston','Dance 03 - Body Roll','Dance 04 - Reach Hip','Dance 05 - Duo Mix (8s)','Dance 06 - Contemporary Flow (8s)','Dance 07 - Finale Pose (8s)','Dance 08 - Grand Showpiece Suite (24s)'];
 const SHARED_SINGER_CLIPS18=['Singer 01 - Vocal Performance (8s)','Singer 02 - Audience Gesture (8s)','Singer 03 - Quiet Idle (6s)','Singer 04 - Anthem Climax & Stage Walk (16s)','Singer 05 - Upbeat Groove & Crowd Singalong (20s)'];
 const SHARED_HOST_CLIPS18=['Host 01 - Speaking (8s)','Host 02 - Presenting Gesture (8s)','Host 03 - Neutral Idle (6s)','Host 04 - Gala Opening & Dual-Wing Intro (16s)','Host 05 - Award Ceremony & Applause Lead (20s)'];
 const withClipsVi=list=>list.map(c=>({...c,baseClipCount18:c.clips.length,clipsVi:c.clipsVi||c.clips.map(n=>CLIP_VI18[n]||n)}));
 const clipLabel18=(c,i)=>{const en=c.clips[i]||'',vi=c.clipsVi?.[i]||CLIP_VI18[en]||en;return tr18(vi,en);};
 const catalog=withClipsVi([
  {id:'stage-dancer',name:'Stage Dancer',role:'dancer',cat:'dancer',gender:'female',pairId:'stage-dancer-male',file:'stage_dancer',height:1.9126,clips:SHARED_DANCE_CLIPS18.slice()},
  {id:'stage-dancer-male',name:'Stage Dancer (Male)',role:'dancer',cat:'dancer',gender:'male',pairId:'stage-dancer',file:'stage_dancer_male',height:1.829384,clips:SHARED_DANCE_CLIPS18.slice()},
  {id:'stage-singer',name:'Stage Singer',role:'singer',cat:'vocal',gender:'female',pairId:'stage-singer-male',file:'stage_singer',height:1.81446834,clips:SHARED_SINGER_CLIPS18.slice()},
  {id:'stage-singer-male',name:'Stage Singer (Male)',role:'singer',cat:'vocal',gender:'male',pairId:'stage-singer',file:'stage_singer_male',height:1.842559,clips:SHARED_SINGER_CLIPS18.slice()},
  {id:'stage-host',name:'Stage Host',role:'singer',cat:'host',gender:'male',pairId:'stage-host-female',file:'stage_host',height:1.834757,clips:SHARED_HOST_CLIPS18.slice()},
  {id:'stage-host-female',name:'Stage Host (Female)',role:'singer',cat:'host',gender:'female',pairId:'stage-host',file:'stage_host_female',height:1.826315,clips:SHARED_HOST_CLIPS18.slice()},
  {id:'stage-guitarist',name:'Stage Guitarist',role:'guitarist',cat:'musician',file:'stage_guitarist',height:1.851566,clips:['Guitarist 01 - Rhythm Strum (8s)','Guitarist 02 - Lead Phrase (8s)','Guitarist 03 - Ready Idle (6s)','Guitarist 04 - Stadium Showpiece Solo (16s)']},
  {id:'stage-bassist',name:'Stage Bassist',role:'guitarist',cat:'musician',file:'stage_bassist',height:1.844444,clips:['Bassist 01 - Fingerstyle Groove (8s)','Bassist 02 - Accent Phrase (8s)','Bassist 03 - Ready Idle (6s)','Bassist 04 - Funk Slap & Stage Groove (16s)']},
  {id:'stage-keyboardist',name:'Stage Keyboardist',role:'keyboardist',cat:'musician',file:'stage_keyboardist',height:1.846283,clips:['Keyboardist 01 - Two-Hand Chords (8s)','Keyboardist 02 - Right-Hand Lead (8s)','Keyboardist 03 - Ready Idle (6s)','Keyboardist 04 - Prog Synth Virtuoso (16s)']},
  {id:'stage-drummer',name:'Stage Drummer',role:'drummer',cat:'musician',file:'stage_drummer',height:1.858031,clips:['Drummer 01 - Basic Groove (8s)','Drummer 02 - Fill Phrase (8s)','Drummer 03 - Ready Idle (6s)','Drummer 04 - Stadium Drum Solo (16s)']},
  {id:'stage-dancer-urban',name:'Urban Dancer',role:'dancer',cat:'dancer',file:'stage_dancer_urban',height:1.838545,clips:['Urban Dancer 01 - Groove (8s)','Urban Dancer 02 - Footwork (8s)','Urban Dancer 03 - Stage Mix (16s)','Urban Dancer 04 - Street Cypher Showdown (16s)','Urban Dancer 05 - Grand Freestyle Suite (20s)']},
  {id:'stage-violinist',name:'Stage Violinist',role:'violinist',cat:'musician',file:'stage_violinist',height:1.825723,clips:['Violinist 01 - Lyrical Bowing (8s)','Violinist 02 - Virtuoso Solo (8s)','Violinist 03 - Ready Idle (6s)','Violinist 04 - Concerto Cadence & Encore (16s)']},
  {id:'stage-saxophonist',name:'Stage Saxophonist',role:'saxophonist',cat:'musician',file:'stage_saxophonist',height:1.831936,clips:['Saxophonist 01 - Smooth Groove (8s)','Saxophonist 02 - Horn Solo (8s)','Saxophonist 03 - Ready Idle (6s)','Saxophonist 04 - Midnight Jazz Odyssey (16s)']},
  {id:'stage-rapper',name:'Stage Rapper',role:'rapper',cat:'vocal',file:'stage_rapper',height:1.825866,clips:['Rapper 01 - Flow Verse (8s)','Rapper 02 - Crowd Hype (8s)','Rapper 03 - Bounce Idle (6s)','Rapper 04 - Headline Cypher & Wing Walk (16s)','Rapper 05 - Festival Drop & Crowd Jump (20s)']},
  {id:'stage-dj',name:'Stage DJ',role:'dj',cat:'musician',file:'stage_dj',height:1.84197,clips:['DJ 01 - Deck Mix (8s)','DJ 02 - Hands Up Drop (8s)','DJ 03 - Booth Groove (6s)','DJ 04 - Mainstage Festival Set (16s)']},
  {id:'stage-led-dancer',name:'LED Suit Dancer',role:'leddancer',cat:'dancer',file:'stage_led_dancer',height:1.822735,clips:['LED Dancer 01 - Baton Wave (8s)','LED Dancer 02 - Spin Routine (8s)','LED Dancer 03 - Ready Idle (6s)','LED Dancer 04 - Neon Infinity Matrix (16s)','LED Dancer 05 - Cyber Lightshow Finale (20s)']},
  {id:'stage-water-drummer',name:'Water Drummer',role:'waterdrummer',cat:'musician',file:'stage_water_drummer',height:1.853712,clips:['Water Drummer 01 - Power Beat (8s)','Water Drummer 02 - Dual Roll (8s)','Water Drummer 03 - Ready Idle (6s)','Water Drummer 04 - Tsunami Festival Finale (16s)']},
  {id:'stage-laser-dancer',name:'Laser Dancer',role:'laserdancer',cat:'dancer',file:'stage_laser_dancer',height:1.817673,clips:['Laser Dancer 01 - Beam Pose Flow (8s)','Laser Dancer 02 - Matrix Spin (8s)','Laser Dancer 03 - Ready Idle (6s)','Laser Dancer 04 - Prism Geometric Tutting (16s)','Laser Dancer 05 - Laser Overdrive Finale (20s)']},
  {id:'stage-fan-dancer',name:'Silk Fan Dancer',role:'fandancer',cat:'dancer',file:'stage_fan_dancer',height:1.855075,clips:['Fan Dancer 01 - Silk Bloom (8s)','Fan Dancer 02 - Graceful Swirl (8s)','Fan Dancer 03 - Poised Idle (6s)','Fan Dancer 04 - Imperial Lotus Suite (16s)','Fan Dancer 05 - Phoenix Silk Grand Finale (20s)']}
 ]);
 const base=new URL('../../assets/characters/',document.currentScript.src).href;
 const sources=new Map(),pending=new Map();
 window.stageCharacterPacks18=window.stageCharacterPacks18||Object.create(null);
 const spec=id=>catalog.find(c=>c.id===id);
 function sanitize(p){
  const c=spec(p?.model18);if(!c)return {};
  const clip18=clamp(Math.trunc(Number(p.clip18)||0),0,c.clips.length-1);
  const out={model18:c.id,clip18,speed18:clamp(Number(p.speed18)||1,.25,2)};
  const sh=c.shared18?.[clip18];
  if(sh&&spec(sh.sourceId))out.shared18={sourceId:sh.sourceId,clipIndex:sh.clipIndex};
  return out;
 }
 async function load(id){
  if(!spec(id))throw Error('Unknown bundled character');
  if(sources.has(id))return sources.get(id);
  if(pending.has(id))return pending.get(id);
  const task=(async()=>{
   const c=spec(id),packs=window.stageCharacterPacks18;
   if(!Object.hasOwn(packs,id))await new Promise((resolve,reject)=>{
    const el=document.createElement('script');el.src=base+id+'/'+c.file+'.pack.js';
    const timer=setTimeout(()=>{el.remove();reject(Error('Character load timed out'));},20000);
    el.onload=()=>{clearTimeout(timer);el.remove();resolve();};
    el.onerror=()=>{clearTimeout(timer);el.remove();reject(Error('Cannot load bundled character: '+c.name));};
    document.head.append(el);
   });
   const encoded=packs[id];
   if(typeof encoded!=='string'||encoded.length>12000000)throw Error('Invalid character pack');
   const bytes=Uint8Array.from(atob(encoded),v=>v.charCodeAt(0));
   const source=await Importer.gltf(new File([bytes],c.file+'.glb'),new Map());
   if(!source.meshes.length||!source.meshes.every(m=>m._gltfAnim))throw Error('Missing character rig');
   sources.set(id,source);delete packs[id];return source;
  })();
  pending.set(id,task);
  try{return await task;}finally{pending.delete(id);}
 }
 const BASE={buildHuman,castMatrix,personBounds8,drawCast:StageEngine.prototype.drawCast,restoreLiveExtras,renderCastManager,open:S.openCastLibrary16};
 buildHuman=function(d,...args){
  const source=sources.get(d.model18);if(!source)return BASE.buildHuman(d,...args);
  const scenes=new Map();
  const meshes=source.meshes.map(m=>{
   const ga=m._gltfAnim;
   if(!scenes.has(ga.sceneAnim)){
    const {clips,...pose}=ga.sceneAnim;
    scenes.set(ga.sceneAnim,{...structuredClone(pose),clips,lastTime:-1,dirty:true});
   }
   const mesh=makeMesh(m.name,m.p.slice(),m.uv,m.n.slice(),{...m.material});
   mesh.cast11=true;
   mesh._gltfAnim={...ga,sceneAnim:scenes.get(ga.sceneAnim),workP:ga.workP.slice(),workN:ga.workN.slice()};
   return mesh;
  });
  return [{name:'bundled',model18:d.model18,pivot:[0,0,0],meshes,time18:0}];
 };
 castMatrix=function(d,node,t){
  if(!node.model18)return BASE.castMatrix(d,node,t);
  const scale=1.75/spec(node.model18).height;
  return M.mm(BASE.castMatrix(d,{kind11:'instrument',pivot:[0,0,0]},t),M.trs([0,0,0],[0,0,0,1],[scale,scale,scale]));
 };
 personBounds8=function(d){
  const nodes=castCache.get(d.id);
  if(!d.model18||!nodes?.[0]?.model18)return BASE.personBounds8(d);
  const points=[];
  for(const node of nodes){const mat=castMatrix(d,node,state.time);
   for(const m of node.meshes)for(const x of [m.bounds.min[0],m.bounds.max[0]])for(const y of [m.bounds.min[1],m.bounds.max[1]])for(const z of [m.bounds.min[2],m.bounds.max[2]])points.push(...M.point(mat,[x,y,z]));
  }
  return M.bbox(points);
 };
 StageEngine.prototype.drawCast=function(t){
  if(this===engine)for(const d of seq.people){
   if(d.hidden||!d.model18)continue;
   for(const node of castCache.get(d.id)||[]){
    if(!node.model18)continue;
    if(seq.animate&&d.animate!==false)node.time18=t;
    const opts=sanitize(d),updated=new Map();
    for(const m of node.meshes){
     const sa=m._gltfAnim.sceneAnim;sa.activeClip=opts.clip18;sa.speed=opts.speed18;
     if(!updated.has(sa))updated.set(sa,updateGltfSceneAnim(sa,node.time18));
     if(updated.get(sa))deformGltfMesh(m,this.gl,this.buffers.get(m.id));
    }
   }
  }
  return BASE.drawCast.call(this,t);
 };
 restoreLiveExtras=async function(data,...args){
  const people=(data?.show?.people||[]).slice(0,16);
  const ids=new Set();
  for(const p of people){
   if(spec(p?.model18))ids.add(p.model18);
   if(spec(p?.shared18?.sourceId))ids.add(p.shared18.sourceId);
  }
  await Promise.allSettled([...ids].map(load));
  for(const p of people){
   if(spec(p?.model18)&&spec(p?.shared18?.sourceId)){
    try{
     const idx=await shareClip(p.model18,p.shared18.sourceId,p.shared18.clipIndex);
     if(idx>=0)p.clip18=idx;
    }catch(_){}
   }
  }
  return BASE.restoreLiveExtras(data,...args);
 };
 async function add(id,options={}){
  await load(id);const c=spec(id);
  return S.addPerson(c.role,{name:c.name,height:clamp(Number(options.height)||1.75,1.2,2.4),...sanitize({...options,model18:id})});
 }
 async function shareClip(targetId,sourceId,clipIndex=0){
  const [dstSrc,srcSrc]=await Promise.all([load(targetId),load(sourceId)]);
  const dstSa=dstSrc.meshes[0]?._gltfAnim?.sceneAnim,srcSa=srcSrc.meshes[0]?._gltfAnim?.sceneAnim;
  if(!dstSa||!srcSa)return -1;
  const srcIdx=clamp(Math.trunc(Number(clipIndex)||0),0,srcSa.clips.length-1);
  const srcClip=srcSa.clips[srcIdx];
  if(!srcClip)return -1;
  const byName=new Map(dstSa.nodes.map(n=>[n.name,n.index]));
  const channels=srcClip.channels.map(ch=>{
   const sNode=srcSa.nodes[ch.node],dIdx=sNode?byName.get(sNode.name):ch.node;
   return dIdx===undefined?null:{...ch,node:dIdx};
  }).filter(Boolean);
  let idx=dstSa.clips.findIndex(cl=>cl.name===srcClip.name);
  if(idx<0){
   idx=dstSa.clips.length;
   dstSa.clips.push({name:srcClip.name,duration:srcClip.duration,channels});
   const c=spec(targetId);
   if(c&&!c.clips.includes(srcClip.name)){c.clips.push(srcClip.name);c.clipsVi.push(CLIP_VI18[srcClip.name]||srcClip.name);}
  }
  const c=spec(targetId);
  if(c&&idx>=c.baseClipCount18){
   const origin=spec(sourceId)?.shared18?.[srcIdx]||{sourceId,clipIndex:srcIdx};
   (c.shared18||=[])[idx]={sourceId:origin.sourceId,clipIndex:origin.clipIndex};
  }
  return idx;
 }
 function openCharacter(id,person=null){
  if(typeof person==='string')person=seq.people.find(x=>x.id===person)||null;
  const c=spec(id);if(!c)return;
  const pair=GENDER_PAIRS18[id];
  const title=loc18(c.name);
  const primarySources=catalog.filter(x=>!GENDER_PAIRS18[x.id]||GENDER_PAIRS18[x.id].primary===x.id);
  const defBorrowId=(primarySources.find(x=>x.id!==(pair?.primary||id))||primarySources[0])?.id||'stage-dancer';
  const defBorrowSpec=spec(defBorrowId)||c;
  const genderRow=pair?`<label>${tr18('Giới tính / Dáng người','Gender / Body')}<select id="characterGender18"><option value="${pair.female}" ${id===pair.female?'selected':''}>${esc(tr18('Nữ','Female'))} — ${esc(loc18(spec(pair.female).name))}</option><option value="${pair.male}" ${id===pair.male?'selected':''}>${esc(tr18('Nam','Male'))} — ${esc(loc18(spec(pair.male).name))}</option></select></label>`:'';
  const personActions=person?`<div class="stage-char18-quick"><button type="button" class="btn small" id="characterPlace18">${tr18('Đặt vị trí trên sàn 3D','Place on 3D floor')}</button><button type="button" class="btn small danger" id="characterDelete18">${tr18('Xóa khỏi sân khấu','Remove from stage')}</button></div>`:'';
  dialog(title,`<div class="stage-character18">
   <div class="stage-char18-media">
    <div class="stage-char18-thumb-wrap">
     <img id="characterThumb18" src="${esc(base+id+'/thumbnail.webp')}" alt="${esc(title)}">
    </div>
    <div class="stage-char18-badges">
     <span class="stage-char18-pill">${esc(tr18('66 Xương · Atlas 512','66 Bones · 512 Atlas'))}</span>
     <span class="stage-char18-pill" id="characterClipCount18">${esc(c.clips.length+' '+tr18('động tác','clips'))}</span>
    </div>
    <p class="stage-char18-desc">${tr18('Chuyển động theo timeline. Trang phục dùng atlas cố định.','Animation follows the timeline. Costume uses a fixed atlas.')}</p>
    ${personActions}
   </div>
   <div class="stage-char18-fields">
    ${genderRow}
    <label>${tr18('Động tác','Motion')}<select id="characterClip18">${c.clips.map((name,i)=>`<option value="${i}" ${i===(person?.clip18||0)?'selected':''}>${esc(clipLabel18(c,i))}</option>`).join('')}</select></label>
    <div class="stage-char18-borrow">
     <span class="stage-char18-subhead">${tr18('Mượn động tác từ vai khác (Dùng chung bộ xương 66 khớp)','Borrow motion from another role (Shared 66-joint rig)')}</span>
     <div class="stage-char18-borrow-row">
      <select id="characterShareSource18" aria-label="${tr18('Chọn vai nguồn','Source role')}">${primarySources.map(x=>`<option value="${x.id}" ${x.id===defBorrowId?'selected':''}>${esc(loc18(x.name))}</option>`).join('')}</select>
      <select id="characterShareClip18" aria-label="${tr18('Chọn động tác mượn','Clip to borrow')}">${defBorrowSpec.clips.map((_,i)=>`<option value="${i}">${esc(clipLabel18(defBorrowSpec,i))}</option>`).join('')}</select>
      <button type="button" class="btn small" id="characterShareApply18">${tr18('+ Mượn động tác','+ Borrow clip')}</button>
     </div>
    </div>
    <div class="stage-char18-numrow">
     <label>${tr18('Tốc độ','Speed')}<input id="characterSpeed18" type="number" min=".25" max="2" step=".05" value="${person?.speed18||1}"></label>
     <label>${tr18('Chiều cao (m)','Height (m)')}<input id="characterHeight18" type="number" min="1.2" max="2.4" step=".05" value="${person?.height||1.75}"></label>
    </div>
    <p id="characterError18" role="status"></p>
   </div>
  </div>`,[{label:tr18('Trở về thư viện','Back to library'),close:false,action:()=>S.openCastLibrary16()},
   {label:person?tr18('Áp dụng','Apply'):tr18('Thêm vào sân khấu','Add to stage'),primary:true,close:false}]);
  $('modal')?.classList?.add('pro-wide');
  let activeId=id;
  const syncClipSelect18=keepIdx=>{
   const nc=spec(activeId),clipSel=$('characterClip18'),cntEl=$('characterClipCount18');
   if(!nc||!clipSel)return;
   const idx=clamp(Math.trunc(Number(keepIdx??clipSel.value)||0),0,nc.clips.length-1);
   clipSel.innerHTML=nc.clips.map((_,i)=>`<option value="${i}" ${i===idx?'selected':''}>${esc(clipLabel18(nc,i))}</option>`).join('');
   if(cntEl)cntEl.textContent=nc.clips.length+' '+tr18('động tác','clips');
  };
  const genderSel=$('characterGender18');
  if(genderSel)genderSel.onchange=()=>{
   activeId=genderSel.value;
   const nc=spec(activeId),thumb=$('characterThumb18');
   if(nc&&thumb){thumb.src=base+activeId+'/thumbnail.webp';thumb.alt=loc18(nc.name);}
   syncClipSelect18();
  };
  const shareSrcSel=$('characterShareSource18'),shareClipSel=$('characterShareClip18'),shareBtn=$('characterShareApply18');
  if(shareSrcSel&&shareClipSel){
   shareSrcSel.onchange=()=>{
    const sc=spec(shareSrcSel.value);if(!sc)return;
    shareClipSel.innerHTML=sc.clips.map((_,i)=>`<option value="${i}">${esc(clipLabel18(sc,i))}</option>`).join('');
   };
  }
  if(shareBtn&&shareSrcSel&&shareClipSel){
   shareBtn.onclick=async()=>{
    shareBtn.disabled=true;
    try{
     const targetId=$('characterGender18')?.value||activeId;
     const idx=await shareClip(targetId,shareSrcSel.value,+shareClipSel.value||0);
     if(idx>=0)syncClipSelect18(idx);
    }catch(err){if($('characterError18'))$('characterError18').textContent=String(err.message);}
    finally{shareBtn.disabled=false;}
   };
  }
  if(person){
   const placeBtn=$('characterPlace18'),delBtn=$('characterDelete18');
   if(placeBtn)placeBtn.onclick=()=>{
    if(S.sq)S.sq.placePerson=person.id;
    $('modal')?.close();
    if(window.engine)engine.view='stage';
    if(window.state)state.pickTask=null;
    const qh=$('quadHint');
    if(qh){qh.textContent=tr18('Click sàn để đặt người. Esc: hủy.','Click the floor to place a person. Esc: cancel.');qh.classList.remove('hidden');}
   };
   if(delBtn)delBtn.onclick=()=>{
    checkpoint();
    seq.people=seq.people.filter(x=>x.id!==person.id);
    S.rebuildCast?.();
    S.openCastLibrary16?.('onstage');
   };
  }
  const submit=$('modalActions').querySelector('.primary');submit.id='characterAdd18';
  submit.onclick=async e=>{
   e.target.disabled=true;
   const targetId=$('characterGender18')?.value||activeId;
   const options={clip18:+$('characterClip18').value,speed18:+$('characterSpeed18').value,height:+$('characterHeight18').value};
   try{
    if(person){
     await load(targetId);checkpoint();
     const prevSpec=spec(person.model18),nextSpec=spec(targetId);
     if(prevSpec&&nextSpec&&typeof person.name==='string'&&person.name.startsWith(prevSpec.name)){
      person.name=nextSpec.name+person.name.slice(prevSpec.name.length);
     }
     delete person.shared18;
     Object.assign(person,sanitize({model18:targetId,...options}),{height:clamp(options.height||1.75,1.2,2.4)});
     S.rebuildCast();
    }else if(!await add(targetId,options))throw Error(tr18('Tối đa 16 người.','Maximum 16 performers.'));
    S.openCastLibrary16(person?'onstage':'rigged');
   }catch(err){$('characterError18').textContent=String(err.message);e.target.disabled=false;}
  };
 }
 renderCastManager=function(...args){
  const result=BASE.renderCastManager(...args);
  for(const row of document.querySelectorAll('#castRows [data-person]')){
   const p=seq.people.find(p=>p.id===row.dataset.person),cSpec=spec(p?.model18);if(!cSpec)continue;
   const b=document.createElement('button');b.className='btn small cast-char18-edit-btn';b.type='button';
   b.style.gridColumn='1 / -1';b.dataset.characterEdit18=p.id;
   const color=row.querySelector('[data-field="color"]');if(color)color.closest('label').hidden=true;
   const clipIdx=clamp(Math.trunc(Number(p.clip18)||0),0,cSpec.clips.length-1);
   const clipTxt=clipLabel18(cSpec,clipIdx);
   b.textContent=tr18('Động tác / tốc độ','Motion / speed')+': '+clipTxt+' · '+(Number(p.speed18)||1).toFixed(2)+'x';
   b.onclick=()=>openCharacter(p.model18,p);row.append(b);
  }
  return result;
 };
 function openLibrary(...args){
  const result=BASE.open(...args),grid=document.querySelector('.v16-cast-grid');
  if(grid)for(const c of [...catalog].reverse()){
   const pair=GENDER_PAIRS18[c.id];
   if(pair&&pair.primary!==c.id)continue;
   const title=loc18(c.name),b=document.createElement('button');b.type='button';b.className='cast-card v16-cast-card';b.dataset.character18=c.id;
   b.dataset.cat18=c.cat||'dancer';b.dataset.castPick16='char18:'+c.id;
   if(pair)b.dataset.variants18=pair.female+','+pair.male;
   const badge=pair?tr18(`NAM & NỮ · CÓ XƯƠNG / ${c.clips.length} ĐỘNG TÁC`,`MALE & FEMALE · RIGGED / ${c.clips.length} CLIPS`):tr18(`CÓ XƯƠNG / ${c.clips.length} ĐỘNG TÁC`,`RIGGED / ${c.clips.length} CLIPS`);
   b.innerHTML=`<div class="v16-cast-thumb"><img src="${esc(base+c.id+'/thumbnail.webp')}" alt="${esc(title)}" decoding="async"></div><span>${esc(badge)}</span><div class="v16-cast-card-foot"><b>${esc(title)}</b></div>`;
   b.onclick=()=>{if(typeof S.selectCastItem16==='function'&&$('v16CastStageTitle'))S.selectCastItem16('char18',c.id);else openCharacter(c.id);};
   b.ondblclick=()=>openCharacter(c.id);
   grid.prepend(b);
  }
  if(typeof S.syncCastRiggedReady16==='function'&&$('v16CastStageTitle'))S.syncCastRiggedReady16();
  return result;
 }
 S.characters18={catalog,load,add,sanitize,openCharacter,clipLabel18,shareClip,genderPairs:GENDER_PAIRS18,base};
 S.renderCastManager=renderCastManager;S.openCastLibrary16=S.openCastLibrary=openLibrary;
 if($('v07Cast'))$('v07Cast').onclick=()=>openLibrary();
 }catch(err){console.error('[stage-characters]',err);}
})();
