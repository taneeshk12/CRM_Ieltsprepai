'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface BlogPost {
  id: string
  slug: string
  title: string
  description: string
  content: string
  author: string
  published_at: string | null
  is_published: boolean
  image_url: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setPosts(posts.filter(post => post.id !== id))
      alert('Blog post deleted successfully!')
    } catch (error) {
      console.error('Error deleting blog post:', error)
      alert('Failed to delete blog post')
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const updateData: any = {
        is_published: !currentStatus,
        updated_at: new Date().toISOString()
      }

      // Set published_at when publishing for the first time
      if (!currentStatus) {
        updateData.published_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      
      setPosts(posts.map(post => 
        post.id === id 
          ? { ...post, is_published: !currentStatus, published_at: updateData.published_at || post.published_at }
          : post
      ))
      alert(`Blog post ${!currentStatus ? 'published' : 'unpublished'} successfully!`)
    } catch (error) {
      console.error('Error toggling publish status:', error)
      alert('Failed to update blog post')
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterPublished === 'all' ? true :
                         filterPublished === 'published' ? post.is_published :
                         !post.is_published

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading blog posts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
            </div>
            <Link
              href="/blog/new"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + New Blog Post
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, description, or tags..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterPublished('all')}
                    className={`px-4 py-2 rounded-lg ${filterPublished === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterPublished('published')}
                    className={`px-4 py-2 rounded-lg ${filterPublished === 'published' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Published
                  </button>
                  <button
                    onClick={() => setFilterPublished('draft')}
                    className={`px-4 py-2 rounded-lg ${filterPublished === 'draft' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Drafts
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Posts</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">{posts.length}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Published</div>
              <div className="mt-1 text-3xl font-semibold text-green-600">
                {posts.filter(p => p.is_published).length}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Drafts</div>
              <div className="mt-1 text-3xl font-semibold text-yellow-600">
                {posts.filter(p => !p.is_published).length}
              </div>
            </div>
          </div>

          {/* Blog Posts List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No blog posts found. Create your first blog post!
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-md">{post.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          post.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.published_at 
                          ? new Date(post.published_at).toLocaleDateString()
                          : new Date(post.created_at).toLocaleDateString()
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            href={`/blog/edit/${post.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleTogglePublish(post.id, post.is_published)}
                            className={`${
                              post.is_published 
                                ? 'text-yellow-600 hover:text-yellow-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {post.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
