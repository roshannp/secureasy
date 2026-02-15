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
        className="font-sans antialiased"
        style={{
          background: "linear-gradient(135deg, #0a0f1a 0%, #0f172a 50%, #0a0f1a 100%)",
          minHeight: "100vh",
          color: "#e5e7eb",
        }}
      >
        {children}
      </body>
    </html>
  );
}
