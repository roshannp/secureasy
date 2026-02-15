"use client";

import { useState, useEffect } from "react";
import { getApiBase } from "@/lib/api";

interface CveEntry {
  id: string;
  description: string;
  severity: string;
  score: number;
  published: string;
  url: string;
}

interface CveResult {
  technology: string;
  cves: CveEntry[];
}

interface CVETabProps {
  technologies: string[];
}

export function CVETab({ technologies }: CVETabProps) {
  const [results, setResults] = useState<CveResult[]>([]);
  const [loading, setLoading] = useState(true);

  const uniqueTech = [...new Set(technologies)].filter(Boolean).slice(0, 6);
  const techKey = uniqueTech.join(",");

  useEffect(() => {
    if (techKey === "") {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(
        (() => {
          const base = getApiBase();
          return base
            ? `${base}/api/cve?tech=${encodeURIComponent(techKey)}`
            : `/api/cve?tech=${encodeURIComponent(techKey)}`;
        })()
      )
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || []);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [techKey]);

  if (uniqueTech.length === 0) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#6e6e80",
        }}
      >
        <p>No technologies detected. Run a scan to discover tech stack.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#6e6e80",
        }}
      >
        <p>Looking up CVEs for detected technologies…</p>
        <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {uniqueTech.join(", ")}
        </p>
      </div>
    );
  }

  const hasAnyCves = results.some((r) => r.cves.length > 0);

  if (!hasAnyCves) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#6e6e80",
        }}
      >
        <p>No recent CVEs found for detected technologies.</p>
        <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
          Searched: {uniqueTech.join(", ")}
        </p>
      </div>
    );
  }

  const severityColor = (s: string) =>
    s === "CRITICAL"
      ? "#b91c1c"
      : s === "HIGH"
        ? "#92400e"
        : s === "MEDIUM"
          ? "#854d0e"
          : "#4b5563";

  return (
    <div style={{ padding: "0.5rem 0" }}>
      {results.map(
        (r) =>
          r.cves.length > 0 && (
            <div
              key={r.technology}
              style={{
                marginBottom: "1.5rem",
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "0.5rem 1rem",
                  background: "#f7f7f8",
                  fontWeight: 600,
                  color: "#0d0d0d",
                }}
              >
                {r.technology}
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {r.cves.map((cve) => (
                  <li
                    key={cve.id}
                    style={{
                      padding: "1rem",
                      borderTop: "1px solid #e5e5e5",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <a
                        href={cve.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#0d0d0d",
                          fontWeight: 600,
                          textDecoration: "underline",
                        }}
                      >
                        {cve.id}
                      </a>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          background: severityColor(cve.severity) + "30",
                          color: severityColor(cve.severity),
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}
                      >
                        {cve.severity} {cve.score > 0 && `(${cve.score})`}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#6e6e80",
                        marginTop: "0.5rem",
                        lineHeight: 1.4,
                      }}
                    >
                      {cve.description}
                    </p>
                    {cve.published && (
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#6e6e80",
                          marginTop: "0.25rem",
                        }}
                      >
                        Published: {cve.published}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
      )}
    </div>
  );
}
