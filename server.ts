import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { OVERLAY_MODE, PUSH_MODE } from "./ribbon-expansion";

export default function plugin(bb: BbPluginApi) {
  bb.settings.define({
    desktopHoverMode: {
      type: "select",
      label: "데스크톱 리본 hover 동작",
      description: "리본에 포인터를 올리면 레이블을 표시합니다. 너비 늘리기는 스레드 목록 너비를 유지하고, 겹치기는 목록 위를 잠시 덮습니다.",
      options: [OVERLAY_MODE, PUSH_MODE],
      default: OVERLAY_MODE,
    },
  });
}
