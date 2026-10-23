import { Inter } from "next/font/google";
import "./globals.css";
import { StagingBar } from "@/components/site/staging-bar";

// Inter for everything, as on the original site (Elementor's global typography).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-dvh pb-20 lg:pb-0">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-sun focus:px-4 focus:py-3 focus:font-semibold focus:text-ink">
          Skip to main content
        </a>
        <StagingBar />
        {children}
      </body>
    </html>
  );
}
