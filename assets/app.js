// 첫 화면: 손은 막 뒤에서 숨 쉬듯 다가왔다 멀어진다. 커서가 가까우면 다가와 막에 붙고, 꾹 누르면 손바닥을 막에 민다.
// 누른 채 끌면 막에 손가락으로 쓴 자국이 남았다 사라진다.
// /work 는 같은 화면 위에 흰 목록. 주소는 history 로만 바꾸고, /work 를 바로 열면 GitHub Pages 가 work.html(index.html 복사본)을 준다
(() => {
  const root = document.documentElement.style, still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"), im = g.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); root.setProperty("--grain", `url(${c.toDataURL()})`); }

  const hwf = document.querySelector(".hwf"), listEl = document.querySelector(".list"), tip = document.querySelector(".tip");
  let listOpen = false, hoverNear = false;

  // 손 움직임과 쓰기
  let px = null, py = null, down = false, n = .3, push = 0, dx = 0, dy = 0;
  const ink = document.querySelector(".ink"), ig = ink.getContext("2d");
  let pen = null, sx = 0, sy = 0, inked = 0;
  const fit = () => { const r = devicePixelRatio || 1; ink.width = innerWidth * r; ink.height = innerHeight * r; ig.setTransform(r, 0, 0, r, 0, 0);
    ig.lineCap = ig.lineJoin = "round"; ig.lineWidth = 18; ig.strokeStyle = "#1c1b19"; };
  fit(); addEventListener("resize", fit);
  hwf.addEventListener("pointermove", e => { px = e.clientX; py = e.clientY;
    if (!pen) return;
    // 조금이라도 끌면 누르기(손 밀기) 대신 글씨 쓰기
    if (Math.hypot(px - sx, py - sy) > 6) down = false;
    ig.beginPath(); ig.moveTo(pen.x, pen.y); ig.lineTo(px, py); ig.stroke(); pen = { x: px, y: py }; inked = performance.now(); });
  hwf.addEventListener("pointerdown", e => { if (e.target.closest("a,button") || listOpen) return; px = sx = e.clientX; py = sy = e.clientY; down = true; pen = { x: px, y: py }; });
  addEventListener("pointerup", () => { down = false; pen = null; });
  hwf.addEventListener("pointerleave", () => { px = py = null; down = false; pen = null; });

  function frame(now) {
    const t = now / 1000, W = innerWidth, H = innerHeight;
    const hx = W * .64 + dx, hy = H * .6 + dy;
    let want = .3 + .22 * Math.sin(t * .45), tdx = 0, tdy = 0;
    if (px != null) {
      // 커서와 손바닥 사이 거리: 가까울수록 다가온다
      const d = Math.hypot(px - hx, py - hy) / Math.max(W, H);
      want = Math.max(want, Math.min(1, 1.15 - d * 2.4));
      tdx = Math.max(-.14, Math.min(.14, (px - W * .64) / W * .35)) * W;
      tdy = Math.max(-.08, Math.min(.08, (py - H * .6) / H * .25)) * H;
    }
    if (down) want = 1;
    if (listOpen) { want = hoverNear ? .55 : 0; tdx = W * .06; tdy = H * .04; }
    const k = still ? 1 : .045;
    n += (want - n) * k; push += ((down ? 1 : 0) - push) * (down ? .09 : .06);
    dx += (tdx - dx) * k * .6; dy += (tdy - dy) * k * .6;
    root.setProperty("--n", n.toFixed(4)); root.setProperty("--push", push.toFixed(4));
    root.setProperty("--dx", dx.toFixed(1) + "px"); root.setProperty("--dy", dy.toFixed(1) + "px");
    // 쓴 자국은 3초쯤에 걸쳐 흐려진다
    if (performance.now() - inked > 4500) ig.clearRect(0, 0, W, H);
    else { ig.globalCompositeOperation = "destination-out"; ig.fillStyle = "rgba(0,0,0,.018)"; ig.fillRect(0, 0, W, H); ig.globalCompositeOperation = "source-over"; }
    if (!still) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 목록
  const works = window.SOYO_WORKS || [], cats = window.SOYO_CATEGORIES || [], subs = window.SOYO_SUBS?.video || [];
  const label = Object.fromEntries(cats.map(c => [c.id, c.label]));
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const info = document.querySelector("#info");
  let cur = "all", curSub = "all";
  const tabs = (items, val, on) => { const t = mk("nav", "tabs");
    items.forEach(([id, lb], i) => { if (i) t.append(mk("i", null, "/"));
      const b = mk("button", null, lb); b.type = "button"; b.setAttribute("aria-pressed", id === val); b.onclick = () => on(id); t.append(b); });
    return t; };

  function render() {
    const ws = works.filter(w => (cur === "all" || w.cat === cur) && (cur !== "video" || curSub === "all" || w.sub === curSub));
    const parts = [tabs([["all", "All"], ...cats.map(c => [c.id, c.label])], cur, id => { cur = id; curSub = "all"; render(); })];
    if (cur === "video") parts.push(tabs([["all", "All"], ...subs.map(s => [s.id, s.label])], curSub, id => { curSub = id; render(); }));
    const box = mk("div", "names");
    ws.forEach((w, i) => {
      const n = mk(w.href ? "a" : "span", "n", w.name); n.style.setProperty("--i", i);
      if (w.href) { n.href = w.href; n.target = "_blank"; n.rel = "noopener"; }
      n.onpointerenter = () => { tip.replaceChildren(...[w.alt, [w.role || label[w.cat], w.year].filter(Boolean).join(", ")].filter(Boolean).map(x => mk("span", null, x))); tip.classList.add("on"); hoverNear = true; };
      n.onpointermove = e => { tip.style.setProperty("--tx0", e.clientX + 16 + "px"); tip.style.setProperty("--ty0", e.clientY + 18 + "px"); };
      n.onpointerleave = () => { tip.classList.remove("on"); hoverNear = false; };
      box.append(n);
    });
    parts.push(ws.length ? box : mk("p", "empty", "Coming soon"), info);
    listEl.replaceChildren(...parts);
    // 분류를 바꿀 때마다 제목이 다시 차례로 올라온다
    hwf.classList.remove("list-open"); void listEl.offsetWidth; hwf.classList.add("list-open");
  }

  const isWork = () => /^\/work(\.html)?\/?$/.test(location.pathname);
  const route = () => {
    if (isWork()) { if (!listOpen) { cur = "all"; curSub = "all"; listEl.scrollTop = 0; listOpen = true; render(); } }
    else { listOpen = false; hwf.classList.remove("list-open"); tip.classList.remove("on"); }
  };
  const go = path => { if (location.pathname !== path) history.pushState(null, "", path); route(); };
  if (location.hash === "#work") history.replaceState(null, "", "/work"); // 예전 주소
  route();
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href="/work"], a[href="/"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); go(a.getAttribute("href"));
  });
  addEventListener("popstate", route);
  addEventListener("keydown", e => { if (e.key === "Escape" && listOpen) go("/"); });
})();
