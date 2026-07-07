import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Film,
  Image,
  Link2,
  Monitor,
  Pencil,
  Play,
  Save,
  SlidersHorizontal,
  UploadCloud,
  X,
} from "lucide-react";
import { useAdminFeedback } from "../ui/AdminFeedback";
import type { ChangeEvent, DragEvent, ReactNode } from "react";

type MediaType = "image" | "video";

type CoverSlot = {
  id: string;
  title: string;
  label: string;
  asset: string;
  link: string;
  cta: string;
  mediaType: MediaType;
  enabled: boolean;
};

type IntroSettings = {
  enabled: boolean;
  mediaType: MediaType;
  src: string;
  audioEnabled: boolean;
  fadeMs: number;
  durationMs: number;
  showOncePerVisit: boolean;
};

const coverStorageKey = "show-off-admin-cover-slots";
const introStorageKey = "show-off-admin-intro-settings";

const initialCoverSlots: CoverSlot[] = [
  {
    id: "home-hero",
    title: "Built to Stand Out",
    label: "Jackets",
    asset: "/assets/cover-main.png",
    link: "/collections/jackets",
    cta: "SHOP NOW",
    mediaType: "image",
    enabled: true,
  },
  {
    id: "baggy-jeans",
    title: "Built Different",
    label: "Baggy Jeans",
    asset: "/assets/campaign-dark.png",
    link: "/collections/baggy-jeans",
    cta: "NEW ARRIVALS",
    mediaType: "image",
    enabled: true,
  },
  {
    id: "premium-tees",
    title: "Premium Boxy Tees",
    label: "Made to Stand Out",
    asset: "/assets/campaign-motel.png",
    link: "/collections/t-shirts",
    cta: "SHOP THE DROP",
    mediaType: "image",
    enabled: true,
  },
  {
    id: "accessories-campaign",
    title: "Essential Accessories",
    label: "Complete Your Look",
    asset: "/assets/campaign-moto.png",
    link: "/collections/accessories",
    cta: "SHOP ACCESSORIES",
    mediaType: "image",
    enabled: true,
  },
  {
    id: "hoodies-campaign",
    title: "Essential Hoodies",
    label: "Built for Everyday",
    asset: "/assets/campaign-beach.png",
    link: "/collections/hoodies",
    cta: "DISCOVER MORE",
    mediaType: "image",
    enabled: true,
  },
];

const initialIntro: IntroSettings = {
  enabled: true,
  mediaType: "video",
  src: "/assets/show-off-intro.mp4",
  audioEnabled: true,
  fadeMs: 700,
  durationMs: 5200,
  showOncePerVisit: true,
};

const inputClass =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-950 outline-none transition focus:border-neutral-300 focus:ring-4 focus:ring-neutral-950/10";

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mediaName(path: string) {
  return path.split("/").pop() || path;
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
        enabled ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"
      }`}
      style={{ fontSize: "11.5px", fontWeight: 700 }}
    >
      {enabled ? <CheckCircle2 size={12} /> : <EyeOff size={12} />}
      {enabled ? "ເປີດໃຊ້ງານ" : "ປິດໄວ້"}
    </span>
  );
}

function SectionHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-neutral-950" style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        <p className="mt-1 max-w-[72ch] text-neutral-500" style={{ fontSize: "13px", lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  dark = false,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  dark?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 transition ${
        dark
          ? "bg-neutral-950 text-white shadow-sm hover:bg-neutral-800"
          : "border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:border-neutral-300 hover:text-neutral-950"
      } disabled:cursor-not-allowed disabled:opacity-40`}
      disabled={disabled}
      onClick={onClick}
      style={{ fontSize: "12.5px", fontWeight: 700 }}
      type="button"
    >
      {children}
    </button>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 700 }}>
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1.5 block text-neutral-400" style={{ fontSize: "11.5px", lineHeight: 1.45 }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function EditorPanel({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 p-4 backdrop-blur-sm">
      <div className="h-full w-full max-w-[560px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-100 bg-white/95 p-6 backdrop-blur">
          <div>
            <h2 className="text-neutral-950" style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {title}
            </h2>
            <p className="mt-1 text-neutral-500" style={{ fontSize: "12.5px", lineHeight: 1.55 }}>
              {description}
            </p>
          </div>
          <button className="rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-950" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="h-[calc(100%-88px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function MediaPreview({ src, mediaType, alt, className = "h-full w-full" }: { src: string; mediaType: MediaType; alt: string; className?: string }) {
  if (mediaType === "video") {
    return <video className={`${className} object-cover`} muted playsInline src={src} />;
  }

  return <img className={`${className} object-cover`} alt={alt} src={src} />;
}

