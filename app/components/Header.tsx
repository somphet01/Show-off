"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary, Locale } from "../lib/i18n";

export function Header({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);
  const [hidden, setHidden] = useState(false);
  const nextLocale = locale === "en" ? "lo" : "en";

  useEffect(() => {
    lastYRef.current = window.scrollY;

    const updateHeader = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastYRef.current;

      if (currentY < 24) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }

      lastYRef.current = currentY;
      tickingRef.current = false;
    };

    const onScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(updateHeader);
        tickingRef.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`topbar${hidden ? " is-hidden" : ""}`}>
      <div className="navline">
        <div className="nav-left">
          <button className="hamburger" type="button" aria-label="Menu">
            <span />
            <span />
          </button>
          <a href="#shop">{dictionary.nav.shop}</a>
          <a href="#247">247</a>
        </div>
        <a className="logo logo-mark" href="#top" aria-label="Represent home">
          <span className="logo-r">R</span>
          <span className="logo-full">REPRESENT</span>
        </a>
        <div className="header-actions" aria-label="Shop actions">
          {[dictionary.nav.retail, dictionary.nav.vault, dictionary.nav.prestige, dictionary.nav.currency].map((link) => (
            <a href={`#${link.toLowerCase().replaceAll(" ", "-").replace("/", "")}`} key={link}>
              {link}
            </a>
          ))}
          <a className="language-link" href={`/${nextLocale}`} aria-label={`Switch to ${nextLocale}`}>
            {dictionary.switchLabel}
          </a>
          <a className="icon-link alerts" href="#alerts" aria-label="Alerts" />
          <a className="icon-link bookmark" href="#saved" aria-label="Saved" />
          <a className="icon-link search" href="#search" aria-label="Search" />
          <a className="icon-link account" href="#account" aria-label="Account" />
          <a className="icon-link bag" href="#bag" aria-label="Bag" />
        </div>
      </div>
    </header>
  );
}
