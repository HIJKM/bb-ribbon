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

function mount(expandOnHover = true) {
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
    settings: { expandOnHover },
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
    const { rail, shell, host } = mount();
    assert.equal(rail.getAttribute('data-bb-plugin'), 'bb-ribbon');
    fireEvent.mouseEnter(rail.querySelector('button')!);
    assert.equal(rail.dataset.ribbonExpanded, 'true');
    assert.equal(rail.style.width, '12rem');
    assert.equal(host.style.gridTemplateColumns, '2.5rem minmax(0, 1fr)');
    assert.equal(shell.style.getPropertyValue('--sidebar-width'), '');
    assert.equal(rail.querySelector('[data-ribbon-label]')?.textContent, 'Tasks');
    assert.equal(document.querySelector('[role="tooltip"]'), null);
    fireEvent.mouseLeave(rail);
    assert.equal(rail.dataset.ribbonExpanded, 'false');
  });

  it('keeps desktop row geometry, labels, and stacking stable throughout hover', () => {
    const { rail } = mount();
    const item = rail.querySelector('button')!;
    const label = item.querySelector<HTMLElement>('[data-ribbon-label]')!;
    const more = rail.querySelector<HTMLElement>('[data-ribbon-overflow]')!;
    const itemClass = item.className;
    const moreClass = more.className;
    assert.ok(label, 'labels remain mounted while collapsed');
    assert.equal(label.style.opacity, '0');
    assert.equal(rail.style.zIndex, '30');
    fireEvent.mouseEnter(rail);
    assert.equal(item.querySelector('[data-ribbon-label]'), label);
    assert.equal(item.className, itemClass);
    assert.equal(more.className, moreClass);
    assert.equal(label.style.opacity, '1');
    fireEvent.mouseLeave(rail);
    assert.equal(item.querySelector('[data-ribbon-label]'), label);
    assert.equal(item.className, itemClass);
    assert.equal(more.className, moreClass);
    assert.equal(label.style.opacity, '0');
    assert.equal(rail.style.zIndex, '30', 'closing rail stays above threads until it shrinks');
  });

  it('keeps the icon rail collapsed when hover expansion is disabled', () => {
    const { rail, panel, host } = mount(false);
    fireEvent.mouseEnter(rail);
    assert.equal(rail.dataset.ribbonExpanded, 'false');
    assert.equal(rail.style.width, '2.5rem');
    assert.equal(panel.style.getPropertyValue('--sidebar-width'), '320px');
    assert.equal(host.style.gridTemplateColumns, '2.5rem minmax(0, 1fr)');
    assert.equal(rail.querySelector('button')!.title, '');
  });

  it('shows the existing adjacent tooltip on hover when expansion is disabled', () => {
    const { rail } = mount(false);
    const item = rail.querySelector('button')!;
    fireEvent.mouseEnter(item);
    const tooltip = document.querySelector<HTMLElement>('[role="tooltip"]');
    assert.ok(tooltip, 'hover should show a custom tooltip');
    assert.equal(tooltip.textContent, 'Tasks');
    assert.equal(item.getAttribute('aria-describedby'), tooltip.id);
    assert.equal(tooltip.getAttribute('data-bb-plugin'), 'bb-ribbon');
    assert.equal(tooltip.parentElement, document.body, 'tooltip escapes the clipped rail');
    assert.equal(rail.dataset.ribbonExpanded, 'false');
    fireEvent.mouseLeave(item);
    assert.equal(document.querySelector('[role="tooltip"]'), null);
    assert.equal(item.getAttribute('aria-describedby'), null);
  });

  it('shows the tooltip on keyboard focus when expansion is disabled', () => {
    const { rail } = mount(false);
    const item = rail.querySelector('button')!;
    act(() => item.focus());
    assert.equal(document.querySelector('[role="tooltip"]')?.textContent, 'Tasks');
    act(() => item.blur());
    assert.equal(document.querySelector('[role="tooltip"]'), null);
  });

  it('keeps phone titles without desktop tooltips when expansion is disabled', () => {
    phone = true;
    const { rail } = mount(false);
    const item = rail.querySelector('button')!;
    fireEvent.mouseEnter(item);
    act(() => item.focus());
    assert.equal(item.title, 'Tasks');
    assert.equal(document.querySelector('[role="tooltip"]'), null);
  });

  it('stays expanded during keyboard navigation and closes when focus leaves', () => {
    const { rail } = mount();
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
    const { rail } = mount();
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
    const { rail, shell } = mount();
    fireEvent.mouseEnter(rail);
    assert.equal(rail.dataset.ribbonExpanded, 'false');
    assert.equal(rail.dataset.ribbonAxis, 'x');
    assert.equal(shell.style.getPropertyValue('--sidebar-width'), '');
  });
});
