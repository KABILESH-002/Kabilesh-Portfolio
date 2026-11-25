import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { person, education, research, projects, skills, experience, references } from '../data/cv.js'
import Particles from './particles/Particles.jsx'
import Chapter, { usePinProgress } from './Chapter.jsx'
import { STORIES } from './stories.js'
import { SlopeGuardVisual, slopeguardProgress, SchedulerVisual, WeatherVisual, HungerVisual, HydroVisual } from './visuals.jsx'

const byId = Object.fromEntries(projects.map((p) => [p.id, p]))
const slope = {
  id: 'slopeguard',
  title: research.title,
  subtitle: research.cvTitle,
  type: research.type,
  period: research.period,
  discipline: 'AI research · Full-stack',
  points: research.cvPoints,
  tags: ['AI', 'Machine learning', 'Geospatial', 'Risk prediction', 'Safe routing'],
}
const CHAPTERS = [
  { p: slope, theme: 'slopeguard', shape: 'terrain', storyShape: 'dust', Visual: SlopeGuardVisual, full: true, onStoryProgress: slopeguardProgress, storyAlpha: 0 },
  { p: byId.scheduler, theme: 'scheduler', shape: 'bubble', Visual: SchedulerVisual },
  { p: byId.weather, theme: 'weather', shape: 'cloud', Visual: WeatherVisual },
  { p: byId.hunger, theme: 'hunger', shape: 'heart', Visual: HungerVisual },
  { p: byId.hydro, theme: 'hydro', shape: 'drop', Visual: HydroVisual },
]

let lenis = null
const scrollToId = (id) => (e) => {
  e?.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.6 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.15 })
    const scan = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el))
    scan()
    const t = setInterval(scan, 1500)
    return () => {
      io.disconnect()
      clearInterval(t)
    }
  }, [])
}

export default function App() {
  useReveal()
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    let id
    const raf = (t) => {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      lenis = null
    }
  }, [])
  return (
    <>
      <div className="bgcolor" aria-hidden="true" />
      <Particles />
      <div className="grain" aria-hidden="true" />
      <Nav />
      <Rail />
      <main>
        <Intro />
        <About />
        <Index />
        {CHAPTERS.map((c, i) => (
          <Chapter key={c.p.id} n={i + 1} project={c.p} theme={c.theme} shape={c.shape} storyShape={c.storyShape} storyAlpha={c.storyAlpha} steps={STORIES[c.p.id]} Visual={c.Visual} full={c.full} onStoryProgress={c.onStoryProgress} coverX={i % 2 ? -2.9 : 2.9}>
            {c.p.id === 'slopeguard' && <ResearchDetails />}
            {c.p.id === 'slopeguard' && (
              <a className="stormcta" href="./storm.html">
                <span>
                  <small>Play it · 5 missions · browser & VR</small>
                  <b>Storm Mode: plan evacuations through five storms and try to beat SlopeGuard AI</b>
                </span>
                <i>⚡</i>
              </a>
            )}
          </Chapter>
        ))}
        <Beyond />
        <Skills />
        <Education />
        <Contact />
      </main>
      <footer className="foot">
        <span>
          © {new Date().getFullYear()} {person.name}
        </span>
        <span>React · Three.js · WebGL · Vite</span>
      </footer>
    </>
  )
}

/* ---------------- navigation ---------------- */
function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="nav">
        <a className="nav__brand" href="#top" onClick={scrollToId('top')}>
          <span className="mark">KK</span>
          <span className="nav__name">{person.short}</span>
        </a>
        <div className="nav__actions">
          <button className="nav__btn" onClick={() => setOpen(true)}>
            Chapters
          </button>
          <a className="nav__btn nav__btn--storm" href="./storm.html">
            ⚡ Storm Mode
          </a>
          <a className="nav__btn nav__btn--solid" href={person.cv} download>
            CV ↓
          </a>
        </div>
      </header>
      <div className={`menu ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}>
        <div className="menu__inner" onClick={(e) => e.stopPropagation()}>
          <button className="menu__close" onClick={() => setOpen(false)}>
            Close ✕
          </button>
          {[['about', 'About me'], ...CHAPTERS.map((c) => [c.p.id, c.p.title]), ['beyond', 'Experience'], ['skills', 'Skills'], ['education', 'Education & references'], ['contact', 'Contact']].map(([id, l], i) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => {
                setOpen(false)
                scrollToId(id)(e)
              }}
            >
              <small>{String(i).padStart(2, '0')}</small>
              {l}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

function Rail() {
  const [active, setActive] = useState(-1)
  useEffect(() => {
    let id
    const tick = () => {
      let a = -1
      CHAPTERS.forEach((c, i) => {
        const el = document.getElementById(c.p.id)
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) a = i
      })
      setActive((o) => (o === a ? o : a))
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <nav className={`rail ${active >= 0 ? 'is-on' : ''}`} aria-label="Chapters">
      {CHAPTERS.map((c, i) => (
        <a key={c.p.id} href={`#${c.p.id}`} onClick={scrollToId(c.p.id)} className={i === active ? 'on' : ''}>
          <span>{c.p.title}</span>
          <i>{String(i + 1).padStart(2, '0')}</i>
        </a>
      ))}
    </nav>
  )
}

