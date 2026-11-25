// Procedural storm audio with WebAudio — no sound files.
let ctx = null
let master, rainGain, rainFilter
let muted = false

function noiseBuffer(seconds = 2) {
  const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const d = b.getChannelData(0)
  let last = 0
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1
    last = (last + 0.02 * w) / 1.02 // brown-ish
    d[i] = w * 0.5 + last * 3
  }
  return b
}

export function startAudio() {
  if (ctx) return
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 0.8
  master.connect(ctx.destination)
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(3)
  src.loop = true
  rainFilter = ctx.createBiquadFilter()
  rainFilter.type = 'lowpass'
  rainFilter.frequency.value = 1200
  rainGain = ctx.createGain()
  rainGain.gain.value = 0
  src.connect(rainFilter).connect(rainGain).connect(master)
  src.start()
}

export function setRain(level) {
  if (!ctx) return
  rainGain.gain.setTargetAtTime(0.05 + level * 0.35, ctx.currentTime, 0.3)
  rainFilter.frequency.setTargetAtTime(900 + level * 2600, ctx.currentTime, 0.3)
}

export function thunder(strength = 1) {
  if (!ctx) return
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(3)
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 180 + Math.random() * 120
  const g = ctx.createGain()
  const t = ctx.currentTime
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(1.2 * strength, t + 0.05)
  g.gain.exponentialRampToValueAtTime(0.001, t + 2.6)
  src.connect(f).connect(g).connect(master)
  src.start(t)
  src.stop(t + 3)
}

export function rumble() {
  if (!ctx) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(48, t)
  o.frequency.exponentialRampToValueAtTime(28, t + 1.4)
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 140
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.7, t + 0.08)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
  o.connect(f).connect(g).connect(master)
  o.start(t)
  o.stop(t + 1.7)
  thunder(0.5)
}

export function beep(freq = 880, dur = 0.08) {
  if (!ctx) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.15, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export function setMuted(m) {
  muted = m
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05)
}

export function chime() {
  if (!ctx) return
  const t = ctx.currentTime
  ;[784, 1046].forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = f
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t + i * 0.07)
    g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.07 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.35)
    o.connect(g).connect(master)
    o.start(t + i * 0.07)
    o.stop(t + i * 0.07 + 0.4)
  })
}

export function fail() {
  if (!ctx) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'square'
  o.frequency.setValueAtTime(220, t)
  o.frequency.exponentialRampToValueAtTime(110, t + 0.35)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.08, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + 0.42)
}

export function fanfare(good = true) {
  if (!ctx) return
  const t = ctx.currentTime
  const notes = good ? [523, 659, 784, 1046] : [392, 330, 262]
  notes.forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = f
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t + i * 0.12)
    g.gain.exponentialRampToValueAtTime(0.16, t + i * 0.12 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.5)
    o.connect(g).connect(master)
    o.start(t + i * 0.12)
    o.stop(t + i * 0.12 + 0.55)
  })
}
