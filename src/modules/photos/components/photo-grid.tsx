"use client";

import type { PhotoItem } from "../types";

interface PhotoGridProps {
  photos: PhotoItem[];
  onOpenPhoto: (photo: PhotoItem) => void;
}

export function PhotoGrid({ photos, onOpenPhoto }: PhotoGridProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => onOpenPhoto(photo)}
            className="group overflow-hidden rounded-lg bg-card/40 ring-1 ring-black/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0"
          >
            <img
              src={photo.public_url}
              alt={photo.file_name}
              className="aspect-square w-full object-cover transition duration-200 group-hover:scale-[1.015]"
            />
          </button>
        ))}
      </div>

      {photos.length === 0 ? (
        <div className="rounded-3xl bg-card/70 p-8 text-center text-sm text-muted ring-1 ring-border/40">
          {"Ch\u01b0a c\u00f3 \u1ea3nh n\u00e0o."}
        </div>
      ) : null}
    </>
  );
}