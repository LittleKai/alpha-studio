# Third-party provenance

Runtime dependencies are Mediabunny and an inline subset of Lucide icons, loaded locally on demand for offline export. No installer, build script, CDN, telemetry or remote media source is used by the exporter.

- **Mediabunny 1.65.0**, https://github.com/Vanilagy/mediabunny, MPL-2.0, unmodified browser IIFE `dist/bundles/mediabunny.min.cjs` renamed to `mediabunny-1.65.0.js`. Copyright and MPL notice remain in the bundle; full license: `Mediabunny-LICENSE.txt`. Exact covered source is available in https://registry.npmjs.org/mediabunny/-/mediabunny-1.65.0.tgz and at https://github.com/Vanilagy/mediabunny/tree/cd6612380c7e3f1261d74b9b550e6fc3b65a53bc . Bundle SHA-256: `e3277201c2c7c1351fd74402c93962cad3ba1c49f50091733465430c97903935`.
- **WebAV**, https://github.com/WebAV-Tech/WebAV/tree/42dd6fd65ccbda39c729265c14aab56ac4d28235, MIT, Copyright (c) 2023 风痕. The `ready / tick(time in microseconds) / destroy` boundary in `packages/av-cliper/src/clips/iclip.ts` informed the independently implemented local video adapter. No WebAV runtime is bundled. License: `WebAV-LICENSE.txt`.
- **maxrects-packer**, https://github.com/soimy/maxrects-packer/tree/86046856faaca67532c1841e2e8ce8c2017ffdbd, MIT, Copyright (c) 2017 Shen Yiming. Efficiency and user-data-boundary tests informed atlas conservation, padding and immutable-input checks. The existing packing algorithm is retained; no maxrects runtime is bundled. License: `maxrects-packer-LICENSE.txt`.

Research source pin for Mediabunny was `aa5923124db643ff865c756a1558c2d1d37ae9bd`; the released bundle above has its own explicit gitHead. Audit scope, incomplete automatic scans and the user's authorized manual-review exception are recorded in `docs/superpowers/plans/2026-11-03-three-repo-integration.md`.

- **Lucide 1.68.0** (`lucide-static`), https://lucide.dev, ISC. 54 unmodified icon paths are inlined as `<symbol>` elements in `index.html` (`#iconSprite`) and referenced with `icon(name)` from `js/core/02-mapping-spatial.js`. No font, script or network request. License: `lucide-LICENSE.txt`.
- **MediaPipe Tasks Vision 0.10.14** (`@mediapipe/tasks-vision@0.10.14`), https://github.com/google-ai-edge/mediapipe, Apache-2.0, Copyright 2023 The MediaPipe Authors. Local offline runtime and model tasks stored in `js/vendor/mediapipe/`:
  - `js/vendor/mediapipe/vision_bundle.mjs` — SHA-256: `e77f281f9619150d937023c355bae170e9120e3b9e43f1e23a2a7bee07197669`
  - `js/vendor/mediapipe/wasm/vision_wasm_internal.js` — SHA-256: `9440cf0cc0cea21800e31581ec32aeedcc5fbf9df4509796bbc7d3f99e52ab9c`
  - `js/vendor/mediapipe/wasm/vision_wasm_internal.wasm` — SHA-256: `f82a8e6c05e08a44cc9f9e7ec5f845935bcbb1b1500ebe8c2f4812fb4e2917dc`
  - `js/vendor/mediapipe/pose_landmarker_lite.task` — SHA-256: `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`
  - `js/vendor/mediapipe/hand_landmarker.task` — SHA-256: `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1`
  Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).
