"use client";

import { useState, useEffect, useRef } from "react";
import { ScanResult } from "@/components/ScanResult";

const RESULT_SECTION_ID = "scan-results";
import { getScanHistory } from "@/lib/scanHistory";
import { getApiBase } from "@/lib/api";
import type { StoredScan } from "@/lib/scanHistory";
import type { ScanResultData } from "@/types";

export function HomeClient() {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredScan[]>([]);
  const scanStartRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHistory(getScanHistory());
  }, [result]);

  useEffect(() => {
    if (isScanning) {
      setScanProgress(0);
      scanStartRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - scanStartRef.current) / 1000;
        // Slow curve: ~95% at 30s, never quite reaches 100
        const p = 95 * (1 - Math.exp(-elapsed / 12));
        setScanProgress(Math.min(95, p));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setScanProgress(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isScanning]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setIsScanning(true);
    setError(null);
    setResult(null);
    try {
      const cleaned = domain.trim().replace(/^https?:\/\//, "").split("/")[0];
      const apiBase = getApiBase();
      const url = apiBase
        ? `${apiBase}/api/scan?domain=${encodeURIComponent(cleaned)}`
        : `/api/scan?domain=${encodeURIComponent(cleaned)}`;
      const res = await fetch(url);
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response from server");
      }
      if (!res.ok) throw new Error((data as { error?: string })?.error || "Scan failed");
      setResult(data as ScanResultData);
      // Scroll to results when they appear
      setTimeout(() => {
        document.getElementById(RESULT_SECTION_ID)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      console.error("Scan error:", err);
    } finally {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setScanProgress(100);
      setTimeout(() => setIsScanning(false), 250);
    }
  };

  return (
    <>
      <form onSubmit={handleScan} style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
              border: "1px solid #e5e5e5",
              background: "#ffffff",
              color: "#0d0d0d",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            disabled={isScanning}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              background: "#000000",
              color: "#ffffff",
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
            marginBottom: "1.5rem",
            padding: "1rem",
            background: "#f7f7f8",
            borderRadius: "12px",
            border: "1px solid #e5e5e5",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "#0d0d0d" }}>
              {Math.round(scanProgress)}%
            </span>
            <span style={{ fontSize: "0.8rem", color: "#6e6e80" }}>
              Scanning...
            </span>
          </div>
          <div
            style={{
              height: "12px",
              background: "#e5e5e5",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${scanProgress}%`,
                background: "#0d0d0d",
                borderRadius: "6px",
                transition: "width 0.15s ease-out",
              }}
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#6e6e80", margin: "0.5rem 0 0 0" }}>
            Discovering subdomains → checking DNS → security headers...
          </p>
          <p style={{ fontSize: "0.7rem", color: "#6e6e80", margin: "0.25rem 0 0 0", opacity: 0.8 }}>
            Large domains may take 30+ seconds. If nothing appears, check the browser console for errors.
          </p>
        </div>
      )}

      {history.length > 0 && !result && !isScanning && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#6e6e80", marginBottom: "0.5rem" }}>
            Recent scans
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {history.slice(0, 5).map((h) => (
              <button
                key={`${h.domain}-${h.scannedAt}`}
                onClick={() => setDomain(h.domain)}
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid #e5e5e5",
                  background: "#f7f7f8",
                  color: "#0d0d0d",
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
            border: "1px solid #b91c1c",
            background: "rgba(185, 28, 28, 0.08)",
            color: "#b91c1c",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div id={RESULT_SECTION_ID} style={{ marginTop: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#0d0d0d",
              marginBottom: "1rem",
            }}
          >
            Results for {result.domain}
          </h2>
          <ScanResult data={result} />
        </div>
      )}
    </>
  );
}
