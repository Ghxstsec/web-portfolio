// Low-poly 3D sea for the hero. Pure shader, no assets. Falls back to the photo if WebGL is unavailable.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('ocean');
const hero = document.querySelector('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { /* keep photo fallback */ }

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene();

  // sky gradient
  const sky = document.createElement('canvas'); sky.width = 4; sky.height = 512;
  const g = sky.getContext('2d').createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#5f8f98'); g.addColorStop(0.42, '#b9cfcc'); g.addColorStop(0.5, '#f1d9c3'); g.addColorStop(0.53, '#f6e6d4'); g.addColorStop(1, '#f6e6d4');
  const sctx = sky.getContext('2d'); sctx.fillStyle = g; sctx.fillRect(0, 0, 4, 512);
  const skyTex = new THREE.CanvasTexture(sky); skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400);

  const uniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color('#08313a') },
    uShallow: { value: new THREE.Color('#2a8c95') },
    uFoam: { value: new THREE.Color('#d9efec') },
    uHorizon: { value: new THREE.Color('#f1d9c3') },
    uRefl: { value: new THREE.Color('#8fb9bd') },
    uSun: { value: new THREE.Vector3(0.15, 0.22, -1).normalize() },
    uMouse: { value: new THREE.Vector2() }
  };

  const geo = new THREE.PlaneGeometry(260, 260, 170, 170);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */`
      uniform float uTime; uniform vec2 uMouse;
      varying vec3 vWorld; varying float vH;
      float w(vec2 p, vec2 d, float f, float a, float s){ return a * sin(dot(normalize(d), p) * f + uTime * s); }
      void main(){
        vec3 p = position;
        vec2 q = p.xy;
        float h = w(q, vec2(1.0, 0.35), 0.16, 0.62, 0.9)
                + w(q, vec2(-0.45, 1.0), 0.29, 0.30, 1.35)
                + w(q, vec2(0.8, -0.55), 0.62, 0.13, 2.1)
                + w(q, vec2(-0.9, -0.15), 1.15, 0.06, 2.9);
        // gentle swell that follows the pointer
        float d = length(q - uMouse * vec2(18.0, 10.0) - vec2(0.0, 12.0));
        h += 0.35 * exp(-d * 0.08) * sin(d * 0.7 - uTime * 2.2);
        p.z += h; vH = h;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uDeep, uShallow, uFoam, uHorizon, uSun, uRefl;
      varying vec3 vWorld; varying float vH;
      void main(){
        vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        if (n.y < 0.0) n = -n;
        vec3 v = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        float diff = max(dot(n, normalize(vec3(0.3, 1.0, -0.4))), 0.0);
        vec3 col = mix(uDeep, uShallow, smoothstep(-0.7, 0.8, vH) * 0.85 + diff * 0.15);
        col = mix(col, uRefl, fres * 0.55);
        float spec = pow(max(dot(reflect(-v, n), uSun), 0.0), 90.0);
        col += vec3(1.0, 0.86, 0.72) * spec * 1.1;
        col = mix(col, uFoam, smoothstep(0.75, 1.15, vH) * 0.5);
        float dist = length(vWorld.xz - cameraPosition.xz);
        col = mix(col, uHorizon, smoothstep(55.0, 190.0, dist) * 0.9);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
    extensions: { derivatives: true }
  });
  const sea = new THREE.Mesh(geo, mat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.z = -60;
  scene.add(sea);

  const resize = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 62 : 48;
    camera.updateProjectionMatrix();
  };
  resize(); addEventListener('resize', resize);

  const target = new THREE.Vector2(), mouse = new THREE.Vector2();
  addEventListener('pointermove', e => {
    target.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1));
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

  const clock = new THREE.Clock();
  let first = true;
  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) { clock.getDelta(); return; }
    const t = reduce ? 0 : clock.getElapsedTime();
    uniforms.uTime.value = t;
    mouse.lerp(target, 0.04);
    uniforms.uMouse.value.copy(mouse);
    const p = window.__heroProgress || 0;
    // camera rises and tilts down as you scroll out of the hero
    camera.position.set(mouse.x * 0.8, 2.6 + p * 9 + Math.sin(t * 0.6) * 0.12, 14);
    camera.lookAt(mouse.x * 2, 1.4 - p * 10 + mouse.y * 0.6, -40);
    renderer.render(scene, camera);
    if (first) { first = false; canvas.classList.add('ready'); }
  };
  tick();
}
