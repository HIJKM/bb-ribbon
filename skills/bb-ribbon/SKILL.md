---
name: bb-ribbon
description: 사이드바 리본 내비게이션. 데스크톱은 왼쪽 세로, 모바일은 상단 가로. 스레드 행 테마는 bb-thread-theme, 그 외 사이드바 화면은 bb-sidebar-ui가 맡는다.
---

# bb-ribbon

사이드바 내비게이션을 아이콘 리본으로 바꾼다. 이름은 호버로 나온다.

데스크톱은 왼쪽 세로 리본이다. 버튼은 `size-7`, 글리프는 `size-4`다. 모바일(`isCompactViewport`, 768px 미만)은 사이드바 상단, 스레드 목록 위에 가로 아이콘 줄이다. 모바일에서는 왼쪽 열로 옮기지 않는다. 모바일 칸의 최소 크기는 `size-9`(2.25rem)다. 그 최소로 들어가는 칸 수를 정한 뒤, 칸 너비를 나눠 왼쪽 `pl-[12px]`과 오른쪽 `pr-2` 사이를 채운다. 버튼 간격은 없다. 글리프는 `size-5`다. 왼쪽은 사이드바 토글의 `pl-[12px]`, 오른쪽은 히스토리 앞 화살표 줄의 `px-2`와 맞춘다.

가로·세로 모두, 공간이 남으면 보이는 항목을 모두 둔다. 공간이 부족하면 넘치는 항목만 더보기(`...`)에 넣는다. 사용자가 숨긴 항목도 더보기에 둔다. 더보기 아이콘은 `MoreHorizontal`이다. `Ellipsis`는 호스트에 없어서 Zap으로 나온다.

데스크톱 레일은 헤더, `[data-sidebar=content]`, `[data-sidebar=footer]`를 직계 자식으로 가진 요소에 붙인다. 그 요소는 `[data-sidebar=sidebar]`다.

등록은 `app.tsx`의 `experimental_sidebarNavigation`, id `ribbon`이다. 켜는 값은 `bb-ribbon/ribbon`이다. 설정 → Appearance → Navigation에서 기본 Navigation과 고른다.

화면을 바꾸는 등록은 `app.tsx`에 둔다. 서버 동작이 필요해지기 전에는 `server.ts`를 비워 둔다.
