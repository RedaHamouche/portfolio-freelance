export const siteConfig = {
  name: "Reda Portfolio",
  title: "Reda - Développeur Full Stack Freelance",
  description: "Développeur Full Stack freelance spécialisé en React, Next.js, Node.js et technologies modernes. Création d'applications web performantes et innovantes.",
  url: "https://reda-portfolio.com", // À remplacer par votre vrai domaine
  ogImage: "/og-image.jpg",
  twitterImage: "/twitter-image.jpg",
  keywords: [
    "développeur freelance",
    "full stack",
    "react",
    "next.js",
    "node.js",
    "typescript",
    "javascript",
    "web development",
    "frontend",
    "backend",
    "freelance developer"
  ],
  author: {
    name: "Reda",
    email: "contact@reda-portfolio.com", // À remplacer par votre vrai email
    twitter: "@reda_dev", // À remplacer par votre vrai Twitter
    linkedin: "https://linkedin.com/in/reda-dev", // À remplacer par votre vrai LinkedIn
    github: "https://github.com/reda-dev" // À remplacer par votre vrai GitHub
  },
  creator: "Reda",
  publisher: "Reda",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://reda-portfolio.com"), // À remplacer par votre vrai domaine
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // À remplacer par votre code Google Search Console
    yandex: "your-yandex-verification-code", // Optionnel
    yahoo: "your-yahoo-verification-code", // Optionnel
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://reda-portfolio.com",
    title: "Reda - Développeur Full Stack Freelance",
    description: "Développeur Full Stack freelance spécialisé en React, Next.js, Node.js et technologies modernes. Création d'applications web performantes et innovantes.",
    siteName: "Reda Portfolio",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Reda - Développeur Full Stack Freelance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reda - Développeur Full Stack Freelance",
    description: "Développeur Full Stack freelance spécialisé en React, Next.js, Node.js et technologies modernes.",
    images: ["/twitter-image.jpg"],
    creator: "@reda_dev",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#000000",
      },
    ],
  },
  manifest: "/site.webmanifest",
  other: {
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
  },
}; 