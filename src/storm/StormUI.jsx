import { useEffect, useState } from 'react'
import { useStore, set, getState, newRun, startPlanning, retryMission, nextMission, toMenu } from './store.js'
import { startAudio, setMuted } from './audio.js'
import { xrStore } from './Game.jsx'
import { MISSIONS, rankFor, RANKS } from './sim.js'

function useVRSupported() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    navigator.xr?.isSessionSupported?.('immersive-vr').then(setOk).catch(() => {})
  }, [])
  return ok
}
const Stars = ({ n, of = 3 }) => (
  <span className="stars" aria-label={`${n} of ${of} stars`}>
    {Array.from({ length: of }, (_, i) => (
      <i key={i} className={i < n ? 'on' : ''} style={{ animationDelay: `${0.25 + i * 0.25}s` }}>
        ★
      </i>
    ))}
  </span>
)

export default function StormUI() {
  const s = useStore((x) => x)
  const vr = useVRSupported()
  const [muted, setM] = useState(false)
  const m = MISSIONS[s.mission]
  const play = () => {
    startAudio()
    newRun()
  }
  const enterVR = () => {
    startAudio()
    if (getState().phase === 'menu') newRun()
    xrStore.enterVR()
  }
  return (
    <div className={`ui phase-${s.phase}`}>
      <header className="top">
        <a href="./arcade.html" className="back">
          ← Arcade
        </a>
        <div className="title">
          <b>STORM MODE</b>
          <span>{s.phase === 'menu' || s.phase === 'final' ? 'Can you beat SlopeGuard AI?' : `Mission ${s.mission + 1}/5 · ${s.places[s.mission]}`}</span>
        </div>
        <div className="top__right">
          {s.phase !== 'menu' && <span className="chip chip--score">{s.score.toLocaleString()} pts</span>}
          <button
            className="chip"
            onClick={() => {
              setMuted(!muted)
              setM(!muted)
            }}
          >
            {muted ? 'Sound off' : 'Sound on'}
          </button>
          {vr && (
            <button className="chip chip--vr" onClick={enterVR}>
              Play in VR
            </button>
          )}
        </div>
      </header>

      {s.phase === 'menu' && (
        <div className="modal modal--menu">
          <div className="card card--menu">
            <div className="kick">A game about my final-year research</div>
            <h1>
              Storm <em>Mode</em>
            </h1>
            <p>Monsoon rain is about to hit the hill country. Draw escape routes before the storm peaks, then watch your villagers race SlopeGuard AI’s risk-aware route to the shelter.</p>
            <ol className="how">
              <li>
                <b>Draw the route.</b> Press and drag on the map from the <span className="y">village</span> to the <span className="c">shelter</span>. Right-drag or two fingers to turn the camera.
              </li>
              <li>
                <b>Read the slopes.</b> Cracks appear as rain builds. Steep, cracked ground is the most likely to fail, but storms are never certain.
              </li>
              <li>
                <b>Survive five storms.</b> Every mission is a new valley, a new village and a stronger storm, with less time to plan.
              </li>
            </ol>
            <div className="actions">
              <button className="btn" onClick={play}>
                Play
              </button>
              {vr && (
                <button className="btn btn--ghost" onClick={enterVR}>
                  Play in VR
                </button>
              )}
              {s.best.score > 0 && (
                <span className="best">
                  Best <b>{s.best.score.toLocaleString()}</b> · {s.best.stars}★
                </span>
              )}
            </div>
            <small className="fine">Playable in the browser and in VR. I also build XR experiences in Unity with the XR Interaction Toolkit. Illustrative simulation inspired by my landslide-risk research. Not a real forecast or safety advice.</small>
          </div>
        </div>
      )}

      {s.phase === 'brief' && (
        <div className="modal modal--brief">
          <div className="card card--brief" key={s.worldSeed}>
            <div className="kick">
              Mission {s.mission + 1} of 5 · {m.storm} storm
            </div>
            <h1>{s.places[s.mission]}</h1>
            <div className="facts">
              <div>
                <small>Villagers</small>
                <b>{m.villagers}</b>
              </div>
              <div>
                <small>Plan time</small>
                <b>{m.planTime}s</b>
              </div>
              <div>
                <small>Storm</small>
                <b className={m.storm === 'Extreme' || m.storm === 'Severe' ? 'r' : ''}>{m.storm}</b>
              </div>
            </div>
            <p className="tip">{TIPS[s.mission]}</p>
            <div className="actions">
              <button className="btn" onClick={() => (startAudio(), startPlanning())}>
                Start mission
              </button>
              {s.mission === 0 && (
                <button className="btn btn--ghost" onClick={toMenu}>
                  Menu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {s.phase === 'plan' && (
        <div className="hud">
          <div className="timer" style={{ '--t': s.timeLeft / m.planTime }}>
            <svg viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="19" />
              <circle cx="22" cy="22" r="19" className="fg" pathLength="1" />
            </svg>
            <b className={s.timeLeft < 10 ? 'hot' : ''}>{Math.ceil(s.timeLeft)}</b>
          </div>
          <div className="hud__info">
            <small>
              Rainfall {s.rainMM} mm · {m.villagers} villagers
            </small>
            <b>{s.complete ? 'Route ready' : s.waypoints.length ? 'Keep drawing…' : 'Draw your route'}</b>
            <span>{s.complete ? 'Evacuate early for bonus points' : 'Press and drag from the village to the shelter'}</span>
          </div>
          <div className="hud__btns">
            <button className="chip" disabled={!s.waypoints.length} onClick={() => set((x) => ({ waypoints: x.waypoints.slice(0, -4), complete: false }))}>
              Undo
            </button>
            <button className="chip" disabled={!s.waypoints.length} onClick={() => set({ waypoints: [], complete: false })}>
              Clear
            </button>
            <button className={`chip ${s.hint ? 'chip--on' : ''}`} onClick={() => set((x) => ({ hint: !x.hint }))} title="Shows the AI risk forecast for −150 points">
              {s.hint ? 'Forecast on (−150)' : 'AI forecast (−150)'}
            </button>
            <button className={`btn btn--sm ${s.complete ? 'pulse' : ''}`} onClick={() => window.dispatchEvent(new CustomEvent('storm-evacuate'))}>
              Evacuate{s.complete ? ` +${Math.round(s.timeLeft * 4)}` : ''}
            </button>
          </div>
        </div>
      )}

      {s.phase === 'evac' && (
        <div className="evac">
          <b>The storm hits</b>
          <div className="evac__teams">
            <Team name="Your route" c="y" t={s.you} n={m.villagers} />
            <Team name="SlopeGuard AI" c="c" t={s.ai} n={m.villagers} />
          </div>
        </div>
      )}

      <div className="popups">
        {(s.popups || []).map((p) => (
          <div key={p.id} className={`popup popup--${p.kind}`}>
            {p.text}
          </div>
        ))}
      </div>

      {s.phase === 'report' && s.report && <Report r={s.report} total={s.score} />}
      {s.phase === 'final' && <Final s={s} onPlay={play} />}

      {(s.phase === 'plan' || s.phase === 'evac') && (
        <div className="legend">
          <span className="y">Your route</span>
          <span className="c">SlopeGuard AI</span>
          <span className="r">Landslide</span>
        </div>
      )}
    </div>
  )
}

const TIPS = [
  'Steep slopes above the river are the ones most likely to fail. A slightly longer route around them is often safer.',
  'More villagers means a longer line on the path, so they stay exposed for longer. Avoid lingering on risky ground.',
  'Two hotspots tonight. The shortest line between village and shelter rarely survives a heavy storm.',
  'Severe rain. Cracks spread fast, so read the terrain early and commit to a route.',
  'Extreme storm, 30 seconds. This is the one the risk model was built for. Trust the slopes, not the straight line.',
]

function Team({ name, c, t, n }) {
  return (
    <div className={`team ${c}`}>
      <small>{name}</small>
      <div className="dots">
        {Array.from({ length: n }, (_, i) => (
          <i key={i} className={i < t.safe ? 'safe' : i < t.safe + t.caught ? 'caught' : ''} />
        ))}
      </div>
    </div>
  )
}

function verdict(r) {
  if (r.you.safe > r.ai.safe) return ['You beat SlopeGuard AI!', 'Storms are uncertain, and a bold route sometimes gets lucky. The AI aims to win on average, across many storms.']
  if (r.you.safe === r.ai.safe && r.you.risk <= r.ai.risk * 1.15) return ['You matched the AI.', 'Same lives saved with similar risk. You read the slopes like a risk model would.']
  if (r.you.safe === r.ai.safe) return ['Same lives saved, but riskier.', 'You got through, but your path carried more landslide exposure. Over many storms, that adds up.']
  return ['SlopeGuard AI kept more people safe.', 'The quickest-looking way crossed slopes that failed. The risk-aware route took a little longer and avoided them.']
}

function Report({ r, total }) {
  const [title, text] = verdict(r)
  const last = r.mission >= 4
  const row = (label, a, b, fmt, better) => {
    const youBetter = better === 'high' ? a > b : a < b
    const aiBetter = better === 'high' ? b > a : b < a
    return (
      <tr>
        <td>{label}</td>
        <td className={youBetter ? 'best' : ''}>{fmt(a)}</td>
        <td className={aiBetter ? 'best' : ''}>{fmt(b)}</td>
      </tr>
    )
  }
  return (
    <div className="modal modal--result">
      <div className="card">
        <div className="kick">
          Mission {r.mission + 1}/5 · {r.place}
          {r.hint ? ' · AI-assisted' : ''}
        </div>
        <Stars n={r.points.stars} />
        <h1>{title}</h1>
        <p>{text}</p>
        <table className="score">
          <thead>
            <tr>
              <th />
              <th className="y">You</th>
              <th className="c">SlopeGuard AI</th>
            </tr>
          </thead>
          <tbody>
            {row('Villagers safe', r.you.safe, r.ai.safe, (v) => `${v} / ${r.villagers}`, 'high')}
            {row('Route length', r.you.length, r.ai.length, (v) => `${(v / 1000).toFixed(2)} km`, 'low')}
            {row('Average landslide risk', r.you.risk, r.ai.risk, (v) => `${v.toFixed(0)}%`, 'low')}
            {row('Riskiest point', r.you.peak, r.ai.peak, (v) => `${v.toFixed(0)}%`, 'low')}
            {row('Landslide zones crossed', r.you.zones, r.ai.zones, (v) => `${v}`, 'low')}
          </tbody>
        </table>
        <div className="points">
          {r.points.rows.map(([k, v]) => (
            <div key={k} className={v < 0 ? 'neg' : ''}>
              <span>{k}</span>
              <b>
                {v > 0 ? '+' : ''}
                {v}
              </b>
            </div>
          ))}
          <div className="sum">
            <span>Mission points</span>
            <b>{r.points.total}</b>
          </div>
          <div className="sum sum--run">
            <span>Run total</span>
            <b>{total.toLocaleString()}</b>
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={nextMission}>
            {last ? 'See final score' : 'Next mission →'}
          </button>
          <button className="btn btn--ghost" onClick={retryMission}>
            Retry this storm
          </button>
        </div>
      </div>
    </div>
  )
}

function Final({ s, onPlay }) {
  const stars = s.results.reduce((a, r) => a + r.points.stars, 0)
  const rank = rankFor(s.score)
  const next = RANKS.find(([min]) => min > s.score)
  return (
    <div className="modal">
      <div className="card card--final">
        <div className="kick">Run complete{s.newBest ? ' · New best!' : ''}</div>
        <h1>
          {s.score.toLocaleString()} <em>points</em>
        </h1>
        <div className="rank">
          <small>Your rank</small>
          <b>{rank}</b>
          {next && <span>{(next[0] - s.score).toLocaleString()} points to {next[1]}</span>}
        </div>
        <div className="facts">
          <div>
            <small>Stars</small>
            <b>{stars} / 15</b>
          </div>
          <div>
            <small>Villagers saved</small>
            <b>
              {s.results.reduce((a, r) => a + r.you.safe, 0)} / {s.results.reduce((a, r) => a + r.villagers, 0)}
            </b>
          </div>
          <div>
            <small>Best</small>
            <b>{s.best.score.toLocaleString()}</b>
          </div>
        </div>
        <ul className="missions">
          {s.results.map((r) => (
            <li key={r.mission}>
              <span>
                {r.mission + 1}. {r.place}
              </span>
              <Stars n={r.points.stars} />
              <b>{r.points.total}</b>
            </li>
          ))}
        </ul>
        <div className="why">
          <b>What this shows</b>
          <p>The shortest way out often crosses the slopes most likely to fail. SlopeGuard AI’s route weighs predicted landslide risk and its worst-case tail, trading a little distance for safety. That idea is at the heart of my final-year research.</p>
        </div>
        <div className="actions">
          <button className="btn" onClick={onPlay}>
            Play again
          </button>
          <a className="btn btn--ghost" href="./index.html#slopeguard">
            Read the research
          </a>
        </div>
      </div>
    </div>
  )
}
