import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { buildShapes, N } from './shapes.js'
import { morph, updateMorph } from './morph.js'

const VERT = /* glsl */ `
  attribute vec3 aA; attribute vec3 aB; attribute vec3 cA; attribute vec3 cB; attribute float aR;
  uniform float uT, uTime, uSize, uPix;
  varying vec3 vC; varying float vR;
  void main(){
    // each particle morphs on its own slightly offset schedule, with a swirl in between
    float t = clamp((uT * 1.5) - aR * 0.5, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 p = mix(aA, aB, t);
    float mid = sin(3.14159 * t);
    p += vec3(sin(aR * 40.0 + uTime), cos(aR * 31.0 + uTime * 0.8), sin(aR * 23.0)) * mid * 1.4;
    // gentle idle breathing
    p += vec3(sin(uTime * 0.7 + aR * 12.0), cos(uTime * 0.6 + aR * 9.0), sin(uTime * 0.5 + aR * 7.0)) * 0.03;
    vC = mix(cA, cB, t);
    vR = aR;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * uPix * (0.6 + aR * 0.8) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`
const FRAG = /* glsl */ `
  uniform float uAlpha; varying vec3 vC; varying float vR;
  void main(){
    vec2 d = gl_PointCoord - 0.5;
    float r = dot(d, d);
    if (r > 0.25) discard;
    float a = smoothstep(0.25, 0.0, r);
    gl_FragColor = vec4(vC, a * uAlpha * (0.55 + vR * 0.45));
  }`

function Field({ shapes }) {
  const group = useRef()
  const { gl } = useThree()
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const r = new Float32Array(N)
    for (let i = 0; i < N; i++) r[i] = Math.random()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    g.setAttribute('aA', new THREE.BufferAttribute(shapes.name.pos.slice(), 3))
    g.setAttribute('aB', new THREE.BufferAttribute(shapes.name.pos.slice(), 3))
    g.setAttribute('cA', new THREE.BufferAttribute(shapes.name.color.slice(), 3))
    g.setAttribute('cB', new THREE.BufferAttribute(shapes.name.color.slice(), 3))
    g.setAttribute('aR', new THREE.BufferAttribute(r, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50)
    return g
  }, [shapes])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uT: { value: 0 }, uTime: { value: 0 }, uSize: { value: 26 }, uPix: { value: gl.getPixelRatio() }, uAlpha: { value: 1 } },
      }),
    [gl]
  )
  const cur = useRef({ a: 'name', b: 'name', x: 0, y: 0, s: 1, alpha: 1, intro: 0 })
  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05)
    const m = updateMorph(performance.now())
    const c = cur.current
    if (m.a !== c.a || m.b !== c.b) {
      const A = shapes[m.a] || shapes.name
      const B = shapes[m.b] || shapes.name
      geo.attributes.aA.array.set(A.pos)
      geo.attributes.cA.array.set(A.color)
      geo.attributes.aB.array.set(B.pos)
      geo.attributes.cB.array.set(B.color)
      for (const k of ['aA', 'aB', 'cA', 'cB']) geo.attributes[k].needsUpdate = true
      c.a = m.a
      c.b = m.b
    }
    // first load: particles fly in from chaos
    c.intro = Math.min(1, c.intro + dt * 0.45)
    const k = 1 - Math.exp(-dt * 4)
    c.x += (m.x - c.x) * k
    c.y += (m.y - c.y) * k
    c.s += (m.scale - c.s) * k
    c.alpha += (m.alpha - c.alpha) * k
    mat.uniforms.uT.value = m.t
    mat.uniforms.uTime.value += dt
    mat.uniforms.uAlpha.value = c.alpha * (0.3 + 0.7 * c.intro)
    const g = group.current
    g.position.set(c.x, c.y, 0)
    g.scale.setScalar(c.s * (0.4 + 0.6 * easeOut(c.intro)))
    // slow spin for 3D shapes, mouse tilt for all
    const spin = ['sphere', 'cube', 'drop', 'terrain', 'cloud'].includes(m.t > 0.5 ? m.b : m.a)
    g.rotation.y += ((spin ? state.clock.elapsedTime * 0.18 : 0) + state.pointer.x * 0.25 - g.rotation.y) * 0.05
    g.rotation.x += (-state.pointer.y * 0.15 + (m.a === 'terrain' ? 0.5 : 0) - g.rotation.x) * 0.05
  })
  return (
    <group ref={group}>
      <points geometry={geo} material={mat} frustumCulled={false} />
    </group>
  )
}
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

export default function Particles() {
  const [shapes, setShapes] = useState(null)
  useEffect(() => {
    // shapes that use the display font are drawn once fonts are ready
    const go = () => setShapes(buildShapes())
    if (document.fonts) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(go)
    else go()
  }, [])
  if (!shapes) return null
  return (
    <Canvas className="particles" dpr={[1, 1.75]} camera={{ fov: 45, position: [0, 0, 11] }} gl={{ antialias: false, alpha: true }}>
      <Field shapes={shapes} />
    </Canvas>
  )
}
