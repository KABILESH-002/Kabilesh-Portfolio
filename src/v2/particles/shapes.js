import * as THREE from 'three'

// Every shape is N points (x,y,z) + N colours (r,g,b), all in a ~8-unit-wide space.
export const N = typeof window !== 'undefined' && innerWidth < 700 ? 7000 : 14000

const rand = (() => {
  let s = 1234567
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
})()
const col = (hex) => new THREE.Color(hex)

function make(fill) {
  const pos = new Float32Array(N * 3)
  const color = new Float32Array(N * 3)
  const c = new THREE.Color()
  for (let i = 0; i < N; i++) {
    const [x, y, z, cc] = fill(i, c)
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    ;(cc || c).toArray(color, i * 3)
  }
  return { pos, color }
}

// Sample points from anything drawn in white on a canvas
function fromCanvas(draw, { w = 900, h = 400, width = 8, depth = 0.5, palette }) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#fff'
  draw(ctx, w, h)
  const data = ctx.getImageData(0, 0, w, h).data
  const pts = []
  for (let y = 0; y < h; y += 2)
    for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 128) pts.push([x, y])
  const s = width / w
  return make((i, c) => {
    const [px, py] = pts.length ? pts[Math.floor(rand() * pts.length)] : [w / 2, h / 2]
    c.copy(palette[Math.floor(rand() * palette.length)])
    c.offsetHSL(0, 0, (rand() - 0.5) * 0.12)
    return [(px - w / 2) * s + (rand() - 0.5) * s * 2, -(py - h / 2) * s + (rand() - 0.5) * s * 2, (rand() - 0.5) * depth]
  })
}

