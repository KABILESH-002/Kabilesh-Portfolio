import { useEffect, useRef, useState } from 'react'

// Scroll progress of a tall element whose child is sticky (0 → 1 while it is pinned)
export function usePinProgress(ref, onProgress) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    let id
    const tick = () => {
      const el = ref.current
      if (el) {
        const r = el.getBoundingClientRect()
        const total = r.height - innerHeight
        const p = Math.min(1, Math.max(0, -r.top / total))
        el.style.setProperty('--sp', p.toFixed(4))
        onProgress?.(p, r)
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])
  return [step, setStep]
}

/*
  One project = one chapter:
  1) a cover (particles form the project's emblem),
  2) a pinned scroll story (one step per screen) with a live visual,
  3) the "project file" with every CV detail.
*/
export default function Chapter({ n, project, theme, shape, steps, Visual, children, coverX = 2.9, storyShape, storyAlpha = 0.12, full = false, onStoryProgress, visualProps }) {
  const story = useRef()
  const [step, setStep] = useState(0)
  const [p, setP] = useState(0)
  usePinProgress(story, (prog) => {
    const s = Math.min(steps.length - 1, Math.floor(prog * steps.length * 0.999))
    setStep((o) => (o === s ? o : s))
    setP((o) => (Math.abs(o - prog) > 0.002 ? prog : o))
    onStoryProgress?.(prog)
  })
  return (
    <section className={`chapter chapter--${theme}`} id={project.id}>
      <header className={`cover ${coverX < 0 ? "cover--right" : ""}`} data-shape={shape} data-theme={theme} data-alpha="0.95" data-x={coverX} data-my="1.6">
        <div className="cover__inner reveal">
          <div className="cover__n">Chapter {String(n).padStart(2, '0')}</div>
          <h2 className="cover__title">{project.title}</h2>
          <p className="cover__sub">{project.subtitle}</p>
          <div className="cover__meta">
            <span>{project.type}</span>
            <span>{project.period}</span>
            {project.discipline && <span>{project.discipline}</span>}
          </div>
          <div className="cover__hint">Scroll to see how it works ↓</div>
        </div>
      </header>

      <div className={`story ${full ? 'story--full' : ''}`} ref={story} style={{ height: `${steps.length * 100 + 60}vh` }} data-shape={storyShape || shape} data-theme={theme} data-alpha={storyAlpha} data-x="0">
        <div className="story__stage">
          <div className="story__visual">{Visual && <Visual step={step} p={p} {...visualProps} />}</div>
          <div className="story__text">
            <div className="story__count">
              <b>{String(step + 1).padStart(2, '0')}</b>
              <span>/ {String(steps.length).padStart(2, '0')}</span>
            </div>
            <div className="story__panels">
              {steps.map((s, i) => (
                <div key={s.title} className={`story__panel ${i === step ? 'on' : i < step ? 'past' : ''}`} aria-hidden={i !== step}>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
            <div className="story__dots">
              {steps.map((s, i) => (
                <span key={s.title} className={i <= step ? 'on' : ''}>
                  <i style={{ transform: `scaleX(${Math.min(1, Math.max(0, p * steps.length - i))})` }} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="file" data-shape={shape} data-theme={theme} data-alpha="0.22" data-x="-3.2">
        <div className="file__inner reveal">
          <div className="file__label">Project file</div>
          <div className="file__grid">
            <div>
              <h3>{project.title}</h3>
              <p className="file__sub">{project.subtitle}</p>
              <dl>
                <div>
                  <dt>Type</dt>
                  <dd>{project.type}</dd>
                </div>
                <div>
                  <dt>When</dt>
                  <dd>{project.period}</dd>
                </div>
              </dl>
            </div>
            <div>
              <ul className="file__points">
                {project.points.map((x, i) => (
                  <li key={x} style={{ '--i': i }}>
                    {x}
                  </li>
                ))}
              </ul>
              {project.tags && (
                <div className="chips">
                  {project.tags.map((t, i) => (
                    <span key={t} style={{ '--i': i + 3 }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
