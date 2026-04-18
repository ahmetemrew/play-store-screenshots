"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import TextLayersEditor from "@/components/TextLayersEditor";
import {
  VIEWPORT_EXPORT_DIMENSIONS as deviceDimensions,
  VIEWPORT_MARKETING_SIZES as deviceDisplaySizes,
  VIEWPORT_LABELS as deviceNames,
} from "@/lib/rendering/viewport-catalog";
import {
  VISUAL_TREATMENT_LIBRARY as studioRecipes,
  type VisualTreatmentId as StudioRecipeKey,
} from "@/lib/brand/treatments";
import {
  viewportHasCameraGeometry as hasFrameCameraCutout,
  type CanvasDraft as StudioScene,
} from "@/lib/rendering/draft-state";

const sliderStyles = `
  .custom-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.12);
    outline: none;
    margin: 10px 0;
  }

  .custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #171412;
    cursor: pointer;
    border: 2px solid #fffaf2;
    box-shadow: 0 4px 14px rgba(17, 24, 39, 0.18);
    margin-top: -6px;
  }

  .custom-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #171412;
    cursor: pointer;
    border: 2px solid #fffaf2;
    box-shadow: 0 4px 14px rgba(17, 24, 39, 0.18);
  }

  .custom-slider::-webkit-slider-thumb:hover,
  .custom-slider::-moz-range-thumb:hover {
    background: #ff6b35;
  }

  .custom-slider::-webkit-slider-runnable-track,
  .custom-slider::-moz-range-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    border-radius: 999px;
  }
`;

type BulkCardEditorPanelProps = {
  scene: StudioScene;
  onSceneChange: (patch: Partial<StudioScene>) => void;
  onTextLayersChange: (nextLayers: StudioScene["textLayers"]) => void;
  onLayerFontFamilyChange: (layerId: string, fontFamily: string) => void;
  onImageUpload: (image: string, fileName?: string) => void;
  onReset: () => void;
};

