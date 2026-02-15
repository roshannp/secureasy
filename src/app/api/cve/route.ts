import { NextRequest, NextResponse } from "next/server";

const NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";

interface NvdCve {
  id: string;
  descriptions: Array<{ value: string; lang: string }>;
  metrics?: {
    cvssMetricV31?: Array<{
      cvssData: { baseScore: number; severity: string };
    }>;
    cvssMetricV30?: Array<{
      cvssData: { baseScore: number; severity: string };
    }>;
    cvssMetricV2?: Array<{
      cvssData: { baseScore: number };
    }>;
  };
  published: string;
}

const TECH_TO_SEARCH: Record<string, string> = {
  apache: "apache http server",
  nginx: "nginx",
  cloudflare: "cloudflare",
  vercel: "vercel",
  netlify: "netlify",
  "asp.net": "asp.net",
  "github pages": "github",
  node: "node.js",
  express: "express",
  php: "php",
  iis: "iis microsoft",
};

export async function GET(request: NextRequest) {
  const techParam = request.nextUrl.searchParams.get("tech");
  if (!techParam) {
    return NextResponse.json(
      { error: "Missing tech parameter (comma-separated)" },
      { status: 400 }
    );
  }

  const technologies = techParam
    .toLowerCase()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  const results: Array<{
    technology: string;
    cves: Array<{
      id: string;
      description: string;
      severity: string;
      score: number;
      published: string;
      url: string;
    }>;
  }> = [];

  for (const tech of technologies) {
    const searchTerm = TECH_TO_SEARCH[tech] || tech;
    try {
      const res = await fetch(
        `${NVD_BASE}?keywordSearch=${encodeURIComponent(searchTerm)}&resultsPerPage=5`
      );
      if (!res.ok) continue;

      const data = (await res.json()) as { vulnerabilities?: Array<{ cve: NvdCve }> };
      const vulns = data.vulnerabilities || [];

      const cves = vulns.slice(0, 5).map(({ cve }) => {
        const desc = cve.descriptions?.find((d) => d.lang === "en")?.value || "No description";
        let severity = "UNKNOWN";
        let score = 0;
        if (cve.metrics?.cvssMetricV31?.[0]) {
          severity = cve.metrics.cvssMetricV31[0].cvssData.severity;
          score = cve.metrics.cvssMetricV31[0].cvssData.baseScore;
        } else if (cve.metrics?.cvssMetricV30?.[0]) {
          severity = cve.metrics.cvssMetricV30[0].cvssData.severity;
          score = cve.metrics.cvssMetricV30[0].cvssData.baseScore;
        } else if (cve.metrics?.cvssMetricV2?.[0]) {
          score = cve.metrics.cvssMetricV2[0].cvssData.baseScore;
          severity = score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW";
        }
        return {
          id: cve.id,
          description: desc.slice(0, 200) + (desc.length > 200 ? "…" : ""),
          severity,
          score,
          published: cve.published?.slice(0, 10) || "",
          url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
        };
      });

      results.push({ technology: tech, cves });

      await new Promise((r) => setTimeout(r, 1200));
    } catch {
      results.push({ technology: tech, cves: [] });
    }
  }

  return NextResponse.json({ results });
}
