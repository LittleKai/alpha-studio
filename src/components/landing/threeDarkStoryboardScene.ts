import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
    evaluateDarkStoryboardFrame,
    loadWithTransientRetry,
} from '../../utils/heroStoryboardTimeline';
import {
    createBlueprintFloorMaterial,
    createColdSparkPointsMaterial,
    createCurvedLedShaderMaterial,
} from './threeStageShaders';
import { createAnimatedCrowdSystem } from './threeCrowdSystem';

/**
 * Điều phối cảnh 3D Isometric Dark Living Storyboard trên Three.js:
 * - Nạp sa bàn `hero-dark-diorama.glb` (sàn studio toàn màn hình, Ziggurat, khay Moodboard, 5 cổng vòm,
 *   6 bảng Storyboard, khán đài cố định, đàn Steinway xoay hướng khán giả, bộ trống, bàn DJ/FOH, loa J-Array, giàn Truss).
 * - Nạp song song 6 nghệ sĩ 66 xương có animation chuyển động thật (`THREE.AnimationMixer` 60fps:
 *   ca sĩ hát, guitar, bass, đánh trống, DJ khuấy động, pianist ngồi đánh đàn) + hệ thống khán giả GPU-instanced
 *   nhún theo nhịp, vẫy lightstick, cầm điện thoại & bảng cổ vũ chuẩn `tools/led-stage-studio`.
 * - Chặng 5 (`Kế hoạch sản xuất`): giữ nguyên mặt sàn sân khấu & khán đài cố định trên bàn vẽ,
 *   diễn hoạt xòe cánh âm học hai bên + hạ tời giàn Truss mái & cụm loa treo J-Array dọc 4 trụ cố định.
 */

const STAGE_CENTER_Z = -4.2;
const FRUSTUM_HALF_H = 6.55;
const MAQUETTE_SCALE = 0.56;

const HERO_DIORAMA_GLB_URL = new URL('../../assets/hero-dark-diorama.glb', import.meta.url).href;
const PERFORMER_URLS = {
    singer: new URL('../../assets/performers/singer.glb', import.meta.url).href,
    guitarist: new URL('../../assets/performers/guitarist.glb', import.meta.url).href,
    bassist: new URL('../../assets/performers/bassist.glb', import.meta.url).href,
    drummer: new URL('../../assets/performers/drummer.glb', import.meta.url).href,
    dj: new URL('../../assets/performers/dj.glb', import.meta.url).href,
    keyboardist: new URL('../../assets/performers/keyboardist.glb', import.meta.url).href,
} as const;

interface RiggedMovingHead {
    yoke: THREE.Object3D;
    head: THREE.Object3D;
    phase: number;
    normIdx: number;
}

export interface ThreeStoryboardController {
    resize(width: number, height: number): void;
    setPointerNormalized(nx: number, ny: number): void;
    updateAndRender(elapsedSeconds: number): number;
    dispose(): void;
}

function disposeSubtree(root: THREE.Object3D): void {
    root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) (mesh as THREE.SkinnedMesh).skeleton.dispose();
            const matList = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of matList) {
                if (!m) continue;
                for (const val of Object.values(m)) {
                    if (val && (val as THREE.Texture).isTexture) {
                        (val as THREE.Texture).dispose();
                    }
                }
                m.dispose();
            }
        }
    });
}

