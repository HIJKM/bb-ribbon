import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitVisibleCount, readCssPx } from "./ribbon-fit.ts";

const base = {
  itemSize: 32,
  gap: 2,
  padding: 8,
  reserveOverflow: false,
};

describe("fitVisibleCount", () => {
  it("shows every item when the stack fits and nothing is reserved", () => {
    assert.equal(
      fitVisibleCount({ ...base, available: 200, itemCount: 3 }),
      3,
    );
  });

  it("keeps every item when a reserved overflow button still fits", () => {
    assert.equal(
      fitVisibleCount({
        ...base,
        available: 200,
        itemCount: 3,
        reserveOverflow: true,
      }),
      3,
    );
  });

  it("reserves the More slot when every item would fit without it", () => {
    assert.equal(
      fitVisibleCount({
        itemSize: 28,
        gap: 2,
        padding: 8,
        available: 100,
        itemCount: 3,
        reserveOverflow: true,
      }),
      2,
    );
  });

  it("drops only the items that do not fit beside the overflow button", () => {
    assert.equal(
      fitVisibleCount({ ...base, available: 200, itemCount: 10 }),
      4,
    );
  });

  it("keeps every desktop item when the rendered rail is tall enough", () => {
    assert.equal(
      fitVisibleCount({
        available: 725,
        padding: 8,
        gap: 2,
        itemSize: 28,
        itemCount: 12,
        reserveOverflow: true,
      }),
      12,
    );
  });

  it("drops one visible item when hidden items need the overflow button", () => {
    assert.equal(
      fitVisibleCount({
        itemSize: 28,
        gap: 2,
        padding: 8,
        available: 96,
        itemCount: 3,
        reserveOverflow: true,
      }),
      2,
    );
  });

  it("returns zero when even one item and the overflow button do not fit", () => {
    assert.equal(
      fitVisibleCount({ ...base, available: 40, itemCount: 3 }),
      0,
    );
  });

  it("returns zero for an empty list", () => {
    assert.equal(fitVisibleCount({ ...base, available: 200, itemCount: 0 }), 0);
  });

  it("shows every item when a button height is not known yet", () => {
    assert.equal(
      fitVisibleCount({ ...base, itemSize: 0, available: 0, itemCount: 5 }),
      5,
    );
  });
});

describe("readCssPx", () => {
  it("reads a pixel length and treats an unparsed gap as zero", () => {
    assert.equal(readCssPx("2px"), 2);
    assert.equal(readCssPx("normal"), 0);
    assert.equal(readCssPx("-4px"), 0);
  });
});
