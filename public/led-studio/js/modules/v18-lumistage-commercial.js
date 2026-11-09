/* ============================================================================
   V18.0 LUMISTAGE COMMERCIAL SUITE — AI STAGE ASSISTANT, 6 VN TEMPLATES,
   AUTO BOM, QUOTATION (GROUPLIFE), CAD DXF IMPORT/EXPORT & CREDIT BILLING
   ============================================================================ */
(function () {
  'use strict';
  try {
    const S = (window.STUDIO = window.STUDIO || {});
    if (!window.M && typeof M !== 'undefined') window.M = M;
    if (!window.state && typeof state !== 'undefined') window.state = state;
    if (!window.seq && typeof seq !== 'undefined') window.seq = seq;
    if (!window.engine && typeof engine !== 'undefined') window.engine = engine;
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
      aiEnabled: false,
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
      },
      dmxProgrammer18: {
        freezeDmx: false,
        parChaseMode: 'carousel', // 'carousel' | 'mirror_domino' | 'dual_carousel' | 'gala_sparkle'
        parUseAlternateColor: false,
        parSecondaryColor: '#ffe600',
        frontColorTempK: 4200, // 3200 (Warm Tungsten) | 4200 (Neutral Studio) | 5600 (Daylight Broadcast)
        frontKeyLightPct: 88,  // 15..100%
        groupPalettes: {
          beam: ['#00f0ff', '#ff007f', '#ffe600', '#0055ff'],
          wash: ['#ff007f', '#00f0ff', '#7700ff', '#ffaa00'],
          par: ['#01ffa0', '#00d4ff', '#ff007f', '#ffe600'],
          laser: ['#00ff66', '#01ffa0', '#00f0ff', '#ff00aa']
        },
        optics: {
          aperture: 0.035,
          zoomDeg: 14,
          spreadFactor: 1.0
        },
        groups: {
          G1: { id: 'G1', label: 'G1 · Front Truss', panOffsetDeg: 0, tiltOffsetDeg: 0, fanningSpreadDeg: 0, dimmer: 100 },
          G2: { id: 'G2', label: 'G2 · Mid Truss', panOffsetDeg: 0, tiltOffsetDeg: 0, fanningSpreadDeg: 0, dimmer: 100 },
          G3: { id: 'G3', label: 'G3 · Back Truss', panOffsetDeg: 0, tiltOffsetDeg: 0, fanningSpreadDeg: 0, dimmer: 100 },
          G4: { id: 'G4', label: 'G4 · Floor / Deck', panOffsetDeg: 0, tiltOffsetDeg: 0, fanningSpreadDeg: 0, dimmer: 100 },
          G5: { id: 'G5', label: 'G5 · Side Towers', panOffsetDeg: 0, tiltOffsetDeg: 0, fanningSpreadDeg: 0, dimmer: 100 }
        }
      },
      structureConfig18: {
        venueEnabled: false,
        venueType: 'indoor_hall', // 'indoor_hall' | 'outdoor_roof' | 'coliseum_arena'
        venueXRay: false,
        wallFinish: 'drape_black', // 'drape_black' | 'concrete' | 'brick_acoustic'
        hideIndoorWalls: false,
        hideFabrics: false,
        daylightMode: 'night', // 'night' | 'day'
        paWingWidthM: 2.5,
        paWingHeightM: 6.0,
        seatingLayout: 'none', // 'none' | 'gala_banquet' | 'corporate_chairs'
        corridorType: 'central_side', // 'central' | 'side' | 'central_side'
        deckWidthM: 14,
        deckDepthM: 8,
        deckHeightM: 1.2,
        deckMaterial: 'mirror', // 'mirror' | 'black_wood'
        moduleSize: '2x1m',
        stairLayout: 'front_dual', // 'front_center' | 'front_dual' | 'side_lr' | 'rear_tech' | 'catwalk_tip' | 'all_around'
        catwalkType: 'none', // 'none' | 'straight' | 'circular_cnc' | 'octagonal_45'
        catwalkLengthM: 6.0,
        bStageWidthM: 4.0,
        layherBayStandard: '2.07m', // '2.07m' | '2.57m' | '2.00m'
        liveSymmetry3D: false,
        crowdBounce: true,
        crowdCount: 36,
        _crowdInertiaEnergy18: 0
      },
      audioWorkstation18: {
        brandPreset: 'lacoustics_k2',
        boxesPerSide: 12,
        bumperHeightM: 8.5,
        topTiltDeg: -2.0,
        jCurveFactor: 1.25,
        splayAnglesDeg: [0.5, 0.5, 1.0, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.5],
        subTopology: 'cardioid_csa', // 'stacks_lr' | 'cardioid_csa' | 'center_sub_arc'
        subCount: 12,
        crossoverHz: 80,
        subDelayMs: 3.2,
        subPolarityInverted: true,
        venueDepthM: 45,
        venueWidthM: 28,
        rt60Sec: 1.35,
        ambientNoiseDb: 45,
        targetSplFohDba: 102,
        heatmapVisible: true,
        waveFlowVisible: false,
        abSlotA: null,
        abSlotB: null,
        bandPlot: {
          drums: true,
          percussion: true,
          grandPiano: true,
          keys: true,
          horns: true,
          vocalMics: 4,
          monitorWedges: 8,
          iemChannels: 10,
          micGainDb: 0
        }
      },
      venuePower18: {
        selectedOutlet: '63A_3P', // '16A_1P' | '16A_3P' | '32A_3P' | '63A_3P' | '125A_3P'
        voltageV: 230,
        powerFactor: 0.92,
        headroomPct: 20
      },
      warehouse18: {
        stock: {
          roe_bp2v2_500: { name: 'ROE Black Pearl BP2V2 (500x500)', category: 'LED Cabinet', owned: 120, rma: 6, unitSubRentUsd: 18, perCase: 8, caseVolM3: 0.48, caseWeightKg: 82 },
          absen_pl39_1000: { name: 'Absen Polaris PL3.9 Pro (500x1000)', category: 'LED Cabinet', owned: 64, rma: 4, unitSubRentUsd: 24, perCase: 6, caseVolM3: 0.62, caseWeightKg: 94 },
          unilumin_ugm2_1000: { name: 'Unilumin UpadIV UGMII (500x1000)', category: 'LED Cabinet', owned: 48, rma: 2, unitSubRentUsd: 22, perCase: 6, caseVolM3: 0.60, caseWeightKg: 90 },
          brompton_sx40: { name: 'Brompton Tessera SX40 4K Processor', category: 'LED Processor', owned: 4, rma: 0, unitSubRentUsd: 250, perCase: 1, caseVolM3: 0.18, caseWeightKg: 24 },
          novastar_vx1000: { name: 'NovaStar VX1000 All-in-One Controller', category: 'LED Processor', owned: 6, rma: 1, unitSubRentUsd: 110, perCase: 2, caseVolM3: 0.16, caseWeightKg: 19 },
          fixture_beam_spot: { name: 'Moving Head Beam / Spot Hybrid 480W', category: 'DMX Lighting', owned: 24, rma: 2, unitSubRentUsd: 45, perCase: 2, caseVolM3: 0.52, caseWeightKg: 68 },
          fixture_wash_par: { name: 'Moving Wash & PAR LED RGBW', category: 'DMX Lighting', owned: 32, rma: 2, unitSubRentUsd: 28, perCase: 4, caseVolM3: 0.44, caseWeightKg: 54 },
          fixture_barra_blinder: { name: 'Pixel Barra 12-Cell & Audience Blinder', category: 'DMX Lighting', owned: 20, rma: 1, unitSubRentUsd: 30, perCase: 4, caseVolM3: 0.38, caseWeightKg: 46 },
          audio_line_array_box: { name: 'Line Array Element Dual 12" K2-Class', category: 'Pro Audio', owned: 24, rma: 0, unitSubRentUsd: 85, perCase: 4, caseVolM3: 0.92, caseWeightKg: 165 },
          audio_sub_218: { name: 'Dual 18" Cardioid Subwoofer KS28-Class', category: 'Pro Audio', owned: 12, rma: 1, unitSubRentUsd: 70, perCase: 2, caseVolM3: 0.88, caseWeightKg: 172 },
          sfx_pyro_unit: { name: 'Sparkular / CO2 Cryo / Flame DMX Unit', category: 'Pyro & SFX', owned: 16, rma: 2, unitSubRentUsd: 55, perCase: 4, caseVolM3: 0.36, caseWeightKg: 48 },
          deck_module_2x1: { name: 'Stage Deck Module 2x1m EN 13814', category: 'Stage Structure', owned: 60, rma: 2, unitSubRentUsd: 15, perCase: 10, caseVolM3: 1.15, caseWeightKg: 340 }
        }
      },
      screenCapture18: {
        active: false,
        sourceType: 'screen', // 'screen' | 'webcam'
        fitMode: 'cover', // 'cover' | 'contain'
        deviceId: '',
        stream: null,
        videoEl: null,
        startedAtMs: 0,
        frameCount: 0
      }
    };

    if (typeof window.snapshot === 'function' && typeof window.restore === 'function') {
      const priorSnapshot = window.snapshot, priorRestore = window.restore;
      window.snapshot = function () {
        const data = priorSnapshot();
        const stRef = S.state || window.state;
        data.lumi18 = structuredClone({ musicShowCues: lumiState.musicShowCues, activeCueIndex: lumiState.activeCueIndex, brandIdentity: lumiState.brandIdentity, clientName: lumiState.quoteConfig.clientName, seqCues: window.seq?.cues, activeStageSet18: stRef?.activeStageSet18, modelMeta18: stRef?.model ? { name: stRef.model.name, demo: !!stRef.model.demo, blank: !!stRef.model.blank } : undefined, structureConfig18: lumiState.structureConfig18, audioWorkstation18: lumiState.audioWorkstation18 });
        return data;
      };
      window.restore = function (data) {
        if (data.lumi18) {
          const saved = structuredClone(data.lumi18);
          Object.assign(lumiState, { musicShowCues: saved.musicShowCues, activeCueIndex: saved.activeCueIndex, brandIdentity: saved.brandIdentity });
          lumiState.quoteConfig.clientName = saved.clientName;
          if (window.seq && Array.isArray(saved.seqCues)) window.seq.cues = saved.seqCues;
          const stRef = S.state || window.state;
          if (stRef) {
            stRef.activeStageSet18 = saved.activeStageSet18;
            if (saved.modelMeta18 && stRef.model && !stRef.model.files?.length) Object.assign(stRef.model, saved.modelMeta18);
          }
          if (saved.structureConfig18) Object.assign(lumiState.structureConfig18, sanitizeStructureConfig18(saved.structureConfig18));
          if (saved.audioWorkstation18) Object.assign(lumiState.audioWorkstation18, saved.audioWorkstation18);
        }
        const res = priorRestore(data);
        if (data.lumi18?.structureConfig18) applyStructureConfig18(lumiState.structureConfig18, { fromRestore: true });
        return res;
      };
    }

    if (typeof window.packLiveExtras === 'function' && typeof window.restoreLiveExtras === 'function') {
      const priorPackExtras18 = window.packLiveExtras;
      const priorRestoreExtras18 = window.restoreLiveExtras;
      window.packLiveExtras = async function (...args) {
        const extras = (await priorPackExtras18.apply(this, args)) || {};
        extras.lumi18 = structuredClone({
          structureConfig18: lumiState.structureConfig18,
          audioWorkstation18: lumiState.audioWorkstation18,
          brandIdentity: lumiState.brandIdentity
        });
        return extras;
      };
      window.restoreLiveExtras = async function (project, ...rest) {
        const out = await priorRestoreExtras18.call(this, project, ...rest);
        const saved18 = project?.liveExtras?.lumi18 || project?.lumi18;
        if (saved18?.structureConfig18) {
          Object.assign(lumiState.structureConfig18, sanitizeStructureConfig18(saved18.structureConfig18));
          applyStructureConfig18(lumiState.structureConfig18, { fromRestore: true });
        }
        if (saved18?.audioWorkstation18) {
          Object.assign(lumiState.audioWorkstation18, saved18.audioWorkstation18);
        }
        return out;
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
        previewWebp: './assets/templates/conference.webp',
        summary: 'Sân khấu 12×6m, 1 LED chính P3.91 (7×3.5m) + 2 LED cánh (2.5×3.5m), bục phát biểu VIP, bàn đại biểu IBM, MC dẫn chương trình & 16 đèn Par/Beam.',
        widthM: 12,
        depthM: 6,
        heightM: 0.8,
        pitchMm: 3.91,
        style: 'cool',
        screens: [
          { name: 'LED_MAIN_CENTER', pos: [0, 2.65, -2.2], wM: 7.0, hM: 3.5, yawDeg: 0, pitchMm: 3.91, cabinetModelId: 'absen_pl25_500', processorModelId: 'novastar_vx1000', rows500x1000: 3, rows500x500: 1 },
          { name: 'LED_WING_LEFT', pos: [-5.1, 2.65, -1.7], wM: 2.5, hM: 3.5, yawDeg: 12, pitchMm: 3.91, cabinetModelId: 'absen_pl25_500', processorModelId: 'novastar_vx600', rows500x1000: 3, rows500x500: 1 },
          { name: 'LED_WING_RIGHT', pos: [5.1, 2.65, -1.7], wM: 2.5, hM: 3.5, yawDeg: -12, pitchMm: 3.91, cabinetModelId: 'absen_pl25_500', processorModelId: 'novastar_vx600', rows500x1000: 3, rows500x500: 1 }
        ],
        truss: 'portal',
        lightCount: 16,
        props: [
          { kind: 'vip_podium', pos: [-2.4, 0.8, 0.8], yaw: 10 },
          { kind: 'conference_ibm_table', pos: [-2.5, 0, 3.8], yaw: 0 },
          { kind: 'conference_ibm_table', pos: [2.5, 0, 3.8], yaw: 0 },
          { kind: 'stage_monitor_wedge', pos: [-1.5, 0.8, 1.8], yaw: 0 },
          { kind: 'stage_monitor_wedge', pos: [1.5, 0.8, 1.8], yaw: 0 },
          { kind: 'decor_palm_planter', pos: [-5.6, 0.8, 1.5], yaw: 0 },
          { kind: 'decor_palm_planter', pos: [5.6, 0.8, 1.5], yaw: 0 }
        ],
        cast: [
          { type: 'mc', pos: [-2.1, 0.8, 0.65], color: '#38bdf8', model18: 'stage-host' },
          { type: 'mc', pos: [0.4, 0.8, 0.9], color: '#60a5fa', model18: 'stage-host-female' },
          { type: 'audience', pos: [-2.5, 0, 5.4], yaw: 180, count: 24, columns: 6, spacing: 0.7, phase: 0, color: '#33677f' },
          { type: 'audience', pos: [2.5, 0, 5.4], yaw: 180, count: 24, columns: 6, spacing: 0.7, phase: 1.5, color: '#3b82f6' }
        ]
      },
      wedding: {
        id: 'wedding',
        name: 'Tiệc cưới Sang trọng',
        category: 'Wedding / Romance',
        previewWebp: './assets/templates/wedding.webp',
        summary: 'Sân khấu 14×7m kèm đường dẫn Catwalk, LED chính 8×4m + 4 cột LED Totem, cổng vòm hoa/backdrop, bàn tiệc tròn Gala, Violin/Saxophone & pháo điện lạnh.',
        widthM: 14,
        depthM: 7,
        heightM: 0.7,
        pitchMm: 2.97,
        style: 'warm',
        screens: [
          { name: 'LED_WEDDING_MAIN', pos: [0, 2.8, -2.5], wM: 8.0, hM: 4.0, yawDeg: 0, pitchMm: 2.97, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40' },
          { name: 'LED_TOTEM_L1', pos: [-4.8, 2.5, -2.0], wM: 1.0, hM: 3.5, yawDeg: 10, pitchMm: 2.97, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_s8', rows500x1000: 3, rows500x500: 1 },
          { name: 'LED_TOTEM_R1', pos: [4.8, 2.5, -2.0], wM: 1.0, hM: 3.5, yawDeg: -10, pitchMm: 2.97, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_s8', rows500x1000: 3, rows500x500: 1 },
          { name: 'LED_TOTEM_L2', pos: [-6.2, 2.3, -1.4], wM: 1.0, hM: 3.0, yawDeg: 16, pitchMm: 3.91, cabinetModelId: 'unilumin_ugm2_1000', processorModelId: 'novastar_vx600' },
          { name: 'LED_TOTEM_R2', pos: [6.2, 2.3, -1.4], wM: 1.0, hM: 3.0, yawDeg: -16, pitchMm: 3.91, cabinetModelId: 'unilumin_ugm2_1000', processorModelId: 'novastar_vx600' }
        ],
        truss: 'arch',
        lightCount: 20,
        props: [
          { kind: 'backdrop_arch', pos: [0, 0.7, -1.2], yaw: 0 },
          { kind: 'catwalk_t', pos: [0, 0, 4.2], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [-2.2, 0.7, 1.8], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [2.2, 0.7, 1.8], yaw: 0 },
          { kind: 'gala_round_table', pos: [-3.6, 0, 4.5], yaw: 0 },
          { kind: 'gala_round_table', pos: [3.6, 0, 4.5], yaw: 0 }
        ],
        cast: [
          { type: 'singer', pos: [-0.5, 0.7, 0.8], color: '#f472b6', model18: 'stage-singer' },
          { type: 'mc', pos: [0.5, 0.7, 0.8], color: '#fbbf24', model18: 'stage-host' },
          { type: 'violinist', pos: [-2.4, 0.7, 0.5], color: '#f9a8d4', model18: 'stage-violinist' },
          { type: 'saxophonist', pos: [2.4, 0.7, 0.5], color: '#fcd34d', model18: 'stage-saxophonist' }
        ]
      },
      concert: {
        id: 'concert',
        name: 'Đại nhạc hội EDM',
        category: 'Concert / EDM',
        previewWebp: './assets/templates/concert.webp',
        summary: 'Sân khấu đại cảnh 24×12m, LED chính 14×6m + 4 cánh LED nghiêng + Mặt DJ LED, bàn DJ trung tâm, Line Array, 4 súng CO2 & 32 đèn Moving Head Beam.',
        widthM: 24,
        depthM: 12,
        heightM: 1.2,
        pitchMm: 3.91,
        style: 'concert',
        screens: [
          { name: 'LED_EDM_MAIN', pos: [0, 4.3, -3.8], wM: 14.0, hM: 6.0, yawDeg: 0, pitchMm: 3.91, cabinetModelId: 'roe_cb5_1000', processorModelId: 'brompton_sx40' },
          { name: 'LED_WING_L1', pos: [-8.6, 4.1, -3.0], wM: 2.5, hM: 5.5, yawDeg: 18, pitchMm: 3.91, cabinetModelId: 'gloshine_mv26_500', processorModelId: 'novastar_vx1000', rows500x1000: 5, rows500x500: 1 },
          { name: 'LED_WING_R1', pos: [8.6, 4.1, -3.0], wM: 2.5, hM: 5.5, yawDeg: -18, pitchMm: 3.91, cabinetModelId: 'gloshine_mv26_500', processorModelId: 'novastar_vx1000', rows500x1000: 5, rows500x500: 1 },
          { name: 'LED_WING_L2', pos: [-11.2, 3.8, -2.0], wM: 2.0, hM: 5.0, yawDeg: 28, pitchMm: 4.81, cabinetModelId: 'gloshine_ls39_1000', processorModelId: 'novastar_vx1000' },
          { name: 'LED_WING_R2', pos: [11.2, 3.8, -2.0], wM: 2.0, hM: 5.0, yawDeg: -28, pitchMm: 4.81, cabinetModelId: 'gloshine_ls39_1000', processorModelId: 'novastar_vx1000' },
          { name: 'LED_DJ_FRONT', pos: [0, 1.7, 0.6], wM: 3.0, hM: 1.0, yawDeg: 0, pitchMm: 2.97, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_s8' }
        ],
        truss: 'box',
        lightCount: 32,
        props: [
          { kind: 'dj_booth', pos: [0, 1.2, 0.2], yaw: 0 },
          { kind: 'line_array', pos: [-10.5, 5.2, 0.5], yaw: 0 },
          { kind: 'line_array', pos: [10.5, 5.2, 0.5], yaw: 0 },
          { kind: 'sub_stack', pos: [-9.5, 0, 2.8], yaw: 8 },
          { kind: 'sub_stack', pos: [9.5, 0, 2.8], yaw: -8 },
          { kind: 'co2_cannon', pos: [-4.5, 1.2, 2.2], yaw: 0 },
          { kind: 'co2_cannon', pos: [-1.5, 1.2, 2.2], yaw: 0 },
          { kind: 'co2_cannon', pos: [1.5, 1.2, 2.2], yaw: 0 },
          { kind: 'co2_cannon', pos: [4.5, 1.2, 2.2], yaw: 0 },
          { kind: 'foh_control_booth', pos: [0, 0, 9.5], yaw: 0 }
        ],
        cast: [
          { type: 'dj', pos: [0, 1.2, -0.35], color: '#22d3ee', model18: 'stage-dj' },
          { type: 'leddancer', pos: [-3.2, 1.2, 1.2], color: '#38bdf8', model18: 'stage-led-dancer' },
          { type: 'leddancer', pos: [3.2, 1.2, 1.2], color: '#a855f7', model18: 'stage-led-dancer' },
          { type: 'rapper', pos: [0, 1.2, 1.8], color: '#f97316', model18: 'stage-rapper' },
          { type: 'audience', pos: [-4.5, 0, 6.8], yaw: 180, count: 48, columns: 10, spacing: 0.65, phase: 0, color: '#22d3ee' },
          { type: 'audience', pos: [4.5, 0, 6.8], yaw: 180, count: 48, columns: 10, spacing: 0.65, phase: 2.1, color: '#a855f7' }
        ]
      },
      grand_opening: {
        id: 'grand_opening',
        name: 'Lễ Khai trương / Khánh thành / Ra mắt SP',
        category: 'Activation / Launch',
        previewWebp: './assets/templates/grand_opening.webp',
        summary: 'Sân khấu 10×5m gọn đẹp, LED chính 6×3.5m + 2 Standee LED 1×2.5m, cổng LED Arch, bục VIP, Trống nước & Múa quạt nghệ thuật.',
        widthM: 10,
        depthM: 5,
        heightM: 0.6,
        pitchMm: 2.97,
        style: 'warm',
        screens: [
          { name: 'LED_LAUNCH_MAIN', pos: [0, 2.45, -1.8], wM: 6.0, hM: 3.5, yawDeg: 0, pitchMm: 2.97, cabinetModelId: 'unilumin_upad4_500', processorModelId: 'novastar_vx1000', rows500x1000: 3, rows500x500: 1 },
          { name: 'LED_STANDEE_L', pos: [-3.9, 1.95, -1.3], wM: 1.0, hM: 2.5, yawDeg: 10, pitchMm: 2.97, cabinetModelId: 'unilumin_upad4_500', processorModelId: 'novastar_vx600', rows500x1000: 2, rows500x500: 1 },
          { name: 'LED_STANDEE_R', pos: [3.9, 1.95, -1.3], wM: 1.0, hM: 2.5, yawDeg: -10, pitchMm: 2.97, cabinetModelId: 'unilumin_upad4_500', processorModelId: 'novastar_vx600', rows500x1000: 2, rows500x500: 1 }
        ],
        truss: 'portal',
        lightCount: 12,
        props: [
          { kind: 'led_arch', pos: [0, 0.6, -1.5], yaw: 0 },
          { kind: 'vip_podium', pos: [-1.8, 0.6, 0.6], yaw: 8 },
          { kind: 'cold_spark_fountain', pos: [-2.5, 0.6, 1.5], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [2.5, 0.6, 1.5], yaw: 0 },
          { kind: 'decor_palm_planter', pos: [-4.5, 0.6, 1.2], yaw: 0 },
          { kind: 'decor_palm_planter', pos: [4.5, 0.6, 1.2], yaw: 0 }
        ],
        cast: [
          { type: 'mc', pos: [-1.5, 0.6, 0.5], color: '#fbbf24', model18: 'stage-host' },
          { type: 'waterdrummer', pos: [-0.8, 0.6, 0.9], color: '#38bdf8', model18: 'stage-water-drummer' },
          { type: 'waterdrummer', pos: [0.8, 0.6, 0.9], color: '#38bdf8', model18: 'stage-water-drummer' },
          { type: 'fandancer', pos: [-2.4, 0.6, 1.1], color: '#fb7185', model18: 'stage-fan-dancer' },
          { type: 'fandancer', pos: [2.4, 0.6, 1.1], color: '#fb7185', model18: 'stage-fan-dancer' }
        ]
      },
      gala_dinner: {
        id: 'gala_dinner',
        name: 'Gala Dinner / Year End Party (YEP)',
        category: 'Gala / YEP',
        previewWebp: './assets/templates/gala_dinner.webp',
        summary: 'Sân khấu 16×8m, LED chính 9×4.5m + 2 cánh LED 2.5×4m, vòng LED Kinetic trần, 4 bàn tiệc Gala tròn, ban nhạc & 24 đèn Beam/Katana.',
        widthM: 16,
        depthM: 8,
        heightM: 0.9,
        pitchMm: 3.91,
        style: 'concert',
        screens: [
          { name: 'LED_GALA_MAIN', pos: [0, 3.25, -2.8], wM: 9.0, hM: 4.5, yawDeg: 0, pitchMm: 3.91, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40', rows500x1000: 4, rows500x500: 1 },
          { name: 'LED_GALA_WING_L', pos: [-6.1, 3.0, -2.1], wM: 2.5, hM: 4.0, yawDeg: 15, pitchMm: 3.91, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000' },
          { name: 'LED_GALA_WING_R', pos: [6.1, 3.0, -2.1], wM: 2.5, hM: 4.0, yawDeg: -15, pitchMm: 3.91, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000' }
        ],
        truss: 'box',
        lightCount: 24,
        props: [
          { kind: 'kinetic_ring', pos: [0, 5.2, 0], yaw: 0 },
          { kind: 'vip_podium', pos: [-3.2, 0.9, 1.0], yaw: 10 },
          { kind: 'gala_round_table', pos: [-4.2, 0, 4.6], yaw: 0 },
          { kind: 'gala_round_table', pos: [-1.4, 0, 5.0], yaw: 0 },
          { kind: 'gala_round_table', pos: [1.4, 0, 5.0], yaw: 0 },
          { kind: 'gala_round_table', pos: [4.2, 0, 4.6], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [-3.0, 0.9, 2.2], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [3.0, 0.9, 2.2], yaw: 0 }
        ],
        cast: [
          { type: 'singer', pos: [0, 0.9, 1.2], color: '#ff5d8f', model18: 'stage-singer' },
          { type: 'dancer', pos: [-2.0, 0.9, 1.0], color: '#f472b6', model18: 'stage-dancer' },
          { type: 'dancer', pos: [2.0, 0.9, 1.0], color: '#38bdf8', model18: 'stage-dancer-male' },
          { type: 'saxophonist', pos: [3.2, 0.9, 0.6], color: '#fbbf24', model18: 'stage-saxophonist' }
        ]
      },
      outdoor_festival: {
        id: 'outdoor_festival',
        name: 'Lễ hội Ngoài trời / Beerfest / Countdown',
        category: 'Outdoor / Festival',
        previewWebp: './assets/templates/outdoor_festival.webp',
        summary: 'Sân khấu 20×10m mái vòm Truss chống gió, LED chính 12×5m P4.81 Outdoor + Header Banner, rào chắn Mojo, tháp FOH, Full Band & Khán giả.',
        widthM: 20,
        depthM: 10,
        heightM: 1.1,
        pitchMm: 4.81,
        style: 'concert',
        screens: [
          { name: 'LED_OUTDOOR_MAIN', pos: [0, 3.7, -3.2], wM: 12.0, hM: 5.0, yawDeg: 0, pitchMm: 4.81, cabinetModelId: 'roe_cb5_1000', processorModelId: 'novastar_mx40pro' },
          { name: 'LED_OUTDOOR_WING_L', pos: [-7.8, 3.45, -2.4], wM: 2.5, hM: 4.5, yawDeg: 16, pitchMm: 4.81, cabinetModelId: 'gloshine_mv26_500', processorModelId: 'novastar_vx1000', rows500x1000: 4, rows500x500: 1 },
          { name: 'LED_OUTDOOR_WING_R', pos: [7.8, 3.45, -2.4], wM: 2.5, hM: 4.5, yawDeg: -16, pitchMm: 4.81, cabinetModelId: 'gloshine_mv26_500', processorModelId: 'novastar_vx1000', rows500x1000: 4, rows500x500: 1 },
          { name: 'LED_HEADER_BANNER', pos: [0, 6.6, -3.0], wM: 12.0, hM: 1.0, yawDeg: 0, pitchMm: 4.81, cabinetModelId: 'gloshine_ls39_1000', processorModelId: 'novastar_vx1000' }
        ],
        truss: 'box',
        lightCount: 28,
        props: [
          { kind: 'truss_arch', pos: [0, 1.1, -1.8], yaw: 0 },
          { kind: 'line_array', pos: [-8.8, 4.8, 0.4], yaw: 0 },
          { kind: 'line_array', pos: [8.8, 4.8, 0.4], yaw: 0 },
          { kind: 'sub_stack', pos: [-7.8, 0, 2.6], yaw: 8 },
          { kind: 'sub_stack', pos: [7.8, 0, 2.6], yaw: -8 },
          { kind: 'crowd_barrier', pos: [-3.5, 0, 4.5], yaw: 0 },
          { kind: 'crowd_barrier', pos: [0, 0, 4.5], yaw: 0 },
          { kind: 'crowd_barrier', pos: [3.5, 0, 4.5], yaw: 0 },
          { kind: 'foh_control_booth', pos: [0, 0, 8.5], yaw: 0 },
          { kind: 'haze_machine_pro', pos: [-6.0, 1.1, -1.5], yaw: 0 },
          { kind: 'haze_machine_pro', pos: [6.0, 1.1, -1.5], yaw: 0 }
        ],
        cast: [
          { type: 'singer', pos: [0, 1.1, 1.4], color: '#ff5d8f', model18: 'stage-singer' },
          { type: 'guitarist', pos: [-2.6, 1.1, 0.7], color: '#45d4ff', model18: 'stage-guitarist' },
          { type: 'keyboardist', pos: [2.6, 1.1, 0.7], color: '#ffc857', model18: 'stage-keyboardist' },
          { type: 'drummer', pos: [0, 1.1, -0.8], color: '#9b7bff', model18: 'stage-drummer' },
          { type: 'audience', pos: [-3.8, 0, 6.2], yaw: 180, count: 40, columns: 8, spacing: 0.65, phase: 0, color: '#33677f' },
          { type: 'audience', pos: [3.8, 0, 6.2], yaw: 180, count: 40, columns: 8, spacing: 0.65, phase: 1.9, color: '#803f65' }
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
      const spanM = Math.max(4, +(widthM * 0.96).toFixed(2));
      const endClearM = Math.max(0.42, +(spanM * 0.08).toFixed(3));
      const usableSpanM = Math.max(0.5, spanM - endClearM * 2);
      const dmxChannels = 16;
      let curUniverse = 1;
      let curAddr = 1;
      eng.lights = Array.from({ length: n }, (_, i) => {
        const u = n > 1 ? i / (n - 1) - 0.5 : 0;
        const row = i % 2;
        const zPos = row === 0 ? -depthM * 0.25 : depthM * 0.18;
        const rawX = +(u * usableSpanM).toFixed(3);
        const distFromLeft = rawX + spanM * 0.5;
        const spigotMod = distFromLeft % 2.0;
        const nudge = Math.min(spigotMod, 2.0 - spigotMod) < 0.06 ? (rawX < 0 ? -0.08 : 0.08) : 0;
        const posX = +(rawX + nudge).toFixed(3);
        if (curAddr + dmxChannels - 1 > 512) {
          curUniverse += 1;
          curAddr = 1;
        }
        const fixtureUni = curUniverse;
        const fixtureAddr = curAddr;
        curAddr += dmxChannels;
        const isBeam = row === 0;
        return {
          id: 'light_' + i,
          name: (isBeam ? 'Beam 230 #' : 'Par/Wash #') + String(i + 1).padStart(2, '0'),
          type: isBeam ? 'beam' : 'wash',
          model: isBeam ? 'Robe Pointe 280W' : 'Martin MAC Aura XB',
          oflModel: isBeam ? 'Robe Pointe 280W' : 'Martin MAC Aura XB',
          oflProfileId: isBeam ? 'vn-stage/beam-230-7r' : 'vn-stage/par-led-54x3w',
          weightKg: isBeam ? 18 : 11,
          powerW: isBeam ? 380 : 250,
          beamAngleDeg: isBeam ? 5 : 28,
          luminousFluxLm: isBeam ? 18500 : 22000,
          dmxUniverse: fixtureUni,
          dmxAddress: fixtureAddr,
          dmxChannels,
          trussId: isBeam ? 'TRUSS_BACK' : 'TRUSS_FRONT',
          pos: [posX, +(topY - 0.15).toFixed(2), +zPos.toFixed(2)],
          target: [+(u * widthM * (style === 'concert' ? -0.42 : 0.55)).toFixed(2), 0.3, +(depthM * 0.48).toFixed(2)],
          color: palette[i % palette.length],
          power: style === 'warm' ? 3.4 : 4.6,
          angle: isBeam ? 12 : 24,
          enabled: true,
          sweep: style === 'concert' || isBeam,
          speed: 0.35,
          phase: +(i * 0.35).toFixed(2),
          fx: 'steady',
          fxDepth: 0.55,
          fxSpeed: 2.2,
          boost: 1
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

      return singleUndo18(() => {
      window.checkpoint?.();
      if (S.stageLift?.items) S.stageLift.items.length = 0;
      const widthM = Math.max(4, Math.min(80, Number(overrides.widthM) || tpl.widthM));
      const depthM = Math.max(3, Math.min(50, Number(overrides.depthM) || tpl.depthM));
      const heightM = Math.max(0.2, Math.min(4, Number(overrides.heightM) || tpl.heightM));
      const defaultPitch = Math.max(1.2, Math.min(16, Number(overrides.pitchMm) || tpl.pitchMm || 3.91));
      const scaleX = widthM / tpl.widthM;
      const scaleZ = depthM / tpl.depthM;

      const screenMeshes = [];
      const createdScreens = [];
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
        const ledGrp = 'led_asm_' + scr.name;
        const grpVi = `Cụm Màn LED: ${scr.name}`;
        const grpEn = `LED Screen Assembly: ${scr.name}`;
        window.transformMesh(q, mat);
        q._smartGroupId = ledGrp;
        q.nodePath = ledGrp + '/panel';
        q._groupLabelVi = grpVi;
        q._groupLabelEn = grpEn;
        screenMeshes.push(q);

        const frame = window.boxMesh(scr.name + '_Frame', [0, 0, -0.09], [wM + 0.1, hM + 0.1, 0.16], [0.12, 0.13, 0.17, 1]);
        window.transformMesh(frame, mat);
        frame._smartGroupId = ledGrp;
        frame.nodePath = ledGrp + '/frame';
        frame._groupLabelVi = grpVi;
        frame._groupLabelEn = grpEn;
        screenMeshes.push(frame);

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
          yawDeg: scr.yawDeg || 0,
          cabinetModelId: scr.cabinetModelId || null,
          processorModelId: scr.processorModelId || null,
          rows500x1000: scr.rows500x1000,
          rows500x500: scr.rows500x500,
          shapeType: scr.shapeType || 'flat'
        });
      }

      let meshes = [];
      if (typeof window.buildStageShellMeshes === 'function') {
        meshes = window.buildStageShellMeshes({
          widthM,
          depthM,
          heightM,
          topY: Math.max(heightM + 4.5, maxTopY + 0.55),
          trussMode: tpl.truss || 'portal',
          includePA: true
        });
      } else {
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
        meshes.push(...buildTrussMeshes(widthM, depthM, heightM, maxTopY, tpl.truss));
      }
      meshes.push(...screenMeshes);
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
        if (s.cabinetModelId) surf.cabinetModelId = s.cabinetModelId;
        if (s.processorModelId) surf.processorModelId = s.processorModelId;
        if (s.rows500x1000 !== undefined) surf.rows500x1000 = s.rows500x1000;
        if (s.rows500x500 !== undefined) surf.rows500x500 = s.rows500x500;
        if (s.shapeType) surf.shapeType = s.shapeType;
        window.normalizeSurfaceHardware?.(surf);
        window.rebuildSurface3DMesh?.(surf);
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

      const scaledAssets = (tpl.props || []).map((p) => {
        const resolvedKind = resolveCatalogPropKind(p.kind, S.stageAssets16?.catalog);
        const py = p.pos[1] > 0.05 ? +(heightM + Math.max(0, p.pos[1] - tpl.heightM)).toFixed(2) : 0;
        return {
          kind: resolvedKind,
          pos: [+(p.pos[0] * scaleX).toFixed(2), py, +(p.pos[2] * scaleZ).toFixed(2)],
          yaw: p.yaw || 0
        };
      });
      const scaledCast = (tpl.cast || []).map((c) => {
        const cy = c.pos[1] > 0.05 ? +(heightM + Math.max(0, c.pos[1] - tpl.heightM)).toFixed(2) : 0;
        return {
          ...c,
          pos: [+(c.pos[0] * scaleX).toFixed(2), cy, +(c.pos[2] * scaleZ).toFixed(2)]
        };
      });
      populateSetAssetsAndCast18({ id: tpl.id, assets: scaledAssets, cast: scaledCast });

      eng.view = 'stage';
      eng.cameraPreset?.('iso');
      window.renderUI?.();
      S.project142?.scheduleAutoBackup?.();
      window.toast?.(tr18(`Đã dựng mẫu "${tpl.name}" (${widthM}×${depthM}m · P${defaultPitch}). Bấm Ctrl+Z nếu muốn hoàn tác.`, `Built "${templatePresentation18(tpl).name}" (${widthM}×${depthM}m · P${defaultPitch}). Press Ctrl+Z to undo.`));
      return true;
      });
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
            (surf.id && m._surfaceId18 === surf.id) ||
            (surf._lmpBatchId18 && m._lmpBatchId18 === surf._lmpBatchId18 && (!surf.name || m.name === surf.name)) ||
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
            if (cmd.heightM || cmd.height) {
              target.physicalHeightM = Math.max(0.5, Number(cmd.heightM || cmd.height));
              delete target.rows500x1000;
              delete target.rows500x500;
              delete target._mixedSpecHeightM;
            }
            const nextW = Number(target.physicalWidthM) || oldW;
            const nextH = Number(target.physicalHeightM) || oldH;
            if (Array.isArray(target.physical)) target.physical = [nextW, nextH];
            window.normalizeSurfaceHardware?.(target);
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

    function computeEngineeringRider(eng = (typeof getEngine === 'function' ? getEngine() : null), opts = {}) {
      const surfaces = Array.isArray(eng)
        ? eng
        : (Array.isArray(eng?.surfaces) ? eng.surfaces : []);
      const activeSurfaces = surfaces.filter(s => !s?._deleted8);
      const baseLights = (!Array.isArray(eng) && Array.isArray(eng?.lights)) ? eng.lights.filter(l => !l._deleted8 && l.enabled !== false) : [];
      const rawRigs = !Array.isArray(eng) ? (eng?.fixtureRigs16 ?? (typeof S !== 'undefined' ? S.stageAssets16?.fixtureRigs16 : null)) : null;
      const extraRigs = Array.isArray(rawRigs)
        ? rawRigs
        : (typeof rawRigs?.values === 'function' ? [...rawRigs.values()] : []);
      const lights = [...baseLights, ...extraRigs];

      const powerCircuits = [];
      let totalLedWeightKg = 0;
      let totalActiveCabs = 0;
      let totalVoidCabs = 0;
      let hangingBars = 0;
      let groundStackBallastKg = 0;
      const surfaceWirings = [];
      const warnings = [];

      const normFn = typeof normalizeSurfaceHardware === 'function'
        ? normalizeSurfaceHardware
        : (typeof window !== 'undefined' && typeof window.normalizeSurfaceHardware === 'function'
          ? window.normalizeSurfaceHardware
          : (typeof S !== 'undefined' ? S.spatial?.normalizeSurfaceHardware : null));
      const wireFn = typeof planSurfaceWiring === 'function'
        ? planSurfaceWiring
        : (typeof window !== 'undefined' && typeof window.planSurfaceWiring === 'function'
          ? window.planSurfaceWiring
          : (typeof S !== 'undefined' ? S.atlas?.planSurfaceWiring : null));
      const curveFn = typeof computeCurvedSpanMeters === 'function'
        ? computeCurvedSpanMeters
        : (typeof window !== 'undefined' && typeof window.computeCurvedSpanMeters === 'function'
          ? window.computeCurvedSpanMeters
          : (typeof S !== 'undefined' ? S.spatial?.computeCurvedSpanMeters : null));

      activeSurfaces.forEach((s) => {
        if (!s || typeof s !== 'object') return;
        if (!s.physical && (s.widthM || s.heightM)) {
          s.physical = [Number(s.widthM) || 4, Number(s.heightM) || 2.5];
        }
        if (normFn) normFn(s);
        const spec = s.cabinetSpec || {
          widthMm: Number(s.cabW) || 500,
          heightMm: Number(s.cabH) || 500,
          pxW: Number(s.pxW) || 192,
          pxH: Number(s.pxH) || 192,
          cols: Math.max(1, Number(s.cabCols) || Math.ceil((Number(s.widthM || s.physical?.[0]) || 4) / 0.5)),
          rows: Math.max(1, Number(s.cabRows) || Math.ceil((Number(s.heightM || s.physical?.[1]) || 2.5) / 0.5)),
          weightKg: 8.5,
          maxPowerW: 160,
          avgPowerW: 65,
          nits: 1200
        };
        const w = wireFn ? wireFn(s) : null;
        const curve = curveFn
          ? curveFn(s)
          : { chordSpanM: Number(s.chordMeters || s.widthM) || 4, sagittaDepthM: Number(s.depthMeters) || 0, arcLengthM: Number(s.widthM) || 4, isCurved: false, minAngleDeg: 0, maxAngleDeg: 0 };

        const activeCabs = w ? w.activeCabinets : Math.max(1, Number(s.activeCabinets || s.cabinets500) || (spec.cols * spec.rows));
        const voidCabs = w ? w.voidCabinets : Math.max(0, Number(s.voidCount) || 0);
        const cols = w ? w.cols : Math.max(1, Number(spec.cols) || 8);
        const rows = w ? w.rows : Math.max(1, Number(spec.rows) || 4);

        const surfaceKg = Number(s.totalWeightKg) || activeCabs * (Number(spec.weightKg) || 8.5);
        totalActiveCabs += activeCabs;
        totalVoidCabs += voidCabs;
        totalLedWeightKg += surfaceKg;
        hangingBars += cols;

        const heightM = Number(s.totalPhysicalHeightM) || (rows * (Number(spec.heightMm) || 500)) / 1000;
        groundStackBallastKg += Math.round(surfaceKg * 1.35 + Math.pow(Math.max(0, heightM), 1.6) * 28);

        if (w && Array.isArray(w.powerLoops)) {
          w.powerLoops.forEach((loop) => {
            powerCircuits.push({
              id: `${s.name || s.id}_${loop.loopId}`,
              watts: loop.watts,
              amps: loop.amps,
              type: 'LED'
            });
          });
          if (Array.isArray(w.warnings) && w.warnings.length) warnings.push(...w.warnings);
        } else {
          const loopWatts = activeCabs * (Number(spec.maxPowerW) || 160);
          const loopCount = Math.max(1, Math.ceil(loopWatts / 2200));
          const perLoopW = Math.round(loopWatts / loopCount);
          for (let i = 0; i < loopCount; i++) {
            powerCircuits.push({
              id: `${s.name || s.id}_L${i + 1}`,
              watts: perLoopW,
              amps: Math.round((perLoopW / 220) * 100) / 100,
              type: 'LED'
            });
          }
        }
        surfaceWirings.push({ id: s.id, name: s.name, wiring: w, curve, cabinetSpec: spec });
      });

      let currentLightCircuitW = 0;
      let lightCircuitIdx = 1;
      let totalLightWeightKg = 0;
      lights.forEach((l) => {
        const type = String(l.type || 'beam').toLowerCase();
        const w = Number(l.powerW ?? l.oflFixture?.powerW) || (type === 'beam' ? 380 : type === 'strobe' ? 1000 : 250);
        const kg = Number(l.weightKg ?? l.oflFixture?.weightKg) || (type === 'beam' ? 18 : type === 'strobe' ? 10 : 9);
        totalLightWeightKg += kg;
        if (currentLightCircuitW + w > 2200) {
          powerCircuits.push({ id: `LX_C${lightCircuitIdx++}`, watts: currentLightCircuitW, amps: +(currentLightCircuitW / 220).toFixed(2), type: 'LIGHT' });
          currentLightCircuitW = 0;
        }
        currentLightCircuitW += w;
      });
      if (currentLightCircuitW > 0) {
        powerCircuits.push({ id: `LX_C${lightCircuitIdx}`, watts: currentLightCircuitW, amps: +(currentLightCircuitW / 220).toFixed(2), type: 'LIGHT' });
      }

      const phases = {
        L1: { watts: 0, amps: 0, circuits: [] },
        L2: { watts: 0, amps: 0, circuits: [] },
        L3: { watts: 0, amps: 0, circuits: [] }
      };
      const sortedCircuits = [...powerCircuits].sort((a, b) => b.watts - a.watts);
      sortedCircuits.forEach((c) => {
        const target = ['L1', 'L2', 'L3'].reduce((minP, p) => (phases[p].watts < phases[minP].watts ? p : minP), 'L1');
        phases[target].watts += c.watts;
        phases[target].circuits.push(c.id);
      });
      ['L1', 'L2', 'L3'].forEach((p) => {
        phases[p].amps = Math.round((phases[p].watts / (220 * 0.9)) * 10) / 10;
      });

      const maxPhaseAmps = Math.max(phases.L1.amps, phases.L2.amps, phases.L3.amps);
      const minPhaseAmps = Math.min(phases.L1.amps, phases.L2.amps, phases.L3.amps);
      const avgPhaseAmps = (phases.L1.amps + phases.L2.amps + phases.L3.amps) / 3;
      const imbalancePercent = avgPhaseAmps > 0 ? Math.round(((maxPhaseAmps - minPhaseAmps) / avgPhaseAmps) * 1000) / 10 : 0;

      const feederLengthM = Math.max(1, +opts.feederLengthM || 50);
      const feederCrossSectionMm2 = Math.max(2.5, +opts.feederCrossSectionMm2 || 16);
      const rhoCopper = 0.0175;
      const deltaV = maxPhaseAmps > 0
        ? (Math.sqrt(3) * maxPhaseAmps * 0.85 * rhoCopper * feederLengthM) / feederCrossSectionMm2
        : 0;
      const voltageDropPercent = maxPhaseAmps > 0 ? Math.round((deltaV / 380) * 10000) / 100 : 0;
      if (voltageDropPercent > 3.0) {
        warnings.push(`Sụt áp cáp nguồn tổng (${voltageDropPercent}%) vượt ngưỡng 3%. Khuyến nghị tăng tiết diện cáp lên >= 25–35 mm².`);
      }

      const breakerSteps = [32, 63, 100, 125, 160, 250, 400];
      const requiredAmps = maxPhaseAmps * 1.25;
      const mainBreakerAmps = maxPhaseAmps > 0 ? (breakerSteps.find((b) => b >= requiredAmps) || 400) : 32;

      const trussSpanM = Math.max(2, +(opts.trussSpanM || opts.spanM || eng?.size?.width || 12));
      const cableAllowanceKg = +(totalLightWeightKg * 0.15).toFixed(2);
      const lightingWeightKg = +(totalLightWeightKg + cableAllowanceKg).toFixed(2);
      const totalRigWeightKg = totalLedWeightKg + totalLightWeightKg;
      const effectiveDeflectionLoadKg = totalLedWeightKg + lightingWeightKg;
      const udlKgPerM = Math.round((effectiveDeflectionLoadKg / trussSpanM) * 10) / 10;
      const qNPerM = (effectiveDeflectionLoadKg / trussSpanM) * 9.81;
      const E = 69e9;
      const I = 1.65e-5;
      const deflectionM = effectiveDeflectionLoadKg > 0 ? (5 * qNPerM * Math.pow(trussSpanM, 4)) / (384 * E * I) : 0;
      const deflectionMm = Math.round(deflectionM * 1000 * 100) / 100;
      const maxAllowedDeflectionMm = Math.round(((trussSpanM * 1000) / 200) * 10) / 10;
      if (deflectionMm > maxAllowedDeflectionMm) {
        warnings.push(`Độ võng Truss dự kiến (${deflectionMm} mm) vượt ngưỡng L/200 (${maxAllowedDeflectionMm} mm). Cần bổ sung điểm treo Palăng giữa nhịp.`);
      }
      const chainHoists1Ton = totalRigWeightKg > 0 ? Math.max(2, Math.ceil((totalRigWeightKg * 1.5) / 1000) + 1) : 0;
      const shackles325T = chainHoists1Ton * 2;

      const primaryPitchMm = surfaceWirings[0]?.cabinetSpec
        ? +(surfaceWirings[0].cabinetSpec.widthMm / surfaceWirings[0].cabinetSpec.pxW).toFixed(2)
        : 2.6;
      const cameraFovDeg = Math.max(15, Math.min(110, +opts.cameraFovDeg || 50));
      const minMoireDistanceM = Math.round(primaryPitchMm * 1.35 * (50 / cameraFovDeg) * 100) / 100;
      const targetNits = surfaceWirings[0]?.cabinetSpec?.nits || 1200;
      const recommendedCameraNits = Math.min(targetNits, 900);
      const recommendedKeyLightLux = Math.round(recommendedCameraNits * 1.4);

      const flightCases = Math.ceil(totalActiveCabs / 6);
      const ledVolumeM3 = flightCases * (1.15 * 0.65 * 0.78);
      const lightVolumeM3 = Math.ceil(lights.length / 2) * (0.9 * 0.55 * 0.75);
      const totalVolumeM3 = Math.round((ledVolumeM3 + lightVolumeM3) * 100) / 100;

      const powercon20ACircuits = Math.max(1, powerCircuits.filter((c) => c.type === 'LED').length);
      const phaseLoadAmps = {
        L1: Math.ceil(phases.L1.amps),
        L2: Math.ceil(phases.L2.amps),
        L3: Math.ceil(phases.L3.amps)
      };
      const recommendedBreaker = `MCCB 3P ${mainBreakerAmps}A`;

      return {
        power3Phase: {
          L1: phases.L1,
          L2: phases.L2,
          L3: phases.L3,
          imbalancePercent,
          mainBreakerAmps,
          feederLengthM,
          feederCrossSectionMm2,
          voltageDropPercent,
          totalCircuits: powerCircuits.length
        },
        rigging: {
          totalLedWeightKg: Math.round(totalLedWeightKg * 10) / 10,
          totalLightWeightKg,
          cableAllowanceKg,
          lightingWeightKg,
          totalRigWeightKg: Math.round(totalRigWeightKg * 10) / 10,
          trussSpanM,
          udlKgPerM,
          deflectionMm,
          maxAllowedDeflectionMm,
          hangingBars,
          chainHoists1Ton,
          shackles325T,
          groundStackBallastKg
        },
        broadcastOptics: {
          primaryPitchMm,
          cameraFovDeg,
          minMoireDistanceM,
          recommendedCameraNits,
          recommendedKeyLightLux
        },
        logistics: {
          totalActiveCabs,
          totalVoidCabs,
          flightCases,
          totalVolumeM3
        },
        surfaceWirings,
        warnings,
        // Backward-compatible flat properties
        totalActiveCabs,
        totalVoidCabs,
        hangingBars,
        shacklesCount: shackles325T,
        hoist1TonCount: chainHoists1Ton,
        ballastKg: groundStackBallastKg,
        powercon20ACircuits,
        phaseLoadAmps,
        recommendedBreaker,
        lightingWeightKg,
        cableAllowanceKg,
        trussDeflectionMm: deflectionMm,
        maxAllowableDeflectionMm: maxAllowedDeflectionMm
      };
    }

    function normalizeSfxType18(rawType) {
      const t = String(rawType || '').trim();
      if (t === 'co2_cannon' || t === 'co2_cannon_jet') return 'co2_jet';
      return t;
    }

    function getSfxCatalogSpec18(type) {
      const normType = normalizeSfxType18(type);
      const cat = (typeof globalThis !== 'undefined' && globalThis.SFX_CATALOG) || (typeof S !== 'undefined' && S?.SFX_CATALOG) || {};
      const fallback = {
        cold_spark_fountain: { id: 'cold_spark_fountain', plumeHeightM: 3.5, safetyRadiusM: 1.5, safetyHeightM: 4.5, indoorAllowed: true, consumableName: 'Ti-Zr Spark Granules (200g pouch)', consumableUnit: 'g', packSize: 200, burnRatePerMin: 25 },
        co2_jet: { id: 'co2_jet', plumeHeightM: 8.0, safetyRadiusM: 2.0, safetyHeightM: 8.5, indoorAllowed: true, consumableName: 'Liquid CO2 Siphon Cylinder (20kg)', consumableUnit: 'kg', packSize: 20, burnRatePerSec: 0.45 },
        flame_jet: { id: 'flame_jet', plumeHeightM: 6.0, safetyRadiusM: 3.0, safetyHeightM: 8.0, indoorAllowed: false, consumableName: 'Isopar / LPG Pyro Fuel (5L canister)', consumableUnit: 'L', packSize: 5, burnRatePerMin: 0.25 },
        confetti_cannon: { id: 'confetti_cannon', plumeHeightM: 12.0, safetyRadiusM: 2.5, safetyHeightM: 10.0, indoorAllowed: true, consumableName: 'Flameproof Metallic Confetti (1kg bag)', consumableUnit: 'kg', packSize: 1, burnRatePerShot: 0.5 },
        haze_machine_pro: { id: 'haze_machine_pro', plumeHeightM: 2.0, safetyRadiusM: 0.5, safetyHeightM: 2.5, indoorAllowed: true, consumableName: 'Neutral Touring Haze Fluid (2.5L bottle)', consumableUnit: 'mL', packSize: 2500, burnRatePerHour: 120 }
      };
      return cat[normType] || fallback[normType] || fallback.cold_spark_fountain;
    }

    function extractStageSfxUnits18(explicitUnits) {
      if (Array.isArray(explicitUnits)) return explicitUnits;
      const items = (typeof S !== 'undefined' && Array.isArray(S?.stageAssets16?.items)) ? S.stageAssets16.items : [];
      const known = new Set(['cold_spark_fountain', 'co2_jet', 'flame_jet', 'confetti_cannon', 'haze_machine_pro']);
      return items.filter((it) => known.has(normalizeSfxType18(it?.type || it?.kind)));
    }

    function computeSfxSafetyZones(input = {}) {
      const venueEnv = String(input.venueEnv || 'outdoor').toLowerCase() === 'indoor' ? 'indoor' : 'outdoor';
      const ceilingHeightM = Math.max(2.5, +(input.ceilingHeightM || 12.0));
      const audienceLineZ = Number.isFinite(+input.audienceLineZ) ? +input.audienceLineZ : 4.0;
      const units = extractStageSfxUnits18(input.units ?? input.sfxUnits);

      const zones = [];
      const violations = [];
      units.forEach((u, idx) => {
        const type = normalizeSfxType18(u?.type || u?.kind || 'cold_spark_fountain') || 'cold_spark_fountain';
        const spec = getSfxCatalogSpec18(type);
        const pos = Array.isArray(u?.pos) ? u.pos : [u?.x ?? 0, u?.y ?? 0, u?.z ?? 0];
        const x = +(u?.x ?? pos[0]) || 0;
        const y = +(u?.y ?? pos[1]) || 0;
        const z = +(u?.z ?? pos[2]) || 0;
        const unitId = String(u?.id || `SFX_${idx + 1}`);
        const safetyRadiusM = +(u?.safetyRadiusM || spec.safetyRadiusM || 1.5);
        const safetyHeightM = +(u?.safetyHeightM || spec.safetyHeightM || 4.5);
        const plumeHeightM = +(u?.plumeHeightM || spec.plumeHeightM || 3.5);

        zones.push({
          unitId,
          type,
          x,
          y,
          z,
          safetyRadiusM,
          safetyHeightM,
          plumeHeightM,
          indoorAllowed: Boolean(spec.indoorAllowed)
        });

        if (venueEnv === 'indoor' && !spec.indoorAllowed) {
          violations.push({
            unitId,
            type,
            severity: 'CRITICAL',
            code: 'INDOOR_PYRO_PROHIBITED',
            message: `${unitId} (${type}) prohibited indoors per NFPA 1126 / EN 16256.`
          });
        }
        if (y + safetyHeightM > ceilingHeightM) {
          violations.push({
            unitId,
            type,
            severity: 'CRITICAL',
            code: 'CEILING_CLEARANCE_BREACH',
            message: `${unitId} safety clearance height (${(y + safetyHeightM).toFixed(1)}m) exceeds venue ceiling (${ceilingHeightM.toFixed(1)}m).`
          });
        }
        if (Math.abs(audienceLineZ - z) < safetyRadiusM) {
          violations.push({
            unitId,
            type,
            severity: 'CRITICAL',
            code: 'AUDIENCE_DISTANCE_BREACH',
            message: `${unitId} is ${Math.abs(audienceLineZ - z).toFixed(2)}m from audience line (minimum required: ${safetyRadiusM}m).`
          });
        }
      });

      return {
        venueEnv,
        ceilingHeightM,
        audienceLineZ,
        zones,
        violations,
        hasCriticalHazard: violations.some((v) => v.severity === 'CRITICAL')
      };
    }

    function computeSfxConsumablesBom(input = {}) {
      const units = extractStageSfxUnits18(input.units ?? input.sfxUnits);
      const cuesPerUnit = Math.max(1, +(input.cuesPerUnit ?? 6));
      const avgCueDurationSec = Math.max(1, +(input.avgCueDurationSec ?? 5));
      const showDurationHours = Math.max(0.5, +(input.showDurationHours ?? 2));
      const grouped = new Map();
      units.forEach((u) => {
        const type = normalizeSfxType18(u?.type || u?.kind || '');
        if (!type) return;
        grouped.set(type, (grouped.get(type) || 0) + 1);
      });

      const items = [];
      for (const [sfxType, unitCount] of grouped.entries()) {
        const spec = getSfxCatalogSpec18(sfxType);
        let rawQty = 0;
        if (spec.burnRatePerMin) {
          rawQty = unitCount * ((cuesPerUnit * avgCueDurationSec) / 60) * spec.burnRatePerMin;
        } else if (spec.burnRatePerSec) {
          rawQty = unitCount * (cuesPerUnit * avgCueDurationSec) * spec.burnRatePerSec;
        } else if (spec.burnRatePerShot) {
          rawQty = unitCount * cuesPerUnit * spec.burnRatePerShot;
        } else if (spec.burnRatePerHour) {
          rawQty = unitCount * showDurationHours * spec.burnRatePerHour;
        }
        const totalQuantity = +rawQty.toFixed(2);
        const packSize = Math.max(1, +spec.packSize || 1);
        const packsRequired = Math.max(1, Math.ceil((rawQty * 1.15) / packSize));
        items.push({
          sfxType,
          unitCount,
          consumableName: spec.consumableName,
          unit: spec.consumableUnit,
          totalQuantity,
          packSize,
          packsRequired
        });
      }
      return {
        cuesPerUnit,
        avgCueDurationSec,
        showDurationHours,
        items
      };
    }

    function computePhotometricFootprint(input = {}) {
      const lights = Array.isArray(input.lights) ? input.lights : [];
      const ledScreenNits = Math.max(100, +(input.ledScreenNits || 1200));
      const cones = lights.map((l, idx) => {
        const pos = Array.isArray(l?.pos) ? l.pos : [l?.x ?? 0, l?.y ?? 7, l?.z ?? 0];
        const x = +(l?.x ?? pos[0]) || 0;
        const y = Math.max(0.5, +(l?.y ?? pos[1]) || 7.0);
        const z = +(l?.z ?? pos[2]) || 0;
        const target = Array.isArray(l?.target) ? l.target : [l?.targetX ?? x, 0, l?.targetZ ?? z];
        const hitX = +(target[0] ?? x).toFixed(3);
        const hitZ = +(target[2] ?? z).toFixed(3);
        const throwDistanceM = +Math.max(0.5, Math.hypot(hitX - x, y - (target[1] || 0), hitZ - z)).toFixed(3);
        const type = String(l?.type || 'beam').toLowerCase();
        const beamAngleDeg = Math.max(1, Math.min(120, +(l?.beamAngleDeg || (l?.angle ? l.angle * 2 : (type === 'beam' ? 6 : 30)))));
        const halfRad = (beamAngleDeg * Math.PI) / 360;
        const spotRadiusM = +(throwDistanceM * Math.tan(halfRad)).toFixed(3);
        const spotDiameterM = +(spotRadiusM * 2).toFixed(3);
        const luminousFluxLm = Math.max(100, +(l?.luminousFluxLm || (type === 'beam' ? 18000 : type === 'strobe' ? 40000 : 22000)));
        const omegaSr = Math.max(1e-4, 2 * Math.PI * (1 - Math.cos(halfRad)));
        const candela = (luminousFluxLm / omegaSr) * 0.85;
        const cosIncidence = Math.max(0.15, y / throwDistanceM);
        const estimatedLux = Math.round((candela / (throwDistanceM * throwDistanceM)) * cosIncidence);
        return {
          id: l?.id || `LIGHT_${idx + 1}`,
          name: l?.name || `Fixture #${idx + 1}`,
          type,
          hitX,
          hitZ,
          throwDistanceM,
          beamAngleDeg,
          spotRadiusM,
          spotDiameterM,
          estimatedLux
        };
      });

      const avgFloorLux = cones.length ? Math.round(cones.reduce((acc, c) => acc + c.estimatedLux, 0) / cones.length) : 0;
      const luxToNitsRatio = +(avgFloorLux / ledScreenNits).toFixed(2);
      const exposureStatus = luxToNitsRatio < 0.8
        ? 'LED_OVEREXPOSED'
        : (luxToNitsRatio > 2.5 ? 'STAGE_HOTSPOT' : 'BALANCED_BROADCAST');

      return {
        cones,
        avgFloorLux,
        ledScreenNits,
        luxToNitsRatio,
        exposureStatus
      };
    }

    function buildStructurePreviewSvg(surface, riggingOpts = {}) {
      const target = Array.isArray(surface) ? (surface[0] || null) : surface;
      if (!target || typeof target !== 'object') return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 260"></svg>';
      if (!target.physical && (target.widthM || target.heightM)) {
        target.physical = [Number(target.widthM) || 4, Number(target.heightM) || 2.5];
      }
      const viewMode = (riggingOpts?.viewMode || target?.wiringViewMode) === 'rear' ? 'rear' : 'front';
      const viewBanner = viewMode === 'rear' ? 'REAR VIEW (TECHNICIAN MIRROR)' : 'FRONT VIEW (AUDIENCE)';
      const normFn = typeof normalizeSurfaceHardware === 'function'
        ? normalizeSurfaceHardware
        : (typeof window !== 'undefined' && typeof window.normalizeSurfaceHardware === 'function'
          ? window.normalizeSurfaceHardware
          : (typeof S !== 'undefined' ? S.spatial?.normalizeSurfaceHardware : null));
      const curveFn = typeof computeCurvedSpanMeters === 'function'
        ? computeCurvedSpanMeters
        : (typeof window !== 'undefined' && typeof window.computeCurvedSpanMeters === 'function'
          ? window.computeCurvedSpanMeters
          : (typeof S !== 'undefined' ? S.spatial?.computeCurvedSpanMeters : null));

      if (normFn) normFn(target);
      const spec = target.cabinetSpec || {
        cols: Math.max(1, Number(target.cabCols) || 8),
        rows: Math.max(1, Number(target.cabRows) || 4),
        widthMm: Number(target.cabW) || 500,
        heightMm: Number(target.cabH) || 500
      };
      const curve = curveFn
        ? curveFn(target)
          : { chordWidthM: Number(target.chordMeters || target.widthM) || 4, depthOffsetM: Number(target.depthMeters) || 0 };
      const rows = Math.max(1, spec.rows | 0);
      const cols = Math.max(1, spec.cols | 0);
      const totalHm = Number(target.totalPhysicalHeightM) || (rows * (spec.heightMm || 500)) / 1000;
      const hMeters = totalHm.toFixed(2);
      const wMeters = ((cols * (spec.widthMm || 500)) / 1000).toFixed(2);
      const rawAngles = Array.isArray(target.columnAnglesDeg)
        ? target.columnAnglesDeg
        : Array.from({ length: cols }, () => Number(target.panelAngleDeg) || 0);
      const angles = viewMode === 'rear' ? [...rawAngles].reverse() : rawAngles;

      let sideCells = '';
      const cellH = Math.min(28, Math.floor(150 / rows));
      const rowLayout = Array.isArray(target.rowLayout) && target.rowLayout.length === rows ? target.rowLayout : null;
      const totalLayoutMm = rowLayout ? Math.max(1, rowLayout.reduce((sum, rl) => sum + (Number(rl.heightMm) || 500), 0)) : rows * (spec.heightMm || 500);
      const stackPx = rows * cellH;
      let curY = 55;
      for (let r = 0; r < rows; r++) {
        const rowMm = rowLayout ? (Number(rowLayout[r].heightMm) || 500) : (spec.heightMm || 500);
        const rH = rowLayout ? Math.max(8, Math.round((rowMm / totalLayoutMm) * stackPx)) : cellH;
        sideCells += `<rect x="95" y="${curY}" width="18" height="${Math.max(4, rH - 2)}" fill="#0ea5e9" stroke="#0284c7" stroke-width="1"/>`;
        sideCells += `<line x1="113" y1="${curY + rH / 2}" x2="155" y2="${55 + stackPx}" stroke="#64748b" stroke-dasharray="3,2"/>`;
        curY += rH;
      }

      const stepLen = Math.min(26, Math.floor(220 / cols));
      let topPath = '';
      let cx = 340, cy = 150, heading = 0;
      for (let c = 0; c < cols; c++) {
        heading += ((angles[c] || 0) * Math.PI) / 180;
        const nx = cx + Math.cos(heading) * stepLen;
        const ny = cy - Math.sin(heading) * stepLen;
        const colLabel = viewMode === 'rear' ? `C${cols - c}` : `C${c + 1}`;
        topPath += `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#22c55e" stroke-width="5" stroke-linecap="round"/>`;
        topPath += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.5" fill="#f8fafc"><title>${colLabel}</title></circle>`;
        cx = nx;
        cy = ny;
      }

      return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 280" width="100%" height="280" style="background:#0b1120;border:1px solid #1e293b;border-radius:8px;font-family:monospace">`,
        `  <text x="20" y="26" fill="#e2e8f0" font-size="13" font-weight="bold">Side View (${viewBanner}) — ${esc18(target.name || 'LED')} (${hMeters}m H)</text>`,
        `  <rect x="75" y="38" width="95" height="12" fill="#f59e0b" rx="2"/>`,
        `  <text x="180" y="48" fill="#fbbf24" font-size="11">Truss + Hanging Bar</text>`,
        sideCells,
        `  <line x1="40" y1="${55 + rows * cellH}" x2="230" y2="${55 + rows * cellH}" stroke="#94a3b8" stroke-width="2"/>`,
        `  <rect x="145" y="${43 + rows * cellH}" width="36" height="12" fill="#ef4444" rx="2"/>`,
        `  <text x="40" y="${74 + rows * cellH}" fill="#94a3b8" font-size="11">Rear Outrigger + Ballast</text>`,
        `  <line x1="280" y1="15" x2="280" y2="265" stroke="#1e293b" stroke-width="1"/>`,
        `  <text x="305" y="26" fill="#e2e8f0" font-size="13" font-weight="bold">Top View (Curve / Chord: ${curve.chordWidthM}m / Depth: ${curve.depthOffsetM}m)</text>`,
        topPath,
        `  <text x="305" y="245" fill="#94a3b8" font-size="11">Total Arc Width: ${wMeters}m (${cols}x${rows} cabinets · ${viewBanner})</text>`,
        `</svg>`
      ].join('\n');
    }

    function computeStageBom() {
      const eng = getEngine();
      const surfaces = Array.isArray(eng?.surfaces) ? eng.surfaces.filter(s => !s._deleted8) : [];
      const lights = Array.isArray(eng?.lights) ? eng.lights.filter((l) => l.enabled !== false) : [];
      const props = Array.isArray(S.stageAssets16?.items) ? S.stageAssets16.items : [];

      let totalLedAreaM2 = 0;
      let totalCabinets500 = 0;
      let totalPixels = 0;
      let totalLedMaxKw = 0;
      let totalLedAvgKw = 0;
      let totalLedWeightKg = 0;

      const ledItems = surfaces.map((s, idx) => {
        const normFn = typeof normalizeSurfaceHardware === 'function'
          ? normalizeSurfaceHardware
          : (typeof window !== 'undefined' && typeof window.normalizeSurfaceHardware === 'function'
            ? window.normalizeSurfaceHardware
            : S.spatial?.normalizeSurfaceHardware);
        if (typeof normFn === 'function') normFn(s);
        const wiring = typeof planSurfaceWiring === 'function' ? planSurfaceWiring(s) : null;
        const spec = s.cabinetSpec;
        const pitch = Number(s.pitchMm || spec?.pitchMm) || 3.91;
        const wM = +(Number(s.physicalWidthM || s.physical?.[0] || s.physical?.width || s.totalPhysicalWidthM || (s.w * pitch) / 1000 || 4)).toFixed(2);
        const hM = +(Number(s.physicalHeightM || s.physical?.[1] || s.physical?.height || s.totalPhysicalHeightM || (s.h * pitch) / 1000 || 2.5)).toFixed(2);
        const cabWmm = Number(s.cabW || spec?.widthMm) || 500;
        const cabHmm = Number(s.cabH || spec?.heightMm) || 500;
        const cols500 = Math.max(1, Number(s.cabCols) || Math.ceil((wM * 1000 - 1) / cabWmm));
        const rows500 = Math.max(1, Number(s.cabRows) || Math.ceil((hM * 1000 - 1) / cabHmm));
        const virtualTiles = Array.isArray(s.virtualTiles) ? s.virtualTiles : [];
        const voidCount = virtualTiles.length;
        const totalGrid = Math.max(1, cols500 * rows500);
        const activeCabinets = Math.max(1, totalGrid - voidCount);
        const hasRowLayout = Array.isArray(s.rowLayout) && s.rowLayout.length > 0;
        const fullAreaM2 = hasRowLayout
          ? ((Number(s.totalPhysicalWidthM) || wM) * (Number(s.totalPhysicalHeightM) || hM))
          : (totalGrid * (cabWmm / 1000) * (cabHmm / 1000));
        const areaM2 = +(fullAreaM2 * (activeCabinets / totalGrid)).toFixed(2);
        const cabinets500 = Math.max(activeCabinets, Math.round(areaM2 / 0.25));
        const pixels = wiring ? wiring.totalPixels : (Number(s.totalResX) && Number(s.totalResY) ? s.totalResX * s.totalResY : (Number(s.w) || 1920) * (Number(s.h) || 1080));
        const maxKw = +(Number(s.totalPowerMaxW) > 0 ? s.totalPowerMaxW / 1000 : (spec ? activeCabinets * spec.maxPowerW / 1000 : areaM2 * 0.65)).toFixed(2);
        const avgKw = +(Number(s.totalPowerAvgW) > 0 ? s.totalPowerAvgW / 1000 : (spec ? activeCabinets * spec.avgPowerW / 1000 : areaM2 * 0.28)).toFixed(2);
        const weightKg = Number(s.totalWeightKg) > 0 ? Math.round(s.totalWeightKg) : Math.round(activeCabinets * (spec?.weightKg || 7.8));
        const panelAngleDeg = Number(s.panelAngleDeg) || 0;
        const curveInfo = typeof S.spatial?.computeCurvedSpanMeters === 'function'
          ? S.spatial.computeCurvedSpanMeters(s)
          : { arcMeters: wM, chordMeters: wM, depthMeters: 0 };

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
          cabCols: cols500,
          cabRows: rows500,
          activeCabinets,
          voidCount,
          virtualTiles,
          panelAngleDeg,
          chordMeters: curveInfo.chordMeters,
          depthMeters: curveInfo.depthMeters,
          wiringOrder: s.wiringOrder || 'snake-tl-h',
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
      const lightMaxKw = +(lights.reduce((sum, l) => {
        const type = String(l.type || 'beam').toLowerCase();
        return sum + (Number(l.powerW) || (type === 'beam' ? 380 : type === 'strobe' ? 1000 : 250)) / 1000;
      }, 0) + glbFixtureKw).toFixed(2);
      const lightWeightKg = Math.round(lights.reduce((sum, l) => {
        const type = String(l.type || 'beam').toLowerCase();
        return sum + (Number(l.weightKg) || (type === 'beam' ? 18 : type === 'strobe' ? 10 : 9));
      }, 0) + glbFixtureWeightKg);

      const stageW = +(eng?.size?.width || 16).toFixed(1);
      const stageD = +(eng?.size?.depth || 8).toFixed(1);
      const stageAreaM2 = +(stageW * stageD).toFixed(1);
      const trussMeters = Math.round(stageW * 2 + stageD * 2 + 24);
      const trussWeightKg = Math.round(trussMeters * 6.5);

      const totalMaxKw = +(totalLedMaxKw + lightMaxKw + 3.0).toFixed(2);
      const totalAvgKw = +(totalLedAvgKw + lightMaxKw * 0.7 + 1.8).toFixed(2);
      // I_3phase = P(W) / (sqrt(3) * 380V * cosPhi(0.85))
      const currentPerPhaseAmps = Math.ceil((totalMaxKw * 1000) / (1.732 * 380 * 0.85));
      const rj45PortsNeeded = Math.max(1, surfaces.reduce((sum, s) => sum + (typeof planSurfaceWiring === 'function' ? planSurfaceWiring(s).dataPorts.length : Math.ceil((s.w * s.h) / 650000)), 0));
      const recommendedProcessor =
        totalPixels <= 2300000 && rj45PortsNeeded <= 4
          ? 'NovaStar VX4S / VX400 (4 cổng RJ45 · tối đa 2.6M px)'
          : totalPixels <= 3900000 && rj45PortsNeeded <= 6
          ? 'NovaStar VX600 (6 cổng RJ45 · tối đa 3.9M px)'
          : totalPixels <= 6500000 && rj45PortsNeeded <= 10
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
          qty: totalPixels > 6500000 || rj45PortsNeeded > 10 ? 2 : 1,
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

      const engineeringRider = computeEngineeringRider({
        surfaces: surfaces.length ? surfaces : ledItems,
        lights,
        fixtureRigs16: glbRigs,
        size: eng?.size
      });
      const structureSvg = buildStructurePreviewSvg(surfaces.length ? surfaces[0] : ledItems[0]);

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
          engineeringRider,
          structureSvg,
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
      const eng = typeof getEngine === 'function' ? getEngine() : null;
      const bom = typeof computeStageBom === 'function' ? computeStageBom() : null;
      const w = Number(opts?.stageW || bom?.summary?.stageW || eng?.size?.width || 16);
      const d = Number(opts?.stageD || bom?.summary?.stageD || eng?.size?.depth || 8);
      const viewMode = opts?.viewMode === 'rear' ? 'rear' : 'front';
      const surfaceList = Array.isArray(opts?.surfaces) ? opts.surfaces : (Array.isArray(eng?.surfaces) ? eng.surfaces : []);
      const lightList = Array.isArray(opts?.lights) ? opts.lights : (Array.isArray(eng?.lights) ? eng.lights : []);
      const sfxList = typeof extractStageSfxUnits18 === 'function'
        ? extractStageSfxUnits18(opts?.sfxUnits)
        : (Array.isArray(opts?.sfxUnits) ? opts.sfxUnits : []);
      const entities = [];

      // 1. MẶT BẰNG (TOP VIEW — gốc tại (0, 0))
      entities.push(dxfText('DIMENSIONS', -w / 2, d / 2 + 1.8, 0.45, `MAT BANG SAN KHAU (TOP VIEW) - ${w}m x ${d}m`));
      entities.push(dxfRect('STAGE_PLATFORM', 0, 0, w, d));
      if (opts?.watermark && typeof LUMI_BRAND !== 'undefined') {
        entities.push(dxfText('WATERMARK', -w / 2, -d / 2 - 1.2, 0.35, LUMI_BRAND.watermarkText));
      }

      for (const s of surfaceList) {
        if (!s || s._deleted8) continue;
        const c = s.mesh?.bounds?.center || [0, 2.5, -2];
        const sw = Number(s.physicalWidthM || s.physical?.[0] || s.physical?.width || s.totalPhysicalWidthM || 4);
        entities.push(dxfRect('LED_SCREENS', c[0], -c[2], sw, 0.25));
        entities.push(dxfText('LED_SCREENS', c[0] - sw * 0.4, -c[2] + 0.3, 0.25, `${s.name || s.id || 'LED'} (${sw}m P${s.pitchMm || 3.91})`));
      }

      for (const l of lightList) {
        if (!l || l.enabled === false) continue;
        const px = l.pos?.[0] ?? l.x ?? 0, pz = -(l.pos?.[2] ?? l.z ?? 0);
        entities.push(dxfRect('LIGHT_FIXTURES', px, pz, 0.3, 0.3));
      }

      if (typeof computePhotometricFootprint === 'function' && lightList.length > 0) {
        const photo = computePhotometricFootprint({ lights: lightList });
        for (const cone of photo.cones) {
          entities.push(dxfRect('LUX_FOOTPRINT', cone.hitX, -cone.hitZ, cone.spotDiameterM, cone.spotDiameterM));
          entities.push(dxfText('LUX_FOOTPRINT', cone.hitX - 0.3, -cone.hitZ, 0.18, `${cone.estimatedLux} lx`));
        }
      }

      if (typeof computeSfxSafetyZones === 'function' && sfxList.length > 0) {
        const safety = computeSfxSafetyZones({ units: sfxList });
        for (const zZone of safety.zones) {
          const diam = zZone.safetyRadiusM * 2;
          entities.push(dxfRect('SAFETY_CLEARANCE', zZone.x, -zZone.z, diam, diam));
          entities.push(dxfText('SAFETY_CLEARANCE', zZone.x - 0.4, -zZone.z, 0.2, `CLEARANCE R=${zZone.safetyRadiusM}m`));
        }
      }

      // 2. MẶT ĐỨNG (FRONT ELEVATION / REAR VIEW TECHNICIAN MIRROR — dịch sang phải (w + 10, 0))
      const ox = w + 10;
      const elevHeader = viewMode === 'rear'
        ? 'MAT DUNG PHIA SAU - REAR VIEW (TECHNICIAN MIRROR)'
        : 'MAT DUNG CHINH DIEN (FRONT ELEVATION)';
      entities.push(dxfText('DIMENSIONS', ox - w / 2, 7.5, 0.45, elevHeader));
      entities.push(dxfRect('STAGE_PLATFORM', ox, 0.45, w, 0.9));

      for (const s of surfaceList) {
        if (!s || s._deleted8) continue;
        const c = s.mesh?.bounds?.center || [0, 2.8, -2];
        const sw = Number(s.physicalWidthM || s.physical?.[0] || s.physical?.width || s.totalPhysicalWidthM || 4);
        const sh = Number(s.physicalHeightM || s.physical?.[1] || s.physical?.height || s.totalPhysicalHeightM || 3);
        const cx = ox + c[0], cy = c[1];
        entities.push(dxfRect('LED_SCREENS', cx, cy, sw, sh));
        entities.push(dxfText('LED_SCREENS', cx - sw * 0.42, cy + sh * 0.5 + 0.18, 0.22, `${s.name || s.id || 'LED'} ${sw}x${sh}m (${s.w}x${s.h}px) [${viewMode.toUpperCase()} VIEW]`));

        // Cabinet grid & serpentine wiring layers (PANEL_OUTLINE, VIRTUAL_VOID, WIRING_DATA, WIRING_POWER)
        const cols = Math.max(1, Math.min(48, Number(s.cabCols) || Math.ceil(sw / 0.5)));
        const rows = Math.max(1, Math.min(32, Number(s.cabRows) || Math.ceil(sh / 0.5)));
        const cw = sw / cols, ch = sh / rows;
        const left = cx - sw * 0.5, top = cy + sh * 0.5;
        const rowLayout = Array.isArray(s.rowLayout) && s.rowLayout.length === rows ? s.rowLayout : null;
        const totalLayoutM = rowLayout ? Math.max(0.1, rowLayout.reduce((sum, rl) => sum + ((Number(rl.heightMm) || 500) / 1000), 0)) : sh;
        const rowHeights = [];
        const rowCenterY = [];
        for (let r = 0, accY = top; r < rows; r++) {
          const rh = rowLayout ? sh * (((Number(rowLayout[r].heightMm) || 500) / 1000) / totalLayoutM) : ch;
          rowHeights.push(rh);
          rowCenterY.push(accY - rh * 0.5);
          accY -= rh;
        }
        const voidSet = new Set(Array.isArray(s.virtualTiles) ? s.virtualTiles.map(String) : []);

        for (let r = 0; r < rows; r++) {
          const rh = rowHeights[r] ?? ch;
          const tileCy = rowCenterY[r] ?? (top - (r + 0.5) * ch);
          for (let col = 0; col < cols; col++) {
            const dispCol = viewMode === 'rear' ? (cols - 1 - col) : col;
            const tileCx = left + (dispCol + 0.5) * cw;
            if (voidSet.has(`${col},${r}`)) {
              entities.push(dxfRect('VIRTUAL_VOID', tileCx, tileCy, cw * 0.92, rh * 0.92));
            } else {
              entities.push(dxfRect('PANEL_OUTLINE', tileCx, tileCy, cw, rh));
            }
          }
        }

        const wireFn = typeof planSurfaceWiring === 'function'
          ? planSurfaceWiring
          : (typeof window !== 'undefined' && typeof window.planSurfaceWiring === 'function'
            ? window.planSurfaceWiring
            : (typeof S !== 'undefined' ? S.atlas?.planSurfaceWiring : null));
        const wPlan = wireFn ? wireFn(s, { viewMode }) : null;
        if (wPlan && Array.isArray(wPlan.dataPorts)) {
          for (const port of wPlan.dataPorts) {
            for (let idx = 0; idx + 1 < port.cabinets.length; idx++) {
              const a = port.cabinets[idx], b = port.cabinets[idx + 1];
              const colA = a.displayCol ?? a.col;
              const colB = b.displayCol ?? b.col;
              const x1 = left + (colA + 0.5) * cw, y1 = rowCenterY[a.row] ?? (top - (a.row + 0.5) * ch);
              const x2 = left + (colB + 0.5) * cw, y2 = rowCenterY[b.row] ?? (top - (b.row + 0.5) * ch);
              entities.push(dxfLine('WIRING_DATA', x1, y1, x2, y2));
            }
            const first = port.cabinets[0];
            if (first) {
              const colF = first.displayCol ?? first.col;
              const rhF = rowHeights[first.row] ?? ch;
              const fx = left + (colF + 0.25) * cw, fy = rowCenterY[first.row] ?? (top - (first.row + 0.5) * ch);
              entities.push(dxfText('WIRING_DATA', fx, fy, Math.min(0.14, rhF * 0.28), port.portId));
            }
          }
        }
        if (wPlan && Array.isArray(wPlan.powerLoops)) {
          for (const loop of wPlan.powerLoops) {
            for (let idx = 0; idx + 1 < loop.cabinets.length; idx++) {
              const a = loop.cabinets[idx], b = loop.cabinets[idx + 1];
              const colA = a.displayCol ?? a.col;
              const colB = b.displayCol ?? b.col;
              const x1 = left + (colA + 0.5) * cw, y1 = (rowCenterY[a.row] ?? (top - (a.row + 0.5) * ch)) - 0.04;
              const x2 = left + (colB + 0.5) * cw, y2 = (rowCenterY[b.row] ?? (top - (b.row + 0.5) * ch)) - 0.04;
              entities.push(dxfLine('WIRING_POWER', x1, y1, x2, y2));
            }
            const first = loop.cabinets[0];
            if (first) {
              const colF = first.displayCol ?? first.col;
              const rhF = rowHeights[first.row] ?? ch;
              const fx = left + (colF + 0.25) * cw, fy = (rowCenterY[first.row] ?? (top - (first.row + 0.5) * ch)) - 0.08;
              entities.push(dxfText('WIRING_POWER', fx, fy, Math.min(0.12, rhF * 0.24), loop.loopId));
            }
          }
        }
        entities.push(dxfLine('WIRING_POWER', left, top + 0.08, left + sw, top + 0.08));
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
        <div class="card"><strong>Nguồn điện 3 pha & Tải treo</strong><br>${s.totalMaxKw} kW (L1:${s.engineeringRider?.phaseLoadAmps?.L1 || s.currentPerPhaseAmps}A · L2:${s.engineeringRider?.phaseLoadAmps?.L2 || s.currentPerPhaseAmps}A · L3:${s.engineeringRider?.phaseLoadAmps?.L3 || s.currentPerPhaseAmps}A · ${s.engineeringRider?.powercon20ACircuits || 1} lộ PowerCON 20A) · Treo ${s.totalRiggingWeightKg} kg (${s.engineeringRider?.hangingBars || 0} thanh treo · Đối trọng ${s.engineeringRider?.ballastKg || 0} kg)</div>
      </div>
      ${mode === 'tech' && s.structureSvg ? `<div style="margin:12px 0"><strong>Sơ đồ Kết cấu & Khung treo LED (Structure & Rigging Preview)</strong>${s.structureSvg}</div>` : ''}
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
          "12×6m stage, main P3.91 LED (7×3.5m), two LED wings (2.5×3.5m), VIP podium, IBM delegate tables, MCs and 16 Par/Beam lights."
        ],
        "Tiệc cưới Sang trọng": [
          "Luxury wedding",
          "14×7m stage with catwalk, 8×4m main LED, four LED totems, floral arch, round banquet tables, Violin/Saxophone and cold sparks."
        ],
        "Đại nhạc hội EDM": [
          "EDM concert",
          "24×12m stage, 14×6m main LED, four angled LED wings and DJ front LED, central DJ desk, line arrays, CO2 cannons and 32 moving head beams."
        ],
        "Lễ Khai trương / Khánh thành / Ra mắt SP": [
          "Grand opening / product launch",
          "10×5m stage, 6×3.5m main LED, two 1×2.5m LED standees, LED arch, VIP podium, Water Drummers & Fan Dancers."
        ],
        "Gala Dinner / Year End Party (YEP)": [
          "Gala Dinner / Year End Party",
          "16×8m stage, 9×4.5m main LED, two 2.5×4m wings, overhead kinetic LED ring, four round gala tables, band & dancers and 24 Beam/Katana lights."
        ],
        "Lễ hội Ngoài trời / Beerfest / Countdown": [
          "Outdoor festival / Beerfest / Countdown",
          "20×10m stage with wind-resistant truss roof, 12×5m outdoor P4.81 LED + Header Banner, Mojo barriers, FOH tower, Full Band & Audience."
        ]
      };
      const categoriesVi = { conference: 'Doanh nghiệp / Hội nghị', wedding: 'Tiệc cưới / Lãng mạn', concert: 'Nhạc hội / EDM', grand_opening: 'Khai trương / Ra mắt', gala_dinner: 'Gala / Tất niên', outdoor_festival: 'Ngoài trời / Lễ hội' };
      return { name: tr18(tpl.name, en[tpl.name]?.[0] || tpl.name), summary: tr18(tpl.summary, en[tpl.name]?.[1] || tpl.summary), category: tr18(categoriesVi[tpl.id] || tpl.category, tpl.category) };
    }

    const _templatePreviewCache18 = new Map();

    function templateConfigSignature18(kind, idOrIdx, overrides = {}) {
      if (kind === 'set') {
        const cfg = STAGE_SETS18[idOrIdx];
        return 'set:' + idOrIdx + ':' + JSON.stringify([cfg?.shell, cfg?.rigStyle, cfg?.screens, cfg?.assets, cfg?.cast]);
      }
      const tpl = VN_STAGE_TEMPLATES[idOrIdx];
      return 'tpl:' + idOrIdx + ':' + JSON.stringify([
        Number(overrides.widthM) || tpl?.widthM,
        Number(overrides.depthM) || tpl?.depthM,
        Number(overrides.heightM) || tpl?.heightM,
        Number(overrides.pitchMm) || tpl?.pitchMm,
        tpl?.truss,
        tpl?.style,
        tpl?.lightCount,
        tpl?.screens,
        tpl?.props,
        tpl?.cast
      ]);
    }

    function buildStagePreviewEntries18(kind, idOrIdx, overrides = {}) {
      const sa = S.stageAssets16;
      const entries = [];
      if (typeof window.boxMesh !== 'function' || typeof window.quadMesh !== 'function' || typeof window.M?.mm !== 'function') {
        return { entries, bounds: null, badge: '', accent: '#38bdf8', title: '' };
      }
      let shellOpts, screensCfg, propsList, castList, style, lightCount, badge, accent, title;
      if (kind === 'set') {
        const cfg = STAGE_SETS18[idOrIdx] || STAGE_SETS18[1];
        shellOpts = { ...(cfg.shell || { widthM: 18, depthM: 7, heightM: 0.6, topY: 6.6, trussMode: 'box', includePA: true }) };
        screensCfg = (cfg.screens || []).map((scr) => ({
          name: scr.name,
          pos: scr.pos.slice(),
          wM: scr.wM,
          hM: scr.hM,
          yawDeg: scr.yawDeg || 0,
          shapeType: scr.shapeType || scr.map?.shapeType || 'flat',
          curveDegPerCab: scr.curveDegPerCab ?? scr.map?.curveDegPerCab ?? 0
        }));
        propsList = (cfg.assets || []).map((a) => ({ kind: a.kind, pos: a.pos.slice(), yaw: a.yaw || 0, scale: a.scale || 1, color: a.color }));
        castList = (cfg.cast || []).map((c) => ({ ...c, pos: c.pos.slice() }));
        style = cfg.rigStyle || 'concert';
        lightCount = 16;
        badge = `${cfg.code} · ${shellOpts.widthM}×${shellOpts.depthM}m · ${screensCfg.length} LED`;
        accent = '#fbbf24';
        title = tr18(cfg.titleVi, cfg.titleEn);
      } else {
        const tpl = VN_STAGE_TEMPLATES[idOrIdx] || VN_STAGE_TEMPLATES.conference;
        const widthM = Math.max(4, Math.min(80, Number(overrides.widthM) || tpl.widthM));
        const depthM = Math.max(3, Math.min(50, Number(overrides.depthM) || tpl.depthM));
        const heightM = Math.max(0.2, Math.min(4, Number(overrides.heightM) || tpl.heightM));
        const pitchMm = Math.max(1.2, Math.min(16, Number(overrides.pitchMm) || tpl.pitchMm || 3.91));
        const scaleX = widthM / tpl.widthM;
        const scaleZ = depthM / tpl.depthM;
        let maxTopY = heightM + 4.5;
        screensCfg = (tpl.screens || []).map((scr) => {
          const wM = +(scr.wM * scaleX).toFixed(2);
          const hM = +scr.hM.toFixed(2);
          const cx = +(scr.pos[0] * scaleX).toFixed(2);
          const cy = +(heightM + hM / 2 + Math.max(0.15, scr.pos[1] - tpl.heightM - scr.hM / 2)).toFixed(2);
          const cz = +(scr.pos[2] * scaleZ).toFixed(2);
          maxTopY = Math.max(maxTopY, cy + hM / 2);
          return {
            name: scr.name,
            pos: [cx, cy, cz],
            wM,
            hM,
            yawDeg: scr.yawDeg || 0,
            shapeType: scr.shapeType || 'flat',
            curveDegPerCab: scr.curveDegPerCab || 0
          };
        });
        shellOpts = {
          widthM,
          depthM,
          heightM,
          topY: Math.max(heightM + 4.5, maxTopY + 0.55),
          trussMode: tpl.truss || 'portal',
          includePA: true
        };
        const cat = sa?.catalog || {};
        propsList = (tpl.props || []).map((p) => {
          const resolvedKind = resolveCatalogPropKind(p.kind, cat);
          const py = p.pos[1] > 0.05 ? +(heightM + Math.max(0, p.pos[1] - tpl.heightM)).toFixed(2) : 0;
          return {
            kind: resolvedKind,
            pos: [+(p.pos[0] * scaleX).toFixed(2), py, +(p.pos[2] * scaleZ).toFixed(2)],
            yaw: p.yaw || 0,
            scale: p.scale || 1
          };
        });
        castList = (tpl.cast || []).map((c) => {
          const cy = c.pos[1] > 0.05 ? +(heightM + Math.max(0, c.pos[1] - tpl.heightM)).toFixed(2) : 0;
          return {
            ...c,
            pos: [+(c.pos[0] * scaleX).toFixed(2), cy, +(c.pos[2] * scaleZ).toFixed(2)]
          };
        });
        style = tpl.style || 'concert';
        lightCount = tpl.lightCount || 16;
        badge = `${widthM}×${depthM}m · P${pitchMm} · ${screensCfg.length} LED`;
        accent = style === 'warm' ? '#fbbf24' : style === 'cool' ? '#38bdf8' : '#c084fc';
        title = templatePresentation18(tpl).name;
      }

      const shellMeshes = typeof window.buildStageShellMeshes === 'function'
        ? window.buildStageShellMeshes(shellOpts)
        : [];
      for (const m of shellMeshes) entries.push({ mesh: m, matrix: null });

      const ledAccent = style === 'warm' ? [0.98, 0.58, 0.20] : style === 'cool' ? [0.16, 0.68, 0.96] : [0.24, 0.72, 0.98];
      const ledSecondary = style === 'warm' ? [0.95, 0.32, 0.48] : style === 'cool' ? [0.22, 0.88, 0.76] : [0.76, 0.34, 0.98];
      screensCfg.forEach((scr, idx) => {
        const shape = scr.shapeType || 'flat';
        const curve = scr.curveDegPerCab || 0;
        const ry = ((scr.yawDeg || 0) * Math.PI) / 180;
        const mat = window.M.mm(window.M.translate(scr.pos), window.M.rotate([0, 1, 0], ry));
        const glow = idx % 2 === 0 ? ledAccent : ledSecondary;
        const q = (shape !== 'flat' || curve)
          ? buildGeometricLedMesh18(scr.name, scr.wM, scr.hM, shape, curve)
          : window.quadMesh(
              scr.name,
              [[-scr.wM / 2, scr.hM / 2, 0], [scr.wM / 2, scr.hM / 2, 0], [scr.wM / 2, -scr.hM / 2, 0], [-scr.wM / 2, -scr.hM / 2, 0]],
              { color: [glow[0] * 0.42, glow[1] * 0.48, glow[2] * 0.58, 1] }
            );
        if (q.material) {
          q.material.color = [glow[0] * 0.42, glow[1] * 0.48, glow[2] * 0.58, 1];
          q.material.emissive = [glow[0] * 0.52, glow[1] * 0.56, glow[2] * 0.64];
          q.material.doubleSided = true;
        }
        window.transformMesh(q, mat);
        entries.push({ mesh: q, matrix: null });

        if (shape === 'flat' && !curve) {
          const border = window.boxMesh(scr.name + '_Border', [0, 0, -0.04], [scr.wM + 0.14, scr.hM + 0.14, 0.08], [glow[0], glow[1], glow[2], 1]);
          if (border.material) border.material.emissive = [glow[0] * 0.45, glow[1] * 0.45, glow[2] * 0.45];
          window.transformMesh(border, mat);
          entries.push({ mesh: border, matrix: null });

          const innerGraphic = window.boxMesh(scr.name + '_Graphic', [0, 0, 0.02], [scr.wM * 0.66, scr.hM * 0.48, 0.02], [ledSecondary[0], ledSecondary[1], ledSecondary[2], 1]);
          if (innerGraphic.material) innerGraphic.material.emissive = [ledSecondary[0] * 0.72, ledSecondary[1] * 0.72, ledSecondary[2] * 0.72];
          window.transformMesh(innerGraphic, mat);
          entries.push({ mesh: innerGraphic, matrix: null });
        }
      });

      const fixtureCount = Math.min(12, Math.max(6, Math.round(lightCount * 0.5)));
      const spanX = shellOpts.widthM * 0.84;
      const hangY = (shellOpts.topY || 6.6) - 0.18;
      const backZ = -(shellOpts.depthM || 7) * 0.35;
      for (let i = 0; i < fixtureCount; i++) {
        const u = fixtureCount > 1 ? i / (fixtureCount - 1) - 0.5 : 0;
        const fx = +(u * spanX).toFixed(2);
        const fCol = i % 2 === 0 ? ledAccent : ledSecondary;
        const head = window.boxMesh('Fixture_' + i, [fx, hangY, backZ], [0.28, 0.34, 0.26], [fCol[0], fCol[1], fCol[2], 1]);
        if (head.material) head.material.emissive = [fCol[0] * 0.85, fCol[1] * 0.85, fCol[2] * 0.85];
        entries.push({ mesh: head, matrix: null });
      }

      if (typeof sa?.buildAssetMeshes === 'function') {
        const cat = sa.catalog || {};
        propsList.forEach((pr, idx) => {
          const spec = cat[pr.kind];
          if (!spec) return;
          const meshes = sa.buildAssetMeshes({
            id: `prev_prop_${idx}`,
            kind: pr.kind,
            name: spec.name,
            pos: pr.pos,
            yaw: pr.yaw || 0,
            scale: pr.scale || 1,
            color: pr.color || spec.color || '#38bdf8'
          });
          for (const m of meshes) entries.push({ mesh: m, matrix: null });
        });
      }

      if (typeof sa?.buildPerformerPreviewEntries16 === 'function') {
        castList.forEach((c, idx) => {
          if (c.type === 'audience') {
            if (typeof sa.getCrowdEntries16 === 'function' && typeof sa.offsetEntries16 === 'function') {
              const crowd = sa.offsetEntries16(sa.getCrowdEntries16(), c.pos || [0, 0, 5.5]);
              for (const ce of crowd) entries.push(ce);
            }
          } else {
            const pEntries = sa.buildPerformerPreviewEntries16(c.type || 'singer', {
              pos: c.pos || [0, shellOpts.heightM || 0.6, 0.8],
              color: c.color || '#38bdf8',
              phase: c.phase ?? idx * 0.45,
              time: 0.65
            });
            for (const pe of pEntries) entries.push(pe);
          }
        });
      }

      const hw = (shellOpts.widthM || 16) * 0.56;
      const hd = (shellOpts.depthM || 8) * 0.65;
      const topY = (shellOpts.topY || 6.6) + 0.4;
      return {
        entries,
        bounds: { min: [-hw, 0, -hd * 0.72], max: [hw, topY, hd * 1.15] },
        badge,
        accent,
        title
      };
    }

    function renderStageTemplatePreviewDataUrl18(kind, idOrIdx, overrides = {}, opts = {}) {
      const sa = S.stageAssets16;
      if (typeof sa?.renderMeshes3DToCanvas16 !== 'function' || typeof document === 'undefined') {
        return kind === 'set' ? `./assets/templates/s${idOrIdx}.webp` : `./assets/templates/${idOrIdx}.webp`;
      }
      const sig = templateConfigSignature18(kind, idOrIdx, overrides) + ':' + (opts.width || 480) + 'x' + (opts.height || 270);
      if (!opts.force && _templatePreviewCache18.has(sig)) {
        return _templatePreviewCache18.get(sig);
      }
      const scene = buildStagePreviewEntries18(kind, idOrIdx, overrides);
      const cvs = document.createElement('canvas');
      cvs.width = opts.width || 480;
      cvs.height = opts.height || 270;
      sa.renderMeshes3DToCanvas16(cvs, scene.entries, {
        yaw: opts.yaw ?? 0.26,
        pitch: opts.pitch ?? 0.22,
        zoom: opts.zoom ?? 1.52,
        fovScale: opts.fovScale ?? 1.18,
        maxTris: opts.maxTris || 60000,
        fixedBounds: scene.bounds,
        badge: scene.badge,
        accent: scene.accent,
        title: scene.title,
        noURL: true
      });
      let dataUrl = '';
      try {
        dataUrl = cvs.toDataURL('image/webp', 0.9);
        if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
          dataUrl = cvs.toDataURL('image/png');
        }
      } catch (_) {
        dataUrl = kind === 'set' ? `./assets/templates/s${idOrIdx}.webp` : `./assets/templates/${idOrIdx}.webp`;
      }
      if (dataUrl) {
        _templatePreviewCache18.set(sig, dataUrl);
        if (kind === 'set' && STAGE_SETS18[idOrIdx] && !Object.keys(overrides).length) {
          STAGE_SETS18[idOrIdx].runtimePreviewUrl18 = dataUrl;
        } else if (kind === 'tpl' && VN_STAGE_TEMPLATES[idOrIdx] && !Object.keys(overrides).length) {
          VN_STAGE_TEMPLATES[idOrIdx].runtimePreviewUrl18 = dataUrl;
        }
      }
      return dataUrl;
    }

    function refreshTemplateModalPreviews18(overrides = {}) {
      if (typeof document === 'undefined') return;
      document.querySelectorAll?.('[data-lumi18-tpl-img]')?.forEach((img) => {
        const tplId = img.getAttribute('data-lumi18-tpl-img');
        if (!tplId || !VN_STAGE_TEMPLATES[tplId]) return;
        const url = renderStageTemplatePreviewDataUrl18('tpl', tplId, overrides);
        if (url) {
          img.src = url;
          img.setAttribute('data-lumi18-preview', url);
        }
      });
      document.querySelectorAll?.('[data-lumi18-set-img]')?.forEach((img) => {
        const setIdx = Number(img.getAttribute('data-lumi18-set-img') || 0);
        if (!STAGE_SETS18[setIdx]) return;
        const url = renderStageTemplatePreviewDataUrl18('set', setIdx);
        if (url) {
          img.src = url;
          img.setAttribute('data-lumi18-preview', url);
        }
      });
    }

    function openStageTemplatesModal() {
      if (typeof window.dialog !== 'function') return;
      const thumbStyle = 'width:128px;height:72px;object-fit:cover;border-radius:6px;border:1px solid rgba(148,163,184,0.28);flex-shrink:0;cursor:zoom-in;background:#070c18';
      const cardsHtml = Object.values(VN_STAGE_TEMPLATES)
        .map((tpl) => {
          const pres = templatePresentation18(tpl);
          const previewSrc = tpl.runtimePreviewUrl18 || tpl.previewWebp || `./assets/templates/${tpl.id}.webp`;
          return (
            `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;border-left:3px solid #38bdf8">` +
            `<img src="${esc18(previewSrc)}" alt="${esc18(pres.name)}" loading="lazy" decoding="async" data-lumi18-tpl-img="${esc18(tpl.id)}" data-lumi18-preview="${esc18(previewSrc)}" data-lumi18-preview-title="${esc18(pres.name)}" style="${thumbStyle}" title="${esc18(tr18('Nhấn để phóng to hình review (.webp)', 'Click to zoom review image (.webp)'))}">` +
            `<div style="flex:1;min-width:0"><strong>${esc18(pres.name)}</strong> <small style="color:#38bdf8">[${esc18(pres.category)} · ${tpl.widthM}×${tpl.depthM}m · P${tpl.pitchMm}]</small><br>` +
            `<small style="display:block;margin-top:2px;line-height:1.35">${esc18(pres.summary)}</small></div>` +
            `<button type="button" class="btn small primary" data-lumi18-tpl="${esc18(tpl.id)}">${tr18("Dựng 3D", "Build 3D")}</button>` +
            `</div>`
          );
        })
        .join('');
      const stageSetsHtml = [1, 2, 3, 4, 5, 6]
        .map((n) => {
          const cfg = STAGE_SETS18[n];
          if (!cfg) return '';
          const title = tr18(cfg.titleVi, cfg.titleEn);
          const desc = tr18(cfg.descVi || cfg.titleVi, cfg.descEn || cfg.titleEn);
          const previewSrc = cfg.runtimePreviewUrl18 || cfg.previewWebp || `./assets/templates/s${n}.webp`;
          return (
            `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;border-left:3px solid #f59e0b">` +
            `<img src="${esc18(previewSrc)}" alt="${esc18(title)}" loading="lazy" decoding="async" data-lumi18-set-img="${n}" data-lumi18-preview="${esc18(previewSrc)}" data-lumi18-preview-title="${esc18(title)}" style="${thumbStyle}" title="${esc18(tr18('Nhấn để phóng to hình review (.webp)', 'Click to zoom review image (.webp)'))}">` +
            `<div style="flex:1;min-width:0"><strong>${esc18(cfg.code)} · ${esc18(title)}</strong> ` +
            `<small style="color:#fbbf24">[${esc18(`${cfg.shell?.widthM || 18}×${cfg.shell?.depthM || 7}m · ${cfg.screens?.length || 3} LED`)}]</small><br>` +
            `<small style="display:block;margin-top:2px;line-height:1.35">${esc18(desc)}</small></div>` +
            `<button type="button" class="btn small primary" data-lumi18-stageset="${n}">${tr18('Dựng ' + cfg.code, 'Build ' + cfg.code)}</button>` +
            `</div>`
          );
        })
        .join('');

      const paramHtml =
        `<div style="max-height:500px;overflow:auto;padding-right:4px">` +
        `<div id="lumi18TplLightbox" style="display:none;margin-bottom:10px;padding:8px;background:rgba(7,12,24,0.95);border:1px solid rgba(56,189,248,0.45);border-radius:8px;text-align:center">` +
        `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><strong id="lumi18TplLightboxTitle" style="font-size:var(--fs-sm);color:#38bdf8"></strong><button type="button" class="btn small" id="lumi18TplLightboxClose">${tr18('Thu gọn ảnh', 'Close preview')}</button></div>` +
        `<img id="lumi18TplLightboxImg" src="" alt="" style="max-width:100%;max-height:240px;border-radius:6px;border:1px solid rgba(148,163,184,0.25)">` +
        `</div>` +
        `<div style="font-size:var(--fs-sm);font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:.04em;margin:2px 0 6px">${tr18('6 Mẫu Sân Khấu Sự Kiện Việt Nam (Tuỳ chỉnh Kích thước & Pixel Pitch)', '6 Vietnamese Event Stage Templates (Customizable Size & Pixel Pitch)')}</div>` +
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
        cardsHtml +
        `<div style="font-size:var(--fs-sm);font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:.04em;margin:12px 0 6px">${tr18('Bộ Sân Khấu Dựng Sẵn S1–S6 (Kèm Hệ Đèn DMX & Pháo SFX)', 'Preset Stage Sets S1–S6 (With DMX Lighting & Pyro SFX)')}</div>` +
        stageSetsHtml +
        `</div>`;

      window.dialog(tr18('Mẫu Sân Khấu Sự Kiện Việt Nam & Bộ Set S1–S6', 'Vietnamese Event Stage Templates & S1–S6 Preset Sets'), paramHtml, [{ label: tr18('Đóng', 'Close') }]);
      $('modal')?.classList?.add('pro-wide');
      document.querySelectorAll?.('[data-lumi18-preview]')?.forEach((img) => {
        img.onclick = () => {
          const box = $('lumi18TplLightbox');
          const big = $('lumi18TplLightboxImg');
          const lbl = $('lumi18TplLightboxTitle');
          if (!box || !big) return;
          big.src = img.getAttribute('data-lumi18-preview') || '';
          big.alt = img.getAttribute('data-lumi18-preview-title') || '';
          if (lbl) lbl.textContent = big.alt;
          box.style.display = 'block';
          box.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
        };
      });
      const closePreviewBtn = $('lumi18TplLightboxClose');
      if (closePreviewBtn) {
        closePreviewBtn.onclick = () => {
          const box = $('lumi18TplLightbox');
          if (box) box.style.display = 'none';
        };
      }
      document.querySelectorAll?.('[data-lumi18-stageset]')?.forEach((btn) => {
        btn.onclick = () => {
          const setIdx = Number(btn.getAttribute('data-lumi18-stageset') || 0);
          const modal = $('modal');
          if (modal && typeof modal.close === 'function') modal.close();
          if (setIdx >= 1 && setIdx <= 6) applyStageSet18(setIdx);
        };
      });
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
      const readModalOverrides = () => ({
        widthM: Number($('lumi18TplW')?.value || 0) || undefined,
        depthM: Number($('lumi18TplD')?.value || 0) || undefined,
        heightM: Number($('lumi18TplH')?.value || 0) || undefined,
        pitchMm: Number($('lumi18TplPitch')?.value || 0) || undefined
      });
      ['lumi18TplW', 'lumi18TplD', 'lumi18TplH', 'lumi18TplPitch'].forEach((id) => {
        const el = $(id);
        if (!el) return;
        const onParamChange = () => refreshTemplateModalPreviews18(readModalOverrides());
        el.addEventListener('change', onParamChange);
        el.addEventListener('input', onParamChange);
      });
      setTimeout(() => refreshTemplateModalPreviews18(readModalOverrides()), 16);
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

    function setAiEnabled18(enabled) {
      lumiState.aiEnabled = Boolean(enabled);
      const ai = $('aiChat18Toggle');
      if (ai) {
        ai.hidden = !lumiState.aiEnabled;
        ai.disabled = !lumiState.aiEnabled;
        ai.style.display = lumiState.aiEnabled ? '' : 'none';
      }
      if (!lumiState.aiEnabled) closeAiChat18();
      return lumiState.aiEnabled;
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
        `<div><small>${tr18("Tổng diện tích LED", "Total LED area")}</small><br><strong>${s.totalLedAreaM2} m² (${s.totalCabinets500} cab)</strong><br><small>Moiré ≥ ${s.engineeringRider?.broadcastOptics?.minMoireDistanceM || 3.5}m · ${s.engineeringRider?.logistics?.flightCases || 0} cases</small></div>` +
        `<div><small>${tr18("Xử lý điểm ảnh", "Pixel processing")}</small><br><strong>${(s.totalPixels / 1e6).toFixed(2)}M px (${s.rj45PortsNeeded} ${tr18("cổng", "ports")})</strong></div>` +
        `<div><small>${tr18("Tải điện 3 pha 380V", "380V three-phase load")}</small><br><strong>${s.totalMaxKw} kW (L1:${s.engineeringRider?.phaseLoadAmps?.L1 || s.currentPerPhaseAmps}A · L2:${s.engineeringRider?.phaseLoadAmps?.L2 || s.currentPerPhaseAmps}A · L3:${s.engineeringRider?.phaseLoadAmps?.L3 || s.currentPerPhaseAmps}A)</strong><br><small>${s.engineeringRider?.powercon20ACircuits || 1} ${tr18("lộ PowerCON 20A", "PowerCON 20A circuits")} · ΔV ${s.engineeringRider?.power3Phase?.voltageDropPercent || 0}% · ${s.engineeringRider?.recommendedBreaker || 'MCCB 3P'}</small></div>` +
        `<div><small>${tr18("Tải treo & Kết cấu", "Rigging & structure")}</small><br><strong>~${s.totalRiggingWeightKg} kg · ${s.engineeringRider?.hangingBars || 0} ${tr18("thanh treo", "hanging bars")}</strong><br><small>δ ${s.engineeringRider?.rigging?.deflectionMm || 0} mm · ${tr18("Đối trọng stack:", "Ground ballast:")} ~${s.engineeringRider?.ballastKg || 0} kg</small></div>` +
        `</div>` +
        (s.structureSvg ? `<div>${s.structureSvg}</div>` : '') +
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
        `<button type="button" class="btn small" id="lumi18ExportDmxCsvBtn">${tr18("Bảng Patch DMX (CSV)", "DMX patch table (CSV)")}</button>` +
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
      const dmxCsvBtn = $('lumi18ExportDmxCsvBtn');
      if (dmxCsvBtn) dmxCsvBtn.onclick = () => S.exportDmxPatchCsv?.();

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
        const sec = String(cue.section || '').toLowerCase();
        const fanLaw = sec === 'intro' ? 'v_converge' : sec === 'verse' ? 'parallel_wing' : sec === 'build' ? 'x_cross' : sec === 'drop' ? 'v_diverge' : 'parallel_zero';
        const parMode = sec === 'intro' ? 'carousel' : sec === 'verse' ? 'mirror_domino' : sec === 'build' ? 'dual_carousel' : sec === 'drop' ? 'gala_sparkle' : 'static';
        const total = eng.lights.length;
        const tCue = Number(cue.startSec) || 0;
        eng.lights.forEach((l, i) => {
          l.color = cue.lightColor || l.color;
          l.fx = cue.lightFx || 'steady';
          l.power = +(4.8 * scale).toFixed(2);
          const cat = classifyFixture18(l, i, total);
          l.beamProfile18 = cat === 'spot' ? 1 : cat === 'wash' || cat === 'fresnel' ? 2 : cat === 'par' ? 3 : cat === 'bar' ? 4 : 0;
          if (cat === 'par') {
            const ch = evalParChaseEngine18(i, total, tCue, 2.0, parMode);
            l.coneLenScale18 = ch.coneLenScale;
          } else if ((cat === 'beam' || cat === 'spot') && Array.isArray(l.pos) && Array.isArray(l.target)) {
            const fl = evalBeamFanLaw18(fanLaw, l.pos[0] || 0, i, total, tCue, 2.0, 0.65);
            l.target = [
              +(l.pos[0] + Math.sin(fl.panAngle) * 5.2).toFixed(2),
              l.target[1],
              l.target[2]
            ];
          }
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
      const aiToggle = $('aiChat18Toggle');
      if (aiToggle) {
        aiToggle.title = tr18('Trợ lý AI · Ctrl+I', 'AI assistant · Ctrl+I');
        aiToggle.setAttribute('aria-label', aiToggle.title);
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
      document.title = 'Creative LED Studio';
      const brandTitle = document.querySelector?.('.topbar .brand strong');
      if (brandTitle) brandTitle.innerHTML = '<span class="brand-creative">Creative</span> <span class="brand-studio">LED Studio</span>';
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
        ai.id = 'aiChat18Toggle'; ai.type = 'button'; ai.className = 'icon-btn ai-toggle-btn';
        ai.title = tr18('Trợ lý AI · Ctrl+I', 'AI assistant · Ctrl+I');
        ai.setAttribute('aria-label', ai.title); ai.setAttribute('aria-controls', 'aiChat18'); ai.setAttribute('aria-expanded', 'false');
        ai.innerHTML = ico18('bot') + '<span class="ai18-toggle-badge">AI</span>';
        ai.hidden = !lumiState.aiEnabled;
        ai.disabled = !lumiState.aiEnabled;
        ai.style.display = lumiState.aiEnabled ? '' : 'none';
        ai.onclick = () => { if (lumiState.aiEnabled) openStageAiModal(); };
        actions.prepend(ai);
        document.addEventListener('keydown', e => { if (lumiState.aiEnabled && e.ctrlKey && e.key.toLowerCase() === 'i' && !S.cloud16?.isClientReviewMode?.()) { e.preventDefault(); openStageAiModal(); } });
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
      installLmpToolbox18();
      seedDefaultStageDemo18(true);
    }

    function buildGeometricLedMesh18(name, wM, hM, shapeType = 'flat', curveDegPerCab = 0) {
      const makeM = window.makeMesh;
      if (typeof makeM !== 'function' || (shapeType === 'flat' && !curveDegPerCab)) {
        return window.quadMesh(
          name,
          [
            [-wM / 2, hM / 2, 0],
            [wM / 2, hM / 2, 0],
            [wM / 2, -hM / 2, 0],
            [-wM / 2, -hM / 2, 0]
          ],
          { color: [0.04, 0.05, 0.08, 1] }
        );
      }
      const p = [];
      const uv = [];
      const pushQuad = (x0, z0, x1, z1, u0, u1) => {
        const yT = hM / 2;
        const yB = -hM / 2;
        p.push(
          x0, yT, z0, x1, yT, z1, x1, yB, z1,
          x0, yT, z0, x1, yB, z1, x0, yB, z0
        );
        uv.push(
          u0, 0, u1, 0, u1, 1,
          u0, 0, u1, 1, u0, 1
        );
      };
      if (shapeType === 'l_corner_90') {
        const w1 = wM * 0.65;
        const w2 = wM * 0.35;
        const xCorner = w1 / 2;
        pushQuad(-w1 / 2, 0, xCorner, 0, 0, 0.65);
        pushQuad(xCorner, 0, xCorner, w2, 0.65, 1);
      } else if (shapeType === 'cube') {
        const side = Math.max(0.5, wM / 4);
        const r = side / 2;
        pushQuad(-r, r, r, r, 0, 0.25);
        pushQuad(r, r, r, -r, 0.25, 0.5);
        pushQuad(r, -r, -r, -r, 0.5, 0.75);
        pushQuad(-r, -r, -r, r, 0.75, 1);
      } else if (shapeType === 'cylinder_360') {
        const segs = 20;
        const rad = Math.max(0.4, wM / (Math.PI * 2));
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * Math.PI * 2;
          const a1 = ((i + 1) / segs) * Math.PI * 2;
          pushQuad(Math.sin(a0) * rad, Math.cos(a0) * rad, Math.sin(a1) * rad, Math.cos(a1) * rad, i / segs, (i + 1) / segs);
        }
      } else {
        const segs = 12;
        const totalDeg = clamp18((curveDegPerCab || -5) * Math.max(2, Math.round(wM * 2)), -120, 120);
        const totalRad = (totalDeg * Math.PI) / 180;
        const rad = Math.abs(totalRad) > 0.02 ? wM / Math.abs(totalRad) : 100;
        const sign = totalRad < 0 ? 1 : -1;
        for (let i = 0; i < segs; i++) {
          const u0 = i / segs;
          const u1 = (i + 1) / segs;
          const a0 = (u0 - 0.5) * Math.abs(totalRad);
          const a1 = (u1 - 0.5) * Math.abs(totalRad);
          const x0 = Math.sin(a0) * rad;
          const z0 = (1 - Math.cos(a0)) * rad * sign;
          const x1 = Math.sin(a1) * rad;
          const z1 = (1 - Math.cos(a1)) * rad * sign;
          pushQuad(x0, z0, x1, z1, u0, u1);
        }
      }
      return makeM(name, p, uv, null, { color: [0.04, 0.05, 0.08, 1] });
    }

    const STAGE_SETS18 = {
      1: {
        id: 1,
        code: 'S1',
        shortVi: 'S1 Live',
        shortEn: 'S1 Live',
        titleVi: 'Set 1 · Sân khấu Live Concert',
        titleEn: 'Set 1 · Live Concert Stage',
        descVi: 'Sân khấu 19×7m, LED chính 9×4.5m + 2 LED cánh, bục ban nhạc Live Band (Ca sĩ, Guitar, Keyboard, Trống), loa Sub, rào Mojo & trạm FOH.',
        descEn: '19×7m stage, 9×4.5m main LED + 2 wings, Live Band riser (Singer, Guitar, Keyboard, Drums), subwoofers, Mojo barriers & FOH booth.',
        previewWebp: './assets/templates/s1.webp',
        shell: { widthM: 19, depthM: 7, heightM: 0.6, topY: 6.6, trussMode: 'box', includePA: true },
        rigStyle: 'concert',
        screens: [
          { name: 'LED_MAIN', pos: [0, 3.05, -2.1], wM: 9.0, hM: 4.5, yawDeg: 0, map: { x: 960, y: 160, w: 1920, h: 960, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40', rows500x1000: 4, rows500x500: 1, shapeType: 'flat' } },
          { name: 'LED_WING_L', pos: [-6.25, 3.05, -1.65], wM: 2.5, hM: 4.5, yawDeg: 10, map: { x: 320, y: 160, w: 520, h: 960, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } },
          { name: 'LED_WING_R', pos: [6.25, 3.05, -1.65], wM: 2.5, hM: 4.5, yawDeg: -10, map: { x: 3000, y: 160, w: 520, h: 960, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } }
        ],
        assets: [
          { kind: 'stage_riser', pos: [0, 0.6, -0.7], yaw: 0 },
          { kind: 'sub_stack', pos: [-7.2, 0, 3.45], yaw: 8 },
          { kind: 'sub_stack', pos: [7.2, 0, 3.45], yaw: -8 },
          { kind: 'crowd_barrier', pos: [-5.2, 0, 4.35], yaw: 0 },
          { kind: 'crowd_barrier', pos: [-3.1, 0, 4.35], yaw: 0 },
          { kind: 'crowd_barrier', pos: [3.1, 0, 4.35], yaw: 0 },
          { kind: 'crowd_barrier', pos: [5.2, 0, 4.35], yaw: 0 },
          { kind: 'foh_control_booth', pos: [0, 0, 9.2], yaw: 0 }
        ],
        cast: [
          { type: 'singer', pos: [0, 0.6, 1.35], color: '#ff5d8f', model18: 'stage-singer' },
          { type: 'guitarist', pos: [-2.35, 0.6, 0.55], color: '#45d4ff', model18: 'stage-guitarist' },
          { type: 'keyboardist', pos: [2.35, 0.6, 0.55], color: '#ffc857', model18: 'stage-keyboardist' },
          { type: 'drummer', pos: [0, 1.2, -0.7], color: '#9b7bff', model18: 'stage-drummer' },
          { type: 'audience', pos: [-3.8, 0, 6.8], yaw: 180, count: 36, columns: 9, spacing: 0.65, phase: 0, color: '#33677f' },
          { type: 'audience', pos: [3.8, 0, 6.8], yaw: 180, count: 36, columns: 9, spacing: 0.65, phase: 1.8, color: '#803f65' },
          { type: 'audience', pos: [0, 0, 8.6], yaw: 180, count: 27, columns: 9, spacing: 0.65, phase: 3.6, color: '#345852' }
        ]
      },
      2: {
        id: 2,
        code: 'S2',
        shortVi: 'S2 EDM',
        shortEn: 'S2 EDM',
        titleVi: 'Set 2 · Sân khấu Lễ hội EDM & DJ',
        titleEn: 'Set 2 · EDM DJ Festival Stage',
        descVi: 'Sân khấu 21×7.5m, LED chính 10×4.5m + 2 cánh + Header, bàn DJ trung tâm, vòng Kinetic Ring, 4 súng CO2, DJ & vũ công LED.',
        descEn: '21×7.5m stage, 10×4.5m main LED + 2 wings + Header, central DJ booth, Kinetic Ring, 4 CO2 jets, DJ & LED dancers.',
        previewWebp: './assets/templates/s2.webp',
        shell: { widthM: 21, depthM: 7.5, heightM: 0.6, topY: 7.0, trussMode: 'box', includePA: true },
        rigStyle: 'concert',
        screens: [
          { name: 'LED_MAIN', pos: [0, 3.05, -2.2], wM: 10.0, hM: 4.5, yawDeg: 0, map: { x: 960, y: 160, w: 1920, h: 960, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40', rows500x1000: 4, rows500x500: 1, shapeType: 'flat' } },
          { name: 'LED_WING_L', pos: [-7.1, 3.05, -1.5], wM: 3.0, hM: 4.5, yawDeg: 16, map: { x: 240, y: 160, w: 600, h: 960, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } },
          { name: 'LED_WING_R', pos: [7.1, 3.05, -1.5], wM: 3.0, hM: 4.5, yawDeg: -16, map: { x: 3000, y: 160, w: 600, h: 960, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } },
          { name: 'LED_HEADER', pos: [0, 6.0, -1.8], wM: 10.0, hM: 1.0, yawDeg: 0, map: { x: 960, y: 0, w: 1920, h: 140, cabinetModelId: 'unilumin_ugm2_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } }
        ],
        assets: [
          { kind: 'dj_booth', pos: [0, 0.6, 0.45], yaw: 0 },
          { kind: 'kinetic_ring', pos: [0, 1.8, 0.45], yaw: 0 },
          { kind: 'sub_stack', pos: [-7.8, 0, 3.7], yaw: 10 },
          { kind: 'sub_stack', pos: [7.8, 0, 3.7], yaw: -10 },
          { kind: 'crowd_barrier', pos: [-5.4, 0, 4.6], yaw: 0 },
          { kind: 'crowd_barrier', pos: [-3.2, 0, 4.6], yaw: 0 },
          { kind: 'crowd_barrier', pos: [3.2, 0, 4.6], yaw: 0 },
          { kind: 'crowd_barrier', pos: [5.4, 0, 4.6], yaw: 0 },
          { kind: 'co2_jet', pos: [-3.6, 0.6, 2.5], yaw: 0 },
          { kind: 'co2_jet', pos: [-1.4, 0.6, 2.5], yaw: 0 },
          { kind: 'co2_jet', pos: [1.4, 0.6, 2.5], yaw: 0 },
          { kind: 'co2_jet', pos: [3.6, 0.6, 2.5], yaw: 0 }
        ],
        cast: [
          { type: 'dj', pos: [0, 0.6, -0.15], color: '#22d3ee', model18: 'stage-dj' },
          { type: 'leddancer', pos: [-2.8, 0.6, 1.25], color: '#38bdf8', model18: 'stage-led-dancer' },
          { type: 'leddancer', pos: [2.8, 0.6, 1.25], color: '#a855f7', model18: 'stage-led-dancer' },
          { type: 'audience', pos: [-4.2, 0, 7.1], yaw: 180, count: 48, columns: 10, spacing: 0.62, phase: 0, color: '#22d3ee' },
          { type: 'audience', pos: [4.2, 0, 7.1], yaw: 180, count: 48, columns: 10, spacing: 0.62, phase: 2.1, color: '#a855f7' }
        ]
      },
      3: {
        id: 3,
        code: 'S3',
        shortVi: 'S3 Conf',
        shortEn: 'S3 Conf',
        titleVi: 'Set 3 · Sân khấu Hội nghị & Keynote',
        titleEn: 'Set 3 · Conference & Keynote Stage',
        descVi: 'Sân khấu 17×6.2m, LED Widescreen 10×3.5m + 2 cánh, bục VIP phát biểu, bàn đại biểu IBM, chậu cảnh trang trí & MC.',
        descEn: '17×6.2m stage, 10×3.5m widescreen LED + 2 wings, VIP podium, IBM delegate tables, decorative planters & Keynote Host.',
        previewWebp: './assets/templates/s3.webp',
        shell: { widthM: 17, depthM: 6.2, heightM: 0.55, topY: 6.2, trussMode: 'portal', includePA: true },
        rigStyle: 'cool',
        screens: [
          { name: 'LED_MAIN', pos: [0, 2.55, -1.85], wM: 10.0, hM: 3.5, yawDeg: 0, map: { x: 820, y: 180, w: 2200, h: 780, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40', rows500x1000: 3, rows500x500: 1, shapeType: 'flat' } },
          { name: 'LED_WING_L', pos: [-6.3, 2.55, -1.35], wM: 2.0, hM: 3.5, yawDeg: 14, map: { x: 240, y: 180, w: 480, h: 780, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } },
          { name: 'LED_WING_R', pos: [6.3, 2.55, -1.35], wM: 2.0, hM: 3.5, yawDeg: -14, map: { x: 3120, y: 180, w: 480, h: 780, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } }
        ],
        assets: [
          { kind: 'vip_podium', pos: [2.8, 0.55, 1.15], yaw: -12 },
          { kind: 'conference_ibm_table', pos: [-3.2, 0, 5.2], yaw: 0 },
          { kind: 'conference_ibm_table', pos: [3.2, 0, 5.2], yaw: 0 },
          { kind: 'decor_palm_planter', pos: [-6.6, 0.55, 1.5], yaw: 0 },
          { kind: 'decor_palm_planter', pos: [6.6, 0.55, 1.5], yaw: 0 }
        ],
        cast: [
          { type: 'mc', pos: [0.4, 0.55, 1.2], color: '#38bdf8', model18: 'stage-host' }
        ]
      },
      4: {
        id: 4,
        code: 'S4',
        shortVi: 'S4 Gala',
        shortEn: 'S4 Gala',
        titleVi: 'Set 4 · Sân khấu Gala Dinner & Trao giải',
        titleEn: 'Set 4 · Gala Dinner & Awards Stage',
        descVi: 'Sân khấu 18×6.8m kèm đường dẫn Catwalk, LED cong 9×4m + 2 cánh, bàn tiệc Gala tròn, 4 máy pháo điện lạnh, MC, Violin & Saxophone.',
        descEn: '18×6.8m stage with Catwalk runway, curved 9×4m LED + 2 wings, round Gala tables, 4 cold spark machines, Host, Violin & Saxophone.',
        previewWebp: './assets/templates/s4.webp',
        shell: { widthM: 18, depthM: 6.8, heightM: 0.6, topY: 6.5, trussMode: 'portal', includePA: true },
        rigStyle: 'warm',
        screens: [
          { name: 'LED_MAIN', pos: [0, 2.8, -1.9], wM: 9.0, hM: 4.0, yawDeg: 0, shapeType: 'flat', curveDegPerCab: -4, map: { x: 960, y: 160, w: 1920, h: 880, cabinetModelId: 'roe_cb5_1000', processorModelId: 'brompton_sx40', shapeType: 'flat', curveDegPerCab: -4 } },
          { name: 'LED_WING_L', pos: [-6.0, 2.8, -1.4], wM: 2.0, hM: 4.0, yawDeg: 16, map: { x: 320, y: 160, w: 480, h: 880, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } },
          { name: 'LED_WING_R', pos: [6.0, 2.8, -1.4], wM: 2.0, hM: 4.0, yawDeg: -16, map: { x: 3040, y: 160, w: 480, h: 880, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } }
        ],
        assets: [
          { kind: 'catwalk_runway', pos: [0, 0, 4.8], yaw: 0 },
          { kind: 'vip_podium', pos: [-3.2, 0.6, 1.2], yaw: 12 },
          { kind: 'gala_round_table', pos: [-4.4, 0, 6.2], yaw: 0 },
          { kind: 'gala_round_table', pos: [4.4, 0, 6.2], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [-4.2, 0.6, 2.4], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [-1.8, 0.6, 2.4], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [1.8, 0.6, 2.4], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [4.2, 0.6, 2.4], yaw: 0 }
        ],
        cast: [
          { type: 'mc', pos: [0, 0.6, 1.4], color: '#fbbf24', model18: 'stage-host' },
          { type: 'violinist', pos: [-1.8, 0.6, 0.5], color: '#f472b6', model18: 'stage-violinist' },
          { type: 'saxophonist', pos: [1.8, 0.6, 0.5], color: '#60a5fa', model18: 'stage-saxophonist' }
        ]
      },
      5: {
        id: 5,
        code: 'S5',
        shortVi: 'S5 Open',
        shortEn: 'S5 Open',
        titleVi: 'Set 5 · Sân khấu Lễ Khai mạc & Nghệ thuật',
        titleEn: 'Set 5 · Grand Opening & Cultural Stage',
        descVi: 'Sân khấu 18×6.8m, LED chính 8.5×4.5m + 2 cánh, cổng vòm LED Arch Gate, 2 cột Totem LED, Trống nước & Múa quạt nghệ thuật.',
        descEn: '18×6.8m stage, 8.5×4.5m main LED + 2 wings, LED Arch Gate, 2 LED totems, Water Drummers & Cultural Fan Dancers.',
        previewWebp: './assets/templates/s5.webp',
        shell: { widthM: 18, depthM: 6.8, heightM: 0.6, topY: 6.6, trussMode: 'portal', includePA: true },
        rigStyle: 'warm',
        screens: [
          { name: 'LED_MAIN', pos: [0, 3.05, -2.1], wM: 8.5, hM: 4.5, yawDeg: 0, map: { x: 960, y: 160, w: 1920, h: 960, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40', rows500x1000: 4, rows500x500: 1, shapeType: 'flat' } },
          { name: 'LED_WING_L', pos: [-6.0, 3.05, -1.6], wM: 2.5, hM: 4.5, yawDeg: 14, map: { x: 320, y: 160, w: 520, h: 960, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } },
          { name: 'LED_WING_R', pos: [6.0, 3.05, -1.6], wM: 2.5, hM: 4.5, yawDeg: -14, map: { x: 3000, y: 160, w: 520, h: 960, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } }
        ],
        assets: [
          { kind: 'led_arch_gate', pos: [0, 0.6, -0.4], yaw: 0 },
          { kind: 'vip_podium', pos: [0, 0.6, 1.55], yaw: 0 },
          { kind: 'totem_led', pos: [-4.4, 0.6, 0.6], yaw: 12 },
          { kind: 'totem_led', pos: [4.4, 0.6, 0.6], yaw: -12 },
          { kind: 'cold_spark_fountain', pos: [-2.8, 0.6, 2.4], yaw: 0 },
          { kind: 'cold_spark_fountain', pos: [2.8, 0.6, 2.4], yaw: 0 }
        ],
        cast: [
          { type: 'waterdrummer', pos: [-2.1, 0.6, 0.8], color: '#38bdf8', model18: 'stage-water-drummer' },
          { type: 'waterdrummer', pos: [2.1, 0.6, 0.8], color: '#38bdf8', model18: 'stage-water-drummer' },
          { type: 'fandancer', pos: [-3.5, 0.6, 1.4], color: '#fb7185', model18: 'stage-fan-dancer' },
          { type: 'fandancer', pos: [3.5, 0.6, 1.4], color: '#fb7185', model18: 'stage-fan-dancer' },
          { type: 'audience', pos: [-3.6, 0, 6.5], yaw: 180, count: 36, columns: 9, spacing: 0.65, phase: 0, color: '#33677f' },
          { type: 'audience', pos: [3.6, 0, 6.5], yaw: 180, count: 36, columns: 9, spacing: 0.65, phase: 2.0, color: '#803f65' }
        ]
      },
      6: {
        id: 6,
        code: 'S6',
        shortVi: 'S6 Arena',
        shortEn: 'S6 Arena',
        titleVi: 'Set 6 · Sân khấu Đại nhạc hội Arena Tour',
        titleEn: 'Set 6 · Arena Tour 360° Stage',
        descVi: 'Sân khấu 22×8m kèm Catwalk, LED chính 10×4.5m + 2 cánh + Khối LED Cube 4 mặt treo trần, 4 máy phun lửa DMX, Rapper, DJ & Vũ công Laser.',
        descEn: '22×8m stage with Catwalk, 10×4.5m main LED + 2 wings + overhead 4-face LED Cube, 4 DMX flame jets, Rapper, DJ & Laser Dancers.',
        previewWebp: './assets/templates/s6.webp',
        shell: { widthM: 22, depthM: 8.0, heightM: 0.65, topY: 7.4, trussMode: 'box', includePA: true },
        rigStyle: 'concert',
        screens: [
          { name: 'LED_MAIN', pos: [0, 3.1, -2.4], wM: 10.0, hM: 4.5, yawDeg: 0, map: { x: 960, y: 160, w: 1920, h: 960, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40', rows500x1000: 4, rows500x500: 1, shapeType: 'flat' } },
          { name: 'LED_WING_L', pos: [-7.3, 3.1, -1.7], wM: 3.0, hM: 4.5, yawDeg: 18, map: { x: 240, y: 160, w: 600, h: 960, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } },
          { name: 'LED_WING_R', pos: [7.3, 3.1, -1.7], wM: 3.0, hM: 4.5, yawDeg: -18, map: { x: 3000, y: 160, w: 600, h: 960, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat' } },
          { name: 'LED_CUBE_CENTER', pos: [0, 5.4, 0.6], wM: 6.0, hM: 1.5, yawDeg: 25, shapeType: 'cube', map: { x: 1280, y: 0, w: 1280, h: 150, cabinetModelId: 'absen_pl25_500', processorModelId: 'brompton_s8', shapeType: 'cube' } }
        ],
        assets: [
          { kind: 'catwalk_runway', pos: [0, 0, 5.4], yaw: 0 },
          { kind: 'stage_riser', pos: [0, 0.65, -0.9], yaw: 0 },
          { kind: 'dj_booth', pos: [0, 1.25, -0.9], yaw: 0 },
          { kind: 'sub_stack', pos: [-8.2, 0, 3.95], yaw: 8 },
          { kind: 'sub_stack', pos: [8.2, 0, 3.95], yaw: -8 },
          { kind: 'foh_control_booth', pos: [0, 0, 10.2], yaw: 0 },
          { kind: 'flame_jet', pos: [-5.2, 0.65, 2.6], yaw: 0 },
          { kind: 'flame_jet', pos: [-2.2, 0.65, 2.6], yaw: 0 },
          { kind: 'flame_jet', pos: [2.2, 0.65, 2.6], yaw: 0 },
          { kind: 'flame_jet', pos: [5.2, 0.65, 2.6], yaw: 0 }
        ],
        cast: [
          { type: 'rapper', pos: [0, 0.65, 1.6], color: '#f97316', model18: 'stage-rapper' },
          { type: 'dj', pos: [0, 1.25, -1.35], color: '#22d3ee', model18: 'stage-dj' },
          { type: 'laserdancer', pos: [-3.0, 0.65, 1.1], color: '#10b981', model18: 'stage-laser-dancer' },
          { type: 'laserdancer', pos: [3.0, 0.65, 1.1], color: '#10b981', model18: 'stage-laser-dancer' },
          { type: 'audience', pos: [-4.6, 0, 7.2], yaw: 180, count: 48, columns: 8, spacing: 0.65, phase: 0, color: '#33677f' },
          { type: 'audience', pos: [4.6, 0, 7.2], yaw: 180, count: 48, columns: 8, spacing: 0.65, phase: 2.2, color: '#803f65' }
        ]
      }
    };

    function populateSetAssetsAndCast18(setCfg) {
      const sa = S.stageAssets16;
      const st = S.state || window.state;
      if (typeof sa?.clearAll === 'function' && typeof sa?.syncItemMeshes === 'function') {
        sa.clearAll();
        const cat = sa.catalog || {};
        const counts = {};
        (setCfg.assets || []).forEach((seed, idx) => {
          const spec = cat[seed.kind];
          if (!spec) return;
          counts[seed.kind] = (counts[seed.kind] || 0) + 1;
          const item = {
            id: `AST16_SET${setCfg.id}_${idx + 1}`,
            kind: seed.kind,
            name: `${spec.name} #${counts[seed.kind]}`,
            pos: seed.pos.slice(),
            yaw: seed.yaw || 0,
            scale: seed.scale || 1,
            color: seed.color || spec.color || '#38bdf8'
          };
          sa.items.push(item);
          sa.syncItemMeshes(item);
        });
      }
      const seqObj = S.seq || window.seq;
      const dirObj = S.director || window.director;
      if (seqObj && Array.isArray(setCfg.cast) && typeof S.addPerson === 'function') {
        const wasLoading = dirObj ? dirObj.loading : false;
        if (dirObj) dirObj.loading = true;
        seqObj.people = [];
        if (dirObj && Array.isArray(dirObj.acts)) dirObj.acts = [];
        const modelIds = new Set();
        setCfg.cast.forEach((c) => {
          const opt = { pos: c.pos.slice(), color: c.color };
          if (c.count != null) opt.count = c.count;
          if (c.columns != null) opt.columns = c.columns;
          if (c.spacing != null) opt.spacing = c.spacing;
          if (c.yaw != null) opt.yaw = c.yaw;
          if (c.phase != null) opt.phase = c.phase;
          const p = S.addPerson(c.type, opt);
          if (p && c.model18) {
            p.model18 = c.model18;
            p.clip18 = c.clip18 ?? 0;
            p.speed18 = c.speed18 ?? 1;
            modelIds.add(c.model18);
          }
        });
        if (dirObj) {
          dirObj.loading = wasLoading;
          dirObj.selection = null;
          dirObj.mode = 'navigate';
        }
        S.rebuildCast?.();
        S.renderCastManager?.();
        if (modelIds.size && typeof S.characters18?.load === 'function') {
          Promise.all([...modelIds].map((id) => S.characters18.load(id).catch(() => null))).then(() => {
            S.rebuildCast?.();
            S.renderCastManager?.();
            S.engine?.render?.(window.state?.time || 0);
          });
        }
      }
    }

    function applyStageSet18(setIndex = 1, opts = {}) {
      const idx = clamp18(Math.round(+setIndex) || 1, 1, 6);
      const setCfg = STAGE_SETS18[idx] || STAGE_SETS18[1];
      const eng = S.engine || getEngine();
      const st = S.state || window.state;
      if (!eng || typeof window.createSurface !== 'function' || typeof window.M?.mm !== 'function') {
        return false;
      }
      return singleUndo18(() => {
      if (opts.recordUndo !== false) window.checkpoint?.();
      if (S.stageLift?.items) S.stageLift.items.length = 0;

      const shellMeshes = typeof window.buildStageShellMeshes === 'function'
        ? window.buildStageShellMeshes(setCfg.shell)
        : [];
      const screens = [];
      for (const scr of setCfg.screens) {
        const shape = scr.shapeType || scr.map?.shapeType || 'flat';
        const curve = scr.curveDegPerCab ?? scr.map?.curveDegPerCab ?? 0;
        const q = (shape !== 'flat' || curve)
          ? buildGeometricLedMesh18(scr.name, scr.wM, scr.hM, shape, curve)
          : window.quadMesh(
              scr.name,
              [[-scr.wM / 2, scr.hM / 2, 0], [scr.wM / 2, scr.hM / 2, 0], [scr.wM / 2, -scr.hM / 2, 0], [-scr.wM / 2, -scr.hM / 2, 0]],
              { color: [0.04, 0.05, 0.08, 1] }
            );
        const ry = ((scr.yawDeg || 0) * Math.PI) / 180;
        const mat = window.M.mm(window.M.translate(scr.pos), window.M.rotate([0, 1, 0], ry));
        const ledGrp = 'led_asm_' + scr.name;
        const grpVi = `Cụm Màn LED: ${scr.name}`;
        const grpEn = `LED Screen Assembly: ${scr.name}`;
        window.transformMesh(q, mat);
        q._smartGroupId = ledGrp;
        q.nodePath = ledGrp + '/panel';
        q._groupLabelVi = grpVi;
        q._groupLabelEn = grpEn;
        shellMeshes.push(q);
        if (shape === 'flat' && !curve && typeof window.boxMesh === 'function') {
          const frame = window.boxMesh(scr.name.replace('LED', 'Frame'), [0, 0, -0.10], [scr.wM + 0.12, scr.hM + 0.12, 0.18], [0.12, 0.13, 0.17, 1]);
          window.transformMesh(frame, mat);
          frame._smartGroupId = ledGrp;
          frame.nodePath = ledGrp + '/frame';
          frame._groupLabelVi = grpVi;
          frame._groupLabelEn = grpEn;
          shellMeshes.push(frame);
        }
        screens.push({ mesh: q, cfg: scr });
      }

      eng.setModel(shellMeshes);
      eng.surfaces = [];
      eng.master = { width: 3840, height: 1280 };
      for (const s of screens) {
        const map = { ...(s.cfg.map || {}) };
        const surf = window.createSurface(s.mesh, s.cfg.name, map);
        if (surf) {
          if (map.cabinetModelId) surf.cabinetModelId = map.cabinetModelId;
          if (map.processorModelId) surf.processorModelId = map.processorModelId;
          if (map.rows500x1000 !== undefined) surf.rows500x1000 = map.rows500x1000;
          if (map.rows500x500 !== undefined) surf.rows500x500 = map.rows500x500;
          if (map.shapeType) surf.shapeType = map.shapeType;
          if (map.curveDegPerCab !== undefined) {
            surf.curveDegPerCab = map.curveDegPerCab;
            surf.panelAngleDeg = Number(map.curveDegPerCab) || 0;
            surf.columnAnglesDeg = [];
          }
          surf.physicalWidthM = s.cfg.wM;
          surf.physicalHeightM = s.cfg.hM;
          surf.physical = [s.cfg.wM, s.cfg.hM];
          surf.pos = s.cfg.pos.slice();
          surf.yawDeg = s.cfg.yawDeg || 0;
          if (s.mesh) s.mesh._surfaceId18 = surf.id;
          if (surf.mesh) surf.mesh._surfaceId18 = surf.id;
          window.normalizeSurfaceHardware?.(surf);
          window.rebuildSurface3DMesh?.(surf);
        }
      }
      eng.selected = eng.surfaces[0]?.id || null;
      if (typeof window.rigPreset === 'function') {
        window.rigPreset(setCfg.rigStyle || 'concert', false);
      }
      populateSetAssetsAndCast18(setCfg);
      if (st) {
        st.model = { name: 'ALPHA_Demo_Stage', files: [], demo: true, blank: false };
        st.activeStageSet18 = idx;
        st.selectedMesh = null;
        st.hit = null;
      }
      if (eng) eng._stageBatchDirty = true;
      window.renderUI?.();
      renderLmpToolbox18();
      renderLmpLiveShowDock18();
      if (opts.silent !== true) {
        window.toast?.(tr18(`Đã chuyển sang ${setCfg.titleVi}`, `Switched to ${setCfg.titleEn}`));
      }
      return true;
      });
    }

    function seedDefaultStageDemo18(onlyIfEmpty = false) {
      const sa = S.stageAssets16;
      const st = S.state || window.state;
      if (typeof sa?.syncItemMeshes !== 'function' || typeof sa?.clearAll !== 'function') return false;
      if (onlyIfEmpty && (!st?.model?.demo || (Array.isArray(sa.items) && sa.items.length > 0))) return false;
      populateSetAssetsAndCast18(STAGE_SETS18[1]);
      if (st) st.activeStageSet18 = 1;
      if (S.engine) S.engine._stageBatchDirty = true;
      S.renderLists?.();
      renderLmpToolbox18();
      return true;
    }

    if (typeof window.demo === 'function' && !window.demo._lmpSeeded18) {
      const priorDemo18 = window.demo;
      const wrappedDemo18 = function (...args) {
        const res = priorDemo18.apply(this, args);
        seedDefaultStageDemo18(false);
        if (window.state) {
          window.state.history = [];
          window.state.redo = [];
          window.historyButtons?.();
        }
        return res;
      };
      wrappedDemo18._lmpSeeded18 = true;
      window.demo = wrappedDemo18;
      S.demo = wrappedDemo18;
    }

    let lmpActiveTab18 = 'structure';
    let lmpCollapsed18 = true;

    function addToolboxStructure18(kind, opts = {}) {
      const sa = S.stageAssets16;
      if (typeof sa?.addCatalogItem !== 'function') return null;
      const deckH = Math.max(0.4, (S.engine?.stageBounds?.min?.[1] || 0) + 0.5);
      const batchId = opts.batchId || `batch_struct_${kind}_${Date.now().toString(36)}`;
      const spanM = Number.isFinite(+opts.spanM) ? clamp18(+opts.spanM, 2, 24) : 14.4;
      const scaleVal = Number.isFinite(+opts.scale) ? clamp18(+opts.scale, 0.3, 3.0) : 1;
      const yOff = Number.isFinite(+opts.offsetY) ? +opts.offsetY : 0;
      const zOff = Number.isFinite(+opts.offsetZ) ? +opts.offsetZ : 0;
      const sym = opts.symmetry !== undefined ? Boolean(opts.symmetry) : (kind === 'line_array' || kind === 'sub_stack' || kind === 'layher' || kind === 'vertical_truss');
      const count = Number.isFinite(+opts.count) ? Math.max(1, Math.min(16, Math.round(+opts.count))) : ((kind === 'line_array' || kind === 'sub_stack') ? 2 : 1);
      const tagItem = (it) => {
        if (!it) return null;
        it._lmpBatchId18 = batchId;
        it._lmpToolKind18 = kind;
        it._lmpCategory18 = 'structure';
        if (scaleVal !== 1) {
          it.scale = scaleVal;
          sa.syncItemMeshes?.(it);
        }
        return it;
      };
      const run = () => {
        const mapCatalog = {
          platform: { id: 'stage_riser', pos: [0, deckH + yOff, 0.8 + zOff] },
          layher: { id: 'truss_tower', pos: [-spanM * 0.5, yOff, -1.5 + zOff] },
          stairs: { id: 'stage_stairs', pos: [0, yOff, 3.6 + zOff] },
          straight_truss: { id: 'truss_arch', pos: [0, deckH + yOff, -1.2 + zOff] },
          vertical_truss: { id: 'truss_tower', pos: [spanM * 0.4, deckH + yOff, -1.2 + zOff] },
          circular_truss: { id: 'kinetic_ring', pos: [0, deckH + 1.4 + yOff, 0.4 + zOff] },
          line_array: { id: 'line_array', pos: [-spanM * 0.5, deckH + yOff, 0.9 + zOff] },
          sub_stack: { id: 'sub_stack', pos: [-spanM * 0.5, yOff, 2.2 + zOff] },
          dj_booth: { id: 'dj_booth', pos: [0, deckH + yOff, 0.5 + zOff] },
          foh_booth: { id: 'foh_control_booth', pos: [0, yOff, 7.6 + zOff] },
          podium: { id: 'vip_podium', pos: [0, deckH + yOff, 1.4 + zOff] },
          ibm_table: { id: 'conference_ibm_table', pos: [0, yOff, 5.2 + zOff] },
          gala_table: { id: 'gala_round_table', pos: [0, yOff, 5.8 + zOff] }
        };
        const addOpts = { noCheckpoint: !!opts.noCheckpoint, silent: !!opts.silent, keepInspectorPanel: Boolean(lumiState.rpConfig18 || _suppressRpInspectorRebuild18) };
        if (kind === 'live_band') {
          const riser = tagItem(sa.addCatalogItem('stage_riser', [0, deckH + yOff, -0.4 + zOff], addOpts));
          if (!opts.skipAct && typeof S.addAct8 === 'function') S.addAct8('live_band', { pos: [0, deckH + 0.38 + yOff, -0.4 + zOff] });
          return riser;
        }
        const entry = mapCatalog[kind] || { id: kind, pos: [0, deckH + yOff, 0.5 + zOff] };
        if (count === 1 && !sym) {
          return tagItem(sa.addCatalogItem(entry.id, entry.pos, addOpts));
        }
        const effCount = sym && count < 2 ? 2 : count;
        const created = [];
        for (let i = 0; i < effCount; i++) {
          const u = effCount === 1 ? 0 : (i / (effCount - 1)) - 0.5;
          const x = effCount === 1 ? entry.pos[0] : +(u * spanM).toFixed(2);
          const it = tagItem(sa.addCatalogItem(entry.id, [x, entry.pos[1], entry.pos[2]], addOpts));
          if (it) created.push(it);
        }
        return created[created.length - 1] || null;
      };
      return opts.noCheckpoint ? run() : singleUndo18(run);
    }

    function addToolboxLighting18(rawKind, opts = {}) {
      const eng = S.engine;
      if (!eng) return [];
      const kindMap = { par_led: 'par', strobe_bar: 'strobe', laser_bar: 'lasers', laser: 'lasers', blinder: 'blinders', beam: 'beams' };
      const kind = kindMap[rawKind] || rawKind;
      if (!opts.noCheckpoint) window.checkpoint?.();
      if (!Array.isArray(eng.lights)) eng.lights = [];
      const w = Math.max(8, eng.size?.width || 16);
      const h = Math.max(5, eng.size?.height || 7);
      const d = Math.max(5, eng.size?.depth || 7);
      const presets = {
        beams: { label: 'Beam 230 7R', type: 'beam', model: 'Robe Pointe 280W', oflProfileId: 'vn-stage/beam-230-7r', count: 4, weightKg: 15, powerW: 380, beamAngleDeg: 5, angle: 7, flux: 18500, ch: 16, color: '#38bdf8', y: +(h * 0.92).toFixed(2), z: +(-d * 0.2).toFixed(2), ty: 0.25, tz: +(d * 0.55).toFixed(2), sweep: true, fx: 'steady' },
        spot: { label: 'Spot Profile', type: 'spot', model: 'Moving Head Spot 350W', oflProfileId: 'generic/moving-head-spot-350w', count: 4, weightKg: 21, powerW: 420, beamAngleDeg: 14, angle: 12, flux: 24000, ch: 20, color: '#a855f7', y: +(h * 0.88).toFixed(2), z: +(-d * 0.12).toFixed(2), ty: 0.4, tz: +(d * 0.45).toFixed(2), sweep: true, fx: 'steady' },
        wash: { label: 'Wash Zoom', type: 'wash', model: 'Martin MAC Aura XB', oflProfileId: 'vn-stage/wash-zoom-36x18', count: 4, weightKg: 19, powerW: 450, beamAngleDeg: 28, angle: 22, flux: 22000, ch: 16, color: '#ec4899', y: +(h * 0.9).toFixed(2), z: +(-d * 0.15).toFixed(2), ty: 0.3, tz: +(d * 0.35).toFixed(2), sweep: false, fx: 'steady' },
        par: { label: 'PAR LED 54x3W', type: 'par', model: 'PAR LED 54x3W RGBW', oflProfileId: 'vn-stage/par-led-54x3w', count: 6, weightKg: 4.5, powerW: 180, beamAngleDeg: 25, angle: 20, flux: 9500, ch: 8, color: '#22c55e', y: +(h * 0.85).toFixed(2), z: +(-d * 0.08).toFixed(2), ty: 0.2, tz: +(d * 0.25).toFixed(2), sweep: false, fx: 'steady' },
        barra: { label: 'Barra LED 1m', type: 'bar', model: 'Katana LED Matrix Bar 1m', oflProfileId: 'vn-stage/katana-led-bar-1m', count: 4, weightKg: 8.5, powerW: 280, beamAngleDeg: 12, angle: 12, flux: 14000, ch: 24, color: '#00f5d4', y: 0.58, z: 2.45, ty: 4.6, tz: 0.4, sweep: false, fx: 'pulse' },
        blinders: { label: 'Blinder 4-Lite', type: 'blinder', model: 'Audience Blinder 4-Lite', oflProfileId: 'vn-stage/cob-blinder-4x100w', count: 4, weightKg: 9.5, powerW: 400, beamAngleDeg: 45, angle: 28, flux: 32000, ch: 8, color: '#fbbf24', y: 0.58, z: 2.35, ty: 4.2, tz: 0.85, sweep: false, fx: 'steady' },
        strobe: { label: 'Atomic Strobe', type: 'strobe', model: 'Atomic 3000 DMX Strobe', oflProfileId: 'vn-stage/atomic-strobe-3000w', count: 4, weightKg: 7.5, powerW: 1500, beamAngleDeg: 50, angle: 30, flux: 45000, ch: 6, color: '#ffffff', y: 0.58, z: 2.15, ty: 4.4, tz: 0.65, sweep: false, fx: 'strobe' },
        fresnel: { label: 'Fresnel 200W', type: 'fresnel', model: 'Theater Fresnel 200W Warm', oflProfileId: 'vn-stage/par-led-54x3w', count: 4, weightKg: 6.8, powerW: 220, beamAngleDeg: 35, angle: 24, flux: 16000, ch: 4, color: '#fde68a', y: +(h * 0.94).toFixed(2), z: +(d * 0.28).toFixed(2), ty: 1.2, tz: 0.4, sweep: false, fx: 'steady' },
        lasers: { label: 'ILDA Laser 10W', type: 'laser', model: 'KVANT Clubmax 10W ILDA', oflProfileId: 'vn-stage/beam-230-7r', count: 2, weightKg: 12, powerW: 320, beamAngleDeg: 4, angle: 5, flux: 26000, ch: 16, color: '#10b981', y: 2.2, z: -1.6, ty: 1.6, tz: 4.8, sweep: true, fx: 'pulse' }
      };
      const baseCfg = presets[kind] || presets.beams;
      const count = Number.isFinite(+opts.count) ? Math.max(1, Math.min(24, Math.round(+opts.count))) : baseCfg.count;
      const spanM = Number.isFinite(+opts.spanM) ? clamp18(+opts.spanM, 2, 24) : Math.max(6, +(w * 0.78).toFixed(2));
      const mountZone = opts.mountZone || (baseCfg.y < 1.2 ? 'floor' : 'overhead');
      const posY = mountZone === 'floor' ? 0.58 : mountZone === 'front' ? +(h * 0.94).toFixed(2) : baseCfg.y;
      const posZ = mountZone === 'floor' ? 2.45 : mountZone === 'front' ? +(d * 0.28).toFixed(2) : baseCfg.z;
      const zoomAngle = Number.isFinite(+opts.zoomDeg) ? clamp18(+opts.zoomDeg, 4, 60) : baseCfg.angle;
      const panOffRad = ((Number(opts.panOffsetDeg) || 0) * Math.PI) / 180;
      const tiltOffM = ((Number(opts.tiltOffsetDeg) || 0) / 45) * 2.4;
      const customColor = opts.color && /^#[0-9a-f]{6}$/i.test(opts.color) ? opts.color : baseCfg.color;
      const parLayout = opts.parLayout || 'linear';
      const batchId = opts.batchId || `batch_light_${kind}_${Date.now().toString(36)}`;
      const cfg = { ...baseCfg, count, y: posY, z: posZ, angle: zoomAngle, beamAngleDeg: zoomAngle, color: customColor };

      let lastU = 1;
      let nextAddr = 1;
      eng.lights.forEach((l) => {
        const u = Math.max(1, +l.dmxUniverse || 1);
        const endA = (+l.dmxAddress || 1) + (+l.dmxChannels || 16);
        if (u > lastU || (u === lastU && endA > nextAddr)) {
          lastU = u;
          nextAddr = endA;
        }
      });
      if (nextAddr + cfg.ch - 1 > 512) {
        lastU += 1;
        nextAddr = 1;
      }
      const autoRigFn = S.autoRigFixturesOnTruss || window.autoRigFixturesOnTruss;
      const autoRig = typeof autoRigFn === 'function'
        ? autoRigFn({
            trussId: cfg.y < 1.2 ? 'STAGE_DECK_FRONT' : 'TRUSS_MAIN',
            spanM,
            centerX: 0,
            trimHeightM: cfg.y,
            z: cfg.z,
            fixtureCount: cfg.count,
            fixtureType: cfg.type,
            fixtureModel: cfg.model,
            oflProfileId: cfg.oflProfileId,
            fixtureWeightKg: cfg.weightKg,
            fixturePowerW: cfg.powerW,
            startUniverse: lastU,
            startAddress: nextAddr,
            dmxChannels: cfg.ch
          })
        : {
            fixtures: Array.from({ length: cfg.count }, (_, idx) => ({
              x: cfg.count === 1 ? 0 : +(((idx / Math.max(1, cfg.count - 1)) - 0.5) * spanM).toFixed(2),
              dmxUniverse: lastU,
              dmxAddress: nextAddr + idx * cfg.ch,
              dmxChannels: cfg.ch,
              trussId: cfg.y < 1.2 ? 'STAGE_DECK_FRONT' : 'TRUSS_MAIN'
            }))
          };
      const baseIdx = eng.lights.length;
      const added = autoRig.fixtures.map((f, i) => {
        let fx = cfg.count === 1 ? 0 : +(((i / Math.max(1, cfg.count - 1)) - 0.5) * spanM).toFixed(2);
        let fy = cfg.y;
        let fz = cfg.z;
        let tx = +(fx * 0.85 + Math.sin(panOffRad) * 3.5).toFixed(2);
        let ty = +(cfg.ty + tiltOffM).toFixed(2);
        let tz = cfg.tz;
        if (parLayout === 'u_shape' && cfg.count >= 3) {
          const u = i / Math.max(1, cfg.count - 1);
          const halfW = spanM * 0.5;
          if (u < 0.33) {
            fx = -halfW;
            fz = +(-d * 0.25 + (0.33 - u) * 3 * (d * 0.55)).toFixed(2);
            tx = +(-halfW * 0.45).toFixed(2);
            tz = fz;
          } else if (u > 0.67) {
            fx = halfW;
            fz = +(-d * 0.25 + (u - 0.67) * 3 * (d * 0.55)).toFixed(2);
            tx = +(halfW * 0.45).toFixed(2);
            tz = fz;
          } else {
            const bu = (u - 0.33) / 0.34 - 0.5;
            fx = +(bu * spanM).toFixed(2);
            fz = +(-d * 0.28).toFixed(2);
            tx = fx;
            tz = +(fz + 1.2).toFixed(2);
          }
        }
        return {
          id: `light_${Date.now().toString(36)}_${baseIdx + i}`,
          name: `${cfg.label} #${baseIdx + i + 1}`,
          type: cfg.type,
          model: cfg.model,
          oflModel: cfg.model,
          oflProfileId: cfg.oflProfileId,
          weightKg: cfg.weightKg,
          powerW: cfg.powerW,
          beamAngleDeg: cfg.beamAngleDeg,
          luminousFluxLm: cfg.flux,
          dmxUniverse: f.dmxUniverse,
          dmxAddress: f.dmxAddress,
          dmxChannels: f.dmxChannels,
          trussId: f.trussId,
          pos: [fx, fy, fz],
          target: [tx, ty, tz],
          color: cfg.color,
          power: 4.5,
          angle: cfg.angle,
          enabled: true,
          sweep: cfg.sweep,
          speed: 0.4,
          phase: i * 0.45,
          fx: cfg.fx,
          fxDepth: cfg.fx === 'strobe' ? 0.95 : 0.55,
          fxSpeed: cfg.fx === 'strobe' ? 8.5 : 2.2,
          boost: 1.15,
          _lmpBatchId18: batchId,
          _lmpBatchLabel18: `${cfg.label} (${cfg.count})`,
          _lmpToolKind18: kind
        };
      });
      eng.lights.push(...added);
      if (window.state && added[0]) {
        window.state.step = 'lighting';
        window.state.selectedSfx18 = null;
        window.state.selectedLight = added[0].id;
      }
      if (kind === 'lasers' && S.laserShow?.enable) {
        try { S.laserShow.enable(true); } catch { /* ignore */ }
      }
      eng.rebuildFixtures?.();
      if (_suppressRpInspectorRebuild18) window.renderLists?.();
      else window.renderUI?.();
      renderLmpToolbox18();
      if (!opts.silent) {
        window.toast?.(tr18(`Đã thêm ${added.length} đèn ${cfg.label} (Auto-Rig DMX U${lastU}).`, `Added ${added.length} ${cfg.label} fixtures (Auto-Rig DMX U${lastU}).`));
      }
      return added;
    }

    // =========================================================================
    // V18.4 LEDMAPPER.PRO LIVE SHOW ENGINE (6 SHOW PRESETS + LASER + 3D PYRO/SFX)
    // =========================================================================
    const LMP_BEAM_PALETTES18 = [
      ['#00f0ff', '#ff007f', '#ffe600', '#0055ff'],
      ['#01ffa0', '#0055ff', '#00f0ff', '#aa00ff'],
      ['#ff2a00', '#ffaa00', '#ffe600', '#ff0055'],
      ['#ff00aa', '#7700ff', '#00e5ff', '#01ffa0'],
      ['#ffffff', '#0066ff', '#00f0ff', '#ffaa00'],
      ['#ff0055', '#ffe600', '#01ffa0', '#00d4ff', '#aa00ff']
    ];
    const LMP_WASH_PALETTES18 = [
      ['#ff007f', '#00f0ff', '#7700ff', '#ffaa00'],
      ['#0055ff', '#01ffa0', '#aa00ff', '#00e5ff'],
      ['#ff5500', '#ff0055', '#ffcc00', '#ff2a00'],
      ['#7700ff', '#00e5ff', '#ff00aa', '#0055ff'],
      ['#0066ff', '#ffaa00', '#ffffff', '#00f0ff'],
      ['#01ffa0', '#00d4ff', '#aa00ff', '#ff0055', '#ffe600']
    ];
    const LMP_LASER_PALETTES18 = ['#00ff66', '#01ffa0', '#00f0ff', '#ff00aa', '#7700ff', '#ffe600'];
    const LMP_FIREWORK_COLORS18 = ['#ff0055', '#00f0ff', '#ffe600', '#01ffa0', '#aa00ff', '#ff6a00', '#ffffff'];
    const nowMs18 = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());
    const clamp18 = (v, min, max) => Math.min(max, Math.max(min, Number.isFinite(+v) ? +v : min));

    const liveShow18 = {
      running: false,
      activeShow: 1,
      effectiveShow: 1,
      prevShow: 1,
      transitionFromShow: 1,
      transitionStartSec: 0,
      transitionAlpha: 1,
      aiAuto: false,
      multicolor: true,
      speed: 0.9,
      lightsOn: true,
      blindersOn: false,
      laserOn: true,
      sfxOn: true,
      strobe: false,
      blackout: false,
      parChaseMode: 'auto',
      fanLaw: 'auto',
      beamFanLaw: 'auto',
      laserPattern: 'auto',
      autoCam: false,
      autoCamPausedUntilMs: 0,
      savedCamera: null,
      dockHidden: false,
      dockCollapsed: true,
      dockMini: false,
      dockPos: null,
      motorPhasePan: 0,
      motorPhaseTilt: 0,
      showElapsedSec: 0,
      lastTickMs: 0,
      sfxPhase: 0,
      sparkUntilMs: 0,
      co2UntilMs: 0,
      flameUntilMs: 0,
      skyFlashUntilMs: 0,
      skyFlashColor: '#ffe600',
      lastAerialAutoMs: 0,
      crowdBouncePhase: 0,
      crowdBounceOffsetM: 0,
      _crowdSmoothEnergy: 0,
      _screenHaloPools: [],
      _floorProjections: [],
      _deckGlints: [],
      _laserRenderData: [],
      _laserPrevTargets18: new Map(),
      _sfxStageGlow: { active: false, pos: [0, 1.2, 2.2], color: '#ff9900', power: 0 },
      _sfxSkyBurst: { active: false, pos: [0, 8.5, -1.8], color: '#ffe600', power: 0 },
      particles: [],
      aerialShells: [],
      activeNozzles: [],
      savedLights: null,
      savedSettings: null
    };
    lumiState.liveShow18 = liveShow18;

    function hexToRgb255_18(hex) {
      const s = String(hex || '#00f0ff').replace('#', '');
      if (!/^[0-9a-f]{6}$/i.test(s)) return [0, 240, 255];
      return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
    }

    function hexToRgb01_18(hex) {
      const [r, g, b] = hexToRgb255_18(hex);
      return [r / 255, g / 255, b / 255];
    }

    function rgb01ToHex18(r, g, b) {
      const toHex = (v) => clamp18(Math.round(v * 255), 0, 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function mixHex18(hexA, hexB, t) {
      const u = clamp18(t, 0, 1);
      if (u <= 0.001) return hexA || '#00f0ff';
      if (u >= 0.999) return hexB || '#00f0ff';
      const [r1, g1, b1] = hexToRgb01_18(hexA);
      const [r2, g2, b2] = hexToRgb01_18(hexB);
      return rgb01ToHex18(r1 + (r2 - r1) * u, g1 + (g2 - g1) * u, b1 + (b2 - b1) * u);
    }

    function rgba18(hex, alpha = 1) {
      const [r, g, b] = hexToRgb255_18(hex);
      return `rgba(${r},${g},${b},${clamp18(alpha, 0, 1).toFixed(3)})`;
    }

    // P7: Quintic C2 Smoothstep transition curve 6t^5 - 15t^4 + 10t^3
    function quinticSmooth18(u) {
      const t = clamp18(u, 0, 1);
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

    // P7: 76% Palette Hold + 24% Quintic Glide
    function samplePaletteGlide18(palette, phase) {
      const pal = Array.isArray(palette) && palette.length ? palette : ['#00f0ff'];
      if (pal.length === 1) return pal[0];
      const p = (((Number(phase) || 0) % pal.length) + pal.length) % pal.length;
      const i0 = Math.floor(p) % pal.length;
      const i1 = (i0 + 1) % pal.length;
      const frac = p - Math.floor(p);
      if (frac <= 0.76) return pal[i0];
      const u = quinticSmooth18((frac - 0.76) / 0.24);
      return mixHex18(pal[i0], pal[i1], u);
    }

    function dominoTail18(idx, total, head, tailLen) {
      const n = Math.max(1, total);
      const dist = (((head - idx) % n) + n) % n;
      return dist <= tailLen ? Math.pow(1 - dist / Math.max(0.1, tailLen), 1.65) : 0;
    }

    function classifyFixture18(l, idx, total) {
      const t = String(l?.type || l?.fixtureCategory18 || '').toLowerCase();
      if (['beam', 'spot', 'wash', 'par', 'bar', 'blinder', 'strobe', 'fresnel', 'laser'].includes(t)) return t;
      const nm = String(l?.name || '').toLowerCase();
      if (nm.includes('laser')) return 'laser';
      if (nm.includes('barra') || nm.includes('bar') || nm.includes('katana')) return 'bar';
      if (nm.includes('blinder')) return 'blinder';
      if (nm.includes('strobe') || nm.includes('atomic')) return 'strobe';
      if (nm.includes('wash') || nm.includes('aura')) return 'wash';
      if (nm.includes('spot') || nm.includes('profile')) return 'spot';
      if (nm.includes('fresnel')) return 'fresnel';
      if (nm.includes('par')) return 'par';
      if (nm.includes('beam') || nm.includes('pointe')) return 'beam';
      const y = Number(l?.pos?.[1]) || 4;
      if (y < 1.3) return idx % 2 === 0 ? 'bar' : 'beam';
      const mod = idx % 8;
      if (mod === 0 || mod === 1) return 'beam';
      if (mod === 2 || mod === 3) return 'spot';
      if (mod === 4) return 'wash';
      if (mod === 5) return 'par';
      if (mod === 6) return 'bar';
      return 'blinder';
    }

    // P7: 5 Beam Group Fan Laws (v_converge, v_diverge, x_cross, parallel_wing, parallel_zero)
    function evalBeamFanLaw18(lawName, px, idx, total, phasePan, phaseTilt, spreadScale = 1) {
      const n = Math.max(1, total);
      const u = n > 1 ? (idx / (n - 1)) * 2 - 1 : clamp18(px / 6.0, -1, 1);
      const side = px === 0 ? (u >= 0 ? 1 : -1) : (px >= 0 ? 1 : -1);
      const absU = Math.abs(u);
      const law = String(lawName || 'v_converge').toLowerCase();
      let panAngle = 0;
      let tiltWave = 0;
      if (law === 'v_converge') {
        panAngle = -side * (0.22 + absU * 0.42) * spreadScale + Math.sin(phasePan * 0.85) * 0.28;
        tiltWave = Math.cos(phaseTilt + absU * 1.4) * 0.85;
      } else if (law === 'v_diverge') {
        panAngle = side * (0.18 + absU * 0.54) * spreadScale + Math.sin(phasePan * 0.9 + u * 0.6) * 0.25;
        tiltWave = Math.sin(phaseTilt + absU * 1.2) * 0.92;
      } else if (law === 'x_cross') {
        const pairSign = (idx % 2 === 0 ? 1 : -1) * side;
        panAngle = pairSign * (0.48 + 0.24 * Math.sin(phasePan * 1.35)) * spreadScale;
        tiltWave = Math.cos(phaseTilt * 1.3 + (idx % 2) * Math.PI * 0.5) * 0.88;
      } else if (law === 'parallel_wing') {
        panAngle = side * 0.36 * spreadScale + Math.sin(phasePan + side * 0.8) * 0.44;
        tiltWave = Math.sin(phaseTilt * 1.15 + absU * 0.9) * 0.9;
      } else {
        // parallel_zero
        panAngle = Math.sin(phasePan) * 0.48 * spreadScale;
        tiltWave = Math.cos(phaseTilt + u * 0.35) * 0.85;
      }
      return { panAngle, tiltWave, law };
    }

    // P5: Audience Blinder & Hybrid Strobe Multi-Cell Thermal Flash Engine (Spatial Pseudo-Random Bucket Gating + 2x2 Individual COB Lamp Flicker)
    function evalBlinderThermalFlash18(l, idx, nowMs, blindersOn = false, showIdx = 1) {
      const px = Number(l?.pos?.[0]) || 0;
      const py = Number(l?.pos?.[1]) || 4;
      const pz = Number(l?.pos?.[2]) || 0;
      const hash = Math.abs(px * 917.3 + py * 431.7 + pz * 193.1 + idx * 257.9);
      const periodMs = 260;
      const bucket = Math.floor((nowMs + hash) / periodMs);
      const localT = (nowMs + hash) % periodMs;
      const rawSin = Math.sin(bucket * 12.9898 + idx * 78.233 + hash * 0.017) * 43758.5453;
      const cellGate = (Math.abs(rawSin) % 1) < 0.58;
      const active = Boolean(blindersOn);
      let ka = 0;
      if (active) {
        if (cellGate && localT < 68) ka = 1.0;
        else if (cellGate && localT < 195) ka = Math.pow(1 - (localT - 68) / 127, 1.85);
        else ka = 0.08;
        ka = Math.max(ka, 0.54 + 0.46 * ka);
      } else {
        ka = 0.12 + 0.10 * Math.max(0, Math.sin(nowMs * 0.0025 + idx * 0.9 + showIdx * 0.3));
      }
      ka = clamp18(ka, 0, 1);
      const color = ka > 0.72 ? '#ffffff' : ka > 0.35 ? '#ffe600' : '#ff7700';
      const blastScale = +(3.2 + 5.8 * ka).toFixed(2);
      const power = +(active ? 4.6 + ka * 7.2 : 1.1 + ka * 1.1).toFixed(2);
      const cells = [];
      for (let c = 0; c < 4; c++) {
        const hotPop = ka > 0.68 && ((Math.floor(nowMs / 45) + idx * 3 + c * 7) % 5 === 0);
        cells.push({
          index: c,
          color: hotPop ? '#ffffff' : color,
          intensity: +(ka * (hotPop ? 1.18 : 0.92)).toFixed(3),
          hotPop
        });
      }
      return { ka, color, blastScale, power, hash, cellGate, cells };
    }

    function evalFrontKeylightCct18(colorTempK = 4200, keyLightPct = 88) {
      const cct = Number.isFinite(+colorTempK) ? +colorTempK : 4200;
      const pct = clamp18(Number.isFinite(+keyLightPct) ? +keyLightPct : 88, 15, 100);
      const hexColor = cct <= 3500 ? '#ffdfa8' : cct >= 5400 ? '#f2f6ff' : '#fff2d6';
      return {
        colorTempK: cct <= 3500 ? 3200 : cct >= 5400 ? 5600 : 4200,
        hexColor,
        keyLightPct: pct,
        dimmerScale: +(pct / 100).toFixed(3)
      };
    }

    function evalStrobePulse18(cat, idx = 0, grpIdx = 0, nowMs = nowMs18()) {
      const c = String(cat || 'strobe').toLowerCase();
      const inBreathPause = (nowMs % 2500) > 2300;
      let periodMs = 71.4; // 14Hz default (Beam/Spot/Strobe)
      let dutyMs = 25.0;
      let phaseMs = c === 'strobe' ? 0 : ((Number(grpIdx) || 0) % 3) * (71.4 / 3);
      if (c === 'wash') {
        periodMs = 83.33; // 12Hz Wash strobe
        dutyMs = 26.0;
        phaseMs = ((Number(idx) || 0) % 3) * 20.0;
      } else if (c === 'par' || c === 'bar') {
        periodMs = 76.92; // 13Hz PAR/Barra strobe
        dutyMs = 24.0;
        phaseMs = ((Number(idx) || 0) % 3) * 26.0;
      }
      const localT = (nowMs + phaseMs) % periodMs;
      const gate = !inBreathPause && localT < dutyMs;
      return { gate, inBreathPause, periodMs: +periodMs.toFixed(2), dutyMs, localT: +localT.toFixed(2) };
    }

    // P2: 16-Beam 3D RGB ILDA Laser Scan Patterns (Ps = 0..3) + 3D Roll + Center-Out activeFrac + IEC 60825-1 +3.20m Horizon Clamp + Exponential Smoothing
    function evalLaserScanPattern18(patternIdx, origin, uIdx, tSec, spd, multicolor = true, palette = LMP_LASER_PALETTES18, beamCountOverride = null) {
      const pIdx = ((Math.round(Number(patternIdx) || 0) % 4) + 4) % 4;
      const beamCount = beamCountOverride != null ? Math.max(4, Math.min(24, Number(beamCountOverride) || 16)) : (pIdx === 3 ? 6 : 5);
      const pal = Array.isArray(palette) && palette.length ? palette : LMP_LASER_PALETTES18;
      const baseCol = samplePaletteGlide18(pal, uIdx * 0.7 + pIdx + tSec * spd * 0.28);
      const altCol = samplePaletteGlide18(pal, uIdx * 0.7 + pIdx + 2 + tSec * spd * 0.28);
      const rays = [];
      const cacheMap = liveShow18._laserPrevTargets18;
      const smoothAlpha = 0.20;
      const safetyHorizonY = 3.20;
      const dirSign = uIdx % 2 === 0 ? 1 : -1;

      let rollRad = 0;
      let activeFrac = 1.0;
      let spreadScale = 1.0;
      if (pIdx === 0) {
        // Pattern 0: Liquid Sky Wave Sheet with center-out breathing fan
        rollRad = Math.sin(tSec * spd * 0.28 + dirSign * 0.7) * 0.14;
        activeFrac = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tSec * spd * 0.48 + uIdx * 1.1));
        spreadScale = 0.85 + 0.25 * Math.sin(tSec * spd * 0.32 + uIdx);
      } else if (pIdx === 1) {
        // Pattern 1: Geometric Scanning Cone Tunnel with continuous roll spin
        rollRad = dirSign * tSec * spd * 0.65;
        activeFrac = 1.0;
        spreadScale = 0.72 + 0.22 * Math.abs(Math.sin(tSec * spd * 0.38));
      } else if (pIdx === 2) {
        // Pattern 2: Dual-Mirror X-Cross Chopper with tilted roll plane
        rollRad = dirSign * (0.26 + 0.14 * Math.sin(tSec * spd * 0.42));
        activeFrac = 0.92;
        spreadScale = 0.90;
      } else {
        // Pattern 3: Festival Climax Starburst with center-out progressive reveal
        rollRad = Math.sin(tSec * spd * 0.22 + uIdx * 0.8) * 0.22;
        activeFrac = 0.28 + 0.72 * Math.pow(0.5 + 0.5 * Math.sin(tSec * spd * 0.52 + uIdx * 0.9), 1.35);
        spreadScale = 0.95 + 0.18 * Math.cos(tSec * spd * 0.44);
      }

      const cosR = Math.cos(rollRad);
      const sinR = Math.sin(rollRad);

      for (let b = 0; b < beamCount; b++) {
        const u = (b / Math.max(1, beamCount - 1)) - 0.5;
        const beamIntensity = clamp18((activeFrac - Math.abs(u) * 1.84) / 0.18, 0, 1);
        let localYaw = u * 0.88 * spreadScale;
        let localPitch = 0.01;
        let gate = beamIntensity > 0.04;
        if (pIdx === 0) {
          localYaw += Math.sin(tSec * spd * 0.35 + uIdx) * 0.16;
          localPitch = 0.02 + Math.sin(tSec * spd * 0.72 + b * 0.42 + uIdx) * 0.045;
        } else if (pIdx === 1) {
          const theta = (b / beamCount) * Math.PI * 2 + tSec * spd * 0.52 * dirSign;
          const rad = (0.14 + 0.12 * Math.abs(Math.sin(tSec * spd * 0.38))) * spreadScale;
          localYaw = Math.cos(theta) * rad;
          localPitch = 0.04 + Math.sin(theta) * rad * 0.65;
        } else if (pIdx === 2) {
          localYaw = dirSign * 0.20 + u * 0.72 * spreadScale + Math.sin(tSec * spd * 0.55) * 0.12 * dirSign;
          localPitch = 0.01 + Math.cos(tSec * spd * 0.48 + b * 0.35) * 0.045;
          gate = gate && (((b + Math.floor(tSec * spd * 2.4)) % 3) !== 0);
        } else {
          localYaw = u * 0.96 * spreadScale + Math.sin(tSec * spd * 0.45 + b * 0.32) * 0.14;
          localPitch = 0.03 + Math.cos(tSec * spd * 0.62 + b * 0.42) * 0.075;
        }
        const yaw = localYaw * cosR - localPitch * sinR;
        const pitch = Math.max(-0.015, localYaw * sinR + localPitch * cosR);
        const range = 16.5;
        const safeOriginY = Math.max(safetyHorizonY, Number(origin[1]) || 3.6);
        const rawX = origin[0] + Math.sin(yaw) * Math.cos(pitch) * range;
        const rawY = Math.max(safetyHorizonY, safeOriginY + Math.sin(pitch) * range);
        const rawZ = origin[2] + Math.cos(yaw) * Math.cos(pitch) * range;
        const key = `${uIdx}:${b}`;
        const prev = cacheMap?.get(key);
        const target3d = prev
          ? [
              prev[0] + (rawX - prev[0]) * smoothAlpha,
              Math.max(safetyHorizonY, prev[1] + (rawY - prev[1]) * smoothAlpha),
              prev[2] + (rawZ - prev[2]) * smoothAlpha
            ]
          : [rawX, rawY, rawZ];
        cacheMap?.set(key, target3d);
        const rayCol = multicolor
          ? (b % 3 === 0 ? baseCol : b % 3 === 1 ? altCol : pal[(uIdx + b) % pal.length])
          : '#00ff66';
        rays.push({ b, u, target3d, rayCol, gate, beamIntensity: +beamIntensity.toFixed(3) });
      }
      return {
        origin: [origin[0], Math.max(safetyHorizonY, Number(origin[1]) || 3.6), origin[2]],
        patternIdx: pIdx,
        beamCount,
        rollRad: +rollRad.toFixed(4),
        activeFrac: +activeFrac.toFixed(3),
        baseCol,
        altCol,
        rays,
        safetyHorizonY
      };
    }

    // P8: Screen Halo Ambient Bleed (dmx_screenhalo_)
    function evalScreenHaloBleed18(eng, tSec, spd) {
      const pools = [];
      if (!eng || !Array.isArray(eng.surfaces)) return pools;
      const deckY = Math.max(0.42, (eng.stageBounds?.min?.[1] || 0) + 0.46);
      const accent = eng.accent || '#00f0ff';
      for (let i = 0; i < eng.surfaces.length; i++) {
        const s = eng.surfaces[i];
        if (!s || s.enabled === false) continue;
        const b = s.mesh?.bounds;
        const cx = Number.isFinite(Number(s.pos?.[0])) ? Number(s.pos[0]) : (b ? (b.min[0] + b.max[0]) * 0.5 : 0);
        const cz = Number.isFinite(Number(s.pos?.[2])) ? Number(s.pos[2]) : (b ? (b.min[2] + b.max[2]) * 0.5 : -1.5);
        const wM = Number(s.physicalWidthM || s.physical?.[0]) || (b ? Math.max(1.5, b.max[0] - b.min[0]) : 3.2);
        const pulse = 0.72 + 0.28 * Math.sin(tSec * spd * 2.2 + i * 1.1);
        const br = clamp18(Number(s.brightness ?? 1), 0.1, 1.5);
        pools.push({
          id: `dmx_screenhalo_${s.id || i}`,
          kind: 'screenHalo',
          pos: [cx, deckY + 0.014, cz + 1.05],
          radiusX: clamp18(wM * 0.58, 1.2, 5.2),
          radiusZ: clamp18(wM * 0.34, 0.9, 2.8),
          color: accent,
          alpha: clamp18(0.22 * pulse * br, 0.04, 0.38)
        });
      }
      return pools;
    }

    // P9: Auto Cinematic Camera Director (5-Shot 10s Ease-In-Out Tour with 8s manual pause)
    const LMP_CAM_TOUR_SHOTS18 = [
      { name: 'fob_wide', yaw: 0.0, pitch: 0.18, distScale: 1.08, targetOff: [0, 0, 0] },
      { name: 'low_hero_left', yaw: -0.46, pitch: 0.07, distScale: 0.76, targetOff: [-1.4, -0.35, 0.4] },
      { name: 'low_hero_right', yaw: 0.46, pitch: 0.07, distScale: 0.76, targetOff: [1.4, -0.35, 0.4] },
      { name: 'overhead_rig', yaw: 0.18, pitch: 0.62, distScale: 1.16, targetOff: [0, 0.4, -0.4] },
      { name: 'center_close', yaw: -0.08, pitch: 0.12, distScale: 0.64, targetOff: [0, -0.2, 0.6] }
    ];

    function stepAutoCameraDirector18(eng, ls, dt, nowMs = nowMs18()) {
      if (!eng || !eng.camera || eng.view !== 'stage' || !ls?.autoCam || !ls.running) return false;
      if (nowMs < (ls.autoCamPausedUntilMs || 0)) return false;
      if (!ls.savedCamera) {
        ls.savedCamera = {
          yaw: eng.camera.yaw,
          pitch: eng.camera.pitch,
          distance: eng.camera.distance,
          target: Array.isArray(eng.camera.target) ? eng.camera.target.slice() : [0, 2.5, 0]
        };
      }
      const shotDur = 10.0;
      const totalShots = LMP_CAM_TOUR_SHOTS18.length;
      const t = ls.showElapsedSec || 0;
      const idx0 = Math.floor(t / shotDur) % totalShots;
      const idx1 = (idx0 + 1) % totalShots;
      const u = clamp18((t % shotDur) / shotDur, 0, 1);
      const smoothU = u * u * (3 - 2 * u);
      const ease = 0.68 * u + 0.32 * smoothU;
      const s0 = LMP_CAM_TOUR_SHOTS18[idx0];
      const s1 = LMP_CAM_TOUR_SHOTS18[idx1];
      const baseDist = Math.max(eng.size?.width || 18, (eng.size?.height || 8) * 1.7, eng.size?.depth || 8) * 1.12;
      const baseTargetY = (eng.size?.height || 6) * 0.42;

      eng.camera.yaw = s0.yaw + (s1.yaw - s0.yaw) * ease;
      eng.camera.pitch = s0.pitch + (s1.pitch - s0.pitch) * ease;
      eng.camera.distance = baseDist * (s0.distScale + (s1.distScale - s0.distScale) * ease);
      eng.camera.target = [
        s0.targetOff[0] + (s1.targetOff[0] - s0.targetOff[0]) * ease,
        baseTargetY + s0.targetOff[1] + (s1.targetOff[1] - s0.targetOff[1]) * ease,
        s0.targetOff[2] + (s1.targetOff[2] - s0.targetOff[2]) * ease
      ];
      return true;
    }

    function getStageSfxNozzles18() {
      const sa = S.stageAssets16;
      const items = Array.isArray(sa?.items) ? sa.items : [];
      const deckY = Math.max(0.45, (S.engine?.stageBounds?.min?.[1] || 0) + 0.5);
      const halfSpan = Math.max(4.5, (S.engine?.size?.width || 16) * 0.45);
      const byType = {
        cold_spark_fountain: [],
        co2_jet: [],
        flame_jet: [],
        confetti_cannon: []
      };
      items.forEach((it) => {
        const k = normalizeSfxType18(it.kind || it.type);
        if (byType[k] && Array.isArray(it.pos)) {
          byType[k].push({ id: it.id, kind: k, pos: [Number(it.pos[0]) || 0, Number(it.pos[1]) || deckY, Number(it.pos[2]) || 2.4], item: it });
        }
      });
      if (!byType.cold_spark_fountain.length) {
        [-4.8, -1.6, 1.6, 4.8].forEach((x, i) => byType.cold_spark_fountain.push({ id: `v_spark_${i}`, kind: 'cold_spark_fountain', pos: [x, deckY, 2.55] }));
      }
      if (!byType.co2_jet.length) {
        [-3.4, -1.1, 1.1, 3.4].forEach((x, i) => byType.co2_jet.push({ id: `v_co2_${i}`, kind: 'co2_jet', pos: [x, deckY, 2.45] }));
      }
      if (!byType.flame_jet.length) {
        [-5.8, -2.2, 2.2, 5.8].forEach((x, i) => byType.flame_jet.push({ id: `v_flame_${i}`, kind: 'flame_jet', pos: [x, deckY, 2.2] }));
      }
      if (!byType.confetti_cannon.length) {
        [-6.2, -2.0, 2.0, 6.2].forEach((x, i) => byType.confetti_cannon.push({ id: `v_aerial_${i}`, kind: 'confetti_cannon', pos: [x, deckY + 0.3, -1.9] }));
      }
      for (const k of Object.keys(byType)) {
        byType[k].sort((a, b) => a.pos[0] - b.pos[0]);
        const list = byType[k];
        list.forEach((nz, idx) => {
          const uNorm = list.length > 1 ? (idx / (list.length - 1)) * 2 - 1 : clamp18(nz.pos[0] / halfSpan, -1, 1);
          nz.uNorm = +uNorm.toFixed(4);
          nz.tiltX = +(uNorm * 0.14).toFixed(4);
          nz.tiltZ = k === 'co2_jet' ? 0.22 : k === 'flame_jet' ? 0.12 : 0.08;
        });
      }
      return byType;
    }

    // Per-effect 3-sub-mode Pyro choreography (Sparkular sine/sweep/step, Flame L->R runner/V-wave/punch+salvo, CO2 pulse/cryo-sweep/wing-alt)
    function evalPyroChoreoGate18(effectKind, idx, total, uNorm = 0, phaseFrac = 0.5, subMode = 0, tSec = 0, spd = 2.0) {
      const k = normalizeSfxType18(effectKind);
      const u = clamp18(Number.isFinite(+uNorm) ? +uNorm : (total > 1 ? (idx / (total - 1)) * 2 - 1 : 0), -1, 1);
      const absU = Math.abs(u);
      const mode = ((Math.round(Number(subMode) || 0) % 3) + 3) % 3;
      const ke = clamp18(phaseFrac, 0, 1);

      if (k === 'flame_jet') {
        const finaleSalvo = ke > 0.64 && ke < 0.86;
        if (mode === 0) {
          // Sub-mode 0: Left-to-right chasing fire runner wave + finale salvo
          const u01 = (u + 1) * 0.5;
          const runner = ((tSec * spd * 0.68) % 1 + 1) % 1;
          return (Math.abs(u01 - runner) < 0.28 || finaleSalvo) ? 1.0 : 0;
        }
        if (mode === 1) {
          // Sub-mode 1: Symmetric center-out / center-in V-wave
          const wave = Math.abs(Math.sin(tSec * spd * 1.45));
          return (Math.abs(absU - wave) < 0.32 || finaleSalvo) ? 1.0 : 0;
        }
        // Sub-mode 2: Odd/even alternating fire punch + finale salvo
        const altMatch = (idx % 2) === (Math.floor(tSec * spd * 2.4) % 2);
        return ((altMatch && Math.sin(tSec * spd * 5.2) > -0.15) || finaleSalvo) ? 1.05 : 0;
      }

      if (k === 'co2_jet') {
        if (mode === 0) {
          // Sub-mode 0: Dual pressure burst windows
          return ((ke > 0.04 && ke < 0.42) || (ke > 0.52 && ke < 0.88)) ? 1.0 : 0;
        }
        if (mode === 1) {
          // Sub-mode 1: Center-out cryo sweep
          const sweepTarget = clamp18((ke - 0.12) / 0.72, 0, 1);
          return Math.abs(absU - sweepTarget) < 0.40 ? 1.0 : 0;
        }
        // Sub-mode 2: Inner core vs outer wing alternation
        const innerTurn = Math.floor(tSec * spd * 1.8) % 2 === 0;
        return (innerTurn ? absU < 0.55 : absU >= 0.45) ? 1.0 : 0;
      }

      // Default: cold_spark_fountain (Sparkular)
      if (mode === 0) {
        // Sub-mode 0: Continuous sine wave height modulation across stage span
        return +clamp18(0.65 + 0.42 * Math.sin(tSec * spd * 2.5 - absU * 2.8), 0.22, 1.15).toFixed(3);
      }
      if (mode === 1) {
        // Sub-mode 1: Center-out progressive fountain reveal
        return absU <= Math.max(0.35, ke * 1.65) ? 1.0 : 0;
      }
      // Sub-mode 2: Odd/even alternating fountain step
      return (idx % 2) === (Math.floor(tSec * spd * 2.8) % 2) ? 1.05 : 0.24;
    }

    // P6: 9-Type 3D Pyro/SFX Particle Spawner (Types 1=spark, 2=flame, 3=co2, 4=shell, 5=star, 6=crackle, 7=gold_mine, 8=willow_trail, 9=muzzle_flash)
    const LMP_FIREWORK_HDR_PALETTES18 = [
      [[2.4, 1.85, 0.65], [2.8, 2.55, 1.8], [1.8, 0.85, 0.2]],
      [[0.15, 2.2, 2.6], [2.5, 0.25, 1.45], [2.6, 2.6, 2.8]],
      [[2.6, 0.35, 0.2], [2.4, 1.9, 0.55], [0.35, 1.25, 2.8]],
      [[0.1, 2.5, 1.35], [1.65, 0.45, 2.6], [2.5, 2.1, 0.85]]
    ];

    function spawnNozzleParticles18(nozzle, kind, intensity = 1) {
      const pArr = liveShow18.particles;
      if (pArr.length > 4200) pArr.splice(0, pArr.length - 4200);
      const [nx, ny, nz] = nozzle.pos;
      const tiltX = Number(nozzle.tiltX) || 0;
      const tiltZ = Number(nozzle.tiltZ) || (kind === 'co2_jet' ? 0.22 : 0.10);
      if (kind === 'cold_spark_fountain') {
        if (Math.random() < 0.75 && pArr.length < 4200) {
          pArr.push({
            pType: 9,
            kind: 'muzzle_flash',
            x: nx,
            y: ny + 0.12,
            z: nz,
            px: nx,
            py: ny + 0.12,
            pz: nz,
            vx: 0,
            vy: 2.8,
            vz: 0,
            age: 0,
            maxAge: 0.08,
            baseSize: 0.72,
            size: 0.72,
            renderSize: 0.72,
            renderAlpha: 0.95,
            baseHdrColor: [2.8, 2.4, 1.5],
            hdrColor: [2.8, 2.4, 1.5],
            color: '#fff6cc',
            seed: Math.random() * 50
          });
        }
        const count = Math.max(5, Math.round(5 * clamp18(intensity, 0.6, 1.2)));
        for (let i = 0; i < count; i++) {
          const he = Math.random() * Math.PI * 2;
          const pt = Math.pow(Math.random(), 1.4) * 0.92;
          const vyBase = (8.8 + Math.random() * 4.4) * (0.75 + 0.25 * intensity);
          const hot = Math.random() > 0.35;
          const bSize = 0.36 + Math.random() * 0.24;
          const hdr = hot ? [2.8, 2.45, 1.65] : [2.4, 1.75, 0.65];
          pArr.push({
            pType: 1,
            kind: 'spark',
            x: nx + (Math.random() - 0.5) * 0.05,
            y: ny + Math.random() * 0.12,
            z: nz + (Math.random() - 0.5) * 0.05,
            vx: Math.cos(he) * pt + vyBase * tiltX * 0.35,
            vy: vyBase,
            vz: Math.sin(he) * pt + vyBase * tiltZ * 0.25,
            deckY: ny,
            age: 0,
            maxAge: 0.68 + Math.random() * 0.48,
            baseSize: bSize,
            size: bSize,
            renderSize: bSize,
            renderAlpha: 1.0,
            streakDt: 0.028,
            baseHdrColor: hdr,
            hdrColor: hdr,
            color: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffe680' : '#ffaa33',
            seed: Math.random() * 100
          });
        }
      } else if (kind === 'co2_jet') {
        const count = Math.max(4, Math.round(4 * clamp18(intensity, 0.6, 1.25)));
        for (let i = 0; i < count; i++) {
          const ge = (12.5 + Math.random() * 4.5) * (0.85 + 0.15 * intensity);
          const bSize = 1.15 + Math.random() * 0.55;
          pArr.push({
            pType: 3,
            kind: 'co2',
            x: nx + (Math.random() - 0.5) * 0.12,
            y: ny,
            z: nz + (Math.random() - 0.5) * 0.12,
            vx: tiltX * ge + (Math.random() - 0.5) * 1.4,
            vy: ge,
            vz: tiltZ * ge + (Math.random() - 0.5) * 1.4,
            age: 0,
            maxAge: 0.42 + Math.random() * 0.25,
            baseSize: bSize,
            size: bSize,
            renderSize: bSize,
            renderAlpha: 0.52,
            baseHdrColor: [0.82, 0.95, 1.0],
            hdrColor: [0.82, 0.95, 1.0],
            color: i % 2 === 0 ? '#f0fcff' : '#bae6fd',
            seed: Math.random() * 100
          });
        }
      } else if (kind === 'flame_jet') {
        const count = Math.max(4, Math.round(4 * clamp18(intensity, 0.6, 1.25)));
        for (let i = 0; i < count; i++) {
          const vyBase = (4.6 + Math.random() * 2.6) * (0.85 + 0.15 * intensity);
          const bSize = 1.35 + Math.random() * 0.50;
          pArr.push({
            pType: 2,
            kind: 'flame',
            x: nx + (Math.random() - 0.5) * 0.14,
            y: ny,
            z: nz + (Math.random() - 0.5) * 0.14,
            vx: (Math.random() - 0.5) * 0.95 + vyBase * tiltX * 0.45,
            vy: vyBase,
            vz: (Math.random() - 0.5) * 0.95 + vyBase * tiltZ * 0.35,
            age: 0,
            maxAge: 0.34 + Math.random() * 0.20,
            baseSize: bSize,
            size: bSize,
            renderSize: bSize,
            renderAlpha: 0.88,
            baseHdrColor: [1.4, 0.95, 0.35],
            hdrColor: [1.35, 0.95, 0.45],
            color: '#ff7b00',
            seed: Math.random() * 100
          });
        }
        if (Math.random() < 0.42 && pArr.length < 4200) {
          pArr.push({
            pType: 9,
            kind: 'muzzle_flash',
            x: nx,
            y: ny + 0.15,
            z: nz,
            px: nx,
            py: ny + 0.15,
            pz: nz,
            vx: 0,
            vy: 1.0,
            vz: 0,
            age: 0,
            maxAge: 0.12,
            baseSize: 1.85,
            size: 1.85,
            renderSize: 1.85,
            renderAlpha: 0.95,
            baseHdrColor: [2.6, 1.8, 0.75],
            hdrColor: [2.6, 1.8, 0.75],
            color: '#ffae42',
            seed: Math.random() * 50
          });
        }
      }
    }

    const LMP_BURST_STYLES18 = ['peony_fib', 'saturn_ring', 'chrysanthemum_dual', 'willow_crossette'];

    function isIndoorAerialRestricted18() {
      const sc = lumiState.structureConfig18;
      return Boolean(sc?.venueEnabled && sc?.venueType === 'indoor_hall' && !sc?.allowIndoorAerial);
    }

    function launchAerialPyro18(volleyCount = 4, forcedStyle = null, opts = {}) {
      if (!opts.allowIndoor && isIndoorAerialRestricted18()) {
        return 0;
      }
      const nozzles = getStageSfxNozzles18().confetti_cannon;
      const count = clamp18(volleyCount, 1, 8);
      const now = nowMs18();
      const pArr = liveShow18.particles;
      const palIdx = Math.floor(now / 250) % LMP_FIREWORK_HDR_PALETTES18.length;
      const pal = LMP_FIREWORK_HDR_PALETTES18[palIdx];
      for (let i = 0; i < count; i++) {
        const nz = nozzles[i % nozzles.length] || { pos: [(i - (count - 1) / 2) * 3.2, 0.8, -1.8] };
        const col = LMP_FIREWORK_COLORS18[(i + Math.floor(now / 250)) % LMP_FIREWORK_COLORS18.length];
        const col2 = LMP_FIREWORK_COLORS18[(i + 2 + Math.floor(now / 250)) % LMP_FIREWORK_COLORS18.length];
        const styleName = forcedStyle && LMP_BURST_STYLES18.includes(forcedStyle)
          ? forcedStyle
          : LMP_BURST_STYLES18[(i + Math.floor(now / 400)) % LMP_BURST_STYLES18.length];
        const sx = nz.pos[0] + (Math.random() - 0.5) * 0.25;
        const sy = nz.pos[1] + 0.45;
        const sz = nz.pos[2];
        const uNorm = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;

        liveShow18.aerialShells.push({
          pType: 4,
          x: sx,
          y: sy,
          z: sz,
          vx: uNorm * 2.4 + (Math.random() - 0.5) * 1.1,
          vy: 14.5 + Math.random() * 2.8,
          vz: -0.6 + (Math.random() - 0.5) * 0.9,
          targetY: 5.8 + Math.random() * 2.2,
          baseSize: 1.35,
          hdrColor: [2.6, 2.1, 1.1],
          palIdx: (palIdx + i) % LMP_FIREWORK_HDR_PALETTES18.length,
          color: col,
          color2: col2,
          burstStyle: styleName,
          trail: []
        });

        // Type 9: Mortar Muzzle Flash at launch base
        pArr.push({
          pType: 9,
          kind: 'muzzle_flash',
          x: sx,
          y: sy + 0.15,
          z: sz,
          px: sx,
          py: sy + 0.15,
          pz: sz,
          vx: 0,
          vy: 1.5,
          vz: 0,
          age: 0,
          maxAge: 0.14,
          baseSize: 2.8,
          size: 2.8,
          renderSize: 2.8,
          renderAlpha: 0.95,
          baseHdrColor: [2.6, 1.9, 0.9],
          hdrColor: [2.6, 1.9, 0.9],
          color: '#ffffff',
          seed: i * 13.7
        });

        // Type 7: Upward Gold Mine launch fan from mortar pad
        const mineHdr = pal[i % pal.length];
        for (let m = 0; m < 4; m++) {
          const fanAng = uNorm * 0.28 + (Math.random() - 0.5) * 0.18;
          const mineSpd = 14.5 + Math.random() * 3.5;
          pArr.push({
            pType: 7,
            kind: 'gold_mine',
            x: sx,
            y: sy,
            z: sz,
            px: sx,
            py: sy,
            pz: sz,
            vx: Math.sin(fanAng) * mineSpd,
            vy: Math.cos(fanAng) * mineSpd,
            vz: (Math.random() - 0.5) * 1.2,
            age: 0,
            maxAge: 0.95 + Math.random() * 0.25,
            baseSize: 1.45,
            size: 1.45,
            renderSize: 1.45,
            renderAlpha: 1.0,
            streakDt: 0.065,
            baseHdrColor: mineHdr,
            hdrColor: mineHdr,
            color: '#ffd166',
            seed: m * 7.1 + i
          });
        }
      }
      liveShow18.skyFlashUntilMs = now + 450;
      liveShow18.skyFlashColor = LMP_FIREWORK_COLORS18[Math.floor(now / 200) % LMP_FIREWORK_COLORS18.length];
      ensureLiveShowLoop18();
      return count;
    }

    // P6: 4 Aerial Burst Geometries (0=peony_fib, 1=saturn_ring, 2=chrysanthemum_dual, 3=willow_crossette)
    function detonateAerialShell18(shell) {
      const pArr = liveShow18.particles;
      if (pArr.length > 4200) pArr.splice(0, pArr.length - 3400);
      const style = String(shell?.burstStyle || 'peony_fib');
      const palIdx = Number.isFinite(shell?.palIdx) ? shell.palIdx % LMP_FIREWORK_HDR_PALETTES18.length : 0;
      const pal = LMP_FIREWORK_HDR_PALETTES18[palIdx] || LMP_FIREWORK_HDR_PALETTES18[0];
      const goldenAngle = Math.PI * (1 + Math.sqrt(5));

      // Type 9: Intense Apex Sky Flash (size = 7.5, maxAge = 0.22, HDR [3.2, 2.9, 2.2])
      pArr.push({
        pType: 9,
        kind: 'muzzle_flash',
        x: shell.x,
        y: shell.y,
        z: shell.z,
        px: shell.x,
        py: shell.y,
        pz: shell.z,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        maxAge: 0.22,
        baseSize: 7.5,
        size: 7.5,
        renderSize: 7.5,
        renderAlpha: 0.95,
        baseHdrColor: [3.2, 2.9, 2.2],
        hdrColor: [3.2, 2.9, 2.2],
        color: '#fff8dc',
        seed: Math.random() * 50
      });

      if (style === 'saturn_ring' || style === 'ring') {
        const tilt = (Math.random() - 0.5) * 0.55;
        const cosT = Math.cos(tilt);
        const sinT = Math.sin(tilt);
        for (let i = 0; i < 72; i++) {
          const theta = (i / 72) * Math.PI * 2;
          const spd = 11.2 + (Math.random() - 0.5) * 0.8;
          const hdr = pal[0];
          pArr.push({
            pType: 5,
            kind: 'firework_star',
            burstStyle: style,
            isWillow: false,
            canCrossette: false,
            didSplit: false,
            x: shell.x,
            y: shell.y,
            z: shell.z,
            px: shell.x,
            py: shell.y,
            pz: shell.z,
            vx: Math.cos(theta) * spd,
            vy: Math.sin(theta) * spd * cosT + 1.5,
            vz: Math.sin(theta) * spd * sinT,
            age: 0,
            maxAge: 1.45 + Math.random() * 0.35,
            baseSize: 1.1,
            size: 1.1,
            renderSize: 1.1,
            renderAlpha: 1.0,
            streakDt: 0.052,
            baseHdrColor: hdr,
            hdrColor: hdr,
            color: '#ffe600',
            seed: Math.random() * 100
          });
        }
        for (let i = 0; i < 68; i++) {
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2 * Math.PI;
          const phi = Math.acos(2 * v - 1);
          const spd = 5.6 + Math.random() * 2.6;
          const sinPhi = Math.sin(phi);
          const hdr = pal[1];
          pArr.push({
            pType: 5,
            kind: 'firework_star',
            burstStyle: style,
            isWillow: false,
            canCrossette: false,
            didSplit: false,
            x: shell.x,
            y: shell.y,
            z: shell.z,
            px: shell.x,
            py: shell.y,
            pz: shell.z,
            vx: sinPhi * Math.cos(theta) * spd,
            vy: Math.cos(phi) * spd + 1.2,
            vz: sinPhi * Math.sin(theta) * spd,
            age: 0,
            maxAge: 1.25 + Math.random() * 0.40,
            baseSize: 0.95,
            size: 0.95,
            renderSize: 0.95,
            renderAlpha: 1.0,
            streakDt: 0.052,
            baseHdrColor: hdr,
            hdrColor: hdr,
            color: shell.color2 || '#00f0ff',
            seed: Math.random() * 100
          });
        }
      } else {
        const starCount = style === 'peony_fib' ? 150 : 165;
        for (let i = 0; i < starCount; i++) {
          const frac = (i + 0.5) / starCount;
          const phi = Math.acos(1 - 2 * frac);
          const theta = goldenAngle * i + (Math.random() - 0.5) * 0.2;
          const sinPhi = Math.sin(phi);
          const dx = sinPhi * Math.cos(theta);
          const dy = Math.cos(phi);
          const dz = sinPhi * Math.sin(theta);
          const layerScale = style === 'chrysanthemum_dual' && i % 4 === 0 ? 0.58 : 1.0;
          const spd = (8.8 + Math.random() * 5.2) * layerScale;
          const isWillow = style === 'peony_fib' || style === 'willow_crossette' || (style === 'chrysanthemum_dual' && i % 3 === 0);
          const canCrossette = style === 'willow_crossette' && i % 6 === 0;
          const maxAge = isWillow ? 1.85 + Math.random() * 0.95 : 1.25 + Math.random() * 0.75;
          const bSize = i % 4 === 0 ? 1.22 : 0.92;
          const hdr = style === 'peony_fib'
            ? (i % 5 === 0 ? pal[0] : LMP_FIREWORK_HDR_PALETTES18[0][i % 3])
            : pal[i % pal.length];
          const starCol = i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? (shell.color || '#ffd166') : (shell.color2 || '#ffaa33');

          pArr.push({
            pType: 5,
            kind: 'firework_star',
            burstStyle: style,
            isWillow,
            canCrossette,
            didSplit: false,
            x: shell.x,
            y: shell.y,
            z: shell.z,
            px: shell.x,
            py: shell.y,
            pz: shell.z,
            vx: dx * spd,
            vy: dy * spd + (style === 'peony_fib' ? 2.2 : 1.8),
            vz: dz * spd,
            age: 0,
            maxAge,
            baseSize: bSize,
            size: bSize,
            renderSize: bSize,
            renderAlpha: 1.0,
            streakDt: isWillow ? 0.085 : 0.052,
            baseHdrColor: hdr,
            hdrColor: hdr,
            color: starCol,
            seed: Math.random() * 100
          });
        }
      }
      const now = nowMs18();
      liveShow18.skyFlashUntilMs = now + 420;
      liveShow18.skyFlashColor = shell.color || '#ffe600';
      liveShow18._sfxSkyBurst = {
        active: true,
        pos: [shell.x, shell.y, shell.z],
        color: shell.color || '#ffe600',
        power: 14.5
      };
    }

    function stepParticlesAndShells18(dt, nowMs) {
      const shells = liveShow18.aerialShells;
      const pArr = liveShow18.particles;
      const tSec = nowMs * 0.001;
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        s.trail.push([s.x, s.y, s.z]);
        if (s.trail.length > 8) s.trail.shift();
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;
        s.vy -= 9.2 * dt;
        // Type 8: Rising comet micro-trail (Zd)
        if (Math.random() < 0.88 && pArr.length < 4200) {
          pArr.push({
            pType: 8,
            kind: 'willow_trail',
            x: s.x - s.vx * dt * Math.random(),
            y: s.y - s.vy * dt * Math.random(),
            z: s.z - s.vz * dt * Math.random(),
            px: s.x,
            py: s.y,
            pz: s.z,
            vx: (Math.random() - 0.5) * 1.1,
            vy: -0.6 - Math.random() * 0.8,
            vz: (Math.random() - 0.5) * 1.1,
            age: 0,
            maxAge: 0.34 + Math.random() * 0.22,
            baseSize: 0.48,
            size: 0.48,
            renderSize: 0.48,
            renderAlpha: 0.85,
            baseHdrColor: [2.3, 1.75, 0.75],
            hdrColor: [2.3, 1.75, 0.75],
            color: '#ffe680',
            seed: i + Math.random() * 20
          });
        }
        if (s.y >= s.targetY || s.vy <= 0.6) {
          detonateAerialShell18(s);
          shells.splice(i, 1);
        }
      }

      for (let i = pArr.length - 1; i >= 0; i--) {
        const p = pArr[i];
        p.age += dt;
        if (p.age >= p.maxAge) {
          pArr.splice(i, 1);
          continue;
        }
        p.px = p.x;
        p.py = p.y;
        p.pz = p.z;
        const u = clamp18(p.age / Math.max(0.04, p.maxAge), 0, 1);

        if (p.pType === 7 || p.kind === 'gold_mine') {
          p.vy -= 11.5 * dt;
          const drag = Math.max(0.1, 1 - 0.55 * dt);
          p.vx *= drag;
          p.vz *= drag;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.renderAlpha = 1 - Math.pow(u, 2.2);
          p.renderSize = (p.baseSize || 1.45) * (1.1 - u * 0.4);
          p.streakDt = 0.065;
          if (Math.random() < 0.88 && pArr.length < 4200) {
            const bHdr = p.baseHdrColor || [2.4, 1.85, 0.65];
            pArr.push({
              pType: 8,
              kind: 'willow_trail',
              x: p.x - p.vx * dt * Math.random(),
              y: p.y - p.vy * dt * Math.random(),
              z: p.z - p.vz * dt * Math.random(),
              px: p.x,
              py: p.y,
              pz: p.z,
              vx: (Math.random() - 0.5) * 1.1,
              vy: -0.6 - Math.random() * 0.8,
              vz: (Math.random() - 0.5) * 1.1,
              age: 0,
              maxAge: 0.42 + Math.random() * 0.28,
              baseSize: 0.62,
              size: 0.62,
              renderSize: 0.62,
              renderAlpha: 0.85,
              baseHdrColor: bHdr,
              hdrColor: bHdr,
              color: '#ffd166',
              seed: p.seed + Math.random() * 10
            });
          }
        } else if (p.kind === 'spark' || p.pType === 1) {
          p.vy -= 13.5 * dt;
          const drag = Math.max(0.1, 1 - 1.15 * dt);
          p.vx *= drag;
          p.vz *= drag;
          p.vx += Math.sin(p.age * 32 + p.seed) * 0.85 * dt;
          p.vz += Math.cos(p.age * 28 + p.seed * 1.7) * 0.85 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          const floorY = (p.deckY || 0.45) + 0.03;
          if (p.y < floorY && p.vy < 0) {
            p.y = floorY;
            p.vy = -p.vy * (0.32 + (Math.floor(p.seed) % 3) * 0.08);
            p.vx *= 1.35;
            p.vz *= 1.35;
          }
          const isCrackle = u > 0.58;
          const crackle = isCrackle
            ? (Math.sin(p.age * 78 + p.seed * 5.3) > 0.15 ? 1.35 : 0.25)
            : (0.85 + 0.15 * Math.sin(p.age * 42 + p.seed));
          p.renderAlpha = (1 - Math.pow(u, 1.85)) * crackle;
          p.renderSize = (p.baseSize || 0.48) * (isCrackle ? 1.15 : 1 - u * 0.35);
          const vt = Math.max(0, 1 - u);
          p.hdrColor = [
            2.4 * Math.pow(vt, 0.25),
            1.85 * Math.pow(vt, 0.85),
            1.25 * Math.pow(vt, 2.2)
          ];
          p.streakDt = 0.028 * (1 - u * 0.35);
          if (u > 0.78 && !p._crackled && Math.random() < 0.08 && pArr.length < 4200) {
            p._crackled = true;
            pArr.push({
              pType: 6,
              kind: 'crackle_star',
              x: p.x,
              y: p.y,
              z: p.z,
              px: p.x,
              py: p.y,
              pz: p.z,
              vx: (Math.random() - 0.5) * 3.2,
              vy: 1.2 + Math.random() * 2.2,
              vz: (Math.random() - 0.5) * 3.2,
              age: 0,
              maxAge: 0.16,
              baseSize: 0.72,
              size: 0.72,
              renderSize: 0.72,
              renderAlpha: 1.0,
              streakDt: 0.04,
              baseHdrColor: [2.8, 2.5, 1.8],
              hdrColor: [2.8, 2.5, 1.8],
              color: '#ffffff',
              seed: p.seed
            });
          }
        } else if (p.kind === 'co2' || p.pType === 3) {
          const drag = Math.max(0.1, 1 - 3.6 * dt);
          p.vx *= drag;
          p.vy *= drag;
          p.vz *= drag;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.renderSize = (p.baseSize || 1.35) * (1 + u * 3.2);
          p.size = p.renderSize;
          p.renderAlpha = Math.sin(u * Math.PI) * (1 - u) * 0.52;
          p.hdrColor = [0.82, 0.95, 1.0];
        } else if (p.kind === 'flame' || p.pType === 2) {
          p.vy += 2.2 * dt;
          p.vx += Math.sin(tSec * 16 + p.seed) * 1.8 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.renderSize = (p.baseSize || 1.55) * (1.15 - u * 0.55);
          p.size = p.renderSize;
          p.renderAlpha = (1 - Math.pow(u, 1.5)) * 0.88;
          const rem = Math.max(0, 1 - u);
          p.hdrColor = [
            1.35,
            Math.max(0.08, 0.95 * Math.pow(rem, 1.45)),
            Math.max(0, 0.45 * Math.pow(rem, 3.2))
          ];
          p.color = u < 0.22 ? '#fff7ae' : u < 0.52 ? '#ff8800' : u < 0.82 ? '#d92200' : '#3a2622';
        } else if (p.kind === 'firework_star' || p.pType === 5 || p.pType === 6) {
          const isW = Boolean(p.isWillow);
          const drag = Math.max(0.1, 1 - (isW ? 1.35 : 1.85) * dt);
          p.vx *= drag;
          p.vz *= drag;
          p.vy = p.vy * drag - (isW ? 6.2 : 4.4) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          const flashBoost = Math.max(0, 1 - u * 5.5) * 1.4;
          const bHdr = p.baseHdrColor || [2.4, 1.85, 0.65];
          p.hdrColor = [bHdr[0] + flashBoost, bHdr[1] + flashBoost, bHdr[2] + flashBoost];
          const twinkle = u > 0.58 ? (Math.sin(p.age * 68 + p.seed * 3.7) > 0 ? 1.25 : 0.22) : 1;
          p.renderAlpha = (1 - Math.pow(u, isW ? 1.55 : 1.75)) * twinkle;
          p.renderSize = (p.baseSize || 1.0) * (1.12 - u * 0.48);
          p.streakDt = isW ? 0.085 : 0.052;

          if (isW && Math.random() < 0.52 && u < 0.88 && pArr.length < 4200) {
            pArr.push({
              pType: 8,
              kind: 'willow_trail',
              x: p.x,
              y: p.y,
              z: p.z,
              px: p.px,
              py: p.py,
              pz: p.pz,
              vx: p.vx * 0.08 + (Math.random() - 0.5) * 0.45,
              vy: -0.85 - Math.random() * 0.6,
              vz: p.vz * 0.08 + (Math.random() - 0.5) * 0.45,
              age: 0,
              maxAge: 0.38 + Math.random() * 0.25,
              baseSize: 0.42,
              size: 0.42,
              renderSize: 0.42,
              renderAlpha: 0.85,
              baseHdrColor: [2.1, 1.5, 0.55],
              hdrColor: [2.1, 1.5, 0.55],
              color: '#ffd166',
              seed: p.seed
            });
          } else if (!isW && Math.random() < 0.24 && u < 0.55 && pArr.length < 4200) {
            pArr.push({
              pType: 8,
              kind: 'willow_trail',
              x: p.x,
              y: p.y,
              z: p.z,
              px: p.px,
              py: p.py,
              pz: p.pz,
              vx: (Math.random() - 0.5) * 0.35,
              vy: -0.5,
              vz: (Math.random() - 0.5) * 0.35,
              age: 0,
              maxAge: 0.24,
              baseSize: 0.36,
              size: 0.36,
              renderSize: 0.36,
              renderAlpha: 0.85,
              baseHdrColor: [bHdr[0] * 0.85, bHdr[1] * 0.85, bHdr[2] * 0.85],
              hdrColor: [bHdr[0] * 0.85, bHdr[1] * 0.85, bHdr[2] * 0.85],
              color: p.color || '#ffd166',
              seed: p.seed
            });
          }
          if (p.canCrossette && !p.didSplit && u > 0.62 && pArr.length < 4150) {
            p.didSplit = true;
            const dirs = [[1, 0.3, 0], [-1, 0.3, 0], [0, 0.3, 1], [0, 0.3, -1]];
            for (const [cx, cy, cz] of dirs) {
              pArr.push({
                pType: 6,
                kind: 'crackle_star',
                x: p.x,
                y: p.y,
                z: p.z,
                px: p.x,
                py: p.y,
                pz: p.z,
                vx: cx * 3.4,
                vy: cy * 3.4,
                vz: cz * 3.4,
                age: 0,
                maxAge: 0.28,
                baseSize: 0.82,
                size: 0.82,
                renderSize: 0.82,
                renderAlpha: 1.0,
                streakDt: 0.045,
                baseHdrColor: [2.8, 2.5, 1.8],
                hdrColor: [2.8, 2.5, 1.8],
                color: '#ffffff',
                seed: p.seed
              });
            }
          }
        } else if (p.pType === 8 || p.kind === 'willow_trail') {
          p.vy -= 1.8 * dt;
          const drag = Math.max(0.1, 1 - 2.2 * dt);
          p.vx *= drag;
          p.vz *= drag;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          const flicker = 0.55 + 0.45 * Math.sin(p.age * 52 + p.seed * 2.3);
          p.renderAlpha = (1 - u) * flicker * 0.85;
          p.renderSize = (p.baseSize || 0.48) * (1 - u * 0.5);
          const bHdr = p.baseHdrColor || [2.3, 1.75, 0.75];
          p.hdrColor = [bHdr[0], bHdr[1] * (1 - u * 0.35), bHdr[2] * (1 - u * 0.65)];
        } else {
          // Type 9: Muzzle / Sky Flash (Kd)
          p.y += p.vy * dt;
          p.renderSize = (p.baseSize || 2.8) * (1 + u * 1.8);
          p.renderAlpha = Math.pow(1 - u, 2.2) * 0.95;
          p.hdrColor = p.baseHdrColor || [2.8, 2.4, 1.5];
        }
      }

      // Update dynamic 3D stage/sky point light pulses (sfxStageGlow & sfxSkyBurst)
      const activeNz = liveShow18.activeNozzles || [];
      if (activeNz.length > 0) {
        const nz0 = activeNz[0];
        liveShow18._sfxStageGlow = {
          active: true,
          pos: [nz0.pos[0], nz0.pos[1] + 1.4, nz0.pos[2]],
          color: nz0.color || '#ff9900',
          power: +(6.5 + nz0.level * 5.5).toFixed(2)
        };
      } else {
        liveShow18._sfxStageGlow.active = false;
        liveShow18._sfxStageGlow.power = 0;
      }
      if (nowMs >= liveShow18.skyFlashUntilMs) {
        liveShow18._sfxSkyBurst.active = false;
        liveShow18._sfxSkyBurst.power = 0;
      } else {
        const rem = clamp18((liveShow18.skyFlashUntilMs - nowMs) / 420, 0, 1);
        liveShow18._sfxSkyBurst.active = true;
        liveShow18._sfxSkyBurst.power = +(14.5 * rem).toFixed(2);
      }
    }

    function evalShowPanTilt18(sIdx, phasePan, phaseTilt, px, py, pz) {
      let panAngle = 0;
      let tiltWave = 0;
      if (sIdx === 1) {
        panAngle = Math.sin(phasePan + (px + py) * 0.3) * (Math.PI / 3.4);
        tiltWave = Math.sin(phaseTilt + (px + py) * 0.3);
      } else if (sIdx === 2) {
        panAngle = Math.sin(phasePan + (Math.abs(px) + py) * 0.4) * (Math.PI / 3.0) * (px >= 0 ? 1 : -1);
        tiltWave = Math.cos(phaseTilt + (Math.abs(px) + py) * 0.4);
      } else if (sIdx === 3) {
        const dir = Math.sin((px + py) * 5) > 0 ? 1 : -1;
        panAngle = dir * Math.sin(phasePan * 2.0) * (Math.PI / 2.8);
        tiltWave = Math.cos(phaseTilt * 2.0 + (Math.abs(px) + py) * 0.2);
      } else if (sIdx === 4) {
        panAngle = Math.sin(phasePan * 1.5 + px * 0.3 + py * 0.4) * (Math.PI / 2.8);
        tiltWave = Math.cos(phasePan * 1.5 + px * 0.3 + py * 0.4);
      } else if (sIdx === 5) {
        panAngle = Math.sin(phasePan * 0.8) * (Math.PI / 4.0) * (px >= 0 ? 1 : -1);
        tiltWave = Math.sin(phaseTilt * 0.8 + (Math.abs(px) + py) * 0.2);
      } else {
        panAngle = Math.sin(phasePan * 1.5 + px * 0.5 + py * 0.4 + pz * 0.3) * (Math.PI / 2.6);
        tiltWave = Math.cos(phaseTilt * 1.8 + px * 0.5 + py * 0.4 + pz * 0.3);
      }
      return { panAngle, tiltWave };
    }

    function tickLiveShow18(nowMs = nowMs18()) {
      const ls = liveShow18;
      const eng = S.engine;
      const dt = ls.lastTickMs > 0 ? clamp18((nowMs - ls.lastTickMs) / 1000, 0.001, 0.1) : 1 / 60;
      ls.lastTickMs = nowMs;

      const manualPyroActive = nowMs < ls.sparkUntilMs || nowMs < ls.co2UntilMs || nowMs < ls.flameUntilMs || ls.particles.length > 0 || ls.aerialShells.length > 0;
      if (!ls.running && !manualPyroActive) {
        ls.activeNozzles = [];
        ls._floorProjections = [];
        ls._deckGlints = [];
        ls._laserRenderData = [];
        ls._screenHaloPools = [];
        return false;
      }

      const spd = clamp18(ls.speed || 2.0, 0.2, 5.0);
      if (ls.running) {
        ls.showElapsedSec += dt;
        ls.motorPhasePan += dt * spd;
        ls.motorPhaseTilt += dt * spd * 0.7;
      }
      const tSec = ls.showElapsedSec || nowMs / 1000;
      const showIdx = ls.aiAuto ? (Math.floor(tSec / 8) % 6) + 1 : clamp18(Math.round(ls.activeShow) || 1, 1, 6);
      if (showIdx !== ls.effectiveShow) {
        ls.transitionFromShow = ls.effectiveShow || showIdx;
        ls.transitionStartSec = tSec;
        ls.effectiveShow = showIdx;
      }
      const transDur = clamp18(1.15 / spd, 0.55, 1.65);
      ls.transitionAlpha = quinticSmooth18((tSec - (ls.transitionStartSec || 0)) / transDur);

      // 1. Evaluate 7-Phase Auto SFX Sequencer (W = 0..6) + Manual Pyro Triggers
      const nozzlesByType = getStageSfxNozzles18();
      const activeNozzles = [];
      const phaseDuration = 4.5 / Math.max(0.4, spd * 0.5);
      const W = Math.floor(tSec / phaseDuration) % 7;
      const phaseFrac = (tSec % phaseDuration) / phaseDuration;
      ls.sfxPhase = W;
      const subMode = Math.floor(tSec / (phaseDuration / 3)) % 3;

      const sparkAuto = ls.running && ls.sfxOn && !ls.blackout && (W === 0 || W === 3 || W === 5 || W === 6);
      const flameAuto = ls.running && ls.sfxOn && !ls.blackout && (W === 1 || W === 3 || W === 4 || W === 6);
      const co2Auto = ls.running && ls.sfxOn && !ls.blackout && (W === 2 || W === 4 || W === 5 || W === 6);
      const aerialAuto = ls.running && ls.sfxOn && !ls.blackout && !isIndoorAerialRestricted18() && (W === 6 || showIdx === 4 || showIdx === 6);

      if (sparkAuto || nowMs < ls.sparkUntilMs) {
        const list = nozzlesByType.cold_spark_fountain;
        list.forEach((nz, idx) => {
          const lvl = nowMs < ls.sparkUntilMs
            ? 1
            : evalPyroChoreoGate18('cold_spark_fountain', idx, list.length, nz.uNorm, phaseFrac, subMode, tSec, spd);
          if (lvl > 0.15) {
            activeNozzles.push({ ...nz, level: lvl, color: '#ffd166', heightM: 4.2 * lvl, angle: 11 });
            spawnNozzleParticles18(nz, 'cold_spark_fountain', lvl);
          }
        });
      }
      if (co2Auto || nowMs < ls.co2UntilMs) {
        const list = nozzlesByType.co2_jet;
        const pulseGate = nowMs < ls.co2UntilMs ? 1 : (Math.sin(tSec * spd * 3.8) > -0.15 ? 1 : 0);
        if (pulseGate > 0) {
          list.forEach((nz, idx) => {
            const lvl = nowMs < ls.co2UntilMs
              ? 1
              : evalPyroChoreoGate18('co2_jet', idx, list.length, nz.uNorm, phaseFrac, subMode, tSec, spd);
            if (lvl > 0.15) {
              activeNozzles.push({ ...nz, level: lvl, color: '#c8f6ff', heightM: 6.8 * lvl, angle: 15 });
              spawnNozzleParticles18(nz, 'co2_jet', lvl);
            }
          });
        }
      }
      if (flameAuto || nowMs < ls.flameUntilMs) {
        const list = nozzlesByType.flame_jet;
        const flameGate = nowMs < ls.flameUntilMs ? 1 : (Math.sin(tSec * spd * 4.5) > -0.25 ? 1 : 0);
        if (flameGate > 0) {
          list.forEach((nz, idx) => {
            const lvl = nowMs < ls.flameUntilMs
              ? 1
              : evalPyroChoreoGate18('flame_jet', idx, list.length, nz.uNorm, phaseFrac, subMode, tSec, spd);
            if (lvl > 0.15) {
              activeNozzles.push({ ...nz, level: lvl, color: '#ff6a00', heightM: 4.8 * lvl, angle: 14 });
              spawnNozzleParticles18(nz, 'flame_jet', lvl);
            }
          });
        }
      }
      if (aerialAuto && nowMs - ls.lastAerialAutoMs > (W === 6 ? 1850 : 2650)) {
        ls.lastAerialAutoMs = nowMs;
        launchAerialPyro18(W === 6 ? 4 : 2);
      }

      ls.activeNozzles = activeNozzles;
      stepParticlesAndShells18(dt, nowMs);

      const dmxProg = lumiState.dmxProgrammer18;
      const floorProjections = [];
      const deckGlints = [];
      const MAX_DECK_GLINTS = 8;
      const deckY = Math.max(0.42, (eng?.stageBounds?.min?.[1] || 0) + 0.46);
      let activeLightEnergySum = 0;

      // 2. Drive 3D DMX Lights (Pan/Tilt waves, Quintic C2 Show Transitions, 5 Fan Laws, 4 PAR Chases, Multi-Cell Blinders, 5-Profile Shaders)
      if (eng && Array.isArray(eng.lights) && ls.running && !dmxProg?.freezeDmx) {
        const customBeamPal = dmxProg?.groupPalettes?.beam;
        const customWashPal = dmxProg?.groupPalettes?.wash;
        const customParPal = dmxProg?.groupPalettes?.par;
        const beamPal = Array.isArray(customBeamPal) && customBeamPal.length ? customBeamPal : LMP_BEAM_PALETTES18[(showIdx - 1) % LMP_BEAM_PALETTES18.length];
        const prevBeamPal = LMP_BEAM_PALETTES18[((ls.transitionFromShow || showIdx) - 1) % LMP_BEAM_PALETTES18.length];
        const washPal = Array.isArray(customWashPal) && customWashPal.length ? customWashPal : LMP_WASH_PALETTES18[(showIdx - 1) % LMP_WASH_PALETTES18.length];
        const prevWashPal = LMP_WASH_PALETTES18[((ls.transitionFromShow || showIdx) - 1) % LMP_WASH_PALETTES18.length];
        const parPal = Array.isArray(customParPal) && customParPal.length ? customParPal : beamPal;
        const total = eng.lights.length;
        const phasePan = ls.motorPhasePan;
        const phaseTilt = ls.motorPhaseTilt;
        const transU = ls.transitionAlpha ?? 1;

        // Sync procedural LED surface accent & effect with active show
        eng.accent = samplePaletteGlide18(beamPal, tSec * 0.45);
        if (typeof eng.effect === 'number') eng.effect = (showIdx - 1) % 4;

        const defaultLaws = ['v_converge', 'v_diverge', 'x_cross', 'parallel_wing', 'parallel_zero', 'x_cross'];
        const reqFanLaw = (ls.fanLaw && ls.fanLaw !== 'auto') ? ls.fanLaw : ((ls.beamFanLaw && ls.beamFanLaw !== 'auto') ? ls.beamFanLaw : 'auto');
        const activeFanLaw = reqFanLaw !== 'auto' ? reqFanLaw : defaultLaws[(showIdx - 1) % defaultLaws.length];
        const hasDedicatedStrobe = eng.lights.some((x, i) => x && (classifyFixture18(x, i, total) === 'strobe' || Boolean(x.strobeCapable18)));

        eng.lights.forEach((l, idx) => {
          if (!l) return;
          if (!l._origShow18) {
            l._origShow18 = {
              target: Array.isArray(l.target) ? l.target.slice() : [0, 0, 0],
              color: l.color || '#38bdf8',
              power: Number.isFinite(+l.power) ? +l.power : 3.5,
              angle: Number.isFinite(+l.angle) ? +l.angle : 14,
              enabled: l.enabled !== false,
              sweep: !!l.sweep,
              fx: l.fx || 'steady',
              beamProfile18: l.beamProfile18 ?? 0,
              gobo9: l.gobo9 ? { ...l.gobo9 } : null,
              optics: Object.fromEntries(['aperture', 'fixtureProfile18', 'profileId18', 'coneLenScale18', '_blinderBlastScale18', 'dmxGroup18', '_liveCat18', '_isBlinder18'].filter((key) => Object.hasOwn(l, key)).map((key) => [key, l[key]]))
            };
          }
          const cat = classifyFixture18(l, idx, total);
          l._liveCat18 = cat;
          const grpId = assignFixtureGroup18(l, idx, total);
          l.dmxGroup18 = grpId;
          const grpCfg = dmxProg?.groups?.[grpId] || { panOffsetDeg: 0, tiltOffsetDeg: 0, fanningSpreadDeg: 0, dimmer: 100 };

          if (ls.blackout || (Number(grpCfg.dimmer) ?? 100) <= 0) {
            l.power = 0;
            l.enabled = false;
            l._isBlinder18 = false;
            return;
          }
          const isFloorMount = (Number(l.pos?.[1]) || 5) < 1.3;
          if (!ls.lightsOn) {
            const allowBlinderOnly = ls.blindersOn && (cat === 'blinder' || (isFloorMount && idx % 4 === 3));
            const allowStrobeOnly = ls.strobe && (cat === 'strobe' || Boolean(l.strobeCapable18) || !hasDedicatedStrobe);
            const allowLaserOnly = ls.laserOn && cat === 'laser';
            if (!allowBlinderOnly && !allowStrobeOnly && !allowLaserOnly) {
              l.power = 0;
              l.enabled = false;
              l._isBlinder18 = false;
              return;
            }
          }
          l.enabled = true;
          l.sweep = false;
          l.fx = 'steady';

          const px = Number(l.pos?.[0]) || 0;
          const py = Number(l.pos?.[1]) || 5;
          const pz = Number(l.pos?.[2]) || 0;

          // Quintic C2 blended Pan & Tilt target wave equations
          const curWave = evalShowPanTilt18(showIdx, phasePan, phaseTilt, px, py, pz);
          let panAngle = curWave.panAngle;
          let tiltWave = curWave.tiltWave;
          if (transU < 0.999 && ls.transitionFromShow !== showIdx) {
            const oldWave = evalShowPanTilt18(ls.transitionFromShow || 1, phasePan, phaseTilt, px, py, pz);
            panAngle = oldWave.panAngle + (curWave.panAngle - oldWave.panAngle) * transU;
            tiltWave = oldWave.tiltWave + (curWave.tiltWave - oldWave.tiltWave) * transU;
          }

          // Blend with 5 Beam Group Fan Laws for moving heads
          if (cat === 'beam' || cat === 'spot') {
            const fanRes = evalBeamFanLaw18(activeFanLaw, px, idx, total, phasePan, phaseTilt, 1.0);
            const fanWeight = reqFanLaw !== 'auto' ? 0.65 : 0.28;
            panAngle = panAngle * (1 - fanWeight) + fanRes.panAngle * fanWeight;
            tiltWave = tiltWave * (1 - fanWeight) + fanRes.tiltWave * fanWeight;
          }

          // Apply DMX Group Programmer Pan/Tilt/Fanning offsets (G1..G5)
          const normSign = px === 0 ? ((idx / Math.max(1, total - 1)) - 0.5) * 2 : clamp18(px / 6.0, -1, 1);
          const panOffRad = (((Number(grpCfg.panOffsetDeg) || 0) + normSign * (Number(grpCfg.fanningSpreadDeg) || 0)) * Math.PI) / 180;
          const tiltOffM = ((Number(grpCfg.tiltOffsetDeg) || 0) / 45) * 2.2;
          panAngle += panOffRad;

          if (py > 1.6) {
            l.target = [
              +(px * 0.72 + Math.sin(panAngle) * 7.2).toFixed(3),
              +(Math.max(0.05, 0.35 + tiltWave * 1.25 + tiltOffM)).toFixed(3),
              +(1.35 + Math.cos(panAngle) * 3.6 + tiltWave * 2.1).toFixed(3)
            ];
          } else {
            l.target = [
              +(px * 0.88 + Math.sin(panAngle) * 5.2).toFixed(3),
              +(4.4 + tiltWave * 2.1 + tiltOffM).toFixed(3),
              +(pz + 2.8 + Math.cos(panAngle) * 2.4).toFixed(3)
            ];
          }

          const beamGlide = samplePaletteGlide18(beamPal, idx * 0.38 + tSec * spd * 0.48);
          const washGlide = samplePaletteGlide18(washPal, idx * 0.35 + tSec * spd * 0.36);
          const baseBeamCol = ls.multicolor
            ? (transU < 0.999 ? mixHex18(samplePaletteGlide18(prevBeamPal, idx * 0.38 + tSec * spd * 0.48), beamGlide, transU) : beamGlide)
            : beamPal[0];
          const baseWashCol = ls.multicolor
            ? (transU < 0.999 ? mixHex18(samplePaletteGlide18(prevWashPal, idx * 0.35 + tSec * spd * 0.36), washGlide, transU) : washGlide)
            : washPal[0];
          const dimmerScale = clamp18((Number(grpCfg.dimmer) ?? 100) / 100, 0, 1.5);
          const spreadFactor = clamp18(Number(dmxProg?.optics?.spreadFactor) || 1.0, 0.4, 2.5);

          if (cat === 'laser') {
            if (!ls.laserOn) {
              l.power = 0;
              l.enabled = false;
              l.gobo9 = null;
              return;
            }
            const customLaserPal = dmxProg?.groupPalettes?.laser;
            const laserPal = Array.isArray(customLaserPal) && customLaserPal.length ? customLaserPal : LMP_LASER_PALETTES18;
            l.color = ls.multicolor ? samplePaletteGlide18(laserPal, idx * 0.5 + tSec * spd * 0.6) : laserPal[0];
            l.power = +(3.4 * dimmerScale).toFixed(2);
            l.angle = 4.5;
            l.fixtureProfile18 = 'ilda_laser_v1';
            l.profileId18 = 'ilda_laser_v1';
            l.beamProfile18 = 0;
            l.gobo9 = null;
          } else if (cat === 'strobe') {
            const strobeActive = Boolean(ls.strobe);
            if (!strobeActive) {
              l.power = 0;
              l.enabled = false;
              l.gobo9 = null;
              return;
            }
            const grpNum = Number(String(grpId || 'G1').replace(/\D/g, '')) || 1;
            const stRes = evalStrobePulse18('strobe', idx, grpNum, nowMs);
            l.color = '#ffffff';
            l.power = stRes.gate ? +(13.5 * dimmerScale).toFixed(2) : 0.02;
            l.angle = +(32 * spreadFactor).toFixed(1);
            l.fixtureProfile18 = 'atomic_strobe_v1';
            l.profileId18 = 'atomic_strobe_v1';
            l.beamProfile18 = 2;
            l.gobo9 = null;
          } else if (cat === 'par' || cat === 'bar') {
            const chaseMode = (ls.parChaseMode && ls.parChaseMode !== 'auto')
              ? ls.parChaseMode
              : (dmxProg?.parChaseMode || (showIdx === 1 ? 'carousel' : showIdx === 2 ? 'mirror_domino' : showIdx === 3 ? 'dual_carousel' : 'gala_sparkle'));
            const chaseRes = computeParUplightChase18(idx, total, tSec, spd, chaseMode, parPal, {
              useAlternateColor: Boolean(dmxProg?.parUseAlternateColor),
              secondaryColor: dmxProg?.parSecondaryColor || '#ffe600',
              isContour: Boolean(l._isWallContour18 || l.parLayout === 'u_shape')
            });
            l.color = ls.multicolor ? chaseRes.color : (dmxProg?.parUseAlternateColor && idx % 2 === 1 ? (dmxProg.parSecondaryColor || '#ffe600') : parPal[0]);
            l.power = +(Math.max(0.35, chaseRes.level * (cat === 'bar' ? 4.0 : 6.2)) * dimmerScale).toFixed(2);
            l.angle = +((cat === 'bar' ? 11 : 20) * spreadFactor).toFixed(1);
            l.coneLenScale18 = chaseRes.coneLenScale;
            l.fixtureProfile18 = cat === 'bar' ? 'led_pixel_bar_curtain_v1' : 'par_uplight_v1';
            l.profileId18 = cat === 'bar' ? 'pixel_bar_curtain_v1' : 'par_uplight_v1';
            l.beamProfile18 = cat === 'bar' ? 4 : 3;
            l.gobo9 = null;
            if (cat === 'par' && l.power > 0.5) {
              floorProjections.push({
                kind: 'parPool',
                patKind: 0,
                pos: [px, deckY + 0.013, pz + 0.55],
                radius: 1.25 * (chaseRes.coneLenScale || 1),
                color: l.color,
                alpha: clamp18((l.power / 10) * 0.42, 0.06, 0.46)
              });
            }
          } else if (cat === 'blinder') {
            const bRes = evalBlinderThermalFlash18(l, idx, nowMs, ls.blindersOn, showIdx);
            l.color = bRes.color;
            l.power = +(bRes.power * dimmerScale).toFixed(2);
            l.angle = +(44 * spreadFactor).toFixed(1);
            l._blinderBlastScale18 = bRes.blastScale;
            l._blinderCells18 = bRes.cells;
            l.fixtureProfile18 = 'wash_v3';
            l.profileId18 = 'wash_v3';
            l.beamProfile18 = 2;
            l.gobo9 = null;
          } else if (cat === 'wash' || cat === 'fresnel') {
            const pulse = 0.72 + 0.28 * Math.sin(tSec * spd * 1.3 + idx * 0.8);
            if (cat === 'fresnel' || Boolean(l.isFrontLight)) {
              const cctRes = evalFrontKeylightCct18(l.frontColorTempK ?? dmxProg?.frontColorTempK ?? 4200, l.frontKeyLightPct ?? dmxProg?.frontKeyLightPct ?? 88);
              l.color = cctRes.hexColor;
              l.power = +(3.8 * cctRes.dimmerScale * dimmerScale).toFixed(2);
            } else {
              l.color = baseWashCol;
              l.power = +(3.4 * pulse * dimmerScale).toFixed(2);
            }
            l.angle = +((cat === 'fresnel' ? 24 : 19) * spreadFactor).toFixed(1);
            l.fixtureProfile18 = 'wash_v3';
            l.profileId18 = 'wash_v3';
            l.beamProfile18 = 2;
            l.gobo9 = null;
            if (l.target[1] < 2.6) {
              floorProjections.push({
                kind: 'washPool',
                patKind: 0,
                pos: [l.target[0], deckY + 0.012, l.target[2]],
                radius: 2.25,
                color: l.color,
                alpha: clamp18((l.power / 11) * 0.36, 0.05, 0.42)
              });
            }
          } else {
            // Moving Head Beams (0=haze_beam_v4) & Spot / Profile (1=spot_profile_v1)
            const pulse = 0.78 + 0.22 * Math.sin(tSec * spd * 1.5 + idx * 0.65);
            l.color = baseBeamCol;
            l.power = +(4.4 * pulse * dimmerScale).toFixed(2);
            l.angle = +((cat === 'spot' ? 11 : 5.2) * spreadFactor).toFixed(1);
            l.aperture = Number(dmxProg?.optics?.aperture) || (cat === 'spot' ? 0.045 : 0.028);
            l.fixtureProfile18 = cat === 'spot' ? 'spot_profile_v1' : 'haze_beam_v4';
            l.profileId18 = l.fixtureProfile18;
            l.beamProfile18 = cat === 'spot' ? 1 : 0;
            const goboPatterns = ['starburst', 'mandala', 'petals', 'tunnel_ring', 'cross_prism'];
            const goboShaderTypes = [5, 2, 6, 1, 4];
            const gTypeIdx = (idx + showIdx - 1) % 5;
            l.gobo9 = {
              type: goboShaderTypes[gTypeIdx],
              pattern: goboPatterns[gTypeIdx],
              angle: tSec * 1.85 * (idx % 2 === 0 ? 1 : -1) + idx * 0.7,
              size: cat === 'spot' ? 1.15 : 0.92
            };
            if (l.target[1] < 2.2) {
              floorProjections.push({
                kind: 'goboSpot',
                patKind: gTypeIdx + 1,
                pos: [l.target[0], deckY + 0.016, l.target[2]],
                radius: cat === 'spot' ? 1.55 : 1.05,
                angle: l.gobo9.angle,
                pattern: l.gobo9.pattern,
                color: l.color,
                alpha: clamp18((l.power / 9.5) * 0.58, 0.1, 0.68)
              });
              if (deckGlints.length < MAX_DECK_GLINTS) {
                deckGlints.push({
                  kind: 'deckGlint',
                  patKind: 7,
                  pos: [l.target[0], deckY + 0.018, l.target[2]],
                  radius: cat === 'spot' ? 0.55 : 0.42,
                  color: '#ffffff',
                  alpha: clamp18((l.power / 9.5) * 0.72, 0.15, 0.82)
                });
              }
            }
          }

          // Audience Blinder Override [F] (Multi-Cell Thermal Flash) — floor/blinder fixtures only, never overhead moving heads
          l._isBlinder18 = false;
          if (ls.blindersOn && (cat === 'blinder' || (py < 1.3 && idx % 4 === 3))) {
            const bHit = evalBlinderThermalFlash18(l, idx, nowMs, true, showIdx);
            l.color = bHit.color;
            l.power = bHit.power;
            l.angle = 38;
            l.beamProfile18 = 2;
            l.coneLenScale18 = 0.35;
            l._blinderBlastScale18 = bHit.blastScale;
            l._blinderCells18 = bHit.cells;
            l._isBlinder18 = true;
          }

          // Multi-Frequency Strobe Override [Z] (14Hz Beam/Strobe, 12Hz Wash, 13Hz PAR with 2500ms Breath Pause)
          // Front Fresnel Keylights remain steady so performers stay broadcast-lit.
          if (ls.strobe && cat !== 'fresnel' && !l.isFrontLight && (cat === 'strobe' || Boolean(l.strobeCapable18) || !hasDedicatedStrobe)) {
            const grpNum = Number(String(grpId || 'G1').replace(/\D/g, '')) || 1;
            const stRes = evalStrobePulse18(cat, idx, grpNum, nowMs);
            const decay = stRes.localT < 48.0 ? (1 - Math.max(0, stRes.localT - stRes.dutyMs) / 26.0) * 0.35 : 0.04;
            l.color = '#ffffff';
            l.power = stRes.gate ? (cat === 'strobe' ? 13.5 : 8.2) : (cat === 'strobe' ? 0.02 : +(0.25 + decay * 2.5).toFixed(2));
          }

          activeLightEnergySum += Math.min(1.0, (Number(l.power) || 0) / 8.5);
        });

        if (ls.strobe && !ls.blackout && !hasDedicatedStrobe) {
          const strobeOn = evalStrobePulse18('strobe', 0, 0, nowMs).gate;
          for (const fp of floorProjections) {
            fp.color = '#ffffff';
            fp.alpha = strobeOn ? Math.min(0.65, fp.alpha * 1.2) : 0.06;
          }
          for (const dg of deckGlints) {
            dg.color = '#ffffff';
            dg.alpha = strobeOn ? 0.92 : 0.02;
          }
        }

        // Dynamic 3D stage/sky point light pulses from Pyro & Aerial Firework bursts
        if ((ls._sfxStageGlow?.active || ls._sfxSkyBurst?.active) && eng.lights.length > 0 && !ls.blackout) {
          const skyActive = ls._sfxSkyBurst?.active && nowMs < ls.skyFlashUntilMs;
          const glowCol = skyActive ? ls._sfxSkyBurst.color : (ls._sfxStageGlow?.color || '#ff9900');
          const glowPow = skyActive ? ls._sfxSkyBurst.power : (ls._sfxStageGlow?.power || 9.8);
          const frontLight = eng.lights[0];
          if (frontLight && !ls.strobe) {
            frontLight.color = glowCol;
            frontLight.power = Math.max(frontLight.power || 6, glowPow);
          }
        }
      }

      ls._floorProjections = floorProjections;
      ls._deckGlints = deckGlints;
      ls._screenHaloPools = ls.running && !ls.blackout ? evalScreenHaloBleed18(eng, tSec, spd) : [];

      // 3. Evaluate 3D RGB ILDA Laser Scan Patterns (Ps = 0..3) with +3.20m horizon clamp
      const laserRenderData = [];
      if (ls.running && ls.laserOn && !ls.blackout) {
        const stageLaserUnits = Array.isArray(eng?.lights)
          ? eng.lights
              .filter((l, i) => l && classifyFixture18(l, i, eng.lights.length) === 'laser' && Array.isArray(l.pos))
              .map((l) => l.pos)
          : [];
        const laserUnits = stageLaserUnits.length
          ? stageLaserUnits
          : [
              [-4.2, 4.2, -1.6],
              [4.2, 4.2, -1.6]
            ];
        const patternIdx = ls.laserPattern && ls.laserPattern !== 'auto'
          ? clamp18(Number(ls.laserPattern) || 0, 0, 3)
          : (showIdx - 1) % 4;
        const customLaserPal = dmxProg?.groupPalettes?.laser;
        const laserPal = Array.isArray(customLaserPal) && customLaserPal.length ? customLaserPal : LMP_LASER_PALETTES18;
        laserUnits.forEach((origin, uIdx) => {
          laserRenderData.push(evalLaserScanPattern18(patternIdx, origin, uIdx, tSec, spd, ls.multicolor, laserPal, 16));
        });
      }
      ls._laserRenderData = laserRenderData;

      // 4. Update Crowd/Floor Reactive Energy (_crowdSmoothEnergy with asymmetric attack 2.15/s & release 1.05/s)
      const lightCount = Math.max(1, eng?.lights?.length || 1);
      const rawEnergy = ls.running && !ls.blackout
        ? clamp18(
            (activeLightEnergySum / lightCount) * 0.65 +
              (activeNozzles.length > 0 ? 0.25 : 0) +
              (ls.blindersOn || ls.strobe ? 0.25 : 0),
            0,
            1
          )
        : 0;
      const rate = rawEnergy > (ls._crowdSmoothEnergy || 0) ? 2.15 : 1.05;
      ls._crowdSmoothEnergy = clamp18(
        (ls._crowdSmoothEnergy || 0) + (rawEnergy - (ls._crowdSmoothEnergy || 0)) * Math.min(1, dt * rate),
        0,
        1
      );

      const structCfg = lumiState.structureConfig18;
      if (ls.running && structCfg?.crowdBounce) {
        ls.crowdBouncePhase = (ls.crowdBouncePhase || 0) + dt * spd * (3.2 + ls._crowdSmoothEnergy * 2.2);
        ls.crowdBounceOffsetM = +(Math.abs(Math.sin(ls.crowdBouncePhase)) * (0.14 + 0.14 * ls._crowdSmoothEnergy)).toFixed(3);
      } else {
        ls.crowdBounceOffsetM = 0;
      }

      // 5. Step Auto Cinematic Camera Director (5-Shot 10s Tour)
      stepAutoCameraDirector18(eng, ls, dt, nowMs);

      return true;
    }

    function ensureLmpFxBatchProgram18(eng) {
      const gl = eng?.gl;
      if (!gl) return null;
      if (eng._lmpFxProg18 && eng._lmpFxGlRef18 === gl) return eng._lmpFxProg18;
      const vsSrc = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUV;
layout(location=2) in vec4 aColor;
uniform mat4 uVP;
uniform int uPassMode;
out vec2 vUV;
out vec4 vColor;
out vec3 vWorld;
void main(){
  vUV = aUV;
  vColor = aColor;
  vWorld = aPos;
  gl_Position = uVP * vec4(aPos, 1.0);
  if(uPassMode == 3){
    float dist = max(1.0, gl_Position.w);
    gl_PointSize = clamp(aUV.x * (360.0 / dist), 1.5, 115.0);
  }
}`;
      const fsSrc = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUV;
in vec4 vColor;
in vec3 vWorld;
uniform float uTime;
uniform int uPassMode;
out vec4 frag;
void main(){
  if(uPassMode == 0){
    float radial = clamp(1.0 - vUV.y, 0.0, 1.0);
    float w1 = sin(vWorld.x * 2.4 + uTime * 3.2) * cos(vWorld.z * 1.9 - uTime * 2.1);
    float w2 = sin(vWorld.x * 5.1 - vWorld.z * 4.3 + uTime * 4.7);
    float turb = clamp(0.65 + 0.25 * w1 + 0.18 * w2, 0.2, 1.35);
    float edge = smoothstep(0.0, 0.12, vUV.x) * (1.0 - smoothstep(0.88, 1.0, vUV.x));
    float a = vColor.a * pow(radial, 0.72) * turb * edge;
    vec3 col = mix(vColor.rgb, vec3(1.0), clamp(pow(radial, 2.5) * 0.45 + max(0.0, w1) * 0.22, 0.0, 0.75));
    frag = vec4(col, clamp(a, 0.0, 1.0));
    return;
  }
  if(uPassMode == 1){
    vec2 p = vUV * 2.0 - 1.0;
    float r = length(p);
    if(r > 1.0) discard;
    float patKind = floor(vColor.a / 2.0);
    float baseAlpha = fract(vColor.a);
    float fall = pow(max(0.0, 1.0 - r), 1.45);
    float mask = 1.0;
    if(patKind > 0.5 && patKind < 6.5){
      float a = atan(p.y, p.x) + uTime * (mod(patKind, 2.0) < 0.5 ? 1.85 : -1.85);
      float lobes = patKind < 1.5 ? 6.0 : patKind < 2.5 ? 8.0 : patKind < 3.5 ? 5.0 : 4.0;
      if(patKind > 3.5 && patKind < 4.5){
        mask = 0.35 + 0.65 * smoothstep(-0.2, 0.5, sin(r * 18.8 - uTime * 3.0));
      } else {
        mask = 0.32 + 0.68 * smoothstep(-0.15, 0.55, cos(a * lobes)) * smoothstep(0.08, 0.28, r);
      }
    } else if(patKind >= 6.5){
      fall = pow(max(0.0, 1.0 - r), 2.6);
    }
    vec3 col = mix(vColor.rgb, vec3(1.0), pow(max(0.0, 1.0 - r), 3.0) * 0.45);
    frag = vec4(col, clamp(baseAlpha * 0.48 * fall * mask, 0.0, 1.0));
    return;
  }
  if(uPassMode == 2){
    if(vUV.y >= 0.0){
      float d = abs(vUV.x * 2.0 - 1.0);
      float lenFade = pow(max(0.0, 1.0 - vUV.y * 0.72), 0.55);
      float halo = exp(-d * d * 5.2);
      float core = exp(-d * d * 42.0);
      vec3 col = mix(vColor.rgb * 1.25, vec3(1.0, 0.99, 0.96), clamp(core * 0.92, 0.0, 1.0));
      float a = clamp(vColor.a * (halo * 0.62 + core * 0.95) * lenFade, 0.0, 1.0);
      frag = vec4(col, a);
      return;
    }
    if(vColor.a <= 0.004) discard;
    frag = vColor;
    return;
  }
  if(vColor.a <= 0.004) discard;
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv) * 2.0;
  if(d > 1.0) discard;
  float core = exp(-d * d * 9.5);
  float halo = pow(1.0 - d, 2.4) * 0.65;
  float intensity = core + halo;
  vec3 finalCol = vColor.rgb * (1.0 + core * 1.15) + vec3(core * 0.45);
  frag = vec4(finalCol, clamp(intensity * vColor.a, 0.0, 1.0));
}`;
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          gl.deleteShader(s);
          return null;
        }
        return s;
      };
      const vs = compile(gl.VERTEX_SHADER, vsSrc);
      const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      if (!vs || !fs) return null;
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.deleteProgram(prog);
        return null;
      }
      const vao = gl.createVertexArray();
      const buf = gl.createBuffer();
      const maxVerts = 16384;
      const data = new Float32Array(maxVerts * 9);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
      const stride = 9 * 4;
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 5 * 4);
      gl.bindVertexArray(null);

      eng._lmpFxGlRef18 = gl;
      eng._lmpFxProg18 = {
        prog,
        vao,
        buf,
        data,
        maxVerts,
        uVP: gl.getUniformLocation(prog, 'uVP'),
        uTime: gl.getUniformLocation(prog, 'uTime'),
        uPassMode: gl.getUniformLocation(prog, 'uPassMode')
      };
      return eng._lmpFxProg18;
    }

    // Draw extra 3D WebGL2 volumetric cones + batched Liquid Sky sheets, Floor Gobo/Wash/PAR/Glints/ScreenHalo decals, 16-beam Laser rays & 3D GPU Pyro particles
    function drawWebglVolumetricExtras18(eng, nowMs = nowMs18()) {
      const ls = liveShow18;
      if (!eng || eng.view !== 'stage' || !eng.gl || typeof eng.makeBeam !== 'function') return;
      const manualPyroActive = nowMs < ls.sparkUntilMs || nowMs < ls.co2UntilMs || nowMs < ls.flameUntilMs || ls.activeNozzles.length > 0 || ls.particles.length > 0 || ls.aerialShells.length > 0;
      if ((!ls.running || ls.blackout) && !manualPyroActive) return;

      const gl = eng.gl;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.depthMask(false);

      try {
        const tSec = ls.showElapsedSec || nowMs / 1000;
        // 1. Tight high-intensity inner core for Beams, 6-finger rotating prism for Spot/Profile (spot_profile_v1), and 12-cell curtain for Barra LED (led_pixel_bar_curtain_v1)
        if (ls.running && ls.lightsOn && !ls.blackout) {
          for (let i = 0; i < eng.lights.length; i++) {
            const l = eng.lights[i];
            if (!l || !l.enabled || l.power <= 0.2) continue;
            const cat = l._liveCat18 || classifyFixture18(l, i, eng.lights.length);
            if ((cat === 'beam' || cat === 'spot') && l.beamProfile18 !== 2) {
              const coreLight = {
                pos: l.pos,
                target: l.target,
                color: '#ffffff',
                angle: Math.max(1.8, (l.angle || 7) * 0.36),
                aperture: 0.018,
                beamProfile18: 0,
                beamLength: Math.hypot(l.target[0] - l.pos[0], l.target[1] - l.pos[1], l.target[2] - l.pos[2]) + 1.5
              };
              const mesh = eng.makeBeam(coreLight);
              eng.draw(mesh, 2, null, Math.min(0.24, 0.14 * (l.power / 6)));

              if (cat === 'spot') {
                const rotBase = l.gobo9?.angle || tSec * 1.6;
                for (let f = 0; f < 6; f++) {
                  const a = rotBase + (f * Math.PI) / 3;
                  const fingerTarget = [
                    l.target[0] + Math.cos(a) * 0.42,
                    l.target[1],
                    l.target[2] + Math.sin(a) * 0.42
                  ];
                  const fingerMesh = eng.makeBeam({
                    pos: l.pos,
                    target: fingerTarget,
                    color: l.color,
                    angle: 2.2,
                    aperture: 0.014,
                    beamProfile18: 1
                  });
                  eng.draw(fingerMesh, 2, null, Math.min(0.24, 0.14 * (l.power / 6)));
                }
              }
            } else if (cat === 'bar') {
              for (let c = 0; c < 6; c++) {
                const u = c / 5 - 0.5;
                const cellPos = [l.pos[0] + u * 0.92, l.pos[1], l.pos[2]];
                const cellTarget = [l.target[0] + u * 1.15, l.target[1], l.target[2]];
                const barRay = {
                  pos: cellPos,
                  target: cellTarget,
                  color: l.color,
                  angle: 4.2,
                  aperture: 0.02,
                  beamProfile18: 4,
                  beamLength: 6.5
                };
                const mesh = eng.makeBeam(barRay);
                eng.draw(mesh, 2, null, Math.min(0.11, 0.065 * (l.power / 6)));
              }
            }
          }
        }

        // 2. Single Cached WebGL2 Batch Program for 3D Liquid Sky Laser Sheets, Floor Decals, Laser Rays & GPU Pyro Particles
        const fxProg = ensureLmpFxBatchProgram18(eng);
        if (fxProg && eng.vp) {
          const { prog, vao, buf, data, maxVerts, uVP, uTime, uPassMode } = fxProg;
          gl.useProgram(prog);
          gl.bindVertexArray(vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.uniformMatrix4fv(uVP, false, eng.vp);
          gl.uniform1f(uTime, tSec);

          const pushVert = (idx, x, y, z, u, v, r, g, b, a) => {
            if (idx >= maxVerts) return idx;
            const o = idx * 9;
            data[o] = x;
            data[o + 1] = y;
            data[o + 2] = z;
            data[o + 3] = u;
            data[o + 4] = v;
            data[o + 5] = r;
            data[o + 6] = g;
            data[o + 7] = b;
            data[o + 8] = a;
            return idx + 1;
          };

          // Pass 0: 3D Liquid Sky Laser Interference Sheet (uPassMode = 0, gl.TRIANGLES)
          const lasers = ls._laserRenderData || [];
          if (lasers.length > 0) {
            let vCount = 0;
            for (const unit of lasers) {
              const org = unit.origin;
              const rays = unit.rays;
              const [br, bg, bb] = hexToRgb01_18(unit.baseCol);
              const [ar, ag, ab] = hexToRgb01_18(unit.altCol);
              for (let r = 0; r + 1 < rays.length; r++) {
                if (rays[r].gate === false || rays[r + 1].gate === false) continue;
                const pA = rays[r].target3d;
                const pB = rays[r + 1].target3d;
                const u0 = r / Math.max(1, rays.length - 1);
                const u1 = (r + 1) / Math.max(1, rays.length - 1);
                vCount = pushVert(vCount, org[0], org[1], org[2], (u0 + u1) * 0.5, 0, br, bg, bb, 0.14);
                vCount = pushVert(vCount, pA[0], pA[1], pA[2], u0, 1, ar, ag, ab, 0.04);
                vCount = pushVert(vCount, pB[0], pB[1], pB[2], u1, 1, br, bg, bb, 0.04);
              }
            }
            if (vCount > 0) {
              gl.uniform1i(uPassMode, 0);
              gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, vCount * 9));
              gl.drawArrays(gl.TRIANGLES, 0, vCount);
            }
          }

          // Pass 1: 3D Floor Gobo Projections, Wash Pools, PAR Scallops, Specular Deck Glints & Screen Halo Bleed (uPassMode = 1, gl.TRIANGLES)
          const decals = [
            ...(ls._screenHaloPools || []),
            ...(ls._floorProjections || []),
            ...(ls._deckGlints || [])
          ];
          if (decals.length > 0) {
            let vCount = 0;
            for (const d of decals) {
              const cx = d.pos[0];
              const cy = d.pos[1];
              const cz = d.pos[2];
              const rx = d.radiusX || d.radius || 1.2;
              const rz = d.radiusZ || d.radius || 1.2;
              const [r, g, b] = hexToRgb01_18(d.color || '#00f0ff');
              const patKind = Number(d.patKind) || 0;
              const encAlpha = patKind * 2.0 + clamp18(d.alpha || 0.3, 0.02, 0.96);
              vCount = pushVert(vCount, cx - rx, cy, cz - rz, 0, 0, r, g, b, encAlpha);
              vCount = pushVert(vCount, cx + rx, cy, cz - rz, 1, 0, r, g, b, encAlpha);
              vCount = pushVert(vCount, cx + rx, cy, cz + rz, 1, 1, r, g, b, encAlpha);
              vCount = pushVert(vCount, cx - rx, cy, cz - rz, 0, 0, r, g, b, encAlpha);
              vCount = pushVert(vCount, cx + rx, cy, cz + rz, 1, 1, r, g, b, encAlpha);
              vCount = pushVert(vCount, cx - rx, cy, cz + rz, 0, 1, r, g, b, encAlpha);
            }
            if (vCount > 0) {
              gl.uniform1i(uPassMode, 1);
              gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, vCount * 9));
              gl.drawArrays(gl.TRIANGLES, 0, vCount);
            }
          }

          // Pass 2A: 3D ILDA Laser Volumetric Ribbons (uPassMode = 2, gl.TRIANGLES, vUV.y >= 0)
          let ribbonVerts = 0;
          const camEye = Array.isArray(eng.eye) ? eng.eye : [0, 3, 28];
          for (const unit of lasers) {
            const org = unit.origin;
            for (const ray of unit.rays) {
              if (ray.gate === false) continue;
              const bInt = Number.isFinite(ray.beamIntensity) ? ray.beamIntensity : 1;
              if (bInt <= 0.04) continue;
              const tgt = ray.target3d;
              const dx = tgt[0] - org[0], dy = tgt[1] - org[1], dz = tgt[2] - org[2];
              const vx = camEye[0] - org[0], vy = camEye[1] - org[1], vz = camEye[2] - org[2];
              let sx = dy * vz - dz * vy, sy = dz * vx - dx * vz, sz = dx * vy - dy * vx;
              const sLen = Math.hypot(sx, sy, sz) || 1;
              sx /= sLen; sy /= sLen; sz /= sLen;
              const w0 = 0.032, w1 = 0.095;
              const [r, g, b] = hexToRgb01_18(ray.rayCol);
              const oLx = org[0] - sx * w0, oLy = org[1] - sy * w0, oLz = org[2] - sz * w0;
              const oRx = org[0] + sx * w0, oRy = org[1] + sy * w0, oRz = org[2] + sz * w0;
              const tLx = tgt[0] - sx * w1, tLy = tgt[1] - sy * w1, tLz = tgt[2] - sz * w1;
              const tRx = tgt[0] + sx * w1, tRy = tgt[1] + sy * w1, tRz = tgt[2] + sz * w1;
              ribbonVerts = pushVert(ribbonVerts, oLx, oLy, oLz, 0, 0, r, g, b, 0.72 * bInt);
              ribbonVerts = pushVert(ribbonVerts, oRx, oRy, oRz, 1, 0, r, g, b, 0.72 * bInt);
              ribbonVerts = pushVert(ribbonVerts, tRx, tRy, tRz, 1, 1, r, g, b, 0.58 * bInt);
              ribbonVerts = pushVert(ribbonVerts, oLx, oLy, oLz, 0, 0, r, g, b, 0.72 * bInt);
              ribbonVerts = pushVert(ribbonVerts, tRx, tRy, tRz, 1, 1, r, g, b, 0.58 * bInt);
              ribbonVerts = pushVert(ribbonVerts, tLx, tLy, tLz, 0, 1, r, g, b, 0.58 * bInt);
            }
          }
          if (ribbonVerts > 0) {
            gl.uniform1i(uPassMode, 2);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, ribbonVerts * 9));
            gl.drawArrays(gl.TRIANGLES, 0, ribbonVerts);
          }

          // Pass 2B: 3D Pyro Velocity Streaks (uPassMode = 2, gl.LINES, vUV.y < 0, head alpha = min(1, a), tail alpha = 0)
          let lineVerts = 0;
          for (const s of ls.aerialShells) {
            const sHdr = s.hdrColor || [2.6, 2.1, 1.1];
            const tx = s.x - (s.vx || 0) * 0.055;
            const ty = s.y - (s.vy || 0) * 0.055;
            const tz = s.z - (s.vz || 0) * 0.055;
            lineVerts = pushVert(lineVerts, s.x, s.y, s.z, 1, -1, 2.8, 2.6, 2.0, 1.0);
            lineVerts = pushVert(lineVerts, tx, ty, tz, 0, -1, sHdr[0], sHdr[1], sHdr[2], 0.0);
          }
          for (let i = 0; i < ls.particles.length; i++) {
            const p = ls.particles[i];
            const sDt = Number(p.streakDt) || 0;
            if (sDt <= 0 || p.pType === 2 || p.pType === 3 || p.pType === 8 || p.pType === 9) continue;
            const u = clamp18(p.age / Math.max(0.04, p.maxAge), 0, 1);
            const alpha = Number.isFinite(p.renderAlpha) ? p.renderAlpha : (1 - u) * 0.9;
            if (alpha <= 0.008) continue;
            const hdr = p.hdrColor || hexToRgb01_18(p.color || '#ffe680');
            const tx = p.x - (p.vx || 0) * sDt;
            const ty = p.y - (p.vy || 0) * sDt;
            const tz = p.z - (p.vz || 0) * sDt;
            const headR = p.pType === 7 ? 2.8 : hdr[0] * (p.pType === 1 ? 1.15 : 1.0);
            const headG = p.pType === 7 ? 2.6 : hdr[1] * (p.pType === 1 ? 1.15 : 1.0);
            const headB = p.pType === 7 ? 2.0 : hdr[2] * (p.pType === 1 ? 1.15 : 1.0);
            const tailR = p.pType === 7 ? hdr[0] : hdr[0] * (p.pType === 1 ? 0.65 : 0.45);
            const tailG = p.pType === 7 ? hdr[1] : hdr[1] * (p.pType === 1 ? 0.45 : 0.35);
            const tailB = p.pType === 7 ? hdr[2] : hdr[2] * 0.20;
            lineVerts = pushVert(lineVerts, p.x, p.y, p.z, 1, -1, headR, headG, headB, Math.min(1.0, alpha));
            lineVerts = pushVert(lineVerts, tx, ty, tz, 0, -1, tailR, tailG, tailB, 0.0);
          }
          if (lineVerts > 0) {
            gl.uniform1i(uPassMode, 2);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, lineVerts * 9));
            gl.drawArrays(gl.LINES, 0, lineVerts);
          }

          // Pass 3: 3D GPU Pyro & Firework HDR Point Sprites (uPassMode = 3, gl.POINTS — Sparkular, Flame blackbody, CO2 cryo mist, Aerial shells & Stars)
          let ptVerts = 0;
          for (const s of ls.aerialShells) {
            const sHdr = s.hdrColor || [2.6, 2.1, 1.1];
            ptVerts = pushVert(ptVerts, s.x, s.y, s.z, s.baseSize || 1.35, 0, sHdr[0], sHdr[1], sHdr[2], 1.0);
          }
          for (let i = 0; i < ls.particles.length; i++) {
            const p = ls.particles[i];
            const u = clamp18(p.age / Math.max(0.04, p.maxAge), 0, 1);
            const alpha = Number.isFinite(p.renderAlpha)
              ? p.renderAlpha
              : p.pType === 2 || p.kind === 'flame'
                ? (1 - Math.pow(u, 1.5)) * 0.88
                : p.pType === 3 || p.kind === 'co2'
                  ? Math.sin(u * Math.PI) * (1 - u) * 0.52
                  : (1 - u) * 0.85;
            if (alpha <= 0.004) continue;
            const ptSize = Number.isFinite(p.renderSize)
              ? p.renderSize
              : p.pType === 2 || p.kind === 'flame'
                ? (p.baseSize || p.size || 1.45) * (1.15 - u * 0.55)
                : p.pType === 3 || p.kind === 'co2'
                  ? (p.baseSize || p.size || 1.35) * (1 + u * 3.2)
                  : (p.baseSize || p.size || 0.85);
            const hdr = p.hdrColor || (
              p.pType === 2 || p.kind === 'flame'
                ? [1.35, Math.max(0.08, 0.95 * Math.pow(Math.max(0, 1 - u), 1.45)), Math.max(0, 0.45 * Math.pow(Math.max(0, 1 - u), 3.2))]
                : p.pType === 3 || p.kind === 'co2'
                  ? [0.82, 0.95, 1.0]
                  : hexToRgb01_18(p.color || '#ffe680')
            );
            ptVerts = pushVert(ptVerts, p.x, p.y, p.z, ptSize, u, hdr[0], hdr[1], hdr[2], alpha);
          }
          if (ptVerts > 0) {
            gl.uniform1i(uPassMode, 3);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, ptVerts * 9));
            gl.drawArrays(gl.POINTS, 0, ptVerts);
          }
        }
      } finally {
        gl.bindVertexArray(null);
        if (eng.program) gl.useProgram(eng.program);
        gl.depthMask(true);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.BLEND);
      }
      if (Number.isFinite(eng.frame)) eng._lmpVolumetricFrame18 = eng.frame;
      return true;
    }

    function renderLiveShowOverlay18(nowMs = nowMs18(), { clean = false, force2d = false } = {}) {
      const can = $('lmpShowOverlay18');
      const eng = S.engine;
      if (!can || !eng) return null;
      if (clean && !force2d && Number.isFinite(eng.frame) && eng._lmpVolumetricFrame18 !== eng.frame) {
        drawWebglVolumetricExtras18(eng, nowMs);
      }
      const ctx = can.getContext?.('2d', { alpha: true });
      if (!ctx) return null;

      const ls = liveShow18;
      const manualPyroActive = nowMs < ls.sparkUntilMs || nowMs < ls.co2UntilMs || nowMs < ls.flameUntilMs || ls.particles.length > 0 || ls.aerialShells.length > 0;
      const active = (ls.running || manualPyroActive) && eng.view === 'stage' && !!eng.vp;
      if (!active) {
        if (can._dirty18 && can.width > 0) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, can.width, can.height);
          can._dirty18 = false;
        }
        return can;
      }

      const w = can.clientWidth || eng.canvas?.clientWidth || 0;
      const h = can.clientHeight || eng.canvas?.clientHeight || 0;
      if (w < 2 || h < 2) return can;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const cw = Math.round(w * dpr);
      const ch = Math.round(h * dpr);
      if (can.width !== cw || can.height !== ch) {
        can.width = cw;
        can.height = ch;
      }
      can._dirty18 = true;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const proj = (pt) => {
        const p = eng.project?.(pt);
        return p && Number.isFinite(p.x + p.y + p.z) && p.z > -0.98 && p.z < 1.12 ? p : null;
      };

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const tSec = ls.showElapsedSec || nowMs / 1000;
      const spd = clamp18(ls.speed || 2.0, 0.2, 5.0);
      const showIdx = ls.effectiveShow || 1;
      const hasWebglBatch = Boolean(eng.gl && typeof eng.makeBeam === 'function' && ensureLmpFxBatchProgram18(eng) && !force2d);

      // 0. Planar Mirror Reflective Deck Reflections (Phase B)
      if (lumiState.structureConfig18?.deckMaterial === 'mirror' && !ls.blackout) {
        drawMirrorDeckReflections18(ctx, proj, eng, tSec, spd);
      }

      // 1. Sky / Audience Flash from Aerial Pyro or 14Hz Strobe / Audience Blinders
      if (!ls.blackout) {
        if (nowMs < ls.skyFlashUntilMs) {
          const flashAlpha = clamp18((ls.skyFlashUntilMs - nowMs) / 450, 0, 1) * 0.28;
          const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.82);
          skyGrad.addColorStop(0, rgba18(ls.skyFlashColor, flashAlpha));
          skyGrad.addColorStop(1, rgba18(ls.skyFlashColor, 0));
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, w, h);
        }
        if (ls.strobe) {
          const stPulse = 0.035 + 0.025 * Math.sin(nowMs * 0.038);
          const stGrad = ctx.createRadialGradient(w * 0.5, h * 0.72, 10, w * 0.5, h * 0.72, Math.max(w, h) * 0.52);
          stGrad.addColorStop(0, `rgba(225,242,255,${stPulse.toFixed(3)})`);
          stGrad.addColorStop(0.55, `rgba(180,220,255,${(stPulse * 0.45).toFixed(3)})`);
          stGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = stGrad;
          ctx.fillRect(0, 0, w, h);
        }
        if (ls.blindersOn) {
          const blPulse = 0.045 + 0.018 * Math.sin(nowMs * 0.008);
          const blGrad = ctx.createRadialGradient(w * 0.5, h * 0.68, 10, w * 0.5, h * 0.68, Math.max(w, h) * 0.50);
          blGrad.addColorStop(0, `rgba(255,220,130,${blPulse.toFixed(3)})`);
          blGrad.addColorStop(0.35, `rgba(255,165,45,${(blPulse * 0.48).toFixed(3)})`);
          blGrad.addColorStop(0.7, `rgba(255,130,20,${(blPulse * 0.14).toFixed(3)})`);
          blGrad.addColorStop(1, 'rgba(255,120,0,0)');
          ctx.fillStyle = blGrad;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // 2. Render Volumetric Moving Head Shafts, Barra LED 12-Cell Curtains (pixel_bar_curtain_v1), Parabolic Wall Scallops (par_uplight_v1), Lens Head Flares & Rotating Floor Gobo Projections (spot_profile_v1)
      if (ls.running && ls.lightsOn && !ls.blackout && Array.isArray(eng.lights)) {
        for (let i = 0; i < eng.lights.length; i++) {
          const l = eng.lights[i];
          if (!l || !l.enabled || l.power <= 0.15) continue;
          const p0 = proj(l.pos);
          const p1 = proj(l.target);
          if (!p0) continue;
          const cat = l._liveCat18 || classifyFixture18(l, i, eng.lights.length);
          const intensity = clamp18(l.power / 8.5, 0.1, 1.35);

          if (!hasWebglBatch && cat === 'bar' && p1) {
            // 12-cell Barra LED linear array + curtain rays (pixel_bar_curtain_v1: 0.92 x 6.5 x 0.45m)
            const cells = computePixelBarCurtainCells18(l.pos, l.target, tSec, spd, i, l.color);
            for (const cell of cells) {
              const cp0 = proj(cell.emitterPos);
              const cp1 = proj(cell.rayEndPos);
              if (!cp0 || !cp1) continue;
              const cellAlpha = clamp18(intensity * cell.wave * 0.36, 0.03, 0.48);
              ctx.strokeStyle = rgba18(cell.color, cellAlpha);
              ctx.lineWidth = 4.5;
              ctx.beginPath();
              ctx.moveTo(cp0.x, cp0.y);
              ctx.lineTo(cp1.x, cp1.y);
              ctx.stroke();

              ctx.fillStyle = cell.wave > 0.82 ? '#ffffff' : cell.color;
              ctx.beginPath();
              ctx.arc(cp0.x, cp0.y, 2.6, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (!hasWebglBatch && p1) {
            // Parabolic Wall-Wash Scallop + Floor Pool for par_uplight_v1
            if (cat === 'par') {
              drawParabolicWallScallop18(ctx, proj, l.pos, l.color, intensity, 3.6, 1.45);
            }
            // Volumetric light cone in screen-projected 3D space
            const distPx = Math.hypot(p1.x - p0.x, p1.y - p0.y);
            const coneSpread = cat === 'beam' ? 0.11 : cat === 'spot' ? 0.19 : cat === 'wash' || cat === 'fresnel' ? 0.34 : 0.42;
            const endRadius = clamp18(distPx * coneSpread, 12, 160);
            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const len = Math.max(1, Math.hypot(dx, dy));
            const nx = -dy / len;
            const ny = dx / len;

            const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
            const coneAlpha = cat === 'beam' || cat === 'spot' ? 0.32 * intensity : 0.18 * intensity;
            grad.addColorStop(0, rgba18('#ffffff', Math.min(0.65, coneAlpha * 1.5)));
            grad.addColorStop(0.18, rgba18(l.color, coneAlpha));
            grad.addColorStop(1, rgba18(l.color, 0));

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(p0.x - nx * 2.5, p0.y - ny * 2.5);
            ctx.lineTo(p0.x + nx * 2.5, p0.y + ny * 2.5);
            ctx.lineTo(p1.x + nx * endRadius, p1.y + ny * endRadius);
            ctx.lineTo(p1.x - nx * endRadius, p1.y - ny * endRadius);
            ctx.closePath();
            ctx.fill();

            // Tight central laser-like beam core for Moving Head Beams & Rotating Floor Gobo for Spot/Profile (spot_profile_v1)
            if (cat === 'beam' || cat === 'spot') {
              ctx.strokeStyle = rgba18('#ffffff', Math.min(0.55, intensity * 0.42));
              ctx.lineWidth = cat === 'beam' ? 2.2 : 1.5;
              ctx.beginPath();
              ctx.moveTo(p0.x, p0.y);
              ctx.lineTo(p1.x, p1.y);
              ctx.stroke();

              // Floor Gobo / Rotating Projection ring when hitting the stage deck
              if (l.target[1] < 1.8) {
                const spotR = clamp18(endRadius * 0.55, 10, 64);
                const spotGrad = ctx.createRadialGradient(p1.x, p1.y, 1, p1.x, p1.y, spotR);
                spotGrad.addColorStop(0, rgba18('#ffffff', 0.42 * intensity));
                spotGrad.addColorStop(0.45, rgba18(l.color, 0.28 * intensity));
                spotGrad.addColorStop(1, rgba18(l.color, 0));
                ctx.fillStyle = spotGrad;
                ctx.beginPath();
                ctx.ellipse(p1.x, p1.y, spotR, spotR * 0.48, 0, 0, Math.PI * 2);
                ctx.fill();

                drawRotatingFloorGobo18(
                  ctx,
                  p1.x,
                  p1.y,
                  spotR,
                  spotR * 0.48,
                  l.gobo9?.angle || (tSec * 1.85 + i),
                  l.gobo9?.pattern || 'starburst',
                  l.color,
                  intensity
                );
              }
            }
          }

          // Fixture lens head flare + Multi-Cell COB Audience Blinder (4-Lite Molefay) & Xenon Starburst
          const isBlinderActive = Boolean(l._isBlinder18) || (ls.blindersOn && (cat === 'blinder' || ((Number(l.pos?.[1]) || 5) < 1.3 && i % 4 === 3)));
          const flareR = isBlinderActive ? 14 * intensity : cat === 'blinder' ? 9 * intensity : 8 * intensity;
          if (flareR > 2) {
            // Smooth 6-stop Gaussian falloff (eliminates circular Mach-band ring border)
            const fg = ctx.createRadialGradient(p0.x, p0.y, 0.2, p0.x, p0.y, flareR);
            const col = isBlinderActive ? '#ffaa28' : l.color;
            const cAlpha = isBlinderActive ? 0.62 : 0.52;
            fg.addColorStop(0, '#ffffff');
            fg.addColorStop(0.14, rgba18(isBlinderActive ? '#ffe89e' : '#ffffff', cAlpha * 0.92));
            fg.addColorStop(0.32, rgba18(col, cAlpha * 0.52));
            fg.addColorStop(0.56, rgba18(col, cAlpha * 0.20));
            fg.addColorStop(0.80, rgba18(col, cAlpha * 0.05));
            fg.addColorStop(1, rgba18(col, 0));
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.arc(p0.x, p0.y, flareR, 0, Math.PI * 2);
            ctx.fill();

            if (isBlinderActive) {
              // 4-Lite 2x2 Warm Tungsten COB Reflector Pod with individual per-cell thermal flicker
              const cellOffX = 3.2;
              const cellOffY = 2.4;
              const cellModels = Array.isArray(l._blinderCells18) ? l._blinderCells18 : null;
              let cIdx = 0;
              for (const ox of [-cellOffX, cellOffX]) {
                for (const oy of [-cellOffY, cellOffY]) {
                  const cm = cellModels?.[cIdx++];
                  const cellR = cm?.hotPop ? 5.2 : 4.4;
                  const cx = p0.x + ox;
                  const cy = p0.y + oy;
                  const cg = ctx.createRadialGradient(cx, cy, 0.2, cx, cy, cellR);
                  cg.addColorStop(0, '#ffffff');
                  cg.addColorStop(0.38, cm?.hotPop ? 'rgba(255,255,255,0.95)' : 'rgba(255,235,160,0.82)');
                  cg.addColorStop(0.75, 'rgba(255,165,40,0.22)');
                  cg.addColorStop(1, 'rgba(255,140,0,0)');
                  ctx.fillStyle = cg;
                  ctx.beginPath();
                  ctx.arc(cx, cy, cellR, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            } else if (ls.strobe && (cat === 'strobe' || Boolean(l.strobeCapable18)) && evalStrobePulse18(cat, i, 0, nowMs).gate) {
              // Crisp 6-point Xenon Atomic Strobe discharge spikes on ON phase (floor/dedicated strobes only)
              ctx.strokeStyle = 'rgba(235,248,255,0.68)';
              ctx.lineWidth = 1.2;
              for (let s = 0; s < 3; s++) {
                const ang = (s * Math.PI) / 3 + (nowMs * 0.005);
                const rSpike = flareR * 1.25;
                ctx.beginPath();
                ctx.moveTo(p0.x - Math.cos(ang) * rSpike, p0.y - Math.sin(ang) * rSpike);
                ctx.lineTo(p0.x + Math.cos(ang) * rSpike, p0.y + Math.sin(ang) * rSpike);
                ctx.stroke();
              }
            }
          }
        }
      }

      // 3. 16-Beam ILDA Laser Fan & Liquid Sky Wave Sheet (coherent optical core + emitter aperture glow)
      if (ls.running && ls.laserOn && !ls.blackout) {
        const patternIdx = ls.laserPattern === 'auto' ? (showIdx - 1) % 4 : (Number(ls.laserPattern) || 0) % 4;
        const customLaserPal = lumiState.dmxProgrammer18?.groupPalettes?.laser;
        const laserPal = Array.isArray(customLaserPal) && customLaserPal.length ? customLaserPal : LMP_LASER_PALETTES18;
        const units = Array.isArray(ls._laserRenderData) && ls._laserRenderData.length
          ? ls._laserRenderData
          : [[-4.2, 4.2, -1.6], [4.2, 4.2, -1.6]].map((org, uIdx) =>
              evalLaserScanPattern18(patternIdx, org, uIdx, tSec, spd, ls.multicolor, laserPal, 16)
            );

        units.forEach((unit) => {
          const pOrigin = proj(unit.origin);
          if (!pOrigin) return;
          const baseCol = unit.baseCol || laserPal[0];
          const altCol = unit.altCol || laserPal[1 % laserPal.length];
          const ends = [];
          for (const ray of unit.rays || []) {
            if (ray.gate === false) continue;
            const bInt = Number.isFinite(ray.beamIntensity) ? ray.beamIntensity : 1;
            if (bInt <= 0.04) continue;
            const pEnd = proj(ray.target3d);
            if (!pEnd) continue;
            ends.push({ pEnd, rayCol: ray.rayCol, beamIntensity: bInt });
          }

          if (!hasWebglBatch && ends.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(pOrigin.x, pOrigin.y);
            for (const e of ends) ctx.lineTo(e.pEnd.x, e.pEnd.y);
            ctx.closePath();
            const sheetGrad = ctx.createRadialGradient(pOrigin.x, pOrigin.y, 2, pOrigin.x, pOrigin.y, 260);
            sheetGrad.addColorStop(0, rgba18(baseCol, 0.16));
            sheetGrad.addColorStop(0.6, rgba18(altCol, 0.05));
            sheetGrad.addColorStop(1, rgba18(baseCol, 0));
            ctx.fillStyle = sheetGrad;
            ctx.fill();
          }

          if (!hasWebglBatch) {
            for (const { pEnd, rayCol, beamIntensity } of ends) {
              ctx.strokeStyle = rgba18(rayCol, 0.24 * beamIntensity);
              ctx.lineWidth = 3.8;
              ctx.beginPath();
              ctx.moveTo(pOrigin.x, pOrigin.y);
              ctx.lineTo(pEnd.x, pEnd.y);
              ctx.stroke();

              ctx.strokeStyle = rgba18(rayCol, 0.86 * beamIntensity);
              ctx.lineWidth = 1.25;
              ctx.beginPath();
              ctx.moveTo(pOrigin.x, pOrigin.y);
              ctx.lineTo(pEnd.x, pEnd.y);
              ctx.stroke();

              ctx.strokeStyle = `rgba(235,255,255,${(0.78 * beamIntensity).toFixed(3)})`;
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(pOrigin.x, pOrigin.y);
              ctx.lineTo(pEnd.x, pEnd.y);
              ctx.stroke();
            }
          }

          // Laser aperture emitter glow
          const lg = ctx.createRadialGradient(pOrigin.x, pOrigin.y, 0.5, pOrigin.x, pOrigin.y, 14);
          lg.addColorStop(0, '#ffffff');
          lg.addColorStop(0.32, rgba18(baseCol, 0.85));
          lg.addColorStop(1, rgba18(baseCol, 0));
          ctx.fillStyle = lg;
          ctx.beginPath();
          ctx.arc(pOrigin.x, pOrigin.y, 14, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 4. Render Active Pyro Nozzle Cores & Floor Glow (2D fallback only when WebGL2 3D GPU particle batch is unavailable)
      if (!hasWebglBatch) {
      for (const nz of ls.activeNozzles) {
        const pBase = proj(nz.pos);
        const pTop = proj([
          nz.pos[0] + nz.heightM * (Number(nz.tiltX) || 0),
          nz.pos[1] + nz.heightM,
          nz.pos[2] + nz.heightM * (Number(nz.tiltZ) || 0)
        ]);
        if (!pBase || !pTop) continue;
        const plumeH = Math.max(12, Math.hypot(pTop.x - pBase.x, pTop.y - pBase.y));

        if (nz.kind === 'cold_spark_fountain') {
          // Razor-thin white-gold high-temperature sparkular jet needle spine
          const g = ctx.createLinearGradient(pBase.x, pBase.y, pTop.x, pTop.y);
          g.addColorStop(0, 'rgba(255,255,255,0.92)');
          g.addColorStop(0.24, 'rgba(255,225,115,0.58)');
          g.addColorStop(0.68, 'rgba(255,155,25,0.14)');
          g.addColorStop(1, 'rgba(255,110,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(pBase.x - 1.5, pBase.y);
          ctx.lineTo(pBase.x + 1.5, pBase.y);
          ctx.lineTo(pTop.x + Math.max(3.5, plumeH * 0.05), pTop.y);
          ctx.lineTo(pTop.x - Math.max(3.5, plumeH * 0.05), pTop.y);
          ctx.closePath();
          ctx.fill();
        } else if (nz.kind === 'co2_jet') {
          // Pressurized Cryo CO2 jet stream rendered in source-over so vapor stays cool ice-blue/white mist
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          const topW = Math.max(14, plumeH * 0.24);
          const wobble = Math.sin(nowMs * 0.025 + nz.pos[0]) * 3.5;
          const g = ctx.createLinearGradient(pBase.x, pBase.y, pTop.x + wobble, pTop.y);
          g.addColorStop(0, 'rgba(248,254,255,0.82)');
          g.addColorStop(0.32, 'rgba(205,242,255,0.42)');
          g.addColorStop(0.72, 'rgba(155,222,250,0.16)');
          g.addColorStop(1, 'rgba(130,210,245,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(pBase.x - 2.0, pBase.y);
          ctx.lineTo(pBase.x + 2.0, pBase.y);
          ctx.lineTo(pTop.x + wobble + topW, pTop.y);
          ctx.lineTo(pTop.x + wobble - topW, pTop.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (nz.kind === 'flame_jet') {
          // Tapered organic teardrop flame tongue (bezier-sculpted crimson/orange outer + white-hot base)
          const whipX = Math.sin(nowMs * 0.026 + nz.pos[0] * 1.9) * (plumeH * 0.12);
          const baseW = Math.max(4.5, plumeH * 0.085);
          const bellyW = Math.max(8.5, plumeH * 0.16);
          const midY = pBase.y + (pTop.y - pBase.y) * 0.46;
          const tipX = pTop.x + whipX;
          const tipY = pTop.y;

          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          const outerG = ctx.createLinearGradient(pBase.x, pBase.y, tipX, tipY);
          outerG.addColorStop(0, 'rgba(255,190,60,0.85)');
          outerG.addColorStop(0.35, 'rgba(245,88,0,0.78)');
          outerG.addColorStop(0.76, 'rgba(185,18,0,0.42)');
          outerG.addColorStop(1, 'rgba(80,4,0,0)');
          ctx.fillStyle = outerG;
          ctx.beginPath();
          ctx.moveTo(pBase.x - baseW, pBase.y);
          ctx.quadraticCurveTo(pBase.x - bellyW, midY, tipX, tipY);
          ctx.quadraticCurveTo(pBase.x + bellyW, midY, pBase.x + baseW, pBase.y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Inner luminous thermal core
          const coreTipX = pBase.x + whipX * 0.45;
          const coreTipY = pBase.y + (pTop.y - pBase.y) * 0.62;
          const coreG = ctx.createLinearGradient(pBase.x, pBase.y, coreTipX, coreTipY);
          coreG.addColorStop(0, 'rgba(220,245,255,0.95)');
          coreG.addColorStop(0.18, 'rgba(255,250,190,0.92)');
          coreG.addColorStop(0.65, 'rgba(255,150,15,0.55)');
          coreG.addColorStop(1, 'rgba(255,90,0,0)');
          ctx.fillStyle = coreG;
          ctx.beginPath();
          ctx.moveTo(pBase.x - baseW * 0.52, pBase.y);
          ctx.quadraticCurveTo(pBase.x - bellyW * 0.48, (pBase.y + coreTipY) * 0.5, coreTipX, coreTipY);
          ctx.quadraticCurveTo(pBase.x + bellyW * 0.48, (pBase.y + coreTipY) * 0.5, pBase.x + baseW * 0.52, pBase.y);
          ctx.closePath();
          ctx.fill();
        }

        // Perspective-compressed elliptical nozzle floor pool glow (not a spherical ball)
        const baseR = Math.max(12, plumeH * 0.22);
        const bg = ctx.createRadialGradient(pBase.x, pBase.y, 0.5, pBase.x, pBase.y, baseR);
        bg.addColorStop(0, 'rgba(255,255,255,0.75)');
        bg.addColorStop(0.32, rgba18(nz.color, 0.38 * nz.level));
        bg.addColorStop(0.72, rgba18(nz.color, 0.10 * nz.level));
        bg.addColorStop(1, rgba18(nz.color, 0));
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.ellipse(pBase.x, pBase.y, baseR, baseR * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      }

      // 5. Render Rising Aerial Pyro Comet Shells (2D fallback when WebGL2 batch is unavailable)
      if (!hasWebglBatch) {
        for (const s of ls.aerialShells) {
          const pHead = proj([s.x, s.y, s.z]);
          if (!pHead) continue;
          const pTail = proj([s.x - s.vx * 0.14, s.y - Math.max(1.4, s.vy * 0.14), s.z - s.vz * 0.14]);
          if (pTail) {
            const tg = ctx.createLinearGradient(pHead.x, pHead.y, pTail.x, pTail.y);
            tg.addColorStop(0, '#ffffff');
            tg.addColorStop(0.32, rgba18(s.color || '#ffe680', 0.90));
            tg.addColorStop(1, rgba18('#ff8800', 0));
            ctx.strokeStyle = tg;
            ctx.lineWidth = 2.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pTail.x, pTail.y);
            ctx.lineTo(pHead.x, pHead.y);
            ctx.stroke();
          }
          const hg = ctx.createRadialGradient(pHead.x, pHead.y, 0.4, pHead.x, pHead.y, 6.5);
          hg.addColorStop(0, '#ffffff');
          hg.addColorStop(0.38, rgba18(s.color || '#ffe680', 0.82));
          hg.addColorStop(1, rgba18(s.color || '#ffe680', 0));
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(pHead.x, pHead.y, 6.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. Render 3D Physics Particles (2D fallback only when WebGL2 3D GPU particle batch is unavailable)
      if (!hasWebglBatch) {
      for (let i = 0; i < ls.particles.length; i++) {
        const p = ls.particles[i];
        const pr = proj([p.x, p.y, p.z]);
        if (!pr) continue;
        const u = clamp18(p.age / Math.max(0.05, p.maxAge), 0, 1);
        const lifeAlpha = 1 - u;

        if (p.kind === 'spark' || p.kind === 'gold_mine' || p.kind === 'mine_gold') {
          const tail3d = [
            p.x - (p.vx || 0) * 0.055,
            p.y - (p.vy || 4) * 0.055,
            p.z - (p.vz || 0) * 0.055
          ];
          const prevPr = proj(tail3d);
          ctx.strokeStyle = u < 0.34 ? `rgba(255,255,245,${(lifeAlpha * 0.95).toFixed(2)})` : `rgba(255,192,62,${(lifeAlpha * 0.86).toFixed(2)})`;
          ctx.lineWidth = clamp18(p.size * 0.48 * (1 - u * 0.45), 1.0, 1.9);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(prevPr ? prevPr.x : pr.x, prevPr ? prevPr.y : pr.y + 6);
          ctx.lineTo(pr.x, pr.y);
          ctx.stroke();

          if (u < 0.58) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pr.x, pr.y, 1.15, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (p.kind === 'co2') {
          // Render cryo vapor puffs with source-over so clouds look like cold mist, never glowing white lightbulbs
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          const rPx = clamp18(p.size * 22 * (0.55 + u * 0.75), 6, 36);
          const cg = ctx.createRadialGradient(pr.x, pr.y, 0.5, pr.x, pr.y, rPx);
          const mistAlpha = Math.sin(u * Math.PI) * 0.26;
          cg.addColorStop(0, `rgba(242,252,255,${mistAlpha.toFixed(3)})`);
          cg.addColorStop(0.48, `rgba(195,235,250,${(mistAlpha * 0.52).toFixed(3)})`);
          cg.addColorStop(0.82, `rgba(160,218,242,${(mistAlpha * 0.16).toFixed(3)})`);
          cg.addColorStop(1, 'rgba(140,210,240,0)');
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.ellipse(pr.x, pr.y, rPx * 0.88, rPx * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'flame') {
          // Vertically stretched licking flame wisp (teardrop tongue, not a round circle)
          const rW = clamp18(p.size * 11 * (1 - u * 0.42), 3.5, 16);
          const rH = rW * 2.15;
          const col = u < 0.22 ? '#fff4a8' : u < 0.56 ? '#ff6a00' : '#b81400';
          ctx.save();
          if (u >= 0.42) ctx.globalCompositeOperation = 'source-over';
          const fg = ctx.createRadialGradient(pr.x, pr.y + rH * 0.15, 0.5, pr.x, pr.y, rH);
          fg.addColorStop(0, u < 0.18 ? 'rgba(255,255,240,0.78)' : rgba18(col, lifeAlpha * 0.52));
          fg.addColorStop(0.45, rgba18(col, lifeAlpha * 0.28));
          fg.addColorStop(0.82, rgba18('#6e0800', lifeAlpha * 0.08));
          fg.addColorStop(1, 'rgba(60,0,0,0)');
          ctx.fillStyle = fg;
          ctx.beginPath();
          ctx.moveTo(pr.x, pr.y - rH);
          ctx.quadraticCurveTo(pr.x + rW, pr.y, pr.x, pr.y + rH * 0.55);
          ctx.quadraticCurveTo(pr.x - rW, pr.y, pr.x, pr.y - rH);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'muzzle_flash') {
          const rPx = clamp18(p.size * 11 * lifeAlpha, 4, 24);
          const mg = ctx.createRadialGradient(pr.x, pr.y, 0.5, pr.x, pr.y, rPx);
          mg.addColorStop(0, `rgba(255,255,255,${(lifeAlpha * 0.72).toFixed(2)})`);
          mg.addColorStop(0.42, rgba18(p.color || '#ffe680', lifeAlpha * 0.38));
          mg.addColorStop(1, rgba18(p.color || '#ffe680', 0));
          ctx.fillStyle = mg;
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, rPx, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'firework_star' || p.kind === 'crackle_star' || p.kind === 'firework_crackle' || p.kind === 'willow_trail' || p.kind === 'comet_micro') {
          const twinkle = u > 0.52 ? (Math.sin(nowMs * 0.065 + p.seed) > 0 ? 1 : 0.22) : 1;
          const alpha = lifeAlpha * twinkle;
          if (alpha <= 0.04) continue;
          const tailDt = p.isWillow ? 0.135 : 0.092;
          const prevPr = proj([
            p.x - (p.vx || 0) * tailDt,
            p.y - (p.vy || 0) * tailDt,
            p.z - (p.vz || 0) * tailDt
          ]);
          if (prevPr) {
            const sg = ctx.createLinearGradient(pr.x, pr.y, prevPr.x, prevPr.y);
            sg.addColorStop(0, '#ffffff');
            sg.addColorStop(0.28, rgba18(p.color, alpha * 0.90));
            sg.addColorStop(0.72, rgba18(p.color, alpha * 0.32));
            sg.addColorStop(1, rgba18(p.color, 0));
            ctx.strokeStyle = sg;
            ctx.lineWidth = clamp18(p.size * 0.52 * (1 - u * 0.38), 1.0, 2.1);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(prevPr.x, prevPr.y);
            ctx.lineTo(pr.x, pr.y);
            ctx.stroke();
          }
          // Jewel-sharp star head (compact radius prevents 96 stars from merging into a white blob)
          const starR = clamp18(p.size * 0.95 * (1 - u * 0.35), 1.8, 3.8);
          const hg = ctx.createRadialGradient(pr.x, pr.y, 0.2, pr.x, pr.y, starR);
          hg.addColorStop(0, '#ffffff');
          hg.addColorStop(0.38, rgba18(p.color, alpha * 0.85));
          hg.addColorStop(0.75, rgba18(p.color, alpha * 0.22));
          hg.addColorStop(1, rgba18(p.color, 0));
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, starR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      }

      // 7. Render Organic Crowd Bounce silhouettes (Phase B, only when explicitly requested via crowdBounce2dOverlay) & Acoustic Wave Flow (Phase C)
      const has3DCrowd = ((S.seq || window.seq)?.people || []).some((p) => p && !p.hidden && p.type === 'audience');
      if (lumiState.structureConfig18?.crowdBounce2dOverlay && ls.running && !has3DCrowd) {
        drawOrganicCrowdBounce18(ctx, proj, eng, tSec, spd, ls.running);
      }
      if (lumiState.audioWorkstation18?.waveFlowVisible && ls.running) {
        drawAudioWaveFlowOverlay18(ctx, proj, eng, tSec, spd);
      }

      ctx.restore();
      return can;
    }

    let liveShowRafId18 = 0;
    function ensureLiveShowLoop18() {
      if (liveShowRafId18 || typeof requestAnimationFrame !== 'function') return;
      const step = (now) => {
        const ls = liveShow18;
        const active = lumiState.screenCapture18.active || ls.running || now < ls.sparkUntilMs || now < ls.co2UntilMs || now < ls.flameUntilMs || ls.particles.length > 0 || ls.aerialShells.length > 0;
        if (!active) {
          liveShowRafId18 = 0;
          renderLiveShowOverlay18(now);
          return;
        }
        liveShowRafId18 = requestAnimationFrame(step);
        if (S.engine && !window.state?.playing) {
          S.engine.render(window.state?.time || 0);
        }
      };
      liveShowRafId18 = requestAnimationFrame(step);
    }

    function startLiveShow18(showMode = null) {
      const ls = liveShow18;
      const eng = S.engine;
      if (showMode != null) {
        if (showMode === 'ai') ls.aiAuto = true;
        else {
          ls.aiAuto = false;
          ls.activeShow = clamp18(Math.round(+showMode) || 1, 1, 6);
        }
      }
      if (!ls.running && eng) {
        ls.savedSettings = eng.settings ? { ...eng.settings } : null;
        ls.savedMotion = { accent: eng.accent, effect: eng.effect };
        if (eng.settings) {
          eng.settings.ambient = Math.min(Number(eng.settings.ambient) || 0.7, 0.22);
          eng.settings.beam = Math.max(Number(eng.settings.beam) || 0.45, 0.94);
          eng.settings.haze = Math.max(Number(eng.settings.haze) || 18, 32);
          eng.settings.exposure = Math.max(Number(eng.settings.exposure) || 1.0, 1.24);
        }
      }
      ls.running = true;
      ls.dockHidden = false;
      ls.blackout = false;
      ls.lastTickMs = nowMs18();
      if (ls.sfxOn) {
        ls.sparkUntilMs = Math.max(ls.sparkUntilMs || 0, ls.lastTickMs + 1800);
      }
      hookEngineRender18();
      if (S.laser135 && S.laser135.preset !== 'ildaShow') {
        S.laser135.previewPlaying = false;
      }
      const st18 = S.state || window.state;
      const playFn18 = S.setPlaying || window.setPlaying;
      if (st18 && !st18.playing && typeof playFn18 === 'function') {
        try { playFn18(true); } catch { /* ignore */ }
      }
      tickLiveShow18(nowMs18());
      if (eng && typeof eng.render === 'function') {
        try { eng.render(window.state?.time || 0); } catch { /* ignore */ }
      }
      ensureLiveShowLoop18();
      renderLmpToolbox18();
      renderLmpLiveShowDock18();
      return ls;
    }

    function stopLiveShow18() {
      const ls = liveShow18;
      const eng = S.engine;
      ls.running = false;
      ls.blindersOn = false;
      ls.strobe = false;
      ls.blackout = false;
      ls.activeNozzles = [];
      ls.crowdBounceOffsetM = 0;
      ls._crowdSmoothEnergy = 0;
      ls._floorProjections = [];
      ls._deckGlints = [];
      ls._screenHaloPools = [];
      ls._floorDecalInstances = [];
      ls._deckGlintInstances = [];
      ls._screenHaloInstances = [];
      ls._laserRenderData = [];
      ls._sfxStageGlow.active = false;
      ls._sfxStageGlow.power = 0;
      ls._sfxSkyBurst.active = false;
      ls._sfxSkyBurst.power = 0;
      ls.particles = [];
      ls.aerialShells = [];
      ls.sparkUntilMs = 0;
      ls.co2UntilMs = 0;
      ls.flameUntilMs = 0;
      if (liveShowRafId18 && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(liveShowRafId18);
        liveShowRafId18 = 0;
      }
      const st18 = S.state || window.state;
      const playFn18 = S.setPlaying || window.setPlaying;
      if (st18?.playing && !st18?.recording) {
        if (typeof playFn18 === 'function') {
          try { playFn18(false); } catch { st18.playing = false; }
        } else {
          st18.playing = false;
        }
      }
      if (eng && Array.isArray(eng.lights)) {
        eng.lights.forEach((l) => {
          if (!l) return;
          delete l._isBlinder18;
          if (l._origShow18) {
            l.target = l._origShow18.target.slice();
            l.color = l._origShow18.color;
            l.power = l._origShow18.power;
            l.angle = l._origShow18.angle;
            l.enabled = l._origShow18.enabled;
            l.sweep = l._origShow18.sweep;
            l.fx = l._origShow18.fx;
            l.beamProfile18 = l._origShow18.beamProfile18 ?? 0;
            l.gobo9 = l._origShow18.gobo9 ? { ...l._origShow18.gobo9 } : null;
            for (const key of ['aperture', 'fixtureProfile18', 'profileId18', 'coneLenScale18', '_blinderBlastScale18', 'dmxGroup18', '_liveCat18', '_isBlinder18']) delete l[key];
            Object.assign(l, l._origShow18.optics);
            delete l._origShow18;
          }
        });
      }
      if (eng && ls.savedCamera && eng.camera) {
        eng.camera.yaw = ls.savedCamera.yaw;
        eng.camera.pitch = ls.savedCamera.pitch;
        eng.camera.distance = ls.savedCamera.distance;
        if (Array.isArray(ls.savedCamera.target)) eng.camera.target = ls.savedCamera.target.slice();
        ls.savedCamera = null;
      }
      if (eng && ls.savedSettings && eng.settings) {
        Object.assign(eng.settings, ls.savedSettings);
        ls.savedSettings = null;
      }
      if (eng && ls.savedMotion) {
        Object.assign(eng, ls.savedMotion);
        ls.savedMotion = null;
      }
      if (S.laser135) {
        S.laser135.previewPlaying = false;
      }
      if (eng && typeof eng.render === 'function') {
        try { eng.render(window.state?.time || 0); } catch { /* ignore */ }
      }
      renderLiveShowOverlay18(nowMs18());
      renderLmpToolbox18();
      renderLmpLiveShowDock18();
      return ls;
    }

    function toggleLiveShow18() {
      return liveShow18.running ? stopLiveShow18() : startLiveShow18();
    }

    function setLiveShowMode18(mode, opts = {}) {
      const ls = liveShow18;
      if (mode === 'ai') {
        ls.aiAuto = opts.fromSelect ? true : !ls.aiAuto;
      } else {
        ls.aiAuto = false;
        const idx = clamp18(Math.round(+mode) || 1, 1, 6);
        if (ls.activeShow !== idx) {
          ls.prevShow = ls.activeShow;
          ls.transitionStartMs = nowMs18();
          ls.transitionDurSec = clamp18(1.15 / Math.max(0.2, ls.speed || 2.0), 0.55, 1.65);
          ls.transitionAlpha = 0;
        }
        ls.activeShow = idx;
        if (opts.applySet !== false) {
          applyStageSet18(idx, opts);
        }
      }
      if (!ls.running) startLiveShow18();
      else {
        tickLiveShow18(nowMs18());
        renderLmpToolbox18();
        renderLmpLiveShowDock18();
      }
      return ls;
    }

    function setLiveShowSpeed18(val) {
      liveShow18.speed = clamp18(Number(val) || 2.0, 0.2, 5.0);
      renderLmpToolbox18();
      renderLmpLiveShowDock18();
      return liveShow18.speed;
    }

    function setParChaseMode18(mode) {
      const valid = ['auto', 'carousel', 'mirror_domino', 'dual_carousel', 'gala_sparkle', 'static'];
      const m = String(mode || 'auto').toLowerCase();
      liveShow18.parChaseMode = valid.includes(m) ? m : 'auto';
      if (lumiState.dmxProgrammer18 && m !== 'auto') {
        lumiState.dmxProgrammer18.parChaseMode = liveShow18.parChaseMode;
      }
      renderLmpLiveShowDock18();
      return liveShow18.parChaseMode;
    }

    function setBeamFanLaw18(law) {
      const valid = ['auto', 'v_converge', 'v_diverge', 'x_cross', 'parallel_wing', 'parallel_zero'];
      const l = String(law || 'auto').toLowerCase();
      const next = valid.includes(l) ? l : 'auto';
      liveShow18.fanLaw = next;
      liveShow18.beamFanLaw = next;
      renderLmpLiveShowDock18();
      return next;
    }

    function setLaserPattern18(pat) {
      if (pat === 'auto' || pat === '' || pat == null) {
        liveShow18.laserPattern = 'auto';
      } else {
        liveShow18.laserPattern = clamp18(Math.round(Number(pat)) || 0, 0, 3);
      }
      renderLmpLiveShowDock18();
      return liveShow18.laserPattern;
    }

    function toggleAutoCamera18(force) {
      const ls = liveShow18;
      const eng = S.engine;
      const next = typeof force === 'boolean' ? force : !ls.autoCam;
      if (next && !ls.autoCam && eng?.camera) {
        if (typeof S.setOrbit === 'function') S.setOrbit(false);
        else if (S.state) S.state.orbit = false;
        ls.savedCamera = {
          yaw: eng.camera.yaw,
          pitch: eng.camera.pitch,
          distance: eng.camera.distance,
          target: Array.isArray(eng.camera.target) ? eng.camera.target.slice() : [0, 2.5, 0]
        };
        ls.autoCamPausedUntilMs = 0;
        if (!ls.running) startLiveShow18();
      } else if (!next && ls.autoCam && eng?.camera && ls.savedCamera) {
        eng.camera.yaw = ls.savedCamera.yaw;
        eng.camera.pitch = ls.savedCamera.pitch;
        eng.camera.distance = ls.savedCamera.distance;
        if (Array.isArray(ls.savedCamera.target)) eng.camera.target = ls.savedCamera.target.slice();
        ls.savedCamera = null;
      }
      ls.autoCam = next;
      renderLmpLiveShowDock18();
      return ls.autoCam;
    }

    function toggleLiveShowFx18(fxKey) {
      const ls = liveShow18;
      if (fxKey === 'multicolor') ls.multicolor = !ls.multicolor;
      else if (fxKey === 'lights') ls.lightsOn = !ls.lightsOn;
      else if (fxKey === 'blinders') {
        ls.blindersOn = !ls.blindersOn;
        if (ls.blindersOn && !ls.running) startLiveShow18();
      } else if (fxKey === 'laser') {
        if (!ls.running) {
          ls.laserOn = true;
          startLiveShow18();
        } else {
          ls.laserOn = !ls.laserOn;
        }
        if (S.laser135 && S.laser135.preset !== 'ildaShow') S.laser135.previewPlaying = false;
      } else if (fxKey === 'sfx') {
        if (!ls.running) {
          ls.sfxOn = true;
          startLiveShow18();
          triggerPyroBurst18('all');
        } else {
          ls.sfxOn = !ls.sfxOn;
          if (ls.sfxOn) {
            triggerPyroBurst18('all');
          } else {
            ls.dockCollapsed = true;
          }
        }
      } else if (fxKey === 'strobe') {
        ls.strobe = !ls.strobe;
        if (ls.strobe && !ls.running) startLiveShow18();
      } else if (fxKey === 'bo') {
        ls.blackout = !ls.blackout;
        toggleMasterBlackout();
      } else if (fxKey === 'full') {
        ls.blackout = false;
        ls.lightsOn = true;
        ls.blindersOn = true;
        if (lumiState.masterBlackout) toggleMasterBlackout();
        if (!ls.running) startLiveShow18();
      }
      tickLiveShow18(nowMs18());
      if (S.engine && typeof S.engine.render === 'function') {
        try { S.engine.render(window.state?.time || 0); } catch { /* ignore */ }
      }
      renderLmpToolbox18();
      renderLmpLiveShowDock18();
      if (window.state?.step === 'lighting') window.renderInspector?.();
      return ls;
    }

    function triggerPyroBurst18(filterKind = 'all') {
      const sa = S.stageAssets16;
      const eng = S.engine;
      const now = nowMs18();
      hookEngineRender18();
      const norm = filterKind === 'all' ? 'all' : normalizeSfxType18(filterKind);

      if (norm === 'all' || norm === 'cold_spark_fountain') liveShow18.sparkUntilMs = now + 2600;
      if (norm === 'all' || norm === 'co2_jet') liveShow18.co2UntilMs = now + 2200;
      if (norm === 'all' || norm === 'flame_jet') liveShow18.flameUntilMs = now + 2400;
      if (norm === 'all' || norm === 'confetti_cannon') launchAerialPyro18(4);

      const nozzlesByType = getStageSfxNozzles18();
      if (norm === 'all' || norm === 'cold_spark_fountain') {
        nozzlesByType.cold_spark_fountain.forEach((nz) => spawnNozzleParticles18(nz, 'cold_spark_fountain', 1.25));
      }
      if (norm === 'all' || norm === 'co2_jet') {
        nozzlesByType.co2_jet.forEach((nz) => spawnNozzleParticles18(nz, 'co2_jet', 1.25));
      }
      if (norm === 'all' || norm === 'flame_jet') {
        nozzlesByType.flame_jet.forEach((nz) => spawnNozzleParticles18(nz, 'flame_jet', 1.25));
      }

      const items = Array.isArray(sa?.items) ? sa.items : [];
      const sfxTypes = new Set(['cold_spark_fountain', 'co2_jet', 'flame_jet', 'confetti_cannon', 'haze_machine_pro']);
      const targets = items.filter((it) => {
        const k = normalizeSfxType18(it.kind || it.type);
        if (!sfxTypes.has(k)) return false;
        return norm === 'all' || k === norm;
      });
      targets.forEach((it) => {
        const baseScale = Number(it._baseScale18) || Number(it.scale) || 1;
        it._baseScale18 = baseScale;
        it.scale = +(baseScale * 1.42).toFixed(2);
        sa?.syncItemMeshes?.(it);
      });
      if (eng?.settings) {
        eng.settings.haze = Math.max(Number(eng.settings.haze) || 16, 28);
        eng.settings.beam = Math.max(Number(eng.settings.beam) || 0.6, 0.88);
      }
      if (eng) eng._stageBatchDirty = true;
      if (typeof setTimeout === 'function') {
        setTimeout(() => {
          targets.forEach((it) => {
            if (it._baseScale18) it.scale = it._baseScale18;
            sa?.syncItemMeshes?.(it);
          });
          if (eng) eng._stageBatchDirty = true;
        }, 1600);
      }

      tickLiveShow18(now);
      if (eng && typeof eng.render === 'function') {
        try { eng.render(window.state?.time || 0); } catch { /* ignore */ }
      }
      ensureLiveShowLoop18();
      const totalTriggered = Math.max(targets.length, liveShow18.activeNozzles.length, liveShow18.aerialShells.length);
      window.toast?.(tr18(`Đã kích hoạt hiệu ứng Pyro & SFX 3D (${totalTriggered} cụm).`, `Triggered 3D Pyro & SFX burst (${totalTriggered} emitters).`));
      return totalTriggered;
    }

    function addToolboxPyroSfx18(rawKind, opts = {}) {
      const sa = S.stageAssets16;
      if (typeof sa?.addCatalogItem !== 'function') return [];
      const kindMap = { cold_spark: 'sparkular', cold_spark_fountain: 'sparkular', co2_jet: 'co2_jets', flame_jet: 'flames', confetti_cannon: 'aerial_pyro', haze_machine_pro: 'hazer' };
      const kind = kindMap[rawKind] || rawKind;
      const deckH = Math.max(0.4, (S.engine?.stageBounds?.min?.[1] || 0) + 0.5);
      const mapKind = {
        sparkular: { id: 'cold_spark_fountain', labelVi: 'Pháo điện lạnh Sparkular', labelEn: 'Sparkular Cold Sparks', xs: [-4.8, -1.6, 1.6, 4.8], z: 2.55 },
        co2_jets: { id: 'co2_jet', labelVi: 'Súng khói lạnh CO2', labelEn: 'CO2 Cryo Jets', xs: [-4.2, -1.4, 1.4, 4.2], z: 2.4 },
        flames: { id: 'flame_jet', labelVi: 'Máy phun lửa DMX', labelEn: 'DMX Flame Jets', xs: [-5.4, -2.0, 2.0, 5.4], z: 2.15 },
        hazer: { id: 'haze_machine_pro', labelVi: 'Máy tạo khói Hazer', labelEn: 'Pro DMX Hazer', xs: [-7.4, 7.4], z: -0.6 },
        aerial_pyro: { id: 'confetti_cannon', labelVi: 'Pháo hoa tầm cao & Kim tuyến', labelEn: 'Aerial Pyro & Confetti', xs: [-5.6, -2.2, 2.2, 5.6], z: 2.75 }
      };
      const cfg = mapKind[kind] || mapKind.sparkular;
      const count = Number.isFinite(+opts.count) ? Math.max(1, Math.min(16, Math.round(+opts.count))) : cfg.xs.length;
      const defaultSpan = Math.abs((cfg.xs[cfg.xs.length - 1] || 4.8) - (cfg.xs[0] || -4.8)) || 9.6;
      const spanM = Number.isFinite(+opts.spanM) ? clamp18(+opts.spanM, 2, 24) : defaultSpan;
      const mountZone = opts.mountZone || (kind === 'hazer' ? 'back' : 'front');
      const posZ = mountZone === 'back' ? -1.2 : mountZone === 'mid' ? 0.6 : cfg.z;
      const scaleVal = Number.isFinite(+opts.scale) ? clamp18(+opts.scale, 0.4, 2.5) : 1;
      const batchId = opts.batchId || `batch_pyro_${kind}_${Date.now().toString(36)}`;
      const xs = count === cfg.xs.length && !opts.spanM && !opts.count
        ? cfg.xs
        : Array.from({ length: count }, (_, i) => (count === 1 ? 0 : +(((i / Math.max(1, count - 1)) - 0.5) * spanM).toFixed(2)));
      const addOpts = { noCheckpoint: true, silent: !!opts.silent, keepInspectorPanel: Boolean(lumiState.rpConfig18 || _suppressRpInspectorRebuild18) };
      const runCreate = () => xs.map((x) => {
        const it = sa.addCatalogItem(cfg.id, [x, deckH, posZ], addOpts);
        if (it) {
          it._isPyroSfx18 = true;
          it._lmpBatchId18 = batchId;
          it._lmpBatchLabel18 = `${tr18(cfg.labelVi, cfg.labelEn)} (${count})`;
          it._lmpToolKind18 = kind;
          it._lmpCategory18 = 'pyro';
          if (scaleVal !== 1) {
            it.scale = scaleVal;
            sa.syncItemMeshes?.(it);
          }
        }
        return it;
      }).filter(Boolean);
      const created = opts.noCheckpoint ? runCreate() : singleUndo18(runCreate);
      if (window.state) {
        window.state.step = 'lighting';
        window.state.selectedLight = null;
        if (created[0]) window.state.selectedSfx18 = created[0].id;
      }
      if (kind === 'hazer' && S.engine?.settings) {
        S.engine.settings.haze = 28;
      }
      if (_suppressRpInspectorRebuild18) window.renderLists?.();
      else window.renderUI?.();
      renderLmpToolbox18();
      if (!opts.silent) {
        triggerPyroBurst18(cfg.id);
      }
      return created;
    }

    function addToolboxScreen18(kind, opts = {}) {
      const eng = S.engine;
      if (!eng || typeof window.createSurface !== 'function') return null;
      if (kind === 'pixel_map_2d') {
        const mapBtn = document.querySelector('.view-tabs [data-view="map"]') || $('atlasBtn');
        mapBtn?.click();
        return null;
      }
      if (!opts.noCheckpoint) window.checkpoint?.();
      const idx = (eng.surfaces?.length || 0) + 1;
      const presets = {
        main_wall: { name: `LED_MAIN_${idx}`, wM: 4.0, hM: 2.5, pos: [0, 2.6, -1.8], yawDeg: 0, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40', rows500x1000: 2, rows500x500: 1, shapeType: 'flat', curveDegPerCab: 0 },
        side_wings: { name: `LED_WING_${idx}`, wM: 2.0, hM: 4.0, pos: [idx % 2 ? -5.8 : 5.8, 2.8, -1.2], yawDeg: idx % 2 ? 12 : -12, cabinetModelId: 'absen_pl39_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat', curveDegPerCab: 0 },
        header: { name: `LED_HEADER_${idx}`, wM: 8.0, hM: 1.0, pos: [0, 5.8, -1.8], yawDeg: 0, cabinetModelId: 'unilumin_ugm2_1000', processorModelId: 'novastar_vx1000', shapeType: 'flat', curveDegPerCab: 0 },
        curved: { name: `LED_CURVED_${idx}`, wM: 6.0, hM: 3.0, pos: [0, 2.8, -1.4], yawDeg: 0, cabinetModelId: 'roe_cb5_1000', processorModelId: 'brompton_sx40', shapeType: 'flat', curveDegPerCab: -5 },
        l_corner_90: { name: `LED_LCORNER_${idx}`, wM: 6.0, hM: 3.0, pos: [-2.4, 2.6, -0.8], yawDeg: 15, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40', rows500x1000: 3, rows500x500: 0, shapeType: 'l_corner_90', curveDegPerCab: 0 },
        cube: { name: `LED_CUBE_${idx}`, wM: 6.0, hM: 1.5, pos: [0, 4.8, 0.4], yawDeg: 25, cabinetModelId: 'absen_pl25_500', processorModelId: 'brompton_s8', shapeType: 'cube', curveDegPerCab: 0 },
        cylinder_360: { name: `LED_CYLINDER_${idx}`, wM: 6.0, hM: 2.5, pos: [0, 2.6, 0.5], yawDeg: 0, cabinetModelId: 'roe_bp2v2_500', processorModelId: 'brompton_sx40', rows500x1000: 2, rows500x500: 1, shapeType: 'cylinder_360', curveDegPerCab: 0 }
      };
      const baseCfg = presets[kind] || presets.main_wall;
      const wM = Number.isFinite(+opts.widthM) ? clamp18(+opts.widthM, 1, 24) : baseCfg.wM;
      const hM = Number.isFinite(+opts.heightM) ? clamp18(+opts.heightM, 0.5, 12) : baseCfg.hM;
      const curveDegPerCab = Number.isFinite(+opts.curveDegPerCab) ? clamp18(+opts.curveDegPerCab, -20, 20) : baseCfg.curveDegPerCab;
      const batchId = opts.batchId || `batch_screen_${kind}_${Date.now().toString(36)}`;
      const cfg = { ...baseCfg, wM, hM, curveDegPerCab };
      const q = buildGeometricLedMesh18(cfg.name, cfg.wM, cfg.hM, cfg.shapeType, cfg.curveDegPerCab);
      q._lmpBatchId18 = batchId;
      const ry = ((cfg.yawDeg || 0) * Math.PI) / 180;
      const mat = window.M.mm(window.M.translate(cfg.pos), window.M.rotate([0, 1, 0], ry));
      window.transformMesh(q, mat);
      eng.stage.push(q);
      const surf = window.createSurface(q, cfg.name, {
        x: 0,
        y: 0,
        w: computePixelDim(cfg.wM, 2.6),
        h: computePixelDim(cfg.hM, 2.6),
        cabinetModelId: cfg.cabinetModelId,
        processorModelId: cfg.processorModelId,
        rows500x1000: cfg.rows500x1000,
        rows500x500: cfg.rows500x500,
        shapeType: cfg.shapeType,
        curveDegPerCab: cfg.curveDegPerCab,
        panelAngleDeg: Number(cfg.curveDegPerCab) || 0
      });
      surf.curveDegPerCab = cfg.curveDegPerCab;
      surf.panelAngleDeg = Number(cfg.curveDegPerCab) || 0;
      surf.columnAnglesDeg = [];
      surf.physicalWidthM = cfg.wM;
      surf.physicalHeightM = cfg.hM;
      surf.physical = [cfg.wM, cfg.hM];
      surf.pos = cfg.pos.slice();
      surf.yawDeg = cfg.yawDeg;
      surf._lmpBatchId18 = batchId;
      surf._lmpToolKind18 = kind;
      q._surfaceId18 = surf.id;
      if (surf.mesh) surf.mesh._surfaceId18 = surf.id;
      window.normalizeSurfaceHardware?.(surf);
      window.rebuildSurface3DMesh?.(surf);
      eng.selected = surf.id;
      eng._stageBatchDirty = true;
      if (window.state) window.state.step = 'mapping';
      if (_suppressRpInspectorRebuild18) window.renderLists?.();
      else window.renderUI?.();
      renderLmpToolbox18();
      if (!opts.silent) {
        window.toast?.(tr18(`Đã thêm màn hình ${cfg.name} (${cfg.wM}×${cfg.hM}m · ${cfg.shapeType}).`, `Added LED screen ${cfg.name} (${cfg.wM}×${cfg.hM}m · ${cfg.shapeType}).`));
      }
      return surf;
    }

    function toggleLiveShowDock18(force) {
      liveShow18.dockHidden = typeof force === 'boolean' ? !force : !liveShow18.dockHidden;
      renderLmpLiveShowDock18();
      renderLmpToolbox18();
      return !liveShow18.dockHidden;
    }

    function getLmpFxSelectOptions18() {
      const ls = liveShow18;
      const curFanLaw = (ls.fanLaw && ls.fanLaw !== 'auto') ? ls.fanLaw : (ls.beamFanLaw || 'auto');
      const chaseList = [
        ['auto', tr18('PAR: Tự động theo Show', 'PAR: Auto (By Show)')],
        ['carousel', tr18('PAR: Đuổi vòng tròn (Carousel)', 'PAR: Carousel Chase')],
        ['mirror_domino', tr18('PAR: Đối xứng tâm (Mirror Domino)', 'PAR: Mirror Domino')],
        ['dual_carousel', tr18('PAR: Đuổi kép 2 hướng (Dual Carousel)', 'PAR: Dual Carousel')],
        ['gala_sparkle', tr18('PAR: Lấp lánh Gala (Gala Sparkle)', 'PAR: Gala Sparkle')],
        ['static', tr18('PAR: Tĩnh đồng nhất (Static Wash)', 'PAR: Static Wash')]
      ];
      const fanList = [
        ['auto', tr18('Beam Fan: Tự động theo Show', 'Beam Fan: Auto (By Show)')],
        ['v_converge', tr18('Beam Fan: Chụm chữ V (V-Converge)', 'Beam Fan: V-Converge')],
        ['v_diverge', tr18('Beam Fan: Xòe chữ V (V-Diverge)', 'Beam Fan: V-Diverge')],
        ['x_cross', tr18('Beam Fan: Đan chéo chữ X (X-Cross)', 'Beam Fan: X-Cross')],
        ['parallel_wing', tr18('Beam Fan: Quạt cánh song song (Parallel Wing)', 'Beam Fan: Parallel Wing')],
        ['parallel_zero', tr18('Beam Fan: Thẳng đứng song song (Parallel Zero)', 'Beam Fan: Parallel Zero')]
      ];
      const laserList = [
        ['auto', tr18('Laser: Tự động theo Show', 'Laser: Auto (By Show)')],
        ['0', tr18('P0 · Màn sương ngang (Liquid Sky)', 'P0 · Liquid Sky Horizon')],
        ['1', tr18('P1 · Đường hầm nón (Cone Tunnel)', 'P1 · Cone Tunnel')],
        ['2', tr18('P2 · Chặt chéo tia (X-Chopper)', 'P2 · X-Chopper')],
        ['3', tr18('P3 · Pháo bông đa tia (Starburst)', 'P3 · Starburst')]
      ];
      return {
        curFanLaw,
        parChase: chaseList.slice(1),
        fanLaw: fanList.slice(1),
        laserPat: laserList.slice(1),
        chaseOpts: chaseList.map(([val, lbl]) => `<option value="${val}" ${ls.parChaseMode === val ? 'selected' : ''}>${esc18(lbl)}</option>`).join(''),
        fanOpts: fanList.map(([val, lbl]) => `<option value="${val}" ${curFanLaw === val ? 'selected' : ''}>${esc18(lbl)}</option>`).join(''),
        laserOpts: laserList.map(([val, lbl]) => `<option value="${val}" ${String(ls.laserPattern) === val ? 'selected' : ''}>${esc18(lbl)}</option>`).join('')
      };
    }

    function openLmpHelpModal18() {
      const title = tr18('Hướng dẫn Hệ thống Đèn, Pháo SFX & Live Show', 'Lighting, Pyro SFX & Live Show Guide');
      const body =
        `<div class="lmp-help-modal18 lmp-help-body18">` +
        `<div class="lmp-help-sec18">` +
        `<h4>1. ${tr18('Các kênh điều khiển độc lập trên thanh Live Show', 'Independent Live Show Control Channels')}</h4>` +
        `<ul class="lmp-help-list18">` +
        `<li><b>${tr18('ĐÈN (LIGHTS · Phím M)', 'LIGHTS (Key M)')}:</b> ${tr18('Bật/tắt hệ đèn sân khấu chính (Moving Head Beam, Spot, Wash, PAR LED, Barra LED, Fresnel). Tắt ĐÈN không làm tắt Strobe, Blinder hay Laser.', 'Toggles primary stage fixtures (Beam, Spot, Wash, PAR, Barra, Fresnel) independently of Strobe, Blinders, and Laser.')}</li>` +
        `<li><b>${tr18('CHỚP 14HZ (STROBE · Phím Z)', 'STROBE 14HZ (Key Z)')}:</b> ${tr18('Hoạt động độc lập với ĐÈN. Khi sân khấu có đèn Atomic Strobe chuyên dụng, chỉ dàn Strobe chớp trắng 14Hz (giữ nguyên màu của Moving Head/PAR) và vẫn chớp ngay cả khi tắt ĐÈN.', 'Operates independently of LIGHTS. Fires dedicated Atomic Strobe fixtures at 14Hz white without overriding Moving Head/PAR colors, even when LIGHTS is OFF.')}</li>` +
        `<li><b>${tr18('CHỚP KHÁN GIẢ (BLINDERS · Phím F)', 'BLINDERS (Key F)')}:</b> ${tr18('Đèn chớp vàng ấm chiếu về phía khán giả kèm mô phỏng quán tính nhiệt dây tóc Halogen, hoạt động độc lập cả khi tắt ĐÈN.', 'Warm tungsten audience flood flash with thermal decay, active even when LIGHTS is OFF.')}</li>` +
        `<li><b>LASER (Phím L):</b> ${tr18('Hệ thống quét 16 tia Laser ILDA RGB tự động lấy tâm từ vị trí đèn Laser trên sân khấu.', '16-beam RGB ILDA laser scan engine anchored to stage laser fixtures.')}</li>` +
        `<li><b>${tr18('PHÁO (PYRO · Phím X)', 'PYRO (Key X)')}:</b> ${tr18('Tự động kích hoạt pháo & khói theo 7 pha kịch bản. Khi tắt PHÁO, khay nút bắn pháo thủ công (Phím 7–0) sẽ tự động thu gọn.', '7-phase automatic Pyro & SFX sequencer. Turning PYRO off automatically collapses the manual Pyro trigger row.')}</li>` +
        `</ul>` +
        `</div>` +
        `<div class="lmp-help-sec18">` +
        `<h4>2. ${tr18('Động cơ Hiệu ứng Đèn & Laser (Trên Right Panel · Hệ thống đèn)', 'Lighting & Laser FX Engine (Right Panel · Lighting System)')}</h4>` +
        `<ul class="lmp-help-list18">` +
        `<li><b>${tr18('Chế độ đuổi đèn PAR (PAR Chase)', 'PAR Chase Mode')}:</b> ${tr18('Điều khiển hiệu ứng chạy màu của dải đèn PAR & Barra LED: Đuổi vòng tròn (Carousel), Đối xứng tâm (Mirror Domino), Đuổi kép 2 hướng (Dual Carousel), Lấp lánh Gala (Gala Sparkle) hoặc Tĩnh đồng nhất (Static).', 'Controls PAR & Barra LED color chase: Carousel, Mirror Domino, Dual Carousel, Gala Sparkle, or Static Wash.')}</li>` +
        `<li><b>${tr18('Quy luật quạt chùm tia (Beam Fan Law)', 'Beam Fan Law')}:</b> ${tr18('Định hình góc quét đối xứng của dàn Moving Head Beam/Spot: Chụm chữ V (V-Converge), Xòe chữ V (V-Diverge), Đan chéo chữ X (X-Cross), Quạt cánh song song (Parallel Wing) hoặc Thẳng đứng (Parallel Zero).', 'Shapes symmetric pan/tilt fanning for Moving Head Beams/Spots: V-Converge, V-Diverge, X-Cross, Parallel Wing, or Parallel Zero.')}</li>` +
        `<li><b>${tr18('Mẫu quét tia Laser ILDA (Laser Pattern)', 'ILDA Laser Pattern')}:</b> ${tr18('Chuyển đổi 4 hình học quét Laser 3D: P0 Màn sương ngang (Liquid Sky), P1 Đường hầm nón (Cone Tunnel), P2 Chặt chéo tia (X-Chopper), P3 Pháo bông đa tia (Starburst).', 'Switches 4 3D ILDA scan geometries: P0 Liquid Sky, P1 Cone Tunnel, P2 X-Chopper, P3 Starburst.')}</li>` +
        `</ul>` +
        `</div>` +
        `<div class="lmp-help-sec18">` +
        `<h4>3. ${tr18('Thêm & Điều chỉnh Thiết bị (ADD / EDIT trên Right Panel)', 'Adding & Configuring Objects (ADD / EDIT in Right Panel)')}</h4>` +
        `<p>${tr18('Khi click vào bất kỳ thiết bị nào trong Stage Toolbox (Kết cấu, Ánh sáng, Pháo SFX, Màn LED), cụm thiết bị sẽ xuất hiện trực tiếp trên sân khấu 3D kèm bảng ADD / EDIT ở cột phải (Right Panel) để chỉnh Đối xứng L/R, Bề rộng phủ (m), Số lượng, Sơ đồ chuỗi (click icon để xoá lẻ 1 thiết bị), Góc Zoom hoặc Bố cục chữ U.', 'Clicking any item in the Stage Toolbox spawns a live 3D batch and opens the ADD / EDIT configurator in the Right Panel with Live Symmetry (L/R), Width to Cover (m), Count, interactive chain diagram (click an icon to remove 1 unit), Zoom, and U-Shape layout.')}</p>` +
        `</div>` +
        `</div>`;
      if (typeof window.dialog === 'function') {
        window.dialog(title, body, [{ label: tr18('Đã hiểu', 'Got it'), primary: true }]);
      }
    }

    function renderLmpLiveShowDock18() {
      const dock = $('lmpLiveShowDock18');
      if (!dock) return;
      const ls = liveShow18;
      dock.classList.toggle('is-hidden', !!ls.dockHidden);
      dock.hidden = !!ls.dockHidden;
      dock.classList.toggle('is-collapsed', !!ls.dockCollapsed);
      dock.classList.toggle('is-mini', !!ls.dockMini);
      const hasCustomPos = Boolean(ls.dockPos && Number.isFinite(ls.dockPos.left) && Number.isFinite(ls.dockPos.top));
      dock.classList.toggle('is-custom-pos', hasCustomPos);
      dock.classList.toggle('is-pop-down', Boolean(hasCustomPos && ls.dockPos.top < 110));
      if (dock.style) {
        if (hasCustomPos) {
          dock.style.left = `${Math.round(ls.dockPos.left)}px`;
          dock.style.top = `${Math.round(ls.dockPos.top)}px`;
          dock.style.bottom = 'auto';
          dock.style.transform = 'none';
        } else {
          dock.style.left = '';
          dock.style.top = '';
          dock.style.bottom = '';
          dock.style.transform = '';
        }
      }
      const showOptions = [1, 2, 3, 4, 5, 6]
        .map((n) => {
          const cfg = STAGE_SETS18[n];
          const lbl = cfg ? tr18(cfg.shortVi || cfg.code, cfg.shortEn || cfg.code) : `S${n}`;
          const tip = cfg ? tr18(cfg.titleVi, cfg.titleEn) : `Set ${n}`;
          const sel = !ls.aiAuto && ls.activeShow === n ? ' selected' : '';
          return `<option value="${n}" title="${esc18(tip)}"${sel}>${esc18(lbl)}</option>`;
        })
        .concat([
          `<option value="ai" title="${tr18('Đạo diễn tự động (Đổi kịch bản mỗi 8 giây)', 'Auto Director (Cycles every 8s)')}"${ls.aiAuto ? ' selected' : ''}>${tr18('Auto · Đạo diễn', 'Auto · Director')}</option>`
        ])
        .join('');
      dock.innerHTML =
        `<div class="lmp-dock-row18 is-top">` +
        `<span class="lmp-dock-grip18" data-lmp-drag="1" title="${tr18('Kéo để di chuyển thanh Show · Nhấp đúp để về giữa đáy', 'Drag to move Live Show bar · Double-click to reset center-bottom')}"><svg viewBox="0 0 8 14" aria-hidden="true"><circle cx="2" cy="2.5" r="1.1" fill="currentColor"/><circle cx="6" cy="2.5" r="1.1" fill="currentColor"/><circle cx="2" cy="7" r="1.1" fill="currentColor"/><circle cx="6" cy="7" r="1.1" fill="currentColor"/><circle cx="2" cy="11.5" r="1.1" fill="currentColor"/><circle cx="6" cy="11.5" r="1.1" fill="currentColor"/></svg></span>` +
        `<button type="button" id="lmpDockStartShowBtn18" class="lmp-dock-btn18 is-start ${ls.running ? 'is-running' : ''}" data-lmp-start="1" title="${tr18('Chạy / Dừng Live Show (Phím P / Esc)', 'Start / Stop Live Show (Key P / Esc)')}">${ico18(ls.running ? 'square' : 'play')}<span>${ls.running ? tr18('DỪNG SHOW', 'STOP SHOW') : tr18('CHẠY SHOW', 'START SHOW')}</span><kbd class="lmp-dock-kbd18">P</kbd></button>` +
        `<div class="lmp-dock-group18 is-cues" role="group" aria-label="${tr18('Chế độ Hiệu ứng Show', 'Show Effect Modes')}">` +
        `<select class="lmp-dock-select18 lmp-dock-minionly18" data-lmp-showselect="1" aria-label="${tr18('Kịch bản ánh sáng Show', 'Show Lighting Style')}" title="${tr18('Chọn phong cách ánh sáng Show (1–6 / Auto)', 'Select Show Lighting Style (1–6 / Auto)')}">${showOptions}</select>` +
        `<button type="button" class="lmp-dock-btn18 is-cue lmp-dock-fullonly18 ${ls.aiAuto ? 'active' : ''}" data-lmp-showmode="ai" title="${tr18('Đạo diễn tự động (Đổi kịch bản mỗi 8 giây)', 'Auto Director (Cycles every 8s)')}">Auto</button>` +
        `<button type="button" class="lmp-dock-btn18 is-cue lmp-dock-fullonly18 ${ls.multicolor ? 'active' : ''}" data-lmp-showfx="multicolor" title="${tr18('Bảng màu Đa sắc (Phím C)', 'Multicolor Palettes (Key C)')}">${tr18('Đa sắc', 'Multi')}</button>` +
        `<button type="button" class="lmp-dock-btn18 is-cue lmp-dock-fullonly18" data-lmp-opentemplates="1" title="${tr18('Mở Mẫu Sân Khấu Sự Kiện Việt Nam & Bộ Set Dựng Sẵn S1–S6', 'Open Vietnamese Event Stage Templates & S1–S6 Preset Sets')}">${ico18('layout-grid')}<span>${tr18('Mẫu Sân Khấu', 'Stage Sets')}</span></button>` +
        `</div>` +
        `<label class="lmp-tb-speedrow18 lmp-dock-fullonly18" title="${tr18('Tốc độ chạy Show (0.2x - 5.0x)', 'Show Speed (0.2x - 5.0x)')}"><span>${tr18('Tốc độ', 'Spd')}</span><input type="range" min="0.2" max="5.0" step="0.1" value="${ls.speed.toFixed(1)}" data-lmp-speed="1"><b>${ls.speed.toFixed(1)}x</b></label>` +
        `<button type="button" class="lmp-dock-btn18 is-help lmp-dock-fullonly18" data-lmp-help="1" title="${tr18('Hướng dẫn chức năng Kênh Show, Đèn & Pháo SFX (?)', 'Lighting, Pyro SFX & Live Show Guide (?)')}" aria-label="${tr18('Hướng dẫn chức năng', 'Help guide')}">?</button>` +
        `<button type="button" class="lmp-dock-btn18 is-mini-btn ${ls.dockMini ? 'active' : ''}" data-lmp-dockmini="1" title="${ls.dockMini ? tr18('Mở rộng 2 dòng điều khiển Show', 'Expand 2-row Live Show dock') : tr18('Thu nhỏ còn 1 thanh gọn (Mini-Pill)', 'Minimize to 1-line Mini-Pill')}" aria-label="${tr18('Thu nhỏ / Mở rộng thanh Show', 'Minimize / Expand Live Show bar')}">${ico18(ls.dockMini ? 'maximize' : 'columns-3')}</button>` +
        `<button type="button" class="lmp-dock-btn18 is-hide" data-lmp-dockhide="1" title="${tr18('Ẩn bàn điều khiển Live Show', 'Hide Live Show Dock')}" aria-label="${tr18('Ẩn bàn điều khiển Live Show', 'Hide Live Show Dock')}">${ico18('x')}</button>` +
        `</div>` +
        `<div class="lmp-dock-row18 is-bottom lmp-dock-fullonly18">` +
        `<div class="lmp-dock-group18 is-buses" role="group" aria-label="${tr18('Kênh điều khiển Show', 'Show Channels')}">` +
        `<button type="button" class="lmp-dock-btn18 ${ls.lightsOn ? 'active' : ''}" data-lmp-showfx="lights" title="${tr18('Đèn Moving Head & PAR (Phím M)', 'Moving Heads & PARs (Key M)')}">${ico18('sun')}<span>${tr18('ĐÈN', 'LIGHTS')}</span></button>` +
        `<button type="button" class="lmp-dock-btn18 ${ls.blindersOn ? 'active' : ''}" data-lmp-showfx="blinders" title="${tr18('Đèn chớp Blinder khán giả (Phím F)', 'Audience Blinders (Key F)')}">${ico18('zap')}<span>${tr18('CHỚP KHÁN GIẢ', 'BLINDERS')}</span></button>` +
        `<button type="button" class="lmp-dock-btn18 ${ls.laserOn ? 'active' : ''}" data-lmp-showfx="laser" title="${tr18('Laser 16 tia ILDA & Liquid Sky (Phím L)', '16-Beam ILDA Laser & Liquid Sky (Key L)')}"><span>LASER</span></button>` +
        `<button type="button" class="lmp-dock-btn18 ${ls.sfxOn ? 'active' : ''}" data-lmp-showfx="sfx" title="${tr18('Pháo & SFX tự động 7 pha (Phím X)', '7-Phase Auto Pyro & SFX (Key X)')}">${ico18('sparkles')}<span>${tr18('PHÁO', 'PYRO')}</span></button>` +
        `<button type="button" class="lmp-dock-btn18 ${ls.strobe ? 'active' : ''}" data-lmp-showfx="strobe" title="${tr18('Đèn chớp Strobe 14 Hz độc lập với ĐÈN (Phím Z)', 'Independent 14 Hz Strobe (Key Z)')}"><span>${tr18('CHỚP 14HZ', 'STROBE')}</span></button>` +
        `<button type="button" class="lmp-dock-btn18 ${ls.autoCam ? 'active' : ''}" data-lmp-autocam="1" title="${tr18('Đạo diễn Camera tự động 5 góc quay (Tạm dừng 8s khi kéo chuột)', '5-Shot Auto Camera Director (8s pause on manual orbit)')}">${ico18('video')}<span>AUTO CAM</span></button>` +
        `<button type="button" class="lmp-dock-btn18 is-bo ${ls.blackout ? 'active' : ''}" data-lmp-showfx="bo" title="${tr18('Tắt toàn bộ đèn Blackout (Phím B)', 'Blackout (Key B)')}"><span>${tr18('TẮT ĐÈN', 'B.O.')}</span></button>` +
        `</div>` +
        `<button type="button" class="lmp-dock-btn18 is-fold ${!ls.dockCollapsed ? 'active' : ''}" data-lmp-dockfold="1" aria-expanded="${!ls.dockCollapsed}" title="${tr18('Mở / Đóng khay bắn Pháo thủ công', 'Open / Close manual Pyro trigger popover')}">${ico18('sparkles')}<span>${tr18('BẮN PHÁO', 'PYRO PAD')}</span>${ico18('chevron-down')}</button>` +
        `</div>` +
        `<div class="lmp-dock-row18 lmp-dock-extra18">` +
        `<div class="lmp-dock-group18 is-pyro-bank" role="group" aria-label="${tr18('Kích hoạt Pháo & SFX thủ công', 'Manual Pyro Triggers')}">` +
        `<button type="button" class="lmp-dock-btn18 is-pyro" data-lmp-fire="cold_spark_fountain" title="${tr18('Pháo điện lạnh Sparkular (Phím 7)', 'Sparkular Cold Sparks (Key 7)')}">${ico18('sparkles')}<span>${tr18('PHÁO ĐIỆN [7]', 'SPARK [7]')}</span></button>` +
        `<button type="button" class="lmp-dock-btn18 is-pyro" data-lmp-fire="co2_jet" title="${tr18('Súng cột khói lạnh CO2 (Phím 8)', 'CO2 Cryo Jets (Key 8)')}">${ico18('cloud')}<span>CO2 [8]</span></button>` +
        `<button type="button" class="lmp-dock-btn18 is-pyro" data-lmp-fire="flame_jet" title="${tr18('Máy phun lửa DMX (Phím 9)', 'DMX Flame Jets (Key 9)')}">${ico18('zap')}<span>${tr18('LỬA [9]', 'FLAME [9]')}</span></button>` +
        `<button type="button" class="lmp-dock-btn18 is-pyro" data-lmp-fire="confetti_cannon" title="${tr18('Pháo hoa tầm cao & Kim tuyến (Phím 0)', 'Aerial Pyro Fireworks (Key 0)')}">${ico18('sun')}<span>${tr18('PHÁO HOA [0]', 'AERIAL [0]')}</span></button>` +
        `<button type="button" class="lmp-dock-btn18 is-pyro is-finale" data-lmp-fire="all" title="${tr18('Kích hoạt toàn bộ hiệu ứng Grand Finale', 'Grand Finale Fire All')}">${ico18('sparkles')}<span>${tr18('BẮN TẤT CẢ', 'FIRE ALL')}</span></button>` +
        `</div>` +
        `</div>`;
    }

    function hookEngineRender18() {
      const eng = S.engine;
      if (eng && typeof eng.makeBeam === 'function' && !eng._lmpBeamHooked18) {
        const baseMakeBeam18 = eng.makeBeam.bind(eng);
        eng.makeBeam = function (light) {
          let savedTarget = null;
          let hadTempTarget = false;
          const scale = Number(light?.coneLenScale18);
          if (light && Number.isFinite(scale) && scale > 0 && Math.abs(scale - 1) > 1e-3 && Array.isArray(light.pos)) {
            const baseT = light._target || light.target || [0, 0, 0];
            const dx = (Number(baseT[0]) || 0) - (Number(light.pos[0]) || 0);
            const dy = (Number(baseT[1]) || 0) - (Number(light.pos[1]) || 0);
            const dz = (Number(baseT[2]) || 0) - (Number(light.pos[2]) || 0);
            const d = Math.hypot(dx, dy, dz) || 1;
            const newD = Math.max(0.2, (d + 3) * scale - 3);
            const k = newD / d;
            savedTarget = light._target;
            hadTempTarget = Object.prototype.hasOwnProperty.call(light, '_target');
            light._target = [
              (Number(light.pos[0]) || 0) + dx * k,
              (Number(light.pos[1]) || 0) + dy * k,
              (Number(light.pos[2]) || 0) + dz * k
            ];
          }
          let res;
          try {
            res = baseMakeBeam18(light);
          } finally {
            if (savedTarget !== null || hadTempTarget) {
              if (hadTempTarget) light._target = savedTarget;
              else delete light._target;
            }
          }
          const prof = Number(light?.beamProfile18) || 0;
          this.uniform?.('uBeamProfile', prof);
          if (res && typeof res === 'object') {
            res._beamProfile18 = prof;
            res._isBlinder18 = Boolean(light?._isBlinder18);
          }
          return res;
        };
        if (typeof eng.draw === 'function') {
          const baseDraw18 = eng.draw.bind(eng);
          eng.draw = function (mesh, mode = 0, surface = null, opacity = 1) {
            const cap = lumiState.screenCapture18;
            const video = cap.active && cap.videoEl;
            if (mode === 1 && surface && video?.readyState >= 2 && this.media && video.videoWidth <= this.maxSize && video.videoHeight <= this.maxSize) {
              const globalTest = this.globalTest;
              this.media.set(cap, { element: video, width: video.videoWidth, height: video.videoHeight });
              this.globalTest = false;
              const fitMode = cap.fitMode === 'contain' ? 'contain' : 'cover';
              const fitRect = computeLiveCaptureFitRect18(video.videoWidth, video.videoHeight, surface.w || 1920, surface.h || 1080, fitMode);
              try {
                return baseDraw18(mesh, mode, {
                  ...surface,
                  source: cap,
                  crop: [fitRect.cropX, fitRect.cropY, fitRect.cropW, fitRect.cropH],
                  fit: fitMode === 'contain' ? 1 : 2,
                  mappingSpace: 'uv'
                }, opacity);
              } finally {
                this.globalTest = globalTest;
                this.media.delete(cap);
              }
            }
            if (mode === 2) {
              if (mesh?._isBlinder18) {
                mesh._isBlinder18 = false;
                return;
              }
              this.selectPass?.(2);
              this.uniform?.('uBeamProfile', Number(mesh?._beamProfile18) || 0);
            }
            try {
              return baseDraw18(mesh, mode, surface, opacity);
            } finally {
              if (mode === 2) {
                this.uniform?.('uBeamProfile', 0);
              }
            }
          };
        }
        eng._lmpBeamHooked18 = true;
      }
      if (eng && typeof eng.render === 'function' && !eng._lmpShowHooked18) {
        const baseRender18 = eng.render.bind(eng);
        eng.render = function (time = 0, options = {}) {
          const now = nowMs18();
          tickLiveShow18(now);
          const out = baseRender18(time, options);
          if (!Number.isFinite(this.frame) || this._lmpVolumetricFrame18 !== this.frame) {
            drawWebglVolumetricExtras18(this, now);
          }
          renderLiveShowOverlay18(now);
          return out;
        };
        eng._lmpShowHooked18 = true;
      }
      if (typeof S.keepRendering === 'function' && !S._lmpKeepRenderingHooked18) {
        const baseKeep18 = S.keepRendering.bind(S);
        const waker18 = () => {
          const ls = liveShow18;
          return Boolean(lumiState.screenCapture18.active || ls.running || ls.particles.length > 0 || ls.aerialShells.length > 0);
        };
        baseKeep18(waker18);
        S.keepRendering = function (fn) {
          if (typeof fn === 'function') return baseKeep18(fn);
          if (waker18()) return true;
          return Boolean(baseKeep18());
        };
        S._lmpKeepRenderingHooked18 = true;
      }
    }

    function installLmpLiveShowDock18() {
      const vp = $('viewport');
      if (vp && !$('lmpShowOverlay18')) {
        const overlay = document.createElement('canvas');
        overlay.id = 'lmpShowOverlay18';
        overlay.setAttribute?.('aria-label', 'Live Show 3D Lighting, Laser and Pyro Overlay');
        vp.appendChild?.(overlay);
      }
      if (vp && !$('lmpLiveShowDock18')) {
        const dock = document.createElement('div');
        dock.id = 'lmpLiveShowDock18';
        dock.className = liveShow18.dockHidden ? 'is-hidden' : 'is-collapsed';
        dock.hidden = !!liveShow18.dockHidden;
        dock.setAttribute?.('role', 'region');
        dock.setAttribute?.('aria-label', tr18('Bàn điều khiển Live Show', 'Live Show Control Dock'));
        vp.appendChild?.(dock);

        dock.addEventListener?.('click', (e) => {
          const startBtn = e.target.closest?.('[data-lmp-start]');
          if (startBtn) {
            toggleLiveShow18();
            return;
          }
          const modeBtn = e.target.closest?.('[data-lmp-showmode]');
          if (modeBtn) {
            setLiveShowMode18(modeBtn.getAttribute('data-lmp-showmode'));
            return;
          }
          const fxBtn = e.target.closest?.('[data-lmp-showfx]');
          if (fxBtn) {
            toggleLiveShowFx18(fxBtn.getAttribute('data-lmp-showfx'));
            return;
          }
          const autoCamBtn = e.target.closest?.('[data-lmp-autocam]');
          if (autoCamBtn) {
            toggleAutoCamera18();
            return;
          }
          const fireBtn = e.target.closest?.('[data-lmp-fire]');
          if (fireBtn) {
            triggerPyroBurst18(fireBtn.getAttribute('data-lmp-fire'));
            return;
          }
          const foldBtn = e.target.closest?.('[data-lmp-dockfold]');
          if (foldBtn) {
            liveShow18.dockCollapsed = !liveShow18.dockCollapsed;
            renderLmpLiveShowDock18();
            return;
          }
          const openTplBtn = e.target.closest?.('[data-lmp-opentemplates]');
          if (openTplBtn) {
            openStageTemplatesModal();
            return;
          }
          const helpBtn = e.target.closest?.('[data-lmp-help]');
          if (helpBtn) {
            openLmpHelpModal18();
            return;
          }
          const miniBtn = e.target.closest?.('[data-lmp-dockmini]');
          if (miniBtn) {
            liveShow18.dockMini = !liveShow18.dockMini;
            if (liveShow18.dockMini) liveShow18.dockCollapsed = true;
            renderLmpLiveShowDock18();
            return;
          }
          const hideBtn = e.target.closest?.('[data-lmp-dockhide]');
          if (hideBtn) {
            toggleLiveShowDock18(false);
          }
        });
        dock.addEventListener?.('change', (e) => {
          const showSel = e.target.closest?.('[data-lmp-showselect]');
          if (showSel) {
            setLiveShowMode18(showSel.value, { fromSelect: true });
            return;
          }
          const parSel = e.target.closest?.('[data-lmp-parchase]');
          if (parSel) {
            setParChaseMode18(parSel.value);
            return;
          }
          const fanSel = e.target.closest?.('[data-lmp-fanlaw]');
          if (fanSel) {
            setBeamFanLaw18(fanSel.value);
            return;
          }
          const laserSel = e.target.closest?.('[data-lmp-laserpat]');
          if (laserSel) {
            setLaserPattern18(laserSel.value);
          }
        });
        dock.addEventListener?.('input', (e) => {
          const spdInput = e.target.closest?.('[data-lmp-speed]');
          if (spdInput) {
            liveShow18.speed = clamp18(Number(spdInput.value) || 2.0, 0.2, 5.0);
            const b = dock.querySelector?.('.lmp-tb-speedrow18 b');
            if (b) b.textContent = `${liveShow18.speed.toFixed(1)}x`;
          }
        });
        let dragState18 = null;
        dock.addEventListener?.('pointerdown', (e) => {
          if (e.button !== undefined && e.button !== 0) return;
          const isGrip = Boolean(e.target.closest?.('[data-lmp-drag]'));
          const isInteractive = Boolean(e.target.closest?.('button, select, input, label, a'));
          if (!isGrip && isInteractive) return;
          const vpRect = vp.getBoundingClientRect?.();
          const dockRect = dock.getBoundingClientRect?.();
          if (!vpRect || !dockRect || !vpRect.width || !vpRect.height) return;
          dragState18 = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            origLeft: dockRect.left - vpRect.left,
            origTop: dockRect.top - vpRect.top,
            vpW: vpRect.width,
            vpH: vpRect.height,
            dockW: dockRect.width,
            dockH: dockRect.height,
            moved: false
          };
          dock.classList.add('is-dragging');
          try { dock.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
          if (isGrip) e.preventDefault?.();
        });
        dock.addEventListener?.('pointermove', (e) => {
          if (!dragState18 || (e.pointerId !== undefined && e.pointerId !== dragState18.pointerId)) return;
          const dx = e.clientX - dragState18.startX;
          const dy = e.clientY - dragState18.startY;
          if (!dragState18.moved && Math.hypot(dx, dy) < 3) return;
          dragState18.moved = true;
          const maxL = Math.max(6, dragState18.vpW - dragState18.dockW - 6);
          const maxT = Math.max(6, dragState18.vpH - dragState18.dockH - 6);
          const nextL = clamp18(dragState18.origLeft + dx, 6, maxL);
          const nextT = clamp18(dragState18.origTop + dy, 6, maxT);
          liveShow18.dockPos = { left: nextL, top: nextT };
          dock.classList.add('is-custom-pos');
          dock.classList.toggle('is-pop-down', nextT < 110);
          if (dock.style) {
            dock.style.left = `${Math.round(nextL)}px`;
            dock.style.top = `${Math.round(nextT)}px`;
            dock.style.bottom = 'auto';
            dock.style.transform = 'none';
          }
        });
        const endDockDrag18 = (e) => {
          if (!dragState18 || (e?.pointerId !== undefined && e.pointerId !== dragState18.pointerId)) return;
          try { dock.releasePointerCapture?.(dragState18.pointerId); } catch { /* ignore */ }
          dock.classList.remove('is-dragging');
          dragState18 = null;
        };
        dock.addEventListener?.('pointerup', endDockDrag18);
        dock.addEventListener?.('pointercancel', endDockDrag18);
        dock.addEventListener?.('dblclick', (e) => {
          if (!e.target.closest?.('[data-lmp-drag]')) return;
          liveShow18.dockPos = null;
          renderLmpLiveShowDock18();
        });
        vp.addEventListener?.('pointerdown', (e) => {
          if (!liveShow18.dockCollapsed && !dock.contains?.(e.target)) {
            liveShow18.dockCollapsed = true;
            renderLmpLiveShowDock18();
          }
        });
        renderLmpLiveShowDock18();
      }

      const glCanvas = $('glcanvas') || S.engine?.canvas;
      if (glCanvas && !glCanvas._lmpAutoCamPauseHooked18) {
        glCanvas._lmpAutoCamPauseHooked18 = true;
        const pauseAutoCam = () => {
          if (liveShow18.autoCam) {
            liveShow18.autoCamPausedUntilMs = nowMs18() + 8000;
          }
        };
        glCanvas.addEventListener?.('pointerdown', pauseAutoCam, { passive: true });
        glCanvas.addEventListener?.('wheel', pauseAutoCam, { passive: true });
      }

      hookEngineRender18();

      const syncPlayBtn18 = (btnId) => {
        const btn = $(btnId);
        if (btn && !btn._lmpPlaySyncHooked18) {
          btn._lmpPlaySyncHooked18 = true;
          btn.addEventListener?.('click', () => {
            if (window.seq?.enabled) return;
            if (!window.state?.playing && liveShow18.running) {
              stopLiveShow18();
            }
          });
        }
      };
      syncPlayBtn18('playBtn');
      syncPlayBtn18('showPlay');

      // Global & Scoped keyboard shortcuts for Live Show (P, C, M, F, L, X, Z, B, 1-6, 7-0, Escape)
      if (!window._lmpShowKeysInstalled18) {
        window._lmpShowKeysInstalled18 = true;
        document.addEventListener?.('keydown', (e) => {
          if (e.target?.matches?.('input,textarea,select,[contenteditable]') || $('modal')?.open || e.ctrlKey || e.metaKey || e.altKey) return;
          const k = String(e.key || '').toLowerCase();
          if (k === 'p') {
            e.preventDefault?.();
            toggleLiveShow18();
          } else if (k === 'escape' && liveShow18.running && !window.state?.pickTask && !document.body?.classList?.contains('present-mode')) {
            e.preventDefault?.();
            stopLiveShow18();
          } else if (k === 'f' && liveShow18.running) {
            e.preventDefault?.();
            toggleLiveShowFx18('blinders');
          } else if (k === 'l' && liveShow18.running) {
            e.preventDefault?.();
            toggleLiveShowFx18('laser');
          } else if (/^[1-6]$/.test(k) && liveShow18.running) {
            e.preventDefault?.();
            setLiveShowMode18(Number(k), { applySet: false });
          } else if (k === 'c' && liveShow18.running) {
            e.preventDefault?.();
            toggleLiveShowFx18('multicolor');
          } else if (k === 'm' && liveShow18.running) {
            e.preventDefault?.();
            toggleLiveShowFx18('lights');
          } else if (k === 'x' && liveShow18.running) {
            e.preventDefault?.();
            toggleLiveShowFx18('sfx');
          } else if (k === 'z' && liveShow18.running) {
            e.preventDefault?.();
            toggleLiveShowFx18('strobe');
          } else if (k === 'b' && (liveShow18.running || !window.state?.step || window.state.step === 'mapping' || $('surfPaintVoidsBtn'))) {
            e.preventDefault?.();
            if (liveShow18.running) {
              toggleLiveShowFx18('bo');
            } else {
              window._paintVoidsMode18 = !window._paintVoidsMode18;
              const pvBtn = $('surfPaintVoidsBtn');
              if (pvBtn) pvBtn.classList.toggle('primary', !!window._paintVoidsMode18);
              window.toast?.(
                window._paintVoidsMode18
                  ? tr18('Đã bật chế độ Paint Voids / Panel Ảo [Phím B]. Click/kéo trên ô cabinet để đục rỗng.', 'Paint Voids [Key B] enabled. Click/drag cabinet cells to toggle voids.')
                  : tr18('Đã tắt chế độ Paint Voids [Phím B].', 'Paint Voids [Key B] disabled.')
              );
            }
          } else if (k === '7' && liveShow18.running) {
            e.preventDefault?.();
            triggerPyroBurst18('cold_spark_fountain');
          } else if (k === '8' && liveShow18.running) {
            e.preventDefault?.();
            triggerPyroBurst18('co2_jet');
          } else if (k === '9' && liveShow18.running) {
            e.preventDefault?.();
            triggerPyroBurst18('flame_jet');
          } else if (k === '0' && liveShow18.running) {
            e.preventDefault?.();
            triggerPyroBurst18('confetti_cannon');
          }
        });
      }
    }

    // =========================================================================
    // PHASE A — 3D LIGHTING STUDIO, VOLUMETRIC EFFECTS, DMX PROGRAMMER & BROADCAST/ILDA AUDIT
    // =========================================================================
    function assignFixtureGroup18(light, idx = 0, total = 1) {
      if (light?.dmxGroup18 && /^G[1-5]$/.test(light.dmxGroup18)) return light.dmxGroup18;
      const px = Number(light?.pos?.[0]) || 0;
      const py = Number(light?.pos?.[1]) || 5;
      const pz = Number(light?.pos?.[2]) || 0;
      if (py < 1.5) return 'G4';
      if (Math.abs(px) > 5.0) return 'G5';
      if (pz > 1.2) return 'G1';
      if (pz > -0.6) return 'G2';
      return 'G3';
    }

    function computeParUplightChase18(idx, total, tSec, spd, chaseMode = 'carousel', palette = ['#01ffa0', '#00d4ff', '#ff007f', '#ffe600'], opts = {}) {
      const n = Math.max(1, Number(total) || 1);
      const pal = Array.isArray(palette) && palette.length ? palette : ['#01ffa0', '#00d4ff', '#ff007f', '#ffe600'];
      const mode = String(chaseMode || 'carousel').toLowerCase();
      const useAlt = Boolean(opts.useAlternateColor ?? lumiState.dmxProgrammer18?.parUseAlternateColor);
      const secCol = opts.secondaryColor || lumiState.dmxProgrammer18?.parSecondaryColor || '#ffe600';
      const baseColor = useAlt && idx % 2 === 1 ? secCol : samplePaletteGlide18(pal, idx * 0.35 + tSec * spd * 0.65);
      let level = 0.85;
      let color = baseColor;
      let isSparkle = false;

      if (mode === 'static') {
        level = 0.88;
      } else if (mode === 'mirror_domino') {
        const half = Math.max(1, (n - 1) / 2);
        const wave = Math.abs(Math.abs(idx - half) - Math.abs(Math.sin(tSec * spd * 1.95)) * half);
        level = clamp18(1 - wave / Math.max(1.1, half * 0.62), 0.12, 1.15);
        const symIdx = Math.round(Math.abs(idx - half));
        color = useAlt && symIdx % 2 === 1 ? secCol : pal[symIdx % pal.length];
      } else if (mode === 'dual_carousel') {
        const h1 = (tSec * spd * 3.4) % n;
        const h2 = (h1 + n / 2) % n;
        level = Math.max(dominoTail18(idx, n, h1, Math.max(1.8, n * 0.35)), dominoTail18(idx, n, h2, Math.max(1.8, n * 0.35)));
        level = clamp18(level, 0.14, 1.15);
        color = useAlt && idx % 2 === 1 ? secCol : pal[(idx + Math.floor(tSec * spd)) % pal.length];
      } else if (mode === 'gala_sparkle') {
        const h1 = (tSec * spd * 3.6) % n;
        const h2 = (h1 + n / 3) % n;
        const h3 = (h1 + (2 * n) / 3) % n;
        const base = Math.max(dominoTail18(idx, n, h1, 2.4), dominoTail18(idx, n, h2, 2.4), dominoTail18(idx, n, h3, 2.4));
        level = clamp18(0.36 + 0.52 * base, 0.18, 1.3);
        if (Math.sin(tSec * 12.5 + idx * 1.73) > 0.78) {
          color = '#ffffff';
          level = 1.25;
          isSparkle = true;
        }
      } else {
        // Default: 'carousel' with 16-second direction reversal + domino tail
        const dir = Math.floor(tSec / 16) % 2 === 0 ? 1 : -1;
        const rawHead = (tSec * spd * 2.8 * dir) % n;
        const head = (rawHead + n) % n;
        const effIdx = dir > 0 ? idx : (n - 1 - idx);
        const effHead = dir > 0 ? head : (n - 1 - head);
        level = clamp18(dominoTail18(effIdx, n, effHead, Math.max(2.0, n * 0.45)), 0.15, 1.15);
        if (level > 0.78) color = '#ffffff';
      }

      const coneLenScale = +(0.32 + 0.68 * Math.sqrt(clamp18(level, 0.08, 1.0))).toFixed(3);
      return { mode, level: +level.toFixed(3), color, coneLenScale, isSparkle, useAlternateColor: useAlt, profileId: 'par_uplight_v1' };
    }
    const evalParChaseEngine18 = computeParUplightChase18;

    function computePixelBarCurtainCells18(lightPos = [0, 0.6, 2.2], lightTarget = [0, 4.5, 0.5], tSec = 0, spd = 2.0, fixtureIdx = 0, baseColor = '#00f0ff') {
      const cells = [];
      const barWidthM = 0.92;
      const curtainHeightM = 6.5;
      const curtainDepthM = 0.45;
      const dx = (Number(lightTarget[0]) || 0) - (Number(lightPos[0]) || 0);
      const dy = (Number(lightTarget[1]) || 4) - (Number(lightPos[1]) || 0.5);
      const dz = (Number(lightTarget[2]) || 0) - (Number(lightPos[2]) || 0);
      const len = Math.max(0.1, Math.hypot(dx, dy, dz));
      const ux = dx / len;
      const uy = dy / len;
      const uz = dz / len;

      for (let c = 0; c < 12; c++) {
        const u = (c / 11) - 0.5;
        const offsetX = u * barWidthM;
        const wave = 0.45 + 0.55 * Math.sin(tSec * spd * 5.0 + c * 0.55 + fixtureIdx);
        const emitterPos = [
          +(Number(lightPos[0]) + offsetX).toFixed(3),
          +(Number(lightPos[1])).toFixed(3),
          +(Number(lightPos[2])).toFixed(3)
        ];
        const rayEndPos = [
          +(emitterPos[0] + ux * curtainHeightM + u * curtainDepthM).toFixed(3),
          +(emitterPos[1] + uy * curtainHeightM).toFixed(3),
          +(emitterPos[2] + uz * curtainHeightM).toFixed(3)
        ];
        cells.push({
          cellIndex: c + 1,
          emitterPos,
          rayEndPos,
          wave: +wave.toFixed(3),
          color: wave > 0.85 ? '#ffffff' : baseColor,
          profileId: 'pixel_bar_curtain_v1',
          dimensionsM: [barWidthM, curtainHeightM, curtainDepthM]
        });
      }
      return cells;
    }

    function drawRotatingFloorGobo18(ctx, cx, cy, rx, ry, rotRad = 0, pattern = 'starburst', color = '#00f0ff', intensity = 1) {
      if (!ctx || rx < 4 || ry < 2) return;
      const petals = pattern === 'mandala' ? 8 : pattern === 'petals' ? 6 : pattern === 'cross_prism' ? 4 : pattern === 'tunnel_ring' ? 10 : 7;
      ctx.strokeStyle = rgba18('#ffffff', clamp18(0.52 * intensity, 0.08, 0.85));
      ctx.lineWidth = 1.35;
      for (let p = 0; p < petals; p++) {
        const a = rotRad + (p * Math.PI * 2) / petals;
        const x1 = cx + Math.cos(a) * rx * 0.22;
        const y1 = cy + Math.sin(a) * ry * 0.22;
        const x2 = cx + Math.cos(a) * rx * 0.88;
        const y2 = cy + Math.sin(a) * ry * 0.88;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.fillStyle = p % 2 === 0 ? '#ffffff' : rgba18(color, 0.85);
        ctx.beginPath();
        ctx.arc(x2, y2, Math.max(1.5, rx * 0.07), 0, Math.PI * 2);
        ctx.fill();
      }
      if (pattern === 'tunnel_ring' || pattern === 'mandala') {
        ctx.strokeStyle = rgba18(color, clamp18(0.45 * intensity, 0.08, 0.75));
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.62, ry * 0.62, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawParabolicWallScallop18(ctx, proj, pos, color = '#01ffa0', intensity = 1, heightM = 3.6, widthM = 1.4) {
      if (!ctx || typeof proj !== 'function' || !Array.isArray(pos)) return;
      const base = proj(pos);
      const apex = proj([pos[0], pos[1] + heightM, pos[2] - 0.15]);
      const left = proj([pos[0] - widthM * 0.5, pos[1] + heightM * 0.72, pos[2] - 0.1]);
      const right = proj([pos[0] + widthM * 0.5, pos[1] + heightM * 0.72, pos[2] - 0.1]);
      if (!base || !apex || !left || !right) return;

      const g = ctx.createLinearGradient(base.x, base.y, apex.x, apex.y);
      g.addColorStop(0, rgba18('#ffffff', clamp18(0.55 * intensity, 0.1, 0.85)));
      g.addColorStop(0.35, rgba18(color, clamp18(0.38 * intensity, 0.06, 0.65)));
      g.addColorStop(1, rgba18(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(base.x - 4, base.y);
      ctx.quadraticCurveTo(left.x, left.y, apex.x, apex.y);
      ctx.quadraticCurveTo(right.x, right.y, base.x + 4, base.y);
      ctx.closePath();
      ctx.fill();

      // Floor wash pool around PAR uplight base
      const poolR = Math.max(10, Math.hypot(right.x - left.x, right.y - left.y) * 0.45);
      const pg = ctx.createRadialGradient(base.x, base.y, 1, base.x, base.y, poolR);
      pg.addColorStop(0, rgba18('#ffffff', 0.48 * intensity));
      pg.addColorStop(0.5, rgba18(color, 0.26 * intensity));
      pg.addColorStop(1, rgba18(color, 0));
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(base.x, base.y, poolR, poolR * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function toggleFreezeDmx18(forceState) {
      const prog = lumiState.dmxProgrammer18;
      prog.freezeDmx = typeof forceState === 'boolean' ? forceState : !prog.freezeDmx;
      return prog.freezeDmx;
    }

    function applyDmxGroupProgrammer18(overrides = {}) {
      const prog = lumiState.dmxProgrammer18;
      if (overrides.parChaseMode) prog.parChaseMode = String(overrides.parChaseMode);
      if (typeof overrides.freezeDmx === 'boolean') prog.freezeDmx = overrides.freezeDmx;
      if (typeof overrides.parUseAlternateColor === 'boolean') prog.parUseAlternateColor = overrides.parUseAlternateColor;
      if (overrides.parSecondaryColor) prog.parSecondaryColor = String(overrides.parSecondaryColor);
      if (overrides.frontColorTempK !== undefined) {
        const cct = Number(overrides.frontColorTempK) || 4200;
        prog.frontColorTempK = cct <= 3500 ? 3200 : cct >= 5400 ? 5600 : 4200;
      }
      if (overrides.frontKeyLightPct !== undefined) {
        prog.frontKeyLightPct = clamp18(overrides.frontKeyLightPct, 15, 100);
      }
      if (overrides.groupPalettes && typeof overrides.groupPalettes === 'object') {
        for (const k of ['beam', 'wash', 'par', 'laser']) {
          if (Array.isArray(overrides.groupPalettes[k]) && overrides.groupPalettes[k].length) {
            prog.groupPalettes[k] = overrides.groupPalettes[k].map((c) => String(c));
          }
        }
      }
      if (overrides.optics && typeof overrides.optics === 'object') {
        if (overrides.optics.aperture !== undefined) prog.optics.aperture = clamp18(overrides.optics.aperture, 0.01, 0.15);
        if (overrides.optics.zoomDeg !== undefined) prog.optics.zoomDeg = clamp18(overrides.optics.zoomDeg, 2, 60);
        if (overrides.optics.spreadFactor !== undefined) prog.optics.spreadFactor = clamp18(overrides.optics.spreadFactor, 0.4, 2.5);
      }
      if (overrides.groups && typeof overrides.groups === 'object') {
        for (const gKey of ['G1', 'G2', 'G3', 'G4', 'G5']) {
          if (overrides.groups[gKey] && typeof overrides.groups[gKey] === 'object') {
            const g = prog.groups[gKey];
            const src = overrides.groups[gKey];
            if (src.panOffsetDeg !== undefined) g.panOffsetDeg = clamp18(src.panOffsetDeg, -180, 180);
            if (src.tiltOffsetDeg !== undefined) g.tiltOffsetDeg = clamp18(src.tiltOffsetDeg, -90, 90);
            if (src.fanningSpreadDeg !== undefined) g.fanningSpreadDeg = clamp18(src.fanningSpreadDeg, -90, 90);
            if (src.dimmer !== undefined) g.dimmer = clamp18(src.dimmer, 0, 100);
          }
        }
      }

      const eng = S.engine;
      const lights = Array.isArray(eng?.lights) ? eng.lights : [];
      const total = lights.length;
      lights.forEach((l, idx) => {
        if (!l) return;
        const cat = classifyFixture18(l, idx, total);
        const grpId = assignFixtureGroup18(l, idx, total);
        l.dmxGroup18 = grpId;
        const g = prog.groups[grpId] || prog.groups.G1;
        const pal = cat === 'wash' || cat === 'fresnel' ? prog.groupPalettes.wash : cat === 'par' || cat === 'bar' ? prog.groupPalettes.par : prog.groupPalettes.beam;
        if (Array.isArray(pal) && pal.length) {
          l.color = pal[idx % pal.length];
        }
        l.aperture = prog.optics.aperture;
        l.angle = +(prog.optics.zoomDeg * prog.optics.spreadFactor).toFixed(1);
        const px = Number(l.pos?.[0]) || 0;
        const py = Number(l.pos?.[1]) || 5;
        const pz = Number(l.pos?.[2]) || 0;
        const normSign = px === 0 ? ((idx / Math.max(1, total - 1)) - 0.5) * 2 : clamp18(px / 6.0, -1, 1);
        const panRad = (((Number(g.panOffsetDeg) || 0) + normSign * (Number(g.fanningSpreadDeg) || 0)) * Math.PI) / 180;
        const tiltOffM = ((Number(g.tiltOffsetDeg) || 0) / 45) * 2.5;
        l.target = [
          +(px + Math.sin(panRad) * 5.5).toFixed(3),
          +(Math.max(0.1, (py > 1.6 ? 0.8 : 4.2) + tiltOffM)).toFixed(3),
          +(pz + Math.cos(panRad) * 3.5).toFixed(3)
        ];
        l.power = +((6.0 * clamp18(g.dimmer, 0, 100)) / 100).toFixed(2);
        l.enabled = g.dimmer > 0;
      });
      eng?.rebuildFixtures?.();
      return prog;
    }

    function computeBroadcastAndIldaAudit18(opts = {}) {
      const eng = S.engine;
      const lights = Array.isArray(opts.lights) ? opts.lights : Array.isArray(eng?.lights) ? eng.lights : [];
      const surfaces = Array.isArray(opts.surfaces) ? opts.surfaces : Array.isArray(eng?.surfaces) ? eng.surfaces : [];
      const photo = computePhotometricFootprint({ lights, ledScreenNits: opts.ledWallNits || 1200 });

      const ledWallNits = Number(opts.ledWallNits) || Number(photo.ledScreenNits) || 1200;
      const keylightLux = Number(opts.keylightLux) || Number(photo.avgFrontLux) || 1450;
      const recommendedNits = Math.round(clamp18(keylightLux * 0.65, 450, 1800));
      const contrastRatio = +(ledWallNits / Math.max(1, keylightLux * 0.318)).toFixed(2);
      const balanceStatus = contrastRatio > 3.2 ? 'LED_OVERPOWERING' : contrastRatio < 0.85 ? 'KEYLIGHT_HOT' : 'OPTIMAL';

      // Broadcast Camera Moire Risk calculation from pixel pitch, focal length, aperture & distance
      const pitchMm = Number(opts.pixelPitchMm) || Number(surfaces[0]?.pixelPitchMm) || 2.6;
      const cameraDistanceM = clamp18(Number(opts.cameraDistanceM) || 12, 1.5, 100);
      const focalLengthMm = clamp18(Number(opts.focalLengthMm) || 50, 14, 400);
      const apertureFStop = clamp18(Number(opts.apertureFStop) || 2.8, 1.2, 22);
      const minSafeDistanceM = +((pitchMm * 2.8 * (focalLengthMm / 50)) / Math.max(0.7, apertureFStop / 2.8)).toFixed(2);
      const moireRatio = cameraDistanceM / Math.max(0.5, minSafeDistanceM);
      const moireRisk = moireRatio < 0.85 ? 'HIGH' : moireRatio < 1.25 ? 'MEDIUM' : 'LOW';

      // IEC 60825-1 ILDA Laser Safety Horizon check: audience scan height must be Y >= +3.20m
      const ildaHorizonM = 3.2;
      const laserBeams = Array.isArray(opts.laserTargets)
        ? opts.laserTargets
        : [
            { id: 'LASER_L', originY: 3.4, minTargetY: Number(opts.lowestLaserTargetY ?? 3.35) },
            { id: 'LASER_R', originY: 3.4, minTargetY: Number(opts.lowestLaserTargetY ?? 3.35) }
          ];
      let lowestBeamY = 99;
      const violations = [];
      for (const b of laserBeams) {
        const originY = Number(b.originY), targetY = Number(b.minTargetY);
        const yMin = Number.isFinite(originY) && Number.isFinite(targetY) ? Math.min(originY, targetY) : 0;
        if (yMin < lowestBeamY) lowestBeamY = yMin;
        if (yMin < ildaHorizonM) {
          violations.push({
            id: b.id || 'LASER',
            heightM: +yMin.toFixed(2),
            standard: 'IEC 60825-1',
            message: `Laser beam ${b.id || 'LASER'} drops to +${yMin.toFixed(2)}m (below +${ildaHorizonM.toFixed(2)}m MPE horizon)`
          });
        }
      }
      if (!Number.isFinite(lowestBeamY) || lowestBeamY === 99) lowestBeamY = 3.4;

      return {
        keylightLux: Math.round(keylightLux),
        ledWallNits: Math.round(ledWallNits),
        recommendedNits,
        contrastRatio,
        balanceStatus,
        pixelPitchMm: pitchMm,
        cameraDistanceM,
        focalLengthMm,
        apertureFStop,
        minSafeDistanceM,
        moireRisk,
        ildaStandard: 'IEC 60825-1',
        ildaHorizonM,
        lowestBeamY: +lowestBeamY.toFixed(2),
        ildaSafe: violations.length === 0 && lowestBeamY >= ildaHorizonM,
        violations
      };
    }

    function exportChamsysMagicQCsv18({ lights = null, download = false } = {}) {
      const eng = S.engine;
      const src = Array.isArray(lights) ? lights : Array.isArray(eng?.lights) ? eng.lights : [];
      const rows = ['Head No,Name,Manufacturer,Model,Mode,Patch,Group,HangX_m,HangY_m,HangZ_m,ClampOffsetCL_m'];
      let curUni = 1;
      let curAddr = 1;
      src.forEach((l, idx) => {
        const cat = classifyFixture18(l, idx, src.length);
        const grp = assignFixtureGroup18(l, idx, src.length);
        const ch = Number(l.dmxChannels) || (cat === 'spot' ? 24 : cat === 'beam' ? 16 : cat === 'bar' ? 36 : 12);
        let uni = Number(l.dmxUniverse) || curUni;
        let addr = Number(l.dmxAddress) || curAddr;
        if (addr + ch - 1 > 512) {
          uni += 1;
          addr = 1;
        }
        curUni = uni;
        curAddr = addr + ch;
        const mfr = cat === 'spot' || cat === 'wash' ? 'Robe' : cat === 'beam' ? 'Claypaky' : 'Chauvet_Pro';
        const model = cat === 'spot' ? 'Forte_Profile' : cat === 'beam' ? 'Sharpy_Plus' : cat === 'bar' ? 'COLORado_PXL_Bar16' : cat === 'par' ? 'SlimPAR_Pro' : 'Pointe_Hybrid';
        const px = +(Number(l.pos?.[0] ?? l.x) || 0).toFixed(2);
        const py = +(Number(l.pos?.[1] ?? l.y) || 6.0).toFixed(2);
        const pz = +(Number(l.pos?.[2] ?? l.z) || 0).toFixed(2);
        const safeName = String(l.name || `Head_${idx + 1}`).replace(/,/g, ' ');
        rows.push(`${idx + 1},${safeName},${mfr},${model},${ch}ch,${uni}-${String(addr).padStart(3, '0')},${grp},${px},${py},${pz},${px >= 0 ? '+' + px.toFixed(2) : px.toFixed(2)}`);
      });
      const csv = rows.join('\n');
      if (download && typeof window.downloadText === 'function') {
        window.downloadText('ChamSys_MagicQ_Patch.csv', csv);
      }
      return csv;
    }

    function exportTrussClampTapeCsv18({ lights = null, download = false } = {}) {
      const eng = S.engine;
      const src = Array.isArray(lights) ? lights : Array.isArray(eng?.lights) ? eng.lights : [];
      const sorted = src
        .map((l, idx) => {
          const px = +(Number(l.pos?.[0] ?? l.x) || 0).toFixed(2);
          const py = +(Number(l.pos?.[1] ?? l.y) || 6.0).toFixed(2);
          const grp = assignFixtureGroup18(l, idx, src.length);
          const side = px < -0.01 ? 'STAGE_RIGHT (L)' : px > 0.01 ? 'STAGE_LEFT (R)' : 'CENTER_LINE (CL)';
          return {
            grp,
            id: l.id || `FIX_${idx + 1}`,
            name: String(l.name || `Fixture_${idx + 1}`).replace(/,/g, ' '),
            side,
            px,
            distClM: +Math.abs(px).toFixed(2),
            tapeCm: Math.round(Math.abs(px) * 100),
            py,
            weightKg: Number(l.weightKg) || 22
          };
        })
        .sort((a, b) => a.grp.localeCompare(b.grp) || a.px - b.px);

      const rows = ['TrussGroup,FixtureID,Name,SideFromCL,SignedX_m,DistanceFromCL_m,TapeMarkFromCL_cm,TrimHeightY_m,WeightKg'];
      for (const r of sorted) {
        rows.push(`${r.grp},${r.id},${r.name},${r.side},${r.px >= 0 ? '+' + r.px.toFixed(2) : r.px.toFixed(2)},${r.distClM.toFixed(2)},CL ${r.px >= 0 ? '+' : '-'}${r.tapeCm}cm,${r.py.toFixed(2)},${r.weightKg}`);
      }
      const csv = rows.join('\n');
      if (download && typeof window.downloadText === 'function') {
        window.downloadText('Truss_Clamp_Tape_CL0.00m.csv', csv);
      }
      return csv;
    }

    function openDmxProgrammerModal18() {
      if (typeof window.dialog !== 'function') return null;
      const prog = lumiState.dmxProgrammer18;
      const audit = computeBroadcastAndIldaAudit18();
      const grpRows = ['G1', 'G2', 'G3', 'G4', 'G5']
        .map((gId) => {
          const g = prog.groups[gId];
          return (
            `<div class="lmp-prog-row18" data-dmx-grp="${gId}">` +
            `<b>${esc18(g.label)}</b>` +
            `<label><span>Pan (°)</span><input type="range" min="-90" max="90" step="1" value="${g.panOffsetDeg}" data-grp-field="panOffsetDeg"></label>` +
            `<label><span>Tilt (°)</span><input type="range" min="-60" max="60" step="1" value="${g.tiltOffsetDeg}" data-grp-field="tiltOffsetDeg"></label>` +
            `<label><span>Fanning (°)</span><input type="range" min="-60" max="60" step="1" value="${g.fanningSpreadDeg}" data-grp-field="fanningSpreadDeg"></label>` +
            `<label><span>Dimmer (%)</span><input type="range" min="0" max="100" step="1" value="${g.dimmer}" data-grp-field="dimmer"></label>` +
            `</div>`
          );
        })
        .join('');

      const html =
        `<div class="lmp-modal-grid18">` +
        `<div class="info-box">` +
        `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">` +
        `<strong>${tr18('Bàn Lập Trình Nhóm DMX (G1–G5) & Bảng Màu Độc Lập', 'DMX Group Programmer (G1–G5) & Palette Editor')}</strong>` +
        `<div style="display:flex;gap:6px">` +
        `<button type="button" class="btn small ${prog.freezeDmx ? 'primary' : ''}" id="dmxProgFreezeBtn18">${prog.freezeDmx ? tr18('Đang Khóa Freeze DMX', 'Freeze DMX Active') : tr18('Khóa Freeze DMX', 'Freeze DMX')}</button>` +
        `<button type="button" class="btn small" id="dmxExportChamsysBtn18">ChamSys MagicQ CSV</button>` +
        `<button type="button" class="btn small" id="dmxExportClampTapeBtn18">Truss Clamp Tape CSV (CL 0.00m)</button>` +
        `</div></div>` +
        `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px">` +
        `<label><span>PAR Chase Mode</span><select id="dmxParChaseSelect18">` +
        `<option value="carousel" ${prog.parChaseMode === 'carousel' ? 'selected' : ''}>Carousel</option>` +
        `<option value="mirror_domino" ${prog.parChaseMode === 'mirror_domino' ? 'selected' : ''}>Mirror Domino</option>` +
        `<option value="dual_carousel" ${prog.parChaseMode === 'dual_carousel' ? 'selected' : ''}>Dual Carousel</option>` +
        `<option value="gala_sparkle" ${prog.parChaseMode === 'gala_sparkle' ? 'selected' : ''}>Gala Sparkle</option>` +
        `</select></label>` +
        `<label><span>Aperture (m)</span><input type="number" id="dmxApertureInput18" min="0.01" max="0.12" step="0.005" value="${prog.optics.aperture}"></label>` +
        `<label><span>Zoom (°)</span><input type="number" id="dmxZoomInput18" min="2" max="55" step="1" value="${prog.optics.zoomDeg}"></label>` +
        `<label><span>Spread Factor</span><input type="number" id="dmxSpreadInput18" min="0.4" max="2.2" step="0.1" value="${prog.optics.spreadFactor}"></label>` +
        `</div></div>` +
        `<div class="info-box">${grpRows}</div>` +
        `<div class="info-box">` +
        `<strong>${tr18('Kiểm Toán Broadcast TV Optics, Moiré & An Toàn Laser ILDA (IEC 60825-1)', 'Broadcast TV Optics, Moiré & ILDA Laser Safety Audit (IEC 60825-1)')}</strong>` +
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px">` +
        `<div><small>Keylight vs LED Nits</small><br><b>${audit.keylightLux} Lux / ${audit.ledWallNits} Nits (${audit.balanceStatus})</b></div>` +
        `<div><small>Camera Moiré Risk</small><br><b>${audit.moireRisk} (Min Safe ${audit.minSafeDistanceM}m)</b></div>` +
        `<div><small>ILDA Horizon (Y >= +3.20m)</small><br><b>${audit.ildaSafe ? 'PASS' : 'WARN'} (Lowest +${audit.lowestBeamY}m)</b></div>` +
        `</div></div></div>`;

      window.dialog(tr18('3D Lighting Studio & DMX Group Programmer', '3D Lighting Studio & DMX Group Programmer'), html, [
        { label: tr18('Đóng', 'Close'), onClick: () => $('modal')?.close() }
      ]);

      $('dmxProgFreezeBtn18')?.addEventListener('click', () => {
        toggleFreezeDmx18();
        openDmxProgrammerModal18();
      });
      $('dmxExportChamsysBtn18')?.addEventListener('click', () => {
        exportChamsysMagicQCsv18({ download: true });
        window.toast?.(tr18('Đã xuất bảng Patch ChamSys MagicQ CSV.', 'Exported ChamSys MagicQ Patch CSV.'));
      });
      $('dmxExportClampTapeBtn18')?.addEventListener('click', () => {
        exportTrussClampTapeCsv18({ download: true });
        window.toast?.(tr18('Đã xuất thước dán Truss Clamp Tape CSV từ tâm CL 0.00m.', 'Exported Truss Clamp Tape CSV from CL 0.00m.'));
      });
      const syncModalInputs = () => {
        const groups = {};
        document.querySelectorAll?.('[data-dmx-grp]').forEach((row) => {
          const gId = row.getAttribute('data-dmx-grp');
          groups[gId] = {};
          row.querySelectorAll?.('[data-grp-field]').forEach((inp) => {
            groups[gId][inp.getAttribute('data-grp-field')] = Number(inp.value) || 0;
          });
        });
        applyDmxGroupProgrammer18({
          parChaseMode: $('dmxParChaseSelect18')?.value || prog.parChaseMode,
          optics: {
            aperture: Number($('dmxApertureInput18')?.value) || prog.optics.aperture,
            zoomDeg: Number($('dmxZoomInput18')?.value) || prog.optics.zoomDeg,
            spreadFactor: Number($('dmxSpreadInput18')?.value) || prog.optics.spreadFactor
          },
          groups
        });
      };
      $('modal')?.querySelectorAll?.('input,select').forEach((el) => {
        el.addEventListener('input', syncModalInputs);
        el.addEventListener('change', syncModalInputs);
      });
      return prog;
    }

    // =========================================================================
    // PHASE B — 3D STRUCTURE CONFIG, MIRROR DECK, LIVE SYMMETRY 3D & ORGANIC CROWD BOUNCE
    // =========================================================================
    const EN13814_STAIR_LAYOUTS18 = {
      front_center: { id: 'front_center', labelVi: 'Thang Chính Giữa (Front Center)', labelEn: 'Front Center Stair', count: 1 },
      front_dual: { id: 'front_dual', labelVi: 'Thang Đôi Trái/Phải (Front Dual L/R)', labelEn: 'Front Dual Stairs L/R', count: 2 },
      side_lr: { id: 'side_lr', labelVi: 'Thang 2 Cánh Gà (Side Wings L/R)', labelEn: 'Side Wing Stairs L/R', count: 2 },
      rear_tech: { id: 'rear_tech', labelVi: 'Thang Kỹ Thuật Hậu Trường (Rear Tech)', labelEn: 'Rear Technical Stair', count: 1 },
      catwalk_tip: { id: 'catwalk_tip', labelVi: 'Thang Mũi Catwalk / B-Stage', labelEn: 'Catwalk / B-Stage Tip Stair', count: 2 },
      all_around: { id: 'all_around', labelVi: 'Thang Vây 4 Hướng (Arena 4-Way)', labelEn: 'Arena 4-Way Stairs', count: 4 }
    };

    function computeModularDeckAndLayher18(cfgOverrides = {}) {
      const cfg = { ...lumiState.structureConfig18, ...cfgOverrides };
      const deckW = Math.max(2, Math.round((Number(cfg.deckWidthM) || 14) / 2) * 2);
      const deckD = Math.max(2, Math.round(Number(cfg.deckDepthM) || 8));
      const deckH = clamp18(Number(cfg.deckHeightM) || 1.2, 0.2, 4.0);
      const moduleCols = Math.round(deckW / 2); // 2m wide modules
      const moduleRows = Math.round(deckD / 1); // 1m deep modules
      const mainDeckModules = moduleCols * moduleRows;

      let catwalkModules = 0;
      let catwalkAreaM2 = 0;
      const catLen = clamp18(Number(cfg.catwalkLengthM) || 6, 0, 20);
      const bWidth = clamp18(Number(cfg.bStageWidthM) || 4, 2, 10);
      if (cfg.catwalkType === 'straight') {
        catwalkModules = Math.ceil(catLen) * 1 + Math.ceil((bWidth * bWidth) / 2);
        catwalkAreaM2 = catLen * 2 + bWidth * bWidth;
      } else if (cfg.catwalkType === 'circular_cnc') {
        catwalkAreaM2 = +(catLen * 2 + Math.PI * Math.pow(bWidth * 0.5, 2)).toFixed(2);
        catwalkModules = Math.ceil(catwalkAreaM2 / 2);
      } else if (cfg.catwalkType === 'octagonal_45') {
        catwalkAreaM2 = +(catLen * 2 + 0.828 * bWidth * bWidth).toFixed(2);
        catwalkModules = Math.ceil(catwalkAreaM2 / 2);
      }

      const totalDeckModules = mainDeckModules + catwalkModules;
      const legCount = (moduleCols + 1) * (moduleRows + 1) + catwalkModules * 2;
      const clampCount = totalDeckModules * 4;

      // EN 13814 Stair Calculation (170mm riser, 280mm tread, 1.10m handrail)
      const stairMeta = EN13814_STAIR_LAYOUTS18[cfg.stairLayout] || EN13814_STAIR_LAYOUTS18.front_dual;
      const stepsPerStair = Math.max(2, Math.ceil((deckH * 1000) / 170));
      const stairRunM = +((stepsPerStair * 280) / 1000).toFixed(2);

      // Layher Allround Scaffolding Bays (2.07m / 2.57m / 2.00m)
      const bayLenM = cfg.layherBayStandard === '2.57m' ? 2.57 : cfg.layherBayStandard === '2.00m' ? 2.0 : 2.07;
      const baysWide = Math.max(1, Math.ceil(deckW / bayLenM));
      const baysDeep = Math.max(1, Math.ceil(deckD / bayLenM));
      const levels = Math.max(1, Math.ceil(deckH / 2.0));
      const standardsCount = (baysWide + 1) * (baysDeep + 1) * levels;
      const ledgersCount = (baysWide * (baysDeep + 1) + baysDeep * (baysWide + 1)) * levels * 2;
      const diagonalsCount = (baysWide + baysDeep) * levels * 2;

      return {
        venueType: cfg.venueType,
        venueXRay: !!cfg.venueXRay,
        deckMaterial: cfg.deckMaterial === 'black_wood' ? 'black_wood' : 'mirror',
        reflectivity: cfg.deckMaterial === 'mirror' ? 0.78 : 0.12,
        moduleSize: '2x1m',
        deckWidthM: deckW,
        deckDepthM: deckD,
        deckHeightM: deckH,
        moduleCols,
        moduleRows,
        mainDeckModules,
        catwalkType: cfg.catwalkType,
        catwalkModules,
        catwalkAreaM2,
        totalDeckModules,
        legCount,
        clampCount,
        stairStandard: 'EN 13814',
        stairLayout: stairMeta.id,
        stairUnits: stairMeta.count,
        stepsPerStair,
        riserHeightMm: 170,
        treadDepthMm: 280,
        handrailHeightM: 1.1,
        stairRunM,
        layherBayStandard: `${bayLenM.toFixed(2)}m`,
        layherBayLengthM: bayLenM,
        baysWide,
        baysDeep,
        standardsCount,
        ledgersCount,
        diagonalsCount,
        liveSymmetry3D: !!cfg.liveSymmetry3D,
        crowdBounce: !!cfg.crowdBounce
      };
    }

    function enforceLiveSymmetry3D18() {
      const eng = S.engine;
      const sa = S.stageAssets16;
      let mirroredFixtures = 0;
      let mirroredAssets = 0;

      // Mirror left-side lights (X < -0.25) onto right-side counterparts (X > +0.25) across X = 0
      if (Array.isArray(eng?.lights)) {
        const leftLights = eng.lights.filter((l) => l && Number(l.pos?.[0]) < -0.25);
        const rightLights = eng.lights.filter((l) => l && Number(l.pos?.[0]) > 0.25);
        leftLights.forEach((lLeft, idx) => {
          const rLight = rightLights[idx];
          if (rLight) {
            rLight.pos = [-Number(lLeft.pos[0]), Number(lLeft.pos[1]), Number(lLeft.pos[2])];
            if (Array.isArray(lLeft.target)) {
              rLight.target = [-Number(lLeft.target[0]), Number(lLeft.target[1]), Number(lLeft.target[2])];
            }
            rLight.color = lLeft.color;
            rLight.power = lLeft.power;
            rLight.angle = lLeft.angle;
            mirroredFixtures++;
          }
        });
      }

      // Mirror left-side stage assets (X < -0.25) onto right-side counterparts across X = 0
      if (Array.isArray(sa?.items)) {
        const byKind = new Map();
        for (const it of sa.items) {
          const k = String(it.kind || it.type || 'item');
          if (!byKind.has(k)) byKind.set(k, []);
          byKind.get(k).push(it);
        }
        for (const list of byKind.values()) {
          const lefts = list.filter((it) => Number(it.pos?.[0]) < -0.25).sort((a, b) => a.pos[0] - b.pos[0]);
          const rights = list.filter((it) => Number(it.pos?.[0]) > 0.25).sort((a, b) => b.pos[0] - a.pos[0]);
          lefts.forEach((lIt, i) => {
            let rIt = rights[i];
            if (!rIt && typeof sa.addCatalogItem === 'function') {
              rIt = sa.addCatalogItem(lIt.kind || lIt.type, [-Number(lIt.pos[0]), Number(lIt.pos[1]), Number(lIt.pos[2])]);
            }
            if (rIt) {
              rIt.pos = [-Number(lIt.pos[0]), Number(lIt.pos[1]), Number(lIt.pos[2])];
              if (lIt.rot) rIt.rot = [Number(lIt.rot[0]) || 0, -(Number(lIt.rot[1]) || 0), Number(lIt.rot[2]) || 0];
              rIt.scale = lIt.scale;
              sa.syncItemMeshes?.(rIt);
              mirroredAssets++;
            }
          });
        }
      }

      if (eng) eng._stageBatchDirty = true;
      return { mirroredFixtures, mirroredAssets };
    }

    function sanitizeStructureConfig18(rawCfg = {}) {
      const base = lumiState.structureConfig18 || {};
      const src = rawCfg && typeof rawCfg === 'object' ? rawCfg : {};
      const pick = (k, def) => (src[k] !== undefined ? src[k] : base[k] !== undefined ? base[k] : def);
      const venueTypes = ['indoor_hall', 'outdoor_roof', 'coliseum_arena'];
      const wallFinishes = ['drape_black', 'concrete', 'brick_acoustic'];
      const deckMats = ['mirror', 'black_wood'];
      const stairLayouts = Object.keys(EN13814_STAIR_LAYOUTS18);
      const catwalkTypes = ['none', 'straight', 'circular_cnc', 'octagonal_45'];
      const bayStds = ['2.07m', '2.57m', '2.00m'];
      const seatingLayouts = ['none', 'gala_banquet', 'corporate_chairs'];
      const corridorTypes = ['central', 'side', 'central_side'];
      const vType = venueTypes.includes(pick('venueType', 'indoor_hall')) ? pick('venueType', 'indoor_hall') : 'indoor_hall';
      const wFin = wallFinishes.includes(pick('wallFinish', 'drape_black')) ? pick('wallFinish', 'drape_black') : 'drape_black';
      const dMat = deckMats.includes(pick('deckMaterial', 'mirror')) ? pick('deckMaterial', 'mirror') : 'mirror';
      const sLay = stairLayouts.includes(pick('stairLayout', 'front_dual')) ? pick('stairLayout', 'front_dual') : 'front_dual';
      const cTyp = catwalkTypes.includes(pick('catwalkType', 'none')) ? pick('catwalkType', 'none') : 'none';
      const bStd = bayStds.includes(pick('layherBayStandard', '2.07m')) ? pick('layherBayStandard', '2.07m') : '2.07m';
      const seatLay = seatingLayouts.includes(pick('seatingLayout', 'none')) ? pick('seatingLayout', 'none') : 'none';
      const corrTyp = corridorTypes.includes(pick('corridorType', 'central_side')) ? pick('corridorType', 'central_side') : 'central_side';
      return {
        venueEnabled: !!pick('venueEnabled', false),
        venueType: vType,
        venueXRay: !!pick('venueXRay', false),
        wallFinish: wFin,
        hideIndoorWalls: !!pick('hideIndoorWalls', false),
        hideFabrics: !!pick('hideFabrics', false),
        daylightMode: pick('daylightMode', 'night') === 'day' ? 'day' : 'night',
        paWingWidthM: clamp18(Number(pick('paWingWidthM', 2.5)) || 2.5, 1.0, 8.0),
        paWingHeightM: clamp18(Number(pick('paWingHeightM', 6.0)) || 6.0, 2.0, 14.0),
        seatingLayout: seatLay,
        corridorType: corrTyp,
        deckWidthM: clamp18(Number(pick('deckWidthM', 14)) || 14, 4, 48),
        deckDepthM: clamp18(Number(pick('deckDepthM', 8)) || 8, 2, 32),
        deckHeightM: clamp18(Number(pick('deckHeightM', 1.2)) || 1.2, 0.2, 4.0),
        deckMaterial: dMat,
        moduleSize: '2x1m',
        stairLayout: sLay,
        catwalkType: cTyp,
        catwalkLengthM: clamp18(Number(pick('catwalkLengthM', 6.0)) || 6.0, 0, 20),
        bStageWidthM: clamp18(Number(pick('bStageWidthM', 4.0)) || 4.0, 2, 10),
        layherBayStandard: bStd,
        liveSymmetry3D: !!pick('liveSymmetry3D', false),
        crowdBounce: pick('crowdBounce', true) !== false,
        crowdCount: clamp18(Math.round(Number(pick('crowdCount', 36)) || 36), 6, 72),
        _crowdInertiaEnergy18: clamp18(Number(pick('_crowdInertiaEnergy18', 0)) || 0, 0, 1)
      };
    }

    function buildVenueArchitectureMeshes18(cfg) {
      const meshes = [];
      const boxFn = typeof window.boxMesh === 'function'
        ? window.boxMesh
        : (name, center, size, color) => ({ id: name, name, p: new Float32Array(36 * 3), uv: new Float32Array(36 * 2), n: new Float32Array(36 * 3), bounds: { min: center, max: center, center }, color });
      const deckW = Number(cfg.deckWidthM) || 14;
      const deckD = Number(cfg.deckDepthM) || 8;
      const pushArch = (m, isWall = false) => {
        if (!m) return;
        m._venueArch18 = true;
        m._isVenueWall18 = isWall;
        m.wireframe18 = !!cfg.venueXRay;
        if (isWall && cfg.hideIndoorWalls) m.hidden = true;
        meshes.push(m);
      };

      if (cfg.venueType === 'indoor_hall') {
        if (cfg.seatingLayout === 'gala_banquet') {
          for (let r = 0; r < 3; r++) {
            for (let c = -2; c <= 2; c++) {
              if (cfg.corridorType !== 'side' && c === 0) continue;
              const tx = c * 3.6;
              const tz = 4.5 + r * 3.8;
              pushArch(boxFn(`Venue_Gala_Table_${r + 1}_${c + 3}`, [tx, 0.42, tz], [1.8, 0.78, 1.8], [0.85, 0.78, 0.62, 1]), false);
            }
          }
        } else if (cfg.seatingLayout === 'corporate_chairs') {
          for (let r = 0; r < 4; r++) {
            for (const side of [-1, 1]) {
              const rx = side * 4.2;
              const rz = 4.0 + r * 2.2;
              pushArch(boxFn(`Venue_Seminar_Row_${r + 1}_${side < 0 ? 'L' : 'R'}`, [rx, 0.45, rz], [5.4, 0.85, 0.65], [0.16, 0.28, 0.46, 1]), false);
            }
          }
        }
      } else if (cfg.venueType === 'outdoor_roof') {
        const roofW = deckW + 3.0;
        const roofD = deckD + 2.0;
        const roofH = 9.2;
        pushArch(boxFn('Venue_Outdoor_RoofCanopy', [0, roofH, -0.5], [roofW, 0.85, roofD], [0.14, 0.17, 0.22, 1]), false);
        const corners = [
          [-roofW * 0.48, roofH * 0.5, -roofD * 0.46],
          [roofW * 0.48, roofH * 0.5, -roofD * 0.46],
          [-roofW * 0.48, roofH * 0.5, roofD * 0.38],
          [roofW * 0.48, roofH * 0.5, roofD * 0.38]
        ];
        corners.forEach((pt, idx) => {
          pushArch(boxFn(`Venue_Outdoor_Tower_${idx + 1}`, pt, [0.45, roofH, 0.45], [0.55, 0.60, 0.68, 1]), false);
        });
        const paW = clamp18(Number(cfg.paWingWidthM) || 2.5, 1.0, 8.0);
        const paH = clamp18(Number(cfg.paWingHeightM) || 6.0, 2.0, 14.0);
        pushArch(boxFn('Venue_Outdoor_PAWing_L', [-roofW * 0.5 - paW * 0.6, paH * 0.5, 0.2], [paW, paH, 1.2], [0.10, 0.13, 0.18, 1]), false);
        pushArch(boxFn('Venue_Outdoor_PAWing_R', [roofW * 0.5 + paW * 0.6, paH * 0.5, 0.2], [paW, paH, 1.2], [0.10, 0.13, 0.18, 1]), false);
        if (!cfg.hideFabrics) {
          pushArch(boxFn('Venue_Outdoor_Fabric_L', [-roofW * 0.49, roofH * 0.5, -0.4], [0.08, roofH * 0.88, roofD * 0.82], [0.05, 0.06, 0.08, 1]), false);
          pushArch(boxFn('Venue_Outdoor_Fabric_R', [roofW * 0.49, roofH * 0.5, -0.4], [0.08, roofH * 0.88, roofD * 0.82], [0.05, 0.06, 0.08, 1]), false);
        }
      } else if (cfg.venueType === 'coliseum_arena') {
        const tiers = [
          { name: 'LowerBowl', radius: Math.max(14, deckW * 0.95), y: 1.8, h: 2.4, col: [0.15, 0.19, 0.26, 1] },
          { name: 'VIPRing', radius: Math.max(18, deckW * 1.22), y: 4.4, h: 1.6, col: [0.24, 0.20, 0.14, 1] },
          { name: 'UpperBowl', radius: Math.max(22, deckW * 1.48), y: 6.8, h: 3.0, col: [0.12, 0.15, 0.22, 1] }
        ];
        const segs = 7;
        for (const tier of tiers) {
          for (let s = 0; s < segs; s++) {
            const ang = -Math.PI * 0.15 + (s / (segs - 1)) * (Math.PI * 1.3);
            const sx = +(Math.cos(ang) * tier.radius).toFixed(2);
            const sz = +(Math.sin(ang) * tier.radius + 4.0).toFixed(2);
            pushArch(boxFn(`Venue_Coliseum_${tier.name}_${s + 1}`, [sx, tier.y, sz], [5.2, tier.h, 2.6], tier.col), false);
          }
        }
      }
      return meshes;
    }

    function applyStructureConfig18(partialCfg = {}, opts = {}) {
      const clean = sanitizeStructureConfig18(partialCfg);
      const enableVenue = partialCfg.venueEnabled !== undefined
        ? !!partialCfg.venueEnabled
        : (opts.fromRestore ? !!lumiState.structureConfig18.venueEnabled : true);
      const cfg = Object.assign(lumiState.structureConfig18, clean, { venueEnabled: enableVenue });
      const calc = computeModularDeckAndLayher18(cfg);
      const eng = S.engine;
      let venueMeshesAdded = 0;
      if (eng) {
        if (eng.settings) {
          eng.settings.floorReflect = calc.reflectivity;
          eng.settings.venueXRay = calc.venueXRay;
          if (!opts.fromRestore || cfg.venueEnabled) {
            if (cfg.daylightMode === 'day') {
              eng.settings.ambient = 1.15;
              eng.settings.exposure = 1.35;
            } else if (!opts.fromRestore) {
              eng.settings.ambient = 0.48;
              eng.settings.exposure = 1.0;
            }
          }
        }
        if (Array.isArray(eng.stage)) {
          for (const m of eng.stage) {
            if (m && (m._venueArch18 || /^Venue_Indoor_/i.test(m.name || ''))) eng.releaseMesh?.(m);
          }
          eng.stage = eng.stage.filter((m) => !m || (!m._venueArch18 && !/^Venue_Indoor_/i.test(m.name || '')));
          if (cfg.venueEnabled) {
            const venueMeshes = buildVenueArchitectureMeshes18(cfg);
            eng.stage.push(...venueMeshes);
            venueMeshesAdded = venueMeshes.length;
          }
          eng.stage.forEach((m) => {
            if (!m || m._venueArch18) return;
            const nm = String(m.name || '').toLowerCase();
            if (nm.includes('deck') || nm.includes('floor') || nm.includes('stage')) {
              m.color = calc.deckMaterial === 'mirror' ? [0.06, 0.09, 0.14] : [0.08, 0.07, 0.06];
              m.reflective18 = calc.deckMaterial === 'mirror';
            }
            if (nm.includes('roof') || nm.includes('venue') || nm.includes('pillar')) {
              m.wireframe18 = calc.venueXRay;
            }
          });
        }
        if (cfg.liveSymmetry3D) {
          enforceLiveSymmetry3D18();
        }
        eng._stageBatchDirty = true;
      }
      return {
        ...calc,
        venueEnabled: !!cfg.venueEnabled,
        venueMeshesAdded,
        daylightMode: cfg.daylightMode,
        hideIndoorWalls: !!cfg.hideIndoorWalls,
        seatingLayout: cfg.seatingLayout
      };
    }

    function drawMirrorDeckReflections18(ctx, proj, eng, tSec, spd) {
      if (!ctx || typeof proj !== 'function' || !eng) return;
      const deckY = Math.max(0.4, (eng.stageBounds?.min?.[1] || 0) + 0.45);
      const lights = Array.isArray(eng.lights) ? eng.lights : [];
      for (let i = 0; i < lights.length; i++) {
        const l = lights[i];
        if (!l || !l.enabled || l.power <= 0.2 || !Array.isArray(l.pos) || !Array.isArray(l.target)) continue;
        const refTarget = [l.target[0], 2 * deckY - l.target[1], l.target[2]];
        const p0 = proj([l.target[0], deckY, l.target[2]]);
        const p1 = proj(refTarget.map((v, k) => (k === 1 ? Math.min(deckY - 0.2, v) : v)));
        if (!p0 || !p1) continue;
        const g = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
        g.addColorStop(0, rgba18(l.color || '#00f0ff', 0.22));
        g.addColorStop(1, rgba18(l.color || '#00f0ff', 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    }

    function drawOrganicCrowdBounce18(ctx, proj, eng, tSec = 0, spd = 2.0, running = true) {
      if (!ctx || typeof proj !== 'function') return 0;
      const cfg = lumiState.structureConfig18;
      if (cfg) {
        if (running) {
          cfg._crowdInertiaEnergy18 = 1.0;
        } else {
          const nextE = (Number(cfg._crowdInertiaEnergy18) || 0) * 0.82;
          cfg._crowdInertiaEnergy18 = nextE < 0.005 ? 0 : +nextE.toFixed(4);
        }
      }
      const energy = cfg ? Number(cfg._crowdInertiaEnergy18) || 0 : (running ? 1 : 0);
      const count = clamp18(Number(cfg?.crowdCount) || 24, 6, 72);
      let drawn = 0;
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / 12);
        const col = i % 12;
        const x = (col - 5.5) * 1.15 + (row % 2) * 0.45;
        const z = 4.2 + row * 1.25;
        const bounce = energy > 0 ? Math.abs(Math.sin(tSec * spd * 4.2 + i * 0.65)) * 0.24 * energy : 0;
        const headY = 1.68 + bounce;
        const pHead = proj([x, headY, z]);
        const pShoulders = proj([x, headY - 0.35, z]);
        if (!pHead || !pShoulders) continue;

        ctx.fillStyle = rgba18('#38bdf8', 0.28);
        ctx.beginPath();
        ctx.arc(pHead.x, pHead.y, 4.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = rgba18('#01ffa0', 0.24);
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(pHead.x, pHead.y + 4);
        ctx.lineTo(pShoulders.x, pShoulders.y);
        ctx.stroke();
        drawn++;
      }
      return drawn;
    }

    function openStructureConfigModal18() {
      if (typeof window.dialog !== 'function') return null;
      const cfg = lumiState.structureConfig18;
      const calc = computeModularDeckAndLayher18(cfg);
      const stairOpts = Object.values(EN13814_STAIR_LAYOUTS18)
        .map((st) => `<option value="${st.id}" ${cfg.stairLayout === st.id ? 'selected' : ''}>${esc18(tr18(st.labelVi, st.labelEn))}</option>`)
        .join('');

      const html =
        `<div class="lmp-modal-grid18">` +
        `<div class="info-box">` +
        `<strong>${tr18('Cấu Hình Hội Trường (Venue), Mặt Sàn Gương Mirror & Giàn Giáo Layher Allround', '3D Venue Shell, Mirror Reflective Deck & Layher Allround Config')}</strong>` +
        `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">` +
        `<label><span>Venue Type</span><select id="structVenueType18">` +
        `<option value="indoor_hall" ${cfg.venueType === 'indoor_hall' ? 'selected' : ''}>Indoor Hall</option>` +
        `<option value="outdoor_roof" ${cfg.venueType === 'outdoor_roof' ? 'selected' : ''}>Outdoor Roof + PA Wings</option>` +
        `<option value="coliseum_arena" ${cfg.venueType === 'coliseum_arena' ? 'selected' : ''}>Coliseum Arena (3-Tier)</option>` +
        `</select></label>` +
        `<label><span>Deck Surface</span><select id="structDeckMat18">` +
        `<option value="mirror" ${cfg.deckMaterial === 'mirror' ? 'selected' : ''}>Mirror Reflective Deck</option>` +
        `<option value="black_wood" ${cfg.deckMaterial === 'black_wood' ? 'selected' : ''}>Black Wood Anti-Slip</option>` +
        `</select></label>` +
        `<label><span>Layher Allround Bay</span><select id="structLayherBay18">` +
        `<option value="2.07m" ${cfg.layherBayStandard === '2.07m' ? 'selected' : ''}>2.07m Metric Standard</option>` +
        `<option value="2.57m" ${cfg.layherBayStandard === '2.57m' ? 'selected' : ''}>2.57m Heavy Span</option>` +
        `<option value="2.00m" ${cfg.layherBayStandard === '2.00m' ? 'selected' : ''}>2.00m Event Grid</option>` +
        `</select></label>` +
        `<label><span>Stairs (EN 13814)</span><select id="structStairLayout18">${stairOpts}</select></label>` +
        `<label><span>Catwalk + B-Stage</span><select id="structCatwalkType18">` +
        `<option value="none" ${cfg.catwalkType === 'none' ? 'selected' : ''}>None</option>` +
        `<option value="straight" ${cfg.catwalkType === 'straight' ? 'selected' : ''}>Straight Thrust</option>` +
        `<option value="circular_cnc" ${cfg.catwalkType === 'circular_cnc' ? 'selected' : ''}>Circular CNC</option>` +
        `<option value="octagonal_45" ${cfg.catwalkType === 'octagonal_45' ? 'selected' : ''}>Octagonal 45°</option>` +
        `</select></label>` +
        `<label><span>Seating Layout</span><select id="structSeatingLayout18">` +
        `<option value="none" ${cfg.seatingLayout === 'none' ? 'selected' : ''}>Standing / Crowd</option>` +
        `<option value="gala_banquet" ${cfg.seatingLayout === 'gala_banquet' ? 'selected' : ''}>Gala Banquet Tables</option>` +
        `<option value="corporate_chairs" ${cfg.seatingLayout === 'corporate_chairs' ? 'selected' : ''}>Corporate Seminar Rows</option>` +
        `</select></label>` +
        `<label><span>Daylight vs Show Night</span><select id="structDaylightMode18">` +
        `<option value="night" ${cfg.daylightMode === 'night' ? 'selected' : ''}>Night Show Mode</option>` +
        `<option value="day" ${cfg.daylightMode === 'day' ? 'selected' : ''}>Daylight Rigging Check</option>` +
        `</select></label>` +
        `<div style="display:flex;flex-direction:column;gap:4px;justify-content:center">` +
        `<label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="structVenueXRay18" ${cfg.venueXRay ? 'checked' : ''}><span>Venue X-Ray</span></label>` +
        `<label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="structHideWalls18" ${cfg.hideIndoorWalls ? 'checked' : ''}><span>Hide Indoor Walls (Camera Free)</span></label>` +
        `<label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="structLiveSym18" ${cfg.liveSymmetry3D ? 'checked' : ''}><span>Live Symmetry 3D (X=0)</span></label>` +
        `<label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="structCrowdBounce18" ${cfg.crowdBounce ? 'checked' : ''}><span>Organic Crowd Bounce</span></label>` +
        `</div></div></div>` +
        `<div class="info-box" id="structSummaryBox18">` +
        `<b>Module 2×1m:</b> ${calc.totalDeckModules} tấm (${calc.legCount} chân, ${calc.clampCount} khóa) · ` +
        `<b>Cầu thang EN 13814:</b> ${calc.stairUnits} cụm × ${calc.stepsPerStair} bậc (170×280mm) · ` +
        `<b>Layher ${calc.layherBayStandard}:</b> ${calc.standardsCount} trụ đứng, ${calc.ledgersCount} giằng ngang, ${calc.diagonalsCount} giằng chéo` +
        `</div></div>`;

      window.dialog(tr18('Cấu hình Kết cấu 3D, Sàn Gương & Đối Xứng Gương', '3D Structure, Mirror Deck & Live Symmetry'), html, [
        { label: tr18('Áp dụng & Đóng', 'Apply & Close'), className: 'primary', onClick: () => $('modal')?.close() }
      ]);

      const syncStruct = () => {
        window.checkpoint?.();
        const res = applyStructureConfig18({
          venueEnabled: true,
          venueType: $('structVenueType18')?.value || cfg.venueType,
          deckMaterial: $('structDeckMat18')?.value || cfg.deckMaterial,
          layherBayStandard: $('structLayherBay18')?.value || cfg.layherBayStandard,
          stairLayout: $('structStairLayout18')?.value || cfg.stairLayout,
          catwalkType: $('structCatwalkType18')?.value || cfg.catwalkType,
          seatingLayout: $('structSeatingLayout18')?.value || cfg.seatingLayout,
          daylightMode: $('structDaylightMode18')?.value || cfg.daylightMode,
          venueXRay: !!$('structVenueXRay18')?.checked,
          hideIndoorWalls: !!$('structHideWalls18')?.checked,
          liveSymmetry3D: !!$('structLiveSym18')?.checked,
          crowdBounce: !!$('structCrowdBounce18')?.checked
        });
        const sumBox = $('structSummaryBox18');
        if (sumBox) {
          sumBox.innerHTML =
            `<b>Module 2×1m:</b> ${res.totalDeckModules} tấm (${res.legCount} chân, ${res.clampCount} khóa) · ` +
            `<b>Cầu thang EN 13814:</b> ${res.stairUnits} cụm × ${res.stepsPerStair} bậc (170×280mm) · ` +
            `<b>Layher ${res.layherBayStandard}:</b> ${res.standardsCount} trụ đứng, ${res.ledgersCount} giằng ngang, ${res.diagonalsCount} giằng chéo`;
        }
      };
      $('modal')?.querySelectorAll?.('input,select').forEach((el) => {
        el.addEventListener('change', syncStruct);
      });
      return calc;
    }

    // =========================================================================
    // PHASE C — 3D AUDIO & LINE ARRAY CALIBRATION WORKSTATION #1..#25
    // =========================================================================
    const AUDIO_BRAND_PRESETS18 = {
      lacoustics_k2: { id: 'lacoustics_k2', name: 'L-Acoustics K2 + KS28', maxSpl1mDb: 147, boxWeightKg: 56, hDispDeg: 110 },
      dbaudiotechnik_gsl: { id: 'dbaudiotechnik_gsl', name: 'd&b audiotechnik GSL8 + SL-SUB', maxSpl1mDb: 146, boxWeightKg: 80, hDispDeg: 80 },
      meyer_panther: { id: 'meyer_panther', name: 'Meyer Sound PANTHER + 2100-LFC', maxSpl1mDb: 150, boxWeightKg: 68, hDispDeg: 95 },
      jbl_vtx_a12: { id: 'jbl_vtx_a12', name: 'JBL VTX A12 + B28', maxSpl1mDb: 146, boxWeightKg: 61, hDispDeg: 90 },
      adamson_e15: { id: 'adamson_e15', name: 'Adamson E15 + E219', maxSpl1mDb: 147, boxWeightKg: 60, hDispDeg: 90 }
    };

    function computeLineArrayJCurve18(cfgOverrides = {}) {
      const cfg = { ...lumiState.audioWorkstation18, ...cfgOverrides };
      const preset = AUDIO_BRAND_PRESETS18[cfg.brandPreset] || AUDIO_BRAND_PRESETS18.lacoustics_k2;
      const count = clamp18(Math.round(Number(cfg.boxesPerSide) || 12), 4, 24);
      const bumperH = clamp18(Number(cfg.bumperHeightM) || 8.5, 3.5, 22);
      const topTilt = clamp18(Number(cfg.topTiltDeg) || -2.0, -15, 5);
      const jFactor = clamp18(Number(cfg.jCurveFactor) || 1.25, 0.5, 2.5);
      const earHeightM = 1.65;

      const cabinets = [];
      let cumTilt = topTilt;
      for (let i = 0; i < count; i++) {
        const rawSplay = Array.isArray(cfg.splayAnglesDeg) && Number.isFinite(+cfg.splayAnglesDeg[i])
          ? +cfg.splayAnglesDeg[i]
          : +(0.5 + Math.pow(i / Math.max(1, count - 1), 1.65) * 6.5 * jFactor).toFixed(1);
        const splayDeg = clamp18(rawSplay, 0.5, 10.0);
        if (i > 0) cumTilt -= splayDeg;
        const boxY = +(bumperH - (i + 0.5) * 0.36).toFixed(2);
        const depRad = (Math.max(1.5, Math.abs(cumTilt)) * Math.PI) / 180;
        const aimZ = +clamp18((boxY - earHeightM) / Math.tan(depRad), 2.5, cfg.venueDepthM || 45).toFixed(2);
        const throwDistM = +Math.hypot(boxY - earHeightM, aimZ).toFixed(2);
        const splAtAimDba = +(preset.maxSpl1mDb - 20 * Math.log10(Math.max(1, throwDistM)) - 12).toFixed(1);
        cabinets.push({
          boxIndex: i + 1,
          model: preset.name.split(' + ')[0],
          splayDeg: +splayDeg.toFixed(1),
          cumulativeTiltDeg: +cumTilt.toFixed(1),
          heightY: boxY,
          aimDistanceZM: aimZ,
          throwDistanceM: throwDistM,
          splOnAxisDba: splAtAimDba,
          weightKg: preset.boxWeightKg
        });
      }

      const bumperFrameKg = 92;
      const hangWeightPerSideKg = cabinets.length * preset.boxWeightKg + bumperFrameKg;
      const safetyFactorBgvC1 = +(2000 / Math.max(1, hangWeightPerSideKg)).toFixed(2);

      return {
        brandPreset: preset.id,
        brandName: preset.name,
        boxesPerSide: count,
        bumperHeightM: bumperH,
        topTiltDeg: topTilt,
        bottomTiltDeg: cabinets[cabinets.length - 1]?.cumulativeTiltDeg || topTilt,
        totalVerticalSpreadDeg: +(Math.abs((cabinets[cabinets.length - 1]?.cumulativeTiltDeg || topTilt) - topTilt) + 10).toFixed(1),
        hangWeightPerSideKg,
        safetyFactorBgvC1,
        bgvC1Safe: safetyFactorBgvC1 >= 2.0,
        cabinets
      };
    }

    function exportPinSplayCsv18({ cfg = null, download = false } = {}) {
      const j = computeLineArrayJCurve18(cfg || {});
      const rows = ['BoxIndex,CabinetModel,PinHoleAngle_deg,CumulativeTilt_deg,HeightY_m,AimDistanceZ_m,SPL_OnAxis_dBA,WeightKg'];
      for (const c of j.cabinets) {
        rows.push(`${c.boxIndex},${c.model},${c.splayDeg.toFixed(1)},${c.cumulativeTiltDeg.toFixed(1)},${c.heightY.toFixed(2)},${c.aimDistanceZM.toFixed(2)},${c.splOnAxisDba.toFixed(1)},${c.weightKg}`);
      }
      const csv = rows.join('\n');
      if (download && typeof window.downloadText === 'function') {
        window.downloadText('LineArray_Pin_Splay_21.csv', csv);
      }
      return csv;
    }

    function exportAudioSystem3dJson18({ format = 'json', download = false } = {}) {
      const j = computeLineArrayJCurve18();
      const sub = computeSubwooferTopology18();
      const diag = computeAudioDiagnostics18();
      if (format === 'xml') {
        const boxesXml = j.cabinets
          .map((c) => `    <Cabinet index="${c.boxIndex}" model="${esc18(c.model)}" splayDeg="${c.splayDeg}" tiltDeg="${c.cumulativeTiltDeg}" aimZM="${c.aimDistanceZM}" />`)
          .join('\n');
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<AudioSystem3D preset="${esc18(j.brandPreset)}" bumperHeightM="${j.bumperHeightM}" subTopology="${esc18(sub.topology)}" rearRejectionDb="${sub.rearRejectionDb}" sti="${diag.stiScore}">\n` +
          `  <LineArrayHang boxesPerSide="${j.boxesPerSide}" weightPerSideKg="${j.hangWeightPerSideKg}">\n${boxesXml}\n  </LineArrayHang>\n` +
          `</AudioSystem3D>`;
        if (download && typeof window.downloadText === 'function') {
          window.downloadText('AudioSystem_3D_Prediction.xml', xml);
        }
        return xml;
      }
      const json = JSON.stringify({ lineArray: j, subwoofer: sub, diagnostics: diag }, null, 2);
      if (download && typeof window.downloadText === 'function') {
        window.downloadText('AudioSystem_3D_Prediction.json', json);
      }
      return json;
    }

    function computeSubwooferTopology18(cfgOverrides = {}) {
      const cfg = { ...lumiState.audioWorkstation18, ...cfgOverrides };
      const count = clamp18(Math.round(Number(cfg.subCount) || 12), 2, 32);
      const topology = ['stacks_lr', 'cardioid_csa', 'center_sub_arc'].includes(cfg.subTopology) ? cfg.subTopology : 'cardioid_csa';
      const crossoverHz = clamp18(Number(cfg.crossoverHz) || 80, 50, 120);
      const speedOfSound = 343;
      const quarterWaveDelayMs = +(((speedOfSound / crossoverHz) * 0.25 / speedOfSound) * 1000).toFixed(2);
      const rearRejectionDb = topology === 'cardioid_csa' ? -15.0 : topology === 'center_sub_arc' ? -8.5 : -2.0;
      const powerAlleyVarianceDb = topology === 'center_sub_arc' ? 1.8 : topology === 'cardioid_csa' ? 3.4 : 6.8;

      const units = [];
      for (let i = 0; i < count; i++) {
        const u = (i / Math.max(1, count - 1)) - 0.5;
        const isRearCsa = topology === 'cardioid_csa' && i % 3 === 1;
        const x = topology === 'stacks_lr' ? (i < count / 2 ? -6.2 : 6.2) : +(u * 11.5).toFixed(2);
        const arcDelayMs = topology === 'center_sub_arc' ? +(Math.abs(u) * 4.2).toFixed(2) : isRearCsa ? +(Number(cfg.subDelayMs) || quarterWaveDelayMs).toFixed(2) : 0;
        units.push({
          subIndex: i + 1,
          pos: [x, 0.45, 2.35],
          orientation: isRearCsa ? 'REAR_REVERSED' : 'FRONT_FIRING',
          delayMs: arcDelayMs,
          polarityDeg: isRearCsa && cfg.subPolarityInverted !== false ? 180 : 0,
          lpfHz: crossoverHz
        });
      }

      return {
        topology,
        subCount: count,
        crossoverHz,
        quarterWaveDelayMs,
        rearRejectionDb,
        powerAlleyVarianceDb,
        polarityInverted: cfg.subPolarityInverted !== false,
        units
      };
    }

    function computeAudioDiagnostics18(cfgOverrides = {}) {
      const cfg = { ...lumiState.audioWorkstation18, ...cfgOverrides };
      const j = computeLineArrayJCurve18(cfg);
      const sub = computeSubwooferTopology18(cfg);
      const eng = S.engine;
      const surfaces = Array.isArray(cfg.surfaces) ? cfg.surfaces : Array.isArray(eng?.surfaces) ? eng.surfaces : [];

      const fohSplDba = +(Number(cfg.targetSplFohDba) || 102.0).toFixed(1);
      const frontRowSplDba = +(fohSplDba + 3.2).toFixed(1);
      const rearRowSplDba = +(fohSplDba - 2.6).toFixed(1);
      const uniformityDeltaDb = +(frontRowSplDba - rearRowSplDba).toFixed(1);

      // #7 Acoustic Shadows behind LED Walls
      const ledShadowZones = [];
      surfaces.forEach((s, idx) => {
        const sw = Number(s.physicalWidthM || s.w) || 4;
        const sx = Number(s.pos?.[0]) || 0;
        const sz = Number(s.pos?.[2]) || -1.5;
        if (Math.abs(sx) >= 3.5 && sz > -0.5) {
          ledShadowZones.push({
            screenName: s.name || `LED_${idx + 1}`,
            widthM: sw,
            hfAttenuationDb: -9.5,
            shadowSectorDeg: 18,
            mitigation: 'Raise Line Array Bumper +1.2m or move Side Wing Z back behind PA hang plane'
          });
        }
      });

      // #9 Slapback Echo > 50ms check
      const depthM = clamp18(Number(cfg.venueDepthM) || 45, 12, 150);
      const rearWallDelayMs = +(((depthM * 2) / 343) * 1000).toFixed(1);
      const hasSlapbackEcho = rearWallDelayMs > 50 && Math.abs(j.bottomTiltDeg) < 3.5;

      // #15 Community Noise at 50m / 100m
      const outdoorAtten = lumiState.structureConfig18?.venueType === 'indoor_hall' ? 22 : 4;
      const communityNoise50mDba = +(fohSplDba - 20 * Math.log10(50 / 20) - outdoorAtten).toFixed(1);
      const communityNoise100mDba = +(fohSplDba - 20 * Math.log10(100 / 20) - outdoorAtten).toFixed(1);
      const residentialCompliant = communityNoise100mDba <= 65.0;

      // #16 WHO Safe Exposure Limits (100 dBA LAeq,15m max recommended)
      const whoMaxContinuousDba = 100.0;
      const whoSafeExposureHours = +(8 / Math.pow(2, Math.max(0, fohSplDba - 85) / 3)).toFixed(2);
      const whoStatus = fohSplDba <= 98 ? 'SAFE' : fohSplDba <= 102 ? 'CAUTION' : 'EXCEEDED';

      // #17 Speech Transmission Index (STI) from RT60 and SNR
      const rt60 = clamp18(Number(cfg.rt60Sec) || 1.35, 0.3, 4.5);
      const snrDb = fohSplDba - (Number(cfg.ambientNoiseDb) || 45);
      const stiRaw = 0.86 - rt60 * 0.14 + Math.min(25, snrDb) * 0.004 - (hasSlapbackEcho ? 0.06 : 0) - ledShadowZones.length * 0.03;
      const stiScore = +clamp18(stiRaw, 0.32, 0.92).toFixed(2);
      const stiRating = stiScore >= 0.75 ? 'EXCELLENT' : stiScore >= 0.6 ? 'GOOD' : stiScore >= 0.45 ? 'FAIR' : 'POOR';

      // #22-#24 Live Band Stage Plot & Monitor Rider + Feedback Gain-Before-Feedback (GBF #24)
      const bp = { ...lumiState.audioWorkstation18.bandPlot, ...(cfg.bandPlot || {}) };
      const stagePlotChannels = [];
      if (bp.drums) stagePlotChannels.push({ group: 'Drums', inputs: 'Kick In/Out, Snare T/B, Hi-Hat, 3x Toms, OH L/R (10ch)', wedgeMix: 'Drum Fill Sub+Top' });
      if (bp.percussion) stagePlotChannels.push({ group: 'Percussion', inputs: 'Congas L/R, Bongos, Timbales, Toys (5ch)', wedgeMix: 'Mix 2 Percussion' });
      if (bp.grandPiano) stagePlotChannels.push({ group: 'Grand Piano', inputs: 'Condenser Pair Low/High + Yamahiko Pickup (3ch)', wedgeMix: 'IEM Stereo 1' });
      if (bp.keys) stagePlotChannels.push({ group: 'Keys & Backing Tracks', inputs: 'Main Keys Stereo DI + Synth Stereo + Click/Tracks (6ch)', wedgeMix: 'IEM Stereo 2' });
      if (bp.horns) stagePlotChannels.push({ group: 'Horns Section', inputs: 'Trumpet, Alto Sax, Tenor Sax, Trombone Clip Mics (4ch)', wedgeMix: 'Mix 3 Brass Wedges' });
      const vocalCount = clamp18(Number(bp.vocalMics) || 4, 1, 12);
      stagePlotChannels.push({ group: 'Vocal Mics', inputs: `${vocalCount}x Wireless Supercardioid Capsules`, wedgeMix: `${bp.monitorWedges || 8}x Downstage Wedges + ${bp.iemChannels || 10}x IEM` });

      const stageLeakDb = fohSplDba + sub.rearRejectionDb * 0.5;
      const gbfMarginDb = +(114 - stageLeakDb - (Number(bp.micGainDb) || 0) - (bp.grandPiano ? 2.5 : 0)).toFixed(1);
      const feedbackRiskFreqHz = sub.topology === 'stacks_lr' ? 125 : bp.grandPiano ? 2500 : 3150;
      const feedbackStatus = gbfMarginDb >= 9 ? 'SAFE' : gbfMarginDb >= 4 ? 'RINGING_RISK' : 'FEEDBACK_ALERT';

      return {
        fohSplDba,
        frontRowSplDba,
        rearRowSplDba,
        uniformityDeltaDb,
        ledShadowZones,
        rearWallDelayMs,
        hasSlapbackEcho,
        communityNoise50mDba,
        communityNoise100mDba,
        residentialCompliant,
        whoMaxContinuousDba,
        whoSafeExposureHours,
        whoStatus,
        stiScore,
        stiRating,
        stagePlotChannels,
        gbfMarginDb,
        feedbackRiskFreqHz,
        feedbackStatus,
        lineArray: j,
        subwoofer: sub
      };
    }

    function compareAudioSystemsAB18(cfgA = {}, cfgB = {}) {
      const diagA = computeAudioDiagnostics18(cfgA);
      const diagB = computeAudioDiagnostics18(cfgB);
      return {
        systemA: diagA,
        systemB: diagB,
        deltaSplUniformityDb: +(diagB.uniformityDeltaDb - diagA.uniformityDeltaDb).toFixed(2),
        deltaRearRejectionDb: +(diagB.subwoofer.rearRejectionDb - diagA.subwoofer.rearRejectionDb).toFixed(2),
        deltaSti: +(diagB.stiScore - diagA.stiScore).toFixed(2),
        deltaGbfDb: +(diagB.gbfMarginDb - diagA.gbfMarginDb).toFixed(2),
        recommendedWinner: diagB.stiScore + Math.abs(diagB.subwoofer.rearRejectionDb) * 0.02 >= diagA.stiScore + Math.abs(diagA.subwoofer.rearRejectionDb) * 0.02 ? 'B' : 'A'
      };
    }

    function renderSplHeatmapCanvas18(canvas, cfgOverrides = {}) {
      if (!canvas || typeof canvas.getContext !== 'function') return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const w = canvas.width || 640;
      const h = canvas.height || 320;
      const diag = computeAudioDiagnostics18(cfgOverrides);

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#070d19';
      ctx.fillRect(0, 0, w, h);

      // Draw 2D SPL Coverage Heatmap grid from stage front (left) to venue rear (right)
      const cols = 24;
      const rows = 12;
      const cw = w / cols;
      const ch = h / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const distNorm = (c + 0.5) / cols;
          const offAxis = Math.abs((r + 0.5) / rows - 0.5) * 2;
          const spl = diag.frontRowSplDba - distNorm * 6.5 - offAxis * 3.2;
          const colHex = spl >= 103 ? '#ef4444' : spl >= 99 ? '#f59e0b' : spl >= 94 ? '#10b981' : '#38bdf8';
          ctx.fillStyle = rgba18(colHex, 0.65);
          ctx.fillRect(c * cw, r * ch, cw - 1, ch - 1);
        }
      }

      // Draw Wave Flow wavefront arcs
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.4;
      for (let ring = 1; ring <= 6; ring++) {
        ctx.beginPath();
        ctx.arc(24, h * 0.5, ring * (w * 0.14), -0.65, 0.65);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillText?.(`FOH ${diag.fohSplDba} dBA | STI ${diag.stiScore} (${diag.stiRating}) | CSA ${diag.subwoofer.rearRejectionDb} dB`, 14, h - 12);
      return diag;
    }

    function drawAudioWaveFlowOverlay18(ctx, proj, eng, tSec = 0, spd = 2.0) {
      if (!ctx || typeof proj !== 'function') return;
      const origins = [
        [-6.2, 6.2, 1.2],
        [6.2, 6.2, 1.2]
      ];
      origins.forEach((orig, idx) => {
        for (let w = 0; w < 4; w++) {
          const dist = ((tSec * spd * 6.5 + w * 4.2) % 16.8) + 1.5;
          const pLeft = proj([orig[0] - dist * 0.45, Math.max(0.8, orig[1] - dist * 0.25), orig[2] + dist]);
          const pMid = proj([orig[0], Math.max(0.8, orig[1] - dist * 0.25), orig[2] + dist * 1.12]);
          const pRight = proj([orig[0] + dist * 0.45, Math.max(0.8, orig[1] - dist * 0.25), orig[2] + dist]);
          if (!pLeft || !pMid || !pRight) continue;
          const alpha = clamp18(1 - dist / 18.5, 0.05, 0.42);
          ctx.strokeStyle = rgba18(idx === 0 ? '#01ffa0' : '#00d4ff', alpha);
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(pLeft.x, pLeft.y);
          ctx.quadraticCurveTo(pMid.x, pMid.y, pRight.x, pRight.y);
          ctx.stroke();
        }
      });
    }

    function openAudioWorkstationModal18() {
      if (typeof window.dialog !== 'function') return null;
      const cfg = lumiState.audioWorkstation18;
      const diag = computeAudioDiagnostics18(cfg);
      const presetOpts = Object.values(AUDIO_BRAND_PRESETS18)
        .map((p) => `<option value="${p.id}" ${cfg.brandPreset === p.id ? 'selected' : ''}>${esc18(p.name)}</option>`)
        .join('');

      const html =
        `<div class="lmp-modal-grid18">` +
        `<div class="info-box">` +
        `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">` +
        `<strong>${tr18('Trạm Cân Chỉnh Âm Thanh 3D & Line Array #1..#25', '3D Audio & Line Array Calibration Workstation #1..#25')}</strong>` +
        `<div style="display:flex;gap:6px">` +
        `<button type="button" class="btn small" id="audioExportPinCsvBtn18">#21 Pin Splay CSV</button>` +
        `<button type="button" class="btn small" id="audioExportJsonBtn18">3D Audio JSON</button>` +
        `<button type="button" class="btn small" id="audioExportXmlBtn18">3D Audio XML</button>` +
        `</div></div>` +
        `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px">` +
        `<label><span>Line Array System</span><select id="audioBrandSelect18">${presetOpts}</select></label>` +
        `<label><span>Boxes / Side</span><input type="number" id="audioBoxesInput18" min="4" max="24" value="${cfg.boxesPerSide}"></label>` +
        `<label><span>Bumper Height (m)</span><input type="number" id="audioBumperInput18" min="4" max="20" step="0.5" value="${cfg.bumperHeightM}"></label>` +
        `<label><span>Sub Topology</span><select id="audioSubTopoSelect18">` +
        `<option value="cardioid_csa" ${cfg.subTopology === 'cardioid_csa' ? 'selected' : ''}>Cardioid CSA (-15dB)</option>` +
        `<option value="center_sub_arc" ${cfg.subTopology === 'center_sub_arc' ? 'selected' : ''}>Center Sub-Arc</option>` +
        `<option value="stacks_lr" ${cfg.subTopology === 'stacks_lr' ? 'selected' : ''}>Stacks L/R</option>` +
        `</select></label>` +
        `</div></div>` +
        `<canvas id="audioHeatmapCanvas18" width="640" height="180" style="width:100%;height:180px;border-radius:8px;border:1px solid var(--border)"></canvas>` +
        `<div class="info-box" id="audioDiagSummary18">` +
        `<b>FOH SPL:</b> ${diag.fohSplDba} dBA (Δ ${diag.uniformityDeltaDb} dB) · ` +
        `<b>STI #17:</b> ${diag.stiScore} (${diag.stiRating}) · ` +
        `<b>WHO #16:</b> ${diag.whoStatus} (${diag.whoSafeExposureHours}h) · ` +
        `<b>Community 50m/100m #15:</b> ${diag.communityNoise50mDba}/${diag.communityNoise100mDba} dBA · ` +
        `<b>Feedback GBF #24:</b> +${diag.gbfMarginDb} dB (${diag.feedbackStatus})` +
        `</div></div>`;

      window.dialog(tr18('3D Audio & Line Array Workstation (#1..#25)', '3D Audio & Line Array Workstation (#1..#25)'), html, [
        { label: tr18('Đóng', 'Close'), onClick: () => $('modal')?.close() }
      ]);

      const can = $('audioHeatmapCanvas18');
      if (can) renderSplHeatmapCanvas18(can, cfg);

      $('audioExportPinCsvBtn18')?.addEventListener('click', () => {
        exportPinSplayCsv18({ download: true });
        window.toast?.(tr18('Đã xuất bảng góc ghim #21 Pin Splay CSV.', 'Exported #21 Pin Splay CSV.'));
      });
      $('audioExportJsonBtn18')?.addEventListener('click', () => {
        exportAudioSystem3dJson18({ format: 'json', download: true });
      });
      $('audioExportXmlBtn18')?.addEventListener('click', () => {
        exportAudioSystem3dJson18({ format: 'xml', download: true });
      });
      const syncAudio = () => {
        cfg.brandPreset = $('audioBrandSelect18')?.value || cfg.brandPreset;
        cfg.boxesPerSide = clamp18(Number($('audioBoxesInput18')?.value) || 12, 4, 24);
        cfg.bumperHeightM = clamp18(Number($('audioBumperInput18')?.value) || 8.5, 4, 20);
        cfg.subTopology = $('audioSubTopoSelect18')?.value || cfg.subTopology;
        const nextDiag = renderSplHeatmapCanvas18($('audioHeatmapCanvas18'), cfg) || computeAudioDiagnostics18(cfg);
        const box = $('audioDiagSummary18');
        if (box) {
          box.innerHTML =
            `<b>FOH SPL:</b> ${nextDiag.fohSplDba} dBA (Δ ${nextDiag.uniformityDeltaDb} dB) · ` +
            `<b>STI #17:</b> ${nextDiag.stiScore} (${nextDiag.stiRating}) · ` +
            `<b>WHO #16:</b> ${nextDiag.whoStatus} (${nextDiag.whoSafeExposureHours}h) · ` +
            `<b>Community 50m/100m #15:</b> ${nextDiag.communityNoise50mDba}/${nextDiag.communityNoise100mDba} dBA · ` +
            `<b>Feedback GBF #24:</b> +${nextDiag.gbfMarginDb} dB (${nextDiag.feedbackStatus})`;
        }
      };
      $('modal')?.querySelectorAll?.('input,select').forEach((el) => {
        el.addEventListener('input', syncAudio);
        el.addEventListener('change', syncAudio);
      });
      return diag;
    }

    // =========================================================================
    // PHASE D — 2D PIXEL MAPPER WORKSTATION & VENUE OUTLET POWER COMPARATOR
    // =========================================================================
    const VENUE_OUTLET_SPECS18 = [
      { id: '16A_1P', label: '16A 1φ Schuko / CEE Blue', phases: 1, ampsPerPhase: 16, maxKw: 3.68 },
      { id: '16A_3P', label: '16A 3φ CEE Red (5-Pin)', phases: 3, ampsPerPhase: 16, maxKw: 11.04 },
      { id: '32A_3P', label: '32A 3φ CEE Red (5-Pin)', phases: 3, ampsPerPhase: 32, maxKw: 22.08 },
      { id: '63A_3P', label: '63A 3φ CEE Red Distro', phases: 3, ampsPerPhase: 63, maxKw: 43.47 },
      { id: '125A_3P', label: '125A 3φ Main Powerlock / CEE', phases: 3, ampsPerPhase: 125, maxKw: 86.25 }
    ];

    function compareVenueOutlets18(opts = {}) {
      const eng = S.engine;
      const rider = computeEngineeringRider(eng, opts);
      const selectedId = opts.selectedOutlet || lumiState.venuePower18?.selectedOutlet || '63A_3P';
      if (lumiState.venuePower18) lumiState.venuePower18.selectedOutlet = selectedId;

      const requiredKw = +(Number(opts.requiredKw) || Number(rider.totalPowerContinuousKw) + Number(rider.lightingPowerW || 0) / 1000 + 2.4).toFixed(2);
      const peakKw = +(Number(opts.peakKw) || Number(rider.totalPowerMaxKw) + Number(rider.lightingPowerW || 0) / 1000 + 4.2).toFixed(2);

      const outletComparison = VENUE_OUTLET_SPECS18.map((sp) => {
        const safeContinuousKw = +(sp.maxKw * 0.8).toFixed(2);
        const utilizationPct = +((requiredKw / sp.maxKw) * 100).toFixed(1);
        const breakersNeeded = Math.max(1, Math.ceil(requiredKw / safeContinuousKw));
        return {
          ...sp,
          safeContinuousKw,
          utilizationPct,
          breakersNeeded,
          pass: requiredKw <= safeContinuousKw
        };
      });

      const currentOutlet = outletComparison.find((o) => o.id === selectedId) || outletComparison[3];
      const status = currentOutlet.utilizationPct <= 80 ? 'SAFE' : currentOutlet.utilizationPct <= 100 ? 'NEAR_LIMIT' : 'OVERLOAD';

      return {
        selectedOutlet: currentOutlet.id,
        selectedLabel: currentOutlet.label,
        availableKw: currentOutlet.maxKw,
        safeContinuousKw: currentOutlet.safeContinuousKw,
        requiredKw,
        peakKw,
        loadPercent: currentOutlet.utilizationPct,
        phaseAmps: {
          L1: rider.phaseL1Amps,
          L2: rider.phaseL2Amps,
          L3: rider.phaseL3Amps
        },
        status,
        outletComparison
      };
    }

    function openPixelPowerWorkstationModal18() {
      if (typeof window.dialog !== 'function') return null;
      const eng = S.engine;
      const surf = eng?.surfaces?.find((s) => s.id === eng.selected) || eng?.surfaces?.[0];
      if (surf) window.normalizeSurfaceHardware?.(surf);
      const outletReport = compareVenueOutlets18();

      const outletRows = outletReport.outletComparison
        .map(
          (o) =>
            `<tr><td><b>${esc18(o.label)}</b></td><td>${o.maxKw.toFixed(1)} kW</td><td>${o.utilizationPct}%</td><td>${o.breakersNeeded}x</td><td><b>${o.pass ? 'PASS' : 'OVERLOAD'}</b></td></tr>`
        )
        .join('');

      const html =
        `<div class="lmp-modal-grid18">` +
        `<div class="info-box">` +
        `<strong>${tr18('Xuất File Kỹ Thuật Miễn Phí (PNG Trong Suốt, Bản Vẽ CAD 2D & Resolume 6/7 XML)', 'Free Technical Exports (Transparent PNG, 2D CAD Frame & Resolume 6/7 XML)')}</strong>` +
        `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">` +
        `<button type="button" class="btn small primary" id="ppExportTransPng18">PNG Transparent (Alpha=0)</button>` +
        `<button type="button" class="btn small" id="ppExportCad2dPng18">2D CAD Map (A–H / 1–12 + Cajetin)</button>` +
        `<button type="button" class="btn small" id="ppExportRes6Xml18">Resolume Arena 6 XML</button>` +
        `<button type="button" class="btn small" id="ppExportRes7Xml18">Resolume Arena 7 XML</button>` +
        `</div></div>` +
        `<div class="info-box">` +
        `<strong>${tr18('Đối Chiếu Tải Điện Sân Khấu Với Ổ Cắm Hội Trường (Venue Outlets)', 'Stage Power vs Real Venue Outlets Comparator')}</strong>` +
        `<div style="display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap">` +
        `<label><span>Venue Outlet:</span><select id="venueOutletSelect18">` +
        VENUE_OUTLET_SPECS18.map((o) => `<option value="${o.id}" ${o.id === outletReport.selectedOutlet ? 'selected' : ''}>${esc18(o.label)} (${o.maxKw} kW)</option>`).join('') +
        `</select></label>` +
        `<span><b>Load:</b> ${outletReport.requiredKw} kW / ${outletReport.availableKw} kW (${outletReport.loadPercent}% · ${outletReport.status})</span>` +
        `</div>` +
        `<table class="bom-table" style="width:100%"><thead><tr><th>Outlet Type</th><th>Max Power</th><th>Utilization</th><th>Lines Needed</th><th>Status</th></tr></thead><tbody>${outletRows}</tbody></table>` +
        `</div></div>`;

      window.dialog(tr18('2D Pixel Mapper & Venue Power Workstation', '2D Pixel Mapper & Venue Power Workstation'), html, [
        { label: tr18('Đóng', 'Close'), onClick: () => $('modal')?.close() }
      ]);

      $('venueOutletSelect18')?.addEventListener('change', (e) => {
        compareVenueOutlets18({ selectedOutlet: e.target.value });
        openPixelPowerWorkstationModal18();
      });
      $('ppExportTransPng18')?.addEventListener('click', () => {
        if (surf && typeof window.exportSurfaceCalibrationPng === 'function') {
          window.exportSurfaceCalibrationPng(surf, { transparent: true });
        }
      });
      $('ppExportCad2dPng18')?.addEventListener('click', () => {
        if (surf && typeof window.exportSurfaceCalibrationPng === 'function') {
          window.exportSurfaceCalibrationPng(surf, {
            cadFrame: true,
            cajetinMeta: {
              project: window.state?.projectName || 'ALPHA LED STAGE',
              client: lumiState.quoteConfig?.clientName || 'STAGE PRODUCTION',
              technician: lumiState.brandIdentity?.brandName || 'LED ENGINEER',
              version: 'V1.0'
            }
          });
        }
      });
      $('ppExportRes6Xml18')?.addEventListener('click', () => {
        window.downloadResolumeXml?.(window.live?.atlasPlan, { version: 6, includePolygons: true });
      });
      $('ppExportRes7Xml18')?.addEventListener('click', () => {
        window.downloadResolumeXml?.(window.live?.atlasPlan, { version: 7, includePolygons: true });
      });
      return outletReport;
    }

    // =========================================================================
    // PHASE E — MY WAREHOUSE, RMA, B2B CROSS-RENT, 5-SHEET BLUEPRINTS & SCREEN CAPTURE
    // =========================================================================
    function setWarehouseRmaLock18(skuKey, rmaCount, ownedCount = null) {
      const stock = lumiState.warehouse18.stock;
      if (!stock[skuKey]) {
        stock[skuKey] = {
          name: skuKey,
          category: 'Custom Equipment',
          owned: Math.max(0, Number(ownedCount) || 20),
          rma: 0,
          unitSubRentUsd: 25,
          perCase: 4,
          caseVolM3: 0.45,
          caseWeightKg: 60
        };
      }
      if (ownedCount !== null && Number.isFinite(+ownedCount)) {
        stock[skuKey].owned = Math.max(0, Math.round(+ownedCount));
      }
      stock[skuKey].rma = clamp18(Math.round(Number(rmaCount) || 0), 0, stock[skuKey].owned);
      return {
        sku: skuKey,
        owned: stock[skuKey].owned,
        rma: stock[skuKey].rma,
        available: Math.max(0, stock[skuKey].owned - stock[skuKey].rma)
      };
    }

    function computeWarehouseLogisticsAndShortage18(opts = {}) {
      const eng = S.engine;
      const surfaces = Array.isArray(opts.surfaces) ? opts.surfaces : Array.isArray(eng?.surfaces) ? eng.surfaces : [];
      const lights = Array.isArray(opts.lights) ? opts.lights : Array.isArray(eng?.lights) ? eng.lights : [];
      const stock = lumiState.warehouse18.stock;
      const usdToVnd = Number(opts.usdToVnd) || 25400;

      const requiredBySku = {};
      for (const s of surfaces) {
        window.normalizeSurfaceHardware?.(s);
        const sku = s.cabinetModelId && stock[s.cabinetModelId] ? s.cabinetModelId : 'roe_bp2v2_500';
        const cabs = Number(s.activeCabinets) || (Number(s.cabCols) || 4) * (Number(s.cabRows) || 3);
        requiredBySku[sku] = (requiredBySku[sku] || 0) + cabs;
        const procSku = s.processorModelId && stock[s.processorModelId] ? s.processorModelId : 'brompton_sx40';
        requiredBySku[procSku] = (requiredBySku[procSku] || 0) + 1;
      }

      lights.forEach((l, idx) => {
        const cat = classifyFixture18(l, idx, lights.length);
        const sku = cat === 'beam' || cat === 'spot' ? 'fixture_beam_spot' : cat === 'wash' || cat === 'par' || cat === 'fresnel' ? 'fixture_wash_par' : 'fixture_barra_blinder';
        requiredBySku[sku] = (requiredBySku[sku] || 0) + 1;
      });

      const structCalc = computeModularDeckAndLayher18();
      requiredBySku.deck_module_2x1 = structCalc.totalDeckModules;
      requiredBySku.audio_line_array_box = (Number(lumiState.audioWorkstation18?.boxesPerSide) || 12) * 2;
      requiredBySku.audio_sub_218 = Number(lumiState.audioWorkstation18?.subCount) || 12;

      if (opts.requiredOverrides && typeof opts.requiredOverrides === 'object') {
        Object.assign(requiredBySku, opts.requiredOverrides);
      }

      const items = [];
      let totalFlightcases = 0;
      let totalVolumeM3 = 0;
      let totalWeightKg = 0;
      let totalShortageUnits = 0;
      let totalSubRentUsd = 0;

      for (const [sku, spec] of Object.entries(stock)) {
        const required = Math.max(0, Math.round(Number(requiredBySku[sku]) || 0));
        const owned = Math.max(0, Math.round(Number(spec.owned) || 0));
        const rma = clamp18(Math.round(Number(spec.rma) || 0), 0, owned);
        const available = Math.max(0, owned - rma);
        const shortage = Math.max(0, required - available);
        const flightcases = required > 0 ? Math.ceil(required / Math.max(1, spec.perCase || 4)) : 0;
        const volM3 = +(flightcases * (spec.caseVolM3 || 0.45)).toFixed(2);
        const weightKg = Math.round(flightcases * (spec.caseWeightKg || 60));
        const subRentUsd = shortage * (spec.unitSubRentUsd || 25);

        totalFlightcases += flightcases;
        totalVolumeM3 += volM3;
        totalWeightKg += weightKg;
        totalShortageUnits += shortage;
        totalSubRentUsd += subRentUsd;

        items.push({
          sku,
          name: spec.name,
          category: spec.category,
          required,
          owned,
          rma,
          available,
          shortage,
          flightcases,
          volumeM3: volM3,
          weightKg,
          unitSubRentUsd: spec.unitSubRentUsd,
          subRentUsd
        });
      }

      totalVolumeM3 = +totalVolumeM3.toFixed(2);
      const recommendedTruck =
        totalVolumeM3 <= 12
          ? '1.5T Production Van (12m³)'
          : totalVolumeM3 <= 22
            ? '3.5T Box Truck (22m³)'
            : totalVolumeM3 <= 42
              ? '8T Touring Truck (42m³)'
              : '40ft Semi-Trailer (68m³)';

      return {
        items,
        totalFlightcases,
        totalVolumeM3,
        totalWeightKg,
        totalShortageUnits,
        totalSubRentUsd,
        totalSubRentVnd: Math.round(totalSubRentUsd * usdToVnd),
        recommendedTruck,
        fullyInStock: totalShortageUnits === 0
      };
    }

    function fitStageToWarehouseStock18() {
      const eng = S.engine;
      window.checkpoint?.();
      const stock = lumiState.warehouse18.stock;
      const availOf = (sku) => Math.max(0, (stock[sku]?.owned || 0) - (stock[sku]?.rma || 0));

      // 1. Fit LED surfaces so total cabinets per SKU do not exceed available stock
      const surfaces = Array.isArray(eng?.surfaces) ? eng.surfaces : [];
      const usedCabsBySku = {};
      for (const s of surfaces) {
        window.normalizeSurfaceHardware?.(s);
        const sku = s.cabinetModelId && stock[s.cabinetModelId] ? s.cabinetModelId : 'roe_bp2v2_500';
        const avail = Math.max(1, availOf(sku) - (usedCabsBySku[sku] || 0));
        const cols = Math.max(1, Number(s.cabCols) || 4);
        const rows = Math.max(1, Number(s.cabRows) || 3);
        if (cols * rows > avail) {
          const scale = Math.sqrt(avail / (cols * rows));
          s.cabCols = Math.max(1, Math.floor(cols * scale));
          s.cabRows = Math.max(1, Math.floor(avail / s.cabCols));
          s.physicalWidthM = +(s.cabCols * ((s.cabW || 500) / 1000)).toFixed(2);
          s.physicalHeightM = +(s.cabRows * ((s.cabH || 500) / 1000)).toFixed(2);
          s.physical = [s.physicalWidthM, s.physicalHeightM];
          s.rows500x1000 = 0;
          s.rows500x500 = 0;
          delete s._mixedSpecHeightM;
          s.virtualTiles = [];
          window.normalizeSurfaceHardware?.(s);
        }
        usedCabsBySku[sku] = (usedCabsBySku[sku] || 0) + (s.activeCabinets ?? s.cabCols * s.cabRows);
      }

      // 2. Fit DMX Lights to available stock
      if (Array.isArray(eng?.lights)) {
        const usedLights = {};
        const kept = eng.lights.filter((l, idx, lights) => {
          const cat = classifyFixture18(l, idx, lights.length);
          const sku = cat === 'beam' || cat === 'spot' ? 'fixture_beam_spot' : cat === 'wash' || cat === 'par' || cat === 'fresnel' ? 'fixture_wash_par' : 'fixture_barra_blinder';
          usedLights[sku] = (usedLights[sku] || 0) + 1;
          return usedLights[sku] <= availOf(sku);
        });
        if (kept.length !== eng.lights.length) {
          eng.lights = kept;
          eng.rebuildFixtures?.();
        }
      }

      // 3. Fit Audio Line Array & Subs to available stock
      const maxBoxesPerSide = Math.max(4, Math.floor(availOf('audio_line_array_box') / 2));
      if (lumiState.audioWorkstation18.boxesPerSide > maxBoxesPerSide) {
        lumiState.audioWorkstation18.boxesPerSide = maxBoxesPerSide;
      }
      const maxSubs = Math.max(2, availOf('audio_sub_218'));
      if (lumiState.audioWorkstation18.subCount > maxSubs) {
        lumiState.audioWorkstation18.subCount = maxSubs;
      }

      // 4. Fit Stage Deck modules to available stock
      const maxDecks = Math.max(4, availOf('deck_module_2x1'));
      const curStruct = computeModularDeckAndLayher18();
      if (curStruct.totalDeckModules > maxDecks) {
        lumiState.structureConfig18.catwalkType = 'none';
        lumiState.structureConfig18.deckWidthM = Math.max(4, Math.floor(Math.sqrt(maxDecks)) * 2);
        lumiState.structureConfig18.deckDepthM = Math.max(2, Math.floor(maxDecks / (lumiState.structureConfig18.deckWidthM / 2)));
      }

      window.renderUI?.();
      return computeWarehouseLogisticsAndShortage18();
    }

    function exportCrossRentCsv18({ download = false } = {}) {
      const report = computeWarehouseLogisticsAndShortage18();
      const rows = ['SKU,ItemName,Category,RequiredQty,OwnedQty,RMA_Locked,AvailableQty,ShortageToRent,Flightcases,Volume_m3,SubRentRate_USD,TotalSubRent_USD'];
      for (const it of report.items) {
        rows.push(
          `${it.sku},"${it.name.replace(/"/g, '""')}",${it.category},${it.required},${it.owned},${it.rma},${it.available},${it.shortage},${it.flightcases},${it.volumeM3.toFixed(2)},${it.unitSubRentUsd},${it.subRentUsd}`
        );
      }
      const csv = rows.join('\n');
      if (download && typeof window.downloadText === 'function') {
        window.downloadText('B2B_Cross_Rent_Order.csv', csv);
      }
      return csv;
    }

    function openWarehouseModal18() {
      if (typeof window.dialog !== 'function') return null;
      const report = computeWarehouseLogisticsAndShortage18();
      const itemRows = report.items
        .map(
          (it) =>
            `<tr>` +
            `<td><b>${esc18(it.name)}</b><br><small>${esc18(it.category)}</small></td>` +
            `<td>${it.required}</td>` +
            `<td><input type="number" min="0" max="999" value="${it.owned}" data-wh-owned="${esc18(it.sku)}" style="width:64px"></td>` +
            `<td><input type="number" min="0" max="${it.owned}" value="${it.rma}" data-wh-rma="${esc18(it.sku)}" style="width:56px"></td>` +
            `<td><b>${it.available}</b></td>` +
            `<td><b style="color:${it.shortage > 0 ? '#f59e0b' : '#10b981'}">${it.shortage > 0 ? '-' + it.shortage + ' ($' + it.subRentUsd + ')' : 'OK'}</b></td>` +
            `<td>${it.flightcases} cases (${it.volumeM3}m³)</td>` +
            `</tr>`
        )
        .join('');

      const html =
        `<div class="lmp-modal-grid18">` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">` +
        `<div><strong>${tr18('Kho Thiết Bị Thực Tế (My Warehouse), Bảo Trì RMA & Thuê Chéo B2B', 'My Warehouse Inventory, RMA Repair Lock & B2B Cross-Rent')}</strong><br>` +
        `<small>Flightcases: <b>${report.totalFlightcases}</b> · Volume: <b>${report.totalVolumeM3} m³</b> (${report.totalWeightKg} kg) · Truck: <b>${esc18(report.recommendedTruck)}</b> · Sub-Rent: <b>$${report.totalSubRentUsd}</b></small></div>` +
        `<div style="display:flex;gap:6px">` +
        `<button type="button" class="btn small primary" id="whFitStockBtn18">${tr18('Fit to My Stock', 'Fit to My Stock')}</button>` +
        `<button type="button" class="btn small" id="whExportCrossRentBtn18">B2B Cross-Rent CSV</button>` +
        `</div></div>` +
        `<div class="info-box" style="max-height:320px;overflow:auto">` +
        `<table class="bom-table" style="width:100%"><thead><tr><th>Equipment SKU</th><th>Req</th><th>Owned</th><th>RMA</th><th>Avail</th><th>Shortage</th><th>Logistics</th></tr></thead><tbody>${itemRows}</tbody></table>` +
        `</div></div>`;

      window.dialog(tr18('My Warehouse, RMA & B2B Cross-Rent', 'My Warehouse, RMA & B2B Cross-Rent'), html, [
        { label: tr18('Đóng', 'Close'), onClick: () => $('modal')?.close() }
      ]);

      $('whFitStockBtn18')?.addEventListener('click', () => {
        const fitted = fitStageToWarehouseStock18();
        window.toast?.(fitted.fullyInStock
          ? tr18('Đã co cấu hình sân khấu vừa tồn kho khả dụng.', 'Fitted stage configuration to available warehouse stock.')
          : tr18(`Đã co cấu hình; còn thiếu ${fitted.totalShortageUnits} thiết bị cần thuê thêm.`, `Configuration reduced; ${fitted.totalShortageUnits} units still require cross-rental.`));
        openWarehouseModal18();
      });
      $('whExportCrossRentBtn18')?.addEventListener('click', () => {
        exportCrossRentCsv18({ download: true });
        window.toast?.(tr18('Đã xuất đơn thuê chéo B2B Cross-Rent CSV.', 'Exported B2B Cross-Rent CSV.'));
      });
      $('modal')?.querySelectorAll?.('[data-wh-owned],[data-wh-rma]').forEach((inp) => {
        inp.addEventListener('change', () => {
          const sku = inp.getAttribute('data-wh-owned') || inp.getAttribute('data-wh-rma');
          const ownedEl = $('modal')?.querySelector?.(`[data-wh-owned="${sku}"]`);
          const rmaEl = $('modal')?.querySelector?.(`[data-wh-rma="${sku}"]`);
          setWarehouseRmaLock18(sku, Number(rmaEl?.value) || 0, Number(ownedEl?.value) || 0);
          openWarehouseModal18();
        });
      });
      return report;
    }

    // 5-Sheet Engineering Blueprint Pack (FRONT, TOP, SIDE, ISOMETRIC, STUDIO_RENDER with 1.75m human figure)
    const BLUEPRINT_VIEWS18 = ['FRONT', 'TOP', 'SIDE', 'ISOMETRIC', 'STUDIO_RENDER'];

    function renderEngineeringBlueprintSheet18(view = 'FRONT', targetCanvas = null, opts = {}) {
      const vUpper = String(view || 'FRONT').toUpperCase();
      const validView = BLUEPRINT_VIEWS18.includes(vUpper) ? vUpper : 'FRONT';
      const can = targetCanvas || document.createElement('canvas');
      can.width = Number(opts.width) || 1920;
      can.height = Number(opts.height) || 1080;
      const ctx = can.getContext?.('2d');
      if (!ctx) return { view: validView, width: can.width, height: can.height, humanHeightM: 1.75 };

      const w = can.width;
      const h = can.height;
      const isStudio = validView === 'STUDIO_RENDER';
      const struct = computeModularDeckAndLayher18();
      const rider = computeEngineeringRider(S.engine);

      // 1. Background & CAD Border / Studio Gradient
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = isStudio ? '#050811' : '#0a1222';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = isStudio ? '#1e293b' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(28, 28, w - 56, h - 56);

      // 2. Draw Engineering Grid & Stage Geometry Projection
      const cx = w * 0.48;
      const floorY = h * 0.72;
      const pxPerM = 72; // 1 meter = 72 pixels at 1920x1080

      ctx.strokeStyle = 'rgba(56,189,248,0.16)';
      ctx.lineWidth = 1;
      for (let gx = 80; gx < w - 80; gx += pxPerM) {
        ctx.beginPath();
        ctx.moveTo(gx, 60);
        ctx.lineTo(gx, h - 140);
        ctx.stroke();
      }
      for (let gy = 80; gy < h - 140; gy += pxPerM) {
        ctx.beginPath();
        ctx.moveTo(60, gy);
        ctx.lineTo(w - 60, gy);
        ctx.stroke();
      }

      // Stage Deck & Truss Silhouette per View
      const deckWpx = struct.deckWidthM * pxPerM;
      const deckDpx = struct.deckDepthM * pxPerM;
      const deckHpx = struct.deckHeightM * pxPerM;
      const trimHpx = 7.5 * pxPerM;

      ctx.strokeStyle = '#01ffa0';
      ctx.lineWidth = 2.5;
      if (validView === 'TOP') {
        ctx.strokeRect(cx - deckWpx * 0.5, h * 0.45 - deckDpx * 0.5, deckWpx, deckDpx);
      } else if (validView === 'SIDE') {
        ctx.strokeRect(cx - deckDpx * 0.5, floorY - deckHpx, deckDpx, deckHpx);
        ctx.strokeRect(cx - deckDpx * 0.5, floorY - trimHpx, deckDpx, 24);
      } else if (validView === 'ISOMETRIC') {
        ctx.beginPath();
        ctx.moveTo(cx, floorY - deckHpx - 110);
        ctx.lineTo(cx + deckWpx * 0.42, floorY - deckHpx);
        ctx.lineTo(cx, floorY - deckHpx + 110);
        ctx.lineTo(cx - deckWpx * 0.42, floorY - deckHpx);
        ctx.closePath();
        ctx.stroke();
      } else {
        // FRONT or STUDIO_RENDER
        ctx.strokeRect(cx - deckWpx * 0.5, floorY - deckHpx, deckWpx, deckHpx);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(cx - deckWpx * 0.48, floorY - trimHpx, deckWpx * 0.96, 26);
        // Main LED Wall
        ctx.fillStyle = isStudio ? 'rgba(0,212,255,0.24)' : 'rgba(192,132,252,0.18)';
        ctx.fillRect(cx - 4.5 * pxPerM, floorY - deckHpx - 4.5 * pxPerM, 9.0 * pxPerM, 4.5 * pxPerM);
        ctx.strokeRect(cx - 4.5 * pxPerM, floorY - deckHpx - 4.5 * pxPerM, 9.0 * pxPerM, 4.5 * pxPerM);
      }

      // 3. Draw 1.75m Human Scale Reference Silhouette (especially prominent on STUDIO_RENDER & FRONT/SIDE)
      const humanHeightM = 1.75;
      const humanPx = humanHeightM * pxPerM;
      const hx = cx + deckWpx * 0.32;
      const hyFoot = floorY - deckHpx;
      const hyHead = hyFoot - humanPx;
      ctx.strokeStyle = '#fbbf24';
      ctx.fillStyle = '#fbbf24';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(hx, hyHead + 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx, hyHead + 20);
      ctx.lineTo(hx, hyFoot - 42);
      ctx.moveTo(hx - 18, hyHead + 38);
      ctx.lineTo(hx + 18, hyHead + 38);
      ctx.moveTo(hx, hyFoot - 42);
      ctx.lineTo(hx - 14, hyFoot);
      ctx.moveTo(hx, hyFoot - 42);
      ctx.lineTo(hx + 14, hyFoot);
      ctx.stroke();
      ctx.fillText?.(`1.75m Human Scale`, hx + 18, hyHead + 24);

      // 4. ISO Engineering Title Block
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, h - 115, w - 80, 75);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(40, h - 115, w - 80, 75);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText?.(`SHEET: ${validView} | ${lumiState.brandIdentity?.brandName || 'ALPHA LED STUDIO'}`, 64, h - 80);
      ctx.font = '15px sans-serif';
      ctx.fillText?.(
        `Stage: ${struct.deckWidthM}x${struct.deckDepthM}x${struct.deckHeightM}m (${struct.deckMaterial.toUpperCase()}) | Total Weight: ${rider.totalWeightKg} kg | Power: ${rider.totalPowerMaxKw} kW | Scale: 1.75m Ref`,
        64,
        h - 54
      );

      let dataUrl = '';
      try {
        if (typeof can.toDataURL === 'function') dataUrl = can.toDataURL('image/png');
      } catch { /* ignore */ }

      return {
        view: validView,
        width: w,
        height: h,
        humanHeightM,
        stageDimensionsM: [struct.deckWidthM, struct.deckDepthM, struct.deckHeightM],
        dataUrl
      };
    }

    function exportEngineeringBlueprintPack18({ views = BLUEPRINT_VIEWS18, download = false } = {}) {
      const sheets = views.map((v) => renderEngineeringBlueprintSheet18(v));
      if (download && typeof document !== 'undefined') {
        for (const sh of sheets) {
          if (sh.dataUrl) {
            const a = document.createElement('a');
            a.href = sh.dataUrl;
            a.download = `Blueprint_${sh.view}_1920x1080.png`;
            a.click?.();
          }
        }
      }
      return {
        sheetCount: sheets.length,
        views: sheets.map((s) => s.view),
        sheets
      };
    }

    function openEngineeringBlueprintModal18(initialView = 'FRONT') {
      if (typeof window.dialog !== 'function') return null;
      const viewBtns = BLUEPRINT_VIEWS18.map(
        (v) => `<button type="button" class="btn small ${v === initialView ? 'primary' : ''}" data-bp-view="${v}">${v}</button>`
      ).join('');

      const html =
        `<div class="lmp-modal-grid18">` +
        `<div class="info-box" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">` +
        `<div style="display:flex;gap:6px;flex-wrap:wrap">${viewBtns}</div>` +
        `<button type="button" class="btn small primary" id="bpExportAll5Btn18">${tr18('Xuất Bộ 5 Bản Vẽ Kỹ Thuật (1920×1080)', 'Export All 5 Blueprints (1920×1080)')}</button>` +
        `</div>` +
        `<canvas id="bpPreviewCanvas18" width="1920" height="1080" style="width:100%;height:auto;max-height:420px;border-radius:8px;border:1px solid var(--border)"></canvas>` +
        `</div>`;

      window.dialog(tr18('Hồ Sơ Kỹ Thuật 5 Bản Vẽ Chuẩn (CAD Blueprints)', '5-Sheet Engineering Blueprint Dossier'), html, [
        { label: tr18('Đóng', 'Close'), onClick: () => $('modal')?.close() }
      ]);

      const can = $('bpPreviewCanvas18');
      const res = can ? renderEngineeringBlueprintSheet18(initialView, can) : null;
      $('modal')?.querySelectorAll?.('[data-bp-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
          openEngineeringBlueprintModal18(btn.getAttribute('data-bp-view'));
        });
      });
      $('bpExportAll5Btn18')?.addEventListener('click', () => {
        exportEngineeringBlueprintPack18({ download: true });
        window.toast?.(tr18('Đã xuất đủ 5 bản vẽ kỹ thuật (FRONT, TOP, SIDE, ISOMETRIC, STUDIO_RENDER).', 'Exported 5-sheet engineering blueprint dossier.'));
      });
      return res;
    }

    function computeLiveCaptureFitRect18(videoW, videoH, targetW, targetH, fitMode = 'cover') {
      const vw = Math.max(1, Number(videoW) || 1920);
      const vh = Math.max(1, Number(videoH) || 1080);
      const tw = Math.max(1, Number(targetW) || 1920);
      const th = Math.max(1, Number(targetH) || 1080);
      const mode = fitMode === 'contain' ? 'contain' : 'cover';
      const srcAspect = vw / vh;
      const dstAspect = tw / th;
      if (mode === 'contain') {
        let drawW = tw;
        let drawH = th;
        if (srcAspect > dstAspect) {
          drawH = Math.max(1, Math.round(tw / srcAspect));
        } else {
          drawW = Math.max(1, Math.round(th * srcAspect));
        }
        const padX = Math.max(0, Math.round((tw - drawW) * 0.5));
        const padY = Math.max(0, Math.round((th - drawH) * 0.5));
        return {
          mode: 'contain',
          cropX: 0,
          cropY: 0,
          cropW: vw,
          cropH: vh,
          drawX: padX,
          drawY: padY,
          drawW,
          drawH,
          padX,
          padY
        };
      }
      let cropW = vw;
      let cropH = vh;
      if (srcAspect > dstAspect) {
        cropW = Math.max(1, Math.round(vh * dstAspect));
      } else {
        cropH = Math.max(1, Math.round(vw / dstAspect));
      }
      const cropX = Math.max(0, Math.round((vw - cropW) * 0.5));
      const cropY = Math.max(0, Math.round((vh - cropH) * 0.5));
      return {
        mode: 'cover',
        cropX,
        cropY,
        cropW,
        cropH,
        drawX: 0,
        drawY: 0,
        drawW: tw,
        drawH: th,
        padX: 0,
        padY: 0
      };
    }

    // Live Screen / Window / Webcam / USB Capture Card onto 3D LED Screens
    async function startLiveScreenCapture18(opts = {}) {
      const cap = lumiState.screenCapture18;
      const sourceType = opts.sourceType === 'webcam' ? 'webcam' : 'screen';
      const fitMode = opts.fitMode === 'contain' ? 'contain' : 'cover';
      let stream = opts.mockStream || null;
      if (!stream) {
        const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
        if (sourceType === 'webcam') {
          if (!md || typeof md.getUserMedia !== 'function') {
            window.toast?.(tr18('Trình duyệt không hỗ trợ getUserMedia (Webcam/Capture Card).', 'Browser does not support getUserMedia.'), 3500, 'warn');
            return { active: false, sourceType, fitMode, reason: 'unsupported' };
          }
          try {
            const videoConstraint = opts.deviceId
              ? { deviceId: { exact: String(opts.deviceId) }, width: { ideal: 1920 }, height: { ideal: 1080 } }
              : { width: { ideal: 1920 }, height: { ideal: 1080 } };
            stream = await md.getUserMedia({ video: videoConstraint, audio: false });
          } catch (err) {
            window.toast?.(tr18('Không thể mở Webcam / Capture Card: ', 'Webcam capture unavailable: ') + err.message, 3500, 'warn');
            return { active: cap.active, sourceType, fitMode, reason: err.name || 'webcam-failed' };
          }
        } else {
          if (!md || typeof md.getDisplayMedia !== 'function') {
            window.toast?.(tr18('Trình duyệt hiện tại không hỗ trợ getDisplayMedia.', 'Browser does not support getDisplayMedia.'), 3500, 'warn');
            return { active: false, sourceType, fitMode, reason: 'unsupported' };
          }
          try {
            stream = await md.getDisplayMedia({ video: { frameRate: { ideal: 30, max: 60 } }, audio: false });
          } catch (err) {
            window.toast?.(tr18('Không thể bắt màn hình: ', 'Screen capture unavailable: ') + err.message, 3500, 'warn');
            return { active: cap.active, sourceType, fitMode, reason: err.name || 'capture-failed' };
          }
        }
      }

      stopLiveScreenCapture18();

      const videoEl = opts.videoEl || (typeof document !== 'undefined' ? document.createElement('video') : {});
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.srcObject = stream;
      window.attachVideoElement?.(videoEl);
      try {
        await videoEl.play?.();
      } catch { /* ignore autoplay in headless */ }

      cap.active = true;
      cap.sourceType = sourceType;
      cap.fitMode = fitMode;
      cap.deviceId = String(opts.deviceId || '');
      cap.stream = stream;
      cap.videoEl = videoEl;
      cap.startedAtMs = nowMs18();
      cap.frameCount = (cap.frameCount || 0) + 1;

      if (typeof stream.getVideoTracks === 'function') {
        const firstTrack = stream.getVideoTracks()[0];
        if (firstTrack) {
          firstTrack.onended = () => { if (cap.stream === stream) stopLiveScreenCapture18(); };
        }
      }
      renderLmpToolbox18();
      ensureLiveShowLoop18();
      window.toast?.(tr18('Đang truyền trực tiếp tín hiệu hình ảnh lên tường LED 3D.', 'Streaming live video capture onto 3D LED walls.'));
      return { active: true, sourceType, fitMode, stream, videoEl };
    }

    const PAR_ATMOSPHERE_PRESETS18 = {
      wedding_gold: { id: 'wedding_gold', labelVi: 'Tiệc Cưới Vàng Ấm & Trắng Ngọc', labelEn: 'Wedding Warm Gold & Pearl', colors: ['#ffd166', '#fff3b0', '#f4a261'] },
      gala_pink_cyan: { id: 'gala_pink_cyan', labelVi: 'Gala Hồng Magenta & Xanh Cyan', labelEn: 'Gala Magenta & Cyan', colors: ['#ff007f', '#00f0ff', '#c084fc'] },
      corporate_blue: { id: 'corporate_blue', labelVi: 'Hội Nghị Xanh Royal & Trắng Lạnh', labelEn: 'Corporate Royal Blue & Ice', colors: ['#0077ff', '#38bdf8', '#e0f2fe'] },
      emerald_gold: { id: 'emerald_gold', labelVi: 'Ngọc Lục Bảo & Vàng Hoàng Gia', labelEn: 'Emerald & Imperial Gold', colors: ['#01ffa0', '#10b981', '#fbbf24'] },
      sunset_lounge: { id: 'sunset_lounge', labelVi: 'Hoàng Hôn Cam Đỏ & Tím Trầm', labelEn: 'Sunset Amber & Deep Violet', colors: ['#ff5500', '#fb923c', '#8b5cf6'] }
    };

    function deployParWallContour18({ layout = 'u_contour_3wall', presetId = 'wedding_gold', countPerWall = 6, autoSnapWalls = true, recordUndo = true } = {}) {
      if (recordUndo !== false) window.checkpoint?.();
      const eng = S.engine;
      const preset = PAR_ATMOSPHERE_PRESETS18[presetId] || PAR_ATMOSPHERE_PRESETS18.wedding_gold;
      const perWall = clamp18(Math.round(Number(countPerWall) || 6), 2, 16);
      const cfg = lumiState.structureConfig18 || {};
      const deckW = Number(cfg.deckWidthM) || 14;
      const deckD = Number(cfg.deckDepthM) || 8;
      const hallW = autoSnapWalls ? Math.max(24, deckW + 12) : deckW + 4;
      const backZ = autoSnapWalls ? -deckD * 0.5 - 2.2 : -deckD * 0.5;
      const frontZ = autoSnapWalls ? deckD * 0.5 + 8.0 : deckD * 0.5 + 2.0;
      const halfW = hallW * 0.5 - 0.35;

      if (Array.isArray(eng?.lights)) {
        eng.lights = eng.lights.filter((l) => !l || !l._parContour18);
      }

      const fixtures = [];
      const pushPar = (wallTag, idxOnWall, pos, target, globalIdx) => {
        if (Array.isArray(eng?.lights) && eng.lights.length >= 128) return;
        const color = preset.colors[globalIdx % preset.colors.length];
        const fx = {
          id: `par_u_${wallTag}_${idxOnWall + 1}`,
          name: `PAR U-${wallTag.toUpperCase()}-${idxOnWall + 1}`,
          type: 'par',
          dmxGroup18: 'G4',
          wall: wallTag,
          pos: pos.map((v) => +Number(v).toFixed(2)),
          target: target.map((v) => +Number(v).toFixed(2)),
          color,
          power: 4.2,
          angle: 16,
          enabled: true,
          sweep: false,
          fx: 'steady',
          origin: 'placed',
          fixtureSize: [0.26, 0.28, 0.26],
          aperture: 0.03,
          _parContour18: true,
          _parPresetId18: preset.id
        };
        fixtures.push(fx);
        if (Array.isArray(eng?.lights)) {
          eng.lights.push(fx);
        }
      };

      let gIdx = 0;
      for (let i = 0; i < perWall; i++) {
        const t = perWall === 1 ? 0.5 : i / (perWall - 1);
        const z = backZ + 1.0 + t * (frontZ - backZ - 2.0);
        pushPar('left', i, [-halfW, 0.25, z], [-halfW + 0.15, 6.5, z], gIdx++);
      }
      for (let i = 0; i < perWall; i++) {
        const t = perWall === 1 ? 0.5 : i / (perWall - 1);
        const x = -halfW + 1.2 + t * (hallW - 2.4);
        pushPar('back', i, [x, 0.25, backZ], [x, 6.5, backZ + 0.15], gIdx++);
      }
      if (layout === 'u_contour_3wall') {
        for (let i = 0; i < perWall; i++) {
          const t = perWall === 1 ? 0.5 : i / (perWall - 1);
          const z = backZ + 1.0 + t * (frontZ - backZ - 2.0);
          pushPar('right', i, [halfW, 0.25, z], [halfW - 0.15, 6.5, z], gIdx++);
        }
      }

      eng?.rebuildFixtures?.();
      if (eng) eng._stageBatchDirty = true;
      Object.assign(fixtures, {
        layout,
        presetId: preset.id,
        countPerWall: perWall,
        totalAdded: fixtures.length,
        fixtures
      });
      return fixtures;
    }

    function attachFixturesToTruss18({ trussId, fixtureKind = 'beam', count = 6, zoomDeg = 25, panDeg = 0, tiltDeg = -15, recordUndo = true } = {}) {
      if (recordUndo !== false) window.checkpoint?.();
      const sa = S.stageAssets16;
      const eng = S.engine;
      const items = Array.isArray(sa?.items) ? sa.items : [];
      const truss = items.find((it) => it && it.id === trussId) || items[0] || { id: trussId || 'truss_default', kind: 'truss_straight_6m', pos: [0, 6.8, -1.5], rot: [0, 0, 0], scale: 1 };
      const resolvedTrussId = trussId || truss.id;
      const normKind = fixtureKind === 'beams' ? 'beam' : (fixtureKind || 'beam');
      const n = clamp18(Math.round(Number(count) || 6), 1, 24);
      const zDeg = clamp18(Number(zoomDeg) || 25, 2, 60);
      const pRad = ((Number(panDeg) || 0) * Math.PI) / 180;
      const tRad = ((Number(tiltDeg) || -15) * Math.PI) / 180;
      const tPos = Array.isArray(truss.pos) ? truss.pos : [0, 6.8, -1.5];
      const scale = Math.max(0.2, Number(truss.scale) || 1);
      const kindStr = String(truss.kind || truss.type || resolvedTrussId || '').toLowerCase();
      const isCircle = kindStr.includes('ring') || kindStr.includes('circle') || kindStr.includes('circular');

      if (Array.isArray(eng?.lights)) {
        eng.lights = eng.lights.filter((l) => !l || l.parentTrussId !== resolvedTrussId);
      }

      const fixtures = [];
      for (let i = 0; i < n; i++) {
        if (Array.isArray(eng?.lights) && eng.lights.length >= 128) break;
        let fxPos;
        if (isCircle) {
          const radius = 2.0 * scale;
          const theta = (i / n) * Math.PI * 2;
          fxPos = [
            +(tPos[0] + Math.cos(theta) * radius).toFixed(3),
            +(tPos[1] - 0.22).toFixed(3),
            +(tPos[2] + Math.sin(theta) * radius).toFixed(3)
          ];
        } else {
          const spanM = 6.0 * scale;
          const u = n === 1 ? 0 : (i / (n - 1) - 0.5) * (spanM * 0.88);
          const yaw = ((Number(truss.rot?.[1]) || 0) * Math.PI) / 180;
          fxPos = [
            +(tPos[0] + Math.cos(yaw) * u).toFixed(3),
            +(tPos[1] - 0.22).toFixed(3),
            +(tPos[2] - Math.sin(yaw) * u).toFixed(3)
          ];
        }
        const throwLen = 7.5;
        const dx = Math.sin(pRad) * Math.sin(Math.abs(tRad)) * throwLen;
        const dy = -Math.cos(tRad) * throwLen;
        const dz = Math.cos(pRad) * Math.sin(Math.abs(tRad)) * (-throwLen);
        const target = [
          +(fxPos[0] + dx).toFixed(3),
          +Math.max(0, fxPos[1] + dy).toFixed(3),
          +(fxPos[2] - dz).toFixed(3)
        ];
        const fx = {
          id: `truss_fx_${resolvedTrussId}_${i + 1}`,
          name: `${normKind.toUpperCase()} #${i + 1} (@${resolvedTrussId})`,
          type: normKind,
          trussId: resolvedTrussId,
          parentTrussId: resolvedTrussId,
          pos: fxPos,
          target,
          color: '#00d4ff',
          power: 5.5,
          angle: zDeg,
          zoomDeg: zDeg,
          panDeg: Number(panDeg) || 0,
          tiltDeg: Number(tiltDeg) || -15,
          enabled: true,
          sweep: false,
          fx: 'steady',
          origin: 'placed',
          fixtureSize: [0.3, 0.38, 0.3],
          aperture: 0.03
        };
        fixtures.push(fx);
        if (Array.isArray(eng?.lights)) {
          eng.lights.push(fx);
        }
      }
      eng?.rebuildFixtures?.();
      if (eng) eng._stageBatchDirty = true;
      Object.assign(fixtures, {
        trussId: resolvedTrussId,
        isCircularTruss: isCircle,
        fixtureKind: normKind,
        attachedCount: fixtures.length,
        fixtures
      });
      return fixtures;
    }

    function stopLiveScreenCapture18() {
      const cap = lumiState.screenCapture18;
      if (cap.stream && typeof cap.stream.getTracks === 'function') {
        cap.stream.getTracks().forEach((t) => t.stop?.());
      }
      cap.active = false;
      cap.stream = null;
      const eng = S.engine;
      const video = cap.videoEl;
      if (video) {
        video.pause?.();
        video.srcObject = null;
        video.remove?.();
        const tex = eng?.texCache?.get(video);
        if (tex) {
          if (tex.callback != null) video.cancelVideoFrameCallback?.(tex.callback);
          eng.gl.deleteTexture(tex.tex);
          eng.texCache.delete(video);
        }
      }
      cap.videoEl = null;
      renderLmpToolbox18();
      return { active: false };
    }

    const LMP_TOOL_COLORS18 = {
      platform: '#10b981',
      layher: '#f59e0b',
      stairs: '#14b8a6',
      straight_truss: '#38bdf8',
      vertical_truss: '#60a5fa',
      circular_truss: '#a78bfa',
      line_array: '#fb923c',
      sub_stack: '#f472b6',
      dj_booth: '#e879f9',
      foh_booth: '#22d3ee',
      podium: '#fbbf24',
      live_band: '#fb7185',
      beams: '#00d4ff',
      spot: '#c084fc',
      wash: '#f472b6',
      par: '#01ffa0',
      barra: '#fb923c',
      blinders: '#fbbf24',
      strobe: '#38bdf8',
      fresnel: '#f59e0b',
      lasers: '#10b981',
      sparkular: '#fbbf24',
      co2_jets: '#38bdf8',
      flames: '#ff5500',
      hazer: '#2dd4bf',
      aerial_pyro: '#f472b6',
      main_wall: '#c084fc',
      side_wings: '#00d4ff',
      header: '#01ffa0',
      curved: '#f472b6',
      l_corner_90: '#fbbf24',
      cube: '#60a5fa',
      cylinder_360: '#2dd4bf',
      pixel_map_2d: '#fb923c'
    };

    function lmpToolColor18(key) {
      return LMP_TOOL_COLORS18[key] || '#38bdf8';
    }

    function lmpToolSvg18(key) {
      switch (key) {
        case 'platform':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="14,5 25,10.5 14,16 3,10.5" fill="rgba(16,185,129,0.22)" stroke="#10b981" stroke-width="1.6"/><polyline points="3,10.5 3,16 14,21.5 25,16 25,10.5" fill="none" stroke="#34d399" stroke-width="1.5"/><line x1="6" y1="17.5" x2="6" y2="23" stroke="#38bdf8" stroke-width="1.6"/><line x1="14" y1="21.5" x2="14" y2="25" stroke="#38bdf8" stroke-width="1.6"/><line x1="22" y1="17.5" x2="22" y2="23" stroke="#38bdf8" stroke-width="1.6"/></svg>`;
        case 'layher':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="4" width="20" height="19" rx="1.5" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" stroke-width="1.7"/><line x1="14" y1="4" x2="14" y2="23" stroke="#fbbf24" stroke-width="1.4"/><line x1="4" y1="13.5" x2="24" y2="13.5" stroke="#fbbf24" stroke-width="1.4"/><line x1="4" y1="13.5" x2="14" y2="4" stroke="#38bdf8" stroke-width="1.2"/><line x1="14" y1="23" x2="24" y2="13.5" stroke="#38bdf8" stroke-width="1.2"/><circle cx="4" cy="23" r="1.8" fill="#ef4444"/><circle cx="14" cy="23" r="1.8" fill="#ef4444"/><circle cx="24" cy="23" r="1.8" fill="#ef4444"/></svg>`;
        case 'stairs':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><path d="M4,22 L4,18 L9,18 L9,14 L14,14 L14,10 L19,10 L19,6 L24,6 L24,22 Z" fill="rgba(20,184,166,0.22)" stroke="#14b8a6" stroke-width="1.6" stroke-linejoin="round"/><line x1="4" y1="14" x2="17" y2="4" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/></svg>`;
        case 'straight_truss':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="2.5" y="9" width="23" height="10" rx="1.5" fill="rgba(56,189,248,0.14)" stroke="#38bdf8" stroke-width="1.6"/><polyline points="3,18.5 8,9.5 13,18.5 18,9.5 23,18.5 25,14" fill="none" stroke="#01ffa0" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
        case 'vertical_truss':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="9.5" y="3" width="9" height="20" rx="1.2" fill="rgba(96,165,250,0.14)" stroke="#60a5fa" stroke-width="1.6"/><polyline points="10,4 18,8.5 10,13 18,17.5 10,22" fill="none" stroke="#c084fc" stroke-width="1.3" stroke-linejoin="round"/><line x1="6" y1="24" x2="22" y2="24" stroke="#ff9900" stroke-width="2.2" stroke-linecap="round"/></svg>`;
        case 'circular_truss':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="10" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" stroke-width="1.8"/><circle cx="14" cy="14" r="6.5" fill="none" stroke="#22d3ee" stroke-width="1.4" stroke-dasharray="2.5 2"/></svg>`;
        case 'line_array':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><line x1="8" y1="3.5" x2="20" y2="3.5" stroke="#fb923c" stroke-width="2.2" stroke-linecap="round"/><rect x="9" y="6" width="10" height="3.2" rx="1" fill="rgba(251,146,60,0.22)" stroke="#fb923c" stroke-width="1.3"/><rect x="9.2" y="10.2" width="10" height="3.2" rx="1" fill="rgba(251,191,36,0.22)" stroke="#fbbf24" stroke-width="1.3"/><rect x="9.8" y="14.4" width="9.8" height="3.2" rx="1" transform="rotate(6 14 16)" fill="rgba(56,189,248,0.22)" stroke="#38bdf8" stroke-width="1.3"/><rect x="10.5" y="18.6" width="9.5" height="3.2" rx="1" transform="rotate(14 15 20)" fill="rgba(1,255,160,0.22)" stroke="#01ffa0" stroke-width="1.3"/></svg>`;
        case 'sub_stack':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="8" width="9" height="15" rx="1.5" fill="rgba(244,114,182,0.16)" stroke="#f472b6" stroke-width="1.5"/><rect x="15" y="8" width="9" height="15" rx="1.5" fill="rgba(244,114,182,0.16)" stroke="#f472b6" stroke-width="1.5"/><circle cx="8.5" cy="13" r="2.2" stroke="#fbbf24" stroke-width="1.4" fill="none"/><circle cx="8.5" cy="18.5" r="2.2" stroke="#38bdf8" stroke-width="1.4" fill="none"/><circle cx="19.5" cy="13" r="2.2" stroke="#fbbf24" stroke-width="1.4" fill="none"/><circle cx="19.5" cy="18.5" r="2.2" stroke="#38bdf8" stroke-width="1.4" fill="none"/></svg>`;
        case 'dj_booth':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="3,13 25,13 22.5,23 5.5,23" fill="rgba(232,121,249,0.18)" stroke="#e879f9" stroke-width="1.6"/><circle cx="9.5" cy="9.5" r="2.6" fill="none" stroke="#00d4ff" stroke-width="1.5"/><circle cx="18.5" cy="9.5" r="2.6" fill="none" stroke="#00d4ff" stroke-width="1.5"/><rect x="12.6" y="7.5" width="2.8" height="4" rx="0.6" fill="#fbbf24"/></svg>`;
        case 'foh_booth':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="15" width="20" height="8" rx="1.5" fill="rgba(34,211,238,0.16)" stroke="#22d3ee" stroke-width="1.5"/><rect x="6" y="7" width="7" height="5.5" rx="1" fill="rgba(1,255,160,0.22)" stroke="#01ffa0" stroke-width="1.4"/><rect x="15" y="7" width="7" height="5.5" rx="1" fill="rgba(244,114,182,0.22)" stroke="#f472b6" stroke-width="1.4"/><line x1="8" y1="18" x2="20" y2="18" stroke="#fbbf24" stroke-width="1.6"/></svg>`;
        case 'podium':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="8,9 20,9 18,12 10,12" fill="rgba(251,191,36,0.24)" stroke="#fbbf24" stroke-width="1.5"/><rect x="10.5" y="12" width="7" height="10" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" stroke-width="1.5"/><line x1="7" y1="22.5" x2="21" y2="22.5" stroke="#2dd4bf" stroke-width="1.8" stroke-linecap="round"/><path d="M12,9 Q10,5 8.5,5.5" fill="none" stroke="#fb7185" stroke-width="1.4"/><path d="M16,9 Q18,5 19.5,5.5" fill="none" stroke="#fb7185" stroke-width="1.4"/></svg>`;
        case 'live_band':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="18" r="4.5" fill="rgba(251,113,133,0.22)" stroke="#fb7185" stroke-width="1.6"/><circle cx="8" cy="13" r="2.6" fill="none" stroke="#38bdf8" stroke-width="1.5"/><circle cx="20" cy="13" r="2.6" fill="none" stroke="#38bdf8" stroke-width="1.5"/><ellipse cx="6.5" cy="7.5" rx="3" ry="1" fill="none" stroke="#fbbf24" stroke-width="1.5"/><ellipse cx="21.5" cy="7.5" rx="3" ry="1" fill="none" stroke="#fbbf24" stroke-width="1.5"/></svg>`;
        case 'beams':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="11.5,11 16.5,11 22,25 6,25" fill="rgba(0,212,255,0.24)"/><rect x="9" y="3" width="10" height="3" rx="1" fill="#64748b"/><path d="M8,6 L8,12 A6,6 0 0,0 20,12 L20,6" fill="none" stroke="#94a3b8" stroke-width="1.6"/><rect x="10.5" y="7" width="7" height="6" rx="2" fill="#00d4ff" stroke="#e0f2fe" stroke-width="1.2"/></svg>`;
        case 'spot':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="11,11 17,11 24,25 4,25" fill="rgba(192,132,252,0.24)"/><line x1="14" y1="12" x2="9" y2="24" stroke="#c084fc" stroke-width="1.2" stroke-dasharray="2 1.5"/><line x1="14" y1="12" x2="14" y2="25" stroke="#fbbf24" stroke-width="1.3"/><line x1="14" y1="12" x2="19" y2="24" stroke="#c084fc" stroke-width="1.2" stroke-dasharray="2 1.5"/><rect x="9" y="3" width="10" height="3" rx="1" fill="#64748b"/><rect x="10" y="6.5" width="8" height="6.5" rx="2" fill="#c084fc" stroke="#f3e8ff" stroke-width="1.2"/></svg>`;
        case 'wash':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="9,12 19,12 26,25 2,25" fill="rgba(244,114,182,0.24)"/><ellipse cx="14" cy="9.5" rx="5.5" ry="4.5" fill="rgba(244,114,182,0.22)" stroke="#f472b6" stroke-width="1.6"/><circle cx="14" cy="9.5" r="2.4" fill="#38bdf8"/></svg>`;
        case 'par':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="9.5" fill="rgba(1,255,160,0.14)" stroke="#01ffa0" stroke-width="1.6"/><circle cx="14" cy="9.5" r="1.5" fill="#ff007f"/><circle cx="9.8" cy="13" r="1.5" fill="#01ffa0"/><circle cx="18.2" cy="13" r="1.5" fill="#00d4ff"/><circle cx="11.4" cy="17.5" r="1.5" fill="#fbbf24"/><circle cx="16.6" cy="17.5" r="1.5" fill="#c084fc"/><circle cx="14" cy="14" r="1.6" fill="#ffffff"/></svg>`;
        case 'barra':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="3,13 25,13 27,24 1,24" fill="rgba(251,146,60,0.18)"/><rect x="2.5" y="8" width="23" height="5.5" rx="1.5" fill="#0f172a" stroke="#fb923c" stroke-width="1.5"/><circle cx="6" cy="10.8" r="1.3" fill="#ff007f"/><circle cx="10" cy="10.8" r="1.3" fill="#ff9900"/><circle cx="14" cy="10.8" r="1.3" fill="#01ffa0"/><circle cx="18" cy="10.8" r="1.3" fill="#00d4ff"/><circle cx="22" cy="10.8" r="1.3" fill="#c084fc"/></svg>`;
        case 'blinders':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="4.5" y="4.5" width="19" height="19" rx="3" fill="rgba(251,191,36,0.16)" stroke="#fbbf24" stroke-width="1.6"/><circle cx="10" cy="10" r="3" fill="#fde047" stroke="#f59e0b" stroke-width="1"/><circle cx="18" cy="10" r="3" fill="#fde047" stroke="#f59e0b" stroke-width="1"/><circle cx="10" cy="18" r="3" fill="#fde047" stroke="#f59e0b" stroke-width="1"/><circle cx="18" cy="18" r="3" fill="#fde047" stroke="#f59e0b" stroke-width="1"/></svg>`;
        case 'strobe':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="7" width="21" height="14" rx="2.5" fill="rgba(56,189,248,0.16)" stroke="#38bdf8" stroke-width="1.6"/><rect x="6" y="12.2" width="16" height="3.6" rx="1" fill="#e0f2fe"/><polygon points="15,4 11,13 14.5,13 12.5,24 18,14 14.2,14" fill="#fbbf24"/></svg>`;
        case 'fresnel':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="4,6 9,10 9,18 4,22" fill="rgba(245,158,11,0.24)" stroke="#f59e0b" stroke-width="1.4"/><polygon points="24,6 19,10 19,18 24,22" fill="rgba(245,158,11,0.24)" stroke="#f59e0b" stroke-width="1.4"/><rect x="9" y="8.5" width="10" height="11" rx="2" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/><circle cx="14" cy="14" r="3.2" fill="#fde68a"/></svg>`;
        case 'lasers':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="9" y="3.5" width="10" height="5" rx="1.2" fill="#1e293b" stroke="#10b981" stroke-width="1.5"/><line x1="14" y1="8.5" x2="3" y2="24" stroke="#01ffa0" stroke-width="1.5"/><line x1="14" y1="8.5" x2="8.5" y2="25" stroke="#00d4ff" stroke-width="1.4"/><line x1="14" y1="8.5" x2="14" y2="25.5" stroke="#ff007f" stroke-width="1.5"/><line x1="14" y1="8.5" x2="19.5" y2="25" stroke="#fbbf24" stroke-width="1.4"/><line x1="14" y1="8.5" x2="25" y2="24" stroke="#01ffa0" stroke-width="1.5"/></svg>`;
        case 'sparkular':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="9" y="20" width="10" height="5" rx="1.2" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/><path d="M14,20 L14,5 M14,17 L8,7 M14,17 L20,7 M14,14 L5,11 M14,14 L23,11" stroke="#fde047" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="5.5" r="1.3" fill="#ff9900"/><circle cx="14" cy="3.5" r="1.4" fill="#ffffff"/><circle cx="20" cy="5.5" r="1.3" fill="#ff9900"/></svg>`;
        case 'co2_jets':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="10" y="20" width="8" height="5" rx="1.2" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/><path d="M11,19 C7,14 8,7 14,4 C20,7 21,14 17,19 Z" fill="rgba(56,189,248,0.28)" stroke="#e0f2fe" stroke-width="1.5"/></svg>`;
        case 'flames':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="9.5" y="20.5" width="9" height="4.5" rx="1.2" fill="#1e293b" stroke="#ff5500" stroke-width="1.5"/><path d="M14,3.5 C19,9 21,14 17.5,19.5 C16,20.5 12,20.5 10.5,19.5 C7,14 9,9 14,3.5 Z" fill="rgba(255,85,0,0.32)" stroke="#ff9900" stroke-width="1.6"/><path d="M14,9 C16.5,12.5 17,16 14,19.5 C11,16 11.5,12.5 14,9 Z" fill="#fde047"/></svg>`;
        case 'hazer':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="13" width="11" height="9" rx="1.8" fill="rgba(45,212,191,0.18)" stroke="#2dd4bf" stroke-width="1.6"/><path d="M17,14 Q20,12 23,14 T26,14" fill="none" stroke="#2dd4bf" stroke-width="1.6" stroke-linecap="round"/><path d="M17,18 Q20,16 23,18 T26,18" fill="none" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round"/><path d="M16,10 Q19,8 22,10" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-linecap="round"/></svg>`;
        case 'aerial_pyro':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="13" r="2.2" fill="#fde047"/><path d="M14,3 L14,8 M14,18 L14,23 M4,13 L9,13 M19,13 L24,13 M7,6 L10.5,9.5 M17.5,16.5 L21,20 M21,6 L17.5,9.5 M10.5,16.5 L7,20" stroke="#f472b6" stroke-width="1.6" stroke-linecap="round"/><circle cx="14" cy="3" r="1.4" fill="#ff007f"/><circle cx="24" cy="13" r="1.4" fill="#00d4ff"/><circle cx="4" cy="13" r="1.4" fill="#01ffa0"/><circle cx="14" cy="23" r="1.4" fill="#c084fc"/></svg>`;
        case 'main_wall':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="6" width="22" height="15" rx="1.8" fill="rgba(192,132,252,0.22)" stroke="#c084fc" stroke-width="1.6"/><line x1="10.3" y1="6" x2="10.3" y2="21" stroke="#00d4ff" stroke-width="1.1"/><line x1="17.6" y1="6" x2="17.6" y2="21" stroke="#00d4ff" stroke-width="1.1"/><line x1="3" y1="13.5" x2="25" y2="13.5" stroke="#00d4ff" stroke-width="1.1"/></svg>`;
        case 'side_wings':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="2.5,7 8.5,9 8.5,21 2.5,19" fill="rgba(0,212,255,0.24)" stroke="#00d4ff" stroke-width="1.5"/><rect x="10" y="8" width="8" height="12" rx="1" fill="rgba(192,132,252,0.16)" stroke="#c084fc" stroke-width="1.4"/><polygon points="25.5,7 19.5,9 19.5,21 25.5,19" fill="rgba(0,212,255,0.24)" stroke="#00d4ff" stroke-width="1.5"/></svg>`;
        case 'header':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="2.5" y="5.5" width="23" height="5.5" rx="1.2" fill="rgba(1,255,160,0.24)" stroke="#01ffa0" stroke-width="1.6"/><rect x="6" y="13" width="16" height="10" rx="1.2" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="2 2"/></svg>`;
        case 'curved':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><path d="M3,7 Q14,12 25,7 L25,19 Q14,24 3,19 Z" fill="rgba(244,114,182,0.22)" stroke="#f472b6" stroke-width="1.6"/><path d="M10,8.8 L10,20.8 M18,8.8 L18,20.8" stroke="#38bdf8" stroke-width="1.2"/></svg>`;
        case 'l_corner_90':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="4,8 14,4 14,18 4,22" fill="rgba(251,191,36,0.24)" stroke="#fbbf24" stroke-width="1.6"/><polygon points="14,4 24,8 24,22 14,18" fill="rgba(0,212,255,0.22)" stroke="#00d4ff" stroke-width="1.6"/></svg>`;
        case 'cube':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><polygon points="14,3.5 24,8.5 14,13.5 4,8.5" fill="rgba(1,255,160,0.24)" stroke="#01ffa0" stroke-width="1.5"/><polygon points="4,8.5 14,13.5 14,24 4,19" fill="rgba(192,132,252,0.24)" stroke="#c084fc" stroke-width="1.5"/><polygon points="14,13.5 24,8.5 24,19 14,24" fill="rgba(96,165,250,0.24)" stroke="#60a5fa" stroke-width="1.5"/></svg>`;
        case 'cylinder_360':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><ellipse cx="14" cy="8" rx="9.5" ry="3.8" fill="rgba(45,212,191,0.22)" stroke="#2dd4bf" stroke-width="1.5"/><path d="M4.5,8 L4.5,19 A9.5,3.8 0 0,0 23.5,19 L23.5,8" fill="rgba(192,132,252,0.18)" stroke="#2dd4bf" stroke-width="1.6"/><ellipse cx="14" cy="19" rx="9.5" ry="3.8" fill="none" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="2.5 2"/></svg>`;
        case 'pixel_map_2d':
          return `<svg class="lmp-tb-svg18" viewBox="0 0 28 28" aria-hidden="true"><rect x="3.5" y="5" width="21" height="18" rx="2" fill="#0f172a" stroke="#fb923c" stroke-width="1.6"/><rect x="6" y="7.5" width="7" height="6" fill="#01ffa0"/><rect x="15" y="7.5" width="7" height="6" fill="#00d4ff"/><rect x="6" y="15" width="7" height="5.5" fill="#fbbf24"/><rect x="15" y="15" width="7" height="5.5" fill="#f472b6"/></svg>`;
        default:
          return ico18('box');
      }
    }

    function renderLmpToolbox18() {
      const box = $('lmpToolbox18');
      if (!box) return;
      box.classList.toggle('is-collapsed', lmpCollapsed18);
      box.setAttribute('data-active-cat', lmpActiveTab18);
      const eng = S.engine;
      const sa = S.stageAssets16;
      const ls = liveShow18;
      const items = Array.isArray(sa?.items) ? sa.items : [];
      const sfxSet = new Set(['cold_spark_fountain', 'co2_jet', 'flame_jet', 'confetti_cannon', 'haze_machine_pro']);
      const pyroCount = items.filter((it) => sfxSet.has(normalizeSfxType18(it.kind || it.type))).length;
      const structCount = items.length - pyroCount + (eng?.stage?.length ? 1 : 0);
      const lightCount = Array.isArray(eng?.lights) ? eng.lights.length : 0;
      const screenCount = Array.isArray(eng?.surfaces) ? eng.surfaces.length : 0;

      const tabMeta = {
        sets: {
          ico: 'crown',
          short: tr18('Mẫu S1–6', 'Sets S1–6'),
          title: tr18('Mẫu Sân khấu (S1–S6)', 'Stage Sets (S1–S6)'),
          badge: `S${ls.activeShow || 1}`,
          color: '#fbbf24',
          bgTint: 'rgba(251, 191, 36, 0.12)',
          borderTint: 'rgba(251, 191, 36, 0.36)'
        },
        structure: {
          ico: 'box',
          short: tr18('Kết cấu', 'Structure'),
          title: tr18('Khung & Âm thanh', 'Structures & Audio'),
          badge: `${structCount} ${tr18('đang bật', 'active')}`,
          color: '#01ffa0',
          bgTint: 'rgba(1, 255, 160, 0.10)',
          borderTint: 'rgba(1, 255, 160, 0.32)'
        },
        lighting: {
          ico: 'moving-head',
          short: tr18('Ánh sáng', 'Lighting'),
          title: tr18('Đèn Sân khấu DMX', 'DMX Lighting'),
          badge: `${lightCount} ${tr18('đang bật', 'active')}`,
          color: '#00d4ff',
          bgTint: 'rgba(0, 212, 255, 0.10)',
          borderTint: 'rgba(0, 212, 255, 0.32)'
        },
        pyro: {
          ico: 'sparkles',
          short: tr18('Pháo SFX', 'Pyro & SFX'),
          title: tr18('Pháo & Hiệu ứng SFX', 'Pyrotechnics & SFX'),
          badge: `${pyroCount} ${tr18('đang bật', 'active')}`,
          color: '#ff9900',
          bgTint: 'rgba(255, 153, 0, 0.12)',
          borderTint: 'rgba(255, 153, 0, 0.36)'
        },
        screens: {
          ico: 'matrix',
          short: tr18('Màn LED', 'Screens'),
          title: tr18('Màn hình LED (2D / 3D)', 'LED Screens (2D / 3D)'),
          badge: `${screenCount} ${tr18('đang bật', 'active')}`,
          color: '#c084fc',
          bgTint: 'rgba(192, 132, 252, 0.12)',
          borderTint: 'rgba(192, 132, 252, 0.36)'
        }
      };
      const curMeta = tabMeta[lmpActiveTab18] || tabMeta.structure;

      let bodyHtml = '';
      if (lmpActiveTab18 === 'sets') {
        const setColors = ['#01ffa0', '#00d4ff', '#ff9900', '#f472b6', '#c084fc', '#fbbf24'];
        bodyHtml =
          `<div class="lmp-tb-showmodes18">` +
          [1, 2, 3, 4, 5, 6]
            .map((n) => {
              const cfg = STAGE_SETS18[n];
              const tip = cfg ? tr18(cfg.titleVi, cfg.titleEn) : `Set ${n}`;
              const sc = setColors[(n - 1) % setColors.length];
              const previewSrc = cfg?.runtimePreviewUrl18 || cfg?.previewWebp || `./assets/templates/s${n}.webp`;
              return `<button type="button" class="lmp-tb-modebtn18 ${!ls.aiAuto && ls.activeShow === n ? 'active' : ''}" style="--set-c:${sc}" data-lmp-showmode="${n}" title="${esc18(tip)}"><img src="${esc18(previewSrc)}" alt="S${n}" loading="lazy" decoding="async" data-lumi18-set-img="${n}" style="width:100%;height:34px;object-fit:cover;border-radius:4px;margin-bottom:2px;border:1px solid rgba(148,163,184,0.22)"><span class="lmp-tb-setcode18">S${n}</span><span class="lmp-tb-setlbl18">${esc18(cfg ? tr18(cfg.shortVi, cfg.shortEn).replace(/^S\d+\s*·\s*/, '') : 'Set ' + n)}</span></button>`;
            })
            .join('') +
          `</div>` +
          `<div class="lmp-tb-strip18" style="margin-bottom:6px">` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-modal="templates" style="grid-column:1 / -1">${tr18('Mẫu Sân Khấu Sự Kiện Việt Nam & Hình Review', 'VN Event Stage Templates & Previews')}</button>` +
          `</div>` +
          `<div class="lmp-tb-strip18">` +
          `<button type="button" class="lmp-tb-fxbtn18 ${!ls.dockHidden ? 'active' : ''}" data-lmp-docktoggle="1">${!ls.dockHidden ? tr18('Ẩn thanh Live Show', 'Hide Show Dock') : tr18('Hiện thanh Live Show', 'Show Live Dock')}</button>` +
          `<button type="button" class="lmp-tb-fxbtn18 ${ls.running ? 'active' : ''}" data-lmp-start="1">${ls.running ? tr18('Dừng Show (P)', 'Stop Show (P)') : tr18('Chạy Show (P)', 'Start Show (P)')}</button>` +
          `</div>` +
          `<div class="lmp-tb-strip18" style="margin-top:6px">` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-modal="warehouse">${tr18('Kho & Thuê B2B', 'My Warehouse & RMA')}</button>` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-modal="blueprints">${tr18('Hồ sơ 5 Bản vẽ', '5-Sheet Blueprints')}</button>` +
          `</div>`;
      } else if (lmpActiveTab18 === 'structure') {
        const structs = [
          ['platform', tr18('Bục Sân khấu', 'Platform')],
          ['layher', tr18('Giàn Layher', 'Layher')],
          ['stairs', tr18('Bậc Thang', 'Stairs')],
          ['straight_truss', tr18('Truss Ngang', 'Straight Truss')],
          ['vertical_truss', tr18('Trụ Truss Đứng', 'Vertical Truss')],
          ['circular_truss', tr18('Truss Tròn', 'Circular Truss')],
          ['line_array', tr18('Loa Line Array', 'Line Array')],
          ['sub_stack', tr18('Cụm Loa Sub', 'Sub Stack')],
          ['dj_booth', tr18('Bàn DJ Booth', 'DJ Booth')],
          ['foh_booth', tr18('Trạm FOH', 'FOH Booth')],
          ['podium', tr18('Bục Phát biểu', 'Podium')],
          ['live_band', tr18('Ban nhạc Live', 'Live Band')]
        ];
        bodyHtml =
          `<div class="lmp-tb-grid18 cols-3">` +
          structs.map(([k, lbl]) => `<button type="button" class="lmp-tb-add18" data-lmp-struct="${k}" style="--item-c:${lmpToolColor18(k)}" title="${esc18(lbl)}"><i class="lmp-tb-plus18">+</i>${lmpToolSvg18(k)}<span>${esc18(lbl)}</span></button>`).join('') +
          `</div>` +
          `<div class="lmp-tb-strip18">` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-modal="structure">${tr18('Cấu hình Sàn Gương & Đối xứng', 'Deck Mirror & Symmetry')}</button>` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-modal="audio">${tr18('Trạm Âm thanh #1..#25', 'Audio & Line Array #1..#25')}</button>` +
          `</div>`;
      } else if (lmpActiveTab18 === 'lighting') {
        const lights = [
          ['beams', tr18('Đèn Beam', 'Beams')],
          ['spot', tr18('Spot / Profile', 'Spot / Profile')],
          ['wash', tr18('Đèn Wash', 'Wash')],
          ['par', tr18('Đèn PAR LED', 'PAR LED')],
          ['barra', tr18('Thanh LED Bar', 'Barra LED')],
          ['blinders', tr18('Chớp Blinder', 'Blinders')],
          ['strobe', tr18('Chớp Strobe', 'Strobe')],
          ['fresnel', tr18('Đèn Fresnel', 'Fresnel')],
          ['lasers', tr18('Laser ILDA', 'Lasers')]
        ];
        bodyHtml =
          `<div class="lmp-tb-grid18 cols-3">` +
          lights.map(([k, lbl]) => `<button type="button" class="lmp-tb-add18" data-lmp-light="${k}" style="--item-c:${lmpToolColor18(k)}" title="${esc18(lbl)}"><i class="lmp-tb-plus18">+</i>${lmpToolSvg18(k)}<span>${esc18(lbl)}</span></button>`).join('') +
          `</div>` +
          `<div class="lmp-tb-strip18">` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-dmx="full">${tr18('BẬT TẤT CẢ', 'FULL ON')}</button>` +
          `<button type="button" class="lmp-tb-fxbtn18 ${ls.blackout ? 'active' : ''}" data-lmp-dmx="bo">${tr18('TẮT ĐÈN (B.O.)', 'BLACKOUT')}</button>` +
          `</div>` +
          `<div class="lmp-tb-strip18" style="margin-top:6px">` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-modal="dmx">${tr18('Bàn DMX G1–G5 & TV/ILDA', 'DMX G1–G5 & TV/ILDA')}</button>` +
          `<button type="button" class="lmp-tb-fxbtn18 ${lumiState.dmxProgrammer18?.freezeDmx ? 'active' : ''}" data-lmp-dmx="freeze">${tr18('ĐÓNG BĂNG DMX', 'FREEZE DMX')}</button>` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-action="par_u_contour">${tr18('PAR 3 Vách Chữ U', 'PAR 3-Wall U-Contour')}</button>` +
          `</div>`;
      } else if (lmpActiveTab18 === 'pyro') {
        const pyros = [
          ['sparkular', tr18('Pháo điện lạnh', 'Sparkular'), '700W · 3.5m'],
          ['co2_jets', tr18('Súng khói CO2', 'CO2 Jets'), 'Cryo · 6m'],
          ['flames', tr18('Máy phun lửa', 'Flame Jets'), 'DMX · 4.5m'],
          ['hazer', tr18('Máy tạo khói', 'Hazer DMX'), 'MDG · 1500W'],
          ['aerial_pyro', tr18('Pháo hoa tầm cao', 'Aerial Pyro'), 'Outdoor · 25m']
        ];
        bodyHtml =
          `<div class="lmp-tb-grid18 is-pyro-grid">` +
          pyros.map(([k, lbl, sub]) => `<button type="button" class="lmp-tb-add18 is-row-card" data-lmp-pyro="${k}" style="--item-c:${lmpToolColor18(k)}" title="${esc18(lbl)}"><i class="lmp-tb-plus18">+</i><span class="lmp-tb-ico-box18">${lmpToolSvg18(k)}</span><span class="lmp-tb-card-txt18"><b>${esc18(lbl)}</b><small>${esc18(sub)}</small></span></button>`).join('') +
          `</div>` +
          `<div class="lmp-tb-strip18">` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-fire="safety">${tr18('KIỂM TRA AN TOÀN', 'SAFETY CHECK')}</button>` +
          `<button type="button" class="lmp-tb-fxbtn18 is-pyro" data-lmp-fire="all">${tr18('BẮN TẤT CẢ', 'FIRE ALL')}</button>` +
          `</div>`;
      } else {
        const screens = [
          ['main_wall', tr18('Màn LED Chính', 'Main Wall')],
          ['side_wings', tr18('Cánh LED L/R', 'Side Wings')],
          ['header', tr18('Trán LED Ngang', 'Top Header')],
          ['curved', tr18('Màn LED Cong', 'Curved LED')],
          ['l_corner_90', tr18('Góc L 90°', 'L-Corner 90°')],
          ['cube', tr18('Khối Cube 3D', '4-Face Cube')],
          ['cylinder_360', tr18('Trụ Tròn 360°', '360° Cylinder')],
          ['pixel_map_2d', tr18('Pixel Map 2D', '2D Pixel Map')]
        ];
        const capOn = !!lumiState.screenCapture18?.active;
        const capSrc = lumiState.screenCapture18?.sourceType || 'screen';
        const capFit = lumiState.screenCapture18?.fitMode === 'contain' ? 'Contain' : 'Cover';
        bodyHtml =
          `<div class="lmp-tb-grid18 cols-3">` +
          screens.map(([k, lbl]) => `<button type="button" class="lmp-tb-add18" data-lmp-screen="${k}" style="--item-c:${lmpToolColor18(k)}" title="${esc18(lbl)}"><i class="lmp-tb-plus18">+</i>${lmpToolSvg18(k)}<span>${esc18(lbl)}</span></button>`).join('') +
          `</div>` +
          `<div class="lmp-tb-strip18">` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-modal="pixelpower">${tr18('Pixel Voids [B] & Nguồn Điện', 'Pixel Voids [B] & Power')}</button>` +
          `<button type="button" class="lmp-tb-fxbtn18 ${capOn && capSrc === 'screen' ? 'active' : ''}" data-lmp-action="screencap">${capOn && capSrc === 'screen' ? tr18('Dừng Bắt Màn hình', 'Stop Screen Capture') : tr18('Bắt Màn hình Live', 'Live Screen Capture')}</button>` +
          `</div>` +
          `<div class="lmp-tb-strip18" style="margin-top:6px">` +
          `<button type="button" class="lmp-tb-fxbtn18 ${capOn && capSrc === 'webcam' ? 'active' : ''}" data-lmp-action="webcamcap">${capOn && capSrc === 'webcam' ? tr18('Dừng Webcam / Capture', 'Stop Webcam / Capture') : tr18('Webcam / Capture Card', 'Webcam / Capture Card')}</button>` +
          `<button type="button" class="lmp-tb-fxbtn18" data-lmp-action="capfit">${tr18('Tỷ lệ: ' + capFit, 'Fit: ' + capFit)}</button>` +
          `</div>`;
      }

      const catKeys = ['sets', 'structure', 'lighting', 'pyro', 'screens'];
      const catBarHtml = catKeys
        .map((k) => {
          const m = tabMeta[k];
          const isAct = lmpActiveTab18 === k;
          return (
            `<button type="button" role="tab" data-lmp-tab="${k}" aria-selected="${isAct}" class="lmp-tb-cattab18 ${isAct ? 'active' : ''}" style="--cat-c:${m.color};--cat-bg:${m.bgTint};--cat-bd:${m.borderTint}" title="${esc18(m.title)}">` +
            `<span class="lmp-tb-catico18">${ico18(m.ico)}</span>` +
            `<span class="lmp-tb-catlbl18">${esc18(m.short)}</span>` +
            `<i class="lmp-tb-catbar-line18"></i>` +
            `</button>`
          );
        })
        .join('');

      const railBtn = (k, attrLiteral) => {
        const m = tabMeta[k];
        const isAct = !lmpCollapsed18 && lmpActiveTab18 === k;
        return `<button type="button" role="tab" ${attrLiteral} aria-selected="${isAct}" class="lmp-tb-railbtn18 is-${k} ${isAct ? 'active' : ''}" style="--cat-c:${m.color};--cat-bg:${m.bgTint};--cat-bd:${m.borderTint}" title="${esc18(m.title)}" aria-label="${esc18(m.title)}">${ico18(m.ico)}</button>`;
      };

      box.innerHTML =
        `<div class="lmp-tb-rail18" role="tablist" aria-orientation="vertical" aria-label="${tr18('Khay Công cụ Sân khấu', 'Stage Toolbox')}">` +
        railBtn('sets', 'data-lmp-tab="sets"') +
        railBtn('structure', 'data-lmp-tab="structure"') +
        railBtn('lighting', 'data-lmp-tab="lighting"') +
        railBtn('pyro', 'data-lmp-tab="pyro"') +
        railBtn('screens', 'data-lmp-tab="screens"') +
        `<span class="lmp-tb-rail-sep18" role="separator"></span>` +
        `<button type="button" data-lmp-docktoggle="1" aria-pressed="${!ls.dockHidden}" class="lmp-tb-railbtn18 is-docktoggle ${!ls.dockHidden ? 'active' : ''}" style="--cat-c:#f472b6;--cat-bg:rgba(244,114,182,0.12);--cat-bd:rgba(244,114,182,0.38)" title="${tr18('Ẩn / Hiện Bàn điều khiển Live Show', 'Show / Hide Live Show Dock')}" aria-label="${tr18('Ẩn / Hiện Bàn điều khiển Live Show', 'Show / Hide Live Show Dock')}">${ico18('monitor-play')}</button>` +
        `</div>` +
        `<div class="lmp-tb-flyout18" style="--cat-c:${curMeta.color};--cat-bg:${curMeta.bgTint};--cat-bd:${curMeta.borderTint}">` +
        `<div class="lmp-tb-head18">` +
        `<span class="lmp-tb-title18">${ico18('package')}<span>${tr18('Hộp công cụ Sân khấu', 'Stage Toolbox')}</span></span>` +
        `<span class="lmp-tb-head-right18"><button type="button" class="lmp-tb-kbd18" data-lmp-toggle="1" aria-expanded="${!lmpCollapsed18}" title="${tr18('Đóng bảng công cụ', 'Close toolbox drawer')}" aria-label="${tr18('Đóng bảng công cụ', 'Close toolbox drawer')}">${ico18('x')}</button></span>` +
        `</div>` +
        `<div class="lmp-tb-catbar18" role="tablist" aria-label="${tr18('Danh mục thiết bị sân khấu', 'Stage Equipment Categories')}">${catBarHtml}</div>` +
        `<div class="lmp-tb-sec-head18"><span class="lmp-tb-sec-title18">${ico18(curMeta.ico)}<span>${esc18(curMeta.title)}</span></span><b class="lmp-tb-badge18">${esc18(curMeta.badge)}</b></div>` +
        `<div class="lmp-tb-body18">${bodyHtml}</div>` +
        `</div>`;
    }

    let _suppressRpInspectorRebuild18 = false;

    const LMP_TOOL_LABELS18 = {
      platform: ['Bục Sân khấu Modular', 'Modular Stage Platform'],
      layher: ['Tháp Giàn giáo Layher', 'Layher Scaffold Tower'],
      stairs: ['Bậc Thang Sân khấu', 'Stage Stairs'],
      straight_truss: ['Đà Truss Ngang', 'Straight Truss Span'],
      vertical_truss: ['Trụ Truss Đứng', 'Vertical Truss Tower'],
      circular_truss: ['Vòng Truss Tròn Kinetic', 'Circular Kinetic Truss'],
      line_array: ['Hệ Loa Line Array L/R', 'L/R Line Array PA'],
      sub_stack: ['Cụm Loa Subwoofer', 'Subwoofer Stack'],
      dj_booth: ['Bàn DJ Booth 3D', '3D DJ Booth'],
      foh_booth: ['Trạm Điều khiển FOH', 'FOH Control Booth'],
      podium: ['Bục Phát biểu VIP', 'VIP Lectern Podium'],
      live_band: ['Bục Ban nhạc Live', 'Live Band Riser'],
      beams: ['Đèn Moving Head Beam 230', 'Beam 230 7R Moving Head'],
      spot: ['Đèn Moving Head Spot / Profile', 'Spot / Profile 350W'],
      wash: ['Đèn Moving Head Wash Zoom', 'Wash Zoom 36x18W'],
      par: ['Đèn PAR LED 54x3W RGBW', 'PAR LED 54x3W RGBW'],
      barra: ['Thanh LED Pixel Bar 1m', 'Barra LED Pixel Bar 1m'],
      blinders: ['Đèn Chớp Khán giả Blinder 4-Lite', 'Audience Blinder 4-Lite'],
      strobe: ['Đèn Chớp Atomic Strobe 14Hz', 'Atomic 3000 DMX Strobe'],
      fresnel: ['Đèn Mặt Theater Fresnel 200W', 'Theater Fresnel 200W'],
      lasers: ['Hệ Đèn Laser ILDA RGB 10W', 'KVANT ILDA RGB Laser 10W'],
      sparkular: ['Pháo Điện Lạnh Sparkular', 'Sparkular Cold Sparks'],
      co2_jets: ['Súng Khói Lạnh CO2 Cryo', 'CO2 Cryo Jets'],
      flames: ['Máy Phun Lửa DMX G-Flame', 'DMX Flame Projectors'],
      hazer: ['Máy Tạo Khói Hazer MDG', 'MDG Pro DMX Hazer'],
      aerial_pyro: ['Pháo Hoa Tầm Cao & Kim Tuyến', 'Aerial Pyro & StadiumShot'],
      main_wall: ['Màn Hình LED Chính (Main Wall)', 'Main LED Wall'],
      side_wings: ['Cánh LED Hai Bên (Side Wings)', 'Side Wing LEDs'],
      header: ['Trán LED Ngang (Top Header)', 'Top Header LED'],
      curved: ['Màn Hình LED Cong (Curved LED)', 'Curved Panorama LED'],
      l_corner_90: ['Màn Hình LED Góc Chữ L 90°', '90° L-Corner Anamorphic LED'],
      cube: ['Khối LED Cube 4 Mặt Treo', '4-Face Rigged LED Cube'],
      cylinder_360: ['Trụ Tròn LED 360°', '360° Cylindrical LED Column']
    };

    function removeBatchItems18(batchId) {
      if (!batchId) return 0;
      let removed = 0;
      const eng = S.engine;
      const sa = S.stageAssets16;
      if (Array.isArray(eng?.lights)) {
        const before = eng.lights.length;
        eng.lights = eng.lights.filter((l) => l?._lmpBatchId18 !== batchId);
        removed += before - eng.lights.length;
        if (removed > 0) eng.rebuildFixtures?.();
      }
      if (Array.isArray(sa?.items)) {
        const toDel = sa.items.filter((it) => it?._lmpBatchId18 === batchId || it?.id === batchId).map((it) => it.id);
        toDel.forEach((id) => {
          if (typeof sa.deleteItem === 'function') {
            if (sa.deleteItem(id, { record: false, silent: true })) removed++;
          } else if (typeof sa.removeItem === 'function') {
            sa.removeItem(id);
            removed++;
          } else {
            const idx = sa.items.findIndex((x) => x.id === id);
            if (idx >= 0) {
              sa.items.splice(idx, 1);
              removed++;
            }
          }
        });
      }
      if (Array.isArray(eng?.surfaces)) {
        const surfToDel = eng.surfaces.filter((s) => s?._lmpBatchId18 === batchId);
        const stageToRemove = new Set();
        surfToDel.forEach((s) => {
          if (s.mesh) {
            stageToRemove.add(s.mesh);
            eng.releaseMesh?.(s.mesh);
          }
          for (const m of findSurfaceStageMeshes(eng, s)) {
            stageToRemove.add(m);
            eng.releaseMesh?.(m);
          }
          removed++;
        });
        if (Array.isArray(eng.stage)) {
          for (const m of eng.stage) {
            if (m && m._lmpBatchId18 === batchId) {
              stageToRemove.add(m);
              eng.releaseMesh?.(m);
            }
          }
          if (stageToRemove.size > 0) {
            eng.stage = eng.stage.filter((m) => !stageToRemove.has(m));
            eng._stageBatchDirty = true;
          }
        }
        if (surfToDel.length) {
          eng.surfaces = eng.surfaces.filter((s) => s?._lmpBatchId18 !== batchId);
          eng.selected = eng.surfaces[0]?.id || null;
          eng._stageBatchDirty = true;
        }
      }
      return removed;
    }

    function buildChainDiagramSvg18(cfg) {
      const count = Math.max(1, Math.min(24, Number(cfg.count) || 1));
      const col = lmpToolColor18(cfg.kind) || '#00d4ff';
      const w = 280;
      const h = 54;
      const padX = 22;
      const spanPx = w - padX * 2;
      const nodes = [];
      for (let i = 0; i < count; i++) {
        const cx = count === 1 ? w / 2 : +(padX + (i / (count - 1)) * spanPx).toFixed(1);
        const cy = cfg.parLayout === 'u_shape' && count >= 3
          ? (i < count / 3 || i >= (2 * count) / 3 ? 36 : 18)
          : 26;
        nodes.push({ idx: i, cx, cy });
      }
      const polyline = nodes.length > 1
        ? `<polyline points="${nodes.map((n) => `${n.cx},${n.cy}`).join(' ')}" fill="none" stroke="rgba(148,163,184,0.45)" stroke-width="1.6" stroke-dasharray="3 2"/>`
        : '';
      const centerLine = cfg.symmetry
        ? `<line x1="${w / 2}" y1="6" x2="${w / 2}" y2="${h - 6}" stroke="rgba(1,255,160,0.45)" stroke-width="1.2" stroke-dasharray="2 2"/>`
        : '';
      const circles = nodes
        .map(
          (n) =>
            `<g class="lmp-chain-node18" data-rp-remove-idx="${n.idx}" role="button" tabindex="0" aria-label="${tr18(`Thiết bị #${n.idx + 1} (Click để bớt 1)`, `Unit #${n.idx + 1} (Click to remove 1)`)}" title="${tr18(`Thiết bị #${n.idx + 1} — Click để bớt 1 đơn vị`, `Unit #${n.idx + 1} — Click to remove 1 unit`)}">` +
            `<circle cx="${n.cx}" cy="${n.cy}" r="8.5" fill="rgba(15,23,42,0.92)" stroke="${col}" stroke-width="1.8"/>` +
            `<text x="${n.cx}" y="${n.cy + 3}" text-anchor="middle" fill="#f8fafc" font-size="8.5" font-weight="700">${n.idx + 1}</text>` +
            `</g>`
        )
        .join('');
      return `<svg class="lmp-chain-svg18" viewBox="0 0 ${w} ${h}" role="img" aria-label="${tr18('Sơ đồ chuỗi thiết bị', 'Equipment chain diagram')}">${centerLine}${polyline}${circles}</svg>`;
    }

    function rebuildBatchConfigurator18(options = {}) {
      if (options && options.batchId) {
        lumiState.rpConfig18 = options;
      }
      const cfg = lumiState.rpConfig18;
      if (!cfg) return;
      _suppressRpInspectorRebuild18 = options.rebuildInspectorDom === false;
      try {
        removeBatchItems18(cfg.batchId);
        if (cfg.category === 'lighting') {
          addToolboxLighting18(cfg.kind, {
            batchId: cfg.batchId,
            count: cfg.count,
            spanM: cfg.spanM,
            symmetry: cfg.symmetry,
            mountZone: cfg.mountZone,
            zoomDeg: cfg.zoomDeg,
            parLayout: cfg.parLayout,
            panOffsetDeg: cfg.panOffsetDeg,
            tiltOffsetDeg: cfg.tiltOffsetDeg,
            color: cfg.color,
            noCheckpoint: true,
            silent: true
          });
        } else if (cfg.category === 'pyro') {
          addToolboxPyroSfx18(cfg.kind, {
            batchId: cfg.batchId,
            count: cfg.count,
            spanM: cfg.spanM,
            symmetry: cfg.symmetry,
            mountZone: cfg.mountZone,
            scale: cfg.scale,
            noCheckpoint: true,
            silent: true
          });
        } else if (cfg.category === 'structure') {
          addToolboxStructure18(cfg.kind, {
            batchId: cfg.batchId,
            count: cfg.count,
            spanM: cfg.spanM,
            symmetry: cfg.symmetry,
            scale: cfg.scale,
            offsetY: cfg.offsetY,
            offsetZ: cfg.offsetZ,
            skipAct: true,
            noCheckpoint: true,
            silent: true
          });
        } else if (cfg.category === 'screens') {
          addToolboxScreen18(cfg.kind, {
            batchId: cfg.batchId,
            widthM: cfg.widthM,
            heightM: cfg.heightM,
            curveDegPerCab: cfg.curveDegPerCab,
            noCheckpoint: true,
            silent: true
          });
        }
      } finally {
        _suppressRpInspectorRebuild18 = false;
      }
      const chainHost = $('lmpRpChainHost18');
      if (chainHost) chainHost.innerHTML = buildChainDiagramSvg18(cfg);
      if (options.rebuildInspectorDom !== false) {
        window._lmpRpConfigSig18 = `${cfg.batchId}:${cfg.count}:${cfg.parLayout}:${cfg.symmetry}:${cfg.mountZone}`;
        window.renderInspector?.();
      }
      return cfg;
    }

    function openToolboxConfigurator18(rawCategory, rawKind, opts = {}) {
      const catMap = { light: 'lighting', sfx: 'pyro', screen: 'screens' };
      const category = catMap[rawCategory] || rawCategory;
      if (category === 'screens' && rawKind === 'pixel_map_2d') {
        return addToolboxScreen18('pixel_map_2d');
      }
      const kindMap = {
        moving: 'beams', par_led: 'par', strobe_bar: 'strobe', laser_bar: 'lasers', laser: 'lasers', blinder: 'blinders', beam: 'beams',
        cold_spark: 'sparkular', cold_spark_fountain: 'sparkular', co2_jet: 'co2_jets', flame_jet: 'flames', confetti_cannon: 'aerial_pyro', haze_machine_pro: 'hazer'
      };
      const kind = kindMap[rawKind] || rawKind;
      const batchId = opts.batchId || `batch_${category}_${kind}_${Date.now().toString(36)}`;
      const defaultCounts = {
        beams: 4, spot: 4, wash: 4, par: 6, barra: 4, blinders: 4, strobe: 4, fresnel: 4, lasers: 2,
        sparkular: 4, co2_jets: 4, flames: 4, hazer: 2, aerial_pyro: 4,
        line_array: 2, sub_stack: 2, layher: 2, vertical_truss: 2
      };
      const defaultColors = {
        beams: '#38bdf8', spot: '#a855f7', wash: '#ec4899', par: '#22c55e', barra: '#00f5d4',
        blinders: '#fbbf24', strobe: '#ffffff', fresnel: '#fde68a', lasers: '#10b981'
      };
      const defaultZoom = {
        beams: 7, spot: 12, wash: 24, par: 20, barra: 12, blinders: 28, strobe: 30, fresnel: 24, lasers: 5
      };
      const cfg = {
        batchId,
        category,
        kind,
        mode: opts.mode || 'add',
        count: opts.count ?? (defaultCounts[kind] || 1),
        spanM: opts.spanM ?? (category === 'pyro' ? 9.6 : 12.0),
        symmetry: opts.symmetry ?? (defaultCounts[kind] >= 2),
        mountZone: opts.mountZone || (kind === 'barra' ? 'floor' : category === 'pyro' ? (kind === 'hazer' ? 'back' : 'front') : 'overhead'),
        zoomDeg: opts.zoomDeg ?? (defaultZoom[kind] || 18),
        parLayout: opts.parLayout || 'linear',
        panOffsetDeg: opts.panOffsetDeg ?? 0,
        tiltOffsetDeg: opts.tiltOffsetDeg ?? 0,
        color: opts.color || defaultColors[kind] || '#38bdf8',
        scale: opts.scale ?? 1.0,
        offsetY: opts.offsetY ?? 0,
        offsetZ: opts.offsetZ ?? 0,
        widthM: opts.widthM ?? (kind === 'header' ? 8.0 : kind === 'side_wings' ? 2.0 : 4.0),
        heightM: opts.heightM ?? (kind === 'header' ? 1.0 : kind === 'side_wings' ? 4.0 : 2.5),
        curveDegPerCab: opts.curveDegPerCab ?? (kind === 'curved' ? -5 : 0)
      };
      lumiState.rpConfig18 = cfg;
      window._lmpRpConfigSig18 = `${cfg.batchId}:${cfg.count}:${cfg.mode}`;
      S.closeAllDocks16?.('inspector');
      if (S.choreo11?.open) S.choreo11.open = false;
      if (S.stage10?.open) S.stage10.open = false;
      S.toggleRightPanel16?.(false);
      document.body?.classList?.remove?.('right-panel-collapsed');
      if (S.director?.panel === 'objects') S.director.panel = null;
      if (window.state) {
        window.state.step = category === 'screens' ? 'mapping' : category === 'structure' ? 'stage' : 'lighting';
      }

      let result = null;
      if (!opts.skipInitialSpawn) {
        if (category === 'lighting') result = addToolboxLighting18(kind, { ...cfg });
        else if (category === 'pyro') result = addToolboxPyroSfx18(kind, { ...cfg });
        else if (category === 'structure') result = addToolboxStructure18(kind, { ...cfg });
        else if (category === 'screens') result = addToolboxScreen18(kind, { ...cfg });
      }
      cfg.items = result;
      if (S.director?.panel === 'objects') S.director.panel = null;
      window.renderUI?.();
      window.renderInspector?.();
      return cfg;
    }

    function openBatchConfigurator18(batchId, members = []) {
      if (!Array.isArray(members) || !members.length) return null;
      const first = members[0];
      const isPyro = Boolean(first._isPyroSfx18 || /^(cold_spark_fountain|co2_jet|flame_jet|confetti_cannon|haze_machine_pro)$/.test(first.kind || first.type || ''));
      const category = first._lmpCategory18 || (isPyro ? 'pyro' : 'lighting');
      const reversePyroKind = {
        cold_spark_fountain: 'sparkular',
        co2_jet: 'co2_jets',
        flame_jet: 'flames',
        haze_machine_pro: 'hazer',
        confetti_cannon: 'aerial_pyro'
      };
      const reverseLightKind = {
        beam: 'beams', spot: 'spot', wash: 'wash', par: 'par', bar: 'barra',
        blinder: 'blinders', strobe: 'strobe', fresnel: 'fresnel', laser: 'lasers'
      };
      const kind = first._lmpToolKind18 || (isPyro ? reversePyroKind[first.kind || first.type] || 'sparkular' : reverseLightKind[first.type] || 'beams');
      const xs = members.map((m) => Number(m.pos?.[0]) || 0);
      const spanM = xs.length > 1 ? Math.max(2, +(Math.max(...xs) - Math.min(...xs)).toFixed(1)) : 8.0;
      members.forEach((m) => { m._lmpBatchId18 = batchId; });
      return openToolboxConfigurator18(category, kind, {
        batchId,
        mode: 'edit',
        count: members.length,
        spanM,
        symmetry: members.length >= 2,
        zoomDeg: Number(first.angle) || 18,
        color: first.color || '#38bdf8',
        scale: Number(first.scale) || 1,
        skipInitialSpawn: true
      });
    }

    function buildLmpConfigCardHtml18(cfg) {
      if (!cfg) return '';
      const pair = LMP_TOOL_LABELS18[cfg.kind] || [cfg.kind, cfg.kind];
      const objTitle = tr18(pair[0], pair[1]);
      const col = lmpToolColor18(cfg.kind) || '#00d4ff';
      const isAdd = cfg.mode !== 'edit';
      const badgeTxt = isAdd ? tr18('THÊM & CẤU HÌNH CỤM', 'ADD & CONFIGURE BATCH') : tr18('CHỈNH SỬA CỤM THIẾT BỊ', 'EDIT EQUIPMENT BATCH');

      let extraFields = '';
      if (cfg.category === 'lighting') {
        extraFields +=
          `<div class="lmp-rp-row18">` +
          `<label>${tr18('Vị trí treo (Mount Zone)', 'Mount Zone')}</label>` +
          `<div class="lmp-rp-seg18">` +
          `<button type="button" class="${cfg.mountZone === 'overhead' ? 'active' : ''}" data-rp-mount="overhead">${tr18('Đà Truss Cao', 'Overhead Truss')}</button>` +
          `<button type="button" class="${cfg.mountZone === 'front' ? 'active' : ''}" data-rp-mount="front">${tr18('Đà Trước (FOH)', 'Front Truss')}</button>` +
          `<button type="button" class="${cfg.mountZone === 'floor' ? 'active' : ''}" data-rp-mount="floor">${tr18('Đặt Sàn (Floor)', 'Stage Deck')}</button>` +
          `</div>` +
          `</div>`;
        if (cfg.kind === 'par' || cfg.kind === 'barra') {
          extraFields +=
            `<div class="lmp-rp-row18">` +
            `<label>${tr18('Bố cục dải đèn (Layout)', 'Array Layout')}</label>` +
            `<div class="lmp-rp-seg18">` +
            `<button type="button" class="${cfg.parLayout !== 'u_shape' ? 'active' : ''}" data-rp-parlayout="linear">${tr18('Hàng ngang (Linear)', 'Linear Row')}</button>` +
            `<button type="button" class="${cfg.parLayout === 'u_shape' ? 'active' : ''}" data-rp-parlayout="u_shape">${tr18('Chữ U 3 vách (U-Shape)', '3-Wall U-Shape')}</button>` +
            `</div>` +
            `</div>`;
        }
        if (cfg.kind === 'wash' || cfg.kind === 'spot' || cfg.kind === 'beams' || cfg.kind === 'fresnel') {
          extraFields +=
            `<label class="lmp-rp-slider18">` +
            `<span>${tr18('Góc mở chùm tia / Zoom (°)', 'Beam / Wash Zoom (°)')} <b id="lmpRpZoomVal18">${cfg.zoomDeg}°</b></span>` +
            `<input type="range" min="4" max="55" step="1" value="${cfg.zoomDeg}" data-rp-zoom="1">` +
            `</label>`;
        }
        if (cfg.kind === 'beams' || cfg.kind === 'spot' || cfg.kind === 'lasers') {
          extraFields +=
            `<div class="lmp-rp-grid2-18">` +
            `<label class="lmp-rp-slider18">` +
            `<span>Pan Aim <b id="lmpRpPanVal18">${cfg.panOffsetDeg}°</b></span>` +
            `<input type="range" min="-60" max="60" step="2" value="${cfg.panOffsetDeg}" data-rp-pan="1">` +
            `</label>` +
            `<label class="lmp-rp-slider18">` +
            `<span>Tilt Aim <b id="lmpRpTiltVal18">${cfg.tiltOffsetDeg}°</b></span>` +
            `<input type="range" min="-45" max="45" step="2" value="${cfg.tiltOffsetDeg}" data-rp-tilt="1">` +
            `</label>` +
            `</div>`;
        }
        extraFields +=
          `<div class="lmp-rp-row18 is-inline">` +
          `<label>${tr18('Màu sắc cụm đèn', 'Batch Color')}</label>` +
          `<input type="color" value="${esc18(cfg.color)}" data-rp-color="1" class="lmp-rp-color18">` +
          `</div>`;
      } else if (cfg.category === 'pyro') {
        extraFields +=
          `<div class="lmp-rp-row18">` +
          `<label>${tr18('Tuyến bố trí (Stage Line)', 'Stage Placement Line')}</label>` +
          `<div class="lmp-rp-seg18">` +
          `<button type="button" class="${cfg.mountZone === 'front' ? 'active' : ''}" data-rp-mount="front">${tr18('Mép Trước', 'Front Edge')}</button>` +
          `<button type="button" class="${cfg.mountZone === 'mid' ? 'active' : ''}" data-rp-mount="mid">${tr18('Giữa Sân', 'Mid Stage')}</button>` +
          `<button type="button" class="${cfg.mountZone === 'back' ? 'active' : ''}" data-rp-mount="back">${tr18('Hậu Cảnh', 'Upstage Back')}</button>` +
          `</div>` +
          `</div>` +
          `<label class="lmp-rp-slider18">` +
          `<span>${tr18('Tỷ lệ kích thước / Độ cao tia', 'Unit / Plume Scale')} <b id="lmpRpScaleVal18">${Number(cfg.scale).toFixed(2)}x</b></span>` +
          `<input type="range" min="0.5" max="2.2" step="0.05" value="${cfg.scale}" data-rp-scale="1">` +
          `</label>` +
          `<button type="button" class="btn full-btn lmp-rp-testfire18" data-rp-testfire="1">${ico18('sparkles')}<span>${tr18('Bắn thử cụm Pyro này (Test Fire)', 'Test Fire Pyro Batch')}</span></button>`;
      } else if (cfg.category === 'structure') {
        extraFields +=
          `<label class="lmp-rp-slider18">` +
          `<span>${tr18('Tỷ lệ kích thước (Scale)', 'Scale Multiplier')} <b id="lmpRpScaleVal18">${Number(cfg.scale).toFixed(2)}x</b></span>` +
          `<input type="range" min="0.5" max="2.5" step="0.05" value="${cfg.scale}" data-rp-scale="1">` +
          `</label>` +
          `<div class="lmp-rp-grid2-18">` +
          `<label class="lmp-rp-slider18">` +
          `<span>${tr18('Cao độ Y (m)', 'Height Y (m)')} <b id="lmpRpPosYVal18">${Number(cfg.offsetY).toFixed(1)}m</b></span>` +
          `<input type="range" min="-2" max="6" step="0.2" value="${cfg.offsetY}" data-rp-posy="1">` +
          `</label>` +
          `<label class="lmp-rp-slider18">` +
          `<span>${tr18('Độ sâu Z (m)', 'Depth Z (m)')} <b id="lmpRpPosZVal18">${Number(cfg.offsetZ).toFixed(1)}m</b></span>` +
          `<input type="range" min="-6" max="8" step="0.2" value="${cfg.offsetZ}" data-rp-posz="1">` +
          `</label>` +
          `</div>` +
          (String(cfg.kind || '').includes('truss')
            ? `<button type="button" class="btn full-btn" style="margin-top:6px" data-rp-attachtruss="1">${ico18('sparkles')}<span>${tr18('Gắn cụm đèn Beam lên Đà Truss này', 'Attach Beam Fixtures to Truss')}</span></button>`
            : '');
      } else if (cfg.category === 'screens') {
        extraFields +=
          `<div class="lmp-rp-grid2-18">` +
          `<label class="lmp-rp-slider18">` +
          `<span>${tr18('Rộng (Width m)', 'Width (m)')} <b id="lmpRpScrWVal18">${Number(cfg.widthM).toFixed(1)}m</b></span>` +
          `<input type="range" min="1" max="20" step="0.5" value="${cfg.widthM}" data-rp-scrw="1">` +
          `</label>` +
          `<label class="lmp-rp-slider18">` +
          `<span>${tr18('Cao (Height m)', 'Height (m)')} <b id="lmpRpScrHVal18">${Number(cfg.heightM).toFixed(1)}m</b></span>` +
          `<input type="range" min="0.5" max="10" step="0.5" value="${cfg.heightM}" data-rp-scrh="1">` +
          `</label>` +
          `</div>` +
          `<label class="lmp-rp-slider18">` +
          `<span>${tr18('Độ cong mỗi Cabinet (°)', 'Curve Angle (°/cab)')} <b id="lmpRpCurveVal18">${cfg.curveDegPerCab}°</b></span>` +
          `<input type="range" min="-15" max="15" step="1" value="${cfg.curveDegPerCab}" data-rp-curve="1">` +
          `</label>`;
      }

      const showBatchArrayControls = cfg.category !== 'screens';
      return (
        `<div id="lmpRpConfigCard18" class="inspector-block lmp-rp-config18" style="--rp-c:${col}">` +
        `<div class="lmp-rp-head18">` +
        `<span class="lmp-rp-ico18">${lmpToolSvg18(cfg.kind)}</span>` +
        `<div class="lmp-rp-titlewrap18"><small>${esc18(badgeTxt)}</small><strong>${esc18(objTitle)}</strong></div>` +
        `<button type="button" class="lmp-help-btn18" data-lmp-help="1" title="${tr18('Hướng dẫn chức năng (?)', 'Feature guide (?)')}">?</button>` +
        `</div>` +
        (showBatchArrayControls
          ? `<div class="lmp-rp-symrow18">` +
            `<label class="check-row"><input type="checkbox" data-rp-sym="1" ${cfg.symmetry ? 'checked' : ''}><span>${tr18('Đối xứng Trái / Phải (Live Symmetry L/R)', 'Live Symmetry (L/R Mirror)')}</span></label>` +
            `</div>` +
            `<div class="lmp-rp-grid2-18">` +
            `<label class="lmp-rp-slider18">` +
            `<span>${tr18('Bề rộng phủ (m)', 'Width to Cover (m)')} <b id="lmpRpSpanVal18">${Number(cfg.spanM).toFixed(1)}m</b></span>` +
            `<input type="range" min="2" max="24" step="0.4" value="${cfg.spanM}" data-rp-span="1">` +
            `</label>` +
            `<label class="lmp-rp-slider18">` +
            `<span>${tr18('Số lượng (Units)', 'Units (Count)')} <b id="lmpRpCountVal18">${cfg.count}</b></span>` +
            `<input type="range" min="1" max="16" step="1" value="${cfg.count}" data-rp-count="1">` +
            `</label>` +
            `</div>` +
            `<div class="lmp-rp-chainbox18">` +
            `<div class="lmp-rp-chainhdr18"><span>${tr18('Sơ đồ chuỗi thiết bị (Click icon để bớt 1)', 'Unit Chain Diagram (Click icon to remove 1)')}</span><b>${cfg.count} ${tr18('đơn vị', 'units')}</b></div>` +
            `<div id="lmpRpChainHost18">${buildChainDiagramSvg18(cfg)}</div>` +
            `</div>`
          : '') +
        extraFields +
        `<div class="lmp-rp-actions18">` +
        `<button type="button" class="btn danger" data-rp-cancel="1">${tr18('Huỷ / Xoá cụm', 'Cancel / Remove')}</button>` +
        `<button type="button" class="btn primary" data-rp-confirm="1">${tr18('Xác nhận đặt trên sân khấu', 'Confirm on Stage')}</button>` +
        `</div>` +
        `</div>`
      );
    }

    function buildLmpLightingFxEngineHtml18() {
      const ls = liveShow18;
      const { chaseOpts, fanOpts, laserOpts } = getLmpFxSelectOptions18();
      const sfxItem = window.state?.selectedSfx18 && Array.isArray(S.stageAssets16?.items)
        ? S.stageAssets16.items.find((x) => x.id === window.state.selectedSfx18)
        : null;
      const sfxCardHtml = sfxItem && !lumiState.rpConfig18
        ? `<div class="inspector-block lmp-rp-sfxcard18">` +
          `<div class="lmp-rp-head18">` +
          `<span class="lmp-rp-ico18">${ico18('sparkles')}</span>` +
          `<div class="lmp-rp-titlewrap18"><small>${tr18('THIẾT BỊ PHÁO & SFX ĐANG CHỌN', 'SELECTED PYRO & SFX UNIT')}</small><strong>${esc18(sfxItem.name || sfxItem.kind)}</strong></div>` +
          `</div>` +
          `<div class="field-grid three">` +
          [0, 1, 2].map((i) => `<div class="field"><label>${['X (m)', 'Y (m)', 'Z (m)'][i]}</label><input type="number" step="0.1" value="${Number(sfxItem.pos?.[i] || 0).toFixed(2)}" data-rp-sfxpos="${i}"></div>`).join('') +
          `</div>` +
          `<div class="lmp-rp-actions18" style="margin-top:8px">` +
          `<button type="button" class="btn" data-lmp-fire="${esc18(sfxItem.kind || 'all')}">${ico18('sparkles')}<span>${tr18('Bắn thử (Test Fire)', 'Test Fire')}</span></button>` +
          `<button type="button" class="btn danger" data-rp-sfxdel="${esc18(sfxItem.id)}">${tr18('Xoá thiết bị', 'Delete Unit')}</button>` +
          `</div>` +
          `</div>`
        : '';

      return (
        sfxCardHtml +
        `<div id="lmpRpFxEngineCard18" class="inspector-block lmp-rp-fxcard18">` +
        `<div class="lmp-rp-head18">` +
        `<span class="lmp-rp-ico18">${ico18('sliders-horizontal')}</span>` +
        `<div class="lmp-rp-titlewrap18"><small>${tr18('ĐIỀU KHIỂN ĐỘC LẬP & ĐỘNG CƠ SHOW', 'INDEPENDENT CHANNELS & SHOW ENGINE')}</small><strong>${tr18('Hệ thống Đèn, Laser & Pháo SFX', 'Lights, Laser & Pyro SFX Engine')}</strong></div>` +
        `<button type="button" class="lmp-help-btn18" data-lmp-help="1" title="${tr18('Giải thích sự khác nhau giữa ĐÈN, CHỚP 14HZ, BLINDER, LASER, PHÁO và các chế độ Chase/Fan (?)', 'Explain LIGHTS, STROBE 14HZ, BLINDERS, LASER, PYRO & Chase/Fan modes (?)')}">?</button>` +
        `</div>` +
        `<div class="lmp-rp-chgrid18" role="group" aria-label="${tr18('Kênh thiết bị độc lập', 'Independent Fixture Channels')}">` +
        `<button type="button" class="lmp-rp-chbtn18 ${ls.lightsOn ? 'active' : ''}" data-lmp-showfx="lights" title="${tr18('Bật/Tắt đèn Moving Head, PAR, Barra, Fresnel (Phím M)', 'Toggle Moving Heads, PAR, Barra, Fresnel (Key M)')}"><span>${tr18('ĐÈN CHÍNH [M]', 'LIGHTS [M]')}</span><b>${ls.lightsOn ? 'ON' : 'OFF'}</b></button>` +
        `<button type="button" class="lmp-rp-chbtn18 is-strobe ${ls.strobe ? 'active' : ''}" data-lmp-showfx="strobe" title="${tr18('Đèn Chớp Strobe 14Hz độc lập (Phím Z)', 'Independent 14Hz Atomic Strobe (Key Z)')}"><span>${tr18('CHỚP 14HZ [Z]', 'STROBE [Z]')}</span><b>${ls.strobe ? '14Hz' : 'OFF'}</b></button>` +
        `<button type="button" class="lmp-rp-chbtn18 is-blinder ${ls.blindersOn ? 'active' : ''}" data-lmp-showfx="blinders" title="${tr18('Đèn Chớp Khán giả Blinder độc lập (Phím F)', 'Independent Audience Blinders (Key F)')}"><span>${tr18('BLINDER [F]', 'BLINDER [F]')}</span><b>${ls.blindersOn ? 'ON' : 'OFF'}</b></button>` +
        `<button type="button" class="lmp-rp-chbtn18 is-laser ${ls.laserOn ? 'active' : ''}" data-lmp-showfx="laser" title="${tr18('Hệ thống Laser 16 tia ILDA (Phím L)', '16-Beam ILDA Laser System (Key L)')}"><span>LASER [L]</span><b>${ls.laserOn ? 'ON' : 'OFF'}</b></button>` +
        `<button type="button" class="lmp-rp-chbtn18 is-pyro ${ls.sfxOn ? 'active' : ''}" data-lmp-showfx="sfx" title="${tr18('Hệ thống Pháo & Khói tự động (Phím X)', 'Auto Pyro & SFX System (Key X)')}"><span>${tr18('PHÁO SFX [X]', 'PYRO SFX [X]')}</span><b>${ls.sfxOn ? 'ON' : 'OFF'}</b></button>` +
        `<button type="button" class="lmp-rp-chbtn18 is-bo ${ls.blackout ? 'active' : ''}" data-lmp-showfx="bo" title="${tr18('Tắt toàn bộ ánh sáng Blackout (Phím B)', 'Master Blackout (Key B)')}"><span>${tr18('TẮT ĐÈN [B]', 'B.O. [B]')}</span><b>${ls.blackout ? 'B.O.' : 'READY'}</b></button>` +
        `</div>` +
        `<div class="lmp-rp-selects18">` +
        `<label class="lmp-rp-selrow18"><span>${tr18('Chế độ đuổi đèn PAR & Barra', 'PAR & Barra Chase Mode')}</span><select data-lmp-parchase="1">${chaseOpts}</select></label>` +
        `<label class="lmp-rp-selrow18"><span>${tr18('Quy luật quạt chùm tia Moving Head', 'Moving Head Beam Fan Law')}</span><select data-lmp-fanlaw="1">${fanOpts}</select></label>` +
        `<label class="lmp-rp-selrow18"><span>${tr18('Mẫu quét tia Laser ILDA 3D', '3D ILDA Laser Scan Pattern')}</span><select data-lmp-laserpat="1">${laserOpts}</select></label>` +
        `</div>` +
        `<label class="lmp-rp-slider18" style="margin-top:6px">` +
        `<span>${tr18('Tốc độ chạy Show (Show Speed)', 'Live Show Speed')} <b id="lmpRpSpeedVal18">${ls.speed.toFixed(1)}x</b></span>` +
        `<input type="range" min="0.2" max="5.0" step="0.1" value="${ls.speed.toFixed(1)}" data-lmp-speed="1">` +
        `</label>` +
        (ls.sfxOn
          ? `<div class="lmp-rp-pyropad18">` +
            `<small>${tr18('Kích hoạt nhanh Pháo & SFX thủ công (Đang bật PHÁO)', 'Quick Manual Pyro Triggers (PYRO Active)')}</small>` +
            `<div class="lmp-rp-pyrobtns18">` +
            `<button type="button" class="btn small" data-lmp-fire="cold_spark_fountain">${tr18('Pháo điện [7]', 'Spark [7]')}</button>` +
            `<button type="button" class="btn small" data-lmp-fire="co2_jet">CO2 [8]</button>` +
            `<button type="button" class="btn small" data-lmp-fire="flame_jet">${tr18('Lửa [9]', 'Flame [9]')}</button>` +
            `<button type="button" class="btn small" data-lmp-fire="confetti_cannon">${tr18('Pháo hoa [0]', 'Aerial [0]')}</button>` +
            `<button type="button" class="btn small primary" data-lmp-fire="all">${tr18('Bắn tất cả', 'Fire All')}</button>` +
            `</div>` +
            `</div>`
          : '') +
        `</div>`
      );
    }

    function bindLmpRightPanelEvents18(box) {
      if (!box || box._lmpRpBound18) return;
      box._lmpRpBound18 = true;

      box.addEventListener('click', (e) => {
        const helpBtn = e.target.closest?.('[data-lmp-help]');
        if (helpBtn) {
          openLmpHelpModal18();
          return;
        }
        const fxBtn = e.target.closest?.('[data-lmp-showfx]');
        if (fxBtn) {
          toggleLiveShowFx18(fxBtn.getAttribute('data-lmp-showfx'));
          return;
        }
        const fireBtn = e.target.closest?.('[data-lmp-fire]');
        if (fireBtn) {
          triggerPyroBurst18(fireBtn.getAttribute('data-lmp-fire'));
          return;
        }
        const sfxDelBtn = e.target.closest?.('[data-rp-sfxdel]');
        if (sfxDelBtn) {
          const id = sfxDelBtn.getAttribute('data-rp-sfxdel');
          S.stageAssets16?.deleteItem?.(id);
          if (window.state?.selectedSfx18 === id) window.state.selectedSfx18 = null;
          window.renderUI?.();
          return;
        }
        const cfg = lumiState.rpConfig18;
        if (!cfg) return;

        const rmNode = e.target.closest?.('[data-rp-remove-idx]');
        if (rmNode) {
          if (cfg.count > 1) {
            cfg.count -= 1;
            const cntLbl = $('lmpRpCountVal18');
            if (cntLbl) cntLbl.textContent = String(cfg.count);
            rebuildBatchConfigurator18({ rebuildInspectorDom: true });
          } else {
            window.toast?.(tr18('Cụm thiết bị cần tối thiểu 1 đơn vị (bấm Huỷ nếu muốn xoá hết).', 'Batch requires at least 1 unit (click Cancel to remove all).'), 3200, 'warn');
          }
          return;
        }
        const mountBtn = e.target.closest?.('[data-rp-mount]');
        if (mountBtn) {
          cfg.mountZone = mountBtn.getAttribute('data-rp-mount') || 'overhead';
          rebuildBatchConfigurator18({ rebuildInspectorDom: true });
          return;
        }
        const layoutBtn = e.target.closest?.('[data-rp-parlayout]');
        if (layoutBtn) {
          cfg.parLayout = layoutBtn.getAttribute('data-rp-parlayout') || 'linear';
          if (cfg.parLayout === 'u_shape' && cfg.count < 6) cfg.count = 6;
          rebuildBatchConfigurator18({ rebuildInspectorDom: true });
          return;
        }
        const testFireBtn = e.target.closest?.('[data-rp-testfire]');
        if (testFireBtn) {
          triggerPyroBurst18('all');
          return;
        }
        const attachTrussBtn = e.target.closest?.('[data-rp-attachtruss]');
        if (attachTrussBtn) {
          const items = Array.isArray(S.stageAssets16?.items) ? S.stageAssets16.items : [];
          const trussIt = items.find((it) => it && it._lmpBatchId18 === cfg.batchId) || items[0];
          const res = attachFixturesToTruss18({ trussId: trussIt?.id, fixtureKind: 'beam', count: 6 });
          window.renderUI?.();
          window.toast?.(tr18(`Đã gắn ${res.attachedCount} đèn Beam lên đà Truss (${res.trussId}).`, `Attached ${res.attachedCount} Beam fixtures to Truss (${res.trussId}).`));
          return;
        }
        const cancelBtn = e.target.closest?.('[data-rp-cancel]');
        if (cancelBtn) {
          removeBatchItems18(cfg.batchId);
          lumiState.rpConfig18 = null;
          window._lmpRpConfigSig18 = '';
          window.renderUI?.();
          renderLmpToolbox18();
          window.toast?.(tr18('Đã huỷ và gỡ cụm thiết bị vừa chọn.', 'Cancelled and removed equipment batch.'));
          return;
        }
        const confirmBtn = e.target.closest?.('[data-rp-confirm]');
        if (confirmBtn) {
          lumiState.rpConfig18 = null;
          window._lmpRpConfigSig18 = '';
          window.renderUI?.();
          renderLmpToolbox18();
          window.toast?.(tr18('Đã xác nhận cụm thiết bị trên sân khấu 3D.', 'Confirmed equipment batch on 3D stage.'));
        }
      });

      box.addEventListener('change', (e) => {
        const parSel = e.target.closest?.('[data-lmp-parchase]');
        if (parSel) {
          setParChaseMode18(parSel.value);
          return;
        }
        const fanSel = e.target.closest?.('[data-lmp-fanlaw]');
        if (fanSel) {
          setBeamFanLaw18(fanSel.value);
          return;
        }
        const laserSel = e.target.closest?.('[data-lmp-laserpat]');
        if (laserSel) {
          setLaserPattern18(laserSel.value);
          return;
        }
        const sfxPosInp = e.target.closest?.('[data-rp-sfxpos]');
        if (sfxPosInp && window.state?.selectedSfx18) {
          const axis = Number(sfxPosInp.getAttribute('data-rp-sfxpos')) || 0;
          const sfxItem = S.stageAssets16?.items?.find?.((x) => x.id === window.state.selectedSfx18);
          if (sfxItem && Array.isArray(sfxItem.pos)) {
            sfxItem.pos[axis] = clamp18(Number(sfxPosInp.value) || 0, -50, 50);
            S.stageAssets16?.syncItemMeshes?.(sfxItem);
            window.renderLists?.();
          }
          return;
        }
        const cfg = lumiState.rpConfig18;
        if (!cfg) return;
        const symChk = e.target.closest?.('[data-rp-sym]');
        if (symChk) {
          cfg.symmetry = Boolean(symChk.checked);
          if (cfg.symmetry && cfg.count < 2) cfg.count = 2;
          rebuildBatchConfigurator18({ rebuildInspectorDom: true });
        }
      });

      box.addEventListener('input', (e) => {
        const spdInput = e.target.closest?.('[data-lmp-speed]');
        if (spdInput) {
          setLiveShowSpeed18(spdInput.value);
          const lbl = $('lmpRpSpeedVal18');
          if (lbl) lbl.textContent = `${liveShow18.speed.toFixed(1)}x`;
          return;
        }
        const cfg = lumiState.rpConfig18;
        if (!cfg) return;
        const spanInp = e.target.closest?.('[data-rp-span]');
        if (spanInp) {
          cfg.spanM = clamp18(Number(spanInp.value) || 8, 2, 24);
          const lbl = $('lmpRpSpanVal18');
          if (lbl) lbl.textContent = `${cfg.spanM.toFixed(1)}m`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const cntInp = e.target.closest?.('[data-rp-count]');
        if (cntInp) {
          cfg.count = Math.max(1, Math.min(24, Math.round(Number(cntInp.value) || 1)));
          const lbl = $('lmpRpCountVal18');
          if (lbl) lbl.textContent = String(cfg.count);
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const zoomInp = e.target.closest?.('[data-rp-zoom]');
        if (zoomInp) {
          cfg.zoomDeg = clamp18(Number(zoomInp.value) || 18, 4, 60);
          const lbl = $('lmpRpZoomVal18');
          if (lbl) lbl.textContent = `${cfg.zoomDeg}°`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const panInp = e.target.closest?.('[data-rp-pan]');
        if (panInp) {
          cfg.panOffsetDeg = clamp18(Number(panInp.value) || 0, -60, 60);
          const lbl = $('lmpRpPanVal18');
          if (lbl) lbl.textContent = `${cfg.panOffsetDeg}°`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const tiltInp = e.target.closest?.('[data-rp-tilt]');
        if (tiltInp) {
          cfg.tiltOffsetDeg = clamp18(Number(tiltInp.value) || 0, -45, 45);
          const lbl = $('lmpRpTiltVal18');
          if (lbl) lbl.textContent = `${cfg.tiltOffsetDeg}°`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const colInp = e.target.closest?.('[data-rp-color]');
        if (colInp) {
          cfg.color = colInp.value || '#38bdf8';
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const scaleInp = e.target.closest?.('[data-rp-scale]');
        if (scaleInp) {
          cfg.scale = clamp18(Number(scaleInp.value) || 1, 0.4, 2.5);
          const lbl = $('lmpRpScaleVal18');
          if (lbl) lbl.textContent = `${cfg.scale.toFixed(2)}x`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const posYInp = e.target.closest?.('[data-rp-posy]');
        if (posYInp) {
          cfg.offsetY = clamp18(Number(posYInp.value) || 0, -4, 8);
          const lbl = $('lmpRpPosYVal18');
          if (lbl) lbl.textContent = `${cfg.offsetY.toFixed(1)}m`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const posZInp = e.target.closest?.('[data-rp-posz]');
        if (posZInp) {
          cfg.offsetZ = clamp18(Number(posZInp.value) || 0, -8, 10);
          const lbl = $('lmpRpPosZVal18');
          if (lbl) lbl.textContent = `${cfg.offsetZ.toFixed(1)}m`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const scrWInp = e.target.closest?.('[data-rp-scrw]');
        if (scrWInp) {
          cfg.widthM = clamp18(Number(scrWInp.value) || 4, 1, 24);
          const lbl = $('lmpRpScrWVal18');
          if (lbl) lbl.textContent = `${cfg.widthM.toFixed(1)}m`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const scrHInp = e.target.closest?.('[data-rp-scrh]');
        if (scrHInp) {
          cfg.heightM = clamp18(Number(scrHInp.value) || 2.5, 0.5, 12);
          const lbl = $('lmpRpScrHVal18');
          if (lbl) lbl.textContent = `${cfg.heightM.toFixed(1)}m`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
          return;
        }
        const curveInp = e.target.closest?.('[data-rp-curve]');
        if (curveInp) {
          cfg.curveDegPerCab = clamp18(Number(curveInp.value) || 0, -15, 15);
          const lbl = $('lmpRpCurveVal18');
          if (lbl) lbl.textContent = `${cfg.curveDegPerCab}°`;
          rebuildBatchConfigurator18({ rebuildInspectorDom: false });
        }
      });
    }

    function renderLmpRightPanelSection18() {
      if (_suppressRpInspectorRebuild18) return;
      const box = $('inspectorContent');
      if (!box) return;
      bindLmpRightPanelEvents18(box);
      const cfg = lumiState.rpConfig18;
      const isLightingStep = (window.state?.step || 'stage') === 'lighting';
      if (!cfg && !isLightingStep) return;

      const existingCfg = $('lmpRpConfigCard18');
      existingCfg?.remove?.();
      const existingFx = $('lmpRpFxEngineCard18');
      existingFx?.remove?.();
      box.querySelectorAll?.('.lmp-rp-sfxcard18')?.forEach?.((el) => el?.remove?.());

      const htmlParts = [];
      if (cfg) htmlParts.push(buildLmpConfigCardHtml18(cfg));
      if (isLightingStep) htmlParts.push(buildLmpLightingFxEngineHtml18());
      if (htmlParts.length) {
        box.insertAdjacentHTML?.('afterbegin', htmlParts.join(''));
      }
    }

    function hookRightPanelInspector18() {
      if (window._lmpInspectorHooked18 || typeof window.renderInspector !== 'function') return;
      window._lmpInspectorHooked18 = true;
      const prevRenderInspector18 = window.renderInspector;
      window.renderInspector = function (...args) {
        if (_suppressRpInspectorRebuild18) return;
        const out = prevRenderInspector18.apply(this, args);
        renderLmpRightPanelSection18();
        return out;
      };
      if (S.renderInspector) S.renderInspector = window.renderInspector;
    }

    function installLmpToolbox18() {
      installLmpLiveShowDock18();
      hookRightPanelInspector18();
      const host = $('viewport') || document.querySelector?.('.left-panel .object-section');
      if (!host || $('lmpToolbox18')) return;
      const box = document.createElement('div');
      box.id = 'lmpToolbox18';
      box.className = 'lmp-toolbox18 is-collapsed';
      host.appendChild?.(box);

      box.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest?.('[data-lmp-toggle]');
        if (toggleBtn) {
          lmpCollapsed18 = !lmpCollapsed18;
          renderLmpToolbox18();
          return;
        }
        const dockToggleBtn = e.target.closest?.('[data-lmp-docktoggle]');
        if (dockToggleBtn) {
          toggleLiveShowDock18();
          return;
        }
        const startBtn = e.target.closest?.('[data-lmp-start]');
        if (startBtn) {
          toggleLiveShow18();
          return;
        }
        const modeBtn = e.target.closest?.('[data-lmp-showmode]');
        if (modeBtn) {
          setLiveShowMode18(modeBtn.getAttribute('data-lmp-showmode'));
          return;
        }
        const showFxBtn = e.target.closest?.('[data-lmp-showfx]');
        if (showFxBtn) {
          toggleLiveShowFx18(showFxBtn.getAttribute('data-lmp-showfx'));
          return;
        }
        const tabBtn = e.target.closest?.('[data-lmp-tab]');
        if (tabBtn) {
          const nextTab = tabBtn.getAttribute('data-lmp-tab') || 'structure';
          if (!lmpCollapsed18 && lmpActiveTab18 === nextTab) {
            lmpCollapsed18 = true;
          } else {
            lmpActiveTab18 = nextTab;
            lmpCollapsed18 = false;
          }
          const targetStep = nextTab === 'screens' ? 'mapping' : nextTab === 'structure' ? 'stage' : 'lighting';
          if (window.state && window.state.step !== targetStep) {
            window.state.step = targetStep;
            window.renderUI?.();
          }
          renderLmpToolbox18();
          return;
        }
        const structBtn = e.target.closest?.('[data-lmp-struct]');
        if (structBtn) {
          openToolboxConfigurator18('structure', structBtn.getAttribute('data-lmp-struct'));
          renderLmpToolbox18();
          return;
        }
        const lightBtn = e.target.closest?.('[data-lmp-light]');
        if (lightBtn) {
          openToolboxConfigurator18('lighting', lightBtn.getAttribute('data-lmp-light'));
          return;
        }
        const pyroBtn = e.target.closest?.('[data-lmp-pyro]');
        if (pyroBtn) {
          openToolboxConfigurator18('pyro', pyroBtn.getAttribute('data-lmp-pyro'));
          return;
        }
        const screenBtn = e.target.closest?.('[data-lmp-screen]');
        if (screenBtn) {
          openToolboxConfigurator18('screens', screenBtn.getAttribute('data-lmp-screen'));
          return;
        }
        const dmxBtn = e.target.closest?.('[data-lmp-dmx]');
        if (dmxBtn) {
          const act = dmxBtn.getAttribute('data-lmp-dmx');
          if (act === 'strobe') toggleLiveShowFx18('strobe');
          else if (act === 'blinders') toggleLiveShowFx18('blinders');
          else if (act === 'laser') toggleLiveShowFx18('laser');
          else if (act === 'bo') toggleLiveShowFx18('bo');
          else if (act === 'full') toggleLiveShowFx18('full');
          else if (act === 'freeze') {
            toggleFreezeDmx18();
            renderLmpToolbox18();
          }
          return;
        }
        const modalBtn = e.target.closest?.('[data-lmp-modal]');
        if (modalBtn) {
          const mk = modalBtn.getAttribute('data-lmp-modal');
          if (mk === 'dmx') openDmxProgrammerModal18();
          else if (mk === 'templates') openStageTemplatesModal();
          else if (mk === 'structure') openStructureConfigModal18();
          else if (mk === 'audio') openAudioWorkstationModal18();
          else if (mk === 'pixelpower') openPixelPowerWorkstationModal18();
          else if (mk === 'warehouse') openWarehouseModal18();
          else if (mk === 'blueprints') openEngineeringBlueprintModal18();
          return;
        }
        const actionBtn = e.target.closest?.('[data-lmp-action]');
        if (actionBtn) {
          const ak = actionBtn.getAttribute('data-lmp-action');
          if (ak === 'screencap') {
            if (lumiState.screenCapture18?.active && lumiState.screenCapture18.sourceType === 'screen') stopLiveScreenCapture18();
            else startLiveScreenCapture18({ sourceType: 'screen', fitMode: lumiState.screenCapture18?.fitMode || 'cover' });
          } else if (ak === 'webcamcap') {
            if (lumiState.screenCapture18?.active && lumiState.screenCapture18.sourceType === 'webcam') stopLiveScreenCapture18();
            else startLiveScreenCapture18({ sourceType: 'webcam', fitMode: lumiState.screenCapture18?.fitMode || 'cover' });
          } else if (ak === 'capfit') {
            lumiState.screenCapture18.fitMode = lumiState.screenCapture18.fitMode === 'contain' ? 'cover' : 'contain';
            renderLmpToolbox18();
          } else if (ak === 'par_u_contour') {
            const res = deployParWallContour18({ layout: 'u_contour_3wall', presetId: 'wedding_gold', countPerWall: 6, autoSnapWalls: true });
            window.renderUI?.();
            window.toast?.(tr18(`Đã bố trí ${res.totalAdded} đèn PAR LED chữ U dọc 3 vách hội trường.`, `Deployed ${res.totalAdded} PAR LED fixtures along 3-wall U-contour.`));
          }
          return;
        }
        const fireBtn = e.target.closest?.('[data-lmp-fire]');
        if (fireBtn) {
          const fk = fireBtn.getAttribute('data-lmp-fire');
          if (fk === 'safety') {
            const safety = computeSfxSafetyZones({ venueEnv: 'indoor' });
            window.toast?.(
              safety.violations.length
                ? tr18(`Cảnh báo An toàn Pyro: ${safety.violations[0].message}`, `Pyro Safety Warning: ${safety.violations[0].message}`)
                : tr18(`An toàn Pyro đạt chuẩn (${safety.zones.length} thiết bị).`, `Pyro safety clearances OK (${safety.zones.length} units).`),
              4500,
              safety.violations.length ? 'warn' : 'ok'
            );
          } else {
            triggerPyroBurst18(fk);
          }
        }
      });

      box.addEventListener('input', (e) => {
        const spdInput = e.target.closest?.('[data-lmp-speed]');
        if (spdInput) {
          setLiveShowSpeed18(spdInput.value);
        }
      });

      renderLmpToolbox18();
    }

    window.addEventListener?.('ledstudio:locale', () => {
      lumiState.lang = document.documentElement.dataset.locale === 'en' ? 'en' : 'vi';
      updateTopbarBadge18();
      if ($('aiChat18')) renderChat18();
      if ($('lmpToolbox18')) renderLmpToolbox18();
      if ($('lmpLiveShowDock18')) renderLmpLiveShowDock18();
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
      computeEngineeringRider,
      computeSfxSafetyZones,
      computeSfxConsumablesBom,
      computePhotometricFootprint,
      buildStructurePreviewSvg,
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
      setAiEnabled18,
      openBomAndQuoteModal,
      openLiveShowModal,
      openBillingModal,
      getWalletUrl18,
      syncAccount18,
      stageSets: STAGE_SETS18,
      applyStageSet18,
      buildStagePreviewEntries18,
      renderStageTemplatePreviewDataUrl18,
      refreshTemplateModalPreviews18,
      seedDefaultStageDemo18,
      addToolboxStructure18,
      addToolboxLighting18,
      addToolboxPyroSfx18,
      addToolboxScreen18,
      openToolboxConfigurator18,
      openBatchConfigurator18,
      removeBatchItems18,
      buildChainDiagramSvg18,
      buildLmpConfigCardHtml18,
      buildLmpLightingFxEngineHtml18,
      rebuildBatchConfigurator18,
      renderLmpRightPanelSection18,
      isSuppressingInspectorRebuild18: () => _suppressRpInspectorRebuild18,
      openLmpHelpModal18,
      getLmpFxSelectOptions18,
      triggerPyroBurst18,
      buildGeometricLedMesh18,
      renderLmpToolbox18,
      installLmpToolbox18,
      liveShow18,
      startLiveShow18,
      stopLiveShow18,
      toggleLiveShow18,
      setLiveShowMode18,
      setLiveShowSpeed18,
      setParChaseMode18,
      setBeamFanLaw18,
      setLaserPattern18,
      toggleAutoCamera18,
      toggleLiveShowFx18,
      getStageSfxNozzles18,
      spawnNozzleParticles18,
      evalPyroChoreoGate18,
      isIndoorAerialRestricted18,
      launchAerialPyro18,
      detonateAerialShell18,
      stepParticlesAndShells18,
      tickLiveShow18,
      drawWebglVolumetricExtras18,
      renderLiveShowOverlay18,
      toggleLiveShowDock18,
      renderLmpLiveShowDock18,
      installLmpLiveShowDock18,
      quinticSmooth18,
      samplePaletteGlide18,
      evalBeamFanLaw18,
      evalParChaseEngine18,
      evalBlinderThermalFlash18,
      evalFrontKeylightCct18,
      evalStrobePulse18,
      evalLaserScanPattern18,
      evalScreenHaloBleed18,
      stepAutoCameraDirector18,
      camTourShots18: LMP_CAM_TOUR_SHOTS18,
      // Phase A — 3D Lighting Studio, Volumetric Effects, DMX Programmer & Broadcast/ILDA Audit
      assignFixtureGroup18,
      computeParUplightChase18,
      computePixelBarCurtainCells18,
      drawRotatingFloorGobo18,
      drawParabolicWallScallop18,
      toggleFreezeDmx18,
      applyDmxGroupProgrammer18,
      computeBroadcastAndIldaAudit18,
      exportChamsysMagicQCsv18,
      exportTrussClampTapeCsv18,
      openDmxProgrammerModal18,
      // Phase B — Structure Config, Mirror Floor, Live Symmetry 3D & Crowd Bounce
      stairLayouts18: EN13814_STAIR_LAYOUTS18,
      computeModularDeckAndLayher18,
      enforceLiveSymmetry3D18,
      applyStructureConfig18,
      drawMirrorDeckReflections18,
      drawOrganicCrowdBounce18,
      openStructureConfigModal18,
      // Phase C — 3D Audio & Line Array Calibration Workstation #1..#25
      audioBrandPresets18: AUDIO_BRAND_PRESETS18,
      computeLineArrayJCurve18,
      exportPinSplayCsv18,
      exportAudioSystem3dJson18,
      computeSubwooferTopology18,
      computeAudioDiagnostics18,
      compareAudioSystemsAB18,
      renderSplHeatmapCanvas18,
      drawAudioWaveFlowOverlay18,
      openAudioWorkstationModal18,
      // Phase D — 2D Pixel Mapper & Venue Outlet Power Comparator
      venueOutletSpecs18: VENUE_OUTLET_SPECS18,
      compareVenueOutlets18,
      openPixelPowerWorkstationModal18,
      // Phase E — My Warehouse, RMA, B2B Cross-Rent, 5-Sheet Blueprints & Screen Capture
      setWarehouseRmaLock18,
      computeWarehouseLogisticsAndShortage18,
      fitStageToWarehouseStock18,
      exportCrossRentCsv18,
      openWarehouseModal18,
      blueprintViews18: BLUEPRINT_VIEWS18,
      renderEngineeringBlueprintSheet18,
      exportEngineeringBlueprintPack18,
      openEngineeringBlueprintModal18,
      computeLiveCaptureFitRect18,
      startLiveScreenCapture18,
      stopLiveScreenCapture18,
      sanitizeStructureConfig18,
      buildVenueArchitectureMeshes18,
      parAtmospherePresets18: PAR_ATMOSPHERE_PRESETS18,
      deployParWallContour18,
      attachFixturesToTruss18
    };
    S.lumiCommercial18 = S.lumi18;
  } catch (err) {
    console.error('LumiStage V18 init error:', err);
  }
})();
