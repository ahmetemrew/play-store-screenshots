"use client";

import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import BulkCardEditorPanel from "@/components/BulkCardEditorPanel";
import ScreenshotGenerator from "@/components/ScreenshotGenerator";
import useFontLoader, { loadFont } from "@/lib/useFontLoader";
import {
  VIEWPORT_EXPORT_DIMENSIONS as deviceDimensions,
  VIEWPORT_LABELS as deviceNames,
} from "@/lib/rendering/viewport-catalog";
import { inspectInboundCapture as validateUploadedScreenshot } from "@/lib/intake/capture-audit";
import {
  spawnCaptionToken as createTextLayer,
  extractLeadCaption as getScenePrimaryText,
  inflateDraftFromQuery as mergeSceneFromSearchParams,
  serializeDraftToQuery as sceneToSearchParams,
  type CanvasDraft as StudioScene,
  stitchDraftCopyState as syncSceneTextLayers,
} from "@/lib/rendering/draft-state";

type BatchCard = {
  id: string;
  scene: StudioScene;
  fontSignal: number;
  sourceFileName: string | null;
};

type FileValidationResult = {
  file: File;
  isValid: boolean;
  imageUrl?: string;
  error?: string;
};

const stripExtension = (fileName: string) => fileName.replace(/\.[^/.]+$/, "");

const sanitizeFileBaseName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);

const cloneSceneForCard = (
  baseScene: StudioScene,
  headline = baseScene.headline,
  image: string | null = null
) => {
  const nextLayers = baseScene.textLayers.map((layer, index) =>
    createTextLayer(baseScene.frame, {
      ...layer,
      text: index === 0 ? headline : layer.text,
    })
  );

  return syncSceneTextLayers(
    {
      ...baseScene,
      headline,
      image,
    },
    nextLayers
  );
};

const createBatchCard = (
  baseScene: StudioScene,
  headline = baseScene.headline,
  image: string | null = null,
  sourceFileName: string | null = null
): BatchCard => ({
  id: crypto.randomUUID(),
  fontSignal: 0,
  sourceFileName,
  scene: cloneSceneForCard(baseScene, headline, image),
});

type CardPreviewProps = {
  card: BatchCard;
};

function CardPreview({ card }: CardPreviewProps) {
  const outputSize = deviceDimensions[card.scene.frame];

  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <div className="studio-panel studio-panel-strong overflow-hidden px-6 py-6 sm:px-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
              Önizleme
            </p>
            <h3 className="mb-0 text-2xl text-[#f8f4ee]">
              {deviceNames[card.scene.frame]}
            </h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            {outputSize.width} x {outputSize.height}
          </span>
        </div>

        <div className="mx-auto w-full max-w-[460px] rounded-[26px] border border-white/10 bg-black/10 p-4">
          {card.scene.image ? (
            <ScreenshotGenerator
              screenshotImage={card.scene.image}
              headline={card.scene.headline}
              textLayers={card.scene.textLayers}
              frameKey={card.scene.frame}
              textColor={card.scene.textColor}
              backgroundColor={card.scene.backgroundColor}
              bezelWidth={card.scene.bezelWidth}
              bezelColor={card.scene.bezelColor}
              fontFamily={card.scene.fontFamily}
              fontSize={card.scene.fontSize}
              fontWeight={card.scene.fontWeight}
              headlineTop={card.scene.headlineTop}
              frameTop={card.scene.frameTop}
              frameScale={card.scene.frameScale}
              cornerRadius={card.scene.cornerRadius}
              cameraMode={card.scene.cameraMode}
              cameraSizeAdjustment={card.scene.cameraSizeAdjustment}
              cameraGap={card.scene.cameraGap}
              cameraBridgeEnabled={card.scene.cameraBridgeEnabled}
              cameraOffsetX={card.scene.cameraOffsetX}
              cameraOffsetY={card.scene.cameraOffsetY}
              screenshotId={card.id}
              fontLoaded={card.fontSignal}
            />
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-white/[0.04] px-6 text-center text-sm text-white/60">
              Önizleme için görsel yükleyin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BulkUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="studio-panel flex min-h-[420px] items-center justify-center">
          Yükleniyor...
        </div>
      }
    >
      <BulkEditor />
    </Suspense>
  );
}

function BulkEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const baseScene = useMemo<StudioScene>(
    () => mergeSceneFromSearchParams(searchParams),
    [searchParams]
  );

  const [cards, setCards] = useState<BatchCard[]>(() => [
    createBatchCard(baseScene, baseScene.headline, baseScene.image),
  ]);
  const [openEditors, setOpenEditors] = useState<Record<string, boolean>>({});
  const [hasImportedImages, setHasImportedImages] = useState(Boolean(baseScene.image));
  const [isValidating, setIsValidating] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<"zip" | "files">("zip");
  const [preserveOriginalNames, setPreserveOriginalNames] = useState(true);

  useFontLoader(["Inter", "DM Sans", "Outfit", "JetBrains Mono"]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        cards.some((card) => card.scene.image || getScenePrimaryText(card.scene))
      ) {
        event.preventDefault();
        const message = "Kaydedilmemiş değişiklikler kaybolur.";
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cards]);

  const backToEditor = () => {
    router.push(`/?${sceneToSearchParams(baseScene).toString()}`);
  };

  const addCard = () => {
    setCards((current) => [...current, createBatchCard(baseScene)]);
  };

  const patchCardScene = (id: string, patch: Partial<StudioScene>) => {
    setCards((current) =>
      current.map((card) =>
        card.id === id
          ? {
              ...card,
              scene: {
                ...card.scene,
                ...patch,
              },
            }
          : card
      )
    );
  };

  const patchCardTextLayers = (id: string, nextLayers: StudioScene["textLayers"]) => {
    setCards((current) =>
      current.map((card) =>
        card.id === id
          ? {
              ...card,
              scene: syncSceneTextLayers(card.scene, nextLayers),
            }
          : card
      )
    );
  };

  const bumpCardFontSignal = (id: string) => {
    setCards((current) =>
      current.map((card) =>
        card.id === id
          ? {
              ...card,
              fontSignal: card.fontSignal + 1,
            }
          : card
      )
    );
  };

  const changeCardLayerFontFamily = (
    cardId: string,
    layerId: string,
    fontFamily: string
  ) => {
    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              scene: syncSceneTextLayers(
                card.scene,
                card.scene.textLayers.map((layer) =>
                  layer.id === layerId
                    ? {
                        ...layer,
                        fontFamily,
                      }
                    : layer
                )
              ),
            }
          : card
      )
    );

    const family = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
    if (!family) return;
    loadFont(family, () => bumpCardFontSignal(cardId));
  };

  const handleCardImageUpload = (
    cardId: string,
    image: string,
    fileName?: string
  ) => {
    setCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              sourceFileName: fileName ? stripExtension(fileName) : card.sourceFileName,
              scene: {
                ...card.scene,
                image,
              },
            }
          : card
      )
    );
  };

  const resetCardScene = (id: string) => {
    setCards((current) =>
      current.map((card) => {
        if (card.id !== id) return card;

        const nextLayers = card.scene.textLayers.map((layer, index) => {
          const baseLayer =
            baseScene.textLayers[index] ??
            createTextLayer(baseScene.frame, {
              y: baseScene.textLayers[0]?.y
                ? baseScene.textLayers[0].y + index * 120
                : undefined,
            });

          return createTextLayer(baseScene.frame, {
            ...baseLayer,
            text: layer.text,
          });
        });

        return {
          ...card,
          scene: syncSceneTextLayers(
            {
              ...baseScene,
              image: card.scene.image,
            },
            nextLayers
          ),
        };
      })
    );
  };

  const toggleCardEditor = (id: string) => {
    setOpenEditors((current) => {
      const isOpen = current[id] ?? true;
      return {
        ...current,
        [id]: !isOpen,
      };
    });
  };

  const removeCard = (id: string) => {
    setCards((current) => current.filter((card) => card.id !== id));
    setOpenEditors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const validateImageFile = async (file: File): Promise<FileValidationResult> => {
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      return {
        file,
        isValid: false,
        error: `"${file.name}" PNG veya JPEG değil.`,
      };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const image = new Image();

        image.onload = () => {
          const validation = validateUploadedScreenshot({
            deviceType: baseScene.frame,
            width: image.width,
            height: image.height,
          });

          if (!validation.isValid) {
            resolve({
              file,
              isValid: false,
              error: `"${file.name}" ${validation.error}`,
            });
            return;
          }

          resolve({
            file,
            isValid: true,
            imageUrl: event.target?.result as string,
          });
        };

        image.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  };

  const handleMultiUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    setIsValidating(true);
    setUploadErrors([]);

    const files = Array.from(event.target.files).sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { numeric: true })
    );

    const validations = await Promise.all(files.map((file) => validateImageFile(file)));
    const validFiles = validations.filter(
      (result) => result.isValid && result.imageUrl
    );

    if (validFiles.length > 0) {
      setCards((current) => {
        const next = [...current];

        validFiles.forEach((result) => {
          const imageUrl = result.imageUrl || null;
          const fileBaseName = stripExtension(result.file.name);
          const emptyCardIndex = next.findIndex((card) => !card.scene.image);

          if (emptyCardIndex === -1) {
            next.push(createBatchCard(baseScene, baseScene.headline, imageUrl, fileBaseName));
            return;
          }

          const existingCard = next[emptyCardIndex];
          next[emptyCardIndex] = {
            ...existingCard,
            sourceFileName: fileBaseName,
            scene: {
              ...existingCard.scene,
              image: imageUrl,
            },
          };
        });

        return next;
      });

      setHasImportedImages(true);
    }

    setUploadErrors(
      validations
        .filter((result) => !result.isValid && result.error)
        .map((result) => result.error as string)
    );
    setIsValidating(false);
    event.target.value = "";
  };

  const getCardExportBaseName = (card: BatchCard, index: number) => {
    const fallbackName = `toplu-${index + 1}-${baseScene.frame}`;

    if (!preserveOriginalNames || !card.sourceFileName) {
      return fallbackName;
    }

    const sanitized = sanitizeFileBaseName(card.sourceFileName);
    return sanitized || fallbackName;
  };

  const exportZip = async () => {
    const canvases = document.querySelectorAll("canvas[data-screenshot-id]");
    if (!canvases.length) return;

    const zip = new JSZip();

    canvases.forEach((node, index) => {
      const id = node.getAttribute("data-screenshot-id");
      const card = cards.find((item) => item.id === id);

      if (node instanceof HTMLCanvasElement && card?.scene.image) {
        const imageData = node.toDataURL("image/png").split(",")[1];
        zip.file(`${getCardExportBaseName(card, index)}.png`, imageData, {
          base64: true,
        });
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `toplu-çıktı-${baseScene.frame}.zip`);
  };

  const exportFiles = async () => {
    const canvases = Array.from(
      document.querySelectorAll("canvas[data-screenshot-id]")
    );

    for (let index = 0; index < canvases.length; index += 1) {
      const node = canvases[index];
      const id = node.getAttribute("data-screenshot-id");
      const card = cards.find((item) => item.id === id);

      if (!(node instanceof HTMLCanvasElement) || !card?.scene.image) continue;

      const anchor = document.createElement("a");
      anchor.download = `${getCardExportBaseName(card, index)}.png`;
      anchor.href = node.toDataURL("image/png");
      anchor.click();

      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  };

  const runExport = async () => {
    if (exportMode === "zip") {
      await exportZip();
      return;
    }

    await exportFiles();
  };

  const completedCards = cards.filter(
    (card) => card.scene.image && getScenePrimaryText(card.scene).trim()
  ).length;

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px] space-y-6">
        <section className="studio-panel px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="studio-chip">{deviceNames[baseScene.frame]}</span>
              <span className="studio-chip">
                Hazır: {completedCards}/{cards.length || 0}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="studio-button studio-button-secondary"
                onClick={backToEditor}
              >
                Düzenlemeye dön
              </button>
              <button type="button" className="studio-button" onClick={addCard}>
                Yeni kart ekle
              </button>
            </div>
          </div>
        </section>

        <section className="studio-panel px-6 py-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="studio-section-title">Çoklu yükleme</p>
              <p className="mb-0 text-sm studio-muted">
                Tekli moddaki ayarlar yeni kartlara aynen aktarılır. Görselleri toplu
                seçtiğinde her kart hazır düzenlemesiyle açılır.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[rgba(17,24,39,0.08)] bg-white/70 p-5">
            <input
              id="batch-import"
              type="file"
              multiple
              accept="image/png, image/jpeg"
              className="hidden"
              onChange={handleMultiUpload}
            />
            <label
              htmlFor="batch-import"
              className={`flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed px-6 text-center transition ${
                isValidating
                  ? "border-[rgba(17,24,39,0.14)] bg-white/60"
                  : "border-[rgba(17,24,39,0.12)] bg-[#fff8ef] hover:border-[#ff6b35] hover:bg-[#fff2ea]"
              }`}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#171412] text-white shadow-[0_14px_24px_rgba(23,20,18,0.18)]">
                <svg
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
              <p className="mb-0 text-sm font-semibold text-[#171412]">
                {isValidating ? "Dosyalar kontrol ediliyor..." : "Çoklu görsel seç"}
              </p>
            </label>

            {uploadErrors.length > 0 && (
              <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-4">
                <p className="mb-2 text-sm font-semibold text-red-700">Hatalar</p>
                <ul className="space-y-1 text-sm text-red-700">
                  {uploadErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          {cards.map((card, index) => {
            const editorOpen = openEditors[card.id] ?? true;

            return (
              <article
                key={card.id}
                className="studio-panel overflow-hidden px-6 py-6 sm:px-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171412] text-sm font-semibold text-[#fff7ee]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="mb-0 text-sm font-semibold text-[#171412]">
                        Kart {index + 1}
                      </p>
                      <p className="mb-0 text-xs studio-muted">
                        {card.sourceFileName || "Kaynak adı yok"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="studio-button studio-button-secondary"
                      onClick={() => toggleCardEditor(card.id)}
                    >
                      {editorOpen ? "Düzenleyiciyi gizle" : "Düzenleyiciyi aç"}
                    </button>
                    <button
                      type="button"
                      className="studio-button studio-button-ghost"
                      onClick={() => removeCard(card.id)}
                    >
                      Sil
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.92fr)] 2xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.9fr)] lg:items-start">
                  <div className="min-w-0">
                    {editorOpen ? (
                      <BulkCardEditorPanel
                        scene={card.scene}
                        onSceneChange={(patch) => patchCardScene(card.id, patch)}
                        onTextLayersChange={(nextLayers) =>
                          patchCardTextLayers(card.id, nextLayers)
                        }
                        onLayerFontFamilyChange={(layerId, fontFamily) =>
                          changeCardLayerFontFamily(card.id, layerId, fontFamily)
                        }
                        onImageUpload={(image, fileName) =>
                          handleCardImageUpload(card.id, image, fileName)
                        }
                        onReset={() => resetCardScene(card.id)}
                      />
                    ) : (
                      <div className="rounded-[24px] border border-[rgba(17,24,39,0.08)] bg-white/70 px-5 py-6 text-sm studio-muted">
                        Bu kartın düzenleyicisi kapalı. Tekrar açtığında tüm katman
                        ayarları kaldığı yerden devam eder.
                      </div>
                    )}
                  </div>

                  <CardPreview card={card} />
                </div>
              </article>
            );
          })}
        </section>

        <section className="studio-panel studio-panel-strong px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
                  Özet
                </p>
                <h2 className="mb-0 text-3xl text-[#f8f4ee]">Toplu dışa aktarım</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  {deviceNames[baseScene.frame]}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  {cards.length} kart
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                  {completedCards} hazır
                </span>
              </div>
            </div>

            <div className="grid gap-4 lg:min-w-[360px]">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Dışa aktarma biçimi
                </label>
                <div className="relative">
                  <select
                    value={exportMode}
                    onChange={(event) =>
                      setExportMode(event.target.value as "zip" | "files")
                    }
                    className="studio-field appearance-none bg-white/90 pr-12"
                  >
                    <option value="zip">ZIP arşivi</option>
                    <option value="files">Fotoğrafları ayrı indir</option>
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

              <label className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-4">
                <span className="text-sm text-white/80">
                  Yüklenen dosya adını dışa aktarımda koru
                </span>
                <input
                  type="checkbox"
                  checked={preserveOriginalNames}
                  onChange={(event) => setPreserveOriginalNames(event.target.checked)}
                  className="h-5 w-5 rounded border-white/20 text-[#171412] focus:ring-white/20"
                />
              </label>

              <button
                type="button"
                className="studio-button w-full justify-center"
                onClick={runExport}
                disabled={completedCards === 0}
              >
                {exportMode === "zip" ? "ZIP oluştur" : "Fotoğrafları indir"}
              </button>

              {!hasImportedImages && (
                <p className="mb-0 text-xs text-white/45">
                  İstersen kartları tek tek doldurabilir, istersen çoklu içe aktarma
                  ile bir anda hazırlayabilirsin.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
