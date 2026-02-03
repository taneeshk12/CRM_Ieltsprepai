'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type BlogInsertPayload = {
  title: string
  slug: string
  description: string
  content: string
  author: string
  image_url: string | null
  tags: string[]
  is_published: boolean
  updated_at: string
  meta_title: string
  meta_description: string
  focus_keyword: string | null
  canonical_url: string
  og_image_url: string | null
  reading_time: number
  word_count: number
  seo_score: number
  category: string
  featured: boolean
  views: number
  last_updated: string
  published_at?: string
}

export default function NewBlogPost() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    author: 'IELTSPrepAI',
    image_url: '',
    tags: '',
    is_published: false,
    // SEO fields
    meta_title: '',
    meta_description: '',
    focus_keyword: '',
    canonical_url: '',
    og_image_url: '',
    reading_time: 5,
    word_count: 0,
    seo_score: 0,
    category: 'Guide',
    featured: false
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

  const postData: BlogInsertPayload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        content: formData.content,
        author: formData.author,
        image_url: formData.image_url || null,
        tags: tagsArray,
        is_published: formData.is_published,
        updated_at: new Date().toISOString(),
        // SEO fields
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.description.slice(0, 160),
        focus_keyword: formData.focus_keyword || null,
        canonical_url: formData.canonical_url || `https://ieltsprepai.tech/blog/${formData.slug}`,
        og_image_url: formData.og_image_url || formData.image_url || null,
        reading_time: Math.max(5, Math.round((formData.content || '').split(/\s+/).length / 200)),
        word_count: (formData.content || '').split(/\s+/).filter(Boolean).length,
        seo_score: formData.seo_score || 0,
        category: formData.category || 'Guide',
        featured: formData.featured || false,
        views: 0,
        last_updated: new Date().toISOString()
      }

      // Set published_at if publishing
      if (formData.is_published) {
        postData.published_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('blog_posts')
        .insert([postData])

      if (error) throw error

      alert('Blog post created successfully!')
      router.push('/blog')
    } catch (err) {
      const error = err as { code?: string; message?: string }
      console.error('Error creating blog post:', error)
      if (error.code === '23505') {
        alert('A blog post with this slug already exists. Please use a different title or slug.')
      } else {
        alert('Failed to create blog post: ' + (error.message ?? String(error)))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/blog" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 block">
            ← Back to Blog Management
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Blog Post</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-black mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Enter blog post title"
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-black mb-2">
                Slug * (URL-friendly version)
              </label>
              <input
                type="text"
                id="slug"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="blog-post-slug"
              />
              <p className="mt-1 text-sm text-gray-500">
                Auto-generated from title, but you can edit it
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
                Description * (SEO meta description)
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Brief description for SEO and social media"
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-black mb-2">
                Content * (Supports HTML and Markdown)
              </label>
              <textarea
                id="content"
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm text-gray-900 bg-white"
                placeholder="Write your blog post content here..."
              />
            </div>

            {/* Author */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-black mb-2">
                Author
              </label>
              <input
                type="text"
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Author name"
              />
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-black mb-2">
                Featured Image URL
              </label>
              <input
                type="url"
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-black mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="IELTS, Writing, Tips, Preparation"
              />
            </div>

            {/* Meta Title */}
            <div>
              <label htmlFor="meta_title" className="block text-sm font-medium text-black mb-2">Meta Title</label>
              <input
                id="meta_title"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="SEO title (50-60 chars recommended)"
              />
            </div>

            {/* Meta Description */}
            <div>
              <label htmlFor="meta_description" className="block text-sm font-medium text-black mb-2">Meta Description</label>
              <textarea
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="SEO meta description (155-160 chars recommended)"
              />
            </div>

            {/* Focus Keyword */}
            <div>
              <label htmlFor="focus_keyword" className="block text-sm font-medium text-black mb-2">Focus Keyword</label>
              <input
                id="focus_keyword"
                value={formData.focus_keyword}
                onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                placeholder="Primary keyword to target"
              />
            </div>

            {/* Category & Featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-black mb-2">Category</label>
                <input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">Feature on homepage</label>
              </div>
            </div>

            {/* Publish Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                Publish immediately
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : formData.is_published ? 'Create & Publish' : 'Save as Draft'}
              </button>
              <Link
                href="/blog"
                className="flex-1 bg-gray-200 text-black px-6 py-3 rounded-lg hover:bg-gray-300 text-center transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
