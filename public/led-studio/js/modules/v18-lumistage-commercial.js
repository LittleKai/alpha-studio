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
      telemetryOptIn: loadTelemetryOptIn(),
      musicShowCues: [],
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
      freeAiCreditsRemaining: 50,
      effort: 'medium',
      byok: loadByokConfig(),
      lastAiReply: null,
      lastAiUsage: null,
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
        name: 'Tiệc cưới Sang trọng / Luxury Wedding',
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
        name: 'Đại nhạc hội EDM / Countdown Festival',
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
      const tpl = VN_STAGE_TEMPLATES[templateId];
      if (!tpl) {
        window.toast?.('Không tìm thấy mẫu sân khấu: ' + templateId);
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
          name: scr.name,
          wPx: computePixelDim(wM, pitch),
          hPx: computePixelDim(hM, pitch),
          wM,
          hM,
          pitchMm: pitch
        });
      }

      meshes.push(...buildTrussMeshes(widthM, depthM, heightM, maxTopY, tpl.truss));
      eng.setModel(meshes);
      eng.surfaces = [];
      let cursorX = 0;
      let maxH = 64;
      for (const s of createdScreens) {
        const surf = window.createSurface(s.mesh, s.name, { x: cursorX, y: 0, w: s.wPx, h: s.hPx });
        if (surf && !eng.surfaces.includes(surf)) eng.surfaces.push(surf);
        surf.pitchMm = s.pitchMm;
        surf.physicalWidthM = s.wM;
        surf.physicalHeightM = s.hM;
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
      window.toast?.(`Đã dựng mẫu "${tpl.name}" (${widthM}×${depthM}m · P${defaultPitch}). Bấm Ctrl+Z nếu muốn hoàn tác.`);
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
          `Góc nhìn lệch cánh hai bên (${horizontalAngleDeg}°) > 45° — khuyến nghị bổ sung 2 màn LED phụ (Side Wing) nghiêng 12°–15°.`
        );
      }
      if (occludingProps.length > 0) {
        warnings.push(`Phát hiện đạo cụ có nguy cơ che tầm nhìn trung tâm LED: ${occludingProps.join(', ')}.`);
      }

      const passed = warnings.length === 0;
      const summaryVi =
        `👁 KIỂM TRA TIA NHÌN KHÁN GIẢ (3D SIGHTLINE CHECK):\n` +
        `- Khoảng cách khán giả: Hàng đầu ${minViewDistM}m → Hàng cuối ${maxViewDistM}m (Chuẩn nhìn rõ LED P${pitchMm}: từ ${minPitchDistM}m, tối ưu ${optimalPitchDistM}m).\n` +
        `- Góc ngẩng dọc (Vertical Sightline): ${verticalAngleDeg}° (Chuẩn <= 30°) · Góc lệch ngang (Horizontal): ${horizontalAngleDeg}° (Chuẩn <= 45°).\n` +
        (warnings.length
          ? `- Cảnh báo tầm nhìn:\n  + ${warnings.join('\n  + ')}`
          : `- Đánh giá: ĐẠT CHUẨN TẦM NHÌN 100% — Không có vật cản che khuất màn LED chính.`);

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
        summaryVi
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
        `🎵 KỊCH BẢN ĐẠO DIỄN ÁNH SÁNG & LED THEO NHẠC (${pal.label} · ${cleanBpm} BPM · 1 Khuông = ${barSec}s):\n` +
        cues
          .map(
            (c) =>
              `- [${c.startSec}s → +${c.durationSec}s] ${c.section}: Đèn DMX (${c.lightFx.toUpperCase()} · ${c.lightColor} · Dimmer ${c.dimmerPercent}%) + LED (${c.ledContent})`
          )
          .join('\n');

      return {
        bpm: cleanBpm,
        mood: cleanMood,
        barSec,
        cues,
        summaryVi
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
        `🎨 ĐÃ ĐỒNG BỘ BỘ NHẬN DIỆN THƯƠNG HIỆU LÊN SÂN KHẤU 3D:\n` +
        `- Thương hiệu / Khách hàng: ${cleanName}\n` +
        `- Màu chủ đạo (Primary): ${primary} · Màu điểm nhấn (Accent): ${accent}\n` +
        `- Đã cập nhật đồng bộ ${lightsUpdated} đèn DMX + màu chủ đạo LED Matrix + thông tin Khách hàng trên Báo giá.`;

      return {
        brandName: cleanName,
        primaryColor: primary,
        accentColor: accent,
        lightsUpdated,
        summaryVi
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

    function executeStageCommands(commands = [], { recordUndo = true } = {}) {
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
            if (cmd.pitchMm || cmd.pitch) target.pitchMm = Math.max(1.2, Math.min(16, Number(cmd.pitchMm || cmd.pitch)));
            if (cmd.widthM || cmd.width) target.physicalWidthM = Math.max(0.5, Number(cmd.widthM || cmd.width));
            if (cmd.heightM || cmd.height) target.physicalHeightM = Math.max(0.5, Number(cmd.heightM || cmd.height));
            const p = target.pitchMm || 3.91;
            if (target.physicalWidthM) target.w = computePixelDim(target.physicalWidthM, p);
            if (target.physicalHeightM) target.h = computePixelDim(target.physicalHeightM, p);
            if (cmd.brightness !== undefined) target.brightness = Math.max(0.1, Math.min(2, Number(cmd.brightness) || 1));
            repackSurfacesMaster(eng);
            applied++;
          }
          continue;
        }

        if (action === 'remove_led') {
          const beforeLen = eng.surfaces.length;
          if (Number.isInteger(cmd.index) && cmd.index >= 0 && cmd.index < eng.surfaces.length) {
            eng.surfaces.splice(cmd.index, 1);
          } else {
            eng.surfaces = eng.surfaces.filter((s) => s.id !== cmd.id && s.name !== cmd.name);
          }
          if (eng.surfaces.length !== beforeLen) {
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
          const isBeam = String(cmd.fixtureType || cmd.kind || 'beam').toLowerCase().includes('beam');
          for (let i = 0; i < count && eng.lights.length < 128; i++) {
            const u = count > 1 ? i / (count - 1) - 0.5 : 0;
            const idx = eng.lights.length + 1;
            eng.lights.push({
              id: 'light_ai_' + Date.now().toString(36) + '_' + i,
              name: (isBeam ? 'Beam 230 #' : 'Par Wash #') + String(idx).padStart(2, '0'),
              pos: [+(u * w * 0.85).toFixed(2), +(h * 0.92).toFixed(2), +(-d * 0.2).toFixed(2)],
              target: [+(u * w * 0.4).toFixed(2), 0.25, +(d * 0.5).toFixed(2)],
              color,
              power: isBeam ? 4.8 : 3.5,
              angle: isBeam ? 12 : 24,
              enabled: true,
              sweep: isBeam,
              speed: 0.4,
              phase: +(i * 0.35).toFixed(2),
              fx: cmd.fx || 'steady',
              fxDepth: 0.55,
              fxSpeed: 2.2,
              boost: 1,
              oflProfileId: isBeam ? 'vn-stage/beam-230-7r' : 'vn-stage/par-led-54x3w'
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

    // Bộ phân tích câu lệnh tiếng Việt cục bộ (Offline Fallback khi không có mạng / chưa đăng nhập)
    function parseStagePromptOffline(promptText) {
      const text = String(promptText || '').toLowerCase();
      const commands = [];
      let reply = '';

      const sizeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*m?/i);
      const widthM = sizeMatch ? parseFloat(sizeMatch[1].replace(',', '.')) : null;
      const depthM = sizeMatch ? parseFloat(sizeMatch[2].replace(',', '.')) : null;
      const pitchMatch = text.match(/p\s*(2[.,]5|2[.,]6|2[.,]97|3[.,]91|4[.,]81)/i);
      const pitchMm = pitchMatch ? parseFloat(pitchMatch[1].replace(',', '.')) : null;
      const lightMatch = text.match(/(\d+)\s*(?:đèn|den|beam|par|moving)/i);
      const lightCount = lightMatch ? parseInt(lightMatch[1], 10) : null;

      if (/tiệc cưới|tiec cuoi|wedding|đám cưới/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'wedding', widthM, depthM, pitchMm, lightCount });
        reply = 'Đã dựng phương án Sân khấu Tiệc cưới Sang trọng kèm cổng vòm, đường dẫn Catwalk và pháo điện lạnh.';
      } else if (/edm|concert|đại nhạc hội|countdown|dj/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'concert', widthM, depthM, pitchMm, lightCount });
        reply = 'Đã dựng phương án Đại nhạc hội EDM / Countdown với hệ LED đa cánh, bàn DJ, Line Array và dàn Moving Head Beam.';
      } else if (/khai trương|khánh thành|ra mắt|grand opening|launch/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'grand_opening', widthM, depthM, pitchMm, lightCount });
        reply = 'Đã dựng phương án Sân khấu Lễ Khai trương / Ra mắt sản phẩm với cổng LED Arch và bục phát biểu VIP.';
      } else if (/gala|year end|yep|tất niên/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'gala_dinner', widthM, depthM, pitchMm, lightCount });
        reply = 'Đã dựng phương án Sân khấu Gala Dinner / Year End Party kèm vòng LED Kinetic trần và bàn tiệc Gala.';
      } else if (/ngoài trời|outdoor|beerfest|lễ hội/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'outdoor_festival', widthM, depthM, pitchMm, lightCount });
        reply = 'Đã dựng phương án Sân khấu Lễ hội Ngoài trời (Outdoor P4.81) kèm mái vòm Truss, rào chắn Mojo và trạm FOH.';
      } else if (/hội nghị|hoi nghi|doanh nghiệp|đại hội|conference|seminar/.test(text)) {
        commands.push({ action: 'load_template', templateId: 'conference', widthM, depthM, pitchMm, lightCount });
        reply = 'Đã dựng phương án Sân khấu Hội nghị Doanh nghiệp với màn LED trung tâm, 2 màn cánh, bục VIP và bàn đại biểu IBM.';
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
        reply = 'Đã thực thi cập nhật cấu hình sân khấu 3D theo yêu cầu của bạn.';
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

    async function runStageAiPrompt(promptText, mode = 'command') {
      const cleanPrompt = String(promptText || '').trim();
      if (!cleanPrompt) throw new Error('Vui lòng nhập yêu cầu thiết kế sân khấu.');
      const cloud = S.cloud16;
      const apiUrl = cloud?.apiUrl ? cloud.apiUrl('/ai/stage') : '/api/led-studio/ai/stage';
      const token = cloud?.state?.token || null;

      if (token || lumiState.byok.enabled) {
        try {
          window.busy?.(true, 'LumiStage AI (Gemini Flash 3.8) đang tính toán phương án sân khấu 3D...');
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
            body: JSON.stringify(body)
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json.success) {
            throw new Error(json?.message || `Lỗi gọi AI HTTP ${res.status}`);
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
          const nextBal = data.balanceAfter ?? bill.remainingBalance;
          if (typeof nextBal === 'number') lumiState.balanceCredits = nextBal;
          const nextFree = data.freeAiCreditsRemaining ?? bill.remainingFreeAiCredits;
          if (typeof nextFree === 'number') {
            lumiState.freeAiCreditsRemaining = nextFree;
          }
          if (Array.isArray(data.commands) && data.commands.length) {
            executeStageCommands(data.commands, { recordUndo: true });
          }
          updateTopbarBadge18();
          return data;
        } catch (err) {
          // Nếu lỗi mạng cục bộ thì fallback sang bộ giải mã offline
          if (!token && !lumiState.byok.enabled) {
            const local = parseStagePromptOffline(cleanPrompt);
            executeStageCommands(local.commands, { recordUndo: true });
            return local;
          }
          throw err;
        } finally {
          window.busy?.(false);
        }
      }

      const local = parseStagePromptOffline(cleanPrompt);
      executeStageCommands(local.commands, { recordUndo: true });
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

      const beamCount = lights.filter((l) => (l.angle || 15) <= 18 || /beam|pointe|spot/i.test(l.name)).length;
      const washCount = Math.max(0, lights.length - beamCount);
      const lightMaxKw = +(beamCount * 0.38 + washCount * 0.2).toFixed(2);
      const lightWeightKg = beamCount * 17 + washCount * 4;

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
        warnings.push(`Tổng tải treo (${totalRiggingWeightKg} kg) lớn — bắt buộc dùng Palăng xích điện (Chain Hoist) 1 tấn × 6–8 điểm và giằng chống gió theo TCVN 2737:2023.`);
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
          totalLights: lights.length,
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

    function generateStageDxf() {
      const eng = getEngine();
      const bom = computeStageBom();
      const w = bom.summary.stageW || 16;
      const d = bom.summary.stageD || 8;
      const entities = [];

      // 1. MẶT BẰNG (TOP VIEW — gốc tại (0, 0))
      entities.push(dxfText('DIMENSIONS', -w / 2, d / 2 + 1.8, 0.45, `MAT BANG SAN KHAU (TOP VIEW) - ${w}m x ${d}m`));
      entities.push(dxfRect('STAGE_PLATFORM', 0, 0, w, d));

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
      const dxf = generateStageDxf();
      const name = (window.state?.model?.name || 'LumiStage').replace(/[^a-zA-Z0-9_-]/g, '_');
      window.downloadText?.(`${name}_2D_CAD.dxf`, dxf);
      window.toast?.('Đã xuất bản vẽ kỹ thuật 2D AutoCAD (.dxf) Mặt bằng & Mặt đứng (đơn vị: mét).');
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
        throw new Error('Không tìm thấy nét vẽ LINE / LWPOLYLINE trong tệp .DXF.');
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
      window.toast?.(`Đã nhập mặt bằng CAD 2D (${maxSegs} nét vẽ) lên sàn sân khấu 3D.`);
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
        if (res.ok && json.success && json.data) {
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
        window.toast?.('Vui lòng đăng nhập tài khoản Alpha Studio để thanh toán bằng Credit.');
        return null;
      }
      try {
        window.busy?.(true, 'Đang xử lý giao dịch Credit LumiStage...');
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
          throw new Error(json?.message || 'Giao dịch không thành công.');
        }
        await refreshBillingStatus();
        if (productKey === 'lumi_unlock_project') lumiState.projectUnlocked = true;
        window.toast?.(json.message || 'Đã kích hoạt thành công bằng Credit!');
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
      window.toast?.('Đã xuất bảng báo giá thương mại (.CSV mở bằng Excel).');
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
        window.toast?.('Trình duyệt chặn cửa sổ In PDF. Hãy cho phép pop-up rồi bấm lại.');
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
        <button onclick="window.print()" style="padding:8px 16px;background:#0284c7;color:#fff;border:0;border-radius:6px;cursor:pointer;font-weight:600">🖨 In / Lưu thành PDF (Chuẩn A4)</button>
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
    function openStageTemplatesModal() {
      if (typeof window.dialog !== 'function') return;
      const cardsHtml = Object.values(VN_STAGE_TEMPLATES)
        .map(
          (tpl) =>
            `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px">` +
            `<div><strong>🏛 ${esc18(tpl.name)}</strong> <small style="color:#38bdf8">[${esc18(tpl.category)}]</small><br>` +
            `<small>${esc18(tpl.summary)}</small></div>` +
            `<button type="button" class="btn small primary" data-lumi18-tpl="${esc18(tpl.id)}">Dựng 3D</button>` +
            `</div>`
        )
        .join('');

      const paramHtml =
        `<div class="info-box" style="margin-bottom:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px">` +
        `<label style="font-size:12px">Rộng sàn (m)<input id="lumi18TplW" type="number" min="4" max="60" step="1" placeholder="Mặc định mẫu" class="search"></label>` +
        `<label style="font-size:12px">Sâu sàn (m)<input id="lumi18TplD" type="number" min="3" max="40" step="1" placeholder="Mặc định mẫu" class="search"></label>` +
        `<label style="font-size:12px">Cao sàn (m)<input id="lumi18TplH" type="number" min="0.2" max="3" step="0.1" placeholder="Mặc định mẫu" class="search"></label>` +
        `<label style="font-size:12px">Pixel Pitch<select id="lumi18TplPitch" class="search">` +
        `<option value="">Theo mẫu chuẩn</option>` +
        `<option value="2.5">P2.5 Indoor Siêu nét</option>` +
        `<option value="2.97">P2.97 Sự kiện / Tiệc cưới</option>` +
        `<option value="3.91">P3.91 Phổ thông (500×500)</option>` +
        `<option value="4.81">P4.81 Outdoor / Lễ hội</option>` +
        `</select></label>` +
        `</div>` +
        `<div style="max-height:360px;overflow:auto">${cardsHtml}</div>`;

      window.dialog('6 Mẫu Sân Khấu Sự Kiện Việt Nam (LumiStage Parameterized)', paramHtml, [{ label: 'Đóng' }]);
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

    function openStageAiModal() {
      if (typeof window.dialog !== 'function') return;
      const bom = computeStageBom();
      const s = bom.summary;
      const byok = lumiState.byok;
      const html =
        `<div style="display:grid;gap:10px">` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">` +
        `<div><strong>🤖 Trợ lý AI Sân khấu 3D (${esc18(LUMI_BRAND.name)})</strong><br>` +
        `<small>Giá Web AI = <strong>1/3 Gemini chính thức</strong>: 25 Cr/1M input · 210 Cr/1M output (1 Cr = 100đ)</small></div>` +
        `<div style="display:flex;gap:6px;align-items:center">` +
        `<span class="local-badge">Ví: ${lumiState.balanceCredits} Cr · AI tặng: ${lumiState.freeAiCreditsRemaining} Cr</span>` +
        `<button type="button" class="btn small" id="lumi18UndoAiBtn" title="Hoàn tác thao tác AI vừa chạy">↶ Hoàn tác (Undo)</button>` +
        `</div></div>` +
        `<div class="info-box" style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end">` +
        `<label style="font-size:12px">Chế độ Suy luận (Gemini Flash 3.8 via gcli — 3 Effort)<select id="lumi18EffortSelect" class="search">` +
        LUMI_BRAND.aiPricing.efforts
          .map((e) => `<option value="${esc18(e.id)}" ${lumiState.effort === e.id ? 'selected' : ''}>${esc18(e.label)}</option>`)
          .join('') +
        `</select></label>` +
        `<label class="check-row" style="margin:0;padding:6px 8px"><input type="checkbox" id="lumi18ByokToggle" ${byok.enabled ? 'checked' : ''}> 🔑 Dùng API Key riêng (BYOK · 0 Credit)</label>` +
        `</div>` +
        `<div id="lumi18ByokBox" class="info-box" style="display:${byok.enabled ? 'grid' : 'none'};grid-template-columns:repeat(2,1fr);gap:8px">` +
        `<label style="font-size:12px">Nhà cung cấp (Provider)<select id="lumi18ByokProvider" class="search">` +
        ['gemini', 'openai', 'openrouter', 'deepseek', 'groq', 'anthropic', 'custom']
          .map((p) => `<option value="${p}" ${byok.provider === p ? 'selected' : ''}>${p.toUpperCase()}</option>`)
          .join('') +
        `</select></label>` +
        `<label style="font-size:12px">Model ID<input id="lumi18ByokModel" class="search" value="${esc18(byok.model)}" placeholder="gemini-2.5-flash / gpt-4o-mini"></label>` +
        `<label style="font-size:12px">API Key cá nhân (Lưu cục bộ trên trình duyệt)<input id="lumi18ByokKey" type="password" class="search" value="${esc18(byok.apiKey)}" placeholder="<YOUR_API_KEY>"></label>` +
        `<label style="font-size:12px">Base URL (Tuỳ chọn cho Custom OpenAI)<input id="lumi18ByokUrl" class="search" value="${esc18(byok.baseUrl)}" placeholder="https://api.openai.com/v1"></label>` +
        `</div>` +
        `<div class="info-box" style="display:grid;gap:8px">` +
        `<textarea id="lumi18AiPrompt" rows="3" style="width:100%;padding:8px;border-radius:6px;background:rgba(15,23,42,.85);color:#e2e8f0;border:1px solid rgba(148,163,184,.3)" placeholder="Nhập yêu cầu tiếng Việt (VD: Tạo sân khấu Gala Dinner 16x8m, màn LED chính 9x4.5m P3.91, 2 màn cánh, 24 đèn Beam 230 và 2 máy pháo điện)..."></textarea>` +
        `<div style="display:flex;gap:6px;flex-wrap:wrap">` +
        `<button type="button" class="btn primary" id="lumi18RunCmdBtn">✨ Thực thi lên Sân khấu 3D</button>` +
        `<button type="button" class="btn" id="lumi18RunAuditBtn">🔍 AI Kiểm toán Kỹ thuật</button>` +
        `<button type="button" class="btn" id="lumi18RunProposalBtn">📝 Viết Thuyết minh Khách hàng</button>` +
        `<button type="button" class="btn" id="lumi18OptimizeBudgetBtn">💰 Tối ưu Ngân sách</button>` +
        `<button type="button" class="btn" id="lumi18SeatingBtn">🪑 Bố trí Bàn ghế & Tia nhìn (A3)</button>` +
        `<button type="button" class="btn" id="lumi18MusicCuesBtn">🎵 Đạo diễn Nhạc & Đèn (A4)</button>` +
        `<button type="button" class="btn" id="lumi18BrandSyncBtn">🎨 Màu Thương hiệu (A5)</button>` +
        `</div></div>` +
        `<div id="lumi18AiOutput" class="info-box" style="max-height:200px;overflow:auto;white-space:pre-wrap;font-size:12.5px">${
          lumiState.lastAiReply
            ? esc18(lumiState.lastAiReply)
            : `📊 <strong>Kiểm toán nhanh hiện tại:</strong> Sàn ${s.stageW}×${s.stageD}m · LED ${s.totalLedAreaM2} m² (${s.totalCabinets500} cab) · ${s.totalPixels.toLocaleString('vi-VN')} px (${s.recommendedProcessor}) · Điện 3 pha ${s.totalMaxKw} kW (~${s.currentPerPhaseAmps}A/pha) · Tải treo ${s.totalRiggingWeightKg} kg.`
        }</div>` +
        `</div>`;

      window.dialog('Trợ lý AI Sân khấu 3D & Kiểm toán Kỹ thuật (LumiStage AI)', html, [{ label: 'Đóng' }]);

      const effortSel = $('lumi18EffortSelect');
      if (effortSel) effortSel.onchange = () => { lumiState.effort = effortSel.value; };

      const byokToggle = $('lumi18ByokToggle');
      if (byokToggle) {
        byokToggle.onchange = () => {
          const box = $('lumi18ByokBox');
          if (box) box.style.display = byokToggle.checked ? 'grid' : 'none';
          saveByokConfig({ ...lumiState.byok, enabled: byokToggle.checked });
        };
      }

      const syncByokInputs = () => {
        saveByokConfig({
          enabled: Boolean($('lumi18ByokToggle')?.checked),
          provider: $('lumi18ByokProvider')?.value || 'gemini',
          model: $('lumi18ByokModel')?.value || 'gemini-2.5-flash',
          apiKey: $('lumi18ByokKey')?.value || '',
          baseUrl: $('lumi18ByokUrl')?.value || ''
        });
      };

      const undoBtn = $('lumi18UndoAiBtn');
      if (undoBtn) {
        undoBtn.onclick = () => {
          window.undo?.();
          window.toast?.('Đã hoàn tác thao tác sân khấu trước đó.');
        };
      }

      const runMode = async (mode, defaultPrompt = '') => {
        syncByokInputs();
        const promptVal = ($('lumi18AiPrompt')?.value || '').trim() || defaultPrompt;
        if (!promptVal) {
          window.toast?.('Hãy nhập mô tả sân khấu hoặc yêu cầu cho AI.');
          return;
        }
        try {
          const data = await runStageAiPrompt(promptVal, mode);
          const out = $('lumi18AiOutput');
          if (out) {
            const usageObj = data.usage || data.billing || null;
            const charged = data.creditsCharged ?? data.billing?.creditCharged ?? 0;
            const usageTxt = usageObj && usageObj.promptTokens !== undefined
              ? `\n\n[Token: ${usageObj.promptTokens || 0} in / ${usageObj.completionTokens || 0} out · Chi phí: ${charged} Credit]`
              : '';
            const propText =
              typeof data.proposal === 'object' && data.proposal?.summary
                ? data.proposal.summary
                : typeof data.proposal === 'string'
                ? data.proposal
                : '';
            out.textContent = (data.reply || propText || data.auditSummary || 'Đã thực thi xong.') + usageTxt;
          }
        } catch (err) {
          window.toast?.(err?.message || String(err));
        }
      };

      const cmdBtn = $('lumi18RunCmdBtn');
      if (cmdBtn) cmdBtn.onclick = () => runMode('command');

      const auditBtn = $('lumi18RunAuditBtn');
      if (auditBtn) {
        auditBtn.onclick = () => {
          const out = $('lumi18AiOutput');
          if (out) out.textContent = buildClientProposalText();
        };
      }

      const propBtn = $('lumi18RunProposalBtn');
      if (propBtn) {
        propBtn.onclick = () => {
          const txt = buildClientProposalText();
          const out = $('lumi18AiOutput');
          if (out) out.textContent = txt;
          navigator.clipboard?.writeText(txt).catch(() => {});
          window.toast?.('Đã tạo & sao chép bản Thuyết minh Kỹ thuật Sân khấu 3D vào Clipboard.');
        };
      }

      const seatingBtn = $('lumi18SeatingBtn');
      if (seatingBtn) {
        seatingBtn.onclick = () => {
          const promptTxt = ($('lumi18AiPrompt')?.value || '').toLowerCase();
          const guestMatch = promptTxt.match(/(\d+)\s*(?:khách|khach|pax|ghế|ghe|bàn|ban)/i);
          const guestCount = guestMatch ? parseInt(guestMatch[1], 10) : 200;
          const type = /ibm|hội nghị|hoi nghi|đại biểu/.test(promptTxt)
            ? 'conference_ibm_table'
            : /ghế|ghe|rạp|theater/.test(promptTxt)
            ? 'banquet_chair'
            : 'gala_round_table';
          const res = layoutAudienceSeating({ type, guestCount });
          const out = $('lumi18AiOutput');
          if (out) {
            out.textContent =
              `🪑 ĐÃ BỐ TRÍ KHÁN ĐÀI 3D TỰ ĐỘNG:\n` +
              `- Loại hình: ${res.label} · Quy mô: ${res.guestCount} khách (${res.unitsNeeded} cụm bàn/ghế · ${res.rows} hàng × ${res.colsPerRow} cụm/hàng).\n` +
              `- Tọa độ dãy ghế: Hàng đầu Z = ${res.firstRowZ}m → Hàng cuối Z = ${res.lastRowZ}m.\n\n` +
              res.sightline.summaryVi;
          }
        };
      }

      const musicBtn = $('lumi18MusicCuesBtn');
      if (musicBtn) {
        musicBtn.onclick = () => {
          const promptTxt = ($('lumi18AiPrompt')?.value || '').toLowerCase();
          const bpmMatch = promptTxt.match(/(\d{2,3})\s*bpm/i);
          const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 128;
          const mood = /cưới|wedding/.test(promptTxt)
            ? 'wedding'
            : /hội nghị|conference/.test(promptTxt)
            ? 'conference'
            : /gala|award/.test(promptTxt)
            ? 'gala'
            : 'edm';
          const res = generateMusicShowCues({ bpm, mood });
          const out = $('lumi18AiOutput');
          if (out) out.textContent = res.summaryVi;
        };
      }

      const brandBtn = $('lumi18BrandSyncBtn');
      if (brandBtn) {
        brandBtn.onclick = () => {
          const promptTxt = ($('lumi18AiPrompt')?.value || '').trim();
          const hexes = promptTxt.match(/#[0-9a-f]{6}/gi) || [];
          const res = applyBrandIdentity({
            brandName: lumiState.quoteConfig.clientName || 'GROUPLIFE EVENT',
            primaryColor: hexes[0] || '#38bdf8',
            accentColor: hexes[1] || '#f59e0b'
          });
          const out = $('lumi18AiOutput');
          if (out) out.textContent = res.summaryVi;
        };
      }

      const optBtn = $('lumi18OptimizeBudgetBtn');
      if (optBtn) {
        optBtn.onclick = () => {
          executeStageCommands([{ action: 'optimize_budget', pitchMm: 3.91, maxLights: 16 }], { recordUndo: true });
          const out = $('lumi18AiOutput');
          if (out) out.textContent = 'Đã tối ưu cấu hình Pixel Pitch (P3.91/P4.81 cho màn phụ) và cân đối số lượng đèn để giảm chi phí thuê.\n\n' + buildClientProposalText();
        };
      }
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

      const rowsHtml = bom.bomRows
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
        `<div><small>Tổng diện tích LED</small><br><strong>${s.totalLedAreaM2} m² (${s.totalCabinets500} cab)</strong></div>` +
        `<div><small>Xử lý điểm ảnh</small><br><strong>${(s.totalPixels / 1e6).toFixed(2)}M px (${s.rj45PortsNeeded} cổng)</strong></div>` +
        `<div><small>Tải điện 3 pha 380V</small><br><strong>${s.totalMaxKw} kW (~${s.currentPerPhaseAmps}A/pha)</strong></div>` +
        `<div><small>Tổng tải treo Truss</small><br><strong>~${s.totalRiggingWeightKg} kg</strong></div>` +
        `</div>` +
        `<div class="info-box" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px">` +
        `<label style="font-size:12px">Tên Khách hàng / Đơn vị<input id="lumi18QuoteClient" class="search" value="${esc18(q.clientName)}"></label>` +
        `<label style="font-size:12px">Số ngày thuê<input id="lumi18QuoteDays" type="number" min="1" max="60" class="search" value="${days}"></label>` +
        `<label style="font-size:12px">Vận chuyển & Lắp đặt (đ)<input id="lumi18QuoteTransport" type="number" step="500000" class="search" value="${Number(q.transportFeeVnd || 0) + Number(q.setupFeeVnd || 0)}"></label>` +
        `<label style="font-size:12px">Chế độ Thuế<select id="lumi18QuoteVat" class="search">` +
        `<option value="KCT" ${q.vatMode === 'KCT' ? 'selected' : ''}>KCT (Phần mềm GROUPLIFE)</option>` +
        `<option value="8" ${q.vatMode === '8' ? 'selected' : ''}>VAT 8%</option>` +
        `<option value="10" ${q.vatMode === '10' ? 'selected' : ''}>VAT 10%</option>` +
        `</select></label>` +
        `</div>` +
        `<div style="max-height:240px;overflow:auto">` +
        `<table style="width:100%;border-collapse:collapse;font-size:12px">` +
        `<thead><tr style="border-bottom:1px solid rgba(148,163,184,.3)"><th style="text-align:left">#</th><th style="text-align:left">Hạng mục thiết bị</th><th style="text-align:left">SL</th><th style="text-align:left">Đơn giá/ngày</th><th style="text-align:right">Thành tiền</th></tr></thead>` +
        `<tbody>${rowsHtml}</tbody>` +
        `</table></div>` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">` +
        `<div><strong>Tổng tạm tính (${days} ngày): <span style="color:#38bdf8">${afterDiscount.toLocaleString('vi-VN')} VNĐ</span></strong><br><small>Đơn vị phát hành: ${esc18(LUMI_BRAND.legalEntity)}</small></div>` +
        `<div style="display:flex;gap:6px;flex-wrap:wrap">` +
        `<button type="button" class="btn small primary" id="lumi18PrintQuoteBtn">🖨 In / PDF Báo giá</button>` +
        `<button type="button" class="btn small" id="lumi18ExportCsvBtn">📊 Xuất Excel (CSV)</button>` +
        `<button type="button" class="btn small" id="lumi18PrintTechBtn">📐 Hồ sơ Kỹ thuật PDF</button>` +
        `<button type="button" class="btn small" id="lumi18ExportDxfBtn">📏 Xuất AutoCAD .DXF</button>` +
        `<button type="button" class="btn small" id="lumi18ImportDxfBtn">📂 Nhập Mặt bằng .DXF</button>` +
        `</div></div>` +
        `</div>`;

      window.dialog('Bóc tách Khối lượng (BOM), Báo giá & Bản vẽ Kỹ thuật CAD (.DXF)', html, [{ label: 'Đóng' }]);

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

    function openBillingModal() {
      if (typeof window.dialog !== 'function') return;
      refreshBillingStatus();
      const html =
        `<div style="display:grid;gap:10px">` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center">` +
        `<div><strong>💎 Tài khoản ${esc18(LUMI_BRAND.name)}</strong> (${esc18(LUMI_BRAND.legalEntity)})<br>` +
        `<small>Quy đổi chuẩn: <strong>1 Credit = 100 VNĐ</strong> · Dùng chung ví Credit với Alpha Studio</small></div>` +
        `<span class="local-badge" style="font-size:13px">${lumiState.isProActive ? 'PRO ACTIVE' : lumiState.projectUnlocked ? 'PROJECT UNLOCKED' : 'FREE TIER'}</span>` +
        `</div>` +
        `<div class="info-box" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">` +
        `<div><small>Số dư Ví Credit</small><br><strong style="font-size:16px;color:#38bdf8">${lumiState.balanceCredits.toLocaleString('vi-VN')} Cr</strong></div>` +
        `<div><small>Hạn mức AI tặng kèm</small><br><strong style="font-size:16px;color:#a855f7">${lumiState.freeAiCreditsRemaining.toLocaleString('vi-VN')} Cr</strong></div>` +
        `<div><small>Lượt xuất lẻ không Watermark</small><br><strong style="font-size:16px">${lumiState.singleExportPasses} lượt</strong></div>` +
        `</div>` +
        `<div class="info-box" style="display:grid;gap:8px">` +
        `<strong>1. Xoá Watermark & Mở khoá Dự án lẻ bằng Credit</strong>` +
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
        `<span>🔓 <strong>Xuất lẻ 1 bản (4K PNG / PDF / DXF) không Watermark</strong></span>` +
        `<button type="button" class="btn small primary" data-lumi18-buy="lumi_single_export">50 Credits (5.000đ)</button>` +
        `</div>` +
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
        `<span>🏛 <strong>Mở khoá vĩnh viễn Dự án hiện tại</strong> (4K/PDF/DXF/Báo giá + Mật khẩu Link 3D)</span>` +
        `<button type="button" class="btn small primary" data-lumi18-buy="lumi_unlock_project">200 Credits (20.000đ)</button>` +
        `</div></div>` +
        `<div class="info-box" style="display:grid;gap:8px">` +
        `<strong>2. Nâng cấp Gói Thuê bao LumiStage Pro (Không giới hạn dự án + Tặng ngân sách AI)</strong>` +
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
        `<span>⭐ <strong>LumiStage Pro Tháng (30 ngày)</strong> · Tặng +300 Cr AI</span>` +
        `<button type="button" class="btn small primary" data-lumi18-buy="lumi_pro_monthly">1.490 Credits (149.000đ)</button>` +
        `</div>` +
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
        `<span>🔥 <strong>LumiStage Pro Quý (90 ngày)</strong> · Tặng +1.000 Cr AI (Tiết kiệm 11%)</span>` +
        `<button type="button" class="btn small primary" data-lumi18-buy="lumi_pro_quarterly">3.990 Credits (399.000đ)</button>` +
        `</div>` +
        `<div style="display:flex;justify-content:space-between;align-items:center">` +
        `<span>👑 <strong>LumiStage Pro Năm (365 ngày)</strong> · Tặng +4.500 Cr AI (Tiết kiệm 22%)</span>` +
        `<button type="button" class="btn small primary" data-lumi18-buy="lumi_pro_yearly">13.900 Credits (1.390.000đ)</button>` +
        `</div></div>` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center">` +
        `<span>🔗 <strong>Cài đặt nâng cao Link duyệt 3D</strong> (Thời hạn 24h–30 ngày & Mật khẩu bảo vệ)</span>` +
        `<button type="button" class="btn small" id="lumi18ShareCfgBtn">Cấu hình Link 3D</button>` +
        `</div>` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center">` +
        `<label class="check-row" style="margin:0"><input type="checkbox" id="lumi18TelemetryCheckbox" ${lumiState.telemetryOptIn ? 'checked' : ''}> 📊 <strong>Chia sẻ thống kê tính năng ẩn danh (Opt-in Telemetry)</strong> — Tuân thủ Nghị định 13/2023/NĐ-CP, không gửi file hay hình học sân khấu.</label>` +
        `</div>` +
        `</div>`;

      window.dialog('Quản lý Credit, Xoá Watermark & Gói LumiStage Pro', html, [{ label: 'Đóng' }]);
      document.querySelectorAll?.('[data-lumi18-buy]')?.forEach((btn) => {
        btn.onclick = async () => {
          const key = btn.getAttribute('data-lumi18-buy');
          await purchaseLumiProduct(key);
          openBillingModal();
        };
      });
      const shareCfgBtn = $('lumi18ShareCfgBtn');
      const telCheckbox = $('lumi18TelemetryCheckbox');
      if (telCheckbox) {
        telCheckbox.onchange = () => {
          setTelemetryOptIn(telCheckbox.checked);
          window.toast?.(
            telCheckbox.checked
              ? 'Đã bật chia sẻ thống kê tính năng ẩn danh (Opt-in).'
              : 'Đã tắt chia sẻ thống kê tính năng.'
          );
        };
      }
      if (shareCfgBtn) {
        shareCfgBtn.onclick = () => S.cloud16?.openShareLinkDialog?.();
      }
    }

    function updateTopbarBadge18() {
      const btn = $('lumi18BillingBtn');
      if (btn) {
        btn.textContent = lumiState.isProActive
          ? `💎 PRO · ${lumiState.balanceCredits} Cr`
          : `💎 Credit & Pro`;
      }
    }

    function injectLumiStageUI() {
      if (S.cloud16?.isClientReviewMode?.()) return;
      document.title = 'LumiStage V1.8 — Thiết kế Sân khấu 3D, Mapping LED, AI & Báo giá (by Alpha Studio)';
      const brandTitle = document.querySelector?.('.topbar .brand strong');
      if (brandTitle) brandTitle.innerHTML = 'LUMI<span>STAGE</span>';
      const brandSub = document.querySelector?.('.topbar .brand small');
      if (brandSub) brandSub.textContent = 'BY ALPHA STUDIO · GROUPLIFE · 3D LED & DMX';

      const wfRight = document.querySelector?.('.workflow .workflow-right');
      if (wfRight && !$('lumi18AiBtn')) {
        const tplBtn = document.createElement('button');
        tplBtn.id = 'lumi18TemplatesBtn';
        tplBtn.type = 'button';
        tplBtn.className = 'btn small';
        tplBtn.textContent = '🏛 6 Mẫu VN';
        tplBtn.title = '6 Mẫu sân khấu sự kiện Việt Nam (Hội nghị, Tiệc cưới, EDM, Khai trương, Gala, Lễ hội)';
        tplBtn.onclick = () => openStageTemplatesModal();

        const aiBtn = document.createElement('button');
        aiBtn.id = 'lumi18AiBtn';
        aiBtn.type = 'button';
        aiBtn.className = 'btn small primary';
        aiBtn.textContent = '✨ AI Sân khấu';
        aiBtn.title = 'Trợ lý AI tạo sân khấu 3D (Gemini Flash 3.8 · 1/3 giá chính thức + BYOK)';
        aiBtn.onclick = () => openStageAiModal();

        const bomBtn = document.createElement('button');
        bomBtn.id = 'lumi18BomBtn';
        bomBtn.type = 'button';
        bomBtn.className = 'btn small';
        bomBtn.textContent = '📋 BOM & Báo giá';
        bomBtn.title = 'Bóc tách khối lượng tự động (BOM), Báo giá PDF/CSV & Bản vẽ AutoCAD .DXF';
        bomBtn.onclick = () => openBomAndQuoteModal();

        const billBtn = document.createElement('button');
        billBtn.id = 'lumi18BillingBtn';
        billBtn.type = 'button';
        billBtn.className = 'btn small';
        billBtn.textContent = '💎 Credit & Pro';
        billBtn.title = 'Quản lý Credit, Xoá Watermark & Gói LumiStage Pro';
        billBtn.onclick = () => openBillingModal();

        wfRight.prepend(billBtn);
        wfRight.prepend(bomBtn);
        wfRight.prepend(tplBtn);
        wfRight.prepend(aiBtn);
      }

      const exportMenu = $('exportMenu');
      if (exportMenu && !$('exportShot4K')) {
        const btn4K = document.createElement('button');
        btn4K.id = 'exportShot4K';
        btn4K.innerHTML = 'Phối cảnh 3D 4K UHD <span>PNG / 3840 x 2160</span>';
        btn4K.onclick = () => S.exportShot4K?.();

        const btnDxf = document.createElement('button');
        btnDxf.id = 'exportCadDxf18';
        btnDxf.innerHTML = 'Bản vẽ 2D AutoCAD <span>DXF / Mặt bằng & Mặt đứng</span>';
        btnDxf.onclick = () => exportStageDxf();

        const btnQuote = document.createElement('button');
        btnQuote.id = 'exportQuotePdf18';
        btnQuote.innerHTML = 'Báo giá & BOM (GROUPLIFE) <span>PDF / CSV Thương mại</span>';
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
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => injectLumiStageUI());
    } else {
      injectLumiStageUI();
    }

    S.lumi18 = {
      state: lumiState,
      brand: LUMI_BRAND,
      templates: VN_STAGE_TEMPLATES,
      applyStageTemplate,
      executeStageCommands,
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
      openStageTemplatesModal,
      openStageAiModal,
      openBomAndQuoteModal,
      openBillingModal
    };
  } catch (err) {
    console.error('LumiStage V18 init error:', err);
  }
})();
