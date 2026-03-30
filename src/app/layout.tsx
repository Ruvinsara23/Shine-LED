import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlyLog Processor",
  description: "Enterprise Play Log Processing and Reporting Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
