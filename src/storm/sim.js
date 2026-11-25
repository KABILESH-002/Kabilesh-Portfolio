import * as THREE from 'three'
import { heightAt, riskAt, START, GOAL } from '../site/terrainGen.js'

// ---- tiny seeded RNG
export function rng(seed) {
  let a = seed >>> 0 || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const VILLAGERS = 5
export const WALK_SPEED = 8 // map units per second
export const SPACING = 0.8 // seconds between villagers leaving
export const PLAN_TIME = 60 // seconds
export const UNIT_M = 20 // 1 map unit ≈ 20 m (for the score card)

// A run is five missions; each one is a brand-new valley and a stronger storm
export const MISSIONS = [
  { planTime: 50, villagers: 5, slides: 4, hotspots: 1, storm: 'Moderate' },
  { planTime: 45, villagers: 6, slides: 5, hotspots: 1, storm: 'Heavy' },
  { planTime: 40, villagers: 6, slides: 6, hotspots: 2, storm: 'Heavy' },
  { planTime: 35, villagers: 7, slides: 7, hotspots: 2, storm: 'Severe' },
  { planTime: 30, villagers: 8, slides: 8, hotspots: 3, storm: 'Extreme' },
]
const PLACES = ['Misty Ridge', 'Tea Terrace', 'River Bend', 'Cloud Hill', 'Stone Crest', 'Fern Valley', 'Waterfall Gap', 'Green Steps', 'Highfield', 'Pine Hollow', 'Rain Valley', 'Lantern Hill', 'Orchid Slope', 'Mossy Bank', 'Eagle Rock']
export function placeNames(seed) {
  const r = rng(seed * 7 + 3)
  const pool = [...PLACES]
  return MISSIONS.map(() => pool.splice(Math.floor(r() * pool.length), 1)[0])
}

// Points for one mission
export function scoreMission({ you, ai, villagers, timeLeft, hint }) {
  const rows = []
  rows.push(['Villagers saved', you.safe * 100])
  if (timeLeft > 0) rows.push(['Early evacuation bonus', Math.round(timeLeft * 4)])
  rows.push(['Risk exposure', -Math.round(you.risk * 2)])
  if (you.safe > ai.safe) rows.push(['Beat SlopeGuard AI', 250])
  else if (you.safe === ai.safe && you.risk <= ai.risk * 1.15) rows.push(['Matched SlopeGuard AI', 120])
  if (hint) rows.push(['Used AI forecast', -150])
  const total = Math.max(0, rows.reduce((a, [, v]) => a + v, 0))
  let stars = 0
  if (you.safe >= Math.ceil(villagers / 2)) stars = 1
  if (stars && you.safe >= ai.safe) stars = 2
  if (you.safe === villagers && you.risk <= ai.risk * 1.15) stars = 3
  return { rows, total, stars }
}
export const RANKS = [
  [0, 'Storm Rookie'],
  [1500, 'Slope Scout'],
  [2600, 'Rescue Ranger'],
  [3600, 'Storm Marshal'],
  [4600, 'SlopeGuard Commander'],
]
export const rankFor = (score) => [...RANKS].reverse().find(([min]) => score >= min)[1]

/*
  The storm: landslides are sampled from the SAME risk field the AI uses,
  but randomly. High-risk slopes usually fail, sometimes they don't, and
  occasionally a "safe-looking" slope does. That is the uncertainty
  SlopeGuard's routing is designed for.
*/
export function makeStorm(seed, count = 6, span = 6.5) {
  const r = rng(seed)
  const slides = []
  let guard = 0
  while (slides.length < count && guard++ < 30000) {
    const x = (r() - 0.5) * 96
    const z = (r() - 0.5) * 96
    const rk = riskAt(x, z)
    if (rk < 0.42 || r() > Math.pow(rk, 2)) continue
    if (Math.hypot(x - START.x, z - START.y) < 13 || Math.hypot(x - GOAL.x, z - GOAL.y) < 12) continue
    if (slides.some((s) => Math.hypot(s.x - x, s.z - z) < 10)) continue
    slides.push({ x, z, radius: 3.5 + r() * 2.5, time: 1.0 + r() * span, triggered: false })
  }
  slides.sort((a, b) => a.time - b.time)
  return { seed, slides }
}

// Dense, terrain-draped polyline through 2D waypoints (x, z)
export function drapePath(points2d, step = 0.7) {
  const out = []
  for (let i = 0; i < points2d.length - 1; i++) {
    const a = points2d[i], b = points2d[i + 1]
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    const n = Math.max(1, Math.ceil(d / step))
    for (let k = 0; k < n; k++) {
      const t = k / n
      const x = a.x + (b.x - a.x) * t, z = a.y + (b.y - a.y) * t
      out.push(new THREE.Vector3(x, heightAt(x, z) + 0.35, z))
    }
  }
  const last = points2d[points2d.length - 1]
  out.push(new THREE.Vector3(last.x, heightAt(last.x, last.y) + 0.35, last.y))
  return out
}

export function pathInfo(pts) {
  const cum = [0]
  let exp = 0, peak = 0
  for (let i = 1; i < pts.length; i++) {
    const seg = pts[i].distanceTo(pts[i - 1])
    cum.push(cum[i - 1] + seg)
    const rr = riskAt(pts[i].x, pts[i].z)
    exp += rr * seg
    peak = Math.max(peak, rr)
  }
  const length = cum[cum.length - 1]
  return { pts, cum, length, meanRisk: length ? exp / length : 0, peakRisk: peak }
}

export function pointAt(info, d, out = new THREE.Vector3()) {
  const { pts, cum, length } = info
  if (d <= 0) return out.copy(pts[0])
  if (d >= length) return out.copy(pts[pts.length - 1])
  let lo = 0, hi = cum.length - 1
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1
    if (cum[m] < d) lo = m
    else hi = m
  }
  const t = (d - cum[lo]) / (cum[hi] - cum[lo] || 1)
  return out.lerpVectors(pts[lo], pts[hi], t)
}

// Simulate one group of villagers on a route against the storm, step by step
export function newGroup(info, n = VILLAGERS) {
  return Array.from({ length: n }, (_, i) => ({ i, d: 0, state: 'waiting', delay: i * SPACING, pos: new THREE.Vector3().copy(info.pts[0]) }))
}
export const SLIDE_WINDOW = 1.6 // seconds a slide stays deadly
export function stepGroup(group, info, storm, t) {
  for (const v of group) {
    if (v.state === 'caught' || v.state === 'safe') continue
    const walk = t - v.delay
    if (walk < 0) continue
    v.state = 'walking'
    v.d = Math.min(info.length, walk * WALK_SPEED)
    pointAt(info, v.d, v.pos)
    for (const s of storm.slides) {
      if (t >= s.time && t <= s.time + SLIDE_WINDOW && Math.hypot(v.pos.x - s.x, v.pos.z - s.z) < s.radius) {
        v.state = 'caught'
        break
      }
    }
    if (v.state === 'walking' && v.d >= info.length) v.state = 'safe'
  }
  return group
}
export const groupDone = (g) => g.every((v) => v.state === 'safe' || v.state === 'caught')
export const safeCount = (g) => g.filter((v) => v.state === 'safe').length

// How many slide zones does a route pass through (regardless of timing)?
export function zonesCrossed(info, storm) {
  return storm.slides.filter((s) => info.pts.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < s.radius)).length
}
