import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    expect(refs.length).toBeGreaterThan(20);
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
});
