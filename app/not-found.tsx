export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/45">
          Sayfa bulunamadı
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          Aradığın ekran burada yok.
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/60">
          Ana düzenleme ekranına dönerek görsellerini oluşturmaya devam
          edebilirsin.
        </p>
      </div>
    </main>
  );
}
