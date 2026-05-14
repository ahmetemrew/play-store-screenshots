import {
  VIEWPORT_CATALOG,
  VIEWPORT_EXPORT_DIMENSIONS,
  VIEWPORT_LABELS,
  type RenderViewportId,
} from "@/lib/rendering/viewport-catalog";

type UploadAuditInput = {
  deviceType: string;
  width: number;
  height: number;
};

type UploadAuditResult = {
  isValid: boolean;
  error: string | null;
};

const MIN_SOURCE_EDGE = 320;
const MAX_SOURCE_EDGE = 7680;
const GENERIC_ANDROID_VIEWPORT = "androidPlayPhone";

export const isAndroidViewportId = (candidate: string) =>
  candidate.startsWith("android");

export const isFlexibleViewportId = (candidate: string) =>
  candidate.startsWith("custom");

export const isBaselineAndroidViewportId = (candidate: string) =>
  candidate === GENERIC_ANDROID_VIEWPORT;

export const resolveExpectedCaptureSize = (candidate: string) =>
  VIEWPORT_EXPORT_DIMENSIONS[candidate as RenderViewportId];

export const resolveViewportLabel = (candidate: string) =>
  VIEWPORT_LABELS[candidate as keyof typeof VIEWPORT_LABELS];

export const describeCaptureExpectation = (candidate: string) => {
  const blueprint = VIEWPORT_CATALOG[candidate as RenderViewportId];
  const exportSize = resolveExpectedCaptureSize(candidate);
  const label = resolveViewportLabel(candidate);

  if (!blueprint || !exportSize || !label) {
    return "PNG veya JPEG ekran görüntüsü yükleyin.";
  }

  if (blueprint.flexibleSource && !blueprint.portraitOnlySource) {
    return `${label} için her boyutta PNG veya JPEG kabul edilir.`;
  }

  if (blueprint.portraitOnlySource) {
    return `${label} için dikey PNG veya JPEG kullanın. Çıktı ${exportSize.width} x ${exportSize.height} px olur.`;
  }

  return `${label} için gerekli ölçü ${exportSize.width} x ${exportSize.height} px.`;
};

export const inspectInboundCapture = ({
  deviceType,
  width,
  height,
}: UploadAuditInput): UploadAuditResult => {
  const blueprint = VIEWPORT_CATALOG[deviceType as RenderViewportId];
  const exportSize = resolveExpectedCaptureSize(deviceType);
  const label = resolveViewportLabel(deviceType);

  if (!blueprint || !exportSize || !label) {
    return {
      isValid: false,
      error: "Geçersiz cihaz seçimi. Cihazı yeniden seçip tekrar deneyin.",
    };
  }

  if (blueprint.flexibleSource && !blueprint.portraitOnlySource) {
    return { isValid: true, error: null };
  }

  if (blueprint.portraitOnlySource) {
    if (height < width) {
      return {
        isValid: false,
        error: "Android çıktıları için dikey PNG veya JPEG yükleyin.",
      };
    }

    const shortEdge = Math.min(width, height);
    const longEdge = Math.max(width, height);

    if (shortEdge < MIN_SOURCE_EDGE) {
      return {
        isValid: false,
        error: `Görsel çok küçük. Kısa kenar en az ${MIN_SOURCE_EDGE} px olmalı.`,
      };
    }

    if (longEdge > MAX_SOURCE_EDGE) {
      return {
        isValid: false,
        error: `Görsel çok büyük. Uzun kenar en fazla ${MAX_SOURCE_EDGE} px olmalı.`,
      };
    }

    return { isValid: true, error: null };
  }

  if (width !== exportSize.width || height !== exportSize.height) {
    return {
      isValid: false,
      error: `${label} için görsel boyutu ${exportSize.width} x ${exportSize.height} px olmalı.`,
    };
  }

  return { isValid: true, error: null };
};
