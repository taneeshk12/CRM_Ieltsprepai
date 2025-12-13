'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Essay {
  id: number
  user_id: string
  task: string
  question: string
  essay: string
  band: string
  feedback: object
  suggestions: string
  corrected_essay: string
  created_at: string
  user?: {
    email: string
    user_profiles: {
      name: string
      phone_number: string
    }[]
  }
}

export default function EssaysPage() {
  const [essays, setEssays] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    fetchEssays()
  }, [router])

  const fetchEssays = async () => {
    try {
      // Fetch essays
      const { data: essaysData, error: essaysError } = await supabase
        .from('user_essays')
        .select('*')
        .order('created_at', { ascending: false })

      if (essaysError) throw essaysError

      // Get unique user IDs from essays
      const userIds = [...new Set(essaysData?.map(essay => essay.user_id) || [])]

      if (userIds.length === 0) {
        setEssays([])
        return
      }

      // Fetch user details separately
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

      if (usersError) throw usersError

      // Fetch user profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, name, phone_number')
        .in('user_id', userIds)

      if (profilesError) throw profilesError

      // Create profiles map
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.user_id, profile]) || []
      )

      // Create user map with profiles
      const userMap = new Map(
        usersData?.map(user => [
          user.id,
          {
            email: user.email,
            user_profiles: profilesMap.has(user.id) ? [profilesMap.get(user.id)!] : []
          }
        ]) || []
      )

      // Combine essays with user data
      const essaysWithUsers = essaysData?.map(essay => ({
        ...essay,
        user: userMap.get(essay.user_id)
      })) || []

      setEssays(essaysWithUsers)
    } catch (error) {
      console.error('Error fetching essays:', error)
    } finally {
      setLoading(false)
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
            <h1 className="text-3xl font-bold text-gray-900">Essays</h1>
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
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Band
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {essays.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No essays found
                        </td>
                      </tr>
                    ) : (
                      essays.map((essay) => (
                        <tr key={essay.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {essay.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {essay.user?.user_profiles?.[0]?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {essay.user?.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {essay.task}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {essay.band}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(essay.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
