# Maharshi Reddy — Portfolio

**[Portfolio Link](https://maharshi-reddy.vercel.app)**

A 3D space-themed portfolio built with React Three Fiber. Fly through a procedurally rendered universe to explore five sectors — About, Skills, Projects, Contact, and deep space home.

---

## Experience

Drag to look · Scroll (or pinch on mobile) to fly · Click waypoint markers to jump · Hit **Tour** to autopilot through every sector.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| 3D Engine | React Three Fiber + Three.js |
| Post-processing | @react-three/postprocessing v2 (Bloom, Vignette, Noise) |
| Shaders | Custom GLSL — planet surface, black hole, star field |
| Styling | CSS Modules + CSS custom properties |
| Fonts | Space Grotesk · Space Mono (Google Fonts) |
| Deployment | Vercel |

---

## Architecture

```
src/
├── components/
│   ├── canvas/         # Three.js scene objects (Planet, BlackHole, ProjectGalaxy, SpaceStation, Stars…)
│   └── ui/             # DOM overlay (LoadingScreen, HUD, NavMenu, InfoPanel, EdgeHints)
├── data/
│   └── sections.js     # Single source of truth — positions, camera poses, all panel content
├── utils/
│   ├── sharedState.js  # Shared camera + nav state (plain module, no Zustand)
│   ├── audio.js        # Web Audio ambient drone + scroll-reactive whoosh
│   └── device.js       # Mobile tier detection → adaptive DPR + MSAA
└── styles/
    └── globals.css     # Design tokens, keyframe animations
```

### Navigation model

`sectionIndex` (0–4) lives in `App.jsx` and is updated by proximity detection in `DragLookCamera` (within 50 world-units). Proximity **never moves the camera** — it only drives UI highlights and which panel renders.

Sections are arranged radially around a central point so that when any one is in frame, all others are behind the camera. EdgeHints markers clamp to screen edges, staying out of the way of whatever you're looking at.

### 3D highlights

- **Planet** — procedural GLSL gas giant with latitude bands, FBM warp, a storm oval, and a Fresnel atmosphere. Three Saturn-style rings.
- **Black Hole** — single billboarded plane, full Gargantua-style shader (event horizon, photon ring, accretion disk, gravitational lensing). Ten Keplerian skill orbs in orbit.
- **Project Galaxy** — two star systems with 3D name tags.
- **Stars** — 5 200 background + 320 foreground stars with scintillation and diffraction spikes. Follows the camera.
- **Background** — spiral galaxies, globular cluster, butterfly nebula, nebula particle clouds, classic constellation line art.

### Adaptive quality

`device.js` scores the device at load using `hardwareConcurrency` and `devicePixelRatio` then picks a render preset:

| Tier | Detected when | DPR | MSAA |
|---|---|---|---|
| High | ≥ 8 cores + DPR ≥ 2.5 | up to 2.5× | 4 |
| Mid | ≥ 6 cores or DPR ≥ 2 | up to 2× | 2 |
| Low | budget / older device | 1× | 0 |
| Desktop | non-mobile | up to 1.5× | 4 |

---

## Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

---

## Customising Content

Everything you'd want to change is in one file:

```bash
src/data/sections.js   # bio, skills, projects, contact links, resume path
```

Skill orb labels (3D) live in `BlackHole.jsx`. Project star names live in `ProjectGalaxy.jsx`. Both need to match `sections.js` if you rename anything.

---
