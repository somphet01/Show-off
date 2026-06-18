"use client";

import { useEffect, useId, useRef, useState } from "react";

const cartStorageKey = "show-off-cart";
const sizes = ["XS", "S", "M", "L", "XL"];

type CartItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  price: string;
  image: string;
  quantity: number;
};

type QuickAddItem = {
  slug: string;
  name: string;
  color: string;
  price: string;
  image: string;
};

function readCartItems() {
  try {
    const stored = window.localStorage.getItem(cartStorageKey);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCartItems(items: CartItem[]) {
  if (items.length === 0) {
    window.localStorage.removeItem(cartStorageKey);
  } else {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  }

  window.dispatchEvent(new CustomEvent("showoff-cart-updated", { detail: items }));
  window.dispatchEvent(new CustomEvent("showoff-cart-open"));
}

function swatchLabel(swatch: string) {
  return swatch
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function QuickAddButton({ item, swatches = ["black"] }: { item: QuickAddItem; swatches?: string[] }) {
  const visibleSwatches = swatches.length > 0 ? swatches : ["black"];
  const quickAddId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const closeQuickAdd = () => {
    setOpen(false);
    setAdded(false);
    setSelectedSize(null);
    setSelectedColor(null);
  };

  useEffect(() => {
    const handleOtherQuickAdd = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id !== quickAddId) {
        closeQuickAdd();
      }
    };

    const handleScroll = () => {
      closeQuickAdd();
    };

    window.addEventListener("showoff-quick-add-opened", handleOtherQuickAdd as EventListener);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("showoff-quick-add-opened", handleOtherQuickAdd as EventListener);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [quickAddId]);

  const addToCart = (size: string, colorClass: string) => {
    const color = swatchLabel(colorClass) || item.color;
    const nextItem: CartItem = {
      ...item,
      color,
      size,
      quantity: 1,
    };

    const currentItems = readCartItems();
    const existingItem = currentItems.find((cartItem) => cartItem.slug === nextItem.slug && cartItem.size === nextItem.size && cartItem.color === nextItem.color);
    const nextItems = existingItem
      ? currentItems.map((cartItem) => (cartItem.slug === nextItem.slug && cartItem.size === nextItem.size && cartItem.color === nextItem.color ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem))
      : [nextItem, ...currentItems];

    writeCartItems(nextItems);
    setAdded(true);
    window.setTimeout(() => {
      closeQuickAdd();
    }, 650);
  };

  const chooseSize = (size: string) => {
    setSelectedSize(size);
    if (visibleSwatches.length === 1) {
      addToCart(size, visibleSwatches[0]);
    }
  };

  const chooseColor = (color: string) => {
    setSelectedColor(color);
    if (selectedSize) {
      addToCart(selectedSize, color);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`quick-add${open ? " is-open" : ""}${selectedSize && visibleSwatches.length > 1 ? " has-size" : ""}${visibleSwatches.length > 5 ? " has-scrollable-colours" : ""}${added ? " is-added" : ""}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {open ? (
        <div className="quick-add-panel" aria-label={`Quick add ${item.name}`}>
          <div className="quick-add-sizes" aria-label="Choose size">
            {sizes.map((size) => (
              <button className={size === selectedSize ? "is-selected" : ""} type="button" onClick={() => chooseSize(size)} key={`${item.slug}-${size}`}>
                {size}
              </button>
            ))}
          </div>
          <div className="quick-add-colour-strip">
            <div className="quick-add-swatches" aria-label="Choose colour">
            {visibleSwatches.map((swatch, index) => (
              <button className={swatch === selectedColor ? "is-selected" : ""} type="button" aria-label={`Choose ${swatchLabel(swatch)}`} onClick={() => chooseColor(swatch)} key={`${item.slug}-${swatch}-${index}`}>
                <i className={swatch === "black" ? undefined : swatch} />
              </button>
            ))}
            </div>
          </div>
          <span aria-live="polite">{added ? "Added" : "Select"}</span>
        </div>
      ) : null}
      <button
        className="quick-add-toggle"
        type="button"
        aria-label={open ? `Close quick add for ${item.name}` : `Quick add ${item.name}`}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => {
            if (value) {
              closeQuickAdd();
              return false;
            }
            window.dispatchEvent(new CustomEvent("showoff-quick-add-opened", { detail: { id: quickAddId } }));
            return true;
          });
        }}
      >
        +
      </button>
    </div>
  );
}
