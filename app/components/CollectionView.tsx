"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { CollectionProduct } from "../lib/shop";
import { QuickAddButton } from "./QuickAddButton";
import { SaveProductButton } from "./SaveProductButton";
import { TransitionLink } from "./TransitionLink";

type ViewMode = "one" | "two" | "dense";
type ProductStyle = CSSProperties & { "--product-index": number };

const viewStorageKey = "show-off-collection-view";
const initialVisibleProducts = 12;
const visibleProductStep = 8;
const viewModes: { id: ViewMode; label: string }[] = [
  { id: "one", label: "Single view" },
  { id: "two", label: "Two column view" },
  { id: "dense", label: "Dense view" },
];
const swatchClasses = ["black", "deep-brown", "navy", "white", "cream", "grey", "olive"];

function usesCoverMaster(image: string) {
  const source = image.toLowerCase();
  return source.includes("-card.") || source.includes("real-retro-") || source.includes("/product-images/") || source.includes("product-images") || source.includes("so_product=") || source.includes("supabase");
}

function swatchStyle(hex?: string) {
  return hex ? ({ "--swatch-color": hex } as CSSProperties) : undefined;
}

function swatchClassName(swatch: string, hex?: string) {
  return hex ? `${swatch} has-custom-swatch` : swatch;
}

function cardImageForColour(image: string, colour: string, colourImages?: Record<string, string[]>) {
  const colourGallery = colourImages?.[colour]?.filter(Boolean) ?? [];
  const cardMasterImage = colourGallery.find((source) => source.toLowerCase().includes("-card."));
  if (cardMasterImage) {
    return cardMasterImage;
  }

  const cardReadyImage = colourGallery.find((source) => {
    const normalizedSource = source.toLowerCase();
    return !normalizedSource.includes("model") && !normalizedSource.includes("detail") && !normalizedSource.includes("gallery");
  });

  return cardReadyImage ?? colourGallery[0] ?? image;
}

function productHref(locale: string, slug: string, colour: string) {
  return `/${locale}/products/${slug}?colour=${encodeURIComponent(colour)}`;
}

function inStockVariantSizes(product: CollectionProduct) {
  if (!product.variantStockByColor) {
    return product.variantSizes;
  }

  return Object.fromEntries(
    Object.entries(product.variantStockByColor).map(([colour, stockBySize]) => [
      colour,
      Object.entries(stockBySize)
        .filter(([, stock]) => stock > 0)
        .map(([size]) => size),
    ]),
  );
}

function readViewMode() {
  if (typeof window === "undefined") {
    return "two";
  }

  const stored = window.localStorage.getItem(viewStorageKey);
  return stored === "one" || stored === "two" || stored === "dense" ? stored : "two";
}

export function CollectionView({ locale, products, title, showFilter = true }: { locale: string; products: CollectionProduct[]; title: string; showFilter?: boolean }) {
  const [viewMode, setViewMode] = useState<ViewMode>("two");
  const [visibleCount, setVisibleCount] = useState(initialVisibleProducts);
  const visibleProducts = products.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < products.length;

  useEffect(() => {
    setViewMode(readViewMode());
  }, []);

  useEffect(() => {
    setVisibleCount(initialVisibleProducts);
  }, [products]);

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

      {products.length > 0 ? (
        <section className={`collection-grid collection-grid-${viewMode}`} id="collection-grid" aria-label={`${title} products`}>
          {visibleProducts.map((product, index) => {
            const productSwatches = product.swatches ?? swatchClasses.slice(0, Math.max(1, product.colors));
            const imageByColor = product.colourImages
              ? Object.fromEntries(Object.keys(product.colourImages).map((colour) => [colour, cardImageForColour(product.image, colour, product.colourImages)]))
              : undefined;
            const cardImage = cardImageForColour(product.image, product.color, product.colourImages);
            const isCoverMaster = usesCoverMaster(cardImage);

            return (
              <TransitionLink className="collection-card" href={productHref(locale, product.slug, product.color)} key={`${product.name}-${index}`} style={{ "--product-index": index } as ProductStyle}>
                <div className={`collection-media${isCoverMaster ? " is-cover-master" : ""}`}>
                  {product.badge ? <span className={`collection-badge is-${product.badge.toLowerCase().replaceAll(" ", "-")}`}>{product.badge}</span> : null}
                  <img src={cardImage} alt={product.name} />
                  <QuickAddButton item={{ slug: product.slug, name: product.name, color: product.color, price: product.price, image: cardImage }} swatches={productSwatches} swatchHexes={product.swatchHexes} swatchLabels={product.swatchLabels} sizeOptionsByColor={product.variantSizes} variantStockByColor={product.variantStockByColor} imageByColor={imageByColor} />
                </div>
                <div className="collection-info">
                  <div className="product-title-row">
                    <strong>{product.name}</strong>
                    <SaveProductButton item={{ slug: product.slug, name: product.name, color: product.color, price: product.price, image: cardImage }} />
                  </div>
                  <div className="collection-meta">
                    <span>{product.color}</span>
                    <div>
                      <small>
                        {productSwatches.slice(0, Math.min(product.colors, 3)).map((swatch, swatchIndex) => (
                          <i className={swatchClassName(swatch, product.swatchHexes?.[swatchIndex])} style={swatchStyle(product.swatchHexes?.[swatchIndex])} key={`${product.slug}-${swatch}-${swatchIndex}`} />
                        ))}
                        <span className="colour-count-text">
                          {product.colors > 3 ? `+${product.colors} Colours` : `${product.colors} ${product.colors === 1 ? "Colour" : "Colours"}`}
                        </span>
                      </small>
                    </div>
                  </div>
                  <em>
                    <span>{product.price}</span>
                  </em>
                </div>
              </TransitionLink>
            );
          })}
        </section>
      ) : (
        <section className="collection-empty-state" id="collection-grid" aria-label={`${title} products`} role="status">
          <p>No products yet</p>
        </section>
      )}
      {hasMoreProducts ? (
        <div className="collection-load-more-wrap">
          <button className="collection-load-more-button" type="button" onClick={() => setVisibleCount((count) => Math.min(count + visibleProductStep, products.length))}>
            View more
          </button>
        </div>
      ) : null}
    </>
  );
}
