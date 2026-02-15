import { NextRequest, NextResponse } from "next/server";
import { promises as dnsPromises } from "dns";
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

    if (hsts) {
      result.hsts = { present: true, value: hsts.slice(0, 80) };
      result.score += 25;
    }
    if (csp) {
      result.csp = { present: true, value: csp.slice(0, 80) };
      result.score += 20;
    }
    if (xfo) {
      result.xFrameOptions = { present: true, value: xfo };
      result.score += 15;
    }
    if (xcto) {
      result.xContentTypeOptions = { present: true, value: xcto };
      result.score += 15;
    }
    if (rp) {
      result.referrerPolicy = { present: true, value: rp };
      result.score += 12;
    }
    if (pp) {
      result.permissionsPolicy = { present: true, value: pp.slice(0, 80) };
      result.score += 13;
    }
  return result;
}

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

  return [...new Set(tech)].filter(Boolean).slice(0, 8);
}

async function getSubdomainsFromCrt(domain: string): Promise<string[]> {
  const url = `https://crt.sh/?q=%.${domain}&output=json`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as CrtShEntry[];
  const names = new Set<string>();

  for (const entry of data) {
    const parts = entry.name_value.split("\n");
    for (const part of parts) {
      const cleaned = part.trim().toLowerCase();
      if (cleaned && (cleaned === domain || cleaned.endsWith(`.${domain}`))) {
        names.add(cleaned);
      }
    }
  }

  return Array.from(names).sort();
}

async function resolveDns(
  host: string,
  recordType: "A" | "AAAA" | "MX" | "TXT" | "CNAME"
): Promise<string[]> {
  try {
    if (recordType === "A") {
      const addrs = await dnsPromises.resolve4(host);
      return addrs;
    }
    if (recordType === "AAAA") {
      const addrs = await dnsPromises.resolve6(host);
      return addrs;
    }
    if (recordType === "MX") {
      const mx = await dnsPromises.resolveMx(host);
      return mx.map((m) => `${m.exchange} (${m.priority})`);
    }
    if (recordType === "TXT") {
      const txt = await dnsPromises.resolveTxt(host);
      return txt.flat();
    }
    if (recordType === "CNAME") {
      const cname = await dnsPromises.resolveCname(host);
      return cname;
    }
  } catch {
    // ignore
  }
  return [];
}

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
          const validTo = cert.valid_to;
          const expiry = new Date(validTo);
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
    socket.on("error", () => {
      resolve({ hasCert: false, valid: false });
    });
    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve({ hasCert: false, valid: false });
    });
  });
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  const domain = request.nextUrl.searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Missing domain parameter" },
      { status: 400 }
    );
  }

  const domainRegex =
    /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.?$/i;
  const cleaned = domain.toLowerCase().trim();
  if (!domainRegex.test(cleaned)) {
    return NextResponse.json(
      { error: "Invalid domain format" },
      { status: 400 }
    );
  }

  const rootDomain = cleaned.startsWith("www.") ? cleaned.slice(4) : cleaned;

  try {
    const [subdomainNames, a, aaaa, mx, txt, cname] = await Promise.all([
      getSubdomainsFromCrt(rootDomain),
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
        headers: {
          "User-Agent":
            "AmISecure-Scanner/1.0 (Security audit)",
        },
        signal: AbortSignal.timeout(8000),
      });
      rootSecurityHeaders = parseSecurityHeaders(rootRes.headers);
    } catch {
      // ignore
    }

    const FULL_ENRICH = 15; // DNS + cert + HTTP headers + tech
    const BASIC_ENRICH = 30; // DNS + cert only (no HTTP)

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
            headers: {
              "User-Agent":
                "AmISecure-Scanner/1.0 (Security audit)",
            },
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

    return NextResponse.json({
      domain: rootDomain,
      subdomains,
      dns,
      scanTime,
      scannedAt: new Date().toISOString(),
      rootSecurityHeaders,
    });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Scan failed. Try again.",
      },
      { status: 500 }
    );
  }
}
