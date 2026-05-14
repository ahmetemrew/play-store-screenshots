"use client";

import { ChangeEvent } from "react";
import {
  persistObjectImageAsset,
  spawnObjectLayer,
  type DraftViewportId as FrameKey,
  type ObjectLayerToken,
} from "@/lib/rendering/draft-state";

type ObjectLayersEditorProps = {
  frame: FrameKey;
  layers: ObjectLayerToken[];
  canvasWidth: number;
  canvasHeight: number;
  onLayersChange: (nextLayers: ObjectLayerToken[]) => void;
};

export default function ObjectLayersEditor({
  frame,
  layers,
  canvasWidth,
  canvasHeight,
  onLayersChange,
}: ObjectLayersEditorProps) {
  const patchLayer = (layerId: string, patch: Partial<ObjectLayerToken>) => {
    onLayersChange(
      layers.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              ...patch,
            }
          : layer
      )
    );
  };

  const addLayer = () => {
    const previousLayer = layers[layers.length - 1];
    const nextLayer = spawnObjectLayer(frame, {
      x: previousLayer ? Math.min(canvasWidth - 40, previousLayer.x + 36) : undefined,
      y: previousLayer ? Math.min(canvasHeight - 40, previousLayer.y + 36) : undefined,
      scale: previousLayer?.scale,
      rotation: previousLayer?.rotation,
      opacity: previousLayer?.opacity,
    });

    onLayersChange([...layers, nextLayer]);
  };

  const removeLayer = (layerId: string) => {
    onLayersChange(layers.filter((layer) => layer.id !== layerId));
  };

  const moveLayer = (layerId: string, direction: -1 | 1) => {
    const index = layers.findIndex((layer) => layer.id === layerId);
    const targetIndex = index + direction;

    if (index === -1 || targetIndex < 0 || targetIndex >= layers.length) {
      return;
    }

    const nextLayers = [...layers];
    const [moved] = nextLayers.splice(index, 1);
    nextLayers.splice(targetIndex, 0, moved);
    onLayersChange(nextLayers);
  };

  const processFile = (layerId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") return;

      const image = new Image();
      image.onload = () => {
        const targetMax = Math.round(Math.min(canvasWidth, canvasHeight) * 0.24);
        const scaleToFit = Math.min(1, targetMax / Math.max(image.width, image.height));
        const assetId = persistObjectImageAsset(result);

        patchLayer(layerId, {
          assetId,
          image: result,
          name: file.name.replace(/\.[^/.]+$/, ""),
          baseWidth: Math.max(48, Math.round(image.width * scaleToFit)),
          baseHeight: Math.max(48, Math.round(image.height * scaleToFit)),
          scale: 1,
          rotation: 0,
          opacity: 1,
          x: Math.round(canvasWidth / 2),
          y: Math.round(canvasHeight / 2),
        });
      };

      image.src = result;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange =
    (layerId: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      processFile(layerId, file);
      event.target.value = "";
    };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-0 studio-section-title">Obje katmanları</p>
          <p className="mb-0 mt-2 text-sm studio-muted">
            PNG, JPG veya diğer görsel dosyalarını sahneye yerleştirin. Konumu
            ister aşağıdaki kaydırıcılarla ister önizleme üstünde sürükleyerek
            ayarlayabilirsiniz.
          </p>
        </div>

        <button type="button" className="studio-button" onClick={addLayer}>
          Obje ekle
        </button>
      </div>

      {layers.length === 0 && (
        <div className="rounded-[24px] border border-[rgba(71,55,46,0.08)] bg-white/70 px-5 py-6 text-sm studio-muted">
          Henüz obje yok. Yeni bir katman ekleyip görsel yükleyebilirsiniz.
        </div>
      )}

      {layers.map((layer, index) => (
        <div
          key={layer.id}
          className="rounded-[24px] border border-[rgba(71,55,46,0.08)] bg-white/70 px-5 py-5"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] studio-muted">
                Obje {index + 1}
              </p>
              <p className="mb-0 text-sm text-[#221c18]">
                {layer.name || "Görsel seçilmedi"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="studio-button studio-button-ghost"
                onClick={() => moveLayer(layer.id, 1)}
                disabled={index === layers.length - 1}
              >
                Üste al
              </button>
              <button
                type="button"
                className="studio-button studio-button-ghost"
                onClick={() => moveLayer(layer.id, -1)}
                disabled={index === 0}
              >
                Alta al
              </button>
              <button
                type="button"
                className="studio-button studio-button-ghost"
                onClick={() => removeLayer(layer.id)}
              >
                Sil
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="space-y-3">
              <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[rgba(71,55,46,0.12)] bg-[#faf3ea] px-4 text-center transition hover:border-[#c46e4d] hover:bg-[#f5e8de]">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange(layer.id)}
                />

                {layer.image ? (
                  <div className="w-full space-y-3">
                    <div className="overflow-hidden rounded-[18px] border border-[rgba(71,55,46,0.08)] bg-[#f6f0e8]">
                      <img
                        src={layer.image}
                        alt={layer.name || `Obje ${index + 1}`}
                        className="h-[118px] w-full object-contain"
                      />
                    </div>
                    <p className="mb-0 text-xs font-semibold uppercase tracking-[0.18em] text-[#221c18]">
                      Görseli değiştir
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2c221d] text-white shadow-[0_12px_24px_rgba(44,34,29,0.18)]">
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
                      Görsel seç
                    </p>
                    <p className="mb-0 mt-2 text-xs studio-muted">
                      PNG, JPG veya diğer görseller
                    </p>
                  </>
                )}
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium studio-muted">
                  Boyut {layer.scale.toFixed(2)}x
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="3"
                  step="0.05"
                  value={layer.scale}
                  onChange={(event) =>
                    patchLayer(layer.id, {
                      scale: Number.parseFloat(event.target.value),
                    })
                  }
                  className="custom-slider mt-2 w-full"
                  disabled={!layer.image}
                />
              </div>

              <div>
                <label className="text-sm font-medium studio-muted">
                  Opaklık {Math.round(layer.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={layer.opacity}
                  onChange={(event) =>
                    patchLayer(layer.id, {
                      opacity: Number.parseFloat(event.target.value),
                    })
                  }
                  className="custom-slider mt-2 w-full"
                  disabled={!layer.image}
                />
              </div>

              <div>
                <label className="text-sm font-medium studio-muted">
                  Açı {layer.rotation.toFixed(0)}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={layer.rotation}
                  onChange={(event) =>
                    patchLayer(layer.id, {
                      rotation: Number.parseFloat(event.target.value),
                    })
                  }
                  className="custom-slider mt-2 w-full"
                  disabled={!layer.image}
                />
              </div>

              <div>
                <label className="text-sm font-medium studio-muted">
                  X konumu {layer.x}px
                </label>
                <input
                  type="range"
                  min="0"
                  max={canvasWidth}
                  value={layer.x}
                  onChange={(event) =>
                    patchLayer(layer.id, {
                      x: Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="custom-slider mt-2 w-full"
                  disabled={!layer.image}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium studio-muted">
                  Y konumu {layer.y}px
                </label>
                <input
                  type="range"
                  min="0"
                  max={canvasHeight}
                  value={layer.y}
                  onChange={(event) =>
                    patchLayer(layer.id, {
                      y: Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="custom-slider mt-2 w-full"
                  disabled={!layer.image}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
