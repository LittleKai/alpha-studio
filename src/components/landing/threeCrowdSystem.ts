import * as THREE from 'three';

/**
 * Hệ thống khán giả 3D GPU-instanced có animation & đạo cụ cầm tay chuẩn `tools/led-stage-studio`:
 * - Port trực tiếp bộ 4 archetype khán giả từ `04-sequencer-director.js` (`buildCrowdArchetypeData`):
 *   0: Mũ lưỡi trai + Lightstick LED phát sáng
 *   1: Tóc dài + Smartphone sáng màn hình quay/cổ vũ
 *   2: Tóc đuôi ngựa + Bảng LED cổ vũ cầm tay
 *   3: Vòng tay phát sáng hai tay (vỗ tay / giơ hai tay theo nhịp)
 * - Hỗ trợ cả hàng VIP ngồi ghế (`seated = true`) và hàng khán giả đứng (`seated = false`),
 *   với vertex shader `evalCrowdVertex` (`01-math-webgl.js`) mô phỏng nhún theo beat, lắc hông,
 *   gật đầu, xoay thân và vẫy tay quanh khớp vai + hiệu ứng sóng màu lightstick HDR bloom.
 */

interface CrowdBuf {
    p: number[];
    n: number[];
    partSub: number[];
    matAo: number[];
}

const STAGE_CENTER_Z = -4.2;

function crowdHash(i: number, seed: number): number {
    const x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
}

function norm3(x: number, y: number, z: number): [number, number, number] {
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
}

function pushCrowdTri(
    buf: CrowdBuf,
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
    nx: number, ny: number, nz: number,
    partId: number, subFlag: number, matId: number, ao: number,
): void {
    buf.p.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    buf.n.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    buf.partSub.push(partId, subFlag, partId, subFlag, partId, subFlag);
    buf.matAo.push(matId, ao, matId, ao, matId, ao);
}

function addCrowdBox(
    buf: CrowdBuf,
    c: [number, number, number],
    s: [number, number, number],
    partId: number,
    subFlag: number,
    matId: number,
    ao = 1,
): void {
    const [x, y, z] = c;
    const hx = s[0] * 0.5;
    const hy = s[1] * 0.5;
    const hz = s[2] * 0.5;
    const faces: [[number, number, number], number[], number[], number[], number[]][] = [
        [[0, 0, 1], [x - hx, y - hy, z + hz], [x + hx, y - hy, z + hz], [x + hx, y + hy, z + hz], [x - hx, y + hy, z + hz]],
        [[0, 0, -1], [x + hx, y - hy, z - hz], [x - hx, y - hy, z - hz], [x - hx, y + hy, z - hz], [x + hx, y + hy, z - hz]],
        [[1, 0, 0], [x + hx, y - hy, z + hz], [x + hx, y - hy, z - hz], [x + hx, y + hy, z - hz], [x + hx, y + hy, z + hz]],
        [[-1, 0, 0], [x - hx, y - hy, z - hz], [x - hx, y - hy, z + hz], [x - hx, y + hy, z + hz], [x - hx, y + hy, z - hz]],
        [[0, 1, 0], [x - hx, y + hy, z + hz], [x + hx, y + hy, z + hz], [x + hx, y + hy, z - hz], [x - hx, y + hy, z - hz]],
        [[0, -1, 0], [x - hx, y - hy, z - hz], [x + hx, y - hy, z - hz], [x + hx, y - hy, z + hz], [x - hx, y - hy, z + hz]],
    ];
    for (const [nrm, a, b, d, e] of faces) {
        pushCrowdTri(buf, a[0], a[1], a[2], b[0], b[1], b[2], d[0], d[1], d[2], nrm[0], nrm[1], nrm[2], partId, subFlag, matId, ao);
        pushCrowdTri(buf, a[0], a[1], a[2], d[0], d[1], d[2], e[0], e[1], e[2], nrm[0], nrm[1], nrm[2], partId, subFlag, matId, ao);
    }
}

interface LoftRing {
    x: number;
    y: number;
    z: number;
    rx: number;
    rz: number;
    ao?: number;
}

