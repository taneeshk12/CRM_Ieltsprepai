-- Migration: Add SEO fields to blog_posts table
-- Description: Adds essential SEO fields for better optimization and tracking
-- Date: 2026-02-03

-- Add SEO-related columns
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS focus_keyword TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT,
ADD COLUMN IF NOT EXISTS og_image_url TEXT,
ADD COLUMN IF NOT EXISTS reading_time INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Guide',
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured, is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_views ON blog_posts(views DESC);

-- Add comments to columns for documentation
COMMENT ON COLUMN blog_posts.meta_title IS 'SEO-optimized title (50-60 chars recommended)';
COMMENT ON COLUMN blog_posts.meta_description IS 'SEO meta description (155-160 chars recommended)';
COMMENT ON COLUMN blog_posts.focus_keyword IS 'Primary keyword to rank for';
COMMENT ON COLUMN blog_posts.canonical_url IS 'Canonical URL for duplicate content prevention';
COMMENT ON COLUMN blog_posts.og_image_url IS 'Open Graph image URL (1200x630px recommended)';
COMMENT ON COLUMN blog_posts.reading_time IS 'Estimated reading time in minutes';
COMMENT ON COLUMN blog_posts.word_count IS 'Total word count of the post';
COMMENT ON COLUMN blog_posts.seo_score IS 'SEO quality score (0-100)';
COMMENT ON COLUMN blog_posts.category IS 'Post category (Guide, Tips, Strategy, etc.)';
COMMENT ON COLUMN blog_posts.featured IS 'Whether post is featured on homepage';
COMMENT ON COLUMN blog_posts.views IS 'Total page views count';
COMMENT ON COLUMN blog_posts.last_updated IS 'Last content update timestamp';

-- Update existing posts with default SEO values
UPDATE blog_posts 
SET 
  meta_title = COALESCE(meta_title, title),
  meta_description = COALESCE(meta_description, LEFT(description, 160)),
  canonical_url = COALESCE(canonical_url, 'https://ieltsprepai.tech/blog/' || slug),
  og_image_url = COALESCE(og_image_url, image_url, 'https://ieltsprepai.tech/og-image.jpg'),
  reading_time = COALESCE(reading_time, GREATEST(5, LENGTH(content) / 1000)),
  word_count = COALESCE(word_count, array_length(string_to_array(content, ' '), 1)),
  category = COALESCE(category, 'Guide'),
  last_updated = COALESCE(last_updated, updated_at, created_at)
WHERE meta_title IS NULL 
   OR meta_description IS NULL 
   OR canonical_url IS NULL;

-- Create a function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_blog_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_updated on content changes
DROP TRIGGER IF EXISTS trigger_update_blog_last_updated ON blog_posts;
CREATE TRIGGER trigger_update_blog_last_updated
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR 
        OLD.title IS DISTINCT FROM NEW.title OR
        OLD.description IS DISTINCT FROM NEW.description)
  EXECUTE FUNCTION update_blog_last_updated();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Blog SEO fields migration completed successfully!';
  RAISE NOTICE 'Added fields: meta_title, meta_description, focus_keyword, canonical_url, og_image_url, reading_time, word_count, seo_score, category, featured, views, last_updated';
  RAISE NOTICE 'Created indexes: slug, published, category, featured, views';
  RAISE NOTICE 'Created trigger: auto-update last_updated timestamp';
END $$;
