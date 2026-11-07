/* ============================================================================
   V18.0 LUMISTAGE COMMERCIAL SUITE — AI STAGE ASSISTANT, 6 VN TEMPLATES,
   AUTO BOM, QUOTATION (GROUPLIFE), CAD DXF IMPORT/EXPORT & CREDIT BILLING
   ============================================================================ */
(function () {
  'use strict';
  try {
    const S = (window.STUDIO = window.STUDIO || {});
    const $ = (id) => document.getElementById(id);
    const esc18 = (v) =>
      String(v ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[ch]));

    const LUMI_BRAND = {
      name: 'LumiStage',
      tagline: 'by Alpha Studio · GROUPLIFE',
      legalEntity: 'CÔNG TY TNHH MTV GROUPLIFE',
      watermarkText: 'LUMISTAGE FREE · GROUPLIFE · LUMISTAGE.VN',
      taxNote: 'KCT (Phần mềm & dịch vụ thiết kế công nghệ không chịu thuế GTGT)',
      creditRateVnd: 100,
      aiPricing: {
        inputCreditsPer1M: 25,   // 2.500 VNĐ / 1M input tokens (= 1/3 giá Gemini Flash chính thức)
        outputCreditsPer1M: 210, // 21.000 VNĐ / 1M output tokens (= 1/3 giá Gemini Flash chính thức)
        efforts: [
          { id: 'low', label: 'Flash 3.8 · Low (Nhanh, tiết kiệm)', model: 'gemini-3.8-flash-low' },
          { id: 'medium', label: 'Flash 3.8 · Medium (Cân bằng — Khuyên dùng)', model: 'gemini-3.8-flash-medium' },
          { id: 'high', label: 'Flash 3.8 · High (Suy luận sâu)', model: 'gemini-3.8-flash-high' }
        ]
      }
    };

    const BYOK_STORAGE_KEY = 'lumistage_byok_config_v18';
    function loadByokConfig() {
      try {
        const raw = window.localStorage?.getItem(BYOK_STORAGE_KEY);
        if (!raw) return { enabled: false, provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash', baseUrl: '' };
        const parsed = JSON.parse(raw);
        return {
          enabled: Boolean(parsed?.enabled),
          provider: String(parsed?.provider || 'gemini'),
          apiKey: String(parsed?.apiKey || ''),
          model: String(parsed?.model || 'gemini-2.5-flash'),
          baseUrl: String(parsed?.baseUrl || '')
        };
      } catch {
        return { enabled: false, provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash', baseUrl: '' };
      }
    }

    function saveByokConfig(cfg) {
      const clean = {
        enabled: Boolean(cfg?.enabled),
        provider: String(cfg?.provider || 'gemini').trim(),
        apiKey: String(cfg?.apiKey || '').trim(),
        model: String(cfg?.model || 'gemini-2.5-flash').trim(),
        baseUrl: String(cfg?.baseUrl || '').trim()
      };
      lumiState.byok = clean;
      try {
        window.localStorage?.setItem(BYOK_STORAGE_KEY, JSON.stringify(clean));
      } catch {
        // ignore storage quota errors
      }
      return clean;
    }

    const TELEMETRY_STORAGE_KEY = 'lumistage_telemetry_optin_v1';

    function loadTelemetryOptIn() {
      try {
        return localStorage.getItem(TELEMETRY_STORAGE_KEY) === '1';
      } catch {
        return false;
      }
    }

    function setTelemetryOptIn(enabled) {
      const flag = Boolean(enabled);
      lumiState.telemetryOptIn = flag;
      try {
        localStorage.setItem(TELEMETRY_STORAGE_KEY, flag ? '1' : '0');
      } catch {
        // ignore storage quota errors
      }
      return flag;
    }

    async function trackLumiEvent(event, meta = {}) {
      if (!lumiState.telemetryOptIn) {
        return { sent: false, reason: 'opt_in_disabled' };
      }
      try {
        const cloud = S.cloud16;
        const url = cloud?.apiUrl ? cloud.apiUrl('/telemetry') : '/api/led-studio/telemetry';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ optIn: true, event, meta })
        });
        const json = await res.json().catch(() => ({}));
        return { sent: Boolean(res.ok && json.recorded), data: json.data || null };
      } catch {
        return { sent: false, reason: 'network_error' };
      }
    }

    const lumiState = {
      lang: (S.cloud16?.state?.locale || document.documentElement?.dataset?.locale) === 'en' ? 'en' : 'vi',
      telemetryOptIn: loadTelemetryOptIn(),
      musicShowCues: [],
      activeCueIndex: -1,
      pendingPreview: null,
      showSafetyLock: false,
      masterBlackout: false,
      _savedLightPowers: null,
      _savedSurfaceBrightness: null,
      dmxBridge: {
        streaming: false,
        protocol: 'artnet', // 'artnet' (UDP 6454) | 'sacn' (UDP 5568)
        host: '127.0.0.1',
        port: 6454,
        wsPort: 9454,
        universe: 0,
        sequence: 1,
        packetsSent: 0,
        lastDmx512: null
      },
      lastSightlineReport: null,
      brandIdentity: {
        brandName: 'GROUPLIFE EVENT',
        primaryColor: '#38bdf8',
        accentColor: '#f59e0b'
      },
      brand: LUMI_BRAND,
      tier: 'free',
      isProActive: false,
      projectUnlocked: false,
      singleExportPasses: 0,
      balanceCredits: 0,
      balanceReady: false,
      freeAiCreditsRemaining: 50,
      effort: 'medium',
      byok: loadByokConfig(),
      lastAiReply: null,
      lastAiUsage: null,
      chat18: [],
      quoteConfig: {
        clientName: 'Quý Khách hàng / Đối tác Sự kiện',
        eventName: '',
        eventDate: new Date().toISOString().slice(0, 10),
        rentalDays: 1,
        transportFeeVnd: 3500000,
        setupFeeVnd: 4500000,
        discountPercent: 0,
        vatMode: 'KCT', // 'KCT' | '8' | '10'
        priceOverrides: {}
      }
    };

    if (typeof window.snapshot === 'function' && typeof window.restore === 'function') {
      const priorSnapshot = window.snapshot, priorRestore = window.restore;
      window.snapshot = function () {
        const data = priorSnapshot();
        data.lumi18 = structuredClone({ musicShowCues: lumiState.musicShowCues, activeCueIndex: lumiState.activeCueIndex, brandIdentity: lumiState.brandIdentity, clientName: lumiState.quoteConfig.clientName, seqCues: window.seq?.cues });
        return data;
      };
      window.restore = function (data) {
        if (data.lumi18) {
          const saved = structuredClone(data.lumi18);
          Object.assign(lumiState, { musicShowCues: saved.musicShowCues, activeCueIndex: saved.activeCueIndex, brandIdentity: saved.brandIdentity });
          lumiState.quoteConfig.clientName = saved.clientName;
          if (window.seq && Array.isArray(saved.seqCues)) window.seq.cues = saved.seqCues;
        }
        return priorRestore(data);
      };
    }

    function lastUndo18() { return (S.state || window.state)?.history?.at(-1); }

    function singleUndo18(action) {
      const state = S.state || window.state;
      const history = state?.history?.slice();
      const prior = lastUndo18();
      const before = history && window.snapshot?.();
      try { return action(); }
      finally {
        if (before && lastUndo18() !== prior) {
          state.history.splice(0, state.history.length, ...history.slice(-34), before);
          window.historyButtons?.();
        }
      }
    }

    const LUMI_I18N = {
      vi: {
        templatesBtn: '6 Mẫu VN',
        aiBtn: 'AI Sân khấu',
        bomBtn: 'BOM & Báo giá',
        liveShowBtn: 'Chạy Show',
        billingBtn: 'Credit & Pro',
        billingProBtn: 'PRO · ',
        lockBlocked: 'Đang bật Khóa An toàn Chạy Show — hãy mở khóa trước khi sửa bố cục sân khấu.',
        previewReady: 'Đã tạo bản xem trước phương án AI. Bấm "Áp dụng" để chốt hoặc "Hoàn tác" để hủy.',
        previewCommitted: 'Đã xác nhận áp dụng phương án sân khấu AI.',
        previewReverted: 'Đã hủy bản xem trước và khôi phục bố cục trước đó.'
      },
      en: {
        templatesBtn: '6 Stage Templates',
        aiBtn: 'Stage AI',
        bomBtn: 'BOM & Quote',
        liveShowBtn: 'Live Show',
        billingBtn: 'Credits & Pro',
        billingProBtn: 'PRO · ',
        lockBlocked: 'Safe Show Lock (E4) is active — unlock before modifying stage layout.',
        previewReady: 'AI Stage Preview active. Click "Apply" to commit or "Revert" to undo.',
        previewCommitted: 'AI stage layout committed.',
        previewReverted: 'AI preview reverted to previous stage state.'
      }
    };

    function t18(key) {
      if (typeof window.tr === 'function') return window.tr(LUMI_I18N.vi[key] || key, LUMI_I18N.en[key] || LUMI_I18N.vi[key] || key);
      const dict = LUMI_I18N[lumiState.lang] || LUMI_I18N.vi;
      return dict[key] || LUMI_I18N.vi[key] || key;
    }

    function setLumiLanguage(lang) {
      lumiState.lang = String(lang || '').toLowerCase() === 'en' ? 'en' : 'vi';
      if (S.cloud16?.applyLocale) return S.cloud16.applyLocale(lumiState.lang);
      if (document.documentElement?.dataset) {
        document.documentElement.dataset.locale = lumiState.lang;
      }
      updateTopbarBadge18();
      return lumiState.lang;
    }

    // =========================================================================
    // C3 — 6 MẪU SÂN KHẤU SỰ KIỆN VIỆT NAM (THAM SỐ HOÁ)
    // =========================================================================
    const VN_STAGE_TEMPLATES = {
      conference: {
        id: 'conference',
        name: 'Hội nghị Doanh nghiệp / Đại hội Cổ đông',
        category: 'Corporate / Conference',
        summary: 'Sân khấu 12×6m, 1 LED chính P3.91 (7×3.5m) + 2 LED cánh (2.5×3.5m), bục phát biểu VIP, bàn đại biểu IBM, 16 đèn Par/Beam.',
        widthM: 12,
        depthM: 6,
        heightM: 0.8,
        pitchMm: 3.91,
        style: 'cool',
        screens: [
          { name: 'LED_MAIN_CENTER', pos: [0, 2.65, -2.2], wM: 7.0, hM: 3.5, yawDeg: 0, pitchMm: 3.91 },
          { name: 'LED_WING_LEFT', pos: [-5.1, 2.65, -1.7], wM: 2.5, hM: 3.5, yawDeg: 12, pitchMm: 3.91 },
          { name: 'LED_WING_RIGHT', pos: [5.1, 2.65, -1.7], wM: 2.5, hM: 3.5, yawDeg: -12, pitchMm: 3.91 }
        ],
        truss: 'portal',
        lightCount: 16,
        props: [
          { kind: 'vip_podium', pos: [-2.4, 0.8, 0.8] },
          { kind: 'conference_ibm_table', pos: [-2.5, 0, 3.8] },
          { kind: 'conference_ibm_table', pos: [2.5, 0, 3.8] },
          { kind: 'stage_monitor_wedge', pos: [-1.5, 0.8, 1.8] },
          { kind: 'stage_monitor_wedge', pos: [1.5, 0.8, 1.8] },
          { kind: 'decor_palm_planter', pos: [-5.6, 0.8, 1.5] },
          { kind: 'decor_palm_planter', pos: [5.6, 0.8, 1.5] }
        ]
      },
      wedding: {
        id: 'wedding',
        name: 'Tiệc cưới Sang trọng',
        category: 'Wedding / Romance',
        summary: 'Sân khấu 14×7m kèm đường dẫn Catwalk, LED chính 8×4m + 4 cột LED Totem, cổng vòm hoa/backdrop, bàn tiệc tròn Gala, pháo điện lạnh.',
        widthM: 14,
        depthM: 7,
        heightM: 0.7,
        pitchMm: 2.97,
        style: 'warm',
        screens: [
          { name: 'LED_WEDDING_MAIN', pos: [0, 2.8, -2.5], wM: 8.0, hM: 4.0, yawDeg: 0, pitchMm: 2.97 },
          { name: 'LED_TOTEM_L1', pos: [-4.8, 2.5, -2.0], wM: 1.0, hM: 3.5, yawDeg: 10, pitchMm: 2.97 },
          { name: 'LED_TOTEM_R1', pos: [4.8, 2.5, -2.0], wM: 1.0, hM: 3.5, yawDeg: -10, pitchMm: 2.97 },
          { name: 'LED_TOTEM_L2', pos: [-6.2, 2.3, -1.4], wM: 1.0, hM: 3.0, yawDeg: 16, pitchMm: 3.91 },
          { name: 'LED_TOTEM_R2', pos: [6.2, 2.3, -1.4], wM: 1.0, hM: 3.0, yawDeg: -16, pitchMm: 3.91 }
        ],
        truss: 'arch',
        lightCount: 20,
        props: [
          { kind: 'backdrop_arch', pos: [0, 0.7, -1.2] },
          { kind: 'catwalk_t', pos: [0, 0, 4.2] },
          { kind: 'cold_spark_fountain', pos: [-2.2, 0.7, 1.8] },
          { kind: 'cold_spark_fountain', pos: [2.2, 0.7, 1.8] },
          { kind: 'gala_round_table', pos: [-3.6, 0, 4.5] },
          { kind: 'gala_round_table', pos: [3.6, 0, 4.5] }
        ]
      },
      concert: {
        id: 'concert',
        name: 'Đại nhạc hội EDM',
        category: 'Concert / EDM',
        summary: 'Sân khấu đại cảnh 24×12m, LED chính 14×6m + 4 cánh LED nghiêng + Header, bàn DJ trung tâm, Line Array, 32 đèn Moving Head Beam.',
        widthM: 24,
        depthM: 12,
        heightM: 1.2,
        pitchMm: 3.91,
        style: 'concert',
        screens: [
          { name: 'LED_EDM_MAIN', pos: [0, 4.3, -3.8], wM: 14.0, hM: 6.0, yawDeg: 0, pitchMm: 3.91 },
          { name: 'LED_WING_L1', pos: [-8.6, 4.1, -3.0], wM: 2.5, hM: 5.5, yawDeg: 18, pitchMm: 3.91 },
          { name: 'LED_WING_R1', pos: [8.6, 4.1, -3.0], wM: 2.5, hM: 5.5, yawDeg: -18, pitchMm: 3.91 },
          { name: 'LED_WING_L2', pos: [-11.2, 3.8, -2.0], wM: 2.0, hM: 5.0, yawDeg: 28, pitchMm: 4.81 },
          { name: 'LED_WING_R2', pos: [11.2, 3.8, -2.0], wM: 2.0, hM: 5.0, yawDeg: -28, pitchMm: 4.81 },
          { name: 'LED_DJ_FRONT', pos: [0, 1.7, 0.6], wM: 3.0, hM: 1.0, yawDeg: 0, pitchMm: 2.97 }
        ],
        truss: 'box',
        lightCount: 32,
        props: [
          { kind: 'dj_booth', pos: [0, 1.2, 0.2] },
          { kind: 'line_array', pos: [-10.5, 5.2, 0.5] },
          { kind: 'line_array', pos: [10.5, 5.2, 0.5] },
          { kind: 'sub_stack', pos: [-9.5, 0, 2.8] },
          { kind: 'sub_stack', pos: [9.5, 0, 2.8] },
          { kind: 'co2_cannon', pos: [-4.5, 1.2, 2.2] },
          { kind: 'co2_cannon', pos: [-1.5, 1.2, 2.2] },
          { kind: 'co2_cannon', pos: [1.5, 1.2, 2.2] },
          { kind: 'co2_cannon', pos: [4.5, 1.2, 2.2] },
          { kind: 'foh_control_booth', pos: [0, 0, 9.5] }
        ]
      },
      grand_opening: {
        id: 'grand_opening',
        name: 'Lễ Khai trương / Khánh thành / Ra mắt SP',
        category: 'Activation / Launch',
        summary: 'Sân khấu 10×5m gọn đẹp, LED chính 6×3.5m + 2 Standee LED 1×2.5m, cổng LED Arch, bục VIP, pháo điện Kim tuyến.',
        widthM: 10,
        depthM: 5,
        heightM: 0.6,
        pitchMm: 2.97,
        style: 'warm',
        screens: [
          { name: 'LED_LAUNCH_MAIN', pos: [0, 2.45, -1.8], wM: 6.0, hM: 3.5, yawDeg: 0, pitchMm: 2.97 },
          { name: 'LED_STANDEE_L', pos: [-3.9, 1.95, -1.3], wM: 1.0, hM: 2.5, yawDeg: 10, pitchMm: 2.97 },
          { name: 'LED_STANDEE_R', pos: [3.9, 1.95, -1.3], wM: 1.0, hM: 2.5, yawDeg: -10, pitchMm: 2.97 }
        ],
        truss: 'portal',
        lightCount: 12,
        props: [
          { kind: 'led_arch', pos: [0, 0.6, -1.5] },
          { kind: 'vip_podium', pos: [-1.8, 0.6, 0.6] },
          { kind: 'cold_spark_fountain', pos: [-2.5, 0.6, 1.5] },
          { kind: 'cold_spark_fountain', pos: [2.5, 0.6, 1.5] },
          { kind: 'decor_palm_planter', pos: [-4.5, 0.6, 1.2] },
          { kind: 'decor_palm_planter', pos: [4.5, 0.6, 1.2] }
        ]
      },
      gala_dinner: {
        id: 'gala_dinner',
        name: 'Gala Dinner / Year End Party (YEP)',
        category: 'Gala / YEP',
        summary: 'Sân khấu 16×8m, LED chính 9×4.5m + 2 cánh LED 2.5×4m, vòng LED Kinetic trần, 4 bàn tiệc Gala tròn, 24 đèn Beam & Katana.',
        widthM: 16,
        depthM: 8,
        heightM: 0.9,
        pitchMm: 3.91,
        style: 'concert',
        screens: [
          { name: 'LED_GALA_MAIN', pos: [0, 3.25, -2.8], wM: 9.0, hM: 4.5, yawDeg: 0, pitchMm: 3.91 },
          { name: 'LED_GALA_WING_L', pos: [-6.1, 3.0, -2.1], wM: 2.5, hM: 4.0, yawDeg: 15, pitchMm: 3.91 },
          { name: 'LED_GALA_WING_R', pos: [6.1, 3.0, -2.1], wM: 2.5, hM: 4.0, yawDeg: -15, pitchMm: 3.91 }
        ],
        truss: 'box',
        lightCount: 24,
        props: [
          { kind: 'kinetic_ring', pos: [0, 5.2, 0] },
          { kind: 'vip_podium', pos: [-3.2, 0.9, 1.0] },
          { kind: 'gala_round_table', pos: [-4.2, 0, 4.6] },
          { kind: 'gala_round_table', pos: [-1.4, 0, 5.0] },
          { kind: 'gala_round_table', pos: [1.4, 0, 5.0] },
          { kind: 'gala_round_table', pos: [4.2, 0, 4.6] },
          { kind: 'cold_spark_fountain', pos: [-3.0, 0.9, 2.2] },
          { kind: 'cold_spark_fountain', pos: [3.0, 0.9, 2.2] }
        ]
      },
      outdoor_festival: {
        id: 'outdoor_festival',
        name: 'Lễ hội Ngoài trời / Beerfest / Countdown',
        category: 'Outdoor / Festival',
        summary: 'Sân khấu 20×10m mái vòm Truss chống gió, LED chính 12×5m P4.81 Outdoor, rào chắn Mojo, tháp FOH, Line Array & Sub.',
        widthM: 20,
        depthM: 10,
        heightM: 1.1,
        pitchMm: 4.81,
        style: 'concert',
        screens: [
          { name: 'LED_OUTDOOR_MAIN', pos: [0, 3.7, -3.2], wM: 12.0, hM: 5.0, yawDeg: 0, pitchMm: 4.81 },
          { name: 'LED_OUTDOOR_WING_L', pos: [-7.8, 3.45, -2.4], wM: 2.5, hM: 4.5, yawDeg: 16, pitchMm: 4.81 },
          { name: 'LED_OUTDOOR_WING_R', pos: [7.8, 3.45, -2.4], wM: 2.5, hM: 4.5, yawDeg: -16, pitchMm: 4.81 },
          { name: 'LED_HEADER_BANNER', pos: [0, 6.6, -3.0], wM: 12.0, hM: 0.8, yawDeg: 0, pitchMm: 4.81 }
        ],
        truss: 'box',
        lightCount: 28,
        props: [
          { kind: 'truss_arch', pos: [0, 1.1, -1.8] },
          { kind: 'line_array', pos: [-8.8, 4.8, 0.4] },
          { kind: 'line_array', pos: [8.8, 4.8, 0.4] },
          { kind: 'sub_stack', pos: [-7.8, 0, 2.6] },
          { kind: 'sub_stack', pos: [7.8, 0, 2.6] },
          { kind: 'crowd_barrier', pos: [-3.5, 0, 4.5] },
          { kind: 'crowd_barrier', pos: [0, 0, 4.5] },
          { kind: 'crowd_barrier', pos: [3.5, 0, 4.5] },
          { kind: 'foh_control_booth', pos: [0, 0, 8.5] },
          { kind: 'haze_machine_pro', pos: [-6.0, 1.1, -1.5] },
          { kind: 'haze_machine_pro', pos: [6.0, 1.1, -1.5] }
        ]
      }
    };

    function getEngine() {
      return S.engine || window.engine;
    }

    function computePixelDim(meters, pitchMm = 3.91) {
      const p = Math.max(1.2, Math.min(16, Number(pitchMm) || 3.91));
      const rawPx = Math.round((Math.max(0.5, Number(meters) || 1) * 1000) / p);
      return Math.max(64, Math.min(8192, Math.round(rawPx / 8) * 8));
    }

    function repackSurfacesMaster(eng) {
      if (!eng || !Array.isArray(eng.surfaces)) return;
      let cursorX = 0;
      let maxH = 64;
      for (const s of eng.surfaces) {
        s.x = cursorX;
        s.y = 0;
        cursorX += Number(s.w) || 640;
        maxH = Math.max(maxH, Number(s.h) || 360);
        if (typeof window.updateTest === 'function') window.updateTest(s);
      }
      eng.master = {
        width: Math.max(64, cursorX || 1920),
        height: Math.max(64, maxH || 1080)
      };
    }

    function buildTrussMeshes(widthM, depthM, heightM, maxTopY, mode = 'portal') {
      const meshes = [];
      if (typeof window.barBetween !== 'function') return meshes;
      const halfW = widthM * 0.48;
      const zBack = -depthM * 0.36;
      const zFront = depthM * 0.28;
      const topY = Math.max(heightM + 4.5, maxTopY + 0.55);

      for (const x of [-halfW, halfW]) {
        for (const dx of [-0.16, 0.16]) {
          for (const dz of [-0.16, 0.16]) {
            meshes.push(window.barBetween('Truss vertical', [x + dx, heightM, zBack + dz], [x + dx, topY, zBack + dz], 0.05));
          }
        }
      }
      for (const dy of [-0.16, 0.16]) {
        for (const dz of [-0.16, 0.16]) {
          meshes.push(window.barBetween('Truss crossbar', [-halfW, topY + dy, zBack + dz], [halfW, topY + dy, zBack + dz], 0.05));
        }
      }
      if (mode === 'box' || mode === 'arch') {
        for (const x of [-halfW, halfW]) {
          meshes.push(window.barBetween('Truss front post', [x, heightM, zFront], [x, topY, zFront], 0.05));
          meshes.push(window.barBetween('Truss side beam', [x, topY, zBack], [x, topY, zFront], 0.05));
        }
        meshes.push(window.barBetween('Truss front crossbar', [-halfW, topY, zFront], [halfW, topY, zFront], 0.05));
      }
      return meshes;
    }

    function populateStageLights(eng, count, widthM, depthM, topY, style = 'concert') {
      if (!eng) return;
      const n = Math.max(4, Math.min(128, Math.round(Number(count) || 12)));
      const palette =
        style === 'warm'
          ? ['#ffd09a', '#ffb86b', '#ffe5b4']
          : style === 'cool'
          ? ['#7fc9ff', '#d6eeff', '#38bdf8']
          : ['#5cd6ff', '#be7bff', '#ff8c42', '#38bdf8'];
      eng.lights = Array.from({ length: n }, (_, i) => {
        const u = n > 1 ? i / (n - 1) - 0.5 : 0;
        const row = i % 2;
        const zPos = row === 0 ? -depthM * 0.25 : depthM * 0.18;
        return {
          id: 'light_' + i,
          name: (row === 0 ? 'Beam 230 #' : 'Par/Wash #') + String(i + 1).padStart(2, '0'),
          pos: [+(u * widthM * 0.86).toFixed(2), +(topY - 0.15).toFixed(2), +zPos.toFixed(2)],
          target: [+(u * widthM * (style === 'concert' ? -0.42 : 0.55)).toFixed(2), 0.3, +(depthM * 0.48).toFixed(2)],
          color: palette[i % palette.length],
          power: style === 'warm' ? 3.4 : 4.6,
          angle: row === 0 ? 12 : 24,
          enabled: true,
          sweep: style === 'concert' || row === 0,
          speed: 0.35,
          phase: +(i * 0.35).toFixed(2),
          fx: 'steady',
          fxDepth: 0.55,
          fxSpeed: 2.2,
          boost: 1,
          oflProfileId: row === 0 ? 'vn-stage/beam-230-7r' : 'vn-stage/par-led-54x3w'
        };
      });
      if (window.state) window.state.selectedLight = eng.lights[0]?.id || null;
      eng.rebuildFixtures?.();
    }

    function applyStageTemplate(templateId, overrides = {}) {
      if (lumiState.showSafetyLock) {
        window.toast?.(t18('lockBlocked'));
        return false;
      }
      const tpl = VN_STAGE_TEMPLATES[templateId];
      if (!tpl) {
        window.toast?.(tr18("Không tìm thấy mẫu sân khấu: ", "Stage template not found: ") + templateId);
        return false;
      }
      const eng = getEngine();
      if (!eng || typeof window.boxMesh !== 'function' || typeof window.quadMesh !== 'function') return false;

      window.checkpoint?.();
      const widthM = Math.max(4, Math.min(80, Number(overrides.widthM) || tpl.widthM));
      const depthM = Math.max(3, Math.min(50, Number(overrides.depthM) || tpl.depthM));
      const heightM = Math.max(0.2, Math.min(4, Number(overrides.heightM) || tpl.heightM));
      const defaultPitch = Math.max(1.2, Math.min(16, Number(overrides.pitchMm) || tpl.pitchMm || 3.91));
      const scaleX = widthM / tpl.widthM;
      const scaleZ = depthM / tpl.depthM;

      const meshes = [];
      const createdScreens = [];
      meshes.push(window.boxMesh('Stage platform', [0, heightM / 2, 0], [widthM, heightM, depthM], [0.34, 0.37, 0.44, 1]));
      for (let i = 0; i < 3; i++) {
        meshes.push(
          window.boxMesh(
            'Front step ' + (i + 1),
            [0, (heightM * (i + 1)) / 6, depthM / 2 + 0.55 - i * 0.18],
            [Math.min(6, widthM * 0.38), heightM / 3, 0.9 - i * 0.18],
            [0.42, 0.45, 0.52, 1]
          )
        );
      }

      let maxTopY = heightM + 4.5;
      for (const scr of tpl.screens) {
        const wM = +(scr.wM * scaleX).toFixed(2);
        const hM = +scr.hM.toFixed(2);
        const pitch = Number(overrides.pitchMm) || scr.pitchMm || defaultPitch;
        const cx = +(scr.pos[0] * scaleX).toFixed(2);
        const cy = +(heightM + hM / 2 + Math.max(0.15, scr.pos[1] - tpl.heightM - scr.hM / 2)).toFixed(2);
        const cz = +(scr.pos[2] * scaleZ).toFixed(2);
        maxTopY = Math.max(maxTopY, cy + hM / 2);

        const q = window.quadMesh(
          scr.name,
          [
            [-wM / 2, hM / 2, 0],
            [wM / 2, hM / 2, 0],
            [wM / 2, -hM / 2, 0],
            [-wM / 2, -hM / 2, 0]
          ],
          { color: [0.04, 0.05, 0.08, 1] }
        );
        const ry = ((scr.yawDeg || 0) * Math.PI) / 180;
        const mat = window.M.mm(window.M.translate([cx, cy, cz]), window.M.rotate([0, 1, 0], ry));
        window.transformMesh(q, mat);
        meshes.push(q);

        const frame = window.boxMesh(scr.name + '_Frame', [0, 0, -0.09], [wM + 0.1, hM + 0.1, 0.16], [0.12, 0.13, 0.17, 1]);
        window.transformMesh(frame, mat);
        meshes.push(frame);

        createdScreens.push({
          mesh: q,
          frameMesh: frame,
          name: scr.name,
          wPx: computePixelDim(wM, pitch),
          hPx: computePixelDim(hM, pitch),
          wM,
          hM,
          pitchMm: pitch,
          pos: [cx, cy, cz],
          yawDeg: scr.yawDeg || 0
        });
      }

      meshes.push(...buildTrussMeshes(widthM, depthM, heightM, maxTopY, tpl.truss));
      eng.setModel(meshes);
      eng.surfaces = [];
      let cursorX = 0;
      let maxH = 64;
      for (const s of createdScreens) {
        const surf = window.createSurface(s.mesh, s.name, { x: cursorX, y: 0, w: s.wPx, h: s.hPx });
        surf.pitchMm = s.pitchMm;
        surf.physicalWidthM = s.wM;
        surf.physicalHeightM = s.hM;
        surf.sourceMeshId = s.mesh?.id || surf.sourceMeshId || null;
        surf.frameMeshId = s.frameMesh?.id || null;
        surf.pos = s.pos;
        surf.yawDeg = s.yawDeg;
        cursorX += s.wPx;
        maxH = Math.max(maxH, s.hPx);
      }
      eng.master = { width: Math.max(64, cursorX), height: Math.max(64, maxH) };
      eng.selected = eng.surfaces[0]?.id || null;

      if (window.state) {
        window.state.model = { name: `LumiStage_${tpl.id}`, files: [], demo: true };
        window.state.selectedMesh = null;
        window.state.hit = null;
      }

      populateStageLights(eng, overrides.lightCount || tpl.lightCount, widthM, depthM, maxTopY + 0.4, tpl.style);

      if (S.stageAssets16?.clearAll) {
        S.stageAssets16.clearAll();
        for (const p of tpl.props || []) {
          const resolvedKind = resolveCatalogPropKind(p.kind, S.stageAssets16.catalog);
          if (S.stageAssets16.catalog?.[resolvedKind]) {
            const scaledPos = [+(p.pos[0] * scaleX).toFixed(2), +p.pos[1].toFixed(2), +(p.pos[2] * scaleZ).toFixed(2)];
            const item = {
              id: 'AST16_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
              kind: resolvedKind,
              name: S.stageAssets16.catalog[resolvedKind].name,
              pos: scaledPos,
              yaw: 0,
              scale: 1,
              color: S.stageAssets16.catalog[resolvedKind].color
            };
            S.stageAssets16.items.push(item);
            S.stageAssets16.syncItemMeshes?.(item);
          }
        }
      }

      eng.view = 'stage';
      eng.cameraPreset?.('iso');
      window.renderUI?.();
      S.project142?.scheduleAutoBackup?.();
      window.toast?.(tr18(`Đã dựng mẫu "${tpl.name}" (${widthM}×${depthM}m · P${defaultPitch}). Bấm Ctrl+Z nếu muốn hoàn tác.`, `Built "${templatePresentation18(tpl).name}" (${widthM}×${depthM}m · P${defaultPitch}). Press Ctrl+Z to undo.`));
      return true;
    }

    // =========================================================================
    // A2 — TRÌNH THỰC THI LỆNH AI SÂN KHẤU 3D (CÓ UNDO 1 BƯỚC)
    // =========================================================================
    // =========================================================================
    // A3 — BỐ TRÍ BÀN GHẾ KHÁN GIẢ TỰ ĐỘNG & KIỂM TRA TIA NHÌN (SIGHTLINE CHECK)
    // =========================================================================
    function checkAudienceSightlines() {
      const eng = getEngine();
      const stageW = Number(eng?.size?.width) || 16;
      const stageD = Number(eng?.size?.depth) || 8;
      const mainLed = (eng?.surfaces && eng.surfaces[0]) || null;
      const pitchMm = Number(mainLed?.pitchMm) || 3.91;
      const ledW = Number(mainLed?.physicalWidthM || mainLed?.physical?.width) || 6.0;
      const ledH = Number(mainLed?.physicalHeightM || mainLed?.physical?.height) || 3.5;
      const ledCenterY = 2.65;
      const ledTopY = +(ledCenterY + ledH / 2).toFixed(2);
      const ledBottomY = +(Math.max(0.8, ledCenterY - ledH / 2)).toFixed(2);
      const eyeHeightM = 1.2; // độ cao mắt khán giả ngồi tiêu chuẩn

      const props = Array.isArray(S.stageAssets16?.items) ? S.stageAssets16.items : [];
      const seatingProps = props.filter(
        (p) =>
          ['gala_round_table', 'conference_ibm_table', 'banquet_chair'].includes(p.kind) &&
          Array.isArray(p.pos) &&
          Number(p.pos[2]) >= stageD * 0.25
      );

      let minViewDistM = +(stageD / 2 + 2.5).toFixed(2);
      let maxViewDistM = +(stageD / 2 + 18.0).toFixed(2);
      let maxAbsX = +(stageW * 0.45).toFixed(2);

      if (seatingProps.length > 0) {
        const zVals = seatingProps.map((p) => Number(p.pos[2]) || minViewDistM);
        const xVals = seatingProps.map((p) => Math.abs(Number(p.pos[0]) || 0));
        minViewDistM = +Math.max(2.0, Math.min(...zVals)).toFixed(2);
        maxViewDistM = +Math.max(minViewDistM + 2.0, Math.max(...zVals)).toFixed(2);
        maxAbsX = +Math.max(2.0, Math.max(...xVals)).toFixed(2);
      }

      const minPitchDistM = +(pitchMm * 1.0).toFixed(1);
      const optimalPitchDistM = +(pitchMm * 2.2).toFixed(1);
      const verticalAngleDeg = +((Math.atan2(Math.max(0.2, ledTopY - eyeHeightM), minViewDistM) * 180) / Math.PI).toFixed(1);
      const horizontalAngleDeg = +((Math.atan2(maxAbsX, minViewDistM) * 180) / Math.PI).toFixed(1);

      const occludingProps = props
        .filter((p) => {
          if (['gala_round_table', 'conference_ibm_table', 'banquet_chair', 'stage_riser_step', 'catwalk_t'].includes(p.kind)) {
            return false;
          }
          const px = Math.abs(Number(p.pos?.[0]) || 0);
          const py = Number(p.pos?.[1]) || 0;
          const pz = Number(p.pos?.[2]) || 0;
          return px < ledW * 0.35 && pz > -stageD * 0.2 && py > ledBottomY + 0.3;
        })
        .map((p) => p.name || p.kind);

      const warnings = [];
      if (minViewDistM < minPitchDistM) {
        warnings.push(
          `Hàng ghế đầu (${minViewDistM}m) gần hơn khoảng cách nhìn tối thiểu của LED P${pitchMm} (${minPitchDistM}m) — nên lùi hàng VIP hoặc nâng lên P2.5/P2.97.`
        );
      }
      if (verticalAngleDeg > 32) {
        warnings.push(
          `Góc ngẩng cổ hàng đầu (${verticalAngleDeg}°) vượt ngưỡng thoải mái SMPTE (30°) — khán giả ngồi đầu dễ mỏi cổ.`
        );
      }
      if (horizontalAngleDeg > 45) {
        warnings.push(
          `Góc nhìn lệch cánh hai bên (${horizontalAngleDeg}°) > 45° — khuyến nghị bổ sung 2 màn LED phụ nghiêng 12°–15°.`
        );
      }
      if (occludingProps.length > 0) {
        warnings.push(`Phát hiện đạo cụ có nguy cơ che tầm nhìn trung tâm LED: ${occludingProps.join(', ')}.`);
      }

      const passed = warnings.length === 0;
      const summaryVi =
        `KIỂM TRA TIA NHÌN KHÁN GIẢ (3D SIGHTLINE CHECK):\n` +
        `- Khoảng cách khán giả: Hàng đầu ${minViewDistM}m → Hàng cuối ${maxViewDistM}m (Chuẩn nhìn rõ LED P${pitchMm}: từ ${minPitchDistM}m, tối ưu ${optimalPitchDistM}m).\n` +
        `- Góc ngẩng dọc: ${verticalAngleDeg}° (Chuẩn <= 30°) · Góc lệch ngang: ${horizontalAngleDeg}° (Chuẩn <= 45°).\n` +
        (warnings.length
          ? `- Cảnh báo tầm nhìn:\n  + ${warnings.join('\n  + ')}`
          : `- Đánh giá: ĐẠT CHUẨN TẦM NHÌN 100% — Không có vật cản che khuất màn LED chính.`);

      const warningsEn = [];
      if (minViewDistM < minPitchDistM) warningsEn.push('Front row (' + minViewDistM + 'm) is too close for LED P' + pitchMm + ' (minimum ' + minPitchDistM + 'm). Move VIP seats back or use P2.5/P2.97.');
      if (verticalAngleDeg > 32) warningsEn.push('Front-row vertical angle (' + verticalAngleDeg + '°) exceeds SMPTE comfort guidance (30°).');
      if (horizontalAngleDeg > 45) warningsEn.push('Side viewing angle (' + horizontalAngleDeg + '°) exceeds 45°. Add two auxiliary LED screens angled 12°–15°.');
      if (occludingProps.length) warningsEn.push('Props may obstruct the main LED: ' + occludingProps.join(', ') + '.');

      const summaryEn = `Audience sightline check:\n- Audience distance: ${minViewDistM}–${maxViewDistM}m (LED P${pitchMm}: minimum ${minPitchDistM}m, optimal ${optimalPitchDistM}m).\n- Vertical angle: ${verticalAngleDeg}° (≤ 30°); horizontal angle: ${horizontalAngleDeg}° (≤ 45°).\n` +
        (passed ? 'Sightlines clear: no props obstruct the main LED screen.' : warningsEn.join('\n'));
      const report = {
        passed,
        pitchMm,
        minPitchDistM,
        optimalPitchDistM,
        minViewDistM,
        maxViewDistM,
        verticalAngleDeg,
        horizontalAngleDeg,
        occludingProps,
        warnings,
        summaryVi,
        summaryEn
      };
      lumiState.lastSightlineReport = report;
      trackLumiEvent('sightline_checked', { passed, verticalAngleDeg, horizontalAngleDeg });
      return report;
    }

    function layoutAudienceSeating({
      type = 'gala_round_table',
      guestCount = 200,
      aisleWidthM = 2.0,
      clearExisting = true
    } = {}) {
      const eng = getEngine();
      const assets = S.stageAssets16;
      const cleanType = ['gala_round_table', 'conference_ibm_table', 'banquet_chair'].includes(type)
        ? type
        : 'gala_round_table';
      const targetGuests = Math.max(10, Math.min(2000, Math.round(Number(guestCount) || 200)));
      const aisleM = Math.max(1.2, Math.min(6.0, Number(aisleWidthM) || 2.0));

      const spec =
        cleanType === 'gala_round_table'
          ? { paxPerUnit: 10, stepX: 2.8, stepZ: 2.8, label: 'Bàn tròn tiệc Gala (10 khách/bàn)' }
          : cleanType === 'conference_ibm_table'
          ? { paxPerUnit: 3, stepX: 2.4, stepZ: 1.85, label: 'Bàn đại biểu IBM (3 khách/bàn)' }
          : { paxPerUnit: 1, stepX: 0.85, stepZ: 1.15, label: 'Ghế Banquet hội trường (1 khách/ghế)' };

      const unitsNeeded = Math.max(1, Math.ceil(targetGuests / spec.paxPerUnit));
      const stageW = Number(eng?.size?.width) || 16;
      const stageD = Number(eng?.size?.depth) || 8;
      const halfSpanX = Math.max(4.5, stageW * 0.55);
      const colsPerSide = Math.max(1, Math.floor((halfSpanX - aisleM / 2) / spec.stepX));
      const colsPerRow = colsPerSide * 2;
      const rows = Math.max(1, Math.ceil(unitsNeeded / colsPerRow));
      const firstRowZ = +(stageD / 2 + 2.5).toFixed(2);

      window.checkpoint?.();

      if (assets && Array.isArray(assets.items)) {
        if (clearExisting) {
          for (let i = assets.items.length - 1; i >= 0; i--) {
            const it = assets.items[i];
            if (
              ['gala_round_table', 'conference_ibm_table', 'banquet_chair'].includes(it.kind) &&
              (Number(it.pos?.[2]) || 0) >= stageD * 0.25
            ) {
              assets.deleteItem?.(it.id);
            }
          }
        }
      }

      const max3dSpawn = Math.min(unitsNeeded, 48);
      let spawned3dUnits = 0;
      let lastRowZ = firstRowZ;

      for (let r = 0; r < rows && spawned3dUnits < max3dSpawn; r++) {
        const z = +(firstRowZ + r * spec.stepZ).toFixed(2);
        lastRowZ = z;
        for (let side of [-1, 1]) {
          for (let c = 0; c < colsPerSide && spawned3dUnits < max3dSpawn; c++) {
            const x = +(side * (aisleM / 2 + spec.stepX * 0.5 + c * spec.stepX)).toFixed(2);
            if (assets?.addCatalogItem && assets.catalog?.[cleanType]) {
              assets.addCatalogItem(cleanType, [x, 0, z]);
              spawned3dUnits++;
            }
          }
        }
      }

      window.renderUI?.();
      const sightline = checkAudienceSightlines();
      trackLumiEvent('seating_auto_layout', { type: cleanType, guestCount: targetGuests, unitsNeeded });
      return {
        type: cleanType,
        label: spec.label,
        guestCount: targetGuests,
        unitsNeeded,
        spawned3dUnits,
        rows,
        colsPerRow,
        firstRowZ,
        lastRowZ: +(firstRowZ + Math.max(0, rows - 1) * spec.stepZ).toFixed(2),
        sightline
      };
    }

    // =========================================================================
    // A4 — AI ĐẠO DIỄN ÁNH SÁNG & LED MATRIX THEO CẤU TRÚC BÀI NHẠC
    // =========================================================================
    function generateMusicShowCues({ bpm = 128, mood = 'edm' } = {}) {
      const eng = getEngine();
      const cleanBpm = Math.max(60, Math.min(200, Math.round(Number(bpm) || 128)));
      const cleanMood = ['edm', 'gala', 'wedding', 'conference'].includes(String(mood).toLowerCase())
        ? String(mood).toLowerCase()
        : 'edm';
      const beatSec = +(60 / cleanBpm).toFixed(3);
      const barSec = +(beatSec * 4).toFixed(2);

      const palettes = {
        edm: { primary: '#38bdf8', secondary: '#f43f5e', dropFx: 'strobe', buildFx: 'chase', label: 'EDM / Festival Rave' },
        gala: { primary: '#f59e0b', secondary: '#38bdf8', dropFx: 'chase', buildFx: 'pulse', label: 'Gala Dinner / Award Night' },
        wedding: { primary: '#f472b6', secondary: '#fde047', dropFx: 'pulse', buildFx: 'steady', label: 'Luxury Wedding Romance' },
        conference: { primary: '#0ea5e9', secondary: '#e2e8f0', dropFx: 'steady', buildFx: 'steady', label: 'Corporate Keynote' }
      };
      const pal = palettes[cleanMood];

      const cues = [
        {
          id: 'cue_intro',
          section: '1. Intro (Mở màn)',
          startSec: 0,
          durationSec: +(barSec * 4).toFixed(1),
          lightFx: 'steady',
          lightColor: pal.primary,
          ledContent: 'Ambient Shader / Logo Reveal',
          dimmerPercent: 45
        },
        {
          id: 'cue_verse',
          section: '2. Verse (Dẫn dắt)',
          startSec: +(barSec * 4).toFixed(1),
          durationSec: +(barSec * 8).toFixed(1),
          lightFx: 'pulse',
          lightColor: pal.primary,
          ledContent: 'Motion Background đồng bộ nhịp 1/4',
          dimmerPercent: 70
        },
        {
          id: 'cue_buildup',
          section: '3. Build-up (Cao trào)',
          startSec: +(barSec * 12).toFixed(1),
          durationSec: +(barSec * 4).toFixed(1),
          lightFx: pal.buildFx,
          lightColor: pal.secondary,
          ledContent: 'Strobe Matrix + Kinetic Chase tăng tốc 1/8 → 1/16',
          dimmerPercent: 90
        },
        {
          id: 'cue_drop',
          section: '4. Drop / Climax (Bùng nổ)',
          startSec: +(barSec * 16).toFixed(1),
          durationSec: +(barSec * 8).toFixed(1),
          lightFx: pal.dropFx,
          lightColor: pal.secondary,
          ledContent: 'Full Pixel Mapping + Cold Spark + Beam Sweep 100%',
          dimmerPercent: 100
        },
        {
          id: 'cue_outro',
          section: '5. Outro (Kết màn)',
          startSec: +(barSec * 24).toFixed(1),
          durationSec: +(barSec * 4).toFixed(1),
          lightFx: 'steady',
          lightColor: pal.primary,
          ledContent: 'Fade Out + Key Visual Thương hiệu',
          dimmerPercent: 50
        }
      ];

      window.checkpoint?.();
      lumiState.musicShowCues = cues;

      if (eng && Array.isArray(eng.lights)) {
        const speedMul = +(cleanBpm / 120).toFixed(2);
        eng.lights.forEach((l, idx) => {
          l.color = idx % 2 === 0 ? pal.primary : pal.secondary;
          l.fx = idx % 3 === 0 ? pal.dropFx : pal.buildFx;
          l.fxSpeed = +(2.2 * speedMul).toFixed(2);
          l.speed = +(0.45 * speedMul).toFixed(2);
          l.sweep = cleanMood !== 'conference';
        });
        eng.rebuildFixtures?.();
      }

      if (window.seq && Array.isArray(window.seq.cues)) {
        window.seq.bpm = cleanBpm;
        window.seq.cues = cues.map((c) => ({ ...c }));
      }

      window.renderUI?.();
      trackLumiEvent('music_show_cues', { bpm: cleanBpm, mood: cleanMood });

      const summaryVi =
        `Kịch bản đạo diễn ánh sáng & LED theo nhạc (${pal.label} · ${cleanBpm} BPM · 1 Khuông = ${barSec}s):\n` +
        cues
          .map(
            (c) =>
              `- [${c.startSec}s → +${c.durationSec}s] ${c.section}: Đèn DMX (${c.lightFx.toUpperCase()} · ${c.lightColor} · Dimmer ${c.dimmerPercent}%) + LED (${c.ledContent})`
          )
          .join('\n');

      const summaryEn = `Music and lighting cues (${pal.label} · ${cleanBpm} BPM · bar = ${barSec}s):\n` +
        cues.map((c, i) => `- [${c.startSec}s → +${c.durationSec}s] ${['Intro', 'Verse', 'Build-up', 'Drop / Climax', 'Outro'][i]}: DMX ${c.lightFx.toUpperCase()} · ${c.lightColor} · Dimmer ${c.dimmerPercent}% · LED (${c.ledContent.replace('đồng bộ nhịp', 'beat sync').replace('tăng tốc', 'accelerating').replace('Thương hiệu', 'Brand')})`).join('\n');
      return {
        bpm: cleanBpm,
        mood: cleanMood,
        barSec,
        cues,
        summaryVi,
        summaryEn
      };
    }

    // =========================================================================
    // A5 — BẢNG MÀU & CHỦ ĐỀ MÀN HÌNH LED TỪ THƯƠNG HIỆU KHÁCH HÀNG (BRAND KIT)
    // =========================================================================
    function applyBrandIdentity({
      brandName = 'GROUPLIFE EVENT',
      primaryColor = '#38bdf8',
      accentColor = '#f59e0b'
    } = {}) {
      const eng = getEngine();
      const cleanName = String(brandName || 'GROUPLIFE EVENT').trim().slice(0, 80);
      const normHex = (c, fb) => (/^#[0-9a-f]{6}$/i.test(String(c || '').trim()) ? String(c).trim() : fb);
      const primary = normHex(primaryColor, '#38bdf8');
      const accent = normHex(accentColor, '#f59e0b');

      window.checkpoint?.();
      lumiState.brandIdentity = { brandName: cleanName, primaryColor: primary, accentColor: accent };
      lumiState.quoteConfig.clientName = cleanName;

      let lightsUpdated = 0;
      if (eng) {
        eng.accent = primary;
        if (Array.isArray(eng.lights)) {
          eng.lights.forEach((l, idx) => {
            l.color = idx % 2 === 0 ? primary : accent;
            lightsUpdated++;
          });
          eng.rebuildFixtures?.();
        }
      }

      window.renderUI?.();
      trackLumiEvent('brand_identity_applied', { lightsUpdated });

      const summaryVi =
        `ĐÃ ĐỒNG BỘ BỘ NHẬN DIỆN THƯƠNG HIỆU LÊN SÂN KHẤU 3D:\n` +
        `- Thương hiệu / Khách hàng: ${cleanName}\n` +
        `- Màu chủ đạo: ${primary} · Màu điểm nhấn: ${accent}\n` +
        `- Đã cập nhật đồng bộ ${lightsUpdated} đèn DMX + màu chủ đạo LED Matrix + thông tin Khách hàng trên Báo giá.`;

      const summaryEn = `Brand identity applied to the 3D stage:\n- Brand / client: ${cleanName}\n- Primary: ${primary} · Accent: ${accent}\n- Updated ${lightsUpdated} DMX lights, LED Matrix accent and quotation client.`;
      return {
        brandName: cleanName,
        primaryColor: primary,
        accentColor: accent,
        lightsUpdated,
        summaryVi,
        summaryEn
      };
    }

    const PROP_KIND_ALIASES = {
      catwalk_t: 'catwalk_runway',
      catwalk_runway: 'catwalk_t',
      co2_cannon: 'co2_jet',
      co2_cannon_jet: 'co2_jet',
      co2_jet: 'co2_cannon',
      led_arch: 'led_arch_gate',
      led_arch_gate: 'led_arch',
      podium_vip: 'vip_podium',
      vip_podium: 'podium_vip',
      line_array_hang: 'line_array',
      stage_sub_stack: 'sub_stack',
      stage_monitor_wedge: 'sub_stack'
    };

    function resolveCatalogPropKind(rawKind, catalog) {
      const k = String(rawKind || 'vip_podium').trim();
      if (catalog?.[k]) return k;
      const alias = PROP_KIND_ALIASES[k];
      if (alias && catalog?.[alias]) return alias;
      return k;
    }

    function findSurfaceStageMeshes(eng, surf) {
      if (!eng || !Array.isArray(eng.stage) || !surf) return [];
      return eng.stage.filter(
        (m) =>
          m &&
          (m === surf.mesh ||
            (surf.sourceMeshId && m.id === surf.sourceMeshId) ||
            (surf.frameMeshId && m.id === surf.frameMeshId) ||
            (surf.name && (m.name === surf.name || m.name === surf.name + '_Frame')))
      );
    }

    function scaleMeshAroundCenter(mesh, sx, sy, sz = 1) {
      if (!mesh?.p || mesh.p.length < 3) return;
      const c = mesh.bounds?.center || [0, 0, 0];
      const p = (mesh.p = new Float32Array(mesh.p));
      for (let i = 0; i + 2 < p.length; i += 3) {
        p[i] = c[0] + (p[i] - c[0]) * sx;
        p[i + 1] = c[1] + (p[i + 1] - c[1]) * sy;
        p[i + 2] = c[2] + (p[i + 2] - c[2]) * sz;
      }
      if (typeof window.M?.bbox === 'function') {
        mesh.bounds = window.M.bbox(p);
      } else if (mesh.bounds) {
        if (Array.isArray(mesh.bounds.size)) {
          mesh.bounds.size = [
            (mesh.bounds.size[0] || 0) * sx,
            (mesh.bounds.size[1] || 0) * sy,
            (mesh.bounds.size[2] || 0) * sz
          ];
        }
      }
    }

    function cloneMeshState18(m) {
      if (!m) return null;
      return {
        mesh: m,
        p: m.p ? new Float32Array(m.p) : null,
        n: m.n ? new Float32Array(m.n) : null,
        bounds: m.bounds ? JSON.parse(JSON.stringify(m.bounds)) : null
      };
    }

    function restoreMeshState18(eng, ms) {
      if (!ms?.mesh) return null;
      if (ms.p) ms.mesh.p = new Float32Array(ms.p);
      if (ms.n) ms.mesh.n = new Float32Array(ms.n);
      if (ms.bounds) ms.mesh.bounds = JSON.parse(JSON.stringify(ms.bounds));
      eng?.releaseMesh?.(ms.mesh);
      return ms.mesh;
    }

    function executeStageCommands(commands = [], { recordUndo = true } = {}) {
      if (lumiState.showSafetyLock) {
        window.toast?.(t18('lockBlocked'));
        return 0;
      }
      if (!Array.isArray(commands) || !commands.length) return 0;
      const eng = getEngine();
      if (!eng) return 0;
      if (recordUndo) window.checkpoint?.();

      let applied = 0;
      for (const cmd of commands) {
        if (!cmd || typeof cmd !== 'object') continue;
        const action = String(cmd.action || cmd.op || cmd.type || '').toLowerCase().trim();

        if (action === 'load_template') {
          const tplId = String(cmd.templateId || cmd.template || 'conference').toLowerCase();
          if (applyStageTemplate(tplId, cmd)) applied++;
          continue;
        }

        if (action === 'set_stage_size') {
          const wM = Math.max(4, Math.min(80, Number(cmd.widthM || cmd.width) || 16));
          const dM = Math.max(3, Math.min(50, Number(cmd.depthM || cmd.depth) || 8));
          const hM = Math.max(0.2, Math.min(4, Number(cmd.heightM || cmd.height) || 0.9));
          const idx = eng.stage.findIndex((m) => /stage platform/i.test(m.name));
          const plat = window.boxMesh('Stage platform', [0, hM / 2, 0], [wM, hM, dM], [0.34, 0.37, 0.44, 1]);
          if (idx >= 0) {
            eng.releaseMesh?.(eng.stage[idx]);
            eng.stage[idx] = plat;
          } else {
            eng.stage.unshift(plat);
          }
          eng._stageBatchDirty = true;
          eng.computeBounds?.();
          applied++;
          continue;
        }

        if (action === 'add_led') {
          const wM = Math.max(0.5, Math.min(40, Number(cmd.widthM || cmd.width) || 4));
          const hM = Math.max(0.5, Math.min(20, Number(cmd.heightM || cmd.height) || 3));
          const pitchMm = Math.max(1.2, Math.min(16, Number(cmd.pitchMm || cmd.pitch) || 3.91));
          const name = String(cmd.name || `LED_AI_${eng.surfaces.length + 1}`).slice(0, 60);
          const pos = Array.isArray(cmd.pos) && cmd.pos.length === 3
            ? cmd.pos.map((v) => Number(v) || 0)
            : (cmd.x !== undefined || cmd.y !== undefined || cmd.z !== undefined
                ? [Number(cmd.x) || 0, Number(cmd.y) || (hM / 2 + 1.0), cmd.z !== undefined ? (Number(cmd.z) || 0) : -2.0]
                : [0, hM / 2 + 1.0, -2.0]);
          const yawDeg = Number(cmd.yawDeg ?? cmd.rotYDeg ?? cmd.rotY ?? cmd.yaw ?? cmd.curve ?? 0);
          const q = window.quadMesh(
            name,
            [
              [-wM / 2, hM / 2, 0],
              [wM / 2, hM / 2, 0],
              [wM / 2, -hM / 2, 0],
              [-wM / 2, -hM / 2, 0]
            ],
            { color: [0.04, 0.05, 0.08, 1] }
          );
          const mat = window.M.mm(window.M.translate(pos), window.M.rotate([0, 1, 0], (yawDeg * Math.PI) / 180));
          window.transformMesh(q, mat);
          eng.stage.push(q);
          const wPx = computePixelDim(wM, pitchMm);
          const hPx = computePixelDim(hM, pitchMm);
          const surf = window.createSurface(q, name, { x: 0, y: 0, w: wPx, h: hPx });
          surf.pitchMm = pitchMm;
          surf.physicalWidthM = wM;
          surf.physicalHeightM = hM;
          surf.sourceMeshId = q.id || surf.sourceMeshId || null;
          surf.pos = pos.slice();
          surf.yawDeg = yawDeg;
          repackSurfacesMaster(eng);
          eng._stageBatchDirty = true;
          applied++;
          continue;
        }

        if (action === 'update_led') {
          const target =
            (Number.isInteger(cmd.index) && eng.surfaces[cmd.index]) ||
            eng.surfaces.find((s) => s.id === cmd.id || s.name === cmd.name) ||
            eng.surfaces[0];
          if (target) {
            const oldW = Number(target.physicalWidthM || target.physical?.width || target.physical?.[0]) || 4;
            const oldH = Number(target.physicalHeightM || target.physical?.height || target.physical?.[1]) || 2.5;
            if (cmd.pitchMm || cmd.pitch) target.pitchMm = Math.max(1.2, Math.min(16, Number(cmd.pitchMm || cmd.pitch)));
            if (cmd.widthM || cmd.width) target.physicalWidthM = Math.max(0.5, Number(cmd.widthM || cmd.width));
            if (cmd.heightM || cmd.height) target.physicalHeightM = Math.max(0.5, Number(cmd.heightM || cmd.height));
            const nextW = Number(target.physicalWidthM) || oldW;
            const nextH = Number(target.physicalHeightM) || oldH;
            if (Array.isArray(target.physical)) target.physical = [nextW, nextH];
            const p = target.pitchMm || 3.91;
            if (target.physicalWidthM) target.w = computePixelDim(target.physicalWidthM, p);
            if (target.physicalHeightM) target.h = computePixelDim(target.physicalHeightM, p);
            if (cmd.brightness !== undefined) target.brightness = Math.max(0.1, Math.min(2, Number(cmd.brightness) || 1));
            if ((Math.abs(nextW - oldW) > 1e-4 || Math.abs(nextH - oldH) > 1e-4) && oldW > 0 && oldH > 0) {
              const sx = nextW / oldW;
              const sy = nextH / oldH;
              if (target.mesh) {
                scaleMeshAroundCenter(target.mesh, sx, sy, 1);
                eng.releaseMesh?.(target.mesh);
              }
              for (const m of findSurfaceStageMeshes(eng, target)) {
                if (m !== target.mesh) {
                  scaleMeshAroundCenter(m, sx, sy, 1);
                  eng.releaseMesh?.(m);
                }
              }
              eng._stageBatchDirty = true;
              eng.computeBounds?.();
            }
            window.updateTest?.(target);
            repackSurfacesMaster(eng);
            applied++;
          }
          continue;
        }

        if (action === 'remove_led') {
          const removed = [];
          if (Number.isInteger(cmd.index) && cmd.index >= 0 && cmd.index < eng.surfaces.length) {
            removed.push(...eng.surfaces.splice(cmd.index, 1));
          } else {
            const keep = [];
            for (const s of eng.surfaces) {
              if (s.id === cmd.id || s.name === cmd.name) removed.push(s);
              else keep.push(s);
            }
            eng.surfaces = keep;
          }
          if (removed.length > 0) {
            const stageToRemove = new Set();
            for (const rem of removed) {
              eng.releaseMesh?.(rem.mesh);
              for (const m of findSurfaceStageMeshes(eng, rem)) {
                stageToRemove.add(m);
                eng.releaseMesh?.(m);
              }
            }
            if (stageToRemove.size > 0 && Array.isArray(eng.stage)) {
              eng.stage = eng.stage.filter((m) => !stageToRemove.has(m));
              eng._stageBatchDirty = true;
              eng.computeBounds?.();
            }
            repackSurfacesMaster(eng);
            applied++;
          }
          continue;
        }

        if (action === 'build_truss' || action === 'add_truss') {
          const wM = Math.max(4, Math.min(60, Number(cmd.widthM || cmd.width || eng.size?.width) || 14));
          const dM = Math.max(3, Math.min(40, Number(cmd.depthM || cmd.depth || eng.size?.depth) || 8));
          const topY = Math.max(4, Math.min(18, Number(cmd.heightM || cmd.height) || 6.5));
          const styleRaw = String(cmd.style || cmd.mode || 'portal').toLowerCase();
          const mode = styleRaw.includes('box') ? 'box' : styleRaw.includes('arch') ? 'arch' : 'portal';
          const trussMeshes = buildTrussMeshes(wM, dM, 0.9, topY - 0.55, mode);
          if (trussMeshes.length) {
            eng.stage.push(...trussMeshes);
            eng._stageBatchDirty = true;
            applied++;
          }
          continue;
        }

        if (action === 'add_light') {
          const count = Math.max(1, Math.min(64, Math.round(Number(cmd.count) || 8)));
          const w = eng.size?.width || 16;
          const h = Number(cmd.height) || eng.size?.height || 7;
          const d = Math.max(eng.size?.depth || 8, 5);
          const color = /^#[0-9a-f]{6}$/i.test(String(cmd.color || '')) ? cmd.color : '#38bdf8';
          const rawType = String(cmd.fixtureType || cmd.kind || 'beam').toLowerCase();
          const rowRaw = String(cmd.row || 'back').toLowerCase();
          const spec = rawType.includes('katana')
            ? { prefix: 'Katana Bar #', power: 4.0, angle: 18, sweep: true, ofl: 'vn-stage/katana-bar-12x40w' }
            : rawType.includes('blinder') || rawType.includes('cob')
            ? { prefix: 'COB Blinder #', power: 5.2, angle: 42, sweep: false, ofl: 'vn-stage/cob-blinder-2x100w' }
            : rawType.includes('wash')
            ? { prefix: 'Wash Zoom #', power: 3.8, angle: 28, sweep: false, ofl: 'vn-stage/wash-zoom-36x18' }
            : rawType.includes('par')
            ? { prefix: 'Par LED #', power: 3.5, angle: 24, sweep: false, ofl: 'vn-stage/par-led-54x3w' }
            : rawType.includes('350') || rawType.includes('17r') || rawType.includes('spot')
            ? { prefix: 'Beam 350 #', power: 5.0, angle: 10, sweep: true, ofl: 'vn-stage/beam-350-17r' }
            : { prefix: 'Beam 230 #', power: 4.8, angle: 12, sweep: true, ofl: 'vn-stage/beam-230-7r' };
          const yPos = rowRaw === 'floor' ? 0.95 : +(h * 0.92).toFixed(2);
          const zPos = rowRaw === 'front' ? +(d * 0.22).toFixed(2) : rowRaw === 'floor' ? +(-d * 0.12).toFixed(2) : +(-d * 0.2).toFixed(2);
          for (let i = 0; i < count && eng.lights.length < 128; i++) {
            const u = count > 1 ? i / (count - 1) - 0.5 : 0;
            const idx = eng.lights.length + 1;
            eng.lights.push({
              id: 'light_ai_' + Date.now().toString(36) + '_' + i,
              name: spec.prefix + String(idx).padStart(2, '0'),
              pos: [+(u * w * 0.85).toFixed(2), yPos, zPos],
              target: [+(u * w * 0.4).toFixed(2), rowRaw === 'floor' ? +(h * 0.65).toFixed(2) : 0.25, +(d * 0.5).toFixed(2)],
              color,
              power: spec.power,
              angle: spec.angle,
              enabled: true,
              sweep: spec.sweep,
              speed: 0.4,
              phase: +(i * 0.35).toFixed(2),
              fx: cmd.fx || 'steady',
              fxDepth: 0.55,
              fxSpeed: 2.2,
              boost: 1,
              oflProfileId: spec.ofl
            });
          }
          eng.rebuildFixtures?.();
          applied++;
          continue;
        }

        if (action === 'add_prop') {
          const rawKind = String(cmd.assetId || cmd.kind || cmd.prop || 'vip_podium');
          const resolvedKind = resolveCatalogPropKind(rawKind, S.stageAssets16?.catalog);
          if (S.stageAssets16?.addCatalogItem && S.stageAssets16.catalog?.[resolvedKind]) {
            const count = Math.max(1, Math.min(16, Math.round(Number(cmd.count) || 1)));
            const basePos = Array.isArray(cmd.pos) && cmd.pos.length === 3
              ? cmd.pos.map((v) => Number(v) || 0)
              : (cmd.x !== undefined || cmd.y !== undefined || cmd.z !== undefined
                  ? [Number(cmd.x) || 0, Number(cmd.y) || 0, Number(cmd.z) || 0]
                  : null);
            for (let i = 0; i < count; i++) {
              const p = basePos
                ? [basePos[0] + (count > 1 ? (i - (count - 1) / 2) * 2.2 : 0), basePos[1], basePos[2]]
                : null;
              S.stageAssets16.addCatalogItem(resolvedKind, p);
            }
            applied++;
          }
          continue;
        }

        if (action === 'move_led') {
          const target =
            (Number.isInteger(cmd.index) && eng.surfaces[cmd.index]) ||
            eng.surfaces.find((s) => s.id === cmd.id || s.name === cmd.name) ||
            eng.surfaces[0];
          if (target?.mesh && typeof window.transformMesh === 'function' && window.M?.translate) {
            const dx = Math.max(-50, Math.min(50, Number(cmd.dx ?? cmd.x ?? 0) || 0));
            const dy = Math.max(-20, Math.min(20, Number(cmd.dy ?? cmd.y ?? 0) || 0));
            const dz = Math.max(-50, Math.min(50, Number(cmd.dz ?? cmd.z ?? 0) || 0));
            const tMat = window.M.translate([dx, dy, dz]);
            window.transformMesh(target.mesh, tMat);
            eng.releaseMesh?.(target.mesh);
            for (const m of findSurfaceStageMeshes(eng, target)) {
              if (m !== target.mesh) {
                window.transformMesh(m, tMat);
                eng.releaseMesh?.(m);
              }
            }
            if (Array.isArray(target.pos) && target.pos.length === 3) {
              target.pos = [+(target.pos[0] + dx).toFixed(2), +(target.pos[1] + dy).toFixed(2), +(target.pos[2] + dz).toFixed(2)];
            } else if (Array.isArray(target.mesh.bounds?.center)) {
              target.pos = target.mesh.bounds.center.map((v) => +Number(v).toFixed(2));
            }
            eng._stageBatchDirty = true;
            eng.computeBounds?.();
            applied++;
          }
          continue;
        }

        if (action === 'move_prop') {
          const items = Array.isArray(S.stageAssets16?.items) ? S.stageAssets16.items : [];
          const rawTarget = String(cmd.id || cmd.kind || cmd.assetId || cmd.name || '').trim();
          const resolvedKind = resolveCatalogPropKind(rawTarget, S.stageAssets16?.catalog);
          const item =
            items.find((it) => it.id === rawTarget || it.kind === resolvedKind || it.kind === rawTarget || it.name === rawTarget) ||
            items[items.length - 1];
          if (item && Array.isArray(item.pos)) {
            const dx = Math.max(-50, Math.min(50, Number(cmd.dx ?? 0) || 0));
            const dy = Math.max(-20, Math.min(20, Number(cmd.dy ?? 0) || 0));
            const dz = Math.max(-50, Math.min(50, Number(cmd.dz ?? 0) || 0));
            item.pos = [
              +((Number(item.pos[0]) || 0) + dx).toFixed(2),
              +((Number(item.pos[1]) || 0) + dy).toFixed(2),
              +((Number(item.pos[2]) || 0) + dz).toFixed(2)
            ];
            S.stageAssets16?.syncItemMeshes?.(item);
            applied++;
          }
          continue;
        }

        if (action === 'apply_style') {
          const style = String(cmd.style || cmd.mood || 'concert').toLowerCase();
          if (typeof window.rigPreset === 'function') {
            window.rigPreset(style === 'wedding' || style === 'warm' ? 'warm' : style === 'conference' || style === 'corporate' || style === 'cool' ? 'cool' : 'concert', false);
          }
          const accent = cmd.accent || cmd.primaryColor || cmd.secondaryColor;
          if (accent && /^#[0-9a-f]{6}$/i.test(accent)) eng.accent = accent;
          applied++;
          continue;
        }

        if (action === 'layout_seating') {
          layoutAudienceSeating({
            type: cmd.seatingType || cmd.kind || 'gala_round_table',
            guestCount: cmd.guestCount || cmd.guests || 200,
            aisleWidthM: cmd.aisleWidthM || 2.0
          });
          applied++;
          continue;
        }

        if (action === 'check_sightlines') {
          checkAudienceSightlines();
          applied++;
          continue;
        }

        if (action === 'music_cues') {
          generateMusicShowCues({ bpm: cmd.bpm || 128, mood: cmd.mood || 'edm' });
          applied++;
          continue;
        }

        if (action === 'apply_brand') {
          applyBrandIdentity({
            brandName: cmd.brandName || cmd.name || 'GROUPLIFE EVENT',
            primaryColor: cmd.primaryColor || cmd.primary || '#38bdf8',
            accentColor: cmd.accentColor || cmd.accent || '#f59e0b'
          });
          applied++;
          continue;
        }

        if (action === 'optimize_budget') {
          const nextPitch = Number(cmd.pitchMm) || 3.91;
          for (let i = 0; i < eng.surfaces.length; i++) {
            const s = eng.surfaces[i];
            const p = i === 0 ? nextPitch : Math.max(nextPitch, 4.81);
            s.pitchMm = p;
            const wM = s.physicalWidthM || s.physical?.width || 4;
            const hM = s.physicalHeightM || s.physical?.height || 3;
            s.w = computePixelDim(wM, p);
            s.h = computePixelDim(hM, p);
          }
          repackSurfacesMaster(eng);
          if (cmd.maxLights && eng.lights.length > Number(cmd.maxLights)) {
            eng.lights = eng.lights.slice(0, Math.max(4, Number(cmd.maxLights)));
            eng.rebuildFixtures?.();
          }
          applied++;
        }
      }

      window.renderUI?.();
      return applied;
    }

    // A2 Nâng cao — Chế độ Xem trước (Preview) -> Áp dụng (Commit) / Hoàn tác (Revert)
    function previewStageCommands(commands = []) {
      if (lumiState.showSafetyLock) {
        window.toast?.(t18('lockBlocked'));
        return 0;
      }
      if (lumiState.pendingPreview?.active) {
        revertStagePreview();
      }
      const eng = getEngine();
      const snapshotBefore = {
        surfaces: Array.isArray(eng?.surfaces)
          ? eng.surfaces.map((s) => ({
              ...s,
              crop: Array.isArray(s.crop) ? s.crop.slice() : s.crop,
              physical: Array.isArray(s.physical) ? s.physical.slice() : s.physical,
              pos: Array.isArray(s.pos) ? s.pos.slice() : s.pos,
              meshState: cloneMeshState18(s.mesh)
            }))
          : null,
        stage: Array.isArray(eng?.stage) ? eng.stage.map((m) => cloneMeshState18(m)) : null,
        lights: Array.isArray(eng?.lights)
          ? eng.lights.map((l) => ({
              ...l,
              pos: Array.isArray(l.pos) ? l.pos.slice() : l.pos,
              target: Array.isArray(l.target) ? l.target.slice() : l.target
            }))
          : null,
        master: eng?.master ? { ...eng.master } : null,
        size: eng?.size ? { ...eng.size } : null,
        accent: eng?.accent,
        selected: eng?.selected,
        items: Array.isArray(S.stageAssets16?.items)
          ? S.stageAssets16.items.map((it) => ({
              ...it,
              pos: Array.isArray(it.pos) ? it.pos.slice() : it.pos
            }))
          : null,
        historyCopy: (S.state || window.state)?.history?.slice() || null,
        redoCopy: (S.state || window.state)?.redo?.slice() || null
      };
      const undoBefore = lastUndo18();
      const applied = singleUndo18(() => executeStageCommands(commands, { recordUndo: true }));
      if (applied > 0) {
        lumiState.pendingPreview = {
          active: true,
          commandCount: applied,
          commands: Array.isArray(commands) ? commands.slice() : [],
          snapshotBefore,
          undoSnapshot: lastUndo18() !== undoBefore ? lastUndo18() : null,
          createdAt: Date.now()
        };
        window.toast?.(t18('previewReady'));
      }
      return applied;
    }

    function commitStagePreview() {
      if (!lumiState.pendingPreview?.active) return false;
      lumiState.pendingPreview = null;
      trackLumiEvent('preview_committed');
      window.toast?.(t18('previewCommitted'));
      return true;
    }

    function revertStagePreview() {
      if (!lumiState.pendingPreview?.active) return false;
      const snap = lumiState.pendingPreview.snapshotBefore;
      lumiState.pendingPreview = null;
      if (snap) {
        const eng = getEngine();
        if (eng) {
          if (snap.stage) {
            eng.stage = snap.stage.map((ms) => restoreMeshState18(eng, ms)).filter(Boolean);
          }
          if (snap.surfaces) {
            eng.surfaces = snap.surfaces.map(({ meshState, ...rest }) => {
              if (meshState) restoreMeshState18(eng, meshState);
              const restoredSurf = {
                ...rest,
                crop: Array.isArray(rest.crop) ? rest.crop.slice() : rest.crop,
                physical: Array.isArray(rest.physical) ? rest.physical.slice() : rest.physical,
                pos: Array.isArray(rest.pos) ? rest.pos.slice() : rest.pos
              };
              window.updateTest?.(restoredSurf);
              return restoredSurf;
            });
          }
          if (snap.lights) {
            eng.lights = snap.lights.map((l) => ({
              ...l,
              pos: Array.isArray(l.pos) ? l.pos.slice() : l.pos,
              target: Array.isArray(l.target) ? l.target.slice() : l.target
            }));
          }
          if (snap.master) eng.master = { ...snap.master };
          if (snap.size) eng.size = { ...snap.size };
          if (snap.accent !== undefined) eng.accent = snap.accent;
          if (snap.selected !== undefined) eng.selected = snap.selected;
          eng._stageBatchDirty = true;
          repackSurfacesMaster(eng);
          eng.computeBounds?.();
          eng.rebuildFixtures?.();
        }
        if (snap.items && S.stageAssets16) {
          S.stageAssets16.items = snap.items.map((it) => ({
            ...it,
            pos: Array.isArray(it.pos) ? it.pos.slice() : it.pos
          }));
          S.stageAssets16.rebuildAll?.();
        }
        const state = S.state || window.state;
        if (Array.isArray(state?.history) && snap.historyCopy) {
          state.history.splice(0, state.history.length, ...snap.historyCopy);
          if (Array.isArray(snap.redoCopy)) state.redo = snap.redoCopy.slice();
          window.historyButtons?.();
        }
      }
      window.renderUI?.();
      trackLumiEvent('preview_reverted');
      window.toast?.(t18('previewReverted'));
      return true;
    }

    // =========================================================================
    // A8 — TRỢ LÝ HƯỚNG DẪN SỬ DỤNG PHẦN MỀM & "LÀM GIÚP LUÔN" (COPILOT GUIDE)
    // =========================================================================
    const LUMI_HELP_TOPICS = [
      {
        id: 'led_mapping',
        keywords: /màn led|ghép màn|led cánh|wing|novastar|pixel pitch|p2\.5|p3\.91|mapping/i,
        titleVi: 'Cách tạo & ghép màn hình LED (Chính + Cánh) và tính bộ xử lý NovaStar',
        titleEn: 'How to create & map LED screens (Main + Wings) and calculate NovaStar processors',
        answerVi:
          'HƯỚNG DẪN MÀN HÌNH LED & PIXEL MAPPING:\n' +
          '1. Mở bước "02 LED" trên thanh công cụ hoặc chọn "6 Mẫu VN" để dựng nhanh hệ LED Chính + Cánh.\n' +
          '2. Nhấp vào từng màn LED trên sân khấu 3D để đổi kích thước (m), độ phân giải (px) và Pixel Pitch (P2.5 / P2.97 / P3.91 / P4.81).\n' +
          '3. Mở "BOM & Báo giá" để xem tự động số lượng cabinet 500×500mm, số cổng RJ45 Cat6A và khuyến nghị bộ xử lý NovaStar (VX4S / VX600 / VX1000).',
        answerEn:
          'LED WALL & PIXEL MAPPING GUIDE:\n' +
          '1. Switch to step "02 LED" or click "6 Stage Templates" to spawn Main + Wing LED walls.\n' +
          '2. Select any LED screen in 3D to adjust dimensions (m), resolution (px), and Pixel Pitch.\n' +
          '3. Open "BOM & Quote" for automatic 500×500mm cabinet count, RJ45 port count, and NovaStar processor sizing.',
        quickActionId: 'add_wing_leds',
        quickActionLabelVi: 'Làm giúp luôn: Thêm 2 màn LED cánh 2.5×4m (P3.91)',
        quickActionLabelEn: 'Do it for me: Add 2 Side Wing LEDs 2.5×4m (P3.91)'
      },
      {
        id: 'dmx_lighting',
        keywords: /đèn|beam|moving head|par led|katana|dmx|pan|tilt|ofl|ánh sáng/i,
        titleVi: 'Cách treo đèn Moving Head / Par LED, gán hồ sơ OFL DMX512 và xoay Pan/Tilt',
        titleEn: 'How to rig Moving Head / Par LED fixtures, assign OFL DMX512 profiles & Pan/Tilt',
        answerVi:
          'HƯỚNG DẪN ĐÈN SÂN KHẤU DMX512 & RIG 3 NODE:\n' +
          '1. Chuyển sang bước "03 Ánh sáng" hoặc mở Kho Đạo cụ 3D để thêm đèn Moving Head Beam 230/350, Wash 36×18, Par LED 54×3W hoặc Katana Bar.\n' +
          '2. Các mẫu đèn 3D chuẩn hợp đồng led-asset/v1 có sẵn 3 node tách biệt, tự động treo lên cao độ Truss và xoay Pan/Tilt độc lập.\n' +
          '3. Chọn hồ sơ Open Fixture Library (21 mẫu đèn VN) trong Fixture Desk để đồng bộ kênh DMX 16-bit.',
        answerEn:
          'DMX512 LIGHTING & 3-NODE KINEMATIC RIG GUIDE:\n' +
          '1. Open step "03 LIGHTING" or the 3D Asset Library to add Beam 230/350, Wash 36×18, Par LED, or Katana fixtures.\n' +
          '2. 3-node GLB fixtures (Base / Yoke / Head) auto-mount at Truss height and support independent Pan/Tilt rotation.\n' +
          '3. Assign any of the 21 OFL DMX512 profiles in Fixture Desk.',
        quickActionId: 'add_beam_rig',
        quickActionLabelVi: 'Làm giúp luôn: Treo thêm 8 đèn Beam 230W lên khung Truss',
        quickActionLabelEn: 'Do it for me: Rig 8 Beam 230W moving heads on Truss'
      },
      {
        id: 'audience_sightline',
        keywords: /bàn ghế|khán giả|tầm nhìn|tia nhìn|sightline|hội trường|tiệc tròn|ibm|banquet/i,
        titleVi: 'Cách rải bàn ghế tự động theo số khách và kiểm tra tia nhìn khán giả',
        titleEn: 'How to auto-layout audience seating and verify 3D SMPTE sightlines (A3)',
        answerVi:
          'HƯỚNG DẪN BỐ TRÍ BÀN GHẾ & KIỂM TRA TIA NHÌN:\n' +
          '1. Trong cửa sổ AI Sân khấu, nhập số lượng khách (VD: "300 khách bàn tiệc tròn" hoặc "150 khách bàn IBM") rồi bấm "Bố trí Bàn ghế & Tia nhìn".\n' +
          '2. Hệ thống tự động chia hàng, chừa lối đi trung tâm và kiểm tra góc ngẩng dọc (<= 30° chuẩn SMPTE), góc lệch ngang (<= 45°) cùng khoảng cách nhìn tối thiểu theo Pixel Pitch.',
        answerEn:
          'AUDIENCE SEATING & 3D SIGHTLINE CHECK (A3):\n' +
          '1. Enter guest count in the Stage AI modal and click "Seating & Sightlines (A3)".\n' +
          '2. LumiStage auto-arranges Gala round tables, IBM tables, or Banquet chairs and checks SMPTE vertical/horizontal viewing angles.',
        quickActionId: 'auto_seating_200',
        quickActionLabelVi: 'Làm giúp luôn: Xếp bàn tiệc Gala cho 200 khách & kiểm tra tia nhìn',
        quickActionLabelEn: 'Do it for me: Layout Gala tables for 200 guests & check sightlines'
      },
      {
        id: 'music_show',
        keywords: /nhạc|bpm|timeline|cue|biên đạo|đạo diễn|drop|intro|timecode/i,
        titleVi: 'Cách lên kịch bản đèn & LED Matrix tự động theo BPM bài nhạc',
        titleEn: 'How to auto-generate BPM-synced lighting & LED Matrix show cues (A4)',
        answerVi:
          'HƯỚNG DẪN ĐẠO DIỄN SHOW THEO NHẠC:\n' +
          '1. Nhập tốc độ BPM và phong cách sự kiện (VD: "128 BPM EDM" hoặc "100 BPM Wedding") rồi bấm "Đạo diễn Nhạc & Đèn".\n' +
          '2. Hệ thống tự động tạo 5 phân đoạn chuẩn (Intro -> Verse -> Build-up -> Drop/Climax -> Outro) trên Timeline kèm hiệu ứng đèn và độ sáng Dimmer.',
        answerEn:
          'BPM MUSIC SHOW DIRECTOR GUIDE (A4):\n' +
          '1. Enter BPM and mood (e.g. "128 BPM EDM") and click "Music & Light Cues (A4)".\n' +
          '2. LumiStage generates 5 structured show sections (Intro, Verse, Build-up, Drop, Outro) synced to bar duration.',
        quickActionId: 'generate_edm_cues',
        quickActionLabelVi: 'Làm giúp luôn: Sinh kịch bản 5 Cue nhạc EDM 128 BPM',
        quickActionLabelEn: 'Do it for me: Generate 5 EDM 128 BPM show cues'
      },
      {
        id: 'bom_dxf_quote',
        keywords: /báo giá|bom|vật tư|dxf|autocad|cad|pdf|excel|csv|công suất|điện 3 pha|grouplife/i,
        titleVi: 'Cách xuất Bảng vật tư (BOM), Báo giá PDF/CSV và Bản vẽ AutoCAD .DXF',
        titleEn: 'How to export Auto BOM, Commercial Quotation PDF/CSV & 2D AutoCAD .DXF (D3–D5)',
        answerVi:
          'HƯỚNG DẪN BÓC TÁCH VẬT TƯ (BOM), BÁO GIÁ & BẢN VẼ AUTOCAD (.DXF):\n' +
          '1. Bấm nút "BOM & Báo giá" trên thanh công cụ trên cùng.\n' +
          '2. Điều chỉnh số ngày thuê, đơn giá từng hạng mục, chi phí vận chuyển và chế độ thuế (KCT / VAT 8% / 10%).\n' +
          '3. Bấm "In / PDF Báo giá", "Xuất Excel (CSV)", "Xuất AutoCAD .DXF" (Mặt bằng & Mặt đứng) hoặc "Nhập Mặt bằng .DXF" của địa điểm.',
        answerEn:
          'AUTO BOM, COMMERCIAL QUOTE & AUTOCAD .DXF GUIDE:\n' +
          '1. Click "BOM & Quote" in the top toolbar.\n' +
          '2. Customize rental days, unit prices, transport fees, and tax mode.\n' +
          '3. Export A4 PDF Quotation, Excel CSV, or 2D AutoCAD .DXF (Top View & Front Elevation), or import a venue .DXF floorplan.',
        quickActionId: 'open_bom_modal',
        quickActionLabelVi: 'Làm giúp luôn: Mở bảng BOM, Báo giá & Xuất AutoCAD .DXF',
        quickActionLabelEn: 'Do it for me: Open BOM, Quotation & AutoCAD .DXF modal'
      },
      {
        id: 'live_show_dmx',
        keywords: /chạy show|live|art-net|artnet|sacn|udp|hdmi|màn thật|khóa giao diện|remote|điện thoại/i,
        titleVi: 'Cách phát ra màn hình LED thật (HDMI 1:1), điều khiển DMX Art-Net/sACN & Khóa an toàn',
        titleEn: 'How to output 1:1 HDMI LED Wall, stream Art-Net/sACN DMX & lock live show UI (E1–E4)',
        answerVi:
          'HƯỚNG DẪN CHẠY SHOW THẬT (NHÓM E — E1..E4):\n' +
          '1. Bấm nút "Chạy Show" trên thanh công cụ để mở Bàn Điều Khiển Chạy Show Trực Tiếp.\n' +
          '2. E1 (DMX Art-Net / sACN): Chạy `node scripts/dmx-udp-bridge.mjs` trên máy tính và bật phát DMX 512 kênh ra bộ giải mã Art-Net (UDP 6454) hoặc sACN (UDP 5568).\n' +
          '3. E2 (Live LED Output): Bấm "Mở Cửa sổ Phát LED 1:1 (HDMI)" rồi kéo sang màn hình thứ 2 nối với bộ xử lý NovaStar.\n' +
          '4. E3 & E4: Bấm chuyển Cue trực tiếp trên điện thoại và bật "Khóa An toàn Chạy Show" để tránh bấm nhầm xoá/sửa sân khấu.',
        answerEn:
          'LIVE SHOW HARDWARE SUITE GUIDE (E1–E4):\n' +
          '1. Click "Live Show" in the top bar.\n' +
          '2. E1 (Art-Net / sACN): Run `node scripts/dmx-udp-bridge.mjs` and stream 512-channel DMX frames over UDP 6454 / 5568.\n' +
          '3. E2 (1:1 LED Wall Output): Launch the secondary HDMI output window for your NovaStar processor.\n' +
          '4. E3 & E4: Trigger cues from Mobile Lite and enable Safe Show Lock to prevent accidental edits.',
        quickActionId: 'open_live_show_modal',
        quickActionLabelVi: 'Làm giúp luôn: Mở Bàn Điều Khiển Chạy Show Thật',
        quickActionLabelEn: 'Do it for me: Open Live Show Hardware Console (E1–E4)'
      }
    ];

    function answerSoftwareGuide(queryText = '') {
      const q = String(queryText || '').trim();
      const matched = LUMI_HELP_TOPICS.find((t) => t.keywords.test(q)) || LUMI_HELP_TOPICS[0];
      const replyVi = matched.answerVi + '\n\nDanh mục Hướng dẫn nhanh:\n' + LUMI_HELP_TOPICS.map((t, idx) => `${idx + 1}. ${t.titleVi}`).join('\n');
      const replyEn = matched.answerEn + '\n\nAll Help Topics (A8):\n' + LUMI_HELP_TOPICS.map((t, idx) => `${idx + 1}. ${t.titleEn}`).join('\n');
      trackLumiEvent('guide_opened', { topicId: matched.id });
      return {
        topicId: matched.id,
        title: tr18(matched.titleVi, matched.titleEn),
        reply: tr18(replyVi, replyEn), replyVi, replyEn,
        quickActionId: matched.quickActionId,
        quickActionLabel: tr18(matched.quickActionLabelVi, matched.quickActionLabelEn),
        quickActionLabelVi: matched.quickActionLabelVi, quickActionLabelEn: matched.quickActionLabelEn
      };
    }

    function runQuickGuideAction(actionId) {
      switch (actionId) {
        case 'add_wing_leds':
          return previewStageCommands([
            { action: 'add_led', name: 'LED_WING_L_AI', widthM: 2.5, heightM: 4.0, pitchMm: 3.91, pos: [-5.5, 2.8, -1.8], yawDeg: 15 },
            { action: 'add_led', name: 'LED_WING_R_AI', widthM: 2.5, heightM: 4.0, pitchMm: 3.91, pos: [5.5, 2.8, -1.8], yawDeg: -15 }
          ]);
        case 'add_beam_rig':
          return previewStageCommands([{ action: 'add_light', count: 8, fixtureType: 'beam', color: '#38bdf8' }]);
        case 'auto_seating_200':
          return layoutAudienceSeating({ type: 'gala_round_table', guestCount: 200 });
        case 'generate_edm_cues':
          return generateMusicShowCues({ bpm: 128, mood: 'edm' });
        case 'open_bom_modal':
          openBomAndQuoteModal();
          return true;
        case 'open_live_show_modal':
          openLiveShowModal();
          return true;
        default:
          return false;
      }
    }

    // Bộ phân tích câu lệnh tiếng Việt cục bộ (Offline Fallback khi không có mạng / chưa đăng nhập)
    function parseStagePromptOffline(promptText) {
      const text = String(promptText || '').toLowerCase();
      const commands = [];
      let reply = '';

      // Phát hiện lệnh dịch chuyển tương đối (A2): "đẩy màn LED lùi 1m", "dịch bàn DJ sang phải 2m", "nâng màn LED lên 0.5m"
      const moveVerb = /(?:đẩy|day|dịch|dich|dời|doi|kéo|keo|lùi|lui|tiến|tien|nâng|nang|hạ|ha|move|shift)\b/i.test(text);
      const distMatch = text.match(/(\d+(?:[.,]\d+)?)\s*m\b/i);
      if (moveVerb && distMatch && !/(\d+)\s*[x×*]\s*(\d+)/.test(text)) {
        const dist = parseFloat(distMatch[1].replace(',', '.')) || 1.0;
        let dx = 0, dy = 0, dz = 0;
        if (/lùi|lui|ra sau|về sau|back/.test(text)) dz = -dist;
        else if (/tiến|tien|lên trước|ra trước|forward|front/.test(text)) dz = dist;
        if (/phải|phai|right/.test(text)) dx = dist;
        else if (/trái|trai|left/.test(text)) dx = -dist;
        if (/nâng|nang|cao lên|lên cao|up|raise/.test(text)) dy = dist;
        else if (/hạ|ha|thấp xuống|xuống|down|lower/.test(text)) dy = -dist;
        if (dx === 0 && dy === 0 && dz === 0) dz = -dist;

        if (/màn|man|led|screen/.test(text)) {
          const idxMatch = text.match(/(?:số|so|#)\s*(\d+)/i);
          const index = idxMatch ? Math.max(0, parseInt(idxMatch[1], 10) - 1) : 0;
          commands.push({ action: 'move_led', index, dx, dy, dz });
          reply = tr18(`Đã dịch chuyển màn hình LED (Δx=${dx}m, Δy=${dy}m, Δz=${dz}m).`, `Moved LED screen (Δx=${dx}m, Δy=${dy}m, Δz=${dz}m).`);
          return { reply, commands };
        }
        const propKind = /dj/.test(text)
          ? 'dj_booth'
          : /bục|buc|podium/.test(text)
          ? 'vip_podium'
          : /cổng|cong|arch/.test(text)
          ? 'backdrop_arch'
          : /bàn|ban|table/.test(text)
          ? 'gala_round_table'
          : '';
        commands.push({ action: 'move_prop', kind: propKind, dx, dy, dz });
        reply = tr18(`Đã dịch chuyển đạo cụ trên sân khấu (Δx=${dx}m, Δy=${dy}m, Δz=${dz}m).`, `Moved stage prop (Δx=${dx}m, Δy=${dy}m, Δz=${dz}m).`);
        return { reply, commands };
      }

      const sizeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*m?/i);
      const widthM = sizeMatch ? parseFloat(sizeMatch[1].replace(',', '.')) : null;
      const depthM = sizeMatch ? parseFloat(sizeMatch[2].replace(',', '.')) : null;
      const pitchMatch = text.match(/p\s*(2[.,]5|2[.,]6|2[.,]97|3[.,]91|4[.,]81)/i);
      const pitchMm = pitchMatch ? parseFloat(pitchMatch[1].replace(',', '.')) : null;
      const lightMatch = text.match(/(\d+)\s*(?:đèn|den|beam|par|moving)/i);
      const lightCount = lightMatch ? parseInt(lightMatch[1], 10) : null;

      if (/tiệc cưới|tiec cuoi|wedding|đám cưới/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'wedding', widthM, depthM, pitchMm, lightCount });
        reply = tr18("Đã dựng phương án Sân khấu Tiệc cưới Sang trọng kèm cổng vòm, đường dẫn Catwalk và pháo điện lạnh.", "Created a luxury wedding stage with arch, catwalk and cold sparks.");
      } else if (/edm|concert|đại nhạc hội|countdown|dj/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'concert', widthM, depthM, pitchMm, lightCount });
        reply = tr18("Đã dựng phương án Đại nhạc hội EDM / Countdown với hệ LED đa cánh, bàn DJ, Line Array và dàn Moving Head Beam.", "Created an EDM / Countdown stage with LED wings, DJ desk, line arrays and moving head beams.");
      } else if (/khai trương|khánh thành|ra mắt|grand opening|launch/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'grand_opening', widthM, depthM, pitchMm, lightCount });
        reply = tr18("Đã dựng phương án Sân khấu Lễ Khai trương / Ra mắt sản phẩm với cổng LED Arch và bục phát biểu VIP.", "Created a grand opening / product launch stage with LED arch and VIP podium.");
      } else if (/gala|year end|yep|tất niên/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'gala_dinner', widthM, depthM, pitchMm, lightCount });
        reply = tr18("Đã dựng phương án Sân khấu Gala Dinner / Year End Party kèm vòng LED Kinetic trần và bàn tiệc Gala.", "Created a Gala Dinner / Year End Party stage with overhead kinetic LED ring and banquet tables.");
      } else if (/ngoài trời|outdoor|beerfest|lễ hội/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'outdoor_festival', widthM, depthM, pitchMm, lightCount });
        reply = tr18("Đã dựng phương án Sân khấu Lễ hội Ngoài trời (Outdoor P4.81) kèm mái vòm Truss, rào chắn Mojo và trạm FOH.", "Created an outdoor festival stage (P4.81) with truss roof, Mojo barriers and FOH station.");
      } else if (/hội nghị|hoi nghi|doanh nghiệp|đại hội|conference|seminar/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'conference', widthM, depthM, pitchMm, lightCount });
        reply = tr18("Đã dựng phương án Sân khấu Hội nghị Doanh nghiệp với màn LED trung tâm, 2 màn cánh, bục VIP và bàn đại biểu IBM.", "Created a corporate conference stage with central LED, two LED wings, VIP podium and IBM delegate tables.");
      } else {
        if (widthM && depthM) {
          commands.push({ action: 'set_stage_size', widthM, depthM, heightM: 0.9 });
        }
        if (/thêm màn|them man|add led|màn led|man led/.test(text)) {
          commands.push({
            action: 'add_led',
            name: 'LED_CUSTOM_' + ((getEngine()?.surfaces?.length || 0) + 1),
            widthM: widthM || 6,
            heightM: depthM ? Math.min(6, depthM) : 3.5,
            pitchMm: pitchMm || 3.91,
            pos: [0, 2.6, -2.0]
          });
        }
        if (lightCount) {
          commands.push({ action: 'add_light', count: lightCount, fixtureType: /par|wash/.test(text) ? 'par' : 'beam' });
        }
        if (/tiết kiệm|tối ưu|giảm ngân sách|budget/.test(text)) {
          commands.push({ action: 'optimize_budget', pitchMm: 3.91, maxLights: 16 });
        }
        if (!commands.length) {
          commands.push({ action: 'load_template', templateId: 'gala_dinner', widthM, depthM, pitchMm, lightCount });
        }
        reply = tr18("Đã thực thi cập nhật cấu hình sân khấu 3D theo yêu cầu của bạn.", "Updated the 3D stage configuration as requested.");
      }
      return { reply, commands };
    }

    function currentStageContext() {
      const eng = getEngine();
      return {
        stageSizeM: {
          width: +(eng?.size?.width || 18).toFixed(2),
          depth: +(eng?.size?.depth || 10).toFixed(2),
          height: +(eng?.size?.height || 8).toFixed(2)
        },
        masterCanvasPx: eng?.master || { width: 3840, height: 1280 },
        screens: (eng?.surfaces || []).map((s) => ({
          id: s.id,
          name: s.name,
          wPx: s.w,
          hPx: s.h,
          widthM: +(s.physicalWidthM || s.physical?.width || 4).toFixed(2),
          heightM: +(s.physicalHeightM || s.physical?.height || 2.5).toFixed(2),
          pitchMm: s.pitchMm || 3.91
        })),
        lightCount: eng?.lights?.length || 0,
        props: (S.stageAssets16?.items || []).map((it) => ({ kind: it.kind, name: it.name, pos: it.pos }))
      };
    }

    async function runStageAiPrompt(promptText, mode = 'command', signal) {
      signal?.throwIfAborted();
      const cleanPrompt = String(promptText || '').trim();
      if (!cleanPrompt) throw new Error(tr18("Vui lòng nhập yêu cầu thiết kế sân khấu.", "Enter a stage design request."));
      const cloud = S.cloud16;
      const apiUrl = cloud?.apiUrl ? cloud.apiUrl('/ai/stage') : '/api/led-studio/ai/stage';
      const token = cloud?.state?.token || null;

      if (token || lumiState.byok.enabled) {
        try {
          if (!signal) window.busy?.(true, tr18("Đang xử lý yêu cầu AI…", "Processing AI request…"));
          const stageCtx = currentStageContext();
          const body = {
            prompt: cleanPrompt,
            mode,
            effort: lumiState.effort,
            stageState: stageCtx,
            stageContext: stageCtx,
            ...(lumiState.byok.enabled && lumiState.byok.apiKey
              ? {
                  byok: {
                    provider: lumiState.byok.provider,
                    apiKey: lumiState.byok.apiKey,
                    model: lumiState.byok.model,
                    baseUrl: lumiState.byok.baseUrl
                  }
                }
              : {})
          };
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            credentials: 'include',
            body: JSON.stringify(body),
            signal
          });
          const json = await res.json().catch(() => ({}));
          signal?.throwIfAborted();
          if (token !== (cloud?.state?.token || null)) throw new DOMException('Account changed', 'AbortError');
          if (!res.ok || !json.success) {
            throw new Error(json?.message || tr18(`Lỗi gọi AI HTTP ${res.status}`, `AI request failed: HTTP ${res.status}`));
          }
          const data = json.data || {};
          const bill = data.billing || data;
          const propText =
            typeof data.proposal === 'object' && data.proposal?.summary
              ? data.proposal.summary
              : typeof data.proposal === 'string'
              ? data.proposal
              : '';
          lumiState.lastAiReply = data.reply || propText || data.auditSummary || '';
          lumiState.lastAiUsage =
            data.usage ||
            (bill.promptTokens !== undefined
              ? {
                  promptTokens: bill.promptTokens,
                  completionTokens: bill.completionTokens,
                  totalTokens: bill.totalTokens
                }
              : null);
          lumiState.lastAiUsage = { ...(lumiState.lastAiUsage || {}), creditsCharged: data.creditsCharged ?? bill.creditCharged ?? 0 };
          const nextBal = data.balanceAfter ?? bill.remainingBalance;
          if (typeof nextBal === 'number') { lumiState.balanceCredits = nextBal; lumiState.balanceReady = true; }
          const nextFree = data.freeAiCreditsRemaining ?? bill.remainingFreeAiCredits;
          if (typeof nextFree === 'number') {
            lumiState.freeAiCreditsRemaining = nextFree;
          }
          if (Array.isArray(data.commands) && data.commands.length) {
            previewStageCommands(data.commands);
          }
          updateTopbarBadge18();
          return data;
        } catch (err) {
          // Nếu lỗi mạng cục bộ thì fallback sang bộ giải mã offline
          if (err?.name !== 'AbortError' && !token && !lumiState.byok.enabled) {
            const local = parseStagePromptOffline(cleanPrompt);
            previewStageCommands(local.commands);
            return local;
          }
          throw err;
        } finally {
          if (!signal) window.busy?.(false);
        }
      }

      const local = parseStagePromptOffline(cleanPrompt);
      previewStageCommands(local.commands);
      lumiState.lastAiReply = local.reply;
      return local;
    }

    // =========================================================================
    // A6 & D4 — TỰ ĐỘNG BÓC TÁCH KHỐI LƯỢNG (BOM) & KIỂM TOÁN KỸ THUẬT SÂN KHẤU
    // =========================================================================
    const DEFAULT_UNIT_PRICES_VND = {
      led_p2_5: 950000,   // VNĐ / m2 / ngày
      led_p2_97: 780000,  // VNĐ / m2 / ngày
      led_p3_91: 580000,  // VNĐ / m2 / ngày
      led_p4_81: 520000,  // VNĐ / m2 / ngày
      beam_230: 350000,   // VNĐ / đèn / ngày
      par_led: 120000,    // VNĐ / đèn / ngày
      truss_m: 150000,    // VNĐ / mét dài / ngày
      stage_m2: 140000,   // VNĐ / m2 sàn / ngày
      processor: 2500000, // VNĐ / bộ xử lý NovaStar / ngày
      prop_unit: 850000   // VNĐ / hạng mục đạo cụ / ngày
    };

    function computeStageBom() {
      const eng = getEngine();
      const surfaces = Array.isArray(eng?.surfaces) ? eng.surfaces : [];
      const lights = Array.isArray(eng?.lights) ? eng.lights.filter((l) => l.enabled !== false) : [];
      const props = Array.isArray(S.stageAssets16?.items) ? S.stageAssets16.items : [];

      let totalLedAreaM2 = 0;
      let totalCabinets500 = 0;
      let totalPixels = 0;
      let totalLedMaxKw = 0;
      let totalLedAvgKw = 0;
      let totalLedWeightKg = 0;

      const ledItems = surfaces.map((s, idx) => {
        const pitch = Number(s.pitchMm) || 3.91;
        const wM = +(Number(s.physicalWidthM || s.physical?.width || (s.w * pitch) / 1000 || 4)).toFixed(2);
        const hM = +(Number(s.physicalHeightM || s.physical?.height || (s.h * pitch) / 1000 || 2.5)).toFixed(2);
        const areaM2 = +(wM * hM).toFixed(2);
        const cols500 = Math.max(1, Math.ceil(wM / 0.5));
        const rows500 = Math.max(1, Math.ceil(hM / 0.5));
        const cabinets500 = cols500 * rows500;
        const pixels = (Number(s.w) || 1920) * (Number(s.h) || 1080);
        const maxKw = +(areaM2 * 0.65).toFixed(2); // ~650W/m2 max
        const avgKw = +(areaM2 * 0.28).toFixed(2); // ~280W/m2 average
        const weightKg = Math.round(cabinets500 * 7.8); // ~7.8kg / cabinet 500x500 die-cast

        totalLedAreaM2 += areaM2;
        totalCabinets500 += cabinets500;
        totalPixels += pixels;
        totalLedMaxKw += maxKw;
        totalLedAvgKw += avgKw;
        totalLedWeightKg += weightKg;

        const priceKey = pitch <= 2.6 ? 'led_p2_5' : pitch <= 3.1 ? 'led_p2_97' : pitch <= 4.2 ? 'led_p3_91' : 'led_p4_81';
        const unitPrice = Number(lumiState.quoteConfig.priceOverrides[`led_${s.id}`] || DEFAULT_UNIT_PRICES_VND[priceKey]);

        return {
          code: `LED-${String(idx + 1).padStart(2, '0')}`,
          id: s.id,
          name: s.name || `Màn LED #${idx + 1}`,
          pitchMm: pitch,
          widthM: wM,
          heightM: hM,
          areaM2,
          resolution: `${s.w} × ${s.h}`,
          pixels,
          cabinets500,
          maxKw,
          avgKw,
          weightKg,
          unit: 'm²',
          qty: areaM2,
          unitPriceVnd: unitPrice
        };
      });

      const glbRigs = typeof S.stageAssets16?.fixtureRigs16?.values === 'function'
        ? [...S.stageAssets16.fixtureRigs16.values()]
        : [];
      const glbFixtureKw = glbRigs.reduce((s, r) => s + ((Number(r.oflFixture?.powerW) || 380) / 1000), 0);
      const glbFixtureWeightKg = glbRigs.reduce((s, r) => s + (Number(r.oflFixture?.weightKg) || 17), 0);
      const engineBeamCount = lights.filter((l) => (l.angle || 15) <= 18 || /beam|pointe|spot/i.test(l.name)).length;
      const washCount = Math.max(0, lights.length - engineBeamCount);
      const beamCount = engineBeamCount + glbRigs.length;
      const totalLights = lights.length + glbRigs.length;
      const lightMaxKw = +(engineBeamCount * 0.38 + washCount * 0.2 + glbFixtureKw).toFixed(2);
      const lightWeightKg = Math.round(engineBeamCount * 17 + washCount * 4 + glbFixtureWeightKg);

      const stageW = +(eng?.size?.width || 16).toFixed(1);
      const stageD = +(eng?.size?.depth || 8).toFixed(1);
      const stageAreaM2 = +(stageW * stageD).toFixed(1);
      const trussMeters = Math.round(stageW * 2 + stageD * 2 + 24);
      const trussWeightKg = Math.round(trussMeters * 6.5);

      const totalMaxKw = +(totalLedMaxKw + lightMaxKw + 3.0).toFixed(2);
      const totalAvgKw = +(totalLedAvgKw + lightMaxKw * 0.7 + 1.8).toFixed(2);
      // I_3phase = P(W) / (sqrt(3) * 380V * cosPhi(0.85))
      const currentPerPhaseAmps = Math.ceil((totalMaxKw * 1000) / (1.732 * 380 * 0.85));
      const rj45PortsNeeded = Math.max(1, Math.ceil(totalPixels / 650000));
      const recommendedProcessor =
        totalPixels <= 2300000
          ? 'NovaStar VX4S / VX400 (4 cổng RJ45 · tối đa 2.6M px)'
          : totalPixels <= 3900000
          ? 'NovaStar VX600 (6 cổng RJ45 · tối đa 3.9M px)'
          : totalPixels <= 6500000
          ? 'NovaStar VX1000 (10 cổng RJ45 · tối đa 6.5M px)'
          : 'NovaStar H2 / 2× VX1000 (Ghép đồng bộ Genlock)';

      const totalRiggingWeightKg = totalLedWeightKg + lightWeightKg + trussWeightKg;

      const warnings = [];
      if (totalPixels > 6500000) {
        warnings.push(`Tổng điểm ảnh (${(totalPixels / 1e6).toFixed(2)}M px) vượt ngưỡng 1 bộ xử lý VX1000 đơn lẻ — cần cấu hình H2 hoặc 2× VX1000.`);
      }
      if (currentPerPhaseAmps > 63) {
        warnings.push(`Dòng tải đỉnh 3 pha (~${currentPerPhaseAmps}A/pha) vượt chuẩn tủ nguồn 63A — cần tủ phân phối nguồn 100A–125A 3 pha 5 dây.`);
      }
      if (totalRiggingWeightKg > 1800) {
        warnings.push(`Tổng tải treo (${totalRiggingWeightKg} kg) lớn — bắt buộc dùng Palăng xích điện 1 tấn × 6–8 điểm và giằng chống gió theo TCVN 2737:2023.`);
      }

      const bomRows = [
        ...ledItems.map((it) => ({
          key: `led_${it.id}`,
          category: 'Màn hình LED',
          name: `${it.name} (P${it.pitchMm} · ${it.widthM}×${it.heightM}m · ${it.cabinets500} cab 500×500)`,
          spec: `${it.resolution} px · ${it.maxKw} kW`,
          unit: 'm²',
          qty: it.areaM2,
          unitPriceVnd: it.unitPriceVnd
        })),
        {
          key: 'processor',
          category: 'Điều khiển LED',
          name: `Bộ xử lý hình ảnh ${recommendedProcessor}`,
          spec: `${rj45PortsNeeded} đường cáp mạng Cat6A chính + dự phòng`,
          unit: 'bộ',
          qty: totalPixels > 6500000 ? 2 : 1,
          unitPriceVnd: Number(lumiState.quoteConfig.priceOverrides.processor || DEFAULT_UNIT_PRICES_VND.processor)
        }
      ];

      if (beamCount > 0) {
        bomRows.push({
          key: 'beam_230',
          category: 'Ánh sáng DMX',
          name: 'Đèn Moving Head Beam 230W/350W IP20/IP65',
          spec: '16CH DMX512 · Gobo + Prism',
          unit: 'cây',
          qty: beamCount,
          unitPriceVnd: Number(lumiState.quoteConfig.priceOverrides.beam_230 || DEFAULT_UNIT_PRICES_VND.beam_230)
        });
      }
      if (washCount > 0) {
        bomRows.push({
          key: 'par_led',
          category: 'Ánh sáng DMX',
          name: 'Đèn Par LED 54×3W / COB Blinder Wash',
          spec: '8CH DMX512 · RGBW / Warm White',
          unit: 'cây',
          qty: washCount,
          unitPriceVnd: Number(lumiState.quoteConfig.priceOverrides.par_led || DEFAULT_UNIT_PRICES_VND.par_led)
        });
      }
      bomRows.push(
        {
          key: 'truss_m',
          category: 'Kết cấu & Khung Truss',
          name: 'Hệ khung Truss hợp kim nhôm 300×300 / 400×400mm + Palăng',
          spec: `Tải treo tổng ~${totalRiggingWeightKg} kg`,
          unit: 'm dài',
          qty: trussMeters,
          unitPriceVnd: Number(lumiState.quoteConfig.priceOverrides.truss_m || DEFAULT_UNIT_PRICES_VND.truss_m)
        },
        {
          key: 'stage_m2',
          category: 'Sàn sân khấu',
          name: `Sàn sân khấu lắp ghép (${stageW}×${stageD}m) bọc thảm/bạt đen`,
          spec: 'Khung sắt hộp mạ kẽm + ván chịu lực 18mm',
          unit: 'm²',
          qty: stageAreaM2,
          unitPriceVnd: Number(lumiState.quoteConfig.priceOverrides.stage_m2 || DEFAULT_UNIT_PRICES_VND.stage_m2)
        }
      );

      for (const p of props) {
        bomRows.push({
          key: `prop_${p.id}`,
          category: 'Đạo cụ & Hiệu ứng 3D',
          name: p.name,
          spec: `Vị trí (${(p.pos || [0, 0, 0]).join(', ')}m)`,
          unit: 'bộ',
          qty: 1,
          unitPriceVnd: Number(lumiState.quoteConfig.priceOverrides[`prop_${p.id}`] || DEFAULT_UNIT_PRICES_VND.prop_unit)
        });
      }

      return {
        ledItems,
        bomRows,
        summary: {
          stageW,
          stageD,
          stageAreaM2,
          totalLedAreaM2: +totalLedAreaM2.toFixed(2),
          totalCabinets500,
          totalPixels,
          rj45PortsNeeded,
          recommendedProcessor,
          beamCount,
          washCount,
          totalLights,
          totalMaxKw,
          totalAvgKw,
          currentPerPhaseAmps,
          totalRiggingWeightKg,
          warnings
        }
      };
    }

    function buildClientProposalText() {
      const bom = computeStageBom();
      const s = bom.summary;
      const lines = [
        `THUYẾT MINH PHƯƠNG ÁN KỸ THUẬT SÂN KHẤU 3D — LUMISTAGE`,
        `Đơn vị lập phương án: ${LUMI_BRAND.legalEntity}`,
        `Dự án: ${window.state?.model?.name || 'Sân khấu Sự kiện 3D'}`,
        `------------------------------------------------------------`,
        `1. QUY MÔ KHÔNG GIAN SÂN KHẤU:`,
        `   - Kích thước mặt sàn: Rộng ${s.stageW}m × Sâu ${s.stageD}m (${s.stageAreaM2} m²).`,
        `   - Bố cục hướng nhìn chuẩn 3D tối ưu tầm nhìn khán giả và góc máy quay truyền hình.`,
        ``,
        `2. HỆ THỐNG MÀN HÌNH LED & XỬ LÝ HÌNH ẢNH:`,
        `   - Tổng diện tích màn hình LED: ${s.totalLedAreaM2} m² (${s.totalCabinets500} cabinet 500×500mm).`,
        ...bom.ledItems.map(
          (it) =>
            `   + ${it.name}: ${it.widthM}m × ${it.heightM}m (${it.areaM2} m²) · Pixel Pitch P${it.pitchMm} · Độ phân giải ${it.resolution} px (${it.cabinets500} cab).`
        ),
        `   - Tổng điểm ảnh toàn hệ thống: ${s.totalPixels.toLocaleString('vi-VN')} pixels.`,
        `   - Bộ xử lý khuyến nghị: ${s.recommendedProcessor} (${s.rj45PortsNeeded} cổng mạng RJ45 Cat6A).`,
        ``,
        `3. HỆ THỐNG ÁNH SÁNG BIỂU DIỄN & ĐẠO CỤ:`,
        `   - Tổng số đèn sân khấu: ${s.totalLights} thiết bị (${s.beamCount} Moving Head Beam + ${s.washCount} Par LED / Wash).`,
        `   - Đồng bộ kịch bản ánh sáng DMX512 & hiệu ứng LED Matrix 3D theo âm nhạc.`,
        ``,
        `4. AN TOÀN ĐIỆN 3 PHA & KẾT CẤU TREO (TCVN 2737:2023):`,
        `   - Công suất điện tiêu thụ: Trung bình ${s.totalAvgKw} kW / Đỉnh ${s.totalMaxKw} kW.`,
        `   - Nguồn cấp yêu cầu: Điện 3 pha 380V (5 dây: 3P + 1N + 1PE), dòng định mức ~${s.currentPerPhaseAmps}A / pha.`,
        `   - Tổng tải trọng treo trên hệ khung Truss: ~${s.totalRiggingWeightKg} kg.`,
        ...(s.warnings.length ? [`   - Lưu ý kỹ thuật: ${s.warnings.join(' | ')}`] : [])
      ];
      return lines.join('\n');
    }

    // =========================================================================
    // D3 & D3b — XUẤT BẢN VẼ AUTOCAD .DXF 2D & NHẬP MẶT BẰNG .DXF
    // =========================================================================
    function dxfLine(layer, x1, y1, x2, y2) {
      return [
        '0', 'LINE',
        '8', layer,
        '10', (+x1).toFixed(3),
        '20', (+y1).toFixed(3),
        '30', '0.0',
        '11', (+x2).toFixed(3),
        '21', (+y2).toFixed(3),
        '31', '0.0'
      ].join('\n');
    }

    function dxfRect(layer, x, y, w, h) {
      const x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2;
      return [
        dxfLine(layer, x0, y0, x1, y0),
        dxfLine(layer, x1, y0, x1, y1),
        dxfLine(layer, x1, y1, x0, y1),
        dxfLine(layer, x0, y1, x0, y0)
      ].join('\n');
    }

    function dxfText(layer, x, y, height, text) {
      const safe = String(text || '').replace(/[\r\n]+/g, ' ');
      return [
        '0', 'TEXT',
        '8', layer,
        '10', (+x).toFixed(3),
        '20', (+y).toFixed(3),
        '30', '0.0',
        '40', (+height).toFixed(3),
        '1', safe
      ].join('\n');
    }

    function generateStageDxf(opts = {}) {
      const eng = getEngine();
      const bom = computeStageBom();
      const w = bom.summary.stageW || 16;
      const d = bom.summary.stageD || 8;
      const entities = [];

      // 1. MẶT BẰNG (TOP VIEW — gốc tại (0, 0))
      entities.push(dxfText('DIMENSIONS', -w / 2, d / 2 + 1.8, 0.45, `MAT BANG SAN KHAU (TOP VIEW) - ${w}m x ${d}m`));
      entities.push(dxfRect('STAGE_PLATFORM', 0, 0, w, d));
      if (opts?.watermark) {
        entities.push(dxfText('WATERMARK', -w / 2, -d / 2 - 1.2, 0.35, LUMI_BRAND.watermarkText));
      }

      for (const s of eng?.surfaces || []) {
        const c = s.mesh?.bounds?.center || [0, 2.5, -2];
        const sw = Number(s.physicalWidthM || s.physical?.width || 4);
        entities.push(dxfRect('LED_SCREENS', c[0], -c[2], sw, 0.25));
        entities.push(dxfText('LED_SCREENS', c[0] - sw * 0.4, -c[2] + 0.3, 0.25, `${s.name} (${sw}m P${s.pitchMm || 3.91})`));
      }

      for (const l of eng?.lights || []) {
        if (l.enabled === false) continue;
        const px = l.pos?.[0] || 0, pz = -(l.pos?.[2] || 0);
        entities.push(dxfRect('LIGHT_FIXTURES', px, pz, 0.3, 0.3));
      }

      // 2. MẶT ĐỨNG CHÍNH DIỆN (FRONT ELEVATION — dịch sang phải (w + 8, 0))
      const ox = w + 10;
      entities.push(dxfText('DIMENSIONS', ox - w / 2, 7.5, 0.45, `MAT DUNG CHINH DIEN (FRONT ELEVATION)`));
      entities.push(dxfRect('STAGE_PLATFORM', ox, 0.45, w, 0.9));

      for (const s of eng?.surfaces || []) {
        const c = s.mesh?.bounds?.center || [0, 2.8, -2];
        const sw = Number(s.physicalWidthM || s.physical?.width || 4);
        const sh = Number(s.physicalHeightM || s.physical?.height || 3);
        entities.push(dxfRect('LED_SCREENS', ox + c[0], c[1], sw, sh));
        entities.push(dxfText('LED_SCREENS', ox + c[0] - sw * 0.42, c[1], 0.24, `${s.name} ${sw}x${sh}m (${s.w}x${s.h}px)`));
      }

      return [
        '0', 'SECTION',
        '2', 'HEADER',
        '9', '$INSUNITS',
        '70', '6', // 6 = Meters
        '0', 'ENDSEC',
        '0', 'SECTION',
        '2', 'ENTITIES',
        entities.join('\n'),
        '0', 'ENDSEC',
        '0', 'EOF'
      ].join('\n');
    }

    async function exportStageDxf() {
      const ok = await ensureExportAllowed('dxf_cad');
      if (!ok) return null;
      const watermark = shouldWatermarkExport();
      const dxf = generateStageDxf({ watermark });
      const name = (window.state?.model?.name || 'LumiStage').replace(/[^a-zA-Z0-9_-]/g, '_');
      window.downloadText?.(`${name}_2D_CAD.dxf`, dxf);
      window.toast?.(tr18("Đã xuất bản vẽ kỹ thuật 2D AutoCAD (.dxf) Mặt bằng & Mặt đứng (đơn vị: mét).", "Exported AutoCAD (.dxf) floor plan and elevation (units: meters)."));
      return dxf;
    }

    // D3b: Nhập mặt bằng .DXF 2D thành lưới tham chiếu trên sàn 3D
    function parseDxfFloorplan(dxfText, unitScale = 0.001) {
      const rawLines = String(dxfText || '').replace(/\r\n/g, '\n').split('\n');
      const pairs = [];
      for (let i = 0; i + 1 < rawLines.length; i += 2) {
        const code = parseInt(rawLines[i].trim(), 10);
        const val = rawLines[i + 1].trim();
        if (!Number.isNaN(code)) pairs.push([code, val]);
      }

      const segments = [];
      let i = 0;
      while (i < pairs.length) {
        const [code, val] = pairs[i];
        if (code === 0 && val === 'LINE') {
          let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
          i++;
          while (i < pairs.length && pairs[i][0] !== 0) {
            const [c, v] = pairs[i];
            if (c === 10) x1 = parseFloat(v) || 0;
            else if (c === 20) y1 = parseFloat(v) || 0;
            else if (c === 11) x2 = parseFloat(v) || 0;
            else if (c === 21) y2 = parseFloat(v) || 0;
            i++;
          }
          segments.push([x1 * unitScale, y1 * unitScale, x2 * unitScale, y2 * unitScale]);
          continue;
        }
        if (code === 0 && val === 'LWPOLYLINE') {
          const pts = [];
          let curX = null;
          let closed = false;
          i++;
          while (i < pairs.length && pairs[i][0] !== 0) {
            const [c, v] = pairs[i];
            if (c === 70 && (parseInt(v, 10) & 1)) closed = true;
            else if (c === 10) curX = parseFloat(v) || 0;
            else if (c === 20 && curX !== null) {
              pts.push([curX * unitScale, (parseFloat(v) || 0) * unitScale]);
              curX = null;
            }
            i++;
          }
          for (let k = 0; k + 1 < pts.length; k++) {
            segments.push([pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]]);
          }
          if (closed && pts.length > 2) {
            const last = pts[pts.length - 1];
            segments.push([last[0], last[1], pts[0][0], pts[0][1]]);
          }
          continue;
        }
        i++;
      }
      return segments;
    }

    async function importDxfFloorplanFile(file, unitScale = 0.001) {
      if (!file) return 0;
      const text = await file.text();
      let segments = parseDxfFloorplan(text, unitScale);
      if (!segments.length) {
        throw new Error(tr18("Không tìm thấy nét vẽ LINE / LWPOLYLINE trong tệp .DXF.", "No LINE / LWPOLYLINE entities found in the .DXF file."));
      }
      // Tự động căn tâm mặt bằng về gốc (0, 0) và kiểm tra tỷ lệ mét/mm
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const [x1, y1, x2, y2] of segments) {
        minX = Math.min(minX, x1, x2);
        maxX = Math.max(maxX, x1, x2);
        minY = Math.min(minY, y1, y2);
        maxY = Math.max(maxY, y1, y2);
      }
      const span = Math.max(maxX - minX, maxY - minY);
      let adjust = 1;
      if (span < 0.2) adjust = 1000; // File vốn đã ở đơn vị mét nhưng nhân 0.001
      else if (span > 500) adjust = 0.001;
      const cx = (minX + maxX) * 0.5 * adjust;
      const cy = (minY + maxY) * 0.5 * adjust;

      const eng = getEngine();
      if (!eng || typeof window.barBetween !== 'function') return segments.length;
      window.checkpoint?.();
      // Xoá mặt bằng DXF cũ nếu có
      eng.stage = eng.stage.filter((m) => !m._isDxfFloorplan18);
      const maxSegs = Math.min(segments.length, 600);
      for (let idx = 0; idx < maxSegs; idx++) {
        const [x1, y1, x2, y2] = segments[idx];
        const a = [x1 * adjust - cx, 0.03, -(y1 * adjust - cy)];
        const b = [x2 * adjust - cx, 0.03, -(y2 * adjust - cy)];
        if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 0.05) continue;
        const m = window.barBetween('CAD Floorplan Line', a, b, 0.035, [0.22, 0.74, 0.97, 1]);
        m._isDxfFloorplan18 = true;
        eng.stage.push(m);
      }
      eng._stageBatchDirty = true;
      eng.computeBounds?.();
      window.renderUI?.();
      window.toast?.(tr18(`Đã nhập mặt bằng CAD 2D (${maxSegs} nét vẽ) lên sàn sân khấu 3D.`, `Imported 2D CAD floor plan (${maxSegs} lines) onto the 3D stage.`));
      return maxSegs;
    }

    // =========================================================================
    // BILLING, CREDITS & EXPORT WATERMARK GATE (1 CREDIT = 100 VNĐ)
    // =========================================================================
    function shouldWatermarkExport() {
      if (lumiState._activeExportPassGranted) {
        lumiState._activeExportPassGranted = false;
        return false;
      }
      if (lumiState.isProActive || lumiState.projectUnlocked) return false;
      if (lumiState.singleExportPasses > 0) return false;
      const hasToken = Boolean(S.cloud16?.state?.token || window.localStorage?.getItem?.('alpha_studio_token'));
      if (!hasToken) return false; // Chế độ Local/Offline mặc định không khoá tính năng cũ
      return true;
    }

    async function refreshBillingStatus() {
      const cloud = S.cloud16;
      const token = cloud?.state?.token;
      if (!token) return lumiState;
      try {
        const res = await fetch(cloud.apiUrl('/billing/status'), {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success && json.data && token === cloud.state?.token) {
          lumiState.balanceReady = true;
          const sub = json.data.subscription || json.data;
          const isPro = Boolean(sub.proActive ?? sub.isProActive ?? json.data.isProActive);
          lumiState.tier = sub.plan || json.data.tier || (isPro ? 'pro' : 'free');
          lumiState.isProActive = isPro;
          lumiState.proExpiresAt = sub.expiresAt || json.data.proExpiresAt || null;
          lumiState.balanceCredits = Number(json.data.balanceCredits ?? json.data.balance ?? 0);
          lumiState.freeAiCreditsRemaining = Number(sub.freeAiCreditsRemaining ?? json.data.freeAiCreditsRemaining ?? 0);
          lumiState.singleExportPasses = Number(sub.singleExportCredits ?? json.data.singleExportPasses ?? 0);
          const unlockedKeys = Array.isArray(sub.unlockedProjectKeys) ? sub.unlockedProjectKeys : [];
          const currProjId = cloud.state?.lastSavedProjectId;
          if (currProjId && unlockedKeys.includes(String(currProjId))) {
            lumiState.projectUnlocked = true;
          }
          updateTopbarBadge18();
        }
      } catch {
        // ignore network errors
      }
      return lumiState;
    }

    async function purchaseLumiProduct(productKey, projectId = null) {
      const cloud = S.cloud16;
      const token = cloud?.state?.token;
      if (!token) {
        window.toast?.(tr18("Vui lòng đăng nhập tài khoản Alpha Studio để thanh toán bằng Credit.", "Sign in to Alpha Studio to pay with credits."));
        return null;
      }
      try {
        window.busy?.(true, tr18("Đang xử lý giao dịch Credit LumiStage...", "Processing credit transaction..."));
        const resolvedProjId = projectId || cloud.state.lastSavedProjectId || undefined;
        const res = await fetch(cloud.apiUrl('/billing/checkout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            productId: productKey,
            productKey,
            projectId: resolvedProjId,
            projectKey: resolvedProjId
          })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json?.message || tr18("Giao dịch không thành công.", "Transaction failed."));
        }
        await refreshBillingStatus();
        if (productKey === 'lumi_unlock_project') lumiState.projectUnlocked = true;
        window.toast?.(json.message || tr18("Đã kích hoạt thành công bằng Credit", "Successfully activated with credits"));
        return json.data;
      } catch (err) {
        window.toast?.(err?.message || String(err));
        return null;
      } finally {
        window.busy?.(false);
      }
    }

    async function ensureExportAllowed(exportType = '4k_png') {
      if (lumiState.isProActive || lumiState.projectUnlocked) return true;
      if (lumiState.singleExportPasses > 0) {
        lumiState.singleExportPasses = Math.max(0, lumiState.singleExportPasses - 1);
        lumiState._activeExportPassGranted = true;
        const token = S.cloud16?.state?.token;
        if (token && typeof fetch === 'function' && S.cloud16?.apiUrl) {
          await fetch(S.cloud16.apiUrl('/billing/consume-export'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            credentials: 'include',
            body: JSON.stringify({ exportType })
          }).catch(() => {});
        }
        return true;
      }
      return true;
    }

    // =========================================================================
    // D3 & D5 — IN HỒ SƠ KỸ THUẬT PDF & BÁO GIÁ THƯƠNG MẠI (CÔNG TY GROUPLIFE)
    // =========================================================================
    function exportQuotationCsv() {
      const bom = computeStageBom();
      const q = lumiState.quoteConfig;
      const days = Math.max(1, Number(q.rentalDays) || 1);
      const rows = [
        ['CONG TY TNHH MTV GROUPLIFE - BAO GIA THUE & THIET KE SAN KHAU 3D LUMISTAGE'],
        ['Khach hang', q.clientName, 'Ngay bao gia', q.eventDate, 'So ngay thue', String(days)],
        [],
        ['STT', 'Hang muc', 'Ten thiet bi / Quy cach', 'Thong so ky thuat', 'DVT', 'So luong', 'Don gia (VND)', 'So ngay', 'Thanh tien (VND)']
      ];
      let subTotal = 0;
      bom.bomRows.forEach((r, idx) => {
        const lineTotal = Math.round(r.qty * r.unitPriceVnd * days);
        subTotal += lineTotal;
        rows.push([idx + 1, r.category, r.name, r.spec, r.unit, r.qty, r.unitPriceVnd, days, lineTotal]);
      });
      rows.push(['', 'Chi phi van chuyen', 'Van chuyen 2 chieu', '', 'goi', 1, q.transportFeeVnd, 1, q.transportFeeVnd]);
      rows.push(['', 'Chi phi lap dat & van hanh', 'Doi ngu ky thuat LED & Anh sang', '', 'goi', 1, q.setupFeeVnd, 1, q.setupFeeVnd]);
      const gross = subTotal + Number(q.transportFeeVnd || 0) + Number(q.setupFeeVnd || 0);
      const discount = Math.round((gross * (Number(q.discountPercent) || 0)) / 100);
      const afterDiscount = gross - discount;
      const vatRate = q.vatMode === '10' ? 0.1 : q.vatMode === '8' ? 0.08 : 0;
      const vatAmount = Math.round(afterDiscount * vatRate);
      const grandTotal = afterDiscount + vatAmount;
      rows.push([], ['', '', 'TONG CONG TRUOC THUE', '', '', '', '', '', afterDiscount]);
      rows.push(['', '', `THUE GTGT (${q.vatMode === 'KCT' ? 'KCT - Khong chiu thue' : q.vatMode + '%'})`, '', '', '', '', '', vatAmount]);
      rows.push(['', '', 'TONG THANH TOAN (VND)', '', '', '', '', '', grandTotal]);

      const csv = '\uFEFF' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
      window.downloadText?.(`Bao_Gia_LumiStage_${q.eventDate}.csv`, csv);
      window.toast?.(tr18("Đã xuất bảng báo giá thương mại (.CSV mở bằng Excel).", "Exported quotation (.CSV for Excel)."));
      return csv;
    }

    function printStageDocument(mode = 'quote') {
      const bom = computeStageBom();
      const s = bom.summary;
      const q = lumiState.quoteConfig;
      const days = Math.max(1, Number(q.rentalDays) || 1);
      const subTotal = bom.bomRows.reduce((acc, r) => acc + Math.round(r.qty * r.unitPriceVnd * days), 0);
      const gross = subTotal + Number(q.transportFeeVnd || 0) + Number(q.setupFeeVnd || 0);
      const discount = Math.round((gross * (Number(q.discountPercent) || 0)) / 100);
      const afterDiscount = gross - discount;
      const vatRate = q.vatMode === '10' ? 0.1 : q.vatMode === '8' ? 0.08 : 0;
      const vatAmount = Math.round(afterDiscount * vatRate);
      const grandTotal = afterDiscount + vatAmount;

      let previewDataUrl = '';
      try {
        const shotCanvas = S.capture142?.captureFrame ? S.capture142.captureFrame({ width: 1280, height: 720 }) : null;
        if (shotCanvas) previewDataUrl = shotCanvas.toDataURL('image/png');
      } catch {
        // ignore screenshot error in headless mode
      }

      const win = window.open('', '_blank', 'width=1024,height=800');
      if (!win) {
        window.toast?.(tr18("Trình duyệt chặn cửa sổ In PDF. Hãy cho phép pop-up rồi bấm lại.", "The browser blocked the PDF print window. Allow pop-ups and try again."));
        return false;
      }

      const title = mode === 'tech'
        ? `HỒ SƠ KỸ THUẬT SÂN KHẤU 3D & PIXEL MAP — ${window.state?.model?.name || 'LumiStage'}`
        : `BÁO GIÁ THIẾT KẾ & THI CÔNG SÂN KHẤU 3D — ${window.state?.model?.name || 'LumiStage'}`;

      const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc18(title)}</title>
      <style>
        body{font-family:Segoe UI,Arial,sans-serif;color:#0f172a;margin:28px;line-height:1.45}
        .head{display:flex;justify-content:space-between;border-bottom:2px solid #0284c7;padding-bottom:12px;margin-bottom:18px}
        h1{font-size:20px;margin:0 0 4px;color:#0369a1}
        table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}
        th,td{border:1px solid #cbd5e1;padding:7px 9px;text-align:left}
        th{background:#f1f5f9;font-weight:700}
        .num{text-align:right}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}
        .card{border:1px solid #cbd5e1;border-radius:6px;padding:10px;background:#f8fafc}
        .shot{width:100%;max-height:340px;object-fit:contain;border-radius:6px;border:1px solid #cbd5e1;background:#080b13;margin:10px 0}
        @media print{.no-print{display:none}}
      </style></head><body>
      <div class="no-print" style="margin-bottom:14px;text-align:right">
        <button onclick="window.print()" style="padding:8px 16px;background:#0284c7;color:#fff;border:0;border-radius:6px;cursor:pointer;font-weight:600">In / Lưu thành PDF (Chuẩn A4)</button>
      </div>
      <div class="head">
        <div>
          <h1>${esc18(LUMI_BRAND.legalEntity)}</h1>
          <div>Nền tảng Thiết kế Sân khấu 3D <strong>${esc18(LUMI_BRAND.name)}</strong> (${esc18(LUMI_BRAND.tagline)})</div>
          <small>${esc18(LUMI_BRAND.taxNote)}</small>
        </div>
        <div style="text-align:right">
          <strong>${esc18(title)}</strong><br>
          <span>Khách hàng: ${esc18(q.clientName)}</span><br>
          <small>Ngày lập: ${esc18(q.eventDate)} · Số ngày: ${days} ngày</small>
        </div>
      </div>
      ${previewDataUrl ? `<img class="shot" src="${previewDataUrl}" alt="3D Stage Preview">` : ''}
      <div class="grid">
        <div class="card"><strong>Kích thước sàn</strong><br>${s.stageW}m × ${s.stageD}m (${s.stageAreaM2} m²)</div>
        <div class="card"><strong>Tổng diện tích LED</strong><br>${s.totalLedAreaM2} m² (${s.totalCabinets500} cab 500×500)</div>
        <div class="card"><strong>Xử lý điểm ảnh</strong><br>${s.totalPixels.toLocaleString('vi-VN')} px (${s.rj45PortsNeeded} cổng RJ45)</div>
        <div class="card"><strong>Nguồn điện 3 pha & Tải treo</strong><br>${s.totalMaxKw} kW (~${s.currentPerPhaseAmps}A/pha) · ${s.totalRiggingWeightKg} kg</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>STT</th><th>Hạng mục</th><th>Thiết bị & Quy cách</th><th>Thông số kỹ thuật</th><th>ĐVT</th><th class="num">SL</th>
            ${mode === 'quote' ? `<th class="num">Đơn giá (đ)</th><th class="num">Ngày</th><th class="num">Thành tiền (đ)</th>` : ''}
          </tr>
        </thead>
        <tbody>
          ${bom.bomRows.map((r, i) => `<tr>
            <td>${i + 1}</td>
            <td>${esc18(r.category)}</td>
            <td>${esc18(r.name)}</td>
            <td>${esc18(r.spec)}</td>
            <td>${esc18(r.unit)}</td>
            <td class="num">${r.qty}</td>
            ${mode === 'quote' ? `<td class="num">${r.unitPriceVnd.toLocaleString('vi-VN')}</td><td class="num">${days}</td><td class="num">${Math.round(r.qty * r.unitPriceVnd * days).toLocaleString('vi-VN')}</td>` : ''}
          </tr>`).join('')}
        </tbody>
      </table>
      ${mode === 'quote' ? `
      <div style="margin-left:auto;max-width:420px">
        <table>
          <tr><td>Chi phí vận chuyển 2 chiều</td><td class="num">${Number(q.transportFeeVnd || 0).toLocaleString('vi-VN')} đ</td></tr>
          <tr><td>Chi phí lắp đặt & vận hành kỹ thuật</td><td class="num">${Number(q.setupFeeVnd || 0).toLocaleString('vi-VN')} đ</td></tr>
          ${discount > 0 ? `<tr><td>Chiết khấu (${q.discountPercent}%)</td><td class="num">-${discount.toLocaleString('vi-VN')} đ</td></tr>` : ''}
          <tr><td>Thuế GTGT (${q.vatMode === 'KCT' ? 'KCT — Không chịu thuế GTGT' : q.vatMode + '%'})</td><td class="num">${vatAmount.toLocaleString('vi-VN')} đ</td></tr>
          <tr><th>TỔNG THANH TOÁN</th><th class="num" style="font-size:15px;color:#0369a1">${grandTotal.toLocaleString('vi-VN')} VNĐ</th></tr>
        </table>
      </div>` : `<pre style="background:#f8fafc;padding:12px;border:1px solid #cbd5e1;border-radius:6px;white-space:pre-wrap;font-size:12px">${esc18(buildClientProposalText())}</pre>`}
      </body></html>`;

      win.document.open();
      win.document.write(html);
      win.document.close();
      return true;
    }

    // =========================================================================
    // GIAO DIỆN MODAL: 6 MẪU SÂN KHẤU VN, TRỢ LÝ AI, BOM/BÁO GIÁ & CREDIT PRO
    // =========================================================================
    function templatePresentation18(tpl) {
      const en = {
        "Hội nghị Doanh nghiệp / Đại hội Cổ đông": [
          "Corporate conference / shareholders meeting",
          "12×6m stage, main P3.91 LED (7×3.5m), two LED wings (2.5×3.5m), VIP podium, IBM delegate tables and 16 Par/Beam lights."
        ],
        "Tiệc cưới Sang trọng": [
          "Luxury wedding",
          "14×7m stage with catwalk, 8×4m main LED, four LED totems, floral arch, round banquet tables and cold sparks."
        ],
        "Đại nhạc hội EDM": [
          "EDM concert",
          "24×12m stage, 14×6m main LED, four angled LED wings and header, central DJ desk, line arrays and 32 moving head beams."
        ],
        "Lễ Khai trương / Khánh thành / Ra mắt SP": [
          "Grand opening / product launch",
          "10×5m stage, 6×3.5m main LED, two 1×2.5m LED standees, LED arch, VIP podium and confetti."
        ],
        "Gala Dinner / Year End Party (YEP)": [
          "Gala Dinner / Year End Party",
          "16×8m stage, 9×4.5m main LED, two 2.5×4m wings, overhead kinetic LED ring, four round gala tables and 24 Beam/Katana lights."
        ],
        "Lễ hội Ngoài trời / Beerfest / Countdown": [
          "Outdoor festival / Beerfest / Countdown",
          "20×10m stage with wind-resistant truss roof, 12×5m outdoor P4.81 LED, Mojo barriers, FOH tower, line arrays and subs."
        ]
      };
      const categoriesVi = { conference: 'Doanh nghiệp / Hội nghị', wedding: 'Tiệc cưới / Lãng mạn', concert: 'Nhạc hội / EDM', grand_opening: 'Khai trương / Ra mắt', gala_dinner: 'Gala / Tất niên', outdoor_festival: 'Ngoài trời / Lễ hội' };
      return { name: tr18(tpl.name, en[tpl.name]?.[0] || tpl.name), summary: tr18(tpl.summary, en[tpl.name]?.[1] || tpl.summary), category: tr18(categoriesVi[tpl.id] || tpl.category, tpl.category) };
    }

    function openStageTemplatesModal() {
      if (typeof window.dialog !== 'function') return;
      const cardsHtml = Object.values(VN_STAGE_TEMPLATES)
        .map(
          (tpl) =>
            `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px">` +
            `<div><strong>${esc18(templatePresentation18(tpl).name)}</strong> <small style="color:#38bdf8">[${esc18(templatePresentation18(tpl).category)}]</small><br>` +
            `<small>${esc18(templatePresentation18(tpl).summary)}</small></div>` +
            `<button type="button" class="btn small primary" data-lumi18-tpl="${esc18(tpl.id)}">${tr18("Dựng 3D", "Build 3D")}</button>` +
            `</div>`
        )
        .join('');

      const paramHtml =
        `<div class="info-box" style="margin-bottom:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px">` +
        `<label style="font-size:var(--fs-md)">${tr18("Rộng sàn (m)", "Stage width (m)")}<input id="lumi18TplW" type="number" min="4" max="60" step="1" placeholder="${tr18("Mặc định mẫu", "Template default")}" class="search"></label>` +
        `<label style="font-size:var(--fs-md)">${tr18("Sâu sàn (m)", "Stage depth (m)")}<input id="lumi18TplD" type="number" min="3" max="40" step="1" placeholder="${tr18("Mặc định mẫu", "Template default")}" class="search"></label>` +
        `<label style="font-size:var(--fs-md)">${tr18("Cao sàn (m)", "Stage height (m)")}<input id="lumi18TplH" type="number" min="0.2" max="3" step="0.1" placeholder="${tr18("Mặc định mẫu", "Template default")}" class="search"></label>` +
        `<label style="font-size:var(--fs-md)">Pixel Pitch<select id="lumi18TplPitch" class="search">` +
        `<option value="">${tr18("Theo mẫu chuẩn", "Template default")}</option>` +
        `<option value="2.5">${tr18("P2.5 Indoor Siêu nét", "P2.5 high definition indoor")}</option>` +
        `<option value="2.97">${tr18("P2.97 Sự kiện / Tiệc cưới", "P2.97 events / weddings")}</option>` +
        `<option value="3.91">${tr18("P3.91 Phổ thông (500×500)", "P3.91 standard (500×500)")}</option>` +
        `<option value="4.81">${tr18("P4.81 Outdoor / Lễ hội", "P4.81 outdoor / festivals")}</option>` +
        `</select></label>` +
        `</div>` +
        `<div style="max-height:360px;overflow:auto">${cardsHtml}</div>`;

      window.dialog(tr18('6 Mẫu Sân Khấu Sự Kiện Việt Nam', '6 Vietnamese event stage templates'), paramHtml, [{ label: tr18('Đóng', 'Close') }]);
      document.querySelectorAll?.('[data-lumi18-tpl]')?.forEach((btn) => {
        btn.onclick = () => {
          const tplId = btn.getAttribute('data-lumi18-tpl');
          const widthM = Number($('lumi18TplW')?.value || 0) || undefined;
          const depthM = Number($('lumi18TplD')?.value || 0) || undefined;
          const heightM = Number($('lumi18TplH')?.value || 0) || undefined;
          const pitchMm = Number($('lumi18TplPitch')?.value || 0) || undefined;
          const modal = $('modal');
          if (modal && typeof modal.close === 'function') modal.close();
          applyStageTemplate(tplId, { widthM, depthM, heightM, pitchMm });
        };
      });
    }

    const tr18 = (vi, en) => typeof window.tr === 'function' ? window.tr(vi, en) : lumiState.lang === 'en' ? en : vi;
    const ico18 = (name) => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
    let chatController18 = null;
    let chatWidth18 = 0;
    const CHAT_ACTIONS18 = [
      ['command', 'Thiết kế sân khấu', 'Design a stage'],
      ['audit', 'Kiểm tra kỹ thuật', 'Technical audit'],
      ['proposal', 'Viết thuyết minh', 'Write a proposal'],
      ['budget', 'Tối ưu ngân sách', 'Optimize budget'],
      ['seating', 'Bố trí bàn ghế', 'Arrange seating'],
      ['music', 'Kịch bản nhạc & đèn', 'Music & lighting cues'],
      ['brand', 'Màu thương hiệu', 'Brand colors'],
      ['guide', 'Hướng dẫn sử dụng', 'Software guide']
    ];

    function saveChatLayout18() {
      try { localStorage.setItem('ledstudio-ai-chat', JSON.stringify({ open: !$('aiChat18')?.hidden, width: chatWidth18 })); } catch { /* storage unavailable */ }
    }

    function syncChatBounds18() {
      const panel = $('aiChat18');
      if (!panel) return;
      const dock = document.querySelector('.right-panel')?.getBoundingClientRect();
      const top = document.querySelector('.workflow')?.getBoundingClientRect().bottom || 88;
      const bottom = document.querySelector('.timeline-panel')?.getBoundingClientRect().top || innerHeight;
      // The chat occupies the existing inspector, without resizing or covering the stage canvas.
      const maxWidth = dock?.width > 0 ? dock.width : Math.min(360, innerWidth);
      panel.style.setProperty('--ai-top', `${top}px`);
      panel.style.setProperty('--ai-bottom', `${Math.max(0, innerHeight - bottom)}px`);
      panel.style.setProperty('--ai-width', `${Math.max(Math.min(260, maxWidth), Math.min(chatWidth18 || maxWidth, maxWidth))}px`);
      $('aiChat18Resize')?.setAttribute('aria-valuenow', String(parseInt(panel.style.getPropertyValue('--ai-width'), 10)));
    }

    function renderChat18() {
      const body = $('aiChat18Messages');
      if (!body) return;
      const buttons = CHAT_ACTIONS18.map(([mode, vi, en]) => `<button class="btn text" type="button" data-chat18-action="${mode}">${tr18(vi, en)}</button>`).join('');
      body.innerHTML = lumiState.chat18.length ? lumiState.chat18.map((m, i) => {
        const active = m.preview?.active && m.preview === lumiState.pendingPreview;
        const canUndo = !lumiState.pendingPreview?.active && m.undoSnapshot && m.undoSnapshot === lastUndo18() && !m.undone;
        return `<article class="ai18-message ${m.role}" aria-label="${m.role === 'user' ? tr18('Bạn', 'You') : tr18('Trợ lý AI', 'AI assistant')}"><div class="ai18-text">${esc18(m.textPair ? tr18(...m.textPair) : m.text)}</div>` +
          (m.preview ? `<div class="ai18-preview"><strong>${tr18('Phương án sân khấu', 'Stage preview')}</strong><p>${active ? tr18('Đang xem trước trên sân khấu.', 'Previewing on the stage.') : m.previewStatus === 'applied' ? tr18('Đã áp dụng.', 'Applied.') : m.previewStatus === 'reverted' ? tr18('Đã hoàn tác.', 'Reverted.') : tr18('Bản xem trước đã kết thúc.', 'Preview ended.')}</p>` +
            (active ? `<div class="ai18-actions"><button class="btn primary" data-chat18-commit="${i}">${tr18('Áp dụng', 'Apply')}</button><button class="btn" data-chat18-revert="${i}">${tr18('Hoàn tác', 'Revert')}</button></div>` : '') + `</div>` : '') +
          (m.guide ? `<button class="btn" data-chat18-guide="${i}">${esc18(tr18(m.guide.quickActionLabelVi, m.guide.quickActionLabelEn))}</button>` : '') +
          (canUndo ? `<button class="btn text" data-chat18-undo="${i}">${tr18('Hoàn tác thao tác AI', 'Undo AI action')}</button>` : '') + `</article>`;
      }).join('') : `<div class="ai18-empty"><h3>${tr18('Bạn muốn dựng sân khấu nào?', 'What stage would you like to create?')}</h3><p>${tr18('Mô tả ý tưởng hoặc chọn một tác vụ.', 'Describe your idea or choose a task.')}</p><div class="ai18-suggestions">${buttons}</div></div>`;
      body.scrollTop = body.scrollHeight;
      $('aiChat18Slash').innerHTML = buttons;
      $('aiChat18Send').innerHTML = ico18(chatController18 ? 'square' : 'send');
      const sendLabel = chatController18 ? tr18('Dừng', 'Stop') : tr18('Gửi', 'Send');
      $('aiChat18Send').title = sendLabel;
      $('aiChat18Send').setAttribute('aria-label', sendLabel);
      $('aiChat18Send').classList.toggle('is-busy', Boolean(chatController18));
      body.setAttribute('aria-busy', String(Boolean(chatController18)));
      const cost = lumiState.lastAiUsage?.creditsCharged;
      $('aiChat18Usage').textContent = lumiState.byok.enabled ? tr18('Đang dùng API key riêng', 'Using your own API key') : cost != null ? tr18(`Lần gần nhất: ${cost} Credit`, `Last request: ${cost} credits`) : tr18(`AI miễn phí còn ${lumiState.freeAiCreditsRemaining} Credit`, `${lumiState.freeAiCreditsRemaining} free AI credits remaining`);
    }

    async function runChatAction18(mode = 'command', suppliedPrompt) {
      if (chatController18) return;
      const input = $('lumi18AiPrompt');
      const raw = (suppliedPrompt ?? input?.value ?? '').trim();
      const prompt = raw.startsWith('/') ? raw.replace(/^\/\w*\s*/, '') : raw;
      const action = CHAT_ACTIONS18.find(a => a[0] === mode) || CHAT_ACTIONS18[0];
      if (mode === 'command' && !prompt) { input?.focus(); return; }
      const message = { role: 'assistant', text: '' };
      lumiState.chat18.push({ role: 'user', text: prompt || tr18(action[1], action[2]), textPair: prompt ? null : action.slice(1) }, message);
      input.value = '';
      $('aiChat18Slash').hidden = true;
      chatController18 = new AbortController();
      renderChat18();
      const undoBefore = lastUndo18();
      try {
        if (mode === 'proposal') message.text = buildClientProposalText();
        else if (mode === 'budget') {
          previewStageCommands([{ action: 'optimize_budget', pitchMm: 3.91, maxLights: 16 }]);
          message.textPair = ['Đã tạo phương án tối ưu ngân sách. Kiểm tra sân khấu trước khi áp dụng.', 'Budget preview ready. Check the stage before applying.'];
        } else if (mode === 'seating') {
          const guests = prompt.match(/(\d+)\s*(?:khách|khach|pax|guests|seats|ghế|ghe|bàn|ban)/i);
          const type = /ibm|hội nghị|hoi nghi|conference|đại biểu/i.test(prompt) ? 'conference_ibm_table' : /ghế|ghe|rạp|theater|seats/i.test(prompt) ? 'banquet_chair' : 'gala_round_table';
          const r = singleUndo18(() => layoutAudienceSeating({ type, guestCount: guests ? +guests[1] : 200 }));
          message.textPair = [`Đã bố trí ${r.guestCount} khách, ${r.rows} hàng × ${r.colsPerRow} cụm/hàng.\n${r.sightline.summaryVi}`, `Arranged seating for ${r.guestCount} guests, ${r.rows} rows × ${r.colsPerRow} groups per row.\n${r.sightline.summaryEn || ''}`];
        } else if (mode === 'music') {
          const bpm = prompt.match(/(\d{2,3})\s*bpm/i);
          const mood = /cưới|wedding/i.test(prompt) ? 'wedding' : /hội nghị|conference/i.test(prompt) ? 'conference' : /gala|award/i.test(prompt) ? 'gala' : 'edm';
          const r = generateMusicShowCues({ bpm: bpm ? +bpm[1] : 128, mood });
          message.textPair = [r.summaryVi, r.summaryEn || `Created ${r.cues?.length || lumiState.musicShowCues.length} music and lighting cues.`];
        } else if (mode === 'brand') {
          const colors = prompt.match(/#[0-9a-f]{6}/gi) || [];
          const r = applyBrandIdentity({ brandName: lumiState.quoteConfig.clientName || 'GROUPLIFE EVENT', primaryColor: colors[0] || '#38bdf8', accentColor: colors[1] || '#f59e0b' });
          message.textPair = [r.summaryVi, r.summaryEn || 'Applied the brand colors to the stage.'];
        } else if (mode === 'guide') {
          message.guide = answerSoftwareGuide(prompt);
          message.text = message.guide.reply;
          message.textPair = [message.guide.replyVi, message.guide.replyEn];
        } else if (mode === 'audit' && !S.cloud16?.state?.token && !lumiState.byok.enabled) {
          message.text = buildClientProposalText();
        } else {
          const data = await runStageAiPrompt(prompt || tr18('Kiểm tra kỹ thuật sân khấu hiện tại', 'Audit the current stage'), mode, chatController18.signal);
          message.text = data.reply || data.auditSummary || (typeof data.proposal === 'string' ? data.proposal : data.proposal?.summary) || tr18('Đã xử lý yêu cầu.', 'Request completed.');
        }
        if (lumiState.pendingPreview?.active) message.preview = lumiState.pendingPreview;
        else if (lastUndo18() !== undoBefore) message.undoSnapshot = lastUndo18();
      } catch (err) {
        message.text = err?.name === 'AbortError' ? tr18('Đã dừng chờ kết quả. Số dư sẽ được đối chiếu lại.', 'Stopped waiting for the result. The balance will be refreshed.') : err?.message || String(err);
        if (err?.name === 'AbortError') await refreshBillingStatus();
      } finally {
        chatController18 = null;
        renderChat18();
      }
    }

    function ensureAiChat18() {
      if ($('aiChat18')) return;
      const panel = document.createElement('section');
      panel.id = 'aiChat18';
      panel.hidden = true;
      panel.setAttribute('role', 'complementary');
      panel.setAttribute('aria-label', tr18('Trợ lý AI', 'AI assistant'));
      const button = (id, icon, vi, en) => `<button type="button" class="icon-btn" id="${id}" title="${tr18(vi, en)}" aria-label="${tr18(vi, en)}">${ico18(icon)}</button>`;
      panel.innerHTML = `<div id="aiChat18Resize" role="separator" tabindex="0" aria-orientation="vertical" aria-label="${tr18('Độ rộng khung chat', 'Chat width')}" aria-valuemin="260" aria-valuemax="560"></div>` +
        `<header><h2>${tr18('Trợ lý AI', 'AI assistant')}</h2><div>${button('aiChat18New', 'plus', 'Cuộc trò chuyện mới', 'New conversation')}${button('aiChat18SettingsBtn', 'settings', 'Cài đặt AI', 'AI settings')}${button('aiChat18Close', 'x', 'Đóng', 'Close')}</div></header>` +
        `<div id="aiChat18Settings" hidden><label>${tr18('Mức suy luận', 'Reasoning effort')}<select class="search" id="lumi18EffortSelect">${['low', 'medium', 'high'].map((id, i) => `<option value="${id}" ${lumiState.effort === id ? 'selected' : ''}>${tr18(['Nhanh', 'Cân bằng', 'Chuyên sâu'][i], ['Fast', 'Balanced', 'Thorough'][i])}</option>`).join('')}</select></label>` +
        `<label class="check-row"><input type="checkbox" id="lumi18ByokToggle" ${lumiState.byok.enabled ? 'checked' : ''}>${tr18('Dùng API key riêng', 'Use your own API key')}</label>` +
        `<div id="lumi18ByokBox" ${lumiState.byok.enabled ? '' : 'hidden'}><label>${tr18('Nhà cung cấp', 'Provider')}<select class="search" id="lumi18ByokProvider">${['gemini', 'openai', 'openrouter', 'deepseek', 'groq', 'anthropic', 'custom'].map(p => `<option ${p === lumiState.byok.provider ? 'selected' : ''} value="${p}">${p}</option>`).join('')}</select></label>` +
        `<label>Model<input class="search" id="lumi18ByokModel" value="${esc18(lumiState.byok.model)}"></label>` +
        `<label>API key<input class="search" id="lumi18ByokKey" type="password" autocomplete="off" value="${esc18(lumiState.byok.apiKey)}"></label>` +
        `<label>${tr18('Địa chỉ máy chủ', 'Server URL')}<input class="search" id="lumi18ByokUrl" type="url" value="${esc18(lumiState.byok.baseUrl)}" placeholder="https://api.openai.com/v1"></label></div></div>` +
        `<div id="aiChat18Messages" role="log" aria-live="polite" aria-relevant="additions text"></div>` +
        `<form id="aiChat18Form"><div id="aiChat18Slash" hidden aria-label="${tr18('Tác vụ AI', 'AI tasks')}"></div><label class="ai18-input-label" for="lumi18AiPrompt">${tr18('Yêu cầu AI', 'Message AI')}</label><textarea class="search" id="lumi18AiPrompt" rows="3" placeholder="${tr18('Mô tả sân khấu hoặc gõ /', 'Describe your stage or type /')}"></textarea><div class="ai18-compose-foot"><small id="aiChat18Usage"></small><button type="submit" class="btn primary icon-btn" id="aiChat18Send"></button></div></form>`;
      document.body.appendChild(panel);
      $('aiChat18Close').onclick = closeAiChat18;
      $('aiChat18New').onclick = () => {
        if (chatController18) chatController18.abort();
        if (lumiState.pendingPreview?.active) revertStagePreview();
        lumiState.chat18 = [];
        renderChat18();
      };
      $('aiChat18SettingsBtn').onclick = () => {
        $('aiChat18Settings').hidden = !$('aiChat18Settings').hidden;
        $('aiChat18SettingsBtn').setAttribute('aria-expanded', String(!$('aiChat18Settings').hidden));
      };
      const syncByokInputs = () => {
        lumiState.effort = $('lumi18EffortSelect').value;
        saveByokConfig({ enabled: $('lumi18ByokToggle').checked, provider: $('lumi18ByokProvider').value, model: $('lumi18ByokModel').value, apiKey: $('lumi18ByokKey').value, baseUrl: $('lumi18ByokUrl').value });
        $('lumi18ByokBox').hidden = !lumiState.byok.enabled;
        renderChat18();
      };
      $('aiChat18Settings').addEventListener('change', syncByokInputs);
      $('aiChat18Form').onsubmit = e => {
        e.preventDefault();
        if (chatController18) { chatController18.abort(); return; }
        const match = $('lumi18AiPrompt').value.match(/^\/(command|audit|proposal|budget|seating|music|brand|guide)\b/);
        runChatAction18(match?.[1] || 'command');
      };
      $('lumi18AiPrompt').oninput = () => { $('aiChat18Slash').hidden = !$('lumi18AiPrompt').value.startsWith('/'); };
      panel.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Escape' || (e.ctrlKey && e.key.toLowerCase() === 'i')) { e.preventDefault(); closeAiChat18(); }
        else if (e.target.id === 'lumi18AiPrompt' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('aiChat18Form').requestSubmit(); }
      });
      panel.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.dataset.chat18Action) return runChatAction18(btn.dataset.chat18Action);
        const kind = ['commit', 'revert', 'undo', 'guide'].find(k => btn.hasAttribute(`data-chat18-${k}`));
        if (!kind) return;
        const m = lumiState.chat18[Number(btn.getAttribute(`data-chat18-${kind}`))];
        if (!m) return;
        if (kind === 'guide') { runQuickGuideAction(m.guide.quickActionId); if (lumiState.pendingPreview?.active) m.preview = lumiState.pendingPreview; }
        else if (kind === 'undo') { if (!lumiState.pendingPreview?.active && !m.undone && m.undoSnapshot && m.undoSnapshot === lastUndo18()) { window.undo?.(); m.undone = true; } }
        else if (m.preview === lumiState.pendingPreview && m.preview.active) {
          if (kind === 'commit') { m.undoSnapshot = m.preview.undoSnapshot; commitStagePreview(); m.previewStatus = 'applied'; }
          else { revertStagePreview(); m.previewStatus = 'reverted'; }
        }
        renderChat18();
      });
      const resize = $('aiChat18Resize');
      resize.onpointerdown = e => {
        const start = e.clientX, width = panel.getBoundingClientRect().width;
        resize.setPointerCapture(e.pointerId);
        resize.onpointermove = ev => { chatWidth18 = width + start - ev.clientX; syncChatBounds18(); };
        resize.onpointerup = resize.onpointercancel = () => { resize.onpointermove = null; chatWidth18 = panel.getBoundingClientRect().width; saveChatLayout18(); };
      };
      resize.onkeydown = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); chatWidth18 = panel.getBoundingClientRect().width + (e.key === 'ArrowLeft' ? 10 : -10); syncChatBounds18(); saveChatLayout18(); } };
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(syncChatBounds18);
        for (const selector of ['.workflow', '.right-panel', '.timeline-panel']) { const el = document.querySelector(selector); if (el) observer.observe(el); }
      }
      window.addEventListener('resize', syncChatBounds18);
      renderChat18();
    }

    function closeAiChat18() {
      const panel = $('aiChat18');
      if (panel) panel.hidden = true;
      $('aiChat18Toggle')?.setAttribute('aria-expanded', 'false');
      saveChatLayout18();
      if (panel?.contains(document.activeElement)) $('aiChat18Toggle')?.focus();
    }

    function openStageAiModal() {
      if (S.cloud16?.isClientReviewMode?.()) return;
      ensureAiChat18();
      const panel = $('aiChat18');
      if (!panel.hidden) return closeAiChat18();
      if (document.body?.classList?.contains?.('right-panel-collapsed')) S.toggleRightPanel16?.(false);
      S.closeAllDocks16?.('aiChat18');
      panel.hidden = false;
      syncChatBounds18();
      renderChat18();
      $('aiChat18Toggle')?.setAttribute('aria-expanded', 'true');
      saveChatLayout18();
      $('lumi18AiPrompt')?.focus();
    }



    function openBomAndQuoteModal() {
      if (typeof window.dialog !== 'function') return;
      const bom = computeStageBom();
      const s = bom.summary;
      const q = lumiState.quoteConfig;
      const days = Math.max(1, Number(q.rentalDays) || 1);
      const subTotal = bom.bomRows.reduce((acc, r) => acc + Math.round(r.qty * r.unitPriceVnd * days), 0);
      const gross = subTotal + Number(q.transportFeeVnd || 0) + Number(q.setupFeeVnd || 0);
      const discount = Math.round((gross * (Number(q.discountPercent) || 0)) / 100);
      const afterDiscount = gross - discount;

      const displayRow = (r) => {
        if (tr18('vi', 'en') !== 'en') return r;
        let name = r.name, spec = r.spec;
        if (r.key === 'processor') {
          name = 'Video processor ' + s.recommendedProcessor.replaceAll('cổng RJ45 · tối đa', 'RJ45 ports · max').replace('Ghép đồng bộ Genlock', 'Genlock synchronization');
          spec = s.rj45PortsNeeded + ' primary + backup Cat6A network cables';
        } else if (r.key === 'beam_230') name = 'Moving Head Beam 230W/350W IP20/IP65';
        else if (r.key === 'par_led') name = 'Par LED 54×3W / COB Blinder Wash';
        else if (r.key === 'truss_m') {
          name = 'Aluminum truss 300×300 / 400×400mm + hoists';
          spec = 'Total rigging load ~' + s.totalRiggingWeightKg + ' kg';
        } else if (r.key === 'stage_m2') {
          name = 'Modular stage (' + s.stageW + '×' + s.stageD + 'm), black carpet / cover';
          spec = 'Galvanized steel frame + 18mm structural plywood';
        } else if (r.key.startsWith('prop_')) spec = spec.replace('Vị trí', 'Position');
        return { ...r, name, spec, unit: ({ 'bộ': 'set', 'cây': 'unit', 'm dài': 'm' })[r.unit] || r.unit };
      };

      const rowsHtml = bom.bomRows
        .map(displayRow)
        .map(
          (r, i) =>
            `<tr>` +
            `<td>${i + 1}</td>` +
            `<td><strong>${esc18(r.name)}</strong><br><small>${esc18(r.spec)}</small></td>` +
            `<td>${r.qty} ${esc18(r.unit)}</td>` +
            `<td><input type="number" class="search" style="width:110px" data-lumi18-price="${esc18(r.key)}" value="${r.unitPriceVnd}" step="10000"></td>` +
            `<td style="text-align:right"><strong>${Math.round(r.qty * r.unitPriceVnd * days).toLocaleString('vi-VN')} đ</strong></td>` +
            `</tr>`
        )
        .join('');

      const html =
        `<div style="display:grid;gap:10px">` +
        `<div class="info-box" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">` +
        `<div><small>${tr18("Tổng diện tích LED", "Total LED area")}</small><br><strong>${s.totalLedAreaM2} m² (${s.totalCabinets500} cab)</strong></div>` +
        `<div><small>${tr18("Xử lý điểm ảnh", "Pixel processing")}</small><br><strong>${(s.totalPixels / 1e6).toFixed(2)}M px (${s.rj45PortsNeeded} ${tr18("cổng", "ports")})</strong></div>` +
        `<div><small>${tr18("Tải điện 3 pha 380V", "380V three-phase load")}</small><br><strong>${s.totalMaxKw} kW (~${s.currentPerPhaseAmps}A/${tr18("pha", "phase")})</strong></div>` +
        `<div><small>${tr18("Tổng tải treo Truss", "Total truss rigging load")}</small><br><strong>~${s.totalRiggingWeightKg} kg</strong></div>` +
        `</div>` +
        `<div class="info-box" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px">` +
        `<label style="font-size:var(--fs-md)">${tr18("Tên Khách hàng / Đơn vị", "Client / organization")}<input id="lumi18QuoteClient" class="search" value="${esc18(q.clientName)}"></label>` +
        `<label style="font-size:var(--fs-md)">${tr18("Số ngày thuê", "Rental days")}<input id="lumi18QuoteDays" type="number" min="1" max="60" class="search" value="${days}"></label>` +
        `<label style="font-size:var(--fs-md)">${tr18("Vận chuyển & Lắp đặt (đ)", "Transport & setup (VND)")}<input id="lumi18QuoteTransport" type="number" step="500000" class="search" value="${Number(q.transportFeeVnd || 0) + Number(q.setupFeeVnd || 0)}"></label>` +
        `<label style="font-size:var(--fs-md)">${tr18("Chế độ Thuế", "Tax mode")}<select id="lumi18QuoteVat" class="search">` +
        `<option value="KCT" ${q.vatMode === 'KCT' ? 'selected' : ''}>${tr18("KCT (Phần mềm GROUPLIFE)", "Tax exempt (GROUPLIFE software)")}</option>` +
        `<option value="8" ${q.vatMode === '8' ? 'selected' : ''}>VAT 8%</option>` +
        `<option value="10" ${q.vatMode === '10' ? 'selected' : ''}>VAT 10%</option>` +
        `</select></label>` +
        `</div>` +
        `<div style="max-height:240px;overflow:auto">` +
        `<table style="width:100%;border-collapse:collapse;font-size:var(--fs-md)">` +
        `<thead><tr style="border-bottom:1px solid rgba(148,163,184,.3)"><th style="text-align:left">#</th><th style="text-align:left">${tr18("Hạng mục thiết bị", "Equipment item")}</th><th style="text-align:left">${tr18("SL", "Qty")}</th><th style="text-align:left">${tr18("Đơn giá/ngày", "Daily unit price")}</th><th style="text-align:right">${tr18("Thành tiền", "Amount")}</th></tr></thead>` +
        `<tbody>${rowsHtml}</tbody>` +
        `</table></div>` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">` +
        `<div><strong>${tr18("Tổng tạm tính", "Subtotal")} (${days} ${tr18("ngày", "days")}): <span style="color:#38bdf8">${afterDiscount.toLocaleString('vi-VN')} VNĐ</span></strong><br><small>${tr18("Đơn vị phát hành:", "Issued by:")} ${esc18(LUMI_BRAND.legalEntity)}</small></div>` +
        `<div style="display:flex;gap:6px;flex-wrap:wrap">` +
        `<button type="button" class="btn small primary" id="lumi18PrintQuoteBtn">${tr18("In / PDF Báo giá", "Print / PDF quotation")}</button>` +
        `<button type="button" class="btn small" id="lumi18ExportCsvBtn">${tr18("Xuất Excel (CSV)", "Export Excel (CSV)")}</button>` +
        `<button type="button" class="btn small" id="lumi18PrintTechBtn">${tr18("Hồ sơ Kỹ thuật PDF", "Technical PDF")}</button>` +
        `<button type="button" class="btn small" id="lumi18ExportDxfBtn">${tr18("Xuất AutoCAD .DXF", "Export AutoCAD .DXF")}</button>` +
        `<button type="button" class="btn small" id="lumi18ImportDxfBtn">${tr18("Nhập Mặt bằng .DXF", "Import floor plan .DXF")}</button>` +
        `</div></div>` +
        `</div>`;

      window.dialog(tr18('Bóc tách Khối lượng (BOM), Báo giá & Bản vẽ Kỹ thuật CAD (.DXF)', 'Bill of materials, quotation & CAD drawings (.DXF)'), html, [{ label: tr18('Đóng', 'Close') }]);

      const syncQuoteInputs = () => {
        q.clientName = $('lumi18QuoteClient')?.value || q.clientName;
        q.rentalDays = Math.max(1, Number($('lumi18QuoteDays')?.value) || 1);
        const totalFee = Math.max(0, Number($('lumi18QuoteTransport')?.value) || 0);
        q.transportFeeVnd = Math.round(totalFee * 0.45);
        q.setupFeeVnd = totalFee - q.transportFeeVnd;
        q.vatMode = $('lumi18QuoteVat')?.value || 'KCT';
        document.querySelectorAll?.('[data-lumi18-price]')?.forEach((inp) => {
          const k = inp.getAttribute('data-lumi18-price');
          if (k) q.priceOverrides[k] = Math.max(0, Number(inp.value) || 0);
        });
      };

      $('lumi18QuoteDays')?.addEventListener('change', () => {
        syncQuoteInputs();
        openBomAndQuoteModal();
      });
      document.querySelectorAll?.('[data-lumi18-price]')?.forEach((inp) => {
        inp.addEventListener('change', () => {
          syncQuoteInputs();
          openBomAndQuoteModal();
        });
      });

      const printQuoteBtn = $('lumi18PrintQuoteBtn');
      if (printQuoteBtn) {
        printQuoteBtn.onclick = () => {
          syncQuoteInputs();
          printStageDocument('quote');
        };
      }
      const csvBtn = $('lumi18ExportCsvBtn');
      if (csvBtn) {
        csvBtn.onclick = () => {
          syncQuoteInputs();
          exportQuotationCsv();
        };
      }
      const techBtn = $('lumi18PrintTechBtn');
      if (techBtn) {
        techBtn.onclick = () => {
          syncQuoteInputs();
          printStageDocument('tech');
        };
      }
      const dxfBtn = $('lumi18ExportDxfBtn');
      if (dxfBtn) dxfBtn.onclick = () => exportStageDxf();

      const importDxfBtn = $('lumi18ImportDxfBtn');
      if (importDxfBtn) {
        importDxfBtn.onclick = () => {
          let inp = $('lumi18DxfFileInput');
          if (!inp) {
            inp = document.createElement('input');
            inp.type = 'file';
            inp.id = 'lumi18DxfFileInput';
            inp.accept = '.dxf';
            inp.hidden = true;
            document.body.appendChild(inp);
            inp.onchange = async () => {
              const f = inp.files?.[0];
              inp.value = '';
              if (!f) return;
              try {
                await importDxfFloorplanFile(f);
              } catch (err) {
                window.toast?.(err?.message || String(err));
              }
            };
          }
          inp.click();
        };
      }
    }

    function getWalletUrl18() {
      return /^https?:$/.test(window.location?.protocol || '') ? new URL('/wallet', window.location.origin).href : null;
    }

    function renderAccountMenu18() {
      const menu = $('account18Menu');
      if (!menu) return;
      const balance = lumiState.balanceReady ? `${lumiState.balanceCredits.toLocaleString()} Credit` : tr18('Chưa tải số dư', 'Balance unavailable');
      const expires = lumiState.proExpiresAt ? new Date(lumiState.proExpiresAt).toLocaleDateString(lumiState.lang === 'en' ? 'en-GB' : 'vi-VN') : '';
      const wallet = getWalletUrl18();
      menu.innerHTML = `<h3>${tr18('Tài khoản', 'Account')}</h3><strong>${esc18(balance)}</strong><p>${lumiState.isProActive ? 'PRO' : tr18('Gói miễn phí', 'Free plan')}${expires ? ` · ${tr18('Hết hạn', 'Expires')} ${esc18(expires)}` : ''}</p>` +
        `<button class="btn" data-account18="topup">${tr18('Nạp Credit', 'Add credits')}</button><button class="btn primary" data-account18="upgrade">${tr18('Nâng cấp', 'Upgrade')}</button>` +
        (wallet ? `<a class="btn text" href="${esc18(wallet)}" target="_blank" rel="noopener noreferrer">${tr18('Lịch sử giao dịch', 'Transaction history')}</a>` : '');
      menu.querySelectorAll('[data-account18]').forEach(b => { b.onclick = () => {
        menu.hidePopover();
        if (b.dataset.account18 === 'topup' && wallet) window.open(wallet, '_blank', 'noopener,noreferrer');
        else openBillingModal();
      }; });
    }

    function injectAccount18(actions) {
      if (!actions || $('account18Chip')) return;
      const chip = document.createElement('button');
      chip.id = 'account18Chip'; chip.type = 'button'; chip.className = 'btn small';
      chip.setAttribute('popovertarget', 'account18Menu'); chip.setAttribute('aria-expanded', 'false');
      const menu = document.createElement('div');
      menu.id = 'account18Menu'; menu.className = 'account18-menu'; menu.setAttribute('popover', '');
      menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-label', tr18('Tài khoản', 'Account'));
      menu.addEventListener('toggle', e => {
        chip.setAttribute('aria-expanded', String(e.newState === 'open'));
        if (e.newState === 'open') { renderAccountMenu18(); refreshBillingStatus().then(renderAccountMenu18); }
      });
      actions.appendChild(chip); document.body.appendChild(menu);
      const settings = $('uiSettings16');
      if (settings && !$('lumi18ShareCfgBtn')) {
        const extra = document.createElement('div'); extra.className = 'account18-settings';
        extra.innerHTML = `<button class="btn" id="lumi18ShareCfgBtn">${tr18('Cấu hình link duyệt 3D', '3D review link settings')}</button><label class="check-row"><input type="checkbox" id="lumi18TelemetryCheckbox" ${lumiState.telemetryOptIn ? 'checked' : ''}>${tr18('Chia sẻ thống kê tính năng ẩn danh', 'Share anonymous feature statistics')}</label>`;
        settings.appendChild(extra);
        $('lumi18ShareCfgBtn').onclick = () => { settings.hidePopover(); S.cloud16?.openShareLinkDialog?.(); };
        $('lumi18TelemetryCheckbox').onchange = e => setTelemetryOptIn(e.target.checked);
      }
      updateTopbarBadge18();
      if (S.cloud16?.state?.token) refreshBillingStatus();
    }

    async function syncAccount18() {
      Object.assign(lumiState, {
        tier: 'free',
        isProActive: false,
        proExpiresAt: null,
        projectUnlocked: false,
        singleExportPasses: 0,
        balanceCredits: 0,
        balanceReady: false,
        freeAiCreditsRemaining: 50
      });
      updateTopbarBadge18();
      if ($('account18Menu')?.matches?.(':popover-open')) renderAccountMenu18();
      return S.cloud16?.state?.token ? refreshBillingStatus() : lumiState;
    }

    async function openBillingModal() {
      if (typeof window.dialog !== 'function') return;
      await refreshBillingStatus();
      const plans = [
        ['lumi_single_export', tr18('Một lượt xuất', 'Single export'), 50, [tr18('Xuất 4K PNG, PDF hoặc DXF', '4K PNG, PDF or DXF export'), tr18('Không watermark', 'No watermark'), tr18('Dùng một lần', 'One use')]],
        ['lumi_unlock_project', tr18('Mở khóa dự án', 'Unlock project'), 200, [tr18('Không watermark', 'No watermark'), tr18('Xuất 4K, PDF và DXF', '4K, PDF and DXF export'), tr18('Mật khẩu link duyệt', 'Password protected review links')]],
        ['lumi_pro_monthly', tr18('Pro tháng', 'Pro monthly'), 1490, [tr18('30 ngày', '30 days'), tr18('Không giới hạn dự án', 'Unlimited projects'), '300 AI Credit']],
        ['lumi_pro_quarterly', tr18('Pro quý', 'Pro quarterly'), 3990, [tr18('90 ngày', '90 days'), tr18('Không giới hạn dự án', 'Unlimited projects'), '1,000 AI Credit']],
        ['lumi_pro_yearly', tr18('Pro năm', 'Pro yearly'), 13900, [tr18('365 ngày', '365 days'), tr18('Không giới hạn dự án', 'Unlimited projects'), '4,500 AI Credit']],
        ['lumi_show_pro_plus', 'Show Pro+', 2990, [tr18('30 ngày', '30 days'), tr18('Chạy show DMX / Art-Net', 'DMX / Art-Net live shows'), '800 AI Credit']]
      ];
      const html = `<div class="billing18-summary">${tr18('Số dư', 'Balance')}: ${lumiState.balanceReady ? lumiState.balanceCredits.toLocaleString() : '—'} Credit · 1 Credit = 100 VNĐ</div><div class="billing18-plans">` + plans.map(([key, title, price, benefits]) =>
        `<section class="billing18-plan"><h3>${esc18(title)}</h3>${key === 'lumi_pro_monthly' ? `<span class="local-badge">${tr18('Đề xuất', 'Recommended')}</span>` : ''}<strong>${price.toLocaleString()} Credit</strong><small>${(price * 100).toLocaleString()} VNĐ</small><ul>${benefits.map(b => `<li>${esc18(b)}</li>`).join('')}</ul><button class="btn ${key === 'lumi_pro_monthly' ? 'primary' : ''}" data-lumi18-buy="${key}">${tr18('Chọn gói', 'Choose plan')}</button></section>`
      ).join('') + '</div>';
      window.dialog(tr18('Credit & Pro', 'Credits & Pro'), html, [{ label: tr18('Đóng', 'Close') }]);
      document.querySelectorAll?.('[data-lumi18-buy]')?.forEach(btn => {
        btn.onclick = async () => { btn.disabled = true; try { await purchaseLumiProduct(btn.getAttribute('data-lumi18-buy')); await openBillingModal(); } finally { btn.disabled = false; } };
      });
    }



    // =========================================================================
    // NHÓM E (E1–E4) — CHẠY SHOW THẬT: DMX ART-NET / SACN, LIVE LED OUTPUT,
    // REMOTE CUE CONTROL & CHẾ ĐỘ KHOÁ AN TOÀN CHẠY SHOW
    // =========================================================================
    function hexToRgbBytes18(hex) {
      const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || '#38bdf8').trim());
      if (!m) return [56, 189, 248];
      return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    }

    // E1: Mã hoá toàn bộ đèn sân khấu thành khung 512 kênh DMX512 (16ch / đèn, tối đa 32 đèn / Universe)
    function encodeDmxUniverseFrame(universe = 0) {
      const dmx = new Uint8Array(512);
      if (lumiState.masterBlackout) {
        lumiState.dmxBridge.lastDmx512 = dmx;
        return dmx;
      }
      const eng = getEngine();
      const lights = Array.isArray(eng?.lights) ? eng.lights : [];
      const glbRigs = typeof S.stageAssets16?.fixtureRigs16?.values === 'function'
        ? [...S.stageAssets16.fixtureRigs16.values()]
        : [];
      const allFixtures = [
        ...lights.map((l) => {
          const dx = (Number(l.target?.[0]) || 0) - (Number(l.pos?.[0]) || 0);
          const dy = (Number(l.target?.[1]) || 0) - (Number(l.pos?.[1]) || 5);
          const dz = (Number(l.target?.[2]) || 0) - (Number(l.pos?.[2]) || 0);
          const panDeg = (Math.atan2(dx, dz || 0.001) * 180) / Math.PI;
          const tiltDeg = (Math.atan2(Math.hypot(dx, dz), -dy || 0.001) * 180) / Math.PI;
          return {
            enabled: l.enabled !== false,
            panDeg,
            tiltDeg,
            dimmer: Math.max(0, Math.min(1, (Number(l.power) || 0) / 6)),
            color: l.color || '#38bdf8',
            fx: l.fx || 'steady'
          };
        }),
        ...glbRigs.map((r) => ({
          enabled: true,
          panDeg: Number(r.panDeg) || 0,
          tiltDeg: Number(r.tiltDeg) || 0,
          dimmer: 1.0,
          color: eng?.accent || '#38bdf8',
          fx: 'steady'
        }))
      ];

      const startIdx = Math.max(0, Number(universe) | 0) * 32;
      for (let i = 0; i < 32 && startIdx + i < allFixtures.length; i++) {
        const fx = allFixtures[startIdx + i];
        const base = i * 16;
        if (!fx.enabled) continue;
        // 16-bit Pan (-270..+270 deg -> 0..65535) & Tilt (-135..+135 deg -> 0..65535)
        const panNorm = Math.max(0, Math.min(1, (fx.panDeg + 270) / 540));
        const tiltNorm = Math.max(0, Math.min(1, (fx.tiltDeg + 135) / 270));
        const pan16 = Math.round(panNorm * 65535);
        const tilt16 = Math.round(tiltNorm * 65535);
        const [r, g, b] = hexToRgbBytes18(fx.color);
        const dim = Math.max(0, Math.min(255, Math.round(fx.dimmer * 255)));
        const shutter = fx.fx === 'strobe' ? 220 : fx.fx === 'pulse' ? 140 : 255;

        dmx[base + 0] = (pan16 >> 8) & 0xff;  // CH1: Pan coarse
        dmx[base + 1] = pan16 & 0xff;         // CH2: Pan fine
        dmx[base + 2] = (tilt16 >> 8) & 0xff; // CH3: Tilt coarse
        dmx[base + 3] = tilt16 & 0xff;        // CH4: Tilt fine
        dmx[base + 4] = dim;                  // CH5: Master Dimmer
        dmx[base + 5] = shutter;              // CH6: Shutter / Strobe
        dmx[base + 6] = r;                    // CH7: Red
        dmx[base + 7] = g;                    // CH8: Green
        dmx[base + 8] = b;                    // CH9: Blue
        dmx[base + 9] = Math.min(r, g, b);    // CH10: White
      }
      lumiState.dmxBridge.lastDmx512 = dmx;
      return dmx;
    }

    // E1: Đóng gói gói tin chuẩn Art-Net ArtDmx (OpCode 0x5000, 530 bytes)
    function buildArtNetPacket18(universe = 0, dmx512 = encodeDmxUniverseFrame(universe), sequence = 1) {
      const pkt = new Uint8Array(530);
      const header = [0x41, 0x72, 0x74, 0x2d, 0x4e, 0x65, 0x74, 0x00, 0x00, 0x50, 0x00, 14];
      for (let i = 0; i < header.length; i++) pkt[i] = header[i];
      pkt[12] = ((Number(sequence) || 1) & 0xff) || 1;
      pkt[13] = 0;
      const uni = Math.max(0, Math.min(32767, Number(universe) | 0));
      pkt[14] = uni & 0xff;
      pkt[15] = (uni >> 8) & 0x7f;
      pkt[16] = 0x02; // 512 high byte
      pkt[17] = 0x00; // 512 low byte
      for (let i = 0; i < 512 && i < (dmx512?.length || 0); i++) {
        pkt[18 + i] = dmx512[i] & 0xff;
      }
      return pkt;
    }

    // E1: Đóng gói gói tin chuẩn ANSI E1.31 (sACN, 638 bytes)
    function buildSacnPacket18(universe = 1, dmx512 = null, sequence = 1) {
      const uni = Math.max(1, Math.min(63999, Number(universe) || 1));
      const frame = dmx512 || encodeDmxUniverseFrame(Math.max(0, uni - 1));
      const pkt = new Uint8Array(638);
      pkt[0] = 0x00; pkt[1] = 0x10; // Preamble 0x0010
      const acnId = [0x41, 0x53, 0x43, 0x2d, 0x45, 0x31, 0x2e, 0x31, 0x37, 0x00, 0x00, 0x00];
      for (let i = 0; i < acnId.length; i++) pkt[4 + i] = acnId[i];
      const rootLen = 0x7000 | (638 - 16);
      pkt[16] = (rootLen >> 8) & 0xff; pkt[17] = rootLen & 0xff;
      pkt[21] = 0x04; // VECTOR_ROOT_E131_DATA
      // Deterministic non-zero 16-byte sACN CID ("LumiStage-E131-1")
      const cid = [0x4c, 0x75, 0x6d, 0x69, 0x53, 0x74, 0x61, 0x67, 0x65, 0x2d, 0x45, 0x31, 0x33, 0x31, 0x2d, 0x31];
      for (let i = 0; i < 16; i++) pkt[22 + i] = cid[i];
      const frameLen = 0x7000 | (638 - 38);
      pkt[38] = (frameLen >> 8) & 0xff; pkt[39] = frameLen & 0xff;
      pkt[43] = 0x02; // VECTOR_E131_DATA_PACKET
      const srcName = 'LumiStage Studio';
      for (let i = 0; i < srcName.length; i++) pkt[44 + i] = srcName.charCodeAt(i);
      pkt[108] = 100; // Priority 100
      pkt[111] = (Number(sequence) || 1) & 0xff;
      pkt[113] = (uni >> 8) & 0xff; pkt[114] = uni & 0xff;
      const dmpLen = 0x7000 | (638 - 115);
      pkt[115] = (dmpLen >> 8) & 0xff; pkt[116] = dmpLen & 0xff;
      pkt[117] = 0x02; // VECTOR_DMP_SET_PROPERTY
      pkt[118] = 0xa1;
      pkt[122] = 0x01; // Increment 1
      pkt[123] = 0x02; pkt[124] = 0x01; // 513 values (start code + 512)
      pkt[125] = 0x00; // Start code 0
      for (let i = 0; i < 512 && i < (frame?.length || 0); i++) {
        pkt[126 + i] = frame[i] & 0xff;
      }
      return pkt;
    }

    async function sendDmxFrameToBridge(opts = {}) {
      const cfg = lumiState.dmxBridge;
      const universe = opts.universe !== undefined ? Number(opts.universe) : cfg.universe;
      const protocol = opts.protocol || cfg.protocol || 'artnet';
      const host = opts.host || cfg.host || '127.0.0.1';
      const port = opts.port || cfg.port || (protocol === 'sacn' ? 5568 : 6454);
      const wsPort = opts.wsPort || cfg.wsPort || 9454;
      const dmx = encodeDmxUniverseFrame(universe);
      cfg.sequence = (cfg.sequence % 255) + 1;
      try {
        const res = await fetch(`http://127.0.0.1:${wsPort}/dmx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proto: protocol,
            universe,
            host,
            port,
            channels: Array.from(dmx)
          })
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) {
          cfg.packetsSent++;
          return { sent: true, bytes: json.bytes, packetsSent: cfg.packetsSent };
        }
        return { sent: false, reason: json.error || `HTTP ${res.status}` };
      } catch {
        return { sent: false, reason: 'bridge_unreachable' };
      }
    }

    let dmxTimer18 = null;
    function startDmxLiveStream(opts = {}) {
      Object.assign(lumiState.dmxBridge, opts, { streaming: true });
      if (dmxTimer18) clearInterval(dmxTimer18);
      dmxTimer18 = setInterval(() => {
        sendDmxFrameToBridge().catch(() => {});
      }, 33); // ~30Hz DMX refresh
      trackLumiEvent('dmx_bridge_started', { protocol: lumiState.dmxBridge.protocol });
      return true;
    }

    function stopDmxLiveStream() {
      lumiState.dmxBridge.streaming = false;
      if (dmxTimer18) {
        clearInterval(dmxTimer18);
        dmxTimer18 = null;
      }
      return true;
    }

    // E2: Mở cửa sổ phát nội dung LED 1:1 theo Pixel Map ra cổng HDMI / NovaStar
    function renderLiveLedOutputFrame(targetWin = lumiState._liveOutputWin) {
      if (!targetWin || targetWin.closed) return false;
      const outCanvas = targetWin.document?.getElementById?.('ledOutCanvas');
      const ctx2d = outCanvas?.getContext?.('2d');
      if (!outCanvas || !ctx2d) return false;
      const w = Number(outCanvas.width) || 1920;
      const h = Number(outCanvas.height) || 1080;
      ctx2d.fillStyle = '#000000';
      ctx2d.fillRect(0, 0, w, h);
      if (lumiState.masterBlackout) return true;

      const eng = getEngine();
      const glCanvas = document.getElementById?.('glcanvas');
      let drewAny = false;
      if (Array.isArray(eng?.surfaces) && eng.surfaces.length > 0) {
        for (const s of eng.surfaces) {
          if (s.enabled === false || (Number(s.brightness) ?? 1) <= 0) continue;
          const sx = Number(s.x) || 0;
          const sy = Number(s.y) || 0;
          const sw = Math.max(8, Number(s.w) || 640);
          const sh = Math.max(8, Number(s.h) || 360);
          const srcCanvas = s.testCanvas || glCanvas;
          if (srcCanvas && typeof ctx2d.drawImage === 'function') {
            try {
              ctx2d.drawImage(srcCanvas, sx, sy, sw, sh);
              drewAny = true;
              continue;
            } catch {
              // fallback to procedural tile below
            }
          }
          ctx2d.fillStyle = eng?.accent || '#38bdf8';
          ctx2d.fillRect(sx, sy, sw, sh);
          drewAny = true;
        }
      }
      if (!drewAny && glCanvas && typeof ctx2d.drawImage === 'function') {
        try {
          ctx2d.drawImage(glCanvas, 0, 0, w, h);
        } catch {
          // ignore cross-context canvas error
        }
      }
      return true;
    }

    function openLiveLedOutputWindow() {
      const eng = getEngine();
      const masterW = Math.max(640, Math.min(3840, Number(eng?.master?.width) || 1920));
      const masterH = Math.max(360, Math.min(2160, Number(eng?.master?.height) || 1080));
      const win = window.open('', 'LumiStage_LED_Wall_Output', `width=${Math.min(1280, masterW)},height=${Math.min(720, masterH)}`);
      if (!win) {
        window.toast?.(tr18("Trình duyệt chặn cửa sổ Live LED Output. Hãy cho phép pop-up rồi bấm lại.", "The browser blocked Live LED Output. Allow pop-ups and try again."));
        return null;
      }
      const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>LumiStage Live LED Output (${masterW}×${masterH}px)</title>
      <style>html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center}
      canvas{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}
      .hud{position:fixed;top:10px;right:10px;z-index:9;display:flex;gap:8px;opacity:.85}
      .hud button{background:#0284c7;color:#fff;border:0;padding:6px 12px;border-radius:4px;cursor:pointer;font-weight:600}
      </style></head><body>
      <div class="hud" id="hud"><button onclick="document.documentElement.requestFullscreen?.();document.getElementById('hud').style.display='none'">Fullscreen HDMI Output (${masterW}×${masterH})</button></div>
      <canvas id="ledOutCanvas" width="${masterW}" height="${masterH}"></canvas>
      </body></html>`;
      win.document.open();
      win.document.write(html);
      win.document.close();
      lumiState._liveOutputWin = win;
      renderLiveLedOutputFrame(win);
      const raf = win.requestAnimationFrame || window.requestAnimationFrame;
      if (typeof raf === 'function') {
        const tick = () => {
          if (!win || win.closed || lumiState._liveOutputWin !== win) return;
          renderLiveLedOutputFrame(win);
          raf(tick);
        };
        raf(tick);
      }
      trackLumiEvent('live_led_output_opened', { width: masterW, height: masterH });
      window.toast?.(tr18(`Đã mở cửa sổ phát LED 1:1 (${masterW}×${masterH} px). Kéo sang màn hình HDMI nối bộ xử lý NovaStar và bấm Fullscreen.`, `Opened 1:1 LED output (${masterW}×${masterH} px). Move it to the HDMI screen connected to NovaStar and select Fullscreen.`));
      return win;
    }

    // E3: Điều khiển Cue Trình diễn & Master Blackout (Dùng chung cho Desktop & Mobile Remote)
    function triggerShowCue(indexOrId = 0) {
      if (!lumiState.musicShowCues.length) {
        generateMusicShowCues({ bpm: 128, mood: 'edm' });
      }
      const cues = lumiState.musicShowCues;
      let idx = typeof indexOrId === 'number'
        ? indexOrId
        : cues.findIndex((c) => c.id === indexOrId || c.section === indexOrId);
      if (idx < 0 || idx >= cues.length) idx = 0;
      lumiState.activeCueIndex = idx;
      const cue = cues[idx];
      const eng = getEngine();
      if (window.state) {
        window.state.time = Number(cue.startSec) || 0;
      }
      if (eng && Array.isArray(eng.lights)) {
        const scale = (Number(cue.dimmerPercent) || 100) / 100;
        eng.lights.forEach((l) => {
          l.color = cue.lightColor || l.color;
          l.fx = cue.lightFx || 'steady';
          l.power = +(4.8 * scale).toFixed(2);
        });
        eng.rebuildFixtures?.();
      }
      if (lumiState.dmxBridge.streaming) {
        sendDmxFrameToBridge().catch(() => {});
      }
      window.renderUI?.();
      trackLumiEvent('show_cue_triggered', { cueId: cue.id, index: idx });
      return cue;
    }

    function nextShowCue() {
      const len = lumiState.musicShowCues.length || 5;
      const nextIdx = (lumiState.activeCueIndex + 1) % len;
      return triggerShowCue(nextIdx);
    }

    function prevShowCue() {
      const len = lumiState.musicShowCues.length || 5;
      const prevIdx = (lumiState.activeCueIndex - 1 + len) % len;
      return triggerShowCue(prevIdx);
    }

    function toggleMasterBlackout(forceState) {
      const eng = getEngine();
      const next = typeof forceState === 'boolean' ? forceState : !lumiState.masterBlackout;
      lumiState.masterBlackout = next;
      if (eng) {
        if (next) {
          lumiState._savedLightPowers = (eng.lights || []).map((l) => Number(l.power) ?? 4);
          lumiState._savedSurfaceBrightness = (eng.surfaces || []).map((s) => Number(s.brightness) ?? 1);
          (eng.lights || []).forEach((l) => { l.power = 0; });
          (eng.surfaces || []).forEach((s) => { s.brightness = 0; });
        } else {
          (eng.lights || []).forEach((l, i) => {
            l.power = lumiState._savedLightPowers?.[i] ?? 4.2;
          });
          (eng.surfaces || []).forEach((s, i) => {
            s.brightness = lumiState._savedSurfaceBrightness?.[i] ?? 1;
          });
        }
        eng.rebuildFixtures?.();
      }
      renderLiveLedOutputFrame();
      window.renderUI?.();
      return lumiState.masterBlackout;
    }

    // E4: Chế độ chạy show an toàn, khoá giao diện tránh bấm nhầm xoá/sửa sân khấu
    function setShowSafetyLock(locked) {
      const flag = Boolean(locked);
      lumiState.showSafetyLock = flag;
      if (document.body?.classList && document.body.classList.contains('lumi-show-locked') !== flag) {
        document.body.classList.toggle('lumi-show-locked', flag);
      }
      updateTopbarBadge18();
      trackLumiEvent('show_lock_toggled', { locked: flag });
      return flag;
    }

    function cueSectionLabel18(section) {
      const en = {"1. Intro (Mở màn)":"1. Intro","2. Verse (Dẫn dắt)":"2. Verse","3. Build-up (Cao trào)":"3. Build-up","4. Drop / Climax (Bùng nổ)":"4. Drop / Climax","5. Outro (Kết màn)":"5. Outro"};
      return tr18(section, en[section] || section);
    }

    function openLiveShowModal() {
      if (typeof window.dialog !== 'function') return;
      if (!lumiState.musicShowCues.length) {
        generateMusicShowCues({ bpm: 128, mood: 'edm' });
      }
      const dmx = lumiState.dmxBridge;
      const cuesHtml = lumiState.musicShowCues
        .map(
          (c, idx) =>
            `<button type="button" class="btn small ${lumiState.activeCueIndex === idx ? 'primary' : ''}" data-lumi18-cue="${idx}">` +
            `${esc18(cueSectionLabel18(c.section))} (${c.startSec}s · ${c.dimmerPercent}%)</button>`
        )
        .join('');

      const html =
        `<div style="display:grid;gap:10px">` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">` +
        `<div><strong>${tr18("Bàn Điều Khiển Chạy Show Trực Tiếp (Nhóm E: E1–E4)", "Live show console")}</strong><br>` +
        `<small>${tr18("Điều khiển DMX512 Art-Net / sACN, xuất màn hình LED 1:1 HDMI, Bấm Cue & Khóa an toàn giao diện", "DMX512 Art-Net / sACN, 1:1 HDMI LED output, cues and safety lock")}</small></div>` +
        `<div style="display:flex;gap:6px">` +
        `<button type="button" class="btn small ${lumiState.showSafetyLock ? 'primary' : ''}" id="lumi18LockToggleBtn">${
          lumiState.showSafetyLock ? tr18('Đang Khóa An Toàn', 'Safety lock on') : tr18('Bật Khóa An Toàn', 'Enable safety lock')
        }</button>` +
        `<button type="button" class="btn small ${lumiState.masterBlackout ? 'primary' : ''}" id="lumi18BlackoutBtn">${
          lumiState.masterBlackout ? tr18('Đang blackout (0%)', 'Blackout on (0%)') : 'Master Blackout'
        }</button>` +
        `</div></div>` +
        `<div class="info-box" style="display:grid;gap:8px">` +
        `<strong>${tr18("1. E1 — Cầu nối Điều khiển Đèn Thật DMX512 (Art-Net UDP 6454 / sACN E1.31 UDP 5568)", "DMX512 lighting bridge (Art-Net UDP 6454 / sACN E1.31 UDP 5568)")}</strong>` +
        `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">` +
        `<label style="font-size:var(--fs-md)">${tr18("Giao thức", "Protocol")}<select id="lumi18DmxProto" class="search">` +
        `<option value="artnet" ${dmx.protocol === 'artnet' ? 'selected' : ''}>Art-Net (UDP 6454)</option>` +
        `<option value="sacn" ${dmx.protocol === 'sacn' ? 'selected' : ''}>sACN E1.31 (UDP 5568)</option>` +
        `</select></label>` +
        `<label style="font-size:var(--fs-md)">${tr18("IP Card / Node Đèn", "Lighting node IP")}<input id="lumi18DmxHost" class="search" value="${esc18(dmx.host)}"></label>` +
        `<label style="font-size:var(--fs-md)">Universe<input id="lumi18DmxUni" type="number" min="0" max="63" class="search" value="${dmx.universe}"></label>` +
        `<label style="font-size:var(--fs-md)">${tr18("Cổng Bridge Local", "Local bridge port")}<input id="lumi18DmxWsPort" type="number" class="search" value="${dmx.wsPort}"></label>` +
        `</div>` +
        `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">` +
        `<small>${tr18("Lệnh chạy Bridge tại máy:", "Local bridge command:")} <code>node scripts/dmx-udp-bridge.mjs --protocol ${esc18(dmx.protocol)} --host ${esc18(dmx.host)}</code>${tr18(" · Đã gửi: ", " · Sent: ")}<strong>${dmx.packetsSent}</strong>${tr18(" gói", " packets")}</small>` +
        `<div style="display:flex;gap:6px">` +
        `<button type="button" class="btn small primary" id="lumi18DmxStreamBtn">${dmx.streaming ? tr18('Dừng phát DMX', 'Stop DMX') : tr18('Bắt đầu phát DMX (30Hz)', 'Start DMX (30Hz)')}</button>` +
        `<button type="button" class="btn small" id="lumi18DmxTestBtn">${tr18("Gửi 1 gói thử", "Send test packet")}</button>` +
        `</div></div></div>` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">` +
        `<div><strong>${tr18("2. E2 — Xuất Màn Hình LED Thật 1:1 theo Pixel Map (HDMI -> NovaStar)", "1:1 LED output from Pixel Map (HDMI → NovaStar)")}</strong><br>` +
        `<small>${tr18("Mở cửa sổ phụ không viền đúng độ phân giải Master Canvas để kéo sang cổng HDMI thứ 2", "Open a borderless output at Master Canvas resolution and move it to the second HDMI screen")}</small></div>` +
        `<button type="button" class="btn small primary" id="lumi18LiveLedOutBtn">${tr18("Mở Cửa sổ Phát LED 1:1", "Open 1:1 LED output")}</button>` +
        `</div>` +
        `<div class="info-box" style="display:grid;gap:8px">` +
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
        `<strong>${tr18("3. E3 — Bàn Bấm Cue Tiết Mục (Đồng bộ Mobile Lite Remote)", "Show cues (synced with Mobile Lite Remote)")}</strong>` +
        `<div style="display:flex;gap:6px">` +
        `<button type="button" class="btn small" id="lumi18PrevCueBtn">${tr18("Cue Trước", "Previous cue")}</button>` +
        `<button type="button" class="btn small primary" id="lumi18NextCueBtn">${tr18("Cue Tiếp ", "Next cue ")}</button>` +
        `</div></div>` +
        `<div style="display:flex;gap:6px;flex-wrap:wrap">${cuesHtml}</div>` +
        `</div></div>`;

      window.dialog(tr18('Bàn điều khiển chạy show', 'Live show console'), html, [{ label: tr18('Đóng', 'Close') }]);

      const syncDmxCfg = () => {
        dmx.protocol = $('lumi18DmxProto')?.value || 'artnet';
        dmx.host = ($('lumi18DmxHost')?.value || '127.0.0.1').trim();
        dmx.universe = Math.max(0, Number($('lumi18DmxUni')?.value) || 0);
        dmx.wsPort = Math.max(1024, Number($('lumi18DmxWsPort')?.value) || 9454);
        dmx.port = dmx.protocol === 'sacn' ? 5568 : 6454;
      };

      const lockBtn = $('lumi18LockToggleBtn');
      if (lockBtn) {
        lockBtn.onclick = () => {
          setShowSafetyLock(!lumiState.showSafetyLock);
          openLiveShowModal();
        };
      }
      const boBtn = $('lumi18BlackoutBtn');
      if (boBtn) {
        boBtn.onclick = () => {
          toggleMasterBlackout();
          openLiveShowModal();
        };
      }
      const streamBtn = $('lumi18DmxStreamBtn');
      if (streamBtn) {
        streamBtn.onclick = () => {
          syncDmxCfg();
          if (dmx.streaming) stopDmxLiveStream();
          else startDmxLiveStream();
          openLiveShowModal();
        };
      }
      const testBtn = $('lumi18DmxTestBtn');
      if (testBtn) {
        testBtn.onclick = async () => {
          syncDmxCfg();
          const res = await sendDmxFrameToBridge();
          window.toast?.(
            res.sent
              ? tr18(`Đã phát gói DMX (${res.bytes} bytes) qua ${dmx.protocol.toUpperCase()} tới ${dmx.host}:${dmx.port}.`, `Sent DMX packet (${res.bytes} bytes) via ${dmx.protocol.toUpperCase()} to ${dmx.host}:${dmx.port}.`)
              : tr18(`Chưa kết nối được Local DMX Bridge tại cổng ${dmx.wsPort}. Hãy chạy: node scripts/dmx-udp-bridge.mjs`, `Cannot connect to Local DMX Bridge on port ${dmx.wsPort}. Run: node scripts/dmx-udp-bridge.mjs`)
          );
          openLiveShowModal();
        };
      }
      const ledOutBtn = $('lumi18LiveLedOutBtn');
      if (ledOutBtn) ledOutBtn.onclick = () => openLiveLedOutputWindow();

      const prevBtn = $('lumi18PrevCueBtn');
      if (prevBtn) {
        prevBtn.onclick = () => {
          prevShowCue();
          openLiveShowModal();
        };
      }
      const nextBtn = $('lumi18NextCueBtn');
      if (nextBtn) {
        nextBtn.onclick = () => {
          nextShowCue();
          openLiveShowModal();
        };
      }
      document.querySelectorAll?.('[data-lumi18-cue]')?.forEach((btn) => {
        btn.onclick = () => {
          const idx = Number(btn.getAttribute('data-lumi18-cue')) || 0;
          triggerShowCue(idx);
          openLiveShowModal();
        };
      });
    }

    function updateTopbarBadge18() {
      const tplBtn = $('lumi18TemplatesBtn');
      if (tplBtn) {
        const sp = tplBtn.querySelector('span');
        if (sp) sp.textContent = t18('templatesBtn');
        else tplBtn.innerHTML = ico18('box') + `<span>${t18('templatesBtn')}</span>`;
      }
      const aiBtn = $('lumi18AiBtn');
      if (aiBtn) aiBtn.textContent = t18('aiBtn');
      const bomBtn = $('lumi18BomBtn');
      if (bomBtn) {
        const sp = bomBtn.querySelector('span');
        if (sp) sp.textContent = t18('bomBtn');
        else bomBtn.innerHTML = ico18('file-text') + `<span>${t18('bomBtn')}</span>`;
      }
      const showBtn = $('lumi18LiveShowBtn');
      if (showBtn) {
        const ico = lumiState.showSafetyLock ? 'lock' : 'clapperboard';
        showBtn.innerHTML = ico18(ico) + `<span>${t18('liveShowBtn')}</span>`;
      }
      const chip = $('account18Chip');
      if (chip) {
        chip.innerHTML = ico18(lumiState.isProActive ? 'crown' : 'wallet') + '<span>' + (lumiState.isProActive ? 'PRO' : lumiState.balanceReady ? lumiState.balanceCredits.toLocaleString() + ' Credit' : tr18('Tài khoản', 'Account')) + '</span>';
        chip.title = tr18('Tài khoản', 'Account'); chip.setAttribute('aria-label', chip.title);
      }
    }


    function arrangeToolbar18() {
      const workflow = document.querySelector('.workflow-right');
      const header = document.querySelector('.topbar');
      const actions = document.querySelector('.header-actions');
      if (!workflow || !header || !actions || $('toolbar18Groups')) return;
      const file = document.createElement('div'); file.id = 'toolbar18File';
      for (const id of ['newProject', 'loadProject', 'saveProject', 'undoBtn', 'redoBtn']) { const b = $(id); if (b) file.appendChild(b); }
      const center = document.createElement('div'); center.id = 'toolbar18Center';
      const project = header.querySelector('.project-name');
      header.insertBefore(center, project || actions);
      center.appendChild(file);
      if (project) center.appendChild(project);
      for (const [id, vi, en] of [['newProject', 'Dự án mới', 'New project'], ['loadProject', 'Mở dự án (.ledstudio)', 'Open project (.ledstudio)'], ['saveProject', 'Lưu dự án · Ctrl+S', 'Save project · Ctrl+S'], ['undoBtn', 'Hoàn tác · Ctrl+Z', 'Undo · Ctrl+Z'], ['redoBtn', 'Làm lại · Ctrl+Shift+Z', 'Redo · Ctrl+Shift+Z']]) {
        const b = $(id); if (b) { b.title = tr18(vi, en); b.setAttribute('aria-label', b.title); }
      }
      const menus = [
        ['add', 'toolbar18Add'], ['stage', 'toolbar18Led'], ['lighting', 'toolbar18Lights'], ['show', 'toolbar18Show']
      ];
      for (const [key, id] of menus) { const b = document.querySelector(`[data-v16menu="${key}"]`); if (b) b.id = id; }
      const groupIcons = {
        stage: 'package',
        led: 'grid-3x3',
        lights: 'moving-head',
        choreo: 'drama',
        show: 'clapperboard',
        export: 'download',
        more: 'more-horizontal'
      };
      const groups = document.createElement('div'); groups.id = 'toolbar18Groups';
      const buildGroup = (id, vi, en, ids, parent = groups) => {
        const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'btn small'; trigger.id = `toolbar18-${id}`;
        const lead = ico18(groupIcons[id] || 'layers');
        trigger.innerHTML = `${lead}<span>${tr18(vi, en)}</span>${ico18('chevron-down')}`;
        trigger.title = tr18(vi, en); trigger.setAttribute('aria-label', trigger.title); trigger.setAttribute('aria-expanded', 'false');
        const pop = document.createElement('div'); pop.id = `toolbar18-${id}-menu`; pop.className = 'toolbar18-menu';
        pop.setAttribute('popover', ''); pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', trigger.title);
        trigger.setAttribute('popovertarget', pop.id);
        for (const key of ids) { const b = $(key); if (b) { b.classList.remove('primary'); pop.appendChild(b); } }
        pop.addEventListener('toggle', e => {
          trigger.setAttribute('aria-expanded', String(e.newState === 'open'));
          if (e.newState === 'open') {
            const r = trigger.getBoundingClientRect(); pop.style.left = `${Math.max(8, Math.min(innerWidth - 270, r.left))}px`; pop.style.top = `${r.bottom + 5}px`;
          }
        });
        pop.addEventListener('click', e => { if (e.target.closest('button') && !e.target.closest('[data-v16menu]')) pop.hidePopover(); }, true);
        parent.appendChild(trigger); document.body.appendChild(pop);
      };
      buildGroup('stage', 'Dựng sân khấu', 'Build stage', ['lumi18TemplatesBtn', 'v16AssetBtn', 'toolbar18Add']);
      buildGroup('led', 'Mapping LED', 'LED mapping', ['ledManagerBtn', 'atlasBtn', 'toolbar18Led']);
      buildGroup('lights', 'Ánh sáng & FX', 'Lighting & FX', ['toolbar18Lights', 'vjToggle']);
      buildGroup('choreo', 'Biên đạo', 'Choreography', ['v07Cast']);
      buildGroup('show', 'Chạy show', 'Live show', ['v07Timeline', 'v07Audio', 'lumi18LiveShowBtn', 'presentBtn', 'toolbar18Show']);
      buildGroup('export', 'Xuất', 'Export', ['exportBtn', 'lumi18BomBtn']);
      buildGroup('more', 'Thêm', 'More', ['cloud16SaveBtn', 'cloud16OpenBtn', 'cloud16PresetsBtn', 'cloud16ShareBtn', 'recovery142OpenBtn', 'helpBtn', 'v16AllToolsBtn'], file);
      workflow.appendChild(groups);
      for (const id of ['aiChat18Toggle', 'account18Chip', 'uiSettingsBtn16', 'langToggleBtn16', 'themeToggleBtn']) { const b = $(id); if (b) actions.appendChild(b); }
      const tl = $('v07Timeline');
      if (tl) {
        const sp = tl.querySelector('span');
        if (sp) sp.textContent = tr18('Timeline', 'Timeline');
        else tl.innerHTML = ico18('sliders-horizontal') + `<span>${tr18('Timeline', 'Timeline')}</span>`;
      }
    }


    function injectLumiStageUI() {
      if (S.cloud16?.isClientReviewMode?.()) return;
      document.title = 'ALPHA Creative LED Studio';
      const brandTitle = document.querySelector?.('.topbar .brand strong');
      if (brandTitle) brandTitle.innerHTML = 'ALPHA <span>Creative LED Studio</span>';
      const brandSub = document.querySelector?.('.topbar .brand small');
      if (brandSub) brandSub.textContent = tr18('Thiết kế sân khấu 3D', '3D stage design');

      const wfRight = document.querySelector?.('.workflow .workflow-right');
      if (wfRight && !$('lumi18TemplatesBtn')) {
        const tplBtn = document.createElement('button');
        tplBtn.id = 'lumi18TemplatesBtn';
        tplBtn.type = 'button';
        tplBtn.className = 'btn small';
        tplBtn.innerHTML = ico18('box') + `<span>${t18('templatesBtn')}</span>`;
        tplBtn.title = tr18('6 mẫu sân khấu sự kiện', '6 event stage templates');
        tplBtn.onclick = () => openStageTemplatesModal();

        const bomBtn = document.createElement('button');
        bomBtn.id = 'lumi18BomBtn';
        bomBtn.type = 'button';
        bomBtn.className = 'btn small';
        bomBtn.innerHTML = ico18('file-text') + `<span>${t18('bomBtn')}</span>`;
        bomBtn.title = tr18('Bóc tách khối lượng, báo giá và bản vẽ DXF', 'Bill of materials, quotes and DXF drawings');
        bomBtn.onclick = () => openBomAndQuoteModal();

        const showBtn = document.createElement('button');
        showBtn.id = 'lumi18LiveShowBtn';
        showBtn.type = 'button';
        showBtn.className = 'btn small';
        showBtn.innerHTML = ico18('clapperboard') + `<span>${t18('liveShowBtn')}</span>`;
        showBtn.title = tr18('Chạy show, đầu ra LED và khóa an toàn', 'Live show, LED output and safety lock');
        showBtn.onclick = () => openLiveShowModal();



        wfRight.prepend(showBtn);
        wfRight.prepend(bomBtn);
        wfRight.prepend(tplBtn);

      }

      const actions = document.querySelector?.('.header-actions');
      if (actions && !$('aiChat18Toggle')) {
        const ai = document.createElement('button');
        ai.id = 'aiChat18Toggle'; ai.type = 'button'; ai.className = 'icon-btn';
        ai.title = tr18('Trợ lý AI · Ctrl+I', 'AI assistant · Ctrl+I');
        ai.setAttribute('aria-label', ai.title); ai.setAttribute('aria-controls', 'aiChat18'); ai.setAttribute('aria-expanded', 'false');
        ai.innerHTML = ico18('bot'); ai.onclick = openStageAiModal;
        actions.prepend(ai);
        document.addEventListener('keydown', e => { if (e.ctrlKey && e.key.toLowerCase() === 'i' && !S.cloud16?.isClientReviewMode?.()) { e.preventDefault(); openStageAiModal(); } });
        try { const layout = JSON.parse(localStorage.getItem('ledstudio-ai-chat') || '{}'); chatWidth18 = Number(layout.width) || 0; } catch { /* storage unavailable */ }
      }
      injectAccount18(actions);
      const exportMenu = $('exportMenu');
      if (exportMenu && !$('exportShot4K')) {
        const btn4K = document.createElement('button');
        btn4K.id = 'exportShot4K';
        btn4K.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-camera"></use></svg><div><b>' + tr18('Phối cảnh 3D 4K', '4K stage image') + '</b><span>PNG / 3840 x 2160</span></div>';
        btn4K.onclick = () => S.exportShot4K?.();

        const btnDxf = document.createElement('button');
        btnDxf.id = 'exportCadDxf18';
        btnDxf.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-ruler"></use></svg><div><b>' + tr18('Bản vẽ 2D', '2D drawing') + '</b><span>' + tr18('DXF / Mặt bằng & Mặt đứng', 'DXF / Floor plan & elevation') + '</span></div>';
        btnDxf.onclick = () => exportStageDxf();

        const btnQuote = document.createElement('button');
        btnQuote.id = 'exportQuotePdf18';
        btnQuote.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-file-text"></use></svg><div><b>' + tr18('Báo giá & BOM', 'Quote & BOM') + '</b><span>PDF / CSV</span></div>';
        btnQuote.onclick = () => openBomAndQuoteModal();

        const firstShot = $('exportShot');
        if (firstShot && firstShot.parentNode === exportMenu) {
          firstShot.after(btnQuote);
          firstShot.after(btnDxf);
          firstShot.after(btn4K);
        } else {
          exportMenu.appendChild(btn4K);
          exportMenu.appendChild(btnDxf);
          exportMenu.appendChild(btnQuote);
        }
      }
      arrangeToolbar18();
    }

    window.addEventListener?.('ledstudio:locale', () => {
      lumiState.lang = document.documentElement.dataset.locale === 'en' ? 'en' : 'vi';
      updateTopbarBadge18();
      if ($('aiChat18')) renderChat18();
      if ($('account18Menu')?.matches(':popover-open')) renderAccountMenu18();
      window.translateUiText?.();
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => injectLumiStageUI());
    } else {
      injectLumiStageUI();
    }

    S.lumi18 = {
      state: lumiState,
      brand: LUMI_BRAND,
      i18n: LUMI_I18N,
      t18,
      setLumiLanguage,
      templates: VN_STAGE_TEMPLATES,
      helpTopics: LUMI_HELP_TOPICS,
      applyStageTemplate,
      executeStageCommands,
      previewStageCommands,
      commitStagePreview,
      revertStagePreview,
      answerSoftwareGuide,
      runQuickGuideAction,
      parseStagePromptOffline,
      runStageAiPrompt,
      computeStageBom,
      buildClientProposalText,
      generateStageDxf,
      exportStageDxf,
      parseDxfFloorplan,
      importDxfFloorplanFile,
      exportQuotationCsv,
      printStageDocument,
      shouldWatermarkExport,
      ensureExportAllowed,
      refreshBillingStatus,
      purchaseLumiProduct,
      loadByokConfig,
      saveByokConfig,
      setTelemetryOptIn,
      trackLumiEvent,
      checkAudienceSightlines,
      layoutAudienceSeating,
      generateMusicShowCues,
      applyBrandIdentity,
      encodeDmxUniverseFrame,
      buildArtNetPacket18,
      buildSacnPacket18,
      sendDmxFrameToBridge,
      startDmxLiveStream,
      stopDmxLiveStream,
      renderLiveLedOutputFrame,
      openLiveLedOutputWindow,
      triggerShowCue,
      nextShowCue,
      prevShowCue,
      toggleMasterBlackout,
      setShowSafetyLock,
      openStageTemplatesModal,
      openStageAiModal,
      closeAiChat18,
      openBomAndQuoteModal,
      openLiveShowModal,
      openBillingModal,
      getWalletUrl18,
      syncAccount18
    };
  } catch (err) {
    console.error('LumiStage V18 init error:', err);
  }
})();
