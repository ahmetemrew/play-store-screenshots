import { useEffect, useRef, useState } from "react";
import {
  CANVAS_COORDINATE_SYSTEMS as canvasDimensions,
  VIEWPORT_CAMERA_GEOMETRY as deviceCameraCutouts,
  VIEWPORT_LABELS as deviceNames,
} from "@/lib/rendering/viewport-catalog";
import {
  type CaptionToken as TextLayer,
  type ObjectLayerToken,
} from "@/lib/rendering/draft-state";

type SelectionState =
  | { kind: "object"; id: string }
  | { kind: "text"; id: string }
  | { kind: "frame" }
  | null;

type DragState =
  | {
      pointerId: number;
      kind: "object" | "text";
      id: string;
      offsetX: number;
      offsetY: number;
    }
  | {
      pointerId: number;
      kind: "frame";
      offsetX: number;
      offsetY: number;
    };

type FrameMetric = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};

type TextMetric = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorOffsetX: number;
  baselineOffsetY: number;
};

type ObjectMetric = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type InteractionSnapshot = {
  canvasWidth: number;
  canvasHeight: number;
  frame: FrameMetric | null;
  texts: TextMetric[];
  objects: ObjectMetric[];
};

interface ScreenshotGeneratorProps {
  screenshotImage: string | null;
  headline: string;
  textLayers?: TextLayer[];
  frameKey: string;
  textColor: string;
  backgroundColor: string;
  backgroundImage?: string | null;
  backgroundImageScale?: number;
  backgroundImageRotation?: number;
  backgroundImageOffsetX?: number;
  backgroundImageOffsetY?: number;
  objectLayers?: ObjectLayerToken[];
  onObjectLayersChange?: (nextLayers: ObjectLayerToken[]) => void;
  onTextLayersChange?: (nextLayers: TextLayer[]) => void;
  onFramePositionChange?: (patch: { frameTop: number; frameOffsetX: number }) => void;
  bezelWidth: number;
  bezelColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  frameTop: number;
  frameOffsetX?: number;
  headlineTop: number;
  frameScale: number;
  cornerRadius: number;
  cameraMode?: "single" | "double";
  cameraSizeAdjustment?: number;
  cameraGap?: number;
  cameraBridgeEnabled?: boolean;
  cameraOffsetX?: number;
  cameraOffsetY?: number;
  screenshotId?: string;
  fontLoaded?: boolean | number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const ScreenshotGenerator = ({
  screenshotImage,
  headline,
  textLayers,
  frameKey,
  textColor = "#f7efe7",
  backgroundColor = "#dfe8e0",
  backgroundImage = null,
  backgroundImageScale = 1,
  backgroundImageRotation = 0,
  backgroundImageOffsetX = 0,
  backgroundImageOffsetY = 0,
  objectLayers = [],
  onObjectLayersChange,
  onTextLayersChange,
  onFramePositionChange,
  bezelWidth = 20,
  bezelColor = "#f7efe7",
  fontFamily = "Arial, sans-serif",
  fontSize = 54,
  fontWeight = "normal",
  frameTop = 400,
  frameOffsetX = 0,
  headlineTop = 200,
  frameScale = 1,
  cornerRadius = 30,
  cameraMode = "single",
  cameraSizeAdjustment = 0,
  cameraGap = 0,
  cameraBridgeEnabled = false,
  cameraOffsetX = 0,
  cameraOffsetY = 0,
  screenshotId,
  fontLoaded,
}: ScreenshotGeneratorProps) => {
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewInteractionRef = useRef<HTMLDivElement>(null);
  const latestObjectLayersRef = useRef(objectLayers);
  const latestTextLayersRef = useRef(textLayers ?? []);
  const latestFramePositionRef = useRef({ frameTop, frameOffsetX });
  const interactionSnapshotRef = useRef<InteractionSnapshot>({
    canvasWidth: 0,
    canvasHeight: 0,
    frame: null,
    texts: [],
    objects: [],
  });
  const dragStateRef = useRef<DragState | null>(null);
  const [selection, setSelection] = useState<SelectionState>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    latestObjectLayersRef.current = objectLayers;
  }, [objectLayers]);

  useEffect(() => {
    latestTextLayersRef.current = textLayers ?? [];
  }, [textLayers]);

  useEffect(() => {
    latestFramePositionRef.current = { frameTop, frameOffsetX };
  }, [frameOffsetX, frameTop]);

  useEffect(() => {
    if (!selection) return;

    if (
      selection.kind === "object" &&
      !objectLayers.some((layer) => layer.id === selection.id && Boolean(layer.image))
    ) {
      setSelection(null);
      return;
    }

    if (
      selection.kind === "text" &&
      !(textLayers ?? []).some(
        (layer) => layer.id === selection.id && layer.text.trim() !== ""
      )
    ) {
      setSelection(null);
    }
  }, [objectLayers, selection, textLayers]);

  useEffect(() => {
    if (!screenshotImage || !exportCanvasRef.current) return;

    const exportCanvas = exportCanvasRef.current;
    const context = exportCanvas.getContext("2d");
    if (!context) return;

    const canvasSize =
      canvasDimensions[frameKey as keyof typeof canvasDimensions] ||
      canvasDimensions.androidGalaxyS24;

    exportCanvas.width = canvasSize.width;
    exportCanvas.height = canvasSize.height;

    let cancelled = false;

    const renderPreview = async () => {
      try {
        const sourceImage = await loadImageAsset(screenshotImage);
        const resolvedBackgroundImage = backgroundImage
          ? await loadImageAsset(backgroundImage).catch(() => null)
          : null;
        const resolvedObjectLayers = await Promise.all(
          objectLayers.map(async (layer) => ({
            ...layer,
            element: layer.image
              ? await loadImageAsset(layer.image).catch(() => null)
              : null,
          }))
        );

        if (cancelled) return;

        const snapshot: InteractionSnapshot = {
          canvasWidth: exportCanvas.width,
          canvasHeight: exportCanvas.height,
          frame: null,
          texts: [],
          objects: [],
        };

        context.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        if (resolvedBackgroundImage) {
          drawBackgroundImage(
            context,
            resolvedBackgroundImage,
            exportCanvas.width,
            exportCanvas.height,
            backgroundImageScale,
            backgroundImageRotation,
            backgroundImageOffsetX,
            backgroundImageOffsetY
          );
        }

        const maxCaptureWidth = exportCanvas.width * 0.85;
        const maxCaptureHeight = exportCanvas.height * 0.7;
        const scale =
          Math.min(
            maxCaptureWidth / (sourceImage.width + bezelWidth * 2),
            maxCaptureHeight / (sourceImage.height + bezelWidth * 2)
          ) * frameScale;

        const captureWidth = sourceImage.width * scale;
        const captureHeight = sourceImage.height * scale;
        const outerWidth = captureWidth + bezelWidth * 2;
        const outerHeight = captureHeight + bezelWidth * 2;
        const centeredOuterX = (exportCanvas.width - outerWidth) / 2;
        const outerX = centeredOuterX + frameOffsetX;
        const outerY = frameTop;
        const innerX = outerX + bezelWidth;
        const innerY = outerY + bezelWidth;
        const innerRadius = Math.max(0, cornerRadius - bezelWidth);

        snapshot.frame = {
          x: outerX,
          y: outerY,
          width: outerWidth,
          height: outerHeight,
          radius: cornerRadius,
        };

        context.fillStyle = bezelColor;
        fillRoundedRect(
          context,
          outerX,
          outerY,
          outerWidth,
          outerHeight,
          cornerRadius
        );

        context.save();
        traceRoundedRect(
          context,
          innerX,
          innerY,
          captureWidth,
          captureHeight,
          innerRadius
        );
        context.clip();
        context.drawImage(sourceImage, innerX, innerY, captureWidth, captureHeight);
        context.restore();

        paintCutout(
          context,
          frameKey,
          innerX,
          innerY,
          captureWidth,
          captureHeight
        );

        resolvedObjectLayers.forEach((layer) => {
          if (!layer.element || !layer.image) return;

          const metric = drawObjectLayer(context, layer.element, layer);
          snapshot.objects.push(metric);
        });

        const resolvedTextLayers =
          textLayers && textLayers.length > 0
            ? textLayers
            : [
                {
                  id: "legacy-primary",
                  text: headline,
                  color: textColor,
                  fontFamily,
                  fontSize,
                  fontWeight,
                  x: exportCanvas.width / 2,
                  y: headlineTop,
                  align: "center" as const,
                },
              ];

        resolvedTextLayers.forEach((layer) => {
          if (layer.text.trim() === "") return;

          const metric = drawTextLayer(context, layer, exportCanvas.width);
          if (metric) {
            snapshot.texts.push(metric);
          }
        });

        interactionSnapshotRef.current = snapshot;

        if (!previewCanvasRef.current) return;

        const previewContext = previewCanvasRef.current.getContext("2d");
        if (!previewContext) return;

        previewCanvasRef.current.width = exportCanvas.width;
        previewCanvasRef.current.height = exportCanvas.height;
        previewContext.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
        previewContext.drawImage(exportCanvas, 0, 0);

        if (selection?.kind === "object") {
          const metric = snapshot.objects.find((item) => item.id === selection.id);
          if (metric) {
            drawObjectSelection(previewContext, metric);
          }
        }

        if (selection?.kind === "text") {
          const metric = snapshot.texts.find((item) => item.id === selection.id);
          if (metric) {
            drawTextSelection(previewContext, metric);
          }
        }

        if (selection?.kind === "frame" && snapshot.frame) {
          drawFrameSelection(previewContext, snapshot.frame);
        }
      } catch {
        // Ignore rendering failures caused by invalid or stale in-memory image URLs.
      }
    };

    void renderPreview();

    return () => {
      cancelled = true;
    };
  }, [
    backgroundColor,
    backgroundImage,
    backgroundImageOffsetX,
    backgroundImageOffsetY,
    backgroundImageRotation,
    backgroundImageScale,
    bezelColor,
    bezelWidth,
    cameraBridgeEnabled,
    cameraGap,
    cameraMode,
    cameraOffsetX,
    cameraOffsetY,
    cameraSizeAdjustment,
    cornerRadius,
    fontFamily,
    fontLoaded,
    fontSize,
    fontWeight,
    frameKey,
    frameOffsetX,
    frameScale,
    frameTop,
    headline,
    headlineTop,
    objectLayers,
    screenshotImage,
    selection,
    textColor,
    textLayers,
  ]);

  const loadImageAsset = (source: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image failed to load."));
      image.src = source;
    });

  const drawBackgroundImage = (
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number,
    scaleFactor: number,
    rotationDegrees: number,
    offsetX: number,
    offsetY: number
  ) => {
    const coverScale = Math.max(canvasWidth / image.width, canvasHeight / image.height);
    const drawWidth = image.width * coverScale * scaleFactor;
    const drawHeight = image.height * coverScale * scaleFactor;

    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.translate(canvasWidth / 2 + offsetX, canvasHeight / 2 + offsetY);
    context.rotate((rotationDegrees * Math.PI) / 180);
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();
  };

  const drawObjectLayer = (
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    layer: ObjectLayerToken
  ): ObjectMetric => {
    const drawWidth = Math.max(1, layer.baseWidth * layer.scale);
    const drawHeight = Math.max(1, layer.baseHeight * layer.scale);

    context.save();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.globalAlpha = Math.min(1, Math.max(0, layer.opacity));
    context.translate(layer.x, layer.y);
    context.rotate((layer.rotation * Math.PI) / 180);
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.restore();

    return {
      id: layer.id,
      x: layer.x,
      y: layer.y,
      width: drawWidth,
      height: drawHeight,
      rotation: layer.rotation,
    };
  };

  const drawTextLayer = (
    context: CanvasRenderingContext2D,
    layer: TextLayer,
    canvasWidth: number
  ): TextMetric | null => {
    context.save();
    context.fillStyle = layer.color;
    context.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
    context.textAlign = layer.align;

    const lineHeight = layer.fontSize * 1.2;
    const headlineLimit =
      layer.align === "start"
        ? Math.max(140, canvasWidth - layer.x - 32)
        : layer.align === "end"
          ? Math.max(140, layer.x - 32)
          : Math.max(
              160,
              Math.min(layer.x * 2 - 40, (canvasWidth - layer.x) * 2 - 40)
            );

    const lines: { text: string; width: number; y: number }[] = [];
    let currentY = layer.y;

    layer.text.split("\n").forEach((paragraph) => {
      if (paragraph.trim() === "") {
        currentY += lineHeight;
        return;
      }

      const words = paragraph.split(" ");
      let line = words[0] ?? "";

      for (let index = 1; index < words.length; index += 1) {
        const nextLine = `${line} ${words[index]}`;
        if (context.measureText(nextLine).width > headlineLimit) {
          lines.push({
            text: line,
            width: context.measureText(line).width,
            y: currentY,
          });
          currentY += lineHeight;
          line = words[index];
        } else {
          line = nextLine;
        }
      }

      lines.push({
        text: line,
        width: context.measureText(line).width,
        y: currentY,
      });
      currentY += lineHeight;
    });

    if (lines.length === 0) {
      context.restore();
      return null;
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    lines.forEach((line) => {
      context.fillText(line.text, layer.x, line.y);

      const lineX =
        layer.align === "center"
          ? layer.x - line.width / 2
          : layer.align === "end"
            ? layer.x - line.width
            : layer.x;

      minX = Math.min(minX, lineX);
      maxX = Math.max(maxX, lineX + line.width);
      minY = Math.min(minY, line.y - layer.fontSize);
      maxY = Math.max(maxY, line.y + lineHeight * 0.25);
    });

    context.restore();

    return {
      id: layer.id,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      anchorOffsetX: layer.x - minX,
      baselineOffsetY: layer.y - minY,
    };
  };

  const drawSelectionStroke = (
    context: CanvasRenderingContext2D,
    draw: () => void
  ) => {
    context.save();
    context.setLineDash([14, 10]);
    context.lineWidth = 4;
    context.strokeStyle = "rgba(247, 239, 231, 0.92)";
    draw();
    context.stroke();
    context.restore();
  };

  const drawObjectSelection = (
    context: CanvasRenderingContext2D,
    metric: ObjectMetric
  ) => {
    drawSelectionStroke(context, () => {
      context.translate(metric.x, metric.y);
      context.rotate((metric.rotation * Math.PI) / 180);
      context.strokeRect(
        -metric.width / 2 - 6,
        -metric.height / 2 - 6,
        metric.width + 12,
        metric.height + 12
      );
    });
  };

  const drawTextSelection = (context: CanvasRenderingContext2D, metric: TextMetric) => {
    drawSelectionStroke(context, () => {
      context.strokeRect(
        metric.x - 12,
        metric.y - 12,
        metric.width + 24,
        metric.height + 24
      );
    });
  };

  const fillRoundedRect = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.arcTo(x + width, y, x + width, y + radius, radius);
    context.lineTo(x + width, y + height - radius);
    context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    context.lineTo(x + radius, y + height);
    context.arcTo(x, y + height, x, y + height - radius, radius);
    context.lineTo(x, y + radius);
    context.arcTo(x, y, x + radius, y, radius);
    context.closePath();
    context.fill();
  };

  const traceRoundedRect = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.arcTo(x + width, y, x + width, y + radius, radius);
    context.lineTo(x + width, y + height - radius);
    context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    context.lineTo(x + radius, y + height);
    context.arcTo(x, y + height, x, y + height - radius, radius);
    context.lineTo(x, y + radius);
    context.arcTo(x, y, x + radius, y, radius);
    context.closePath();
  };

  const drawFrameSelection = (
    context: CanvasRenderingContext2D,
    metric: FrameMetric
  ) => {
    drawSelectionStroke(context, () => {
      traceRoundedRect(
        context,
        metric.x - 6,
        metric.y - 6,
        metric.width + 12,
        metric.height + 12,
        metric.radius + 6
      );
    });
  };

  const paintCutout = (
    context: CanvasRenderingContext2D,
    activeFrameKey: string,
    screenX: number,
    screenY: number,
    screenWidth: number,
    screenHeight: number
  ) => {
    const cutout =
      deviceCameraCutouts[activeFrameKey as keyof typeof deviceCameraCutouts];

    if (!cutout) return;

    const drawSingleCamera = (
      cameraCenterX: number,
      cameraCenterY: number,
      radius: number
    ) => {
      context.beginPath();
      context.arc(cameraCenterX, cameraCenterY, radius, 0, Math.PI * 2);
      context.closePath();
      context.fill();

      if (cutout.ringWidth > 0) {
        context.strokeStyle = cutout.ringColor;
        context.lineWidth = cutout.ringWidth;
        context.beginPath();
        context.arc(
          cameraCenterX,
          cameraCenterY,
          radius + cutout.ringWidth / 2,
          0,
          Math.PI * 2
        );
        context.closePath();
        context.stroke();
      }
    };

    const centerX = screenX + screenWidth / 2 + cameraOffsetX;
    const centerY = screenY + screenHeight * cutout.offsetTopRatio + cameraOffsetY;
    const radius = Math.max(
      0,
      Math.min(screenWidth * cutout.widthRatio, screenHeight * cutout.heightRatio) /
        2 +
        cameraSizeAdjustment
    );

    if (radius <= 0) return;

    context.save();
    context.fillStyle = cutout.color;

    if (cameraMode === "double") {
      const presetGapRatio = cutout.gapRatio ?? 0;
      const gap = Math.max(0, screenWidth * presetGapRatio + cameraGap);
      const leftCenterX = centerX - radius - gap / 2;
      const rightCenterX = centerX + radius + gap / 2;

      if (cameraBridgeEnabled) {
        const pillX = leftCenterX - radius;
        const pillY = centerY - radius;
        const pillWidth = rightCenterX - leftCenterX + radius * 2;
        const pillHeight = radius * 2;

        fillRoundedRect(context, pillX, pillY, pillWidth, pillHeight, radius);

        if (cutout.ringWidth > 0) {
          context.strokeStyle = cutout.ringColor;
          context.lineWidth = cutout.ringWidth;
          traceRoundedRect(context, pillX, pillY, pillWidth, pillHeight, radius);
          context.stroke();
        }
      } else {
        drawSingleCamera(leftCenterX, centerY, radius);
        drawSingleCamera(rightCenterX, centerY, radius);
      }

      context.restore();
      return;
    }

    drawSingleCamera(centerX, centerY, radius);
    context.restore();
  };

  const downloadPng = () => {
    if (!exportCanvasRef.current) return;
    const anchor = document.createElement("a");
    anchor.download = `cikti-${frameKey}.png`;
    anchor.href = exportCanvasRef.current.toDataURL("image/png");
    anchor.click();
  };

  const getPreviewCanvasPoint = (clientX: number, clientY: number) => {
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return null;

    const bounds = previewCanvas.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return null;

    return {
      x: ((clientX - bounds.left) / bounds.width) * previewCanvas.width,
      y: ((clientY - bounds.top) / bounds.height) * previewCanvas.height,
    };
  };

  const findObjectHit = (point: { x: number; y: number }) => {
    const objects = interactionSnapshotRef.current.objects;

    for (let index = objects.length - 1; index >= 0; index -= 1) {
      const metric = objects[index];
      const radians = (metric.rotation * Math.PI) / 180;
      const dx = point.x - metric.x;
      const dy = point.y - metric.y;
      const localX = dx * Math.cos(radians) + dy * Math.sin(radians);
      const localY = -dx * Math.sin(radians) + dy * Math.cos(radians);

      if (
        Math.abs(localX) <= metric.width / 2 &&
        Math.abs(localY) <= metric.height / 2
      ) {
        return metric;
      }
    }

    return null;
  };

  const findTextHit = (point: { x: number; y: number }) => {
    const texts = interactionSnapshotRef.current.texts;

    for (let index = texts.length - 1; index >= 0; index -= 1) {
      const metric = texts[index];

      if (
        point.x >= metric.x - 12 &&
        point.x <= metric.x + metric.width + 12 &&
        point.y >= metric.y - 12 &&
        point.y <= metric.y + metric.height + 12
      ) {
        return metric;
      }
    }

    return null;
  };

  const endDrag = (event?: React.PointerEvent<HTMLDivElement>) => {
    if (
      event &&
      previewInteractionRef.current?.hasPointerCapture(event.pointerId)
    ) {
      previewInteractionRef.current.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = getPreviewCanvasPoint(event.clientX, event.clientY);
    if (!point) return;

    const textHit = onTextLayersChange ? findTextHit(point) : null;
    if (textHit) {
      dragStateRef.current = {
        pointerId: event.pointerId,
        kind: "text",
        id: textHit.id,
        offsetX: point.x - textHit.x,
        offsetY: point.y - textHit.y,
      };
      setSelection({ kind: "text", id: textHit.id });
      previewInteractionRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
      event.preventDefault();
      return;
    }

    const objectHit = onObjectLayersChange ? findObjectHit(point) : null;
    if (objectHit) {
      dragStateRef.current = {
        pointerId: event.pointerId,
        kind: "object",
        id: objectHit.id,
        offsetX: point.x - objectHit.x,
        offsetY: point.y - objectHit.y,
      };
      setSelection({ kind: "object", id: objectHit.id });
      previewInteractionRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
      event.preventDefault();
      return;
    }

    const frameMetric = interactionSnapshotRef.current.frame;
    if (
      onFramePositionChange &&
      frameMetric &&
      point.x >= frameMetric.x &&
      point.x <= frameMetric.x + frameMetric.width &&
      point.y >= frameMetric.y &&
      point.y <= frameMetric.y + frameMetric.height
    ) {
      dragStateRef.current = {
        pointerId: event.pointerId,
        kind: "frame",
        offsetX: point.x - frameMetric.x,
        offsetY: point.y - frameMetric.y,
      };
      setSelection({ kind: "frame" });
      previewInteractionRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
      event.preventDefault();
      return;
    }

    setSelection(null);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const point = getPreviewCanvasPoint(event.clientX, event.clientY);
    if (!point) return;

    const snapshot = interactionSnapshotRef.current;

    if (dragState.kind === "object" && onObjectLayersChange) {
      const nextX = Math.round(clamp(point.x - dragState.offsetX, 0, snapshot.canvasWidth));
      const nextY = Math.round(clamp(point.y - dragState.offsetY, 0, snapshot.canvasHeight));
      const currentLayer = latestObjectLayersRef.current.find(
        (layer) => layer.id === dragState.id
      );

      if (!currentLayer || (currentLayer.x === nextX && currentLayer.y === nextY)) {
        return;
      }

      onObjectLayersChange(
        latestObjectLayersRef.current.map((layer) =>
          layer.id === dragState.id
            ? {
                ...layer,
                x: nextX,
                y: nextY,
              }
            : layer
        )
      );
      event.preventDefault();
      return;
    }

    if (dragState.kind === "text" && onTextLayersChange) {
      const metric = snapshot.texts.find((item) => item.id === dragState.id);
      const currentLayer = latestTextLayersRef.current.find(
        (layer) => layer.id === dragState.id
      );
      if (!metric || !currentLayer) return;

      const nextBoundsX = point.x - dragState.offsetX;
      const nextBoundsY = point.y - dragState.offsetY;
      const nextX = Math.round(
        clamp(nextBoundsX + metric.anchorOffsetX, 0, snapshot.canvasWidth)
      );
      const nextY = Math.round(
        clamp(nextBoundsY + metric.baselineOffsetY, 0, snapshot.canvasHeight)
      );

      if (currentLayer.x === nextX && currentLayer.y === nextY) {
        return;
      }

      onTextLayersChange(
        latestTextLayersRef.current.map((layer) =>
          layer.id === dragState.id
            ? {
                ...layer,
                x: nextX,
                y: nextY,
              }
            : layer
        )
      );
      event.preventDefault();
      return;
    }

    if (dragState.kind === "frame" && onFramePositionChange && snapshot.frame) {
      const centeredOuterX = (snapshot.canvasWidth - snapshot.frame.width) / 2;
      const nextOuterX = clamp(
        point.x - dragState.offsetX,
        -snapshot.frame.width / 2,
        snapshot.canvasWidth - snapshot.frame.width / 2
      );
      const nextFrameTop = Math.round(
        clamp(
          point.y - dragState.offsetY,
          -snapshot.frame.height / 2,
          snapshot.canvasHeight - snapshot.frame.height / 2
        )
      );
      const nextFrameOffsetX = Math.round(nextOuterX - centeredOuterX);
      const currentFrame = latestFramePositionRef.current;

      if (
        currentFrame.frameTop === nextFrameTop &&
        currentFrame.frameOffsetX === nextFrameOffsetX
      ) {
        return;
      }

      onFramePositionChange({
        frameTop: nextFrameTop,
        frameOffsetX: nextFrameOffsetX,
      });
      event.preventDefault();
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;
    endDrag(event);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;
    endDrag(event);
  };

  const canvasSize = canvasDimensions[frameKey as keyof typeof canvasDimensions];
  const interactionEnabled = Boolean(
    onFramePositionChange ||
      onTextLayersChange ||
      (onObjectLayersChange && objectLayers.some((layer) => Boolean(layer.image)))
  );

  return (
    <div className="mt-4 flex flex-col items-center">
      <canvas
        ref={exportCanvasRef}
        className="hidden"
        data-screenshot-id={screenshotId}
      />

      {screenshotImage && (
        <>
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
            <div className="relative">
              <canvas ref={previewCanvasRef} className="h-auto w-full" />
              {interactionEnabled && (
                <div
                  ref={previewInteractionRef}
                  className="absolute inset-0 touch-none"
                  style={{ cursor: isDragging ? "grabbing" : "grab" }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                />
              )}
            </div>
          </div>

          <div className="mt-4 flex w-full flex-col gap-3">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
              {deviceNames[frameKey as keyof typeof deviceNames]} - {canvasSize.width} x{" "}
              {canvasSize.height}
            </div>

            <button
              type="button"
              onClick={downloadPng}
              className="studio-button w-full justify-center"
            >
              PNG indir
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ScreenshotGenerator;
