import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AM I SECURE | Attack Surface Visibility for SMBs",
  description:
    "Domain security checker — subdomains, headers, CVEs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-white text-[#0d0d0d]">
        {children}
      </body>
    </html>
  );
}
