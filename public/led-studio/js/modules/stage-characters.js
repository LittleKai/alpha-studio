/* Bundled skinned performers: local classic-script loading also supports file://. */
(function(){
 'use strict';
 const S=window.STUDIO;if(!S)return;
 try{
 const catalog=[
  {id:'stage-dancer',name:'Stage Dancer',role:'dancer',file:'stage_dancer',height:1.9126,clips:['Dance 01 - Stage Mix (16s)','Dance 02 - Charleston','Dance 03 - Body Roll','Dance 04 - Reach Hip','Dance 05 - Duo Mix (8s)']},
  {id:'stage-singer',name:'Stage Singer',role:'singer',file:'stage_singer',height:1.81446834,clips:['Singer 01 - Vocal Performance (8s)','Singer 02 - Audience Gesture (8s)','Singer 03 - Quiet Idle (6s)']}
 ];
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
  dialog(c.name,`<div class="stage-character18">
   <img src="${esc(base+id+'/thumbnail.png')}" alt="${esc(c.name)}" style="width:100%;max-height:300px;object-fit:contain">
   <p>${tr('Chuyển động theo timeline. Trang phục dùng atlas cố định.','Animation follows the timeline. Costume uses a fixed atlas.')}</p>
   <label>${tr('Động tác','Motion')}<select id="characterClip18">${c.clips.map((name,i)=>`<option value="${i}" ${i===(person?.clip18||0)?'selected':''}>${esc(name)}</option>`).join('')}</select></label>
   <label>${tr('Tốc độ','Speed')}<input id="characterSpeed18" type="number" min=".25" max="2" step=".05" value="${person?.speed18||1}"></label>
   <label>${tr('Chiều cao (m)','Height (m)')}<input id="characterHeight18" type="number" min="1.2" max="2.4" step=".05" value="${person?.height||1.75}"></label>
   <p id="characterError18" role="status"></p>
  </div>`,[{label:tr('Trở về thư viện','Back to library'),close:false,action:()=>S.openCastLibrary16()},
   {label:person?tr('Áp dụng','Apply'):tr('Thêm vào sân khấu','Add to stage'),primary:true,close:false}]);
  const submit=$('modalActions').querySelector('.primary');submit.id='characterAdd18';
  submit.onclick=async e=>{
   e.target.disabled=true;
   const options={clip18:+$('characterClip18').value,speed18:+$('characterSpeed18').value,height:+$('characterHeight18').value};
   try{
    if(person){checkpoint();Object.assign(person,sanitize({model18:id,...options}),{height:clamp(options.height||1.75,1.2,2.4)});S.rebuildCast();}
    else if(!await add(id,options))throw Error(tr('Tối đa 16 người.','Maximum 16 performers.'));
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
   b.textContent=tr('Động tác / tốc độ','Motion / speed');b.onclick=()=>openCharacter(p.model18,p);row.append(b);
  }
  return result;
 };
 function openLibrary(...args){
  const result=BASE.open(...args),grid=document.querySelector('.v16-cast-grid');
  if(grid)for(const c of catalog){
   const b=document.createElement('button');b.type='button';b.className='cast-card v16-cast-card';b.dataset.character18=c.id;
   b.innerHTML=`<div class="v16-cast-thumb"><img src="${esc(base+c.id+'/thumbnail.png')}" alt="${esc(c.name)}" decoding="async"></div><span>RIGGED / ${c.clips.length} CLIPS</span><div class="v16-cast-card-foot"><b>${esc(c.name)}</b></div>`;
   b.onclick=()=>openCharacter(c.id);grid.prepend(b);
  }
  return result;
 }
 S.characters18={catalog,load,add,sanitize};
 S.renderCastManager=renderCastManager;S.openCastLibrary16=S.openCastLibrary=openLibrary;
 if($('v07Cast'))$('v07Cast').onclick=openLibrary;
 }catch(err){console.error('[stage-characters]',err);}
})();
