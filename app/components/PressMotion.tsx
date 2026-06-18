"use client";

import { useEffect } from "react";

const pressTargetSelector = [
  "button:not([disabled])",
  "input[type='button']:not([disabled])",
  "input[type='submit']:not([disabled])",
  "a[role='button']",
  ".campaign-copy a",
  ".button-row a",
  ".rail-cta",
  ".cart-panel-body a",
  ".saved-empty-link",
  ".checkout-empty a",
  ".checkout-contact-panel a",
  ".admin-v2-action-button",
].join(",");

export function PressMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      return;
    }

    const activeAnimations = new WeakMap<HTMLElement, Animation>();

    const playPress = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return;
      }

      const control = target.closest<HTMLElement>(pressTargetSelector);
      if (!control) {
        return;
      }

      activeAnimations.get(control)?.cancel();
      const animation = control.animate(
        [
          { scale: "1", offset: 0, easing: "cubic-bezier(0.4, 0, 1, 1)" },
          { scale: "0.94", offset: 0.3, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
          { scale: "1.018", offset: 0.72, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          { scale: "1", offset: 1 },
        ],
        { duration: 320 },
      );
      activeAnimations.set(control, animation);
    };

    const handlePointerDown = (event: PointerEvent) => playPress(event.target);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.repeat && (event.key === "Enter" || event.key === " ")) {
        playPress(event.target);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
