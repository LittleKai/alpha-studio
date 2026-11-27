# Third-Party Notices & Clean-Room Architecture Provenance

ALPHA Creative LED Studio operates 100% locally/offline without remote telemetry or external runtime CDN dependencies. Vendor license files and pinned bundle hashes are maintained in `js/vendor/NOTICE.md` and `js/vendor/*-LICENSE.txt`.

## Clean-Room Technique & Mathematical Reference Statement (V20 Stage Upgrade)

During the 2026-11-14 architectural audit (`docs/plans/2026-11-14-master-stage-studio-upgrade-plan.md`), two local reference archives were statically inspected under a strict **Clean-Room boundary (`extraction_set = []`)**:

- **`saltline_project`** (`manifest sha256:e9facfb0fa6056f8332f24f0fa741fef7ca0eb363442bf7bd7484a3560a43d18`) — static architectural inspection only; **0 bytes of source code, shaders, CSS, or assets were copied**.
- **`lanternfall`** (`manifest sha256:ef50a958da7a6cc6ba3bb51e5c3f30b084bf5db976a1fa491ad98a626b8468db`, MIT License) — static architectural inspection only; **0 bytes of source code, shaders, audio, or assets were copied**.

All stage rendering, procedural GPU material baking (`js/modules/v20-stage-pbr-baker.js`), SFX instancing, choreography IK, Web Audio DSP, and compact CAD UI features in ALPHA Creative LED Studio were written from scratch in native WebGL2 (`GLSL ES 3.00`), 32-byte `pos+normal+uv` VBOs, V0.4 metric stage coordinates, and classic `<script src>` (`window.STUDIO`) modules, drawing on standard published graphics, robotics, and signal-processing literature:

1. **Oblique Near-Plane Clipping for Planar Reflections:** Eric Lengyel, *"Oblique View Frustum Depth Projection and Clipping"*, Journal of Game Development, Vol. 1, Issue 2, 2005.
2. **Contact-Hardening Soft Shadows (PCSS), Vogel Disk Sampling & Receiver-Plane Depth Bias:** Randima Fernando, *"Percentage-Closer Soft Shadows"*, ACM SIGGRAPH Sketches, 2005; Zachary Wartell et al. / Andrew Lauritzen, *"Sample Distribution Shadow Maps"*, 2011.
3. **Tangent-Free Surface Gradient Bump Mapping:** Morten S. Mikkelsen, *"Bump Mapping Unparametrized Surfaces on the GPU"*, 2010; *"Surface Gradient-Based Bump Mapping Framework"*, JCGT, 2020.
4. **Normal-Variance Specular Anti-Aliasing:** Michael Toksvig, *"Mipmapping Normal Maps"*, Journal of Graphics Tools, 2005; Anton Kaplanyan et al., *"Filtering Distributions of Normals for Shading Antialiasing"*, HPG 2016.
5. **Closed-Form Analytical Point-Light Airlight & Exponential Height Fog:** Bo Sun, Ravi Ramamoorthi, Srinivasa G. Narasimhan, Shree K. Nayar, *"A Practical Analytic Single Scattering Model for Real Time Rendering"*, ACM TOG (SIGGRAPH), 2005; Inigo Quilez, analytic height-fog integrals.
6. **AgX Display Rendering Transform & Karis HDR Downsample Filter:** Troy Sobotka, AgX color transform (MIT); Brian Karis, *"Next Generation Post Processing in Call of Duty: Advanced Warfare"*, SIGGRAPH Advances in Real-Time Rendering, 2014.
7. **Centripetal Catmull-Rom Splines ($\alpha = 0.5$):** Cem Yuksel, Scott Schaefer, John Keyser, *"Parameterization and Applications of Catmull-Rom Curves"*, CAD, 2011.
8. **Equal-Power Crossfade & 2nd-Order Butterworth Bi-Quad Filtering:** Julius O. Smith III, *Introduction to Digital Filters with Audio Applications*, CCRMA, Stanford University.

## Bundled & Selective-Port Third-Party Notices

