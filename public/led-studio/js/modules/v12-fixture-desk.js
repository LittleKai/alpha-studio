(function(){
const uiText=(vi,en)=>window.tr?window.tr(vi,en):vi;
const displayName=value=>{const labels={"Beam 2R / Siêu hẹp":"Beam 2R / ultra-narrow","Laser Beam (mô phỏng)":"Laser beam (simulated)","Sweep rộng":"Wide sweep","Sweep hẹp":"Narrow sweep","Circle chậm":"Slow circle","Circle nhanh":"Fast circle","Số 8 rộng":"Wide figure 8","Fan trái/phải":"Left/right fan","Giao nhau":"Cross","Hội tụ":"Converge","Tỏa ra":"Diverge","Đập màu":"Color hit","Màu mềm":"Soft color","Sóng cyan":"Cyan wave","Nhấn amber":"Amber burst","Nền tím":"Violet wash","Cắt sáng":"Light cut","Cuộn ngang":"Horizontal scroll","Cuộn dọc":"Vertical scroll","Di chuyển chéo":"Diagonal drift","Xoay mềm":"Soft rotation","Gương đối xứng":"Symmetrical mirror","Lệch RGB":"RGB split","Giật nhịp":"Rhythmic jitter","Zoom nhấn":"Zoom hit","Lắc qua lại":"Sway","Nhịp thở":"Breathing","Nhún theo beat":"Beat pulse","Flash nhấn":"Flash hit","Neon chuyển":"Neon motion","Tổng kết":"Finale","Trắng":"White"};return uiText(value,labels[value]||value);};

const S=window.STUDIO; if(!S)return;
const N={saved:[],category:'beam',pan:0,tilt:-25,master:1};S.pro126=N;
const safe=(x)=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $id=id=>document.getElementById(id);
function keep(){if(engine?.lights)N.saved=engine.lights.map(l=>({...l,pos:[...l.pos],target:[...l.target]}));}
function current(){return engine.lights.find(l=>l.id===state.selectedLight)||engine.lights[0]||null;}
const types={beam:{name:'Beam',angle:7,power:7,color:'#dbeeff'},spot:{name:'Spot / Profile',angle:16,power:5.5,color:'#f9e8cb'},wash:{name:'Wash',angle:38,power:3.8,color:'#93d8ff'},par:{name:'LED PAR',angle:30,power:3.6,color:'#ad7eff'},blinder:{name:'Blinder',angle:43,power:8,color:'#ffe4ad'},follow:{name:'Follow Spot',angle:11,power:6,color:'#fff4db'},pixel:{name:'Pixel Bar',angle:26,power:3.2,color:'#58e8ff'},strobe:{name:'Strobe',angle:32,power:6,color:'#f9fdff'}};
function aim(l,pan,tilt){const p=pan*Math.PI/180,t=tilt*Math.PI/180,d=Math.max(1,Math.hypot(...M.sub(l.target,l.pos)));l.pan126=pan;l.tilt126=tilt;l.target=[l.pos[0]+Math.sin(p)*Math.cos(t)*d,l.pos[1]+Math.sin(t)*d,l.pos[2]+Math.cos(p)*Math.cos(t)*d];}
function aimAngles(l){if(Number.isFinite(l.pan126)&&Number.isFinite(l.tilt126))return [l.pan126,l.tilt126];let dx=l.target[0]-l.pos[0],dy=l.target[1]-l.pos[1],dz=l.target[2]-l.pos[2];return [Math.atan2(dx,dz)*180/Math.PI,Math.atan2(dy,Math.hypot(dx,dz))*180/Math.PI];}
function addFixture(kind){if(!engine)return; if(engine.lights.length>=16){toast(uiText("Preview giới hạn 16 đèn.","Preview is limited to 16 lights."));return;}const spec=types[kind];if(!spec)return;checkpoint();let b=engine.stageBounds||{center:[0,1,0],min:[-5,0,-5],max:[5,5,5]};let n=engine.lights.length;let pos=[b.center[0]+(n%8-3.5)*Math.max(.6,engine.size.width/10),b.max[1]-.3,b.center[2]-Math.max(1,engine.size.depth*.25)];const l={id:'fx126_'+Date.now()+'_'+n,name:spec.name+' '+(n+1),fixtureType126:kind,pos,target:[b.center[0],b.min[1]+1,b.center[2]],color:spec.color,power:spec.power,angle:spec.angle,enabled:true,sweep:false,speed:.5,phase:n*.3,boost:1,fx:'steady',fxDepth:.5,fxSpeed:2};engine.lights.push(l);state.selectedLight=l.id;engine.rebuildFixtures();renderUI();toast(uiText("Đã thêm ","Added ")+spec.name+uiText(". Chỉnh vị trí X/Y/Z trong tab đèn.",". Adjust X/Y/Z in the lighting tab."));}
const variants=[['Sweep rộng','move_sweep',8,75,18],['Sweep hẹp','move_sweep',2,15,7],['Circle chậm','move_circle',16,25,18],['Circle nhanh','move_circle',2,45,28],['Số 8 rộng','move_figure8',8,65,27],['Fan trái/phải','move_fan',4,60,15],['Giao nhau','move_cross',4,40,20],['Ballyhoo','move_ballyhoo',2,70,28],['Spiral','move_spiral',4,48,28],['Hội tụ','move_converge',8,45,21],['Tỏa ra','move_diverge',8,60,25],['Tilt wave','move_tilt',4,5,48],['Pulse 2 beat','dim_pulse',2,30,18],['Chase 1 beat','dim_chase',1,30,18],['Chase 1/2 beat','dim_chase',.5,30,18],['Heartbeat','dim_heartbeat',4,30,18],['Comet','dim_comet',2,30,18],['Build climax','dim_build',8,30,18],['Sparkle','dim_sparkle',2,30,18],['RGB Rainbow','color_rainbow',8,30,18],['Color Chase','color_chase',2,30,18],['Gobo Spin','gobo_spokes',4,30,18],['Gobo Star','gobo_star',8,30,18],['Logo Rotate','gobo_logo',8,30,18]];
function addFX(v){if(!seq?.tracks)return;try{let start=state.time||0;const spec=fxPreset9(v[1]);if(!spec){toast(uiText("FX không khả dụng trong bản này","FX is unavailable in this version"));return;}const tr=track10('light','all','LIGHT / '+spec.channel.toUpperCase());const length=Math.min(8,Math.max(.1,state.duration-start));const p=validFX9({beats:v[2],pan:v[3],tilt:v[4],channel:spec.channel,phase:360,clock:'music'});let c=addClip(tr.id,{name:v[0],source:v[1],start,duration:length,fx9:p,loop:true,fade:.15});if(c){seq.enabled=true;renderSequence();toast(uiText("Đã thêm cue ","Added cue ")+v[0]+uiText(" vào timeline tại "," to the timeline at ")+start.toFixed(2)+'s');}}catch(e){toast(e.message);}}
function openPanel(title,body,setup){dialog(title,'<div class="pro126-scroll">'+body+'</div>',[{label:uiText("Đóng","Close")}]);setup?.();}
function openLights(){let l=current(),ang=l?aimAngles(l):[0,-20];let body='<div class="pro126-panel"><p class="pro126-hint">'+uiText("Thêm đèn thật vào sân khấu và điều khiển Pan / Tilt (ngẩng cúi). Khi kéo slider, tia đèn thay đổi ngay.","Add stage lights and adjust pan / tilt. Drag a slider to update the beam immediately.")+'</p><div class="pro126-buttons">'+Object.entries(types).map(([id,t])=>'<button data-newlight="'+id+'">+ '+displayName(t.name)+'</button>').join('')+'</div><label>'+uiText("Đèn đang chọn","Selected light")+'<select id="p126light">'+engine.lights.map(x=>'<option value="'+safe(x.id)+'" '+(l&&x.id===l.id?'selected':'')+'>'+safe(x.name)+'</option>').join('')+'</select></label><div class="pro126-grid"><label>'+uiText("Pan (độ)","Pan (degrees)")+'<input id="p126pan" type="range" min="-180" max="180" value="'+ang[0].toFixed(0)+'"><output id="p126panout">'+ang[0].toFixed(0)+'°</output></label><label>'+uiText("Tilt (độ)","Tilt (degrees)")+'<input id="p126tilt" type="range" min="-88" max="88" value="'+ang[1].toFixed(0)+'"><output id="p126tiltout">'+ang[1].toFixed(0)+'°</output></label><label>'+uiText("Góc chùm (độ)","Beam angle (degrees)")+'<input id="p126beam" type="range" min="4" max="55" value="'+(l?.angle||16)+'"></label><label>'+uiText("Power","Power")+'<input id="p126power" type="range" min="0" max="12" step=".1" value="'+(l?.power||4)+'"></label></div><div class="pro126-buttons"><button id="p126front">'+uiText("Hướng chính diện","Aim forward")+'</button><button id="p126left">'+uiText("Quét trái","Sweep left")+'</button><button id="p126right">'+uiText("Quét phải","Sweep right")+'</button></div><p class="pro126-hint">'+uiText("Pan/Tilt là hướng tương đối trong hệ tọa độ sân khấu; nếu đầu đèn thật quay trục khác, cần hiệu chuẩn orientation. Vẫn có thể chọn mặt kính đèn từ GLB.","Pan/tilt is relative to the stage coordinates. Calibrate orientation for fixtures with different axes. You can also select a GLB lens surface.")+'</p></div>';
openPanel(uiText("Fixture Library + Pan / Tilt","Fixture library and pan / tilt"),body,()=>{document.querySelectorAll('[data-newlight]').forEach(b=>b.onclick=()=>{addFixture(b.dataset.newlight);openLights();});const currentUI=()=>engine.lights.find(x=>x.id===$id('p126light')?.value)||current();$id('p126light').onchange=()=>{state.selectedLight=$id('p126light').value;let a=aimAngles(currentUI());$id('p126pan').value=a[0];$id('p126tilt').value=a[1];$id('p126beam').value=currentUI().angle;$id('p126power').value=currentUI().power;};function update(){let x=currentUI();if(!x)return;aim(x,+$id('p126pan').value,+$id('p126tilt').value);x.angle=+$id('p126beam').value;x.power=+$id('p126power').value;$id('p126panout').textContent=$id('p126pan').value+'°';$id('p126tiltout').textContent=$id('p126tilt').value+'°';}for(let id of ['p126pan','p126tilt','p126beam','p126power'])$id(id).oninput=update;$id('p126front').onclick=()=>{$id('p126pan').value=0;$id('p126tilt').value=-25;update();};$id('p126left').onclick=()=>{$id('p126pan').value=-45;update();};$id('p126right').onclick=()=>{$id('p126pan').value=45;update();};});}
function openTimeFX(){let body='<div class="pro126-panel"><p class="pro126-hint">'+uiText("24 mẫu cue: mỗi nút thêm một đoạn vào track đèn tại playhead. Các preset dùng FX engine hiện có, có thể sửa thời lượng và phase ở Timecode đèn.","24 cue presets: each button adds a clip to the lighting track at the playhead. Adjust duration and phase in Lighting timecode.")+'</p><div class="pro126-buttons">'+variants.map((v,i)=>'<button data-procue="'+i+'">'+safe(displayName(v[0]))+'</button>').join('')+'</div></div>';openPanel(uiText("Light Timecode – Extended Library","Extended lighting timecode library"),body,()=>document.querySelectorAll('[data-procue]').forEach(b=>b.onclick=()=>{addFX(variants[+b.dataset.procue]);}));}
function openVJ(){let body='<div class="pro126-panel"><p class="pro126-hint">'+uiText("Bàn VJ FX nhanh: các nút áp vào nội dung video LED, không thay đổi kích thước hoặc UV. Chọn cue trên timeline nếu muốn lưu hiệu ứng.","Quick VJ effects apply to LED video content. Size and UV stay unchanged. Select a timeline cue to save an effect.")+'</p><div class="pro126-buttons">'+[['flash','FLASH'],['blackout','BLACKOUT'],['strobe','STROBE'],['punch','PUNCH'],['rollX','ROLL X'],['rollY','ROLL Y'],['rotate','ROTATE'],['mirror','MIRROR'],['rgb','RGB SPLIT'],['invert','INVERT'],['pulse','PULSE'],['reset','RESET FX']].map(([id,name])=>'<button data-provj="'+id+'">'+name+'</button>').join('')+'</div><p class="pro126-hint">'+uiText("Lưu ý: STROBE yêu cầu bật cho phép trong bảng VJ chính. Không nên dùng chớp nhanh với người nhạy cảm ánh sáng.","Enable strobe in the main VJ panel first. Avoid rapid flashing around people sensitive to light.")+'</p></div>';openPanel(uiText("VJ Performance FX","VJ performance effects"),body,()=>document.querySelectorAll('[data-provj]').forEach(b=>b.onclick=()=>{const id=b.dataset.provj;if(id==='reset')resetFX10();else fireFX10(id,false);}));}
const oldHuman=buildHuman;
buildHuman=function(d,lite=false,pose=0){let nodes=oldHuman(d,lite,pose);if(lite||d.type==='audience')return nodes;const body=nodes.find(n=>n.name==='body'),head=nodes.find(n=>n.name==='head');if(body&&head){const skin=[...hexrgb(d.skin||'#c49372'),1],coat=[...hexrgb(d.color||'#47779b'),1];body.meshes.push(rod('Continuous neck',[0,1.35,0],[0,1.52,0],.064,.077,skin,12));body.meshes.push(ellipsoid('Collar transition',[0,1.37,0],[.15,.075,.13],coat,14,10));head.meshes.push(ellipsoid('Jaw bridge',[0,1.50,.03],[.09,.06,.07],skin,12,8));}
return nodes;};
try{rebuildCast();}catch(e){console.warn('Cast rebuild:',e)}S.openProLights126=openLights;S.openProTimeFX126=openTimeFX;S.openProVJ126=openVJ;S.version='1.2.6';
})();

