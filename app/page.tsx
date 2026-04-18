import AppScreenshotGenerator from "@/components/AppScreenshotGenerator";

export default function Home() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1640px]">
        <AppScreenshotGenerator />
      </div>
    </div>
  );
}
