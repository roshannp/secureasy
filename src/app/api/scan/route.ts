import { NextRequest, NextResponse } from "next/server";
import { promises as dnsPromises } from "dns";
import { corsHeaders } from "@/lib/cors";

export const maxDuration = 60;
import tls from "tls";

interface CrtShEntry {
  name_value: string;
}

interface SubdomainInfo {
  name: string;
  ips: string[];
  hasCert: boolean;
  certExpiry?: string;
  certValid: boolean;
  securityHeaders?: SecurityHeadersResult;
  technologies?: string[];
}

interface DnsInfo {
  a: string[];
  aaaa: string[];
  mx: string[];
  txt: string[];
  cname: string[];
}

interface SecurityHeadersResult {
  hsts: { present: boolean; value?: string };
  csp: { present: boolean; value?: string };
  xFrameOptions: { present: boolean; value?: string };
  xContentTypeOptions: { present: boolean; value?: string };
  referrerPolicy: { present: boolean; value?: string };
  permissionsPolicy: { present: boolean; value?: string };
  score: number;
}

// ─── In-memory cache (survives across requests on same Vercel instance) ───
const subdomainCache = new Map<string, { data: string[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(domain: string): string[] | null {
  const entry = subdomainCache.get(domain);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    console.log(`Cache hit for ${domain}: ${entry.data.length} subdomains`);
    return entry.data;
  }
  return null;
}

function setCache(domain: string, data: string[]) {
  subdomainCache.set(domain, { data, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (subdomainCache.size > 100) {
    const oldest = [...subdomainCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) subdomainCache.delete(oldest[0]);
  }
}

// ─── Security header parsing ───
function parseSecurityHeaders(headers: Headers): SecurityHeadersResult {
  const result: SecurityHeadersResult = {
    hsts: { present: false },
    csp: { present: false },
    xFrameOptions: { present: false },
    xContentTypeOptions: { present: false },
    referrerPolicy: { present: false },
    permissionsPolicy: { present: false },
    score: 0,
  };
  const hsts = headers.get("strict-transport-security");
  const csp = headers.get("content-security-policy");
  const xfo = headers.get("x-frame-options");
  const xcto = headers.get("x-content-type-options");
  const rp = headers.get("referrer-policy");
  const pp = headers.get("permissions-policy");

  if (hsts) { result.hsts = { present: true, value: hsts.slice(0, 80) }; result.score += 25; }
  if (csp) { result.csp = { present: true, value: csp.slice(0, 80) }; result.score += 20; }
  if (xfo) { result.xFrameOptions = { present: true, value: xfo }; result.score += 15; }
  if (xcto) { result.xContentTypeOptions = { present: true, value: xcto }; result.score += 15; }
  if (rp) { result.referrerPolicy = { present: true, value: rp }; result.score += 12; }
  if (pp) { result.permissionsPolicy = { present: true, value: pp.slice(0, 80) }; result.score += 13; }
  return result;
}

// ─── Technology detection ───
function detectTechnologies(headers: Headers): string[] {
  const tech: string[] = [];
  const server = headers.get("server");
  const poweredBy = headers.get("x-powered-by");
  const aspNet = headers.get("x-aspnet-version");
  const cfRay = headers.get("cf-ray");
  const xVercel = headers.get("x-vercel-id");
  const xNetlify = headers.get("x-nf-request-id");
  const xAmz = headers.get("x-amz-cf-id");
  const ghPages = headers.get("x-github-request-id");

  if (server) tech.push(server.split("/")[0]);
  if (poweredBy) tech.push(...poweredBy.split("/")[0].split(" "));
  if (aspNet) tech.push("ASP.NET");
  if (cfRay) tech.push("Cloudflare");
  if (xVercel) tech.push("Vercel");
  if (xNetlify) tech.push("Netlify");
  if (xAmz) tech.push("AWS CloudFront");
  if (ghPages) tech.push("GitHub Pages");

  const seen = new Map<string, string>();
  for (const t of tech) {
    if (t && !seen.has(t.toLowerCase())) {
      seen.set(t.toLowerCase(), t);
    }
  }
  return [...seen.values()].slice(0, 8);
}

// ─── Subdomain discovery: crt.sh (primary) ───
function extractSubdomains(data: CrtShEntry[], domain: string): Set<string> {
  const names = new Set<string>();
  for (const entry of data) {
    for (const part of entry.name_value.split("\n")) {
      const cleaned = part.trim().toLowerCase();
      if (cleaned && (cleaned === domain || cleaned.endsWith(`.${domain}`))) {
        names.add(cleaned);
      }
    }
  }
  return names;
}

async function fetchFromCrtSh(domain: string): Promise<string[]> {
  const url = `https://crt.sh/?q=%.${domain}&output=json`;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        console.log(`crt.sh retry ${attempt} for ${domain}`);
      }

      const res = await fetch(url, {
        signal: AbortSignal.timeout(40000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AmISecure/1.0; +https://github.com/roshannp/amisecure)",
          "Accept": "application/json",
        },
      });
      if (!res.ok) throw new Error(`crt.sh HTTP ${res.status}`);

      const data = (await res.json()) as CrtShEntry[];
      const names = extractSubdomains(data, domain);

      if (names.size > 0) {
        console.log(`crt.sh returned ${names.size} subdomains for ${domain}`);
        return Array.from(names).sort();
      }

      throw new Error("crt.sh returned 0 results");
    } catch (err) {
      console.error(`crt.sh attempt ${attempt} failed:`, err);
      if (attempt === maxRetries) break;
    }
  }
  return [];
}

