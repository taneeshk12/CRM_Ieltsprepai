'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name?: string
}

interface SendEmailResponse {
  success?: boolean
  message?: string
  error?: string
  details?: { email: string; status: string }[]
}

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .content { padding: 20px; background-color: #f9fafb; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to IELTS Prep</h1>
    </div>
    
    <div class="content">
      <h2>Hello User!</h2>
      <p>Thank you for joining our IELTS preparation platform. We're excited to help you achieve your target score.</p>
      
      <p>With our platform, you can:</p>
      <ul>
        <li>Practice full-length IELTS writing tests</li>
        <li>Get detailed feedback on your essays</li>
        <li>Track your progress over time</li>
        <li>Learn from expert corrections</li>
      </ul>
      
      <p style="margin-top: 20px;">
        <a href="https://yoursite.com" class="button">Get Started</a>
      </p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 IELTS Prep. All rights reserved.</p>
      <p>You received this email because you signed up for our service.</p>
    </div>
  </div>
</body>
</html>`

export default function SendEmailPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [subject, setSubject] = useState('Welcome to IELTS Prep!')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [showPreview, setShowPreview] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    fetchUsers()
  }, [router])

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, name')

      if (profilesError) throw profilesError

      const profilesMap = new Map(
        profilesData?.map(profile => [profile.user_id, profile.name]) || []
      )

      const usersWithNames = usersData?.map(user => ({
        id: user.id,
        email: user.email,
        name: profilesMap.get(user.id),
      })) || []

      setUsers(usersWithNames)
    } catch (error) {
      console.error('Error fetching users:', error)
      setMessage({ type: 'error', text: 'Failed to fetch users' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set())
      setSelectAll(false)
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)))
      setSelectAll(true)
    }
  }

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
    setSelectAll(newSelected.size === users.length)
  }

  const handleSendEmails = async () => {
    if (selectedUsers.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one user' })
      return
    }

    if (!subject.trim()) {
      setMessage({ type: 'error', text: 'Please enter a subject' })
      return
    }

    if (!template.trim()) {
      setMessage({ type: 'error', text: 'Please enter email template' })
      return
    }

    setSending(true)
    setMessage(null)

    try {
      const selectedUserEmails = users
        .filter(u => selectedUsers.has(u.id))
        .map(u => u.email)

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: selectedUserEmails,
          subject: subject,
          template: template,
        }),
      })

      const data: SendEmailResponse = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Emails sent successfully',
        })
        setSelectedUsers(new Set())
        setSelectAll(false)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send emails' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error: ' + String(error) })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Send Emails</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {message && (
          <div
            className={`mb-4 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Template Section */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Template</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter email subject"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Template (HTML)
                </label>
                <textarea
                  value={template}
                  onChange={e => setTemplate(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  placeholder="Enter HTML email template"
                />
              </div>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>

              {showPreview && (
                <div className="mt-4 border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-bold text-gray-900 mb-2">Preview</h3>
                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Subject:</strong> {subject}
                    </p>
                    <iframe
                      srcDoc={template}
                      className="w-full border rounded"
                      style={{ height: '400px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Selection Section */}
          <div>
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recipients</h2>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Select All ({users.length})
                  </span>
                </label>
              </div>

              <div className="border-t pt-4">
                <div className="max-h-96 overflow-y-auto">
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-sm">No users found</p>
                  ) : (
                    users.map(user => (
                      <label key={user.id} className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {user.name ? `${user.name} (${user.email})` : user.email}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <strong>Selected:</strong> {selectedUsers.size} of {users.length}
                </p>
              </div>

              <button
                onClick={handleSendEmails}
                disabled={sending || selectedUsers.size === 0}
                className={`w-full mt-4 px-4 py-2 rounded-md text-white font-medium ${
                  sending || selectedUsers.size === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {sending ? 'Sending...' : 'Send Emails'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
