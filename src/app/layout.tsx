import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Heart, Sparkles } from "lucide-react";
import { Providers } from "@/components/providers/providers";
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
  title: "Re-Focus — Shared Study Timer",
  description:
    "Study together in real-time. Join a room, start a timer, and stay focused with friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {/* Global decorative background elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-20 left-10 text-accent-primary/20 animate-pulse-glow" style={{ animationDuration: '4s' }}>
              <Heart size={64} className="rotate-12" />
            </div>
            <div className="absolute bottom-40 right-20 text-accent-primary/20 animate-pulse-glow" style={{ animationDuration: '5s', animationDelay: '1s' }}>
              <Sparkles size={80} className="-rotate-12" />
            </div>
          </div>
          
          <div className="relative z-10">
            {children}
          </div>
          
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
