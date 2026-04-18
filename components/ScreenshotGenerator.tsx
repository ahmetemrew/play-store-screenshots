import { useEffect, useRef } from "react";
import {
  CANVAS_COORDINATE_SYSTEMS as canvasDimensions,
  VIEWPORT_CAMERA_GEOMETRY as deviceCameraCutouts,
  VIEWPORT_LABELS as deviceNames,
} from "@/lib/rendering/viewport-catalog";
import { type CaptionToken as TextLayer } from "@/lib/rendering/draft-state";

interface ScreenshotGeneratorProps {
  screenshotImage: string | null;
  headline: string;
  textLayers?: TextLayer[];
  frameKey: string;
  textColor: string;
  backgroundColor: string;
  bezelWidth: number;
  bezelColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  frameTop: number;
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

const ScreenshotGenerator = ({
  screenshotImage,
  headline,
  textLayers,
  frameKey,
  textColor = "#ffffff",
  backgroundColor = "#0099ff",
  bezelWidth = 20,
  bezelColor = "#f5f5f7",
  fontFamily = "Arial, sans-serif",
  fontSize = 54,
  fontWeight = "normal",
  frameTop = 400,
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

    const sourceImage = new Image();
    sourceImage.onload = () => {
      context.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

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
      const outerX = (exportCanvas.width - outerWidth) / 2;
      const outerY = frameTop;
      const innerX = outerX + bezelWidth;
      const innerY = outerY + bezelWidth;
      const innerRadius = Math.max(0, cornerRadius - bezelWidth);

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

        context.fillStyle = layer.color;
        context.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
        context.textAlign = layer.align;

        const lineHeight = layer.fontSize * 1.2;
        const headlineLimit =
          layer.align === "start"
            ? Math.max(140, exportCanvas.width - layer.x - 32)
            : layer.align === "end"
              ? Math.max(140, layer.x - 32)
              : Math.max(
                  160,
                  Math.min(layer.x * 2 - 40, (exportCanvas.width - layer.x) * 2 - 40)
                );
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
              context.fillText(line, layer.x, currentY);
              currentY += lineHeight;
              line = words[index];
            } else {
              line = nextLine;
            }
          }

          context.fillText(line, layer.x, currentY);
          currentY += lineHeight;
        });
      });

      if (!previewCanvasRef.current) return;

      const previewContext = previewCanvasRef.current.getContext("2d");
      if (!previewContext) return;

      previewCanvasRef.current.width = exportCanvas.width;
      previewCanvasRef.current.height = exportCanvas.height;
      previewContext.drawImage(exportCanvas, 0, 0);
    };

    sourceImage.src = screenshotImage;
  }, [
    backgroundColor,
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
    frameScale,
    frameTop,
    headline,
    headlineTop,
    screenshotImage,
    textLayers,
    textColor,
  ]);

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
    const centerY =
      screenY + screenHeight * cutout.offsetTopRatio + cameraOffsetY;

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
      const gap =
        Math.max(0, screenWidth * presetGapRatio + cameraGap);
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

  const canvasSize = canvasDimensions[frameKey as keyof typeof canvasDimensions];

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
            <canvas ref={previewCanvasRef} className="w-full h-auto" />
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
              PNG İndir
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ScreenshotGenerator;
