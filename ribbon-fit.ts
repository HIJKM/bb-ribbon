/** How many items fit along one axis, leaving a slot for `...` when needed. */
export function fitVisibleCount(input: {
  available: number;
  padding: number;
  gap: number;
  itemSize: number;
  itemCount: number;
  /** An overflow button is required even when every item fits. */
  reserveOverflow: boolean;
}): number {
  const itemCount = Math.max(0, input.itemCount);
  const itemSize = input.itemSize;
  const gap = Math.max(0, input.gap);
  if (itemCount === 0 || itemSize <= 0) return itemCount;

  const inner = input.available - Math.max(0, input.padding);
  if (!input.reserveOverflow && stackHeight(itemCount, itemSize, gap) <= inner + 0.5) {
    return itemCount;
  }

  let count = itemCount;
  while (count > 0 && stackHeight(count + 1, itemSize, gap) > inner + 0.5) {
    count -= 1;
  }
  return count;
}

export function readCssPx(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function stackHeight(slots: number, itemSize: number, gap: number): number {
  if (slots <= 0) return 0;
  return slots * itemSize + (slots - 1) * gap;
}
