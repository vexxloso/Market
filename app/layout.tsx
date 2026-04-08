import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import {
  AuthModalProvider,
  AuthModalSearchParamsSync,
} from "@/components/auth-modals";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noire Haven - Find your next stay",
  description: "Airbnb-inspired vacation rental marketplace MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthModalProvider>
          <Suspense fallback={null}>
            <AuthModalSearchParamsSync />
          </Suspense>
          <SiteHeader />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <SiteFooter />
        </AuthModalProvider>
      </body>
    </html>
  );
}
