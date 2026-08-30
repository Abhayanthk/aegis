import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Google_Sans, Lato } from "next/font/google";
import "./globals.css";

const googleSans = Google_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-text",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AEGIS",
    template: "%s | AEGIS",
  },
  description:
    "AEGIS investigates runtime reliability issues, verifies repairs, and prepares safe pull requests.",
};

export default function RootLayout({
  children,
}: Readonly<LayoutProps<"/">>) {
  return (
    <html
      lang="en"
      className={`${googleSans.variable} ${lato.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background font-text text-foreground">
        <ClerkProvider appearance={{ theme: shadcn }}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}