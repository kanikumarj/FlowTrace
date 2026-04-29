import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FlowTrace — IVR Call Flow Documentation",
  description:
    "SaaS platform for contact center IVR documentation, simulation, and audit. Built for architects, QA engineers, and business analysts.",
  keywords: ["IVR", "call flow", "contact center", "documentation", "SaaS"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
