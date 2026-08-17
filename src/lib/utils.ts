import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind-merge doesn't know the custom typography sizes (text-h1/h2/h3) or the
// semantic text colors (text-foreground, text-brand, …). Without this config it
// treats `text-h2` and `text-foreground` as conflicting font-size classes and
// silently drops one — so section headings render without their h2 size.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-h1", "text-h2", "text-h3"],
      "text-color": [
        "text-foreground",
        "text-muted-foreground",
        "text-card-foreground",
        "text-popover-foreground",
        "text-accent-foreground",
        "text-brand",
        "text-brand-50",
        "text-brand-100",
        "text-brand-200",
        "text-brand-300",
        "text-brand-400",
        "text-brand-500",
        "text-brand-600",
        "text-brand-700",
        "text-brand-800",
        "text-brand-900",
        "text-growth",
        "text-growth-50",
        "text-growth-100",
        "text-growth-200",
        "text-growth-300",
        "text-growth-400",
        "text-growth-500",
        "text-growth-600",
        "text-growth-700",
        "text-growth-800",
        "text-growth-900",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}