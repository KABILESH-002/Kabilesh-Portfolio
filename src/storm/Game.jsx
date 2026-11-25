import * as THREE from 'three'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Line, Html } from '@react-three/drei'
import { XR, createXRStore, useXR } from '@react-three/xr'
import { buildTerrain, heightAt, riverZ, computeRoutes, setWorld, START, GOAL } from '../site/terrainGen.js'
import { makeStorm, drapePath, pathInfo, newGroup, stepGroup, groupDone, safeCount, zonesCrossed, UNIT_M, SLIDE_WINDOW, SPACING, MISSIONS, scoreMission } from './sim.js'
import { useStore, getState, set, live, newRun, startPlanning, nextMission, retryMission, toMenu, popup } from './store.js'
import { setRain, thunder, rumble, beep, chime, fail, fanfare } from './audio.js'

export const xrStore = createXRStore({ emulate: false })
// simulation speed (?ts=4 in the URL is handy for testing; 1 for players)
const TS = Number(new URLSearchParams(location.search).get('ts')) || 1

const MAP = 108
const HALF = MAP / 2
const BG = new THREE.Color('#06090d')
const LIGHT = new THREE.Vector3(-0.5, 0.75, 0.45).normalize()

/* ---------------- world (new valley per mission) ---------------- */
function skirtGeometry() {
  const pos = []
  const col = []
  const steps = 160
  const soil = [new THREE.Color('#3b2b20'), new THREE.Color('#5a412d'), new THREE.Color('#2a1f18')]
  const edge = (fx) => {
    for (let i = 0; i < steps; i++) {
      const a = fx(i / steps), b = fx((i + 1) / steps)
      const ha = heightAt(a[0], a[1]), hb = heightAt(b[0], b[1])
      const quad = [[a[0], ha, a[1]], [b[0], hb, b[1]], [b[0], -6, b[1]], [a[0], ha, a[1]], [b[0], -6, b[1]], [a[0], -6, a[1]]]
      for (const v of quad) {
        pos.push(...v)
        const t = THREE.MathUtils.clamp((v[1] + 6) / 26, 0, 1)
        const c = soil[2].clone().lerp(soil[1], t).lerp(soil[0], Math.max(0, t - 0.6))
        col.push(c.r, c.g, c.b)
      }
    }
  }
  edge((t) => [-HALF + t * MAP, HALF])
  edge((t) => [HALF, HALF - t * MAP])
  edge((t) => [HALF - t * MAP, -HALF])
  edge((t) => [-HALF, -HALF + t * MAP])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}
function riverGeometry() {
  const pts = []
  for (let x = -HALF; x <= HALF; x += 1) {
    const z = THREE.MathUtils.clamp(riverZ(x), -HALF, HALF)
    pts.push(new THREE.Vector3(x, heightAt(x, z) + 0.12, z))
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.5, 6)
}

function buildWorld(seed, m) {
  setWorld(seed || null, { hotspots: m.hotspots })
  const routes = computeRoutes({ tailFrom: 0.3, tailWeight: 160 }) // cautious, tail-penalising route
  return {
    seed,
    terrain: buildTerrain(MAP, 170),
    skirt: skirtGeometry(),
    river: riverGeometry(),
    start: START.clone(),
    goal: GOAL.clone(),
    ai: routes.robust,
    storm: makeStorm((seed || 7) * 13 + 5, m.slides, m.villagers * SPACING + 8),
  }
}

