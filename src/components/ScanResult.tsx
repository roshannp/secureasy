"use client";

import type { ScanResultData } from "@/app/page";

interface ScanResultProps {
  data: ScanResultData;
}

export function ScanResult({ data }: ScanResultProps) {
  const { domain, subdomains, dns, scanTime } = data;
  const riskCount = subdomains.filter(
    (s) => !s.certValid || s.name.startsWith("dev") || s.name.startsWith("staging")
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Scan Summary</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-400">Subdomains found</p>
            <p className="text-2xl font-bold text-emerald-400">
              {subdomains.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Potential risks</p>
            <p
              className={`text-2xl font-bold ${
                riskCount > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {riskCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Scan time</p>
            <p className="text-2xl font-bold text-gray-300">
              {(scanTime / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      </div>

      {/* DNS for root domain */}
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
              <span className="text-gray-300 truncate block max-w-full">
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

      {/* Subdomains */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">
          Discovered Subdomains ({subdomains.length})
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          From Certificate Transparency logs
        </p>
        <ul className="mt-4 space-y-2 max-h-80 overflow-y-auto">
          {subdomains.map((sub) => (
            <li
              key={sub.name}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-700/30 bg-gray-800/30 px-4 py-2 font-mono text-sm"
            >
              <span className="text-emerald-300">{sub.name}</span>
              <div className="flex items-center gap-2">
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
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
