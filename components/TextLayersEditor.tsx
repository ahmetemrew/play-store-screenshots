"use client";

import FontSelector from "@/components/FontSelector";
import {
  spawnCaptionToken as createTextLayer,
  type DraftViewportId as FrameKey,
  type CaptionToken as TextLayer,
} from "@/lib/rendering/draft-state";

type TextLayersEditorProps = {
  frame: FrameKey;
  layers: TextLayer[];
  canvasWidth: number;
  canvasHeight: number;
  onLayersChange: (nextLayers: TextLayer[]) => void;
  onLayerFontChange: (layerId: string, fontFamily: string) => void;
};

export default function TextLayersEditor({
  frame,
  layers,
  canvasWidth,
  canvasHeight,
  onLayersChange,
  onLayerFontChange,
}: TextLayersEditorProps) {
  const patchLayer = (layerId: string, patch: Partial<TextLayer>) => {
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
    const nextLayer = createTextLayer(frame, {
      text: "",
      color: previousLayer?.color,
      fontFamily: previousLayer?.fontFamily,
      fontSize: previousLayer?.fontSize,
      fontWeight: previousLayer?.fontWeight,
      x: previousLayer?.x,
      y: previousLayer ? previousLayer.y + 80 : undefined,
      align: previousLayer?.align,
    });

    onLayersChange([...layers, nextLayer]);
  };

  const removeLayer = (layerId: string) => {
    if (layers.length === 1) return;
    onLayersChange(layers.filter((layer) => layer.id !== layerId));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <p className="studio-section-title mb-0">Yazı katmanları</p>
        <button type="button" className="studio-button" onClick={addLayer}>
          Yazı bloğu ekle
        </button>
      </div>

      {layers.map((layer, index) => (
        <div
          key={layer.id}
          className="rounded-[24px] border border-[rgba(17,24,39,0.08)] bg-white/70 px-5 py-5"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] studio-muted">
                Yazı bloğu {index + 1}
              </p>
              <p className="mb-0 text-sm text-[#171412]">
                Konum ve stil bu blok için ayrıdır.
              </p>
            </div>

            {layers.length > 1 && (
              <button
                type="button"
                className="studio-button studio-button-ghost"
                onClick={() => removeLayer(layer.id)}
              >
                Sil
              </button>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium studio-muted">Metin</label>
              <textarea
                value={layer.text}
                onChange={(event) =>
                  patchLayer(layer.id, { text: event.target.value })
                }
                placeholder="Metin girin"
                className="studio-field mt-2 min-h-[140px] resize-y"
              />
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">Yazı tipi</label>
              <div className="mt-2">
                <FontSelector
                  value={layer.fontFamily}
                  onChange={(fontFamily) => onLayerFontChange(layer.id, fontFamily)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">Hizalama</label>
              <div className="relative mt-2">
                <select
                  value={layer.align}
                  onChange={(event) =>
                    patchLayer(layer.id, {
                      align: event.target.value as TextLayer["align"],
                    })
                  }
                  className="studio-field appearance-none pr-12"
                >
                  <option value="start">Sola yaslı</option>
                  <option value="center">Ortala</option>
                  <option value="end">Sağa yaslı</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">Kalınlık</label>
              <div className="relative mt-2">
                <select
                  value={layer.fontWeight}
                  onChange={(event) =>
                    patchLayer(layer.id, { fontWeight: event.target.value })
                  }
                  className="studio-field appearance-none pr-12"
                >
                  <option value="300">İnce</option>
                  <option value="400">Normal</option>
                  <option value="500">Orta</option>
                  <option value="600">Yarı kalın</option>
                  <option value="700">Kalın</option>
                  <option value="800">Çok kalın</option>
                  <option value="900">Siyah</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">
                Boyut {layer.fontSize}px
              </label>
              <input
                type="range"
                min="24"
                max="180"
                value={layer.fontSize}
                onChange={(event) =>
                  patchLayer(layer.id, {
                    fontSize: Number.parseInt(event.target.value, 10),
                  })
                }
                className="custom-slider mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">Yazı rengi</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={layer.color}
                  onChange={(event) =>
                    patchLayer(layer.id, { color: event.target.value })
                  }
                  className="h-11 w-11 rounded-full border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={layer.color}
                  onChange={(event) =>
                    patchLayer(layer.id, { color: event.target.value })
                  }
                  className="studio-field"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">
                X konumu {layer.x}px
              </label>
              <input
                type="range"
                min="40"
                max={Math.max(40, canvasWidth - 40)}
                value={layer.x}
                onChange={(event) =>
                  patchLayer(layer.id, {
                    x: Number.parseInt(event.target.value, 10),
                  })
                }
                className="custom-slider mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">
                Y konumu {layer.y}px
              </label>
              <input
                type="range"
                min="40"
                max={Math.max(40, canvasHeight - 40)}
                value={layer.y}
                onChange={(event) =>
                  patchLayer(layer.id, {
                    y: Number.parseInt(event.target.value, 10),
                  })
                }
                className="custom-slider mt-2 w-full"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
