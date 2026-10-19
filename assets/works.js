// 소요 작업 목록. 새 작업은 WORKS 에 한 덩어리씩 더한다. 목록에는 적힌 차례대로 나온다.
//   cat:    "app" | "video" | "book" | "marketing" | "item"
//   sub:    Video 안 묶음 "film" | "mv" | "ad" | "content" | "personal"
//   year:   연도. 모르면 빼둔다
//   href:   누르면 새 탭으로 갈 곳. 없으면 눌리지 않는 제목 (아직 안 낸 작업)
//   name:   목록에 보이는 제목. 전부 영어 ("Milk Tooth")
//   alt:    제목에 마우스를 올리면 뜨는 아티스트·광고주 이름
//   role:   맡은 일. alt 아래에 연도와 함께 뜬다 (없으면 분류 이름)
window.SOYO_CATEGORIES = [
  { id: "app", label: "App" },
  { id: "video", label: "Video" },
  { id: "book", label: "Publishing" },
  { id: "marketing", label: "Marketing" },
  { id: "item", label: "Item" },
];

// Video 목록 안에서 이 차례로 묶는다
window.SOYO_SUBS = {
  video: [
    { id: "film", label: "Film" },
    { id: "mv", label: "Music Video" },
    { id: "ad", label: "Commercial" },
    { id: "content", label: "Content" },
    { id: "personal", label: "Personal" },
  ],
};

window.SOYO_WORKS = [
  {
    cat: "app", name: "NoJudgeMan", year: 2026,
    href: "https://apps.apple.com/kr/app/%EB%85%B8%EC%A0%80%EC%A7%80%EB%A7%A8/id6820324609",
    icon: "/assets/icons/nojudgeman.png",
  },
  { cat: "app", name: "KanKan", year: 2026, icon: "/assets/icons/kankan.png" },
  { cat: "video", sub: "ad", name: "Filluv", year: 2023, role: "Assistant Camera" },

  // Film
  { cat: "video", sub: "film", name: "Milk Tooth", year: 2023, role: "Director", href: "https://watcha.com/ko/contents/mWz3LVV" },
  { cat: "video", sub: "film", name: "Downstream", role: "Director" },
  { cat: "video", sub: "film", name: "Ghost Guest", role: "Director" },
  { cat: "video", sub: "film", name: "Mayfly", role: "Director" },
  { cat: "video", sub: "film", name: "Party Girl", role: "Directing Dept." },
  { cat: "video", sub: "film", name: "Anti Love", role: "Director" },
  { cat: "video", sub: "film", name: "THE WHITE LOOP", alt: "CKAIFF Official Selection", role: "Director" },

  // Music Video
  { cat: "video", sub: "mv", name: "Eternity", alt: "Lee Heesang", role: "P.A" },
  { cat: "video", sub: "mv", name: "Don't Stop", alt: "Hypnosistherapy", role: "P.A / Stills" },
  { cat: "video", sub: "mv", name: "BLAZE", alt: "Hypnosistherapy", role: "P.A" },
  { cat: "video", sub: "mv", name: "Go", alt: "Trans Fixion", role: "Assistant Director" },
  { cat: "video", sub: "mv", name: "Radio", alt: "Trans Fixion", role: "Assistant Director" },
  { cat: "video", sub: "mv", name: "rabbit hole", alt: "toasterforaswim", role: "Animation Director" },

  // Commercial
  { cat: "video", sub: "ad", name: "Georgia × Choo Sung-hoon", alt: "Coca-Cola Korea", role: "Editor" },
  { cat: "video", sub: "ad", name: "A Lifelong Companion", alt: "E-mart", role: "2D Animation" },

  // Content
  { cat: "video", sub: "content", name: "Good at It, I'm a T", alt: "TXT · Ep.1–7", role: "Assistant Director · Logo · Edit · Color · Sound" },

  // Personal
  { cat: "video", sub: "personal", name: "Spring Days Go By", alt: "Mingginyu", role: "Director · DoP · Editor" },
  { cat: "video", sub: "personal", name: "Synchronicity", alt: "Choi Sung", role: "Director · DoP · Editor" },
  { cat: "video", sub: "personal", name: "Year to Year", alt: "Yeji, Oh Hyuk", role: "Director · DoP · Editor" },
  { cat: "video", sub: "personal", name: "Dream Trajectory", role: "Director · Editor" },
  { cat: "video", sub: "personal", name: "Beyond 1340", role: "Animation Director · Editor" },
];
