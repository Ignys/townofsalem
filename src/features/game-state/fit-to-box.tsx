"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface FitToBoxProps {
  children: ReactNode;
  /** Never shrink past this, so text cannot become unreadable. */
  minScale?: number;
}

/** Leaves a sliver of slack so sub-pixel rounding cannot clip the last line. */
const SAFETY = 0.98;

/**
 * Scales its content down until it fits the available box.
 *
 * The role sheet is only visible while the player holds a button, so they can
 * never scroll it — whatever does not fit is simply lost. Shrinking to fit is
 * therefore the only way to guarantee the whole sheet is readable.
 */
export function FitToBox({ children, minScale = 0.5 }: FitToBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;

    // offsetWidth/Height are layout sizes, so they ignore the transform we
    // apply below. That keeps this measurement independent of the current
    // scale and free of any feedback loop.
    const naturalWidth = content.offsetWidth;
    const naturalHeight = content.offsetHeight;
    if (naturalWidth === 0 || naturalHeight === 0) return;

    const next = Math.min(
      1,
      (box.clientWidth / naturalWidth) * SAFETY,
      (box.clientHeight / naturalHeight) * SAFETY,
    );
    setScale(Math.max(minScale, next));
  }, [minScale]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (boxRef.current) observer.observe(boxRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    // The content is taken out of flow and anchored to the top: a grid/flex
    // track would otherwise grow to the *unscaled* height, so "center" would
    // be the content's own centre rather than the box's, and it would spill.
    <div ref={boxRef} className="relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={contentRef}
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
        className="absolute inset-x-0 top-0"
      >
        {children}
      </div>
    </div>
  );
}
