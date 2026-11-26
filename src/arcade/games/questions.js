// Question generators for Study Sprint, one tier per grade (Grade 6 → A/L).
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
const pick = (a) => a[Math.floor(Math.random() * a.length)]
const shuffle = (a) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

// numeric distractors near the answer
function numOpts(ans, spread = 3) {
  const s = new Set([ans])
  const cand = [ans + 1, ans - 1, ans + spread, ans - spread, ans * 2, Math.round(ans / 2), ans + 10, ans - 10, ans + 2]
  for (const c of shuffle(cand)) {
    if (s.size >= 4) break
    if (c !== ans && c >= 0) s.add(c)
  }
  let k = 3
  while (s.size < 4) s.add(ans + k++)
  return [...s].map(String)
}

export const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'O/L', 'A/L']

const MATH = [
  // Grade 6
  [
    () => {
      const a = ri(12, 89), b = ri(12, 89)
      return { q: `${a} + ${b} = ?`, a: String(a + b), opts: numOpts(a + b, 10), hint: `Add the tens, then the ones: ${a} + ${b}.`, subj: 'Maths' }
    },
    () => {
      const a = ri(3, 12), b = ri(3, 12)
      return { q: `${a} × ${b} = ?`, a: String(a * b), opts: numOpts(a * b, a), hint: `${a} groups of ${b}.`, subj: 'Maths' }
    },
  ],
  // Grade 7
  [
    () => {
      const p = pick([10, 20, 25, 50, 75]), n = pick([40, 60, 80, 120, 200])
      const ans = (p * n) / 100
      return { q: `What is ${p}% of ${n}?`, a: String(ans), opts: numOpts(ans, 5), hint: `${p}% means ${p}/100, so ${n} × ${p} ÷ 100.`, subj: 'Maths' }
    },
    () => {
      const d = pick([3, 4, 5, 6]), n = d * ri(3, 12)
      return { q: `What is 1/${d} of ${n}?`, a: String(n / d), opts: numOpts(n / d, 2), hint: `Divide ${n} into ${d} equal parts.`, subj: 'Maths' }
    },
  ],
  // Grade 8
  [
    () => {
      const a = ri(2, 20), b = ri(2, 9), c = ri(2, 9)
      return { q: `${a} + ${b} × ${c} = ?`, a: String(a + b * c), opts: [String(a + b * c), String((a + b) * c), ...numOpts(a + b * c, b).slice(1, 3)], hint: `Multiply first: ${b} × ${c} = ${b * c}, then add ${a}.`, subj: 'Maths' }
    },
    () => {
      const n = ri(4, 15)
      return { q: `What is ${n}²?`, a: String(n * n), opts: numOpts(n * n, n), hint: `${n}² means ${n} × ${n}.`, subj: 'Maths' }
    },
  ],
  // Grade 9
  [
    () => {
      const x = ri(2, 12), a = ri(2, 9), b = ri(1, 20)
      return { q: `Solve: ${a}x + ${b} = ${a * x + b}`, a: String(x), opts: numOpts(x, 2), hint: `Take ${b} from both sides, then divide by ${a}.`, subj: 'Maths' }
    },
  ],
  // Grade 10
  [
    () => {
      const l = ri(3, 15), w = ri(3, 12)
      return { q: `A rectangle is ${l} cm × ${w} cm. Its area?`, a: `${l * w} cm²`, opts: numOpts(l * w, l).map((v) => `${v} cm²`), hint: `Area = length × width.`, subj: 'Maths' }
    },
    () => {
      const n = pick([16, 25, 36, 49, 64, 81, 100, 121, 144])
      const r = Math.sqrt(n)
      return { q: `√${n} = ?`, a: String(r), opts: numOpts(r, 2), hint: `Which number times itself gives ${n}?`, subj: 'Maths' }
    },
  ],
  // O/L
  [
    () => {
      const n = ri(3, 10)
      return { q: `2^${n} = ?`, a: String(2 ** n), opts: numOpts(2 ** n, 2 ** (n - 1)), hint: `Double 1, ${n} times.`, subj: 'Maths' }
    },
    () => {
      const a = ri(2, 6), b = ri(-5, 9), k = ri(1, 6)
      return { q: `f(x) = ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}. What is f(${k})?`, a: String(a * k + b), opts: numOpts(a * k + b, a), hint: `Put x = ${k}: ${a} × ${k} ${b < 0 ? '−' : '+'} ${Math.abs(b)}.`, subj: 'Maths' }
    },
  ],
  // A/L
  [
    () => {
      const a = ri(2, 7), n = ri(2, 5)
      const ans = `${a * n}x${n - 1 > 1 ? `^${n - 1}` : ''}`
      const o = new Set([ans, `${a}x^${n - 1}`, `${a * n}x^${n}`, `${a + n}x${n - 1 > 1 ? `^${n - 1}` : ''}`])
      return { q: `d/dx of ${a}x^${n} = ?`, a: ans, opts: [...o], hint: `Bring the power down and reduce it by one: ${n} × ${a}x^${n - 1}.`, subj: 'Maths' }
    },
    () => {
      const n = ri(2, 5)
      return { q: `log₁₀(${10 ** n}) = ?`, a: String(n), opts: numOpts(n, 1), hint: `How many times do you multiply 10 to get ${10 ** n}?`, subj: 'Maths' }
    },
    () => pick([
      { q: 'sin 30° = ?', a: '0.5', opts: ['0.5', '1', '√3/2', '0'], hint: 'In a 30-60-90 triangle the side opposite 30° is half the hypotenuse.', subj: 'Maths' },
      { q: 'cos 0° = ?', a: '1', opts: ['1', '0', '0.5', '−1'], hint: 'At 0° the adjacent side equals the hypotenuse.', subj: 'Maths' },
    ]),
  ],
]

