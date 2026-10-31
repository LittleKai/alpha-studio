/* Creative LED Studio V15.0 — automatic, disjoint boundary scan scopes.
 * Authored groups may share a geometry pass. Spatial fallback groups never do.
 * No scene mutation, edge extraction, UI state, or drawing logic lives here.
 */
(function(root,factory){
  const hierarchy=root?.Matrix149Hierarchy||(typeof module==='object'&&module.exports?require('./matrix149-hierarchy.js'):null);
  const api=factory(hierarchy);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.Matrix150Quick=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:this,function(H){
  'use strict';
  const cmp=(a,b)=>a<b?-1:a>b?1:0;
  const integer=(v,fallback,min,max)=>Number.isFinite(+v)?Math.max(min,Math.min(max,Math.floor(+v))):fallback;
  const validId=v=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
  function keyFor(mesh){for(const value of [mesh.sourceKey,mesh.id])if(typeof value==='string'&&value.length||typeof value==='number'&&Number.isFinite(value))return String(value);return null;}
  function sourceIds(mesh){
    let ids=null;
    if(Array.isArray(mesh.nodeChain)&&mesh.nodeChain.length){if(mesh.nodeChain.length>256||!mesh.nodeChain.every(n=>n&&validId(n.id)))return null;ids=mesh.nodeChain.map(n=>n.id);}
    if(typeof mesh.nodePath==='string'&&mesh.nodePath.length){
      if(!/^(?:0|[1-9]\d*)(?:\/(?:0|[1-9]\d*))*$/.test(mesh.nodePath))return null;
      const path=mesh.nodePath.split('/').map(Number);if(path.length>256||!path.every(validId)||ids&&(ids.length!==path.length||ids.some((n,i)=>n!==path[i])))return null;ids=path;
    }
    if(!ids||new Set(ids).size!==ids.length||mesh.nodeId!=null&&(!validId(mesh.nodeId)||mesh.nodeId!==ids.at(-1)))return null;
    return ids;
  }
  function triangleCount(mesh){
    try{const p=mesh.p;if(!(Array.isArray(p)||ArrayBuffer.isView(p))||!Number.isSafeInteger(p.length))return null;return Math.floor(p.length*(Array.isArray(p[0])?3:1)/9);}catch(_){return null;}
  }
  function hash(parts){let a=2166136261,b=0x9e3779b9;
    for(const part of parts){const s=String(part);for(const text of [s.length+':',s])for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822507);b^=b>>>13;}}
    return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
  }
  function plan(meshes,options={}){
    if(!Array.isArray(meshes))throw TypeError('Danh sách object cần là một mảng.');
    options=options&&typeof options==='object'?options:{};
    const maxSources=integer(options.maxSources??32,32,1,32),maxTriangles=integer(options.maxTriangles??300000,300000,1,3000000);
    const records=[],byKey=new Map(),warnings=[];
    const stats={inputMeshes:meshes.length,visibleMeshes:0,hiddenMeshes:0,invalidMeshes:0,meshCount:0,scopeCount:0,sourceScopes:0,singletonScopes:0,splitAuthoredGroups:0,oversizedScopes:0,unknownTriangleMeshes:0,estimatedTriangles:0,maxSources,maxTriangles,hierarchyMode:'empty'};
    for(const mesh of meshes){
      if(!mesh||typeof mesh!=='object'){stats.invalidMeshes++;continue;}
      if(mesh.hidden||mesh.visible===false){stats.hiddenMeshes++;continue;}stats.visibleMeshes++;
      const key=keyFor(mesh);if(key===null){stats.invalidMeshes++;continue;}
      if(byKey.has(key))throw Error('Trùng mã object nguồn: '+key+'. Không thể lập phạm vi quét duy nhất.');
      const triangles=triangleCount(mesh),record={key,mesh,triangles,ids:sourceIds(mesh),label:typeof mesh.name==='string'&&mesh.name?mesh.name:'Object '+String(mesh.id??key)};
      if(triangles===null)stats.unknownTriangleMeshes++;else stats.estimatedTriangles+=triangles;
      records.push(record);byKey.set(key,record);
    }
    records.sort((a,b)=>cmp(a.key,b.key));stats.meshCount=records.length;
    if(!records.length)return {scopes:[],stats,warnings:stats.invalidMeshes?[stats.invalidMeshes+' mục thiếu object hoặc mã nguồn hợp lệ.']:[]};
    let hierarchy=options.hierarchy;
    if(!hierarchy){if(!H?.build)throw Error('Chưa nạp bộ đọc nhóm object Matrix149Hierarchy.');hierarchy=H.build(records.map(r=>r.mesh));}
    const root=hierarchy.root||hierarchy.tree;if(!root||!Array.isArray(root.meshKeys)||!Array.isArray(root.children))throw Error('Cây nhóm object không hợp lệ.');
    stats.hierarchyMode=hierarchy.stats?.mode||'unknown';
    const expected=records.map(r=>r.key),actual=root.meshKeys.slice().sort(cmp);
    if(actual.length!==expected.length||actual.some((key,i)=>typeof key!=='string'||key!==expected[i]))throw Error('Cây nhóm không khớp các object đang hiện. Lập lại phạm vi quét.');
    const visited=new Set(),stack=[root];
    while(stack.length){const node=stack.pop();if(!node||visited.has(node)||!Array.isArray(node.meshKeys)||!Array.isArray(node.children))throw Error('Cây nhóm bị lặp hoặc không hợp lệ.');visited.add(node);
      const keys=node.meshKeys.slice().sort(cmp);if(new Set(keys).size!==keys.length||keys.some(k=>typeof k!=='string'||!byKey.has(k)))throw Error('Mã nguồn trong cây nhóm không hợp lệ.');
      if(node.children.length){const children=node.children.flatMap(n=>Array.isArray(n?.meshKeys)?n.meshKeys:[]).sort(cmp);if(children.length!==keys.length||children.some((k,i)=>k!==keys[i]))throw Error('Các nhóm con phải chia nguồn riêng biệt và đầy đủ.');stack.push(...node.children);}
    }
    // H.build removes a model-wide unary ancestry. Recover it only when every
    // visible record has validated numeric ancestry, so a one-block model still
    // cancels seams between its authored primitives. Independent root meshes
    // have no common node and remain separate scopes.
    let start=root;
    if(records.length>1&&hierarchy.stats?.reliableHierarchyMeshes===records.length&&!hierarchy.stats?.invalidHierarchyMeshes&&records.every(r=>r.ids)){
      let common=records.reduce((n,r)=>Math.min(n,r.ids.length),Infinity);
      for(let i=0;i<common;i++)if(records.some(r=>r.ids[i]!==records[0].ids[i])){common=i;break;}
      if(common){const ids=records[0].ids.slice(0,common),names=records.map(r=>r.mesh.nodeChain?.[common-1]?.name).filter(n=>typeof n==='string'&&n).sort(cmp);
        start={kind:'source',nodePath:ids.join('/'),label:names[0]||'Node '+ids.at(-1),meshKeys:expected,children:root.children};}
    }
    const scopes=[],claimed=new Set();
    function add(keys,label){
      keys=keys.slice().sort(cmp);if(!keys.length)return;
      if(keys.length>maxSources||keys.some(k=>claimed.has(k)))throw Error('Phạm vi quét bị trùng nguồn hoặc vượt giới hạn.');
      for(const key of keys)claimed.add(key);
      const scope={id:'mx150_scope_'+hash(keys),label:label||byKey.get(keys[0]).label,meshKeys:keys};scopes.push(scope);
      if(keys.length===1){stats.singletonScopes++;if((byKey.get(keys[0]).triangles??0)>maxTriangles)stats.oversizedScopes++;}else stats.sourceScopes++;
    }
    function visit(node){
      const keys=node.meshKeys,recordsHere=keys.map(k=>byKey.get(k));
      const prefix=typeof node.nodePath==='string'&&/^(?:0|[1-9]\d*)(?:\/(?:0|[1-9]\d*))*$/.test(node.nodePath)?node.nodePath.split('/').map(Number):null;
      const authored=node.kind==='source'&&prefix&&recordsHere.every(r=>r.ids&&prefix.length<=r.ids.length&&prefix.every((n,i)=>n===r.ids[i]));
      const known=recordsHere.every(r=>r.triangles!==null),triangles=recordsHere.reduce((sum,r)=>sum+(r.triangles||0),0);
      if(authored&&keys.length<=maxSources&&(keys.length===1||known&&triangles<=maxTriangles)){add(keys,node.label);return;}
      if(authored)stats.splitAuthoredGroups++;
      if(node.children.length){for(const child of node.children)visit(child);return;}
      // A spatial/depth-budget bucket is navigation metadata, never proof that
      // unrelated objects should share a geometry extraction.
      for(const key of keys)add([key],byKey.get(key).label);
    }
    visit(start);
    if(claimed.size!==records.length)throw Error('Phạm vi quét chưa bao phủ đủ nguồn.');
    scopes.sort((a,b)=>cmp(a.meshKeys[0],b.meshKeys[0])||cmp(a.id,b.id));
    const ids=new Map();for(const scope of scopes){if(!ids.has(scope.id))ids.set(scope.id,[]);ids.get(scope.id).push(scope);}
    for(const same of ids.values())if(same.length>1)same.forEach((scope,i)=>{scope.id+='_'+i;});
    stats.scopeCount=scopes.length;
    if(stats.invalidMeshes)warnings.push(stats.invalidMeshes+' mục thiếu object hoặc mã nguồn hợp lệ, chưa thể quét.');
    if(hierarchy.stats?.invalidHierarchyMeshes)warnings.push(hierarchy.stats.invalidHierarchyMeshes+' object có quan hệ nhóm không nhất quán; các nguồn đó được quét riêng.');
    if(stats.oversizedScopes)warnings.push(stats.oversizedScopes+' object riêng lẻ vượt '+maxTriangles+' tam giác; vẫn có trong danh sách quét để báo kết quả hoặc giới hạn rõ ràng.');
    if(stats.unknownTriangleMeshes)warnings.push(stats.unknownTriangleMeshes+' object chưa đếm được tam giác; quét riêng để không vượt ngân sách của cả nhóm.');
    return {scopes,stats,warnings};
  }
  const finitePoint=p=>(Array.isArray(p)||ArrayBuffer.isView(p))&&p.length===3&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Number.isFinite(p[2]);
  function pathMetrics(path){
    const p=path?.points,closed=path?.closed===true;
    if(!Array.isArray(p)||p.length<(closed?3:2)||!p.every(finitePoint))return null;
    let length=0,n=[0,0,0];
    for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(i+1<p.length||closed)length+=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);if(closed){n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1]);}}
    if(!Number.isFinite(length)||length<=0)return null;
    const rawArea=Number.isFinite(path.absArea)?Math.abs(path.absArea):Number.isFinite(path.area)?Math.abs(path.area):Math.hypot(...n)/2;
    if(!Number.isFinite(rawArea))return null;
    return {path,closed,hole:path.isHole===true,area:closed?rawArea:0,length:Number.isFinite(path.length)&&path.length>=0?path.length:length,component:validId(path.componentIndex)?path.componentIndex:null,signature:null};
  }
  function signature(entry){return entry.signature??(entry.signature=JSON.stringify([entry.path.points,entry.path.normal||null,entry.path.planeIndex??null,entry.path.id??null]));}
  const priority=(a,b)=>Number(b.closed)-Number(a.closed)||b.area-a.area||b.length-a.length||cmp(signature(a),signature(b));
  // Input must come from ONE extraction: componentIndex is local to that call.
  // Return original path objects unchanged so contributor and plane metadata stay intact.
  function chooseContours(paths,mode='main'){
    if(!Array.isArray(paths))throw TypeError('Danh sách viền cần là một mảng.');
    if(!['main','outer','all'].includes(mode))throw Error('Phạm vi cạnh cần là main, outer hoặc all.');
    const valid=paths.map(pathMetrics).filter(Boolean),warnings=[],chosen=[],byComponent=new Map();
    if(mode==='all')chosen.push(...valid);
    else if(mode==='outer')chosen.push(...valid.filter(e=>!e.hole));
    else for(const entry of valid){if(entry.hole)continue;if(entry.component===null){chosen.push(entry);continue;}const prior=byComponent.get(entry.component);if(!prior||priority(entry,prior)<0)byComponent.set(entry.component,entry);}
    if(mode==='main')chosen.push(...byComponent.values());chosen.sort(priority);
    const holes=valid.filter(e=>e.hole).length,selectedHoles=chosen.filter(e=>e.hole).length,unknown=valid.filter(e=>e.component===null).length;
    const stats={mode,inputPaths:paths.length,validPaths:valid.length,selectedPaths:chosen.length,omittedPaths:paths.length-chosen.length,invalidPaths:paths.length-valid.length,omittedHoles:holes-selectedHoles,omittedOuter:valid.length-holes-(chosen.length-selectedHoles),components:new Set(valid.filter(e=>e.component!==null).map(e=>e.component)).size+unknown,unknownComponentPaths:unknown};
    if(stats.invalidPaths)warnings.push(stats.invalidPaths+' viền có điểm hoặc độ dài không hợp lệ, chưa thể dùng.');
    if(unknown&&mode==='main')warnings.push(unknown+' viền chưa có mã mảng liên thông; giữ riêng các bao ngoài thay vì gộp nhầm.');
    return {paths:chosen.map(e=>e.path),stats,warnings};
  }
  return {version:'15.0.0',plan,chooseContours};
});
