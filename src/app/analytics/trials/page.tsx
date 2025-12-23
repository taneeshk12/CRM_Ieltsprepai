'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface TrialData {
  totalTrialUsers: number
  activeTrials: number
  expiredTrials: number
  usedTrials: number
  conversionRate: number
  trialUsers: Array<{
    userId: string
    email: string
    name: string
    trialStart: string
    trialEnd: string
    isUsed: boolean
    status: string
    activitiesCount: number
  }>
  trialActivity: Array<{
    date: string
    newTrials: number
    expired: number
  }>
}

export default function TrialsPage() {
  const [data, setData] = useState<TrialData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)

        const now = new Date()

        // Get all trial users
        const { data: trials, error } = await supabase
          .from('user_trials')
          .select('*')
          .order('trial_start_time', { ascending: false })

        if (error) throw error

        const totalTrialUsers = trials?.length || 0
        const activeTrials = trials?.filter(t => new Date(t.trial_end_time) > now).length || 0
        const expiredTrials = trials?.filter(t => new Date(t.trial_end_time) <= now).length || 0
        const usedTrials = trials?.filter(t => t.is_trial_used).length || 0

        // Get payments to calculate conversion
        const trialUserIds = trials?.map(t => t.user_id) || []
        const { data: payments } = await supabase
          .from('user_payments')
          .select('user_id')
          .in('user_id', trialUserIds)
          .eq('status', 'completed')

        const convertedUsers = new Set(payments?.map(p => p.user_id)).size
        const conversionRate = totalTrialUsers > 0 ? (convertedUsers / totalTrialUsers) * 100 : 0

        // Get user details
        const { data: users } = await supabase
          .from('users')
          .select('id, email')
          .in('id', trialUserIds)

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, name')
          .in('user_id', trialUserIds)

        const userMap = new Map(users?.map(u => [u.id, u.email]) || [])
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || [])

        // Get activity counts for each trial user
        const [essays, tests, reading, speaking] = await Promise.all([
          supabase.from('user_essays').select('user_id').in('user_id', trialUserIds),
          supabase.from('user_full_writing_tests').select('user_id').in('user_id', trialUserIds),
          supabase.from('user_reading').select('user_id').in('user_id', trialUserIds),
          supabase.from('user_speaking').select('user_id').in('user_id', trialUserIds)
        ])

        const activityCountMap = new Map<string, number>()
        const countActivities = (activities: any[]) => {
          activities?.forEach(a => {
            if (a.user_id) {
              activityCountMap.set(a.user_id, (activityCountMap.get(a.user_id) || 0) + 1)
            }
          })
        }

        countActivities(essays.data || [])
        countActivities(tests.data || [])
        countActivities(reading.data || [])
        countActivities(speaking.data || [])

        const trialUsers = trials?.map(trial => {
          const trialEnd = new Date(trial.trial_end_time)
          let status = 'Active'
          if (trialEnd <= now) status = 'Expired'
          if (trial.is_trial_used) status = 'Used'

          return {
            userId: trial.user_id,
            email: userMap.get(trial.user_id) || 'Unknown',
            name: profileMap.get(trial.user_id) || userMap.get(trial.user_id) || 'Unknown',
            trialStart: trial.trial_start_time,
            trialEnd: trial.trial_end_time,
            isUsed: trial.is_trial_used,
            status,
            activitiesCount: activityCountMap.get(trial.user_id) || 0
          }
        }) || []

        // Trial activity by day (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const recentTrials = trials?.filter(t => new Date(t.trial_start_time) >= thirtyDaysAgo) || []

        const activityByDay = new Map<string, { newTrials: number; expired: number }>()
        recentTrials.forEach(trial => {
          const startDate = new Date(trial.trial_start_time).toISOString().split('T')[0]
          const endDate = new Date(trial.trial_end_time).toISOString().split('T')[0]

          const start = activityByDay.get(startDate) || { newTrials: 0, expired: 0 }
          activityByDay.set(startDate, { ...start, newTrials: start.newTrials + 1 })

          if (new Date(trial.trial_end_time) <= now) {
            const end = activityByDay.get(endDate) || { newTrials: 0, expired: 0 }
            activityByDay.set(endDate, { ...end, expired: end.expired + 1 })
          }
        })

        const trialActivity = Array.from(activityByDay.entries())
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date))

        setData({
          totalTrialUsers,
          activeTrials,
          expiredTrials,
          usedTrials,
          conversionRate,
          trialUsers,
          trialActivity
        })

      } catch (error) {
        console.error('Error fetching trial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading trial analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/analytics" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 block">
            ← Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Trial Users Analytics</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Total Trial Users</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{data?.totalTrialUsers}</div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Active Trials</div>
                <div className="mt-1 text-3xl font-semibold text-green-600">{data?.activeTrials}</div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Expired Trials</div>
                <div className="mt-1 text-3xl font-semibold text-red-600">{data?.expiredTrials}</div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Used Trials</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{data?.usedTrials}</div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Conversion Rate</div>
                <div className="mt-1 text-3xl font-semibold text-indigo-600">
                  {data?.conversionRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Trial Activity */}
          {data?.trialActivity && data.trialActivity.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Trial Activity (Last 30 Days)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Trials</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expired</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.trialActivity.slice(-15).reverse().map((day) => (
                      <tr key={day.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {day.newTrials}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {day.expired}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Trial Users */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Trial Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trial Start</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trial End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activities</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.trialUsers.map((user) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.trialStart).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.trialEnd).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'Active' ? 'bg-green-100 text-green-800' :
                          user.status === 'Expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.activitiesCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
