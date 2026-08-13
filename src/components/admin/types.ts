export type PostStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';

export interface AdminPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: PostStatus;
  isFeatured: boolean;
  authorName: string;
  categoryName: string;
  publishedAt: string | null;
  updatedAt: string;
  featuredImageUrl: string | null;
  authorId?: string | null;
  categoryId?: string | null;
  contentMarkdown?: string;
  contentHtml?: string;
  readingMinutes?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string | null;
}

export interface Author {
  id: string;
  full_name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface AdminIdentity {
  email: string;
  full_name: string;
  role: string;
}
