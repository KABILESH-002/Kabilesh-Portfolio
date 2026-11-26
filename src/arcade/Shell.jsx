import { useEffect, useState } from 'react'
import { sfx, isMuted, setMuted } from './sfx.js'
import { getBest, saveBest } from './best.js'
import { rankFor } from './games.js'

/*
  Shared frame for every arcade game:
  intro (how to play) → play → results (score, rank, best, stats).
  A game is a component that gets { onEnd, hud } and calls onEnd({ score, stats }).
*/
export default function Shell({ game, Game }) {
  const [phase, setPhase] = useState('intro')
  const [run, setRun] = useState(0)
  const [result, setResult] = useState(null)
  const [hud, setHud] = useState({})
  const [muted, setM] = useState(isMuted())
  const [best, setBest] = useState(() => getBest(game.id))
  const t = game.theme

  const start = () => {
    sfx.unlock()
    sfx.level()
    setHud({})
    setResult(null)
    setRun((r) => r + 1)
    setPhase('play')
  }
  const onEnd = (res) => {
    const isBest = saveBest(game.id, res.score)
    if (isBest) setBest(res.score)
    sfx.end()
    setResult({ ...res, isBest })
    setPhase('over')
  }
  useEffect(() => {
    const k = (e) => {
      if (phase !== 'play' && (e.key === 'Enter' || e.key === ' ') && e.target === document.body) {
        e.preventDefault()
        start()
      }
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [phase])

  const rank = result && rankFor(game, result.score)
  return (
    <div className={`shell shell--${game.id} phase-${phase}`} style={{ '--bg': t.bg, '--ink': t.ink, '--a': t.accent, '--a2': t.accent2 }}>
      <header className="ar-top">
        <a className="ar-chip" href="#">
          ← Arcade
        </a>
        <div className="ar-title">
          <b>{game.title.toUpperCase()}</b>
          <span>From {game.project}</span>
        </div>
        <div className="ar-top__right">
          {phase === 'play' && hud.score !== undefined && <span className="ar-chip ar-chip--score">{hud.score.toLocaleString()} pts</span>}
          <button
            className="ar-chip"
            onClick={() => {
              setMuted(!muted)
              setM(!muted)
            }}
            aria-pressed={!muted}
          >
            {muted ? 'Sound off' : 'Sound on'}
          </button>
        </div>
      </header>

      <main className="stage">{phase !== 'intro' && <Game key={run} onEnd={onEnd} setHud={setHud} paused={phase !== 'play'} />}</main>

      {phase === 'intro' && (
        <div className="ar-modal">
          <div className="ar-card">
            <div className="ar-kick">
              {game.icon} Mini-game · based on {game.project}
            </div>
            <h1>{game.title}</h1>
            <p className="ar-lead">{game.tagline}</p>
            <ol className="ar-how">
              {game.how.map((h, i) => (
                <li key={i}>
                  <b>{i + 1}</b>
                  {h}
                </li>
              ))}
            </ol>
            <div className="ar-actions">
              <button className="ar-btn" onClick={start} autoFocus>
                Play
              </button>
              <a className="ar-btn ar-btn--ghost" href={game.projectHref}>
                About the project
              </a>
              {best > 0 && <span className="ar-best">Best: {best.toLocaleString()}</span>}
            </div>
          </div>
        </div>
      )}

      {phase === 'over' && result && (
        <div className="ar-modal">
          <div className="ar-card">
            <div className="ar-kick">{result.reason || 'Run complete'}</div>
            <h1>
              {result.score.toLocaleString()} <small>pts</small>
            </h1>
            <div className="ar-rank">
              <span className="ar-stars" aria-label={`${rank.stars} of 3 stars`}>
                {[1, 2, 3].map((s) => (
                  <i key={s} className={s <= rank.stars ? 'on' : ''}>
                    ★
                  </i>
                ))}
              </span>
              <b>{rank.name}</b>
              {result.isBest ? <span className="ar-new">New best!</span> : <span className="ar-best">Best: {best.toLocaleString()}</span>}
            </div>
            {result.stats && (
              <dl className="ar-stats">
                {result.stats.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {result.badges?.length > 0 && (
              <div className="ar-badges">
                {result.badges.map((b) => (
                  <span key={b}>{b}</span>
                ))}
              </div>
            )}
            {result.why && (
              <div className="ar-why">
                <b>How this connects to {game.project}</b>
                <p>{result.why}</p>
              </div>
            )}
            <div className="ar-actions">
              <button className="ar-btn" onClick={start} autoFocus>
                Play again
              </button>
              <a className="ar-btn ar-btn--ghost" href="#">
                More games
              </a>
              <a className="ar-btn ar-btn--ghost" href={game.projectHref}>
                Read the project
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
