// 소요 홈페이지
// 1) 첫 화면: 회색 지뢰찾기 판. 칸이 떨어져 깔리고, 아래쪽을 "누른" 것처럼 빈 칸이 번져 열린 뒤
//    지뢰 자리마다 깃발이 꽂혀 SOYO 가 된다. 지뢰 자리 = SOYO 글자 칸이라 숫자도 진짜 지뢰찾기처럼 맞는다.
//    움직임은 처음 한 번만. 그 아래로는 평범하게 스크롤되는 작업 목록 (aino.agency 형식).
// 2) 판을 누르면 목록으로 내려간다. 깃발 칸을 누르면 지뢰가 터진다.
// 3) 머리줄의 웃는 얼굴로 판을 처음부터 다시 볼 수 있다.
(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NUM = ["", "#0000ff", "#007b00", "#ff0000", "#00007b", "#7b0000", "#007b7b", "#000000", "#7b7b7b"];
  const FONT = {
    S: [".####", "#....", ".###.", "....#", "####."],
    O: [".###.", "#...#", "#...#", "#...#", ".###."],
    Y: ["#...#", ".#.#.", "..#..", "..#..", "..#.."],
  };

  // ── 판 ──────────────────────────────────────────────────
  const boardEl = document.getElementById("board");
  const cv = boardEl.querySelector("canvas");
  const g = cv.getContext("2d");
  let W, H, DPR, cell, cols, rows, ox, oy, cells, mines, textBox, raf = 0, start = 0, pressed = -1, hover = -1, boom = -1, visible = true;

  const idx = (x, y) => y * cols + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows;

  function layout() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = boardEl.clientWidth; H = boardEl.clientHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const wide = W >= 640;
    // 글자 판: 넓으면 SOYO 한 줄(23칸), 좁으면 SO / YO 두 줄(11칸)
    const textW = wide ? 23 : 11, textH = wide ? 5 : 11;
    cell = Math.floor(Math.min((W * 0.76) / textW, (H * 0.6) / textH, 84));
    cell = Math.max(cell, 20);
    cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
    ox = Math.floor((W - cols * cell) / 2); oy = Math.floor((H - rows * cell) / 2);
    // 지뢰 = 글자 칸
    mines = new Uint8Array(cols * rows);
    const gx = Math.floor((cols - textW) / 2), gy = Math.floor((rows - textH) / 2);
    textBox = { x0: gx, y0: gy, x1: gx + textW - 1, y1: gy + textH - 1 };
    const place = (ch, px, py) => FONT[ch].forEach((r, y) => [...r].forEach((c, x) => { if (c === "#" && inside(px + x, py + y)) mines[idx(px + x, py + y)] = 1; }));
    if (wide) ["S", "O", "Y", "O"].forEach((ch, i) => place(ch, gx + i * 6, gy));
    else { place("S", gx, gy); place("O", gx + 6, gy); place("Y", gx, gy + 6); place("O", gx + 6, gy + 6); }
    cells = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && inside(x + dx, y + dy) && mines[idx(x + dx, y + dy)]) n++;
      cells.push({ x, y, n, mine: !!mines[idx(x, y)], drop: 0, open: Infinity, flag: Infinity });
    }
    plan();
  }

  // 시간표: 칸이 위에서부터 깔림 → 글자 아래쪽 한 칸을 "눌러" 둘레 구역이 물결처럼 열림 → 지뢰 자리에 깃발
  //  열리는 구역은 글자 둘레 타원 + 들쭉날쭉한 가장자리. 바깥은 덮인 채로 남아 한창 하던 판처럼 보인다
  function inRegion(x, y) {
    const cx = (textBox.x0 + textBox.x1) / 2, cy = (textBox.y0 + textBox.y1) / 2;
    const rx = (textBox.x1 - textBox.x0) / 2 + 2.6, ry = (textBox.y1 - textBox.y0) / 2 + 2.2;
    const wob = 0.18 * Math.sin(x * 1.9 + y * 0.7) + 0.12 * Math.cos(y * 2.3 - x * 1.1);
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 + wob;
  }
  function plan() {
    const DROP = 420, CLICK = 640, STEP = 34;
    cells.forEach((c) => { c.drop = c.y * (DROP / rows) + (c.x % 3) * 12; c.open = Infinity; c.flag = Infinity; });
    const seed = { x: Math.round((textBox.x0 + textBox.x1) / 2), y: textBox.y1 + 2 };
    cells.forEach((c) => {
      if (c.mine || !inRegion(c.x, c.y)) return;
      c.open = CLICK + Math.hypot(c.x - seed.x, (c.y - seed.y) * 1.15) * STEP;
    });
    const last = Math.max(...cells.filter((c) => c.open !== Infinity).map((c) => c.open));
    cells.filter((c) => c.mine).sort((a, b) => a.x - b.x || a.y - b.y).forEach((c, i) => { c.flag = last + 200 + i * 24; });
    if (reduceMotion) cells.forEach((c) => { c.drop = -1; if (c.open !== Infinity) c.open = -1; if (c.flag !== Infinity) c.flag = -1; });
  }

  // ── 그리기 ───────────────────────────────────────────────
  function tile(px, py, s, sunk) {
    const b = Math.max(2, Math.round(s / 14));
    g.fillStyle = "#c0c0c0"; g.fillRect(px, py, s, s);
    g.fillStyle = sunk ? "#7b7b7b" : "#ffffff";
    g.fillRect(px, py, s, b); g.fillRect(px, py, b, s);
    g.fillStyle = sunk ? "#ffffff" : "#7b7b7b";
    g.fillRect(px, py + s - b, s, b); g.fillRect(px + s - b, py, b, s);
  }
  function openCell(px, py, s) {
    g.fillStyle = "#bdbdbd"; g.fillRect(px, py, s, s);
    g.fillStyle = "#7b7b7b"; g.fillRect(px, py, s, 1); g.fillRect(px, py, 1, s);
  }
  const FLAG = [
    "......##....",
    "....####....",
    "..######....",
    "....####....",
    "......##....",
    ".......#....",
    ".......#....",
    ".....####...",
    "...########.",
  ];
  function flag(px, py, s, k) {
    const u = (s * 0.66) / 12;   // 칸 크기에 맞춰 (작은 화면에서도 깃발로 보이게)
    const w = 12 * u, h = 9 * u, fx = Math.round(px + (s - w) / 2), fy = Math.round(py + (s - h) / 2);
    g.save();
    g.translate(px + s / 2, py + s * 0.78); g.scale(k, k); g.translate(-(px + s / 2), -(py + s * 0.78));
    FLAG.forEach((row, y) => [...row].forEach((c, x) => {
      if (c !== "#") return;
      g.fillStyle = y <= 4 && x <= 7 ? "#e0251b" : "#000";
      g.fillRect(fx + x * u, fy + y * u, u, u);
    }));
    g.restore();
  }
  function mine(px, py, s) {
    const c = s / 2, r = s * 0.24;
    g.fillStyle = "#e0251b"; g.fillRect(px, py, s, s);
    g.fillStyle = "#000"; g.beginPath(); g.arc(px + c, py + c, r, 0, 7); g.fill();
    g.fillRect(px + c - r * 1.5, py + c - 1, r * 3, 2); g.fillRect(px + c - 1, py + c - r * 1.5, 2, r * 3);
    g.fillStyle = "#fff"; g.fillRect(px + c - r * .45, py + c - r * .45, r * .4, r * .4);
  }
  const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

  function draw(now) {
    const t = now - start;
    g.clearRect(0, 0, W, H);
    let busy = false;
    const fontPx = Math.round(cell * 0.62);
    g.font = `900 ${fontPx}px "Pretendard Variable", sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const px = ox + c.x * cell, py = oy + c.y * cell;
      // 처음 깔릴 때: 위에서 살짝 떨어지며 나타남
      const d = (t - c.drop) / 260;
      if (d < 0) { busy = true; continue; }
      const dropY = d < 1 ? (1 - ease(d)) * -cell * 0.6 : 0;
      if (d < 1) busy = true;
      g.save();
      g.globalAlpha = Math.min(1, d * 1.6);
      g.translate(0, dropY);
      const o = (t - c.open) / 140;
      if (i === boom) mine(px, py, cell);
      else if (o >= 0 && !c.mine) {
        openCell(px, py, cell);
        if (o < 1) { busy = true; g.globalAlpha *= ease(o); }
        if (c.n) { g.fillStyle = NUM[c.n]; g.fillText(String(c.n), px + cell / 2, py + cell / 2 + 1); }
      } else {
        tile(px, py, cell, i === pressed);
        if (i === hover && i !== pressed) { g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(px, py, cell, cell); }
        const f = (t - c.flag) / 220;
        if (f >= 0) { const k = f < 1 ? 1 + Math.sin(f * Math.PI) * 0.35 : 1; if (f < 1) busy = true; flag(px, py, cell, Math.min(1, f * 3) * k); }
        else if (c.flag !== Infinity) busy = true;
      }
      g.restore();
      if (o < 0 && c.open !== Infinity) busy = true;
    }
    raf = busy && visible ? requestAnimationFrame(draw) : 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

  // ── 누르기 ───────────────────────────────────────────────
  const cellAt = (e) => {
    const r = boardEl.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left - ox) / cell), y = Math.floor((e.clientY - r.top - oy) / cell);
    return inside(x, y) ? idx(x, y) : -1;
  };
  const coveredNow = (c) => c.mine || performance.now() - start < c.open;
  boardEl.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const k = cellAt(e);
    const h = k >= 0 && coveredNow(cells[k]) ? k : -1;
    if (h !== hover) { hover = h; kick(); }
  });
  boardEl.addEventListener("pointerdown", (e) => {
    const k = cellAt(e);
    if (k >= 0 && coveredNow(cells[k])) { pressed = k; kick(); }
  });
  boardEl.addEventListener("pointerleave", () => { hover = -1; pressed = -1; kick(); });
  boardEl.addEventListener("pointerup", (e) => {
    const k = cellAt(e);
    pressed = -1;
    if (k < 0) return kick();
    const c = cells[k], now = performance.now() - start;
    if (c.mine) {   // 깃발 칸: 지뢰가 잠깐 터지고 돌아온다
      boom = k; kick();
      setTimeout(() => { boom = -1; kick(); }, 900);
      return;
    }
    if (now >= c.open) return kick();
    // 진짜 지뢰찾기처럼: 0 이면 이웃까지 번져 연다
    const q = [c], seen = new Set([k]);
    c.open = now;
    while (q.length) {
      const d = q.shift();
      if (d.n !== 0) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = d.x + dx, ny = d.y + dy, nk = idx(nx, ny);
        if (!inside(nx, ny) || seen.has(nk) || cells[nk].mine || now >= cells[nk].open) continue;
        seen.add(nk);
        cells[nk].open = now + Math.hypot(nx - c.x, ny - c.y) * 30;
        q.push(cells[nk]);
      }
    }
    kick();
  });

  function replay() {
    boom = -1; pressed = -1;
    layout();
    start = performance.now();
    cancelAnimationFrame(raf); raf = 0; kick();
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(boardEl);
  let lastW = 0;
  addEventListener("resize", () => {
    if (Math.abs(innerWidth - lastW) < 2) return;   // 폰 주소창이 접혀 높이만 바뀔 땐 다시 깔지 않는다
    lastW = innerWidth;
    layout(); start = performance.now() - 1e6; kick();   // 크기만 바뀌면 다 열린 상태로 바로 그린다
  });
  lastW = innerWidth;
  layout(); start = performance.now(); kick();

  // ── 얼굴 버튼 (도트로 그린 웃는 얼굴) ──────────────────────────
  const faceBtn = document.querySelector(".face");
  if (faceBtn) {
    const f = faceBtn.querySelector("canvas").getContext("2d");
    const FACE = [
      "....kkkkkkk.....", "...kyyyyyyyk....", "..kyyyyyyyyyk...", ".kyyyyyyyyyyyk..", ".kyyykyyykyyyk..", "kyyyykyyykyyyyk.",
      "kyyyyyyyyyyyyyk.", "kyyyyyyyyyyyyyk.", "kyykyyyyyyykyyk.", "kyyykyyyyykyyyk.", ".kyyykkkkkyyyk..", ".kyyyyyyyyyyyk..",
      "..kyyyyyyyyyk...", "...kyyyyyyyk....", "....kkkkkkk.....", "................",
    ];
    FACE.forEach((r, y) => [...r].forEach((c, x) => { if (c !== ".") { f.fillStyle = c === "k" ? "#000" : "#ffff00"; f.fillRect(x, y, 1, 1); } }));
    faceBtn.addEventListener("click", () => {
      scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      replay();
    });
  }

  // ── 작업 목록 ────────────────────────────────────────────────
  const CATS = window.SOYO_CATEGORIES || [];
  const WORKS = window.SOYO_WORKS || [];
  const label = Object.fromEntries(CATS.map((c) => [c.id, c.label]));
  const tabs = document.querySelector(".tabs");
  const list = document.querySelector(".index");

  function render(cat) {
    const items = cat === "all" ? WORKS : WORKS.filter((w) => w.cat === cat);
    list.innerHTML = "";
    items.forEach((w, i) => {
      const li = document.createElement("li");
      li.style.setProperty("--i", i);
      const a = document.createElement("a");
      a.href = w.href || "#";
      if (/^https?:/.test(a.getAttribute("href"))) { a.target = "_blank"; a.rel = "noopener"; }
      if (w.shot) a.dataset.shot = w.shot;
      if (w.video) a.dataset.video = w.video;
      const txt = document.createElement("span"); txt.className = "txt";
      const name = document.createElement("span"); name.className = "name"; name.textContent = w.name;
      const row2 = document.createElement("span"); row2.className = "row2";
      const kind = document.createElement("span"); kind.className = "kind"; kind.textContent = label[w.cat] || "";
      const meta = document.createElement("span"); meta.textContent = (w.meta || "").replace(/\n/g, ", ");
      row2.append(kind, meta); txt.append(name, row2);
      const pic = document.createElement("span"); pic.className = "pic";
      if (w.video) { const v = document.createElement("video"); v.src = w.video; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = !reduceMotion; pic.append(v); }
      else if (w.shot) { const img = document.createElement("img"); img.src = w.shot; img.alt = w.name; img.loading = "lazy"; pic.append(img); }
      a.append(txt, pic);
      li.append(a); list.append(li);
    });
    tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
  }
  if (tabs && list) {
    CATS.forEach((c) => {
      const n = c.id === "all" ? WORKS.length : WORKS.filter((w) => w.cat === c.id).length;
      const b = document.createElement("button");
      b.type = "button"; b.dataset.cat = c.id;
      b.innerHTML = `${c.label}<sup>${n}</sup>`;
      if (n === 0) b.disabled = true;   // 아직 없는 분류는 비워 둔다
      b.addEventListener("click", () => render(c.id));
      tabs.append(b);
    });
    render("all");
  }

})();
