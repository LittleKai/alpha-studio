import * as THREE from 'three';

/**
 * Bộ GLSL ShaderMaterial chuyên dụng cho Sa bàn 3D Dark Living Storyboard:
 * 1. Mặt phẳng bản vẽ CAD kỹ thuật chống răng cưa (`fwidth`) + vành chia độ Vernier xoay quanh tâm sân khấu.
 * 2. Màn hình LED cong chạy sóng aurora HDR + ma trận điểm ảnh P2.6.
 * 3. Đài phun hạt pháo điện lạnh Cold Spark (`THREE.Points`) tính quỹ đạo parabol hoàn toàn trên GPU Vertex Shader.
 */

export function createBlueprintFloorMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            uTime: { value: 0 },
            uCadIntensity: { value: 0.6 },
            uShowIntensity: { value: 0 },
            uStageCenter: { value: new THREE.Vector2(0, -4.2) },
            uColorCyan: { value: new THREE.Color(0x61e8ff) },
            uColorViolet: { value: new THREE.Color(0x8b7dff) },
            uColorAmber: { value: new THREE.Color(0xffb454) },
        },
        vertexShader: /* glsl */ `
            varying vec3 vWorldPos;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWorldPos = wp.xyz;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform float uCadIntensity;
            uniform float uShowIntensity;
            uniform vec2 uStageCenter;
            uniform vec3 uColorCyan;
            uniform vec3 uColorViolet;
            uniform vec3 uColorAmber;

            varying vec3 vWorldPos;

            float gridLine(vec2 coord, float spacing, float thickness) {
                vec2 p = coord / spacing;
                vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p);
                float d = min(grid.x, grid.y);
                return 1.0 - smoothstep(0.0, thickness, d);
            }

            float ringLine(float dist, float radius, float thickness) {
                float fw = max(fwidth(dist), 0.004);
                return 1.0 - smoothstep(0.0, thickness * fw, abs(dist - radius));
            }

            void main() {
                vec2 xz = vWorldPos.xz;
                float fadeDist = length(xz * vec2(0.021, 0.021));
                float radialMask = smoothstep(1.0, 0.34, fadeDist);
                if (radialMask <= 0.002) discard;

                float farDamp = mix(1.0, 0.58, smoothstep(8.0, 28.0, length(xz)));
                float minorG = gridLine(xz, 0.75, 1.05) * 0.085 * farDamp;
                float majorG = gridLine(xz, 3.0, 1.30) * 0.21 * farDamp;

                vec2 rel = xz - uStageCenter;
                float r = length(rel);
                float ang = atan(rel.y, rel.x);

                float r1 = ringLine(r, 3.55, 1.5);
                float r2 = ringLine(r, 4.75, 1.6);
                float r3 = ringLine(r, 6.45, 1.5);

                float ticks = smoothstep(0.68, 0.96, cos(ang * 36.0 - uTime * 0.7));
                float vernierBand = smoothstep(0.14, 0.0, abs(r - 6.85)) * ticks * 0.52;

                float sonar = sin(r * 2.4 - uTime * 3.1) * 0.5 + 0.5;
                float stageAura = exp(-r * 0.33) * (0.11 + uShowIntensity * 0.26 * (0.65 + 0.35 * sonar));

                vec3 col = uColorCyan * (minorG + majorG + (r1 + r3) * 0.46 * uCadIntensity + vernierBand * uCadIntensity);
                col += uColorViolet * (r2 * 0.42 * uCadIntensity);
                col += mix(uColorCyan, uColorAmber, 0.36) * stageAura;

                float alpha = clamp(
                    (minorG + majorG + (r1 + r2 + r3 + vernierBand) * 0.55 * uCadIntensity + stageAura * 0.68) * radialMask,
                    0.0,
                    0.74
                );

                gl_FragColor = vec4(col, alpha);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
    });
}

export function createCurvedLedShaderMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
            uTime: { value: 0 },
            uShowIntensity: { value: 0.35 },
            uPanelSeed: { value: 0 },
            uColorBase: { value: new THREE.Color(0x0b1930) },
            uColorCyan: { value: new THREE.Color(0x5eeeff) },
            uColorViolet: { value: new THREE.Color(0x9080ff) },
            uColorCoral: { value: new THREE.Color(0xf67866) },
            uColorAmber: { value: new THREE.Color(0xffbe5c) },
        },
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform float uShowIntensity;
            uniform float uPanelSeed;
            uniform vec3 uColorBase;
            uniform vec3 uColorCyan;
            uniform vec3 uColorViolet;
            uniform vec3 uColorCoral;
            uniform vec3 uColorAmber;

            varying vec2 vUv;

            void main() {
                vec2 uv = vUv;
                float t = uTime * 1.55 + uPanelSeed * 1.7;

                float w1 = sin(uv.x * 6.5 + t) * 0.17 + cos(uv.x * 12.0 - t * 0.85) * 0.07;
                float w2 = cos(uv.x * 5.2 - t * 1.2) * 0.16 + sin(uv.x * 10.5 + t * 0.65) * 0.06;

                float band1 = exp(-abs(uv.y - (0.54 + w1)) * 7.0);
                float band2 = exp(-abs(uv.y - (0.42 + w2)) * 8.0);
                float horizon = exp(-abs(uv.y - 0.20) * 5.0) * (0.45 + 0.55 * uShowIntensity);

                float radialDist = length((uv - vec2(0.5, 0.46)) * vec2(1.2, 1.0));
                float pulseRing = exp(-abs(radialDist - fract(uTime * 0.30) * 0.88) * 14.0) * uShowIntensity;

                vec3 col = uColorBase * 0.5;
                col += uColorCyan * (band1 * 0.85 + pulseRing * 0.78);
                col += uColorViolet * (band2 * 0.88 + horizon * 0.45);
                col += mix(uColorCoral, uColorAmber, uv.x) * (horizon * 0.68 + band1 * band2 * 0.85) * (0.35 + 0.65 * uShowIntensity);

                vec2 ledCell = fract(uv * vec2(56.0, 32.0));
                float pitchMask = 0.82 + 0.18 * smoothstep(0.08, 0.25, min(ledCell.x, ledCell.y));
                col *= pitchMask;

                float edgeFrame = max(
                    smoothstep(0.03, 0.0, min(uv.x, 1.0 - uv.x)),
                    smoothstep(0.04, 0.0, min(uv.y, 1.0 - uv.y))
                );
                col += uColorAmber * edgeFrame * (0.35 + 0.55 * uShowIntensity);

                gl_FragColor = vec4(col * (0.56 + 0.74 * uShowIntensity), 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
    });
}

export function createColdSparkPointsMaterial(dpr: number): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uTime: { value: 0 },
            uIntensity: { value: 0 },
            uDpr: { value: dpr },
        },
        vertexShader: /* glsl */ `
            attribute vec3 aSeed;
            uniform float uTime;
            uniform float uIntensity;
            uniform float uDpr;

            varying float vLife;

            void main() {
                float cycle = fract(uTime * (1.35 + aSeed.z * 0.65) + aSeed.x);
                vLife = 1.0 - cycle;

                float angle = aSeed.y * 6.2831853;
                float spread = (0.06 + aSeed.z * 0.22) * cycle;
                float height = (cycle * 2.15 - cycle * cycle * 0.82) * (0.45 + 0.55 * uIntensity);

                vec3 animatedPos = position + vec3(
                    cos(angle) * spread,
                    max(0.0, height),
                    sin(angle) * spread
                );

                vec4 mvPos = modelViewMatrix * vec4(animatedPos, 1.0);
                gl_PointSize = (3.2 + 4.8 * vLife) * uDpr * step(0.02, uIntensity);
                gl_Position = projectionMatrix * mvPos;
            }
        `,
        fragmentShader: /* glsl */ `
            uniform float uIntensity;
            varying float vLife;

            void main() {
                if (uIntensity <= 0.02) discard;
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;

                float core = smoothstep(0.5, 0.0, d);
                vec3 sparkCol = mix(vec3(1.0, 0.58, 0.18), vec3(1.75, 1.5, 1.1), core * vLife);
                gl_FragColor = vec4(sparkCol, core * vLife * uIntensity);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `,
    });
}
