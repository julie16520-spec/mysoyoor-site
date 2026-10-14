// 소요 홈페이지 (podium.global 처럼):
// 1) 흰 화면: 먹색 덩어리(메타볼)가 천천히 모양을 바꾸고 마우스 쪽 작은 방울이 따라 붙는다.
//    스크롤하면 물방울이 커져 화면을 먹색으로 덮으며 검은 화면으로 넘어간다.
// 2) 검은 화면: 울퉁불퉁한 돌 같은 입체가 돌고, 둘레로 빛 조각들이 돈다.
//    스크롤 진행도가 회전과 카메라 거리를 정한다.
// 스크롤 이벤트는 쓰지 않고, 그리는 루프에서 위치를 읽는다. 보이지 않는 장면은 그리지 않는다.
import * as THREE from "three";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const dark = matchMedia("(prefers-color-scheme: dark)").matches;
const small = matchMedia("(max-width: 760px)").matches;
const DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);

/** 섹션이 화면에 걸쳐 있는지 (그리는 루프를 멈추고 켜는 데 쓴다) */
function watchVisible(el, cb) {
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: "100px" }).observe(el);
}

// ── 1. 흰 화면: 먹색 물방울 ─────────────────────────────────
const blobCanvas = document.getElementById("blob");
const intro = document.querySelector(".intro");
if (blobCanvas) {
  const renderer = new THREE.WebGLRenderer({ canvas: blobCanvas, antialias: false, alpha: false });
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const paper = new THREE.Color(dark ? 0x161616 : 0xf3f3f1);
  const ink = new THREE.Color(dark ? 0xededea : 0x141414);
  const uniforms = {
    uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(0.4, 0.1) },
    uGrow: { value: 0 }, uPaper: { value: paper }, uInk: { value: ink }, uCenter: { value: new THREE.Vector2(0.2, 0.06) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime, uGrow;
      uniform vec2 uRes, uMouse, uCenter;
      uniform vec3 uPaper, uInk;
      float ball(vec2 p, vec2 c, float r) { vec2 d = p - c; float k = r * r / max(dot(d, d), 1e-5); return k * k; }   // 1/d^4: 덜 뭉개져 귀가 산다
      void main() {
        float s = min(uRes.x, uRes.y);
        vec2 p = (vUv * uRes - 0.5 * uRes) / s;          // 짧은 변 = 1, 가운데 0
        float g = 1.0 + uGrow * uGrow * 9.0;              // 스크롤하면 커진다
        vec2 q = (p - uCenter) / g;
        float t = uTime;
        // 하나의 덩어리가 천천히 모양을 바꾼다 (추상, 그림 없음)
        float f = 0.0;
        f += ball(q, vec2(0.0, 0.0) + 0.05 * vec2(sin(t * .41), cos(t * .37)), 0.22);
        f += ball(q, vec2(0.17 * cos(t * .29), 0.14 * sin(t * .33)), 0.15);
        f += ball(q, vec2(-0.16 * sin(t * .23 + 1.0), 0.18 * cos(t * .27 + 2.0)), 0.13);
        f += ball(q, vec2(0.12 * sin(t * .31 + 4.0), -0.17 * cos(t * .21)), 0.12);
        // 떨어져 나온 물방울 둘과 마우스를 따라오는 작은 방울
        f += ball(q, vec2(0.38 * cos(t * .23), 0.32 * sin(t * .31)) , 0.05);
        f += ball(q, vec2(-0.36 * sin(t * .19), -0.3 * cos(t * .27)), 0.04);
        f += ball(q, (uMouse - uCenter) / g, 0.035);
        f = min(f, 4.0);   // 방울 한가운데서 값이 튀어 점이 생기지 않게
        float aa = fwidth(f) * 1.2;
        float inside = smoothstep(1.0 - aa, 1.0 + aa, f);
        vec3 col = mix(uPaper, uInk, inside);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  material.extensions = { derivatives: true };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const resize = () => {
    const w = blobCanvas.clientWidth, h = blobCanvas.clientHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * DPR, h * DPR);
    uniforms.uCenter.value.set(0.0, 0.02);
  };
  resize();
  addEventListener("resize", resize);

  let mx = 0.4, my = 0.1, tx = mx, ty = my;
  addEventListener("pointermove", (e) => {
    const s = Math.min(innerWidth, innerHeight);
    tx = (e.clientX - innerWidth / 2) / s;
    ty = -(e.clientY - innerHeight / 2) / s;
  }, { passive: true });

  let visible = true;
  watchVisible(intro, (v) => { visible = v; });
  const start = performance.now();
  const tick = (now) => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = (now - start) / 1000;
    uniforms.uTime.value = t;
    mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
    uniforms.uMouse.value.set(mx, my);
    const h = intro.offsetHeight;
    uniforms.uGrow.value = Math.min(1, Math.max(0, scrollY / h));
    renderer.render(scene, camera);
  };
  if (reduceMotion) renderer.render(scene, camera);
  else requestAnimationFrame(tick);
}

