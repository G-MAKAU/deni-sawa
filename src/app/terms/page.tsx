import type { Metadata } from 'next';
import { site } from '@/data/site';
import { LegalDownloadButton } from '@/components/LegalDownloadButton';
import { CTASection } from '@/components/CTASection';

export const metadata: Metadata = {
  title: 'Terms of Use | Deni Sawa Partners',
  description:
    'The terms that govern your use of the Deni Sawa Partners website, Business Health Check assessments and related services.',
  alternates: { canonical: `${site.url}/terms` },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = '19 August 2026';

const GREEN = '#5A9E28';

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-h3 font-semibold" style={{ color: GREEN }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 leading-relaxed text-muted-foreground">{children}</p>;
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 leading-relaxed text-muted-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5A9E28]" />
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const toc: { href: string; label: string }[] = [
  { href: '#acceptance', label: '1. Acceptance of Terms' },
  { href: '#about', label: '2. About Deni Sawa Partners' },
  { href: '#health-checks', label: '3. Business Health Check Assessments' },
  { href: '#report-access', label: '4. Report Access and Security' },
  { href: '#paid-reports', label: '5. Paid Reports' },
  { href: '#intellectual-property', label: '6. Intellectual Property' },
  { href: '#liability', label: '7. Limitation of Liability' },
  { href: '#whatsapp', label: '8. WhatsApp Communication' },
  { href: '#governing-law', label: '9. Governing Law' },
  { href: '#contact', label: '10. Contact' },
];

