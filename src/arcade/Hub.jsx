import { GAMES } from './games.js'
import { getBest } from './best.js'

const themeVars = (t) => ({ '--bg': t.bg, '--ink': t.ink, '--a': t.accent, '--a2': t.accent2 })

export default function Hub() {
  const played = GAMES.filter((g) => getBest(g.id) > 0).length
  return (
    <div className="hub">
      <header className="ar-top">
        <a className="ar-chip" href="./index.html#arcade">
          ← Portfolio
        </a>
        <div className="ar-title">
          <b>ARCADE</b>
          <span>Play the projects</span>
        </div>
        <span className="ar-chip ar-chip--quiet">
          {played}/{GAMES.length} played
        </span>
      </header>
      <section className="hub__head">
        <div className="ar-kick">Five projects · five mini-games</div>
        <h1>
          Every project on my CV, <em>as a game.</em>
        </h1>
        <p>Each game turns the core idea of a project into a short challenge you can finish in a minute or two. Pick one, set a best score, then read how the real project works.</p>
      </section>
      <ol className="hub__grid">
        {GAMES.map((g, i) => {
          const best = getBest(g.id)
          return (
            <li key={g.id} className="gcard" style={{ ...themeVars(g.theme), '--i': i }}>
              <a className="gcard__play" href={g.href || `#${g.id}`} aria-label={`Play ${g.title}`}>
                <div className="gcard__top">
                  <span className="gcard__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="gcard__icon" aria-hidden="true">
                    {g.icon}
                  </span>
                </div>
                <small>From {g.project}</small>
                <h2>{g.title}</h2>
                <p>{g.tagline}</p>
                <div className="gcard__meta">
                  <span>{g.meta}</span>
                  <span>{best > 0 ? `Best ${best.toLocaleString()}` : 'Not played yet'}</span>
                </div>
                <span className="gcard__cta">Play →</span>
              </a>
              <a className="gcard__proj" href={g.projectHref}>
                Shows: {g.skill} · read the project ↗
              </a>
            </li>
          )
        })}
      </ol>
      <footer className="hub__foot">
        <span>Built with React, Canvas, Three.js & WebAudio. Best scores stay in your browser.</span>
        <a href="./index.html#contact">Like what you see? Get in touch →</a>
      </footer>
    </div>
  )
}
