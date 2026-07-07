export type AdminReferenceData = Record<string, unknown>;

declare global {
  interface Window {
    __SHOW_OFF_ADMIN_DATA__?: AdminReferenceData;
  }
}

export function liveValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.__SHOW_OFF_ADMIN_DATA__?.[key];
  return value == null ? fallback : (value as T);
}
