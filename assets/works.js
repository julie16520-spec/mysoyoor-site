// 소요 작업 목록. 새 작업은 아래 WORKS 에 한 줄(한 덩어리)씩 더하면 된다.
//   cat:   "app" | "video" | "book" | "marketing" | "item"
//   name:  큰 글씨로 보일 이름
//   meta:  오른쪽 작은 글씨 두 줄 (줄바꿈은 \n)
//   href:  누르면 갈 곳 (상세 페이지나 스토어, 영상 주소)
//   shot:  마우스를 올리면 따라오는 그림 (assets/shots/ 안, 세로 600px 정도 jpg)
window.SOYO_CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "app", label: "앱" },
  { id: "video", label: "영상" },
  { id: "book", label: "출판" },
  { id: "marketing", label: "마케팅" },
  { id: "item", label: "아이템" },
];

window.SOYO_WORKS = [
  {
    cat: "app", name: "노저지맨",
    meta: "iOS\nApp Store",
    href: "https://apps.apple.com/kr/app/%EB%85%B8%EC%A0%80%EC%A7%80%EB%A7%A8/id6820324609",
    shot: "assets/shots/nojudgeman-2.jpg",
  },
];