/* ---------------- intro ---------------- */
function Intro() {
  return (
    <section className="intro" id="top" data-shape="name" data-theme="intro" data-alpha="1" data-y="0.55" data-my="1.4">
      <div className="intro__top">
        <span>Portfolio — 2026</span>
        <span>{person.location}</span>
      </div>
      <div className="intro__bottom">
        <div>
          <div className="intro__kicker">
            <span className="dot" /> {person.cvTitle}
          </div>
          <h1>
            {person.name.split(' ')[0]} <em>{person.name.split(' ').slice(1).join(' ')}</em>
          </h1>
          <p className="intro__role">{person.headline}</p>
        </div>
        <div className="intro__side">
          <p>I build software that predicts, teaches and helps people, and I study how AI can keep them safe.</p>
          <a href="#about" onClick={scrollToId('about')} className="scrollcue">
            <span className="scrollcue__line" />
            Scroll to begin
          </a>
        </div>
      </div>
    </section>
  )
}

/* ---------------- about: words light up as you scroll ---------------- */
function About() {
  const ref = useRef()
  usePinProgress(ref)
  const words = person.summary.split(' ')
  return (
    <section className="about" id="about" ref={ref} data-shape="sphere" data-theme="intro" data-alpha="0.85" data-malpha="0.35" data-x="3.3" data-my="2.4">
      <div className="about__stage">
        <div className="about__kicker">About me</div>
        <p className="about__text" style={{ '--n': words.length }}>
          {words.map((w, i) => (
            <span key={i} style={{ '--i': i }}>
              {w}{' '}
            </span>
          ))}
        </p>
        <div className="about__facts">
          <div>
            <small>Role</small>
            {person.headline}
          </div>
          <div>
            <small>Studying</small>
            BSc (Hons) CS · IIT / Westminster
          </div>
          <div>
            <small>Researching</small>
            SlopeGuard AI
          </div>
          <div>
            <small>Based in</small>
            {person.location}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------- chapter index ---------------- */
function Index() {
  return (
    <section className="index" id="index" data-shape="sphere" data-theme="intro" data-alpha="0.45" data-x="3.3">
      <div className="index__head reveal">
        <div className="kicker">Five projects, five stories</div>
        <h2>
          Scroll through <em>how each one works.</em>
        </h2>
      </div>
      <ol className="index__list">
        {CHAPTERS.map((c, i) => (
          <li key={c.p.id} className="reveal" style={{ '--i': i }}>
            <a href={`#${c.p.id}`} onClick={scrollToId(c.p.id)} data-t={c.theme}>
              <span className="index__n">{String(i + 1).padStart(2, '0')}</span>
              <span className="index__title">{c.p.title}</span>
              <span className="index__meta">
                {c.p.discipline || c.p.type}
                <br />
                <small>{c.p.period}</small>
              </span>
              <span className="index__go">→</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ---------------- research extras inside the SlopeGuard project file ---------------- */
function ResearchDetails() {
  const r = research
  return (
    <div className="rd">
      <p className="rd__full">{r.fullTitle}</p>
      <p className="rd__problem">{r.problem}</p>
      <div className="rd__rq">
        {r.questions.map((q, i) => (
          <article key={q.q}>
            <small>RQ{i + 1}</small>
            <b>{q.q}</b>
            <p>{q.d}</p>
            <em>{q.m}</em>
          </article>
        ))}
      </div>
      <ol className="rd__pipe">
        {r.pipeline.map((s) => (
          <li key={s.k}>
            <b>{s.k}</b>
            <span>{s.v}</span>
          </li>
        ))}
      </ol>
      <div className="rd__row">
        <div>
          <small>Stack</small>
          <div className="chips">
            {r.stack.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
        <div>
          <small>Study area</small>
          <p>{r.area}</p>
          <small>Status</small>
          <p>{r.status}</p>
        </div>
      </div>
      <ul className="rd__miles">
        {r.milestones.map((m) => (
          <li key={m.what} className={m.done ? 'done' : m.current ? 'now' : ''}>
            <small>{m.when}</small>
            {m.what}
          </li>
        ))}
      </ul>
      <p className="rd__disc">{r.disclaimer}</p>
    </div>
  )
}

/* ---------------- experience: horizontal pinned scroll ---------------- */
function Beyond() {
  const ref = useRef()
  usePinProgress(ref)
  return (
    <section className="beyond" id="beyond" ref={ref} data-shape="sphere" data-theme="beyond" data-alpha="0.35" data-x="0">
      <div className="beyond__stage">
        <div className="beyond__track">
          <div className="beyond__intro">
            <div className="kicker">Experience · Extracurricular</div>
            <h2>
              Beyond the <em>projects.</em>
            </h2>
            <p>A year of freelancing for clients and students across Sri Lanka.</p>
          </div>
          {experience.map((x, i) => (
            <article key={x.text} className="xcard">
              <span className="xcard__n">0{i + 1}</span>
              <small>{x.period}</small>
              <h3>{x.title}</h3>
              <b>{x.org}</b>
              <p>{x.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- skills: kinetic marquees + full list ---------------- */
function Skills() {
  const rows = [skills.technical.slice(0, 2).flatMap((g) => g.items), skills.technical.slice(2, 4).flatMap((g) => g.items), [...skills.technical.slice(4).flatMap((g) => g.items), ...skills.soft]]
  return (
    <section className="skills" id="skills" data-shape="cube" data-theme="beyond" data-alpha="0.7" data-x="3.2">
      <div className="skills__head reveal">
        <div className="kicker">Skills</div>
        <h2>
          Tools I design, build <em>& ship with.</em>
        </h2>
      </div>
      <div className="marquees" aria-hidden="true">
        {rows.map((row, i) => (
          <div key={i} className={`marquee ${i % 2 ? 'rev' : ''}`}>
            <div>
              {[...row, ...row].map((s, k) => (
                <span key={k}>{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="skills__grid">
        {skills.technical.map((g, i) => (
          <div key={g.group} className="sk reveal" style={{ '--i': i }}>
            <small>{g.group}</small>
            <p>{g.items.join(' · ')}</p>
          </div>
        ))}
        <div className="sk sk--soft reveal" style={{ '--i': 6 }}>
          <small>Soft skills</small>
          <p>{skills.soft.join(' · ')}</p>
        </div>
      </div>
    </section>
  )
}

/* ---------------- education + references ---------------- */
function Education() {
  const ref = useRef()
  usePinProgress(ref)
  return (
    <section className="edu" id="education" ref={ref} data-shape="sphere" data-theme="beyond" data-alpha="0.22" data-x="0">
      <div className="edu__inner">
        <div className="edu__col">
          <div className="kicker reveal">Education</div>
          <ol className="tl">
            {education.map((e, i) => (
              <li key={e.school} className="reveal" style={{ '--i': i }}>
                <small>{e.period}</small>
                <b>{e.school}</b>
                <span>{e.detail}</span>
                {e.note && <em>{e.note}</em>}
              </li>
            ))}
          </ol>
        </div>
        <div className="edu__col">
          <div className="kicker reveal">References</div>
          {references.map((r, i) => (
            <div key={r.name} className="ref reveal" style={{ '--i': i }}>
              <b>{r.name}</b>
              <span>{r.role}</span>
              <a href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {r.contact}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- contact ---------------- */
function Contact() {
  return (
    <section className="contact" id="contact" data-shape="hello" data-theme="contact" data-alpha="1" data-x="3.1" data-y="2.1" data-scale="0.72" data-my="3.4" data-malpha="0.3">
      <div className="contact__inner">
        <h2 className="reveal">
          Let’s build something <em>useful.</em>
        </h2>
        <p className="reveal">Open to full-stack and AI research internships, freelance work and collaborations.</p>
        <div className="contact__grid reveal">
          <a href={`mailto:${person.email}`}>
            <small>Email</small>
            {person.email}
          </a>
          <a href={person.phoneHref}>
            <small>Phone</small>
            {person.phone}
          </a>
          <div>
            <small>Based in</small>
            {person.location}
          </div>
          {person.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
              <small>{l.label}</small>
              {l.href.replace(/^https?:\/\//, '')}
            </a>
          ))}
        </div>
        <div className="contact__cta reveal">
          <a className="btn" href={`mailto:${person.email}`}>
            Say hello
          </a>
          <a className="btn btn--ghost" href={person.cv} download>
            Download CV
          </a>
        </div>
        <a className="city reveal" href="./storm.html">
          <small>Bonus game · browser & VR · from someone who builds XR in Unity + XR Interaction Toolkit</small>
          <b>⚡ Storm Mode: can you beat my AI? →</b>
        </a>
      </div>
    </section>
  )
}
