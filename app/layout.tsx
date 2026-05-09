import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "./providers/ReduxProvider";
import { Toaster } from "react-hot-toast";


export const metadata: Metadata = {
  metadataBase: new URL("https://moneylens.ai"),

  title: {
    default: "MoneyLens — AI Powered Finance Intelligence",
    template: "%s | MoneyLens",
  },

  description:
    "Upload your bank statement and get AI-powered spending insights, saving recommendations, subscription audits, and wealth projections.",

  keywords: [
    "MoneyLens",
    "AI finance app",
    "expense tracker",
    "bank statement analyzer",
    "finance AI",
    "money management",
    "personal finance",
    "expense analysis",
    "wealth tracking",
    "subscription tracker",
    "India fintech",
  ],

  authors: [
    {
      name: "MoneyLens",
    },
  ],

  creator: "MoneyLens",

  openGraph: {
    title: "MoneyLens — AI Powered Finance Intelligence",

    description:
      "Understand where every rupee goes with AI-powered spending analysis and wealth insights.",

    url: "https://moneylens.ai",

    siteName: "MoneyLens",

    locale: "en_IN",

    type: "website",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MoneyLens",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "MoneyLens — AI Powered Finance Intelligence",

    description:
      "Track spending, detect leaks, and grow wealth using AI.",

    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0C] text-white antialiased">
      <Toaster />
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}