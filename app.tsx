import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  definePluginApp,
  useSettings,
  experimental_Icon as Icon,
  experimental_usePluginId,
  experimental_SidebarNavigationIcon as NavigationIcon,
  experimental_useSidebarNavigation,
  experimental_useSidebarNavigationSplit,
  type ExperimentalSidebarNavigationItem,
  type ExperimentalSidebarNavigationProps,
} from "@get-bb/plugin-sdk/app";
import { fitVisibleCount, readCssPx } from "./ribbon-fit";
import { postRibbonTap, readHapticBridge, ribbonTapKind } from "./ribbon-haptic";
import { useDeviceChrome } from "./use-device.ts";

function RibbonNavigation(_props: ExperimentalSidebarNavigationProps) {
  const { actions, activeItemId, isShortcutModifierHeld, items } =
    experimental_useSidebarNavigation();
  const pluginId = experimental_usePluginId();
  const { device } = useDeviceChrome();
  const phone = device === "phone";
  const railRef = useRef<HTMLDivElement>(null);
  const { values } = useSettings();
  const expandOnHover = values?.expandOnHover !== false;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = expandOnHover && !phone && (hovered || focused);
  useEffect(() => {
    setHovered(false);
    setFocused(false);
  }, [phone]);
  useRibbonPlacement(railRef, items.length > 0, phone);
  const visible = items.filter((item) => item.isVisible);
  const hidden = items.filter((item) => !item.isVisible);
  const fitted = useFittedCount(
    railRef,
    visible.length,
    true,
    phone ? "x" : "y",
    phone,
  );
  const shown = visible.slice(0, fitted);
  const overflow = [...visible.slice(fitted), ...hidden];

  if (items.length === 0) return null;

  return (
    <div
      ref={railRef}
      data-bb-sidebar-ribbon=""
      data-bb-plugin={pluginId}
      role="toolbar"
      aria-label="Sidebar"
      data-ribbon-axis={phone ? "x" : "y"}
      data-ribbon-expanded={expanded}
      onMouseEnter={() => { if (!phone) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      onPointerDownCapture={() => setFocused(false)}
      onFocusCapture={(event) => {
        if (!phone && event.target.matches(":focus-visible")) setFocused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      style={phone ? undefined : {
        width: expanded ? EXPANDED_RAIL_COLUMN : RAIL_COLUMN,
        position: "relative",
        zIndex: 30,
      }}
      className={
        phone
          ? "flex h-auto w-full min-w-0 flex-row items-center gap-0 overflow-hidden bg-sidebar py-1 pl-[12px] pr-2"
          : "flex min-h-0 flex-col items-center gap-0.5 self-stretch overflow-hidden border-r border-sidebar-border bg-sidebar py-1 transition-[width] duration-200 ease-out motion-reduce:transition-none"
      }
    >
      {shown.map((item) => (
        <RibbonButton
          key={item.id}
          item={item}
          isActive={item.id === activeItemId && item.action.kind !== "new-thread"}
          phone={phone}
          expanded={expanded}
          expandOnHover={expandOnHover}
          showShortcut={isShortcutModifierHeld}
          onActivate={(openInSplit) => actions.activate(item.id, { openInSplit })}
          onCustomize={() => actions.openCustomize()}
        />
      ))}
      <RibbonOverflow
        items={overflow}
        phone={phone}
        expanded={expanded}
        openBelow={phone}
        onActivate={(itemId, openInSplit) => {
          actions.activate(itemId, { openInSplit });
        }}
        onCustomize={() => actions.openCustomize()}
      />
    </div>
  );
}

const RAIL_COLUMN = "2.5rem";
const EXPANDED_RAIL_COLUMN = "12rem";
const STYLE_PROPS = [
  "display",
  "grid-template-columns",
  "grid-template-rows",
  "flex-direction",
  "padding-left",
  "grid-column",
  "grid-row",
  "min-width",
  "min-height",
  "border",
] as const;

function useRibbonPlacement(
  railRef: RefObject<HTMLDivElement | null>,
  active: boolean,
  phone: boolean,
) {
  const homeRef = useRef<{ parent: Node; next: ChildNode | null } | null>(null);
  const originalsRef = useRef(new Map<HTMLElement, Map<string, string>>());

  useLayoutEffect(() => {
    if (!active) return;
    const rail = railRef.current;
    if (!rail?.parentNode) return;
    homeRef.current = { parent: rail.parentNode, next: rail.nextSibling };

    return () => {
      for (const [element, snapshot] of originalsRef.current) {
        for (const [property, value] of snapshot) element.style.setProperty(property, value);
      }
      originalsRef.current.clear();
      const home = homeRef.current;
      const node = railRef.current;
      if (node && home?.parent.isConnected) home.parent.insertBefore(node, home.next);
      homeRef.current = null;
    };
  }, [active, railRef]);

  useLayoutEffect(() => {
    if (!active) return;
    const rail = railRef.current;
    if (!rail) return;

    const apply = () => {
      if (phone) {
        restorePlacement(rail, homeRef.current, originalsRef.current);
        const nav = rail.closest<HTMLElement>('[data-testid="sidebar-navigation-region"]');
        if (nav) {
          rememberStyle(originalsRef.current, nav);
          nav.style.minWidth = "0";
        }
        return;
      }

      const host = findRailHost(rail);
      if (!host) return;
      // An inline display beats the hidden attribute and would show the app
      // sidebar over Settings on a phone.
      if (host.hasAttribute("hidden")) {
        if (host.style.display === "grid") host.style.display = "";
        return;
      }

      const header = host.querySelector<HTMLElement>(
        ':scope > [data-testid="app-sidebar-top-reserve-row"]',
      );
      const nav = host.querySelector<HTMLElement>(
        ':scope > [data-testid="sidebar-navigation-region"]',
      );
      const content = host.querySelector<HTMLElement>(':scope > [data-sidebar="content"]');
      const footer = host.querySelector<HTMLElement>(':scope > [data-sidebar="footer"]');
      if (!header || !nav || !content || !footer) return;
      const isCustomizing = nav.querySelector(
        '[data-sidebar-navigation-customize-mode="true"]',
      ) !== null;
      const customizer = nav.querySelector<HTMLElement>(
        '[data-testid="sidebar-navigation-customize-inline"]',
      );

      if (rail.parentElement !== host) host.prepend(rail);

      rememberStyle(originalsRef.current, host);
      host.style.display = "grid";
      host.style.gridTemplateColumns = `${RAIL_COLUMN} minmax(0, 1fr)`;
      host.style.gridTemplateRows = "auto auto minmax(0, 1fr) auto";
      host.style.flexDirection = "";
      host.style.paddingLeft = "";
      host.style.minHeight = "0";

      place(originalsRef.current, header, "1 / -1", "1");
      place(originalsRef.current, rail, "1", "2 / -1");
      // Keep the host navigation region in the grid. bb renders its native
      // Customize editor inside this region when `openCustomize()` is called.
      place(originalsRef.current, nav, isCustomizing ? "2 / 4" : "2", "2");
      place(originalsRef.current, content, "2", "3");
      if (isCustomizing) {
        rememberStyle(originalsRef.current, content);
        content.style.display = "none";
        if (customizer) {
          rememberStyle(originalsRef.current, customizer);
          customizer.style.border = "none";
        }
      } else {
        restoreProperty(originalsRef.current, content, "display");
      }
      content.style.minWidth = "0";
      content.style.minHeight = "0";
      place(originalsRef.current, footer, "2", "4");

      for (const selector of [':scope > [data-testid="app-sidebar-navigation-divider"]']) {
        const extra = host.querySelector<HTMLElement>(selector);
        if (!extra) continue;
        rememberStyle(originalsRef.current, extra);
        extra.style.display = "none";
      }
    };

    apply();
    if (phone) return;
    const shell = rail.closest('[data-sidebar="sidebar"]');
    const observer = new MutationObserver(apply);
    if (shell) {
      observer.observe(shell, {
        attributes: true,
        subtree: true,
        attributeFilter: ["hidden", "data-sidebar-navigation-customize-mode"],
        childList: true,
      });
    }
    return () => observer.disconnect();
  });
}

function restorePlacement(
  rail: HTMLElement,
  home: { parent: Node; next: ChildNode | null } | null,
  originals: Map<HTMLElement, Map<string, string>>,
) {
  if (home?.parent.isConnected && rail.parentNode !== home.parent) {
    const next = home.next?.parentNode === home.parent ? home.next : null;
    home.parent.insertBefore(rail, next);
  }
  for (const [element, snapshot] of originals) {
    for (const [property, value] of snapshot) element.style.setProperty(property, value);
  }
}

/** Desktop host: the element whose direct children are the header, content, and footer. */
function findRailHost(rail: HTMLElement): HTMLElement | null {
  let node = rail.parentElement;
  while (node) {
    const header = node.querySelector(":scope > [data-testid='app-sidebar-top-reserve-row']");
    const content = node.querySelector(':scope > [data-sidebar="content"]');
    const footer = node.querySelector(':scope > [data-sidebar="footer"]');
    if (header && content && footer) return node;
    node = node.parentElement;
  }
  return null;
}

function useFittedCount(
  railRef: RefObject<HTMLDivElement | null>,
  itemCount: number,
  reserveOverflow: boolean,
  axis: "x" | "y",
  phone: boolean,
) {
  const [count, setCount] = useState(itemCount);

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const measure = () => {
      const next = readFittedCount(rail, itemCount, reserveOverflow, axis, phone);
      if (next === null) return;
      setCount((current) => (current === next ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    const host = findRailHost(rail);
    if (host) observer.observe(host);
    const panel = host?.closest<HTMLElement>("[data-sidebar='panel']");
    if (panel) observer.observe(panel);
    return () => observer.disconnect();
  }, [axis, phone, itemCount, railRef, reserveOverflow]);

  return Math.min(count, itemCount);
}

function readFittedCount(
  rail: HTMLElement,
  itemCount: number,
  reserveOverflow: boolean,
  axis: "x" | "y",
  phone: boolean,
): number | null {
  const style = getComputedStyle(rail);
  const available = axis === "x" ? rail.clientWidth : rail.clientHeight;
  if (available === 0) return null;
  const padding =
    axis === "x"
      ? readCssPx(style.paddingLeft) + readCssPx(style.paddingRight)
      : readCssPx(style.paddingTop) + readCssPx(style.paddingBottom);
  const gap =
    axis === "x"
      ? readCssPx(style.columnGap) || readCssPx(style.gap)
      : readCssPx(style.rowGap) || readCssPx(style.gap);
  return fitVisibleCount({
    available,
    padding,
    gap,
    itemSize: phone ? compactSlotMinPx() : desktopSlotMinPx(),
    itemCount,
    reserveOverflow,
  });
}

/** `size-9` is 2.25rem. Phone rows share the width, so measuring a laid-out slot would drop one on the next pass. */
function compactSlotMinPx(): number {
  return rootRemPx(2.25, 36);
}

/** `size-7` is 1.75rem. A stretched desktop button would shrink the next fit. */
function desktopSlotMinPx(): number {
  return rootRemPx(1.75, 28);
}

function rootRemPx(rem: number, fallback: number): number {
  const root = readCssPx(getComputedStyle(document.documentElement).fontSize);
  return root > 0 ? root * rem : fallback;
}

function rememberStyle(originals: Map<HTMLElement, Map<string, string>>, element: HTMLElement) {
  if (originals.has(element)) return;
  const snapshot = new Map<string, string>();
  for (const property of STYLE_PROPS) snapshot.set(property, element.style.getPropertyValue(property));
  originals.set(element, snapshot);
}

function restoreProperty(
  originals: Map<HTMLElement, Map<string, string>>,
  element: HTMLElement,
  property: string,
) {
  const original = originals.get(element)?.get(property) ?? "";
  element.style.setProperty(property, original);
}

function place(
  originals: Map<HTMLElement, Map<string, string>>,
  element: HTMLElement,
  column: string,
  row: string,
) {
  rememberStyle(originals, element);
  element.style.gridColumn = column;
  element.style.gridRow = row;
}

function RibbonButton({
  item,
  isActive,
  phone,
  expanded,
  expandOnHover,
  showShortcut,
  onActivate,
  onCustomize,
}: {
  item: ExperimentalSidebarNavigationItem;
  isActive: boolean;
  phone: boolean;
  expanded: boolean;
  expandOnHover: boolean;
  showShortcut: boolean;
  onActivate: (openInSplit: boolean) => void;
  onCustomize: () => void;
}) {
  const { splitProps } = experimental_useSidebarNavigationSplit(item.id);
  const label = itemLabel(item, showShortcut);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipId = useId();
  const [hover, setHover] = useState(false);
  const showTip = hover && !phone && !expandOnHover && buttonRef.current !== null;
  const [contextMenu, setContextMenu] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(`[data-ribbon-item-menu="${tipId}"]`)) {
        setContextMenu(null);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu, tipId]);

  const openContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const margin = 8;
    const width = 184;
    const height = 40;
    const anchor = buttonRef.current?.getBoundingClientRect();
    const x = event.clientX === 0 && event.clientY === 0 ? (anchor?.left ?? margin) : event.clientX;
    const y = event.clientX === 0 && event.clientY === 0 ? (anchor?.bottom ?? margin) : event.clientY;
    const left = Math.max(margin, Math.min(x, window.innerWidth - width - margin));
    const top = Math.max(margin, Math.min(y, window.innerHeight - height - margin));
    setContextMenu({ left, top });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={phone ? label : undefined}
        aria-label={label}
        aria-describedby={showTip ? tipId : undefined}
        aria-current={isActive ? "page" : undefined}
        aria-busy={item.isLoading || undefined}
        aria-keyshortcuts={item.shortcut?.ariaKeyShortcuts}
        disabled={item.isDisabled}
        {...splitProps}
        onPointerDown={composeRibbonPointerDown(phone, splitProps.onPointerDown)}
        onClick={(event) => onActivate(event.metaKey || event.ctrlKey)}
        onContextMenu={openContextMenu}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        data-ribbon-item=""
        className={buttonClass(isActive, item.isLoading, phone)}
      >
        <NavigationIcon icon={item.icon} className={glyphClass(phone)} />
        {!phone ? (
          <span
            data-ribbon-label=""
            aria-hidden={!expanded}
            style={{ opacity: expanded ? 1 : 0 }}
            className="min-w-0 justify-self-stretch truncate text-left text-xs transition-opacity duration-150 ease-out motion-reduce:transition-none"
            title={expanded ? label : undefined}
          >
            {label}
          </span>
        ) : null}
      </button>
      {showTip && buttonRef.current
        ? createPortal(
            <RibbonNamePopover label={label} anchor={buttonRef.current} id={tipId} />,
            document.body,
          )
        : null}
      {contextMenu
        ? createPortal(
            <div
              role="menu"
              aria-label={`${label} options`}
              data-ribbon-item-menu={tipId}
              style={{ top: contextMenu.top, left: contextMenu.left }}
              className="fixed z-50 min-w-44 rounded-md border border-border bg-popover p-1 text-xs text-popover-foreground shadow-md"
            >
              <MenuButton
                onClick={() => {
                  setContextMenu(null);
                  onCustomize();
                }}
              >
                Customize sidebar
              </MenuButton>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function RibbonNamePopover({ label, anchor, id }: { label: string; anchor: HTMLElement; id: string }) {
  const pluginId = experimental_usePluginId();
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const tip = ref.current;
      if (!tip) return;
      const button = anchor.getBoundingClientRect();
      const tipBox = tip.getBoundingClientRect();
      const margin = 8;
      let top = button.top + button.height / 2 - tipBox.height / 2;
      const maxTop = window.innerHeight - margin - tipBox.height;
      top = Math.min(Math.max(margin, top), Math.max(margin, maxTop));
      let left = button.right + 8;
      if (left + tipBox.width > window.innerWidth - margin) {
        left = Math.max(margin, button.left - margin - tipBox.width);
      }
      setBox((previous) => previous && previous.top === top && previous.left === left ? previous : { top, left });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchor, label]);

  return (
    <div
      ref={ref}
      id={id}
      role="tooltip"
      data-bb-plugin={pluginId}
      style={{ top: box?.top ?? 0, left: box?.left ?? 0, visibility: box ? "visible" : "hidden" }}
      className="pointer-events-none fixed z-50 max-w-60 truncate rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
    >
      {label}
    </div>
  );
}

function RibbonOverflow({
  items,
  phone,
  expanded,
  openBelow,
  onActivate,
  onCustomize,
}: {
  items: readonly ExperimentalSidebarNavigationItem[];
  phone: boolean;
  expanded: boolean;
  openBelow: boolean;
  onActivate: (itemId: string, openInSplit: boolean) => void;
  onCustomize: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={phone ? "relative h-9 min-w-9 flex-1" : "relative w-full shrink-0"}
    >
      <button
        type="button"
        aria-label="More sidebar navigation"
        aria-expanded={open}
        title="More"
        onPointerDown={composeRibbonPointerDown(phone)}
        onClick={() => setOpen((value) => !value)}
        data-ribbon-overflow=""
        className={buttonClass(
          open,
          false,
          phone,
          phone ? "h-full w-full" : undefined,
        )}
      >
        <Icon
          name="MoreHorizontal"
          className={glyphClass(phone)}
          aria-hidden="true"
        />
        {!phone ? (
          <span
            data-ribbon-label=""
            aria-hidden={!expanded}
            style={{ opacity: expanded ? 1 : 0 }}
            className="min-w-0 justify-self-stretch truncate text-left text-xs transition-opacity duration-150 ease-out motion-reduce:transition-none"
          >
            More
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="More navigation"
          className="fixed z-30 min-w-44 overflow-y-auto rounded-md border border-border bg-popover p-1 text-xs text-popover-foreground shadow-md"
          style={menuStyle(rootRef.current, openBelow)}
        >
          {items.map((item) => (
            <OverflowRow
              key={item.id}
              item={item}
              phone={phone}
              onDragStart={() => setOpen(false)}
              onActivate={(openInSplit) => {
                setOpen(false);
                onActivate(item.id, openInSplit);
              }}
            />
          ))}
          {items.length > 0 ? <div role="separator" className="my-1 h-px bg-border" /> : null}
          <MenuButton
            onClick={() => {
              setOpen(false);
              onCustomize();
            }}
          >
            Customize sidebar
          </MenuButton>
        </div>
      ) : null}
    </div>
  );
}

function OverflowRow({
  item,
  phone,
  onActivate,
  onDragStart,
}: {
  item: ExperimentalSidebarNavigationItem;
  phone: boolean;
  onActivate: (openInSplit: boolean) => void;
  onDragStart: () => void;
}) {
  const { splitProps } = experimental_useSidebarNavigationSplit(item.id, {
    activation: "distance",
    onDragStart,
  });

  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.isDisabled}
      aria-busy={item.isLoading || undefined}
      {...splitProps}
      onPointerDown={composeRibbonPointerDown(phone, splitProps.onPointerDown)}
      onClick={(event) => onActivate(event.metaKey || event.ctrlKey)}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
    >
      <NavigationIcon icon={item.icon} className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </button>
  );
}

function MenuButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full rounded px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </button>
  );
}

