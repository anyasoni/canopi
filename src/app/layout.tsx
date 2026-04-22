import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Canopi — Is your product linked to deforestation?",
    template: "%s | Canopi",
  },
  description:
    "Check whether everyday supermarket products are linked to deforestation, with plain-English reports on commodities, certifications, and company practices.",
  icons: {
    icon: "/brand/tree.png",
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
};

export default RootLayout;
