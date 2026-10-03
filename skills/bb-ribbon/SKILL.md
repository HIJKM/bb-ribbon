---
name: bb-ribbon
description: 사이드바 리본 내비게이션. 데스크톱은 왼쪽 세로. 스레드 행 테마는 bb-thread-theme, 그 외 사이드바 화면은 bb-sidebar-ui가 맡는다.
---

# bb-ribbon

사이드바 내비게이션을 아이콘 리본으로 바꾼다. 이름은 호버로 나온다.

데스크톱은 왼쪽 세로 리본이다. 버튼은 `size-7`, 글리프는 `size-4`다.

공간이 남으면 보이는 항목을 모두 둔다. 공간이 부족하면 넘치는 항목만 더보기(`...`)에 넣는다. 사용자가 숨긴 항목도 더보기에 둔다. 더보기 아이콘은 `MoreHorizontal`이다. `Ellipsis`는 호스트에 없어서 Zap으로 나온다.

데스크톱 레일은 헤더, `[data-sidebar=content]`, `[data-sidebar=footer]`를 직계 자식으로 가진 요소에 붙인다. 그 요소는 `[data-sidebar=sidebar]`다.

등록은 `app.tsx`의 `experimental_sidebarNavigation`, id `ribbon`이다. 켜는 값은 `bb-ribbon/ribbon`이다. 설정 → Appearance → Navigation에서 기본 Navigation과 고른다.

화면을 바꾸는 등록은 `app.tsx`에 둔다. 서버 동작이 필요해지기 전에는 `server.ts`를 비워 둔다.
