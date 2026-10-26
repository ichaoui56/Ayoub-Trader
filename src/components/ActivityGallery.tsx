"use client";

import { useState } from "react";
import type { ActivityImage } from "../activities";

type ActivityGalleryProps = {
  title: string;
  location: string;
  images: ActivityImage[];
};

export default function ActivityGallery({ title, location, images }: ActivityGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <div className="activity-gallery">
      <figure className="activity-detail__image">
        <img src={activeImage.src} alt={activeImage.alt} fetchPriority="high" />
        <figcaption>{title} · {location}</figcaption>
      </figure>
      {images.length > 1 && (
        <div className="activity-gallery__thumbnails" role="group" aria-label={`${title} photos`}>
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              className={`activity-gallery__thumbnail${index === activeIndex ? " is-active" : ""}`}
              aria-label={`Show photo ${index + 1} of ${images.length}: ${image.alt}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <img src={image.src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
