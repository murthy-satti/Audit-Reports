import type { Metadata } from "next";
import "./globals.css";



export const metadata: Metadata = {
  title: "Audit Report Generator",
  description: "Simplified audit report generation and download",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="te">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
