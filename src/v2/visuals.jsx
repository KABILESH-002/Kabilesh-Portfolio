import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { hero } from '../site/heroState.js'

const TerrainScene = lazy(() => import('../site/Terrain.jsx'))

// "ge1 ge2 …" classes: cumulative step states for CSS
const ge = (step, n = 4) => Array.from({ length: n }, (_, k) => (step >= k ? `ge${k}` : '')).join(' ')

/* ---------------- SlopeGuard AI: live 3D terrain ---------------- */
export function SlopeGuardVisual() {
  const ref = useRef()
  const [mount, setMount] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setMount(e.isIntersecting), { rootMargin: '60% 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <div className="vis vis--terrain" ref={ref}>
      {mount && (
        <Suspense fallback={null}>
          <TerrainScene />
        </Suspense>
      )}
      <small className="vis__note">Illustrative terrain · routes computed live with Dijkstra · not real data or warnings</small>
    </div>
  )
}
export const slopeguardProgress = (p) => {
  // chapter story progress → the terrain scene's own timeline (skips its intro)
  hero.p = 0.2 + p * 0.8
}

/* ---------------- Scheduler AI ---------------- */
export function SchedulerVisual({ step }) {
  const grades = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'O/L', 'A/L']
  return (
    <div className={`vis vis--sched ${ge(step)}`}>
      <div className="win">
        <div className="win__bar">
          <i />
          <i />
          <i />
          <span>scheduler.ai</span>
          <em className="a11y">Aa+</em>
        </div>
        <div className="sched">
          <aside>
            <small>Your level</small>
            {grades.map((g, i) => (
              <span key={g} className={g === 'A/L' ? 'on' : ''} style={{ '--i': i }}>
                {g}
              </span>
            ))}
            <small>Subject</small>
            <span className="subj">Biology</span>
          </aside>
          <div className="sched__main">
            <div className="msg me">How does photosynthesis actually work?</div>
            <div className="ctx">
              <span>A/L</span>
              <span>Biology</span>
              <span>Personalised</span>
            </div>
            <div className="msg ai">
              <b>Think of a leaf as a tiny factory:</b>
              <ol>
                <li>Chlorophyll captures sunlight</li>
                <li>Water is split, releasing oxygen</li>
                <li>CO₂ is turned into glucose</li>
              </ol>
              <span className="more">Want 3 A/L-style practice questions?</span>
            </div>
            <div className="typing">
              <i />
              <i />
              <i />
            </div>
            <div className="input">
              Ask about any subject<span className="caret" />
            </div>
          </div>
        </div>
      </div>
      <div className="mini">
        <div className="mini__notch" />
        <div className="msg me">Explain osmosis?</div>
        <div className="msg ai">Water moves from high to low concentration through a membrane…</div>
      </div>
    </div>
  )
}

/* ---------------- Weather Forecast Website ---------------- */
export function WeatherVisual({ step }) {
  const temps = [26, 27, 29, 31, 31, 30, 28, 27]
  const line = temps.map((t, i) => `${i ? 'L' : 'M'}${20 + i * 46},${110 - (t - 24) * 12}`).join(' ')
  const rain = [10, 20, 45, 70, 55, 30, 20, 10]
  return (
    <div className={`vis vis--weather ${ge(step)} s${step}`}>
      <div className="sky" />
      <div className="wxwin">
        <div className="wx-now">
          <small>Colombo · now</small>
          <b>29°</b>
          <span>Partly cloudy · feels 33°</span>
          <div className="wx-sun" />
        </div>
        <div className="wx-chart">
          <small>Next 24 hours</small>
          <svg viewBox="0 0 360 130" preserveAspectRatio="none">
            <path className="area" d={`${line} L342,130 L20,130 Z`} />
            <path className="line" d={line} pathLength="1" />
            {rain.map((r, i) => (
              <rect key={i} className="bar" x={12 + i * 46} width="16" y={130 - r * 0.6} height={r * 0.6} style={{ '--i': i }} />
            ))}
          </svg>
          <div className="wx-legend">
            <span className="t">Temperature</span>
            <span className="r">Rain chance</span>
          </div>
        </div>
        <div className="wx-map">
          <small>Rain radar</small>
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
          <span className="pin" />
        </div>
        <div className="wx-days">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
            <div key={d} style={{ '--i': i }}>
              <small>{d}</small>
              <b>{[31, 30, 27, 26, 29][i]}°</b>
            </div>
          ))}
        </div>
      </div>
      <div className="stack">
        <span>React</span>
        <span>Vanilla CSS</span>
        <span>JavaScript</span>
      </div>
    </div>
  )
}

