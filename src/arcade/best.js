// Best scores per game, saved in the browser (wrapped: storage can be blocked).
const key = (id) => `arcade.best.${id}`

export function getBest(id) {
  try {
    if (id === 'storm') return JSON.parse(localStorage.getItem('stormmode.best'))?.score || 0
    return Number(localStorage.getItem(key(id))) || 0
  } catch {
    return 0
  }
}

export function saveBest(id, score) {
  const prev = getBest(id)
  if (score <= prev) return false
  try {
    localStorage.setItem(key(id), String(score))
  } catch {}
  return true
}
