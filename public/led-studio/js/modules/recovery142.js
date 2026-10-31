/* V15.1: validated project transactions and optional local recovery.
   One serializer is shared with the portable .ledstudio download. */
(function () {
  'use strict';
  const S = window.STUDIO;
  if (!S || !S.engine) return;
  const state = S.state, engine = S.engine;
  const MB = 1024 * 1024, MAX_ASSETS = 300 * MB, AUTO_ASSETS = 25 * MB;
  const MAX_PACKAGE = 450 * MB, AUTO_PACKAGE = 50 * MB;
  const DB_NAME = 'ALPHA_LED_STUDIO_RECOVERY_142', STORE = 'projects';
  const R = { operation: null, auto: false, lastSave: null, backup: null,
    message: 'Chưa tạo bản dự phòng trong trình duyệt này.', error: false,
    rescueText: null, rescueName: null, dbPromise: null, startedAt: Date.now() };
  const el = id => document.getElementById(id);
  const plain = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const fail = message => { throw new Error(message); };
  const textSize = value => new Blob([value]).size;
  const sizeText = value => (value / MB).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' MB';
  const dateText = value => new Date(value).toLocaleString('vi-VN');
  const safeName = value => String(value || 'Stage').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0,110);
  const publicMeta = record => record ? { name: record.name, createdAt: record.createdAt,
    size: record.size, assetBytes: record.assetBytes, appVersion: record.appVersion } : null;

  function requireObject(value, label) {
    if (!plain(value)) fail(label + ': cần một đối tượng hợp lệ.');
    return value;
  }
  function array(value, label, limit, optional = false) {
    if (value == null && optional) return [];
    if (!Array.isArray(value) || value.length > limit) fail(label + ': danh sách không hợp lệ hoặc vượt giới hạn ' + limit + '.');
    return value;
  }
  function finite(value, label, min = -1e9, max = 1e9) {
    if (!Number.isFinite(value) || value < min || value > max) fail(label + ': giá trị số không hợp lệ.');
    return value;
  }
  function vector(value, length, label) {
    if (!Array.isArray(value) || value.length !== length || value.some(v => !Number.isFinite(v) || Math.abs(v) > 1e9)) fail(label + ': tọa độ không hợp lệ.');
  }
  function id(value, label) {
    if (typeof value !== 'string' || !value.length || value.length > 240 || /[<>"'`\u0000-\u001f]/.test(value)) fail(label + ': mã định danh không hợp lệ.');
  }
  function uniqueRows(rows, label) {
    const seen = new Set();
    for (const row of rows) {
      requireObject(row, label); id(row.id, label);
      if (seen.has(row.id)) fail(label + ': trùng mã ' + row.id + '.');
      seen.add(row.id);
    }
  }
  function scanValues(value) {
    const stack = [[value, 0]]; let count = 0;
    while (stack.length) {
      const [item, depth] = stack.pop();
      if (++count > 2000000 || depth > 80) fail('Cấu trúc dự án quá lớn hoặc lồng quá sâu.');
      if (typeof item === 'number' && !Number.isFinite(item)) fail('Dự án chứa số không hữu hạn.');
      if (!item || typeof item !== 'object') continue;
      for (const key of Object.keys(item)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') fail('Dự án chứa khóa dữ liệu không được hỗ trợ.');
        stack.push([item[key], depth + 1]);
      }
    }
  }
  function asset(item, label) {
    requireObject(item, label);
    if (typeof item.name !== 'string' || !item.name || item.name.length > 1024) fail(label + ': thiếu tên tệp.');
    if (typeof item.data !== 'string') fail(label + ': thiếu nội dung tệp đính kèm.');
    const split = item.data.indexOf(',');
    if (split < 0 || split > 300 || !/^data:[^,]*;base64$/i.test(item.data.slice(0, split))) fail(label + ': tài nguyên phải được nhúng đầy đủ dạng data URL base64.');
    const data = item.data.slice(split + 1);
    if (data.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) fail(label + ': dữ liệu base64 bị hỏng.');
    const bytes = data.length / 4 * 3 - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
    if (bytes > MAX_ASSETS) fail(label + ': tệp quá lớn.');
    return bytes;
  }
  function floats(data, label, maxValues) {
    if (typeof data !== 'string' || data.length > Math.ceil(maxValues * 4 / 3) * 4 + 8 || data.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) fail(label + ': bộ đệm không hợp lệ.');
    let values;
    try { values = decodeFloats(data); } catch (_) { fail(label + ': không giải mã được bộ đệm.'); }
    if (values.length > maxValues) fail(label + ': vượt giới hạn hình học.');
    for (const value of values) if (!Number.isFinite(value) || Math.abs(value) > 1e9) fail(label + ': chứa tọa độ không hữu hạn.');
    return values.length;
  }

  // V15.1 extension data is validated before any model or timeline mutation.
  const MATRIX_PRESETS = new Set(['steady','blink','strobe','pulse','chase','chaseReverse','pingPong','comet','cometReverse','accumulate','accumulateReverse','centerOut','centerIn','alternating','theaterChase','twoColorChase','rainbowCycle','rainbowChase','sparkle','twinkle','wave','colorWipe','scan','groupSequence','blackout','dualComet','meteorRain','fire','waterRipple','diagonalChase','checkerboard','zipper','breathingGradient','bouncingBalls','confetti']);
  function matrixTarget(value, label) {
    if (typeof value !== 'string' || value.length > 240 || /[\u0000-\u001f]/.test(value) ||
        !(value === 'all' || /^path:[A-Za-z0-9_-]{1,100}$/.test(value) || /^group:.{0,40}$/.test(value) || /^[A-Za-z0-9_-]{1,100}$/.test(value))) fail(label + ': đích LED Matrix không hợp lệ.');
  }
  function matrixOptions(value, label) {
    requireObject(value, label);
    if (value.preset !== undefined && !MATRIX_PRESETS.has(value.preset)) fail(label + ': preset LED Matrix không được hỗ trợ.');
    const rules = { count:[1,4096,true], rows:[1,64,true], time:[0,36000], duration:[.001,36000], bpm:[20,300],
      speed:[0,8], brightness:[0,1], tail:[1,4096], groupSize:[1,4096,true], phase:[-10000,10000],
      seed:[0,4294967295,true], phaseDuration:[.01,36000] };
    for (const [key,[min,max,integer]] of Object.entries(rules)) if (value[key] !== undefined) {
      finite(value[key], label + ' / ' + key, min, max);
      if (integer && !Number.isInteger(value[key])) fail(label + ' / ' + key + ': cần số nguyên.');
    }
    for (const key of ['color','color2']) if (value[key] !== undefined && !/^#[0-9a-f]{6}$/i.test(value[key])) fail(label + ' / ' + key + ': màu LED Matrix không hợp lệ.');
    if (value.reverse !== undefined && typeof value.reverse !== 'boolean') fail(label + ': reverse cần là boolean.');
    if (value.target !== undefined) matrixTarget(value.target, label);
  }
  function matrixCue(cue, tracks) {
    const match = cue.source.match(/^matrix143:([^@]+)(?:@([\s\S]*))?$/);
    if (!match || !MATRIX_PRESETS.has(match[1])) fail('Cue LED Matrix: nguồn hiệu ứng không hợp lệ.');
    if (match[2] !== undefined) matrixTarget(match[2], 'Cue LED Matrix');
    if (tracks.find(t => t.id === cue.track)?.type !== 'light') fail('Cue LED Matrix cần nằm trên track light.');
    finite(cue.duration, 'Độ dài cue LED Matrix', .05, 600);
    if (cue.start + cue.duration > 600 + 1e-8) fail('Cue LED Matrix kết thúc quá 600 giây.');
    for (const [key,min,max] of [['in',0,36000],['rate',.125,8],['gain',0,3],['fade',0,10]]) if (cue[key] !== undefined) finite(cue[key], 'Cue LED Matrix / ' + key, min, max);
    if (cue.matrix143 !== undefined) matrixOptions(cue.matrix143, 'Thông số cue LED Matrix');
  }
  function matrixBank(bank, show) {
    requireObject(bank, 'LED Matrix');
    if (bank.v !== undefined && (!Number.isInteger(bank.v) || bank.v < 1 || bank.v > 5)) fail('Phiên bản dữ liệu LED Matrix không được hỗ trợ.');
    if (bank.masterBrightness !== undefined) finite(bank.masterBrightness, 'Độ sáng tổng LED Matrix', 0, 1);
    if (bank.object146 !== undefined) {
      const object = requireObject(bank.object146, 'Thiết lập viền object');
      if (object.outlineMode !== undefined && !['object','face'].includes(object.outlineMode)) fail('Chế độ lấy viền object không hợp lệ.');
    }
    // Read older projects without re-enabling their retired color-scanning UI.
    if (bank.color145 !== undefined) {
      const color = requireObject(bank.color145, 'Thiết lập bắt line màu');
      if (color.color !== undefined && (typeof color.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color.color))) fail('Màu dùng để bắt line không hợp lệ.');
      if (color.scope !== undefined && !['all','object'].includes(color.scope)) fail('Phạm vi bắt line màu không hợp lệ.');
      const limits = { hueTolerance:[1,90], minSaturation:[0,1], minValue:[0,1], minLength:[2,2000], simplifyTolerance:[0,5], gapClose:[0,3], maxStrokeWidth:[0,200], maxDimension:[512,3072], width:[1,500], rows:[1,8], spacing:[0,1000], pitch:[10,2000] };
      for (const [key,[min,max]] of Object.entries(limits)) if (color[key] !== undefined) {
        finite(color[key], 'Thiết lập bắt line màu / ' + key, min, max);
        if (['rows','gapClose','maxDimension'].includes(key) && !Number.isInteger(color[key])) fail('Thiết lập bắt line màu / ' + key + ': cần số nguyên.');
      }
    }
    if (bank.scan144 !== undefined) {
      const scan = requireObject(bank.scan144, 'Thiết lập quét viền LED Matrix');
      const enums = { strategy:['dominant','components','allPlanes'], mode:['auto','front','back','top','bottom','left','right'], scope:['all','named'] };
      for (const [key, values] of Object.entries(enums)) if (scan[key] !== undefined && !values.includes(scan[key])) fail('Thiết lập quét viền LED Matrix / ' + key + ': lựa chọn không hợp lệ.');
      const limits = { tolerance:[1e-6,.02], planeTolerance:[1e-6,.05], minLength:[.001,100], simplifyTolerance:[0,.02], angleToleranceDegrees:[.05,10] };
      for (const [key,[min,max]] of Object.entries(limits)) if (scan[key] !== undefined) finite(scan[key], 'Thiết lập quét viền LED Matrix / ' + key, min, max);
    }
    const paths = array(bank.paths, 'Đường viền LED Matrix', 256);
    uniqueRows(paths, 'Đường viền LED Matrix');
    for (const p of paths) {
      if (!/^[A-Za-z0-9_-]{1,100}$/.test(p.id)) fail('Mã đường viền LED Matrix không hợp lệ.');
      for (const key of ['closed','enabled','reverse','diffuser','glow','bindingInvalid']) if (p[key] !== undefined && typeof p[key] !== 'boolean') fail('Viền LED Matrix / ' + key + ': cần boolean.');
      if (p.sourceMeshes !== undefined) {
        const sources = array(p.sourceMeshes, 'Object nguồn của viền LED Matrix', 32);
        if (sources.length < 2) fail('Viền ghép LED Matrix cần từ 2 đến 32 object nguồn.');
        const seen = new Set();
        for (const key of sources) {
          if (typeof key !== 'string' || !key.length || key.length > 65536 || /[\u0000-\u001f]/.test(key)) fail('Object nguồn của viền LED Matrix: mã nguồn không hợp lệ.');
          if (seen.has(key)) fail('Object nguồn của viền LED Matrix: mã nguồn bị trùng.');
          seen.add(key);
        }
      }
      const points = array(p.points, 'Điểm đường viền LED Matrix', 4096);
      const minimum = p.closed ? 3 : 2;
      if (points.length < minimum) fail('Viền LED Matrix cần ít nhất ' + minimum + ' điểm.');
      const cleaned = [];
      for (const point of points) {
        vector(point, 3, 'Điểm đường viền LED Matrix');
        if (point.some(n => Math.abs(n) > 1e5)) fail('Điểm đường viền LED Matrix nằm ngoài giới hạn tọa độ.');
        if (!cleaned.length || Math.hypot(...point.map((n,i) => n - cleaned.at(-1)[i])) > 1e-6) cleaned.push(point);
      }
      if (cleaned.length > 2 && Math.hypot(...cleaned[0].map((n,i) => n - cleaned.at(-1)[i])) < 1e-6) cleaned.pop();
      if (cleaned.length < minimum) fail('Viền LED Matrix có quá ít điểm khác nhau.');
      let length = 0;
      for (let i=1; i<cleaned.length; i++) length += Math.hypot(...cleaned[i].map((n,j) => n - cleaned[i-1][j]));
      if (p.closed) length += Math.hypot(...cleaned[0].map((n,j) => n - cleaned.at(-1)[j]));
      if (length < .001) fail('Đường viền LED Matrix quá ngắn.');
      vector(p.normal, 3, 'Pháp tuyến đường viền LED Matrix');
      if (p.normal.some(n => Math.abs(n) > 1e5) || Math.hypot(...p.normal) <= 1e-6) fail('Pháp tuyến đường viền LED Matrix phải khác 0 và hữu hạn.');
      const dimensions = { rows:[1,8,true], pitch:[.01,2], width:[.001,.5], spacing:[0,1], offset:[-5,5], lift:[.001,.5], brightness:[0,1], idle:[0,1] };
      for (const [key,[min,max,integer]] of Object.entries(dimensions)) if (p[key] !== undefined) {
        finite(p[key], 'Viền LED Matrix / ' + key, min, max);
        if (integer && !Number.isInteger(p[key])) fail('Viền LED Matrix / ' + key + ': cần số nguyên.');
      }
      if (p.color !== undefined && !/^#[0-9a-f]{6}$/i.test(p.color)) fail('Màu viền LED Matrix không hợp lệ.');
      for (const [key,max] of [['name',80],['group',40],['sourceMesh',65536],['sourceName',160]]) if (p[key] !== undefined && (typeof p[key] !== 'string' || p[key].length > max || /[\u0000-\u001f]/.test(p[key]))) fail('Viền LED Matrix / ' + key + ': chuỗi không hợp lệ.');
    }
    if (bank.selected != null && (typeof bank.selected !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(bank.selected))) fail('Viền LED Matrix đang chọn không hợp lệ.');
    if (bank.target !== undefined) matrixTarget(bank.target, 'LED Matrix');
    if (bank.duration !== undefined) finite(bank.duration, 'Thời lượng mặc định LED Matrix', .05, 120);
    if (bank.effect !== undefined) matrixOptions(bank.effect, 'Thiết lập LED Matrix');
    if (bank.lastPreset !== undefined && !MATRIX_PRESETS.has(bank.lastPreset)) fail('Preset LED Matrix đang chọn không hợp lệ.');
    const cues = array(bank.cues, 'Metadata cue LED Matrix', 500, true);
    uniqueRows(cues, 'Metadata cue LED Matrix');
    for (const item of cues) {
      const clip = show?.clips?.find(c => c.id === item.id && String(c.source).startsWith('matrix143:'));
      if (!clip) fail('Metadata LED Matrix tham chiếu cue không tồn tại: ' + item.id);
      matrixOptions(item.matrix143, 'Metadata cue LED Matrix');
    }
    return paths.length;
  }

  function validate(project) {
    requireObject(project, 'Dự án');
    if (project.format !== 'ALPHA_LED_STUDIO/0.2') fail('Chỉ mở gói ALPHA_LED_STUDIO/0.2 (.ledstudio).');
    scanValues(project);
    const model = requireObject(project.model, 'Model');
    if (typeof model.name !== 'string' || !model.name.length || model.name.length > 1024) fail('Tên model không hợp lệ.');
    const modelFiles = array(model.files, 'Tệp model', 2000, true);
    if (!model.demo && !modelFiles.length) fail('Dự án thiếu tệp model gốc.');
    const media = array(project.media, 'Media', 100);
    const screens = array(project.screens, 'LED', 300);
    uniqueRows(media, 'Media'); uniqueRows(screens, 'LED');
    let assetBytes = 0;
    for (const file of modelFiles) assetBytes += asset(file, 'Model ' + (file?.name || ''));
    for (const file of media) assetBytes += asset(file, 'Media ' + (file?.name || ''));
    for (const screen of screens) {
      if (typeof screen.name !== 'string') fail('LED thiếu tên.');
      finite(screen.w, 'Chiều rộng LED', 1, 16384); finite(screen.h, 'Chiều cao LED', 1, 16384);
      for (const key of ['x','y','brightness','rotation','fit','liftMm']) if (screen[key] != null) finite(screen[key], 'LED / ' + key);
      if (screen.crop != null) vector(screen.crop, 4, 'Crop LED');
      if (screen.bindingNormal != null) vector(screen.bindingNormal, 3, 'Pháp tuyến LED');
      const mesh = requireObject(screen.mesh, 'Hình học LED');
      const vertices = floats(mesh.p, 'Vị trí LED', 6000000);
      if (!vertices || vertices % 9) fail('Hình học LED phải gồm các tam giác đầy đủ.');
      if (floats(mesh.uv, 'UV LED', 4000000) !== vertices / 3 * 2) fail('Số lượng UV không khớp hình học LED.');
      if (mesh.n != null && floats(mesh.n, 'Pháp tuyến LED', 6000000) !== vertices) fail('Số lượng pháp tuyến không khớp hình học LED.');
    }
    const master = requireObject(project.master, 'Master canvas');
    finite(master.width, 'Master width', 64, 32768); finite(master.height, 'Master height', 64, 32768);
    if (project.camera != null) {
      const camera = requireObject(project.camera, 'Camera'); vector(camera.target, 3, 'Camera target');
      finite(camera.yaw, 'Camera yaw'); finite(camera.pitch, 'Camera pitch'); finite(camera.distance, 'Camera distance', .00001, 1e9);
      if (camera.fov != null) finite(camera.fov, 'Camera FOV', 1, 179);
    }
    if (project.settings != null) {
      requireObject(project.settings, 'Thiết lập');
      for (const key of ['ambient','exposure','haze','beam']) if (project.settings[key] != null) finite(project.settings[key], 'Thiết lập / ' + key, 0, 10000);
    }
    const lights = array(project.lights, 'Đèn', 64, true); uniqueRows(lights, 'Đèn');
    for (const light of lights) {
      vector(light.pos, 3, 'Vị trí đèn'); vector(light.target, 3, 'Hướng đèn');
      if (light.color != null && !/^#[0-9a-f]{6}$/i.test(light.color)) fail('Màu đèn không hợp lệ.');
    }
    if (project.accent != null && !/^#[0-9a-f]{6}$/i.test(project.accent)) fail('Màu chủ đạo không hợp lệ.');
    if (project.duration != null) finite(project.duration, 'Thời lượng show', 1, 600);
    if (project.time != null) finite(project.time, 'Playhead', 0, 600);
    const liveData = project.live;
    if (liveData != null) {
      requireObject(liveData, 'Dữ liệu show');
      if (liveData.audio != null) assetBytes += asset(liveData.audio, 'Nhạc');
      for (const key of ['config','pixelOptions','show','director','lighting9','stage10','choreography11','stageLift124','pro127','vj130','manual131','lightTake132','tc134','laser135','mount136','fx141','matrix143']) {
        if (liveData[key] != null) requireObject(liveData[key], 'Show / ' + key);
      }
      if (liveData.cues != null) array(liveData.cues, 'VJ cues', 100).forEach(c => requireObject(c, 'VJ cue'));
      const knownArrays = [[liveData.show,'tracks',24],[liveData.show,'clips',500],[liveData.show,'markers',200],[liveData.show,'people',96],
        [liveData.director,'cameras',24],[liveData.director,'acts',24],[liveData.director,'surfaceUV',300],
        [liveData.stage10,'scenes',80],[liveData.stageLift124,'items',12],[liveData.fx141,'fixtures',64],[liveData.fx141,'cues',500],
        [liveData.laser135,'fixtures',64],[liveData.laser135,'ildaMeta',32],[liveData.laser135,'ildaShows',32],[liveData.mount136,'manualTrussLayers',100],[liveData.matrix143,'paths',256],[liveData.matrix143,'cues',500]];
      for (const [parent, key, limit] of knownArrays) if (parent?.[key] != null) array(parent[key], key, limit).forEach(row => requireObject(row, key));
      if (liveData.laser135?.ildaShows != null) {
        let totalIldaPts = 0;
        for (const showEntry of liveData.laser135.ildaShows) {
          const frames = array(showEntry.frames, 'ILDA frames', 512, true);
          for (const frame of frames) {
            requireObject(frame, 'ILDA frame');
            const posLen = Array.isArray(frame.positions)
              ? vector(frame.positions, frame.positions.length, 'ILDA positions') || frame.positions.length
              : floats(frame.positions, 'ILDA positions', 6000000);
            const colLen = Array.isArray(frame.colors)
              ? vector(frame.colors, frame.colors.length, 'ILDA colors') || frame.colors.length
              : floats(frame.colors, 'ILDA colors', 6000000);
            let blkLen = 0;
            if (Array.isArray(frame.blanked)) {
              const blk = array(frame.blanked, 'ILDA blanked', 2000000, true);
              for (const b of blk) if (b !== 0 && b !== 1 && typeof b !== 'boolean') fail('ILDA blanked: giá trị không hợp lệ.');
              blkLen = blk.length;
            } else if (typeof frame.blanked === 'string') {
              if (frame.blanked.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(frame.blanked)) fail('ILDA blanked: bộ đệm base64 không hợp lệ.');
              blkLen = frame.blanked.length ? (frame.blanked.length / 4 * 3 - (frame.blanked.endsWith('==') ? 2 : frame.blanked.endsWith('=') ? 1 : 0)) : 0;
            } else {
              fail('ILDA blanked: thiếu dữ liệu blanking.');
            }
            if (posLen % 3 !== 0 || posLen !== colLen || posLen / 3 !== blkLen) fail('Khung ILDA không khớp số lượng tọa độ/màu/blanking.');
            totalIldaPts += blkLen;
            if (totalIldaPts > 2000000) fail('Tổng số điểm ILDA lưu trong dự án vượt ngưỡng 2.000.000 điểm.');
          }
        }
      }
      const show = liveData.show;
      if (show) {
        const tracks = show.tracks || [], clips = show.clips || [];
        uniqueRows(tracks, 'Track'); uniqueRows(clips, 'Cue');
        const trackIds = new Set(tracks.map(t => t.id));
        for (const track of tracks) if (!['visual','light','audio','act','camera','vj'].includes(track.type)) fail('Loại track không được hỗ trợ.');
        for (const cue of clips) {
          if (!trackIds.has(cue.track)) fail('Cue tham chiếu track không tồn tại: ' + cue.id);
          finite(cue.start, 'Bắt đầu cue', 0, 600); finite(cue.duration, 'Độ dài cue', .001, 600);
          if (typeof cue.source !== 'string') fail('Cue thiếu nguồn hiệu ứng.');
          if (cue.fx141 != null) requireObject(cue.fx141, 'Thông số cue FX');
          if (cue.source.startsWith('matrix143:')) matrixCue(cue, tracks);
          else if (cue.matrix143 !== undefined) fail('Metadata LED Matrix gắn vào cue khác loại.');
        }
      }
      if (liveData.matrix143 != null) matrixBank(liveData.matrix143, show);
      const fx = liveData.fx141?.fixtures || [];
      uniqueRows(fx, 'Đèn PAR/LINE/LASER');
      for (const fixture of fx) {
        if (!['par','line','laser'].includes(fixture.kind)) fail('Loại đèn mở rộng không hợp lệ.');
        vector(fixture.pos, 3, 'Vị trí đèn mở rộng');
        if (fixture.color != null && !/^#[0-9a-f]{6}$/i.test(fixture.color)) fail('Màu đèn mở rộng không hợp lệ.');
        for (const key of ['pixels','power','pan','tilt','spread','range','length']) if (fixture[key] != null) finite(fixture[key], 'Đèn mở rộng / ' + key);
      }
    }
    if (assetBytes > MAX_ASSETS) fail('Gói tài nguyên vượt 300 MB. Hãy dùng video proxy nhẹ hơn.');
    return { valid: true, screens: screens.length, media: media.length, lights: lights.length,
      fixtures: liveData?.fx141?.fixtures?.length || 0, matrixPaths: liveData?.matrix143?.paths?.length || 0, clips: liveData?.show?.clips?.length || 0, assetBytes };
  }

  async function parseFile(file) {
    if (!file || typeof file.text !== 'function') fail('Hãy chọn tệp .ledstudio.');
    if (file.size > MAX_PACKAGE) fail('Gói dự án vượt 450 MB; hãy dùng bản có media nhẹ hơn.');
    const text = await file.text();
    if (textSize(text) > MAX_PACKAGE) fail('Gói dự án vượt 450 MB.');
    let data;
    try { data = JSON.parse(text); } catch (_) { fail('Tệp .ledstudio không phải JSON hợp lệ hoặc đã bị cắt ngắn.'); }
    const summary = validate(data);
    return { data, text, summary, file: { name: file.name || 'project.ledstudio', size: textSize(text), text: async () => text } };
  }
  async function packCurrent() {
    const build = S.buildProjectData142 || (typeof buildProjectData142 === 'function' ? buildProjectData142 : null);
    if (!build) fail('Không tìm thấy bộ lưu dự án V15.1.');
    const data = await build(); data.appVersion = '15.1.0';
    const summary = validate(data), text = JSON.stringify(data);
    if (textSize(text) > MAX_PACKAGE) fail('Gói dự án vượt 450 MB.');
    return { data, text, summary };
  }
  function assetBytesNow() {
    return (state.model?.files || []).reduce((sum, f) => sum + (f.size || 0), 0)
      + state.media.reduce((sum, a) => sum + (a.file?.size || 0), 0) + (live.audioTrack?.file?.size || 0);
  }
  function setStatus(message, error = false) { R.message = message; R.error = error; paintStatus(); }
  async function exclusive(name, action) {
    if (R.operation || state.loadingProject || state.importing || state.recording) fail('Đang xử lý dự án. Hãy chờ thao tác hiện tại hoàn tất.');
    R.operation = name; paintStatus();
    try { return await action(); } finally { R.operation = null; paintStatus(); }
  }
  function pauseForTransaction() {
    const saved = { playing: state.playing, time: state.time, orbit: state.orbit,
      history: state.history.slice(), redo: state.redo.slice() };
    setPlaying(false); return saved;
  }
  function resume(saved, history = false) {
    if (history) { state.history = saved.history; state.redo = saved.redo; state.time = saved.time; state.orbit = saved.orbit; }
    setPlaying(saved.playing); historyButtons();
  }
  function releaseOrphans(assets) {
    for (const a of assets) if (!state.media.includes(a)) {
      a.element?.pause?.(); if (a.element) a.element.src = ''; if (a.url) URL.revokeObjectURL(a.url);
    }
  }
  const previousLoad = loadProject;
  loadProject = async function (file) {
    return exclusive('load', async () => {
      busy(true, 'Đang kiểm tra gói dự án...');
      let before = null, playback = null, oldMedia = [], failedMedia = [];
      try {
        const incoming = await parseFile(file);
        playback = pauseForTransaction();
        before = await packCurrent(); oldMedia = [...state.media];
        busy(true, 'Đang mở dự án đã kiểm tra...');
        try {
          await previousLoad(incoming.file);
          releaseOrphans(oldMedia);
          R.rescueText = null; R.rescueName = null;
          setStatus('Đã mở ' + incoming.data.model.name + '. Bản dự phòng hiện có được giữ lại.');
          toast('Đã mở dự án V15.1 / ' + incoming.summary.screens + ' LED · ' + incoming.summary.fixtures + ' đèn mở rộng.');
          return incoming.summary;
        } catch (loadError) {
          failedMedia = [...state.media];
          R.rescueText = before.text; R.rescueName = before.data.model.name;
          busy(true, 'Gói mới mở không thành công. Đang phục hồi phiên trước...');
          try {
            await previousLoad({ name: 'rollback.ledstudio', size: textSize(before.text), text: async () => before.text });
            releaseOrphans([...oldMedia, ...failedMedia]);
            resume(playback, true); playback = null;
            R.rescueText = null; R.rescueName = null;
          } catch (rollbackError) {
            setStatus('Không khôi phục được trên màn hình. Bấm “Tải phiên trước” để lấy nguyên gói đã giữ lại.', true);
            openRecovery();
            fail('Không mở được gói mới: ' + loadError.message + '. Phiên trước vẫn được giữ trong bộ nhớ; hãy tải ngay trong Dự phòng.');
          }
          fail('Không mở được gói mới: ' + loadError.message + '. Đã khôi phục dự án trước đó.');
        }
      } catch (error) {
        if (playback) { resume(playback, true); playback = null; }
        if (!R.rescueText) setStatus(error.message, true);
        throw error;
      } finally { busy(false); }
    });
  };
  saveProject = async function () {
    try {
      return await exclusive('save', async () => {
        const playback = pauseForTransaction(); busy(true, 'Đang đóng gói và kiểm tra dự án...');
        try {
          const packed = await packCurrent();
          downloadText(safeName(packed.data.model.name.replace(/\.[a-z0-9]+$/i, '')) + '.ledstudio', packed.text);
          R.lastSave = Date.now(); setStatus('Đã xuất gói dự án đầy đủ lúc ' + dateText(R.lastSave) + '.');
          toast('Đã xuất .ledstudio đầy đủ: model, media, mapping và timecode V15.1.');
          return packed.data;
        } finally { resume(playback); busy(false); }
      });
    } catch (error) { setStatus(error.message, true); toast('Không lưu được dự án: ' + error.message, 9000); return null; }
  };
  async function applyProjectData142(dataOrText, name = 'cloud.ledstudio') {
    const text = typeof dataOrText === 'string' ? dataOrText : JSON.stringify(dataOrText);
    return loadProject({ name, size: textSize(text), text: async () => text });
  }
  S.loadProject = loadProject; S.saveProject = saveProject;
  S.packCurrent142 = packCurrent; S.validateProject142 = validate; S.applyProjectData142 = applyProjectData142;
  window.applyProjectData142 = applyProjectData142;
  if (el('saveProject')) el('saveProject').onclick = saveProject;

  function database() {
    if (R.dbPromise) return R.dbPromise;
    R.dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('Trình duyệt không hỗ trợ lưu dự phòng. Hãy dùng Lưu dự án.'));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' }); };
      request.onsuccess = () => {
        const db = request.result; db.onversionchange = () => { db.close(); R.dbPromise = null; }; resolve(db);
      };
      request.onerror = () => reject(request.error || new Error('Không mở được kho dự phòng trong trình duyệt.'));
      request.onblocked = () => reject(new Error('Kho dự phòng đang được tab khác sử dụng; hãy đóng tab đó rồi thử lại.'));
    }).catch(error => { R.dbPromise = null; throw error; });
    return R.dbPromise;
  }
  async function readRecord() {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readonly');
      const request = transaction.objectStore(STORE).get('latest');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Không đọc được bản dự phòng.'));
    });
  }
  async function writeRecord(record) {
    const db = await database();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(record);
      transaction.oncomplete = resolve;
      transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error('Không đủ dung lượng hoặc trình duyệt không cho lưu.'));
    });
    R.backup = publicMeta(record);
  }
  async function readBackup() {
    const record = await readRecord();
    if (!record) return null;
    return { ...publicMeta(record), text: await record.blob.text() };
  }
  async function backup(options = {}) {
    const automatic = options.automatic === true;
    if (automatic && (!R.auto || document.hidden || state.playing || state.presenting || R.operation || state.importing || state.loadingProject || state.recording)) {
      if (R.auto && state.playing && !R.operation) setStatus('Tự dự phòng đang chờ bạn tạm dừng show.');
      return { skipped: true };
    }
    if (automatic && assetBytesNow() > AUTO_ASSETS) { setStatus('Media vượt 25 MB: hãy dùng Sao lưu ngay hoặc Lưu dự án.'); return { skipped: true, reason: 'size' }; }
    return exclusive('backup', async () => {
      const playback = automatic ? null : pauseForTransaction();
      if (!automatic) busy(true, 'Đang tạo bản dự phòng đầy đủ...');
      try {
        const packed = await packCurrent(), size = textSize(packed.text);
        if (automatic && size > AUTO_PACKAGE) { setStatus('Gói vượt 50 MB: dùng Sao lưu ngay hoặc Lưu dự án.'); return { skipped: true, reason: 'size' }; }
        const record = { id: 'latest', name: packed.data.model.name, createdAt: new Date().toISOString(),
          appVersion: '15.1.0', size, assetBytes: packed.summary.assetBytes,
          blob: new Blob([packed.text], { type: 'application/json' }) };
        await writeRecord(record);
        setStatus((automatic ? 'Đã tự dự phòng' : 'Đã tạo bản dự phòng') + ' đầy đủ lúc ' + dateText(record.createdAt) + '.');
        if (!automatic) toast('Đã tạo bản dự phòng đầy đủ trong trình duyệt.');
        return publicMeta(record);
      } catch (error) {
        setStatus('Không dự phòng được: ' + error.message + ' Dùng Lưu dự án để tải tệp về máy.', true);
        throw error;
      } finally { if (playback) resume(playback); if (!automatic) busy(false); }
    });
  }
  async function restoreBackup() {
    const record = await readBackup();
    if (!record) fail('Chưa có bản dự phòng để khôi phục.');
    const result = await loadProject({ name: record.name + '.ledstudio', size: record.size, text: async () => record.text });
    recoveryDialog.close();
    toast('Đã khôi phục bản dự phòng ' + dateText(record.createdAt) + '.');
    return result;
  }
  async function downloadBackup() {
    const record = await readRecord(); if (!record) fail('Chưa có bản dự phòng.');
    download(safeName(record.name) + '_backup.ledstudio', record.blob);
  }
  function downloadRescue() {
    if (!R.rescueText) return false;
    downloadText(safeName(R.rescueName) + '_recovered.ledstudio', R.rescueText); return true;
  }
  function setAutoBackup(value) {
    R.auto = value === true;
    setStatus(R.auto ? 'Đã bật dự phòng mỗi 30 giây khi tạm dừng show; tối đa 25 MB tài nguyên.' : 'Tự dự phòng đang tắt. Bạn vẫn có thể Sao lưu ngay.');
    return R.auto;
  }

  const recoveryDialog = document.createElement('dialog');
  recoveryDialog.id = 'recovery142Dialog'; recoveryDialog.setAttribute('aria-labelledby', 'recovery142Title');
  recoveryDialog.innerHTML = '<div class="recovery142-head"><div><small>V15.1 / PROJECT RECOVERY</small><h2 id="recovery142Title">Dự phòng dự án</h2></div><button type="button" id="recovery142Close" class="icon-btn" aria-label="Đóng dự phòng">✕</button></div>'
    + '<p class="recovery142-intro">Bản dự phòng giữ model, media, mapping, đèn và timecode. Dữ liệu lưu trong trình duyệt này; tải tệp .ledstudio để mang sang máy khác.</p>'
    + '<section class="recovery142-card"><span>BẢN DỰ PHÒNG GẦN NHẤT</span><strong id="recovery142Name">Chưa có</strong><div id="recovery142Meta">—</div></section>'
    + '<label class="recovery142-auto"><input type="checkbox" id="recovery142Auto"><span>Tự dự phòng mỗi 30 giây<small>Chỉ khi show tạm dừng; tối đa 25 MB tài nguyên và 50 MB cả gói. Mặc định tắt.</small></span></label>'
    + '<p id="recovery142Status" role="status" aria-live="polite"></p>'
    + '<div class="recovery142-actions"><button type="button" id="recovery142Backup" class="btn primary">Sao lưu ngay</button><button type="button" id="recovery142Restore" class="btn">Khôi phục</button><button type="button" id="recovery142Download" class="btn">Tải bản dự phòng</button><button type="button" id="recovery142Rescue" class="btn" hidden>Tải phiên trước</button></div>'
    + '<p class="recovery142-note">Sao lưu ngay thay bản dự phòng trước. Khôi phục mở bản dự phòng làm dự án hiện tại. Trình duyệt có thể xóa dữ liệu này khi bạn dọn dữ liệu duyệt web.</p>';
  document.body.appendChild(recoveryDialog);
  const recoveryButton = document.createElement('button');
  recoveryButton.id = 'recovery142OpenBtn'; recoveryButton.type = 'button'; recoveryButton.className = 'btn small';
  recoveryButton.textContent = 'Dự phòng'; recoveryButton.title = 'Sao lưu và khôi phục dự án V15.1';
  document.querySelector('.header-actions')?.prepend(recoveryButton);
  function paintStatus() {
    const status = el('recovery142Status');
    if (!status) return;
    status.textContent = R.operation ? ({ load: 'Đang mở dự án...', save: 'Đang xuất gói...', backup: 'Đang ghi dự phòng...' }[R.operation] || 'Đang xử lý...') : R.message;
    status.classList.toggle('error', R.error);
    el('recovery142Name').textContent = R.backup?.name || 'Chưa có bản dự phòng';
    el('recovery142Meta').textContent = R.backup ? dateText(R.backup.createdAt) + ' · ' + sizeText(R.backup.size) : 'Nhấn Sao lưu ngay để tạo một bản đầy đủ.';
    el('recovery142Auto').checked = R.auto;
    el('recovery142Auto').disabled = !!R.operation;
    el('recovery142Backup').disabled = !!R.operation;
    el('recovery142Restore').disabled = !!R.operation || !R.backup;
    el('recovery142Download').disabled = !!R.operation || !R.backup;
    el('recovery142Rescue').hidden = !R.rescueText;
    recoveryButton.classList.toggle('has-backup', !!R.backup);
    recoveryButton.title = R.backup ? 'Có dự phòng: ' + R.backup.name + ' · ' + dateText(R.backup.createdAt) : 'Sao lưu và khôi phục dự án V15.1';
  }
  async function refreshBackup() {
    try { const record = await readRecord(); R.backup = publicMeta(record); paintStatus(); return R.backup; }
    catch (error) { setStatus(error.message + ' Bạn vẫn có thể dùng Lưu dự án.', true); return null; }
  }
  function openRecovery() {
    paintStatus(); if (!recoveryDialog.open) recoveryDialog.showModal(); refreshBackup();
  }
  const report = action => () => Promise.resolve().then(action).catch(error => { setStatus(error.message, true); toast(error.message, 9000); });
  recoveryButton.onclick = openRecovery;
  el('recovery142Close').onclick = () => recoveryDialog.close();
  el('recovery142Auto').onchange = event => setAutoBackup(event.target.checked);
  el('recovery142Backup').onclick = report(() => backup());
  el('recovery142Restore').onclick = report(restoreBackup);
  el('recovery142Download').onclick = report(downloadBackup);
  el('recovery142Rescue').onclick = downloadRescue;
  // Legacy stage shortcuts run on document capture/bubble. Keep native typing,
  // checkbox Space and dialog Escape defaults while isolating this modal.
  window.addEventListener('keydown', event => {
    if (!recoveryDialog.open) return;
    event.stopPropagation();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault(); saveProject();
    }
  }, true);
  recoveryDialog.addEventListener('keydown', event => event.stopPropagation());
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault(); event.stopImmediatePropagation(); saveProject();
    }
  }, true);
  S.project142 = { validate, parseFile, load: loadProject, save: saveProject, backup, readBackup,
    restoreBackup, downloadBackup, downloadRescue, open: openRecovery, setAutoBackup,
    get status() { return { operation: R.operation, auto: R.auto, backup: R.backup ? { ...R.backup } : null,
      message: R.message, error: R.error, lastSave: R.lastSave, hasRescue: !!R.rescueText }; } };
  S.version = '15.1.0';
  document.title = 'ALPHA Creative LED Studio V15.1 | LED DÀY · SÁNG RÕ · 35 FX';
  const brand = document.querySelector('.brand small');
  if (brand) brand.textContent = 'V15.1 / LED DÀY · SÁNG RÕ · 35 FX';
  const footer = document.querySelector('.bottom-status > span:last-child');
  if (footer) footer.textContent = 'ALPHA / LOCAL BUILD 15.1';
  setInterval(() => { if (R.auto) backup({ automatic: true }).catch(() => {}); }, 30000);
  refreshBackup(); paintStatus();
})();