Full provenance, commit pins, SHA-256 checksums, and license texts (MIT, BSD-3-Clause, ISC, Apache-2.0, MPL-2.0) for **Mediabunny 1.65.0**, **Lucide 1.68.0**, **MediaPipe Tasks Vision 0.10.14**, **Meshopt Decoder**, **Mocapy** (MIT), **video-to-3d-mocap** (MIT), **toyxyz_RGBMocap** (MIT), **instanthmr** (Apache-2.0), **waveform-playlist** (MIT), **wavesurfer.js** (BSD-3-Clause), **3d-director-desk** (MIT), **WebAV** (MIT), and **maxrects-packer** (MIT) are documented in `js/vendor/NOTICE.md` alongside their respective `js/vendor/*-LICENSE.txt` files.

## Auto-to-Music Show Generation Provenance & Clean-Room References

1. **`Destinhue/dsh-better-ears`** (`https://github.com/Destinhue/dsh-better-ears@faa33351583f0740990cf401a9ce8d16cb9e0887`, `MIT` License) — algorithmic reference and pure-JS DSP adaptation for log-mel spectral flux onset detection, parabolic sub-frame interpolation, octave-rivalry coherence, Ellis DP beat tracking, dual Kick/Chroma mod-4 downbeat selection, and 300–3500 Hz vocal-band share gating (`js/core/04-sequencer-director.js`, `js/core/05-lighting-desk.js`).
2. **`JohnBreault/xlights-mcp-server`** (`https://github.com/JohnBreault/xlights-mcp-server@6cc8d03c6a7c501e403cd15f8f424c38611265f7`, `MIT` License) — algorithmic reference for `O(T)` prefix-sum checkerboard novelty segmentation, downbeat snapping, multi-scale `0.25s/2s/8s` energy slopes, `2/3/4` meter inference, and 3-layer role-based multi-system show orchestration (`Bed`, `Motion`, `Drop-Accent`, anti-repeat memory, palette cycling, vocal suppression).
3. **`audiojs/beat`** (`https://github.com/audiojs/beat@ba1a223805421e248a7a7ea87b41d9dfde1ba08a`, `MIT` License) — algorithmic reference for raised-cosine `±10%` `gridPhase` alignment, Davies & Plumbley half-tempo octave disambiguation (`>130 BPM`), and synthetic multi-genre regression test patterns (`tests/bvh-tempo.test.mjs`, `tests/auto-music-show.test.mjs`).
4. **Clean-Room Signal-Processing & Control Reference (`LedFx/LedFx@28ad9d514501fc5b52178565e2c84f748543ff08`, `GPL-3.0`, strict `extraction_set = []`)** — `0` bytes of GPL source code or assets were copied. Standard mathematical formulations for dual-slope asymmetric exponential smoothing (`ExpFilter` rise/decay), adaptive peak normalization, transient delta, `200ms` strobe cooldown, and priority frequency-band hysteresis (`switch_time`) were authored cleanly from scratch in vanilla JavaScript (`js/core/04-sequencer-director.js`, `js/modules/v13-timecode-laser-mount.js`, `js/modules/v14-fx-timecode.js`, `js/modules/matrix/matrix143.js`).

## V22 Lighting Console Interop, GDTF/MVR & SMPTE LTC Provenance

1. **MIT / Apache-2.0 Algorithmic & Protocol References (Clean Vanilla-JS Ports):**
   - `ma2-tc-cut` (`MIT`) — XML `<Timecode>` span cutting and ripple shifting patterns (`js/modules/v18-pro-exporters-local.js::cutMaTimecodeXml`).
   - `grandma2-hub`, `gma2-plugins` (`MIT`), `dj-lights` (`MIT`), and `grandma2-mcp` (`MIT`/`Apache-2.0`) — grandMA2 `3.9.60` `FixtureLayer` 1-based `<Address>`, `xsi:schemaLocation`, split `<Macro>` (`Delete Dmx /nc`, `Assign Fixture At Dmx`, `Move3D`, `page.id`), REAPER `.rpp` marker extraction, Type-1 SMF `.mid` (`480 PPQ`), 100-block fixture audits, pre-export lint checks (`js/modules/v18-pro-exporters-local.js`, `js/modules/v22-show-linter.js`), and preview-only moving-head `MotorSim22` velocity/accel inertia + `snapdark` slewing dimmer (`js/core/05-lighting-desk.js`, distinct from advisory/eye-hazard telemetry).
