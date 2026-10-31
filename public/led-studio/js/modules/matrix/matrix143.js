/* Creative LED Studio V15.1 — bright, readable Matrix with direct thickness control.
   Geometry stays in model metres; effects store their own immutable cue settings. */
(function () {
  'use strict';
  const S=window.STUDIO,G=window.Matrix143Geometry,FX=window.Matrix143FX,H=window.Matrix149Hierarchy,Q=window.Matrix150Quick;
  if(!S?.engine||!G||!FX||!H||!Q)return;
  const E=S.engine, state=S.state, $=id=>document.getElementById(id);
  const MAX_PATHS=256,MAX_POINTS=4096,MAX_CANDIDATES=2048,MAX_CANDIDATE_POINTS=300000,PAGE_SIZE=40,MAX_GUIDES=64,MAX_EDGE_SOURCES=32;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(+v)?+v:a));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validPoint=p=>Array.isArray(p)&&p.length===3&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<=1e5);
  const vec={add:(a,b)=>a.map((v,i)=>v+b[i]),sub:(a,b)=>a.map((v,i)=>v-b[i]),mul:(a,n)=>a.map(v=>v*n),dot:(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit:a=>{const d=Math.hypot(...a);return d>1e-9?a.map(v=>v/d):[0,0,1];}};
  const preset=id=>FX.presets.find(p=>p.id===id);
  const DEFAULT_SCAN={strategy:'components',mode:'auto',scope:'all',tolerance:.0001,planeTolerance:.0005,minLength:.01,simplifyTolerance:0,angleToleranceDegrees:1};
  const X={paths:[],selected:null,candidates:[],isOpen:false,tab:'paths',mode:'idle',draft:[],draftNormal:[0,0,1],pointIndex:0,
    masterBrightness:1,scan144:{...DEFAULT_SCAN},scanProgress:null,scanReport:null,candidateFilter:'',candidateKind:'all',candidatePage:0,candidateFocus:null,previewOnly:false,
    guideMode:'selected',creationGroupMode:'shared',creationGroupName:'Viền sân khấu',
    hierarchy149:null,hierarchyNodeId:null,edgeMode149:'main',
    quick150:false,quickPick150:false,quickFocus150:null,quickIncludeHoles150:false,quickPending150:null,
    blockExpanded:{},blockPages:{},meshId:'',outlineMode:'object',pickedFace:null,detectMode:'auto',detectMessage:'Bấm Quét lấy viền, rồi bấm trực tiếp vật thể trên 3D để chọn.',
    target:'all',duration:6,lastPreset:'chase',effect:FX.normalize({preset:'chase',speed:1,color:'#e5f5ff',color2:'#3574ff',tail:8,groupSize:4,brightness:1}),
    live:null,revision:0,geometryRevision:0};
  S.matrix143=X;
  let historyDepth=0,drag=null,scanEpoch=0,focusCamera=null,interactionCamera=null,hierarchyIndex149=new Map(),hierarchyParents149=new Map(),hierarchySources149=null,quickPointer150=null,quickNavigation150=null;
  function transaction(fn){if(historyDepth)return fn();checkpoint();const old=checkpoint;historyDepth++;checkpoint=()=>{};try{return fn();}finally{checkpoint=old;historyDepth--;}}
  function changed(geometry=true){X.revision++;if(geometry)X.geometryRevision++;}
  function current(){return X.paths.find(p=>p.id===X.selected)||null;}
  function makePath(points,options={}){
    if(!Array.isArray(points)||points.length<2||points.length>MAX_POINTS||!points.every(validPoint))throw Error('Viền cần từ 2 đến '+MAX_POINTS+' điểm 3D hợp lệ.');
    const clean=points.filter((p,i)=>!i||Math.hypot(...vec.sub(p,points[i-1]))>1e-6).map(p=>[...p]);
    if(clean.length>2&&Math.hypot(...vec.sub(clean[0],clean.at(-1)))<1e-6)clean.pop();
    const closed=options.closed===true;
    if(clean.length<(closed?3:2)||G.pathLength(clean,closed)<.001)throw Error('Đường viền quá ngắn hoặc chưa đủ điểm.');
    const sourceMesh=String(options.sourceMesh||'');if(sourceMesh.length>65536)throw Error('Mã object nguồn vượt 65.536 ký tự; đặt lại tên nhóm trong model.');
    let sourceMeshes;
    if(options.sourceMeshes!==undefined){
      if(!Array.isArray(options.sourceMeshes)||options.sourceMeshes.length<2||options.sourceMeshes.length>MAX_EDGE_SOURCES||options.sourceMeshes.some(k=>typeof k!=='string'||!k||k.length>65536||/[\u0000-\u001f]/.test(k))||new Set(options.sourceMeshes).size!==options.sourceMeshes.length)throw Error('Nhóm nguồn của viền cần 2–32 mã object khác nhau.');
      sourceMeshes=options.sourceMeshes.slice().sort();
    }
    const normal=validPoint(options.normal)&&Math.hypot(...options.normal)>1e-6?vec.unit(options.normal):[0,0,1];
    return {id:/^[A-Za-z0-9_-]{1,100}$/.test(options.id||'')?options.id:'MX143_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),
      name:String(options.name||'Viền LED '+(X.paths.length+1)).trim().slice(0,80),group:String(options.group||'DIECUT').trim().slice(0,40),
      points:clean,normal,closed,enabled:options.enabled!==false,reverse:options.reverse===true,
      width:clamp(options.width??.025,.001,.5),pitch:clamp(options.pitch??.06,.01,2),rows:Math.round(clamp(options.rows??3,1,8)),
      spacing:clamp(options.spacing??.07,0,1),offset:clamp(options.offset??0,-5,5),lift:clamp(options.lift??.008,.001,.5),
      brightness:clamp(options.brightness??.85,0,1),idle:clamp(options.idle??1,0,1),color:/^#[0-9a-f]{6}$/i.test(options.color)?options.color:'#dcedff',
      diffuser:options.diffuser!==false,glow:options.glow!==false,
      sourceMesh,sourceName:String(options.sourceName||'').slice(0,160),...(sourceMeshes?{sourceMeshes}:{}),...(typeof options.bindingInvalid==='boolean'?{bindingInvalid:options.bindingInvalid}:{})};
  }
  function addPath(points,options={},record=true){
    if(X.paths.length>=MAX_PATHS)throw Error('Tối đa '+MAX_PATHS+' đường viền trong một show.');
    const p=makePath(points,options);if(X.paths.some(q=>q.id===p.id))throw Error('Mã đường viền bị trùng.');
    const add=()=>{X.paths.push(p);X.selected=p.id;X.pointIndex=0;refreshCandidateBindings();changed();paint();return p;};return record?transaction(add):add();
  }
  function updatePath(id,changes={},record=true){const p=X.paths.find(p=>p.id===id);if(!p)return false;
    const next=makePath(changes.points||p.points,{...p,...changes,id:p.id});
    const geometry=['width','pitch','rows','spacing','offset','lift','closed','diffuser','glow'].some(k=>next[k]!==p[k])||JSON.stringify(next.points)!==JSON.stringify(p.points)||JSON.stringify(next.normal)!==JSON.stringify(p.normal);
    const apply=()=>{Object.assign(p,next);X.pointIndex=Math.min(X.pointIndex,p.points.length-1);if(geometry)refreshCandidateBindings();changed(geometry);paint();return true;};return record?transaction(apply):apply();
  }
  function removePath(id){if(!X.paths.some(p=>p.id===id))return false;return transaction(()=>{X.paths=X.paths.filter(p=>p.id!==id);if(X.selected===id)X.selected=X.paths[0]?.id||null;refreshCandidateBindings();changed();paint();return true;});}
  function duplicatePath(id){const p=X.paths.find(p=>p.id===id);if(!p)return null;return addPath(p.points,{...p,id:null,name:p.name+' +',offset:p.offset+p.spacing*p.rows+.08});}
  function select(id){if(X.paths.some(p=>p.id===id)){X.selected=id;X.pointIndex=0;paint();return true;}return false;}
  function sourceMeshes(){return E.stage.filter(m=>!m.hidden&&m.p?.length>=9);}
  const folded=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
  const namedMesh=m=>/diecut|vach|panel|backdrop|scenic|border|vien|led|screen|stage|platform|step|stair|deck|san|floor/.test(folded(m.name));
  function normalizeScan(data={}){
    const q={...DEFAULT_SCAN,...data};
    if(!['dominant','components','allPlanes'].includes(q.strategy))q.strategy=DEFAULT_SCAN.strategy;
    if(!['auto','front','back','top','bottom','left','right'].includes(q.mode))q.mode='auto';
    if(!['all','named'].includes(q.scope))q.scope='all';
    for(const [k,min,max]of [['tolerance',.000001,.02],['planeTolerance',.000001,.05],['minLength',.001,100],['simplifyTolerance',0,.02],['angleToleranceDegrees',.05,10]])q[k]=clamp(q[k],min,max);
    return Object.fromEntries(Object.keys(DEFAULT_SCAN).map(key=>[key,q[key]]));
  }
  function configureScan(options={}){cancelScan(false);X.scan144=normalizeScan({...X.scan144,...options});X.detectMode=X.scan144.mode;X.detectMessage='Đã đổi thông số. Quét tổng thể từng khối hoặc lấy lại viền object đang chọn.';paint();return {...X.scan144};}
  function contourKey(path){
    const points=G.simplify(path.points,1e-7,path.closed),keys=points.map(p=>p.map(v=>Math.round(v*1e6)).join(','));
    if(!keys.length)return '';
    if(!path.closed){const a=keys.join(';'),b=keys.slice().reverse().join(';');return 'O|'+(a<b?a:b);}
    let at=0;for(let i=1;i<keys.length;i++)if(keys[i]<keys[at])at=i;
    const a=[],b=[];for(let i=0;i<keys.length;i++){a.push(keys[(at+i)%keys.length]);b.push(keys[(at-i+keys.length)%keys.length]);}
    const f=a.join(';'),r=b.join(';');return 'C|'+(f<r?f:r);
  }
  function refreshCandidateBindings(){
    if(!X.candidates.length)return;
    const existing=new Map(X.paths.map(p=>[String(p.sourceMesh)+'|'+contourKey(p),p.id]));
    for(const c of X.candidates){const key=c._contourKey||(c._contourKey=String(c.sourceMesh||'')+'|'+contourKey(c)),was=c.existingId;c.existingId=existing.get(key)||null;if(c.existingId||was)c.checked=false;}
  }
  function invalidateScanForModel(){
    if(X.draft.length){X.draft=[];setMode('idle');}
    X.pickedFace=null;
    const pending=!!X.scanProgress||X.candidates.length>0||!!X.hierarchy149;cancelScan(false);
    if(focusCamera){state.orbit=focusCamera.orbit;S.director.cameraFollow=focusCamera.follow;S.director.cameraMotion=focusCamera.motion;}
    X.candidates=[];X.scanReport=null;X.candidateFocus=null;X.quickFocus150=null;X.previewOnly=false;focusCamera=null;clearHierarchy149();
    if(pending)X.detectMessage='Model đã thay đổi vị trí hoặc kích thước. Quét lại để lấy viền đúng theo model mới.';
    if(pending&&X.isOpen)paint();
  }
  function createScan(meshes,options={}){
    if(!meshes)meshes=sourceMeshes();if(!Array.isArray(meshes))meshes=[meshes];
    meshes=meshes.filter(m=>m?.p?.length>=9&&!m.hidden);
    const settings={...normalizeScan({...X.scan144,mode:X.detectMode,...options}),...options,maxPaths:512,maxTriangles:300000};
    const existing=new Map(X.paths.map(p=>[String(p.sourceMesh)+'|'+contourKey(p),p.id]));
    return {meshes,settings,existing,paths:[],warnings:[],objects:[],points:0,seen:new Set(),stats:{meshes:meshes.length,processedMeshes:0,triangles:0,paths:0,foundPaths:0,existingPaths:0,skippedPaths:0,skippedMeshes:0,components:0,tJunctions:0,splitEdges:0,truncated:false}};
  }
  function blockGroupName(sourceMesh,componentIndex,sourceName){
    // An imported object may contain hundreds of disconnected components.
    // They share a control group; their actual contours remain separate.
    const text=String(sourceMesh)+'\0object';
    let a=2166136261,b=0x9e3779b9;
    for(let i=0;i<text.length;i++){const code=text.charCodeAt(i);a=Math.imul(a^code,16777619);b=Math.imul(b^code,2246822507);b^=b>>>13;}
    const suffix=(a>>>0).toString(36).padStart(7,'0')+(b>>>0).toString(36).padStart(7,'0');
    const name=String(sourceName||'Khối').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,23);
    return name+' ['+suffix+']';
  }
  function scanMesh(job,mesh){
    const name=String(mesh.name||'Object '+(job.stats.processedMeshes+1));
    let result;try{result=G.extract(mesh,job.settings);}catch(error){job.warnings.push(name+': '+error.message);job.stats.skippedMeshes++;job.stats.processedMeshes++;job.objects.push({name,paths:0,error:error.message});return;}
    const stat=result.stats||{};job.stats.processedMeshes++;job.stats.triangles+=stat.processedTriangles||0;
    for(const k of ['components','tJunctions','splitEdges'])job.stats[k]+=stat[k]||0;
    if(stat.truncated){job.stats.truncated=true;if(!result.paths.length)job.stats.skippedMeshes++;}
    job.warnings.push(...result.warnings.map(w=>name+': '+w));job.stats.foundPaths+=result.paths.length;
    const detail={name,meshId:mesh.id,paths:result.paths.length,triangles:stat.processedTriangles||0,components:stat.components||0,truncated:!!stat.truncated,warnings:result.warnings};job.objects.push(detail);
    for(let i=0;i<result.paths.length;i++){
      const path=result.paths[i],points=path.points;
      if(points.length>MAX_POINTS){job.stats.skippedPaths++;job.stats.truncated=true;job.warnings.push(name+': viền '+(i+1)+' có '+points.length+' điểm, vượt '+MAX_POINTS+'. Tách object hoặc chủ động đặt sai số gọn điểm; phần mềm không tự xóa góc.');continue;}
      if(job.paths.length>=MAX_CANDIDATES||job.points+points.length>MAX_CANDIDATE_POINTS){job.stats.skippedPaths++;job.stats.truncated=true;continue;}
      const sourceMesh=String(mesh.sourceKey||mesh.id||''),key=sourceMesh+'|'+contourKey(path);
      if(job.seen.has(key))continue;job.seen.add(key);
      const existingId=job.existing.get(key)||null;
      if(existingId)job.stats.existingPaths++;
      const ledOptions=job.settings.batch147?{group:blockGroupName(sourceMesh,path.componentIndex,name)}:undefined;
      job.paths.push({...path,sourceMeshes:undefined,points,id:'candidate_'+job.paths.length,name:name+' / '+(i+1),sourceMesh,sourceName:name,checked:false,existingId,_contourKey:key,...(ledOptions?{ledOptions}:{})});job.points+=points.length;
    }
    job.stats.paths=job.paths.length;
  }
  function publishScan(job){
    if(job.stats.skippedPaths)job.warnings.push(job.stats.skippedPaths+' viền chưa đưa vào danh sách do giới hạn điểm / kết quả. Chọn riêng object trong phần Chi tiết quét để kiểm tra tiếp.');
    restoreFocusCamera();X.candidates=job.paths;refreshCandidateBindings();job.stats.existingPaths=job.paths.filter(p=>p.existingId).length;
    const eligible=job.paths.filter(p=>!p.existingId),available=MAX_PATHS-X.paths.length;
    for(const p of job.paths)p.checked=false;
    X.candidates=job.paths;X.candidateFocus=null;X.previewOnly=false;X.candidatePage=0;X.candidateFilter='';X.candidateKind='all';X.blockExpanded={};X.blockPages={};focusCamera=null;
    job.stats.blocks=candidateBlocks(X.candidates).length;
    const warnings=[...new Set(job.warnings)];X.scanReport={stats:{...job.stats},settings:{...job.settings},objects:job.objects,warnings};X.scanProgress=null;
    X.quick150=job.settings.quick150===true;X.quickFocus150=null;X.guideMode=X.quick150?'all':'selected';
    X.detectMessage='Đã quét '+job.stats.processedMeshes+'/'+job.stats.meshes+' object · '+job.stats.blocks+' nhóm object · '+job.paths.length+' viền gợi ý'+(job.stats.existingPaths?' · '+job.stats.existingPaths+' viền đã gắn LED':'')+'. ';
    X.detectMessage+=eligible.length?'Chưa chọn viền mới. Chọn object hoặc viền cần dùng rồi tạo LED; còn '+available+' chỗ.':'Không có viền mới. Có thể chọn riêng object để kiểm tra các mặt còn thiếu.';
    if(job.settings.hierarchy149){X.detectMessage='Khối '+job.settings.hierarchyLabel+' · '+job.paths.length+' viền cạnh từ '+job.stats.processedMeshes+' object. '+(job.stats.omittedPaths?'Còn '+job.stats.omittedPaths+' viền nhỏ / viền lỗ ngoài chế độ hiện tại; đổi Phạm vi cạnh khi cần. ':'')+'Chọn viền cần dùng rồi tạo LED.';}
    if(X.quick150)X.detectMessage='Đã lấy '+job.paths.length+' viền. Bấm trực tiếp vật thể 3D để chọn; bấm lại để bỏ chọn.'+(job.stats.existingPaths?' '+job.stats.existingPaths+' viền đã có LED.':'');
    if(job.stats.truncated||warnings.length)X.detectMessage+=X.quick150?' Mở Tùy chọn thêm → Thông tin quét để xem chi tiết.':' Mở Chi tiết quét để xem các trường hợp cần kiểm tra.';
    X.tab='paths';paint();return {paths:job.paths,stats:job.stats,warnings};
  }
  function cancelScan(notify=true){const busy=!!X.scanProgress;scanEpoch++;X.scanProgress=null;if(busy&&notify){X.detectMessage='Đã dừng quét. Các viền đã tạo được giữ nguyên; có thể chọn riêng object rồi quét tiếp.';paint();}return busy;}
  function detect(meshes,options={}){cancelScan(false);const job=createScan(meshes,options);for(const mesh of job.meshes)scanMesh(job,mesh);return publishScan(job);}
  function selectSource(meshOrId){
    if(meshOrId==null||meshOrId==='')throw Error('Chọn một object đang hiện trên model.');
    const mesh=sourceMeshes().find(m=>m===meshOrId||m.id===meshOrId||m.sourceKey===meshOrId);
    if(!mesh)throw Error('Chọn một object đang hiện trên model.');
    if(X.meshId!==mesh.id){cancelScan(false);restoreFocusCamera();X.candidates=[];X.scanReport=null;X.candidateFocus=null;X.previewOnly=false;X.pickedFace=null;}
    X.meshId=mesh.id;state.selectedMesh=mesh.id;
    if(S.director)S.director.selection={kind:'mesh',id:mesh.sourceKey||mesh.id};
    X.detectMessage='Đang chọn: '+(mesh.name||'Object không tên')+'. Bấm Lấy viền object để xem đường biên.';
    paint();return mesh;
  }
  function traceObject(meshOrId=null,options={}){
    const id=meshOrId||X.meshId||state.selectedMesh;
    if(id==null||id==='')throw Error('Chọn object trong danh sách hoặc bấm chọn object trên 3D.');
    const mesh=sourceMeshes().find(m=>m===id||m.id===id||m.sourceKey===id);
    if(!mesh)throw Error('Chọn object trong danh sách hoặc bấm chọn object trên 3D.');
    selectSource(mesh);
    const hit=options.hit||X.pickedFace,settings={...options};delete settings.hit;
    if(hit&&hit.meshId===mesh.id)X.pickedFace={meshId:mesh.id,normal:[...hit.normal],point:[...hit.point]};
    if(X.outlineMode==='face'){
      if(!hit||hit.meshId!==mesh.id)throw Error('Bấm chọn một mặt trên object để lấy riêng viền mặt đó.');
      Object.assign(settings,{normal:hit.normal,planePoint:hit.point});
    }else if(hit&&hit.meshId===mesh.id&&X.detectMode==='auto')Object.assign(settings,{preferredNormal:hit.normal,preferredPoint:hit.point});
    return scanStageAsync([mesh],settings);
  }
  function stageScanMeshes(){const meshes=sourceMeshes();return (X.scan144.scope==='named'?meshes.filter(namedMesh):meshes).sort((a,b)=>Number(namedMesh(b))-Number(namedMesh(a)));}
  function scanStage(){return detect(stageScanMeshes(),{mode:X.detectMode});}
  function clearHierarchy149(){X.hierarchy149=null;X.hierarchyNodeId=null;hierarchyIndex149=new Map();hierarchyParents149=new Map();hierarchySources149=null;}
  function hierarchySourceSignature149(mesh){return String(mesh.sourceKey||mesh.id||'')+'|'+String(mesh.name||'')+'|'+String(mesh.nodePath||'')+'|'+JSON.stringify(mesh.bounds||null);}
  function hierarchyIsCurrent149(){
    if(!hierarchySources149||E.stage!==hierarchySources149.stage)return false;
    const meshes=sourceMeshes();return meshes.length===hierarchySources149.sources.length&&meshes.every((m,i)=>{const s=hierarchySources149.sources[i];return m===s.mesh&&m.p===s.p&&m.p.length===s.length&&hierarchySourceSignature149(m)===s.signature;});
  }
  function requireHierarchy149(){
    if(!X.hierarchy149)throw Error('Bấm Quét khối lớn trước.');
    if(!hierarchyIsCurrent149()){invalidateScanForModel();throw Error('Model đã thay đổi. Quét lại khối lớn để cập nhật vị trí và các nhóm.');}
  }
  function getHierarchyView(){
    const root=X.hierarchy149?.root;if(!root)return null;
    const node=hierarchyIndex149.get(X.hierarchyNodeId)||root,ancestors=[];
    let parent=hierarchyParents149.get(node.id);while(parent){const item=hierarchyIndex149.get(parent);if(!item)break;ancestors.unshift(item);parent=hierarchyParents149.get(parent);}
    return {root,node,ancestors,children:node.children,stats:X.hierarchy149.stats,meshCount:node.meshKeys.length,canScan:node.meshKeys.length>0&&node.meshKeys.length<=MAX_EDGE_SOURCES&&(node.id!==root.id||root.meshKeys.length===1)};
  }
  function navigateHierarchy(id){
    requireHierarchy149();const node=hierarchyIndex149.get(id);if(!node)throw Error('Khối này không còn trong model.');
    if(X.draft.length||X.mode==='draw')throw Error('Hoàn tất hoặc hủy đường đang vẽ trước khi đổi khối.');
    cancelScan(false);restoreFocusCamera();X.hierarchyNodeId=id;X.candidates=[];X.scanReport=null;X.candidateFocus=null;X.previewOnly=false;X.guideMode='selected';X.candidatePage=0;X.candidateFilter='';X.candidateKind='all';X.blockExpanded={};X.blockPages={};
    X.detectMessage='Đang chọn khối '+node.label+' · '+node.meshKeys.length+' object. '+(node.children.length?'Mở tiếp khối nhỏ hoặc lấy viền cạnh trong phạm vi này.':'Bấm Lấy viền cạnh khối này.');
    X.tab='paths';X.lastPaintTab='hierarchy149';paint();return getHierarchyView();
  }
  function focusHierarchy(id=X.hierarchyNodeId){
    requireHierarchy149();const node=hierarchyIndex149.get(id);if(!node?.bounds)throw Error('Khối này chưa có kích thước hợp lệ để soi.');
    if(!focusCamera)focusCamera={camera:structuredClone(E.camera),fit:E._fitOnResize,view:E.view,orbit:state.orbit,follow:S.director.cameraFollow,motion:S.director.cameraMotion?structuredClone(S.director.cameraMotion):null};
    X.candidateFocus=null;X.previewOnly=false;E.view='stage';E._fitOnResize=false;state.orbit=false;S.director.cameraFollow=false;S.director.cameraMotion=null;fitCamera8(node.bounds);paint();return true;
  }
  function scanAllBlocks(){
    const meshes=sourceMeshes();if(!meshes.length)throw Error('Chưa có object đang hiện để quét. Nạp model trước.');
    if(X.draft.length||X.mode==='draw')throw Error('Hoàn tất hoặc hủy đường đang vẽ trước khi quét.');
    setMode('idle');cancelScan(false);restoreFocusCamera();
    const result=H.build(meshes,{maxChildren:8,maxDepth:12,maxNodes:8192});
    clearHierarchy149();X.hierarchy149=result;X.hierarchyNodeId=result.root.id;
    const visit=(node,parent=null)=>{hierarchyIndex149.set(node.id,node);if(parent)hierarchyParents149.set(node.id,parent);for(const child of node.children)visit(child,node.id);};visit(result.root);
    hierarchySources149={stage:E.stage,sources:meshes.map(mesh=>({mesh,p:mesh.p,length:mesh.p.length,signature:hierarchySourceSignature149(mesh)}))};
    X.candidates=[];X.scanReport=null;X.candidateFocus=null;X.previewOnly=false;X.guideMode='selected';X.candidateFilter='';X.candidateKind='all';X.blockExpanded={};X.blockPages={};
    X.detectMessage='Đã nhận '+result.root.children.length+' khối lớn từ '+meshes.length+' object. Chọn khối lớn, mở khối nhỏ rồi lấy viền cạnh. Chưa quét cạnh và chưa tạo LED.';
    X.tab='paths';X.lastPaintTab='hierarchy149';paint();return Promise.resolve({hierarchy:result,stats:result.stats,paths:[],warnings:result.warnings});
  }
  function collectiveSource149(keys){
    if(keys.length===1)return keys[0];const text=JSON.stringify(keys);let a=2166136261,b=0x9e3779b9;
    for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b^text.charCodeAt(i),2246822507);b^=b>>>13;}
    return 'mx149:'+(a>>>0).toString(36).padStart(7,'0')+(b>>>0).toString(36).padStart(7,'0');
  }
  function setQuickPick(enabled=true){
    enabled=enabled===true;
    if(enabled&&(X.draft.length||X.mode==='draw'))throw Error('Hoàn tất hoặc hủy đường đang vẽ trước khi chọn object.');
    if(!enabled&&!X.quickPick150){paint();return false;}
    if(enabled){
      if(!X.quickPick150||X.mode!=='idle')setMode('idle');restoreFocusCamera();
      if(!quickNavigation150)quickNavigation150={mode:S.director?.mode,cursor:E.canvas?.style?.cursor||''};
      if(!interactionCamera)interactionCamera={orbit:state.orbit,follow:S.director?.cameraFollow,motion:S.director?.cameraMotion};
      state.orbit=false;if(S.director){S.director.mode='navigate';S.director.cameraFollow=false;S.director.cameraMotion=null;}
      setPlaying(false);E.view='stage';if(E.canvas?.style)E.canvas.style.cursor='pointer';
    }else{
      if(quickNavigation150&&S.director?.mode==='navigate')S.director.mode=quickNavigation150.mode||'navigate';
      if(E.canvas?.style)E.canvas.style.cursor=quickNavigation150?.cursor||'';
      quickNavigation150=null;if(X.mode==='idle'&&!X.draft.length)releaseInteractionCamera();
    }
    X.quickPick150=enabled;quickPointer150=null;paint();return enabled;
  }
  function quickSettings150(options={}){
    return {...normalizeScan(X.scan144),strategy:'components',mode:'auto',scope:'all',simplifyTolerance:0,maxPaths:MAX_CANDIDATES,maxTriangles:300000,quick150:true,
      includeHoles:options.includeHoles===undefined?X.quickIncludeHoles150:options.includeHoles===true};
  }
  function collectQuickScope150(job,scope,meshes,hit=null){
    const settings={...job.settings};
    if(hit?.normal&&hit?.point){settings.preferredNormal=hit.normal;settings.preferredPoint=hit.point;}
    let result;try{result=G.extract(meshes,settings);}catch(error){
      job.stats.processedMeshes+=meshes.length;job.stats.skippedMeshes+=meshes.length;
      job.warnings.push(scope.label+': '+error.message);return;
    }
    const stat=result.stats||{},selected=Q.chooseContours(result.paths||[],settings.includeHoles?'all':'main');
    job.stats.processedMeshes+=meshes.length;job.stats.triangles+=stat.processedTriangles||0;
    for(const key of ['components','tJunctions','splitEdges'])job.stats[key]+=stat[key]||0;
    job.stats.foundPaths+=(result.paths||[]).length;job.stats.omittedPaths=(job.stats.omittedPaths||0)+(result.paths||[]).length-selected.paths.length;job.stats.omittedHoles=(job.stats.omittedHoles||0)+(selected.stats?.omittedHoles||0);
    if(stat.truncated)job.stats.truncated=true;
    job.warnings.push(...(result.warnings||[]).map(w=>scope.label+': '+w),...(selected.warnings||[]));
    job.objects.push({name:scope.label,paths:selected.paths.length,triangles:stat.processedTriangles||0,components:stat.components||0,truncated:!!stat.truncated,warnings:result.warnings||[]});
    for(const path of selected.paths){
      if(path.points.length>MAX_POINTS||job.paths.length>=MAX_CANDIDATES||job.points+path.points.length>MAX_CANDIDATE_POINTS){job.stats.skippedPaths++;job.stats.truncated=true;continue;}
      const indices=Array.isArray(path.meshIndices)&&path.meshIndices.length?path.meshIndices:meshes.map((_,i)=>i);
      const keys=[...new Set(indices.map(index=>meshes[index]).filter(Boolean).map(m=>String(m.sourceKey||m.id||'')))].sort();
      if(!keys.length||keys.length>MAX_EDGE_SOURCES){job.stats.skippedPaths++;job.stats.truncated=true;continue;}
      const sourceMesh=collectiveSource149(keys),key=sourceMesh+'|'+contourKey(path);
      if(job.seen.has(key))continue;job.seen.add(key);
      job.paths.push({...path,sourceMeshes:undefined,id:'candidate_'+job.paths.length,name:scope.label+' / '+(path.isHole?'Viền lỗ':'Viền cạnh'),sourceMesh,sourceName:scope.label,
        ...(keys.length>1?{sourceMeshes:keys}:{}),checked:false,existingId:job.existing.get(key)||null,_contourKey:key,quickScope150:scope.id,
        ledOptions:{rows:1,width:.06,group:blockGroupName(sourceMesh,null,scope.label)}});job.points+=path.points.length;
    }
    job.stats.paths=job.paths.length;
  }
  async function scanQuickEdges(options={}){
    const meshes=sourceMeshes();if(!meshes.length)throw Error('Nạp model sân khấu trước khi quét viền.');
    if(X.draft.length||X.mode==='draw')throw Error('Hoàn tất hoặc hủy đường đang vẽ trước khi quét.');
    const previousSelection=new Set(options.keepSelection===false?[]:X.candidates.filter(c=>c.checked===true&&!c.existingId).map(c=>c._contourKey||String(c.sourceMesh)+'|'+contourKey(c)));
    setQuickPick(true);cancelScan(false);restoreFocusCamera();clearHierarchy149();
    const token=scanEpoch,settings=quickSettings150(options),plan=Q.plan(meshes,{maxSources:MAX_EDGE_SOURCES,maxTriangles:300000}),byKey=new Map(meshes.map(m=>[String(m.sourceKey||m.id||''),m]));
    const job=createScan(meshes,settings),stage=E.stage,stageOrder=stage.slice(),sources=meshes.map(mesh=>({mesh,p:mesh.p,index:stage.indexOf(mesh),signature:hierarchySourceSignature149(mesh)})),sourceByKey=new Map(sources.map(s=>[String(s.mesh.sourceKey||s.mesh.id||''),s]));
    job.warnings.push(...(plan.warnings||[]));job.stats.quickScopes=plan.scopes.length;
    X.quickIncludeHoles150=settings.includeHoles;X.quick150=true;X.quickFocus150=null;X.candidateFocus=null;X.previewOnly=false;X.guideMode='all';X.tab='paths';X.lastPaintTab='quick150';
    X.scanProgress={done:0,total:meshes.length,paths:0,active:''};X.detectMessage='Đang quét lấy viền…';paint();
    const validSource=s=>s&&!s.mesh.hidden&&E.stage[s.index]===s.mesh&&s.mesh.p===s.p&&hierarchySourceSignature149(s.mesh)===s.signature;
    const valid=()=>E.stage===stage&&E.stage.length===stageOrder.length&&stageOrder.every((m,i)=>E.stage[i]===m)&&sources.every(validSource);
    const stale=()=>{invalidateScanForModel();X.detectMessage='Model đã thay đổi. Bấm Quét lấy viền để cập nhật.';paint();return {cancelled:true,modelChanged:true};};
    try{
      await new Promise(resolve=>setTimeout(resolve,0));let slice=Date.now();
      for(const scope of plan.scopes){
        if(token!==scanEpoch)return {cancelled:true};if(E.stage!==stage||E.stage.length!==stageOrder.length||!scope.meshKeys.every(key=>validSource(sourceByKey.get(key))))return stale();
        collectQuickScope150(job,scope,scope.meshKeys.map(key=>byKey.get(key)).filter(Boolean));
        X.scanProgress={done:job.stats.processedMeshes,total:meshes.length,paths:job.paths.length,active:scope.label};updateScanProgress();
        if(Date.now()-slice>=12){await new Promise(resolve=>setTimeout(resolve,0));slice=Date.now();}
      }
      await new Promise(resolve=>setTimeout(resolve,0));if(token!==scanEpoch)return {cancelled:true};if(!valid())return stale();
      job.paths.sort((a,b)=>(Math.abs(b.absArea??b.area??0)-Math.abs(a.absArea??a.area??0))||(b.length-a.length));
      const result=publishScan(job);for(const c of X.candidates)if(!c.existingId&&previousSelection.has(c._contourKey))c.checked=true;paint();return result;
    }catch(error){if(token===scanEpoch){X.scanProgress=null;X.detectMessage='Chưa quét xong: '+error.message;paint();}throw error;}
  }
  function quickCandidateScore150(candidate,point){
    if(!validPoint(point))return -(candidate.absArea||0);
    const n=vec.unit(candidate.normal),origin=candidate.points[0],normalDistance=Math.abs(vec.dot(vec.sub(point,origin),n)),drop=Math.abs(n[0])>Math.abs(n[1])?(Math.abs(n[0])>Math.abs(n[2])?0:2):(Math.abs(n[1])>Math.abs(n[2])?1:2),axes=[0,1,2].filter(k=>k!==drop);
    const x=point[axes[0]],y=point[axes[1]];let inside=false,distance=Infinity;
    for(let i=0;i<candidate.points.length-(candidate.closed?0:1);i++){
      const a=candidate.points[i],b=candidate.points[(i+1)%candidate.points.length],ax=a[axes[0]],ay=a[axes[1]],bx=b[axes[0]],by=b[axes[1]];
      if(candidate.closed&&((ay>y)!==(by>y))&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
      const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);distance=Math.min(distance,Math.hypot(x-ax-dx*t,y-ay-dy*t));
    }
    return normalDistance+(inside?0:distance)+Math.abs(candidate.absArea||0)*1e-10;
  }
  function quickCandidatesForHit150(hit){
    const key=String(hit.mesh.sourceKey||hit.mesh.id||''),matches=X.candidates.filter(c=>pathSourceKeys149(c).includes(key));
    if(!matches.length||!validPoint(hit.point))return matches;
    const outers=matches.filter(c=>!c.isHole),primary=(outers.length?outers:matches).slice().sort((a,b)=>quickCandidateScore150(a,hit.point)-quickCandidateScore150(b,hit.point))[0];
    if(primary.componentIndex===undefined)return [primary];
    return matches.filter(c=>c.quickScope150===primary.quickScope150&&c.componentIndex===primary.componentIndex);
  }
  async function pickQuickObject(hitOrMesh){
    if(X.draft.length||X.mode==='draw'||X.mode==='edit')throw Error('Hoàn tất thao tác vẽ hoặc sửa điểm trước khi chọn object.');
    const input=hitOrMesh?.mesh||hitOrMesh,mesh=sourceMeshes().find(m=>m===input||m.id===input||m.sourceKey===input);
    if(!mesh)return {changed:false,miss:true};
    const hit=hitOrMesh?.mesh?hitOrMesh:{mesh};
    setQuickPick(true);cancelScan(false);restoreFocusCamera();X.quick150=true;X.candidateFocus=null;X.previewOnly=false;X.tab='paths';
    let chosen=quickCandidatesForHit150(hit);
    if(!chosen.length){
      const token=scanEpoch,source={p:mesh.p,stage:E.stage,signature:hierarchySourceSignature149(mesh)},key=String(mesh.sourceKey||mesh.id||''),settings=quickSettings150();
      const job=createScan([mesh],settings),scope={id:'direct:'+key,label:String(mesh.name||'Object'),meshKeys:[key]};
      X.scanProgress={done:0,total:1,paths:0,active:scope.label};X.detectMessage='Đang lấy viền '+scope.label+'…';paint();
      await new Promise(resolve=>setTimeout(resolve,0));if(token!==scanEpoch)return {cancelled:true};
      collectQuickScope150(job,scope,[mesh],hit);
      await new Promise(resolve=>setTimeout(resolve,0));if(token!==scanEpoch)return {cancelled:true};
      if(E.stage!==source.stage||!E.stage.includes(mesh)||mesh.hidden||mesh.p!==source.p||hierarchySourceSignature149(mesh)!==source.signature){invalidateScanForModel();return {cancelled:true,modelChanged:true};}
      const prior=X.candidates.slice(),known=new Set(prior.map(c=>c._contourKey||String(c.sourceMesh)+'|'+contourKey(c)));
      const added=job.paths.filter(c=>!known.has(c._contourKey));let next=0;const ids=new Set(prior.map(c=>c.id));
      for(const c of added){while(ids.has('quick_candidate_'+next))next++;c.id='quick_candidate_'+next++;ids.add(c.id);}
      const protectedCandidates=prior.filter(c=>c.checked===true||c.existingId),optional=prior.filter(c=>c.checked!==true&&!c.existingId),merged=[...protectedCandidates,...added,...optional],kept=[];let points=0,omitted=0;
      for(const c of merged){if(kept.length>=MAX_CANDIDATES||points+c.points.length>MAX_CANDIDATE_POINTS){if(c.checked===true||c.existingId)throw Error('Danh sách viền đã chọn vượt giới hạn. Bỏ chọn bớt trước.');omitted++;continue;}kept.push(c);points+=c.points.length;}
      X.candidates=kept;refreshCandidateBindings();X.scanProgress=null;
      if(!X.scanReport)X.scanReport={stats:{...job.stats},settings:{...settings},objects:job.objects,warnings:job.warnings};
      else{X.scanReport.warnings.push(...job.warnings);X.scanReport.stats.paths=X.candidates.length;X.scanReport.stats.targetedScans=(X.scanReport.stats.targetedScans||0)+1;}
      if(omitted)X.scanReport.warnings.push('Đã thu gọn '+omitted+' gợi ý chưa chọn để ưu tiên object vừa bấm.');
      chosen=quickCandidatesForHit150(hit);
    }
    if(!chosen.length){X.detectMessage='Chưa lấy được viền của '+(mesh.name||'object này')+'. Thử tùy chọn mặt hoặc Vẽ đường viền.';paint();return {changed:false,paths:[]};}
    const available=chosen.filter(c=>!c.existingId),checked=available.some(c=>c.checked!==true);
    for(const c of available)c.checked=checked;
    X.quickFocus150=(available.find(c=>!c.isHole)||available[0]||chosen[0]).id;
    if(!['all','selected'].includes(X.guideMode))X.guideMode='all';
    if(!available.length){const existing=chosen.find(c=>c.existingId);if(existing)X.selected=existing.existingId;X.detectMessage='Viền của '+(mesh.name||'object này')+' đã có LED. Đang chọn viền để chỉnh.';}
    else X.detectMessage=(checked?'Đã chọn ':'Đã bỏ chọn ')+available.length+' viền của '+(mesh.name||'object')+'. Bấm thêm vật thể khác hoặc Tạo LED.';
    paint();return {changed:available.length>0,selected:checked,paths:chosen,mesh};
  }
  function trackQuickPointer150(type,event){
    if(type==='down'){quickPointer150=event.button===0?{id:event.pointerId,x:event.clientX,y:event.clientY,moved:false}:null;return;}
    if(type==='move'&&quickPointer150&&event.pointerId===quickPointer150.id){if(Math.hypot(event.clientX-quickPointer150.x,event.clientY-quickPointer150.y)>=4)quickPointer150.moved=true;return;}
    if(type==='cancel'||type==='up')quickPointer150=null;
  }
  function handleQuickClick(event){
    if(!X.quickPick150||!X.isOpen||X.tab!=='paths'||X.mode!=='idle'||X.draft.length||E.view!=='stage'||state.presenting||state.pickTask||state.quad||state.rebindId||S.director?.pick||(typeof sq!=='undefined'&&sq.placePerson)||$('modal')?.open)return false;
    if(event.button!==undefined&&event.button!==0)return false;
    if(quickPointer150&&(quickPointer150.moved||Math.hypot(event.clientX-quickPointer150.x,event.clientY-quickPointer150.y)>=4))return true;
    const hit=E.pick(event.clientX,event.clientY,false);
    if(!hit?.mesh){X.detectMessage='Bấm trực tiếp lên vật thể 3D cần lấy viền.';paint();return true;}
    X.quickPending150=pickQuickObject(hit).catch(error=>{X.scanProgress=null;X.detectMessage=error.message;toast(error.message);paint();return {error:error.message};});
    return true;
  }
  async function scanHierarchyEdges(id=X.hierarchyNodeId,options={}){
    requireHierarchy149();if(X.draft.length||X.mode==='draw')throw Error('Hoàn tất hoặc hủy đường đang vẽ trước khi lấy cạnh.');
    const node=hierarchyIndex149.get(id),root=X.hierarchy149.root;
    if(!node)throw Error('Chọn một khối còn trong model.');
    if(node.id===root.id&&root.meshKeys.length>1)throw Error('Mở một khối lớn trước; không lấy cạnh toàn sân khấu cùng lúc.');
    if(node.meshKeys.length>MAX_EDGE_SOURCES)throw Error('Khối này có '+node.meshKeys.length+' object. Mở tiếp khối nhỏ (tối đa '+MAX_EDGE_SOURCES+' object mỗi lượt lấy cạnh).');
    const byKey=new Map(sourceMeshes().map(m=>[String(m.sourceKey||m.id||''),m])),meshes=node.meshKeys.map(k=>byKey.get(k));
    if(!meshes.length||meshes.some(m=>!m))throw Error('Nguồn hình học của khối đã thay đổi. Quét lại khối lớn.');
    const edgeMode=['main','outer','all'].includes(options.edgeMode)?options.edgeMode:X.edgeMode149;
    const settings={...normalizeScan(X.scan144),strategy:'components',mode:'auto',scope:'all',simplifyTolerance:0,maxPaths:MAX_CANDIDATES,maxTriangles:300000,hierarchy149:node.id,hierarchyLabel:node.label,edgeMode};
    setMode('idle');cancelScan(false);const token=scanEpoch,job=createScan(meshes,settings),sources=meshes.map(mesh=>({mesh,p:mesh.p,signature:hierarchySourceSignature149(mesh)}));
    X.hierarchyNodeId=id;X.edgeMode149=edgeMode;X.scanProgress={done:0,total:meshes.length,paths:0,active:node.label};X.detectMessage='Đang lấy cạnh hình học trong khối '+node.label+'…';X.tab='paths';paint();
    const valid=()=>hierarchyIsCurrent149()&&sources.every(s=>s.mesh.p===s.p&&hierarchySourceSignature149(s.mesh)===s.signature);
    const stale=()=>{invalidateScanForModel();X.detectMessage='Model đã thay đổi trong lúc lấy cạnh. Quét lại khối lớn.';paint();return {cancelled:true,modelChanged:true};};
    try{
      await new Promise(resolve=>setTimeout(resolve,0));if(token!==scanEpoch)return {cancelled:true};if(!valid())return stale();
      // One geometric extraction across this block removes shared triangle and
      // material seams. It never joins disconnected pieces or invents a hull.
      const result=G.extract(meshes,settings),all=result.paths||[],outer=all.filter(p=>!p.isHole),closed=outer.filter(p=>p.closed);
      let chosen=all;if(edgeMode==='outer')chosen=outer;else if(edgeMode==='main')chosen=(closed.length?closed:outer).slice().sort((a,b)=>(Math.abs(b.absArea??b.area??0)-Math.abs(a.absArea??a.area??0))||b.length-a.length).slice(0,1);
      const stat=result.stats||{};Object.assign(job.stats,{processedMeshes:meshes.length,triangles:stat.processedTriangles||0,components:stat.components||0,tJunctions:stat.tJunctions||0,splitEdges:stat.splitEdges||0,foundPaths:all.length,omittedPaths:all.length-chosen.length,omittedHoles:all.filter(p=>p.isHole&&!chosen.includes(p)).length,truncated:!!stat.truncated});
      job.warnings.push(...(result.warnings||[]));job.objects.push({name:node.label,paths:chosen.length,triangles:job.stats.triangles,components:job.stats.components,truncated:!!stat.truncated,warnings:result.warnings||[]});
      for(let i=0;i<chosen.length;i++){
        const path=chosen[i];if(path.points.length>MAX_POINTS||job.paths.length>=MAX_CANDIDATES||job.points+path.points.length>MAX_CANDIDATE_POINTS){job.stats.skippedPaths++;job.stats.truncated=true;continue;}
        const indices=Array.isArray(path.meshIndices)&&path.meshIndices.length?path.meshIndices:meshes.map((_,i)=>i);
        const keys=[...new Set(indices.map(index=>meshes[index]).filter(Boolean).map(m=>String(m.sourceKey||m.id||'')))].sort();
        if(!keys.length){job.stats.skippedPaths++;continue;}
        const sourceMesh=collectiveSource149(keys),key=sourceMesh+'|'+contourKey(path),existingId=job.existing.get(key)||null;
        if(job.seen.has(key))continue;job.seen.add(key);
        job.paths.push({...path,sourceMeshes:undefined,id:'candidate_'+job.paths.length,name:node.label+' / '+(path.isHole?'Viền lỗ':'Viền cạnh')+' '+(i+1),sourceMesh,sourceName:node.label,...(keys.length>1?{sourceMeshes:keys}:{}),checked:false,existingId,_contourKey:key,ledOptions:{rows:1,group:blockGroupName(sourceMesh,null,node.label)}});job.points+=path.points.length;
      }
      job.stats.paths=job.paths.length;
      X.scanProgress={done:meshes.length,total:meshes.length,paths:job.paths.length,active:node.label};updateScanProgress();
      await new Promise(resolve=>setTimeout(resolve,0));if(token!==scanEpoch)return {cancelled:true};if(!valid())return stale();
      return publishScan(job);
    }catch(error){if(token===scanEpoch){X.scanProgress=null;X.detectMessage='Chưa lấy được cạnh: '+error.message;paint();}throw error;}
  }
  function updateScanProgress(){
    const p=X.scanProgress;if(!p)return;
    const label=panel.querySelector('[data-mxscan-progress]');if(label)label.textContent='Đang quét '+p.done+'/'+p.total+' object · '+p.paths+' viền'+(p.active?' · '+p.active:'');
    const bar=panel.querySelector('#mx147ScanProgress');if(bar){bar.max=Math.max(1,p.total);bar.value=p.done;}
  }
  async function scanStageAsync(meshes=null,options={}){
    cancelScan(false);const token=scanEpoch,job=createScan(meshes||stageScanMeshes(),options),stage=E.stage,stageOrder=stage.slice(),sources=job.meshes.map(mesh=>({mesh,p:mesh.p,index:stage.indexOf(mesh),sourceKey:mesh.sourceKey}));
    const validSource=s=>s.mesh.p===s.p&&!s.mesh.hidden&&s.mesh.sourceKey===s.sourceKey&&(s.index<0||E.stage[s.index]===s.mesh);
    const validStage=()=>E.stage===stage&&E.stage.length===stageOrder.length;
    const changedModel=()=>{invalidateScanForModel();X.detectMessage='Model đã thay đổi trong lúc quét. Bấm quét lại để lấy viền theo model mới.';paint();return {cancelled:true,modelChanged:true};};
    X.scanProgress={done:0,total:job.meshes.length,paths:0,active:''};X.detectMessage='Đang quét hình học từng khối…';X.tab='paths';paint();
    try{for(const source of sources){const mesh=source.mesh;
      X.scanProgress={done:job.stats.processedMeshes,total:job.meshes.length,paths:job.paths.length,active:String(mesh.name||'Object')};updateScanProgress();
      await new Promise(resolve=>setTimeout(resolve,0));if(token!==scanEpoch)return {cancelled:true};
      if(!validStage()||!validSource(source))return changedModel();
      scanMesh(job,mesh);X.scanProgress={done:job.stats.processedMeshes,total:job.meshes.length,paths:job.paths.length,active:''};updateScanProgress();
    }if(token!==scanEpoch)return {cancelled:true};if(!validStage()||!sources.every(validSource)||!stageOrder.every((m,i)=>E.stage[i]===m))return changedModel();return publishScan(job);}catch(error){if(token===scanEpoch){X.scanProgress=null;X.detectMessage='Chưa hoàn tất quét: '+error.message;paint();}throw error;}
  }
  function filteredCandidates(){const q=folded(X.candidateFilter);return X.candidates.filter(c=>(!q||folded(c.name).includes(q))&&(X.candidateKind==='all'||X.candidateKind==='hole'&&c.isHole||X.candidateKind==='outer'&&c.closed&&!c.isHole||X.candidateKind==='open'&&!c.closed||X.candidateKind==='new'&&!c.existingId));}
  function candidateBlocks(items=filteredCandidates()){
    const included=new Set(items),bySource=new Map(),blocks=[];
    for(const c of X.candidates){
      const sourceMesh=String(c.sourceMesh||'');
      let block=bySource.get(sourceMesh);
      if(!block){block={key:'block_'+blocks.length,name:'',sourceMesh,sourceName:String(c.sourceName||c.name||'Object'),componentIndex:null,candidates:[],allCandidates:[]};bySource.set(sourceMesh,block);blocks.push(block);}
      block.allCandidates.push(c);if(included.has(c))block.candidates.push(c);
    }
    return blocks.filter(b=>b.candidates.length).map(b=>{
      const newPaths=b.candidates.filter(c=>!c.existingId),selectedCount=newPaths.filter(c=>c.checked!==false).length;
      return {...b,name:b.sourceName,components:new Set(b.allCandidates.map(c=>c.componentIndex)).size,total:b.allCandidates.length,count:b.candidates.length,newCount:newPaths.length,existingCount:b.candidates.length-newPaths.length,selectedCount,checked:newPaths.length>0&&selectedCount===newPaths.length,mixed:selectedCount>0&&selectedCount<newPaths.length};
    });
  }
  function selectCandidates(checked,items=filteredCandidates()){
    if(X.scanProgress)throw Error('Đợi quét xong hoặc dừng quét trước khi chọn khối.');
    const valid=new Set(X.candidates);let count=0;
    for(const c of items){if(!valid.has(c)||c.existingId)continue;const value=checked===true;if((c.checked!==false)!==value){c.checked=value;count++;}}
    paint();return count;
  }
  function selectBlock(key,checked){const block=candidateBlocks().find(b=>b.key===key);return block?selectCandidates(checked,block.candidates):0;}
  function candidateGuideState(){
    let list=[];
    if(X.mode!=='draw'&&X.mode!=='edit'&&!X.draft.length){
      const focus=X.candidates.find(c=>c.id===X.candidateFocus);
      if(focus)list=[focus];
      else if(X.guideMode==='all')list=filteredCandidates().filter(c=>!c.existingId);
      else if(X.guideMode!=='none')list=X.candidates.filter(c=>c.checked===true&&!c.existingId);
      if(X.quick150&&!focus)list=list.slice().sort((a,b)=>Number(b.id===X.quickFocus150)-Number(a.id===X.quickFocus150)||Number(b.checked===true)-Number(a.checked===true));
    }
    const chosen=new Set(list.slice(0,MAX_GUIDES)),items=[];
    for(let index=0;index<X.candidates.length;index++)if(chosen.has(X.candidates[index]))items.push({candidate:X.candidates[index],index});
    return {items,total:list.length,shown:items.length,hidden:list.length-items.length,limited:list.length>items.length,mode:X.guideMode};
  }
  function setGuideMode(mode='selected'){
    X.guideMode=['selected','all','none'].includes(mode)?mode:'selected';
    X.candidateFocus=null;X.previewOnly=false;restoreFocusCamera();paint();return X.guideMode;
  }
  function focusCandidate(id){const candidate=X.candidates.find(c=>c.id===id);if(!candidate)return false;
    if(!focusCamera)focusCamera={camera:structuredClone(E.camera),fit:E._fitOnResize,view:E.view,orbit:state.orbit,follow:S.director.cameraFollow,motion:S.director.cameraMotion?structuredClone(S.director.cameraMotion):null};
    X.candidateFocus=id;X.previewOnly=true;E.view='stage';E._fitOnResize=false;state.orbit=false;S.director.cameraFollow=false;S.director.cameraMotion=null;
    const n=vec.unit(candidate.normal);Object.assign(E.camera,{yaw:Math.atan2(n[0],n[2]),pitch:Math.asin(clamp(n[1],-.999999,.999999))});
    const b=candidate.bounds||M.bbox(candidate.points.flat());fitCamera8(b);paint();return true;
  }
  function restoreFocusCamera(){if(!focusCamera)return;E.camera=focusCamera.camera;E._fitOnResize=focusCamera.fit;E.view=focusCamera.view;state.orbit=focusCamera.orbit;S.director.cameraFollow=focusCamera.follow;S.director.cameraMotion=focusCamera.motion;focusCamera=null;}
  function clearFocus(){X.candidateFocus=null;X.previewOnly=false;restoreFocusCamera();paint();}
  function previewCandidates(items){cancelScan(false);restoreFocusCamera();X.candidates=(items||[]).slice(0,MAX_CANDIDATES).map((p,i)=>({...p,id:p.id||'candidate_'+i,checked:p.checked!==false}));X.candidatePage=0;X.candidateFocus=null;X.previewOnly=false;paint();return X.candidates;}
  function commitCandidates(options={}){
    if(X.scanProgress)throw Error('Đợi quét xong trước khi tạo viền.');
    refreshCandidateBindings();
    const chosen=X.candidates.filter(c=>c.checked!==false&&!c.existingId);if(!chosen.length)throw Error('Chọn ít nhất một đường viền mới trước.');
    if(X.paths.length+chosen.length>MAX_PATHS)throw Error('Chỉ còn chỗ cho '+(MAX_PATHS-X.paths.length)+' viền. Bỏ chọn các viền chưa cần dùng.');
    const sharedGroup=String(X.creationGroupName||'Viền sân khấu').trim().slice(0,40)||'Viền sân khấu';
    const prepared=chosen.map(c=>makePath(c.points,{rows:1,width:.06,pitch:.09,brightness:1,diffuser:false,glow:true,...c.ledOptions,group:X.creationGroupMode==='perObject'?blockGroupName(c.sourceMesh,null,c.sourceName):sharedGroup,...options,name:c.name,closed:c.closed,normal:c.normal,sourceMesh:c.sourceMesh,sourceName:c.sourceName,...(c.sourceMeshes?{sourceMeshes:c.sourceMeshes}:{})}));
    return transaction(()=>{X.paths.push(...prepared);X.selected=prepared[0].id;const added=new Map(chosen.map((c,i)=>[c.id,prepared[i].id]));for(const c of X.candidates){if(added.has(c.id)){c.existingId=added.get(c.id);c.checked=false;}}
      X.target=new Set(prepared.map(p=>p.group)).size===1?'group:'+prepared[0].group:'all';
      X.detectMessage='Đã tạo '+prepared.length+' viền LED. Các kết quả khác vẫn ở đây để chọn và tạo tiếp.';changed();paint();return prepared;});
  }
  function setMode(mode='idle'){
    if(!['idle','pick','draw','edit'].includes(mode))mode='idle';
    if(mode==='edit'&&!current()){toast('Chọn một viền trước khi sửa điểm.');return false;}
    if(mode!=='idle'){
      cancelScan(false);restoreFocusCamera();X.candidateFocus=null;X.previewOnly=false;
      if(!interactionCamera)interactionCamera={orbit:state.orbit,follow:S.director?.cameraFollow,motion:S.director?.cameraMotion};
      state.orbit=false;if(S.director){S.director.cameraFollow=false;S.director.cameraMotion=null;}
      setPlaying(false);
    }else releaseInteractionCamera();
    X.mode=mode;drag=null;if(mode==='draw'&&!X.draft.length)X.draftNormal=[0,0,1];
    overlay.style.pointerEvents=mode==='idle'?'none':'auto';overlay.style.cursor=mode==='edit'?'move':mode==='idle'?'auto':'crosshair';
    E.view='stage';paint();return true;
  }
  function releaseInteractionCamera(){
    if(!interactionCamera)return;
    state.orbit=interactionCamera.orbit;if(S.director){S.director.cameraFollow=interactionCamera.follow;S.director.cameraMotion=interactionCamera.motion;}
    interactionCamera=null;
  }
  function appendDraftPoint(point,normal=[0,0,1]){
    if(X.mode!=='draw')throw Error('Bấm Vẽ đường viền hoặc Tiếp tục vẽ trước.');
    if(!validPoint(point)||!validPoint(normal)||Math.hypot(...normal)<1e-6)throw Error('Điểm vẽ hoặc mặt phẳng không hợp lệ.');
    if(X.draft.length>=MAX_POINTS)throw Error('Đã đạt giới hạn điểm.');
    if(!X.draft.length)X.draftNormal=vec.unit(normal);
    else if(Math.abs(vec.dot(vec.sub(point,X.draft[0]),X.draftNormal))>.001)throw Error('Điểm cần nằm trên mặt phẳng viền đã chọn ở điểm đầu.');
    if(X.draft.length&&Math.hypot(...vec.sub(point,X.draft.at(-1)))<=.001)return false;
    X.draft.push(point.slice());paint();return true;
  }
  function removeDraftPoint(){if(!X.draft.length)return false;X.draft.pop();paint();return true;}
  function pauseDrawing(){return setMode('idle');}
  function resumeDrawing(){return setMode('draw');}
  function cancelDrawing(){X.draft=[];return setMode('idle');}
  function finishDrawing(closed=false){
    if(X.draft.length<(closed?3:2))throw Error(closed?'Viền kín cần ít nhất 3 điểm.':'Đặt ít nhất 2 điểm trên model.');
    if(closed){let area=0;for(let i=0;i<X.draft.length;i++)area+=vec.dot(X.draftNormal,vec.cross(vec.sub(X.draft[i],X.draft[0]),vec.sub(X.draft[(i+1)%X.draft.length],X.draft[0])));if(Math.abs(area)<1e-8)throw Error('Viền kín cần có diện tích. Thêm điểm lệch khỏi đường thẳng hoặc dùng viền hở.');}
    const p=addPath(X.draft,{name:'Viền vẽ '+(X.paths.length+1),group:X.creationGroupName||'Viền sân khấu',normal:X.draftNormal,closed,rows:1,width:.02,sourceMesh:''});
    X.target='path:'+p.id;X.draft=[];setMode('edit');return p;
  }
  function updatePoint(index,point){const p=current();if(!p||!validPoint(point)||index<0||index>=p.points.length)return false;const points=p.points.map(q=>q.slice());points[index]=point.slice();return updatePath(p.id,{points});}
  function editPoint(action){const p=current();if(!p)return;const i=clamp(X.pointIndex,0,p.points.length-1),points=p.points.map(q=>q.slice());
    if(action==='delete'){if(points.length<=(p.closed?3:2))throw Error('Cần giữ ít nhất '+(p.closed?3:2)+' điểm.');points.splice(i,1);}
    if(action==='insert'){if(points.length>=MAX_POINTS)throw Error('Đã đạt giới hạn điểm.');const atEnd=!p.closed&&i===points.length-1,a=points[atEnd?i-1:i],b=points[atEnd?i:(i+1)%points.length],insertAt=atEnd?i:i+1;points.splice(insertAt,0,a.map((v,k)=>(v+b[k])/2));X.pointIndex=insertAt;}
    if(action==='start'){if(!p.closed)throw Error('Đổi điểm bắt đầu áp dụng cho viền kín.');points.push(...points.splice(0,i));X.pointIndex=0;}
    return updatePath(p.id,{points});
  }
  function simplifyCurrent(){const p=current();if(!p)return;const points=G.simplify(p.points,.005,p.closed);return updatePath(p.id,{points});}
  function trimPath(id,from,to){const p=X.paths.find(p=>p.id===id);if(!p)return false;from=Math.round(+from);to=Math.round(+to);if(!Number.isFinite(from+to)||from<0||to<0||from>=p.points.length||to>=p.points.length||from===to)throw Error('Chọn hai điểm đầu / cuối khác nhau trong viền.');let points;if(from<to)points=p.points.slice(from,to+1);else if(p.closed)points=[...p.points.slice(from),...p.points.slice(0,to+1)];else points=p.points.slice(to,from+1).reverse();return updatePath(id,{points,closed:false});}
  function trimDialog(){const p=current();if(!p)return;dialog('Giữ một đoạn của đường viền',`<p>Chọn điểm đầu và điểm cuối của phần cần giữ. Dùng số điểm trong bảng Sửa điểm. Viền kín đi theo thứ tự điểm và có thể vòng qua điểm 1.</p><div class="mx143-cue-form">${numberField('mxTrimFrom','Từ điểm',X.pointIndex+1,1,p.points.length,1)}${numberField('mxTrimTo','Đến điểm',Math.min(p.points.length,X.pointIndex+2),1,p.points.length,1)}</div><p id="mxTrimError" role="alert"></p>`,[{label:'Hủy'},{label:'Giữ đoạn viền',primary:true,close:false,action:()=>{try{trimPath(p.id,+$('mxTrimFrom').value-1,+$('mxTrimTo').value-1);$('modal').close();}catch(e){$('mxTrimError').textContent=e.message;}}}]);}
  function targetEntries(){return [['all','Tất cả viền'],...Array.from(new Set(X.paths.map(p=>p.group))).map(g=>['group:'+g,'Nhóm · '+g]),...X.paths.map(p=>['path:'+p.id,p.name])];}
  function matches(target,p){return target==='all'||target==='path:'+p.id||target===p.id||target==='group:'+p.group;}
  const isCue=c=>!!c&&String(c.source||'').startsWith('matrix143:');
  function cueSpec(c){
    const v=c?.matrix143&&typeof c.matrix143==='object'?c.matrix143:{},m=String(c?.source||'').match(/^matrix143:([^@]+)(?:@([\s\S]*))?$/);
    const sourceIn=clamp(c?.in??0,0,36000),duration=clamp(c?.duration??6,.05,600),rate=clamp(c?.rate??1,.125,8);
    return {...FX.normalize({...v,preset:v.preset||m?.[1]||'chase'}),target:String(v.target??m?.[2]??'all')||'all',phaseDuration:clamp(v.phaseDuration??(sourceIn+duration*rate),.01,36000)};
  }
  function effectFor(path,time){
    if(X.live&&matches(X.live.target,path)){const t=(performance.now()-X.live.started)/1000;if(t>=0&&t<X.live.duration)return {...X.live,time:t,envelope:1,gain:1,preview:true};}
    if(!seq.enabled||!Number.isFinite(time))return null;
    const tracks=seq.tracks.filter(t=>t.type==='light'),solo=tracks.some(t=>t.solo===true&&!t.muted),order=new Map(seq.tracks.map((t,i)=>[t.id,i]));
    const active=new Set(tracks.filter(t=>!t.muted&&(!solo||t.solo===true)).map(t=>t.id));
    const cues=seq.clips.filter(c=>isCue(c)&&active.has(c.track)&&!c.muted&&Number.isFinite(c.start)&&Number.isFinite(c.duration)&&c.start<=time&&time<c.start+c.duration&&matches(cueSpec(c).target,path)).sort((a,b)=>order.get(a.track)-order.get(b.track)||a.start-b.start);
    const c=cues.at(-1);if(!c)return null;const spec=cueSpec(c),local=time-c.start,fade=Math.min(clamp(c.fade??0,0,10),c.duration/2);
    return {...spec,time:clamp(c.in??0,0,36000)+local*clamp(c.rate??1,.125,8),duration:spec.phaseDuration,gain:clamp(c.gain??1,0,3),envelope:fade>0?clamp(Math.min(local/fade,(c.duration-local)/fade),0,1):1,cueId:c.id};
  }
  function evaluate(path,time,count=null){if(typeof path==='string')path=X.paths.find(p=>p.id===path);if(!path)return [];
    count=Number.isFinite(count)&&count>0?count:X.pathData?.(path)?.count||G.samplePath(path.points,path.closed,path.pitch,2048).count;
    const effect=effectFor(path,time),opts=effect||{preset:'steady',time,duration:6,color:path.color,color2:path.color,brightness:path.idle??1};
    const out=FX.evaluate({...opts,count,rows:path.rows,bpm:seq.bpm||120,reverse:!!path.reverse!==!!opts.reverse});
    const gain=(path.enabled!==false&&!path.bindingInvalid?clamp(path.brightness??1,0,1):0)*(effect?.gain??1)*(effect?.envelope??1);for(const cell of out)cell.level=clamp(cell.level*gain,0,1);return out;
  }
  function configure(options={},record=true){
    if(options.preset!=null&&!preset(options.preset))throw Error('Hiệu ứng LED Matrix không tồn tại.');
    const apply=()=>{if(options.target!=null)X.target=String(options.target);if(options.duration!=null)X.duration=clamp(options.duration,.05,120);X.effect=FX.normalize({...X.effect,...options});if(preset(options.preset))X.lastPreset=options.preset;
      if(X.live)X.live={...X.effect,preset:X.lastPreset,target:X.target,duration:X.duration,started:X.live.started};
      paint();return {...X.effect,target:X.target,duration:X.duration};};return record?transaction(apply):apply();
  }
  function preview(id=X.lastPreset){if(!preset(id))return false;if(!X.paths.some(p=>matches(X.target,p))){toast('Chưa có đường viền trong nhóm đích. Tạo viền trước khi xem hiệu ứng.');return false;}
    X.lastPreset=id;X.effect=FX.normalize({...X.effect,preset:id});X.live={...X.effect,preset:id,target:X.target,duration:X.duration,started:performance.now()};paint();return true;}
  function stopPreview(){X.live=null;paint();}
  function saveCue(id=X.lastPreset,target=X.target,start=state.time,duration=X.duration,speed=X.effect.speed,options={}){
    if(!preset(id))throw Error('Hiệu ứng LED Matrix không tồn tại.');
    if(!Number.isFinite(+start)||!Number.isFinite(+duration)||+start<0||+duration<.05||+start + +duration>600)throw Error('Cue phải dài ít nhất 0,05 giây và kết thúc trước hoặc tại 600 giây.');
    if(seq.clips.length>=500)throw Error('Đã đạt giới hạn 500 cue.');
    start=+start;duration=+duration;target=String(target||'all');
    const sourceIn=clamp(options.in??0,0,36000),rate=clamp(options.rate??1,.125,8);
    const spec={...FX.normalize({...X.effect,...options,preset:id,speed}),target,phaseDuration:clamp(options.phaseDuration??(sourceIn+duration*rate),.01,36000)};
    return transaction(()=>{const tr=options.track?seq.tracks.find(t=>t.id===options.track&&t.type==='light'):track10('light','matrix143:all','LED MATRIX / VIỀN');if(!tr)throw Error('Không tìm thấy track LED Matrix.');
      ensureDuration10(start+duration);
      const c=addClip(tr.id,{source:'matrix143:'+id+'@'+target,name:String(options.name||preset(id).name).trim().slice(0,60),start,duration,color:'#5ee8d1',in:sourceIn,rate,fade:clamp(options.fade??.08,0,Math.min(10,duration/2)),gain:clamp(options.gain??1,0,3),matrix143:spec});
      X.live=null;enableSequence(true);invalidateSeq();renderSequence();paint();return c;});
  }
  function getCue(id=seq.selected){return seq.clips.find(c=>c.id===id&&isCue(c))||null;}
  function updateCueBrightness(id,value,record=true){
    if(!Number.isFinite(value))throw Error('Độ sáng cue cần là một số hữu hạn.');
    const c=getCue(id);if(!c)return false;value=clamp(value,0,1);
    const spec=cueSpec(c);if(spec.brightness===value)return false;
    const apply=()=>{c.matrix143={...spec,brightness:value};X.live=null;changed(false);invalidateSeq();return true;};
    return record?transaction(apply):apply();
  }
  function updateEffectBrightness(value,record=true){
    if(!Number.isFinite(value))throw Error('Độ sáng hiệu ứng cần là một số hữu hạn.');
    value=clamp(value,0,1);if(X.effect.brightness===value)return false;
    const apply=()=>{X.effect=FX.normalize({...X.effect,brightness:value});if(X.live)X.live={...X.live,brightness:value};changed(false);return true;};
    return record?transaction(apply):apply();
  }
  function deleteCue(id){if(!seq.clips.some(c=>c.id===id&&isCue(c)))return false;return transaction(()=>{seq.clips=seq.clips.filter(c=>c.id!==id);if(seq.selected===id)seq.selected=null;invalidateSeq();renderSequence();paint();return true;});}
  function duplicateCue(id){const c=seq.clips.find(c=>c.id===id&&isCue(c));if(!c)return null;const spec=cueSpec(c);return saveCue(spec.preset,spec.target,c.start+c.duration,c.duration,spec.speed,{...c,...spec,name:c.name+' +',track:c.track});}
  function autoShow(){if(!X.paths.length)throw Error('Tạo ít nhất một viền trước.');const start=state.time,duration=X.duration;
    if(start+FX.presets.length*duration>600)throw Error('Chuỗi '+FX.presets.length+' cue vượt 600 giây. Giảm thời lượng mỗi cue hoặc đưa playhead về trước.');
    if(seq.clips.length+FX.presets.length>500)throw Error('Cần đủ chỗ cho '+FX.presets.length+' cue trong timeline.');
    return transaction(()=>{const cues=FX.presets.map((p,i)=>saveCue(p.id,X.target,start+i*duration,duration,X.effect.speed));X.tab='cues';toggleSequence(true);paint();return cues;});
  }
  function numberField(id,label,value,min,max,step=.1){return `<label>${label}<input id="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;}
  function targetOptions(selected){const list=targetEntries();if(!list.some(x=>x[0]===selected))list.push([selected,'Đích đã lưu · '+selected]);return list.map(([id,name])=>`<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(name)}</option>`).join('');}
  function editCue(id=null,track=null){const existing=seq.clips.find(c=>c.id===id&&isCue(c));if(id&&!existing)return;
    const spec=existing?cueSpec(existing):{...X.effect,preset:X.lastPreset,target:X.target},newStart=clamp(state.time,0,599.95),c=existing||{name:preset(spec.preset)?.name||'LED Matrix',start:newStart,duration:Math.max(.05,Math.min(X.duration,600-newStart)),in:0,rate:1,fade:.08,gain:1};
    const html=`<div class="mx143-cue-form"><label class="wide">Tên cue<input id="mxCueName" maxlength="60" value="${esc(c.name)}"></label><label>Hiệu ứng<select id="mxCuePreset">${FX.presets.map(p=>`<option value="${p.id}" ${p.id===spec.preset?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Viền / nhóm đích<select id="mxCueTarget">${targetOptions(spec.target)}</select></label><div class="mx146-cue-brightness wide"><label for="mxCueBrightnessRange">Độ sáng cue trên timeline <output id="mxCueBrightnessValue">${+(spec.brightness*100).toFixed(1)}%</output></label><div class="mx146-level-row"><input id="mxCueBrightnessRange" type="range" min="0" max="100" step="0.1" value="${spec.brightness*100}" aria-label="Kéo độ sáng cue LED Matrix"><input id="mxCueBrightness" type="number" min="0" max="100" step="0.1" value="${+(spec.brightness*100).toFixed(1)}" aria-label="Độ sáng cue LED Matrix, phần trăm"><span>%</span></div><small>Lưu riêng cho cue này. 0% = tắt; 100% = mức đầy đủ của viền.</small></div>${numberField('mxCueStart','Bắt đầu · giây',c.start,0,599.95,.01)}${numberField('mxCueDuration','Thời lượng · giây',c.duration,.05,600,.01)}${numberField('mxCueSpeed','Tốc độ hiệu ứng ×',spec.speed,0,8,.1)}${numberField('mxCueTail','Độ dài đuôi · pixel',spec.tail,1,512,1)}${numberField('mxCueGroup','Pixel mỗi cụm',spec.groupSize,1,512,1)}${numberField('mxCuePhase','Lệch pha · chu kỳ',spec.phase,-100,100,.05)}<label>Màu 1<input id="mxCueColor" type="color" value="${spec.color}"></label><label>Màu 2<input id="mxCueColor2" type="color" value="${spec.color2}"></label>${numberField('mxCueGain','Gain cue',c.gain??1,0,3,.05)}${numberField('mxCueFade','Fade vào / ra · giây',c.fade??0,0,10,.05)}${numberField('mxCueIn','Source IN · giây',c.in??0,0,36000,.01)}${numberField('mxCueRate','Tốc độ clip ×',c.rate??1,.125,8,.125)}<label class="mx143-check"><input id="mxCueReverse" type="checkbox" ${spec.reverse?'checked':''}>Đảo chiều pixel</label></div><p class="hint-text">Track ở dưới ưu tiên; trong cùng track, cue bắt đầu sau ưu tiên. Source IN giữ pha khi tách hoặc cắt đầu clip.</p><p id="mxCueError" role="alert"></p>`;
    dialog(existing?'Chỉnh cue LED Matrix':'Thêm cue LED Matrix',html,[{label:'Hủy'},...(existing?[{label:'Nhân bản',action:()=>{try{duplicateCue(existing.id);}catch(e){toast(e.message);}}},{label:'Xóa',action:()=>deleteCue(existing.id)}]:[]),{label:'Lưu cue',primary:true,close:false,action:()=>{
      try{const ids=['Start','Duration','Speed','Tail','Group','Phase','Brightness','Gain','Fade','In','Rate'];if(ids.some(k=>!$('mxCue'+k).value.trim()||!Number.isFinite(+$('mxCue'+k).value)))throw Error('Nhập đầy đủ các giá trị số.');
        const start=+$('mxCueStart').value,duration=+$('mxCueDuration').value;if(start<0||duration<.05||start+duration>600)throw Error('Cue cần nằm trong 0–600 giây.');
        const id=$('mxCuePreset').value,target=$('mxCueTarget').value,speed=+$('mxCueSpeed').value;if(!preset(id))throw Error('Chọn một hiệu ứng LED Matrix hợp lệ.');
        const opts={name:$('mxCueName').value,tail:+$('mxCueTail').value,groupSize:+$('mxCueGroup').value,phase:+$('mxCuePhase').value,color:$('mxCueColor').value,color2:$('mxCueColor2').value,brightness:+$('mxCueBrightness').value/100,reverse:$('mxCueReverse').checked,gain:clamp($('mxCueGain').value,0,3),fade:clamp($('mxCueFade').value,0,Math.min(10,duration/2)),in:clamp($('mxCueIn').value,0,36000),rate:clamp($('mxCueRate').value,.125,8),track:existing?.track||track};
        if(existing){transaction(()=>{Object.assign(existing,{name:String(opts.name||preset(id).name).trim().slice(0,60),start,duration,in:opts.in,rate:opts.rate,gain:opts.gain,fade:opts.fade,source:'matrix143:'+id+'@'+target,matrix143:{...FX.normalize({...spec,...opts,preset:id,speed}),target,phaseDuration:duration!==c.duration||opts.rate!==c.rate?opts.in+duration*opts.rate:spec.phaseDuration}});ensureDuration10(start+duration);X.live=null;seq.selected=existing.id;enableSequence(true);invalidateSeq();renderSequence();paint();});}else saveCue(id,target,start,duration,speed,opts);
        $('modal').close();
      }catch(error){$('mxCueError').textContent=error.message;}
    }}]);
    X.controls146?.bindDialog();
  }
  function serialize(){return {v:5,object146:{outlineMode:X.outlineMode==='face'?'face':'object'},masterBrightness:clamp(X.masterBrightness??1,0,1),scan144:{...X.scan144,mode:X.detectMode},paths:structuredClone(X.paths),selected:X.selected,target:X.target,duration:X.duration,effect:structuredClone(X.effect),lastPreset:X.lastPreset,cues:seq.clips.filter(isCue).map(c=>({id:c.id,matrix143:cueSpec(c)}))};}
  function restoreBank(data){X.appearance151?.onRestore();X.controls146?.onRestore();setQuickPick(false);X.quick150=false;X.quickFocus150=null;X.quickIncludeHoles150=false;X.quickPending150=null;cancelScan(false);clearHierarchy149();X.edgeMode149='main';releaseInteractionCamera();X.guideMode='selected';X.blockExpanded={};X.blockPages={};X.outlineMode=data?.object146?.outlineMode==='face'?'face':'object';X.pickedFace=null;if(E.stage&&!E.stage.some(m=>m.id===X.meshId))X.meshId='';X.masterBrightness=clamp(data?.masterBrightness??1,0,1);X.scan144=normalizeScan(data?.scan144||{});X.detectMode=X.scan144.mode;X.scanReport=null;X.candidateFocus=null;X.previewOnly=false;focusCamera=null;X.brightness144?.onRestore();const paths=[];for(const p of (Array.isArray(data?.paths)?data.paths:[]).slice(0,MAX_PATHS)){try{const q=makePath(p.points,p);if(!paths.some(p=>p.id===q.id))paths.push(q);}catch(e){console.warn('Bỏ qua viền LED không hợp lệ:',e.message);}}
    X.paths=paths;X.selected=paths.some(p=>p.id===data?.selected)?data.selected:paths[0]?.id||null;X.target=String(data?.target||'all');X.duration=clamp(data?.duration??6,.05,120);X.effect=FX.normalize(data?.effect||{});X.lastPreset=preset(data?.lastPreset)?data.lastPreset:'chase';X.live=null;X.candidates=[];X.detectMessage=paths.length?'Đã mở '+paths.length+' viền LED. Quét lại model để kiểm tra hoặc thêm các viền còn thiếu.':'Bấm Quét lấy viền hoặc Chọn trên 3D để bắt đầu.';X.draft=[];X.pointIndex=0;const previousView=E.view;setMode('idle');E.view=previousView;
    for(const item of Array.isArray(data?.cues)?data.cues:[]){const c=seq.clips.find(c=>c.id===item.id&&isCue(c));if(c)c.matrix143=cueSpec({...c,matrix143:item.matrix143});}changed();paint();X.controls146?.update();
  }
  const previousPack=packLiveExtras,previousRestoreExtras=restoreLiveExtras,previousSnapshot=snapshot,previousRestore=restore;
  // A temporary drawing lock must not become a saved camera preference.
  packLiveExtras=async function(){const matrix=serialize(),cameraLock=interactionCamera,out=await previousPack();if(cameraLock&&out.director)out.director.cameraFollow=!!cameraLock.follow;out.matrix143=matrix;return out;};
  restoreLiveExtras=async function(data){setQuickPick(false);releaseInteractionCamera();await previousRestoreExtras(data);restoreBank(data?.matrix143);};
  snapshot=function(){const out=previousSnapshot();if(interactionCamera&&out.director)out.director.cameraFollow=!!interactionCamera.follow;out.matrix143=serialize();return out;};
  restore=function(data){setQuickPick(false);releaseInteractionCamera();previousRestore(data);restoreBank(data?.matrix143);};
  S.snapshot=(...args)=>snapshot(...args);S.restore=(...args)=>restore(...args);
  // Matrix attachments follow the same captured transform as their source mesh.
  // Only world geometry moves; physical strip dimensions remain in metres.
  const previousCapture143=captureTransform8,previousTransform143=transformFrom8,previousCoordinates143=applyCoordinateConfig;
  function attachmentSnapshot143(paths){return paths.map(p=>({id:p.id,points:p.points.map(q=>q.slice()),normal:p.normal.slice()}));}
  function applyAttachmentMatrix143(items,matrix){let moved=false;
    for(const item of items){const path=X.paths.find(p=>p.id===item.id);if(!path)continue;
      path.points=item.points.map(p=>M.point(matrix,p));path.normal=M.norm(M.vector(matrix,item.normal));moved=true;
    }
    if(moved){changed();if(X.isOpen)paint();}return moved;
  }
  function pathSourceKeys149(path){return Array.isArray(path.sourceMeshes)?path.sourceMeshes:path.sourceMesh?[String(path.sourceMesh)]:[];}
  captureTransform8=function(...args){const base=previousCapture143(...args);if(!base)return base;
    const keys=new Set((base.meshes||[]).flatMap(({m})=>[m?.sourceKey,m?.id]).filter(v=>v!=null&&String(v).length).map(String));
    base.matrix143Paths=attachmentSnapshot143(X.paths.filter(p=>{const source=pathSourceKeys149(p);return source.length&&source.every(k=>keys.has(k));}));
    base.matrix149PartialPaths=X.paths.filter(p=>{const source=pathSourceKeys149(p);return source.length>1&&source.some(k=>keys.has(k))&&!source.every(k=>keys.has(k));}).map(p=>({id:p.id,bindingInvalid:p.bindingInvalid}));return base;
  };
  transformFrom8=function(base,options={}){const result=previousTransform143(base,options);if(result&&base?.meshes?.length)invalidateScanForModel();if(!result||!base?.matrix143Paths?.length&&!base?.matrix149PartialPaths?.length)return result;
    const {delta=[0,0,0],yaw=0,scale=1}=options,k=clamp(scale,.05,20),pivot=base.pivot;
    const matrix=M.mm(M.translate(M.add(pivot,delta)),M.mm(M.rotate([0,1,0],yaw*Math.PI/180),M.mm(M.trs([0,0,0],[0,0,0,1],[k,k,k]),M.translate(M.mul(pivot,-1)))));
    if(base.matrix143Paths?.length)applyAttachmentMatrix143(base.matrix143Paths,matrix);
    const identity=M.identity(),moved=matrix.some((value,i)=>Math.abs(value-identity[i])>1e-9);let invalidated=false;
    for(const item of base.matrix149PartialPaths||[]){const path=X.paths.find(p=>p.id===item.id);if(!path)continue;const invalid=moved||item.bindingInvalid===true;
      if(invalid!==!!path.bindingInvalid){if(invalid)path.bindingInvalid=true;else if(typeof item.bindingInvalid==='boolean')path.bindingInvalid=item.bindingInvalid;else delete path.bindingInvalid;invalidated=true;}}
    if(invalidated){changed(false);if(X.isOpen)paint();}return result;
  };
  applyCoordinateConfig=function(config,options={}){const before=[...(E.coordinates?.matrix||M.identity())],items=options.updateAttachments!==false?attachmentSnapshot143(X.paths):null;
    const result=previousCoordinates143(config,options);
    invalidateScanForModel();
    if(items?.length)applyAttachmentMatrix143(items,M.mm(E.coordinates.matrix,M.inverse(before)));return result;
  };
  S.captureTransform8=(...args)=>captureTransform8(...args);S.transformFrom8=(...args)=>transformFrom8(...args);S.applyCoordinateConfig=(...args)=>applyCoordinateConfig(...args);
  const previousImport=importModel;importModel=async function(...args){const model=state.model,out=await previousImport(...args);if(state.model!==model)restoreBank(null);return out;};S.importModel=importModel;
  const previousDemo=demo;demo=function(...args){const model=state.model,out=previousDemo(...args);if(state.model!==model)restoreBank(null);return out;};S.demo=demo;
  const previousEdit=editClip,previousCueEditor=openCueEditor9;
  editClip=function(id=null,type='visual'){if(isCue(seq.clips.find(c=>c.id===id)))return editCue(id);const tr=seq.tracks.find(t=>t.id===sq.addTrack);if(!id&&tr?.type==='light'&&tr.target==='matrix143:all'){sq.addTrack=null;return editCue(null,tr.id);}return previousEdit(id,type);};
  openCueEditor9=function(id=null,...args){if(isCue(seq.clips.find(c=>c.id===id)))return editCue(id);return previousCueEditor(id,...args);};
  S.editClip=(...a)=>editClip(...a);S.openCueEditor9=(...a)=>openCueEditor9(...a);
  // A separate guide canvas captures edit gestures. Luminous pixels render in WebGL.
  const overlay=document.createElement('canvas');overlay.id='matrix143Overlay';overlay.setAttribute('aria-label','Chỉnh đường viền LED Matrix');$('viewport').appendChild(overlay);
  const panel=document.createElement('section');panel.id='matrix143Panel';panel.hidden=true;document.querySelector('.right-panel')?.appendChild(panel);
  function open(tab='paths'){if(state.presenting){toast('Thoát Trình diễn để chỉnh viền LED.');return;}S.fx141?.close();S.mount136?.close();S.laserShow?.close?.();$('pro127close')?.click();if(tab!=='paths')setQuickPick(false);const source=sourceMeshes().find(m=>m.id===state.selectedMesh);if(source&&source.id!==X.meshId&&!X.candidates.length)selectSource(source);X.isOpen=true;X.tab=tab;document.body.classList.add('matrix143-open');if(innerWidth<980&&!document.body.classList.contains('drawer-right')){document.body.classList.add('drawer-right');X.openedDrawer=true;}panel.hidden=false;paint();}
  function close(){X.appearance151?.end();setQuickPick(false);cancelScan();restoreFocusCamera();X.candidateFocus=null;X.previewOnly=false;X.isOpen=false;setMode('idle');X.draft=[];panel.hidden=true;document.body.classList.remove('matrix143-open');if(X.openedDrawer){document.body.classList.remove('drawer-right');X.openedDrawer=false;}}
  const field=(key,label,value,type='number',extra='')=>`<label>${label}<input data-mxfield="${key}" type="${type}" value="${esc(value)}" ${extra}></label>`;
  const check=(key,label,value)=>`<label class="mx143-check"><input data-mxfield="${key}" type="checkbox" ${value?'checked':''}>${label}</label>`;
  const action=(id,label,cls='',extra='')=>`<button type="button" data-mxaction="${id}" class="${cls}" ${extra}>${label}</button>`;
  function drawToolbarHTML(){
    const active=X.mode==='draw',pending=X.draft.length>0,busy=!!X.scanProgress;
    if(active||pending)return `<section id="mx148DrawToolbar" class="mx148-draw-toolbar active" aria-label="Công cụ vẽ đường viền"><h4>${active?'ĐANG VẼ':'TẠM DỪNG'} · ${X.draft.length} ĐIỂM · MỘT ĐƯỜNG LIÊN TỤC</h4><p>${X.draft.length?'Vẽ trên mặt phẳng của điểm đầu, qua nhiều object. Enter hoàn tất; Backspace lùi một điểm.':'Bấm lên mặt trước của object để đặt điểm đầu, rồi bấm lần lượt theo đường viền.'}</p><div class="mx143-grid">${action('finishOpen','Hoàn tất viền hở','primary',X.draft.length<2?'disabled':'')}${action('finishClosed','Khép kín viền','',X.draft.length<3?'disabled':'')}</div><div class="mx143-grid thirds">${action('undoDraft','Lùi một điểm','',!pending?'disabled':'')}${action(active?'pauseDrawing':'resumeDrawing',active?'Tạm dừng / xoay':'Tiếp tục vẽ',active?'':'primary')}${action('cancelDrawing','Hủy đường đang vẽ','danger')}</div></section>`;
    return `<section id="mx148DrawToolbar" class="mx148-draw-toolbar mx150-quick-toolbar" aria-label="Quét và chọn viền">${action('quickScan',busy?'Đang quét lấy viền…':'↻ Quét lấy viền','primary','id="mx150QuickScan" '+(busy||!sourceMeshes().length?'disabled':''))}<div class="mx143-grid">${action('quickPick',X.quickPick150?'✓ Chọn trên 3D':'Chọn trên 3D',X.quickPick150?'active':'','id="mx150Pick3D" aria-pressed="'+X.quickPick150+'" '+(busy?'disabled':''))}${action('draw','✎ Vẽ đường viền','','id="mx148DrawContour" '+(busy?'disabled':''))}</div><small>Bấm vật thể để chọn / bỏ chọn · Kéo để xoay</small>${X.mode==='edit'?action('idle','Xong sửa điểm / xoay camera'):''}</section>`;
  }
  function scanField(key,label,min,max,step=1){return `<label>${label}<input data-mxscan="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${+(X.scan144[key]*(key==='angleToleranceDegrees'?1:1000)).toFixed(5)}"></label>`;}
  function hierarchyHTML(busy=false){
    const v=getHierarchyView();if(!v)return `<p class="mx143-note">Bấm Quét khối lớn. App sẽ nhận nhóm trước; chỉ lấy cạnh khi bạn chọn khối cần dùng.</p>`;
    const disabled=busy?'disabled':'',kind=node=>node.kind==='source'?'Nhóm gốc của model':node.kind==='spatial'?'Nhóm theo vị trí':node.kind==='mesh'?'Object nguồn':'Toàn bộ model';
    const mode=v.stats.mode==='source'?'Theo nhóm gốc của model':v.stats.mode==='spatial'?'Nhóm theo vị trí — model chưa có cây nhóm':'Kết hợp nhóm gốc và nhóm theo vị trí';
    return `<div class="mx149-hierarchy"><p id="mx149HierarchySummary" role="status">${esc(mode)} · ${v.stats.meshCount} object · ${v.root.children.length} khối lớn</p>
      <nav class="mx149-breadcrumb" aria-label="Cấp khối đang chọn">${[...v.ancestors,v.node].map(n=>`<button type="button" data-mx149-nav="${esc(n.id)}" title="${esc(n.label)}" ${busy||n.id===v.node.id?'disabled':''}>${n.id===v.root.id?'Tất cả khối':esc(n.label)}</button>`).join('<span>›</span>')}</nav>
      <div class="mx149-current"><strong>${esc(v.node.label)}</strong><small>${kind(v.node)} · ${v.meshCount} object${v.children.length?' · '+v.children.length+' khối con':''}</small>
      <button type="button" data-mx149-focus="${esc(v.node.id)}" ${busy||!v.node.bounds?'disabled':''}>Soi khối trên model</button>${focusCamera?action('clearFocus','Trả góc nhìn trước','',disabled):''}</div>
      ${v.canScan?`<label>Phạm vi cạnh<select id="mx149EdgeMode" ${disabled}>${[['main','Viền bao chính · phần lớn nhất'],['outer','Mọi viền bao ngoài'],['all','Bao ngoài + viền lỗ']].map(([id,label])=>`<option value="${id}" ${X.edgeMode149===id?'selected':''}>${label}</option>`).join('')}</select></label>
      ${action('scanHierarchyEdges',busy?'Đang lấy cạnh…':'Lấy viền cạnh khối này','primary','id="mx149ScanEdges" '+disabled)}
      <small>Lấy cạnh hình học trong khối này; bỏ đường tam giác và đường nối giữa các mảnh ghép cùng mặt phẳng. Mặc định chỉ giữ viền bao lớn nhất.</small>`:
      `<p class="mx149-hint">${v.node.id===v.root.id?'Mở một khối lớn bên dưới để chọn phần cần lấy cạnh.':'Khối này còn '+v.meshCount+' object. Mở tiếp khối nhỏ bên dưới để lấy cạnh gọn hơn (tối đa '+MAX_EDGE_SOURCES+' object/lượt).'}</p>`}
      <div class="mx149-nodes">${v.children.map(n=>`<article class="mx149-node" data-mx149-node="${esc(n.id)}"><div><strong>${esc(n.label)}</strong><small>${kind(n)} · ${n.meshKeys.length} object${n.children.length?' · '+n.children.length+' khối con':''}</small></div><div class="mx143-grid"><button type="button" data-mx149-open="${esc(n.id)}" ${disabled}>${n.children.length?'Mở khối':'Chọn khối'}</button><button type="button" data-mx149-focus="${esc(n.id)}" ${busy||!n.bounds?'disabled':''}>Soi khối</button></div></article>`).join('')}</div>
      ${v.ancestors.length?`<button type="button" data-mx149-nav="${esc(v.ancestors.at(-1).id)}" ${disabled}>← Về khối lớn hơn</button>`:''}
      ${X.hierarchy149.warnings.length?`<details class="mx144-details"><summary>Thông tin phân khối</summary>${X.hierarchy149.warnings.map(w=>`<p>${esc(w)}</p>`).join('')}</details>`:''}</div>`;
  }
  function advancedDetectionHTML(){
    const meshes=sourceMeshes(),busy=!!X.scanProgress,disabled=busy?'disabled':'',settings=X.scan144;
    const chosen=meshes.find(m=>m.id===X.meshId)||meshes.find(m=>m.id===state.selectedMesh);
    let html=`<section class="mx147-scan-all"><h4>01 / KHỐI LỚN → KHỐI NHỎ → VIỀN CẠNH</h4>
      ${busy?`<progress id="mx147ScanProgress" max="${Math.max(1,X.scanProgress.total)}" value="${X.scanProgress.done}" aria-label="Tiến trình lấy cạnh khối"></progress>${action('cancelScan','Dừng lấy cạnh')}`:''}
      <p class="mx143-note" role="status" data-mxscan-progress>${esc(X.detectMessage)}</p>${hierarchyHTML(busy)}</section>`;
    html+=blockResultsHTML(busy);
    html+=`<section><details class="mx144-details mx147-single-object" ${X.mode==='pick'?'open':''}><summary>Chọn riêng object / mặt · nâng cao</summary>
      <label>Object cần viền<select id="mx143Mesh" ${disabled}><option value="">— Chọn object —</option>${meshes.map(m=>`<option value="${esc(m.id)}" ${chosen?.id===m.id?'selected':''}>${esc(m.name||'Object không tên')}</option>`).join('')}</select></label>
      <div class="mx143-grid">${action('pick',X.mode==='pick'?'Đang chờ bấm object…':'Bấm chọn object trên 3D',X.mode==='pick'?'active':'',disabled)}${action('detect','Lấy viền object','',disabled)}</div>
      ${X.mode==='pick'?`<p class="mx143-note">Bấm lên vật thể cần viền.</p>${action('idle','Hủy chọn / xoay camera')}`:''}
      <label>Phần cần lấy viền<select id="mx146OutlineMode" ${disabled}><option value="object" ${X.outlineMode==='object'?'selected':''}>Object đã chọn · mọi mảng rời</option><option value="face" ${X.outlineMode==='face'?'selected':''}>Chỉ mặt đã bấm trên object</option></select></label>
      <label>Cách lấy biên<select id="mx144Strategy" ${disabled}>${[['components','Mặt chính của từng mảng rời'],['allPlanes','Tất cả mặt phẳng của object'],['dominant','Một mặt chính lớn nhất']].map(([id,label])=>`<option value="${id}" ${settings.strategy===id?'selected':''}>${label}</option>`).join('')}</select></label>
      <label>Hướng mặt<select id="mx143DetectMode" ${busy||settings.strategy==='allPlanes'?'disabled':''}>${[['auto','Tự động'],['front','Mặt trước (+Z)'],['back','Mặt sau (−Z)'],['top','Mặt trên (+Y)'],['bottom','Mặt dưới (−Y)'],['left','Bên trái (−X)'],['right','Bên phải (+X)']].map(([id,name])=>`<option value="${id}" ${X.detectMode===id?'selected':''}>${name}</option>`).join('')}</select></label>
      <p>Thiết lập mặt ở đây chỉ áp dụng khi lấy riêng object. Lấy cạnh khối dùng biên hình học chung của các object trong khối đã chọn.</p></details>
      <details class="mx144-details"><summary>Dung sai cạnh · nâng cao</summary><div class="mx143-grid">${scanField('tolerance','Ngưỡng ghép đỉnh · mm',.001,20,.05)}${scanField('planeTolerance','Dung sai mặt phẳng · mm',.001,50,.05)}${scanField('minLength','Viền ngắn nhất · mm',1,100000,1)}${scanField('simplifyTolerance','Gọn điểm khi lấy riêng object · mm',0,20,.1)}${scanField('angleToleranceDegrees','Dung sai hướng mặt · độ',.05,10,.05)}</div><p>Lấy cạnh khối giữ chi tiết hình học gốc, không tự lấp khe giữa các phần rời.</p>${action('resetScan','Về dung sai mặc định')}</details>`;
    if(X.scanReport){const r=X.scanReport;html+=`<details class="mx144-details"><summary>Chi tiết cạnh · ${r.stats.paths} kết quả</summary><p>${r.stats.processedMeshes} object · ${r.stats.triangles.toLocaleString('vi-VN')} tam giác · ${r.stats.components} mảng liên thông. ${r.stats.omittedPaths?r.stats.omittedPaths+' viền ngoài phạm vi cạnh đang chọn. ':''}${r.stats.skippedPaths?'Có '+r.stats.skippedPaths+' viền vượt giới hạn điểm / kết quả. ':''}</p>${r.warnings.length?r.warnings.slice(0,30).map(w=>`<p>${esc(w)}</p>`).join(''):'<p>Không có cảnh báo hình học trong phạm vi này.</p>'}</details>`;}
    return html+'</section>';
  }
  function candidateRowHTML(c,index,busy){return `<div class="mx144-candidate ${X.candidateFocus===c.id?'focused':''} ${c.existingId?'existing':''}"><input type="checkbox" data-mxcandidate="${index}" aria-label="Chọn ${esc(c.name)}" ${c.checked!==false&&!c.existingId?'checked':''} ${c.existingId||busy?'disabled':''}><span><strong>${index+1}. ${esc(c.name)}</strong><small>${c.length.toFixed(3)} m · ${c.points.length} điểm · ${c.closed?(c.isHole?'viền trong':'bao ngoài'):'hở'}${c.existingId?' · đã gắn LED':''}</small></span><button type="button" data-mxfocus="${esc(c.id)}" title="Phóng gần và xem riêng đường này" ${busy?'disabled':''}>Soi viền</button></div>`;}
  function detectionHTML(){
    const busy=!!X.scanProgress,disabled=busy?'disabled':'',selected=X.candidates.filter(c=>c.checked===true&&!c.existingId),guide=candidateGuideState(),last=X.candidates.find(c=>c.id===X.quickFocus150),remaining=MAX_PATHS-X.paths.length;
    let html=`<section class="mx150-scan"><p class="mx143-note" role="status" data-mxscan-progress>${esc(X.detectMessage)}</p>
      ${busy?`<progress id="mx147ScanProgress" max="${Math.max(1,X.scanProgress.total)}" value="${X.scanProgress.done}" aria-label="Tiến trình lấy viền"></progress>${action('cancelScan','Dừng quét')}`:''}
      <div id="mx150QuickStatus" class="mx150-counts" role="status"><strong>${selected.length} viền đang chọn</strong><span>${X.candidates.length} viền đã tìm</span></div>
      <p class="mx150-legend"><i class="preview"></i>Viền gợi ý <i class="chosen"></i>Viền đã chọn</p>
      <label class="mx143-check"><input id="mx150OnlySelected" type="checkbox" ${X.guideMode==='selected'?'checked':''} ${disabled}>Chỉ hiện viền đã chọn</label>
      ${guide.limited?`<p class="mx150-muted">Đang hiện ${guide.shown}/${guide.total} gợi ý. Bấm vào vật thể bất kỳ để hiện và chọn viền của nó.</p>`:''}
      ${last?`<p id="mx150PickedObject" class="mx150-picked">${esc(last.sourceName||last.name)}<small>${last.existingId?'Đã có LED':last.checked?'Đã chọn · bấm lại để bỏ':'Đã bỏ chọn'}</small></p>`:''}
      ${selected.length?`<div class="mx143-grid">${action('noneCandidates','Bỏ chọn tất cả','',disabled)}${action('quickPick',X.quickPick150?'Xong chọn':'Chọn thêm trên 3D','',disabled)}</div>`:''}
      ${selected.length>remaining?`<p class="mx147-limit">Còn ${remaining} chỗ. Bỏ bớt viền trước khi tạo LED.</p>`:''}</section>`;
    html+=`<section><details class="mx144-details"><summary>Tùy chọn thêm</summary>
      <label class="mx143-check"><input id="mx150IncludeHoles" type="checkbox" ${X.quickIncludeHoles150?'checked':''} ${disabled}>Lấy thêm viền lỗ / viền phụ</label>
      <p>Mặc định lấy viền bao chính của các phần hình học. Bật tùy chọn trên sẽ quét lại và giữ các viền đang chọn nếu còn khớp.</p>
      <div class="mx143-grid">${action('selectAllBlocks','Chọn toàn bộ gợi ý','',disabled)}${action('clearCandidates','Bỏ kết quả quét','',disabled)}</div>
      <details class="mx144-details"><summary>Chọn theo danh sách</summary>${blockResultsHTML(busy)||'<p>Quét lấy viền hoặc bấm vật thể trên 3D trước.</p>'}</details>
      <details class="mx144-details"><summary>Lấy riêng mặt / dung sai</summary>
      <div class="mx143-grid">${action('pick','Bấm mặt trên 3D','',disabled)}${action('detect','Lấy lại object','',disabled)}</div>
      <label>Phần cần lấy<select id="mx146OutlineMode" ${disabled}><option value="object" ${X.outlineMode==='object'?'selected':''}>Object</option><option value="face" ${X.outlineMode==='face'?'selected':''}>Mặt vừa bấm</option></select></label>
      <div class="mx143-grid">${scanField('tolerance','Ghép đỉnh · mm',.001,20,.05)}${scanField('planeTolerance','Dung sai mặt · mm',.001,50,.05)}</div>${action('resetScan','Dung sai mặc định')}</details>
      ${X.scanReport?.warnings?.length?`<details class="mx144-details"><summary>Thông tin quét · ${X.scanReport.warnings.length}</summary>${X.scanReport.warnings.slice(0,30).map(w=>`<p>${esc(w)}</p>`).join('')}</details>`:''}</details></section>`;
    return html;
  }
  function quickFooterHTML(){
    const selected=X.candidates.filter(c=>c.checked===true&&!c.existingId).length,busy=!!X.scanProgress;
    return action('close','Đóng bảng')+action('commit','Tạo LED · '+selected+' viền','primary','id="mx150Commit" '+(busy||!selected||selected>MAX_PATHS-X.paths.length?'disabled':''));
  }
  function blockResultsHTML(busy=false){
    if(!X.candidates.length)return '';
    const filtered=filteredCandidates(),blocks=candidateBlocks(filtered),allBlocks=candidateBlocks(X.candidates),pages=Math.max(1,Math.ceil(blocks.length/PAGE_SIZE)),disabled=busy?'disabled':'';
    X.candidatePage=Math.max(0,Math.min(X.candidatePage,pages-1));
    const page=blocks.slice(X.candidatePage*PAGE_SIZE,(X.candidatePage+1)*PAGE_SIZE),indices=new Map(X.candidates.map((c,i)=>[c,i])),selected=X.candidates.filter(c=>c.checked!==false&&!c.existingId).length,selectedBlocks=allBlocks.filter(b=>b.selectedCount>0).length,available=MAX_PATHS-X.paths.length,guide=candidateGuideState();
    return `<section class="mx147-results"><h4>VIỀN CẠNH TRONG PHẠM VI ĐÃ CHỌN</h4><label>Lọc theo tên object<input id="mx144CandidateFilter" type="search" placeholder="Ví dụ: GoldNose, diecut, vách…" value="${esc(X.candidateFilter)}" ${disabled}></label>
      <div class="mx143-grid"><label>Loại viền<select id="mx144CandidateKind" ${disabled}>${[['all','Tất cả'],['new','Chưa gắn LED'],['outer','Bao ngoài'],['hole','Lỗ / viền trong'],['open','Viền hở']].map(([id,label])=>`<option value="${id}" ${X.candidateKind===id?'selected':''}>${label}</option>`).join('')}</select></label><label>Hiện gợi ý trên model<select id="mx148GuideMode" ${disabled}>${[['selected','Chỉ viền đang chọn'],['none','Ẩn gợi ý'],['all','Xem các viền đang lọc']].map(([id,label])=>`<option value="${id}" ${X.guideMode===id?'selected':''}>${label}</option>`).join('')}</select></label></div>
      ${X.candidateFocus?action('clearFocus','Thoát soi viền / trả góc nhìn','',disabled):''}<p id="mx148GuideStatus" role="status">Hiện ${guide.shown}${guide.total!==guide.shown?'/'+guide.total:''} viền gợi ý${guide.limited?' · giới hạn '+MAX_GUIDES+' viền để dễ quan sát; lọc thêm hoặc Soi viền cần xem.':'.'} ${X.guideMode==='selected'&&!selected?'Chọn một object hoặc mở Xem viền để chọn riêng.':''}</p>
      <p class="mx144-selection" role="status">${blocks.length} object / ${filtered.length} gợi ý · chọn ${selectedBlocks} object / ${selected} viền · còn ${available} chỗ</p>
      <div class="mx143-grid">${action('selectAllBlocks','Chọn các viền đang lọc','',disabled)}${action('noneCandidates','Bỏ chọn tất cả','',disabled)}</div>
      <label>Gom nhóm điều khiển khi tạo LED<select id="mx148CreationGroupMode" ${disabled}><option value="shared" ${X.creationGroupMode!=='perObject'?'selected':''}>Một nhóm chung cho các viền đã chọn</option><option value="perObject" ${X.creationGroupMode==='perObject'?'selected':''}>Một nhóm cho mỗi bộ nguồn</option></select></label>${X.creationGroupMode!=='perObject'?`<label>Tên nhóm chung<input id="mx148CreationGroupName" maxlength="40" value="${esc(X.creationGroupName)}" ${disabled}></label>`:''}
      ${action('commit','Tạo LED cho '+selected+' viền','primary',busy||!selected||selected>available?'disabled':'')}
      ${selected>available?`<p class="mx147-limit" role="alert">Đang chọn ${selected} viền, còn ${available} chỗ. Bỏ bớt khối trước khi tạo LED; chưa có viền nào được thêm.</p>`:''}
      <div class="mx147-blocks">${page.map(b=>{
        const expanded=!!X.blockExpanded?.[b.key],totalPages=Math.max(1,Math.ceil(b.count/PAGE_SIZE)),p=Math.max(0,Math.min(Number(X.blockPages?.[b.key]||0),totalPages-1)),rows=b.candidates.slice(p*PAGE_SIZE,(p+1)*PAGE_SIZE);
        return `<article class="mx147-block ${b.checked?'checked':''} ${b.mixed?'mixed':''}" data-mxblockkey="${b.key}"><div class="mx147-block-head"><label><input type="checkbox" data-mxblock="${b.key}" aria-label="Chọn khối ${esc(b.name)}" ${b.checked?'checked':''} ${busy||!b.newCount?'disabled':''}><span><strong>${esc(b.name)}</strong><small>${b.count}${b.count!==b.total?'/'+b.total:''} viền · ${b.selectedCount} chọn${b.existingCount?' · '+b.existingCount+' đã gắn LED':''}</small></span></label><button type="button" data-mxexpand="${b.key}" aria-expanded="${expanded}" aria-controls="mx147Paths_${b.key}" ${disabled}>${expanded?'Thu gọn':'Xem '+b.count+' viền'}</button></div>
          ${expanded?`<div id="mx147Paths_${b.key}" class="mx147-block-paths">${rows.map(c=>candidateRowHTML(c,indices.get(c),busy)).join('')}${totalPages>1?`<div class="mx144-pages"><button type="button" data-mxblockpage="${b.key}" data-mxdir="-1" ${busy||p===0?'disabled':''}>←</button><span>Viền ${p*PAGE_SIZE+1}–${Math.min((p+1)*PAGE_SIZE,b.count)} / ${b.count}</span><button type="button" data-mxblockpage="${b.key}" data-mxdir="1" ${busy||p===totalPages-1?'disabled':''}>→</button></div>`:''}</div>`:''}</article>`;
      }).join('')||'<p>Không có khối khớp bộ lọc.</p>'}</div>
      ${pages>1?`<div class="mx144-pages">${action('candidatePrev','←','',busy||X.candidatePage===0?'disabled':'')}<span>Trang khối ${X.candidatePage+1}/${pages}</span>${action('candidateNext','→','',busy||X.candidatePage>=pages-1?'disabled':'')}</div>`:''}
      <p>Chỉ các cạnh của khối đang lấy viền xuất hiện ở đây. Chọn viền cần dùng rồi tạo LED; các phần rời vẫn giữ đúng hình học.</p>${action('clearCandidates','Bỏ kết quả quét','',disabled)}</section>`;
  }
  function pathsHTML(){const p=current();
    if(X.mode==='draw'||X.draft.length)return `<section class="mx148-drawing-help"><h4>VẼ MỘT TUYẾN LED</h4><p>Mặt phẳng của điểm đầu được giữ cố định. Các điểm tiếp theo nối thành một đường qua nhiều object, không tự chia thành map nhỏ.</p><p>Đặt thêm điểm tại các đoạn cong. Tạm dừng để xoay hoặc phóng model, sau đó bấm Tiếp tục vẽ. Esc hủy bản vẽ chưa hoàn tất.</p><p>Hoàn tất để chỉnh độ dày, số dải và hiệu ứng. Tuyến vẽ độc lập với từng object nguồn.</p></section>`;
    let html=p?'<div id="mx151AppearanceHost"></div>':'';
    html+=X.mode==='edit'?'':detectionHTML();
    html+=`<section><div class="mx143-section-title"><h4>02 / VIỀN ĐÃ TẠO (${X.paths.length}/${MAX_PATHS})</h4>${action('demo','Mẫu viền cong')}</div><div class="mx143-paths">${X.paths.map(q=>`<button data-mxselect="${q.id}" class="${q.id===X.selected?'active':''}"><i style="background:${q.color}"></i><span>${esc(q.name)}<small>${esc(q.group)} · ${q.rows} dải · ${G.pathLength(q.points,q.closed).toFixed(2)} m</small></span><b>${q.bindingInvalid?'⚠':q.enabled?'●':'○'}</b></button>`).join('')||'<p>Chưa có viền. Bấm Vẽ đường viền hoặc quét rồi chọn các gợi ý cần tạo LED.</p>'}</div></section>`;
    if(!p)return html;
    if(p.bindingInvalid)html+=`<section><p class="mx147-limit" role="alert">Một phần của khối nguồn đã được di chuyển riêng. Viền ghép này tạm tắt; lấy lại viền cạnh của khối rồi thay viền cũ để khớp hình học mới.</p></section>`;
    const info=X.pathData?.(p),point=p.points[Math.min(X.pointIndex,p.points.length-1)];
    html+=`<section><h4>03 / KÍCH THƯỚC & PIXEL</h4>${field('name','Tên viền',p.name,'text','maxlength="80"')}${field('group','Nhóm điều khiển',p.group,'text','maxlength="40"')}<div class="mx143-grid">${field('width','Rộng mỗi dải · mm',+(p.width*1000).toFixed(2),'number','min="1" max="500" step="1"')}${field('pitch','Bước pixel · mm',+(p.pitch*1000).toFixed(2),'number','min="10" max="2000" step="5"')}${field('rows','Số dải song song',p.rows,'number','min="1" max="8" step="1"')}${field('spacing','Khoảng cách tim dải · mm',+(p.spacing*1000).toFixed(2),'number','min="0" max="1000" step="5"')}${field('offset','Dịch ngang viền · mm',+(p.offset*1000).toFixed(2),'number','min="-5000" max="5000" step="5"')}${field('lift','Cách bề mặt · mm',+(p.lift*1000).toFixed(2),'number','min="1" max="500" step="1"')}${field('idle','Sáng nền ngoài cue · %',+(p.idle*100).toFixed(2),'number','min="0" max="100" step="1"')}${field('color','Màu nền',p.color,'color')}</div><div class="mx143-grid">${check('enabled','Bật viền',p.enabled)}${check('diffuser','Dải liền / tán sáng',p.diffuser)}${check('glow','Quầng sáng',p.glow)}${check('reverse','Đảo chiều đường chạy',p.reverse)}${check('closed','Khép kín đường viền',p.closed)}</div><p class="mx143-note">${info?info.count+' pixel/dải · '+(info.count*p.rows)+' pixel · bước thực '+((info.pitchMin??info.pitch)*1000).toFixed(1)+'–'+((info.pitchMax??info.pitch)*1000).toFixed(1)+' mm'+(info.limited?' · Đã giảm mật độ preview theo giới hạn.':'')+(info.error?' · '+info.error:'')+(X.stats?.().geometryError?' · '+X.stats().geometryError:''):'Pixel được lấy đều theo chiều dài đường viền.'}</p><div class="mx143-grid">${action('duplicate','Nhân viền')}${action('delete','Xóa viền','danger')}</div></section>`;
    html+=`<section><h4>04 / CHỈNH ĐƯỜNG VIỀN</h4><div class="mx143-grid">${action('edit','Sửa điểm trên 3D',X.mode==='edit'?'active':'primary')}${action('idle','Xong / xoay camera')}</div><p>Điểm đầu màu vàng chỉ hướng chạy. Kéo điểm trên mặt phẳng viền; nhập XYZ để chỉnh độ sâu.</p><div class="mx143-grid">${field('pointIndex','Điểm đang chọn',X.pointIndex+1,'number',`min="1" max="${p.points.length}" step="1"`)}${action('startPoint','Lấy làm điểm đầu')}</div><div class="mx143-grid thirds">${[0,1,2].map(i=>field('point'+i,['X · m','Y · m','Z · m'][i],+point[i].toFixed(5),'number','min="-100000" max="100000" step="0.0001"')).join('')}</div><div class="mx143-grid">${action('insertPoint','Chèn điểm giữa')}${action('deletePoint','Xóa điểm')}${action('reversePoints','Đảo thứ tự điểm')}${action('trim','Giữ một đoạn viền')}${action('simplify','Gọn điểm · sai số 5 mm')}</div></section>`;
    return html;
  }
  function effectsHTML(){const e=X.effect;return `<section><h4>ĐÍCH & THÔNG SỐ HIỆU ỨNG</h4><div id="mx146EffectBrightnessHost"></div><label>Áp dụng cho<select id="mx143Target">${targetOptions(X.target)}</select></label><div class="mx143-grid">${field('fxSpeed','Tốc độ ×',e.speed,'number','min="0" max="8" step="0.1"')}${field('fxDuration','Thời lượng cue · s',X.duration,'number','min="0.05" max="120" step="0.5"')}${field('fxTail','Độ dài đuôi · pixel',e.tail,'number','min="1" max="512" step="1"')}${field('fxGroup','Pixel mỗi cụm',e.groupSize,'number','min="1" max="512" step="1"')}${field('fxPhase','Lệch pha · chu kỳ',e.phase,'number','min="-100" max="100" step="0.05"')}${field('fxColor','Màu 1',e.color,'color')}${field('fxColor2','Màu 2',e.color2,'color')}</div>${check('fxReverse','Đảo chiều pixel của hiệu ứng',e.reverse)}<p>Chạy theo BPM của SHOW (${seq.bpm||120}). Chọn một mẫu để xem thử; tham số được lưu riêng khi tạo cue.</p></section><section><h4>${FX.presets.length} HIỆU ỨNG LED MATRIX</h4><div class="mx143-presets">${FX.presets.map((p,i)=>`<button data-mxpreset="${p.id}" title="${esc(p.description)}" class="${X.lastPreset===p.id?'active':''}"><small>${String(i+1).padStart(2,'0')}</small><span>${esc(p.name)}</span></button>`).join('')}</div><div class="mx143-note">Đang chọn: ${esc(preset(X.lastPreset)?.name)}${X.live?' · Xem thử':''}</div><div class="mx143-grid">${action('stopPreview','Dừng xem thử')}${action('savePreview','Ghi cue tại playhead','primary')}</div>${action('autoShow','Tạo chuỗi đủ '+FX.presets.length+' hiệu ứng')}</section>`;}
  function cuesHTML(){const clips=seq.clips.filter(isCue).sort((a,b)=>a.start-b.start);return `<section><h4>LED MATRIX / SHOW TIMECODE</h4><div class="mx143-grid">${action('addCue','Thêm cue','primary')}${action('timeline','Mở timeline')}</div><p>${clips.length} cue · Các viền có thể chạy đồng thời với video LED, PAR, LINE và Laser.</p>${clips.map(c=>`<div class="mx143-cue"><button data-mxjump="${c.id}"><strong>${esc(c.name)}</strong><small>${c.start.toFixed(2)}s → ${(c.start+c.duration).toFixed(2)}s · ${esc(cueSpec(c).target)} · sáng ${+(cueSpec(c).brightness*100).toFixed(1)}%</small></button><button data-mxeditcue="${c.id}">Sửa</button><button data-mxcopycue="${c.id}" title="Nhân cue">⧉</button><button data-mxdeletecue="${c.id}" title="Xóa cue">×</button></div>`).join('')||'<p>Chưa có cue LED Matrix. Mở tab Hiệu ứng, xem thử rồi ghi vào timeline.</p>'}</section>`;}
  function paint(){if(!X.isOpen)return;if(X.brightness144?.deferPaint()||X.controls146?.deferPaint()||X.appearance151?.deferPaint())return;const opened=new Set(Array.from(panel.querySelectorAll('details[open]')).map(d=>d.querySelector('summary')?.textContent));const scroll=X.lastPaintTab===X.tab?(panel.querySelector('.mx143-content')?.scrollTop||0):0;X.lastPaintTab=X.tab;panel.innerHTML=`<div class="mx143-head"><div><strong>LED MATRIX / VIỀN</strong><small>Diecut · vách LED · mép sân khấu</small></div>${action('close','✕')}</div><nav class="mx143-tabs">${[['paths','Viền & pixel'],['effects',FX.presets.length+' hiệu ứng'],['cues','Timecode']].map(([id,name])=>`<button data-mxtab="${id}" class="${X.tab===id?'active':''}">${name}</button>`).join('')}</nav>${X.tab==='paths'?drawToolbarHTML():''}<div class="mx143-content">${X.tab==='effects'?effectsHTML():X.tab==='cues'?cuesHTML():pathsHTML()}</div><div class="mx143-footer">${X.tab==='paths'&&X.mode!=='draw'&&X.mode!=='edit'&&!X.draft.length?quickFooterHTML():action('close','Đóng bảng')+action('effects','Hiệu ứng / Timecode','primary')}</div>`;for(const d of panel.querySelectorAll('details'))if(opened.has(d.querySelector('summary')?.textContent))d.open=true;panel.querySelector('.mx143-content').scrollTop=scroll;const blocks=new Map(candidateBlocks().map(b=>[b.key,b]));for(const input of panel.querySelectorAll('[data-mxblock]'))input.indeterminate=!!blocks.get(input.dataset.mxblock)?.mixed;X.brightness144?.mount(panel);X.controls146?.mount(panel);X.appearance151?.mount?.(panel);}
  function demoContours(){if(X.paths.length+3>MAX_PATHS)throw Error('Cần chỗ trống cho 3 viền mẫu.');const b=E.stageBounds||{min:[-9,0,-4],max:[9,7,4]},w=b.max[0]-b.min[0],h=b.max[1]-b.min[1],z=b.max[2]-.3,y=b.min[1]+h*.10;
    return transaction(()=>{const list=[];for(const side of[-1,1]){const points=[];for(let i=0;i<=48;i++){const t=i/48,xx=side*(w*.09+w*.30*t),yy=y+h*(.12+.48*Math.sin(t*Math.PI*.8))+.10*Math.sin(t*17);points.push([xx,yy,z]);}list.push(addPath(points,{name:'Mẫu diecut '+(side<0?'trái':'phải'),group:'DEMO DIECUT',normal:[0,0,1],rows:3,width:.032,spacing:.09,color:'#8fc9ff'},false));}
      list.push(addPath([[b.min[0]+w*.1,y,z+.35],[b.max[0]-w*.1,y,z+.35]],{name:'Mẫu mép sân khấu',group:'DEMO STAGE',normal:[0,0,1],rows:2,width:.035,spacing:.07,color:'#e8f4ff'},false));X.target='all';changed();paint();return list;});
  }
  panel.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;try{
    if(b.dataset.mx149Open){navigateHierarchy(b.dataset.mx149Open);return;}if(b.dataset.mx149Nav){navigateHierarchy(b.dataset.mx149Nav);return;}if(b.dataset.mx149Focus){focusHierarchy(b.dataset.mx149Focus);return;}
    if(b.dataset.mxtab){X.appearance151?.end();if(b.dataset.mxtab!=='paths')setQuickPick(false);setMode('idle');X.tab=b.dataset.mxtab;paint();return;}if(b.dataset.mxselect){select(b.dataset.mxselect);return;}if(b.dataset.mxpreset){preview(b.dataset.mxpreset);return;}if(b.dataset.mxfocus){focusCandidate(b.dataset.mxfocus);return;}if(b.dataset.mxrescan){selectSource(b.dataset.mxrescan);$('mx143Mesh')?.focus();return;}
    if(b.dataset.mxexpand){X.blockExpanded||={};X.blockExpanded[b.dataset.mxexpand]=!X.blockExpanded[b.dataset.mxexpand];paint();return;}if(b.dataset.mxblockpage){X.blockPages||={};X.blockPages[b.dataset.mxblockpage]=Math.max(0,(X.blockPages[b.dataset.mxblockpage]||0)+Number(b.dataset.mxdir));paint();return;}
    if(b.dataset.mxeditcue){editCue(b.dataset.mxeditcue);return;}if(b.dataset.mxcopycue){duplicateCue(b.dataset.mxcopycue);return;}if(b.dataset.mxdeletecue){deleteCue(b.dataset.mxdeletecue);return;}if(b.dataset.mxjump){const c=seq.clips.find(c=>c.id===b.dataset.mxjump);X.live=null;seekTimeline(c.start);setPlaying(true);return;}
    const p=current();switch(b.dataset.mxaction){case 'close':close();break;case 'pick':case 'draw':case 'edit':case 'idle':setQuickPick(false);setMode(b.dataset.mxaction);break;case 'effects':setQuickPick(false);setMode('idle');X.tab='effects';paint();break;
      case 'detect':traceObject().catch(e=>toast(e.message));break;
      case 'quickScan':scanQuickEdges().catch(e=>toast(e.message));break;case 'quickPick':setQuickPick(!X.quickPick150);break;case 'scanAllBlocks':setQuickPick(false);scanAllBlocks().catch(e=>toast(e.message));break;case 'scanHierarchyEdges':scanHierarchyEdges().catch(e=>toast(e.message));break;case 'selectAllBlocks':selectCandidates(true);break;case 'noneCandidates':selectCandidates(false,X.candidates);break;case 'scan':scanStageAsync().catch(e=>toast(e.message));break;case 'cancelScan':cancelScan();break;case 'resetScan':configureScan(DEFAULT_SCAN);break;case 'commit':commitCandidates();break;case 'clearCandidates':cancelScan(false);clearFocus();X.quickFocus150=null;X.candidates=[];X.scanReport=null;paint();break;case 'clearFocus':clearFocus();break;case 'candidatePrev':X.candidatePage--;paint();break;case 'candidateNext':X.candidatePage++;paint();break;case 'allCandidates':{const list=filteredCandidates().filter(c=>!c.existingId),val=list.some(c=>!c.checked);for(const c of list)c.checked=val;paint();break;}
      case 'undoDraft':removeDraftPoint();break;case 'pauseDrawing':pauseDrawing();break;case 'resumeDrawing':resumeDrawing();break;case 'cancelDrawing':cancelDrawing();break;case 'finishOpen':finishDrawing(false);break;case 'finishClosed':finishDrawing(true);break;case 'duplicate':duplicatePath(p?.id);break;case 'delete':removePath(p?.id);break;case 'demo':demoContours();break;
      case 'insertPoint':editPoint('insert');break;case 'deletePoint':editPoint('delete');break;case 'startPoint':editPoint('start');break;case 'reversePoints':if(p)updatePath(p.id,{points:p.points.slice().reverse()});break;case 'simplify':simplifyCurrent();break;case 'trim':trimDialog();break;
      case 'stopPreview':stopPreview();break;case 'savePreview':saveCue();X.tab='cues';paint();toast('Đã ghi cue LED Matrix vào SHOW Timeline.');break;case 'autoShow':autoShow();break;case 'addCue':editCue();break;case 'timeline':toggleSequence(true);renderSequence();break;
    }
  }catch(error){toast(error.message,6000);}});
  panel.addEventListener('change',event=>{const el=event.target;try{
    if(el.id==='mx150OnlySelected'){setGuideMode(el.checked?'selected':'all');return;}
    if(el.id==='mx150IncludeHoles'){X.quickIncludeHoles150=el.checked;scanQuickEdges({includeHoles:el.checked,keepSelection:true}).catch(error=>toast(error.message));return;}
    if(el.id==='mx149EdgeMode'){X.edgeMode149=['main','outer','all'].includes(el.value)?el.value:'main';cancelScan(false);restoreFocusCamera();X.candidates=[];X.scanReport=null;X.candidateFocus=null;X.previewOnly=false;X.detectMessage='Đã đổi phạm vi cạnh. Bấm Lấy viền cạnh khối này để cập nhật.';paint();return;}
    if(el.id==='mx148GuideMode'){setGuideMode(el.value);return;}if(el.id==='mx148CreationGroupMode'){X.creationGroupMode=el.value==='perObject'?'perObject':'shared';paint();return;}if(el.id==='mx148CreationGroupName'){X.creationGroupName=el.value.trim().slice(0,40)||'Viền sân khấu';paint();return;}
    if(el.dataset.mxblock!==undefined){selectBlock(el.dataset.mxblock,el.checked);return;}if(el.dataset.mxcandidate!==undefined){const c=X.candidates[+el.dataset.mxcandidate];if(c)selectCandidates(el.checked,[c]);return;}if(el.id==='mx143Mesh'){if(el.value)selectSource(el.value);else{cancelScan(false);X.meshId='';state.selectedMesh=null;X.pickedFace=null;X.candidates=[];X.scanReport=null;paint();}return;}if(el.id==='mx146OutlineMode'){cancelScan(false);X.outlineMode=el.value==='face'?'face':'object';X.candidates=[];X.scanReport=null;paint();return;}if(el.id==='mx143DetectMode'){configureScan({mode:el.value});return;}if(el.id==='mx144Strategy'){configureScan({strategy:el.value});return;}if(el.id==='mx144ScanScope'){configureScan({scope:el.value});return;}if(el.id==='mx144CandidateKind'){X.candidateKind=el.value;X.candidatePage=0;paint();return;}if(el.dataset.mxscan){if(!el.value.trim()||!Number.isFinite(+el.value))throw Error('Nhập dung sai hợp lệ.');configureScan({[el.dataset.mxscan]:+el.value/(el.dataset.mxscan==='angleToleranceDegrees'?1:1000)});return;}if(el.id==='mx143Target'){configure({target:el.value});return;}
    const key=el.dataset.mxfield;if(!key)return;const value=el.type==='checkbox'?el.checked:el.type==='number'?+el.value:el.value;if(el.type==='number'&&(!el.value.trim()||!Number.isFinite(value)))throw Error('Nhập một số hợp lệ.');
    if(key.startsWith('fx')){const map={fxSpeed:'speed',fxDuration:'duration',fxTail:'tail',fxGroup:'groupSize',fxPhase:'phase',fxBrightness:'brightness',fxColor:'color',fxColor2:'color2',fxReverse:'reverse'};configure({[map[key]]:key==='fxBrightness'?value/100:value});return;}
    const p=current();if(!p)return;if(key==='pointIndex'){X.pointIndex=Math.round(clamp(value-1,0,p.points.length-1));paint();return;}
    if(/^point[012]$/.test(key)){const point=p.points[X.pointIndex].slice();point[+key.at(-1)]=value;updatePoint(X.pointIndex,point);return;}
    updatePath(p.id,{[key]:['width','pitch','spacing','offset','lift'].includes(key)?value/1000:key==='idle'?value/100:value});
  }catch(error){toast(error.message);paint();}});
  panel.addEventListener('input',event=>{const el=event.target;if(el.id!=='mx144CandidateFilter')return;const pos=el.selectionStart;X.candidateFilter=el.value;X.candidatePage=0;paint();const next=$('mx144CandidateFilter');next?.focus();if(next&&pos!=null)next.setSelectionRange(pos,pos);});
  function ray(event){const r=E.canvas.getBoundingClientRect(),inv=M.inverse(E.vp),x=(event.clientX-r.left)/r.width*2-1,y=1-(event.clientY-r.top)/r.height*2,a=M.point(inv,[x,y,-1]),b=M.point(inv,[x,y,1]);return {a,d:vec.unit(vec.sub(b,a))};}
  function planePoint(event,origin,normal){const r=ray(event),den=vec.dot(r.d,normal);if(Math.abs(den)<1e-7)return null;const t=vec.dot(vec.sub(origin,r.a),normal)/den;return t>0?vec.add(r.a,vec.mul(r.d,t)):null;}
  // Quick selection uses the native orbit canvas. Pointer history suppresses
  // drag-return clicks while leaving orbit, right-drag pan and wheel intact.
  const previousQuickClick150=E.onClick;
  E.onClick=function(event,...args){if(handleQuickClick(event))return;return previousQuickClick150?.call(this,event,...args);};
  E.canvas.addEventListener('pointerdown',event=>trackQuickPointer150('down',event),true);
  E.canvas.addEventListener('pointermove',event=>trackQuickPointer150('move',event),true);
  E.canvas.addEventListener('pointerup',event=>trackQuickPointer150('up',event));
  E.canvas.addEventListener('pointercancel',event=>trackQuickPointer150('cancel',event));
  E.canvas.addEventListener('lostpointercapture',event=>trackQuickPointer150('cancel',event));
  window.addEventListener('blur',()=>trackQuickPointer150('cancel',{}));
  overlay.addEventListener('pointerdown',event=>{if(event.button!==0||X.mode==='idle')return;event.preventDefault();event.stopImmediatePropagation();try{
    if(X.mode==='pick'){cancelScan(false);const hit=E.pick(event.clientX,event.clientY,false);if(!hit)throw Error('Bấm lên object vách, diecut hoặc mép sàn trên model.');setMode('idle');traceObject(hit.mesh,{hit:{meshId:hit.mesh.id,normal:hit.normal,point:hit.point}}).catch(e=>toast(e.message));return;}
    if(X.mode==='draw'){const hit=!X.draft.length?E.pick(event.clientX,event.clientY,false):null,point=X.draft.length?planePoint(event,X.draft[0],X.draftNormal):hit?.point;if(!point)throw Error(X.draft.length?'Góc nhìn đang song song với mặt phẳng viền. Tạm dừng, xoay model rồi tiếp tục.':'Điểm đầu cần nằm trên mặt object của model.');appendDraftPoint(point,hit?.normal||X.draftNormal);return;}
    if(X.mode==='edit'){const p=current();if(!p)return;const rect=overlay.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;let nearest=-1,d=14;for(let i=0;i<p.points.length;i++){const q=E.project(p.points[i]);if(q?.z>=-1&&q.z<=1){const dist=Math.hypot(q.x-x,q.y-y);if(dist<d){nearest=i;d=dist;}}}if(nearest<0)return;X.pointIndex=nearest;drag={id:p.id,index:nearest,origin:p.points[nearest].slice(),normal:p.normal.slice(),checkpoint:false,pointerId:event.pointerId};overlay.setPointerCapture(event.pointerId);paint();}
  }catch(error){toast(error.message);}},true);
  overlay.addEventListener('pointermove',event=>{if(!drag)return;const p=X.paths.find(p=>p.id===drag.id),point=planePoint(event,drag.origin,drag.normal);if(!p||!point||!validPoint(point)||Math.hypot(...vec.sub(point,p.points[drag.index]))<1e-7)return;const points=p.points.map(q=>q.slice());points[drag.index]=point;let next;try{next=makePath(points,p);}catch(error){return;}if(next.points.length!==p.points.length)return;if(p.closed){let area=0;for(let i=0;i<points.length;i++)area+=vec.dot(p.normal,vec.cross(vec.sub(points[i],points[0]),vec.sub(points[(i+1)%points.length],points[0])));if(Math.abs(area)<1e-8)return;}if(!drag.checkpoint){checkpoint();drag.checkpoint=true;}p.points=next.points;changed();});
  const endDrag=event=>{if(drag){try{overlay.releasePointerCapture(event.pointerId);}catch(e){}drag=null;refreshCandidateBindings();paint();}};overlay.addEventListener('pointerup',endDrag);overlay.addEventListener('pointercancel',endDrag);
  overlay.addEventListener('contextmenu',e=>{e.preventDefault();setMode('idle');});
  window.addEventListener('keydown',event=>{if(!X.isOpen||X.mode==='idle'&&!X.draft.length||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)||$('modal')?.open)return;
    if(['Escape','Enter','Backspace','Delete'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();try{if(event.key==='Escape'){cancelDrawing();}else if(event.key==='Enter'&&(X.mode==='draw'||X.draft.length))finishDrawing(false);else if(event.key==='Backspace'&&(X.mode==='draw'||X.draft.length)){removeDraftPoint();}else if(event.key==='Delete'&&X.mode==='edit')editPoint('delete');}catch(error){toast(error.message);}}
  },true);
  function ensureButton(){
    const bar=$('pro127bar')||document.querySelector('.navigation-strip');if(!bar)return;
    if(!$('matrix143OpenBtn')){const b=document.createElement('button');b.id='matrix143OpenBtn';b.className='btn small';b.textContent='LED MATRIX VIỀN';b.title='Quét lấy viền · bấm chọn vật thể trên 3D · '+FX.presets.length+' hiệu ứng · độ sáng theo cue timeline';b.onclick=()=>open();bar.prepend(b);}
    if(!$('matrix148DrawBtn')){const b=document.createElement('button');b.id='matrix148DrawBtn';b.className='btn small';b.textContent='✎ VẼ ĐƯỜNG VIỀN';b.title='Vẽ một đường LED liên tục qua nhiều object';b.onclick=()=>{open('paths');if(X.isOpen){setQuickPick(false);resumeDrawing();}};bar.prepend(b);}
  }
  document.addEventListener('click',event=>{if(!X.isOpen)return;const button=event.target.closest('button');if(button?.matches('#fx141OpenBtn,#mount136TopBtn,#laser135TopBtn,#laser135FixtureAdd,#laser135CueShortcut,[data-pro127],[data-quick141],[data-step]'))close();},true);
  const previousSequence146=renderSequence;renderSequence=function(...args){const result=previousSequence146(...args);X.controls146?.mountTimeline();return result;};
  const previousClipDrag146=clipDrag;clipDrag=function(...args){const result=previousClipDrag146(...args);X.controls146?.update();return result;};
  S.renderSequence=(...args)=>renderSequence(...args);
  const previousPresentation=togglePresentation;togglePresentation=function(...args){if(X.isOpen)close();return previousPresentation(...args);};
  // Closing another editor must also release our pointer capture / side panel.
  if(S.fx141){const prev=S.fx141.open;S.fx141.open=function(...args){if(X.isOpen)close();return prev(...args);};}
  Object.assign(X,{refreshCandidateBindings,addPath,updatePath,removePath,duplicatePath,select,selectSource,traceObject,detect,scanStage,scanStageAsync,scanAllBlocks,getHierarchyView,navigateHierarchy,focusHierarchy,scanHierarchyEdges,scanQuickEdges,setQuickPick,pickQuickObject,handleQuickClick,trackQuickPointer150,cancelScan,configureScan,filteredCandidates,candidateBlocks,selectBlock,selectCandidates,candidateGuideState,setGuideMode,focusCandidate,clearFocus,previewCandidates,commitCandidates,setMode,appendDraftPoint,removeDraftPoint,pauseDrawing,resumeDrawing,cancelDrawing,finishDrawing,updatePoint,editPoint,simplifyCurrent,trimPath,
    targetEntries,configure,preview,stopPreview,saveCue,editCue,getCue,updateCueBrightness,updateEffectBrightness,deleteCue,duplicateCue,autoShow,evaluate,effectFor,cueSpec,serialize,restoreBank,open,close,paint,demoContours,
    canvas:overlay,geometry:G,effects:FX,limits:{paths:MAX_PATHS,points:MAX_POINTS,candidates:MAX_CANDIDATES,candidatePoints:MAX_CANDIDATE_POINTS,guides:MAX_GUIDES,edgeSources:MAX_EDGE_SOURCES},vec});
  const previousUI143=renderUI;renderUI=function(...args){const result=previousUI143(...args);ensureButton();return result;};S.renderUI=(...args)=>renderUI(...args);
  ensureButton();setInterval(ensureButton,1500);
})();
