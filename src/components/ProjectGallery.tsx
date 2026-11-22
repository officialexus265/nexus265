"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";

interface ProjectGalleryProps {
  images: string[];
  title: string;
}

export function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-10 text-center text-muted">
        <Images className="w-8 h-8 mx-auto mb-3 opacity-60" />
        Gallery images will be added soon.
      </div>
    );
  }

  const close = () => setActiveIndex(null);
  const previous = () => setActiveIndex((current) => current === null ? null : (current - 1 + images.length) % images.length);
  const next = () => setActiveIndex((current) => current === null ? null : (current + 1) % images.length);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-card text-left"
            aria-label={`View image ${index + 1} of ${images.length}`}
          >
            <Image src={src} alt={`${title} screenshot ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} image gallery`}
          onClick={close}
        >
          <button type="button" onClick={close} className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Close gallery">
            <X className="w-5 h-5" />
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); previous(); }} className="absolute left-3 md:left-8 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Previous image">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-6xl h-[75vh]" onClick={(event) => event.stopPropagation()}>
            <Image src={images[activeIndex]} alt={`${title} screenshot ${activeIndex + 1}`} fill sizes="100vw" className="object-contain" priority />
          </div>
          <button type="button" onClick={(event) => { event.stopPropagation(); next(); }} className="absolute right-3 md:right-8 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Next image">
            <ChevronRight className="w-6 h-6" />
          </button>
          <p className="absolute bottom-5 text-sm text-white/75">{activeIndex + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}
