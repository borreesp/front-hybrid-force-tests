import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import React from "react";
import "./globals.css";
import { AuthShell } from "../components/auth/AuthShell";
import { Providers } from "./providers";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "HybridForce MVP",
  description: "Dashboard del atleta hibrido - Next.js + Expo monorepo"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={manrope.variable}>
      <body>
        <Providers>
          <AuthShell>{children}</AuthShell>
        </Providers>
      </body>
    </html>
  );
}
