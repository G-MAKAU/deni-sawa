import type { Metadata } from 'next';
import { site } from '@/data/site';
import { PageHero } from '@/components/PageHero';
import { CTASection } from '@/components/CTASection';

export const metadata: Metadata = {
  title: 'Terms of Use | Deni Sawa Partners',
  description:
    'The terms that govern your use of the Deni Sawa Partners website, Health Checks and related services.',
  alternates: { canonical: `${site.url}/terms` },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: '1. Acceptance of terms',
    body: 'By accessing or using the Deni Sawa Partners website and services, you agree to be bound by these Terms of Use. If you do not agree, please do not use the site or services.',
  },
  {
    title: '2. Nature of our services',
    body: 'Our website provides information and diagnostic tools (including AI-generated Health Check reports) to help you understand your situation. These tools and reports are provided for guidance only and do not constitute legal, accounting, investment or professional financial advice. Any engagement for advisory services is subject to a separate written agreement.',
  },
  {
    title: '3. Health Check reports',
    body: 'Health Check reports are generated from the answers you provide and may be based on AI. They are informational, not a substitute for professional advice. You are responsible for the accuracy of the information you submit.',
  },
  {
    title: '4. Intellectual property',
    body: 'All content on this site — including text, design, the Deni Sawa Method™, graphics and branding — is owned by or licensed to Deni Sawa Partners and protected by applicable law. You may not reproduce or republish it without our written consent.',
  },
  {
    title: '5. Acceptable use',
    body: 'You agree not to misuse the site, attempt to gain unauthorised access, introduce malicious code, or use the site in any way that is unlawful or interferes with others\u2019 use.',
  },
  {
    title: '6. Limitation of liability',
    body: 'The site and services are provided "as is". To the fullest extent permitted by law, Deni Sawa Partners shall not be liable for any indirect, incidental or consequential damages arising from your use of the site, tools or reports.',
  },
  {
    title: '7. Third-party links',
    body: 'The site may link to third-party websites. We are not responsible for the content or practices of those sites, and their use is subject to their own terms and policies.',
  },
  {
    title: '8. Changes to these terms',
    body: 'We may update these terms from time to time. Continued use of the site after changes are posted constitutes acceptance of the updated terms.',
  },
  {
    title: '9. Governing law',
    body: 'These terms are governed by the laws of the Republic of Kenya. Any disputes shall be subject to the jurisdiction of the Kenyan courts.',
  },
  {
    title: '10. Contact',
    body: `For questions about these terms, email ${site.email} or write to Deni Sawa Partners, Nairobi, Kenya.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of Use"
        subtitle="The terms that govern your use of our website, Health Checks and services."
        crumbs={[{ label: 'Terms of Use' }]}
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
        title="Have a question about these terms?"
        subtitle="We are happy to clarify anything you are unsure about."
        primary={{ label: 'Contact Us', href: '/contact' }}
      />
    </>
  );
}