- **Mocapy**, https://github.com/justinjohn0306/Mocapy/tree/c249615db6663c8490d50280b8e46c37caf065e2, MIT License, Copyright (c) 2026 Justin John. Selective algorithm port in `js/modules/v19-video-dance-mocap.js` (`detect_browser.html`, `pipeline.py`, `solve/wrist.py`, `solve/legs.py`, `solve/root.py`, `solve/fingers.py`, `export/bvh.py`).
- **video-to-3d-mocap**, https://github.com/cg960/video-to-3d-mocap/tree/cb52a6991090aeeace827af99f8574b218be7b7d, MIT License, Copyright (c) 2026 cg960. Selective algorithm port in `js/modules/v19-video-dance-mocap.js` (`mocap/skeleton.py`, `mocap/temporal.py`, `mocap/exporters.py`, `mocap/backends/__init__.py`, `blender_scripts/retarget_in_blender.py`, `mocap/tracking.py::postprocess_tracks`).
- **toyxyz_RGBMocap**, https://github.com/toyxyz/toyxyz_RGBMocap/tree/9617daed16ebc943cd00b358d29329deba4529d8, MIT License, Copyright (c) 2026 toyxyz. Selective algorithm port in `js/core/01-math-webgl.js` and `js/modules/v19-video-dance-mocap.js` (`mocap/pear/foot_lock.py`, `mocap/pear/temporal_filter.py`, `mocap/contact_trajectory.py`, `mocap/multilevel_contacts.py`, `mocap/hand_lock.py`, `mocap/palm_contact.py`, `mocap/anatomical_ik.py`, `mocap/mixamo_rig.py`, `mocap/source_bvh.py`, `mocap/biped_bvh.py`, `mocap/export_options.py`, `mocap/bvh_bind.py`, `mocap/bone_overlay.py`, `mocap/foot_contacts.py`, `mocap/footlock_editor.py`).
- **instanthmr**, https://github.com/naturalpad-studio/instanthmr/tree/eac9ca7c2cca3e02461636d88206a251ee613c5e, Apache-2.0 License, Copyright 2026 NaturalPad Studio. Selective algorithm port in `js/modules/v19-video-dance-mocap.js` (`instanthmr/smoothing.py::_Tracks`, `instanthmr/pipeline.py::keypoint_box`, `tools/build_contact_floor.py::fit_floor`).

---

## waveform-playlist (Audio Peaks, Fade Curves, Musical Ticks & Linked Annotation Boundary Math)

- **Source**: `https://github.com/naomiaro/waveform-playlist/tree/d620a1d202b8033ec038b8c87cd307c3d7d2557b` (`packages/webaudio-peaks/src/index.ts`, `packages/core/src/utils/peaksGenerator.ts`, `packages/dawcore/src/utils/peak-rendering.ts`, `packages/core/src/fades.ts`, `packages/core/src/utils/musicalTicks.ts`, `packages/core/src/utils/beatsAndBars.ts`, `packages/core/src/utils/meterDetection.ts`, `packages/core/src/annotations/boundaries.ts`, `packages/dawcore/src/utils/annotation-playing.ts`, `packages/core/src/clipTimeHelpers.ts`)
- **Target**: `js/core/04-sequencer-director.js`, `js/core/06-rundown-choreo-boot.js`, `js/modules/v13-timecode-laser-mount.js`
- **License**: MIT License — Copyright (c) 2015 Naomi. Full license text in `js/vendor/waveform-playlist-LICENSE.txt`.

---

## wavesurfer.js (Spatially Indexed Column-Grid Marker Stacking & Pointer-Anchored Zoom)

- **Source**: `https://github.com/katspaugh/wavesurfer.js/tree/66742bade56d51c43ce881dfdc1c107ba6acaaeb` (`src/label-stacking.ts`, `src/renderer-utils.ts`, and zoom/minimap UI interaction patterns in `src/plugins/zoom.ts` & `src/plugins/minimap.ts`)
- **Target**: `js/core/04-sequencer-director.js`, `js/modules/v13-timecode-laser-mount.js`
- **License**: BSD-3-Clause License — Copyright (c) 2012-2023, katspaugh and contributors. Full license text and disclaimer in `js/vendor/wavesurfer-LICENSE.txt`.

---

## 3d-director-desk (Cubic-Bezier Route Easing, Hold Windows & Constant-Speed Arc-Length Timing)

- **Source**: `https://github.com/xiaozangao/3d-director-desk/tree/a6c931cd36d8263d986706f74ab4efe9d5151959` (fork of `jiguang132/storyai-3d-director-desk`, `src/editor/schema/routeTiming.ts`, `src/editor/motion/routeCustomEasingPresets.ts`, `src/editor/motion/ObjectMotionTransport.tsx`)
- **Target**: `js/core/06-rundown-choreo-boot.js`
- **License**: MIT License — Copyright (c) 2026 YZ. Full license text in `js/vendor/3d-director-desk-LICENSE.txt`.
