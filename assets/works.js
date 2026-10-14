// 소요 작업 목록. 새 작업은 WORKS 에 한 덩어리씩 더한다.
//   cat:    "app" | "video" | "book" | "marketing" | "item"
//   name:   이름
//   year:   연도
//   href:   누르면 갈 곳. 없으면 눌리지 않는 줄 (아직 안 낸 작업)
//   icon:   줄에 마우스를 올리면 커서 옆에 뜨는 그림 (assets/icons/ 안)
window.SOYO_CATEGORIES = [
  { id: "app", label: "App" },
  { id: "video", label: "Video" },
  { id: "book", label: "Publishing" },
  { id: "marketing", label: "Marketing" },
  { id: "item", label: "Item" },
];

window.SOYO_WORKS = [
  {
    cat: "app", name: "NoJudgeMan", year: 2026,
    href: "https://apps.apple.com/kr/app/%EB%85%B8%EC%A0%80%EC%A7%80%EB%A7%A8/id6820324609",
    icon: "/assets/icons/nojudgeman.png",
  },
  { cat: "app", name: "KanKan", year: 2026, icon: "/assets/icons/kankan.png" },
];
