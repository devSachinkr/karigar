import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthUserSync } from "@/components/AuthUserSync";
import { HeritageDecor } from "@/components/HeritageDecor";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karigar — Handicraft Visual Intelligence",
  description: "Explore Indian handicrafts and understand visual similarity with AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider>
            <HeritageDecor />
            <AuthUserSync />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
