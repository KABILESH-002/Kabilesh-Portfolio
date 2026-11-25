import * as THREE from 'three'

// Shared between the DOM (scroll) and the WebGL scene
export const hero = {
  p: 0, // scroll progress through the hero, 0..1
  v: { rain: 0, risk: 0, routeA: 0, routeB: 0 },
  routes: null,
}

const ss = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b)

// The story: intro → rain → susceptibility → routing → reveal
export const STAGES = [
  { from: 0.0, to: 0.18 },
  { from: 0.18, to: 0.4 },
  { from: 0.4, to: 0.58 },
  { from: 0.58, to: 0.82 },
  { from: 0.82, to: 1.01 },
]
export function stageValues(p) {
  return {
    rain: ss(0.18, 0.32, p) * (1 - ss(0.84, 0.95, p) * 0.7),
    risk: ss(0.4, 0.52, p),
    routeA: ss(0.6, 0.68, p),
    routeB: ss(0.68, 0.78, p),
  }
}
export const stageOf = (p) => STAGES.findIndex((s) => p >= s.from && p < s.to)
