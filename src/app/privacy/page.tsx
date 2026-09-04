import type { Metadata } from 'next';
import { site } from '@/data/site';
import { LegalDownloadButton } from '@/components/LegalDownloadButton';
import { CTASection } from '@/components/CTASection';

export const metadata: Metadata = {
  title: 'Privacy Policy | Deni Sawa Partners',
  description:
    'How Deni Sawa Partners collects, uses and protects your information — including your Health Check responses, reports and communications, under the Kenya Data Protection Act, 2019.',
  alternates: { canonical: `${site.url}/privacy` },
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

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 text-[15px] font-semibold text-foreground">{children}</h3>;
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

function DataTable({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-card-border">
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-card-border">
          {rows.map((row) => (
            <tr key={row.label}>
              <th className="w-1/3 bg-bgalt px-4 py-3 align-top text-[13px] font-semibold text-foreground">{row.label}</th>
              <td className="px-4 py-3 leading-relaxed text-muted-foreground">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const toc: { href: string; label: string }[] = [
  { href: '#company-identity', label: 'Company Identity' },
  { href: '#governing-law', label: 'Governing Law' },
  { href: '#data-we-collect', label: 'Data We Collect' },
  { href: '#how-we-use-data', label: 'How We Use Data' },
  { href: '#ai-processing', label: 'How Your Assessment Data is Processed' },
  { href: '#data-retention', label: 'Data Retention' },
  { href: '#data-sharing', label: 'Data Sharing' },
  { href: '#user-rights', label: 'Your Rights Under Kenya DPA 2019' },
  { href: '#cookies', label: 'Cookies' },
  { href: '#report-links', label: 'Health Check Report Links' },
  { href: '#changes', label: 'Changes to This Policy' },
  { href: '#contact', label: 'Contact & Data Protection Officer' },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="section-pad bg-background">
        <div className="mx-auto w-full max-w-[800px] px-5 sm:px-8">
          {/* Header — no hero image, date + PDF download prominent */}
          <div className="no-print mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand">Legal</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-foreground">Privacy Policy</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              How {site.name} collects, uses and protects your information — including your Health Check responses, reports
              and communications.
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

          {/* Policy content */}
          <div className="print-area mt-12 space-y-12">
            {/* 1. Company Identity */}
            <section>
              <SectionHeading id="company-identity">1. Company Identity</SectionHeading>
              <P>
                This Privacy Policy applies to {site.name} (<strong>&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
                &ldquo;our&rdquo;</strong>), a strategic advisory and fractional business support firm based in Kenya.
              </P>
              <div className="mt-4 overflow-hidden rounded-lg border border-card-border">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-card-border">
                    <tr>
                      <th className="w-1/3 bg-bgalt px-4 py-3 text-[13px] font-semibold text-foreground">Business name</th>
                      <td className="px-4 py-3 text-muted-foreground">{site.name}</td>
                    </tr>
                    <tr>
                      <th className="w-1/3 bg-bgalt px-4 py-3 text-[13px] font-semibold text-foreground">Country</th>
                      <td className="px-4 py-3 text-muted-foreground">Kenya</td>
                    </tr>
                    <tr>
                      <th className="w-1/3 bg-bgalt px-4 py-3 text-[13px] font-semibold text-foreground">Primary contact</th>
                      <td className="px-4 py-3 text-muted-foreground">{site.email}</td>
                    </tr>
                    <tr>
                      <th className="w-1/3 bg-bgalt px-4 py-3 text-[13px] font-semibold text-foreground">Phone</th>
                      <td className="px-4 py-3 text-muted-foreground">{site.phone}</td>
                    </tr>
                    <tr>
                      <th className="w-1/3 bg-bgalt px-4 py-3 text-[13px] font-semibold text-foreground">Website</th>
                      <td className="px-4 py-3 text-muted-foreground">{site.url}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 2. Governing Law */}
            <section>
              <SectionHeading id="governing-law">2. Governing Law</SectionHeading>
              <P>
                This policy is primarily governed by the <strong>Kenya Data Protection Act, 2019 (DPA 2019)</strong> and the{' '}
                <strong>Kenya Data Protection (General) Regulations, 2021</strong>. For our international users, we apply the
                principles of the European Union&rsquo;s General Data Protection Regulation (GDPR) as best practice.
              </P>
              <P>
                Our Data Protection Officer can be reached at <strong>{site.email}</strong>.
              </P>
            </section>

            {/* 3. Data We Collect */}
            <section>
              <SectionHeading id="data-we-collect">3. Data We Collect</SectionHeading>
              <P>We collect only the information needed to operate this platform and deliver our services.</P>

              <SubHeading>Health Check assessments</SubHeading>
              <List
                items={[
                  <>Full name</>,
                  <>Business name (Business Health Check only)</>,
                  <>Email address</>,
                  <>WhatsApp number</>,
                  <>
                    Assessment responses (paragraph answers, single and multi-select choices)
                  </>,
                  <>IP address and user agent (for rate limiting and security)</>,
                  <>Time taken to complete the assessment</>,
                  <>Assessment start and completion timestamps</>,
                ]}
              />

              <SubHeading>Report delivery</SubHeading>
              <List
                items={[
                  <>Preferred delivery channel (email, WhatsApp, or both)</>,
                  <>Report access timestamp (when your report link is opened)</>,
                  <>Report type accessed (summary or detailed)</>,
                ]}
              />

              <SubHeading>Communications</SubHeading>
              <List
                items={[
                  <>
                    Email correspondence via SMTP (domain mail — no third-party email provider)
                  </>,
                  <>WhatsApp messages via the Meta Business Cloud API</>,
                  <>Contact form submissions</>,
                ]}
              />

              <SubHeading>Website usage</SubHeading>
              <List
                items={[
                  <>
                    Google Analytics 4 (GA4) data: page views, session duration, events, device type
                  </>,
                  <>Cookie consent preferences</>,
                  <>Referral source</>,
                ]}
              />

              <SubHeading>Admin and team</SubHeading>
              <List
                items={[
                  <>Admin user accounts: name, email, role, last active timestamp</>,
                  <>Session activity for security (inactivity timeout enforcement)</>,
                ]}
              />
            </section>

            {/* 4. How We Use Data */}
            <section>
              <SectionHeading id="how-we-use-data">4. How We Use Data</SectionHeading>
              <P>We use your personal data for the following specific purposes:</P>
              <List
                items={[
                  <>
                    <strong>To deliver Health Check reports</strong> — your assessment responses are processed to generate a
                    structured diagnostic report. Reports are delivered to the email address or WhatsApp number you provide.
                  </>,
                  <>
                    <strong>To provide fractional advisory and business support services</strong> — contact details and
                    assessment data inform advisory engagements.
                  </>,
                  <>
                    <strong>To communicate with you</strong> — confirmation messages, report delivery and follow-up
                    communications via email and WhatsApp.
                  </>,
                  <>
                    <strong>To improve our services</strong> — anonymised, aggregated assessment data may be used to improve
                    diagnostic accuracy and service design. No individual is identifiable in this analysis.
                  </>,
                  <>
                    <strong>For security and fraud prevention</strong> — IP addresses and session data are used solely to
                    enforce rate limits and prevent abuse of the assessment system.
                  </>,
                  <>
                    <strong>For analytics</strong> — website usage data via GA4 is used to understand how visitors use the
                    site and improve the user experience.
                  </>,
                ]}
              />
            </section>

            {/* 5. AI Processing */}
            <section>
              <SectionHeading id="ai-processing">5. How Your Assessment Data is Processed</SectionHeading>
              <P>
                When you complete a Health Check assessment, your responses are submitted to{' '}
                <strong>Anthropic&rsquo;s Claude API</strong> — a third-party AI service operated by Anthropic, PBC (USA) — to
                generate your diagnostic report. Your responses are processed by this service for the sole purpose of
                generating your report. Anthropic&rsquo;s data processing is governed by their privacy policy, available at{' '}
                <a href="https://anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">
                  anthropic.com/privacy
                </a>
                . We do not use your assessment responses to train AI models. Your report is stored securely in our database
                and accessible only via your unique, private report link.
              </P>
            </section>

            {/* 6. Data Retention */}
            <section>
              <SectionHeading id="data-retention">6. Data Retention</SectionHeading>
              <P>We retain personal data only for as long as it is needed for the purposes described in this policy.</P>
              <DataTable
                rows={[
                  { label: 'Health Check sessions and responses', value: '24 months from completion date' },
                  { label: 'Health Check reports', value: '36 months from generation date' },
                  { label: 'Email and WhatsApp logs', value: '12 months' },
                  { label: 'Contact form submissions', value: '24 months' },
                  { label: 'GA4 analytics data', value: 'Per GA4 default (14 months)' },
                  { label: 'Admin session logs', value: '6 months' },
                ]}
              />
              <P>
                After retention periods expire, data is permanently deleted from all systems — including backups — within 30
                days of the retention date.
              </P>
            </section>

            {/* 7. Data Sharing */}
            <section>
              <SectionHeading id="data-sharing">7. Data Sharing</SectionHeading>
              <P>We share data only with the following service providers, each under a confidentiality obligation:</P>
              <List
                items={[
                  <>
                    <strong>Anthropic, PBC</strong> — assessment responses sent to the Claude API for report generation only.
                  </>,
                  <>
                    <strong>Meta Platforms</strong> — WhatsApp number and message content sent via the Meta Business Cloud
                    API for report delivery (only when WhatsApp delivery is selected).
                  </>,
                  <>
                    <strong>Supabase, Inc.</strong> — our database and authentication provider. Data is stored in
                    Supabase-managed PostgreSQL infrastructure.
                  </>,
                  <>
                    <strong>Google LLC</strong> — anonymised analytics data via Google Analytics 4.
                  </>,
                  <>
                    <strong>Vercel, Inc.</strong> — our hosting provider. No user data is stored by Vercel beyond standard
                    server logs.
                  </>,
                ]}
              />
              <P>
                <strong>We do not sell, rent, or share personal data with any third party for marketing purposes. Ever.</strong>
              </P>
            </section>

            {/* 8. User Rights */}
            <section>
              <SectionHeading id="user-rights">8. Your Rights Under Kenya DPA 2019</SectionHeading>
              <P>Under the Kenya Data Protection Act, 2019, you have the right to:</P>
              <List
                items={[
                  <>Access your personal data</>,
                  <>Correct inaccurate data</>,
                  <>Delete your data (right to erasure)</>,
                  <>Object to processing</>,
                  <>Data portability</>,
                  <>Withdraw consent at any time</>,
                ]}
              />
              <P>
                To exercise any right, email{' '}
                <a href={`mailto:${site.email}?subject=${encodeURIComponent('Data Rights Request')}`} className="text-brand underline underline-offset-2">
                  {site.email}
                </a>{' '}
                with the subject line <strong>&ldquo;Data Rights Request — [your name]&rdquo;</strong>. We will respond within{' '}
                <strong>21 days</strong> as required by the Kenya DPA 2019.
              </P>
            </section>

            {/* 9. Cookies */}
            <section>
              <SectionHeading id="cookies">9. Cookies</SectionHeading>
              <P>We use the following cookies:</P>
              <DataTable
                rows={[
                  { label: '_ga, _ga_*', value: 'Google Analytics 4 — 2 years' },
                  { label: 'sb-*', value: 'Supabase authentication — Session' },
                  { label: 'Cookie consent preference', value: 'Remembers your consent choice — 12 months' },
                ]}
              />
              <P>
                You can withdraw cookie consent at any time via the <em>Cookie Settings</em> link in the footer of this
                website.
              </P>
            </section>

            {/* 10. Report Links */}
            <section>
              <SectionHeading id="report-links">10. Health Check Report Links</SectionHeading>
              <P>
                Report links (<em>/business-health-checks/report/[token]</em>) are private and unique. The token is a
                64-character cryptographic random string. Anyone with the link can access the report — users are advised not
                to share their report link with unintended recipients.
              </P>
            </section>

            {/* 11. Changes */}
            <section>
              <SectionHeading id="changes">11. Changes to This Policy</SectionHeading>
              <P>
                We will notify users of material changes via email (if provided) and by posting the updated policy on this
                page with a revised effective date. Continued use of the platform after changes constitutes acceptance.
              </P>
            </section>

            {/* 12. Contact */}
            <section>
              <SectionHeading id="contact">12. Contact &amp; Data Protection Officer</SectionHeading>
              <P>
                For any privacy questions, data subject requests, or to reach our Data Protection Officer, contact us at{' '}
                <a href={`mailto:${site.email}`} className="text-brand underline underline-offset-2">
                  {site.email}
                </a>{' '}
                or by phone at <strong>{site.phone}</strong>.
              </P>
            </section>
          </div>
        </div>
      </section>

      <div className="no-print">
        <CTASection
          title="Questions about your data?"
          subtitle="We are happy to walk you through how your information is handled."
          primary={{ label: 'Contact Us', href: '/contact' }}
        />
      </div>
    </>
  );
}