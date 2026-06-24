"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { silenceIntroAudioEvent } from "../lib/intro-audio";

const INTRO_STORAGE_KEY = "show-off-intro-seen-v4";
const INTRO_SOUND_STORAGE_KEY = "show-off-intro-sound-enabled-v1";
const DEFAULT_INTRO_DURATION_MS = 5200;
const LOGO_START_MS = 900;
const WORDMARK_TO_SYMBOL_MS = 1080;
const SYMBOL_HERO_MS = 1320;
const MIN_SYMBOL_HOLD_MS = 500;
const BLACK_FADE_MS = 720;
const PAGE_REVEAL_MS = 420;

function getIntroTiming(durationMs: number) {
  const playableDuration = Number.isFinite(durationMs) && durationMs > 2600 ? durationMs : DEFAULT_INTRO_DURATION_MS;
  const logoStart = Math.min(LOGO_START_MS, Math.max(760, playableDuration * 0.24));
  const symbolVisibleAt = logoStart + WORDMARK_TO_SYMBOL_MS;
  const symbolHeroAt = symbolVisibleAt + 240;
  const fadeToBlackAt = Math.max(symbolHeroAt + MIN_SYMBOL_HOLD_MS, playableDuration);
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

function clearIntroBootCover() {
  document.documentElement.classList.remove("intro-boot-pending");
}

function stopIntroVideo(video: HTMLVideoElement | null) {
  if (!video) return;

  video.pause();
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.removeAttribute("autoplay");
}

export function IntroOverlay() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const revealTimersRef = useRef<number[]>([]);
  const hasStartedExitRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasConfirmedIntro, setHasConfirmedIntro] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [isSymbolHero, setIsSymbolHero] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [soundPromptVisible, setSoundPromptVisible] = useState(false);
  const isPathReady = typeof pathname === "string";
  const isStorefront = isPathReady && !pathname.startsWith("/admin");

  const finishIntro = () => {
    if (hasStartedExitRef.current) return;

    hasStartedExitRef.current = true;
    setIsBlackout(true);
    setSoundPromptVisible(false);
    stopIntroVideo(videoRef.current);

    revealTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    revealTimersRef.current = [
      window.setTimeout(() => setIsRevealing(true), BLACK_FADE_MS),
      window.setTimeout(() => {
        try {
          window.sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
        } catch {
          // Ignore storage failures; the overlay still closes for this visit.
        }
        setIsVisible(false);
      }, BLACK_FADE_MS + PAGE_REVEAL_MS),
    ];
  };

  useEffect(() => {
    if (!isPathReady) return;

    if (!isStorefront) {
      stopIntroVideo(videoRef.current);
      setIsVisible(false);
      setSoundPromptVisible(false);
      clearIntroBootCover();
      return;
    }

    let shouldShow = true;
    try {
      const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
      shouldShow = forceIntro || window.sessionStorage.getItem(INTRO_STORAGE_KEY) !== "1";
    } catch {
      shouldShow = true;
    }

    if (shouldShow) {
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
      clearIntroBootCover();
    }
  }, [isPathReady, isStorefront]);

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

  useEffect(() => {
    if (!isVisible || !hasConfirmedIntro) return;

    clearIntroBootCover();
    document.body.classList.add("intro-playing");

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.defaultMuted = false;
      video.muted = false;
      video.volume = 1;

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
      document.body.classList.remove("intro-playing");
    };
  }, [hasConfirmedIntro, isVisible]);

  useEffect(() => {
    if (!isVisible || !hasConfirmedIntro) return;

    const timers: number[] = [];
    const timing = getIntroTiming(DEFAULT_INTRO_DURATION_MS);

    timers.push(window.setTimeout(() => setShowLogo(true), timing.logoStart));
    timers.push(window.setTimeout(() => setIsSymbolHero(true), timing.symbolHeroAt));
    timers.push(window.setTimeout(finishIntro, timing.fadeToBlackAt));

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [hasConfirmedIntro, isVisible]);

  useEffect(() => {
    if (!isVisible) {
      revealTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      revealTimersRef.current = [];
      stopIntroVideo(videoRef.current);
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

  if (!isVisible || (isPathReady && !isStorefront)) {
    return null;
  }

  return (
    <div
      className={`intro-overlay${hasConfirmedIntro ? "" : " is-boot-overlay"}${showLogo ? " is-logo-phase" : ""}${isSymbolHero ? " is-symbol-hero" : ""}${isBlackout ? " is-blackout" : ""}${isRevealing ? " is-revealing" : ""}`}
      aria-hidden="true"
      onPointerDown={soundPromptVisible ? handleUnlockSound : undefined}
    >
      <video
        ref={videoRef}
        className="intro-video"
        src="/assets/show-off-intro.mp4"
        playsInline
        preload="auto"
        onEnded={finishIntro}
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
