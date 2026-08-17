import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative overflow-hidden py-24 lg:py-32">
      <div className="absolute top-0 right-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(45,157,120,0.06),transparent_70%)] -z-10" />
      <div className="absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,116,1,0.05),transparent_70%)] -z-10" />
      <div className="container-lux">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-heading text-7xl font-extrabold text-brand-gradient sm:text-8xl">404</p>
          <h1 className="mb-4 mt-2 font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
            Page not found
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            The page you are looking for may have moved or no longer exists. Let us guide you back to safety.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="btn-brand text-sm">
              <Home className="h-4 w-4" /> Back to Home
            </Link>
            <Link href="/about/blog" className="btn-brand-outline text-sm">
              <Search className="h-4 w-4" /> Explore the Blog
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand">
              Contact Us <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}