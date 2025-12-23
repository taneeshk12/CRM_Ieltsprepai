'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface RetentionData {
  totalUsers: number
  activeUsersDay: number
  activeUsersWeek: number
  activeUsersMonth: number
  retentionDay1: number
  retentionDay7: number
  retentionDay30: number
  cohortData: Array<{
    cohort: string
    totalUsers: number
    day1: number
    day7: number
    day30: number
  }>
  engagementByFeature: Array<{
    feature: string
    activeUsers: number
    totalActivities: number
  }>
  churnedUsers: number
  reactivatedUsers: number
}

export default function RetentionPage() {
  const [data, setData] = useState<RetentionData | null>(null)
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
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Get all users
        const { data: allUsers } = await supabase
          .from('users')
          .select('id, created_at, is_deleted')
          .eq('is_deleted', false)

        const totalUsers = allUsers?.length || 0

        // Get activity from all tables
        const [essays, tests, reading, speaking] = await Promise.all([
          supabase.from('user_essays').select('user_id, created_at').gte('created_at', oneDayAgo.toISOString()),
          supabase.from('user_full_writing_tests').select('user_id, created_at').gte('created_at', oneDayAgo.toISOString()),
          supabase.from('user_reading').select('user_id, created_at').gte('created_at', oneDayAgo.toISOString()),
          supabase.from('user_speaking').select('user_id, created_at').gte('created_at', oneDayAgo.toISOString())
        ])

        // Calculate active users
        const activeUserIdsDay = new Set<string>()
        const activeUserIdsWeek = new Set<string>()
        const activeUserIdsMonth = new Set<string>()

        const processActivity = (activities: any[], timeThreshold: Date, targetSet: Set<string>) => {
          activities?.forEach(activity => {
            if (activity.user_id) {
              targetSet.add(activity.user_id)
              if (new Date(activity.created_at) >= sevenDaysAgo) activeUserIdsWeek.add(activity.user_id)
              if (new Date(activity.created_at) >= thirtyDaysAgo) activeUserIdsMonth.add(activity.user_id)
            }
          })
        }

        processActivity(essays.data || [], oneDayAgo, activeUserIdsDay)
        processActivity(tests.data || [], oneDayAgo, activeUserIdsDay)
        processActivity(reading.data || [], oneDayAgo, activeUserIdsDay)
        processActivity(speaking.data || [], oneDayAgo, activeUserIdsDay)

        // Get all activities for longer periods
        const [essaysAll, testsAll, readingAll, speakingAll] = await Promise.all([
          supabase.from('user_essays').select('user_id, created_at').gte('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('user_full_writing_tests').select('user_id, created_at').gte('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('user_reading').select('user_id, created_at').gte('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('user_speaking').select('user_id, created_at').gte('created_at', thirtyDaysAgo.toISOString())
        ])

        processActivity(essaysAll.data || [], sevenDaysAgo, activeUserIdsWeek)
        processActivity(testsAll.data || [], thirtyDaysAgo, activeUserIdsMonth)
        processActivity(readingAll.data || [], sevenDaysAgo, activeUserIdsWeek)
        processActivity(speakingAll.data || [], thirtyDaysAgo, activeUserIdsMonth)

        // Calculate retention rates
        const retentionDay1 = totalUsers > 0 ? (activeUserIdsDay.size / totalUsers) * 100 : 0
        const retentionDay7 = totalUsers > 0 ? (activeUserIdsWeek.size / totalUsers) * 100 : 0
        const retentionDay30 = totalUsers > 0 ? (activeUserIdsMonth.size / totalUsers) * 100 : 0

        // Cohort analysis by registration month
        const cohortMap = new Map<string, { users: Set<string>, day1Active: Set<string>, day7Active: Set<string>, day30Active: Set<string> }>()

        allUsers?.forEach(user => {
          const cohortMonth = new Date(user.created_at).toISOString().slice(0, 7)
          if (!cohortMap.has(cohortMonth)) {
            cohortMap.set(cohortMonth, {
              users: new Set(),
              day1Active: new Set(),
              day7Active: new Set(),
              day30Active: new Set()
            })
          }
          cohortMap.get(cohortMonth)!.users.add(user.id)
        })

        // Count activities by cohort
        const allActivities = [
          ...(essaysAll.data || []),
          ...(testsAll.data || []),
          ...(readingAll.data || []),
          ...(speakingAll.data || [])
        ]

        allActivities.forEach(activity => {
          if (!activity.user_id) return
          const user = allUsers?.find(u => u.id === activity.user_id)
          if (!user) return

          const cohortMonth = new Date(user.created_at).toISOString().slice(0, 7)
          const cohort = cohortMap.get(cohortMonth)
          if (!cohort) return

          const activityDate = new Date(activity.created_at)
          const userCreated = new Date(user.created_at)
          const daysSinceRegistration = (activityDate.getTime() - userCreated.getTime()) / (24 * 60 * 60 * 1000)

          if (daysSinceRegistration <= 1) cohort.day1Active.add(activity.user_id)
          if (daysSinceRegistration <= 7) cohort.day7Active.add(activity.user_id)
          if (daysSinceRegistration <= 30) cohort.day30Active.add(activity.user_id)
        })

        const cohortData = Array.from(cohortMap.entries())
          .map(([cohort, data]) => ({
            cohort,
            totalUsers: data.users.size,
            day1: data.users.size > 0 ? (data.day1Active.size / data.users.size) * 100 : 0,
            day7: data.users.size > 0 ? (data.day7Active.size / data.users.size) * 100 : 0,
            day30: data.users.size > 0 ? (data.day30Active.size / data.users.size) * 100 : 0
          }))
          .sort((a, b) => b.cohort.localeCompare(a.cohort))

        // Engagement by feature
        const essayUsers = new Set(essaysAll.data?.map(e => e.user_id).filter(Boolean))
        const testUsers = new Set(testsAll.data?.map(t => t.user_id).filter(Boolean))
        const readingUsers = new Set(readingAll.data?.map(r => r.user_id).filter(Boolean))
        const speakingUsers = new Set(speakingAll.data?.map(s => s.user_id).filter(Boolean))

        const engagementByFeature = [
          { feature: 'Essay Writing', activeUsers: essayUsers.size, totalActivities: essaysAll.data?.length || 0 },
          { feature: 'Full Writing Tests', activeUsers: testUsers.size, totalActivities: testsAll.data?.length || 0 },
          { feature: 'Reading Tests', activeUsers: readingUsers.size, totalActivities: readingAll.data?.length || 0 },
          { feature: 'Speaking Tests', activeUsers: speakingUsers.size, totalActivities: speakingAll.data?.length || 0 }
        ]

        // Churned and reactivated users
        const { data: deletedUsers } = await supabase
          .from('users')
          .select('*')
          .eq('is_deleted', true)

        const { data: reactivated } = await supabase
          .from('users')
          .select('*')
          .eq('is_deleted', false)
          .not('reactivated_at', 'is', null)

        setData({
          totalUsers,
          activeUsersDay: activeUserIdsDay.size,
          activeUsersWeek: activeUserIdsWeek.size,
          activeUsersMonth: activeUserIdsMonth.size,
          retentionDay1,
          retentionDay7,
          retentionDay30,
          cohortData,
          engagementByFeature,
          churnedUsers: deletedUsers?.length || 0,
          reactivatedUsers: reactivated?.length || 0
        })

      } catch (error) {
        console.error('Error fetching retention data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading retention analytics...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">User Retention Analytics</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Active (24h)</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.activeUsersDay}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {data?.retentionDay1.toFixed(1)}% of total
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Active (7 days)</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.activeUsersWeek}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {data?.retentionDay7.toFixed(1)}% of total
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Active (30 days)</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.activeUsersMonth}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {data?.retentionDay30.toFixed(1)}% of total
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
                  {data?.churnedUsers} churned
                </div>
              </div>
            </div>
          </div>

          {/* Cohort Analysis */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cohort Retention Analysis</h2>
            <p className="text-sm text-gray-600 mb-4">Retention rates by registration month</p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day 7</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day 30</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.cohortData.map((cohort) => (
                    <tr key={cohort.cohort}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(cohort.cohort).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cohort.totalUsers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className={`${cohort.day1 > 50 ? 'text-green-600' : cohort.day1 > 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {cohort.day1.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`${cohort.day7 > 40 ? 'text-green-600' : cohort.day7 > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {cohort.day7.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`${cohort.day30 > 30 ? 'text-green-600' : cohort.day30 > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {cohort.day30.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Engagement by Feature */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Engagement by Feature (Last 30 Days)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Activities</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg per User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.engagementByFeature.map((item) => (
                    <tr key={item.feature}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.feature}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.activeUsers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.totalActivities}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.activeUsers > 0 ? (item.totalActivities / item.activeUsers).toFixed(1) : 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data?.totalUsers > 0 ? ((item.activeUsers / data.totalUsers) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Lifecycle Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Total Users</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.totalUsers}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  Active user base
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Churned Users</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.churnedUsers}
                </div>
                <div className="text-sm text-red-600 mt-1">
                  Deleted accounts
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Reactivated Users</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.reactivatedUsers}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  Returned after deletion
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
