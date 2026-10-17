// 소요 작업 목록. 새 작업은 WORKS 에 한 덩어리씩 더한다.
//   cat:    "app" | "video" | "book" | "marketing" | "item"
//   sub:    Video 안 묶음 "film" | "mv" | "ad" | "content" | "personal"
//   year:   연도
//   href:   누르면 갈 곳. 없으면 눌리지 않는 줄 (아직 안 낸 작업)
//   icon:   줄에 마우스를 올리면 커서 옆에 뜨는 그림 (앱은 assets/icons/, 그 밖엔 assets/works/<slug>/thumb.jpg)
//   name:   큰 제목. 한국어가 원제면 한국어로 ("여진"), 아니면 영어
//   alt:    옆에 흐리게 붙는 다른 말 제목 ("Yeojin" / "여진")
//   role:   맡은 일. 오른쪽 칸에 (없으면 분류 이름)
//   video:  사이트 안 창에서 재생할 mp4. poster 는 재생 전 첫 화면
//   images: 영상 없을 때 창에 세로로 보여줄 썸네일·스크린샷들
//   href 는 새 탭, video/images 는 사이트 안 창. 둘 다 없으면 눌리지 않는 줄
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
];
