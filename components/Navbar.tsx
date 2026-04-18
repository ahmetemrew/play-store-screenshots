import { PRODUCT_SIGNATURE as studioBrand } from "@/lib/brand/manifest";

export default function Navbar() {
  return (
    <nav className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto studio-panel overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#171412] text-sm font-black tracking-[0.24em] text-[#fff7ee] shadow-[0_12px_30px_rgba(23,20,18,0.22)]">
            {studioBrand.shortName}
          </div>
          <div>
            <p className="mb-0 text-[11px] font-bold uppercase tracking-[0.24em] studio-muted">
              {studioBrand.descriptor}
            </p>
            <h1 className="mb-0 text-2xl text-[#171412]">{studioBrand.name}</h1>
          </div>
        </div>
      </div>
    </nav>
  );
}
