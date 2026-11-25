import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { buildTerrain, computeRoutes, heightAt, riverZ, START, GOAL } from './terrainGen.js'
import { hero, stageValues } from './heroState.js'

const LIGHT = new THREE.Vector3(-0.5, 0.75, 0.45).normalize()
const BG = new THREE.Color('#0b1016')

function TerrainMesh() {
  const geo = useMemo(buildTerrain, [])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uRain: { value: 0 }, uRisk: { value: 0 }, uTime: { value: 0 }, uLight: { value: LIGHT }, uBg: { value: BG } },
        vertexShader: /* glsl */ `
          attribute float aRisk;
          varying float vRisk; varying vec3 vN; varying vec3 vW; varying float vDepth;
          void main(){
            vRisk = aRisk; vN = normalize(normal);
            vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
            vec4 mv = viewMatrix * w; vDepth = -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uRain, uRisk, uTime; uniform vec3 uLight, uBg;
          varying float vRisk; varying vec3 vN; varying vec3 vW; varying float vDepth;
          vec3 ramp(float t){
            vec3 a = vec3(1.0,0.86,0.35), b = vec3(1.0,0.52,0.18), c = vec3(0.92,0.16,0.14);
            return t < 0.5 ? mix(a, b, t*2.0) : mix(b, c, (t-0.5)*2.0);
          }
          void main(){
            float h = vW.y;
            float shade = clamp(dot(normalize(vN), uLight), 0.0, 1.0);
            float slope = 1.0 - vN.y;
            vec3 low = vec3(0.10,0.24,0.15), mid = vec3(0.17,0.36,0.17), high = vec3(0.30,0.42,0.22), rock = vec3(0.38,0.34,0.29);
            vec3 col = mix(low, mid, smoothstep(1.0, 8.0, h));
            col = mix(col, high, smoothstep(9.0, 17.0, h));
            col = mix(col, rock, smoothstep(0.5, 0.75, slope));
            // wet ground darkens under rain
            col *= mix(1.0, 0.72, uRain);
            col *= 0.28 + 1.05 * shade;
            // contour lines every 1.5 units, slightly stronger every 7.5
            float c1 = abs(fract(h / 1.5 + 0.5) - 0.5) / fwidth(h / 1.5);
            float c2 = abs(fract(h / 7.5 + 0.5) - 0.5) / fwidth(h / 7.5);
            col = mix(col, col * 1.45 + 0.03, (1.0 - min(c1, 1.0)) * 0.22 + (1.0 - min(c2, 1.0)) * 0.3);
            // survey grid
            vec2 g = abs(fract(vW.xz / 10.0 + 0.5) - 0.5) / fwidth(vW.xz / 10.0);
            col += (1.0 - min(min(g.x, g.y), 1.0)) * 0.035;
            // landslide susceptibility overlay, grows with rainfall
            float r = vRisk * (0.55 + 0.45 * uRain);
            float reveal = smoothstep(0.0, 1.0, uRisk);
            float a = smoothstep(0.3, 0.8, r) * reveal;
            float pulse = 0.85 + 0.15 * sin(uTime * 2.0 + vW.x * 0.15);
            col = mix(col, ramp(r) * (0.55 + 0.55 * shade) * pulse, a * 0.85);
            // depth haze into the background
            float fog = max(smoothstep(80.0, 220.0, vDepth), smoothstep(70.0, 125.0, length(vW.xz)));
            col = mix(col, uBg, fog);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    []
  )
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
    mat.uniforms.uRain.value = hero.v.rain
    mat.uniforms.uRisk.value = hero.v.risk
  })
  return <mesh geometry={geo} material={mat} />
}

function River() {
  const geo = useMemo(() => {
    const pts = []
    for (let x = -120; x <= 120; x += 1) pts.push(new THREE.Vector3(x, heightAt(x, riverZ(x)) + 0.12, riverZ(x)))
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 480, 0.45, 6)
  }, [])
  return (
    <mesh geometry={geo} scale={[1, 0.25, 1]} position-y={0.1}>
      <meshBasicMaterial color="#3d8fb8" />
    </mesh>
  )
}

function Rain() {
  const N = 2600
  const { geo, speed } = useMemo(() => {
    const p = new Float32Array(N * 6)
    const speed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * 100, y = Math.random() * 40, z = (Math.random() - 0.5) * 100
      p.set([x, y, z, x - 0.3, y - 1.2, z], i * 6)
      speed[i] = 28 + Math.random() * 14
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return { geo: g, speed }
  }, [])
  const mat = useRef()
  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const a = geo.attributes.position.array
    const rain = hero.v.rain
    mat.current.opacity = rain * 0.45
    if (rain < 0.01) return
    for (let i = 0; i < N; i++) {
      let y = a[i * 6 + 1] - speed[i] * dt
      let x = a[i * 6] - speed[i] * dt * 0.25
      if (y < 0) { y += 40; x = (Math.random() - 0.5) * 100 }
      a[i * 6] = x; a[i * 6 + 1] = y
      a[i * 6 + 3] = x - 0.3; a[i * 6 + 4] = y - 1.2
    }
    geo.attributes.position.needsUpdate = true
  })
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial ref={mat} color="#a9c7e8" transparent opacity={0} depthWrite={false} />
    </lineSegments>
  )
}

function Route({ points, color, k, width = 0.32, label, labelAt = 0.5, show }) {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), points.length * 2, width, 8), [points, width])
  const total = geo.index.count
  const ref = useRef()
  const dot = useRef()
  const lab = useRef()
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points])
  const labPos = useMemo(() => curve.getPointAt(labelAt).add(new THREE.Vector3(0, 1.2, 0)), [curve, labelAt])
  useFrame(({ clock }) => {
    const prog = hero.v[k]
    const n = Math.floor((total * Math.min(1, prog)) / 3) * 3
    ref.current.geometry.setDrawRange(0, n)
    ref.current.visible = prog > 0.001
    // an evacuee dot travelling along the finished route
    const done = prog >= 0.999
    dot.current.visible = done
    if (done) dot.current.position.copy(curve.getPointAt((clock.elapsedTime * 0.08) % 1)).add(new THREE.Vector3(0, 0.25, 0))
    if (lab.current) lab.current.style.opacity = prog > 0.6 && show() ? 1 : 0
  })
  return (
    <group>
      <mesh ref={ref} geometry={geo}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={dot}>
        <sphereGeometry args={[0.55, 16, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <Html position={labPos} center zIndexRange={[4, 0]}>
        <div ref={lab} className="map-label" style={{ '--c': color, opacity: 0 }}>
          {label}
        </div>
      </Html>
    </group>
  )
}

function Marker({ at, label, kind, color = '#ffffff', showFrom = 0, showTo = 0.97 }) {
  const y = heightAt(at.x, at.y)
  const ring = useRef()
  const lab = useRef()
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.7) % 1
    ring.current.scale.setScalar(1 + t * 3)
    ring.current.material.opacity = (1 - t) * 0.8
    if (lab.current) lab.current.style.opacity = hero.p >= showFrom && hero.p < showTo ? 1 : 0
  })
  return (
    <group position={[at.x, y, at.y]}>
      {kind === 'village' &&
        [[-1.2, 0.4], [0.6, -0.8], [1.4, 0.9], [-0.2, 1.6]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh position-y={0.45}>
              <boxGeometry args={[0.9, 0.9, 0.9]} />
              <meshStandardMaterial color="#e9e3d6" />
            </mesh>
            <mesh position-y={1.1} rotation-y={Math.PI / 4}>
              <coneGeometry args={[0.8, 0.5, 4]} />
              <meshStandardMaterial color="#b5543a" />
            </mesh>
          </group>
        ))}
      {kind === 'shelter' && (
        <group>
          <mesh position-y={0.8}>
            <boxGeometry args={[3, 1.6, 2]} />
            <meshStandardMaterial color="#e9eef2" />
          </mesh>
          <mesh position={[1.8, 2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 4, 6]} />
            <meshStandardMaterial color="#cfd6dc" />
          </mesh>
          <mesh position={[2.3, 3.6, 0]}>
            <boxGeometry args={[1, 0.6, 0.04]} />
            <meshBasicMaterial color="#3de0c8" />
          </mesh>
        </group>
      )}
      {kind === 'gauge' && (
        <group>
          <mesh position-y={1}>
            <cylinderGeometry args={[0.12, 0.12, 2, 8]} />
            <meshStandardMaterial color="#d6dde4" />
          </mesh>
          <mesh position-y={2.1}>
            <cylinderGeometry args={[0.35, 0.25, 0.4, 12]} />
            <meshStandardMaterial color="#8fb7d9" />
          </mesh>
        </group>
      )}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.2}>
        <ringGeometry args={[0.9, 1.1, 32]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} />
      </mesh>
      <Html position={[0, kind === 'gauge' ? 3.2 : 4, 0]} center zIndexRange={[4, 0]}>
        <div ref={lab} className="map-label" style={{ '--c': color, opacity: 0 }}>
          {label}
        </div>
      </Html>
    </group>
  )
}

const GAUGES = [new THREE.Vector2(-12, 14), new THREE.Vector2(14, 4), new THREE.Vector2(-36, -22)]

// camera keyframes along the hero scroll (p in 0..1)
const KEYS = [
  { p: 0.0, pos: [78, 58, 92], look: [0, 2, -6] },
  { p: 0.22, pos: [52, 34, 74], look: [-4, 4, -6] },
  { p: 0.42, pos: [-6, 82, 70], look: [0, 0, -8] },
  { p: 0.62, pos: [-58, 52, 44], look: [2, 4, -10] },
  { p: 0.8, pos: [-26, 88, 58], look: [4, 2, -10] },
  { p: 1.0, pos: [0, 130, 26], look: [0, 0, -8] },
]
function CameraRig() {
  const { camera, size } = useThree()
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), cur: new THREE.Vector3(0, 2, -2) }), [])
  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05)
    const p = hero.p
    let a = KEYS[0], b = KEYS[KEYS.length - 1]
    for (let i = 0; i < KEYS.length - 1; i++) if (p >= KEYS[i].p && p <= KEYS[i + 1].p) { a = KEYS[i]; b = KEYS[i + 1]; break }
    const t = THREE.MathUtils.smootherstep(p, a.p, b.p)
    tmp.pos.fromArray(a.pos).lerp(new THREE.Vector3().fromArray(b.pos), t)
    tmp.look.fromArray(a.look).lerp(new THREE.Vector3().fromArray(b.look), t)
    // portrait screens: pull back so the whole tile fits
    if (size.width < size.height) tmp.pos.multiplyScalar(1.35)
    // subtle mouse parallax
    tmp.pos.x += state.pointer.x * 3
    tmp.pos.y += state.pointer.y * 2
    camera.position.lerp(tmp.pos, 1 - Math.exp(-dt * 3))
    tmp.cur.lerp(tmp.look, 1 - Math.exp(-dt * 3))
    camera.lookAt(tmp.cur)
    const w = size.width, h = size.height
    if (w > h * 1.1) camera.setViewOffset(w, h, -w * 0.17, 0, w, h)
    else camera.clearViewOffset()
  })
  return null
}

function Driver() {
  // turn scroll progress into smoothed scene values
  useFrame((_, dt) => {
    const target = stageValues(hero.p)
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 5)
    for (const key in target) hero.v[key] += (target[key] - hero.v[key]) * k
  })
  return null
}

export default function TerrainScene() {
  const routes = useMemo(computeRoutes, [])
  hero.routes = routes
  return (
    <Canvas className="hero-canvas" dpr={[1, 1.75]} camera={{ fov: 40, near: 0.5, far: 600, position: [62, 48, 70] }} gl={{ antialias: true }}>
      <color attach="background" args={[BG]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[-30, 50, 30]} intensity={1.6} />
      <Driver />
      <CameraRig />
      <TerrainMesh />
      <River />
      <Rain />
      <Route points={routes.shortest} color="#ff5a3c" k="routeA" label="Shortest path" labelAt={0.5} show={() => hero.p > 0.55} />
      <Route points={routes.robust} color="#3de0c8" k="routeB" label="Risk-aware route" labelAt={0.62} show={() => hero.p > 0.66} />
      <Marker at={START} kind="village" label="Village" color="#ffd36b" showFrom={0.55} />
      <Marker at={GOAL} kind="shelter" label="Shelter" color="#3de0c8" showFrom={0.55} />
      {GAUGES.map((g, i) => (
        <Marker key={i} at={g} kind="gauge" label={`Rain gauge ${i + 1}`} color="#8fb7d9" showFrom={0.18} showTo={0.42} />
      ))}
    </Canvas>
  )
}
