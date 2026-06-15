"use client";

import { useEffect, useState } from "react";

export type SavedItem = {
  slug: string;
  name: string;
  color: string;
  price: string;
  image: string;
};

const savedStorageKey = "show-off-saved";

function readSavedItems() {
  try {
    const stored = window.localStorage.getItem(savedStorageKey);
    return stored ? (JSON.parse(stored) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

function writeSavedItems(items: SavedItem[]) {
  if (items.length === 0) {
    window.localStorage.removeItem(savedStorageKey);
  } else {
    window.localStorage.setItem(savedStorageKey, JSON.stringify(items));
  }

  window.dispatchEvent(new CustomEvent("showoff-saved-updated", { detail: items }));
}

function SaveIcon({ saved }: { saved: boolean }) {
  return (
    <svg aria-hidden="true" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24">
      <path d="M7.5 4.5h9v15L12 16.75 7.5 19.5v-15Z" />
    </svg>
  );
}

export function SaveProductButton({ item, className = "" }: { item: SavedItem; className?: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const syncSavedState = () => {
      setSaved(readSavedItems().some((savedItem) => savedItem.slug === item.slug));
    };

    syncSavedState();
    window.addEventListener("showoff-saved-updated", syncSavedState);
    window.addEventListener("storage", syncSavedState);

    return () => {
      window.removeEventListener("showoff-saved-updated", syncSavedState);
      window.removeEventListener("storage", syncSavedState);
    };
  }, [item.slug]);

  const toggleSaved = () => {
    const savedItems = readSavedItems();
    const nextItems = saved ? savedItems.filter((savedItem) => savedItem.slug !== item.slug) : [item, ...savedItems.filter((savedItem) => savedItem.slug !== item.slug)];

    setSaved(!saved);
    writeSavedItems(nextItems);
  };

  return (
    <button
      className={`save-product-button${saved ? " is-saved" : ""}${className ? ` ${className}` : ""}`}
      type="button"
      aria-label={saved ? `Remove ${item.name} from saved items` : `Save ${item.name}`}
      aria-pressed={saved}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleSaved();
      }}
    >
      <SaveIcon saved={saved} />
    </button>
  );
}
