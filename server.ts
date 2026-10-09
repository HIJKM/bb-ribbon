import type { BbPluginApi } from "@get-bb/plugin-sdk";

export default function plugin(bb: BbPluginApi) {
  bb.settings.define({
    expandOnHover: {
      type: "boolean",
      label: "데스크톱 리본 hover 확장",
      description: "리본에 포인터를 올리면 레이블을 표시하며 스레드 목록 위로 펼쳐집니다.",
      default: true,
    },
  });
}
