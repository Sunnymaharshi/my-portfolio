# Portfolio — CLAUDE.md

## Project overview

Maharshi Reddy's personal portfolio. 3D space-themed experience (React Three Fiber) — **drag-to-look + scroll-to-fly** exploration through 5 sectors. 3D universe is the stage; portfolio content lives in **DOM panels** overlaid on top. No pointer lock, no keyboard controls, no scroll-driven camera.

Navigation: free flight, **NavMenu** (bottom pill), or **EdgeHints** waypoints — all trigger a smooth **guided fly-to** (tweens pos + orientation, cancelled instantly by drag/scroll). A **Tour** auto-visits all four sectors.

## Dev server

```bash
npm run dev    # http://localhost:5173
npm run build  # dist/ (4 parallel chunks)
```

## Stack

- **React 18 + Vite** — 4 manual chunks: `three`, `r3f`, `post`, `index`
- **React Three Fiber + @react-three/drei** — 3D scene; `<Text>`/`<Billboard>` for labels; no `<Html>` inside canvas
- **@react-three/postprocessing@2.19.1** — must stay v2.x (v3 requires R3F v9)
- **CSS Modules** — no Tailwind
- **Space Grotesk** (sans) + **Space Mono** (mono) — Google Fonts; TTF at `public/fonts/SpaceMono-Regular.ttf` for 3D text (woff2 not supported by troika)

`html, body { overflow: hidden }` — no page scroll; navigation is fully 3D.

## Design system (`src/styles/globals.css`)

| Variable | Value | Use |
|---|---|---|
| `--bg-deep` | `#050d1a` | page background |
| `--bg-mid` | `#0a1628` | card backgrounds |
| `--accent-blue` | `#4a90d9` | primary accent |
| `--accent-silver` | `#c8deff` | headings |
| `--accent-moon` | `#e8f0ff` | brightest text |
| `--accent-glow` | `#7bb3f0` | glow/shadow |
| `--text-secondary` | `#8aaed4` | body text |
| `--text-dim` | `#4a6a8a` | labels, metadata |

Palette: **moonlit night** — deep navy, silver-white, cool blue. No warm/orange accents anywhere.

**Per-section accent hues:**

| Section | Color | Section | Color |
|---|---|---|---|
| About | `#7bb3f0` azure | Projects | `#45c7c0` teal |
| Skills | `#5ec8e6` cyan | Contact | `#4a90d9` blue |

Project cards: Codesense `#9b8cf5` violet, API Rate Limiter `#6fb0ef` sky.

## Architecture

```
src/
├── components/
│   ├── canvas/
│   │   ├── SpaceScene             # Canvas root, DragLookCamera, CameraSync, post-fx, scene assembly
│   │   ├── EdgeHints              # DOM waypoint markers (outside canvas, own rAF loop)
│   │   ├── Planet                 # Procedural gas giant (GLSL) + Fresnel atmosphere (section 1)
│   │   ├── BlackHole              # Gargantua shader + Keplerian skill orbs (section 2)
│   │   ├── ProjectGalaxy          # Star systems + 3D name tags (section 3)
│   │   ├── SpaceStation           # Station geometry only (section 4)
│   │   ├── BackgroundConstellations # 4 classic star patterns (fog=false)
│   │   ├── Galaxy                 # 2 distant spiral-galaxy particle disks
│   │   ├── NebulaParticles        # Additive particle clouds at inter-section midpoints
│   │   ├── Stars                  # Shader star field — scintillation + diffraction spikes
│   │   ├── SectionBeacons         # Twinkling beacons at section positions (fog=false)
│   │   ├── ButterflyNebula        # Bipolar nebula at [150,20,-105]
│   │   ├── StarCluster            # Globular cluster at [-55,50,35]
│   │   ├── HeroText               # UNUSED — name now on loading screen only
│   │   ├── PlanetInfo             # UNUSED — content moved to InfoPanel
│   │   ├── ConstellationReveal    # UNUSED by sections — kept as reusable accent
│   │   ├── AsteroidField          # UNUSED — looked boxy
│   │   └── ShootingStars          # UNUSED — removed; distracting
│   └── ui/
│       ├── LoadingScreen          # Constellation name-reveal overlay (SVG traces "MAHARSHI REDDY")
│       ├── HUD + HUD.module.css   # Brand / section label / audio toggle
│       ├── NavMenu + .module.css  # Bottom nav: Home/About/Skills/Projects/Contact + Tour + Résumé
│       └── InfoPanel + .module.css # DOM content panels per section + hero overlay + focus scrim
├── data/
│   └── sections.js     # SINGLE SOURCE OF TRUTH: positions, view poses, panel content
├── utils/
│   ├── sharedState.js  # cameraState + navState (plain module objects, no Zustand)
│   └── audio.js        # Web Audio: ambient drone + scroll-reactive whoosh
├── styles/
│   └── globals.css     # CSS vars, resets, keyframe animations
├── App.jsx             # sectionIndex state; deferred scene mount; renders DOM layer
└── main.jsx
```

