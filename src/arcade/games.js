// The arcade line-up: one game per project on the CV.
import { THEMES } from '../v2/particles/morph.js'

export const GAMES = [
  {
    id: 'storm',
    href: './storm.html',
    title: 'Storm Mode',
    project: 'SlopeGuard AI',
    projectHref: './index.html#slopeguard',
    icon: '⚡',
    theme: THEMES.slopeguard,
    tagline: 'Plan evacuations through five storms and try to beat SlopeGuard AI.',
    skill: 'Risk-aware routing',
    meta: '5 missions · 3D · browser & VR',
  },
  {
    id: 'study',
    title: 'Study Sprint',
    project: 'Scheduler AI',
    projectHref: './index.html#scheduler',
    icon: '🎓',
    theme: THEMES.scheduler,
    tagline: 'Answer quick questions with the AI tutor and climb from Grade 6 to A/L before the clock runs out.',
    skill: 'Personalised learning',
    meta: '60 s · quiz · keyboard 1–4',
    how: [
      'The tutor asks a question. Pick one of four answers (tap, or press 1–4).',
      'A right answer adds time and builds your streak. A wrong one costs 3 seconds.',
      'Five right answers move you up a grade, from Grade 6 to A/L. Harder grades are worth more.',
      'Stuck? Ask the AI tutor (3 per run) for a hint that removes two wrong answers.',
    ],
    ranks: [
      [0, 'Fresh starter'],
      [600, 'Steady learner'],
      [1500, 'Top of the class'],
      [3000, 'A/L ace'],
    ],
  },
  {
    id: 'radar',
    title: 'Radar Call',
    project: 'Weather Forecast Website',
    projectHref: './index.html#weather',
    icon: '☔',
    theme: THEMES.weather,
    tagline: 'Read the rain radar and forecast which towns get wet before the storm cells drift in.',
    skill: 'Charts & map concepts',
    meta: '6 rounds · forecasting · tap',
    how: [
      'Rain cells drift across the map. The faded trail shows where each one was over the last hours.',
      'Tap the towns you think will get rain within the forecast window, then press Run forecast.',
      'Right calls score points. False alarms and missed rain cost points.',
      'Later rounds drop the wind arrow, and some cells grow (▲) or fade (▼) as they move.',
    ],
    ranks: [
      [0, 'Cloud spotter'],
      [1800, 'Weather watcher'],
      [3200, 'Forecaster'],
      [4400, 'Chief meteorologist'],
    ],
  },
  {
    id: 'food',
    title: 'Food Link',
    project: 'Hunger SL',
    projectHref: './index.html#hunger',
    icon: '🍱',
    theme: THEMES.hunger,
    tagline: 'Connect food donors with families nearby before meals go to waste.',
    skill: 'User flows & matching',
    meta: '90 s · dispatch · drag or tap',
    how: [
      'Donors (🍱 or 🥗) appear around the city, and so do families who need a meal (🏠).',
      'Drag from a donor to a family, or tap one then the other, to send a volunteer.',
      'Families marked 🥗 need a vegetarian meal. Food and patience both run out, so watch the rings.',
      'You have three volunteers. Short trips free them up sooner. Three missed families ends the run.',
    ],
    ranks: [
      [0, 'New volunteer'],
      [1200, 'Community helper'],
      [2600, 'Food hero'],
      [4000, 'Hunger SL champion'],
    ],
  },
  {
    id: 'leak',
    title: 'Leak Patrol',
    project: 'Hydro Alert',
    projectHref: './index.html#hydro',
    icon: '💧',
    theme: THEMES.hydro,
    tagline: 'Fix leaks across the neighbourhood, keep the tank from running dry and answer emergency alerts.',
    skill: 'Gamification & alerts',
    meta: '75 s · reflex · tap',
    how: [
      'Leaks pop up in homes. Tap a leak to fix it. Bursts need several taps.',
      'Every leak drains the shared water tank. If the tank runs dry, the run ends.',
      'Fix leaks quickly to build a streak and catch falling rain drops to refill the tank.',
      'When an emergency alert appears, send it to the right zone before the timer runs out.',
    ],
    ranks: [
      [0, 'Drip spotter'],
      [1500, 'Pipe fixer'],
      [3000, 'Water saver'],
      [4500, 'Hydro hero'],
    ],
  },
]

export const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]))

export function rankFor(game, score) {
  let r = game.ranks?.[0]?.[1] || ''
  let stars = 0
  game.ranks?.forEach(([min, name], i) => {
    if (score >= min) {
      r = name
      stars = i
    }
  })
  return { name: r, stars }
}
