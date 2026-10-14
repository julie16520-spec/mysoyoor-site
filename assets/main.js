// 소요 홈페이지: 칸칸 고양이를 도트 그대로 입체로 세워 글자로 그린다 (aino.agency 식 글자 그림).
// 도트 한 칸 = 정육면체 하나. 면마다 점을 뿌려 화면 칸에 투영하고, 가까운 점만 남겨(z-buffer)
// 밝기에 따라 글자를 고른다. 밝은 바탕에 먹색 글자라 어두울수록 빽빽한 글자.

const CAT = [
  ".kk......kk.",
  ".knk....knk.",
  ".kggkkkkggk.",
  "kgggdggdgggk",
  "kgkggggggkgk",
  "kggggnnggggk",
  ".kgggwwgggk.",
  "..kkkkkkkk..",
  "..kgdggdggk.",
  ".kggwwwwggk.",
  ".kgdwwwwdgkk",
  ".kgggggggkdk",
  ".kwwkkkkwwk.",
  "..kk....kk..",
];
// 도트 색 → 바탕 밝기 (1 = 흰색)
const ALBEDO = { k: 0.06, d: 0.34, g: 0.58, n: 0.78, w: 0.97 };
// 밝은 → 어두운
const RAMP = " ·:-/+=<>!?I3594A8O0N";
const DEPTH = 3;   // 도트 두께 (칸)

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 도트 → 겉면 점들 (위치, 법선, 밝기). 안쪽 면은 건너뛴다. */
function buildPoints(rows, depth, step) {
  const h = rows.length, w = rows[0].length;
  const filled = (x, y, z) => y >= 0 && y < h && x >= 0 && x < w && z >= 0 && z < depth && rows[y][x] !== ".";
  const pts = [];
  const faces = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  ];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = rows[y][x];
    if (c === ".") continue;
    for (let z = 0; z < depth; z++) {
      for (const [nx, ny, nz] of faces) {
        if (filled(x + nx, y + ny, z + nz)) continue;
        // 면 위에 step×step 점
        for (let i = 0; i < step; i++) for (let j = 0; j < step; j++) {
          const u = (i + 0.5) / step - 0.5, v = (j + 0.5) / step - 0.5;
          let px = x + 0.5 + nx * 0.5, py = y + 0.5 + ny * 0.5, pz = z + 0.5 + nz * 0.5;
          if (nx) { py += u; pz += v; } else if (ny) { px += u; pz += v; } else { px += u; py += v; }
          // 가운데 기준, y는 위가 +
          // 칸마다 가운데가 볼록한 듯 가장자리를 살짝 어둡게 (도트 블록 질감)
          const bulge = 1 - 0.55 * (u * u + v * v) * 2;
          pts.push([px - w / 2, h / 2 - py, pz - depth / 2, nx, -ny, nz, (ALBEDO[c] ?? 0.5) * bulge]);
        }
      }
    }
  }
  return pts;
}

