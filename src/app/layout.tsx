import type { Metadata, Viewport } from 'next';
import '@/index.css';
import { AppShell } from './AppShell';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { CookieConsent } from '@/components/CookieConsent';
import { SWRegistration } from '@/components/pwa/SWRegistration';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { site } from '@/data/site';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['500', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Deni Sawa Partners',
  url: site.url,
  description:
    'Senior-level fractional business support — Fractional CFO, CEO, Governance & Special Situations advisory helping organisations move from Special Situations to Best-in-Class.',
  telephone: site.phone,
  email: site.email,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nairobi',
    addressRegion: 'Nairobi',
    addressCountry: 'KE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -1.2921,
    longitude: 36.8219,
  },
  areaServed: [
    { '@type': 'Country', name: 'Kenya' },
    { '@type': 'Continent', name: 'Africa' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Business Advisory Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Fractional CFO',
          description: 'Part-time senior financial leadership for growing businesses.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Fractional CEO',
          description: 'Interim executive leadership for transitions and turnarounds.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Business Health Check',
          description: 'Structured diagnostic assessment with a prioritised action report.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Governance & Controls',
          description: 'Board governance, risk management, and internal controls advisory.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Special Situations',
          description: 'Turnaround, restructuring, and recovery advisory.',
        },
      },
    ],
  },
  sameAs: Object.values(site.social ?? {}).filter(Boolean),
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Deni Sawa Partners — Fractional CFO & Advisory Kenya',
    template: '%s | Deni Sawa Partners',
  },
  description:
    'Senior-level fractional business support helping organisations move from Special Situations to Best-in-Class performance. Take your Business Health Check today.',
  keywords: [
    'fractional CFO Kenya',
    'business advisory Kenya',
    'special situations',
    'turnaround advisory',
    'business health check',
    'financial coaching',
    'governance Kenya',
    'Deni Sawa',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Deni Sawa Partners',
    locale: 'en_KE',
    url: site.url,
    title: 'Deni Sawa Partners — Fractional CFO & Advisory Kenya',
    description:
      'Senior-level fractional business support — Fractional CFO, CEO, Governance & Special Situations advisory.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deni Sawa Partners — Fractional CFO & Advisory Kenya',
    description:
      'Senior-level fractional business support — Fractional CFO, CEO, Governance & Special Situations advisory.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: '/apple-touch-icon.png',
  },
  other: {
    'application/ld+json': JSON.stringify(structuredData),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9F7F5' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0F0F' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} scroll-smooth`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E8510A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Deni Sawa" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <GoogleAnalytics />
        <AppShell>{children}</AppShell>
        <CookieConsent />
        <SWRegistration />
        <OfflineBanner />
      </body>
    </html>
  );
}
