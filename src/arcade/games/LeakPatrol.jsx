import { useEffect, useRef, useState } from 'react'
import { sfx } from '../sfx.js'

const DURATION = 75
const ZONES = ['North', 'Central', 'South']
const PER_ZONE = 4
const HOMES = ZONES.length * PER_ZONE
const DRAIN = [0, 0.7, 1.6, 3.2] // tank % per second by leak level
const GROW = 4.2 // seconds before a leak gets worse
const ALERTS = [
  ['Flood warning', '🌊'],
  ['Contaminated supply', '☣️'],
  ['Main pipe burst', '💥'],
  ['Water cut scheduled', '🚱'],
]

const ri = (n) => Math.floor(Math.random() * n)

export default function LeakPatrol({ onEnd, setHud, paused }) {
  const S = useRef({
    t: 0, tank: 100, score: 0, streak: 0, bestStreak: 0, fixed: 0, early: 0, bursts: 0, saved: 0, drops: 0, alertsOk: 0, alertsMiss: 0,
    leaks: Array(HOMES).fill(null), nextLeak: 1, nextDrop: 6, nextAlert: 12, drop: null, alert: null, pops: [], id: 1, ended: false,
  })
  const [, force] = useState(0)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => setHud({ score: 0 }), [])

  const pop = (i, text, bad) => {
    const s = S.current
    s.pops.push({ id: s.id++, i, text, bad, t: 1 })
  }

  const end = (reason) => {
    const s = S.current
    if (s.ended) return
    s.ended = true
    const bonus = Math.round(s.tank) * 10
    s.score += bonus
    onEnd({
      score: s.score,
      reason,
      stats: [
        ['Leaks fixed', `${s.fixed} (${s.early} caught early)`],
        ['Water saved', `${Math.round(s.saved * 12).toLocaleString()} L`],
        ['Tank left', `${Math.round(s.tank)}% (+${bonus})`],
        ['Best streak', `${s.bestStreak}`],
        ['Alerts answered', `${s.alertsOk}/${s.alertsOk + s.alertsMiss}`],
        ['Rain drops caught', `${s.drops}`],
      ],
      badges: [s.bestStreak >= 8 && '⚡ Quick fixer', s.bursts === 0 && s.fixed > 5 && '🛡️ No bursts', s.alertsMiss === 0 && s.alertsOk >= 2 && '🚨 Calm in a crisis', s.tank >= 50 && reason === 'Shift complete' && '💧 Water saver', s.drops >= 3 && '🌧️ Rain catcher'].filter(Boolean),
      why: 'Hydro Alert is an app design for water conservation and emergency alerts: usage tracking, conservation tips, gamification and clear alert layouts. The game turns those ideas into play: a live tank gauge, streaks and badges for saving water, and alerts you act on fast.',
    })
  }

  useEffect(() => {
    let id, last = performance.now(), redraw = 0
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = S.current
      if (!pausedRef.current && !s.ended) {
        s.t += dt
        const k = Math.min(1, s.t / DURATION)
        // new leaks
        s.nextLeak -= dt
        if (s.nextLeak <= 0) {
          const n = Math.random() < 0.25 + k * 0.4 ? 2 : 1
          for (let j = 0; j < n; j++) {
            const free = s.leaks.map((l, i) => (l ? -1 : i)).filter((i) => i >= 0)
            if (free.length) s.leaks[free[ri(free.length)]] = { level: 1, age: 0, hp: 1, id: s.id++ }
          }
          s.nextLeak = 1.9 - 1.1 * k + Math.random() * 0.5
        }
        // leaks grow and drain the tank
        let drain = 0
        s.leaks.forEach((l, i) => {
          if (!l) return
          l.age += dt
          if (l.age > GROW * l.level && l.level < 3) {
            l.level++
            l.hp = l.level === 3 ? 3 : 2
            if (l.level === 3) {
              s.bursts++
              s.streak = 0
              pop(i, 'Burst!', true)
              sfx.bad()
            }
          }
          drain += DRAIN[l.level]
        })
        s.tank = Math.max(0, s.tank - drain * dt * 0.55)
        // rain drop bonus
        s.nextDrop -= dt
        if (!s.drop && s.nextDrop <= 0) {
          s.drop = { x: 10 + Math.random() * 80, t: 0, id: s.id++ }
          s.nextDrop = 7 + Math.random() * 5
        }
        if (s.drop) {
          s.drop.t += dt / 3.2
          if (s.drop.t >= 1) s.drop = null
        }
        // emergency alerts
        s.nextAlert -= dt
        if (!s.alert && s.nextAlert <= 0) {
          const [name, icon] = ALERTS[ri(ALERTS.length)]
          s.alert = { zone: ri(ZONES.length), name, icon, left: 5, max: 5 }
          s.nextAlert = 13 + Math.random() * 6
          sfx.alert()
        }
        if (s.alert) {
          s.alert.left -= dt
          if (s.alert.left <= 0) {
            s.alertsMiss++
            s.score = Math.max(0, s.score - 100)
            s.tank = Math.max(0, s.tank - 8)
            s.alert = null
            sfx.bad()
          }
        }
        for (const p of s.pops) p.t -= dt * 1.2
        s.pops = s.pops.filter((p) => p.t > 0)
        if (s.tank <= 0) end('The tank ran dry')
        else if (s.t >= DURATION) end('Shift complete')
      }
      redraw -= dt
      if (redraw <= 0) {
        redraw = 1 / 30
        setHud({ score: S.current.score })
        force((v) => v + 1)
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  const fix = (i) => {
    const s = S.current
    const l = s.leaks[i]
    if (!l || paused || s.ended) return
    l.hp--
    if (l.hp > 0) {
      sfx.tap()
      pop(i, `${l.hp} more`, false)
      return
    }
    const pts = [0, 50, 30, 20][l.level] + Math.min(s.streak, 10) * 8
    if (l.level === 1) {
      s.streak++
      s.early++
      s.bestStreak = Math.max(s.bestStreak, s.streak)
    }
    s.score += pts
    s.fixed++
    s.saved += l.level * 3 + Math.max(0, GROW * 3 - l.age)
    s.leaks[i] = null
    pop(i, `+${pts}`, false)
    sfx.good()
  }
  const catchDrop = () => {
    const s = S.current
    if (!s.drop) return
    s.drop = null
    s.drops++
    s.tank = Math.min(100, s.tank + 10)
    s.score += 25
    sfx.level()
  }
  const sendAlert = (z) => {
    const s = S.current
    if (!s.alert) return
    if (z === s.alert.zone) {
      s.alertsOk++
      s.score += 150 + Math.round(s.alert.left * 20)
      sfx.good()
    } else {
      s.alertsMiss++
      s.score = Math.max(0, s.score - 100)
      sfx.bad()
    }
    s.alert = null
  }

  useEffect(() => {
    const k = (e) => {
      const n = Number(e.key)
      if (S.current.alert && n >= 1 && n <= 3) sendAlert(n - 1)
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])

  const s = S.current
  const tank = s.tank
  const C = 2 * Math.PI * 44
  return (
    <div className="lp">
      <aside className="lp__side">
        <div className={`lp__ring ${tank < 30 ? 'low' : ''}`}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" />
            <circle cx="50" cy="50" r="44" className="fg" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - tank / 100) }} />
          </svg>
          <b>{Math.round(tank)}%</b>
          <small>Tank</small>
        </div>
        <div className="lp__stat">
          <span>⏱ Time</span>
          <b>{Math.ceil(Math.max(0, DURATION - s.t))}s</b>
        </div>
        <div className="lp__stat">
          <span>🔥 Streak</span>
          <b>{s.streak}</b>
        </div>
        <div className="lp__stat">
          <span>🔧 Fixed</span>
          <b>{s.fixed}</b>
        </div>
        <p className="lp__tip">Catch leaks while they are small. A drip becomes a burst in about {Math.round(GROW * 2)} seconds.</p>
      </aside>
      <section className="lp__town">
        {ZONES.map((z, zi) => (
          <div key={z} className={`lp__zone ${s.alert?.zone === zi ? 'alerted' : ''}`}>
            <h3>
              Zone {zi + 1} · {z}
            </h3>
            <div className="lp__homes">
              {Array.from({ length: PER_ZONE }, (_, h) => {
                const i = zi * PER_ZONE + h
                const l = s.leaks[i]
                return (
                  <button key={i} className={`home ${l ? `leak l${l.level}` : ''}`} onClick={() => fix(i)} aria-label={l ? `Fix leak, level ${l.level}` : 'Home, no leak'}>
                    <span className="home__roof" />
                    <span className="home__body">{l ? (l.level === 3 ? '💥' : '💧') : '🏠'}</span>
                    {l && (
                      <span className="home__drips" aria-hidden="true">
                        {Array.from({ length: l.level * 2 }, (_, d) => (
                          <i key={d} style={{ '--d': d }} />
                        ))}
                      </span>
                    )}
                    {l && l.hp > 1 && <span className="home__hp">×{l.hp}</span>}
                    {s.pops
                      .filter((p) => p.i === i)
                      .map((p) => (
                        <span key={p.id} className={`home__pop ${p.bad ? 'bad' : ''}`} style={{ opacity: p.t, transform: `translate(-50%, ${-20 - (1 - p.t) * 30}px)` }}>
                          {p.text}
                        </span>
                      ))}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {s.drop && (
          <button key={s.drop.id} className="lp__drop" style={{ left: `${s.drop.x}%`, top: `${s.drop.t * 92}%` }} onClick={catchDrop} aria-label="Catch rain drop">
            💧
          </button>
        )}
      </section>
      {s.alert && (
        <div className="lp__alert" role="alert">
          <div className="lp__alert-head">
            <span>{s.alert.icon}</span>
            <div>
              <small>Emergency alert</small>
              <b>
                {s.alert.name} in Zone {s.alert.zone + 1} · {ZONES[s.alert.zone]}
              </b>
            </div>
            <i style={{ transform: `scaleX(${s.alert.left / s.alert.max})` }} />
          </div>
          <div className="lp__alert-btns">
            {ZONES.map((z, zi) => (
              <button key={z} onClick={() => sendAlert(zi)}>
                Notify Zone {zi + 1} <small>{z}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
