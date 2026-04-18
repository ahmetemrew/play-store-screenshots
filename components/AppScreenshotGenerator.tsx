"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import ScreenshotGenerator from "@/components/ScreenshotGenerator";
import TextLayersEditor from "@/components/TextLayersEditor";
import useFontLoader, { loadFont } from "@/lib/useFontLoader";
import {
  VIEWPORT_EXPORT_DIMENSIONS as deviceDimensions,
  VIEWPORT_MARKETING_SIZES as deviceDisplaySizes,
  VIEWPORT_LABELS as deviceNames,
  ANDROID_HANDSET_OPTIONS as devicesAndroidPhone,
  ANDROID_TABLET_OPTIONS as devicesAndroidTablet,
  APPLE_TABLET_OPTIONS as devicesIpad,
  APPLE_HANDSET_OPTIONS as devicesIphone,
} from "@/lib/rendering/viewport-catalog";
import {
  VISUAL_TREATMENT_LIBRARY as studioRecipes,
  type VisualTreatmentId as StudioRecipeKey,
} from "@/lib/brand/treatments";
import {
  spawnCaptionToken as createTextLayer,
  buildCanvasDraft as createDefaultScene,
  type DraftViewportId as FrameKey,
  viewportHasCameraGeometry as hasFrameCameraCutout,
  inflateDraftFromQuery as mergeSceneFromSearchParams,
  serializeDraftToQuery as sceneToSearchParams,
  stitchDraftCopyState as syncSceneTextLayers,
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

type ScenePatch = Partial<StudioScene>;

export default function AppScreenshotGenerator() {
  return (
    <Suspense
      fallback={
        <div className="studio-panel flex min-h-[420px] items-center justify-center">
          Yükleniyor...
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [scene, setScene] = useState<StudioScene>(() =>
    mergeSceneFromSearchParams(searchParams)
  );
  const [fontReady, setFontReady] = useState(0);
  const [activeRecipe, setActiveRecipe] = useState<StudioRecipeKey>("editorial");

  useFontLoader(["Inter", "DM Sans", "Outfit", "JetBrains Mono"]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      const message = "Kaydedilmemiş değişiklikler kaybolur.";
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const uniqueFamilies = Array.from(
      new Set(
        scene.textLayers
          .map((layer) => layer.fontFamily.split(",")[0].replace(/['"]/g, "").trim())
          .filter(Boolean)
      )
    );

    if (uniqueFamilies.length === 0) return;

    let completed = 0;
    uniqueFamilies.forEach((family) => {
      loadFont(family, () => {
        completed += 1;
        if (completed === uniqueFamilies.length) {
          setFontReady((current) => current + 1);
        }
      });
    });
  }, [scene.textLayers]);

  const querySnapshot = useMemo(() => sceneToSearchParams(scene).toString(), [scene]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextUrl = `${window.location.pathname}?${querySnapshot}`;
    window.history.replaceState({}, "", nextUrl);
  }, [querySnapshot]);

  const patchScene = (patch: ScenePatch) => {
    setScene((current) => ({ ...current, ...patch }));
  };

  const patchTextLayers = (
    updater:
      | StudioScene["textLayers"]
      | ((currentLayers: StudioScene["textLayers"]) => StudioScene["textLayers"])
  ) => {
    setScene((current) => {
      const nextLayers =
        typeof updater === "function" ? updater(current.textLayers) : updater;
      return syncSceneTextLayers(current, nextLayers);
    });
  };

  const changeLayerFontFamily = (layerId: string, fontFamily: string) => {
    patchTextLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              fontFamily,
            }
          : layer
      )
    );

    const family = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
    if (!family) return;
    loadFont(family, () => setFontReady((current) => current + 1));
  };

  const changeFrame = (frame: FrameKey) => {
    setScene((current) => {
      const next = createDefaultScene(frame, current.headline, current.image);
      const nextLayers = current.textLayers.map((layer, index) =>
        createTextLayer(frame, {
          ...layer,
          y:
            index === 0
              ? next.headlineTop
              : Math.min(
                  deviceDimensions[frame].height - 40,
                  next.headlineTop + index * 120
                ),
        })
      );

      return syncSceneTextLayers(
        {
          ...next,
          image: current.image,
        },
        nextLayers
      );
    });
  };

  const resetFrameDefaults = () => {
    setScene((current) => {
      const next = createDefaultScene(current.frame, current.headline, current.image);
      const nextLayers = current.textLayers.map((layer, index) =>
        createTextLayer(current.frame, {
          ...layer,
          y:
            index === 0
              ? next.headlineTop
              : Math.min(
                  deviceDimensions[current.frame].height - 40,
                  next.headlineTop + index * 120
                ),
        })
      );

      return syncSceneTextLayers(
        {
          ...next,
          image: current.image,
        },
        nextLayers
      );
    });
  };

  const openBulkMode = () => {
    router.push(`/bulk-upload?${sceneToSearchParams(scene).toString()}`);
  };

  const applyRecipe = (recipeKey: StudioRecipeKey) => {
    const recipe = studioRecipes[recipeKey];
    setActiveRecipe(recipeKey);
    setScene((current) =>
      syncSceneTextLayers(
        {
          ...current,
          backgroundColor: recipe.backgroundColor,
          bezelColor: recipe.bezelColor,
          cornerRadius: recipe.borderRadius,
        },
        current.textLayers.map((layer) => ({
          ...layer,
          color: recipe.textColor,
          fontFamily: recipe.fontFamily,
          fontWeight: recipe.fontWeight,
        }))
      )
    );
  };

  const outputSize = deviceDimensions[scene.frame];
  const frameHasCutout = hasFrameCameraCutout(scene.frame);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.92fr)] 2xl:grid-cols-[minmax(0,1.4fr)_minmax(420px,0.9fr)]">
        <div className="space-y-6">
          <section className="studio-panel px-6 py-6 sm:px-7">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-2">
                <label htmlFor="frame" className="text-sm font-medium studio-muted">
                  Cihaz
                </label>
                <div className="relative">
                  <select
                    id="frame"
                    value={scene.frame}
                    onChange={(event) => changeFrame(event.target.value as FrameKey)}
                    className="studio-field appearance-none pr-12 text-base"
                  >
                    <optgroup label="Android Telefon">
                      {Object.entries(devicesAndroidPhone).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Android Tablet">
                      {Object.entries(devicesAndroidTablet).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="iPad">
                      {Object.entries(devicesIpad).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="iPhone">
                      {Object.entries(devicesIphone).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#171412]">
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

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="studio-button studio-button-secondary"
                  onClick={resetFrameDefaults}
                >
                  Cihaz ayarlarını sıfırla
                </button>
                <button type="button" className="studio-button" onClick={openBulkMode}>
                  Toplu moda geç
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="studio-chip">{deviceNames[scene.frame]}</span>
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
              onImageUpload={(image) => patchScene({ image })}
            />
          </section>

          <section className="studio-panel px-6 py-6 sm:px-7">
            <p className="studio-section-title">Hazır Stil</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(studioRecipes) as [StudioRecipeKey, (typeof studioRecipes)[StudioRecipeKey]][]).map(
                ([key, recipe]) => (
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
                )
              )}
            </div>
          </section>

          <section className="studio-panel px-6 py-6 sm:px-7">
            <TextLayersEditor
              frame={scene.frame}
              layers={scene.textLayers}
              canvasWidth={deviceDimensions[scene.frame].width}
              canvasHeight={deviceDimensions[scene.frame].height}
              onLayersChange={patchTextLayers}
              onLayerFontChange={changeLayerFontFamily}
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
                      patchScene({ backgroundColor: event.target.value })
                    }
                    className="h-11 w-11 rounded-full border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={scene.backgroundColor}
                    onChange={(event) =>
                      patchScene({ backgroundColor: event.target.value })
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
                    onChange={(event) => patchScene({ bezelColor: event.target.value })}
                    className="h-11 w-11 rounded-full border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={scene.bezelColor}
                    onChange={(event) => patchScene({ bezelColor: event.target.value })}
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
                    patchScene({ frameTop: Number.parseInt(event.target.value, 10) })
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
                    patchScene({ frameScale: Number.parseFloat(event.target.value) })
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
                    patchScene({ bezelWidth: Number.parseInt(event.target.value, 10) })
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
                    patchScene({ cornerRadius: Number.parseInt(event.target.value, 10) })
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
                          patchScene({
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
                        patchScene({
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
                            patchScene({
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
                              patchScene({
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
                        patchScene({
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
                        patchScene({
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

        <aside className="lg:self-start lg:justify-self-end lg:w-full lg:max-w-[460px]">
          <div className="studio-panel studio-panel-strong overflow-hidden px-6 py-6 sm:px-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
                  Önizleme
                </p>
                <h3 className="mb-0 text-2xl text-[#f8f4ee]">
                  {deviceNames[scene.frame]}
                </h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                {outputSize.width} x {outputSize.height}
              </span>
            </div>

            <div className="mx-auto w-full max-w-[460px] rounded-[26px] border border-white/10 bg-black/10 p-4">
              {scene.image ? (
                <ScreenshotGenerator
                  frameKey={scene.frame}
                  headline={scene.headline}
                  textLayers={scene.textLayers}
                  screenshotImage={scene.image}
                  textColor={scene.textColor}
                  backgroundColor={scene.backgroundColor}
                  bezelWidth={scene.bezelWidth}
                  bezelColor={scene.bezelColor}
                  fontFamily={scene.fontFamily}
                  fontSize={scene.fontSize}
                  fontWeight={scene.fontWeight}
                  headlineTop={scene.headlineTop}
                  frameTop={scene.frameTop}
                  frameScale={scene.frameScale}
                  cornerRadius={scene.cornerRadius}
                  cameraMode={scene.cameraMode}
                  cameraSizeAdjustment={scene.cameraSizeAdjustment}
                  cameraGap={scene.cameraGap}
                  cameraBridgeEnabled={scene.cameraBridgeEnabled}
                  cameraOffsetX={scene.cameraOffsetX}
                  cameraOffsetY={scene.cameraOffsetY}
                  fontLoaded={fontReady}
                />
              ) : (
                <div className="flex min-h-[420px] items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-white/[0.04] px-6 text-center text-sm text-white/60">
                  Önizleme için görsel yükleyin.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
