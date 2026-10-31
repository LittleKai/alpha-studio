/* V15.1 LED Matrix: bright world-space LED chips/ribbons with scene depth.
   All luminous geometry is inside the WebGL framebuffer (PNG/WebM included).
   Only selection handles and detection previews use the editor overlay. */
(function(root,factory){
  const common=typeof module==='object'&&module.exports;
  const geometry=common?require('./matrix143-geometry.js'):root.Matrix143Geometry;
  const helpers=factory(geometry);
  if(common)module.exports=helpers;else root.Matrix143RenderGeometry=helpers;
})(typeof window!=='undefined'?window:globalThis,function(G){
  'use strict';
  const EPS=1e-10;
  const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s);
  const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>{const length=Math.hypot(...a);return length>EPS?mul(a,1/length):null;};
  const distance=(a,b)=>Math.hypot(...sub(a,b));
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  // Geometry remains in metres. The optical skirt is compact and never changes
  // the saved emitter width, path, lift or physical pixel centres.
  const emission=Object.freeze({core:1.8,halo:.85,hotCore:.025,spread:3,bodyPitch:.42,glowPitch:.48});
  function emitterProfile(width,pitch,{diffuser=true,glow=true}={}){
    if(!Number.isFinite(width)||width<=0||!Number.isFinite(pitch)||pitch<=0)throw Error('LED width and pitch must be positive finite metres.');
    const bodyHalfWidth=width*.5,bodyHalfLength=Math.min(pitch*emission.bodyPitch,width*2);
    const halfWidth=bodyHalfWidth*(glow?emission.spread:1);
    const halfLength=glow?Math.min(pitch*emission.glowPitch,bodyHalfLength+bodyHalfWidth):bodyHalfLength;
    return {bodyHalfWidth,bodyHalfLength,halfWidth,halfLength,coreWidth:bodyHalfWidth/halfWidth,coreLength:diffuser?0:bodyHalfLength/halfLength};
  }
  function edgeCoverage(edge,halfSize,footprint=0){
    const span=Math.max(Math.abs(footprint),.00001);
    return clamp((Math.min(edge+span*.5,halfSize)-Math.max(edge-span*.5,-halfSize))/span,0,1);
  }
  // CPU reference for the shader's optical profile, used by focused render
  // regressions. Returns unclipped emitted RGB: the display framebuffer clips
  // high light values, while the dimmer itself stays a linear multiplier.
  function shadeSample({color=[1,1,1],level=1,x=0,y=0,dx=0,dy=0,profile}={}){
    const p=profile||emitterProfile(.02,.06),chip=p.coreLength>0;
    const body=edgeCoverage(x,p.coreWidth,dx)*(chip?edgeCoverage(y,p.coreLength,dy):1);
    const d=Math.hypot(Math.max(Math.abs(x)-p.coreWidth,0)/Math.max(1-p.coreWidth,.00001),chip?Math.max(Math.abs(y)-p.coreLength,0)/Math.max(1-p.coreLength,.00001):0);
    const halo=p.coreWidth<.999?Math.max(0,1-d)**2*(1-body):0;
    const gain=(emission.core*body+emission.halo*halo)*clamp(level,0,1),peak=Math.max(...color),hot=emission.hotCore*body;
    return color.map(c=>(c*(1-hot)+peak*hot)*gain);
  }
  const shaders={vertex:`#version 300 es
      precision highp float;
      layout(location=0) in vec3 aPosition;
      layout(location=1) in vec4 aColor;
      layout(location=2) in vec4 aEdge;
      uniform mat4 uVP;
      out vec4 vColor;out vec4 vEdge;
      void main(){gl_Position=uVP*vec4(aPosition,1.0);vColor=aColor;vEdge=aEdge;}`,
    fragment:`#version 300 es
      precision highp float;
      in vec4 vColor;in vec4 vEdge;out vec4 frag;
      float coverage(float edge,float halfSize,float footprint){
        float span=max(abs(footprint),0.00001);
        return clamp((min(edge+span*0.5,halfSize)-max(edge-span*0.5,-halfSize))/span,0.0,1.0);
      }
      void main(){
        vec2 footprint=fwidth(vEdge.xy);
        if(vColor.a<=0.0)discard;
        bool chip=vEdge.w>0.0;
        // Differentiate the signed coordinate; abs(edge) loses the gradient
        // across the centre of narrow emitters and makes their coverage unstable.
        float body=coverage(vEdge.x,vEdge.z,footprint.x);
        if(chip)body*=coverage(vEdge.y,vEdge.w,footprint.y);
        vec2 outside=max(abs(vEdge.xy)-vEdge.zw,vec2(0.0))/max(vec2(1.0)-vEdge.zw,vec2(0.00001));
        if(!chip)outside.y=0.0;
        float skirt=max(0.0,1.0-length(outside));
        float halo=vEdge.z<0.999?skirt*skirt*(1.0-body):0.0;
        float light=(${emission.core.toFixed(3)}*body+${emission.halo.toFixed(3)}*halo)*clamp(vColor.a,0.0,1.0);
        float peak=max(vColor.r,max(vColor.g,vColor.b));
        vec3 color=mix(vColor.rgb,vec3(peak),body*${emission.hotCore.toFixed(3)});
        frag=vec4(color*light,0.0);
      }`};
  function clean(points,closed){
    const p=[];for(const point of points||[]){if(!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite))continue;
      if(!p.length||distance(p.at(-1),point)>EPS)p.push(point.slice());}
    if(closed&&p.length>1&&distance(p[0],p.at(-1))<=EPS)p.pop();return p;
  }
  function allocate(requests,maxPixels=24576,maxPerRow=2048){
    const cap=Math.max(0,Math.floor(maxPixels)),perRow=Math.max(3,Math.floor(maxPerRow));
    const items=requests.map((q,index)=>{const rows=clamp(Math.round(q.rows??q.path?.rows??1),1,8),minimum=(q.closed??q.path?.closed)?3:2;
      const desired=Math.max(minimum,Math.min(perRow,Math.ceil(q.desired??q.requested??minimum)));
      return {index,rows,minimum,desired,count:minimum,remainder:0};});
    const minimumPixels=items.reduce((n,q)=>n+q.minimum*q.rows,0),desiredPixels=items.reduce((n,q)=>n+q.desired*q.rows,0);
    if(minimumPixels>cap)return {counts:items.map(()=>0),pixels:0,minimumPixels,desiredPixels,error:'Giới hạn pixel không đủ cho số dải tối thiểu.'};
    const extra=desiredPixels-minimumPixels,ratio=extra?Math.min(1,(cap-minimumPixels)/extra):1;
    for(const q of items){const scaled=(q.desired-q.minimum)*ratio;q.count+=Math.floor(scaled);q.remainder=scaled-Math.floor(scaled);}
    let pixels=items.reduce((n,q)=>n+q.count*q.rows,0),remaining=cap-pixels;
    const order=items.slice().sort((a,b)=>b.remainder-a.remainder||a.index-b.index);
    // Each increment costs one pixel in every parallel row. Reserve those rows
    // before allocating extras, so minimum-count clamps never overshoot the cap.
    let progress=true;while(remaining>0&&progress){progress=false;
      for(const q of order)if(q.count<q.desired&&q.rows<=remaining){q.count++;remaining-=q.rows;pixels+=q.rows;progress=true;}}
    return {counts:items.map(q=>q.count),pixels,minimumPixels,desiredPixels,error:null};
  }
  function row(points,closed,count,normal,lift=0){
    const p=clean(points,closed),n=unit(normal||[0,0,1]);
    const empty=message=>({valid:false,error:message,positions:[],tangents:[],shapePositions:[],shapeCells:[],controlPoints:p.length,count:0,length:0,pitch:0});
    if(!n||p.length<(closed?3:2)||!Number.isInteger(count)||count<(closed?3:2))return empty('Dải offset không còn đủ điểm để tạo viền.');
    const distances=[0],sizes=[],directions=[];let length=0,area=0;
    for(let i=0;i<p.length-(closed?0:1);i++){
      const direction=sub(p[(i+1)%p.length],p[i]),size=Math.hypot(...direction);if(size<=EPS)return empty('Dải offset chứa đoạn có độ dài bằng 0.');
      const tangent=mul(direction,1/size);if(!unit(cross(tangent,n)))return empty('Có đoạn viền song song với pháp tuyến. Chọn lại mặt hoặc sửa điểm.');
      sizes.push(size);directions.push(tangent);length+=size;distances.push(length);
      if(closed)area+=dot(n,cross(sub(p[i],p[0]),sub(p[(i+1)%p.length],p[0])))*.5;
    }
    if(length<=EPS||(closed&&Math.abs(area)<=Math.max(EPS*EPS,length*length*1e-12)))return empty('Dải offset bị co thành đường hoặc điểm. Giảm khoảng cách dải / dịch viền.');
    const pitch=length/(closed?count:count-1),sample=G.samplePath(p,closed,pitch,count);
    if(sample.count!==count)return empty('Không lấy đủ pixel trên dải offset.');
    const rawKnots=[];
    for(let i=0;i<p.length;i++)rawKnots.push({at:distances[i],control:true});
    for(let i=0;i<count;i++)rawKnots.push({at:i*pitch,control:false});
    rawKnots.sort((a,b)=>a.at-b.at||(Number(b.control)-Number(a.control)));
    const knots=[],epsilon=Math.max(EPS,length*1e-11);
    for(const knot of rawKnots){const last=knots.at(-1);
      if(last&&Math.abs(last.at-knot.at)<=epsilon){if(knot.control&&!last.control)knots[knots.length-1]=knot;continue;}
      if(closed&&knot.at>=length-epsilon)continue;knots.push(knot);}
    let segment=0;const shapePositions=[],shapeCells=[];
    for(const knot of knots){
      while(segment<sizes.length-1&&distances[segment+1]<knot.at-epsilon)segment++;
      const u=clamp((knot.at-distances[segment])/sizes[segment],0,1);
      const point=add(p[segment],mul(sub(p[(segment+1)%p.length],p[segment]),u));
      shapePositions.push(add(point,mul(n,lift)));
      const pixel=Math.round(knot.at/pitch);shapeCells.push(closed?pixel%count:clamp(pixel,0,count-1));
    }
    let tangentSegment=0;
    const tangents=sample.tangents.map((tangent,i)=>{
      while(tangentSegment<sizes.length-1&&distances[tangentSegment+1]<i*pitch-EPS)tangentSegment++;
      return unit(cross(tangent,n))?tangent:directions[tangentSegment].slice();
    });
    return {valid:true,error:null,positions:sample.positions.map(point=>add(point,mul(n,lift))),tangents,
      shapePositions,shapeCells,controlPoints:p.length,length,count,pitch};
  }
  function lateral(points,index,closed,normal,halfWidth){
    const current=points[index],previous=index?points[index-1]:closed?points.at(-1):null,next=index<points.length-1?points[index+1]:closed?points[0]:null;
    const a=previous?unit(sub(current,previous)):null,b=next?unit(sub(next,current)):null;
    let before=a?unit(cross(a,normal)):null,after=b?unit(cross(b,normal)):null;
    if(!before)before=after;if(!after)after=before;if(!before||!after)return [0,0,0];
    const miter=unit(add(before,after));if(!miter)return mul(after,halfWidth);
    const divisor=dot(miter,after),distance=Math.abs(divisor)>EPS?halfWidth/divisor:halfWidth;
    return mul(miter,clamp(distance,-Math.abs(halfWidth)*3,Math.abs(halfWidth)*3));
  }
  return {allocate,row,lateral,clean,emission,emitterProfile,edgeCoverage,shadeSample,shaders};
});
(function(){
  'use strict';
  if(typeof window==='undefined')return;
  const S=window.STUDIO,X=S?.matrix143;if(!X)return;
  const E=S.engine,G=X.geometry,V=X.vec,RG=window.Matrix143RenderGeometry,canvas=X.canvas,ctx=canvas.getContext('2d');
  const MAX_PIXELS=24576,MAX_PER_ROW=2048,MAX_STATIC_VERTICES=1000000;
  let cacheRevision=-1,pathsCache=new Map(),gpu=null,geometry=null,lastGuide=0;
  const info={paths:0,pixels:0,renderedPixels:0,requestedPixels:0,limitedPaths:0,vertices:0,shapeVertices:0,controlPoints:0,
    invalidRows:0,geometryError:null,drawCalls:0,lastTime:0,frames:0,error:null};
  function ensureGeometry(){
    if(cacheRevision===X.geometryRevision)return;cacheRevision=X.geometryRevision;pathsCache=new Map();
    Object.assign(info,{paths:X.paths.length,pixels:0,renderedPixels:0,requestedPixels:0,limitedPaths:0,vertices:0,shapeVertices:0,controlPoints:0,invalidRows:0,geometryError:null,error:null});
    const requests=X.paths.map(path=>{
      const rowPoints=[];for(let r=0;r<path.rows;r++){const offset=path.offset+(r-(path.rows-1)/2)*path.spacing;rowPoints.push(G.offsetPath(path.points,path.closed,path.normal,offset));}
      const length=G.pathLength(path.points,path.closed),maxLength=Math.max(0,...rowPoints.map(points=>G.pathLength(points,path.closed)));
      const requested=Math.max(path.closed?3:2,Math.ceil(maxLength/path.pitch)+(path.closed?0:1));
      return {path,length,rowPoints,requested,desired:Math.min(MAX_PER_ROW,requested),rows:path.rows,closed:path.closed};
    });
    const allocation=RG.allocate(requests,MAX_PIXELS,MAX_PER_ROW);let globalCell=0,requiredVertices=0;
    for(let index=0;index<requests.length;index++){
      const q=requests[index],p=q.path,count=allocation.counts[index],rows=q.rowPoints.map(points=>RG.row(points,p.closed,count,p.normal,p.lift));
      const valid=rows.filter(row=>row.valid),pitches=valid.map(row=>row.pitch),invalid=rows.length-valid.length;
      const pitchMin=pitches.length?Math.min(...pitches):0,pitchMax=pitches.length?Math.max(...pitches):0;
      const error=invalid?invalid+' dải offset bị suy biến. Giảm khoảng cách dải / dịch viền hoặc sửa điểm.':null;
      const data={id:p.id,count,length:q.length,pitch:pitchMax,pitchMin,pitchMax,requested:q.requested,limited:count<q.requested,
        rows,cellOffset:globalCell,shapeVertices:valid.reduce((n,row)=>n+row.shapePositions.length,0),controlPoints:p.points.length,
        invalidRows:invalid,error};
      pathsCache.set(p.id,data);info.pixels+=count*p.rows;info.renderedPixels+=count*valid.length;info.requestedPixels+=q.requested*p.rows;
      info.shapeVertices+=data.shapeVertices;info.controlPoints+=p.points.length;info.invalidRows+=invalid;if(data.limited)info.limitedPaths++;
      for(const row of valid)requiredVertices+=(p.diffuser?row.shapePositions.length-(p.closed?0:1):count)*6;
      globalCell+=count*p.rows;
    }
    if(allocation.error||requiredVertices>MAX_STATIC_VERTICES){
      info.geometryError=allocation.error||'Viền vượt giới hạn '+MAX_STATIC_VERTICES.toLocaleString('vi-VN')+' đỉnh preview. Giảm số dải/viền hoặc đơn giản hóa đường; hình dạng chưa bị cắt bớt.';
      info.error=info.geometryError;info.renderedPixels=0;for(const data of pathsCache.values())data.error=info.geometryError;
      geometry={static:new Float32Array(),map:new Uint32Array(),colors:new Float32Array(),dirty:true};return;
    }
    const packed=[],indices=[];
    const append=(corners,aCell,bCell,profile)=>{for(const [index,cell]of[[0,aCell],[1,aCell],[2,bCell],[0,aCell],[2,bCell],[3,bCell]]){packed.push(...corners[index],[-1,1,1,-1][index],profile.coreLength?[-1,-1,1,1][index]:0,profile.coreWidth,profile.coreLength);indices.push(cell);}};
    for(const p of X.paths){const data=pathsCache.get(p.id),count=data.count;
      for(let r=0;r<data.rows.length;r++){
        const sample=data.rows[r];if(!sample.valid)continue;const cellStart=data.cellOffset+r*count,profile=RG.emitterProfile(p.width,sample.pitch,p),half=profile.halfWidth;
        if(p.diffuser){
          const pos=sample.shapePositions,n=pos.length,sides=pos.map((_,i)=>RG.lateral(pos,i,p.closed,p.normal,half));
          for(let i=0;i<n-(p.closed?0:1);i++){const j=(i+1)%n,a=pos[i],b=pos[j],sa=sides[i],sb=sides[j];
            append([V.sub(a,sa),V.add(a,sa),V.add(b,sb),V.sub(b,sb)],cellStart+sample.shapeCells[i],cellStart+sample.shapeCells[j],profile);}
        }else{
          for(let i=0;i<count;i++){const tangent=sample.tangents[i],side=V.mul(V.unit(V.cross(tangent,p.normal)),half),along=V.mul(tangent,profile.halfLength),a=V.sub(sample.positions[i],along),b=V.add(sample.positions[i],along),cell=cellStart+i;
            append([V.sub(a,side),V.add(a,side),V.add(b,side),V.sub(b,side)],cell,cell,profile);}
        }
      }
    }
    geometry={static:new Float32Array(packed),map:new Uint32Array(indices),colors:new Float32Array(indices.length*4),dirty:true};info.vertices=indices.length;
  }
  function pathData(path){ensureGeometry();return pathsCache.get(typeof path==='string'?path:path?.id)||null;}
  function createGPU(){
    const gl=E.gl,{vertex,fragment}=RG.shaders;
    const compile=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(e);}return s;};
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    const oldVAO=gl.getParameter(gl.VERTEX_ARRAY_BINDING),oldBuffer=gl.getParameter(gl.ARRAY_BUFFER_BINDING),vao=gl.createVertexArray(),position=gl.createBuffer(),color=gl.createBuffer();
    gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,position);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.FLOAT,false,28,12);
    gl.bindBuffer(gl.ARRAY_BUFFER,color);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,16,0);gl.bindVertexArray(oldVAO);gl.bindBuffer(gl.ARRAY_BUFFER,oldBuffer);
    return {gl,program,vao,position,color,vp:gl.getUniformLocation(program,'uVP')};
  }
  const colorCache=new Map();function rgb(hex){if(colorCache.has(hex))return colorCache.get(hex);const a=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);if(colorCache.size>8192)colorCache.clear();colorCache.set(hex,a);return a;}
  function drawGL(time){
    info.drawCalls=0;if(E.view!=='stage'||!E.vp||E.gl.isContextLost())return;
    ensureGeometry();if(!info.vertices)return;
    if(!gpu){gpu=createGPU();geometry.dirty=true;}
    const cells=[];for(const p of X.paths){const data=pathsCache.get(p.id);cells.push(...X.evaluate(p,time,data.count));}
    for(let i=0;i<geometry.map.length;i++){const c=cells[geometry.map[i]],color=rgb(c.color),offset=i*4;geometry.colors[offset]=color[0];geometry.colors[offset+1]=color[1];geometry.colors[offset+2]=color[2];geometry.colors[offset+3]=c.level;}
    const gl=E.gl,old={program:gl.getParameter(gl.CURRENT_PROGRAM),vao:gl.getParameter(gl.VERTEX_ARRAY_BINDING),buffer:gl.getParameter(gl.ARRAY_BUFFER_BINDING),depth:gl.isEnabled(gl.DEPTH_TEST),blend:gl.isEnabled(gl.BLEND),cull:gl.isEnabled(gl.CULL_FACE),mask:gl.getParameter(gl.DEPTH_WRITEMASK),func:gl.getParameter(gl.DEPTH_FUNC),src:gl.getParameter(gl.BLEND_SRC_RGB),dst:gl.getParameter(gl.BLEND_DST_RGB),srcA:gl.getParameter(gl.BLEND_SRC_ALPHA),dstA:gl.getParameter(gl.BLEND_DST_ALPHA),eq:gl.getParameter(gl.BLEND_EQUATION_RGB),eqA:gl.getParameter(gl.BLEND_EQUATION_ALPHA)};
    try{
      gl.useProgram(gpu.program);gl.bindVertexArray(gpu.vao);gl.bindBuffer(gl.ARRAY_BUFFER,gpu.position);if(geometry.dirty){gl.bufferData(gl.ARRAY_BUFFER,geometry.static,gl.STATIC_DRAW);geometry.dirty=false;}
      gl.bindBuffer(gl.ARRAY_BUFFER,gpu.color);gl.bufferData(gl.ARRAY_BUFFER,geometry.colors,gl.DYNAMIC_DRAW);gl.uniformMatrix4fv(gpu.vp,false,E.vp);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(false);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFuncSeparate(gl.ONE,gl.ONE,gl.ZERO,gl.ONE);gl.drawArrays(gl.TRIANGLES,0,info.vertices);
      info.drawCalls=1;info.lastTime=time;info.frames++;info.error=null;
    }finally{
      gl.useProgram(old.program);gl.bindVertexArray(old.vao);gl.bindBuffer(gl.ARRAY_BUFFER,old.buffer);gl.depthMask(old.mask);gl.depthFunc(old.func);gl.blendFuncSeparate(old.src,old.dst,old.srcA,old.dstA);gl.blendEquationSeparate(old.eq,old.eqA);
      for(const [cap,enabled]of[[gl.DEPTH_TEST,old.depth],[gl.BLEND,old.blend],[gl.CULL_FACE,old.cull]])enabled?gl.enable(cap):gl.disable(cap);
    }
  }
  function project(point){const p=E.project(point);return p&&Number.isFinite(p.x+p.y+p.z)&&p.z>-1&&p.z<1?p:null;}
  function stroke(points,closed,color,dashed=false,width=1.4){ctx.beginPath();let first=null,pen=false;for(const point of points){const p=project(point);if(!p){pen=false;continue;}if(!first)first=p;if(pen)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);pen=true;}if(closed&&first&&pen)ctx.lineTo(first.x,first.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dashed?[5,4]:[]);ctx.stroke();ctx.setLineDash([]);}
  function drawGuides(now=performance.now(),{clean=false}={}){
    const width=E.canvas.clientWidth,height=E.canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,1.5);if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    if(clean||!X.isOpen||S.state.presenting||E.view!=='stage')return;
    const guide=X.candidateGuideState();
    for(const {candidate:c,index}of guide.items){const focused=c.id===X.candidateFocus,picked=X.quick150&&c.id===X.quickFocus150;
      const color=focused?'#ffdb8b':c.checked?'#55f0c5':X.quick150?'rgba(121,191,199,.62)':'#6fafa7';
      stroke(c.points,c.closed,color,X.quick150?!c.checked&&!focused:!focused,focused?3:c.checked?2.6:picked?1.8:1);
      const p=project(c.points[0]);if(p&&(focused||picked||!X.quick150&&guide.shown<=16)){ctx.fillStyle=focused?'#49381e':'#052b29';ctx.fillRect(p.x-3,p.y-16,33,17);ctx.fillStyle=focused?'#ffe4a8':'#a2ffe9';ctx.font='bold 11px sans-serif';ctx.fillText(String(index+1),p.x+2,p.y-3);}
    }
    if(X.mode==='draw'||X.draft.length){stroke(X.draft,false,'#ffd87c');for(const [i,p]of X.draft.map(project).entries()){if(!p)continue;ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle=i?'#72ead8':'#ffe39a';ctx.fill();}return;}
    const path=X.paths.find(p=>p.id===X.selected);if(!path)return;stroke(path.points,path.closed,'#88cfedaa',true,1);
    const first=project(path.points[0]),second=project(path.points[1]);if(first){ctx.fillStyle='#ffe29a';ctx.beginPath();ctx.arc(first.x,first.y,5,0,Math.PI*2);ctx.fill();ctx.font='bold 10px sans-serif';ctx.fillText('ĐẦU',first.x+8,first.y-8);if(second){const dx=second.x-first.x,dy=second.y-first.y,len=Math.hypot(dx,dy);if(len>2){const x=first.x+dx/len*Math.min(len,22),y=first.y+dy/len*Math.min(len,22),a=Math.atan2(dy,dx);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7*Math.cos(a-.4),y-7*Math.sin(a-.4));ctx.moveTo(x,y);ctx.lineTo(x-7*Math.cos(a+.4),y-7*Math.sin(a+.4));ctx.strokeStyle='#ffe29a';ctx.lineWidth=2;ctx.stroke();}}}
    if(X.mode==='edit')for(let i=0;i<path.points.length;i++){const p=project(path.points[i]);if(!p)continue;ctx.beginPath();ctx.arc(p.x,p.y,i===X.pointIndex?6:3.5,0,Math.PI*2);ctx.fillStyle=i===X.pointIndex?'#ffd36d':'#64d5ff';ctx.fill();ctx.strokeStyle='#112935';ctx.lineWidth=1;ctx.stroke();}
  }
  const priorRender=E.render.bind(E);E.render=function(time,...args){const result=priorRender(time,...args);try{drawGL(Number.isFinite(time)?time:S.state.time);}catch(error){if(info.error!==error.message){console.error('LED Matrix renderer:',error);info.error=error.message;}}return result;};
  function guideLoop(now){if(now-lastGuide>32){lastGuide=now;drawGuides(now);}requestAnimationFrame(guideLoop);}requestAnimationFrame(guideLoop);
  E.canvas.addEventListener('webglcontextlost',()=>{gpu=null;});E.canvas.addEventListener('webglcontextrestored',()=>{gpu=null;if(geometry)geometry.dirty=true;});
  Object.assign(X,{pathData,stats(){ensureGeometry();return {...info,maxPixels:MAX_PIXELS,maxPixelsPerRow:MAX_PER_ROW,maxStaticVertices:MAX_STATIC_VERTICES};},renderFrame:drawGuides,drawGL});
})();
