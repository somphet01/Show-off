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
  const [isVisible, setIsVisible] = useState(true);
  const [hasConfirmedIntro, setHasConfirmedIntro] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [isSymbolHero, setIsSymbolHero] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [soundPromptVisible, setSoundPromptVisible] = useState(false);
  const [durationMs, setDurationMs] = useState(DEFAULT_INTRO_DURATION_MS);

  const isPathReady = typeof pathname === "string";
  const isStorefront = isPathReady && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!isPathReady) return;

    if (!isStorefront) {
      stopIntroVideo(videoRef.current);
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
      setHasConfirmedIntro(true);
      setShowLogo(false);
      setIsSymbolHero(false);
      setIsBlackout(false);
      setIsRevealing(false);
      setIsVisible(true);
    } else {
      setHasConfirmedIntro(false);
      setIsVisible(false);
      clearIntroBootCover();
    }
  }, [isPathReady, isStorefront]);

  useEffect(() => {
    const handleSilence = () => {
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
      const seconds = video.duration;
      if (Number.isFinite(seconds) && seconds > 0) {
        setDurationMs(seconds * 1000);
      }

      video.currentTime = 0;
      video.defaultMuted = true;
      video.muted = true;
      video.volume = 0;

      const playAttempt = video.play();
      if (playAttempt) {
        playAttempt
          .then(() => {
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
            video.play().catch(() => undefined);
          });
      }
    }

    return () => {
      stopIntroVideo(videoRef.current);
      document.body.classList.remove("intro-playing");
    };
  }, [hasConfirmedIntro, isVisible]);

  useEffect(() => {
    if (!isVisible || !hasConfirmedIntro) return;

    const timers: number[] = [];
    const timing = getIntroTiming(durationMs);

    timers.push(window.setTimeout(() => setShowLogo(true), timing.logoStart));
    timers.push(window.setTimeout(() => setIsSymbolHero(true), timing.symbolHeroAt));
    timers.push(
      window.setTimeout(() => {
        setIsBlackout(true);
        stopIntroVideo(videoRef.current);
      }, timing.fadeToBlackAt),
    );
    timers.push(window.setTimeout(() => setIsRevealing(true), timing.revealPageAt));
    timers.push(
      window.setTimeout(() => {
        stopIntroVideo(videoRef.current);
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
  }, [durationMs, hasConfirmedIntro, isVisible]);

  useEffect(() => {
    if (!isVisible) {
      stopIntroVideo(videoRef.current);
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
        setSoundPromptVisible(false);
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
        autoPlay
        playsInline
        muted
        preload="auto"
        onEnded={(event) => stopIntroVideo(event.currentTarget)}
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
