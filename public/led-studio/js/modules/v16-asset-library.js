/* ALPHA Creative LED Studio V16.0 — Stage Asset Catalog, Keyless CC0 Asset Finder (Poly Haven / Wikimedia Commons),
   3D Tape Measure, 28° Crease Edge Wireframe, TCVN 2737:2023 Wind Load Calculator & Unified Workspace UI Coordinator.
   100% Local-first; online search uses public keyless CC0/CC-BY APIs only when explicitly triggered by the user. */
(function(){
 'use strict';
 try {
  const S=window.STUDIO;
  if(!S || !S.engine) return;
  const engine=S.engine, state=S.state, $=id=>document.getElementById(id);
  const clamp16=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(+v)?+v:a));
  const esc16=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const CATALOG={
   truss_tower:{name:'Trụ Truss Đứng 3.6m',label:'TRUSS TOWER',cat:'Khung / Giàn',color:'#8c9bb0',desc:'Cột truss hộp nhôm 0.4×3.6m + đế thép'},
   truss_arch:{name:'Cổng Truss Goalpost 6m',label:'TRUSS ARCH',cat:'Khung / Giàn',color:'#94a3b8',desc:'Khung cổng truss 6.0×4.2m treo đèn/LED'},
   line_array:{name:'Cụm Loa Line Array (6 thùng)',label:'LINE ARRAY',cat:'Âm thanh',color:'#27303f',desc:'Dàn loa treo J-array 6 cabinet + khung treo'},
   sub_stack:{name:'Cụm Loa Sub Đôi 18"',label:'SUB STACK',cat:'Âm thanh',color:'#1e2530',desc:'2 thùng loa siêu trầm đặt sàn 1.2×0.9m'},
   totem_led:{name:'Cột LED Totem Đứng 1×3m',label:'LED TOTEM',cat:'Màn LED phụ',color:'#29caff',desc:'Khung + mặt LED 1.0×3.0m (map được video)'},
   dj_booth:{name:'Bàn DJ Booth LED 2.4m',label:'DJ BOOTH',cat:'Sân khấu',color:'#38bdf8',desc:'Bàn DJ + mặt trước LED 2.4×1.1m + CDJ mixer'},
   stage_riser:{name:'Bục Sân Khấu Riser 2×1.5m',label:'STAGE RISER',cat:'Sân khấu',color:'#334155',desc:'Bục nâng ban nhạc / trống cao 0.4m'},
   stage_stairs:{name:'Bậc Thang Sân Khấu 4 Bậc',label:'STAGE STAIRS',cat:'Sân khấu',color:'#475569',desc:'Cầu thang 4 bậc rộng 1.2m lên sàn diễn'},
   crowd_barrier:{name:'Rào Chắn Khán Giả Mojo 2m',label:'BARRIER',cat:'An toàn',color:'#64748b',desc:'Rào chắn hợp kim nhôm chống xô đẩy 2.0×1.1m'},
   kinetic_ring:{name:'Vòng LED Kinetic Ø2.4m',label:'KINETIC RING',cat:'Đạo cụ / FX',color:'#f59e0b',desc:'Vòng ánh sáng treo trần phát sáng emissive'},
   co2_jet:{name:'Súng Cột Khói CO2 / Sparkular',label:'CO2 / SPARK FX',cat:'Đạo cụ / FX',color:'#38bdf8',desc:'Máy bắn cột khói lạnh CO2 & pháo điện đại cảnh'},
   vip_podium:{name:'Bục Phát Biểu & Cầu Khai Mạc',label:'VIP PODIUM',cat:'Sân khấu',color:'#f59e0b',desc:'Bục phát biểu Keynote + quả cầu LED chạm tay khai mạc'},
   led_arch_gate:{name:'Cổng Chào LED Vòm 5m',label:'LED ARCH GATE',cat:'Màn LED phụ',color:'#a855f7',desc:'Cổng vòm LED sự kiện 5.0×3.6m phát sáng viền Neon'},
   catwalk_runway:{name:'Sàn Catwalk Chữ T 4m',label:'CATWALK T-STAGE',cat:'Sân khấu',color:'#475569',desc:'Đường băng Catwalk vươn ra khán giả kèm viền LED sàn'},
   backdrop_arch:{name:'Backdrop Check-in Vòm Sự Kiện 4m',label:'BACKDROP ARCH',cat:'Sân khấu',color:'#38bdf8',desc:'Phông chụp ảnh vòm 3 lớp + bục thảm đỏ check-in sự kiện'},
   gala_round_table:{name:'Bàn Tròn Tiệc Gala 10 Ghế (Ø1.8m)',label:'GALA TABLE',cat:'Bàn ghế VIP',color:'#f8fafc',desc:'Bàn tiệc tròn khăn phủ Ø1.8m + 10 ghế Banquet xoay tròn'},
   conference_ibm_table:{name:'Bàn Đại Biểu Hội Nghị IBM 1.8m',label:'IBM TABLE',cat:'Bàn ghế VIP',color:'#1e293b',desc:'Bàn hội nghị chữ nhật 1.8×0.6m phủ khăn + 2 ghế đại biểu'},
   banquet_chair:{name:'Ghế Banquet Sự Kiện Áo Nơ VIP',label:'BANQUET CHAIR',cat:'Bàn ghế VIP',color:'#e2e8f0',desc:'Ghế hội nghị/tiệc cưới bọc nệm kèm nơ lưng vàng đồng'},
   foh_control_booth:{name:'Bàn Điều Khiển FOH Âm Thanh / Ánh Sáng',label:'FOH BOOTH',cat:'Sân khấu',color:'#334155',desc:'Khu kỹ thuật FOH gồm bàn mixer ánh sáng GrandMA + bàn âm thanh'},
   decor_palm_planter:{name:'Chậu Cây Cảnh Sân Khấu / Cánh Gà',label:'STAGE PLANTER',cat:'Đạo cụ / FX',color:'#22c55e',desc:'Bồn cây xanh trang trí mép sân khấu và bục phát biểu'},
   haze_machine_pro:{name:'Máy Phun Sương Haze Sân Khấu 1500W',label:'HAZE 1500W',cat:'Đạo cụ / FX',color:'#64748b',desc:'Máy tạo sương mỏng làm nổi tia đèn Beam / Laser'},
   cold_spark_fountain:{name:'Máy Pháo Điện Lạnh Sparkular 700W',label:'COLD SPARK',cat:'Đạo cụ / FX',color:'#fbbf24',desc:'Máy bắn tia pháo điện lạnh cao 3m an toàn trong nhà'}
  };

  const ALLOWED_LICENSES=['cc0','cc-zero','public domain','pdm','cc-by','cc by'];
  const creaseCache=new WeakMap();
  const SVG_LOCK_CLOSED16='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="currentColor"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  const SVG_LOCK_OPEN16='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';

  const A={
   items:[],
   selected:null,
   isOpen:false,
   tab:'catalog',
   placeMode:false,
   meshMap:new Map(),
   searchSource:'polyhaven_models',
   searchQuery:'',
   translatedHint:'',
   translateCache:new Map(),
   searchResults:[],
   searching:false,
   searchStatus:'Chọn nguồn dữ liệu hoặc từ khóa gợi ý bên dưới để duyệt & nạp thẳng vào sân khấu 3D.',
   polyCache:{},
   measureMode:false,
   measurePts:[],
   creaseEnabled:false,
   allToolsVisible:false,
   blenderUI:true,
   tShelfHidden:false,
   openMenuKey:null,
   collapsedBlocks:new Set(),
   allBlocksCollapsed:false,
   previewCache:new Map(),
   castNodeCache16:new Map(),
   previewKind:'truss_tower',
   propPreviewYaw:0.55,
   castPreviewType:'fandancer',
   castPreviewAction:'auto',
   castPreviewColor:'#6e3455',
   castPreviewHeight:1.75,
   castPreviewYaw:0.35,
   castPreviewKind:'role', // cast dialog sidebar shows a 'role' (castPreviewType), 'act' (castPreviewAct) or 'qex' (castPreviewQex)
   castPreviewAct:'',
   castPreviewQex:'',
   wind:{speed:15,cd:1.4,baseDepth:1.2,selfKgPerM2:38,mu:0.4}
  };
  S.stageAssets16=A;

  // CRITICAL GUARD: Never call classList.add() or classList.remove() unconditionally on observed elements!
  // Per WHATWG DOM spec, DOMTokenList.add/remove ALWAYS run attribute update steps and fire MutationObserver
  // even when the token is already present/absent, which causes an infinite microtask loop on document.body!
  function setClass16(el,cls,on){
   if(!el||!el.classList)return;
   const has=el.classList.contains(cls);
   if(on && !has)el.classList.add(cls);
   else if(!on && has)el.classList.remove(cls);
  }

  // Centralized dock coordinator to prevent overlapping right-panel tools (Bug #6 guard)
  function closeAllDocks16(except=''){
   if(except!=='v16Asset' && A.isOpen)close();
   if(except!=='fx141')S.fx141?.close?.();
   if(except!=='matrix143')S.matrix143?.close?.();
   if(except!=='mount136')S.mount136?.close?.();
   if(except!=='laser135')S.laserShow?.close?.();
   if(except!=='pro127' && document.body.classList.contains('pro127-dock-open'))$('pro127close')?.click();
   if(except!=='stageLift124' && document.body.classList.contains('lift-dock-open')){
    S.stageLift?.close?.();
    setClass16(document.body,'lift-dock-open',false);
    const lf=$('stageLift124');if(lf)lf.hidden=true;
   }
   if(except!=='m131' && (document.body.classList.contains('m131-open')||document.body.classList.contains('m131-edit-open'))){
    S.manual131?.close?.();
    setClass16(document.body,'m131-open',false);
    setClass16(document.body,'m131-edit-open',false);
    const mp=$('m131Panel');if(mp)mp.hidden=true;
   }
   if(except!=='l132' && document.body.classList.contains('l132-open')){
    setClass16(document.body,'l132-open',false);
    const lp=$('l132Panel');if(lp)lp.hidden=true;
   }
   if(except!=='v130' && document.body.classList.contains('v130-edit-open')){
    S.vj130?.open?.(null);
    setClass16(document.body,'v130-edit-open',false);
    const vp=$('v130Panel');if(vp)vp.hidden=true;
   }
  }
  S.closeAllDocks16=closeAllDocks16;

  // Build procedural 3D meshes for a catalog item in world coordinates
  function buildAssetMeshes(item){
   const k=item.kind, col=[...hexrgb(item.color||CATALOG[k]?.color||'#8c9bb0'),1], dark=[.14,.17,.22,1], steel=[.58,.64,.72,1], parts=[];
   if(k==='truss_tower'){
    parts.push(boxMesh('Truss Baseplate',[0,.03,0],[.68,.06,.68],dark));
    for(const sx of [-.16,.16])for(const sz of [-.16,.16])parts.push(rod('Truss Chord',[sx,.06,sz],[sx,3.6,sz],.022,.022,col,8));
    for(let y=.2;y<3.55;y+=.45){
     parts.push(boxMesh('Truss Rung X',[0,y,-.16],[.32,.018,.018],steel),boxMesh('Truss Rung X',[0,y,.16],[.32,.018,.018],steel));
     parts.push(boxMesh('Truss Rung Z',[-.16,y,0],[.018,.018,.32],steel),boxMesh('Truss Rung Z',[.16,y,0],[.018,.018,.32],steel));
    }
   }else if(k==='truss_arch'){
    for(const side of [-2.85,2.85]){
     parts.push(boxMesh('Truss Arch Base',[side,.03,0],[.65,.06,.65],dark));
     parts.push(boxMesh('Truss Tower Leg',[side,2.1,0],[.34,4.1,.34],col));
    }
    parts.push(boxMesh('Truss Arch Span',[0,4.15,0],[6.1,.36,.36],col));
   }else if(k==='line_array'){
    parts.push(boxMesh('Line Array Bumper',[0,4.25,0],[.92,.08,.62],steel));
    for(let i=0;i<6;i++){
     const y=3.98-i*.28, tilt=i*.045, z=Math.sin(tilt)*i*.04;
     const cab=boxMesh('Line Array Cabinet '+(i+1),[0,y,z],[.86,.24,.48],col);
     parts.push(cab);
     parts.push(boxMesh('Speaker Grille',[0,y,z+.245],[.82,.21,.015],[.09,.11,.14,1]));
    }
   }else if(k==='sub_stack'){
    for(let i=0;i<2;i++){
     parts.push(boxMesh('Subwoofer 18',[0,.24+i*.46,0],[1.16,.44,.78],col));
     parts.push(boxMesh('Sub Port',[0,.24+i*.46,.395],[1.06,.36,.015],[.08,.09,.12,1]));
    }
   }else if(k==='totem_led'){
    parts.push(boxMesh('Totem Base',[0,.04,0],[1.18,.08,.75],dark));
    parts.push(boxMesh('Totem Frame',[0,1.58,-.05],[1.04,3.04,.12],dark));
    const scr=boxMesh('LED Totem Screen',[0,1.58,.02],[1.0,3.0,.025],col);
    scr.material.emissive=col.slice(0,3).map(v=>v*.22);
    parts.push(scr);
   }else if(k==='dj_booth'){
    parts.push(boxMesh('DJ Booth Body',[0,.56,-.18],[2.42,1.12,.72],dark));
    parts.push(boxMesh('DJ Deck Table',[0,.96,-.18],[2.28,.05,.66],[.22,.26,.32,1]));
    for(const x of [-.45,0,.45])parts.push(boxMesh('CDJ / Mixer',[x,1.02,-.14],[.34,.06,.38],[.10,.12,.16,1]));
    const scr=boxMesh('LED DJ Booth Screen',[0,.56,.19],[2.36,1.04,.025],col);
    scr.material.emissive=col.slice(0,3).map(v=>v*.24);
    parts.push(scr);
   }else if(k==='stage_riser'){
    parts.push(boxMesh('Stage Riser Deck',[0,.36,0],[2.0,.08,1.5],col));
    for(const sx of [-.9,.9])for(const sz of [-.65,.65])parts.push(boxMesh('Riser Leg',[sx,.16,sz],[.08,.32,.08],steel));
   }else if(k==='stage_stairs'){
    for(let i=0;i<4;i++){
     const h=(i+1)*.20, z=(1.5-i)*.28;
     parts.push(boxMesh('Stage Step '+(i+1),[0,h*.5,z],[1.2,h,.28],col));
    }
   }else if(k==='crowd_barrier'){
    parts.push(boxMesh('Barrier Footplate',[0,.02,.25],[2.0,.04,.95],steel));
    parts.push(boxMesh('Barrier Wall',[0,.56,-.05],[1.98,1.08,.08],col));
    parts.push(boxMesh('Barrier Top Rail',[0,1.11,-.05],[2.0,.06,.12],dark));
   }else if(k==='kinetic_ring'){
    const ring=ring8('Kinetic LED Ring',[0,3.8,0],1.2,.045,col,'y',48);
    ring.material.emissive=col.slice(0,3).map(v=>v*.45);
    parts.push(ring);
   }else if(k==='co2_jet'){
    parts.push(boxMesh('CO2 Base Housing',[0,.16,0],[.52,.32,.44],dark));
    parts.push(rod('CO2 Nozzle',[0,.30,0],[0,.54,0],.055,.075,steel,12));
    const plume1=rod('CO2 Cryo Plume Lower',[0,.54,0],[0,1.65,0],.07,.24,[col[0],col[1],col[2],1],14);
    const plume2=rod('CO2 Cryo Plume Upper',[0,1.65,0],[0,2.75,0],.24,.42,[.82,.94,1,1],14);
    plume1.material.emissive=col.slice(0,3).map(v=>v*.45);
    plume2.material.emissive=[.35,.55,.68];
    parts.push(plume1,plume2);
   }else if(k==='vip_podium'){
    parts.push(boxMesh('VIP Podium Base',[0,.05,0],[.92,.10,.68],dark));
    parts.push(boxMesh('VIP Podium Column',[0,.56,-.02],[.54,.94,.38],col));
    const strip=boxMesh('VIP LED Crest',[0,.58,.18],[.42,.72,.02],[.98,.82,.32,1]);
    strip.material.emissive=[.45,.34,.08];
    parts.push(strip);
    parts.push(boxMesh('VIP Lectern Top',[0,1.06,0],[.72,.06,.48],dark));
    const orb=ellipsoid('Ceremony Touch Sphere',[0,1.26,.04],[.16,.16,.16],col,18,14);
    orb.material.emissive=col.slice(0,3).map(v=>v*.55);
    parts.push(orb);
   }else if(k==='led_arch_gate'){
    for(const sx of [-2.2,2.2]){
     parts.push(boxMesh('Arch Gate Base',[sx,.05,0],[.82,.10,.76],dark));
     const leg=boxMesh('LED Gate Pillar',[sx,1.75,0],[.46,3.3,.38],col);
     leg.material.emissive=col.slice(0,3).map(v=>v*.26);
     parts.push(leg);
    }
    const header=boxMesh('LED Gate Header',[0,3.55,0],[4.86,.52,.42],col);
    header.material.emissive=col.slice(0,3).map(v=>v*.32);
    parts.push(header);
   }else if(k==='catwalk_runway'){
    parts.push(boxMesh('Catwalk Main Stem',[0,.22,0],[1.6,.42,3.6],col));
    parts.push(boxMesh('Catwalk Front T-Head',[0,.22,2.1],[3.4,.42,.95],col));
    const edgeL=boxMesh('Catwalk LED Trim L',[-.78,.44,0],[.05,.03,3.56],[.22,.88,.98,1]);
    const edgeR=boxMesh('Catwalk LED Trim R',[ .78,.44,0],[.05,.03,3.56],[.22,.88,.98,1]);
    const edgeF=boxMesh('Catwalk LED Trim Front',[0,.44,2.56],[3.36,.03,.05],[.22,.88,.98,1]);
    edgeL.material.emissive=[.10,.45,.58];
    edgeR.material.emissive=[.10,.45,.58];
    edgeF.material.emissive=[.10,.45,.58];
    parts.push(edgeL,edgeR,edgeF);
   }else if(k==='backdrop_arch'){
    parts.push(boxMesh('Backdrop Base Platform',[0,.05,0],[4.2,.10,1.2],dark));
    parts.push(boxMesh('Backdrop Center Panel',[0,1.45,-.12],[2.4,2.8,.08],col));
    parts.push(boxMesh('Backdrop Left Wing',[-1.35,1.25,-.04],[1.1,2.4,.08],[.92,.95,.99,1]));
    parts.push(boxMesh('Backdrop Right Wing',[1.35,1.25,-.04],[1.1,2.4,.08],[.92,.95,.99,1]));
   }else if(k==='gala_round_table'){
    parts.push(rod('Gala Table Pedestal',[0,.02,0],[0,.74,0],.32,.14,dark,16));
    parts.push(rod('Gala Table Top Ø1.8m',[0,.74,0],[0,.80,0],.90,.90,col,24));
    for(let i=0;i<10;i++){
     const a=i*Math.PI*2/10, cx=Math.cos(a)*1.28, cz=Math.sin(a)*1.28;
     parts.push(boxMesh('Gala Chair Seat '+(i+1),[cx,.44,cz],[.42,.08,.42],[.88,.91,.96,1]));
     parts.push(boxMesh('Gala Chair Back '+(i+1),[cx*1.12,.72,cz*1.12],[.40,.52,.07],[.95,.75,.28,1]));
    }
   }else if(k==='conference_ibm_table'){
    parts.push(boxMesh('IBM Table Skirt',[0,.38,0],[1.80,.74,.60],col));
    parts.push(boxMesh('IBM Table Top',[0,.76,0],[1.84,.04,.64],[.94,.96,.98,1]));
    for(const cx of [-.48,.48]){
     parts.push(boxMesh('VIP Chair Seat',[cx,.44,-.52],[.46,.08,.46],steel));
     parts.push(boxMesh('VIP Chair Back',[cx,.76,-.72],[.46,.58,.08],dark));
    }
   }else if(k==='banquet_chair'){
    parts.push(boxMesh('Banquet Seat',[0,.44,0],[.44,.08,.44],col));
    parts.push(boxMesh('Banquet Legs',[0,.22,0],[.40,.42,.40],dark));
    parts.push(boxMesh('Banquet Backrest',[0,.76,-.19],[.42,.56,.06],col));
    parts.push(boxMesh('Banquet Gold Sash',[0,.72,-.20],[.44,.12,.08],[.95,.75,.22,1]));
   }else if(k==='foh_control_booth'){
    parts.push(boxMesh('FOH Riser Deck',[0,.10,0],[2.8,.20,1.8],dark));
    parts.push(boxMesh('FOH Console Desk',[0,.58,-.15],[2.4,.76,.82],col));
    parts.push(boxMesh('GrandMA Lighting Console',[-.58,1.02,-.12],[.82,.12,.52],[.14,.18,.24,1]));
    parts.push(boxMesh('Digital Audio Mixer',[.58,1.02,-.12],[.82,.12,.52],[.18,.22,.30,1]));
   }else if(k==='decor_palm_planter'){
    parts.push(boxMesh('Planter Box',[0,.28,0],[.62,.56,.62],dark));
    parts.push(ellipsoid('Foliage Cluster Center',[0,.88,0],[.42,.52,.42],col,14,12));
    parts.push(ellipsoid('Foliage Cluster Left',[-.22,.76,.12],[.28,.36,.28],[.16,.72,.38,1],12,10));
    parts.push(ellipsoid('Foliage Cluster Right',[.22,.76,-.12],[.28,.36,.28],[.16,.72,.38,1],12,10));
   }else if(k==='haze_machine_pro'){
    parts.push(boxMesh('Haze Flightcase',[0,.22,0],[.58,.44,.46],col));
    parts.push(boxMesh('Haze Nozzle Vent',[0,.28,.24],[.26,.12,.04],steel));
   }else if(k==='cold_spark_fountain'){
    parts.push(boxMesh('Sparkular Base',[0,.14,0],[.28,.28,.28],dark));
    const sp1=rod('Cold Spark Plume',[0,.28,0],[0,2.45,0],.04,.32,col,14);
    sp1.material.emissive=[.95,.78,.25];
    parts.push(sp1);
   }
   const s=clamp16(item.scale??1,.1,10), yaw=(item.yaw||0)*Math.PI/180, p=item.pos||[0,0,0];
   const mat=M.mm(M.translate(p),M.mm(M.rotate([0,1,0],yaw),M.trs([0,0,0],IDENTITY_Q,[s,s,s])));
   for(const m of parts){
    transformMesh(m,mat);
    m.name=item.name+' / '+m.name;
    m._asset16Id=item.id;
   }
   return parts;
  }

  function removeAssetMeshes(id){
   const old=A.meshMap.get(id)||[];
   for(const m of old){
    const idx=engine.stage.indexOf(m);
    if(idx>=0)engine.stage.splice(idx,1);
    engine.releaseMesh(m);
   }
   A.meshMap.delete(id);
  }

  function clearAllAssetMeshes(){
   for(const id of [...A.meshMap.keys()])removeAssetMeshes(id);
   for(let i=engine.stage.length-1;i>=0;i--){
    if(engine.stage[i]._asset16Id){
     engine.releaseMesh(engine.stage[i]);
     engine.stage.splice(i,1);
    }
   }
  }

  function syncItemMeshes(item){
   removeAssetMeshes(item.id);
   const meshes=buildAssetMeshes(item);
   A.meshMap.set(item.id,meshes);
   engine.stage.push(...meshes);
   S.mount136?.invalidate?.();
  }

  function rebuildAllAssetMeshes(){
   clearAllAssetMeshes();
   for(const item of A.items)syncItemMeshes(item);
  }

  function currentItem(){
   return A.items.find(x=>x.id===A.selected)||A.items[0]||null;
  }

  function addCatalogItem(kind,pos=null){
   const spec=CATALOG[kind];
   if(!spec){toast('Loại asset không hợp lệ.');return null;}
   if(A.items.length>=64){toast('Giới hạn tối đa 64 Stage Asset trong một dự án.');return null;}
   checkpoint();
   const count=A.items.filter(x=>x.kind===kind).length+1;
   const b=engine.stageBounds||{min:[-9,0,-4],max:[9,7,4]};
   const defaultPos=pos||[(count%2?1:-1)*Math.min(4.5,1.2*count),Math.max(0,b.min?.[1]||0),1.2];
   const item={
    id:'AST16_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),
    kind,
    name:spec.name+' #'+count,
    pos:defaultPos.map(v=>+Number(v).toFixed(2)),
    yaw:0,
    scale:1,
    color:spec.color
   };
   A.items.push(item);
   A.selected=item.id;
   syncItemMeshes(item);
   engine.view='stage';
   paint();
   toast('Đã thêm '+item.name+' vào sân khấu 3D.');
   return item;
  }

  function deleteItem(id){
   const idx=A.items.findIndex(x=>x.id===id);
   if(idx<0)return;
   checkpoint();
   const [removed]=A.items.splice(idx,1);
   removeAssetMeshes(removed.id);
   A.selected=A.items[0]?.id||null;
   paint();
   toast('Đã xóa '+removed.name+'.');
  }

  // Track 1B: 28° Crease Edge computation (scale-invariant & back-face-safe, ported from 5.Design_mcp glb_viewer_runtime.js)
  A.catalog=CATALOG;A.addCatalogItem=addCatalogItem;A.deleteItem=deleteItem;A.clearAll=()=>{A.items=[];clearAllAssetMeshes();A.fixtureRigs16?.clear();};A.rebuildAll=rebuildAllAssetMeshes;A.syncItemMeshes=syncItemMeshes;
   function computeCreaseEdges(mesh,creaseDeg=28){
   const cached=creaseCache.get(mesh);
   if(cached && cached.p===mesh.p && cached.bounds===mesh.bounds && cached.deg===creaseDeg)return cached.segments;
   const p=mesh.p, triCount=(p.length/9)|0;
   if(triCount>25000)return [];
   const cosThresh=Math.cos(creaseDeg*Math.PI/180);
   const b=mesh.bounds||M.bbox(p);
   const diag=Math.hypot((b.max?.[0]??0)-(b.min?.[0]??0),(b.max?.[1]??0)-(b.min?.[1]??0),(b.max?.[2]??0)-(b.min?.[2]??0));
   const invScale=1e5/Math.max(diag,1e-6);
   const vKey=(x,y,z)=>Math.round(x*invScale)+','+Math.round(y*invScale)+','+Math.round(z*invScale);
   const edgeMap=new Map();
   for(let t=0;t<triCount;t++){
    const o=t*9;
    const v=[[p[o],p[o+1],p[o+2]],[p[o+3],p[o+4],p[o+5]],[p[o+6],p[o+7],p[o+8]]];
    const cr=M.cross(M.sub(v[1],v[0]),M.sub(v[2],v[0]));
    const nl=Math.hypot(cr[0],cr[1],cr[2]);
    if(nl<=1e-10)continue;
    const fn=[cr[0]/nl,cr[1]/nl,cr[2]/nl];
    const keys=[vKey(...v[0]),vKey(...v[1]),vKey(...v[2])];
    for(const [a,bIdx] of [[0,1],[1,2],[2,0]]){
     const ka=keys[a],kb=keys[bIdx];
     if(ka===kb)continue;
     const ek=ka<kb?ka+'|'+kb:kb+'|'+ka;
     let entry=edgeMap.get(ek);
     if(!entry){entry={a:v[a],b:v[bIdx],normals:[fn]};edgeMap.set(ek,entry);}
     else if(entry.normals.length<6)entry.normals.push(fn);
    }
   }
   const segments=[];
   for(const e of edgeMap.values()){
    if(e.normals.length===1){
     segments.push([e.a,e.b]);
    }else if(e.normals.length<=6){
     const hasTwin=e.normals.some((u,i)=>e.normals.some((v,j)=>i!==j && M.dot(u,v)<=-0.9985));
     const sides=[];
     for(let fn of e.normals){
      if(hasTwin && sides.length && M.dot(sides[0],fn)<0)fn=[-fn[0],-fn[1],-fn[2]];
      if(!sides.some(u=>Math.abs(M.dot(u,fn))>=0.9985))sides.push(fn);
     }
     if(e.normals.length===2 && hasTwin && sides.length===1){
      segments.push([e.a,e.b]);
     }else if(sides.length>=2 && sides.length<=4){
      let isCrease=false;
      for(let i=0;i<sides.length && !isCrease;i++){
       for(let j=i+1;j<sides.length;j++){
        const dot=M.dot(sides[i],sides[j]);
        if(dot<=cosThresh && dot>-0.9985){isCrease=true;break;}
       }
      }
      if(isCrease)segments.push([e.a,e.b]);
     }
    }
   }
   creaseCache.set(mesh,{p:mesh.p,bounds:mesh.bounds,deg:creaseDeg,segments});
   return segments;
  }

  // Track 4: Wind Load, Overturning & Sliding Safety Factor (TCVN 2737:2023, ported from 5.Design_mcp stage_frame.py)
  function computeWindSafety(overrides=null){
   const wCfg=overrides?{...A.wind,...overrides}:A.wind;
   const V=clamp16(wCfg.speed,0,60), cd=clamp16(wCfg.cd,.4,2.2), baseDepth=clamp16(wCfg.baseDepth,.3,8), selfKg=clamp16(wCfg.selfKgPerM2,10,150), mu=clamp16(wCfg.mu??0.4,0.1,1.2);
   const q=0.613*V*V; // Dynamic wind pressure N/m²
   const surfaces=engine.surfaces.filter(s=>s.enabled!==false);
   let totalArea=0, totalForce=0, overturnMoment=0, selfMassKg=0;
   const rows=[];
   for(const s of surfaces){
    const w=Math.max(.2,s.physical?.[0]||(s.w/120)), h=Math.max(.2,s.physical?.[1]||(s.h/120));
    const area=w*h;
    const centerY=Math.max(h*.5,s.mesh?.bounds?.center?.[1]||(h*.5+1.0));
    const force=q*cd*area;
    const moment=force*centerY;
    const mass=area*selfKg;
    totalArea+=area;
    totalForce+=force;
    overturnMoment+=moment;
    selfMassKg+=mass;
    rows.push({name:s.name,w,h,area,centerY,force,moment});
   }
   if(!rows.length){
    const area=12*4, centerY=3.0, force=q*cd*area, moment=force*centerY, mass=area*selfKg;
    totalArea=area; totalForce=force; overturnMoment=moment; selfMassKg=mass;
    rows.push({name:'Màn LED tiêu chuẩn 12×4m (giả định)',w:12,h:4,area,centerY,force,moment});
   }
   const g=9.81, leverArm=baseDepth*.5, targetSF=1.50;
   const selfRestoreMoment=selfMassKg*g*leverArm;
   const requiredRestoreMoment=overturnMoment*targetSF;
   const deficitMoment=Math.max(0,requiredRestoreMoment-selfRestoreMoment);
   const overturnBallastKg=leverArm>0?Math.ceil(deficitMoment/(g*leverArm)):0;
   const overturnSF=overturnMoment>0?(selfRestoreMoment/overturnMoment):99.9;
   const frictionForce=mu*selfMassKg*g;
   const requiredFrictionForce=totalForce*targetSF;
   const deficitForce=Math.max(0,requiredFrictionForce-frictionForce);
   const slidingBallastKg=mu>0?Math.ceil(deficitForce/(mu*g)):0;
   const slidingSF=totalForce>0?(frictionForce/totalForce):99.9;
   const ballastKg=Math.max(overturnBallastKg,slidingBallastKg);
   const currentSF=Math.min(overturnSF,slidingSF);
   return {V,cd,baseDepth,selfKg,mu,q,totalArea,totalForce,overturnMoment,selfMassKg,selfRestoreMoment,overturnSF,slidingSF,currentSF,overturnBallastKg,slidingBallastKg,ballastKg,rows};
  }

  // Track 5: Keyless CC0 Online Asset Search (Poly Haven + Wikimedia Commons + Google Drive Design_MCP GLB Pack)
  const GDRIVE_FOLDER_URL16='https://drive.google.com/drive/u/0/folders/1fhlZmvpR-FcaGbPh3RV1TlhSEAxTnhIv';
  const GDRIVE_ASSETS16=[
   {id:'fixture_moving_head_spot_01',localUrl:'./assets/pilot/fixture_moving_head_spot_01.glb',sidecarUrl:'./assets/pilot/fixture_moving_head_spot_01.asset.json',thumbUrl:'./assets/pilot/fixture_moving_head_spot_01.webp',origin:'mount-point',ofl_fixture:'generic/moving-head-spot-350w',size_m:[0.375,0.52,0.318],title:'Moving Head Spot 350W (Tách Yoke/Head DMX)',dims:'GLB Pilot v1 · 338 KB · 568 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'moving head spot beam light den san khau truss dmx fixture',accent:'#38bdf8'},
   {id:'fixture_beam_230_7r_01',localUrl:'./assets/pilot/fixture_beam_230_7r_01.glb',sidecarUrl:'./assets/pilot/fixture_beam_230_7r_01.asset.json',thumbUrl:'./assets/pilot/fixture_beam_230_7r_01.webp',origin:'mount-point',ofl_fixture:'vn-stage/beam-230-7r',size_m:[0.34,0.48,0.262],title:'Beam 230 7R Moving Head (Tách Yoke/Head DMX)',dims:'GLB Batch 1 · 293 KB · 472 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'beam 230 7r sharpy moving head den beam san khau dmx fixture',accent:'#38bdf8'},
   {id:'fixture_wash_zoom_36x18_01',localUrl:'./assets/pilot/fixture_wash_zoom_36x18_01.glb',sidecarUrl:'./assets/pilot/fixture_wash_zoom_36x18_01.asset.json',thumbUrl:'./assets/pilot/fixture_wash_zoom_36x18_01.webp',origin:'mount-point',ofl_fixture:'vn-stage/wash-zoom-36x18',size_m:[0.37,0.468,0.252],title:'Moving Head Wash Zoom 36×18W (Tách Yoke/Head DMX)',dims:'GLB Batch 1 · 307 KB · 616 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'wash zoom 36x18 moving head led rgbw den wash san khau dmx fixture',accent:'#60a5fa'},
   {id:'fixture_par_led_54x3w_01',localUrl:'./assets/pilot/fixture_par_led_54x3w_01.glb',sidecarUrl:'./assets/pilot/fixture_par_led_54x3w_01.asset.json',thumbUrl:'./assets/pilot/fixture_par_led_54x3w_01.webp',origin:'mount-point',ofl_fixture:'vn-stage/par-led-54x3w',size_m:[0.29,0.36,0.222],title:'Par LED 54×3W RGBW (Tách Yoke/Head DMX)',dims:'GLB Batch 1 · 352 KB · 412 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'par led 54x3w rgbw stage wash light den par san khau dmx fixture',accent:'#34d399'},
   {id:'fixture_katana_led_bar_1m_01',localUrl:'./assets/pilot/fixture_katana_led_bar_1m_01.glb',sidecarUrl:'./assets/pilot/fixture_katana_led_bar_1m_01.asset.json',thumbUrl:'./assets/pilot/fixture_katana_led_bar_1m_01.webp',origin:'mount-point',ofl_fixture:'vn-stage/katana-led-bar-1m',size_m:[1.0,0.28,0.18],title:'Đèn Thanh Katana LED Matrix Bar 1m (Tách Yoke/Head DMX)',dims:'GLB Batch 1 · 299 KB · 332 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'katana led bar 1m pixel matrix batten den thanh led san khau dmx fixture',accent:'#a855f7'},
   {id:'prop_inflatable_arch_01',localUrl:'./assets/pilot/prop_inflatable_arch_01.glb',sidecarUrl:'./assets/pilot/prop_inflatable_arch_01.asset.json',thumbUrl:'./assets/pilot/prop_inflatable_arch_01.webp',origin:'floor-center',ofl_fixture:null,size_m:[6.0,4.0,1.1],title:'Cổng Hơi Sự Kiện 6×4m (Inflatable Event Arch)',dims:'GLB Pilot v1 · 365 KB · 2348 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'inflatable arch cong hoi su kien entrance gate 6x4m prop',accent:'#0ea5e9'},
   {id:'furniture_chiavari_chair_01',localUrl:'./assets/pilot/furniture_chiavari_chair_01.glb',sidecarUrl:'./assets/pilot/furniture_chiavari_chair_01.asset.json',thumbUrl:'./assets/pilot/furniture_chiavari_chair_01.webp',origin:'floor-center',ofl_fixture:null,size_m:[0.42,0.92,0.44],title:'Ghế Tiệc Cưới Chiavari Vàng Kim (Banquet Chair)',dims:'GLB Pilot v1 · 343 KB · 1272 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'chiavari chair ghe tiec cuoi banquet event furniture',accent:'#f59e0b'},
   {id:'stage_sofa_vip_01',localUrl:'./assets/pilot/stage_sofa_vip_01.glb',sidecarUrl:'./assets/pilot/stage_sofa_vip_01.asset.json',thumbUrl:'./assets/pilot/stage_sofa_vip_01.webp',origin:'floor-center',ofl_fixture:null,size_m:[1.8,0.82,0.855],title:'Sofa VIP Talkshow 3 Chỗ 1.8m (VIP Stage Sofa)',dims:'GLB Batch 1 · 219 KB · 316 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'sofa vip talkshow lounge couch ghe sofa san khau furniture',accent:'#f59e0b'},
   {id:'furniture_banquet_table_01',localUrl:'./assets/pilot/furniture_banquet_table_01.glb',sidecarUrl:'./assets/pilot/furniture_banquet_table_01.asset.json',thumbUrl:'./assets/pilot/furniture_banquet_table_01.webp',origin:'floor-center',ofl_fixture:null,size_m:[1.8,0.76,1.8],title:'Bàn Tiệc Tròn Gala 1.8m (Round Banquet Table)',dims:'GLB Batch 1 · 92 KB · 432 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'banquet table round gala dining ban tiec tron 1.8m furniture',accent:'#fbbf24'},
   {id:'furniture_conference_chair_01',localUrl:'./assets/pilot/furniture_conference_chair_01.glb',sidecarUrl:'./assets/pilot/furniture_conference_chair_01.asset.json',thumbUrl:'./assets/pilot/furniture_conference_chair_01.webp',origin:'floor-center',ofl_fixture:null,size_m:[0.48,0.88,0.5195],title:'Ghế Hội Nghị Đại Biểu Khung Đồng (VIP Conference Chair)',dims:'GLB Batch 1 · 284 KB · 248 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'conference chair banquet vip ghe hoi nghi dai bieu furniture',accent:'#f59e0b'},
   {id:'prop_podium_reception_01',localUrl:'./assets/pilot/prop_podium_reception_01.glb',sidecarUrl:'./assets/pilot/prop_podium_reception_01.asset.json',thumbUrl:'./assets/pilot/prop_podium_reception_01.webp',origin:'floor-center',ofl_fixture:null,size_m:[0.78,1.1497,0.56],title:'Bục Phát Biểu & Bàn Lễ Tân VIP Gỗ Sồi (Keynote Podium)',dims:'GLB Batch 1 · 290 KB · 304 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'podium lectern reception keynote buc phat bieu ban le tan vip furniture',accent:'#d97706'},
   {id:'prop_stage_plant_01',localUrl:'./assets/pilot/prop_stage_plant_01.glb',sidecarUrl:'./assets/pilot/prop_stage_plant_01.asset.json',thumbUrl:'./assets/pilot/prop_stage_plant_01.webp',origin:'floor-center',ofl_fixture:null,size_m:[0.7098,1.35,0.7098],title:'Chậu Cây Cảnh Nhiệt Đới Sân Khấu (Stage Planter)',dims:'GLB Batch 1 · 294 KB · 328 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'stage plant planter palm monstera chau cay canh san khau decor',accent:'#10b981'},
   {id:'prop_chandelier_stage_01',localUrl:'./assets/pilot/prop_chandelier_stage_01.glb',sidecarUrl:'./assets/pilot/prop_chandelier_stage_01.asset.json',thumbUrl:'./assets/pilot/prop_chandelier_stage_01.webp',origin:'mount-point',ofl_fixture:null,size_m:[1.194,1.1,1.1768],title:'Đèn Chùm Pha Lê Gala / Tiệc Cưới (Crystal Chandelier)',dims:'GLB Batch 1 · 426 KB · 1936 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'chandelier crystal gala wedding den chum pha le san khau decor',accent:'#fde047'},
   {id:'prop_decor_shelf_01',localUrl:'./assets/pilot/prop_decor_shelf_01.glb',sidecarUrl:'./assets/pilot/prop_decor_shelf_01.asset.json',thumbUrl:'./assets/pilot/prop_decor_shelf_01.webp',origin:'floor-center',ofl_fixture:null,size_m:[1.2,1.8,0.4255],title:'Kệ Trưng Bày Cúp & Sản Phẩm 4 Tầng (Display Shelf)',dims:'GLB Batch 1 · 252 KB · 576 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'shelf display rack trophy cup ke trung bay san pham decor',accent:'#38bdf8'},
   {id:'prop_vip_carpet_01',localUrl:'./assets/pilot/prop_vip_carpet_01.glb',sidecarUrl:'./assets/pilot/prop_vip_carpet_01.asset.json',thumbUrl:'./assets/pilot/prop_vip_carpet_01.webp',origin:'floor-center',ofl_fixture:null,size_m:[2.0,0.024,3.6],title:'Thảm Đỏ Khánh Tiết VIP Viền Vàng 2×3.6m (VIP Red Carpet)',dims:'GLB Batch 1 · 120 KB · 156 tris',license:'Design_MCP / Blender 5.1.2 CC0-1.0',tags:'carpet rug red runner vip tham do khanh tiet su kien decor',accent:'#ef4444'},
   {id:'gd_human_mocap',fileId:'1GThK9vKEgLE8CErNO_nr6gaQu1ExH89T',title:'Human Mocap Dancer (Có xương & Animation)',dims:'Rigged GLB · 329 KB',license:'Design_MCP / Mesh2Motion CC0',tags:'stage human dancer person mocap nguoi vu cong nhan vat animation',accent:'#38bdf8'},
   {id:'gd_human_base',fileId:'1Kmnv88yxAj4I_f81rSx_IXLThbX29mbV',title:'Human Base Performer (Có xương & Animation)',dims:'Rigged GLB · 310 KB',license:'Design_MCP / Mesh2Motion CC0',tags:'stage human performer actor nguoi nhan vat animation',accent:'#61e8ff'},
   {id:'gd_human_addon',fileId:'1SJ3XeMFQbTfkOroADqdMvYb3_CFXKNxX',title:'Human Stage Action Pack (Có xương & Animation)',dims:'Rigged GLB · 340 KB',license:'Design_MCP / Mesh2Motion CC0',tags:'stage human dance action nguoi bieu dien animation',accent:'#8b7dff'},
   {id:'gd_dragon_anim',fileId:'1tnxVDQwxnPpqLKhm0b1i_AbV0VNtCHvl',title:'Rồng 3D Đại Cảnh (Dragon Rigged Animation)',dims:'Rigged GLB · Animation',license:'Design_MCP / Mesh2Motion CC0',tags:'stage dragon mascot fx rong phuong dai canh animation',accent:'#f59e0b'},
   {id:'gd_bird_anim',fileId:'1hRG_Qv0xsuN0gFQCKf9BbQzgLdH_PcrV',title:'Chim / Phượng Hoàng 3D Vỗ Cánh (Animated)',dims:'Rigged GLB · 329 KB',license:'Design_MCP / Mesh2Motion CC0',tags:'stage bird phoenix wing chim phuong hoang animation',accent:'#fb7185'},
   {id:'gd_horse_anim',fileId:'18WGQJUIp4nv5ibeK3D_mtKK6MqODW7Kq',title:'Ngựa 3D Phi Nước Đại (Horse Animated)',dims:'Rigged GLB · Animation',license:'Design_MCP / Mesh2Motion CC0',tags:'stage horse animal ngua thu animation',accent:'#a855f7'},
   {id:'gd_fox_anim',fileId:'1PdWashC3t9RcQlfXjuqzjJELaBbI1Zwa',title:'Hồ Ly / Cáo 3D Chuyển Động (Fox Animated)',dims:'Rigged GLB · Animation',license:'Design_MCP / Mesh2Motion CC0',tags:'stage fox animal cao ho ly animation',accent:'#f97316'},
   {id:'gd_kaiju_anim',fileId:'1TPyDHRF7f_ykt_cvm0QWtJNWi5H59KGv',title:'Quái Thú Kaiju 3D Đại Cảnh (Animated)',dims:'Rigged GLB · Animation',license:'Design_MCP / Mesh2Motion CC0',tags:'stage monster kaiju boss quai thu animation',accent:'#ef4444'},
   {id:'gd_shark_anim',fileId:'1EF9eobaWvmifUc1NTMi1A42UMLAs_jeK',title:'Cá Mập 3D Đại Dương (Shark Animated)',dims:'Rigged GLB · Animation',license:'Design_MCP / Mesh2Motion CC0',tags:'stage shark ocean sea ca map dai duong animation',accent:'#0ea5e9'},
   {id:'gd_snake_anim',fileId:'1r2sXhxMWjXGRBkCDeK-tCN5oSnpKMGPt',title:'Rắn Thần 3D Chuyển Động (Snake Animated)',dims:'Rigged GLB · Animation',license:'Design_MCP / Mesh2Motion CC0',tags:'stage snake animal ran animation',accent:'#10b981'},
   {id:'gd_spider_anim',fileId:'1xRYooI8UKl0KVqLWwlMTZYsklGdH-17S',title:'Nhện Máy 3D Halloween / Sci-Fi (Animated)',dims:'Rigged GLB · Animation',license:'Design_MCP / Mesh2Motion CC0',tags:'stage spider scifi halloween nhen animation',accent:'#6366f1'},
   {id:'gd_chair_cc0',fileId:'13tGfeOv5c0QxacaQbXPZEmui6sOR--YD',title:'Ghế Đơn Sân Khấu (Quaternius CC0)',dims:'GLB 3D · 13 KB',license:'CC0 1.0 (Quaternius)',tags:'stage chair seat stool ghe ngoi talkshow',accent:'#34d399'}
  ];

  const SEARCH_SYNONYMS16={
   stage:['speaker','megaphone','boombox','camera','tripod','lamp','light','lantern','chair','table','sofa','stool','plant','crate','barrel','industrial','electronics'],
   'sân khấu':['speaker','megaphone','boombox','camera','tripod','lamp','light','chair','table','sofa','plant','stage','concert'],
   'bục phát biểu':['podium','lectern','stand','table','desk'],
   'bục':['podium','platform','riser','bench','table'],
   'hàng rào':['barrier','fence','railing','barricade','gate','wall'],
   'rào chắn':['barrier','barricade','fence','railing','concrete_barrier'],
   'lan can':['railing','fence','balustrade','barrier'],
   'cầu thang':['stairs','staircase','steps','ladder'],
   'bậc thang':['stairs','steps','ladder'],
   'thùng phi':['barrel','metal_barrel','drum','container','industrial'],
   'thùng gỗ':['crate','wooden_crate','box','barrel','chest'],
   'bình hoa':['vase','pot','ceramic','jug','urn','flower'],
   'lọ hoa':['vase','pot','ceramic','flower'],
   'chậu cây':['potted_plant','plant','planter','pot','monstera','fern'],
   'cây cảnh':['plant','potted_plant','monstera','fern','shrub','tree','planter'],
   'bàn trà':['coffee_table','side_table','table','sofa'],
   'bàn gỗ':['wooden_table','table','desk','workbench','wood'],
   'bàn điều khiển':['desk','table','console','electronics','radio'],
   'ghế đẩu':['stool','wooden_stool','bar_chair','chair'],
   'ghế bành':['armchair','sofa','chair','lounge'],
   'máy quay':['camera','video_camera','vintage_video_camera','tripod','lens'],
   'máy ảnh':['camera','camera_01','lens','tripod'],
   'máy chiếu':['projector','camera','light','electronics'],
   'màn hình':['television','tv','monitor','screen','display','retro_tv'],
   'đèn chùm':['chandelier','lamp','light','lantern'],
   'đèn bàn':['desk_lamp','lamp','light','lantern'],
   'đèn đường':['street_lamp','street_light','lamp','lantern'],
   'đèn lồng':['lantern','lamp','light','candle'],
   'kim loại':['metal','steel','iron','brass','copper','industrial','rust'],
   'bê tông':['concrete','cement','wall','pavement','stone','plaster'],
   'xi măng':['concrete','cement','plaster','wall'],
   'tường gạch':['brick','brick_wall','wall','masonry','cobblestone'],
   'cẩm thạch':['marble','stone','tile','granite','rock'],
   'hoa cương':['granite','marble','stone','rock','tile'],
   'rỉ sét':['rust','rusted','metal','corroded','iron','industrial'],
   'vũ công':['dancer','human','person','mocap','animation','performer'],
   'ca sĩ':['singer','human','person','performer','microphone'],
   'nhân vật':['human','person','character','actor','dancer','animation'],
   'phượng hoàng':['phoenix','bird','wing','dragon','animation'],
   'cá mập':['shark','ocean','sea','fish','animation'],
   'quái thú':['kaiju','monster','dragon','boss','animation'],
   'quái vật':['monster','kaiju','dragon','creature','animation'],
   'hồ ly':['fox','animal','animation'],
   'nhạc cụ':['gramophone','boombox','guitar','piano','drum','music','audio'],
   'ô tô':['car','vehicle','truck','automobile','wheel'],
   'xe hơi':['car','vehicle','automobile'],
   truss:['metal','industrial','steel','iron','beam','cage','lamp','street_light','chandelier'],
   khung:['metal','industrial','steel','beam','frame','truss'],
   giàn:['metal','industrial','steel','beam','frame','truss'],
   cổng:['gate','arch','door','entrance','fence'],
   cờ:['flag','banner','fabric','cloth'],
   cột:['pillar','column','pole','post','beam'],
   trụ:['pillar','column','pole','post','hydrant'],
   rèm:['curtain','drapery','fabric','cloth','velvet','backdrop'],
   phông:['backdrop','wall','curtain','fabric','canvas'],
   thảm:['carpet','rug','mat','fabric','floor'],
   loa:['speaker','boombox','megaphone','radio','audio','gramophone','electronics'],
   speaker:['speaker','megaphone','boombox','radio','electronics'],
   audio:['speaker','boombox','megaphone','radio','microphone','electronics'],
   mic:['microphone','megaphone','speaker','audio'],
   micro:['microphone','megaphone','speaker','audio'],
   'đài':['radio','boombox','gramophone','speaker'],
   'đèn':['lamp','light','lantern','chandelier','candle','sconce','street_lamp'],
   light:['lamp','light','lantern','chandelier','street_lamp','neon'],
   'ghế':['chair','sofa','stool','armchair','bench','couch','seat'],
   sofa:['sofa','couch','armchair','chair','lounge'],
   'bàn':['table','desk','coffee_table','side_table','workbench','counter'],
   'giường':['bed','mattress','furniture','pillow'],
   'tủ':['cabinet','wardrobe','cupboard','shelf','chest','drawer'],
   'kệ':['shelf','bookshelf','rack','cabinet','stand'],
   'sách':['book','books','library','paper'],
   'thùng':['crate','barrel','box','container','bin','bucket'],
   'hộp':['box','crate','chest','case','container'],
   'tượng':['statue','sculpture','bust','monument','art','stone'],
   'gương':['mirror','glass','frame'],
   'tranh':['painting','picture','frame','art','canvas'],
   'đồng hồ':['clock','watch','vintage','alarm'],
   'đàn':['guitar','piano','instrument','music','gramophone'],
   'trống':['drum','percussion','barrel','music'],
   'cây':['plant','tree','potted','fern','monstera','shrub','bush','foliage','flower','planter'],
   plant:['plant','tree','potted','fern','monstera','shrub','foliage'],
   'hoa':['flower','blossom','rose','plant','vase','foliage'],
   'cỏ':['grass','lawn','meadow','moss','weed','ground','nature'],
   'lá':['leaf','leaves','foliage','plant','fern','monstera'],
   'rừng':['forest','tree','woods','nature','jungle','bark'],
   camera:['camera','tripod','lens','projector','television','tv'],
   tv:['television','tv','monitor','screen','electronics','retro_tv'],
   tivi:['television','tv','monitor','screen','electronics','retro_tv'],
   'gỗ':['wood','plank','wooden','timber','bark','plywood','board'],
   'gạch':['brick','wall','tile','cobblestone','pavement','masonry'],
   'tường':['wall','brick','plaster','concrete','stucco','stone'],
   'sàn':['floor','tiles','planks','wood','parquet','pavement','marble'],
   'trần':['ceiling','roof','plaster','tiles','beam'],
   'mái':['roof','tiles','shingles','slate','thatch'],
   'ngói':['roof','tiles','terracotta','shingles','clay'],
   'đá':['rock','stone','marble','granite','boulder','cliff','concrete','pebble','gravel'],
   'sỏi':['gravel','pebbles','stone','rock','ground'],
   'cát':['sand','beach','desert','dune','ground'],
   'đất':['soil','dirt','mud','ground','earth','terracotta'],
   'bùn':['mud','dirt','soil','wet','ground'],
   'nước':['water','ocean','sea','wave','river','liquid','ice'],
   'băng':['ice','snow','frozen','glacier','crystal'],
   'tuyết':['snow','ice','winter','frozen'],
   'lửa':['fire','flame','lava','torch','candle','burn'],
   'khói':['smoke','fog','cloud','mist','steam','co2'],
   'bầu trời':['sky','clouds','sunset','night','stars','space'],
   'mây':['cloud','clouds','sky','fog'],
   'vải':['fabric','cloth','textile','leather','velvet','canvas','denim','carpet','silk'],
   'nhung':['velvet','fabric','cloth','curtain','carpet'],
   'lụa':['silk','fabric','cloth','satin','curtain'],
   'da':['leather','fabric','skin','hide'],
   'kính':['glass','window','mirror','crystal','transparent'],
   'thủy tinh':['glass','bottle','jar','crystal','vase'],
   'nhựa':['plastic','rubber','acrylic','synthetic'],
   metal:['metal','steel','iron','brass','copper','rust','industrial','grate'],
   'sắt':['iron','steel','metal','rust','industrial','gate'],
   'thép':['steel','metal','iron','industrial','beam'],
   'đồng':['copper','brass','bronze','metal','gold'],
   'vàng':['gold','brass','yellow','metal','treasure'],
   'bạc':['silver','metal','chrome','aluminum','steel'],
   neon:['neon','light','cyberpunk','led','glow','stage','concert'],
   'người':['human','person','dancer','performer','character','mocap','actor'],
   'rồng':['dragon','kaiju','monster','bird','phoenix','animation'],
   'chim':['bird','phoenix','wing','animal','animation'],
   'ngựa':['horse','animal','equestrian','animation'],
   'cáo':['fox','animal','animation'],
   'rắn':['snake','serpent','reptile','animation'],
   'nhện':['spider','insect','scifi','halloween','animation'],
   'cửa':['door','window','gate','arch','entrance','wooden'],
   'xe':['car','vehicle','truck','bicycle','cart','wheel'],
   animation:['animation','rigged','mocap','human','dragon','bird','horse','fox','kaiju','shark']
  };

  function stripVi16(s){
   return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').trim();
  }

  function hasViChars16(s){
   return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(String(s||''));
  }

  const SEARCH_SYNONYMS_ENTRIES16=Object.entries(SEARCH_SYNONYMS16).map(([k,list])=>({
   key:k.toLowerCase(),
   keyAscii:stripVi16(k),
   isPhrase:k.includes(' '),
   list:list.map(x=>x.trim().toLowerCase()).filter(Boolean)
  }));

  const STAGE_FEATURED_POLY_MODELS16=[
   'boombox','Megaphone_01','vintage_video_camera','camera_01','retro_tv_01','gramophone_01',
   'chandelier_01','industrial_wall_lamp','street_lamp_01','lantern_01','desk_lamp_01',
   'armchair_01','Sofa_01','modern_arm_chair_01','bar_chair_01','wooden_stool_01',
   'CoffeeTable_01','wooden_table_02','industrial_coffee_table','potted_plant_01','monstera_deliciosa_01',
   'metal_barrel_01','wooden_crate_01','concrete_barrier_01','fire_hydrant_01'
  ];

  async function translateViToEn16(rawQuery){
   const q=String(rawQuery||'').trim().toLowerCase();
   if(!q || q.length<2)return '';
   if(A.translateCache.has(q))return A.translateCache.get(q);
   const qAscii=stripVi16(q);
   const matched=[];
   for(const entry of SEARCH_SYNONYMS_ENTRIES16){
    if(q===entry.key || qAscii===entry.keyAscii || q.includes(entry.key) || (entry.keyAscii.length>=3 && qAscii.includes(entry.keyAscii))){
     if(entry.list[0])matched.push(entry.list[0]);
    }
   }
   const translated=matched.slice(0,4).join(' ');
   A.translateCache.set(q,translated);
   return translated;
  }

  function expandSearchTerms16(rawQuery,extraEn=''){
   const q=(rawQuery||'').trim().toLowerCase();
   if(!q)return [];
   const qAscii=stripVi16(q);
   const tokens=q.split(/[\s,;/]+/).filter(Boolean);
   const tokensAscii=qAscii.split(/[\s,;/]+/).filter(Boolean);
   const enSet=new Set();
   let dictMatched=false;
   for(const entry of SEARCH_SYNONYMS_ENTRIES16){
    let hit=false;
    if(entry.isPhrase){
     hit=q.includes(entry.key)||(entry.keyAscii.length>=4 && qAscii.includes(entry.keyAscii));
    }else{
     hit=q===entry.key||qAscii===entry.keyAscii||tokens.includes(entry.key)||tokensAscii.includes(entry.keyAscii);
    }
    if(hit){
     dictMatched=true;
     for(const item of entry.list)enSet.add(item);
    }
   }
   if(extraEn){
    for(const w of String(extraEn).toLowerCase().replace(/[^a-z0-9_\s-]/g,' ').split(/\s+/).filter(w=>w.length>=2)){
     enSet.add(w);
    }
   }
   const allSet=new Set([q,...enSet,...tokens]);
   if(!hasViChars16(q) && !dictMatched){
    for(const tok of tokens)enSet.add(tok);
   }
   const terms=[...allSet];
   terms.enTerms=[...enSet];
   terms.dictMatched=dictMatched;
   return terms;
  }

  async function fetchJsonWithTimeout(url,ms=10000){
   const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),ms);
   try{
    const res=await fetch(url,{signal:ctrl.signal});
    if(!res.ok)throw Error('HTTP '+res.status);
    return await res.json();
   }finally{clearTimeout(timer);}
  }

  async function runOnlineSearch(){
   const q=(A.searchQuery||'').trim().toLowerCase();
   A.searching=true; A.searchStatus='Đang tìm kiếm trên kho Asset...'; paint();
   try{
    let apiTranslated='';
    const initialTerms=expandSearchTerms16(q);
    if(q && (hasViChars16(q) || initialTerms.dictMatched || q.includes(' '))){
     apiTranslated=await translateViToEn16(q);
    }
    const terms=expandSearchTerms16(q,apiTranslated);
    const enList=terms.enTerms||[];
    if(q && (hasViChars16(q) || terms.dictMatched || (apiTranslated && apiTranslated!==q))){
     const previewEn=[...(apiTranslated?[apiTranslated]:[]),...enList.filter(x=>x!==apiTranslated)].slice(0,5);
     A.translatedHint=previewEn.length?`"${A.searchQuery.trim()}" → ${previewEn.join(', ')}`:'';
    }else{
     A.translatedHint='';
    }
    if(A.searchSource==='gdrive_models'){
     const matches=GDRIVE_ASSETS16.filter(item=>{
      if(!terms.length)return true;
      const hay=(item.id+' '+item.title+' '+item.tags+' '+item.dims).toLowerCase();
      const hayAscii=stripVi16(hay);
      return terms.some(t=>hay.includes(t)||hayAscii.includes(stripVi16(t)));
     });
     const finalItems=(matches.length?matches:GDRIVE_ASSETS16).slice(0,24);
     A.searchResults=finalItems.map(item=>({
      id:item.id,
      fileId:item.fileId,
      localUrl:item.localUrl||null,
      sidecarUrl:item.sidecarUrl||null,
      origin:item.origin||null,
      ofl_fixture:item.ofl_fixture||null,
      size_m:item.size_m||null,
      source:'gdrive_glb',
      title:item.title,
      license:item.license,
      thumb:item.thumbUrl
       ? item.thumbUrl
       : item.thumbId
        ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(item.thumbId)}&export=download`
        : svgFallbackPreviewURL16(item.title,item.dims,item.accent||'#38bdf8'),
      dims:item.dims
     }));
     A.searchStatus=matches.length
      ? `Tìm thấy ${matches.length} model GLB 3D từ Google Drive Design_MCP (nạp trực tiếp không cần giải nén).`
      : `Không khớp chính xác "${A.searchQuery}" — đang hiển thị ${finalItems.length} model GLB 3D có sẵn trong Google Drive.`;
    }else if(A.searchSource==='polyhaven_models' || A.searchSource==='polyhaven_textures'){
     const type=A.searchSource==='polyhaven_models'?'models':'textures';
     if(!A.polyCache[type]){
      A.polyCache[type]=await fetchJsonWithTimeout('https://api.polyhaven.com/assets?t='+type);
     }
     const all=Object.entries(A.polyCache[type]||{});
     let matches=[];
     if(!terms.length){
      if(type==='models'){
       const featSet=new Set(STAGE_FEATURED_POLY_MODELS16.map(s=>s.toLowerCase()));
       const pri=all.filter(([id])=>featSet.has(id.toLowerCase()));
       const rest=all.filter(([id])=>!featSet.has(id.toLowerCase()));
       matches=[...pri,...rest].slice(0,18);
      }else{
       matches=all.slice(0,18);
      }
     }else{
      const scored=[];
      const searchPool=enList.length?enList:terms;
      for(const [id,meta] of all){
       const idLower=id.toLowerCase();
       const nameLower=(meta.name||'').toLowerCase();
       const hay=[idLower,nameLower,...(meta.categories||[]),...(meta.tags||[])].join(' ').toLowerCase();
       let score=0;
       if(q && hay.includes(q))score+=10;
       if(apiTranslated && hay.includes(apiTranslated))score+=9;
       for(const t of searchPool){
        if(idLower===t||nameLower===t)score+=8;
        else if(idLower.includes(t)||nameLower.includes(t))score+=4;
        else if(hay.includes(t))score+=2;
       }
       if(score>0)scored.push({id,meta,score});
      }
      scored.sort((a,b)=>b.score-a.score);
      matches=scored.slice(0,18).map(x=>[x.id,x.meta]);
     }
     let usedFallback=false;
     if(!matches.length && all.length){
      usedFallback=true;
      matches=all.slice(0,18);
     }
     A.searchResults=matches.map(([id,meta])=>({
      id,
      source:type==='models'?'polyhaven_model':'polyhaven_tex',
      title:meta.name||id,
      license:'CC0 1.0 (Poly Haven)',
      thumb:`https://cdn.polyhaven.com/asset_img/thumbs/${encodeURIComponent(id)}.png?width=240`,
      dims:meta.dimensions?meta.dimensions.map(d=>(d/1000).toFixed(2)+'m').join('×'):(meta.categories||[]).slice(0,2).join(', ')
     }));
     A.searchStatus=usedFallback
      ? `Từ khóa "${A.searchQuery}" không khớp trực tiếp — gợi ý ${A.searchResults.length} asset CC0 phổ biến từ Poly Haven.`
      : `Tìm thấy ${A.searchResults.length} asset CC0 từ Poly Haven (${type==='models'?'Mô hình 3D':'Texture'}).`;
    }else{
     const wikiQuery=enList.length?enList.slice(0,4).join(' '):(terms.length?terms.slice(0,3).join(' '):(q||'stage concert lighting'));
     const api=`https://commons.wikimedia.org/w/api.php?origin=*&action=query&generator=search&gsrsearch=${encodeURIComponent('filetype:bitmap '+wikiQuery)}&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url|extmetadata|dimensions&iiurlwidth=320&format=json`;
     const data=await fetchJsonWithTimeout(api);
     const pages=Object.values(data?.query?.pages||{});
     const out=[];
     for(const p of pages){
      const ii=p.imageinfo?.[0]; if(!ii)continue;
      const ext=ii.extmetadata||{};
      const lic=String(ext.LicenseShortName?.value||ext.UsageTerms?.value||'').replace(/<[^>]*>/g,'').trim();
      const licLower=lic.toLowerCase();
      if(licLower && !ALLOWED_LICENSES.some(k=>licLower.includes(k)))continue;
      out.push({
       id:String(p.pageid||p.title),
       source:'wikimedia_img',
       title:String(p.title||'').replace(/^File:/i,''),
       license:lic||'CC0 / CC-BY',
       thumb:ii.thumburl||ii.url,
       downloadUrl:ii.thumburl||ii.url,
       dims:(ii.width&&ii.height)?`${ii.width}×${ii.height}px`:''
      });
     }
     A.searchResults=out.slice(0,18);
     A.searchStatus=A.searchResults.length?`Tìm thấy ${A.searchResults.length} ảnh CC0/CC-BY từ Wikimedia Commons.`:'Không tìm thấy ảnh CC0/CC-BY khớp từ khóa.';
    }
   }catch(err){
    A.searchResults=[];
    A.searchStatus='Không kết nối được kho online ('+(err?.message||'Offline')+'). Bạn có thể chọn nguồn Google Drive Design_MCP hoặc Thư viện Đạo cụ 3D Offline.';
   }finally{
    A.searching=false;
    paint();
   }
  }

  A.fixtureRigs16=new Map();

  function resolveOflFixture16(oflId){
   const raw=String(oflId||'').trim();
   if(!raw)return null;
   const normKey=raw.toLowerCase();
   const normSlug=normKey.replace(/\//g,'-');
   const globalResolver=(typeof window!=='undefined'&&typeof window.resolveOflFixture==='function'&&window.resolveOflFixture)||(typeof globalThis!=='undefined'&&typeof globalThis.resolveOflFixture==='function'&&globalThis.resolveOflFixture);
   let fx=globalResolver?globalResolver(raw):null;
   if(!fx){
    const list=(typeof window!=='undefined'&&window.OFL_FIXTURES)||(typeof globalThis!=='undefined'&&globalThis.OFL_FIXTURES)||[];
    fx=list.find(x=>x.id===raw||x.id.toLowerCase()===normKey||x.id.toLowerCase().replace(/\//g,'-')===normSlug||(Array.isArray(x.aliases)&&x.aliases.some(a=>{const al=String(a||'').toLowerCase();return al===normKey||al.replace(/\//g,'-')===normSlug;})))||null;
   }
   if(!fx)return null;
   const mode=fx.modes?.[0]||{name:'Standard (16ch)',channelCount:16,channels:[]};
   return {
    requestedId:raw,
    profileId:fx.id,
    manufacturer:fx.manufacturer,
    name:fx.name,
    category:fx.category,
    powerW:fx.physical?.powerW??350,
    weightKg:fx.physical?.weightKg??16.5,
    beamAngleMin:fx.physical?.beamAngleMin??1.5,
    beamAngleMax:fx.physical?.beamAngleMax??38,
    panMaxDeg:fx.physical?.panMaxDeg??540,
    tiltMaxDeg:fx.physical?.tiltMaxDeg??270,
    modeName:mode.name,
    channelCount:mode.channelCount||16,
    channels:(mode.channels||[]).map(ch=>({...ch}))
   };
  }

  function buildFixtureRig16(meshes,shift,oflMeta,rigId){
   const partName=m=>String(m?.nodeChain?.[m.nodeChain.length-1]?.name||String(m?.name||'').split('/').pop()||'').trim();
   const findPart=re=>meshes.find(m=>re.test(partName(m))||(Array.isArray(m.nodeChain)&&m.nodeChain.some(n=>re.test(String(n.name||'')))))||null;
   const baseMesh=findPart(/LED_Fixture_Base|(?:^|[_\s-])base$/i);
   const yokeMesh=findPart(/LED_Fixture_Yoke|(?:^|[_\s-])yoke$/i);
   const headMesh=findPart(/LED_Fixture_Head|(?:^|[_\s-])head$/i);
   if(!yokeMesh&&!headMesh)return null;
   for(const m of [baseMesh,yokeMesh,headMesh].filter(Boolean)){
    m._restP16=new Float32Array(m.p);
    m._restN16=m.n?new Float32Array(m.n):null;
   }
   const pivot=[...(shift||[0,0,0])];
   const headPivot=headMesh?.bounds?.center?[...headMesh.bounds.center]:[pivot[0],pivot[1]+0.38,pivot[2]];
   const baseId=String(rigId||('RIG16_'+Date.now().toString(36)));
   let uniqueId=baseId,seq=2;
   while(A.fixtureRigs16.has(uniqueId))uniqueId=baseId+'_'+(seq++);
   const rig={
    id:uniqueId,
    baseId,
    baseMesh,
    yokeMesh,
    headMesh,
    pivot,
    headPivot,
    panDeg:0,
    tiltDeg:0,
    oflFixture:oflMeta||null,
    setPanTilt(panDeg=0,tiltDeg=0){
     const maxPan=(oflMeta?.panMaxDeg||540)*0.5;
     const maxTilt=(oflMeta?.tiltMaxDeg||270)*0.5;
     const pDeg=clamp16(Number(panDeg)||0,-maxPan,maxPan);
     const tDeg=clamp16(Number(tiltDeg)||0,-maxTilt,maxTilt);
     rig.panDeg=pDeg;
     rig.tiltDeg=tDeg;
     const panRad=pDeg*Math.PI/180;
     const tiltRad=tDeg*Math.PI/180;
     const matPan=M.mm(M.translate(pivot),M.mm(M.rotate([0,1,0],panRad),M.translate([-pivot[0],-pivot[1],-pivot[2]])));
     if(yokeMesh&&yokeMesh._restP16){
      yokeMesh.p=new Float32Array(yokeMesh._restP16);
      if(yokeMesh._restN16)yokeMesh.n=new Float32Array(yokeMesh._restN16);
      transformMesh(yokeMesh,matPan);
      engine?.releaseMesh?.(yokeMesh);
     }
     if(headMesh&&headMesh._restP16){
      headMesh.p=new Float32Array(headMesh._restP16);
      if(headMesh._restN16)headMesh.n=new Float32Array(headMesh._restN16);
      const matTilt=M.mm(M.translate(headPivot),M.mm(M.rotate([1,0,0],tiltRad),M.translate([-headPivot[0],-headPivot[1],-headPivot[2]])));
      transformMesh(headMesh,M.mm(matPan,matTilt));
      engine?.releaseMesh?.(headMesh);
     }
     if(engine)engine._stageBatchDirty=true;
     S.mount136?.invalidate?.();
     if(typeof window!=='undefined'&&typeof window.paint==='function')window.paint();
     return {panDeg:pDeg,tiltDeg:tDeg,yokeBounds:yokeMesh?.bounds||null,headBounds:headMesh?.bounds||null};
    }
   };
   A.fixtureRigs16.set(rig.id,rig);
   return rig;
  }

  function setFixturePanTilt16(rigId,panDeg=0,tiltDeg=0){
   const key=String(rigId||'').trim();
   const rig=key
    ?(A.fixtureRigs16.get(key)||[...A.fixtureRigs16.values()].find(r=>r.id===key||r.baseId===key||r.oflFixture?.requestedId===key||r.oflFixture?.profileId===key)||null)
    :([...A.fixtureRigs16.values()][0]||null);
   if(!rig)return null;
   return rig.setPanTilt(panDeg,tiltDeg);
  }

  function commitImportedMeshesToStage16(parsed,title,opts={}){
   if(!parsed?.meshes?.length)throw Error('Model không có mesh hợp lệ.');
   checkpoint();
   const b=engine.stageBounds||{min:[-9,0,-4],max:[9,7,4]};
   let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   for(const m of parsed.meshes)for(let i=0;i<3;i++){min[i]=Math.min(min[i],m.bounds.min[i]);max[i]=Math.max(max[i],m.bounds.max[i]);}
   const spanY=Math.max(0.001,max[1]-min[1]);
   const isMountPoint=opts.origin==='mount-point'||/^fixture_/i.test(String(opts.id||title||''));
   const preserveScale=opts.preserveMetricScale===true||isMountPoint;
   const autoScale=preserveScale?1:((spanY>18||spanY<0.08)?clamp16(1.8/spanY,0.01,50):1);
   if(Math.abs(autoScale-1)>0.01){
    const sMat=M.trs([0,0,0],IDENTITY_Q,[autoScale,autoScale,autoScale]);
    min=[Infinity,Infinity,Infinity];max=[-Infinity,-Infinity,-Infinity];
    for(const m of parsed.meshes){
     transformMesh(m,sMat);
     for(let i=0;i<3;i++){min[i]=Math.min(min[i],m.bounds.min[i]);max[i]=Math.max(max[i],m.bounds.max[i]);}
    }
   }
   const offsetCount=engine.stage.filter(m=>String(m.name||'').startsWith('CC0 ')).length;
   const offsetX=(offsetCount%5-2)*0.95;
   let shift;
   if(opts.keepOrigin===true){
    shift=[0,0,0];
   }else if(Array.isArray(opts.pos)&&opts.pos.length===3){
    shift=isMountPoint
     ?[opts.pos[0],opts.pos[1],opts.pos[2]]
     :[opts.pos[0]-(min[0]+max[0])*.5,opts.pos[1]-min[1],opts.pos[2]-(min[2]+max[2])*.5];
   }else if(isMountPoint){
    // Giữ nguyên gốc treo mount-point [0,0,0] của đèn và đặt lên cao độ khung Truss
    const trussY=Math.max(4.5,(b.max?.[1]||6.0)-0.5);
    shift=[offsetX,trussY,0];
   }else{
    shift=[offsetX-(min[0]+max[0])*.5,(b.min?.[1]||0)-min[1],1.2-(min[2]+max[2])*.5];
   }
   if(shift[0]!==0||shift[1]!==0||shift[2]!==0){
    for(const m of parsed.meshes){
     transformMesh(m,M.translate(shift));
     if(m._gltfAnim?.sceneAnim)m._gltfAnim.sceneAnim.modelShift=shift.slice();
    }
   }
   const oflMeta=opts.ofl_fixture?resolveOflFixture16(opts.ofl_fixture):null;
   let finalMin=[Infinity,Infinity,Infinity],finalMax=[-Infinity,-Infinity,-Infinity];
   for(const m of parsed.meshes){
    m.name='CC0 '+title+' / '+m.name;
    m._assetOrigin16=isMountPoint?'mount-point':'floor-center';
    if(oflMeta){
     m._oflFixture=oflMeta;
     m._fixturePowerW=oflMeta.powerW;
     m._fixtureWeightKg=oflMeta.weightKg;
    }
    engine.stage.push(m);
    for(let i=0;i<3;i++){finalMin[i]=Math.min(finalMin[i],m.bounds.min[i]);finalMax[i]=Math.max(finalMax[i],m.bounds.max[i]);}
   }
   const rig=buildFixtureRig16(parsed.meshes,shift,oflMeta,String(opts.id||title||'fixture'));
   engine._stageBatchDirty=true;
   S.mount136?.invalidate?.();
   engine.view='stage';
   renderUI?.();
   paint();
   return {
    id:rig?.id||opts.id||title,
    title,
    origin:isMountPoint?'mount-point':'floor-center',
    meshCount:parsed.meshes.length,
    shift,
    bounds:{min:finalMin,max:finalMax,size:M.sub(finalMax,finalMin)},
    oflFixture:oflMeta,
    rig,
    setPanTilt:rig?rig.setPanTilt:null
   };
  }

  async function importLocalGlbProp(fileOrFiles,opts={}){
   const list=Array.isArray(fileOrFiles)||(typeof FileList!=='undefined'&&fileOrFiles instanceof FileList)
    ? Array.from(fileOrFiles)
    : [fileOrFiles].filter(Boolean);
   const glbFile=list.find(f=>/\.glb$/i.test(String(f?.name||'')))||list[0];
   if(!glbFile)throw Error('Hãy chọn tệp đạo cụ .glb hợp lệ.');
   let sidecar=opts.sidecar||null;
   const jsonFile=list.find(f=>/\.asset\.json$/i.test(String(f?.name||'')));
   if(!sidecar && jsonFile && typeof jsonFile.text==='function'){
    try{sidecar=JSON.parse(await jsonFile.text());}catch(_){}
   }
   const rawTitle=String(opts.title||sidecar?.title||sidecar?.id||glbFile.name||'GLB Prop').replace(/\.glb$/i,'');
   const origin=opts.origin||sidecar?.origin||(/^fixture_/i.test(rawTitle)?'mount-point':'floor-center');
   const ofl_fixture=opts.ofl_fixture!==undefined?opts.ofl_fixture:(sidecar?.ofl_fixture||null);
   const parsed=await Importer.gltf(glbFile,new Map());
   const committed=commitImportedMeshesToStage16(parsed,rawTitle,{
    ...opts,
    id:sidecar?.id||opts.id||rawTitle,
    origin,
    ofl_fixture,
    preserveMetricScale:opts.preserveMetricScale??true
   });
   toast(`Đã nạp đạo cụ GLB "${rawTitle}" (${committed.origin}${committed.oflFixture?' · DMX '+committed.oflFixture.profileId:''}) vào sân khấu!`);
   return {...committed,sidecar,warnings:parsed.warnings||[],meshes:parsed.meshes};
  }

  function openLocalGlbFilePicker16(){
   let inp=$('v16LocalGlbInput');
   if(!inp){
    inp=document.createElement('input');
    inp.type='file';
    inp.id='v16LocalGlbInput';
    inp.accept='.glb,.json';
    inp.multiple=true;
    inp.hidden=true;
    document.body.appendChild(inp);
    inp.onchange=async ()=>{
     const files=inp.files?Array.from(inp.files):[];
     inp.value='';
     if(!files.length)return;
     try{
      busy(true,'Đang nạp đạo cụ .GLB vào sân khấu...');
      await importLocalGlbProp(files);
     }catch(err){
      toast(err?.message||String(err));
     }finally{
      busy(false);
     }
    };
   }
   inp.click();
  }

  async function importOnlineResult(idx){
   const r=A.searchResults[idx];
   if(!r)return;
   try{
    busy(true,'Đang tải asset 3D / Media: '+r.title+'...');
    if(r.source==='gdrive_glb'){
     if(r.localUrl){
      const glbRes=await fetch(r.localUrl);
      if(!glbRes.ok)throw Error('Không tải được file GLB cục bộ (HTTP '+glbRes.status+').');
      const glbBlob=await glbRes.blob();
      const glbFile=new File([glbBlob],(r.id||'model')+'.glb',{type:'model/gltf-binary'});
      let sidecar=null;
      if(r.sidecarUrl){
       try{const scRes=await fetch(r.sidecarUrl);if(scRes.ok)sidecar=await scRes.json();}catch(_){}
      }
      await importLocalGlbProp(glbFile,{id:r.id,title:r.title,origin:r.origin,ofl_fixture:r.ofl_fixture,sidecar,preserveMetricScale:true});
     }else{
      const dlUrl=`https://drive.usercontent.google.com/download?id=${encodeURIComponent(r.fileId)}&export=download`;
      const glbRes=await fetch(dlUrl);
      if(!glbRes.ok)throw Error('Không tải được file GLB từ Google Drive (HTTP '+glbRes.status+').');
      const glbBlob=await glbRes.blob();
      const glbFile=new File([glbBlob],(r.id||'model')+'.glb',{type:'model/gltf-binary'});
      const parsed=await Importer.gltf(glbFile,new Map());
      commitImportedMeshesToStage16(parsed,r.title,{id:r.id,origin:r.origin,ofl_fixture:r.ofl_fixture,preserveMetricScale:true});
      toast('Đã nạp model 3D "'+r.title+'" từ Google Drive vào sân khấu!');
     }
    }else if(r.source==='polyhaven_model'){
     const filesData=await fetchJsonWithTimeout(`https://api.polyhaven.com/files/${encodeURIComponent(r.id)}`);
     const gltfNode=filesData?.gltf?.['1k']?.gltf || filesData?.gltf?.['2k']?.gltf || Object.values(filesData?.gltf||{})[0]?.gltf;
     if(!gltfNode?.url)throw Error('Không tìm thấy gói glTF 1K trên Poly Haven.');
     const gltfRes=await fetch(gltfNode.url);
     if(!gltfRes.ok)throw Error('Không tải được file .gltf');
     const gltfBlob=await gltfRes.blob();
     const gltfFile=new File([gltfBlob],r.id+'.gltf',{type:'model/gltf+json'});
     const map=new Map([[gltfFile.name.toLowerCase(),gltfFile]]);
     const inc=Object.entries(gltfNode.include||{}).filter(([relPath,info])=>{
      if(!info?.url)return false;
      const lower=relPath.toLowerCase();
      if(lower.endsWith('.bin'))return true;
      // Only fetch diffuse/albedo baseColor textures; normal/roughness/arm maps are unused by StageEngine shader
      return /diff|col|albedo|basecolor/i.test(lower) || !/\b(nor|arm|rough|disp|ao|spec|metal)\b/i.test(lower);
     });
     await Promise.all(inc.map(async ([relPath,info])=>{
      try{
       const subRes=await fetch(info.url);
       if(!subRes.ok)return;
       const subBlob=await subRes.blob();
       const base=relPath.split('/').pop();
       const f=new File([subBlob],base);
       map.set(relPath.toLowerCase(),f);
       map.set(base.toLowerCase(),f);
      }catch(_){}
     }));
     const parsed=await Importer.gltf(gltfFile,map);
     commitImportedMeshesToStage16(parsed,r.title);
     toast('Đã nạp model 3D CC0 "'+r.title+'" vào sân khấu!');
    }else if(r.source==='polyhaven_tex'){
     const filesData=await fetchJsonWithTimeout(`https://api.polyhaven.com/files/${encodeURIComponent(r.id)}`);
     const diffUrl=filesData?.Diffuse?.['1k']?.jpg?.url || filesData?.diff?.['1k']?.jpg?.url || filesData?.col?.['1k']?.jpg?.url;
     if(!diffUrl)throw Error('Không tìm thấy ảnh Diffuse 1K.');
     const imgRes=await fetch(diffUrl);
     if(!imgRes.ok)throw Error('Không tải được ảnh texture.');
     const blob=await imgRes.blob();
     const file=new File([blob],r.id+'_diffuse_1k.jpg',{type:'image/jpeg'});
     await addMediaFile(file);
     toast('Đã nạp texture CC0 "'+r.title+'" vào Media LED!');
    }else if(r.source==='wikimedia_img'){
     const imgRes=await fetch(r.downloadUrl);
     if(!imgRes.ok)throw Error('Không tải được ảnh Wikimedia.');
     const blob=await imgRes.blob();
     const ext=(r.title.split('.').pop()||'jpg').toLowerCase();
     const file=new File([blob],r.title.replace(/[^a-zA-Z0-9._-]/g,'_'),{type:blob.type||('image/'+ext)});
     await addMediaFile(file);
     toast('Đã nạp ảnh CC0/CC-BY "'+r.title+'" vào Media LED!');
    }
   }catch(err){
    toast('Lỗi tải asset: '+(err?.message||err));
   }finally{
    busy(false);
   }
  }

  // Overlay canvas for 3D Tape Measure & 28° Crease Wireframe
  const host=$('viewport')||document.querySelector('.canvas-wrap')||$('glcanvas')?.parentElement;
  const overlay=document.createElement('canvas');
  overlay.id='v16Overlay';
  overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4';
  host?.appendChild(overlay);
  const g=overlay.getContext('2d');

  function project(p){
   const a=engine.project(p);
   return a&&Number.isFinite(a.x+a.y+a.z)&&a.z>=-1.05&&a.z<=1.05?a:null;
  }

  let overlayDirty16=false;
  function renderOverlay(){
   requestAnimationFrame(renderOverlay);
   drawAxisGizmo16();
   if(!g)return;
   const w=overlay.clientWidth,h=overlay.clientHeight;
   if(w<2||h<2)return;
   if(!A.measureMode && !A.measurePts.length && !A.creaseEnabled){
    if(overlayDirty16 && overlay.width>0){g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,overlay.width,overlay.height);overlayDirty16=false;}
    return;
   }
   overlayDirty16=true;
   const scale=Math.min(1.5,window.devicePixelRatio||1),cw=Math.ceil(w*scale),ch=Math.ceil(h*scale);
   if(overlay.width!==cw||overlay.height!==ch){overlay.width=cw;overlay.height=ch;}
   g.setTransform(scale,0,0,scale,0,0);
   g.clearRect(0,0,w,h);
   if(!engine.vp||engine.view!=='stage')return;

   if(A.creaseEnabled){
    const targetMeshes=state.selectedMesh?engine.stage.filter(m=>m.id===state.selectedMesh):engine.stage.slice(0,40);
    g.strokeStyle='rgba(97, 232, 255, 0.55)';
    g.lineWidth=1.1;
    g.beginPath();
    for(const m of targetMeshes){
     if(m.hidden)continue;
     const segs=computeCreaseEdges(m,28);
     for(const [pa,pb] of segs){
      const a=project(pa),b=project(pb);
      if(!a||!b)continue;
      g.moveTo(a.x,a.y);
      g.lineTo(b.x,b.y);
     }
    }
    g.stroke();
   }

   if(A.measurePts.length){
    const p0=project(A.measurePts[0]);
    if(p0){
     g.fillStyle='#facc15';
     g.beginPath();g.arc(p0.x,p0.y,5,0,Math.PI*2);g.fill();
    }
    if(A.measurePts.length===2){
     const p1=project(A.measurePts[1]);
     if(p0&&p1){
      g.strokeStyle='#facc15';
      g.lineWidth=2.4;
      g.setLineDash([6,4]);
      g.beginPath();g.moveTo(p0.x,p0.y);g.lineTo(p1.x,p1.y);g.stroke();
      g.setLineDash([]);
      g.fillStyle='#facc15';
      g.beginPath();g.arc(p1.x,p1.y,5,0,Math.PI*2);g.fill();
      const d=M.sub(A.measurePts[1],A.measurePts[0]), len=Math.hypot(...d);
      const mx=(p0.x+p1.x)*.5, my=(p0.y+p1.y)*.5-12;
      const label=`${len.toFixed(2)} m (ΔX ${Math.abs(d[0]).toFixed(2)} · ΔY ${Math.abs(d[1]).toFixed(2)} · ΔZ ${Math.abs(d[2]).toFixed(2)})`;
      g.font='bold 12px Segoe UI, sans-serif';
      const tw=g.measureText(label).width+16;
      g.fillStyle='rgba(7, 17, 31, 0.92)';
      g.fillRect(mx-tw*.5,my-14,tw,22);
      g.strokeStyle='#facc15';
      g.lineWidth=1;
      g.strokeRect(mx-tw*.5,my-14,tw,22);
      g.fillStyle='#fef08a';
      g.textAlign='center';
      g.fillText(label,mx,my+1);
     }
    }
   }
  }
  requestAnimationFrame(renderOverlay);

  const glcanvas=$('glcanvas');
  glcanvas?.addEventListener('pointerup',e=>{
   if(state.presenting||e.button!==0)return;
   if(A.placeMode){
    const it=currentItem();
    const hit=engine.pick(e.clientX,e.clientY,false);
    if(it&&hit?.point){
     checkpoint();
     it.pos=hit.point.map(v=>+Number(v).toFixed(2));
     syncItemMeshes(it);
     toast('Đã đặt '+it.name+' tại ['+it.pos.join(', ')+'] m.');
    }
    A.placeMode=false;
    paint();
    e.stopImmediatePropagation();
    e.preventDefault();
   }else if(A.measureMode){
    const hit=engine.pick(e.clientX,e.clientY,true);
    if(hit?.point){
     if(A.measurePts.length>=2)A.measurePts=[];
     A.measurePts.push([...hit.point]);
     if(A.measurePts.length===2){
      const d=M.sub(A.measurePts[1],A.measurePts[0]);
      toast(`Khoảng cách 3D: ${Math.hypot(...d).toFixed(2)} m`);
     }else{
      toast('Đã chọn điểm 1. Click điểm thứ 2 trên sân khấu để đo.');
     }
     paint();
     e.stopImmediatePropagation();
     e.preventDefault();
    }
   }
  },true);

  // Dock inside .right-panel so it never floats over the 3D viewport or collides with other docks
  const panel=document.createElement('section');
  panel.id='v16AssetPanel';
  panel.className='v16-panel';
  panel.hidden=true;
  (document.querySelector('.right-panel')||document.body).appendChild(panel);

  // ============================================================================
  // 3D MESH PREVIEW RENDERER & LIVE TURNTABLE (Stage Props + 3D Cast Performers)
  // Renders actual 3D geometry (makeMesh / buildAssetMeshes / buildHuman + IK pose11)
  // onto 2D Canvas thumbnails and interactive 3D preview stages.
  // ============================================================================
  const PERFORMER_META16={
   singer:{tag:'VOCAL / MIC',color:'#33677f',action:'dance',desc:'Ca sĩ chính kèm micro cầm tay & chân đế micro sân khấu 3D.'},
   guitarist:{tag:'STRINGS / GUITAR',color:'#803f65',action:'dance',desc:'Nghệ sĩ Guitar điện 3D kèm thân đàn, cần đàn & dây đeo vai.'},
   keyboardist:{tag:'KEYS / PIANO',color:'#345852',action:'dance',desc:'Nghệ sĩ đàn Keyboard 24 phím đặt trên chân chữ X + ghế ngồi.'},
   drummer:{tag:'RHYTHM / DRUMS',color:'#c59042',action:'drum',desc:'Tay trống 3D ngồi sau bộ trống jazz đầy đủ (kick, snare, tom, cymbal) & dùi trống.'},
   dancer:{tag:'MOVE / DANCE',color:'#8a4267',action:'wave',desc:'Vũ công đương đại 14 khớp xương IK với trang phục biểu diễn & dải thắt lưng.'},
   audience:{tag:'CROWD / 24 NGƯỜI',color:'#34475c',action:'hold',desc:'Cụm khán giả 3D đứng cổ vũ dưới sân khấu (tối ưu gộp mesh tĩnh).'},
   leddancer:{tag:'LED SUIT / BATON',color:'#1c4d66',action:'wave',desc:'Vũ công mặc giáp LED phát sáng Neon kèm 2 thanh gậy LED Baton trên hai tay.'},
   waterdrummer:{tag:'TRỐNG NƯỚC / FX',color:'#2e6278',action:'drum',desc:'Nghệ sĩ trống nước LED kèm mặt trống phát sáng, chân đế & hạt nước bắn theo beat.'},
   laserdancer:{tag:'LASER SUIT / BEAM',color:'#2c5d48',action:'spin',desc:'Nghệ sĩ múa Laser mặc giáp phản quang kèm 2 đầu phát tia Laser trên cổ tay.'},
   fandancer:{tag:'MÚA QUẠT / LỤA 9 NAN',color:'#6e3455',action:'fan',desc:'Vũ công múa quạt lụa truyền thống gắn 2 quạt 9 nan phát sáng trên hai cổ tay IK.'},
   dj:{tag:'DJ / EDM BOOTH',color:'#0e7490',action:'wave',desc:'DJ / Producer đeo tai nghe phát sáng đứng điều khiển bàn DJ Turntable & Mixer LED.'},
   violinist:{tag:'STRINGS / VIOLIN',color:'#9f1239',action:'dance',desc:'Nghệ sĩ Violin biểu diễn kèm đàn vĩ cầm gỗ đặt trên vai & vĩ kéo gắn trực tiếp trên tay phải IK.'},
   saxophonist:{tag:'BRASS / SAXOPHONE',color:'#b45309',action:'dance',desc:'Nghệ sĩ kèn Saxophone đồng mạ vàng đeo dây cổ, hai tay bấm phím biểu diễn solo Jazz / Funk.'},
   mc:{tag:'HOST / KEYNOTE MC',color:'#1d4ed8',action:'dance',desc:'MC / Diễn giả sự kiện cầm micro không dây đưa gần miệng & tay trái cầm thẻ kịch bản Keynote.'},
   rapper:{tag:'HIP-HOP / HYPE MIC',color:'#7e22ce',action:'dance',desc:'Rapper / Hype Man đội mũ Snapback, dây chuyền vàng, cầm micro vàng sát miệng & vung tay khuấy động theo beat.'}
  };

  const ACT_PREVIEW_MAP16={
   band:'singer',
   dance:'dancer',
   led_dance:'leddancer',
   water_drums:'waterdrummer',
   laser:'laserdancer',
   fan_dance:'fandancer',
   ribbon:'fandancer',
   keymoment:'leddancer',
   live_band:'violinist',
   dj_festival:'dj',
   opening_gala:'mc'
  };

  function svgFallbackPreviewURL16(title,subtitle,accent='#38bdf8',tris=null){
   const safeAcc=esc16(accent||'#38bdf8');
   const polySvg=Array.isArray(tris)&&tris.length
    ? tris.slice(0,220).map(t=>`<polygon points="${t.pts}" fill="${t.fill}" stroke="${t.stroke||'none'}" stroke-width="0.35"/>`).join('')
    : `<circle cx="80" cy="54" r="28" fill="none" stroke="${safeAcc}" stroke-width="2" stroke-dasharray="4 3"/><path d="M56 76 L80 30 L104 76 Z" fill="${safeAcc}" fill-opacity="0.28" stroke="${safeAcc}" stroke-width="1.5"/>`;
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110" width="160" height="110">
    <defs>
     <radialGradient id="g" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="${safeAcc}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#060c16" stop-opacity="1"/>
     </radialGradient>
    </defs>
    <rect width="160" height="110" rx="6" fill="url(#g)"/>
    <ellipse cx="80" cy="90" rx="52" ry="11" fill="none" stroke="${safeAcc}" stroke-opacity="0.28" stroke-width="1"/>
    ${polySvg}
    <text x="8" y="14" fill="#94a3b8" font-family="Segoe UI, sans-serif" font-size="8" font-weight="700">${esc16(subtitle||'3D PREVIEW')}</text>
    <text x="8" y="103" fill="#e2e8f0" font-family="Segoe UI, sans-serif" font-size="9.5" font-weight="700">${esc16(title||'3D Asset')}</text>
   </svg>`;
   return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
  }

  function renderMeshes3DToCanvas16(cvs,entries,opts={}){
   const w=cvs?.width||320, h=cvs?.height||220;
   const list=(entries||[]).map(e=>e?.mesh?e:{mesh:e,matrix:null}).filter(e=>e.mesh?.p?.length>=9);
   if(!list.length)return svgFallbackPreviewURL16(opts.title,opts.subtitle,opts.accent);

   let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
   if(opts.fixedBounds){
    [minX,minY,minZ]=opts.fixedBounds.min;
    [maxX,maxY,maxZ]=opts.fixedBounds.max;
   }else{
    for(const {mesh,matrix} of list){
     const p=mesh.p, step=Math.max(3,Math.floor(p.length/480)*3);
     for(let i=0;i<p.length;i+=step){
      let x=p[i],y=p[i+1],z=p[i+2];
      if(matrix){
       const tx=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12];
       const ty=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13];
       const tz=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14];
       x=tx;y=ty;z=tz;
      }
      if(x<minX)minX=x;if(x>maxX)maxX=x;
      if(y<minY)minY=y;if(y>maxY)maxY=y;
      if(z<minZ)minZ=z;if(z>maxZ)maxZ=z;
     }
    }
   }
   if(!Number.isFinite(minX)){minX=-1;maxX=1;minY=0;maxY=2;minZ=-1;maxZ=1;}
   const cx=(minX+maxX)*.5, cy=(minY+maxY)*.5, cz=(minZ+maxZ)*.5;
   const spanX=maxX-minX, spanY=maxY-minY, spanZ=maxZ-minZ;
   const radius=Math.max(0.35,Math.hypot(spanX,spanY,spanZ)*.5);
   const yaw=opts.yaw??0.34, pitch=opts.pitch??0.18;
   const cyaw=Math.cos(yaw), syaw=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
   const camDist=radius*(opts.zoom??1.95);
   const fovScale=Math.min(w,h)*(opts.fovScale??1.08);
   const screenCX=w*.5, screenCY=h*.52;

   // Camera looks at (cx,cy,cz) from the +Z front hemisphere:
   // Points with larger vz are closer to the camera (smaller depth = camDist - vz)
   // and therefore sort LAST in Painter's algorithm (tris.sort((a,b)=>b.z-a.z)).
   function projectPt(x,y,z){
    const dx=x-cx, dy=y-cy, dz=z-cz;
    const rx=dx*cyaw+dz*syaw;
    const rz=-dx*syaw+dz*cyaw;
    const ry=dy*cp-rz*sp;
    const vz=dy*sp+rz*cp;
    const depth=camDist-vz;
    if(depth<=0.08)return null;
    const inv=fovScale/depth;
    return {x:screenCX+rx*inv, y:screenCY-ry*inv, z:depth};
   }

   let totalTris=0;
   for(const {mesh} of list)totalTris+=Math.floor(mesh.p.length/9);
   const maxTris=opts.maxTris||30000;
   const triStride=Math.max(1,Math.ceil(totalTris/maxTris));

   const tris=[];
   let triIdx=0;
   for(const {mesh,matrix} of list){
    const p=mesh.p, nArr=mesh.n, col=mesh.material?.color||[0.62,0.72,0.84], em=mesh.material?.emissive||[0,0,0];
    // node11/mergeCast renames meshes ("V11 / left"), so thin sheets flag material.doubleSided instead of relying on the name
    const isDoubleSided=!!mesh.material?.doubleSided||/Fan silk|MC Cue Card|Violin Strings/i.test(mesh.name||'');
    for(let i=0;i+8<p.length;i+=9){
     if(triStride>1 && (triIdx++%triStride)!==0)continue;
     let x0=p[i],y0=p[i+1],z0=p[i+2], x1=p[i+3],y1=p[i+4],z1=p[i+5], x2=p[i+6],y2=p[i+7],z2=p[i+8];
     if(matrix){
      let tx=matrix[0]*x0+matrix[4]*y0+matrix[8]*z0+matrix[12];
      let ty=matrix[1]*x0+matrix[5]*y0+matrix[9]*z0+matrix[13];
      let tz=matrix[2]*x0+matrix[6]*y0+matrix[10]*z0+matrix[14];
      x0=tx;y0=ty;z0=tz;
      tx=matrix[0]*x1+matrix[4]*y1+matrix[8]*z1+matrix[12];
      ty=matrix[1]*x1+matrix[5]*y1+matrix[9]*z1+matrix[13];
      tz=matrix[2]*x1+matrix[6]*y1+matrix[10]*z1+matrix[14];
      x1=tx;y1=ty;z1=tz;
      tx=matrix[0]*x2+matrix[4]*y2+matrix[8]*z2+matrix[12];
      ty=matrix[1]*x2+matrix[5]*y2+matrix[9]*z2+matrix[13];
      tz=matrix[2]*x2+matrix[6]*y2+matrix[10]*z2+matrix[14];
      x2=tx;y2=ty;z2=tz;
     }
     const s0=projectPt(x0,y0,z0), s1=projectPt(x1,y1,z1), s2=projectPt(x2,y2,z2);
     if(!s0||!s1||!s2)continue;
     if(Math.max(s0.x,s1.x,s2.x)-Math.min(s0.x,s1.x,s2.x)<0.55 && Math.max(s0.y,s1.y,s2.y)-Math.min(s0.y,s1.y,s2.y)<0.55)continue;

     // Use outward vertex normals from mesh.n (since loft11/torso wind CW around +Y)
     let nx=0, ny=0, nz=0;
     if(nArr && nArr.length>=i+9){
      const fnx=(nArr[i]+nArr[i+3]+nArr[i+6])*0.3333;
      const fny=(nArr[i+1]+nArr[i+4]+nArr[i+7])*0.3333;
      const fnz=(nArr[i+2]+nArr[i+5]+nArr[i+8])*0.3333;
      if(matrix){
       nx=matrix[0]*fnx+matrix[4]*fny+matrix[8]*fnz;
       ny=matrix[1]*fnx+matrix[5]*fny+matrix[9]*fnz;
       nz=matrix[2]*fnx+matrix[6]*fny+matrix[10]*fnz;
      }else{
       nx=fnx;ny=fny;nz=fnz;
      }
     }else{
      const ux=x1-x0, uy=y1-y0, uz=z1-z0;
      const vx=x2-x0, vy=y2-y0, vz=z2-z0;
      nx=uy*vz-uz*vy; ny=uz*vx-ux*vz; nz=ux*vy-uy*vx;
     }
     const nl=Math.hypot(nx,ny,nz)||1;
     nx/=nl;ny/=nl;nz/=nl;

     // Rotate outward normal into camera view space (where +vnz points toward camera)
     const rnx=nx*cyaw+nz*syaw;
     const rnz=-nx*syaw+nz*cyaw;
     const vnx=rnx;
     const vny=ny*cp-rnz*sp;
     let vnz=ny*sp+rnz*cp;

     // Cull back-facing triangles on closed solid meshes so interior/back layers never bleed through
     if(!isDoubleSided && vnz<-0.15)continue;
     if(vnz<0)vnz=-vnz;

     // Studio 3-point lighting in camera space (bright key + warm fill + cyan rim + specular)
     const keyDot=Math.max(0,vnx*0.36+vny*0.52+vnz*0.77);
     const fillDot=Math.max(0,-vnx*0.48+vny*0.22+vnz*0.65);
     const rimDot=Math.pow(Math.max(0,1-vnz),2.2)*Math.max(0,0.4+vny*0.6);
     const spec=Math.pow(Math.max(0,vnx*0.18+vny*0.34+vnz*0.92),18)*0.18;
     const shade=0.40+keyDot*0.58+fillDot*0.18;
     const r=Math.min(255,Math.round(((col[0]??0.65)*shade+(em[0]||0)*0.92+spec+rimDot*0.05)*255));
     const g=Math.min(255,Math.round(((col[1]??0.72)*shade+(em[1]||0)*0.92+spec+rimDot*0.10)*255));
     const b=Math.min(255,Math.round(((col[2]??0.82)*shade+(em[2]||0)*0.92+spec+rimDot*0.18)*255));
     const cw=(s1.x-s0.x)*(s2.y-s0.y)<(s1.y-s0.y)*(s2.x-s0.x);
     tris.push({
      z:(s0.z+s1.z+s2.z)*0.3333,
      x0:s0.x,y0:s0.y,x1:cw?s2.x:s1.x,y1:cw?s2.y:s1.y,x2:cw?s1.x:s2.x,y2:cw?s1.y:s2.y,
      fill:`rgb(${r},${g},${b})`
     });
    }
   }
   tris.sort((a,b)=>b.z-a.z);

   let ctx=null;
   try{ctx=cvs?.getContext?.('2d');}catch(_){ctx=null;}
   if(!ctx){
    const svgTris=tris.slice(0,220).map(t=>({
     pts:`${t.x0.toFixed(1)},${t.y0.toFixed(1)} ${t.x1.toFixed(1)},${t.y1.toFixed(1)} ${t.x2.toFixed(1)},${t.y2.toFixed(1)}`,
     fill:t.fill
    }));
    return svgFallbackPreviewURL16(opts.title,opts.subtitle,opts.accent,svgTris);
   }

   const uiScale=Math.max(1,w/160);
   ctx.clearRect(0,0,w,h);
   const bg=ctx.createRadialGradient(w*.5,h*.38,8*uiScale,w*.5,h*.5,Math.max(w,h)*.74);
   bg.addColorStop(0,'rgba(38, 86, 128, 0.44)');
   bg.addColorStop(0.6,'rgba(12, 24, 42, 0.92)');
   bg.addColorStop(1,'rgba(5, 10, 18, 0.99)');
   ctx.fillStyle=bg;
   ctx.fillRect(0,0,w,h);

   // Draw perspective floor stage spotlight & ring at minY
   const ringR=Math.max(spanX,spanZ)*0.60||0.65;
   ctx.strokeStyle='rgba(97, 232, 255, 0.28)';
   ctx.lineWidth=1.1*uiScale;
   ctx.beginPath();
   for(let a=0;a<=28;a++){
    const th=a/28*Math.PI*2;
    const p=projectPt(cx+Math.cos(th)*ringR,minY,cz+Math.sin(th)*ringR);
    if(!p)continue;
    if(a===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
   }
   ctx.stroke();

   // Seal sub-pixel anti-aliasing seams between adjacent triangles so solid meshes never look see-through
   ctx.lineJoin='round';
   ctx.lineWidth=Math.max(0.55,0.45*uiScale);
   for(let i=0;i<tris.length;){
    const fill=tris[i].fill;
    ctx.fillStyle=fill;
    ctx.strokeStyle=fill;
    ctx.beginPath();
    while(i<tris.length && tris[i].fill===fill){
     const t=tris[i++];
     ctx.moveTo(t.x0,t.y0);
     ctx.lineTo(t.x1,t.y1);
     ctx.lineTo(t.x2,t.y2);
     ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
   }

   if(opts.badge){
    const padX=6*uiScale, padY=6*uiScale, boxH=16*uiScale;
    ctx.font=`bold ${Math.round(9*uiScale)}px Plus Jakarta Sans, Segoe UI, sans-serif`;
    const textW=ctx.measureText(opts.badge).width;
    ctx.fillStyle='rgba(7, 15, 28, 0.84)';
    ctx.fillRect(padX,padY,Math.min(w-padX*2,textW+12*uiScale),boxH);
    ctx.fillStyle=opts.accent||'#61e8ff';
    ctx.fillText(opts.badge,padX+5*uiScale,padY+11.5*uiScale);
   }
   // Live canvases and queued thumbnails skip the synchronous PNG encode (~100ms+ per call on the main thread)
   if(opts.noURL)return cvs;
   try{
    const url=cvs.toDataURL('image/png');
    if(url && url.startsWith('data:image/'))return url;
   }catch(_){}
   return svgFallbackPreviewURL16(opts.title,opts.subtitle,opts.accent);
  }

  // Thumbnails render one per task and encode via async toBlob, so opening a gallery never blocks on
  // dozens of software renders. Until ready the <img> shows a key-unique SVG placeholder, swapped in place.
  // Finished stills are WebP (a fraction of PNG size) and persist in IndexedDB, so later sessions skip
  // rendering entirely. Disk entries are keyed by a fingerprint of the code/data the renders depend on;
  // bump THUMB_CACHE_VERSION16 when geometry the fingerprint cannot see changes (the wrapped buildHuman
  // layers in core 04/06 and modules/v12, mesh helpers like rod/torso, node11 merging).
  const THUMB_CACHE_VERSION16=3;
  const THUMB_DB16='ledstudio-thumbs16';
  const thumbJobs16=new Map();
  let thumbTimer16=0, thumbDisk16=null, thumbDiskReady16=false;
  function fingerprint16(){
   const src=[THUMB_CACHE_VERSION16,
    typeof buildArtHuman11==='function'?String(buildArtHuman11):'',String(S.buildHuman),String(S.castMatrix),
    renderMeshes3DToCanvas16,buildAssetMeshes,getCachedPerformerNodes16,getCrowdEntries16,buildPerformerPreviewEntries16,
    getPerformerFixedBounds16,getPerformerPreviewURL16,actMembers16,getActBounds16,getActPreviewURL16,
    buildQuickExampleEntries16,getQuickExamplePreviewURL16,getAssetPreviewURL16,
    JSON.stringify([PERFORMER_META16,S.ACT_TYPES,S.castNames,QUICK_EXAMPLES16,CATALOG])].join('\n');
   let h=0x811c9dc5;
   for(let i=0;i<src.length;i++){h^=src.charCodeAt(i);h=Math.imul(h,0x01000193);}
   return (h>>>0).toString(36);
  }
  function flushCachedThumbImgs16(){
   for(const [key,job] of thumbJobs16){
    if(A.previewCache.has(key)){
     const url=A.previewCache.get(key);
     thumbJobs16.delete(key);
     for(const img of document.querySelectorAll('img'))if(img.getAttribute('src')===job.placeholder)img.src=url;
    }
   }
  }
  // Resolves to {db,prefix} (or null without IndexedDB) after loading this fingerprint's stills into
  // A.previewCache and deleting stale ones.
  function openThumbDisk16(){
   if(thumbDisk16)return thumbDisk16;
   return thumbDisk16=new Promise(resolve=>{
    const done=val=>{thumbDiskReady16=true;flushCachedThumbImgs16();resolve(val);};
    let req;
    try{req=indexedDB.open(THUMB_DB16,1);}catch(_){done(null);return;}
    req.onupgradeneeded=()=>req.result.createObjectStore('thumbs');
    req.onerror=()=>done(null);
    req.onsuccess=()=>{
     const db=req.result, prefix=fingerprint16()+'|';
     let tx;
     try{tx=db.transaction('thumbs','readwrite');}catch(_){done(null);return;}
     tx.objectStore('thumbs').openCursor().onsuccess=e=>{
      const cur=e.target.result;
      if(!cur)return;
      const k=String(cur.key);
      if(k.startsWith(prefix)){
       const cacheKey=k.slice(prefix.length);
       if(!A.previewCache.has(cacheKey)){
        const v=cur.value;
        if(typeof v==='string'&&v.startsWith('data:image/'))A.previewCache.set(cacheKey,v);
        else if(v instanceof Blob)A.previewCache.set(cacheKey,URL.createObjectURL(v));
       }
      }else cur.delete();
      cur.continue();
     };
     tx.oncomplete=tx.onerror=tx.onabort=()=>done({db,prefix});
    };
   });
  }
  function saveThumbDisk16(key,val){
   openThumbDisk16().then(d=>{
    if(!d)return;
    const write=payload=>{try{d.db.transaction('thumbs','readwrite').objectStore('thumbs').put(payload,d.prefix+key);}catch(err){console.warn('[v16] thumbnail cache',err);}};
    if(typeof val==='string')write(val);
    else if(val instanceof Blob && typeof FileReader==='function'){
     const fr=new FileReader();
     fr.onload=()=>write(typeof fr.result==='string'?fr.result:val);
     fr.onerror=()=>write(val);
     fr.readAsDataURL(val);
    }else write(val);
   });
  }
  function queueThumb16(key,title,subtitle,accent,draw){
   if(A.previewCache.has(key))return A.previewCache.get(key);
   let job=thumbJobs16.get(key);
   if(!job){
    const placeholder=svgFallbackPreviewURL16(title,subtitle,accent).replace('%3C%2Fsvg%3E',encodeURIComponent(`<!--${key}--></svg>`));
    job={placeholder,draw};
    thumbJobs16.set(key,job);
   }
   if(!thumbTimer16)thumbTimer16=setTimeout(pumpThumbs16,0);
   return job.placeholder;
  }
  function thumbPriority16(key,job){
   if(job.urgent)return 0;
   if(key.startsWith('cast:'))return 1;
   if(key.startsWith('asset:'))return 2;
   if(key.startsWith('act:'))return 3;
   return 4;
  }
  function pumpThumbs16(){
   thumbTimer16=0;
   if(!thumbDiskReady16){
    thumbTimer16=-1; // waiting for the disk cache; queueThumb16 must not start a second pump
    openThumbDisk16().then(()=>{thumbTimer16=0;pumpThumbs16();});
    return;
   }
   const finish=(key,job,url)=>{
    thumbJobs16.delete(key);
    A.previewCache.set(key,url);
    for(const img of document.querySelectorAll('img'))if(img.getAttribute('src')===job.placeholder)img.src=url;
   };
   const scheduleNext=()=>{
    if(!thumbTimer16&&[...thumbJobs16.values()].some(j=>!j.started)){
     thumbTimer16=setTimeout(pumpThumbs16,28);
    }
   };
   // Stills already loaded from disk need no render
   flushCachedThumbImgs16();
   const pending=[...thumbJobs16].filter(([,j])=>!j.started);
   if(!pending.length)return;
   pending.sort((a,b)=>thumbPriority16(a[0],a[1])-thumbPriority16(b[0],b[1]));
   const [key,job]=pending[0];
   job.started=true; // stays in the map until finished so a re-render meanwhile reuses the same placeholder
   let out=null;
   try{out=job.draw();}catch(err){console.warn('[v16] thumbnail',key,err);}
   if(typeof out==='string'){finish(key,job,out);scheduleNext();}
   else if(out?.toBlob)out.toBlob(b=>{
    if(!b){finish(key,job,job.placeholder);scheduleNext();return;}
    finish(key,job,URL.createObjectURL(b));
    saveThumbDisk16(key,b);
    scheduleNext();
   },'image/webp',0.80);
   else{finish(key,job,job.placeholder);scheduleNext();}
  }
  // Render this still next (e.g. the one just selected in a sidebar) instead of waiting behind the grid
  function prioritizeThumb16(src){
   for(const j of thumbJobs16.values())if(j.placeholder===src)j.urgent=true;
  }

  function getAssetPreviewURL16(kind){
   const spec=CATALOG[kind];
   if(!spec)return '';
   return queueThumb16('asset:'+kind,spec.name,spec.label,spec.color,()=>{
    const meshes=buildAssetMeshes({id:'prev_'+kind,kind,name:spec.name,pos:[0,0,0],yaw:0,scale:1,color:spec.color});
    const cvs=document.createElement('canvas');
    cvs.width=240;cvs.height=156;
    return renderMeshes3DToCanvas16(cvs,meshes,{
     yaw:0.52,pitch:0.22,zoom:1.92,noURL:true,
     title:spec.name,subtitle:spec.label,accent:spec.color,badge:spec.cat
    });
   });
  }

  function getCachedPerformerNodes16(type,col){
   const key=type+'|'+(col||'');
   if(A.castNodeCache16.has(key))return A.castNodeCache16.get(key);
   const prevQ=S.choreo11?.quality;
   if(S.choreo11)S.choreo11.quality='preview';
   let nodes=[];
   try{
    const dummy={id:'__node_cache_'+type,type,name:(S.castNames&&S.castNames[type])||type,pos:[0,0,0],yaw:0,height:1.75,color:col,skin:'#c49474',animate:true};
    nodes=S.buildHuman(dummy,false,0);
   }finally{
    if(S.choreo11 && prevQ)S.choreo11.quality=prevQ;
   }
   A.castNodeCache16.set(key,nodes);
   // Costume colour picker creates one key per colour while dragging; keep the cache bounded (oldest first)
   if(A.castNodeCache16.size>48)A.castNodeCache16.delete(A.castNodeCache16.keys().next().value);
   return nodes;
  }

  // Mirrors rebuildCast() (core 04) for a default audience entry: 24 lite figures, 12 columns, 0.65 m
  // spacing, cycling colours/skins. Static on stage, so the entries are built once.
  let crowdEntries16=null;
  function getCrowdEntries16(){
   if(crowdEntries16)return crowdEntries16;
   const cols=12, sp=.65, entries=[];
   for(let i=0;i<24;i++){
    const q={id:'__prev_aud',type:'audience',name:'Khán giả',pos:[0,0,0],yaw:0,height:1.75,color:['#34475c','#6d4c66','#3f6062','#67676e'][i%4],skin:['#b77f5e','#d4a585','#a27153'][i%3],animate:false,count:24,columns:cols,spacing:sp};
    const matrix=[1,0,0,0, 0,1,0,0, 0,0,1,0, ((i%cols)-(cols-1)/2)*sp,0,Math.floor(i/cols)*sp*.95,1];
    for(const node of S.buildHuman(q,true,i))for(const mesh of node.meshes||[])entries.push({mesh,matrix});
   }
   return crowdEntries16=entries;
  }

  function buildPerformerPreviewEntries16(type,opts={}){
   const meta=PERFORMER_META16[type]||PERFORMER_META16.singer;
   const actKey=(opts.action && opts.action!=='auto')?opts.action:meta.action;
   const col=opts.color||meta.color;
   const h=clamp16(opts.height||1.75,1.2,2.4);
   const t=opts.time??0.65;
   const entries=[];
   if(type==='audience')return getCrowdEntries16();
   const pos=opts.pos||[0,0,0];
   const d={
    id:'__prev_cast_'+type+'_'+actKey+'_'+pos[0],
    type,
    name:(S.castNames&&S.castNames[type])||type,
    pos,
    yaw:0,
    height:h,
    color:col,
    skin:'#c49474',
    animate:true,
    phase:opts.phase??0.35,
    previewForceAnim16:true,
    previewAction16:actKey,
    previewEnergy16:0.82
   };
   const nodes=getCachedPerformerNodes16(type,col);
   for(const node of nodes){
    const mat=S.castMatrix(d,node,t);
    for(const mesh of node.meshes||[])entries.push({mesh,matrix:mat});
   }
   return entries;
  }

  function getPerformerFixedBounds16(type,height=1.75){
   const s=clamp16(height,1.2,2.4)/1.75;
   if(type==='audience')return {min:[-3.95,0,-0.3],max:[3.95,1.85,0.95]}; // 12 x 2 crowd block
   if(type==='drummer'||type==='keyboardist'||type==='dj')return {min:[-0.68*s,0,-0.55*s],max:[0.68*s,1.82*s,0.72*s]};
   if(type==='fandancer')return {min:[-0.72*s,0,-0.45*s],max:[0.72*s,1.88*s,0.55*s]};
   return {min:[-0.58*s,0,-0.45*s],max:[0.58*s,1.84*s,0.58*s]};
  }

  function getPerformerPreviewURL16(type,action='auto'){
   const meta=PERFORMER_META16[type]||PERFORMER_META16.singer;
   const actKey=(action&&action!=='auto')?action:meta.action;
   const cacheKey='cast:'+type+':'+actKey;
   const title=(S.castNames&&S.castNames[type])||type;
   return queueThumb16(cacheKey,title,meta.tag,meta.color,()=>{
    const entries=buildPerformerPreviewEntries16(type,{action:actKey,time:0.65});
    const cvs=document.createElement('canvas');
    cvs.width=240;cvs.height=180;
    return renderMeshes3DToCanvas16(cvs,entries,{
     yaw:type==='drummer'||type==='keyboardist'||type==='dj'?0.38:0.28,
     pitch:0.16,
     zoom:1.78,
     noURL:true,
     maxTris:45000,
     fixedBounds:getPerformerFixedBounds16(type,1.75),
     title,
     subtitle:meta.tag,
     accent:meta.color,
     badge:meta.tag
    });
   });
  }

  function actPreviewAction16(actId){
   return actId==='fan_dance'?'fan':actId==='ribbon'?'wave':actId==='laser'?'spin':actId==='water_drums'?'drum':actId==='keymoment'?'finale':'dance';
  }

  // Mirrors addAct8 (core 04 + v12 roles): same members, roles, colours and 1.6 m spacing as on stage.
  function actMembers16(actId){
   const spec=S.ACT_TYPES?.[actId];
   if(!spec?.count)return [];
   const roles=Array.isArray(spec.roles)?spec.roles:null;
   return Array.from({length:spec.count},(_,i)=>{
    const role=roles?roles[i%roles.length]:spec.kind;
    return {
     role,
     color:roles?(PERFORMER_META16[role]?.color||'#38bdf8'):['#275a86','#74355e'][i%2],
     action:roles?'auto':actPreviewAction16(actId), // mixed bands keep each role's own default action
     pos:[(i-(spec.count-1)/2)*1.6,0,0],
     phase:i*.65
    };
   }).filter(m=>S.castNames?.[m.role]);
  }

  function buildActPreviewEntries16(actId,time=0.65){
   const members=actMembers16(actId);
   // Key-moment acts have no performers: show the role the act is themed around
   if(!members.length)return buildPerformerPreviewEntries16(ACT_PREVIEW_MAP16[actId]||'dancer',{action:actPreviewAction16(actId),time});
   const entries=[];
   for(const m of members)entries.push(...buildPerformerPreviewEntries16(m.role,{action:m.action,color:m.color,time,pos:m.pos,phase:m.phase}));
   return entries;
  }

  function getActBounds16(actId){
   const n=actMembers16(actId).length;
   if(!n)return getPerformerFixedBounds16(ACT_PREVIEW_MAP16[actId]||'dancer');
   const half=(n-1)*0.8+0.75;
   return {min:[-half,0,-0.6],max:[half,1.9,0.75]};
  }

  function getActPreviewURL16(actId){
   const spec=S.ACT_TYPES?.[actId];
   if(!spec)return '';
   return queueThumb16('act:'+actId,spec.name,spec.tag,'#61e8ff',()=>{
    const cvs=document.createElement('canvas');
    cvs.width=260;cvs.height=164;
    return renderMeshes3DToCanvas16(cvs,buildActPreviewEntries16(actId),{
     yaw:0.3,pitch:0.2,zoom:1.55,noURL:true,maxTris:40000,
     fixedBounds:getActBounds16(actId),
     title:spec.name,subtitle:spec.tag,accent:'#61e8ff',badge:spec.tag
    });
   });
  }

  function offsetEntries16(entries,[x,y,z]){
   return entries.map(({mesh,matrix})=>{
    const m=matrix?[...matrix]:[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    m[12]+=x;m[13]+=y;m[14]+=z;
    return {mesh,matrix:m};
   });
  }

  // Mirrors applyQuickCastExample16: the act at [0,0,0.35], extra cast and props at their preset positions
  function buildQuickExampleEntries16(ex){
   const entries=[];
   if(ex.act&&S.ACT_TYPES?.[ex.act])entries.push(...offsetEntries16(buildActPreviewEntries16(ex.act),[0,0,0.35]));
   for(const c of ex.cast||[]){
    if(c.type==='audience')entries.push(...offsetEntries16(getCrowdEntries16(),c.pos));
    else entries.push(...buildPerformerPreviewEntries16(c.type,{pos:c.pos}));
   }
   for(const pr of ex.props||[]){
    const spec=CATALOG[pr.kind];
    if(spec)entries.push(...buildAssetMeshes({id:'prev_qex_'+pr.kind,kind:pr.kind,name:spec.name,pos:pr.pos,yaw:0,scale:1,color:spec.color}));
   }
   return entries;
  }

  function getQuickExamplePreviewURL16(id){
   const ex=QUICK_EXAMPLES16.find(x=>x.id===id);
   if(!ex)return '';
   return queueThumb16('qex:'+id,ex.label,ex.sub,'#61e8ff',()=>{
    const cvs=document.createElement('canvas');
    cvs.width=320;cvs.height=214;
    return renderMeshes3DToCanvas16(cvs,buildQuickExampleEntries16(ex),{
     yaw:0.32,pitch:0.55,zoom:1.45,noURL:true,maxTris:50000, // higher angle so front rows/props don't hide the act
     title:ex.label,subtitle:ex.sub,accent:'#61e8ff',badge:'MẪU DÀN DỰNG'
    });
   });
  }

  let propAnimFrame16=0;
  function updatePropLivePreview16(){
   const cvs=$('v16PropLiveCanvas');
   if(!cvs||!A.isOpen||A.tab!=='catalog')return;
   const kind=CATALOG[A.previewKind]?A.previewKind:'truss_tower';
   const spec=CATALOG[kind];
   const it=currentItem();
   const col=(it&&it.kind===kind)?it.color:spec.color;
   const meshes=buildAssetMeshes({id:'live_prop',kind,name:spec.name,pos:[0,0,0],yaw:0,scale:1,color:col});
   renderMeshes3DToCanvas16(cvs,meshes,{
    yaw:A.propPreviewYaw,
    pitch:0.24,
    zoom:1.92,
    noURL:true,
    title:spec.name,
    subtitle:spec.label,
    accent:col,
    badge:spec.label
   });
  }

  function bindPropLiveCanvas16(){
   const cvs=$('v16PropLiveCanvas');
   if(!cvs||cvs._bound16)return;
   cvs._bound16=true;
   let dragging=false, lastX=0;
   cvs.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;try{cvs.setPointerCapture(e.pointerId);}catch(_){}});
   cvs.addEventListener('pointermove',e=>{
    if(!dragging)return;
    A.propPreviewYaw+=(e.clientX-lastX)*0.018;
    lastX=e.clientX;
    // pointermove fires faster than the display; render at most once per frame
    if(!propAnimFrame16)propAnimFrame16=requestAnimationFrame(()=>{propAnimFrame16=0;updatePropLivePreview16();});
   });
   const stop=()=>{dragging=false;};
   cvs.addEventListener('pointerup',stop);
   cvs.addEventListener('pointercancel',stop);
   updatePropLivePreview16();
  }

  const QUICK_EXAMPLES16=[
   {
    id:'concert_band',
    label:'🎸 Ban nhạc Live Concert',
    sub:'5 Nghệ sĩ + Bục Riser + 2 CO2 FX',
    desc:'Thêm đội hình Ca sĩ, Guitarist, Violin, Saxophone, Tay trống kèm bục Riser & 2 súng khói CO2.',
    act:'live_band',
    cast:[],
    props:[
     {kind:'stage_riser',pos:[0,0,-0.4]},
     {kind:'co2_jet',pos:[-3.2,0,1.6]},
     {kind:'co2_jet',pos:[ 3.2,0,1.6]}
    ]
   },
   {
    id:'edm_festival',
    label:'🎧 EDM DJ Festival Drop',
    sub:'DJ + 4 Vũ công LED/Laser + Booth & Vòng Kinetic',
    desc:'Dàn dựng đại nhạc hội EDM với bàn DJ Booth LED, vòng Kinetic treo trần, 2 cột khói CO2 & đội vũ công.',
    act:'dj_festival',
    cast:[],
    props:[
     {kind:'dj_booth',pos:[0,0,-0.2]},
     {kind:'kinetic_ring',pos:[0,0,0.4]},
     {kind:'co2_jet',pos:[-2.8,0,1.5]},
     {kind:'co2_jet',pos:[ 2.8,0,1.5]}
    ]
   },
   {
    id:'royal_fan_drum',
    label:'🪭 Múa Quạt Lụa & Trống Nước',
    sub:'6 Vũ công quạt 9 nan + 2 Trống nước + Cổng LED',
    desc:'Tiết mục mở màn truyền thống kết hợp hiện đại với đội múa quạt lụa 9 nan, 2 trống nước LED & cổng vòm.',
    act:'fan_dance',
    cast:[
     {type:'waterdrummer',pos:[-2.6,0,1.25]},
     {type:'waterdrummer',pos:[ 2.6,0,1.25]}
    ],
    props:[
     {kind:'led_arch_gate',pos:[0,0,-1.1]}
    ]
   },
   {
    id:'gala_keynote',
    label:'🎤 Lễ Khai mạc & Keynote VIP',
    sub:'MC Diễn giả + Bục Cầu LED + Vũ đoàn & Khán giả',
    desc:'Dàn dựng lễ khai mạc / hội nghị VIP gồm MC, bục phát biểu chạm cầu LED, vũ đoàn chào mừng & cụm khán giả.',
    act:'opening_gala',
    cast:[
     {type:'audience',pos:[0,0,3.4]}
    ],
    props:[
     {kind:'vip_podium',pos:[0,0,1.15]},
     {kind:'totem_led',pos:[-3.4,0,0.6]},
     {kind:'totem_led',pos:[ 3.4,0,0.6]}
    ]
   },
   {
    id:'hiphop_cypher',
    label:'🔥 Rap / Hip-Hop Catwalk Show',
    sub:'Rapper + DJ + Saxophone + Vũ công LED + Sàn chữ T',
    desc:'Sân khấu Rap / Hip-Hop với sàn Catwalk chữ T vươn ra khán giả, Rapper chính, DJ, Saxophone & vũ công LED.',
    act:null,
    cast:[
     {type:'rapper',pos:[0,0,1.85]},
     {type:'dj',pos:[0,0,-0.55]},
     {type:'saxophonist',pos:[-1.65,0,0.65]},
     {type:'leddancer',pos:[-1.35,0,1.45]},
     {type:'leddancer',pos:[ 1.35,0,1.45]}
    ],
    props:[
     {kind:'catwalk_runway',pos:[0,0,1.35]},
     {kind:'sub_stack',pos:[-3.2,0,0.8]},
     {kind:'sub_stack',pos:[ 3.2,0,0.8]}
    ]
   }
  ];

  function applyQuickCastExample16(presetId){
   const ex=QUICK_EXAMPLES16.find(x=>x.id===presetId);
   if(!ex)return null;
   checkpoint();
   const b=engine.stageBounds||{min:[-9,0,-4],max:[9,7,4]};
   const floorY=Math.max(0,b.min?.[1]||0);
   if(ex.act && S.addAct8){
    S.addAct8(ex.act,{pos:[0,floorY,0.35]});
   }
   for(const c of ex.cast||[]){
    const meta=PERFORMER_META16[c.type]||PERFORMER_META16.singer;
    S.addPerson?.(c.type,{
     pos:[c.pos[0],floorY+(c.pos[1]||0),c.pos[2]],
     color:meta.color,
     height:1.75
    });
   }
   for(const pr of ex.props||[]){
    if(A.items.length<64 && CATALOG[pr.kind]){
     const spec=CATALOG[pr.kind];
     const count=A.items.filter(x=>x.kind===pr.kind).length+1;
     const item={
      id:'AST16_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),
      kind:pr.kind,
      name:spec.name+' #'+count,
      pos:[pr.pos[0],floorY+(pr.pos[1]||0),pr.pos[2]],
      yaw:0,
      scale:1,
      color:spec.color
     };
     A.items.push(item);
     A.selected=item.id;
     syncItemMeshes(item);
    }
   }
   S.rebuildCast?.();
   S.rebuildActCache?.();
   S.renderCastManager?.();
   engine.view='stage';
   if(A.isOpen)paint();
   toast('Đã dàn dựng mẫu 3D: '+ex.label);
   return ex;
  }

  function paint(){
   setClass16(document.body,'v16-asset-open',!!A.isOpen);
   const topBtn=$('v16AssetBtn');
   if(topBtn)setClass16(topBtn,'active',!!A.isOpen);
   if(!A.isOpen){panel.hidden=true;return;}
   panel.hidden=false;
   const it=currentItem();
   if(it && CATALOG[it.kind])A.previewKind=it.kind;
   const prevKind=CATALOG[A.previewKind]?A.previewKind:'truss_tower';
   const prevSpec=CATALOG[prevKind];
   const wReport=A.tab==='tools'?computeWindSafety():null;
   let bodyHtml='';
   if(A.tab==='catalog'){
    bodyHtml=`
     <section class="v16-section">
      <h4>XEM TRƯỚC 3D TRỰC QUAN (KÉO ĐỂ XOAY 360°)</h4>
      <div class="v16-live-preview">
       <canvas id="v16PropLiveCanvas" width="320" height="240" title="Kéo chuột để xoay mô hình đạo cụ 3D"></canvas>
       <div class="v16-live-meta">
        <strong id="v16PropLiveTitle">${esc16(prevSpec.name)}</strong>
        <small id="v16PropLiveDesc">${esc16(prevSpec.cat)} · ${esc16(prevSpec.desc||prevSpec.label)}</small>
        <div class="v16-grid">
         <button data-add16="${esc16(prevKind)}" id="v16PropLiveAddBtn" class="btn small primary">+ Đặt vào sân khấu</button>
         <button data-act16="importLocalGlb" id="v16ImportLocalGlbBtn" class="btn small" title="Nạp thêm đạo cụ .GLB (và .asset.json) từ máy vào sân khấu đang mở, bảo toàn kích thước mét & gốc mount-point">📂 Nhập .GLB</button>
         <button data-act16="openCast" class="btn small">🕺 Người 3D</button>
        </div>
       </div>
      </div>
     </section>
     <section class="v16-section">
      <h4>MẪU DÀN DỰNG SÂN KHẤU NHANH (1-CLICK EXAMPLES)</h4>
      <div class="v16-example-bar compact">
       ${QUICK_EXAMPLES16.map(ex=>`<button type="button" data-qex16="${esc16(ex.id)}" class="v16-example-chip" title="${esc16(ex.desc)}"><b>${esc16(ex.label)}</b><small>${esc16(ex.sub)}</small></button>`).join('')}
      </div>
     </section>
     <section class="v16-section">
      <h4>THƯ VIỆN ĐẠO CỤ & KẾT CẤU SÂN KHẤU 3D (OFFLINE · ${Object.keys(CATALOG).length} MẪU)</h4>
      <div class="v16-catgrid">
       ${Object.entries(CATALOG).map(([k,v])=>`
        <button data-add16="${k}" data-prev16="${k}" class="v16-catcard ${k===prevKind?'active':''}">
         <span class="v16-catthumb"><img src="${getAssetPreviewURL16(k)}" alt="${esc16(v.name)}" loading="lazy"></span>
         <span class="v16-cathead"><i class="v16-dot" style="background:${esc16(v.color)}"></i><b>+ ${esc16(v.label)}</b></span>
         <small>${esc16(v.name)}</small>
        </button>`).join('')}
      </div>
     </section>
     <section class="v16-section">
      <h4>ASSET ĐÃ ĐẶT TRÊN SÂN KHẤU (${A.items.length} / 64)</h4>
      <div class="v16-chips">
       ${A.items.map(x=>`<button data-sel16="${esc16(x.id)}" class="btn small ${x.id===A.selected?'primary':''}">${esc16(x.name)}</button>`).join('')||'<p class="v16-empty">Chưa có đạo cụ phụ. Chọn một hạng mục ở trên để đặt vào sân khấu 3D.</p>'}
      </div>
     </section>
     ${it?`
      <section class="v16-section">
       <div class="v16-row-between">
        <h4>CHỈNH SỬA: ${esc16(it.name)}</h4>
        <button data-act16="place" class="btn small ${A.placeMode?'primary':''}">⌖ Click đặt trên 3D</button>
       </div>
       <div class="v16-grid thirds">
        <label>X (m)<input data-f16="pos0" type="number" step="0.1" value="${it.pos[0]}"></label>
        <label>Y (m)<input data-f16="pos1" type="number" step="0.1" value="${it.pos[1]}"></label>
        <label>Z (m)<input data-f16="pos2" type="number" step="0.1" value="${it.pos[2]}"></label>
       </div>
       <div class="v16-grid thirds">
        <label>Xoay Yaw (°)<input data-f16="yaw" type="number" step="5" value="${it.yaw||0}"></label>
        <label>Tỷ lệ Scale<input data-f16="scale" type="number" min="0.2" max="5" step="0.1" value="${it.scale||1}"></label>
        <label>Màu sắc<input data-f16="color" type="color" value="${esc16(it.color||'#8c9bb0')}"></label>
       </div>
       <div class="v16-grid">
        <button data-act16="focus" class="btn small">⌖ Focus Camera</button>
        <button data-act16="delete" class="btn small danger">✕ Xóa đạo cụ</button>
       </div>
      </section>`:''}
    `;
   }else if(A.tab==='search'){
    const qChips=[
     ['','★ Tất cả nổi bật'],
     ['loa','🔊 Loa / Audio'],
     ['đèn','💡 Đèn / Ánh sáng'],
     ['camera','🎥 Camera / TV'],
     ['ghế','🛋 Bàn ghế Talkshow'],
     ['cây','🌿 Cây cảnh'],
     ['animation','🐉 Nhân vật & Rồng 3D (GDrive)']
    ];
    bodyHtml=`
     <section class="v16-section">
      <h4>TÌM ASSET 3D &amp; MEDIA (CC0 / GOOGLE DRIVE DESIGN_MCP)</h4>
      <label>Nguồn dữ liệu mở
       <select id="v16SearchSource">
        <option value="polyhaven_models" ${A.searchSource==='polyhaven_models'?'selected':''}>Poly Haven — Mô hình 3D Đạo cụ / Nội thất (CC0)</option>
        <option value="gdrive_models" ${A.searchSource==='gdrive_models'?'selected':''}>Google Drive Design_MCP — ${GDRIVE_ASSETS16.length} Model GLB 3D &amp; Animation</option>
        <option value="polyhaven_textures" ${A.searchSource==='polyhaven_textures'?'selected':''}>Poly Haven — Texture / Phông nền Sân khấu (CC0)</option>
        <option value="wikimedia_images" ${A.searchSource==='wikimedia_images'?'selected':''}>Wikimedia Commons — Ảnh / Visual Sân khấu (CC0 / CC-BY)</option>
       </select>
      </label>
      <div class="v16-searchbar">
       <input id="v16SearchInput" type="text" value="${esc16(A.searchQuery)}" placeholder="Gõ tiếng Việt/Anh (tự dịch VI→EN): thùng phi, hàng rào, thảm, đèn...">
       <button data-act16="search" class="btn primary small" ${A.searching?'disabled':''}>${A.searching?'Đang tìm...':'Tìm CC0'}</button>
      </div>
      ${A.translatedHint?`<div class="v16-note" style="margin-bottom:6px;padding:4px 8px;font-size:11px;color:var(--accent-primary)">🌐 Tự động dịch VI → EN: <b>${esc16(A.translatedHint)}</b></div>`:''}
      <div class="v16-chips" style="margin-bottom:6px">
       ${qChips.map(([val,lbl])=>`<button type="button" data-qsearch16="${esc16(val)}" class="btn small ${A.searchQuery===val?'primary':''}">${esc16(lbl)}</button>`).join('')}
      </div>
      <div class="v16-status">${esc16(A.searchStatus)}</div>
      <div class="v16-results">
       ${A.searchResults.map((r,idx)=>`
        <div class="v16-rescard">
         <div class="v16-thumb">
          <img src="${esc16(r.thumb)}" alt="${esc16(r.title)}" loading="lazy">
         </div>
         <strong title="${esc16(r.title)}">${esc16(r.title)}</strong>
         <small>${esc16(r.license)}${r.dims?' · '+esc16(r.dims):''}</small>
         <button data-import16="${idx}" class="btn small primary">+ ${(r.source==='polyhaven_model'||r.source==='gdrive_glb')?'Nạp 3D vào Stage':'Nạp làm Media LED'}</button>
        </div>`).join('')}
      </div>
     </section>
    `;
   }else{
    const sfOk=wReport.currentSF>=1.5;
    let measureInfo='Chưa chọn điểm đo. Bấm nút bên trên rồi click 2 điểm trên sân khấu 3D.';
    if(A.measurePts.length===1)measureInfo=`Điểm 1: [${A.measurePts[0].map(v=>v.toFixed(2)).join(', ')}] m — Hãy click điểm 2 trên 3D.`;
    else if(A.measurePts.length===2){
     const d=M.sub(A.measurePts[1],A.measurePts[0]);
     measureInfo=`Khoảng cách: <b>${Math.hypot(...d).toFixed(2)} m</b> (ΔX ${Math.abs(d[0]).toFixed(2)}m · ΔY ${Math.abs(d[1]).toFixed(2)}m · ΔZ ${Math.abs(d[2]).toFixed(2)}m)`;
    }
    bodyHtml=`
     <section class="v16-section">
      <h4>THƯỚC ĐO 3D & VIỀN KỸ THUẬT CREASE 28°</h4>
      <div class="v16-grid thirds">
       <button data-act16="toggleMeasure" class="btn small ${A.measureMode?'primary':''}">⌖ ${A.measureMode?'Đang Đo 3D':'Đo 2 điểm 3D'}</button>
       <button data-act16="clearMeasure" class="btn small">Xóa mốc đo</button>
       <button data-act16="toggleCrease" class="btn small ${A.creaseEnabled?'primary':''}">◫ Viền 28°</button>
      </div>
      <div class="v16-note">${measureInfo}</div>
     </section>
     <section class="v16-section">
      <h4>TẢI TRỌNG GIÓ, CHỐNG LẬT & CHỐNG TRƯỢT (TCVN 2737:2023)</h4>
      <div class="v16-grid">
       <label>Vận tốc gió V (m/s)<input data-w16="speed" type="number" min="0" max="50" step="1" value="${wReport.V}"></label>
       <label>Hệ số cản Cd<input data-w16="cd" type="number" min="0.5" max="2.0" step="0.05" value="${wReport.cd}"></label>
       <label>Sâu chân đế B (m)<input data-w16="baseDepth" type="number" min="0.4" max="6" step="0.1" value="${wReport.baseDepth}"></label>
       <label>Tự trọng (kg/m²)<input data-w16="selfKgPerM2" type="number" min="15" max="120" step="1" value="${wReport.selfKg}"></label>
       <label>Hệ số ma sát μ<input data-w16="mu" type="number" min="0.1" max="1.2" step="0.05" value="${wReport.mu}"></label>
      </div>
      <div class="v16-windbox ${sfOk?'ok':'warn'}">
       <div>Tổng diện tích LED đón gió: <b>${wReport.totalArea.toFixed(1)} m²</b> · Áp lực q: <b>${wReport.q.toFixed(0)} N/m²</b></div>
       <div>Lực đẩy ngang F: <b>${(wReport.totalForce/1000).toFixed(2)} kN</b> · Mô-men lật: <b>${(wReport.overturnMoment/1000).toFixed(2)} kN·m</b></div>
       <div>SF tổng hợp: <b>${wReport.currentSF.toFixed(2)}</b> (Lật: <b>${wReport.overturnSF.toFixed(2)}</b> · Trượt: <b>${wReport.slidingSF.toFixed(2)}</b> · Chuẩn ≥ 1.50)</div>
       <div class="v16-ballast">Đối trọng (Ballast) cần dằn thêm: <b>${wReport.ballastKg.toLocaleString('en-US')} kg</b> (Lật: ${wReport.overturnBallastKg.toLocaleString('en-US')} kg · Trượt: ${wReport.slidingBallastKg.toLocaleString('en-US')} kg)</div>
      </div>
     </section>
    `;
   }

   panel.innerHTML=`
    <div class="v16-head">
     <div>
      <strong>❖ ĐẠO CỤ 3D · TÌM CC0 · ĐO & TẢI GIÓ</strong>
      <small>Thư viện Sân khấu V1.1 · Poly Haven & Wikimedia · TCVN 2737</small>
     </div>
     <button data-act16="close" class="btn small" title="Quay lại Inspector">← Đóng</button>
    </div>
    <div class="v16-tabs" role="tablist" aria-label="Phân nhóm Thư viện Đạo cụ">
     <button role="tab" aria-selected="${A.tab==='catalog'}" data-tab16="catalog" class="${A.tab==='catalog'?'active':''}">Đạo cụ 3D</button>
     <button role="tab" aria-selected="${A.tab==='search'}" data-tab16="search" class="${A.tab==='search'?'active':''}">Tìm Asset CC0</button>
     <button role="tab" aria-selected="${A.tab==='tools'}" data-tab16="tools" class="${A.tab==='tools'?'active':''}">Đo 3D & Gió</button>
    </div>
    <div class="v16-content">${bodyHtml}</div>
   `;
   if(A.tab==='catalog')bindPropLiveCanvas16();
  }

  panel.addEventListener('pointerover',e=>{
   const card=e.target.closest('button[data-prev16]');
   if(!card)return;
   const k=card.dataset.prev16;
   if(k && CATALOG[k] && A.previewKind!==k){
    A.previewKind=k;
    const spec=CATALOG[k];
    const tEl=$('v16PropLiveTitle'), dEl=$('v16PropLiveDesc'), bEl=$('v16PropLiveAddBtn');
    if(tEl)tEl.textContent=spec.name;
    if(dEl)dEl.textContent=spec.cat+' · '+(spec.desc||spec.label);
    if(bEl)bEl.dataset.add16=k;
    panel.querySelectorAll('.v16-catcard[data-prev16]').forEach(c=>c.classList.toggle('active',c.dataset.prev16===k));
    updatePropLivePreview16();
   }
  });

  panel.addEventListener('click',e=>{
   const b=e.target.closest('button');
   if(!b)return;
   if(b.dataset.tab16){
    A.tab=b.dataset.tab16;
    paint();
    if(A.tab==='search' && !A.searchResults.length && !A.searching)runOnlineSearch();
    return;
   }
   if(b.dataset.qsearch16!==undefined){
    const qVal=b.dataset.qsearch16;
    A.searchQuery=qVal;
    if(qVal==='animation')A.searchSource='gdrive_models';
    runOnlineSearch();
    return;
   }
   if(b.dataset.add16){A.previewKind=b.dataset.add16;addCatalogItem(b.dataset.add16);return;}
   if(b.dataset.qex16){applyQuickCastExample16(b.dataset.qex16);return;}
   if(b.dataset.sel16){A.selected=b.dataset.sel16;paint();return;}
   if(b.dataset.import16!==undefined){importOnlineResult(+b.dataset.import16);return;}
   const act=b.dataset.act16;
   if(act==='close'){close();}
   else if(act==='openCast'){openCastLibrary16();}
   else if(act==='importLocalGlb'){openLocalGlbFilePicker16();}
   else if(act==='place'){A.placeMode=!A.placeMode;if(A.placeMode)toast('Click lên mặt sàn/sân khấu 3D để đặt vị trí cho asset.');paint();}
   else if(act==='delete'){const it=currentItem();if(it)deleteItem(it.id);}
   else if(act==='focus'){const it=currentItem();if(it){engine.view='stage';engine.camera.target=[...it.pos];engine.camera.distance=Math.max(4,engine.camera.distance*.65);}}
   else if(act==='search'){
    const inp=$('v16SearchInput'), src=$('v16SearchSource');
    if(inp)A.searchQuery=inp.value;
    if(src)A.searchSource=src.value;
    runOnlineSearch();
   }else if(act==='toggleMeasure'){
    A.measureMode=!A.measureMode;
    if(A.measureMode){A.placeMode=false;toast('Chế độ Đo 3D: Click 2 điểm bất kỳ trên sân khấu 3D để đo khoảng cách.');}
    paint();
   }else if(act==='clearMeasure'){
    A.measurePts=[];paint();
   }else if(act==='toggleCrease'){
    A.creaseEnabled=!A.creaseEnabled;paint();
   }
  });

  panel.addEventListener('input',e=>{
   if(e.target?.id==='v16SearchInput')A.searchQuery=e.target.value;
  });

  panel.addEventListener('change',e=>{
   const el=e.target;
   if(el.id==='v16SearchSource'){A.searchSource=el.value;runOnlineSearch();return;}
   if(el.id==='v16SearchInput'){A.searchQuery=el.value;return;}
   const f=el.dataset.f16;
   if(f){
    const it=currentItem();if(!it)return;
    checkpoint();
    if(f==='pos0')it.pos[0]=clamp16(+el.value,-500,500);
    else if(f==='pos1')it.pos[1]=clamp16(+el.value,-500,500);
    else if(f==='pos2')it.pos[2]=clamp16(+el.value,-500,500);
    else if(f==='yaw')it.yaw=clamp16(+el.value,-360,360);
    else if(f==='scale')it.scale=clamp16(+el.value,.1,10);
    else if(f==='color'&&/^#[0-9a-f]{6}$/i.test(el.value))it.color=el.value;
    syncItemMeshes(it);
    paint();
   }
   const w=el.dataset.w16;
   if(w){
    A.wind[w]=+el.value;
    paint();
   }
  });

  panel.addEventListener('keydown',e=>{
   if(e.key==='Enter' && e.target.id==='v16SearchInput'){
    A.searchQuery=e.target.value;
    runOnlineSearch();
   }
  });

  // Persistence in .ledstudio & undo/redo stack
  function serializeAssets(){
   return {
    v:1,
    items:A.items.map(x=>({
     id:x.id,
     kind:x.kind,
     name:x.name,
     pos:[...x.pos],
     yaw:x.yaw||0,
     scale:x.scale||1,
     color:x.color
    }))
   };
  }

  function restoreAssets(saved){
   const list=[];
   const seen=new Set();
   for(const q of (Array.isArray(saved?.items)?saved.items:[]).slice(0,64)){
    if(!q || !CATALOG[q.kind] || !Array.isArray(q.pos) || q.pos.length!==3 || !q.pos.every(Number.isFinite))continue;
    const id=/^[A-Za-z0-9_-]{1,80}$/.test(String(q.id||''))?String(q.id):('AST16_'+list.length);
    if(seen.has(id))continue;
    seen.add(id);
    list.push({
     id,
     kind:q.kind,
     name:String(q.name||CATALOG[q.kind].name).slice(0,64),
     pos:q.pos.map(v=>clamp16(+v,-500,500)),
     yaw:clamp16(q.yaw??0,-360,360),
     scale:clamp16(q.scale??1,.1,10),
     color:/^#[0-9a-f]{6}$/i.test(q.color)?q.color:CATALOG[q.kind].color
    });
   }
   A.items=list;
   A.selected=list[0]?.id||null;
   rebuildAllAssetMeshes();
   if(A.isOpen)paint();
  }

  const oldPack=packLiveExtras, oldRestore=restoreLiveExtras, oldSnap=snapshot, oldResSnap=restore;
  packLiveExtras=async function(){const out=await oldPack();out.stageAssets16=serializeAssets();return out;};
  restoreLiveExtras=async function(data){await oldRestore(data);restoreAssets(data?.stageAssets16);};
  snapshot=function(){const out=oldSnap();out.stageAssets16=serializeAssets();return out;};
  restore=function(data){oldResSnap(data);restoreAssets(data?.stageAssets16);};
  S.snapshot=(...args)=>snapshot(...args);
  S.restore=(...args)=>restore(...args);

   const oldImport=importModel, oldDemo=demo;
   importModel=async function(...args){const prev=state.model,res=await oldImport(...args);if(state.model!==prev){A.items=[];A.selected=null;A.meshMap.clear();A.fixtureRigs16.clear();if(A.isOpen)paint();}return res;};
   demo=function(...args){const prev=state.model,res=oldDemo(...args);if(state.model!==prev){A.items=[];A.selected=null;A.meshMap.clear();A.fixtureRigs16.clear();if(A.isOpen)paint();}return res;};
  S.importModel=importModel;
  S.demo=demo;

  function open(tab=A.tab){
   if(state.presenting){toast('Thoát Trình diễn để mở Thư viện Đạo cụ & Đo 3D.');return;}
   closeAllDocks16('v16Asset');
   A.tab=tab;
   A.isOpen=true;
   if(window.innerWidth<980&&!document.body.classList.contains('drawer-right')){
    document.body.classList.add('drawer-right');
    A._openedDrawer=true;
   }
   paint();
   if(A.tab==='search' && !A.searchResults.length && !A.searching)runOnlineSearch();
  }
  function close(){
   A.isOpen=false;
   A.placeMode=false;
   A.measureMode=false;
   if(A._openedDrawer){document.body.classList.remove('drawer-right');A._openedDrawer=false;}
   paint();
  }
  Object.assign(A,{
   open,close,addCatalogItem,deleteItem,computeWindSafety,computeCreaseEdges,runOnlineSearch,
   commitImportedMeshesToStage16,importLocalGlbProp,openLocalGlbFilePicker16,
   resolveOflFixture16,setFixturePanTilt:setFixturePanTilt16,GDRIVE_ASSETS16,
   expandSearchTerms16,translateViToEn16,
   serialize:serializeAssets,restore:restoreAssets,
   getAssetPreviewURL16,getPerformerPreviewURL16,getActPreviewURL16,renderMeshes3DToCanvas16,
   applyQuickCastExample16,QUICK_EXAMPLES16
  });

  // ============================================================================
  // INTERACTIVE 3D CAST PERFORMER & STAGE ACT LIBRARY (openCastLibrary16)
  // Card grid (examples / roles / acts) + pinned sidebar with a still preview, pose/costume form and "+ Thêm"
  // ============================================================================
  // Right sidebar previews the selected card; nothing reaches the stage until its "+ Thêm" button is pressed.
  // A single performer is a live, draggable 3D render; groups (acts, quick examples, the 24-person crowd)
  // are too heavy for the software rasterizer, so they show their queueThumb16 still instead.
  function castSelection16(){
   if(A.castPreviewKind==='act'&&S.ACT_TYPES?.[A.castPreviewAct])return {kind:'act',id:A.castPreviewAct};
   if(A.castPreviewKind==='qex'&&QUICK_EXAMPLES16.some(x=>x.id===A.castPreviewQex))return {kind:'qex',id:A.castPreviewQex};
   return {kind:'role',id:A.castPreviewType};
  }
  const castIsLive16=sel=>sel.kind==='role'&&sel.id!=='audience';

  function castPreviewSrc16(){
   const sel=castSelection16();
   if(sel.kind==='act')return getActPreviewURL16(sel.id);
   if(sel.kind==='qex')return getQuickExamplePreviewURL16(sel.id);
   return getPerformerPreviewURL16(sel.id);
  }

  let castLiveRAF16=0, castLiveLast16=0;
  function stopCastLiveLoop16(){
   if(castLiveRAF16){cancelAnimationFrame(castLiveRAF16);castLiveRAF16=0;}
  }
  function renderCastLiveFrame16(nowMs=0){
   const cvs=$('v16CastLiveCanvas'), modal=$('modal'), sel=castSelection16();
   if(!cvs||!modal?.open||!castIsLive16(sel)){castLiveRAF16=0;return;}
   const now=nowMs||performance.now();
   // ~25-30 ms per frame in the software rasterizer: animate at ~20 fps so the dialog stays responsive
   if(!castLiveRAF16||now-castLiveLast16>=48){
    castLiveLast16=now;
    const type=sel.id, meta=PERFORMER_META16[type]||PERFORMER_META16.singer, tSec=now*0.001, h=A.castPreviewHeight||1.75;
    if(!cvs._dragging16)A.castPreviewYaw=0.28+Math.sin(tSec*0.72)*0.44;
    renderMeshes3DToCanvas16(cvs,buildPerformerPreviewEntries16(type,{action:A.castPreviewAction,color:A.castPreviewColor||meta.color,height:h,time:tSec}),{
     yaw:A.castPreviewYaw,pitch:0.16,zoom:1.74,noURL:true,
     fixedBounds:getPerformerFixedBounds16(type,h),
     title:S.castNames?.[type]||type,subtitle:meta.tag,accent:A.castPreviewColor||meta.color,badge:meta.tag
    });
   }
   castLiveRAF16=requestAnimationFrame(renderCastLiveFrame16);
  }

  function syncCastSidebar16(){
   const sel=castSelection16();
   const set=(id,fn)=>{const el=$(id);if(el)fn(el);};
   let eyebrow,title,desc,addLabel;
   if(sel.kind==='act'){
    const spec=S.ACT_TYPES[sel.id];
    const members=actMembers16(sel.id);
    const counts={};
    for(const m of members)counts[m.role]=(counts[m.role]||0)+1;
    const roster=Object.entries(counts).map(([r,n])=>(n>1?n+'× ':'')+(S.castNames?.[r]||r)).join(' · ');
    eyebrow='XEM TRƯỚC ĐỘI HÌNH TIẾT MỤC 3D';
    title=`${spec.name} (${spec.tag})`;
    desc=members.length?`${members.length} người: ${roster}. Thêm cả đội hình vào sân khấu như một tiết mục.`:'Khoảnh khắc sân khấu (không kèm người biểu diễn).';
    addLabel=`+ Thêm đội hình "${spec.name}" vào sân khấu`;
   }else if(sel.kind==='qex'){
    const ex=QUICK_EXAMPLES16.find(x=>x.id===sel.id);
    const parts=[];
    if(ex.act&&S.ACT_TYPES?.[ex.act])parts.push(`Đội hình ${S.ACT_TYPES[ex.act].name} (${actMembers16(ex.act).length} người)`);
    for(const c of ex.cast||[])parts.push(S.castNames?.[c.type]||c.type);
    for(const pr of ex.props||[])parts.push(CATALOG[pr.kind]?.name||pr.kind);
    const tally={};
    for(const p of parts)tally[p]=(tally[p]||0)+1;
    eyebrow='XEM TRƯỚC MẪU DÀN DỰNG SÂN KHẤU';
    title=ex.label;
    desc=`${ex.desc} Gồm: ${Object.entries(tally).map(([p,n])=>(n>1?n+'× ':'')+p).join(' · ')}.`;
    addLabel='+ Áp dụng mẫu này vào sân khấu';
   }else{
    const meta=PERFORMER_META16[sel.id]||PERFORMER_META16.singer;
    const name=S.castNames?.[sel.id]||sel.id;
    eyebrow='XEM TRƯỚC MÔ HÌNH NHÂN VẬT 3D & ĐẠO CỤ CẦM TAY';
    title=`${name} (${meta.tag})`;
    desc=meta.desc;
    addLabel=`+ Thêm "${name}" vào sân khấu`;
    set('v16CastColorInp',el=>{el.value=A.castPreviewColor;});
   }
   const live=castIsLive16(sel);
   set('v16CastLiveCanvas',el=>{el.hidden=!live;});
   set('v16CastHint',el=>{el.hidden=!live;});
   set('v16CastPreviewImg',el=>{el.hidden=live;if(live)return;const src=castPreviewSrc16();prioritizeThumb16(src);el.src=src;el.alt=title;});
   if(live){if(!castLiveRAF16)renderCastLiveFrame16(performance.now());}else stopCastLiveLoop16();
   set('v16CastStageEyebrow',el=>{el.textContent=eyebrow;});
   set('v16CastStageTitle',el=>{el.textContent=title;});
   set('v16CastStageDesc',el=>{el.textContent=desc;});
   set('v16CastAddBtn',el=>{el.textContent=addLabel;});
   // crowd uses its own colour palette & static pose; acts/examples have no per-person form
   set('v16CastForm',el=>{el.hidden=sel.kind!=='role'||sel.id==='audience';});
   set('v16CastPlaceNewBtn',el=>{el.hidden=sel.kind!=='role';});
   const key=sel.kind+':'+sel.id;
   document.querySelectorAll('#modalBody [data-cast-pick16]').forEach(c=>{
    const on=c.dataset.castPick16===key;
    c.classList.toggle('active',on);
    c.setAttribute('aria-pressed',on?'true':'false');
   });
  }

  function selectCastItem16(kind,id){
   if(kind==='act'){
    if(!S.ACT_TYPES?.[id])return;
    A.castPreviewAct=id;
   }else if(kind==='qex'){
    if(!QUICK_EXAMPLES16.some(x=>x.id===id))return;
    A.castPreviewQex=id;
   }else{
    if(!S.castNames?.[id])return;
    kind='role';
    A.castPreviewType=id;
    A.castPreviewColor=(PERFORMER_META16[id]||PERFORMER_META16.singer).color;
   }
   A.castPreviewKind=kind;
   syncCastSidebar16();
  }

  function openCastLibrary16(){
   stopCastLiveLoop16();
   const roles=Object.entries(S.castNames||{});
   if(!S.castNames?.[A.castPreviewType])A.castPreviewType=roles[0]?.[0]||'singer';
   A.castPreviewColor=(PERFORMER_META16[A.castPreviewType]||PERFORMER_META16.singer).color;
   const poseOpts=[
    ['auto','Động tác mặc định theo vai'],
    ['fan','Múa quạt / lụa 9 nan (Fan)'],
    ['wave','Sóng tay (Wave)'],
    ['spin','Xoay 360° (Spin)'],
    ['dance','Nhảy theo nhịp (Dance)'],
    ['reach','Vươn tay cao (Reach)'],
    ['kneel','Quỳ biểu cảm (Kneel)'],
    ['finale','Tư thế kết màn (Hero Finale)'],
    ['drum','Đánh trống (Drum)'],
    ['hold','Đứng yên (Hold)']
   ];
   const actEntries=Object.entries(S.ACT_TYPES||{});

   dialog('CAST / Thư viện Người 3D & Tiết mục Sân khấu',`
    <div class="v16-cast-layout">
     <div class="v16-cast-library">
      <div class="v16-example-section">
       <span class="v16-example-title">✨ Mẫu Dàn dựng Sân khấu &amp; Tiết mục Nhanh</span>
       <div class="v16-example-bar">
        ${QUICK_EXAMPLES16.map(ex=>`
         <button type="button" class="v16-example-chip" data-cast-pick16="qex:${esc16(ex.id)}" aria-pressed="false" title="${esc16(ex.desc)}">
          <b>${esc16(ex.label)}</b>
          <small>${esc16(ex.sub)}</small>
         </button>`).join('')}
       </div>
      </div>
      <div class="cast-add v16-cast-grid">
       ${roles.map(([id,name])=>{
        const m=PERFORMER_META16[id]||{tag:'STAGE CAST 3D',color:'#38bdf8'};
        return `<button type="button" class="cast-card v16-cast-card" data-cast-pick16="role:${esc16(id)}" aria-pressed="false">
         <div class="v16-cast-thumb"><img src="${esc16(getPerformerPreviewURL16(id))}" alt="${esc16(name)}" decoding="async"></div>
         <span>${esc16(m.tag)}</span>
         <div class="v16-cast-card-foot"><b>${esc16(name)}</b></div>
        </button>`;
       }).join('')}
      </div>
      ${actEntries.length?`
       <details open style="margin-bottom:10px">
        <summary style="cursor:pointer;font-size:11px;font-weight:700;color:var(--accent-primary);margin-bottom:6px">▸ Cụm Tiết mục 3D theo đội hình (${actEntries.length} đội hình mẫu)</summary>
        <div class="dir-act-grid" style="margin-top:6px">
         ${actEntries.map(([id,s])=>`
          <button type="button" data-cast-pick16="act:${esc16(id)}" aria-pressed="false">
           <img class="v16-act-thumb" src="${esc16(getActPreviewURL16(id))}" alt="${esc16(s.name)}" decoding="async" loading="lazy">
           <small>${esc16(s.tag)}</small>
           <strong>${esc16(s.name)}</strong>
           <span>XEM TRƯỚC ĐỘI HÌNH</span>
          </button>`).join('')}
        </div>
       </details>`:''}
      <div class="seq-tools" style="margin-bottom:10px">
       <label><input id="castAnimate" type="checkbox" ${S.seq?.animate?'checked':''}>Chuyển động theo beat</label>
       <button class="btn" id="frameCast">Toàn cảnh + người</button>
       <button class="btn" id="exportCast">Xuất GLB tư thế hiện tại</button>
      </div>
      <div id="castRows"></div>
      <p class="hint-text">Bấm vào mẫu, nhân vật hoặc đội hình để xem trước ở khung bên phải; chỉ nút "+ Thêm" trong khung đó mới đưa lên sân khấu.</p>
     </div>
     <aside class="v16-cast-stage" aria-label="Xem trước và thêm vào sân khấu">
      <div class="v16-cast-canvas-wrap">
       <canvas id="v16CastLiveCanvas" width="520" height="390" title="Kéo chuột trái/phải để xoay xem nhân vật 3D 360°"></canvas>
       <img id="v16CastPreviewImg" class="v16-cast-preview-img" alt="" hidden>
       <span class="v16-cast-canvas-hint" id="v16CastHint">🔄 Kéo trên khung 3D để xoay 360°</span>
      </div>
      <div class="v16-cast-controls">
       <span class="eyebrow" id="v16CastStageEyebrow"></span>
       <h4 id="v16CastStageTitle"></h4>
       <p id="v16CastStageDesc"></p>
       <div class="v16-cast-form" id="v16CastForm">
        <label>Động tác
         <select id="v16CastPoseSel">
          ${poseOpts.map(([k,lbl])=>`<option value="${k}" ${A.castPreviewAction===k?'selected':''}>${esc16(lbl)}</option>`).join('')}
         </select>
        </label>
        <label>Màu trang phục
         <input id="v16CastColorInp" type="color" value="${esc16(A.castPreviewColor)}">
        </label>
        <label>Chiều cao (m)
         <input id="v16CastHeightInp" type="number" min="1.3" max="2.2" step="0.05" value="${A.castPreviewHeight}">
        </label>
       </div>
       <div class="v16-cast-cta">
        <button type="button" class="btn primary" id="v16CastAddBtn"></button>
        <button type="button" class="btn" id="v16CastPlaceNewBtn">⌖ Thêm &amp; Click đặt lên sàn 3D</button>
       </div>
      </div>
     </aside>
    </div>
   `,[{label:'Đóng'}]);

   const modal=$('modal');
   modal?.classList.add('pro-wide','v16-cast-wide');
   modal?.addEventListener('close',()=>modal.classList.remove('v16-cast-wide'),{once:true});

   const cvs=$('v16CastLiveCanvas');
   if(cvs){
    let lastX=0;
    cvs.addEventListener('pointerdown',e=>{cvs._dragging16=true;lastX=e.clientX;try{cvs.setPointerCapture(e.pointerId);}catch(_){}});
    cvs.addEventListener('pointermove',e=>{
     if(!cvs._dragging16)return;
     A.castPreviewYaw+=(e.clientX-lastX)*0.018;
     lastX=e.clientX;
    });
    const endDrag=()=>{cvs._dragging16=false;};
    cvs.addEventListener('pointerup',endDrag);
    cvs.addEventListener('pointercancel',endDrag);
   }

   // The live loop reads these each frame
   $('v16CastPoseSel')?.addEventListener('change',e=>{A.castPreviewAction=e.target.value;});
   $('v16CastColorInp')?.addEventListener('input',e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value))A.castPreviewColor=e.target.value;});
   $('v16CastHeightInp')?.addEventListener('change',e=>{A.castPreviewHeight=clamp16(+e.target.value||1.75,1.2,2.4);});

   function addConfiguredPerson16(type,placeOnFloor=false){
    const meta=PERFORMER_META16[type]||PERFORMER_META16.singer;
    const p=S.addPerson?.(type,{
     color:(type===A.castPreviewType && /^#[0-9a-f]{6}$/i.test(A.castPreviewColor))?A.castPreviewColor:meta.color,
     height:clamp16(+($('v16CastHeightInp')?.value||A.castPreviewHeight||1.75),1.2,2.4)
    });
    if(p && A.castPreviewAction && A.castPreviewAction!=='auto'){
     p.previewAction16=A.castPreviewAction;
    }
    S.rebuildCast?.();
    S.renderCastManager?.();
    if(placeOnFloor && p && S.sq){
     S.sq.placePerson=p.id;
     $('modal')?.close();
     engine.view='stage';
     state.pickTask=null;
     const qh=$('quadHint');
     if(qh){qh.textContent='Click sàn để đặt '+p.name+'. Esc: hủy.';qh.classList.remove('hidden');}
    }
    return p;
   }

   $('v16CastAddBtn')?.addEventListener('click',()=>{
    const sel=castSelection16();
    if(sel.kind==='role'){addConfiguredPerson16(sel.id,false);return;}
    if(sel.kind==='qex'){applyQuickCastExample16(sel.id);S.renderCastManager?.();return;}
    const a=S.addAct8?.(sel.id);
    if(a){
     S.renderCastManager?.();
     toast('Đã thêm đội hình 3D: '+a.name);
    }
   });
   $('v16CastPlaceNewBtn')?.addEventListener('click',()=>addConfiguredPerson16(A.castPreviewType,true));

   document.querySelectorAll('#modalBody [data-cast-pick16]').forEach(btn=>{
    btn.onclick=()=>{
     const [kind,id]=btn.dataset.castPick16.split(':');
     selectCastItem16(kind,id);
    };
   });

   if($('castAnimate'))$('castAnimate').onchange=e=>{if(S.seq)S.seq.animate=e.target.checked;};
   if($('frameCast'))$('frameCast').onclick=()=>{S.frameCast?.();$('modal')?.close();};
   if($('exportCast'))$('exportCast').onclick=()=>S.exportCastGLB?.();
   S.renderCastManager?.();
   syncCastSidebar16();
  }

  S.openCastLibrary16=openCastLibrary16;
  S.openCastLibrary=openCastLibrary16;
  openThumbDisk16().then(()=>{
   setTimeout(()=>{
    for(const id of Object.keys(S.castNames||{})){
     const m=PERFORMER_META16[id]||PERFORMER_META16.singer;
     if(!A.previewCache.has('cast:'+id+':'+m.action))getPerformerPreviewURL16(id);
    }
   },900);
  }); // load persisted stills immediately & gently pre-warm missing role thumbnails in idle time
  const castBtnTop=$('v07Cast');
  if(castBtnTop)castBtnTop.onclick=openCastLibrary16;

  // Coordinate with other right-panel docks when they open
  if(S.fx141?.open){const baseFxOpen=S.fx141.open;S.fx141.open=function(...a){if(A.isOpen)close();return baseFxOpen.apply(this,a);};}
  if(S.matrix143?.open){const baseMxOpen=S.matrix143.open;S.matrix143.open=function(...a){if(A.isOpen)close();return baseMxOpen.apply(this,a);};}
  if(S.mount136?.open){const baseMtOpen=S.mount136.open;S.mount136.open=function(...a){if(A.isOpen)close();return baseMtOpen.apply(this,a);};}
  if(S.laserShow?.open){const baseLsOpen=S.laserShow.open;S.laserShow.open=function(...a){if(A.isOpen)close();return baseLsOpen.apply(this,a);};}

  // Blender 5.1.2 Workspace Architecture:
  // - Right Sidebar Split: Top Outliner (.left-panel) + Bottom Properties (.right-panel + vertical #v16PropRail)
  // - Floating Left Viewport Tool Shelf (#v16TShelf, toggle via 'T')
  // - Floating Right 3D Axis Gizmo & Camera Pills (#v16ViewportNav)
  // - Compact Viewport Header Dropdown Menus (#v16HeaderMenus + #v16MenuPopover)
  // - Collapsible Accordions for Outliner & Properties sections
  const PROP_TABS16=[
   {key:'inspector',icon:'🎛',label:'Inspector (Thông số đối tượng & Sân khấu)'},
   {key:'v16Asset',icon:'📦',label:'Đạo cụ 3D · Tìm CC0 · Đo 3D & Gió TCVN'},
   {key:'pro127',icon:'💡',label:'Fixture Desk DMX / OFL 16-bit'},
   {key:'matrix143',icon:'🎆',label:'LED Matrix Contour · 35 FX'},
   {key:'fx141',icon:'⚡',label:'Đa đèn FX Timecode (Par / Line / Laser Bar)'},
   {key:'laser135',icon:'🔦',label:'Laser Show ILDA (.ild)'},
   {key:'mount136',icon:'🧲',label:'Stage Mount (Gắn đèn 6 mặt khối)'},
   {key:'stageLift124',icon:'🏗',label:'Bàn nâng chữ X (Stage & Scissor Lift)'},
   {key:'m131',icon:'🕺',label:'Ghi tay Biên đạo 3D (Manual Choreo Take)'},
   {key:'l132',icon:'⏺',label:'Ghi tay Ánh sáng (Manual Light Take)'}
  ];

  const TSHELF_TOOLS16=[
   {key:'select',icon:'↖',title:'Chọn & Xoay khung nhìn 3D (Select / Orbit)'},
   {key:'move',icon:'✥',title:'Di chuyển đối tượng / cụm (Move)'},
   {key:'rotate',icon:'↻',title:'Xoay đối tượng / cụm (Rotate)'},
   {key:'quad',icon:'⬚',title:'Vẽ màn LED 4 góc trên model (+ 4 góc)'},
   {key:'measure',icon:'📏',title:'Thước đo khoảng cách 2 điểm 3D'},
   {key:'crease',icon:'◫',title:'Bật/tắt viền kỹ thuật Crease 28° (Wireframe)'},
   {key:'asset',icon:'📦',title:'Thêm Đạo cụ Sân khấu 3D & Tìm CC0'},
   {key:'lift',icon:'🏗',title:'Khoanh vùng Bàn nâng chữ X (Stage Lift)'},
   {key:'fixture',icon:'💡',title:'Bàn điều khiển Đèn DMX / Nhận diện đèn'},
   {key:'matrix',icon:'🎆',title:'Quét viền LED Matrix 35 FX'},
   {key:'laser',icon:'🔦',title:'Thiết kế & Đặt tia Laser ILDA'}
  ];

  function activeDockKey16(){
   const cl=document.body.classList;
   if(A.isOpen || cl.contains('v16-asset-open'))return 'v16Asset';
   if(cl.contains('matrix143-open'))return 'matrix143';
   if(cl.contains('fx141-open'))return 'fx141';
   if(cl.contains('laser135-open'))return 'laser135';
   if(cl.contains('mount136-open'))return 'mount136';
   if(cl.contains('lift-dock-open'))return 'stageLift124';
   if(cl.contains('m131-edit-open')||cl.contains('m131-open'))return 'm131';
   if(cl.contains('pro127-dock-open')){
    const l132=$('l132Panel');
    if(l132 && !l132.hidden && A._lastDock==='l132')return 'l132';
    return 'pro127';
   }
   return 'inspector';
  }

  function openDockByKey16(key){
   if(state.presenting){toast('Thoát chế độ Trình diễn để mở bảng công cụ.');return;}
   const cur=activeDockKey16();
   if(key==='inspector' || (cur===key && key!=='inspector')){
    closeAllDocks16('inspector');
    A._lastDock='inspector';
    syncBlenderState16();
    return;
   }
   A._lastDock=key;
   closeAllDocks16(key==='l132'?'pro127':key);
   if(key==='v16Asset')open('catalog');
   else if(key==='pro127'){
    const btn=document.querySelector('#pro127bar [data-pro127="fixture"]');
    if(btn)btn.click();else S.openProLights126?.();
   }else if(key==='matrix143'){
    if(S.matrix143?.open)S.matrix143.open();else $('matrix143OpenBtn')?.click();
   }else if(key==='fx141'){
    if(S.fx141?.open)S.fx141.open();else $('fx141OpenBtn')?.click();
   }else if(key==='laser135'){
    if(S.laserShow?.open)S.laserShow.open();else $('laser135TopBtn')?.click();
   }else if(key==='mount136'){
    if(S.mount136?.open)S.mount136.open();else $('mount136TopBtn')?.click();
   }else if(key==='stageLift124'){
    if(S.stageLift?.open)S.stageLift.open();else $('v124LiftBtn')?.click();
   }else if(key==='m131'){
    if(S.manual131?.open)S.manual131.open();else document.querySelector('.m131-launch')?.click();
   }else if(key==='l132'){
    if(S.lightTake132?.launch)S.lightTake132.launch();else $('l132Launch')?.click();
   }
   syncBlenderState16();
  }
  S.openDockByKey16=openDockByKey16;

  function triggerTShelfTool16(key){
   if(key==='select'){
    A.measureMode=false;A.placeMode=false;
    document.querySelector('#dirToolbar [data-tool-mode="navigate"]')?.click();
    paint();
   }else if(key==='move'){
    document.querySelector('#dirToolbar [data-tool-mode="move"]')?.click();
   }else if(key==='rotate'){
    document.querySelector('#dirToolbar [data-tool-mode="rotate"]')?.click();
   }else if(key==='quad'){
    $('drawQuad')?.click();
   }else if(key==='measure'){
    A.measureMode=!A.measureMode;
    if(A.measureMode){A.placeMode=false;toast('Thước đo 3D: Click 2 điểm bất kỳ trên sân khấu 3D để đo khoảng cách.');}
    paint();
   }else if(key==='crease'){
    A.creaseEnabled=!A.creaseEnabled;
    paint();
   }else if(key==='asset'){
    openDockByKey16('v16Asset');
   }else if(key==='lift'){
    openDockByKey16('stageLift124');
   }else if(key==='fixture'){
    openDockByKey16('pro127');
   }else if(key==='matrix'){
    openDockByKey16('matrix143');
   }else if(key==='laser'){
    openDockByKey16('laser135');
   }
   syncBlenderState16();
  }

  function buildMenuItems16(menuKey){
   if(menuKey==='view')return [
    {label:'⌖ Toàn cảnh sân khấu (Frame All)',kbd:'F',run:()=>$('overviewBtn')?.click()},
    {label:'🎥 Góc nhìn Chính diện (Front)',kbd:'1',run:()=>document.querySelector('#cameraBar [data-camera="front"]')?.click()},
    {label:'🎥 Góc nhìn Phối cảnh 3/4 (ISO)',kbd:'3',run:()=>document.querySelector('#cameraBar [data-camera="iso"]')?.click()},
    {label:'🎥 Góc nhìn Cạnh bên (Side)',kbd:'7',run:()=>document.querySelector('#cameraBar [data-camera="side"]')?.click()},
    {label:'🎥 Góc nhìn Từ trên xuống (Top)',kbd:'9',run:()=>document.querySelector('#cameraBar [data-camera="top"]')?.click()},
    {sep:true},
    {label:(engine?.cameraLocked?'🔒 Mở khóa góc Camera (Đang khóa)':'🔓 Khóa góc Camera'),kbd:'L',run:()=>$('lockCameraBtn')?.click()},
    {label:'◫ Viền kỹ thuật Crease 28° (Wireframe)',kbd:'',run:()=>{A.creaseEnabled=!A.creaseEnabled;paint();syncBlenderState16();}},
    {label:'🛠 Ẩn / Hiện thanh công cụ nổi 3D (Phím T)',kbd:'T',run:()=>toggleTShelf16()},
    {label:'📋 Ẩn / Hiện bảng hai bên (Chế độ Tập trung)',kbd:'N',run:()=>$('focusBtn')?.click()},
    {label:'☰ Bật / Tắt thanh công cụ ngang đầy đủ',kbd:'',run:()=>$('v16AllToolsBtn')?.click()}
   ];
   if(menuKey==='add')return [
    {label:'📥 Nhập mô hình sân khấu (.GLB / .DAE / .OBJ)',kbd:'',run:()=>$('importModel')?.click()},
    {label:'🏛 Nạp sân khấu mẫu (Demo Stage)',kbd:'',run:()=>$('demoBtn')?.click()},
    {label:'🎬 Thêm Video / Ảnh vào Thư viện Media',kbd:'',run:()=>$('addMedia')?.click()},
    {sep:true},
    ...Object.entries(CATALOG).map(([k,v])=>({label:`+ ${v.name}`,kbd:v.label,thumb:getAssetPreviewURL16(k),run:()=>addCatalogItem(k)})),
    {sep:true},
    {label:'🌐 Tìm Asset 3D & Texture CC0 (Poly Haven / Wikimedia)',kbd:'CC0',run:()=>open('search')},
    {label:'🕺 Thêm Nhân vật 3D (Cast Performers · 15 vai & 5 mẫu show)',kbd:'3D',thumb:getPerformerPreviewURL16('fandancer'),run:()=>openCastLibrary16()}
   ];
   if(menuKey==='stage')return [
    {label:'⚡ Tự động nhận diện các màn hình LED',kbd:'',run:()=>$('autoDetect')?.click()},
    {label:'⬚ Vẽ màn LED 4 góc trên model',kbd:'',run:()=>$('drawQuad')?.click()},
    {label:'🔧 Sửa mapping 3D bám mặt trước',kbd:'',run:()=>$('repairMapping')?.click()},
    {label:'📐 Hệ quy chiếu mét thật (Spatial V0.4)',kbd:'',run:()=>$('spatialMapBtn')?.click()},
    {sep:true},
    {label:'🖥 Quản lý danh sách màn LED',kbd:'',run:()=>$('ledManagerBtn')?.click()},
    {label:'🎨 Pixel Studio (Đóng gói Atlas 4K)',kbd:'',run:()=>$('atlasBtn')?.click()},
    {label:'🏗 Bàn nâng chữ X (Stage & Scissor Lift)',kbd:'',run:()=>openDockByKey16('stageLift124')},
    {label:'📏 Thước đo khoảng cách 2 điểm 3D',kbd:'',run:()=>triggerTShelfTool16('measure')},
    {label:'🌬 Tính tải gió & Đối trọng TCVN 2737:2023',kbd:'',run:()=>open('tools')}
   ];
   if(menuKey==='lighting')return [
    {label:'💡 Bàn điều khiển Đèn DMX / OFL (Fixture Desk)',kbd:'',run:()=>openDockByKey16('pro127')},
    {label:'🎆 Hệ thống LED Matrix 35 FX (Quét viền 3D)',kbd:'',run:()=>openDockByKey16('matrix143')},
    {label:'✏ Vẽ viền LED Matrix trực tiếp trên 3D',kbd:'',run:()=>$('matrix148DrawBtn')?.click()},
    {label:'⚡ Đa đèn FX Timecode (Par / Line / Laser Bar)',kbd:'',run:()=>openDockByKey16('fx141')},
    {label:'🔦 Thiết kế & Phát tia Laser ILDA (.ild)',kbd:'',run:()=>openDockByKey16('laser135')},
    {label:'🧲 Gắn đèn theo 6 mặt khối (Stage Mount)',kbd:'',run:()=>openDockByKey16('mount136')},
    {sep:true},
    {label:'🎵 Phân tích nhạc & Tự lập kịch bản đèn (FX9)',kbd:'',run:()=>$('lxToolbar')?.click()},
    {label:'⏺ Ghi tay thao tác ánh sáng (Light Take)',kbd:'',run:()=>openDockByKey16('l132')}
   ];
   if(menuKey==='show')return [
    {label:'🎞 Mở / Đóng SHOW Timeline (Sequencer đa làn)',kbd:'',run:()=>$('v07Timeline')?.click()},
    {label:'⏱ Bàn điều khiển Show Timecode SMPTE',kbd:'',run:()=>$('tc134EditBtn')?.click()},
    {label:'📋 Quản lý tiết mục (Show Rundown V10)',kbd:'',run:()=>$('rundownToggle10')?.click()},
    {label:'🕺 Biên đạo 3D khớp xương IK (12 động tác)',kbd:'',run:()=>$('choreoToggle11')?.click()},
    {label:'🕺 Ghi tay chuyển động nhân vật (Manual Take)',kbd:'',run:()=>openDockByKey16('m131')},
    {sep:true},
    {label:'🎛 Bàn trộn LIVE VJ & Audio Mixer',kbd:'',run:()=>$('vjToggle')?.click()},
    {label:'▶ Bắt đầu Trình diễn toàn màn hình',kbd:'',run:()=>$('presentBtn')?.click()}
   ];
   return [];
  }

  function closeHeaderMenu16(){
   A.openMenuKey=null;
   const pop=$('v16MenuPopover');
   if(pop)pop.hidden=true;
   document.querySelectorAll('#v16HeaderMenus button[data-v16menu]').forEach(b=>b.classList.remove('active'));
  }

  function openHeaderMenu16(menuKey,anchorBtn){
   const pop=$('v16MenuPopover');
   if(!pop||!anchorBtn)return;
   if(A.openMenuKey===menuKey && !pop.hidden){closeHeaderMenu16();return;}
   A.openMenuKey=menuKey;
   document.querySelectorAll('#v16HeaderMenus button[data-v16menu]').forEach(b=>b.classList.toggle('active',b.dataset.v16menu===menuKey));
   const items=buildMenuItems16(menuKey);
   pop.innerHTML=items.map((it,idx)=>it.sep?'<div class="v16-menu-sep"></div>':`<button type="button" class="v16-menu-item" data-v16mitem="${idx}"><span class="v16-menu-left">${it.thumb?`<img class="v16-menu-thumb" src="${it.thumb}" alt="">`:''}<span>${esc16(it.label)}</span></span>${it.kbd?`<kbd>${esc16(it.kbd)}</kbd>`:''}</button>`).join('');
   pop._items=items;
   pop.hidden=false;
   const rect=anchorBtn.getBoundingClientRect();
   const left=Math.min(window.innerWidth-270,Math.max(8,rect.left));
   pop.style.left=left+'px';
   pop.style.top=(rect.bottom+4)+'px';
  }

  function toggleTShelf16(force){
   A.tShelfHidden=force!==undefined?!force:!A.tShelfHidden;
   setClass16(document.body,'v16-hide-tshelf',!!A.tShelfHidden);
   syncBlenderState16();
  }

  // Interactive 3D Axis Gizmo (X Red, Y Green, Z Blue) synced with engine.camera
  let lastGizmoYaw=NaN, lastGizmoPitch=NaN;
  function drawAxisGizmo16(){
   const cvs=$('v16AxisGizmo');
   if(!cvs||!engine?.camera)return;
   const yaw=engine.camera.yaw||0, pitch=engine.camera.pitch||0;
   if(Math.abs(yaw-lastGizmoYaw)<0.004 && Math.abs(pitch-lastGizmoPitch)<0.004)return;
   lastGizmoYaw=yaw; lastGizmoPitch=pitch;
   const ctx=cvs.getContext('2d');
   if(!ctx)return;
   const w=cvs.width, h=cvs.height, cx=w*.5, cy=h*.5, r=21;
   ctx.clearRect(0,0,w,h);
   ctx.fillStyle='rgba(13, 21, 34, 0.68)';
   ctx.beginPath();ctx.arc(cx,cy,27,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='rgba(180, 210, 240, 0.16)';
   ctx.lineWidth=1;ctx.stroke();

   const cyaw=Math.cos(-yaw), syaw=Math.sin(-yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
   function rot([x,y,z]){
    const x1=x*cyaw+z*syaw, z1=-x*syaw+z*cyaw;
    const y2=y*cp-z1*sp, z2=y*sp+z1*cp;
    return {x:cx+x1*r, y:cy-y2*r, z:z2};
   }
   const axes=[
    {label:'X',dir:[1,0,0],col:'#ff5370',cam:'side'},
    {label:'Y',dir:[0,1,0],col:'#4ade80',cam:'top'},
    {label:'Z',dir:[0,0,1],col:'#38bdf8',cam:'front'},
    {label:'',dir:[-1,0,0],col:'rgba(255,83,112,0.38)',cam:'side'},
    {label:'',dir:[0,-1,0],col:'rgba(74,222,128,0.38)',cam:'top'},
    {label:'',dir:[0,0,-1],col:'rgba(56,189,248,0.38)',cam:'front'}
   ].map(a=>({...a,p:rot(a.dir)})).sort((a,b)=>a.p.z-b.p.z);
   cvs._hitAxes=axes;

   for(const a of axes){
    if(a.label){
     ctx.strokeStyle=a.col;
     ctx.lineWidth=1.8;
     ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(a.p.x,a.p.y);ctx.stroke();
    }
    const rad=a.label?6.2:4.0;
    ctx.fillStyle=a.col;
    ctx.beginPath();ctx.arc(a.p.x,a.p.y,rad,0,Math.PI*2);ctx.fill();
    if(a.label){
     ctx.fillStyle='#06101c';
     ctx.font='bold 8px Plus Jakarta Sans, Segoe UI, sans-serif';
     ctx.textAlign='center';ctx.textBaseline='middle';
     ctx.fillText(a.label,a.p.x,a.p.y+.5);
    }
   }
  }

  function decorateInspectorAccordions16(){
   const ic=$('inspectorContent');
   if(!ic)return;
   // Guard #3: never mutate DOM classes or attributes while user is dragging a range input
   if(document.activeElement?.type==='range')return;
   const blocks=[...ic.querySelectorAll('.inspector-block, .spatial-workflow, .binding-panel')];
   blocks.forEach((blk,idx)=>{
    const hdr=blk.querySelector(':scope > .block-title, :scope > h3, :scope > .section-kicker, :scope > strong');
    if(!hdr)return;
    setClass16(hdr,'v16-acc-header',true);
    const key=(hdr.textContent||'').trim().slice(0,48)||('blk_'+idx);
    if(blk.dataset.v16AccKey!==key)blk.dataset.v16AccKey=key;
    const isCollapsed=A.allBlocksCollapsed ? !A.collapsedBlocks.has('__open_'+key) : A.collapsedBlocks.has(key);
    setClass16(blk,'v16-collapsed',isCollapsed);
   });
   // Inject 3D visual preview thumbnails into Director "Tiết mục 3D" (acts) cards if open
   ic.querySelectorAll('.dir-act-grid button[data-add-act8]').forEach(btn=>{
    if(btn.querySelector('.v16-act-thumb'))return;
    const actId=btn.dataset.addAct8;
    const url=getActPreviewURL16(actId);
    if(url){
     const img=document.createElement('img');
     img.className='v16-act-thumb';
     img.decoding='async';
     img.loading='lazy';
     img.src=url;
     img.alt=actId;
     btn.prepend(img);
    }
   });
  }

  let _syncingState16=false;
  function syncBlenderState16(withAccordions){
   if(_syncingState16)return;
   _syncingState16=true;
   try{
    setClass16(document.body,'v16-compact-ui',true);
    setClass16(document.body,'v16-blender-ui',!!A.blenderUI);
    setClass16(document.body,'v16-hide-tshelf',!!A.tShelfHidden);
    const activeDock=activeDockKey16();
    document.querySelectorAll('#v16PropRail button[data-prop16]').forEach(b=>{
     setClass16(b,'active',b.dataset.prop16===activeDock);
    });
    const toolMode=window.director?.mode||'navigate';
    document.querySelectorAll('#v16TShelf button[data-tshelf16]').forEach(b=>{
     const k=b.dataset.tshelf16;
     const on=(k==='select'&&toolMode==='navigate'&&!A.measureMode&&!A.placeMode)||
      (k==='move'&&toolMode==='move')||
      (k==='rotate'&&toolMode==='rotate')||
      (k==='quad'&&!!state.quad)||
      (k==='measure'&&!!A.measureMode)||
      (k==='crease'&&!!A.creaseEnabled)||
      (k==='asset'&&activeDock==='v16Asset')||
      (k==='lift'&&activeDock==='stageLift124')||
      (k==='fixture'&&activeDock==='pro127')||
      (k==='matrix'&&activeDock==='matrix143')||
      (k==='laser'&&activeDock==='laser135');
     setClass16(b,'active',on);
    });
    const crBtn=$('v16QuickCreaseBtn');if(crBtn)setClass16(crBtn,'active',!!A.creaseEnabled);
    const msBtn=$('v16QuickMeasureBtn');if(msBtn)setClass16(msBtn,'active',!!A.measureMode);
    const lkBtn=$('v16NavLockBtn');
    if(lkBtn){
     const lk=!!engine?.cameraLocked;
     if(lkBtn._lkState!==lk){
      lkBtn._lkState=lk;
      setClass16(lkBtn,'active',lk);
      lkBtn.setAttribute('aria-pressed',String(lk));
      lkBtn.innerHTML=lk?SVG_LOCK_CLOSED16:SVG_LOCK_OPEN16;
      lkBtn.title=lk?'Đã khóa góc Camera (Click để mở khóa · Phím L)':'Khóa / Mở khóa góc Camera (Phím L)';
     }
    }
    if(withAccordions)decorateInspectorAccordions16();
   }finally{
    _syncingState16=false;
   }
  }

  function installBlenderUI16(){
   setClass16(document.body,'v16-compact-ui',true);
   setClass16(document.body,'v16-blender-ui',!!A.blenderUI);
   if(A._chromeInstalled16 && $('v16PropRail') && $('v16TShelf')){
    drawAxisGizmo16();
    syncBlenderState16(false);
    return;
   }
   A._chromeInstalled16=true;

   // 1. Left Column: Stage Tree & Media header + collapsible sections in .left-panel
   const lp=document.querySelector('.left-panel');
   if(lp && !$('v16OutlinerBar')){
    const ob=document.createElement('div');
    ob.id='v16OutlinerBar';
    ob.className='v16-outliner-bar';
    ob.innerHTML=`
     <span class="v16-outliner-title">❖ CÂY SÂN KHẤU &amp; MEDIA</span>
     <div class="v16-outliner-actions">
      <button type="button" data-outliner16="import" title="Mở / Thu gọn mục Nhập sân khấu 3D">+ Nhập 3D</button>
      <button type="button" data-outliner16="media" title="Mở / Thu gọn Thư viện Video LED">+ Media</button>
     </div>
    `;
    lp.prepend(ob);
    const impSec=lp.querySelector('.import-section');
    const medSec=lp.querySelector('.media-section');
    const objSec=lp.querySelector('.object-section');
    if(impSec){
     impSec.classList.add('v16-collapsed');
     const k=impSec.querySelector('.section-kicker');
     if(k){k.classList.add('v16-acc-header');k.title='Click để đóng / mở mục Nhập mô hình 3D';k.onclick=()=>impSec.classList.toggle('v16-collapsed');}
    }
    if(medSec){
     medSec.classList.add('v16-collapsed');
     const h=medSec.querySelector('.section-heading');
     if(h){h.classList.add('v16-acc-header');h.title='Click để đóng / mở Thư viện Video';h.onclick=e=>{if(e.target.closest('button'))return;medSec.classList.toggle('v16-collapsed');};}
    }
    if(objSec){
     const h=objSec.querySelector('.section-heading');
     if(h){h.classList.add('v16-acc-header');h.title='Click để đóng / mở Cây cấu trúc sân khấu';h.onclick=e=>{if(e.target.closest('button'))return;objSec.classList.toggle('v16-collapsed');};}
    }
    ob.addEventListener('click',e=>{
     const b=e.target.closest('button[data-outliner16]');
     if(!b)return;
     if(b.dataset.outliner16==='import'&&impSec){const open=!impSec.classList.toggle('v16-collapsed');b.classList.toggle('active',open);if(open)impSec.scrollIntoView?.({block:'nearest'});}
     if(b.dataset.outliner16==='media'&&medSec){const open=!medSec.classList.toggle('v16-collapsed');b.classList.toggle('active',open);if(open)medSec.scrollIntoView?.({block:'nearest'});}
    });
   }

   // 2. Right Module Switcher Icon Rail (#v16PropRail) in .workspace
   const ws=document.querySelector('.workspace');
   if(ws && !$('v16PropRail')){
    const rail=document.createElement('nav');
    rail.id='v16PropRail';
    rail.className='v16-prop-rail';
    rail.setAttribute('aria-label','Thanh chuyển nhanh mô-đun kỹ thuật');
    rail.innerHTML=PROP_TABS16.map(t=>`<button type="button" data-prop16="${t.key}" title="${esc16(t.label)}"><span>${t.icon}</span></button>`).join('');
    rail.addEventListener('click',e=>{
     const b=e.target.closest('button[data-prop16]');
     if(b)openDockByKey16(b.dataset.prop16);
    });
    ws.appendChild(rail);
   }

   // 3. Right Inspector Header Collapse-All Toggle & Delegated Accordion Click in .right-panel
   const rp=document.querySelector('.right-panel');
   if(rp && !$('v16CollapseAllBtn')){
    const ih=rp.querySelector('.inspector-head');
    if(ih){
     const row=document.createElement('div');
     row.className='v16-prop-headbar';
     row.innerHTML=`
      <span class="v16-prop-crumb">⚙ THÔNG SỐ &amp; HIỆU CHỈNH</span>
      <button type="button" id="v16CollapseAllBtn" class="btn small" title="Thu gọn / Mở rộng toàn bộ các mục thông số">▾ Thu gọn mục</button>
     `;
     ih.prepend(row);
     $('v16CollapseAllBtn')?.addEventListener('click',()=>{
      A.allBlocksCollapsed=!A.allBlocksCollapsed;
      A.collapsedBlocks.clear();
      const btn=$('v16CollapseAllBtn');
      if(btn)btn.textContent=A.allBlocksCollapsed?'▸ Mở rộng mục':'▾ Thu gọn mục';
      decorateInspectorAccordions16();
     });
    }
    rp.addEventListener('click',e=>{
     if(e.target.closest('button,input,select,a,label'))return;
     const hdr=e.target.closest('.v16-acc-header, .inspector-block > .block-title, .inspector-block > h3, .v16-section > h4, #fx141Panel section > h4');
     if(!hdr)return;
     const blk=hdr.closest('.inspector-block, .spatial-workflow, .binding-panel, .v16-section, section');
     if(!blk)return;
     const collapsed=blk.classList.toggle('v16-collapsed');
     const key=blk.dataset.v16AccKey||(hdr.textContent||'').trim().slice(0,48);
     if(key){
      if(A.allBlocksCollapsed){
       if(!collapsed)A.collapsedBlocks.add('__open_'+key);
       else A.collapsedBlocks.delete('__open_'+key);
      }else{
       if(collapsed)A.collapsedBlocks.add(key);
       else A.collapsedBlocks.delete(key);
      }
     }
    });
   }

   // 4. Viewport Header Dropdown Menus (#v16HeaderMenus) & Quick Overlay Pills in .view-toolbar
   const vt=document.querySelector('.view-toolbar');
   if(vt && !$('v16HeaderMenus')){
    const menus=document.createElement('div');
    menus.id='v16HeaderMenus';
    menus.className='v16-header-menus';
    menus.innerHTML=`
     <button type="button" data-v16menu="view">Góc nhìn ▾</button>
     <button type="button" data-v16menu="add">Thêm 3D ▾</button>
     <button type="button" data-v16menu="stage">Màn LED ▾</button>
     <button type="button" data-v16menu="lighting">Ánh sáng &amp; FX ▾</button>
     <button type="button" data-v16menu="show">Show &amp; Kịch bản ▾</button>
    `;
    const tabs=vt.querySelector('.view-tabs');
    if(tabs)tabs.after(menus);else vt.prepend(menus);
    menus.addEventListener('click',e=>{
     const b=e.target.closest('button[data-v16menu]');
     if(!b)return;
     e.stopPropagation();
     openHeaderMenu16(b.dataset.v16menu,b);
    });

    const va=vt.querySelector('.view-actions');
    if(va && !$('v16QuickCreaseBtn')){
     const cr=document.createElement('button');
     cr.id='v16QuickCreaseBtn';
     cr.type='button';
     cr.className='icon-btn';
     cr.title='Bật / tắt viền kỹ thuật Crease 28° (Wireframe)';
     cr.textContent='◫';
     cr.onclick=()=>triggerTShelfTool16('crease');
     const ms=document.createElement('button');
     ms.id='v16QuickMeasureBtn';
     ms.type='button';
     ms.className='icon-btn';
     ms.title='Thước đo khoảng cách 2 điểm 3D';
     ms.textContent='📏';
     ms.onclick=()=>triggerTShelfTool16('measure');
     va.prepend(cr,ms);
    }
   }

   if(!$('v16MenuPopover')){
    const pop=document.createElement('div');
    pop.id='v16MenuPopover';
    pop.className='v16-menu-popover';
    pop.hidden=true;
    document.body.appendChild(pop);
    pop.addEventListener('click',e=>{
     const btn=e.target.closest('button[data-v16mitem]');
     if(!btn)return;
     const item=pop._items?.[+btn.dataset.v16mitem];
     closeHeaderMenu16();
     item?.run?.();
     syncBlenderState16();
    });
    document.addEventListener('click',e=>{
     if(!pop.hidden && !e.target.closest('#v16MenuPopover, #v16HeaderMenus'))closeHeaderMenu16();
    });
   }

   // 5. Floating Horizontal Quick-Tool Pill (#v16TShelf) & Right 3D Axis Gizmo (#v16ViewportNav) inside #viewport
   const vp=$('viewport');
   if(vp && !$('v16TShelf')){
    const shelf=document.createElement('aside');
    shelf.id='v16TShelf';
    shelf.className='v16-tshelf';
    shelf.setAttribute('aria-label','Thanh công cụ nổi 3D');
    shelf.innerHTML=TSHELF_TOOLS16.map(t=>`<button type="button" data-tshelf16="${t.key}" title="${esc16(t.title)}">${t.icon}</button>`).join('');
    shelf.addEventListener('click',e=>{
     const b=e.target.closest('button[data-tshelf16]');
     if(b)triggerTShelfTool16(b.dataset.tshelf16);
    });
    vp.appendChild(shelf);
   }

   if(vp && !$('v16ViewportNav')){
    const nav=document.createElement('div');
    nav.id='v16ViewportNav';
    nav.className='v16-viewport-nav';
    nav.innerHTML=`
     <canvas id="v16AxisGizmo" width="60" height="60" title="Click X / Y / Z để chuyển góc nhìn Side / Top / Front"></canvas>
     <div class="v16-nav-pills">
      <button type="button" data-v16nav="frame" title="Toàn cảnh sân khấu (Phím F)">⌖</button>
      <button type="button" data-v16nav="cam" title="Đổi góc Camera: Front / 3/4 / Side / Top">🎥</button>
      <button type="button" id="v16NavLockBtn" data-v16nav="lock" title="Khóa / Mở khóa góc Camera (Phím L)" aria-pressed="false">${SVG_LOCK_OPEN16}</button>
      <button type="button" data-v16nav="focus" title="Chế độ Tập trung (Ẩn / Hiện bảng hai bên · Phím N)">⛶</button>
     </div>
    `;
    vp.appendChild(nav);
    const gizmo=$('v16AxisGizmo');
    gizmo?.addEventListener('click',e=>{
     const r=gizmo.getBoundingClientRect();
     const x=(e.clientX-r.left)*(gizmo.width/Math.max(1,r.width));
     const y=(e.clientY-r.top)*(gizmo.height/Math.max(1,r.height));
     const hits=(gizmo._hitAxes||[]).filter(a=>a.label);
     let best=null, bestDist=14;
     for(const a of hits){
      const d=Math.hypot(x-a.p.x,y-a.p.y);
      if(d<bestDist){bestDist=d;best=a;}
     }
     const camKey=best?best.cam:'iso';
     document.querySelector(`#cameraBar [data-camera="${camKey}"]`)?.click();
     lastGizmoYaw=NaN;drawAxisGizmo16();
    });
    const camOrder=['front','iso','side','top'];
    let camIdx=1;
    nav.addEventListener('pointerdown',e=>e.stopPropagation());
    nav.addEventListener('pointerup',e=>e.stopPropagation());
    nav.addEventListener('click',e=>{
     const b=e.target.closest('button[data-v16nav]');
     if(!b)return;
     e.preventDefault();
     e.stopPropagation();
     const act=b.dataset.v16nav;
     if(act==='frame')$('overviewBtn')?.click();
     else if(act==='cam'){
      camIdx=(camIdx+1)%camOrder.length;
      document.querySelector(`#cameraBar [data-camera="${camOrder[camIdx]}"]`)?.click();
     }else if(act==='lock'){
      if(typeof window.STUDIO?.setCameraLock === 'function'){
       window.STUDIO.setCameraLock(!engine?.cameraLocked);
      }else if($('lockCameraBtn')){
       $('lockCameraBtn').click();
      }else if(engine){
       engine.cameraLocked=!engine.cameraLocked;
       updateStableControls?.();
      }
      syncBlenderState16();
     }else if(act==='focus'){
      $('focusBtn')?.click();
     }
    });
   }

   // Keyboard shortcuts: 'T' toggles floating tool pill, 'N' toggles side panels, 'Escape' closes menu popover
   if(!A._keysBound){
    A._keysBound=true;
    window.addEventListener('keydown',e=>{
     if(e.key==='Escape' && A.openMenuKey){closeHeaderMenu16();return;}
     if(e.ctrlKey||e.metaKey||e.altKey||state.presenting||document.body.classList.contains('client-review-mode'))return;
     if(e.target instanceof Element && e.target.closest('input,select,textarea,[contenteditable],dialog[open]'))return;
     if(e.key==='t'||e.key==='T'){e.preventDefault();toggleTShelf16();}
     else if(e.key==='n'||e.key==='N'){e.preventDefault();$('focusBtn')?.click();}
    });
    const bodyObs=new MutationObserver(()=>{
     if(_syncingState16)return;
     syncBlenderState16(false);
    });
    bodyObs.observe(document.body,{attributes:true,attributeFilter:['class']});
   }
   drawAxisGizmo16();
   syncBlenderState16(true);
   if(!A._initialFitDone16){
    A._initialFitDone16=true;
    requestAnimationFrame(()=>{
     if(engine && !state.presenting){
      if(engine._fitOnResize)engine.fit?.();
      engine.render?.(state.time||0);
      renderOverlays?.();
      lastGizmoYaw=NaN;
      drawAxisGizmo16();
     }
    });
   }
  }

  function syncWorkspaceStepUI(){
   const st=state.step||'stage';
   // CRITICAL GUARD: NEVER set data-step on document.body!
   // Core modules bind document.querySelectorAll('[data-step]') -> onclick=setStep(...)
   // and e.target.closest('[data-step]') -> closeAllDocks() on every click!
   if(document.body.hasAttribute('data-step'))document.body.removeAttribute('data-step');
   if(document.body.onclick)document.body.onclick=null;
   if(document.body.dataset.workspaceStep!==st)document.body.dataset.workspaceStep=st;
   const wf=document.querySelector('.workflow-right')||document.querySelector('.topbar .header-actions');
   if(wf && !$('v16AssetBtn')){
    const b=document.createElement('button');
    b.id='v16AssetBtn';
    b.className='btn small';
    b.textContent='❖ Đạo cụ & Đo 3D';
    b.title='Mở Thư viện Đạo cụ 3D, Tìm Asset CC0 (Poly Haven / Wikimedia), Thước đo 3D & Tính tải gió TCVN';
    b.onclick=()=>{if(A.isOpen)close();else open('catalog');};
    wf.insertBefore(b,$('exportBtn')||wf.firstChild);
   }
   if(wf && !$('v16AllToolsBtn')){
    const t=document.createElement('button');
    t.id='v16AllToolsBtn';
    t.className='btn small';
    t.textContent='☰ Thanh đầy đủ';
    t.title='Hiện / ẩn toàn bộ các thanh công cụ ngang cổ điển trên mọi bước';
    t.onclick=()=>{
     A.allToolsVisible=!A.allToolsVisible;
     setClass16(document.body,'v16-all-tools',!!A.allToolsVisible);
     setClass16(t,'active',!!A.allToolsVisible);
    };
    wf.insertBefore(t,$('exportBtn')||null);
   }
   installBlenderUI16();
  }

  document.querySelectorAll('.workflow .step').forEach(btn=>{
   btn.addEventListener('click',()=>{
    setTimeout(()=>{
     document.body.dataset.workspaceStep=state.step||'stage';
     if(A.isOpen && state.step!=='stage')close();
     syncBlenderState16(true);
    },0);
   });
  });

  const prevRenderUI=renderUI;
  renderUI=function(...args){
   const rp=document.querySelector('.right-panel');
   const prevScroll=rp?rp.scrollTop:0;
   const r=prevRenderUI(...args);
   syncWorkspaceStepUI();
   decorateInspectorAccordions16();
   if(rp && prevScroll>0)rp.scrollTop=prevScroll;
   return r;
  };
  syncWorkspaceStepUI();
  const vRaw16=String(window.APP_VERSION||'1.2').trim().replace(/^[vV]/,'');
  S.version=vRaw16.split('.').length===2?vRaw16+'.0':vRaw16;
  document.title=`ALPHA Creative LED Studio V${vRaw16} | Sân khấu 3D · 35 FX · Đạo cụ & Biên đạo`;
  const brandSmall=document.querySelector('.brand small');
  if(brandSmall)brandSmall.textContent=`V${vRaw16} / SÂN KHẤU 3D · 35 FX · DMX & ILDA`;
  const buildSpan=document.querySelector('.bottom-status > span:last-child');
  if(buildSpan)buildSpan.textContent=`ALPHA / LOCAL BUILD ${vRaw16}`;
 } catch(err) {
  console.error('V16 Asset Library init error:', err);
 }
})();
