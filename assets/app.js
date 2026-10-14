// 분류 링크, 작업 목록, 미리보기 그림.
(() => {
  const works = (window.SOYO_WORKS || []).slice().sort((a, b) => b.year - a.year);
  const cats = window.SOYO_CATEGORIES || [];
  const label = Object.fromEntries(cats.map(c => [c.id, c.label]));
  const count = id => works.filter(w => w.cat === id).length;
  const sup = n => { const s = document.createElement("sup"); s.textContent = String(n).padStart(2, "0"); return s; };
  let filter = null;

  // 위 'Work' 열: 분류를 누르면 목록 화면에 그 분류만, 'Work' 를 누르면 전부
  const catLinks = document.querySelector(".cats");
  catLinks.replaceChildren(...cats.map(c => {
    const li = document.createElement("li"), a = document.createElement("a");
    a.href = "#work"; a.textContent = c.label; a.append(sup(count(c.id)));
    a.dataset.cat = c.id;
    a.onclick = () => { filter = c.id; render(); };
    li.append(a); return li;
  }));
  const workLink = document.querySelector(".col .all");
  workLink.onclick = () => { filter = null; render(); };
  const title = document.querySelector(".head h2");

  const list = document.querySelector(".list");
  const peek = document.querySelector(".peek");
  // 줄이 화면에 들어오면 차례로 올라온다
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .2 });

  function render() {
    // 목록 제목은 지금 보는 분류. 빈 분류는 빈 목록
    title.replaceChildren(filter ? label[filter] : "Work", sup(filter ? count(filter) : works.length));
    catLinks.querySelectorAll("a").forEach(a => a.toggleAttribute("aria-current", a.dataset.cat === filter));
    list.replaceChildren(...works.filter(w => !filter || w.cat === filter).map((w, i) => {
      // href 가 없는 작업(아직 안 낸 것)은 눌리지 않는 줄
      const li = document.createElement("li"), a = document.createElement(w.href ? "a" : "div");
      li.style.setProperty("--i", i);
      if (w.href) { a.href = w.href; a.target = "_blank"; a.rel = "noopener"; }
      a.innerHTML = `<span class="y"></span><span class="n"></span><span class="t"></span><span class="go" aria-hidden="true">↗</span>`;
      a.querySelector(".y").textContent = w.year;
      a.querySelector(".n").textContent = w.name;
      a.querySelector(".t").textContent = label[w.cat] || "";
      // 커서를 따라다니는 아이콘
      a.onpointerenter = () => { if (w.icon) { peek.src = w.icon; peek.classList.add("on"); } };
      a.onpointermove = e => {
        peek.style.setProperty("--x", e.clientX + 24 + "px");
        peek.style.setProperty("--y", e.clientY - peek.offsetHeight / 2 + "px");
      };
      a.onpointerleave = () => peek.classList.remove("on");
      li.append(a); io.observe(li);
      return li;
    }));
  }
  render();

  // #work 면 큰 SOYO 를 걷고 목록만 새 화면으로. 그 밖엔 첫 화면
  const route = () => {
    document.body.classList.toggle("is-work", location.hash === "#work");
    if (location.hash !== "#work" && filter) { filter = null; render(); }
    scrollTo({ top: 0, behavior: "instant" });
  };
  addEventListener("hashchange", route);
  route();

  document.querySelector(".up").onclick = () => scrollTo({ top: 0 });
})();
