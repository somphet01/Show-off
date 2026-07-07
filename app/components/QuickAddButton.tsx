"use client";

import type { CSSProperties } from "react";
import { useEffect, useId, useRef, useState } from "react";

const cartStorageKey = "show-off-cart";
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

type CartItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  price: string;
  image: string;
  quantity: number;
  stock?: number;
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

function swatchStyle(hex?: string) {
  return hex ? ({ "--swatch-color": hex } as CSSProperties) : undefined;
}

function swatchClassName(swatch: string, hex?: string) {
  return hex ? `${swatch} has-custom-swatch` : swatch;
}

export function QuickAddButton({
  item,
  swatches = ["black"],
  swatchHexes,
  swatchLabels,
  sizeOptionsByColor,
  variantStockByColor,
  imageByColor,
}: {
  item: QuickAddItem;
  swatches?: string[];
  swatchHexes?: string[];
  swatchLabels?: string[];
  sizeOptionsByColor?: Record<string, string[]>;
  variantStockByColor?: Record<string, Record<string, number>>;
  imageByColor?: Record<string, string>;
}) {
  const visibleSwatches = swatches.length > 0 ? swatches : ["black"];
  const quickAddId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const colorLabelAt = (index: number) => swatchLabels?.[index] || swatchLabel(visibleSwatches[index]) || item.color;
  const selectedColorLabel = selectedColorIndex !== null ? colorLabelAt(selectedColorIndex) : null;
  const activeSizes = selectedColorLabel ? sizeOptionsByColor?.[selectedColorLabel] ?? sizes : [];
  const activeStock = selectedColorLabel ? variantStockByColor?.[selectedColorLabel] : undefined;
  const colorIsSoldOut = (index: number) => {
    const label = colorLabelAt(index);
    const stock = variantStockByColor?.[label];
    return stock ? Object.values(stock).every((value) => value <= 0) : false;
  };
  const sizeIsSoldOut = (size: string) => (activeStock ? (activeStock[size] ?? 0) <= 0 : false);

  const closeQuickAdd = () => {
    setOpen(false);
    setAdded(false);
    setSelectedSize(null);
    setSelectedColorIndex(null);
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

  const addToCart = (size: string, color: string) => {
    const stockLimit = Math.max(0, activeStock?.[size] ?? 99);
    const nextItem: CartItem = {
      ...item,
      color,
      image: imageByColor?.[color] ?? item.image,
      size,
      quantity: 1,
      stock: stockLimit,
    };

    const currentItems = readCartItems();
    const existingItem = currentItems.find((cartItem) => cartItem.slug === nextItem.slug && cartItem.size === nextItem.size && cartItem.color === nextItem.color);
    if (existingItem && existingItem.quantity >= stockLimit) {
      writeCartItems(currentItems.map((cartItem) => (cartItem.slug === nextItem.slug && cartItem.size === nextItem.size && cartItem.color === nextItem.color ? { ...cartItem, stock: stockLimit } : cartItem)));
      setAdded(true);
      window.setTimeout(() => {
        closeQuickAdd();
      }, 650);
      return;
    }
    const nextItems = existingItem
      ? currentItems.map((cartItem) => (cartItem.slug === nextItem.slug && cartItem.size === nextItem.size && cartItem.color === nextItem.color ? { ...cartItem, quantity: Math.min(stockLimit, cartItem.quantity + 1), stock: stockLimit } : cartItem))
      : [nextItem, ...currentItems];

    writeCartItems(nextItems);
    setAdded(true);
    window.setTimeout(() => {
      closeQuickAdd();
    }, 650);
  };

  const chooseSize = (size: string) => {
    if (!selectedColorLabel || sizeIsSoldOut(size)) {
      return;
    }

    setSelectedSize(size);
    addToCart(size, selectedColorLabel);
  };

  const chooseColor = (index: number) => {
    if (colorIsSoldOut(index)) {
      return;
    }

    setSelectedColorIndex(index);
    setSelectedSize(null);
  };

  return (
    <div
      ref={rootRef}
      className={`quick-add${open ? " is-open" : ""}${selectedColorIndex !== null ? " has-color" : ""}${visibleSwatches.length > 5 ? " has-scrollable-colours" : ""}${added ? " is-added" : ""}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {open ? (
        <div className="quick-add-panel" aria-label={`Quick add ${item.name}`}>
          <div className="quick-add-colour-strip">
            <div className="quick-add-swatches" aria-label="Choose colour">
            {visibleSwatches.map((swatch, index) => (
              <button className={`${index === selectedColorIndex ? "is-selected" : ""}${colorIsSoldOut(index) ? " is-sold-out" : ""}`} type="button" aria-label={`Choose ${colorLabelAt(index)}`} aria-disabled={colorIsSoldOut(index)} onClick={() => chooseColor(index)} key={`${item.slug}-${swatch}-${index}`}>
                <i className={swatchClassName(swatch, swatchHexes?.[index])} style={swatchStyle(swatchHexes?.[index])} />
              </button>
            ))}
            </div>
          </div>
          <div className="quick-add-sizes" aria-label="Choose size">
            {activeSizes.map((size) => {
              const soldOut = sizeIsSoldOut(size);
              return (
                <button className={`${size === selectedSize ? "is-selected" : ""}${soldOut ? " is-sold-out" : ""}`} type="button" aria-disabled={soldOut} disabled={soldOut} onClick={() => chooseSize(size)} key={`${item.slug}-${selectedColorLabel ?? "colour"}-${size}`}>
                  {size}
                </button>
              );
            })}
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
