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
  'Singer 01 - Vocal Performance (8s)':'Ca sĩ 01 - Hát chính cảm xúc (8s)',
  'Singer 02 - Audience Gesture (8s)':'Ca sĩ 02 - Giao lưu khán giả (8s)',
  'Singer 03 - Quiet Idle (6s)':'Ca sĩ 03 - Đứng nhịp chờ (6s)',
  'Host 01 - Speaking (8s)':'MC 01 - Phát biểu & Giao lưu (8s)',
  'Host 02 - Presenting Gesture (8s)':'MC 02 - Giới thiệu & Mở tay chào (8s)',
  'Host 03 - Neutral Idle (6s)':'MC 03 - Đứng chờ & Lắng nghe (6s)',
  'Guitarist 01 - Rhythm Strum (8s)':'Guitar điện 01 - Quạt chả nhịp (8s)',
  'Guitarist 02 - Lead Phrase (8s)':'Guitar điện 02 - Phiêu câu Lead (8s)',
  'Guitarist 03 - Ready Idle (6s)':'Guitar điện 03 - Đứng nhịp chờ (6s)',
  'Bassist 01 - Fingerstyle Groove (8s)':'Guitar Bass 01 - Đi ngón Groove (8s)',
  'Bassist 02 - Accent Phrase (8s)':'Guitar Bass 02 - Nhấn câu Bass (8s)',
  'Bassist 03 - Ready Idle (6s)':'Guitar Bass 03 - Đứng nhịp chờ (6s)',
  'Keyboardist 01 - Two-Hand Chords (8s)':'Keyboard 01 - Đệm hợp âm hai tay (8s)',
  'Keyboardist 02 - Right-Hand Lead (8s)':'Keyboard 02 - Solo giai điệu tay phải (8s)',
  'Keyboardist 03 - Ready Idle (6s)':'Keyboard 03 - Đứng nhịp chờ (6s)',
  'Drummer 01 - Basic Groove (8s)':'Trống Jazz 01 - Nhịp Groove chính (8s)',
  'Drummer 02 - Fill Phrase (8s)':'Trống Jazz 02 - Báo trống cao trào (8s)',
  'Drummer 03 - Ready Idle (6s)':'Trống Jazz 03 - Tư thế sẵn sàng (6s)',
  'Urban Dancer 01 - Groove (8s)':'Vũ công Urban 01 - Nhún nhịp Groove (8s)',
  'Urban Dancer 02 - Footwork (8s)':'Vũ công Urban 02 - Vũ đạo chân Footwork (8s)',
  'Urban Dancer 03 - Stage Mix (16s)':'Vũ công Urban 03 - Tổ hợp bùng nổ (16s)',
  'Violinist 01 - Lyrical Bowing (8s)':'Violin 01 - Kéo vĩ trữ tình (8s)',
  'Violinist 02 - Virtuoso Solo (8s)':'Violin 02 - Solo cao trào (8s)',
  'Violinist 03 - Ready Idle (6s)':'Violin 03 - Đứng nhịp chờ (6s)',
  'Saxophonist 01 - Smooth Groove (8s)':'Saxophone 01 - Phiêu nhịp Jazz (8s)',
  'Saxophonist 02 - Horn Solo (8s)':'Saxophone 02 - Độc tấu vươn kèn (8s)',
  'Saxophonist 03 - Ready Idle (6s)':'Saxophone 03 - Đứng nhịp chờ (6s)',
  'Rapper 01 - Flow Verse (8s)':'Rapper 01 - Đi Flow nhấn nhịp (8s)',
  'Rapper 02 - Crowd Hype (8s)':'Rapper 02 - Khuấy động khán giả (8s)',
  'Rapper 03 - Bounce Idle (6s)':'Rapper 03 - Nhún nhịp chờ (6s)',
  'DJ 01 - Deck Mix (8s)':'DJ 01 - Mix nhạc trên bàn xoay (8s)',
  'DJ 02 - Hands Up Drop (8s)':'DJ 02 - Giơ tay cao trào Drop (8s)',
  'DJ 03 - Booth Groove (6s)':'DJ 03 - Nhún nhịp sau bàn DJ (6s)',
  'LED Dancer 01 - Baton Wave (8s)':'Vũ công LED 01 - Lượn sóng gậy sáng (8s)',
  'LED Dancer 02 - Spin Routine (8s)':'Vũ công LED 02 - Xoay người phát sáng (8s)',
  'LED Dancer 03 - Ready Idle (6s)':'Vũ công LED 03 - Tư thế sẵn sàng (6s)',
  'Water Drummer 01 - Power Beat (8s)':'Trống nước 01 - Nhịp trống dồn lực (8s)',
  'Water Drummer 02 - Dual Roll (8s)':'Trống nước 02 - Đánh dùi luân phiên (8s)',
  'Water Drummer 03 - Ready Idle (6s)':'Trống nước 03 - Tư thế sẵn sàng (6s)',
  'Laser Dancer 01 - Beam Pose Flow (8s)':'Vũ công Laser 01 - Chiếu tia tạo dáng (8s)',
  'Laser Dancer 02 - Matrix Spin (8s)':'Vũ công Laser 02 - Xoay vòng quét tia (8s)',
  'Laser Dancer 03 - Ready Idle (6s)':'Vũ công Laser 03 - Tư thế sẵn sàng (6s)',
  'Fan Dancer 01 - Silk Bloom (8s)':'Múa quạt lụa 01 - Xòe quạt nở hoa (8s)',
  'Fan Dancer 02 - Graceful Swirl (8s)':'Múa quạt lụa 02 - Xoay lụa uyển chuyển (8s)',
  'Fan Dancer 03 - Poised Idle (6s)':'Múa quạt lụa 03 - Tạo dáng tĩnh (6s)'
 };
 const withClipsVi=list=>list.map(c=>({...c,clipsVi:c.clipsVi||c.clips.map(n=>CLIP_VI18[n]||n)}));
 const clipLabel18=(c,i)=>{const en=c.clips[i]||'',vi=c.clipsVi?.[i]||CLIP_VI18[en]||en;return tr18(vi,en);};
 const catalog=withClipsVi([
  {id:'stage-dancer',name:'Stage Dancer',role:'dancer',file:'stage_dancer',height:1.9126,clips:['Dance 01 - Stage Mix (16s)','Dance 02 - Charleston','Dance 03 - Body Roll','Dance 04 - Reach Hip','Dance 05 - Duo Mix (8s)']},
  {id:'stage-dancer-male',name:'Stage Dancer (Male)',role:'dancer',file:'stage_dancer_male',height:1.829384,clips:['Dance 01 - Stage Mix (16s)','Dance 02 - Contemporary Flow (8s)','Dance 03 - Finale Pose (8s)']},
  {id:'stage-singer',name:'Stage Singer',role:'singer',file:'stage_singer',height:1.81446834,clips:['Singer 01 - Vocal Performance (8s)','Singer 02 - Audience Gesture (8s)','Singer 03 - Quiet Idle (6s)']},
  {id:'stage-singer-male',name:'Stage Singer (Male)',role:'singer',file:'stage_singer_male',height:1.842559,clips:['Singer 01 - Vocal Performance (8s)','Singer 02 - Audience Gesture (8s)','Singer 03 - Quiet Idle (6s)']},
  {id:'stage-host',name:'Stage Host',role:'singer',file:'stage_host',height:1.834757,clips:['Host 01 - Speaking (8s)','Host 02 - Presenting Gesture (8s)','Host 03 - Neutral Idle (6s)']},
  {id:'stage-host-female',name:'Stage Host (Female)',role:'singer',file:'stage_host_female',height:1.826315,clips:['Host 01 - Speaking (8s)','Host 02 - Presenting Gesture (8s)','Host 03 - Neutral Idle (6s)']},
  {id:'stage-guitarist',name:'Stage Guitarist',role:'guitarist',file:'stage_guitarist',height:1.851566,clips:['Guitarist 01 - Rhythm Strum (8s)','Guitarist 02 - Lead Phrase (8s)','Guitarist 03 - Ready Idle (6s)']},
  {id:'stage-bassist',name:'Stage Bassist',role:'guitarist',file:'stage_bassist',height:1.844444,clips:['Bassist 01 - Fingerstyle Groove (8s)','Bassist 02 - Accent Phrase (8s)','Bassist 03 - Ready Idle (6s)']},
  {id:'stage-keyboardist',name:'Stage Keyboardist',role:'keyboardist',file:'stage_keyboardist',height:1.846283,clips:['Keyboardist 01 - Two-Hand Chords (8s)','Keyboardist 02 - Right-Hand Lead (8s)','Keyboardist 03 - Ready Idle (6s)']},
  {id:'stage-drummer',name:'Stage Drummer',role:'drummer',file:'stage_drummer',height:1.858031,clips:['Drummer 01 - Basic Groove (8s)','Drummer 02 - Fill Phrase (8s)','Drummer 03 - Ready Idle (6s)']},
  {id:'stage-dancer-urban',name:'Urban Dancer',role:'dancer',file:'stage_dancer_urban',height:1.838545,clips:['Urban Dancer 01 - Groove (8s)','Urban Dancer 02 - Footwork (8s)','Urban Dancer 03 - Stage Mix (16s)']},
  {id:'stage-violinist',name:'Stage Violinist',role:'violinist',file:'stage_violinist',height:1.825723,clips:['Violinist 01 - Lyrical Bowing (8s)','Violinist 02 - Virtuoso Solo (8s)','Violinist 03 - Ready Idle (6s)']},
  {id:'stage-saxophonist',name:'Stage Saxophonist',role:'saxophonist',file:'stage_saxophonist',height:1.831936,clips:['Saxophonist 01 - Smooth Groove (8s)','Saxophonist 02 - Horn Solo (8s)','Saxophonist 03 - Ready Idle (6s)']},
  {id:'stage-rapper',name:'Stage Rapper',role:'rapper',file:'stage_rapper',height:1.825866,clips:['Rapper 01 - Flow Verse (8s)','Rapper 02 - Crowd Hype (8s)','Rapper 03 - Bounce Idle (6s)']},
  {id:'stage-dj',name:'Stage DJ',role:'dj',file:'stage_dj',height:1.84197,clips:['DJ 01 - Deck Mix (8s)','DJ 02 - Hands Up Drop (8s)','DJ 03 - Booth Groove (6s)']},
  {id:'stage-led-dancer',name:'LED Suit Dancer',role:'leddancer',file:'stage_led_dancer',height:1.822735,clips:['LED Dancer 01 - Baton Wave (8s)','LED Dancer 02 - Spin Routine (8s)','LED Dancer 03 - Ready Idle (6s)']},
  {id:'stage-water-drummer',name:'Water Drummer',role:'waterdrummer',file:'stage_water_drummer',height:1.853712,clips:['Water Drummer 01 - Power Beat (8s)','Water Drummer 02 - Dual Roll (8s)','Water Drummer 03 - Ready Idle (6s)']},
  {id:'stage-laser-dancer',name:'Laser Dancer',role:'laserdancer',file:'stage_laser_dancer',height:1.817673,clips:['Laser Dancer 01 - Beam Pose Flow (8s)','Laser Dancer 02 - Matrix Spin (8s)','Laser Dancer 03 - Ready Idle (6s)']},
  {id:'stage-fan-dancer',name:'Silk Fan Dancer',role:'fandancer',file:'stage_fan_dancer',height:1.855075,clips:['Fan Dancer 01 - Silk Bloom (8s)','Fan Dancer 02 - Graceful Swirl (8s)','Fan Dancer 03 - Poised Idle (6s)']}
 ]);
 const base=new URL('../../assets/characters/',document.currentScript.src).href;
 const sources=new Map(),pending=new Map();
 window.stageCharacterPacks18=window.stageCharacterPacks18||Object.create(null);
 const spec=id=>catalog.find(c=>c.id===id);
 function sanitize(p){
  const c=spec(p?.model18);if(!c)return {};
  return {model18:c.id,clip18:clamp(Math.trunc(Number(p.clip18)||0),0,c.clips.length-1),speed18:clamp(Number(p.speed18)||1,.25,2)};
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
    scenes.set(ga.sceneAnim,{...structuredClone(pose),clips});
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
  const ids=new Set((data?.show?.people||[]).slice(0,16).map(p=>p.model18).filter(id=>spec(id)));
  await Promise.allSettled([...ids].map(load));
  return BASE.restoreLiveExtras(data,...args);
 };
 async function add(id,options={}){
  await load(id);const c=spec(id);
  return S.addPerson(c.role,{name:c.name,height:clamp(Number(options.height)||1.75,1.2,2.4),...sanitize({...options,model18:id})});
 }
 function openCharacter(id,person=null){
  const c=spec(id);if(!c)return;
  const title=loc18(c.name);
  dialog(title,`<div class="stage-character18">
   <img src="${esc(base+id+'/thumbnail.png')}" alt="${esc(title)}" style="width:100%;max-height:300px;object-fit:contain">
   <p>${tr18('Chuyển động theo timeline. Trang phục dùng atlas cố định.','Animation follows the timeline. Costume uses a fixed atlas.')}</p>
   <label>${tr18('Động tác','Motion')}<select id="characterClip18">${c.clips.map((name,i)=>`<option value="${i}" ${i===(person?.clip18||0)?'selected':''}>${esc(clipLabel18(c,i))}</option>`).join('')}</select></label>
   <label>${tr18('Tốc độ','Speed')}<input id="characterSpeed18" type="number" min=".25" max="2" step=".05" value="${person?.speed18||1}"></label>
   <label>${tr18('Chiều cao (m)','Height (m)')}<input id="characterHeight18" type="number" min="1.2" max="2.4" step=".05" value="${person?.height||1.75}"></label>
   <p id="characterError18" role="status"></p>
  </div>`,[{label:tr18('Trở về thư viện','Back to library'),close:false,action:()=>S.openCastLibrary16()},
   {label:person?tr18('Áp dụng','Apply'):tr18('Thêm vào sân khấu','Add to stage'),primary:true,close:false}]);
  const submit=$('modalActions').querySelector('.primary');submit.id='characterAdd18';
  submit.onclick=async e=>{
   e.target.disabled=true;
   const options={clip18:+$('characterClip18').value,speed18:+$('characterSpeed18').value,height:+$('characterHeight18').value};
   try{
    if(person){checkpoint();Object.assign(person,sanitize({model18:id,...options}),{height:clamp(options.height||1.75,1.2,2.4)});S.rebuildCast();}
    else if(!await add(id,options))throw Error(tr18('Tối đa 16 người.','Maximum 16 performers.'));
    S.openCastLibrary16();
   }catch(err){$('characterError18').textContent=String(err.message);e.target.disabled=false;}
  };
 }
 renderCastManager=function(...args){
  const result=BASE.renderCastManager(...args);
  for(const row of document.querySelectorAll('#castRows [data-person]')){
   const p=seq.people.find(p=>p.id===row.dataset.person);if(!spec(p?.model18))continue;
   const b=document.createElement('button');b.className='btn small';b.type='button';
   b.style.gridColumn='1 / -1';b.dataset.characterEdit18=p.id;
   const color=row.querySelector('[data-field="color"]');if(color)color.closest('label').hidden=true;
   b.textContent=tr18('Động tác / tốc độ','Motion / speed');b.onclick=()=>openCharacter(p.model18,p);row.append(b);
  }
  return result;
 };
 function openLibrary(...args){
  const result=BASE.open(...args),grid=document.querySelector('.v16-cast-grid');
  if(grid)for(const c of catalog){
   const title=loc18(c.name),b=document.createElement('button');b.type='button';b.className='cast-card v16-cast-card';b.dataset.character18=c.id;
   b.innerHTML=`<div class="v16-cast-thumb"><img src="${esc(base+c.id+'/thumbnail.png')}" alt="${esc(title)}" decoding="async"></div><span>${esc(tr18(`CÓ XƯƠNG / ${c.clips.length} ĐỘNG TÁC`,`RIGGED / ${c.clips.length} CLIPS`))}</span><div class="v16-cast-card-foot"><b>${esc(title)}</b></div>`;
   b.onclick=()=>openCharacter(c.id);grid.prepend(b);
  }
  return result;
 }
 S.characters18={catalog,load,add,sanitize,openCharacter,clipLabel18};
 S.renderCastManager=renderCastManager;S.openCastLibrary16=S.openCastLibrary=openLibrary;
 if($('v07Cast'))$('v07Cast').onclick=openLibrary;
 }catch(err){console.error('[stage-characters]',err);}
})();