function menuStyle(root: HTMLDivElement | null, openBelow: boolean): CSSProperties {
  const button = root?.querySelector("button");
  if (!(button instanceof HTMLElement) || typeof window === "undefined") {
    return { top: 0, left: 0, maxHeight: 240 };
  }
  const rect = button.getBoundingClientRect();
  const margin = 8;
  const maxHeight = Math.min(320, window.innerHeight - margin * 2);
  if (!openBelow) {
    const top = Math.min(Math.max(margin, rect.top), window.innerHeight - margin - maxHeight);
    return { top, left: rect.right + 6, maxHeight };
  }
  const bounds = button.closest('[data-sidebar="sidebar"]')?.getBoundingClientRect();
  const minLeft = (bounds?.left ?? 0) + margin;
  const maxRight = (bounds?.right ?? window.innerWidth) - margin;
  const width = Math.min(220, Math.max(0, maxRight - minLeft));
  const left = Math.max(minLeft, Math.min(rect.left, maxRight - width));
  const top = Math.min(rect.bottom + 6, Math.max(margin, window.innerHeight - margin - maxHeight));
  return { top, left, maxHeight, maxWidth: width };
}

function buttonClass(
  isActive: boolean,
  isLoading: boolean,
  phone: boolean,
  box?: string,
) {
  const size = box ?? (phone ? "h-9 min-w-9 flex-1" : "h-7 w-[calc(100%-12px)] shrink-0 grow-0");
  const tone = isActive
    ? "bg-sidebar-accent text-sidebar-foreground"
    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground";
  const loading = isLoading ? "opacity-55" : "";
  const layout = phone ? "place-items-center" : "grid-cols-[1.75rem_minmax(0,1fr)] justify-items-center gap-1.5 mx-[6px]";
  return `grid ${size} ${layout} items-center rounded ${tone} ${loading}`;
}

function glyphClass(phone: boolean) {
  return phone ? "size-5" : "size-4";
}

function composeRibbonPointerDown(
  phone: boolean,
  onPointerDown?: (event: ReactPointerEvent<HTMLElement>) => void,
) {
  return (event: ReactPointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event);
    if (ribbonTapKind({ phone, isPrimary: event.isPrimary }) === null) return;
    postRibbonTap(readHapticBridge(window));
  };
}

function itemLabel(item: ExperimentalSidebarNavigationItem, showShortcut: boolean) {
  if (showShortcut && item.shortcut) return `${item.label} (${item.shortcut.label})`;
  return item.label;
}

export default definePluginApp((app) => {
  app.slots.experimental_sidebarNavigation({
    id: "ribbon",
    title: "Ribbon",
    description: "데스크톱은 왼쪽 세로 리본, 모바일은 상단 가로 아이콘이다.",
    component: RibbonNavigation,
  });
});
