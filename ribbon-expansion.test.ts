import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { JSDOM } from "jsdom";
import { expandSidebarWidth } from "./ribbon-expansion.ts";

describe("temporary ribbon sidebar expansion", () => {
  function fixture() {
    const dom = new JSDOM('<div style="--sidebar-width: 320px"><div data-side="left"><div data-sidebar="gap" style="--sidebar-width: 320px"></div><div data-sidebar="panel" style="--sidebar-width: 320px"></div></div></div>');
    const shell = dom.window.document.querySelector<HTMLElement>('[data-side="left"]')!;
    // jsdom does not resolve inherited custom properties.
    const readWidth = () => shell.parentElement!.style.getPropertyValue("--sidebar-width");
    const panel = shell.querySelector<HTMLElement>('[data-sidebar="panel"]')!;
    const gap = shell.querySelector<HTMLElement>('[data-sidebar="gap"]')!;
    return { dom, shell, panel, gap, readWidth };
  }

  it("adds only the ribbon width delta and restores the host sidebar width", () => {
    const { dom, shell, panel, gap, readWidth } = fixture();
    const restore = expandSidebarWidth(shell, "9.5rem", readWidth);
    assert.equal(panel.style.getPropertyValue("--sidebar-width"), "calc(320px + 9.5rem)");
    assert.equal(gap.style.getPropertyValue("--sidebar-width"), "calc(320px + 9.5rem)");
    restore();
    assert.equal(panel.style.getPropertyValue("--sidebar-width"), "320px");
    assert.equal(shell.parentElement!.style.getPropertyValue("--sidebar-width"), "320px");
    dom.window.close();
  });

  it("uses the latest user resize while expanded and stops observing on cleanup", async () => {
    const { dom, shell, panel, gap, readWidth } = fixture();
    const restore = expandSidebarWidth(shell, "9.5rem", readWidth);
    panel.style.setProperty("--sidebar-width", "380px");
    gap.style.setProperty("--sidebar-width", "380px");
    await new Promise<void>((resolve) => dom.window.queueMicrotask(resolve));
    assert.equal(panel.style.getPropertyValue("--sidebar-width"), "calc(380px + 9.5rem)");
    restore();
    panel.style.setProperty("--sidebar-width", "420px");
    await new Promise<void>((resolve) => dom.window.queueMicrotask(resolve));
    assert.equal(panel.style.getPropertyValue("--sidebar-width"), "420px");
    dom.window.close();
  });

  it("restores an existing inline width and its priority", () => {
    const { dom, shell, panel, readWidth } = fixture();
    panel.style.setProperty("--sidebar-width", "280px", "important");
    const restore = expandSidebarWidth(shell, "9.5rem", readWidth);
    assert.equal(panel.style.getPropertyValue("--sidebar-width"), "calc(280px + 9.5rem)");
    restore();
    assert.equal(panel.style.getPropertyValue("--sidebar-width"), "280px");
    assert.equal(panel.style.getPropertyPriority("--sidebar-width"), "important");
    dom.window.close();
  });
});
