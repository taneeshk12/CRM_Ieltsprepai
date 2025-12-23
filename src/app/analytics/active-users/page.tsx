'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface ActiveUsersData {
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  totalUsers: number
  dauByDay: Array<{ date: string; count: number }>
  topActiveUsers: Array<{
    userId: string
    name: string
    email: string
    activityCount: number
    lastActive: string
  }>
  activityDistribution: Array<{
    date: string
    essays: number
    tests: number
    reading: number
    speaking: number
  }>
}

export default function ActiveUsersPage() {
  const [data, setData] = useState<ActiveUsersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d'>('30d')
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
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        let filterDate = thirtyDaysAgo
        if (timeFilter === '7d') filterDate = sevenDaysAgo
        else if (timeFilter === '90d') filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

        // Get total users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false)

        // Get activities from all tables
        const [essays, tests, reading, speaking] = await Promise.all([
          supabase.from('user_essays').select('user_id, created_at').gte('created_at', filterDate.toISOString()),
          supabase.from('user_full_writing_tests').select('user_id, created_at').gte('created_at', filterDate.toISOString()),
          supabase.from('user_reading').select('user_id, created_at').gte('created_at', filterDate.toISOString()),
          supabase.from('user_speaking').select('user_id, created_at').gte('created_at', filterDate.toISOString())
        ])

        // Calculate DAU, WAU, MAU
        const dauSet = new Set<string>()
        const wauSet = new Set<string>()
        const mauSet = new Set<string>()

        const allActivities = [
          ...(essays.data || []),
          ...(tests.data || []),
          ...(reading.data || []),
          ...(speaking.data || [])
        ]

        allActivities.forEach(activity => {
          if (!activity.user_id) return
          const activityDate = new Date(activity.created_at)
          
          if (activityDate >= oneDayAgo) dauSet.add(activity.user_id)
          if (activityDate >= sevenDaysAgo) wauSet.add(activity.user_id)
          if (activityDate >= thirtyDaysAgo) mauSet.add(activity.user_id)
        })

        // DAU by day
        const dauByDay = new Map<string, Set<string>>()
        allActivities.forEach(activity => {
          if (!activity.user_id) return
          const date = new Date(activity.created_at).toISOString().split('T')[0]
          if (!dauByDay.has(date)) dauByDay.set(date, new Set())
          dauByDay.get(date)!.add(activity.user_id)
        })

        const dauByDayArray = Array.from(dauByDay.entries())
          .map(([date, users]) => ({ date, count: users.size }))
          .sort((a, b) => a.date.localeCompare(b.date))

        // Activity distribution by day
        const activityByDay = new Map<string, { essays: number, tests: number, reading: number, speaking: number }>()
        
        essays.data?.forEach(e => {
          const date = new Date(e.created_at).toISOString().split('T')[0]
          if (!activityByDay.has(date)) activityByDay.set(date, { essays: 0, tests: 0, reading: 0, speaking: 0 })
          activityByDay.get(date)!.essays++
        })
        
        tests.data?.forEach(t => {
          const date = new Date(t.created_at).toISOString().split('T')[0]
          if (!activityByDay.has(date)) activityByDay.set(date, { essays: 0, tests: 0, reading: 0, speaking: 0 })
          activityByDay.get(date)!.tests++
        })
        
        reading.data?.forEach(r => {
          const date = new Date(r.created_at).toISOString().split('T')[0]
          if (!activityByDay.has(date)) activityByDay.set(date, { essays: 0, tests: 0, reading: 0, speaking: 0 })
          activityByDay.get(date)!.reading++
        })
        
        speaking.data?.forEach(s => {
          const date = new Date(s.created_at).toISOString().split('T')[0]
          if (!activityByDay.has(date)) activityByDay.set(date, { essays: 0, tests: 0, reading: 0, speaking: 0 })
          activityByDay.get(date)!.speaking++
        })

        const activityDistribution = Array.from(activityByDay.entries())
          .map(([date, counts]) => ({ date, ...counts }))
          .sort((a, b) => a.date.localeCompare(b.date))

        // Top active users
        const userActivityCount = new Map<string, { count: number, lastActive: string }>()
        allActivities.forEach(activity => {
          if (!activity.user_id) return
          const current = userActivityCount.get(activity.user_id) || { count: 0, lastActive: activity.created_at }
          userActivityCount.set(activity.user_id, {
            count: current.count + 1,
            lastActive: activity.created_at > current.lastActive ? activity.created_at : current.lastActive
          })
        })

        // Get user details
        const userIds = Array.from(userActivityCount.keys())
        const { data: users } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds)

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, name')
          .in('user_id', userIds)

        const userMap = new Map(users?.map(u => [u.id, u.email]) || [])
        const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || [])

        const topActiveUsers = Array.from(userActivityCount.entries())
          .map(([userId, data]) => ({
            userId,
            email: userMap.get(userId) || 'Unknown',
            name: profileMap.get(userId) || userMap.get(userId) || 'Unknown',
            activityCount: data.count,
            lastActive: data.lastActive
          }))
          .sort((a, b) => b.activityCount - a.activityCount)
          .slice(0, 20)

        setData({
          dailyActiveUsers: dauSet.size,
          weeklyActiveUsers: wauSet.size,
          monthlyActiveUsers: mauSet.size,
          totalUsers: totalUsers || 0,
          dauByDay: dauByDayArray,
          topActiveUsers,
          activityDistribution
        })

      } catch (error) {
        console.error('Error fetching active users data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, timeFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading active users analytics...</div>
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
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Active Users Analytics</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeFilter('7d')}
                className={`px-4 py-2 rounded ${timeFilter === '7d' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeFilter('30d')}
                className={`px-4 py-2 rounded ${timeFilter === '30d' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeFilter('90d')}
                className={`px-4 py-2 rounded ${timeFilter === '90d' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                90 Days
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Daily Active Users</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.dailyActiveUsers}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {data?.totalUsers ? ((data.dailyActiveUsers / data.totalUsers) * 100).toFixed(1) : 0}% of total
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Weekly Active Users</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.weeklyActiveUsers}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {data?.totalUsers ? ((data.weeklyActiveUsers / data.totalUsers) * 100).toFixed(1) : 0}% of total
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Monthly Active Users</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.monthlyActiveUsers}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {data?.totalUsers ? ((data.monthlyActiveUsers / data.totalUsers) * 100).toFixed(1) : 0}% of total
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Total Users</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.totalUsers}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  All registered users
                </div>
              </div>
            </div>
          </div>

          {/* DAU Trend */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Active Users Trend</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.dauByDay.slice(-30).reverse().map((day) => (
                    <tr key={day.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data?.totalUsers ? ((day.count / data.totalUsers) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Distribution */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Distribution by Day</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Essays</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Tests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reading</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speaking</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.activityDistribution.slice(-30).reverse().map((day) => (
                    <tr key={day.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.essays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.tests}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.reading}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.speaking}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {day.essays + day.tests + day.reading + day.speaking}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Active Users */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Active Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Activities</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.topActiveUsers.map((user, index) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.activityCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.lastActive).toLocaleString()}
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
