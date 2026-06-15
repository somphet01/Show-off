"use client";

import { useEffect } from "react";

export function ScrollRestorationReset() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

    if (navigation?.type === "reload") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  return null;
}
