// Accent color engine for the /showcase experience.
// Given a single brand hex (and an optional explicit partner hue), it derives a
// full, contrast-safe token set and writes it onto a scoped element so the rest
// of the app's global theme is never touched.

export interface AccentTokens {
  primary: string;
  secondary: string;
  hover: string;
  shadow: string;
  onAccent: string;
}

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function parseHex(hex: string): RGB {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function toHex({ r, g, b }: RGB): string {
  const c = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

// Perceived luminance (WCAG relative luminance) to pick readable text on the accent.
function luminance({ r, g, b }: RGB): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function shiftHue(hex: string, deg: number): string {
  const hsl = rgbToHsl(parseHex(hex));
  hsl.h = (hsl.h + deg + 360) % 360;
  // Nudge saturation up slightly so the gradient partner stays vivid.
  hsl.s = clamp(hsl.s + 4, 0, 100);
  return toHex(hslToRgb(hsl));
}

function adjustLightness(hex: string, delta: number): string {
  const hsl = rgbToHsl(parseHex(hex));
  hsl.l = clamp(hsl.l + delta, 0, 100);
  return toHex(hslToRgb(hsl));
}

/** Build the derived token set from a base primary (and optional explicit secondary). */
export function deriveAccentTokens(primary: string, secondary?: string): AccentTokens {
  const rgb = parseHex(primary);
  const partner = secondary ?? shiftHue(primary, 42);
  const bright = luminance(rgb) > 0.55;
  return {
    primary,
    secondary: partner,
    hover: adjustLightness(primary, bright ? -12 : 10),
    shadow: `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, 0.4)`,
    onAccent: bright ? '#07111f' : '#f8fafc',
  };
}

/** Apply tokens as CSS custom properties on a scoped element (not documentElement). */
export function applyAccent(el: HTMLElement | null, t: AccentTokens): void {
  if (!el) return;
  el.style.setProperty('--accent-primary', t.primary);
  el.style.setProperty('--accent-secondary', t.secondary);
  el.style.setProperty('--accent-primary-hover', t.hover);
  el.style.setProperty('--accent-shadow', t.shadow);
  el.style.setProperty('--text-on-accent', t.onAccent);
  // Page-local aliases used by the aurora + glow layers.
  el.style.setProperty('--sc-accent', t.primary);
  el.style.setProperty('--sc-accent-2', t.secondary);
}

export interface AccentPreset {
  id: string;
  primary: string;
  secondary: string;
}

// Curated pairs. Each is hand-checked to read well against both the dark
// (#07111f) and light (#eef7fb) surfaces the page ships with.
export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'cyan', primary: '#61e8ff', secondary: '#8b7dff' }, // brand default
  { id: 'violet', primary: '#a78bfa', secondary: '#f0abfc' },
  { id: 'ember', primary: '#fb7185', secondary: '#fdba74' },
  { id: 'lime', primary: '#a3e635', secondary: '#34d399' },
  { id: 'amber', primary: '#fbbf24', secondary: '#fb923c' },
  { id: 'azure', primary: '#38bdf8', secondary: '#818cf8' },
];

export const DEFAULT_PRESET_ID = 'cyan';
export const ACCENT_STORAGE_KEY = 'showcase-accent';
