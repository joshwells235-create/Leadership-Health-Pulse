"use client";

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-navy">
          Something Went Wrong
        </h1>
        <p className="text-navy/60">
          {error.message || "There was an error generating your report."}
        </p>
        <button
          onClick={reset}
          className="bg-navy text-white font-semibold px-8 py-3 rounded-md hover:bg-navy/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
