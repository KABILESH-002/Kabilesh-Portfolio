import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Hub from './Hub.jsx'
import Shell from './Shell.jsx'
import { byId } from './games.js'
import StudySprint from './games/StudySprint.jsx'
import RadarCall from './games/RadarCall.jsx'
import FoodLink from './games/FoodLink.jsx'
import LeakPatrol from './games/LeakPatrol.jsx'
import './arcade.css'

const COMPONENTS = { study: StudySprint, radar: RadarCall, food: FoodLink, leak: LeakPatrol }
const current = () => location.hash.replace('#', '')

function Arcade() {
  const [id, setId] = useState(current)
  useEffect(() => {
    const on = () => {
      setId(current())
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  const game = COMPONENTS[id] && byId[id]
  useEffect(() => {
    document.title = game ? `${game.title} · Arcade · Kumuthavannan Kabileshwar` : 'Arcade: play the projects · Kumuthavannan Kabileshwar'
  }, [game])
  if (!game) return <Hub />
  return <Shell key={id} game={game} Game={COMPONENTS[id]} />
}

createRoot(document.getElementById('root')).render(<Arcade />)
