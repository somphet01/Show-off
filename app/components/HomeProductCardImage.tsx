"use client";

import { useEffect, useMemo, useState } from "react";

export function HomeProductCardImage({ images, alt }: { images: string[]; alt: string }) {
  const gallery = useMemo(() => Array.from(new Set(images.filter(Boolean))), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [isRevealingNext, setIsRevealingNext] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setNextIndex(null);
    setIsRevealingNext(false);
  }, [gallery.join("|")]);

  useEffect(() => {
    if (gallery.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      const upcomingIndex = (activeIndex + 1) % gallery.length;
      setNextIndex(upcomingIndex);
      setIsRevealingNext(false);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsRevealingNext(true));
      });

      window.setTimeout(() => {
        setActiveIndex(upcomingIndex);
        setNextIndex(null);
        setIsRevealingNext(false);
      }, 940);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [activeIndex, gallery.length]);

  const image = gallery[activeIndex] ?? gallery[0] ?? "/assets/products-grid.png";

  if (gallery.length <= 1) {
    return <img className="home-product-loop-image is-visible" src={image} alt={alt} draggable={false} />;
  }

  const nextImage = nextIndex === null ? null : gallery[nextIndex];

  return (
    <span className="home-product-crossfade" aria-label={alt}>
      <img className="home-product-loop-image is-current is-visible" src={image} alt={nextImage ? "" : alt} aria-hidden={nextImage ? "true" : undefined} draggable={false} />
      {nextImage ? <img className={`home-product-loop-image is-next${isRevealingNext ? " is-visible" : ""}`} src={nextImage} alt={alt} draggable={false} /> : null}
    </span>
  );
}