(function(){
const uiText=(vi,en)=>window.tr?window.tr(vi,en):vi;
const displayName=value=>{const labels={"Beam 2R / Siêu hẹp":"Beam 2R / ultra-narrow","Laser Beam (mô phỏng)":"Laser beam (simulated)","Sweep rộng":"Wide sweep","Sweep hẹp":"Narrow sweep","Circle chậm":"Slow circle","Circle nhanh":"Fast circle","Số 8 rộng":"Wide figure 8","Fan trái/phải":"Left/right fan","Giao nhau":"Cross","Hội tụ":"Converge","Tỏa ra":"Diverge","Đập màu":"Color hit","Màu mềm":"Soft color","Sóng cyan":"Cyan wave","Nhấn amber":"Amber burst","Nền tím":"Violet wash","Cắt sáng":"Light cut","Cuộn ngang":"Horizontal scroll","Cuộn dọc":"Vertical scroll","Di chuyển chéo":"Diagonal drift","Xoay mềm":"Soft rotation","Gương đối xứng":"Symmetrical mirror","Lệch RGB":"RGB split","Giật nhịp":"Rhythmic jitter","Zoom nhấn":"Zoom hit","Lắc qua lại":"Sway","Nhịp thở":"Breathing","Nhún theo beat":"Beat pulse","Flash nhấn":"Flash hit","Neon chuyển":"Neon motion","Tổng kết":"Finale","Trắng":"White"};return uiText(value,labels[value]||value);};

'use strict';
const S=window.STUDIO;
if(!S) return;
const P={tab:'fixture',open:false,selected:null,kind:'beam',pick:null,previewFX:'move_circle',previewBaseEnabled:null,
  boosts:{led:1,ambient:1,lights:1}, liveSnapshots:[],lastOverlay:0,viewDirection:true,
  fx:{duration:8,beats:4,pan:42,tilt:26,phase:180,group:'all'},vjArmed:false};
S.pro127=P; S.version='1.2.7'; const v127brand=document.querySelector('.brand small');if(v127brand)v127brand.textContent='V12.7 / LIGHT & VJ FIX';
const id=s=>document.getElementById(s);
const safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const range=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+x)?+x:a));
const types={beam:{name:'Beam',angle:8,power:7.5,color:'#c8efff'},spot:{name:'Spot / Profile',angle:17,power:5.5,color:'#ffdbb4'},wash:{name:'Wash',angle:39,power:4.1,color:'#8fcfff'},par:{name:'LED PAR',angle:29,power:4,color:'#a38dff'},blinder:{name:'Blinder',angle:44,power:7.5,color:'#ffe1ac'},follow:{name:'Follow Spot',angle:11,power:6.5,color:'#ffffff'},pixel:{name:'Pixel Bar',angle:26,power:4,color:'#5becfb'},strobe:{name:'Strobe',angle:33,power:6.8,color:'#e4f6ff'}};
const FX=[['move_sweep','Sweep / X'],['move_tilt','Tilt Wave'],['move_circle','Circle'],['move_figure8','Figure 8'],['move_fan','Fan Open'],['move_cross','Cross X'],['move_cancan','Can Can'],['move_ballyhoo','Ballyhoo'],['move_spiral','Spiral'],['move_converge','Converge'],['move_diverge','Diverge'],['move_static','Static Aim'],['dim_pulse','Pulse Kick'],['dim_chase','Chase'],['dim_heartbeat','Heartbeat'],['dim_comet','Comet'],['dim_build','Build'],['dim_sparkle','Sparkle'],['color_rainbow','Rainbow'],['color_chase','Color Chase'],['gobo_ring','Gobo Ring'],['gobo_star','Gobo Star'],['gobo_fan','Gobo Spin'],['gobo_logo','Logo Rotate']];
const VJ=[['flash','Flash'],['blackout','Blackout'],['strobe','Strobe'],['punch','Punch'],['rollX','Roll X'],['rollY','Roll Y'],['rotate','Rotate'],['mirror','Mirror'],['rgb','RGB Split'],['invert','Invert'],['pulse','Pulse']];
const current=()=>engine?.lights?.find(l=>l.id===P.selected)||engine?.lights?.find(l=>l.id===state.selectedLight)||engine?.lights?.[0]||null;
function selectLight(l){if(!l)return;P.selected=l.id;state.selectedLight=l.id;engine.view='stage';if(!P.open)openDock('fixture');else paint();}
function azimuth(l){const d=[l.target[0]-l.pos[0],l.target[1]-l.pos[1],l.target[2]-l.pos[2]];return{pan:Math.atan2(d[0],d[2])*180/Math.PI,tilt:Math.atan2(d[1],Math.hypot(d[0],d[2]))*180/Math.PI,length:Math.max(1,Math.hypot(...d))};}
function aim(l,pan,tilt){const base=azimuth(l),a=pan*Math.PI/180,b=tilt*Math.PI/180,co=Math.cos(b);l.target=[l.pos[0]+Math.sin(a)*co*base.length,l.pos[1]+Math.sin(b)*base.length,l.pos[2]+Math.cos(a)*co*base.length];l.pan127=pan;l.tilt127=tilt;l.sweep=false;}
function applyType(l,kind){const spec=types[kind]||types.beam; l.fixtureType126=kind;l.fixtureType127=kind;l.angle=spec.angle;l.color=spec.color;l.power=spec.power;l.boost=1;l.enabled=true;l.beamLength=l.beamLength||0;engine.settings.beam=Math.max(.8,engine.settings.beam||0);engine.rebuildFixtures();}
function addFixture(kind='beam',p=null){if(engine.lights.length>=16){toast(uiText("Preview hỗ trợ tối đa 16 nguồn sáng.","Preview supports up to 16 light sources."));return null;}
 const b=engine.stageBounds,center=b?.center||[0,2,0],min=b?.min||[-8,0,-4],sz=engine.size||{width:18,height:8,depth:6};
 const n=engine.lights.length, pos=p||[center[0]+(n%8-3.5)*Math.max(.7,sz.width/11),min[1]+Math.min(Math.max(sz.height*.7,2.4),6),center[2]-Math.max(.5,sz.depth*.25)];
 const l={id:'fixture127_'+Date.now()+'_'+n,name:types[kind].name+' '+(n+1),origin:'manual',pos:[...pos],target:[center[0],min[1]+1.25,center[2]],enabled:true,angle:types[kind].angle,power:types[kind].power,color:types[kind].color,boost:1,sweep:false,fx:'steady',fxDepth:.4,fxSpeed:2,speed:.5,phase:n*.3,fixtureType127:kind,fixtureType126:kind,fixtureSize:[.28,.34,.3],aperture:.04};
 checkpoint();engine.lights.push(l);engine.rebuildFixtures();engine.settings.beam=Math.max(.9,engine.settings.beam||0);P.selected=l.id;state.selectedLight=l.id;renderUI();selectLight(l);toast(uiText("Đã thêm ","Added ")+types[kind].name+uiText(" trên sân khấu."," on stage."));return l;
}
function matchSource(c){return engine.lights.find(l=>l.sourceKey===c.mesh?.sourceKey)||null;}
function attachCandidate(i,kind){const c=detectStageLights()[i];if(!c)return;let l=matchSource(c);
 if(!l){if(engine.lights.length>=16){toast(uiText("Đã đạt 16 đèn preview.","The preview limit of 16 lights has been reached."));return;}addDetectedLights([c]);l=matchSource(c);}
 if(l){applyType(l,kind);selectLight(l);toast(uiText("Đã gắn ","Attached ")+types[kind].name+uiText(" vào "," to ")+c.mesh.name+'.');}}
function setManualMode(){if(window.STUDIO?.lightTake132?.mode==='record'){if(lighting9.preview){lighting9.preview=null;invalidateSeq();}return;}if(seq.enabled){enableSequence(false);toast(uiText("Đã tạm dừng quyền điều khiển timecode để chỉnh Pan/Tilt trực tiếp.","Timecode control paused for manual pan/tilt adjustment."));}if(lighting9.preview){lighting9.preview=null;invalidateSeq();}}
function renderDockFrame(){let d=id('pro127dock');if(!d){d=document.createElement('aside');d.id='pro127dock';d.hidden=true;const parent=document.querySelector('.right-panel');parent?.appendChild(d);}return d;}
function makeToolbar(){const old=id('pro126bar');if(old)old.remove();const host=document.querySelector('.main-panel');if(!host)return;let bar=id('pro127bar');if(!bar){bar=document.createElement('div');bar.id='pro127bar';const anchor=host.querySelector('.navigation-strip')||host.querySelector('.view-toolbar');anchor?.after(bar);}
 bar.innerHTML=`<button data-pro127="fixture" ${P.open&&P.tab==='fixture'?'class="selected"':''}>${uiText("+ Đèn / Nhận diện","+ Lights / Detect")}</button><button data-pro127="fx" ${P.open&&P.tab==='fx'?'class="selected"':''}>${uiText("Timecode đèn · 24 FX","Lighting timecode · 24 FX")}</button><button data-pro127="vj" ${P.open&&P.tab==='vj'?'class="selected"':''}>${uiText("VJ FX Live","Live VJ effects")}</button><button data-pro127="bright" ${P.open&&P.tab==='bright'?'class="selected"':''}>${uiText("Tăng sáng","Brightness")}</button><span class="bar-state" id="pro127summary">${engine.lights.length}${uiText(" LIGHTS · "," lights · ")}${engine.surfaces.length} LED</span>`;
 bar.querySelectorAll('button[data-pro127]').forEach(btn=>btn.onclick=()=>openDock(btn.dataset.pro127));
}
function openDock(tab){if(state.presenting){toast(uiText("Về chỉnh sửa để dùng bảng FX.","Return to editing to use the FX panel."));return;}if(P.pick)cancelPick();
 if(document.body.classList.contains('lift-dock-open')) id('liftClose124')?.click();
 P.tab=tab;P.open=true;document.body.classList.add('pro127-dock-open');const d=renderDockFrame();d.hidden=false;paint();makeToolbar();engine.view='stage';}
