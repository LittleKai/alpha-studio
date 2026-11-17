import { afterEach, expect, test, vi } from 'vitest';
import * as THREE from 'three';
import { createThreeDarkStoryboardScene } from './threeDarkStoryboardScene';

const { load, environmentDispose } = vi.hoisted(() => ({ load: vi.fn(), environmentDispose: vi.fn() }));
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({ GLTFLoader: class { loadAsync = load; } }));
vi.mock('three', async (importOriginal) => ({
    ...await importOriginal<typeof import('three')>(),
    PMREMGenerator: class {
        fromScene() { return { texture: new THREE.Texture(), dispose: environmentDispose }; }
        dispose() {}
    },
}));

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

function asset() {
    const scene = new THREE.Group();
    const geometry = new THREE.BoxGeometry();
    const texture = new THREE.Texture();
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.bind(new THREE.Skeleton([]));
    scene.add(mesh);
    return {
        scene, animations: [],
        released: [geometry, texture, material, mesh.skeleton].map((resource) => vi.spyOn(resource, 'dispose')),
    };
}

test('releases successful GLBs when another asset exhausts retries', async () => {
    vi.useFakeTimers();
    const assets = Array.from({ length: 6 }, asset);
    let index = 0;
    load.mockImplementation((url: string) => url.includes('hero-dark-diorama')
        ? Promise.reject(new Error('asset unavailable'))
        : Promise.resolve(assets[index++]));
    const pending = expect(createThreeDarkStoryboardScene({} as THREE.WebGLRenderer)).rejects.toThrow('asset unavailable');
    await vi.runAllTimersAsync();
    await pending;
    expect(load).toHaveBeenCalledTimes(9);
    for (const loaded of assets) for (const dispose of loaded.released) expect(dispose).toHaveBeenCalled();
});

test('releases scene resources when shader compilation fails', async () => {
    const assets = Array.from({ length: 7 }, asset);
    let index = 0;
    load.mockImplementation(() => Promise.resolve(assets[index++]));
    const renderer = {
        getPixelRatio: () => 1,
        compileAsync: () => Promise.reject(new Error('shader unavailable')),
    } as unknown as THREE.WebGLRenderer;
    await expect(createThreeDarkStoryboardScene(renderer)).rejects.toThrow('shader unavailable');
    for (const loaded of assets) for (const dispose of loaded.released) expect(dispose).toHaveBeenCalled();
    expect(environmentDispose).toHaveBeenCalledOnce();
});

test('cancels pending asset initialization before using an unmounted renderer', async () => {
    const assets = Array.from({ length: 7 }, asset);
    const release: (() => void)[] = [];
    let index = 0;
    load.mockImplementation(() => new Promise((resolve) => {
        const loaded = assets[index++];
        release.push(() => resolve(loaded));
    }));
    const abort = new AbortController();
    const compileAsync = vi.fn().mockResolvedValue(undefined);
    const renderer = { getPixelRatio: () => 1, compileAsync } as unknown as THREE.WebGLRenderer;
    const pending = expect(createThreeDarkStoryboardScene(renderer, abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
    abort.abort();
    release.forEach((resolve) => resolve());
    await pending;
    expect(compileAsync).not.toHaveBeenCalled();
    for (const loaded of assets) for (const dispose of loaded.released) expect(dispose).toHaveBeenCalled();
});
