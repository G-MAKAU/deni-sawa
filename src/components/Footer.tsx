'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, ArrowRight, Send, CheckCircle2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { business, services } from '@/data/content';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); setTimeout(() => setSubscribed(false), 4000); }
  };

  const quickLinks = [
    { label: 'Home', href: '/', active: true },
    { label: 'About', href: '/about', active: true },
    { label: 'Services', href: '/services', active: true },
    { label: 'Academy', href: '/academy', active: true },
    { label: 'Blog', href: '/blog', active: true },
  ];

  const helpLinks = [
    { label: 'Book Consultation', href: '/contact', active: true },
    { label: 'Contact', href: '/contact', active: true },
    { label: 'FAQs', href: '/contact', active: true },
  ];

  return (
    <footer id="contact" className="relative bg-ink-900 text-white/60 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.10),transparent_70%)]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.10),transparent_70%)]" />
      </div>

      {/* Contact section */}
      <div className="border-b border-white/5">
        <div className="container-lux py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <Reveal><div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand mb-5">Get in Touch</div></Reveal>
              <Reveal delay={100}>
                <h2 className="font-heading text-3xl lg:text-4xl font-bold text-white leading-tight mb-5">
                  Let's start your journey to<span className="block text-brand-gradient mt-1">financial freedom</span>
                </h2>
              </Reveal>
              <Reveal delay={200}><p className="text-base text-white/50 leading-relaxed mb-8 max-w-md">{business.description}</p></Reveal>
              <div className="space-y-4">
                <Reveal delay={300}>
                  <a href={`mailto:${business.email}`} className="group flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand transition-all duration-300 group-hover:bg-brand group-hover:text-white"><Mail className="h-5 w-5" /></div>
                    <div><div className="text-xs text-white/40 uppercase tracking-widest">Email</div><div className="text-sm font-medium text-white">{business.email}</div></div>
                  </a>
                </Reveal>
                <Reveal delay={400}>
                  <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="group flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green/15 text-green transition-all duration-300 group-hover:bg-green group-hover:text-white"><Phone className="h-5 w-5" /></div>
                    <div><div className="text-xs text-white/40 uppercase tracking-widest">Phone</div><div className="text-sm font-medium text-white">{business.phone}</div></div>
                  </a>
                </Reveal>
                <Reveal delay={500}>
                  <div className="group flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand"><MapPin className="h-5 w-5" /></div>
                    <div><div className="text-xs text-white/40 uppercase tracking-widest">Location</div><div className="text-sm font-medium text-white">Nairobi, Kenya</div></div>
                  </div>
                </Reveal>
              </div>
            </div>

            <Reveal direction="right">
              <div className="rounded-4xl border border-white/10 bg-white/10 p-8">
                <h3 className="font-heading text-xl font-bold text-white mb-6">Send us a message</h3>
                <form className="space-y-4" onSubmit={handleSubscribe}>
                  <Input type="text" placeholder="Your name" className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand" />
                  <Input type="email" placeholder="Your email" required value={email} onChange={(e) => setEmail(e.target.value)} className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand" />
                  <Textarea placeholder="How can we help you?" rows={4} className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand" />
                  <button type="submit" className="btn-brand w-full">
                    {subscribed ? <><CheckCircle2 className="h-4 w-4" />Message Sent</> : <><Send className="h-4 w-4" />Send Message</>}
                  </button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-lux py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          <div className="col-span-2 lg:col-span-2">
            <img src={business.logo} alt="Deni Sawa" className="h-16 w-auto mb-5 brightness-0 invert" decoding="async" />
            <p className="text-sm text-white/40 leading-relaxed mb-6 max-w-xs">{business.description}</p>
            <div className="flex items-center gap-3">
              <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:bg-brand hover:text-white hover:border-brand"><Facebook className="h-4 w-4" /></a>
              <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:bg-green hover:text-white hover:border-green"><Instagram className="h-4 w-4" /></a>
              <a href={business.linkedin} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-all duration-300 hover:bg-brand hover:text-white hover:border-brand"><Linkedin className="h-4 w-4" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-widest mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link href={link.href} className="text-sm inline-flex items-center gap-1.5 group text-white/60 hover:text-brand transition-colors">
                      <ArrowRight className="h-3 w-3 opacity-0 -ml-4 transition-all duration-300 group-hover:opacity-100 group-hover:ml-0" />
                      {link.label}
                    </Link>
                  ) : (
                    <span className={`text-sm inline-flex items-center gap-1.5 group ${link.active ? 'text-white/60 hover:text-brand cursor-pointer' : 'text-white/30 cursor-not-allowed'}`}>
                      <ArrowRight className="h-3 w-3 opacity-0 -ml-4 transition-all duration-300 group-hover:opacity-100 group-hover:ml-0" />
                      {link.label}
                      {!link.active && <Badge variant="soon" className="px-1.5 py-0 text-[8px]">Soon</Badge>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-widest mb-4">Services</h4>
            <ul className="space-y-3">
              {services.slice(0, 5).map((s) => (
                <li key={s.title}>
                  <Link href={`/services/${s.slug}`} className="text-sm text-white/60 hover:text-brand transition-colors inline-flex items-center gap-1.5 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 transition-all duration-300 group-hover:opacity-100 group-hover:ml-0" />
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-widest mb-4">Help & Support</h4>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <span className={`text-sm inline-flex items-center gap-1.5 group ${link.active ? 'text-white/60 hover:text-brand cursor-pointer' : 'text-white/30 cursor-not-allowed'}`}>
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 transition-all duration-300 group-hover:opacity-100 group-hover:ml-0" />
                    {link.label}
                    {!link.active && <Badge variant="soon" className="px-1.5 py-0 text-[8px]">Soon</Badge>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-widest mb-4">Newsletter</h4>
            <p className="text-sm text-white/40 mb-4">Subscribe to receive Deni Sawa updates.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <Input type="email" placeholder="Your email" required value={email} onChange={(e) => setEmail(e.target.value)} className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-brand" />
              <button type="submit" className="btn-brand text-sm w-full">
                {subscribed ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-lux py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} {business.fullName}. All rights reserved.</p>
          <p className="text-xs text-white/40">Professional · Ethical · Successful · Sustainable</p>
        </div>
      </div>
    </footer>
  );
}
