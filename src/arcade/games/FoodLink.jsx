import { useEffect, useRef, useState } from 'react'
import { sfx } from '../sfx.js'

const BLOCK = 100 // street spacing
// map size is picked at start to match the screen: landscape 10×6 blocks, portrait 6×9
let W = 1000
let H = 640
let COLS = 10
let ROWS = 6
function fitMap(el) {
  const portrait = el.clientHeight > el.clientWidth * 1.1
  ;[COLS, ROWS] = portrait ? [6, 9] : [10, 6]
  W = COLS * BLOCK
  H = ROWS * BLOCK + 40
}
const DURATION = 90
const VOLUNTEERS = 3
const SPEED = 330 // map units per second
const LIVES = 3

const ri = (n) => Math.floor(Math.random() * n)

function freeSpot(s) {
  for (let k = 0; k < 40; k++) {
    const c = ri(COLS), r = ri(ROWS)
    const x = c * BLOCK + BLOCK / 2, y = r * BLOCK + BLOCK / 2 + (H - ROWS * BLOCK) / 2
    if (![...s.donors, ...s.homes].some((e) => Math.hypot(e.x - x, e.y - y) < BLOCK * 1.2)) return { x, y }
  }
  return null
}

// street route: out to the street corner, along x, then along y, into the target block
function route(a, b) {
  const ax = a.x - BLOCK / 2, ay = a.y - BLOCK / 2
  const bx = b.x - BLOCK / 2, by = b.y - BLOCK / 2
  return [{ x: a.x, y: a.y }, { x: ax, y: ay }, { x: bx, y: ay }, { x: bx, y: by }, { x: b.x, y: b.y }]
}
const plen = (pts) => pts.slice(1).reduce((l, p, i) => l + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0)
function along(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    if (d <= seg) {
      const k = seg ? d / seg : 0
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k }
    }
    d -= seg
  }
  return pts[pts.length - 1]
}

