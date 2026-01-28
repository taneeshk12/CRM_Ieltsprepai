'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  // Basic counts
  users: number
  payments: number
  essays: number
  tests: number
  credits: number

  // User analytics
  activeUsers: number
  newUsersToday: number
  newUsersWeek: number
  userRetention: number

  // Revenue analytics
  totalRevenue: number
  avgRevenuePerUser: number
  conversionRate: number

  // Feature usage
  readingTests: number
  speakingTests: number
  trialsUsed: number
  freeAttempts: number

  // Performance metrics
  avgEssayBand: number
  avgTestBand: number
  completionRate: number
}

interface RecentActivity {
  id: string
  type: 'user' | 'payment' | 'essay' | 'test'
  description: string
  timestamp: string
  user?: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    fetchStats()
    fetchRecentActivity()
  }, [router])

  const fetchStats = async () => {
    try {
      // Get current date and time ranges
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Fetch all basic counts and advanced analytics in parallel
      const [
        { count: users },
        { count: payments },
        { count: essays },
        { count: tests },
        creditsData,
        { count: readingTests },
        { count: speakingTests },
        { count: trialsUsed },
        { count: freeAttempts },
        newUsersTodayData,
        newUsersWeekData,
        revenueData,
        essayBandsData,
        testBandsData,
      ] = await Promise.all([
        // Basic counts
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('user_payments').select('*', { count: 'exact', head: true }),
        supabase.from('user_essays').select('*', { count: 'exact', head: true }),
        supabase.from('user_full_writing_tests').select('*', { count: 'exact', head: true }),

        // Credits data
        supabase.from('user_credits').select('credits'),

        // Feature usage counts
        supabase.from('user_reading').select('*', { count: 'exact', head: true }),
        supabase.from('user_speaking').select('*', { count: 'exact', head: true }),
        supabase.from('user_trials').select('*', { count: 'exact', head: true }).neq('is_trial_used', false),
        supabase.from('free_test_attempts').select('*', { count: 'exact', head: true }),

        // User analytics
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),

        // Revenue data - get all payments (we'll filter by status in calculation)
        supabase.from('user_payments').select('amount, status'),

        // Performance data
        supabase.from('user_essays').select('band'),
        supabase.from('user_full_writing_tests').select('overall_band'),

        // Get all users (we'll calculate active users separately)
        supabase.from('users').select('id').eq('is_deleted', false),
      ])

      // Calculate total credits
      const creditsArray = creditsData?.data || []
      const creditsFromTable = creditsArray.reduce((sum: number, credit: { credits: number }) => sum + (credit.credits || 0), 0)
      const usersWithoutCredits = (users || 0) - creditsArray.length
      const totalCredits = creditsFromTable + (usersWithoutCredits * 2)

      // Calculate revenue metrics - properly parse amount and filter by completed status
      const completedPayments = revenueData?.data?.filter((p: { status: string }) => 
        p.status === 'completed' || p.status === 'succeeded' || p.status === 'paid'
      ) || []
      
      const totalRevenue = completedPayments.reduce((sum: number, payment: { amount: string | number }) => {
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
      
      const avgRevenuePerUser = users && users > 0 ? totalRevenue / users : 0
      const conversionRate = users && users > 0 ? ((payments || 0) / users) * 100 : 0

      // Calculate average bands
      const essayBands = essayBandsData?.data?.map((e: any) => parseFloat(e.band)).filter(b => !isNaN(b)) || []
      const testBands = testBandsData?.data?.map((t: any) => t.overall_band).filter(b => !isNaN(b)) || []
      const avgEssayBand = essayBands.length > 0 ? essayBands.reduce((a, b) => a + b, 0) / essayBands.length : 0
      const avgTestBand = testBands.length > 0 ? testBands.reduce((a, b) => a + b, 0) / testBands.length : 0

      // Calculate completion rate (essays + tests completed vs total activities)
      const totalActivities = (essays || 0) + (tests || 0) + (readingTests || 0) + (speakingTests || 0)
      const completionRate = totalActivities > 0 ? ((essays || 0) + (tests || 0)) / totalActivities * 100 : 0

      // Calculate active users (users with activity in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const [
        recentEssays,
        recentTests,
        recentReading,
        recentSpeaking,
        recentUsers
      ] = await Promise.all([
        supabase.from('user_essays').select('user_id').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('user_full_writing_tests').select('user_id').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('user_reading').select('user_id').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('user_speaking').select('user_id').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('users').select('id').gte('created_at', thirtyDaysAgo.toISOString()).eq('is_deleted', false)
      ])

      // Collect unique active user IDs
      const activeUserIds = new Set<string>()
      recentEssays.data?.forEach(e => e.user_id && activeUserIds.add(e.user_id))
      recentTests.data?.forEach(t => t.user_id && activeUserIds.add(t.user_id))
      recentReading.data?.forEach(r => r.user_id && activeUserIds.add(r.user_id))
      recentSpeaking.data?.forEach(s => s.user_id && activeUserIds.add(s.user_id))
      recentUsers.data?.forEach(u => u.id && activeUserIds.add(u.id))

      const activeUsersCount = activeUserIds.size
      const userRetention = users && users > 0 ? (activeUsersCount / users) * 100 : 0

      setStats({
        users: users || 0,
        payments: payments || 0,
        essays: essays || 0,
        tests: tests || 0,
        credits: totalCredits,
        activeUsers: activeUsersCount,
        newUsersToday: newUsersTodayData?.count || 0,
        newUsersWeek: newUsersWeekData?.count || 0,
        userRetention,
        totalRevenue,
        avgRevenuePerUser,
        conversionRate,
        readingTests: readingTests || 0,
        speakingTests: speakingTests || 0,
        trialsUsed: trialsUsed || 0,
        freeAttempts: freeAttempts || 0,
        avgEssayBand,
        avgTestBand,
        completionRate,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent activities from different tables
      const [
        recentUsers,
        recentPayments,
        recentEssays,
        recentTests,
      ] = await Promise.all([
        supabase.from('users').select('id, email, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('user_payments').select('id, amount, created_at, user_id').eq('status', 'completed').order('created_at', { ascending: false }).limit(3),
        supabase.from('user_essays').select('id, created_at, user_id').order('created_at', { ascending: false }).limit(3),
        supabase.from('user_full_writing_tests').select('id, created_at, user_id').order('created_at', { ascending: false }).limit(3),
      ])

      // Get user details for payments, essays, and tests
      const userIds = [
        ...(recentPayments?.data?.map(p => p.user_id) || []),
        ...(recentEssays?.data?.map(e => e.user_id) || []),
        ...(recentTests?.data?.map(t => t.user_id) || []),
      ].filter((id, index, arr) => arr.indexOf(id) === index)

      let userMap = new Map()
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds)

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, name')
          .in('user_id', userIds)

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || [])

        userMap = new Map(
          users?.map(user => [
            user.id,
            {
              email: user.email,
              name: profilesMap.get(user.id)?.name || user.email
            }
          ]) || []
        )
      }

      // Combine all activities
      const activities: RecentActivity[] = []

      recentUsers?.data?.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          description: `New user registered: ${user.email}`,
          timestamp: user.created_at,
        })
      })

      recentPayments?.data?.forEach(payment => {
        const user = userMap.get(payment.user_id)
        activities.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          description: `Payment of ₹${payment.amount} by ${user?.name || user?.email || 'Unknown user'}`,
          timestamp: payment.created_at,
        })
      })

      recentEssays?.data?.forEach(essay => {
        const user = userMap.get(essay.user_id)
        activities.push({
          id: `essay-${essay.id}`,
          type: 'essay',
          description: `Essay submitted by ${user?.name || user?.email || 'Unknown user'}`,
          timestamp: essay.created_at,
        })
      })

      recentTests?.data?.forEach(test => {
        const user = userMap.get(test.user_id)
        activities.push({
          id: `test-${test.id}`,
          type: 'test',
          description: `Full test completed by ${user?.name || user?.email || 'Unknown user'}`,
          timestamp: test.created_at,
        })
      })

      // Sort by timestamp and take top 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setRecentActivity(activities.slice(0, 10))

    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn')
    router.push('/login')
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
            <h1 className="text-3xl font-bold text-gray-900">IELTS Admin Analytics Dashboard</h1>
            <div className="flex gap-4">
              <a
                href="/analytics"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                Advanced Analytics
              </a>
              <a
                href="/blog"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Blog Management
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Key Performance Indicators */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Performance Indicators</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <a href="/analytics/active-users" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">U</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Users
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.users?.toLocaleString()}
                        </dd>
                        <dd className="text-sm text-green-600">
                          +{stats?.newUsersToday} today
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900">
                      View detailed analytics →
                    </span>
                  </div>
                </div>
              </a>

              <a href="/analytics/revenue" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">$</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Revenue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ₹{stats?.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </dd>
                        <dd className="text-sm text-green-600">
                          ₹{stats?.avgRevenuePerUser?.toFixed(2)}/user
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900">
                      View detailed analytics →
                    </span>
                  </div>
                </div>
              </a>

              <a href="/analytics/retention" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">A</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Users
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.activeUsers?.toLocaleString()}
                        </dd>
                        <dd className="text-sm text-green-600">
                          {stats?.userRetention?.toFixed(1)}% retention
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900">
                      View detailed analytics →
                    </span>
                  </div>
                </div>
              </a>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">C</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Conversion Rate
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.conversionRate?.toFixed(1)}%
                        </dd>
                        <dd className="text-sm text-gray-600">
                          {stats?.payments} paying users
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Analytics */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Analytics</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">N</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          New Users (7 days)
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.newUsersWeek?.toLocaleString()}
                        </dd>
                        <dd className="text-sm text-blue-600">
                          {stats?.newUsersToday} today
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-teal-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">R</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          User Retention (30d)
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.userRetention?.toFixed(1)}%
                        </dd>
                        <dd className="text-sm text-gray-600">
                          {stats?.activeUsers} active users
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">E</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Engagement Rate
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.completionRate?.toFixed(1)}%
                        </dd>
                        <dd className="text-sm text-gray-600">
                          Activity completion
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Usage Analytics */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Usage</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <a href="/analytics/essays" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">E</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Essay Writing
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.essays?.toLocaleString()}
                        </dd>
                        <dd className="text-sm text-gray-600">
                          Avg band: {stats?.avgEssayBand?.toFixed(1)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900">
                      View detailed analytics →
                    </span>
                  </div>
                </div>
              </a>

              <a href="/analytics/full-tests" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">T</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Full Tests
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.tests?.toLocaleString()}
                        </dd>
                        <dd className="text-sm text-gray-600">
                          Avg band: {stats?.avgTestBand?.toFixed(1)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900">
                      View detailed analytics →
                    </span>
                  </div>
                </div>
              </a>

              <a href="/analytics/reading" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">R</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Reading Tests
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.readingTests?.toLocaleString()}
                        </dd>
                        <dd className="text-sm text-gray-600">
                          Practice sessions
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900">
                      View detailed analytics →
                    </span>
                  </div>
                </div>
              </a>

              <a href="/analytics/speaking" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">S</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Speaking Tests
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.speakingTests?.toLocaleString()}
                        </dd>
                        <dd className="text-sm text-gray-600">
                          Practice sessions
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900">
                      View detailed analytics →
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Trial and Free Usage */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Trial & Free Usage</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <a href="/analytics/trials" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">T</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Trial Users
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.trialsUsed?.toLocaleString()}
                        </dd>
                        <dd className="text-sm text-gray-600">
                          Trials completed
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900">
                      View detailed analytics →
                    </span>
                  </div>
                </div>
              </a>

              <a href="/analytics/free-attempts" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-teal-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-bold">F</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Free Test Attempts
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats?.freeAttempts?.toLocaleString()}
                        </dd>
                        <dd className="text-sm text-gray-600">
                          IP-based tracking
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-700 hover:text-indigo-900">
                      View detailed analytics →
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {recentActivity.length === 0 ? (
                  <li className="px-6 py-4 text-center text-sm text-gray-500">
                    No recent activity
                  </li>
                ) : (
                  recentActivity.map((activity) => (
                    <li key={activity.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            activity.type === 'user' ? 'bg-blue-500' :
                            activity.type === 'payment' ? 'bg-green-500' :
                            activity.type === 'essay' ? 'bg-yellow-500' :
                            'bg-purple-500'
                          }`}></div>
                          <p className="text-sm text-gray-900">{activity.description}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="/users"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center mr-4">
                    <span className="text-white font-bold">U</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
                    <p className="text-sm text-gray-500">View and manage all users</p>
                  </div>
                </div>
              </a>

              <a
                href="/payments"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-md flex items-center justify-center mr-4">
                    <span className="text-white font-bold">$</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Payments</h3>
                    <p className="text-sm text-gray-500">Monitor revenue and transactions</p>
                  </div>
                </div>
              </a>

              <a
                href="/essays"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-500 rounded-md flex items-center justify-center mr-4">
                    <span className="text-white font-bold">E</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Essays</h3>
                    <p className="text-sm text-gray-500">Review essay submissions</p>
                  </div>
                </div>
              </a>

              <a
                href="/credits"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-md flex items-center justify-center mr-4">
                    <span className="text-white font-bold">C</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Credits</h3>
                    <p className="text-sm text-gray-500">Manage user credits</p>
                  </div>
                </div>
              </a>

              <a
                href="/send-email"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-500 rounded-md flex items-center justify-center mr-4">
                    <span className="text-white font-bold">✉</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Send Emails</h3>
                    <p className="text-sm text-gray-500">Send bulk emails to users</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
