export const OVERLAY_MODE = "스레드 목록 위에 겹치기";
export const PUSH_MODE = "사이드바 너비 늘리기";

/** BB puts the user's width on both the panel and its layout gap. */
export function expandSidebarWidth(
  shell: HTMLElement,
  delta: string,
  readInheritedWidth = () => shell.ownerDocument.defaultView!.getComputedStyle(shell).getPropertyValue("--sidebar-width"),
): () => void {
  const targets = [...shell.querySelectorAll<HTMLElement>(
    ':scope > [data-sidebar="panel"], :scope > [data-sidebar="gap"]',
  )];
  const snapshots = targets.map((element) => ({
    element,
    width: element.style.getPropertyValue("--sidebar-width"),
    priority: element.style.getPropertyPriority("--sidebar-width"),
    applied: "",
    transition: element.style.getPropertyValue("transition-property"),
    transitionPriority: element.style.getPropertyPriority("transition-property"),
  }));
  // The panel and rail must resize together so thread rows never shrink in between.
  for (const { element } of snapshots) {
    element.style.setProperty("transition-property", "left, right, transform, opacity, visibility, filter", "important");
  }
  const apply = () => {
    for (const snapshot of snapshots) {
      const { element } = snapshot;
      const current = element.style.getPropertyValue("--sidebar-width");
      if (snapshot.applied && current !== snapshot.applied) {
        snapshot.width = current;
        snapshot.priority = element.style.getPropertyPriority("--sidebar-width");
      }
      const base = snapshot.width || readInheritedWidth().trim();
      if (!base) continue;
      snapshot.applied = `calc(${base} + ${delta})`;
      if (current !== snapshot.applied) {
        element.style.setProperty("--sidebar-width", snapshot.applied, snapshot.priority);
      }
    }
  };
  apply();
  const observer = new shell.ownerDocument.defaultView!.MutationObserver(apply);
  for (const element of targets) {
    observer.observe(element, { attributes: true, attributeFilter: ["style"] });
  }
  for (let parent: HTMLElement | null = shell; parent; parent = parent.parentElement) {
    observer.observe(parent, { attributes: true, attributeFilter: ["style", "class"] });
  }
  return () => {
    observer.disconnect();
    for (const { element, width, priority } of snapshots) {
      if (width) element.style.setProperty("--sidebar-width", width, priority);
      else element.style.removeProperty("--sidebar-width");
    }
    // Commit the restored width before restoring the host's width transitions.
    void shell.offsetWidth;
    for (const { element, transition, transitionPriority } of snapshots) {
      if (transition) element.style.setProperty("transition-property", transition, transitionPriority);
      else element.style.removeProperty("transition-property");
    }
  };
}
