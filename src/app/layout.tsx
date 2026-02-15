import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secureasy | Attack Surface Visibility for SMBs",
  description:
    "See what attackers can see. Free attack surface scanning for small businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ background: "#0a0f1a" }}>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#0a0f1a",
          color: "#e5e7eb",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
