import * as THREE from 'three'

// Illustrative hill terrain + risk field + two real Dijkstra routes over a road-like grid graph.
// Nothing here is real data: it is a visual explanation of SlopeGuard AI's idea.

export const SIZE = 100 // routing area, x/z in [-50, 50]
export const TILE = 260 // rendered terrain extends beyond it and fades into haze
export const RES = 230 // terrain vertices per side

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x, y, oct = 5) {
  let v = 0, a = 0.5, f = 1
  for (let i = 0; i < oct; i++) {
    v += a * vnoise(x * f, y * f)
    f *= 2.03
    a *= 0.5
  }
  return v
}

/*
  World parameters. The portfolio uses the default world; Storm Mode calls
  setWorld(seed, …) to generate a brand-new valley for every mission.
*/
const DEFAULT = { o1: [0, 0], o2: [3.1, 7.7], amp: 9, freq: 0.045, phase: 0, tilt: 0.12, shift: -4, plateau: [30, -26], hots: [[0, -12]] }
const W = { ...DEFAULT }

// river runs roughly west → east through the valley
export const riverZ = (x) => Math.sin(x * W.freq + W.phase) * W.amp + x * W.tilt + W.shift
export function heightAt(x, z) {
  const ridge = 1 - Math.abs(fbm(x * 0.03 + W.o2[0], z * 0.03 + W.o2[1]) * 2 - 1)
  let h = fbm(x * 0.035 + W.o1[0], z * 0.035 + W.o1[1]) * 16 + ridge * 9
  const d = Math.abs(z - riverZ(x))
  const valley = THREE.MathUtils.smoothstep(d, 2, 20)
  h = h * (0.12 + 0.88 * valley)
  // a stable plateau where the shelter sits
  const pd = Math.hypot(x - W.plateau[0], z - W.plateau[1])
  h = THREE.MathUtils.lerp(h, Math.max(h, 11), 0.75 * Math.exp(-(pd * pd) / 110))
  return h
}

export function slopeAt(x, z) {
  const e = 0.6
  const dx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e)
  const dz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e)
  return Math.hypot(dx, dz)
}

export const HOTSPOT = { x: 0, z: -12 }
export const START = new THREE.Vector2(-30, riverZ(-30) + 3.5) // village in the valley
export const GOAL = new THREE.Vector2(30, -26) // shelter on the plateau

export function riskAt(x, z) {
  const s = slopeAt(x, z)
  let r = THREE.MathUtils.smoothstep(s, 0.55, 1.4) * (0.5 + 0.5 * fbm(x * 0.08 + 9 + W.o1[0], z * 0.08 + 2 + W.o1[1], 3))
  // known unstable slopes
  for (const [hx, hz] of W.hots) {
    const hd = Math.hypot(x - hx, z - hz)
    r = Math.max(r, Math.exp(-(hd * hd) / 120) * 0.95)
  }
  // river banks get undercut in heavy rain
  const d = Math.abs(z - riverZ(x))
  r = Math.max(r, Math.exp(-(d * d) / 6) * 0.35 * THREE.MathUtils.smoothstep(s, 0.2, 0.8))
  return THREE.MathUtils.clamp(r, 0, 1)
}

function seeded(seed) {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Generate a new valley: terrain, river, village, shelter and unstable slopes
export function setWorld(seed, { hotspots = 1 } = {}) {
  if (seed == null) {
    Object.assign(W, DEFAULT, { hots: DEFAULT.hots.map((h) => [...h]) })
    START.set(-30, riverZ(-30) + 3.5)
    GOAL.set(30, -26)
    return W
  }
  const r = seeded(seed)
  W.o1 = [r() * 50, r() * 50]
  W.o2 = [r() * 50, r() * 50]
  W.amp = 5 + r() * 9
  W.freq = 0.03 + r() * 0.035
  W.phase = r() * Math.PI * 2
  W.tilt = (r() - 0.5) * 0.3
  W.shift = (r() - 0.5) * 10
  const side = r() < 0.5 ? -1 : 1 // which side of the map the village is on
  const across = r() < 0.5 ? -1 : 1 // which side of the river the shelter is on
  const sx = side * (26 + r() * 8)
  START.set(sx, riverZ(sx) + 3.5 * (r() < 0.5 ? 1 : -1))
  const gx = -side * (24 + r() * 8)
  const gz = THREE.MathUtils.clamp(riverZ(gx) + across * (18 + r() * 8), -40, 40)
  W.plateau = [gx, gz]
  GOAL.set(gx, gz)
  // unstable slopes sit between the village and the shelter, off the straight line
  W.hots = []
  for (let k = 0; k < hotspots; k++) {
    const t = (k + 1) / (hotspots + 1) + (r() - 0.5) * 0.15
    const mx = START.x + (GOAL.x - START.x) * t
    const mz = START.y + (GOAL.y - START.y) * t
    const dx = GOAL.x - START.x, dz = GOAL.y - START.y
    const len = Math.hypot(dx, dz)
    const off = (r() - 0.5) * 10
    W.hots.push([mx + (-dz / len) * off, mz + (dx / len) * off])
  }
  HOTSPOT.x = W.hots[0][0]
  HOTSPOT.z = W.hots[0][1]
  return W
}

export function buildTerrain(size = TILE, res = RES) {
  const g = new THREE.PlaneGeometry(size, size, res - 1, res - 1)
  g.rotateX(-Math.PI / 2)
  const p = g.attributes.position
  const risk = new Float32Array(p.count)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i)
    p.setY(i, heightAt(x, z))
    risk[i] = riskAt(x, z)
  }
  g.setAttribute('aRisk', new THREE.BufferAttribute(risk, 1))
  g.computeVertexNormals()
  return g
}