/* ---------------- terrain ---------------- */
function Terrain({ world, handlers }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uRain: { value: 0 }, uRisk: { value: 0 }, uCrack: { value: 0 }, uTime: { value: 0 }, uLight: { value: LIGHT }, uFlash: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute float aRisk; varying float vRisk; varying vec3 vN; varying vec3 vW;
          void main(){ vRisk = aRisk; vN = normalize(normal); vW = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uRain, uRisk, uCrack, uTime, uFlash; uniform vec3 uLight;
          varying float vRisk; varying vec3 vN; varying vec3 vW;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
          vec3 ramp(float t){ vec3 a=vec3(1.0,0.86,0.35), b=vec3(1.0,0.52,0.18), c=vec3(0.92,0.16,0.14); return t<0.5?mix(a,b,t*2.0):mix(b,c,(t-0.5)*2.0); }
          void main(){
            float hgt = vW.y;
            vec3 N = normalize(vN);
            float shade = clamp(dot(N, uLight), 0.0, 1.0);
            float slope = 1.0 - N.y;
            vec3 col = mix(vec3(0.10,0.24,0.15), vec3(0.17,0.36,0.17), smoothstep(1.0, 8.0, hgt));
            col = mix(col, vec3(0.30,0.42,0.22), smoothstep(9.0, 17.0, hgt));
            col = mix(col, vec3(0.38,0.34,0.29), smoothstep(0.5, 0.75, slope));
            col *= mix(1.0, 0.65, uRain);
            col *= 0.25 + 1.05 * shade;
            float c1 = abs(fract(hgt / 1.5 + 0.5) - 0.5) / fwidth(hgt / 1.5);
            col = mix(col, col * 1.4 + 0.03, (1.0 - min(c1, 1.0)) * 0.18);
            vec2 g = abs(fract(vW.xz / 10.0 + 0.5) - 0.5) / fwidth(vW.xz / 10.0);
            col += (1.0 - min(min(g.x, g.y), 1.0)) * 0.03;
            float guess = vRisk + (n(vW.xz * 0.18) - 0.5) * 0.45;
            float m = smoothstep(0.45, 0.8, guess) * uCrack;
            float lines = 1.0 - smoothstep(0.0, 0.09, abs(sin(vW.x * 2.1 + sin(vW.z * 1.7) * 2.5 + n(vW.xz) * 3.0)));
            col = mix(col, vec3(0.16, 0.05, 0.03), lines * m * 0.85);
            col = mix(col, col * vec3(1.25, 0.85, 0.75), m * 0.4);
            float r = vRisk * (0.55 + 0.45 * uRain);
            float a = smoothstep(0.28, 0.8, r) * uRisk;
            col = mix(col, ramp(r) * (0.55 + 0.55 * shade), a * 0.8);
            col += uFlash * 0.35;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    []
  )
  const hint = useStore((s) => s.hint)
  const phase = useStore((s) => s.phase)
  useFrame((_, dt) => {
    const u = mat.uniforms
    u.uTime.value += dt
    u.uRain.value = live.rain
    u.uCrack.value = THREE.MathUtils.smoothstep(live.rain, 0.35, 0.9)
    const want = hint || phase === 'report' ? 1 : 0
    u.uRisk.value += (want - u.uRisk.value) * Math.min(1, dt * 3)
    u.uFlash.value = live.flash
  })
  return (
    <group>
      <mesh geometry={world.terrain} material={mat} {...handlers} />
      <mesh geometry={world.skirt}>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-6}>
        <planeGeometry args={[MAP, MAP]} />
        <meshStandardMaterial color="#1c1510" />
      </mesh>
      <mesh geometry={world.river} scale={[1, 0.25, 1]} position-y={0.1}>
        <meshBasicMaterial color="#3d8fb8" />
      </mesh>
    </group>
  )
}

function Rain() {
  const N = 3000
  const { geo, speed } = useMemo(() => {
    const p = new Float32Array(N * 6)
    const speed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * MAP, y = Math.random() * 45, z = (Math.random() - 0.5) * MAP
      p.set([x, y, z, x - 0.35, y - 1.4, z], i * 6)
      speed[i] = 30 + Math.random() * 16
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return { geo: g, speed }
  }, [])
  const mat = useRef()
  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const a = geo.attributes.position.array
    mat.current.opacity = live.rain * 0.5
    const n = Math.floor(N * (0.15 + 0.85 * live.rain))
    geo.setDrawRange(0, n * 2)
    for (let i = 0; i < n; i++) {
      let y = a[i * 6 + 1] - speed[i] * dt
      let x = a[i * 6] - speed[i] * dt * 0.25
      if (y < 0) { y += 45; x = (Math.random() - 0.5) * MAP }
      a[i * 6] = x; a[i * 6 + 1] = y; a[i * 6 + 3] = x - 0.35; a[i * 6 + 4] = y - 1.4
    }
    geo.attributes.position.needsUpdate = true
  })
  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <lineBasicMaterial ref={mat} color="#a9c7e8" transparent opacity={0} depthWrite={false} />
    </lineSegments>
  )
}