function makeRenderer(pre) {
  let pts = [], cols = 0, rows = 0, zbuf, lum;
  const light = norm([-0.45, 0.6, 0.9]);

  function resize() {
    // 글자 한 칸 크기를 재서 화면을 채우는 칸 수를 정한다
    const probe = document.createElement("span");
    probe.textContent = "M".repeat(10);
    pre.appendChild(probe);
    const r = probe.getBoundingClientRect();
    pre.removeChild(probe);
    const cw = r.width / 10, ch = r.height;
    const box = pre.parentElement.getBoundingClientRect();
    cols = Math.max(20, Math.floor(box.width / cw));
    rows = Math.max(12, Math.floor(box.height / ch));
    zbuf = new Float32Array(cols * rows);
    lum = new Float32Array(cols * rows);
    const a = ch / cw;   // 글자 칸이 세로로 긴 비율
    // 도트 한 칸이 화면에서 몇 글자인지에 맞춰 면마다 점을 촘촘히 (구멍 없게)
    const cell = Math.min(cols / 22, (rows * a) / 22) * 1.4;
    pts = buildPoints(CAT, DEPTH, Math.min(14, Math.max(2, Math.ceil(cell * 1.6))));
    return a;
  }
  let aspect = resize();

  function frame(yaw, pitch, bob, scaleMul) {
    zbuf.fill(-1e9); lum.fill(-1);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const scale = Math.min(cols / 22, (rows * aspect) / 22) * scaleMul;
    const ox = cols / 2, oy = rows / 2;
    for (const p of pts) {
      // y축 회전 → x축 회전
      let x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy, y = p[1] + bob;
      let y2 = y * cp - z * sp; z = y * sp + z * cp; y = y2;
      let nx = p[3] * cy + p[5] * sy, nz = -p[3] * sy + p[5] * cy, ny = p[4];
      let ny2 = ny * cp - nz * sp; nz = ny * sp + nz * cp; ny = ny2;
      if (nz < -0.05) continue;   // 뒤를 보는 면
      const persp = 1 / (1 - z * 0.025);
      const sx = Math.round(ox + x * scale * persp);
      const syy = Math.round(oy - (y * scale * persp) / aspect);
      if (sx < 0 || sx >= cols || syy < 0 || syy >= rows) continue;
      const i = syy * cols + sx;
      if (z <= zbuf[i]) continue;
      zbuf[i] = z;
      const diff = Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
      lum[i] = p[6] * (0.35 + 0.75 * diff);
    }
    let out = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const l = lum[r * cols + c];
        if (l < 0) { out += " "; continue; }
        const t = 1 - Math.min(1, Math.max(0, l));   // 어두울수록 1
        out += RAMP[Math.max(1, Math.round(t * (RAMP.length - 1)))];
      }
      out += "\n";
    }
    pre.textContent = out;
  }
  return { frame, resize: () => (aspect = resize()) };
}

function norm(v) { const l = Math.hypot(...v); return v.map((x) => x / l); }

// ── 첫 화면 고양이 ───────────────────────────────────────────
const heroPre = document.getElementById("cat");
if (heroPre) {
  const r = makeRenderer(heroPre);
  let mouseX = 0, mouseY = 0, scrollT = 0;
  addEventListener("pointermove", (e) => {
    mouseX = e.clientX / innerWidth - 0.5;
    mouseY = e.clientY / innerHeight - 0.5;
  }, { passive: true });
  addEventListener("scroll", () => { scrollT = scrollY / innerHeight; }, { passive: true });
  addEventListener("resize", () => { r.resize(); if (reduceMotion) still(); });
  // 글꼴이 늦게 오면 글자 폭이 바뀐다: 다 받은 뒤 칸 수를 다시 잰다
  document.fonts?.ready.then(() => { r.resize(); if (reduceMotion) still(); });

  const still = () => r.frame(-0.5, 0.12, 0, 1);
  if (reduceMotion) still();
  else {
    let last = 0;
    const tick = (now) => {
      if (now - last > 40) {   // 25fps면 충분하다
        last = now;
        const t = now / 1000;
        const yaw = Math.sin(t * 0.45) * 0.9 + scrollT * 2.4 + mouseX * 0.8;
        const pitch = 0.12 + mouseY * 0.5 + scrollT * 0.3;
        const bob = Math.sin(t * 2.2) * 0.25;
        r.frame(yaw, pitch, bob, 1 + scrollT * 0.35);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

// ── 앱 목록: 줄에 올리면 아이콘이 글자 그림으로 뜬다 ─────────────
const tip = document.getElementById("tip");
const asciiCache = new Map();
function iconToAscii(src, w, h) {
  if (asciiCache.has(src)) return Promise.resolve(asciiCache.get(src));
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const g = cv.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data;
      let out = "";
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
          out += RAMP[Math.round((1 - l) * (RAMP.length - 1))];
        }
        out += "\n";
      }
      asciiCache.set(src, out);
      resolve(out);
    };
    img.src = src;
  });
}
if (tip) {   // 마우스가 있을 때만 의미가 있다 (터치에선 누르는 순간 페이지가 넘어간다)
  document.querySelectorAll("[data-icon]").forEach((row) => {
    row.addEventListener("pointerenter", async (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      tip.textContent = await iconToAscii(row.dataset.icon, 40, 20);
      tip.classList.add("on");
    });
    row.addEventListener("pointerleave", () => tip.classList.remove("on"));
    row.addEventListener("pointermove", (e) => {
      tip.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 80}px)`;
    });
  });
}
