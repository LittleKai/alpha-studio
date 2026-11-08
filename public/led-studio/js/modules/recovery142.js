/* V15.1: validated project transactions and optional local recovery.
   One serializer is shared with the portable .ledstudio download. */
(function () {
  'use strict';
  const S = window.STUDIO;
  if (!S || !S.engine) return;
  const state = S.state, engine = S.engine;
  const L = (vi, en) => typeof window.tr === 'function' ? window.tr(vi, en) : ((S.cloud16?.state?.locale || document.documentElement.dataset.locale) === 'en' ? en : vi);
  const MB = 1024 * 1024, MAX_ASSETS = 300 * MB, AUTO_ASSETS = 25 * MB;
  const MAX_PACKAGE = 450 * MB, AUTO_PACKAGE = 50 * MB;
  const DB_NAME = 'ALPHA_LED_STUDIO_RECOVERY_142', STORE = 'projects';
  let initialAuto = true;
  try { if (localStorage.getItem('ledstudio-auto-recovery') === '0') initialAuto = false; } catch (_) {}
  const R = { operation: null, auto: initialAuto, dirty: false, restoringBoot: false, lastSave: null, backup: null,
    message: () => L('Chưa tạo bản dự phòng trong trình duyệt này.', "No backup has been created in this browser."), error: false,
    rescueText: null, rescueName: null, dbPromise: null, startedAt: Date.now() };
  const el = id => document.getElementById(id);
  const plain = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const fail = message => { throw new Error(message); };
  const textSize = value => new Blob([value]).size;
  const sizeText = value => (value / MB).toLocaleString(L('vi-VN', 'en-US'), { maximumFractionDigits: 1 }) + ' MB';
  const dateText = value => new Date(value).toLocaleString(L('vi-VN', 'en-US'));
  const safeName = value => String(value || 'Stage').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0,110);
  const publicMeta = record => record ? { name: record.name, createdAt: record.createdAt,
    size: record.size, assetBytes: record.assetBytes, appVersion: record.appVersion } : null;

  function requireObject(value, label) {
    if (!plain(value)) fail(label + L(': cần một đối tượng hợp lệ.', ": a valid object is required."));
    return value;
  }
  function array(value, label, limit, optional = false) {
    if (value == null && optional) return [];
    if (!Array.isArray(value) || value.length > limit) fail(label + L(': danh sách không hợp lệ hoặc vượt giới hạn ', ": invalid list or limit exceeded: ") + limit + '.');
    return value;
  }
  function finite(value, label, min = -1e9, max = 1e9) {
    if (!Number.isFinite(value) || value < min || value > max) fail(label + L(': giá trị số không hợp lệ.', ": invalid numeric value."));
    return value;
  }
  function vector(value, length, label) {
    if (!Array.isArray(value) || value.length !== length || value.some(v => !Number.isFinite(v) || Math.abs(v) > 1e9)) fail(label + L(': tọa độ không hợp lệ.', ": invalid coordinates."));
  }
  function id(value, label) {
    if (typeof value !== 'string' || !value.length || value.length > 240 || /[<>"'`\u0000-\u001f]/.test(value)) fail(label + L(': mã định danh không hợp lệ.', ': invalid identifier.'));
  }
  function uniqueRows(rows, label) {
    const seen = new Set();
    for (const row of rows) {
      requireObject(row, label); id(row.id, label);
      if (seen.has(row.id)) fail(label + L(': trùng mã ', ": duplicate identifier ") + row.id + '.');
      seen.add(row.id);
    }
  }
  function scanValues(value) {
    const stack = [[value, 0]]; let count = 0;
    while (stack.length) {
      const [item, depth] = stack.pop();
      if (++count > 2000000 || depth > 80) fail(L('Cấu trúc dự án quá lớn hoặc lồng quá sâu.', "The project structure is too large or nested too deeply."));
      if (typeof item === 'number' && !Number.isFinite(item)) fail(L('Dự án chứa số không hữu hạn.', "The project contains a non-finite number."));
      if (!item || typeof item !== 'object') continue;
      for (const key of Object.keys(item)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') fail(L('Dự án chứa khóa dữ liệu không được hỗ trợ.', "The project contains an unsupported data key."));
        stack.push([item[key], depth + 1]);
      }
    }
  }
  function asset(item, label) {
    requireObject(item, label);
    if (typeof item.name !== 'string' || !item.name || item.name.length > 1024) fail(label + L(': thiếu tên tệp.', ": missing file name."));
    if (typeof item.data !== 'string') fail(label + L(': thiếu nội dung tệp đính kèm.', ": missing attached file contents."));
    const split = item.data.indexOf(',');
    if (split < 0 || split > 300 || !/^data:[^,]*;base64$/i.test(item.data.slice(0, split))) fail(label + L(': tài nguyên phải được nhúng đầy đủ dạng data URL base64.', ": assets must be fully embedded as base64 data URLs."));
    const data = item.data.slice(split + 1);
    const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
    const validB64 = data.length % 4 === 0 && !/[^A-Za-z0-9+/]/.test(data.slice(0, data.length - padding));
    if (!validB64) fail(label + L(': dữ liệu base64 bị hỏng.', ": corrupted base64 data."));
    const bytes = data.length / 4 * 3 - padding;
    if (bytes > MAX_ASSETS) fail(label + L(': tệp quá lớn.', ": file too large."));
    return bytes;
  }
  function floats(data, label, maxValues) {
    if (typeof data !== 'string' || data.length > Math.ceil(maxValues * 4 / 3) * 4 + 8 || data.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) fail(label + L(': bộ đệm không hợp lệ.', ": invalid buffer."));
    let values;
    try { values = decodeFloats(data); } catch (_) { fail(label + L(': không giải mã được bộ đệm.', ": unable to decode buffer.")); }
    if (values.length > maxValues) fail(label + L(': vượt giới hạn hình học.', ": geometry limit exceeded."));
    for (const value of values) if (!Number.isFinite(value) || Math.abs(value) > 1e9) fail(label + L(': chứa tọa độ không hữu hạn.', ": contains non-finite coordinates."));
    return values.length;
  }

  // V15.1 extension data is validated before any model or timeline mutation.
  const MATRIX_PRESETS = new Set(['steady','blink','strobe','pulse','chase','chaseReverse','pingPong','comet','cometReverse','accumulate','accumulateReverse','centerOut','centerIn','alternating','theaterChase','twoColorChase','rainbowCycle','rainbowChase','sparkle','twinkle','wave','colorWipe','scan','groupSequence','blackout','dualComet','meteorRain','fire','waterRipple','diagonalChase','checkerboard','zipper','breathingGradient','bouncingBalls','confetti']);
  function matrixTarget(value, label) {
    if (typeof value !== 'string' || value.length > 240 || /[\u0000-\u001f]/.test(value) ||
        !(value === 'all' || /^path:[A-Za-z0-9_-]{1,100}$/.test(value) || /^group:.{0,40}$/.test(value) || /^[A-Za-z0-9_-]{1,100}$/.test(value))) fail(label + L(': đích LED Matrix không hợp lệ.', ": invalid LED Matrix target."));
  }
  function matrixOptions(value, label) {
    requireObject(value, label);
    if (value.preset !== undefined && !MATRIX_PRESETS.has(value.preset)) fail(label + L(': preset LED Matrix không được hỗ trợ.', ": unsupported LED Matrix preset."));
    const rules = { count:[1,4096,true], rows:[1,64,true], time:[0,36000], duration:[.001,36000], bpm:[20,300],
      speed:[0,8], brightness:[0,1], tail:[1,4096], groupSize:[1,4096,true], phase:[-10000,10000],
      seed:[0,4294967295,true], phaseDuration:[.01,36000] };
    for (const [key,[min,max,integer]] of Object.entries(rules)) if (value[key] !== undefined) {
      finite(value[key], label + ' / ' + key, min, max);
      if (integer && !Number.isInteger(value[key])) fail(label + ' / ' + key + L(': cần số nguyên.', ": an integer is required."));
    }
    for (const key of ['color','color2']) if (value[key] !== undefined && !/^#[0-9a-f]{6}$/i.test(value[key])) fail(label + ' / ' + key + L(': màu LED Matrix không hợp lệ.', ": invalid LED Matrix color."));
    if (value.reverse !== undefined && typeof value.reverse !== 'boolean') fail(label + L(': reverse cần là boolean.', ": reverse must be a boolean."));
    if (value.target !== undefined) matrixTarget(value.target, label);
  }
  function matrixCue(cue, tracks) {
    const match = cue.source.match(/^matrix143:([^@]+)(?:@([\s\S]*))?$/);
    if (!match || !MATRIX_PRESETS.has(match[1])) fail(L('Cue LED Matrix: nguồn hiệu ứng không hợp lệ.', "LED Matrix cue: invalid effect source."));
    if (match[2] !== undefined) matrixTarget(match[2], 'Cue LED Matrix');
    if (tracks.find(t => t.id === cue.track)?.type !== 'light') fail(L('Cue LED Matrix cần nằm trên track light.', "LED Matrix cues must be on a light track."));
    finite(cue.duration, L('Độ dài cue LED Matrix', "LED Matrix cue duration"), .05, 600);
    if (cue.start + cue.duration > 600 + 1e-8) fail(L('Cue LED Matrix kết thúc quá 600 giây.', "LED Matrix cue ends after 600 seconds."));
    for (const [key,min,max] of [['in',0,36000],['rate',.125,8],['gain',0,3],['fade',0,10]]) if (cue[key] !== undefined) finite(cue[key], 'Cue LED Matrix / ' + key, min, max);
    if (cue.matrix143 !== undefined) matrixOptions(cue.matrix143, L('Thông số cue LED Matrix', "LED Matrix cue settings"));
  }
  function matrixBank(bank, show) {
    requireObject(bank, 'LED Matrix');
    if (bank.v !== undefined && (!Number.isInteger(bank.v) || bank.v < 1 || bank.v > 5)) fail(L('Phiên bản dữ liệu LED Matrix không được hỗ trợ.', "Unsupported LED Matrix data version."));
    if (bank.masterBrightness !== undefined) finite(bank.masterBrightness, L('Độ sáng tổng LED Matrix', "LED Matrix master brightness"), 0, 1);
    if (bank.object146 !== undefined) {
      const object = requireObject(bank.object146, L('Thiết lập viền object', "Object outline settings"));
      if (object.outlineMode !== undefined && !['object','face'].includes(object.outlineMode)) fail(L('Chế độ lấy viền object không hợp lệ.', "Invalid object outline mode."));
    }
    // Read older projects without re-enabling their retired color-scanning UI.
    if (bank.color145 !== undefined) {
      const color = requireObject(bank.color145, L('Thiết lập bắt line màu', "Color line detection settings"));
      if (color.color !== undefined && (typeof color.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color.color))) fail(L('Màu dùng để bắt line không hợp lệ.', "Invalid line detection color."));
      if (color.scope !== undefined && !['all','object'].includes(color.scope)) fail(L('Phạm vi bắt line màu không hợp lệ.', "Invalid color line detection scope."));
      const limits = { hueTolerance:[1,90], minSaturation:[0,1], minValue:[0,1], minLength:[2,2000], simplifyTolerance:[0,5], gapClose:[0,3], maxStrokeWidth:[0,200], maxDimension:[512,3072], width:[1,500], rows:[1,8], spacing:[0,1000], pitch:[10,2000] };
      for (const [key,[min,max]] of Object.entries(limits)) if (color[key] !== undefined) {
        finite(color[key], L('Thiết lập bắt line màu / ', "Color line detection settings / ") + key, min, max);
        if (['rows','gapClose','maxDimension'].includes(key) && !Number.isInteger(color[key])) fail(L('Thiết lập bắt line màu / ', "Color line detection settings / ") + key + L(': cần số nguyên.', ": an integer is required."));
      }
    }
    if (bank.scan144 !== undefined) {
      const scan = requireObject(bank.scan144, L('Thiết lập quét viền LED Matrix', "LED Matrix outline scan settings"));
      const enums = { strategy:['dominant','components','allPlanes'], mode:['auto','front','back','top','bottom','left','right'], scope:['all','named'] };
      for (const [key, values] of Object.entries(enums)) if (scan[key] !== undefined && !values.includes(scan[key])) fail(L('Thiết lập quét viền LED Matrix / ', "LED Matrix outline scan settings / ") + key + L(': lựa chọn không hợp lệ.', ": invalid option."));
      const limits = { tolerance:[1e-6,.02], planeTolerance:[1e-6,.05], minLength:[.001,100], simplifyTolerance:[0,.02], angleToleranceDegrees:[.05,10] };
      for (const [key,[min,max]] of Object.entries(limits)) if (scan[key] !== undefined) finite(scan[key], L('Thiết lập quét viền LED Matrix / ', "LED Matrix outline scan settings / ") + key, min, max);
    }
    const paths = array(bank.paths, L('Đường viền LED Matrix', "LED Matrix outline"), 256);
    uniqueRows(paths, L('Đường viền LED Matrix', "LED Matrix outline"));
    for (const p of paths) {
      if (!/^[A-Za-z0-9_-]{1,100}$/.test(p.id)) fail(L('Mã đường viền LED Matrix không hợp lệ.', "Invalid LED Matrix outline identifier."));
      for (const key of ['closed','enabled','reverse','diffuser','glow','bindingInvalid']) if (p[key] !== undefined && typeof p[key] !== 'boolean') fail(L('Viền LED Matrix / ', "LED Matrix outline / ") + key + L(': cần boolean.', ": a boolean is required."));
      if (p.sourceMeshes !== undefined) {
        const sources = array(p.sourceMeshes, L('Object nguồn của viền LED Matrix', "LED Matrix outline source object"), 32);
        if (sources.length < 2) fail(L('Viền ghép LED Matrix cần từ 2 đến 32 object nguồn.', "Combined LED Matrix outlines require 2 to 32 source objects."));
        const seen = new Set();
        for (const key of sources) {
          if (typeof key !== 'string' || !key.length || key.length > 65536 || /[\u0000-\u001f]/.test(key)) fail(L('Object nguồn của viền LED Matrix: mã nguồn không hợp lệ.', "LED Matrix outline source object: invalid source identifier."));
          if (seen.has(key)) fail(L('Object nguồn của viền LED Matrix: mã nguồn bị trùng.', "LED Matrix outline source object: duplicate source identifier."));
          seen.add(key);
        }
      }
      const points = array(p.points, L('Điểm đường viền LED Matrix', "LED Matrix outline point"), 4096);
      const minimum = p.closed ? 3 : 2;
      if (points.length < minimum) fail(L('Viền LED Matrix cần ít nhất ', "LED Matrix outlines require at least ") + minimum + L(' điểm.', " points."));
      const cleaned = [];
      for (const point of points) {
        vector(point, 3, L('Điểm đường viền LED Matrix', "LED Matrix outline point"));
        if (point.some(n => Math.abs(n) > 1e5)) fail(L('Điểm đường viền LED Matrix nằm ngoài giới hạn tọa độ.', "LED Matrix outline point exceeds coordinate limits."));
        if (!cleaned.length || Math.hypot(...point.map((n,i) => n - cleaned.at(-1)[i])) > 1e-6) cleaned.push(point);
      }
      if (cleaned.length > 2 && Math.hypot(...cleaned[0].map((n,i) => n - cleaned.at(-1)[i])) < 1e-6) cleaned.pop();
      if (cleaned.length < minimum) fail(L('Viền LED Matrix có quá ít điểm khác nhau.', "LED Matrix outline has too few distinct points."));
      let length = 0;
      for (let i=1; i<cleaned.length; i++) length += Math.hypot(...cleaned[i].map((n,j) => n - cleaned[i-1][j]));
      if (p.closed) length += Math.hypot(...cleaned[0].map((n,j) => n - cleaned.at(-1)[j]));
      if (length < .001) fail(L('Đường viền LED Matrix quá ngắn.', "LED Matrix outline is too short."));
      vector(p.normal, 3, L('Pháp tuyến đường viền LED Matrix', "LED Matrix outline normal"));
      if (p.normal.some(n => Math.abs(n) > 1e5) || Math.hypot(...p.normal) <= 1e-6) fail(L('Pháp tuyến đường viền LED Matrix phải khác 0 và hữu hạn.', "LED Matrix outline normal must be nonzero and finite."));
      const dimensions = { rows:[1,8,true], pitch:[.01,2], width:[.001,.5], spacing:[0,1], offset:[-5,5], lift:[.001,.5], brightness:[0,1], idle:[0,1] };
      for (const [key,[min,max,integer]] of Object.entries(dimensions)) if (p[key] !== undefined) {
        finite(p[key], L('Viền LED Matrix / ', "LED Matrix outline / ") + key, min, max);
        if (integer && !Number.isInteger(p[key])) fail(L('Viền LED Matrix / ', "LED Matrix outline / ") + key + L(': cần số nguyên.', ": an integer is required."));
      }
      if (p.color !== undefined && !/^#[0-9a-f]{6}$/i.test(p.color)) fail(L('Màu viền LED Matrix không hợp lệ.', "Invalid LED Matrix outline color."));
      for (const [key,max] of [['name',80],['group',40],['sourceMesh',65536],['sourceName',160]]) if (p[key] !== undefined && (typeof p[key] !== 'string' || p[key].length > max || /[\u0000-\u001f]/.test(p[key]))) fail(L('Viền LED Matrix / ', "LED Matrix outline / ") + key + L(': chuỗi không hợp lệ.', ": invalid string."));
    }
    if (bank.selected != null && (typeof bank.selected !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(bank.selected))) fail(L('Viền LED Matrix đang chọn không hợp lệ.', "Invalid selected LED Matrix outline."));
    if (bank.target !== undefined) matrixTarget(bank.target, 'LED Matrix');
    if (bank.duration !== undefined) finite(bank.duration, L('Thời lượng mặc định LED Matrix', "Default LED Matrix duration"), .05, 120);
    if (bank.effect !== undefined) matrixOptions(bank.effect, L('Thiết lập LED Matrix', "LED Matrix settings"));
    if (bank.lastPreset !== undefined && !MATRIX_PRESETS.has(bank.lastPreset)) fail(L('Preset LED Matrix đang chọn không hợp lệ.', "Invalid selected LED Matrix preset."));
    const cues = array(bank.cues, 'Metadata cue LED Matrix', 500, true);
    uniqueRows(cues, 'Metadata cue LED Matrix');
    for (const item of cues) {
      const clip = show?.clips?.find(c => c.id === item.id && String(c.source).startsWith('matrix143:'));
      if (!clip) fail(L('Metadata LED Matrix tham chiếu cue không tồn tại: ', "LED Matrix metadata references a missing cue: ") + item.id);
      matrixOptions(item.matrix143, 'Metadata cue LED Matrix');
    }
    return paths.length;
  }

  function validate(project) {
    requireObject(project, L('Dự án', "Project"));
    if (project.format !== 'ALPHA_LED_STUDIO/0.2') fail(L('Chỉ mở gói ALPHA_LED_STUDIO/0.2 (.ledstudio).', "Only ALPHA_LED_STUDIO/0.2 (.ledstudio) packages can be opened."));
    scanValues(project);
    const model = requireObject(project.model, 'Model');
    if (typeof model.name !== 'string' || !model.name.length || model.name.length > 1024) fail(L('Tên model không hợp lệ.', "Invalid model name."));
    const modelFiles = array(model.files, L('Tệp model', "Model files"), 2000, true);
    if (!model.demo && !model.blank && !modelFiles.length) fail(L('Dự án thiếu tệp model gốc.', "The project is missing its original model files."));
    const media = array(project.media, 'Media', 100);
    const screens = array(project.screens, 'LED', 300);
    uniqueRows(media, 'Media'); uniqueRows(screens, 'LED');
    let assetBytes = 0;
    for (const file of modelFiles) assetBytes += asset(file, 'Model ' + (file?.name || ''));
    for (const file of media) assetBytes += asset(file, 'Media ' + (file?.name || ''));
    for (const screen of screens) {
      if (typeof screen.name !== 'string') fail(L('LED thiếu tên.', "LED screen name is missing."));
      finite(screen.w, L('Chiều rộng LED', "LED width"), 1, 16384); finite(screen.h, L('Chiều cao LED', "LED height"), 1, 16384);
      for (const key of ['x','y','brightness','rotation','fit','liftMm']) if (screen[key] != null) finite(screen[key], 'LED / ' + key);
      if (screen.crop != null) vector(screen.crop, 4, 'Crop LED');
      if (screen.bindingNormal != null) vector(screen.bindingNormal, 3, L('Pháp tuyến LED', "LED normal"));
      const mesh = requireObject(screen.mesh, L('Hình học LED', "LED geometry"));
      const vertices = floats(mesh.p, L('Vị trí LED', "LED position"), 6000000);
      if (!vertices || vertices % 9) fail(L('Hình học LED phải gồm các tam giác đầy đủ.', "LED geometry must contain complete triangles."));
      if (floats(mesh.uv, 'UV LED', 4000000) !== vertices / 3 * 2) fail(L('Số lượng UV không khớp hình học LED.', "UV count does not match LED geometry."));
      if (mesh.n != null && floats(mesh.n, L('Pháp tuyến LED', "LED normal"), 6000000) !== vertices) fail(L('Số lượng pháp tuyến không khớp hình học LED.', "Normal count does not match LED geometry."));
    }
    const master = requireObject(project.master, 'Master canvas');
    finite(master.width, 'Master width', 64, 32768); finite(master.height, 'Master height', 64, 32768);
    if (project.camera != null) {
      const camera = requireObject(project.camera, 'Camera'); vector(camera.target, 3, 'Camera target');
      finite(camera.yaw, 'Camera yaw'); finite(camera.pitch, 'Camera pitch'); finite(camera.distance, 'Camera distance', .00001, 1e9);
      if (camera.fov != null) finite(camera.fov, 'Camera FOV', 1, 179);
    }
    if (project.settings != null) {
      requireObject(project.settings, L('Thiết lập', "Settings"));
      for (const key of ['ambient','exposure','haze','beam']) if (project.settings[key] != null) finite(project.settings[key], L('Thiết lập / ', "Settings / ") + key, 0, 10000);
    }
    const lights = array(project.lights, L('Đèn', "Lights"), 64, true); uniqueRows(lights, L('Đèn', "Lights"));
    for (const light of lights) {
      vector(light.pos, 3, L('Vị trí đèn', "Light position")); vector(light.target, 3, L('Hướng đèn', "Light target"));
      if (light.color != null && !/^#[0-9a-f]{6}$/i.test(light.color)) fail(L('Màu đèn không hợp lệ.', "Invalid light color."));
    }
    if (project.accent != null && !/^#[0-9a-f]{6}$/i.test(project.accent)) fail(L('Màu chủ đạo không hợp lệ.', "Invalid accent color."));
    if (project.duration != null) finite(project.duration, L('Thời lượng show', "Show duration"), 1, 600);
    if (project.time != null) finite(project.time, 'Playhead', 0, 600);
    const liveData = project.live;
    if (liveData != null) {
      requireObject(liveData, L('Dữ liệu show', "Show data"));
      if (liveData.audio != null) assetBytes += asset(liveData.audio, L('Nhạc', "Audio"));
      for (const key of ['config','pixelOptions','show','director','lighting9','stage10','choreography11','stageLift124','pro127','vj130','manual131','lightTake132','tc134','laser135','mount136','fx141','matrix143','stageAssets16']) {
        if (liveData[key] != null) requireObject(liveData[key], 'Show / ' + key);
      }
      if (liveData.cues != null) array(liveData.cues, 'VJ cues', 100).forEach(c => requireObject(c, 'VJ cue'));
      const knownArrays = [[liveData.show,'tracks',24],[liveData.show,'clips',500],[liveData.show,'markers',200],[liveData.show,'people',96],
        [liveData.director,'cameras',24],[liveData.director,'acts',24],[liveData.director,'surfaceUV',300],
        [liveData.stage10,'scenes',80],[liveData.stageLift124,'items',12],[liveData.fx141,'fixtures',64],[liveData.fx141,'cues',500],
        [liveData.laser135,'fixtures',64],[liveData.laser135,'ildaMeta',32],[liveData.laser135,'ildaShows',32],[liveData.mount136,'manualTrussLayers',100],[liveData.matrix143,'paths',256],[liveData.matrix143,'cues',500],[liveData.stageAssets16,'items',64]];
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
              for (const b of blk) if (b !== 0 && b !== 1 && typeof b !== 'boolean') fail(L('ILDA blanked: giá trị không hợp lệ.', "ILDA blanked: invalid value."));
              blkLen = blk.length;
            } else if (typeof frame.blanked === 'string') {
              if (frame.blanked.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(frame.blanked)) fail(L('ILDA blanked: bộ đệm base64 không hợp lệ.', "ILDA blanked: invalid base64 buffer."));
              blkLen = frame.blanked.length ? (frame.blanked.length / 4 * 3 - (frame.blanked.endsWith('==') ? 2 : frame.blanked.endsWith('=') ? 1 : 0)) : 0;
            } else {
              fail(L('ILDA blanked: thiếu dữ liệu blanking.', "ILDA blanked: blanking data is missing."));
            }
            if (posLen % 3 !== 0 || posLen !== colLen || posLen / 3 !== blkLen) fail(L('Khung ILDA không khớp số lượng tọa độ/màu/blanking.', "ILDA frame position, color and blanking counts do not match."));
            totalIldaPts += blkLen;
            if (totalIldaPts > 2000000) fail(L('Tổng số điểm ILDA lưu trong dự án vượt ngưỡng 2.000.000 điểm.', "Total ILDA points saved in the project exceed 2,000,000."));
          }
        }
      }
      const show = liveData.show;
      if (show) {
        const tracks = show.tracks || [], clips = show.clips || [];
        uniqueRows(tracks, 'Track'); uniqueRows(clips, 'Cue');
        const trackIds = new Set(tracks.map(t => t.id));
        for (const track of tracks) if (!['visual','light','audio','act','camera','vj'].includes(track.type)) fail(L('Loại track không được hỗ trợ.', "Unsupported track type."));
        for (const cue of clips) {
          if (!trackIds.has(cue.track)) fail(L('Cue tham chiếu track không tồn tại: ', "Cue references a missing track: ") + cue.id);
          finite(cue.start, L('Bắt đầu cue', "Cue start"), 0, 600); finite(cue.duration, L('Độ dài cue', "Cue duration"), .001, 600);
          if (typeof cue.source !== 'string') fail(L('Cue thiếu nguồn hiệu ứng.', "Cue effect source is missing."));
          if (cue.fx141 != null) requireObject(cue.fx141, L('Thông số cue FX', "FX cue settings"));
          if (cue.source.startsWith('matrix143:')) matrixCue(cue, tracks);
          else if (cue.matrix143 !== undefined) fail(L('Metadata LED Matrix gắn vào cue khác loại.', "LED Matrix metadata is attached to a different cue type."));
        }
      }
      if (liveData.matrix143 != null) matrixBank(liveData.matrix143, show);
      const fx = liveData.fx141?.fixtures || [];
      uniqueRows(fx, L('Đèn PAR/LINE/LASER', "PAR/LINE/LASER fixtures"));
      for (const fixture of fx) {
        if (!['par','line','laser'].includes(fixture.kind)) fail(L('Loại đèn mở rộng không hợp lệ.', "Invalid extended fixture type."));
        vector(fixture.pos, 3, L('Vị trí đèn mở rộng', "Extended fixture position"));
        if (fixture.color != null && !/^#[0-9a-f]{6}$/i.test(fixture.color)) fail(L('Màu đèn mở rộng không hợp lệ.', "Invalid extended fixture color."));
        for (const key of ['pixels','power','pan','tilt','spread','range','length']) if (fixture[key] != null) finite(fixture[key], L('Đèn mở rộng / ', "Extended fixture / ") + key);
      }
    }
    if (assetBytes > MAX_ASSETS) fail(L('Gói tài nguyên vượt 300 MB. Hãy dùng video proxy nhẹ hơn.', "Assets exceed 300 MB. Use smaller proxy videos."));
    return { valid: true, screens: screens.length, media: media.length, lights: lights.length,
      fixtures: liveData?.fx141?.fixtures?.length || 0, matrixPaths: liveData?.matrix143?.paths?.length || 0, clips: liveData?.show?.clips?.length || 0, assetBytes };
  }

  async function parseFile(file) {
    if (!file || typeof file.text !== 'function') fail(L('Hãy chọn tệp .ledstudio.', "Select a .ledstudio file."));
    if (file.size > MAX_PACKAGE) fail(L('Gói dự án vượt 450 MB; hãy dùng bản có media nhẹ hơn.', "Project package exceeds 450 MB; use a version with smaller media."));
    const text = await file.text(), size = textSize(text);
    if (size > MAX_PACKAGE) fail(L('Gói dự án vượt 450 MB.', "Project package exceeds 450 MB."));
    let data;
    try { data = JSON.parse(text); } catch (_) { fail(L('Tệp .ledstudio không phải JSON hợp lệ hoặc đã bị cắt ngắn.', "The .ledstudio file is invalid JSON or has been truncated.")); }
    const summary = validate(data);
    return { data, text, summary, file: { name: file.name || 'project.ledstudio', size, text: async () => text } };
  }
  async function packCurrent() {
    const build = S.buildProjectData142 || (typeof buildProjectData142 === 'function' ? buildProjectData142 : null);
    if (!build) fail(L('Không tìm thấy bộ lưu dự án V15.1.', "The V15.1 project serializer was not found."));
    const data = await build(); data.appVersion = '15.1.0';
    const summary = validate(data), text = JSON.stringify(data);
    if (textSize(text) > MAX_PACKAGE) fail(L('Gói dự án vượt 450 MB.', "Project package exceeds 450 MB."));
    return { data, text, summary };
  }
  function assetBytesNow() {
    return (state.model?.files || []).reduce((sum, f) => sum + (f.size || 0), 0)
      + state.media.reduce((sum, a) => sum + (a.file?.size || 0), 0) + (live.audioTrack?.file?.size || 0);
  }
  function setStatus(message, error = false) { R.message = message; R.error = error; paintStatus(); }
  async function exclusive(name, action) {
    if (R.operation || state.loadingProject || state.importing || state.recording) fail(L('Đang xử lý dự án. Hãy chờ thao tác hiện tại hoàn tất.', "Project operation in progress. Wait for it to finish."));
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
      const texture = engine.texCache.get(a.element);
      if (texture) {
        if (texture.callback != null) a.element.cancelVideoFrameCallback?.(texture.callback);
        engine.gl.deleteTexture(texture.tex); engine.texCache.delete(a.element);
      }
      a.element?.pause?.(); if (a.element) { a.element.src = ''; a.element.remove?.(); } if (a.url) URL.revokeObjectURL(a.url);
    }
  }
  const previousLoad = loadProject;
  loadProject = async function (file) {
    return exclusive('load', async () => {
      busy(true, L('Đang kiểm tra gói dự án...', "Checking project package..."));
      let before = null, playback = null, oldMedia = [], failedMedia = [];
      try {
        const incoming = await parseFile(file);
        playback = pauseForTransaction();
        if (!R.restoringBoot) before = await packCurrent();
        oldMedia = [...state.media];
        busy(true, L('Đang mở dự án đã kiểm tra...', "Opening validated project..."));
        try {
          await previousLoad(incoming.file);
          releaseOrphans(oldMedia);
          R.rescueText = null; R.rescueName = null;
          const openedName = incoming.data.projectName || incoming.data.model.name;
          setStatus(() => L('Đã mở ', "Opened ") + openedName + L('. Bản dự phòng hiện có được giữ lại.', ". The existing backup has been kept."));
          toast(L('Đã mở dự án: ', "Project opened: ") + incoming.summary.screens + ' LED · ' + incoming.summary.fixtures + L(' đèn mở rộng.', " extended fixtures."));
          if (!R.restoringBoot) scheduleAutoBackup142(1200);
          return incoming.summary;
        } catch (loadError) {
          failedMedia = [...state.media];
          if (!before) {
            releaseOrphans([...oldMedia, ...failedMedia]);
            try { if (typeof demo === 'function') demo(); } catch (_) {}
            resume(playback, true); playback = null;
            fail(L('Không mở được gói dự phòng khi khởi động: ', "Unable to open boot backup package: ") + loadError.message);
          }
          R.rescueText = before.text; R.rescueName = before.data.model.name;
          busy(true, L('Gói mới mở không thành công. Đang phục hồi phiên trước...', "The new package could not be opened. Restoring the previous session..."));
          try {
            await previousLoad({ name: 'rollback.ledstudio', size: textSize(before.text), text: async () => before.text });
            releaseOrphans([...oldMedia, ...failedMedia]);
            resume(playback, true); playback = null;
            R.rescueText = null; R.rescueName = null;
          } catch (rollbackError) {
            setStatus(() => L('Không khôi phục được trên màn hình. Bấm “Tải phiên trước” để lấy nguyên gói đã giữ lại.', "Unable to restore the view. Click “Download previous session” to retrieve the preserved package."), true);
            openRecovery();
            fail(L('Không mở được gói mới: ', "Unable to open the new package: ") + loadError.message + L('. Phiên trước vẫn được giữ trong bộ nhớ; hãy tải ngay trong Dự phòng.', ". The previous session is still in memory; download it now from Recovery."));
          }
          fail(L('Không mở được gói mới: ', "Unable to open the new package: ") + loadError.message + L('. Đã khôi phục dự án trước đó.', ". The previous project has been restored."));
        }
      } catch (error) {
        if (playback) { resume(playback, true); playback = null; }
        if (!R.rescueText) setStatus(() => error.message, true);
        throw error;
      } finally { busy(false); }
    });
  };
  saveProject = async function () {
    try {
      return await exclusive('save', async () => {
        const playback = pauseForTransaction(); busy(true, L('Đang đóng gói và kiểm tra dự án...', "Packaging and validating project..."));
        try {
          const packed = await packCurrent();
          downloadText(safeName(packed.data.model.name.replace(/\.[a-z0-9]+$/i, '')) + '.ledstudio', packed.text);
          R.lastSave = Date.now(); setStatus(() => L('Đã xuất gói dự án đầy đủ lúc ', "Full project package exported at ") + dateText(R.lastSave) + '.');
          toast(L('Đã xuất .ledstudio đầy đủ: model, media, mapping và timecode V15.1.', "Full .ledstudio exported: model, media, mapping and V15.1 timecode."));
          return packed.data;
        } finally { resume(playback); busy(false); }
      });
    } catch (error) { setStatus(() => error.message, true); toast(L('Không lưu được dự án: ', "Unable to save project: ") + error.message, 9000); return null; }
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
      if (!window.indexedDB) return reject(new Error(L('Trình duyệt không hỗ trợ lưu dự phòng. Hãy dùng Lưu dự án.', "This browser does not support backups. Use Save project.")));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' }); };
      request.onsuccess = () => {
        const db = request.result; db.onversionchange = () => { db.close(); R.dbPromise = null; }; resolve(db);
      };
      request.onerror = () => reject(request.error || new Error(L('Không mở được kho dự phòng trong trình duyệt.', "Unable to open browser backup storage.")));
      request.onblocked = () => reject(new Error(L('Kho dự phòng đang được tab khác sử dụng; hãy đóng tab đó rồi thử lại.', "Backup storage is in use by another tab; close that tab and try again.")));
    }).catch(error => { R.dbPromise = null; throw error; });
    return R.dbPromise;
  }
  async function readRecord() {
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readonly');
      const request = transaction.objectStore(STORE).get('latest');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error(L('Không đọc được bản dự phòng.', "Unable to read backup.")));
    });
  }
  async function writeRecord(record) {
    const db = await database();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(record);
      transaction.oncomplete = resolve;
      transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error(L('Không đủ dung lượng hoặc trình duyệt không cho lưu.', "Not enough storage or browser storage access denied.")));
    });
    R.backup = publicMeta(record);
  }
  async function readBackup() {
    const record = await readRecord();
    if (!record) return null;
    return { ...publicMeta(record), text: await record.blob.text() };
  }
  let autoTimer = 0;
  function scheduleAutoBackup142(delayMs = 1800) {
    if (!R.auto || R.restoringBoot || R.operation === 'load' || state.loadingProject || state.importing) return;
    R.dirty = true;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      autoTimer = 0;
      if (R.auto && R.dirty) backup({ automatic: true, fromEdit: true }).catch(() => {});
    }, delayMs);
  }
  async function clearBackup() {
    clearTimeout(autoTimer);
    R.dirty = false;
    try {
      const db = await database();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete('latest');
        tx.oncomplete = resolve;
        tx.onabort = tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
    R.backup = null;
    paintStatus();
  }
  async function createNewProject142(mode = 'demo') {
    const isBlank = mode === 'blank' || (mode && typeof mode === 'object' && (mode.mode === 'blank' || mode.blank === true));
    clearTimeout(autoTimer);
    R.dirty = false;
    setPlaying(false);
    if (S.lumi18?.liveShow18?.running) S.lumi18.stopLiveShow18?.();
    if (S.lumi18?.state?.pendingPreview?.active) S.lumi18.revertStagePreview?.();
    const oldMedia = [...(state.media || [])];
    state.media = [];
    if (engine.media?.clear) engine.media.clear();
    releaseOrphans(oldMedia);
    const resetFn = typeof window.demo === 'function' ? window.demo : S.demo;
    const restoreExtrasFn = typeof window.restoreLiveExtras === 'function' ? window.restoreLiveExtras : S.restoreLiveExtras;
    if (isBlank) {
      resetFn?.();
      await restoreExtrasFn?.(null);
      if (S.stageAssets16?.clearAll) S.stageAssets16.clearAll();
      for (const s of engine.surfaces || []) engine.releaseMesh?.(s.mesh);
      engine.surfaces = [];
      engine.selected = null;
      engine.setModel([]);
      engine.lights = [];
      engine.rebuildFixtures?.();
      state.model = { name: 'Empty_Stage', files: [], demo: false, blank: true };
      state.selectedMesh = null;
      state.hit = null;
      state.selectedLight = null;
      state.rebindId = null;
      state.activeStageSet18 = 0;
      state.step = 'stage';
      engine.view = 'stage';
      engine.cameraPreset?.('iso');
      if (engine.camera) {
        engine.camera.yaw = 0.15;
        engine.camera.pitch = 0.22;
        engine.camera.distance = 18;
        engine.camera.target = [0, 1.5, 0];
      }
      document.querySelector?.('.import-section')?.classList?.remove('v16-collapsed');
    } else {
      await restoreExtrasFn?.(null);
      resetFn?.();
    }
    state.loop = false;
    state.projectName = L('Dự án mới', 'Untitled stage');
    state.history = [];
    state.redo = [];
    if (S.cloud16?.state) {
      S.cloud16.state.currentDriveFileId = null;
      S.cloud16.state.driveFileId = null;
      S.cloud16.state.driveModelName = null;
      S.cloud16.state.driveStage = null;
      S.cloud16.state.shareProjectId = null;
      S.cloud16.state.shareStage = null;
    }
    await clearBackup();
    window.renderUI?.();
    toast(isBlank
      ? L('Đã tạo dự án trắng. Hãy nhập model 3D (.glb, .gltf, .dae, .obj) của bạn để bắt đầu.', 'Created a blank project. Import your 3D model (.glb, .gltf, .dae, .obj) to begin.')
      : L('Đã khởi tạo dự án sân khấu mẫu.', 'Created a new demo stage project.'));
    return { mode: isBlank ? 'blank' : 'demo' };
  }
  function promptNewProject142() {
    if (typeof window.dialog !== 'function') { createNewProject142('demo'); return; }
    window.dialog(
      L('Tạo dự án sân khấu mới?', 'Create a new stage project?'),
      '<p>' + L('Chọn kiểu khởi tạo dự án mới. Hãy lưu dự án hiện tại trước nếu bạn cần giữ lại các thay đổi.', 'Choose how to initialize the new project. Save your current project first if you want to keep your changes.') + '</p>' +
      '<div class="new-proj142-grid">' +
        '<button type="button" id="newProjDemo142" class="new-proj142-card" data-new-proj-mode="demo">' +
          '<svg class="ico" aria-hidden="true"><use href="#i-layers"></use></svg>' +
          '<strong>' + L('Dự án mẫu (Demo)', 'Demo project') + '</strong>' +
          '<span>' + L('Sân khấu mẫu dựng sẵn khung Truss, 3 màn hình LED, dàn đèn DMX và nghệ sĩ 3D để thử nghiệm ngay.', 'Pre-built demo stage with Truss, 3 LED screens, DMX lighting rig and 3D performers.') + '</span>' +
        '</button>' +
        '<button type="button" id="newProjBlank142" class="new-proj142-card" data-new-proj-mode="blank">' +
          '<svg class="ico" aria-hidden="true"><use href="#i-upload"></use></svg>' +
          '<strong>' + L('Dự án trắng (Tự import)', 'Blank project (Import own)') + '</strong>' +
          '<span>' + L('Trắng hoàn toàn — xóa hết sân khấu, màn LED, đèn và đạo cụ để bạn nhập model 3D của riêng mình.', 'Completely blank — clears all stage meshes, LEDs, lights and props so you can import your own 3D model.') + '</span>' +
        '</button>' +
      '</div>',
      [
        { label: L('Hủy', 'Cancel') },
        { label: L('Dự án trắng (Tự import)', 'Blank project (Import own)'), action: () => { createNewProject142('blank'); } },
        { label: L('Dự án mẫu (Demo)', 'Demo project'), primary: true, action: () => { createNewProject142('demo'); } }
      ]
    );
    const bindCard = (id, m) => {
      const btn = el(id);
      if (btn) btn.onclick = () => { el('modal')?.close?.(); createNewProject142(m); };
    };
    bindCard('newProjDemo142', 'demo');
    bindCard('newProjBlank142', 'blank');
  }
  async function backup(options = {}) {
    const automatic = options.automatic === true;
    const fromEdit = options.fromEdit === true;
    if (automatic && (!R.auto || document.hidden || (!fromEdit && state.playing) || state.presenting || R.operation || state.importing || state.loadingProject || state.recording)) {
      if (R.auto && state.playing && !fromEdit && !R.operation) setStatus(() => L('Tự dự phòng đang chờ bạn tạm dừng show.', "Automatic backup is waiting for you to pause the show."));
      return { skipped: true };
    }
    if (automatic && assetBytesNow() > AUTO_ASSETS) { setStatus(() => L('Media vượt 25 MB: hãy dùng Sao lưu ngay hoặc Lưu dự án.', "Media exceeds 25 MB: use Back up now or Save project.")); return { skipped: true, reason: 'size' }; }
    return exclusive('backup', async () => {
      const playback = automatic ? null : pauseForTransaction();
      if (!automatic) busy(true, L('Đang tạo bản dự phòng đầy đủ...', "Creating full backup..."));
      try {
        const packed = await packCurrent(), size = textSize(packed.text);
        if (automatic && size > AUTO_PACKAGE) { setStatus(() => L('Gói vượt 50 MB: dùng Sao lưu ngay hoặc Lưu dự án.', "Package exceeds 50 MB: use Back up now or Save project.")); return { skipped: true, reason: 'size' }; }
        const record = { id: 'latest', name: packed.data.projectName || packed.data.model.name, createdAt: new Date().toISOString(),
          appVersion: '15.1.0', size, assetBytes: packed.summary.assetBytes,
          blob: new Blob([packed.text], { type: 'application/json' }) };
        await writeRecord(record);
        R.dirty = false;
        const backupAt = record.createdAt;
        setStatus(() => (automatic ? L('Đã tự dự phòng', "Automatic backup created") : L('Đã tạo bản dự phòng', "Backup created")) + L(' đầy đủ lúc ', " in full at ") + dateText(backupAt) + '.');
        if (!automatic) toast(L('Đã tạo bản dự phòng đầy đủ trong trình duyệt.', "Full backup created in this browser."));
        return publicMeta(record);
      } catch (error) {
        setStatus(() => L('Không dự phòng được: ', "Unable to back up: ") + error.message + L(' Dùng Lưu dự án để tải tệp về máy.', " Use Save project to download the file."), true);
        throw error;
      } finally { if (playback) resume(playback); if (!automatic) busy(false); }
    });
  }
  async function restoreBackup() {
    const record = await readBackup();
    if (!record) fail(L('Chưa có bản dự phòng để khôi phục.', "No backup is available to restore."));
    const result = await loadProject({ name: record.name + '.ledstudio', size: record.size, text: async () => record.text });
    recoveryDialog.close();
    toast(L('Đã khôi phục bản dự phòng ', "Backup restored from ") + dateText(record.createdAt) + '.');
    return result;
  }
  async function downloadBackup() {
    const record = await readRecord(); if (!record) fail(L('Chưa có bản dự phòng.', "No backup is available."));
    download(safeName(record.name) + '_backup.ledstudio', record.blob);
  }
  function downloadRescue() {
    if (!R.rescueText) return false;
    downloadText(safeName(R.rescueName) + '_recovered.ledstudio', R.rescueText); return true;
  }
  function setAutoBackup(value) {
    R.auto = value === true;
    try { localStorage.setItem('ledstudio-auto-recovery', R.auto ? '1' : '0'); } catch (_) {}
    setStatus(() => R.auto ? L('Đã bật tự động lưu và khôi phục dự án đang làm dở; tối đa 25 MB tài nguyên.', "Auto-save and recovery enabled for in-progress projects; assets up to 25 MB.") : L('Tự dự phòng đang tắt. Bạn vẫn có thể Sao lưu ngay.', "Automatic backup is off. You can still use Back up now."));
    return R.auto;
  }

  const recoveryDialog = document.createElement('dialog');
  recoveryDialog.id = 'recovery142Dialog'; recoveryDialog.setAttribute('aria-labelledby', 'recovery142Title');
  recoveryDialog.innerHTML = '<div class="recovery142-head"><div><h2 id="recovery142Title">Dự phòng dự án</h2></div><button type="button" id="recovery142Close" class="icon-btn" aria-label="Đóng dự phòng"><svg class=ico aria-hidden=true><use href=#i-x></use></svg></button></div>'
    + '<p class="recovery142-intro">Bản dự phòng giữ model, media, mapping, đèn và timecode. Dữ liệu lưu trong trình duyệt này; tải tệp .ledstudio để mang sang máy khác.</p>'
    + '<section class="recovery142-card"><span>Bản dự phòng gần nhất</span><strong id="recovery142Name">Chưa có</strong><div id="recovery142Meta">—</div></section>'
    + '<label class="recovery142-auto"><input type="checkbox" id="recovery142Auto"><span>Tự dự phòng mỗi 30 giây<small>Chỉ khi show tạm dừng; tối đa 25 MB tài nguyên và 50 MB cả gói. Mặc định tắt.</small></span></label>'
    + '<p id="recovery142Status" role="status" aria-live="polite"></p>'
    + '<div class="recovery142-actions"><button type="button" id="recovery142Backup" class="btn primary">Sao lưu ngay</button><button type="button" id="recovery142Restore" class="btn">Khôi phục</button><button type="button" id="recovery142Download" class="btn">Tải bản dự phòng</button><button type="button" id="recovery142Rescue" class="btn" hidden>Tải phiên trước</button></div>'
    + '<p class="recovery142-note">Sao lưu ngay thay bản dự phòng trước. Khôi phục mở bản dự phòng làm dự án hiện tại. Trình duyệt có thể xóa dữ liệu này khi bạn dọn dữ liệu duyệt web.</p>';
  document.body.appendChild(recoveryDialog);
  const recoveryButton = document.createElement('button');
  recoveryButton.id = 'recovery142OpenBtn'; recoveryButton.type = 'button'; recoveryButton.className = 'btn small';
  recoveryButton.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-history"></use></svg><span>' + L('Dự phòng', "Recovery") + '</span>'; recoveryButton.title = L('Sao lưu và khôi phục dự án', "Back up and restore projects");
  document.querySelector('.header-actions')?.prepend(recoveryButton);
  function paintStatus() {
    const status = el('recovery142Status');
    if (!status) return;
    status.textContent = R.operation ? ({ load: L('Đang mở dự án...', "Opening project..."), save: L('Đang xuất gói...', "Exporting package..."), backup: L('Đang ghi dự phòng...', "Writing backup...") }[R.operation] || L('Đang xử lý...', "Processing...")) : (typeof R.message === 'function' ? R.message() : R.message);
    status.classList.toggle('error', R.error);
    el('recovery142Name').textContent = R.backup?.name || L('Chưa có bản dự phòng', "No backup available");
    el('recovery142Meta').textContent = R.backup ? dateText(R.backup.createdAt) + ' · ' + sizeText(R.backup.size) : L('Nhấn Sao lưu ngay để tạo một bản đầy đủ.', "Click Back up now to create a full backup.");
    el('recovery142Auto').checked = R.auto;
    el('recovery142Auto').disabled = !!R.operation;
    el('recovery142Backup').disabled = !!R.operation;
    el('recovery142Restore').disabled = !!R.operation || !R.backup;
    el('recovery142Download').disabled = !!R.operation || !R.backup;
    el('recovery142Rescue').hidden = !R.rescueText;
    recoveryButton.classList.toggle('has-backup', !!R.backup);
    recoveryButton.title = R.backup ? L('Có dự phòng: ', "Backup available: ") + R.backup.name + ' · ' + dateText(R.backup.createdAt) : L('Sao lưu và khôi phục dự án', "Back up and restore projects");
  }
  async function refreshBackup() {
    try { const record = await readRecord(); R.backup = publicMeta(record); paintStatus(); return R.backup; }
    catch (error) { setStatus(() => error.message + L(' Bạn vẫn có thể dùng Lưu dự án.', " You can still use Save project."), true); return null; }
  }
  function openRecovery() {
    paintStatus(); if (!recoveryDialog.open) recoveryDialog.showModal(); refreshBackup();
  }
  const report = action => () => Promise.resolve().then(action).catch(error => { setStatus(() => error.message, true); toast(error.message, 9000); });
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
  S.project142 = { validate, parseFile, load: loadProject, save: saveProject, backup, readBackup, clearBackup,
    restoreBackup, downloadBackup, downloadRescue, open: openRecovery, setAutoBackup, scheduleAutoBackup: scheduleAutoBackup142,
    newProject: createNewProject142, promptNewProject: promptNewProject142,
    get status() { return { operation: R.operation, auto: R.auto, backup: R.backup ? { ...R.backup } : null,
      message: typeof R.message === 'function' ? R.message() : R.message, error: R.error, lastSave: R.lastSave, hasRescue: !!R.rescueText }; } };
  S.newProject = createNewProject142;
  if (el('newProject')) el('newProject').onclick = promptNewProject142;
  if (typeof window.checkpoint === 'function') {
    const prevCheckpoint142 = window.checkpoint;
    window.checkpoint = function (...args) {
      const out = prevCheckpoint142.apply(this, args);
      scheduleAutoBackup142();
      return out;
    };
  }
  if (typeof window.importModel === 'function') {
    const prevImport142 = window.importModel;
    window.importModel = async function (...args) {
      const out = await prevImport142.apply(this, args);
      if (!R.restoringBoot) scheduleAutoBackup142(1200);
      return out;
    };
    S.importModel = window.importModel;
  }
  if (typeof window.addMediaFile === 'function') {
    const prevMedia142 = window.addMediaFile;
    window.addMediaFile = async function (...args) {
      const out = await prevMedia142.apply(this, args);
      if (!R.restoringBoot && !args[1]?.silent) scheduleAutoBackup142(1200);
      return out;
    };
    S.addMediaFile = window.addMediaFile;
  }
  const rawVer = String(window.APP_VERSION || '1.2').trim().replace(/^[vV]/, '');
  const shortVer = 'V' + rawVer;
  const semver = rawVer.split('.').length === 2 ? rawVer + '.0' : rawVer;
  S.version = semver;
  document.title = `ALPHA Creative LED Studio ${shortVer} | Sân khấu 3D · 35 FX · Đạo cụ & Biên đạo`;
  const brand = document.querySelector('.brand small');
  if (brand) brand.textContent = `${shortVer} / Sân khấu 3D · 35 FX · DMX & ILDA`;
  const footer = document.querySelector('.bottom-status > span:last-child');
  if (footer) footer.textContent = `ALPHA / LOCAL BUILD ${rawVer}`;
  const presentSpan = document.querySelector('#presentHUD span');
  if (presentSpan) presentSpan.textContent = `STAGE PREVIEW / ${shortVer}`;
  function openVersionDialog() {
    if (typeof window.dialog !== 'function') return;
    const st = S.stats?.() || {};
    const body = `<div class="snapshot-info"><div><b>${esc(shortVer)} (${esc(semver)})</b><span>${L('Phiên bản', 'VERSION')}</span></div><div><b>${L('TẠI MÁY / NGOẠI TUYẾN', 'LOCAL / OFFLINE')}</b><span>WebGL2 #version 300 es</span></div><div><b>${Number(st.screens || 0)} LED · ${Number(st.lights || 0)} DMX</b><span>${Number(st.meshes || 0)} ${L('lưới', 'meshes')}</span></div></div>` +
      `<h3>${L('Hệ thống & Tính năng tích hợp', 'Integrated Modules & Capabilities')}</h3>` +
      `<p>• <b>${L('Sân khấu 3D &amp; Mapping không gian', '3D Stage &amp; Spatial Mapping')}:</b> GLB (Meshopt), glTF, DAE, OBJ · ${L('Hệ quy chiếu mét thật, tự nhận diện LED &amp; Pixel Studio Atlas 4K', 'Metric spatial workflow, auto LED detection &amp; 4K Atlas')}</p>` +
      `<p>• <b>${L('Viền LED Matrix (35 FX)', 'LED Matrix Contour (35 FX)')}:</b> ${L('Quét viền 3D tự động, phân cấp khối, 35 hiệu ứng dải LED có chiều sâu', '3D contour scanning, hierarchy &amp; 35 depth-aware LED strip effects')}</p>` +
      `<p>• <b>DMX512, Laser ILDA &amp; Timecode:</b> ${L('12 cấu hình đèn OFL 16-bit, chuẩn Laser .ild Format 0..5, bàn điều khiển FX &amp; Show Timecode', '12 OFL 16-bit fixtures, ILDA .ild Format 0..5 laser &amp; Show Timecode')}</p>` +
      `<p>• <b>${L('Biên đạo &amp; Cơ khí sân khấu', 'Choreography &amp; Stage Mechanics')}:</b> ${L('Biên đạo nhân vật 3D IK 12 động tác, bàn nâng Stage Lift &amp; Scissor Lift, đo 3D &amp; tải gió TCVN', '12-move IK 3D choreography, Stage/Scissor Lifts, 3D measure &amp; TCVN wind load')}</p>`;
    window.dialog(L(`Thông tin phiên bản — ALPHA LED Studio ${shortVer}`, `Version Info — ALPHA LED Studio ${shortVer}`), body, [{ label: L('Đóng', 'Close'), primary: true }]);
  }
  S.openVersionDialog = openVersionDialog;
  const brandBox = document.querySelector('.brand');
  if (brandBox) {
    brandBox.style.cursor = 'pointer';
    brandBox.setAttribute('role', 'button');
    brandBox.tabIndex = 0;
    brandBox.title = `Xem thông tin phiên bản / Version info (${shortVer})`;
    brandBox.onclick = openVersionDialog;
    brandBox.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVersionDialog(); } };
  }
  function refreshLocale() {
    el('recovery142Title').textContent = L("Dự phòng dự án", "Project recovery");
    recoveryDialog.querySelector(".recovery142-intro").textContent = L("Bản dự phòng giữ model, media, mapping, đèn và timecode. Dữ liệu lưu trong trình duyệt này; tải tệp .ledstudio để mang sang máy khác.", "Backups include models, media, mapping, lights and timecode. Data stays in this browser; download a .ledstudio file to transfer it to another computer.");
    recoveryDialog.querySelector(".recovery142-card > span").textContent = L("Bản dự phòng gần nhất", "Latest backup");
    recoveryDialog.querySelector(".recovery142-auto small").textContent = L("Chỉ khi show tạm dừng; tối đa 25 MB tài nguyên và 50 MB cả gói. Mặc định tắt.", "Only while the show is paused; up to 25 MB of assets and 50 MB per package. Off by default.");
    el('recovery142Backup').textContent = L("Sao lưu ngay", "Back up now");
    el('recovery142Restore').textContent = L("Khôi phục", "Restore");
    el('recovery142Download').textContent = L("Tải bản dự phòng", "Download backup");
    el('recovery142Rescue').textContent = L("Tải phiên trước", "Download previous session");
    recoveryDialog.querySelector(".recovery142-note").textContent = L("Sao lưu ngay thay bản dự phòng trước. Khôi phục mở bản dự phòng làm dự án hiện tại. Trình duyệt có thể xóa dữ liệu này khi bạn dọn dữ liệu duyệt web.", "Back up now replaces the previous backup. Restore opens the backup as the current project. Clearing browsing data may remove this backup.");
    el('recovery142Close').setAttribute('aria-label', L('Đóng dự phòng', 'Close recovery'));
    recoveryDialog.querySelector('.recovery142-auto > span').firstChild.textContent = L('Tự dự phòng mỗi 30 giây', 'Back up automatically every 30 seconds');
    const sp = recoveryButton.querySelector('span');
    if (sp) sp.textContent = L('Dự phòng', 'Recovery');
    else recoveryButton.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-history"></use></svg><span>' + L('Dự phòng', 'Recovery') + '</span>';
    document.title = L(`ALPHA Creative LED Studio ${shortVer} | Sân khấu 3D · 35 FX · Đạo cụ & Biên đạo`, `ALPHA Creative LED Studio ${shortVer} | 3D Stage · 35 FX · Props & Choreography`);
    if (brand) brand.textContent = L(`${shortVer} / Sân khấu 3D · 35 FX · DMX & ILDA`, `${shortVer} / 3D Stage · 35 FX · DMX & ILDA`);
    if (presentSpan) presentSpan.textContent = L(`XEM SÂN KHẤU / ${shortVer}`, `STAGE PREVIEW / ${shortVer}`);
    if (brandBox) brandBox.title = L(`Xem thông tin phiên bản (${shortVer})`, `Version info (${shortVer})`);
    const newBtn = el('newProject');
    if (newBtn) {
      const newSp = newBtn.querySelector('span');
      if (newSp) newSp.textContent = L('Dự án mới', 'New project');
      newBtn.title = L('Dự án mới', 'New project');
      newBtn.setAttribute('aria-label', newBtn.title);
    }
    const loadBtn = el('loadProject');
    if (loadBtn) {
      loadBtn.title = L('Mở dự án (.ledstudio)', 'Open project (.ledstudio)');
      loadBtn.setAttribute('aria-label', loadBtn.title);
    }
    const saveBtn = el('saveProject');
    if (saveBtn) {
      saveBtn.title = L('Lưu dự án · Ctrl+S', 'Save project · Ctrl+S');
      saveBtn.setAttribute('aria-label', saveBtn.title);
    }
    paintStatus();
  }
  window.addEventListener('ledstudio:locale', refreshLocale);
  refreshLocale();
  setInterval(() => { if (R.auto && R.dirty) backup({ automatic: true }).catch(() => {}); }, 30000);
  async function autoRestoreOnBoot142() {
    try {
      const isShare = typeof location !== 'undefined' && new URLSearchParams(location.search || '').get('share');
      if (isShare || S.cloud16?.isClientReviewMode?.()) { await refreshBackup(); paintStatus(); return; }
      const splashSub = typeof document !== 'undefined' ? document.querySelector?.('#bootSplash small') : null;
      if (splashSub) splashSub.textContent = L('Đang kiểm tra dự án đang làm dở…', 'Checking in-progress project…');
      const record = await readBackup();
      R.backup = publicMeta(record);
      paintStatus();
      if (R.auto && record && record.text && !R.operation && !state.importing && !state.loadingProject && !R.dirty) {
        R.restoringBoot = true;
        if (splashSub) splashSub.textContent = L('Đang mở lại dự án: ', 'Restoring project: ') + (record.name || 'Stage') + '…';
        try {
          await loadProject({ name: (record.name || 'Stage') + '.ledstudio', size: record.size, text: async () => record.text });
          toast(L('Đã tự động mở lại dự án đang làm dở: ', 'Automatically restored in-progress project: ') + (record.name || state.projectName));
        } finally {
          R.restoringBoot = false;
          R.dirty = false;
          clearTimeout(autoTimer);
        }
      }
    } catch (_) {
      paintStatus();
    }
  }
  const bootRestorePromise142 = autoRestoreOnBoot142();
  S.bootRestorePromise142 = bootRestorePromise142;
  if (typeof window !== 'undefined') window.__bootRestorePromise142 = bootRestorePromise142;
})();
