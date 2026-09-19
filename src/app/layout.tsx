import type { Metadata } from "next";
import { Inter, Indie_Flower } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers/providers";
import { ConnectionStatus } from "@/components/layout/connection-status";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const indieFlower = Indie_Flower({
  weight: "400",
  variable: "--font-indie-flower",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReFocus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${indieFlower.variable} font-sans antialiased`}
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
