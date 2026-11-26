// Tiny procedural sound effects (WebAudio, no files).
let ctx = null
let muted = (() => {
  try {
    return localStorage.getItem('arcade.muted') === '1'
  } catch {
    return false
  }
})()

function ac() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

function tone(freq, dur = 0.12, type = 'sine', vol = 0.18, delay = 0, slide = 0) {
  if (muted) return
  const c = ac()
  if (!c) return
  if (c.state === 'suspended') c.resume()
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

export const sfx = {
  unlock: () => ac()?.resume?.(),
  tap: () => tone(660, 0.06, 'triangle', 0.12),
  good: () => {
    tone(660, 0.1, 'triangle')
    tone(990, 0.14, 'triangle', 0.16, 0.07)
  },
  bad: () => tone(220, 0.25, 'sawtooth', 0.1, 0, -90),
  tick: () => tone(1200, 0.04, 'square', 0.05),
  alert: () => {
    tone(880, 0.15, 'square', 0.08)
    tone(660, 0.15, 'square', 0.08, 0.18)
  },
  level: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'triangle', 0.14, i * 0.08)),
  end: () => [784, 659, 523, 392, 523, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.13, i * 0.1)),
}

export const isMuted = () => muted
export function setMuted(m) {
  muted = m
  try {
    localStorage.setItem('arcade.muted', m ? '1' : '0')
  } catch {}
}