function addCrowdLoft(
    buf: CrowdBuf,
    rings: LoftRing[],
    segs: number,
    partId: number,
    subFlag: number,
    matId: number,
    capBot = true,
    capTop = true,
): void {
    for (let j = 0; j < rings.length - 1; j++) {
        const r1 = rings[j];
        const r2 = rings[j + 1];
        for (let i = 0; i < segs; i++) {
            const t1 = (i / segs) * Math.PI * 2;
            const t2 = ((i + 1) / segs) * Math.PI * 2;
            const c1 = Math.cos(t1);
            const s1 = Math.sin(t1);
            const c2 = Math.cos(t2);
            const s2 = Math.sin(t2);

            const a: [number, number, number] = [r1.x + c1 * r1.rx, r1.y, r1.z + s1 * r1.rz];
            const b: [number, number, number] = [r1.x + c2 * r1.rx, r1.y, r1.z + s2 * r1.rz];
            const d: [number, number, number] = [r2.x + c2 * r2.rx, r2.y, r2.z + s2 * r2.rz];
            const e: [number, number, number] = [r2.x + c1 * r2.rx, r2.y, r2.z + s1 * r2.rz];

            const dy = r2.y - r1.y;
            const dr = (r1.rx - r2.rx + (r1.rz - r2.rz)) * 0.5;
            const ny = Math.abs(dy) > 1e-5 ? dr / dy : 0;
            const n1 = norm3(c1 / Math.max(0.02, r1.rx), ny, s1 / Math.max(0.02, r1.rz));
            const n2 = norm3(c2 / Math.max(0.02, r1.rx), ny, s2 / Math.max(0.02, r1.rz));
            const ao1 = r1.ao ?? 1;
            const ao2 = r2.ao ?? 1;

            const tris: [[number, number, number], [number, number, number], number][] = [
                [a, n1, ao1], [b, n2, ao1], [d, n2, ao2],
                [a, n1, ao1], [d, n2, ao2], [e, n1, ao2],
            ];
            for (const [pt, nr, ao] of tris) {
                buf.p.push(pt[0], pt[1], pt[2]);
                buf.n.push(nr[0], nr[1], nr[2]);
                buf.partSub.push(partId, subFlag);
                buf.matAo.push(matId, ao);
            }
        }
    }
    if (capBot && rings.length) {
        const r = rings[0];
        for (let i = 0; i < segs; i++) {
            const t1 = (i / segs) * Math.PI * 2;
            const t2 = ((i + 1) / segs) * Math.PI * 2;
            pushCrowdTri(
                buf,
                r.x, r.y, r.z,
                r.x + Math.cos(t2) * r.rx, r.y, r.z + Math.sin(t2) * r.rz,
                r.x + Math.cos(t1) * r.rx, r.y, r.z + Math.sin(t1) * r.rz,
                0, -1, 0,
                partId, subFlag, matId, r.ao ?? 0.8,
            );
        }
    }
    if (capTop && rings.length) {
        const r = rings[rings.length - 1];
        for (let i = 0; i < segs; i++) {
            const t1 = (i / segs) * Math.PI * 2;
            const t2 = ((i + 1) / segs) * Math.PI * 2;
            pushCrowdTri(
                buf,
                r.x, r.y, r.z,
                r.x + Math.cos(t1) * r.rx, r.y, r.z + Math.sin(t1) * r.rz,
                r.x + Math.cos(t2) * r.rx, r.y, r.z + Math.sin(t2) * r.rz,
                0, 1, 0,
                partId, subFlag, matId, r.ao ?? 1,
            );
        }
    }
}

