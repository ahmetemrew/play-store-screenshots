export const VISUAL_TREATMENT_LIBRARY = {
  editorial: {
    label: "Editoryal",
    note: "Yumusak ve premium",
    backgroundColor: "#f4dfcf",
    textColor: "#171412",
    bezelColor: "#171412",
    fontFamily: "Outfit, sans-serif",
    fontWeight: "600",
    borderRadius: 44,
  },
  signal: {
    label: "Canli",
    note: "Net ve parlak",
    backgroundColor: "#b9ffd8",
    textColor: "#09131a",
    bezelColor: "#09131a",
    fontFamily: "Inter, sans-serif",
    fontWeight: "700",
    borderRadius: 34,
  },
  nocturne: {
    label: "Gece",
    note: "Koyu ve kontrastli",
    backgroundColor: "#111827",
    textColor: "#f7f2ea",
    bezelColor: "#f7f2ea",
    fontFamily: "JetBrains Mono, monospace",
    fontWeight: "600",
    borderRadius: 28,
  },
} as const;

export type VisualTreatmentId = keyof typeof VISUAL_TREATMENT_LIBRARY;
