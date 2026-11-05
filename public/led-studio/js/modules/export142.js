/* Creative LED Studio V14.3 — complete stage capture.
   Compose the WebGL stage with both light-effect canvases. Editor gizmos,
   mounting guides and labels are deliberately outside this export surface. */
(function () {
  'use strict';
  const mxTr=(vi,en)=>typeof window!=='undefined'&&typeof window.tr==='function'?window.tr(vi,en):vi;
  const S = window.STUDIO;
  if (!S?.engine) return;
  const E = S.engine;
  const $ = id => document.getElementById(id);
  let recording = null;

  function paintEffects(now = performance.now(), clean = true) {
    S.laserShow?.renderFrame?.(now, { clean });
    S.fx141?.renderFrame?.(now, { clean });
  }

  function compose(canvas, { letterbox = false } = {}) {
    const context = canvas.getContext('2d', { alpha: false });
    const width = canvas.width, height = canvas.height;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#080b13';
    context.fillRect(0, 0, width, height);
    let x = 0, y = 0, w = width, h = height;
    if (letterbox) {
      const scale = Math.min(width / E.canvas.width, height / E.canvas.height);
      w = E.canvas.width * scale; h = E.canvas.height * scale;
      x = (width - w) / 2; y = (height - h) / 2;
    }
    context.drawImage(E.canvas, x, y, w, h);
    // Keep the same order as the viewport: older laser, then multi-fixture FX.
    for (const id of ['laser135Overlay', 'fx141Overlay']) {
      const layer = $(id);
      if (layer?.width && layer?.height && layer.clientWidth && layer.clientHeight) {
        context.drawImage(layer, x, y, w, h);
      }
    }
    return canvas;
  }

  function captureFrame({ width = 1920, height = 1080 } = {}) {
    if (state.recording) throw Error(mxTr("Dừng ghi video trước khi chụp khung hình.","Stop recording before capturing a frame."));
    width = Math.round(Number(width)); height = Math.round(Number(height));
    if (!Number.isFinite(width + height) || width < 16 || height < 16 ||
        width > 4096 || height > 4096 || width * height > 16777216) {
      throw Error(mxTr("Kích thước ảnh cần nằm trong 16–4096 px và tối đa 8 megapixel.","Image dimensions must be 16–4096 px and at most 8 megapixels."));
    }
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const before = { view: E.view, guides: E.showGuides, grid: E.settings.grid, fit: E._fitOnResize };
    try {
      E.view = 'stage'; E.showGuides = false; E.settings.grid = false; E._fitOnResize = false;
      E.render(state.time, { width, height });
      paintEffects();
      compose(canvas);
      if (typeof S !== 'undefined' && S.lumi18?.shouldWatermarkExport?.()) {
        drawLumiWatermark(canvas);
      }
    } finally {
      E.view = before.view; E.showGuides = before.guides; E.settings.grid = before.grid;
      E.render(state.time);
      E._fitOnResize = before.fit;
      paintEffects(performance.now(), false);
      renderOverlays();
    }
    return canvas;
  }

  exportShot = async function () {
    if (state.recording) { toast(mxTr("Dừng ghi video trước khi xuất ảnh.","Stop recording before exporting an image.")); return; }
    try {
      const frame = captureFrame();
      const blob = await new Promise(resolve => frame.toBlob(resolve, 'image/png'));
      if (!blob) throw Error(mxTr("Trình duyệt không tạo được ảnh PNG.","Browser could not create the PNG image."));
      download('ALPHA_Stage_V143_1920x1080.png', blob);
      toast(mxTr("Đã xuất PNG 1920×1080 gồm LED, LED Matrix viền, PAR, LINE và Laser đang hiển thị.","Exported 1920×1080 PNG with visible LEDs, Matrix outlines, PAR, LINE and Laser."));
      return blob;
    } catch (error) { toast(mxTr("Không xuất được ảnh: ","Image export failed: ") + error.message, 7000); return null; }
  };

  // A single stage render feeds the recording. No second animation loop and no
  // duplicate WebGL draw are needed for every recorded frame.
  const render = E.render.bind(E);
  E.render = function (time, options = {}) {
    if (recording && state.recording && E.view !== 'stage') {
      E.view = 'stage';
      document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === 'stage'));
    }
    const result = render(time, options);
    if (recording && state.recording && E.view === 'stage' && !options.width && !options.height) {
      const now = performance.now();
      if (now - recording.lastFrame >= 1000 / recording.fps - 1) {
        recording.lastFrame = now;
        try {
          paintEffects(now);
          compose(recording.canvas, { letterbox: true });
          recording.canvas.getContext('2d').getImageData(0, 0, 1, 1);
          recording.track?.requestFrame?.();
          recording.stream?.requestFrame?.();
          recording.frames++;
        } catch (error) {
          recording.error = error.message;
          if (state.recorder?.state !== 'inactive') state.recorder?.stop();
        }
      }
    }
    return result;
  };

  beginLiveRecording = function ({ duration = 10, fps = 30, withAudio = true } = {}) {
    if (state.recording) throw Error(mxTr("Đang ghi video. Hãy dừng bản ghi hiện tại trước.","Recording in progress. Stop the current recording first."));
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      throw Error(mxTr("Trình duyệt chưa hỗ trợ ghi canvas. Hãy dùng Chrome, Edge hoặc Firefox.","Browser does not support canvas recording. Use Chrome, Edge or Firefox."));
    }
    duration = clamp(Number(duration) || 10, 1, 120);
    fps = clamp(Math.round(Number(fps) || 30), 10, 60);
    const candidates = withAudio
      ? ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm']
      : ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm'];
    const mime = candidates.find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) throw Error(mxTr("Trình duyệt không có bộ mã hóa WebM phù hợp.","Browser has no compatible WebM encoder."));
    const canvas = document.createElement('canvas');
    const aspect = Math.max(.2, E.canvas.clientWidth / Math.max(1, E.canvas.clientHeight));
    canvas.width = Math.max(320, Math.min(1920, Math.floor(E.canvas.width / 2) * 2));
    canvas.height = Math.max(180, Math.floor(canvas.width / aspect / 2) * 2);
    if (canvas.height > 1080) {
      canvas.height = 1080;
      canvas.width = Math.max(2, Math.floor(1080 * aspect / 2) * 2);
    }
    // A CPU-backed output surface avoids unflushed GPU canvas frames reaching
    // captureStream on software/remote renderers. The stage itself stays WebGL.
    canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    const previous = { guides: E.showGuides, grid: E.settings.grid, view: E.view };
    const chunks = [];
    let stream, recorder;
    try {
      E.view = 'stage'; E.showGuides = false; E.settings.grid = false;
      E.render(state.time); paintEffects(); compose(canvas, { letterbox: true });
      // Explicitly publish each composed frame. Some Chromium/offscreen canvas
      // paths do not produce any encoded frames from captureStream(fps) alone.
      stream = canvas.captureStream(0);
      if (typeof stream.getVideoTracks()[0]?.requestFrame !== 'function' && typeof stream.requestFrame !== 'function') {
        for (const track of stream.getTracks()) track.stop();
        stream = canvas.captureStream(fps);
      }
      if (withAudio) {
        ensureAudioContext();
        for (const track of live.recordDest.stream.getAudioTracks()) stream.addTrack(track.clone());
      }
      recorder = new MediaRecorder(stream, {
        mimeType: mime, videoBitsPerSecond: 10000000, audioBitsPerSecond: 160000
      });
      const session = { canvas, stream, track: stream.getVideoTracks()[0], fps, frames: 0, lastFrame: -Infinity, started: performance.now(), error: null };
      recording = session;
      state.recorder = recorder; state.recording = true; state.recordAudio = withAudio;
      recorder.onstart = () => {
        if (recorder.state !== 'recording' || !state.recording || recording !== session) return;
        clearTimeout(state.recordTimer);
        session.started = performance.now();
        // Encoder startup can take longer than a very short requested clip.
        // Count its duration from actual recording start, not from allocation.
        canvas.getContext('2d').drawImage(canvas, 0, 0);
        canvas.getContext('2d').getImageData(0, 0, 1, 1);
        session.track?.requestFrame?.();
        session.stream?.requestFrame?.();
        state.recordTimer = setTimeout(() => {
          if (recorder.state !== 'inactive') recorder.stop();
        }, duration * 1000);
      };
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = event => {
        session.error = event.error?.message || mxTr("Lỗi bộ mã hóa video","Video encoder error");
        if (recorder.state !== 'inactive') recorder.stop();
      };
      recorder.onstop = () => {
        clearTimeout(state.recordTimer);
        for (const track of stream.getTracks()) track.stop();
        recording = null;
        state.recording = false; state.recordAudio = false; state.recorder = null;
        E.view = previous.view; E.showGuides = previous.guides; E.settings.grid = previous.grid;
        const blob = new Blob(chunks, { type: mime });
        if (!blob.size && !session.error) session.error = mxTr("Trình duyệt không tạo được khung hình video. Giữ tab hiển thị rồi thử lại.","Browser could not create video frames. Keep the tab visible and try again.");
        window.__lastRecording = {
          bytes: blob.size, type: mime, requestedFPS: fps, audio: withAudio,
          width: canvas.width, height: canvas.height, compositedFX: true,
          renderedFrames: session.frames, elapsedSeconds: (performance.now() - session.started) / 1000,
          error: session.error
        };
        if (blob.size) {
          download('ALPHA_Stage_V143_FX' + (withAudio ? '_Audio' : '') + '.webm', blob);
        }
        E.render(state.time); paintEffects(performance.now(), false); renderOverlays(); renderUI();
        toast(session.error ? mxTr("Bản ghi dừng sớm: ","Recording stopped early: ") + session.error : mxTr("Đã ghi WebM gồm sân khấu và hiệu ứng LED Matrix viền / PAR / LINE / Laser.","Recorded WebM with stage, Matrix outlines / PAR / LINE / Laser effects."), 6500);
      };
      recorder.start(250);
      state.recordTimer = setTimeout(() => {
        session.error = mxTr("Bộ ghi video khởi động quá lâu. Giảm chất lượng preview rồi thử lại.","Video recorder startup timed out. Reduce preview quality and try again.");
        if (recorder.state !== 'inactive') recorder.stop();
      }, 15000);
      paintEffects(); compose(canvas, { letterbox: true }); canvas.getContext('2d').getImageData(0, 0, 1, 1); session.track?.requestFrame?.(); session.frames++;
      setPlaying(true); renderUI();
      return recorder;
    } catch (error) {
      clearTimeout(state.recordTimer);
      if (recorder) {
        recorder.onstop = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }
      for (const track of stream?.getTracks() || []) track.stop();
      recording = null; state.recording = false; state.recordAudio = false; state.recorder = null;
      E.view = previous.view; E.showGuides = previous.guides; E.settings.grid = previous.grid;
      throw error;
    }
  };

  recordPreview = function () {
    if (state.recording) { state.recorder?.stop(); return; }
    dialog(mxTr("Ghi sân khấu + hiệu ứng","Record stage + effects"),
      ("<p>"+mxTr("Ghi phối cảnh gồm LED, LED Matrix viền, PAR, LINE, Laser và bus âm thanh tùy chọn. Video chạy theo thời gian thực; số khung hình phụ thuộc hiệu năng máy.","Record the stage view with LEDs, Matrix outlines, PAR, LINE, Laser and optional audio bus. Recording runs in real time; frame rate depends on machine performance.")+"</p>") +
      ("<div class=\"pro-settings\"><label>"+mxTr("Thời lượng / giây","Duration / seconds")+"<input id=\"recordSeconds\" type=\"number\" min=\"1\" max=\"120\" value=\"10\"></label>") +
      ("<label>"+mxTr("FPS mục tiêu","Target FPS")+"<select id=\"recordFPS\"><option>30</option><option>50</option><option>60</option></select></label>") +
      ("<label class=\"check-row\"><input type=\"checkbox\" id=\"recordWithAudio\" checked>"+mxTr("Thu bus âm thanh","Record audio bus")+"</label></div>") +
      ("<p class=\"hint-text\">"+mxTr("Giữ tab hiển thị khi ghi. Góc xem giữ ở chế độ sân khấu; bạn vẫn có thể di chuyển camera. Khi dừng, ứng dụng trở lại chế độ xem ban đầu.","Keep the tab visible during recording. Stage view remains active and the camera can move. The original view is restored when recording stops.")+"</p>"),
      [{ label: mxTr("Hủy","Cancel") }, { label: mxTr("Bắt đầu ghi","Start recording"), primary: true, action: async () => {
        try {
          const withAudio = $('recordWithAudio').checked;
          if (withAudio && !await enableAudio(true)) return;
          beginLiveRecording({ duration: +$('recordSeconds').value, fps: +$('recordFPS').value, withAudio });
        } catch (error) { toast(error.message, 8000); }
      } }]);
  };

  for (const id of ['screenshotBtn', 'exportShot']) if ($(id)) $(id).onclick = () => exportShot();
  if ($('recordBtn')) $('recordBtn').onclick = () => recordPreview();
  const label = $('exportShot')?.querySelector('span');
  if (label) label.textContent = mxTr("1920×1080 · gồm LED Matrix / PAR / LINE / Laser FX","1920×1080 · includes LED Matrix / PAR / LINE / Laser FX");
  window.addEventListener?.('ledstudio:locale',()=>{
    if(label)label.textContent=mxTr('1920×1080 · gồm LED Matrix / PAR / LINE / Laser FX','1920×1080 · includes LED Matrix / PAR / LINE / Laser FX');
  });
  function drawLumiWatermark(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    const w = canvas.width, h = canvas.height;
    ctx.save();
    const fontSize = Math.max(14, Math.round(h * 0.022));
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
    const label = 'LumiStage — Bản xem thử · grouplife.vn';
    const padX = Math.round(fontSize * 0.8), padY = Math.round(fontSize * 0.5);
    const textW = ctx.measureText(label).width;
    const boxW = textW + padX * 2, boxH = fontSize + padY * 2;
    const bx = w - boxW - Math.round(w * 0.02), by = h - boxH - Math.round(h * 0.025);
    ctx.fillStyle = 'rgba(8, 11, 19, 0.72)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = Math.max(1, Math.round(h / 720));
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.92)';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + padX, by + boxH / 2);
    ctx.restore();
    return canvas;
  }

  async function exportShot4K() {
    if (state.recording) { toast(mxTr("Dừng ghi video trước khi xuất ảnh 4K.","Stop recording before exporting a 4K image.")); return null; }
    try {
      if (S.lumi18?.ensureExportAllowed) {
        const ok = await S.lumi18.ensureExportAllowed('4k_png');
        if (!ok) return null;
      }
      const frame = captureFrame({ width: 3840, height: 2160 });
      const blob = await new Promise(resolve => frame.toBlob(resolve, 'image/png'));
      if (!blob) throw Error(mxTr("Trình duyệt không tạo được ảnh PNG 4K.","Browser could not create the 4K PNG image."));
      download('LumiStage_4K_3840x2160.png', blob);
      toast(mxTr("Đã xuất phối cảnh 3D 4K UHD (3840×2160 PNG).","Exported 4K UHD 3D view (3840×2160 PNG)."));
      return blob;
    } catch (error) {
      toast(mxTr("Không xuất được ảnh 4K: ","4K image export failed: ") + error.message, 7000);
      return null;
    }
  }

  S.exportShot = exportShot;
  S.exportShot4K = exportShot4K;
  S.drawLumiWatermark = drawLumiWatermark;
  S.recordPreview = recordPreview;
  S.beginLiveRecording = beginLiveRecording;
  S.capture142 = { captureFrame, compose, paintEffects, beginRecording: beginLiveRecording,
    get recording() { return recording ? { frames: recording.frames, fps: recording.fps, width: recording.canvas.width, height: recording.canvas.height, error: recording.error } : null; } };
})();
