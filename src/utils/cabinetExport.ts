// Export utilities cho Interior Design — convert cabinetModel JSON sang định
// dạng 3D file mà SketchUp có thể import (.obj với material .mtl).
//
// Quy ước: cabinetModel dùng cm. OBJ không có khái niệm unit — khi import vào
// SketchUp user chọn "Centimeters" trong dialog import. Trục:
//   x = chiều ngang (rộng), y = chiều dọc (cao), z = chiều sâu.

interface CabinetPart {
    type?: string;
    label?: string;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    depth: number;
    color?: string;
    opacity?: number;
    hideLabel?: boolean;
}

interface CabinetModelLike {
    title?: string;
    subtitle?: string;
    units?: string;
    width?: number;
    height?: number;
    depth?: number;
    modules?: CabinetPart[];
    details?: CabinetPart[];
    [key: string]: unknown;
}

const SKETCHUP_OPACITY_ZONE_THRESHOLD = 0.5;

const sanitizeMaterialName = (input: string): string => {
    return input.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 32) || 'mat';
};

const hexToRgbFloat = (hex: string): [number, number, number] => {
    if (typeof hex !== 'string') return [0.78, 0.6, 0.42];
    let s = hex.trim().replace('#', '');
    if (s.length === 3) s = s.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return [0.78, 0.6, 0.42];
    const r = parseInt(s.slice(0, 2), 16) / 255;
    const g = parseInt(s.slice(2, 4), 16) / 255;
    const b = parseInt(s.slice(4, 6), 16) / 255;
    return [r, g, b];
};

/**
 * Tạo .obj + .mtl từ cabinetModel.
 * - Bỏ qua các part có opacity < 0.5 (zone markers, không phải vật thể thật).
 * - Mỗi part = 1 box (8 vertex, 12 triangles → ghi dạng 6 quad).
 * - Mỗi color khác nhau → 1 material trong .mtl.
 */
export function generateObjFromCabinetModel(model: CabinetModelLike, mtlFilename = 'cabinet.mtl'): { obj: string; mtl: string } {
    const allParts: CabinetPart[] = [
        ...(Array.isArray(model.modules) ? model.modules : []),
        ...(Array.isArray(model.details) ? model.details : [])
    ];

    const solidParts = allParts.filter((p) => {
        if (!Number.isFinite(p.width) || !Number.isFinite(p.height) || !Number.isFinite(p.depth)) return false;
        if (p.opacity !== undefined && p.opacity < SKETCHUP_OPACITY_ZONE_THRESHOLD) return false;
        return true;
    });

    const objLines: string[] = [
        `# Alpha Studio Interior Design — ${model.title || 'Cabinet'}`,
        `# Generated ${new Date().toISOString()}`,
        `# Units: cm (set "Centimeters" khi import vào SketchUp)`,
        `# Dimensions: ${model.width || '?'} x ${model.height || '?'} x ${model.depth || '?'} cm`,
        `mtllib ${mtlFilename}`,
        ''
    ];

    const materialMap = new Map<string, string>(); // color hex → material name
    let vertexOffset = 1;

    solidParts.forEach((part, idx) => {
        const color = (part.color || '#c9986b').toLowerCase();
        let materialName = materialMap.get(color);
        if (!materialName) {
            materialName = `mat_${sanitizeMaterialName(color.replace('#', ''))}`;
            materialMap.set(color, materialName);
        }

        const label = sanitizeMaterialName(part.label || part.type || `part_${idx + 1}`);
        const { x, y, z, width: w, height: h, depth: d } = part;

        // 8 vertices của box
        const verts: Array<[number, number, number]> = [
            [x, y, z],         [x + w, y, z],         [x + w, y + h, z],         [x, y + h, z],
            [x, y, z + d],     [x + w, y, z + d],     [x + w, y + h, z + d],     [x, y + h, z + d]
        ];

        objLines.push(`o ${label}_${idx + 1}`);
        objLines.push(`usemtl ${materialName}`);
        for (const [vx, vy, vz] of verts) {
            objLines.push(`v ${vx.toFixed(3)} ${vy.toFixed(3)} ${vz.toFixed(3)}`);
        }
        // 6 quad faces (OBJ chấp nhận quad, SketchUp tự tam giác hóa)
        const o = vertexOffset;
        objLines.push(`f ${o + 0} ${o + 3} ${o + 2} ${o + 1}`); // back (-z)
        objLines.push(`f ${o + 4} ${o + 5} ${o + 6} ${o + 7}`); // front (+z)
        objLines.push(`f ${o + 0} ${o + 4} ${o + 7} ${o + 3}`); // left (-x)
        objLines.push(`f ${o + 1} ${o + 2} ${o + 6} ${o + 5}`); // right (+x)
        objLines.push(`f ${o + 0} ${o + 1} ${o + 5} ${o + 4}`); // bottom (-y)
        objLines.push(`f ${o + 3} ${o + 7} ${o + 6} ${o + 2}`); // top (+y)
        objLines.push('');
        vertexOffset += 8;
    });

    const mtlLines: string[] = [
        `# Alpha Studio Interior Design — material library`,
        `# Auto-generated ${new Date().toISOString()}`,
        ''
    ];
    for (const [color, name] of materialMap) {
        const [r, g, b] = hexToRgbFloat(color);
        mtlLines.push(`newmtl ${name}`);
        mtlLines.push(`Ka ${(r * 0.2).toFixed(4)} ${(g * 0.2).toFixed(4)} ${(b * 0.2).toFixed(4)}`);
        mtlLines.push(`Kd ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`);
        mtlLines.push(`Ks 0.05 0.05 0.05`);
        mtlLines.push(`Ns 10.0`);
        mtlLines.push(`d 1.0`);
        mtlLines.push(`illum 2`);
        mtlLines.push('');
    }

    return { obj: objLines.join('\n'), mtl: mtlLines.join('\n') };
}

export function triggerDownload(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Dynamic loader cho window.InteriorDesigner (vendored ở /interior-design/).
// Engine có sẵn createAiImagePackage(model) → trả về files {name, dataUrl} sẵn
// sàng download để feed vào AI tạo ảnh (Imagen / Banana / etc).
let _enginePromise: Promise<any> | null = null;
export function loadInteriorEngine(): Promise<any> {
    if ((window as any).InteriorDesigner) return Promise.resolve((window as any).InteriorDesigner);
    if (_enginePromise) return _enginePromise;
    _enginePromise = new Promise<any>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/interior-design/interior-design-engine.js';
        script.async = true;
        script.onload = () => {
            const engine = (window as any).InteriorDesigner;
            if (engine) resolve(engine);
            else reject(new Error('InteriorDesigner global not found after load'));
        };
        script.onerror = () => reject(new Error('Failed to load interior-design-engine.js'));
        document.head.appendChild(script);
    });
    return _enginePromise;
}

export interface EngineAiFile {
    name: string;
    type: string;
    view?: string;
    text?: string;
    dataUrl: string;
}

export async function createAiImagePackage(model: any): Promise<{ files: EngineAiFile[]; promptEn: string; promptVi: string }> {
    const engine = await loadInteriorEngine();
    if (typeof engine.createAiImagePackage !== 'function') {
        throw new Error('Engine missing createAiImagePackage');
    }
    return engine.createAiImagePackage({ model });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export async function downloadRemoteImage(url: string, filename: string): Promise<void> {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
        // CORS fallback: mở tab mới, user save thủ công
        window.open(url, '_blank', 'noopener');
    }
}