export function buildShapes() {
  const S = {}

  // name, drawn in the display font
  S.name = fromCanvas(
    (ctx, w, h) => {
      ctx.font = `700 ${Math.round(h * 0.5)}px "Space Grotesk", Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('KABILESH', w / 2, h / 2)
    },
    { w: 1200, h: 300, width: 9.5, depth: 0.6, palette: [col('#f5efe4'), col('#f5efe4'), col('#ff6b3d'), col('#ffb38a')] }
  )

  // a network sphere: shell + great-circle "orbits"
  S.sphere = make((i, c) => {
    const k = rand()
    let x, y, z
    if (k < 0.7) {
      const t = (i + 0.5) / N
      const phi = Math.acos(1 - 2 * t)
      const th = Math.PI * (1 + Math.sqrt(5)) * i
      const r = 2.9 + (rand() - 0.5) * 0.08
      x = Math.cos(th) * Math.sin(phi) * r
      y = Math.cos(phi) * r
      z = Math.sin(th) * Math.sin(phi) * r
    } else {
      const ring = Math.floor(rand() * 3)
      const a = rand() * Math.PI * 2
      const r = 3.6 + ring * 0.45
      const tilt = [0.4, -0.7, 1.2][ring]
      x = Math.cos(a) * r
      y = Math.sin(a) * r * Math.sin(tilt)
      z = Math.sin(a) * r * Math.cos(tilt)
    }
    c.set(['#3de0c8', '#8b7cff', '#ff6b3d', '#f5efe4'][Math.floor(rand() * 4)])
    return [x, y, z]
  })

  // chat bubble with typing dots (Scheduler AI)
  S.bubble = fromCanvas(
    (ctx, w, h) => {
      ctx.lineWidth = 34
      ctx.beginPath()
      ctx.roundRect(w * 0.12, h * 0.12, w * 0.76, h * 0.58, 90)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(w * 0.28, h * 0.68)
      ctx.lineTo(w * 0.22, h * 0.92)
      ctx.lineTo(w * 0.42, h * 0.7)
      ctx.fill()
      for (const x of [0.36, 0.5, 0.64]) {
        ctx.beginPath()
        ctx.arc(w * x, h * 0.41, 36, 0, Math.PI * 2)
        ctx.fill()
      }
    },
    { w: 800, h: 600, width: 7, depth: 0.8, palette: [col('#8b7cff'), col('#b7adff'), col('#ffd166')] }
  )

  // cloud with falling rain (Weather)
  const blobs = [[-1.6, 0.3, 1.3], [0, 0.8, 1.7], [1.6, 0.25, 1.25], [0.7, -0.1, 1.3], [-0.7, -0.1, 1.2]]
  S.cloud = make((i, c) => {
    if (rand() < 0.78) {
      const b = blobs[Math.floor(rand() * blobs.length)]
      const v = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(b[2] * (0.92 + rand() * 0.08))
      c.set(rand() < 0.8 ? '#e8f2ff' : '#ffc457')
      return [b[0] + v.x, b[1] + v.y + 1, v.z * 0.7]
    }
    c.set('#5ab0ff')
    const x = (rand() - 0.5) * 4.6
    return [x - rand() * 0.3, -0.6 - rand() * 3, (rand() - 0.5) * 1.2]
  })

  // heart (Hunger SL)
  S.heart = make((i, c) => {
    const t = rand() * Math.PI * 2
    const fill = Math.sqrt(rand())
    const x = 16 * Math.pow(Math.sin(t), 3)
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    const edge = rand() < 0.45 ? 1 : fill
    c.set(['#ff7a50', '#ffb38a', '#ffd8a8', '#e4572e'][Math.floor(rand() * 4)])
    return [x * 0.17 * edge, y * 0.17 * edge + 0.4, (rand() - 0.5) * 1.2 * (1 - edge * 0.6)]
  })

  // water drop + ripples (Hydro Alert)
  S.drop = make((i, c) => {
    if (rand() < 0.75) {
      const t = rand()
      const a = rand() * Math.PI * 2
      // drop profile: pointed top, round bottom
      const y = 2.2 - t * 4.2
      const r = t < 0.55 ? Math.pow(t / 0.55, 0.9) * 1.55 : Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.55) / 0.45, 2))) * 1.55
      c.set(rand() < 0.7 ? '#3ec6ff' : '#7bffd9')
      return [Math.cos(a) * r, y + 0.6, Math.sin(a) * r]
    }
    const ring = Math.floor(rand() * 3)
    const a = rand() * Math.PI * 2
    const r = 1.6 + ring * 0.8
    c.set('#7bffd9')
    return [Math.cos(a) * r, -2.3, Math.sin(a) * r * 0.45]
  })

  // terrain heightfield (SlopeGuard teaser)
  S.terrain = make((i, c) => {
    const x = (rand() - 0.5) * 8, z = (rand() - 0.5) * 8
    const h = Math.sin(x * 0.9) * Math.cos(z * 0.7) * 0.9 + Math.sin(x * 2.1 + z * 1.3) * 0.25 + Math.exp(-((x - 1) ** 2 + (z + 1) ** 2) / 2) * 1.2
    const risk = Math.exp(-((x + 0.5) ** 2 + (z - 0.4) ** 2) / 1.5)
    c.set('#3d8f6a').lerp(col('#ff5a3c'), risk * 0.9)
    return [x, h - 0.6, z]
  })

  // lattice cube (skills)
  S.cube = make((i, c) => {
    const g = 7
    const s = 4.4
    const ax = Math.floor(rand() * 3)
    const p = [Math.floor(rand() * g) / (g - 1) - 0.5, Math.floor(rand() * g) / (g - 1) - 0.5, rand() - 0.5]
    const v = ax === 0 ? [p[2], p[0], p[1]] : ax === 1 ? [p[0], p[2], p[1]] : [p[0], p[1], p[2]]
    c.set(['#c9b6ff', '#3de0c8', '#f5efe4'][ax])
    return [v[0] * s, v[1] * s, v[2] * s]
  })

  // hello (contact)
  S.hello = fromCanvas(
    (ctx, w, h) => {
      ctx.font = `700 ${Math.round(h * 0.6)}px "Space Grotesk", Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('HELLO', w / 2, h / 2)
    },
    { w: 1000, h: 300, width: 8.5, depth: 0.6, palette: [col('#ff6b3d'), col('#f5efe4'), col('#3de0c8')] }
  )

  // scattered dust (used behind the SlopeGuard 3D terrain)
  S.dust = make((i, c) => {
    c.set('#6f8796')
    return [(rand() - 0.5) * 30, (rand() - 0.5) * 18, (rand() - 0.5) * 10 - 4]
  })
  return S
}
