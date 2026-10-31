/* V14.6 LED Matrix geometry: selected-object orientation hints and real mesh boundaries.
 * Pure helpers. Triangle soup is read without modifying scene meshes or UVs.
 * Front +Z, back -Z, top +Y, bottom -Y, left -X, right +X.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Matrix143Geometry = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const EPS = 1e-12, TAU = Math.PI * 2;
  const DIRECTIONS = { front:[0,0,1], back:[0,0,-1], top:[0,1,0], bottom:[0,-1,0], left:[-1,0,0], right:[1,0,0] };
  const sub = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const add = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
  const mul = (a,s) => [a[0]*s,a[1]*s,a[2]*s];
  const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm = a => Math.hypot(a[0],a[1],a[2]);
  const unit = a => {const length=norm(a);return length>EPS?mul(a,1/length):null;};
  const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  const finitePoint = p => p && p.length>=3 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2]);
  const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
  const number = (x,fallback) => Number.isFinite(+x)?+x:fallback;
  const copy = p => [p[0],p[1],p[2]];

  function cleanPoints(points, closed, epsilon = EPS) {
    if (!points || typeof points.length !== 'number') return [];
    const out=[];
    for (let i=0;i<Math.min(points.length,1000000);i++) {
      const p=points[i];
      if (!finitePoint(p)) continue;
      if (!out.length || distance(out[out.length-1],p)>epsilon) out.push(copy(p));
    }
    if (closed && out.length>1 && distance(out[0],out[out.length-1])<=epsilon) out.pop();
    return out;
  }
  function pathLength(points, closed = false) {
    const p=cleanPoints(points,closed); let length=0;
    for(let i=1;i<p.length;i++)length+=distance(p[i-1],p[i]);
    if(closed&&p.length>2)length+=distance(p[p.length-1],p[0]);
    return length;
  }
  function lineDistanceSquared(p,a,b) {
    const d=sub(b,a),dd=dot(d,d),t=dd>EPS*EPS?clamp(dot(sub(p,a),d)/dd,0,1):0;
    const q=sub(p,add(a,mul(d,t))); return dot(q,q);
  }
  function rdp(points,tolerance) {
    if(points.length<3||tolerance<=0)return points.map(copy);
    const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;
    const work=[[0,points.length-1]],threshold=tolerance*tolerance;let visits=0;
    while(work.length){
      const [first,last]=work.pop();let best=-1,max=threshold;
      for(let i=first+1;i<last;i++){
        if(++visits>4000000)return points.map(copy); // Bound pathological zigzags; keep detail rather than delete it.
        const d=lineDistanceSquared(points[i],points[first],points[last]);if(d>max){max=d;best=i;}
      }
      if(best!==-1){keep[best]=1;work.push([first,best],[best,last]);}
    }
    return points.filter((_,i)=>keep[i]).map(copy);
  }
  function simplify(points, tolerance = 0, closed = false) {
    const t=Math.max(0,number(tolerance,0)),p=cleanPoints(points,closed,Math.max(EPS,t*.02));
    if(p.length<3||t===0)return p;
    if(!closed)return rdp(p,t);
    // A closed ring needs two distinct endpoints for RDP. Split at a distant
    // vertex, then simplify each arc without introducing a seam or a chord.
    let far=1,best=0;for(let i=1;i<p.length;i++){const d=distance(p[0],p[i]);if(d>best){best=d;far=i;}}
    const a=rdp(p.slice(0,far+1),t),b=rdp(p.slice(far).concat([p[0]]),t);
    const result=a.slice(0,-1).concat(b.slice(0,-1));
    return result.length>=3?result:p; // Never collapse a closed outline to two points.
  }
  function inferNormal(points) {
    if(points.length<3)return null;
    const origin=points[0];let n=[0,0,0];
    for(let i=1;i+1<points.length;i++)n=add(n,cross(sub(points[i],origin),sub(points[i+1],origin)));
    return unit(n);
  }
  function signedArea(points,normal) {
    if(points.length<3)return 0;
    const origin=points[0];let sum=0;
    for(let i=1;i+1<points.length;i++)sum+=dot(normal,cross(sub(points[i],origin),sub(points[i+1],origin)));
    return sum*.5;
  }
  function bounds(points) {
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const p of points)for(let k=0;k<3;k++){min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);}
    return {min,max,center:min.map((v,i)=>(v+max[i])*.5),size:min.map((v,i)=>max[i]-v)};
  }
  function samplePath(points, closed = false, pitch = .1, maxPixels = 2048) {
    const p=cleanPoints(points,closed),requestedPitch=Math.max(1e-6,number(pitch,.1));
    const limit=clamp(Math.floor(number(maxPixels,2048)),1,16384);
    const empty={positions:[],tangents:[],length:0,count:0,pitch:0,requestedPitch,capped:false,closed:!!closed};
    if(p.length<2)return empty;
    const segments=[],ends=[];let length=0;
    for(let i=0;i<p.length-(closed?0:1);i++){
      const a=p[i],b=p[(i+1)%p.length],d=sub(b,a),size=norm(d);
      if(size<=EPS)continue;segments.push({a,b,size,direction:mul(d,1/size)});length+=size;ends.push(length);
    }
    if(!segments.length||length<=EPS)return empty;
    const desired=closed?Math.max(1,Math.round(length/requestedPitch)):Math.max(2,Math.round(length/requestedPitch)+1);
    const count=Math.min(limit,desired),actualPitch=count>1?length/(closed?count:count-1):closed?length:0;
    const positions=[],tangents=[];let segment=0;
    for(let i=0;i<count;i++){
      const at=count===1&&!closed?length*.5:i*actualPitch;
      while(segment<segments.length-1&&at>ends[segment]+EPS)segment++;
      const s=segments[segment],start=segment?ends[segment-1]:0,t=clamp((at-start)/s.size,0,1);
      positions.push(add(s.a,mul(sub(s.b,s.a),t)));
      let tangent=s.direction;
      // Average directions exactly at a vertex to keep fixtures steady at corners.
      if(t<1e-8&&(segment>0||closed))tangent=unit(add(segments[(segment-1+segments.length)%segments.length].direction,s.direction))||tangent;
      else if(t>1-1e-8&&(segment+1<segments.length||closed))tangent=unit(add(s.direction,segments[(segment+1)%segments.length].direction))||tangent;
      tangents.push(copy(tangent));
    }
    return {positions,tangents,length,count,pitch:actualPitch,requestedPitch,capped:count<desired,closed:!!closed};
  }
  function offsetPath(points, closed = false, normal = [0,0,1], offset = 0) {
    const p=cleanPoints(points,closed),n=finitePoint(normal)?unit(normal):inferNormal(p),amount=number(offset,0);
    if(p.length<2||!n||Math.abs(amount)<=EPS)return p;
    const sides=[];
    for(let i=0;i<p.length-(closed?0:1);i++){
      const direction=unit(sub(p[(i+1)%p.length],p[i]));
      sides.push(direction?unit(cross(direction,n)):null);
    }
    return p.map((point,i)=>{
      let before=i>0?sides[i-1]:closed?sides[sides.length-1]:null;
      let after=i<sides.length?sides[i]:closed?sides[0]:null;
      if(!before)before=after;if(!after)after=before;if(!before||!after)return copy(point);
      const miter=unit(add(before,after));
      if(!miter)return add(point,mul(after,amount));
      const denominator=dot(miter,after);
      const length=Math.abs(denominator)>1e-8?amount/denominator:amount;
      const limited=clamp(length,-Math.abs(amount)*4,Math.abs(amount)*4);
      return add(point,mul(miter,limited));
    });
  }

  function canonicalNormal(normal) {
    // Choosing the largest component avoids a hemisphere flip when a nearly
    // flat face has tiny positive/negative noise in its X or Y normal.
    let axis=2;for(const k of [1,0])if(Math.abs(normal[k])>Math.abs(normal[axis]))axis=k;
    return normal[axis]<0?mul(normal,-1):copy(normal);
  }
  function autoFacing(normal) {
    for(const k of [2,1,0])if(Math.abs(normal[k])>.1)return normal[k]<0?mul(normal,-1):copy(normal);
    return copy(normal);
  }
  function meshBuffer(mesh) {
    const p=mesh?.p||mesh?.positions||mesh?.vertices;
    if(!p||typeof p.length!=='number')return null;
    if(Array.isArray(p[0])){
      const flattened=new Float64Array(p.length*3);
      for(let i=0;i<p.length;i++)for(let j=0;j<3;j++)flattened[i*3+j]=p[i]?.[j];
      return flattened;
    }
    return p;
  }
  function weldFactory(tolerance,stats) {
    const grid=new Map(),vertices=[],squared=tolerance*tolerance;
    function weld(p){
      const cell=p.map(v=>Math.floor(v/tolerance));let found=-1,best=squared;
      for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
        const candidates=grid.get((cell[0]+x)+','+(cell[1]+y)+','+(cell[2]+z));
        if(!candidates)continue;
        for(const index of candidates){const d=sub(vertices[index],p),dd=dot(d,d);if(dd<=best&&(dd<best||found<0||index<found)){found=index;best=dd;}}
      }
      if(found>=0){stats.maxWeldDistance=Math.max(stats.maxWeldDistance,Math.sqrt(best));return found;}
      const index=vertices.length,key=cell.join(',');vertices.push(copy(p));
      if(!grid.has(key))grid.set(key,[]);grid.get(key).push(index);return index;
    }
    return {weld,vertices};
  }
  function budgetError(message) {const error=new Error(message);error.geometryLimit=true;return error;}
  function normalGroups(triangles,cosine,angle) {
    const groups=[],bins=new Map(),step=Math.max(1e-6,2*Math.sin(angle*Math.PI/360));
    const order=triangles.slice().sort((a,b)=>b.area-a.area||a.index-b.index);
    for(const triangle of order){
      const n=canonicalNormal(triangle.normal);let group=null,best=cosine;
      for(const sign of [1,-1]){
        const cell=n.map(v=>Math.floor(v*sign/step));
        for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
          for(const candidate of bins.get((cell[0]+x)+','+(cell[1]+y)+','+(cell[2]+z))||[]){
            const alignment=Math.abs(dot(candidate.normal,n));if(alignment>=best){best=alignment;group=candidate;}
          }
        }
      }
      if(!group){group={normal:n,area:0};groups.push(group);const key=n.map(v=>Math.floor(v/step)).join(',');if(!bins.has(key))bins.set(key,[]);bins.get(key).push(group);}
      group.area+=triangle.area;
    }
    return groups;
  }
  function chooseNormal(groups,options) {
    if(options.normal!=null)return finitePoint(options.normal)?unit(options.normal):null;
    // A whole-object pick supplies an orientation hint, not a strict normal or
    // a spatial plane selection. Select an actual face orientation separately
    // for every connected component so rotated/disjoint parts remain eligible.
    // This also avoids picking a broad side wall of a narrow extruded strip.
    const preferred=options.mode==='auto'&&options.preferredNormal!=null?unit(options.preferredNormal):null;
    if(preferred){
      let best=null,bestAlignment=-1,bestArea=-1;
      for(const group of groups){
        const alignment=Math.min(1,Math.abs(dot(group.normal,preferred)));
        if(alignment>bestAlignment+1e-8||Math.abs(alignment-bestAlignment)<=1e-8&&group.area>bestArea){best=group.normal;bestAlignment=alignment;bestArea=group.area;}
      }
      if(!best)return null;
      const facing=dot(best,preferred);
      return Math.abs(facing)<=1e-8?autoFacing(best):facing<0?mul(best,-1):copy(best);
    }
    const axis=DIRECTIONS[options.mode];let best=null,bestScore=-1;
    for(const group of groups){
      const n=group.normal,alignment=axis?Math.abs(dot(n,axis)):1;
      if(axis&&alignment<.15)continue;
      const score=group.area*Math.pow(alignment,4);
      if(score>bestScore*(1+1e-9)){best=n;bestScore=score;}
      else if(Math.abs(score-bestScore)<=Math.max(EPS,bestScore*1e-9)&&best&&Math.abs(n[2])>Math.abs(best[2]))best=n;
    }
    if(!best)return null;
    return axis?(dot(best,axis)<0?mul(best,-1):copy(best)):autoFacing(best);
  }
  function vertexTree(indices,points) {
    // Balanced spatial index. Queries visit only boxes intersecting the real
    // edge corridor; an oblique long edge does not scan its entire 2D AABB.
    const ids=indices.slice();
    function select(lo,hi,k,axis){
      const compare=(a,b)=>points[a][axis]-points[b][axis]||a-b;
      while(lo<hi){
        const pivot=ids[(lo+hi)>>1];let i=lo,left=lo,right=hi;
        while(i<=right){const c=compare(ids[i],pivot);if(c<0){[ids[i],ids[left]]=[ids[left],ids[i]];i++;left++;}else if(c>0){[ids[i],ids[right]]=[ids[right],ids[i]];right--;}else i++;}
        if(k<left)hi=left-1;else if(k>right)lo=right+1;else return;
      }
    }
    function build(start,end){
      const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
      for(let i=start;i<end;i++)for(let k=0;k<3;k++){min[k]=Math.min(min[k],points[ids[i]][k]);max[k]=Math.max(max[k],points[ids[i]][k]);}
      const node={min,max,start,end};
      if(end-start>16){let axis=0;for(let k=1;k<3;k++)if(max[k]-min[k]>max[axis]-min[axis])axis=k;const mid=(start+end)>>1;select(start,end-1,mid,axis);node.left=build(start,mid);node.right=build(mid,end);}
      return node;
    }
    return ids.length?{root:build(0,ids.length),ids}:null;
  }
  function segmentHitsBox(a,d,node,tolerance) {
    let low=0,high=1;
    for(let k=0;k<3;k++){
      const min=node.min[k]-tolerance,max=node.max[k]+tolerance;
      if(Math.abs(d[k])<=1e-30){if(a[k]<min||a[k]>max)return false;continue;}
      let t0=(min-a[k])/d[k],t1=(max-a[k])/d[k];if(t0>t1)[t0,t1]=[t1,t0];low=Math.max(low,t0);high=Math.min(high,t1);if(low>high)return false;
    }
    return true;
  }
  function buildTopology(input,tolerance,stats,settings) {
    const welder=weldFactory(tolerance,stats),seen=new Set(),triangles=[],edgeMap=new Map();
    for(const original of input){
      const ids=original.points.map(welder.weld);
      if(ids[0]===ids[1]||ids[1]===ids[2]||ids[2]===ids[0]){stats.degenerateTriangles++;continue;}
      const signature=ids.slice().sort((a,b)=>a-b).join(':');if(seen.has(signature)){stats.duplicateTriangles++;continue;}seen.add(signature);
      const points=ids.map(i=>welder.vertices[i]),n=cross(sub(points[1],points[0]),sub(points[2],points[0])),size=norm(n);
      if(size<=1e-20){stats.degenerateTriangles++;continue;}
      const triangle={...original,ids,points,normal:mul(n,1/size),area:size*.5,index:triangles.length,edges:[]};triangles.push(triangle);
      for(let i=0;i<3;i++){
        const a=Math.min(ids[i],ids[(i+1)%3]),b=Math.max(ids[i],ids[(i+1)%3]),key=a+':'+b;
        let edge=edgeMap.get(key);if(!edge){edge={a,b,triangles:[],parts:null,chain:null};edgeMap.set(key,edge);}
        edge.triangles.push(triangle.index);triangle.edges.push(edge);
      }
    }
    const points=welder.vertices;stats.weldedVertices=points.length;stats.uniqueTriangles=triangles.length;
    const endpointIds=new Set(),incident=new Map();
    for(const edge of edgeMap.values())if(edge.triangles.length===1){
      endpointIds.add(edge.a);endpointIds.add(edge.b);
      for(const [a,b]of [[edge.a,edge.b],[edge.b,edge.a]]){if(!incident.has(a))incident.set(a,[]);incident.get(a).push(b);}
    }
    const tree=vertexTree([...endpointIds],points),junctions=new Set(),squared=tolerance*tolerance;
    const maxChecks=clamp(Math.floor(number(settings.maxTopologyChecks,12000000)),1,50000000);
    stats.maxTopologyChecks=maxChecks;
    function tick(){if(++stats.topologyChecks>maxChecks)throw budgetError('Topology work limit exceeded. Select a smaller section or increase maxTopologyChecks; no partial outline was produced.');}
    if(tree)for(const edge of edgeMap.values()){
      const a=points[edge.a],b=points[edge.b],d=sub(b,a),dd=dot(d,d),length=Math.sqrt(dd),margin=Math.min(.499999,tolerance/length),hits=[];
      const stack=[tree.root];
      while(stack.length){
        const node=stack.pop();tick();if(!segmentHitsBox(a,d,node,tolerance))continue;
        if(node.left){stack.push(node.left,node.right);continue;}
        for(let j=node.start;j<node.end;j++){
          tick();const id=tree.ids[j];if(id===edge.a||id===edge.b)continue;
          const p=points[id],relative=sub(p,a),at=dot(relative,d)/dd;if(at<=margin||at>=1-margin)continue;
          const deviation=sub(relative,mul(d,at)),distanceSquared=dot(deviation,deviation);if(distanceSquared>squared)continue;
          // A nearby isolated point is not a T junction. Require a real
          // incident edge which overlaps this edge along the same line.
          let overlaps=false;
          for(const other of incident.get(id)||[]){
            tick();const q=sub(points[other],a),t=dot(q,d)/dd,off=sub(q,mul(d,t));
            if(dot(off,off)<=squared&&Math.min(1,Math.max(at,t))-Math.max(0,Math.min(at,t))>margin){overlaps=true;break;}
          }
          if(overlaps){hits.push({id,at,deviation:Math.sqrt(distanceSquared)});junctions.add(id);}
        }
      }
      if(hits.length){
        hits.sort((a,b)=>a.at-b.at||a.id-b.id);const chain=[edge.a];
        for(const hit of hits)if(hit.id!==chain[chain.length-1]){chain.push(hit.id);stats.maxTJunctionDeviation=Math.max(stats.maxTJunctionDeviation,hit.deviation);}
        chain.push(edge.b);edge.chain=chain;stats.splitEdges++;stats.splitSegments+=chain.length-2;
      }
    }
    stats.tJunctions=junctions.size;
    const parents=new Int32Array(triangles.length);for(let i=0;i<parents.length;i++)parents[i]=i;
    const rank=new Uint8Array(parents.length),atoms=new Map();
    function find(a){let root=a;while(parents[root]!==root)root=parents[root];while(parents[a]!==a){const next=parents[a];parents[a]=root;a=next;}return root;}
    function join(a,b){a=find(a);b=find(b);if(a===b)return;if(rank[a]<rank[b])[a,b]=[b,a];parents[b]=a;if(rank[a]===rank[b])rank[a]++;}
    const maxAtomicEdges=clamp(Math.floor(number(settings.maxAtomicEdges,1500000)),3,3000000);stats.maxAtomicEdges=maxAtomicEdges;
    for(const edge of edgeMap.values()){
      const chain=edge.chain||[edge.a,edge.b];edge.chain=chain;edge.parts=[];
      for(let i=0;i+1<chain.length;i++){
        const a=Math.min(chain[i],chain[i+1]),b=Math.max(chain[i],chain[i+1]),key=a+':'+b;let atom=atoms.get(key);
        if(!atom){atom={a,b,triangles:[]};atoms.set(key,atom);if(atoms.size>maxAtomicEdges)throw budgetError('Split-edge limit exceeded; no partial outline was produced. Select a smaller mesh.');}
        for(const id of edge.triangles){if(atom.triangles.length)join(atom.triangles[0],id);atom.triangles.push(id);}
        edge.parts.push(atom);
      }
    }
    stats.atomicEdges=atoms.size;
    const components=[],componentMap=new Map();
    for(const triangle of triangles){const root=find(triangle.index);let component=componentMap.get(root);if(!component){component={index:components.length,triangles:[]};components.push(component);componentMap.set(root,component);}triangle.componentIndex=component.index;component.triangles.push(triangle);}
    stats.components=components.length;
    return {triangles,points,components};
  }
  function nextEdge(indices,edges,vertices,incoming,normal) {
    if(indices.length===1||!incoming)return indices[0];
    let result=indices[0],best=Infinity;
    for(const index of indices){
      const edge=edges[index],direction=unit(sub(vertices[edge.b],vertices[edge.a]));if(!direction)continue;
      let angle=Math.atan2(dot(normal,cross(incoming,direction)),dot(incoming,direction));if(angle<-1e-10)angle+=TAU;
      if(angle<best){best=angle;result=index;}
    }
    return result;
  }
  function exactCollinear(points,closed,stats) {
    if(points.length<3)return points.map(copy);
    // This is only removal of numerically exact straight-line tessellation.
    // The weld/plane tolerances are never reused as a simplification tolerance.
    const magnitude=Math.max(1,...points.slice(0,1).flat().map(Math.abs));
    const epsilon=Number.EPSILON*magnitude*64,result=[];
    for(let i=0;i<points.length;i++){
      if(!closed&&(i===0||i===points.length-1)){result.push(copy(points[i]));continue;}
      const a=points[(i-1+points.length)%points.length],b=points[i],c=points[(i+1)%points.length];
      if(lineDistanceSquared(b,a,c)<=epsilon*epsilon&&dot(sub(b,a),sub(c,b))>=0){if(stats)stats.collinearVerticesRemoved++;continue;}
      result.push(copy(b));
    }
    return result.length>=(closed?3:2)?result:points.map(copy);
  }
  function planeBoundaries(plane,points,stats,options) {
    const normal=plane.normal,edges=new Map();
    for(const triangle of plane.triangles){
      const reverse=dot(triangle.normal,normal)<0;
      for(let i=0;i<3;i++){
        const edge=triangle.edges[i],chain=edge.chain,forward=(triangle.ids[i]===edge.a)!==reverse;
        for(let j=0;j+1<chain.length;j++){
          const a=forward?chain[j]:chain[j+1],b=forward?chain[j+1]:chain[j],lo=Math.min(a,b),hi=Math.max(a,b),key=lo+':'+hi;
          let item=edges.get(key);if(!item){item={a:lo,b:hi,positive:0,negative:0};edges.set(key,item);}
          item[a===lo?'positive':'negative']++;
        }
      }
    }
    const boundary=[];plane.internalEdges=0;plane.nonManifoldEdges=0;plane.orientationConflicts=0;
    for(const edge of edges.values()){
      const total=edge.positive+edge.negative,balance=edge.positive-edge.negative;
      // Signed cancellation keeps the physical outer boundary when identical
      // coplanar faces were exported using different triangulations.
      if(balance)boundary.push({a:balance>0?edge.a:edge.b,b:balance>0?edge.b:edge.a,used:false});else plane.internalEdges++;
      if(total>2)plane.nonManifoldEdges++;
      if(edge.positive>1||edge.negative>1)plane.orientationConflicts++;
    }
    plane.boundaryEdges=boundary.length;
    const outgoing=new Map(),incoming=new Map();
    boundary.forEach((edge,i)=>{if(!outgoing.has(edge.a))outgoing.set(edge.a,[]);outgoing.get(edge.a).push(i);incoming.set(edge.b,(incoming.get(edge.b)||0)+1);});
    const starters=[];for(const [vertex,list]of outgoing)if(list.length!==(incoming.get(vertex)||0)||list.length!==1)starters.push(...list);
    for(let i=0;i<boundary.length;i++)starters.push(i);
    const paths=[],minLength=Math.max(0,number(options.minLength,0)),simplifyTolerance=Math.max(0,number(options.simplifyTolerance,0));
    for(const first of starters){
      if(boundary[first].used)continue;
      const start=boundary[first].a,indices=[start];let edgeId=first,closed=false;
      for(let steps=0;steps<=boundary.length;steps++){
        const edge=boundary[edgeId];if(!edge||edge.used)break;edge.used=true;const at=edge.b;
        if(at===start){closed=true;break;}indices.push(at);
        const candidates=(outgoing.get(at)||[]).filter(i=>!boundary[i].used);if(!candidates.length)break;
        edgeId=nextEdge(candidates,boundary,points,unit(sub(points[edge.b],points[edge.a])),normal);
      }
      const raw=exactCollinear(indices.map(i=>points[i]),closed,stats),path=simplify(raw,simplifyTolerance,closed),length=pathLength(path,closed),area=closed?signedArea(path,normal):0;
      if(path.length<(closed?3:2)||length<minLength||(closed&&Math.abs(area)<=1e-24)){stats.discardedPaths++;continue;}
      paths.push({points:path,closed,normal:copy(normal),length,area,absArea:Math.abs(area),isHole:closed&&area<0,
        planeOffset:plane.offset,bounds:bounds(path),sourceMeshes:[...plane.sources],meshIndices:[...plane.meshIndices],
        componentIndex:plane.componentIndex,planeIndex:plane.index,maxPlaneDeviation:plane.maxDeviation});
    }
    return paths;
  }
  function collectPlanes(triangles,selectionNormal,topology,settings,stats,planes) {
    const cosine=settings.cosine,planeTolerance=settings.planeTolerance;
    const selected=triangles.filter(t=>!selectionNormal||Math.abs(dot(t.normal,selectionNormal))>=cosine),membership=new Set(selected.map(t=>t.index)),assigned=new Set();
    selected.sort((a,b)=>b.area-a.area||a.index-b.index);
    const maxPlaneChecks=clamp(Math.floor(number(settings.maxPlaneChecks,12000000)),1,50000000);stats.maxPlaneChecks=maxPlaneChecks;
    function tick(){if(++stats.planeChecks>maxPlaneChecks)throw budgetError('Planar-region work limit exceeded; no partial outline was produced. Select a smaller section.');}
    for(const seed of selected){
      if(assigned.has(seed.index))continue;
      if(planes.length>=settings.maxPlanes)throw budgetError('Planar-face limit exceeded ('+settings.maxPlanes+'); no partial outline was produced. Select a smaller section or use components mode.');
      let normal=copy(seed.normal);if(selectionNormal&&dot(normal,selectionNormal)<0)normal=mul(normal,-1);
      const origin=seed.points[0],queue=[seed],region=[];assigned.add(seed.index);
      for(let q=0;q<queue.length;q++){
        const triangle=queue[q];region.push(triangle);
        for(const edge of triangle.edges)for(const atom of edge.parts)for(const id of atom.triangles){
          tick();if(assigned.has(id)||!membership.has(id))continue;
          const other=topology.triangles[id];if(Math.abs(dot(other.normal,normal))<cosine)continue;
          if(other.points.some(p=>Math.abs(dot(sub(p,origin),normal))>planeTolerance))continue;
          assigned.add(id);queue.push(other);
        }
      }
      let area=0,normalSum=[0,0,0],centerSum=[0,0,0],positive=0,negative=0;
      const sources=new Set(),meshIndices=new Set();
      for(const triangle of region){
        area+=triangle.area;const alignment=dot(triangle.normal,normal),oriented=alignment<0?mul(triangle.normal,-1):triangle.normal;
        normalSum=add(normalSum,mul(oriented,triangle.area));
        const center=mul(add(add(triangle.points[0],triangle.points[1]),triangle.points[2]),1/3);centerSum=add(centerSum,mul(center,triangle.area));
        if(alignment>=0)positive+=triangle.area;else negative+=triangle.area;
        sources.add(triangle.source);meshIndices.add(triangle.meshIndex);
      }
      const fitted=unit(normalSum)||normal,center=mul(centerSum,1/area);
      let maxDeviation=0;for(const t of region)for(const p of t.points)maxDeviation=Math.max(maxDeviation,Math.abs(dot(sub(p,center),fitted)));
      let planeOrigin=center;
      if(maxDeviation<=planeTolerance)normal=fitted;else{planeOrigin=origin;maxDeviation=0;for(const t of region)for(const p of t.points)maxDeviation=Math.max(maxDeviation,Math.abs(dot(sub(p,origin),normal)));}
      if(!selectionNormal&&negative>positive){normal=mul(normal,-1);[positive,negative]=[negative,positive];}
      const plane={index:planes.length,componentIndex:seed.componentIndex,normal,selectionNormal:selectionNormal||normal,origin:copy(planeOrigin),offset:dot(planeOrigin,normal),area,positive,negative,maxDeviation,triangles:region,sources,meshIndices,paths:[],skip:false,reason:null};
      planes.push(plane);stats.maxPlaneDeviation=Math.max(stats.maxPlaneDeviation,maxDeviation);
    }
  }
  function triangleDistanceSquared(p,a,b,c) {
    const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);
    if(d1<=0&&d2<=0)return dot(ap,ap);
    const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return dot(bp,bp);
    const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0){const q=sub(ap,mul(ab,d1/(d1-d3)));return dot(q,q);}
    const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return dot(cp,cp);
    const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0){const q=sub(ap,mul(ac,d2/(d2-d6)));return dot(q,q);}
    const va=d3*d6-d5*d4;if(va<=0&&d4-d3>=0&&d5-d6>=0){const q=sub(bp,mul(sub(c,b),(d4-d3)/((d4-d3)+(d5-d6))));return dot(q,q);}
    const denominator=1/(va+vb+vc),q=sub(ap,add(mul(ab,vb*denominator),mul(ac,vc*denominator)));return dot(q,q);
  }
  function projectedSignature(paths,normal,tolerance) {
    if(!paths.length||paths.some(p=>!p.closed))return null;
    const reference=Math.abs(normal[1])<.9?[0,1,0]:[1,0,0],u=unit(cross(reference,normal)),v=cross(normal,u),grid=Math.max(tolerance,EPS),rings=[];
    for(const path of paths){
      const p=exactCollinear(path.points,true),keys=p.map(q=>Math.round(dot(q,u)/grid)+','+Math.round(dot(q,v)/grid));
      let start=0;for(let i=1;i<keys.length;i++)if(keys[i]<keys[start])start=i;
      const forward=[],backward=[];for(let i=0;i<keys.length;i++){forward.push(keys[(start+i)%keys.length]);backward.push(keys[(start-i+keys.length)%keys.length]);}
      const a=forward.join(';'),b=backward.join(';');rings.push(a<b?a:b);
    }
    return rings.sort().join('|');
  }
  function extract(meshOrMeshes, options = {}) {
    const settings={...options,mode:options.mode||'auto',strategy:options.strategy||'dominant'};
    const maxTriangles=clamp(Math.floor(number(settings.maxTriangles,120000)),1,300000),maxPaths=clamp(Math.floor(number(settings.maxPaths,128)),1,512);
    settings.maxPlanes=clamp(Math.floor(number(settings.maxPlanes,4096)),1,16384);
    const meshes=Array.isArray(meshOrMeshes)?meshOrMeshes:[meshOrMeshes],warnings=[];
    const stats={strategy:settings.strategy,meshes:meshes.length,inputTriangles:0,processedTriangles:0,validTriangles:0,uniqueTriangles:0,selectedTriangles:0,skippedTriangles:0,
      invalidTriangles:0,degenerateTriangles:0,duplicateTriangles:0,weldedVertices:0,maxWeldDistance:0,boundaryEdges:0,internalEdges:0,
      nonManifoldEdges:0,orientationConflicts:0,components:0,selectedComponents:0,normalGroups:0,planes:0,candidatePlanes:0,duplicatePlanes:0,paths:0,candidatePaths:0,discardedPaths:0,
      splitEdges:0,splitSegments:0,tJunctions:0,maxTJunctionDeviation:0,atomicEdges:0,topologyChecks:0,planeChecks:0,collinearVerticesRemoved:0,
      maxPlaneDeviation:0,planeDetails:[],pickedDistance:null,pickedPlanes:0,truncated:false,error:null,maxTriangles,maxPlanes:settings.maxPlanes,tolerance:0,planeTolerance:0,normal:null,preferredNormal:null,preferredPoint:null,preferredPointDistance:null,preferredPointTolerance:null,preferredComponents:[]};
    const result=paths=>({paths,stats,warnings});
    if(!DIRECTIONS[settings.mode]&&settings.mode!=='auto'){warnings.push('Unknown face mode; use front, back, top, bottom, left, right or auto.');return result([]);}
    if(!['dominant','components','allPlanes'].includes(settings.strategy)){warnings.push('Unknown strategy; use dominant, components or allPlanes.');return result([]);}
    if(settings.normal!=null&&(!finitePoint(settings.normal)||!unit(settings.normal))){warnings.push('The selected face normal is invalid.');return result([]);}
    if(settings.preferredNormal!=null){if(!finitePoint(settings.preferredNormal)||!unit(settings.preferredNormal)){warnings.push('The preferred object direction is invalid.');return result([]);}stats.preferredNormal=unit(settings.preferredNormal);}
    if(settings.preferredPoint!=null){if(!finitePoint(settings.preferredPoint)){warnings.push('The preferred object point is invalid.');return result([]);}stats.preferredPoint=copy(settings.preferredPoint);}
    if(settings.planePoint!=null&&!finitePoint(settings.planePoint)){warnings.push('The selected face point is invalid.');return result([]);}
    if(meshes.length>2048){warnings.push('Too many meshes; select a smaller stage section.');stats.truncated=true;return result([]);}
    const sources=[];
    for(let i=0;i<meshes.length;i++){
      const raw=meshes[i]?.p||meshes[i]?.positions||meshes[i]?.vertices;
      if(!raw||typeof raw.length!=='number'){warnings.push('Mesh '+i+' has no unindexed position buffer.');continue;}
      const coordinateCount=Array.isArray(raw[0])?raw.length*3:raw.length;stats.inputTriangles+=Math.floor(coordinateCount/9);
      if(coordinateCount%9)warnings.push('Incomplete trailing triangle data was ignored in mesh '+i+'.');
      sources.push({mesh:meshes[i],index:i,name:String(meshes[i]?.name||meshes[i]?.id||'Mesh '+(i+1))});
    }
    if(stats.inputTriangles>maxTriangles){stats.truncated=true;stats.error='Triangle limit exceeded ('+stats.inputTriangles+' > '+maxTriangles+'). Select a smaller mesh or increase maxTriangles; no partial outline was produced.';warnings.push(stats.error);return result([]);}
    const triangles=[];let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],magnitude=0;
    for(const source of sources){
      const p=meshBuffer(source.mesh);
      for(let i=0;i+8<p.length;i+=9){
        stats.processedTriangles++;
        const a=[p[i],p[i+1],p[i+2]],b=[p[i+3],p[i+4],p[i+5]],c=[p[i+6],p[i+7],p[i+8]];
        if(![a,b,c].every(q=>finitePoint(q)&&q.every(v=>Math.abs(v)<=1e9))){stats.invalidTriangles++;continue;}
        const n=cross(sub(b,a),sub(c,a)),doubleArea=norm(n);if(doubleArea<=1e-20){stats.degenerateTriangles++;continue;}
        for(const point of [a,b,c])for(let k=0;k<3;k++){min[k]=Math.min(min[k],point[k]);max[k]=Math.max(max[k],point[k]);magnitude=Math.max(magnitude,Math.abs(point[k]));}
        triangles.push({points:[a,b,c],normal:mul(n,1/doubleArea),area:doubleArea*.5,source:source.name,meshIndex:source.index});
      }
    }
    if(!triangles.length){warnings.push('No valid non-degenerate triangles were found.');return result([]);}
    const diagonal=norm(sub(max,min)),numericFloor=Math.max(1e-9,magnitude*Number.EPSILON*32),requested=number(settings.tolerance,diagonal*1e-6);
    const tolerance=Math.max(numericFloor,requested>0?requested:diagonal*1e-6);stats.tolerance=tolerance;
    settings.planeTolerance=Math.max(numericFloor,number(settings.planeTolerance,tolerance*3));stats.planeTolerance=settings.planeTolerance;
    const angle=clamp(number(settings.angleToleranceDegrees,3),.01,25);settings.cosine=Math.cos(angle*Math.PI/180);stats.angleToleranceDegrees=angle;
    stats.validTriangles=triangles.length;
    const planes=[];let topology;
    try{
      topology=buildTopology(triangles,tolerance,stats,settings);
      if(!topology.triangles.length){warnings.push('No usable triangles remain at this weld tolerance.');return result([]);}
      const usePreference=settings.strategy!=='allPlanes'&&settings.mode==='auto'&&settings.normal==null&&settings.preferredNormal!=null;
      let preferredComponents=null;
      const automaticSettings={...settings,preferredNormal:undefined};
      if(usePreference&&settings.preferredPoint){
        // Use the real hit point only to locate the component whose orientation
        // was picked. Unlike planePoint, this never clips other components or
        // limits their faces to the hit depth. A stale/off-object hint is ignored.
        const distances=topology.components.map(component=>{
          let squared=Infinity;for(const t of component.triangles)squared=Math.min(squared,triangleDistanceSquared(settings.preferredPoint,...t.points));
          return Math.sqrt(Math.max(0,squared));
        });
        const best=distances.reduce((minimum,distance)=>Math.min(minimum,distance),Infinity),threshold=Math.max(numericFloor,number(settings.preferredPointTolerance,Math.max(settings.planeTolerance*2,tolerance*4))),tie=Math.max(numericFloor,tolerance*.01);
        stats.preferredPointDistance=best;stats.preferredPointTolerance=threshold;preferredComponents=new Set();
        if(best<=threshold)distances.forEach((distance,index)=>{if(distance<=best+tie)preferredComponents.add(index);});
        else warnings.push('The preferred point does not match this object within tolerance; automatic face orientation was kept.');
        stats.preferredComponents=[...preferredComponents];
      }else if(usePreference)stats.preferredComponents=topology.components.map(component=>component.index);
      if(settings.strategy==='dominant'){
        const groups=normalGroups(topology.triangles,settings.cosine,angle);stats.normalGroups=groups.length;
        const normal=chooseNormal(groups,preferredComponents?automaticSettings:settings);
        if(normal){stats.normal=copy(normal);const remaining=preferredComponents?topology.triangles.filter(t=>!preferredComponents.has(t.componentIndex)):topology.triangles;collectPlanes(remaining,normal,topology,settings,stats,planes);}
        if(preferredComponents?.size)for(const component of topology.components)if(preferredComponents.has(component.index)){
          const local=chooseNormal(normalGroups(component.triangles,settings.cosine,angle),settings);if(local)collectPlanes(component.triangles,local,topology,settings,stats,planes);
        }
      }else{
        for(const component of topology.components){
          const groups=normalGroups(component.triangles,settings.cosine,angle);stats.normalGroups+=groups.length;
          const localSettings=preferredComponents&&!preferredComponents.has(component.index)?automaticSettings:settings;
          const normal=settings.strategy==='allPlanes'&&settings.normal==null?null:chooseNormal(groups,localSettings);
          if(settings.strategy==='allPlanes'&&settings.normal==null||normal)collectPlanes(component.triangles,normal,topology,settings,stats,planes);
        }
        if(settings.normal!=null)stats.normal=unit(settings.normal);
      }
    }catch(error){if(!error.geometryLimit)throw error;stats.truncated=true;stats.error=error.message;stats.candidatePlanes=planes.length;warnings.push(error.message);return result([]);}
    stats.candidatePlanes=planes.length;
    if(!planes.length){warnings.push('No planar face matches the requested direction. Select another face, use allPlanes, or adjust the plane tolerance.');return result([]);}
    // Resolve a picked surface against actual triangles before either winding
    // preference or extrusion-cap deduplication. Rear caps remain selectable.
    if(settings.planePoint){
      const point=settings.planePoint;let best=Infinity;
      for(const plane of planes){let squared=Infinity;for(const t of plane.triangles)squared=Math.min(squared,triangleDistanceSquared(point,...t.points));plane.pickedDistance=Math.sqrt(Math.max(0,squared));best=Math.min(best,plane.pickedDistance);}
      stats.pickedDistance=best;
      const threshold=Math.max(numericFloor,number(settings.planePointTolerance,Math.max(settings.planeTolerance*2,tolerance*4))),tie=Math.max(numericFloor,tolerance*.01);
      for(const plane of planes)if(best>threshold||plane.pickedDistance>best+tie){plane.skip=true;plane.reason='different-picked-face';}else{plane.force=true;stats.pickedPlanes++;}
      if(!stats.pickedPlanes)warnings.push('The picked point is not on a compatible planar face within planePointTolerance.');
    }
    for(const plane of planes)if(!plane.skip)plane.paths=planeBoundaries(plane,topology.points,stats,settings);
    if(settings.strategy!=='allPlanes'&&!settings.planePoint){
      const signatures=new Map();
      for(const plane of planes){
        if(plane.skip)continue;const signature=projectedSignature(plane.paths,plane.selectionNormal,tolerance);if(!signature)continue;
        // Separate objects can have identical projected outlines. Only caps
        // connected through real geometry are eligible for deduplication.
        const key=plane.componentIndex+'|'+signature,existing=signatures.get(key);
        if(existing){const distanceA=dot(plane.origin,plane.selectionNormal),distanceB=dot(existing.origin,plane.selectionNormal),outer=distanceA>distanceB?plane:existing,inner=outer===plane?existing:plane;inner.skip=true;inner.reason='duplicate-extrusion-cap';outer.force=true;signatures.set(key,outer);stats.duplicatePlanes++;}
        else signatures.set(key,plane);
      }
      const forward=new Map();for(const plane of planes)if(!plane.skip&&plane.positive>=plane.negative*.5&&plane.positive>0)forward.set(plane.componentIndex,true);
      let reversed=false;for(const plane of planes)if(!plane.skip&&!plane.force){if(forward.get(plane.componentIndex)&&plane.positive<plane.negative*.5){plane.skip=true;plane.reason='opposite-winding';}else if(!forward.get(plane.componentIndex))reversed=true;}
      if(reversed)warnings.push('Some requested faces use reversed winding; their contours were oriented to the selected direction.');
    }
    const chosen=planes.filter(p=>!p.skip);stats.planes=chosen.length;stats.selectedComponents=new Set(chosen.map(p=>p.componentIndex)).size;
    stats.selectedTriangles=chosen.reduce((sum,p)=>sum+p.triangles.length,0);stats.skippedTriangles=topology.triangles.length-stats.selectedTriangles;
    for(const plane of chosen){stats.boundaryEdges+=plane.boundaryEdges||0;stats.internalEdges+=plane.internalEdges||0;stats.nonManifoldEdges+=plane.nonManifoldEdges||0;stats.orientationConflicts+=plane.orientationConflicts||0;}
    stats.planeDetails=planes.map(p=>({index:p.index,componentIndex:p.componentIndex,normal:copy(p.normal),offset:p.offset,area:p.area,triangles:p.triangles.length,paths:p.paths.length,boundaryEdges:p.boundaryEdges||0,maxDeviation:p.maxDeviation,selected:!p.skip,reason:p.reason,pickedDistance:p.pickedDistance??null}));
    let paths=chosen.flatMap(p=>p.paths);paths.sort((a,b)=>b.absArea-a.absArea||b.length-a.length||b.planeOffset-a.planeOffset);stats.candidatePaths=paths.length;
    if(paths.length>maxPaths){stats.discardedPaths+=paths.length-maxPaths;stats.truncated=true;warnings.push('Path limit reached; '+(paths.length-maxPaths)+' smaller contours were omitted. Increase maxPaths or select a smaller section.');paths=paths.slice(0,maxPaths);}
    stats.paths=paths.length;stats.points=paths.reduce((sum,p)=>sum+p.points.length,0);
    if(stats.invalidTriangles)warnings.push(stats.invalidTriangles+' malformed triangles were skipped.');
    if(stats.nonManifoldEdges)warnings.push(stats.nonManifoldEdges+' non-manifold shared edges were detected; inspect these contours before use.');
    if(stats.orientationConflicts)warnings.push('Overlapping coplanar faces were detected. Repeated boundaries were merged; partially overlapping faces can need manual inspection.');
    if(paths.some(p=>!p.closed))warnings.push('Some boundaries are open; endpoints are preserved rather than joined across a gap.');
    if(!paths.length)warnings.push('No usable boundary was found for the selected face and length settings.');
    return result(paths);
  }
  return {version:'14.6.0',extract,simplify,samplePath,offsetPath,pathLength};
});
