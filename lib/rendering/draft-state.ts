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

export type CanvasDraft = {
  frame: DraftViewportId;
  headline: string;
  textLayers: CaptionToken[];
  image: string | null;
  textColor: string;
  backgroundColor: string;
  bezelWidth: number;
  bezelColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  headlineTop: number;
  frameTop: number;
  frameScale: number;
  cornerRadius: number;
  cameraMode: "single" | "double";
  cameraSizeAdjustment: number;
  cameraGap: number;
  cameraBridgeEnabled: boolean;
  cameraOffsetX: number;
  cameraOffsetY: number;
};

const DEFAULT_TEXT_COLOR = "#11181C";
const DEFAULT_FONT_FAMILY = "Inter, sans-serif";
const DEFAULT_FONT_SIZE = 96;
const DEFAULT_FONT_WEIGHT = "600";

const makeCaptionTokenId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `copy-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `copy-${Math.random().toString(36).slice(2, 10)}`;
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
    image,
    textColor: starter.textColor,
    backgroundColor: starter.backgroundColor,
    bezelWidth: starter.bezelWidth,
    bezelColor: starter.bezelColor,
    fontFamily: starter.fontFamily,
    fontSize: starter.fontSize,
    fontWeight: String(starter.fontWeight),
    headlineTop: starter.textTopDistance,
    frameTop: starter.bezelTopDistance,
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
  fallbackViewport: DraftViewportId = "androidGalaxyS24"
) => {
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
    },
    textLayers
  );
};

export const serializeDraftToQuery = (draft: CanvasDraft) => {
  const normalizedDraft = stitchDraftCopyState(draft, draft.textLayers);
  const params = new URLSearchParams();

  params.set("frame", normalizedDraft.frame);
  params.set("headline", normalizedDraft.headline);
  params.set("textLayers", JSON.stringify(normalizedDraft.textLayers));
  params.set("textColor", normalizedDraft.textColor);
  params.set("backgroundColor", normalizedDraft.backgroundColor);
  params.set("bezelWidth", String(normalizedDraft.bezelWidth));
  params.set("bezelColor", normalizedDraft.bezelColor);
  params.set("fontFamily", normalizedDraft.fontFamily);
  params.set("fontSize", String(normalizedDraft.fontSize));
  params.set("fontWeight", normalizedDraft.fontWeight);
  params.set("headlineTop", String(normalizedDraft.headlineTop));
  params.set("frameTop", String(normalizedDraft.frameTop));
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
