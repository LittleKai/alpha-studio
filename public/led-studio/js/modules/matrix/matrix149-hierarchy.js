/* Creative LED Studio V14.9 — source hierarchy for deliberate block selection.
 * Reads source identities and bounds only. This module never extracts edges,
 * creates LED paths, or changes model vertices, materials, UVs, or visibility.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Matrix149Hierarchy = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const cmp = (a,b) => a < b ? -1 : a > b ? 1 : 0;
  const finite3 = p => p && p.length === 3 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2]);
  const integer = (value,fallback,min,max) => Number.isFinite(+value) ? Math.max(min,Math.min(max,Math.floor(+value))) : fallback;
  const numericId = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
  function box(min,max) {
    if (!finite3(min) || !finite3(max) || min.some((v,i)=>v>max[i])) return null;
    const size=min.map((v,i)=>max[i]-v),center=min.map((v,i)=>v/2+max[i]/2);
    if (!size.every(Number.isFinite) || !center.every(Number.isFinite)) return null;
    return {min:[...min],max:[...max],center,size};
  }
  function union(items) {
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let found=false;
    for (const item of items) if (item) {found=true;for(let k=0;k<3;k++){min[k]=Math.min(min[k],item.min[k]);max[k]=Math.max(max[k],item.max[k]);}}
    return found ? box(min,max) : null;
  }
  function meshBounds(mesh,stats) {
    const cached=box(mesh.bounds?.min,mesh.bounds?.max);if(cached)return cached;
    const p=mesh.p;
    if (!(Array.isArray(p)||ArrayBuffer.isView(p)) || !Number.isInteger(p.length) || p.length<3 || p.length%3) return null;
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<p.length;i++){const value=p[i];if(!Number.isFinite(value))return null;const k=i%3;min[k]=Math.min(min[k],value);max[k]=Math.max(max[k],value);}
    const result=box(min,max);if(result)stats.boundsFromPositions++;return result;
  }
  function keyFor(mesh) {
    for(const value of [mesh.sourceKey,mesh.id]) if((typeof value==='string'&&value.length)||(typeof value==='number'&&Number.isFinite(value)))return String(value);
    return null;
  }
  function ancestry(mesh) {
    const chainPresent=Array.isArray(mesh.nodeChain)&&mesh.nodeChain.length>0,pathPresent=typeof mesh.nodePath==='string'&&mesh.nodePath.length>0;
    let ids=null,names=[];
    if(chainPresent){
      if(mesh.nodeChain.length>256||!mesh.nodeChain.every(n=>n&&numericId(n.id)))return {invalid:true};
      ids=mesh.nodeChain.map(n=>n.id);names=mesh.nodeChain.map(n=>typeof n.name==='string'?n.name:'');
    }
    if(pathPresent){
      if(!/^(?:0|[1-9]\d*)(?:\/(?:0|[1-9]\d*))*$/.test(mesh.nodePath))return {invalid:true};
      const fromPath=mesh.nodePath.split('/').map(Number);
      if(fromPath.length>256||!fromPath.every(numericId))return {invalid:true};
      if(ids&&(ids.length!==fromPath.length||ids.some((n,i)=>n!==fromPath[i])))return {invalid:true};
      ids=fromPath;
    }
    if(!ids)return {invalid:false};
    if(new Set(ids).size!==ids.length)return {invalid:true};
    if(mesh.nodeId!=null&&(!numericId(mesh.nodeId)||mesh.nodeId!==ids.at(-1)))return {invalid:true};
    return {ids,names,invalid:false};
  }
  // Length-delimited fields avoid ambiguous concatenations. Both accumulators
  // consume complete identities; long source keys are never truncated.
  function hash(parts) {
    let a=2166136261,b=0x9e3779b9;
    for(const part of parts){const text=String(part),prefix=text.length+':';
      for(const value of [prefix,text])for(let i=0;i<value.length;i++){const c=value.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822507);b^=b>>>13;}
    }
    return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
  }
  const recordSort=(a,b)=>cmp(a.key,b.key);
  const unitSort=(a,b)=>cmp(a.records[0]?.key||'',b.records[0]?.key||'');
  function leaf(record){return {kind:'mesh',label:record.label,records:[record],bounds:record.bounds};}
  function authored(records,minimum=1) {
    if(records.length===1)return leaf(records[0]);
    const shortest=records.reduce((n,r)=>Math.min(n,r.ids.length),Infinity);let depth=minimum;
    while(depth<shortest&&records.every(r=>r.ids[depth]===records[0].ids[depth]))depth++;
    const labels=records.map(r=>r.names[depth-1]).filter(Boolean).sort(cmp),ids=records[0].ids.slice(0,depth);
    return {kind:'source',label:labels[0]||'Node '+ids.at(-1),nodePath:ids.join('/'),depth,records,bounds:union(records.map(r=>r.bounds))};
  }
  function authoredChildren(unit) {
    const children=[],groups=new Map();
    for(const record of unit.records){
      if(record.ids.length===unit.depth){children.push(leaf(record));continue;}
      const id=record.ids[unit.depth];if(!groups.has(id))groups.set(id,[]);groups.get(id).push(record);
    }
    for(const [,records] of [...groups].sort((a,b)=>a[0]-b[0]))children.push(authored(records,unit.depth+1));
    return children.sort(unitSort);
  }
  function region(units,label) {
    return {kind:'spatial',label,units,records:units.flatMap(u=>u.records).sort(recordSort),bounds:union(units.map(u=>u.bounds))};
  }
  function split(units,count) {
    const groups=[units.slice().sort(unitSort)];
    while(groups.length<count){
      let chosen=-1;
      for(let i=0;i<groups.length;i++)if(groups[i].length>1&&(chosen<0||groups[i].length>groups[chosen].length))chosen=i;
      if(chosen<0)break;
      const group=groups[chosen],lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
      for(const unit of group)if(unit.bounds)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],unit.bounds.center[k]);hi[k]=Math.max(hi[k],unit.bounds.center[k]);}
      let axis=0;for(let k=1;k<3;k++)if(hi[k]-lo[k]>hi[axis]-lo[axis])axis=k;
      group.sort((a,b)=>(a.bounds&&b.bounds?cmp(a.bounds.center[axis],b.bounds.center[axis]):0)||unitSort(a,b));
      const middle=Math.floor(group.length/2);groups.splice(chosen,1,group.slice(0,middle),group.slice(middle));
    }
    return groups;
  }
  function boundedChildren(units,limit) {
    if(units.length<=limit)return units;
    const located=units.filter(u=>u.bounds),missing=units.filter(u=>!u.bounds),groups=[];
    const slots=limit-(located.length&&missing.length?1:0),count=Math.min(slots,Math.max(Math.min(4,slots),Math.ceil(Math.sqrt(located.length||missing.length))));
    if(located.length)groups.push(...split(located,count));
    if(missing.length)groups.push(...(located.length?[missing]:split(missing,count)));
    return groups.map((group,i)=>group.length===1?group[0]:region(group,group.every(u=>!u.bounds)?'Nhóm chưa có tọa độ':'Vùng vị trí '+(i+1)));
  }
  function build(meshes,options={}) {
    if(!Array.isArray(meshes))throw TypeError('Danh sách object cần là một mảng.');
    options=options&&typeof options==='object'?options:{};
    const limits={maxChildren:integer(options.maxChildren??8,8,2,12),maxDepth:integer(options.maxDepth??12,12,1,32),maxNodes:integer(options.maxNodes??8192,8192,1,65536)};
    const stats={inputMeshes:meshes.length,visibleMeshes:0,hiddenMeshes:0,invalidMeshes:0,leafMeshes:0,meshCount:0,reliableHierarchyMeshes:0,fallbackMeshes:0,invalidHierarchyMeshes:0,missingBounds:0,boundsFromPositions:0,totalNodes:0,sourceNodes:0,spatialNodes:0,meshLeaves:0,maxDepth:0,maxChildren:0,compacted:0,mode:'empty'};
    const warnings=[],records=[],keys=new Set();
    for(const mesh of meshes){
      if(!mesh||typeof mesh!=='object'){stats.invalidMeshes++;continue;}
      if(mesh.hidden||mesh.visible===false){stats.hiddenMeshes++;continue;}
      stats.visibleMeshes++;
      const key=keyFor(mesh);if(key===null){stats.invalidMeshes++;continue;}
      if(keys.has(key))throw Error('Trùng mã object nguồn: '+key+'. Cần mã riêng trước khi phân cấp.');keys.add(key);
      const parsed=ancestry(mesh),bounds=meshBounds(mesh,stats);if(!bounds)stats.missingBounds++;
      const label=typeof mesh.name==='string'&&mesh.name.length?mesh.name:'Object '+String(mesh.id??key);
      records.push({key,label,sourceId:mesh.id==null?null:String(mesh.id),bounds,...parsed});
    }
    records.sort(recordSort);
    // A numeric glTF node has one exact ancestry. Reused IDs under conflicting
    // parents are ambiguous, so every affected path uses explicit spatial fallback.
    const prefixes=new Map(),nodeNames=new Map(),conflicts=new Set();
    for(const record of records)if(record.ids){const path=[];for(let i=0;i<record.ids.length;i++){const id=record.ids[i],name=record.names[i];path.push(id);const value=path.join('/');if(prefixes.has(id)&&prefixes.get(id)!==value)conflicts.add(id);else prefixes.set(id,value);if(name){if(nodeNames.has(id)&&nodeNames.get(id)!==name)conflicts.add(id);else nodeNames.set(id,name);}}}
    for(const record of records){if(record.ids?.some(id=>conflicts.has(id))){record.ids=null;record.invalid=true;}if(record.invalid)stats.invalidHierarchyMeshes++;}
    const roots=new Map(),fallback=[];
    for(const record of records){if(record.ids){stats.reliableHierarchyMeshes++;const id=record.ids[0];if(!roots.has(id))roots.set(id,[]);roots.get(id).push(record);}else fallback.push(leaf(record));}
    stats.fallbackMeshes=fallback.length;stats.leafMeshes=stats.meshCount=records.length;
    let units=[...roots].sort((a,b)=>a[0]-b[0]).map(([,group])=>authored(group)).concat(fallback).sort(unitSort);
    // The model-wide ancestor is already represented by the root breadcrumb.
    // Lift its children, including any directly attached mesh primitives.
    while(units.length===1&&units[0].kind==='source')units=authoredChildren(units[0]);
    const identities=new Map();
    function emit(unit,depth,budget) {
      const node={id:'',label:unit.label,bounds:unit.bounds?box(unit.bounds.min,unit.bounds.max):null,meshKeys:unit.records.map(r=>r.key),children:[],kind:unit.kind};
      if(unit.kind==='mesh'){const record=unit.records[0];node.sourceKey=record.key;node.sourceId=record.sourceId;node.sourceName=record.label;stats.meshLeaves++;}
      if(unit.nodePath)node.nodePath=unit.nodePath;
      stats.totalNodes++;stats.maxDepth=Math.max(stats.maxDepth,depth);
      let children=unit.kind==='source'?authoredChildren(unit):unit.units||[];
      if(children.length){
        children=boundedChildren(children,limits.maxChildren);
        if(depth>=limits.maxDepth||budget<children.length+1){node.terminal=true;node.limitReason=depth>=limits.maxDepth?'depth':'nodes';if(node.kind!=='root')node.kind='spatial';stats.compacted++;}
        else{
          const spare=budget-1-children.length,total=children.reduce((sum,u)=>sum+u.records.length,0);
          const portions=children.map((u,i)=>({i,extra:Math.floor(spare*u.records.length/total),fraction:(spare*u.records.length)%total}));
          let left=spare-portions.reduce((sum,p)=>sum+p.extra,0);
          for(const p of portions.slice().sort((a,b)=>b.fraction-a.fraction||a.i-b.i)){if(left<=0)break;p.extra++;left--;}
          node.children=children.map((child,i)=>emit(child,depth+1,1+portions[i].extra));
          stats.maxChildren=Math.max(stats.maxChildren,node.children.length);
        }
      }
      if(node.kind==='source')stats.sourceNodes++;if(node.kind==='spatial')stats.spatialNodes++;
      const base='mx149_'+node.kind+'_'+hash([node.kind,node.nodePath||'',...node.meshKeys]);node.id=base;
      if(!identities.has(base))identities.set(base,[]);identities.get(base).push(node);
      return node;
    }
    const root=emit({kind:'root',label:typeof options.label==='string'&&options.label?options.label:'Toàn bộ model',units,records,bounds:union(records.map(r=>r.bounds))},0,limits.maxNodes);
    // Resolve a hash collision deterministically without confusing selections.
    for(const nodes of identities.values())if(nodes.length>1){nodes.sort((a,b)=>cmp(JSON.stringify([a.nodePath||'',a.meshKeys]),JSON.stringify([b.nodePath||'',b.meshKeys])));nodes.forEach((node,i)=>{node.id+='_'+i;});}
    stats.mode=!records.length?'empty':stats.sourceNodes?(stats.spatialNodes||stats.fallbackMeshes?'mixed':'source'):stats.spatialNodes?'spatial':stats.reliableHierarchyMeshes?(stats.fallbackMeshes?'mixed':'source'):'spatial';
    if(stats.invalidMeshes)warnings.push(stats.invalidMeshes+' mục không có object hoặc mã nguồn hợp lệ, không thể đưa vào cây.');
    if(stats.invalidHierarchyMeshes)warnings.push(stats.invalidHierarchyMeshes+' object có quan hệ node không nhất quán; dùng nhóm theo vị trí thay cho cây nguồn.');
    if(stats.fallbackMeshes)warnings.push(stats.fallbackMeshes+' object không có cây node đáng tin cậy; nhóm vị trí chỉ giúp chọn khối, không tự tạo đường biên.');
    if(stats.missingBounds)warnings.push(stats.missingBounds+' object chưa có giới hạn hình học hợp lệ; vẫn giữ mã nguồn để chọn, không suy đoán vị trí.');
    if(stats.compacted)warnings.push(stats.compacted+' nhóm chạm giới hạn cây; các mã object bên trong vẫn được giữ đầy đủ để xử lý cả nhóm.');
    return {root,tree:root,stats,warnings};
  }
  return {version:'14.9.0',build};
});
