"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const fallbackColours = ["Jet Black", "Flat White", "Washed Black", "Ice Grey Marl", "Indigo", "Powder Blue"];

const colourImageGroups: Record<string, string[]> = {
  black: ["/assets/product-black-pants.jpeg", "/assets/product-black-pants.jpeg", "/assets/product-black-pants.jpeg"],
  white: ["/assets/products-grid.png", "/assets/products-grid.png", "/assets/product-red-jacket.jpeg"],
  blue: ["/assets/products-grid.png", "/assets/product-black-pants.jpeg", "/assets/products-grid.png"],
  red: ["/assets/product-red-jacket.jpeg", "/assets/product-red-jacket.jpeg", "/assets/product-red-jacket.jpeg"],
  neutral: ["/assets/product-black-pants.jpeg", "/assets/products-grid.png", "/assets/product-red-jacket.jpeg"],
};

function colourFamily(colour: string) {
  const value = colour.toLowerCase();

  if (value.includes("black") || value.includes("jet") || value.includes("washed") || value.includes("stained")) return "black";
  if (value.includes("white") || value.includes("grey") || value.includes("ash") || value.includes("marl") || value.includes("bone") || value.includes("cream")) return "white";
  if (value.includes("indigo") || value.includes("blue") || value.includes("cobalt") || value.includes("storm")) return "blue";
  if (value.includes("red") || value.includes("rose") || value.includes("earth")) return "red";
  return "neutral";
}

export function productColourOptions(baseColour: string, colorCount: number, colourImages?: Record<string, string[]>) {
  if (colourImages && Object.keys(colourImages).length > 0) {
    return [baseColour, ...Object.keys(colourImages).filter((colour) => colour !== baseColour)];
  }

  const optionCount = Math.max(1, Math.min(Math.trunc(colorCount) || 1, fallbackColours.length + 1));

  return [baseColour, ...fallbackColours.filter((colour) => colour !== baseColour)].slice(0, optionCount);
}

export function productColourImage(colour: string, fallbackImage: string, colourImages?: Record<string, string[]>) {
  if (colourImages?.[colour]?.[0]) {
    return colourImages[colour][0];
  }

  return colourImageGroups[colourFamily(colour)]?.[0] ?? fallbackImage;
}

export function productGalleryForColour(colour: string, baseColour: string, baseGallery: string[], colourImages?: Record<string, string[]>) {
  if (colourImages?.[colour]?.length) {
    return colourImages[colour];
  }

  if (colour === baseColour) {
    return baseGallery;
  }

  return colourImageGroups[colourFamily(colour)] ?? baseGallery;
}

function usesCoverMaster(image: string) {
  return image.includes("-card.") || image.includes("real-retro-") || image.includes("/product-images/") || image.includes("product-images") || image.includes("so_product=");
}

export function ProductColourGallery({
  baseColour,
  colorCount,
  gallery,
  productName,
  colourImages,
  initialColour,
}: {
  baseColour: string;
  colorCount: number;
  gallery: string[];
  productName: string;
  colourImages?: Record<string, string[]>;
  initialColour?: string;
}) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const colours = useMemo(() => productColourOptions(baseColour, colorCount, colourImages), [baseColour, colorCount, colourImages]);
  const resolvedInitialColour = initialColour && colours.includes(initialColour) ? initialColour : baseColour;
  const [selectedColour, setSelectedColour] = useState(resolvedInitialColour);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const activeImages = useMemo(() => productGalleryForColour(selectedColour, baseColour, gallery, colourImages), [baseColour, colourImages, gallery, selectedColour]);
  const currentLightboxImage = lightboxIndex === null ? null : activeImages[lightboxIndex];

  useEffect(() => {
    setSelectedColour(resolvedInitialColour);
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ left: 0, top: window.scrollY });
    galleryRef.current?.scrollTo({ left: 0 });
  }, [resolvedInitialColour]);

  useEffect(() => {
    const onColourSelected = (event: Event) => {
      const detail = (event as CustomEvent<{ colour?: string }>).detail;

      if (!detail?.colour) {
        return;
      }

      setSelectedColour(detail.colour);
      setLightboxIndex(null);
      galleryRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    };

    window.addEventListener("showoff-product-colour-selected", onColourSelected);

    return () => window.removeEventListener("showoff-product-colour-selected", onColourSelected);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-lock", lightboxIndex !== null);

    const onKeyDown = (event: KeyboardEvent) => {
      if (lightboxIndex === null) {
        return;
      }

      if (event.key === "Escape") {
        setLightboxIndex(null);
      }

      if (event.key === "ArrowRight") {
        setLightboxIndex((index) => (index === null ? index : (index + 1) % activeImages.length));
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((index) => (index === null ? index : (index - 1 + activeImages.length) % activeImages.length));
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("menu-lock");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeImages.length, lightboxIndex]);

  const showPreviousImage = () => {
    setLightboxIndex((index) => (index === null ? index : (index - 1 + activeImages.length) % activeImages.length));
  };

  const showNextImage = () => {
    setLightboxIndex((index) => (index === null ? index : (index + 1) % activeImages.length));
  };

  return (
    <section className="product-showcase" aria-label={`${productName} gallery in ${selectedColour}`}>
      <div className="product-gallery" ref={galleryRef}>
        {activeImages.map((image, index) => (
          <figure className={`product-frame${usesCoverMaster(image) ? " is-cover-master" : ""}`} key={`${selectedColour}-${image}-${index}`}>
            <button type="button" aria-label={`View ${productName} ${selectedColour} image ${index + 1}`} onClick={() => setLightboxIndex(index)}>
              <img src={image} alt={`${productName} ${selectedColour} view ${index + 1}`} />
            </button>
          </figure>
        ))}
      </div>
      <div className="gallery-note">
        <span>1 / {activeImages.length}</span>
        <p>Selected colour: {selectedColour}</p>
        <button type="button" aria-label="Open current product image" onClick={() => setLightboxIndex(0)}>
          <i aria-hidden="true" />
        </button>
      </div>
      {currentLightboxImage
        ? createPortal(
            <div className="product-lightbox is-open" role="dialog" aria-modal="true" aria-label={`${productName} image viewer`}>
              <button className="product-lightbox-close" type="button" aria-label="Close image viewer" onClick={() => setLightboxIndex(null)}>
                Close
              </button>
              <button className="product-lightbox-nav product-lightbox-prev" type="button" aria-label="Previous image" onClick={showPreviousImage}>
                <span aria-hidden="true">{"<"}</span>
              </button>
              <img src={currentLightboxImage} alt={`${productName} ${selectedColour} enlarged view ${(lightboxIndex ?? 0) + 1}`} />
              <button className="product-lightbox-nav product-lightbox-next" type="button" aria-label="Next image" onClick={showNextImage}>
                <span aria-hidden="true">{">"}</span>
              </button>
              <p>
                {(lightboxIndex ?? 0) + 1} / {activeImages.length}
              </p>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
