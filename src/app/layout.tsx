import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AM I SECURE",
  description:
    "Free domain security assessment. Discover exposed subdomains, check SSL certificates, analyze security headers, and identify known CVEs — in seconds.",
  keywords: ["security scanner", "attack surface", "subdomain discovery", "SSL check", "security headers", "CVE scanner"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
