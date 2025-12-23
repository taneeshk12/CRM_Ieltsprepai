'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface SpeakingData {
  totalTests: number
  uniqueUsers: number
  avgBand: number
  testsByTopic: Array<{ topic: string; count: number; avgBand: number }>
  recentTests: Array<{
    id: string
    userName: string
    email: string
    topic: string
    band: number
    createdAt: string
  }>
  bandDistribution: Array<{ band: number; count: number }>
}

export default function SpeakingPage() {
  const [data, setData] = useState<SpeakingData | null>(null)
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
          .from('user_speaking')
          .select('*')
          .gte('created_at', dateFilter.toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error

        const totalTests = tests?.length || 0
        const uniqueUsers = new Set(tests?.map(t => t.user_id)).size
        const avgBand = tests && tests.length > 0 
          ? tests.filter(t => t.band).reduce((sum, t) => sum + (t.band || 0), 0) / tests.filter(t => t.band).length 
          : 0

        // Tests by topic
        const topicMap = new Map<string, { count: number; totalBand: number; bandCount: number }>()
        tests?.forEach(test => {
          const topic = test.topic || 'Unknown'
          const current = topicMap.get(topic) || { count: 0, totalBand: 0, bandCount: 0 }
          topicMap.set(topic, {
            count: current.count + 1,
            totalBand: current.totalBand + (test.band || 0),
            bandCount: current.bandCount + (test.band ? 1 : 0)
          })
        })

        const testsByTopic = Array.from(topicMap.entries())
          .map(([topic, data]) => ({
            topic,
            count: data.count,
            avgBand: data.bandCount > 0 ? data.totalBand / data.bandCount : 0
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
          topic: test.topic || 'Unknown',
          band: test.band || 0,
          createdAt: test.created_at
        })) || []

        // Band distribution
        const bandMap = new Map<number, number>()
        tests?.filter(t => t.band).forEach(test => {
          const band = Math.round(test.band * 2) / 2 // Round to nearest 0.5
          bandMap.set(band, (bandMap.get(band) || 0) + 1)
        })

        const bandDistribution = Array.from(bandMap.entries())
          .map(([band, count]) => ({ band, count }))
          .sort((a, b) => a.band - b.band)

        setData({
          totalTests,
          uniqueUsers,
          avgBand,
          testsByTopic,
          recentTests,
          bandDistribution
        })

      } catch (error) {
        console.error('Error fetching speaking data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, timeFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading speaking analytics...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Speaking Tests Analytics</h1>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
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
                <div className="text-sm font-medium text-gray-500">Avg Band</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">
                  {data?.avgBand.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Tests by Topic */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tests by Topic</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Band</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.testsByTopic.map((topic) => (
                    <tr key={topic.topic}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {topic.topic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{topic.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {topic.avgBand.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Band Distribution */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Band Distribution</h2>
            <div className="space-y-2">
              {data?.bandDistribution.map((item) => (
                <div key={item.band} className="flex items-center">
                  <div className="w-16 text-sm text-gray-600">Band {item.band}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 mx-2">
                    <div
                      className="bg-pink-600 h-6 rounded-full flex items-center justify-end pr-2"
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

          {/* Recent Tests */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tests</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Band</th>
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {test.topic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {test.band > 0 ? test.band.toFixed(1) : 'N/A'}
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
