"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { CollectionProduct } from "../lib/shop";
import { SaveProductButton } from "./SaveProductButton";
import { TransitionLink } from "./TransitionLink";

type ViewMode = "one" | "two" | "dense";
type ProductStyle = CSSProperties & { "--product-index": number };

const viewStorageKey = "show-off-collection-view";
const viewModes: { id: ViewMode; label: string }[] = [
  { id: "one", label: "Single view" },
  { id: "two", label: "Two column view" },
  { id: "dense", label: "Dense view" },
];

function readViewMode() {
  if (typeof window === "undefined") {
    return "two";
  }

  const stored = window.localStorage.getItem(viewStorageKey);
  return stored === "one" || stored === "two" || stored === "dense" ? stored : "two";
}

export function CollectionView({ locale, products, title, showFilter = true }: { locale: string; products: CollectionProduct[]; title: string; showFilter?: boolean }) {
  const [viewMode, setViewMode] = useState<ViewMode>("two");

  useEffect(() => {
    setViewMode(readViewMode());
  }, []);

  const selectView = (nextView: ViewMode) => {
    setViewMode(nextView);
    window.localStorage.setItem(viewStorageKey, nextView);
  };

  return (
    <>
      <div className="collection-tools" aria-label="Collection view controls">
        <div className="collection-view-control">
          <span>View</span>
          <div className="view-options" role="group" aria-label="Choose product grid density">
            {viewModes.map((mode) => (
              <button className={mode.id === viewMode ? "is-active" : ""} type="button" aria-label={mode.label} aria-pressed={mode.id === viewMode} onClick={() => selectView(mode.id)} key={mode.id}>
                <span className="view-swatch" />
              </button>
            ))}
          </div>
        </div>
        {showFilter ? (
          <button className="collection-filter-button" type="button">
            Filter
            <i aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <section className={`collection-grid collection-grid-${viewMode}`} id="collection-grid" aria-label={`${title} products`}>
        {products.map((product, index) => (
          <TransitionLink className="collection-card" href={`/${locale}/products/${product.slug}`} key={`${product.name}-${index}`} style={{ "--product-index": index } as ProductStyle}>
            <div className="collection-media">
              {product.badge ? <span>{product.badge}</span> : null}
              <img src={product.image} alt={product.name} />
              <b aria-hidden="true">+</b>
            </div>
            <div className="collection-info">
              <div className="product-title-row">
                <strong>{product.name}</strong>
                <SaveProductButton item={{ slug: product.slug, name: product.name, color: product.color, price: product.price, image: product.image }} />
              </div>
              <div className="collection-meta">
                <span>{product.color}</span>
                <div>
                  <small>
                    <i />
                    {product.colors > 1 ? <i className="muted-dot" /> : null}
                    {product.colors} {product.colors === 1 ? "Colour" : "Colours"}
                  </small>
                  <em>{product.price}</em>
                </div>
              </div>
            </div>
          </TransitionLink>
        ))}
      </section>
    </>
  );
}
