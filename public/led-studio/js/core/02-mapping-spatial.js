/* Creative LED Studio 0.3.1 / Mapping Fix - authored application source. */
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const uiTextPairs=new Map();
function tr(vi,en){
 if(typeof vi==='string'&&typeof en==='string'){
  const key=vi.trim().replaceAll('&amp;','&'),value=en.trim().replaceAll('&amp;','&');
  if(!uiTextPairs.has(key)){const pair=[key,value];uiTextPairs.set(key,pair);uiTextPairs.set(value,pair);}
 }
 return (document.documentElement.dataset.locale||window.STUDIO?.cloud16?.state?.locale)==='en'?en:vi;
}
function translateUiText(root=document.body){
 if(!root||!document.createTreeWalker)return;
 const en=(document.documentElement.dataset.locale||window.STUDIO?.cloud16?.state?.locale)==='en';
 const skip='script,style,textarea,input,svg,canvas,[contenteditable],[data-user-content],#projectName,#objectList,#mediaList,#hudLabels,#aiChat18Messages,.seq-label,.track-label,.surface-name';
 const translate=value=>{const pair=uiTextPairs.get(value.trim());return pair?value.replace(value.trim(),pair[en?1:0]):value;};
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){const n=walker.currentNode;if(!n.parentElement?.closest(skip)){const text=translate(n.nodeValue);if(text!==n.nodeValue)n.nodeValue=text;}}
 for(const el of root.querySelectorAll('[title],[aria-label],[placeholder]')){
  if(el.closest('[data-user-content]'))continue;
  for(const attr of ['title','aria-label','placeholder']){const v=el.getAttribute(attr);if(v){const text=translate(v);if(text!==v)el.setAttribute(attr,text);}}
 }
}
const OBJECT_NAME_PAIRS=[
 ['Sàn sân khấu chính','Stage platform'],['Mặt sàn không gian','Environment floor'],['Bậc tam cấp','Front step'],['Khe ghép sàn module','Module joint'],['Dải LED viền sàn','Front edge strip'],
 ['Màn LED chính','LED_MAIN'],['Khung màn LED chính','Frame_MAIN'],
 ['Màn LED cánh trái','LED_WING_L'],['Khung LED cánh trái','Frame_WING_L'],
 ['Màn LED cánh phải','LED_WING_R'],['Khung LED cánh phải','Frame_WING_R'],
 ['LED viền đứng trái','LED_LINE_L'],['Khung LED viền trái','Frame_LINE_L'],
 ['LED viền đứng phải','LED_LINE_R'],['Khung LED viền phải','Frame_LINE_R'],
 ['LED tiêu đề ngang','LED_HEADER'],['Khung LED tiêu đề','Frame_HEADER'],
 ['Màn LED chính giữa','LED_MAIN_CENTER'],['Màn LED cánh trái','LED_WING_LEFT'],['Màn LED cánh phải','LED_WING_RIGHT'],
 ['Màn LED cánh trái 1','LED_WING_L1'],['Màn LED cánh phải 1','LED_WING_R1'],
 ['Màn LED cánh trái 2','LED_WING_L2'],['Màn LED cánh phải 2','LED_WING_R2'],
 ['Cột Truss đứng','Truss vertical'],['Thanh giằng Truss','Truss brace'],['Đà ngang Truss','Truss crossbar'],['Thanh chéo Truss','Truss diagonal'],
 ['Cụm loa Line Array','PA line array'],['Màn LED 4 góc','Quad LED'],['Đèn Moving Head','Moving head'],
 ['mặt phẳng','face'],['điểm chiếu','aim'],['nguồn phát','emitter'],
 ['Ca sĩ','Singer'],['Nghệ sĩ Guitar','Guitarist'],['Nghệ sĩ Keyboard','Keyboardist'],['Tay trống','Drummer'],
 ['Vũ công','Dancer'],['Khán giả','Audience'],['Vũ công LED','LED dancer'],['Nghệ sĩ trống nước','Water drummer'],
 ['Vũ công Laser','Laser dancer'],['Vũ công quạt / lụa','Fan / silk dancer'],['DJ / Nhà sản xuất','DJ / Producer'],
 ['Nghệ sĩ Violin','Violinist'],['Nghệ sĩ Saxophone','Saxophonist'],['MC / Diễn giả','MC / Speaker'],
 ['Rapper / Khuấy động','Rapper / Hype'],['Kỹ thuật viên sân khấu','Stagehand'],
 ['Múa LED','LED dance'],['Trống nước','Water drums'],['Múa Laser','Laser dance'],['Vũ đoàn','Dance troupe'],
 ['Ban nhạc','Live band'],['Ca sĩ chính','Headline vocal'],['Múa quạt','Fan dance'],
 ['Khoảnh khắc tâm điểm','Stage key moment'],['Múa lụa','Silk ribbon dance'],['Ban nhạc Live Concert','Live concert band'],
 ['Tiết mục DJ EDM Festival','DJ EDM Festival Drop'],['Khai mạc Gala & MC','Gala opening & MC'],
 ['Trụ Truss Đứng 3.6m','3.6m upright truss tower'],['Cổng Truss Goalpost 6m','6m goalpost truss arch'],
 ['Cụm Loa Line Array (6 thùng)','Line array (6 cabinets)'],['Cụm Loa Sub Đôi 18"','Dual 18" subwoofer stack'],
 ['Cột LED Totem Đứng 1×3m','1×3m LED totem'],['Bàn DJ Booth LED 2.4m','2.4m LED DJ booth'],
 ['Bục Sân Khấu Riser 2×1.5m','2×1.5m stage riser'],['Bậc Thang Sân Khấu 4 Bậc','Four-step stage stairs'],
 ['Rào Chắn Khán Giả Mojo 2m','2m Mojo crowd barrier'],['Vòng LED Kinetic Ø2.4m','Ø2.4m kinetic LED ring'],
 ['Súng Cột Khói CO2','CO2 jet'],['Bục Phát Biểu & Cầu Khai Mạc','VIP lectern & opening sphere'],
 ['Cổng Chào LED Vòm 5m','5m LED entrance arch'],['Sàn Catwalk Chữ T 4m','4m T-shaped catwalk'],
 ['Backdrop Check-in Vòm Sự Kiện 4m','4m event arch backdrop'],['Bàn Tròn Tiệc Gala 10 Ghế (Ø1.8m)','Ø1.8m gala table with 10 chairs'],
 ['Bàn Đại Biểu Hội Nghị IBM 1.8m','1.8m IBM conference table'],['Ghế Banquet Sự Kiện Áo Nơ VIP','VIP banquet chair with sash'],
 ['Bàn Điều Khiển FOH Âm Thanh / Ánh Sáng','FOH audio / lighting booth'],['Chậu Cây Cảnh Sân Khấu / Cánh Gà','Stage / wing planter'],
 ['Máy Phun Sương Haze Sân Khấu 1500W','1500W stage haze machine'],['Máy Pháo Điện Lạnh Sparkular 700W','700W Sparkular cold spark fountain'],
 ['Đế trụ Truss','Truss Baseplate'],['Ống chính Truss','Truss Chord'],['Thanh ngang Truss X','Truss Rung X'],['Thanh ngang Truss Z','Truss Rung Z'],
 ['Đế cổng Truss','Truss Arch Base'],['Chân trụ cổng Truss','Truss Tower Leg'],['Đà ngang cổng Truss','Truss Arch Span'],
 ['Khung treo Line Array','Line Array Bumper'],['Thùng loa Line Array','Line Array Cabinet'],['Lưới mặt loa','Speaker Grille'],
 ['Thùng loa Sub 18"','Subwoofer 18'],['Lỗ thông hơi Sub','Sub Port'],
 ['Đế cột Totem','Totem Base'],['Khung cột Totem','Totem Frame'],['Màn hình LED Totem','LED Totem Screen'],
 ['Thân bàn DJ','DJ Booth Body'],['Mặt bàn DJ','DJ Deck Table'],['Bàn trộn CDJ / Mixer','CDJ / Mixer'],['Màn hình LED bàn DJ','LED DJ Booth Screen'],
 ['Mặt bục Riser','Stage Riser Deck'],['Chân bục Riser','Riser Leg'],['Bậc thang sân khấu','Stage Step'],
 ['Tấm đế rào chắn','Barrier Footplate'],['Vách rào chắn','Barrier Wall'],['Tay vịn rào chắn','Barrier Top Rail'],
 ['Vòng LED Kinetic','Kinetic LED Ring'],['Hộp đế súng CO2','CO2 Base Housing'],['Đầu phun CO2','CO2 Nozzle'],
 ['Luồng khói CO2 tầng dưới','CO2 Cryo Plume Lower'],['Luồng khói CO2 tầng trên','CO2 Cryo Plume Upper'],
 ['Đế bục phát biểu VIP','VIP Podium Base'],['Thân bục phát biểu VIP','VIP Podium Column'],['Dải LED bục VIP','VIP LED Crest'],
 ['Mặt bàn phát biểu VIP','VIP Lectern Top'],['Quả cầu chạm khai mạc','Ceremony Touch Sphere'],
 ['Đế cổng chào LED','Arch Gate Base'],['Trụ cổng chào LED','LED Gate Pillar'],['Đà ngang cổng chào LED','LED Gate Header'],
 ['Thân chính sàn Catwalk','Catwalk Main Stem'],['Đầu chữ T sàn Catwalk','Catwalk Front T-Head'],
 ['Viền LED Catwalk trái','Catwalk LED Trim L'],['Viền LED Catwalk phải','Catwalk LED Trim R'],['Viền LED Catwalk trước','Catwalk LED Trim Front'],
 ['Bục nền Backdrop','Backdrop Base Platform'],['Tấm Backdrop trung tâm','Backdrop Center Panel'],['Cánh Backdrop trái','Backdrop Left Wing'],['Cánh Backdrop phải','Backdrop Right Wing'],
 ['Chân trụ bàn Gala','Gala Table Pedestal'],['Mặt bàn Gala Ø1.8m','Gala Table Top Ø1.8m'],['Đệm ghế Gala','Gala Chair Seat'],['Tựa lưng ghế Gala','Gala Chair Back'],
 ['Khăn phủ bàn IBM','IBM Table Skirt'],['Mặt bàn IBM','IBM Table Top'],['Đệm ghế VIP','VIP Chair Seat'],['Tựa lưng ghế VIP','VIP Chair Back'],
 ['Đệm ghế Banquet','Banquet Seat'],['Chân ghế Banquet','Banquet Legs'],['Tựa lưng ghế Banquet','Banquet Backrest'],['Nơ vàng ghế Banquet','Banquet Gold Sash'],
 ['Sàn nâng kỹ thuật FOH','FOH Riser Deck'],['Bàn điều khiển FOH','FOH Console Desk'],['Bàn điều khiển đèn GrandMA','GrandMA Lighting Console'],['Bàn trộn âm thanh số','Digital Audio Mixer'],
 ['Chậu cây cảnh','Planter Box'],['Tán cây trung tâm','Foliage Cluster Center'],['Tán cây bên trái','Foliage Cluster Left'],['Tán cây bên phải','Foliage Cluster Right'],
 ['Thùng máy phun sương Haze','Haze Flightcase'],['Khe phun sương Haze','Haze Nozzle Vent'],['Đế máy pháo điện Sparkular','Sparkular Base'],['Tia pháo điện lạnh','Cold Spark Plume'],
 ['Moving Head Spot 350W (Tách Yoke/Head DMX)','Moving Head Spot 350W (DMX yoke / head)'],
 ['Beam 230 7R Moving Head (Tách Yoke/Head DMX)','Beam 230 7R Moving Head (DMX yoke / head)'],
 ['Moving Head Wash Zoom 36×18W (Tách Yoke/Head DMX)','Moving Head Wash Zoom 36×18W (DMX yoke / head)'],
 ['Par LED 54×3W RGBW (Tách Yoke/Head DMX)','Par LED 54×3W RGBW (DMX yoke / head)'],
 ['Đèn Thanh Katana LED Matrix Bar 1m (Tách Yoke/Head DMX)','Katana LED Matrix Bar 1m (DMX yoke / head)'],
 ['Cổng Hơi Sự Kiện 6×4m','6×4m inflatable event arch'],['Ghế Tiệc Cưới Chiavari Vàng Kim','Gold Chiavari wedding chair'],
 ['Sofa VIP Talkshow 3 Chỗ 1.8m','1.8m three-seat VIP talkshow sofa'],['Bàn Tiệc Tròn Gala 1.8m','1.8m round gala table'],
 ['Ghế Hội Nghị Đại Biểu Khung Đồng','Brass-frame VIP conference chair'],['Bục Phát Biểu & Bàn Lễ Tân VIP Gỗ Sồi','Oak VIP lectern & reception desk'],
 ['Chậu Cây Cảnh Nhiệt Đới Sân Khấu','Tropical stage planter'],['Đèn Chùm Pha Lê Gala / Tiệc Cưới','Crystal gala / wedding chandelier'],
 ['Kệ Trưng Bày Cúp & Sản Phẩm 4 Tầng','Four-tier trophy & product display shelf'],['Thảm Đỏ Khánh Tiết VIP Viền Vàng 2×3.6m','2×3.6m gold-trimmed VIP red carpet'],
 ['Vũ Công Đương Đại (Nữ)','Stage Dancer'],['Vũ Công Đương Đại (Nam)','Stage Dancer (Male)'],['Vũ Công Urban (Nam)','Urban Dancer'],
 ['Ca Sĩ Sân Khấu (Nữ)','Stage Singer'],['Ca Sĩ Sân Khấu (Nam)','Stage Singer (Male)'],
 ['MC Sân Khấu (Nam)','Stage Host'],['MC Sân Khấu (Nữ)','Stage Host (Female)'],
 ['Nghệ Sĩ Guitar Điện','Stage Guitarist'],['Nghệ Sĩ Guitar Bass','Stage Bassist'],['Nghệ Sĩ Đàn Keyboard','Stage Keyboardist'],['Nghệ Sĩ Trống Jazz','Stage Drummer'],
 ['Nghệ Sĩ Violin 3D','Stage Violinist'],['Nghệ Sĩ Saxophone 3D','Stage Saxophonist'],['Rapper Khuấy Động 3D','Stage Rapper'],['DJ Sân Khấu 3D','Stage DJ'],
 ['Vũ Công Giáp LED 3D','LED Suit Dancer'],['Nghệ Sĩ Trống Nước 3D','Water Drummer'],['Vũ Công Laser 3D','Laser Dancer'],['Vũ Công Quạt Lụa 3D','Silk Fan Dancer'],
 ['Máy Phun Lửa Sân Khấu DMX','DMX stage flame jet'],['Máy Bắn Kim Tuyến Confetti DMX','DMX stadium confetti cannon'],
 ['Sàn Sân Khấu Layher Module 2×1m','2×1m modular Layher stage deck'],
 ['Cầu Thang Sân Khấu 4 Bậc Có Tay Vịn','4-step modular stage stairs with handrail'],
 ['Trụ Truss Hộp 4 Ống 3.6m Chân Chống','3.6m 4-chord box truss tower with outriggers'],
 ['Khung Cổng Truss Goalpost 4.6×3.4m','4.6×3.4m goalpost box truss arch'],
 ['Cụm Loa Line Array Treo J-Curve 5 Thùng','5-cabinet J-curve flown line array cluster'],
 ['Cặp Loa Sub Đôi 18" Đặt Sàn','Dual-18 ground-stacked subwoofer pair'],
 ['Bàn DJ Booth LED Touring 2.6m & CDJ','2.6m touring LED DJ booth & CDJ deck'],
 ['Bàn Điều Khiển FOH Ánh Sáng & Âm Thanh 2.36m','2.36m FOH lighting & audio control booth'],
 ['Bàn Hội Nghị Đại Biểu IBM Váy Xếp Ly 1.8m','1.8m pleated-skirt conference IBM table'],
 ['Viền nhôm sàn sân khấu','Stage deck trim'],['Yếm che chân sân khấu','Stage fascia'],
 ['Chân giáo Layher sân khấu','Stage Layher leg'],['Giằng chéo Layher sân khấu','Stage Layher brace'],
 ['Tay vịn cầu thang trái','Stair handrail L'],['Tay vịn cầu thang phải','Stair handrail R'],
 ['Khối góc nối Truss','Truss corner cube'],['Khung treo cụm loa PA','PA array bumper'],['Lưới mặt cụm loa PA','PA array grille'],
 ['Chân chống lật Truss','Truss Outrigger'],['Trục chân tăng đơ Truss','Truss Foot Spindle'],
 ['Giằng chéo Truss mặt trước','Truss Diag F'],['Giằng chéo Truss mặt sau','Truss Diag B'],
 ['Giằng chéo Truss mặt trái','Truss Diag L'],['Giằng chéo Truss mặt phải','Truss Diag R'],['Nắp đỉnh trụ Truss','Truss Top Cap'],
 ['Ống trụ cổng Truss','Truss Tower Chord'],['Thanh ngang trụ Truss','Truss Leg Rung'],['Giằng chéo trụ Truss','Truss Leg Diag'],
 ['Khối góc cổng Truss','Truss Corner Block'],['Ống đà ngang cổng Truss','Truss Span Chord'],
 ['Thanh ngang đà Truss','Truss Span Rung'],['Giằng chéo đà Truss','Truss Span Diag'],
 ['Dầm treo palăng Line Array','Line Array Hoist Beam'],['Ma ní treo trái','Hoist Shackle L'],['Ma ní treo phải','Hoist Shackle R'],
 ['Họng phóng âm Waveguide','Waveguide Horn'],['Thanh chỉnh góc loa trái','Rigging Splay Bar L'],['Thanh chỉnh góc loa phải','Rigging Splay Bar R'],
 ['Đế bánh xe loa Sub','Sub Caster Base'],['Màng loa Bass 18"','Woofer Cone'],['Nón loa Bass','Dust Cap'],
 ['Ốp góc bảo vệ Sub trái','Sub Corner Bumper L'],['Ốp góc bảo vệ Sub phải','Sub Corner Bumper R'],['Dây đai chằng cụm Sub','Ratchet Strap'],
 ['Đế bục bàn DJ','DJ Booth Base Plinth'],['Cánh vát bàn DJ trái','DJ Faceted Wing L'],['Cánh vát bàn DJ phải','DJ Faceted Wing R'],
 ['Đầu phát CDJ','CDJ Player'],['Mâm xoay Jog Wheel CDJ','CDJ Jog Wheel'],['Bàn trộn DJM Mixer','DJM Mixer'],
 ['Chân loa kiểm âm DJ','Monitor Stand'],['Loa kiểm âm DJ Booth','Booth Monitor'],
 ['Dải LED viền trên bàn DJ','DJ LED Strip Top'],['Dải LED viền dưới bàn DJ','DJ LED Strip Bottom'],
 ['Viền nhôm bục Riser trước','Riser Aluminum Trim F'],['Viền nhôm bục Riser sau','Riser Aluminum Trim B'],
 ['Viền nhôm bục Riser trái','Riser Aluminum Trim L'],['Viền nhôm bục Riser phải','Riser Aluminum Trim R'],
 ['Chân ống lồng bục Riser','Riser Telescopic Leg'],['Đế cao su chân Riser','Riser Foot Pad'],
 ['Giằng chéo Layher A','Layher Cross Brace A'],['Giằng chéo Layher B','Layher Cross Brace B'],
 ['Giằng chéo Layher C','Layher Cross Brace C'],['Giằng chéo Layher D','Layher Cross Brace D'],
 ['Nẹp mũi bậc chống trượt','Step Anti-Slip Nosing'],['Khung đỡ bậc thang','Step Riser Strut'],['Dầm biên cầu thang','Stair Stringer'],
 ['Trụ tay vịn dưới','Stair Handrail Post Bot'],['Trụ tay vịn trên','Stair Handrail Post Top'],
 ['Tay vịn chính cầu thang','Stair Handrail Top'],['Thanh chắn giữa cầu thang','Stair Handrail Mid'],
 ['Viền đế mạ vàng bục VIP','VIP Podium Plinth Trim'],['Trụ viền bục VIP trái','VIP Side Pillar L'],['Trụ viền bục VIP phải','VIP Side Pillar R'],
 ['Micro cổ ngỗng trái','Gooseneck Mic L'],['Micro cổ ngỗng phải','Gooseneck Mic R'],
 ['Viền chân khăn bàn Gala mạ vàng','Gala Table Gold Hem'],['Mâm xoay kính bàn tiệc','Lazy Susan Glass'],
 ['Bình hoa trang trí tâm bàn','Floral Centerpiece'],['Khung chân ghế Gala','Gala Chair Base'],
 ['Nếp gấp khăn bàn IBM','IBM Skirt Pleat'],['Viền vàng mép trên bàn IBM','IBM Gold Trim Top'],['Viền vàng chân bàn IBM','IBM Gold Trim Bottom'],
 ['Tấm lót da đại biểu','Delegate Blotter'],['Biển tên đại biểu','Delegate Nameplate'],['Micro hội nghị','Conference Mic'],['Khung ghế VIP','VIP Chair Frame'],
 ['Mặt bàn kỹ thuật FOH','FOH Table Worktop'],['Vách chắn kỹ thuật FOH','FOH Privacy Baffle'],
 ['Dải LED mặt trước FOH','FOH Front LED Strip'],['Màn hình rộng điều khiển FOH','FOH Widescreen Monitor'],
 ['Đèn Chớp Khán Giả 4×100W COB Molefay (Tách Yoke/Head DMX)','4-Lite Audience Blinder 4×100W (DMX yoke / head)'],
 ['Đèn Laser RGB Kvant Clubmax 10W (Tách Yoke/Head DMX)','Kvant Clubmax 10W RGB Show Laser (DMX yoke / head)'],
 ['Đèn Chớp Hybrid Xenon/LED Atomic 3000 (Tách Yoke/Head DMX)','Atomic 3000W LED Strobe & Blinder (DMX yoke / head)'],
 ['Máy Pháo Điện Lạnh Sparkular BT01 700W','Sparkular BT01 700W Cold Spark Fountain'],
 ['Súng Cột Khói Lạnh MagicFX CO2 Cryo Jet','MagicFX CO2 Cryo Jet Stage Cannon'],
 ['Máy Phun Lửa Galaxis G-Flame DMX','Galaxis G-Flame DMX Stage Flame Projector'],
 ['Pháo Kim Tuyến Đại Cảnh MagicFX StadiumShot III','MagicFX StadiumShot III Confetti Cannon'],
 ['Loa Kiểm Âm Sân Khấu Stage Monitor 15" Đồng Trục','15" Coaxial 45-deg Stage Wedge Monitor'],
 ['Rào Chắn Khán Giả Hợp Kim Nhôm Mojo 2m','2m Aluminum Mojo Crowd Control Barrier'],
 ['Trụ Nghi Thức Ấn Nút & Quả Cầu LED Khai Mạc','VIP Opening Ceremony LED Touch Sphere Pillar'],
 ['Cụm Tời DMX Kinetic Winch & Vòng Quả Cầu LED','DMX Kinetic Winch & LED Ring Orb'],
 ['Bộ Trống Acoustic Drum Kit 5 Trống & 4 Cymbal','5-Piece Touring Acoustic Drum Kit & Cymbals'],
 ['Đàn Đại Dương Cầm Concert Grand Piano 1.8m','1.8m Concert Grand Piano & Bench'],
 ['Cụm Máy Quay Truyền Hình Broadcast & Tripod Dolly','4K Broadcast Pedestal Camera & Teleprompter'],
 ['Loa Kiểm Âm Wedge Monitor 15"','15" coaxial stage wedge monitor'],
 ['Bộ Trống Acoustic Lưu Diễn 5 Trống','5-piece touring acoustic drum kit'],
 ['Đại Dương Cầm Concert Grand Piano 1.8m','1.8m concert grand piano'],
 ['Máy Quay Truyền Hình 4K Pedestal','4K broadcast pedestal camera']
];
const OBJECT_NAME_MAP=new Map();
for(const pair of OBJECT_NAME_PAIRS){OBJECT_NAME_MAP.set(pair[0],pair);OBJECT_NAME_MAP.set(pair[1],pair);}
function localizeObjectSegment(seg,en){
 const s=String(seg??'').trim();
 if(!s||/^\d+$/.test(s))return s;
 const direct=OBJECT_NAME_MAP.get(s);
 if(direct)return en?direct[1]:direct[0];
 const mHash=s.match(/^(.+?)\s+#(\d+)$/);
 if(mHash){const p=OBJECT_NAME_MAP.get(mHash[1].trim());if(p)return (en?p[1]:p[0])+' #'+mHash[2];}
 const mNum=s.match(/^(.+?)\s+(\d+)$/);
 if(mNum){const p=OBJECT_NAME_MAP.get(mNum[1].trim());if(p)return (en?p[1]:p[0])+' '+mNum[2];}
 const mLed=s.match(/^(?:LED_|Màn LED\s+)(\d+)$/i);
 if(mLed)return (en?'LED_':'Màn LED ')+mLed[1];
 return s;
}
function localizeObjectName(raw){
 if(raw==null)return '';
 const str=String(raw);
 if(!str)return str;
 const en=(typeof document!=='undefined'&&document.documentElement?.dataset?.locale||typeof window!=='undefined'&&window.STUDIO?.cloud16?.state?.locale)==='en';
 const direct=localizeObjectSegment(str,en);
 if(direct!==str.trim()||OBJECT_NAME_MAP.has(str.trim()))return direct;
 if(str.includes(' / '))return str.split(' / ').map(part=>localizeObjectSegment(part,en)).join(' / ');
 return direct;
}
function matchesObjectFilter16(mesh,filter){
 if(!mesh)return false;
 if(mesh._sfxKind16)return false;
 if(!filter||filter==='all')return true;
 const n=String(mesh.name||'').toLowerCase();
 const isProp=!!(mesh._asset16Id||mesh._importedGlb16||mesh._assetOrigin16||/^cc0\s/i.test(n));
 const isLed=!isProp&&!/^frame[_ ]/i.test(n)&&/\b(led|screen|display)\b|^led_/i.test(n);
 if(filter==='led')return isLed;
 if(filter==='cast')return isProp;
 if(filter==='struct')return !isProp&&!isLed;
 return true;
}
if(typeof window!=='undefined'){window.localizeObjectName=localizeObjectName;window.matchesObjectFilter16=matchesObjectFilter16;}
// Line icon from the inline Lucide sprite in index.html (#iconSprite). Decorative unless a label is given.
function icon(name,label){return '<svg class="ico" '+(label?'role="img" aria-label="'+esc(label)+'"':'aria-hidden="true"')+'><use href="#i-'+name+'"/></svg>'}
window.icon=icon;
let engine;
const state={step:'stage',projectName:'ALPHA_Demo_Stage',selectedMesh:null,hit:null,selectedLight:null,quad:false,quadPoints:[],model:{name:'ALPHA_Demo_Stage',files:[],demo:true},media:[],playing:true,time:0,duration:12,loop:false,orbit:false,recording:false,presenting:false,pickMode:'face',history:[],redo:[],lastFrame:performance.now(),warnings:[],importing:false};
// One notification style app-wide. kind: ok | warn | error | info (inferred from the wording when omitted).
const TOAST_ICON={ok:'circle-check',warn:'triangle-alert',error:'circle-x',info:'info'};
function toastKind(msg){const m=String(msg).trim();return /^(Lỗi|Không thể|Thất bại|Error|Failed)/i.test(m)?'error':/^(Đã |Xong|Saved|Done)/i.test(m)?'ok':/^(Cảnh báo|Chưa |Warning)/i.test(m)?'warn':'info'}
function toast(msg,ms=4300,kind){const t=$('toast'),k=kind||toastKind(msg);t.dataset.kind=k;t.innerHTML=icon(TOAST_ICON[k])+'<span></span>';t.lastChild.textContent=msg;t.setAttribute('role',k==='error'?'alert':'status');$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),ms);$('statusText').textContent=msg}
function busy(on,msg=(typeof window==='undefined'?"Đang xử lý...":window.tr?.("Đang xử lý...","Processing...")??"Đang xử lý...")){const splash=$('bootSplash'),inSplash=!!(splash&&!splash.classList?.contains?.('done'));if(on&&inSplash){const sub=splash.querySelector?.('small');if(sub&&msg)sub.textContent=msg;$('busy')?.classList?.add?.('hidden');}else $('busy')?.classList?.toggle?.('hidden',!on);if($('busyText'))$('busyText').textContent=msg}
function dialog(title,body,actions=[]){$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalActions').innerHTML='';for(let a of actions){let b=document.createElement('button');b.className='btn '+(a.primary?'primary':'');b.textContent=a.label;b.onclick=()=>{if(a.close!==false)$('modal').close();a.action?.()};$('modalActions').appendChild(b)}if(!actions.length){let b=document.createElement('button');b.className='btn primary';b.textContent=(typeof window==='undefined'?"Đã hiểu":window.tr?.("Đã hiểu","Got it")??"Đã hiểu");b.onclick=()=>$('modal').close();$('modalActions').appendChild(b)}if(!$('modal').open)$('modal').showModal()}
function download(name,blob){let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function downloadText(name,text,type='application/json'){download(name,new Blob([text],{type}))}
function snapshot(){return{stage:engine.stage?.slice(),stageSize:engine.size?{...engine.size}:undefined,stageBounds:engine.stageBounds?structuredClone(engine.stageBounds):undefined,duration:state.duration,surfaces:engine.surfaces.map(s=>({...s,crop:s.crop?.slice()})),lights:structuredClone(engine.lights),master:{...engine.master},settings:{...engine.settings},accent:engine.accent,effect:engine.effect,selected:engine.selected}}
function checkpoint(){if(!engine)return;state.history.push(snapshot());if(state.history.length>35)state.history.shift();state.redo=[];historyButtons()}
function restore(s){if(s.stage){for(const m of engine.stage||[])if(!s.stage.includes(m))engine.releaseMesh(m);engine.stage=s.stage.slice();if(s.stageSize)engine.size={...s.stageSize};if(s.stageBounds)engine.stageBounds=structuredClone(s.stageBounds);engine._stageBatchDirty=true;}state.duration=s.duration??state.duration;state.time=Math.min(state.time,state.duration);engine.surfaces=s.surfaces;engine.lights=s.lights;engine.master=s.master;engine.settings=s.settings;engine.accent=s.accent;engine.effect=s.effect;engine.selected=s.selected;for(let x of engine.surfaces)updateTest(x);if(state._restoring){state._deferFixtures=true;state._deferUI=true;}else{engine.rebuildFixtures();renderUI();}}
function flushDeferredRestore(){if(state._deferCast&&typeof rebuildCast==='function'){state._deferCast=false;rebuildCast();}if(state._deferActs&&typeof rebuildActCache==='function'){state._deferActs=false;rebuildActCache();}if(state._deferFixtures){state._deferFixtures=false;engine.rebuildFixtures();}if(state._deferUI){state._deferUI=false;renderUI();}}
function undo(){if(!state.history.length)return;state.redo.push(snapshot());restore(state.history.pop());toast((typeof window==='undefined'?"Đã hoàn tác":window.tr?.("Đã hoàn tác","Undone")??"Đã hoàn tác"));historyButtons()}
function redo(){if(!state.redo.length)return;state.history.push(snapshot());restore(state.redo.pop());toast((typeof window==='undefined'?"Đã làm lại":window.tr?.("Đã làm lại","Redone")??"Đã làm lại"));historyButtons()}
function historyButtons(){$('undoBtn').disabled=!state.history.length;$('redoBtn').disabled=!state.redo.length}
function surface(){return engine.surfaces.find(s=>s.id===engine.selected)}
function updateTest(s){const tk=`${s.name}|${s.w}|${s.h}|${s.x}|${s.y}`;if(s.testCanvas&&s.testCanvas._testKey===tk)return;if(s.testCanvas) {let old=engine.texCache.get(s.testCanvas);if(old){engine.gl.deleteTexture(old.tex);engine.texCache.delete(s.testCanvas)}}let c=document.createElement('canvas');c._testKey=tk;c.width=640;c.height=clamp(Math.round(640*s.h/s.w),220,1080);let g=c.getContext('2d'),grad=g.createLinearGradient(0,0,c.width,c.height);grad.addColorStop(0,'#122c43');grad.addColorStop(.5,'#30214b');grad.addColorStop(1,'#162842');g.fillStyle=grad;g.fillRect(0,0,c.width,c.height);g.strokeStyle='#69cfc655';g.lineWidth=1;for(let i=0;i<=8;i++){let x=i*c.width/8;g.beginPath();g.moveTo(x,0);g.lineTo(x,c.height);g.stroke()}for(let i=0;i<=8;i++){let y=i*c.height/8;g.beginPath();g.moveTo(0,y);g.lineTo(c.width,y);g.stroke()}g.strokeStyle='#76e7d7';g.lineWidth=8;g.strokeRect(4,4,c.width-8,c.height-8);g.fillStyle='#f7d38e';g.beginPath();g.moveTo(c.width/2,22);g.lineTo(c.width/2-14,44);g.lineTo(c.width/2+14,44);g.fill();g.textAlign='center';g.fillStyle='#e6edff';g.font='bold 36px Segoe UI,Arial';g.fillText(s.name.slice(0,30),c.width/2,c.height/2-8);g.font='22px Segoe UI,Arial';g.fillStyle='#aaa6c8';g.fillText(s.w+' x '+s.h+' px',c.width/2,c.height/2+29);g.font='14px Segoe UI,Arial';g.fillText('X '+s.x+' / Y '+s.y,c.width/2,c.height-24);s.testCanvas=c}
function createSurface(mesh,name,options={}){let info=planarUV(mesh);let uv=new Float32Array(mesh.uv);let max=0;for(let v of uv)max=Math.max(max,Math.abs(v));if(options.planar||max<.0001)uv=info.uv;let copy=makeMesh(name,mesh.p,uv,mesh.n,{color:[1,1,1,1]});let w=options.w||Math.max(64,Math.round(info.width*120/8)*8),h=options.h||Math.max(64,Math.round(info.height*120/8)*8);w=clamp(w,8,8192);h=clamp(h,8,8192);let s={id:uid('led'),name,mesh:copy,enabled:true,w,h,x:options.x||0,y:options.y||0,source:'motion',crop:[0,0,1,1],rotation:0,flipX:false,flipY:false,fit:0,brightness:1,global:true,physical:[info.width,info.height],...options};Object.assign(s,bindingMetadata(mesh,options));delete s.planar;updateTest(s);engine.surfaces.push(s);engine.selected=s.id;return s}
function faceMesh(hit){let src=hit.mesh,p=src.p,normal=hit.normal,point=hit.point,eps=Math.max(...src.bounds.size,.1)*.00005,valid=[],vertexToTriangles=new Map(),key=v=>v.map(x=>Math.round(x/(eps||.00001))).join(',');for(let t=0;t<p.length/9;t++){let a=Array.from(p.slice(t*9,t*9+3)),b=Array.from(p.slice(t*9+3,t*9+6)),c=Array.from(p.slice(t*9+6,t*9+9)),n=M.norm(M.cross(M.sub(b,a),M.sub(c,a)));if(Math.abs(M.dot(n,normal))<.999)continue;if([a,b,c].some(v=>Math.abs(M.dot(M.sub(v,point),normal))>eps))continue;let keys=[key(a),key(b),key(c)];valid[t]=keys;for(let k of keys){if(!vertexToTriangles.has(k))vertexToTriangles.set(k,[]);vertexToTriangles.get(k).push(t)}}let queue=[hit.triangle],seen=new Set(queue);for(let qi=0;qi<queue.length;qi++)for(let k of valid[queue[qi]]||[])for(let next of vertexToTriangles.get(k)||[])if(!seen.has(next)){seen.add(next);queue.push(next)}let out=[],norm=[];for(let t of queue){out.push(...p.slice(t*9,t*9+9));for(let i=0;i<3;i++)norm.push(...normal)}let mesh=makeMesh(src.name+' / face',out,null,norm);mesh.uv=planarUV(mesh).uv;mesh._ledBinding={triangles:queue.slice(),sourceMeshId:src.id,sourceMeshName:src.name,sourceMeshIndex:engine.stage.indexOf(src),triangle:hit.triangle,normal:[...normal]};return mesh}
/* V0.3.1: bind LED overlays to visible surfaces, not to arbitrary back triangles. */
const ledPlaneCache = new WeakMap();
function cameraEyeNow() {
 const c=engine.camera;
 return M.add(c.target,[Math.sin(c.yaw)*Math.cos(c.pitch)*c.distance,Math.sin(c.pitch)*c.distance,Math.cos(c.yaw)*Math.cos(c.pitch)*c.distance]);
}
function meshPlaneGroups(mesh) {
 const cached=ledPlaneCache.get(mesh);
 if(cached?.positions===mesh.p) return cached.groups;
 const p=mesh.p, eps=Math.max(...mesh.bounds.size,.01)*.00002, groups=new Map();
 for(let i=0;i<p.length;i+=9){
  const a=Array.from(p.slice(i,i+3)), b=Array.from(p.slice(i+3,i+6)), c=Array.from(p.slice(i+6,i+9));
  const cross=M.cross(M.sub(b,a),M.sub(c,a)), area=Math.hypot(...cross)*.5;
  if(area<1e-12)continue;
  let n=M.norm(cross), k=0;for(let j=1;j<3;j++)if(Math.abs(n[j])>Math.abs(n[k]))k=j;
  if(n[k]<0)n=M.mul(n,-1);
  const center=M.mul(M.add(M.add(a,b),c),1/3), key=n.map(v=>Math.round(v*10000)).join(',')+':'+Math.round(M.dot(n,a)/eps);
  let g=groups.get(key);
  if(!g){g={normal:n,area:0,weighted:[0,0,0],samples:[],key};groups.set(key,g);}
  g.area+=area;g.weighted=M.add(g.weighted,M.mul(center,area));
  const sample={triangle:i/9,point:center,area};
  if(g.samples.length<5)g.samples.push(sample);
  else if(area>g.samples[0].area)g.samples[0]=sample;
  g.last=sample;
 }
 const result=[...groups.values()].map(g=>({...g,center:M.mul(g.weighted,1/g.area),samples:[...g.samples,g.last]}));
 ledPlaneCache.set(mesh,{positions:mesh.p,groups:result});return result;
}
function nearestOnMesh(mesh,origin,dir,maxDistance=Infinity) {
 return raycastMeshBVH(mesh,origin,dir,maxDistance);
}
function frontHit(mesh) {
 if(!mesh?.p?.length)return null;
 const eye=cameraEyeNow(), eps=Math.max(...mesh.bounds.size,.01)*.00005;
 const groups=meshPlaneGroups(mesh).map(g=>({...g,score:g.area*(.15+.85*Math.abs(M.dot(g.normal,M.norm(M.sub(eye,g.center)))))})).sort((a,b)=>b.score-a.score);
 for(const group of groups.slice(0,48)){
  if(Math.abs(M.dot(group.normal,M.norm(M.sub(eye,group.center))))<.025)continue;
  const samples=[...group.samples].sort((a,b)=>Math.hypot(...M.sub(eye,a.point))-Math.hypot(...M.sub(eye,b.point)));
  for(const sample of samples){
   const ray=M.sub(sample.point,eye), distance=Math.hypot(...ray), dir=M.norm(ray);
   const nearest=nearestOnMesh(mesh,eye,dir,distance+eps);
   // A back face may point toward the camera after normal flipping, but is still occluded.
   if(!nearest||nearest.distance<distance-eps)continue;
   let normal=group.normal;if(M.dot(normal,M.sub(eye,sample.point))<0)normal=M.mul(normal,-1);
   return {mesh,triangle:sample.triangle,point:sample.point,normal,score:group.score,visible:true};
  }
 }
 return null;
}
function bindingMetadata(mesh,options={}) {
 const binding=mesh._ledBinding;
 const original=binding?engine.stage.find(m=>m.id===binding.sourceMeshId):engine.stage.find(m=>m===mesh);
 return {
  bindVersion:'0.3.1',
  mappingMode:options.mappingMode||(binding?'face':original?'uv':'quad'),
  sourceMeshId:binding?.sourceMeshId||original?.id||null,
  sourceMeshName:binding?.sourceMeshName||original?.name||null,
  sourceMeshIndex:binding?.sourceMeshIndex??(original?engine.stage.indexOf(original):-1),
  bindingNormal:binding?.normal||planarUV(mesh).normal,
  liftMm:Number.isFinite(options.liftMm)?options.liftMm:0
 };
}
function sourceForSurface(s) {
 let direct=engine.stage.find(m=>m.id===s.sourceMeshId);
 if(direct)return direct;
 const b=s.mesh.bounds, distance=m=>Math.hypot(...M.sub(m.bounds.center,b.center));
 let names=[s.sourceMeshName,s.name].filter(Boolean);
 let named=engine.stage.filter(m=>names.includes(m.name));
 if(named.length)return named.sort((a,b)=>distance(a)-distance(b))[0];
 // Old V0.2/V0.3 projects have no source binding. Only recover close, full-face matches.
 const sizes=[...b.size].sort((a,b)=>b-a),candidates=[];
 for(const m of engine.stage){
  const e=Math.max(...m.bounds.size,.01)*.0001;
  if(b.min.some((v,i)=>v<m.bounds.min[i]-e)||b.max.some((v,i)=>v>m.bounds.max[i]+e))continue;
  const ms=[...m.bounds.size].sort((a,b)=>b-a);
  if(sizes[0]<.001||sizes[1]<.001)continue;
  if(Math.abs(ms[0]-sizes[0])/sizes[0]>.08||Math.abs(ms[1]-sizes[1])/sizes[1]>.08)continue;
  candidates.push(m);
 }
 return candidates.sort((a,b)=>distance(a)-distance(b))[0]||null;
}
function existingSurfaceFor(mesh) {
 return engine.surfaces.find(s=>s.sourceMeshId===mesh.id||(s.sourceMeshName===mesh.name&&sourceForSurface(s)?.id===mesh.id)||(!s.sourceMeshName&&s.name===mesh.name));
}
function replaceSurfaceGeometry(s,face) {
 const old=s.mesh;
 s.mesh=makeMesh(s.name,face.p,planarUV(face).uv,face.n,{color:[1,1,1,1]});
 Object.assign(s,bindingMetadata(face,{mappingMode:'face',liftMm:s.liftMm||0}));
 const info=planarUV(face);s.physical=[info.width,info.height];
 engine.releaseMesh(old);updateTest(s);
}
function repairMapping3D({selectedOnly=false}={}) {
 const list=selectedOnly?(surface()?[surface()]:[]):engine.surfaces;
 const report={fixed:[],skipped:[]};
 if(!list.length){toast((typeof window==='undefined'?"Chưa có vùng LED để sửa. Hãy nhận diện hoặc chọn mặt trước.":window.tr?.("Chưa có vùng LED để sửa. Hãy nhận diện hoặc chọn mặt trước.","No LED regions to repair. Detect LEDs or select a front face first.")??"Chưa có vùng LED để sửa. Hãy nhận diện hoặc chọn mặt trước."));return report;}
 checkpoint();engine.view='stage';
 for(const s of list){
  if(s.mappingMode==='quad'||s.mappingMode==='uv'){report.skipped.push(s.name);continue;}
  const original=sourceForSurface(s),hit=original?frontHit(original):null;
  if(!hit){report.skipped.push(s.name);continue;}
  const face=faceMesh(hit);replaceSurfaceGeometry(s,face);report.fixed.push(s.name);
 }
 state.step='mapping';engine.selected=engine.selected||list[0]?.id;engine.globalTest=false;
 renderUI();engine.render(state.time);renderOverlays();
 toast((typeof window==='undefined'?"Đã gắn lại ":window.tr?.("Đã gắn lại ","Reattached ")??"Đã gắn lại ")+report.fixed.length+(typeof window==='undefined'?" LED vào mặt nhìn thấy; giữ video, crop và Pixel Map.":window.tr?.(" LED vào mặt nhìn thấy; giữ video, crop và Pixel Map."," LEDs to visible faces; video, crop and Pixel Map preserved.")??" LED vào mặt nhìn thấy; giữ video, crop và Pixel Map.")+(report.skipped.length?' '+report.skipped.length+(typeof window==='undefined'?" vùng UV/4 góc hoặc chưa rõ giữ nguyên; dùng Chọn lại mặt.":window.tr?.(" vùng UV/4 góc hoặc chưa rõ giữ nguyên; dùng Chọn lại mặt."," UV/four-corner or unresolved regions unchanged; use Reselect face.")??" vùng UV/4 góc hoặc chưa rõ giữ nguyên; dùng Chọn lại mặt."):''),8500);
 state.lastRepair=report;return report;
}
function startRebindSurface() {
 const s=surface();if(!s)return;
 state.rebindId=s.id;state.quad=false;state.quadPoints=[];engine.view='stage';
 $('quadHint').textContent=(typeof window==='undefined'?"GẮN LẠI ":window.tr?.("GẮN LẠI ","REATTACH ")??"GẮN LẠI ")+s.name+(typeof window==='undefined'?": bấm đúng mặt trước của màn LED trên sân khấu. Giữ nguyên video/crop. Esc: hủy.":window.tr?.(": bấm đúng mặt trước của màn LED trên sân khấu. Giữ nguyên video/crop. Esc: hủy.",": click the LED front face on stage. Video/crop preserved. Esc: cancel.")??": bấm đúng mặt trước của màn LED trên sân khấu. Giữ nguyên video/crop. Esc: hủy.");
 $('quadHint').classList.remove('hidden');renderUI();
}
function completeRebind(hit) {
 const s=engine.surfaces.find(s=>s.id===state.rebindId);if(!s||!hit)return false;
 checkpoint();replaceSurfaceGeometry(s,faceMesh(hit));s.enabled=true;
 state.rebindId=null;state.selectedMesh=null;state.hit=null;engine.selected=s.id;engine.globalTest=false;
 $('quadHint').classList.add('hidden');state.step='mapping';renderUI();
 toast((typeof window==='undefined'?"Đã gắn ":window.tr?.("Đã gắn ","Attached ")??"Đã gắn ")+s.name+(typeof window==='undefined'?" vào mặt vừa chọn. Video và crop không thay đổi.":window.tr?.(" vào mặt vừa chọn. Video và crop không thay đổi."," to the selected face. Video and crop unchanged.")??" vào mặt vừa chọn. Video và crop không thay đổi."));return true;
}
function focusLED3D(s=surface()) {
 if(!s)return;engine.view='stage';engine.camera.target=[...s.mesh.bounds.center];
 engine.camera.distance=Math.max(.4,...s.mesh.bounds.size)*2.1;
 engine.selected=s.id;renderUI();
}
function bindingPanel(s) {
 const owner=sourceForSurface(s),missing=!['motion','test'].includes(s.source)&&!engine.media.has(s.source);
 return `<div class="inspector-block binding-panel"><h3 class="block-title"><svg class="ico ico-led" aria-hidden="true"><use href="#i-grid-3x3"></use></svg><span>${(typeof window==='undefined'?"Gắn LED vào sân khấu 3D":window.tr?.("Gắn LED vào sân khấu 3D","Attach LED to 3D stage")??"Gắn LED vào sân khấu 3D")}</span></h3><div class="binding-status">${owner?'\u2713 '+esc(typeof localizeObjectName==='function'?localizeObjectName(owner.name):owner.name):(typeof window==='undefined'?"Vùng tự tạo / chưa liên kết object":window.tr?.("Vùng tự tạo / chưa liên kết object","Custom region / no linked object")??"Vùng tự tạo / chưa liên kết object")}</div><div class="actions-row"><button id="focusLED3D" class="btn">${(typeof window==='undefined'?"Xem LED trên 3D":window.tr?.("Xem LED trên 3D","View LED in 3D")??"Xem LED trên 3D")}</button><button id="rebindLED3D" class="btn primary">${(typeof window==='undefined'?"Chọn lại mặt":window.tr?.("Chọn lại mặt","Reselect face")??"Chọn lại mặt")}</button></div><button id="repairOneLED" class="btn full-btn">${(typeof window==='undefined'?"Sửa mặt bị che / mặt sau":window.tr?.("Sửa mặt bị che / mặt sau","Repair occluded / rear face")??"Sửa mặt bị che / mặt sau")}</button>${field('ledLiftMm',(typeof window==='undefined'?"Nâng mặt LED (mm)":window.tr?.("Nâng mặt LED (mm)","LED face offset (mm)")??"Nâng mặt LED (mm)"),s.liftMm||0,{min:-20,max:50,step:.1})}<p class="hint-text">${(typeof window==='undefined'?"Chọn lại mặt giữ nguyên video và crop. Nâng mặt chỉ dùng khi bề mặt bị trùng lớp.":window.tr?.("Chọn lại mặt giữ nguyên video và crop. Nâng mặt chỉ dùng khi bề mặt bị trùng lớp.","Reselecting preserves video and crop. Offset only overlapping faces.")??"Chọn lại mặt giữ nguyên video và crop. Nâng mặt chỉ dùng khi bề mặt bị trùng lớp.")}</p>${missing?(typeof window==='undefined'?"<div class=\"info-box warn\">Thiếu video nguồn. Hãy nhập và gán lại clip.</div>":window.tr?.("<div class=\"info-box warn\">Thiếu video nguồn. Hãy nhập và gán lại clip.</div>","<div class=\"info-box warn\">Source video missing. Import and reassign the clip.</div>")??"<div class=\"info-box warn\">Thiếu video nguồn. Hãy nhập và gán lại clip.</div>"):''}</div><div class="divider"></div>`;
}
function bindSurfaceControls(s) {
 $('focusLED3D').onclick=()=>focusLED3D(s);
 $('rebindLED3D').onclick=startRebindSurface;
 $('repairOneLED').onclick=()=>repairMapping3D({selectedOnly:true});
 change('ledLiftMm',v=>s.liftMm=clamp(+v||0,-20,50),{live:true});
}

function addFromSelection(){let m=engine.stage.find(m=>m.id===state.selectedMesh);if(!m){toast((typeof window==='undefined'?"Chọn object hoặc click vào mặt LED trên model trước.":window.tr?.("Chọn object hoặc click vào mặt LED trên model trước.","Select an object or click an LED face on the model first.")??"Chọn object hoặc click vào mặt LED trên model trước."));return}let candidate=state.hit?.mesh.id===m.id?state.hit:frontHit(m);if(state.pickMode==='face'&&!candidate){toast((typeof window==='undefined'?"Hãy click trực tiếp vào mặt trước LED.":window.tr?.("Hãy click trực tiếp vào mặt trước LED.","Click the LED front face directly.")??"Hãy click trực tiếp vào mặt trước LED."));return}checkpoint();let mesh=state.pickMode==='face'?faceMesh(candidate):m;let s=createSurface(mesh,'LED_'+String(engine.surfaces.length+1).padStart(2,'0'),{planar:state.pickMode==='face'});state.step='mapping';engine.view='stage';renderUI();toast((typeof window==='undefined'?"Đã tạo ":window.tr?.("Đã tạo ","Created ")??"Đã tạo ")+s.name+(typeof window==='undefined'?". Nhập độ phân giải thực và gán video.":window.tr?.(". Nhập độ phân giải thực và gán video.",". Enter the actual resolution and assign video.")??". Nhập độ phân giải thực và gán video."));}
function detectLEDCandidates(){
 const out=[];
 for(const mesh of engine.stage){
  if(mesh.hidden||mesh.p.length>1800000)continue;
  const name=mesh.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const named=/led|screen|display|man[\s_-]?hinh|video[\s_-]?wall/.test(name);
  const excluded=/frame|support|truss|brace|speaker|platform|step|floor|khung|san khau/.test(name);
  if(excluded&&!named)continue;
  const hit=frontHit(mesh);if(!hit)continue;
  const face=faceMesh(hit),info=planarUV(face),area=info.width*info.height;
  if(area<.035||Math.min(info.width,info.height)<.015)continue;
  const vertical=Math.abs(hit.normal[1])<.65, dims=[...mesh.bounds.size].sort((a,b)=>a-b);
  if(!named&&(!vertical||dims[0]>Math.max(.02,dims[1]*.22)))continue;
  let triArea=0;
  for(let i=0;i<face.p.length;i+=9){
   const p=face.p, a=Array.from(p.slice(i,i+3)), b=Array.from(p.slice(i+3,i+6)), c=Array.from(p.slice(i+6,i+9));
   triArea+=Math.hypot(...M.cross(M.sub(b,a),M.sub(c,a)))*.5;
  }
  const fill=triArea/Math.max(area,.0001),score=(named?5:0)+(vertical?1:0)+(fill>.85?1:0)+(area>.2?.5:0);
  if(score<2)continue;
  out.push({mesh,hit,face,info,center:[...face.bounds.center],score,area,existing:existingSurfaceFor(mesh),recommended:named&&!excluded,reasons:[named?(typeof window==='undefined'?"Tên LED/screen":window.tr?.("Tên LED/screen","LED/screen name")??"Tên LED/screen"):(typeof window==='undefined'?"Gợi ý hình học":window.tr?.("Gợi ý hình học","Geometry suggestion")??"Gợi ý hình học"),(typeof window==='undefined'?"Mặt nhìn thấy":window.tr?.("Mặt nhìn thấy","Visible face")??"Mặt nhìn thấy")]});
 }
 return out.sort((a,b)=>b.score-a.score||a.center[0]-b.center[0]);
}
function autoMapCreated(list){
 if(!list.length)return;
 // Append new regions, never invalidate the crops/layout of LEDs already mapped.
 const fresh=new Set(list.map(x=>x.surface.id)),old=engine.surfaces.filter(s=>!fresh.has(s.id));
 let cursorY=old.length?Math.max(...old.map(s=>s.y+s.h)):0,maxW=old.length?engine.master.width:0;
 const sorted=[...list].sort((a,b)=>b.center[1]-a.center[1]),rows=[];
 for(const item of sorted){let row=rows.find(r=>Math.abs(r.y-item.center[1])<Math.max(.05,engine.size.height*.12));if(!row){row={y:item.center[1],items:[]};rows.push(row);}row.items.push(item);}
 for(const row of rows){let x=0,h=0;for(const item of row.items.sort((a,b)=>a.center[0]-b.center[0])){let s=item.surface;s.x=x;s.y=cursorY;x+=s.w;h=Math.max(h,s.h);updateTest(s);}maxW=Math.max(maxW,x);cursorY+=h;}
 engine.master={width:Math.max(64,maxW),height:Math.max(64,cursorY)};
}
function autoDetect(){
 busy(true,(typeof window==='undefined'?"Đang tìm các mặt LED nhìn thấy...":window.tr?.("Đang tìm các mặt LED nhìn thấy...","Finding visible LED faces...")??"Đang tìm các mặt LED nhìn thấy..."));
 setTimeout(()=>{
  try{
   const arr=detectLEDCandidates();busy(false);
   if(!arr.length){toast((typeof window==='undefined'?"Chưa có ứng viên LED. Hãy click trực tiếp mặt trước hoặc dùng 4 góc.":window.tr?.("Chưa có ứng viên LED. Hãy click trực tiếp mặt trước hoặc dùng 4 góc.","No LED candidates. Click a front face directly or use four corners.")??"Chưa có ứng viên LED. Hãy click trực tiếp mặt trước hoặc dùng 4 góc."));return;}
   const create=(pack)=>{
    const chosen=[...document.querySelectorAll('[data-detect]:checked')].map(el=>arr[+el.dataset.detect]).filter(c=>!c.existing);
    if(!chosen.length){toast((typeof window==='undefined'?"Chưa chọn LED mới. Màn đã có mapping: dùng Sửa mapping 3D.":window.tr?.("Chưa chọn LED mới. Màn đã có mapping: dùng Sửa mapping 3D.","No new LED selected. Use Repair 3D mapping for mapped screens.")??"Chưa chọn LED mới. Màn đã có mapping: dùng Sửa mapping 3D."));return;}
    checkpoint();const made=[];
    for(const c of chosen){const w=clamp(Math.round(c.info.width*120/8)*8,64,8192),h=clamp(Math.round(c.info.height*120/8)*8,64,8192);const s=createSurface(c.face,c.mesh.name,{planar:true,w,h});made.push({...c,surface:s});}
    if(pack)autoMapCreated(made);engine.view='stage';engine.globalTest=true;state.step='mapping';renderUI();
    toast((typeof window==='undefined'?"Đã gắn ":window.tr?.("Đã gắn ","Attached ")??"Đã gắn ")+made.length+(typeof window==='undefined'?" màn lên sân khấu. Nhập độ phân giải thật rồi gán video.":window.tr?.(" màn lên sân khấu. Nhập độ phân giải thật rồi gán video."," screens to the stage. Enter actual resolutions, then assign video.")??" màn lên sân khấu. Nhập độ phân giải thật rồi gán video."),7000);
   };
   dialog((typeof window==='undefined'?"Nhận diện LED / kiểm tra mặt trước":window.tr?.("Nhận diện LED / kiểm tra mặt trước","Detect LEDs / check front faces")??"Nhận diện LED / kiểm tra mặt trước"),
    (typeof window==='undefined'?"<p>Gợi ý theo tên và hình học, <b>không phải AI nhận diện chắc chắn</b>. Các màn đã mapping không bị tạo trùng.</p><div style=\"max-height:310px;overflow:auto\">":window.tr?.("<p>Gợi ý theo tên và hình học, <b>không phải AI nhận diện chắc chắn</b>. Các màn đã mapping không bị tạo trùng.</p><div style=\"max-height:310px;overflow:auto\">","<p>Suggestions based on names and geometry, <b>not guaranteed AI detection</b>. Already mapped screens are not duplicated.</p><div style=\"max-height:310px;overflow:auto\">")??"<p>Gợi ý theo tên và hình học, <b>không phải AI nhận diện chắc chắn</b>. Các màn đã mapping không bị tạo trùng.</p><div style=\"max-height:310px;overflow:auto\">")+arr.slice(0,60).map((c,i)=>`<label class="check-row"><input type="checkbox" data-detect="${i}" ${c.existing?'disabled':c.recommended?'checked':''}><span><b>${esc(typeof localizeObjectName==='function'?localizeObjectName(c.mesh.name):c.mesh.name)}</b><small style="display:block;color:var(--muted)">${c.existing?(typeof window==='undefined'?"Đã có mapping":window.tr?.("Đã có mapping","Already mapped")??"Đã có mapping"):esc(c.reasons.join(' / '))} / ${fmt(c.info.width)} x ${fmt(c.info.height)} m</small></span></label>`).join('')+(typeof window==='undefined'?"</div><p class=\"hint-text\">Kích thước pixel tạo mới chỉ là tạm tính, phải thay bằng Pixel Map thật.</p>":window.tr?.("</div><p class=\"hint-text\">Kích thước pixel tạo mới chỉ là tạm tính, phải thay bằng Pixel Map thật.</p>","</div><p class=\"hint-text\">Initial pixel dimensions are estimates; replace them with the actual Pixel Map.</p>")??"</div><p class=\"hint-text\">Kích thước pixel tạo mới chỉ là tạm tính, phải thay bằng Pixel Map thật.</p>"),
    [{label:(typeof window==='undefined'?"Hủy":window.tr?.("Hủy","Cancel")??"Hủy")},{label:(typeof window==='undefined'?"Tạo LED":window.tr?.("Tạo LED","Create LED")??"Tạo LED"),action:()=>create(false)},{label:(typeof window==='undefined'?"Tạo + xếp map":window.tr?.("Tạo + xếp map","Create + arrange map")??"Tạo + xếp map"),primary:true,action:()=>create(true)}]);
  }catch(err){busy(false);toast((typeof window==='undefined'?"Không nhận diện được: ":window.tr?.("Không nhận diện được: ","Detection failed: ")??"Không nhận diện được: ")+err.message,8000);}
 },35);
}

function barBetween(name,a,b,width=.045,color=[.28,.31,.38,1]){let dir=M.norm(M.sub(b,a)),len=Math.hypot(...M.sub(b,a)),axis=M.cross([0,1,0],dir),angle=Math.acos(clamp(dir[1],-1,1)),rot=Math.hypot(...axis)<1e-8?M.identity():M.rotate(axis,angle),mesh=boxMesh(name,[0,0,0],[width,len,width],color);return transformMesh(mesh,M.mm(M.translate(M.mul(M.add(a,b),.5)),rot))}
function buildStageShellMeshes(opts={}){
 const w=Math.max(4,Number(opts.widthM)||19),d=Math.max(3,Number(opts.depthM)||7),h=Math.max(.2,Number(opts.heightM)||.6),topY=Math.max(h+3.8,Number(opts.topY)||6.6),mode=opts.trussMode||'portal',includePA=opts.includePA!==false;
 const deckCol=[.07,.075,.09,1],jointCol=[.15,.17,.22,1],trimCol=[.58,.64,.72,1],fasciaCol=[.09,.11,.14,1],trussCol=[.62,.68,.76,1],braceCol=[.46,.52,.60,1],darkMetal=[.12,.14,.18,1],meshes=[];
 const pushGrp=(grp,vi,en,m)=>{m._smartGroupId=grp;m.nodePath=grp+'/'+meshes.length;m._groupLabelVi=vi;m._groupLabelEn=en;meshes.push(m);return m;};
 // 1. Modular stage deck top + perimeter aluminum extrusion + front/side fascia + Layher legs/bracing
 const deckVi='Hệ Sàn Sân khấu & Chân Layher',deckEn='Stage Deck & Layher Substructure';
 const slabH=Math.min(.10,h*.22),fasciaH=Math.max(.08,h-slabH);
 pushGrp('stage_shell_deck',deckVi,deckEn,boxMesh('Stage platform',[0,h-slabH*.5,0],[w,slabH,d],deckCol));
 pushGrp('stage_shell_deck',deckVi,deckEn,boxMesh('Stage deck trim',[0,h-slabH*.5,d*.5+.015],[w+.04,slabH+.015,.03],trimCol));
 pushGrp('stage_shell_deck',deckVi,deckEn,boxMesh('Stage deck trim',[0,h-slabH*.5,-d*.5-.015],[w+.04,slabH+.015,.03],trimCol));
 pushGrp('stage_shell_deck',deckVi,deckEn,boxMesh('Stage deck trim',[-w*.5-.015,h-slabH*.5,0],[.03,slabH+.015,d],trimCol));
 pushGrp('stage_shell_deck',deckVi,deckEn,boxMesh('Stage deck trim',[w*.5+.015,h-slabH*.5,0],[.03,slabH+.015,d],trimCol));
 pushGrp('stage_shell_deck',deckVi,deckEn,boxMesh('Stage fascia',[0,fasciaH*.5,0],[w-.08,fasciaH,d-.08],fasciaCol));
 const mCols=Math.max(2,Math.round(w/2)),mRows=Math.max(2,Math.round(d));
 for(let c=1;c<mCols;c++)pushGrp('stage_shell_deck',deckVi,deckEn,boxMesh('Module joint',[-w*.5+w*(c/mCols),h+.002,0],[.014,.004,d-.04],jointCol));
 for(let r=1;r<mRows;r++)pushGrp('stage_shell_deck',deckVi,deckEn,boxMesh('Module joint',[0,h+.002,-d*.5+d*(r/mRows)],[w-.04,.004,.014],jointCol));
 const edgeStrip=boxMesh('Front edge strip',[0,h-slabH*.5,d*.5+.032],[w,.016,.014],[.18,.78,.96,1]);if(edgeStrip.material)edgeStrip.material.emissive=[.22,.85,1];pushGrp('stage_shell_deck',deckVi,deckEn,edgeStrip);
 const legCols=Math.max(3,Math.min(7,Math.round(w/3.2)));
 for(let i=0;i<legCols;i++){
  const lx=-w*.46+(w*.92)*(i/(legCols-1));
  for(const lz of [-d*.45,d*.45]){
   pushGrp('stage_shell_deck',deckVi,deckEn,barBetween('Stage Layher leg',[lx,0,lz],[lx,h-slabH,lz],.038,trimCol));
   if(i<legCols-1){
    const nx=-w*.46+(w*.92)*((i+1)/(legCols-1));
    pushGrp('stage_shell_deck',deckVi,deckEn,barBetween('Stage Layher brace',[lx,.05,lz],[nx,h-slabH-.04,lz],.018,braceCol));
    pushGrp('stage_shell_deck',deckVi,deckEn,barBetween('Stage Layher brace',[nx,.05,lz],[lx,h-slabH-.04,lz],.018,braceCol));
   }
  }
 }
 // 2. Modular 4-step front stage stairs with anti-slip nosing & tubular handrails
 const stairVi='Cầu thang & Tay vịn Sân khấu',stairEn='Front Stage Stairs & Handrails';
 const steps=4,stairW=Math.min(3.2,Math.max(1.6,w*.18)),stepD=.32,stepH=h/steps,zStart=d*.5+.16;
 for(let i=0;i<steps;i++){
  const idx=steps-i,sy=idx*stepH,sz=zStart+i*stepD;
  pushGrp('stage_shell_stairs',stairVi,stairEn,boxMesh('Front step '+idx,[0,sy*.5,sz],[stairW,sy,stepD-.01],deckCol));
  pushGrp('stage_shell_stairs',stairVi,stairEn,boxMesh('Stage deck trim',[0,sy-.012,sz+stepD*.46],[stairW+.01,.024,.03],trimCol));
 }
 const zTop=zStart-.04,zBot=zStart+(steps-1)*stepD+.12;
 for(const [side,hName] of [[-1,'Stair handrail L'],[1,'Stair handrail R']]){
  const rx=side*(stairW*.5+.03);
  pushGrp('stage_shell_stairs',stairVi,stairEn,barBetween(hName,[rx,h,zTop],[rx,h+.82,zTop],.026,trimCol));
  pushGrp('stage_shell_stairs',stairVi,stairEn,barBetween(hName,[rx,.02,zBot],[rx,.86,zBot],.026,trimCol));
  pushGrp('stage_shell_stairs',stairVi,stairEn,barBetween(hName,[rx,h+.82,zTop],[rx,.86,zBot],.030,trimCol));
  pushGrp('stage_shell_stairs',stairVi,stairEn,barBetween(hName,[rx,h+.44,zTop],[rx,.48,zBot],.018,braceCol));
 }
 // 3. 4-Chord Box Truss Goalpost Portal (with baseplates, corner cubes & 4-face diagonal Z-bracing)
 const trussVi='Hệ Giàn Truss Chính',trussEn='Main Stage Truss Rig';
 const halfW=+(w*.47).toFixed(2),zBack=+(-d*.35).toFixed(2),zFront=+(d*.26).toFixed(2),hw=.17;
 const addTrussColumn=(cx,cz,y0,y1)=>{
  pushGrp('stage_shell_truss',trussVi,trussEn,boxMesh('Truss Baseplate',[cx,y0+.025,cz],[.68,.05,.68],darkMetal));
  for(const dx of[-hw,hw])for(const dz of[-hw,hw])pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss vertical',[cx+dx,y0+.05,cz+dz],[cx+dx,y1,cz+dz],.042,trussCol));
  const bays=Math.max(4,Math.round((y1-y0)/.58)),bh=(y1-y0-.06)/bays;
  for(let k=0;k<bays;k++){
   const by0=y0+.05+k*bh,by1=by0+bh,dir=k%2===0?1:-1;
   pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss brace',[cx-hw*dir,by0,cz+hw],[cx+hw*dir,by1,cz+hw],.024,braceCol));
   pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss brace',[cx+hw*dir,by0,cz-hw],[cx-hw*dir,by1,cz-hw],.024,braceCol));
   pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss brace',[cx-hw,by0,cz-hw*dir],[cx-hw,by1,cz+hw*dir],.024,braceCol));
   pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss brace',[cx+hw,by0,cz+hw*dir],[cx+hw,by1,cz-hw*dir],.024,braceCol));
  }
  pushGrp('stage_shell_truss',trussVi,trussEn,boxMesh('Truss corner cube',[cx,y1,cz],[hw*2.15,hw*2.15,hw*2.15],darkMetal));
 };
 const addTrussBeamX=(x0,x1,cy,cz)=>{
  for(const dy of[-hw,hw])for(const dz of[-hw,hw])pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss crossbar',[x0,cy+dy,cz+dz],[x1,cy+dy,cz+dz],.042,trussCol));
  const bays=Math.max(6,Math.round(Math.abs(x1-x0)/.72)),bw=(x1-x0)/bays;
  for(let i=0;i<bays;i++){
   const bx0=x0+i*bw,bx1=bx0+bw,dir=i%2===0?1:-1;
   pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss diagonal',[bx0,cy-hw*dir,cz+hw],[bx1,cy+hw*dir,cz+hw],.024,braceCol));
   pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss diagonal',[bx0,cy+hw*dir,cz-hw],[bx1,cy-hw*dir,cz-hw],.024,braceCol));
   pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss diagonal',[bx0,cy+hw,cz-hw*dir],[bx1,cy+hw,cz+hw*dir],.022,braceCol));
  }
 };
 for(const x of[-halfW,halfW])addTrussColumn(x,zBack,h,topY);
 addTrussBeamX(-halfW,halfW,topY,zBack);
 if(mode==='box'||mode==='arch'){
  for(const x of[-halfW,halfW]){
   addTrussColumn(x,zFront,h,topY);
   for(const dy of[-hw,hw])for(const dx of[-hw,hw])pushGrp('stage_shell_truss',trussVi,trussEn,barBetween('Truss side beam',[x+dx,topY+dy,zBack],[x+dx,topY+dy,zFront],.040,trussCol));
  }
  addTrussBeamX(-halfW,halfW,topY,zFront);
 }
 // 4. Flown J-Curve PA Line Array Clusters (5 cabinets per side with flying bumper & rigging shackles)
 if(includePA){
  const paX=+(halfW-.75).toFixed(2),paZ=+(zBack+.68).toFixed(2),bumperY=+(topY-.32).toFixed(2);
  for(const sx of[-paX,paX]){
   const isL=sx<0,paGrp=isL?'stage_shell_pa_l':'stage_shell_pa_r',paVi=isL?'Cụm Loa Line Array Trái (PA-L)':'Cụm Loa Line Array Phải (PA-R)',paEn=isL?'Left PA Line Array (PA-L)':'Right PA Line Array (PA-R)';
   pushGrp(paGrp,paVi,paEn,barBetween('Truss brace',[sx-.24,topY-hw,zBack],[sx-.24,bumperY+.05,paZ],.022,trimCol));
   pushGrp(paGrp,paVi,paEn,barBetween('Truss brace',[sx+.24,topY-hw,zBack],[sx+.24,bumperY+.05,paZ],.022,trimCol));
   pushGrp(paGrp,paVi,paEn,boxMesh('PA array bumper',[sx,bumperY,paZ],[.96,.08,.64],trimCol));
   for(let c=0;c<5;c++){
    const cy=bumperY-.22-c*.29,cz=paZ-c*c*.016;
    pushGrp(paGrp,paVi,paEn,boxMesh('PA line array',[sx,cy,cz],[.90,.25,.52],darkMetal));
    pushGrp(paGrp,paVi,paEn,boxMesh('PA array grille',[sx,cy,cz+.265],[.84,.21,.02],[.20,.24,.30,1]));
   }
  }
 }
 return meshes;
}
if(typeof window!=='undefined')window.buildStageShellMeshes=buildStageShellMeshes;
function demo(){state.rebindId=null;engine.view='stage';engine.showGuides=true;engine.globalTest=false;engine.mapExact=false;state.step='stage';state.quad=false;state.quadPoints=[];state.duration=12;state.time=0;$('quadHint').classList.add('hidden');let meshes=buildStageShellMeshes({widthM:19,depthM:7,heightM:.6,topY:6.6,trussMode:'box',includePA:true}),screens=[];let addLED=(name,c,w,h,ry=0,map={})=>{let q=quadMesh(name,[[-w/2,h/2,0],[w/2,h/2,0],[w/2,-h/2,0],[-w/2,-h/2,0]],{color:[.04,.05,.08,1]});let mat=M.mm(M.translate(c),M.rotate([0,1,0],ry));let grp='led_asm_'+name,gvi='Cụm Màn LED: '+name,gen='LED Screen Assembly: '+name;transformMesh(q,mat);q._smartGroupId=grp;q.nodePath=grp+'/panel';q._groupLabelVi=gvi;q._groupLabelEn=gen;meshes.push(q);screens.push({mesh:q,pos:c,yawDeg:+(ry*180/Math.PI).toFixed(2),wM:w,hM:h,map});let b=boxMesh(name.replace('LED','Frame'),[0,0,-.10],[w+.12,h+.12,.18],[.12,.13,.17,1]);transformMesh(b,mat);b._smartGroupId=grp;b.nodePath=grp+'/frame';b._groupLabelVi=gvi;b._groupLabelEn=gen;meshes.push(b)};
 addLED('LED_MAIN',[0,3.05,-2.1],9.0,4.5,0,{x:960,y:160,w:1920,h:960,cabinetModelId:'roe_bp2v2_500',processorModelId:'brompton_sx40',rows500x1000:4,rows500x500:1,shapeType:'flat'});addLED('LED_WING_L',[-6.25,3.05,-1.65],2.5,4.5,.18,{x:320,y:160,w:520,h:960,cabinetModelId:'absen_pl39_1000',processorModelId:'novastar_vx1000',shapeType:'flat'});addLED('LED_WING_R',[6.25,3.05,-1.65],2.5,4.5,-.18,{x:3000,y:160,w:520,h:960,cabinetModelId:'absen_pl39_1000',processorModelId:'novastar_vx1000',shapeType:'flat'});
 engine.setModel(meshes);engine.surfaces=[];engine.master={width:3840,height:1280};for(let s of screens){let surf=createSurface(s.mesh,s.mesh.name,s.map);if(surf&&s.map){if(s.map.cabinetModelId)surf.cabinetModelId=s.map.cabinetModelId;if(s.map.processorModelId)surf.processorModelId=s.map.processorModelId;if(s.map.rows500x1000!==undefined)surf.rows500x1000=s.map.rows500x1000;if(s.map.rows500x500!==undefined)surf.rows500x500=s.map.rows500x500;if(s.map.shapeType)surf.shapeType=s.map.shapeType;surf.pos=s.pos.slice();surf.yawDeg=s.yawDeg;surf.physical=[s.wM,s.hM];surf.physicalWidthM=s.wM;surf.physicalHeightM=s.hM;s.mesh._surfaceId18=surf.id;if(surf.mesh)surf.mesh._surfaceId18=surf.id;normalizeSurfaceHardware(surf);}}engine.selected=engine.surfaces[0].id;state.model={name:'ALPHA_Demo_Stage',files:[],demo:true};state.projectName='ALPHA_Demo_Stage';state.selectedMesh=null;state.hit=null;engine.cameraPreset('iso');engine.camera.yaw=.15;engine.camera.pitch=.2;rigPreset('concert',false);state.history=[];state.redo=[];renderUI();}
function stageRigAnchors(){const bars=(engine.stage||[]).filter(m=>m&&m.name==='Truss crossbar'&&!m.hidden);if(!bars.length)return null;const zc=m=>(m.bounds.min[2]+m.bounds.max[2])*.5,minZc=Math.min(...bars.map(zc)),backBars=bars.filter(m=>zc(m)<=minZc+1),frontBars=bars.filter(m=>zc(m)>minZc+1.5);const backZ=+((Math.min(...backBars.map(m=>m.bounds.min[2]))+Math.max(...backBars.map(m=>m.bounds.max[2])))*.5).toFixed(2),backHangY=+(Math.min(...backBars.map(m=>m.bounds.min[1]))-.15).toFixed(2),frontZ=frontBars.length?+((Math.min(...frontBars.map(m=>m.bounds.min[2]))+Math.max(...frontBars.map(m=>m.bounds.max[2])))*.5).toFixed(2):null,frontHangY=frontBars.length?+(Math.min(...frontBars.map(m=>m.bounds.min[1]))-.15).toFixed(2):backHangY,halfW=+((Math.max(...backBars.map(m=>m.bounds.max[0]))-Math.min(...backBars.map(m=>m.bounds.min[0])))*.5).toFixed(2);const deck=engine.stage.find(m=>m&&m.name==='Stage platform'&&!m.hidden),deckY=+(deck?deck.bounds.max[1]:.6).toFixed(2),deckFrontZ=+(deck?deck.bounds.max[2]:3).toFixed(2),mainLed=(engine.surfaces||[]).find(s=>/MAIN/i.test(s.name))||engine.surfaces?.[0],ledZ=+(mainLed?.mesh?mainLed.mesh.bounds.max[2]:backZ+.45).toFixed(2);const bases=(engine.stage||[]).filter(m=>m&&m.name==='Truss Baseplate'&&!m.hidden).map(m=>[+((m.bounds.min[0]+m.bounds.max[0])*.5).toFixed(2),+((m.bounds.min[2]+m.bounds.max[2])*.5).toFixed(2)]),refZ=frontZ??backZ,leftBases=bases.filter(c=>c[0]<0).sort((a,b)=>Math.abs(a[1]-refZ)-Math.abs(b[1]-refZ)),rightBases=bases.filter(c=>c[0]>0).sort((a,b)=>Math.abs(a[1]-refZ)-Math.abs(b[1]-refZ));return{backZ,backHangY,frontZ,frontHangY,halfW,deckY,deckFrontZ,ledZ,towers:[leftBases[0]||[-halfW,refZ],rightBases[0]||[halfW,refZ]]};}
if(typeof window!=='undefined')window.stageRigAnchors=stageRigAnchors;
function rigPreset(name,history=true){if(history)checkpoint();let w=engine.size.width,h=engine.size.height,d=Math.max(engine.size.depth,5),A=stageRigAnchors();let colors=name==='warm'?['#ffd09a','#ffb86b']:name==='cool'?['#d6eeff','#7fc9ff']:['#66d5ff','#be7bff'];if(A){let spanM=Math.max(4,+(A.halfW*2).toFixed(2)),endClearM=Math.max(.65,+(spanM*.09).toFixed(3)),usableSpanM=Math.max(1,spanM-endClearM*2),beamCols=name==='warm'?['#ffd09a','#ffb86b']:name==='cool'?['#d6eeff','#7fc9ff']:['#38bdf8','#e0f2fe','#818cf8'],washCols=name==='warm'?['#ffb86b','#ffd09a']:name==='cool'?['#7fc9ff','#bae6fd']:['#c084fc','#38bdf8'],fz=A.frontZ??A.backZ,fy=A.frontZ!==null?A.frontHangY:A.backHangY,fTruss=A.frontZ!==null?'TRUSS_FRONT':'TRUSS_MAIN';let backBeams=[-.39,-.13,.13,.39].map((u,i)=>{let rawX=+(u*usableSpanM).toFixed(3),distFromLeft=rawX+spanM*.5,spigotMod=distFromLeft%2,nudge=Math.min(spigotMod,2-spigotMod)<.06?(rawX<0?-.08:.08):0,posX=+(rawX+nudge).toFixed(3);return{id:'light_'+i,name:'Beam '+String(i+1).padStart(2,'0'),type:'beam',fixtureType128:'beam5r',aperture:.03,beamProfile18:0,model:'Robe Pointe 280W',oflModel:'Robe Pointe 280W',oflProfileId:'vn-stage/beam-230-7r',weightKg:15,powerW:380,beamAngleDeg:5,luminousFluxLm:18500,dmxUniverse:1,dmxAddress:1+i*16,dmxChannels:16,trussId:'TRUSS_MAIN',pos:[posX,A.backHangY,A.backZ],target:[+(posX*1.18).toFixed(2),+(A.deckY+3.9+(i%2)*.55).toFixed(2),+(A.deckFrontZ+4.4).toFixed(2)],color:beamCols[i%beamCols.length],power:name==='blackout'?0:name==='warm'?2.6:3.2,angle:5,enabled:name!=='blackout',sweep:name==='concert',speed:.32,phase:i*.45,fx:'steady',fxDepth:.5,fxSpeed:2.0,boost:1}});let frontWashes=[-4.6,4.6].map((wx,j)=>{let px=+(wx*(A.halfW/8.9)).toFixed(2);return{id:'light_'+(4+j),name:'Wash '+String(j+1).padStart(2,'0'),type:'wash',fixtureType128:'washRGB',aperture:.08,beamProfile18:2,model:'Martin MAC Aura XB',oflModel:'Martin MAC Aura XB',oflProfileId:'vn-stage/par-led-54x3w',weightKg:19,powerW:450,beamAngleDeg:28,luminousFluxLm:22000,dmxUniverse:1,dmxAddress:65+j*16,dmxChannels:16,trussId:fTruss,pos:[px,fy,fz],target:[+(px*.72).toFixed(2),A.deckY,-.35],color:washCols[j%washCols.length],power:name==='blackout'?0:name==='warm'?2.5:2.8,angle:name==='cool'?22:18,enabled:name!=='blackout',sweep:false,speed:.25,phase:j*.5,fx:'steady',fxDepth:.4,fxSpeed:1.8,boost:1}});let keyProfiles=[-1.25,1.25].map((kx,j)=>({id:'light_'+(6+j),name:'Key Profile '+String(j+1).padStart(2,'0'),type:'spot',fixtureType128:'profile',aperture:.028,beamProfile18:1,model:'Moving Head Spot 350W',oflModel:'Moving Head Spot 350W',oflProfileId:'generic/moving-head-spot-350w',weightKg:21,powerW:420,beamAngleDeg:12,luminousFluxLm:24000,dmxUniverse:1,dmxAddress:97+j*20,dmxChannels:20,trussId:fTruss,pos:[kx,fy,fz],target:[+(kx*.35).toFixed(2),+(A.deckY+1.15).toFixed(2),.45],color:'#fff1dc',power:name==='blackout'?0:2.5,angle:11,enabled:name!=='blackout',sweep:false,speed:.2,phase:j*.6,fx:'steady',fxDepth:.3,fxSpeed:1.5,boost:1}));let floorBars=[-5.2,-2.1,2.1,5.2].map((bx,j)=>({id:'light_'+(8+j),name:'Barra LED '+String(j+1).padStart(2,'0'),type:'bar',fixtureType128:'pixel',strobeCapable18:true,aperture:.07,beamProfile18:4,model:'Katana LED Matrix Bar 1m',oflModel:'Katana LED Matrix Bar 1m',oflProfileId:'vn-stage/katana-led-bar-1m',weightKg:8.5,powerW:280,beamAngleDeg:12,luminousFluxLm:14000,dmxUniverse:1,dmxAddress:137+j*24,dmxChannels:24,trussId:'STAGE_DECK_FRONT',pos:[bx,+(A.deckY+.04).toFixed(2),+(A.ledZ+.65).toFixed(2)],target:[bx,+(A.deckY+4.8).toFixed(2),+(A.ledZ+.82).toFixed(2)],color:name==='warm'?'#ffb86b':(j%2===0?'#00f5d4':'#f59e0b'),power:name==='blackout'?0:2.8,angle:10,enabled:name!=='blackout',sweep:false,speed:.4,phase:j*.5,fx:'pulse',fxDepth:.45,fxSpeed:2.4,boost:1}));let blinders=[-3.2,3.2].map((bx,j)=>({id:'light_'+(12+j),name:'Blinder '+String(j+1).padStart(2,'0'),type:'blinder',fixtureType128:'blinder',strobeCapable18:true,aperture:.085,beamProfile18:3,model:'Audience Blinder 4-Lite',oflModel:'Audience Blinder 4-Lite',oflProfileId:'vn-stage/cob-blinder-4x100w',weightKg:9.5,powerW:400,beamAngleDeg:45,luminousFluxLm:32000,dmxUniverse:1,dmxAddress:233+j*8,dmxChannels:8,trussId:'STAGE_DECK_FRONT',pos:[bx,+(A.deckY+.05).toFixed(2),+(A.ledZ+.55).toFixed(2)],target:[+(bx*.9).toFixed(2),+(A.deckY+4.2).toFixed(2),+(A.ledZ+1.15).toFixed(2)],color:'#ffbe6b',power:name==='blackout'?0:1.1,angle:24,enabled:name!=='blackout',sweep:false,speed:.25,phase:j*.8,fx:'steady',fxDepth:.4,fxSpeed:1.8,boost:1}));let sideSpots=A.towers.map((tCol,j)=>({id:'light_'+(14+j),name:'Spot Profile '+String(j+1).padStart(2,'0'),type:'spot',fixtureType128:'hybrid',aperture:.045,beamProfile18:1,model:'Moving Head Spot 350W',oflModel:'Moving Head Spot 350W',oflProfileId:'generic/moving-head-spot-350w',weightKg:21,powerW:420,beamAngleDeg:14,luminousFluxLm:24000,dmxUniverse:1,dmxAddress:249+j*20,dmxChannels:20,trussId:j===0?'TOWER_L':'TOWER_R',pos:[+(tCol[0]-Math.sign(tCol[0]||1)*.16).toFixed(2),+(A.deckY+2.65).toFixed(2),tCol[1]],target:[0,+(A.deckY+1.1).toFixed(2),.2],color:name==='warm'?'#ffd09a':'#f472b6',power:name==='blackout'?0:2.9,angle:10,enabled:name!=='blackout',sweep:name==='concert',speed:.28,phase:1.2+j*1.5,fx:'steady',fxDepth:.5,fxSpeed:2.0,boost:1}));engine.lights=[...backBeams,...frontWashes,...keyProfiles,...floorBars,...blinders,...sideSpots];}else{let spanM=Math.max(4,+(w*.94).toFixed(2)),endClearM=Math.max(.42,+(spanM*.08).toFixed(3)),usableSpanM=Math.max(.5,spanM-endClearM*2);let topLights=Array.from({length:6},(_,i)=>{let u=i/5-.5,rawX=+(u*usableSpanM).toFixed(3),distFromLeft=rawX+spanM*.5,spigotMod=distFromLeft%2,nudge=Math.min(spigotMod,2-spigotMod)<.06?(rawX<0?-.08:.08):0,posX=+(rawX+nudge).toFixed(3),isBeam=name!=='cool'&&i%2===0;return{id:'light_'+i,name:(isBeam?'Beam ':'Wash ')+String(i+1).padStart(2,'0'),type:isBeam?'beam':'wash',fixtureType128:isBeam?'beam5r':'washRGB',aperture:isBeam?.03:.08,model:isBeam?'Robe Pointe 280W':'Martin MAC Aura XB',oflModel:isBeam?'Robe Pointe 280W':'Martin MAC Aura XB',oflProfileId:isBeam?'vn-stage/beam-230-7r':'vn-stage/par-led-54x3w',weightKg:isBeam?15:19,powerW:isBeam?380:450,beamAngleDeg:isBeam?5:28,luminousFluxLm:isBeam?18500:22000,dmxUniverse:1,dmxAddress:1+i*16,dmxChannels:16,trussId:'TRUSS_MAIN',pos:[posX,+(h*.93).toFixed(2),+(-d*.23).toFixed(2)],target:[+(u*w*(name==='concert'?-.45:.65)).toFixed(2),.25,+(d*.55).toFixed(2)],color:colors[i%2],power:name==='blackout'?0:name==='warm'?3.2:4.5,angle:isBeam?8:(name==='cool'?24:16),enabled:name!=='blackout',sweep:name==='concert',speed:.35,phase:i*.4,fx:'steady',fxDepth:.55,fxSpeed:2.2,boost:1}});let floorBars=[-5.4,-1.8,1.8,5.4].map((bx,j)=>({id:'light_'+(6+j),name:'Barra LED '+String(j+1).padStart(2,'0'),type:'bar',fixtureType128:'pixel',strobeCapable18:true,aperture:.07,model:'Katana LED Matrix Bar 1m',oflModel:'Katana LED Matrix Bar 1m',oflProfileId:'vn-stage/katana-led-bar-1m',weightKg:8.5,powerW:280,beamAngleDeg:12,luminousFluxLm:14000,dmxUniverse:1,dmxAddress:97+j*24,dmxChannels:24,trussId:'STAGE_DECK_FRONT',pos:[bx,.58,2.45],target:[bx*.85,4.6,.4],color:name==='warm'?'#ffb86b':'#00f5d4',power:name==='blackout'?0:3.6,angle:12,enabled:name!=='blackout',sweep:false,speed:.4,phase:j*.5,fx:'pulse',fxDepth:.45,fxSpeed:2.4,boost:1}));let blinders=[-3.4,3.4].map((bx,j)=>({id:'light_'+(10+j),name:'Blinder '+String(j+1).padStart(2,'0'),type:'blinder',fixtureType128:'blinder',strobeCapable18:true,aperture:.085,model:'Audience Blinder 4-Lite',oflModel:'Audience Blinder 4-Lite',oflProfileId:'vn-stage/cob-blinder-4x100w',weightKg:9.5,powerW:400,beamAngleDeg:45,luminousFluxLm:32000,dmxUniverse:1,dmxAddress:193+j*8,dmxChannels:8,trussId:'STAGE_DECK_FRONT',pos:[bx,.58,2.35],target:[+(bx*.9).toFixed(2),4.2,.85],color:'#ffbe6b',power:name==='blackout'?0:1.6,angle:26,enabled:name!=='blackout',sweep:false,speed:.25,phase:j*.8,fx:'steady',fxDepth:.4,fxSpeed:1.8,boost:1}));let sideSpots=[-7.6,7.6].map((bx,j)=>({id:'light_'+(12+j),name:'Spot Profile '+String(j+1).padStart(2,'0'),type:'spot',fixtureType128:'hybrid',aperture:.045,model:'Moving Head Spot 350W',oflModel:'Moving Head Spot 350W',oflProfileId:'generic/moving-head-spot-350w',weightKg:21,powerW:420,beamAngleDeg:14,luminousFluxLm:24000,dmxUniverse:1,dmxAddress:209+j*20,dmxChannels:20,trussId:j===0?'TOWER_L':'TOWER_R',pos:[bx,4.4,-1.35],target:[0,1.4,1.2],color:name==='warm'?'#ffd09a':'#ff6bcb',power:name==='blackout'?0:4.2,angle:11,enabled:name!=='blackout',sweep:name==='concert',speed:.3,phase:1.2+j*1.5,fx:'steady',fxDepth:.5,fxSpeed:2.0,boost:1}));engine.lights=[...topLights,...floorBars,...blinders,...sideSpots];}state.selectedLight=engine.lights[0].id;engine.settings.ambient=name==='blackout'?.12:name==='warm'?.55:.5;engine.settings.beam=name==='blackout'?0:.42;engine.rebuildFixtures();if(history){renderUI();toast((typeof window==='undefined'?"Đã áp preset ánh sáng: ":window.tr?.("Đã áp preset ánh sáng: ","Lighting preset applied: ")??"Đã áp preset ánh sáng: ")+name)}}
function lightingFXPreset(mode){checkpoint();for(let i=0;i<engine.lights.length;i++){let l=engine.lights[i];if(mode==='boost'){l.enabled=true;l.sweep=true;l.fx='build';l.fxDepth=.65;l.fxSpeed=1.2;l.boost=1.5;l.power=Math.max(l.power,4.8)}else if(mode==='pulse'){l.enabled=true;l.fx='pulse';l.fxDepth=.55;l.fxSpeed=2.6;l.boost=1.12}else if(mode==='strobe'){l.enabled=true;l.fx='strobe';l.fxDepth=.98;l.fxSpeed=8.5;l.boost=1.25}else if(mode==='steady'){l.fx='steady';l.fxDepth=.35;l.fxSpeed=2;l.boost=1}else if(mode==='sweep'){l.sweep=true;l.fx='steady';l.boost=1.08}}renderUI();toast((typeof window==='undefined'?"Đã áp show FX: ":window.tr?.("Đã áp show FX: ","Show effects applied: ")??"Đã áp show FX: ")+mode)}
function setStep(step){state.rebindId=null;$('quadHint').classList.add('hidden');state.step=step;state.quad=false;state.quadPoints=[];renderUI();}
function selectSurface(id){engine.selected=id;state.step='mapping';renderUI()}
function renderLists(){let query=$('objectSearch').value.trim().toLowerCase(),sfxItems=state.step==='lighting'&&typeof window!=='undefined'&&Array.isArray(window.STUDIO?.stageAssets16?.items)?window.STUDIO.stageAssets16.items.filter(it=>/^(cold_spark_fountain|co2_jet|flame_jet|confetti_cannon|haze_machine_pro)$/.test(it.kind||it.type||'')).map(it=>({...it,_isPyroSfx18:true})):[],arr=state.step==='stage'?engine.stage.filter(m=>!m._sfxKind16&&!m._venueArch18):state.step==='mapping'?engine.surfaces:[...engine.lights,...sfxItems],loc=typeof localizeObjectName==='function'?localizeObjectName:s=>s,flt=state.step==='stage'&&typeof window!=='undefined'&&window._objFilter16||'all',lightFlt=state.step==='lighting'&&typeof window!=='undefined'&&window._lightFilter16||'all';let visible=arr.filter(m=>{if(m._deleted8||m._sfxKind16||m._venueArch18)return false;if(state.step==='stage'&&flt!=='all'&&typeof matchesObjectFilter16==='function'&&!matchesObjectFilter16(m,flt))return false;if(state.step==='lighting'&&lightFlt!=='all'&&typeof matchesLightingFilter16==='function'&&!matchesLightingFilter16(m,lightFlt))return false;const raw=(m.name||'').toLowerCase();return raw.includes(query)||loc(m.name||'').toLowerCase().includes(query);});$('leftTitle').textContent=state.step==='stage'?(typeof window==='undefined'?"Cấu trúc sân khấu":window.tr?.("Cấu trúc sân khấu","Stage structure")??"Cấu trúc sân khấu"):state.step==='mapping'?(typeof window==='undefined'?"Danh sách LED":window.tr?.("Danh sách LED","LED list")??"Danh sách LED"):(typeof window==='undefined'?"Hệ thống đèn":window.tr?.("Hệ thống đèn","Lighting system")??"Hệ thống đèn");const leftSvgUse=typeof document!=='undefined'&&document.querySelector?.('.object-section .section-heading svg use');const leftSvg=typeof document!=='undefined'&&document.querySelector?.('.object-section .section-heading svg');if(leftSvgUse&&leftSvg){if(state.step==='stage'){leftSvgUse.setAttribute('href','#i-layers');leftSvg.className.baseVal='ico ico-stage';}else if(state.step==='mapping'){leftSvgUse.setAttribute('href','#i-grid-3x3');leftSvg.className.baseVal='ico ico-led';}else{leftSvgUse.setAttribute('href','#i-lightbulb');leftSvg.className.baseVal='ico ico-lights';}}$('leftCount').textContent=arr.length;$('meshCount').textContent=engine.stage.filter(m=>!m._sfxKind16&&!m._venueArch18&&!m._deleted8).length+(typeof window==='undefined'?" đối tượng":window.tr?.(" đối tượng"," objects")??" đối tượng");$('objectList').innerHTML='';if(!state._skipStageRows8){let slice=visible.slice(0,250);if(state.step==='stage'&&state.selectedMesh&&!slice.some(x=>x.id===state.selectedMesh)){let selItem=visible.find(x=>x.id===state.selectedMesh);if(selItem)slice.push(selItem);}for(let item of slice){let b=document.createElement('button'),isSfx=!!item._isPyroSfx18,sel=state.step==='stage'?state.selectedMesh===item.id:state.step==='mapping'?engine.selected===item.id:isSfx?(state.selectedSfx18===item.id):(!state.selectedSfx18&&state.selectedLight===item.id);b.className='object-row '+(sel?'selected':'');b.dataset.itemId=item.id;if(isSfx)b.dataset.sfxId=item.id;let detail=state.step==='stage'?fmt(item.p.length/9)+(typeof window==='undefined'?" tam giác":window.tr?.(" tam giác"," triangles")??" tam giác"):state.step==='mapping'?`${item.w} x ${item.h} / ${engine.media.get(item.source)?.name||item.source}`:isSfx?((typeof window==='undefined'?"Pháo & SFX":window.tr?.("Pháo & SFX","Pyro & SFX")??"Pháo & SFX")+(Array.isArray(item.pos)?` · [${item.pos.map(v=>Number(v).toFixed(1)).join(', ')}]m`:'')):(item.enabled?(typeof window==='undefined'?"Bật":window.tr?.("Bật","On")??"Bật"):(typeof window==='undefined'?"Tắt":window.tr?.("Tắt","Off")??"Tắt"))+' / '+item.angle+'°';b.innerHTML=`${objectRowIcon9(item,state.step,false)}<span class="row-main"><strong>${esc(loc(item.name))}</strong><small>${esc(detail)}</small></span>${state.step==='mapping'?'<i class="row-dot"></i>':''}`;b.onclick=()=>{if(state.step==='stage'){state.selectedMesh=item.id;state.hit=null;engine.selected=null;renderUI()}else if(state.step==='mapping')selectSurface(item.id);else if(isSfx){state.selectedSfx18=item.id;state.selectedLight=null;if(typeof window!=='undefined'&&window.STUDIO?.stageAssets16){window.STUDIO.stageAssets16.selected=item.id;const ms=window.STUDIO.stageAssets16.meshMap?.get?.(item.id);if(ms?.[0])state.selectedMesh=ms[0].id;}renderUI()}else{state.selectedSfx18=null;state.selectedLight=item.id;renderUI()}};$('objectList').appendChild(b)}if(!visible.length)$('objectList').innerHTML=(typeof window==='undefined'?"<p class=\"hint-text\">Chưa có mục nào. Hãy nhập model hoặc tạo LED.</p>":window.tr?.("<p class=\"hint-text\">Chưa có mục nào. Hãy nhập model hoặc tạo LED.</p>","<p class=\"hint-text\">No items yet. Import a model or create LEDs.</p>")??"<p class=\"hint-text\">Chưa có mục nào. Hãy nhập model hoặc tạo LED.</p>");}$('repairMapping').style.display=state.step==='lighting'?'none':'';$('repairMapping').disabled=!engine.surfaces.length;$('autoDetect').style.display=state.step==='lighting'?'none':'';$('drawQuad').style.display=state.step==='lighting'?'none':'';
 $('mediaList').innerHTML='';if(!state.media.length)$('mediaList').innerHTML=(typeof window==='undefined'?"<div class=\"media-empty\">Thả video mapped vào đây.<br>Một master video, nhiều vùng LED.</div>":window.tr?.("<div class=\"media-empty\">Thả video mapped vào đây.<br>Một master video, nhiều vùng LED.</div>","<div class=\"media-empty\">Drop mapped video here.<br>One master video, multiple LED regions.</div>")??"<div class=\"media-empty\">Thả video mapped vào đây.<br>Một master video, nhiều vùng LED.</div>");for(let a of state.media){let row=document.createElement('div');row.className='media-row';row.innerHTML=`<img class="media-thumb" alt="${window.tr?.('Ảnh thu nhỏ media','Media thumbnail')??'Ảnh thu nhỏ media'}"><div><strong>${esc(a.name)}</strong><small>${a.width} x ${a.height} ${a.duration?' / '+a.duration.toFixed(1)+'s':''}</small></div>`;row.querySelector('img').src=a.thumb;row.onclick=()=>{if(surface()){checkpoint();setSource(surface(),a.id);state.step='mapping';renderUI();toast((typeof window==='undefined'?"Đã gán ":window.tr?.("Đã gán ","Assigned ")??"Đã gán ")+a.name+(typeof window==='undefined'?" cho LED đang chọn.":window.tr?.(" cho LED đang chọn."," to the selected LED.")??" cho LED đang chọn."))}else{state.step='mapping';renderUI();toast((typeof window==='undefined'?"Chọn một LED để gán video.":window.tr?.("Chọn một LED để gán video.","Select an LED to assign video.")??"Chọn một LED để gán video."))}};$('mediaList').appendChild(row)}$('sampleVideo')?.classList?.toggle?.('is-compact',state.media.length>0);
}
function matchesLightingFilter16(item,filter){
 if(!filter||filter==='all'||!item)return true;
 const raw=((item.type||item.kind||'')+' '+(item.name||'')).toLowerCase();
 const isSfx=!!(item._isPyroSfx18||item._sfxKind16||/spark|co2|flame|haze|pyro|confetti|pháo|khói|lửa/.test(raw));
 if(filter==='sfx')return isSfx;
 if(isSfx)return false;
 const isLaser=/laser/.test(raw);
 if(filter==='laser')return isLaser;
 if(isLaser)return false;
 const isStatic=/par|bar|barra|katana|blinder|strobe|atomic|fresnel|chớp/.test(raw);
 if(filter==='static')return isStatic;
 if(filter==='moving')return !isStatic;
 return true;
}
if(typeof window!=='undefined')window.matchesLightingFilter16=matchesLightingFilter16;
function objectRowIcon9(obj,kind='mesh',isGroup=false){
 const raw=((obj?.name||'')+' '+(obj?._smartGroupId||'')+' '+(obj?._groupLabelEn||'')+' '+(obj?.nodePath||'')+' '+(obj?.path||'')+' '+(obj?.type||'')+' '+(obj?.kind||'')+' '+(obj?.shapeType||'')).toLowerCase();
 let cat='mesh',ico=isGroup?'layers':'box',col='#60a5fa';
 if(kind==='lighting'||kind==='light'){
  const t=((obj?.type||obj?.kind||'')+' '+raw).toLowerCase();
  if(/co2|haze|smoke|cryo|khói|sương/.test(t)){cat='sfx-cryo';ico='cloud';col='#67e8f9';}
  else if(/flame|fire|lửa/.test(t)){cat='sfx-flame';ico='zap';col='#f97316';}
  else if(obj?._isPyroSfx18||/spark|pyro|confetti|pháo/.test(t)){cat='sfx-spark';ico='sparkles';col='#fbbf24';}
  else if(/laser/.test(t)){cat='light-laser';ico='laser';col='#22c55e';}
  else if(/blinder|chandelier/.test(t)){cat='light-blinder';ico='sun';col='#eab308';}
  else if(/strobe|atomic/.test(t)){cat='light-strobe';ico='zap';col='#38bdf8';}
  else if(/bar|barra|katana/.test(t)){cat='light-bar';ico='sliders-horizontal';col='#c084fc';}
  else if(/par|fresnel/.test(t)){cat='light-par';ico='lightbulb';col='#fb923c';}
  else{cat='light-moving';ico='moving-head';col='#f59e0b';}
  if(/^#[0-9a-f]{3,8}$/i.test(obj?.color||''))col=obj.color;
 }else if(kind==='mapping'){
  if(/cube|cyl|curve|corner|arch|ring/.test(raw)){cat='led-geo';ico='matrix';col='#e879f9';}
  else if(/wing|line|strip|header|side|cánh|viền|tiêu đề/.test(raw)){cat='led-wing';ico='columns-3';col='#38bdf8';}
  else{cat='led-main';ico='grid-3x3';col='#a855f7';}
 }else if(kind==='act'){
  const t=obj?.type||raw;
  if(/laser/.test(t)){cat='act-laser';ico='laser';col='#22c55e';}
  else if(/water/.test(t)){cat='act-water';ico='waves';col='#06b6d4';}
  else if(/reveal|launch/.test(t)){cat='act-reveal';ico='crown';col='#f59e0b';}
  else{cat='cast-act';ico='sparkles';col='#f43f5e';}
 }else if(kind==='person'){
  const t=obj?.type||raw;
  if(/audience|khán giả/.test(t)){cat='cast-audience';ico='drama';col='#a78bfa';}
  else if(/mc|host/.test(t)){cat='cast-mc';ico='message-square';col='#fbbf24';}
  else if(/singer|rapper|ca sĩ/.test(t)){cat='cast-vocal';ico='music';col='#f472b6';}
  else if(/dj|drum/.test(t)){cat='cast-band';ico='disc';col='#fb923c';}
  else if(/guitar|bass|key|violin|sax/.test(t)){cat='cast-band';ico='music';col='#fb923c';}
  else if(/leddancer|laserdancer|fandancer/.test(t)){cat='cast-dancer';ico='sparkles';col='#38bdf8';}
  else{cat='cast-dancer';ico='person-standing';col='#22d3ee';}
 }else{
  if(/frame_|\/frame\b|\bframe\b|khung màn|khung led/.test(raw)&&!/truss|bumper|brass/.test(raw)){cat='led-frame';ico='square-dashed';col='#818cf8';}
  else if(/led_asm_|led_|screen|màn led|cổng chào led|kinetic led|led trim/.test(raw)){
   if(/cube|cyl|curve|corner|ring|kinetic|arch/.test(raw)){cat='led-geo';ico='matrix';col='#e879f9';}
   else if(/wing|line|header|trim|cánh|viền|tiêu đề/.test(raw)){cat='led-wing';ico='columns-3';col='#c084fc';}
   else{cat='led-main';ico='grid-3x3';col='#a855f7';}
  }else if(/scissor|lift|bàn nâng/.test(raw)){cat='stage-lift';ico='scissor-lift';col='#22d3ee';}
  else if(/stair|step|nosing|cầu thang|tam cấp|bậc/.test(raw)){cat='stairs';ico='arrow-up-from-line';col='#10b981';}
  else if(/handrail|barrier|mojo|tay vịn|rào chắn/.test(raw)){cat='barrier';ico='maximize';col='#34d399';}
  else if(/stage_shell_truss|truss|tower|goalpost|pillar|crossbar|diagonal|cột truss|đà ngang|thanh chéo|thanh giằng truss/.test(raw)){cat='truss';ico='columns-3';col='#38bdf8';}
  else if(/sub_stack|subwoofer|loa sub/.test(raw)){cat='pa-sub';ico='disc';col='#14b8a6';}
  else if(/stage_shell_pa|line array|line_array|speaker|grille|bumper|cụm loa|loa/.test(raw)){cat='pa-array';ico='waves';col='#2dd4bf';}
  else if(/co2|haze|smoke|cryo|khói|sương/.test(raw)){cat='sfx-cryo';ico='cloud';col='#67e8f9';}
  else if(/flame|fire|lửa/.test(raw)){cat='sfx-flame';ico='zap';col='#f97316';}
  else if(/spark|pyro|confetti|pháo/.test(raw)){cat='sfx-spark';ico='sparkles';col='#fbbf24';}
  else if(/laser/.test(raw)){cat='light-laser';ico='laser';col='#22c55e';}
  else if(/chandelier|blinder|đèn chùm/.test(raw)){cat='light-blinder';ico='sun';col='#eab308';}
  else if(/moving head|beam|spot|wash|par |katana|fixture|đèn/.test(raw)){cat='light-moving';ico='moving-head';col='#f59e0b';}
  else if(/dj|foh|console|mixer|grandma|bàn điều khiển|bàn trộn/.test(raw)){cat='booth-foh';ico='sliders-horizontal';col='#38bdf8';}
  else if(/podium|lectern|sofa|carpet|trophy|touch sphere|bục phát biểu|thảm đỏ|kệ trưng bày|quả cầu/.test(raw)){cat='vip-decor';ico='crown';col='#f59e0b';}
  else if(/table|chair|banquet|chiavari|planter|foliage|backdrop|arch|bàn|ghế|chậu|tán cây|cổng hơi/.test(raw)){cat='furniture';ico='package';col='#f472b6';}
  else if(/layher|leg|brace|chân/.test(raw)&&!/stage_shell_deck/.test(raw)&&!isGroup){cat='stage-leg';ico='sliders-horizontal';col='#0ea5e9';}
  else if(/stage_shell_deck|platform|stage deck|deck|fascia|catwalk|riser|floor|sàn/.test(raw)){cat='stage-deck';ico='layers';col='#06b6d4';}
 }
 return `<span class="row-icon" data-row-cat="${cat}" style="--row-c:${col}"><svg class="ico" aria-hidden="true"><use href="#i-${ico}"></use></svg></span>`;
}
if(typeof window!=='undefined')window.objectRowIcon9=objectRowIcon9;
function renderUI(){const loc=typeof localizeObjectName==='function'?localizeObjectName:s=>s;$('engineState').textContent=engine.surfaces.length+' LED / '+engine.lights.filter(l=>l.enabled).length+(typeof window==='undefined'?" đèn":window.tr?.(" đèn"," lights")??" đèn");$('timeLabel').textContent=Math.floor(state.time/60).toString().padStart(2,'0')+':'+(state.time%60).toFixed(2).padStart(5,'0');document.querySelectorAll('[data-step]').forEach(b=>b.classList.toggle('active',b.dataset.step===state.step));document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===engine.view));$('projectName').textContent=state.projectName||state.model.name;$('modelLabel').textContent=state.model.demo?(typeof window==='undefined'?"ALPHA / Sân khấu mẫu":window.tr?.("ALPHA / Sân khấu mẫu","ALPHA / Demo stage")??"ALPHA / Sân khấu mẫu"):(state.model.blank&&!engine.stage.length)?(typeof window==='undefined'?"Sân khấu trống — Nhập model 3D":window.tr?.("Sân khấu trống — Nhập model 3D","Blank stage — Import 3D model")??"Sân khấu trống — Nhập model 3D"):state.model.name;{const eh=$('emptyHint'),showEmpty=!!(state.model?.blank&&!engine.stage.length&&!engine.surfaces.length&&!state.presenting&&engine.view==='stage');if(eh){eh.hidden=!showEmpty;eh.classList.toggle('hidden',!showEmpty);if(showEmpty){eh.innerHTML=`<strong>${typeof window==='undefined'?"Sân khấu trống — Sẵn sàng nhập thiết kế của bạn":window.tr?.("Sân khấu trống — Sẵn sàng nhập thiết kế của bạn","Blank stage — Ready to import your design")??"Sân khấu trống — Sẵn sàng nhập thiết kế của bạn"}</strong><p>${typeof window==='undefined'?"Kéo thả file 3D (.glb, .gltf, .dae, .obj) trực tiếp vào khung nhìn hoặc chọn tệp từ máy tính.":window.tr?.("Kéo thả file 3D (.glb, .gltf, .dae, .obj) trực tiếp vào khung nhìn hoặc chọn tệp từ máy tính.","Drag and drop a 3D file (.glb, .gltf, .dae, .obj) into the viewport or select files from your computer.")??"Kéo thả file 3D (.glb, .gltf, .dae, .obj) trực tiếp vào khung nhìn hoặc chọn tệp từ máy tính."}</p><div class="empty-hint-actions"><button type="button" id="emptyHintImportBtn" class="btn primary small">${icon('upload')}<span>${typeof window==='undefined'?"Nhập sân khấu 3D":window.tr?.("Nhập sân khấu 3D","Import 3D stage")??"Nhập sân khấu 3D"}</span></button><button type="button" id="emptyHintFolderBtn" class="btn small">${icon('folder-open')}<span>${typeof window==='undefined'?"Nhập thư mục (DAE + Texture)":window.tr?.("Nhập thư mục (DAE + Texture)","Import folder (DAE + Textures)")??"Nhập thư mục (DAE + Texture)"}</span></button></div>`;if($('emptyHintImportBtn'))$('emptyHintImportBtn').onclick=()=>$('modelInput')?.click();if($('emptyHintFolderBtn'))$('emptyHintFolderBtn').onclick=()=>$('folderInput')?.click();}}}$('masterLabel').textContent=engine.master.width+' x '+engine.master.height;$('gpuInfo').textContent=fmt(engine.stage.reduce((sum,m)=>sum+m.p.length/9,0))+' TRIS';$('guidesBtn').classList.toggle('active',engine.showGuides);$('testPattern').classList.toggle('active',engine.globalTest);$('duration').value=state.duration;$('loopBtn').classList.toggle('active',state.loop);$('loopBtn').setAttribute('aria-pressed',String(!!state.loop));{const pb=$('playBtn'),pk=state.playing?'pause':'play';if(pb.dataset.icon!==pk){pb.dataset.icon=pk;pb.innerHTML=icon(pk);}}$('cameraBar').classList.toggle('hidden',engine.view!=='stage');$('selectionStatus').textContent=surface()?loc(surface().name)+' / '+surface().w+' x '+surface().h+' px':state.selectedMesh?(typeof window==='undefined'?"Đã chọn: ":window.tr?.("Đã chọn: ","Selected: ")??"Đã chọn: ")+loc(engine.stage.find(m=>m.id===state.selectedMesh)?.name):(typeof window==='undefined'?"Chọn một bề mặt trên model để tạo LED.":window.tr?.("Chọn một bề mặt trên model để tạo LED.","Select a model face to create an LED.")??"Chọn một bề mặt trên model để tạo LED.");$('trackClips').innerHTML=engine.surfaces.map(s=>`<div class="track-clip">${esc(loc(s.name))} / ${esc(engine.media.get(s.source)?.name||(typeof window==='undefined'?"Chuyển động":window.tr?.("Chuyển động","Motion")??"Chuyển động"))}</div>`).join('');$('ruler').innerHTML=Array.from({length:11},(_,i)=>'<span>'+((i/10)*state.duration).toFixed(0)+'s</span>').join('');$('seek').max=state.duration*100;renderLists();renderInspector();historyButtons()}
function field(id,label,value,{type='number',min,max,step=1}={}){return `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(value)}" ${min!==undefined?'min="'+min+'"':''} ${max!==undefined?'max="'+max+'"':''} step="${step}"></div>`}
function range(id,label,value,min,max,step=.01){return `<div class="field range-field"><label for="${id}">${label}</label><input type="range" id="${id}" value="${value}" min="${min}" max="${max}" step="${step}"><span class="range-value" id="${id}Val">${value}</span></div>`}
function change(id,fn,{live=false,history=true}={}){let el=$(id);if(!el)return;let started=false;el.addEventListener('focus',()=>started=false);el.addEventListener('pointerdown',()=>started=false);el.addEventListener(live?'input':'change',()=>{if(history&&!started){checkpoint();started=true}fn(el.type==='checkbox'?el.checked:el.value);if($(id+'Val'))$(id+'Val').textContent=el.value;if(!live)renderLists()})}
function renderInspector(){let box=$('inspectorContent'),loc=typeof localizeObjectName==='function'?localizeObjectName:s=>s;if(state.step==='stage'){
 let mesh=engine.stage.find(m=>m.id===state.selectedMesh);$('inspectorKicker').textContent=(typeof window==='undefined'?"Sân khấu":window.tr?.("Sân khấu","Stage")??"Sân khấu");$('inspectorTitle').textContent=mesh?loc(mesh.name):(typeof window==='undefined'?"Chuẩn bị sân khấu":window.tr?.("Chuẩn bị sân khấu","Prepare stage")??"Chuẩn bị sân khấu");$('inspectorSubtitle').textContent=mesh?(typeof window==='undefined'?"Chọn đúng mặt phát sáng, không phải cả khung LED.":window.tr?.("Chọn đúng mặt phát sáng, không phải cả khung LED.","Select the emitting face, not the entire LED frame.")??"Chọn đúng mặt phát sáng, không phải cả khung LED."):(typeof window==='undefined'?"Nhập model, sau đó click vào bề mặt màn hình.":window.tr?.("Nhập model, sau đó click vào bề mặt màn hình.","Import a model, then click a screen face.")??"Nhập model, sau đó click vào bề mặt màn hình.");box.innerHTML=`<div class="inspector-block"><div class="snapshot-info"><div><b>${fmt(engine.size.width)} m</b><span>${(typeof window==='undefined'?"Rộng model":window.tr?.("Rộng model","Model width")??"Rộng model")}</span></div><div><b>${fmt(engine.size.height)} m</b><span>${(typeof window==='undefined'?"Cao model":window.tr?.("Cao model","Model height")??"Cao model")}</span></div></div><p class="hint-text">${(typeof window==='undefined'?"GLB theo đơn vị mét. DAE dùng thông số unit của file. OBJ mặc định mét. Đây là kích thước model, chưa phải đo đạc thi công.":window.tr?.("GLB theo đơn vị mét. DAE dùng thông số unit của file. OBJ mặc định mét. Đây là kích thước model, chưa phải đo đạc thi công.","GLB uses meters. DAE uses its declared units. OBJ defaults to meters. These model dimensions are not construction measurements.")??"GLB theo đơn vị mét. DAE dùng thông số unit của file. OBJ mặc định mét. Đây là kích thước model, chưa phải đo đạc thi công.")}</p></div><div class="inspector-block"><h3 class="block-title"><svg class="ico ico-stage" aria-hidden="true"><use href="#i-scan"></use></svg><span>${(typeof window==='undefined'?"Chọn bề mặt LED":window.tr?.("Chọn bề mặt LED","Select LED face")??"Chọn bề mặt LED")}</span></h3><div class="chip-select"><button id="pickFace" class="${state.pickMode==='face'?'active':''}">${(typeof window==='undefined'?"Mặt phẳng":window.tr?.("Mặt phẳng","Planar face")??"Mặt phẳng")}</button><button id="pickMesh" class="${state.pickMode==='mesh'?'active':''}">${(typeof window==='undefined'?"Cả mesh / UV":window.tr?.("Cả mesh / UV","Entire mesh / UV")??"Cả mesh / UV")}</button></div><p class="hint-text">${(typeof window==='undefined'?"Mặt phẳng: click vào đúng mặt trước của LED. Cả mesh / UV: dành cho LED cong đã có UV chuẩn.":window.tr?.("Mặt phẳng: click vào đúng mặt trước của LED. Cả mesh / UV: dành cho LED cong đã có UV chuẩn.","Planar face: click the LED front face. Entire mesh / UV: for curved LEDs with valid UVs.")??"Mặt phẳng: click vào đúng mặt trước của LED. Cả mesh / UV: dành cho LED cong đã có UV chuẩn.")}</p><button id="createLED" class="btn primary full-btn" ${!mesh?'disabled':''}>${(typeof window==='undefined'?"+ Tạo LED từ ":window.tr?.("+ Tạo LED từ ","+ Create LED from ")??"+ Tạo LED từ ")}${state.pickMode==='face'?(typeof window==='undefined'?"mặt đang chọn":window.tr?.("mặt đang chọn","selected face")??"mặt đang chọn"):(typeof window==='undefined'?"mesh / UV gốc":window.tr?.("mesh / UV gốc","original mesh / UV")??"mesh / UV gốc")}</button></div><div class="divider"></div><div class="inspector-block"><h3 class="block-title">${(typeof window==='undefined'?"Góc nhìn &amp; chất lượng":window.tr?.("Góc nhìn &amp; chất lượng","View &amp; quality")??"Góc nhìn &amp; chất lượng")}</h3>${range('ambientStage',(typeof window==='undefined'?"Sáng môi trường":window.tr?.("Sáng môi trường","Ambient light")??"Sáng môi trường"),engine.settings.ambient,.05,1.5,.05)}${range('exposureStage',(typeof window==='undefined'?"Phơi sáng":window.tr?.("Phơi sáng","Exposure")??"Phơi sáng"),engine.settings.exposure,.3,2.5,.05)}<label class="check-row"><input id="gridStage" type="checkbox" ${engine.settings.grid?'checked':''}>${(typeof window==='undefined'?" Lưới sàn tham chiếu":window.tr?.(" Lưới sàn tham chiếu"," Reference floor grid")??" Lưới sàn tham chiếu")}</label></div><div class="info-box"><strong>${(typeof window==='undefined'?"Quy trình SketchUp":window.tr?.("Quy trình SketchUp","SketchUp workflow")??"Quy trình SketchUp")}</strong><br>${(typeof window==='undefined'?"File &gt; Export &gt; 3D Model &gt; GLB hoặc DAE.":window.tr?.("File &gt; Export &gt; 3D Model &gt; GLB hoặc DAE.","File &gt; Export &gt; 3D Model &gt; GLB or DAE.")??"File &gt; Export &gt; 3D Model &gt; GLB hoặc DAE.")}<br>${(typeof window==='undefined'?"DAE: chọn kèm thư mục ảnh texture.":window.tr?.("DAE: chọn kèm thư mục ảnh texture.","DAE: include the texture image folder.")??"DAE: chọn kèm thư mục ảnh texture.")}<br><b>${(typeof window==='undefined'?"Không mở trực tiếp .skp.":window.tr?.("Không mở trực tiếp .skp.","Cannot open .skp directly.")??"Không mở trực tiếp .skp.")}</b></div><div class="hint-text">${(typeof window==='undefined'?"GLB nén Draco / Meshopt / KTX2 và skin rig chưa hỗ trợ. Hãy xuất model tĩnh, không nén.":window.tr?.("GLB nén Draco / Meshopt / KTX2 và skin rig chưa hỗ trợ. Hãy xuất model tĩnh, không nén.","Draco / Meshopt / KTX2 compressed GLB and skin rigs are unsupported here. Export a static, uncompressed model.")??"GLB nén Draco / Meshopt / KTX2 và skin rig chưa hỗ trợ. Hãy xuất model tĩnh, không nén.")}</div>`;
 $('pickFace').onclick=()=>{state.pickMode='face';renderInspector()};$('pickMesh').onclick=()=>{state.pickMode='mesh';renderInspector()};$('createLED').onclick=addFromSelection;change('ambientStage',v=>engine.settings.ambient=+v,{live:true});change('exposureStage',v=>engine.settings.exposure=+v,{live:true});change('gridStage',v=>engine.settings.grid=v);return}
 if(state.step==='mapping'){
 let s=surface();$('inspectorKicker').textContent=(typeof window==='undefined'?"Gán nội dung LED":window.tr?.("Gán nội dung LED","Assign LED content")??"Gán nội dung LED");$('inspectorTitle').textContent=s?loc(s.name):(typeof window==='undefined'?"Chọn một màn LED":window.tr?.("Chọn một màn LED","Select an LED screen")??"Chọn một màn LED");$('inspectorSubtitle').textContent=s?(typeof window==='undefined'?"Gán nội dung riêng hoặc cắt từ master video.":window.tr?.("Gán nội dung riêng hoặc cắt từ master video.","Assign separate content or crop from a master video.")??"Gán nội dung riêng hoặc cắt từ master video."):(typeof window==='undefined'?"Chọn LED ở cột trái, hoặc tạo bề mặt mới.":window.tr?.("Chọn LED ở cột trái, hoặc tạo bề mặt mới.","Select an LED on the left or create a new face.")??"Chọn LED ở cột trái, hoặc tạo bề mặt mới.");
 let common=`<div class="inspector-block"><h3 class="block-title"><svg class="ico ico-stage" aria-hidden="true"><use href="#i-maximize"></use></svg><span>${(typeof window==='undefined'?"Khung tổng ":window.tr?.("Khung tổng ","Master canvas ")??"Khung tổng ")}</span><span>px</span></h3><div class="field-grid">${field('masterW',(typeof window==='undefined'?"Rộng":window.tr?.("Rộng","Width")??"Rộng"),engine.master.width,{min:64,max:16384})}${field('masterH',(typeof window==='undefined'?"Cao":window.tr?.("Cao","Height")??"Cao"),engine.master.height,{min:64,max:16384})}</div><button id="packBtn" class="btn full-btn">${(typeof window==='undefined'?"Sắp xếp các ô LED thành hàng":window.tr?.("Sắp xếp các ô LED thành hàng","Arrange LED tiles in a row")??"Sắp xếp các ô LED thành hàng")}</button><p class="hint-text">${(typeof window==='undefined'?"Kích thước / tọa độ lấy từ pixel map của đội LED. Không tự suy ra từ ảnh phối cảnh.":window.tr?.("Kích thước / tọa độ lấy từ pixel map của đội LED. Không tự suy ra từ ảnh phối cảnh.","Use dimensions / coordinates from the LED team's pixel map. Do not infer them from perspective images.")??"Kích thước / tọa độ lấy từ pixel map của đội LED. Không tự suy ra từ ảnh phối cảnh.")}</p></div>`;
 if(!s){box.innerHTML=common+(typeof window==='undefined'?"<button id=\"quadInspector\" class=\"btn primary full-btn\">+ Tạo LED 4 góc</button>":window.tr?.("<button id=\"quadInspector\" class=\"btn primary full-btn\">+ Tạo LED 4 góc</button>","<button id=\"quadInspector\" class=\"btn primary full-btn\">+ Create four-corner LED</button>")??"<button id=\"quadInspector\" class=\"btn primary full-btn\">+ Tạo LED 4 góc</button>");bindMaster();$('quadInspector').onclick=startQuad;return}
 let asset=engine.media.get(s.source),w=asset?.width||1,h=asset?.height||1,c=s.crop||[0,0,w,h];box.innerHTML=bindingPanel(s)+`<div class="inspector-block">${field('ledName',(typeof window==='undefined'?"Tên LED":window.tr?.("Tên LED","LED name")??"Tên LED"),s.name,{type:'text'})}<div class="field-grid">${field('ledW',(typeof window==='undefined'?"Rộng (px)":window.tr?.("Rộng (px)","Width (px)")??"Rộng (px)"),s.w,{min:8,max:8192})}${field('ledH',(typeof window==='undefined'?"Cao (px)":window.tr?.("Cao (px)","Height (px)")??"Cao (px)"),s.h,{min:8,max:8192})}${field('ledX',(typeof window==='undefined'?"Vị trí X":window.tr?.("Vị trí X","Position X")??"Vị trí X"),s.x,{min:0,max:16384})}${field('ledY',(typeof window==='undefined'?"Vị trí Y":window.tr?.("Vị trí Y","Position Y")??"Vị trí Y"),s.y,{min:0,max:16384})}</div></div><div class="divider"></div><div class="inspector-block"><h3 class="block-title"><svg class="ico ico-vj" aria-hidden="true"><use href="#i-clapperboard"></use></svg><span>${(typeof window==='undefined'?"Nguồn nội dung":window.tr?.("Nguồn nội dung","Content source")??"Nguồn nội dung")}</span></h3><select id="sourceSelect"><option value="motion" ${s.source==='motion'?'selected':''}>${(typeof window==='undefined'?"Motion tạo sẵn / đồng bộ":window.tr?.("Motion tạo sẵn / đồng bộ","Built-in / synchronized motion")??"Motion tạo sẵn / đồng bộ")}</option><option value="test" ${s.source==='test'?'selected':''}>${(typeof window==='undefined'?"Test pattern / grid / tên LED":window.tr?.("Test pattern / grid / tên LED","Test pattern / grid / LED name")??"Test pattern / grid / tên LED")}</option>${state.media.map(a=>`<option value="${a.id}" ${a.id===s.source?'selected':''}>${esc(a.name)}</option>`).join('')}</select><button id="importVideoForLED" class="btn full-btn">${(typeof window==='undefined'?"+ Nhập video / hình ảnh":window.tr?.("+ Nhập video / hình ảnh","+ Import video / image")??"+ Nhập video / hình ảnh")}</button>${asset?`<div class="badges"><span>${asset.width} x ${asset.height}</span><span>${asset.duration?asset.duration.toFixed(1)+'s':(typeof window==='undefined'?"ẢNH":window.tr?.("ẢNH","IMAGE")??"ẢNH")}</span><span>${(typeof window==='undefined'?"TỆP CỤC BỘ":window.tr?.("TỆP CỤC BỘ","LOCAL FILE")??"TỆP CỤC BỘ")}</span></div><div class="crop-preview"><canvas id="cropCanvas"></canvas><div class="crop-caption">${(typeof window==='undefined'?"Kéo một hình chữ nhật để chọn vùng video":window.tr?.("Kéo một hình chữ nhật để chọn vùng video","Drag a rectangle to select a video region")??"Kéo một hình chữ nhật để chọn vùng video")}</div></div><div class="field-grid">${field('cropX','Crop X (px)',c[0],{min:0,max:w-1})}${field('cropY','Crop Y (px)',c[1],{min:0,max:h-1})}${field('cropW',(typeof window==='undefined'?"Crop rộng":window.tr?.("Crop rộng","Crop width")??"Crop rộng"),c[2],{min:1,max:w})}${field('cropH',(typeof window==='undefined'?"Crop cao":window.tr?.("Crop cao","Crop height")??"Crop cao"),c[3],{min:1,max:h})}</div><div class="actions-row"><button id="cropFull" class="btn">${(typeof window==='undefined'?"Toàn video":window.tr?.("Toàn video","Full video")??"Toàn video")}</button><button id="cropByMap" class="btn">${(typeof window==='undefined'?"Theo Pixel Map":window.tr?.("Theo Pixel Map","From Pixel Map")??"Theo Pixel Map")}</button></div><button id="assignAll" class="btn primary full-btn">${(typeof window==='undefined'?"Dùng video này làm master cho tất cả LED":window.tr?.("Dùng video này làm master cho tất cả LED","Use this video as master for all LEDs")??"Dùng video này làm master cho tất cả LED")}</button>`:`<div class="preset-grid" style="margin-top:10px">${[(typeof window==='undefined'?"Dải năng lượng":window.tr?.("Dải năng lượng","Energy ribbon")??"Dải năng lượng"),(typeof window==='undefined'?"Quỹ đạo chất lỏng":window.tr?.("Quỹ đạo chất lỏng","Liquid orbit")??"Quỹ đạo chất lỏng"),(typeof window==='undefined'?"Lưới neon":window.tr?.("Lưới neon","Neon grid")??"Lưới neon"),(typeof window==='undefined'?"Hạt":window.tr?.("Hạt","Particles")??"Hạt")].map((n,i)=>`<button data-effect="${i}" class="preset ${(s.effect??engine.effect)===i?'active':''}"><span>${n}</span></button>`).join('')}</div><div class="field"><label>${(typeof window==='undefined'?"Màu chủ đạo":window.tr?.("Màu chủ đạo","Accent color")??"Màu chủ đạo")}</label><input id="accentInput" type="color" value="${engine.accent}"></div><label class="check-row"><input id="globalMotion" type="checkbox" ${s.global!==false?'checked':''}>${(typeof window==='undefined'?" Một không gian motion chung":window.tr?.(" Một không gian motion chung"," Shared motion space")??" Một không gian motion chung")}</label>`}</div><div class="divider"></div><div class="inspector-block"><h3 class="block-title">${(typeof window==='undefined'?"Hiệu chỉnh hình ảnh":window.tr?.("Hiệu chỉnh hình ảnh","Image adjustments")??"Hiệu chỉnh hình ảnh")}</h3><div class="field"><label>${(typeof window==='undefined'?"Fit nội dung":window.tr?.("Fit nội dung","Content fit")??"Fit nội dung")}</label><select id="fitSelect"><option value="0" ${s.fit===0?'selected':''}>${(typeof window==='undefined'?"Kéo giãn / UV":window.tr?.("Kéo giãn / UV","Stretch / UV")??"Kéo giãn / UV")}</option><option value="1" ${s.fit===1?'selected':''}>${(typeof window==='undefined'?"Contain / giữ tỷ lệ":window.tr?.("Contain / giữ tỷ lệ","Contain / preserve aspect ratio")??"Contain / giữ tỷ lệ")}</option><option value="2" ${s.fit===2?'selected':''}>${(typeof window==='undefined'?"Cover / phủ kín":window.tr?.("Cover / phủ kín","Cover / fill")??"Cover / phủ kín")}</option></select></div><div class="field"><label>${(typeof window==='undefined'?"Xoay texture":window.tr?.("Xoay texture","Texture rotation")??"Xoay texture")}</label><select id="rotation">${[0,90,180,270].map((v,i)=>`<option value="${i}" ${s.rotation===i?'selected':''}>${v}${(typeof window==='undefined'?" độ":window.tr?.(" độ"," deg")??" độ")}</option>`).join('')}</select></div><div class="actions-row"><button id="flipX" class="btn ${s.flipX?'active':''}">${(typeof window==='undefined'?"Lật ngang":window.tr?.("Lật ngang","Flip horizontally")??"Lật ngang")}</button><button id="flipY" class="btn ${s.flipY?'active':''}">${(typeof window==='undefined'?"Lật dọc":window.tr?.("Lật dọc","Flip vertically")??"Lật dọc")}</button></div>${range('brightness',(typeof window==='undefined'?"Độ sáng LED":window.tr?.("Độ sáng LED","LED brightness")??"Độ sáng LED"),s.brightness,.1,2,.05)}<label class="check-row"><input id="enabledLED" type="checkbox" ${s.enabled!==false?'checked':''}>${(typeof window==='undefined'?" Hiện LED này":window.tr?.(" Hiện LED này"," Show this LED")??" Hiện LED này")}</label></div>${common}<button id="deleteLED" class="btn danger full-btn">${(typeof window==='undefined'?"Xóa LED đang chọn":window.tr?.("Xóa LED đang chọn","Delete selected LED")??"Xóa LED đang chọn")}</button><p class="hint-text">${(typeof window==='undefined'?"Video dùng chung một bộ phát khi gán cùng nguồn. Đây là đồng bộ preview, không phải genlock cho show thật.":window.tr?.("Video dùng chung một bộ phát khi gán cùng nguồn. Đây là đồng bộ preview, không phải genlock cho show thật.","LEDs sharing a source use one player. This synchronizes previews, not genlock for live shows.")??"Video dùng chung một bộ phát khi gán cùng nguồn. Đây là đồng bộ preview, không phải genlock cho show thật.")}</p>`;
 bindSurfaceControls(s);change('ledName',v=>{s.name=v.slice(0,80)||'LED';updateTest(s);$('inspectorTitle').textContent=s.name;renderUI()});for(let[id,key,min,max]of[['ledW','w',8,8192],['ledH','h',8,8192],['ledX','x',0,16384],['ledY','y',0,16384]])change(id,v=>{s[key]=clamp(Math.round(+v)||min,min,max);updateTest(s);renderUI()});change('sourceSelect',v=>{setSource(s,v);renderUI()});$('importVideoForLED').onclick=()=>$('mediaInput').click();change('fitSelect',v=>s.fit=+v);change('rotation',v=>s.rotation=+v);change('brightness',v=>s.brightness=+v,{live:true});change('enabledLED',v=>s.enabled=v);for(let k of['flipX','flipY'])$(k).onclick=()=>{checkpoint();s[k]=!s[k];renderInspector()};$('deleteLED').onclick=()=>{checkpoint();engine.surfaces=engine.surfaces.filter(x=>x.id!==s.id);engine.selected=engine.surfaces[0]?.id;renderUI()};if(asset){for(let[id,idx]of[['cropX',0],['cropY',1],['cropW',2],['cropH',3]])change(id,v=>{s.crop[idx]=Math.round(+v)||0;clampCrop(s,asset);renderInspector()});$('cropFull').onclick=()=>{checkpoint();s.crop=[0,0,w,h];renderInspector()};$('cropByMap').onclick=()=>{checkpoint();cropFromMap(s,asset);renderInspector()};$('assignAll').onclick=()=>assignMaster(asset);setupCropCanvas(s,asset)}else{document.querySelectorAll('[data-effect]').forEach(b=>b.onclick=()=>{checkpoint();s.source='motion';s.effect=+b.dataset.effect;engine.effect=s.effect;for(let led of engine.surfaces)if(led.source==='motion')led.effect=engine.effect;renderInspector()});change('accentInput',v=>engine.accent=v,{live:true});change('globalMotion',v=>s.global=v)}bindMaster();return
 }
 if(state.step==='lighting'){
 let l=engine.lights.find(x=>x.id===state.selectedLight)||engine.lights[0];$('inspectorKicker').textContent=(typeof window==='undefined'?"Ánh sáng / phát triển look":window.tr?.("Ánh sáng / phát triển look","LIGHTING / LOOK DEVELOPMENT")??"Ánh sáng / phát triển look");$('inspectorTitle').textContent=(typeof window==='undefined'?"Ánh sáng sân khấu":window.tr?.("Ánh sáng sân khấu","Stage lighting")??"Ánh sáng sân khấu");$('inspectorSubtitle').textContent=(typeof window==='undefined'?"Spotlight + beam mô phỏng. Có pulse / strobe / boost để duyệt look.":window.tr?.("Spotlight + beam mô phỏng. Có pulse / strobe / boost để duyệt look.","Simulated spotlights and beams. Use pulse / strobe / boost to preview looks.")??"Spotlight + beam mô phỏng. Có pulse / strobe / boost để duyệt look.");box.innerHTML=`<div class="inspector-block"><h3 class="block-title"><svg class="ico ico-lights" aria-hidden="true"><use href="#i-lightbulb"></use></svg><span>${(typeof window==='undefined'?"Mẫu ánh sáng":window.tr?.("Mẫu ánh sáng","Lighting presets")??"Mẫu ánh sáng")}</span></h3><div class="preset-grid">${[['concert',(typeof window==='undefined'?"Hòa nhạc / quét":window.tr?.("Hòa nhạc / quét","Concert / sweep")??"Hòa nhạc / quét")],['warm',(typeof window==='undefined'?"Ấm / trang nhã":window.tr?.("Ấm / trang nhã","Warm / elegant")??"Ấm / trang nhã")],['cool',(typeof window==='undefined'?"Lạnh / phủ sáng":window.tr?.("Lạnh / phủ sáng","Cool / wash")??"Lạnh / phủ sáng")],['blackout',(typeof window==='undefined'?"Tắt toàn bộ":window.tr?.("Tắt toàn bộ","Blackout")??"Tắt toàn bộ")]].map(([id,n])=>`<button data-rig="${id}" class="preset lighting-preset"><span>${n}</span></button>`).join('')}</div><h3 class="block-title" style="margin-top:12px"><svg class="ico ico-show" aria-hidden="true"><use href="#i-sparkles"></use></svg><span>${(typeof window==='undefined'?"Hiệu ứng show":window.tr?.("Hiệu ứng show","Show FX")??"Hiệu ứng show")}</span></h3><div class="preset-grid">${[['boost',(typeof window==='undefined'?"Tăng đèn":window.tr?.("Tăng đèn","Boost")??"Tăng đèn")],['pulse',(typeof window==='undefined'?"Nhịp sáng":window.tr?.("Nhịp sáng","Pulse")??"Nhịp sáng")],['strobe',(typeof window==='undefined'?"Chớp sáng":window.tr?.("Chớp sáng","Strobe")??"Chớp sáng")],['steady',(typeof window==='undefined'?"Sáng liên tục":window.tr?.("Sáng liên tục","Steady")??"Sáng liên tục")],['sweep',(typeof window==='undefined'?"Quét":window.tr?.("Quét","Sweep")??"Quét")]].map(([id,n])=>`<button data-lookfx="${id}" class="preset lighting-preset"><span>${n}</span></button>`).join('')}</div>${range('ambientLight',(typeof window==='undefined'?"Môi trường":window.tr?.("Môi trường","Ambient")??"Môi trường"),engine.settings.ambient,.05,1.5,.05)}${range('beamPower',(typeof window==='undefined'?"Chùm sáng / sương":window.tr?.("Chùm sáng / sương","Beam / haze")??"Chùm sáng / sương"),engine.settings.beam,0,1,.05)}${range('haze',(typeof window==='undefined'?"Sương xa":window.tr?.("Sương xa","Distant haze")??"Sương xa"),engine.settings.haze,0,80,1)}${range('exposureLight',(typeof window==='undefined'?"Phơi sáng":window.tr?.("Phơi sáng","Exposure")??"Phơi sáng"),engine.settings.exposure,.3,2.5,.05)}</div><div class="divider"></div>${l?`<div class="inspector-block"><h3 class="block-title">${esc(loc(l.name))} <span>${engine.lights.indexOf(l)+1} / ${engine.lights.length}</span></h3><div class="field"><label>${(typeof window==='undefined'?"Màu đèn":window.tr?.("Màu đèn","Light color")??"Màu đèn")}</label><input type="color" id="lightColor" value="${l.color}"><label class="check-row" style="margin:0"><input id="lightEnabled" type="checkbox" ${l.enabled?'checked':''}> ON</label></div>${range('lightPower',(typeof window==='undefined'?"Cường độ":window.tr?.("Cường độ","Intensity")??"Cường độ"),l.power,0,12,.1)}${range('lightBoost',(typeof window==='undefined'?"Tăng đèn":window.tr?.("Tăng đèn","Boost")??"Tăng đèn"),l.boost??1,.2,3,.05)}${range('lightAngle',(typeof window==='undefined'?"Góc chùm":window.tr?.("Góc chùm","Beam angle")??"Góc chùm"),l.angle,4,40,1)}<div class="field"><label for="lightFX">${(typeof window==='undefined'?"Hiệu ứng đèn":window.tr?.("Hiệu ứng đèn","Lighting effect")??"Hiệu ứng đèn")}</label><select id="lightFX"><option value="steady" ${(l.fx||'steady')==='steady'?'selected':''}>${(typeof window==='undefined'?"Sáng liên tục":window.tr?.("Sáng liên tục","Steady")??"Sáng liên tục")}</option><option value="pulse" ${(l.fx||'steady')==='pulse'?'selected':''}>${(typeof window==='undefined'?"Nhịp sáng":window.tr?.("Nhịp sáng","Pulse")??"Nhịp sáng")}</option><option value="strobe" ${(l.fx||'steady')==='strobe'?'selected':''}>${(typeof window==='undefined'?"Chớp sáng":window.tr?.("Chớp sáng","Strobe")??"Chớp sáng")}</option><option value="build" ${(l.fx||'steady')==='build'?'selected':''}>${(typeof window==='undefined'?"Tăng dần":window.tr?.("Tăng dần","Build up")??"Tăng dần")}</option></select></div>${range('lightFXDepth',(typeof window==='undefined'?"Độ sâu FX":window.tr?.("Độ sâu FX","FX depth")??"Độ sâu FX"),l.fxDepth??.55,0,1,.05)}${range('lightFXSpeed',(typeof window==='undefined'?"Tốc độ FX":window.tr?.("Tốc độ FX","FX speed")??"Tốc độ FX"),l.fxSpeed??2.2,.1,14,.1)}<h3 class="block-title" style="margin-top:14px">${(typeof window==='undefined'?"Vị trí (m)":window.tr?.("Vị trí (m)","Position (m)")??"Vị trí (m)")}</h3><div class="field-grid three">${l.pos.map((v,i)=>field('pos'+i,['X','Y','Z'][i],v.toFixed(2),{step:.1})).join('')}</div><h3 class="block-title" style="margin-top:14px">${(typeof window==='undefined'?"Điểm chiếu (m)":window.tr?.("Điểm chiếu (m)","Target (m)")??"Điểm chiếu (m)")}</h3><div class="field-grid three">${l.target.map((v,i)=>field('target'+i,['X','Y','Z'][i],v.toFixed(2),{step:.1})).join('')}</div><label class="check-row"><input id="lightSweep" type="checkbox" ${l.sweep?'checked':''}>${(typeof window==='undefined'?" Moving head / quét chậm":window.tr?.(" Moving head / quét chậm"," Moving head / slow sweep")??" Moving head / quét chậm")}</label>${range('lightSpeed',(typeof window==='undefined'?"Tốc độ quét":window.tr?.("Tốc độ quét","Sweep speed")??"Tốc độ quét"),l.speed,.05,1.5,.05)}</div>`:''}<div class="divider"></div><button id="presentInspector" class="btn primary full-btn">${(typeof window==='undefined'?"&#9655; Mở chế độ trình diễn":window.tr?.("&#9655; Mở chế độ trình diễn","&#9655; Open presentation mode")??"&#9655; Mở chế độ trình diễn")}</button><div class="info-box">${(typeof window==='undefined'?"Đèn này là preview look development: boost / pulse / strobe giúp bạn nhìn sân khấu sống hơn khi duyệt visual.":window.tr?.("Đèn này là preview look development: boost / pulse / strobe giúp bạn nhìn sân khấu sống hơn khi duyệt visual.","These lights preview looks: boost / pulse / strobe help review stage visuals.")??"Đèn này là preview look development: boost / pulse / strobe giúp bạn nhìn sân khấu sống hơn khi duyệt visual.")}</div>`;document.querySelectorAll('[data-rig]').forEach(b=>b.onclick=()=>rigPreset(b.dataset.rig));document.querySelectorAll('[data-lookfx]').forEach(b=>b.onclick=()=>lightingFXPreset(b.dataset.lookfx));change('ambientLight',v=>engine.settings.ambient=+v,{live:true});change('beamPower',v=>engine.settings.beam=+v,{live:true});change('haze',v=>engine.settings.haze=+v,{live:true});change('exposureLight',v=>engine.settings.exposure=+v,{live:true});if(l){change('lightColor',v=>l.color=v,{live:true});change('lightEnabled',v=>l.enabled=v);change('lightPower',v=>l.power=+v,{live:true});change('lightBoost',v=>l.boost=+v,{live:true});change('lightAngle',v=>l.angle=+v,{live:true});change('lightFX',v=>l.fx=v);change('lightFXDepth',v=>l.fxDepth=+v,{live:true});change('lightFXSpeed',v=>l.fxSpeed=+v,{live:true});change('lightSweep',v=>l.sweep=v);change('lightSpeed',v=>l.speed=+v,{live:true});for(let i=0;i<3;i++){change('pos'+i,v=>{l.pos[i]=clamp(+v||0,-10000,10000);engine.rebuildFixtures()});change('target'+i,v=>l.target[i]=clamp(+v||0,-10000,10000))}}$('presentInspector').onclick=togglePresentation;
 }
}
function bindMaster(){change('masterW',v=>{engine.master.width=clamp(Math.round(+v)||3840,64,16384);renderUI()});change('masterH',v=>{engine.master.height=clamp(Math.round(+v)||1280,64,16384);renderUI()});$('packBtn').onclick=()=>{checkpoint();let x=0,h=0;for(let s of engine.surfaces){s.x=x;s.y=0;x+=s.w;h=Math.max(h,s.h);updateTest(s)}engine.master={width:Math.max(64,x),height:Math.max(64,h)};engine.view='map';renderUI();toast((typeof window==='undefined'?"Đã xếp thành hàng. Không đổi crop video cũ; bấm Theo Pixel Map để cập nhật.":window.tr?.("Đã xếp thành hàng. Không đổi crop video cũ; bấm Theo Pixel Map để cập nhật.","Arranged in a row. Existing video crops unchanged; click From Pixel Map to update.")??"Đã xếp thành hàng. Không đổi crop video cũ; bấm Theo Pixel Map để cập nhật."))}}
function clampCrop(s,a){let c=s.crop;c[0]=clamp(c[0]||0,0,a.width-1);c[1]=clamp(c[1]||0,0,a.height-1);c[2]=clamp(c[2]||1,1,a.width-c[0]);c[3]=clamp(c[3]||1,1,a.height-c[1])}
function attachVideoElement(v){if(!v||typeof document==='undefined'||!document.body)return v;let h=document.getElementById('videoDecoderHost');if(!h){h=document.createElement('div');h.id='videoDecoderHost';h.setAttribute('aria-hidden','true');h.style.cssText='position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0.001;pointer-events:none;overflow:hidden;z-index:-1';document.body.appendChild(h);}v.disablePictureInPicture=true;v.disableRemotePlayback=true;if(v.parentNode!==h)h.appendChild(v);return v;}
function setSource(s,id){s.source=id;let a=engine.media.get(id);if(a){engine.globalTest=false;s.enabled=true;}s.crop=a?[0,0,a.width,a.height]:[0,0,1,1];if(a){s.fit=0;if(a.type==='video'&&a.duration>0&&!state.loadingProject&&(typeof seq==='undefined'||!seq.enabled)&&(typeof live==='undefined'||!live?.audioTrack)&&state.duration===12&&!activeVideos().some(v=>v.id!==a.id)){state.duration=clamp(+a.duration.toFixed(2),1,600);state.time=Math.min(state.time,state.duration);}}}
function cropFromMap(s,a){s.crop=[s.x/engine.master.width*a.width,s.y/engine.master.height*a.height,s.w/engine.master.width*a.width,s.h/engine.master.height*a.height].map(Math.round);clampCrop(s,a)}
function assignMaster(a){if(!engine.surfaces.length){toast((typeof window==='undefined'?"Chưa có LED. Hãy tạo bề mặt trước.":window.tr?.("Chưa có LED. Hãy tạo bề mặt trước.","No LEDs. Create a face first.")??"Chưa có LED. Hãy tạo bề mặt trước."));return}checkpoint();for(let s of engine.surfaces){setSource(s,a.id);cropFromMap(s,a)}if(a.duration){state.duration=+a.duration.toFixed(2);state.time=0;syncVideos(true)}engine.view='stage';renderUI();toast((typeof window==='undefined'?"Đã gắn video master lên các mặt LED trên sân khấu. Kiểm tra crop từng màn.":window.tr?.("Đã gắn video master lên các mặt LED trên sân khấu. Kiểm tra crop từng màn.","Master video assigned to stage LED faces. Check each screen's crop.")??"Đã gắn video master lên các mặt LED trên sân khấu. Kiểm tra crop từng màn."))}
function setupCropCanvas(s,a){let c=$('cropCanvas');if(!c)return;let down=null;let xy=e=>{let r=c.getBoundingClientRect();return[clamp((e.clientX-r.left)/r.width,0,1),clamp((e.clientY-r.top)/r.height,0,1)]};c.onpointerdown=e=>{checkpoint();down=xy(e);c.setPointerCapture(e.pointerId)};c.onpointermove=e=>{if(!down)return;let p=xy(e);s.crop=[Math.min(down[0],p[0])*a.width,Math.min(down[1],p[1])*a.height,Math.max(1,Math.abs(down[0]-p[0])*a.width),Math.max(1,Math.abs(down[1]-p[1])*a.height)].map(Math.round);clampCrop(s,a)};c.onpointerup=()=>{down=null;renderInspector()};c.onpointercancel=()=>down=null}
async function importModel(files,{silent=false}={}){if(state.importing)return;state.importing=true;busy(true,(typeof window==='undefined'?"Đang đọc model 3D và texture...":window.tr?.("Đang đọc model 3D và texture...","Reading 3D model and textures...")??"Đang đọc model 3D và texture..."));try{let bytes=Array.from(files).reduce((s,f)=>s+f.size,0);if(bytes>600*1024*1024)throw Error((typeof window==='undefined'?"Tổng model / texture vượt 600 MB. Hãy tối ưu model trước khi nhập.":window.tr?.("Tổng model / texture vượt 600 MB. Hãy tối ưu model trước khi nhập.","Models / textures exceed 600 MB. Optimize the model before importing.")??"Tổng model / texture vượt 600 MB. Hãy tối ưu model trước khi nhập."));let result=await Importer.load(files);engine.setModel(result.meshes);engine.sourcePunctualLights=result.punctualLights||[];for(let s of engine.surfaces)engine.releaseMesh(s.mesh);engine.surfaces=[];engine.selected=null;state.selectedMesh=null;state.hit=null;state.rebindId=null;engine.globalTest=false;state.model={name:result.name,files:result.files,demo:false};state.projectName=result.name.replace(/\.[a-z0-9]+$/i,'');state.warnings=result.warnings;state.step='stage';engine.view='stage';state.history=[];state.redo=[];rigPreset('cool',false);renderUI();if(!silent){toast((typeof window==='undefined'?"Đã nhập ":window.tr?.("Đã nhập ","Imported ")??"Đã nhập ")+result.name+' / '+result.meshes.length+(typeof window==='undefined'?" mesh. Click vào mặt LED để bắt đầu.":window.tr?.(" mesh. Click vào mặt LED để bắt đầu."," meshes. Click an LED face to begin.")??" mesh. Click vào mặt LED để bắt đầu."));if(result.warnings.length)dialog((typeof window==='undefined'?"Model đã nhập - lưu ý":window.tr?.("Model đã nhập - lưu ý","Imported model notes")??"Model đã nhập - lưu ý"),'<p>'+result.warnings.map(esc).join('<br>')+'</p>')}}finally{state.importing=false;busy(false)}}
async function addMediaFile(file,{id=null,silent=false}={}){let isVideo=/\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name)||file.type.startsWith('video/'),isImage=/\.(png|jpe?g|webp)$/i.test(file.name)||file.type.startsWith('image/');if(!isVideo&&!isImage)throw Error((typeof window==='undefined'?"Định dạng media chưa hỗ trợ: ":window.tr?.("Định dạng media chưa hỗ trợ: ","Unsupported media format: ")??"Định dạng media chưa hỗ trợ: ")+file.name);let url=URL.createObjectURL(file),element=isVideo?document.createElement('video'):new Image();if(isVideo){element.muted=true;element.playsInline=true;element.preload='auto';element.loop=true;attachVideoElement(element)}let loaded=new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error((typeof window==='undefined'?"Media tải quá lâu hoặc codec không được trình duyệt hỗ trợ. Thử MP4 H.264 hoặc WebM.":window.tr?.("Media tải quá lâu hoặc codec không được trình duyệt hỗ trợ. Thử MP4 H.264 hoặc WebM.","Media loading timed out or the browser does not support the codec. Try MP4 H.264 or WebM.")??"Media tải quá lâu hoặc codec không được trình duyệt hỗ trợ. Thử MP4 H.264 hoặc WebM."))),18000);element.addEventListener(isVideo?'loadeddata':'load',()=>{clearTimeout(timer);resolve()},{once:true});element.addEventListener('error',()=>{clearTimeout(timer);reject(Error((typeof window==='undefined'?"Không đọc được ":window.tr?.("Không đọc được ","Cannot read ")??"Không đọc được ")+file.name+(typeof window==='undefined'?". Thử MP4 H.264 hoặc WebM VP8/VP9.":window.tr?.(". Thử MP4 H.264 hoặc WebM VP8/VP9.",". Try MP4 H.264 or WebM VP8/VP9.")??". Thử MP4 H.264 hoặc WebM VP8/VP9.")))},{once:true})});element.src=url;try{await loaded}catch(e){element.src='';element.remove?.();URL.revokeObjectURL(url);throw e}let a={id:id||uid('media'),name:file.name,file,url,element,type:isVideo?'video':'image',width:isVideo?element.videoWidth:element.naturalWidth,height:isVideo?element.videoHeight:element.naturalHeight,duration:isVideo&&Number.isFinite(element.duration)?element.duration:0};if(a.width>engine.maxSize||a.height>engine.maxSize){element.src='';element.remove?.();URL.revokeObjectURL(url);throw Error((typeof window==='undefined'?"Media vượt giới hạn texture GPU: ":window.tr?.("Media vượt giới hạn texture GPU: ","Media exceeds the GPU texture limit: ")??"Media vượt giới hạn texture GPU: ")+engine.maxSize+' px.')}if(isVideo){const mbps=a.duration>0?((file.size||0)*8/1e6)/a.duration:0;element._heavyVideo=(file.size||0)>20*1024*1024||mbps>10||a.width>1920||a.height>1080;}let c=document.createElement('canvas');c.width=288;c.height=160;try{c.getContext('2d').drawImage(element,0,0,288,160);a.thumb=c.toDataURL('image/jpeg',.7);a._cropPreview=c;a._cropPreviewTime='init'}catch(e){a.thumb=''}state.media.push(a);engine.media.set(a.id,a);if(isVideo&&state.playing)element.play().catch(()=>{});if(!silent){if(surface()){checkpoint();setSource(surface(),a.id);state.step='mapping'}renderUI();toast((typeof window==='undefined'?"Đã thêm ":window.tr?.("Đã thêm ","Added ")??"Đã thêm ")+a.name+(typeof window==='undefined'?". Gán riêng hoặc dùng làm master cho tất cả LED.":window.tr?.(". Gán riêng hoặc dùng làm master cho tất cả LED.",". Assign separately or use as master for all LEDs.")??". Gán riêng hoặc dùng làm master cho tất cả LED."))}return a}
async function importMedia(files){busy(true,(typeof window==='undefined'?"Đang đọc video / hình ảnh...":window.tr?.("Đang đọc video / hình ảnh...","Reading video / images...")??"Đang đọc video / hình ảnh..."));try{let media=Array.from(files).filter(f=>/\.(mp4|webm|mov|m4v|ogv|png|jpe?g|webp)$/i.test(f.name)||/^(video|image)\//.test(f.type));if(!media.length)throw Error((typeof window==='undefined'?"Hãy chọn video MP4 / WebM hoặc ảnh PNG / JPG.":window.tr?.("Hãy chọn video MP4 / WebM hoặc ảnh PNG / JPG.","Choose MP4 / WebM video or PNG / JPG images.")??"Hãy chọn video MP4 / WebM hoặc ảnh PNG / JPG."));for(let f of media)await addMediaFile(f)}finally{busy(false)}}
function syncVideos(force=false){let active=new Set(engine.surfaces.map(s=>s.source));for(let a of state.media){if(a.type!=='video')continue;let v=a.element;if(!active.has(a.id)){v.pause();continue}let target=a.duration>0?state.time%a.duration:0;if(v.readyState>=2&&(force||Math.abs(v.currentTime-target)>.18)){try{v.currentTime=Math.min(target,Math.max(0,a.duration-.025))}catch(e){}}if(state.playing){if(v.paused)v.play().catch(()=>{})}else if(!v.paused)v.pause()}}
function startQuad(){state.quad=true;state.quadPoints=[];engine.view='stage';state.step='stage';$('quadHint').textContent=(typeof window==='undefined'?"Click 4 góc: trên trái > trên phải > dưới phải > dưới trái. Esc để hủy.":window.tr?.("Click 4 góc: trên trái > trên phải > dưới phải > dưới trái. Esc để hủy.","Click four corners: top left > top right > bottom right > bottom left. Esc to cancel.")??"Click 4 góc: trên trái > trên phải > dưới phải > dưới trái. Esc để hủy.");$('quadHint').classList.remove('hidden');renderUI();toast((typeof window==='undefined'?"Chọn 4 góc trên bề mặt model. Cần cùng một mặt phẳng.":window.tr?.("Chọn 4 góc trên bề mặt model. Cần cùng một mặt phẳng.","Select four corners on the same plane of the model.")??"Chọn 4 góc trên bề mặt model. Cần cùng một mặt phẳng."));}
function finishQuad(){let pts=state.quadPoints.map(p=>p.point),n=M.norm(M.cross(M.sub(pts[1],pts[0]),M.sub(pts[2],pts[0]))),sz=Math.max(...pts.map(p=>Math.hypot(...M.sub(p,pts[0]))));if(Math.abs(M.dot(M.sub(pts[3],pts[0]),n))>Math.max(.005,sz*.01)){state.quadPoints=[];toast((typeof window==='undefined'?"Bốn góc không cùng mặt phẳng. Hãy chọn lại 4 góc của một LED phẳng.":window.tr?.("Bốn góc không cùng mặt phẳng. Hãy chọn lại 4 góc của một LED phẳng.","The corners are not coplanar. Reselect four corners of a planar LED.")??"Bốn góc không cùng mặt phẳng. Hãy chọn lại 4 góc của một LED phẳng."),6000);return}let sign=0;for(let i=0;i<4;i++){let a=M.sub(pts[(i+1)%4],pts[i]),b=M.sub(pts[(i+2)%4],pts[(i+1)%4]),d=M.dot(M.cross(a,b),n);if(Math.abs(d)<1e-8||sign&&Math.sign(d)!==sign){state.quadPoints=[];toast((typeof window==='undefined'?"Thứ tự 4 góc bị chéo hoặc trùng. Hãy click theo vòng chữ nhật.":window.tr?.("Thứ tự 4 góc bị chéo hoặc trùng. Hãy click theo vòng chữ nhật.","Corners cross or overlap. Click around the rectangle in order.")??"Thứ tự 4 góc bị chéo hoặc trùng. Hãy click theo vòng chữ nhật."));return}sign=Math.sign(d)}checkpoint();createSurface(quadMesh('Quad LED',pts),'LED_'+String(engine.surfaces.length+1).padStart(2,'0'));state.quad=false;state.quadPoints=[];$('quadHint').classList.add('hidden');state.step='mapping';renderUI();toast((typeof window==='undefined'?"Đã tạo LED 4 góc. Có thể gán video ngay.":window.tr?.("Đã tạo LED 4 góc. Có thể gán video ngay.","Four-corner LED created. Assign video now.")??"Đã tạo LED 4 góc. Có thể gán video ngay."));}
function onStageClick(e){if(handleSpatialClick(e))return;if(state.rebindId){const hit=engine.pick(e.clientX,e.clientY,false);if(hit)completeRebind(hit);else toast((typeof window==='undefined'?"Bấm vào mặt LED trên model để gán lại.":window.tr?.("Bấm vào mặt LED trên model để gán lại.","Click an LED face on the model to reattach.")??"Bấm vào mặt LED trên model để gán lại."));return}if(state.quad){let hit=engine.pick(e.clientX,e.clientY,false);if(!hit){toast((typeof window==='undefined'?"Cần click trên bề mặt của model.":window.tr?.("Cần click trên bề mặt của model.","Click a model face.")??"Cần click trên bề mặt của model."));return}state.quadPoints.push(hit);$('quadHint').textContent=(typeof window==='undefined'?"Đã chọn ":window.tr?.("Đã chọn ","Selected ")??"Đã chọn ")+state.quadPoints.length+(typeof window==='undefined'?"/4 góc. Esc để hủy.":window.tr?.("/4 góc. Esc để hủy.","/4 corners. Esc to cancel.")??"/4 góc. Esc để hủy.");if(state.quadPoints.length===4)finishQuad();return}let hit=engine.pick(e.clientX,e.clientY,true);if(!hit){state.selectedMesh=null;state.hit=null;engine.selected=null;renderUI();return}if(hit.surface){selectSurface(hit.surface.id);return}state.selectedMesh=hit.mesh.id;state.hit=hit;engine.selected=null;state.step='stage';renderUI();}
function renderOverlays(){let hud=$('hudLabels');hud.innerHTML='';let overlay=$('mapOverlay'),rect=$('viewport').getBoundingClientRect();let dpr=Math.min(devicePixelRatio,1.6);if(overlay.width!==Math.round(rect.width*dpr)||overlay.height!==Math.round(rect.height*dpr)){overlay.width=Math.round(rect.width*dpr);overlay.height=Math.round(rect.height*dpr)}let g=overlay.getContext('2d');g.clearRect(0,0,overlay.width,overlay.height);if(state.presenting)return;
 if(engine.view==='stage'){if(engine.showGuides)for(let s of engine.surfaces){if(s.enabled===false)continue;let p=engine.project(s.mesh.bounds.center);if(!p||p.z>1||p.z<-1||p.x<0||p.y<0||p.x>rect.width||p.y>rect.height)continue;let label=document.createElement('span');label.className='led-label '+(engine.selected===s.id?'selected':'');label.textContent=s.name;label.style.left=p.x+'px';label.style.top=p.y+'px';hud.appendChild(label)}for(let[i,q]of state.quadPoints.entries()){let p=engine.project(q.point);if(!p)continue;let label=document.createElement('span');label.className='quad-marker';label.textContent=i+1;label.style.left=p.x+'px';label.style.top=p.y+'px';hud.appendChild(label)}
  if(state.selectedMesh&&engine.showGuides){let mesh=engine.stage.find(m=>m.id===state.selectedMesh);if(mesh){let b=mesh.bounds,pts=[];for(let x of[b.min[0],b.max[0]])for(let y of[b.min[1],b.max[1]])for(let z of[b.min[2],b.max[2]])pts.push(engine.project([x,y,z]));g.strokeStyle='#b39afd';g.lineWidth=1;for(let[a,b]of[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]]){let p=pts[a],q=pts[b];if(p&&q&&p.z<1&&q.z<1){g.beginPath();g.moveTo(p.x*dpr,p.y*dpr);g.lineTo(q.x*dpr,q.y*dpr);g.stroke()}}}}}
 else if(engine.mapTransform&&engine.showGuides){let m=engine.mapTransform;let ratio=overlay.width/engine.canvas.width;g.save();g.scale(ratio,ratio);let X=m.left,Y=m.top,sc=m.scale;g.strokeStyle='#536175';g.lineWidth=1;g.strokeRect(X,Y,m.ww*sc,m.hh*sc);let list=engine.view==='solo'&&surface()?[surface()]:engine.surfaces;for(let s of list){let x=engine.view==='solo'?0:s.x,y=engine.view==='solo'?0:s.y,xx=X+x*sc,yy=Y+y*sc;g.strokeStyle=engine.selected===s.id?'#b39aff':'#70889e';g.lineWidth=engine.selected===s.id?2:1;g.strokeRect(xx,yy,s.w*sc,s.h*sc);g.fillStyle='#111622d9';let label=s.name+' / '+s.w+' x '+s.h;g.font='10px Segoe UI,Arial';let tw=g.measureText(label).width;if(s.w*sc>65){g.fillRect(xx+3,yy+3,Math.min(tw+14,s.w*sc-6),20);g.fillStyle='#ddd7f4';g.save();g.beginPath();g.rect(xx+5,yy+3,s.w*sc-8,20);g.clip();g.fillText(label,xx+9,yy+17);g.restore()}}g.restore()}
 let crop=$('cropCanvas'),s=surface(),a=s?engine.media.get(s.source):null;if(crop&&a){let w=Math.round(crop.clientWidth*devicePixelRatio),h=Math.round(crop.clientHeight*devicePixelRatio);if(crop.width!==w||crop.height!==h){crop.width=w;crop.height=h}let c=crop.getContext('2d');c.fillStyle='#060811';c.fillRect(0,0,w,h);try{c.drawImage(a.element,0,0,w,h)}catch(e){}let[x,y,cw,ch]=s.crop.map((v,i)=>v/(i%2===0?a.width:a.height)*(i%2===0?w:h));c.fillStyle='#080a1690';c.beginPath();c.rect(0,0,w,h);c.rect(x,y,cw,ch);c.fill('evenodd');c.strokeStyle='#bca0ff';c.lineWidth=2*devicePixelRatio;c.strokeRect(x,y,cw,ch);for(let[p,q]of[[x,y],[x+cw,y],[x+cw,y+ch],[x,y+ch]]){c.fillStyle='#e9ddff';c.fillRect(p-3,q-3,6,6)}}
}
function mappingWarnings(){let out=[];for(let s of engine.surfaces){if(s.x+s.w>engine.master.width||s.y+s.h>engine.master.height)out.push(s.name+(typeof window==='undefined'?": vượt biên master canvas.":window.tr?.(": vượt biên master canvas.",": outside master canvas.")??": vượt biên master canvas."));if(engine.media.has(s.source)){let a=engine.media.get(s.source),c=s.crop;if(c[0]+c[2]>a.width+.1||c[1]+c[3]>a.height+.1)out.push(s.name+(typeof window==='undefined'?": crop vượt video.":window.tr?.(": crop vượt video.",": crop exceeds video bounds.")??": crop vượt video."))}}return out}
function mappingData(){return{format:'ALPHA_LED_PIXELMAP/0.4',purpose:'Content canvas and 3D preview. Not a receiving-card/cabling configuration.',master:{...engine.master},durationSeconds:state.duration,previewSync:'shared-media-element / shared-timeline; not genlock',sources:state.media.map(a=>({id:a.id,name:a.name,width:a.width,height:a.height,duration:a.duration})),screens:engine.surfaces.map(s=>({id:s.id,name:s.name,enabled:s.enabled,outputRect:{x:s.x,y:s.y,width:s.w,height:s.h},source:s.source,sourceCropPixels:s.crop,rotationDegrees:s.rotation*90,flipX:s.flipX,flipY:s.flipY,fit:['stretch','contain','cover'][s.fit],brightness:s.brightness,estimatedModelSizeM:s.physical})),warnings:mappingWarnings()}}
function encodeFloats(a){let bytes=new Uint8Array(a.buffer,a.byteOffset,a.byteLength),s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s)}
function decodeFloats(s){let bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));if(bytes.byteLength%4)throw Error((typeof window==='undefined'?"Geometry buffer không hợp lệ.":window.tr?.("Geometry buffer không hợp lệ.","Invalid geometry buffer.")??"Geometry buffer không hợp lệ."));return new Float32Array(bytes.buffer)}
function fileData(file){return new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error((typeof window==='undefined'?"Không đọc được ":window.tr?.("Không đọc được ","Cannot read ")??"Không đọc được ")+file.name));r.readAsDataURL(file)})}
async function fileFromData(item){if(!item?.data?.startsWith('data:'))throw Error((typeof window==='undefined'?"Dự án thiếu asset.":window.tr?.("Dự án thiếu asset.","Project asset missing.")??"Dự án thiếu asset."));let blob=await(await fetch(item.data)).blob();let file=new File([blob],item.name,{type:blob.type});if(item.path)Object.defineProperty(file,'webkitRelativePath',{value:item.path});return file}
// V14.2: one complete serializer shared by download, recovery and load rollback.
// Snapshot geometry/settings before asynchronous file reads; never omit assets.
async function buildProjectData142(){
 const modelFilesSource=[...(state.model.files||[])];
 const mediaSource=state.media.map(a=>({id:a.id,name:a.name,file:a.file}));
 const total=(live.audioTrack?.file?.size||0)+modelFilesSource.reduce((n,f)=>n+f.size,0)+mediaSource.reduce((n,a)=>n+(a.file?.size||0),0);
 if(total>300*1024*1024)throw Error((typeof window==='undefined'?"Gói dự án vượt 300 MB. Hãy dùng video proxy nhẹ hơn trước khi lưu.":window.tr?.("Gói dự án vượt 300 MB. Hãy dùng video proxy nhẹ hơn trước khi lưu.","Project package exceeds 300 MB. Use lighter proxy videos before saving.")??"Gói dự án vượt 300 MB. Hãy dùng video proxy nhẹ hơn trước khi lưu."));
 if(mediaSource.some(a=>!a.file))throw Error((typeof window==='undefined'?"Có media không còn tệp nguồn. Hãy nạp lại media trước khi lưu.":window.tr?.("Có media không còn tệp nguồn. Hãy nạp lại media trước khi lưu.","Some media source files are missing. Reload the media before saving.")??"Có media không còn tệp nguồn. Hãy nạp lại media trước khi lưu."));
 const screens=engine.surfaces.map(s=>{const out={...s};delete out.testCanvas;out.mesh={name:s.mesh.name,p:encodeFloats(s.mesh.p),uv:encodeFloats(s.mesh.uv),n:encodeFloats(s.mesh.n)};return out;});
 const data=JSON.parse(JSON.stringify({format:'ALPHA_LED_STUDIO/0.2',appVersion:'15.1.0',projectName:(typeof state.projectName==='string'&&state.projectName.trim())||state.model.name,coordinates:engine.coordinates,layout:engine.layout,savedAt:new Date().toISOString(),model:{name:state.model.name,demo:state.model.demo,blank:!!state.model.blank,files:[]},media:[],screens,master:engine.master,settings:engine.settings,lights:engine.lights,camera:engine.camera,accent:engine.accent,effect:engine.effect,duration:state.duration,time:state.time}));
 data.live=JSON.parse(JSON.stringify(await packLiveExtras()));
 for(const f of modelFilesSource)data.model.files.push({name:f.name,path:f.webkitRelativePath||f.name,data:await fileData(f)});
 for(const a of mediaSource)data.media.push({id:a.id,name:a.name,data:await fileData(a.file)});
 return data;
}
async function saveProject(){
 busy(true,(typeof window==='undefined'?"Đóng gói model, media và toàn bộ show...":window.tr?.("Đóng gói model, media và toàn bộ show...","Packaging model, media and the complete show...")??"Đóng gói model, media và toàn bộ show..."));
 try{const data=await buildProjectData142();downloadText(((data.projectName||data.model.name).replace(/\.[a-z0-9]+$/i,'')||'Stage')+'.ledstudio',JSON.stringify(data));toast((typeof window==='undefined'?"Đã lưu dự án V14.2 kèm model, media và cue FX.":window.tr?.("Đã lưu dự án V14.2 kèm model, media và cue FX.","Project saved with model, media and FX cues.")??"Đã lưu dự án V14.2 kèm model, media và cue FX."));return data;}
 catch(e){toast((typeof window==='undefined'?"Không lưu được dự án: ":window.tr?.("Không lưu được dự án: ","Cannot save project: ")??"Không lưu được dự án: ")+e.message,8000);return null;}
 finally{busy(false);}
}

async function loadProject(file){busy(true,(typeof window==='undefined'?"Đang mở dự án và khôi phục media...":window.tr?.("Đang mở dự án và khôi phục media...","Opening project and restoring media...")??"Đang mở dự án và khôi phục media..."));try{if(typeof STUDIO!=='undefined'&&STUDIO.lumi18?.liveShow18?.running)STUDIO.lumi18.stopLiveShow18?.();let obj=JSON.parse(await file.text());if(obj.format!=='ALPHA_LED_STUDIO/0.2')throw Error((typeof window==='undefined'?"Chỉ mở dự án .ledstudio của bản 0.2. File V0.1 không tương thích 3D.":window.tr?.("Chỉ mở dự án .ledstudio của bản 0.2. File V0.1 không tương thích 3D.","Only version 0.2 .ledstudio projects are supported. V0.1 files are not 3D compatible.")??"Chỉ mở dự án .ledstudio của bản 0.2. File V0.1 không tương thích 3D."));if(!obj.model||!Array.isArray(obj.screens)||obj.screens.length>300||!Array.isArray(obj.media)||obj.media.length>100)throw Error((typeof window==='undefined'?"Cấu trúc dự án không hợp lệ.":window.tr?.("Cấu trúc dự án không hợp lệ.","Invalid project structure.")??"Cấu trúc dự án không hợp lệ."));let decodedScreens=obj.screens.map(s=>{if(!s.mesh||!Number.isFinite(s.w)||!Number.isFinite(s.h)||s.w<1||s.h<1||s.w>16384||s.h>16384)throw Error((typeof window==='undefined'?"Thông số LED không hợp lệ.":window.tr?.("Thông số LED không hợp lệ.","Invalid LED parameters.")??"Thông số LED không hợp lệ."));let p=decodeFloats(s.mesh.p),uv=decodeFloats(s.mesh.uv);if(p.length%9||uv.length!==p.length/3*2||p.length>6000000)throw Error((typeof window==='undefined'?"Geometry LED không hợp lệ.":window.tr?.("Geometry LED không hợp lệ.","Invalid LED geometry.")??"Geometry LED không hợp lệ."));for(let v of p)if(!Number.isFinite(v))throw Error((typeof window==='undefined'?"Geometry có giá trị không hợp lệ.":window.tr?.("Geometry có giá trị không hợp lệ.","Geometry contains invalid values.")??"Geometry có giá trị không hợp lệ."));return{...s,mesh:makeMesh(s.mesh.name,p,uv,s.mesh.n?decodeFloats(s.mesh.n):null)}});if(!obj.master||!Number.isFinite(obj.master.width)||!Number.isFinite(obj.master.height)||obj.master.width<64||obj.master.height<64||obj.master.width>32768||obj.master.height>32768)throw Error((typeof window==='undefined'?"Khung tổng không hợp lệ.":window.tr?.("Khung tổng không hợp lệ.","Invalid master canvas.")??"Khung tổng không hợp lệ."));let files=await Promise.all((obj.model.files||[]).map(fileFromData));let oldMedia=state.media;state.media=[];engine.media=new Map();if(obj.model.demo)demo();else if(obj.model.blank&&!files.length){engine.setModel([]);engine.surfaces=[];engine.selected=null;engine.lights=[];engine.rebuildFixtures();state.model={name:obj.model.name||'Empty_Stage',files:[],demo:false,blank:true};}else{await importModel(files,{silent:true});busy(true,(typeof window==='undefined'?"Đang khôi phục video của dự án...":window.tr?.("Đang khôi phục video của dự án...","Restoring project videos...")??"Đang khôi phục video của dự án..."))}if(obj.coordinates?.config)applyCoordinateConfig(obj.coordinates.config,{record:false,updateAttachments:false,fit:false});for(let item of obj.media){let f=await fileFromData(item);await addMediaFile(f,{id:item.id,silent:true})}for(let a of oldMedia){a.element.pause?.();a.element.src='';a.element.remove?.();URL.revokeObjectURL(a.url)}engine.surfaces=decodedScreens;engine.layout=obj.layout||defaultLayout();for(let s of engine.surfaces){if(!Number.isFinite(s.liftMm))s.liftMm=0;updateTest(s);}engine.globalTest=false;state.rebindId=null;engine.master=obj.master;engine.settings={...engine.settings,...obj.settings};engine.lights=(obj.lights||[]).slice(0,128);engine.camera=obj.camera||engine.camera;engine.accent=obj.accent||'#29caff';engine.effect=obj.effect||0;engine.rebuildFixtures();restoreSpatialBindings();state.projectName=(typeof obj.projectName==='string'&&obj.projectName.trim())||(file.name?file.name.replace(/\.ledstudio$/i,''):obj.model.name.replace(/\.[a-z0-9]+$/i,''));state.model.name=obj.model.name;engine.selected=engine.surfaces[0]?.id;state.duration=clamp(+obj.duration||12,1,600);state.time=clamp(+obj.time||0,0,state.duration);if(!state.loop&&state.time>=state.duration-.05)state.time=0;state.step='mapping';engine.view='stage';state.history=[];state.redo=[];state.selectedLight=engine.lights[0]?.id;syncVideos(true);renderUI();toast((typeof window==='undefined'?"Đã mở dự án. Nếu LED tối: chọn góc Front, bấm Sửa mapping 3D hoặc Chọn lại mặt.":window.tr?.("Đã mở dự án. Nếu LED tối: chọn góc Front, bấm Sửa mapping 3D hoặc Chọn lại mặt.","Project opened. If LEDs are dark: choose Front, then Repair 3D mapping or Reselect face.")??"Đã mở dự án. Nếu LED tối: chọn góc Front, bấm Sửa mapping 3D hoặc Chọn lại mặt."),8500)}finally{busy(false)}}
function togglePresentation(){state.presenting=!state.presenting;document.body.classList.toggle('present-mode',state.presenting);$('presentHUD').classList.toggle('hidden',!state.presenting);if(state.presenting){engine.view='stage';$('exportMenu').classList.add('hidden');state.quad=false;$('quadHint').classList.add('hidden');state.playing=true;syncVideos(true)}renderUI()}
async function exportShot(){let prev={view:engine.view,guides:engine.showGuides};engine.view='stage';engine.showGuides=false;engine.render(state.time,{width:1920,height:1080});let blob=await new Promise(r=>engine.canvas.toBlob(r,'image/png'));engine.view=prev.view;engine.showGuides=prev.guides;if(blob){download('ALPHA_Stage_Preview_1920x1080.png',blob);toast((typeof window==='undefined'?"Đã xuất phối cảnh PNG 1920 x 1080, không có giao diện.":window.tr?.("Đã xuất phối cảnh PNG 1920 x 1080, không có giao diện.","Exported perspective PNG 1920 x 1080 without UI.")??"Đã xuất phối cảnh PNG 1920 x 1080, không có giao diện."))}else toast((typeof window==='undefined'?"Không xuất được ảnh.":window.tr?.("Không xuất được ảnh.","Cannot export image.")??"Không xuất được ảnh."));}
async function exportMapPNG(){let {width:w,height:h}=engine.master;if(w>8192||h>8192||w*h>24000000){toast((typeof window==='undefined'?"PNG giới hạn 8192 px mỗi chiều / 24 megapixel. JSON vẫn giữ kích thước đầy đủ.":window.tr?.("PNG giới hạn 8192 px mỗi chiều / 24 megapixel. JSON vẫn giữ kích thước đầy đủ.","PNG is limited to 8192 px per side / 24 megapixels. JSON retains full dimensions.")??"PNG giới hạn 8192 px mỗi chiều / 24 megapixel. JSON vẫn giữ kích thước đầy đủ."));return}let prev={view:engine.view,guides:engine.showGuides};engine.view='map';engine.showGuides=false;engine.mapExact=true;engine.render(state.time,{width:w,height:h});let c=document.createElement('canvas');c.width=w;c.height=h;let g=c.getContext('2d');g.drawImage(engine.canvas,0,0);for(let s of engine.surfaces){g.strokeStyle='#94e7d9';g.lineWidth=Math.max(2,w/1800);g.strokeRect(s.x+1,s.y+1,s.w-2,s.h-2);g.font='bold '+Math.max(14,w/120)+'px Segoe UI,Arial';g.fillStyle='#081220db';g.fillRect(s.x+3,s.y+3,Math.min(s.w-6,g.measureText(s.name).width+20),Math.max(25,w/75));g.fillStyle='#f5e8ff';g.fillText(s.name,s.x+12,s.y+Math.max(21,w/100))}engine.view=prev.view;engine.showGuides=prev.guides;engine.mapExact=false;let blob=await new Promise(r=>c.toBlob(r,'image/png'));download('ALPHA_PixelMap_'+w+'x'+h+'.png',blob);toast((typeof window==='undefined'?"Đã xuất Pixel Map có nhãn. Đây là sơ đồ nội dung, không phải sơ đồ đấu nối.":window.tr?.("Đã xuất Pixel Map có nhãn. Đây là sơ đồ nội dung, không phải sơ đồ đấu nối.","Exported labeled Pixel Map. This is a content layout, not a wiring diagram.")??"Đã xuất Pixel Map có nhãn. Đây là sơ đồ nội dung, không phải sơ đồ đấu nối."));}
function exportJSON(){downloadText('ALPHA_LED_PixelMap.json',JSON.stringify(mappingData(),null,2));toast((typeof window==='undefined'?"Đã xuất JSON mapping. ":window.tr?.("Đã xuất JSON mapping. ","Exported mapping JSON. ")??"Đã xuất JSON mapping. ")+(mappingWarnings().length?(typeof window==='undefined'?"Có cảnh báo vượt biên, hãy kiểm tra file.":window.tr?.("Có cảnh báo vượt biên, hãy kiểm tra file.","Out-of-bounds warnings found; check the file.")??"Có cảnh báo vượt biên, hãy kiểm tra file."):''))}
function exportCSV(){let rows=[['name','output_x','output_y','width_px','height_px','source','crop_x','crop_y','crop_w','crop_h','rotation_deg','flip_x','flip_y']];for(let s of engine.surfaces)rows.push([s.name,s.x,s.y,s.w,s.h,engine.media.get(s.source)?.name||s.source,...s.crop,s.rotation*90,s.flipX,s.flipY]);let csv='\ufeff'+rows.map(row=>row.map(v=>{let t=String(v);if(/^[=+@-]/.test(t)&&typeof v==='string')t="'"+t;return '"'+t.replace(/"/g,'""')+'"'}).join(',')).join('\r\n');downloadText('ALPHA_LED_Screens.csv',csv,'text/csv;charset=utf-8');toast((typeof window==='undefined'?"Đã xuất bảng thông số LED CSV.":window.tr?.("Đã xuất bảng thông số LED CSV.","Exported LED specifications CSV.")??"Đã xuất bảng thông số LED CSV."))}
function recordPreview(){if(state.recording){state.recorder?.stop();return}if(!window.MediaRecorder||!engine.canvas.captureStream){toast((typeof window==='undefined'?"Trình duyệt chưa hỗ trợ ghi WebM. Hãy dùng Chrome/Edge/Firefox.":window.tr?.("Trình duyệt chưa hỗ trợ ghi WebM. Hãy dùng Chrome/Edge/Firefox.","This browser does not support WebM recording. Use Chrome/Edge/Firefox.")??"Trình duyệt chưa hỗ trợ ghi WebM. Hãy dùng Chrome/Edge/Firefox."));return}dialog((typeof window==='undefined'?"Ghi video phối cảnh":window.tr?.("Ghi video phối cảnh","Record perspective video")??"Ghi video phối cảnh"),(typeof window==='undefined'?"<p>Ghi <strong>canvas sân khấu 3D</strong> trong thời gian thực, không có giao diện và không âm thanh. Đây là video để duyệt thiết kế, <strong>không phải master LED frame-accurate</strong>.</p><div class=\"field\"><label>Thời lượng (giây)</label><input id=\"recordDuration\" type=\"number\" min=\"1\" max=\"30\" value=\"":window.tr?.("<p>Ghi <strong>canvas sân khấu 3D</strong> trong thời gian thực, không có giao diện và không âm thanh. Đây là video để duyệt thiết kế, <strong>không phải master LED frame-accurate</strong>.</p><div class=\"field\"><label>Thời lượng (giây)</label><input id=\"recordDuration\" type=\"number\" min=\"1\" max=\"30\" value=\"","<p>Record the <strong>3D stage canvas</strong> in real time, without UI or audio. This video is for design review, <strong>not a frame-accurate LED master</strong>.</p><div class=\"field\"><label>Duration (seconds)</label><input id=\"recordDuration\" type=\"number\" min=\"1\" max=\"30\" value=\"")??"<p>Ghi <strong>canvas sân khấu 3D</strong> trong thời gian thực, không có giao diện và không âm thanh. Đây là video để duyệt thiết kế, <strong>không phải master LED frame-accurate</strong>.</p><div class=\"field\"><label>Thời lượng (giây)</label><input id=\"recordDuration\" type=\"number\" min=\"1\" max=\"30\" value=\"")+Math.min(12,state.duration)+(typeof window==='undefined'?"\"></div><p class=\"hint-text\">Giữ tab này hiển thị trong khi ghi. Có thể rơi frame nếu GPU quá tải.</p>":window.tr?.("\"></div><p class=\"hint-text\">Giữ tab này hiển thị trong khi ghi. Có thể rơi frame nếu GPU quá tải.</p>","\"></div><p class=\"hint-text\">Keep this tab visible while recording. Frames may drop under GPU load.</p>")??"\"></div><p class=\"hint-text\">Giữ tab này hiển thị trong khi ghi. Có thể rơi frame nếu GPU quá tải.</p>"),[{label:(typeof window==='undefined'?"Hủy":window.tr?.("Hủy","Cancel")??"Hủy")},{label:(typeof window==='undefined'?"Bắt đầu ghi":window.tr?.("Bắt đầu ghi","Start recording")??"Bắt đầu ghi"),primary:true,action:()=>{let duration=clamp(+$('recordDuration').value||10,1,30);let mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime){toast((typeof window==='undefined'?"Không có encoder WebM khả dụng.":window.tr?.("Không có encoder WebM khả dụng.","No WebM encoder available.")??"Không có encoder WebM khả dụng."));return}state.recording=true;state.time=0;state.playing=true;engine.view='stage';let prevGuides=engine.showGuides;engine.showGuides=false;syncVideos(true);let stream=engine.canvas.captureStream(30),chunks=[],recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:7000000});state.recorder=recorder;recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};let started=performance.now();recorder.onstop=()=>{clearTimeout(state.recordTimer);for(let t of stream.getTracks())t.stop();state.recording=false;state.recorder=null;engine.showGuides=prevGuides;if(chunks.length)download('ALPHA_Stage_Preview.webm',new Blob(chunks,{type:mime}));renderUI();toast((typeof window==='undefined'?"Đã ghi video WebM phối cảnh. Kiểm tra lại frame trước khi gửi khách.":window.tr?.("Đã ghi video WebM phối cảnh. Kiểm tra lại frame trước khi gửi khách.","Perspective WebM recorded. Review frames before sending to the client.")??"Đã ghi video WebM phối cảnh. Kiểm tra lại frame trước khi gửi khách."));};recorder.onerror=e=>{toast((typeof window==='undefined'?"Lỗi ghi video: ":window.tr?.("Lỗi ghi video: ","Video recording error: ")??"Lỗi ghi video: ")+(e.error?.message||'MediaRecorder'));if(recorder.state!=='inactive')recorder.stop()};recorder.start(250);state.recordTimer=setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop()},duration*1000);renderUI();toast((typeof window==='undefined'?"Đang ghi preview ":window.tr?.("Đang ghi preview ","Recording preview for ")??"Đang ghi preview ")+duration+(typeof window==='undefined'?" giây. Nút Xuất > Ghi video sẽ dừng ghi.":window.tr?.(" giây. Nút Xuất > Ghi video sẽ dừng ghi."," seconds. Export > Record video stops recording.")??" giây. Nút Xuất > Ghi video sẽ dừng ghi."));}}])}
function sketchupHelp(){dialog((typeof window==='undefined'?"Đưa sân khấu SketchUp vào Studio":window.tr?.("Đưa sân khấu SketchUp vào Studio","Import a SketchUp stage into Studio")??"Đưa sân khấu SketchUp vào Studio"),(typeof window==='undefined'?"<h3>GLB - ưu tiên</h3><p>Trong SketchUp có hỗ trợ GLB: <strong>File &gt; Export &gt; 3D Model &gt; GLTF Binary File (*.glb)</strong>. Sau đó kéo GLB vào Studio.</p><h3>DAE - đường thay thế</h3><p>Xuất <strong>COLLADA (*.dae)</strong>, giữ hierarchy. Chọn kèm các ảnh trong thư mục texture khi nhập. Nên tách từng mặt LED thành group và đặt tên <strong>LED_MAIN, LED_LEFT, LED_RIGHT</strong>.</p><div class=\"info-box warn\">Không đọc trực tiếp .skp. Mặt cong cần UV hợp lệ. Độ phân giải LED phải nhập theo pixel map thực, không lấy từ độ phân giải texture.</div>":window.tr?.("<h3>GLB - ưu tiên</h3><p>Trong SketchUp có hỗ trợ GLB: <strong>File &gt; Export &gt; 3D Model &gt; GLTF Binary File (*.glb)</strong>. Sau đó kéo GLB vào Studio.</p><h3>DAE - đường thay thế</h3><p>Xuất <strong>COLLADA (*.dae)</strong>, giữ hierarchy. Chọn kèm các ảnh trong thư mục texture khi nhập. Nên tách từng mặt LED thành group và đặt tên <strong>LED_MAIN, LED_LEFT, LED_RIGHT</strong>.</p><div class=\"info-box warn\">Không đọc trực tiếp .skp. Mặt cong cần UV hợp lệ. Độ phân giải LED phải nhập theo pixel map thực, không lấy từ độ phân giải texture.</div>","<h3>GLB - preferred</h3><p>In SketchUp with GLB support: <strong>File &gt; Export &gt; 3D Model &gt; GLTF Binary File (*.glb)</strong>. Then drag the GLB into Studio.</p><h3>DAE - alternative</h3><p>Export <strong>COLLADA (*.dae)</strong>, preserving hierarchy. Include texture images when importing. Group each LED face separately and name it <strong>LED_MAIN, LED_LEFT, LED_RIGHT</strong>.</p><div class=\"info-box warn\">Cannot read .skp directly. Curved faces need valid UVs. Enter actual LED pixel map resolution, not texture resolution.</div>")??"<h3>GLB - ưu tiên</h3><p>Trong SketchUp có hỗ trợ GLB: <strong>File &gt; Export &gt; 3D Model &gt; GLTF Binary File (*.glb)</strong>. Sau đó kéo GLB vào Studio.</p><h3>DAE - đường thay thế</h3><p>Xuất <strong>COLLADA (*.dae)</strong>, giữ hierarchy. Chọn kèm các ảnh trong thư mục texture khi nhập. Nên tách từng mặt LED thành group và đặt tên <strong>LED_MAIN, LED_LEFT, LED_RIGHT</strong>.</p><div class=\"info-box warn\">Không đọc trực tiếp .skp. Mặt cong cần UV hợp lệ. Độ phân giải LED phải nhập theo pixel map thực, không lấy từ độ phân giải texture.</div>"))}
function showHelp(){dialog((typeof window==='undefined'?"Creative LED Studio / hướng dẫn":window.tr?.("Creative LED Studio / hướng dẫn","Creative LED Studio / guide")??"Creative LED Studio / hướng dẫn"),(typeof window==='undefined'?"<h3>1. Nhập và chọn bề mặt</h3><p>Kéo GLB vào cửa sổ. DAE / glTF có file phụ: chọn model, .bin và texture cùng lúc. Click đúng mặt trước LED rồi bấm <strong>Tạo LED từ mặt đang chọn</strong>. Mặt cong đã UV: chọn <strong>Cả mesh / UV</strong>. Model bị gộp: dùng <strong>+ 4 góc</strong>.</p><h3>2. Mapping video</h3><p>Nhập độ phân giải và tọa độ từng LED. Thêm clip. <strong>Video riêng</strong>: chọn Toàn video. <strong>Video mapped</strong>: chọn Dùng video này làm master cho tất cả LED. Kéo khung crop để tinh chỉnh. Tab Pixel Map cho phép kéo các ô; Shift để snap 8 px.</p><h3>3. Ánh sáng và trình diễn</h3><p>Chọn preset, chỉnh từng moving head, màu, cường độ, điểm chiếu. Bấm Trình diễn, bật Camera orbit khi cần. Xuất PNG hoặc WebM để duyệt thiết kế.</p><h3>4. Lưu dự án</h3><p>File <strong>.ledstudio</strong> đóng gói model, media, mapping và đèn. Giới hạn gói 300 MB để tránh tràn bộ nhớ. Video local không tải lên server.</p><div class=\"info-box\">Bản 0.2 là ứng dụng preview / mapping nội dung. Không có NDI, Spout, DMX, genlock, xuất cấu hình receiving card hay native SKP. Chưa hỗ trợ Draco / Meshopt / KTX2 và skin rig. MP4 phụ thuộc codec trình duyệt.</div>":window.tr?.("<h3>1. Nhập và chọn bề mặt</h3><p>Kéo GLB vào cửa sổ. DAE / glTF có file phụ: chọn model, .bin và texture cùng lúc. Click đúng mặt trước LED rồi bấm <strong>Tạo LED từ mặt đang chọn</strong>. Mặt cong đã UV: chọn <strong>Cả mesh / UV</strong>. Model bị gộp: dùng <strong>+ 4 góc</strong>.</p><h3>2. Mapping video</h3><p>Nhập độ phân giải và tọa độ từng LED. Thêm clip. <strong>Video riêng</strong>: chọn Toàn video. <strong>Video mapped</strong>: chọn Dùng video này làm master cho tất cả LED. Kéo khung crop để tinh chỉnh. Tab Pixel Map cho phép kéo các ô; Shift để snap 8 px.</p><h3>3. Ánh sáng và trình diễn</h3><p>Chọn preset, chỉnh từng moving head, màu, cường độ, điểm chiếu. Bấm Trình diễn, bật Camera orbit khi cần. Xuất PNG hoặc WebM để duyệt thiết kế.</p><h3>4. Lưu dự án</h3><p>File <strong>.ledstudio</strong> đóng gói model, media, mapping và đèn. Giới hạn gói 300 MB để tránh tràn bộ nhớ. Video local không tải lên server.</p><div class=\"info-box\">Bản 0.2 là ứng dụng preview / mapping nội dung. Không có NDI, Spout, DMX, genlock, xuất cấu hình receiving card hay native SKP. Chưa hỗ trợ Draco / Meshopt / KTX2 và skin rig. MP4 phụ thuộc codec trình duyệt.</div>","<h3>1. Import and select faces</h3><p>Drag a GLB into the window. For DAE / glTF, select the model, .bin and textures together. Click the LED front face, then <strong>Create LED from selected face</strong>. For curved faces with UVs, choose <strong>Entire mesh / UV</strong>. For merged models, use <strong>+ Four corners</strong>.</p><h3>2. Mapping video</h3><p>Enter each LED's resolution and coordinates. Add a clip. <strong>Separate video</strong>: choose Full video. <strong>Video mapped</strong>: choose Use this video as master for all LEDs. Drag the crop box to adjust. Drag tiles in Pixel Map; Shift snaps to 8 px.</p><h3>3. Lighting and presentation</h3><p>Choose a preset; adjust moving heads, colors, intensity and targets. Click Present and enable camera orbit if needed. Export PNG or WebM for design review.</p><h3>4. Save project</h3><p>File <strong>.ledstudio</strong> packages model, media, mapping and lights. Packages are limited to 300 MB to avoid memory exhaustion. Local videos are not uploaded.</p><div class=\"info-box\">Version 0.2 previews / maps content. No NDI, Spout, DMX, genlock, receiving-card configuration export or native SKP here. Draco / Meshopt / KTX2 and skin rigs are unsupported here. MP4 depends on browser codecs.</div>")??"<h3>1. Nhập và chọn bề mặt</h3><p>Kéo GLB vào cửa sổ. DAE / glTF có file phụ: chọn model, .bin và texture cùng lúc. Click đúng mặt trước LED rồi bấm <strong>Tạo LED từ mặt đang chọn</strong>. Mặt cong đã UV: chọn <strong>Cả mesh / UV</strong>. Model bị gộp: dùng <strong>+ 4 góc</strong>.</p><h3>2. Mapping video</h3><p>Nhập độ phân giải và tọa độ từng LED. Thêm clip. <strong>Video riêng</strong>: chọn Toàn video. <strong>Video mapped</strong>: chọn Dùng video này làm master cho tất cả LED. Kéo khung crop để tinh chỉnh. Tab Pixel Map cho phép kéo các ô; Shift để snap 8 px.</p><h3>3. Ánh sáng và trình diễn</h3><p>Chọn preset, chỉnh từng moving head, màu, cường độ, điểm chiếu. Bấm Trình diễn, bật Camera orbit khi cần. Xuất PNG hoặc WebM để duyệt thiết kế.</p><h3>4. Lưu dự án</h3><p>File <strong>.ledstudio</strong> đóng gói model, media, mapping và đèn. Giới hạn gói 300 MB để tránh tràn bộ nhớ. Video local không tải lên server.</p><div class=\"info-box\">Bản 0.2 là ứng dụng preview / mapping nội dung. Không có NDI, Spout, DMX, genlock, xuất cấu hình receiving card hay native SKP. Chưa hỗ trợ Draco / Meshopt / KTX2 và skin rig. MP4 phụ thuộc codec trình duyệt.</div>"))}
function initEvents(){document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>setStep(b.dataset.step));document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{engine.view=b.dataset.view;renderUI()});document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{engine.cameraPreset(b.dataset.camera);document.querySelectorAll('[data-camera]').forEach(x=>x.classList.toggle('active',x===b))});engine.onClick=onStageClick;
 $('importModel').onclick=()=>$('modelInput').click();$('importFolder').onclick=()=>$('folderInput').click();$('folderInput').onchange=async e=>{if(e.target.files.length){const list=Array.from(e.target.files);if(!list.some(f=>/\.(glb|gltf|dae|obj|skp)$/i.test(f.name))){toast((typeof window==='undefined'?"Thư mục đã chọn không chứa file model 3D (.glb, .gltf, .dae, .obj).":window.tr?.("Thư mục đã chọn không chứa file model 3D (.glb, .gltf, .dae, .obj).","Selected folder contains no 3D model files (.glb, .gltf, .dae, .obj).")??"Thư mục đã chọn không chứa file model 3D (.glb, .gltf, .dae, .obj)."),7000,'warn');e.target.value='';return;}try{await importModel(list)}catch(err){toast(err.message,9000);if(/SKP/.test(err.message))sketchupHelp()}}e.target.value=''};$('modelInput').onchange=async e=>{if(!e.target.files.length)return;try{await importModel(e.target.files)}catch(err){toast(err.message,9000);if(/SKP/.test(err.message))sketchupHelp()}e.target.value=''};$('addMedia').onclick=()=>$('mediaInput').click();$('mediaInput').onchange=async e=>{if(!e.target.files.length)return;try{await importMedia(e.target.files)}catch(err){toast(err.message,8000)}e.target.value=''};$('demoBtn').onclick=()=>dialog((typeof window==='undefined'?"Mở lại sân khấu mẫu?":window.tr?.("Mở lại sân khấu mẫu?","Reopen demo stage?")??"Mở lại sân khấu mẫu?"),(typeof window==='undefined'?"<p>Thao tác này thay model và mapping hiện tại. Thư viện video vẫn được giữ. Nên lưu dự án trước.</p>":window.tr?.("<p>Thao tác này thay model và mapping hiện tại. Thư viện video vẫn được giữ. Nên lưu dự án trước.</p>","<p>This replaces the current model and mapping. The video library is preserved. Save the project first.</p>")??"<p>Thao tác này thay model và mapping hiện tại. Thư viện video vẫn được giữ. Nên lưu dự án trước.</p>"),[{label:(typeof window==='undefined'?"Hủy":window.tr?.("Hủy","Cancel")??"Hủy")},{label:(typeof window==='undefined'?"Mở sân khấu mẫu":window.tr?.("Mở sân khấu mẫu","Open demo stage")??"Mở sân khấu mẫu"),primary:true,action:demo}]);$('skpHelp').onclick=sketchupHelp;$('helpBtn').onclick=showHelp;$('closeModal').onclick=()=>$('modal').close();$('objectSearch').oninput=renderLists;$('autoDetect').onclick=autoDetect;$('drawQuad').onclick=startQuad;$('repairMapping').onclick=()=>repairMapping3D();$('undoBtn').onclick=undo;$('redoBtn').onclick=redo;$('fitBtn').onclick=()=>engine.fit();$('testPattern').onclick=()=>{engine.globalTest=!engine.globalTest;renderUI()};$('guidesBtn').onclick=()=>{engine.showGuides=!engine.showGuides;renderUI()};$('presentBtn').onclick=togglePresentation;if($('transportPresentBtn'))$('transportPresentBtn').onclick=togglePresentation;$('exitPresent').onclick=togglePresentation;$('playBtn').onclick=()=>{setPlaying(!state.playing);renderUI()};$('restartBtn').onclick=()=>{state.time=0;syncVideos(true)};$('loopBtn').onclick=()=>{state.loop=!state.loop;renderUI()};$('duration').onchange=e=>{state.duration=clamp(+e.target.value||12,1,600);state.time=Math.min(state.time,state.duration);renderUI()};$('seek').oninput=e=>{state.time=+e.target.value/100;syncVideos(true)};if($('orbitShow'))$('orbitShow').onchange=e=>state.orbit=e.target.checked;$('saveProject').onclick=saveProject;$('loadProject').onclick=()=>$('projectInput').click();$('projectInput').onchange=async e=>{if(e.target.files[0])try{await loadProject(e.target.files[0])}catch(err){toast((typeof window==='undefined'?"Không mở được dự án: ":window.tr?.("Không mở được dự án: ","Cannot open project: ")??"Không mở được dự án: ")+err.message,9000)}e.target.value=''};
 $('exportBtn').onclick=e=>{e.stopPropagation();$('exportMenu').classList.toggle('hidden')};document.addEventListener('click',e=>{if(!$('exportMenu').contains(e.target)&&e.target!==$('exportBtn'))$('exportMenu').classList.add('hidden')});$('screenshotBtn').onclick=exportShot;$('exportShot').onclick=exportShot;$('exportMapPNG').onclick=exportMapPNG;$('exportJSON').onclick=exportJSON;$('exportCSV').onclick=exportCSV;$('recordBtn').onclick=recordPreview;$('sampleVideo').onclick=async()=>{busy(true,(typeof window==='undefined'?"Đang nạp clip mapped mẫu...":window.tr?.("Đang nạp clip mapped mẫu...","Loading demo mapped clip...")??"Đang nạp clip mapped mẫu..."));if(typeof DEMO_VIDEO_DATA==='undefined')await new Promise(ok=>{const sc=document.createElement('script');sc.src='js/data/demo-video.js';sc.onload=sc.onerror=ok;document.head.appendChild(sc)});if(typeof DEMO_VIDEO_DATA==='undefined'){busy(false);toast((typeof window==='undefined'?"Không nạp được js/data/demo-video.js. Mở file Demo_Master.mp4 trong thư mục Samples.":window.tr?.("Không nạp được js/data/demo-video.js. Mở file Demo_Master.mp4 trong thư mục Samples.","Cannot load js/data/demo-video.js. Open Demo_Master.mp4 in the Samples folder.")??"Không nạp được js/data/demo-video.js. Mở file Demo_Master.mp4 trong thư mục Samples."));return}try{let a=state.media.find(a=>a.name==='ALPHA_Master_Demo.mp4');if(!a){let blob=await(await fetch(DEMO_VIDEO_DATA)).blob();a=await addMediaFile(new File([blob],'ALPHA_Master_Demo.mp4',{type:'video/mp4'}),{silent:true})}if(!surface()&&engine.surfaces.length)engine.selected=engine.surfaces[0].id;assignMaster(a);state.step='mapping';renderUI()}catch(e){toast(e.message,8000)}finally{busy(false)}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){cancelSpatialPick();state.rebindId=null;if(state.presenting)togglePresentation();state.quad=false;state.quadPoints=[];$('quadHint').classList.add('hidden');$('exportMenu').classList.add('hidden');return}if(e.target.matches('input,textarea,select')||$('modal').open)return;const liveRun=typeof STUDIO!=='undefined'&&!!STUDIO.lumi18?.liveShow18?.running;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveProject()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(e.code==='Space'){e.preventDefault();$('playBtn').click()}else if(e.key.toLowerCase()==='f'&&!liveRun)engine.fit();else if(['1','2','3'].includes(e.key)&&!liveRun)setStep(['stage','mapping','lighting'][+e.key-1]);});
 let dragDepth=0;window.addEventListener('dragenter',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();dragDepth++;$('dropOverlay').classList.remove('hidden')}});window.addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('Files'))e.preventDefault()});window.addEventListener('dragleave',e=>{dragDepth--;if(dragDepth<=0)$('dropOverlay').classList.add('hidden')});window.addEventListener('drop',async e=>{e.preventDefault();dragDepth=0;$('dropOverlay').classList.add('hidden');let files=Array.from(e.dataTransfer?.files||[]);try{if(files.some(f=>/\.(glb|gltf|dae|obj|skp)$/i.test(f.name)))await importModel(files);else if(files.some(f=>/\.ledstudio$/i.test(f.name)))await loadProject(files.find(f=>/\.ledstudio$/i.test(f.name)));else if(files.length)await importMedia(files)}catch(err){toast(err.message,9000);if(/SKP/.test(err.message))sketchupHelp()}});
 let mapDrag=null;engine.canvas.addEventListener('pointerdown',e=>{if(engine.view!=='map'||e.button!==0)return;let p=mapXY(e);let s=[...engine.surfaces].reverse().find(s=>p[0]>=s.x&&p[0]<=s.x+s.w&&p[1]>=s.y&&p[1]<=s.y+s.h);if(s){if(s.mappingSpace==='stage'){selectSurface(s.id);toast((typeof window==='undefined'?"Map không gian bị khóa. Chuyển LED sang Crop riêng trước khi di chuyển ô đầu ra.":window.tr?.("Map không gian bị khóa. Chuyển LED sang Crop riêng trước khi di chuyển ô đầu ra.","Spatial map is locked. Switch this LED to Manual crop before moving its output tile.")??"Map không gian bị khóa. Chuyển LED sang Crop riêng trước khi di chuyển ô đầu ra."));return;}checkpoint();selectSurface(s.id);mapDrag={s,start:p,x:s.x,y:s.y};engine.canvas.setPointerCapture(e.pointerId)}});engine.canvas.addEventListener('pointermove',e=>{if(!mapDrag)return;let p=mapXY(e),snap=e.shiftKey?8:1;mapDrag.s.x=Math.max(0,Math.round((mapDrag.x+p[0]-mapDrag.start[0])/snap)*snap);mapDrag.s.y=Math.max(0,Math.round((mapDrag.y+p[1]-mapDrag.start[1])/snap)*snap)});engine.canvas.addEventListener('pointerup',()=>{if(mapDrag){updateTest(mapDrag.s);mapDrag=null;renderUI()}});engine.canvas.addEventListener('pointercancel',()=>mapDrag=null);
 engine.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.playing=false;toast((typeof window==='undefined'?"GPU context bị mất. Lưu dự án nếu có thể, tải lại trang và dùng model nhẹ hơn.":window.tr?.("GPU context bị mất. Lưu dự án nếu có thể, tải lại trang và dùng model nhẹ hơn.","GPU context lost. Save the project if possible, reload and use a lighter model.")??"GPU context bị mất. Lưu dự án nếu có thể, tải lại trang và dùng model nhẹ hơn."),20000)});window.addEventListener('beforeunload',()=>{for(let a of state.media){a.element.pause?.();URL.revokeObjectURL(a.url)}})
}
function mapXY(e){let r=engine.canvas.getBoundingClientRect(),m=engine.mapTransform;if(!m)return[0,0];let x=(e.clientX-r.left)*engine.canvas.width/r.width,y=(e.clientY-r.top)*engine.canvas.height/r.height;return[(x-m.left)/m.scale,(y-m.top)/m.scale]}
let fpsAccum=0,fpsCount=0,frameCount=0;
function loop(now){let realDt=Math.max(0,(now-state.lastFrame)/1000),dt=Math.min(.2,realDt);state.lastFrame=now;if(state.playing){state.time+=realDt;if(state.time>=state.duration){if(state.loop){state.time%=state.duration;syncVideos(true)}else{state.time=state.duration;state.playing=false;syncVideos(true);renderUI()}}}if(state.orbit&&state.playing&&engine.view==='stage')engine.camera.yaw+=dt*.07;if(++frameCount%8===0)syncVideos();engine.render(state.time);renderOverlays();$('timeLabel').textContent=Math.floor(state.time/60).toString().padStart(2,'0')+':'+(state.time%60).toFixed(2).padStart(5,'0');$('seek').value=state.time*100;$('playhead').style.left=(state.time/state.duration*100)+'%';fpsAccum+=realDt;fpsCount++;if(fpsAccum>=1){$('fps').textContent=Math.round(fpsCount/fpsAccum)+' fps';$('engineState').textContent=state.recording?(typeof window==='undefined'?"ĐANG GHI / xem thử WebM":window.tr?.("ĐANG GHI / xem thử WebM","REC / WebM preview")??"ĐANG GHI / xem thử WebM"):engine.surfaces.length+' LED / '+engine.lights.filter(l=>l.enabled).length+(typeof window==='undefined'?" đèn":window.tr?.(" đèn"," lights")??" đèn");fpsAccum=0;fpsCount=0}requestAnimationFrame(loop)}

/* V0.4 shared metric reference. Source world vertices are immutable. */
const V031={planarUV,faceMesh,createSurface,bindingMetadata,sourceForSurface,renderInspector,renderUI,renderLists,renderOverlays,snapshot,restore,importModel,demo,rigPreset,assignMaster,setSource,mappingData,mappingWarnings,bindMaster,bindSurfaceControls,setStep,setModel:StageEngine.prototype.setModel};
const MAX_PREVIEW_LIGHTS=128,IDENTITY_Q=[0,0,0,1];
const DEFAULT_FRAME=Object.freeze({scale:1,up:'keep',yaw:0,origin:'base-center'});
function finiteArray(a,n){return Array.isArray(a)&&a.length===n&&a.every(Number.isFinite);}
function vecCopy(a){return Array.from(a);}
function defaultLayout(){return {version:1,mode:'manual',reference:{origin:[0,0,0],right:[1,0,0],up:[0,1,0],normal:[0,0,1]},fit:'contain',revision:0};}
function sourceKey(m,i){return (m.path||m.name||'mesh')+'::'+i;}
function stageBounds(meshes){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const m of meshes)for(let k=0;k<3;k++){min[k]=Math.min(min[k],m.bounds.min[k]);max[k]=Math.max(max[k],m.bounds.max[k]);}if(!meshes.length)return {min:[-1,0,-1],max:[1,1,1],size:[2,1,2],center:[0,.5,0]};return {min,max,size:M.sub(max,min),center:M.mul(M.add(min,max),.5)};}
function configureStageBounds(){const vis=engine.stage.filter(m=>!m.hidden),nonVenue=vis.filter(m=>!m._venueArch18),b=stageBounds(nonVenue.length?nonVenue:vis);engine.stageBounds=b;engine.size={width:Math.max(.0001,b.size[0]),height:Math.max(.0001,b.size[1]),depth:Math.max(.0001,b.size[2])};engine.releaseMesh(engine.floor);const span=Math.max(10,...b.size)*6;engine.floor=boxMesh('Environment floor',[b.center[0],b.min[1]-.055,b.center[2]],[span,.1,span],[.10,.11,.13,1]);engine.floor.isFloor=true;}
function normalizedConfig(config){const c={...DEFAULT_FRAME,...config};if(!Number.isFinite(+c.scale)||+c.scale<=0||+c.scale>1e6)throw Error((typeof window==='undefined'?"Hệ số tỷ lệ phải dương và không vượt 1.000.000.":window.tr?.("Hệ số tỷ lệ phải dương và không vượt 1.000.000.","Scale must be positive and at most 1,000,000.")??"Hệ số tỷ lệ phải dương và không vượt 1.000.000."));if(!Number.isFinite(+c.yaw))throw Error((typeof window==='undefined'?"Góc xoay không hợp lệ.":window.tr?.("Góc xoay không hợp lệ.","Invalid yaw.")??"Góc xoay không hợp lệ."));c.scale=+c.scale;c.yaw=+c.yaw;c.up=['keep','z','x'].includes(c.up)?c.up:'keep';c.origin=c.origin==='source'?'source':'base-center';return c;}
function calculateFrame(config,meshes=engine.stage){
 const c=normalizedConfig(config),up=c.up==='z'?M.rotate([1,0,0],-Math.PI/2):c.up==='x'?M.rotate([0,0,1],Math.PI/2):M.identity();
 const linear=M.mm(M.rotate([0,1,0],c.yaw*Math.PI/180),M.mm(up,M.trs([0,0,0],IDENTITY_Q,[c.scale,c.scale,c.scale]))),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const m of meshes){const p=m._sourceP||m.p;for(let i=0;i<p.length;i+=3){const v=M.point(linear,[p[i],p[i+1],p[i+2]]);for(let k=0;k<3;k++){min[k]=Math.min(min[k],v[k]);max[k]=Math.max(max[k],v[k]);}}}
 if(!meshes.length){min.splice(0,3,-1,0,-1);max.splice(0,3,1,1,1);}
 const offset=c.origin==='source'?[0,0,0]:[-(min[0]+max[0])/2,-min[1],-(min[2]+max[2])/2],matrix=M.mm(M.translate(offset),linear);
 return {version:1,unit:'m',space:'importer-world-to-stage',config:c,matrix,inverse:M.inverse(matrix),sourceInfo:engine.coordinates?.sourceInfo||{format:'unknown',normalizedByImporter:true},normalization:'One shared uniform scale, rotation and translation. Never fit individual objects.'};
}
StageEngine.prototype.setModel=function(meshes){
 for(let i=0;i<meshes.length;i++){const m=meshes[i];m._sourceP=new Float32Array(m.p);m.sourceKey=sourceKey(m,i);m._sourceAxes=m.sourceTransform?[[1,0,0],[0,1,0],[0,0,1]].map(v=>M.norm(M.vector(m.sourceTransform,v))):[[1,0,0],[0,1,0],[0,0,1]];}
 const shift=V031.setModel.call(this,meshes);this.coordinates={version:1,unit:'m',space:'importer-world-to-stage',config:{...DEFAULT_FRAME},matrix:M.translate(shift),inverse:M.translate(M.mul(shift,-1)),sourceInfo:{format:'unknown',normalizedByImporter:true}};
 for(const m of meshes){m.worldAxes=m._sourceAxes.map(v=>[...v]);m._appliedCanon8=[...this.coordinates.matrix];m._appliedSourceP8=m._sourceP;}this.layout=defaultLayout();configureStageBounds();return shift;
};
function resetFlatCache(){if(!engine.flatCache.size)return;for(const c of engine.flatCache.values())engine.releaseMesh(c.mesh);engine.flatCache.clear();}
function transformAttachmentMesh(mesh,delta){const n=makeMesh(mesh.name,mesh.p,mesh.uv,mesh.n,mesh.material);transformMesh(n,delta);if(mesh.preferredUp)n.preferredUp=M.norm(M.vector(delta,mesh.preferredUp));return n;}
function applyCoordinateConfig(config,{record=true,updateAttachments=true,fit=true}={}){
 const frame=calculateFrame(config),old=engine.coordinates||{matrix:M.identity(),config:{scale:1}},delta=M.mm(frame.matrix,M.inverse(old.matrix));if(record)checkpoint();const ratio=frame.config.scale/(old.config?.scale||1);
 for(const m of engine.stage){if(m._asset16Id)continue;engine.releaseMesh(m);m.p=new Float32Array(m._sourceP);transformMesh(m,frame.matrix);m.worldAxes=(m._sourceAxes||[[1,0,0],[0,1,0],[0,0,1]]).map(v=>M.norm(M.vector(frame.matrix,v)));m._appliedCanon8=[...frame.matrix];m._appliedSourceP8=m._sourceP;}
 if(updateAttachments){
  for(const s of engine.surfaces){const oldMesh=s.mesh;s.mesh=transformAttachmentMesh(s.mesh,delta);engine.releaseMesh(oldMesh);s.bindingNormal=M.norm(M.vector(delta,s.bindingNormal||[0,0,1]));if(s.mappingMode==='face')for(let i=0;i<s.mesh.n.length;i+=3)s.mesh.n.set(s.bindingNormal,i);s.physical=(s.physical||[1,1]).map(v=>v*ratio);if(s.liftMm)s.liftMm*=ratio;updateTest(s);}
  for(const l of engine.lights){l.pos=M.point(delta,l.pos);l.target=M.point(delta,l.target);if(l.fixtureSize)l.fixtureSize=l.fixtureSize.map(v=>v*ratio);if(l.aperture)l.aperture*=ratio;if(l.beamLength)l.beamLength*=ratio;}
  const ref=engine.layout?.reference;if(ref&&(engine.surfaces.length||ref.explicit)){ref.origin=M.point(delta,ref.origin);for(const k of ['right','up','normal'])ref[k]=M.norm(M.vector(delta,ref[k]));}
  engine.camera.target=M.point(delta,engine.camera.target);engine.camera.distance*=ratio;
 }
 engine.coordinates=frame;configureStageBounds();resetFlatCache();if(engine.surfaces.some(s=>s.mappingSpace==='stage'))rebuildSpatialMap({activate:false,record:false});engine.rebuildFixtures();if(fit)engine.fit();state.hit=null;state.quadPoints=[];state.measurePoints=[];if(!state._restoring)renderUI();else state._deferUI=true;return frame;
}
StageEngine.prototype.fit=function(){const vis=this.stage.filter(m=>!m.hidden),nonVenue=vis.filter(m=>!m._venueArch18),b=stageBounds(nonVenue.length?nonVenue:vis),r=Math.max(.25,this.canvas.clientWidth/Math.max(1,this.canvas.clientHeight));this.stageBounds=b;this.camera.target=[...b.center];this.camera.distance=Math.max(.02,b.size[1]*1.5,b.size[0]*1.5/r,b.size[2]*1.15)*1.25;this.camera.yaw=.13;this.camera.pitch=.23;};

/* Plane-local minimum-area rectangle, not a world-axis bounding box. */
const metricCache=new WeakMap();
function convexHull2(points){points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lower=[],upper=[];for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=1e-12)lower.pop();lower.push(p);}for(let i=points.length-1;i>=0;i--){const p=points[i];while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=1e-12)upper.pop();upper.push(p);}return lower.slice(0,-1).concat(upper.slice(0,-1));}
function measureFace(mesh){
 const upIn=mesh.preferredUp||mesh.worldAxes?.[1]||[0,1,0],cached=metricCache.get(mesh);if(cached?.p===mesh.p&&cached?.up0===upIn[0]&&cached?.up1===upIn[1]&&cached?.up2===upIn[2])return cached.value;
 let n=[0,0,0],biggest=[0,0,1],bestArea=0;
 for(let i=0;i<mesh.p.length;i+=9){const a=Array.from(mesh.p.slice(i,i+3)),b=Array.from(mesh.p.slice(i+3,i+6)),c=Array.from(mesh.p.slice(i+6,i+9));let cr=M.cross(M.sub(b,a),M.sub(c,a)),len=Math.hypot(...cr);if(M.dot(cr,Array.from(mesh.n.slice(i,i+3)))<0)cr=M.mul(cr,-1);n=M.add(n,cr);if(len>bestArea){biggest=cr;bestArea=len;}}
 n=M.norm(Math.hypot(...n)>1e-10?n:biggest);let up0=upIn;up0=M.sub(up0,M.mul(n,M.dot(up0,n)));if(Math.hypot(...up0)<1e-5){up0=[0,0,-1];up0=M.sub(up0,M.mul(n,M.dot(up0,n)));}if(Math.hypot(...up0)<1e-5){up0=[1,0,0];up0=M.sub(up0,M.mul(n,M.dot(up0,n)));}up0=M.norm(up0);const right0=M.norm(M.cross(up0,n));up0=M.norm(M.cross(n,right0));
 const center=mesh.bounds.center,points=[],seen=new Set(),eps=Math.max(...mesh.bounds.size,1)*1e-7;
 for(let i=0;i<mesh.p.length;i+=3){const q=M.sub([mesh.p[i],mesh.p[i+1],mesh.p[i+2]],center),x=M.dot(q,right0),y=M.dot(q,up0),key=Math.round(x/eps)+','+Math.round(y/eps);if(!seen.has(key)){seen.add(key);points.push([x,y]);}}
 const hull=convexHull2(points),angles=[[1,0]],stride=Math.max(1,Math.ceil(hull.length/192));for(let i=0;i<hull.length;i+=stride){const a=hull[i],b=hull[(i+1)%hull.length],d=[b[0]-a[0],b[1]-a[1]],len=Math.hypot(...d);if(len>eps)angles.push([d[0]/len,d[1]/len],[-d[1]/len,d[0]/len]);}
 let best=null;for(let[a,b]of angles){if(a<0){a=-a;b=-b;}let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const q of hull.length?hull:points){const x=q[0]*a+q[1]*b,y=-q[0]*b+q[1]*a;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}const area=(maxX-minX)*(maxY-minY);if(!best||area<best.area*(1-1e-6)||(Math.abs(area-best.area)<=Math.max(1e-9,best.area*1e-6)&&a>best.a))best={a,b,minX,maxX,minY,maxY,area};}
 if(!best||!Number.isFinite(best.area))return {uv:new Float32Array(mesh.uv),width:0,height:0,normal:n,right:right0,up:up0,origin:center};
 const right=M.add(M.mul(right0,best.a),M.mul(up0,best.b)),up=M.add(M.mul(right0,-best.b),M.mul(up0,best.a)),width=best.maxX-best.minX,height=best.maxY-best.minY,out=new Float32Array(mesh.p.length/3*2);
 for(let i=0,k=0;i<mesh.p.length;i+=3,k+=2){const q=M.sub([mesh.p[i],mesh.p[i+1],mesh.p[i+2]],center);out[k]=(M.dot(q,right)-best.minX)/(width||1);out[k+1]=(best.maxY-M.dot(q,up))/(height||1);}
 const origin=M.add(center,M.add(M.mul(right,best.minX),M.mul(up,best.maxY))),value={uv:out,width,height,normal:n,right,up,origin,corners:[origin,M.add(origin,M.mul(right,width)),M.add(M.add(origin,M.mul(right,width)),M.mul(up,-height)),M.add(origin,M.mul(up,-height))]};metricCache.set(mesh,{p:mesh.p,up0:upIn[0],up1:upIn[1],up2:upIn[2],value});return value;
}
planarUV=function(mesh){return measureFace(mesh);};
faceMesh=function(hit){const m=V031.faceMesh(hit);m.preferredUp=hit.mesh.worldAxes?.[1]||[0,1,0];m.uv=measureFace(m).uv;return m;};
bindingMetadata=function(mesh,options={}){const base=V031.bindingMetadata(mesh,options),source=engine.stage.find(m=>m.id===base.sourceMeshId);return {...base,bindVersion:'0.4.0',sourceMeshPath:source?.path||null,sourceKey:source?.sourceKey||null,sourceTriangles:mesh._ledBinding?.triangles||options.sourceTriangles||null,referenceSpace:'stage-meters'};};
sourceForSurface=function(s){if(s.sourceKey){const m=engine.stage.find(m=>m.sourceKey===s.sourceKey);if(m)return m;}if(s.sourceMeshPath){const a=engine.stage.filter(m=>m.path===s.sourceMeshPath);if(a.length===1)return a[0];}return V031.sourceForSurface(s);};
function normalizeSurfaceHardware(s) {
 if (!s || typeof s !== 'object') return s;
 const rawSpec = s.cabinetSpec && typeof s.cabinetSpec === 'object' ? s.cabinetSpec : {};
 const rawWiring = s.wiringConfig && typeof s.wiringConfig === 'object' ? s.wiringConfig : {};
 const modelId = s.cabinetModelId || s.cabinetBrandId || rawSpec.modelId || null;
 const catCab = modelId && LED_CABINET_CATALOG[modelId] ? LED_CABINET_CATALOG[modelId] : null;
 const procId = s.processorModelId || rawWiring.processorModelId || null;
 const catProc = procId && LED_PROCESSOR_CATALOG[procId] ? LED_PROCESSOR_CATALOG[procId] : null;

 const cabW = clamp(Math.round(+(s._cabWOverride ?? rawSpec.widthMm ?? rawSpec.cabWmm ?? catCab?.widthMm ?? s.cabW) || 500), 100, 2000);
 const cabH = clamp(Math.round(+(s._cabHOverride ?? rawSpec.heightMm ?? rawSpec.cabHmm ?? catCab?.heightMm ?? s.cabH) || 500), 100, 2000);
 const pxW = clamp(Math.round(+(s._pxWOverride ?? rawSpec.pxW ?? catCab?.pxW ?? s.pxW) || 192), 8, 2048);
 const pxH = clamp(Math.round(+(s._pxHOverride ?? rawSpec.pxH ?? catCab?.pxH ?? s.pxH) || 192), 8, 2048);
 const weightKg = clamp(+(rawSpec.weightKg ?? s.cabWeightKg ?? s.cabinetWeightKg ?? catCab?.weightKg) || 8.5, 0.5, 200);
 const maxPowerW = clamp(Math.round(+(rawSpec.maxPowerW ?? s.cabMaxPowerW ?? s.cabinetPowerMaxW ?? catCab?.maxPowerW) || 160), 10, 5000);
 const avgPowerW = clamp(Math.round(+(rawSpec.avgPowerW ?? s.cabAvgPowerW ?? s.cabinetPowerAvgW ?? catCab?.avgPowerW) || 70), 5, maxPowerW);
 const nits = clamp(Math.round(+(rawSpec.nits ?? s.nits ?? catCab?.nits) || 1200), 100, 10000);
 const pitchMm = +(rawSpec.pitchMm ?? catCab?.pitchMm ?? +(cabW / pxW).toFixed(2)) || 2.6;
 delete s._cabWOverride; delete s._cabHOverride; delete s._pxWOverride; delete s._pxHOverride;

 const hasExplicitPhysicalW = Boolean(s.physical?.[0] || s.physicalWidthM);
 const hasExplicitPhysicalH = Boolean(s.physical?.[1] || s.physicalHeightM);
 const physW = Math.max(0.25, +(s.physical?.[0] || s.physicalWidthM || (s.w / pxW) * (cabW / 1000) || 4));
 const physH = Math.max(0.25, +(s.physical?.[1] || s.physicalHeightM || (s.h / pxH) * (cabH / 1000) || 2.5));

 const cols = clamp(
  Math.round(
   hasExplicitPhysicalW
    ? Math.ceil((physW * 1000 - 1) / cabW)
    : (+(s.cabCols || rawSpec.cols) || Math.ceil((physW * 1000 - 1) / cabW))
  ),
  1,
  64
 );

 const mixedRowHeightM = (+s.rows500x1000 || 0) * 1.0 + (+s.rows500x500 || 0) * 0.5;
 if (hasExplicitPhysicalH && s._mixedSpecHeightM !== undefined && Math.abs(physH - s._mixedSpecHeightM) > 0.05 && Math.abs(mixedRowHeightM - physH) > 0.05) {
  s.rows500x1000 = 0;
  s.rows500x500 = 0;
  delete s._mixedSpecHeightM;
 }
 const hasMixedRowSpec =
  ((+s.rows500x1000 || 0) > 0 && (+s.rows500x500 || 0) > 0) ||
  ((+s.rows500x1000 || 0) > 0 && cabH !== 1000) ||
  ((+s.rows500x500 || 0) > 0 && cabH === 1000);
 let rows500x1000 = hasMixedRowSpec ? clamp(Math.round(+s.rows500x1000 || 0), 0, 64) : 0;
 let rows500x500 = hasMixedRowSpec ? clamp(Math.round(+s.rows500x500 || 0), 0, 64) : 0;
 let rows;
 if (hasMixedRowSpec && (rows500x1000 + rows500x500) > 0) {
  rows = clamp(rows500x1000 + rows500x500, 1, 64);
 } else {
  rows = clamp(
   Math.round(
    hasExplicitPhysicalH
     ? Math.ceil((physH * 1000 - 1) / cabH)
     : (+(s.cabRows || rawSpec.rows) || Math.ceil((physH * 1000 - 1) / cabH))
   ),
   1,
   64
  );
  if (cabH === 1000) {
   rows500x1000 = rows;
   rows500x500 = 0;
  } else {
   rows500x1000 = 0;
   rows500x500 = rows;
  }
 }

 const rowLayout = [];
 for (let r = 0; r < rows; r++) {
  const isTallRow = hasMixedRowSpec ? (r < rows500x1000) : (cabH === 1000);
  const rowHmm = hasMixedRowSpec ? (isTallRow ? 1000 : 500) : cabH;
  const heightRatio = rowHmm / cabH;
  const rowPxH = Math.max(8, Math.round(pxH * heightRatio));
  const rowWeightKg = +(weightKg * heightRatio * (rowHmm === 1000 && cabH === 500 ? 0.92 : 1)).toFixed(2);
  const rowMaxW = Math.max(10, Math.round(maxPowerW * heightRatio));
  const rowAvgW = Math.max(5, Math.round(avgPowerW * heightRatio));
  rowLayout.push({
   row: r,
   type: cabW + 'x' + rowHmm,
   widthMm: cabW,
   heightMm: rowHmm,
   pxW,
   pxH: rowPxH,
   weightKg: rowWeightKg,
   maxPowerW: rowMaxW,
   avgPowerW: rowAvgW
  });
 }

 if (!s.panelAngleDeg && Number.isFinite(+s.curveDegPerCab) && +s.curveDegPerCab !== 0) {
  s.panelAngleDeg = clamp(+s.curveDegPerCab, -30, 30);
 }
 const angleDeg = clamp(+(s.panelAngleDeg || 0), -30, 30);
 const orderToPattern = {
  'snake-tl-h': 'H-TL', 'snake-tr-h': 'H-TR', 'snake-bl-h': 'H-BL', 'snake-br-h': 'H-BR',
  'snake-tl-v': 'V-TL', 'snake-tr-v': 'V-TR', 'snake-bl-v': 'V-BL', 'snake-br-v': 'V-BR',
  'snake-tl-right': 'H-TL', 'snake-tr-left': 'H-TR', 'snake-bl-right': 'H-BL', 'snake-br-left': 'H-BR',
  'snake-tl-down': 'V-TL', 'snake-tr-down': 'V-TR', 'snake-bl-up': 'V-BL', 'snake-br-up': 'V-BR',
  'Top-L': 'H-TL', 'Top-R': 'H-TR', 'Bot-L': 'H-BL', 'Bot-R': 'H-BR',
  'top-l': 'H-TL', 'top-r': 'H-TR', 'bot-l': 'H-BL', 'bot-r': 'H-BR'
 };
 const patternToOrder = {
  'H-TL': 'snake-tl-h', 'H-TR': 'snake-tr-h', 'H-BL': 'snake-bl-h', 'H-BR': 'snake-br-h',
  'V-TL': 'snake-tl-v', 'V-TR': 'snake-tr-v', 'V-BL': 'snake-bl-v', 'V-BR': 'snake-br-v'
 };
 let pattern = rawWiring.pattern || orderToPattern[rawWiring.startCorner] || orderToPattern[s.wiringOrder] || (patternToOrder[s.wiringOrder] ? s.wiringOrder : 'H-TL');
 if (!patternToOrder[pattern]) pattern = orderToPattern[pattern] || 'H-TL';
 const wiringOrder = patternToOrder[pattern] || 'snake-tl-h';
 const startCorner = pattern.endsWith('BL') ? 'Bot-L' : pattern.endsWith('BR') ? 'Bot-R' : pattern.endsWith('TR') ? 'Top-R' : 'Top-L';
 const rawSplit = String(rawWiring.powerSplitMode || s.powerSplitMode || 'full').toLowerCase();
 const powerSplitMode = ['full', 'horiz_top_bot', 'vert_left_right'].includes(rawSplit) ? rawSplit : 'full';
 const safetyGapPx = clamp(Math.round(+(rawWiring.safetyGapPx ?? s.safetyGapPx ?? 0)), 0, 64);
 const voltage = +(rawWiring.voltageV ?? rawWiring.voltage) === 110 ? 110 : 220;
 const maxPixelsPerPort = clamp(Math.round(+(rawWiring.maxPixelsPerPort ?? s.maxPixelsPerPort ?? catProc?.maxPixelsPerPort) || 650000), 10000, 10000000);
 const maxWattsPerLoop = clamp(Math.round(+(rawWiring.maxWattsPerLoop ?? s.maxWattsPerLoop) || (voltage === 110 ? 1320 : 2200)), 100, 25000);

 const rawVoids = Array.isArray(s.virtualTiles) ? s.virtualTiles : [];
 const voidSet = new Set();
 for (const item of rawVoids) {
  const str = String(item);
  const parts = str.split(',');
  const c = +parts[0], r = +parts[1];
  if (Number.isInteger(c) && Number.isInteger(r) && c >= 0 && c < cols && r >= 0 && r < rows) {
   voidSet.add(c + ',' + r);
  }
 }
 const sortedVoids = [...voidSet].sort((a, b) => {
  const [ac, ar] = a.split(',').map(Number);
  const [bc, br] = b.split(',').map(Number);
  return ar - br || ac - bc;
 });
 const totalGrid = cols * rows;
 if (sortedVoids.length >= totalGrid && totalGrid > 0) {
  sortedVoids.length = totalGrid - 1;
 }
 const activeVoidSet = new Set(sortedVoids);

 const rawAngles = Array.isArray(s.columnAnglesDeg) && s.columnAnglesDeg.length ? s.columnAnglesDeg : null;
 const hasCustomSections = Array.isArray(s.curvatureSections) && s.curvatureSections.length > 0;
 const rawAllZero = rawAngles ? rawAngles.every(a => !(Number(a) || 0)) : true;
 const columnAnglesDeg = [];
 for (let c = 0; c < cols; c++) {
  const v = (rawAngles && !(angleDeg !== 0 && rawAllZero && !hasCustomSections) && Number.isFinite(+rawAngles[c])) ? +rawAngles[c] : angleDeg;
  columnAnglesDeg.push(clamp(v, -30, 30));
 }

 let totalWeightKg = 0;
 let totalPowerMaxW = 0;
 let totalPowerAvgW = 0;
 for (let r = 0; r < rows; r++) {
  const rl = rowLayout[r];
  for (let c = 0; c < cols; c++) {
   if (activeVoidSet.has(c + ',' + r)) continue;
   totalWeightKg += rl.weightKg;
   totalPowerMaxW += rl.maxPowerW;
   totalPowerAvgW += rl.avgPowerW;
  }
 }

 const totalPhysicalWidthM = +((cols * cabW) / 1000).toFixed(3);
 const totalPhysicalHeightM = +(rowLayout.reduce((acc, rl) => acc + rl.heightMm, 0) / 1000).toFixed(3);
 const totalResX = cols * pxW;
 const totalResY = rowLayout.reduce((acc, rl) => acc + rl.pxH, 0);

 if (catCab) s.cabinetModelId = catCab.id;
 if (catProc) s.processorModelId = catProc.id;
 s.shapeType = s.shapeType || 'flat';
 s.wiringViewMode = s.wiringViewMode === 'rear' ? 'rear' : 'front';
 s.rows500x1000 = rows500x1000;
 s.rows500x500 = rows500x500;
 if (hasMixedRowSpec) s._mixedSpecHeightM = hasExplicitPhysicalH ? physH : totalPhysicalHeightM;
 else delete s._mixedSpecHeightM;
 s.rowLayout = rowLayout;
 s.totalPhysicalWidthM = totalPhysicalWidthM;
 s.totalPhysicalHeightM = totalPhysicalHeightM;
 s.totalResX = totalResX;
 s.totalResY = totalResY;
 s.totalWeightKg = +totalWeightKg.toFixed(2);
 s.totalPowerMaxW = Math.round(totalPowerMaxW);
 s.totalPowerAvgW = Math.round(totalPowerAvgW);

 s.cabinetSpec = {
  modelId: catCab?.id || modelId || null,
  brand: catCab?.brand || rawSpec.brand || 'Generic Touring',
  model: catCab?.model || rawSpec.model || (cabW + 'x' + cabH + 'mm'),
  pitchMm,
  widthMm: cabW,
  heightMm: cabH,
  cabWmm: cabW,
  cabHmm: cabH,
  pxW,
  pxH,
  cols,
  rows,
  weightKg,
  maxPowerW,
  avgPowerW,
  nits
 };
 s.wiringConfig = {
  pattern,
  startCorner,
  powerSplitMode,
  safetyGapPx,
  maxPixelsPerPort,
  maxWattsPerLoop,
  voltage,
  voltageV: voltage,
  processorModelId: catProc?.id || procId || null,
  viewMode: s.wiringViewMode
 };
 s.powerSplitMode = powerSplitMode;
 s.safetyGapPx = safetyGapPx;
 s.columnAnglesDeg = columnAnglesDeg;
 s.cabW = cabW; s.cabH = cabH; s.pxW = pxW; s.pxH = pxH;
 s.cabCols = cols; s.cabRows = rows;
 s.panelAngleDeg = angleDeg;
 s.wiringOrder = wiringOrder;
 s.virtualTiles = sortedVoids;
 s.totalCabinetGrid = totalGrid;
 s.activeCabinets = Math.max(1, totalGrid - s.virtualTiles.length);
 return s;
}
const LED_CABINET_CATALOG = {
 roe_bp2v2_500: { id: 'roe_bp2v2_500', brand: 'ROE Visual', model: 'Black Pearl BP2V2 (500x500)', pitchMm: 2.84, widthMm: 500, heightMm: 500, pxW: 176, pxH: 176, weightKg: 9.4, maxPowerW: 190, avgPowerW: 95, nits: 1500, maxCurveDeg: 10 },
 roe_cb5_1000: { id: 'roe_cb5_1000', brand: 'ROE Visual', model: 'Carbon CB5 MKII (500x1000)', pitchMm: 5.77, widthMm: 500, heightMm: 1000, pxW: 96, pxH: 192, weightKg: 13.8, maxPowerW: 360, avgPowerW: 160, nits: 5000, maxCurveDeg: 15 },
 absen_pl25_500: { id: 'absen_pl25_500', brand: 'Absen', model: 'Polaris PL2.5 Pro (500x500)', pitchMm: 2.5, widthMm: 500, heightMm: 500, pxW: 200, pxH: 200, weightKg: 8.8, maxPowerW: 175, avgPowerW: 75, nits: 1500, maxCurveDeg: 10 },
 absen_pl39_1000: { id: 'absen_pl39_1000', brand: 'Absen', model: 'Polaris PL3.9W V10 (500x1000)', pitchMm: 3.91, widthMm: 500, heightMm: 1000, pxW: 128, pxH: 256, weightKg: 13.2, maxPowerW: 340, avgPowerW: 135, nits: 4500, maxCurveDeg: 10 },
 unilumin_upad4_500: { id: 'unilumin_upad4_500', brand: 'Unilumin', model: 'UpadIV P2.6 (500x500)', pitchMm: 2.6, widthMm: 500, heightMm: 500, pxW: 192, pxH: 192, weightKg: 7.5, maxPowerW: 160, avgPowerW: 65, nits: 1200, maxCurveDeg: 10 },
 unilumin_ugm2_1000: { id: 'unilumin_ugm2_1000', brand: 'Unilumin', model: 'UGMII P3.9 (500x1000)', pitchMm: 3.91, widthMm: 500, heightMm: 1000, pxW: 128, pxH: 256, weightKg: 12.5, maxPowerW: 320, avgPowerW: 120, nits: 4500, maxCurveDeg: 10 },
 gloshine_mv26_500: { id: 'gloshine_mv26_500', brand: 'Gloshine', model: 'MV Pro P2.6 (500x500)', pitchMm: 2.6, widthMm: 500, heightMm: 500, pxW: 192, pxH: 192, weightKg: 8.0, maxPowerW: 165, avgPowerW: 70, nits: 1200, maxCurveDeg: 15 },
 gloshine_ls39_1000: { id: 'gloshine_ls39_1000', brand: 'Gloshine', model: 'LS Outdoor P3.91 (500x1000)', pitchMm: 3.91, widthMm: 500, heightMm: 1000, pxW: 128, pxH: 256, weightKg: 13.0, maxPowerW: 350, avgPowerW: 140, nits: 4800, maxCurveDeg: 10 }
};
const LED_PROCESSOR_CATALOG = {
 novastar_vx600: { id: 'novastar_vx600', brand: 'NovaStar', model: 'VX600', ports: 6, maxPixelsPerPort: 650000, maxTotalPixels: 3900000, protocol: 'Novastar VMP / LCT' },
 novastar_vx1000: { id: 'novastar_vx1000', brand: 'NovaStar', model: 'VX1000', ports: 10, maxPixelsPerPort: 650000, maxTotalPixels: 6500000, protocol: 'Novastar VMP / LCT' },
 novastar_mctrl4k: { id: 'novastar_mctrl4k', brand: 'NovaStar', model: 'MCTRL4K', ports: 16, maxPixelsPerPort: 650000, maxTotalPixels: 8800000, protocol: 'Novastar LCT' },
 novastar_mx40pro: { id: 'novastar_mx40pro', brand: 'NovaStar', model: 'MX40 Pro (COEX)', ports: 20, maxPixelsPerPort: 650000, maxTotalPixels: 13000000, protocol: 'Novastar COEX VMP' },
 brompton_s8: { id: 'brompton_s8', brand: 'Brompton', model: 'Tessera S8', ports: 8, maxPixelsPerPort: 524288, maxTotalPixels: 4194304, protocol: 'Brompton Tessera' },
 brompton_sx40: { id: 'brompton_sx40', brand: 'Brompton', model: 'Tessera SX40', ports: 20, maxPixelsPerPort: 524288, maxTotalPixels: 8847360, protocol: 'Brompton Tessera XD' }
};
globalThis.LED_CABINET_CATALOG = LED_CABINET_CATALOG;
globalThis.LED_PROCESSOR_CATALOG = LED_PROCESSOR_CATALOG;
function computeGeometricScreenLayout(surface) {
 const s = surface && typeof surface === 'object' ? surface : {};
 const cabWmm = Math.max(100, +(s.cabinetSpec?.widthMm || s.cabW || 500));
 const cabHmm = Math.max(100, +(s.cabinetSpec?.heightMm || s.cabH || 500));
 const cabWM = cabWmm / 1000;
 const cabHM = cabHmm / 1000;
 const cols = Math.max(1, Math.round(+(s.cabCols || s.cabinetSpec?.cols || (s.w && s.w <= 64 ? s.w / cabWM : 8))));
 const rows = Math.max(1, Math.round(+(s.cabRows || s.cabinetSpec?.rows || (s.h && s.h <= 64 ? s.h / cabHM : 4))));
 const totalWidthM = +(cols * cabWM).toFixed(3);
 const heightM = +(s.totalPhysicalHeightM || s.physical?.[1] || (s.h && s.h <= 64 ? s.h : rows * cabHM)).toFixed(3);
 const shapeType = String(s.shapeType || 'flat').toLowerCase();

 if (shapeType === 'l_corner_90') {
  const splitCol = clamp(Math.round(+(s.cornerSplitCol || Math.floor(cols / 2))), 1, Math.max(1, cols - 1));
  const wingACols = splitCol;
  const wingBCols = Math.max(1, cols - splitCol);
  const wingAW = +(wingACols * cabWM).toFixed(3);
  const wingBW = +(wingBCols * cabWM).toFixed(3);
  const cornerAngleDeg = +(s.cornerAngleDeg ?? 90);
  return {
   shapeType: 'l_corner_90',
   cornerAngleDeg,
   cornerSplitCol: splitCol,
   miteredCab45: true,
   heightM,
   footprintWidthM: wingAW,
   footprintDepthM: wingBW,
   segments: [
    { id: 'wing_a', label: 'Left Wing A', startCol: 0, cols: wingACols, widthM: wingAW, heightM, angleDeg: 0, origin: [0, 0, 0] },
    { id: 'wing_b', label: 'Right Wing B (90 deg)', startCol: splitCol, cols: wingBCols, widthM: wingBW, heightM, angleDeg: cornerAngleDeg, origin: [wingAW, 0, 0] }
   ]
  };
 }

 if (shapeType === 'cube') {
  const cubeFaces = clamp(Math.round(+(s.cubeFaces || 4)), 4, 6);
  const sideCols = Math.max(1, Math.floor(cols / 4));
  const sideWidthM = +(sideCols * cabWM).toFixed(3);
  const faceNames = ['front', 'right', 'back', 'left', 'bottom', 'top'].slice(0, cubeFaces);
  const segments = faceNames.map((faceId, idx) => ({
   id: faceId,
   label: 'Cube Face ' + faceId.toUpperCase(),
   startCol: idx < 4 ? idx * sideCols : 0,
   cols: sideCols,
   widthM: sideWidthM,
   heightM: faceId === 'bottom' || faceId === 'top' ? sideWidthM : heightM,
   angleDeg: idx < 4 ? idx * 90 : 0
  }));
  return {
   shapeType: 'cube',
   cubeFaces,
   footprintWidthM: sideWidthM,
   footprintDepthM: sideWidthM,
   heightM,
   segments
  };
 }

 if (shapeType === 'cylinder_360') {
  const circumferenceM = +(s.w && s.w < 100 ? s.w : totalWidthM).toFixed(3);
  const radiusM = +(circumferenceM / (2 * Math.PI)).toFixed(3);
  const diameterM = +(radiusM * 2).toFixed(3);
  const stepAngleDeg = +(360 / cols).toFixed(2);
  return {
   shapeType: 'cylinder_360',
   circumferenceM,
   radiusM,
   diameterM,
   stepAngleDeg,
   footprintWidthM: diameterM,
   footprintDepthM: diameterM,
   heightM,
   segments: [{ id: 'ring_360', label: '360 Cylinder Ring', startCol: 0, cols, widthM: circumferenceM, heightM, radiusM }]
  };
 }

 if (shapeType === 'arc') {
  const curve = computeCurvedSpanMeters(s);
  return {
   shapeType: 'arc',
   footprintWidthM: curve.chordWidthM,
   footprintDepthM: curve.depthOffsetM,
   arcWidthM: curve.arcWidthM,
   heightM,
   segments: [{ id: 'arc_main', label: 'Curved Arc Wall', startCol: 0, cols, widthM: curve.arcWidthM, heightM }]
  };
 }

 return {
  shapeType: 'flat',
  footprintWidthM: totalWidthM,
  footprintDepthM: 0.15,
  heightM,
  segments: [{ id: 'flat_main', label: 'Flat LED Wall', startCol: 0, cols, widthM: totalWidthM, heightM }]
 };
}
function renderSurfaceCalibrationTestCard(surfaceArg, targetCanvas, opts = {}) {
 const s = surfaceArg && typeof surfaceArg === 'object' ? surfaceArg : {};
 normalizeSurfaceHardware(s);
 const transparent = !!opts.transparent;
 const cadFrame = !!opts.cadFrame;
 const cajetinMeta = opts.cajetinMeta && typeof opts.cajetinMeta === 'object' ? opts.cajetinMeta : null;
 const widthPx = clamp(Math.round(+(opts.widthPx || s.totalResX || (s.cabCols * s.pxW) || 1920)), 64, 16384);
 const heightPx = clamp(Math.round(+(opts.heightPx || s.totalResY || (s.cabRows * s.pxH) || 1080)), 64, 16384);
 const canvas = targetCanvas || (typeof document !== 'undefined' ? document.createElement('canvas') : { width: 0, height: 0, getContext: () => null });
 canvas.width = widthPx;
 canvas.height = heightPx;
 const ctx = canvas.getContext ? canvas.getContext('2d') : null;
 if (!ctx) return { canvas, widthPx, heightPx, cols: s.cabCols, rows: s.cabRows, activeCabinets: s.activeCabinets, transparent, cadFrame };

 ctx.save?.();
 ctx.clearRect?.(0, 0, widthPx, heightPx);
 if (!transparent) {
  ctx.fillStyle = '#0b101d';
  ctx.fillRect(0, 0, widthPx, heightPx);
 }

 // Draw cabinet grid (including mixed 500x1000 + 500x500 row heights)
 const voidSet = new Set(s.virtualTiles || []);
 const voidRects = [];
 const rowLayout = Array.isArray(s.rowLayout) && s.rowLayout.length === s.cabRows
  ? s.rowLayout
  : Array.from({ length: s.cabRows }, (_, r) => ({ row: r, pxW: s.pxW, pxH: s.pxH, heightMm: s.cabH }));
 const colW = widthPx / Math.max(1, s.cabCols);
 let yCursor = 0;
 for (let r = 0; r < s.cabRows; r++) {
  const rl = rowLayout[r];
  const rowH = Math.max(8, rl.pxH || Math.round(heightPx / Math.max(1, s.cabRows)));
  for (let c = 0; c < s.cabCols; c++) {
   const x0 = Math.round(c * colW);
   const cw = Math.round((c + 1) * colW) - x0;
   const isVoid = voidSet.has(c + ',' + r);
   if (isVoid && transparent) {
    voidRects.push([x0, yCursor, cw, rowH]);
    ctx.clearRect?.(x0, yCursor, cw, rowH);
    continue;
   }
   ctx.fillStyle = isVoid ? '#05070d' : ((c + r) % 2 === 0 ? '#131d33' : '#192642');
   ctx.fillRect(x0, yCursor, cw, rowH);
   ctx.strokeStyle = isVoid ? 'rgba(248,113,113,0.45)' : 'rgba(56,189,248,0.55)';
   ctx.lineWidth = 1;
   ctx.strokeRect(x0 + 0.5, yCursor + 0.5, Math.max(1, cw - 1), Math.max(1, rowH - 1));
   ctx.fillStyle = isVoid ? '#f87171' : '#93c5fd';
   ctx.font = 'bold ' + Math.max(11, Math.min(24, Math.floor(Math.min(cw, rowH) * 0.14))) + 'px monospace';
   ctx.textAlign = 'left';
   ctx.textBaseline = 'top';
   ctx.fillText('C' + (c + 1) + 'R' + (r + 1) + (isVoid ? ' VOID' : ''), x0 + 6, yCursor + 6);
  }
  yCursor += rowH;
 }

 // SMPTE Color Bars at bottom 8% (only when not transparent or no CAD footer overlap)
 if (!transparent) {
  const smpteColors = ['#e5e7eb', '#facc15', '#22d3ee', '#22c55e', '#e879f9', '#ef4444', '#3b82f6', '#111827'];
  const barH = Math.max(16, Math.round(heightPx * 0.08));
  const barY = heightPx - barH;
  const barW = widthPx / smpteColors.length;
  for (let i = 0; i < smpteColors.length; i++) {
   ctx.fillStyle = smpteColors[i];
   ctx.fillRect(Math.round(i * barW), barY, Math.ceil(barW), barH);
  }
 }

 // Outer 1px alignment border & full diagonals
 ctx.strokeStyle = '#facc15';
 ctx.lineWidth = 2;
 ctx.strokeRect(1, 1, Math.max(2, widthPx - 2), Math.max(2, heightPx - 2));
 ctx.beginPath();
 ctx.moveTo(0, 0);
 ctx.lineTo(widthPx, heightPx);
 ctx.moveTo(widthPx, 0);
 ctx.lineTo(0, heightPx);
 ctx.stroke();

 // Central 1:1 aspect-ratio verification circle
 const cx = Math.round(widthPx / 2);
 const cy = Math.round(heightPx / 2);
 const radius = Math.max(16, Math.round(Math.min(widthPx, heightPx) * 0.36));
 ctx.strokeStyle = '#38bdf8';
 ctx.lineWidth = 3;
 ctx.beginPath();
 ctx.arc(cx, cy, radius, 0, Math.PI * 2);
 ctx.stroke();

 // Central screen specification callout
 const bannerW = Math.min(widthPx - 16, Math.max(220, Math.round(widthPx * 0.42)));
 const bannerH = Math.min(heightPx - 16, Math.max(64, Math.round(heightPx * 0.16)));
 ctx.fillStyle = 'rgba(9,13,24,0.88)';
 ctx.fillRect(Math.round(cx - bannerW / 2), Math.round(cy - bannerH / 2), bannerW, bannerH);
 ctx.strokeStyle = '#38bdf8';
 ctx.lineWidth = 1.5;
 ctx.strokeRect(Math.round(cx - bannerW / 2), Math.round(cy - bannerH / 2), bannerW, bannerH);
 ctx.fillStyle = '#f8fafc';
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.font = 'bold ' + Math.max(12, Math.round(bannerH * 0.28)) + 'px monospace';
 ctx.fillText(String(s.name || s.id || 'LED SCREEN') + ' · ' + widthPx + 'x' + heightPx + ' px', cx, cy - Math.round(bannerH * 0.16));
 ctx.fillStyle = '#38bdf8';
 ctx.font = Math.max(11, Math.round(bannerH * 0.21)) + 'px monospace';
 ctx.fillText(s.cabCols + 'x' + s.cabRows + ' cab (' + s.activeCabinets + ' active) · ' + s.totalPhysicalWidthM + 'x' + s.totalPhysicalHeightM + ' m', cx, cy + Math.round(bannerH * 0.18));

 if (cadFrame) {
  const cadCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < cadCols.length; i++) {
   const gx = Math.round(((i + 0.5) / cadCols.length) * widthPx);
   ctx.fillText(cadCols[i], gx, 4);
   ctx.fillText(cadCols[i], gx, Math.max(4, heightPx - 18));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let j = 1; j <= 12; j++) {
   const gy = Math.round(((j - 0.5) / 12) * heightPx);
   ctx.fillText(String(j), 4, gy);
   ctx.fillText(String(j), Math.max(4, widthPx - 20), gy);
  }
  // Dual dimension callout (m + px) and CAD title block (cajetinMeta)
  const proj = String(cajetinMeta?.project || s.name || s.id || 'ALPHA LED STAGE');
  const client = String(cajetinMeta?.client || 'STAGE PRODUCTION');
  const author = String(cajetinMeta?.technician || cajetinMeta?.author || 'ALPHA LED Studio');
  const reviewer = String(cajetinMeta?.reviewer || 'Tech Lead');
  const ver = String(cajetinMeta?.version || '1.0');
  const tbW = Math.min(widthPx - 24, 380);
  const tbH = 72;
  const tbX = Math.max(12, widthPx - tbW - 12);
  const tbY = Math.max(12, heightPx - tbH - 12);
  ctx.fillStyle = 'rgba(8,11,18,0.92)';
  ctx.fillRect(tbX, tbY, tbW, tbH);
  ctx.strokeStyle = '#facc15';
  ctx.strokeRect(tbX, tbY, tbW, tbH);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`PROJECT: ${proj} | CLIENT: ${client}`, tbX + 8, tbY + 6);
  ctx.fillText(`CAD DIM: ${s.totalPhysicalWidthM}m x ${s.totalPhysicalHeightM}m (${widthPx}x${heightPx}px)`, tbX + 8, tbY + 26);
  ctx.fillText(`BY: ${author} | REV: ${reviewer} | V${ver}`, tbX + 8, tbY + 46);
 }
 // L3: guarantee every pixel in void tiles is alpha=0 after overlays/diagonals/banner
 if (transparent && voidRects.length) {
  for (const [vx, vy, vw, vh] of voidRects) {
   ctx.clearRect?.(vx, vy, vw, vh);
  }
 }
 ctx.restore?.();

 return {
  canvas,
  widthPx,
  heightPx,
  cols: s.cabCols,
  rows: s.cabRows,
  activeCabinets: s.activeCabinets,
  transparent,
  cadFrame,
  screenName: String(s.name || s.id || 'LED_SCREEN')
 };
}
function exportSurfaceCalibrationPng(surfaceOrId, opts = {}) {
 const tLoc = (vi, en) => (typeof window === 'undefined' ? vi : window.tr?.(vi, en) ?? vi);
 let s = surfaceOrId;
 if (typeof surfaceOrId === 'string' && typeof engine !== 'undefined' && Array.isArray(engine?.surfaces)) {
  s = engine.surfaces.find(x => x.id === surfaceOrId || x.name === surfaceOrId);
 }
 if (!s && typeof surface === 'function') s = surface();
 if (!s) {
  if (typeof toast === 'function') toast(tLoc('Chưa chọn màn LED để xuất Test Card.', 'Select an LED screen before exporting a Test Card.'), 4300, 'warn');
  return null;
 }
 const meta = renderSurfaceCalibrationTestCard(s, null, opts);
 if (typeof document !== 'undefined' && meta.canvas?.toDataURL) {
  const a = document.createElement('a');
  a.href = meta.canvas.toDataURL('image/png');
  const slug = String(s.name || s.id || 'screen').replace(/[^a-zA-Z0-9_-]+/g, '_');
  const suffix = opts.transparent ? '_pixelmap_trans.png' : '_testcard.png';
  a.download = slug + '_' + meta.widthPx + 'x' + meta.heightPx + suffix;
  document.body?.appendChild?.(a);
  a.click?.();
  document.body?.removeChild?.(a);
  if (typeof toast === 'function') toast(tLoc('Đã xuất Test Card 1:1 (' + meta.widthPx + 'x' + meta.heightPx + ' px) cho ' + (s.name || s.id), 'Exported 1:1 Test Card (' + meta.widthPx + 'x' + meta.heightPx + ' px) for ' + (s.name || s.id)));
 }
 return meta;
}
function toggleVirtualTile(s, col, row, forceVoid) {
 normalizeSurfaceHardware(s);
 const c = Math.floor(+col), r = Math.floor(+row);
 if (!Number.isFinite(c) || !Number.isFinite(r) || c < 0 || c >= s.cabCols || r < 0 || r >= s.cabRows) return false;
 const key = c + ',' + r;
 const set = new Set(s.virtualTiles);
 const wantVoid = typeof forceVoid === 'boolean' ? forceVoid : !set.has(key);
 if (wantVoid) {
  if (!set.has(key)) {
   if (set.size + 1 >= s.totalCabinetGrid) return false;
   set.add(key);
  }
 } else {
  set.delete(key);
 }
 s.virtualTiles = [...set].sort((a, b) => {
  const [ac, ar] = a.split(',').map(Number);
  const [bc, br] = b.split(',').map(Number);
  return ar - br || ac - bc;
 });
 s.activeCabinets = Math.max(1, s.totalCabinetGrid - s.virtualTiles.length);
 if (typeof rebuildSurface3DMesh === 'function') rebuildSurface3DMesh(s);
 return set.has(key);
}
function setColumnCurvatureAngle(s, colIndex, angleDeg) {
 normalizeSurfaceHardware(s);
 const c = Math.floor(+colIndex);
 const deg = clamp(+(angleDeg || 0), -30, 30);
 if (c === -1 || colIndex === 'all') {
  s.panelAngleDeg = deg;
  s.columnAnglesDeg = Array.from({ length: s.cabCols || 1 }, () => deg);
 } else if (Number.isFinite(c) && c >= 0 && c < s.cabCols) {
  if (!Array.isArray(s.columnAnglesDeg) || s.columnAnglesDeg.length !== s.cabCols) {
   s.columnAnglesDeg = Array.from({ length: s.cabCols || 1 }, () => s.panelAngleDeg || 0);
  } else s.columnAnglesDeg = s.columnAnglesDeg.slice();
  s.columnAnglesDeg[c] = deg;
 }
 const span = computeCurvedSpanMeters(s);
 if (typeof rebuildSurface3DMesh === 'function') rebuildSurface3DMesh(s);
 return span;
}
function computeCurvedSpanMeters(surfaceOrCols, cabWmmArg, panelAngleDegArg) {
 let cols = 1, cabWmm = 500, angles = [0];
 if (surfaceOrCols && typeof surfaceOrCols === 'object') {
  normalizeSurfaceHardware(surfaceOrCols);
  cols = surfaceOrCols.cabCols;
  cabWmm = surfaceOrCols.cabinetSpec?.cabWmm || surfaceOrCols.cabW || 500;
  angles = Array.isArray(surfaceOrCols.columnAnglesDeg) && surfaceOrCols.columnAnglesDeg.length === cols
   ? surfaceOrCols.columnAnglesDeg
   : Array.from({ length: cols }, () => clamp(+(surfaceOrCols.panelAngleDeg || 0), -30, 30));
 } else {
  cols = Math.max(1, Math.round(+surfaceOrCols || 1));
  cabWmm = Math.max(100, +cabWmmArg || 500);
  const deg = clamp(+(panelAngleDegArg || 0), -30, 30);
  angles = Array.from({ length: cols }, () => deg);
 }
 const w = Math.max(0.1, cabWmm / 1000);
 const arcWidthM = +(cols * w).toFixed(3);
 const columnCoords = [];
 let x = 0, z = 0, cumDeg = 0;
 let minZ = 0, maxZ = 0;
 const uniformDeg = angles.length > 0 && angles.every(a => Math.abs(a - angles[0]) < 1e-6) ? Math.abs(angles[0]) : null;
 for (let col = 0; col < cols; col++) {
  const angleDeg = clamp(+angles[col] || 0, -30, 30);
  cumDeg += angleDeg;
  const rad = (cumDeg * Math.PI) / 180;
  const x0 = +x.toFixed(4), z0 = +z.toFixed(4);
  const x1 = +(x + w * Math.cos(rad)).toFixed(4);
  const z1 = +(z + w * Math.sin(rad)).toFixed(4);
  columnCoords.push({ col, x0, z0, x1, z1, angleDeg });
  x = x1; z = z1;
  if (z < minZ) minZ = z;
  if (z > maxZ) maxZ = z;
 }
 let chordWidthM = +Math.hypot(x, z).toFixed(3);
 let depthOffsetM = +(maxZ - minZ).toFixed(3);
 if (uniformDeg !== null) {
  if (uniformDeg < 0.05 || cols <= 1) {
   chordWidthM = arcWidthM;
   depthOffsetM = 0;
  } else {
   const theta = (uniformDeg * Math.PI) / 180;
   const totalTheta = cols * theta;
   const radius = w / (2 * Math.sin(theta / 2));
   chordWidthM = +(2 * radius * Math.sin(totalTheta / 2)).toFixed(3);
   depthOffsetM = +(radius * (1 - Math.cos(totalTheta / 2))).toFixed(3);
  }
 }
 return {
  chordWidthM,
  arcWidthM,
  depthOffsetM,
  columnCoords,
  arcMeters: arcWidthM,
  chordMeters: chordWidthM,
  depthMeters: depthOffsetM
 };
}
function rebuildSurface3DMesh(s) {
 if (!s || typeof s !== 'object') return null;
 // B4 / M2 scope guard: do not rebuild face-bound imported surfaces or quad-picked surfaces without explicit 3D pos
 if (s._ledBinding || s.mesh?._ledBinding || s._quadPicked || s.mesh?._quadPicked || !Array.isArray(s.pos) || s.pos.length !== 3) {
  return s.mesh || null;
 }
 normalizeSurfaceHardware(s);
 if (typeof makeMesh !== 'function') return s.mesh || null;
 const cols = Math.max(1, s.cabCols || 1);
 const rows = Math.max(1, s.cabRows || 1);
 const wM = Math.max(0.25, +(s.totalPhysicalWidthM || s.physical?.[0] || cols * ((s.cabW || 500) / 1000)));
 const hM = Math.max(0.25, +(s.totalPhysicalHeightM || s.physical?.[1] || rows * ((s.cabH || 500) / 1000)));
 const shapeType = String(s.shapeType || 'flat').toLowerCase();

 // S6: follow rowLayout heights from top (v=0, y=+hM/2) to bottom (v=1, y=-hM/2)
 const rl = Array.isArray(s.rowLayout) && s.rowLayout.length === rows
  ? s.rowLayout
  : Array.from({ length: rows }, (_, r) => ({ row: r, heightMm: s.cabH || 500 }));
 const totalHmm = Math.max(1, rl.reduce((acc, r) => acc + (Number(r.heightMm) || 500), 0));
 const rowBounds = [];
 let vAcc = 0;
 for (let r = 0; r < rows; r++) {
  const frac = (Number(rl[r]?.heightMm) || 500) / totalHmm;
  const v0 = vAcc;
  const v1 = Math.min(1, vAcc + frac);
  const yTop = hM / 2 - v0 * hM;
  const yBot = hM / 2 - v1 * hM;
  rowBounds.push({ v0, v1, yTop, yBot });
  vAcc = v1;
 }

 // Compute per-column (x0, z0, x1, z1) in local space, recentered on midpoint
 const colSegs = [];
 if (shapeType === 'cylinder_360') {
  const rad = Math.max(0.4, wM / (Math.PI * 2));
  for (let c = 0; c < cols; c++) {
   const a0 = (c / cols) * Math.PI * 2;
   const a1 = ((c + 1) / cols) * Math.PI * 2;
   colSegs.push({
    x0: Math.sin(a0) * rad, z0: Math.cos(a0) * rad,
    x1: Math.sin(a1) * rad, z1: Math.cos(a1) * rad
   });
  }
 } else if (shapeType === 'cube') {
  const side = Math.max(0.5, wM / 4);
  const r = side / 2;
  const corners = [[-r, r, r, r], [r, r, r, -r], [r, -r, -r, -r], [-r, -r, -r, r]];
  for (let c = 0; c < cols; c++) {
   const faceIdx = Math.min(3, Math.floor((c / cols) * 4));
   const faceCols = Math.max(1, cols / 4);
   const t0 = (c - faceIdx * faceCols) / faceCols;
   const t1 = (c + 1 - faceIdx * faceCols) / faceCols;
   const [fx0, fz0, fx1, fz1] = corners[faceIdx];
   colSegs.push({
    x0: fx0 + (fx1 - fx0) * t0, z0: fz0 + (fz1 - fz0) * t0,
    x1: fx0 + (fx1 - fx0) * t1, z1: fz0 + (fz1 - fz0) * t1
   });
  }
 } else if (shapeType === 'l_corner_90') {
  const splitCol = clamp(Math.round(+(s.cornerSplitCol || Math.floor(cols / 2))), 1, Math.max(1, cols - 1));
  const cabWM = wM / cols;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const raw = [];
  for (let c = 0; c < cols; c++) {
   let x0, z0, x1, z1;
   if (c < splitCol) {
    x0 = c * cabWM; z0 = 0; x1 = (c + 1) * cabWM; z1 = 0;
   } else {
    const k = c - splitCol;
    x0 = splitCol * cabWM; z0 = k * cabWM; x1 = splitCol * cabWM; z1 = (k + 1) * cabWM;
   }
   raw.push({ x0, z0, x1, z1 });
   minX = Math.min(minX, x0, x1); maxX = Math.max(maxX, x0, x1);
   minZ = Math.min(minZ, z0, z1); maxZ = Math.max(maxZ, z0, z1);
  }
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  for (const seg of raw) {
   colSegs.push({ x0: seg.x0 - cx, z0: seg.z0 - cz, x1: seg.x1 - cx, z1: seg.z1 - cz });
  }
 } else {
  const span = computeCurvedSpanMeters(s);
  const coords = span.columnCoords || [];
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const cc of coords) {
   minX = Math.min(minX, cc.x0, cc.x1); maxX = Math.max(maxX, cc.x0, cc.x1);
   minZ = Math.min(minZ, -cc.z0, -cc.z1); maxZ = Math.max(maxZ, -cc.z0, -cc.z1);
  }
  const cx = Number.isFinite(minX) ? (minX + maxX) / 2 : 0;
  const cz = Number.isFinite(minZ) ? (minZ + maxZ) / 2 : 0;
  for (let c = 0; c < cols; c++) {
   const cc = coords[c] || { x0: (c / cols - 0.5) * wM, z0: 0, x1: ((c + 1) / cols - 0.5) * wM, z1: 0 };
   colSegs.push({
    x0: cc.x0 - cx, z0: -cc.z0 - cz,
    x1: cc.x1 - cx, z1: -cc.z1 - cz
   });
  }
 }

 const voidSet = new Set(Array.isArray(s.virtualTiles) ? s.virtualTiles : []);
 const p = [];
 const uv = [];
 const emitCell = (c, r) => {
  const seg = colSegs[c];
  const rb = rowBounds[r];
  const u0 = c / cols, u1 = (c + 1) / cols;
  p.push(
   seg.x0, rb.yTop, seg.z0, seg.x1, rb.yTop, seg.z1, seg.x1, rb.yBot, seg.z1,
   seg.x0, rb.yTop, seg.z0, seg.x1, rb.yBot, seg.z1, seg.x0, rb.yBot, seg.z0
  );
  uv.push(
   u0, rb.v0, u1, rb.v0, u1, rb.v1,
   u0, rb.v0, u1, rb.v1, u0, rb.v1
  );
 };
 for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
   if (voidSet.has(c + ',' + r)) continue;
   emitCell(c, r);
  }
 }
 // S7 empty-mesh fallback: never emit Float32Array(0) if all tiles were marked void
 if (p.length === 0) emitCell(0, 0);

 const oldSurfMesh = s.mesh;
 const baseColor = oldSurfMesh?.color || [0.04, 0.05, 0.08, 1];
 const newMesh = makeMesh(s.name || 'LED_SURFACE', p, uv, null, { color: baseColor });
 const targetPos = Array.isArray(s.pos) && s.pos.length === 3
  ? s.pos
  : (Array.isArray(oldSurfMesh?.bounds?.center) ? oldSurfMesh.bounds.center : [0, 0, 0]);
 const yawRad = ((+(s.yawDeg || 0)) * Math.PI) / 180;
 if (typeof M !== 'undefined' && typeof transformMesh === 'function') {
  const mat = M.mm(M.translate(targetPos), M.rotate([0, 1, 0], yawRad));
  transformMesh(newMesh, mat);
 }
 if (oldSurfMesh && typeof oldSurfMesh === 'object') {
  for (const k of Object.keys(oldSurfMesh)) {
   if (k !== 'id' && k !== 'p' && k !== 'pos' && k !== 'uv' && k !== 'n' && k !== 'bounds' && k !== 'vao' && k !== 'vbo' && k !== 'ibo') {
    newMesh[k] = oldSurfMesh[k];
   }
  }
  if (Array.isArray(oldSurfMesh.preferredUp)) newMesh.preferredUp = oldSurfMesh.preferredUp.slice();
 }
 if (s._lmpBatchId18) newMesh._lmpBatchId18 = s._lmpBatchId18;
 newMesh._surfaceId18 = s.id;

 const eng = typeof engine !== 'undefined' ? engine : null;
 if (eng) {
  if (s.mappingSpace === 'stage' && typeof calculateMapUV === 'function' && eng.layout?.bounds && eng.layout?.padding) {
   newMesh.mapUV = calculateMapUV({ ...s, mesh: newMesh }, eng.layout, eng.master);
  } else if (oldSurfMesh?.mapUV && oldSurfMesh.mapUV.length === newMesh.uv.length) {
   newMesh.mapUV = new Float32Array(oldSurfMesh.mapUV);
  } else {
   delete newMesh.mapUV;
  }
  if (oldSurfMesh) eng.releaseMesh?.(oldSurfMesh);
  s.mesh = newMesh;
  // B4 / M1 / M2: also update matching stage shell mesh in engine.stage while preserving all metadata tags
  if (Array.isArray(eng.stage)) {
   for (let i = 0; i < eng.stage.length; i++) {
    const m = eng.stage[i];
    if (!m) continue;
    const isMatchedShell =
     m._surfaceId18 === s.id ||
     (s.sourceMeshId && m.id === s.sourceMeshId) ||
     (s._lmpBatchId18 && m._lmpBatchId18 === s._lmpBatchId18 && m.name === s.name);
    if (isMatchedShell) {
     eng.releaseMesh?.(m);
     const stageCopy = makeMesh(s.name || m.name, new Float32Array(newMesh.p), new Float32Array(newMesh.uv), null, {
      color: m.color || baseColor
     });
     for (const k of Object.keys(m)) {
      if (k !== 'p' && k !== 'pos' && k !== 'uv' && k !== 'n' && k !== 'bounds' && k !== 'vao' && k !== 'vbo' && k !== 'ibo') {
       stageCopy[k] = m[k];
      }
     }
     if (s._lmpBatchId18) stageCopy._lmpBatchId18 = s._lmpBatchId18;
     stageCopy._surfaceId18 = s.id;
     eng.stage[i] = stageCopy;
    }
   }
  }
  eng._stageBatchDirty = true;
 } else {
  s.mesh = newMesh;
 }
 return s.mesh;
}

function applyCurvatureSections(s, sections = [], opts = {}) {
 if (!s || typeof s !== 'object') return null;
 normalizeSurfaceHardware(s);
 const cols = Math.max(1, s.cabCols || 1);
 const baseAngles = Array.isArray(s.columnAnglesDeg) && s.columnAnglesDeg.length === cols
  ? s.columnAnglesDeg.slice()
  : Array.from({ length: cols }, () => clamp(+(s.panelAngleDeg || 0), -30, 30));
 const allowedModes = new Set(['locked_flat', 'concave', 'convex', 's_wave', 'corner_90']);
 const normalizedSections = [];
 const rawList = Array.isArray(sections) ? sections : [];
 let cursor = 0;
 for (let i = 0; i < rawList.length; i++) {
  const sec = rawList[i];
  if (!sec || typeof sec !== 'object') continue;
  let rawStart, rawEnd;
  if (sec.startCol !== undefined || sec.endCol !== undefined) {
   rawStart = Math.floor(+(sec.startCol ?? cursor));
   rawEnd = Math.floor(+(sec.endCol ?? cols));
  } else if (sec.cols !== undefined) {
   const spanC = Math.max(1, Math.floor(+sec.cols || 1));
   rawStart = cursor;
   rawEnd = cursor + spanC;
  } else {
   rawStart = cursor;
   rawEnd = cols;
  }
  // L1: clamp non-overlapping ranges and skip collapsed sections
  const startCol = clamp(Math.max(cursor, rawStart), 0, cols);
  const endCol = clamp(rawEnd, startCol, cols);
  if (startCol >= endCol) continue;
  cursor = endCol;
  const rawDeg = clamp(+(sec.angleDeg ?? 0), -30, 30);
  const rawMode = String(sec.mode || '').toLowerCase();
  const inferredMode = rawDeg < 0 ? 'concave' : (rawDeg > 0 ? 'convex' : 'locked_flat');
  const mode = allowedModes.has(rawMode) ? rawMode : inferredMode;
  const id = String(sec.id || String.fromCharCode(65 + (normalizedSections.length % 26)));
  const label = String(sec.label || ('Section ' + id));
  normalizedSections.push({ id, label, startCol, endCol, mode, angleDeg: mode === 'locked_flat' ? 0 : rawDeg });
  const spanCols = Math.max(1, endCol - startCol);
  for (let c = startCol; c < endCol; c++) {
   if (mode === 'locked_flat') {
    baseAngles[c] = 0;
   } else if (mode === 'concave') {
    baseAngles[c] = rawDeg <= 0 ? rawDeg : -Math.abs(rawDeg);
   } else if (mode === 'convex') {
    baseAngles[c] = rawDeg >= 0 ? rawDeg : Math.abs(rawDeg);
   } else if (mode === 's_wave') {
    const rel = c - startCol;
    const mag = Math.abs(rawDeg) || 10;
    baseAngles[c] = rel < spanCols / 2 ? mag : -mag;
   } else if (mode === 'corner_90') {
    const mid = startCol + Math.floor(spanCols / 2);
    baseAngles[c] = c === mid ? clamp(rawDeg || 30, -30, 30) : 0;
   }
  }
 }
 if (opts.liveSymmetry) {
  const half = Math.floor(cols / 2);
  for (let c = 0; c < half; c++) {
   baseAngles[cols - 1 - c] = baseAngles[c];
  }
 }
 s.curvatureSections = normalizedSections.map(sec => ({ ...sec }));
 s.columnAnglesDeg = baseAngles.slice();
 const span = computeCurvedSpanMeters(s);
 rebuildSurface3DMesh(s);
 return { sections: s.curvatureSections, columnAnglesDeg: s.columnAnglesDeg, span };
}

function renderCurvatureSectionsSvg(s) {
 if (!s || typeof s !== 'object') return '';
 normalizeSurfaceHardware(s);
 const span = computeCurvedSpanMeters(s);
 const coords = span.columnCoords || [];
 const sections = Array.isArray(s.curvatureSections) && s.curvatureSections.length
  ? s.curvatureSections
  : [{ id: 'A', label: 'Section A', startCol: 0, endCol: s.cabCols || 1, mode: 'flat', angleDeg: +(s.panelAngleDeg || 0) }];
 let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
 for (const cc of coords) {
  minX = Math.min(minX, cc.x0, cc.x1); maxX = Math.max(maxX, cc.x0, cc.x1);
  minZ = Math.min(minZ, cc.z0, cc.z1); maxZ = Math.max(maxZ, cc.z0, cc.z1);
 }
 const wSpan = Math.max(0.5, maxX - minX);
 const zSpan = Math.max(0.4, maxZ - minZ);
 const scale = Math.min(260 / wSpan, 64 / zSpan);
 const ox = 180 - ((minX + maxX) / 2) * scale;
 const oy = 56 - ((minZ + maxZ) / 2) * scale;
 const linesSvg = coords.map((cc) => {
  const x0 = +(ox + cc.x0 * scale).toFixed(1);
  const y0 = +(oy + cc.z0 * scale).toFixed(1);
  const x1 = +(ox + cc.x1 * scale).toFixed(1);
  const y1 = +(oy + cc.z1 * scale).toFixed(1);
  const color = Math.abs(cc.angleDeg) < 0.05 ? '#38bdf8' : (cc.angleDeg < 0 ? '#a855f7' : '#22c55e');
  return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
 }).join('');
 const badgesSvg = sections.map((sec, i) => {
  const bx = 16 + i * 112;
  return `<g transform="translate(${bx},96)"><rect x="0" y="0" width="104" height="22" rx="4" fill="#111827" stroke="#38bdf8" stroke-width="1"/><text x="52" y="15" text-anchor="middle" fill="#e2e8f0" font-size="10" font-family="monospace">${esc(sec.id)}: ${esc(sec.label)} (${Number(sec.angleDeg || 0)}°)</text></g>`;
 }).join('');
 return `<svg class="curvature-topview-svg" viewBox="0 0 360 144" width="100%" height="144" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="360" height="144" rx="6" fill="#090d16"/><text x="180" y="16" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="monospace">${esc(s.name || 'LED')} · Arc ${span.arcWidthM}m · Space ${span.chordWidthM}×${span.depthOffsetM}m</text>${linesSvg}${badgesSvg}<text x="180" y="136" text-anchor="middle" fill="#facc15" font-size="10" font-weight="bold" font-family="monospace">▼ TOWARDS AUDIENCE ▼</text></svg>`;
}

function copyPasteSurfaceCurvature(sourceSurface, targetSurface) {
 if (!sourceSurface || !targetSurface) return null;
 normalizeSurfaceHardware(sourceSurface);
 normalizeSurfaceHardware(targetSurface);
 const srcCols = Math.max(1, sourceSurface.cabCols || 1);
 const dstCols = Math.max(1, targetSurface.cabCols || 1);
 const srcAngles = Array.isArray(sourceSurface.columnAnglesDeg) && sourceSurface.columnAnglesDeg.length === srcCols
  ? sourceSurface.columnAnglesDeg
  : Array.from({ length: srcCols }, () => clamp(+(sourceSurface.panelAngleDeg || 0), -30, 30));
 const nextAngles = [];
 for (let c = 0; c < dstCols; c++) {
  const srcIdx = Math.min(srcCols - 1, Math.floor((c / dstCols) * srcCols));
  nextAngles.push(clamp(+(srcAngles[srcIdx] || 0), -30, 30));
 }
 targetSurface.columnAnglesDeg = nextAngles;
 targetSurface.panelAngleDeg = clamp(+(sourceSurface.panelAngleDeg || 0), -30, 30);
 if (Array.isArray(sourceSurface.curvatureSections) && sourceSurface.curvatureSections.length) {
  let cursor = 0;
  const remapped = [];
  for (const sec of sourceSurface.curvatureSections) {
   const startCol = clamp(Math.max(cursor, Math.round((sec.startCol / srcCols) * dstCols)), 0, dstCols);
   const endCol = clamp(Math.max(startCol, Math.round((sec.endCol / srcCols) * dstCols)), startCol, dstCols);
   if (startCol < endCol) {
    remapped.push({ ...sec, startCol, endCol });
    cursor = endCol;
   }
  }
  targetSurface.curvatureSections = remapped;
 }
 rebuildSurface3DMesh(targetSurface);
 return targetSurface.columnAnglesDeg.slice();
}

function mirrorWingSurface3D(sourceSurface, partnerOrOpts = null, maybeOpts = {}) {
 if (!sourceSurface || typeof sourceSurface !== 'object') return null;
 normalizeSurfaceHardware(sourceSurface);
 const isPartnerSurf = partnerOrOpts && typeof partnerOrOpts === 'object' && ('cabCols' in partnerOrOpts || 'mesh' in partnerOrOpts || 'w' in partnerOrOpts);
 const explicitPartner = isPartnerSurf ? partnerOrOpts : null;
 const eng = typeof engine !== 'undefined' ? engine : null;
 const srcPos = Array.isArray(sourceSurface.pos) && sourceSurface.pos.length === 3
  ? sourceSurface.pos
  : (Array.isArray(sourceSurface.mesh?.bounds?.center) ? sourceSurface.mesh.bounds.center : [-4, 2.5, -1.5]);
 const px = Number.isFinite(+srcPos[0]) ? -(+srcPos[0]) : 0;
 const py = Number.isFinite(+srcPos[1]) ? +srcPos[1] : 2.5;
 const pz = Number.isFinite(+srcPos[2]) ? +srcPos[2] : -1.5;
 const mirrorPos = [px === 0 ? 0 : px, py, pz];
 const mirrorYaw = -(+(sourceSurface.yawDeg || 0));
 const srcAngles = Array.isArray(sourceSurface.columnAnglesDeg) && sourceSurface.columnAnglesDeg.length === sourceSurface.cabCols
  ? sourceSurface.columnAnglesDeg
  : Array.from({ length: sourceSurface.cabCols || 1 }, () => +(sourceSurface.panelAngleDeg || 0));
 const mirrorAngles = srcAngles.slice().reverse().map((a) => {
  const v = clamp(-(+a || 0), -30, 30);
  return v === 0 ? 0 : v;
 });
 const rawName = String(sourceSurface.name || 'LED_WING');
 const mirrorName = /_L$/i.test(rawName)
  ? rawName.replace(/_L$/i, m => (m === '_l' ? '_r' : '_R'))
  : (/_R$/i.test(rawName)
   ? rawName.replace(/_R$/i, m => (m === '_r' ? '_l' : '_L'))
   : (rawName.includes('_L_')
    ? rawName.replace(/_L_(?!.*_L_)/, '_R_')
    : (rawName.includes('_R_')
     ? rawName.replace(/_R_(?!.*_R_)/, '_L_')
     : rawName + '_MIRROR')));

 let target = explicitPartner || eng?.surfaces?.find((x) => x.id !== sourceSurface.id && x.name === mirrorName) || null;
 if (!target && typeof createSurface === 'function') {
  const baseMesh = typeof quadMesh === 'function'
   ? quadMesh(mirrorName, [[-1, 1, 0], [1, 1, 0], [1, -1, 0], [-1, -1, 0]], { color: [0.04, 0.05, 0.08, 1] })
   : makeMesh(mirrorName, [-1, 1, 0, 1, 1, 0, 1, -1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0], [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);
  if (Array.isArray(eng?.stage)) eng.stage.push(baseMesh);
  target = createSurface(baseMesh, mirrorName, {
   x: sourceSurface.x ?? 0,
   y: sourceSurface.y ?? 0,
   w: sourceSurface.w ?? 1920,
   h: sourceSurface.h ?? 1080,
   cabinetModelId: sourceSurface.cabinetModelId,
   processorModelId: sourceSurface.processorModelId,
   cabCols: sourceSurface.cabCols,
   cabRows: sourceSurface.cabRows,
   shapeType: sourceSurface.shapeType || 'flat',
   pos: mirrorPos,
   yawDeg: mirrorYaw,
   physical: sourceSurface.physical ? sourceSurface.physical.slice() : [sourceSurface.totalPhysicalWidthM || 2, sourceSurface.totalPhysicalHeightM || 2]
  });
  if (target && baseMesh) baseMesh._surfaceId18 = target.id;
 }
 if (!target) return null;
 target.pos = mirrorPos.slice();
 target.yawDeg = mirrorYaw === 0 ? 0 : mirrorYaw;
 target.cabCols = sourceSurface.cabCols;
 target.cabRows = sourceSurface.cabRows;
 target.physical = sourceSurface.physical ? sourceSurface.physical.slice() : [sourceSurface.totalPhysicalWidthM || 2, sourceSurface.totalPhysicalHeightM || 2];
 target.physicalWidthM = target.physical[0];
 target.physicalHeightM = target.physical[1];
 target.columnAnglesDeg = mirrorAngles;
 const negPanel = -(+(sourceSurface.panelAngleDeg || 0));
 target.panelAngleDeg = negPanel === 0 ? 0 : negPanel;
 if (Array.isArray(sourceSurface.virtualTiles)) {
  const cols = Math.max(1, sourceSurface.cabCols || 1);
  target.virtualTiles = sourceSurface.virtualTiles.map((vt) => {
   const [c, r] = String(vt).split(',').map(Number);
   return (cols - 1 - c) + ',' + r;
  });
 }
 rebuildSurface3DMesh(target);
 return target;
}
globalThis.rebuildSurface3DMesh = rebuildSurface3DMesh;
globalThis.applyCurvatureSections = applyCurvatureSections;
globalThis.renderCurvatureSectionsSvg = renderCurvatureSectionsSvg;
globalThis.copyPasteSurfaceCurvature = copyPasteSurfaceCurvature;
globalThis.mirrorWingSurface3D = mirrorWingSurface3D;
globalThis.renderSurfaceCalibrationTestCard = renderSurfaceCalibrationTestCard;
globalThis.exportSurfaceCalibrationPng = exportSurfaceCalibrationPng;
globalThis.toggleVirtualTile = toggleVirtualTile;
globalThis.setColumnCurvatureAngle = setColumnCurvatureAngle;
globalThis.computeCurvedSpanMeters = computeCurvedSpanMeters;
globalThis.normalizeSurfaceHardware = normalizeSurfaceHardware;
globalThis.computeGeometricScreenLayout = computeGeometricScreenLayout;
createSurface=function(mesh,name,options={}){const source=mesh._ledBinding?engine.stage.find(m=>m.id===mesh._ledBinding.sourceMeshId):engine.stage.find(m=>m===mesh);if(source?.worldAxes)mesh.preferredUp=source.worldAxes[1];const info=measureFace(mesh),s=V031.createSurface(mesh,name,{w:clamp(Math.round(info.width*128),8,8192),h:clamp(Math.round(info.height*128),8,8192),...options});s.mesh.preferredUp=mesh.preferredUp?vecCopy(mesh.preferredUp):[0,1,0];s.mappingSpace=options.mappingSpace||'local';s.nativeResolution=options.nativeResolution||{width:s.w,height:s.h,confirmed:false};s.aspectLock=options.aspectLock??true;s.metricFrame={right:info.right,up:info.up,normal:info.normal,origin:info.origin};s.physical=[info.width,info.height];normalizeSurfaceHardware(s);return s;};

/* Shared stage-space content UVs. Pixel crop and physical geometry are separate. */
function layoutReference(){const r=engine.layout?.reference;return r&&finiteArray(r.right,3)&&finiteArray(r.up,3)?r:defaultLayout().reference;}
function projectedBounds(list=engine.surfaces){const r=layoutReference();let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const s of list)for(let i=0;i<s.mesh.p.length;i+=3){const q=M.sub([s.mesh.p[i],s.mesh.p[i+1],s.mesh.p[i+2]],r.origin),x=M.dot(q,r.right),y=M.dot(q,r.up);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}return {minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY};}
function calculateMapUV(s,layout=engine.layout,master=engine.master){const out=new Float32Array(s.mesh.p.length/3*2),r=layout.reference,b=layout.bounds;for(let i=0,k=0;i<s.mesh.p.length;i+=3,k+=2){const q=M.sub([s.mesh.p[i],s.mesh.p[i+1],s.mesh.p[i+2]],r.origin);out[k]=(layout.padding[0]+(M.dot(q,r.right)-b.minX)*layout.pixelsPerMeter)/master.width;out[k+1]=(layout.padding[1]+(b.maxY-M.dot(q,r.up))*layout.pixelsPerMeter)/master.height;}return out;}
function rebuildSpatialMap({width=engine.master.width,height=engine.master.height,activate=false,record=true}={}){
 if(!engine.surfaces.length)return null;
 width=clamp(Math.round(+width)||3840,64,16384);height=clamp(Math.round(+height)||1080,64,16384);engine.layout ||= defaultLayout();
 // With no established content layout, use the largest visible LED plane as
 // the stage facade. Do not guess it from a camera perspective or global AABB.
 if(activate&&engine.layout.mode!=='spatial'&&!engine.layout.reference?.explicit){
  const main=[...engine.surfaces].sort((a,b)=>(b.physical?.[0]||0)*(b.physical?.[1]||0)-(a.physical?.[0]||0)*(a.physical?.[1]||0))[0];
  if(main){let n=main.bindingNormal||measureFace(main.mesh).normal;const toward=M.sub(cameraEyeNow(),main.mesh.bounds.center);if(M.dot(n,toward)<0)n=M.mul(n,-1);let up=main.mesh.preferredUp||[0,1,0];up=M.sub(up,M.mul(n,M.dot(up,n)));if(Math.hypot(...up)<1e-6)up=[0,0,-1];up=M.norm(up);const right=M.norm(M.cross(up,n));up=M.norm(M.cross(n,right));engine.layout.reference={origin:[...main.mesh.bounds.center],right,up,normal:[...n],autoReferenceSource:main.sourceKey||main.id};}
 }
 const b=projectedBounds();
 if(!Number.isFinite(b.width)||b.width<1e-5||b.height<1e-5)throw Error((typeof window==='undefined'?"Mặt chuẩn có chiều rộng/cao bằng 0. Chọn mặt LED phía trước làm mặt mapping.":window.tr?.("Mặt chuẩn có chiều rộng/cao bằng 0. Chọn mặt LED phía trước làm mặt mapping.","The reference plane sees zero width/height. Pick a front LED face as the mapping plane.")??"Mặt chuẩn có chiều rộng/cao bằng 0. Chọn mặt LED phía trước làm mặt mapping."));
 if(record)checkpoint();const ppm=Math.min(width/b.width,height/b.height),padding=[(width-b.width*ppm)/2,(height-b.height*ppm)/2];engine.master={width,height};engine.layout={...engine.layout,mode:'spatial',reference:layoutReference(),bounds:b,pixelsPerMeter:ppm,padding,revision:(engine.layout.revision||0)+1,fit:'contain'};
 for(const s of engine.surfaces){if(activate)s.mappingSpace='stage';if(s.mappingSpace!=='stage')continue;engine.releaseMesh(s.mesh);s.mesh.mapUV=calculateMapUV(s);let minU=Infinity,maxU=-Infinity,minV=Infinity,maxV=-Infinity;for(let i=0;i<s.mesh.mapUV.length;i+=2){minU=Math.min(minU,s.mesh.mapUV[i]);maxU=Math.max(maxU,s.mesh.mapUV[i]);minV=Math.min(minV,s.mesh.mapUV[i+1]);maxV=Math.max(maxV,s.mesh.mapUV[i+1]);}s.x=Math.max(0,Math.floor(minU*width+1e-4));s.y=Math.max(0,Math.floor(minV*height+1e-4));s.w=Math.max(1,Math.ceil(maxU*width-1e-4)-s.x);s.h=Math.max(1,Math.ceil(maxV*height-1e-4)-s.y);s.projectedRect=[minU*width,minV*height,(maxU-minU)*width,(maxV-minV)*height];const a=engine.media.get(s.source);if(a){s.crop=[Math.round(minU*a.width),Math.round(minV*a.height),Math.max(1,Math.round((maxU-minU)*a.width)),Math.max(1,Math.round((maxV-minV)*a.height))];clampCrop(s,a);}updateTest(s);}
 resetFlatCache();renderUI();return engine.layout;
}
StageEngine.prototype.flatSurfaceMesh=function(s,solo){const spatial=s.mappingSpace==='stage'&&s.mesh.mapUV,key=[s.mesh.id,solo,s.mappingSpace,s.x,s.y,s.w,s.h,this.layout?.revision||0].join(':');let old=this.flatCache.get(s.id);if(old?.key===key)return old.mesh;if(old)this.releaseMesh(old.mesh);let mesh;if(spatial){const p=new Float32Array(s.mesh.p.length);for(let i=0,k=0;i<p.length;i+=3,k+=2){p[i]=solo?s.mesh.uv[k]*s.w:s.mesh.mapUV[k]*this.master.width;p[i+1]=solo?s.mesh.uv[k+1]*s.h:s.mesh.mapUV[k+1]*this.master.height;p[i+2]=0;}mesh=makeMesh('Spatial flat LED',p,s.mesh.uv);mesh.mapUV=s.mesh.mapUV;}else{const x=solo?0:s.x,y=solo?0:s.y;mesh=quadMesh('flat',[[x,y,0],[x+s.w,y,0],[x+s.w,y+s.h,0],[x,y+s.h,0]]);}this.flatCache.set(s.id,{key,mesh});return mesh;};
function activateSpatialLayout(){if(!engine.surfaces.length){toast((typeof window==='undefined'?"Chưa có LED. Hãy chọn mặt LED trước.":window.tr?.("Chưa có LED. Hãy chọn mặt LED trước.","No LEDs. Select an LED face first.")??"Chưa có LED. Hãy chọn mặt LED trước."));return;}const a=engine.media.get(surface()?.source);rebuildSpatialMap({width:a?.width||engine.master.width,height:a?.height||engine.master.height,activate:true});engine.view='stage';engine.globalTest=!a;state.step='mapping';renderUI();toast((typeof window==='undefined'?"Map theo mặt đứng: giữ tỷ lệ, khoảng hở và góc nghiêng. Không đổi hình học model.":window.tr?.("Map theo mặt đứng: giữ tỷ lệ, khoảng hở và góc nghiêng. Không đổi hình học model.","Facade mapping preserves scale, gaps and angles. Model geometry unchanged.")??"Map theo mặt đứng: giữ tỷ lệ, khoảng hở và góc nghiêng. Không đổi hình học model."),7500);}
autoMapCreated=function(){return rebuildSpatialMap({activate:true,record:false});};
autoDetect=function(){busy(true,(typeof window==='undefined'?"Đang phân tích mặt LED...":window.tr?.("Đang phân tích mặt LED...","Analyzing LED faces...")??"Đang phân tích mặt LED..."));setTimeout(()=>{try{const arr=detectLEDCandidates();busy(false);if(!arr.length){toast((typeof window==='undefined'?"Không có ứng viên. Click mặt LED hoặc vẽ 4 góc.":window.tr?.("Không có ứng viên. Click mặt LED hoặc vẽ 4 góc.","No candidates. Click an LED face or draw four corners.")??"Không có ứng viên. Click mặt LED hoặc vẽ 4 góc."));return;}const make=spatial=>{const chosen=[...document.querySelectorAll('[data-detect]:checked')].map(e=>arr[+e.dataset.detect]).filter(c=>!c.existing);if(!chosen.length){toast((typeof window==='undefined'?"Chưa chọn màn mới.":window.tr?.("Chưa chọn màn mới.","No new screen selected.")??"Chưa chọn màn mới."));return;}checkpoint();for(const c of chosen)createSurface(c.face,c.mesh.name,{planar:true});if(spatial)rebuildSpatialMap({activate:true,record:false});engine.view='stage';engine.globalTest=true;state.step='mapping';renderUI();toast((typeof window==='undefined'?"LED gắn từ đúng tam giác gốc. Pixel LED thực cần nhập riêng.":window.tr?.("LED gắn từ đúng tam giác gốc. Pixel LED thực cần nhập riêng.","LED attached to original triangles. Enter actual LED pixels separately.")??"LED gắn từ đúng tam giác gốc. Pixel LED thực cần nhập riêng."),6500);};dialog((typeof window==='undefined'?"Nhận diện LED / cùng hệ quy chiếu":window.tr?.("Nhận diện LED / cùng hệ quy chiếu","Detect LEDs / shared reference frame")??"Nhận diện LED / cùng hệ quy chiếu"),(typeof window==='undefined'?"<p>Gợi ý theo tên/hình học; chọn đúng mặt phát hình. Tỷ lệ 3D lấy nguyên từ model.</p><div class=\"candidate-list\">":window.tr?.("<p>Gợi ý theo tên/hình học; chọn đúng mặt phát hình. Tỷ lệ 3D lấy nguyên từ model.</p><div class=\"candidate-list\">","<p>Suggestions use names/geometry; select the emitting face. 3D scale comes from the model.</p><div class=\"candidate-list\">")??"<p>Gợi ý theo tên/hình học; chọn đúng mặt phát hình. Tỷ lệ 3D lấy nguyên từ model.</p><div class=\"candidate-list\">")+arr.slice(0,80).map((c,i)=>`<label class="check-row"><input type="checkbox" data-detect="${i}" ${c.existing?'disabled':c.recommended?'checked':''}><span><b>${esc(c.mesh.name)}</b><small>${fmt(c.info.width)} \u00d7 ${fmt(c.info.height)} m / ${c.existing?(typeof window==='undefined'?"Đã có mapping":window.tr?.("Đã có mapping","Already mapped")??"Đã có mapping"):esc(c.reasons.join(' / '))}</small></span></label>`).join('')+(typeof window==='undefined'?"</div><p class=\"hint-text\">Map theo sân khấu giữ khoảng hở. Không xếp màn sát thành hàng.</p>":window.tr?.("</div><p class=\"hint-text\">Map theo sân khấu giữ khoảng hở. Không xếp màn sát thành hàng.</p>","</div><p class=\"hint-text\">Stage mapping preserves gaps. Screens are not packed into a row.</p>")??"</div><p class=\"hint-text\">Map theo sân khấu giữ khoảng hở. Không xếp màn sát thành hàng.</p>"),[{label:(typeof window==='undefined'?"Hủy":window.tr?.("Hủy","Cancel")??"Hủy")},{label:(typeof window==='undefined'?"Tạo LED / crop riêng":window.tr?.("Tạo LED / crop riêng","Create LED / manual crop")??"Tạo LED / crop riêng"),action:()=>make(false)},{label:(typeof window==='undefined'?"Tạo + map theo sân khấu":window.tr?.("Tạo + map theo sân khấu","Create + stage mapping")??"Tạo + map theo sân khấu"),primary:true,action:()=>make(true)}]);}catch(e){busy(false);toast(e.message,8500);}},30);};
assignMaster=function(a,{mode=engine.layout?.mode==='spatial'?'stage':'local'}={}){if(!engine.surfaces.length){toast((typeof window==='undefined'?"Tạo mặt LED trước khi gán video.":window.tr?.("Tạo mặt LED trước khi gán video.","Create an LED face before assigning video.")??"Tạo mặt LED trước khi gán video."));return;}checkpoint();for(const s of engine.surfaces){s.mappingSpace=mode==='stage'?'stage':'local';V031.setSource(s,a.id);}if(mode==='stage')rebuildSpatialMap({width:a.width,height:a.height,activate:true,record:false});else for(const s of engine.surfaces)cropFromMap(s,a);if(a.duration){state.duration=+a.duration.toFixed(2);state.time=0;syncVideos(true);}engine.view='stage';engine.globalTest=false;renderUI();toast(mode==='stage'?(typeof window==='undefined'?"Video theo bố cục 3D: một tỷ lệ chung, giữ khoảng hở.":window.tr?.("Video theo bố cục 3D: một tỷ lệ chung, giữ khoảng hở.","Video follows the 3D layout: shared scale, gaps preserved.")??"Video theo bố cục 3D: một tỷ lệ chung, giữ khoảng hở."):(typeof window==='undefined'?"Video đã chia ô: kiểm tra crop X/Y/rộng/cao từng LED.":window.tr?.("Video đã chia ô: kiểm tra crop X/Y/rộng/cao từng LED.","Tiled video: check crop X/Y/width/height for each LED.")??"Video đã chia ô: kiểm tra crop X/Y/rộng/cao từng LED."),7500);};
function manualCropMode(s=surface()){if(!s)return;checkpoint();s.mappingSpace='local';engine.releaseMesh(s.mesh);resetFlatCache();renderUI();toast((typeof window==='undefined'?"Crop riêng. Model 3D và kích thước vật lý không thay đổi.":window.tr?.("Crop riêng. Model 3D và kích thước vật lý không thay đổi.","Manual crop. 3D model and physical dimensions unchanged.")??"Crop riêng. Model 3D và kích thước vật lý không thay đổi."));}
function sameFloatArray(a,b){if(a===b)return true;if(!a||!b||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>1e-6)return false;return true;}
function sameCoordFrame(a,b){if(!a||!b)return false;const ca=a.config,cb=b.config;if(!ca||!cb||ca.scale!==cb.scale||ca.yaw!==cb.yaw||ca.up!==cb.up||ca.origin!==cb.origin)return false;return sameFloatArray(a.matrix,b.matrix);}
function restoreSpatialBindings(){let dirty=false;for(const s of engine.surfaces){const src=sourceForSurface(s);if(src){s.sourceMeshId=src.id;s.sourceKey=src.sourceKey;s.sourceMeshPath=src.path||null;s.mesh.preferredUp=src.worldAxes?.[1]||[0,1,0];}s.mappingSpace ||= 'local';s.nativeResolution ||= {width:s.w,height:s.h,confirmed:false};s.physical=s.mappingMode==='uv'&&finiteArray(s.physical,2)?s.physical:[measureFace(s.mesh).width,measureFace(s.mesh).height];normalizeSurfaceHardware(s);if(s.mappingSpace==='stage'&&engine.layout?.bounds&&engine.layout?.padding){const nextUV=calculateMapUV(s);if(!sameFloatArray(s.mesh.mapUV,nextUV)){s.mesh.mapUV=nextUV;engine.releaseMesh(s.mesh);dirty=true;}}}if(dirty)resetFlatCache();}
snapshot=function(){return {...V031.snapshot(),coordinates:structuredClone(engine.coordinates),layout:structuredClone(engine.layout),camera:structuredClone(engine.camera)};};
restore=function(s){state._restoring=(state._restoring||0)+1;try{if(s.coordinates?.config&&!sameCoordFrame(s.coordinates,engine.coordinates))applyCoordinateConfig(s.coordinates.config,{record:false,updateAttachments:false,fit:false});if(s.coordinates)engine.coordinates=structuredClone(s.coordinates);engine.layout=structuredClone(s.layout||defaultLayout());const cloned={...s,surfaces:Array.isArray(s.surfaces)?s.surfaces.map(x=>({...x,crop:x.crop?.slice(),nativeResolution:x.nativeResolution?{...x.nativeResolution}:undefined,physical:x.physical?[...x.physical]:undefined,metricFrame:x.metricFrame?structuredClone(x.metricFrame):undefined,cabinetSpec:x.cabinetSpec?{...x.cabinetSpec}:undefined,virtualTiles:Array.isArray(x.virtualTiles)?[...x.virtualTiles]:[],columnAnglesDeg:Array.isArray(x.columnAnglesDeg)?[...x.columnAnglesDeg]:undefined,curvatureSections:Array.isArray(x.curvatureSections)?x.curvatureSections.map(c=>({...c})):undefined,wiringConfig:x.wiringConfig?{...x.wiringConfig}:undefined,rowLayout:Array.isArray(x.rowLayout)?x.rowLayout.map(r=>({...r})):undefined,cabinetModelId:x.cabinetModelId,processorModelId:x.processorModelId,shapeType:x.shapeType,wiringViewMode:x.wiringViewMode,rows500x1000:x.rows500x1000,rows500x500:x.rows500x500})):[]};V031.restore(cloned);if(s.camera)engine.camera=structuredClone(s.camera);restoreSpatialBindings();state._deferFixtures=true;state._deferUI=true;}finally{if(!--state._restoring)flushDeferredRestore();}};
importModel=async function(files,{silent=false}={}){if(state.importing)return;state.importing=true;busy(true,(typeof window==='undefined'?"Đang đọc model và hệ quy chiếu...":window.tr?.("Đang đọc model và hệ quy chiếu...","Reading model and reference frame...")??"Đang đọc model và hệ quy chiếu..."));try{const list=Array.from(files);if(list.reduce((a,f)=>a+f.size,0)>600*1024*1024)throw Error((typeof window==='undefined'?"Model vượt 600 MB.":window.tr?.("Model vượt 600 MB.","Model exceeds 600 MB.")??"Model vượt 600 MB."));const result=await Importer.load(list);engine.setModel(result.meshes);engine.sourcePunctualLights=result.punctualLights||[];engine.surfaces=[];engine.selected=null;engine.lights=[];engine.rebuildFixtures();state.model={name:result.name,files:result.files,demo:false};state.projectName=result.name.replace(/\.[a-z0-9]+$/i,'');state.warnings=result.warnings;state.history=[];state.redo=[];state.selectedMesh=null;state.hit=null;state.rebindId=null;state.selectedLight=null;cancelSpatialPick();engine.globalTest=false;engine.view='stage';state.step='stage';engine.settings.ambient=.65;engine.settings.beam=.6;const ext=result.name.split('.').pop().toLowerCase();engine.coordinates.sourceInfo={format:ext,normalizedByImporter:true,declaredUnit:ext==='obj'?'unspecified (assumed meters)':ext==='dae'?'COLLADA asset unit / up_axis':'glTF meters / Y-up',...result.coordinateInfo};renderUI();if(!silent){toast((typeof window==='undefined'?"Đã nhập ":window.tr?.("Đã nhập ","Imported ")??"Đã nhập ")+result.name+(typeof window==='undefined'?". Kiểm tra kích thước mét trước khi map. Không tự thêm đèn.":window.tr?.(". Kiểm tra kích thước mét trước khi map. Không tự thêm đèn.",". Check dimensions in meters before mapping. No lights added automatically.")??". Kiểm tra kích thước mét trước khi map. Không tự thêm đèn."),8000);if(result.warnings.length)dialog((typeof window==='undefined'?"Lưu ý model":window.tr?.("Lưu ý model","Model notes")??"Lưu ý model"),'<p>'+result.warnings.map(esc).join('<br>')+'</p>');}return result;}finally{state.importing=false;busy(false);}};
demo=function(){engine.lights=[];V031.demo();state.projectName='ALPHA_Demo_Stage';engine.layout ||= defaultLayout();for(const s of engine.surfaces){s.mappingSpace='stage';normalizeSurfaceHardware(s);}rebuildSpatialMap({width:3840,height:1280,activate:true,record:false});for(const s of engine.surfaces)normalizeSurfaceHardware(s);state.history=[];state.redo=[];renderUI();};
mappingData=function(){const d=V031.mappingData();d.coordinates=structuredClone(engine.coordinates);d.layout=structuredClone(engine.layout);d.screens.forEach((s,i)=>{const x=engine.surfaces[i];normalizeSurfaceHardware(x);s.mappingSpace=x.mappingSpace;s.nativeResolution=x.nativeResolution;s.sourceKey=x.sourceKey;s.worldBounds=x.mesh.bounds;s.cabinetSpec={...x.cabinetSpec};s.virtualTiles=[...x.virtualTiles];s.columnAnglesDeg=[...x.columnAnglesDeg];s.curvatureSections=Array.isArray(x.curvatureSections)?x.curvatureSections.map(c=>({...c})):[];s.wiringConfig={...x.wiringConfig};s.note='outputRect is a content viewport, not a receiver-card configuration';});return d;};
mappingWarnings=function(){const arr=V031.mappingWarnings();if(engine.surfaces.some(s=>!s.nativeResolution?.confirmed))arr.push((typeof window==='undefined'?"Chưa xác nhận độ phân giải LED thực cho tất cả màn. Kích thước xem thử không phải pixel map phần cứng.":window.tr?.("Chưa xác nhận độ phân giải LED thực cho tất cả màn. Kích thước xem thử không phải pixel map phần cứng.","Physical LED resolution is not confirmed for all screens. Preview dimensions are not a hardware pixel map.")??"Chưa xác nhận độ phân giải LED thực cho tất cả màn. Kích thước xem thử không phải pixel map phần cứng."));return arr;};
// Per-screen media selection is explicit local crop. Master assignment bypasses
// this override and retains shared spatial UVs when requested.
setSource=function(s,id){V031.setSource(s,id);if(engine.media.has(id)){s.mappingSpace='local';engine.releaseMesh(s.mesh);resetFlatCache();}};
const oldReplaceSurfaceGeometry=replaceSurfaceGeometry;
replaceSurfaceGeometry=function(s,face){oldReplaceSurfaceGeometry(s,face);if(s.mappingSpace==='stage')rebuildSpatialMap({activate:false,record:false});};
const metricSnapshot=snapshot;
snapshot=function(){const d=metricSnapshot();d.surfaces=d.surfaces.map(s=>({...s,nativeResolution:s.nativeResolution?{...s.nativeResolution}:undefined,physical:s.physical?[...s.physical]:undefined,metricFrame:s.metricFrame?structuredClone(s.metricFrame):undefined,cabW:s.cabW,cabH:s.cabH,pxW:s.pxW,pxH:s.pxH,cabCols:s.cabCols,cabRows:s.cabRows,panelAngleDeg:s.panelAngleDeg,wiringOrder:s.wiringOrder,cabinetSpec:s.cabinetSpec?{...s.cabinetSpec}:undefined,virtualTiles:Array.isArray(s.virtualTiles)?[...s.virtualTiles]:[],columnAnglesDeg:Array.isArray(s.columnAnglesDeg)?[...s.columnAnglesDeg]:undefined,curvatureSections:Array.isArray(s.curvatureSections)?s.curvatureSections.map(c=>({...c})):undefined,wiringConfig:s.wiringConfig?{...s.wiringConfig}:undefined,rowLayout:Array.isArray(s.rowLayout)?s.rowLayout.map(r=>({...r})):undefined,cabinetModelId:s.cabinetModelId,processorModelId:s.processorModelId,shapeType:s.shapeType,wiringViewMode:s.wiringViewMode,rows500x1000:s.rows500x1000,rows500x500:s.rows500x500}));return d;};

/* Anchored fixtures: select source lens, then target in the same metric scene. */
StageEngine.prototype.rebuildFixtures=function(){if(typeof state!=='undefined'&&state._restoring){state._deferFixtures=true;return;}const sig=this.lights.map(l=>(l._deleted8||l.origin==='model'||l.origin==='gltf')?'':`${l.id}|${l.name}|${l.pos?.[0]},${l.pos?.[1]},${l.pos?.[2]}|${l.fixtureSize?.join(',')||''}`).join(';');if(this._fixtureSig===sig&&(this.fixtureMeshes.length||!sig.replace(/;/g,'')))return;this._fixtureSig=sig;for(const m of this.fixtureMeshes)this.releaseMesh(m);this.fixtureMeshes=[];for(const l of this.lights){if(l._deleted8||l.origin==='model'||l.origin==='gltf')continue;const size=l.fixtureSize||[.3,.38,.3],mesh=boxMesh(l.name+' / proxy',M.add(l.pos,[0,size[1]*.45,0]),size,[.12,.14,.18,1]);mesh.lightId=l.id;this.fixtureMeshes.push(mesh);}};
StageEngine.prototype.makeBeam=function(l){const p=l.pos,d=l._direction||M.norm(M.sub(l.target,p)),length=clamp(l.beamLength||Math.hypot(...M.sub(l._target||l.target,p)),.05,1000),radius=Math.tan(clamp(l.angle,1,60)*Math.PI/180)*length,right=M.norm(M.cross(d,Math.abs(d[1])>.95?[1,0,0]:[0,1,0])),up=M.cross(right,d),pos=[],uv=[],aperture=l.aperture||.025;for(let i=0;i<24;i++){const a=i/24*Math.PI*2,b=(i+1)/24*Math.PI*2,r1=M.add(M.mul(right,Math.cos(a)),M.mul(up,Math.sin(a))),r2=M.add(M.mul(right,Math.cos(b)),M.mul(up,Math.sin(b))),end=M.add(p,M.mul(d,length));pos.push(...[M.add(p,M.mul(r1,aperture)),M.add(end,M.mul(r1,radius)),M.add(end,M.mul(r2,radius)),M.add(p,M.mul(r1,aperture)),M.add(end,M.mul(r2,radius)),M.add(p,M.mul(r2,aperture))].flat());uv.push(0,0,0,1,1,1,0,0,1,1,1,0);}return makeMesh('beam',pos,uv,null,{color:[...hexrgb(l.color),1]});};
function addAnchoredLight(hit,target,{newFixture=false}={}){if(engine.lights.length>=MAX_PREVIEW_LIGHTS)throw Error((typeof window==='undefined'?"Tối đa 128 đèn xem thử.":window.tr?.("Tối đa 128 đèn xem thử.","Maximum 128 preview fixtures.")??"Tối đa 128 đèn xem thử."));if(!hit?.mesh||!finiteArray(hit.point,3)||!finiteArray(target,3))throw Error((typeof window==='undefined'?"Chọn mặt kính đèn và điểm chiếu.":window.tr?.("Chọn mặt kính đèn và điểm chiếu.","Pick a fixture lens and target.")??"Chọn mặt kính đèn và điểm chiếu."));if(Math.hypot(...M.sub(target,hit.point))<.02)throw Error((typeof window==='undefined'?"Điểm chiếu quá gần nguồn sáng.":window.tr?.("Điểm chiếu quá gần nguồn sáng.","Target is too close to the source.")??"Điểm chiếu quá gần nguồn sáng."));const old=engine.lights.find(l=>l.origin==='model'&&l.sourceKey===hit.mesh.sourceKey&&Math.hypot(...M.sub(l.pos,hit.point))<.02);if(old){state.selectedLight=old.id;renderUI();return old;}checkpoint();const l={id:uid('light'),name:'L'+String(engine.lights.length+1).padStart(2,'0')+' / '+hit.mesh.name,pos:[...hit.point],target:[...target],color:'#8adfff',power:4.5,angle:12,enabled:true,sweep:false,speed:.35,phase:engine.lights.length*.35,fx:'steady',fxDepth:.55,fxSpeed:2.2,boost:1,origin:newFixture?'placed':'model',sourceKey:hit.mesh.sourceKey,sourceMeshName:hit.mesh.name,sourcePoint:M.point(engine.coordinates.inverse,hit.point),fixtureSize:[.3,.38,.3],aperture:.025};engine.lights.push(l);state.selectedLight=l.id;state.selectedMesh=null;engine.selected=null;state.step='lighting';engine.view='stage';engine.settings.beam=Math.max(.5,engine.settings.beam);engine.rebuildFixtures();renderUI();return l;}
function cancelSpatialPick(){state.pickTask=null;state.pendingLight=null;state.measurePoints=[];if($('quadHint'))$('quadHint').classList.add('hidden');}
function startSpatialPick(kind){state.rebindId=null;state.quad=false;state.quadPoints=[];state.measurePoints=[];state.pendingLight=null;state.pickTask=kind;engine.view='stage';if(kind.startsWith('light-'))state.step='lighting';const hints={measure:(typeof window==='undefined'?"ĐO TỶ LỆ: chọn 2 điểm có khoảng cách thực đã biết. Bắt đỉnh gần chuột. Esc: hủy.":window.tr?.("ĐO TỶ LỆ: chọn 2 điểm có khoảng cách thực đã biết. Bắt đỉnh gần chuột. Esc: hủy.","MEASURE SCALE: select two points with a known actual distance. Snaps to nearby vertices. Esc: cancel.")??"ĐO TỶ LỆ: chọn 2 điểm có khoảng cách thực đã biết. Bắt đỉnh gần chuột. Esc: hủy."),reference:(typeof window==='undefined'?"MẶT ĐỨNG CHUẨN: click mặt LED nhìn từ phía khán giả.":window.tr?.("MẶT ĐỨNG CHUẨN: click mặt LED nhìn từ phía khán giả.","REFERENCE FACADE: click an LED face viewed from the audience.")??"MẶT ĐỨNG CHUẨN: click mặt LED nhìn từ phía khán giả."),'light-existing':(typeof window==='undefined'?"CHỌN ĐÈN: click mặt kính đèn đã có trong model, sau đó click điểm chiếu.":window.tr?.("CHỌN ĐÈN: click mặt kính đèn đã có trong model, sau đó click điểm chiếu.","SELECT LIGHT: click an existing fixture lens in the model, then its target.")??"CHỌN ĐÈN: click mặt kính đèn đã có trong model, sau đó click điểm chiếu."),'light-new':(typeof window==='undefined'?"ĐẶT ĐÈN MỚI: click vị trí gắn, rồi click điểm chiếu.":window.tr?.("ĐẶT ĐÈN MỚI: click vị trí gắn, rồi click điểm chiếu.","PLACE NEW LIGHT: click its mounting position, then its target.")??"ĐẶT ĐÈN MỚI: click vị trí gắn, rồi click điểm chiếu."),'light-target':(typeof window==='undefined'?"CHỌN ĐIỂM CHIẾU: click sàn sân khấu hoặc model.":window.tr?.("CHỌN ĐIỂM CHIẾU: click sàn sân khấu hoặc model.","SELECT TARGET: click the stage floor or model.")??"CHỌN ĐIỂM CHIẾU: click sàn sân khấu hoặc model."),'light-position':(typeof window==='undefined'?"GẮN LẠI VỊ TRÍ ĐÈN: click đúng mặt kính đèn trên model.":window.tr?.("GẮN LẠI VỊ TRÍ ĐÈN: click đúng mặt kính đèn trên model.","REPOSITION LIGHT: click the fixture lens on the model.")??"GẮN LẠI VỊ TRÍ ĐÈN: click đúng mặt kính đèn trên model.")};$('quadHint').textContent=hints[kind]||kind;$('quadHint').classList.remove('hidden');renderUI();}
function floorHit(e){const r=engine.canvas.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width*2-1,ny=1-(e.clientY-r.top)/r.height*2,inv=M.inverse(engine.vp),o=M.point(inv,[nx,ny,-1]),far=M.point(inv,[nx,ny,1]),d=M.norm(M.sub(far,o)),y=engine.stageBounds?.min[1]||0;if(Math.abs(d[1])<1e-8)return null;const t=(y-o[1])/d[1];return t>0?{point:M.add(o,M.mul(d,t)),normal:[0,1,0],floor:true}:null;}
function snapHitVertex(hit,e){const r=engine.canvas.getBoundingClientRect();let best=12,point=hit.point;for(let k=0;k<3;k++){const p=Array.from(hit.mesh.p.slice(hit.triangle*9+k*3,hit.triangle*9+k*3+3)),s=engine.project(p);if(!s)continue;const dist=Math.hypot(s.x+r.left-e.clientX,s.y+r.top-e.clientY);if(dist<best){best=dist;point=p;}}return {...hit,point};}
function handleSpatialClick(e){
 const task=state.pickTask;if(!task)return false;let hit=engine.pick(e.clientX,e.clientY,false);if((task==='light-target'||task==='light-aim')&&!hit)hit=floorHit(e);if(!hit){toast((typeof window==='undefined'?"Hãy click lên bề mặt model.":window.tr?.("Hãy click lên bề mặt model.","Click a model face.")??"Hãy click lên bề mặt model."));return true;}
 if(task==='measure'){
  hit=snapHitVertex(hit,e);state.measurePoints.push([...hit.point]);
  if(state.measurePoints.length===2){const points=structuredClone(state.measurePoints),distance=Math.hypot(...M.sub(points[1],points[0]));cancelSpatialPick();if(distance<.00001){toast((typeof window==='undefined'?"Hai điểm quá gần nhau.":window.tr?.("Hai điểm quá gần nhau.","The two points are too close.")??"Hai điểm quá gần nhau."));return true;}
   dialog((typeof window==='undefined'?"Hiệu chuẩn kích thước":window.tr?.("Hiệu chuẩn kích thước","Calibrate dimensions")??"Hiệu chuẩn kích thước"),`<p>${(typeof window==='undefined'?"Khoảng đo trong model: ":window.tr?.("Khoảng đo trong model: ","Measured model distance: ")??"Khoảng đo trong model: ")}<b>${fmt(distance)} m</b>${(typeof window==='undefined'?". Nhập khoảng cách thực đã biết.":window.tr?.(". Nhập khoảng cách thực đã biết.",". Enter the known actual distance.")??". Nhập khoảng cách thực đã biết.")}</p>${field('actualSpan',(typeof window==='undefined'?"Khoảng cách thực (m)":window.tr?.("Khoảng cách thực (m)","Actual distance (m)")??"Khoảng cách thực (m)"),Number(distance.toPrecision(6)),{min:.00001,step:.01})}<p class="hint-text">${(typeof window==='undefined'?"Cùng một hệ số cho sân khấu + LED + đèn. Pixel/crop không đổi.":window.tr?.("Cùng một hệ số cho sân khấu + LED + đèn. Pixel/crop không đổi.","One scale for stage + LEDs + lights. Pixels/crop unchanged.")??"Cùng một hệ số cho sân khấu + LED + đèn. Pixel/crop không đổi.")}</p>`,[{label:(typeof window==='undefined'?"Hủy":window.tr?.("Hủy","Cancel")??"Hủy")},{label:(typeof window==='undefined'?"Áp dụng tỷ lệ chung":window.tr?.("Áp dụng tỷ lệ chung","Apply shared scale")??"Áp dụng tỷ lệ chung"),primary:true,action:()=>{const actual=+$('actualSpan').value;if(!Number.isFinite(actual)||actual<=0){toast((typeof window==='undefined'?"Nhập số dương.":window.tr?.("Nhập số dương.","Enter a positive number.")??"Nhập số dương."));return;}applyCoordinateConfig({...engine.coordinates.config,scale:engine.coordinates.config.scale*actual/distance});engine.coordinates.calibration={method:'two-points',measuredBeforeM:distance,actualM:actual,pointsBefore:points};}}]);
  }else $('quadHint').textContent=(typeof window==='undefined'?"Đã chọn điểm 1/2. Chọn điểm thứ hai.":window.tr?.("Đã chọn điểm 1/2. Chọn điểm thứ hai.","Point 1/2 selected. Select the second point.")??"Đã chọn điểm 1/2. Chọn điểm thứ hai.");return true;
 }
 if(task==='reference'){checkpoint();const n=hit.normal,up0=Math.abs(n[1])>.95?[0,0,-1]:[0,1,0],right=M.norm(M.cross(up0,n)),up=M.norm(M.cross(n,right));engine.layout.reference={origin:[...hit.point],right,up,normal:[...n],explicit:true};cancelSpatialPick();if(engine.surfaces.length)rebuildSpatialMap({activate:true,record:false});renderUI();toast((typeof window==='undefined'?"Đã chọn mặt đứng chuẩn. Model không bị xoay / co giãn.":window.tr?.("Đã chọn mặt đứng chuẩn. Model không bị xoay / co giãn.","Reference facade selected. Model rotation / scale unchanged.")??"Đã chọn mặt đứng chuẩn. Model không bị xoay / co giãn."));return true;}
 if(task==='light-existing'||task==='light-new'){state.pendingLight={hit,newFixture:task==='light-new'};state.pickTask='light-aim';$('quadHint').textContent=(typeof window==='undefined'?"Đã chọn vị trí đèn. Click điểm chiếu trên sân khấu / sàn. Esc: hủy.":window.tr?.("Đã chọn vị trí đèn. Click điểm chiếu trên sân khấu / sàn. Esc: hủy.","Light position selected. Click a target on the stage / floor. Esc: cancel.")??"Đã chọn vị trí đèn. Click điểm chiếu trên sân khấu / sàn. Esc: hủy.");return true;}
 if(task==='light-aim'){try{const p=state.pendingLight;addAnchoredLight(p.hit,hit.point,{newFixture:p.newFixture});cancelSpatialPick();renderUI();toast((typeof window==='undefined'?"Đã gắn tia sáng đúng vị trí đèn và điểm chiếu.":window.tr?.("Đã gắn tia sáng đúng vị trí đèn và điểm chiếu.","Beam attached to the selected light position and target.")??"Đã gắn tia sáng đúng vị trí đèn và điểm chiếu."));}catch(err){toast(err.message,7000);}return true;}
 const l=engine.lights.find(x=>x.id===state.selectedLight);if(l&&(task==='light-target'||task==='light-position')){checkpoint();if(task==='light-target'){l.target=[...hit.point];l.sweep=false;}else{l.pos=[...hit.point];l.origin='model';l.sourceKey=hit.mesh.sourceKey;l.sourceMeshName=hit.mesh.name;l.sourcePoint=M.point(typeof dirCanonicalMatrix==='function'?M.inverse(dirCanonicalMatrix(hit.mesh)):engine.coordinates.inverse,hit.point);}cancelSpatialPick();engine.rebuildFixtures();renderUI();return true;}return true;
}
rigPreset=function(name,history=true){if(!engine.lights.length){if(state.model.demo){V031.rigPreset(name,history);return;}toast((typeof window==='undefined'?"Chọn đèn trên model trước. Preset không tự tạo dàn đèn.":window.tr?.("Chọn đèn trên model trước. Preset không tự tạo dàn đèn.","Select model lights first. Presets do not create a lighting rig.")??"Chọn đèn trên model trước. Preset không tự tạo dàn đèn."));return;}if(history)checkpoint();const colors=name==='warm'?['#ffd09a','#ffb86b']:name==='cool'?['#d6eeff','#7fc9ff']:['#66d5ff','#be7bff'];engine.lights.forEach((l,i)=>{l.color=colors[i%2];l.power=name==='warm'?3.2:4.5;l.enabled=name!=='blackout';l.sweep=name==='concert';l.fx='steady';l.boost=1;});engine.settings.ambient=name==='blackout'?.12:name==='warm'?.5:.6;engine.settings.beam=name==='blackout'?0:.6;engine.rebuildFixtures();if(history){renderUI();toast((typeof window==='undefined'?"Preset giữ nguyên vị trí / kích thước đèn đã chọn.":window.tr?.("Preset giữ nguyên vị trí / kích thước đèn đã chọn.","Preset preserves selected light positions / dimensions.")??"Preset giữ nguyên vị trí / kích thước đèn đã chọn."));}};

function metricFmt(v){return Number(Number(v).toFixed(3)).toLocaleString('en-US',{maximumFractionDigits:3});}
function scaleFmt(v){return Number(Number(v).toPrecision(6)).toString();}

/* Visible, metric workflow controls. */
function referenceFrameDialog(){
 const c=engine.coordinates.config,b=engine.size,info=engine.coordinates.sourceInfo||{};
 dialog((typeof window==='undefined'?"Hệ quy chiếu / tỷ lệ chung":window.tr?.("Hệ quy chiếu / tỷ lệ chung","Reference frame / shared scale")??"Hệ quy chiếu / tỷ lệ chung"),
  `<div class="reference-summary"><b>${metricFmt(b.width)} \u00d7 ${metricFmt(b.height)} \u00d7 ${metricFmt(b.depth)} m</b><small>${(typeof window==='undefined'?"Rộng × cao × sâu sau nhập":window.tr?.("Rộng × cao × sâu sau nhập","Width × height × depth after import")??"Rộng × cao × sâu sau nhập")}</small></div><p>${(typeof window==='undefined'?"Model, LED và đèn dùng chung một phép biến đổi. Không fit riêng từng object.":window.tr?.("Model, LED và đèn dùng chung một phép biến đổi. Không fit riêng từng object.","Model, LEDs and lights share one transform. Objects are not fitted individually.")??"Model, LED và đèn dùng chung một phép biến đổi. Không fit riêng từng object.")}</p><p class="hint-text">${(typeof window==='undefined'?"Tệp: ":window.tr?.("Tệp: ","File: ")??"Tệp: ")}${esc(info.format||'demo')} \u00b7 ${esc(info.declaredUnit||'meters')}<br>${(typeof window==='undefined'?"GLB/DAE đã đọc đơn vị từ file. Chỉ sửa scale nếu kích thước kiểm tra bị sai.":window.tr?.("GLB/DAE đã đọc đơn vị từ file. Chỉ sửa scale nếu kích thước kiểm tra bị sai.","GLB/DAE units come from the file. Adjust scale only if measured dimensions are wrong.")??"GLB/DAE đã đọc đơn vị từ file. Chỉ sửa scale nếu kích thước kiểm tra bị sai.")}</p>${field('frameScale',(typeof window==='undefined'?"Hệ số sửa tỷ lệ (1 = nguyên gốc)":window.tr?.("Hệ số sửa tỷ lệ (1 = nguyên gốc)","Scale correction (1 = original)")??"Hệ số sửa tỷ lệ (1 = nguyên gốc)"),c.scale,{min:.000001,max:1000000,step:.001})}<div class="scale-shortcuts"><button class="btn" data-scale-value="1">${(typeof window==='undefined'?"Giữ 1:1":window.tr?.("Giữ 1:1","Keep 1:1")??"Giữ 1:1")}</button><button class="btn" data-scale-value="0.001">mm → m</button><button class="btn" data-scale-value="0.01">cm → m</button><button class="btn" data-scale-value="0.0254">inch → m</button></div><div class="field"><label>${(typeof window==='undefined'?"Trục sau khi importer đã đọc file":window.tr?.("Trục sau khi importer đã đọc file","Axes after import")??"Trục sau khi importer đã đọc file")}</label><select id="frameUp"><option value="keep" ${c.up==='keep'?'selected':''}>${(typeof window==='undefined'?"Giữ trục hiện tại (Y-up)":window.tr?.("Giữ trục hiện tại (Y-up)","Keep current axes (Y-up)")??"Giữ trục hiện tại (Y-up)")}</option><option value="z" ${c.up==='z'?'selected':''}>${(typeof window==='undefined'?"Sửa Z-up thành Y-up":window.tr?.("Sửa Z-up thành Y-up","Convert Z-up to Y-up")??"Sửa Z-up thành Y-up")}</option><option value="x" ${c.up==='x'?'selected':''}>${(typeof window==='undefined'?"Sửa X-up thành Y-up":window.tr?.("Sửa X-up thành Y-up","Convert X-up to Y-up")??"Sửa X-up thành Y-up")}</option></select></div>${field('frameYaw',(typeof window==='undefined'?"Xoay toàn bộ quanh trục đứng (độ)":window.tr?.("Xoay toàn bộ quanh trục đứng (độ)","Rotate all around vertical axis (degrees)")??"Xoay toàn bộ quanh trục đứng (độ)"),c.yaw,{step:1})}<div class="field"><label>${(typeof window==='undefined'?"Gốc tọa độ":window.tr?.("Gốc tọa độ","Coordinate origin")??"Gốc tọa độ")}</label><select id="frameOrigin"><option value="base-center" ${c.origin==='base-center'?'selected':''}>${(typeof window==='undefined'?"Tâm đáy sân khấu":window.tr?.("Tâm đáy sân khấu","Stage base center")??"Tâm đáy sân khấu")}</option><option value="source" ${c.origin==='source'?'selected':''}>${(typeof window==='undefined'?"Giữ gốc của file":window.tr?.("Giữ gốc của file","Keep file origin")??"Giữ gốc của file")}</option></select></div><div class="info-box">${(typeof window==='undefined'?"Không đổi pixel/crop khi sửa tỷ lệ. Nếu biết một chiều dài thực, dùng Đo 2 điểm thay vì đoán scale.":window.tr?.("Không đổi pixel/crop khi sửa tỷ lệ. Nếu biết một chiều dài thực, dùng Đo 2 điểm thay vì đoán scale.","Scale changes preserve pixels/crop. Use Measure two points when an actual length is known.")??"Không đổi pixel/crop khi sửa tỷ lệ. Nếu biết một chiều dài thực, dùng Đo 2 điểm thay vì đoán scale.")}</div>`,
  [{label:(typeof window==='undefined'?"Hủy":window.tr?.("Hủy","Cancel")??"Hủy")},{label:(typeof window==='undefined'?"Đo 2 điểm":window.tr?.("Đo 2 điểm","Measure two points")??"Đo 2 điểm"),action:()=>startSpatialPick('measure')},{label:(typeof window==='undefined'?"Áp dụng chung":window.tr?.("Áp dụng chung","Apply to all")??"Áp dụng chung"),primary:true,action:()=>{try{applyCoordinateConfig({scale:+$('frameScale').value,up:$('frameUp').value,yaw:+$('frameYaw').value,origin:$('frameOrigin').value});toast((typeof window==='undefined'?"Đã đồng bộ model + LED + đèn trong cùng hệ mét.":window.tr?.("Đã đồng bộ model + LED + đèn trong cùng hệ mét.","Model + LEDs + lights synchronized in meters.")??"Đã đồng bộ model + LED + đèn trong cùng hệ mét."));}catch(e){toast(e.message,9000);}}}]);
 document.querySelectorAll('[data-scale-value]').forEach(b=>b.onclick=()=>$('frameScale').value=b.dataset.scaleValue);
}
function spatialWorkflowPanel(){
 const b=engine.size,scale=engine.coordinates?.config.scale||1;
 return `<div class="spatial-workflow"><span class="section-kicker">${(typeof window==='undefined'?"Khung đo chung":window.tr?.("Khung đo chung","Shared measurement frame")??"Khung đo chung")}</span><strong>${metricFmt(b.width)} \u00d7 ${metricFmt(b.height)} \u00d7 ${metricFmt(b.depth)} <small>m</small></strong><span>${(typeof window==='undefined'?"Tỷ lệ ":window.tr?.("Tỷ lệ ","Scale ")??"Tỷ lệ ")}${scaleFmt(scale)}${(typeof window==='undefined'?" · X ngang / Y cao / Z sâu":window.tr?.(" · X ngang / Y cao / Z sâu"," · X horizontal / Y height / Z depth")??" · X ngang / Y cao / Z sâu")}</span><div class="actions-row"><button class="btn small" id="openFrame">${(typeof window==='undefined'?"Hệ quy chiếu":window.tr?.("Hệ quy chiếu","Reference frame")??"Hệ quy chiếu")}</button><button class="btn small" id="measureFrame">${(typeof window==='undefined'?"Đo 2 điểm":window.tr?.("Đo 2 điểm","Measure two points")??"Đo 2 điểm")}</button></div></div>`;
}
function spatialMappingPanel(s){
 const phys=s.physical||[0,0],native=s.nativeResolution||{width:s.w,height:s.h,confirmed:false},isSpatial=s.mappingSpace==='stage';
 return `<div class="inspector-block spatial-led-panel"><h3 class="block-title"><svg class="ico ico-stage" aria-hidden="true"><use href="#i-ruler"></use></svg><span>${(typeof window==='undefined'?"Tỷ lệ LED / mét":window.tr?.("Tỷ lệ LED / mét","LED scale / meters")??"Tỷ lệ LED / mét")}</span></h3><div class="metric-pair"><div><b>${metricFmt(phys[0])} m</b><span>${(typeof window==='undefined'?"Rộng mặt gốc":window.tr?.("Rộng mặt gốc","Original face width")??"Rộng mặt gốc")}</span></div><div><b>${metricFmt(phys[1])} m</b><span>${(typeof window==='undefined'?"Cao mặt gốc":window.tr?.("Cao mặt gốc","Original face height")??"Cao mặt gốc")}</span></div></div><p class="hint-text">${(typeof window==='undefined'?"Hình học bám nguyên model. Đổi video hay pixel không co giãn màn 3D.":window.tr?.("Hình học bám nguyên model. Đổi video hay pixel không co giãn màn 3D.","Geometry follows the original model. Video or pixel changes do not resize the 3D screen.")??"Hình học bám nguyên model. Đổi video hay pixel không co giãn màn 3D.")}</p><div class="mapping-mode-tag ${isSpatial?'spatial':''}">${isSpatial?(typeof window==='undefined'?"SPATIAL · cùng hệ sân khấu":window.tr?.("SPATIAL · cùng hệ sân khấu","SPATIAL · shared stage space")??"SPATIAL · cùng hệ sân khấu"):(typeof window==='undefined'?"MANUAL · crop từ clip đã chia ô":window.tr?.("MANUAL · crop từ clip đã chia ô","MANUAL · crop from tiled clip")??"MANUAL · crop từ clip đã chia ô")}</div><div class="actions-row"><button class="btn ${isSpatial?'primary':''}" id="spatialAll">${(typeof window==='undefined'?"Theo sân khấu":window.tr?.("Theo sân khấu","Stage mapping")??"Theo sân khấu")}</button><button class="btn ${!isSpatial?'primary':''}" id="localCrop">${(typeof window==='undefined'?"Crop riêng":window.tr?.("Crop riêng","Manual crop")??"Crop riêng")}</button></div><button class="btn full-btn" id="pickReference">${(typeof window==='undefined'?"Chọn mặt đứng chuẩn":window.tr?.("Chọn mặt đứng chuẩn","Select reference facade")??"Chọn mặt đứng chuẩn")}</button><h3 class="block-title" style="margin-top:16px">${(typeof window==='undefined'?"Pixel LED thực (khác vùng crop)":window.tr?.("Pixel LED thực (khác vùng crop)","Actual LED pixels (separate from crop)")??"Pixel LED thực (khác vùng crop)")}</h3><div class="field-grid">${field('nativeW',(typeof window==='undefined'?"Ngang (px)":window.tr?.("Ngang (px)","Width (px)")??"Ngang (px)"),native.width,{min:1,max:32768})}${field('nativeH',(typeof window==='undefined'?"Cao (px)":window.tr?.("Cao (px)","Height (px)")??"Cao (px)"),native.height,{min:1,max:32768})}</div><label class="check-row"><input type="checkbox" id="nativeLock" ${s.aspectLock?'checked':''}>${(typeof window==='undefined'?" Giữ tỷ lệ mặt / pixel vuông":window.tr?.(" Giữ tỷ lệ mặt / pixel vuông"," Preserve face aspect / square pixels")??" Giữ tỷ lệ mặt / pixel vuông")}</label><label class="check-row"><input type="checkbox" id="nativeConfirmed" ${native.confirmed?'checked':''}>${(typeof window==='undefined'?" Đã đối chiếu pixel thực":window.tr?.(" Đã đối chiếu pixel thực"," Actual pixels verified")??" Đã đối chiếu pixel thực")}</label><p class="hint-text">${native.confirmed?(typeof window==='undefined'?"Pixel được bạn xác nhận.":window.tr?.("Pixel được bạn xác nhận.","Pixel resolution confirmed by you.")??"Pixel được bạn xác nhận."):(typeof window==='undefined'?"Chưa xác nhận pixel; giá trị ban đầu chỉ để preview.":window.tr?.("Chưa xác nhận pixel; giá trị ban đầu chỉ để preview.","Pixel resolution unconfirmed; initial values are for preview only.")??"Chưa xác nhận pixel; giá trị ban đầu chỉ để preview.")}</p></div><div class="divider"></div>`;
}
function bindSpatialMappingPanel(s){
 $('spatialAll').onclick=activateSpatialLayout;$('localCrop').onclick=()=>manualCropMode(s);$('pickReference').onclick=()=>startSpatialPick('reference');
 change('nativeLock',v=>s.aspectLock=v);
 change('nativeConfirmed',v=>s.nativeResolution.confirmed=v);
 change('nativeW',v=>{s.nativeResolution.width=clamp(Math.round(+v)||1,1,32768);if(s.aspectLock&&s.physical[0]>0){s.nativeResolution.height=clamp(Math.round(s.nativeResolution.width*s.physical[1]/s.physical[0]),1,32768);$('nativeH').value=s.nativeResolution.height;}});
 change('nativeH',v=>{s.nativeResolution.height=clamp(Math.round(+v)||1,1,32768);if(s.aspectLock&&s.physical[1]>0){s.nativeResolution.width=clamp(Math.round(s.nativeResolution.height*s.physical[0]/s.physical[1]),1,32768);$('nativeW').value=s.nativeResolution.width;}});
 if(s.mappingSpace==='stage'){
  for(const id of ['cropX','cropY','cropW','cropH','ledX','ledY','ledW','ledH','sX','sY','sW','sH','rotation','flipX','flipY','fitSelect']){const el=$(id);if(el){el.disabled=true;el.title=(typeof window==='undefined'?"Dùng Crop riêng để sửa giá trị này.":window.tr?.("Dùng Crop riêng để sửa giá trị này.","Use Manual crop to edit this value.")??"Dùng Crop riêng để sửa giá trị này.");}}
  for(const id of ['cropFull','cropByMap'])if($(id))$(id).disabled=true;
  if($('cropCanvas')){$('cropCanvas').style.pointerEvents='none';$('cropCanvas').title=(typeof window==='undefined'?"Map không gian bị khóa. Chuyển sang Crop riêng để sửa.":window.tr?.("Map không gian bị khóa. Chuyển sang Crop riêng để sửa.","Spatial map is locked. Switch to Manual crop to edit.")??"Map không gian bị khóa. Chuyển sang Crop riêng để sửa.");}
 }
 const asset=engine.media.get(s.source);
 if(asset&&$('assignAll')){
  const b=$('assignAll');b.textContent=(typeof window==='undefined'?"Gán master · chọn kiểu map":window.tr?.("Gán master · chọn kiểu map","Assign master · choose mapping mode")??"Gán master · chọn kiểu map");b.onclick=()=>{
   dialog((typeof window==='undefined'?"Video master thuộc kiểu nào?":window.tr?.("Video master thuộc kiểu nào?","What type of master video is this?")??"Video master thuộc kiểu nào?"),`<p><b>${esc(asset.name)}</b> \u00b7 ${asset.width} \u00d7 ${asset.height} px</p><p><b>${(typeof window==='undefined'?"Hình tổng sân khấu:":window.tr?.("Hình tổng sân khấu:","Full stage image:")??"Hình tổng sân khấu:")}</b>${(typeof window==='undefined'?" fit đồng nhất lên mặt đứng, giữ khoảng hở.":window.tr?.(" fit đồng nhất lên mặt đứng, giữ khoảng hở."," fit uniformly to the facade, preserving gaps.")??" fit đồng nhất lên mặt đứng, giữ khoảng hở.")}</p><p><b>${(typeof window==='undefined'?"Clip đã chia ô:":window.tr?.("Clip đã chia ô:","Tiled clip:")??"Clip đã chia ô:")}</b>${(typeof window==='undefined'?" dùng crop X/Y từng màn, không suy đoán bố cục clip từ model.":window.tr?.(" dùng crop X/Y từng màn, không suy đoán bố cục clip từ model."," use each screen's crop X/Y; do not infer clip layout from the model.")??" dùng crop X/Y từng màn, không suy đoán bố cục clip từ model.")}</p>`,[{label:(typeof window==='undefined'?"Hủy":window.tr?.("Hủy","Cancel")??"Hủy")},{label:(typeof window==='undefined'?"Clip đã chia ô":window.tr?.("Clip đã chia ô","Tiled clip")??"Clip đã chia ô"),action:()=>assignMaster(asset,{mode:'local'})},{label:(typeof window==='undefined'?"Hình tổng sân khấu":window.tr?.("Hình tổng sân khấu","Full stage image")??"Hình tổng sân khấu"),primary:true,action:()=>assignMaster(asset,{mode:'stage'})}]);
  };
 }
}
function surfaceHardwarePanel(s){
 const tLoc=(vi,en)=>(typeof window==='undefined'?vi:window.tr?.(vi,en)??vi);
 normalizeSurfaceHardware(s);
 const curve=computeCurvedSpanMeters(s);
 const geom=computeGeometricScreenLayout(s);
 const voidSet=new Set(s.virtualTiles);
 const maxPreviewCols=Math.min(s.cabCols,14),maxPreviewRows=Math.min(s.cabRows,10);
 const paintActive=typeof window!=='undefined'&&!!window._paintVoidsMode18;
 let colAngleHtml='<div class="cab-col-angles" style="display:grid;grid-template-columns:repeat('+maxPreviewCols+',1fr);gap:3px;margin:6px 0 2px;">';
 for(let c=0;c<maxPreviewCols;c++){
  const cDeg=Math.round(+(s.columnAnglesDeg?.[c]??s.panelAngleDeg??0));
  colAngleHtml+='<button type="button" class="btn small" data-col-angle="'+c+'" style="padding:2px 1px;font-size:11px;" title="'+tLoc('Click đổi góc khóa cơ khí cột C'+(c+1)+' (±5°..±30°)','Click to cycle mechanical lock angle on column C'+(c+1)+' (±5°..±30°)')+'">'+(cDeg>0?'+'+cDeg:cDeg)+'°</button>';
 }
 colAngleHtml+='</div>';
 let gridHtml='<div class="cab-void-grid" style="display:grid;grid-template-columns:repeat('+maxPreviewCols+',1fr);gap:3px;margin:4px 0 8px;">';
 for(let r=0;r<maxPreviewRows;r++){
  for(let c=0;c<maxPreviewCols;c++){
   const key=c+','+r,isVoid=voidSet.has(key);
   gridHtml+='<button type="button" class="btn small" data-void-tile="'+key+'" style="padding:3px 2px;font-size:11px;opacity:'+(isVoid?'0.32':'1')+';border-style:'+(isVoid?'dashed':'solid')+';" title="'+(isVoid?tLoc('Ô rỗng / Virtual Void','Virtual Void tile'):tLoc('Cabinet thật ('+(c+1)+','+(r+1)+')','Active cabinet ('+(c+1)+','+(r+1)+')'))+'">'+(isVoid?'∅':(c+1)+':'+(r+1))+'</button>';
  }
 }
 gridHtml+='</div>';
 const cabOpts=['<option value="">'+tLoc('-- Tùy chỉnh kích thước --','-- Custom dimensions --')+'</option>'].concat(Object.values(LED_CABINET_CATALOG).map(c=>`<option value="${c.id}" ${s.cabinetModelId===c.id?'selected':''}>${esc(c.brand+' · '+c.model)}</option>`)).join('');
 const procOpts=['<option value="">'+tLoc('-- Mặc định (650k px/port) --','-- Default (650k px/port) --')+'</option>'].concat(Object.values(LED_PROCESSOR_CATALOG).map(p=>`<option value="${p.id}" ${s.processorModelId===p.id?'selected':''}>${esc(p.brand+' '+p.model+' ('+p.ports+'P · '+(p.maxPixelsPerPort/1000).toFixed(0)+'k)')}</option>`)).join('');
 const shapeOpts=[['flat',tLoc('Phẳng (Flat Wall)','Flat Wall')],['arc',tLoc('Màn cong (Curved Arc)','Curved Arc')],['l_corner_90',tLoc('Góc vuông 90° (L-Corner)','90° L-Corner')],['cube',tLoc('Khối Cube 4/5 mặt','4/5-Face Cube')],['cylinder_360',tLoc('Trụ tròn 360° (Cylinder)','360° Cylinder')]].map(([v,lbl])=>`<option value="${v}" ${(s.shapeType||'flat')===v?'selected':''}>${lbl}</option>`).join('');
 const splitOpts=[['full',tLoc('Toàn màn (Full Screen)','Full Screen')],['horiz_top_bot',tLoc('Ngang: Trên / Dưới (Horizontal Top/Bot)','Horizontal Top/Bot Split')],['vert_left_right',tLoc('Dọc: Trái / Phải (Vertical Left/Right)','Vertical Left/Right Split')]].map(([v,lbl])=>`<option value="${v}" ${(s.powerSplitMode||'full')===v?'selected':''}>${lbl}</option>`).join('');
 const curStart=s.wiringConfig?.startCorner||'Top-L';
 const cornerBtns=['Bot-L','Top-L','Bot-R','Top-R'].map(k=>`<button type="button" class="btn small ${curStart===k?'primary':''}" data-start-corner="${k}" style="font-size:11px;padding:3px 6px;">${k}</button>`).join('');
 const curveLocks=[-30,-20,-15,-10,-5,0,5,10,15,20,30].map(deg=>`<button type="button" class="btn small ${Math.round(s.panelAngleDeg||0)===deg?'primary':''}" data-curve-preset="${deg}" style="font-size:11px;padding:2px 5px;">${deg>0?'+'+deg:deg}°</button>`).join('');
 return `<div class="inspector-block hardware-led-panel"><h3 class="block-title"><svg class="ico ico-led" aria-hidden="true"><use href="#i-grid-3x3"></use></svg><span>${tLoc("Cabinet, Góc cong & Đi dây","Cabinet, Curve & Wiring")}</span></h3>
 <div class="field"><label>${tLoc('Model Tủ LED (Touring Catalog)','LED Cabinet Model (Touring Catalog)')}</label><select id="surfCabinetModel">${cabOpts}</select></div>
 <div class="field"><label>${tLoc('LED Processor (Giới hạn Port)','LED Processor (Port Limit)')}</label><select id="surfProcessorModel">${procOpts}</select></div>
 <div class="field-grid two">${field('surfCabW',tLoc('Rộng Cab (mm)','Cab Width (mm)'),s.cabW,{min:100,max:2000,step:50})}${field('surfCabH',tLoc('Cao Cab (mm)','Cab Height (mm)'),s.cabH,{min:100,max:2000,step:50})}</div>
 <div class="field-grid two">${field('surfRows1000',tLoc('Hàng 500×1000','500×1000 Rows'),s.rows500x1000||0,{min:0,max:64,step:1})}${field('surfRows500',tLoc('Hàng 500×500','500×500 Rows'),s.rows500x500||0,{min:0,max:64,step:1})}</div>
 <div class="field"><label>${tLoc('Hình học màn hình (Screen Geometry)','Screen Geometry')}</label><select id="surfShapeType">${shapeOpts}</select></div>
 <div class="field-grid two">${field('surfAngleDeg',tLoc('Góc khóa cong (±5°..±30°/cab)','Curve lock (±5°..±30°/cab)'),s.panelAngleDeg,{min:-30,max:30,step:2.5})}<div class="field"><label>${tLoc("Đi dây tín hiệu","Signal wiring")}</label><select id="surfWiringOrder"><option value="snake-tl-h">${tLoc('Ziczac Ngang · Trái-Trên (H-TL)','Horizontal Snake · Top-Left (H-TL)')}</option><option value="snake-tr-h">${tLoc('Ziczac Ngang · Phải-Trên (H-TR)','Horizontal Snake · Top-Right (H-TR)')}</option><option value="snake-bl-h">${tLoc('Ziczac Ngang · Trái-Dưới (H-BL)','Horizontal Snake · Bottom-Left (H-BL)')}</option><option value="snake-br-h">${tLoc('Ziczac Ngang · Phải-Dưới (H-BR)','Horizontal Snake · Bottom-Right (H-BR)')}</option><option value="snake-tl-v">${tLoc('Ziczac Dọc · Trái-Trên (V-TL)','Vertical Snake · Top-Left (V-TL)')}</option><option value="snake-tr-v">${tLoc('Ziczac Dọc · Phải-Trên (V-TR)','Vertical Snake · Top-Right (V-TR)')}</option><option value="snake-bl-v">${tLoc('Ziczac Dọc · Trái-Dưới (V-BL)','Vertical Snake · Bottom-Left (V-BL)')}</option><option value="snake-br-v">${tLoc('Ziczac Dọc · Phải-Dưới (V-BR)','Vertical Snake · Bottom-Right (V-BR)')}</option></select></div></div>
 <div class="field"><label>${tLoc('Khóa góc cơ khí nhanh (Curvature Lock ±5°..±30°)','Quick Mechanical Curvature Lock (±5°..±30°)')}</label><div style="display:flex;flex-wrap:wrap;gap:3px;">${curveLocks}</div></div>
 <div class="field"><label>${tLoc('Góc bắt đầu đi dây (Corner Start)','Wiring Start Corner')}</label><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">${cornerBtns}</div></div>
 <div class="field"><label>${tLoc('Chia nguồn màn hình (Power Split)','Screen Power Split')}</label><select id="surfPowerSplitMode">${splitOpts}</select></div>
 <label class="check-row" style="margin:4px 0;"><input type="checkbox" id="surfSafetyGap16" ${(s.safetyGapPx||0)>=16?'checked':''}><span>${tLoc(' Biên an toàn 16px Safety Gap (Pixel Mapper)',' 16px Safety Gap Border (Pixel Mapper)')}</span></label>
 <div class="metric-pair"><div><b>${s.activeCabinets}/${s.totalCabinetGrid} cab</b><span>${tLoc(`Lưới ${s.cabCols}×${s.cabRows} · ${s.totalWeightKg} kg`,`Grid ${s.cabCols}×${s.cabRows} · ${s.totalWeightKg} kg`)}</span></div><div><b>${geom.footprintWidthM}×${geom.footprintDepthM} m</b><span>${tLoc(`Dây cung ${curve.chordWidthM} m · Sâu ${curve.depthOffsetM} m`,`Chord ${curve.chordWidthM} m · Depth ${curve.depthOffsetM} m`)}</span></div></div>
 <div class="actions-row" style="margin-top:6px;"><button type="button" class="btn ${paintActive?'primary':''}" id="surfPaintVoidsBtn">${tLoc('Đục rỗng Panel Ảo [Phím B]','Paint Voids [Key B]')}</button><button type="button" class="btn" id="exportSurfTestCardBtn">${tLoc('Xuất Test Card 1:1','Export 1:1 Test Card')}</button></div>
 <div class="actions-row" style="margin-top:4px;"><button type="button" class="btn small" id="surfCurve3SecBtn">${tLoc('Chia 3 đoạn cong (A/B/C)','3-Section Curve (A/B/C)')}</button><button type="button" class="btn small" id="surfMirrorWingBtn">${tLoc('Đối xứng Wing 3D (L/R)','Mirror Wing 3D (L/R)')}</button></div>
 <div style="margin:6px 0;">${renderCurvatureSectionsSvg(s)}</div>
 <p class="hint-text">${tLoc('Góc từng cột & Lưới <b>Virtual Tile (Ô rỗng [B])</b> — click hoặc giữ chuột quét:','Per-column angles & <b>Virtual Tile (Void [B])</b> grid — click or drag to paint:')}</p>${colAngleHtml}${gridHtml}</div>`;
}
function bindSurfaceHardwarePanel(s){
 if($('surfWiringOrder'))$('surfWiringOrder').value=s.wiringOrder||'snake-tl-h';
 change('surfCabinetModel',v=>{
  s.cabinetModelId=v||null;
  if(v&&LED_CABINET_CATALOG[v]){
   const cat=LED_CABINET_CATALOG[v];
   s.cabinetSpec={...s.cabinetSpec,modelId:cat.id,widthMm:cat.widthMm,heightMm:cat.heightMm,pxW:cat.pxW,pxH:cat.pxH,weightKg:cat.weightKg,maxPowerW:cat.maxPowerW,avgPowerW:cat.avgPowerW,nits:cat.nits,pitchMm:cat.pitchMm};
   delete s.rows500x1000;delete s.rows500x500;
  }
  normalizeSurfaceHardware(s);renderInspector();
 });
 change('surfProcessorModel',v=>{
  s.processorModelId=v||null;
  if(v&&LED_PROCESSOR_CATALOG[v]){
   s.maxPixelsPerPort=LED_PROCESSOR_CATALOG[v].maxPixelsPerPort;
   if(s.wiringConfig)s.wiringConfig.maxPixelsPerPort=s.maxPixelsPerPort;
  }
  normalizeSurfaceHardware(s);renderInspector();
 });
 change('surfCabW',v=>{s._cabWOverride=clamp(Math.round(+v)||500,100,2000);normalizeSurfaceHardware(s);renderInspector();});
 change('surfCabH',v=>{s._cabHOverride=clamp(Math.round(+v)||500,100,2000);delete s.rows500x1000;delete s.rows500x500;normalizeSurfaceHardware(s);renderInspector();});
 change('surfRows1000',v=>{s.rows500x1000=clamp(Math.round(+v)||0,0,64);s.rows500x500=clamp(Math.round(+(s.rows500x500??0)),0,64);normalizeSurfaceHardware(s);renderInspector();});
 change('surfRows500',v=>{s.rows500x500=clamp(Math.round(+v)||0,0,64);s.rows500x1000=clamp(Math.round(+(s.rows500x1000??0)),0,64);normalizeSurfaceHardware(s);renderInspector();});
 change('surfShapeType',v=>{s.shapeType=v||'flat';normalizeSurfaceHardware(s);rebuildSurface3DMesh(s);renderInspector();});
 change('surfAngleDeg',v=>{s.panelAngleDeg=clamp(+v||0,-30,30);s.columnAnglesDeg=Array.from({length:s.cabCols||1},()=>s.panelAngleDeg);normalizeSurfaceHardware(s);rebuildSurface3DMesh(s);renderInspector();});
 change('surfWiringOrder',v=>{s.wiringOrder=v;if(s.wiringConfig){delete s.wiringConfig.pattern;delete s.wiringConfig.startCorner;}normalizeSurfaceHardware(s);renderInspector();});
 change('surfPowerSplitMode',v=>{s.powerSplitMode=v||'full';if(s.wiringConfig)s.wiringConfig.powerSplitMode=s.powerSplitMode;normalizeSurfaceHardware(s);renderInspector();});
 change('surfSafetyGap16',v=>{s.safetyGapPx=v?16:0;if(s.wiringConfig)s.wiringConfig.safetyGapPx=s.safetyGapPx;if(typeof live!=='undefined'&&live.pixelOptions)live.pixelOptions.gap=v?16:8;normalizeSurfaceHardware(s);renderInspector();});
 document.querySelectorAll('[data-curve-preset]').forEach(btn=>{
  btn.onclick=()=>{checkpoint();const deg=clamp(+btn.dataset.curvePreset||0,-30,30);setColumnCurvatureAngle(s,'all',deg);renderInspector();};
 });
 document.querySelectorAll('[data-col-angle]').forEach(btn=>{
  btn.onclick=()=>{
   checkpoint();
   const col=+btn.dataset.colAngle;
   const steps=[-30,-20,-15,-10,-5,0,5,10,15,20,30];
   const cur=Math.round(+(s.columnAnglesDeg?.[col]??s.panelAngleDeg??0));
   const nextIdx=(steps.indexOf(cur)+1)%steps.length;
   setColumnCurvatureAngle(s,col,steps[nextIdx>=0?nextIdx:5]);
   renderInspector();
  };
 });
 document.querySelectorAll('[data-start-corner]').forEach(btn=>{
  btn.onclick=()=>{
   checkpoint();
   const corner=btn.dataset.startCorner;
   const map={'Top-L':'snake-tl-h','Top-R':'snake-tr-h','Bot-L':'snake-bl-h','Bot-R':'snake-br-h'};
   s.wiringOrder=map[corner]||'snake-tl-h';
   if(s.wiringConfig){s.wiringConfig={...s.wiringConfig,startCorner:corner};delete s.wiringConfig.pattern;}
   normalizeSurfaceHardware(s);renderInspector();
  };
 });
 if($('surfPaintVoidsBtn'))$('surfPaintVoidsBtn').onclick=()=>{
  window._paintVoidsMode18=!window._paintVoidsMode18;
  renderInspector();
 };
 if($('exportSurfTestCardBtn'))$('exportSurfTestCardBtn').onclick=()=>exportSurfaceCalibrationPng(s);
 if($('surfCurve3SecBtn'))$('surfCurve3SecBtn').onclick=()=>{
  checkpoint();
  const cols=Math.max(1,s.cabCols||1),c1=Math.max(1,Math.floor(cols/3)),c2=Math.max(1,Math.floor(cols/3));
  applyCurvatureSections(s,[
   {id:'A',label:'Sec A',startCol:0,endCol:c1,mode:'concave',angleDeg:-10},
   {id:'B',label:'Sec B',startCol:c1,endCol:Math.min(cols,c1+c2),mode:'locked_flat',angleDeg:0},
   {id:'C',label:'Sec C',startCol:Math.min(cols,c1+c2),endCol:cols,mode:'convex',angleDeg:10}
  ]);
  renderInspector();
 };
 if($('surfMirrorWingBtn'))$('surfMirrorWingBtn').onclick=()=>{
  checkpoint();
  const partner=engine.surfaces.find(x=>x.id!==s.id&&(/WING/i.test(x.name)||x.name===String(s.name||'').replace(/_L$/i,'_R').replace(/_R$/i,'_L')))||null;
  mirrorWingSurface3D(s,partner,{mirrorCurve:true});
  renderUI();
 };
 let painting=false;
 const paintTile=btn=>{
  if(!painting){
   checkpoint();painting=true;
   const finish=()=>{document.removeEventListener('pointerup',finish);document.removeEventListener('pointercancel',finish);painting=false;renderInspector();};
   document.addEventListener('pointerup',finish);
   document.addEventListener('pointercancel',finish);
  }
  const [c,r]=btn.dataset.voidTile.split(',').map(Number);
  const isVoid=toggleVirtualTile(s,c,r,true);
  btn.style.opacity=isVoid?'0.32':'1';btn.style.borderStyle=isVoid?'dashed':'solid';btn.textContent=isVoid?'∅':(c+1)+':'+(r+1);
 };
 document.querySelectorAll('[data-void-tile]').forEach(btn=>{
  btn.onclick=e=>{if(window._paintVoidsMode18&&e?.detail!==0)return;checkpoint();const [c,r]=btn.dataset.voidTile.split(',').map(Number);toggleVirtualTile(s,c,r);renderInspector();};
  btn.onpointerdown=e=>{if(window._paintVoidsMode18&&e.button===0)paintTile(btn);};
  btn.onpointerenter=e=>{if(window._paintVoidsMode18&&e.buttons===1)paintTile(btn);};
 });
}
function lightingInspector(){
 const l=engine.lights.find(x=>x.id===state.selectedLight)||engine.lights[0];if(l)state.selectedLight=l.id;
 $('inspectorKicker').textContent=(typeof window==='undefined'?"Ánh sáng":window.tr?.("Ánh sáng","Lighting")??"Ánh sáng");$('inspectorTitle').textContent=(typeof window==='undefined'?"Đèn gắn trên model":window.tr?.("Đèn gắn trên model","Model-mounted lights")??"Đèn gắn trên model");$('inspectorSubtitle').textContent=(typeof window==='undefined'?"Chọn vị trí thật, rồi chọn điểm chiếu. Không dựng lại dàn đèn.":window.tr?.("Chọn vị trí thật, rồi chọn điểm chiếu. Không dựng lại dàn đèn.","Select actual positions, then targets. Existing rig preserved.")??"Chọn vị trí thật, rồi chọn điểm chiếu. Không dựng lại dàn đèn.");
 const box=$('inspectorContent');box.innerHTML=spatialWorkflowPanel()+`<div class="inspector-block"><h3 class="block-title"><svg class="ico ico-lights" aria-hidden="true"><use href="#i-lightbulb"></use></svg><span>${(typeof window==='undefined'?"1. Chọn đèn / ":window.tr?.("1. Chọn đèn / ","1. Select light / ")??"1. Chọn đèn / ")}${engine.lights.length} of 16</span></h3><button class="btn primary full-btn" id="pickModelLight">${(typeof window==='undefined'?"+ Chọn đèn trên model":window.tr?.("+ Chọn đèn trên model","+ Select model light")??"+ Chọn đèn trên model")}</button><button class="btn full-btn" id="placeNewLight">${(typeof window==='undefined'?"+ Đặt đèn mới trên model":window.tr?.("+ Đặt đèn mới trên model","+ Place new light on model")??"+ Đặt đèn mới trên model")}</button><p class="hint-text">${(typeof window==='undefined'?"Click mặt kính đèn → click điểm chiếu. Đèn có sẵn không bị nhân đôi vỏ 3D.":window.tr?.("Click mặt kính đèn → click điểm chiếu. Đèn có sẵn không bị nhân đôi vỏ 3D.","Click the fixture lens, then its target. Existing 3D fixture bodies are not duplicated.")??"Click mặt kính đèn → click điểm chiếu. Đèn có sẵn không bị nhân đôi vỏ 3D.")}</p></div>${l?`<div class="divider"></div><div class="inspector-block"><h3 class="block-title"><svg class="ico ico-lights" aria-hidden="true"><use href="#i-lightbulb"></use></svg><span>${(typeof window==='undefined'?"2. Đèn đang chọn":window.tr?.("2. Đèn đang chọn","2. Selected light")??"2. Đèn đang chọn")}</span></h3>${field('anchorLightName',(typeof window==='undefined'?"Tên đèn":window.tr?.("Tên đèn","Light name")??"Tên đèn"),l.name,{type:'text'})}<div class="binding-status">${l.origin==='model'?'MODEL / '+esc(l.sourceMeshName||'lens'):(typeof window==='undefined'?"PROXY / kích thước mét":window.tr?.("PROXY / kích thước mét","PROXY / dimensions in meters")??"PROXY / kích thước mét")}</div><div class="actions-row"><button class="btn" id="repickLight">${(typeof window==='undefined'?"Chọn lại vị trí":window.tr?.("Chọn lại vị trí","Reselect position")??"Chọn lại vị trí")}</button><button class="btn" id="pickLightTarget">${(typeof window==='undefined'?"Chọn điểm chiếu":window.tr?.("Chọn điểm chiếu","Select target")??"Chọn điểm chiếu")}</button></div><label class="check-row"><input id="lightEnabled" type="checkbox" ${l.enabled?'checked':''}>${(typeof window==='undefined'?" Bật đèn":window.tr?.(" Bật đèn"," Enable light")??" Bật đèn")}</label><div class="field"><label>${(typeof window==='undefined'?"Màu":window.tr?.("Màu","Color")??"Màu")}</label><input type="color" id="lightColor" value="${l.color}"></div>${range('lightPower',(typeof window==='undefined'?"Cường độ":window.tr?.("Cường độ","Intensity")??"Cường độ"),l.power,0,12,.1)}${range('lightBoost',(typeof window==='undefined'?"Tăng sáng":window.tr?.("Tăng sáng","Boost")??"Tăng sáng"),l.boost??1,.2,3,.05)}${range('lightAngle',(typeof window==='undefined'?"Nửa góc chùm (độ)":window.tr?.("Nửa góc chùm (độ)","Beam half-angle (degrees)")??"Nửa góc chùm (độ)"),l.angle,1,60,1)}<label class="check-row"><input id="lightSweep" type="checkbox" ${l.sweep?'checked':''}>${(typeof window==='undefined'?" Quét quanh điểm chiếu":window.tr?.(" Quét quanh điểm chiếu"," Sweep around target")??" Quét quanh điểm chiếu")}</label>${range('lightSpeed',(typeof window==='undefined'?"Tốc độ quét":window.tr?.("Tốc độ quét","Sweep speed")??"Tốc độ quét"),l.speed||.35,.05,1.5,.05)}<div class="field"><label>${(typeof window==='undefined'?"Hiệu ứng":window.tr?.("Hiệu ứng","Effect")??"Hiệu ứng")}</label><select id="lightFX">${[['steady',(typeof window==='undefined'?"Sáng liên tục":window.tr?.("Sáng liên tục","Steady")??"Sáng liên tục")],['pulse',(typeof window==='undefined'?"Pulse / nhịp":window.tr?.("Pulse / nhịp","Pulse")??"Pulse / nhịp")],['build',(typeof window==='undefined'?"Build / tăng dần":window.tr?.("Build / tăng dần","Build up")??"Build / tăng dần")],['strobe',(typeof window==='undefined'?"Strobe / nhấp nháy":window.tr?.("Strobe / nhấp nháy","Strobe")??"Strobe / nhấp nháy")]].map(([v,n])=>`<option value="${v}" ${(l.fx||'steady')===v?'selected':''}>${n}</option>`).join('')}</select></div>${range('lightFXDepth',(typeof window==='undefined'?"Độ sâu FX":window.tr?.("Độ sâu FX","FX depth")??"Độ sâu FX"),l.fxDepth??.55,0,1,.05)}${range('lightFXSpeed',(typeof window==='undefined'?"Tốc độ FX":window.tr?.("Tốc độ FX","FX speed")??"Tốc độ FX"),l.fxSpeed??2.2,.1,12,.1)}<p class="micro-note">${(typeof window==='undefined'?"Strobe tạo hình nhấp nháy. Không bật khi người xem nhạy cảm với hiệu ứng này.":window.tr?.("Strobe tạo hình nhấp nháy. Không bật khi người xem nhạy cảm với hiệu ứng này.","Strobe creates flashing images. Do not enable it for viewers sensitive to flashing.")??"Strobe tạo hình nhấp nháy. Không bật khi người xem nhạy cảm với hiệu ứng này.")}</p><h3 class="block-title">${(typeof window==='undefined'?"Vị trí / mét":window.tr?.("Vị trí / mét","Position / meters")??"Vị trí / mét")}</h3><div class="field-grid three">${l.pos.map((v,i)=>field('pos'+i,['X','Y','Z'][i],Number(v.toFixed(4)),{step:.01})).join('')}</div><h3 class="block-title">${(typeof window==='undefined'?"Điểm chiếu / mét":window.tr?.("Điểm chiếu / mét","Target / meters")??"Điểm chiếu / mét")}</h3><div class="field-grid three">${l.target.map((v,i)=>field('target'+i,['X','Y','Z'][i],Number(v.toFixed(4)),{step:.01})).join('')}</div>${l.origin==='model'?(typeof window==='undefined'?"<p class=\"hint-text\">Giữ nguyên kích thước vỏ đèn của model.</p>":window.tr?.("<p class=\"hint-text\">Giữ nguyên kích thước vỏ đèn của model.</p>","<p class=\"hint-text\">Preserve the model's fixture body dimensions.</p>")??"<p class=\"hint-text\">Giữ nguyên kích thước vỏ đèn của model.</p>"):`<h3 class="block-title">${(typeof window==='undefined'?"Vỏ đèn proxy / mm":window.tr?.("Vỏ đèn proxy / mm","Proxy fixture / mm")??"Vỏ đèn proxy / mm")}</h3><div class="field-grid three">${(l.fixtureSize||[.3,.38,.3]).map((v,i)=>field('fixtureSize'+i,[(typeof window==='undefined'?"Rộng":window.tr?.("Rộng","Width")??"Rộng"),(typeof window==='undefined'?"Cao":window.tr?.("Cao","Height")??"Cao"),(typeof window==='undefined'?"Sâu":window.tr?.("Sâu","Depth")??"Sâu")][i],Math.round(v*1000),{min:10,max:5000})).join('')}</div>`}<button class="btn danger full-btn" id="deleteAnchoredLight">${(typeof window==='undefined'?"Xóa nguồn sáng (giữ model)":window.tr?.("Xóa nguồn sáng (giữ model)","Delete light source (keep model)")??"Xóa nguồn sáng (giữ model)")}</button></div>`:(typeof window==='undefined'?"<div class=\"info-box\">Chưa có nguồn sáng được gắn. Model của bạn không bị thêm dàn đèn mẫu.</div>":window.tr?.("<div class=\"info-box\">Chưa có nguồn sáng được gắn. Model của bạn không bị thêm dàn đèn mẫu.</div>","<div class=\"info-box\">No attached light sources. No demo lighting rig is added to your model.</div>")??"<div class=\"info-box\">Chưa có nguồn sáng được gắn. Model của bạn không bị thêm dàn đèn mẫu.</div>")}<div class="divider"></div><div class="inspector-block"><h3 class="block-title">${(typeof window==='undefined'?"3. Look / giữ vị trí đèn":window.tr?.("3. Look / giữ vị trí đèn","3. Look / preserve light positions")??"3. Look / giữ vị trí đèn")}</h3><div class="preset-grid">${[['concert',(typeof window==='undefined'?"Hòa nhạc":window.tr?.("Hòa nhạc","Concert")??"Hòa nhạc")],['warm',(typeof window==='undefined'?"Ấm / gala":window.tr?.("Ấm / gala","Warm / gala")??"Ấm / gala")],['cool',(typeof window==='undefined'?"Lạnh / phủ sáng":window.tr?.("Lạnh / phủ sáng","Cool / wash")??"Lạnh / phủ sáng")],['blackout',(typeof window==='undefined'?"Tắt toàn bộ":window.tr?.("Tắt toàn bộ","Blackout")??"Tắt toàn bộ")]].map(([v,n])=>`<button class="preset lighting-preset" data-rig="${v}"><span>${n}</span></button>`).join('')}</div><div class="preset-grid" style="margin-top:8px">${[['boost',(typeof window==='undefined'?"Tăng đèn":window.tr?.("Tăng đèn","Boost")??"Tăng đèn")],['pulse',(typeof window==='undefined'?"Nhịp sáng":window.tr?.("Nhịp sáng","Pulse")??"Nhịp sáng")],['steady',(typeof window==='undefined'?"Sáng liên tục":window.tr?.("Sáng liên tục","Steady")??"Sáng liên tục")],['sweep',(typeof window==='undefined'?"Quét":window.tr?.("Quét","Sweep")??"Quét")]].map(([v,n])=>`<button class="preset lighting-preset" data-lookfx="${v}"><span>${n}</span></button>`).join('')}</div>${range('ambientLight',(typeof window==='undefined'?"Môi trường":window.tr?.("Môi trường","Ambient")??"Môi trường"),engine.settings.ambient,.05,1.5,.05)}${range('beamPower',(typeof window==='undefined'?"Chùm sáng / sương":window.tr?.("Chùm sáng / sương","Beam / haze")??"Chùm sáng / sương"),engine.settings.beam,0,1,.05)}${range('haze',(typeof window==='undefined'?"Sương xa":window.tr?.("Sương xa","Distant haze")??"Sương xa"),engine.settings.haze,0,80,1)}${range('exposureLight',(typeof window==='undefined'?"Phơi sáng":window.tr?.("Phơi sáng","Exposure")??"Phơi sáng"),engine.settings.exposure,.3,2.5,.05)}<button class="btn primary full-btn" id="presentInspector">${(typeof window==='undefined'?"Trình diễn":window.tr?.("Trình diễn","Present")??"Trình diễn")}</button><p class="hint-text">${(typeof window==='undefined'?"Xem trước màu/beam. Không phải lux/IES, không xuất DMX.":window.tr?.("Xem trước màu/beam. Không phải lux/IES, không xuất DMX.","Color/beam preview. Not lux/IES; no DMX output here.")??"Xem trước màu/beam. Không phải lux/IES, không xuất DMX.")}</p></div>`;
 $('pickModelLight').onclick=()=>startSpatialPick('light-existing');$('placeNewLight').onclick=()=>startSpatialPick('light-new');
 if(l){
  change('anchorLightName',v=>l.name=v);change('lightEnabled',v=>l.enabled=v);change('lightColor',v=>l.color=v,{live:true});
  for(const [id,key]of [['lightPower','power'],['lightBoost','boost'],['lightAngle','angle'],['lightSpeed','speed'],['lightFXDepth','fxDepth'],['lightFXSpeed','fxSpeed']])change(id,v=>l[key]=+v,{live:true});
  change('lightSweep',v=>l.sweep=v);change('lightFX',v=>l.fx=v);
  $('repickLight').onclick=()=>startSpatialPick('light-position');$('pickLightTarget').onclick=()=>startSpatialPick('light-target');
  for(let i=0;i<3;i++){change('pos'+i,v=>{if(Number.isFinite(+v)){l.pos[i]=+v;engine.rebuildFixtures();}});change('target'+i,v=>{if(Number.isFinite(+v))l.target[i]=+v;});change('fixtureSize'+i,v=>{l.fixtureSize||=[.3,.38,.3];l.fixtureSize[i]=clamp(+v||300,10,5000)/1000;engine.rebuildFixtures();});}
  $('deleteAnchoredLight').onclick=()=>{checkpoint();engine.lights=engine.lights.filter(x=>x.id!==l.id);state.selectedLight=engine.lights[0]?.id;engine.rebuildFixtures();renderUI();};
 }
 document.querySelectorAll('[data-rig]').forEach(b=>b.onclick=()=>rigPreset(b.dataset.rig));
 document.querySelectorAll('[data-lookfx]').forEach(b=>b.onclick=()=>{if(!engine.lights.length){toast((typeof window==='undefined'?"Chọn đèn trước.":window.tr?.("Chọn đèn trước.","Select a light first.")??"Chọn đèn trước."));return;}lightingFXPreset(b.dataset.lookfx);if(b.dataset.lookfx==='steady')for(const l of engine.lights)l.sweep=false;});
 for(const [id,key]of [['ambientLight','ambient'],['beamPower','beam'],['haze','haze'],['exposureLight','exposure']])change(id,v=>engine.settings[key]=+v,{live:true});
 $('presentInspector').onclick=togglePresentation;
}
renderInspector=function(){
 if(state.step==='lighting')lightingInspector();else{
  V031.renderInspector();
  const panel=$('inspectorContent');panel.insertAdjacentHTML('afterbegin',spatialWorkflowPanel());
  const s=surface();if(state.step==='mapping'&&s){panel.insertAdjacentHTML('afterbegin',surfaceHardwarePanel(s));panel.insertAdjacentHTML('afterbegin',spatialMappingPanel(s));bindSpatialMappingPanel(s);bindSurfaceHardwarePanel(s);}
  if(state.step==='stage'){
   const mesh=engine.stage.find(m=>m.id===state.selectedMesh);
   if(mesh){const div=document.createElement('div');div.className='inspector-block';div.innerHTML=(typeof window==='undefined'?"<h3 class=\"block-title\">Object đèn trên model?</h3><button class=\"btn full-btn\" id=\"meshAsLight\">Chọn mặt kính đèn → điểm chiếu</button>":window.tr?.("<h3 class=\"block-title\">Object đèn trên model?</h3><button class=\"btn full-btn\" id=\"meshAsLight\">Chọn mặt kính đèn → điểm chiếu</button>","<h3 class=\"block-title\">Light object on the model?</h3><button class=\"btn full-btn\" id=\"meshAsLight\">Select fixture lens → target</button>")??"<h3 class=\"block-title\">Object đèn trên model?</h3><button class=\"btn full-btn\" id=\"meshAsLight\">Chọn mặt kính đèn → điểm chiếu</button>");panel.prepend(div);$('meshAsLight').onclick=()=>startSpatialPick('light-existing');}
  }
 }
 if($('openFrame'))$('openFrame').onclick=referenceFrameDialog;if($('measureFrame'))$('measureFrame').onclick=()=>startSpatialPick('measure');
};
bindMaster=function(){
 V031.bindMaster();
 const hasSpatial=engine.surfaces.some(s=>s.mappingSpace==='stage');
 if(hasSpatial){
  for(const id of ['masterW','masterH'])if($(id))$(id).onchange=()=>rebuildSpatialMap({width:+$('masterW').value,height:+$('masterH').value,activate:false});
  if($('packBtn')){$('packBtn').textContent=(typeof window==='undefined'?"Cập nhật bố cục sân khấu":window.tr?.("Cập nhật bố cục sân khấu","Update stage layout")??"Cập nhật bố cục sân khấu");$('packBtn').onclick=()=>rebuildSpatialMap({activate:true});}
 }
};
renderLists=function(){
 V031.renderLists();
 if($('spatialMapBtn'))$('spatialMapBtn').style.display=state.step==='lighting'?'none':'';
 if($('pickLightSidebar'))$('pickLightSidebar').style.display=state.step==='lighting'?'':'none';
};
renderUI=function(){V031.renderUI();if($('frameStatus'))$('frameStatus').textContent=(typeof window==='undefined'?"m / tỷ lệ ":window.tr?.("m / tỷ lệ ","m / scale ")??"m / tỷ lệ ")+scaleFmt(engine.coordinates?.config.scale||1);};
renderOverlays=function(){
 V031.renderOverlays();if(state.presenting||engine.view!=='stage')return;
 const hud=$('hudLabels'),overlay=$('mapOverlay'),g=overlay.getContext('2d'),dpr=overlay.width/Math.max(1,overlay.clientWidth);
 const marker=(pos,text,cls)=>{const p=engine.project(pos);if(!p||p.z>1||p.z<-1)return null;const span=document.createElement('span');span.className=cls;span.style.left=p.x+'px';span.style.top=p.y+'px';span.textContent=text;hud.appendChild(span);return span;};
 if(engine.showGuides&&state.step==='lighting')for(let i=0;i<engine.lights.length;i++){
  const l=engine.lights[i],m=marker(l.pos,'L'+(i+1),'light-anchor '+(state.selectedLight===l.id?'selected':''));
  if(m){m.style.pointerEvents='auto';m.onclick=()=>{state.selectedLight=l.id;renderUI();};}
  if(state.selectedLight===l.id){const p=engine.project(l.pos),q=engine.project(l.target);marker(l.target,'+','light-target');if(p&&q){g.save();g.strokeStyle='#f6c677';g.setLineDash([5*dpr,5*dpr]);g.beginPath();g.moveTo(p.x*dpr,p.y*dpr);g.lineTo(q.x*dpr,q.y*dpr);g.stroke();g.restore();}}
 }
 if(state.pendingLight)marker(state.pendingLight.hit.point,'L?','light-anchor pending');
 for(let i=0;i<(state.measurePoints||[]).length;i++)marker(state.measurePoints[i],String(i+1),'quad-marker');
 if(engine.view==='stage'&&engine.showGuides){
  const origin=engine.stageBounds?engine.stageBounds.min:[0,0,0],p=engine.project(origin),len=Math.max(.3,Math.min(2,engine.size.width*.1));
  if(p){for(const [axis,color,name]of [[[1,0,0],'#f28e87','X'],[[0,1,0],'#7bd59f','Y'],[[0,0,1],'#7da9ff','Z']]){const q=engine.project(M.add(origin,M.mul(axis,len)));if(q&&q.z<1){g.save();g.strokeStyle=color;g.fillStyle=color;g.lineWidth=2;g.beginPath();g.moveTo(p.x*dpr,p.y*dpr);g.lineTo(q.x*dpr,q.y*dpr);g.stroke();g.font=(11*dpr)+'px sans-serif';g.fillText(name,q.x*dpr+3,q.y*dpr-4);g.restore();}}}
 }
};
function initSpatialEvents(){
 const tools=document.querySelector('.left-tools');
 const button=(id,label)=>{const b=document.createElement('button');b.id=id;b.className='btn small';b.textContent=label;tools.appendChild(b);return b;};
 button('spatialMapBtn',(typeof window==='undefined'?"▦ Map theo bố cục sân khấu":window.tr?.("▦ Map theo bố cục sân khấu","▦ Map to stage layout")??"▦ Map theo bố cục sân khấu")).onclick=activateSpatialLayout;
 button('pickLightSidebar',(typeof window==='undefined'?"+ Chọn đèn trên model":window.tr?.("+ Chọn đèn trên model","+ Select model light")??"+ Chọn đèn trên model")).onclick=()=>startSpatialPick('light-existing');
 const status=document.createElement('span');status.id='frameStatus';status.className='frame-status';document.querySelector('.view-actions').prepend(status);
 $('autoDetect').textContent=(typeof window==='undefined'?"Nhận diện LED":window.tr?.("Nhận diện LED","Detect LEDs")??"Nhận diện LED");
 $('helpBtn').onclick=()=>dialog((typeof window==='undefined'?"V0.4 / cùng hệ quy chiếu":window.tr?.("V0.4 / cùng hệ quy chiếu","Shared reference frame")??"V0.4 / cùng hệ quy chiếu"),(typeof window==='undefined'?"<h3>1. Kiểm tra tỷ lệ</h3><p>Nhập GLB/DAE/OBJ. Xem kích thước mét. Cần sửa: Hệ quy chiếu hoặc Đo 2 điểm.</p><h3>2. Gắn LED</h3><p>Chọn mặt phát hình. Map theo bố cục sân khấu giữ nguyên khoảng hở và góc nghiêng. Nhập pixel LED thực riêng khi có số liệu.</p><h3>3. Chọn đúng kiểu video</h3><p>Hình tổng: spatial master. Clip đã chia ô: manual crop. Không thể tự suy ra bố cục clip đó từ model.</p><h3>4. Đèn</h3><p>Click mặt kính đèn trên model, sau đó click điểm chiếu. Preset chỉ thay đổi look, không di chuyển đèn.</p><h3>5. Lưu</h3><p>File .ledstudio lưu cả hệ quy chiếu, mapping và nguồn sáng. Bản này là preview cục bộ; không có DMX hay cấu hình processor LED.</p>":window.tr?.("<h3>1. Kiểm tra tỷ lệ</h3><p>Nhập GLB/DAE/OBJ. Xem kích thước mét. Cần sửa: Hệ quy chiếu hoặc Đo 2 điểm.</p><h3>2. Gắn LED</h3><p>Chọn mặt phát hình. Map theo bố cục sân khấu giữ nguyên khoảng hở và góc nghiêng. Nhập pixel LED thực riêng khi có số liệu.</p><h3>3. Chọn đúng kiểu video</h3><p>Hình tổng: spatial master. Clip đã chia ô: manual crop. Không thể tự suy ra bố cục clip đó từ model.</p><h3>4. Đèn</h3><p>Click mặt kính đèn trên model, sau đó click điểm chiếu. Preset chỉ thay đổi look, không di chuyển đèn.</p><h3>5. Lưu</h3><p>File .ledstudio lưu cả hệ quy chiếu, mapping và nguồn sáng. Bản này là preview cục bộ; không có DMX hay cấu hình processor LED.</p>","<h3>1. Check scale</h3><p>Import GLB/DAE/OBJ. Check dimensions in meters. Adjust using Reference frame or Measure two points.</p><h3>2. Attach LEDs</h3><p>Select emitting faces. Stage layout mapping preserves gaps and angles. Enter actual LED pixels separately when known.</p><h3>3. Choose the correct video type</h3><p>Full image: spatial master. Tiled clip: manual crop. Clip layout cannot be inferred from the model.</p><h3>4. Lights</h3><p>Click a fixture lens on the model, then its target. Presets change looks without moving lights.</p><h3>5. Save</h3><p>The .ledstudio file saves the reference frame, mapping and light sources. This is a local preview; no DMX or LED processor configuration here.</p>")??"<h3>1. Kiểm tra tỷ lệ</h3><p>Nhập GLB/DAE/OBJ. Xem kích thước mét. Cần sửa: Hệ quy chiếu hoặc Đo 2 điểm.</p><h3>2. Gắn LED</h3><p>Chọn mặt phát hình. Map theo bố cục sân khấu giữ nguyên khoảng hở và góc nghiêng. Nhập pixel LED thực riêng khi có số liệu.</p><h3>3. Chọn đúng kiểu video</h3><p>Hình tổng: spatial master. Clip đã chia ô: manual crop. Không thể tự suy ra bố cục clip đó từ model.</p><h3>4. Đèn</h3><p>Click mặt kính đèn trên model, sau đó click điểm chiếu. Preset chỉ thay đổi look, không di chuyển đèn.</p><h3>5. Lưu</h3><p>File .ledstudio lưu cả hệ quy chiếu, mapping và nguồn sáng. Bản này là preview cục bộ; không có DMX hay cấu hình processor LED.</p>"));
}
const spatialAPI={applyCoordinateConfig,calculateFrame,measureFace,rebuildSpatialMap,activateSpatialLayout,manualCropMode,referenceFrameDialog,startSpatialPick,cancelSpatialPick,addAnchoredLight,handleSpatialClick,restoreSpatialBindings,normalizeSurfaceHardware,toggleVirtualTile,setColumnCurvatureAngle,rebuildSurface3DMesh,applyCurvatureSections,renderCurvatureSectionsSvg,copyPasteSurfaceCurvature,mirrorWingSurface3D,computeCurvedSpanMeters,computeGeometricScreenLayout,renderSurfaceCalibrationTestCard,exportSurfaceCalibrationPng,LED_CABINET_CATALOG,LED_PROCESSOR_CATALOG,get layout(){return engine.layout;},undo,redo};

/* V0.4.1 UI/playback maintenance. No geometry, UV, crop or coordinate mutations. */
const STABLE_BASE={renderUI,renderInspector,loadProject,exportShot,exportMapPNG};
const stableUI={focus:false,scrubbing:false,scrubResume:false,mediaClock:null,lastSync:0,lastTransport:0,
  seekEpoch:0,overlayNodes:new Map(),lastInspector:null,overviewFits:0,resizeCount:0,
  videoSeeks:0,loopErrors:[],lastViewport:[0,0],presentation:null,visibilityPaused:false};
function setText(id,value){const e=$(id);if(!e)return;const sp=e.querySelector?.('span:not(.theme-ico-dark):not(.theme-ico-light)');if(sp){if(sp.textContent!==String(value))sp.textContent=value;}else if(e.textContent!==String(value))e.textContent=value;}
const SVG_LOCK_CLOSED='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="currentColor"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const SVG_LOCK_OPEN='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
function clockText(value){const t=Math.max(0,Number(value)||0);return Math.floor(t/60).toString().padStart(2,'0')+':'+(t%60).toFixed(2).padStart(5,'0');}
function updateStableControls(){
 if(!engine)return;
 for(const id of ['lockCameraBtn','showLock']){const e=$(id);if(!e)continue;e.classList.toggle('active',!!engine.cameraLocked);e.setAttribute('aria-pressed',String(!!engine.cameraLocked));setText(id,engine.cameraLocked?(typeof window==='undefined'?"Đã khóa góc":window.tr?.("Đã khóa góc","Camera locked")??"Đã khóa góc"):(typeof window==='undefined'?"Khóa góc":window.tr?.("Khóa góc","Lock camera")??"Khóa góc"));e.title=engine.cameraLocked?(typeof window==='undefined'?"Đã khóa góc Camera (Click để mở khóa · Phím L)":window.tr?.("Đã khóa góc Camera (Click để mở khóa · Phím L)","Camera locked (click to unlock · L)")??"Đã khóa góc Camera (Click để mở khóa · Phím L)"):(typeof window==='undefined'?"Khóa / Mở khóa góc Camera (Phím L)":window.tr?.("Khóa / Mở khóa góc Camera (Phím L)","Lock / unlock camera (L)")??"Khóa / Mở khóa góc Camera (Phím L)");}
 const v16Lock=$('v16NavLockBtn');
 if(v16Lock){
  const lk=!!engine.cameraLocked;
  if(v16Lock._lkState!==lk){
   v16Lock._lkState=lk;
   v16Lock.classList.toggle('active',lk);
   v16Lock.setAttribute('aria-pressed',String(lk));
   v16Lock.innerHTML=lk?SVG_LOCK_CLOSED:SVG_LOCK_OPEN;
   v16Lock.title=lk?(typeof window==='undefined'?"Đã khóa góc Camera (Click để mở khóa · Phím L)":window.tr?.("Đã khóa góc Camera (Click để mở khóa · Phím L)","Camera locked (click to unlock · L)")??"Đã khóa góc Camera (Click để mở khóa · Phím L)"):(typeof window==='undefined'?"Khóa / Mở khóa góc Camera (Phím L)":window.tr?.("Khóa / Mở khóa góc Camera (Phím L)","Lock / unlock camera (L)")??"Khóa / Mở khóa góc Camera (Phím L)");
  }
 }
 $('focusBtn')?.classList.toggle('active',stableUI.focus);$('focusBtn')?.setAttribute('aria-pressed',String(stableUI.focus));setText('focusBtn',stableUI.focus?(typeof window==='undefined'?"Thu gọn":window.tr?.("Thu gọn","Collapse")??"Thu gọn"):(typeof window==='undefined'?"Mở rộng":window.tr?.("Mở rộng","Expand")??"Mở rộng"));
 if($('orbitShow'))$('orbitShow').checked=!!state.orbit;$('showOrbit')?.classList.toggle('active',!!state.orbit);$('showOrbit')?.setAttribute('aria-pressed',String(!!state.orbit));
 if($('loopBtn')){$('loopBtn').classList.toggle('active',!!state.loop);$('loopBtn').setAttribute('aria-pressed',String(!!state.loop));}
 setText('showOrbit',state.orbit?(typeof window==='undefined'?"Tự xoay: Bật":window.tr?.("Tự xoay: Bật","Orbit: On")??"Tự xoay: Bật"):(typeof window==='undefined'?"Tự xoay: Tắt":window.tr?.("Tự xoay: Tắt","Orbit: Off")??"Tự xoay: Tắt"));{const pb=$('playBtn'),pk=state.playing?'pause':'play';if(pb&&pb.dataset.icon!==pk){pb.dataset.icon=pk;pb.innerHTML=icon(pk);}}
 $('playBtn').setAttribute('aria-label',state.playing?(typeof window==='undefined'?"Tạm dừng":window.tr?.("Tạm dừng","Pause")??"Tạm dừng"):(typeof window==='undefined'?"Phát":window.tr?.("Phát","Play")??"Phát"));setText('showPlay',state.playing?(typeof window==='undefined'?"Tạm dừng":window.tr?.("Tạm dừng","Pause")??"Tạm dừng"):(typeof window==='undefined'?"Phát":window.tr?.("Phát","Play")??"Phát"));
 setText('timeLabel',clockText(state.time));setText('showTime',clockText(state.time));setText('showDuration',state.duration+' s');
 for(const id of ['seek','showSeek']){const e=$(id);if(!e)continue;e.max=state.duration*100;if(!stableUI.scrubbing)e.value=state.time*100;}
 $('playhead').style.left=(clamp(state.time/Math.max(.01,state.duration),0,1)*100)+'%';
 if($('previewQuality'))$('previewQuality').value=engine.autoQuality?'auto':String(engine.previewScale||1);
}
function setPlaying(value){
 const next=!!value;
 if(next){
  const r=typeof stage10!=='undefined'?stage10?.range:null;
  if(r){if(state.time>=r.end-.05||state.time<r.start){state.time=r.start;if(typeof invalidateSeq==='function')invalidateSeq();}}
  else if(state.duration>0&&state.time>=state.duration-.05){state.time=0;if(typeof invalidateSeq==='function')invalidateSeq();}
 }
 state.playing=next;state.lastFrame=performance.now();stableUI.mediaClock=null;
 syncVideos(true);updateStableControls();
}
function setCameraLock(value){engine.cameraLocked=!!value;if(value)state.orbit=false;updateStableControls();}
function setOrbit(value){state.orbit=!!value;if(value){engine.cameraLocked=false;engine._fitOnResize=false;}updateStableControls();}
function stopOrbit(){state.orbit=false;updateStableControls();}

// Fit the eight stage bounds corners against the actual viewport frustum.
// Fit changes only the camera. It preserves the current yaw/pitch and never scales a model.
StageEngine.prototype.fit=function(){
 const b=stageBounds(this.stage.filter(m=>!m.hidden));this.stageBounds=b;
 const aspect=Math.max(.15,this.canvas.clientWidth/Math.max(1,this.canvas.clientHeight)),c=this.camera;
 if(!Number.isFinite(c.yaw))c.yaw=.13;if(!Number.isFinite(c.pitch))c.pitch=.23;
 const cy=Math.cos(c.yaw),sy=Math.sin(c.yaw),cp=Math.cos(c.pitch),sp=Math.sin(c.pitch);
 const out=[sy*cp,sp,cy*cp],right=[cy,0,-sy],up=[-sy*sp,cp,-cy*sp];
 const ty=Math.tan(Math.PI/8)*.86,tx=ty*aspect;let distance=.05;
 for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]]){
  const v=M.sub([x,y,z],b.center),depth=M.dot(v,out);
  distance=Math.max(distance,depth+Math.abs(M.dot(v,right))/tx,depth+Math.abs(M.dot(v,up))/ty,depth+.05);
 }
 c.target=[...b.center];c.distance=Math.max(.05,distance*1.025);this._fitOnResize=true;stableUI.overviewFits++;
};
StageEngine.prototype.cameraPreset=function(name){
 const c=this.camera;
 if(name==='front'){c.yaw=0;c.pitch=.035;}else if(name==='top'){c.yaw=0;c.pitch=Math.PI/2-.001;}
 else if(name==='side'){c.yaw=Math.PI/3;c.pitch=.23;}else{c.yaw=.5;c.pitch=.35;}
 this.fit();
};
function showOverview(){stopOrbit();engine.view='stage';engine.fit();renderUI();}
function selectCamera(name){stopOrbit();engine.view='stage';engine.cameraPreset(name);document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===name));updateStableControls();}
function toggleFocus(){
 stableUI.focus=!stableUI.focus;document.body.classList.toggle('focus-workspace',stableUI.focus);
 document.body.classList.remove('drawer-left','drawer-right');if(engine._fitOnResize)engine.fit();updateStableControls();
}
function toggleDrawer(side){const cls='drawer-'+side,other=side==='left'?'drawer-right':'drawer-left';document.body.classList.toggle(cls);document.body.classList.remove(other);}

renderInspector=function(){
 const panel=document.querySelector('.right-panel'),key=state.step+':'+(engine.selected||'')+':'+(state.selectedLight||'')+':'+(state.selectedSfx18||'')+':'+(state.selectedMesh||'')+':'+(typeof window!=='undefined'&&window._lmpRpConfigSig18||'');
 const same=stableUI.lastInspector===key,y=panel.scrollTop;STABLE_BASE.renderInspector();panel.scrollTop=same?y:0;stableUI.lastInspector=key;
};
renderUI=function(){
 const left=document.querySelector('.left-panel'),y=left.scrollTop,list=$('objectList'),ly=list?list.scrollTop:0;STABLE_BASE.renderUI();left.scrollTop=y;if(list&&ly>0)list.scrollTop=ly;updateStableControls();
};

// Keep DOM identities for pickable markers. Recreating them each frame loses pointer clicks.
function overlayNode(key,kind,pos,text,attributes={}){
 const p=engine.project(pos),r=$('viewport').getBoundingClientRect();if(!p||p.z>1||p.z<-1||p.x<0||p.y<0||p.x>r.width||p.y>r.height)return;
 let e=stableUI.overlayNodes.get(key);
 if(!e){e=document.createElement(kind==='light'?'button':'span');e.dataset.overlayKey=key;$('hudLabels').appendChild(e);stableUI.overlayNodes.set(key,e);if(kind==='light')e.type='button';}
 e._seen=true;e.hidden=false;e.className=attributes.className||kind;e.textContent=text;
 const x=p.x.toFixed(2)+'px',y=p.y.toFixed(2)+'px';if(e.style.left!==x)e.style.left=x;if(e.style.top!==y)e.style.top=y;
 if(attributes.lightId){e.dataset.lightId=attributes.lightId;e.setAttribute('aria-label',text+' / '+(attributes.name||''));}
 return e;
}
function projectedLine(g,a,b,color,dpr,dashed=false){const p=engine.project(a),q=engine.project(b);if(!p||!q||p.z>1||q.z>1||p.z<-1||q.z<-1)return;g.save();g.strokeStyle=color;g.lineWidth=1.3*dpr;if(dashed)g.setLineDash([5*dpr,5*dpr]);g.beginPath();g.moveTo(p.x*dpr,p.y*dpr);g.lineTo(q.x*dpr,q.y*dpr);g.stroke();g.restore();}
renderOverlays=function(){
 const overlay=$('mapOverlay'),r=$('viewport').getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.25),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
 if(overlay.width!==w||overlay.height!==h){overlay.width=w;overlay.height=h;}
 const g=overlay.getContext('2d');g.clearRect(0,0,w,h);for(const e of stableUI.overlayNodes.values())e._seen=false;
 if(!state.presenting&&engine.view==='stage'){
  if(engine.showGuides)for(const s of engine.surfaces){if(s.enabled===false)continue;overlayNode('led:'+s.id,'led',s.mesh.bounds.center,s.name,{className:'led-label '+(engine.selected===s.id?'selected':'')});}
  for(const [i,q]of state.quadPoints.entries())overlayNode('quad:'+i,'quad-marker',q.point,String(i+1));
  if(engine.showGuides&&state.selectedMesh){const m=engine.stage.find(m=>m.id===state.selectedMesh);if(m){const b=m.bounds,pts=[];for(const x of[b.min[0],b.max[0]])for(const y of[b.min[1],b.max[1]])for(const z of[b.min[2],b.max[2]])pts.push([x,y,z]);for(const[a,b]of [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]])projectedLine(g,pts[a],pts[b],'#b39afd',dpr);}}
  if(engine.showGuides&&state.step==='lighting')for(const [i,l]of engine.lights.entries()){
   overlayNode('light:'+l.id,'light',l.pos,'L'+(i+1),{className:'light-anchor '+(state.selectedLight===l.id?'selected':''),lightId:l.id,name:l.name});
   if(state.selectedLight===l.id){overlayNode('target:'+l.id,'light-target',l.target,'+');projectedLine(g,l.pos,l.target,'#f6c677',dpr,true);}
  }
  if(state.pendingLight)overlayNode('pending','light-anchor pending',state.pendingLight.hit.point,'L?');
  for(let i=0;i<(state.measurePoints||[]).length;i++)overlayNode('measure:'+i,'quad-marker',state.measurePoints[i],String(i+1));
  if(engine.showGuides){const origin=engine.stageBounds?.min||[0,0,0],len=Math.max(.3,Math.min(2,engine.size.width*.1));for(const [axis,color,name]of [[[1,0,0],'#f28e87','X'],[[0,1,0],'#7bd59f','Y'],[[0,0,1],'#7da9ff','Z']]){const target=M.add(origin,M.mul(axis,len));projectedLine(g,origin,target,color,dpr);const p=engine.project(target);if(p&&p.z<1&&p.z>-1){g.fillStyle=color;g.font=(11*dpr)+'px sans-serif';g.fillText(name,p.x*dpr+3,p.y*dpr-4);}}}
 }else if(!state.presenting&&engine.mapTransform&&engine.showGuides){
  const m=engine.mapTransform,ratio=w/engine.canvas.width;g.save();g.scale(ratio,ratio);g.strokeStyle='#536175';g.lineWidth=1;g.strokeRect(m.left,m.top,m.ww*m.scale,m.hh*m.scale);
  const list=engine.view==='solo'&&surface()?[surface()]:engine.mapSurfaces();
  for(const s of list){const x=m.left+(engine.view==='solo'?0:s.x)*m.scale,y=m.top+(engine.view==='solo'?0:s.y)*m.scale;g.strokeStyle=engine.selected===s.id?'#b39aff':'#70889e';g.lineWidth=engine.selected===s.id?2:1;g.strokeRect(x,y,s.w*m.scale,s.h*m.scale);if(s.w*m.scale>65){const label=s.name+' / '+s.w+' x '+s.h;g.font='10px Segoe UI,Arial';g.fillStyle='#111622d9';g.fillRect(x+3,y+3,Math.min(g.measureText(label).width+14,s.w*m.scale-6),20);g.save();g.beginPath();g.rect(x+5,y+3,s.w*m.scale-8,20);g.clip();g.fillStyle='#ddd7f4';g.fillText(label,x+9,y+17);g.restore();}}
  g.restore();
 }
 for(const [key,e]of stableUI.overlayNodes){if(!e._seen)e.hidden=true;const id=key.slice(key.indexOf(':')+1);if((key.startsWith('led:')&&!engine.surfaces.some(s=>s.id===id))||((key.startsWith('light:')||key.startsWith('target:'))&&!engine.lights.some(l=>l.id===id))){e.remove();stableUI.overlayNodes.delete(key);}}
 const crop=$('cropCanvas'),s=surface(),a=s?engine.media.get(s.source):null;
 if(crop&&a&&!state.presenting){const cw=Math.max(1,Math.round(crop.clientWidth*dpr)),ch=Math.max(1,Math.round(crop.clientHeight*dpr));if(crop.width!==cw||crop.height!==ch){crop.width=cw;crop.height=ch;crop._lastSig='';}const vTime=a.type==='video'?(state.playing&&!stableUI.scrubbing?'play':(a.element.currentTime||0).toFixed(2)):'img',sig=s.id+'|'+a.id+'|'+cw+'x'+ch+'|'+s.crop.join(',')+'|'+vTime;if(crop._lastSig!==sig){const seeking=a.type==='video'&&a.element.seeking;if(!seeking)crop._lastSig=sig;if(a.type==='video'&&!seeking&&(!a._cropPreview||vTime!=='play'&&a._cropPreviewTime!==vTime)){if(!a._cropPreview){a._cropPreview=document.createElement('canvas');a._cropPreview.width=288;a._cropPreview.height=160;}try{a._cropPreview.getContext('2d').drawImage(a.element,0,0,a._cropPreview.width,a._cropPreview.height);a._cropPreviewTime=vTime;}catch(e){}}const c=crop.getContext('2d');c.fillStyle='#060811';c.fillRect(0,0,cw,ch);try{c.drawImage(a.type==='video'&&a._cropPreview?a._cropPreview:a.element,0,0,cw,ch);}catch(e){}const[x,y,ww,hh]=s.crop.map((v,i)=>v/(i%2===0?a.width:a.height)*(i%2===0?cw:ch));c.fillStyle='#080a1690';c.beginPath();c.rect(0,0,cw,ch);c.rect(x,y,ww,hh);c.fill('evenodd');c.strokeStyle='#bca0ff';c.lineWidth=2*dpr;c.strokeRect(x,y,ww,hh);for(const[p,q]of[[x,y],[x+ww,y],[x+ww,y+hh],[x,y+hh]]){c.fillStyle='#e9ddff';c.fillRect(p-3,q-3,6,6);}}}
};

// The first active video is the playback clock. Never repeatedly seek the master
// while its decoder is advancing; other independent clips receive bounded correction.
function activeVideos(){const ids=new Set(engine.surfaces.filter(s=>s.enabled!==false).map(s=>s.source));return state.media.filter(a=>a.type==='video'&&ids.has(a.id));}
function seekVideoElement(v,target,fast=false){const t=Math.max(0,target);if(fast&&typeof v.fastSeek==='function'&&t>.05){try{v.fastSeek(t);return;}catch(e){}}try{v.currentTime=t;}catch(e){}}
syncVideos=function(force=false){
 const now=performance.now(),active=activeVideos(),ids=new Set(active.map(a=>a.id)),primary=active[0];if(force){stableUI.mediaClock=null;stableUI.seekEpoch++;}
 for(const a of state.media){if(a.type!=='video')continue;const v=a.element;if(!ids.has(a.id)){if(!v.paused)v.pause();continue;}
  let target=a.duration>0?state.time%a.duration:0;if(!state.loop&&state.time>=state.duration&&state.time>0&&target<.03)target=Math.max(0,a.duration-.033);const rawDrift=Math.abs(v.currentTime-target),drift=!force&&(state.loop||v.loop)&&a.duration>0&&state.playing&&!stableUI.scrubbing?Math.min(rawDrift,Math.abs(a.duration-rawDrift)):rawDrift;
  const shouldCorrect=force||(!state.playing&&drift>.04)||(a!==primary&&!v.seeking&&drift>.55&&now-(a._lastCorrection||0)>1500);
  if(v.readyState>=(force?1:2)&&shouldCorrect&&(force||!v.seeking)&&drift>(!force&&state.playing&&!stableUI.scrubbing?.08:.025)){seekVideoElement(v,Math.min(target,Math.max(0,a.duration-.01)),stableUI.scrubbing);a._lastCorrection=now;stableUI.videoSeeks++;}
  if(state.playing&&!document.hidden){if(v.paused&&!a._playPending){a._playPending=true;Promise.resolve(v.play()).catch(e=>{if(e?.name==='NotAllowedError'&&state.playing&&!v.muted){v.muted=true;return Promise.resolve(v.play()).catch(()=>{});}}).finally(()=>a._playPending=false);}}else if(!v.paused)v.pause();
 }
 stableUI.lastSync=now;
};
function advancePlayback(dt){
 const primary=activeVideos()[0];if(!primary){stableUI.mediaClock=null;state.time+=dt;return;}
 const v=primary.element;if((v.paused&&!primary._playPending)||v.readyState<2){stableUI.mediaClock=null;state.time+=dt;return;}
 if(v.paused||v.seeking)return;
 const prev=stableUI.mediaClock,cur=v.currentTime;
 if(!prev||prev.id!==primary.id||prev.epoch!==stableUI.seekEpoch){stableUI.mediaClock={id:primary.id,time:cur,epoch:stableUI.seekEpoch};return;}
 let delta=cur-prev.time;if(delta<-.05&&primary.duration>0)delta+=primary.duration;
 if(delta>=0&&delta<Math.max(2,dt*4))state.time+=delta;
 prev.time=cur;
}
function seekTimeline(value){state.time=clamp(Number(value)||0,0,state.duration);state.lastFrame=performance.now();syncVideos(true);updateStableControls();}
function bindTimeline(id){const e=$(id);if(!e)return;
 e.onpointerdown=()=>{stableUI.scrubbing=true;stableUI.scrubResume=state.playing;state.playing=false;syncVideos();};
 e.oninput=()=>{seekTimeline(+e.value/100);for(const other of ['seek','showSeek'])if(other!==id)$(other).value=e.value;};
 const done=()=>{if(!stableUI.scrubbing)return;stableUI.scrubbing=false;setPlaying(stableUI.scrubResume);};
 e.onpointerup=done;e.onpointercancel=done;e.onchange=done;e.onblur=done;
}

// Presentation hides editing panels, never playback or camera controls.
togglePresentation=function(){
 const entering=!state.presenting;
 if(entering){stableUI.presentation={camera:structuredClone(engine.camera),view:engine.view,fit:engine._fitOnResize,guides:engine.showGuides};state.presenting=true;engine.showGuides=false;state.orbit=false;engine.view='stage';state.quad=false;state.quadPoints=[];state.rebindId=null;cancelSpatialPick();$('exportMenu').classList.add('hidden');$('quadHint').classList.add('hidden');}
 else{state.presenting=false;if(typeof STUDIO!=='undefined'&&STUDIO.lumi18?.liveShow18?.running)STUDIO.lumi18.stopLiveShow18?.();if(state.playing&&!state.recording)setPlaying(false);}
 document.body.classList.toggle('present-mode',state.presenting);$('presentHUD').classList.toggle('hidden',!state.presenting);$('presentControls').classList.toggle('hidden',!state.presenting);
 if(entering)engine.fit();else if(stableUI.presentation){engine.camera=stableUI.presentation.camera;engine.view=stableUI.presentation.view;engine._fitOnResize=stableUI.presentation.fit;engine.showGuides=stableUI.presentation.guides;stableUI.presentation=null;}
 state.lastFrame=performance.now();renderUI();
};

loadProject=async function(file){await STABLE_BASE.loadProject(file);state.orbit=false;engine._fitOnResize=false;stableUI.mediaClock=null;state.lastFrame=performance.now();updateStableControls();};

// Snapshot exports copy the rendered frame before awaiting a Blob. This avoids
// leaving the live canvas resized, in a different view or with guides hidden.
exportShot=async function(){
 const prev={view:engine.view,guides:engine.showGuides};const copy=document.createElement('canvas');copy.width=1920;copy.height=1080;
 try{engine.view='stage';engine.showGuides=false;engine.render(state.time,{width:1920,height:1080});copy.getContext('2d').drawImage(engine.canvas,0,0);}finally{engine.view=prev.view;engine.showGuides=prev.guides;engine.render(state.time);renderOverlays();}
 const blob=await new Promise(r=>copy.toBlob(r,'image/png'));if(blob){download('ALPHA_Stage_Preview_1920x1080.png',blob);toast((typeof window==='undefined'?"Đã xuất ảnh. Khung xem và nút điều khiển giữ nguyên.":window.tr?.("Đã xuất ảnh. Khung xem và nút điều khiển giữ nguyên.","Image exported. Viewport and controls unchanged.")??"Đã xuất ảnh. Khung xem và nút điều khiển giữ nguyên."));}
};
exportMapPNG=async function(){const task=STABLE_BASE.exportMapPNG();engine.render(state.time);renderOverlays();return await task;};

loop=function(now){
 const realDt=Math.max(0,(now-state.lastFrame)/1000);state.lastFrame=now;const dt=Math.min(realDt,1);
 if(document.hidden){requestAnimationFrame(loop);return;}
 try{
  if(state.playing&&!stableUI.scrubbing){advancePlayback(dt);if(state.time>=state.duration){if(state.loop){state.time%=state.duration;syncVideos(true);}else{state.time=state.duration;setPlaying(false);}}}
  if(state.orbit&&state.playing&&engine.view==='stage'&&!engine.cameraLocked)engine.camera.yaw+=Math.min(.1,dt)*.07;
  if(now-stableUI.lastSync>250)syncVideos();
  engine.render(state.time);renderOverlays();if(now-stableUI.lastTransport>50){updateStableControls();stableUI.lastTransport=now;}
  fpsAccum+=realDt;fpsCount++;if(fpsAccum>=1){setText('fps',Math.round(fpsCount/Math.max(.001,fpsAccum))+' fps');setText('engineState',state.recording?(typeof window==='undefined'?"ĐANG GHI / xem thử WebM":window.tr?.("ĐANG GHI / xem thử WebM","REC / WebM preview")??"ĐANG GHI / xem thử WebM"):engine.surfaces.length+' LED / '+engine.lights.filter(l=>l.enabled).length+(typeof window==='undefined'?" đèn":window.tr?.(" đèn"," lights")??" đèn"));fpsAccum=0;fpsCount=0;}
 }catch(e){if(!stableUI.loopErrors.includes(e.message)){stableUI.loopErrors.push(e.message);console.error(e);toast((typeof window==='undefined'?"Xem thử: ":window.tr?.("Xem thử: ","Preview: ")??"Xem thử: ")+e.message,8000);}state.playing=false;updateStableControls();}
 requestAnimationFrame(loop);
};
function initStableEvents(){
 engine.previewScale=1;engine.cameraLocked=false;
 $('projectName').onclick=()=>{
  const label=$('projectName');
  if($('projectNameInput')||window.STUDIO?.cloud16?.isClientReviewMode?.())return;
  const input=document.createElement('input');
  input.id='projectNameInput';input.type='text';input.maxLength=1024;input.value=state.projectName||state.model.name;
  input.setAttribute('aria-label',tr('Tên dự án','Project name'));
  label.hidden=true;label.after(input);
  let finished=false;
  const finish=save=>{
   if(finished)return;
   finished=true;
   const name=input.value.trim();
   input.remove();label.hidden=false;
   if(save&&name){state.projectName=name;renderUI();window.STUDIO?.project142?.scheduleAutoBackup?.();}
  };
  input.addEventListener('blur',()=>finish(true));
  input.addEventListener('keydown',e=>{
   e.stopPropagation();
   if(e.isComposing)return;
   if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();finish(e.key==='Enter');label.focus();}
  });
  input.focus();input.select();
 };
 $('overviewBtn').onclick=showOverview;$('fitBtn').onclick=showOverview;$('fitBtn').title=(typeof window==='undefined'?"Toàn cảnh sân khấu / F":window.tr?.("Toàn cảnh sân khấu / F","Stage overview / F")??"Toàn cảnh sân khấu / F");
 $('lockCameraBtn').onclick=()=>setCameraLock(!engine.cameraLocked);$('showLock').onclick=()=>setCameraLock(!engine.cameraLocked);
 $('focusBtn').onclick=toggleFocus;$('assetDrawer').onclick=()=>toggleDrawer('left');$('inspectorDrawer').onclick=()=>toggleDrawer('right');
 document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>selectCamera(b.dataset.camera));document.querySelectorAll('[data-show-camera]').forEach(b=>b.onclick=()=>selectCamera(b.dataset.showCamera));
 $('playBtn').onclick=()=>setPlaying(!state.playing);$('showPlay').onclick=()=>setPlaying(!state.playing);
 $('restartBtn').onclick=()=>seekTimeline(0);$('showRestart').onclick=()=>seekTimeline(0);
 if($('orbitShow'))$('orbitShow').onchange=e=>setOrbit(e.target.checked);$('showOrbit').onclick=()=>setOrbit(!state.orbit);
 $('showOverview').onclick=showOverview;$('showExit').onclick=togglePresentation;$('exitPresent').onclick=togglePresentation;$('presentBtn').onclick=togglePresentation;if($('transportPresentBtn'))$('transportPresentBtn').onclick=()=>togglePresentation();
 $('previewQuality').onchange=e=>{engine.previewScale=+e.target.value;updateStableControls();};
 bindTimeline('seek');bindTimeline('showSeek');
 $('hudLabels').addEventListener('click',e=>{const marker=e.target.closest('[data-light-id]');if(!marker||!engine.lights.some(l=>l.id===marker.dataset.lightId))return;e.stopPropagation();state.selectedLight=marker.dataset.lightId;renderUI();});
 document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||$('modal').open)return;const liveRun=typeof STUDIO!=='undefined'&&!!STUDIO.lumi18?.liveShow18?.running;if(e.key.toLowerCase()==='f'&&!liveRun){e.preventDefault();e.stopImmediatePropagation();showOverview();}else if(e.key.toLowerCase()==='l'&&!e.ctrlKey&&!e.metaKey&&!liveRun){e.preventDefault();setCameraLock(!engine.cameraLocked);}else if(e.key==='Escape'&&!state.presenting){document.body.classList.remove('drawer-left','drawer-right');}},true);
 const observer=new ResizeObserver(entries=>{const r=entries[0].contentRect,w=Math.round(r.width),h=Math.round(r.height);document.documentElement.style.setProperty("--drawer-top",Math.round($("viewport").getBoundingClientRect().top)+"px");if(w<1||h<1||stableUI.lastViewport[0]===w&&stableUI.lastViewport[1]===h)return;stableUI.lastViewport=[w,h];stableUI.resizeCount++;if(engine._fitOnResize&&engine.stage.length&&engine.view==='stage')engine.fit();});observer.observe($('viewport'));stableUI.observer=observer;
 document.addEventListener('visibilitychange',()=>{state.lastFrame=performance.now();stableUI.mediaClock=null;if(document.hidden){for(const a of state.media)if(a.type==='video')a.element.pause();stableUI.visibilityPaused=true;}else{if(stableUI.visibilityPaused)syncVideos(true);stableUI.visibilityPaused=false;}});
 window.addEventListener('blur',()=>{if(stableUI.scrubbing){stableUI.scrubbing=false;setPlaying(stableUI.scrubResume);}});
 const help=$('helpBtn').onclick;$('helpBtn').onclick=()=>{help();$('modalBody').insertAdjacentHTML('afterbegin',(typeof window==='undefined'?"<h3>0.4.1 / Khung xem ổn định</h3><p><b>Toàn cảnh (F)</b>: lấy trọn sân khấu. <b>Khóa góc (L)</b>: ngăn xoay/zoom nhầm. <b>Mở rộng</b>: dành không gian cho 3D. Trình diễn luôn có Play/Pause, timeline và nút trở về. Preview Nhẹ giảm tải GPU, không đổi pixel/crop.</p>":window.tr?.("<h3>0.4.1 / Khung xem ổn định</h3><p><b>Toàn cảnh (F)</b>: lấy trọn sân khấu. <b>Khóa góc (L)</b>: ngăn xoay/zoom nhầm. <b>Mở rộng</b>: dành không gian cho 3D. Trình diễn luôn có Play/Pause, timeline và nút trở về. Preview Nhẹ giảm tải GPU, không đổi pixel/crop.</p>","<h3>Stable viewport</h3><p><b>Overview (F)</b>: fit the entire stage. <b>Lock camera (L)</b>: prevent accidental rotation/zoom. <b>Expand</b>: make room for 3D. Presentation keeps Play/Pause, timeline and a return button. Light preview reduces GPU load without changing pixels/crop.</p>")??"<h3>0.4.1 / Khung xem ổn định</h3><p><b>Toàn cảnh (F)</b>: lấy trọn sân khấu. <b>Khóa góc (L)</b>: ngăn xoay/zoom nhầm. <b>Mở rộng</b>: dành không gian cho 3D. Trình diễn luôn có Play/Pause, timeline và nút trở về. Preview Nhẹ giảm tải GPU, không đổi pixel/crop.</p>"));};
}
const stableAPI={showOverview,setCameraLock,setOrbit,setPlaying,seekTimeline,toggleFocus,togglePresentation,updateStableControls,syncVideos,
 getDiagnostics(){return{version:'0.4.1',resizeCount:stableUI.resizeCount,overviewFits:stableUI.overviewFits,videoSeeks:stableUI.videoSeeks,loopErrors:[...stableUI.loopErrors],persistentMarkers:stableUI.overlayNodes.size};}};
