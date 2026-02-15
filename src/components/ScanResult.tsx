"use client";

import type { ScanResultData } from "@/types";
import { calculateRiskScore } from "@/lib/riskScore";
import { saveScan, getPreviousScan, compareScans } from "@/lib/scanHistory";
import type { ScanDiff } from "@/lib/scanHistory";
import { generateHtmlReport } from "@/lib/exportReport";
import { RiskGauge } from "./RiskGauge";
import { ActionItems } from "./ActionItems";
import { SecurityHeadersCard } from "./SecurityHeadersCard";
import { CVETab } from "./CVETab";
import { useEffect, useState, useMemo } from "react";

interface ScanResultProps {
  data: ScanResultData;
}

export function ScanResult({ data }: ScanResultProps) {
  const {
    domain,
    subdomains = [],
    dns = { a: [], aaaa: [], mx: [], txt: [], cname: [] },
    scanTime = 0,
    rootSecurityHeaders,
  } = data;
  const { score, grade, actions } = calculateRiskScore(
    subdomains,
    rootSecurityHeaders
  );

  const [diff, setDiff] = useState<ScanDiff | null>(null);

  const technologies = useMemo(
    () => subdomains.flatMap((s) => s.technologies || []),
    [subdomains]
  );

  useEffect(() => {
    const prevScan = getPreviousScan(domain);
    if (prevScan) {
      setDiff(compareScans(prevScan, subdomains.map((s) => s.name)));
    }
    saveScan({
      domain,
      scannedAt: data.scannedAt || new Date().toISOString(),
      subdomains: subdomains.map((s) => s.name),
      subdomainCount: subdomains.length,
    });
  }, [domain, subdomains, data.scannedAt]);

  const handleExport = () => {
    const html = generateHtmlReport(data, actions, score, grade);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `am-i-secure-report-${domain}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="space-y-6"
      style={{
        background: "#f7f7f8",
        color: "#0d0d0d",
        borderRadius: "12px",
        padding: "1rem",
        border: "1px solid #e5e5e5",
      }}
    >
      {/* Change indicator */}
      {diff && (diff.added.length > 0 || diff.removed.length > 0) && (
        <div className="rounded-xl border border-gray-300 bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
          <h3 className="font-medium" style={{ color: "#0d0d0d" }}>Changes since last scan</h3>
          {diff.added.length > 0 && (
            <p className="mt-1 text-sm" style={{ color: "#6e6e80" }}>
              <span style={{ color: "#166534" }}>+{diff.added.length} new</span>
              : {diff.added.slice(0, 5).join(", ")}
              {diff.added.length > 5 && " …"}
            </p>
          )}
          {diff.removed.length > 0 && (
            <p className="mt-1 text-sm" style={{ color: "#6e6e80" }}>
              <span style={{ color: "#b91c1c" }}>−{diff.removed.length} removed</span>
              : {diff.removed.slice(0, 5).join(", ")}
              {diff.removed.length > 5 && " …"}
            </p>
          )}
        </div>
      )}

      {/* Top bar: Score + Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-xl border border-gray-200 bg-white p-6" style={{ borderColor: "#e5e5e5" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#0d0d0d" }}>Security Score</h2>
          <div className="mt-4">
            <RiskGauge score={score} grade={grade} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleExport}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:opacity-90"
            style={{ background: "#0d0d0d", color: "#ffffff", borderColor: "#0d0d0d" }}
          >
            Download Report (HTML)
          </button>
          <p className="text-xs" style={{ color: "#6e6e80" }}>
            Open in browser, then Print → Save as PDF
          </p>
        </div>
      </div>

      {/* Action Items / Warnings */}
      <ActionItems actions={actions} />

      {/* Summary stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6" style={{ borderColor: "#e5e5e5" }}>
        <h2 className="text-lg font-semibold" style={{ color: "#0d0d0d" }}>Scan Summary</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm" style={{ color: "#6e6e80" }}>Subdomains</p>
            <p className="text-2xl font-bold" style={{ color: "#0d0d0d" }}>
              {subdomains.length}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: "#6e6e80" }}>Risk score</p>
            <p
              className="text-2xl font-bold"
              style={{
                color: score >= 80 ? "#166534" : score >= 60 ? "#92400e" : "#b91c1c",
              }}
            >
              {score}/100
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: "#6e6e80" }}>Issues found</p>
            <p className="text-2xl font-bold" style={{ color: "#0d0d0d" }}>{actions.length}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: "#6e6e80" }}>Scan time</p>
            <p className="text-2xl font-bold" style={{ color: "#0d0d0d" }}>
              {(scanTime / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      </div>

      {/* Security Headers - Root domain */}
      <div className="rounded-xl border border-gray-200 bg-white p-6" style={{ borderColor: "#e5e5e5" }}>
        <h2 className="text-lg font-semibold" style={{ color: "#0d0d0d" }}>Security Headers</h2>
        <p className="mt-1 text-sm" style={{ color: "#6e6e80" }}>
          HTTP security headers for main domain and key subdomains
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SecurityHeadersCard host={domain} headers={rootSecurityHeaders} />
          {subdomains
            .filter((s) => s.securityHeaders)
            .slice(0, 3)
            .map((s) => (
              <SecurityHeadersCard
                key={s.name}
                host={s.name}
                headers={s.securityHeaders}
              />
            ))}
        </div>
      </div>

      {/* DNS */}
      <div className="rounded-xl border border-gray-200 bg-white p-6" style={{ borderColor: "#e5e5e5" }}>
        <h2 className="text-lg font-semibold" style={{ color: "#0d0d0d" }}>
          DNS records for {domain}
        </h2>
        <div className="mt-4 space-y-2 font-mono text-sm">
          {dns.a.length > 0 && (
            <p>
              <span style={{ color: "#6e6e80" }}>A:</span>{" "}
              <span style={{ color: "#0d0d0d" }}>{dns.a.join(", ")}</span>
            </p>
          )}
          {dns.aaaa.length > 0 && (
            <p>
              <span style={{ color: "#6e6e80" }}>AAAA:</span>{" "}
              <span style={{ color: "#0d0d0d" }}>{dns.aaaa.join(", ")}</span>
            </p>
          )}
          {dns.mx.length > 0 && (
            <p>
              <span style={{ color: "#6e6e80" }}>MX:</span>{" "}
              <span style={{ color: "#0d0d0d" }}>{dns.mx.join(", ")}</span>
            </p>
          )}
          {dns.txt.length > 0 && (
            <p>
              <span style={{ color: "#6e6e80" }}>TXT:</span>{" "}
              <span className="block max-w-full truncate" style={{ color: "#0d0d0d" }}>
                {dns.txt.slice(0, 2).join(" | ")}
                {dns.txt.length > 2 && ` (+${dns.txt.length - 2} more)`}
              </span>
            </p>
          )}
          {dns.cname.length > 0 && (
            <p>
              <span style={{ color: "#6e6e80" }}>CNAME:</span>{" "}
              <span style={{ color: "#0d0d0d" }}>{dns.cname.join(", ")}</span>
            </p>
          )}
          {dns.a.length === 0 &&
            dns.aaaa.length === 0 &&
            dns.mx.length === 0 &&
            dns.txt.length === 0 &&
            dns.cname.length === 0 && (
              <p style={{ color: "#6e6e80" }}>No DNS records found</p>
            )}
        </div>
      </div>

      {/* Subdomains with tech badges, IPs, cert status, warnings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6" style={{ borderColor: "#e5e5e5" }}>
        <h2 className="text-lg font-semibold" style={{ color: "#0d0d0d" }}>
          Discovered Subdomains ({subdomains.length})
        </h2>
        <p className="mt-1 text-sm" style={{ color: "#6e6e80" }}>
          From Certificate Transparency logs — scroll for full list
        </p>
        <ul className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {subdomains.map((sub) => (
            <li
              key={sub.name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 font-mono text-sm"
              style={{ borderColor: "#e5e5e5", background: "#f7f7f8" }}
            >
              <span style={{ color: "#0d0d0d" }}>{sub.name}</span>
              <div className="flex flex-wrap items-center gap-2">
                {sub.technologies?.map((t) => (
                  <span
                    key={t}
                    className="rounded px-2 py-0.5 text-xs"
                    style={{ background: "#e5e5e5", color: "#0d0d0d" }}
                  >
                    {t}
                  </span>
                ))}
                {sub.ips.length > 0 && (
                  <span style={{ color: "#6e6e80" }}>
                    {sub.ips.slice(0, 2).join(", ")}
                    {sub.ips.length > 2 && "…"}
                  </span>
                )}
                {!sub.certValid && sub.hasCert && (
                  <span className="rounded px-1.5 py-0.5 text-xs" style={{ background: "rgba(185, 28, 28, 0.15)", color: "#b91c1c" }}>
                    Expired
                  </span>
                )}
                {(sub.name.startsWith("dev") ||
                  sub.name.startsWith("staging")) && (
                  <span className="rounded px-1.5 py-0.5 text-xs" style={{ background: "rgba(146, 64, 14, 0.15)", color: "#92400e" }}>
                    Dev
                  </span>
                )}
                {sub.securityHeaders && (
                  <span className="rounded px-1.5 py-0.5 text-xs" style={{ background: "#e5e5e5", color: "#6e6e80" }}>
                    {sub.securityHeaders.score}%
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* CVE Lookup - collapsible at bottom */}
      <details className="rounded-xl border border-gray-200 overflow-hidden" style={{ borderColor: "#e5e5e5", background: "#ffffff" }}>
        <summary className="cursor-pointer p-4 font-medium hover:bg-gray-100" style={{ color: "#0d0d0d" }}>
          CVE Lookup (by detected technologies)
        </summary>
        <div className="border-t px-4 pb-4 pt-2" style={{ borderColor: "#e5e5e5" }}>
          <CVETab technologies={technologies} />
        </div>
      </details>
    </div>
  );
}