// ─── Subdomain discovery: CertSpotter (fallback) ───
interface CertSpotterEntry {
  dns_names: string[];
}

async function fetchFromCertSpotter(domain: string): Promise<string[]> {
  try {
    const url = `https://api.certspotter.com/v1/issuances?domain=${domain}&include_subdomains=true&expand=dns_names`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AmISecure/1.0)",
        "Accept": "application/json",
      },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as CertSpotterEntry[];
    const names = new Set<string>();
    for (const entry of data) {
      for (const name of entry.dns_names || []) {
        const cleaned = name.trim().toLowerCase();
        if (cleaned && (cleaned === domain || cleaned.endsWith(`.${domain}`))) {
          names.add(cleaned);
        }
      }
    }
    console.log(`CertSpotter returned ${names.size} subdomains for ${domain}`);
    return Array.from(names);
  } catch (err) {
    console.error("CertSpotter failed:", err);
    return [];
  }
}

// ─── Subdomain discovery: HackerTarget (second fallback) ───
async function fetchFromHackerTarget(domain: string): Promise<string[]> {
  try {
    const url = `https://api.hackertarget.com/hostsearch/?q=${domain}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AmISecure/1.0)" },
    });
    if (!res.ok) return [];

    const text = await res.text();
    if (text.startsWith("error") || text.includes("API count exceeded")) return [];

    const names = new Set<string>();
    for (const line of text.split("\n")) {
      const host = line.split(",")[0]?.trim().toLowerCase();
      if (host && (host === domain || host.endsWith(`.${domain}`))) {
        names.add(host);
      }
    }
    console.log(`HackerTarget returned ${names.size} subdomains for ${domain}`);
    return Array.from(names);
  } catch (err) {
    console.error("HackerTarget failed:", err);
    return [];
  }
}

// ─── Combined subdomain discovery with cache ───
async function discoverSubdomains(domain: string): Promise<string[]> {
  const cached = getCached(domain);
  if (cached) return cached;

  // Query all sources in parallel
  const [crtResults, certspotterResults, hackerTargetResults] = await Promise.all([
    fetchFromCrtSh(domain),
    fetchFromCertSpotter(domain),
    fetchFromHackerTarget(domain),
  ]);

  // Merge and deduplicate
  const merged = new Set<string>([...crtResults, ...certspotterResults, ...hackerTargetResults]);
  const results = Array.from(merged).sort();

  console.log(
    `Subdomain totals for ${domain}: crt.sh=${crtResults.length}, certspotter=${certspotterResults.length}, hackertarget=${hackerTargetResults.length}, merged=${results.length}`
  );

  // Only cache if we got results
  if (results.length > 0) {
    setCache(domain, results);
  }

  return results;
}

// ─── DNS resolution ───
async function resolveDns(
  host: string,
  recordType: "A" | "AAAA" | "MX" | "TXT" | "CNAME"
): Promise<string[]> {
  try {
    if (recordType === "A") return await dnsPromises.resolve4(host);
    if (recordType === "AAAA") return await dnsPromises.resolve6(host);
    if (recordType === "MX") {
      const mx = await dnsPromises.resolveMx(host);
      return mx.map((m) => `${m.exchange} (${m.priority})`);
    }
    if (recordType === "TXT") {
      const txt = await dnsPromises.resolveTxt(host);
      return txt.flat();
    }
    if (recordType === "CNAME") return await dnsPromises.resolveCname(host);
  } catch {
    // ignore
  }
  return [];
}

// ─── TLS certificate check ───
async function getCertInfo(host: string): Promise<{
  hasCert: boolean;
  expiry?: string;
  valid: boolean;
}> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host, port: 443, servername: host, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate(false);
        socket.end();
        if (cert && Object.keys(cert).length > 0) {
          const expiry = new Date(cert.valid_to);
          resolve({
            hasCert: true,
            expiry: expiry.toISOString(),
            valid: expiry > new Date(),
          });
        } else {
          resolve({ hasCert: false, valid: false });
        }
      }
    );
    socket.on("error", () => resolve({ hasCert: false, valid: false }));
    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve({ hasCert: false, valid: false });
    });
  });
}

// ─── Main scan handler ───
export async function GET(request: NextRequest) {
  const start = Date.now();
  const domain = request.nextUrl.searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Missing domain parameter" },
      { status: 400, headers: corsHeaders }
    );
  }

  const domainRegex =
    /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.?$/i;
  const cleaned = domain.toLowerCase().trim();
  if (!domainRegex.test(cleaned)) {
    return NextResponse.json(
      { error: "Invalid domain format" },
      { status: 400, headers: corsHeaders }
    );
  }

  const rootDomain = cleaned.startsWith("www.") ? cleaned.slice(4) : cleaned;

  try {
    const [subdomainNames, a, aaaa, mx, txt, cname] = await Promise.all([
      discoverSubdomains(rootDomain),
      resolveDns(rootDomain, "A"),
      resolveDns(rootDomain, "AAAA"),
      resolveDns(rootDomain, "MX"),
      resolveDns(rootDomain, "TXT"),
      resolveDns(rootDomain, "CNAME"),
    ]);

    const dns: DnsInfo = { a, aaaa, mx, txt, cname };

    let rootSecurityHeaders: SecurityHeadersResult | undefined;
    try {
      const rootRes = await fetch(`https://${rootDomain}`, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": "AmISecure-Scanner/1.0 (Security audit)" },
        signal: AbortSignal.timeout(8000),
      });
      rootSecurityHeaders = parseSecurityHeaders(rootRes.headers);
    } catch {
      // ignore
    }

    const FULL_ENRICH = 15;
    const BASIC_ENRICH = 30;

    const enrichFull = subdomainNames.slice(0, FULL_ENRICH);
    const enrichBasic = subdomainNames.slice(FULL_ENRICH, BASIC_ENRICH);
    const rest = subdomainNames.slice(BASIC_ENRICH);

    const fullEnriched: SubdomainInfo[] = await Promise.all(
      enrichFull.map(async (name) => {
        const [ips, certInfo] = await Promise.all([
          Promise.all([
            dnsPromises.resolve4(name).catch(() => [] as string[]),
            dnsPromises.resolve6(name).catch(() => [] as string[]),
          ]).then(([v4, v6]) => [...v4, ...v6]),
          getCertInfo(name),
        ]);

        let securityHeaders: SecurityHeadersResult | undefined;
        let technologies: string[] | undefined;
        try {
          const res = await fetch(`https://${name}`, {
            method: "HEAD",
            redirect: "follow",
            headers: { "User-Agent": "AmISecure-Scanner/1.0 (Security audit)" },
            signal: AbortSignal.timeout(4000),
          });
          securityHeaders = parseSecurityHeaders(res.headers);
          technologies = detectTechnologies(res.headers);
        } catch {
          // skip
        }

        return {
          name,
          ips,
          hasCert: certInfo.hasCert,
          certExpiry: certInfo.expiry,
          certValid: certInfo.valid,
          securityHeaders,
          technologies,
        };
      })
    );

    const basicEnriched: SubdomainInfo[] = await Promise.all(
      enrichBasic.map(async (name) => {
        const [ips, certInfo] = await Promise.all([
          Promise.all([
            dnsPromises.resolve4(name).catch(() => [] as string[]),
            dnsPromises.resolve6(name).catch(() => [] as string[]),
          ]).then(([v4, v6]) => [...v4, ...v6]),
          getCertInfo(name),
        ]);
        return {
          name,
          ips,
          hasCert: certInfo.hasCert,
          certExpiry: certInfo.expiry,
          certValid: certInfo.valid,
        };
      })
    );

    const subdomains: SubdomainInfo[] = [
      ...fullEnriched,
      ...basicEnriched,
      ...rest.map((name) => ({
        name,
        ips: [] as string[],
        hasCert: false,
        certValid: false,
      })),
    ];

    const scanTime = Date.now() - start;

    return NextResponse.json(
      {
        domain: rootDomain,
        subdomains,
        dns,
        scanTime,
        scannedAt: new Date().toISOString(),
        rootSecurityHeaders,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Scan failed. Try again.",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
