import {
  CAMERA_TUNING_DEFAULTS,
  VIEWPORT_CAMERA_GEOMETRY,
  VIEWPORT_EXPORT_DIMENSIONS,
  VIEWPORT_STARTER_TOKENS,
} from "@/lib/rendering/viewport-catalog";

type QueryShapeReader = {
  get(name: string): string | null;
};

export type DraftViewportId = keyof typeof VIEWPORT_STARTER_TOKENS;
export type CopyDock = "start" | "center" | "end";

export type CaptionToken = {
  id: string;
  text: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  x: number;
  y: number;
  align: CopyDock;
};

export type ObjectLayerToken = {
  id: string;
  assetId: string | null;
  image: string | null;
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  baseWidth: number;
  baseHeight: number;
};

export type CanvasDraft = {
  frame: DraftViewportId;
  headline: string;
  textLayers: CaptionToken[];
  objectLayers: ObjectLayerToken[];
  image: string | null;
  textColor: string;
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundImageAssetId: string | null;
  backgroundImageScale: number;
  backgroundImageRotation: number;
  backgroundImageOffsetX: number;
  backgroundImageOffsetY: number;
  bezelWidth: number;
  bezelColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  headlineTop: number;
  frameTop: number;
  frameOffsetX: number;
  frameScale: number;
  cornerRadius: number;
  cameraMode: "single" | "double";
  cameraSizeAdjustment: number;
  cameraGap: number;
  cameraBridgeEnabled: boolean;
  cameraOffsetX: number;
  cameraOffsetY: number;
};

export type BackgroundLayerPatch = Pick<
  CanvasDraft,
  | "backgroundColor"
  | "backgroundImage"
  | "backgroundImageAssetId"
  | "backgroundImageScale"
  | "backgroundImageRotation"
  | "backgroundImageOffsetX"
  | "backgroundImageOffsetY"
>;

const DEFAULT_TEXT_COLOR = "#221c18";
const DEFAULT_FONT_FAMILY = "Inter, sans-serif";
const DEFAULT_FONT_SIZE = 96;
const DEFAULT_FONT_WEIGHT = "600";
const BACKGROUND_IMAGE_DEFAULTS = {
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
} as const;
const OBJECT_LAYER_DEFAULTS = {
  scale: 1,
  rotation: 0,
  opacity: 1,
  baseWidth: 240,
  baseHeight: 240,
} as const;
const BACKGROUND_IMAGE_STORAGE_PREFIX = "launchcanvas.background-image";
const OBJECT_IMAGE_STORAGE_PREFIX = "launchcanvas.object-image";

const makeCaptionTokenId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `copy-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `copy-${Math.random().toString(36).slice(2, 10)}`;
};

const makeObjectLayerId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `object-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `object-${Math.random().toString(36).slice(2, 10)}`;
};