2. **Strict Clean-Room Specification & Architectural References (`extraction_set = []`, `0` bytes copied):**
   - **`ASLS-org/studio`** (`78d32ccac08e02e8489c0b8a7bc6a73e5e8feea5`, `GPL-3.0`, strict `extraction_set = []`) — `0` bytes of GPL code copied. Clean-room ES2022 re-implementation of bounded GDTF 1.2 ZIP/XML parsing, O(1) `Int16Array(256)` capability LUTs, CIE `xyY` → sRGB conversion, `GDTFStore22`, multi-cell DMX encoding, non-destructive pan/tilt calibration, and Y-up 8-tool rig placement + non-enumerable symmetry (`js/modules/v22-fixture-profile-ir.js`, `js/modules/v22-show-linter.js`, `js/core/02-mapping-spatial.js`, `js/modules/v18-lumistage-commercial.js::cellDmx22`).
   - **V22 Phase 3 clean-room UI, choreography & WebGL2 beam optics (`ASLS-org/studio` architectural reference & published graphics/control math, strict `extraction_set = []`)** — `0` bytes of GPL code copied. Clean-room implementations of 29 standard cubic-Bezier easing curves (`CURVE_PRESETS_22`, `solveCubicBezier9`), 17 pan/tilt shapes (`PT_SHAPES_22`), 13 color palettes (`COLOR_PRESETS_22`), `waveDir`/`mirrorHalf`/`pwmWidth`/`equalizeDeg`, centroid/transient-driven Auto-Music planning + ILDA Laser timeline blackout/gate/ray choreography, Canvas 2D `scopes22`, and `BEAM_TEXELS_22=13` `RGBA32F` beam state + `beamRolloff22` (`1 - exp(-peak)`) + mip-LOD `TEXTURE_2D_ARRAY` gobo sampling (`textureLod`) + `<= 16`-facet prism (`js/core/05-lighting-desk.js`, `js/modules/v12-fixture-desk.js`, `js/modules/v13-timecode-laser-mount.js`, `js/modules/v14-fx-timecode.js`, `js/modules/v18-lumistage-commercial.js`, `js/modules/recovery142.js`, `js/core/01-math-webgl.js`, `js/core/06-rundown-choreo-boot.js`).
   - **`nightfall-lightdesk`** (`MPL-2.0`, strict `extraction_set = []`) — `0` bytes of MPL code copied. Standard **DIN SPEC 15801 (MVR 1.6)** `C^T · R_yup · C` basis rotation conjugation, multi-entry MVR+GDTF ZIP closure (`js/modules/v18-pro-exporters-local.js::exportLightingMvr18`), bounded local MVR 1.6 ZIP/XML importer with `R_yup` inverse conversion (`js/modules/v22-fixture-profile-ir.js::parseMvrBounded`), ANSI **E1.31 (sACN)** `Stream_Terminated` (`0x40` x3) and Art-Net 4 `OpSync`/`OpPoll`/`OpPollReply` (`scripts/dmx-udp-bridge.mjs`).
   - **SMPTE ST 12M-1 / Published Standard (`libltc` `LGPL` architectural reference only, `extraction_set = []`)** — `0` bytes of LGPL code copied. Zero-dependency SMPTE 12M 80-bit biphase-mark WAV encoder (mono, stereo Y-cable, batch ZIP) and clean-room JavaScript `LtcDecoder` + `TimecodeFollower` (`js/modules/v22-ltc-timecode.js`).
   - **`QLC+` (`GPL-2.0`):** Explicitly deferred / not integrated.

### MIT License Reference Text (Applicable to MIT-Licensed Upstream Algorithmic References)

```text
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
