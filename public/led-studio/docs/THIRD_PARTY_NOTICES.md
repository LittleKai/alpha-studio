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