// ── 2. 검은 화면: 돌과 둘레를 도는 조각들 ─────────────────────────
function buildStone() {
  // 정이십면체를 잘게 나눠 꼭짓점을 들쭉날쭉 밀어 깎은 돌처럼
  const geo = new THREE.IcosahedronGeometry(7, 5);
  const pos = geo.attributes.position, v = new THREE.Vector3();
  const n = (x, y, z) => Math.sin(x * 1.7 + y * .9) * Math.cos(y * 1.3 - z * 1.1) + .5 * Math.sin(z * 2.3 + x * .7);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const r = 7 * (1 + 0.12 * n(v.x * 2, v.y * 2, v.z * 2));
    v.multiplyScalar(r); v.y *= 0.62;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8c8a86, roughness: 0.92, metalness: 0.05, flatShading: true }));
}

const sceneCanvas = document.getElementById("scene");
const orbit = document.getElementById("orbit");
if (sceneCanvas) {
  const renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true, alpha: false });
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x0e0e0e);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0e0e0e, 34, 62);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-12, 18, 20);
  scene.add(key);

  const stone = buildStone();
  scene.add(stone);

  // 둘레를 도는 조각들: 얇은 판 몇 장 (그림 없이 빛만 받는다)
  const ring = new THREE.Group();
  scene.add(ring);
  const R = small ? 14 : 18;
  const N = small ? 6 : 9;
  const shardMat = new THREE.MeshStandardMaterial({ color: 0xdedcd6, roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide });
  for (let i = 0; i < N; i++) {
    const h = 4 + (i % 3) * 2.2;
    const shard = new THREE.Mesh(new THREE.BoxGeometry(h * 0.55, h, 0.18), shardMat);
    const a = (i / N) * Math.PI * 2;
    shard.position.set(Math.sin(a) * R, Math.sin(a * 2.0) * 2.4, Math.cos(a) * R);
    shard.rotation.set(0.15 * Math.sin(a * 3), a, 0.1 * Math.cos(a * 2));
    ring.add(shard);
  }

  const resize = () => {
    const w = sceneCanvas.clientWidth, h = sceneCanvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 52 : 36;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener("resize", resize);

  const draw = (p, t) => {
    // p: 이 섹션을 지나온 정도 0..1
    ring.rotation.y = p * Math.PI * 1.6 + t * 0.04;
    ring.rotation.x = 0.12;
    stone.rotation.y = p * Math.PI * 1.4 + t * 0.08;
    stone.rotation.x = 0.25 + Math.sin(t * 0.3) * 0.08;
    stone.position.y = 1 + Math.sin(t * 1.1) * 0.35;
    const far = camera.aspect < 1 ? 74 : 56;   // 세로 화면은 더 물러서야 고리가 다 들어온다
    const dist = far - p * 14;
    camera.position.set(Math.sin(p * 0.6) * 6, 7 - p * 6, dist);
    scene.fog.near = dist - 12; scene.fog.far = dist + 26;   // 고리 뒤쪽만 어둠에 묻힌다
    camera.lookAt(0, 1, 0);
    renderer.render(scene, camera);
  };

  if (reduceMotion) {
    draw(0.35, 0);
    THREE.DefaultLoadingManager.onLoad = () => draw(0.35, 0);
    setTimeout(() => draw(0.35, 0), 1200);
  } else {
    let visible = false, prog = 0;
    watchVisible(orbit, (v) => { visible = v; });
    const start = performance.now();
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (!visible) return;
      const r = orbit.getBoundingClientRect();
      const target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      prog += (target - prog) * 0.08;   // 스크롤을 부드럽게 따라간다
      draw(prog, (now - start) / 1000);
    };
    requestAnimationFrame(tick);
  }
}