export async function createThreeDarkStoryboardScene(
    renderer: THREE.WebGLRenderer,
    signal?: AbortSignal,
): Promise<ThreeStoryboardController> {
    const extraGeos = new Set<THREE.BufferGeometry>();
    const extraMats = new Set<THREE.Material>();
    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
        extraGeos.add(g);
        return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
        extraMats.add(m);
        return m;
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060d1a);
    scene.fog = new THREE.FogExp2(0x060d1a, 0.019);

    const camera = new THREE.OrthographicCamera(-10, 10, FRUSTUM_HALF_H, -FRUSTUM_HALF_H, 0.1, 120);

    // ─── Ánh sáng Studio 3 điểm + Đèn rửa sân khấu (không dùng chùm tia laser che ban nhạc) ───
    const hemiLight = new THREE.HemisphereLight(0x9ad8fc, 0x050b16, 0.90);
    const keyLight = new THREE.DirectionalLight(0xeef7ff, 1.56);
    keyLight.position.set(10.5, 16.5, 11.0);

    const rimLight = new THREE.DirectionalLight(0x8d7efa, 1.05);
    rimLight.position.set(-11.0, 9.5, -9.5);

    const warmFill = new THREE.DirectionalLight(0xffb962, 0.58);
    warmFill.position.set(7.5, 6.5, -2.5);

    const stageShowLight = new THREE.PointLight(0x5ae6fc, 1.35, 16, 1.35);
    stageShowLight.position.set(0, 2.8, STAGE_CENTER_Z + 0.2);

    const bandWarmSpot = new THREE.PointLight(0xffbe6b, 1.05, 12, 1.4);
    bandWarmSpot.position.set(0, 2.6, STAGE_CENTER_Z + 1.4);

    scene.add(hemiLight, keyLight, rimLight, warmFill, stageShowLight, bandWarmSpot);

    // ─── Nạp song song sa bàn `.glb` và 6 nghệ sĩ rigged có animation ─────────
    const loader = new GLTFLoader();
    const loaded = await Promise.allSettled([
        HERO_DIORAMA_GLB_URL,
        ...Object.values(PERFORMER_URLS),
    ].map((url) => loadWithTransientRetry(() => loader.loadAsync(url), 3, 350)));
    const assets = loaded.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    const failure = loaded.find((result) => result.status === 'rejected');
    if (failure || signal?.aborted) {
        for (const asset of assets) disposeSubtree(asset.scene);
        if (failure) throw failure.reason;
        signal?.throwIfAborted();
    }
    const [gltf, singerGltf, guitaristGltf, bassistGltf, drummerGltf, djGltf, keyboardistGltf] = assets;

    const mixers: THREE.AnimationMixer[] = [];
    let disposeCrowd: (() => void) | undefined;
    let envRenderTarget: THREE.WebGLRenderTarget | undefined;
    let released = false;
    function dispose(): void {
        if (released) return;
        released = true;
        for (const mixer of mixers) mixer.stopAllAction();
        for (const asset of assets) disposeSubtree(asset.scene);
        disposeCrowd?.();
        for (const g of extraGeos) g.dispose();
        for (const m of extraMats) m.dispose();
        extraGeos.clear();
        extraMats.clear();
        envRenderTarget?.dispose();
        scene.clear();
    }

    signal?.addEventListener('abort', dispose, { once: true });
    try {
        // Môi trường phản xạ kim loại cân bằng (~80% so với bản đầu)
        const pmrem = new THREE.PMREMGenerator(renderer);
        const roomEnv = new RoomEnvironment();
        try {
            envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
        } finally {
            roomEnv.dispose();
            pmrem.dispose();
        }
        scene.environment = envRenderTarget.texture;
        scene.environmentIntensity = 0.48;

        const gltfRoot = gltf.scene;
        scene.add(gltfRoot);

        const getNode = (name: string): THREE.Object3D =>
            gltfRoot.getObjectByName(name) ?? new THREE.Group();

        const briefGroup = getNode('GRP_Ch1_BriefPad');
        const moodboardGroup = getNode('GRP_Ch2_MoodTrays');
        const portalsGroup = getNode('GRP_Ch3_Portals');
        const storyboardsGroup = getNode('GRP_Ch4_Storyboards');
        const fixtureProtoGroup = getNode('GRP_FixtureProto');
        fixtureProtoGroup.visible = false;

        const strata3Band = getNode('GRP_Strata3_BandSfx');
        const strata4Audio = getNode('GRP_Strata4_AudioKinetic');
        const strata5Truss = getNode('GRP_Strata5_TrussCrown');
        const wingsLeft = getNode('GRP_StageWingsL');
        const wingsRight = getNode('GRP_StageWingsR');

        // ─── Gắn 6 nghệ sĩ 66 xương + `THREE.AnimationMixer` lên sân khấu ─────────

        const mountAnimatedPerformer = (
            perfGltf: { scene: THREE.Group; animations: THREE.AnimationClip[] },
            tx: number,
            ty: number,
            tz: number,
            yawRad: number,
            scale: number,
            timeOffset: number,
        ) => {
            const root = perfGltf.scene;
            root.position.set(tx, ty, tz);
            root.rotation.y = yawRad;
            root.scale.setScalar(scale);
            root.traverse((child) => {
                if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
                    child.frustumCulled = false;
                }
            });
            strata3Band.add(root);

            if (perfGltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(root);
                const action = mixer.clipAction(perfGltf.animations[0]);
                action.play();
                mixer.update(timeOffset);
                mixers.push(mixer);
            }
        };

        mountAnimatedPerformer(singerGltf, 0.0, 0.52, STAGE_CENTER_Z + 0.95, 0.0, MAQUETTE_SCALE, 0.4);
        mountAnimatedPerformer(guitaristGltf, 1.05, 0.52, STAGE_CENTER_Z + 0.45, -0.28, MAQUETTE_SCALE, 1.7);
        mountAnimatedPerformer(bassistGltf, -1.02, 0.52, STAGE_CENTER_Z + 0.48, 0.28, MAQUETTE_SCALE, 3.1);
        mountAnimatedPerformer(drummerGltf, 0.0, 0.80, STAGE_CENTER_Z - 1.18, 0.0, MAQUETTE_SCALE * 0.95, 0.9);
        mountAnimatedPerformer(djGltf, 1.56, 0.52, STAGE_CENTER_Z - 0.65, -0.42, MAQUETTE_SCALE * 0.95, 2.3);
        mountAnimatedPerformer(keyboardistGltf, -1.77, 0.52, STAGE_CENTER_Z - 0.66, 0.48, MAQUETTE_SCALE * 0.92, 1.2);

        // ─── Khán giả 3D GPU-instanced có animation & lightstick / smartphone / bảng LED ──
        const crowdSystem = createAnimatedCrowdSystem();
        disposeCrowd = () => crowdSystem.dispose();
        scene.add(crowdSystem.group);

        const moodTrayNodes = [0, 1, 2, 3, 4, 5].map((i) => {
            const n = getNode(`MoodTray_${i}`);
            return { node: n, baseY: n.position.y };
        });
        const portalNodes = [0, 1, 2, 3, 4].map((i) => {
            const n = getNode(`Portal_${i}`);
            return { node: n, baseY: n.position.y };
        });
        const storyboardNodes = [0, 1, 2, 3, 4, 5].map((i) => {
            const n = getNode(`Storyboard_${i}`);
            return { node: n, baseY: n.position.y };
        });
        const kineticOrbNodes = [0, 1, 2, 3].map((i) => {
            const n = getNode(`KineticOrb_${i}`);
            return { node: n, baseY: n.position.y };
        });

        // ─── Mặt phẳng lưới kỹ thuật CAD phủ toàn màn hình trên sàn studio ─────────
        const blueprintMat = trackMat(createBlueprintFloorMaterial());
        const blueprintPlane = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(110.0, 110.0)), blueprintMat);
        blueprintPlane.rotation.x = -Math.PI * 0.5;
        blueprintPlane.position.set(0, 0.012, 0.0);
        scene.add(blueprintPlane);

        // ─── Dải ánh sáng S-Curve 3D & Hạt sao chổi trên tờ Brief (Chặng 1) ───────
        const sCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.75, 0.14, 8.55),
            new THREE.Vector3(0.65, 0.14, 7.65),
            new THREE.Vector3(-0.55, 0.14, 6.65),
            new THREE.Vector3(0.22, 0.15, 5.65),
            new THREE.Vector3(0.08, 0.22, 4.65),
        ]);
        const sCurveGeo = trackGeo(new THREE.TubeGeometry(sCurve, 72, 0.036, 8, false));
        const totalSCurveIndices = sCurveGeo.index ? sCurveGeo.index.count : 0;
        const sCurveMat = trackMat(
            new THREE.MeshStandardMaterial({
                color: 0x5eeeff,
                emissive: new THREE.Color(0x5eeeff),
                emissiveIntensity: 2.25,
                roughness: 0.2,
            }),
        );
        const sCurveMesh = new THREE.Mesh(sCurveGeo, sCurveMat);
        briefGroup.add(sCurveMesh);

        const cometMat = trackMat(
            new THREE.MeshStandardMaterial({
                color: 0xffc266,
                emissive: new THREE.Color(0xffb85c),
                emissiveIntensity: 2.6,
                roughness: 0.15,
            }),
        );
        const cometOrb = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.095, 14, 14)), cometMat);
        briefGroup.add(cometOrb);

        // ─── Màn hình LED Medallion trung tâm & 2 cánh LED cong HDR ───────────────
        const ledMaterials = [0, 1, 2].map((seed) => {
            const mat = trackMat(createCurvedLedShaderMaterial());
            mat.uniforms.uPanelSeed.value = seed;
            return mat;
        });

        const centerLedDisk = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(1.46, 48)), ledMaterials[0]);
        centerLedDisk.position.set(0, 2.35, STAGE_CENTER_Z - 2.22);
        strata4Audio.add(centerLedDisk);

        const wingRibbonGeoL = trackGeo(
            new THREE.CylinderGeometry(3.25, 3.25, 1.55, 28, 1, true, Math.PI * 0.66, Math.PI * 0.22),
        );
        const wingRibbonL = new THREE.Mesh(wingRibbonGeoL, ledMaterials[1]);
        wingRibbonL.position.set(0, 2.25, STAGE_CENTER_Z + 0.55);
        strata4Audio.add(wingRibbonL);

        const wingRibbonGeoR = trackGeo(
            new THREE.CylinderGeometry(3.25, 3.25, 1.55, 28, 1, true, Math.PI * 1.12, Math.PI * 0.22),
        );
        const wingRibbonR = new THREE.Mesh(wingRibbonGeoR, ledMaterials[2]);
        wingRibbonR.position.set(0, 2.25, STAGE_CENTER_Z + 0.55);
        strata4Audio.add(wingRibbonR);

        // ─── 10 Đèn Moving-Head 3 khớp (`Base / Yoke / Head`) trên giàn Truss ─────
        const protoBase = gltfRoot.getObjectByName('PROTO_Beam_Base') as THREE.Mesh | undefined;
        const protoYoke = gltfRoot.getObjectByName('PROTO_Beam_Yoke') as THREE.Mesh | undefined;
        const protoHead = gltfRoot.getObjectByName('PROTO_Beam_Head') as THREE.Mesh | undefined;

        const fixtureBox = new THREE.Box3();
        for (const part of [protoBase, protoYoke, protoHead]) {
            if (part?.geometry) {
                part.geometry.computeBoundingBox();
                if (part.geometry.boundingBox) fixtureBox.union(part.geometry.boundingBox);
            }
        }
        if (!fixtureBox.isEmpty()) {
            const cx = (fixtureBox.min.x + fixtureBox.max.x) * 0.5;
            const cz = (fixtureBox.min.z + fixtureBox.max.z) * 0.5;
            const minY = fixtureBox.min.y;
            for (const part of [protoBase, protoYoke, protoHead]) {
                part?.geometry?.translate(-cx, -minY, -cz);
            }
        }

        const fixtureMounts: [number, number, number][] = [
            [-2.85, 4.22, STAGE_CENTER_Z + 1.52],
            [-1.72, 4.22, STAGE_CENTER_Z + 1.92],
            [-0.58, 4.22, STAGE_CENTER_Z + 2.06],
            [0.58, 4.22, STAGE_CENTER_Z + 2.06],
            [1.72, 4.22, STAGE_CENTER_Z + 1.92],
            [2.85, 4.22, STAGE_CENTER_Z + 1.52],
            [-2.35, 4.22, STAGE_CENTER_Z - 2.08],
            [-0.82, 4.22, STAGE_CENTER_Z - 2.26],
            [0.82, 4.22, STAGE_CENTER_Z - 2.26],
            [2.35, 4.22, STAGE_CENTER_Z - 2.08],
        ];

        const riggedFixtures: RiggedMovingHead[] = fixtureMounts.map(([fx, fy, fz], idx) => {
            const mount = new THREE.Group();
            mount.position.set(fx, fy, fz);
            mount.rotation.z = Math.PI;

            if (protoBase) mount.add(protoBase.clone());

            const yoke = new THREE.Group();
            if (protoYoke) yoke.add(protoYoke.clone());
            mount.add(yoke);

            const head = new THREE.Group();
            head.position.y = 0.20;
            if (protoHead) {
                const hc = protoHead.clone();
                hc.position.y = -0.20;
                head.add(hc);
            }

            yoke.add(head);
            strata5Truss.add(mount);

            return {
                yoke,
                head,
                phase: idx * 0.78,
                normIdx: idx / Math.max(1, fixtureMounts.length - 1) - 0.5,
            };
        });

        // ─── 6 Đài phun hạt pháo điện lạnh Cold Spark (`sfx_cold_spark_bt01`) ─────
        const sparkNozzles: [number, number, number][] = [
            [-2.15, 0.48, STAGE_CENTER_Z + 1.85],
            [-1.15, 0.48, STAGE_CENTER_Z + 2.25],
            [-0.58, 0.56, STAGE_CENTER_Z + 3.15],
            [0.58, 0.56, STAGE_CENTER_Z + 3.15],
            [1.15, 0.48, STAGE_CENTER_Z + 2.25],
            [2.15, 0.48, STAGE_CENTER_Z + 1.85],
        ];
        const sparksPerNozzle = 28;
        const totalSparks = sparkNozzles.length * sparksPerNozzle;
        const sparkPos = new Float32Array(totalSparks * 3);
        const sparkSeeds = new Float32Array(totalSparks * 3);
        let ptr = 0;
        for (let nIdx = 0; nIdx < sparkNozzles.length; nIdx++) {
            const [nx, ny, nz] = sparkNozzles[nIdx];
            for (let p = 0; p < sparksPerNozzle; p++) {
                sparkPos[ptr * 3] = nx;
                sparkPos[ptr * 3 + 1] = ny;
                sparkPos[ptr * 3 + 2] = nz;
                sparkSeeds[ptr * 3] = ((ptr * 0.6180339887) % 1);
                sparkSeeds[ptr * 3 + 1] = ((ptr * 0.3819660112 + nIdx * 0.17) % 1);
                sparkSeeds[ptr * 3 + 2] = ((p / sparksPerNozzle + nIdx * 0.13) % 1);
                ptr++;
            }
        }
        const sparkGeo = trackGeo(new THREE.BufferGeometry());
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
        sparkGeo.setAttribute('aSeed', new THREE.BufferAttribute(sparkSeeds, 3));
        const sparkMat = trackMat(createColdSparkPointsMaterial(renderer.getPixelRatio()));
        const coldSparkPoints = new THREE.Points(sparkGeo, sparkMat);
        coldSparkPoints.frustumCulled = false;
        strata3Band.add(coldSparkPoints);

        // ─── Cáp tời kỹ thuật treo giàn mái dọc 4 trụ Truss cố định ở Chặng 5 ─────
        const hoistPoints: THREE.Vector3[] = [];
        for (const [gx, gz] of [
            [-3.65, STAGE_CENTER_Z + 1.05],
            [3.65, STAGE_CENTER_Z + 1.05],
            [-3.45, STAGE_CENTER_Z - 1.95],
            [3.45, STAGE_CENTER_Z - 1.95],
            [-3.28, STAGE_CENTER_Z + 0.65],
            [3.28, STAGE_CENTER_Z + 0.65],
        ] as const) {
            hoistPoints.push(new THREE.Vector3(gx, 3.85, gz), new THREE.Vector3(gx, 6.45, gz));
        }
        const hoistCableMat = trackMat(
            new THREE.LineBasicMaterial({ color: 0x5eeeff, transparent: true, opacity: 0 }),
        );
        const hoistCables = new THREE.LineSegments(
            trackGeo(new THREE.BufferGeometry().setFromPoints(hoistPoints)),
            hoistCableMat,
        );
        scene.add(hoistCables);

        await renderer.compileAsync(scene, camera);
        signal?.throwIfAborted();

        // ─── Quản lý khung hình & vòng lặp cập nhật ────────────────────────────────
        let viewW = 1280;
        let viewH = 720;
        let targetPtrX = 0;
        let targetPtrY = 0;
        let smoothPtrX = 0;
        let smoothPtrY = 0;
        let prevElapsed = 0;
        const lookTarget = new THREE.Vector3();

        function resize(width: number, height: number): void {
            viewW = Math.max(1, width);
            viewH = Math.max(1, height);
            const aspect = viewW / viewH;

            camera.left = -FRUSTUM_HALF_H * aspect;
            camera.right = FRUSTUM_HALF_H * aspect;
            camera.top = FRUSTUM_HALF_H;
            camera.bottom = -FRUSTUM_HALF_H;

            const offsetX = viewW >= 1024 ? -viewW * 0.045 : -viewW * 0.015;
            const offsetY = viewH >= 768 ? -viewH * 0.03 : -viewH * 0.05;
            camera.setViewOffset(viewW, viewH, offsetX, offsetY, viewW, viewH);
            camera.updateProjectionMatrix();

            sparkMat.uniforms.uDpr.value = renderer.getPixelRatio();
        }

        function setPointerNormalized(nx: number, ny: number): void {
            targetPtrX = Math.max(-1, Math.min(1, nx));
            targetPtrY = Math.max(-1, Math.min(1, ny));
        }

        function updateAndRender(elapsedSeconds: number): number {
            const rawDt = elapsedSeconds - prevElapsed;
            const dt = rawDt > 0 && rawDt < 0.25 ? rawDt : 0;
            prevElapsed = elapsedSeconds;

            const frame = evaluateDarkStoryboardFrame(elapsedSeconds);

            // Cập nhật chuyển động xương 60fps của 5 nghệ sĩ trên sân khấu
            if (dt > 0) {
                for (const mixer of mixers) {
                    mixer.update(dt);
                }
            }

            // Nhịp nhảy sóng, vẫy lightstick, điện thoại & bảng cổ vũ của khán giả GPU-instanced
            const cheerEnergy = 0.28 + 0.72 * Math.max(frame.calibrationSweep * 0.55, frame.showtimeIntensity);
            crowdSystem.update(elapsedSeconds, cheerEnergy);

            smoothPtrX += (targetPtrX - smoothPtrX) * 0.07;
            smoothPtrY += (targetPtrY - smoothPtrY) * 0.07;

            const camCfg = frame.camera3d;
            const az = camCfg.azimuth + smoothPtrX * 0.05;
            const el = camCfg.elevation + smoothPtrY * 0.028;
            const camDist = 28;

            lookTarget.set(camCfg.targetX, camCfg.targetY, camCfg.targetZ);
            camera.position.set(
                lookTarget.x + Math.sin(az) * Math.cos(el) * camDist,
                lookTarget.y + Math.sin(el) * camDist,
                lookTarget.z + Math.cos(az) * Math.cos(el) * camDist,
            );
            camera.lookAt(lookTarget);
            if (Math.abs(camera.zoom - camCfg.zoom) > 1e-4) {
                camera.zoom = camCfg.zoom;
                camera.updateProjectionMatrix();
            }

            // 1. Uniforms mặt phẳng CAD, màn LED cong HDR & pháo điện lạnh Cold Spark
            const hoistPhase = frame.explodedSpread;
            blueprintMat.uniforms.uTime.value = elapsedSeconds;
            blueprintMat.uniforms.uCadIntensity.value = Math.min(1, frame.cadBlueprintPresence + hoistPhase * 0.35);
            blueprintMat.uniforms.uShowIntensity.value = frame.showtimeIntensity;

            const ledPower = Math.max(frame.calibrationSweep * 0.7, frame.showtimeIntensity);
            for (const lMat of ledMaterials) {
                lMat.uniforms.uTime.value = elapsedSeconds;
                lMat.uniforms.uShowIntensity.value = ledPower;
            }

            sparkMat.uniforms.uTime.value = elapsedSeconds;
            sparkMat.uniforms.uIntensity.value = frame.showtimeIntensity;
            coldSparkPoints.visible = frame.showtimeIntensity > 0.03;

            // 2. Chặng 1–4: Chuyển động nổi mượt các cụm sa bàn tiền cảnh
            briefGroup.visible = frame.briefPadPresence > 0.02;
            briefGroup.position.y = -(1 - frame.briefPadPresence) * 0.75;
            if (totalSCurveIndices > 0) {
                const count = Math.floor((totalSCurveIndices * frame.briefLineDraw) / 3) * 3;
                sCurveGeo.setDrawRange(0, count);
            }
            const tipPt = sCurve.getPointAt(Math.max(0.001, Math.min(1, frame.briefLineDraw)));
            cometOrb.position.copy(tipPt);
            cometOrb.visible = frame.briefLineDraw > 0.02 && frame.briefPadPresence > 0.25;

            moodboardGroup.visible = frame.moodboardPresence > 0.01;
            moodTrayNodes.forEach(({ node, baseY }, idx) => {
                const localP = Math.max(0, Math.min(1, frame.moodboardPresence * 1.3 - idx * 0.08));
                node.visible = localP > 0.01;
                node.position.y = baseY - (1 - localP) * 1.35 + Math.sin(elapsedSeconds * 2.1 + idx) * 0.045;
            });

            portalsGroup.visible = frame.archesPresence > 0.01;
            portalNodes.forEach(({ node, baseY }, idx) => {
                const localP = Math.max(0, Math.min(1, frame.archesPresence * 1.35 - idx * 0.11));
                node.visible = localP > 0.01;
                node.position.y = baseY - (1 - localP) * 2.4;
            });

            const boardPresence = Math.max(frame.storyboardPresence, frame.finaleBackdropPresence);
            storyboardsGroup.visible = boardPresence > 0.01;
            storyboardNodes.forEach(({ node, baseY }, idx) => {
                const symDelay = Math.abs(idx - 2.5) * 0.07;
                const localP = Math.max(0, Math.min(1, boardPresence * 1.28 - symDelay));
                node.visible = localP > 0.01;
                node.position.y = baseY - (1 - localP) * 2.1;
            });

            // 3. Chặng 5 (`Kế hoạch sản xuất`): Sàn khán đài & sàn sân khấu cố định 100% trên bàn vẽ;
            //    chỉ xòe cánh vòm âm học hai bên và hạ tời cụm loa treo + giàn mái Truss dọc 4 trụ đứng!
            wingsLeft.rotation.y = hoistPhase * 0.38;
            wingsRight.rotation.y = -hoistPhase * 0.38;
            const wingScale = 1 - hoistPhase * 0.12;
            wingsLeft.scale.set(wingScale, wingScale, 1);
            wingsRight.scale.set(wingScale, wingScale, 1);

            strata4Audio.position.y = hoistPhase * 1.05;
            strata5Truss.position.y = hoistPhase * 1.85;

            hoistCables.visible = hoistPhase > 0.01;
            hoistCableMat.opacity = hoistPhase * 0.62;

            kineticOrbNodes.forEach(({ node, baseY }, idx) => {
                node.position.y = baseY + Math.sin(elapsedSeconds * 1.9 + idx * 1.4) * 0.14 * (0.25 + 0.75 * ledPower);
                node.rotation.y = elapsedSeconds * 0.65 * (idx % 2 === 0 ? 1 : -1);
            });

            // 4. Đèn Moving-Head 3 khớp xoay Pan/Tilt thật trên giàn mái (đã bỏ hoàn toàn chùm tia laser)
            for (const fix of riggedFixtures) {
                fix.yoke.rotation.y = fix.normIdx * 0.65 + Math.sin(elapsedSeconds * 1.55 + fix.phase) * 0.42;
                fix.head.rotation.x = 0.24 + Math.cos(elapsedSeconds * 1.35 + fix.phase) * 0.22;
            }

            stageShowLight.intensity = 1.25 + frame.showtimeIntensity * 2.25;
            bandWarmSpot.intensity = 0.95 + frame.showtimeIntensity * 1.85;

            renderer.render(scene, camera);
            return frame.chapterIndex;
        }

        return {
            resize,
            setPointerNormalized,
            updateAndRender,
            dispose,
        };
    } catch (error) {
        dispose();
        throw error;
    } finally {
        signal?.removeEventListener('abort', dispose);
    }
}
