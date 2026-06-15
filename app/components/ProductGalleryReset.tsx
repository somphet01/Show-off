"use client";

import { useEffect } from "react";

export function ProductGalleryReset() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ left: 0, top: window.scrollY });
    document.querySelectorAll<HTMLElement>(".product-gallery").forEach((gallery) => {
      gallery.scrollLeft = 0;
    });
  }, []);

  return null;
}