function buildCrowdArchetypeData(arch: number, isSeated: boolean): CrowdBuf {
    const aIdx = ((arch | 0) % 4 + 4) % 4;
    const buf: CrowdBuf = { p: [], n: [], partSub: [], matAo: [] };
    const dy = isSeated ? -0.44 : -0.22;

    if (isSeated) {
        addCrowdBox(buf, [0, 0.43, -0.01], [0.48, 0.06, 0.40], 6, 0, 6, 0.95);
        addCrowdBox(buf, [0, 0.70, -0.21], [0.44, 0.48, 0.05], 6, 0, 6, 0.90);
        for (const sx of [-0.20, 0.20]) {
            addCrowdBox(buf, [sx, 0.215, -0.02], [0.032, 0.43, 0.36], 7, 0, 7, 0.85);
        }
        addCrowdLoft(buf, [
            { x: 0, y: 0.44, z: 0, rx: 0.182, rz: 0.116, ao: 0.76 },
            { x: 0, y: 0.72, z: 0, rx: 0.218, rz: 0.122, ao: 0.95 },
            { x: 0, y: 0.95, z: 0, rx: 0.105, rz: 0.078, ao: 0.96 },
        ], 6, 0, 0, 0, false, false);
    } else {
        addCrowdLoft(buf, [
            { x: 0, y: 0.0, z: 0, rx: 0.176, rz: 0.112, ao: 0.66 },
            { x: 0, y: 0.22, z: 0, rx: 0.190, rz: 0.120, ao: 0.76 },
        ], 6, 0, 0, 1, true, false);
        addCrowdLoft(buf, [
            { x: 0, y: 0.22, z: 0, rx: 0.190, rz: 0.120, ao: 0.78 },
            { x: 0, y: 0.60, z: 0, rx: 0.198, rz: 0.124, ao: 0.90 },
            { x: 0, y: 1.08, z: 0, rx: 0.238, rz: 0.132, ao: 1.03 },
            { x: 0, y: 1.17, z: 0, rx: 0.110, rz: 0.082, ao: 0.96 },
        ], 6, 0, 0, 0, false, false);
    }

    if (aIdx === 0) addCrowdBox(buf, [0, 1.38 + dy, -0.02], [0.28, 0.055, 0.175], 0, 0, 1, 0.92);
    else if (aIdx === 1) addCrowdBox(buf, [0, 1.40 + dy, -0.03], [0.29, 0.06, 0.185], 0, 0, 1, 0.88);

    // Đầu & cổ (partId 1, matId 2)
    addCrowdLoft(buf, [
        { x: 0, y: 1.40 + dy, z: 0, rx: 0.052, rz: 0.048, ao: 0.88 },
        { x: 0, y: 1.56 + dy, z: 0.010, rx: 0.108, rz: 0.102, ao: 1.00 },
        { x: 0, y: 1.66 + dy, z: 0.006, rx: 0.104, rz: 0.098, ao: 1.03 },
        { x: 0, y: 1.72 + dy, z: 0, rx: 0.054, rz: 0.052, ao: 0.98 },
    ], 6, 1, 0, 2, false, true);

    // Tóc / mũ lưỡi trai / tóc đuôi ngựa (partId 2)
    if (aIdx === 0) {
        addCrowdLoft(buf, [
            { x: 0, y: 1.62 + dy, z: -0.004, rx: 0.114, rz: 0.108, ao: 0.94 },
            { x: 0, y: 1.69 + dy, z: -0.006, rx: 0.098, rz: 0.094, ao: 1.02 },
            { x: 0, y: 1.74 + dy, z: -0.006, rx: 0.042, rz: 0.042, ao: 1.0 },
        ], 6, 2, 0, 3, false, true);
        addCrowdBox(buf, [0, 1.63 + dy, 0.110], [0.155, 0.018, 0.100], 2, 0, 3, 0.96);
    } else if (aIdx === 1) {
        addCrowdLoft(buf, [
            { x: 0, y: 1.50 + dy, z: -0.035, rx: 0.128, rz: 0.100, ao: 0.86 },
            { x: 0, y: 1.65 + dy, z: -0.022, rx: 0.124, rz: 0.112, ao: 0.98 },
            { x: 0, y: 1.74 + dy, z: -0.015, rx: 0.064, rz: 0.060, ao: 1.0 },
        ], 6, 2, 0, 1, false, true);
    } else if (aIdx === 2) {
        addCrowdLoft(buf, [
            { x: 0, y: 1.58 + dy, z: -0.012, rx: 0.116, rz: 0.108, ao: 0.92 },
            { x: 0, y: 1.72 + dy, z: -0.012, rx: 0.078, rz: 0.076, ao: 1.02 },
        ], 6, 2, 0, 3, false, true);
        addCrowdBox(buf, [0, 1.61 + dy, -0.122], [0.078, 0.085, 0.078], 2, 0, 3, 0.92);
    } else {
        addCrowdLoft(buf, [
            { x: 0, y: 1.60 + dy, z: -0.010, rx: 0.115, rz: 0.108, ao: 0.92 },
            { x: 0, y: 1.73 + dy, z: -0.005, rx: 0.088, rz: 0.088, ao: 1.04 },
        ], 6, 2, 0, 3, false, true);
    }

    // Hai cánh tay trái/phải (partId 3 L, partId 4 R)
    const sySh = isSeated ? 0.87 : 1.08;
    const syEl = isSeated ? 0.67 : 0.84;
    const syWr = isSeated ? 0.49 : 0.62;
    for (const sign of [-1, 1]) {
        const pid = sign < 0 ? 3 : 4;
        const sx = sign * 0.248;
        addCrowdLoft(buf, [
            { x: sx, y: syWr + 0.09, z: 0.01, rx: 0.042, rz: 0.042, ao: 0.92 },
            { x: sx, y: syEl, z: 0, rx: 0.054, rz: 0.054, ao: 0.98 },
            { x: sx * 0.95, y: sySh + 0.02, z: 0, rx: 0.064, rz: 0.060, ao: 1.02 },
        ], 5, pid, 0, 0, false, true);
        addCrowdLoft(buf, [
            { x: sx, y: syWr, z: 0.015, rx: 0.035, rz: 0.033, ao: 0.92 },
            { x: sx, y: syWr + 0.09, z: 0.01, rx: 0.040, rz: 0.040, ao: 0.98 },
        ], 5, pid, 0, 2, true, false);
    }

    // Đạo cụ cầm tay phát sáng (partId 5, matId 4 = phát sáng, matId 5 = cán/thân)
    if (aIdx === 0) {
        // Lightstick LED cầm tay phải
        addCrowdBox(buf, [0.248, syWr - 0.02, 0.055], [0.028, 0.034, 0.095], 5, 0, 5, 0.90);
        addCrowdBox(buf, [0.248, syWr - 0.065, 0.175], [0.046, 0.046, 0.155], 5, 0, 4, 1.0);
    } else if (aIdx === 1) {
        // Smartphone sáng màn hình cầm tay phải
        addCrowdBox(buf, [0.248, syWr - 0.02, 0.095], [0.070, 0.014, 0.125], 5, 0, 5, 0.90);
        addCrowdBox(buf, [0.248, syWr - 0.028, 0.095], [0.058, 0.004, 0.106], 5, 0, 4, 1.0);
    } else if (aIdx === 2) {
        // Bảng LED cổ vũ cầm tay phải
        addCrowdBox(buf, [0.248, syWr - 0.025, 0.085], [0.022, 0.024, 0.145], 5, 0, 5, 0.90);
        addCrowdBox(buf, [0.248, syWr - 0.065, 0.235], [0.24, 0.020, 0.165], 5, 0, 4, 1.0);
    } else {
        // Cặp vòng tay / găng LED phát sáng hai tay
        addCrowdBox(buf, [0.248, syWr + 0.04, 0.012], [0.076, 0.052, 0.076], 5, 0, 4, 1.0);
        addCrowdBox(buf, [-0.248, syWr + 0.04, 0.012], [0.076, 0.052, 0.076], 5, 1, 4, 1.0);
    }

    return buf;
}

