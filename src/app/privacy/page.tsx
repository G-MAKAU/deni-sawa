import type { Metadata } from 'next';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { CTASection } from '@/components/CTASection';

export const metadata: Metadata = {
  title: 'Privacy Policy | Deni Sawa Partners',
  description:
    'How Deni Sawa Partners collects, uses and protects your information — including your Health Check responses and reports.',
  alternates: { canonical: `${site.url}/privacy` },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: '1. Who we are',
    body: 'Deni Sawa Partners ("we", "us") is a senior-level advisory and fractional business support firm. This policy explains how we collect, use and protect personal information you provide through our website, Health Checks, consultations and communications.',
  },
  {
    title: '2. Information we collect',
    body: 'We collect information you give us directly: your name, phone number, email address, the topic of your enquiry, and — when you take a Health Check — your responses to the assessment questions. We also collect limited technical data (such as browser type and pages visited) to keep the site secure and functional.',
  },
  {
    title: '3. How we use your information',
    body: 'We use your information to respond to enquiries, deliver your diagnostic Health Check report, provide advisory and learning services, and — where you have opted in — send relevant updates. We do not sell your personal information.',
  },
  {
    title: '4. Health Check data',
    body: 'Your Health Check responses are used solely to generate your diagnostic report. Reports are confidential, private and accessible only through your unguessable report link.',
  },
  {
    title: '5. Sharing',
    body: 'We share your information only with trusted service providers who help us operate (such as email delivery and secure data storage), under confidentiality obligations, and where required by law.',
  },
  {
    title: '6. Security & retention',
    body: 'We apply appropriate technical and organisational measures to protect your data. We retain personal information only as long as needed for the purposes described here or as required by law, after which it is securely deleted.',
  },
  {
    title: '7. Your rights',
    body: 'You may request access to, correction of, or deletion of your personal information at any time. Contact us using the details below and we will respond within a reasonable timeframe.',
  },
  {
    title: '8. Contact',
    body: `For any privacy questions or requests, email ${site.email} or write to Deni Sawa Partners, Nairobi, Kenya.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="How we collect, use and protect your information — including your Health Check data."
        crumbs={[{ label: 'Privacy Policy' }]}
      />

      <section className="section-pad bg-background">
        <div className="container-lux">
          <div className="mx-auto w-full">
            <div className="space-y-10">
              {sections.map((section) => (
                <div key={section.title}>
                  <h2 className="text-h3 font-semibold text-foreground">{section.title}</h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-14 border-t border-card-border pt-6 text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>
        </div>
      </section>

      <CTASection
        title="Questions about your data?"
        subtitle="We are happy to walk you through how your information is handled."
        primary={{ label: 'Contact Us', href: '/contact' }}
      />
    </>
  );
}
