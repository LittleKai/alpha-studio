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
    theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
    apiBaseUrl: normalizeApiBaseUrl(
      initialQueryParams.get('apiBase') || window.__ALPHA_STUDIO_API_URL__ || '/api/led-studio'
    ),
    clientReviewMode: false,
    shareToken: null,
    lastSavedProjectId: null,
    currentProjectTitle: null,
    googleClientId: null,
    driveToken: null,
    driveTokenExpiresAt: 0,
    driveFileId: null,
    driveModelName: null,
    driveStage: null,
    shareStage: null,
    cachedPresets: [],
    reviewGuardsBound: false,
    reviewSharedTitle: null,
    layerVisibility: { stage: true, led: true, lights: true, laser: true, cast: true },
    sharePassword: '',
    reviewStatus: 'pending',
    reviewBy: '',
    reviewNote: '',
    reviewComments: [],
    pinCommentMode: false
  };

  function t16(viText, enText) {
    if (window.tr) return window.tr(viText, enText);
    return state.locale === 'en' ? enText : viText;
  }

  const DOM_TRANSLATIONS = [
    ['#helpBtn', 'Hướng dẫn', 'Guide'],
    ['#loadProject', 'Mở dự án', 'Open Project'],
    ['#saveProject', 'Lưu dự án', 'Save Project'],
    ['#presentBtn', 'Trình diễn', 'Present'],
    ['#recovery142OpenBtn', 'Dự phòng', 'Recovery'],
    ['#cloud16SaveBtn', 'Lưu Drive', 'Save to Drive'],
    ['#cloud16OpenBtn', 'Mở Drive', 'Open Drive'],
    ['#cloud16PresetsBtn', 'Kho Preset', 'Presets'],
    ['#cloud16ShareBtn', 'Link duyệt 3D', '3D Review Link'],
    ['#v07Audio', 'Bật Audio', 'Enable Audio'],
    ['#v07Timeline', 'SHOW Timeline', 'SHOW Timeline'],
    ['#v07Cast', 'Người 3D', '3D People'],
    ['.workflow [data-step="stage"] b', 'Sân khấu 3D', '3D STAGE'],
    ['.workflow [data-step="mapping"] b', 'LED & VIDEO', 'LED & VIDEO'],
    ['.workflow [data-step="lighting"] b', 'Ánh sáng & show', 'LIGHTING & SHOW'],
    ['#ledManagerBtn', 'Quản lý LED', 'LED Manager'],
    ['#exportBtn', 'Xuất', 'Export'],
    ['#importModel strong', 'Nhập sân khấu 3D', 'Import 3D Stage'],
    ['#importModel small', 'Kéo file vào cửa sổ để bắt đầu', 'Drag files into window to start'],
    ['#demoBtn', 'Sân khấu mẫu', 'Demo Stage'],
    ['#importFolder', 'Thư mục', 'Folder'],
    ['#skpHelp', 'Từ SketchUp ', 'From SketchUp '],
    ['#autoDetect', 'Nhận diện LED', 'Auto-detect LED'],
    ['#drawQuad', '+ 4 góc', '+ 4-Point Quad'],
    ['#repairMapping', 'Sửa mapping 3D', 'Repair 3D Mapping'],
    ['.media-section .section-heading h3', 'Thư viện video', 'Video Library'],
    ['#addMedia', '+ Thêm', '+ Add'],
    ['#sampleVideo', 'Thử với video mapped mẫu', 'Try Demo Mapped Video'],
    ['.media-section .micro-note', 'File ở trên máy bạn. Không upload lên server.', 'Files stay on your device. No server upload.'],
    ['.view-tabs [data-view="stage"]', 'Sân khấu 3D', '3D Stage'],
    ['.view-tabs [data-view="map"]', 'Pixel Map', 'Pixel Map'],
    ['.view-tabs [data-view="solo"]', 'LED đang chọn', 'Selected LED'],
    ['#overviewBtn', 'Toàn cảnh', 'Overview'],
    ['#lockCameraBtn', 'Khóa góc', 'Lock Cam'],
    ['#focusBtn', 'Mở rộng', 'Expand'],
    ['#assetDrawer', 'Dữ liệu', 'Assets'],
    ['#inspectorDrawer', 'Thông số', 'Inspector'],
    ['#v125LiftNav', '╳ Bàn nâng', '╳ Stage Lift'],
    ['#v124LiftBtn', '╳ Bàn nâng chữ X', '╳ Scissor Lift'],
    ['#dirFrameLED', 'Căn LED', 'Frame LED'],
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
    ['#pro127bar [data-pro127="bright"]', 'Tăng sáng', 'Boost Brightness'],
    ['#l132Launch', 'Ghi thao tác đèn', 'Record Light Take'],
    ['#matrix143OpenBtn', 'LED matrix viền', 'LED MATRIX CONTOUR'],
    ['#matrix148DrawBtn', 'Vẽ đường viền', 'DRAW LED PATH'],
    ['#interactionHint', 'Kéo: xoay   /   Chuột phải: di chuyển   /   Cuộn: zoom', 'Drag: orbit   /   Right-click: pan   /   Scroll: zoom'],
    ['#screenshotBtn', 'Chụp phối cảnh ', 'Capture Shot '],
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
    ['#clientReviewBar16 .review-badge', 'Chế độ duyệt 3D (chỉ đọc)', '3D CLIENT REVIEW (READ-ONLY)'],
    ['#review16PlayBtn', 'Phát / Tạm dừng', 'Play / Pause'],
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

  const STATIC_UI_TEXT16 = [
    ['Đang khởi động sân khấu 3D…', 'Loading 3D stage…'],
    ['Thiết kế sân khấu 3D', '3D stage design'],
    ['Chạy tại máy', 'Local'], ['Tài nguyên dự án', 'Project assets'],
    ['Xem trực tiếp', 'Live preview'], ['Lặp', 'Loop'],
    ['Camera tự xoay', 'Auto-rotate camera'], ['Chất lượng xem', 'Preview quality'],
    ['Tổng', 'Master'], ['Dữ liệu', 'Assets'], ['Thông số', 'Inspector'],
    ['Không gian 3D thật. Media trên máy bạn.', 'Real 3D space. Media stays on your device.'],
    ['Về chỉnh sửa', 'Back to editor'], ['Phát', 'Play'], ['Toàn cảnh', 'Fit stage'],
    ['Tự xoay: Tắt', 'Auto-rotate: Off'], ['Đang xử lý...', 'Working…'],
    ['Thả model hoặc video vào đây', 'Drop a model or video here'],
    ['Kéo: xoay   /   Chuột phải: di chuyển   /   Cuộn: zoom', 'Drag: orbit / Right drag: pan / Scroll: zoom'],
    ['Space: phát  ·  F: toàn cảnh  ·  1/2/3: chuyển bước  ·  Ctrl+S: lưu', 'Space: play · F: fit · 1/2/3: workspace · Ctrl+S: save'],
    ['Cỡ chữ', 'Text size'], ['Màu nền', 'Theme'], ['Ngôn ngữ', 'Language'],
    ['Nhỏ', 'Small'], ['Vừa', 'Medium'], ['Lớn', 'Large'], ['Tối', 'Dark'], ['Sáng', 'Light'],
    ['Cài đặt giao diện', 'Interface settings'], ['Giao diện', 'Interface'], ['Đóng', 'Close']
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
      if (el) el.textContent = t16(viText, enText);
    }
    const langBtn = document.getElementById('langToggleBtn16');
    if (langBtn) {
      langBtn.textContent = isEn ? 'EN' : 'VI';
      langBtn.title = isEn ? 'Switch language (EN / VI)' : 'Chuyển ngôn ngữ (VI / EN)';
      langBtn.setAttribute('aria-label', langBtn.title);
    }
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.title = isEn ? 'Switch Light / Dark theme' : 'Chuyển giao diện Sáng / Tối';
      themeBtn.setAttribute('aria-label', themeBtn.title);
    }
    const projectName = document.getElementById('projectName');
    if (projectName) projectName.title = t16('Đổi tên dự án', 'Rename project');
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
        ? (isEn ? 'Show Grid' : 'Hiện lưới')
        : (isEn ? 'Hide Grid' : 'Ẩn lưới');
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
    for (const [vi, en] of STATIC_UI_TEXT16) window.tr?.(vi, en);
    window.translateUiText?.();
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
    window.renderUI?.();
    window.translateUiText?.();
    window.dispatchEvent?.(new CustomEvent('ledstudio:locale', { detail: { locale: next } }));
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
    try {
      window.localStorage?.setItem('ledstudio-theme', next);
    } catch {
      // ignore storage errors
    }
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
    '#lumi18AiBtn',
    '#aiChat18',
    '#aiChat18Toggle',
    '#account18Chip',
    '#account18Menu',
    '#lumi18TemplatesBtn',
    '#lumi18BomBtn',
    '#lumi18BillingBtn',
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
      const tag = String(e.target?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
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
        `<span class="review-badge">${t16('Chế độ duyệt 3D (chỉ đọc)', '3D CLIENT REVIEW (READ-ONLY)')}</span>` +
        `<strong id="clientReviewStatus16">${t16('Đang tải dự án...', 'Loading project...')}</strong>` +
        `</div>` +
        `<div class="review-cameras">` +
        `<button type="button" class="btn small" id="review16PlayBtn">${t16('Phát / Tạm dừng', 'Play / Pause')}</button>` +
        `<button type="button" class="btn small" data-review-cam="front">${t16('Chính diện', 'Front')}</button>` +
        `<button type="button" class="btn small" data-review-cam="iso">${t16('Toàn cảnh', 'Overview')}</button>` +
        `<button type="button" class="btn small" data-review-cam="left">${t16('Cánh trái', 'Left Wing')}</button>` +
        `<button type="button" class="btn small" data-review-cam="right">${t16('Cánh phải', 'Right Wing')}</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="stage">${t16('Sân khấu', 'Stage')}</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="led">LED</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="lights">${t16('Ánh sáng', 'Lighting')}</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="laser">Laser</button>` +
        `<button type="button" class="btn small active" aria-pressed="true" data-review-layer="cast">${t16('Nhân vật', 'Performers')}</button>` +
        `<button type="button" class="btn small" id="review16PinBtn" title="${t16('Bấm vào điểm trên sân khấu 3D để ghim nhận xét', 'Click on 3D stage to pin a comment')}">${t16('Ghim 3D', 'Pin 3D')}</button>` +
        `<button type="button" class="btn small" id="review16CommentsBtn">${t16('Bình luận', 'Comments')} (0)</button>` +
        `<button type="button" class="btn small primary" id="review16ApproveBtn">${t16('Duyệt phương án', 'Approve')}</button>` +
        `<button type="button" class="btn small" id="review16ChangesBtn">${t16('Cần chỉnh sửa', 'Request Changes')}</button>` +
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
      const pinBtn = bar.querySelector('#review16PinBtn');
      if (pinBtn) {
        pinBtn.onclick = () => {
          state.pinCommentMode = !state.pinCommentMode;
          pinBtn.classList.toggle('active', state.pinCommentMode);
          window.toast?.(
            state.pinCommentMode
              ? t16('Hãy bấm vào vị trí bất kỳ trên sân khấu 3D để ghim nhận xét.', 'Click anywhere on the 3D stage to pin a comment.')
              : t16('Đã tắt chế độ ghim nhận xét 3D.', 'Disabled 3D pin comment mode.')
          );
        };
      }
      const commentsBtn = bar.querySelector('#review16CommentsBtn');
      if (commentsBtn) commentsBtn.onclick = () => openReviewCommentsModal();
      const approveBtn = bar.querySelector('#review16ApproveBtn');
      if (approveBtn) approveBtn.onclick = () => openReviewDecisionModal('approved');
      const changesBtn = bar.querySelector('#review16ChangesBtn');
      if (changesBtn) changesBtn.onclick = () => openReviewDecisionModal('changes_requested');
      bindReviewPinCanvas();
    }
    bar.hidden = false;
    applyLocaleToDOM();
    updateReviewBarSummary();
    return bar;
  }

  function updateReviewBarSummary() {
    const cBtn = document.getElementById('review16CommentsBtn');
    if (cBtn) {
      const count = Array.isArray(state.reviewComments) ? state.reviewComments.length : 0;
      cBtn.textContent = `${t16('Bình luận', 'Comments')} (${count})`;
    }
    if (state.clientReviewMode && state.reviewSharedTitle) {
      let badge = '';
      if (state.reviewStatus === 'approved') {
        badge = ` · ${t16('Đã duyệt', 'APPROVED')}${state.reviewBy ? ` (${state.reviewBy})` : ''}`;
      } else if (state.reviewStatus === 'changes_requested') {
        badge = ` · ${t16('Cần chỉnh sửa', 'CHANGES REQUESTED')}${state.reviewBy ? ` (${state.reviewBy})` : ''}`;
      }
      setReviewStatus(
        (state.locale === 'en' ? `Viewing: ${state.reviewSharedTitle}` : `Đang xem: ${state.reviewSharedTitle}`) + badge
      );
    }
  }

  function bindReviewPinCanvas() {
    const canvas = document.getElementById('glcanvas');
    if (!canvas || canvas.dataset?.boundReviewPin16) return;
    if (canvas.dataset) canvas.dataset.boundReviewPin16 = '1';
    canvas.addEventListener('click', (e) => {
      if (!state.clientReviewMode || !state.pinCommentMode) return;
      const eng = window.STUDIO?.engine || window.engine;
      let pos = [0, 1.5, 0];
      let targetName = 'Stage';
      try {
        const hit = eng?.pick?.(e.clientX, e.clientY);
        if (hit && Array.isArray(hit.point)) {
          pos = hit.point.map((v) => +Number(v || 0).toFixed(2));
          targetName = hit.mesh?.name || hit.surface?.name || 'Stage 3D';
        } else if (Array.isArray(eng?.camera?.target)) {
          pos = eng.camera.target.map((v) => +Number(v || 0).toFixed(2));
        }
      } catch {
        // fallback pos
      }
      state.pinCommentMode = false;
      document.getElementById('review16PinBtn')?.classList?.remove('active');
      openReviewCommentsModal(pos, targetName);
    });
  }

  async function submitReviewComment(commentInput = {}) {
    if (!state.shareToken) throw new Error(t16('Chưa có mã link duyệt 3D.', 'Missing 3D review shareToken.'));
    const headers = {
      'Content-Type': 'application/json',
      ...(state.sharePassword ? { 'x-share-password': state.sharePassword } : {})
    };
    const res = await fetch(apiUrl(`/share/${encodeURIComponent(state.shareToken)}/comments`), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        author: String(commentInput.author || t16('Khách hàng', 'Client')).trim(),
        message: String(commentInput.message || '').trim(),
        position: Array.isArray(commentInput.position) ? commentInput.position : [0, 1.5, 0],
        targetName: String(commentInput.targetName || '')
      })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json?.message || t16('Không gửi được bình luận 3D.', 'Could not submit 3D comment.'));
    }
    if (Array.isArray(json.data?.reviewComments)) {
      state.reviewComments = json.data.reviewComments;
    } else if (json.data?.comment) {
      state.reviewComments.push(json.data.comment);
    }
    updateReviewBarSummary();
    return json.data;
  }

  async function submitReviewDecision(decision, author = '', note = '') {
    if (!state.shareToken) throw new Error(t16('Chưa có mã link duyệt 3D.', 'Missing 3D review shareToken.'));
    const headers = {
      'Content-Type': 'application/json',
      ...(state.sharePassword ? { 'x-share-password': state.sharePassword } : {})
    };
    const cleanAuthor = String(author || t16('Khách hàng', 'Client')).trim();
    const res = await fetch(apiUrl(`/share/${encodeURIComponent(state.shareToken)}/decision`), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        status: decision,
        decision,
        reviewerName: cleanAuthor,
        author: cleanAuthor,
        note: String(note || '').trim()
      })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json?.message || t16('Không cập nhật được trạng thái duyệt.', 'Could not update review decision.'));
    }
    state.reviewStatus = json.data?.reviewStatus || decision;
    state.reviewBy = json.data?.reviewBy || author;
    state.reviewNote = json.data?.reviewNote || note;
    updateReviewBarSummary();
    return json.data;
  }

  function openReviewCommentsModal(prefillPos = null, prefillTarget = '') {
    if (typeof window.dialog !== 'function') return;
    const comments = Array.isArray(state.reviewComments) ? state.reviewComments : [];
    const posArr = Array.isArray(prefillPos) ? prefillPos : [0, 1.5, 0];
    const listHtml = comments.length
      ? comments.map((c, idx) => {
          const p = Array.isArray(c.position) ? c.position : [0, 0, 0];
          return (
            `<div class="info-box" style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">` +
            `<div><strong>#${idx + 1} · ${esc16(c.author || 'Client')}</strong> ` +
            `<small>(${esc16(p.join(', '))}m)</small><br>` +
            `<span>${esc16(c.message || '')}</span></div>` +
            `<button type="button" class="btn small" data-review-fly="${esc16(p.join(','))}">${t16('Xem điểm', 'Focus')}</button>` +
            `</div>`
          );
        }).join('')
      : `<div class="info-box">${t16('Chưa có bình luận ghim 3D nào.', 'No 3D pinned comments yet.')}</div>`;

    const formHtml =
      `<div style="max-height:220px;overflow:auto;margin-bottom:10px">${listHtml}</div>` +
      `<div class="info-box">` +
      `<strong>${t16('Thêm nhận xét ghim 3D', 'Add 3D Pin Comment')} (${esc16(posArr.join(', '))}m ${prefillTarget ? '· ' + esc16(prefillTarget) : ''})</strong>` +
      `<div style="display:grid;gap:8px;margin-top:8px">` +
      `<input id="review16CommentAuthor" class="search" placeholder="${t16('Tên của bạn / Đơn vị duyệt', 'Your Name / Organization')}" value="${esc16(state.reviewBy || '')}">` +
      `<textarea id="review16CommentMsg" rows="3" style="width:100%;padding:8px;border-radius:6px;background:rgba(15,23,42,.8);color:#e2e8f0;border:1px solid rgba(148,163,184,.3)" placeholder="${t16('Nhập nội dung góp ý tại vị trí 3D này (VD: Hạ thấp màn LED cánh trái 0.5m)...', 'Enter feedback at this 3D position...')}"></textarea>` +
      `<button type="button" class="btn primary" id="review16SubmitCommentBtn">${t16('Gửi bình luận 3D', 'Post 3D Comment')}</button>` +
      `</div></div>`;

    window.dialog(
      t16('Bình luận ghim 3D trên sân khấu', '3D Stage Pinned Comments'),
      formHtml,
      [{ label: t16('Đóng', 'Close') }]
    );

    document.querySelectorAll?.('[data-review-fly]')?.forEach((btn) => {
      btn.onclick = () => {
        const raw = String(btn.getAttribute('data-review-fly') || '').split(',').map(Number);
        const eng = window.STUDIO?.engine || window.engine;
        if (eng?.camera && raw.length === 3 && raw.every(Number.isFinite)) {
          eng.camera.target = [raw[0], raw[1], raw[2]];
          eng.render?.(window.state?.time || 0);
        }
        const modal = document.getElementById('modal');
        if (modal && typeof modal.close === 'function') modal.close();
      };
    });

    const submitBtn = document.getElementById('review16SubmitCommentBtn');
    if (submitBtn) {
      submitBtn.onclick = async () => {
        const author = document.getElementById('review16CommentAuthor')?.value || '';
        const message = document.getElementById('review16CommentMsg')?.value || '';
        if (!message.trim()) {
          window.toast?.(t16('Vui lòng nhập nội dung nhận xét.', 'Please enter a comment message.'));
          return;
        }
        try {
          await submitReviewComment({ author, message, position: posArr, targetName: prefillTarget });
          window.toast?.(t16('Đã ghim bình luận 3D thành công.', 'Pinned 3D comment successfully.'));
          openReviewCommentsModal(posArr, prefillTarget);
        } catch (err) {
          window.toast?.(err?.message || String(err));
        }
      };
    }
  }

  function openReviewDecisionModal(decision = 'approved') {
    if (typeof window.dialog !== 'function') return;
    const isApprove = decision === 'approved';
    const html =
      `<div class="info-box" style="display:grid;gap:8px">` +
      `<p>${isApprove
        ? t16('Xác nhận <strong>Duyệt phương án sân khấu 3D</strong> này để đội kỹ thuật tiến hành bóc tách BOM & thi công.', 'Confirm <strong>APPROVAL</strong> of this 3D stage design for BOM & production.')
        : t16('Gửi yêu cầu <strong>Chỉnh sửa phương án</strong> kèm ghi chú tổng thể cho đội thiết kế.', 'Request <strong>DESIGN CHANGES</strong> with overall notes for the design team.')}</p>` +
      `<input id="review16DecisionAuthor" class="search" placeholder="${t16('Họ tên / Chức vụ người duyệt', 'Approver Name / Title')}" value="${esc16(state.reviewBy || '')}">` +
      `<textarea id="review16DecisionNote" rows="3" style="width:100%;padding:8px;border-radius:6px;background:rgba(15,23,42,.8);color:#e2e8f0;border:1px solid rgba(148,163,184,.3)" placeholder="${t16('Ghi chú duyệt hoặc yêu cầu chỉnh sửa...', 'Approval note or requested changes...')}"></textarea>` +
      `<button type="button" class="btn primary" id="review16ConfirmDecisionBtn">${isApprove ? t16('Xác nhận Duyệt phương án', 'Confirm Approval') : t16('Gửi yêu cầu chỉnh sửa', 'Submit Change Request')}</button>` +
      `</div>`;
    window.dialog(
      isApprove ? t16('Duyệt phương án sân khấu 3D', 'Approve 3D Stage Design') : t16('Yêu cầu chỉnh sửa phương án', 'Request Design Changes'),
      html,
      [{ label: t16('Huỷ', 'Cancel') }]
    );
    const confirmBtn = document.getElementById('review16ConfirmDecisionBtn');
    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        const author = document.getElementById('review16DecisionAuthor')?.value || '';
        const note = document.getElementById('review16DecisionNote')?.value || '';
        try {
          await submitReviewDecision(decision, author, note);
          const modal = document.getElementById('modal');
          if (modal && typeof modal.close === 'function') modal.close();
          window.toast?.(
            isApprove
              ? t16('Đã ghi nhận DUYỆT PHƯƠNG ÁN thành công', 'Stage design APPROVED!')
              : t16('Đã gửi yêu cầu chỉnh sửa cho đội thiết kế.', 'Sent change request to the design team.')
          );
        } catch (err) {
          window.toast?.(err?.message || String(err));
        }
      };
    }
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

  function projectTitleOf(payload, customTitle = null) {
    return String(
      customTitle ||
      state.currentProjectTitle ||
      payload?.projectName ||
      // #projectName và model.name là tên file model: bỏ đuôi như saveProject.
      String(document.getElementById('projectName')?.textContent || payload?.model?.name || '').replace(/\.[a-z0-9]+$/i, '') ||
      'Untitled Stage'
    ).trim();
  }

  function stageSummaryOf(payload) {
    return {
      widthM: Number(window.engine?.size?.width || payload?.model?.width || 18),
      depthM: Number(window.engine?.size?.depth || payload?.model?.depth || 10),
      heightM: Number(window.engine?.size?.height || payload?.model?.height || 8),
      ledCount: Number(window.engine?.surfaces?.length ?? payload?.screens?.length ?? 0),
      lightCount: Number(window.engine?.lights?.length ?? payload?.lights?.length ?? 0),
      cueCount: Number(window.seq?.clips?.length ?? payload?.live?.show?.clips?.length ?? 0)
    };
  }

  // engine.setModel gán mảng stage mới mỗi lần nạp model (mở file, demo, import):
  // file Drive / bản chụp share chỉ gắn với đúng sân khấu đang mở lúc lưu.
  const currentStage = () => window.engine?.stage ?? null;

  function setBusy16(on, msg) {
    if (typeof window.busy === 'function') window.busy(on, msg);
  }

  // Google Drive cá nhân là nơi lưu dự án. Scope drive.file: app chỉ thấy file do chính nó tạo.
  const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
  const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
  let gisLoading = null;

  // Chỉ nạp Google Identity khi người dùng bấm nút Drive, không gọi Google lúc khởi động.
  function loadGoogleIdentity() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    gisLoading = gisLoading || new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        gisLoading = null;
        reject(new Error(t16('Không tải được Google Sign-In. Kiểm tra kết nối mạng.', 'Could not load Google Sign-In. Check your connection.')));
      };
      document.head.appendChild(s);
    });
    return gisLoading;
  }

  async function driveToken() {
    if (state.driveToken && Date.now() < state.driveTokenExpiresAt - 60000) return state.driveToken;
    if (!state.googleClientId) {
      throw new Error(t16('Google Drive chưa được cấu hình (thiếu Google Client ID).', 'Google Drive is not configured (missing Google Client ID).'));
    }
    await loadGoogleIdentity();
    return new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: state.googleClientId,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          if (!resp || resp.error || !resp.access_token) {
            reject(new Error(resp?.error_description || resp?.error || 'Google authorization failed'));
            return;
          }
          state.driveToken = resp.access_token;
          state.driveTokenExpiresAt = Date.now() + Number(resp.expires_in || 3600) * 1000;
          resolve(resp.access_token);
        },
        error_callback: (err) => reject(new Error(
          err?.type === 'popup_failed_to_open'
            ? t16('Trình duyệt đã chặn cửa sổ Google. Hãy bấm lại nút Drive.', 'The browser blocked the Google window. Click the Drive button again.')
            : t16('Đã huỷ đăng nhập Google.', 'Google sign-in was cancelled.')
        ))
      });
      client.requestAccessToken({ prompt: '' });
    });
  }

  async function driveFetch(url, opts = {}) {
    const token = await driveToken();
    const res = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } });
    if (res.status === 401) state.driveToken = null;
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      const err = new Error(json?.error?.message || `Google Drive HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res;
  }

  async function driveSaveProject(customTitle = null) {
    if (state.clientReviewMode) return null;
    try {
      // Xin quyền trước khi đóng gói: popup Google phải mở ngay trong cú bấm của người dùng.
      await driveToken();
      setBusy16(true, t16('Đang đóng gói và tải lên Google Drive...', 'Packing and uploading to Google Drive...'));
      const payload = await serializeCurrentStage();
      const title = projectTitleOf(payload, customTitle);
      const summary = stageSummaryOf(payload);
      // Đổi sang sân khấu (model) khác thì tạo file mới, không ghi đè file Drive của dự án trước.
      const isUpdate = Boolean(state.driveFileId) && state.driveModelName === payload.model.name && state.driveStage === currentStage();
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const init = await driveFetch(
        isUpdate
          ? `${DRIVE_UPLOAD}/${encodeURIComponent(state.driveFileId)}?uploadType=resumable`
          : `${DRIVE_UPLOAD}?uploadType=resumable`,
        {
          method: isUpdate ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${title}.ledstudio`,
            ...(isUpdate ? {} : { mimeType: 'application/json' }),
            appProperties: { alphaLedStudio: '1', ledCount: String(summary.ledCount), lightCount: String(summary.lightCount) }
          })
        }
      );
      const sessionUrl = init.headers.get('Location');
      if (!sessionUrl) throw new Error(t16('Google Drive không trả về phiên tải lên.', 'Google Drive did not return an upload session.'));
      const up = await fetch(sessionUrl, { method: 'PUT', body: blob });
      if (!up.ok) throw new Error(`Google Drive upload HTTP ${up.status}`);
      const file = await up.json();
      state.driveFileId = file.id;
      state.driveModelName = payload.model.name;
      state.driveStage = currentStage();
      state.currentProjectTitle = title;
      window.toast?.(
        isUpdate
          ? t16(`Đã cập nhật "${title}" trên Google Drive.`, `Updated "${title}" on Google Drive.`)
          : t16(`Đã lưu "${title}" lên Google Drive.`, `Saved "${title}" to Google Drive.`)
      );
      return file;
    } catch (err) {
      if (err?.status === 404) state.driveFileId = null; // file đã bị xoá trên Drive: lần lưu sau tạo file mới
      window.toast?.(t16('Không lưu được lên Google Drive: ', 'Could not save to Google Drive: ') + (err?.message || err));
      return null;
    } finally {
      setBusy16(false);
    }
  }

  async function listDriveProjects() {
    const params = new URLSearchParams({
      q: "appProperties has { key='alphaLedStudio' and value='1' } and trashed=false",
      orderBy: 'modifiedTime desc',
      pageSize: '50',
      fields: 'files(id,name,modifiedTime,size,appProperties)'
    });
    const res = await driveFetch(`${DRIVE_FILES}?${params}`);
    const json = await res.json();
    return Array.isArray(json.files) ? json.files : [];
  }

  async function listDriveRevisions(fileId) {
    if (!fileId) return [];
    const params = new URLSearchParams({
      fields: 'revisions(id,modifiedTime,size,originalFilename,keepForever)',
      pageSize: '30'
    });
    const res = await driveFetch(`${DRIVE_FILES}/${encodeURIComponent(fileId)}/revisions?${params}`);
    const json = await res.json();
    const revs = Array.isArray(json.revisions) ? json.revisions : [];
    return revs.slice().reverse();
  }

  async function restoreDriveRevision(fileId, revisionId, fileName = 'drive.ledstudio') {
    if (state.clientReviewMode || !fileId || !revisionId) return false;
    try {
      setBusy16(true, t16('Đang khôi phục phiên bản từ Google Drive...', 'Restoring revision from Google Drive...'));
      const res = await driveFetch(`${DRIVE_FILES}/${encodeURIComponent(fileId)}/revisions/${encodeURIComponent(revisionId)}?alt=media`);
      const payload = await res.json();
      const applyFn = STUDIO.applyProjectData142 || window.applyProjectData142;
      if (typeof applyFn !== 'function') {
        throw new Error(t16('Bộ nạp dự án V15.1 chưa sẵn sàng.', 'V15.1 project loader is not ready.'));
      }
      await applyFn(payload, fileName);
      state.driveFileId = fileId;
      state.driveModelName = payload?.model?.name || null;
      state.driveStage = currentStage();
      state.currentProjectTitle = String(fileName).replace(/\.ledstudio$/i, '');
      window.toast?.(t16(`Đã khôi phục phiên bản "${state.currentProjectTitle}" (${revisionId}).`, `Restored revision "${state.currentProjectTitle}" (${revisionId}).`));
      return true;
    } catch (err) {
      window.toast?.(t16('Không khôi phục được phiên bản Google Drive: ', 'Failed to restore Google Drive revision: ') + (err?.message || err));
      return false;
    } finally {
      setBusy16(false);
    }
  }

  async function openDriveRevisionsModal(fileId, fileName = 'drive.ledstudio') {
    if (state.clientReviewMode || !fileId) return;
    try {
      const revisions = await listDriveRevisions(fileId);
      if (typeof window.dialog !== 'function') return;
      const html = revisions.length
        ? revisions.map((r, i) => {
            const dt = r.modifiedTime ? new Date(r.modifiedTime).toLocaleString(state.locale === 'en' ? 'en-GB' : 'vi-VN') : r.id;
            const kb = r.size ? `${Math.max(1, Math.round(Number(r.size) / 1024))} KB` : '';
            return (
              `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:10px">` +
              `<div><strong>${i === 0 ? t16('Bản mới nhất', 'Latest') : `${t16('Phiên bản', 'Revision')} #${revisions.length - i}`}</strong> · <small>${esc16(dt)} ${kb ? '· ' + esc16(kb) : ''}</small></div>` +
              `<button type="button" class="btn small primary" data-drive16-rev="${esc16(r.id)}">${t16('Khôi phục', 'Restore')}</button>` +
              `</div>`
            );
          }).join('')
        : `<div class="info-box">${t16('Chưa có lịch sử phiên bản cho tệp này.', 'No revision history found for this file.')}</div>`;
      window.dialog(
        `${t16('Lịch sử phiên bản Google Drive', 'Google Drive Version History')}: ${esc16(fileName)}`,
        html,
        [{ label: t16('Quay lại', 'Back'), action: () => openCloudProjectsModal() }, { label: t16('Đóng', 'Close') }]
      );
      document.querySelectorAll?.('[data-drive16-rev]')?.forEach((btn) => {
        btn.onclick = async () => {
          const revId = btn.getAttribute('data-drive16-rev');
          const modal = document.getElementById('modal');
          if (modal && typeof modal.close === 'function') modal.close();
          await restoreDriveRevision(fileId, revId, fileName);
        };
      });
    } catch (err) {
      window.toast?.(t16('Không tải được lịch sử phiên bản: ', 'Could not load revision history: ') + (err?.message || err));
    }
  }

  async function loadDriveProject(fileId, fileName = 'drive.ledstudio') {
    if (state.clientReviewMode || !fileId) return false;
    try {
      setBusy16(true, t16('Đang tải dự án từ Google Drive...', 'Downloading project from Google Drive...'));
      const res = await driveFetch(`${DRIVE_FILES}/${encodeURIComponent(fileId)}?alt=media`);
      const payload = await res.json();
      const applyFn = STUDIO.applyProjectData142 || window.applyProjectData142;
      if (typeof applyFn !== 'function') {
        throw new Error(t16('Bộ nạp dự án V15.1 chưa sẵn sàng.', 'V15.1 project loader is not ready.'));
      }
      await applyFn(payload, fileName);
      state.driveFileId = fileId;
      state.driveModelName = payload?.model?.name || null;
      state.driveStage = currentStage();
      state.currentProjectTitle = String(fileName).replace(/\.ledstudio$/i, '');
      state.lastSavedProjectId = null; // bản chụp link duyệt thuộc dự án trước
      window.toast?.(t16(`Đã mở từ Google Drive: ${state.currentProjectTitle}`, `Opened from Google Drive: ${state.currentProjectTitle}`));
      return true;
    } catch (err) {
      window.toast?.(t16('Lỗi mở dự án Google Drive: ', 'Failed to open Google Drive project: ') + (err?.message || err));
      return false;
    } finally {
      setBusy16(false);
    }
  }

  // Dự án cũ đã lưu trên máy chủ Alpha Studio trước khi chuyển sang Drive (chỉ để mở lại).
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
      // Bản lưu cũ chỉ để mở: link duyệt sau đó tạo bản chụp mới, không ghi đè bản cũ.
      state.lastSavedProjectId = null;
      state.driveFileId = null; // lần “Lưu Drive” sau tạo file mới cho dự án cũ này
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
      // Drive lỗi (chưa cấu hình / từ chối quyền) vẫn phải mở được bản lưu cũ trên Alpha.
      let driveErr = null;
      const files = await listDriveProjects().catch((err) => { driveErr = err; return []; });
      const legacy = state.token ? await listCloudProjects().catch(() => []) : [];
      if (driveErr && !legacy.length) throw driveErr;
      if (typeof window.dialog !== 'function') return;
      const row = (name, sub, attr, id, revId = null) =>
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:10px">` +
        `<div><strong>${esc16(name)}</strong><br><small>${esc16(sub)}</small></div>` +
        `<div style="display:flex;gap:6px;align-items:center">` +
        (revId ? `<button type="button" class="btn small" data-drive16-revisions="${esc16(revId)}" title="${t16('Xem lịch sử phiên bản trên Google Drive', 'View Google Drive version history')}">${t16('Lịch sử', 'History')}</button>` : '') +
        `<button type="button" class="btn small primary" ${attr}="${esc16(id)}">${t16('Mở dự án', 'Open')}</button>` +
        `</div></div>`;
      const lightsLabel = t16('Đèn', 'Lights');
      const driveHtml = files.length
        ? files.map((f) => row(
            f.name,
            `${Number(f.appProperties?.ledCount || 0)} LED · ${Number(f.appProperties?.lightCount || 0)} ${lightsLabel} · ` +
              new Date(f.modifiedTime).toLocaleString(state.locale === 'en' ? 'en-GB' : 'vi-VN'),
            'data-drive16-load',
            f.id,
            f.id
          )).join('')
        : `<div class="info-box">${driveErr
            ? esc16(t16('Không mở được Google Drive: ', 'Could not open Google Drive: ') + (driveErr.message || driveErr))
            : t16('Bạn chưa có dự án nào trên Google Drive.', 'You have no projects on Google Drive yet.')}</div>`;
      const legacyHtml = legacy.length
        ? `<p><strong>${t16('Bản lưu cũ trên Alpha Studio (chỉ mở lại)', 'Older saves on Alpha Studio (open only)')}</strong></p>` +
          legacy.map((p) => row(
            p.title,
            `${Number(p.stageSummary?.ledCount || 0)} LED · ${Number(p.stageSummary?.lightCount || 0)} ${lightsLabel}`,
            'data-cloud16-load',
            p._id
          )).join('')
        : '';
      window.dialog(
        t16('Dự án Google Drive của tôi', 'My Google Drive projects'),
        driveHtml + legacyHtml,
        [{ label: t16('Đóng', 'Close') }]
      );
      const closeModal = () => {
        const modal = document.getElementById('modal');
        if (modal && typeof modal.close === 'function') modal.close();
      };
      document.querySelectorAll?.('[data-drive16-load]')?.forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-drive16-load');
          closeModal();
          await loadDriveProject(id, files.find((f) => f.id === id)?.name);
        };
      });
      document.querySelectorAll?.('[data-drive16-revisions]')?.forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-drive16-revisions');
          closeModal();
          await openDriveRevisionsModal(id, files.find((f) => f.id === id)?.name || 'drive.ledstudio');
        };
      });
      document.querySelectorAll?.('[data-cloud16-load]')?.forEach((btn) => {
        btn.onclick = async () => {
          closeModal();
          await loadCloudProject(btn.getAttribute('data-cloud16-load'));
        };
      });
    } catch (err) {
      window.toast?.(t16('Không mở được danh sách Google Drive: ', 'Could not open Google Drive list: ') + (err?.message || err));
    }
  }

  // Link duyệt cho khách: tải bản chụp hiện tại thẳng lên B2 qua URL ký sẵn (không đi qua body JSON của API).
  async function uploadShareSnapshot() {
    const payload = await serializeCurrentStage();
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const isUpdate = Boolean(state.lastSavedProjectId) && state.shareStage === currentStage();
    const res = await fetch(
      isUpdate ? apiUrl(`/projects/${encodeURIComponent(state.lastSavedProjectId)}`) : apiUrl('/projects'),
      {
        method: isUpdate ? 'PUT' : 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          title: projectTitleOf(payload),
          fileSize: blob.size,
          stageSummary: stageSummaryOf(payload),
          requestUploadUrl: true
        })
      }
    );
    if (isUpdate && res.status === 404) {
      state.lastSavedProjectId = null; // bản chụp cũ đã bị xoá: tạo bản mới
      return uploadShareSnapshot();
    }
    const json = await res.json().catch(() => ({}));
    const uploadUrl = json?.data?.uploadInfo?.presignedUrl;
    if (!res.ok || !json.success || !json.data?.project?._id || !uploadUrl) {
      throw new Error(json?.message || t16('Không tạo được bản chụp sân khấu để chia sẻ.', 'Could not create a stage snapshot for sharing.'));
    }
    const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: blob });
    if (!put.ok) throw new Error(t16('Tải bản chụp lên kho lưu trữ thất bại', 'Snapshot upload to storage failed') + ` (HTTP ${put.status})`);
    state.lastSavedProjectId = json.data.project._id;
    state.shareStage = currentStage();
    return state.lastSavedProjectId;
  }

  async function shareClientReviewLink(explicitProjectId = null, options = {}) {
    if (state.clientReviewMode) return null;
    try {
      if (!state.token) throw new Error(t16('Vui lòng đăng nhập trước.', 'Please sign in first.'));
      setBusy16(true, t16('Đang tải bản chụp sân khấu để chia sẻ...', 'Uploading stage snapshot for sharing...'));
      const targetId = explicitProjectId || await uploadShareSnapshot();
      const expiresInHours = Math.max(1, Math.min(720, Number(options?.expiresInHours) || 168));
      const password = String(options?.password || '').trim();
      const res = await fetch(apiUrl(`/projects/${encodeURIComponent(targetId)}/share`), {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          enabled: true,
          expiresInHours,
          ...(password ? { password } : {})
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.shareToken) {
        throw new Error(json?.message || t16('Không tạo được link chia sẻ.', 'Failed to create share link.'));
      }
      const shareUrl = `${window.location.origin}/studio/led-studio?share=${encodeURIComponent(json.data.shareToken)}`;
      await navigator.clipboard?.writeText(shareUrl).catch(() => {});
      const daysLabel = expiresInHours >= 24 ? `${Math.round(expiresInHours / 24)} ${t16('ngày', 'days')}` : `${expiresInHours}h`;
      window.toast?.(
        t16(
          `Đã tạo & sao chép link duyệt 3D (${daysLabel}${password ? ' · Có mật khẩu' : ''}) vào Clipboard.`,
          `Created & copied 3D Client Review link (${daysLabel}${password ? ' · Password protected' : ''}) to Clipboard.`
        )
      );
      return shareUrl;
    } catch (err) {
      window.toast?.(t16('Không thể tạo link chia sẻ: ', 'Could not create share link: ') + (err?.message || err));
      return null;
    } finally {
      setBusy16(false);
    }
  }

  function openShareLinkDialog() {
    if (state.clientReviewMode || typeof window.dialog !== 'function') return;
    const html =
      `<div class="info-box" style="display:grid;gap:10px">` +
      `<label style="display:grid;gap:4px"><strong>${t16('Thời hạn hiệu lực Link duyệt 3D', '3D Review Link Expiry')}</strong>` +
      `<select id="share16ExpirySelect" style="padding:6px;border-radius:6px;background:rgba(15,23,42,.9);color:#e2e8f0;border:1px solid rgba(148,163,184,.3)">` +
      `<option value="24">${t16('24 giờ (1 ngày)', '24 hours (1 day)')}</option>` +
      `<option value="72">${t16('72 giờ (3 ngày)', '72 hours (3 days)')}</option>` +
      `<option value="168" selected>${t16('7 ngày (Mặc định)', '7 days (Default)')}</option>` +
      `<option value="720">${t16('30 ngày (Gói Pro / Mở khoá dự án)', '30 days (Pro / Unlocked Project)')}</option>` +
      `</select></label>` +
      `<label style="display:grid;gap:4px"><strong>${t16('Mật khẩu bảo vệ (Tuỳ chọn — Gói Pro / Mở khoá dự án)', 'Password Protection (Optional — Pro / Unlocked Project)')}</strong>` +
      `<input id="share16PasswordInput" type="password" class="search" placeholder="${t16('Để trống nếu muốn mở công khai không cần mật khẩu', 'Leave blank for public access without password')}"></label>` +
      `<div id="share16ResultBox" class="info-box" style="display:none;word-break:break-all"></div>` +
      `<button type="button" class="btn primary" id="share16CreateBtn">${t16('Tạo & Sao chép Link duyệt 3D', 'Create & Copy 3D Review Link')}</button>` +
      `</div>`;
    window.dialog(
      t16('Chia sẻ Link Duyệt Sân Khấu 3D', 'Share 3D Stage Client Review Link'),
      html,
      [{ label: t16('Đóng', 'Close') }]
    );
    const createBtn = document.getElementById('share16CreateBtn');
    if (createBtn) {
      createBtn.onclick = async () => {
        const expiresInHours = Number(document.getElementById('share16ExpirySelect')?.value || 168);
        const password = String(document.getElementById('share16PasswordInput')?.value || '').trim();
        const url = await shareClientReviewLink(null, { expiresInHours, password });
        const box = document.getElementById('share16ResultBox');
        if (url && box) {
          box.style.display = 'block';
          box.innerHTML = `<strong>${t16('Đã sao chép vào Clipboard:', 'Copied to Clipboard:')}</strong><br><a href="${esc16(url)}" target="_blank" rel="noopener" style="color:#38bdf8">${esc16(url)}</a>`;
        }
      };
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

  // Interface settings: UI size (S/M/L) + theme + language, in a native popover.
  // Size is pre-applied in index.html <head> from localStorage['ledstudio-ui-size'].
  function applyUiSize16(size) {
    const next = size === 's' || size === 'l' ? size : 'm';
    if (next === 'm') delete document.documentElement.dataset.uiSize;
    else document.documentElement.dataset.uiSize = next;
    try { window.localStorage?.setItem('ledstudio-ui-size', next); } catch { /* ignore */ }
  }
  function injectUiSettings16(actions) {
    if (document.getElementById('uiSettingsBtn16')) return;
    const btn = document.createElement('button');
    btn.id = 'uiSettingsBtn16';
    btn.type = 'button';
    btn.className = 'icon-btn';
    btn.title = t16('Cài đặt giao diện', 'Interface settings');
    btn.setAttribute('aria-label', btn.title);
    btn.setAttribute('popovertarget', 'uiSettings16');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>';
    const pop = document.createElement('div');
    pop.id = 'uiSettings16';
    pop.className = 'ui-settings';
    pop.setAttribute('popover', '');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', btn.title);
    const seg = (name, label, opts) => `<fieldset class="ui-seg"><legend>${label}</legend>${opts.map(([v, txt]) =>
      `<label><input type="radio" name="${name}" value="${v}"><span>${txt}</span></label>`).join('')}</fieldset>`;
    pop.innerHTML =
      `<h3>${t16('Giao diện', 'Interface')}</h3>` +
      seg('uiSize16', t16('Cỡ chữ', 'Text size'), [['s', t16('Nhỏ', 'Small')], ['m', t16('Vừa', 'Medium')], ['l', t16('Lớn', 'Large')]]) +
      seg('uiTheme16', t16('Màu nền', 'Theme'), [['dark', t16('Tối', 'Dark')], ['light', t16('Sáng', 'Light')]]) +
      seg('uiLang16', t16('Ngôn ngữ', 'Language'), [['vi', 'Tiếng Việt'], ['en', 'English']]);
    const sync = () => {
      const cur = { uiSize16: document.documentElement.dataset.uiSize || 'm', uiTheme16: state.theme === 'light' ? 'light' : 'dark', uiLang16: state.locale === 'en' ? 'en' : 'vi' };
      pop.querySelectorAll('input[type=radio]').forEach((r) => { r.checked = cur[r.name] === r.value; });
    };
    pop.addEventListener('change', (e) => {
      const r = e.target;
      if (r.name === 'uiSize16') applyUiSize16(r.value);
      if (r.name === 'uiTheme16') applyTheme(r.value);
      if (r.name === 'uiLang16') applyLocale(r.value);
    });
    pop.addEventListener('toggle', (e) => { btn.setAttribute('aria-expanded', String(e.newState === 'open')); if (e.newState === 'open') sync(); });
    // Global letter shortcuts must not fire while a radio has focus.
    pop.addEventListener('keydown', (e) => { if (e.key !== 'Escape') e.stopPropagation(); });
    btn.setAttribute('aria-expanded', 'false');
    const anchor = document.getElementById('langToggleBtn16') || document.getElementById('themeToggleBtn');
    if (anchor && anchor.parentNode === actions) anchor.after(btn); else actions.append(btn);
    document.body.append(pop);
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
    injectUiSettings16(actions);

    const saveBtn = document.createElement('button');
    saveBtn.id = 'cloud16SaveBtn';
    saveBtn.className = 'btn small';
    saveBtn.textContent = t16('Lưu Drive', 'Save to Drive');
    saveBtn.onclick = () => driveSaveProject();

    const openBtn = document.createElement('button');
    openBtn.id = 'cloud16OpenBtn';
    openBtn.className = 'btn small';
    openBtn.textContent = t16('Mở Drive', 'Open Drive');
    openBtn.onclick = () => openCloudProjectsModal();

    const presetsBtn = document.createElement('button');
    presetsBtn.id = 'cloud16PresetsBtn';
    presetsBtn.className = 'btn small';
    presetsBtn.textContent = t16('Kho Preset', 'Presets');
    presetsBtn.onclick = () => openPresetsModal();

    const shareBtn = document.createElement('button');
    shareBtn.id = 'cloud16ShareBtn';
    shareBtn.className = 'btn small';
    shareBtn.textContent = t16('Link duyệt 3D', '3D Review Link');
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

    if (msg.locale || msg.lang) {
      applyLocale((msg.locale || msg.lang) === 'en' ? 'en' : 'vi');
    }
    if (msg.apiBaseUrl) {
      state.apiBaseUrl = normalizeApiBaseUrl(msg.apiBaseUrl);
    }
    if (typeof msg.googleClientId === 'string' && msg.googleClientId.trim()) {
      state.googleClientId = msg.googleClientId.trim();
    }
    if ('token' in msg || 'user' in msg) {
      const prevToken = state.token || null;
      const prevUserId = state.user?._id || state.user?.id || null;
      const nextToken = msg.token ? String(msg.token) : null;
      const nextUser = msg.user && typeof msg.user === 'object' ? msg.user : null;
      const nextUserId = nextUser?._id || nextUser?.id || null;
      if (!nextToken || prevUserId !== nextUserId) {
        state.lastSavedProjectId = null;
        state.currentProjectTitle = null;
        // Đổi/thoát tài khoản Alpha: bỏ quyền Google Drive và file đang gắn của người trước.
        state.driveToken = null;
        state.driveTokenExpiresAt = 0;
        state.driveFileId = null;
        state.driveModelName = null;
      }
      state.token = nextToken;
      state.user = nextUser;
      if (!nextToken || prevToken !== nextToken || prevUserId !== nextUserId) {
        STUDIO.lumi18?.syncAccount18?.();
      }
    }
    if (msg.shareToken) {
      loadSharedProject(String(msg.shareToken));
    }
    return true;
  }

  window.addEventListener('message', handleHostMessage);

  async function loadSharedProject(rawShareToken, providedPassword = '') {
    const shareToken = String(rawShareToken || '').trim();
    if (!shareToken) return false;
    enterClientReviewMode(shareToken);
    document.body.dataset.shareStatus = 'loading';
    state.reviewSharedTitle = null;
    if (providedPassword) state.sharePassword = String(providedPassword);
    setReviewStatus(t16('Đang tải bản xem duyệt 3D...', 'Loading 3D review scene...'));
    try {
      const fetchOpts = state.sharePassword
        ? { credentials: 'include', headers: { 'x-share-password': state.sharePassword } }
        : { credentials: 'include' };
      const res = await fetch(apiUrl(`/share/${encodeURIComponent(shareToken)}`), fetchOpts);
      const json = await res.json().catch(() => ({}));
      if ((res.status === 401 || json?.requiresPassword || json?.data?.requiresPassword) && typeof window.prompt === 'function' && !providedPassword) {
        const entered = window.prompt(t16('Dự án 3D này được bảo vệ bằng mật khẩu. Vui lòng nhập mật khẩu:', 'This 3D project is password-protected. Please enter password:')) || '';
        if (entered.trim()) {
          return await loadSharedProject(shareToken, entered.trim());
        }
      }
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
      state.reviewStatus = json.data?.reviewStatus || 'pending';
      state.reviewBy = json.data?.reviewBy || '';
      state.reviewNote = json.data?.reviewNote || '';
      state.reviewComments = Array.isArray(json.data?.reviewComments) ? json.data.reviewComments : [];
      setReviewStatus(
        t16(`Đang xem: ${state.reviewSharedTitle}`, `Viewing: ${state.reviewSharedTitle}`)
      );
      updateReviewBarSummary();
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
    driveSaveProject,
    listDriveProjects,
    listDriveRevisions,
    restoreDriveRevision,
    openDriveRevisionsModal,
    loadDriveProject,
    uploadShareSnapshot,
    saveCloudProject: driveSaveProject,
    listCloudProjects,
    loadCloudProject,
    openCloudProjectsModal,
    shareClientReviewLink,
    openShareLinkDialog,
    createClientShareLink: shareClientReviewLink,
    loadSharedProject,
    submitReviewComment,
    submitReviewDecision,
    openReviewCommentsModal,
    openReviewDecisionModal,
    loadCloudPreset,
    publishCloudPreset,
    openPresetsModal
  };
})();