/* ---------- routing on a grid graph (8-neighbour) ---------- */
const N = 56
const step = SIZE / (N - 1)
const idx = (i, j) => j * N + i
const pos = (i, j) => [-50 + i * step, -50 + j * step]

function dijkstra(costFn, from, to) {
  const n = N * N
  const dist = new Float64Array(n).fill(Infinity)
  const prev = new Int32Array(n).fill(-1)
  const done = new Uint8Array(n)
  dist[from] = 0
  // binary heap
  const heap = [[0, from]]
  const push = (it) => {
    heap.push(it)
    let k = heap.length - 1
    while (k > 0) {
      const pa = (k - 1) >> 1
      if (heap[pa][0] <= heap[k][0]) break
      ;[heap[pa], heap[k]] = [heap[k], heap[pa]]
      k = pa
    }
  }
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()
    if (heap.length) {
      heap[0] = last
      let k = 0
      for (;;) {
        const l = 2 * k + 1, r = l + 1
        let m = k
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r
        if (m === k) break
        ;[heap[m], heap[k]] = [heap[k], heap[m]]
        k = m
      }
    }
    return top
  }
  while (heap.length) {
    const [d, u] = pop()
    if (done[u]) continue
    done[u] = 1
    if (u === to) break
    const ui = u % N, uj = (u / N) | 0
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue
        const vi = ui + di, vj = uj + dj
        if (vi < 0 || vj < 0 || vi >= N || vj >= N) continue
        const v = idx(vi, vj)
        if (done[v]) continue
        const c = costFn(ui, uj, vi, vj)
        if (d + c < dist[v]) {
          dist[v] = d + c
          prev[v] = u
          push([dist[v], v])
        }
      }
  }
  const path = []
  for (let u = to; u !== -1; u = prev[u]) path.push(u)
  return path.reverse()
}

function nearestNode(v) {
  const i = Math.round((v.x + 50) / step)
  const j = Math.round((v.y + 50) / step)
  return idx(THREE.MathUtils.clamp(i, 0, N - 1), THREE.MathUtils.clamp(j, 0, N - 1))
}

function edge(ui, uj, vi, vj) {
  const [x1, z1] = pos(ui, uj)
  const [x2, z2] = pos(vi, vj)
  const h1 = heightAt(x1, z1), h2 = heightAt(x2, z2)
  const len = Math.hypot(x2 - x1, z2 - z1, h2 - h1)
  const climb = Math.abs(h2 - h1) / Math.hypot(x2 - x1, z2 - z1)
  const r = (riskAt(x1, z1) + riskAt(x2, z2)) / 2
  return { len, climb, r }
}

function toPoints(path) {
  const pts = path.map((u) => {
    const [x, z] = pos(u % N, (u / N) | 0)
    return new THREE.Vector3(x, heightAt(x, z), z)
  })
  const c = new THREE.CatmullRomCurve3(pts)
  const out = c.getSpacedPoints(Math.max(80, pts.length * 6))
  for (const v of out) v.y = heightAt(v.x, v.z) + 0.35
  return out
}

function stats(points) {
  let len = 0, exp = 0, peak = 0
  for (let k = 1; k < points.length; k++) {
    const seg = points[k].distanceTo(points[k - 1])
    len += seg
    const r = riskAt(points[k].x, points[k].z)
    exp += r * seg
    peak = Math.max(peak, r)
  }
  return { length: len, meanRisk: exp / len, peakRisk: peak }
}

export function computeRoutes({ tailFrom = 0.45, tailWeight = 40 } = {}) {
  const from = nearestNode(START), to = nearestNode(GOAL)
  // shortest: distance only (gentle penalty for very steep climbs so it stays walkable)
  const shortest = dijkstra((a, b, c, d) => {
    const e = edge(a, b, c, d)
    return e.len * (1 + Math.max(0, e.climb - 0.9) * 3)
  }, from, to)
  // risk-aware: distance inflated by expected exposure and its tail (a simple CVaR-like penalty)
  const robust = dijkstra((a, b, c, d) => {
    const e = edge(a, b, c, d)
    const tail = Math.max(0, e.r - tailFrom)
    return e.len * (1 + Math.max(0, e.climb - 0.9) * 3 + 6 * e.r * e.r + tailWeight * tail * tail)
  }, from, to)
  const sp = toPoints(shortest)
  const rp = toPoints(robust)
  return { shortest: sp, robust: rp, shortestStats: stats(sp), robustStats: stats(rp) }
}
