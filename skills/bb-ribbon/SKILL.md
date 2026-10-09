---
name: bb-ribbon
description: 사이드바 리본 내비게이션. 데스크톱은 왼쪽 세로, 모바일은 상단 가로. 열림·닫힘은 sidebar, 스레드 행 테마는 bb-thread-theme가 맡는다.
---

# bb-ribbon

사이드바 내비게이션을 아이콘 리본으로 바꾼다. 데스크톱에서 리본에 hover하거나 키보드 포커스가 들어오면 리본이 펼쳐져 이름이 아이콘 옆에 나온다. 포인터와 키보드 포커스가 벗어나면 접힌다. 포인터 클릭으로 남은 포커스는 확장을 유지하지 않는다. 아이콘의 context menu에서 `Customize sidebar`를 열 수 있다. 모바일 이름은 버튼 `title`이다.

데스크톱은 왼쪽 세로 리본이다. 버튼은 `size-7`, 글리프는 `size-4`다. 칸 수는 grid 배치 후 리본의 실제 `clientHeight`로 정한다. 데스크톱에서 창 너비는 들어가는 칸 수만 바꾼다. 버튼과 글리프 크기는 데스크톱 안에서 같다. 칸 수 계산 중 리본이나 부모 높이를 inline style로 고정하지 않는다. phone(`useDeviceChrome().device`, portrait와 landscape 모두)은 사이드바 상단, 스레드 목록 위에 가로 아이콘 줄이다. phone에서는 왼쪽 열로 옮기지 않는다. 칸 최소는 `size-9`(2.25rem), 글리프는 `size-5`다. 그 최소로 들어가는 칸 수를 정한 뒤, 칸 너비를 나눠 왼쪽 `pl-[12px]`과 오른쪽 `pr-2` 사이를 채운다. 버튼 간격은 없다. phone에서 리본 아이콘, `...`, 더보기 행을 누르면 `impact-light` 햅틱이 한 번 난다. 왼쪽 사이드바가 열릴 때와 같다. 셸에 `haptic` capability가 있을 때만 낸다. 왼쪽은 사이드바 토글의 `pl-[12px]`, 오른쪽은 히스토리 앞 화살표 줄의 `px-2`와 맞춘다.

가로·세로 모두 `...` 버튼은 항상 표시하고 한 칸을 예약한다. 공간이 남으면 보이는 항목을 모두 두며, 부족하면 넘치는 항목만 더보기에 넣는다. 사용자가 숨긴 항목도 더보기에 둔다. 항목이 전부 보여도 `Customize sidebar` 진입을 위해 버튼을 유지한다. 더보기 아이콘은 `MoreHorizontal`이다. `Ellipsis`는 호스트에 없어서 Zap으로 나온다.

데스크톱 레일은 헤더, `sidebar-navigation-region`, `[data-sidebar=content]`, `[data-sidebar=footer]`를 직계 자식으로 가진 요소에 붙인다. 그 요소는 `[data-sidebar=sidebar]`다. `sidebar-navigation-region`은 숨기지 않는다. bb의 Customize editor가 그 안에 렌더된다. Customize editor가 열리면 `[data-sidebar=content]`를 잠시 숨기고, 닫으면 복구한다.

등록은 `app.tsx`의 `experimental_sidebarNavigation`, id `ribbon`이다. 켜는 값은 `bb-ribbon/ribbon`이다. 설정 → Appearance → Navigation에서 기본 Navigation과 고른다.

설정 → Ribbon의 `expandOnHover`는 데스크톱 hover 확장의 on/off 스위치이며 기본값은 `true`다. 리본은 2.5rem에서 12rem으로 펼쳐져 스레드 목록 위를 덮는다. 전체 사이드바와 스레드 목록 너비는 유지한다. 꺼져 있으면 아이콘 리본을 유지하고 hover 또는 키보드 포커스 시 아이콘 옆에 기존 툴팁으로 이름을 보여준다. 툴팁은 리본에 잘리지 않도록 `document.body`에 portal로 표시하고 `data-bb-plugin`으로 스타일 범위를 유지한다. phone에는 이 설정을 적용하지 않는다.

확장과 접힘 동안 데스크톱 버튼은 동일한 두 열 grid를 유지한다. 레이블은 DOM에 계속 두고 opacity로 표시하며, 리본의 z-index도 닫히는 동안 유지한다. hover 상태에 따라 버튼 배치·레이블 mount·쌓임 순서를 바꾸면 전환 중 튄다. 너비는 200ms, 레이블 opacity는 150ms의 ease-out으로 전환한다. `prefers-reduced-motion`에서는 transition을 끈다.

화면을 바꾸는 등록은 `app.tsx`에 둔다. `server.ts`는 이 스위치를 선언한다. 리본을 호스트 grid로 옮겨도 scoped CSS가 적용되도록 리본 루트에 `experimental_usePluginId()`의 `data-bb-plugin` 값을 유지한다.