// ── 3. 작업: 분류 탭 + 큰 이름 줄 ──────────────────────────────
// 줄에 마우스를 올리면 그 작업의 그림(또는 영상)이 마우스를 따라온다.
const CATS = window.SOYO_CATEGORIES || [];
const WORKS = window.SOYO_WORKS || [];
const catLabel = Object.fromEntries(CATS.map((c) => [c.id, c.label]));
const tabs = document.querySelector(".tabs");
const list = document.querySelector(".app-list");

function renderWorks(cat) {
  const items = cat === "all" ? WORKS : WORKS.filter((w) => w.cat === cat);
  list.innerHTML = "";
  items.forEach((w) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = w.href || "#";
    if (/^https?:/.test(a.getAttribute("href"))) { a.target = "_blank"; a.rel = "noopener"; }
    if (w.shot) a.dataset.shot = w.shot;
    if (w.video) a.dataset.video = w.video;
    const name = document.createElement("span"); name.className = "app-name"; name.textContent = w.name;
    const kind = document.createElement("span"); kind.className = "app-kind"; kind.textContent = catLabel[w.cat] || "";
    const meta = document.createElement("span"); meta.className = "app-meta"; meta.innerText = w.meta || "";
    a.append(name, kind, meta);
    li.append(a);
    list.append(li);
    if (!reduceMotion) { li.classList.add("reveal"); requestAnimationFrame(() => requestAnimationFrame(() => li.classList.add("in"))); }
  });
  tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
}
if (tabs && list) {
  CATS.forEach((c) => {
    const n = c.id === "all" ? WORKS.length : WORKS.filter((w) => w.cat === c.id).length;
    const b = document.createElement("button");
    b.type = "button"; b.dataset.cat = c.id;
    b.innerHTML = `${c.label}<sup>${n}</sup>`;
    b.addEventListener("click", () => renderWorks(c.id));
    tabs.append(b);
  });
  renderWorks("all");
}

const follow = document.querySelector(".follow");
if (follow && list && !reduceMotion) {
  // 영상 작업이면 그림 대신 소리 없는 영상을 띄운다
  const vid = document.createElement("video");
  vid.className = "follow"; vid.muted = true; vid.loop = true; vid.playsInline = true; vid.setAttribute("aria-hidden", "true");
  follow.after(vid);
  let x = 0, y = 0, fx = 0, fy = 0, cur = null;
  const show = (a, e) => {
    cur = a.dataset.video ? vid : follow;
    if (a.dataset.video) { vid.src = a.dataset.video; vid.play().catch(() => {}); } else if (a.dataset.shot) follow.src = a.dataset.shot; else { cur = null; return; }
    cur.classList.add("on");
    fx = x = e.clientX; fy = y = e.clientY;
  };
  const hide = () => { follow.classList.remove("on"); vid.classList.remove("on"); vid.pause(); cur = null; };
  list.addEventListener("pointerover", (e) => {
    const a = e.target.closest("a");
    if (!a || e.pointerType !== "mouse" || (cur && a.contains(e.relatedTarget))) return;
    show(a, e);
  });
  list.addEventListener("pointerout", (e) => { const a = e.target.closest("a"); if (a && !a.contains(e.relatedTarget)) hide(); });
  list.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; });
  const loop = () => {
    requestAnimationFrame(loop);
    if (!cur) return;
    fx += (x - fx) * 0.14; fy += (y - fy) * 0.14;
    const tilt = Math.max(-12, Math.min(12, (x - fx) * 0.25));
    cur.style.transform = `translate3d(${fx + 28}px, ${fy - 230}px, 0) rotate(${tilt}deg)`;
  };
  requestAnimationFrame(loop);
}

// ── 메뉴 ─────────────────────────────────────────────────────
const btn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");
if (btn && menu) {
  const set = (open) => {
    btn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) menu.querySelector("a")?.focus();
  };
  btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { set(false); btn.focus(); } });
}

// ── 들어올 때 떠오르기 ──────────────────────────────────────────
if (!reduceMotion) {
  const items = document.querySelectorAll(".mail, .facts");
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.15 });
  items.forEach((el, i) => { el.classList.add("reveal"); el.style.transitionDelay = `${(i % 3) * 60}ms`; io.observe(el); });
}
