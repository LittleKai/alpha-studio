/* ============================================================================
   V16.0 ALPHA STUDIO CLOUD BRIDGE, SSO & READ-ONLY CLIENT REVIEW MODE
   ============================================================================ */
(function () {
  'use strict';

  const STUDIO = (window.STUDIO = window.STUDIO || {});
  const esc16 = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));

  function normalizeApiBaseUrl(raw) {
    if (!raw || typeof raw !== 'string') return '/api/led-studio';
    const trimmed = raw.trim().replace(/\/+$/, '');
    if (!trimmed) return '/api/led-studio';
    if (trimmed.startsWith('/')) {
      return trimmed.endsWith('/led-studio') ? trimmed : `${trimmed}/led-studio`;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '/api/led-studio';
      }
      const cleanPath = parsed.pathname.replace(/\/+$/, '');
      if (!cleanPath) return `${parsed.origin}/api/led-studio`;
      if (cleanPath.endsWith('/led-studio')) return `${parsed.origin}${cleanPath}`;
      return `${parsed.origin}${cleanPath}/led-studio`;
    } catch {
      return '/api/led-studio';
    }
  }

  const initialQueryParams = new URLSearchParams(window.location?.search || '');
  function detectInitialLocale() {
    const qLang = initialQueryParams.get('lang') || initialQueryParams.get('locale');
    if (qLang === 'en' || qLang === 'vi') return qLang;
    try {
      const saved = window.localStorage?.getItem('language');
      if (saved === 'en' || saved === 'vi') return saved;
    } catch {
      // ignore storage errors
    }
    return 'vi';
  }

  const state = {
    embedded: window.parent !== window,
    user: null,
    token: null,
    locale: detectInitialLocale(),
    theme: 'dark',
    apiBaseUrl: normalizeApiBaseUrl(
      initialQueryParams.get('apiBase') || window.__ALPHA_STUDIO_API_URL__ || '/api/led-studio'
    ),
    clientReviewMode: false,
    shareToken: null,
    lastSavedProjectId: null,
    currentProjectTitle: null,
    cachedPresets: [],
    reviewGuardsBound: false,
    reviewSharedTitle: null,
    layerVisibility: { stage: true, led: true, lights: true, laser: true, cast: true }
  };

  function t16(viText, enText) {
    return state.locale === 'en' ? enText : viText;
  }

  const DOM_TRANSLATIONS = [
    ['#helpBtn', 'Hướng dẫn', 'Guide'],
    ['#loadProject', 'Mở dự án', 'Open Project'],
    ['#saveProject', 'Lưu dự án', 'Save Project'],
    ['#presentBtn', '▷ Trình diễn', '▷ Present'],
    ['#recovery142OpenBtn', 'Dự phòng', 'Recovery'],
    ['#cloud16SaveBtn', '☁ Lưu Cloud', '☁ Save Cloud'],
    ['#cloud16OpenBtn', '📂 Mở Cloud', '📂 Open Cloud'],
    ['#cloud16PresetsBtn', '📦 Kho Preset', '📦 Presets'],
    ['#cloud16ShareBtn', '🔗 Link duyệt 3D', '🔗 3D Review Link'],
    ['.workflow [data-step="stage"] b', 'SÂN KHẤU 3D', '3D STAGE'],
    ['.workflow [data-step="mapping"] b', 'LED & VIDEO', 'LED & VIDEO'],
    ['.workflow [data-step="lighting"] b', 'ÁNH SÁNG & SHOW', 'LIGHTING & SHOW'],
    ['#ledManagerBtn', 'Quản lý LED', 'LED Manager'],
    ['#exportBtn', 'Xuất ↗', 'Export ↗'],
    ['#importModel strong', 'Nhập sân khấu 3D', 'Import 3D Stage'],
    ['#importModel small', 'Kéo file vào cửa sổ để bắt đầu', 'Drag files into window to start'],
    ['#demoBtn', 'Sân khấu mẫu', 'Demo Stage'],
    ['#importFolder', 'Thư mục', 'Folder'],
    ['#skpHelp', 'Từ SketchUp ↗', 'From SketchUp ↗'],
    ['#autoDetect', 'Nhận diện LED', 'Auto-detect LED'],
    ['#drawQuad', '+ 4 góc', '+ 4-Point Quad'],
    ['#repairMapping', 'Sửa mapping 3D', 'Repair 3D Mapping'],
    ['.media-section .section-heading h3', 'Thư viện video', 'Video Library'],
    ['#addMedia', '+ Thêm', '+ Add'],
    ['#sampleVideo', '▶ Thử với video mapped mẫu', '▶ Try Demo Mapped Video'],
    ['.media-section .micro-note', 'File ở trên máy bạn. Không upload lên server.', 'Files stay on your device. No server upload.'],
    ['.view-tabs [data-view="stage"]', '◇ Sân khấu 3D', '◇ 3D Stage'],
    ['.view-tabs [data-view="map"]', '▦ Pixel Map', '▦ Pixel Map'],
    ['.view-tabs [data-view="solo"]', '□ LED đang chọn', '□ Selected LED'],
    ['#overviewBtn', '⌖ Toàn cảnh', '⌖ Overview'],
    ['#lockCameraBtn', 'Khóa góc', 'Lock Cam'],
    ['#focusBtn', 'Mở rộng', 'Expand'],
    ['#assetDrawer', 'Dữ liệu', 'Assets'],
    ['#inspectorDrawer', 'Thông số', 'Inspector'],
    ['#v125LiftNav', '╳ Bàn nâng', '╳ Stage Lift'],
    ['#v124LiftBtn', '╳ Bàn nâng chữ X', '╳ Scissor Lift'],
    ['#dirFrameLED', '▣ Căn LED', '▣ Frame LED'],
    ['#dirToolbar [data-tool-mode="navigate"]', 'Xem', 'View'],
    ['#dirToolbar [data-tool-mode="move"]', 'Kéo', 'Move'],
    ['#dirToolbar [data-tool-mode="rotate"]', 'Xoay', 'Rotate'],
    ['#dirToolbar [data-tool-mode="scale"]', 'Scale', 'Scale'],
    ['#dirCameraPanel', 'Camera', 'Camera'],
    ['#dirLightsPanel', 'Đèn', 'Lights'],
    ['#dirActsPanel', 'Tiết mục 3D', '3D Acts'],
    ['#pro127bar [data-pro127="fixture"]', '+ Đèn / Nhận diện', '+ Lights / Detect'],
    ['#pro127bar [data-pro127="fx"]', 'Timecode đèn · 24 FX', 'Light Timecode · 24 FX'],
    ['#pro127bar [data-pro127="vj"]', 'VJ FX Live', 'VJ FX Live'],
    ['#pro127bar [data-pro127="bright"]', '☀ Tăng sáng', '☀ Boost Brightness'],
    ['#l132Launch', '● Ghi thao tác đèn', '● Record Light Take'],
    ['#matrix143OpenBtn', 'LED MATRIX VIỀN', 'LED MATRIX CONTOUR'],
    ['#matrix148DrawBtn', '✎ VẼ ĐƯỜNG VIỀN', '✎ DRAW LED PATH'],
    ['#interactionHint', 'Kéo: xoay   /   Chuột phải: di chuyển   /   Cuộn: zoom', 'Drag: orbit   /   Right-click: pan   /   Scroll: zoom'],
    ['#screenshotBtn', 'Chụp phối cảnh ↗', 'Capture Shot ↗'],
    ['#exitPresent', 'Về chỉnh sửa', 'Exit Present'],
    ['#showExit', 'Về chỉnh sửa', 'Exit Present'],
    ['#showPlay', 'Phát', 'Play'],
    ['#showOverview', 'Toàn cảnh', 'Overview'],
    ['#showLock', 'Khóa góc', 'Lock Cam'],
    ['#dropOverlay h2', 'Thả model hoặc video vào đây', 'Drop 3D model or video here'],
    ['#recovery142Title', 'Dự phòng dự án', 'Project Recovery'],
    ['#recovery142Backup', 'Sao lưu ngay', 'Backup Now'],
    ['#recovery142Restore', 'Khôi phục', 'Restore'],
    ['#recovery142Download', 'Tải bản dự phòng', 'Download Backup'],
    ['#recovery142Rescue', 'Tải phiên trước', 'Download Previous'],
    ['#clientReviewBar16 .review-badge', 'CHẾ ĐỘ DUYỆT 3D (CHỈ ĐỌC)', '3D CLIENT REVIEW (READ-ONLY)'],
    ['#review16PlayBtn', '▶ Phát / Tạm dừng', '▶ Play / Pause'],
    ['#clientReviewBar16 [data-review-cam="front"]', 'Chính diện', 'Front'],
    ['#clientReviewBar16 [data-review-cam="iso"]', 'Toàn cảnh', 'Overview'],
    ['#clientReviewBar16 [data-review-cam="left"]', 'Cánh trái', 'Left Wing'],
    ['#clientReviewBar16 [data-review-cam="right"]', 'Cánh phải', 'Right Wing'],
    ['#clientReviewBar16 [data-review-layer="stage"]', 'Sân khấu', 'Stage'],
    ['#clientReviewBar16 [data-review-layer="led"]', 'LED', 'LED'],
    ['#clientReviewBar16 [data-review-layer="lights"]', 'Ánh sáng', 'Lighting'],
    ['#clientReviewBar16 [data-review-layer="laser"]', 'Laser', 'Laser'],
    ['#clientReviewBar16 [data-review-layer="cast"]', 'Nhân vật', 'Performers']
  ];

  function applyLocaleToDOM() {
    const isEn = state.locale === 'en';
    if (document.documentElement) {
      document.documentElement.lang = isEn ? 'en' : 'vi';
      if (document.documentElement.dataset) {
        document.documentElement.dataset.locale = isEn ? 'en' : 'vi';
      }
    }
    for (const [sel, viText, enText] of DOM_TRANSLATIONS) {
      const el = document.querySelector?.(sel);
      if (el) el.textContent = isEn ? enText : viText;
    }
    const langBtn = document.getElementById('langToggleBtn16');
    if (langBtn) {
      langBtn.textContent = isEn ? 'EN' : 'VI';
      langBtn.title = isEn ? 'Switch language (EN / VI)' : 'Chuyển ngôn ngữ (VI / EN)';
    }
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.title = isEn ? 'Switch Light / Dark theme' : 'Chuyển giao diện Sáng / Tối';
    }
    const searchInput = document.getElementById('objectSearch');
    if (searchInput) {
      searchInput.placeholder = isEn ? 'Search objects / LED...' : 'Tìm object / LED...';
    }
    const leftTitle = document.getElementById('leftTitle');
    if (leftTitle) {
      const txt = (leftTitle.textContent || '').trim();
      if (txt === 'Cấu trúc sân khấu' || txt === 'Stage Structure') {
        leftTitle.textContent = isEn ? 'Stage Structure' : 'Cấu trúc sân khấu';
      } else if (txt === 'Danh sách màn LED' || txt === 'LED Surfaces') {
        leftTitle.textContent = isEn ? 'LED Surfaces' : 'Danh sách màn LED';
      }
    }
    const gridBtn = document.getElementById('show137EditorButton');
    if (gridBtn) {
      const clean = gridBtn.classList?.contains?.('active');
      gridBtn.textContent = clean
        ? (isEn ? '◉ Show Grid' : '◉ Hiện lưới')
        : (isEn ? '◌ Hide Grid' : '◌ Ẩn lưới');
    }
    const exportItems = [
      ['#exportShot', 'Phối cảnh 3D', '3D Perspective Shot', 'PNG / 1920 x 1080', 'PNG / 1920 x 1080'],
      ['#exportMapPNG', 'Pixel Map có nhãn', 'Labeled Pixel Map', 'PNG / đúng kích thước', 'PNG / exact size'],
      ['#exportJSON', 'Cấu hình mapping', 'Mapping Config', 'JSON', 'JSON'],
      ['#exportCSV', 'Bảng thông số LED', 'LED Spec Sheet', 'CSV', 'CSV'],
      ['#recordBtn', 'Ghi video preview', 'Record Video Preview', 'WebM / realtime + audio', 'WebM / realtime + audio']
    ];
    for (const [sel, viMain, enMain, viSub, enSub] of exportItems) {
      const btn = document.querySelector?.(sel);
      if (btn) {
        btn.innerHTML = `${isEn ? enMain : viMain} <span>${isEn ? enSub : viSub}</span>`;
      }
    }
    const pq = document.getElementById('previewQuality');
    if (pq && pq.options) {
      const optMap = {
        '1': ['Chuẩn', 'Standard'],
        '0.65': ['Nhẹ', 'Light'],
        '0.45': ['Siêu nhẹ', 'Ultra Light'],
        '1.25': ['Nét', 'High']
      };
      for (const opt of pq.options) {
        if (optMap[opt.value]) {
          opt.textContent = isEn ? optMap[opt.value][1] : optMap[opt.value][0];
        }
      }
    }
    if (state.clientReviewMode && state.reviewSharedTitle) {
      setReviewStatus(
        isEn ? `Viewing: ${state.reviewSharedTitle}` : `Đang xem: ${state.reviewSharedTitle}`
      );
    }
  }

  function applyLocale(locale) {
    const next = locale === 'en' ? 'en' : 'vi';
    state.locale = next;
    try {
      window.localStorage?.setItem('language', next);
    } catch {
      // ignore storage errors
    }
    applyLocaleToDOM();
    return next;
  }

  function apiUrl(subpath = '') {
    const base = (state.apiBaseUrl || '/api/led-studio').replace(/\/+$/, '');
    const cleanSub = String(subpath || '').replace(/^\/+/, '');
    return cleanSub ? `${base}/${cleanSub}` : base;
  }

  function authHeaders(extra = {}) {
    return {
      ...extra,
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    };
  }

  function isSafeDownloadUrl(raw) {
    if (!raw || typeof raw !== 'string') return false;
    const s = raw.trim();
    if (!s) return false;
    if (s.startsWith('/') && !s.startsWith('//')) return true;
    try {
      const parsed = new URL(s);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    state.theme = next;
    document.documentElement.dataset.theme = next;
  }

  const AUTHORING_SELECTORS = [
    '#saveProject',
    '#loadProjectBtn',
    '#loadProject',
    '#importTopBtn',
    '#importModel',
    '#importFolder',
    '#openDemoBtn',
    '#demoBtn',
    '#undoBtn',
    '#redoBtn',
    '#presentBtn',
    '#exportBtn',
    '#addMedia',
    '#pixelStudioBtn',
    '#atlasBtn',
    '#ledManagerBtn',
    '#vjToggle',
    '#recovery142OpenBtn',
    '#cloud16SaveBtn',
    '#cloud16OpenBtn',
    '#cloud16PresetsBtn',
    '#cloud16ShareBtn',
    '#durationInput',
    '#duration',
    '#loopBtn',
    '#restartBtn',
    '.left-panel',
    '.right-panel',
    '#pro127bar',
    '.dir-toolbar',
    '.workflow',
    '.navigation-strip',
    '.selection-strip',
    '#pro127dock',
    '#m131Panel',
    '#l132Panel',
    '#tc134Panel',
    '#tc134Settings',
    '#laser135Panel',
    '#mount136Panel',
    '#fx141Panel',
    '#matrix143Panel',
    '#recovery142Dialog',
    '#v130Panel',
    '#liveDock',
    '#sequenceDock'
  ];

  function bindClientReviewGuards() {
    if (state.reviewGuardsBound) return;
    state.reviewGuardsBound = true;

    const blockEvent = (e) => {
      if (!state.clientReviewMode) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    window.addEventListener('drop', blockEvent, true);
    window.addEventListener('dragover', blockEvent, true);

    window.addEventListener('keydown', (e) => {
      if (!state.clientReviewMode) return;
      const key = String(e.key || '').toLowerCase();
      const allowedReviewKeys = new Set([
        ' ',
        'spacebar',
        'f',
        'arrowleft',
        'arrowright',
        'arrowup',
        'arrowdown',
        'home',
        'end',
        'tab'
      ]);
      if (e.ctrlKey || e.metaKey || e.altKey || !allowedReviewKeys.has(key)) {
        if (window.STUDIO?.director) window.STUDIO.director.mode = 'navigate';
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);

    window.addEventListener('pointerdown', () => {
      if (!state.clientReviewMode) return;
      if (window.STUDIO?.director && window.STUDIO.director.mode !== 'navigate') {
        window.STUDIO.director.mode = 'navigate';
      }
    }, true);

    document.addEventListener('click', (e) => {
      if (!state.clientReviewMode) return;
      const target = e.target;
      if (!target || typeof target.closest !== 'function') return;
      if (target.closest('#clientReviewBar16') || target.closest('#playBtn') || target.closest('#seek') || target.closest('#themeToggleBtn') || target.closest('#langToggleBtn16')) {
        return;
      }
      if (target.closest(AUTHORING_SELECTORS.join(','))) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
  }

  function applyReviewLayerVisibility(layer, on) {
    const eng = window.STUDIO?.engine || window.engine;
    if (layer === 'stage' && eng) {
      const stageMeshes = [
        ...(Array.isArray(eng.stage) ? eng.stage : []),
        ...(Array.isArray(eng.meshes) ? eng.meshes : [])
      ];
      for (const m of stageMeshes) {
        if (!m || m.isLedSurface) continue;
        if (!on) {
          if (!('_reviewSavedHidden' in m)) m._reviewSavedHidden = Boolean(m.hidden);
          m.hidden = true;
        } else {
          m.hidden = '_reviewSavedHidden' in m ? Boolean(m._reviewSavedHidden) : false;
          delete m._reviewSavedHidden;
        }
      }
      eng._stageBatchDirty = true;
      eng.stageHidden = !on;
    } else if (layer === 'led') {
      if (window.STUDIO?.pro127?.boosts) window.STUDIO.pro127.boosts.led = on ? 1 : 0;
      if (eng && Array.isArray(eng.surfaces)) {
        for (const s of eng.surfaces) {
          if (!s) continue;
          if (!on) {
            if (!('_reviewSavedEnabled' in s)) s._reviewSavedEnabled = s.enabled !== false;
            if (!('_reviewSavedHidden' in s)) s._reviewSavedHidden = Boolean(s.hidden);
            s.enabled = false;
            s.hidden = true;
          } else {
            s.enabled = '_reviewSavedEnabled' in s ? Boolean(s._reviewSavedEnabled) : true;
            s.hidden = '_reviewSavedHidden' in s ? Boolean(s._reviewSavedHidden) : false;
            delete s._reviewSavedEnabled;
            delete s._reviewSavedHidden;
          }
        }
      }
      if (typeof window.STUDIO?.invalidateSeq === 'function') {
        window.STUDIO.invalidateSeq();
      }
    } else if (layer === 'lights') {
      if (window.STUDIO?.pro127?.boosts) window.STUDIO.pro127.boosts.lights = on ? 1 : 0;
      if (eng && Array.isArray(eng.lights)) {
        for (const l of eng.lights) {
          if (!l) continue;
          if (!on) {
            if (!('_reviewSavedEnabled' in l)) l._reviewSavedEnabled = l.enabled !== false;
            l.enabled = false;
          } else {
            l.enabled = '_reviewSavedEnabled' in l ? Boolean(l._reviewSavedEnabled) : true;
            delete l._reviewSavedEnabled;
          }
        }
      }
      if (typeof window.STUDIO?.invalidateSeq === 'function') {
        window.STUDIO.invalidateSeq();
      }
    } else if (layer === 'laser') {
      if (window.STUDIO?.laser135) {
        if (!on) {
          if (!('_reviewSavedActive' in window.STUDIO.laser135)) {
            window.STUDIO.laser135._reviewSavedActive = Boolean(window.STUDIO.laser135.active);
          }
          window.STUDIO.laser135.active = false;
        } else {
          window.STUDIO.laser135.active = '_reviewSavedActive' in window.STUDIO.laser135
            ? Boolean(window.STUDIO.laser135._reviewSavedActive)
            : true;
          delete window.STUDIO.laser135._reviewSavedActive;
        }
      }
      const laserOverlay = document.getElementById('laser135Overlay');
      if (laserOverlay) laserOverlay.style.display = on ? '' : 'none';
    } else if (layer === 'cast') {
      const peopleList = [
        ...(Array.isArray(window.STUDIO?.seq?.people) ? window.STUDIO.seq.people : []),
        ...(Array.isArray(window.seq?.people) ? window.seq.people : []),
        ...(Array.isArray(eng?.people) ? eng.people : [])
      ];
      for (const p of peopleList) {
        if (!p) continue;
        if (!on) {
          if (!('_reviewSavedHidden' in p)) p._reviewSavedHidden = Boolean(p.hidden);
          p.hidden = true;
        } else {
          p.hidden = '_reviewSavedHidden' in p ? Boolean(p._reviewSavedHidden) : false;
          delete p._reviewSavedHidden;
        }
      }
      const actsList = [
        ...(Array.isArray(window.STUDIO?.director?.acts) ? window.STUDIO.director.acts : []),
        ...(Array.isArray(window.director?.acts) ? window.director.acts : [])
      ];
      for (const a of actsList) {
        if (!a) continue;
        if (!on) {
          if (!('_reviewSavedHidden' in a)) a._reviewSavedHidden = Boolean(a.hidden);
          a.hidden = true;
        } else {
          a.hidden = '_reviewSavedHidden' in a ? Boolean(a._reviewSavedHidden) : false;
          delete a._reviewSavedHidden;
        }
      }
      if (eng && typeof eng.drawCast === 'function' && !eng._reviewCastWrapped16) {
        const origDrawCast = eng.drawCast;
        eng._reviewCastWrapped16 = true;
        eng.drawCast = function (...args) {
          if (!state.layerVisibility.cast) return;
          return origDrawCast.apply(this, args);
        };
      }
      const overlay = document.getElementById('chPathsOverlay11');
      if (overlay) overlay.style.display = on ? '' : 'none';
      if (window.STUDIO?.choreo11) window.STUDIO.choreo11.hidden = !on;
    }
    const btn = document.querySelector(`#clientReviewBar16 [data-review-layer="${layer}"]`);
    if (btn) {
      btn.classList.toggle('active', on);
      btn.setAttribute?.('aria-pressed', on ? 'true' : 'false');
    }
  }

  function toggleReviewLayer(layer) {
    if (!(layer in state.layerVisibility)) return;
    state.layerVisibility[layer] = !state.layerVisibility[layer];
    applyReviewLayerVisibility(layer, state.layerVisibility[layer]);
  }

  function ensureClientReviewBar() {
    let bar = document.getElementById('clientReviewBar16');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'clientReviewBar16';
      bar.setAttribute?.('role', 'region');
      bar.setAttribute?.('aria-label', t16('Thanh điều khiển duyệt 3D', '3D Client Review Controls'));
      bar.innerHTML =
        `<div class="review-layers">` +
        `<span class="review-badge">${t16('CHẾ ĐỘ DUYỆT 3D (CHỈ ĐỌC)', '3D CLIENT REVIEW (READ-ONLY)')}</span>` +
        `<strong id="clientReviewStatus16">${t16('Đang tải dự án...', 'Loading project...')}</strong>` +
        `</div>` +
        `<div class="review-cameras">` +
        `<button type="button" class="btn small" id="review16PlayBtn">${t16('▶ Phát / Tạm dừng', '▶ Play / Pause')}</button>` +
        `<button type="button" class="btn small" data-review-cam="front">${t16('Chính diện', 'Front')}</button>` +
        `<button type="button" class="btn small" data-review-cam="iso">${t16('Toàn cảnh', 'Overview')}</button>` +
        `<button type="button" class="btn small" data-review-cam="left">${t16('Cánh trái', 'Left Wing')}</button>` +
        `<button type="button" class="btn small" data-review-cam="right">${t16('Cánh phải', 'Right Wing')}</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="stage">${t16('Sân khấu', 'Stage')}</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="led">LED</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="lights">${t16('Ánh sáng', 'Lighting')}</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="laser">Laser</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="cast">${t16('Nhân vật', 'Performers')}</button>` +
        `</div>`;
      const topbar = document.querySelector('.topbar');
      if (topbar && topbar.parentNode && typeof topbar.after === 'function') {
        topbar.after(bar);
      } else if (typeof document.body?.prepend === 'function') {
        document.body.prepend(bar);
      } else if (typeof document.body?.appendChild === 'function') {
        document.body.appendChild(bar);
      }
      const playBtn = bar.querySelector('#review16PlayBtn');
      if (playBtn) {
        playBtn.onclick = () => document.getElementById('playBtn')?.click();
      }
      bar.querySelectorAll?.('[data-review-cam]')?.forEach((btn) => {
        btn.onclick = () => {
          const cam = btn.getAttribute('data-review-cam');
          if (typeof window.cameraPreset8 === 'function') {
            window.cameraPreset8(cam === 'iso' ? 'hero' : cam, 'stage');
          } else {
            document.querySelector?.(`#cameraBar [data-camera="${cam}"]`)?.click?.();
          }
        };
      });
      bar.querySelectorAll?.('[data-review-layer]')?.forEach((btn) => {
        btn.onclick = () => toggleReviewLayer(btn.getAttribute('data-review-layer'));
      });
    }
    bar.hidden = false;
    applyLocaleToDOM();
    return bar;
  }

  function setReviewStatus(text, isError = false) {
    const statusEl = document.getElementById('clientReviewStatus16');
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.style.color = isError ? '#f59e0b' : '';
    }
  }

  function enterClientReviewMode(shareToken) {
    state.clientReviewMode = true;
    state.shareToken = shareToken;
    state.layerVisibility = { stage: true, led: true, lights: true, laser: true, cast: true };
    document.body.classList.add('client-review-mode');
    if (window.STUDIO?.director) {
      window.STUDIO.director.mode = 'navigate';
    }
    bindClientReviewGuards();
    for (const sel of AUTHORING_SELECTORS) {
      document.querySelectorAll?.(sel)?.forEach((el) => {
        el.hidden = true;
        el.style.display = 'none';
        if ('disabled' in el) el.disabled = true;
      });
    }
    const modal = document.getElementById('modal');
    if (modal && typeof modal.close === 'function' && modal.open) modal.close();
    const recModal = document.getElementById('recovery142Dialog');
    if (recModal && typeof recModal.close === 'function' && recModal.open) recModal.close();
    const bar = ensureClientReviewBar();
    bar.querySelectorAll?.('[data-review-layer]')?.forEach((btn) => {
      btn.classList.add('active');
      btn.setAttribute?.('aria-pressed', 'true');
    });
    if (typeof window.dispatchEvent === 'function' && typeof Event === 'function') {
      window.dispatchEvent(new Event('resize'));
    }
  }

  async function serializeCurrentStage() {
    const packFn = STUDIO.packCurrent142 || window.packCurrent142;
    const buildFn = STUDIO.buildProjectData142 || window.buildProjectData142;
    if (typeof packFn !== 'function' && typeof buildFn !== 'function') {
      throw new Error(t16('Bộ đóng gói dự án V15.1 chưa sẵn sàng.', 'V15.1 project packager is not ready.'));
    }
    const rawResult = typeof packFn === 'function'
      ? await packFn()
      : await buildFn('cloud_save');
    const payload = rawResult && typeof rawResult === 'object' && rawResult.data && rawResult.data.model
      ? rawResult.data
      : rawResult;

    if (
      !payload ||
      typeof payload !== 'object' ||
      !payload.model ||
      typeof payload.model.name !== 'string' ||
      !payload.master ||
      !(Number(payload.master.width) >= 64) ||
      !Array.isArray(payload.screens) ||
      !Array.isArray(payload.lights)
    ) {
      throw new Error(t16('Dữ liệu sân khấu rỗng hoặc chưa hợp lệ để lưu lên Cloud.', 'Stage payload is empty or invalid for Cloud save.'));
    }
    return payload;
  }

  async function cloudSaveProject(customTitle = null) {
    if (state.clientReviewMode) return null;
    try {
      const payload = await serializeCurrentStage();
      const title = String(
        customTitle ||
        state.currentProjectTitle ||
        payload?.projectName ||
        document.getElementById('projectName')?.textContent ||
        payload?.model?.name ||
        'Untitled Stage'
      ).trim();

      const isUpdate = Boolean(state.lastSavedProjectId);
      const endpoint = isUpdate
        ? apiUrl(`/projects/${encodeURIComponent(state.lastSavedProjectId)}`)
        : apiUrl('/projects');
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          ...(isUpdate ? { projectId: state.lastSavedProjectId } : {}),
          title,
          stageSummary: {
            widthM: Number(window.engine?.size?.width || payload?.model?.width || 18),
            depthM: Number(window.engine?.size?.depth || payload?.model?.depth || 10),
            heightM: Number(window.engine?.size?.height || payload?.model?.height || 8),
            ledCount: Number(window.engine?.surfaces?.length ?? payload?.screens?.length ?? 0),
            lightCount: Number(window.engine?.lights?.length ?? payload?.lights?.length ?? 0),
            cueCount: Number(window.seq?.clips?.length ?? payload?.live?.show?.clips?.length ?? 0)
          },
          projectJson: payload
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.project?._id) {
        throw new Error(json?.message || 'Cloud save failed');
      }
      state.lastSavedProjectId = json.data.project._id;
      state.currentProjectTitle = json.data.project.title || title;
      if (typeof window.toast === 'function') {
        window.toast(
          isUpdate
            ? t16('Đã cập nhật dự án trên Alpha Studio Cloud.', 'Updated project on Alpha Studio Cloud.')
            : t16('Đã lưu dự án lên Alpha Studio Cloud.', 'Saved project to Alpha Studio Cloud.')
        );
      }
      return json.data;
    } catch (err) {
      if (typeof window.toast === 'function') {
        window.toast(
          t16('Không lưu được lên Cloud: ', 'Could not save to Cloud: ') +
          (err?.message || t16('Vui lòng kiểm tra đăng nhập hoặc lưu .ledstudio tại máy.', 'Please sign in or save .ledstudio locally.'))
        );
      }
      return null;
    }
  }

  async function listCloudProjects() {
    if (state.clientReviewMode) return [];
    const res = await fetch(apiUrl('/projects'), {
      headers: authHeaders(),
      credentials: 'include'
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.message || t16('Không tải được danh sách dự án Cloud.', 'Could not load Cloud projects.'));
    }
    return Array.isArray(json.data) ? json.data : [];
  }

  async function loadCloudProject(projectId) {
    if (state.clientReviewMode || !projectId) return false;
    try {
      const res = await fetch(apiUrl(`/projects/${encodeURIComponent(projectId)}`), {
        headers: authHeaders(),
        credentials: 'include'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message || t16('Không tìm thấy dự án Cloud.', 'Cloud project not found.'));
      }
      let projectPayload = json.data?.projectJson || null;
      if (!projectPayload && isSafeDownloadUrl(json.data?.downloadUrl)) {
        const dlRes = await fetch(json.data.downloadUrl);
        if (!dlRes.ok) throw new Error(t16('Không tải được gói .ledstudio từ kho lưu trữ.', 'Failed to download .ledstudio archive from storage.'));
        projectPayload = await dlRes.json();
      }
      if (!projectPayload || typeof projectPayload !== 'object') {
        throw new Error(t16('Gói dự án Cloud trống hoặc không hợp lệ.', 'Cloud project archive is empty or invalid.'));
      }
      const applyFn = STUDIO.applyProjectData142 || window.applyProjectData142;
      if (typeof applyFn !== 'function') {
        throw new Error(t16('Bộ nạp dự án V15.1 chưa sẵn sàng.', 'V15.1 project loader is not ready.'));
      }
      await applyFn(projectPayload, `${json.data?.project?.title || 'cloud'}.ledstudio`);
      state.lastSavedProjectId = json.data?.project?._id || projectId;
      state.currentProjectTitle = json.data?.project?.title || null;
      if (typeof window.toast === 'function') {
        window.toast(
          t16(`Đã mở dự án Cloud: ${state.currentProjectTitle || projectId}`, `Opened Cloud project: ${state.currentProjectTitle || projectId}`)
        );
      }
      return true;
    } catch (err) {
      if (typeof window.toast === 'function') {
        window.toast(t16('Lỗi mở dự án Cloud: ', 'Failed to open Cloud project: ') + (err?.message || err));
      }
      return false;
    }
  }

  async function openCloudProjectsModal() {
    if (state.clientReviewMode) return;
    try {
      const projects = await listCloudProjects();
      if (typeof window.dialog === 'function') {
        const html = projects.length
          ? projects.map((p) =>
              `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:10px">` +
              `<div><strong>${esc16(p.title)}</strong><br><small>${Number(p.stageSummary?.ledCount || 0)} LED · ${Number(p.stageSummary?.lightCount || 0)} ${t16('Đèn', 'Lights')}</small></div>` +
              `<button type="button" class="btn small primary" data-cloud16-load="${esc16(p._id)}">${t16('Mở dự án', 'Open')}</button>` +
              `</div>`
            ).join('')
          : `<div class="info-box">${t16('Bạn chưa có dự án nào lưu trên Cloud.', 'You have no saved Cloud projects yet.')}</div>`;
        window.dialog(
          t16('Dự án Alpha Studio Cloud của tôi', 'My Alpha Studio Cloud Projects'),
          html,
          [{ label: t16('Đóng', 'Close') }]
        );
        document.querySelectorAll?.('[data-cloud16-load]')?.forEach((btn) => {
          btn.onclick = async () => {
            const id = btn.getAttribute('data-cloud16-load');
            const modal = document.getElementById('modal');
            if (modal && typeof modal.close === 'function') modal.close();
            await loadCloudProject(id);
          };
        });
      }
    } catch (err) {
      if (typeof window.toast === 'function') {
        window.toast(err?.message || t16('Vui lòng đăng nhập để mở danh sách dự án Cloud.', 'Please sign in to view your Cloud projects.'));
      }
    }
  }

  async function shareClientReviewLink(explicitProjectId = null) {
    if (state.clientReviewMode) return null;
    try {
      let targetId = explicitProjectId || state.lastSavedProjectId;
      if (!targetId) {
        const saved = await cloudSaveProject();
        targetId = saved?.project?._id || state.lastSavedProjectId;
      }
      if (!targetId) {
        throw new Error(t16('Hãy lưu dự án lên Cloud trước khi tạo link chia sẻ.', 'Please save the project to Cloud before creating a share link.'));
      }
      const res = await fetch(apiUrl(`/projects/${encodeURIComponent(targetId)}/share`), {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ enabled: true, expiresInHours: 168 })
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.shareToken) {
        throw new Error(json?.message || t16('Không tạo được link chia sẻ.', 'Failed to create share link.'));
      }
      const shareUrl = `${window.location.origin}/studio/led-studio?share=${encodeURIComponent(json.data.shareToken)}`;
      await navigator.clipboard?.writeText(shareUrl).catch(() => {});
      if (typeof window.toast === 'function') {
        window.toast(
          t16(
            'Đã tạo & sao chép link duyệt 3D (Client Review 7 ngày) vào Clipboard.',
            'Created & copied 7-day 3D Client Review link to Clipboard.'
          )
        );
      }
      return shareUrl;
    } catch (err) {
      if (typeof window.toast === 'function') {
        window.toast(t16('Không thể tạo link chia sẻ: ', 'Could not create share link: ') + (err?.message || t16('Vui lòng đăng nhập trước.', 'Please sign in first.')));
      }
      return null;
    }
  }

  async function resolvePresetData(preset) {
    let payload = preset.payloadJson || preset.payloadSummary || preset.payload || null;
    const rawUrl = preset.downloadUrl || payload?.url || payload?.assetUrl || null;
    let downloadUrl = isSafeDownloadUrl(rawUrl) ? rawUrl : null;
    const hasInlineData = payload && typeof payload === 'object' && Object.keys(payload).some((k) => k !== 'url' && k !== 'assetUrl');

    if (!hasInlineData && !downloadUrl && (preset.b2AssetKey || preset._id || preset.id)) {
      const descEndpoint = (preset._id || preset.id)
        ? apiUrl(`/presets/${encodeURIComponent(preset._id || preset.id)}`)
        : apiUrl(`/presets/asset?key=${encodeURIComponent(preset.b2AssetKey)}`);
      const descRes = await fetch(descEndpoint, {
        headers: authHeaders(),
        credentials: 'include'
      });
      if (descRes.ok) {
        const descJson = await descRes.json().catch(() => null);
        if (descJson?.success && descJson.data) {
          payload = descJson.data.payloadJson || descJson.data.preset?.payloadJson || payload;
          if (isSafeDownloadUrl(descJson.data.downloadUrl)) {
            downloadUrl = descJson.data.downloadUrl;
          }
        }
      }
    }
    return { payload: payload || {}, downloadUrl };
  }

  function localizedTitle(titleObj, fallback = 'Preset') {
    if (typeof titleObj === 'string') return titleObj;
    if (titleObj && typeof titleObj === 'object') {
      return (state.locale === 'en' ? (titleObj.en || titleObj.vi) : (titleObj.vi || titleObj.en)) || fallback;
    }
    return fallback;
  }

  async function loadCloudPreset(presetOrId) {
    if (state.clientReviewMode || !presetOrId) return false;
    try {
      let preset = typeof presetOrId === 'object'
        ? presetOrId
        : state.cachedPresets.find((p) => String(p._id || p.id) === String(presetOrId));
      if (!preset && typeof presetOrId === 'string') {
        const res = await fetch(apiUrl(`/presets/${encodeURIComponent(presetOrId)}`), {
          headers: authHeaders(),
          credentials: 'include'
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          preset = json?.data?.preset || json?.data || null;
        }
      }
      if (!preset) return false;

      const category = preset.category || preset.presetType || 'stage_template';
      let { payload, downloadUrl } = await resolvePresetData(preset);
      const pName = localizedTitle(preset.title, 'Preset');

      if (category === 'ofl_fixture' && STUDIO.fixtureDesk12?.applyOflProfile) {
        const oflId = payload.oflProfileId || payload.profileKey || payload.oflId || payload.id || 'robe/pointe';
        const modeArg = payload.modeIndex ?? payload.modeKey ?? 0;
        const applied = STUDIO.fixtureDesk12.applyOflProfile(payload.fixtureId || null, oflId, modeArg);
        if (applied && typeof window.toast === 'function') {
          window.toast(t16(`Đã áp dụng cấu hình đèn DMX: ${pName || oflId}`, `Applied DMX fixture profile: ${pName || oflId}`));
        }
        return Boolean(applied);
      }

      if (category === 'ilda_laser') {
        if (downloadUrl && !payload.ildaShows && !payload.fixtures) {
          const assetRes = await fetch(downloadUrl);
          if (!assetRes.ok) throw new Error(t16('Không tải được tệp ILDA từ kho preset.', 'Failed to download ILDA file from preset store.'));
          const contentType = String(assetRes.headers?.get?.('content-type') || '');
          if (contentType.includes('json') || downloadUrl.endsWith('.json')) {
            payload = await assetRes.json();
          } else if (STUDIO.laser135?.importIldaFile && typeof assetRes.arrayBuffer === 'function') {
            const buf = await assetRes.arrayBuffer();
            const fileObj = typeof File === 'function'
              ? new File([buf], `${pName}.ild`, { type: 'application/octet-stream' })
              : { name: 'preset.ild', arrayBuffer: async () => buf };
            const imported = await STUDIO.laser135.importIldaFile(fileObj);
            return Boolean(imported);
          }
        }
        if (STUDIO.laser135?.restoreLaser && (payload.fixtures || payload.ildaShows || payload.preset)) {
          STUDIO.laser135.restoreLaser(payload);
          if (typeof window.toast === 'function') {
            window.toast(t16(`Đã nạp preset Laser: ${pName}`, `Loaded Laser preset: ${pName}`));
          }
          return true;
        }
        const deser = STUDIO.laser135?.deserializeIldaShows || STUDIO.laser13?.deserializeIldaShows;
        if (typeof deser === 'function' && Array.isArray(payload.ildaShows)) {
          deser(payload.ildaShows);
          return true;
        }
        return false;
      }

      if (category === 'matrix_fx_preset' || category === 'matrix_cue') {
        if (STUDIO.matrix143) {
          const fxPatch = typeof payload.effect === 'string'
            ? { ...payload, type: payload.effect }
            : (payload.effect && typeof payload.effect === 'object' ? payload.effect : payload);
          if (typeof STUDIO.matrix143.configure === 'function') {
            STUDIO.matrix143.configure(fxPatch);
          } else if (STUDIO.matrix143.effect && typeof STUDIO.matrix143.effect === 'object') {
            Object.assign(STUDIO.matrix143.effect, fxPatch);
          } else if (payload.effect) {
            STUDIO.matrix143.effect = payload.effect;
          }
          if (Number.isFinite(Number(payload.brightness))) STUDIO.matrix143.masterBrightness = Number(payload.brightness);
        }
        if (typeof window.toast === 'function') {
          window.toast(t16(`Đã áp dụng hiệu ứng LED Matrix: ${pName}`, `Applied LED Matrix effect: ${pName}`));
        }
        return true;
      }

      if (category === 'glb_prop') {
        const importFn = window.importModel || STUDIO.importModel;
        if (downloadUrl) {
          const propRes = await fetch(downloadUrl);
          if (!propRes.ok) throw new Error(t16('Không tải được mô hình GLB prop.', 'Failed to download GLB prop model.'));
          const buf = typeof propRes.arrayBuffer === 'function'
            ? await propRes.arrayBuffer()
            : null;
          if (buf && typeof importFn === 'function') {
            const fileName = `${pName.replace(/[^a-zA-Z0-9_-]/g, '_')}.glb`;
            const fileObj = typeof File === 'function'
              ? new File([buf], fileName, { type: 'model/gltf-binary' })
              : { name: fileName, size: buf.byteLength, arrayBuffer: async () => buf };
            await importFn([fileObj], { silent: false });
            return true;
          }
          if (typeof propRes.json === 'function') {
            const jsonModel = await propRes.json().catch(() => null);
            if (jsonModel?.meshes && STUDIO.engine?.setModel) {
              STUDIO.engine.setModel(jsonModel.meshes);
              return true;
            }
          }
        }
        if (Array.isArray(payload?.meshes) && STUDIO.engine?.setModel) {
          STUDIO.engine.setModel(payload.meshes);
          return true;
        }
        return false;
      }

      if (category === 'stage_template' || category === 'stage_3d') {
        if (!payload?.model && downloadUrl) {
          const stageRes = await fetch(downloadUrl);
          if (!stageRes.ok) throw new Error(t16('Không tải được mẫu sân khấu từ kho lưu trữ.', 'Failed to download stage template from storage.'));
          payload = await stageRes.json();
        }
        const applyFn = STUDIO.applyProjectData142 || window.applyProjectData142;
        if (payload?.model && typeof applyFn === 'function') {
          await applyFn(payload, `${pName}.ledstudio`);
          return true;
        }
      }
      return false;
    } catch (err) {
      if (typeof window.toast === 'function') {
        window.toast(t16('Không áp dụng được preset: ', 'Could not apply preset: ') + (err?.message || err));
      }
      return false;
    }
  }

  async function publishCloudPreset(input = {}) {
    if (state.clientReviewMode) return null;
    const normalizedTitle = input.title || (input.titleVi ? { vi: input.titleVi } : t16('Preset cá nhân', 'Personal Preset'));
    const res = await fetch(apiUrl('/presets'), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({
        title: normalizedTitle,
        category: input.category || 'matrix_fx_preset',
        visibility: input.visibility || 'private',
        payloadJson: input.payloadJson || input.payload || {}
      })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.message || t16('Không lưu được preset cá nhân.', 'Failed to save personal preset.'));
    }
    return json.data;
  }

  async function openPresetsModal() {
    if (state.clientReviewMode) return;
    try {
      const scope = state.token ? 'all' : 'public';
      const res = await fetch(apiUrl(`/presets?scope=${scope}`), {
        headers: authHeaders(),
        credentials: 'include'
      });
      const json = await res.json();
      const presets = Array.isArray(json?.data) ? json.data : [];
      state.cachedPresets = presets;
      if (typeof window.dialog === 'function') {
        const rows = presets.length
          ? presets.map((p) => {
              const id = esc16(p._id || p.id || '');
              const title = esc16(localizedTitle(p.title, 'Preset'));
              const cat = esc16(p.category || p.presetType || 'stage_template');
              const vis = p.visibility === 'private' || p.isPublic === false
                ? t16('Cá nhân', 'Private')
                : t16('Công khai', 'Public');
              return (
                `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:10px">` +
                `<div><strong>${title}</strong> · <small>${cat} (${vis})</small></div>` +
                `<button type="button" class="btn small primary" data-cloud16-preset="${id}">${t16('Áp dụng', 'Apply')}</button>` +
                `</div>`
              );
            }).join('')
          : `<div class="info-box">${t16('Kho Preset Cloud sẵn sàng (12 đèn DMX OFL + Stage 3D + ILDA Laser).', 'Cloud Preset Store ready (12 OFL DMX Fixtures + 3D Stages + ILDA Laser).')}</div>`;
        window.dialog(
          t16('Kho Preset Alpha Studio Cloud', 'Alpha Studio Cloud Presets'),
          rows,
          [{ label: t16('Đóng', 'Close') }]
        );
        document.querySelectorAll?.('[data-cloud16-preset]')?.forEach((btn) => {
          btn.onclick = async () => {
            const id = btn.getAttribute('data-cloud16-preset');
            const ok = await loadCloudPreset(id);
            if (!ok && typeof window.toast === 'function') {
              window.toast(t16('Không thể áp dụng preset đã chọn.', 'Could not apply selected preset.'));
            }
          };
        });
        return;
      }
    } catch {
      // Offline fallback
    }
    if (typeof window.toast === 'function') {
      window.toast(
        t16(
          'Đã đồng bộ 12 cấu hình đèn DMX512 (OFL) & thư viện sân khấu mẫu.',
          'Synced 12 DMX512 (OFL) fixture profiles & demo stage library.'
        )
      );
    }
  }

  function injectCloudButtons() {
    const actions = document.querySelector('.topbar .header-actions');
    if (!actions || document.getElementById('cloud16SaveBtn')) return;

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn && !themeBtn.dataset.bound16) {
      themeBtn.dataset.bound16 = '1';
      themeBtn.addEventListener('click', () => {
        applyTheme(state.theme === 'light' ? 'dark' : 'light');
      });
    }

    if (!document.getElementById('langToggleBtn16')) {
      const langBtn = document.createElement('button');
      langBtn.id = 'langToggleBtn16';
      langBtn.type = 'button';
      langBtn.className = 'btn small';
      langBtn.textContent = state.locale === 'en' ? 'EN' : 'VI';
      langBtn.title = t16('Chuyển ngôn ngữ (VI / EN)', 'Switch language (EN / VI)');
      langBtn.onclick = () => applyLocale(state.locale === 'en' ? 'vi' : 'en');
      if (themeBtn && themeBtn.parentNode === actions) {
        themeBtn.after(langBtn);
      } else {
        actions.prepend(langBtn);
      }
    }

    const saveBtn = document.createElement('button');
    saveBtn.id = 'cloud16SaveBtn';
    saveBtn.className = 'btn small';
    saveBtn.textContent = t16('☁ Lưu Cloud', '☁ Save Cloud');
    saveBtn.onclick = () => cloudSaveProject();

    const openBtn = document.createElement('button');
    openBtn.id = 'cloud16OpenBtn';
    openBtn.className = 'btn small';
    openBtn.textContent = t16('📂 Mở Cloud', '📂 Open Cloud');
    openBtn.onclick = () => openCloudProjectsModal();

    const presetsBtn = document.createElement('button');
    presetsBtn.id = 'cloud16PresetsBtn';
    presetsBtn.className = 'btn small';
    presetsBtn.textContent = t16('📦 Kho Preset', '📦 Presets');
    presetsBtn.onclick = () => openPresetsModal();

    const shareBtn = document.createElement('button');
    shareBtn.id = 'cloud16ShareBtn';
    shareBtn.className = 'btn small';
    shareBtn.textContent = t16('🔗 Link duyệt 3D', '🔗 3D Review Link');
    shareBtn.onclick = () => shareClientReviewLink();

    actions.prepend(shareBtn);
    actions.prepend(presetsBtn);
    actions.prepend(openBtn);
    actions.prepend(saveBtn);

    if (typeof window.renderUI === 'function' && !window.renderUI._wrappedLocale16) {
      const prevRenderUI = window.renderUI;
      const wrappedRenderUI = function (...args) {
        const res = prevRenderUI.apply(this, args);
        applyLocaleToDOM();
        return res;
      };
      wrappedRenderUI._wrappedLocale16 = true;
      window.renderUI = wrappedRenderUI;
      STUDIO.renderUI = wrappedRenderUI;
    }

    applyLocaleToDOM();
  }

  function handleHostMessage(event) {
    if (event.origin !== window.location.origin) return false;
    const msg = event.data;
    if (!msg || typeof msg !== 'object' || msg.type !== 'ALPHA_STUDIO_SYNC') return false;

    if (msg.theme) applyTheme(msg.theme);
    if (msg.locale || msg.lang) {
      applyLocale((msg.locale || msg.lang) === 'en' ? 'en' : 'vi');
    }
    if (msg.apiBaseUrl) {
      state.apiBaseUrl = normalizeApiBaseUrl(msg.apiBaseUrl);
    }
    if ('token' in msg || 'user' in msg) {
      const prevUserId = state.user?._id || state.user?.id || null;
      const nextToken = msg.token ? String(msg.token) : null;
      const nextUser = msg.user && typeof msg.user === 'object' ? msg.user : null;
      const nextUserId = nextUser?._id || nextUser?.id || null;
      if (!nextToken || prevUserId !== nextUserId) {
        state.lastSavedProjectId = null;
        state.currentProjectTitle = null;
      }
      state.token = nextToken;
      state.user = nextUser;
    }
    if (msg.shareToken) {
      loadSharedProject(String(msg.shareToken));
    }
    return true;
  }

  window.addEventListener('message', handleHostMessage);

  async function loadSharedProject(rawShareToken) {
    const shareToken = String(rawShareToken || '').trim();
    if (!shareToken) return false;
    enterClientReviewMode(shareToken);
    document.body.dataset.shareStatus = 'loading';
    state.reviewSharedTitle = null;
    setReviewStatus(t16('Đang tải bản xem duyệt 3D...', 'Loading 3D review scene...'));
    try {
      const res = await fetch(apiUrl(`/share/${encodeURIComponent(shareToken)}`), {
        credentials: 'include'
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.message || t16('Link chia sẻ không hợp lệ hoặc đã hết hạn.', 'Share link is invalid or has expired.'));
      }
      let projectPayload = json.data?.projectJson || null;
      if (!projectPayload && isSafeDownloadUrl(json.data?.downloadUrl)) {
        const dlRes = await fetch(json.data.downloadUrl);
        if (!dlRes.ok) throw new Error(t16('Không tải được gói dự án từ link chia sẻ.', 'Failed to download project archive from share link.'));
        projectPayload = await dlRes.json();
      }
      if (!projectPayload || typeof projectPayload !== 'object') {
        throw new Error(t16('Dữ liệu dự án chia sẻ không khả dụng.', 'Shared project data is unavailable.'));
      }
      const applyFn = STUDIO.applyProjectData142 || window.applyProjectData142;
      if (typeof applyFn !== 'function') {
        throw new Error(t16('Bộ nạp dự án V15.1 chưa sẵn sàng.', 'V15.1 project loader is not ready.'));
      }
      await applyFn(projectPayload, `${json.data?.title || 'shared'}.ledstudio`);
      document.body.dataset.shareStatus = 'loaded';
      state.reviewSharedTitle = json.data?.title || t16('Sân khấu 3D', '3D Stage');
      setReviewStatus(
        t16(`Đang xem: ${state.reviewSharedTitle}`, `Viewing: ${state.reviewSharedTitle}`)
      );
      return true;
    } catch (err) {
      document.body.dataset.shareStatus = 'error';
      const msg = err?.message || t16('Không tải được link chia sẻ 3D.', 'Could not load 3D share link.');
      setReviewStatus(msg, true);
      if (typeof window.toast === 'function') {
        window.toast(msg);
      }
      return false;
    }
  }

  async function checkClientReviewShareLink() {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get('share');
    if (!shareToken) return false;
    return await loadSharedProject(shareToken);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectCloudButtons();
      checkClientReviewShareLink();
    });
  } else {
    injectCloudButtons();
    checkClientReviewShareLink();
  }

  STUDIO.cloud16 = {
    state,
    normalizeApiBaseUrl,
    apiUrl,
    applyTheme,
    applyLocale,
    applyLocaleToDOM,
    handleHostMessage,
    isClientReviewMode: () => state.clientReviewMode,
    enterClientReviewMode,
    toggleReviewLayer,
    cloudSaveProject,
    saveCloudProject: cloudSaveProject,
    listCloudProjects,
    loadCloudProject,
    openCloudProjectsModal,
    shareClientReviewLink,
    createClientShareLink: shareClientReviewLink,
    loadSharedProject,
    loadCloudPreset,
    publishCloudPreset,
    openPresetsModal
  };
})();
