"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const INTRO_STORAGE_KEY = "show-off-intro-seen-v3";
const INTRO_SOUND_STORAGE_KEY = "show-off-intro-sound-enabled-v1";
const DEFAULT_INTRO_DURATION_MS = 5200;
const LOGO_START_MS = 900;
const WORDMARK_TO_SYMBOL_MS = 1080;
const SYMBOL_HERO_MS = 1320;
const MIN_SYMBOL_HOLD_MS = 1800;
const BLACK_FADE_MS = 720;
const PAGE_REVEAL_MS = 920;

function getIntroTiming(durationMs: number) {
  const playableDuration = Number.isFinite(durationMs) && durationMs > 2600 ? durationMs : DEFAULT_INTRO_DURATION_MS;
  const logoStart = Math.min(LOGO_START_MS, Math.max(760, playableDuration * 0.24));
  const symbolVisibleAt = logoStart + WORDMARK_TO_SYMBOL_MS;
  const symbolHeroAt = symbolVisibleAt + 240;
  const fadeToBlackAt = Math.max(symbolHeroAt + SYMBOL_HERO_MS, playableDuration - BLACK_FADE_MS);
  const revealPageAt = fadeToBlackAt + BLACK_FADE_MS;
  const removeAt = revealPageAt + PAGE_REVEAL_MS;

  return {
    logoStart,
    symbolHeroAt,
    fadeToBlackAt,
    revealPageAt,
    removeAt,
  };
}

export function IntroOverlay() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [isSymbolHero, setIsSymbolHero] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [soundPromptVisible, setSoundPromptVisible] = useState(false);
  const [durationMs, setDurationMs] = useState(DEFAULT_INTRO_DURATION_MS);

  const isStorefront = Boolean(pathname) && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!isStorefront) return;

    let shouldShow = true;
    try {
      shouldShow = window.sessionStorage.getItem(INTRO_STORAGE_KEY) !== "1";
    } catch {
      shouldShow = true;
    }

    if (shouldShow) {
      setShowLogo(false);
      setIsSymbolHero(false);
      setIsBlackout(false);
      setIsRevealing(false);
      setSoundPromptVisible(false);
      setIsVisible(true);
    }
  }, [isStorefront]);

  useEffect(() => {
    if (!isVisible) return;

    document.body.classList.add("intro-playing");

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.volume = 1;
      video.muted = false;

      const playAttempt = video.play();
      if (playAttempt) {
        playAttempt
          .then(() => {
            setSoundPromptVisible(false);
            try {
              window.localStorage.setItem(INTRO_SOUND_STORAGE_KEY, "1");
            } catch {
              // Ignore storage failures and keep playback running.
            }
          })
          .catch(() => {
            setSoundPromptVisible(true);
            video.muted = true;
            video.play().catch(() => undefined);
          });
      }
    }

    return () => {
      document.body.classList.remove("intro-playing");
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const timers: number[] = [];
    const timing = getIntroTiming(durationMs);

    timers.push(window.setTimeout(() => setShowLogo(true), timing.logoStart));
    timers.push(window.setTimeout(() => setIsSymbolHero(true), timing.symbolHeroAt));
    timers.push(window.setTimeout(() => setIsBlackout(true), timing.fadeToBlackAt));
    timers.push(window.setTimeout(() => setIsRevealing(true), timing.revealPageAt));
    timers.push(
      window.setTimeout(() => {
        try {
          window.sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
        } catch {
          // Ignore storage failures; the overlay still closes for this visit.
        }
        setIsVisible(false);
      }, timing.removeAt),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [durationMs, isVisible]);

  useEffect(() => {
    if (!isVisible) {
      document.body.classList.remove("intro-playing");
    }
  }, [isVisible]);

  const handleUnlockSound = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;
    video
      .play()
      .then(() => {
        setSoundPromptVisible(false);
        try {
          window.localStorage.setItem(INTRO_SOUND_STORAGE_KEY, "1");
        } catch {
          // Ignore storage failures and keep playback running.
        }
      })
      .catch(() => {
        setSoundPromptVisible(true);
      });
  };

  if (!isVisible || !isStorefront) {
    return null;
  }

  return (
    <div
      className={`intro-overlay${showLogo ? " is-logo-phase" : ""}${isSymbolHero ? " is-symbol-hero" : ""}${isBlackout ? " is-blackout" : ""}${isRevealing ? " is-revealing" : ""}`}
      aria-hidden="true"
      onPointerDown={soundPromptVisible ? handleUnlockSound : undefined}
    >
      <video
        ref={videoRef}
        className="intro-video"
        src="/assets/show-off-intro.mp4"
        autoPlay
        playsInline
        preload="auto"
        onLoadedMetadata={(event) => {
          const seconds = event.currentTarget.duration;
          if (Number.isFinite(seconds) && seconds > 0) {
            setDurationMs(seconds * 1000);
          }
        }}
      />
      <div className="intro-logo-stage">
        <img
          className="intro-logo intro-logo-wordmark"
          src="/assets/show-off-wordmark-white.png"
          alt=""
          draggable={false}
        />
        <img
          className="intro-logo intro-logo-symbol"
          src="/assets/show-off-symbol-white.png"
          alt=""
          draggable={false}
        />
      </div>
      {soundPromptVisible ? (
        <button
          className="intro-sound-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleUnlockSound();
          }}
        >
          แตะเพื่อเปิดเสียง
        </button>
      ) : null}
    </div>
  );
}
