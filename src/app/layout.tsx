import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers/providers";
import { ConnectionStatus } from "@/components/layout/connection-status";
import { PreferenceBootstrap } from "@/components/providers/preference-bootstrap";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ReFocus",
  description: "A quiet space for focused study, on your own or together.",
  applicationName: "ReFocus",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ReFocus" },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-accent="dark" suppressHydrationWarning>
      <head>
        <link id="app-manifest" rel="manifest" href="/manifest-he.webmanifest" />
        <link id="apple-touch-icon" rel="apple-touch-icon" sizes="180x180" href="/icons/he/180.png" />
        <meta id="app-theme-color" name="theme-color" content="#1a1d1c" />
        <meta name="mobile-web-app-capable" content="yes" />
        <PreferenceBootstrap />
        {/* Variant styles are intentionally loaded outside the shared CSS bundle. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <noscript><link rel="stylesheet" href="/themes/he/theme.css" /></noscript>
        {/* One client-managed icon; do not also declare a file-based app icon. */}
        <link rel="icon" type="image/svg+xml" sizes="any" href="/favicon-he.svg" id="favicon" />
      </head>
      <body
        data-variant="he"
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased`}
      >
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:text-foreground">Skip to content</a>


          <div className="relative z-10">
            <ConnectionStatus />
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
