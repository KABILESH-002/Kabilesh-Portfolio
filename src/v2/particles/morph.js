// Reads the [data-shape] anchors on the page and works out which particle shape
// (and colour theme) should be showing for the current scroll position.

export const THEMES = {
  intro: { bg: '#0a0a0f', ink: '#f5efe4', accent: '#ff6b3d', accent2: '#3de0c8' },
  slopeguard: { bg: '#0b1016', ink: '#e9eef3', accent: '#3de0c8', accent2: '#ffb547' },
  scheduler: { bg: '#110f26', ink: '#efeaff', accent: '#8b7cff', accent2: '#ffd166' },
  weather: { bg: '#0b1a2e', ink: '#eaf4ff', accent: '#ffc457', accent2: '#5ab0ff' },
  hunger: { bg: '#24120d', ink: '#fff1e6', accent: '#ff7a50', accent2: '#ffd8a8' },
  hydro: { bg: '#03202a', ink: '#e6fbff', accent: '#3ec6ff', accent2: '#7bffd9' },
  beyond: { bg: '#0d0c14', ink: '#efeaff', accent: '#c9b6ff', accent2: '#3de0c8' },
  contact: { bg: '#0a0a0f', ink: '#f5efe4', accent: '#ff6b3d', accent2: '#3de0c8' },
}

export const morph = { a: 'name', b: 'name', t: 0, alpha: 1, x: 0, y: 0, scale: 1, theme: 'intro' }

const ss = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

let anchors = []
let lastScan = 0
function scan() {
  anchors = [...document.querySelectorAll('[data-shape]')].map((el) => ({ el, top: 0, h: 0 }))
}
export function updateMorph(now) {
  if (now - lastScan > 1000 || !anchors.length) {
    scan()
    lastScan = now
  }
  const vh = innerHeight
  const line = vh * 0.5
  for (const a of anchors) {
    const r = a.el.getBoundingClientRect()
    a.top = r.top
    a.h = r.height
  }
  let i = 0
  for (let k = 0; k < anchors.length; k++) if (anchors[k].top <= line) i = k
  const A = anchors[i]
  const B = anchors[Math.min(i + 1, anchors.length - 1)]
  if (!A) return morph
  // morph during the last ~70% of a viewport before the next anchor reaches the middle
  const dist = B === A ? Infinity : B.top - line
  const t = B === A ? 0 : 1 - ss(0, vh * 0.7, dist)
  const d = (el, k, def) => (el.dataset[k] !== undefined ? parseFloat(el.dataset[k]) : def)
  const wide = innerWidth > innerHeight * 1.05
  morph.a = A.el.dataset.shape
  morph.b = B.el.dataset.shape
  morph.t = t
  const mix = (k, def) => d(A.el, k, def) * (1 - t) + d(B.el, k, def) * t
  morph.alpha = wide ? mix('alpha', 1) : d(A.el, 'malpha', d(A.el, 'alpha', 1)) * (1 - t) + d(B.el, 'malpha', d(B.el, 'alpha', 1)) * t
  morph.x = wide ? mix('x', 0) : 0
  morph.y = wide ? mix('y', 0) : mix('my', 0.8)
  morph.scale = mix('scale', 1) * (wide ? 1 : 0.62)
  const theme = (t > 0.5 ? B : A).el.dataset.theme || morph.theme
  if (theme !== morph.theme) {
    morph.theme = theme
    const T = THEMES[theme]
    const root = document.documentElement.style
    root.setProperty('--bg', T.bg)
    root.setProperty('--ink', T.ink)
    root.setProperty('--accent', T.accent)
    root.setProperty('--accent2', T.accent2)
    document.documentElement.dataset.theme = theme
  }
  return morph
}
