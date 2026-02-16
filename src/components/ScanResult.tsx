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

const cardStyle: React.CSSProperties = {
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  padding: "1.5rem",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "0.9375rem",
  fontWeight: 600,
  color: "#111827",
  margin: 0,
};

const sectionDesc: React.CSSProperties = {
  fontSize: "0.8125rem",
  color: "#6b7280",
  marginTop: "0.25rem",
};

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

  const scoreColor = score >= 80 ? "#059669" : score >= 60 ? "#d97706" : "#dc2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* === Row 1: Score + Stats + Export === */}
      <div
        className="results-top-row"
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: "1.25rem",
          alignItems: "stretch",
        }}
      >
        {/* Score gauge */}
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: "180px" }}>
          <RiskGauge score={score} grade={grade} />
        </div>

        {/* Summary stats */}
        <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Subdomains</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: "0.25rem 0 0" }}>{subdomains.length}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Security Score</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: scoreColor, margin: "0.25rem 0 0" }}>{score}/100</p>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Issues</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: actions.length > 0 ? "#dc2626" : "#059669", margin: "0.25rem 0 0" }}>{actions.length}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Scan Time</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111827", margin: "0.25rem 0 0" }}>{(scanTime / 1000).toFixed(1)}s</p>
          </div>
        </div>

        {/* Export button */}
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", minWidth: "160px" }}>
          <button
            onClick={handleExport}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: "#111827",
              color: "#ffffff",
              fontSize: "0.8125rem",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              width: "100%",
              whiteSpace: "nowrap",
            }}
          >
            Download Report
          </button>
          <p style={{ fontSize: "0.6875rem", color: "#9ca3af", margin: 0, textAlign: "center" }}>
            HTML → Print → PDF
          </p>
        </div>
      </div>

      {/* === Change indicator === */}
      {diff && (diff.added.length > 0 || diff.removed.length > 0) && (
        <div style={{ ...cardStyle, borderColor: "#dbeafe", backgroundColor: "#eff6ff", padding: "1rem 1.5rem" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1e40af", margin: 0 }}>Changes since last scan</p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
            {diff.added.length > 0 && (
              <span style={{ fontSize: "0.8125rem", color: "#059669" }}>
                +{diff.added.length} new: {diff.added.slice(0, 3).join(", ")}{diff.added.length > 3 && " …"}
              </span>
            )}
            {diff.removed.length > 0 && (
              <span style={{ fontSize: "0.8125rem", color: "#dc2626" }}>
                −{diff.removed.length} removed: {diff.removed.slice(0, 3).join(", ")}{diff.removed.length > 3 && " …"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* === Action Items === */}
      <ActionItems actions={actions} />

      {/* === Security Headers === */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Security Headers</h2>
        <p style={sectionDesc}>HTTP security headers for main domain and key subdomains</p>
        <div
          style={{
            marginTop: "1rem",
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          }}
        >
          <SecurityHeadersCard host={domain} headers={rootSecurityHeaders} />
          {subdomains
            .filter((s) => s.securityHeaders)
            .slice(0, 5)
            .map((s) => (
              <SecurityHeadersCard
                key={s.name}
                host={s.name}
                headers={s.securityHeaders}
              />
            ))}
        </div>
      </div>

      {/* === DNS Records === */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>DNS Records</h2>
        <p style={sectionDesc}>{domain}</p>
        <div style={{ marginTop: "0.75rem", fontFamily: "monospace", fontSize: "0.8125rem" }}>
          {dns.a.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", padding: "0.375rem 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ color: "#6b7280", minWidth: "50px" }}>A</span>
              <span style={{ color: "#111827" }}>{dns.a.join(", ")}</span>
            </div>
          )}
          {dns.aaaa.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", padding: "0.375rem 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ color: "#6b7280", minWidth: "50px" }}>AAAA</span>
              <span style={{ color: "#111827", wordBreak: "break-all" }}>{dns.aaaa.join(", ")}</span>
            </div>
          )}
          {dns.mx.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", padding: "0.375rem 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ color: "#6b7280", minWidth: "50px" }}>MX</span>
              <span style={{ color: "#111827" }}>{dns.mx.join(", ")}</span>
            </div>
          )}
          {dns.txt.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", padding: "0.375rem 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ color: "#6b7280", minWidth: "50px" }}>TXT</span>
              <span style={{ color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {dns.txt.slice(0, 2).join(" | ")}
                {dns.txt.length > 2 && ` (+${dns.txt.length - 2} more)`}
              </span>
            </div>
          )}
          {dns.cname.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", padding: "0.375rem 0" }}>
              <span style={{ color: "#6b7280", minWidth: "50px" }}>CNAME</span>
              <span style={{ color: "#111827" }}>{dns.cname.join(", ")}</span>
            </div>
          )}
          {dns.a.length === 0 && dns.aaaa.length === 0 && dns.mx.length === 0 && dns.txt.length === 0 && dns.cname.length === 0 && (
            <p style={{ color: "#9ca3af", fontFamily: "inherit", fontSize: "0.8125rem" }}>No DNS records found</p>
          )}
        </div>
      </div>

      {/* === Discovered Subdomains (full width) === */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={sectionTitle}>Discovered Subdomains ({subdomains.length})</h2>
            <p style={sectionDesc}>From Certificate Transparency logs</p>
          </div>
          {subdomains.length > 0 && (
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              Showing all {subdomains.length} — scroll to browse
            </span>
          )}
        </div>
        {subdomains.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: "0.8125rem", marginTop: "0.75rem" }}>
            No subdomains discovered
          </p>
        ) : (
          <ul style={{ marginTop: "0.75rem", listStyle: "none", padding: 0, maxHeight: "600px", overflowY: "auto" }}>
            {subdomains.map((sub) => (
              <li
                key={sub.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  fontFamily: "monospace",
                  backgroundColor: "#f9fafb",
                  marginBottom: "0.375rem",
                  border: "1px solid #f3f4f6",
                }}
              >
                <span
                  style={{
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                    flex: 1,
                  }}
                  title={sub.name}
                >
                  {sub.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
                  {[...new Map((sub.technologies || []).map(t => [t.toLowerCase(), t])).values()].map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: "0.125rem 0.5rem",
                        borderRadius: "4px",
                        backgroundColor: "#e5e7eb",
                        color: "#374151",
                        fontSize: "0.6875rem",
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {!sub.certValid && sub.hasCert && (
                    <span style={{ padding: "0.125rem 0.375rem", borderRadius: "4px", backgroundColor: "#fef2f2", color: "#dc2626", fontSize: "0.6875rem", fontFamily: "system-ui, sans-serif", fontWeight: 500 }}>
                      Expired
                    </span>
                  )}
                  {(sub.name.startsWith("dev") || sub.name.startsWith("staging")) && (
                    <span style={{ padding: "0.125rem 0.375rem", borderRadius: "4px", backgroundColor: "#fffbeb", color: "#d97706", fontSize: "0.6875rem", fontFamily: "system-ui, sans-serif", fontWeight: 500 }}>
                      Dev
                    </span>
                  )}
                  {sub.securityHeaders && (
                    <span style={{ padding: "0.125rem 0.375rem", borderRadius: "4px", backgroundColor: "#f3f4f6", color: "#6b7280", fontSize: "0.6875rem", fontFamily: "system-ui, sans-serif" }}>
                      {sub.securityHeaders.score}%
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* === CVE Lookup === */}
      <details style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <summary
          style={{
            cursor: "pointer",
            padding: "1rem 1.5rem",
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: "#111827",
            listStyle: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          CVE Lookup (by detected technologies)
        </summary>
        <div style={{ borderTop: "1px solid #e5e7eb", padding: "1rem 1.5rem 1.5rem" }}>
          <CVETab technologies={technologies} />
        </div>
      </details>
    </div>
  );
}
