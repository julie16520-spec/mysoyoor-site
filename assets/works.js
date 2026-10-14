// 소요 작업 목록. 새 작업은 WORKS 에 한 덩어리씩 더한다.
//   cat:    "app" | "video" | "book" | "marketing" | "item"
//   name:   이름
//   year:   연도
//   href:   누르면 갈 곳
//   images: 첫 화면 더미에 쌓일 그림들 (assets/shots/ 안, 세로든 가로든 jpg)
//   video:  (선택) 더미 카드에서 소리 없이 도는 짧은 영상 mp4
window.SOYO_CATEGORIES = [
  { id: "app", label: "App" },
  { id: "video", label: "Video" },
  { id: "book", label: "Publishing" },
  { id: "marketing", label: "Marketing" },
  { id: "item", label: "Item" },
];

window.SOYO_WORKS = [
  {
    cat: "app", name: "노저지맨", year: 2026,
    href: "https://apps.apple.com/kr/app/%EB%85%B8%EC%A0%80%EC%A7%80%EB%A7%A8/id6820324609",
    images: ["assets/shots/nojudgeman-1.jpg", "assets/shots/nojudgeman-2.jpg", "assets/shots/nojudgeman-3.jpg", "assets/shots/nojudgeman-4.jpg", "assets/shots/nojudgeman-5.jpg"],
  },
];
