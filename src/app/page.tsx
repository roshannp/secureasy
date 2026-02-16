import { HomeClient } from "./HomeClient";

function ShieldIcon({ size = 28, color = "#60a5fa" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="feature-card">
      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          height: "40px",
          width: "40px",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          backgroundColor: "#eff6ff",
          color: "#2563eb",
        }}
      >
        {icon}
      </div>
      <h3 style={{ marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>
        {title}
      </h3>
      <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#6b7280", margin: 0 }}>
        {description}
      </p>
    </div>
  );
}

function TrustBadge({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 500,
        border: "1px solid rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "#9ca3af",
      }}
    >
      {icon}
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ===== HERO ===== */}
      <section
        style={{
          background: "linear-gradient(180deg, #0a0a0f 0%, #111827 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            pointerEvents: "none",
          }}
        />

        {/* Subtle blue glow */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            left: "20%",
            width: "60%",
            height: "70%",
            background: "radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "896px",
            margin: "0 auto",
            padding: "2.5rem 1.5rem 5rem",
          }}
        >
          {/* Nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldIcon size={26} color="#60a5fa" />
              <span style={{ fontSize: "1.125rem", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.01em" }}>
                AM I SECURE
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <a href="#features" style={{ fontSize: "0.875rem", color: "#9ca3af", textDecoration: "none" }}>
                Features
              </a>
            </div>
          </nav>

          {/* Headline */}
          <div style={{ textAlign: "center" }} className="animate-fade-in-up">
            <h1
              style={{
                maxWidth: "600px",
                margin: "0 auto",
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                color: "#ffffff",
              }}
            >
              Know your{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                attack surface
              </span>
            </h1>

            <p
              style={{
                maxWidth: "520px",
                margin: "1.25rem auto 0",
                fontSize: "1.0625rem",
                lineHeight: 1.6,
                color: "#9ca3af",
              }}
            >
              Discover exposed subdomains, check SSL certificates, analyze security headers, and identify known CVEs — in seconds.
            </p>
          </div>

          {/* Scan form */}
          <div
            style={{ maxWidth: "560px", margin: "2.5rem auto 0" }}
            className="animate-fade-in-up animate-delay-100"
          >
            <HomeClient />
          </div>

          {/* Trust badges */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginTop: "2.5rem",
            }}
            className="animate-fade-in-up animate-delay-200"
          >
            <TrustBadge
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
            >
              No data stored
            </TrustBadge>
            <TrustBadge
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2.5 2.5L16 9" />
                </svg>
              }
            >
              No signup required
            </TrustBadge>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section
        id="features"
        style={{
          borderTop: "1px solid #f3f4f6",
          backgroundColor: "#fafafa",
          padding: "5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "896px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 1.875rem)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "#111827",
              }}
            >
              One scan. Complete visibility.
            </h2>
            <p style={{ marginTop: "0.75rem", fontSize: "1rem", color: "#6b7280" }}>
              The same reconnaissance an attacker would perform — automated and prioritized for defenders.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            <FeatureCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              }
              title="Subdomain Discovery"
              description="Enumerates subdomains via Certificate Transparency logs. Finds forgotten dev, staging, and internal services."
            />
            <FeatureCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              }
              title="SSL / TLS Validation"
              description="Checks certificate validity, expiry dates, and TLS configuration across all discovered hosts."
            />
            <FeatureCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
              title="Security Headers"
              description="Analyzes HSTS, CSP, X-Frame-Options, and 3 more critical headers that prevent common attacks."
            />
            <FeatureCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
                </svg>
              }
              title="DNS Intelligence"
              description="Resolves A, AAAA, MX, TXT, and CNAME records. Reveals mail infrastructure and service providers."
            />
            <FeatureCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
              title="CVE Correlation"
              description="Fingerprints server technologies and cross-references against the NIST National Vulnerability Database."
            />
            <FeatureCard
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
              title="Risk Scoring"
              description="Weighted 0-100 score with letter grade. Prioritized action items ranked by real-world exploitability."
            />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section
        style={{
          borderTop: "1px solid #f3f4f6",
          backgroundColor: "#ffffff",
          padding: "5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "896px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(1.5rem, 3vw, 1.875rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "#111827",
              marginBottom: "3rem",
            }}
          >
            How it works
          </h2>

          <div
            style={{
              display: "grid",
              gap: "2rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {[
              { step: "1", title: "Enter your domain", desc: "Type any domain name — no login, no setup, no API keys needed." },
              { step: "2", title: "We scan your surface", desc: "Subdomains, DNS, SSL, headers, technologies, and CVEs — all checked in 15-40 seconds." },
              { step: "3", title: "Get actionable results", desc: "Risk score, letter grade, and prioritized fixes. Download a full HTML report." },
            ].map((item) => (
              <div key={item.step} style={{ textAlign: "center" }}>
                <div
                  style={{
                    margin: "0 auto 1rem",
                    display: "flex",
                    height: "48px",
                    width: "48px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    backgroundColor: "#111827",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                  }}
                >
                  {item.step}
                </div>
                <h3 style={{ marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
          padding: "2.5rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "896px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldIcon size={18} color="#9ca3af" />
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#6b7280" }}>AM I SECURE</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
            Powered by Certificate Transparency logs &amp; NIST NVD
          </p>
          <a
            href="https://github.com/roshannp/secureasy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.75rem", color: "#9ca3af", textDecoration: "none" }}
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
