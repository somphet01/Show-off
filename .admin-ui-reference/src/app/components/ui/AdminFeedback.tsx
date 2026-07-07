import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Trash2, X } from "lucide-react";

type FeedbackTone = "success" | "error";

type ConfirmOptions = {
  title: string;
  description?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type NoticeOptions = {
  tone: FeedbackTone;
  title: string;
  description?: string;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type Notice = NoticeOptions & {
  id: number;
};

type AdminFeedbackContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (options: NoticeOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const AdminFeedbackContext = createContext<AdminFeedbackContextValue | null>(null);

function playTone(tone: FeedbackTone) {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(tone === "success" ? 0.055 : 0.045, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + (tone === "success" ? 0.42 : 0.24));
    master.connect(ctx.destination);

    const notes = tone === "success" ? [659.25, 880] : [220, 176];
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + index * (tone === "success" ? 0.105 : 0.075);
      oscillator.type = tone === "success" ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.9, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (tone === "success" ? 0.22 : 0.14));
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.32);
    });

    window.setTimeout(() => void ctx.close().catch(() => undefined), 700);
  } catch {
    // Audio is a progressive enhancement. Browsers may block it in some cases.
  }
}

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<number | null>(null);

  const closeConfirm = useCallback((value: boolean) => {
    setPendingConfirm((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const notify = useCallback((options: NoticeOptions) => {
    if (noticeTimer.current) {
      window.clearTimeout(noticeTimer.current);
    }

    playTone(options.tone);
    setNotice({ ...options, id: Date.now() });
    noticeTimer.current = window.setTimeout(() => setNotice(null), options.tone === "success" ? 2100 : 2600);
  }, []);

  const value = useMemo<AdminFeedbackContextValue>(
    () => ({
      confirm: (options) =>
        new Promise<boolean>((resolve) => {
          setPendingConfirm({
            cancelLabel: "ຍົກເລີກ",
            confirmLabel: "ລຶບ",
            tone: "danger",
            ...options,
            resolve,
          });
        }),
      notify,
      success: (title, description) => notify({ tone: "success", title, description }),
      error: (title, description) => notify({ tone: "error", title, description }),
    }),
    [notify],
  );

  const isDanger = pendingConfirm?.tone !== "default";

  return (
    <AdminFeedbackContext.Provider value={value}>
      {children}

      {pendingConfirm ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[4px]">
          <div className="w-full max-w-[390px] animate-in zoom-in-95 fade-in-0 rounded-[24px] bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,.18)]">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${isDanger ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-950"}`}>
                {isDanger ? <Trash2 size={21} /> : <AlertTriangle size={21} />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-neutral-950" style={{ fontSize: "18px", fontWeight: 780, letterSpacing: "-0.02em" }}>
                  {pendingConfirm.title}
                </h2>
                {pendingConfirm.description ? (
                  <p className="mt-1.5 leading-relaxed text-neutral-500" style={{ fontSize: "13px" }}>
                    {pendingConfirm.description}
                  </p>
                ) : null}
              </div>
              <button className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900" onClick={() => closeConfirm(false)} type="button">
                <X size={16} />
              </button>
            </div>

            {pendingConfirm.itemName ? (
              <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-neutral-700 ring-1 ring-neutral-100" style={{ fontSize: "13px", fontWeight: 650 }}>
                {pendingConfirm.itemName}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                className="rounded-full border border-neutral-200 bg-white px-4 py-3 text-neutral-700 shadow-[0_2px_8px_rgba(0,0,0,.04)] transition hover:bg-neutral-50"
                onClick={() => closeConfirm(false)}
                style={{ fontSize: "13.5px", fontWeight: 700 }}
                type="button"
              >
                {pendingConfirm.cancelLabel}
              </button>
              <button
                className={`${isDanger ? "bg-red-600 hover:bg-red-700" : "bg-neutral-950 hover:bg-neutral-800"} rounded-full px-4 py-3 text-white shadow-[0_8px_24px_rgba(17,17,17,.14)] transition`}
                onClick={() => closeConfirm(true)}
                style={{ fontSize: "13.5px", fontWeight: 760 }}
                type="button"
              >
                {pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex justify-center px-4">
          <div className={`admin-feedback-toast ${notice.tone === "error" ? "is-error" : "is-success"} pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[24px] bg-white p-3.5 shadow-[0_20px_50px_rgba(0,0,0,.12)] ring-1 ring-black/5`}>
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
              {notice.tone === "success" ? (
                <svg className="absolute inset-0 h-12 w-12 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(34,197,94,.16)" strokeWidth="4" />
                  <circle className="admin-feedback-progress" cx="24" cy="24" r="20" fill="none" stroke="#22c55e" strokeLinecap="round" strokeWidth="4" />
                </svg>
              ) : null}
              <div className={`admin-feedback-icon flex h-9 w-9 items-center justify-center rounded-full ${notice.tone === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                {notice.tone === "success" ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-neutral-950" style={{ fontSize: "14px", fontWeight: 780, letterSpacing: "-0.01em" }}>
                {notice.title}
              </p>
              {notice.description ? (
                <p className="mt-0.5 truncate text-neutral-500" style={{ fontSize: "12.5px" }}>
                  {notice.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </AdminFeedbackContext.Provider>
  );
}

export function useAdminFeedback() {
  const context = useContext(AdminFeedbackContext);
  if (!context) {
    throw new Error("useAdminFeedback must be used inside AdminFeedbackProvider");
  }
  return context;
}