/* ---------------- Hunger SL (UX process) ---------------- */
export function HungerVisual({ step }) {
  return (
    <div className={`vis vis--hunger s${step}`}>
      {/* 0: research */}
      <div className="h-research">
        {['“I cook extra every day and hate wasting it.”', '“I don’t know where to ask for help.”', '“Pickup has to be quick and simple.”', '“Is the food safe? Who is giving it?”'].map((q, i) => (
          <div key={q} className="note" style={{ '--i': i }}>
            {q}
          </div>
        ))}
        <table className="compare">
          <thead>
            <tr>
              <th />
              <th>App A</th>
              <th>App B</th>
              <th>Hunger SL</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Nearby matching', '–', '✓', '✓'],
              ['Simple pickup', '✓', '–', '✓'],
              ['Accessible UI', '–', '–', '✓'],
            ].map((r) => (
              <tr key={r[0]}>
                {r.map((c, i) => (
                  <td key={i}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 1: personas, flows, IA */}
      <div className="h-flow">
        <div className="persona">
          <i>🍲</i>
          <b>The donor</b>
          <small>Has surplus food, little time. Needs posting in under a minute.</small>
        </div>
        <div className="persona">
          <i>🤝</i>
          <b>The receiver</b>
          <small>Needs food nearby, discreetly and quickly.</small>
        </div>
        <div className="nodes">
          {['Post food', 'Match nearby', 'Request', 'Pick up'].map((s, i) => (
            <span key={s} style={{ '--i': i }}>
              {s}
            </span>
          ))}
        </div>
      </div>
      {/* 2 + 3: phones */}
      <div className="h-phones">
        <div className="hphone donor">
          <div className="hphone__screen">
            <div className="wf">
              <i className="l1" />
              <i className="l2" />
              <i className="b" />
              <i className="b" />
              <i className="btn" />
            </div>
            <div className="hifi">
              <small>Share food</small>
              <b>What are you sharing?</b>
              <div className="opt on">Rice & curry · 12 meals</div>
              <div className="opt">Pickup before 8 pm</div>
              <div className="go">Post food</div>
            </div>
          </div>
        </div>
        <div className="hphone receiver">
          <div className="hphone__screen">
            <div className="hifi">
              <small>Nearby</small>
              <b>Food near you</b>
              <div className="card">Rice & curry · 0.8 km</div>
              <div className="card">Bread & milk · 1.4 km</div>
            </div>
            <div className="toast">🔔 New food available · 0.8 km away</div>
          </div>
        </div>
        <div className="a11y-tags">
          <span>Large text</span>
          <span>High contrast</span>
          <span>One task per screen</span>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Hydro Alert ---------------- */
export function HydroVisual({ step }) {
  const used = [62, 80, 55, 70, 48, 66, 40]
  return (
    <div className={`vis vis--hydro s${step} ${ge(step)}`}>
      <div className="waves">
        <i />
        <i />
      </div>
      <div className="hy-phone">
        <div className="hy-screen">
          <small>This week</small>
          <b className="hy-title">Water usage</b>
          <div className="hy-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" className="track" />
              <circle cx="60" cy="60" r="50" className="fill" pathLength="1" />
            </svg>
            <div>
              <b>682 L</b>
              <small>of 1000 L goal</small>
            </div>
          </div>
          <div className="hy-bars">
            {used.map((u, i) => (
              <span key={i} style={{ '--h': u / 100, '--i': i }} />
            ))}
          </div>
          <div className="hy-tips">
            <div style={{ '--i': 0 }}>🚿 4-minute showers save water every day</div>
            <div style={{ '--i': 1 }}>🪣 Reuse rinse water for plants</div>
          </div>
          <div className="hy-game">
            <div className="badge">🏅</div>
            <div>
              <b>5-day saving streak</b>
              <small>+50 points · Level 3 Saver</small>
            </div>
          </div>
          <div className="hy-alert">
            <b>⚠ Emergency alert</b>
            <small>Water supply interruption in your area from 10 am. Store drinking water now.</small>
            <div>
              <span>What to do</span>
              <span>Got it</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