export default function BulkCardEditorPanel({
  scene,
  onSceneChange,
  onTextLayersChange,
  onLayerFontFamilyChange,
  onImageUpload,
  onReset,
}: BulkCardEditorPanelProps) {
  const [activeRecipe, setActiveRecipe] = useState<StudioRecipeKey | null>(null);
  const frameHasCutout = hasFrameCameraCutout(scene.frame);
  const outputSize = deviceDimensions[scene.frame];

  const applyRecipe = (recipeKey: StudioRecipeKey) => {
    const recipe = studioRecipes[recipeKey];
    setActiveRecipe(recipeKey);
    onSceneChange({
      backgroundColor: recipe.backgroundColor,
      bezelColor: recipe.bezelColor,
      cornerRadius: recipe.borderRadius,
    });
    onTextLayersChange(
      scene.textLayers.map((layer) => ({
        ...layer,
        color: recipe.textColor,
        fontFamily: recipe.fontFamily,
        fontWeight: recipe.fontWeight,
      }))
    );
  };

  const resetPanel = () => {
    setActiveRecipe(null);
    onReset();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />

      <div className="space-y-6">
        <section className="studio-panel px-6 py-6 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.24em] studio-muted">
                Kart düzenleyicisi
              </p>
              <h3 className="mb-0 text-2xl text-[#171412]">
                {deviceNames[scene.frame]}
              </h3>
            </div>

            <button
              type="button"
              className="studio-button studio-button-secondary"
              onClick={resetPanel}
            >
              Kart ayarlarını sıfırla
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="studio-chip">
              {outputSize.width} x {outputSize.height}
            </span>
            {deviceDisplaySizes[scene.frame] && (
              <span className="studio-chip">{deviceDisplaySizes[scene.frame]}</span>
            )}
          </div>
        </section>

        <section className="studio-panel px-6 py-6 sm:px-7">
          <p className="studio-section-title">Görsel</p>
          <ImageUpload
            frameKey={scene.frame}
            onImageUpload={onImageUpload}
          />
        </section>

        <section className="studio-panel px-6 py-6 sm:px-7">
          <p className="studio-section-title">Hazır stil</p>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(studioRecipes) as [
              StudioRecipeKey,
              (typeof studioRecipes)[StudioRecipeKey]
            ][]).map(([key, recipe]) => (
              <button
                key={key}
                type="button"
                className={`studio-chip transition ${
                  activeRecipe === key ? "studio-chip-active" : ""
                }`}
                onClick={() => applyRecipe(key)}
              >
                <span>{recipe.label}</span>
                <span className={activeRecipe === key ? "text-white/70" : "studio-muted"}>
                  {recipe.note}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="studio-panel px-6 py-6 sm:px-7">
          <TextLayersEditor
            frame={scene.frame}
            layers={scene.textLayers}
            canvasWidth={deviceDimensions[scene.frame].width}
            canvasHeight={deviceDimensions[scene.frame].height}
            onLayersChange={onTextLayersChange}
            onLayerFontChange={onLayerFontFamilyChange}
          />
        </section>

        <section className="studio-panel px-6 py-6 sm:px-7">
          <p className="studio-section-title">Çerçeve</p>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium studio-muted">Arka plan</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={scene.backgroundColor}
                  onChange={(event) =>
                    onSceneChange({ backgroundColor: event.target.value })
                  }
                  className="h-11 w-11 rounded-full border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={scene.backgroundColor}
                  onChange={(event) =>
                    onSceneChange({ backgroundColor: event.target.value })
                  }
                  className="studio-field"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">Çerçeve rengi</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={scene.bezelColor}
                  onChange={(event) =>
                    onSceneChange({ bezelColor: event.target.value })
                  }
                  className="h-11 w-11 rounded-full border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={scene.bezelColor}
                  onChange={(event) =>
                    onSceneChange({ bezelColor: event.target.value })
                  }
                  className="studio-field"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">
                Üst konum {scene.frameTop}px
              </label>
              <input
                type="range"
                min={-deviceDimensions[scene.frame].height / 2}
                max={deviceDimensions[scene.frame].height / 2}
                value={scene.frameTop}
                onChange={(event) =>
                  onSceneChange({ frameTop: Number.parseInt(event.target.value, 10) })
                }
                className="custom-slider mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">
                Boyut {scene.frameScale.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={scene.frameScale}
                onChange={(event) =>
                  onSceneChange({
                    frameScale: Number.parseFloat(event.target.value),
                  })
                }
                className="custom-slider mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">
                Çerçeve kalınlığı {scene.bezelWidth}px
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={scene.bezelWidth}
                onChange={(event) =>
                  onSceneChange({
                    bezelWidth: Number.parseInt(event.target.value, 10),
                  })
                }
                className="custom-slider mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium studio-muted">
                Köşeler {scene.cornerRadius}px
              </label>
              <input
                type="range"
                min="0"
                max="60"
                value={scene.cornerRadius}
                onChange={(event) =>
                  onSceneChange({
                    cornerRadius: Number.parseInt(event.target.value, 10),
                  })
                }
                className="custom-slider mt-2 w-full"
              />
            </div>
          </div>

          {frameHasCutout && (
            <>
              <div className="studio-divider my-6" />
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium studio-muted">
                    Kamera tipi
                  </label>
                  <div className="relative mt-2">
                    <select
                      value={scene.cameraMode}
                      onChange={(event) =>
                        onSceneChange({
                          cameraMode: event.target.value as StudioScene["cameraMode"],
                        })
                      }
                      className="studio-field appearance-none pr-12"
                    >
                      <option value="single">Tek kamera</option>
                      <option value="double">Çift kamera</option>
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
                    Kamera boyutu {scene.cameraSizeAdjustment}px
                  </label>
                  <input
                    type="range"
                    min="-12"
                    max="24"
                    value={scene.cameraSizeAdjustment}
                    onChange={(event) =>
                      onSceneChange({
                        cameraSizeAdjustment: Number.parseInt(
                          event.target.value,
                          10
                        ),
                      })
                    }
                    className="custom-slider mt-2 w-full"
                  />
                </div>

                {scene.cameraMode === "double" && (
                  <>
                    <div>
                      <label className="text-sm font-medium studio-muted">
                        Kamera aralığı {scene.cameraGap}px
                      </label>
                      <input
                        type="range"
                        min="-40"
                        max="180"
                        value={scene.cameraGap}
                        onChange={(event) =>
                          onSceneChange({
                            cameraGap: Number.parseInt(event.target.value, 10),
                          })
                        }
                        className="custom-slider mt-2 w-full"
                      />
                    </div>

                    <div className="rounded-[24px] border border-[rgba(17,24,39,0.08)] bg-white/70 px-5 py-4">
                      <label className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-[#171412]">
                          Kameraların arasını doldur
                        </span>
                        <input
                          type="checkbox"
                          checked={scene.cameraBridgeEnabled}
                          onChange={(event) =>
                            onSceneChange({
                              cameraBridgeEnabled: event.target.checked,
                            })
                          }
                          className="h-5 w-5 rounded border-[rgba(17,24,39,0.2)] text-[#171412] focus:ring-[#171412]"
                        />
                      </label>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm font-medium studio-muted">
                    Kamera X {scene.cameraOffsetX}px
                  </label>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    value={scene.cameraOffsetX}
                    onChange={(event) =>
                      onSceneChange({
                        cameraOffsetX: Number.parseInt(event.target.value, 10),
                      })
                    }
                    className="custom-slider mt-2 w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium studio-muted">
                    Kamera Y {scene.cameraOffsetY}px
                  </label>
                  <input
                    type="range"
                    min="-40"
                    max="80"
                    value={scene.cameraOffsetY}
                    onChange={(event) =>
                      onSceneChange({
                        cameraOffsetY: Number.parseInt(event.target.value, 10),
                      })
                    }
                    className="custom-slider mt-2 w-full"
                  />
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
