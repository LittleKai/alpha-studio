# Third-party provenance

Only Mediabunny is a runtime dependency, loaded locally on demand for offline export. No installer, build script, CDN, telemetry or remote media source is used by the exporter.

- **Mediabunny 1.65.0**, https://github.com/Vanilagy/mediabunny, MPL-2.0, unmodified browser IIFE `dist/bundles/mediabunny.min.cjs` renamed to `mediabunny-1.65.0.js`. Copyright and MPL notice remain in the bundle; full license: `Mediabunny-LICENSE.txt`. Exact covered source is available in https://registry.npmjs.org/mediabunny/-/mediabunny-1.65.0.tgz and at https://github.com/Vanilagy/mediabunny/tree/cd6612380c7e3f1261d74b9b550e6fc3b65a53bc . Bundle SHA-256: `e3277201c2c7c1351fd74402c93962cad3ba1c49f50091733465430c97903935`.
- **WebAV**, https://github.com/WebAV-Tech/WebAV/tree/42dd6fd65ccbda39c729265c14aab56ac4d28235, MIT, Copyright (c) 2023 风痕. The `ready / tick(time in microseconds) / destroy` boundary in `packages/av-cliper/src/clips/iclip.ts` informed the independently implemented local video adapter. No WebAV runtime is bundled. License: `WebAV-LICENSE.txt`.
- **maxrects-packer**, https://github.com/soimy/maxrects-packer/tree/86046856faaca67532c1841e2e8ce8c2017ffdbd, MIT, Copyright (c) 2017 Shen Yiming. Efficiency and user-data-boundary tests informed atlas conservation, padding and immutable-input checks. The existing packing algorithm is retained; no maxrects runtime is bundled. License: `maxrects-packer-LICENSE.txt`.

Research source pin for Mediabunny was `aa5923124db643ff865c756a1558c2d1d37ae9bd`; the released bundle above has its own explicit gitHead. Audit scope, incomplete automatic scans and the user's authorized manual-review exception are recorded in `docs/superpowers/plans/2026-11-03-three-repo-integration.md`.
