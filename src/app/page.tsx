"use client";

import { useState, useEffect } from "react";
import { ScanResult } from "@/components/ScanResult";
import { getScanHistory } from "@/lib/scanHistory";
import type { StoredScan } from "@/lib/scanHistory";

export default function Home() {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredScan[]>([]);

  useEffect(() => {
    setHistory(getScanHistory());
  }, [result]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const cleaned = domain.trim().replace(/^https?:\/\//, "").split("/")[0];
      const res = await fetch(
        `/api/scan?domain=${encodeURIComponent(cleaned)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Scan failed");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsScanning(false);
    }
  };

  const handleHistoryClick = (d: string) => {
    setDomain(d);
    setError(null);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "3rem 1rem",
        maxWidth: "896px",
        margin: "0 auto",
      }}
    >
      {/* Header - inline styles for guaranteed visibility */}
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 700,
            color: "#ffffff",
            margin: 0,
          }}
        >
          Secureasy
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: "1.125rem", color: "#9ca3af" }}>
          Attack surface visibility for small businesses
        </p>
      </header>

      {/* Search form */}
      <form onSubmit={handleScan} style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter domain (e.g. example.com)"
            disabled={isScanning}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #4b5563",
              background: "rgba(17, 24, 39, 0.5)",
              color: "#ffffff",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            disabled={isScanning}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              background: "#059669",
              color: "white",
              fontWeight: 500,
              border: "none",
              cursor: isScanning ? "not-allowed" : "pointer",
              opacity: isScanning ? 0.6 : 1,
            }}
          >
            {isScanning ? "Scanning..." : "Scan"}
          </button>
        </div>
      </form>

      {isScanning && (
        <div
          style={{
            height: "4px",
            background: "rgba(5, 150, 105, 0.5)",
            borderRadius: "4px",
            marginBottom: "1.5rem",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      )}

      {history.length > 0 && !result && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
            Recent scans
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {history.slice(0, 5).map((h) => (
              <button
                key={`${h.domain}-${h.scannedAt}`}
                onClick={() => handleHistoryClick(h.domain)}
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #4b5563",
                  background: "rgba(31, 41, 55, 0.5)",
                  color: "#d1d5db",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {h.domain}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#f87171",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {result && <ScanResult data={result} />}
    </main>
  );
}

export interface SecurityHeadersResult {
  hsts: { present: boolean; value?: string };
  csp: { present: boolean; value?: string };
  xFrameOptions: { present: boolean; value?: string };
  xContentTypeOptions: { present: boolean; value?: string };
  referrerPolicy: { present: boolean; value?: string };
  permissionsPolicy: { present: boolean; value?: string };
  score: number;
}

export interface ScanResultData {
  domain: string;
  subdomains: SubdomainInfo[];
  dns: DnsInfo;
  scanTime: number;
  scannedAt?: string;
  rootSecurityHeaders?: SecurityHeadersResult;
}

export interface SubdomainInfo {
  name: string;
  ips: string[];
  hasCert: boolean;
  certExpiry?: string;
  certValid: boolean;
  securityHeaders?: SecurityHeadersResult;
  technologies?: string[];
}

export interface DnsInfo {
  a: string[];
  aaaa: string[];
  mx: string[];
  txt: string[];
  cname: string[];
}