function Marker({ at, kind, label }) {
  const y = heightAt(at.x, at.y)
  const ring = useRef()
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.7) % 1
    ring.current.scale.setScalar(1 + t * 3)
    ring.current.material.opacity = (1 - t) * 0.8
  })
  const color = kind === 'village' ? '#ffd36b' : '#3de0c8'
  return (
    <group position={[at.x, y, at.y]}>
      {kind === 'village' ? (
        [[-1.4, 0.4], [0.7, -0.9], [1.6, 1], [-0.3, 1.8], [-1.8, -1.2]].map(([x, z], i) => (
          <group key={i} position={[x, heightAt(at.x + x, at.y + z) - y, z]}>
            <mesh position-y={0.5}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#e9e3d6" />
            </mesh>
            <mesh position-y={1.25} rotation-y={Math.PI / 4}>
              <coneGeometry args={[0.85, 0.6, 4]} />
              <meshStandardMaterial color="#b5543a" />
            </mesh>
          </group>
        ))
      ) : (
        <group>
          <mesh position-y={1}>
            <boxGeometry args={[4, 2, 2.6]} />
            <meshStandardMaterial color="#e9eef2" />
          </mesh>
          <mesh position={[2.3, 2.4, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 4.8, 6]} />
            <meshStandardMaterial color="#cfd6dc" />
          </mesh>
          <mesh position={[2.9, 4.4, 0]}>
            <boxGeometry args={[1.2, 0.7, 0.05]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      )}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.25}>
        <ringGeometry args={[1.6, 1.9, 40]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} />
      </mesh>
      <Html position={[0, kind === 'village' ? 4.2 : 6.4, 0]} center zIndexRange={[5, 0]}>
        <div className="tag" style={{ '--c': color }}>
          {label}
        </div>
      </Html>
    </group>
  )
}

/* ---------------- routes ---------------- */
function PlayerRoute({ start }) {
  const waypoints = useStore((s) => s.waypoints)
  const phase = useStore((s) => s.phase)
  const pts2 = useMemo(() => [start, ...waypoints.map((w) => new THREE.Vector2(w.x, w.y))], [waypoints, start])
  const dense = useMemo(() => (pts2.length > 1 ? drapePath(pts2) : null), [pts2])
  const geo = useMemo(() => (dense && dense.length > 1 ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3(dense, false, 'catmullrom', 0), dense.length * 2, 0.34, 8) : null), [dense])
  const preview = useRef()
  useFrame(() => {
    if (!preview.current) return
    const h = live.hover
    const last = pts2[pts2.length - 1]
    const show = phase === 'plan' && h && !getState().complete && !live.drawing
    preview.current.visible = !!show
    if (show) {
      const a = new THREE.Vector3(last.x, heightAt(last.x, last.y) + 0.5, last.y)
      const b = new THREE.Vector3(h.x, heightAt(h.x, h.y) + 0.5, h.y)
      preview.current.geometry.setPositions([a.x, a.y, a.z, b.x, b.y, b.z])
    }
  })
  return (
    <group>
      {geo && (
        <mesh geometry={geo}>
          <meshBasicMaterial color="#ffb547" toneMapped={false} />
        </mesh>
      )}
      <Line ref={preview} points={[[0, 0, 0], [0, 0, 1]]} color="#ffb547" lineWidth={2} dashed dashSize={1} gapSize={0.7} transparent opacity={0.8} />
    </group>
  )
}

