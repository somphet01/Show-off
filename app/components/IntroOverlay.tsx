"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { silenceIntroAudioEvent } from "../lib/intro-audio";
import { defaultIntroSettings, type IntroSettings } from "../lib/site-content-types";

const INTRO_STORAGE_KEY = "show-off-intro-seen-v4";
const STOREFRONT_BOOT_STORAGE_KEY = "show-off-storefront-booted-v1";
const INTRO_SOUND_STORAGE_KEY = "show-off-intro-sound-enabled-v1";
const DEFAULT_INTRO_DURATION_MS = 5200;
const LOGO_START_MS = 120;
const WORDMARK_TO_SYMBOL_MS = 1080;
const SYMBOL_HERO_MS = 1320;
const MIN_SYMBOL_HOLD_MS = 500;
const BLACK_FADE_MS = 720;
const PAGE_REVEAL_MS = 420;
const INTRO_BOOT_ATTR = "data-intro-boot";
const INTRO_READY_ATTR = "data-intro-ready";

function getIntroTiming(durationMs: number, fadeMs = BLACK_FADE_MS) {
  const playableDuration = Number.isFinite(durationMs) && durationMs > 2600 ? durationMs : DEFAULT_INTRO_DURATION_MS;
  const logoStart = Math.min(LOGO_START_MS, Math.max(760, playableDuration * 0.24));
  const symbolVisibleAt = logoStart + WORDMARK_TO_SYMBOL_MS;
  const symbolHeroAt = symbolVisibleAt + 240;
  const fadeToBlackAt = Math.max(symbolHeroAt + MIN_SYMBOL_HOLD_MS, playableDuration);
  const revealPageAt = fadeToBlackAt + fadeMs;
  const removeAt = revealPageAt + PAGE_REVEAL_MS;

  return {
    logoStart,
    symbolHeroAt,
    fadeToBlackAt,
    revealPageAt,
    removeAt,
  };
}

function stopIntroVideo(video: HTMLVideoElement | null) {
  if (!video) return;

  video.pause();
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.removeAttribute("autoplay");
}

function readBootReady() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.documentElement.getAttribute(INTRO_READY_ATTR) === "1";
}

function clearBootPending() {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.removeAttribute(INTRO_BOOT_ATTR);
}

function clearBootState() {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.removeAttribute(INTRO_BOOT_ATTR);
  document.documentElement.removeAttribute(INTRO_READY_ATTR);
}

