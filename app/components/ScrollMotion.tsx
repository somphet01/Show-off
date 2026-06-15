"use client";

import { useEffect } from "react";

const revealSelector = [
  ".campaign-copy > *",
  ".product-card",
  ".collection-hero > *",
  ".collection-tools > *",
  ".collection-card",
  ".product-detail > *",
  ".product-story > *",
  ".product-related > *",
  ".checkout-hero > *",
  ".checkout-order > *",
  ".checkout-payment > *",
  ".gallery-note > *",
  ".footer > *",
].join(",");

export function ScrollMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotion.matches) {
      document.body.classList.add("motion-reduced");
      return;
    }

    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector)).filter((element) => !element.closest(".action-panel, .site-menu"));

    const getSiblingIndex = (element: HTMLElement) => {
      const parent = element.parentElement;

      if (!parent) {
        return 0;
      }

      return Array.from(parent.children).indexOf(element);
    };

    elements.forEach((element, index) => {
      const cardIndex = element.matches(".product-card, .collection-card") ? getSiblingIndex(element) : index;

      element.classList.add("motion-reveal");
      element.style.setProperty("--motion-index", String(Math.min(index % 10, 9)));
      element.style.setProperty("--motion-delay", `${Math.min(index % 10, 8) * 48}ms`);
      element.style.setProperty("--card-motion-delay", `${Math.min(cardIndex, 8) * 72}ms`);
    });

    document.body.classList.add("motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      elements.forEach((element) => {
        element.classList.remove("motion-reveal", "is-visible");
        element.style.removeProperty("--motion-index");
        element.style.removeProperty("--motion-delay");
        element.style.removeProperty("--card-motion-delay");
      });
      document.body.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
