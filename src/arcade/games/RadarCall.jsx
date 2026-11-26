import { useEffect, useRef, useState } from 'react'
import { sfx } from '../sfx.js'

// A stylised Sri Lanka in "virtual" map units (x from longitude, y from latitude).
const W = 645
const H = 1000
const P = ([lat, lon]) => [((lon - 79.4) / 2.8) * W, ((10.0 - lat) / 4.3) * H]
const OUTLINE = [
  [9.86, 79.92], [9.86, 80.28], [9.55, 80.52], [9.15, 80.85], [8.6, 81.25], [8.1, 81.5], [7.6, 81.8], [7.0, 81.9], [6.5, 81.75], [6.12, 81.32],
  [5.9, 80.6], [5.98, 80.12], [6.5, 79.92], [7.0, 79.8], [7.6, 79.76], [8.2, 79.74], [8.7, 79.84], [9.1, 79.94], [9.4, 80.02], [9.62, 79.82],
].map(P)
const TOWNS = [
  ['Jaffna', 9.66, 80.02], ['Trincomalee', 8.59, 81.21], ['Anuradhapura', 8.31, 80.4], ['Batticaloa', 7.73, 81.7], ['Kurunegala', 7.49, 80.36],
  ['Kandy', 7.29, 80.63], ['Colombo', 6.93, 79.86], ['Nuwara Eliya', 6.95, 80.78], ['Ratnapura', 6.68, 80.4], ['Galle', 6.05, 80.22], ['Hambantota', 6.12, 81.12],
].map(([name, lat, lon]) => {
  const [x, y] = P([lat, lon])
  return { name, x, y }
})
const VIEW = { x0: -140, y0: -80, x1: W + 140, y1: H + 80 }
const ROUNDS = 6

const rnd = (a, b) => a + Math.random() * (b - a)
const at = (c, t) => ({ x: c.x + c.vx * t, y: c.y + c.vy * t, r: Math.max(0, c.r + c.dr * t) })

function makeRound(n) {
  const hours = n < 2 ? 3 : n < 4 ? 4 : 5
  for (let tries = 0; tries < 200; tries++) {
    const ang = rnd(0, Math.PI * 2)
    const spd = rnd(55, 85)
    const wind = { x: Math.cos(ang) * spd, y: Math.sin(ang) * spd, ang, spd }
    const count = 2 + Math.min(3, n)
    const cells = Array.from({ length: count }, () => {
      // start upwind so cells drift across the island
      const t0 = rnd(1.5, hours + 0.5)
      const cx = rnd(60, W - 60) - wind.x * t0 * rnd(0.5, 1)
      const cy = rnd(100, H - 100) - wind.y * t0 * rnd(0.5, 1)
      const r = rnd(70, 130)
      return {
        x: cx,
        y: cy,
        r,
        vx: wind.x + rnd(-12, 12),
        vy: wind.y + rnd(-12, 12),
        dr: n >= 3 && Math.random() < 0.6 ? rnd(-20, 22) : 0,
        k: rnd(0.7, 1),
      }
    })
    const rain = TOWNS.map((tw) => {
      let mm = 0
      for (let s = 0; s <= 60; s++) {
        const t = (s / 60) * hours
        for (const c of cells) {
          const p = at(c, t)
          const d = Math.hypot(p.x - tw.x, p.y - tw.y)
          if (d < p.r) mm += (1 - d / p.r) * c.k * (hours / 60) * 14
        }
      }
      return +mm.toFixed(1)
    })
    const wet = rain.filter((m) => m > 0.2).length
    // keep cells out of town at t=0 so the call is a forecast, not a look
    const now = TOWNS.filter((tw) => cells.some((c) => Math.hypot(c.x - tw.x, c.y - tw.y) < c.r)).length
    if (wet >= 3 && wet <= 7 && now <= 1) return { hours, wind, cells, rain, showWind: n < 3 }
  }
  return makeRound(n)
}

