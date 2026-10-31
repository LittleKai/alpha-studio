/* Small, dependency-free math layer. Matrices use column-major order. */
const M = {
  add:(a,b)=>a.map((v,i)=>v+b[i]), sub:(a,b)=>a.map((v,i)=>v-b[i]), mul:(a,s)=>a.map(v=>v*s),
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  norm(a){let n=Math.hypot(...a);return n>1e-12?a.map(v=>v/n):[0,1,0]},
  identity:()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  mm(a,b){let o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o},
  point(m,p){let w=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15];w=w||1;return [(m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12])/w,(m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13])/w,(m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14])/w]},
  vector:(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2],m[1]*p[0]+m[5]*p[1]+m[9]*p[2],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]],
  trs(t=[0,0,0],q=[0,0,0,1],s=[1,1,1]){let[x,y,z,w]=q;return[(1-2*y*y-2*z*z)*s[0],(2*x*y+2*z*w)*s[0],(2*x*z-2*y*w)*s[0],0,(2*x*y-2*z*w)*s[1],(1-2*x*x-2*z*z)*s[1],(2*y*z+2*x*w)*s[1],0,(2*x*z+2*y*w)*s[2],(2*y*z-2*x*w)*s[2],(1-2*x*x-2*y*y)*s[2],0,...t,1]},
  translate(t){return M.trs(t)},
  rotate(axis,angle){let n=M.norm(axis),s=Math.sin(angle/2);return M.trs([0,0,0],[n[0]*s,n[1]*s,n[2]*s,Math.cos(angle/2)])},
  perspective(fovy,aspect,near,far){let f=1/Math.tan(fovy/2);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]},
  ortho(l,r,b,t,n,f){return[2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]},
  lookAt(eye,target,up=[0,1,0]){let z=M.norm(M.sub(eye,target)),x=M.norm(M.cross(up,z)),y=M.cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-M.dot(x,eye),-M.dot(y,eye),-M.dot(z,eye),1]},
  inverse(a){let o=M.identity(),m=a.slice();for(let i=0;i<4;i++){let p=i;for(let r=i+1;r<4;r++)if(Math.abs(m[i*4+r])>Math.abs(m[i*4+p]))p=r;if(Math.abs(m[i*4+p])<1e-12)return M.identity();for(let c=0;c<4;c++){[m[c*4+i],m[c*4+p]]=[m[c*4+p],m[c*4+i]];[o[c*4+i],o[c*4+p]]=[o[c*4+p],o[c*4+i]]}let d=m[i*4+i];for(let c=0;c<4;c++){m[c*4+i]/=d;o[c*4+i]/=d}for(let r=0;r<4;r++)if(r!==i){let d=m[i*4+r];for(let c=0;c<4;c++){m[c*4+r]-=d*m[c*4+i];o[c*4+r]-=d*o[c*4+i]}}}return o},
  bbox(p){let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<p.length;i+=3)for(let k=0;k<3;k++){min[k]=Math.min(min[k],p[i+k]);max[k]=Math.max(max[k],p[i+k])}return{min,max,size:M.sub(max,min),center:M.mul(M.add(min,max),.5)}},
  rayBox(o,d,b){let lo=0,hi=Infinity;for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-10){if(o[i]<b.min[i]||o[i]>b.max[i])return false;continue}let a=(b.min[i]-o[i])/d[i],c=(b.max[i]-o[i])/d[i];if(a>c)[a,c]=[c,a];lo=Math.max(lo,a);hi=Math.min(hi,c);if(hi<lo)return false}return true},
  rayTri(o,d,a,b,c){let e1=M.sub(b,a),e2=M.sub(c,a),p=M.cross(d,e2),det=M.dot(e1,p);if(Math.abs(det)<1e-9)return null;let t=M.sub(o,a),u=M.dot(t,p)/det;if(u<0||u>1)return null;let q=M.cross(t,e1),v=M.dot(d,q)/det;if(v<0||u+v>1)return null;let dist=M.dot(e2,q)/det;return dist>1e-5?dist:null}
};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const uid=(p='id')=>p+'_'+Math.random().toString(36).slice(2,10);
const hexrgb=h=>{h=h.replace('#','');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255)};
function computeNormals(p){let n=new Float32Array(p.length);for(let i=0;i<p.length;i+=9){let q=M.norm(M.cross(M.sub(Array.from(p.slice(i+3,i+6)),Array.from(p.slice(i,i+3))),M.sub(Array.from(p.slice(i+6,i+9)),Array.from(p.slice(i,i+3)))));for(let k=0;k<3;k++)n.set(q,i+k*3)}return n}
function makeMesh(name,p,uv=null,n=null,material={}){p=new Float32Array(p);return{id:uid('mesh'),name,p,n:n?new Float32Array(n):computeNormals(p),uv:uv?new Float32Array(uv):new Float32Array(p.length/3*2),material:{color:[.2,.23,.29,1],...material},bounds:M.bbox(p)}}
function transformMesh(mesh,mat){mesh.p=new Float32Array(mesh.p);for(let i=0;i<mesh.p.length;i+=3)mesh.p.set(M.point(mat,Array.from(mesh.p.slice(i,i+3))),i);mesh.n=computeNormals(mesh.p);mesh.bounds=M.bbox(mesh.p);return mesh}
function quadMesh(name,corners,material={}){let idx=[0,1,2,0,2,3],uv=[[0,0],[1,0],[1,1],[0,1]];return makeMesh(name,idx.flatMap(i=>corners[i]),idx.flatMap(i=>uv[i]),null,material)}
function boxMesh(name,center,size,color=[.1,.13,.19,1]){let p=[],uv=[],v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(q=>q.map((a,i)=>center[i]+a*size[i]/2));for(let f of [[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[7,6,2,3],[0,1,5,4]]){for(let k of[0,1,2,0,2,3]){p.push(...v[f[k]]);uv.push(...[[0,1],[1,1],[1,0],[0,0]][k])}}return makeMesh(name,p,uv,null,{color})}
function planarUV(mesh){let p=mesh.p,normal=[0,0,0];for(let i=0;i<mesh.n.length;i+=3)normal=M.add(normal,Array.from(mesh.n.slice(i,i+3)));normal=M.norm(normal);let up=Math.abs(normal[1])>.95?[0,0,-1]:[0,1,0],right=M.norm(M.cross(up,normal));up=M.norm(M.cross(normal,right));let a=[],b=[];for(let i=0;i<p.length;i+=3){let v=Array.from(p.slice(i,i+3));a.push(M.dot(v,right));b.push(M.dot(v,up))}let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;for(let v of a){amin=Math.min(amin,v);amax=Math.max(amax,v)}for(let v of b){bmin=Math.min(bmin,v);bmax=Math.max(bmax,v)}let out=new Float32Array(a.length*2);for(let i=0;i<a.length;i++){out[i*2]=(a[i]-amin)/(amax-amin||1);out[i*2+1]=1-(b[i]-bmin)/(bmax-bmin||1)}return{uv:out,width:amax-amin,height:bmax-bmin,normal}}

/* Local-only importers. Supports glTF 2.0 (including EXT_meshopt_compression, sparse accessors,
   morph targets, skinning and keyframe animations), COLLADA and OBJ meshes. Draco/KTX2 are rejected. */
function quatSlerpGltf(a,b,t){
  let ax=a[0],ay=a[1],az=a[2],aw=a[3],bx=b[0],by=b[1],bz=b[2],bw=b[3],cos=ax*bx+ay*by+az*bz+aw*bw;
  if(cos<0){cos=-cos;bx=-bx;by=-by;bz=-bz;bw=-bw}
  let s0=1-t,s1=t;
  if(1-cos>1e-6){let om=Math.acos(Math.min(1,cos)),sin=Math.sin(om);s0=Math.sin((1-t)*om)/sin;s1=Math.sin(t*om)/sin}
  let x=s0*ax+s1*bx,y=s0*ay+s1*by,z=s0*az+s1*bz,w=s0*aw+s1*bw,len=Math.hypot(x,y,z,w)||1;
  return [x/len,y/len,z/len,w/len];
}
function sampleGltfChannel(s,t){
  const inp=s.input,out=s.output,n=inp.length,comp=s.dim,interp=s.interpolation||'LINEAR';
  if(!n)return null;
  if(t<=inp[0]){const off=interp==='CUBICSPLINE'?comp:0;return Array.from(out.slice(off,off+comp))}
  if(t>=inp[n-1]){const off=interp==='CUBICSPLINE'?((n-1)*3+1)*comp:(n-1)*comp;return Array.from(out.slice(off,off+comp))}
  let hi=1;while(hi<n-1&&inp[hi]<t)hi++;
  const lo=hi-1,t0=inp[lo],t1=inp[hi],dt=Math.max(1e-7,t1-t0),u=clamp((t-t0)/dt,0,1);
  if(interp==='STEP')return Array.from(out.slice(lo*comp,(lo+1)*comp));
  if(interp==='CUBICSPLINE'){
    const u2=u*u,u3=u2*u,h00=2*u3-3*u2+1,h10=u3-2*u2+u,h01=-2*u3+3*u2,h11=u3-u2,b0=lo*3*comp,b1=hi*3*comp,res=new Array(comp);
    for(let k=0;k<comp;k++){const v0=out[b0+comp+k],m0=out[b0+2*comp+k]*dt,v1=out[b1+comp+k],m1=out[b1+k]*dt;res[k]=h00*v0+h10*m0+h01*v1+h11*m1}
    if(s.path==='rotation'){const l=Math.hypot(...res)||1;for(let k=0;k<4;k++)res[k]/=l}
    return res;
  }
  const a=out.slice(lo*comp,(lo+1)*comp),b=out.slice(hi*comp,(hi+1)*comp);
  if(s.path==='rotation'&&comp===4)return quatSlerpGltf(a,b,u);
  const res=new Array(comp);for(let k=0;k<comp;k++)res[k]=a[k]+(b[k]-a[k])*u;return res;
}
function updateGltfSceneAnim(sa,time){
  if(!sa||sa.lastTime===time)return false;
  sa.lastTime=time;
  for(const nd of sa.nodes){nd.t=nd.baseT.slice();nd.r=nd.baseR.slice();nd.s=nd.baseS.slice();nd.weights=nd.baseWeights.slice()}
  if(sa.clips.length){
    const clip=sa.clips[sa.activeClip||0]||sa.clips[0],dur=clip.duration||0,ct=dur>1e-5?((time*(sa.speed||1))%dur+dur)%dur:0;
    for(const ch of clip.channels){
      const nd=sa.nodes[ch.node];if(!nd)continue;
      const val=sampleGltfChannel(ch.sampler,ct);if(!val)continue;
      if(ch.path==='translation'){nd.t=val;nd.hasMatrix=false;}
      else if(ch.path==='rotation'){nd.r=val;nd.hasMatrix=false;}
      else if(ch.path==='scale'){nd.s=val;nd.hasMatrix=false;}
      else if(ch.path==='weights')nd.weights=val;
    }
  }
  const visit=(idx,parent)=>{
    const nd=sa.nodes[idx];if(!nd)return;
    const loc=nd.hasMatrix?nd.baseMatrix:M.trs(nd.t,nd.r,nd.s);
    nd.world=M.mm(parent,loc);
    for(const c of nd.children)visit(c,nd.world);
  };
  for(const r of sa.roots)visit(r,sa.rootTransform||M.identity());
  for(const sk of sa.skins){
    for(let i=0;i<sk.joints.length;i++){
      const jNode=sa.nodes[sk.joints[i]],jw=jNode?jNode.world:M.identity();
      const ibm=sk.ibm?sk.ibm.slice(i*16,(i+1)*16):M.identity();
      const jm=M.mm(jw,ibm);
      sk.jointMatrices.set(jm,i*16);
    }
  }
  return true;
}
function deformGltfMesh(mesh,gl,bufRec){
  const ga=mesh._gltfAnim;if(!ga)return;
  const sa=ga.sceneAnim,nd=sa.nodes[ga.nodeIdx];if(!nd)return;
  const vCount=ga.vCount,baseP=ga.baseP,baseN=ga.baseN,posV=ga.workP,normV=ga.workN;
  posV.set(baseP);normV.set(baseN);
  const weights=nd.weights||[];
  if(ga.morphs?.length){
    for(let t=0;t<ga.morphs.length;t++){
      const w=weights[t]||0;if(Math.abs(w)<1e-5)continue;
      const dp=ga.morphs[t].dp,dn=ga.morphs[t].dn;
      if(dp)for(let k=0;k<posV.length;k++)posV[k]+=w*dp[k];
      if(dn)for(let k=0;k<normV.length;k++)normV[k]+=w*dn[k];
    }
  }
  const skin=ga.skinIdx>=0?sa.skins[ga.skinIdx]:null;
  const shift=sa.modelShift||[0,0,0],coordMat=sa.coordMatrix||null;
  if(skin&&ga.joints&&ga.weights){
    const jm=skin.jointMatrices,jArr=ga.joints,wArr=ga.weights;
    for(let v=0;v<vCount;v++){
      const px=posV[v*3],py=posV[v*3+1],pz=posV[v*3+2],nx=normV[v*3],ny=normV[v*3+1],nz=normV[v*3+2];
      let sx=0,sy=0,sz=0,snx=0,sny=0,snz=0,wSum=0;
      for(let c=0;c<4;c++){
        const wt=wArr[v*4+c];if(wt<=1e-5)continue;wSum+=wt;
        const o=jArr[v*4+c]*16;
        sx+=wt*(jm[o]*px+jm[o+4]*py+jm[o+8]*pz+jm[o+12]);
        sy+=wt*(jm[o+1]*px+jm[o+5]*py+jm[o+9]*pz+jm[o+13]);
        sz+=wt*(jm[o+2]*px+jm[o+6]*py+jm[o+10]*pz+jm[o+14]);
        snx+=wt*(jm[o]*nx+jm[o+4]*ny+jm[o+8]*nz);
        sny+=wt*(jm[o+1]*nx+jm[o+5]*ny+jm[o+9]*nz);
        snz+=wt*(jm[o+2]*nx+jm[o+6]*ny+jm[o+10]*nz);
      }
      if(wSum<1e-5){const wp=M.point(nd.world,[px,py,pz]),wn=M.norm(M.vector(nd.world,[nx,ny,nz]));sx=wp[0];sy=wp[1];sz=wp[2];snx=wn[0];sny=wn[1];snz=wn[2]}
      let fp=[sx+shift[0],sy+shift[1],sz+shift[2]],fn=[snx,sny,snz];
      if(coordMat){fp=M.point(coordMat,fp);fn=M.vector(coordMat,fn)}
      const nl=Math.hypot(fn[0],fn[1],fn[2])||1;
      posV[v*3]=fp[0];posV[v*3+1]=fp[1];posV[v*3+2]=fp[2];
      normV[v*3]=fn[0]/nl;normV[v*3+1]=fn[1]/nl;normV[v*3+2]=fn[2]/nl;
    }
  }else{
    const wMat=nd.world;
    for(let v=0;v<vCount;v++){
      const wp=M.point(wMat,[posV[v*3],posV[v*3+1],posV[v*3+2]]),wn=M.vector(wMat,[normV[v*3],normV[v*3+1],normV[v*3+2]]);
      let fp=[wp[0]+shift[0],wp[1]+shift[1],wp[2]+shift[2]],fn=wn;
      if(coordMat){fp=M.point(coordMat,fp);fn=M.vector(coordMat,fn)}
      const nl=Math.hypot(fn[0],fn[1],fn[2])||1;
      posV[v*3]=fp[0];posV[v*3+1]=fp[1];posV[v*3+2]=fp[2];
      normV[v*3]=fn[0]/nl;normV[v*3+1]=fn[1]/nl;normV[v*3+2]=fn[2]/nl;
    }
  }
  const tri=ga.tri,outP=mesh.p,outN=mesh.n;
  for(let k=0;k<tri.length;k++){
    const vi=tri[k]*3,oi=k*3;
    outP[oi]=posV[vi];outP[oi+1]=posV[vi+1];outP[oi+2]=posV[vi+2];
    outN[oi]=normV[vi];outN[oi+1]=normV[vi+1];outN[oi+2]=normV[vi+2];
  }
  mesh.bounds=M.bbox(posV);
  if(gl&&bufRec?.buffers?.length>=2){
    gl.bindBuffer(gl.ARRAY_BUFFER,bufRec.buffers[0]);gl.bufferSubData(gl.ARRAY_BUFFER,0,outP);
    gl.bindBuffer(gl.ARRAY_BUFFER,bufRec.buffers[1]);gl.bufferSubData(gl.ARRAY_BUFFER,0,outN);
  }
}
function decodeMeshoptBufferView(extDef,binChunk,maxBytes=67108864){
  if(!extDef||typeof extDef!=='object')throw Error('Thieu thong tin EXT_meshopt_compression.');
  const count=extDef.count,byteStride=extDef.byteStride,byteOffset=extDef.byteOffset??0,byteLength=extDef.byteLength,mode=extDef.mode,filter=extDef.filter||'NONE';
  if(!Number.isInteger(count)||count<=0||!Number.isInteger(byteStride)||byteStride<=0||byteStride>256)throw Error('Thong so count/byteStride cua Meshopt khong hop le.');
  const totalBytes=count*byteStride;
  if(!Number.isSafeInteger(totalBytes)||totalBytes<=0||totalBytes>maxBytes)throw Error('Meshopt bufferView vuot gioi han bo nho cho phep (64 MiB).');
  if(!['ATTRIBUTES','TRIANGLES','INDICES'].includes(mode))throw Error('Che do giai ma Meshopt khong hop le: '+mode);
  if(!['NONE','OCTAHEDRAL','QUATERNION','EXPONENTIAL','COLOR'].includes(filter))throw Error('Bo loc Meshopt khong hop le: '+filter);
  if(!binChunk)throw Error('Thieu du lieu nhi phan cho bufferView Meshopt.');
  const srcBytes=binChunk instanceof Uint8Array?binChunk:new Uint8Array(binChunk);
  if(!Number.isInteger(byteOffset)||byteOffset<0||!Number.isInteger(byteLength)||byteLength<=0||byteOffset+byteLength>srcBytes.byteLength)throw Error('Pham vi byteOffset/byteLength cua Meshopt vuot ngoai buffer.');
  const dec=(typeof window!=='undefined'&&window.MeshoptDecoder)||(typeof globalThis!=='undefined'&&globalThis.MeshoptDecoder);
  if(!dec||!dec.supported)throw Error('Bo giai ma MeshoptDecoder chua san sang.');
  const target=new Uint8Array(totalBytes);
  dec.decodeGltfBuffer(target,count,byteStride,srcBytes.subarray(byteOffset,byteOffset+byteLength),mode,filter);
  return target;
}
const Importer={
  fileMap(files){const m=new Map();for(let f of files){m.set(f.name.toLowerCase(),f);m.set((f.webkitRelativePath||f.name).replace(/\\/g,'/').toLowerCase(),f)}return m},
  resolve(name,map){let s=decodeURIComponent(name).replace(/\\/g,'/').replace(/^\.\//,'').toLowerCase();return map.get(s)||map.get(s.split('/').pop())},
  async bytes(uri,map){if(uri.startsWith('data:')){let r=await fetch(uri);return r.arrayBuffer()}let f=this.resolve(uri,map);if(!f)throw Error('Thieu tep phu thuoc: '+uri+'. Hay chon ca model, texture va file .bin.');return f.arrayBuffer()},
  async image(blob){return new Promise((resolve,reject)=>{let img=new Image(),url=URL.createObjectURL(blob);img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Khong doc duoc texture anh.'))};img.src=url})},
  async load(files){let fs=Array.from(files),file=fs.find(f=>/\.(glb|gltf|dae|obj)$/i.test(f.name));if(!file){if(fs.some(f=>/\.skp$/i.test(f.name)))throw Error('SKP can xuat tu SketchUp sang GLB hoặc DAE. Ung dung KHONG doc truc tiep .skp.');throw Error('Hay chon GLB, glTF, DAE hoac OBJ.')}let map=this.fileMap(fs);let rel=file.webkitRelativePath||file.name,base=rel.includes('/')?rel.slice(0,rel.lastIndexOf('/')+1):'';if(base)for(let f of fs){let path=f.webkitRelativePath||f.name;if(path.startsWith(base))map.set(path.slice(base.length).toLowerCase(),f)}let ext=file.name.split('.').pop().toLowerCase(),result;if(ext==='glb'||ext==='gltf')result=await this.gltf(file,map);else if(ext==='dae')result=await this.dae(file,map);else result=await this.obj(file,map);if(!result.meshes.length)throw Error('Khong tim thay mesh tam giac trong model.');let count=result.meshes.reduce((s,m)=>s+m.p.length/9,0);if(count>1500000)throw Error('Model vuot 1,5 trieu tam giac. Hay giam polygon truoc khi nhap.');result.name=file.name;result.files=fs;return result},
  async gltf(file,map){let raw=await file.arrayBuffer(),j,bin=null;if(file.name.toLowerCase().endsWith('.glb')){let dv=new DataView(raw);if(dv.byteLength<20||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2)throw Error('GLB khong hop le hoac khong phai glTF 2.0.');let off=12;while(off+8<=raw.byteLength){let len=dv.getUint32(off,true),type=dv.getUint32(off+4,true);if(off+8+len>raw.byteLength)throw Error('GLB bi cat ngan.');let chunk=raw.slice(off+8,off+8+len);if(type===0x4e4f534a)j=JSON.parse(new TextDecoder().decode(chunk).replace(/\0+$/,''));if(type===0x004e4942)bin=chunk;off+=8+len}}else j=JSON.parse(new TextDecoder().decode(raw));if(!j||!j.asset||!String(j.asset.version).startsWith('2'))throw Error('Can glTF 2.0.');let forbidden=['KHR_draco_mesh_compression','KHR_texture_basisu'];for(let e of j.extensionsRequired||[])if(forbidden.includes(e))throw Error('Model dung '+e+'. Hay xuat GLB khong nen Draco / KTX2.');let warnings=[];let buffers=await Promise.all((j.buffers||[]).map(b=>b.uri?this.bytes(b.uri,map):(b.extensions?.EXT_meshopt_compression?.fallback?Promise.resolve(null):Promise.resolve(bin))));let decodedViews=new Map(),hasMeshopt=(j.extensionsUsed||[]).includes('EXT_meshopt_compression')||(j.extensionsRequired||[]).includes('EXT_meshopt_compression')||(j.bufferViews||[]).some(v=>v?.extensions?.EXT_meshopt_compression);if(hasMeshopt){const dec=(typeof window!=='undefined'&&window.MeshoptDecoder)||(typeof globalThis!=='undefined'&&globalThis.MeshoptDecoder);if(!dec||!dec.supported)throw Error('Trinh duyet khong ho tro WebAssembly MeshoptDecoder.');await dec.ready;let totalMeshoptBytes=0;for(let vi=0;vi<(j.bufferViews||[]).length;vi++){let v=j.bufferViews[vi],ext=v?.extensions?.EXT_meshopt_compression;if(!ext)continue;let viewBytes=(ext.count||0)*(ext.byteStride||0);if(totalMeshoptBytes+viewBytes>268435456)throw Error('Tong dung luong giai ma Meshopt vuot gioi han 256 MiB.');let decoded=decodeMeshoptBufferView(ext,buffers[ext.buffer]??bin,67108864);totalMeshoptBytes+=Math.max(viewBytes,decoded?.byteLength||0);decodedViews.set(vi,decoded)}}let accessor=index=>{let a=j.accessors?.[index];if(!a)throw Error('Accessor khong ton tai.');let types={5120:[1,'getInt8'],5121:[1,'getUint8'],5122:[2,'getInt16'],5123:[2,'getUint16'],5125:[4,'getUint32'],5126:[4,'getFloat32']},spec=types[a.componentType],dim={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];if(!spec||!dim)throw Error('Kieu accessor chua ho tro.');if(a.count>10000000)throw Error('Accessor qua lon. Hay giam polygon.');const normVal=val=>{if(a.normalized&&a.componentType!==5126){let max={5120:127,5121:255,5122:32767,5123:65535,5125:4294967295}[a.componentType];return Math.max(a.componentType===5120||a.componentType===5122?-1:0,val/max)}return val};const viewDV=bvIdx=>{let bv=j.bufferViews?.[bvIdx];if(!bv)throw Error('Thieu bufferView '+bvIdx);let dec=decodedViews.get(bvIdx);return{bv,dv:dec?new DataView(dec.buffer,dec.byteOffset,dec.byteLength):new DataView(buffers[bv.buffer]),baseOff:dec?0:(bv.byteOffset||0)}};let out=new Float32Array(a.count*dim);if(a.bufferView!==undefined){let{bv,dv,baseOff}=viewDV(a.bufferView),offset=baseOff+(a.byteOffset||0),stride=bv.byteStride||bv.extensions?.EXT_meshopt_compression?.byteStride||spec[0]*dim;for(let i=0;i<a.count;i++)for(let k=0;k<dim;k++)out[i*dim+k]=normVal(dv[spec[1]](offset+i*stride+k*spec[0],true))}else if(!a.sparse)throw Error('Accessor khong co bufferView hoac sparse.');if(a.sparse&&a.sparse.count>0){let sp=a.sparse,sc=sp.count,idxSpec=types[sp.indices?.componentType];if(!idxSpec||!sp.indices||!sp.values)throw Error('Sparse accessor khong hop le.');let idxView=viewDV(sp.indices.bufferView),valView=viewDV(sp.values.bufferView),idxOff=idxView.baseOff+(sp.indices.byteOffset||0),idxStride=idxView.bv.byteStride||idxSpec[0],valOff=valView.baseOff+(sp.values.byteOffset||0),valStride=valView.bv.byteStride||spec[0]*dim;for(let s=0;s<sc;s++){let targetIdx=idxView.dv[idxSpec[1]](idxOff+s*idxStride,true);if(targetIdx>=0&&targetIdx<a.count){for(let k=0;k<dim;k++)out[targetIdx*dim+k]=normVal(valView.dv[spec[1]](valOff+s*valStride+k*spec[0],true))}}}return{data:out,count:a.count,dim}};
    let imgs=await Promise.all((j.images||[]).map(async im=>{try{if(im.uri)return this.image(new Blob([await this.bytes(im.uri,map)]));let v=j.bufferViews[im.bufferView],decView=decodedViews.get(im.bufferView);return this.image(new Blob([decView?decView:buffers[v.buffer].slice(v.byteOffset||0,(v.byteOffset||0)+v.byteLength)],{type:im.mimeType}))}catch(e){warnings.push(e.message);return null}}));
    let mats=(j.materials||[]).map(mat=>{let p=mat.pbrMetallicRoughness||{},info=p.baseColorTexture,tx=info?j.textures?.[info.index]:null;if(info?.extensions?.KHR_texture_transform)warnings.push('KHR_texture_transform cua texture goc chua duoc ap dung.');return{color:p.baseColorFactor||[.65,.67,.7,1],image:tx?imgs[tx.source]:null,emissive:mat.emissiveFactor||[0,0,0],roughness:p.roughnessFactor??.65,name:mat.name||'',alphaCutoff:mat.alphaMode==='MASK'?(mat.alphaCutoff??.5):0}});
    let sc=j.scenes?.[j.scene||0],roots=sc?.nodes||j.nodes?.map((_,i)=>i).filter(i=>!j.nodes.some(n=>n.children?.includes(i)))||[];
    let hasAnim=Boolean(j.animations?.length||j.skins?.length||(j.meshes||[]).some(m=>m.primitives?.some(p=>p.targets?.length))),sceneAnim=null;
    if(hasAnim){
      const animNodes=(j.nodes||[]).map((nd,ni)=>{const mWeights=nd.weights||(nd.mesh!==undefined&&j.meshes?.[nd.mesh]?.weights)||[];return{index:ni,name:nd.name||('Node '+ni),children:Array.isArray(nd.children)?nd.children.slice():[],hasMatrix:Array.isArray(nd.matrix)&&nd.matrix.length===16,baseMatrix:Array.isArray(nd.matrix)&&nd.matrix.length===16?nd.matrix.slice():M.identity(),baseT:Array.isArray(nd.translation)?nd.translation.slice(0,3):[0,0,0],baseR:Array.isArray(nd.rotation)?nd.rotation.slice(0,4):[0,0,0,1],baseS:Array.isArray(nd.scale)?nd.scale.slice(0,3):[1,1,1],baseWeights:Array.isArray(mWeights)?mWeights.slice():[],t:[0,0,0],r:[0,0,0,1],s:[1,1,1],weights:[],world:M.identity()}});
      const animSkins=(j.skins||[]).map(sk=>{const joints=Array.isArray(sk.joints)?sk.joints.slice():[];const ibm=sk.inverseBindMatrices!==undefined?accessor(sk.inverseBindMatrices).data:null;return{joints,ibm,jointMatrices:new Float32Array(joints.length*16)}});
      const animClips=(j.animations||[]).map((an,ai)=>{const rawSamplers=Array.isArray(an.samplers)?an.samplers:[],channels=[];let duration=0;for(const ch of an.channels||[]){const tgt=ch.target||{},rawS=rawSamplers[ch.sampler];if(tgt.node===undefined||!rawS||rawS.input===undefined||rawS.output===undefined)continue;const inp=accessor(rawS.input).data,outAcc=accessor(rawS.output);for(let k=0;k<inp.length;k++)if(inp[k]>duration)duration=inp[k];const path=tgt.path;let dim=outAcc.dim;if(path==='weights'){const nd=animNodes[tgt.node];dim=Math.max(1,nd?.baseWeights?.length||1)}channels.push({node:tgt.node,path,sampler:{input:inp,output:outAcc.data,interpolation:rawS.interpolation||'LINEAR',dim,path}})}return{name:an.name||('Clip '+(ai+1)),duration,channels}}).filter(c=>c.channels.length>0);
      sceneAnim={nodes:animNodes,skins:animSkins,clips:animClips,roots,activeClip:0,speed:1,lastTime:-1,modelShift:[0,0,0],coordMatrix:null,rootTransform:null};
      updateGltfSceneAnim(sceneAnim,0);
    }
    let meshes=[],punctualLights=[],visited=new Set();let walk=(idx,parent,path,chain=[])=>{let node=j.nodes[idx];if(!node)return;if(visited.has(idx))throw Error('Vong lap trong scene graph.');visited.add(idx);let mat=M.mm(parent,node.matrix||M.trs(node.translation,node.rotation,node.scale)),label=node.name||('Object '+idx);const ancestry=[...chain,{id:idx,name:label,matrix:mat.slice()}];const li=node.extensions?.KHR_lights_punctual?.light;if(li!==undefined){const l=j.extensions?.KHR_lights_punctual?.lights?.[li];if(l)punctualLights.push({key:'gltf-node:'+idx,name:label,type:l.type,point:M.point(mat,[0,0,0]),direction:M.norm(M.vector(mat,[0,0,-1])),color:l.color||[1,1,1],intensity:l.intensity??1,angle:(l.spot?.outerConeAngle??Math.PI/4)*180/Math.PI,nodeChain:ancestry,range:l.range});}if(node.mesh!==undefined){let gm=j.meshes[node.mesh];for(let pi=0;pi<gm.primitives.length;pi++){let pr=gm.primitives[pi];if(pr.extensions?.KHR_draco_mesh_compression)throw Error('Hay xuat GLB khong nen Draco.');if(pr.attributes.POSITION===undefined)continue;let a=accessor(pr.attributes.POSITION),nAcc=pr.attributes.NORMAL!==undefined?accessor(pr.attributes.NORMAL):null,uv=pr.attributes.TEXCOORD_0!==undefined?accessor(pr.attributes.TEXCOORD_0):null,ind=pr.indices!==undefined?Array.from(accessor(pr.indices).data):Array.from({length:a.count},(_,i)=>i),mode=pr.mode??4,tri=[];if(mode===4){for(let i=0;i+2<ind.length;i+=3)tri.push(ind[i],ind[i+1],ind[i+2])}else if(mode===5){for(let i=2;i<ind.length;i++)tri.push(ind[i-2+(i%2)],ind[i-1-(i%2)],ind[i])}else if(mode===6){for(let i=2;i<ind.length;i++)tri.push(ind[0],ind[i-1],ind[i])}else continue;if(tri.length>4500000)throw Error('Mesh vuot 1,5 trieu tam giac.');let pos=new Float32Array(tri.length*3),tex=new Float32Array(tri.length*2);for(let k=0;k<tri.length;k++){let vi=tri[k];pos.set(M.point(mat,Array.from(a.data.slice(vi*3,vi*3+3))),k*3);if(uv)tex.set(uv.data.slice(vi*2,vi*2+2),k*2)}let mesh=makeMesh(label+(gm.primitives.length>1?' / '+pi:''),pos,tex,null,mats[pr.material]||{});mesh.nodeChain=ancestry;mesh.nodeId=idx;mesh.nodePath=ancestry.map(n=>n.id).join('/');mesh.sourceTransform=mat.slice();mesh.path=path+'/'+label+'/'+pi;if(sceneAnim){const jAcc=pr.attributes.JOINTS_0!==undefined?accessor(pr.attributes.JOINTS_0):null,wAcc=pr.attributes.WEIGHTS_0!==undefined?accessor(pr.attributes.WEIGHTS_0):null,morphs=(pr.targets||[]).slice(0,8).map(t=>({dp:t.POSITION!==undefined?accessor(t.POSITION).data:null,dn:t.NORMAL!==undefined?accessor(t.NORMAL).data:null}));let baseN=nAcc?nAcc.data:null;if(!baseN){baseN=new Float32Array(a.count*3);for(let t=0;t<tri.length;t+=3){const i0=tri[t]*3,i1=tri[t+1]*3,i2=tri[t+2]*3,p0=[a.data[i0],a.data[i0+1],a.data[i0+2]],p1=[a.data[i1],a.data[i1+1],a.data[i1+2]],p2=[a.data[i2],a.data[i2+1],a.data[i2+2]],fn=M.norm(M.cross(M.sub(p1,p0),M.sub(p2,p0)));for(const vi of[i0,i1,i2]){baseN[vi]+=fn[0];baseN[vi+1]+=fn[1];baseN[vi+2]+=fn[2]}}for(let v=0;v<a.count;v++){const nl=Math.hypot(baseN[v*3],baseN[v*3+1],baseN[v*3+2])||1;baseN[v*3]/=nl;baseN[v*3+1]/=nl;baseN[v*3+2]/=nl}}mesh._gltfAnim={sceneAnim,nodeIdx:idx,skinIdx:typeof node.skin==='number'?node.skin:-1,vCount:a.count,baseP:new Float32Array(a.data),baseN:new Float32Array(baseN),workP:new Float32Array(a.data.length),workN:new Float32Array(baseN.length),tri:new Uint32Array(tri),joints:jAcc?new Uint16Array(jAcc.data):null,weights:wAcc?new Float32Array(wAcc.data):null,morphs}}meshes.push(mesh)}}for(let child of node.children||[])walk(child,mat,path+'/'+label,ancestry);visited.delete(idx)};for(let r of roots)walk(r,M.identity(),'');return{meshes,punctualLights,warnings:[...new Set(warnings)],sceneAnim}
  },
  async dae(file,map){let doc=new DOMParser().parseFromString(await file.text(),'application/xml');if(doc.querySelector('parsererror'))throw Error('DAE XML khong hop le.');let byId=id=>doc.getElementById(id)||Array.from(doc.querySelectorAll('[id]')).find(e=>e.getAttribute('id')===id);let ref=s=>(s||'').replace(/^#/,'');let nums=s=>(s||'').trim().split(/\s+/).filter(Boolean).map(Number);let warnings=[],effects={};for(let mat of doc.querySelectorAll('library_materials > material')){let eff=byId(ref(mat.querySelector('instance_effect')?.getAttribute('url'))),col=nums(eff?.querySelector('diffuse > color')?.textContent),image=null;let tex=eff?.querySelector('diffuse > texture')?.getAttribute('texture');if(tex){let params=eff?.querySelectorAll('newparam')||[],sampler=Array.from(params).find(p=>p.getAttribute('sid')===tex),source=sampler?.querySelector('source')?.textContent,surface=Array.from(params).find(p=>p.getAttribute('sid')===source),imgid=surface?.querySelector('init_from')?.textContent,uri=byId(imgid)?.querySelector('init_from')?.textContent;if(uri){try{image=await this.image(new Blob([await this.bytes(uri,map)]))}catch(e){warnings.push(e.message)}}}effects[mat.id]={color:col.length>=3?[...col.slice(0,3),col[3]??1]:[.6,.62,.66,1],image,name:mat.getAttribute('name')||mat.id}}let geos={};for(let geo of doc.querySelectorAll('library_geometries > geometry')){let sources={};for(let s of geo.querySelectorAll('mesh > source')){sources[s.id]={a:nums(s.querySelector('float_array')?.textContent),stride:Number(s.querySelector('accessor')?.getAttribute('stride')||3)}}let verts={};for(let v of geo.querySelectorAll('vertices'))for(let i of v.querySelectorAll('input'))if(i.getAttribute('semantic')==='POSITION')verts[v.id]=ref(i.getAttribute('source'));let primitives=[];for(let pr of geo.querySelectorAll('mesh > triangles, mesh > polylist, mesh > polygons')){let inputs=Array.from(pr.querySelectorAll(':scope > input')),stride=Math.max(...inputs.map(i=>Number(i.getAttribute('offset')||0)))+1,pi=inputs.find(i=>i.getAttribute('semantic')==='VERTEX'||i.getAttribute('semantic')==='POSITION'),ui=inputs.find(i=>i.getAttribute('semantic')==='TEXCOORD');if(!pi)continue;let pos=sources[verts[ref(pi.getAttribute('source'))]||ref(pi.getAttribute('source'))],uv=ui?sources[ref(ui.getAttribute('source'))]:null,polys=[];if(pr.localName==='polylist'){let data=nums(pr.querySelector('p')?.textContent),vc=nums(pr.querySelector('vcount')?.textContent),off=0;for(let count of vc){polys.push(data.slice(off,off+count*stride));off+=count*stride}}else if(pr.localName==='triangles'){let data=nums(pr.querySelector('p')?.textContent);for(let i=0;i<data.length;i+=stride*3)polys.push(data.slice(i,i+stride*3))}else for(let pp of pr.querySelectorAll(':scope > p'))polys.push(nums(pp.textContent));let p=[],t=[];for(let poly of polys)for(let i=1;i<poly.length/stride-1;i++)for(let k of[0,i,i+1]){let ix=poly[k*stride+Number(pi.getAttribute('offset')||0)];p.push(...pos.a.slice(ix*pos.stride,ix*pos.stride+3));if(uv){let v=poly[k*stride+Number(ui.getAttribute('offset')||0)];t.push(uv.a[v*uv.stride],1-uv.a[v*uv.stride+1])}else t.push(0,0)}primitives.push({p,t,symbol:pr.getAttribute('material')})}geos[geo.id]=primitives}let unit=Number(doc.querySelector('asset > unit')?.getAttribute('meter')||1),up=doc.querySelector('asset > up_axis')?.textContent||'Y_UP',base=M.trs([0,0,0],[0,0,0,1],[unit,unit,unit]);if(up==='Z_UP')base=M.mm(M.rotate([1,0,0],-Math.PI/2),base);else if(up==='X_UP')base=M.mm(M.rotate([0,0,1],Math.PI/2),base);let meshes=[];let walk=(node,parent,path,depth=0)=>{if(depth>64)throw Error('DAE hierarchy qua sau.');let mat=parent.slice();for(let el of node.children){let a=nums(el.textContent);if(el.localName==='matrix'&&a.length===16){let tr=[];for(let c=0;c<4;c++)for(let r=0;r<4;r++)tr.push(a[r*4+c]);mat=M.mm(mat,tr)}else if(el.localName==='translate')mat=M.mm(mat,M.translate(a));else if(el.localName==='rotate')mat=M.mm(mat,M.rotate(a.slice(0,3),a[3]*Math.PI/180));else if(el.localName==='scale')mat=M.mm(mat,M.trs([0,0,0],[0,0,0,1],a))}let name=node.getAttribute('name')||node.id||'Object';for(let inst of Array.from(node.children).filter(e=>e.localName==='instance_geometry')){let bind={};for(let b of inst.querySelectorAll('instance_material'))bind[b.getAttribute('symbol')]=effects[ref(b.getAttribute('target'))];for(let g of geos[ref(inst.getAttribute('url'))]||[]){let mesh=makeMesh(name,g.p,g.t,null,bind[g.symbol]||{});transformMesh(mesh,mat);mesh.sourceTransform=mat.slice();mesh.path=path+'/'+name;meshes.push(mesh)}}for(let el of node.children){if(el.localName==='node')walk(el,mat,path+'/'+name,depth+1);if(el.localName==='instance_node'){let target=byId(ref(el.getAttribute('url')));if(target)walk(target,mat,path+'/'+name,depth+1)}}};let vsid=ref(doc.querySelector('scene > instance_visual_scene')?.getAttribute('url')),vs=byId(vsid)||doc.querySelector('visual_scene');if(vs)for(let n of vs.children)if(n.localName==='node')walk(n,base,'');return{meshes,warnings,coordinateInfo:{declaredUnit:unit+' meter / source unit',declaredUp:up,normalizedByImporter:true}}
  },
  async obj(file,map){let text=await file.text(),v=[],t=[],groups=[],g={name:'Object',p:[],uv:[]};groups.push(g);for(let line of text.split(/\r?\n/)){let a=line.trim().split(/\s+/),op=a.shift();if(op==='v')v.push(a.map(Number));if(op==='vt')t.push(a.map(Number));if(op==='o'||op==='g'){g={name:a.join(' ')||'Object',p:[],uv:[]};groups.push(g)}if(op==='f'){let verts=a.map(s=>s.split('/').map(Number));for(let i=1;i<verts.length-1;i++)for(let k of[0,i,i+1]){let [vi,ti]=verts[k],p=v[vi<0?v.length+vi:vi-1];if(!p)throw Error('OBJ co chi so dinh khong hop le.');g.p.push(...p.slice(0,3));let uv=t[ti<0?t.length+ti:ti-1]||[0,0];g.uv.push(uv[0],1-uv[1])}}}return{meshes:groups.filter(g=>g.p.length).map(g=>makeMesh(g.name,g.p,g.uv)),warnings:['OBJ: nhap hinh hoc; vat lieu MTL chua ho tro. Uu tien GLB de giu texture.']}}
};

/* Local WebGL2 stage renderer. No CDN, tracking or remote upload. */
const VS=`#version 300 es
precision highp float; precision highp int;
layout(location=0) in vec3 aPosition; layout(location=1) in vec3 aNormal; layout(location=2) in vec2 aUV; layout(location=3) in vec2 aMapUV;
uniform float uBeamAperture10; uniform mat4 uVP,uBeamMatrix,uActorMatrix; uniform int uActor; uniform mat3 uBeamNormal; uniform int uMode; uniform float uSurfaceOffset; uniform vec3 uSurfaceNormal; uniform int uUseSurfaceNormal;
out vec3 vPosition; out vec3 vNormal; out vec2 vUV; out vec2 vMapUV;
void main(){vec3 n=uUseSurfaceNormal==1?uSurfaceNormal:aNormal;vPosition=aPosition+n*uSurfaceOffset;vNormal=aNormal;vUV=aUV;vMapUV=aMapUV;if(uActor==1){vPosition=(uActorMatrix*vec4(aPosition,1.)).xyz;vNormal=normalize(mat3(uActorMatrix)*aNormal);}if(uMode==2){vec3 bp=aPosition;bp.xz*=mix(uBeamAperture10,1.,aPosition.y);vPosition=(uBeamMatrix*vec4(bp,1.0)).xyz;vNormal=normalize(uBeamNormal*aNormal);}gl_Position=uVP*vec4(vPosition,1.0);}`;
const FS=`#version 300 es
precision highp float; precision highp int;
in vec3 vPosition;in vec3 vNormal;in vec2 vUV;in vec2 vMapUV;out vec4 frag;
uniform sampler2D uTexture,uPrevTexture;
uniform int uLightCount,uVJActive,uVJType,uPrevHasTex,uPrevEffect,uPrevStage,uPrevGlobal,uPrevRotate,uPrevFlipX,uPrevFlipY,uPrevFit;
uniform float uVJMix,uVJDim,uVJFlash,uVJZoom,uVJHue,uPrevBrightness,uPrevSourceAspect;
uniform vec4 uPrevCrop,uPrevRect;uniform vec3 uPrevAccent;

uniform vec4 uColor;uniform vec3 uEmissive;uniform vec3 uEye;
uniform int uMode,uEffect,uHasTex,uFit,uRotate,uFlipX,uFlipY,uGlobal,uFloor,uSelected,uTest,uStageMap;
uniform float uTime,uBrightness,uAmbient,uExposure,uHaze,uOpacity,uAspect,uSourceAspect,uCutoff;
uniform vec4 uCrop,uRect;uniform vec2 uMaster;uniform vec3 uAccent;
uniform vec3 uLightPos[16],uLightDir[16],uLightColor[16];uniform float uLightCone[16];
uniform float uGoboKind9[16],uGoboSpin9[16],uGoboSize9[16];
uniform sampler2D uGoboTex9;uniform int uGoboOn9;
vec3 goboMask9(vec2 p,float kind,float angle){
 float c=cos(angle),s=sin(angle);p=mat2(c,-s,s,c)*p;
 float r=length(p),aa=max(.006,length(fwidth(p))*.65),a=atan(p.y,p.x);
 float edge=1.-smoothstep(.96,1.,r),m=1.;
 if(kind<.5)return vec3(1.);
 if(kind<1.5)m=1.-smoothstep(.065,.065+aa,abs(r-.62));
 else if(kind<2.5)m=1.-smoothstep(.43+.19*cos(a*5.),.43+.19*cos(a*5.)+aa,r);
 else if(kind<3.5){vec2 q=fract(p*2.8+.5)-.5;m=1.-smoothstep(.12,.12+aa,length(q));}
 else if(kind<4.5)m=1.-smoothstep(.15,.15+aa,abs(fract(p.x*3.)-.5));
 else if(kind<5.5)m=smoothstep(.35,.45,sin(a*7.));
 else if(kind<6.5)m=max(max(1.-smoothstep(.19,.19+aa,length(p-vec2(.38,0.))),1.-smoothstep(.19,.19+aa,length(p-vec2(-.19,.329)))),1.-smoothstep(.19,.19+aa,length(p-vec2(-.19,-.329))));
 else {if(uGoboOn9==0)return vec3(0.);vec4 logo=texture(uGoboTex9,vec2(p.x*.5+.5,.5-p.y*.5));return logo.rgb*logo.a*edge;}
 return vec3(m*edge);
}

uniform float uActorArt11;
uniform float uCastFill10,uContentTime10,uRollX10,uRollY10,uRotate10,uMirror10,uInvert10,uRGB10,uPulse10;
vec3 film(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
vec3 makeMotion(vec2 uv,int effect,vec3 accent){
 float t=uContentTime10;vec3 dark=vec3(.009,.016,.035),blue=accent,pink=vec3(.92,.12,.42),gold=vec3(1.0,.45,.055);
 if(effect==1){vec2 p=(uv-.5)*vec2(2.8,1.0);float r=length(p),a=atan(p.y,p.x);float f=pow(max(0.0,sin(r*18.0-a*2.0-t*2.1)),8.0);return dark+mix(blue,pink,.5+.5*sin(a+t*.3))*f*1.4+blue*.04/(.02+abs(r-.25-.08*sin(t)));}
 if(effect==2){vec2 p=(uv-.5)*vec2(3.0,1.2);p.y+=.1*sin(t);float z=1.0/max(.1,p.y+.7);vec2 q=vec2(p.x*z,z+t*.5)*5.0;vec2 d=abs(fract(q)-.5);float line=1.0-smoothstep(.01,.055,min(d.x,d.y));return dark+blue*line*.7+pink*pow(max(0.0,1.0-abs(uv.y-.46)*10.0),5.0)*.7;}
 if(effect==3){vec3 col=dark;for(int i=0;i<4;i++){vec2 p=uv*vec2(24.0,8.0)+vec2(t*.2*float(i+1),sin(t*.2+float(i))*.3);vec2 cell=floor(p),f=fract(p)-.5;float h=hash(cell+float(i)*17.0);float dotv=exp(-dot(f,f)*(100.0+180.0*h));col+=mix(blue,gold,h)*dotv*(.3+h)*(.4+.6*sin(t+h*20.0)*sin(t+h*20.0));}return col;}
 float wave=.5+.16*sin(uv.x*6.0-t*.9)+.08*sin(uv.x*17.0+t*.7);float d=abs(uv.y-wave);float ribbon=exp(-d*22.0),edge=exp(-abs(d-.055)*85.0);float threads=.5+.5*sin(uv.y*115.0+uv.x*13.0+t*2.0);vec3 hue=mix(blue,gold,.5+.5*sin(uv.x*5.0-t*.35));return dark+hue*(ribbon*.7+edge*.7)*(.7+.3*threads)+pink*.018/(.04+abs(uv.y-(.35+.17*sin(uv.x*8.0+t*.5))));
}
void main(){
 vec2 uv=vUV;
 if(uMode==2){float a=uOpacity*pow(max(0.0,1.0-vUV.y),.55);float rim=pow(abs(dot(normalize(vNormal),normalize(uEye-vPosition))),.75);a*=rim*rim;frag=vec4(uColor.rgb*1.05,a);return;}
 if(uMode==1){
  if(uRotate==1)uv=vec2(uv.y,1.0-uv.x);else if(uRotate==2)uv=1.0-uv;else if(uRotate==3)uv=vec2(1.0-uv.y,uv.x);
  if(uFlipX==1)uv.x=1.0-uv.x;if(uFlipY==1)uv.y=1.0-uv.y;
  float sourceAspect=uSourceAspect;if(uRotate==1||uRotate==3)sourceAspect=1.0/sourceAspect;
  if(uFit==1){if(sourceAspect>uAspect)uv.y=(uv.y-.5)/(uAspect/sourceAspect)+.5;else uv.x=(uv.x-.5)/(sourceAspect/uAspect)+.5;}
  if(uFit==2){if(sourceAspect>uAspect)uv.x=(uv.x-.5)*(uAspect/sourceAspect)+.5;else uv.y=(uv.y-.5)*(sourceAspect/uAspect)+.5;}
  vec3 col;
  if(uStageMap==1)uv=vMapUV;
  uv=(uv-0.5)/(max(0.1,uVJZoom)*(1.+uPulse10*(.14+.14*sin(uTime*6.2831853))))+0.5;
  if(abs(uRotate10)>.0001){float a=uTime*uRotate10;vec2 q=uv-.5;uv=mat2(cos(a),-sin(a),sin(a),cos(a))*q+.5;}
  if(abs(uRollX10)+abs(uRollY10)>.001)uv=fract(uv+vec2(uRollX10,uRollY10)*uTime*.14);
  if(uMirror10>.5)uv.x=abs(uv.x*2.-1.);
  if(uHasTex==1){if(any(lessThan(uv,vec2(0.0)))||any(greaterThan(uv,vec2(1.0))))col=vec3(0.0);else col=texture(uTexture,uStageMap==1?uv:(uCrop.xy+uv*uCrop.zw)).rgb;}
  else{vec2 muv=uStageMap==1?uv:(uGlobal==1?(uRect.xy+uv*uRect.zw)/uMaster:uv);col=makeMotion(muv,uEffect,uAccent);}
  if(uRGB10>.001&&uHasTex==1){vec2 off=vec2(.008*uRGB10,0.);vec2 q=uStageMap==1?uv:uCrop.xy+uv*uCrop.zw;vec2 lo=uStageMap==1?vec2(0.):uCrop.xy;vec2 hi=uStageMap==1?vec2(1.):uCrop.xy+uCrop.zw;col.r=texture(uTexture,clamp(q+off,lo,hi)).r;col.b=texture(uTexture,clamp(q-off,lo,hi)).b;}
  if(uInvert10>.5)col=1.-col;
  col*=uBrightness;
  if(uVJActive==1){
   vec2 old=vUV;
   if(uPrevRotate==1)old=vec2(old.y,1.0-old.x);else if(uPrevRotate==2)old=1.0-old;else if(uPrevRotate==3)old=vec2(1.0-old.y,old.x);
   if(uPrevFlipX==1)old.x=1.0-old.x;if(uPrevFlipY==1)old.y=1.0-old.y;
   float sa=uPrevSourceAspect;if(uPrevRotate==1||uPrevRotate==3)sa=1.0/sa;
   if(uPrevFit==1){if(sa>uAspect)old.y=(old.y-.5)/(uAspect/sa)+.5;else old.x=(old.x-.5)/(sa/uAspect)+.5;}
   if(uPrevFit==2){if(sa>uAspect)old.x=(old.x-.5)*(uAspect/sa)+.5;else old.y=(old.y-.5)*(sa/uAspect)+.5;}
   if(uPrevStage==1)old=vMapUV;
   old=(old-.5)/max(.1,uVJZoom)+.5;
   vec3 a;
   if(uPrevHasTex==1){a=(any(lessThan(old,vec2(0.)))||any(greaterThan(old,vec2(1.))))?vec3(0.):texture(uPrevTexture,uPrevStage==1?old:uPrevCrop.xy+old*uPrevCrop.zw).rgb;}
   else{vec2 m=uPrevStage==1?old:(uPrevGlobal==1?(uPrevRect.xy+old*uPrevRect.zw)/uMaster:old);a=makeMotion(m,uPrevEffect,uPrevAccent);}
   a*=uPrevBrightness;
   float mixval=uVJMix;
   if(uVJType==1)mixval=1.0-smoothstep(uVJMix-.025,uVJMix+.025,(uStageMap==1?vMapUV.x:(uRect.x+vUV.x*uRect.z)/uMaster.x));
   if(uVJType==2)col=uVJMix<.5?a*(1.0-uVJMix*2.0):col*((uVJMix-.5)*2.0);else col=mix(a,col,mixval);
  }
  if(abs(uVJHue)>.001){vec3 k=vec3(.57735027);float a=uVJHue*6.2831853;col=col*cos(a)+cross(k,col)*sin(a)+k*dot(k,col)*(1.0-cos(a));}
  col=mix(col,vec3(1.0),uVJFlash)*uVJDim;

  if(uSelected==1){float e=min(min(vUV.x,1.0-vUV.x),min(vUV.y,1.0-vUV.y));col=mix(vec3(.55,.38,1.0),col,smoothstep(.003,.008,e));}
  frag=vec4(clamp(col,0.0,1.0),1.0);return;
 }
 vec4 tex=uHasTex==1?texture(uTexture,uv):vec4(1.0);if(tex.a*uColor.a<uCutoff)discard;
 vec3 base=pow(max(vec3(0.0),tex.rgb*uColor.rgb),vec3(2.2)),normal=normalize(vNormal);if(!gl_FrontFacing)normal=-normal;
 vec3 col=base*(uAmbient*(.7+.3*max(0.0,normal.y))+.12*max(0.0,dot(normal,normalize(vec3(-.3,1.0,.5)))));
 for(int i=0;i<16;i++){if(i>=uLightCount)break;vec3 toLight=uLightPos[i]-vPosition;float d=length(toLight);vec3 ld=toLight/max(d,.001);float cone=dot(-ld,uLightDir[i]);float fall=smoothstep(uLightCone[i],min(.999,uLightCone[i]+.045),cone);float lam=max(0.0,dot(normal,ld));vec3 mask=vec3(1.);
 if(uGoboKind9[i]>.5&&fall>.001){vec3 axis=normalize(uLightDir[i]),right=normalize(cross(axis,abs(axis.y)>.97?vec3(0.,0.,1.):vec3(0.,1.,0.))),up=cross(right,axis),rel=vPosition-uLightPos[i];float axial=dot(rel,axis),tanCone=sqrt(max(.0001,1.-uLightCone[i]*uLightCone[i]))/max(.01,uLightCone[i]),radius=max(.001,axial*tanCone*uGoboSize9[i]);vec2 q=vec2(dot(rel,right),dot(rel,up))/radius;mask=axial>0.?goboMask9(q,uGoboKind9[i],uGoboSpin9[i]):vec3(0.);}
 col+=base*uLightColor[i]*mask*fall*(lam*.9+.08)/(1.0+.025*d*d);}
 col+=uEmissive+base*uCastFill10;
 if(uActorArt11>0.){vec3 eyeDir=normalize(uEye-vPosition),keyDir=normalize(vec3(-.5,.8,.7)),halfDir=normalize(eyeDir+keyDir);float rim=pow(1.-max(0.,dot(normal,eyeDir)),3.),spec=pow(max(0.,dot(normal,halfDir)),40.);col+=uActorArt11*(base*(.18+.7*max(0.,dot(normal,keyDir)))+vec3(.12,.18,.22)*rim+vec3(.16,.13,.09)*spec);}
 if(uFloor==1){float r=length(vPosition.xz);float fade=exp(-r*.022);vec2 fw=max(fwidth(vPosition.xz),vec2(.001));vec2 g1=abs(fract(vPosition.xz-.5)-.5)/fw;float l1=1.-clamp(min(g1.x,g1.y),0.,1.);vec2 g5=abs(fract(vPosition.xz*.2-.5)-.5)/(fw*.2);float l5=1.-clamp(min(g5.x,g5.y),0.,1.);float axX=1.-smoothstep(0.,max(.035,fw.y*1.8),abs(vPosition.z));float axZ=1.-smoothstep(0.,max(.035,fw.x*1.8),abs(vPosition.x));col+=vec3(.055,.075,.105)*l1*fade+vec3(.13,.175,.24)*l5*fade;col=mix(col,vec3(.58,.13,.18),axX*fade*.78);col=mix(col,vec3(.15,.52,.30),axZ*fade*.78);}
 col=pow(film(col*uExposure),vec3(1.0/2.2));float fog=1.0-exp(-length(vPosition-uEye)*uHaze*.0009);col=mix(col,vec3(.07,.085,.12),min(.4,fog));frag=vec4(col,tex.a*uColor.a);
}`;
class StageEngine{
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl2',{antialias:true,alpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance'})||canvas.getContext('webgl2',{alpha:false})||canvas.getContext('webgl2');if(!this.gl)throw Error('WebGL2 khong san sang. Hay bat tang toc phan cung trong Chrome/Edge.');const gl=this.gl;const sh=(type,code)=>{let s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};let p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,VS.replace("uniform int uMode;","const int uMode=1;")));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FS.replace("uniform int uMode,","const int uMode=1;uniform int ")));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));this.program=p;this.programs={1:p};for(const mode of [0,2]){const q=gl.createProgram();gl.attachShader(q,sh(gl.VERTEX_SHADER,VS.replace("uniform int uMode;","const int uMode="+mode+";")));gl.attachShader(q,sh(gl.FRAGMENT_SHADER,FS.replace("uniform int uMode,","const int uMode="+mode+";uniform int ")));gl.linkProgram(q);if(!gl.getProgramParameter(q,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(q));this.programs[mode]=q;}this.locations={};this.buffers=new Map();this.texCache=new Map();this.frame=0;this.stage=[];this.surfaces=[];this.lights=[];this.settings={ambient:.7,exposure:1.1,haze:20,beam:.35,grid:true};this.camera={yaw:.13,pitch:.23,distance:28,target:[0,2.5,0]};this.eye=[0,0,28];this.view='stage';this.selected=null;this.showGuides=true;this.maxSize=gl.getParameter(gl.MAX_TEXTURE_SIZE);this.white=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.white);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));this.size={width:18,height:8,depth:8};this.floor=boxMesh('Environment floor',[0,-.16,0],[150,.2,150],[.21,.24,.29,1]);this.floor.isFloor=true;this.master={width:3840,height:1080};this.accent='#29caff';this.effect=0;this.media=new Map();this.globalTest=false;this.beamMeshes=[];this.fixtureMeshes=[];this.flatCache=new Map();this.onCameraChange=()=>{};this.bindOrbit()}
 loc(n){return this.locations[n]??(this.locations[n]=this.gl.getUniformLocation(this.program,n))}
 uniform(n,v,type){let gl=this.gl,l=this.loc(n);if(l===null)return;if(type==='i')gl.uniform1i(l,v);else if(type==='m')gl.uniformMatrix4fv(l,false,v);else if(typeof v==='number')gl.uniform1f(l,v);else if(type==='3a')gl.uniform3fv(l,v);else if(type==='1a')gl.uniform1fv(l,v);else if(v.length===4)gl.uniform4fv(l,v);else if(v.length===3)gl.uniform3fv(l,v);else if(v.length===2)gl.uniform2fv(l,v)}
 gpu(mesh){let gl=this.gl,b=this.buffers.get(mesh.id);if(!b){b={vao:gl.createVertexArray(),buffers:[]};this.buffers.set(mesh.id,b);gl.bindVertexArray(b.vao);let usage=mesh._gltfAnim?gl.DYNAMIC_DRAW:gl.STATIC_DRAW;for(let[n,arr,dim]of[['aPosition',mesh.p,3],['aNormal',mesh.n,3],['aUV',mesh.uv,2],['aMapUV',mesh.mapUV||mesh.uv,2]]){let buf=gl.createBuffer();b.buffers.push(buf);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,arr,(n==='aPosition'||n==='aNormal')?usage:gl.STATIC_DRAW);let l=gl.getAttribLocation(this.program,n);if(l>=0){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,dim,gl.FLOAT,false,0,0)}}b.count=mesh.p.length/3}else gl.bindVertexArray(b.vao);return b}
 updateAnimatedMeshes(time=0){let seen=new Set();for(let m of this.stage){const ga=m._gltfAnim;if(!ga||m.hidden)continue;const sa=ga.sceneAnim;if(!seen.has(sa)){seen.add(sa);sa.coordMatrix=(this.coordinates?.matrix&&!this.coordinates.identity)?this.coordinates.matrix:null;updateGltfSceneAnim(sa,time)}deformGltfMesh(m,this.gl,this.buffers.get(m.id))}}
 releaseMesh(mesh){let b=this.buffers.get(mesh.id);if(b){for(let x of b.buffers)this.gl.deleteBuffer(x);this.gl.deleteVertexArray(b.vao);this.buffers.delete(mesh.id)}}
 texture(source){let gl=this.gl;if(!source)return this.white;let t=this.texCache.get(source);if(!t){t={tex:gl.createTexture(),frame:-1};this.texCache.set(source,t);gl.bindTexture(gl.TEXTURE_2D,t.tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)}let dynamic=source instanceof HTMLVideoElement;if(t.frame===-1||(dynamic&&t.frame!==this.frame&&source.readyState>=2)){try{gl.bindTexture(gl.TEXTURE_2D,t.tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);t.frame=this.frame}catch(e){return this.white}}return t.tex}
 draw(mesh,mode=0,surface=null,opacity=1){let gl=this.gl,b=this.gpu(mesh),mat=mesh.material||{},source=mat.image||null;this.uniform('uActor',mesh.actorMatrix?1:0,'i');if(mesh.actorMatrix)this.uniform('uActorMatrix',mesh.actorMatrix,'m');this.uniform('uMode',mode,'i');this.uniform('uStageMap',mode===1&&surface?.mappingSpace==='stage'&&!this.globalTest&&surface.source!=='test'?1:0,'i');this.uniform('uSurfaceOffset',mode===1&&this.view==='stage'?(surface?.liftMm||0)/1000:0);this.uniform('uSurfaceNormal',surface?.bindingNormal||[0,0,1]);this.uniform('uUseSurfaceNormal',surface?.mappingMode==='face'?1:0,'i');this.uniform('uColor',mat.color||[.5,.5,.5,1]);this.uniform('uEmissive',mat.emissive||[0,0,0]);this.uniform('uOpacity',opacity);this.uniform('uFloor',mesh.isFloor&&this.settings.grid?1:0,'i');this.uniform('uCutoff',mat.alphaCutoff||0);this.uniform('uSelected',0,'i');
  if(mode===1){let s=surface,asset=this.media.get(s.source);if(this.globalTest||s.source==='test')source=s.testCanvas;else if(asset)source=asset.element;else source=null;let w=asset?.width||1,h=asset?.height||1;let cr=(s.crop||[0,0,w,h]).slice();if(this.globalTest||s.source==='test'){cr=[0,0,1,1];w=h=1}let crop=[cr[0]/w,cr[1]/h,cr[2]/w,cr[3]/h];this.uniform('uCrop',crop);this.uniform('uRect',[s.x,s.y,s.w,s.h]);this.uniform('uAspect',this.view==='stage'?(s.physical?.[0]/s.physical?.[1]||s.w/s.h):(s.w/s.h));this.uniform('uSourceAspect',cr[2]/cr[3]||1);this.uniform('uRotate',s.rotation||0,'i');this.uniform('uFlipX',s.flipX?1:0,'i');this.uniform('uFlipY',s.flipY?1:0,'i');this.uniform('uFit',s.fit||0,'i');this.uniform('uGlobal',s.global!==false?1:0,'i');this.uniform('uBrightness',s.brightness??1);this.uniform('uEffect',s.effect??this.effect,'i');this.uniform('uSelected',this.showGuides&&this.selected===s.id?1:0,'i')}
  this.uniform('uHasTex',source?1:0,'i');gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture(source));this.uniform('uTexture',0,'i');gl.drawArrays(gl.TRIANGLES,0,b.count)
 }
 lightUniforms(time){let pos=[],dir=[],colors=[],cones=[];for(let i=0;i<16;i++){let l=this.lights[i],p=l?.pos||[0,20,0],target=l?.target?.slice()||[0,0,0];if(l?.sweep){let phase=time*(l.speed||.5)+(l.phase||0);target[0]+=Math.sin(phase)*this.size.width*.25;target[2]+=Math.cos(phase*.7)*this.size.depth*.25}let direction=M.norm(M.sub(target,p));pos.push(...p);dir.push(...direction);let mult=1;if(l&&l.enabled){let fx=l.fx||'steady',depth=l.fxDepth??.55,spd=l.fxSpeed??2.2;if(fx==='pulse'){mult=(1-depth)+(0.5+0.5*Math.sin(time*spd+(l.phase||0)))*depth*2}else if(fx==='strobe'){mult=(Math.sin(time*spd*Math.PI*2+(l.phase||0))>0?1:Math.max(.02,1-depth))}else if(fx==='build'){let cyc=((time%(state.duration||12))/Math.max(.001,(state.duration||12)));mult=1+cyc*Math.max(.05,depth*2)}mult*=l.boost??1}colors.push(...(l&&l.enabled?hexrgb(l.color).map(v=>v*l.power*mult):[0,0,0]));cones.push(Math.cos((l?.angle||20)*Math.PI/180));if(l){l._direction=direction;l._target=target;l._mult=mult}}this.uniform('uLightPos[0]',pos,'3a');this.uniform('uLightDir[0]',dir,'3a');this.uniform('uLightColor[0]',colors,'3a');this.uniform('uLightCone[0]',cones,'1a')}
 makeBeam(light){let p=light.pos,d=light._direction||[0,-1,0],length=Math.min(this.size.width*1.1,Math.hypot(...M.sub(light._target||light.target,p))+3),radius=Math.tan(light.angle*Math.PI/180)*length*.55;let right=M.norm(M.cross(d,Math.abs(d[1])>.95?[1,0,0]:[0,1,0])),up=M.cross(right,d),pos=[],uv=[];for(let i=0;i<32;i++){let a=i/32*Math.PI*2,b=(i+1)/32*Math.PI*2;let r1=M.add(M.mul(right,Math.cos(a)),M.mul(up,Math.sin(a))),r2=M.add(M.mul(right,Math.cos(b)),M.mul(up,Math.sin(b))),end=M.add(p,M.mul(d,length));let pts=[M.add(p,M.mul(r1,.07)),M.add(end,M.mul(r1,radius)),M.add(end,M.mul(r2,radius)),M.add(p,M.mul(r1,.07)),M.add(end,M.mul(r2,radius)),M.add(p,M.mul(r2,.07))];pos.push(...pts.flat());uv.push(0,0,0,1,1,1,0,0,1,1,1,0)}let mesh=makeMesh('beam',pos,uv,null,{color:[...hexrgb(light.color),1]});return mesh}
 render(time=0,{width=null,height=null}={}){let gl=this.gl;this.frame++;let w=width||Math.round(this.canvas.clientWidth*Math.min(devicePixelRatio,1.25)*(this.previewScale||1)),h=height||Math.round(this.canvas.clientHeight*Math.min(devicePixelRatio,1.25)*(this.previewScale||1));w=Math.max(1,w);h=Math.max(1,h);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}gl.viewport(0,0,w,h);gl.clearColor(.085,.10,.135,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);this.uniform('uTime',time);this.uniform('uAmbient',this.settings.ambient);this.uniform('uExposure',this.settings.exposure);this.uniform('uHaze',this.settings.haze);this.uniform('uAccent',hexrgb(this.accent));this.uniform('uMaster',[this.master.width,this.master.height]);this.lightUniforms(time);
  if(this.view==='stage'){this.updateAnimatedMeshes(time);let c=this.camera;this.eye=M.add(c.target,[Math.sin(c.yaw)*Math.cos(c.pitch)*c.distance,Math.sin(c.pitch)*c.distance,Math.cos(c.yaw)*Math.cos(c.pitch)*c.distance]);let near=Math.max(.001,c.distance/2500),far=Math.max(500,c.distance*10);this.vp=M.mm(M.perspective(clamp(c.fov||45,20,80)*Math.PI/180,w/h,near,far),M.lookAt(this.eye,c.target));this.uniform('uVP',this.vp,'m');this.uniform('uEye',this.eye);this.draw(this.floor);for(let mesh of this.stageDrawMeshes())if(!mesh.hidden)this.draw(mesh);for(let mesh of this.fixtureMeshes)this.draw(mesh);if(this.drawCast)this.drawCast(time);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-2,-2);for(let s of this.surfaces)if(s.enabled!==false)this.draw(s.mesh,1,s);gl.disable(gl.POLYGON_OFFSET_FILL);
   if(this.settings.beam>0){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);for(let l of this.lights){if(!l.enabled||l.power<=0)continue;let mesh=this.makeBeam(l);this.draw(mesh,2,null,Math.min(.35,this.settings.beam*.20*Math.max(0,l.power/4.5)*(l._mult??1)));}gl.depthMask(true);gl.disable(gl.BLEND)}
  }else{let selected=this.surfaces.find(s=>s.id===this.selected),solo=this.view==='solo'&&selected,ww=solo?selected.w:this.master.width,hh=solo?selected.h:this.master.height,scale=Math.min(w/ww,h/hh)*(this.mapExact?1:.86),visibleW=w/scale,visibleH=h/scale;this.mapTransform={left:(w-ww*scale)/2,top:(h-hh*scale)/2,scale,ww,hh};this.vp=M.ortho(-(visibleW-ww)/2,ww+(visibleW-ww)/2,hh+(visibleH-hh)/2,-(visibleH-hh)/2,-10,10);this.uniform('uVP',this.vp,'m');this.uniform('uEye',[0,0,10]);for(let s of(solo?[selected]:this.mapSurfaces())){if(s.enabled===false)continue;let mesh=this.flatSurfaceMesh(s,!!solo);this.draw(mesh,1,s)}}return this.canvas
 }
 setModel(meshes){for(let t of this.texCache.values())this.gl.deleteTexture(t.tex);this.texCache.clear();for(let x of this.flatCache.values())this.releaseMesh(x.mesh);this.flatCache.clear();for(let s of this.surfaces)this.releaseMesh(s.mesh);for(let m of this.stage)this.releaseMesh(m);for(let m of this.fixtureMeshes)this.releaseMesh(m);this.stage=meshes;this.fixtureMeshes=[];let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let mesh of meshes){for(let i=0;i<3;i++){min[i]=Math.min(min[i],mesh.bounds.min[i]);max[i]=Math.max(max[i],mesh.bounds.max[i])}}if(!meshes.length){min=[-9,0,-4];max=[9,8,4]}let shift=[-(min[0]+max[0])/2,-min[1],-(min[2]+max[2])/2];for(let mesh of meshes){transformMesh(mesh,M.translate(shift));if(mesh._gltfAnim?.sceneAnim)mesh._gltfAnim.sceneAnim.modelShift=shift.slice()}let sz=M.sub(max,min);this.size={width:Math.max(.1,sz[0]),height:Math.max(.1,sz[1]),depth:Math.max(.1,sz[2])};this.camera.target=[0,sz[1]*.45,0];this.fit();return shift}
 fit(){this.camera.distance=Math.max(this.size.width,this.size.height*1.7,this.size.depth)*1.15;this.camera.yaw=.13;this.camera.pitch=.23}
 cameraPreset(name){this.fit();if(name==='front'){this.camera.yaw=0;this.camera.pitch=.035}else if(name==='top'){this.camera.yaw=0;this.camera.pitch=Math.PI/2-.001}else if(name==='side'){this.camera.yaw=Math.PI/3;this.camera.pitch=.23}else if(name==='iso'){this.camera.yaw=.5;this.camera.pitch=.35}}
 rebuildFixtures(){for(let m of this.fixtureMeshes)this.releaseMesh(m);this.fixtureMeshes=[];let scale=this.size.width/18;for(let l of this.lights){let p=l.pos;this.fixtureMeshes.push(boxMesh('Moving head base',M.add(p,[0,.15*scale,0]),[.5*scale,.18*scale,.36*scale],[.12,.14,.18,1]));this.fixtureMeshes.push(boxMesh('Moving head',p,[.3*scale,.32*scale,.3*scale],[.2,.21,.25,1]))}}
 pick(x,y,includeLED=true){if(!this.vp)return null;let rect=this.canvas.getBoundingClientRect(),nx=(x-rect.left)/rect.width*2-1,ny=1-(y-rect.top)/rect.height*2,inv=M.inverse(this.vp),o=M.point(inv,[nx,ny,-1]),end=M.point(inv,[nx,ny,1]),d=M.norm(M.sub(end,o)),nearest=null;let arr=[...this.stage.map(m=>({mesh:m}))];if(includeLED)arr.push(...this.surfaces.map(s=>({mesh:s.mesh,surface:s})));for(let item of arr){let m=item.mesh;if(m.hidden||!M.rayBox(o,d,m.bounds))continue;for(let i=0;i<m.p.length;i+=9){let a=Array.from(m.p.slice(i,i+3)),b=Array.from(m.p.slice(i+3,i+6)),c=Array.from(m.p.slice(i+6,i+9)),dist=M.rayTri(o,d,a,b,c);if(dist!==null&&(!nearest||dist<nearest.distance-1e-6||(item.surface&&Math.abs(dist-nearest.distance)<1e-4))){let normal=M.norm(M.cross(M.sub(b,a),M.sub(c,a)));if(M.dot(normal,d)>0)normal=M.mul(normal,-1);nearest={...item,triangle:i/9,distance:dist,point:M.add(o,M.mul(d,dist)),normal}}}}return nearest}
 project(p){if(!this.vp)return null;let q=M.point(this.vp,p);return{x:(q[0]*.5+.5)*this.canvas.clientWidth,y:(.5-q[1]*.5)*this.canvas.clientHeight,z:q[2]}}
 bindOrbit(){let down=null,touch2=null;this.canvas.addEventListener('contextmenu',e=>e.preventDefault());this.canvas.addEventListener('pointerdown',e=>{if(this.view!=='stage'||touch2)return;down={x:e.clientX,y:e.clientY,ox:e.clientX,oy:e.clientY,button:e.button,shift:e.shiftKey};this.canvas.setPointerCapture(e.pointerId)});this.canvas.addEventListener('pointermove',e=>{if(!down||touch2||this.view!=='stage'||this.cameraLocked)return;let dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(e.clientX-down.ox,e.clientY-down.oy)<4)return;this._fitOnResize=false;if(state.orbit){state.orbit=false;updateStableControls();}let c=this.camera;if(down.button===2||down.shift){let right=[Math.cos(c.yaw),0,-Math.sin(c.yaw)];c.target=M.add(c.target,M.mul(right,-dx*c.distance*.0015));c.target[1]+=dy*c.distance*.0015}else{c.yaw-=dx*.006;c.pitch=clamp(c.pitch+dy*.006,-.15,Math.PI/2-.005)}down.x=e.clientX;down.y=e.clientY;this.onCameraChange()});this.canvas.addEventListener('pointerup',e=>{if(down&&!touch2&&Math.hypot(e.clientX-down.ox,e.clientY-down.oy)<5&&e.button===0)this.onClick?.(e);down=null});this.canvas.addEventListener('pointercancel',()=>down=null);this.canvas.addEventListener('lostpointercapture',()=>down=null);window.addEventListener('blur',()=>{down=null;touch2=null});this.canvas.addEventListener('touchstart',e=>{if(this.view!=='stage'||this.cameraLocked)return;if(e.touches.length===2){down=null;let a=e.touches[0],b=e.touches[1];touch2={mx:(a.clientX+b.clientX)*.5,my:(a.clientY+b.clientY)*.5,dist:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1}}},{passive:true});this.canvas.addEventListener('touchmove',e=>{if(!touch2||e.touches.length!==2||this.view!=='stage'||this.cameraLocked)return;e.preventDefault();let a=e.touches[0],b=e.touches[1],mx=(a.clientX+b.clientX)*.5,my=(a.clientY+b.clientY)*.5,dist=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1,dx=mx-touch2.mx,dy=my-touch2.my,ratio=touch2.dist/dist;this._fitOnResize=false;if(state.orbit){state.orbit=false;updateStableControls();}let c=this.camera,right=[Math.cos(c.yaw),0,-Math.sin(c.yaw)];c.target=M.add(c.target,M.mul(right,-dx*c.distance*.0015));c.target[1]+=dy*c.distance*.0015;c.distance=clamp(c.distance*ratio,.1,20000);touch2={mx,my,dist};this.onCameraChange()},{passive:false});this.canvas.addEventListener('touchend',e=>{if(e.touches.length<2){down=null;touch2=null;}},{passive:true});this.canvas.addEventListener('touchcancel',()=>{down=null;touch2=null;},{passive:true});this.canvas.addEventListener('wheel',e=>{if(this.view!=='stage')return;e.preventDefault();if(this.cameraLocked)return;this._fitOnResize=false;if(state.orbit){state.orbit=false;updateStableControls();}this.camera.distance=clamp(this.camera.distance*Math.exp(e.deltaY*.001),.1,20000);this.onCameraChange()},{passive:false})}
 dispose(){for(let[id,b]of this.buffers){for(let buf of b.buffers)this.gl.deleteBuffer(buf);this.gl.deleteVertexArray(b.vao)}for(let t of this.texCache.values())this.gl.deleteTexture(t.tex);this.buffers.clear();this.texCache.clear()}
}