function AIRoute({ points }) {
  const phase = useStore((s) => s.phase)
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), points.length * 2, 0.32, 8), [points])
  const ref = useRef()
  const prog = useRef(0)
  useFrame((_, dt) => {
    const show = phase === 'evac' || phase === 'report'
    prog.current = show ? Math.min(1, prog.current + dt * 0.6) : 0
    ref.current.visible = prog.current > 0
    ref.current.geometry.setDrawRange(0, Math.floor((geo.index.count * prog.current) / 3) * 3)
  })
  return (
    <mesh ref={ref} geometry={geo}>
      <meshBasicMaterial color="#3de0c8" toneMapped={false} transparent opacity={0.9} />
    </mesh>
  )
}

/* ---------------- villagers ---------------- */
function Villagers({ which, color, max = 8 }) {
  const refs = useRef([])
  useFrame(({ clock }) => {
    const g = live.groups?.[which]
    refs.current.forEach((m, i) => {
      if (!m) return
      const v = g?.[i]
      m.visible = !!v && v.state !== 'waiting'
      if (!v) return
      m.position.copy(v.pos)
      const caught = v.state === 'caught'
      m.children[0].material.color.set(caught ? '#5b4a40' : color)
      m.rotation.z = caught ? 1.3 : Math.sin(clock.elapsedTime * 12 + i) * 0.08
      m.position.y += caught ? -0.2 : Math.abs(Math.sin(clock.elapsedTime * 12 + i)) * 0.15
    })
  })
  return Array.from({ length: max }, (_, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)} scale={1.1} visible={false}>
      <mesh position-y={0.7}>
        <capsuleGeometry args={[0.35, 0.7, 4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh position-y={1.55}>
        <sphereGeometry args={[0.3, 12, 10]} />
        <meshStandardMaterial color="#f1d3b8" />
      </mesh>
    </group>
  ))
}

