"use client";

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode, useEffect, useMemo, useRef } from "react";

type HomeAutoRailProps = {
  children: ReactNode;
  direction: "left" | "right";
};

const speedPxPerSecond = 20;
const horizontalIntentThreshold = 12;
const noRailDragSelector = "a.product-card, button, input, select, textarea, [role='button'], .quick-add, .save-product-button";

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
    let dragState: { id: number; x: number; y: number; scrollLeft: number; active: boolean } | null = null;
    let suppressClickUntil = 0;

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
      const target = event.target instanceof Element ? event.target : null;

      if (target?.closest(noRailDragSelector)) {
        pauseForUser();
        pointerStart = null;
        dragState = null;
        return;
      }

      pointerStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        type: event.pointerType,
      };

      if (event.pointerType !== "touch") {
        pauseForUser();
        if (event.button === 0) {
          dragState = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            scrollLeft: track.scrollLeft,
            active: false,
          };
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (dragState?.id === event.pointerId) {
        const deltaX = event.clientX - dragState.x;
        const deltaY = event.clientY - dragState.y;

        if (!dragState.active && Math.abs(deltaX) >= horizontalIntentThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
          dragState.active = true;
          suppressClickUntil = performance.now() + 350;
          track.classList.add("is-dragging");
          track.setPointerCapture(event.pointerId);
        }

        if (dragState.active) {
          event.preventDefault();
          track.scrollLeft = dragState.scrollLeft - deltaX;
          currentScroll = track.scrollLeft;
        }

        return;
      }

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
      if (dragState?.id === event.pointerId) {
        if (track.hasPointerCapture(event.pointerId)) {
          track.releasePointerCapture(event.pointerId);
        }

        currentScroll = track.scrollLeft;
        dragState = null;
        track.classList.remove("is-dragging");
      }

      if (pointerStart?.id === event.pointerId && pointerStart.type === "touch") {
        pauseForUser();
      }
      pointerStart = null;
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        pauseForUser();
        track.scrollLeft += event.deltaY;
        currentScroll = track.scrollLeft;
        return;
      }

      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        pauseForUser();
        currentScroll = track.scrollLeft;
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (performance.now() > suppressClickUntil) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      suppressClickUntil = 0;
    };

    const handleDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    track.addEventListener("pointerdown", handlePointerDown, { passive: true });
    track.addEventListener("pointermove", handlePointerMove, { passive: false });
    track.addEventListener("pointerup", handlePointerUp, { passive: true });
    track.addEventListener("pointercancel", handlePointerUp, { passive: true });
    track.addEventListener("wheel", handleWheel, { passive: false });
    track.addEventListener("click", handleClick, true);
    track.addEventListener("dragstart", handleDragStart);
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
      track.removeEventListener("click", handleClick, true);
      track.removeEventListener("dragstart", handleDragStart);
      track.removeEventListener("focusin", pauseForUser);
    };
  }, [direction]);

  return (
    <div className="rail-track rail-auto-motion" data-direction={direction} ref={trackRef}>
      {repeatedItems}
    </div>
  );
}
