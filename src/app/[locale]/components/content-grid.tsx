"use client";

import { useLayoutEffect, useRef, useCallback, type ReactNode } from "react";

const GRID_UNIT = 72;
const SNAP_THRESHOLD = 1;
const MQ = "(min-width: 768px)";
const ARM_W = 3;
const ARM_L = 6;
const SIZE = ARM_L * 2 + ARM_W;

function measureHeights(
  elements: HTMLElement[],
  width: number,
): number[] {
  const clones: HTMLElement[] = [];
  for (const el of elements) {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText = `position:absolute;visibility:hidden;height:auto;width:${width}px;pointer-events:none`;
    document.body.appendChild(clone);
    clones.push(clone);
  }
  // Batch read after all writes
  const heights = clones.map((c) => c.offsetHeight);
  for (const c of clones) c.remove();
  return heights;
}

function snapSpans(left: number[], right: number[]): void {
  const leftCum: number[] = [];
  const rightCum: number[] = [];

  let sum = 0;
  for (const s of left) { sum += s; leftCum.push(sum); }
  sum = 0;
  for (const s of right) { sum += s; rightCum.push(sum); }

  for (let i = 0; i < leftCum.length; i++) {
    let bestJ = -1;
    let bestDiff = Infinity;

    for (let j = 0; j < rightCum.length; j++) {
      const diff = Math.abs(leftCum[i] - rightCum[j]);
      if (diff > 0 && diff <= SNAP_THRESHOLD && diff < bestDiff) {
        bestDiff = diff;
        bestJ = j;
      }
    }

    if (bestJ === -1) continue;

    const diff = leftCum[i] - rightCum[bestJ];
    if (diff > 0) {
      right[bestJ] += diff;
      for (let k = bestJ; k < rightCum.length; k++) {
        rightCum[k] = (k === 0 ? 0 : rightCum[k - 1]) + right[k];
      }
    } else {
      left[i] += -diff;
      for (let k = i; k < leftCum.length; k++) {
        leftCum[k] = (k === 0 ? 0 : leftCum[k - 1]) + left[k];
      }
    }
  }
}

function createMarker(
  wrapper: HTMLElement,
  x: number,
  y: number,
  armLeft: boolean,
): void {
  const half = (SIZE - ARM_W) / 2;
  const marker = document.createElement("div");
  marker.className = "grid-junction";
  marker.style.cssText = `position:absolute;top:${y}px;left:${x}px;width:${SIZE}px;height:${SIZE}px;pointer-events:none;z-index:2;transform:translate(-50%,-50%);`;

  const vBar = document.createElement("div");
  vBar.style.cssText = `position:absolute;top:0;left:${half}px;width:${ARM_W}px;height:${SIZE}px;background:var(--color-border);`;
  marker.appendChild(vBar);

  const hBar = document.createElement("div");
  hBar.style.cssText = armLeft
    ? `position:absolute;top:${half}px;left:0;width:${half + ARM_W}px;height:${ARM_W}px;background:var(--color-border);`
    : `position:absolute;top:${half}px;left:${half}px;width:${half + ARM_W}px;height:${ARM_W}px;background:var(--color-border);`;
  marker.appendChild(hBar);

  wrapper.appendChild(marker);
}

function removeMarkers(wrapper: HTMLElement) {
  wrapper
    .querySelectorAll(".grid-junction,.grid-vline")
    .forEach((el) => el.remove());
}

export function ContentGrid({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef(0);

  const sync = useCallback(() => {
    const wrapper = ref.current;
    if (!wrapper) return;

    const all = wrapper.querySelectorAll<HTMLElement>("[data-grid-col]");
    removeMarkers(wrapper);

    if (!window.matchMedia(MQ).matches) {
      wrapper.style.gridAutoRows = "";
      for (const s of all) s.style.gridRowEnd = "";
      return;
    }

    wrapper.style.gridAutoRows = "";
    for (const s of all) s.style.gridRowEnd = "";

    const colWidth = wrapper.offsetWidth / 2;
    const colX = Math.round(colWidth);

    const allEls = Array.from(all);
    const heights = measureHeights(allEls, colWidth);

    const leftEls: HTMLElement[] = [];
    const rightEls: HTMLElement[] = [];
    const leftSpans: number[] = [];
    const rightSpans: number[] = [];

    for (let i = 0; i < allEls.length; i++) {
      const el = allEls[i];
      const span = Math.ceil(heights[i] / GRID_UNIT);
      if (el.dataset.gridCol === "left") {
        leftEls.push(el);
        leftSpans.push(span);
      } else {
        rightEls.push(el);
        rightSpans.push(span);
      }
    }

    snapSpans(leftSpans, rightSpans);

    for (let i = 0; i < leftEls.length; i++) {
      leftEls[i].style.gridRowEnd = `span ${leftSpans[i]}`;
    }
    for (let i = 0; i < rightEls.length; i++) {
      rightEls[i].style.gridRowEnd = `span ${rightSpans[i]}`;
    }

    wrapper.style.gridAutoRows = `${GRID_UNIT}px`;

    const vLine = document.createElement("div");
    vLine.className = "grid-vline";
    vLine.style.cssText = `position:absolute;top:0;bottom:0;left:${colX}px;width:1px;background:var(--color-border);pointer-events:none;z-index:1;`;
    wrapper.appendChild(vLine);

    const wrapperTop = wrapper.getBoundingClientRect().top;

    for (const el of leftEls) {
      const y = Math.round(el.getBoundingClientRect().bottom - wrapperTop);
      createMarker(wrapper, colX, y, true);
      createMarker(wrapper, 0, y, false);
    }
    for (const el of rightEls) {
      if (!el.offsetHeight) continue;
      const y = Math.round(el.getBoundingClientRect().bottom - wrapperTop);
      createMarker(wrapper, colX, y, false);
    }
  }, []);

  useLayoutEffect(() => {
    sync();

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(sync);
    });
    ro.observe(ref.current!);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId.current);
      if (ref.current) removeMarkers(ref.current);
    };
  }, [sync]);

  return (
    <div
      ref={ref}
      className="content-grid md:col-span-2 md:grid md:grid-cols-2 md:[grid-auto-flow:dense]"
      style={{ gridAutoRows: "auto" }}
    >
      {children}
    </div>
  );
}
