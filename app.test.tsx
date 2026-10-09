import assert from "node:assert/strict";
import { before, afterEach, describe, it } from "node:test";
import React, { act } from "react";
import type { ExperimentalSidebarNavigationItem, ExperimentalSidebarNavigationProps } from "@get-bb/plugin-sdk/app";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLDivElement', 'Element', 'Node', 'MutationObserver', 'getComputedStyle'] as const) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
}
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true, writable: true });
let phone = false;
Object.defineProperty(dom.window, 'matchMedia', { value: (q: string) => ({ matches: phone && ['(hover: none)', '(pointer: coarse)', '(any-pointer: coarse)'].includes(q), addEventListener() {}, removeEventListener() {} }) });
Object.defineProperty(globalThis, "ResizeObserver", { value: class { observe() {} disconnect() {} }, configurable: true });
const { fireEvent, cleanup } = await import('@testing-library/react');
const { loadPluginApp, renderSlot } = await import('@get-bb/plugin-sdk/testing/app');
let app: Awaited<ReturnType<typeof loadPluginApp>>;
before(async () => { app = await loadPluginApp(() => import('./app.tsx')); });
afterEach(() => { cleanup(); phone = false; });

function mount(mode: string) {
  const registration = app.experimentalSidebarNavigations[0]!;
  const Ribbon = registration.component;
  const slot = renderSlot({ ...registration, component: (props: ExperimentalSidebarNavigationProps) => (
    <div style={{ '--sidebar-width': '320px' } as React.CSSProperties}>
      <div data-side="left">
        <div data-sidebar="gap" style={{ "--sidebar-width": "320px" } as React.CSSProperties} />
        <div data-sidebar="panel" style={{ "--sidebar-width": "320px" } as React.CSSProperties}><div data-sidebar="sidebar">
          <div data-testid="app-sidebar-top-reserve-row" />
          <div data-testid="sidebar-navigation-region"><Ribbon {...props} /></div>
          <div data-sidebar="content">Threads</div>
          <div data-sidebar="footer" />
        </div></div>
      </div>
    </div>
  ) }, { isCompactViewport: false, experimental_Original: () => null }, {
    pluginId: "bb-ribbon",
    settings: { desktopHoverMode: mode },
    sidebarNavigation: { items: [{ id: 'tasks', label: 'Tasks', icon: { kind: 'host', name: 'search' }, action: { kind: 'search-threads' }, isVisible: true, isDisabled: false, isLoading: false, pluginId: null, shortcut: null, experimental_Accessory: null }] satisfies ExperimentalSidebarNavigationItem[] },
  });
  const rail = document.querySelector<HTMLElement>('[data-bb-sidebar-ribbon]')!;
  const shell = document.querySelector<HTMLElement>('[data-side="left"]')!;
  const host = document.querySelector<HTMLElement>('[data-sidebar="sidebar"]')!;
  const panel = document.querySelector<HTMLElement>('[data-sidebar="panel"]')!;
  return { slot, rail, shell, host, panel };
}

describe('desktop ribbon hover', () => {
  it('reveals labels over threads, keeps sidebar width, and collapses on leave', () => {
    const { rail, shell, host } = mount('스레드 목록 위에 겹치기');
    assert.equal(rail.getAttribute('data-bb-plugin'), 'bb-ribbon');
    fireEvent.mouseEnter(rail);
    assert.equal(rail.dataset.ribbonExpanded, 'true');
    assert.equal(rail.style.width, '12rem');
    assert.equal(host.style.gridTemplateColumns, '2.5rem minmax(0, 1fr)');
    assert.equal(shell.style.getPropertyValue('--sidebar-width'), '');
    assert.equal(rail.querySelector('[data-ribbon-label]')?.textContent, 'Tasks');
    assert.equal(document.querySelector('[role="tooltip"]'), null);
    fireEvent.mouseLeave(rail);
    assert.equal(rail.dataset.ribbonExpanded, 'false');
  });

  it('adds the same delta to the sidebar and grid so the thread width is preserved', () => {
    const { rail, panel, host, slot } = mount('사이드바 너비 늘리기');
    fireEvent.mouseEnter(rail);
    assert.equal(host.style.gridTemplateColumns, '12rem minmax(0, 1fr)');
    assert.equal(panel.style.getPropertyValue('--sidebar-width'), 'calc(320px + 9.5rem)');
    fireEvent.mouseLeave(rail);
    assert.equal(panel.style.getPropertyValue('--sidebar-width'), '320px');
    assert.equal(host.style.gridTemplateColumns, '2.5rem minmax(0, 1fr)');
    fireEvent.mouseEnter(rail);
    slot.lifecycle.unmount();
    assert.equal(panel.style.getPropertyValue('--sidebar-width'), '320px');
  });

  it('stays expanded during keyboard navigation and closes when focus leaves', () => {
    const { rail } = mount('스레드 목록 위에 겹치기');
    const item = rail.querySelector('button')!;
    // jsdom does not implement the browser's keyboard focus-visible heuristic.
    const matches = item.matches.bind(item);
    item.matches = (selector) => selector === ':focus-visible' || matches(selector);
    act(() => item.focus());
    assert.equal(rail.dataset.ribbonExpanded, 'true');
    fireEvent.mouseLeave(rail);
    assert.equal(rail.dataset.ribbonExpanded, 'true');
    act(() => item.blur());
    assert.equal(rail.dataset.ribbonExpanded, 'false');
  });

  it('collapses after pointer activation even while the button retains focus', () => {
    const { rail } = mount('스레드 목록 위에 겹치기');
    const item = rail.querySelector('button')!;
    fireEvent.mouseEnter(rail);
    act(() => item.focus());
    fireEvent.pointerDown(item);
    fireEvent.click(item);
    fireEvent.mouseLeave(rail);
    assert.equal(rail.dataset.ribbonExpanded, 'false');
  });

  it('does not expand on a phone', () => {
    phone = true;
    const { rail, shell } = mount('사이드바 너비 늘리기');
    fireEvent.mouseEnter(rail);
    assert.equal(rail.dataset.ribbonExpanded, 'false');
    assert.equal(rail.dataset.ribbonAxis, 'x');
    assert.equal(shell.style.getPropertyValue('--sidebar-width'), '');
  });
});
