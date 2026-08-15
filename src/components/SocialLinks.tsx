import type { ComponentType } from 'react';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { site } from '@/data/site';

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export interface SocialLink {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  ariaLabel: string;
  /** Full hover styling (text + tinted background + border) for icon buttons. */
  hoverClass: string;
  /** Hover text color only, for inline icon links. */
  hoverTextClass: string;
}

export const socialLinks: SocialLink[] = [
  {
    name: 'Facebook',
    href: site.social.facebook,
    icon: Facebook,
    ariaLabel: 'Facebook',
    hoverClass: 'hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2]',
    hoverTextClass: 'hover:text-[#1877F2]',
  },
  {
    name: 'Instagram',
    href: site.social.instagram,
    icon: Instagram,
    ariaLabel: 'Instagram',
    hoverClass: 'hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10 hover:text-[#E4405F]',
    hoverTextClass: 'hover:text-[#E4405F]',
  },
  {
    name: 'LinkedIn',
    href: site.social.linkedin,
    icon: Linkedin,
    ariaLabel: 'LinkedIn',
    hoverClass: 'hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]',
    hoverTextClass: 'hover:text-[#0A66C2]',
  },
  {
    name: 'TikTok',
    href: site.social.tiktok,
    icon: TikTokIcon,
    ariaLabel: 'TikTok',
    hoverClass: 'hover:border-[#FE2C55]/40 hover:bg-[#FE2C55]/10 hover:text-[#FE2C55]',
    hoverTextClass: 'hover:text-[#FE2C55]',
  },
  {
    name: 'YouTube',
    href: site.social.youtube,
    icon: Youtube,
    ariaLabel: 'YouTube',
    hoverClass: 'hover:border-[#FF0000]/40 hover:bg-[#FF0000]/10 hover:text-[#FF0000]',
    hoverTextClass: 'hover:text-[#FF0000]',
  },
];