function MediaDropZone({
  src,
  mediaType,
  label,
  helper,
  onPick,
  uploading = false,
}: {
  src: string;
  mediaType: MediaType;
  label: string;
  helper: string;
  onPick: (file: File) => void;
  uploading?: boolean;
}) {
  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    onPick(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  return (
    <label
      className="group block cursor-pointer rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-4 transition hover:border-neutral-400 hover:bg-white"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        accept={mediaType === "video" ? "video/*" : "image/*"}
        className="sr-only"
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files)}
        type="file"
        disabled={uploading}
      />
      <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-100">
          <MediaPreview alt={label} className="aspect-video w-full" mediaType={mediaType} src={src} />
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-100">
            <UploadCloud size={18} />
          </div>
          <p className="text-neutral-950" style={{ fontSize: "13.5px", fontWeight: 800 }}>
            {uploading ? "ກຳລັງອັບໂຫຼດ..." : label}
          </p>
          <p className="mt-1 text-neutral-500" style={{ fontSize: "12px", lineHeight: 1.5 }}>
            {helper}
          </p>
          <p className="mt-2 truncate rounded-full bg-white px-3 py-1.5 text-neutral-400 ring-1 ring-neutral-100" style={{ fontSize: "11.5px" }}>
            {mediaName(src)}
          </p>
        </div>
      </div>
    </label>
  );
}

