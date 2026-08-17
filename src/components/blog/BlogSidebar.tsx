import Link from 'next/link';
import { Clock, MessageSquare, ChevronRight, ArrowRight } from 'lucide-react';
import { getBlogPosts, getRecentBlogComments } from '@/lib/supabase/queries';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

interface BlogSidebarProps {
  currentSlug: string;
}

export async function BlogSidebar({ currentSlug }: BlogSidebarProps) {
  const [recentPosts, recentComments] = await Promise.all([
    getBlogPosts({ limit: 5 }).catch(() => []),
    getRecentBlogComments(5).catch(() => []),
  ]);

  const posts = recentPosts.filter((post) => post.slug !== currentSlug).slice(0, 4);
  const comments = recentComments.slice(0, 4);

  return (
    <aside className="w-full space-y-8">
      {/* Recent Posts */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <header className="flex items-center gap-3 border-b border-border px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Clock className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">Recent Posts</h3>
            <p className="text-xs text-muted-foreground">Latest from the Deni Sawa blog</p>
          </div>
        </header>

        <div className="divide-y divide-border">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link
                key={post.slug}
                href={`/about/blog/${post.slug}`}
                className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
              >
                <BlogCoverImage
                  src={post.cover_image_url}
                  alt={post.title}
                  className="h-14 w-16 shrink-0 rounded-xl"
                  fallbackTextSize="text-xs"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-brand">
                    {post.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(post.published_at)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            ))
          ) : (
            <p className="px-6 py-6 text-sm text-muted-foreground">No posts yet.</p>
          )}
        </div>

        <footer className="border-t border-border px-6 py-4">
          <Link
            href="/about/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-all duration-300 hover:gap-2.5"
          >
            View all posts <ArrowRight className="h-4 w-4" />
          </Link>
        </footer>
      </section>

      {/* Recent Comments */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <header className="flex items-center gap-3 border-b border-border px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-growth/10 text-growth">
            <MessageSquare className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">Recent Comments</h3>
            <p className="text-xs text-muted-foreground">Latest conversations from readers</p>
          </div>
        </header>

        <div className="divide-y divide-border">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <Link
                key={comment.id}
                href={`/about/blog/${comment.post_slug}#comments`}
                className="group block px-6 py-4 transition-colors hover:bg-muted/40"
              >
                <p className="line-clamp-3 text-sm leading-relaxed text-foreground/80 transition-colors group-hover:text-foreground">
                  “{comment.content}”
                </p>
                <p className="mt-2.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{comment.author_name}</span> on{' '}
                  <span className="text-brand transition-colors group-hover:underline">{comment.post_title}</span>
                </p>
              </Link>
            ))
          ) : (
            <p className="px-6 py-6 text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
      </section>
    </aside>
  );
}