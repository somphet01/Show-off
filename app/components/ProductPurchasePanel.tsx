"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { silenceIntroAudio } from "../lib/intro-audio";
import type { CollectionProduct } from "../lib/shop";
import { productColourImage, productColourOptions } from "./ProductColourGallery";
import type { SavedItem } from "./SaveProductButton";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const cartStorageKey = "show-off-cart";
const savedStorageKey = "show-off-saved";
const customerStorageKey = "show-off-customer";

type CartItem = {
  slug: string;
  name: string;
  color: string;
  size: string;
  price: string;
  image: string;
  quantity: number;
};

function readSavedItems() {
  try {
    const stored = window.localStorage.getItem(savedStorageKey);
    return stored ? (JSON.parse(stored) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

function saveSavedItems(items: SavedItem[]) {
  if (items.length === 0) {
    window.localStorage.removeItem(savedStorageKey);
  } else {
    window.localStorage.setItem(savedStorageKey, JSON.stringify(items));
  }

  window.dispatchEvent(new CustomEvent("showoff-saved-updated", { detail: items }));
}

function WishlistIcon({ saved }: { saved: boolean }) {
  return (
    <svg aria-hidden="true" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24">
      <path d="M7.5 4.5h9v15L12 16.75 7.5 19.5v-15Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M5.5 6.5h2l1.4 9h8.4l1.2-6.2H8.4" />
      <path d="M9.5 19.3h.1M16.5 19.3h.1" />
    </svg>
  );
}

export function ProductPurchasePanel({ product, locale }: { product: CollectionProduct; locale: string }) {
  const colourOptions = useMemo(() => productColourOptions(product.color, product.colors, product.colourImages), [product.color, product.colors, product.colourImages]);
  const visibleColourOptions = colourOptions.slice(0, 4);
  const needsColourSelection = colourOptions.length > 1;
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColour, setSelectedColour] = useState<string | null>(product.color);
  const [sizeError, setSizeError] = useState(false);
  const [colourError, setColourError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [colourSheetOpen, setColourSheetOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const availableSizes = useMemo(() => {
    const colour = selectedColour ?? product.color;
    return product.variantSizes?.[colour] ?? sizes;
  }, [product.color, product.variantSizes, selectedColour]);

  useEffect(() => {
    if (selectedSize && !availableSizes.includes(selectedSize)) {
      setSelectedSize(null);
    }
  }, [availableSizes, selectedSize]);

  useEffect(() => {
    const syncSaved = () => {
      const colour = selectedColour ?? product.color;
      setIsSaved(readSavedItems().some((item) => item.slug === product.slug && item.color === colour));
    };

    syncSaved();
    window.addEventListener("showoff-saved-updated", syncSaved);
    window.addEventListener("storage", syncSaved);

    return () => {
      window.removeEventListener("showoff-saved-updated", syncSaved);
      window.removeEventListener("storage", syncSaved);
    };
  }, [product.color, product.slug, selectedColour]);

  useEffect(() => {
    let frame = 0;

    const syncStickyBar = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const actions = actionsRef.current;

        if (!actions) {
          setIsStickyVisible(false);
          return;
        }

        const rect = actions.getBoundingClientRect();
        setIsStickyVisible(rect.bottom < 0);
      });
    };

    syncStickyBar();
    window.addEventListener("scroll", syncStickyBar, { passive: true });
    window.addEventListener("resize", syncStickyBar);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", syncStickyBar);
      window.removeEventListener("resize", syncStickyBar);
    };
  }, []);

  const addToCart = (openCart = true) => {
    if (!selectedSize) {
      setSizeError(true);
      return false;
    }

    const colour = selectedColour ?? product.color;
    const nextItem: CartItem = {
      slug: product.slug,
      name: product.name,
      color: colour,
      size: selectedSize,
      price: product.price,
      image: productColourImage(colour, product.image, product.colourImages),
      quantity: 1,
    };

    let currentItems: CartItem[] = [];

    try {
      const stored = window.localStorage.getItem(cartStorageKey);
      currentItems = stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      currentItems = [];
    }
    const existingItem = currentItems.find((item) => item.slug === nextItem.slug && item.size === nextItem.size && item.color === nextItem.color);
    const nextItems = existingItem
      ? currentItems.map((item) => (item.slug === nextItem.slug && item.size === nextItem.size && item.color === nextItem.color ? { ...item, quantity: item.quantity + 1 } : item))
      : [...currentItems, nextItem];

    window.localStorage.setItem(cartStorageKey, JSON.stringify(nextItems));
    window.dispatchEvent(new CustomEvent("showoff-cart-updated", { detail: nextItems }));
    if (openCart) {
      window.dispatchEvent(new CustomEvent("showoff-cart-open"));
    }

    return true;
  };

  const handleStickyAction = () => {
    if (!selectedSize) {
      setSizeError(true);
      sizeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    addToCart();
  };

  const checkoutNow = () => {
    if (!selectedSize) {
      setSizeError(true);
      sizeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!window.localStorage.getItem(customerStorageKey)) {
      window.dispatchEvent(new CustomEvent("showoff-account-open"));
      return;
    }

    if (addToCart(false)) {
      silenceIntroAudio();
      document.body.classList.add("route-exit");
      window.setTimeout(() => {
        window.location.href = `/${locale}/checkout`;
      }, 520);
    }
  };

  const selectSize = (size: string) => {
    setSelectedSize(size);
    setSizeError(false);
  };

  const selectColour = (colour: string) => {
    setSelectedColour(colour);
    setColourError(false);
    setColourSheetOpen(false);
    window.dispatchEvent(new CustomEvent("showoff-product-colour-selected", { detail: { colour } }));
  };

  const toggleWishlist = () => {
    if (needsColourSelection && !selectedColour) {
      setColourError(true);
      return;
    }

    const colour = selectedColour ?? product.color;
    const savedItems = readSavedItems();
    const alreadySaved = savedItems.some((item) => item.slug === product.slug && item.color === colour);
    const nextItems = alreadySaved
      ? savedItems.filter((item) => !(item.slug === product.slug && item.color === colour))
      : [{ slug: product.slug, name: product.name, color: colour, price: product.price, image: productColourImage(colour, product.image, product.colourImages) }, ...savedItems.filter((item) => !(item.slug === product.slug && item.color === colour))];

    setIsSaved(!alreadySaved);
    saveSavedItems(nextItems);
  };

  return (
    <>
      <section className="product-detail" aria-labelledby="product-title">
        <div className="product-kicker">
          <span>Drop 06</span>
          <span>Ready to ship</span>
        </div>

        <div className="product-heading">
          <h1 id="product-title">{product.name}</h1>
          <strong className="product-price">{product.price}</strong>
        </div>

        <div className="product-option-row">
          <div>
            <b>
              Colour<sup>{colourOptions.length}</sup>
            </b>
            <span>{selectedColour ?? "Select colour"}</span>
          </div>
          <button className={`wishlist-icon-button${isSaved ? " is-saved" : ""}`} type="button" aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={isSaved} onClick={toggleWishlist}>
            <WishlistIcon saved={isSaved} />
          </button>
        </div>

        <div className="colour-options" role={needsColourSelection ? "radiogroup" : undefined} aria-label="Select colour">
          {visibleColourOptions.map((colour) => (
            <button
              className={colour === selectedColour ? "is-selected" : ""}
              type="button"
              role={needsColourSelection ? "radio" : undefined}
              aria-checked={needsColourSelection ? colour === selectedColour : undefined}
              onClick={() => selectColour(colour)}
              key={colour}
            >
              <img src={productColourImage(colour, product.image, product.colourImages)} alt={`${colour} swatch`} />
              <span>{colour}</span>
            </button>
          ))}
          {colourOptions.length > visibleColourOptions.length ? (
            <button className="more-colours-button" type="button" onClick={() => setColourSheetOpen(true)} aria-haspopup="dialog" aria-expanded={colourSheetOpen}>
              More colours
              <ChevronIcon />
            </button>
          ) : null}
        </div>
        {colourError ? <p className="colour-error">Select a colour before adding this item to your wishlist.</p> : null}

        <div className="size-line" ref={sizeSectionRef}>
          <div>
            <b>Size</b>
            <span>{selectedSize ?? "Select size"}</span>
            {selectedSize ? <em>In Stock</em> : null}
          </div>
          <a href="#size-chart">Size Guide</a>
        </div>

        <div className="size-grid" role="radiogroup" aria-label="Select size">
          {availableSizes.map((size) => (
            <button className={size === selectedSize ? "is-selected" : ""} type="button" role="radio" aria-checked={size === selectedSize} onClick={() => selectSize(size)} key={size}>
              {size}
              {size === selectedSize ? <span aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
        {sizeError ? <p className="size-error">Choose a size before adding this item.</p> : null}

        <div className="product-actions" ref={actionsRef}>
          <button type="button" onClick={() => addToCart()}>
            <CartIcon />
            {selectedSize ? `Add size ${selectedSize} to cart` : "Select a size"}
          </button>
          <button className="shop-pay" type="button" onClick={checkoutNow}>
            Express checkout
          </button>
        </div>
      </section>

      <div className={`product-sticky-bar${isStickyVisible ? " is-visible" : ""}`} aria-hidden={!isStickyVisible} aria-label="Quick add bar">
        <button type="button" onClick={handleStickyAction}>
          {selectedSize ? "Add to cart" : "Select size"}
        </button>
      </div>

      <div className={`colour-sheet-scrim${colourSheetOpen ? " is-open" : ""}`} aria-hidden="true" onClick={() => setColourSheetOpen(false)} />
      <aside className={`colour-sheet${colourSheetOpen ? " is-open" : ""}`} aria-hidden={!colourSheetOpen} aria-label="Select a colour">
        <div className="colour-sheet-top">
          <h2>Select a colour</h2>
          <button type="button" aria-label="Close colour selector" onClick={() => setColourSheetOpen(false)}>
            ×
          </button>
        </div>
        <div className="colour-sheet-grid" role={needsColourSelection ? "radiogroup" : undefined} aria-label="All colours">
          {colourOptions.map((colour) => (
            <button
              className={colour === selectedColour ? "is-selected" : ""}
              type="button"
              role={needsColourSelection ? "radio" : undefined}
              aria-checked={needsColourSelection ? colour === selectedColour : undefined}
              onClick={() => selectColour(colour)}
              key={colour}
            >
              <img src={productColourImage(colour, product.image, product.colourImages)} alt={`${colour} colour`} />
              <span>{colour}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
