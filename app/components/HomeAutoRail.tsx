"use client";

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode, useEffect, useMemo, useRef } from "react";

type HomeAutoRailProps = {
  children: ReactNode;
  direction: "left" | "right";
};

const speedPxPerSecond = 20;
const horizontalIntentThreshold = 6;

export function HomeAutoRail({ children, direction }: HomeAutoRailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const railItems = useMemo(() => Children.toArray(children), [children]);
  const repeatedItems = useMemo(
    () => [
      ...railItems,
      ...railItems.map((child, index) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<Record<string, unknown>>, {
              key: `rail-repeat-${index}`,
              "aria-hidden": true,
              tabIndex: -1,
            })
          : child,
      ),
    ],
    [railItems],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let animationFrame = 0;
    let lastTime = performance.now();
    let isVisible = false;
    let pausedByUser = false;
    let currentScroll = track.scrollLeft;
    let pointerStart: { id: number; x: number; y: number; type: string } | null = null;

    const loopWidth = () => track.scrollWidth / 2;
    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    if (direction === "left" && track.scrollLeft <= 1) {
      track.scrollLeft = loopWidth();
      currentScroll = track.scrollLeft;
    }

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        const nextVisible = entry.isIntersecting;

        if (!nextVisible && isVisible) {
          pausedByUser = false;
          if (direction === "left") {
            track.scrollLeft = loopWidth();
            currentScroll = track.scrollLeft;
          }
        }

        isVisible = nextVisible;
        lastTime = performance.now();
      },
      { threshold: 0.01 },
    );

    visibilityObserver.observe(track);

    const animate = (time: number) => {
      const elapsed = Math.min(32, time - lastTime);
      lastTime = time;

      if (isVisible && !pausedByUser && maxScroll() > 1) {
        const distance = (speedPxPerSecond * elapsed) / 1000;

        if (direction === "right") {
          currentScroll += distance;
          if (currentScroll >= loopWidth()) {
            currentScroll -= loopWidth();
          }
          track.scrollLeft = currentScroll;
        } else {
          currentScroll -= distance;
          if (currentScroll <= 0) {
            currentScroll += loopWidth();
          }
          track.scrollLeft = currentScroll;
        }
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const pauseForUser = () => {
      currentScroll = track.scrollLeft;
      pausedByUser = true;
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        type: event.pointerType,
      };

      if (event.pointerType !== "touch") {
        pauseForUser();
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerStart || pointerStart.id !== event.pointerId || pointerStart.type !== "touch") {
        return;
      }

      const deltaX = Math.abs(event.clientX - pointerStart.x);
      const deltaY = Math.abs(event.clientY - pointerStart.y);

      if (deltaX >= horizontalIntentThreshold && deltaX > deltaY) {
        pauseForUser();
        pointerStart = null;
      } else if (deltaY >= horizontalIntentThreshold && deltaY > deltaX) {
        pointerStart = null;
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (pointerStart?.id === event.pointerId && pointerStart.type === "touch") {
        pauseForUser();
      }
      pointerStart = null;
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) {
        pauseForUser();
      }
    };

    track.addEventListener("pointerdown", handlePointerDown, { passive: true });
    track.addEventListener("pointermove", handlePointerMove, { passive: true });
    track.addEventListener("pointerup", handlePointerUp, { passive: true });
    track.addEventListener("pointercancel", handlePointerUp, { passive: true });
    track.addEventListener("wheel", handleWheel, { passive: true });
    track.addEventListener("focusin", pauseForUser);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      visibilityObserver.disconnect();
      track.removeEventListener("pointerdown", handlePointerDown);
      track.removeEventListener("pointermove", handlePointerMove);
      track.removeEventListener("pointerup", handlePointerUp);
      track.removeEventListener("pointercancel", handlePointerUp);
      track.removeEventListener("wheel", handleWheel);
      track.removeEventListener("focusin", pauseForUser);
    };
  }, [direction]);

  return (
    <div className="rail-track rail-auto-motion" data-direction={direction} ref={trackRef}>
      {repeatedItems}
    </div>
  );
}
