import type { Metadata } from "next";
import { Indie_Flower } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

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
        className={`${indieFlower.variable} antialiased`}
      >
        <Providers>


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
