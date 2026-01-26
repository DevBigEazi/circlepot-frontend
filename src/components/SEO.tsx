/**
 * SEO Component - Uses React 19's native metadata support
 *
 * React 19 automatically hoists <title>, <meta>, and <link> tags to the <head>
 * when rendered anywhere in the component tree.
 */

import image from "../constants/image";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

const DEFAULT_TITLE = "Circlepot - Save Together, Grow Together, Anywhere";
const DEFAULT_DESCRIPTION =
  "Join rotating savings circles with people worldwide. Build financial discipline, earn trust, and grow your savings with Circlepot's blockchain-powered community savings platform.";
const DEFAULT_IMAGE = image.logo;
const SITE_URL = "https://test.circlepot.xyz";

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noIndex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | Circlepot` : DEFAULT_TITLE;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Circlepot" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="author" content="Circlepot" />
      <meta
        name="keywords"
        content="rotating savings, ROSCA, savings circle, community savings, blockchain savings, DeFi savings, crypto savings, financial discipline, stablecoins saving, stablecoins yield"
      />
    </>
  );
}

export default SEO;
