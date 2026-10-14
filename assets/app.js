// 분류 링크, 작업 목록, 미리보기 그림.
(() => {
  const works = (window.SOYO_WORKS || []).slice().sort((a, b) => b.year - a.year);
  const cats = window.SOYO_CATEGORIES || [];
  const label = Object.fromEntries(cats.map(c => [c.id, c.label]));
  const count = id => works.filter(w => w.cat === id).length;
  const sup = n => { const s = document.createElement("sup"); s.textContent = String(n).padStart(2, "0"); return s; };
  let filter = null;

  // 첫 화면 '작업' 열: 누르면 목록으로 내려가며 그 분류만
  document.querySelector(".cats").replaceChildren(...cats.map(c => {
    const li = document.createElement("li"), a = document.createElement("a");
    a.href = "#work"; a.textContent = c.label; a.append(sup(count(c.id)));
    if (!count(c.id)) a.setAttribute("aria-disabled", "true"), a.tabIndex = -1;
    a.onclick = () => { filter = c.id; render(); };
    li.append(a); return li;
  }));
  document.querySelector(".total").replaceWith(sup(works.length));

  const filters = document.querySelector(".filters");
  const list = document.querySelector(".list");
  const peek = document.querySelector(".peek");
  const btn = (text, id, n) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = text; b.append(sup(n));
    b.disabled = n === 0;
    b.setAttribute("aria-pressed", String(filter === id));
    b.onclick = () => { filter = id; render(); };
    return b;
  };

  // 줄이 화면에 들어오면 차례로 올라온다
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .2 });

  function render() {
    filters.replaceChildren(btn("All", null, works.length), ...cats.map(c => btn(c.label, c.id, count(c.id))));
    list.replaceChildren(...works.filter(w => !filter || w.cat === filter).map((w, i) => {
      const li = document.createElement("li"), a = document.createElement("a");
      li.style.setProperty("--i", i);
      a.href = w.href; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = `<span class="y"></span><span class="n"></span><span class="t"></span><span class="go" aria-hidden="true">↗</span>`;
      a.querySelector(".y").textContent = w.year;
      a.querySelector(".n").textContent = w.name;
      a.querySelector(".t").textContent = label[w.cat] || "";
      // 커서를 따라다니는 그림. 그림이 여럿이면 움직일 때마다 넘어간다
      let k = 0, last = 0;
      a.onpointerenter = () => { if (w.images?.length) { peek.src = w.images[0]; peek.classList.add("on"); } };
      a.onpointermove = e => {
        peek.style.setProperty("--x", e.clientX + 24 + "px");
        peek.style.setProperty("--y", e.clientY - peek.offsetHeight / 2 + "px");
        if (w.images?.length > 1 && Math.abs(e.clientX - last) > 90) { last = e.clientX; peek.src = w.images[++k % w.images.length]; }
      };
      a.onpointerleave = () => peek.classList.remove("on");
      li.append(a); io.observe(li);
      return li;
    }));
  }
  render();

  document.querySelector(".up").onclick = () => scrollTo({ top: 0 });
})();
