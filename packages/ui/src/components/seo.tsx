import React from 'react';

// Reusable JSON-LD Schema components for SEO

export const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "School ERP",
    "url": "https://schoolerp.com",
    "logo": "https://schoolerp.com/logo.png",
    "sameAs": [
      "https://twitter.com/schoolerp",
      "https://linkedin.com/company/schoolerp"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-800-000-0000",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const SoftwareApplicationSchema = ({ name, description, applicationCategory = "EducationalApplication" }: { name?: string, description?: string, applicationCategory?: string }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": name || "School ERP",
    "operatingSystem": "Web, Android, iOS",
    "applicationCategory": applicationCategory,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "845"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": description || "The modern operating system for Indian budget and small private schools."
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const FAQSchema = ({ faqs }: { faqs: { question: string; answer: string }[] }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const BlogPostingSchema = ({ title, description, datePublished, authorName, imageUrl }: { title: string, description: string, datePublished: string, authorName: string, imageUrl?: string }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "datePublished": datePublished,
    "author": {
      "@type": "Person",
      "name": authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": "School ERP",
      "logo": {
        "@type": "ImageObject",
        "url": "https://schoolerp.com/logo.png"
      }
    },
    "image": imageUrl ? [imageUrl] : undefined
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
