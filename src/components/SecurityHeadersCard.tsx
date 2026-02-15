"use client";

import type { SecurityHeadersResult } from "@/lib/riskScore";

interface SecurityHeadersCardProps {
  host: string;
  headers?: SecurityHeadersResult;
}

const HEADER_LABELS: Record<
  keyof Omit<SecurityHeadersResult, "score">,
  { label: string; desc: string }
> = {
  hsts: {
    label: "Strict-Transport-Security",
    desc: "Forces HTTPS, prevents downgrade attacks",
  },
  csp: {
    label: "Content-Security-Policy",
    desc: "Mitigates XSS and injection",
  },
  xFrameOptions: {
    label: "X-Frame-Options",
    desc: "Prevents clickjacking",
  },
  xContentTypeOptions: {
    label: "X-Content-Type-Options",
    desc: "Prevents MIME sniffing",
  },
  referrerPolicy: {
    label: "Referrer-Policy",
    desc: "Controls referrer information",
  },
  permissionsPolicy: {
    label: "Permissions-Policy",
    desc: "Controls browser features",
  },
};

export function SecurityHeadersCard({ host, headers }: SecurityHeadersCardProps) {
  if (!headers) {
    return (
      <div className="rounded-lg border p-4" style={{ borderColor: "#e5e5e5", background: "#f7f7f8" }}>
        <h3 className="font-mono text-sm font-medium" style={{ color: "#6e6e80" }}>
          {host}
        </h3>
        <p className="mt-2 text-sm" style={{ color: "#6e6e80" }}>
          Could not fetch headers (host may be unreachable or blocks requests)
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "#e5e5e5", background: "#f7f7f8" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm font-medium" style={{ color: "#0d0d0d" }}>
          {host}
        </h3>
        <span className="rounded px-2 py-0.5 text-xs" style={{ background: "#e5e5e5", color: "#0d0d0d" }}>
          {headers.score}/100
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {(Object.keys(HEADER_LABELS) as Array<keyof typeof HEADER_LABELS>).map(
          (key) => {
            const item = headers[key];
            if (typeof item === "object" && "present" in item) {
              const { label, desc } = HEADER_LABELS[key];
              return (
                <div
                  key={key}
                  className="flex items-start gap-2 text-xs"
                >
                  <span
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: item.present ? "#166534" : "#b91c1c" }}
                  />
                  <div>
                    <span style={{ color: "#0d0d0d" }}>{label}</span>
                    <span style={{ color: "#6e6e80" }}> — {desc}</span>
                    {item.present && item.value && (
                      <p className="mt-0.5 truncate font-mono" style={{ color: "#6e6e80" }}>
                        {item.value}
                      </p>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          }
        )}
      </div>
    </div>
  );
}
