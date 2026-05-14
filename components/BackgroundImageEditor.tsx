"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  VIEWPORT_EXPORT_DIMENSIONS as deviceDimensions,
} from "@/lib/rendering/viewport-catalog";
import {
  persistBackgroundImageAsset,
  type CanvasDraft as StudioScene,
} from "@/lib/rendering/draft-state";

type BackgroundImageEditorProps = {
  scene: StudioScene;
  onSceneChange: (patch: Partial<StudioScene>) => void;
  onApplyToAll?: () => void;
};

const BACKGROUND_IMAGE_DEFAULTS = {
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
} as const;

export default function BackgroundImageEditor({
  scene,
  onSceneChange,
  onApplyToAll,
}: BackgroundImageEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const outputSize = deviceDimensions[scene.frame];

  const openPicker = () => inputRef.current?.click();

  const applyBackgroundImage = (imageDataUrl: string, nextFileLabel?: string) => {
    const assetId = persistBackgroundImageAsset(imageDataUrl);

    onSceneChange({
      backgroundImage: imageDataUrl,
      backgroundImageAssetId: assetId,
      backgroundImageScale: BACKGROUND_IMAGE_DEFAULTS.scale,
      backgroundImageRotation: BACKGROUND_IMAGE_DEFAULTS.rotation,
      backgroundImageOffsetX: BACKGROUND_IMAGE_DEFAULTS.offsetX,
      backgroundImageOffsetY: BACKGROUND_IMAGE_DEFAULTS.offsetY,
    });

    if (nextFileLabel) {
      setFileLabel(nextFileLabel);
    }
  };

  const processFile = (selectedFile: File) => {
    setError(null);

    if (!selectedFile.type.startsWith("image/")) {
      setError("Arkaplan icin yalnizca gorsel dosyalari yukleyin.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;

      if (typeof result !== "string") {
        setError("Arkaplan gorseli okunamadi.");
        return;
      }

      applyBackgroundImage(result, selectedFile.name);
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
    event.target.value = "";
  };

  const clearBackgroundImage = () => {
    setError(null);
    setFileLabel(null);
    onSceneChange({
      backgroundImage: null,
      backgroundImageAssetId: null,
      backgroundImageScale: BACKGROUND_IMAGE_DEFAULTS.scale,
      backgroundImageRotation: BACKGROUND_IMAGE_DEFAULTS.rotation,
      backgroundImageOffsetX: BACKGROUND_IMAGE_DEFAULTS.offsetX,
      backgroundImageOffsetY: BACKGROUND_IMAGE_DEFAULTS.offsetY,
    });
  };

  const resetPlacement = () => {
    onSceneChange({
      backgroundImageScale: BACKGROUND_IMAGE_DEFAULTS.scale,
      backgroundImageRotation: BACKGROUND_IMAGE_DEFAULTS.rotation,
      backgroundImageOffsetX: BACKGROUND_IMAGE_DEFAULTS.offsetX,
      backgroundImageOffsetY: BACKGROUND_IMAGE_DEFAULTS.offsetY,
    });
  };

  return (
    <section className="studio-panel px-6 py-6 sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="studio-section-title">Arkaplan gorseli</p>
          <p className="mb-0 text-sm studio-muted">
            Renk dolgusunun ustune arkaplan gorseli yerlestirin ve tum tuvali
            dolduracak sekilde konumlayin.
          </p>
        </div>

        {onApplyToAll && (
          <button
            type="button"
            className="studio-button studio-button-secondary"
            onClick={onApplyToAll}
          >
            Tum kartlara uygula
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />

          <button
            type="button"
            onClick={openPicker}
            className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[rgba(71,55,46,0.12)] bg-white/60 px-5 text-center transition hover:border-[#c46e4d] hover:bg-[#f5e8de]"
          >
            {scene.backgroundImage ? (
              <div className="w-full space-y-3">
                <div className="overflow-hidden rounded-[20px] border border-[rgba(71,55,46,0.08)] bg-[#f6f0e8]">
                  <img
                    src={scene.backgroundImage}
                    alt="Arkaplan onizlemesi"
                    className="h-[150px] w-full object-cover"
                  />
                </div>
                <p className="mb-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#221c18]">
                  Arkaplani degistir
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2c221d] text-white shadow-[0_14px_24px_rgba(44,34,29,0.18)]">
                  <svg
                    suppressHydrationWarning
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16V4m0 0-4 4m4-4 4 4M5 20h14"
                    />
                  </svg>
                </div>
                <p className="mb-0 text-sm font-semibold text-[#221c18]">
                  Arkaplan gorseli sec
                </p>
                <p className="mb-0 mt-2 text-xs studio-muted">
                  PNG, JPEG veya diger gorsel formatlarini kullanabilirsiniz.
                </p>
              </>
            )}
          </button>

          {(fileLabel || scene.backgroundImage) && !error && (
            <div className="rounded-full border border-[rgba(71,55,46,0.08)] bg-white/70 px-4 py-2 text-xs font-medium text-[#221c18]">
              {fileLabel || "Arkaplan gorseli aktif"}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium studio-muted">
              Olcek {scene.backgroundImageScale.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scene.backgroundImageScale}
              onChange={(event) =>
                onSceneChange({
                  backgroundImageScale: Number.parseFloat(event.target.value),
                })
              }
              className="custom-slider mt-2 w-full"
              disabled={!scene.backgroundImage}
            />
          </div>

          <div>
            <label className="text-sm font-medium studio-muted">
              Aci {scene.backgroundImageRotation.toFixed(0)}°
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={scene.backgroundImageRotation}
              onChange={(event) =>
                onSceneChange({
                  backgroundImageRotation: Number.parseFloat(event.target.value),
                })
              }
              className="custom-slider mt-2 w-full"
              disabled={!scene.backgroundImage}
            />
          </div>

          <div>
            <label className="text-sm font-medium studio-muted">
              Konum X {scene.backgroundImageOffsetX}px
            </label>
            <input
              type="range"
              min={-Math.round(outputSize.width / 2)}
              max={Math.round(outputSize.width / 2)}
              step="1"
              value={scene.backgroundImageOffsetX}
              onChange={(event) =>
                onSceneChange({
                  backgroundImageOffsetX: Number.parseInt(event.target.value, 10),
                })
              }
              className="custom-slider mt-2 w-full"
              disabled={!scene.backgroundImage}
            />
          </div>

          <div>
            <label className="text-sm font-medium studio-muted">
              Konum Y {scene.backgroundImageOffsetY}px
            </label>
            <input
              type="range"
              min={-Math.round(outputSize.height / 2)}
              max={Math.round(outputSize.height / 2)}
              step="1"
              value={scene.backgroundImageOffsetY}
              onChange={(event) =>
                onSceneChange({
                  backgroundImageOffsetY: Number.parseInt(event.target.value, 10),
                })
              }
              className="custom-slider mt-2 w-full"
              disabled={!scene.backgroundImage}
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="button"
              className="studio-button studio-button-secondary"
              onClick={resetPlacement}
              disabled={!scene.backgroundImage}
            >
              Konumu sifirla
            </button>
            <button
              type="button"
              className="studio-button studio-button-ghost"
              onClick={clearBackgroundImage}
              disabled={!scene.backgroundImage}
            >
              Arkaplani kaldir
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