export function WebsiteEditorPage() {
  const feedback = useAdminFeedback();
  const [coverSlots, setCoverSlots] = useState<CoverSlot[]>(() => readStored(coverStorageKey, initialCoverSlots));
  const [intro, setIntro] = useState<IntroSettings>(() => readStored(introStorageKey, initialIntro));
  const [editingCoverId, setEditingCoverId] = useState<string | null>(null);
  const [editingIntro, setEditingIntro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const editingCover = coverSlots.find((slot) => slot.id === editingCoverId) ?? null;
  const enabledCoverCount = coverSlots.filter((slot) => slot.enabled).length;

  const coverPayload = useMemo(
    () => ({
      covers: coverSlots,
      intro,
      recommendedDesktopCover: "1920×1080",
      mobileBehaviour: "crop from the same desktop media",
    }),
    [coverSlots, intro],
  );

  useEffect(() => {
    let active = true;

    fetch("/api/site-content", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load website content.");
        }
        return payload as { covers?: CoverSlot[]; intro?: IntroSettings };
      })
      .then((payload) => {
        if (!active) return;
        if (Array.isArray(payload.covers) && payload.covers.length === 5) {
          setCoverSlots(payload.covers);
          writeStored(coverStorageKey, payload.covers);
        }
        if (payload.intro) {
          setIntro(payload.intro);
          writeStored(introStorageKey, payload.intro);
        }
      })
      .catch((error: Error) => {
        if (active) {
          feedback.error("ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ", error.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [feedback]);

  const saveNotice = (text: string) => {
    feedback.success("ບັນທຶກສໍາເລັດ", text);
  };

  const persistSiteContent = async (nextSlots: CoverSlot[], nextIntro: IntroSettings, successMessage: string) => {
    setSaving(true);
    try {
      const response = await fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ covers: nextSlots, intro: nextIntro }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save website content.");
      }
      const savedCovers = Array.isArray(payload.covers) ? payload.covers : nextSlots;
      const savedIntro = payload.intro ?? nextIntro;
      setCoverSlots(savedCovers);
      setIntro(savedIntro);
      writeStored(coverStorageKey, savedCovers);
      writeStored(introStorageKey, savedIntro);
      saveNotice(successMessage);
      return true;
    } catch (error) {
      feedback.error("ບັນທຶກບໍ່ສຳເລັດ", error instanceof Error ? error.message : "Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveCovers = async (nextSlots = coverSlots) => {
    return persistSiteContent(nextSlots, intro, "Cover 5 ຊ່ອງຖືກບັນທຶກແລະສົ່ງໄປໜ້າເວັບແລ້ວ");
  };

  const saveIntro = async (nextIntro = intro) => {
    return persistSiteContent(coverSlots, nextIntro, "Intro ຖືກບັນທຶກແລະສົ່ງໄປໜ້າເວັບແລ້ວ");
  };

  const readApiPayload = async (response: Response) => {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    return {
      error: text.trim() || `${response.status} ${response.statusText}` || "Request failed.",
    };
  };

  const uploadMedia = async (file: File, target: string, onUploaded: (url: string, mediaType: MediaType) => void) => {
    setUploadingTarget(target);

    try {
      const response = await fetch("/api/admin/site-media/upload", {
        method: "POST",
        headers: {
          "content-type": file.type || "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
        },
        body: file,
      });
      const payload = await readApiPayload(response);
      if (!response.ok) {
        throw new Error(payload.error || "Failed to upload media.");
      }
      if (!payload.media?.url || !payload.media?.mediaType) {
        throw new Error("Upload completed but the server did not return a media URL.");
      }
      onUploaded(payload.media.url, payload.media.mediaType);
      feedback.success("ອັບໂຫຼດສຳເລັດ", file.name);
    } catch (error) {
      feedback.error("ອັບໂຫຼດບໍ່ສຳເລັດ", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setUploadingTarget(null);
    }
  };

  const updateCover = (id: string, patch: Partial<CoverSlot>) => {
    setCoverSlots((slots) => slots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  };

  const moveCover = (id: string, direction: "up" | "down") => {
    setCoverSlots((slots) => {
      const index = slots.findIndex((slot) => slot.id === id);
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= slots.length) return slots;

      const next = [...slots];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const copyPayload = async () => {
    const payload = JSON.stringify(coverPayload, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      saveNotice("Copy payload ໄວ້ແລ້ວ");
    } catch {
      feedback.error("Copy ບໍ່ສໍາເລັດ", "Browser ບໍ່ອະນຸຍາດໃຫ້ copy ອັດຕະໂນມັດ");
    }
  };

  return (
    <div className="mx-auto max-w-[1480px] space-y-5 p-5">
      <section className="overflow-hidden rounded-[28px] bg-neutral-950 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:p-7">
          <div className="flex min-h-[240px] flex-col justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white/80" style={{ fontSize: "12px", fontWeight: 700 }}>
                <Monitor size={13} />
                SHOW OFF Website Control
              </div>
              <h1 className="max-w-[760px] text-white" style={{ fontSize: "31px", lineHeight: 1.08, fontWeight: 820, letterSpacing: "-0.035em" }}>
                ຈັດການ Home cover 5 ອັນ ແລະ Intro ຈາກຈຸດດຽວ
              </h1>
              <p className="mt-3 max-w-[670px] text-white/64" style={{ fontSize: "13.5px", lineHeight: 1.65 }}>
                ແກ້ຮູບ ຫຼື ວິດີໂອ, ປ້າຍຫມວດ, CTA, link, ສະຖານະເປີດປິດ ແລະລໍາດັບ cover ໃຫ້ກົງກັບໜ້າເວັບ. ຮູບ cover ແນະນໍາ 1920×1080 ສໍາລັບ PC, ມືຖືຈະ crop ຈາກຟາຍດຽວກັນ.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <ActionButton dark onClick={() => setEditingCoverId(coverSlots[0]?.id ?? null)}>
                <Pencil size={14} />
                ແກ້ Cover ອັນທໍາອິດ
              </ActionButton>
              <ActionButton onClick={() => setEditingIntro(true)}>
                <Play size={14} />
                ແກ້ Intro
              </ActionButton>
              <ActionButton onClick={copyPayload}>
                <Copy size={14} />
                Copy payload
              </ActionButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Active covers", value: `${enabledCoverCount}/5`, hint: "ຮູບ/ວິດີໂອ, link, CTA" },
              { label: "Cover size", value: "1920×1080", hint: "PC fit, mobile crop" },
              { label: "Intro media", value: intro.mediaType === "video" ? "Video" : "Image", hint: `${intro.enabled ? "ເປີດ" : "ປິດ"}, fade ${intro.fadeMs}ms` },
              { label: "Intro rule", value: intro.showOncePerVisit ? "Once" : "Every time", hint: intro.audioEnabled ? "Audio on" : "Audio off" },
            ].map((item) => (
              <div className="rounded-[22px] bg-white/[0.07] p-4 ring-1 ring-white/10" key={item.label}>
                <p className="text-white/50" style={{ fontSize: "11.5px", fontWeight: 650 }}>
                  {item.label}
                </p>
                <p className="mt-2 text-white" style={{ fontSize: "24px", fontWeight: 820, letterSpacing: "-0.035em" }}>
                  {item.value}
                </p>
                <p className="mt-1 text-white/52" style={{ fontSize: "12px", lineHeight: 1.45 }}>
                  {item.hint}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <SectionHeader
              icon={<Monitor size={17} />}
              title="Home Cover 5 Slot"
              description="ກົດແກ້ເພື່ອປ່ຽນ media, label, CTA, link ແລະສະຖານະ. ປຸ່ມລູກສອນໃຊ້ຈັດລໍາດັບທີ່ສະແດງໃນໜ້າ Home."
            />
            <ActionButton disabled={loading || saving || Boolean(uploadingTarget)} onClick={() => saveCovers()}>
              <SlidersHorizontal size={14} />
              {saving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກລໍາດັບ"}
            </ActionButton>
          </div>

          <div className="grid gap-3">
            {coverSlots.map((slot, index) => (
              <article
                className="grid gap-4 rounded-[24px] border border-neutral-100 bg-neutral-50/75 p-3 transition hover:bg-white hover:shadow-sm sm:grid-cols-[188px_minmax(0,1fr)_auto]"
                key={slot.id}
              >
                <div className="relative overflow-hidden rounded-[20px] bg-neutral-200 shadow-sm ring-1 ring-neutral-100">
                  <MediaPreview alt={slot.title} className="aspect-video w-full" mediaType={slot.mediaType} src={slot.asset} />
                  <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-white" style={{ fontSize: "10px", fontWeight: 800 }}>
                    {index + 1}
                  </span>
                </div>

                <div className="min-w-0 self-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-neutral-950" style={{ fontSize: "14px", fontWeight: 800 }}>
                      {slot.title}
                    </h3>
                    <StatusPill enabled={slot.enabled} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-neutral-500 ring-1 ring-neutral-100" style={{ fontSize: "11.5px", fontWeight: 650 }}>
                      {slot.mediaType === "image" ? <Image size={12} /> : <Film size={12} />}
                      {slot.mediaType === "image" ? "Image" : "Video"}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-neutral-500" style={{ fontSize: "12.5px" }}>
                    Link: {slot.link}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-neutral-500" style={{ fontSize: "11.5px" }}>
                    <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-neutral-100">Label: {slot.label}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-neutral-100">CTA: {slot.cta}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-neutral-100">1920×1080</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-col sm:justify-center">
                  <ActionButton dark onClick={() => setEditingCoverId(slot.id)}>
                    <Pencil size={13} />
                    ແກ້
                  </ActionButton>
                  <div className="flex gap-1">
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:text-neutral-950 disabled:opacity-35" disabled={index === 0} onClick={() => moveCover(slot.id, "up")} type="button">
                      <ArrowUp size={13} />
                    </button>
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:text-neutral-950 disabled:opacity-35" disabled={index === coverSlots.length - 1} onClick={() => moveCover(slot.id, "down")} type="button">
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-3">
              <SectionHeader
                icon={<Play size={17} />}
                title="Intro"
                description="ແກ້ intro media, ສຽງ, fade, duration ແລະກົດໃຫ້ໂຊວຄັ້ງດຽວຕໍ່ການເຂົ້າເວັບ."
              />
              <ActionButton dark onClick={() => setEditingIntro(true)}>
                ແກ້
              </ActionButton>
            </div>
            <div className="overflow-hidden rounded-[24px] bg-neutral-950 shadow-sm">
              <MediaPreview alt="Intro preview" className="h-48 w-full opacity-85" mediaType={intro.mediaType} src={intro.src} />
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-white" style={{ fontSize: "14px", fontWeight: 800 }}>
                    {mediaName(intro.src)}
                  </p>
                  <StatusPill enabled={intro.enabled} />
                </div>
                <p className="mt-2 text-white/55" style={{ fontSize: "12.5px", lineHeight: 1.55 }}>
                  {intro.audioEnabled ? "Audio on" : "Audio off"}, fade {intro.fadeMs}ms, duration {intro.durationMs}ms
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-neutral-100 bg-white p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <Link2 size={16} />
              </div>
              <div>
                <h3 className="text-neutral-950" style={{ fontSize: "15px", fontWeight: 800 }}>
                  ການເຊື່ອມຕໍ່ໜ້າບ້ານ
                </h3>
                <p className="mt-1 text-neutral-500" style={{ fontSize: "12.5px", lineHeight: 1.6 }}>
                  ຂໍ້ມູນ Cover ແລະ Intro ຈະຖືກບັນທຶກເຂົ້າຖານຂໍ້ມູນໂດຍກົງ. ເມື່ອບັນທຶກສຳເລັດ ໜ້າ Home ແລະ Intro ຈະໃຊ້ຂໍ້ມູນໃໝ່ທັນທີ.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {editingCover ? (
        <EditorPanel
          description="ປ່ຽນ media, label, CTA, link ແລະສະຖານະຂອງ cover ນີ້. ລາກຟາຍມາວາງໄດ້ ຫຼືກົດເພື່ອເລືອກຟາຍ."
          onClose={() => setEditingCoverId(null)}
          title={`ແກ້ Cover: ${editingCover.title}`}
        >
          <div className="space-y-5">
            <MediaDropZone
              helper="ແນະນໍາ 1920×1080. ຮອງຮັບ JPG, PNG, WEBP, MP4."
              label="ເພີ່ມ ຫຼື ປ່ຽນ media"
              mediaType={editingCover.mediaType}
              onPick={(file) =>
                uploadMedia(file, `cover:${editingCover.id}`, (url, mediaType) =>
                  updateCover(editingCover.id, { asset: url, mediaType }),
                )
              }
              src={editingCover.asset}
              uploading={uploadingTarget === `cover:${editingCover.id}`}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="ຊື່ Cover">
                <input className={inputClass} onChange={(event) => updateCover(editingCover.id, { title: event.target.value })} style={{ fontSize: "13.5px" }} value={editingCover.title} />
              </Field>
              <Field label="Label ເທິງຮູບ">
                <input className={inputClass} onChange={(event) => updateCover(editingCover.id, { label: event.target.value })} style={{ fontSize: "13.5px" }} value={editingCover.label} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Media type">
                <select className={inputClass} onChange={(event) => updateCover(editingCover.id, { mediaType: event.target.value as MediaType })} style={{ fontSize: "13.5px" }} value={editingCover.mediaType}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </Field>
              <Field label="Link ເວລາກົດປຸ່ມ">
                <input className={inputClass} onChange={(event) => updateCover(editingCover.id, { link: event.target.value })} style={{ fontSize: "13.5px" }} value={editingCover.link} />
              </Field>
            </div>

            <Field label="Media path / URL">
              <input className={inputClass} onChange={(event) => updateCover(editingCover.id, { asset: event.target.value })} style={{ fontSize: "13.5px" }} value={editingCover.asset} />
            </Field>

            <Field label="CTA Button">
              <input className={inputClass} onChange={(event) => updateCover(editingCover.id, { cta: event.target.value })} style={{ fontSize: "13.5px" }} value={editingCover.cta} />
            </Field>

            <button
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 ${
                editingCover.enabled ? "bg-neutral-100 text-neutral-700" : "bg-green-50 text-green-700"
              }`}
              onClick={() => updateCover(editingCover.id, { enabled: !editingCover.enabled })}
              style={{ fontSize: "13.5px", fontWeight: 750 }}
              type="button"
            >
              {editingCover.enabled ? <EyeOff size={15} /> : <Eye size={15} />}
              {editingCover.enabled ? "ປິດ cover ນີ້" : "ເປີດ cover ນີ້"}
            </button>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-white transition hover:bg-neutral-800"
              disabled={saving || Boolean(uploadingTarget)}
              onClick={async () => {
                const nextSlots = coverSlots.map((slot) => (slot.id === editingCover.id ? editingCover : slot));
                if (await saveCovers(nextSlots)) {
                  setEditingCoverId(null);
                }
              }}
              style={{ fontSize: "14px", fontWeight: 800 }}
              type="button"
            >
              <Save size={15} />
              {saving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ Cover"}
            </button>
          </div>
        </EditorPanel>
      ) : null}

      {editingIntro ? (
        <EditorPanel
          description="ຕັ້ງຄ່າ intro ທີ່ຂຶ້ນຕອນເຂົ້າເວັບຄັ້ງທໍາອິດ."
          onClose={() => setEditingIntro(false)}
          title="ແກ້ Intro"
        >
          <div className="space-y-5">
            <MediaDropZone
              helper="ຮອງຮັບ MP4 ຫຼືຮູບພາບ. ສຽງຈະຖືກຄວບຄຸມຈາກການຕັ້ງຄ່າດ້ານລຸ່ມ."
              label="ເພີ່ມ ຫຼື ປ່ຽນ intro"
              mediaType={intro.mediaType}
              onPick={(file) =>
                uploadMedia(file, "intro", (url, mediaType) =>
                  setIntro((value) => ({ ...value, src: url, mediaType })),
                )
              }
              src={intro.src}
              uploading={uploadingTarget === "intro"}
            />

            <Field label="Intro media path">
              <input className={inputClass} onChange={(event) => setIntro((value) => ({ ...value, src: event.target.value }))} style={{ fontSize: "13.5px" }} value={intro.src} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Media type">
                <select className={inputClass} onChange={(event) => setIntro((value) => ({ ...value, mediaType: event.target.value as MediaType }))} style={{ fontSize: "13.5px" }} value={intro.mediaType}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </Field>
              <Field label="Audio">
                <select className={inputClass} onChange={(event) => setIntro((value) => ({ ...value, audioEnabled: event.target.value === "on" }))} style={{ fontSize: "13.5px" }} value={intro.audioEnabled ? "on" : "off"}>
                  <option value="on">Audio on</option>
                  <option value="off">Audio off</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Fade time (ms)">
                <input className={inputClass} min={0} onChange={(event) => setIntro((value) => ({ ...value, fadeMs: Number(event.target.value) || 0 }))} style={{ fontSize: "13.5px" }} type="number" value={intro.fadeMs} />
              </Field>
              <Field label="Duration (ms)">
                <input className={inputClass} min={500} onChange={(event) => setIntro((value) => ({ ...value, durationMs: Number(event.target.value) || 500 }))} style={{ fontSize: "13.5px" }} type="number" value={intro.durationMs} />
              </Field>
            </div>

            <div className="grid gap-2">
              <button
                className={`rounded-2xl px-4 py-3 text-left ${intro.enabled ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-600"}`}
                onClick={() => setIntro((value) => ({ ...value, enabled: !value.enabled }))}
                style={{ fontSize: "13px", fontWeight: 750 }}
                type="button"
              >
                {intro.enabled ? "Intro ເປີດຢູ່, ກົດເພື່ອປິດ" : "Intro ປິດຢູ່, ກົດເພື່ອເປີດ"}
              </button>
              <button
                className={`rounded-2xl px-4 py-3 text-left ${intro.showOncePerVisit ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-600"}`}
                onClick={() => setIntro((value) => ({ ...value, showOncePerVisit: !value.showOncePerVisit }))}
                style={{ fontSize: "13px", fontWeight: 750 }}
                type="button"
              >
                {intro.showOncePerVisit ? "ໂຊວຄັ້ງດຽວຕໍ່ການເຂົ້າເວັບ" : "ໂຊວທຸກຄັ້ງ"}
              </button>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-white transition hover:bg-neutral-800"
              disabled={saving || Boolean(uploadingTarget)}
              onClick={async () => {
                if (await saveIntro(intro)) {
                  setEditingIntro(false);
                }
              }}
              style={{ fontSize: "14px", fontWeight: 800 }}
              type="button"
            >
              <Save size={15} />
              {saving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ Intro"}
            </button>
          </div>
        </EditorPanel>
      ) : null}
    </div>
  );
}