## Navigation model

`sectionIndex` (0–4) in `App.jsx`, updated by proximity detection in `DragLookCamera` (within 50u). **Proximity never moves the camera** — only drives UI highlights and which panel shows.

**Section world positions:**

| idx | World centre | Sector |
|---|---|---|
| 0 | — | Deep Space / Home |
| 1 | [25, 6, 70] | About (Planet) |
| 2 | [-90, 32, -40] | Skills (Black Hole) |
| 3 | [85, -35, -90] | Projects |
| 4 | [-40, -12, -175] | Contact (Station) |

**Outward-cluster layout — don't break it:** sections sit AROUND a central point (~[0,0,-60]) so when framed on one, every other is behind the camera. EdgeHints markers clamp to screen edges instead of projecting onto the focused object. A −Z tunnel layout causes markers to land on the focused object (caused the Contact-marker-on-black-hole bug).

**Controls:** drag → look (YXZ Euler, pitch ±81°) · scroll → fly toward cursor · NavMenu/EdgeHints click → guided fly-to · Tour button → auto-fly 1→4 · touch: 1-finger look, 2-finger pinch-fly.

**Guided fly-to:** `navState.request = { pos, look }` → `DragLookCamera` lerps position + slerps orientation each frame. Clears when within 0.4u. Any drag/scroll cancels instantly.

## Camera (`DragLookCamera`)

- Start: `[0, 12, 200]` looking toward `[0, 4, 175]`
- `camera.far = 800`, `camera.fov = 60`
- Scroll flies along a ray from camera through cursor NDC; `scrollVel` decays at `0.88/frame`
- `CameraSync` writes `cameraState.{camera,width,height}` every frame for EdgeHints

## Shared state (`src/utils/sharedState.js`)

```js
cameraState = { camera: null, width: 0, height: 0 }  // written by CameraSync, read by EdgeHints rAF
navState    = { request: null }  // { pos, look } set by NavMenu/EdgeHints, tweened+cleared by DragLookCamera
```

## EdgeHints

Plain React DOM, `position:fixed`, own rAF loop. Projects each non-active section's world pos → NDC each tick. On-screen: floats marker in-world. Off-screen/behind: clamps to edge. Active section: `opacity:0`. Opacity managed only in rAF (never in JSX `style` — React would reset it on re-render). `hintOffset` in `sections.js` offsets the projected position without affecting the fly-to target (About uses `[0,-8,0]`).

## 3D scene objects

**Planet** `[25,6,70]` scale 2.5 — cool banded gas giant, fully procedural GLSL. Surface: latitude bands + fbm warp + storm oval. Atmosphere: Fresnel rim glow (two shells). 3 Saturn-style torus rings. Hover lifts atmosphere intensity.

