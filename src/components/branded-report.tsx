// Branded report wrapper — provides the LeadShift visual treatment
// for all report types (individual manager, org, CEO diagnostic).
// Everything inside this component gets captured by html2canvas for PDF.
//
// Logos are embedded as base64 data URIs so html2canvas can render them
// reliably (external img src paths fail in canvas capture).

const LOGO_WHITE = "data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjY0IiB2aWV3Qm94PSIwIDAgMzc0IDY0IiB3aWR0aD0iMzc0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Im0xNC4yMjU2MjE3IDUwLjQyODY1NGMtMTAuODYxODA3OTctNS43NjUyMjYxLTE2LjQwMDYyOTIzLTE4LjE4NzQ3MDQtMTMuNDMwMDEyMTYtMzAuMTIwMjg4MSAyLjk3MDYxNzA2LTExLjkzMjgxNzc0IDEzLjY4Njk2MDc2LTIwLjMwODM2NTkgMjUuOTgzOTgwODYtMjAuMzA4MzY1OWg1Mi4xNTc0ODQ1bC03LjU5MzU1NTIgNy42MDAyMDQ1OGgtNDQuNTUwNjMwNmMtOS4yNTQ4NjkyLS4wMDY4OTA0Mi0xNy4xOTQyMzY0MiA2LjU5NzAzOTEyLTE4Ljg3MjkwNTk4IDE1LjY5ODM5NzIyLTEuNjc4NjY5NTcgOS4xMDEzNTgxIDMuMzgyMzYxMzggMTguMTAzMTAyNSAxMi4wMzA3MjcwOCAyMS4zOTgzMTQ0eiIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Im0uNjY3NjAxNDMgNjQgNy41ODY5MDU4OS03LjYwMDIzMTZoNDQuNTUwNjMwNThjOS4yNzI5MTkyLjAyNTk5MDkgMTcuMjM2MDAwMy02LjU4Njc4NTUgMTguOTEzOTE1NC0xNS43MDY2NzA3IDEuNjc3OTE1MS05LjExOTg4NTMtMy40MTAwOTA5LTE4LjEzMzg1NTktMTIuMDg1MDM1Mi0yMS40MDk5ODlsNS43MzgzODcyLTUuNzMxNzM3OGMxMC44ODQyMzAxIDUuNzU0OTE1NiAxNi40NDE0NDcgMTguMTkwMjE4IDEzLjQ2ODMxNyAzMC4xMzc4NTQ0cy0xMy43MTAyOTEgMjAuMzI4MTM2NC0yNi4wMjIyODU3IDIwLjMxMDc3NDd6IiBmaWxsPSIjMDA3ZWZhIi8+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0ibTEwMy4yODY5ODcgNTUuNzI4MTg0M3YtNDcuNDg5NjQyMzJoNy4zNjc0Nzd2NDAuNzY3MTUxNjJoMjAuMzg2OTAxdjYuNzIyNDkwN3oiLz48cGF0aCBkPSJtMTUwLjMyNDQ3MyA1Ni4zNzk4MjM2Yy0xMS4xMDQ0MTEgMC0xOC41NjQ5NzktNy4xODEyOTg5LTE4LjU2NDk3OS0xNy44NjAxNTE1IDAtOS45NzQwMjE4IDcuMzE0MjgzLTE3Ljg1MzQ5OSAxNi42MjMzNy0xNy45NTMyMzkyIDguODk2ODI3IDAgMTQuMzYyNTkxIDUuMTczMTkyNiAxNS40MDY1MzkgMTQuNTY4NzIxMXY1LjEwMDA0OThoLTI0LjU2OTM0MWMuNzExNDgxIDYuMTYzOTQ1NCA0LjQ0ODQxNCA5LjM0MjMzMzcgMTEuMTI0MzU5IDkuNDU1MzcyNiAzLjEwNzQ1OC4wNDM0OTE1IDYuMTg3NjQyLS41ODQ3OTM0IDkuMDI5ODE1LTEuODQxODY5M2wxLjE5MDIzMy0uNTUxODk1OSAxLjY4MjI4NSA2LjMzNjgyODUtLjg0NDQ2Ny4zNzkwMTI4Yy0zLjQ4NDA4IDEuNTYyMjcxNC03LjI1OTUwMiAyLjM2OTAyNDItMTEuMDc3ODE0IDIuMzY3MTcxMXptNS44OTc5NzItMjIuOTAwMzU3MmMtLjY2NDkzNS0zLjgxNjcyNTctMy41OTcyOTctNi4yMjM3ODk2LTcuNzczMDg4LTYuMjIzNzg5Ni00LjU2ODEwMiAwLTcuMzE0MjgyIDMuMDEyMTU0Ni04LjUzNzc2MiA2LjIyMzc4OTZ6Ii8+PHBhdGggZD0ibTE4My43NzczNDIgNTYuMzc5ODIwNGMtOS4zNTU2MzIgMC0xNi42ODk4NjMtNy44NzI4Mjc5LTE2LjY4OTg2My0xNy45NTMyMzkyczcuNjEzNTA0LTE3LjkxOTk5MjUgMTcuMzQxNDk5LTE3LjkxOTk5MjVjMy4yMzI3MjUtLjEwNjU3MzMgNi40MjYzMjEuNzMyMjY1NyA5LjE4OTM5OSAyLjQxMzcxMzN2LTEuNzM1NDc5OGg3LjM2NzQ3OHYzNC41NzY2MDg4aC03LjM2NzQ3OHYtMi42NTMwODk4Yy0yLjgwNjA5NiAyLjE5MDU0MjUtNi4yODE5NDggMy4zNDYwMjg0LTkuODQxMDM1IDMuMjcxNDc5MnptMS4yOTY2MjMtMjkuMTE3NDk0MmMtNS44NTE0MjYgMC0xMC42Mzg5NTYgNS4wMjY5MDY5LTEwLjYzODk1NiAxMS4xOTc1MDE3IDAgNi4wNzA4NTQ2IDQuODYwNjczIDExLjIwNDE1MTEgMTAuNjM4OTU2IDExLjIwNDE1MTEgMi43Nzk0MjggMCA2LjQ4OTc2NC0uODExMjIwNCA4LjU0NDQxMi00LjYxNDY0NzR2LTE1LjEyNzI2NjNjLTIuNDgyMTI1LTEuNzk0MTQ3Ny01LjQ4MjUxMS0yLjcyODEyMDItOC41NDQ0MTItMi42NTk3MzkxeiIvPjxwYXRoIGQ9Im0yMjEuMzA2MjYyIDU2LjM3OTgyMDRjLTkuMzU1NjMzIDAtMTYuNjg5ODY0LTcuODcyODI3OS0xNi42ODk4NjQtMTcuOTUzMjM5MnM3LjYxMzUwNC0xNy45MTk5OTI1IDE3LjM0MTUtMTcuOTE5OTkyNWMyLjk3OTY4Ny0uMDk2NDMyNyA1LjkzNzIxMS41NDMwMzIxIDguNjEwOTA1IDEuODYxODE3NHYtMTQuMTI5ODY0MTJoNy4zNjc0Nzh2NDcuNDg5NjQyMzJoLTcuMzY3NDc4di0yLjE0MTA5Yy0yLjcxODMzOCAxLjg3OTAzNDMtNS45NTg1ODUgMi44NTU5OTM0LTkuMjYyNTQxIDIuNzkyNzI2MXptMS4yOTY2MjItMjkuMTE3NDk0MmMtNS44NTE0MjYgMC0xMC42Mzg5NTYgNS4wMjY5MDY5LTEwLjYzODk1NiAxMS4xOTc1MDE3IDAgNi4wNzA4NTQ2IDQuODYwNjczIDExLjIwNDE1MTEgMTAuNjM4OTU2IDExLjIwNDE1MTEgMi40NDY5NiAwIDUuNzc4Mjg0LS42NjQ5MzQ3IDcuOTc5MjE4LTMuNjUwNDkxOXYtMTcuMDAyMzgyNWMtMi40ODIzNzUtMS4yMTA0NjIyLTUuMjE4MTIyLTEuODEwMDQ2OS03Ljk3OTIxOC0xLjc0ODc3ODR6Ii8+PHBhdGggZD0ibTI1OC44NTUxMjkgMzAuNjIwMjQ2OGMtNi43OTU2MzQtMi4yMDA5MzQxLTkuNTAxOTE4LTQuNjU0NTQzNS05LjUwMTkxOC04LjM0NDkzMTUgMC01LjM3MjY3MzEgNC4yNzU1My03Ljk3OTIxNzQgOC44NzAyMy03Ljk3OTIxNzQgMy4xMzg5OTYuMDAxMDg5NSA2LjI0ODkyNi42MDE0MDk4IDkuMTYyODAxIDEuNzY4NzI2NWwzLjUxNzUwNS0zLjUxNzUwNWMtMy45ODg5NzItMS43OTM3MjU2LTguMzA2NzcxLTIuNzQwMTU0NDgtMTIuNjgwMzA2LTIuNzc5NDI3NDItNy4zMTQyODMgMC0xNC4wNDM0MjMgNC4wNzYwNTAyMi0xNC4wNDM0MjMgMTIuNDg3NDc1MjIgMCA2Ljk4ODQ2NDYgNi40Njk4MTYgMTAuODA1MTkwMyAxMy4xMzI0NjIgMTIuNjgwMzA2NCA2LjkyODYyMSAxLjk0MTYwOTUgOS41MTUyMTcgNC40MDE4NjgyIDkuNTE1MjE3IDguNTQ0NDExOSAwIDUuODI0ODI4OC00LjY1NDU0NCA4LjM0NDkzMTYtOS41MTUyMTcgOC4zNDQ5MzE2LTMuMzUwOTY2LS4wMTQ5NTMzLTYuNjczOTM0LS42MTExNTI4LTkuODIxMDg3LTEuNzYyMDc3MmwtMy41MDQyMDYgMy41MTA4NTU3YzQuMjE2NTM5IDEuNzYyMjQ0IDguNzI5MzkgMi43MDc2ODYyIDEzLjI5ODY5NiAyLjc4NjA3NjcgNy41NzM2MDcgMCAxNC42ODg0MDktMy45ODk2MDg3IDE0LjY4ODQwOS0xMi44Nzk3ODY4LS4wMTMyOTktNy4yOTQzMzQ1LTYuMTMwNjk5LTEwLjU5MjQxMTEtMTMuMTE5MTYzLTEyLjg1OTgzODd6Ii8+PHBhdGggZD0ibTI3Ny4yODA0NzIgMTAuNDMyODI2OGg1LjE3OTg0MnYxNy4xNDg2NjgxbC4zODU2NjIuMTI2MzM3NmMyLjQwMDQxNC0yLjkxMjQxNDQgNi41MzYzMDktNC45ODAzNjE2IDExLjg0MjQ4OC00Ljk4MDM2MTYgNi40MDk5NzIgMCAxMS43MTYxNTEgNC41OTQ2OTk0IDExLjcxNjE1MSAxMy41OTEyNjd2MTkuNDA5NDQ2NGgtNS4xODY0OTF2LTE5LjQwOTQ0NjRjMC02LjM0MzQ3NzgtMy40OTc1NTctOS4wNTY0MTE3LTcuODMyOTMyLTkuMDU2NDExNy00LjQ2ODM2MiAwLTguNjQ0MTUyIDEuOTk0ODA0My0xMC45MzgxNzcgNi4wODQxNTMydjIyLjM4MTcwNDloLTUuMTY2NTQzeiIvPjxwYXRoIGQ9Im0zMTYuOTk3MDI2IDkuOTc0MDIxNzZjMS43MzMyLS4wMTgyNjI5IDMuMTUzMDU4IDEuMzcxOTMzMTQgMy4xNzEzODYgMy4xMDUxMzE3NC4wMTgzMjggMS43MzMxOTg3LTEuMzcxODE1IDMuMTUzMTA5MS0zLjEwNTAxMyAzLjE3MTUwMTdzLTMuMTUzMTYxLTEuMzcxNjk3My0zLjE3MTYxOC0zLjEwNDg5NDVjLjAwMzE1MS0xLjcyNDYxODYgMS4zODEwODEtMy4xMzIwNTM5IDMuMTA1MjQ1LTMuMTcxNzM4OTR6bS0yLjUyMDEwMiAxMy4zOTE3ODY1NGg1LjE3MzE5MnYzMi4zNjIzNzZoLTUuMTczMTkyeiIvPjwvZz48cGF0aCBkPSJtMzczLjMxNzAwMyAyNS42Mzk4ODUzaC01LjgzODEyOGwtNC41MjgyMDYgNC41MjgyMDU5aDUuODM4MTI4eiIgZmlsbD0iIzAwN2VmYSIvPjxwYXRoIGQ9Im0zNjYuODY3MTM1IDUwLjY4MTMyOTNjLTEuNjM2MDU3LjYzNTQ2NDQtMy4zODY1NzIuOTIzMDY1My01LjEzOTk0Ni44NDQ0NjcxLTMuNDMxMDYzIDAtNS44MjQ4MjgtMS45NDE2MDk1LTUuODI0ODI4LTYuNDY5ODE1NHYtMTQuODg3ODg5OGg3LjAyMTcxMWw0LjUyODIwNi00LjUyODIwNTloLTExLjUyMzMydi0xMi41MjA3MjJoLTUuMTczMTkzdjEyLjUyMDcyMmgtMTYuMjA0NDZ2LTYuMTUwNjQ2OGMwLTQuMzk1MjE4OSAyLjA3NDU5Ni03LjExNDgwMjIgNS44MjQ4MjgtNy4xMTQ4MDIyIDEuMjA5MzI4LS4wMTEwMjI1IDIuNDE3MzQ4LjA4MjQxNTUgMy42MTA1OTYuMjc5MjcyNmwzLjQ0NDM2Mi0zLjQ1MTAxMTQ5Yy0yLjIyOTUzNS0uOTQyNTYwNTQtNC42MzUyNzQtMS4zOTYwNDU4Ni03LjA1NDk1OC0xLjMyOTg2OTU2LTYuNjQ5MzQ3IDAtMTAuOTk4MDIxIDQuNTk0Njk5MzUtMTAuOTk4MDIxIDExLjY0MzAwODA1djYuMTUwNjQ2OGgtMy4yMTgyODR2NC41MjgyMDU5aDMuMjE4Mjg0djI1LjUzMzQ5NTdoNS4xNzMxOTN2LTI1LjU2MDA5MzFoMTYuMjA0NDZ2MTQuODg3ODg5OGMwIDcuMDQ4MzA4NyA0LjcyMTAzNyAxMC45OTgwMjEzIDEwLjk5ODAyMiAxMC45OTgwMjEzIDIuMjEwODIyLjA1OTIwMDUgNC40MDUxNjctLjM5NjA1NzggNi40MDk5NzEtMS4zMjk4Njk2eiIgZmlsbD0iI2ZmZmZmZiIvPjwvZz48L3N2Zz4=";

