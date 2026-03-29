// Branded report wrapper — provides the LeadShift visual treatment
// for all report types (individual manager, org, CEO diagnostic).
// Everything inside this component gets captured by html2canvas for PDF.

import Image from "next/image";

interface BrandedReportProps {
  title: string;
  subtitle?: string;
  date?: string;
  children: React.ReactNode;
  badge?: {
    label: string;
    color: string; // hex color for background
  };
}

export function BrandedReport({
  title,
  subtitle,
  date,
  children,
  badge,
}: BrandedReportProps) {
  const displayDate =
    date ||
    new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg">
      {/* Header Banner */}
      <div className="bg-navy px-10 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
              LeadShift
            </p>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && (
              <p className="text-white/70 text-base mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/leadshift-logo-white.svg"
              alt="LeadShift"
              width={140}
              height={24}
              className="opacity-80"
            />
            <p className="text-white/40 text-xs">{displayDate}</p>
          </div>
        </div>

        {/* Badge (quadrant label, overall score, etc.) */}
        {badge && (
          <div className="mt-5">
            <span
              className="inline-block px-5 py-2 rounded-md text-white font-bold text-sm"
              style={{ backgroundColor: badge.color }}
            >
              {badge.label}
            </span>
          </div>
        )}
      </div>

      {/* Report Body */}
      <div className="px-10 py-8 space-y-8">{children}</div>

      {/* Footer */}
      <div className="px-10 py-5 border-t border-navy/10 flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/leadshift-logo.svg"
          alt="LeadShift"
          width={100}
          height={18}
          className="opacity-40"
        />
        <p className="text-[10px] text-navy/30">
          Confidential. Prepared by LeadShift.
        </p>
      </div>
    </div>
  );
}

export function ReportSection({
  title,
  children,
  accentColor = "#101d51",
}: {
  title: string;
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="flex gap-0">
      {/* Left accent bar */}
      <div
        className="w-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: accentColor }}
      />
      <div className="pl-6 flex-1">
        <h2 className="text-lg font-bold text-navy mb-3">{title}</h2>
        <div className="prose prose-navy max-w-none text-navy/75 leading-relaxed text-[15px]">
          {children}
        </div>
      </div>
    </div>
  );
}