**BlackHole** `[-90,32,-40]` — single `<Billboard>` plane (16×16), custom GLSL shader. Event horizon, photon ring, accretion disk, lensing, turbulence all drawn in 2D fragment shader. Cool blue/cyan palette. 10 Keplerian skill orbs; labels shown when `showLabels=true` (sectionIndex===2). No fog on ShaderMaterial (intentional). No orbit trails (they bloomed into false rings).

**ProjectGalaxy** `[85,-35,-90]` — two StarSystem groups. Billboard+Text name tags only; dossiers in InfoPanel.

**SpaceStation** `[-40,-12,-175]` — geometry only; contact links in InfoPanel.

**Stars** — 5200 bg + 320 bright foreground. Follows camera. Scintillation + diffraction spikes on bright stars.

**NebulaParticles** — additive clouds at inter-section midpoints (blue, violet, silver, deep blue).

**SectionBeacons** — fog=false twinkling beacons at each section's world pos (derived from sections.js). Fades < 35u.

**BackgroundConstellations** — Orion `[72,30,18]`, Big Dipper `[148,78,15]`, Cassiopeia `[-125,-52,-72]`, Leo `[115,48,-158]`. fog=false, lines at opacity 0.16.

**Galaxy** — 4 spiral disks at `[-220,120,-120]` (3-arm) and `[260,-150,-260]` (2-arm). Deep background only.

**ButterflyNebula** `[150,20,-105]` rotation `[0.2,π/2,0.12]` — bipolar nebula, cool ramp, no axial spin.

**StarCluster** `[-55,50,35]` — globular cluster, centrally concentrated, fog=false.

## DOM layer (InfoPanel)

**Hero (section 0):** centered overlay, hidden on first drag/scroll, restored only via Home button. Device-aware hint text (pinch vs scroll).

**Sections 1–4 desktop:** right-side glass card (min 440px, 92vw), scrollable, focus scrim, re-mounts on section change.

**Sections 1–4 mobile (≤720px):** collapsible bottom sheet — tap header or swipe up/down (40px threshold). Grab-handle pill. `dvh` for sheet heights. No scrim. NavMenu collapses to compact row. Contact links use 2-row CSS grid; email row has clipboard copy button with 2s checkmark feedback.

**Content kinds:** `about` (stats/experience/certs/education) · `skills` (category chips) · `projects` (cards + bullets + stack + GitHub link) · `contact` (link rows + Résumé button).

## Post-processing (SpaceScene.jsx)

`<EffectComposer multisampling={4}>`:
1. `Bloom` — intensity 2.2, luminanceThreshold 0.07, radius 0.88, mipmapBlur
2. `Noise` — `BlendFunction.OVERLAY`, opacity 0.16. **Never use `premultiply + SOFT_LIGHT`** — fringes the black hole's HDR photon ring with a complement-colored halo
3. `Vignette` — offset 0.28, darkness 0.88

DepthOfField and ChromaticAberration removed.

## Audio (`src/utils/audio.js`)

Singleton, Web Audio, no files. Silent until first user gesture (`init()` called on first mousedown/wheel/touchstart). Starts muted — opt-in via HUD toggle.
- **Ambient drone:** detuned oscillators 55–110 Hz, lowpass, slow LFO
- **Whoosh:** noise → bandpass → gain, tracks `scrollVel` via `setFlySpeed()`
- `chime()` exists but not called

## Scene fog

`<fog args={['#050d1a', 18, 55]} />` — clear within 18u, opaque at 55u. SectionBeacons/constellations use `fog={false}`.

## Mobile

`canvas { touch-action: none }`. `IS_MOBILE` (coarse pointer OR width < 820) drops `multisampling 4→0` and `dpr [1,1.5]→1`. 1-finger drag = look, 2-finger pinch = fly.

## LoadingScreen

Fullscreen overlay (`z-index:100`, bg `#050d1a`). SVG polylines trace each letter of MAHARSHI/REDDY through a starfield. **Deferred scene mount:** SpaceScene not mounted until `onReveal` callback fires, hiding shader-compile jank behind the still-opaque overlay. StrictMode-safe (empty deps `[]`, callbacks in refs).

