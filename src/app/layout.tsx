import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@/styles/global.scss';
import '@/styles/reset.scss';
import { siteConfig } from '@/config/metadata';
import ReduxProvider from './ReduxProvider';
import CursorProvider from './CursorProvider';
import Header from './Header';
import JsonLd from '@/components/JsonLd';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author.name, url: siteConfig.url }],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  formatDetection: siteConfig.formatDetection,
  metadataBase: siteConfig.metadataBase,
  alternates: siteConfig.alternates,
  robots: siteConfig.robots,
  verification: siteConfig.verification,
  openGraph: siteConfig.openGraph,
  twitter: siteConfig.twitter,
  icons: siteConfig.icons,
  manifest: siteConfig.manifest,
  other: siteConfig.other,
  category: "technology",
  classification: "Portfolio",
  referrer: "origin-when-cross-origin",
  applicationName: siteConfig.name,
  generator: "Next.js",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  colorScheme: "light dark",
};

const announcements = [
  {
    color: "green",
    text: "Available for freelance work"
  }
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={siteConfig.name} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <JsonLd />
        <ReduxProvider>
          <CursorProvider>
            <Header announcements={announcements}/>
            {children}
          </CursorProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
