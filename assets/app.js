// 분류 링크, 작업 목록, 미리보기 그림.
(() => {
  // 최신 연도가 위. 연도 아직 없는 작업은 아래에 적힌 차례대로
  const works = (window.SOYO_WORKS || []).slice().sort((a, b) => (b.year || 0) - (a.year || 0));
  const cats = window.SOYO_CATEGORIES || [];
  const label = Object.fromEntries(cats.map(c => [c.id, c.label]));
  const count = id => works.filter(w => w.cat === id).length;
  const sup = n => { const s = document.createElement("sup"); s.textContent = String(n).padStart(2, "0"); return s; };
  let filter = null;

  // 위 'Work' 열: 분류를 누르면 목록 화면에 그 분류만, 'Work' 를 누르면 전부
  const catLinks = document.querySelector(".cats");
  catLinks.replaceChildren(...cats.map(c => {
    const li = document.createElement("li"), a = document.createElement("a");
    a.href = "/work"; a.textContent = c.label; a.append(sup(count(c.id)));
    a.dataset.cat = c.id;
    a.onclick = () => { filter = c.id; render(); };
    li.append(a); return li;
  }));
  const title = document.querySelector(".head h2");

  const list = document.querySelector(".list");
  const peek = document.querySelector(".peek");
  // 줄이 화면에 들어오면 차례로 올라온다
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .2 });

  function render() {
    // 목록 제목은 지금 보는 분류. 빈 분류는 빈 목록
    title.replaceChildren(filter ? label[filter] : "Work", sup(filter ? count(filter) : works.length));
    catLinks.querySelectorAll("a").forEach(a => a.toggleAttribute("aria-current", a.dataset.cat === filter));
    const shown = works.filter(w => !filter || w.cat === filter);
    // 묶음마다 작은 제목: 분류 차례대로, 소분류가 있는 분류(Video)는 Film, Music Video… 로 더 나눈다. 빈 묶음은 안 보임
    const groups = cats.flatMap(c => {
      const ws = shown.filter(w => w.cat === c.id), subs = window.SOYO_SUBS?.[c.id];
      if (!subs) return [[filter ? null : c.label, ws]]; // App 만 볼 땐 위 제목과 겹치니 소제목 없이
      return subs.map(s => [s.label, ws.filter(w => w.sub === s.id)]).concat([[c.label, ws.filter(w => !subs.some(s => s.id === w.sub))]]);
    });
    let i = 0;
    list.replaceChildren(...groups.filter(([, ws]) => ws.length).flatMap(([name, ws]) => {
      const rows = ws.map(w => row(w, i++));
      if (!name) return rows;
      const h = document.createElement("li");
      // 숫자는 분류 이름(App 등)에만. Film, Music Video… 같은 소분류엔 안 붙인다
      h.className = "sub"; h.append(name);
      if (cats.some(c => c.label === name)) h.append(sup(ws.length));
      return [h, ...rows];
    }));
  }

  // 큰 제목 + 옆에 흐린 다른 말 제목. 한글이 섞이면 lang="ko" 로 읽히게
  const ko = t => /[\uac00-\ud7a3]/.test(t) ? "ko" : "";
  function named(el, w) {
    el.textContent = w.name; if (ko(w.name)) el.lang = "ko";
    if (!w.alt) return;
    const k = document.createElement("span");
    k.className = "alt"; k.textContent = w.alt; if (ko(w.alt)) k.lang = "ko";
    el.append(k);
  }

  function row(w, i) {
    // href 는 새 탭, 영상·그림이 있으면 사이트 안 창, 둘 다 없으면 눌리지 않는 줄
    const opens = w.video || w.images?.length;
    const li = document.createElement("li"), a = document.createElement(w.href ? "a" : opens ? "button" : "div");
    li.style.setProperty("--i", i);
    if (w.href) { a.href = w.href; a.target = "_blank"; a.rel = "noopener"; }
    else if (opens) { a.type = "button"; a.onclick = () => view(w); }
    a.innerHTML = `<span class="y"></span><span class="n"></span><span class="t"></span><span class="go" aria-hidden="true">${opens && !w.href ? "+" : "↗"}</span>`;
    a.querySelector(".y").textContent = w.year || "—";
    named(a.querySelector(".n"), w);
    a.querySelector(".t").textContent = w.role || label[w.cat] || "";
    // 이름 글자 위에 있을 때만 커서를 따라다니는 그림. 앱은 둥근 아이콘, 그 밖엔 가로 썸네일
    const n = a.querySelector(".n");
    n.onpointerenter = () => { if (w.icon) { peek.src = w.icon; peek.classList.toggle("wide", w.cat !== "app"); peek.classList.add("on"); } };
    n.onpointermove = e => {
      peek.style.setProperty("--x", e.clientX + 24 + "px");
      peek.style.setProperty("--y", e.clientY - peek.offsetHeight / 2 + "px");
    };
    n.onpointerleave = () => peek.classList.remove("on");
    li.append(a); io.observe(li);
    return li;
  }

  // 사이트 안 창: 영상이면 재생, 아니면 그림을 세로로. 닫으면 비워서 영상도 멈춘다
  const box = document.querySelector(".view");
  function view(w) {
    peek.classList.remove("on");
    box.querySelector(".vmeta").textContent = `${w.year || "—"} · ${w.role || label[w.cat] || ""}`;
    const h = box.querySelector(".vname");
    named(h, w);
    const media = [];
    if (w.video) {
      const v = document.createElement("video");
      Object.assign(v, { src: w.video, controls: true, playsInline: true, preload: "metadata" });
      if (w.poster) v.poster = w.poster;
      media.push(v);
    }
    for (const src of w.images || []) {
      const img = document.createElement("img");
      Object.assign(img, { src, alt: "", loading: "lazy", decoding: "async" });
      media.push(img);
    }
    box.querySelector(".vbody").replaceChildren(...media);
    box.showModal();
    box.scrollTop = 0;
  }
  box.querySelector(".vclose").onclick = () => box.close();
  box.onclick = e => { if (e.target === box) box.close(); };
  box.onclose = () => box.querySelector(".vbody").replaceChildren();

  render();

  // /work 면 큰 SOYO 를 걷고 목록만 새 화면으로. 그 밖엔 첫 화면.
  // 주소는 history 로만 바꾸고, /work 를 바로 열면 GitHub Pages 가 work.html(index.html 복사본)을 준다
  const isWork = () => /^\/work(\.html)?\/?$/.test(location.pathname);
  const route = () => {
    document.body.classList.toggle("is-work", isWork());
    if (!isWork() && filter) { filter = null; render(); }
    scrollTo({ top: 0, behavior: "instant" });
  };
  if (location.hash === "#work") history.replaceState(null, "", "/work"); // 예전 주소
  route();
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href="/work"], a[href="/"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    if (location.pathname !== a.getAttribute("href")) history.pushState(null, "", a.getAttribute("href"));
    route();
  });
  addEventListener("popstate", route);

  document.querySelector(".up").onclick = () => scrollTo({ top: 0 });
})();
