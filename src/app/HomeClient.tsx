"use client";

import { useState, useEffect, useRef } from "react";
import { ScanResult } from "@/components/ScanResult";
import { getScanHistory } from "@/lib/scanHistory";
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
      const res = await fetch(`/api/scan?domain=${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              height: "8px",
              background: "#1f2937",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${scanProgress}%`,
                background: "linear-gradient(90deg, #059669, #10b981)",
                borderRadius: "4px",
                transition: "width 0.15s ease-out",
              }}
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
            {Math.round(scanProgress)}% — discovering subdomains, checking DNS & security headers...
          </p>
        </div>
      )}

      {history.length > 0 && !result && !isScanning && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
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
    </>
  );
}