function markIntroCookieSeen() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${INTRO_STORAGE_KEY}=1; path=/; SameSite=Lax`;
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
    window.sessionStorage.setItem(STOREFRONT_BOOT_STORAGE_KEY, "1");
  } catch {
    // Ignore storage failures; the overlay still closes for this visit.
  }

  markIntroCookieSeen();
}

function markStorefrontBooted() {
  try {
    window.sessionStorage.setItem(STOREFRONT_BOOT_STORAGE_KEY, "1");
  } catch {
    // Ignore storage failures.
  }
}

export function IntroOverlay({ settings = defaultIntroSettings }: { settings?: IntroSettings }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const revealTimersRef = useRef<number[]>([]);
  const hasStartedExitRef = useRef(false);
  const bootReadyOnMountRef = useRef(readBootReady());
  const [isVisible, setIsVisible] = useState(() => readBootReady());
  const [hasConfirmedIntro, setHasConfirmedIntro] = useState(() => readBootReady());
  const [showLogo, setShowLogo] = useState(false);
  const [isSymbolHero, setIsSymbolHero] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [soundPromptVisible, setSoundPromptVisible] = useState(false);
  const isPathReady = typeof pathname === "string";
  const isStorefront = isPathReady && !pathname.startsWith("/admin");
  const introQuery = searchParams?.get("intro") ?? "";

  const finishIntro = () => {
    if (hasStartedExitRef.current) return;

    hasStartedExitRef.current = true;
    setIsBlackout(true);
    setSoundPromptVisible(false);
    stopIntroVideo(videoRef.current);

    revealTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    revealTimersRef.current = [
      window.setTimeout(() => setIsRevealing(true), settings.fadeMs),
      window.setTimeout(() => {
        markIntroSeen();
        clearBootState();
        setIsVisible(false);
      }, settings.fadeMs + PAGE_REVEAL_MS),
    ];
  };

  useEffect(() => {
    if (!isPathReady) return;

    if (!isStorefront || !settings.enabled) {
      stopIntroVideo(videoRef.current);
      setIsVisible(false);
      setHasConfirmedIntro(false);
      setSoundPromptVisible(false);
      clearBootState();
      return;
    }

    let shouldShow = true;
    try {
      const forceIntro = introQuery === "1";
      const hasBootedStorefront = window.sessionStorage.getItem(STOREFRONT_BOOT_STORAGE_KEY) === "1";
      shouldShow =
        readBootReady() ||
        forceIntro ||
        !settings.showOncePerVisit ||
        (!hasBootedStorefront && window.sessionStorage.getItem(INTRO_STORAGE_KEY) !== "1");
    } catch {
      shouldShow = readBootReady();
    }

    if (shouldShow) {
      markIntroSeen();
      hasStartedExitRef.current = false;
      revealTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      revealTimersRef.current = [];
      setHasConfirmedIntro(true);
      setShowLogo(false);
      setIsSymbolHero(false);
      setIsBlackout(false);
      setIsRevealing(false);
      setSoundPromptVisible(false);
      setIsVisible(true);
    } else {
      setHasConfirmedIntro(false);
      setIsVisible(false);
      setSoundPromptVisible(false);
      hasStartedExitRef.current = false;
      markStorefrontBooted();
      clearBootState();
    }
  }, [introQuery, isPathReady, isStorefront, settings.enabled, settings.showOncePerVisit]);

  useEffect(() => {
    const handleSilence = () => {
      hasStartedExitRef.current = true;
      revealTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      revealTimersRef.current = [];
      setSoundPromptVisible(false);
      stopIntroVideo(videoRef.current);
    };

    window.addEventListener(silenceIntroAudioEvent, handleSilence);
    return () => window.removeEventListener(silenceIntroAudioEvent, handleSilence);
  }, []);

  useLayoutEffect(() => {
    if (!isVisible || !hasConfirmedIntro) return;

    clearBootPending();
    document.body.classList.add("intro-playing");

    return () => {
      document.body.classList.remove("intro-playing");
    };
  }, [hasConfirmedIntro, isVisible]);

  useEffect(() => {
    if (!isVisible || !hasConfirmedIntro) return;

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.defaultMuted = !settings.audioEnabled;
      video.muted = !settings.audioEnabled;
      video.volume = settings.audioEnabled ? 1 : 0;

      const playAttempt = video.play();
      if (playAttempt) {
        playAttempt
          .then(() => {
            setSoundPromptVisible(false);
            if (settings.audioEnabled) {
              try {
                window.localStorage.setItem(INTRO_SOUND_STORAGE_KEY, "1");
              } catch {
                // Ignore storage failures and keep playback running.
              }
            }
          })
          .catch(() => {
            video.muted = true;
            video.defaultMuted = true;
            video.volume = 0;
            setSoundPromptVisible(true);
            video.play().catch(() => undefined);
          });
      }
    }

    return () => {
      revealTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      revealTimersRef.current = [];
      stopIntroVideo(videoRef.current);
    };
  }, [hasConfirmedIntro, isVisible, settings.audioEnabled]);

  useEffect(() => {
    if (!isVisible || !hasConfirmedIntro) return;

    const timers: number[] = [];
    const timing = getIntroTiming(settings.durationMs || DEFAULT_INTRO_DURATION_MS, settings.fadeMs);

    timers.push(window.setTimeout(() => setShowLogo(true), timing.logoStart));
    timers.push(window.setTimeout(() => setIsSymbolHero(true), timing.symbolHeroAt));
    timers.push(window.setTimeout(finishIntro, timing.fadeToBlackAt));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [hasConfirmedIntro, isVisible, settings.durationMs, settings.fadeMs]);

  useEffect(() => {
    if (!isVisible) {
      if (bootReadyOnMountRef.current) {
        bootReadyOnMountRef.current = false;
        return;
      }

      revealTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      revealTimersRef.current = [];
      stopIntroVideo(videoRef.current);
      clearBootState();
      document.body.classList.remove("intro-playing");
    }
  }, [isVisible]);

  const handleUnlockSound = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.defaultMuted = false;
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

  if (isPathReady && !isStorefront) {
    return null;
  }

  return (
    <div
      className={`intro-overlay${isVisible ? " is-active" : " is-hidden"}${showLogo ? " is-logo-phase" : ""}${isSymbolHero ? " is-symbol-hero" : ""}${isBlackout ? " is-blackout" : ""}${isRevealing ? " is-revealing" : ""}`}
      aria-hidden="true"
      suppressHydrationWarning
      onPointerDown={soundPromptVisible ? handleUnlockSound : undefined}
    >
      {settings.mediaType === "video" ? (
        <video
          ref={videoRef}
          className="intro-video"
          src={settings.src}
          playsInline
          preload="auto"
          onEnded={finishIntro}
        />
      ) : (
        <img className="intro-video" src={settings.src} alt="" draggable={false} />
      )}
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
