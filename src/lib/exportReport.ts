import type { ScanResultData } from "@/types";
import type { ActionItem } from "./riskScore";

export function generateHtmlReport(
  data: ScanResultData,
  actions: ActionItem[],
  score: number,
  grade: string
): string {
  const date = new Date(data.scannedAt || Date.now()).toLocaleString();

  const subdomainsRows = data.subdomains
    .map(
      (s) => `
    <tr>
      <td>${escapeHtml(s.name)}</td>
      <td>${s.ips.slice(0, 3).join(", ") || "—"}</td>
      <td>${s.certValid ? "✓" : "✗"}</td>
      <td>${s.technologies?.slice(0, 3).join(", ") || "—"}</td>
      <td>${s.securityHeaders ? `${s.securityHeaders.score}/100` : "—"}</td>
    </tr>`
    )
    .join("");

  const actionsHtml =
    actions.length > 0
      ? actions
          .map(
            (a, i) => `
    <li><strong>#${i + 1} Priority (${a.severity.toUpperCase()})</strong> — ${escapeHtml(a.title)} — ${escapeHtml(a.fix)}</li>`
          )
          .join("")
      : "<li>No critical issues found.</li>";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AM I SECURE Report — ${escapeHtml(data.domain)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; background: #ffffff; color: #0d0d0d; }
    h1 { color: #0d0d0d; }
    h2 { color: #6e6e80; margin-top: 2rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #e5e5e5; padding: 0.5rem 1rem; text-align: left; }
    th { background: #f7f7f8; }
    .score { font-size: 2rem; font-weight: bold; color: #0d0d0d; }
    .grade { font-size: 1.5rem; color: #6e6e80; }
    ul { line-height: 1.6; }
    .meta { color: #6e6e80; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>AM I SECURE — Attack Surface Report</h1>
  <p class="meta">Generated ${date} | Domain: ${escapeHtml(data.domain)}</p>

  <h2>Security Score</h2>
  <p><span class="score">${score}/100</span> <span class="grade">(Grade ${grade})</span></p>

  <h2>Summary</h2>
  <ul>
    <li>Subdomains found: ${data.subdomains.length}</li>
    <li>Scan duration: ${(data.scanTime / 1000).toFixed(1)}s</li>
  </ul>

  <h2>Recommended Actions</h2>
  <ul>${actionsHtml}</ul>

  <h2>DNS Records (${data.domain})</h2>
  <ul>
    ${data.dns.a.length ? `<li>A: ${data.dns.a.join(", ")}</li>` : ""}
    ${data.dns.mx.length ? `<li>MX: ${data.dns.mx.slice(0, 3).join(", ")}</li>` : ""}
  </ul>

  <h2>Subdomains</h2>
  <table>
    <thead><tr><th>Subdomain</th><th>IPs</th><th>Valid Cert</th><th>Technologies</th><th>Header Score</th></tr></thead>
    <tbody>${subdomainsRows}</tbody>
  </table>

  <p class="meta" style="margin-top: 3rem;">Report by AM I SECURE</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
