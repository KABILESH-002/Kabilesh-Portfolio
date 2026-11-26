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
| Arcade | lattice cube | ink | Five game cards, one per project, linking to the Arcade |
| Contact | HELLO | ink & orange | Contact, CV, link to the Arcade |

Each chapter has a cover, a pinned "how it works" story (one step per screen), and a "project file" with every CV detail. The SlopeGuard file also includes the research questions, approach, stack, study area and progress.

## 🎮 Arcade (`arcade.html`): one mini-game per project

The portfolio has a full **Arcade** with five short games, each built around the core idea of a project on the CV. Every chapter also ends with a "Play it" card for its game, and the nav has an Arcade button.

| Game | Project | How it plays |
| --- | --- | --- |
| ⚡ Storm Mode | SlopeGuard AI | 3D evacuation planning vs the AI, browser & VR (see below) |
| 🎓 Study Sprint | Scheduler AI | 60 s chat-style quiz with an AI tutor. Climb from Grade 6 to A/L, build streaks, use 3 hints |
| ☔ Radar Call | Weather Forecast Website | Read a radar loop over Sri Lanka and forecast which towns get rain; results shown as a rainfall chart. 6 rounds |
| 🍱 Food Link | Hunger SL | 90 s dispatch game: drag donors to families (vegetarian needs, freshness, 3 volunteers) |
| 💧 Leak Patrol | Hydro Alert | 75 s: fix leaks before they burst, keep the tank up, catch rain drops and send emergency alerts to the right zone |

- Routing is by hash: `arcade.html` is the hub, `arcade.html#study`, `#radar`, `#food`, `#leak` open a game.
- Every game has a how-to screen, a results screen with stars, rank, stats, badges and "how this connects to the project", and a best score saved in the browser.
- Sounds are generated with WebAudio. The games work with touch, mouse and keyboard (Study Sprint 1–4 and H, Leak Patrol alerts 1–3), and the layouts adapt to phones.
- Code: `src/arcade/` — `games.js` (line-up, themes, ranks), `Hub.jsx`, `Shell.jsx` (shared intro/results frame), `games/*.jsx`, `sfx.js`, `best.js`, `arcade.css`.

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
npm run dev        # http://localhost:5173 (portfolio), /arcade.html (Arcade), /storm.html (Storm Mode)
npm run build      # production build in /dist (all three pages)
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
| Arcade & the other mini-games | `src/arcade/` |

## Notes

- The SlopeGuard terrain is **illustrative**. It is labelled on the page as not real data or warnings.
- Particle positions per section are set with `data-shape`, `data-x`, `data-y`, `data-scale` and `data-alpha` attributes in `App.jsx` and `Chapter.jsx`.
- SlopeGuard AI is described as a research prototype, in line with the project scope: it does not issue official warnings or guarantee a safe route.
- All content is plain HTML, so it still reads without WebGL. Reduced-motion users get no smooth scrolling and no marquee or reveal animations.
- All content is plain HTML text, so search engines and screen readers can read it. The page also includes schema.org Person data.
