// 첫 화면: 화면 너비를 꽉 채운 'SOYO' 를 아래 끝에서 잘리게 찍고, 망점으로 그린다.
// 점 크기는 그 칸을 글자가 덮는 만큼(면적 비례). 처음엔 흩어진 점이 제자리로 날아와 찍히고,
// 커서를 대면 용수철처럼 비켜나며 따뜻한 색으로 물들고, 누르면 충격파가 퍼진다.
// (사용자가 준 Halftone Wordmark Footer 를 React 없이 옮김)
(() => {
  const root = document.querySelector(".hwf");
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WORD = "SOYO", RADIUS = 80, CROP = .2;
  const hex = h => { h = h.trim().replace("#", ""); if (h.length === 3) h = [...h].map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const css = getComputedStyle(document.documentElement);
  const bg = css.getPropertyValue("--bg").trim(), inkS = css.getPropertyValue("--ink").trim();
  const ink = hex(inkS), warm = hex(css.getPropertyValue("--warm").trim());

  // 인쇄 그레인 타일 한 장. 페이지 전체(body::after)에 깔린다
  const tile = document.createElement("canvas");
  tile.width = tile.height = 256;
  const tg = tile.getContext("2d"), id = tg.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { id.data[i] = id.data[i + 1] = id.data[i + 2] = Math.random() * 255; id.data[i + 3] = Math.random() < .5 ? 0 : 255; }
  tg.putImageData(id, 0, 0);
  document.documentElement.style.setProperty("--grain", `url(${tile.toDataURL()})`);

  let t0 = 0, w = 0, h = 0, dpr = 1, px = -1e5, py = -1e5, raf = 0, awake = true, visible = true, first = true;
  let ring = { x: 0, y: 0, t: -1 }, dots = new Float32Array(0), count = 0;

  function layout() {
    const r = root.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const gap = w < 600 ? 4 : 6;

    const mask = document.createElement("canvas");
    mask.width = w; mask.height = h;
    const m = mask.getContext("2d", { willReadFrequently: true });
    const face = size => `800 ${size}px ${css.getPropertyValue("--sans")}`;
    m.font = face(100);
    const fit = (w * 1.02) / m.measureText(WORD).width * 100;
    m.font = face(fit);
    const box = m.measureText(WORD);
    m.fillText(WORD, (w - box.width) / 2, h + (box.actualBoundingBoxAscent || fit * .72) * CROP);
    const img = m.getImageData(0, 0, w, h).data;

    const tmp = [];
    for (let gy = 0; gy < Math.ceil(h / gap); gy++) for (let gx = 0; gx < Math.ceil(w / gap); gx++) {
      let sum = 0;
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
        const x = Math.min(w - 1, Math.floor(gx * gap + (sx + .5) * gap / 3));
        const y = Math.min(h - 1, Math.floor(gy * gap + (sy + .5) * gap / 3));
        sum += img[(y * w + x) * 4 + 3];
      }
      const cov = sum / (9 * 255);
      if (cov < .06) continue;
      const hx = gx * gap + gap / 2, hy = gy * gap + gap / 2;
      // 처음 한 번은 화면 아무 데서나 출발해 제자리로 날아온다
      const sx = first && !reduced ? Math.random() * w : hx, sy = first && !reduced ? Math.random() * h * .9 : hy;
      tmp.push(sx, sy, 0, 0, hx, hy, Math.sqrt(cov) * gap * .56);
    }
    if (first) t0 = performance.now();
    first = false;
    dots = new Float32Array(tmp); count = tmp.length / 7; awake = true;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // 처음 2초는 용수철을 느슨하게: 흩어진 점이 천천히 모여든다
    const settle = Math.min(1, (now - t0) / 2600), K = .004 + .046 * settle, D = .93 - .09 * settle;
    const age = ring.t < 0 ? 1e9 : now - ring.t, ringR = age * .9;
    let moving = false;
    for (let i = 0; i < count; i++) {
      const j = i * 7;
      let x = dots[j], y = dots[j + 1], vx = dots[j + 2], vy = dots[j + 3];
      const hx = dots[j + 4], hy = dots[j + 5];
      if (age < 900) {
        const dx = hx - ring.x, dy = hy - ring.y, d = Math.hypot(dx, dy) + .001;
        const band = 1 - Math.min(1, Math.abs(d - ringR) / 26);
        if (band > 0) { const f = band * 3.2 * (1 - age / 900); vx += dx / d * f; vy += dy / d * f; }
      }
      const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
      if (d2 < RADIUS * RADIUS) { const d = Math.sqrt(d2) + .001, f = (1 - d / RADIUS) * 2.6; vx += dx / d * f; vy += dy / d * f; }
      vx = (vx + (hx - x) * K) * D; vy = (vy + (hy - y) * K) * D;
      x += vx; y += vy;
      if (Math.abs(vx) + Math.abs(vy) > .02 || Math.abs(x - hx) + Math.abs(y - hy) > .05) moving = true;
      else { x = hx; y = hy; vx = vy = 0; }
      dots[j] = x; dots[j + 1] = y; dots[j + 2] = vx; dots[j + 3] = vy;
      const k = Math.min(1, Math.hypot(x - hx, y - hy) / 28);
      ctx.fillStyle = k > .02 ? `rgb(${ink.map((c, n) => Math.round(c + (warm[n] - c) * k))})` : inkS;
      ctx.beginPath(); ctx.arc(x, y, dots[j + 6], 0, 6.2832); ctx.fill();
    }
    awake = moving || age < 900 || px > -1e4;
  }

  const loop = now => { raf = 0; if (!visible) return; draw(now); if (awake) raf = requestAnimationFrame(loop); };
  const wake = () => { awake = true; if (!raf && visible) raf = requestAnimationFrame(loop); };
  const local = e => { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };

  if (!reduced) {
    root.addEventListener("pointermove", e => { [px, py] = local(e); wake(); });
    root.addEventListener("pointerleave", () => { px = py = -1e5; wake(); });
    root.addEventListener("pointerdown", e => { if (e.target.closest("a,button")) return; const [x, y] = local(e); ring = { x, y, t: performance.now() }; wake(); });
  }
  // 글꼴이 와야 글자 모양이 맞으니 그다음에 찍는다. 크기가 바뀌면 다시
  let ready = false, size = "";
  const relayout = () => { const s = root.offsetWidth + "x" + root.offsetHeight; if (s === size) return; size = s; layout(); wake(); };
  const go = () => { ready = true; relayout(); };
  document.fonts.load(`800 100px "Pretendard Variable"`, WORD).then(go, go);
  new ResizeObserver(() => { if (ready) relayout(); }).observe(root);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) wake(); }).observe(root);
})();
