'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface EssayData {
  totalEssays: number
  uniqueUsers: number
  avgBand: number
  essaysByTask: Array<{ task: string; count: number; avgBand: number }>
  bandDistribution: Array<{ band: number; count: number }>
  recentEssays: Array<{
    id: string
    userName: string
    email: string
    task: string
    band: string
    createdAt: string
    wordCount: number
  }>
  topUsers: Array<{
    userId: string
    name: string
    email: string
    essayCount: number
    avgBand: number
  }>
}

export default function EssaysPage() {
  const [data, setData] = useState<EssayData | null>(null)
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

        const { data: essays, error } = await supabase
          .from('user_essays')
          .select('*')
          .gte('created_at', dateFilter.toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error

        const totalEssays = essays?.length || 0
        const uniqueUsers = new Set(essays?.map(e => e.user_id)).size
        
        // Calculate average band
        const bands = essays?.map(e => parseFloat(e.band)).filter(b => !isNaN(b)) || []
        const avgBand = bands.length > 0 ? bands.reduce((a, b) => a + b, 0) / bands.length : 0

        // Essays by task
        const taskMap = new Map<string, { count: number; totalBand: number; bandCount: number }>()
        essays?.forEach(essay => {
          const task = essay.task || 'Unknown'
          const band = parseFloat(essay.band)
          const current = taskMap.get(task) || { count: 0, totalBand: 0, bandCount: 0 }
          taskMap.set(task, {
            count: current.count + 1,
            totalBand: current.totalBand + (isNaN(band) ? 0 : band),
            bandCount: current.bandCount + (isNaN(band) ? 0 : 1)
          })
        })

        const essaysByTask = Array.from(taskMap.entries())
          .map(([task, data]) => ({
            task,
            count: data.count,
            avgBand: data.bandCount > 0 ? data.totalBand / data.bandCount : 0
          }))
          .sort((a, b) => b.count - a.count)

        // Band distribution
        const bandMap = new Map<number, number>()
        bands.forEach(band => {
          const rounded = Math.round(band * 2) / 2 // Round to nearest 0.5
          bandMap.set(rounded, (bandMap.get(rounded) || 0) + 1)
        })

        const bandDistribution = Array.from(bandMap.entries())
          .map(([band, count]) => ({ band, count }))
          .sort((a, b) => a.band - b.band)

        // Get user details
        const userIds = [...new Set(essays?.map(e => e.user_id).filter(Boolean))] as string[]
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

        const recentEssays = essays?.slice(0, 50).map(essay => ({
          id: essay.id.toString(),
          userName: profileMap.get(essay.user_id) || userMap.get(essay.user_id) || 'Unknown',
          email: userMap.get(essay.user_id) || 'Unknown',
          task: essay.task || 'Unknown',
          band: essay.band,
          createdAt: essay.created_at,
          wordCount: essay.essay?.split(/\s+/).length || 0
        })) || []

        // Top users by essay count
        const userEssayCount = new Map<string, { count: number; bands: number[] }>()
        essays?.forEach(essay => {
          if (!essay.user_id) return
          const band = parseFloat(essay.band)
          const current = userEssayCount.get(essay.user_id) || { count: 0, bands: [] }
          userEssayCount.set(essay.user_id, {
            count: current.count + 1,
            bands: isNaN(band) ? current.bands : [...current.bands, band]
          })
        })

        const topUsers = Array.from(userEssayCount.entries())
          .map(([userId, data]) => ({
            userId,
            name: profileMap.get(userId) || userMap.get(userId) || 'Unknown',
            email: userMap.get(userId) || 'Unknown',
            essayCount: data.count,
            avgBand: data.bands.length > 0 ? data.bands.reduce((a, b) => a + b, 0) / data.bands.length : 0
          }))
          .sort((a, b) => b.essayCount - a.essayCount)
          .slice(0, 20)

        setData({
          totalEssays,
          uniqueUsers,
          avgBand,
          essaysByTask,
          bandDistribution,
          recentEssays,
          topUsers
        })

      } catch (error) {
        console.error('Error fetching essay data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, timeFilter])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading essay analytics...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Essay Analytics</h1>
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
                <div className="text-sm font-medium text-gray-500">Total Essays</div>
                <div className="mt-1 text-3xl font-semibold text-gray-900">{data?.totalEssays}</div>
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

          {/* Essays by Task */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Essays by Task Type</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Band</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.essaysByTask.map((task) => (
                    <tr key={task.task}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.task}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.avgBand.toFixed(1)}
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
                      className="bg-orange-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{
                        width: `${data.totalEssays > 0 ? (item.count / data.totalEssays) * 100 : 0}%`
                      }}
                    >
                      {item.count > 0 && (
                        <span className="text-xs text-white font-medium">{item.count}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {((item.count / (data.totalEssays || 1)) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Active Essay Writers</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Essays</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.essayCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.avgBand > 0 ? user.avgBand.toFixed(1) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Essays */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Essays</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Band</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Words</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.recentEssays.map((essay) => (
                    <tr key={essay.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(essay.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{essay.userName}</div>
                        <div className="text-xs text-gray-500">{essay.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{essay.task}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {essay.band}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {essay.wordCount}
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
