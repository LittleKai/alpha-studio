import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

// public/led-studio is synced from led-stage-studio (scripts/sync-to-public.mjs), which tags each
// css/js reference with `?v=<sha256:10>`. vercel.json caches those files for a year, so a file
// edited by hand without re-syncing would stay stale for users — these tests catch that.
const root = resolve(__dirname, '../../public/led-studio');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="((?:css|js)\/[^"?#]+)(?:\?v=([0-9a-f]+))?"/g)];
const cacheRoute = new RegExp(
  JSON.parse(readFileSync(resolve(__dirname, '../../vercel.json'), 'utf8')).routes.find(
    (r: { src?: string }) => r.src?.includes('led-studio')
  ).src
);

describe('LED Studio static assets', () => {
  it('references css and js files', () => {
    expect(refs.length).toBeGreaterThanOrEqual(3);
  });

  it.each(refs.map(([, rel, v]) => [rel, v]))('%s carries the content hash of the file', (rel, v) => {
    const file = resolve(root, rel);
    expect(existsSync(file)).toBe(true);
    expect(v).toBe(createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10));
  });

  it('caches versioned files long-term but not index.html or the lazily loaded demo video', () => {
    for (const [, rel] of refs) expect(cacheRoute.test(`/led-studio/${rel}`)).toBe(true);
    expect(cacheRoute.test('/led-studio/index.html')).toBe(false);
    expect(cacheRoute.test('/led-studio/js/data/demo-video.js')).toBe(false);
  });

  it('ships production-locked lumi-studio.min.js (rejects localhost & non-iframe) and omits .asset.json / .pack.js', () => {
    const bundleCode = readFileSync(resolve(root, 'js/lumi-studio.min.js'), 'utf8');
    const runGuard = (loc: { protocol: string; hostname: string }, framed: boolean) => {
      const engineStateEl = { textContent: '3D engine ready' };
      const win: Record<string, unknown> = {
        location: loc,
        document: { getElementById: (id: string) => (id === 'engineState' ? engineStateEl : null) }
      };
      win.self = win;
      win.top = framed ? { __shell: true } : win;
      const ctx = vm.createContext({
        window: win,
        globalThis: win,
        self: win,
        Proxy,
        Reflect,
        Set,
        Map,
        Object,
        String,
        Number,
        Boolean,
        Array,
        Uint8Array,
        Uint32Array,
        TextDecoder,
        Buffer,
        Math
      });
      try {
        vm.runInContext(bundleCode, ctx);
      } catch {
        // Expected DOM/WebGL stub termination after passing host guard
      }
      return engineStateEl.textContent;
    };

    expect(runGuard({ protocol: 'http:', hostname: 'localhost' }, true)).toBe('Unauthorized domain');
    expect(runGuard({ protocol: 'https:', hostname: 'giaiphapsangtao.com' }, false)).toBe('Unauthorized domain');
    expect(runGuard({ protocol: 'https:', hostname: 'giaiphapsangtao.com' }, true)).not.toBe('Unauthorized domain');

    const walkFiles = (dir: string, acc: string[] = []): string[] => {
      if (!existsSync(dir)) return acc;
      for (const ent of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, ent.name);
        if (ent.isDirectory()) walkFiles(p, acc);
        else acc.push(p.replace(/\\/g, '/'));
      }
      return acc;
    };
    const assetFiles = walkFiles(resolve(root, 'assets'));
    expect(assetFiles.filter((f) => f.endsWith('.asset.json'))).toEqual([]);
    expect(assetFiles.filter((f) => f.endsWith('.pack.js'))).toEqual([]);
    expect(assetFiles.some((f) => f.endsWith('.pack.bin'))).toBe(true);
  });
});