const LOGO_NAVY = "data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjY0IiB2aWV3Qm94PSIwIDAgMzc0IDY0IiB3aWR0aD0iMzc0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Im0xNC4yMjU2MjE3IDUwLjQyODY1NGMtMTAuODYxODA3OTctNS43NjUyMjYxLTE2LjQwMDYyOTIzLTE4LjE4NzQ3MDQtMTMuNDMwMDEyMTYtMzAuMTIwMjg4MSAyLjk3MDYxNzA2LTExLjkzMjgxNzc0IDEzLjY4Njk2MDc2LTIwLjMwODM2NTkgMjUuOTgzOTgwODYtMjAuMzA4MzY1OWg1Mi4xNTc0ODQ1bC03LjU5MzU1NTIgNy42MDAyMDQ1OGgtNDQuNTUwNjMwNmMtOS4yNTQ4NjkyLS4wMDY4OTA0Mi0xNy4xOTQyMzY0MiA2LjU5NzAzOTEyLTE4Ljg3MjkwNTk4IDE1LjY5ODM5NzIyLTEuNjc4NjY5NTcgOS4xMDEzNTgxIDMuMzgyMzYxMzggMTguMTAzMTAyNSAxMi4wMzA3MjcwOCAyMS4zOTgzMTQ0eiIgZmlsbD0iIzEwMWQ1MSIvPjxwYXRoIGQ9Im0uNjY3NjAxNDMgNjQgNy41ODY5MDU4OS03LjYwMDIzMTZoNDQuNTUwNjMwNThjOS4yNzI5MTkyLjAyNTk5MDkgMTcuMjM2MDAwMy02LjU4Njc4NTUgMTguOTEzOTE1NC0xNS43MDY2NzA3IDEuNjc3OTE1MS05LjExOTg4NTMtMy40MTAwOTA5LTE4LjEzMzg1NTktMTIuMDg1MDM1Mi0yMS40MDk5ODlsNS43MzgzODcyLTUuNzMxNzM3OGMxMC44ODQyMzAxIDUuNzU0OTE1NiAxNi40NDE0NDcgMTguMTkwMjE4IDEzLjQ2ODMxNyAzMC4xMzc4NTQ0cy0xMy43MTAyOTEgMjAuMzI4MTM2NC0yNi4wMjIyODU3IDIwLjMxMDc3NDd6IiBmaWxsPSIjMDA3ZWZhIi8+PGcgZmlsbD0iIzEwMWQ1MSI+PHBhdGggZD0ibTEwMy4yODY5ODcgNTUuNzI4MTg0M3YtNDcuNDg5NjQyMzJoNy4zNjc0Nzd2NDAuNzY3MTUxNjJoMjAuMzg2OTAxdjYuNzIyNDkwN3oiLz48cGF0aCBkPSJtMTUwLjMyNDQ3MyA1Ni4zNzk4MjM2Yy0xMS4xMDQ0MTEgMC0xOC41NjQ5NzktNy4xODEyOTg5LTE4LjU2NDk3OS0xNy44NjAxNTE1IDAtOS45NzQwMjE4IDcuMzE0MjgzLTE3Ljg1MzQ5OSAxNi42MjMzNy0xNy45NTMyMzkyIDguODk2ODI3IDAgMTQuMzYyNTkxIDUuMTczMTkyNiAxNS40MDY1MzkgMTQuNTY4NzIxMXY1LjEwMDA0OThoLTI0LjU2OTM0MWMuNzExNDgxIDYuMTYzOTQ1NCA0LjQ0ODQxNCA5LjM0MjMzMzcgMTEuMTI0MzU5IDkuNDU1MzcyNiAzLjEwNzQ1OC4wNDM0OTE1IDYuMTg3NjQyLS41ODQ3OTM0IDkuMDI5ODE1LTEuODQxODY5M2wxLjE5MDIzMy0uNTUxODk1OSAxLjY4MjI4NSA2LjMzNjgyODUtLjg0NDQ2Ny4zNzkwMTI4Yy0zLjQ4NDA4IDEuNTYyMjcxNC03LjI1OTUwMiAyLjM2OTAyNDItMTEuMDc3ODE0IDIuMzY3MTcxMXptNS44OTc5NzItMjIuOTAwMzU3MmMtLjY2NDkzNS0zLjgxNjcyNTctMy41OTcyOTctNi4yMjM3ODk2LTcuNzczMDg4LTYuMjIzNzg5Ni00LjU2ODEwMiAwLTcuMzE0MjgyIDMuMDEyMTU0Ni04LjUzNzc2MiA2LjIyMzc4OTZ6Ii8+PC9nPjwvc3ZnPg==";

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
              src={LOGO_WHITE}
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
          src={LOGO_NAVY}
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
