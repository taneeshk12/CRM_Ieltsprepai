'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface ReadingData {
  totalTests: number
  uniqueUsers: number
  avgScore: number
  avgBand: number
  testsByType: Array<{ type: string; count: number; avgScore: number }>
  recentTests: Array<{
    id: string
    userName: string
    email: string
    testType: string
    score: number
    band: number
    timeTaken: number
    createdAt: string
  }>
  scoreDistribution: Array<{ range: string; count: number }>
  bandDistribution: Array<{ band: number; count: number }>
}

export default function ReadingPage() {
  const [data, setData] = useState<ReadingData | null>(null)
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
          .from('user_reading')
          .select('*')
          .gte('created_at', dateFilter.toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error

        const totalTests = tests?.length || 0
        const uniqueUsers = new Set(tests?.map(t => t.user_id)).size
        const avgScore = tests && tests.length > 0 ? tests.reduce((sum, t) => sum + t.score, 0) / tests.length : 0
        const avgBand = tests && tests.length > 0 ? tests.reduce((sum, t) => sum + t.band, 0) / tests.length : 0

        // Tests by type
        const typeMap = new Map<string, { count: number; totalScore: number }>()
        tests?.forEach(test => {
          const current = typeMap.get(test.test_type) || { count: 0, totalScore: 0 }
          typeMap.set(test.test_type, {
            count: current.count + 1,
            totalScore: current.totalScore + test.score
          })
        })

        const testsByType = Array.from(typeMap.entries())
          .map(([type, data]) => ({
            type,
            count: data.count,
            avgScore: data.totalScore / data.count
          }))
          .sort((a, b) => b.count - a.count)

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
          testType: test.test_type,
          score: test.score,
          band: test.band,
          timeTaken: test.time_taken,
          createdAt: test.created_at
        })) || []

        // Score distribution
        const scoreRanges = [
          { range: '0-5', min: 0, max: 5 },
          { range: '6-10', min: 6, max: 10 },
          { range: '11-15', min: 11, max: 15 },
          { range: '16-20', min: 16, max: 20 },
          { range: '21-25', min: 21, max: 25 },
          { range: '26-30', min: 26, max: 30 },
          { range: '31-35', min: 31, max: 35 },
          { range: '36-40', min: 36, max: 40 }
        ]

        const scoreDistribution = scoreRanges.map(range => ({
          range: range.range,
          count: tests?.filter(t => t.score >= range.min && t.score <= range.max).length || 0
        }))

        // Band distribution
        const bandMap = new Map<number, number>()
        tests?.forEach(test => {
          const band = Math.round(test.band * 2) / 2 // Round to nearest 0.5
          bandMap.set(band, (bandMap.get(band) || 0) + 1)
        })

        const bandDistribution = Array.from(bandMap.entries())
          .map(([band, count]) => ({ band, count }))
          .sort((a, b) => a.band - b.band)

        setData({
          totalTests,
          uniqueUsers,
          avgScore,
          avgBand,
          testsByType,
          recentTests,
          scoreDistribution,
          bandDistribution
        })

      } catch (error) {
        console.error('Error fetching reading data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, timeFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading reading analytics...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Reading Tests Analytics</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-4 py-2 rounded ${timeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              >
                All Time
              </button>
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
                <div className="text-sm font-medium text-gray-500">Avg Score</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.avgScore.toFixed(1)}/40
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="text-sm font-medium text-gray-500">Avg Band</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.avgBand.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Tests by Type */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tests by Type</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.testsByType.map((type) => (
                    <tr key={type.type}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {type.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {type.avgScore.toFixed(1)}/40
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Score Distribution</h2>
              <div className="space-y-2">
                {data?.scoreDistribution.map((item) => (
                  <div key={item.range} className="flex items-center">
                    <div className="w-20 text-sm text-gray-600">{item.range}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 mx-2">
                      <div
                        className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${data.totalTests > 0 ? (item.count / data.totalTests) * 100 : 0}%`
                        }}
                      >
                        {item.count > 0 && (
                          <span className="text-xs text-white font-medium">{item.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Band Distribution</h2>
              <div className="space-y-2">
                {data?.bandDistribution.map((item) => (
                  <div key={item.band} className="flex items-center">
                    <div className="w-16 text-sm text-gray-600">Band {item.band}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 mx-2">
                      <div
                        className="bg-green-600 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${data.totalTests > 0 ? (item.count / data.totalTests) * 100 : 0}%`
                        }}
                      >
                        {item.count > 0 && (
                          <span className="text-xs text-white font-medium">{item.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Band</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (min)</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {test.testType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.score}/40
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {test.band.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(test.timeTaken / 60)}
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