export default function TermsPage() {
  return (
    <>
      <section className="section-pad bg-background">
        <div className="mx-auto w-full max-w-[800px] px-5 sm:px-8">
          {/* Header — no hero image, date + PDF download prominent */}
          <div className="no-print mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">Legal</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-foreground">Terms of Use</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              The terms that govern your use of the {site.name} website, Business Health Check assessments and related services.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Effective date: {EFFECTIVE_DATE}</p>
                <p className="text-[13px] text-muted-foreground">
                  Last updated:{' '}
                  {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <LegalDownloadButton />
            </div>
          </div>

          {/* Table of contents */}
          <nav className="no-print rounded-lg border border-card-border bg-card p-5 sm:p-6">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground">
              On this page
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {toc.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-[14px] text-muted-foreground transition-colors hover:text-brand"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Terms content */}
          <div className="print-area mt-12 space-y-12">
            {/* 1. Acceptance */}
            <section>
              <SectionHeading id="acceptance">1. Acceptance of Terms</SectionHeading>
              <P>
                By accessing or using the {site.name} website or completing a Health Check assessment, you agree to these
                Terms of Use. If you do not agree, do not use the platform.
              </P>
            </section>

            {/* 2. About */}
            <section>
              <SectionHeading id="about">2. About Deni Sawa Partners</SectionHeading>
              <P>
                {site.name} is a strategic advisory and fractional business support firm. The platform connects organisations
                and individuals with senior-level advisory and fractional support. {site.name} is not a law firm, accounting
                firm, or financial services licensee in the regulatory sense. Advisory services provided through the platform
                are professional guidance — not regulated financial advice under the Capital Markets Authority (Kenya) or any
                equivalent body.
              </P>
            </section>

            {/* 3. Business Health Check assessments */}
            <section>
              <SectionHeading id="health-checks">3. Business Health Check Assessments</SectionHeading>
              <P>The following terms apply specifically to Business Health Check assessments:</P>
              <List
                items={[
                  <>
                    Business Health Check assessments are diagnostic tools designed to provide structured insight into business or
                    personal financial situations.
                  </>,
                  <>
                    Results are indicative only and do not constitute professional financial, legal, tax, or investment
                    advice.
                  </>,
                  <>
                    The diagnostic report is generated using an AI language model (Anthropic Claude) based on your responses.
                    The accuracy and relevance of the report depends on the accuracy and completeness of your responses.
                  </>,
                  <>
                    {site.name} advisors may review reports as part of a follow-up engagement but are not obligated to do so
                    for free summary reports.
                  </>,
                  <>
                    The detailed (paid) report is for your personal or business use only — you may not resell, republish, or
                    distribute the report.
                  </>,
                  <>
                    Rate limits apply: a maximum of 5 assessments per email address, WhatsApp number, or IP address per
                    calendar month. This limit may be adjusted at {site.name}&rsquo;s discretion.
                  </>,
                  <>
                    {site.name} reserves the right to refuse, suspend, or terminate access to the assessment system for any
                    user who attempts to abuse, circumvent, or manipulate the assessment process.
                  </>,
                ]}
              />
            </section>

            {/* 4. Report access */}
            <section>
              <SectionHeading id="report-access">4. Report Access and Security</SectionHeading>
              <List
                items={[
                  <>Your report is accessible via a unique private link.</>,
                  <>You are responsible for keeping your report link private.</>,
                  <>
                    {site.name} cannot be held responsible for unauthorised access to a report resulting from a user sharing
                    their report link.
                  </>,
                  <>Reports are stored for 36 months and then permanently deleted.</>,
                ]}
              />
            </section>

            {/* 5. Paid reports */}
            <section>
              <SectionHeading id="paid-reports">5. Paid Reports</SectionHeading>
              <List
                items={[
                  <>Detailed (full) reports require payment before delivery.</>,
                  <>Payment terms and pricing are as listed on the platform at the time of purchase.</>,
                  <>
                    Refunds: if a report fails to generate due to a technical error, a full refund will be issued. No refund
                    is available once a report has been successfully generated and delivered.
                  </>,
                  <>{site.name} reserves the right to change pricing at any time.</>,
                ]}
              />
            </section>

            {/* 6. Intellectual property */}
            <section>
              <SectionHeading id="intellectual-property">6. Intellectual Property</SectionHeading>
              <List
                items={[
                  <>
                    All content on this website including text, design, methodology (the{' '}
                    <strong>Deni Sawa Method™</strong>), and reports generated by the platform are the intellectual property
                    of {site.name}.
                  </>,
                  <>
                    The <strong>Deni Sawa Method™</strong> is a proprietary framework. Unauthorised reproduction or
                    commercial use is prohibited.
                  </>,
                  <>
                    Your assessment responses remain your own data. By submitting them, you grant {site.name} a limited
                    licence to process them for the purpose of generating your report and improving the diagnostic system (in
                    anonymised, aggregated form only).
                  </>,
                ]}
              />
            </section>

            {/* 7. Liability */}
            <section>
              <SectionHeading id="liability">7. Limitation of Liability</SectionHeading>
              <List
                items={[
                  <>{site.name} provides the platform and advisory services in good faith.</>,
                  <>
                    We are not liable for any business decisions made in reliance on a Health Check report or any advisory
                    engagement.
                  </>,
                  <>
                    Our total liability to any user is limited to the amount paid for the service that gave rise to the
                    claim.
                  </>,
                  <>We are not liable for indirect, consequential, or loss of profit claims.</>,
                ]}
              />
            </section>

            {/* 8. WhatsApp */}
            <section>
              <SectionHeading id="whatsapp">8. WhatsApp Communication</SectionHeading>
              <P>
                By providing your WhatsApp number, you consent to receive your Health Check report and related communications
                via WhatsApp.
              </P>
              <P>
                You can opt out at any time by replying <strong>STOP</strong> to any WhatsApp message or by emailing{' '}
                <a href={`mailto:${site.email}`} className="text-brand underline underline-offset-2">
                  {site.email}
                </a>
                .
              </P>
            </section>

            {/* 9. Governing law */}
            <section>
              <SectionHeading id="governing-law">9. Governing Law</SectionHeading>
              <List
                items={[
                  <>These Terms are governed by the laws of Kenya.</>,
                  <>Any dispute shall be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya.</>,
                  <>We will always attempt to resolve disputes amicably before any legal process.</>,
                ]}
              />
            </section>

            {/* 10. Contact */}
            <section>
              <SectionHeading id="contact">10. Contact</SectionHeading>
              <P>
                For any queries regarding these Terms, email{' '}
                <a href={`mailto:${site.email}`} className="text-brand underline underline-offset-2">
                  {site.email}
                </a>
                .
              </P>
            </section>
          </div>
        </div>
      </section>

      <div className="no-print">
        <CTASection
          title="Have a question about these terms?"
          subtitle="We are happy to clarify anything you are unsure about."
          primary={{ label: 'Contact Us', href: '/contact' }}
        />
      </div>
    </>
  );
}