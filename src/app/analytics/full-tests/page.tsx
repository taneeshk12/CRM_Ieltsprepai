'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface FullTestData {
  totalTests: number
  uniqueUsers: number
  avgOverallBand: number
  avgTask1Band: number
  avgTask2Band: number
  bandDistribution: Array<{ band: number; count: number }>
  recentTests: Array<{
    id: string
    userName: string
    email: string
    overallBand: number
    task1Band: number
    task2Band: number
    createdAt: string
  }>
  topUsers: Array<{
    userId: string
    name: string
    email: string
    testCount: number
    avgBand: number
  }>
}

export default function FullTestsPage() {
  const [data, setData] = useState<FullTestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d' | '90d'>('all')
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

        let dateFilter = new Date(0)
        if (timeFilter === '7d') dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        if (timeFilter === '30d') dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        if (timeFilter === '90d') dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

        const { data: tests, error } = await supabase
          .from('user_full_writing_tests')
          .select('*')
          .gte('created_at', dateFilter.toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error

        const totalTests = tests?.length || 0
        const uniqueUsers = new Set(tests?.map(t => t.user_id)).size
        
        const validOverallBands = tests?.filter(t => t.overall_band).map(t => t.overall_band) || []
        const validTask1Bands = tests?.filter(t => t.task1_band).map(t => t.task1_band) || []
        const validTask2Bands = tests?.filter(t => t.task2_band).map(t => t.task2_band) || []

        const avgOverallBand = validOverallBands.length > 0 
          ? validOverallBands.reduce((a, b) => a + b, 0) / validOverallBands.length 
          : 0
        const avgTask1Band = validTask1Bands.length > 0 
          ? validTask1Bands.reduce((a, b) => a + b, 0) / validTask1Bands.length 
          : 0
        const avgTask2Band = validTask2Bands.length > 0 
          ? validTask2Bands.reduce((a, b) => a + b, 0) / validTask2Bands.length 
          : 0

        // Band distribution
        const bandMap = new Map<number, number>()
        validOverallBands.forEach(band => {
          const rounded = Math.round(band * 2) / 2
          bandMap.set(rounded, (bandMap.get(rounded) || 0) + 1)
        })

        const bandDistribution = Array.from(bandMap.entries())
          .map(([band, count]) => ({ band, count }))
          .sort((a, b) => a.band - b.band)

        // Get user details
        const userIds = [...new Set(tests?.map(t => t.user_id).filter(Boolean))] as string[]
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

        const recentTests = tests?.slice(0, 50).map(test => ({
          id: test.id,
          userName: profileMap.get(test.user_id) || userMap.get(test.user_id) || 'Unknown',
          email: userMap.get(test.user_id) || 'Unknown',
          overallBand: test.overall_band || 0,
          task1Band: test.task1_band || 0,
          task2Band: test.task2_band || 0,
          createdAt: test.created_at
        })) || []

        // Top users
        const userTestCount = new Map<string, { count: number; bands: number[] }>()
        tests?.forEach(test => {
          if (!test.user_id) return
          const current = userTestCount.get(test.user_id) || { count: 0, bands: [] }
          userTestCount.set(test.user_id, {
            count: current.count + 1,
            bands: test.overall_band ? [...current.bands, test.overall_band] : current.bands
          })
        })

        const topUsers = Array.from(userTestCount.entries())
          .map(([userId, data]) => ({
            userId,
            name: profileMap.get(userId) || userMap.get(userId) || 'Unknown',
            email: userMap.get(userId) || 'Unknown',
            testCount: data.count,
            avgBand: data.bands.length > 0 ? data.bands.reduce((a, b) => a + b, 0) / data.bands.length : 0
          }))
          .sort((a, b) => b.testCount - a.testCount)
          .slice(0, 20)

        setData({
          totalTests,
          uniqueUsers,
          avgOverallBand,
          avgTask1Band,
          avgTask2Band,
          bandDistribution,
          recentTests,
          topUsers
        })

      } catch (error) {
        console.error('Error fetching full test data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, timeFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading full test analytics...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Full Writing Tests Analytics</h1>
            <div className="flex gap-2">
              {['all', '7d', '30d', '90d'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter as typeof timeFilter)}
                  className={`px-4 py-2 rounded ${timeFilter === filter ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                >
                  {filter === 'all' ? 'All Time' : filter === '7d' ? '7 Days' : filter === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Total Tests</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{data?.totalTests}</div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Unique Users</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{data?.uniqueUsers}</div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Avg Overall Band</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.avgOverallBand.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Avg Task 1</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.avgTask1Band.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Avg Task 2</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.avgTask2Band.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Band Distribution */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Band Distribution</h2>
            <div className="space-y-2">
              {data?.bandDistribution.map((item) => (
                <div key={item.band} className="flex items-center">
                  <div className="w-16 text-sm text-gray-600">Band {item.band}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 mx-2">
                    <div
                      className="bg-red-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{
                        width: `${data.totalTests > 0 ? (item.count / data.totalTests) * 100 : 0}%`
                      }}
                    >
                      {item.count > 0 && (
                        <span className="text-xs text-white font-medium">{item.count}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {((item.count / (data.totalTests || 1)) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Active Test Takers</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Band</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.topUsers.map((user, index) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.testCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.avgBand > 0 ? user.avgBand.toFixed(1) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Tests */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tests</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task 2</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.recentTests.map((test) => (
                    <tr key={test.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(test.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{test.userName}</div>
                        <div className="text-xs text-gray-500">{test.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {test.overallBand > 0 ? test.overallBand.toFixed(1) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.task1Band > 0 ? test.task1Band.toFixed(1) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.task2Band > 0 ? test.task2Band.toFixed(1) : 'N/A'}
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
