import type { Metadata, Viewport } from 'next';
import '@/index.css';
import { AppShell } from './AppShell';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { CookieConsent } from '@/components/CookieConsent';
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

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Deni Sawa Partners | Fractional CFO & Business Advisory | Special Situations',
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deni Sawa Partners | Fractional CFO & Business Advisory',
    description: site.description,
  },
  icons: {
    icon: '/favicon.svg',
  },
  other: {
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'Deni Sawa Partners',
      url: site.url,
      description:
        'Senior-level advisory and fractional business support helping organisations move from Special Situations to Best-in-Class.',
      telephone: site.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Nairobi',
        addressCountry: 'KE',
      },
      areaServed: ['KE', 'Africa'],
      makesOffer: ['Fractional CFO', 'Fractional CEO', 'Governance', 'Health Checks', 'Special Situations'],
    }),
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
      <body>
        <GoogleAnalytics />
        <AppShell>{children}</AppShell>
        <CookieConsent />
      </body>
    </html>
  );
}