const makeBackgroundImageAssetId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `bg-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `bg-${Math.random().toString(36).slice(2, 10)}`;
};

const readNumericToken = (
  raw: string | null,
  fallback: number,
  mode: "int" | "float" = "int"
) => {
  if (!raw) return fallback;

  const parsed =
    mode === "float" ? Number.parseFloat(raw) : Number.parseInt(raw, 10);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const readBooleanToken = (raw: string | null, fallback: boolean) => {
  if (raw === null) return fallback;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
};

const normalizeCaptionTokens = (
  raw: string | null,
  fallback: CaptionToken[]
): CaptionToken[] => {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;

    const seedToken = fallback[0];
    const normalized = parsed
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;

        const candidate = entry as Partial<CaptionToken>;
        if (typeof candidate.text !== "string") return null;

        return {
          id:
            typeof candidate.id === "string" && candidate.id.trim() !== ""
              ? candidate.id
              : `copy-${index + 1}`,
          text: candidate.text,
          color:
            typeof candidate.color === "string" && candidate.color.trim() !== ""
              ? candidate.color
              : seedToken?.color ?? DEFAULT_TEXT_COLOR,
          fontFamily:
            typeof candidate.fontFamily === "string" &&
            candidate.fontFamily.trim() !== ""
              ? candidate.fontFamily
              : seedToken?.fontFamily ?? DEFAULT_FONT_FAMILY,
          fontSize:
            typeof candidate.fontSize === "number" &&
            Number.isFinite(candidate.fontSize)
              ? candidate.fontSize
              : seedToken?.fontSize ?? DEFAULT_FONT_SIZE,
          fontWeight:
            typeof candidate.fontWeight === "string" &&
            candidate.fontWeight.trim() !== ""
              ? candidate.fontWeight
              : seedToken?.fontWeight ?? DEFAULT_FONT_WEIGHT,
          x:
            typeof candidate.x === "number" && Number.isFinite(candidate.x)
              ? candidate.x
              : seedToken?.x ?? 0,
          y:
            typeof candidate.y === "number" && Number.isFinite(candidate.y)
              ? candidate.y
              : seedToken?.y ?? 0,
          align:
            candidate.align === "start" ||
            candidate.align === "center" ||
            candidate.align === "end"
              ? candidate.align
              : "center",
        } satisfies CaptionToken;
      })
      .filter((entry): entry is CaptionToken => entry !== null);

    return normalized.length > 0 ? normalized : fallback;
  } catch {
    return fallback;
  }
};

const normalizeObjectTokens = (
  raw: string | null,
  viewportId: DraftViewportId,
  hydrateMedia: boolean
): ObjectLayerToken[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized: ObjectLayerToken[] = [];

    parsed.forEach((entry, index) => {
      if (!entry || typeof entry !== "object") return;

      const candidate = entry as Partial<ObjectLayerToken>;
      const assetId =
        typeof candidate.assetId === "string" && candidate.assetId.trim() !== ""
          ? candidate.assetId
          : null;
      const image = hydrateMedia ? readObjectImageAsset(assetId) : null;
      if (hydrateMedia && assetId && !image) return;

      const seed = spawnObjectLayer(viewportId, {});

      normalized.push({
        id:
          typeof candidate.id === "string" && candidate.id.trim() !== ""
            ? candidate.id
            : `object-${index + 1}`,
        assetId,
        image,
        name:
          typeof candidate.name === "string" && candidate.name.trim() !== ""
            ? candidate.name
            : `Obje ${index + 1}`,
        x:
          typeof candidate.x === "number" && Number.isFinite(candidate.x)
            ? candidate.x
            : seed.x,
        y:
          typeof candidate.y === "number" && Number.isFinite(candidate.y)
            ? candidate.y
            : seed.y,
        scale:
          typeof candidate.scale === "number" && Number.isFinite(candidate.scale)
            ? candidate.scale
            : OBJECT_LAYER_DEFAULTS.scale,
        rotation:
          typeof candidate.rotation === "number" &&
          Number.isFinite(candidate.rotation)
            ? candidate.rotation
            : OBJECT_LAYER_DEFAULTS.rotation,
        opacity:
          typeof candidate.opacity === "number" &&
          Number.isFinite(candidate.opacity)
            ? candidate.opacity
            : OBJECT_LAYER_DEFAULTS.opacity,
        baseWidth:
          typeof candidate.baseWidth === "number" &&
          Number.isFinite(candidate.baseWidth)
            ? candidate.baseWidth
            : OBJECT_LAYER_DEFAULTS.baseWidth,
        baseHeight:
          typeof candidate.baseHeight === "number" &&
          Number.isFinite(candidate.baseHeight)
            ? candidate.baseHeight
            : OBJECT_LAYER_DEFAULTS.baseHeight,
      });
    });

    return normalized;
  } catch {
    return [];
  }
};

export const spawnCaptionToken = (
  viewportId: DraftViewportId,
  overrides: Partial<CaptionToken> = {}
): CaptionToken => {
  const exportSize = VIEWPORT_EXPORT_DIMENSIONS[viewportId];
  const starter = VIEWPORT_STARTER_TOKENS[viewportId];

  return {
    id: overrides.id ?? makeCaptionTokenId(),
    text: overrides.text ?? "",
    color: overrides.color ?? starter.textColor,
    fontFamily: overrides.fontFamily ?? starter.fontFamily,
    fontSize: overrides.fontSize ?? starter.fontSize,
    fontWeight: overrides.fontWeight ?? String(starter.fontWeight),
    x: overrides.x ?? Math.round(exportSize.width / 2),
    y: overrides.y ?? starter.textTopDistance,
    align: overrides.align ?? "center",
  };
};

export const spawnObjectLayer = (
  viewportId: DraftViewportId,
  overrides: Partial<ObjectLayerToken> = {}
): ObjectLayerToken => {
  const exportSize = VIEWPORT_EXPORT_DIMENSIONS[viewportId];

  return {
    id: overrides.id ?? makeObjectLayerId(),
    assetId: overrides.assetId ?? null,
    image: overrides.image ?? null,
    name: overrides.name ?? "",
    x: overrides.x ?? Math.round(exportSize.width / 2),
    y: overrides.y ?? Math.round(exportSize.height / 2),
    scale: overrides.scale ?? OBJECT_LAYER_DEFAULTS.scale,
    rotation: overrides.rotation ?? OBJECT_LAYER_DEFAULTS.rotation,
    opacity: overrides.opacity ?? OBJECT_LAYER_DEFAULTS.opacity,
    baseWidth: overrides.baseWidth ?? OBJECT_LAYER_DEFAULTS.baseWidth,
    baseHeight: overrides.baseHeight ?? OBJECT_LAYER_DEFAULTS.baseHeight,
  };
};

export const stitchDraftCopyState = (
  draft: CanvasDraft,
  nextTokens: CaptionToken[]
): CanvasDraft => {
  const safeTokens =
    nextTokens.length > 0
      ? nextTokens
      : [spawnCaptionToken(draft.frame, { text: draft.headline })];
  const leadToken = safeTokens[0];

  return {
    ...draft,
    headline: leadToken.text,
    textLayers: safeTokens,
    textColor: leadToken.color,
    fontFamily: leadToken.fontFamily,
    fontSize: leadToken.fontSize,
    fontWeight: leadToken.fontWeight,
    headlineTop: leadToken.y,
  };
};

export const extractLeadCaption = (draft: CanvasDraft) =>
  draft.textLayers.find((layer) => layer.text.trim() !== "")?.text ??
  draft.headline;

export const viewportHasCameraGeometry = (viewportId: DraftViewportId) =>
  Object.prototype.hasOwnProperty.call(VIEWPORT_CAMERA_GEOMETRY, viewportId);

const getBackgroundImageStorageKey = (assetId: string) =>
  `${BACKGROUND_IMAGE_STORAGE_PREFIX}.${assetId}`;

const getObjectImageStorageKey = (assetId: string) =>
  `${OBJECT_IMAGE_STORAGE_PREFIX}.${assetId}`;

export const persistBackgroundImageAsset = (imageDataUrl: string) => {
  const assetId = makeBackgroundImageAssetId();

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      getBackgroundImageStorageKey(assetId),
      imageDataUrl
    );
  }

  return assetId;
};

export const persistObjectImageAsset = (imageDataUrl: string) => {
  const assetId = makeBackgroundImageAssetId();

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(getObjectImageStorageKey(assetId), imageDataUrl);
  }

  return assetId;
};

export const readBackgroundImageAsset = (assetId: string | null) => {
  if (!assetId || typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(getBackgroundImageStorageKey(assetId));
};

export const readObjectImageAsset = (assetId: string | null) => {
  if (!assetId || typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(getObjectImageStorageKey(assetId));
};

export const extractBackgroundLayerPatch = (
  draft: CanvasDraft
): BackgroundLayerPatch => ({
  backgroundColor: draft.backgroundColor,
  backgroundImage: draft.backgroundImage,
  backgroundImageAssetId: draft.backgroundImageAssetId,
  backgroundImageScale: draft.backgroundImageScale,
  backgroundImageRotation: draft.backgroundImageRotation,
  backgroundImageOffsetX: draft.backgroundImageOffsetX,
  backgroundImageOffsetY: draft.backgroundImageOffsetY,
});

export const buildCanvasDraft = (
  viewportId: DraftViewportId,
  headline = "",
  image: string | null = null
): CanvasDraft => {
  const starter = VIEWPORT_STARTER_TOKENS[viewportId];
  const cameraGeometry = VIEWPORT_CAMERA_GEOMETRY[viewportId];
  const hasCameraGeometry = viewportHasCameraGeometry(viewportId);
  const leadToken = spawnCaptionToken(viewportId, { text: headline });

  const cameraBridgeEnabled =
    cameraGeometry && "fillBridgeEnabled" in cameraGeometry
      ? Boolean(cameraGeometry.fillBridgeEnabled)
      : CAMERA_TUNING_DEFAULTS.bridgeEnabled;

  const cameraOffsetY =
    cameraGeometry && "defaultOffsetY" in cameraGeometry
      ? cameraGeometry.defaultOffsetY ?? CAMERA_TUNING_DEFAULTS.offsetY
      : CAMERA_TUNING_DEFAULTS.offsetY;

  return {
    frame: viewportId,
    headline,
    textLayers: [leadToken],
    objectLayers: [],
    image,
    textColor: starter.textColor,
    backgroundColor: starter.backgroundColor,
    backgroundImage: null,
    backgroundImageAssetId: null,
    backgroundImageScale: BACKGROUND_IMAGE_DEFAULTS.scale,
    backgroundImageRotation: BACKGROUND_IMAGE_DEFAULTS.rotation,
    backgroundImageOffsetX: BACKGROUND_IMAGE_DEFAULTS.offsetX,
    backgroundImageOffsetY: BACKGROUND_IMAGE_DEFAULTS.offsetY,
    bezelWidth: starter.bezelWidth,
    bezelColor: starter.bezelColor,
    fontFamily: starter.fontFamily,
    fontSize: starter.fontSize,
    fontWeight: String(starter.fontWeight),
    headlineTop: starter.textTopDistance,
    frameTop: starter.bezelTopDistance,
    frameOffsetX: 0,
    frameScale: starter.deviceSizeFactor,
    cornerRadius: starter.borderRadius,
    cameraMode: cameraGeometry?.mode ?? "single",
    cameraSizeAdjustment: hasCameraGeometry
      ? CAMERA_TUNING_DEFAULTS.sizeAdjustment
      : 0,
    cameraGap: hasCameraGeometry ? CAMERA_TUNING_DEFAULTS.gap : 0,
    cameraBridgeEnabled,
    cameraOffsetX: hasCameraGeometry ? CAMERA_TUNING_DEFAULTS.offsetX : 0,
    cameraOffsetY: hasCameraGeometry ? cameraOffsetY : 0,
  };
};

export const inflateDraftFromQuery = (
  searchParams: QueryShapeReader,
  fallbackViewport: DraftViewportId = "androidGalaxyS24",
  options: {
    hydrateMedia?: boolean;
  } = {}
) => {
  const hydrateMedia = options.hydrateMedia ?? false;
  const requestedViewport = (searchParams.get("frame") ||
    searchParams.get("deviceType") ||
    fallbackViewport) as DraftViewportId;

  const viewport =
    requestedViewport in VIEWPORT_STARTER_TOKENS
      ? requestedViewport
      : fallbackViewport;

  const seedDraft = buildCanvasDraft(viewport);
  const legacyLeadToken = spawnCaptionToken(viewport, {
    text: searchParams.get("headline") || seedDraft.headline,
    color: searchParams.get("textColor") || seedDraft.textColor,
    fontFamily: searchParams.get("fontFamily") || seedDraft.fontFamily,
    fontSize: readNumericToken(
      searchParams.get("fontSize"),
      seedDraft.fontSize,
      "float"
    ),
    fontWeight: searchParams.get("fontWeight") || seedDraft.fontWeight,
    y: readNumericToken(
      searchParams.get("headlineTop") || searchParams.get("textTopDistance"),
      seedDraft.headlineTop
    ),
  });

  const textLayers = normalizeCaptionTokens(searchParams.get("textLayers"), [
    legacyLeadToken,
  ]);
  const objectLayers = normalizeObjectTokens(
    searchParams.get("objectLayers"),
    viewport,
    hydrateMedia
  );
  const backgroundImageAssetId = searchParams.get("backgroundImageAssetId");

  const rawCameraMode = searchParams.get("cameraMode");
  const cameraMode =
    rawCameraMode === "single" || rawCameraMode === "double"
      ? rawCameraMode
      : seedDraft.cameraMode;

  return stitchDraftCopyState(
    {
      ...seedDraft,
      textColor: legacyLeadToken.color,
      backgroundColor:
        searchParams.get("backgroundColor") || seedDraft.backgroundColor,
      backgroundImageAssetId,
      backgroundImage: hydrateMedia
        ? readBackgroundImageAsset(backgroundImageAssetId)
        : null,
      backgroundImageScale: readNumericToken(
        searchParams.get("backgroundImageScale"),
        seedDraft.backgroundImageScale,
        "float"
      ),
      backgroundImageRotation: readNumericToken(
        searchParams.get("backgroundImageRotation"),
        seedDraft.backgroundImageRotation,
        "float"
      ),
      backgroundImageOffsetX: readNumericToken(
        searchParams.get("backgroundImageOffsetX"),
        seedDraft.backgroundImageOffsetX
      ),
      backgroundImageOffsetY: readNumericToken(
        searchParams.get("backgroundImageOffsetY"),
        seedDraft.backgroundImageOffsetY
      ),
      bezelWidth: readNumericToken(
        searchParams.get("bezelWidth"),
        seedDraft.bezelWidth,
        "float"
      ),
      bezelColor: searchParams.get("bezelColor") || seedDraft.bezelColor,
      fontFamily: legacyLeadToken.fontFamily,
      fontSize: legacyLeadToken.fontSize,
      fontWeight: legacyLeadToken.fontWeight,
      headlineTop: legacyLeadToken.y,
      frameTop: readNumericToken(
        searchParams.get("frameTop") || searchParams.get("bezelTopDistance"),
        seedDraft.frameTop
      ),
      frameOffsetX: readNumericToken(
        searchParams.get("frameOffsetX"),
        seedDraft.frameOffsetX
      ),
      frameScale: readNumericToken(
        searchParams.get("frameScale") || searchParams.get("deviceSizeFactor"),
        seedDraft.frameScale,
        "float"
      ),
      cornerRadius: readNumericToken(
        searchParams.get("cornerRadius") || searchParams.get("borderRadius"),
        seedDraft.cornerRadius
      ),
      cameraMode,
      cameraSizeAdjustment: readNumericToken(
        searchParams.get("cameraSizeAdjustment"),
        seedDraft.cameraSizeAdjustment
      ),
      cameraGap: readNumericToken(
        searchParams.get("cameraGap"),
        seedDraft.cameraGap
      ),
      cameraBridgeEnabled: readBooleanToken(
        searchParams.get("cameraBridgeEnabled"),
        seedDraft.cameraBridgeEnabled
      ),
      cameraOffsetX: readNumericToken(
        searchParams.get("cameraOffsetX"),
        seedDraft.cameraOffsetX
      ),
      cameraOffsetY: readNumericToken(
        searchParams.get("cameraOffsetY"),
        seedDraft.cameraOffsetY
      ),
      textLayers,
      objectLayers,
    },
    textLayers
  );
};

export const rehydrateDraftMediaAssets = (draft: CanvasDraft): CanvasDraft => {
  const backgroundImage = draft.backgroundImageAssetId
    ? readBackgroundImageAsset(draft.backgroundImageAssetId)
    : null;

  const objectLayers = draft.objectLayers.map((layer) => ({
    ...layer,
    image: layer.assetId ? readObjectImageAsset(layer.assetId) : null,
  }));

  return {
    ...draft,
    backgroundImage,
    objectLayers,
  };
};

export const serializeDraftToQuery = (draft: CanvasDraft) => {
  const normalizedDraft = stitchDraftCopyState(draft, draft.textLayers);
  const params = new URLSearchParams();

  params.set("frame", normalizedDraft.frame);
  params.set("headline", normalizedDraft.headline);
  params.set("textLayers", JSON.stringify(normalizedDraft.textLayers));
  params.set(
    "objectLayers",
    JSON.stringify(
      normalizedDraft.objectLayers
        .filter((layer) => layer.assetId)
        .map((layer) => ({
          id: layer.id,
          assetId: layer.assetId,
          name: layer.name,
          x: layer.x,
          y: layer.y,
          scale: layer.scale,
          rotation: layer.rotation,
          opacity: layer.opacity,
          baseWidth: layer.baseWidth,
          baseHeight: layer.baseHeight,
        }))
    )
  );
  params.set("textColor", normalizedDraft.textColor);
  params.set("backgroundColor", normalizedDraft.backgroundColor);
  if (normalizedDraft.backgroundImageAssetId) {
    params.set(
      "backgroundImageAssetId",
      normalizedDraft.backgroundImageAssetId
    );
  }
  params.set(
    "backgroundImageScale",
    String(normalizedDraft.backgroundImageScale)
  );
  params.set(
    "backgroundImageRotation",
    String(normalizedDraft.backgroundImageRotation)
  );
  params.set(
    "backgroundImageOffsetX",
    String(normalizedDraft.backgroundImageOffsetX)
  );
  params.set(
    "backgroundImageOffsetY",
    String(normalizedDraft.backgroundImageOffsetY)
  );
  params.set("bezelWidth", String(normalizedDraft.bezelWidth));
  params.set("bezelColor", normalizedDraft.bezelColor);
  params.set("fontFamily", normalizedDraft.fontFamily);
  params.set("fontSize", String(normalizedDraft.fontSize));
  params.set("fontWeight", normalizedDraft.fontWeight);
  params.set("headlineTop", String(normalizedDraft.headlineTop));
  params.set("frameTop", String(normalizedDraft.frameTop));
  params.set("frameOffsetX", String(normalizedDraft.frameOffsetX));
  params.set("frameScale", String(normalizedDraft.frameScale));
  params.set("cornerRadius", String(normalizedDraft.cornerRadius));
  params.set("cameraMode", normalizedDraft.cameraMode);
  params.set(
    "cameraSizeAdjustment",
    String(normalizedDraft.cameraSizeAdjustment)
  );
  params.set("cameraGap", String(normalizedDraft.cameraGap));
  params.set(
    "cameraBridgeEnabled",
    String(normalizedDraft.cameraBridgeEnabled)
  );
  params.set("cameraOffsetX", String(normalizedDraft.cameraOffsetX));
  params.set("cameraOffsetY", String(normalizedDraft.cameraOffsetY));

  return params;
};
