import { siteConfig } from '@/config/metadata';

export default function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": siteConfig.author.name,
    "url": siteConfig.url,
    "image": siteConfig.ogImage,
    "sameAs": [
      siteConfig.author.linkedin,
      siteConfig.author.github,
      siteConfig.author.twitter
    ],
    "jobTitle": "Développeur Full Stack Freelance",
    "worksFor": {
      "@type": "Organization",
      "name": "Freelance"
    },
    "description": siteConfig.description,
    "knowsAbout": [
      "React",
      "Next.js",
      "Node.js",
      "TypeScript",
      "JavaScript",
      "Web Development",
      "Full Stack Development"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "FR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": siteConfig.author.email
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
} 