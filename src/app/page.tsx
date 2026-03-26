import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Brand */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-navy tracking-tight">
            Leadership Health Pulse
          </h1>
          <p className="text-lg text-navy/60 font-medium">by LeadShift</p>
        </div>

        {/* Description */}
        <p className="text-lg md:text-xl text-navy/80 leading-relaxed max-w-xl mx-auto">
          A 15-minute diagnostic that helps you see where your leadership bench
          is strong, where it&apos;s stretched, and where to focus next.
        </p>

        {/* CTA */}
        <div className="pt-4">
          <Link
            href="/survey"
            className="inline-block bg-blue text-white text-lg font-semibold px-10 py-4 rounded-md hover:bg-blue/90 transition-colors shadow-sm"
          >
            Start the Diagnostic
          </Link>
        </div>

        {/* Time estimate */}
        <p className="text-sm text-navy/50">
          Takes 10–20 minutes depending on your organization&apos;s structure.
          <br />
          Your responses generate a personalized Leadership Health Report.
        </p>
      </div>
    </main>
  );
}
