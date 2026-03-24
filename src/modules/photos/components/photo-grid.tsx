"use client";

import type { PhotoItem } from "../types";

interface PhotoGridProps {
  photos: PhotoItem[];
  onOpenPhoto: (photo: PhotoItem) => void;
}

export function PhotoGrid({ photos, onOpenPhoto }: PhotoGridProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => onOpenPhoto(photo)}
            className="overflow-hidden rounded-2xl bg-card/70 ring-1 ring-border/40"
          >
            <img src={photo.public_url} alt={photo.file_name} className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>

      {photos.length === 0 ? (
        <div className="rounded-3xl bg-card/70 p-8 text-center text-sm text-muted ring-1 ring-border/40">
          Chưa có ảnh nào.
        </div>
      ) : null}
    </>
  );
}