// fact questions by tier: [tierFrom, question, answer, wrong..., hint, subject]
const FACTS = [
  [0, 'How many sides does a hexagon have?', '6', ['5', '7', '8'], 'Think of a honeycomb cell.', 'Maths'],
  [0, 'Which planet is closest to the Sun?', 'Mercury', ['Venus', 'Mars', 'Earth'], 'It is also the smallest planet.', 'Science'],
  [0, 'Plants take in which gas for photosynthesis?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Hydrogen'], 'They give out oxygen in return.', 'Science'],
  [1, 'Water boils at sea level at…', '100 °C', ['90 °C', '50 °C', '120 °C'], 'It freezes at 0 °C.', 'Science'],
  [1, '1 byte is how many bits?', '8', ['4', '16', '10'], 'A bit is a single 0 or 1.', 'ICT'],
  [2, 'The chemical symbol for sodium is…', 'Na', ['So', 'S', 'Sd'], 'It comes from the Latin name natrium.', 'Science'],
  [2, 'Which part of the cell releases energy?', 'Mitochondria', ['Nucleus', 'Ribosome', 'Cell wall'], 'Often called the powerhouse of the cell.', 'Science'],
  [2, 'What does CPU stand for?', 'Central Processing Unit', ['Computer Power Unit', 'Central Program Utility', 'Core Processing Uplink'], 'It is the “brain” that runs instructions.', 'ICT'],
  [3, 'The SI unit of force is the…', 'Newton', ['Joule', 'Watt', 'Pascal'], 'Named after the scientist of the laws of motion.', 'Science'],
  [3, 'Binary 101 in decimal is…', '5', ['3', '6', '101'], '1×4 + 0×2 + 1×1.', 'ICT'],
  [4, 'What does HTML stand for?', 'HyperText Markup Language', ['High Tech Modern Language', 'HyperText Machine Logic', 'Home Tool Markup Language'], 'It marks up the structure of web pages.', 'ICT'],
  [4, 'pH of pure water at 25 °C is…', '7', ['0', '14', '5'], 'It is neutral, neither acid nor base.', 'Science'],
  [5, 'Speed = distance ÷ …', 'time', ['mass', 'force', 'area'], 'Kilometres per hour gives it away.', 'Science'],
  [5, 'Which data structure is first-in, first-out?', 'Queue', ['Stack', 'Tree', 'Graph'], 'Like people waiting in line.', 'ICT'],
  [6, 'Ohm’s law: V = …', 'IR', ['I/R', 'R/I', 'I + R'], 'Voltage equals current times resistance.', 'Physics'],
  [6, 'Avogadro’s number is about…', '6.02 × 10²³', ['3.00 × 10⁸', '9.81', '1.6 × 10⁻¹⁹'], 'The number of particles in one mole.', 'Chemistry'],
  [6, 'Big-O of binary search is…', 'O(log n)', ['O(n)', 'O(n²)', 'O(1)'], 'It halves the search space each step.', 'ICT'],
]

let lastQ = ''
export function makeQuestion(tier) {
  for (let tries = 0; tries < 10; tries++) {
    let q
    if (Math.random() < 0.35) {
      const pool = FACTS.filter((f) => f[0] <= tier && f[0] >= tier - 2)
      const f = pick(pool)
      q = { q: f[1], a: f[2], opts: [f[2], ...f[3]], hint: f[4], subj: f[5] }
    } else {
      const gens = MATH[Math.min(tier, MATH.length - 1)]
      q = pick(gens)()
    }
    if (q.q === lastQ) continue
    lastQ = q.q
    const opts = shuffle([...new Set(q.opts)].slice(0, 4))
    if (!opts.includes(q.a)) opts[0] = q.a
    return { ...q, opts: shuffle(opts) }
  }
  return makeQuestion(0)
}
