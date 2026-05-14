export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-[32px] border border-[rgba(71,55,46,0.12)] bg-[rgba(255,250,244,0.72)] p-10 text-center shadow-[0_24px_80px_rgba(44,34,29,0.12)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#7c6d63]">
          Sayfa bulunamadı
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-[#221c18]">
          Aradığın ekran burada yok.
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#7c6d63]">
          Ana düzenleme ekranına dönerek görsellerini oluşturmaya devam
          edebilirsin.
        </p>
      </div>
    </main>
  );
}
