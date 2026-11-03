/* Offline atlas export. Mediabunny/MPL-2.0; WebAV clip contract/MIT. See js/vendor/NOTICE.md. */
(function(){
 'use strict';
 try{
 const S=window.STUDIO;if(!S?.engine)return;
 let library,controller;
 function schedule(duration,fps,start=0){
  if(!Number.isFinite(duration)||duration<1||duration>120||![30,50,60].includes(fps)||!Number.isFinite(start)||start<0)throw Error('Thời lượng 1–120 giây, FPS 30/50/60 và thời gian bắt đầu ≥ 0.');
  return Array.from({length:Math.ceil(duration*fps-1e-9)},(_,i)=>({time:start+i/fps,timestamp:i/fps,duration:Math.min(1/fps,duration-i/fps)}));
 }
 function loadLibrary(){
  if(window.Mediabunny)return Promise.resolve(window.Mediabunny);
  if(!library)library=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='js/vendor/mediabunny-1.65.0.js';
   script.onload=()=>window.Mediabunny?resolve(window.Mediabunny):reject(Error('Không khởi tạo được bộ xuất video.'));
   script.onerror=()=>{script.remove();library=null;reject(Error('Không tải được bộ xuất video cục bộ.'));};document.head.appendChild(script);
  });return library;
 }
 // ponytail: serial fixed schedule only; add random-access clips when a timeline exporter needs them.
 function createVideoClip(B,asset,frames){
  let input,iterator,index=0,destroyed=false;
  const ready=(async()=>{
   if(!(asset.file instanceof Blob))throw Error('Video '+asset.name+': hãy nhập lại file video cục bộ để xuất offline.');
   input=new B.Input({source:new B.BlobSource(asset.file),formats:B.ALL_FORMATS});
   const track=await input.getPrimaryVideoTrack();if(!track||!await track.canDecode())throw Error('Không giải mã được video '+asset.name+'.');
   const duration=await track.computeDuration();if(!Number.isFinite(duration)||duration<=0)throw Error('Video không có thời lượng hợp lệ.');
   const times=frames.map(f=>asset.element.loop?f.time%duration:Math.min(f.time,Math.max(0,duration-.000001)));
   const sink=new B.CanvasSink(track,{width:asset.width,height:asset.height,fit:'fill',poolSize:1});
   iterator=sink.canvasesAtTimestamps(times);return {duration};
  })();
  return {ready,async tick(time){
   await ready;if(destroyed)throw Error('Clip đã đóng.');
   if(index>=frames.length)return {video:null,state:'done'};
   if(time!==Math.round(frames[index].time*1e6))throw Error('Sai thứ tự khung hình offline.');
   const next=await iterator.next();index++;if(!next.value)throw Error('Video thiếu khung hình tại thời gian yêu cầu.');
   return {video:next.value.canvas,state:'success'};
  },async destroy(){
   if(destroyed)return;destroyed=true;
   try{await ready;}catch{}try{await iterator?.return();}finally{input?.dispose();}
  }};
 }
 function cancel(){controller?.abort();}
 async function exportAtlas(page,{duration=10,fps=30,start=S.state.time,format='webm',signal,onProgress}={}){
  const frames=schedule(duration,fps,start),e=S.engine,state=S.state,live=S.live;
  if(!['webm','mp4'].includes(format))throw Error('Định dạng phải là WebM hoặc MP4.');
  if(controller||state.recording||state.offlineExport)throw Error('Hãy dừng bản ghi/xuất hiện tại trước.');
  const errors=S.validateAtlas({pages:[page]});if(errors.length)throw Error(errors.join('\n'));
  if(page.width>e.maxSize||page.height>e.maxSize||page.width*page.height>8388608)throw Error('Xuất offline tối đa 8 MP và giới hạn GPU. Hãy chia cụm.');
  if(S.seq.enabled||S.seq.reactive||live.transition||live.queue||live.reactive||live.strobeHold||live.flashHold||live.flashLeft>0||S.stage10.flashUntil>performance.now())throw Error('Offline chỉ xuất look LED hiện tại. Hãy tắt Sequencer, reactive, chuyển cảnh và flash/strobe; hoặc dùng ghi realtime.');
  if(typeof VideoEncoder==='undefined'||typeof VideoDecoder==='undefined')throw Error('Trình duyệt chưa hỗ trợ WebCodecs. Hãy dùng ghi realtime hoặc Chrome/Edge mới.');
  const own=controller=new AbortController(),abort=()=>own.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  const check=()=>{if(own.signal.aborted)throw new DOMException('Đã hủy xuất video.','AbortError');};
  const original={media:e.media,time:state.time,playing:state.playing};
  const elements=[...new Set([...state.media.map(a=>a.element),live.audioTrack?.element].filter(v=>v?.pause))].map(element=>({element,paused:element.paused}));
  const clips=[],canvases=new Set();let renderer,output,source,finalized=false;
  const block=event=>{if(event.type==='keydown'&&event.key==='Escape'){cancel();event.preventDefault();event.stopImmediatePropagation();}else if(event.type==='keydown'||!event.target.closest?.('#modal')){event.preventDefault();event.stopImmediatePropagation();}};
  state.offlineExport=true;state.playing=false;elements.forEach(v=>v.element.pause());
  document.addEventListener('keydown',block,true);document.addEventListener('pointerdown',block,true);
  try{
   check();const B=await loadLibrary();check();
   let codec;for(const candidate of format==='mp4'?['avc']:['vp9','vp8']){if(await B.canEncodeVideo(candidate,{width:page.width,height:page.height,frameRate:fps,bitrate:16000000})){codec=candidate;break;}check();}
   if(!codec)throw Error('Trình duyệt không mã hóa được '+format.toUpperCase()+' ở kích thước/FPS này. Hãy giảm kích thước hoặc dùng ghi realtime.');
   e.media=new Map(original.media);
   const surfaces=page.items.map(r=>e.surfaces.find(s=>s.id===r.surfaceId));
   if(surfaces.some(s=>!s))throw Error('Một LED đã bị xóa. Hãy tính lại atlas.');
   const ids=new Set(surfaces.filter(s=>s.enabled!==false).map(s=>s.source));
   for(const id of ids){
    const asset=e.media.get(id);if(asset?.type!=='video')continue;
    const copy={...asset},clip=createVideoClip(B,asset,frames);clips.push({clip,copy});await clip.ready;check();e.media.set(id,copy);
   }
   renderer=S.createAtlasRenderer(page);
   output=new B.Output({format:format==='mp4'?new B.Mp4OutputFormat():new B.WebMOutputFormat(),target:new B.BufferTarget()});
   source=new B.CanvasSource(renderer.canvas,{codec,bitrate:16000000});output.addVideoTrack(source,{frameRate:fps});await output.start();
   for(let i=0;i<frames.length;i++){
    check();const frame=frames[i];
    for(const {clip,copy} of clips){const {video}=await clip.tick(Math.round(frame.time*1e6));check();copy.element=video;canvases.add(video);const texture=e.texCache.get(video);if(texture)texture.uploaded=false;}
    renderer.render(frame.time,{restore:false});await source.add(frame.timestamp,frame.duration);check();onProgress?.((i+1)/frames.length);
    if(i%8===0)await new Promise(resolve=>setTimeout(resolve,0));
   }
   source.close();await output.finalize();finalized=true;check();
   return new Blob([output.target.buffer],{type:format==='mp4'?'video/mp4':'video/webm'});
  }finally{
   // Nested cleanup keeps playback and the viewport recoverable even if a decoder throws on disposal.
   try{if(output&&!finalized)await output.cancel();}finally{
    try{for(const {clip} of clips)try{await clip.destroy();}catch(err){console.warn('Offline clip cleanup',err);}}finally{
     source?.close();renderer?.dispose();
     for(const canvas of canvases){const texture=e.texCache.get(canvas);if(texture)e.gl.deleteTexture(texture.tex);e.texCache.delete(canvas);}
     e.media=original.media;state.time=original.time;state.playing=original.playing;state.offlineExport=false;controller=null;
     signal?.removeEventListener('abort',abort);document.removeEventListener('keydown',block,true);document.removeEventListener('pointerdown',block,true);
     for(const v of elements)if(!v.paused)v.element.play().catch(()=>{});
     e.render(state.time);S.renderUI();
    }
   }
  }
 }
 function open(page){
  dialog('Xuất video offline',`<p>Xuất look LED hiện tại và video cục bộ, <b>không âm thanh</b>. Tắt Sequencer, reactive và chuyển cảnh trước khi xuất. Video được tính từng khung hình; không phụ thuộc tốc độ phát preview.</p><div class="pro-settings"><label>Giây<input id="atlasOfflineDuration" type="number" min="1" max="120" value="10"></label><label>FPS<select id="atlasOfflineFPS"><option>30</option><option>50</option><option>60</option></select></label><label>Định dạng<select id="atlasOfflineFormat"><option value="webm">WebM</option><option value="mp4">MP4</option></select></label></div>`,[{label:'Hủy'},{label:'Xuất offline',primary:true,close:false,action:async()=>{
   const options={duration:+$('atlasOfflineDuration').value,fps:+$('atlasOfflineFPS').value,format:$('atlasOfflineFormat').value};
   dialog('Đang xuất video offline','<p id="atlasOfflineProgress" role="status" aria-live="polite">Đang chuẩn bị…</p>',[{label:'Hủy xuất',close:false,action:cancel}]);
   const modal=$('modal'),onClose=()=>{if(!modal.open)cancel();};modal.addEventListener('close',onClose);
   try{
    const blob=await exportAtlas(page,{...options,onProgress:p=>{$('atlasOfflineProgress').textContent=Math.floor(p*100)+'%';}});
    download('ALPHA_'+page.id+'_OFFLINE.'+options.format,blob);toast('Đã xuất video offline không âm thanh.');
   }catch(err){toast(err.message,8000);}finally{modal.removeEventListener('close',onClose);modal.close();}
  }}]);
 }
 S.atlasExport={schedule,createVideoClip,exportAtlas,open,cancel};
 }catch(err){console.error('Offline atlas initialization',err);}
})();