## HUD

`z-index:10`. Brand top-left, audio toggle top-right, section label top-center. `pointer-events:none` except audio button.

## NavMenu

`z-index:30`. Bottom pill: Home · About · Skills · Projects · Contact + Tour + Résumé. Tour dwells 7000ms per sector. Manual nav cancels Tour.

## What to customize

| What | Where |
|---|---|
| About bio, Skills, Projects, Contact text | `src/data/sections.js` |
| Skill orb names (3D) | `BlackHole.jsx` `SKILLS` array |
| Project star systems (3D) | `ProjectGalaxy.jsx` `PROJECTS` array |
| Section positions + view poses | `sections.js` `SECTIONS[].world` + `.view` |
| Loading screen name | `LoadingScreen.jsx` `layoutLine` + `GLYPHS` |
| Star beacons | `SectionBeacons.jsx` `STARS` (auto-derived from sections.js) |
| Constellations | `BackgroundConstellations.jsx` `CONSTELLATIONS` |
| Nebula clouds | `NebulaParticles.jsx` `CLOUDS` |
| Galaxies | `Galaxy.jsx` `<SpiralGalaxy>` calls |
| Black hole shader | `BlackHole.jsx` `diskFrag` |
| Planet surface | `Planet.jsx` `surfaceFrag` + `atmoFrag` |
| Audio | `audio.js` |
| Favicon | `public/favicon.svg` |

Changing `sections.js` world positions automatically updates `SECTION_ZONES` and `EdgeHints TARGETS`; the 3D object positions in component props must be updated manually to match.

## CSS keyframe animations

`edgePulse` · `loadTrace` · `loadStarPop` · `loadStarTwinkle` · `loadFadeIn` · `holodrift` · `holopulse` · `scanReveal` · `clickRingPulse`

## Known constraints

- **No `<Html>` inside canvas** — labels are `<Billboard><Text>`, readable content is DOM outside canvas
- **sections.js is source of truth** — but 3D object props in component files are still literals; update both when moving sections
- **Black hole = billboarded 2D shader** — no true 3D geometry; don't add bright objects centered on it (bloom → false rings)
- **Noise blend:** `BlendFunction.OVERLAY opacity≤0.16` only; `SOFT_LIGHT` fringes the photon ring
- **Audio needs user gesture** — `init()` + `ctx.resume()` required; starts muted
- **postprocessing must stay v2.x** — v3 requires R3F v9
- **troika:** TTF/OTF/WOFF only (no woff2); `ref.current.fillOpacity` works imperatively in `useFrame`
- **EdgeHints opacity** — set only in rAF loop + ref callback; never in JSX `style`
- **`camera.updateMatrixWorld()`** — called manually in EdgeHints rAF (R3F updates matrices during `gl.render`, after `useFrame`)
- **Dynamic geometry:** `frustumCulled={false}` needed when verts start at zero and move later
- **Round sprites** — `NebulaParticles`/`ProjectGalaxy` use `circleSprite()` from `src/utils/sprite.js`
- **Mobile perf:** thin particle counts (Stars 5200, NebulaParticles) if device struggles

## Future improvements

1. **Project thumbnails** — `sections.js` `content.projects[].image` + render in InfoPanel
2. **SEO/a11y fallback** — visually-hidden full-content block for crawlers/screen readers
3. **WebGL fallback** — static HTML fallback if context unavailable
4. **Onboarding cue** — animated hint teaching drag/scroll/pinch
5. **`prefers-reduced-motion`** — calm animations + save battery
6. ~~Mobile bottom-sheet swipe + grab handle~~ ✓ Done
7. **Keyboard navigation** — number keys / arrows; visible focus rings
8. ~~Copy-email button~~ ✓ Done
9. **Hover affordance** on skill orbs / project stars
10. **Section orientation cue** — low priority (NavMenu already highlights active)