/* ---------------- landslides ---------------- */
function Slide({ s }) {
  const g = useRef()
  const debris = useMemo(() => {
    const N = 260
    const pos = new Float32Array(N * 3)
    const vel = []
    const e = 0.8
    const dx = heightAt(s.x + e, s.z) - heightAt(s.x - e, s.z)
    const dz = heightAt(s.x, s.z + e) - heightAt(s.x, s.z - e)
    const down = new THREE.Vector2(-dx, -dz).normalize()
    const base = heightAt(s.x, s.z)
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * s.radius * 0.6
      pos.set([s.x + Math.cos(a) * r, base + 1, s.z + Math.sin(a) * r], i * 3)
      vel.push(new THREE.Vector3(down.x * (2 + Math.random() * 5) + (Math.random() - 0.5) * 2, 2 + Math.random() * 4, down.y * (2 + Math.random() * 5) + (Math.random() - 0.5) * 2))
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geo, vel, base }
  }, [s])
  const ring = useRef()
  const scar = useRef()
  const age = useRef(-1)
  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    if (!s.triggered) {
      g.current.visible = false
      age.current = -1
      return
    }
    g.current.visible = true
    if (age.current < 0) age.current = 0
    age.current += dt
    const a = debris.geo.attributes.position.array
    if (age.current < 3) {
      for (let i = 0; i < debris.vel.length; i++) {
        const v = debris.vel[i]
        v.y -= 9.8 * dt
        a[i * 3] += v.x * dt
        a[i * 3 + 1] += v.y * dt
        a[i * 3 + 2] += v.z * dt
        const gy = heightAt(a[i * 3], a[i * 3 + 2]) + 0.2
        if (a[i * 3 + 1] < gy) { a[i * 3 + 1] = gy; v.multiplyScalar(0.6); v.y = 0 }
      }
      debris.geo.attributes.position.needsUpdate = true
    }
    const active = age.current < SLIDE_WINDOW
    ring.current.scale.setScalar(1 + Math.min(1, age.current * 2) * 0.2)
    ring.current.material.opacity = active ? 0.9 : 0.35
    scar.current.material.opacity = Math.min(0.85, age.current * 1.5)
  })
  return (
    <group ref={g} visible={false}>
      <points geometry={debris.geo}>
        <pointsMaterial color="#6b4a32" size={0.7} sizeAttenuation />
      </points>
      <mesh ref={scar} position={[s.x, debris.base + 0.4, s.z]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[s.radius * 0.8, 32]} />
        <meshBasicMaterial color="#4a3324" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={ring} position={[s.x, debris.base + 0.6, s.z]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[s.radius - 0.4, s.radius, 48]} />
        <meshBasicMaterial color="#ff3b2f" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------------- game loop ---------------- */
function GameLoop({ world }) {
  const lastSec = useRef(0)
  const thunderT = useRef(2)
  const prevStates = useRef({})
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05) * TS
    const st = getState()
    const m = MISSIONS[st.mission]
    live.flash = Math.max(0, live.flash - dt * 3)
    live.shake = Math.max(0, live.shake - dt * 1.5)
    if (st.phase === 'menu' || st.phase === 'brief' || st.phase === 'final') {
      live.rain += ((st.phase === 'brief' ? 0.2 : 0.3) - live.rain) * dt
    } else if (st.phase === 'plan') {
      const t = Math.max(0, st.timeLeft - dt)
      live.rain = 0.2 + 0.75 * (1 - t / m.planTime)
      const sec = Math.ceil(t)
      if (sec !== lastSec.current) {
        lastSec.current = sec
        if (sec <= 5 && sec > 0) beep(sec === 1 ? 1320 : 880)
        set({ timeLeft: t, rainMM: Math.round(40 + live.rain * 240) })
      } else set({ timeLeft: t })
      thunderT.current -= dt
      if (thunderT.current < 0 && live.rain > 0.4) {
        thunderT.current = 4 + Math.random() * 6
        live.flash = 1
        setTimeout(() => thunder(live.rain), 250 + Math.random() * 600)
      }
      if (t <= 0) startEvacuation(world)
    } else if (st.phase === 'evac') {
      live.rain = Math.min(1, live.rain + dt * 0.2)
      live.evacT += dt
      const T = live.evacT
      for (const s of world.storm.slides) {
        if (!s.triggered && T >= s.time) {
          s.triggered = true
          live.shake = 1
          live.flash = 0.5
          rumble()
        }
      }
      stepGroup(live.groups.you, live.youInfo, world.storm, T)
      stepGroup(live.groups.ai, live.aiInfo, world.storm, T)
      // feedback when your villagers arrive or get caught
      for (const v of live.groups.you) {
        const k = 'y' + v.i
        if (prevStates.current[k] !== v.state) {
          if (v.state === 'safe') {
            popup('+100 Safe!', 'good')
            chime()
          }
          if (v.state === 'caught') {
            popup('Villager caught!', 'bad')
            fail()
          }
          prevStates.current[k] = v.state
        }
      }
      const cnt = (g) => ({ safe: safeCount(g), caught: g.filter((v) => v.state === 'caught').length })
      const you = cnt(live.groups.you), aiS = cnt(live.groups.ai)
      if (you.safe !== st.you.safe || you.caught !== st.you.caught || aiS.safe !== st.ai.safe || aiS.caught !== st.ai.caught) set({ you, ai: aiS })
      const lastSlide = world.storm.slides.length ? world.storm.slides[world.storm.slides.length - 1].time + SLIDE_WINDOW : 0
      const allDone = groupDone(live.groups.you) && groupDone(live.groups.ai)
      if (allDone && (T > lastSlide || T > 4 + m.villagers * SPACING + 12)) {
        prevStates.current = {}
        finish(world)
      }
    } else if (st.phase === 'report') {
      live.rain += (0.35 - live.rain) * dt * 0.5
    }
    setRain(live.rain)
  })
  return null
}

