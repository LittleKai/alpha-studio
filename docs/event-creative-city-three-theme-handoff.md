# Claude Code Handoff — Event Creative City: 3 Theme Switcher

## Objective

Update the existing experimental route `/event-creative-city` so visitors can switch between three complete visual themes without leaving the route and without changing the current scroll position or active scene.

Do not modify the current landing page at `/`.

The existing implementation files are:

- `src/pages/EventCreativeCityPage.tsx`
- `src/pages/EventCreativeCityPage.css`
- Route registration in `src/App.tsx`

## Available themes

### 1. Neon Night

ID: `neon-night`

Display label: `Neon Night`

Tone: cinematic, high-tech, premium nighttime event city.

Asset directory:

```text
/event-creative-city/01-event-gate.png
/event-creative-city/02-brief-tower.png
/event-creative-city/03-concept-district.png
/event-creative-city/04-storyboard-avenue.png
/event-creative-city/05-production-workshop.png
/event-creative-city/06-led-arena.png
/event-creative-city/07-showtime-plaza.png
```

Suggested tokens:

```ts
{
  background: '#07111F',
  surface: 'rgba(8, 21, 38, 0.82)',
  ink: '#F8FAFC',
  muted: '#C3D5E6',
  accent: '#61E8FF',
  secondary: '#8B7DFF',
  border: 'rgba(255, 255, 255, 0.13)'
}
```

### 2. Creative Daylight

ID: `creative-daylight`

Display label: `Creative Daylight`

Tone: bright creative academy, professional design studio, clear and optimistic.

Asset directory:

```text
/event-creative-city/themes/creative-daylight/01-event-gate.png
/event-creative-city/themes/creative-daylight/02-brief-tower.png
/event-creative-city/themes/creative-daylight/03-concept-district.png
/event-creative-city/themes/creative-daylight/04-storyboard-avenue.png
/event-creative-city/themes/creative-daylight/05-production-workshop.png
/event-creative-city/themes/creative-daylight/06-led-arena.png
/event-creative-city/themes/creative-daylight/07-showtime-plaza.png
```

Suggested tokens:

```ts
{
  background: '#EEF7FB',
  surface: 'rgba(255, 255, 255, 0.78)',
  ink: '#0F172A',
  muted: '#475569',
  accent: '#0284C7',
  secondary: '#7C3AED',
  border: 'rgba(15, 75, 112, 0.16)'
}
```

### 3. Festival Garden

ID: `festival-garden`

Display label: `Festival Garden`

Tone: sophisticated botanical event festival, warm, human and celebratory.

Asset directory:

```text
/event-creative-city/themes/festival-garden/01-event-gate.png
/event-creative-city/themes/festival-garden/02-brief-tower.png
/event-creative-city/themes/festival-garden/03-concept-district.png
/event-creative-city/themes/festival-garden/04-storyboard-avenue.png
/event-creative-city/themes/festival-garden/05-production-workshop.png
/event-creative-city/themes/festival-garden/06-led-arena.png
/event-creative-city/themes/festival-garden/07-showtime-plaza.png
```

Suggested tokens:

```ts
{
  background: '#FFF8EC',
  surface: 'rgba(255, 252, 244, 0.84)',
  ink: '#3F2D1F',
  muted: '#6B5B4B',
  accent: '#F97316',
  secondary: '#4D7C0F',
  border: 'rgba(112, 78, 44, 0.18)'
}
```

## Scene order

All themes use the same seven scene slots and filenames. Do not reorder them.

| Index | Scene ID | Filename |
|---:|---|---|
| 0 | `event-gate` | `01-event-gate.png` |
| 1 | `brief-tower` | `02-brief-tower.png` |
| 2 | `concept-district` | `03-concept-district.png` |
| 3 | `storyboard-avenue` | `04-storyboard-avenue.png` |
| 4 | `production-workshop` | `05-production-workshop.png` |
| 5 | `led-arena` | `06-led-arena.png` |
| 6 | `showtime-plaza` | `07-showtime-plaza.png` |

Every asset is a 1536×1024 landscape PNG with a 3:2 aspect ratio. The central focal point and isometric composition are intentionally aligned across themes.

## Implementation requirements

1. Add a three-option theme switcher to the `/event-creative-city` header.
2. Recommended control: an accessible segmented control with these labels:
   - `Neon Night`
   - `Creative Daylight`
   - `Festival Garden`
3. Each button must use `type="button"`, a clear accessible label and `aria-pressed`.
4. Store the selected theme in component state and persist it with:

```text
localStorage key: ecc-visual-theme-v1
```

5. Default to `neon-night` when no saved value exists.
6. Theme switching must preserve:
   - current page scroll position;
   - current `scenePosition`;
   - active route-rail scene;
   - all scene copy and CTA content.
7. Only the scene image source and local page theme tokens should change.
8. Set a route-local attribute such as:

```tsx
<main className="ecc-page" data-visual-theme={activeTheme}>
```

