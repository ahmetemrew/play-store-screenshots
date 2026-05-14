export const VISUAL_TREATMENT_LIBRARY = {
  editorial: {
    label: "Editoryal",
    note: "Yumusak ve premium",
    backgroundColor: "#ead8cb",
    textColor: "#221c18",
    bezelColor: "#221c18",
    fontFamily: "Outfit, sans-serif",
    fontWeight: "600",
    borderRadius: 44,
  },
  signal: {
    label: "Canli",
    note: "Net ve parlak",
    backgroundColor: "#d8e6dc",
    textColor: "#24312b",
    bezelColor: "#24312b",
    fontFamily: "Inter, sans-serif",
    fontWeight: "700",
    borderRadius: 34,
  },
  nocturne: {
    label: "Gece",
    note: "Koyu ve kontrastli",
    backgroundColor: "#2b2320",
    textColor: "#f7efe7",
    bezelColor: "#f7efe7",
    fontFamily: "JetBrains Mono, monospace",
    fontWeight: "600",
    borderRadius: 28,
  },
} as const;

export type VisualTreatmentId = keyof typeof VISUAL_TREATMENT_LIBRARY;
