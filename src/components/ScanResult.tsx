"use client";

import type { ScanResultData } from "@/app/page";
import { calculateRiskScore } from "@/lib/riskScore";
import { saveScan, getPreviousScan, compareScans } from "@/lib/scanHistory";
import type { ScanDiff } from "@/lib/scanHistory";
import { generateHtmlReport } from "@/lib/exportReport";
import { RiskGauge } from "./RiskGauge";
import { ActionItems } from "./ActionItems";
import { SecurityHeadersCard } from "./SecurityHeadersCard";
import { useEffect, useState } from "react";

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
    a.download = `secureasy-report-${domain}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top bar: Score + Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Security Score</h2>
          <div className="mt-4">
            <RiskGauge score={score} grade={grade} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleExport}
            className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
          >
            Download Report (HTML)
          </button>
          <p className="text-xs text-gray-500">
            Open in browser, then Print → Save as PDF
          </p>
        </div>
      </div>

      {/* Change indicator */}
      {diff && (diff.added.length > 0 || diff.removed.length > 0) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="font-medium text-amber-400">Changes since last scan</h3>
          {diff.added.length > 0 && (
            <p className="mt-1 text-sm text-gray-300">
              <span className="text-emerald-400">+{diff.added.length} new</span>
              : {diff.added.slice(0, 5).join(", ")}
              {diff.added.length > 5 && " …"}
            </p>
          )}
          {diff.removed.length > 0 && (
            <p className="mt-1 text-sm text-gray-300">
              <span className="text-red-400">−{diff.removed.length} removed</span>
              : {diff.removed.slice(0, 5).join(", ")}
              {diff.removed.length > 5 && " …"}
            </p>
          )}
        </div>
      )}

      {/* Action Items */}
      <ActionItems actions={actions} />

      {/* Summary stats */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Scan Summary</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-gray-400">Subdomains</p>
            <p className="text-2xl font-bold text-emerald-400">
              {subdomains.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Risk score</p>
            <p
              className={`text-2xl font-bold ${
                score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"
              }`}
            >
              {score}/100
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Issues found</p>
            <p className="text-2xl font-bold text-gray-300">{actions.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Scan time</p>
            <p className="text-2xl font-bold text-gray-300">
              {(scanTime / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      </div>

      {/* Security Headers - Root domain */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Security Headers</h2>
        <p className="mt-1 text-sm text-gray-400">
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
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">
          DNS records for {domain}
        </h2>
        <div className="mt-4 space-y-2 font-mono text-sm">
          {dns.a.length > 0 && (
            <p>
              <span className="text-gray-500">A:</span>{" "}
              <span className="text-gray-300">{dns.a.join(", ")}</span>
            </p>
          )}
          {dns.aaaa.length > 0 && (
            <p>
              <span className="text-gray-500">AAAA:</span>{" "}
              <span className="text-gray-300">{dns.aaaa.join(", ")}</span>
            </p>
          )}
          {dns.mx.length > 0 && (
            <p>
              <span className="text-gray-500">MX:</span>{" "}
              <span className="text-gray-300">{dns.mx.join(", ")}</span>
            </p>
          )}
          {dns.txt.length > 0 && (
            <p>
              <span className="text-gray-500">TXT:</span>{" "}
              <span className="block max-w-full truncate text-gray-300">
                {dns.txt.slice(0, 2).join(" | ")}
                {dns.txt.length > 2 && ` (+${dns.txt.length - 2} more)`}
              </span>
            </p>
          )}
          {dns.cname.length > 0 && (
            <p>
              <span className="text-gray-500">CNAME:</span>{" "}
              <span className="text-gray-300">{dns.cname.join(", ")}</span>
            </p>
          )}
          {dns.a.length === 0 &&
            dns.aaaa.length === 0 &&
            dns.mx.length === 0 &&
            dns.txt.length === 0 &&
            dns.cname.length === 0 && (
              <p className="text-gray-500">No DNS records found</p>
            )}
        </div>
      </div>

      {/* Subdomains with tech badges */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">
          Discovered Subdomains ({subdomains.length})
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          From Certificate Transparency logs
        </p>
        <ul className="mt-4 space-y-2 max-h-96 overflow-y-auto">
          {subdomains.map((sub) => (
            <li
              key={sub.name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-700/30 bg-gray-800/30 px-4 py-3 font-mono text-sm"
            >
              <span className="text-emerald-300">{sub.name}</span>
              <div className="flex flex-wrap items-center gap-2">
                {sub.technologies?.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300"
                  >
                    {t}
                  </span>
                ))}
                {sub.ips.length > 0 && (
                  <span className="text-gray-500">
                    {sub.ips.slice(0, 2).join(", ")}
                    {sub.ips.length > 2 && "…"}
                  </span>
                )}
                {!sub.certValid && sub.hasCert && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                    Expired
                  </span>
                )}
                {(sub.name.startsWith("dev") ||
                  sub.name.startsWith("staging")) && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                    Dev
                  </span>
                )}
                {sub.securityHeaders && (
                  <span className="rounded bg-gray-600 px-1.5 py-0.5 text-xs text-gray-400">
                    {sub.securityHeaders.score}%
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
