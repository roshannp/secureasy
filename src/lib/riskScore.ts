export interface SecurityHeadersResult {
  hsts: { present: boolean; value?: string };
  csp: { present: boolean; value?: string };
  xFrameOptions: { present: boolean; value?: string };
  xContentTypeOptions: { present: boolean; value?: string };
  referrerPolicy: { present: boolean; value?: string };
  permissionsPolicy: { present: boolean; value?: string };
  score: number;
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

export interface ActionItem {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  fix: string;
  count?: number;
  priorityScore: number; // 1-100, higher = fix first
}

export function calculateRiskScore(
  subdomains: SubdomainInfo[],
  rootHeaders?: SecurityHeadersResult
): { score: number; grade: string; actions: ActionItem[] } {
  const list = Array.isArray(subdomains) ? subdomains : [];
  let score = 100;
  const actions: ActionItem[] = [];

  const expiredCerts = list.filter((s) => s.hasCert && !s.certValid);
  const devExposed = list.filter(
    (s) =>
      s.name.startsWith("dev") ||
      s.name.startsWith("staging") ||
      s.name.startsWith("test")
  );
  const noHsts = list.filter(
    (s) => s.securityHeaders && !s.securityHeaders.hsts.present
  );
  const noCsp = list.filter(
    (s) => s.securityHeaders && !s.securityHeaders.csp.present
  );
  const noXfo = list.filter(
    (s) => s.securityHeaders && !s.securityHeaders.xFrameOptions.present
  );
  const noCert = list.filter((s) => !s.hasCert && s.ips.length > 0);

  if (expiredCerts.length > 0) {
    score -= Math.min(30, expiredCerts.length * 10);
    actions.push({
      id: "expired-certs",
      severity: "critical",
      title: "Expired SSL certificates",
      description: `${expiredCerts.length} subdomain(s) have expired certificates.`,
      fix: "Renew SSL certificates immediately. Attackers can exploit expired certs for MITM attacks.",
      count: expiredCerts.length,
      priorityScore: 95 + Math.min(expiredCerts.length, 4), // 95-99
    });
  }

  if (devExposed.length > 0) {
    score -= Math.min(20, devExposed.length * 5);
    actions.push({
      id: "dev-exposed",
      severity: "high",
      title: "Development/staging subdomains exposed",
      description: `${devExposed.length} dev/staging subdomain(s) are publicly discoverable.`,
      fix: "Restrict access with firewall rules, VPN, or remove from public DNS. Dev environments often have weaker security.",
      count: devExposed.length,
      priorityScore: 85 + Math.min(devExposed.length, 5),
    });
  }

  const mainNoHsts =
    (rootHeaders && !rootHeaders.hsts.present ? 1 : 0) + noHsts.length;
  if (mainNoHsts > 0) {
    score -= Math.min(25, 15 + mainNoHsts * 2);
    const rootAffected = rootHeaders && !rootHeaders.hsts.present ? 1 : 0;
    actions.push({
      id: "no-hsts",
      severity: "high",
      title: "Missing HSTS header",
      description: "Strict-Transport-Security header is not set on one or more hosts.",
      fix: "Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload to force HTTPS.",
      count: mainNoHsts,
      priorityScore: 75 + rootAffected * 10 + Math.min(mainNoHsts, 5), // root = +10
    });
  }

  const mainNoCsp =
    (rootHeaders && !rootHeaders.csp.present ? 1 : 0) + noCsp.length;
  if (mainNoCsp > 0) {
    score -= Math.min(15, mainNoCsp * 5);
    actions.push({
      id: "no-csp",
      severity: "medium",
      title: "Missing Content-Security-Policy",
      description: "CSP header helps prevent XSS and injection attacks.",
      fix: "Add a Content-Security-Policy header. Start with default-src 'self' and refine as needed.",
      count: mainNoCsp,
      priorityScore: 55 + Math.min(mainNoCsp * 2, 15),
    });
  }

  const mainNoXfo =
    (rootHeaders && !rootHeaders.xFrameOptions.present ? 1 : 0) + noXfo.length;
  if (mainNoXfo > 0) {
    score -= Math.min(10, mainNoXfo * 3);
    actions.push({
      id: "no-xfo",
      severity: "medium",
      title: "Missing X-Frame-Options",
      description: "Clickjacking protection is not configured.",
      fix: 'Add X-Frame-Options: DENY or SAMEORIGIN to prevent your site from being embedded in iframes.',
      count: mainNoXfo,
      priorityScore: 45 + Math.min(mainNoXfo * 2, 10),
    });
  }

  if (list.length > 50) {
    score -= 10;
    actions.push({
      id: "large-surface",
      severity: "low",
      title: "Large attack surface",
      description: `${list.length} subdomains increases monitoring effort.`,
      fix: "Audit and decommission unused subdomains. Consolidate services where possible.",
      priorityScore: 20,
    });
  }

  if (noCert.length > 0 && noCert.some((s) => !s.name.startsWith("dev"))) {
    actions.push({
      id: "no-https",
      severity: "high",
      title: "Subdomains without HTTPS",
      description: "Some subdomains may not support HTTPS.",
      fix: "Enable TLS for all public-facing subdomains.",
      count: noCert.length,
      priorityScore: 80 + Math.min(noCert.length, 5),
    });
  }

  // Sort by priority (highest first) and assign rank
  actions.sort((a, b) => b.priorityScore - a.priorityScore);

  score = Math.max(0, Math.min(100, score));

  let grade: string;
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 50) grade = "D";
  else grade = "F";

  return { score, grade, actions };
}
