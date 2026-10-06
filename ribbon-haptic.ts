export type RibbonTapKind = "impact-light";

export interface HapticBridge {
  post(message: unknown): void;
  capabilities?: readonly string[];
}

/** Same light impact the sidebar uses when it opens. Desktop and extra fingers stay quiet. */
export function ribbonTapKind(input: {
  phone: boolean;
  isPrimary: boolean;
}): RibbonTapKind | null {
  if (!input.phone || !input.isPrimary) return null;
  return "impact-light";
}

export function postRibbonTap(bridge: HapticBridge | null): boolean {
  if (!bridge?.capabilities?.includes("haptic")) return false;
  try {
    bridge.post({ type: "haptic", kind: "impact-light" });
  } catch {
    return false;
  }
  return true;
}

export function readHapticBridge(root: unknown): HapticBridge | null {
  if (typeof root !== "object" || root === null) return null;
  const native = (root as { bb?: { native?: Partial<HapticBridge> } }).bb?.native;
  if (!native || typeof native.post !== "function") return null;
  return native as HapticBridge;
}
