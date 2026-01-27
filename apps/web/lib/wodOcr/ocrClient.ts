import { api } from "../api";

export type OcrResult = {
  text: string;
  confidence: number | null;
  mock: boolean;
  mode: string;
  source?: {
    filename?: string | null;
    size_bytes?: number;
    mime?: string;
  };
  warning?: string | null;
};

export async function extractText(file: File): Promise<OcrResult> {
  if (!file) {
    return { text: "", confidence: null, mock: false, mode: "none" };
  }

  if (typeof window !== "undefined") {
    console.log("[OCR] uploading file:", file.name, file.size, file.type);
  }

  const res = await api.uploadWodOcr(file);
  if (typeof window !== "undefined") {
    console.log("[OCR] response:", {
      mode: res.mode,
      confidence: res.confidence,
      textPreview: (res.text || "").slice(0, 80)
    });
  }
  return {
    text: res.text,
    confidence: res.confidence ?? null,
    mock: res.mode !== "real",
    mode: res.mode ?? "unknown",
    source: res.source ?? { filename: file.name, size_bytes: file.size },
    warning: (res as any).warning ?? null
  };
}
