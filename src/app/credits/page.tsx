'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Credit {
  user_id: string
  credits: number
  email?: string
  phone_number?: string
  name?: string
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    fetchCredits()
  }, [router])

  const fetchCredits = async () => {
    try {
      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')

      if (usersError) throw usersError

      // Fetch all user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, name, phone_number')

      if (profilesError) throw profilesError

      // Create profiles map
      const profilesMap = new Map(
        profilesData?.map(profile => [profile.user_id, profile]) || []
      )

      // Fetch all credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('user_id, credits')

      if (creditsError) throw creditsError

      // Combine users with their credits (default to 2 if not found)
      const creditsMap = new Map(creditsData?.map(c => [c.user_id, c.credits]) || [])

      const combinedData = usersData?.map(user => ({
        user_id: user.id,
        credits: creditsMap.get(user.id) ?? 2, // Default to 2 credits
        email: user.email,
        name: profilesMap.get(user.id)?.name,
        phone_number: profilesMap.get(user.id)?.phone_number
      })) || []

      setCredits(combinedData)
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (userId: string, currentCredits: number) => {
    setEditingId(userId)
    setEditValue(currentCredits)
  }

  const handleSave = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_credits')
        .update({ credits: editValue })
        .eq('user_id', userId)

      if (error) throw error

      setCredits(credits.map(credit =>
        credit.user_id === userId ? { ...credit, credits: editValue } : credit
      ))
      setEditingId(null)
    } catch (error) {
      console.error('Error updating credits:', error)
      alert('Failed to update credits')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
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
            <h1 className="text-3xl font-bold text-gray-900">User Credits</h1>
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
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {credits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No credits found
                        </td>
                      </tr>
                    ) : (
                      credits.map((credit) => (
                        <tr key={credit.user_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {credit.user_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {credit.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {credit.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {credit.phone_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingId === credit.user_id ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(Number(e.target.value))}
                                className="w-20 px-2 py-1 border rounded"
                              />
                            ) : (
                              credit.credits
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {editingId === credit.user_id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSave(credit.user_id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(credit.user_id, credit.credits)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                            )}
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
