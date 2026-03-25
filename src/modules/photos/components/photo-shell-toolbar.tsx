"use client";

import { useRef } from "react";
import { FolderPlus, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";

export type TabKey = "photos" | "albums";

interface PhotoShellToolbarProps {
  activeTab: TabKey;
  albumName: string;
  feedback: string | null;
  isCreatingAlbum: boolean;
  isAlbumComposerOpen: boolean;
  onTabChange: (tab: TabKey) => void;
  onAlbumNameChange: (value: string) => void;
  onCreateAlbum: () => void | Promise<void>;
  onToggleAlbumComposer: () => void;
  onUpload: (files: FileList | null) => void | Promise<void>;
}

export function PhotoShellToolbar({
  activeTab,
  albumName,
  feedback,
  isCreatingAlbum,
  isAlbumComposerOpen,
  onTabChange,
  onAlbumNameChange,
  onCreateAlbum,
  onToggleAlbumComposer,
  onUpload
}: PhotoShellToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPhotosTab = activeTab === "photos";

  return (
    <div className="space-y-3 px-1 py-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            void onUpload(event.target.files);
            event.currentTarget.value = "";
          }}
        />

        <Segmented
          options={[
            { value: "photos", label: "Ảnh" },
            { value: "albums", label: "Album" }
          ]}
          value={activeTab}
          onChange={(value) => onTabChange(value as TabKey)}
          className="max-w-[250px] bg-background/60"
        />

        {isPhotosTab ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-10 rounded-full px-4 shadow-none"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="mr-1.5 h-4 w-4" />
            Tải ảnh
          </Button>
        ) : (
          <Button
            variant={isAlbumComposerOpen ? "outline" : "secondary"}
            size="sm"
            className="h-10 rounded-full px-4 shadow-none"
            onClick={onToggleAlbumComposer}
          >
            {isAlbumComposerOpen ? <X className="mr-1.5 h-4 w-4" /> : <FolderPlus className="mr-1.5 h-4 w-4" />}
            {isAlbumComposerOpen ? "Đóng" : "Tạo album"}
          </Button>
        )}
      </div>

      {feedback ? (
        <p className="text-right text-[11px] text-muted" role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      {!isPhotosTab && isAlbumComposerOpen ? (
        <div className="rounded-[26px] border border-border/40 bg-card/70 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label="Tên album mới"
              placeholder="Đặt tên cho album mới"
              value={albumName}
              disabled={isCreatingAlbum}
              className="h-11 rounded-2xl border-white/10 bg-background/70"
              onChange={(event) => onAlbumNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void onCreateAlbum();
                }
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              className="h-11 rounded-2xl px-4 shadow-none"
              disabled={isCreatingAlbum || albumName.trim().length === 0}
              onClick={() => void onCreateAlbum()}
            >
              <FolderPlus className="mr-1.5 h-4 w-4" />
              Tạo ngay
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
