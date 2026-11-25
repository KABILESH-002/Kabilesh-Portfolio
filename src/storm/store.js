import { useSyncExternalStore } from 'react'
import { MISSIONS, placeNames } from './sim.js'

const BEST_KEY = 'stormmode.best'
const loadBest = () => {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY)) || { score: 0, stars: 0 }
  } catch {
    return { score: 0, stars: 0 }
  }
}

/*
  Phases:  menu → brief → plan → evac → report → (next mission: brief …) → final
*/
let state = {
  phase: 'menu',
  runSeed: 0,
  mission: 0, // 0..4
  places: placeNames(1),
  worldSeed: 0, // changes every mission → new valley, village, shelter, storm
  timeLeft: MISSIONS[0].planTime,
  waypoints: [], // [{x, y}] map coordinates (y = z)
  complete: false, // route reaches the shelter
  hint: false,
  rainMM: 0,
  you: { safe: 0, caught: 0 },
  ai: { safe: 0, caught: 0 },
  report: null, // last mission result
  results: [], // all mission results in this run
  score: 0,
  best: loadBest(),
  newBest: false,
  xr: false,
  loading: false,
}
const subs = new Set()
export const getState = () => state
export function set(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
  subs.forEach((f) => f())
}
export function useStore(sel) {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => sel(state)
  )
}
export const mission = () => MISSIONS[state.mission]

// mutable per-frame data (not React state)
export const live = { rain: 0, shake: 0, flash: 0, evacT: 0, groups: null, storm: null, youInfo: null, aiInfo: null, hover: null, drawing: false, popups: [] }

function resetMission(m) {
  live.evacT = 0
  live.groups = null
  live.drawing = false
  live.storm?.slides.forEach((x) => (x.triggered = false))
  return { timeLeft: MISSIONS[m].planTime, waypoints: [], complete: false, hint: false, rainMM: 0, you: { safe: 0, caught: 0 }, ai: { safe: 0, caught: 0 }, report: null }
}

export function newRun() {
  const runSeed = Math.floor(Math.random() * 1e9)
  set({ ...resetMission(0), phase: 'brief', runSeed, mission: 0, places: placeNames(runSeed), worldSeed: runSeed + 1, results: [], score: 0, newBest: false })
}
export function startPlanning() {
  set({ phase: 'plan' })
}
export function retryMission() {
  // same valley, same storm, score for this mission is replaced
  const s = state
  set({ ...resetMission(s.mission), phase: 'brief', results: s.results.slice(0, s.mission), score: s.results.slice(0, s.mission).reduce((a, r) => a + r.points.total, 0) })
}
export function nextMission() {
  const s = state
  if (s.mission >= MISSIONS.length - 1) return finishRun()
  const m = s.mission + 1
  set({ ...resetMission(m), phase: 'brief', mission: m, worldSeed: s.runSeed + 1 + m * 7919 })
}
export function finishRun() {
  const s = state
  const stars = s.results.reduce((a, r) => a + r.points.stars, 0)
  const newBest = s.score > s.best.score
  const best = newBest ? { score: s.score, stars } : s.best
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best))
  } catch {
    /* private mode */
  }
  set({ phase: 'final', best, newBest })
}
export function toMenu() {
  set({ ...resetMission(0), phase: 'menu', mission: 0 })
}

export function popup(text, kind = 'good') {
  const id = Math.random()
  live.popups = [...live.popups, { id, text, kind }]
  set({ popups: live.popups })
  setTimeout(() => {
    live.popups = live.popups.filter((p) => p.id !== id)
    set({ popups: live.popups })
  }, 1600)
}
