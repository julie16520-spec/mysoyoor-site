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
  let W, H, DPR, cell, cols, rows, ox, oy, cells, mines, raf = 0, start = 0, pressed = -1, boom = -1, visible = true;

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
    cell = Math.floor(Math.min(W / (textW + 3), H / (textH + 6), 64));
    cell = Math.max(cell, 22);
    cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
    ox = Math.floor((W - cols * cell) / 2); oy = Math.floor((H - rows * cell) / 2);
    // 지뢰 = 글자 칸
    mines = new Uint8Array(cols * rows);
    const gx = Math.floor((cols - textW) / 2), gy = Math.floor((rows - textH) / 2);
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

  // 시간표: 칸이 위에서부터 깔림 → 가운데 아래쪽 빈 칸을 눌러 번져 열림 → 남은 안전 칸 열림 → 깃발
  function plan() {
    const T0 = 0, DROP = 420, CLICK = 650, STEP = 26;
    cells.forEach((c) => { c.drop = T0 + c.y * (DROP / rows) + (c.x % 3) * 12; });
    // 첫 클릭: 글자 아래쪽 가운데의 빈(0) 칸
    let seed = cells.find((c) => !c.mine && c.n === 0 && c.y > rows * 0.72 && Math.abs(c.x - cols / 2) < 2) || cells.find((c) => !c.mine && c.n === 0);
    const dist = new Map([[idx(seed.x, seed.y), 0]]);
    const q = [seed];
    while (q.length) {   // 진짜 지뢰찾기처럼: 0이면 이웃을 계속 연다
      const c = q.shift(), d = dist.get(idx(c.x, c.y));
      c.open = CLICK + d * STEP;
      if (c.n !== 0) continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = c.x + dx, ny = c.y + dy, k = idx(nx, ny);
        if (!inside(nx, ny) || dist.has(k) || cells[k].mine) continue;
        dist.set(k, d + 1); q.push(cells[k]);
      }
    }
    let last = Math.max(...[...dist.values()]) * STEP + CLICK;
    // 덜 열린 안전 칸(글자 사이 구멍 등)은 가까운 순서로 마저 연다
    cells.filter((c) => !c.mine && c.open === Infinity).forEach((c, i) => { c.open = last + 60 + i * 18; });
    last = Math.max(last, ...cells.filter((c) => !c.mine).map((c) => c.open));
    // 깃발: 글자 순서대로 하나씩
    cells.filter((c) => c.mine).sort((a, b) => a.x - b.x || a.y - b.y).forEach((c, i) => { c.flag = last + 180 + i * 22; });
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
  function flag(px, py, s, k) {
    const u = s / 16, cx = px + s / 2;
    g.save(); g.translate(cx, py + s * 0.82); g.scale(k, k); g.translate(-cx, -(py + s * 0.82));
    g.fillStyle = "#000"; g.fillRect(cx - 4 * u, py + 11 * u, 8 * u, 2 * u); g.fillRect(cx - 2 * u, py + 10 * u, 4 * u, 1 * u); g.fillRect(cx, py + 4 * u, 1.2 * u, 7 * u);
    g.fillStyle = "#e0251b"; g.beginPath(); g.moveTo(cx + 1.2 * u, py + 3 * u); g.lineTo(cx - 5 * u, py + 5.5 * u); g.lineTo(cx + 1.2 * u, py + 8 * u); g.fill();
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
  boardEl.addEventListener("pointerdown", (e) => {
    const k = cellAt(e);
    if (k >= 0 && coveredNow(cells[k])) { pressed = k; kick(); }
  });
  boardEl.addEventListener("pointerleave", () => { if (pressed >= 0) { pressed = -1; kick(); } });
  boardEl.addEventListener("pointerup", (e) => {
    const k = cellAt(e);
    pressed = -1;
    if (k >= 0 && cells[k].mine) {   // 깃발 칸: 지뢰가 잠깐 터지고 돌아온다
      boom = k; kick();
      setTimeout(() => { boom = -1; kick(); }, 900);
      return;
    }
    kick();
    document.getElementById("works").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
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
      const img = document.createElement("img");
      img.className = "thumb"; img.alt = ""; img.loading = "lazy"; if (w.thumb || w.shot) img.src = w.thumb || w.shot;
      const name = document.createElement("span"); name.className = "name"; name.textContent = w.name;
      const kind = document.createElement("span"); kind.className = "kind"; kind.textContent = label[w.cat] || "";
      const meta = document.createElement("span"); meta.className = "meta"; meta.innerText = w.meta || "";
      a.append(img, name, kind, meta);
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
      b.addEventListener("click", () => render(c.id));
      tabs.append(b);
    });
    render("all");
  }

  // 줄에 마우스를 올리면 그 작업 그림(또는 영상)이 따라온다
  const follow = document.querySelector(".follow");
  if (follow && list && !reduceMotion) {
    const vid = document.createElement("video");
    vid.className = "follow"; vid.muted = true; vid.loop = true; vid.playsInline = true; vid.setAttribute("aria-hidden", "true");
    follow.after(vid);
    let x = 0, y = 0, fx = 0, fy = 0, cur = null;
    list.addEventListener("pointerover", (e) => {
      const a = e.target.closest("a");
      if (!a || e.pointerType !== "mouse" || (cur && a.contains(e.relatedTarget))) return;
      if (a.dataset.video) { cur = vid; vid.src = a.dataset.video; vid.play().catch(() => {}); }
      else if (a.dataset.shot) { cur = follow; follow.src = a.dataset.shot; }
      else return;
      cur.classList.add("on"); fx = x = e.clientX; fy = y = e.clientY;
    });
    list.addEventListener("pointerout", (e) => {
      const a = e.target.closest("a");
      if (a && !a.contains(e.relatedTarget)) { follow.classList.remove("on"); vid.classList.remove("on"); vid.pause(); cur = null; }
    });
    list.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; });
    const loop = () => {
      requestAnimationFrame(loop);
      if (!cur) return;
      fx += (x - fx) * 0.14; fy += (y - fy) * 0.14;
      cur.style.transform = `translate3d(${fx + 28}px, ${fy - 230}px, 0) rotate(${Math.max(-10, Math.min(10, (x - fx) * 0.25))}deg)`;
    };
    requestAnimationFrame(loop);
  }
})();
