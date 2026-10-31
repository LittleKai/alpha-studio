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
   kinetic_ring:{name:'Vòng LED Kinetic Ø2.4m',label:'KINETIC RING',cat:'Đạo cụ / FX',color:'#f59e0b',desc:'Vòng ánh sáng treo trần phát sáng emissive'}
  };

  const ALLOWED_LICENSES=['cc0','cc-zero','public domain','pdm','cc-by','cc by','cc-by-sa','cc by-sa'];
  const creaseCache=new WeakMap();

  const A={
   items:[],
   selected:null,
   isOpen:false,
   tab:'catalog',
   placeMode:false,
   meshMap:new Map(),
   searchSource:'polyhaven_models',
   searchQuery:'stage',
   searchResults:[],
   searching:false,
   searchStatus:'Nhập từ khóa (vd: truss, speaker, neon, brick, wood, stage) rồi bấm Tìm.',
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
   previewKind:'truss_tower',
   propPreviewYaw:0.55,
   castPreviewType:'fandancer',
   castPreviewAction:'auto',
   castPreviewColor:'#6e3455',
   castPreviewHeight:1.75,
   castPreviewYaw:0.35,
   wind:{speed:15,cd:1.4,baseDepth:1.2,selfKgPerM2:38}
  };
  S.stageAssets16=A;

  // Centralized dock coordinator to prevent overlapping right-panel tools (Bug #6 guard)
  function closeAllDocks16(except=''){
   if(except!=='v16Asset' && A.isOpen)close();
   if(except!=='fx141')S.fx141?.close?.();
   if(except!=='matrix143')S.matrix143?.close?.();
   if(except!=='mount136')S.mount136?.close?.();
   if(except!=='laser135')S.laserShow?.close?.();
   if(except!=='pro127')$('pro127close')?.click();
   if(except!=='stageLift124' && document.body.classList.contains('lift-dock-open')){
    document.body.classList.remove('lift-dock-open');
    const lf=$('stageLift124');if(lf)lf.hidden=true;
   }
   if(except!=='m131' && (document.body.classList.contains('m131-open')||document.body.classList.contains('m131-edit-open'))){
    S.manual131?.close?.();
    document.body.classList.remove('m131-open','m131-edit-open');
    const mp=$('m131Panel');if(mp)mp.hidden=true;
   }
   if(except!=='l132' && document.body.classList.contains('l132-open')){
    document.body.classList.remove('l132-open');
    const lp=$('l132Panel');if(lp)lp.hidden=true;
   }
   if(except!=='v130' && document.body.classList.contains('v130-edit-open')){
    document.body.classList.remove('v130-edit-open');
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

  // Track 1B: 28° Crease Edge computation (ported from 5.Design_mcp viewer_template.html)
  function computeCreaseEdges(mesh,creaseDeg=28){
   const cached=creaseCache.get(mesh);
   if(cached && cached.p===mesh.p && cached.deg===creaseDeg)return cached.segments;
   const p=mesh.p, triCount=(p.length/9)|0;
   if(triCount>25000)return [];
   const cosThresh=Math.cos(creaseDeg*Math.PI/180), eps=1000;
   const vKey=(x,y,z)=>Math.round(x*eps)+','+Math.round(y*eps)+','+Math.round(z*eps);
   const edgeMap=new Map();
   for(let t=0;t<triCount;t++){
    const o=t*9;
    const v=[[p[o],p[o+1],p[o+2]],[p[o+3],p[o+4],p[o+5]],[p[o+6],p[o+7],p[o+8]]];
    const fn=M.norm(M.cross(M.sub(v[1],v[0]),M.sub(v[2],v[0])));
    const keys=[vKey(...v[0]),vKey(...v[1]),vKey(...v[2])];
    for(const [a,b] of [[0,1],[1,2],[2,0]]){
     const ka=keys[a],kb=keys[b];
     if(ka===kb)continue;
     const ek=ka<kb?ka+'|'+kb:kb+'|'+ka;
     let entry=edgeMap.get(ek);
     if(!entry){entry={a:v[a],b:v[b],normals:[fn]};edgeMap.set(ek,entry);}
     else if(entry.normals.length<2)entry.normals.push(fn);
    }
   }
   const segments=[];
   for(const e of edgeMap.values()){
    if(e.normals.length===1 || M.dot(e.normals[0],e.normals[1])<cosThresh){
     segments.push([e.a,e.b]);
    }
   }
   creaseCache.set(mesh,{p:mesh.p,deg:creaseDeg,segments});
   return segments;
  }

  // Track 4: Wind Load & Overturning Safety Factor (TCVN 2737:2023, ported from 5.Design_mcp stage_frame.py)
  function computeWindSafety(){
   const V=clamp16(A.wind.speed,0,60), cd=clamp16(A.wind.cd,.4,2.2), baseDepth=clamp16(A.wind.baseDepth,.3,8), selfKg=clamp16(A.wind.selfKgPerM2,10,150);
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
   const g=9.81, leverArm=baseDepth*.5;
   const selfRestoreMoment=selfMassKg*g*leverArm;
   const targetSF=1.50;
   const requiredRestoreMoment=overturnMoment*targetSF;
   const deficitMoment=Math.max(0,requiredRestoreMoment-selfRestoreMoment);
   const ballastKg=leverArm>0?Math.ceil(deficitMoment/(g*leverArm)):0;
   const currentSF=overturnMoment>0?(selfRestoreMoment/overturnMoment):99.9;
   return {V,cd,baseDepth,selfKg,q,totalArea,totalForce,overturnMoment,selfMassKg,selfRestoreMoment,currentSF,ballastKg,rows};
  }

  // Track 5: Keyless CC0 Online Asset Search (Poly Haven + Wikimedia Commons)
  async function fetchJsonWithTimeout(url,ms=8000){
   const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),ms);
   try{
    const res=await fetch(url,{signal:ctrl.signal});
    if(!res.ok)throw Error('HTTP '+res.status);
    return await res.json();
   }finally{clearTimeout(timer);}
  }

  async function runOnlineSearch(){
   const q=(A.searchQuery||'').trim().toLowerCase();
   A.searching=true; A.searchStatus='Đang tìm kiếm trên kho CC0...'; paint();
   try{
    if(A.searchSource==='polyhaven_models' || A.searchSource==='polyhaven_textures'){
     const type=A.searchSource==='polyhaven_models'?'models':'textures';
     if(!A.polyCache[type]){
      A.polyCache[type]=await fetchJsonWithTimeout('https://api.polyhaven.com/assets?t='+type);
     }
     const all=Object.entries(A.polyCache[type]||{});
     const matches=all.filter(([id,meta])=>{
      if(!q)return true;
      const hay=[id,meta.name,...(meta.categories||[]),...(meta.tags||[])].join(' ').toLowerCase();
      return hay.includes(q);
     }).slice(0,18);
     A.searchResults=matches.map(([id,meta])=>({
      id,
      source:type==='models'?'polyhaven_model':'polyhaven_tex',
      title:meta.name||id,
      license:'CC0 1.0 (Poly Haven)',
      thumb:`https://cdn.polyhaven.com/asset_img/thumbs/${encodeURIComponent(id)}.png?width=240`,
      dims:meta.dimensions?meta.dimensions.map(d=>(d/1000).toFixed(2)+'m').join('×'):(meta.categories||[]).slice(0,2).join(', ')
     }));
     A.searchStatus=A.searchResults.length?`Tìm thấy ${A.searchResults.length} asset CC0 từ Poly Haven.`:'Không tìm thấy kết quả khớp từ khóa.';
    }else{
     const api=`https://commons.wikimedia.org/w/api.php?origin=*&action=query&generator=search&gsrsearch=${encodeURIComponent('filetype:bitmap '+(q||'stage lighting'))}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|extmetadata|dimensions&iiurlwidth=320&format=json`;
     const data=await fetchJsonWithTimeout(api);
     const pages=Object.values(data?.query?.pages||{});
     const out=[];
     for(const p of pages){
      const ii=p.imageinfo?.[0]; if(!ii)continue;
      const ext=ii.extmetadata||{};
      const lic=String(ext.LicenseShortName?.value||ext.UsageTerms?.value||'').replace(/<[^>]*>/g,'').trim();
      const licLower=lic.toLowerCase();
      if(!ALLOWED_LICENSES.some(k=>licLower.includes(k)))continue;
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
    A.searchStatus='Không kết nối được kho online ('+(err?.message||'Offline')+'). Bạn vẫn dùng được 100% Thư viện Sân khấu 3D Offline ở tab bên cạnh.';
   }finally{
    A.searching=false;
    paint();
   }
  }

  async function importOnlineResult(idx){
   const r=A.searchResults[idx];
   if(!r)return;
   try{
    busy(true,'Đang tải asset CC0: '+r.title+'...');
    if(r.source==='polyhaven_model'){
     const filesData=await fetchJsonWithTimeout(`https://api.polyhaven.com/files/${encodeURIComponent(r.id)}`);
     const gltfNode=filesData?.gltf?.['1k']?.gltf || filesData?.gltf?.['2k']?.gltf || Object.values(filesData?.gltf||{})[0]?.gltf;
     if(!gltfNode?.url)throw Error('Không tìm thấy gói glTF 1K trên Poly Haven.');
     const gltfRes=await fetch(gltfNode.url);
     if(!gltfRes.ok)throw Error('Không tải được file .gltf');
     const gltfBlob=await gltfRes.blob();
     const gltfFile=new File([gltfBlob],r.id+'.gltf',{type:'model/gltf+json'});
     const map=new Map([[gltfFile.name.toLowerCase(),gltfFile]]);
     const inc=gltfNode.include||{};
     for(const [relPath,info] of Object.entries(inc)){
      if(!info?.url)continue;
      const subRes=await fetch(info.url);
      if(!subRes.ok)continue;
      const subBlob=await subRes.blob();
      const base=relPath.split('/').pop();
      const f=new File([subBlob],base);
      map.set(relPath.toLowerCase(),f);
      map.set(base.toLowerCase(),f);
     }
     const parsed=await Importer.gltf(gltfFile,map);
     if(!parsed?.meshes?.length)throw Error('Model không có mesh hợp lệ.');
     checkpoint();
     const b=engine.stageBounds||{min:[-9,0,-4],max:[9,7,4]};
     let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
     for(const m of parsed.meshes)for(let i=0;i<3;i++){min[i]=Math.min(min[i],m.bounds.min[i]);max[i]=Math.max(max[i],m.bounds.max[i]);}
     const shift=[-(min[0]+max[0])*.5,(b.min?.[1]||0)-min[1],1.2-(min[2]+max[2])*.5];
     for(const m of parsed.meshes){
      transformMesh(m,M.translate(shift));
      if(m._gltfAnim?.sceneAnim)m._gltfAnim.sceneAnim.modelShift=shift.slice();
      m.name='CC0 '+r.title+' / '+m.name;
      engine.stage.push(m);
     }
     engine.view='stage';
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

  function renderOverlay(){
   requestAnimationFrame(renderOverlay);
   drawAxisGizmo16();
   if(!g)return;
   const w=overlay.clientWidth,h=overlay.clientHeight;
   if(w<2||h<2)return;
   if(!A.measureMode && !A.measurePts.length && !A.creaseEnabled){
    if(overlay.width>0){g.clearRect(0,0,overlay.width,overlay.height);}
    return;
   }
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
   fandancer:{tag:'MÚA QUẠT / LỤA 9 NAN',color:'#6e3455',action:'fan',desc:'Vũ công múa quạt lụa truyền thống gắn 2 quạt 9 nan phát sáng trên hai cổ tay IK.'}
  };

  const ACT_PREVIEW_MAP16={
   band:'singer',
   dance:'dancer',
   led_dance:'leddancer',
   water_drums:'waterdrummer',
   laser:'laserdancer',
   fan_dance:'fandancer',
   ribbon:'fandancer',
   keymoment:'leddancer'
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
   const w=cvs?.width||160, h=cvs?.height||110;
   const list=(entries||[]).map(e=>e?.mesh?e:{mesh:e,matrix:null}).filter(e=>e.mesh?.p?.length>=9);
   if(!list.length)return svgFallbackPreviewURL16(opts.title,opts.subtitle,opts.accent);

   let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
   for(const {mesh,matrix} of list){
    const p=mesh.p, step=Math.max(3,Math.floor(p.length/360)*3);
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
   if(!Number.isFinite(minX)){minX=-1;maxX=1;minY=0;maxY=2;minZ=-1;maxZ=1;}
   const cx=(minX+maxX)*.5, cy=(minY+maxY)*.5, cz=(minZ+maxZ)*.5;
   const spanX=maxX-minX, spanY=maxY-minY, spanZ=maxZ-minZ;
   const radius=Math.max(0.35,Math.hypot(spanX,spanY,spanZ)*.5);
   const yaw=opts.yaw??0.48, pitch=opts.pitch??0.22;
   const cyaw=Math.cos(yaw), syaw=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
   const camDist=radius*(opts.zoom??2.05);
   const fovScale=Math.min(w,h)*(opts.fovScale??1.02);
   const screenCX=w*.5, screenCY=h*.52;

   function projectPt(x,y,z){
    const dx=x-cx, dy=y-cy, dz=z-cz;
    const rx=dx*cyaw-dz*syaw;
    const rz=dx*syaw+dz*cyaw;
    const ry=dy*cp-rz*sp;
    const cz2=dy*sp+rz*cp+camDist;
    if(cz2<=0.08)return null;
    const inv=fovScale/cz2;
    return {x:screenCX+rx*inv, y:screenCY-ry*inv, z:cz2};
   }

   let totalTris=0;
   for(const {mesh} of list)totalTris+=Math.floor(mesh.p.length/9);
   const maxTris=opts.maxTris||1400;
   const triStride=Math.max(1,Math.ceil(totalTris/maxTris));

   const tris=[];
   let triIdx=0;
   for(const {mesh,matrix} of list){
    const p=mesh.p, col=mesh.material?.color||[0.62,0.72,0.84], em=mesh.material?.emissive||[0,0,0];
    for(let i=0;i+8<p.length;i+=9){
     if((triIdx++%triStride)!==0)continue;
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
     const ux=x1-x0, uy=y1-y0, uz=z1-z0;
     const vx=x2-x0, vy=y2-y0, vz=z2-z0;
     let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
     const nl=Math.hypot(nx,ny,nz)||1;
     nx/=nl;ny/=nl;nz/=nl;
     const keyDot=Math.max(0,nx*0.42+ny*0.74+nz*0.52);
     const rimDot=Math.max(0,-nx*0.55+ny*0.35-nz*0.75);
     const shade=0.34+keyDot*0.64+rimDot*0.26;
     const r=Math.min(255,Math.round(((col[0]??0.65)*shade+(em[0]||0)*0.85)*255));
     const g=Math.min(255,Math.round(((col[1]??0.72)*shade+(em[1]||0)*0.85+rimDot*0.06)*255));
     const b=Math.min(255,Math.round(((col[2]??0.82)*shade+(em[2]||0)*0.85+rimDot*0.14)*255));
     tris.push({
      z:(s0.z+s1.z+s2.z)*0.3333,
      x0:s0.x,y0:s0.y,x1:s1.x,y1:s1.y,x2:s2.x,y2:s2.y,
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

   ctx.clearRect(0,0,w,h);
   const bg=ctx.createRadialGradient(w*.5,h*.38,8,w*.5,h*.5,Math.max(w,h)*.72);
   bg.addColorStop(0,'rgba(32, 74, 110, 0.36)');
   bg.addColorStop(1,'rgba(6, 11, 20, 0.98)');
   ctx.fillStyle=bg;
   ctx.fillRect(0,0,w,h);

   // Draw perspective floor stage ring at minY
   ctx.strokeStyle='rgba(97, 232, 255, 0.22)';
   ctx.lineWidth=1;
   const ringR=Math.max(spanX,spanZ)*0.62||0.65;
   ctx.beginPath();
   for(let a=0;a<=24;a++){
    const th=a/24*Math.PI*2;
    const p=projectPt(cx+Math.cos(th)*ringR,minY,cz+Math.sin(th)*ringR);
    if(!p)continue;
    if(a===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
   }
   ctx.stroke();

   for(const t of tris){
    ctx.fillStyle=t.fill;
    ctx.beginPath();
    ctx.moveTo(t.x0,t.y0);
    ctx.lineTo(t.x1,t.y1);
    ctx.lineTo(t.x2,t.y2);
    ctx.closePath();
    ctx.fill();
   }

   if(opts.badge){
    ctx.fillStyle='rgba(7, 15, 28, 0.78)';
    ctx.fillRect(6,6,Math.min(w-12,opts.badge.length*5.6+12),16);
    ctx.fillStyle=opts.accent||'#61e8ff';
    ctx.font='bold 9px Plus Jakarta Sans, Segoe UI, sans-serif';
    ctx.fillText(opts.badge,11,17);
   }
   try{
    const url=cvs.toDataURL('image/png');
    if(url && url.startsWith('data:image/'))return url;
   }catch(_){}
   return svgFallbackPreviewURL16(opts.title,opts.subtitle,opts.accent);
  }

  function getAssetPreviewURL16(kind){
   const cacheKey='asset:'+kind;
   if(A.previewCache.has(cacheKey))return A.previewCache.get(cacheKey);
   const spec=CATALOG[kind];
   if(!spec)return '';
   const meshes=buildAssetMeshes({id:'prev_'+kind,kind,name:spec.name,pos:[0,0,0],yaw:0,scale:1,color:spec.color});
   const cvs=document.createElement('canvas');
   cvs.width=160;cvs.height=104;
   const url=renderMeshes3DToCanvas16(cvs,meshes,{
    yaw:0.54,pitch:0.24,zoom:1.95,
    title:spec.name,subtitle:spec.label,accent:spec.color,badge:spec.cat
   });
   A.previewCache.set(cacheKey,url);
   return url;
  }

  function buildPerformerPreviewEntries16(type,opts={}){
   const meta=PERFORMER_META16[type]||PERFORMER_META16.singer;
   const actKey=(opts.action && opts.action!=='auto')?opts.action:meta.action;
   const col=opts.color||meta.color;
   const h=clamp16(opts.height||1.75,1.2,2.4);
   const t=opts.time??0.65;
   const entries=[];
   if(type==='audience'){
    const cols=['#34475c','#6d4c66','#3f6062'];
    for(let i=0;i<3;i++){
     const d={id:'__prev_aud_'+i,type:'audience',name:'Khán giả',pos:[(i-1)*0.58,0,(i===1?-0.18:0.12)],yaw:0,height:1.72,color:cols[i%3],skin:'#c49474',animate:false};
     const nodes=S.buildHuman(d,true,i);
     for(const node of nodes){
      const mat=S.castMatrix(d,node,t);
      for(const mesh of node.meshes||[])entries.push({mesh,matrix:mat});
     }
    }
    return entries;
   }
   const d={
    id:'__prev_cast_'+type+'_'+actKey,
    type,
    name:(S.castNames&&S.castNames[type])||type,
    pos:[0,0,0],
    yaw:0,
    height:h,
    color:col,
    skin:'#c49474',
    animate:true,
    phase:0.35,
    previewForceAnim16:true,
    previewAction16:actKey,
    previewEnergy16:0.82
   };
   const nodes=S.buildHuman(d,false,0);
   for(const node of nodes){
    const mat=S.castMatrix(d,node,t);
    for(const mesh of node.meshes||[])entries.push({mesh,matrix:mat});
   }
   return entries;
  }

  function getPerformerPreviewURL16(type,action='auto'){
   const meta=PERFORMER_META16[type]||PERFORMER_META16.singer;
   const actKey=(action&&action!=='auto')?action:meta.action;
   const cacheKey='cast:'+type+':'+actKey;
   if(A.previewCache.has(cacheKey))return A.previewCache.get(cacheKey);
   const entries=buildPerformerPreviewEntries16(type,{action:actKey,time:0.65});
   const cvs=document.createElement('canvas');
   cvs.width=160;cvs.height=120;
   const url=renderMeshes3DToCanvas16(cvs,entries,{
    yaw:type==='drummer'||type==='keyboardist'?0.42:0.34,
    pitch:0.18,
    zoom:1.88,
    title:(S.castNames&&S.castNames[type])||type,
    subtitle:meta.tag,
    accent:meta.color,
    badge:meta.tag
   });
   A.previewCache.set(cacheKey,url);
   return url;
  }

  function getActPreviewURL16(actId){
   const role=ACT_PREVIEW_MAP16[actId]||'dancer';
   const actAction=actId==='fan_dance'?'fan':actId==='ribbon'?'wave':actId==='laser'?'spin':actId==='water_drums'?'drum':actId==='keymoment'?'finale':'dance';
   return getPerformerPreviewURL16(role,actAction);
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
    updatePropLivePreview16();
   });
   const stop=()=>{dragging=false;};
   cvs.addEventListener('pointerup',stop);
   cvs.addEventListener('pointercancel',stop);
   updatePropLivePreview16();
  }

  function paint(){
   document.body.classList.toggle('v16-asset-open',A.isOpen);
   const topBtn=$('v16AssetBtn');
   if(topBtn)topBtn.classList.toggle('active',A.isOpen);
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
       <canvas id="v16PropLiveCanvas" width="160" height="120" title="Kéo chuột để xoay mô hình đạo cụ 3D"></canvas>
       <div class="v16-live-meta">
        <strong id="v16PropLiveTitle">${esc16(prevSpec.name)}</strong>
        <small id="v16PropLiveDesc">${esc16(prevSpec.cat)} · ${esc16(prevSpec.desc||prevSpec.label)}</small>
        <div class="v16-grid">
         <button data-add16="${esc16(prevKind)}" id="v16PropLiveAddBtn" class="btn small primary">+ Đặt vào sân khấu</button>
         <button data-act16="openCast" class="btn small">🕺 Người 3D</button>
        </div>
       </div>
      </div>
     </section>
     <section class="v16-section">
      <h4>THƯ VIỆN ĐẠO CỤ & KẾT CẤU SÂN KHẤU 3D (OFFLINE)</h4>
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
    bodyHtml=`
     <section class="v16-section">
      <h4>TÌM ASSET ONLINE MIỄN PHÍ (CC0 / CC-BY · KHÔNG CẦN API KEY)</h4>
      <label>Nguồn dữ liệu mở
       <select id="v16SearchSource">
        <option value="polyhaven_models" ${A.searchSource==='polyhaven_models'?'selected':''}>Poly Haven — Mô hình 3D Đạo cụ / Nội thất (CC0)</option>
        <option value="polyhaven_textures" ${A.searchSource==='polyhaven_textures'?'selected':''}>Poly Haven — Texture / Phông nền Sân khấu (CC0)</option>
        <option value="wikimedia_images" ${A.searchSource==='wikimedia_images'?'selected':''}>Wikimedia Commons — Ảnh / Visual Sân khấu (CC0 / CC-BY)</option>
       </select>
      </label>
      <div class="v16-searchbar">
       <input id="v16SearchInput" type="text" value="${esc16(A.searchQuery)}" placeholder="VD: chair, table, speaker, neon, brick, metal...">
       <button data-act16="search" class="btn primary small" ${A.searching?'disabled':''}>${A.searching?'Đang tìm...':'Tìm CC0'}</button>
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
         <button data-import16="${idx}" class="btn small primary">+ ${r.source==='polyhaven_model'?'Nạp 3D vào Stage':'Nạp làm Media LED'}</button>
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
      <h4>TẢI TRỌNG GIÓ & ĐỐI TRỌNG CHỐNG LẬT (TCVN 2737:2023)</h4>
      <div class="v16-grid">
       <label>Vận tốc gió V (m/s)<input data-w16="speed" type="number" min="0" max="50" step="1" value="${wReport.V}"></label>
       <label>Hệ số cản Cd<input data-w16="cd" type="number" min="0.5" max="2.0" step="0.05" value="${wReport.cd}"></label>
       <label>Sâu chân đế B (m)<input data-w16="baseDepth" type="number" min="0.4" max="6" step="0.1" value="${wReport.baseDepth}"></label>
       <label>Tự trọng (kg/m²)<input data-w16="selfKgPerM2" type="number" min="15" max="120" step="1" value="${wReport.selfKg}"></label>
      </div>
      <div class="v16-windbox ${sfOk?'ok':'warn'}">
       <div>Tổng diện tích LED đón gió: <b>${wReport.totalArea.toFixed(1)} m²</b> · Áp lực q: <b>${wReport.q.toFixed(0)} N/m²</b></div>
       <div>Lực đẩy ngang F: <b>${(wReport.totalForce/1000).toFixed(2)} kN</b> · Mô-men lật: <b>${(wReport.overturnMoment/1000).toFixed(2)} kN·m</b></div>
       <div>Hệ số an toàn chống lật (SF): <b>${wReport.currentSF.toFixed(2)}</b> (Chuẩn ≥ 1.50)</div>
       <div class="v16-ballast">Đối trọng (Ballast) cần dằn thêm: <b>${wReport.ballastKg.toLocaleString('en-US')} kg</b></div>
      </div>
     </section>
    `;
   }

   panel.innerHTML=`
    <div class="v16-head">
     <div>
      <strong>❖ ĐẠO CỤ 3D · TÌM CC0 · ĐO & TẢI GIÓ</strong>
      <small>Thư viện Sân khấu V16.0 · Poly Haven & Wikimedia · TCVN 2737</small>
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
   if(b.dataset.tab16){A.tab=b.dataset.tab16;paint();return;}
   if(b.dataset.add16){A.previewKind=b.dataset.add16;addCatalogItem(b.dataset.add16);return;}
   if(b.dataset.sel16){A.selected=b.dataset.sel16;paint();return;}
   if(b.dataset.import16!==undefined){importOnlineResult(+b.dataset.import16);return;}
   const act=b.dataset.act16;
   if(act==='close'){close();}
   else if(act==='openCast'){openCastLibrary16();}
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

  panel.addEventListener('change',e=>{
   const el=e.target;
   if(el.id==='v16SearchSource'){A.searchSource=el.value;return;}
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
  importModel=async function(...args){const prev=state.model,res=await oldImport(...args);if(state.model!==prev){A.items=[];A.selected=null;A.meshMap.clear();if(A.isOpen)paint();}return res;};
  demo=function(...args){const prev=state.model,res=oldDemo(...args);if(state.model!==prev){A.items=[];A.selected=null;A.meshMap.clear();if(A.isOpen)paint();}return res;};
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
   serialize:serializeAssets,restore:restoreAssets,
   getAssetPreviewURL16,getPerformerPreviewURL16,getActPreviewURL16,renderMeshes3DToCanvas16
  });

  // ============================================================================
  // INTERACTIVE 3D CAST PERFORMER & STAGE ACT LIBRARY (openCastLibrary16)
  // Shows live rotating 3D character preview + pose/costume controls + 3D thumbnails
  // ============================================================================
  let castLiveRAF16=0;
  let castModalBound16=false;
  function stopCastLiveLoop16(){
   if(castLiveRAF16){cancelAnimationFrame(castLiveRAF16);castLiveRAF16=0;}
   if(castModalBound16){$('modal')?.removeEventListener('close',stopCastLiveLoop16);castModalBound16=false;}
  }

  function renderCastLiveFrame16(nowMs=0){
   const cvs=$('v16CastLiveCanvas');
   const modal=$('modal');
   if(!cvs || !modal || !modal.open){stopCastLiveLoop16();return;}
   const type=(S.castNames&&S.castNames[A.castPreviewType])?A.castPreviewType:'fandancer';
   const meta=PERFORMER_META16[type]||PERFORMER_META16.singer;
   const tSec=(nowMs||performance.now())*0.001;
   if(!cvs._dragging16)A.castPreviewYaw=0.32+Math.sin(tSec*0.75)*0.48;
   const entries=buildPerformerPreviewEntries16(type,{
    action:A.castPreviewAction,
    color:A.castPreviewColor||meta.color,
    height:A.castPreviewHeight||1.75,
    time:tSec
   });
   renderMeshes3DToCanvas16(cvs,entries,{
    yaw:A.castPreviewYaw,
    pitch:0.18,
    zoom:1.82,
    title:(S.castNames&&S.castNames[type])||type,
    subtitle:meta.tag,
    accent:A.castPreviewColor||meta.color,
    badge:meta.tag
   });
   castLiveRAF16=requestAnimationFrame(renderCastLiveFrame16);
  }

  function selectCastPreviewRole16(type){
   if(!S.castNames||!S.castNames[type])return;
   const meta=PERFORMER_META16[type]||PERFORMER_META16.singer;
   A.castPreviewType=type;
   A.castPreviewColor=meta.color;
   const titleEl=$('v16CastStageTitle'), descEl=$('v16CastStageDesc'), colInp=$('v16CastColorInp'), addBtn=$('v16CastAddBtn');
   if(titleEl)titleEl.textContent=`${S.castNames[type]} (${meta.tag})`;
   if(descEl)descEl.textContent=meta.desc;
   if(colInp)colInp.value=meta.color;
   if(addBtn)addBtn.textContent=`+ Thêm "${S.castNames[type]}" vào sân khấu`;
   document.querySelectorAll('.v16-cast-card[data-add-person]').forEach(c=>{
    c.classList.toggle('active',c.dataset.addPerson===type);
   });
   if(!castLiveRAF16)renderCastLiveFrame16(performance.now());
  }

  function openCastLibrary16(){
   stopCastLiveLoop16();
   const roles=Object.entries(S.castNames||{});
   if(!S.castNames?.[A.castPreviewType])A.castPreviewType=roles[0]?.[0]||'singer';
   const curMeta=PERFORMER_META16[A.castPreviewType]||PERFORMER_META16.singer;
   A.castPreviewColor=curMeta.color;
   const curName=(S.castNames&&S.castNames[A.castPreviewType])||'Người 3D';
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
    <div class="v16-cast-stage">
     <div class="v16-cast-canvas-wrap">
      <canvas id="v16CastLiveCanvas" width="260" height="196" title="Kéo chuột trái/phải để xoay xem nhân vật 3D 360°"></canvas>
      <span class="v16-cast-canvas-hint">🔄 Kéo trên khung 3D để xoay 360° · Tự động diễn thử khớp IK</span>
     </div>
     <div class="v16-cast-controls">
      <span class="eyebrow">XEM TRƯỚC MÔ HÌNH NHÂN VẬT 3D & ĐẠO CỤ CẦM TAY</span>
      <h4 id="v16CastStageTitle">${esc16(curName)} (${esc16(curMeta.tag)})</h4>
      <p id="v16CastStageDesc">${esc16(curMeta.desc)}</p>
      <div class="v16-cast-form">
       <label>Động tác xem trước 3D
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
       <button type="button" class="btn primary" id="v16CastAddBtn">+ Thêm "${esc16(curName)}" vào sân khấu</button>
       <button type="button" class="btn" id="v16CastPlaceNewBtn">⌖ Thêm &amp; Click đặt lên sàn 3D</button>
      </div>
     </div>
    </div>
    <div class="cast-add v16-cast-grid">
     ${roles.map(([id,name])=>{
      const m=PERFORMER_META16[id]||{tag:'STAGE CAST 3D',color:'#38bdf8'};
      const thumb=getPerformerPreviewURL16(id);
      return `<button type="button" class="cast-card v16-cast-card ${id===A.castPreviewType?'active':''}" data-add-person="${esc16(id)}">
       <div class="v16-cast-thumb"><img src="${thumb}" alt="${esc16(name)}"></div>
       <span>${esc16(m.tag)}</span>
       <div class="v16-cast-card-foot"><b>${esc16(name)}</b><small>+ Thêm</small></div>
      </button>`;
     }).join('')}
    </div>
    ${actEntries.length?`
     <details style="margin-bottom:10px">
      <summary style="cursor:pointer;font-size:11px;font-weight:700;color:var(--accent-primary);margin-bottom:6px">▸ Thêm nhanh Cụm Tiết mục 3D theo đội hình (${actEntries.length} đội hình mẫu)</summary>
      <div class="dir-act-grid" style="margin-top:6px">
       ${actEntries.map(([id,s])=>`
        <button type="button" data-cast-act16="${esc16(id)}">
         <img class="v16-act-thumb" src="${getActPreviewURL16(id)}" alt="${esc16(s.name)}">
         <small>${esc16(s.tag)}</small>
         <strong>${esc16(s.name)}</strong>
         <span>+ THÊM ĐỘI HÌNH 3D</span>
        </button>`).join('')}
      </div>
     </details>`:''}
    <div class="seq-tools" style="margin-bottom:10px">
     <label><input id="castAnimate" type="checkbox" ${S.seq?.animate?'checked':''}>Chuyển động theo beat</label>
     <button class="btn" id="frameCast">Toàn cảnh + người</button>
     <button class="btn" id="exportCast">Xuất GLB tư thế hiện tại</button>
    </div>
    <div id="castRows"></div>
    <p class="hint-text">Di chuột qua từng thẻ để xem trước nhân vật 3D ở khung trên; bấm vào thẻ hoặc nút "+ Thêm" để đưa nhân vật lên sân khấu.</p>
   `,[{label:'Đóng',action:()=>stopCastLiveLoop16()}]);

   $('modal')?.classList.add('pro-wide');
   castModalBound16=true;
   $('modal')?.addEventListener('close',stopCastLiveLoop16,{once:true});

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
     stopCastLiveLoop16();
     $('modal')?.close();
     engine.view='stage';
     state.pickTask=null;
     const qh=$('quadHint');
     if(qh){qh.textContent='Click sàn để đặt '+p.name+'. Esc: hủy.';qh.classList.remove('hidden');}
    }
    return p;
   }

   $('v16CastAddBtn')?.addEventListener('click',()=>addConfiguredPerson16(A.castPreviewType,false));
   $('v16CastPlaceNewBtn')?.addEventListener('click',()=>addConfiguredPerson16(A.castPreviewType,true));

   document.querySelectorAll('.v16-cast-card[data-add-person]').forEach(btn=>{
    const role=btn.dataset.addPerson;
    btn.addEventListener('pointerenter',()=>selectCastPreviewRole16(role));
    btn.addEventListener('focus',()=>selectCastPreviewRole16(role));
    btn.onclick=()=>{
     selectCastPreviewRole16(role);
     addConfiguredPerson16(role,false);
    };
   });

   document.querySelectorAll('[data-cast-act16]').forEach(btn=>{
    btn.onclick=()=>{
     const actId=btn.dataset.castAct16;
     const a=S.addAct8?.(actId);
     if(a){
      S.renderCastManager?.();
      toast('Đã thêm đội hình 3D: '+a.name);
     }
    };
   });

   if($('castAnimate'))$('castAnimate').onchange=e=>{if(S.seq)S.seq.animate=e.target.checked;};
   if($('frameCast'))$('frameCast').onclick=()=>{stopCastLiveLoop16();S.frameCast?.();$('modal')?.close();};
   if($('exportCast'))$('exportCast').onclick=()=>S.exportCastGLB?.();
   S.renderCastManager?.();
   renderCastLiveFrame16(performance.now());
  }

  S.openCastLibrary16=openCastLibrary16;
  S.openCastLibrary=openCastLibrary16;
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
    {label:'🔒 Khóa / Mở khóa góc Camera',kbd:'',run:()=>$('lockCameraBtn')?.click()},
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
    {label:'🕺 Thêm Nhân vật 3D (Cast Performers · 10 vai)',kbd:'3D',thumb:getPerformerPreviewURL16('fandancer'),run:()=>openCastLibrary16()}
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
   document.body.classList.toggle('v16-hide-tshelf',A.tShelfHidden);
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
    hdr.classList.add('v16-acc-header');
    const key=(hdr.textContent||'').trim().slice(0,48)||('blk_'+idx);
    blk.dataset.v16AccKey=key;
    const isCollapsed=A.allBlocksCollapsed ? !A.collapsedBlocks.has('__open_'+key) : A.collapsedBlocks.has(key);
    blk.classList.toggle('v16-collapsed',isCollapsed);
   });
   // Inject 3D visual preview thumbnails into Director "Tiết mục 3D" (acts) cards if open
   ic.querySelectorAll('.dir-act-grid button[data-add-act8]').forEach(btn=>{
    if(btn.querySelector('.v16-act-thumb'))return;
    const actId=btn.dataset.addAct8;
    const url=getActPreviewURL16(actId);
    if(url){
     const img=document.createElement('img');
     img.className='v16-act-thumb';
     img.src=url;
     img.alt=actId;
     btn.prepend(img);
    }
   });
  }

  function syncBlenderState16(withAccordions){
   document.body.classList.add('v16-compact-ui');
   document.body.classList.toggle('v16-blender-ui',!!A.blenderUI);
   document.body.classList.toggle('v16-hide-tshelf',!!A.tShelfHidden);
   const activeDock=activeDockKey16();
   document.querySelectorAll('#v16PropRail button[data-prop16]').forEach(b=>{
    b.classList.toggle('active',b.dataset.prop16===activeDock);
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
    b.classList.toggle('active',on);
   });
   const crBtn=$('v16QuickCreaseBtn');if(crBtn)crBtn.classList.toggle('active',!!A.creaseEnabled);
   const msBtn=$('v16QuickMeasureBtn');if(msBtn)msBtn.classList.toggle('active',!!A.measureMode);
   const lkBtn=$('v16NavLockBtn');if(lkBtn)lkBtn.classList.toggle('active',!!engine?.camera?.locked);
   if(withAccordions)decorateInspectorAccordions16();
  }

  function installBlenderUI16(){
   document.body.classList.add('v16-compact-ui','v16-blender-ui');

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
     if(b.dataset.outliner16==='import'&&impSec){impSec.classList.toggle('v16-collapsed');b.classList.toggle('active',!impSec.classList.contains('v16-collapsed'));}
     if(b.dataset.outliner16==='media'&&medSec){medSec.classList.toggle('v16-collapsed');b.classList.toggle('active',!medSec.classList.contains('v16-collapsed'));}
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
      <button type="button" id="v16NavLockBtn" data-v16nav="lock" title="Khóa / Mở khóa góc Camera">🔒</button>
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
    nav.addEventListener('click',e=>{
     const b=e.target.closest('button[data-v16nav]');
     if(!b)return;
     const act=b.dataset.v16nav;
     if(act==='frame')$('overviewBtn')?.click();
     else if(act==='cam'){
      camIdx=(camIdx+1)%camOrder.length;
      document.querySelector(`#cameraBar [data-camera="${camOrder[camIdx]}"]`)?.click();
     }else if(act==='lock'){
      $('lockCameraBtn')?.click();
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
    const bodyObs=new MutationObserver(()=>syncBlenderState16(false));
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
     document.body.classList.toggle('v16-all-tools',A.allToolsVisible);
     t.classList.toggle('active',A.allToolsVisible);
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
 } catch(err) {
  console.error('V16 Asset Library init error:', err);
 }
})();
