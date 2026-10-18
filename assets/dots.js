// 첫 화면: 흐린 바탕 위에 화면 너비를 꽉 채운 'SOYO' 를 아스키 글자로 찍는다 (아래 끝에서 잘림).
// 글자 가장자리는 옅은 글자(. : -), 안쪽은 짙은 글자(# % @).
// 폰에선 SO / YO 두 줄. 바탕 얼룩은 천천히 흐르고, 가끔 줄 조각이 한 칸 밀리며 깜박인다.
// 가끔 글자 몇 개가 다른 글자로 바뀐다. 커서·손가락이 닿으면 글자가 밀려 흩어지며 라임색이 되고, 떠나면 제자리로 돌아온다.
(() => {
  const root = document.querySelector(".hwf");
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = getComputedStyle(document.documentElement);
  const INK = css.getPropertyValue("--ink").trim(), LIME = "#9fd91a", BASE = "#e9e9e6";

  // 인쇄 그레인 타일 한 장. 페이지 전체(body::after)에 깔린다
  const tile = document.createElement("canvas");
  tile.width = tile.height = 256;
  const tg = tile.getContext("2d"), id = tg.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { id.data[i] = id.data[i + 1] = id.data[i + 2] = Math.random() * 255; id.data[i + 3] = Math.random() < .5 ? 0 : 255; }
  tg.putImageData(id, 0, 0);
  document.documentElement.style.setProperty("--grain", `url(${tile.toDataURL()})`);

  // 첫 화면 바탕에만 진하게 까는 그레인 (곱하기)
  const fine = document.createElement("canvas");
  fine.width = fine.height = 256;
  { const g = fine.getContext("2d"), im = g.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) { const v = 175 + Math.random() * 80; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); }
  const grain = ctx.createPattern(fine, "repeat");

  // 흐린 바탕: 작은 캔버스에 둥근 얼룩을 그려 크게 늘린다 [x, y, 반지름, 색]
  const BLOBS = [[.15, .3, .5, "255,255,255"], [.55, .25, .4, "212,213,208"], [.82, .55, .4, "251,251,249"], [.42, .72, .3, "194,195,190"], [.68, .8, .13, "111,112,107"], [.25, .86, .22, "169,170,165"], [.93, .18, .09, "214,238,140"]];
  const small = document.createElement("canvas"), sg = small.getContext("2d");

  let w = 0, h = 0, dpr = 1, phone = false, R = 120, px = -1e5, py = -1e5, raf = 0, visible = true;
  let dots = [], g = 10, glitchAt = 0, atlas = null, cw = 0, ch = 0;
  // 옅은 글자 → 짙은 글자
  const RAMP = ".,:;-=+*cvoxzXYUJ#%&8$@";

  // 고정 씨앗 난수: 빠진 점 자리가 매번 같게
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const blob = (x, y, f, o) => Math.sin(x * f + o) * Math.cos(y * f * 1.3 - o) + Math.sin((x + y) * f * .7 + o * 2);

  function layout() {
    const r = root.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
    dpr = Math.min(devicePixelRatio || 1, 2); phone = w < 720;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    small.width = Math.ceil(w / 12); small.height = Math.ceil(h / 12);
    R = phone ? 70 : 120; g = phone ? 8 : 10;
    // 글자 판: 글자마다 잉크·라임 두 벌을 미리 그려 두고 찍을 때 오려 쓴다
    cw = g; ch = Math.round(g * 1.25);
    atlas = document.createElement("canvas"); atlas.width = RAMP.length * cw * dpr; atlas.height = ch * 2 * dpr;
    const ag = atlas.getContext("2d"); ag.scale(dpr, dpr); ag.font = `500 ${g * 1.42}px "Plex Mono", ui-monospace, monospace`; ag.textBaseline = "middle"; ag.textAlign = "center";
    [INK, LIME].forEach((c, k) => { ag.fillStyle = c; [...RAMP].forEach((t, i) => ag.fillText(t, i * cw + cw / 2, k * ch + ch / 2)); });

    // 글자 모양: 폭에 꽉, 아래 20% 잘림. 머리(가는 선) 아래 남은 높이를 넘으면 줄인다
    const lines = phone ? ["SO", "YO"] : ["SOYO"];
    const rule = root.querySelector(".rule").getBoundingClientRect().bottom - r.top;
    const mask = document.createElement("canvas");
    mask.width = w; mask.height = h;
    const m = mask.getContext("2d", { willReadFrequently: true });
    const face = size => `800 ${size}px ${css.getPropertyValue("--sans")}`;
    m.font = face(100);
    let fit = Math.min(...lines.map(t => w * 1.02 / m.measureText(t).width * 100));
    m.font = face(fit);
    let asc = m.measureText("SOYO").actualBoundingBoxAscent || fit * .72;
    const room = h - rule - 28, need = asc * (lines.length * 1.12 - .12 - .2);
    if (need > room) { fit *= room / need; m.font = face(fit); asc = m.measureText("SOYO").actualBoundingBoxAscent || fit * .72; }
    const gap = asc * .12;
    let base = h + asc * .2 - (lines.length - 1) * (asc + gap);
    for (const t of lines) { m.fillText(t, (w - m.measureText(t).width) / 2, base); base += asc + gap; }
    const img = m.getImageData(0, 0, w, h).data;
    // 흐린 사본: 가장자리일수록 옅다 → 글자 고르는 데 쓴다
    const sm = document.createElement("canvas"); sm.width = Math.ceil(w / 14); sm.height = Math.ceil(h / 14);
    sm.getContext("2d").drawImage(mask, 0, 0, sm.width, sm.height);
    const soft = document.createElement("canvas"); soft.width = w; soft.height = h;
    const sc = soft.getContext("2d", { willReadFrequently: true }); sc.imageSmoothingQuality = "high"; sc.drawImage(sm, 0, 0, w, h);
    const sd = sc.getImageData(0, 0, w, h).data;

    seed = 11; dots = [];
    let row = 0;
    for (let y = 0; y < h; y += ch, row++) for (let x = 0; x < w; x += cw) {
      const at = (Math.min(h - 1, y + (ch >> 1)) * w + x + (cw >> 1)) * 4 + 3;
      if (img[at] < 128) continue;
      // 낮은 주파수 얼룩으로 빠진 점 무리, 라임 점 무리 자리를 정한다
      if (blob(x, y, .012, 1.3) > 1.82 || rnd() < .03) continue;
      const v = Math.max(0, Math.min(.999, (sd[at] / 255 - .4) / .6 + (rnd() - .5) * .25));
      dots.push({ x, y, row, ci: Math.floor(v * RAMP.length), lime: blob(x, y, .02, 4.1) > 1.35, ox: 0, oy: 0, vx: 0, vy: 0, sh: 0, off: 0 });
    }
  }

  function bg(time) {
    const sw = small.width, shh = small.height;
    sg.fillStyle = BASE; sg.fillRect(0, 0, sw, shh);
    BLOBS.forEach(([x, y, rr, c], i) => {
      const bx = (x + .05 * Math.sin(time / 7000 + i * 1.7)) * sw, by = (y + .05 * Math.cos(time / 9000 + i)) * shh, br = rr * Math.max(sw, shh);
      const gr = sg.createRadialGradient(bx, by, 0, bx, by, br);
      gr.addColorStop(0, `rgba(${c},1)`); gr.addColorStop(1, `rgba(${c},0)`);
      sg.fillStyle = gr; sg.fillRect(0, 0, sw, shh);
    });
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(small, 0, 0, w, h);
    ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = .5;
    ctx.fillStyle = grain; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bg(reduced ? 0 : now);
    // 가끔 한 줄의 조각이 한 칸 밀리고 깜박인다
    if (!reduced && now > glitchAt && dots.length) {
      glitchAt = now + 280 + Math.random() * 600;
      const d0 = dots[(Math.random() * dots.length) | 0], off = (Math.random() < .5 ? -1 : 1) * cw;
      for (let k = 0; k < dots.length / 60; k++) { const d = dots[(Math.random() * dots.length) | 0]; d.ci = Math.max(0, Math.min(RAMP.length - 1, d.ci + (Math.random() < .5 ? -2 : 2))); }
      for (const d of dots) if (d.row === d0.row && Math.abs(d.x - d0.x) < 140) { d.sh = now + 220 + Math.random() * 200; d.off = off; }
    }
    const R2 = R * R;
    for (const d of dots) {
      if (!reduced) {
        const dx = d.x + d.ox - px, dy = d.y + d.oy - py, q = dx * dx + dy * dy;
        if (q < R2) { const dist = Math.sqrt(q) || 1, f = (1 - dist / R) ** 2 * 9; d.vx += dx / dist * f; d.vy += dy / dist * f; }
        d.vx = (d.vx - d.ox * .06) * .82; d.vy = (d.vy - d.oy * .06) * .82;
        d.ox += d.vx; d.oy += d.vy;
      }
      let x = d.x + d.ox;
      if (d.sh > now) { x += d.off; if (Math.random() < .3) continue; }
      const k = d.lime || Math.abs(d.ox) + Math.abs(d.oy) > 3 ? 1 : 0;
      ctx.drawImage(atlas, d.ci * cw * dpr, k * ch * dpr, cw * dpr, ch * dpr, x, d.y + d.oy, cw, ch);
    }
  }

  const loop = now => { raf = 0; if (!visible) return; draw(now); if (!reduced) raf = requestAnimationFrame(loop); };
  const wake = () => { if (!raf && visible) raf = requestAnimationFrame(loop); };
  const local = e => { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };

  if (!reduced) {
    root.addEventListener("pointermove", e => { [px, py] = local(e); });
    root.addEventListener("pointerdown", e => { [px, py] = local(e); });
    root.addEventListener("pointerleave", () => { px = py = -1e5; });
    addEventListener("pointerup", e => { if (e.pointerType === "touch") px = py = -1e5; });
  }
  // 글꼴이 와야 글자 모양이 맞으니 그다음에 찍는다. 크기가 바뀌면 다시
  let ready = false, size = "";
  const relayout = () => { const s = root.offsetWidth + "x" + root.offsetHeight; if (s === size) return; size = s; layout(); wake(); };
  const go = () => { ready = true; relayout(); };
  Promise.all([document.fonts.load(`800 100px "Pretendard Variable"`, "SOYO"), document.fonts.load(`500 10px "Plex Mono"`)]).then(go, go);
  new ResizeObserver(() => { if (ready) relayout(); }).observe(root);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) wake(); }).observe(root);
})();
