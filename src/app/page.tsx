import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <div className="py-8 px-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/leadshift-logo.svg"
          alt="LeadShift"
          className="h-7 mx-auto"
        />
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="max-w-3xl w-full text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-navy tracking-tight leading-tight">
            See where your leadership
            <br />
            bench is strong.
            <br />
            <span className="text-blue">And where it isn&apos;t.</span>
          </h1>

          <p className="text-lg text-navy/60 max-w-xl mx-auto leading-relaxed">
            Two diagnostic tools built for leadership teams who want clarity,
            not guesswork.
          </p>
        </div>

        {/* Two product cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mt-12 px-4">
          {/* CEO Diagnostic */}
          <Link
            href="/survey"
            className="group bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-8 hover:border-blue/30 hover:shadow-[0px_4px_24px_rgba(0,126,250,0.12)] transition-all"
          >
            <div className="text-xs font-semibold text-blue uppercase tracking-widest mb-3">
              For CEOs &amp; Business Owners
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">
              Leadership Health Pulse
            </h2>
            <p className="text-sm text-navy/60 leading-relaxed mb-6">
              Rate your leadership team across three organizational tiers.
              Receive an AI-generated report that shows where the gaps are and
              what to prioritize.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-navy/40">10-20 minutes</span>
              <span className="text-sm font-semibold text-blue group-hover:translate-x-1 transition-transform">
                Start Diagnostic &rarr;
              </span>
            </div>
          </Link>

          {/* Manager Assessment */}
          <div className="bg-white rounded-xl border border-navy/10 shadow-[0px_2px_20px_rgba(0,0,0,0.06)] p-8">
            <div className="text-xs font-semibold text-navy/40 uppercase tracking-widest mb-3">
              For Managers
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">
              Manager Skills Assessment
            </h2>
            <p className="text-sm text-navy/60 leading-relaxed mb-6">
              20 scenario-based questions that measure how you lead your team.
              Receive a personalized report identifying your management style
              and development priorities.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-navy/40">15 minutes</span>
              <span className="text-xs text-navy/30">
                Requires a link from your organization
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center border-t border-navy/5">
        <p className="text-xs text-navy/30">
          &copy; {new Date().getFullYear()} LeadShift. All rights reserved.
        </p>
      </div>
    </main>
  );
}