export default function FoodLink({ onEnd, setHud, paused }) {
  const cv = useRef()
  const S = useRef({
    t: 0, score: 0, delivered: 0, wasted: 0, missed: 0, vegOk: 0, fastest: 99, nextDonor: 0.4, nextHome: 1.2, id: 1,
    donors: [], homes: [], couriers: [], pops: [], sel: null, drag: null, ended: false,
  })
  const view = useRef({ s: 1, ox: 0, oy: 0 })
  const [hud, setLocal] = useState({ time: DURATION, free: VOLUNTEERS, lives: LIVES, toast: '' })
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => setHud({ score: 0 }), [])

  const toast = (msg) => {
    S.current.toast = msg
    S.current.toastT = 1.8
  }

  const end = (reason) => {
    const s = S.current
    if (s.ended) return
    s.ended = true
    onEnd({
      score: s.score,
      reason,
      stats: [
        ['Meals delivered', `${s.delivered}`],
        ['Vegetarian matches', `${s.vegOk}`],
        ['Meals wasted', `${s.wasted}`],
        ['Families missed', `${s.missed}`],
        ['Fastest delivery', s.fastest < 99 ? `${s.fastest.toFixed(1)} s` : '–'],
      ],
      badges: [s.delivered >= 20 && '🍛 Feeding the city', s.wasted === 0 && s.delivered > 5 && '♻️ Zero waste', s.missed === 0 && s.delivered > 5 && '❤️ Nobody left out', s.vegOk >= 5 && '🥗 Diet aware'].filter(Boolean),
      why: 'Hunger SL is a mobile app design that connects food donors with people in need nearby. Its user flows keep donating and requesting to a few clear steps. In the game you play the matching at the heart of it: near, fresh and the right kind of food.',
    })
  }

  const assign = (donor, home) => {
    const s = S.current
    if (home.veg && !donor.veg) {
      sfx.bad()
      toast('This family needs a vegetarian meal 🥗')
      return false
    }
    if (s.couriers.length >= VOLUNTEERS) {
      sfx.bad()
      toast('All volunteers are on the road. Wait for one to finish.')
      return false
    }
    const pts = route(donor, home)
    s.couriers.push({ pts, len: plen(pts), d: 0, home: home.id, fresh: donor.life / donor.max, veg: donor.veg && home.veg, start: s.t })
    s.donors = s.donors.filter((d) => d !== donor)
    home.incoming = true
    sfx.tap()
    return true
  }

  // main loop
  useEffect(() => {
    let id, last = performance.now()
    const c = cv.current
    const g = c.getContext('2d')
    fitMap(c)
    let hudT = 0
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = S.current
      if (!pausedRef.current && !s.ended) {
        s.t += dt
        const k = Math.min(1, s.t / DURATION)
        // spawn
        s.nextDonor -= dt
        s.nextHome -= dt
        if (s.nextDonor <= 0 && s.donors.length < 6) {
          const p = freeSpot(s)
          if (p) s.donors.push({ id: s.id++, ...p, veg: Math.random() < 0.45, life: 15 - 4 * k, max: 15 - 4 * k, born: s.t })
          s.nextDonor = 2.6 - 1.1 * k + Math.random() * 0.6
        }
        if (s.nextHome <= 0 && s.homes.length < 6) {
          const p = freeSpot(s)
          if (p) s.homes.push({ id: s.id++, ...p, veg: Math.random() < 0.3, life: 22 - 7 * k, max: 22 - 7 * k, born: s.t })
          s.nextHome = 3 - 1.2 * k + Math.random() * 0.8
        }
        // decay
        for (const d of s.donors) d.life -= dt
        for (const h of s.homes) if (!h.incoming) h.life -= dt
        const spoiled = s.donors.filter((d) => d.life <= 0)
        if (spoiled.length) {
          s.wasted += spoiled.length
          s.score = Math.max(0, s.score - 30 * spoiled.length)
          spoiled.forEach((d) => s.pops.push({ x: d.x, y: d.y, text: 'Wasted −30', bad: true, t: 1 }))
          s.donors = s.donors.filter((d) => d.life > 0)
          sfx.bad()
          if (s.sel && spoiled.includes(s.sel)) s.sel = null
        }
        const left = s.homes.filter((h) => h.life <= 0)
        if (left.length) {
          s.missed += left.length
          left.forEach((h) => s.pops.push({ x: h.x, y: h.y, text: 'Missed', bad: true, t: 1 }))
          s.homes = s.homes.filter((h) => h.life > 0)
          if (s.sel && left.includes(s.sel)) s.sel = null
          sfx.bad()
          if (s.missed >= LIVES) end('Three families went without a meal')
        }
        // couriers
        for (const cr of s.couriers) {
          cr.d += SPEED * dt
          if (cr.d >= cr.len) {
            const home = s.homes.find((h) => h.id === cr.home)
            const took = s.t - cr.start
            const pts = 100 + Math.round(cr.fresh * 50) + (cr.veg ? 25 : 0)
            s.score += pts
            s.delivered++
            if (cr.veg) s.vegOk++
            s.fastest = Math.min(s.fastest, took)
            if (home) s.pops.push({ x: home.x, y: home.y, text: `+${pts} Delivered!`, t: 1 })
            s.homes = s.homes.filter((h) => h.id !== cr.home)
            sfx.good()
          }
        }
        s.couriers = s.couriers.filter((cr) => cr.d < cr.len)
        for (const p of s.pops) p.t -= dt * 0.8
        s.pops = s.pops.filter((p) => p.t > 0)
        if (s.toastT) s.toastT -= dt
        if (s.t >= DURATION) end('Time’s up')
      }

      // --- draw ---
      const dpr = Math.min(2, devicePixelRatio || 1)
      const bw = c.clientWidth, bh = c.clientHeight
      if (c.width !== Math.round(bw * dpr) || c.height !== Math.round(bh * dpr)) {
        c.width = Math.round(bw * dpr)
        c.height = Math.round(bh * dpr)
      }
      const sc = Math.min(bw / W, bh / H)
      const ox = (bw - W * sc) / 2, oy = (bh - H * sc) / 2
      view.current = { s: sc, ox, oy }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, bw, bh)
      g.save()
      g.translate(ox, oy)
      g.scale(sc, sc)
      g.fillStyle = '#3a2119'
      g.fillRect(0, 0, W, H)
      const y0 = (H - ROWS * BLOCK) / 2
      for (let cI = 0; cI < COLS; cI++)
        for (let r = 0; r < ROWS; r++) {
          g.fillStyle = (cI * 7 + r * 3) % 5 === 0 ? '#3f5a2e' : '#4a2a20'
          g.beginPath()
          g.roundRect(cI * BLOCK + 10, y0 + r * BLOCK + 10, BLOCK - 20, BLOCK - 20, 10)
          g.fill()
        }
      // routes
      for (const cr of s.couriers) {
        g.strokeStyle = 'rgba(255,216,168,0.5)'
        g.setLineDash([10, 10])
        g.lineWidth = 4
        g.beginPath()
        const from = along(cr.pts, cr.d)
        g.moveTo(from.x, from.y)
        let acc = 0
        for (let i = 1; i < cr.pts.length; i++) {
          acc += Math.hypot(cr.pts[i].x - cr.pts[i - 1].x, cr.pts[i].y - cr.pts[i - 1].y)
          if (acc > cr.d) g.lineTo(cr.pts[i].x, cr.pts[i].y)
        }
        g.stroke()
        g.setLineDash([])
      }
      const ring = (e, color) => {
        g.beginPath()
        g.arc(e.x, e.y, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, e.life / e.max))
        g.strokeStyle = e.life / e.max < 0.3 ? '#ff5a4a' : color
        g.lineWidth = 6
        g.stroke()
      }
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      for (const h of s.homes) {
        g.beginPath()
        g.arc(h.x, h.y, 30, 0, Math.PI * 2)
        g.fillStyle = h.incoming ? '#6b4a2a' : '#fff1e6'
        g.fill()
        if (!h.incoming) ring(h, '#ffd8a8')
        g.font = '30px sans-serif'
        g.fillText('🏠', h.x, h.y + 2)
        if (h.veg) {
          g.font = '20px sans-serif'
          g.fillText('🥗', h.x + 26, h.y - 26)
        }
        if (h.incoming) {
          g.font = '600 14px Inter, sans-serif'
          g.fillStyle = '#ffd8a8'
          g.fillText('on the way', h.x, h.y + 48)
        }
      }
      for (const d of s.donors) {
        g.beginPath()
        g.arc(d.x, d.y, 30, 0, Math.PI * 2)
        g.fillStyle = s.sel === d ? '#ffd166' : '#ff7a50'
        g.fill()
        ring(d, '#7bdc8c')
        g.font = '30px sans-serif'
        g.fillText(d.veg ? '🥗' : '🍱', d.x, d.y + 2)
      }
      if (s.sel && s.homes.includes(s.sel)) {
        g.beginPath()
        g.arc(s.sel.x, s.sel.y, 44, 0, Math.PI * 2)
        g.strokeStyle = '#ffd166'
        g.lineWidth = 3
        g.stroke()
      }
      if (s.drag && s.sel) {
        g.strokeStyle = '#ffd166'
        g.lineWidth = 4
        g.beginPath()
        g.moveTo(s.sel.x, s.sel.y)
        g.lineTo(s.drag.x, s.drag.y)
        g.stroke()
      }
      for (const cr of s.couriers) {
        const p = along(cr.pts, cr.d)
        g.beginPath()
        g.arc(p.x, p.y, 18, 0, Math.PI * 2)
        g.fillStyle = '#ffd8a8'
        g.fill()
        g.font = '20px sans-serif'
        g.fillText('🚲', p.x, p.y + 1)
      }
      for (const p of s.pops) {
        g.globalAlpha = Math.min(1, p.t * 2)
        g.font = '700 22px "Space Grotesk", sans-serif'
        g.lineWidth = 5
        g.strokeStyle = 'rgba(36,18,13,0.9)'
        g.strokeText(p.text, p.x, p.y - 50 - (1 - p.t) * 40)
        g.fillStyle = p.bad ? '#ff8a7a' : '#ffe08a'
        g.fillText(p.text, p.x, p.y - 50 - (1 - p.t) * 40)
        g.globalAlpha = 1
      }
      g.restore()

      hudT -= dt
      if (hudT <= 0) {
        hudT = 0.1
        setHud({ score: s.score })
        setLocal({ time: Math.max(0, DURATION - s.t), free: VOLUNTEERS - s.couriers.length, lives: LIVES - s.missed, toast: s.toastT > 0 ? s.toast : '' })
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  const toMap = (e) => {
    const b = cv.current.getBoundingClientRect()
    const { s, ox, oy } = view.current
    return { x: (e.clientX - b.left - ox) / s, y: (e.clientY - b.top - oy) / s }
  }
  const hit = (p) => {
    const s = S.current
    return [...s.donors, ...s.homes.filter((h) => !h.incoming)].find((e) => Math.hypot(e.x - p.x, e.y - p.y) < 44)
  }
  const isDonor = (e) => S.current.donors.includes(e)

  const down = (e) => {
    if (paused) return
    const s = S.current
    const p = toMap(e)
    const h = hit(p)
    cv.current.setPointerCapture?.(e.pointerId)
    if (!h) {
      s.sel = null
      return
    }
    if (s.sel && isDonor(s.sel) !== isDonor(h)) {
      const [d, hm] = isDonor(h) ? [h, s.sel] : [s.sel, h]
      assign(d, hm)
      s.sel = null
      return
    }
    s.sel = h
    s.drag = p
    sfx.tap()
  }
  const move = (e) => {
    const s = S.current
    if (s.drag) s.drag = toMap(e)
  }
  const up = (e) => {
    const s = S.current
    if (!s.drag) return
    const h = hit(toMap(e))
    s.drag = null
    if (h && s.sel && h !== s.sel && isDonor(h) !== isDonor(s.sel)) {
      const [d, hm] = isDonor(h) ? [h, s.sel] : [s.sel, h]
      assign(d, hm)
      s.sel = null
    }
  }

  return (
    <div className="fl">
      <div className="fl__hud">
        <span>
          ⏱ <b>{Math.ceil(hud.time)}</b> s
        </span>
        <span>
          🚲 Volunteers free <b>{hud.free}</b>/{VOLUNTEERS}
        </span>
        <span aria-label={`${hud.lives} chances left`}>
          {Array.from({ length: LIVES }, (_, i) => (
            <i key={i} className={i < hud.lives ? 'on' : ''}>
              ❤
            </i>
          ))}
        </span>
      </div>
      <canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={up} aria-label="City map. Drag from a donor to a family to deliver a meal." />
      <div className="fl__legend">
        <span>🍱 donor</span>
        <span>🥗 vegetarian</span>
        <span>🏠 family in need</span>
        <span>ring = time left</span>
      </div>
      {hud.toast && <div className="fl__toast">{hud.toast}</div>}
    </div>
  )
}
