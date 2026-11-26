import { useEffect, useRef, useState } from 'react'
import { makeQuestion, GRADES } from './questions.js'
import { sfx } from '../sfx.js'

const START_TIME = 60
const PER_GRADE = 5

export default function StudySprint({ onEnd, setHud, paused }) {
  const [tier, setTier] = useState(0)
  const [q, setQ] = useState(() => makeQuestion(0))
  const [log, setLog] = useState([{ who: 'ai', text: 'Hi! I’m your study buddy. Let’s start at Grade 6 and see how far you climb. Ready?' }])
  const [picked, setPicked] = useState(null)
  const [elim, setElim] = useState([])
  const [hints, setHints] = useState(3)
  const [time, setTime] = useState(START_TIME)
  const st = useRef({ score: 0, streak: 0, best: 0, right: 0, wrong: 0, inTier: 0, hintsUsed: 0, ended: false })
  const chat = useRef()

  useEffect(() => {
    setHud({ score: 0 })
  }, [])
  useEffect(() => {
    chat.current?.scrollTo({ top: chat.current.scrollHeight, behavior: 'smooth' })
  }, [log, q])

  // countdown
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setTime((t) => {
        const n = Math.max(0, +(t - 0.1).toFixed(1))
        if (n <= 5 && Math.floor(n) !== Math.floor(t)) sfx.tick()
        return n
      })
    }, 100)
    return () => clearInterval(id)
  }, [paused])
  useEffect(() => {
    if (time > 0 || st.current.ended) return
    st.current.ended = true
    const s = st.current
    const acc = s.right + s.wrong ? Math.round((s.right / (s.right + s.wrong)) * 100) : 0
    onEnd({
      score: s.score,
      reason: 'Time’s up',
      stats: [
        ['Reached', GRADES[tier]],
        ['Correct', `${s.right}`],
        ['Accuracy', `${acc}%`],
        ['Best streak', `${s.best}`],
        ['Tutor hints', `${s.hintsUsed}/3`],
      ],
      badges: [s.best >= 8 && '🔥 On fire', acc >= 90 && s.right >= 8 && '🎯 Sharp shooter', tier >= 6 && '🎓 Reached A/L', s.hintsUsed === 0 && s.right > 5 && '🧠 No hints needed'].filter(Boolean),
      why: 'Scheduler AI supports students from Grade 6 to A/L with a personalised AI chatbot. The game does the same on a small scale: questions match your level, the tutor gives hints instead of just answers, and the difficulty grows with you.',
    })
  }, [time])

  const answer = (opt) => {
    if (picked || paused || time <= 0) return
    const s = st.current
    const ok = opt === q.a
    setPicked(opt)
    let nextTier = tier
    if (ok) {
      s.right++
      s.streak++
      s.best = Math.max(s.best, s.streak)
      s.inTier++
      const pts = 10 * (tier + 1) + Math.min(s.streak, 10) * 5
      s.score += pts
      setTime((t) => Math.min(99, t + 2))
      sfx.good()
      if (s.inTier >= PER_GRADE && tier < GRADES.length - 1) {
        nextTier = tier + 1
        s.inTier = 0
        s.score += 100
        setTimeout(() => sfx.level(), 200)
      }
      setLog((l) => [
        ...l,
        { who: 'ai', text: q.q, subj: q.subj },
        { who: 'me', text: opt, ok: true },
        { who: 'ai', text: nextTier !== tier ? `Brilliant! +${pts}. You’re moving up to ${GRADES[nextTier]} (+100).` : s.streak >= 3 ? `Correct! +${pts} · ${s.streak} in a row 🔥` : `Correct! +${pts}` },
      ])
    } else {
      s.wrong++
      s.streak = 0
      setTime((t) => Math.max(0, t - 3))
      sfx.bad()
      setLog((l) => [...l, { who: 'ai', text: q.q, subj: q.subj }, { who: 'me', text: opt, ok: false }, { who: 'ai', text: `Not quite. The answer is ${q.a}. ${q.hint}` }])
    }
    setHud({ score: s.score })
    setTimeout(
      () => {
        setTier(nextTier)
        setQ(makeQuestion(nextTier))
        setPicked(null)
        setElim([])
      },
      ok ? 450 : 1100,
    )
  }

  const hint = () => {
    if (!hints || elim.length || picked) return
    const wrong = q.opts.filter((o) => o !== q.a).sort(() => Math.random() - 0.5).slice(0, 2)
    setElim(wrong)
    setHints((h) => h - 1)
    st.current.hintsUsed++
    sfx.tap()
    setLog((l) => [...l, { who: 'me', text: 'Can I get a hint?', ask: true }, { who: 'ai', text: `💡 ${q.hint} I’ve crossed out two wrong answers.` }])
  }

  useEffect(() => {
    const k = (e) => {
      const n = Number(e.key)
      if (n >= 1 && n <= 4 && q.opts[n - 1] && !elim.includes(q.opts[n - 1])) answer(q.opts[n - 1])
      if (e.key.toLowerCase() === 'h') hint()
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  })

  const s = st.current
  const visible = log.slice(-8)
  return (
    <div className="ss">
      <aside className="ss__side">
        <div className="ss__timer" style={{ '--t': time / START_TIME }}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" />
            <circle cx="50" cy="50" r="44" className="fg" style={{ strokeDashoffset: 276.5 * (1 - Math.min(1, time / START_TIME)) }} />
          </svg>
          <b className={time <= 10 ? 'low' : ''}>{Math.ceil(time)}</b>
          <small>seconds</small>
        </div>
        <ol className="ss__ladder" aria-label="Grade progress">
          {GRADES.map((g, i) => (
            <li key={g} className={i < tier ? 'done' : i === tier ? 'now' : ''}>
              {g}
              {i === tier && (
                <span className="ss__pips">
                  {Array.from({ length: PER_GRADE }, (_, k) => (
                    <i key={k} className={k < s.inTier ? 'on' : ''} />
                  ))}
                </span>
              )}
            </li>
          ))}
        </ol>
        <div className="ss__streak">
          Streak <b>{s.streak}</b>
        </div>
      </aside>
      <section className="ss__win">
        <div className="ss__bar">
          <span className="ss__dot" />
          <b>Scheduler AI · study buddy</b>
          <span className="ss__lvl">{GRADES[tier]}</span>
        </div>
        <div className="ss__chat" ref={chat} aria-live="polite">
          {visible.map((m, i) => (
            <div key={log.length - visible.length + i} className={`msg msg--${m.who} ${m.ok === true ? 'ok' : m.ok === false ? 'no' : ''}`}>
              {m.subj && <small>{m.subj}</small>}
              {m.text}
            </div>
          ))}
          <div className="msg msg--ai msg--q" key={`q-${q.q}`}>
            <small>
              {q.subj} · {GRADES[tier]}
            </small>
            {q.q}
          </div>
        </div>
        <div className="ss__opts">
          {q.opts.map((o, i) => (
            <button
              key={o + i}
              disabled={!!picked || elim.includes(o)}
              className={`${picked && o === q.a ? 'right' : ''} ${picked === o && o !== q.a ? 'wrong' : ''} ${elim.includes(o) ? 'gone' : ''}`}
              onClick={() => answer(o)}
            >
              <kbd>{i + 1}</kbd>
              {o}
            </button>
          ))}
        </div>
        <div className="ss__foot">
          <button className="ss__hint" onClick={hint} disabled={!hints || !!elim.length || !!picked}>
            💡 Ask the AI tutor <span>{hints} left · H</span>
          </button>
        </div>
      </section>
    </div>
  )
}