export default function RadarCall({ onEnd, setHud }) {
  const cv = useRef()
  const [round, setRound] = useState(0)
  const [R, setR] = useState(() => makeRound(0))
  const [marks, setMarks] = useState(() => new Set())
  const [phase, setPhase] = useState('plan') // plan | run | result
  const [clock, setClock] = useState(0)
  const [res, setRes] = useState(null)
  const tot = useRef({ score: 0, hits: 0, falseA: 0, miss: 0, dry: 0 })
  const view = useRef({ s: 1, ox: 0, oy: 0 })
  const clockRef = useRef(0)

  useEffect(() => setHud({ score: 0 }), [])

  // draw loop
  useEffect(() => {
    let id
    const c = cv.current
    const g = c.getContext('2d')
    const draw = (now) => {
      const dpr = Math.min(2, devicePixelRatio || 1)
      const bw = c.clientWidth, bh = c.clientHeight
      if (c.width !== Math.round(bw * dpr) || c.height !== Math.round(bh * dpr)) {
        c.width = Math.round(bw * dpr)
        c.height = Math.round(bh * dpr)
      }
      const vw = VIEW.x1 - VIEW.x0, vh = VIEW.y1 - VIEW.y0
      const s = Math.min(bw / vw, bh / vh)
      const ox = (bw - vw * s) / 2 - VIEW.x0 * s
      const oy = (bh - vh * s) / 2 - VIEW.y0 * s
      view.current = { s, ox, oy }
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, bw, bh)
      g.save()
      g.translate(ox, oy)
      g.scale(s, s)
      // sea grid
      g.strokeStyle = 'rgba(90,176,255,0.08)'
      g.lineWidth = 1 / s
      for (let x = -200; x < W + 200; x += 60) {
        g.beginPath(); g.moveTo(x, VIEW.y0); g.lineTo(x, VIEW.y1); g.stroke()
      }
      for (let y = -100; y < H + 100; y += 60) {
        g.beginPath(); g.moveTo(VIEW.x0, y); g.lineTo(VIEW.x1, y); g.stroke()
      }
      // island
      g.beginPath()
      OUTLINE.forEach((p, i) => {
        const q = OUTLINE[(i + 1) % OUTLINE.length]
        const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
        if (i === 0) g.moveTo(m[0], m[1])
        else g.quadraticCurveTo(p[0], p[1], m[0], m[1])
      })
      g.quadraticCurveTo(OUTLINE[0][0], OUTLINE[0][1], (OUTLINE[0][0] + OUTLINE[1][0]) / 2, (OUTLINE[0][1] + OUTLINE[1][1]) / 2)
      g.closePath()
      g.fillStyle = '#14304b'
      g.fill()
      g.strokeStyle = 'rgba(234,244,255,0.35)'
      g.lineWidth = 2 / s
      g.stroke()

      const t = clockRef.current
      // trails (radar loop history)
      if (phase === 'plan') {
        for (const cell of R.cells) {
          for (let k = 3; k >= 1; k--) {
            const p = at(cell, -k)
            g.beginPath()
            g.arc(p.x, p.y, p.r * 0.92, 0, Math.PI * 2)
            g.strokeStyle = `rgba(123,220,140,${0.12 + (3 - k) * 0.07})`
            g.setLineDash([8, 8])
            g.lineWidth = 2 / s
            g.stroke()
            g.setLineDash([])
          }
        }
      }
      // cells
      for (const cell of R.cells) {
        const p = at(cell, t)
        if (p.r < 4) continue
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
        gr.addColorStop(0, `rgba(255,70,60,${0.75 * cell.k})`)
        gr.addColorStop(0.28, `rgba(255,196,87,${0.65 * cell.k})`)
        gr.addColorStop(0.6, `rgba(90,220,120,${0.5 * cell.k})`)
        gr.addColorStop(1, 'rgba(90,220,120,0)')
        g.fillStyle = gr
        g.beginPath()
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        g.fill()
        if (phase === 'plan' && cell.dr) {
          g.fillStyle = '#eaf4ff'
          g.font = `600 ${22}px Inter, sans-serif`
          g.textAlign = 'center'
          g.fillText(cell.dr > 0 ? '▲' : '▼', p.x, p.y + 8)
        }
      }
      // radar sweep
      const sweep = (now / 1600) % (Math.PI * 2)
      const cx = W / 2, cy = H / 2, rr = H * 0.62
      const sg = g.createConicGradient ? g.createConicGradient(sweep, cx, cy) : null
      if (sg) {
        sg.addColorStop(0, 'rgba(123,255,217,0.07)')
        sg.addColorStop(0.08, 'rgba(123,255,217,0)')
        sg.addColorStop(1, 'rgba(123,255,217,0)')
        g.fillStyle = sg
        g.beginPath()
        g.arc(cx, cy, rr, 0, Math.PI * 2)
        g.fill()
      }
      // towns
      TOWNS.forEach((tw, i) => {
        const marked = marks.has(i)
        const r = res?.towns[i]
        g.beginPath()
        g.arc(tw.x, tw.y, marked ? 15 : 9, 0, Math.PI * 2)
        g.fillStyle = marked ? '#ffc457' : '#eaf4ff'
        g.fill()
        if (marked) {
          g.font = '18px sans-serif'
          g.textAlign = 'center'
          g.fillText('☔', tw.x, tw.y + 6)
        }
        if (r) {
          g.beginPath()
          g.arc(tw.x, tw.y, 22, 0, Math.PI * 2)
          g.strokeStyle = r.ok ? '#7bffb0' : '#ff6b5a'
          g.lineWidth = 4
          g.stroke()
        }
        g.font = `600 ${20}px Inter, sans-serif`
        g.textAlign = tw.x > W * 0.72 ? 'right' : 'left'
        const dx = tw.x > W * 0.72 ? -22 : 22
        g.lineWidth = 5
        g.strokeStyle = 'rgba(11,26,46,0.85)'
        g.strokeText(tw.name, tw.x + dx, tw.y + 7)
        g.fillStyle = marked ? '#ffc457' : '#eaf4ff'
        g.fillText(tw.name, tw.x + dx, tw.y + 7)
      })
      g.restore()
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(id)
  }, [R, marks, phase, res])

  const tap = (e) => {
    if (phase !== 'plan') return
    const b = cv.current.getBoundingClientRect()
    const { s, ox, oy } = view.current
    const x = (e.clientX - b.left - ox) / s
    const y = (e.clientY - b.top - oy) / s
    let best = -1, bd = Math.max(40, 26 / s)
    TOWNS.forEach((tw, i) => {
      const d = Math.hypot(tw.x - x, tw.y - y)
      if (d < bd) {
        bd = d
        best = i
      }
    })
    if (best < 0) return
    sfx.tap()
    setMarks((m) => {
      const n = new Set(m)
      n.has(best) ? n.delete(best) : n.add(best)
      return n
    })
  }
  const toggle = (i) => {
    if (phase !== 'plan') return
    sfx.tap()
    setMarks((m) => {
      const n = new Set(m)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  }

  const run = () => {
    setPhase('run')
    sfx.tap()
    const t0 = performance.now()
    const dur = 2600
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur)
      clockRef.current = k * R.hours
      setClock(clockRef.current)
      if (k < 1) requestAnimationFrame(step)
      else score()
    }
    requestAnimationFrame(step)
  }

  const score = () => {
    const T = tot.current
    let pts = 0
    const towns = TOWNS.map((tw, i) => {
      const wet = R.rain[i] > 0.2
      const call = marks.has(i)
      let p = 0, kind
      if (wet && call) (p = 100), (kind = 'Hit'), T.hits++
      else if (!wet && !call) (p = 40), (kind = 'Dry, correct'), T.dry++
      else if (!wet && call) (p = -50), (kind = 'False alarm'), T.falseA++
      else (p = -80), (kind = 'Missed rain'), T.miss++
      pts += p
      return { ok: p > 0, p, kind, mm: R.rain[i] }
    })
    const perfect = towns.every((t) => t.ok)
    if (perfect) pts += 200
    T.score = Math.max(0, T.score + pts)
    setHud({ score: T.score })
    setRes({ towns, pts, perfect })
    perfect ? sfx.level() : pts > 0 ? sfx.good() : sfx.bad()
    setPhase('result')
  }

  const next = () => {
    const T = tot.current
    if (round + 1 >= ROUNDS) {
      const calls = T.hits + T.falseA + T.miss + T.dry
      onEnd({
        score: T.score,
        reason: 'Forecast season complete',
        stats: [
          ['Rain called right', `${T.hits}`],
          ['Dry towns called right', `${T.dry}`],
          ['False alarms', `${T.falseA}`],
          ['Missed rain', `${T.miss}`],
          ['Accuracy', `${Math.round(((T.hits + T.dry) / calls) * 100)}%`],
        ],
        badges: [T.miss === 0 && '🌂 Never caught out', T.falseA === 0 && '📡 No false alarms', (T.hits + T.dry) / calls > 0.9 && '🌦️ Sharp forecaster'].filter(Boolean),
        why: 'The Weather Forecast Website puts conditions, charts and a rain-radar map concept in front of people so they can read the weather at a glance. Here you read the same kind of radar loop and turn it into a forecast for each town.',
      })
      return
    }
    clockRef.current = 0
    setClock(0)
    setRound(round + 1)
    setR(makeRound(round + 1))
    setMarks(new Set())
    setRes(null)
    setPhase('plan')
  }

  const max = Math.max(4, ...R.rain)
  const deg = (R.wind.ang * 180) / Math.PI
  return (
    <div className="rc">
      <div className="rc__map">
        <canvas ref={cv} onPointerDown={tap} aria-label="Rain radar map. Use the town list to make your forecast." />
        <div className="rc__legend">
          <span><i style={{ background: '#5adc78' }} />light</span>
          <span><i style={{ background: '#ffc457' }} />moderate</span>
          <span><i style={{ background: '#ff463c' }} />heavy</span>
          <span className="rc__trail">- - past hours</span>
        </div>
        {phase !== 'plan' && <div className="rc__clock">+{clock.toFixed(1)} h</div>}
      </div>
      <aside className="rc__panel">
        <div className="rc__round">
          Round <b>{round + 1}</b> / {ROUNDS}
        </div>
        <h2>Will it rain in the next {R.hours} hours?</h2>
        <div className="rc__wind">
          {R.showWind ? (
            <>
              <span className="rc__arrow" style={{ transform: `rotate(${deg}deg)` }}>
                ➜
              </span>
              <span>
                Wind {Math.round(R.wind.spd / 5)} km/h
                <small>Cells drift with the wind</small>
              </span>
            </>
          ) : (
            <span>
              No wind reading this round
              <small>Use the faded trails to judge direction{R.cells.some((c) => c.dr) ? ' · ▲ growing ▼ fading' : ''}</small>
            </span>
          )}
        </div>
        {phase !== 'result' ? (
          <>
            <ul className="rc__towns">
              {TOWNS.map((t, i) => (
                <li key={t.name}>
                  <button className={marks.has(i) ? 'on' : ''} onClick={() => toggle(i)} disabled={phase !== 'plan'} aria-pressed={marks.has(i)}>
                    <span>{marks.has(i) ? '☔' : '☀️'}</span>
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
            <button className="ar-btn rc__go" onClick={run} disabled={phase !== 'plan'}>
              {phase === 'run' ? 'Running forecast…' : `Run forecast (${marks.size} rain calls)`}
            </button>
          </>
        ) : (
          <>
            <div className="rc__chart" role="img" aria-label="Rainfall per town">
              {TOWNS.map((t, i) => {
                const r = res.towns[i]
                return (
                  <div key={t.name} className={`bar ${r.ok ? 'ok' : 'no'}`}>
                    <span className="bar__name">{t.name}</span>
                    <span className="bar__track">
                      <i style={{ width: `${(r.mm / max) * 100}%` }} />
                    </span>
                    <span className="bar__mm">{r.mm.toFixed(1)} mm</span>
                    <span className="bar__p">{r.p > 0 ? `+${r.p}` : r.p}</span>
                  </div>
                )
              })}
            </div>
            <div className="rc__sum">
              {res.perfect ? 'Perfect forecast! +200 bonus' : `Round score ${res.pts >= 0 ? '+' : ''}${res.pts}`}
            </div>
            <button className="ar-btn rc__go" onClick={next} autoFocus>
              {round + 1 >= ROUNDS ? 'See results' : 'Next round →'}
            </button>
          </>
        )}
      </aside>
    </div>
  )
}
