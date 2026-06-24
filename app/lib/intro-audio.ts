export const silenceIntroAudioEvent = "showoff-intro-audio-silence";

export function silenceIntroAudio() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(silenceIntroAudioEvent));

  document.querySelectorAll<HTMLVideoElement>(".intro-video, video[src*='show-off-intro']").forEach((video) => {
    video.pause();
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.removeAttribute("autoplay");
  });
}
