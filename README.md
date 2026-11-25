# Kumuthavannan Kabileshwar: portfolio

A creative, story-driven portfolio for a **full-stack developer & AI researcher**, built with React, Three.js (WebGL) and Vite.

The site is told in chapters. A single field of about 14,000 particles runs through the whole page and re-forms into a new shape for each section:

| Section | Particles become | Theme | What happens |
| --- | --- | --- | --- |
| Intro | your name | ink & orange | Particles fly in to spell KABILESH |
| About | a network sphere | ink | Your CV summary lights up word by word as you scroll |
| Chapter index | sphere | ink | The five project stories, click to jump |
| 01 SlopeGuard AI | terrain | forest & amber | Live 3D terrain: rain → risk map → shortest vs risk-aware route (Dijkstra) |
| 02 Scheduler AI | chat bubble | indigo, grid paper | Level picker → question → personalised answer → accessible on any screen |
| 03 Weather Forecast Website | cloud & rain | sky blue | Conditions → charts draw → radar map → reflows to phone |
| 04 Hunger SL | heart | warm terracotta | UX process: research → personas & flows → wireframe to hi-fi → prototype |
| 05 Hydro Alert | water drop | aqua | Usage ring fills → tips → gamification → emergency alert |
| Experience | sphere | violet | Horizontal-scroll freelance cards |
| Skills | lattice cube | violet | Kinetic skill marquees + full grouped list |
| Education & references | sphere | violet | Timeline |
| Contact | HELLO | ink & orange | Contact, CV, link to Storm Mode |

Each chapter has a cover, a pinned "how it works" story (one step per screen), and a "project file" with every CV detail. The SlopeGuard file also includes the research questions, approach, stack, study area and progress.

## ⚡ Storm Mode (`storm.html`): a game about the research

A proper game built on the research. A run is **five missions**, and every mission generates a brand-new valley (terrain, river, village, shelter, risk hotspots and storm) from a seed, so no two sessions are the same.

- **Loop:** Menu → mission brief → plan → evacuation → storm report → next mission → final score. Each mission brings more villagers, more landslides, more hotspots and less planning time (50 s down to 30 s; Moderate → Extreme storm).
- **Draw the route:** press and drag on the terrain to draw a freehand route from the village to the shelter (it snaps to the shelter). Right-drag or two fingers rotate the camera.
- **Same storm for everyone:** landslides are sampled from the same risk field the AI uses, with real randomness. The player's villagers and SlopeGuard AI's villagers face identical slides.
- **Scoring:** +100 per villager saved, +4 per second you evacuate early, −2 per % average risk, +250 for beating the AI (+120 for matching it), −150 for using the AI forecast. Up to 3 stars per mission (15 per run), five ranks from Storm Rookie to SlopeGuard Commander, and a best score saved in the browser.
- **Game feel:** "+100 Safe!" and "Villager caught!" popups, a countdown beep, thunder, rumble, chime and fanfare sounds, all generated with WebAudio (no audio files).
- **WebXR:** on a VR headset, "Play in VR" turns the map into a tabletop diorama with controller-ray drawing and a 3D panel for every phase (Play, Start mission, Undo, AI forecast, Evacuate, Retry, Next mission).
- **Testing:** `storm.html?ts=6` speeds the simulation up and exposes `window.__storm` (screen positions of the village and shelter) for automated play-tests.

Game code lives in `src/storm/`: `Game.jsx` (procedural world, 3D scene, VR, game loop), `sim.js` (missions, storm, villagers, scoring, ranks), `store.js` (game state and phases), `StormUI.jsx`, `audio.js` and `storm.css`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (portfolio), /storm.html (Storm Mode)
npm run build      # production build in /dist (both pages)
npm run preview
```

Requires Node 18 or newer. To deploy on Vercel or Netlify, use build command `npm run build` and output folder `dist`. For GitHub Pages, publish `dist`; relative paths work from any sub-path.

## Where to edit things

| What | File |
| --- | --- |
| **All CV content**: summary, education, research, projects, skills, experience, references | `src/data/cv.js` |
| Step-by-step story text for each project | `src/v2/stories.js` |
| GitHub / LinkedIn / other links | `person.links` in `src/data/cv.js` |
| Page sections & layout | `src/v2/App.jsx`, `src/v2/Chapter.jsx` |
| Animated project visuals (one per chapter) | `src/v2/visuals.jsx` |
| Styles, chapter themes, animations | `src/v2/v2.css`; colour themes in `src/v2/particles/morph.js` |
| Particle shapes & morphing | `src/v2/particles/shapes.js`, `src/v2/particles/Particles.jsx` |
| SlopeGuard 3D terrain & routing | `src/site/Terrain.jsx`, `src/site/terrainGen.js` |
| CV download | `public/Kabileshwar-CV.pdf` |
| Storm Mode game | `src/storm/` |

## Notes

- The SlopeGuard terrain is **illustrative**. It is labelled on the page as not real data or warnings.
- Particle positions per section are set with `data-shape`, `data-x`, `data-y`, `data-scale` and `data-alpha` attributes in `App.jsx` and `Chapter.jsx`.
- SlopeGuard AI is described as a research prototype, in line with the project scope: it does not issue official warnings or guarantee a safe route.
- All content is plain HTML, so it still reads without WebGL. Reduced-motion users get no smooth scrolling and no marquee or reveal animations.
- All content is plain HTML text, so search engines and screen readers can read it. The page also includes schema.org Person data.