9. Map the selected theme to CSS custom properties on `.ecc-page`. Do not mutate the global application light/dark theme.
10. Preload the seven images for the newly selected theme before completing the visual transition.
11. Crossfade between the old and new theme images for approximately 300–450 ms. Keep the copy card fully readable throughout the image transition.
12. Respect `prefers-reduced-motion`: switch images immediately or use opacity-only with no zoom.
13. On narrow mobile widths, use short labels if needed:
   - `Night`
   - `Daylight`
   - `Garden`
14. Do not add a theme switcher to the main landing page.

## Suggested data model

Use one catalog as the source of truth instead of branching paths inside JSX.

```ts
type VisualThemeId = 'neon-night' | 'creative-daylight' | 'festival-garden';

const sceneFiles = [
  '01-event-gate.png',
  '02-brief-tower.png',
  '03-concept-district.png',
  '04-storyboard-avenue.png',
  '05-production-workshop.png',
  '06-led-arena.png',
  '07-showtime-plaza.png',
] as const;

const visualThemes = {
  'neon-night': {
    label: 'Neon Night',
    shortLabel: 'Night',
    basePath: '/event-creative-city',
    tokens: {
      background: '#07111F',
      surface: 'rgba(8, 21, 38, 0.82)',
      ink: '#F8FAFC',
      muted: '#C3D5E6',
      accent: '#61E8FF',
      secondary: '#8B7DFF',
      border: 'rgba(255, 255, 255, 0.13)',
    },
  },
  'creative-daylight': {
    label: 'Creative Daylight',
    shortLabel: 'Daylight',
    basePath: '/event-creative-city/themes/creative-daylight',
    tokens: {
      background: '#EEF7FB',
      surface: 'rgba(255, 255, 255, 0.78)',
      ink: '#0F172A',
      muted: '#475569',
      accent: '#0284C7',
      secondary: '#7C3AED',
      border: 'rgba(15, 75, 112, 0.16)',
    },
  },
  'festival-garden': {
    label: 'Festival Garden',
    shortLabel: 'Garden',
    basePath: '/event-creative-city/themes/festival-garden',
    tokens: {
      background: '#FFF8EC',
      surface: 'rgba(255, 252, 244, 0.84)',
      ink: '#3F2D1F',
      muted: '#6B5B4B',
      accent: '#F97316',
      secondary: '#4D7C0F',
      border: 'rgba(112, 78, 44, 0.18)',
    },
  },
} satisfies Record<VisualThemeId, {
  label: string;
  shortLabel: string;
  basePath: string;
  tokens: Record<string, string>;
}>;

const getThemeImages = (theme: VisualThemeId) =>
  sceneFiles.map((file) => `${visualThemes[theme].basePath}/${file}`);
```

Keep the existing scene copy array unchanged. Build the final image URL by scene index.

## Suggested switch behavior

```ts
const preloadTheme = async (theme: VisualThemeId) => {
  const urls = getThemeImages(theme);
  await Promise.all(urls.map((url) => new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  })));
};
```

When a visitor selects a theme:

1. Mark the switcher as loading without blocking scrolling.
2. Preload the selected theme assets.
3. Update `activeTheme`.
4. Persist the ID in `localStorage`.
5. Crossfade the image layer while leaving the copy layer outside the fading container.

## CSS integration

Replace hard-coded route colors with local variables such as:

```css
.ecc-page {
  --ecc-bg: var(--ecc-theme-bg);
  --ecc-ink: var(--ecc-theme-ink);
  --ecc-muted: var(--ecc-theme-muted);
  --ecc-accent: var(--ecc-theme-accent);
  --ecc-secondary: var(--ecc-theme-secondary);
  --ecc-surface: var(--ecc-theme-surface);
  --ecc-border: var(--ecc-theme-border);
}
```

Apply the active token values from React through `style` or through three `[data-visual-theme]` selectors. Keep all variables scoped to `.ecc-page`.

For light themes:

- Header text and route rail labels must use the dark `ink` token.
- Copy cards should use the theme `surface` token and a subtle backdrop blur.
- Route dots and progress bars should use the theme `accent`/`secondary` tokens.
- Remove the dark-only global vignette; use a theme-aware gradient based on the page background.
- CTA contrast must remain readable against both light themes.

## Acceptance checklist

- `/` remains unchanged.
- `/event-creative-city` offers exactly three visual theme choices.
- All 21 images load successfully: 7 existing + 14 new.
- Switching themes does not jump to another scroll position or scene.
- Image transition is smooth and copy never double-renders.
- The correct palette applies to header, copy card, route rail, tags, progress bar and CTA.
- Theme choice survives a page refresh.
- Keyboard users can tab to and activate all three theme buttons.
- `prefers-reduced-motion` is respected.
- Desktop and mobile layouts remain usable.
- Production build passes.

## Asset provenance

The two new 7-image sets were generated through the built-in ChatGPT/Codex `image_gen` workflow using each Neon Night scene as an edit reference. The original Neon Night files were not overwritten.
