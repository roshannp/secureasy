import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
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
}

interface DnsInfo {
  a: string[];
  aaaa: string[];
  mx: string[];
  txt: string[];
  cname: string[];
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
      const addrs = await dns.resolve4(host);
      return addrs;
    }
    if (recordType === "AAAA") {
      const addrs = await dns.resolve6(host);
      return addrs;
    }
    if (recordType === "MX") {
      const mx = await dns.resolveMx(host);
      return mx.map((m) => `${m.exchange} (${m.priority})`);
    }
    if (recordType === "TXT") {
      const txt = await dns.resolveTxt(host);
      return txt.flat();
    }
    if (recordType === "CNAME") {
      const cname = await dns.resolveCname(host);
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

  // Basic validation
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.?$/i;
  const cleaned = domain.toLowerCase().trim();
  if (!domainRegex.test(cleaned)) {
    return NextResponse.json(
      { error: "Invalid domain format" },
      { status: 400 }
    );
  }

  const rootDomain = cleaned.startsWith("www.") ? cleaned.slice(4) : cleaned;

  try {
    // 1. Get subdomains from crt.sh
    const subdomainNames = await getSubdomainsFromCrt(rootDomain);

    // 2. DNS for root domain
    const [a, aaaa, mx, txt, cname] = await Promise.all([
      resolveDns(rootDomain, "A"),
      resolveDns(rootDomain, "AAAA"),
      resolveDns(rootDomain, "MX"),
      resolveDns(rootDomain, "TXT"),
      resolveDns(rootDomain, "CNAME"),
    ]);

    const dns: DnsInfo = { a, aaaa, mx, txt, cname };

    // 3. Enrich subdomains (limit to 20 to avoid timeout)
    const toEnrich = subdomainNames.slice(0, 20);
    const subdomains: SubdomainInfo[] = await Promise.all(
      toEnrich.map(async (name) => {
        const [ips, certInfo] = await Promise.all([
          Promise.all([
            dns.resolve4(name).catch(() => [] as string[]),
            dns.resolve6(name).catch(() => [] as string[]),
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

    // Add any subdomains beyond 20 with minimal info
    for (let i = 20; i < subdomainNames.length; i++) {
      subdomains.push({
        name: subdomainNames[i],
        ips: [],
        hasCert: false,
        certValid: false,
      });
    }

    const scanTime = Date.now() - start;

    return NextResponse.json({
      domain: rootDomain,
      subdomains,
      dns,
      scanTime,
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