export function startEvacuation(world) {
  const st = getState()
  if (st.phase !== 'plan') return
  const m = MISSIONS[st.mission]
  const pts2 = [world.start, ...st.waypoints.map((w) => new THREE.Vector2(w.x, w.y))]
  const last = pts2[pts2.length - 1]
  if (Math.hypot(last.x - world.goal.x, last.y - world.goal.y) > 2.5) pts2.push(world.goal.clone())
  set({ waypoints: pts2.slice(1).map((p) => ({ x: p.x, y: p.y })), complete: true })
  live.youInfo = pathInfo(drapePath(pts2))
  live.aiInfo = pathInfo(world.ai)
  live.groups = { you: newGroup(live.youInfo, m.villagers), ai: newGroup(live.aiInfo, m.villagers) }
  live.evacT = 0
  live.drawing = false
  world.storm.slides.forEach((s) => (s.triggered = false))
  live.evacTimeLeft = st.timeLeft
  thunder(1)
  live.flash = 1
  set({ phase: 'evac', you: { safe: 0, caught: 0 }, ai: { safe: 0, caught: 0 } })
}

function finish(world) {
  const st = getState()
  const m = MISSIONS[st.mission]
  const y = live.youInfo, a = live.aiInfo
  const you = { safe: safeCount(live.groups.you), length: y.length * UNIT_M, risk: y.meanRisk * 100, peak: y.peakRisk * 100, zones: zonesCrossed(y, world.storm) }
  const ai = { safe: safeCount(live.groups.ai), length: a.length * UNIT_M, risk: a.meanRisk * 100, peak: a.peakRisk * 100, zones: zonesCrossed(a, world.storm) }
  const points = scoreMission({ you, ai, villagers: m.villagers, timeLeft: live.evacTimeLeft || 0, hint: st.hint })
  const report = { mission: st.mission, place: st.places[st.mission], villagers: m.villagers, you, ai, points, hint: st.hint }
  const results = [...st.results.slice(0, st.mission), report]
  fanfare(points.stars >= 2)
  set({ phase: 'report', report, results, score: results.reduce((acc, r) => acc + r.points.total, 0) })
}

