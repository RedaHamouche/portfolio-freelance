import type { Metadata } from 'next';
import MapScroller from './MapScroller';
import { siteConfig } from '@/config/metadata';

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  openGraph: {
    ...siteConfig.openGraph,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    ...siteConfig.twitter,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return (
    <>
      <MapScroller />
    </>
  );
}
