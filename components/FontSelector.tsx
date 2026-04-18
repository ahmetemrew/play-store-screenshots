import { useEffect, useMemo, useState } from "react";
import { loadFont } from "@/lib/useFontLoader";

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

type FontOption = {
  family: string;
  category: string;
  preview: string;
};

const FONT_LIBRARY: FontOption[] = [
  { family: "Inter", category: "sans-serif", preview: "Hızlı ve net arayüz metni" },
  { family: "Outfit", category: "sans-serif", preview: "Yumuşak ve modern başlık" },
  { family: "DM Sans", category: "sans-serif", preview: "Dengeli ve okunaklı metin" },
  { family: "Work Sans", category: "sans-serif", preview: "Temiz ve düzenli görünüm" },
  { family: "Merriweather", category: "serif", preview: "Güçlü ve editoryal vurgu" },
  { family: "Playfair Display", category: "serif", preview: "Daha karakterli başlık stili" },
  { family: "Poppins", category: "sans-serif", preview: "Yuvarlak ve sıcak tipografi" },
  { family: "Rubik", category: "sans-serif", preview: "Kompakt ve dengeli satırlar" },
  { family: "Nunito", category: "sans-serif", preview: "Dost canlısı bir görünüm" },
  { family: "Oswald", category: "display", preview: "Daha sert ve dikkat çekici başlık" },
  { family: "Roboto Mono", category: "monospace", preview: "Teknik ve sistematik ifade" },
  { family: "Montserrat", category: "sans-serif", preview: "Kurumsal ve temiz görünüm" },
  { family: "Lato", category: "sans-serif", preview: "Rahat okunan gövde metni" },
  { family: "Raleway", category: "sans-serif", preview: "İnce ve zarif sunum dili" },
  { family: "Noto Sans", category: "sans-serif", preview: "Nötr ve güvenli tipografi" },
  { family: "Ubuntu", category: "sans-serif", preview: "Sıcak ve karakterli metin" },
];

const FontSelector = ({ value, onChange }: FontSelectorProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const family = value.split(",")[0].replace(/['"]/g, "").trim();
    if (family) {
      loadFont(family);
    }
  }, [value]);

  const visibleFonts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr");

    if (!normalizedQuery) {
      return FONT_LIBRARY;
    }

    return FONT_LIBRARY.filter((font) =>
      font.family.toLocaleLowerCase("tr").includes(normalizedQuery)
    );
  }, [query]);

  const pickFont = (family: string) => {
    loadFont(family);
    onChange(`${family}, sans-serif`);
    setIsLibraryOpen(false);
  };

  return (
    <div>
      <button
        type="button"
        className="studio-field flex items-center justify-between bg-white/90 text-left"
        onClick={() => setIsLibraryOpen(true)}
      >
        <span style={{ fontFamily: value }} className="font-medium">
          {value.split(",")[0].replace(/['"]/g, "")}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-[#171412]"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171412]/50 p-4 backdrop-blur-sm">
          <div className="studio-panel max-h-[82vh] w-full max-w-4xl overflow-hidden">
            <div className="border-b border-[rgba(17,24,39,0.08)] px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.24em] studio-muted">
                    Yazı tipi
                  </p>
                  <h3 className="mb-0 text-2xl text-[#171412]">Seçim yapın</h3>
                </div>
                <button
                  type="button"
                  className="studio-button studio-button-ghost"
                  onClick={() => setIsLibraryOpen(false)}
                >
                  Kapat
                </button>
              </div>

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Yazı tipi ara"
                className="studio-field mt-4"
              />
            </div>

            <div className="max-h-[58vh] overflow-y-auto px-5 py-5 sm:px-6">
              {visibleFonts.length === 0 ? (
                <div className="rounded-[24px] border border-[rgba(17,24,39,0.08)] bg-white/70 px-6 py-10 text-center text-sm studio-muted">
                  Aramanıza uygun yazı tipi bulunamadı.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleFonts.map((font) => (
                    <button
                      key={font.family}
                      type="button"
                      className="rounded-[22px] border border-[rgba(17,24,39,0.08)] bg-white/80 p-4 text-left transition hover:-translate-y-[1px] hover:border-[#ff6b35] hover:bg-[#fff7f0]"
                      onClick={() => pickFont(font.family)}
                      onMouseEnter={() => loadFont(font.family)}
                      style={{ fontFamily: font.family }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-base font-semibold text-[#171412]">
                          {font.family}
                        </span>
                        <span className="rounded-full bg-[rgba(17,24,39,0.06)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] studio-muted">
                          {font.category}
                        </span>
                      </div>
                      <p className="mb-0 mt-3 text-lg leading-snug text-[#171412]">
                        {font.preview}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FontSelector;