function createCrowdMaterial(isSeated: boolean): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.fog,
            {
                uTime: { value: 0 },
                uCrowdBPM: { value: 124 },
                uCrowdEnergy: { value: 0.45 },
                uCrowdSeated: { value: isSeated ? 1 : 0 },
                uBaseTint: { value: new THREE.Color(0x2b5580) },
                uAccent: { value: new THREE.Color(0x5eeeff) },
                uScreenColA: { value: new THREE.Color(0x5eeeff) },
                uScreenColB: { value: new THREE.Color(0x9080ff) },
            },
        ]),
        vertexShader: /* glsl */ `
            attribute vec2 aPartSub;
            attribute vec2 aMatAo;
            attribute vec4 aCrowdXform;
            attribute vec4 aCrowdStyle;
            attribute vec4 aCrowdAnim;

            uniform float uTime;
            uniform float uCrowdBPM;
            uniform float uCrowdEnergy;
            uniform float uCrowdSeated;
            uniform vec3 uBaseTint;
            uniform vec3 uAccent;
            uniform vec3 uScreenColA;
            uniform vec3 uScreenColB;

            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vBaseCol;
            varying vec3 vEmissiveCol;
            varying float vRoughness;

            #include <fog_pars_vertex>

            vec3 crowdRotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, p.y * c + p.z * s, -p.y * s + p.z * c); }
            vec3 crowdRotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
            vec3 crowdRotZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z); }

            void main() {
                float partId = aPartSub.x;
                float subFlag = aPartSub.y;
                float phase = aCrowdAnim.x;
                float excite = clamp(aCrowdAnim.y, 0.0, 1.5);
                float persona = floor(aCrowdAnim.z + 0.5);
                float lag = fract(aCrowdStyle.z * 7.31) * 0.16;
                float rate = max(0.5, uCrowdBPM / 60.0);
                float beatPh = uTime * rate - lag + phase * 0.14 - aCrowdXform.z * 0.042;
                float beatWave = beatPh * 6.2831853;
                float halfWave = beatPh * 3.1415926;
                float energyAct = clamp(uCrowdEnergy, 0.0, 1.0);
                float hyp = mix(0.22, 1.0, energyAct) * excite;
                float beatGlow = 0.5 + 0.5 * sin(beatWave);

                float bounce = 0.0, swayX = 0.0, swayZ = 0.0, nod = 0.0, twist = 0.0;
                if (uCrowdSeated > 0.5) {
                    swayX = sin(uTime * 1.35 + phase) * (0.010 + 0.020 * hyp);
                    swayZ = cos(uTime * 1.8 + phase * 1.3) * (0.008 + 0.015 * hyp);
                    nod = sin(beatWave) * 0.052 * hyp + 0.022 * sin(uTime * 1.4 + phase);
                    twist = sin(uTime * 1.1 + phase) * 0.040 * (0.4 + 0.6 * hyp);
                } else {
                    float jumpBase = pow(0.5 + 0.5 * sin(beatWave), 1.65);
                    bounce = jumpBase * (0.012 + 0.120 * hyp) + (0.5 + 0.5 * sin(uTime * 1.7 + phase)) * 0.006;
                    swayX = sin(halfWave) * 0.022 * (0.45 + 0.55 * hyp);
                    swayZ = cos(uTime * 1.5 + phase) * (0.010 + 0.018 * hyp);
                    nod = sin(beatWave) * 0.065 * hyp + 0.026 * sin(uTime * 1.9 + phase);
                    twist = sin(halfWave) * 0.052 * (0.35 + 0.65 * hyp);
                }

                vec3 lp = position;
                vec3 ln = normal;
                if (partId < 5.5) {
                    float armPitchL = 0.16 + 0.07 * sin(uTime * 1.6 + phase), armRollL = -0.08;
                    float armPitchR = 0.18 + 0.07 * cos(uTime * 1.6 + phase), armRollR = 0.08;
                    float waveAmp = mix(0.26, 1.0, energyAct);
                    if (uCrowdSeated > 0.5) {
                        if (persona < 0.5) {
                            armPitchR = mix(0.95, 1.88, hyp) + sin(beatWave) * 0.30 * waveAmp;
                            armRollR = 0.16 * sin(halfWave);
                        } else if (persona < 1.5) {
                            armPitchR = 1.35 + 0.10 * sin(uTime * 1.2 + phase);
                            armRollR = -0.04;
                        } else if (persona < 2.5) {
                            armPitchR = mix(1.15, 2.05, hyp) + sin(beatWave) * 0.26 * waveAmp;
                            armRollR = 0.26 * sin(halfWave);
                        } else if (persona < 3.5) {
                            armPitchL = mix(0.85, 1.72, hyp) + sin(beatWave + 0.4) * 0.28 * waveAmp;
                            armPitchR = mix(0.85, 1.72, hyp) + sin(beatWave) * 0.28 * waveAmp;
                            armRollL = -0.18 * sin(halfWave);
                            armRollR = 0.18 * sin(halfWave);
                        } else {
                            float reachUp = mix(2.22, 2.72, hyp) + sin(beatWave) * 0.18 * waveAmp;
                            float waveSide = sin(halfWave) * 0.12 * (0.4 + 0.6 * hyp);
                            armPitchL = reachUp; armPitchR = reachUp;
                            armRollL = 0.22 + waveSide; armRollR = -0.22 + waveSide;
                        }
                    } else {
                        if (persona < 0.5) {
                            armPitchR = mix(1.38, 2.56, hyp) + sin(beatWave) * 0.40 * waveAmp;
                            armRollR = 0.24 * sin(halfWave);
                            armPitchL = 0.25 + 0.34 * hyp + sin(beatWave + 1.5) * 0.16 * waveAmp;
                        } else if (persona < 1.5) {
                            armPitchR = 1.54 + 0.14 * sin(uTime * 1.4 + phase);
                            armRollR = -0.06;
                            armPitchL = 0.22 + 0.12 * sin(beatWave) * 0.4;
                        } else if (persona < 2.5) {
                            armPitchR = mix(1.56, 2.62, hyp) + sin(beatWave) * 0.32 * waveAmp;
                            armRollR = 0.36 * sin(halfWave);
                            armPitchL = 0.30 + 0.28 * hyp;
                        } else if (persona < 3.5) {
                            float clap = max(0.0, sin(beatWave));
                            armPitchL = mix(1.12, 2.25, hyp) + clap * 0.38 * waveAmp;
                            armPitchR = mix(1.12, 2.25, hyp) + clap * 0.38 * waveAmp;
                            float clapIn = 0.24 * sin(beatWave) * (1.0 - 0.3 * hyp);
                            armRollL = -0.14 + clapIn;
                            armRollR = 0.14 - clapIn;
                        } else {
                            float reachUp = mix(2.42, 2.92, hyp) + sin(beatWave) * 0.22 * waveAmp;
                            float waveSide = sin(halfWave) * 0.15 * (0.4 + 0.6 * hyp);
                            armPitchL = reachUp; armPitchR = reachUp;
                            armRollL = 0.25 + waveSide; armRollR = -0.25 + waveSide;
                        }
                    }

                    bool attachL = (partId > 2.5 && partId < 3.5) || (partId > 4.5 && partId < 5.5 && subFlag >= 0.5);
                    bool attachR = (partId > 3.5 && partId < 4.5) || (partId > 4.5 && partId < 5.5 && subFlag < 0.5);
                    if (attachL) {
                        vec3 piv = vec3(-0.248, uCrowdSeated > 0.5 ? 0.87 : 1.08, 0.0);
                        vec3 rel = lp - piv;
                        rel = crowdRotX(rel, armPitchL); rel = crowdRotZ(rel, armRollL);
                        ln = crowdRotX(ln, armPitchL); ln = crowdRotZ(ln, armRollL);
                        lp = rel + piv;
                    } else if (attachR) {
                        vec3 piv = vec3(0.248, uCrowdSeated > 0.5 ? 0.87 : 1.08, 0.0);
                        vec3 rel = lp - piv;
                        rel = crowdRotX(rel, armPitchR); rel = crowdRotZ(rel, armRollR);
                        ln = crowdRotX(ln, armPitchR); ln = crowdRotZ(ln, armRollR);
                        lp = rel + piv;
                    } else if (partId > 0.5 && partId < 2.5) {
                        vec3 hpiv = vec3(0.0, uCrowdSeated > 0.5 ? 0.94 : 1.16, 0.0);
                        vec3 rel = lp - hpiv;
                        rel = crowdRotX(rel, -nod); ln = crowdRotX(ln, -nod);
                        lp = rel + hpiv;
                    }

                    float upperW = clamp((lp.y - (uCrowdSeated > 0.5 ? 0.44 : 0.28)) / 0.78, 0.0, 1.0);
                    vec3 hipPiv = vec3(0.0, uCrowdSeated > 0.5 ? 0.44 : 0.26, 0.0);
                    vec3 hrel = lp - hipPiv;
                    hrel = crowdRotY(hrel, twist * upperW); ln = crowdRotY(ln, twist * upperW);
                    lp = hrel + hipPiv;
                    lp.x += swayX * upperW;
                    lp.z += swayZ * upperW;
                    lp.y += bounce;
                }

                lp.x *= aCrowdStyle.x;
                lp.z *= aCrowdStyle.x;
                lp.y *= aCrowdStyle.y;
                ln = normalize(vec3(ln.x / max(0.35, aCrowdStyle.x), ln.y / max(0.35, aCrowdStyle.y), ln.z / max(0.35, aCrowdStyle.x)));
                lp = crowdRotY(lp, aCrowdXform.w) + aCrowdXform.xyz;
                ln = crowdRotY(ln, aCrowdXform.w);

                vec4 wp = modelMatrix * vec4(lp, 1.0);
                vWorldPos = wp.xyz;
                vNormal = normalize(mat3(modelMatrix) * ln);

                float matId = floor(aMatAo.x + 0.5);
                float shade = clamp(aMatAo.y, 0.45, 1.25);
                float shirtS = aCrowdStyle.z;
                float skinS = fract(aCrowdStyle.w);
                float hairS = fract(floor(aCrowdStyle.w * 8.0) / 8.0);
                vec3 palShirt = mix(uBaseTint, mix(vec3(0.18, 0.24, 0.36), vec3(0.58, 0.66, 0.78), fract(shirtS * 2.3)), 0.35 + 0.38 * fract(shirtS * 4.1));
                vec3 accentShirt = mix(uScreenColA * 0.72, uAccent * 0.80, fract(shirtS * 3.7));
                vec3 cShirt = mix(palShirt, accentShirt, 0.36 * step(0.52, fract(shirtS * 5.9)));
                vec3 cTrim = mix(cShirt * 0.55, mix(vec3(0.20, 0.22, 0.28), uScreenColB * 0.6, 0.45), 0.5);
                vec3 cSkin = mix(vec3(0.50, 0.33, 0.24), vec3(0.90, 0.75, 0.63), skinS);
                vec3 cHair = mix(vec3(0.07, 0.06, 0.07), vec3(0.38, 0.24, 0.14), hairS);
                if (hairS > 0.78) cHair = mix(vec3(0.24, 0.30, 0.42), uBaseTint, 0.45);

                vec3 base = cShirt;
                vec3 emis = vec3(0.0);
                float rough = 0.62;
                if (matId < 0.5) {
                    base = cShirt * shade;
                } else if (matId < 1.5) {
                    base = cTrim * shade;
                } else if (matId < 2.5) {
                    base = cSkin * shade;
                    rough = 0.54;
                } else if (matId < 3.5) {
                    base = cHair * shade;
                    rough = 0.48;
                } else if (matId < 4.5) {
                    float waveBand = 0.5 + 0.5 * sin(aCrowdXform.x * 0.75 + aCrowdXform.z * 0.55 - uTime * 3.4 + aCrowdAnim.x);
                    vec3 syncCol = mix(uScreenColA, uScreenColB, waveBand);
                    vec3 propCol = mix(syncCol, uAccent, 0.28);
                    if (persona > 0.5 && persona < 1.5) {
                        propCol = mix(vec3(0.75, 0.88, 1.0), uScreenColA, 0.30);
                        emis = propCol * (1.08 + 0.55 * uCrowdEnergy);
                    } else if (persona > 1.5 && persona < 2.5) {
                        propCol = mix(uAccent, vec3(0.98, 0.52, 0.76), fract(shirtS * 3.1));
                        emis = propCol * (1.25 + 0.85 * beatGlow * max(0.35, uCrowdEnergy));
                    } else {
                        emis = propCol * (1.35 + 1.15 * beatGlow * max(0.35, uCrowdEnergy));
                    }
                    base = propCol * 0.32;
                    rough = 0.22;
                } else if (matId < 5.5) {
                    base = vec3(0.09, 0.10, 0.13) * shade;
                    rough = 0.36;
                } else if (matId < 6.5) {
                    base = vec3(0.12, 0.16, 0.24) * shade;
                    rough = 0.68;
                } else {
                    base = vec3(0.68, 0.52, 0.28) * shade;
                    rough = 0.30;
                }

                vBaseCol = base;
                vEmissiveCol = emis;
                vRoughness = rough;

                vec4 mvPosition = viewMatrix * wp;
                gl_Position = projectionMatrix * mvPosition;
                #include <fog_vertex>
            }
        `,
        fragmentShader: /* glsl */ `
            uniform float uCrowdEnergy;
            uniform vec3 uScreenColA;
            uniform vec3 uScreenColB;

            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vBaseCol;
            varying vec3 vEmissiveCol;
            varying float vRoughness;

            #include <fog_pars_fragment>

            void main() {
                vec3 base = pow(max(vec3(0.0), vBaseCol), vec3(2.2));
                vec3 nrm = normalize(vNormal);
                if (!gl_FrontFacing) nrm = -nrm;

                float hemi = nrm.y * 0.5 + 0.5;
                vec3 hemiCol = mix(vec3(0.03, 0.05, 0.09), vec3(0.38, 0.56, 0.72), hemi);

                vec3 keyDir = normalize(vec3(10.5, 16.5, 11.0));
                float keyNdl = max(0.0, dot(nrm, keyDir));
                vec3 rimDir = normalize(vec3(-11.0, 9.5, -9.5));
                float rimNdl = max(0.0, dot(nrm, rimDir));

                vec3 stageDir = normalize(vec3(0.0, 2.2, -4.2) - vWorldPos);
                float stageNdl = max(0.0, dot(nrm, stageDir));

                vec3 col = base * (hemiCol * 0.78 + vec3(0.86, 0.92, 1.0) * keyNdl * 0.72);
                col += base * vec3(0.55, 0.50, 0.95) * rimNdl * 0.42;
                col += base * mix(uScreenColA, uScreenColB, 0.5) * stageNdl * (0.20 + 0.42 * uCrowdEnergy);
                col += vEmissiveCol;

                gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
                #include <fog_fragment>
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
    });
}

interface CrowdInstance {
    x: number;
    y: number;
    z: number;
    yaw: number;
    sx: number;
    sy: number;
    shirtSeed: number;
    skinHairSeed: number;
    phase: number;
    excite: number;
    persona: number;
    arch: number;
}

function buildCrowdMeshesForPosture(
    instances: CrowdInstance[],
    isSeated: boolean,
): { group: THREE.Group; material: THREE.ShaderMaterial; geometries: THREE.BufferGeometry[] } {
    const group = new THREE.Group();
    const material = createCrowdMaterial(isSeated);
    const geometries: THREE.BufferGeometry[] = [];

    const buckets: CrowdInstance[][] = [[], [], [], []];
    for (const inst of instances) {
        buckets[inst.arch].push(inst);
    }

    for (let arch = 0; arch < 4; arch++) {
        const list = buckets[arch];
        if (list.length === 0) continue;

        const raw = buildCrowdArchetypeData(arch, isSeated);
        const geo = new THREE.InstancedBufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(raw.p, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(raw.n, 3));
        geo.setAttribute('aPartSub', new THREE.Float32BufferAttribute(raw.partSub, 2));
        geo.setAttribute('aMatAo', new THREE.Float32BufferAttribute(raw.matAo, 2));

        const count = list.length;
        const xforms = new Float32Array(count * 4);
        const styles = new Float32Array(count * 4);
        const anims = new Float32Array(count * 4);

        for (let k = 0; k < count; k++) {
            const it = list[k];
            xforms[k * 4] = it.x;
            xforms[k * 4 + 1] = it.y;
            xforms[k * 4 + 2] = it.z;
            xforms[k * 4 + 3] = it.yaw;

            styles[k * 4] = it.sx;
            styles[k * 4 + 1] = it.sy;
            styles[k * 4 + 2] = it.shirtSeed;
            styles[k * 4 + 3] = it.skinHairSeed;

            anims[k * 4] = it.phase;
            anims[k * 4 + 1] = it.excite;
            anims[k * 4 + 2] = it.persona;
            anims[k * 4 + 3] = 0;
        }

        geo.setAttribute('aCrowdXform', new THREE.InstancedBufferAttribute(xforms, 4));
        geo.setAttribute('aCrowdStyle', new THREE.InstancedBufferAttribute(styles, 4));
        geo.setAttribute('aCrowdAnim', new THREE.InstancedBufferAttribute(anims, 4));
        geo.instanceCount = count;

        const mesh = new THREE.Mesh(geo, material);
        mesh.frustumCulled = false;
        group.add(mesh);
        geometries.push(geo);
    }

    return { group, material, geometries };
}

export interface AnimatedCrowdSystem {
    group: THREE.Group;
    update(elapsedSeconds: number, showEnergy: number): void;
    dispose(): void;
}

export function createAnimatedCrowdSystem(): AnimatedCrowdSystem {
    const group = new THREE.Group();
    group.name = 'GRP_AnimatedCrowd';

    const seatedInstances: CrowdInstance[] = [];
    const standingInstances: CrowdInstance[] = [];

    let seedIdx = 0;
    const nextInstance = (
        r: number,
        y: number,
        angle: number,
        baseScale: number,
        isSeated: boolean,
    ): CrowdInstance => {
        const i = seedIdx++;
        const jAngle = (crowdHash(i, 1) - 0.5) * (isSeated ? 0.015 : 0.032);
        const jRad = (crowdHash(i, 2) - 0.5) * (isSeated ? 0.04 : 0.11);
        const ang = angle + jAngle;
        const rad = r + jRad;

        const rPers = crowdHash(i, 9);
        const persona = rPers < 0.30 ? 0 : rPers < 0.42 ? 1 : rPers < 0.56 ? 2 : rPers < 0.80 ? 3 : 4;
        const arch = persona > 3 ? 3 : persona;

        return {
            x: Math.sin(ang) * rad,
            y,
            z: STAGE_CENTER_Z + Math.cos(ang) * rad,
            yaw: Math.PI + ang + (crowdHash(i, 3) - 0.5) * (isSeated ? 0.08 : 0.24),
            sx: baseScale * ((isSeated ? 0.98 : 1.02) + crowdHash(i, 4) * 0.16),
            sy: baseScale * (0.94 + crowdHash(i, 5) * 0.14),
            shirtSeed: crowdHash(i, 6),
            skinHairSeed: (Math.floor(crowdHash(i, 7) * 8) + crowdHash(i, 8) * 0.95) / 8,
            phase: crowdHash(i, 10) * Math.PI * 2,
            excite: 0.65 + crowdHash(i, 11) * 0.80,
            persona,
            arch,
        };
    };

    // Bậc 1 (`y = 0.20`): Khán giả VIP ngồi ghế banquet hai cánh (né B-Stage trung tâm)
    for (const [aStart, aEnd, count] of [
        [-0.86, -0.25, 11],
        [0.25, 0.86, 11],
    ] as const) {
        for (let k = 0; k < count; k++) {
            const u = count > 1 ? k / (count - 1) : 0.5;
            const ang = aStart + (aEnd - aStart) * u;
            seatedInstances.push(nextInstance(4.24, 0.20, ang, 0.50, true));
        }
    }

    // Bậc 2 (`y = 0.38`): 2 hàng khán giả đứng cổ vũ cầm lightstick / điện thoại / bảng LED
    for (const [r, count] of [
        [4.84, 24],
        [5.22, 26],
    ] as const) {
        for (let k = 0; k < count; k++) {
            const u = k / (count - 1);
            const ang = -0.94 + u * 1.88;
            standingInstances.push(nextInstance(r, 0.38, ang, 0.51, false));
        }
    }

    // Bậc 3 (`y = 0.56`): 2 cánh khán giả đứng trên tầng cao (né bục FOH & 2 máy quay trung tâm)
    for (const r of [5.66, 6.04]) {
        for (const [aStart, aEnd, count] of [
            [-1.02, -0.37, 11],
            [0.37, 1.02, 11],
        ] as const) {
            for (let k = 0; k < count; k++) {
                const u = k / (count - 1);
                const ang = aStart + (aEnd - aStart) * u;
                standingInstances.push(nextInstance(r, 0.56, ang, 0.51, false));
            }
        }
    }

    const seatedBuilt = buildCrowdMeshesForPosture(seatedInstances, true);
    const standingBuilt = buildCrowdMeshesForPosture(standingInstances, false);
    group.add(seatedBuilt.group, standingBuilt.group);

    const colA = new THREE.Color(0x5eeeff);
    const colB = new THREE.Color(0x9080ff);
    const colShowB = new THREE.Color(0xff9c54);

    function update(elapsedSeconds: number, showEnergy: number): void {
        const energy = Math.max(0, Math.min(1, showEnergy));
        colB.set(0x9080ff).lerp(colShowB, energy * 0.55);

        for (const mat of [seatedBuilt.material, standingBuilt.material]) {
            mat.uniforms.uTime.value = elapsedSeconds;
            mat.uniforms.uCrowdEnergy.value = energy;
            mat.uniforms.uScreenColA.value.copy(colA);
            mat.uniforms.uScreenColB.value.copy(colB);
        }
    }

    function dispose(): void {
        for (const g of seatedBuilt.geometries) g.dispose();
        for (const g of standingBuilt.geometries) g.dispose();
        seatedBuilt.material.dispose();
        standingBuilt.material.dispose();
    }

    return { group, update, dispose };
}
