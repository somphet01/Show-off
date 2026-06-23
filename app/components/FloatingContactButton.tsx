"use client";

import { useEffect, useRef, useState } from "react";

const whatsappUrl = "https://wa.me/8562056320988";
const messengerUrl = "https://m.me/100089116444087";

function ChatIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M5.5 17.5h-.8a2.2 2.2 0 0 1-2.2-2.2V6.7a2.2 2.2 0 0 1 2.2-2.2h14.6a2.2 2.2 0 0 1 2.2 2.2v8.6a2.2 2.2 0 0 1-2.2 2.2h-7.6l-4.8 3.4v-3.4H5.5Z" />
      <path d="M7.4 10.7h.1M12 10.7h.1M16.6 10.7h.1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M5.3 19.1 6.2 16a7.5 7.5 0 1 1 2.1 2l-3 .9Z" />
      <path d="M9.3 8.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.5 1.2c.1.3 0 .5-.1.6l-.4.5c.6 1 1.4 1.8 2.5 2.4l.6-.5c.2-.1.4-.2.7-.1l1.2.5c.3.1.4.3.4.6v.6c0 .3-.1.5-.4.7-.6.4-1.5.4-2.3.1-2.5-.9-4.3-2.7-5.2-5.1-.3-.8-.2-1.6.2-2.2Z" />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M4 12.1c0-4.2 3.6-7.6 8-7.6s8 3.1 8 7.3-3.6 7.6-8 7.6c-.8 0-1.5-.1-2.2-.3L6.4 21v-3.4A7.3 7.3 0 0 1 4 12.1Z" />
      <path d="m8.2 13.3 2.4-2.4 2.5 1.8 2.7-2.8" />
    </svg>
  );
}

export function FloatingContactButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className={`floating-contact${open ? " is-open" : ""}`} ref={ref}>
      <div className="floating-contact-menu" aria-hidden={!open}>
        <a className="is-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
        <a className="is-messenger" href={messengerUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
          <MessengerIcon />
          <span>Messenger</span>
        </a>
      </div>
      <button type="button" aria-label={open ? "Close contact options" : "Open contact options"} aria-expanded={open} onClick={() => setOpen((nextOpen) => !nextOpen)}>
        {open ? <CloseIcon /> : <ChatIcon />}
        <span>Message</span>
      </button>
    </div>
  );
}