/* ---------------- camera ---------------- */
function CameraRig({ world }) {
  const { camera, size } = useThree()
  const mode = useXR((s) => s.mode)
  const controls = useRef()
  const phase = useStore((s) => s.phase)
  const target = useMemo(() => new THREE.Vector3((world.start.x + world.goal.x) / 2, 3, (world.start.y + world.goal.y) / 2), [world])
  useEffect(() => {
    // fly to a good overview of the new valley
    if (mode) return
    const portrait = size.width < size.height
    // landscape: look at the route side-on; portrait: look along it, so it runs up the screen
    const dir = portrait
      ? new THREE.Vector3(world.start.x - world.goal.x, 0, world.start.y - world.goal.y).normalize()
      : new THREE.Vector3(world.goal.y - world.start.y, 0, -(world.goal.x - world.start.x)).normalize()
    const dist = portrait ? 210 : 115
    camera.position.copy(target).addScaledVector(dir, dist * 0.75).add(new THREE.Vector3(0, dist * 0.75, 0))
    controls.current?.target.copy(target)
    controls.current?.update()
  }, [world, mode])
  useFrame((_, dt) => {
    if (TS !== 1) {
      // test hook: screen positions of village and shelter (only with ?ts=)
      const pr = (v) => {
        const p = new THREE.Vector3(v.x, heightAt(v.x, v.y), v.y).project(camera)
        return [((p.x + 1) / 2) * size.width, ((1 - p.y) / 2) * size.height]
      }
      window.__storm = { start: pr(world.start), goal: pr(world.goal) }
    }
    if (mode) return
    if (phase === 'menu' || phase === 'final') {
      const a = dt * 0.08
      const p = camera.position.clone().sub(target)
      p.applyAxisAngle(THREE.Object3D.DEFAULT_UP, a)
      camera.position.copy(target).add(p)
    }
    if (live.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * live.shake * 0.8
      camera.position.y += (Math.random() - 0.5) * live.shake * 0.8
    }
  })
  return mode ? null : (
    <OrbitControls
      ref={controls}
      makeDefault
      target={target}
      minDistance={45}
      maxDistance={320}
      maxPolarAngle={1.25}
      enablePan={false}
      enableDamping
      mouseButtons={{ LEFT: -1, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
      touches={{ ONE: -1, TWO: THREE.TOUCH.DOLLY_ROTATE }}
    />
  )
}

/* ---------------- VR controls (3D panel next to the table) ---------------- */
function VRButton({ label, onClick, position, color = '#ffffff' }) {
  return (
    <group position={position}>
      <mesh onClick={onClick}>
        <boxGeometry args={[0.3, 0.085, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text position-z={0.012} fontSize={0.032} color="#06090d" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}
function VRPanel({ world }) {
  const s = useStore((x) => x)
  const m = MISSIONS[s.mission]
  const lines = {
    menu: 'Plan escape routes before the storm peaks. Point at the map and hold the trigger to draw.',
    brief: `Mission ${s.mission + 1}/5 · ${s.places[s.mission]} · ${m.villagers} villagers · ${m.storm} storm`,
    plan: `${Math.ceil(s.timeLeft)} s · ${s.rainMM} mm rain · Score ${s.score}`,
    evac: `You ${s.you.safe}/${m.villagers} safe · AI ${s.ai.safe}/${m.villagers} safe`,
    report: s.report ? `${'★'.repeat(s.report.points.stars)}${'☆'.repeat(3 - s.report.points.stars)}  +${s.report.points.total} points · total ${s.score}` : '',
    final: `Run complete · ${s.score} points`,
  }
  return (
    <group position={[0, 1.45, -1.05]} rotation-x={0.25}>
      <mesh position-z={-0.01}>
        <planeGeometry args={[1.15, 0.42]} />
        <meshBasicMaterial color="#0b1016" transparent opacity={0.88} />
      </mesh>
      <Text position={[0, 0.14, 0]} fontSize={0.05} color="#ffb547" anchorX="center">
        STORM MODE
      </Text>
      <Text position={[0, 0.04, 0]} fontSize={0.032} maxWidth={1.05} color="#e9eef3" anchorX="center" textAlign="center">
        {lines[s.phase]}
      </Text>
      {s.phase === 'menu' && <VRButton label="Play" position={[0, -0.12, 0]} color="#ffb547" onClick={newRun} />}
      {s.phase === 'brief' && <VRButton label="Start mission" position={[0, -0.12, 0]} color="#ffb547" onClick={startPlanning} />}
      {s.phase === 'plan' && (
        <>
          <VRButton label="Undo" position={[-0.37, -0.12, 0]} onClick={() => set((x) => ({ waypoints: x.waypoints.slice(0, -3), complete: false }))} />
          <VRButton label={s.hint ? 'Forecast on' : 'AI forecast'} position={[0, -0.12, 0]} color="#3de0c8" onClick={() => set((x) => ({ hint: !x.hint }))} />
          <VRButton label="Evacuate" position={[0.37, -0.12, 0]} color="#ffb547" onClick={() => startEvacuation(world)} />
        </>
      )}
      {s.phase === 'report' && (
        <>
          <VRButton label="Retry" position={[-0.2, -0.12, 0]} onClick={retryMission} />
          <VRButton label={s.mission < 4 ? 'Next mission' : 'Finish'} position={[0.2, -0.12, 0]} color="#ffb547" onClick={nextMission} />
        </>
      )}
      {s.phase === 'final' && (
        <>
          <VRButton label="Play again" position={[-0.2, -0.12, 0]} color="#ffb547" onClick={newRun} />
          <VRButton label="Menu" position={[0.2, -0.12, 0]} onClick={toMenu} />
        </>
      )}
    </group>
  )
}

/* ---------------- scene ---------------- */
function Scene() {
  const mode = useXR((s) => s.mode)
  const inVR = mode === 'immersive-vr' || mode === 'immersive-ar'
  const group = useRef()
  const worldSeed = useStore((s) => s.worldSeed)
  const missionIdx = useStore((s) => s.mission)
  const world = useMemo(() => buildWorld(worldSeed, MISSIONS[missionIdx]), [worldSeed, missionIdx])
  live.storm = world.storm
  const places = useStore((s) => s.places)
  useEffect(() => set({ xr: inVR }), [inVR])
  useEffect(() => {
    const go = () => startEvacuation(world)
    addEventListener('storm-evacuate', go)
    const stop = () => (live.drawing = false)
    addEventListener('pointerup', stop)
    return () => {
      removeEventListener('storm-evacuate', go)
      removeEventListener('pointerup', stop)
    }
  }, [world])

  const toMap = (e) => {
    const p = group.current.worldToLocal(e.point.clone())
    return { x: p.x, y: p.z }
  }
  const addPoint = (p, force) => {
    const st = getState()
    if (st.phase !== 'plan' || st.complete) return
    if (Math.abs(p.x) > HALF - 1 || Math.abs(p.y) > HALF - 1) return
    const last = st.waypoints.at(-1) || { x: world.start.x, y: world.start.y }
    const d = Math.hypot(p.x - last.x, p.y - last.y)
    if (!force && d < 2.2) return
    if (Math.hypot(p.x - world.goal.x, p.y - world.goal.y) < 5) {
      set({ waypoints: [...st.waypoints, { x: world.goal.x, y: world.goal.y }], complete: true })
      live.drawing = false
      popup('Route reaches the shelter!', 'good')
      chime()
      return
    }
    set({ waypoints: [...st.waypoints, p] })
    if (force) beep(660, 0.04)
  }
  const handlers = {
    onPointerDown: (e) => {
      if (e.button !== undefined && e.button !== 0) return
      if (getState().phase !== 'plan') return
      e.stopPropagation()
      live.drawing = true
      addPoint(toMap(e), true)
    },
    onPointerMove: (e) => {
      if (getState().phase !== 'plan') return
      const p = toMap(e)
      live.hover = p
      if (live.drawing) addPoint(p, false)
    },
    onPointerUp: () => (live.drawing = false),
    onPointerOut: () => (live.hover = null),
  }
  const m = MISSIONS[missionIdx]
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={['#06090d', 180, 400]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[-30, 60, 30]} intensity={1.4} />
      <Flash />
      <group ref={group} scale={inVR ? 0.0105 : 1} position={inVR ? [0, 0.78, -0.8] : [0, 0, 0]}>
        <Terrain world={world} handlers={handlers} />
        <Rain />
        <Marker at={world.start} kind="village" label={places[missionIdx]} />
        <Marker at={world.goal} kind="shelter" label="Shelter" />
        <PlayerRoute start={world.start} />
        <AIRoute points={world.ai} />
        <Villagers which="you" color="#ffb547" max={m.villagers} />
        <Villagers which="ai" color="#3de0c8" max={m.villagers} />
        {world.storm.slides.map((s, i) => (
          <Slide key={`${world.seed}-${i}`} s={s} />
        ))}
      </group>
      {inVR && (
        <Suspense fallback={null}>
          <VRPanel world={world} />
        </Suspense>
      )}
      <GameLoop world={world} />
      <CameraRig world={world} />
    </>
  )
}

function Flash() {
  const l = useRef()
  useFrame(() => (l.current.intensity = live.flash * 3))
  return <pointLight ref={l} position={[0, 80, 20]} color="#cfe0ff" intensity={0} distance={0} />
}

export default function Game() {
  return (
    <Canvas className="storm-canvas" dpr={[1, 1.75]} camera={{ fov: 40, near: 0.05, far: 900, position: [70, 85, 95] }} onContextMenu={(e) => e.preventDefault()}>
      <XR store={xrStore}>
        <Scene />
      </XR>
    </Canvas>
  )
}
