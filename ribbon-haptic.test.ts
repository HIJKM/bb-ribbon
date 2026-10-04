import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { postRibbonTap, readHapticBridge, ribbonTapKind } from "./ribbon-haptic.ts";

describe("ribbonTapKind", () => {
  it("uses the sidebar-open impact for a primary press on the mobile ribbon", () => {
    assert.equal(ribbonTapKind({ isCompactViewport: true, isPrimary: true }), "impact-light");
  });

  it("stays quiet on the desktop rail and on a secondary pointer", () => {
    assert.equal(ribbonTapKind({ isCompactViewport: false, isPrimary: true }), null);
    assert.equal(ribbonTapKind({ isCompactViewport: true, isPrimary: false }), null);
  });
});

describe("postRibbonTap", () => {
  it("posts impact-light only when the shell can haptic", () => {
    const messages: unknown[] = [];
    const bridge = {
      capabilities: ["haptic"],
      post(message: unknown) {
        messages.push(message);
      },
    };

    assert.equal(postRibbonTap(bridge), true);
    assert.deepEqual(messages, [{ type: "haptic", kind: "impact-light" }]);
    assert.equal(postRibbonTap({ ...bridge, capabilities: [] }), false);
    assert.equal(postRibbonTap(null), false);
    assert.deepEqual(messages, [{ type: "haptic", kind: "impact-light" }]);
  });

  it("swallows a bridge that throws", () => {
    assert.equal(
      postRibbonTap({
        capabilities: ["haptic"],
        post() {
          throw new Error("bridge down");
        },
      }),
      false,
    );
  });
});

describe("readHapticBridge", () => {
  it("reads bb.native only when post is a function", () => {
    const post = () => {};
    assert.equal(readHapticBridge({ bb: { native: { post, capabilities: ["haptic"] } } })?.post, post);
    assert.equal(readHapticBridge({ bb: { native: { capabilities: ["haptic"] } } }), null);
    assert.equal(readHapticBridge(null), null);
  });
});