function closeDock(){P.open=false;cancelPick();document.body.classList.remove('pro127-dock-open');const d=id('pro127dock');if(d)d.hidden=true;makeToolbar();}
function header(title,desc){return `<header><div><strong>${title}</strong><small>${desc}</small></div><button class="pro127-close" id="pro127close" title="${uiText("Đóng bảng","Close panel")}"><svg class=ico aria-hidden=true><use href=#i-x></use></svg></button></header>`;}
function optFixture(l){return `<option value="${safe(l.id)}" ${current()?.id===l.id?'selected':''}>${safe(l.name)}${l.origin==='model'?' · model':''}</option>`;}
function typeOptions(kind){return Object.entries(types).map(([key,sp])=>`<option value="${key}" ${key===kind?'selected':''}>${displayName(sp.name)}</option>`).join('');}
function knob(key,label,value,min,max,step=1,units=''){return `<label><div class="pro127-rangeline"><span>${label}</span><output id="pro127_${key}_out">${Number(value).toFixed(step<1?1:0)}${units}</output></div><input type="range" id="pro127_${key}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;}
function fixturePanel(){const l=current(),a=l?azimuth(l):{pan:0,tilt:-25};let rows=[];try{rows=detectStageLights().slice(0,32);}catch(e){console.warn('Detect fixtures',e);}
 return `<div class="pro127-content"><section class="pro127-section"><h4>${uiText("THƯ VIỆN ĐÈN · GẮN LÊN SÂN KHẤU","Fixture library · stage placement")}</h4><div class="pro127-grid"><label>${uiText("Loại đèn","Fixture type")}<select id="pro127kind">${typeOptions(P.kind)}</select></label><label>${uiText("Chọn đèn đang có","Existing fixture")}<select id="pro127selected">${engine.lights.map(optFixture).join('')}</select></label></div><div class="pro127-actions"><button class="primary" id="pro127add">${uiText("+ Thêm đèn","+ Add fixture")}</button><button id="pro127click">${uiText("Chọn vị trí trên model","Pick a model position")}</button></div><p>${uiText("Chọn đèn trong danh sách để chỉnh. “Chọn vị trí” cho phép click trực tiếp mặt kính trên sân khấu GLB.","Select a fixture to edit. Pick a model position lets you click a lens surface on the GLB stage.")}</p></section>
 <section class="pro127-section" id="fixturePanTilt127"><h4>${uiText("Điều khiển pan / tilt trực tiếp","Direct pan / tilt control")}</h4>${l?`<div class="pro127-stat">${safe(l.name)} · ${safe(displayName(types[l.fixtureType127||l.fixtureType126]?.name||'Moving head'))}<br>${uiText("Vị trí: ","Position: ")}${l.pos.map(v=>Number(v).toFixed(2)).join(' / ')} m</div><div class="pro127-actions"><button id="pro127edit" class="primary">${uiText("Chỉnh tay","Manual control")}</button><button id="pro127time">${uiText("Theo timecode","Follow timecode")}</button><button id="pro127fit">${uiText("Căn toàn cảnh","Fit scene")}</button></div>${knob('pan',uiText("Pan / quay ngang","Pan / horizontal rotation"),Math.round(a.pan),-180,180,1,'°')}${knob('tilt',uiText("Tilt / cúi-ngẩng","Tilt / vertical rotation"),Math.round(a.tilt),-88,88,1,'°')}${knob('power',uiText("Cường độ đèn","Light intensity"),l.power||0,0,16,.1,'')}${knob('angle',uiText("Góc tia","Beam angle"),l.angle||15,4,55,1,'°')}<div class="pro127-actions"><button data-aim="left">${uiText("Quét trái","Sweep left")}</button><button data-aim="front">${uiText("Chính diện","Forward")}</button><button data-aim="right">${uiText("Quét phải","Sweep right")}</button></div>`:'<p>'+uiText("Chọn hoặc thêm một đèn trước.","Select or add a fixture first.")+'</p>'}</section>
 <section class="pro127-section"><h4>${uiText("NHẬN DIỆN ĐÈN TRONG GLB","Detect fixtures in GLB")}</h4><div class="pro127-stat">${rows.length}${uiText(" bề mặt ứng viên · đã gắn "," candidate surfaces · attached ")}${engine.lights.filter(x=>x.origin==='model'||x.origin==='gltf').length}${uiText(" · tối đa 16 đèn"," · up to 16 lights")}</div>${rows.length?rows.map((c,i)=>`<div class="pro127-light-row"><span title="${safe(c.mesh.name)}">${safe(c.mesh.name)}</span><select data-detect-kind="${i}">${typeOptions(matchSource(c)?.fixtureType127||P.kind)}</select><button data-attach="${i}" ${!!matchSource(c)?'class="active"':''}>${matchSource(c)?uiText("Chọn","Select"):uiText("Gắn","Attach")}</button></div>`).join(''):'<p>'+uiText("Không tìm thấy tên mesh đèn. Hãy dùng “Chọn vị trí trên model” và click chính xác mặt kính đèn.","No fixture mesh names found. Use Pick a model position and click the lens surface.")+'</p>'}<p>${uiText("Nhận diện dựa tên mesh/lens, cần người dùng duyệt lại vị trí. Đèn đã gắn sẽ được chọn thay vì tạo trùng.","Detection uses mesh/lens names. Check each position. Existing fixtures are selected without creating duplicates.")}</p></section></div>`;
}
function fxPanel(){const params=P.fx,selected=FX.find(x=>x[0]===P.previewFX)||FX[0], group=['all','left','right','odd','even'];return `<div class="pro127-content"><section class="pro127-section"><h4>${uiText("Chạm preset để xem tia đèn chạy ngay trên sân khấu","Select a preset to preview beams on stage")}</h4><div class="pro127-presets">${FX.map(([key,name])=>`<button data-fx127="${key}" ${P.previewFX===key?'class="active"':''}>${displayName(name)}</button>`).join('')}</div><div class="pro127-stat">${uiText("Đang chọn: ","Selected: ")}${safe(displayName(selected[1]))} · ${engine.lights.length}${uiText(" đèn · "," lights · ")}${seq.bpm} BPM</div></section>
 <section class="pro127-section"><h4>${uiText("THÔNG SỐ PHÁT THỬ / TIMECODE","Preview / timecode settings")}</h4><div class="pro127-grid"><label>${uiText("Thời lượng cue (giây)","Cue duration (seconds)")}<input type="number" id="p127dur" min="0.25" max="60" step=".25" value="${params.duration}"></label><label>${uiText("Nhóm đèn","Fixture group")}<select id="p127group">${group.map(k=>`<option value="${k}" ${params.group===k?'selected':''}>${{all:uiText("Tất cả","All"),left:uiText("Cánh trái","Left side"),right:uiText("Cánh phải","Right side"),odd:uiText("Đèn lẻ","Odd fixtures"),even:uiText("Đèn chẵn","Even fixtures")}[k]}</option>`).join('')}</select></label></div>${knob('beats',uiText("Nhịp mỗi vòng","Beats per cycle"),params.beats,.25,32,.25,'')}${knob('fxpan',uiText("Biên độ Pan","Pan amplitude"),params.pan,0,150,1,'°')}${knob('fxtilt',uiText("Biên độ Tilt","Tilt amplitude"),params.tilt,0,88,1,'°')}${knob('phase',uiText("Lệch pha giữa các đèn","Phase offset between fixtures"),params.phase,-360,720,15,'°')}<div class="pro127-actions"><button class="primary" id="p127audition">${uiText("Xem ngay","Preview now")}</button><button id="p127stop">${uiText("Dừng thử","Stop preview")}</button><button id="pro127fitfx">${uiText("Căn sân khấu","Fit stage")}</button></div><button class="primary" id="p127addcue">${uiText("+ Đặt cue vào SHOW TIMELINE","+ Add cue to show timeline")}</button><p>${uiText("Phát thử có thể tạm ngắt timeline để điều khiển trực tiếp. Sau khi thêm cue, timeline được kích hoạt và tiếp tục chạy theo thời gian thật.","Preview may pause timeline control. Adding a cue enables the timeline and resumes real-time playback.")}</p></section></div>`;}
function vjPanel(){const more=[['combo1','Punch + RGB'],['combo2','Roll + Mirror'],['combo3','Rotate + Pulse']];return `<div class="pro127-content"><section class="pro127-section"><h4>${uiText("VJ trực quan – hiệu ứng chạy ngay trên LED","Live VJ effects on LED")}</h4><div class="pro127-presets">${[...VJ,...more].map(([k,n])=>`<button data-vj127="${k}" ${stage10.fx?.[k]?'class="active"':''}>${safe(n)}</button>`).join('')}</div><div class="pro127-actions"><button id="p127vjreset">${uiText("Reset FX","Reset effects")}</button><button id="p127vjarm" ${live.strobeArmed?'class="active"':''}>${live.strobeArmed?uiText("Strobe armed","Strobe enabled"):uiText("Cho phép strobe","Enable strobe")}</button></div><p>${uiText("Flash/chớp nhanh có thể ảnh hưởng người nhạy cảm ánh sáng. Strobe chỉ hoạt động sau khi bật cho phép.","Rapid flashing can affect people sensitive to light. Enable strobe before use.")}</p></section><section class="pro127-section"><h4>${uiText("Ghi FX lên timeline","Record effects to timeline")}</h4><label>${uiText("FX đã chọn","Selected effect")}<select id="p127vjselect">${VJ.filter(([k])=>k!=='flash').map(([k,n])=>`<option value="${k}">${safe(n)}</option>`).join('')}</select></label><div class="pro127-grid"><label>${uiText("Thời lượng (s)","Duration (s)")}<input id="p127vjdur" type="number" min=".1" max="30" step=".25" value="4"></label><label>${uiText("Cường độ (0–2)","Intensity (0–2)")}<input id="p127vjgain" type="number" min=".1" max="2" step=".1" value="1"></label></div><button id="p127vjcue" class="primary">${uiText("+ Thêm VJ FX vào SHOW TIMELINE","+ Add VJ effects to show timeline")}</button><p>${uiText("FX timeline tác động nội dung LED, không thay đổi tọa độ/UV/crop.","Timeline effects change LED content while preserving coordinates, UV and crop.")}</p></section></div>`;}
function brightPanel(){return `<div class="pro127-content"><section class="pro127-section"><h4>${uiText("Ba kênh tăng sáng riêng","Three brightness channels")}</h4><p>${uiText("Điều chỉnh trực tiếp mà không thay giá trị UV, pixel map hoặc cường độ gốc của từng đèn.","Adjust preview brightness while preserving UV, pixel maps and original fixture intensity.")}</p>${knob('led',uiText("Tăng độ sáng màn LED","LED brightness"),P.boosts.led,.25,3,.05,'×')}${knob('ambient',uiText("Tăng sáng môi trường","Ambient brightness"),P.boosts.ambient,.1,3,.05,'×')}${knob('lights',uiText("Tăng sáng đèn sân khấu","Stage light brightness"),P.boosts.lights,.25,3,.05,'×')}<div class="pro127-actions"><button class="primary" id="p127brightBoost">${uiText("Tăng tất cả","Increase all")}</button><button id="p127brightReset">${uiText("Đặt lại 100%","Reset to 100%")}</button></div><div class="pro127-stat" id="pro127boostSummary">LED ${P.boosts.led.toFixed(2)}${uiText("× · Môi trường ","× · Ambient ")}${P.boosts.ambient.toFixed(2)}${uiText("× · Đèn ","× · Lights ")}${P.boosts.lights.toFixed(2)}×</div><p>${uiText("Chỉ điều chỉnh hình preview, không tăng độ sáng vật lý thực tế của tấm LED hoặc máy chiếu.","Changes preview brightness only. Physical LED panels and projectors are unaffected.")}</p></section></div>`;}
function paint(){if(!P.open)return;const d=renderDockFrame();d.hidden=false;let title={fixture:uiText("Đèn sân khấu / Pan–Tilt","Stage lights / pan–tilt"),fx:uiText("Timecode Lighting FX","Lighting timecode effects"),vj:uiText("VJ Live FX","Live VJ effects"),bright:uiText("Cân sáng sân khấu","Stage brightness")}[P.tab];d.innerHTML=header(title,uiText("Theo dõi trực tiếp trên sân khấu 3D","Live preview on the 3D stage"))+(P.tab==='fixture'?fixturePanel():P.tab==='fx'?fxPanel():P.tab==='vj'?vjPanel():brightPanel());id('pro127close').onclick=closeDock;
 if(P.tab==='fixture')bindFixture();if(P.tab==='fx')bindFX();if(P.tab==='vj')bindVJ();if(P.tab==='bright')bindBright();
}
function bindFixture(){id('pro127kind').onchange=e=>P.kind=e.target.value;id('pro127selected').onchange=e=>{P.selected=e.target.value;state.selectedLight=P.selected;paint();};id('pro127add').onclick=()=>addFixture(P.kind);id('pro127click').onclick=()=>beginPick();
 const l=current();if(l){const update=()=>{setManualMode();let v=current();if(!v)return;aim(v,+id('pro127_pan').value,+id('pro127_tilt').value);v.power=+id('pro127_power').value;v.angle=+id('pro127_angle').value;for(const [q,u] of [['pan','°'],['tilt','°'],['power',''],['angle','°']])id('pro127_'+q+'_out').textContent=id('pro127_'+q).value+u;};for(const q of ['pan','tilt','power','angle'])id('pro127_'+q).oninput=update;id('pro127edit').onclick=()=>{setManualMode();toast(uiText("Chế độ điều chỉnh tay: kéo Pan và Tilt để xem tia ngay.","Manual mode: drag pan and tilt to preview the beam."));};id('pro127fit').onclick=()=>{cameraPreset8('front','stage');engine.showGuides=false;};id('pro127time').onclick=()=>{lighting9.preview=null;invalidateSeq();enableSequence(true);toggleSequence(true);setPlaying(true);toast(uiText("Theo dõi cue timecode: tia sáng chuyển động theo timeline.","Following timecode cues: beams follow the timeline."));};document.querySelectorAll('[data-aim]').forEach(b=>b.onclick=()=>{setManualMode();id('pro127_pan').value=({left:-55,front:0,right:55})[b.dataset.aim];id('pro127_tilt').value=-35;update();});}
 document.querySelectorAll('[data-attach]').forEach(b=>b.onclick=()=>{const n=+b.dataset.attach,k=document.querySelector('[data-detect-kind="'+n+'"]')?.value||P.kind;attachCandidate(n,k);paint();});}
function cancelPick(){if(!P.pick)return;P.pick=null;const banner=id('pro127pickbanner');if(banner)banner.hidden=true;}
function beginPick(){if(!engine){return;}P.pick={kind:P.kind};engine.view='stage';let b=id('pro127pickbanner');if(!b){b=document.createElement('div');b.id='pro127pickbanner';id('viewport').appendChild(b);}b.textContent=uiText("Click chính xác mặt kính hoặc vị trí đèn trên sân khấu. ESC để hủy.","Click a lens surface or fixture position on stage. Esc to cancel.");b.hidden=false;}
function addFromPick(e){if(!P.pick)return;const hit=engine.pick(e.clientX,e.clientY,false);const kind=P.pick.kind;cancelPick();if(!hit||!hit.mesh){toast(uiText("Không chọn được mặt model. Hãy click lên bề mặt 3D.","No model surface selected. Click a 3D surface."));return;}const l=addFixture(kind,hit.point);if(l){l.origin='model';l.sourceKey=hit.mesh.sourceKey;l.sourceMeshName=hit.mesh.name;l.sourcePoint=M.point(engine.coordinates.inverse,hit.point);engine.rebuildFixtures();paint();} }
function bindPointerPick(){const canvas=id('glcanvas');canvas.addEventListener('pointerup',e=>{if(!P.pick||e.button!==0)return;e.stopImmediatePropagation();e.preventDefault();addFromPick(e);},true);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&P.pick){cancelPick();}},true);}
function fxParams(){return {beats:range(P.fx.beats,.25,32),pan:range(P.fx.pan,0,150),tilt:range(P.fx.tilt,0,88),phase:range(P.fx.phase,-360,720),clock:'music',spread:1,panCenter:0,tiltCenter:0};}
function audition(){if(!engine.lights.length){toast(uiText("Hãy thêm hoặc nhận diện đèn trước.","Add or detect fixtures first."));return;}engine.view='stage';engine.settings.beam=Math.max(1.3,engine.settings.beam||0);if(P.previewBaseEnabled===null)P.previewBaseEnabled=seq.enabled;
 auditionFX9(P.previewFX,fxParams());toast(uiText("Đang xem trước ","Previewing ")+(FX.find(v=>v[0]===P.previewFX)?.[1]||P.previewFX)+uiText(" trên sân khấu."," on stage."));}
function stopAudition(){stopAudition9();if(P.previewBaseEnabled!==null){enableSequence(P.previewBaseEnabled);P.previewBaseEnabled=null;}setPlaying(false);}
function bindFX(){document.querySelectorAll('[data-fx127]').forEach(b=>b.onclick=()=>{P.previewFX=b.dataset.fx127;paint();audition();});id('p127audition').onclick=audition;id('p127stop').onclick=stopAudition;id('pro127fitfx').onclick=()=>{cameraPreset8('front','stage');engine.showGuides=false;};for(const [key,out] of [['beats','beats'],['fxpan','pan'],['fxtilt','tilt'],['phase','phase']])id('pro127_'+key).oninput=e=>{P.fx[out]=+e.target.value;id('pro127_'+key+'_out').textContent=e.target.value+(key==='fxpan'||key==='fxtilt'||key==='phase'?'°':'');if(lighting9.preview){lighting9.preview.fx9=validFX9(fxParams());}};
 id('p127dur').onchange=e=>P.fx.duration=range(e.target.value,.25,60);id('p127group').onchange=e=>P.fx.group=e.target.value;
 id('p127addcue').onclick=()=>{if(!engine.lights.length){toast(uiText("Chưa có đèn để chạy cue.","Add fixtures before running a cue."));return;}const spec=fxPreset9(P.previewFX);if(!spec){toast(uiText("Preset không khả dụng.","Preset unavailable."));return;}try{const t=range(state.time,0,599.95),dur=range(P.fx.duration,.25,60);if(t+dur>state.duration)state.duration=Math.min(600,t+dur);lighting9.preview=null;P.previewBaseEnabled=null;invalidateSeq();const tr=track10('light',P.fx.group,'Light / '+spec.channel.toUpperCase());const clip=addClip(tr.id,{source:spec.id,name:spec.name,start:t,duration:Math.min(dur,state.duration-t),fx9:validFX9({...fxParams(),channel:spec.channel}),fade:.15,gain:1,loop:true});if(!clip)throw Error(uiText("Không tạo được cue","Could not create cue"));engine.settings.beam=Math.max(1.25,engine.settings.beam||0);enableSequence(true);toggleSequence(true);setPlaying(true);toast(uiText("Đã đặt cue ","Placed cue ")+spec.name+uiText(" vào timeline tại "," to the timeline at ")+t.toFixed(2)+'s.');}catch(err){console.error(err);toast(uiText("Không tạo cue: ","Could not create cue: ")+err.message);}};}
function fireVJ(key){if(key==='combo1'){for(const k of ['punch','rgb'])fireFX10(k,false);}else if(key==='combo2'){for(const k of ['rollX','mirror'])fireFX10(k,false);}else if(key==='combo3'){for(const k of ['rotate','pulse'])fireFX10(k,false);}else if(key==='punch'){live.zoom=live.zoom===1?1.25:1;fireFX10('pulse',false);}else fireFX10(key,false);paint();}
function bindVJ(){document.querySelectorAll('[data-vj127]').forEach(b=>b.onclick=()=>fireVJ(b.dataset.vj127));id('p127vjreset').onclick=()=>{resetFX10();paint();};id('p127vjarm').onclick=()=>{live.strobeArmed=!live.strobeArmed;seq.strobe=live.strobeArmed;if(!live.strobeArmed)live.strobeHold=false;paint();};
 id('p127vjcue').onclick=()=>{try{const fx=id('p127vjselect').value,dur=range(id('p127vjdur').value,.1,30),g=range(id('p127vjgain').value,.1,2),t=range(state.time,0,599.9);if(t+dur>state.duration)state.duration=Math.min(600,t+dur);const tr=track10('vj','all','VJ FX');const c=addClip(tr.id,{source:fx,name:'VJ / '+fx,start:t,duration:Math.min(dur,state.duration-t),gain:g,loop:true,fade:.05});if(!c)throw Error(uiText("Không tạo được VJ cue","Could not create VJ cue"));enableSequence(true);toggleSequence(true);setPlaying(true);toast(uiText("Đã thêm VJ ","Added VJ ")+fx+uiText(" vào timeline."," to the timeline."));}catch(e){toast(uiText("Lỗi thêm VJ FX: ","Could not add VJ effect: ")+e.message);}};}
function boostSummary(){const d=id('pro127boostSummary');if(d)d.textContent=`LED ${P.boosts.led.toFixed(2)}${uiText("× · Môi trường ","× · Ambient ")}${P.boosts.ambient.toFixed(2)}${uiText("× · Đèn ","× · Lights ")}${P.boosts.lights.toFixed(2)}×`;}
function bindBright(){for(const k of ['led','ambient','lights'])id('pro127_'+k).oninput=e=>{P.boosts[k]=range(e.target.value,.1,3);id('pro127_'+k+'_out').textContent=P.boosts[k].toFixed(1)+'×';boostSummary();};id('p127brightBoost').onclick=()=>{P.boosts.led=range(P.boosts.led+.25,.25,3);P.boosts.ambient=range(P.boosts.ambient+.25,.1,3);P.boosts.lights=range(P.boosts.lights+.25,.25,3);paint();};id('p127brightReset').onclick=()=>{P.boosts={led:1,ambient:1,lights:1};paint();};}
// Uniform interception changes presentation intensity only; leaves LED surfaces, UV, native fixture levels untouched.
const nativeUniform=StageEngine.prototype.uniform;
StageEngine.prototype.uniform=function(name,value,...rest){if(this===engine){if(name==='uBrightness'||name==='uPrevBrightness')value=(Number(value)||0)*P.boosts.led;
 else if(name==='uAmbient')value=(Number(value)||0)*P.boosts.ambient;
 else if(name==='uLightColor[0]'){const gain=P.boosts.lights;if(gain!==1)value=Float32Array.from(value,v=>v*gain);} }
 return nativeUniform.call(this,name,value,...rest);};
const priorDraw=StageEngine.prototype.draw;
StageEngine.prototype.draw=function(mesh,mode=0,s=null,o=1){if(this===engine&&mode===2)o=Math.min(.94,o*P.boosts.lights);return priorDraw.call(this,mesh,mode,s,o);};
const oldUniforms=StageEngine.prototype.lightUniforms;
StageEngine.prototype.lightUniforms=function(t){let r=oldUniforms.call(this,t);if(this===engine){P.liveSnapshots=this.lights.map(l=>({id:l.id,name:l.name,pos:[...l.pos],target:[...(l._target||l.target)],color:l.color,enabled:l.enabled,power:(l.power||0)*(l._mult??1)}));}return r;};
function insertOverlay(){let d=id('aimOverlay127');if(!d){d=document.createElementNS('http://www.w3.org/2000/svg','svg');d.id='aimOverlay127';d.setAttribute('aria-hidden','true');id('viewport')?.appendChild(d);}return d;}
function overlayTick(t){requestAnimationFrame(overlayTick);if(!P.open||!P.viewDirection||engine?.view!=='stage'||state.presenting){const d=id('aimOverlay127');if(d&&d.childElementCount)d.replaceChildren();return;}if(t-P.lastOverlay<60)return;P.lastOverlay=t;const svg=insertOverlay(),rect=id('viewport')?.getBoundingClientRect();if(!rect?.width||!rect.height)return;svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
 const shots=P.liveSnapshots;const chosen=P.tab==='fixture'?current()?.id:null;let xml='';for(let i=0;i<shots.length;i++){const l=shots[i];if(!l.enabled||l.power<=0)continue;if(chosen&&l.id!==chosen)continue;const a=engine.project(l.pos),b=engine.project(l.target);if(!a||!b||!isFinite(a.x+b.x+a.y+b.y)||a.z>1)continue;let col=String(l.color||'#a1e8ff');if(!/^#[0-9a-f]{6}$/i.test(col))col='#a1e8ff';const x=a.x,y=a.y,xx=b.x,yy=b.y;xml+=`<circle cx="${x}" cy="${y}" r="${chosen?7:4}" fill="none" stroke="${col}" stroke-width="${chosen?2:1}"/><path d="M${x} ${y}L${xx} ${yy}" stroke="${col}" stroke-width="${chosen?2:1}" stroke-dasharray="7 4" opacity="${chosen?.88:.42}"/><circle cx="${xx}" cy="${yy}" r="${chosen?4:2}" fill="${col}"/>${chosen?`<text class="aim-label" x="${x+10}" y="${y-11}">${safe(l.name).slice(0,20)}</text>`:""}`;}
 svg.innerHTML=xml;}
const packBase=packLiveExtras;
packLiveExtras=async function(){const d=await packBase();d.pro127={version:1,boosts:{...P.boosts}};return d;};
const restoreBase=restoreLiveExtras;
restoreLiveExtras=async function(d){await restoreBase(d);const b=d?.pro127?.boosts;P.boosts={led:range(b?.led??1,.25,3),ambient:range(b?.ambient??1,.1,3),lights:range(b?.lights??1,.25,3)};if(P.open)paint();};
const snapBase=snapshot;
snapshot=function(){const s=snapBase();s.pro127={boosts:{...P.boosts}};return s;};
const undoBase=restore;
restore=function(d){undoBase(d);if(d?.pro127?.boosts)for(const k of ['led','ambient','lights'])P.boosts[k]=d.pro127.boosts[k]??1;};
function injectLightInspector(){
 if(state.step!=='lighting'||director.panel||!id('inspectorContent')||id('pro127-lightboost'))return;
 const host=id('inspectorContent'), section=document.createElement('section');section.id='pro127-lightboost';section.className='inspector-block pro127-lightboost';
 section.innerHTML=`<div class="block-title"><svg class="ico ico-lights" aria-hidden="true"><use href="#i-sun"></use></svg><span>${uiText("TĂNG SÁNG SÂN KHẤU","Stage brightness")}</span></div>
 <label>${uiText("Màn LED ","LED screen ")}<output id="p127inspectLedOut">${P.boosts.led.toFixed(2)}×</output><input type="range" id="p127inspectLed" min=".25" max="3" step=".05" value="${P.boosts.led}"></label>
 <label>${uiText("Sáng môi trường ","Ambient brightness ")}<output id="p127inspectAmbientOut">${P.boosts.ambient.toFixed(2)}×</output><input type="range" id="p127inspectAmbient" min=".1" max="3" step=".05" value="${P.boosts.ambient}"></label>
 <label>${uiText("Cường độ đèn","Light intensity")} <output id="p127inspectLightsOut">${P.boosts.lights.toFixed(2)}×</output><input type="range" id="p127inspectLights" min=".25" max="3" step=".05" value="${P.boosts.lights}"></label>
 <button type="button" class="btn small" id="p127inspectMore">${uiText("Mở bảng tăng sáng / VJ →","Open brightness / VJ panel")}</button>`;
 const target=host.querySelector('.inspector-block');if(target)target.after(section);else host.appendChild(section);
 for(const [capital,key] of [['Led','led'],['Ambient','ambient'],['Lights','lights']])id('p127inspect'+capital).oninput=e=>{P.boosts[key]=range(e.target.value,.1,3);id('p127inspect'+capital+'Out').textContent=P.boosts[key].toFixed(2)+'×';boostSummary();};
 id('p127inspectMore').onclick=()=>openDock('bright');
}
const priorRender=renderUI;
renderUI=function(){const result=priorRender();if(id('pro127summary'))id('pro127summary').textContent=engine.lights.length+uiText(" LIGHTS · "," lights · ")+engine.surfaces.length+' LED';injectLightInspector();return result;};
// V12.6 controls use modal and obscure the show. Replace their callbacks with a dock while keeping their APIs.
openLightDetection=function(){openDock('fixture');};S.openProLights126=()=>openDock('fixture');S.openProTimeFX126=()=>openDock('fx');S.openProVJ126=()=>openDock('vj');
S.openProBrightness127=()=>openDock('bright');S.getBrightness127=()=>({...P.boosts});S.getLightingSnapshots127=()=>P.liveSnapshots.map(x=>({...x}));S.attachSelectedFixture127=(kind='beam')=>addFixture(kind);S.previewLightFX127=async(kind='move_circle')=>{P.previewFX=kind;openDock('fx');audition();};

// V12.8 FIXTURE DESIGNER: camera-safe model placement, XYZ positioning, draggable scene markers and distinct light looks.
const FV128={version:'1.2.8',pick:null,drag:null,selectedLook:'white-beam',dragMode:'xz',oldLightType:null,fixtureRAF:0,lastGeometry:0,wasMoved:false,strobeConsent:false};
S.fixture128=FV128;S.version='1.2.8';const brand128=document.querySelector('.brand small');if(brand128)brand128.textContent='V12.8 / FIXTURE DESIGNER';
Object.assign(types,{
 beam2r:{name:'Beam 2R / Siêu hẹp',angle:4,power:9.5,color:'#dff6ff',aperture:.023},
 beam5r:{name:'Beam 5R / Concert',angle:6,power:9,color:'#a2dcff',aperture:.03},
 hybrid:{name:'Hybrid Beam/Spot',angle:14,power:7.2,color:'#d6ebff',aperture:.045},
 profile:{name:'Profile / Cut Light',angle:18,power:6.2,color:'#ffecd2',aperture:.028},
 fresnel:{name:'Fresnel / Soft Edge',angle:42,power:4.7,color:'#ffe1b7',aperture:.065},
 washRGB:{name:'RGBW Wash',angle:48,power:5.5,color:'#8ee9f7',aperture:.080},
 audience:{name:'Audience Wash',angle:58,power:4.3,color:'#ffe0bd',aperture:.085},
 uplight:{name:'Floor Uplight',angle:37,power:4.5,color:'#b985ff',aperture:.045},
 batten:{name:'LED Batten / Strip',angle:45,power:5,color:'#35e7e0',aperture:.080},
 sunstrip:{name:'Sunstrip / Tungsten',angle:42,power:6.5,color:'#ffd39b',aperture:.080},
 ledtube:{name:'LED Tube / Pixel',angle:55,power:4,color:'#ff79d9',aperture:.070},
 laserSim:{name:'Laser Beam (mô phỏng)',angle:2,power:5.5,color:'#59ff9a',aperture:.012}
});
// Type settings affect physical preview cone angle, source power, color and fixture proxy shape.
const prevApplyType128=applyType;
applyType=function(l,kind){prevApplyType128(l,kind);l.fixtureType128=kind;l.aperture=types[kind]?.aperture??(kind==='beam'?.025:.045);l.motion128='static';l.sweep=false;l.fx='steady';l.motionAmp128=25;l.motionSpeed128=.55;engine.rebuildFixtures();};
const prevAdd128=addFixture;
addFixture=function(kind='beam',pos=null){const l=prevAdd128(kind,pos);if(l){l.fixtureType128=kind;l.aperture=types[kind]?.aperture??.035;l.motion128='static';l.motionAmp128=25;l.motionSpeed128=.55;l.lightType128=kind;engine.rebuildFixtures();}return l;};
function selected128(){return current();}
function coordinates128(l){return {pos:[...l.pos],target:[...l.target]};}
function updatePosition128(l,p,keepAim=true){if(!l||!p?.every(Number.isFinite))return;
  const delta=M.sub(p,l.pos);l.pos=[...p];if(keepAim)l.target=M.add(l.target,delta);
  if(l.origin==='model'||l.origin==='gltf'){l.origin='placed';delete l.sourceKey;delete l.sourcePoint;delete l.sourceMeshName;}
  if(l.motion128!=='static')l.motionBase128=angleState128(l);
  const now=performance.now();if(now-FV128.lastGeometry>90){engine.rebuildFixtures();FV128.lastGeometry=now;}
}
function updateTarget128(l,target){if(!l||!target?.every(Number.isFinite))return;l.target=[...target];l.sweep=false;l.motionBase128=angleState128(l);}
function angleState128(l){const d=M.sub(l.target,l.pos),len=Math.max(.3,Math.hypot(...d));return {pan:Math.atan2(d[0],d[2])*180/Math.PI,tilt:Math.atan2(d[1],Math.hypot(d[0],d[2]))*180/Math.PI,length:len};}
function fromAngles128(l,pan,tilt,len){const pa=pan*Math.PI/180,ti=tilt*Math.PI/180,d=Math.cos(ti),r=Math.max(.3,len||angleState128(l).length);return [l.pos[0]+Math.sin(pa)*d*r,l.pos[1]+Math.sin(ti)*r,l.pos[2]+Math.cos(pa)*d*r];}
function lensShape128(kind){if(/beam|laser/i.test(kind))return 'beam';if(/wash|fresnel|par|uplight|audience/i.test(kind))return 'wash';if(/bar|batten|sunstrip|pixel|ledtube/i.test(kind))return 'bar';if(/blinder|strobe/i.test(kind))return 'flash';return 'spot';}
const prevFixtureBuild128=StageEngine.prototype.rebuildFixtures;
StageEngine.prototype.rebuildFixtures=function(){if(this!==engine)return prevFixtureBuild128.call(this);
 for(const m of this.fixtureMeshes)this.releaseMesh(m);this.fixtureMeshes=[];
 for(const l of this.lights){if(l._deleted8||l.origin==='model'||l.origin==='gltf')continue;
  const kind=l.fixtureType128||l.fixtureType127||l.fixtureType126||l.type||'beam',category=lensShape128(kind),p=l.pos,col=[...hexrgb(l.color||'#a5e1ff'),1];let meshes=[],metal=[.11,.15,.20,1],silver=[.25,.33,.40,1];
  if(category==='bar'){
   meshes.push(boxMesh('LED strip housing',M.add(p,[0,.025,0]),[.92,.13,.22],metal));
   const bulbs=[];for(let i=0;i<8;i++){const bulb=ellipsoid('LED pixel',M.add(p,[-.38+i*.108,.1,.095]),[.033,.024,.024],col,8,5);bulb.material.emissive=col.slice(0,3).map(v=>v*1.6);bulbs.push(bulb);}const em=mergeCast(bulbs,'Pixel emitters');for(const m of em)m._light128=l;meshes.push(...em);
  }else if(category==='flash'){
   meshes.push(boxMesh('Blinder casing',M.add(p,[0,0,0]),[.55,.28,.22],metal));
   const chips=[];for(let x of [-.14,.14])for(let y of [-.065,.065]){const bulb=ellipsoid('Lamp',M.add(p,[x,y,.13]),[.085,.07,.015],col,10,6);bulb.material.emissive=col.slice(0,3).map(v=>v*1.8);chips.push(bulb);}const em=mergeCast(chips,'Blinder emitters');for(const m of em)m._light128=l;meshes.push(...em);
  }else if(category==='wash'){
   meshes.push(boxMesh('Wash yoke',M.add(p,[0,-.1,0]),[.30,.11,.24],metal));meshes.push(ellipsoid('Wash head',M.add(p,[0,.03,0]),[.19,.16,.17],silver,14,8));
   const lens=ellipsoid('Soft lens',M.add(p,[0,.03,.17]),[.13,.12,.02],col,12,7);lens.material.emissive=col.slice(0,3).map(v=>v*.9);lens._light128=l;meshes.push(lens);
  }else if(category==='beam'){
   meshes.push(boxMesh('Fixture yoke',M.add(p,[0,-.12,0]),[.20,.14,.20],metal));meshes.push(boxMesh('Moving fixture head',M.add(p,[0,.01,0]),[.17,.24,.20],[.15,.20,.26,1]));
   const lens=ellipsoid('Spot emitter',M.add(p,[0,.015,.115]),[.06,.06,.014],col,12,8);lens.material.emissive=col.slice(0,3).map(v=>v*1.8);lens._light128=l;meshes.push(lens);
  }else{
   meshes.push(boxMesh('Fixture yoke',M.add(p,[0,-.14,0]),[.24,.16,.24],metal));meshes.push(boxMesh('Moving fixture head',M.add(p,[0,.02,0]),[.23,.31,.25],silver));
   const lens=ellipsoid('Spot emitter',M.add(p,[0,.025,.14]),[.095,.095,.014],col,12,8);lens.material.emissive=col.slice(0,3).map(v=>v*1.5);lens._light128=l;meshes.push(lens);
  }
  for(const m of meshes){m.lightId=l.id;m.fixtureShape128=category;this.fixtureMeshes.push(m);}
 }
};
engine?.rebuildFixtures?.();
// Keep beam geometry from V10 but visually distinguish soft/wide and crisp/very narrow emitters.
const prevMakeBeam128=StageEngine.prototype.makeBeam;
StageEngine.prototype.makeBeam=function(l){if(this===engine)this._beamFixture128=l;return prevMakeBeam128.call(this,l);};
const prevDraw128=StageEngine.prototype.draw;
StageEngine.prototype.draw=function(mesh,mode=0,screen=null,alpha=1){
 if(this===engine&&mode===0&&mesh?._light128){const l=mesh._light128,rgb=hexrgb(l.color||'#a5e1ff'),on=l.enabled!==false&&(l.power||0)>0,gain=on?Math.min(3.2,Math.max(.35,(l.power||4)/3.8)*(l._mult??1)):.05;mesh.material.color=[...rgb,1];mesh.material.emissive=rgb.map(v=>v*gain);}
 if(this===engine&&mode===2&&this._beamFixture128){const shape=lensShape128(this._beamFixture128.fixtureType128||this._beamFixture128.fixtureType127||this._beamFixture128.type||'beam');alpha*=shape==='beam'?1.28:shape==='wash'?.78:shape==='flash'?.92:shape==='bar'?.86:1.08;}
 return prevDraw128.call(this,mesh,mode,screen,alpha);
};
// Local programmable looks. A running show timecode always takes priority.
const prevUniform128=StageEngine.prototype.lightUniforms;
StageEngine.prototype.lightUniforms=function(t){if(this!==engine||seq.enabled||lighting9.preview)return prevUniform128.call(this,t);
 const backup=[];for(const l of this.lights){if(!l.motion128||l.motion128==='static')continue;
  const base=l.motionBase128||angleState128(l),amp=Number(l.motionAmp128)||24,speed=Math.max(.02,+l.motionSpeed128||.55),phase=t*speed*2*Math.PI+(l.phase||0),mode=l.motion128;let pan=base.pan,tilt=base.tilt;
  if(mode==='sweep'){pan+=Math.sin(phase)*amp;}
  else if(mode==='tilt'){tilt+=Math.sin(phase)*Math.min(45,amp);}
  else if(mode==='circle'){pan+=Math.sin(phase)*amp;tilt+=Math.cos(phase)*Math.min(35,amp*.60);}
  else if(mode==='figure8'){pan+=Math.sin(phase)*amp;tilt+=Math.sin(phase*2)*Math.min(30,amp*.52);}
  else if(mode==='fan'){pan+=Math.sin(phase*.5)*amp+((l.phase||0)-1)*amp*.18;tilt+=Math.cos(phase)*Math.min(20,amp*.35);}
  else if(mode==='ballyhoo'){pan+=Math.sin(phase*1.4)*amp;tilt+=Math.cos(phase*.72)*Math.min(40,amp*.8);}
  backup.push([l,l.target]);l.target=fromAngles128(l,pan,Math.max(-87,Math.min(87,tilt)),base.length);
 }
 try{return prevUniform128.call(this,t)}finally{for(const [l,target]of backup)l.target=target;}
};
const LOOKS128=[
 {id:'white-beam',name:'Crystal Beam',type:'beam2r',color:'#d8f3ff',angle:4,power:9,motion:'static',fx:'steady'},
 {id:'blue-concert',name:'Blue Concert',type:'beam5r',color:'#6acbff',angle:8,power:8,motion:'sweep',fx:'steady'},
 {id:'warm-gala',name:'Warm Gala',type:'fresnel',color:'#ffcc8f',angle:48,power:5,motion:'static',fx:'steady'},
 {id:'violet-wash',name:'Violet Wash',type:'washRGB',color:'#9569ff',angle:54,power:5,motion:'static',fx:'pulse'},
 {id:'sunset',name:'Sunset Amber',type:'par',color:'#ff8c45',angle:38,power:6,motion:'static',fx:'steady'},
 {id:'follow',name:'Follow Solo',type:'follow',color:'#f7f2df',angle:10,power:7,motion:'static',fx:'steady'},
 {id:'gobo',name:'Profile Orbit',type:'profile',color:'#e6d5ff',angle:17,power:7,motion:'circle',fx:'steady'},
 {id:'laser',name:'Laser Preview',type:'laserSim',color:'#4fff9a',angle:2,power:5,motion:'figure8',fx:'steady'},
 {id:'heartbeat',name:'Heartbeat Hit',type:'blinder',color:'#ffefbf',angle:48,power:8,motion:'static',fx:'pulse'},
 {id:'uplight',name:'Uplight Purple',type:'uplight',color:'#ad6cff',angle:31,power:5,motion:'tilt',fx:'steady'},
 {id:'pixelbar',name:'Pixel Neon',type:'batten',color:'#48f3ef',angle:48,power:4,motion:'static',fx:'pulse'},
 {id:'ballyhoo',name:'Ballyhoo Party',type:'hybrid',color:'#ff7dbf',angle:12,power:8,motion:'ballyhoo',fx:'steady'},
 {id:'whitewash',name:'Soft White',type:'audience',color:'#fff4e5',angle:58,power:4,motion:'static',fx:'steady'},
 {id:'rose',name:'Rose Stage',type:'ledtube',color:'#ff78aa',angle:48,power:5,motion:'circle',fx:'steady'}
];
function applyLook128(l,key){const q=LOOKS128.find(x=>x.id===key);if(!l||!q)return;
 const prev=angleState128(l);applyType(l,q.type);l.color=q.color;l.angle=q.angle;l.power=q.power;l.fx=q.fx;l.fxDepth=.6;l.fxSpeed=2.5;l.motion128=q.motion;l.motionAmp128=28;l.motionSpeed128=.24;l.motionBase128=prev;l.enabled=true;l.sweep=false;engine.settings.beam=Math.max(engine.settings.beam,1.15);engine.rebuildFixtures();FV128.selectedLook=key;
}
const oldFixturePanel128=fixturePanel;
fixturePanel=function(){const l=selected128(),v=l?coordinates128(l):null,style=l?(l.fixtureType128||l.fixtureType127||l.fixtureType126||'beam'):'beam',on=l?.enabled!==false,motion=l?.motion128||'static';
 const panel=oldFixturePanel128();const sect=`<section class="pro127-section" id="fixturePosition128">
 <h4>${uiText("01 / ĐẶT & DI CHUYỂN ĐÈN TRÊN SÂN KHẤU","Place and move stage lights")}</h4><p>${uiText("Chọn đèn → kéo chấm xanh trực tiếp trong khung 3D hoặc nhập tọa độ. Giữ nguyên kích thước sân khấu, LED và hệ mét.","Select a fixture, then drag its handle in 3D or enter coordinates. Stage size, LED dimensions and meter units stay unchanged.")}</p>
 ${l?`<div class="pro128-grid3">${['X','Y','Z'].map((c,i)=>`<label>${c} (m)<input id="pos128${i}" type="number" step="0.05" value="${Number(l.pos[i]).toFixed(3)}"></label>`).join('')}</div>
 <div class="pro127-actions" id="pro128-positionActions"><button id="p128move" class="primary">${uiText("Kéo XZ","Drag XZ")}</button><button id="p128raise">${uiText("Kéo cao Y","Drag height Y")}</button><button id="p128locate">${uiText("Click đặt đèn","Pick fixture position")}</button><button id="p128target">${uiText("Click điểm chiếu","Pick aim point")}</button></div>
 <label>${uiText("Độ cao lắp đèn ","Fixture mounting height ")}<div class="pro127-rangeline"><span>${uiText("Truss / sàn (m)","Truss / floor (m)")}</span><output id="p128heightOut">${l.pos[1].toFixed(2)}</output></div><input id="p128height" type="range" min="${(engine.stageBounds?.min[1]||0)-2}" max="${Math.max(4,(engine.stageBounds?.max[1]||6)+4)}" step="0.05" value="${l.pos[1]}"></label>
 <div class="pro127-actions"><button id="p128floor">${uiText("Đặt ở sàn","Place on floor")}</button><button id="p128truss">${uiText("Đặt trên truss","Place on truss")}</button><button id="p128focus">${uiText("Nhìn gần đèn","Focus on fixture")}</button></div>
 <div class="pro128-status" id="p128posStatus">${uiText("Vị trí: ","Position: ")}${l.pos.map(x=>x.toFixed(2)).join(' / ')}m · ${safe(l.name)}</div>`:'<p>'+uiText("Chọn hoặc thêm đèn để bắt đầu đặt vị trí.","Select or add a fixture to position it.")+'</p>'}</section>
 <section class="pro127-section" id="fixtureLook128"><h4>${uiText("02 / KIỂU ĐÈN · MÀU · CƯỜNG ĐỘ · CHUYỂN ĐỘNG","Fixture type · color · intensity · motion")}</h4>
 ${l?`<div class="pro127-grid"><label>${uiText("Đổi loại đèn đang chọn","Selected fixture type")}<select id="p128type">${typeOptions(style)}</select></label><label>${uiText("Màu phát sáng","Light color")}<input type="color" id="p128color" value="${/^#[a-fA-F0-9]{6}$/.test(l.color)?l.color:'#ffffff'}"></label></div>
 <div class="pro128-switchrow"><label><input type="checkbox" id="p128enabled" ${on?'checked':''}>${uiText(" Bật đèn"," Enable light")}</label><label><input type="checkbox" id="p128sweep" ${l.sweep?'checked':''}>${uiText(" Quét tự động"," Automatic sweep")}</label></div>
 <div class="pro127-grid"><label>${uiText("Motion tự do","Free motion")}<select id="p128motion">${[['static',uiText("Đứng yên","Static")],['sweep',uiText("Sweep ngang","Horizontal sweep")],['tilt',uiText("Tilt lên xuống","Vertical tilt")],['circle','Circle'],['figure8','Figure 8'],['fan','Fan'],['ballyhoo','Ballyhoo']].map(([k,n])=>`<option value="${k}" ${motion===k?'selected':''}>${n}</option>`).join('')}</select></label><label>Dimmer FX<select id="p128dimmer">${[['steady',uiText("Sáng liên tục","Steady")],['pulse',uiText("Pulse / nhịp","Beat pulse")],['build','Build-up'],['strobe',uiText("Strobe - lưu ý nhấp nháy","Strobe — flashing light")]].map(([k,n])=>`<option value="${k}" ${l.fx===k?'selected':''}>${n}</option>`).join('')}</select></label></div>
 ${knob('motionSpeed128',uiText("Tốc độ motion","Motion speed"),(l.motionSpeed128??.55),.03,2,.01,' Hz')}${knob('motionAmp128',uiText("Biên độ motion","Motion amplitude"),(l.motionAmp128??25),0,90,1,'°')}
 <div class="pro127-actions"><button id="p128playLook" class="primary">${uiText("Xem đèn chạy","Preview motion")}</button><button id="p128stopLook">${uiText("Dừng chuyển động","Stop motion")}</button><button id="p128moveCue">${uiText("+ Ghi cue FX","+ Record FX cue")}</button><button id="pro126DmxCsv">${uiText("Xuất Patch DMX (CSV)","Export DMX Patch (CSV)")}</button></div>
 <h4>${uiText("OPEN FIXTURE LIBRARY (DMX512 · 16-BIT)","Open Fixture Library (DMX512 · 16-bit)")}</h4>
 <div class="pro127-grid"><label>${uiText("Hồ sơ đèn OFL","OFL fixture profile")}<select id="p128oflProfile" data-ofl-profile><option value="">${uiText("-- Chọn profile OFL --","-- Select OFL profile --")}</option>${((typeof window!=='undefined'&&window.OFL_FIXTURES)||[]).map(fx=>`<option value="${safe(fx.id)}" ${l.oflProfileId===fx.id?'selected':''}>${safe(fx.manufacturer)} · ${safe(fx.name)}</option>`).join('')}</select></label><label>${uiText("Chế độ DMX","DMX mode")}<select id="p128oflMode" data-ofl-mode>${(((typeof window!=='undefined'&&window.OFL_FIXTURES)||[]).find(x=>x.id===l.oflProfileId)?.modes||[{name:'Default (16ch)',channelCount:16}]).map((m,mi)=>`<option value="${mi}" ${(l.oflModeIndex||0)===mi?'selected':''}>${safe(m.name)} (${m.channelCount}ch)</option>`).join('')}</select></label></div>
 ${l.oflProfileId?`<div class="pro128-status" id="p128oflSummary">DMX: ${safe(l.oflManufacturer||'')} ${safe(l.oflModel||'')} · ${safe(l.dmxMode||'')} · ${l.dmxChannelCount||16}ch · Pan ${l.panMaxDeg||540}° / Tilt ${l.tiltMaxDeg||270}°</div>`:''}
 <h4>${uiText("THƯ VIỆN LOOK SÂN KHẤU","Stage look library")}</h4><div class="pro128-lookgrid">${LOOKS128.map(q=>`<button data-look128="${q.id}" ${FV128.selectedLook===q.id?'class="active"':''}><i style="--swatch:${q.color}"></i>${displayName(q.name)}</button>`).join('')}</div>
 <p>${uiText("LOOK chỉnh ngay đèn được chọn. Cần nhiều đèn khác nhau: thêm Beam, Wash, Blinder, Pixel Bar… rồi chọn LOOK riêng. Cue timecode gốc vẫn chạy trong tab ","Looks apply immediately to the selected fixture. Add different fixture types and choose a look for each. Existing cues continue in ")}<b>${uiText("Timecode đèn","Lighting timecode")}</b>.</p>`:'<p>'+uiText("Chọn một đèn để dùng các preset ánh sáng.","Select a fixture to use lighting presets.")+'</p>'}</section>`;
 return panel.replace('<section class="pro127-section" id="fixturePanTilt127">',sect+'<section class="pro127-section" id="fixturePanTilt127">');
};
// Preserve the side-panel scroll position when changing a look or fixture type.
let _oflSliderDragging=false,_oflDeferredPaint=false;
function isDraggingSlider(){
 if(_oflSliderDragging)return true;
 const active=typeof document!=='undefined'?document.activeElement:null;
 return !!(active&&active.tagName==='INPUT'&&active.type==='range'&&active.matches?.(':active'));
}
function deferPaint(){if(isDraggingSlider()){_oflDeferredPaint=true;return true;}return false;}
if(typeof window!=='undefined'){
 window.addEventListener('pointerdown',e=>{if(e.target?.matches?.('#pro127dock input[type="range"], .right-panel input[type="range"]'))_oflSliderDragging=true;},true);
 const endSlider=()=>{if(!_oflSliderDragging)return;_oflSliderDragging=false;if(_oflDeferredPaint){_oflDeferredPaint=false;paint();}};
 window.addEventListener('pointerup',endSlider,true);window.addEventListener('pointercancel',endSlider,true);
}
function applyOflProfile(lightId, oflId, modeIndex = 0){
 const list=(typeof window!=='undefined'&&window.OFL_FIXTURES)||[];
 const normKey=String(oflId||'').trim().toLowerCase();
 const normSlug=normKey.replace(/\//g,'-');
 const fx=(typeof window!=='undefined'&&typeof window.resolveOflFixture==='function'&&window.resolveOflFixture(oflId))||list.find(x=>x.id===oflId||x.id.toLowerCase()===normKey||x.id.toLowerCase().replace(/\//g,'-')===normSlug||(Array.isArray(x.aliases)&&x.aliases.some(a=>{const al=String(a||'').toLowerCase();return al===normKey||al.replace(/\//g,'-')===normSlug;})));if(!fx)return null;
 const l=(engine?.lights||[]).find(x=>x.id===lightId)||selected128();if(!l)return null;
 let resolvedIdx=Number(modeIndex);
 if(!Number.isFinite(resolvedIdx)&&typeof modeIndex==='string'){
  const mSlug=modeIndex.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const foundIdx=fx.modes.findIndex(m=>m.name.toLowerCase()===modeIndex.trim().toLowerCase()||m.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')===mSlug);
  resolvedIdx=foundIdx>=0?foundIdx:0;
 }
 const idx=Math.max(0,Math.min(fx.modes.length-1,resolvedIdx||0)),mode=fx.modes[idx];
 const kindMap={beam:'beam5r',spot:'profile',wash:'washRGB',par:'par',pixel:'batten',strobe:'strobe',hybrid:'hybrid'};
 applyType(l,kindMap[fx.category]||'hybrid');
 l.oflProfileId=fx.id;l.oflManufacturer=fx.manufacturer;l.oflModel=fx.name;l.oflModeIndex=idx;
 l.dmxMode=mode.name;l.oflModeName=mode.name;l.dmxChannelCount=mode.channelCount;
 l.oflChannels=mode.channels.map(ch=>({...ch}));l.dmxChannels=l.oflChannels;
 l.angle=Math.max(2,Math.min(70,Math.round(((fx.physical.beamAngleMin||8)+(fx.physical.beamAngleMax||18))*0.5)));
 l.power=Math.max(2,Math.min(14,Number(((fx.physical.lumens||8000)/1800).toFixed(1))));
 l.panMaxDeg=fx.physical.panMaxDeg||540;l.tiltMaxDeg=fx.physical.tiltMaxDeg||270;
 engine.rebuildFixtures();
 if(!deferPaint()&&P.open&&P.tab==='fixture')paint();
 return l;
}
S.fixtureDesk12={applyOflProfile,isDraggingSlider,deferPaint,getFixtures:()=>(typeof window!=='undefined'&&window.OFL_FIXTURES)||[]};
const oldPaint128=paint;
paint=function(){if(deferPaint())return;const a=id('pro127dock')?.querySelector('.pro127-content');const scroll=a?.scrollTop||0;const r=oldPaint128();const b=id('pro127dock')?.querySelector('.pro127-content');if(b)b.scrollTop=scroll;return r;};
const oldBindFixture128=bindFixture;
bindFixture=function(){oldBindFixture128();const l=selected128();if(!l)return;
 // Update only the selected fixture; do not move GLB or any LED surface.
 const syncXYZ=()=>{for(let i=0;i<3;i++){const e=id('pos128'+i);if(e)e.value=l.pos[i].toFixed(3);}const h=id('p128height');if(h)h.value=l.pos[1];const ho=id('p128heightOut');if(ho)ho.textContent=l.pos[1].toFixed(2);const info=id('p128posStatus');if(info)info.textContent=uiText("Vị trí: ","Position: ")+l.pos.map(v=>v.toFixed(2)).join(' / ')+' m · '+l.name;};
 for(let i=0;i<3;i++){id('pos128'+i).onchange=e=>{const v=+e.target.value;if(!Number.isFinite(v)||Math.abs(v)>5000)return;checkpoint();setManualMode();const p=[...l.pos];p[i]=v;updatePosition128(l,p);engine.rebuildFixtures();syncXYZ();};}
 id('p128height').oninput=e=>{if(!FV128.wasMoved){checkpoint();FV128.wasMoved=true;}setManualMode();updatePosition128(l,[l.pos[0],+e.target.value,l.pos[2]]);syncXYZ();};
 id('p128height').onchange=()=>{FV128.wasMoved=false;engine.rebuildFixtures();};
 id('p128move').onclick=()=>{FV128.dragMode='xz';toast(uiText("Kéo chấm màu trên sân khấu để di chuyển đèn theo X/Z.","Drag the colored stage handle to move the fixture along X/Z."));};
 id('p128raise').onclick=()=>{FV128.dragMode='y';toast(uiText("Kéo chấm màu lên/xuống để đổi cao độ Y.","Drag the colored handle up/down to adjust height Y."));};
 id('p128locate').onclick=()=>beginPick128('position');id('p128target').onclick=()=>beginPick128('aim');
 id('p128floor').onclick=()=>{checkpoint();setManualMode();const y=engine.stageBounds?.min[1]??0;updatePosition128(l,[l.pos[0],y+.2,l.pos[2]]);engine.rebuildFixtures();syncXYZ();};
 id('p128truss').onclick=()=>{checkpoint();setManualMode();const y=(engine.stageBounds?.max[1]??6)-.4;updatePosition128(l,[l.pos[0],Math.max(y,1),l.pos[2]]);engine.rebuildFixtures();syncXYZ();};
 id('p128focus').onclick=()=>{engine.view='stage';engine.camera.target=[...l.pos];engine.camera.distance=Math.max(2.7,Math.min(engine.size.width*.45,7.5));engine._fitOnResize=false;};
 id('p128type').onchange=e=>{checkpoint();setManualMode();applyType(l,e.target.value);paint();};
 id('p128color').oninput=e=>{setManualMode();l.color=e.target.value;};id('p128color').onchange=()=>engine.rebuildFixtures();
 id('p128enabled').onchange=e=>{checkpoint();l.enabled=e.target.checked;};
 id('p128sweep').onchange=e=>{checkpoint();setManualMode();l.sweep=e.target.checked;l.motion128='static';};
 id('p128motion').onchange=e=>{checkpoint();setManualMode();l.motion128=e.target.value;l.sweep=false;l.motionBase128=angleState128(l);};
 id('p128dimmer').onchange=e=>{checkpoint();setManualMode();if(e.target.value==='strobe'&&!FV128.strobeConsent){if(!confirm(uiText("Strobe nhấp nháy nhanh, có thể gây khó chịu. Bạn có muốn bật?","Strobe flashes rapidly and may cause discomfort. Enable it?"))){e.target.value='steady';return;}FV128.strobeConsent=true;}l.fx=e.target.value;};
 for(const [k,field]of [['motionSpeed128','motionSpeed128'],['motionAmp128','motionAmp128']])id('pro127_'+k).oninput=e=>{l[field]=+e.target.value;id('pro127_'+k+'_out').textContent=e.target.value+(k==='motionSpeed128'?' Hz':'°');};
 id('p128playLook').onclick=()=>{if(seq.enabled||lighting9.preview)setManualMode();setPlaying(true);engine.settings.beam=Math.max(1.15,engine.settings.beam);toast(uiText("Đang xem motion trực tiếp cho ","Previewing motion for ")+l.name+'.');};
 id('p128stopLook').onclick=()=>{l.motion128='static';l.fx='steady';setPlaying(false);paint();};
 id('p128moveCue').onclick=()=>{const map={sweep:'move_sweep',tilt:'move_tilt',circle:'move_circle',figure8:'move_figure8',fan:'move_fan',ballyhoo:'move_ballyhoo'};P.previewFX=map[l.motion128]||(l.fx==='pulse'?'dim_pulse':'move_static');openDock('fx');toast(uiText("Đã chọn mẫu ","Selected preset ")+P.previewFX+uiText(". Chỉnh rồi bấm “+ Đặt cue vào SHOW TIMELINE”.",". Adjust settings, then select “+ Add cue to show timeline”."));};
 if(id('pro126DmxCsv'))id('pro126DmxCsv').onclick=()=>N.exportDmxPatchCsv();
 document.querySelectorAll('[data-look128]').forEach(b=>b.onclick=()=>{checkpoint();setManualMode();applyLook128(l,b.dataset.look128);paint();setPlaying(true);toast(uiText("Đang áp dụng ","Applying ")+b.textContent.trim()+uiText(" – thấy ngay trên sân khấu."," — previewed on stage."));});
 if(id('p128oflProfile'))id('p128oflProfile').onchange=e=>{if(!e.target.value)return;checkpoint();setManualMode();applyOflProfile(l.id,e.target.value,0);toast(uiText("Đã áp dụng hồ sơ OFL ","Applied OFL profile ")+e.target.value);};
 if(id('p128oflMode'))id('p128oflMode').onchange=e=>{if(!l.oflProfileId)return;checkpoint();setManualMode();applyOflProfile(l.id,l.oflProfileId,+e.target.value||0);};
};
function hint128(msg){let d=id('fixture128pickHint');if(!d){d=document.createElement('div');d.id='fixture128pickHint';id('viewport')?.appendChild(d);}d.textContent=msg;d.hidden=!msg;}
function beginPick128(mode){if(!selected128()){toast(uiText("Hãy chọn một đèn.","Select a fixture."));return;}
 setManualMode();FV128.pick=mode;P.pick=null;engine.view='stage';hint128(mode==='position'?uiText("Click vị trí lắp đèn trên TRUSS / SÀN. ESC để hủy.","Click a mounting position on the truss / floor. Esc to cancel."):uiText("Click điểm đèn CHIẾU TỚI trên sân khấu. ESC để hủy.","Click the beam aim point on stage. Esc to cancel."));}
function cancelPick128(){FV128.pick=null;hint128('');}
function applyClick128(e){if(!FV128.pick||e.button!==0)return false;const l=selected128();if(!l){cancelPick128();return false;}const hit=engine.pick(e.clientX,e.clientY,false);if(!hit){toast(uiText("Chưa chọn trúng bề mặt mô hình. Hãy click lại.","No model surface selected. Click again."));return true;}checkpoint();if(FV128.pick==='position')updatePosition128(l,[...hit.point]);else updateTarget128(l,[...hit.point]);engine.rebuildFixtures();cancelPick128();paint();return true;}
function buildHandles128(){let svg=id('fixtureHandles128');if(svg)return svg;
 svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='fixtureHandles128';svg.setAttribute('aria-label',uiText("Kéo vị trí đèn và điểm chiếu","Drag fixture position and aim point"));
 svg.innerHTML='<path id="f128line" class="beam-aim-line"/><circle id="f128light" class="drag128" fill="#47f0d9" r="11"><title>'+uiText("Kéo vị trí đèn","Drag fixture position")+'</title></circle><circle id="f128aim" class="drag128" fill="#f8b966" r="8"><title>'+uiText("Kéo điểm chiếu","Drag aim point")+'</title></circle><text id="f128label" class="fixture-label"></text>';
 id('viewport')?.appendChild(svg);
 for(const [handle,mode]of [['f128light','position'],['f128aim','aim']])svg.querySelector('#'+handle)?.addEventListener('pointerdown',e=>{
   if(!P.open||P.tab!=='fixture'||!selected128()||e.button!==0)return;
   e.stopPropagation();e.preventDefault();checkpoint();setManualMode();const l=selected128();FV128.drag={id:l.id,mode,ptr:e.pointerId,from:[e.clientX,e.clientY],last:[e.clientX,e.clientY],world:mode==='position'?[...l.pos]:[...l.target],target:[...l.target]};
   e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.style.cursor='grabbing';
 });
 return svg;
}
function screenGround128(x,y,planeY){const box=engine.canvas.getBoundingClientRect();if(!box.width||!box.height||!engine.vp)return null;
 const nx=(x-box.left)/box.width*2-1,ny=1-(y-box.top)/box.height*2,iv=M.inverse(engine.vp),a=M.point(iv,[nx,ny,-1]),b=M.point(iv,[nx,ny,1]),d=M.sub(b,a);
 if(Math.abs(d[1])<.012)return null;const f=(planeY-a[1])/d[1];if(!Number.isFinite(f)||f<0)return null;return M.add(a,M.mul(d,f));
}
function applyDrag128(e){const d=FV128.drag;if(!d)return;const l=engine.lights.find(q=>q.id===d.id);if(!l)return;
 const old=d.world;let next=[...old];
 if(d.mode==='position'&&FV128.dragMode==='y'){
  const unit=(engine.camera.distance||10)*Math.tan((engine.camera.fov||45)*Math.PI/360)*2/Math.max(100,engine.canvas.clientHeight);
  next[1]=old[1]-(e.clientY-d.from[1])*unit;
 }else{
  // Screen-space metric delta is deliberately used instead of infinite ray/plane intersections:
  // at a near-horizontal camera those intersections shoot hundreds of metres away.
  const dx=e.clientX-d.from[0],dy=e.clientY-d.from[1],c=engine.camera;
  const step=(c.distance||10)*2*Math.tan((c.fov||45)*Math.PI/360)/Math.max(160,engine.canvas.clientHeight),yaw=c.yaw||0;
  const horiz=dx*step,depth=dy*step*.75;
  next=[old[0]+horiz*Math.cos(yaw)+depth*Math.sin(yaw),old[1],old[2]-horiz*Math.sin(yaw)+depth*Math.cos(yaw)];
 }
 if(!next.every(Number.isFinite))return;
 next=next.map(v=>Math.max(-2000,Math.min(2000,v)));
 if(d.mode==='position'){updatePosition128(l,next);}else{updateTarget128(l,next);}
 const info=id('p128posStatus');if(info)info.textContent=uiText("Vị trí: ","Position: ")+l.pos.map(v=>v.toFixed(2)).join(' / ')+' m · '+l.name;
 d.last=[e.clientX,e.clientY];
}
window.addEventListener('pointermove',e=>{if(FV128.drag){e.preventDefault();applyDrag128(e);}},true);
function endDrag128(){if(!FV128.drag)return;FV128.drag=null;engine.rebuildFixtures();if(P.open&&P.tab==='fixture')paint();}
window.addEventListener('pointerup',endDrag128,true);window.addEventListener('pointercancel',endDrag128,true);
window.addEventListener('blur',endDrag128);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&FV128.pick){cancelPick128();e.stopImmediatePropagation();}},true);
// Capture model clicks before orbit/pick in the other versions.
id('glcanvas')?.addEventListener('pointerdown',e=>{if(FV128.pick&&e.button===0){e.preventDefault();e.stopImmediatePropagation();}},true);
id('glcanvas')?.addEventListener('pointerup',e=>{if(FV128.pick){e.preventDefault();e.stopImmediatePropagation();applyClick128(e);}},true);
let lastHandles128=0;
function tickHandles128(now){requestAnimationFrame(tickHandles128);if(now-lastHandles128<65)return;lastHandles128=now;
 const svg=buildHandles128();if(!svg)return;
 const show=P.open&&P.tab==='fixture'&&engine?.view==='stage'&&!state.presenting&&!!selected128(),want=show?'':'none';if(svg.style.display!==want)svg.style.display=want;if(!show)return;
 const l=selected128(),box=id('viewport').getBoundingClientRect();if(!box.width||!box.height)return;
 const point=engine.project(l.pos),aim=engine.project(l._target||l.target);if(!point||!aim||!Number.isFinite(point.x+point.y+aim.x+aim.y))return;
 svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
 const pos=svg.querySelector('#f128light'),dest=svg.querySelector('#f128aim'),line=svg.querySelector('#f128line');pos.setAttribute('cx',point.x);pos.setAttribute('cy',point.y);dest.setAttribute('cx',aim.x);dest.setAttribute('cy',aim.y);
 line.setAttribute('d',`M ${point.x} ${point.y} L ${aim.x} ${aim.y}`);const label=svg.querySelector('#f128label');label.setAttribute('x',point.x+17);label.setAttribute('y',point.y-12);label.textContent=l.name;
}
requestAnimationFrame(tickHandles128);
// Expose a few stable operations for repeatable browser tests and future plugins.
S.fixture128.add=(kind='beam',pos=null)=>addFixture(kind,pos);
S.fixture128.move=(id,p)=>{const l=engine.lights.find(x=>x.id===id);if(!l)return false;updatePosition128(l,p);engine.rebuildFixtures();return true;};
S.fixture128.select=id=>{const l=engine.lights.find(x=>x.id===id);if(!l)return false;selectLight(l);return true;};
S.fixture128.look=(id,look)=>{const l=engine.lights.find(x=>x.id===id);if(!l)return false;applyLook128(l,look);return true;};
S.fixture128.types=Object.keys(types);
S.fixture128.looks=LOOKS128.map(x=>x.id);
const N = S.pro126 || (S.pro126 = {});
function buildDmxPatchTable(lights = (typeof engine !== 'undefined' ? engine.lights : [])) {
 const list = Array.isArray(lights) ? lights.filter(l => !l?._deleted8) : [];
 let universe = 1;
 let address = 1;
 const rows = list.map((l, idx) => {
  const prof = (typeof N !== 'undefined' && N?.profiles?.[l?.profileId || l?.fixtureType126]) || {};
  const chCount = Math.max(1, Math.min(512, Math.round(+l?.dmxChannelCount || +l?.dmxChannels || +l?.channels || +prof.dmx || 16)));
  if (address + chCount - 1 > 512) {
   universe += 1;
   address = 1;
  }
  const assignedUni = +l?.dmxUniverse > 0 ? Math.round(+l.dmxUniverse) : (+l?.universe > 0 ? Math.round(+l.universe) : universe);
  const assignedAddr = +l?.dmxAddress > 0 ? Math.round(+l.dmxAddress) : (+l?.address > 0 ? Math.round(+l.address) : address);
  if (!l?.dmxUniverse && !l?.dmxAddress && !l?.universe && !l?.address) {
   address += chCount;
  } else {
   universe = assignedUni;
   address = assignedAddr + chCount;
  }
  const type = String(l?.type || l?.fixtureType127 || l?.fixtureType126 || 'beam').toLowerCase();
  const powerW = +l?.powerW || (type === 'beam' ? 380 : type === 'strobe' ? 1000 : 250);
  const weightKg = +l?.weightKg || (type === 'beam' ? 18 : type === 'strobe' ? 10 : 9);
  const pos = Array.isArray(l?.pos) ? l.pos : [0, 0, 0];
  const endAddress = assignedAddr + chCount - 1;
  return {
   index: idx + 1,
   id: l?.id || `FX_${idx + 1}`,
   fixtureId: l?.id || `FX_${idx + 1}`,
   name: l?.name || `Fixture #${idx + 1}`,
   fixtureType: l?.oflModel || prof.name || l?.type || 'Moving Head Beam',
   profileName: l?.oflModel || prof.name || l?.type || 'Moving Head Beam',
   modeName: l?.oflModeName || `${chCount}CH Standard`,
   channelCount: chCount,
   channels: chCount,
   universe: assignedUni,
   address: assignedAddr,
   startAddress: assignedAddr,
   endAddress,
   patchLabel: `U${assignedUni}.${String(assignedAddr).padStart(3, '0')}`,
   powerW,
   weightKg,
   posM: [
    Math.round((+pos[0] || 0) * 100) / 100,
    Math.round((+pos[1] || 0) * 100) / 100,
    Math.round((+pos[2] || 0) * 100) / 100
   ],
   posX: +(Number(pos[0]) || 0).toFixed(2),
   posY: +(Number(pos[1]) || 0).toFixed(2),
   posZ: +(Number(pos[2]) || 0).toFixed(2),
   conflict: false,
   outOfRange: endAddress > 512
  };
 });
 for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
   if (rows[i].universe === rows[j].universe) {
    const overlap = rows[i].startAddress <= rows[j].endAddress && rows[j].startAddress <= rows[i].endAddress;
    if (overlap) {
     rows[i].conflict = true;
     rows[j].conflict = true;
    }
   }
  }
 }
 rows.rows = rows;
 rows.hasConflict = rows.some(r => r.conflict || r.outOfRange);
 return rows;
}
function autoRigFixturesOnTruss(spec = {}) {
 const trussId = String(spec.trussId || 'TRUSS_MAIN');
 const spanM = Math.max(1.0, +(spec.spanM || 12));
 const centerX = +(spec.centerX || 0);
 const trimHeightM = +(spec.trimHeightM ?? spec.y ?? 8.0);
 const z = +(spec.z || 0);
 const fixtureCount = Math.max(0, Math.min(64, Math.round(+(spec.fixtureCount ?? 8))));
 const fixtureType = String(spec.fixtureType || 'beam').toLowerCase();
 const fixtureWeightKg = Math.max(1, +(spec.fixtureWeightKg || (fixtureType === 'beam' ? 22 : fixtureType === 'strobe' ? 12 : 14)));
 const fixturePowerW = Math.max(20, +(spec.fixturePowerW || (fixtureType === 'beam' ? 420 : fixtureType === 'strobe' ? 1000 : 300)));
 const startUniverse = Math.max(1, Math.round(+(spec.startUniverse || 1)));
 const startAddress = Math.max(1, Math.min(512, Math.round(+(spec.startAddress || 1))));
 const dmxChannels = Math.max(1, Math.min(512, Math.round(+(spec.dmxChannels || 16))));

 const marginM = Math.max(0.45, +(spanM * 0.08).toFixed(3));
 const usableSpanM = Math.max(0.2, +(spanM - 2 * marginM).toFixed(3));
 const stepM = fixtureCount > 1 ? usableSpanM / (fixtureCount - 1) : 0;

 const offsets = new Array(fixtureCount).fill(0);
 const halfPairs = Math.floor(fixtureCount / 2);
 for (let i = 0; i < halfPairs; i++) {
  const rightIdx = fixtureCount - 1 - i;
  let absOff = (usableSpanM / 2) - i * stepM;
  const mod2 = absOff % 2.0;
  if (mod2 < 0.08 || (2.0 - mod2) < 0.08) {
   absOff = Math.max(0.15, absOff - 0.10);
  }
  offsets[i] = -absOff;
  offsets[rightIdx] = absOff;
 }
 if (fixtureCount % 2 === 1) {
  const halfMod2 = (usableSpanM / 2) % 2.0;
  if (halfMod2 < 0.08 || (2.0 - halfMod2) < 0.08) {
   offsets[halfPairs] = 0.10;
  }
 }

 let uni = startUniverse;
 let addr = startAddress;
 const fixtures = [];
 for (let i = 0; i < fixtureCount; i++) {
  if (addr + dmxChannels - 1 > 512) {
   uni += 1;
   addr = 1;
  }
  const xPos = +(centerX + offsets[i]).toFixed(4);
  const yPos = +trimHeightM.toFixed(3);
  const zPos = +z.toFixed(3);
  fixtures.push({
   id: `${trussId}_FX_${i + 1}`,
   name: `${fixtureType.toUpperCase()} #${i + 1}`,
   trussId,
   type: fixtureType,
   x: xPos,
   y: yPos,
   z: zPos,
   pos: [xPos, yPos, zPos],
   target: [xPos, 0, zPos],
   weightKg: fixtureWeightKg,
   powerW: fixturePowerW,
   dmxUniverse: uni,
   dmxAddress: addr,
   dmxChannels,
   patchLabel: `U${uni}.${String(addr).padStart(3, '0')}`
  });
  addr += dmxChannels;
 }

 const totalFixtureWeightKg = +(fixtureCount * fixtureWeightKg).toFixed(2);
 const cableAllowanceKg = +(totalFixtureWeightKg * 0.15).toFixed(2);
 return {
  trussId,
  spanM,
  marginM,
  usableSpanM,
  totalFixtureWeightKg,
  cableAllowanceKg,
  totalRiggedLoadKg: +(totalFixtureWeightKg + cableAllowanceKg).toFixed(2),
  fixtures
 };
}
function escapeXml12(str) {
 return String(str ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');
}
function buildGrandMaFixtureXml(lights = (typeof engine !== 'undefined' ? engine.lights : []), opts = {}) {
 const list = Array.isArray(lights) ? lights.filter(l => !l?._deleted8) : [];
 const version = String(opts.version || 'ma3').toLowerCase() === 'ma2' ? 'ma2' : 'ma3';
 const layerName = escapeXml12(opts.layerName || 'ALPHA_Stage_Rig');

 let cursorUni = 1;
 let cursorAddr = 1;
 const patched = list.map((l, idx) => {
  const chCount = Math.max(1, Math.min(512, Math.round(+(l?.dmxChannelCount || l?.dmxChannels || l?.channels || 16))));
  let reqUni = Math.max(1, Math.round(+(l?.dmxUniverse || l?.universe || cursorUni)));
  let reqAddr = Math.max(1, Math.round(+(l?.dmxAddress || l?.address || cursorAddr)));
  if (reqAddr + chCount - 1 > 512) {
   reqUni += 1;
   reqAddr = 1;
  }
  if (reqUni < cursorUni || (reqUni === cursorUni && reqAddr < cursorAddr)) {
   reqUni = cursorUni;
   reqAddr = cursorAddr;
   if (reqAddr + chCount - 1 > 512) {
    reqUni += 1;
    reqAddr = 1;
   }
  }
  cursorUni = reqUni;
  cursorAddr = reqAddr + chCount;
  if (cursorAddr > 512) {
   cursorUni += 1;
   cursorAddr = 1;
  }

  const rawPos = Array.isArray(l?.pos) ? l.pos : [l?.x ?? 0, l?.y ?? 0, l?.z ?? 0];
  const posX = (+(l?.x ?? rawPos[0]) || 0).toFixed(3);
  const posY = (+(l?.z ?? rawPos[2]) || 0).toFixed(3);
  const posZ = (+(l?.y ?? rawPos[1]) || 0).toFixed(3);
  const rotX = (+(l?.rx ?? 0) || 0).toFixed(1);
  const rotY = (+(l?.ry ?? 0) || 0).toFixed(1);
  const rotZ = (+(l?.rz ?? 0) || 0).toFixed(1);
  const fixId = Math.max(1, Math.round(+(l?.fixId || (101 + idx))));
  const name = escapeXml12(l?.name || `Fixture_${idx + 1}`);
  const fixtureType = escapeXml12(l?.oflModel || l?.type || 'Moving Head Beam');
  const patchDot = `${reqUni}.${String(reqAddr).padStart(3, '0')}`;
  return { idx, fixId, name, fixtureType, chCount, reqUni, reqAddr, patchDot, posX, posY, posZ, rotX, rotY, rotZ };
 });

 if (version === 'ma2') {
  const ma2Fixtures = patched.map(f => [
   `      <Fixture index="${f.idx}" name="${f.name}" fixture_id="${f.fixId}" channel_id="${f.fixId}">`,
   `        <FixtureType name="${f.fixtureType}" />`,
   `        <SubFixture index="0" react_to_grandmaster="true" color="ffffff">`,
   `          <Patch><Address>${f.patchDot}</Address></Patch>`,
   `          <AbsolutePosition><Location x="${f.posX}" y="${f.posY}" z="${f.posZ}" /><Rotation x="${f.rotX}" y="${f.rotY}" z="${f.rotZ}" /></AbsolutePosition>`,
   `        </SubFixture>`,
   `      </Fixture>`
  ].join('\n')).join('\n');
  const ma2Macros = patched.map((f, i) =>
   `    <Macroline index="${i}"><text>Assign Fixture ${f.fixId} /x=${f.posX} /y=${f.posY} /z=${f.posZ} /dmx=${f.patchDot}</text></Macroline>`
  ).join('\n');
  return [
   `<?xml version="1.0" encoding="utf-8"?>`,
   `<MA xmlns="http://schemas.malighting.de/grandma2/xml/MA" major_vers="3" minor_vers="9" stream_vers="60">`,
   `  <Info datetime="${new Date().toISOString()}" showfile="ALPHA_Creative_LED_Studio" />`,
   `  <FixtureLayer index="0" name="${layerName}">`,
   ma2Fixtures,
   `  </FixtureLayer>`,
   `  <Macro index="0" name="ALPHA Auto-Position 3D">`,
   ma2Macros,
   `  </Macro>`,
   `</MA>`
  ].join('\n');
 }

 const ma3Fixtures = patched.map(f =>
  `      <Fixture Name="${f.name}" FixId="${f.fixId}" Patch="${f.patchDot}" FixtureType="${f.fixtureType}" Channels="${f.chCount}" PosX="${f.posX}" PosY="${f.posY}" PosZ="${f.posZ}" RotX="${f.rotX}" RotY="${f.rotY}" RotZ="${f.rotZ}" />`
 ).join('\n');
 const ma3MacroLines = patched.map((f, i) =>
  `      <MacroLine Index="${i + 1}" Command="Set Fixture ${f.fixId} Property &quot;PosX&quot; &quot;${f.posX}&quot; &quot;PosY&quot; &quot;${f.posY}&quot; &quot;PosZ&quot; &quot;${f.posZ}&quot; &quot;Patch&quot; &quot;${f.patchDot}&quot;" />`
 ).join('\n');
 return [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<GMA3 DataVersion="1.9.7.0">`,
  `  <Patch>`,
  `    <FixtureLayer Name="${layerName}">`,
  ma3Fixtures,
  `    </FixtureLayer>`,
  `  </Patch>`,
  `  <MacroPool>`,
  `    <Macro Name="ALPHA_3D_Stage_Setup">`,
  ma3MacroLines,
  `    </Macro>`,
  `  </MacroPool>`,
  `</GMA3>`
 ].join('\n');
}
function exportGrandMaXml(lights = (typeof engine !== 'undefined' ? engine.lights : []), opts = {}) {
 const version = String(opts.version || 'ma3').toLowerCase() === 'ma2' ? 'ma2' : 'ma3';
 const xml = buildGrandMaFixtureXml(lights, { ...opts, version });
 const fname = version === 'ma2' ? 'ALPHA_GrandMA2_Stage_Layer.xml' : 'ALPHA_GrandMA3_Stage_Layer.xml';
 if (typeof downloadText === 'function') {
  downloadText(fname, xml, 'application/xml;charset=utf-8');
 } else if (typeof downloadTextFile === 'function') {
  downloadTextFile(fname, xml, 'application/xml;charset=utf-8');
 }
 return xml;
}
function exportDmxPatchCsv(lights) {
 const rows = buildDmxPatchTable(lights);
 const quote = (v) => {
  const s = String(v ?? '');
  const safeStr = /^[=+@-]/.test(s) ? "'" + s : s;
  return '"' + safeStr.replace(/"/g, '""') + '"';
 };
 const header = ['FixtureID', 'Name', 'Model', 'Mode', 'Channels', 'Universe', 'Address', 'Patch', 'PowerW', 'WeightKg', 'PosX_m', 'PosY_m', 'PosZ_m', 'EndAddress', 'Status'];
 const lines = [
  header.join(','),
  ...rows.map(r => [
   r.fixtureId, r.name, r.fixtureType, r.modeName, r.channelCount,
   r.universe, r.address, r.patchLabel, r.powerW, r.weightKg,
   r.posM[0], r.posM[1], r.posM[2], r.endAddress,
   r.outOfRange ? 'OVER_512' : (r.conflict ? 'CONFLICT' : 'OK')
  ].map(quote).join(','))
 ];
 const csv = '\ufeff' + lines.join('\r\n');
 if (typeof downloadText === 'function') {
  downloadText('ALPHA_DMX_Patch_Sheet.csv', csv, 'text/csv;charset=utf-8');
 }
 return csv;
}
N.buildDmxPatchTable = buildDmxPatchTable;
N.exportDmxPatchCsv = exportDmxPatchCsv;
N.autoRigFixturesOnTruss = autoRigFixturesOnTruss;
N.buildGrandMaFixtureXml = buildGrandMaFixtureXml;
N.exportGrandMaXml = exportGrandMaXml;
S.buildDmxPatchTable = buildDmxPatchTable;
S.exportDmxPatchCsv = exportDmxPatchCsv;
S.autoRigFixturesOnTruss = autoRigFixturesOnTruss;
S.buildGrandMaFixtureXml = buildGrandMaFixtureXml;
S.exportGrandMaXml = exportGrandMaXml;
S.fixture128.autoRig = autoRigFixturesOnTruss;
S.fixture128.buildGrandMaXml = buildGrandMaFixtureXml;
S.fixture128.exportGrandMaXml = exportGrandMaXml;

// Create actual stable controls, not a floating modal.
window.addEventListener('ledstudio:locale',()=>{window.translateUiText?.(id('pro127dock'));window.translateUiText?.(id('pro127bar'));});
renderDockFrame();makeToolbar();insertOverlay();bindPointerPick();requestAnimationFrame(overlayTick);
})();

/* V13.0: stable add-on to V12.8. Does not modify the GL shader, stage geometry, or root layout. */
(function(){
const uiText=(vi,en)=>window.tr?window.tr(vi,en):vi;
const displayName=value=>{const labels={"Beam 2R / Siêu hẹp":"Beam 2R / ultra-narrow","Laser Beam (mô phỏng)":"Laser beam (simulated)","Sweep rộng":"Wide sweep","Sweep hẹp":"Narrow sweep","Circle chậm":"Slow circle","Circle nhanh":"Fast circle","Số 8 rộng":"Wide figure 8","Fan trái/phải":"Left/right fan","Giao nhau":"Cross","Hội tụ":"Converge","Tỏa ra":"Diverge","Đập màu":"Color hit","Màu mềm":"Soft color","Sóng cyan":"Cyan wave","Nhấn amber":"Amber burst","Nền tím":"Violet wash","Cắt sáng":"Light cut","Cuộn ngang":"Horizontal scroll","Cuộn dọc":"Vertical scroll","Di chuyển chéo":"Diagonal drift","Xoay mềm":"Soft rotation","Gương đối xứng":"Symmetrical mirror","Lệch RGB":"RGB split","Giật nhịp":"Rhythmic jitter","Zoom nhấn":"Zoom hit","Lắc qua lại":"Sway","Nhịp thở":"Breathing","Nhún theo beat":"Beat pulse","Flash nhấn":"Flash hit","Neon chuyển":"Neon motion","Tổng kết":"Finale","Trắng":"White"};return uiText(value,labels[value]||value);};

 'use strict';
 try {
 const S=window.STUDIO,root=document.querySelector('.right-panel');
 if(!S||!root||typeof engine==='undefined'||typeof stage10==='undefined') return;
 const $=id=>document.getElementById(id);
 const limit=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number.isFinite(+n)?+n:lo));
 const FX=[
 ['rgb-hit','RGB Hit','Đập màu'],['color-flow','Color Flow','Màu mềm'],['cyan-wave','Cyan Wave','Sóng cyan'],['amber-burst','Amber Burst','Nhấn amber'],
 ['violet-wash','Violet Wash','Nền tím'],['shadow-hit','Shadow Hit','Cắt sáng'],['h-scroll','Horizontal Roll','Cuộn ngang'],['v-scroll','Vertical Roll','Cuộn dọc'],
 ['diagonal','Diagonal Drift','Di chuyển chéo'],['swirl','Swirl Spin','Xoay mềm'],['mirror','Mirror Rush','Gương đối xứng'],['rgb-tear','RGB Tear','Lệch RGB'],
 ['glitch','Glitch Jitter','Giật nhịp'],['punch','Punch Zoom','Zoom nhấn'],['pendulum','Pendulum','Lắc qua lại'],['lens','Lens Breathe','Nhịp thở'],
 ['beat','Beat Pulse','Nhún theo beat'],['impact','Impact Flash','Flash nhấn'],['neon','Neon Motion','Neon chuyển'],['finale','Finale Burst','Tổng kết']
 ];
 const names=new Map(FX.map(x=>[x[0],x[1]]));
 const colors=[['white','Trắng',0],['cyan','Cyan',.48],['amber','Amber',-.11],['pink','Pink',.83],['lime','Lime',.24]];
 const legacyMap={prism:'rgb-hit',spectrum:'color-flow',duotone:'violet-wash',rgbcycle:'rgb-tear',noir:'shadow-hit',poster:'amber-burst',scanline:'v-scroll',mosaic:'glitch',wave_x:'h-scroll',wave_y:'v-scroll',swirl:'swirl',kaleido:'mirror',glitch:'glitch',slice:'diagonal',zoom:'punch',spin:'pendulum',lens:'lens',checker:'impact',rays:'neon',spark:'finale'};
 const L={open:false,tab:'vj',selected:0,layers:[null,null,null],color:'white',intensity:.78,duration:4,fade:.2};
 let panel,content,status,mountedTo=null,updating=false;
 const label=id=>names.get(id)||id;
 function report(msg){if(status)status.textContent=msg;}
 function active(){return L.layers[L.selected];}
 function reset(){L.layers=[null,null,null];L.color='white';resetFX10(false);refreshPads();report(uiText("Đã reset VJ FX","VJ effects reset"));}
 function flash(){stage10.flashUntil=performance.now()+160;live.flashHold=false;report('FLASH / 160 ms');}
 function trigger(id){if(!names.has(id))return;engine.globalTest=false;stage10.ledVisible=true;
   const current=active();L.layers[L.selected]=current?.id===id?null:{id,at:state.time,gain:L.intensity};
   if(!state.playing)setPlaying(true);refreshPads();report((active()?'RUN / ':'STOP / ')+label(id));
 }
 function setColor(id){if(!colors.some(c=>c[0]===id))return;L.color=id;refreshPads();report('COLOR SHIFT / '+id.toUpperCase());}
 const br=(t,v=1)=>Math.max(0,Math.sin(t)*v),osc=t=>Math.sin(t),sq=t=>Math.sin(t)>=0?1:0;
 function parameters(id,age){const x=Math.max(0,age),s=osc,beat=x*2.5,p={};
   switch(id){
   case 'rgb-hit':p.rgb=.75;p.pulse=.28;p.flash=.15*br(x*5);break;
   case 'color-flow':p.hue=.13*s(x*.65);p.rollX=.10;break;
   case 'cyan-wave':p.hue=.45;p.rollX=.23;p.pulse=.15;break;
   case 'amber-burst':p.hue=-.10;p.zoom=1.15;p.flash=.22*br(x*3);break;
   case 'violet-wash':p.hue=.70;p.rollY=.06;p.pulse=.10;break;
   case 'shadow-hit':p.invert=sq(x*1.6);p.rgb=.18;break;
   case 'h-scroll':p.rollX=.72;break;
   case 'v-scroll':p.rollY=.72;break;
   case 'diagonal':p.rollX=.32;p.rollY=.26;break;
   case 'swirl':p.rotate=.34;p.zoom=1.08;break;
   case 'mirror':p.mirror=1;p.rollX=.32;break;
   case 'rgb-tear':p.rgb=.94;p.rollX=.18;break;
   case 'glitch':p.rollX=.55*s(x*9);p.rollY=.14*s(x*11);p.rgb=.72;break;
   case 'punch':p.zoom=1+.20*br(x*4);p.pulse=.60;break;
   case 'pendulum':p.rotate=.30*s(x*1.9);break;
   case 'lens':p.zoom=1+.14*(.5+.5*s(x*2.1));p.pulse=.22;break;
   case 'beat':p.pulse=.85;p.zoom=1+.07*br(x*4);break;
   case 'impact':p.flash=.68*br(x*4);p.pulse=.24;break;
   case 'neon':p.hue=.24*s(x*.8);p.rgb=.48;p.rotate=.12;break;
   case 'finale':p.rollX=.21;p.rotate=.20;p.rgb=.65;p.pulse=.65;p.flash=.26*br(x*3);break;
   }return p;
 }
 function fromClipSource(src){src=String(src||'');if(src.startsWith('vj130:'))return src.slice(6);
   if(src.startsWith('macro130:'))return src.slice(9);
   if(src.startsWith('vj129:'))return legacyMap[src.slice(6)]||null;
   return null;
 }
 function timedLayers(t){const out=L.layers.map(x=>x?{...x}:null);
   if(seq.enabled){
    for(const {c}of activeClips(t,'vj')){
     const id=fromClipSource(c.source);if(!names.has(id))continue;
     const slot=limit(c.layer130??c.layer129??0,0,2)|0;
     const age=t-c.start,left=c.start+c.duration-t,fade=limit(c.fade??0,0,c.duration*.48);
     const envelope=fade>0?limit(Math.min(age, left)/fade,0,1):1;
     out[slot]={id,at:c.start,gain:limit(c.gain??.8,0,1.3)*envelope};
    }
   }
   return out;
 }
 function colorAt(t){let hue=colors.find(x=>x[0]===L.color)?.[2]||0;
   if(seq.enabled)for(const {c} of activeClips(t,'vj')){
    const src=String(c.source||'');const m=src.match(/^(?:vj130:|vj129:)tint:(.+)$/);
    if(!m)continue;
    let key=m[1];if(key.startsWith('#'))key=key.slice(1);
    if(/^[0-9a-f]{6}$/i.test(key)){const legacy={'34dcec':'cyan','f68139':'amber','ed51c2':'pink','a8f264':'lime'};key=legacy[key]||'white';}
    const old=colors.find(x=>x[0]===key);if(old){const fade=limit(c.fade??0,0,c.duration*.46),e=fade?limit(Math.min(t-c.start,c.start+c.duration-t)/fade,0,1):1;hue=old[2]*e;}
   }return hue;
 }
 function fxAt(t){let out={rollX:0,rollY:0,rotate:0,mirror:0,invert:0,rgb:0,pulse:0,zoom:1,hue:colorAt(t),flash:0};
   for(const entry of timedLayers(t)){if(!entry||!names.has(entry.id))continue;
     const params=parameters(entry.id,t-entry.at),gain=limit(entry.gain,0,1.3);
     for(const [key,value]of Object.entries(params)){
      if(key==='zoom')out.zoom+=((value||1)-1)*gain;
      else if(key==='mirror'||key==='invert')out[key]=Math.max(out[key],(value||0)*gain);
      else if(key==='flash')out.flash=Math.max(out.flash,(value||0)*gain);
      else out[key]+=(value||0)*gain;
     }
   }
   return out;
 }
 const priorApply=applyLiveUniforms;
 applyLiveUniforms=function(surface){priorApply.call(this,surface);if(this.globalTest||surface.source==='test')return;
   const t=stage10.previewTime??state.time,p=fxAt(t);
   for(const key of ['rollX','rollY','rotate','mirror','invert','rgb','pulse']){
     const name={rollX:'uRollX10',rollY:'uRollY10',rotate:'uRotate10',mirror:'uMirror10',invert:'uInvert10',rgb:'uRGB10',pulse:'uPulse10'}[key];
     const base=stage10.fx[key]||0,maximum=['mirror','invert'].includes(key)?1:1.6;
     this.uniform(name,limit(base+p[key],key==='rollX'||key==='rollY'||key==='rotate'?-1.6:0,maximum));
   }
   this.uniform('uVJHue',limit(live.hue+p.hue,-1,1));
   this.uniform('uVJZoom',limit(live.zoom+p.zoom-1,1,2));
   const baseFlash=stage10.flashUntil>performance.now()?1:live.flashHold?1:Math.min(1,live.flashLeft*8);
   this.uniform('uVJFlash',limit(Math.max(baseFlash,p.flash),0,1));
 };
 const prevSource=sourceOptions;
 sourceOptions=function(type,value){const core=prevSource(type,value);if(type!=='vj')return core;
   return core+FX.map(([id,n])=>`<option value="vj130:${id}" ${value==='vj130:'+id?'selected':''}>VJ / ${n}</option>`).join('');
 };
 function serialize(){return {layers:L.layers.map(x=>x?{...x}:null),color:L.color,intensity:L.intensity,duration:L.duration,fade:L.fade};}
 function deserialize(s){L.layers=Array.from({length:3},(_,i)=>{const x=s?.layers?.[i];let id=x?.id||legacyMap[x?.slug]||x?.slug;return names.has(id)?{id,at:limit(x.at??x.start,0,600),gain:limit(x.gain??x.mix,.1,1.3)}:null;});
   L.color=colors.some(c=>c[0]===s?.color)?s.color:'white';L.intensity=limit(s?.intensity??s?.amount,.1,1.3);L.duration=limit(s?.duration,.2,30);L.fade=limit(s?.fade,0,10);refreshPads();
 }
 const oldPack=packLiveExtras,oldRestoreLive=restoreLiveExtras,oldSnapshot=snapshot,oldRestore=restore;
 packLiveExtras=async function(){const d=await oldPack();d.vj130=serialize();return d;};
 restoreLiveExtras=async function(d){await oldRestoreLive(d);deserialize(d?.vj130||d?.vj129);};
 snapshot=function(){const d=oldSnapshot();d.vj130=serialize();return d;};
 restore=function(d){oldRestore(d);deserialize(d?.vj130||d?.vj129);};
 function createClip(color=false){
   const fx=active();if(!color&&!fx){report(uiText("Chọn hiệu ứng trước khi ghi cue.","Select an effect before recording a cue."));return;}
   if(color&&L.color==='white'){report(uiText("Chọn màu trước khi ghi cue.","Select a color before recording a cue."));return;}
   try {
     const dest=color?'color':String(L.selected);
     const tr=track10('vj','vj130:'+dest,color?'VJ / màu':'VJ / lớp '+('ABC'[L.selected]));
     const start=limit(state.time,0,599.95),dur=limit(L.duration,.2,Math.max(.2,state.duration-start));
     const cue=addClip(tr.id,{source:color?'vj130:tint:'+L.color:'vj130:'+fx.id,
       name:color?'COLOR / '+L.color:('ABC'[L.selected])+' / '+label(fx.id),start,duration:dur,
       layer130:color?'color':L.selected,gain:color?1:fx.gain,fade:limit(L.fade,0,dur*.45),loop:false});
     if(!cue){report(uiText("Không thể thêm cue.","Could not add cue."));return;}
     if(color)L.color='white';else L.layers[L.selected]=null;
     enableSequence(true);refreshPads();renderTimelineMini();report(uiText("Đã thêm timecode tại ","Added timecode at ")+start.toFixed(2)+'s');
   }catch(e){report(uiText("Lỗi timecode: ","Timecode error: ")+e.message);}
 }
 function refreshPads(){if(!panel)return;
   panel.querySelectorAll('[data-v130-slot]').forEach(b=>{const i=+b.dataset.v130Slot;b.classList.toggle('active',L.selected===i);const name=b.querySelector('small');if(name)name.textContent=L.layers[i]?label(L.layers[i].id):uiText("Trống","Empty");});
   panel.querySelectorAll('[data-v130-pad]').forEach(b=>b.classList.toggle('active',active()?.id===b.dataset.v130Pad));
   panel.querySelectorAll('[data-v130-color]').forEach(b=>b.classList.toggle('active',L.color===b.dataset.v130Color));
 }
 function renderTimelineMini(){const host=$('v130Mini');if(!host)return;const clips=seq.clips.filter(c=>/^(?:vj130:|vj129:|macro130:)/.test(String(c.source||'')));
   const groups=['A','B','C'];host.innerHTML=groups.map((g,i)=>{
    const count=clips.filter(c=>c.layer130===i||c.layer129===i).length;
    return `<span style="padding:4px 7px;background:var(--bg-field);border-radius:4px;margin-right:4px">${g}: ${count} cue</span>`;
   }).join('')+`<small style="display:block;margin-top:5px;color:var(--text-secondary)">${uiText("Timeline chung: ","Show timeline: ")}${state.time.toFixed(2)}s / ${state.duration}s</small>`;
 }
 function renderVJ(){content.innerHTML=`
 <div class="vj130-title">${uiText("TRÌNH DIỄN / BẤM LÀ CHẠY","Performance / tap to run")}</div>
 <div class="vj130-row"><button class="vj130-btn" id="v130Flash">FLASH</button><button class="vj130-btn" id="v130Black">BLACKOUT</button><button class="vj130-btn" id="v130Arm">ARM STROBE</button><button class="vj130-btn" id="v130Reset">RESET</button></div>
 <div class="vj130-title">${uiText("BA LỚP FX ĐỘC LẬP","Three independent FX layers")}</div>
 <div class="vj130-slots">${L.layers.map((x,i)=>`<button data-v130-slot="${i}"><b>${uiText("LAYER ","Layer ")}${'ABC'[i]}</b><small>${x?label(x.id):uiText("Trống","Empty")}</small></button>`).join('')}</div>
 <label class="vj130-range"><span>${uiText("Cường độ FX","FX intensity")}</span><input id="v130Intensity" type="range" min=".1" max="1.3" step=".05" value="${L.intensity}" aria-label="FX intensity"></label>
 <div class="vj130-title">${uiText("20 TỔ HỢP VJ / MOTION","20 VJ / motion combinations")}</div>
 <div class="vj130-pads">${FX.map(([id,name,detail])=>`<button data-v130-pad="${id}" title="${name}"><b>${name}</b><small>${displayName(detail)}</small></button>`).join('')}</div>
 <div class="vj130-title">${uiText("ĐỔI MÀU / LIVE COLOR SHIFT","Live color shift")}</div>
 <div class="vj130-colors">${colors.map(([id,title])=>`<button data-v130-color="${id}" aria-label="${uiText("Màu ","Color ")}${displayName(title)}" title="${displayName(title)}" style="background:${{white:'#fff',cyan:'#3cdde0',amber:'#f8a04a',pink:'#de4cbe',lime:'#9ad95a'}[id]}"></button>`).join('')}</div>
 <div class="vj130-title">${uiText("GHI FX / MÀU THÀNH TIMECODE","Record effects / color to timecode")}</div>
 <div class="vj130-range"><span>${uiText("Thời lượng (giây)","Duration (seconds)")}</span><input id="v130Dur" type="number" min=".2" max="30" step=".1" value="${L.duration}"></div>
 <div class="vj130-range"><span>${uiText("Fade (giây)","Fade (seconds)")}</span><input id="v130Fade" type="number" min="0" max="10" step=".05" value="${L.fade}"></div>
 <div class="vj130-row"><button id="v130AddFX" class="vj130-btn">${uiText("+ FX VÀO TIMELINE","+ FX to timeline")}</button><button id="v130AddColor" class="vj130-btn">${uiText("+ CUE MÀU","+ Color cue")}</button></div>
 <div class="vj130-box"><b>${uiText("TRẠNG THÁI TIMECODE","Timecode status")}</b><div id="v130Mini"></div></div>
 <p class="vj130-warning">${uiText("Các nút là 20 tổ hợp từ bộ shader ổn định V12.8, không phải 20 thuật toán shader mới. Mapping UV và kích thước LED không thay đổi. Nháy đèn nhanh chỉ hoạt động sau khi cho phép.","These buttons combine 20 effects from the existing shader. UV mapping and LED dimensions stay unchanged. Enable rapid flashing before use.")}</p>`;
   content.querySelectorAll('[data-v130-slot]').forEach(b=>b.onclick=()=>{L.selected=+b.dataset.v130Slot;refreshPads();});
   content.querySelectorAll('[data-v130-pad]').forEach(b=>b.onclick=()=>trigger(b.dataset.v130Pad));
   content.querySelectorAll('[data-v130-color]').forEach(b=>b.onclick=()=>setColor(b.dataset.v130Color));
   $('v130Flash').onclick=flash;
   $('v130Black').onclick=()=>{live.blackout=!live.blackout;report(live.blackout?'BLACKOUT ON':'BLACKOUT OFF');$('v130Black').classList.toggle('active',live.blackout);};
   $('v130Arm').onclick=()=>{live.strobeArmed=!live.strobeArmed;live.strobeHold=false;seq.strobe=live.strobeArmed;report(live.strobeArmed?uiText("STROBE ARMED (giữ V khi dùng)","Strobe enabled (hold V to use)"):'STROBE DISARMED');$('v130Arm').classList.toggle('active',live.strobeArmed);};
   $('v130Reset').onclick=reset;
   $('v130Intensity').oninput=e=>{L.intensity=limit(e.target.value,.1,1.3);if(active())active().gain=L.intensity;};
   $('v130Dur').oninput=e=>L.duration=limit(e.target.value,.2,30);
   $('v130Fade').oninput=e=>L.fade=limit(e.target.value,0,10);
   $('v130AddFX').onclick=()=>createClip(false);$('v130AddColor').onclick=()=>createClip(true);
   $('v130Black').classList.toggle('active',live.blackout);
   $('v130Arm').classList.toggle('active',live.strobeArmed);
   refreshPads();renderTimelineMini();
 }
 function renderMixer(){content.innerHTML=`<div class="vj130-title">${uiText("ÂM THANH / MIXER TRONG SHOW","Show audio mixer")}</div>
   <div class="vj130-row"><button id="v130EnableAudio" class="vj130-btn">${live.audioEnabled?'AUDIO ON':uiText("Bật audio","Enable audio")}</button><button id="v130Test" class="vj130-btn">${uiText("THỬ LOA","Test speakers")}</button><button id="v130LoadMusic" class="vj130-btn">${uiText("+ NHẠC","+ Music")}</button></div>
   <div class="vj130-title">${uiText("4 FADER RIÊNG","Four separate faders")}</div>
   ${[['master','MASTER'],['video','VIDEO'],['music','MUSIC'],['room','ROOM']].map(([id,title])=>`<div class="vj130-box"><b>${title}</b><output id="v130Val_${id}" style="float:right">${Math.round(stage10.audio[id]*100)}%</output><input class="vj130-fader" type="range" min="0" max="${id==='room'?'.4':'2'}" step=".01" value="${stage10.audio[id]}" data-v130-fader="${id}" aria-label="${title} volume"></div>`).join('')}
   <div class="vj130-title">${uiText("NGUỒN ÂM","Audio source")}</div><select id="v130AudioMode"><option value="video">${uiText("Tiếng video","Video audio")}</option><option value="music">${uiText("Nhạc riêng","Separate music")}</option><option value="mix">${uiText("Video + Nhạc","Video + music")}</option></select>
   <div class="vj130-row"><button class="vj130-btn" id="v130Unity">100%</button><button class="vj130-btn" id="v1303db">+3 dB</button><button class="vj130-btn" id="v1306db">+6 dB</button></div>
   <p class="vj130-warning">${uiText("Cần bấm BẬT AUDIO để trình duyệt cho phép phát tiếng. Bắt đầu âm lượng thấp khi dùng loa ngoài.","Select Enable audio to allow browser playback. Start at low volume when using external speakers.")}</p>`;
   $('v130EnableAudio').onclick=async()=>{try{await enableAudio(!live.audioEnabled);$('v130EnableAudio').textContent=live.audioEnabled?'AUDIO ON':uiText("Bật audio","Enable audio");report(live.audioEnabled?uiText("Đã bật âm thanh","Audio enabled"):uiText("Đã tắt âm thanh","Audio disabled"));}catch(e){report(uiText("Lỗi audio: ","Audio error: ")+e.message);}};
   $('v130Test').onclick=()=>testSpeakers();$('v130LoadMusic').onclick=()=>$('musicInput')?.click();
   $('v130AudioMode').value=live.audioMode;
   $('v130AudioMode').onchange=e=>{live.audioMode=e.target.value;routeAudio();syncMusic(true);};
   content.querySelectorAll('[data-v130-fader]').forEach(el=>el.oninput=()=>{changeFader10(el.dataset.v130Fader,+el.value);$('v130Val_'+el.dataset.v130Fader).textContent=Math.round(+el.value*100)+'%';});
   for(const [b,v]of [['v130Unity',1],['v1303db',Math.SQRT2],['v1306db',2]])$(b).onclick=()=>{changeFader10('master',v);content.querySelector('[data-v130-fader="master"]').value=v;$('v130Val_master').textContent=Math.round(v*100)+'%';};
 }
 function renderPanel(){if(!content)return;panel.querySelector('[data-v130-tab="vj"]').classList.toggle('active',L.tab==='vj');panel.querySelector('[data-v130-tab="mixer"]').classList.toggle('active',L.tab==='mixer');
   if(L.tab==='vj')renderVJ();else renderMixer();report('V13.0 STABLE / '+(state.presenting?uiText("Trình diễn","Performance"):uiText("Chỉnh sửa","Editing")));
 }
 function createPanel(){panel=document.createElement('aside');panel.id='v130Panel';panel.hidden=true;panel.innerHTML=`
    <div class="vj130-head"><div><strong>ALPHA / LIVE STUDIO</strong><div class="vj130-sub">V12.8 STABLE CORE · VJ / MIXER</div></div><button id="v130Close" aria-label="${uiText("Đóng bảng","Close panel")}"><svg class=ico aria-hidden=true><use href=#i-x></use></svg></button></div>
    <div class="vj130-tabs"><button data-v130-tab="vj">VJ / 20 FX</button><button data-v130-tab="mixer">MIXER</button></div><div class="vj130-scroll" id="v130Content"></div><div class="vj130-footer" id="v130Status">READY</div>`;
   root.appendChild(panel);content=$('v130Content');status=$('v130Status');
   $('v130Close').onclick=()=>open(null);
   panel.querySelectorAll('[data-v130-tab]').forEach(b=>b.onclick=()=>open(b.dataset.v130Tab));
 }
 function updateHost(){if(!L.open)return;
   const present=!!state.presenting;
   const to=present?document.body:root;
   if(panel.parentElement!==to)to.appendChild(panel);
   document.body.classList.toggle('v130-present-open',present);
   document.body.classList.toggle('v130-edit-open',!present);
   panel.hidden=false;
   document.querySelectorAll('[data-v130-open]').forEach(b=>b.classList.toggle('active',L.open&&b.dataset.v130Open===L.tab));
 }
 function open(tab){if(L.open&&L.tab===tab)tab=null;
   if(!tab){L.open=false;panel.hidden=true;document.body.classList.remove('v130-edit-open','v130-present-open');if(panel.parentElement!==root)root.appendChild(panel);return;}
   if(!state.presenting){
     $('pro127close')?.click();
     $('liftClose124')?.click();
   }
   L.open=true;L.tab=tab;
   if(tab==='vj'){engine.globalTest=false;stage10.ledVisible=true;}
   updateHost();renderPanel();
 }
 function installButton(host,tag,id){if(!host||host.querySelector(tag))return;
   const span=document.createElement('span');span.id=id;
   span.innerHTML='<button data-v130-open="vj">VJ PRO</button><button data-v130-open="mixer">MIXER</button>';
   host.appendChild(span);span.querySelectorAll('[data-v130-open]').forEach(b=>b.onclick=()=>open(b.dataset.v130Open));
 }
 function installButtons(){
   const bar=$('pro127bar');if(bar)installButton(bar,'#v130Toolbar','v130Toolbar');
   const controls=$('presentControls')?.querySelector('.show-row');
   if(controls&&!$('v130PresentButtons')){const span=document.createElement('span');span.id='v130PresentButtons';span.hidden=true;span.innerHTML='<button data-v130-open="vj">VJ FX</button><button data-v130-open="mixer">MIXER</button>';controls.prepend(span);span.querySelectorAll('[data-v130-open]').forEach(b=>b.onclick=()=>open(b.dataset.v130Open));}
   const oldShow=$('showVJ');if(oldShow&&!oldShow.dataset.v130Hook){oldShow.dataset.v130Hook='1';oldShow.addEventListener('click',e=>{if(state.presenting){e.preventDefault();e.stopImmediatePropagation();open('vj');}},true);}
   const oldShowAudio=$('showAudio');if(oldShowAudio&&!oldShowAudio.dataset.v130Hook){oldShowAudio.dataset.v130Hook='1';oldShowAudio.addEventListener('click',e=>{if(state.presenting){e.preventDefault();e.stopImmediatePropagation();open('mixer');}},true);}
 }
 function install(){createPanel();installButtons();
   window.addEventListener("ledstudio:locale",()=>window.translateUiText?.(panel));
   const b=$('pro127bar');if(b){const m=new MutationObserver(()=>{if(!b.querySelector('#v130Toolbar'))installButtons();});m.observe(b,{childList:true});}
   const m2=new MutationObserver(()=>{if(L.open)updateHost();});m2.observe(document.body,{attributes:true,attributeFilter:['class']});
   window.addEventListener('blur',()=>live.strobeHold=false);
   window.addEventListener('keydown',e=>{if(!L.open||L.tab!=='vj'||e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.('input,select,textarea')||$('modal')?.open)return;
     if(/^Digit[0-9]$/.test(e.code)){const n=(+e.code.slice(-1)||10)-1+(e.shiftKey?10:0);if(FX[n]){e.preventDefault();e.stopImmediatePropagation();trigger(FX[n][0]);}}
     if(e.key==='Escape'){open(null);}
     if(e.key.toLowerCase()==='v'&&live.strobeArmed){live.strobeHold=true;e.preventDefault();}
     if(e.key.toLowerCase()==='c'){flash();e.preventDefault();}
   },true);
   window.addEventListener('keyup',e=>{if(e.key.toLowerCase()==='v')live.strobeHold=false;},true);
   const previousTitle=document.title;document.title='ALPHA Creative LED Studio V13.0 / STABLE PRO';
   const brandSmall=document.querySelector('.brand small');if(brandSmall)brandSmall.textContent='STABLE';
   S.version='13.0.0';S.vj130={open,trigger,fxAt,reset,state:()=>structuredClone(serialize()),presets:FX.map(x=>x[0])};
   const updateMini=()=>{if(!L.open||L.tab!=='vj')return;const el=$('v130Mini');if(el&&!el.matches(':hover')){const small=el.querySelector('small');if(small)small.textContent=`${uiText("Timeline chung: ","Show timeline: ")}${state.time.toFixed(2)}s / ${state.duration}s`;}};setInterval(updateMini,250);
 }
 install();
 }catch(err){console.error('V13.0 add-on disabled; core V12.8 remains available',err);}
})();
