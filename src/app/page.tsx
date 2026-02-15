"use client";

import { useState } from "react";
import { ScanResult } from "@/components/ScanResult";

export default function Home() {
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Secureasy
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Attack surface visibility for small businesses
          </p>
        </header>

        {/* Search */}
        <form onSubmit={handleScan} className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g. example.com)"
              className="flex-1 rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={isScanning}
            />
            <button
              type="submit"
              disabled={isScanning}
              className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? "Scanning..." : "Scan"}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && <ScanResult data={result} />}
      </div>
    </main>
  );
}

export interface ScanResultData {
  domain: string;
  subdomains: SubdomainInfo[];
  dns: DnsInfo;
  scanTime: number;
}

export interface SubdomainInfo {
  name: string;
  ips: string[];
  hasCert: boolean;
  certExpiry?: string;
  certValid: boolean;
}

export interface DnsInfo {
  a: string[];
  aaaa: string[];
  mx: string[];
  txt: string[];
  cname: string[];
}
